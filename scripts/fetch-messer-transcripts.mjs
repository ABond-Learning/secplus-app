// Fetch Professor Messer's SY0-701 video transcripts and cache them locally.
//
// Pipeline:
//   1. Fetch the SY0-701 course index page → extract canonical video URLs
//   2. For each video: fetch page, verify-or-flag (4 checks), save on pass
//   3. Print per-video status table at end
//
// Verify-or-flag rules per video (all four must pass to save):
//   1. HTTP 200 (no follow on cross-version redirects to /sy0-501/)
//   2. Body > 2000 chars
//   3. Selector extracts non-empty content (entry-content div present)
//   4. After chrome filter (Previous/Next nav, paragraphs <30ch),
//      transcript has ≥3 paragraphs and total ≥1000 chars
//
// Idempotent: skip if cached file exists; `--refresh` forces re-fetch.
//
// Usage:
//   node scripts/fetch-messer-transcripts.mjs            # fetch missing only
//   node scripts/fetch-messer-transcripts.mjs --refresh  # re-fetch everything
//   node scripts/fetch-messer-transcripts.mjs --dry      # just plan, no fetch

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { request } from "node:https";
import { setTimeout as sleep } from "node:timers/promises";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const cacheDir = resolve(repo, ".messer-transcripts");
const refresh = process.argv.includes("--refresh");
const dryRun = process.argv.includes("--dry");

const UA = "secplus-app-content-audit/1.0 (study-app, contact: abond@seaford.org)";
const INDEX_URL = "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/";
const FETCH_DELAY_MS = 1500;

// ─── HTTP fetch (no follow on cross-version redirects) ──────────────
function fetchOnce(urlStr) {
  return new Promise((resolveP, rejectP) => {
    const u = new URL(urlStr);
    const req = request({
      method: "GET",
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolveP({
        status: res.statusCode,
        location: res.headers.location || null,
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    req.on("error", rejectP);
    req.end();
  });
}

// Follow up to 3 redirects, but only if they STAY in /sy0-701/.
async function fetchVerified(urlStr) {
  let url = urlStr;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetchOnce(url);
    if (res.status === 200) return { ok: true, url, body: res.body };
    if (res.status >= 300 && res.status < 400 && res.location) {
      const next = new URL(res.location, url).toString();
      if (!next.includes("/sy0-701/")) {
        return { ok: false, reason: `redirect-out-of-sy0-701 (→ ${next.replace("https://www.professormesser.com", "")})`, status: res.status };
      }
      url = next;
      continue;
    }
    return { ok: false, reason: `http-${res.status}`, status: res.status };
  }
  return { ok: false, reason: "too-many-redirects" };
}

// ─── Transcript extraction ──────────────────────────────────────────
function decodeEntities(s) {
  return s
    .replace(/&#8217;/g, "'").replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, "-").replace(/&hellip;/g, "...")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&[a-z#0-9]+;/gi, " ");
}

function extractTranscript(html) {
  const m = html.match(/<div\s[^>]*class="entry-content clear"[^>]*>([\s\S]*?)(?=<footer|<aside|<\/article)/);
  if (!m) return { ok: false, reason: "no-entry-content" };
  let body = m[1]
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/g, "");
  const paras = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) =>
    decodeEntities(x[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
  );
  // Chrome filter: Previous/Next Video links + paragraphs <30 chars
  const isChrome = (p) =>
    /^(<<\s*Previous Video:|Next Video:.*>>|<<\s*Next Video:|Previous Video:.*>>)/i.test(p) ||
    p.length < 30;
  const transcriptParas = paras.filter((p) => !isChrome(p));
  const text = transcriptParas.join("\n\n").trim();
  if (transcriptParas.length < 3) return { ok: false, reason: `too-few-paragraphs (${transcriptParas.length})`, text };
  if (text.length < 1000) return { ok: false, reason: `too-short (${text.length}ch)`, text };
  return { ok: true, paragraphCount: transcriptParas.length, length: text.length, text };
}

// ─── Step 1: Index page → URL list ──────────────────────────────────
async function getVideoList() {
  console.log(`Fetching index: ${INDEX_URL}`);
  const res = await fetchVerified(INDEX_URL);
  if (!res.ok) throw new Error(`Index fetch failed: ${res.reason}`);
  if (res.body.length < 5000) throw new Error(`Index suspiciously short: ${res.body.length} bytes`);
  const m = res.body.match(/<div\s[^>]*class="entry-content clear"[^>]*>([\s\S]*?)(?=<footer|<aside|<\/article)/);
  if (!m) throw new Error("Index: no entry-content found");
  const body = m[1];
  const aRe = /<a\s+(?:[^>]*?\s+)?href=(["']?)([^\s"'>]*sy0-701-video[^\s"'>]*)\1\s*[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Map();
  let mm;
  while ((mm = aRe.exec(body)) !== null) {
    let url = mm[2];
    const raw = mm[3];
    if (/<img\b/i.test(raw)) continue; // skip image-wrapper anchors
    if (url.includes("sy0-701-comptia-security-plus-course")) continue; // skip self-link
    let title = decodeEntities(raw.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (!title) continue;
    if (url.startsWith("/")) url = "https://www.professormesser.com" + url;
    if (!url.endsWith("/")) url = url + "/";
    if (!seen.has(url)) seen.set(url, title.replace(/\s*\(\d+:\d+\)\s*$/, "").trim());
  }
  return [...seen.entries()].map(([url, title]) => ({ url, title }));
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  const videos = await getVideoList();
  console.log(`Index extracted: ${videos.length} videos`);
  if (videos.length < 50 || videos.length > 200) {
    throw new Error(`Index video count (${videos.length}) outside sanity range [50, 200]`);
  }

  // Slug = last URL path segment
  const slugFor = (url) => basename(new URL(url).pathname.replace(/\/$/, ""));

  if (dryRun) {
    console.log("\nDRY RUN — would fetch:");
    for (const v of videos) console.log(`  ${slugFor(v.url).padEnd(60)} ${v.title}`);
    return;
  }

  // Status accumulator
  const status = []; // { slug, title, state, detail }
  let cached = 0, fetched = 0, failed = 0;

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const slug = slugFor(v.url);
    const dest = resolve(cacheDir, `${slug}.txt`);

    if (!refresh && existsSync(dest)) {
      const txt = readFileSync(dest, "utf8");
      status.push({ slug, title: v.title, state: "cached", detail: `${txt.length}ch` });
      cached++;
      process.stdout.write(`[${i + 1}/${videos.length}] cached  ${slug}\n`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${videos.length}] fetching ${slug}... `);
    let fetched_res;
    try {
      fetched_res = await fetchVerified(v.url);
    } catch (e) {
      status.push({ slug, title: v.title, state: "fetch-failed", detail: `error: ${e.message}` });
      failed++;
      console.log(`FAIL (${e.message})`);
      await sleep(FETCH_DELAY_MS);
      continue;
    }

    // Check 1: HTTP 200 (with sy0-701 redirect-stay enforced)
    if (!fetched_res.ok) {
      status.push({ slug, title: v.title, state: "fetch-failed", detail: fetched_res.reason });
      failed++;
      console.log(`FAIL (${fetched_res.reason})`);
      await sleep(FETCH_DELAY_MS);
      continue;
    }

    // Check 2: body > 2000 chars
    if (fetched_res.body.length < 2000) {
      status.push({ slug, title: v.title, state: "suspiciously-short", detail: `${fetched_res.body.length} bytes` });
      failed++;
      console.log(`FAIL (suspiciously-short ${fetched_res.body.length}b)`);
      await sleep(FETCH_DELAY_MS);
      continue;
    }

    // Checks 3+4: extraction yields enough content
    const ext = extractTranscript(fetched_res.body);
    if (!ext.ok) {
      status.push({ slug, title: v.title, state: "extraction-failed", detail: ext.reason });
      failed++;
      console.log(`FAIL (extraction: ${ext.reason})`);
      await sleep(FETCH_DELAY_MS);
      continue;
    }

    // Save
    const header = `# ${v.title}\n# Source: ${v.url}\n# Fetched: ${new Date().toISOString()}\n# Paragraphs: ${ext.paragraphCount}, Length: ${ext.length}ch\n\n`;
    writeFileSync(dest, header + ext.text + "\n", "utf8");
    status.push({ slug, title: v.title, state: "OK", detail: `${ext.length}ch / ${ext.paragraphCount}p` });
    fetched++;
    console.log(`OK (${ext.length}ch / ${ext.paragraphCount}p)`);

    await sleep(FETCH_DELAY_MS);
  }

  // ─── Status report ─────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log(`Fetched ${fetched}, cached ${cached}, failed ${failed}, total ${videos.length}`);
  console.log("=".repeat(70));

  // By state
  const byState = {};
  for (const s of status) byState[s.state] = (byState[s.state] || 0) + 1;
  console.log("\nBy state:");
  for (const [state, n] of Object.entries(byState).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(4)}  ${state}`);
  }

  if (failed > 0) {
    console.log("\nFailures (full list):");
    for (const s of status.filter((x) => x.state !== "OK" && x.state !== "cached")) {
      console.log(`  ${s.state.padEnd(20)}  ${s.slug.padEnd(50)}  ${s.detail}`);
    }
  }

  // Write structured status to disk for downstream audits
  const statusPath = resolve(cacheDir, "_fetch-status.json");
  writeFileSync(statusPath, JSON.stringify({ runAt: new Date().toISOString(), totals: byState, items: status }, null, 2), "utf8");
  console.log(`\nStatus written to ${statusPath}`);
}

main().catch((e) => {
  console.error("\nFATAL:", e.message);
  process.exit(1);
});
