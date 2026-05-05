// Audit which discrete concepts each Messer transcript introduces, then check
// whether the question catalogue has a recall-style anchor question for each.
//
// "Recall-style" = stem matches a definitional pattern; BEST/MOST scenarios that
// USE the concept don't count as recall-anchors.
//
// Per-video pre-checks (skip-and-flag):
//   - transcript file exists
//   - transcript >2000 chars
//   - ≥5 paragraphs after chrome filter
//
// Output:
//   - Skipped videos with reason
//   - Per-video concept inventory
//   - Per-concept coverage status (anchored / unanchored)
//   - Per-sub-objective anchor-gap count
//   - Sample of unanchored concepts
//
// Usage:
//   node scripts/audit-anchor-gaps.mjs --domain=1
//   node scripts/audit-anchor-gaps.mjs --domain=1 --details

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const cacheDir = resolve(repo, ".messer-transcripts");

const args = process.argv.slice(2);
const domainArg = args.find((a) => a.startsWith("--domain="))?.split("=")[1];
const showDetails = args.includes("--details");
if (!domainArg) {
  console.error("Usage: --domain=N (1-5)");
  process.exit(2);
}
const targetDomain = domainArg.toString();

// ─── MESSER_VIDEOS.md → section + slug map ────────────────────────
const messerMd = readFileSync(resolve(repo, "MESSER_VIDEOS.md"), "utf8");
const videosBySection = []; // [{ section, title, slug }]
let curSec = null;
for (const line of messerMd.split("\n")) {
  const sec = line.match(/^### (\d+\.\d+)\s+[–-]\s+(.+)$/);
  if (sec) { curSec = sec[1]; continue; }
  const vid = line.match(/^-\s+(.+)$/);
  if (vid && curSec) {
    const title = vid[1].trim();
    const slug = title.toLowerCase()
      .replace(/[,'']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + "-sy0-701";
    videosBySection.push({ section: curSec, title, slug });
  }
}

// ─── Concept extraction from transcript prose ─────────────────────
// Strategy: high-precision patterns first, then loose noun-phrase extraction.
function extractConcepts(text) {
  const concepts = new Map(); // normalized form → { display, evidence, source }
  const add = (display, source, evidence) => {
    const norm = display.toLowerCase().trim();
    if (norm.length < 3 || norm.length > 60) return;
    if (!concepts.has(norm)) concepts.set(norm, { display: display.trim(), source, evidence: evidence.slice(0, 100) });
  };

  // Pattern 1: "Acronym, or Acronym/AnotherForm" reads like Messer's expansions
  // "X (ACR)" — capture both X and ACR
  const parenAcrRe = /([A-Z][A-Za-z0-9\-\s]{4,40})\s*\(([A-Z][A-Z0-9]{1,6})\)/g;
  let m;
  while ((m = parenAcrRe.exec(text)) !== null) {
    add(m[1], "paren-acronym", m[0]);
    add(m[2], "paren-acronym", m[0]);
  }

  // Pattern 2: "ACR (Expansion)" — acronym before, expansion in parens
  const acrParenRe = /\b([A-Z][A-Z0-9]{1,6})\s*\(([^)]{6,80}?)\)/g;
  while ((m = acrParenRe.exec(text)) !== null) {
    add(m[1], "acr-paren", m[0]);
    add(m[2], "acr-paren", m[0]);
  }

  // Pattern 3: Definitional sentences "X is/are/refers to..."
  // Capture: capitalized term (1-4 words) + linking verb
  const defRe = /(?:^|\.\s+|\n)\s*(?:The\s+|A\s+|An\s+)?([A-Z][a-zA-Z0-9\-]{2,}(?:\s+[a-zA-Z0-9\-]{2,}){0,4})\s+(?:is|are|refers to|means|describes|allows|provides)\b/g;
  while ((m = defRe.exec(text)) !== null) {
    add(m[1], "definitional", m[0]);
  }

  // Pattern 4: "use X to" / "X to provide" capability framing
  const useRe = /\b(?:use|using|deploy|implement)\s+(?:a\s+|an\s+|the\s+)?([A-Z][A-Za-z0-9\-]{3,}(?:\s+[a-zA-Z]{2,}){0,3})\s+to\s+/g;
  while ((m = useRe.exec(text)) !== null) {
    add(m[1], "use-to", m[0]);
  }

  // Pattern 5: List items — "...such as X, Y, or Z" / "examples include X, Y, Z"
  const listRe = /(?:such as|examples include|for example,|like)\s+([A-Z][a-zA-Z0-9\s\-,]+?)(?:\.|;|\n)/g;
  while ((m = listRe.exec(text)) !== null) {
    const items = m[1].split(/,\s*|\s+(?:and|or)\s+/);
    for (const item of items) {
      const trimmed = item.trim().replace(/^(?:and|or)\s+/i, "");
      if (trimmed.length >= 3 && trimmed.length <= 50 && /^[A-Z]/.test(trimmed)) {
        add(trimmed, "list-item", m[0]);
      }
    }
  }

  return [...concepts.values()];
}

// ─── Recall-style stem matcher ────────────────────────────────────
const RECALL_PATTERNS = [
  /^What (?:is|are)\s+(?:a |an |the )?(.+?)\?/i,
  /^Which BEST (?:defines?|describes?|captures?)\s+(?:a |an |the )?(.+?)\?/i,
  /^Which (?:of the following )?(?:BEST )?(?:defines|describes)\s+(?:a |an |the )?(.+?)\?/i,
  /^(.+?)\s+is BEST (?:defined|described)\s+as/i,
];

function isRecallAboutConcept(stem, conceptNorm) {
  for (const p of RECALL_PATTERNS) {
    const m = stem.match(p);
    if (!m) continue;
    const subject = m[1].toLowerCase();
    if (subject.includes(conceptNorm) || conceptNorm.includes(subject)) return true;
  }
  return false;
}

// ─── Build catalog index by sub-objective ─────────────────────────
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));
const subToQuestions = new Map(); // "X.Y.Z" → [{ kind, idx, q, opts, a }]
for (const sec of data) {
  if (!sec.id) continue;
  for (const v of sec.videos) {
    const arr = [];
    (v.questions || []).forEach((q, i) => arr.push({ kind: "mc", idx: i, q: q.q || "", opts: q.opts || [], a: q.a }));
    (v.scenarios || []).forEach((q, i) => arr.push({ kind: "scen", idx: i, q: q.q || "", opts: q.opts || [], a: q.a }));
    subToQuestions.set(v.id, arr);
  }
}

// ─── Main: per-video for the target domain ────────────────────────
const skipped = []; // { sub, slug, reason }
const perVideo = []; // { sub, slug, title, total, anchored, unanchored: [{display, source}] }

const videos = videosBySection.filter((v) => v.section.startsWith(targetDomain + "."));

for (const v of videos) {
  const txtPath = resolve(cacheDir, `${v.slug}.txt`);
  if (!existsSync(txtPath)) { skipped.push({ sub: v.section, slug: v.slug, reason: "no-transcript" }); continue; }
  const txt = readFileSync(txtPath, "utf8");
  if (txt.length < 2000) { skipped.push({ sub: v.section, slug: v.slug, reason: `bad-transcript (${txt.length}ch)` }); continue; }
  // Drop the header lines we wrote at fetch time
  const body = txt.replace(/^# .*?\n(?:# .*?\n)*\n/, "");
  const paras = body.split(/\n\n+/).filter((p) => p.trim().length >= 30);
  if (paras.length < 5) { skipped.push({ sub: v.section, slug: v.slug, reason: `too-few-paragraphs (${paras.length})` }); continue; }

  const concepts = extractConcepts(body);

  // For each concept, look for a recall-style question in the corresponding sub-objective.
  // Sub-objective videos are nested under the section; the sub-objective ID is a numeric like 1.1.1.
  // The MESSER_VIDEOS.md only carries section IDs (e.g. 1.1), so we need to look for ANY sub-objective under that section.
  const subQuestions = [];
  for (const [subId, qs] of subToQuestions) {
    if (subId.startsWith(v.section + ".")) subQuestions.push(...qs);
  }

  const unanchored = [];
  let anchored = 0;
  for (const c of concepts) {
    const norm = c.display.toLowerCase().trim();
    const hasAnchor = subQuestions.some((q) => isRecallAboutConcept(q.q, norm));
    if (hasAnchor) anchored++;
    else unanchored.push(c);
  }

  perVideo.push({
    sub: v.section,
    slug: v.slug,
    title: v.title,
    total: concepts.length,
    anchored,
    unanchored,
  });
}

// ─── Report ────────────────────────────────────────────────────────
console.log(`\nDomain ${targetDomain} anchor-gap audit`);
console.log("═".repeat(70));
console.log(`Videos in domain (per MESSER_VIDEOS.md): ${videos.length}`);
console.log(`  Skipped (pre-check fail): ${skipped.length}`);
console.log(`  Audited:                  ${perVideo.length}`);

if (skipped.length > 0) {
  console.log("\nSkipped videos:");
  for (const s of skipped) console.log(`  §${s.sub}  ${s.slug}  ${s.reason}`);
}

const totalConcepts = perVideo.reduce((a, v) => a + v.total, 0);
const totalAnchored = perVideo.reduce((a, v) => a + v.anchored, 0);
const totalGap = totalConcepts - totalAnchored;
console.log("\nConcept totals:");
console.log(`  Total concepts extracted: ${totalConcepts}`);
console.log(`  Anchored:                 ${totalAnchored}`);
console.log(`  Unanchored (gaps):        ${totalGap}`);

console.log("\nPer-sub-objective gap count:");
const bySec = {};
for (const v of perVideo) {
  bySec[v.sub] = bySec[v.sub] || { videos: 0, total: 0, anchored: 0, gap: 0 };
  bySec[v.sub].videos++;
  bySec[v.sub].total += v.total;
  bySec[v.sub].anchored += v.anchored;
  bySec[v.sub].gap += v.unanchored.length;
}
console.log("  §X.Y    | videos | concepts | anchored | gap");
for (const sub of Object.keys(bySec).sort()) {
  const s = bySec[sub];
  console.log(`  §${sub.padEnd(6)} |   ${s.videos.toString().padStart(2)}   |    ${s.total.toString().padStart(3)}   |    ${s.anchored.toString().padStart(3)}   |  ${s.gap.toString().padStart(3)}`);
}

if (showDetails) {
  console.log("\nPer-video concept inventory (full):");
  for (const v of perVideo) {
    console.log(`\n--- §${v.sub}  ${v.title}  (${v.total} concepts; ${v.anchored} anchored, ${v.unanchored.length} gap) ---`);
    if (v.unanchored.length > 0) {
      console.log("  Unanchored:");
      for (const c of v.unanchored) console.log(`    [${c.source}] ${c.display}`);
    }
  }
} else {
  console.log("\nSample of 10 unanchored concepts (for spot-check):");
  const allUnanchored = [];
  for (const v of perVideo) for (const c of v.unanchored) allUnanchored.push({ video: v.title, slug: v.slug, c });
  for (const u of allUnanchored.slice(0, 10)) {
    console.log(`  [${u.c.source.padEnd(14)}] "${u.c.display}"  in video: ${u.video}`);
  }
}
