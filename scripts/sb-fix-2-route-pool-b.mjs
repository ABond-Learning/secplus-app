// SB-fix-2 routing script — pre-step for Pool B orphan SB1.6 loose flags.
//
// Reads .audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json,
// filters items with sb16_action="flag-for-review" that are NOT already
// flagged in catalogue audit_d_review.sb16_candidate. For each item:
//
//   1. Extracts search needles from the item content (term/answer/q).
//   2. Greps needles against the cited Messer transcript, parent transcript,
//      and corpus-wide.
//   3. Emits a routing recommendation:
//        - partial-depth                : cited umbrella present; specific term absent
//        - messer-curriculum-gap        : term absent corpus-wide
//        - not-sb16                     : term actually in cited transcript (LLM miss)
//        - partial-adjacent-not-sb16    : term in another video — belongs elsewhere
//
// Output: .audit-working/sb-fix-2/packet-R.md + packet-R.json (single routing packet).
//
// Methodology mirrors scripts/sb-fix-1b-cluster-verify.mjs — supervisor reviews
// grep evidence inline and assigns final routing. CC's recommendation is a
// starting point per cadence Rule 3.
//
// Self-test (--selftest) exercises classification logic against synthetic
// transcript states.
//
// Usage:
//   node scripts/sb-fix-2-route-pool-b.mjs
//   node scripts/sb-fix-2-route-pool-b.mjs --selftest

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

const VERDICTS = resolve(repo, ".audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json");
const QUESTIONS = resolve(repo, "questions.json");
const TRANSCRIPTS_DIR = resolve(repo, ".messer-transcripts");
const MESSER_MD = resolve(repo, "MESSER_VIDEOS.md");
const OUT_DIR = resolve(repo, ".audit-working/sb-fix-2");
const OUT_MD = resolve(OUT_DIR, "packet-R.md");
const OUT_JSON = resolve(OUT_DIR, "packet-R.json");

// ─── CLI ──────────────────────────────────────────────────────────────
function parseArgs() {
  const out = { selftest: false };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--selftest") out.selftest = true;
  }
  return out;
}

// ─── Citation → slug map (per audit-video-grounding.mjs precedent) ────
function buildCitationToSlug() {
  const map = new Map();
  const md = readFileSync(MESSER_MD, "utf8");
  let curSec = null;
  for (const line of md.split("\n")) {
    const sec = line.match(/^### (\d+\.\d+)\s+[–-]\s+(.+)$/);
    if (sec) { curSec = sec[1]; continue; }
    const vid = line.match(/^-\s+(.+)$/);
    if (vid && curSec) {
      const title = vid[1].trim();
      const cite = `${curSec} - ${title}`;
      const slug = title.toLowerCase()
        .replace(/[,'']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + "-sy0-701";
      map.set(cite, slug);
    }
  }
  return map;
}

function loadTranscriptFor(citationOrSlug, citationToSlug) {
  const slug = citationToSlug.get(citationOrSlug) || citationOrSlug;
  const p = resolve(TRANSCRIPTS_DIR, `${slug}.txt`);
  if (!existsSync(p)) return null;
  try { return readFileSync(p, "utf8"); }
  catch { return null; }
}

// ─── Item resolution ──────────────────────────────────────────────────
function findItem(questions, section, video, type, index) {
  const sec = questions.find(s => s.id === section);
  if (!sec) return null;
  const vid = sec.videos.find(v => v.id === video);
  if (!vid) return null;
  const arr =
    type === "mc"   ? vid.questions :
    type === "scen" ? vid.scenarios :
    type === "match"? vid.matching  :
    type === "cram" ? vid.cram      : null;
  if (!arr) return null;
  return { item: arr[index] || null, parentVideoTitle: vid.title };
}

const STOPWORDS = new Set([
  "a","an","the","of","in","on","at","by","to","for","with","or","and",
  "is","are","be","that","this","which","when","where","what","how",
]);

// All-caps stopwords for the acronym extractor — BEST/MOST/NOT framing
// words slip through `[A-Z]{2,6}` but are grep noise (appear thousands of
// times in transcripts). Filter them out before adding as needles.
const ACRONYM_STOPWORDS = new Set([
  "BEST","MOST","LEAST","NOT","ALL","ANY","AND","OR","IF","IS","ARE","BE",
  "WHO","WHAT","WHEN","WHERE","WHY","HOW","TRUE","FALSE","YES","NO",
  "MAY","CAN","DOES","WILL","HAS","HAVE","WAS","WERE","ITS","THEY",
  "ONLY","EACH","ONE","TWO","FROM","INTO","ALSO","BUT","SUCH","BOTH",
]);

export function needlesFor(item, type) {
  const needles = [];
  let primary;
  if (type === "match") primary = item.answer;
  else if (type === "cram") primary = item.term;
  else primary = (item.q || "").slice(0, 120);
  primary = (primary || "").trim();
  if (primary) needles.push(primary);
  // Core phrase (strip parenthetical clarifications)
  const stripped = primary.replace(/\([^)]*\)/g, "").split(/\s+[-—–]\s+/)[0].trim();
  if (stripped && stripped.toLowerCase() !== primary.toLowerCase()) needles.push(stripped);
  // Longest non-stopword run
  const tokens = primary.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const runs = [];
  let cur = [];
  for (const t of tokens) {
    if (STOPWORDS.has(t)) { if (cur.length >= 2) runs.push(cur.join(" ")); cur = []; }
    else cur.push(t);
  }
  if (cur.length >= 2) runs.push(cur.join(" "));
  runs.sort((a, b) => b.length - a.length);
  if (runs[0]) needles.push(runs[0]);

  // ─── mc/scen augmentation (Task 1.1 / 2026-05-23) ─────────────────
  // Full question text rarely greps a transcript; the tested CONCEPT does.
  // Per findings/sb-fix-2-classifier-improvements.md (R packet showed 56%
  // divergence): augment with acronyms, quoted substrings, last-clause
  // noun phrases drawn from the q text.
  if (type === "mc" || type === "scen") {
    const qText = (item.q || "");

    // (a) Capitalised acronyms (2-6 chars; optional hyphen extension):
    //     "HMAC", "HSTS", "MAM", "SD-WAN", "WPA2", "MTD".
    //     ACRONYM_STOPWORDS filters BEST/MOST/NOT framing noise.
    for (const m of qText.matchAll(/\b[A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9]{2,6})?\b/g)) {
      if (!ACRONYM_STOPWORDS.has(m[0])) needles.push(m[0]);
    }

    // (b) Quoted substrings (straight + curly, 2-80 chars). Rare but the
    //     authoring convention sometimes quotes the tested term.
    for (const m of qText.matchAll(/"([^"]{2,80})"|“([^”]{2,80})”|'([^']{2,80})'/g)) {
      const captured = (m[1] || m[2] || m[3] || "").trim();
      if (captured) needles.push(captured);
    }

    // (c) Last-clause noun phrase (last 1-3 non-stopword tokens before
    //     each '?'). "What is MAM?" → "MAM"; "Which prevents X?" → ignored
    //     because final token is stopword. Acronym extractor catches MAM
    //     too; this is belt-and-braces for non-acronym terminal nouns.
    for (const part of qText.split("?")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const ptokens = trimmed.split(/\s+/);
      const tail = [];
      for (let i = ptokens.length - 1; i >= 0 && tail.length < 3; i--) {
        const cleaned = ptokens[i].replace(/[^A-Za-z0-9-]/g, "");
        if (!cleaned) continue;
        if (STOPWORDS.has(cleaned.toLowerCase())) break;
        tail.unshift(cleaned);
      }
      if (tail.length >= 1) needles.push(tail.join(" "));
    }
  }

  // Dedupe (case-insensitive)
  const seen = new Set();
  return needles.filter(n => {
    const k = n.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function countMatches(text, needle) {
  if (!text || !needle) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (text.match(re) || []).length;
}

// ─── Classification ───────────────────────────────────────────────────
//
// Decision tree (mirror of sb-fix-1b-cluster-verify.mjs):
//   cited has hits        → not-sb16 (LLM miss)
//   else corpus hits      → partial-adjacent-not-sb16 (belongs in named hit videos)
//   else corpus empty     → messer-curriculum-gap
// `partial-depth` recommendation requires supervisor judgment — CC's grep
// can't infer "umbrella subsumes specific" without semantic reasoning.
// We emit partial-depth as a candidate label when the parent video is
// arguably an umbrella concept. CC's recommendation is advisory.
//
// (In production usage, supervisor reads grep evidence + decides; CC just
// surfaces the four options + grep counts inline.)

export function classifyItem({ citedHits, anyCorpusHits, corpusHitFiles, citedVideoIsBroadUmbrella }) {
  if (citedHits > 0) {
    return { label: "not-sb16", rationale: `Cited transcript has ${citedHits} hit(s) for the term; LLM's out-of-source flag was likely a miss. Recommend marking kept-as-is in catalogue with note.` };
  }
  if (anyCorpusHits > 0) {
    return {
      label: "partial-adjacent-not-sb16",
      rationale: `Term absent from cited transcript but present in ${anyCorpusHits} hit(s) across ${corpusHitFiles.length} other transcript(s). Concept belongs in: ${corpusHitFiles.slice(0, 3).join(", ")}${corpusHitFiles.length > 3 ? ", …" : ""}. Recommend feeding into D1/D3/D4/D5 partial-adjacent fix pass (out of SB-fix-2 scope).`,
    };
  }
  // Corpus-wide miss — either partial-depth (if cited is umbrella) or curriculum-gap
  if (citedVideoIsBroadUmbrella) {
    return { label: "partial-depth", rationale: "Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path." };
  }
  return { label: "messer-curriculum-gap", rationale: "Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path." };
}

// Heuristic: which cited videos are likely "broad umbrellas" (large category videos)?
// Generic predicate: if the parent video title contains generic-umbrella words.
// (CC's advisory label — supervisor adjudicates.)
function looksLikeUmbrellaTitle(title) {
  if (!title) return false;
  const t = title.toLowerCase();
  const umbrellaWords = ["overview", "introduction", "fundamentals", "concepts", "attacks", "techniques", "vulnerabilities", "security", "controls"];
  return umbrellaWords.some(w => t.includes(w));
}

// ─── Main ─────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs();
  if (args.selftest) { selftest(); return; }

  const verdictsBlob = JSON.parse(readFileSync(VERDICTS, "utf8"));
  const verdicts = verdictsBlob.verdicts;
  const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
  const citationToSlug = buildCitationToSlug();

  // Pool B = sb16_action="flag-for-review" AND NOT already audit_d_review.sb16_candidate
  // (verified zero overlap in scoping; included as belt-and-braces)
  const catalogueKeys = new Set();
  for (const sec of questions) for (const vid of sec.videos) {
    for (const [arr, type] of [[vid.questions,"mc"],[vid.scenarios,"scen"],[vid.matching,"match"],[vid.cram,"cram"]]) {
      arr?.forEach((it, idx) => {
        if (it?.audit_d_review?.sb16_candidate === true) catalogueKeys.add(`${sec.id}|${vid.id}|${type}|${idx}`);
      });
    }
  }

  const poolB = verdicts.filter(r =>
    r.sb16_action === "flag-for-review" &&
    !catalogueKeys.has(`${r.location.section}|${r.location.video}|${r.location.type}|${r.location.index}`)
  );

  console.log(`Pool B size: ${poolB.length}`);
  if (poolB.length === 0) {
    console.error("No Pool B items found — verify verdicts file path and sb16_action filter.");
    process.exit(1);
  }

  // Preload all transcripts for corpus-wide grep
  const transcriptFiles = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith(".txt"));

  const results = [];
  for (const v of poolB) {
    const loc = v.location;
    const located = findItem(questions, loc.section, loc.video, loc.type, loc.index);
    if (!located || !located.item) {
      results.push({ location: loc, error: "item not found" });
      continue;
    }
    const item = located.item;
    const parentTitle = located.parentVideoTitle;
    const citedCite = `${loc.section} - ${parentTitle}`;
    const citedTranscript = loadTranscriptFor(citedCite, citationToSlug);
    const needles = needlesFor(item, loc.type);

    // Grep counts
    let citedHits = 0;
    for (const n of needles) {
      if (citedTranscript) citedHits += countMatches(citedTranscript, n);
    }

    // Corpus-wide grep (skip the cited transcript to count "other" hits)
    let anyCorpusHits = 0;
    const corpusHitFiles = [];
    const citedSlug = citationToSlug.get(citedCite);
    for (const f of transcriptFiles) {
      if (f === `${citedSlug}.txt`) continue;
      const txt = readFileSync(resolve(TRANSCRIPTS_DIR, f), "utf8");
      let fileHits = 0;
      for (const n of needles) fileHits += countMatches(txt, n);
      if (fileHits > 0) {
        anyCorpusHits += fileHits;
        corpusHitFiles.push(`${f.replace(/-sy0-701\.txt$/, "")} (×${fileHits})`);
      }
    }
    corpusHitFiles.sort((a, b) => {
      const am = a.match(/×(\d+)/), bm = b.match(/×(\d+)/);
      return (bm ? Number(bm[1]) : 0) - (am ? Number(am[1]) : 0);
    });

    const classification = classifyItem({
      citedHits,
      anyCorpusHits,
      corpusHitFiles,
      citedVideoIsBroadUmbrella: looksLikeUmbrellaTitle(parentTitle),
    });

    results.push({
      location: loc,
      parent_video_title: parentTitle,
      cited_citation: citedCite,
      item_summary: loc.type === "match" ? `${item.prompt} → ${item.answer}` : loc.type === "cram" ? `${item.term}` : (item.q || "").slice(0, 80),
      needles,
      cited_hits: citedHits,
      corpus_hits_total: anyCorpusHits,
      corpus_hit_files: corpusHitFiles.slice(0, 8),
      cc_recommended_routing: classification.label,
      cc_rationale: classification.rationale,
    });
  }

  // Render
  mkdirSync(OUT_DIR, { recursive: true });

  const lines = [];
  lines.push(`# SB-fix-2 packet R — Pool B routing pre-step`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Pool B (orphan SB1.6 loose flags, no \`audit_d_review.sb16_candidate\` in catalogue): ${poolB.length} items`);
  lines.push("");
  lines.push("## How to review");
  lines.push("");
  lines.push("For each item: CC has greped the item's specific term against the cited transcript + corpus-wide, then surfaced a recommended routing. Supervisor reviews + adjudicates final routing per the decision tree:");
  lines.push("");
  lines.push("- `partial-depth` — cited video umbrella subsumes the tested specific; route to SB-fix-2 P");
  lines.push("- `messer-curriculum-gap` — term absent corpus-wide AND cited isn't natural umbrella; route to SB-fix-2 G");
  lines.push("- `not-sb16` — cited transcript actually has the term; mark catalogue kept-as-is");
  lines.push("- `partial-adjacent-not-sb16` — term is in a different Messer video; defer to D1/D3/D4/D5 cleanup");
  lines.push("");
  lines.push("After supervisor records routings, CC runs `scripts/sb-fix-2-backfill-pool-b.mjs` to write the routings into `questions.json` audit fields.");
  lines.push("");
  lines.push("---");
  lines.push("");
  results.forEach((r, n) => {
    const i = n + 1;
    const l = r.location;
    lines.push(`### Item ${i}. §${l.section} ${l.video} ${l.type}[${l.index}]`);
    lines.push("");
    if (r.error) {
      lines.push(`**ERROR:** ${r.error}`);
      lines.push("");
      return;
    }
    lines.push(`**Cited:** ${r.cited_citation}`);
    lines.push(`**Item:** \`${r.item_summary}\``);
    lines.push(`**Needles:** ${r.needles.map(x => `\`${x}\``).join(", ")}`);
    lines.push("");
    lines.push(`**Grep:** cited=${r.cited_hits}, corpus-other=${r.corpus_hits_total} (top files: ${r.corpus_hit_files.length === 0 ? "(none)" : r.corpus_hit_files.join(", ")})`);
    lines.push("");
    lines.push(`**CC recommended routing:** \`${r.cc_recommended_routing}\``);
    lines.push(`**Rationale:** ${r.cc_rationale}`);
    lines.push("");
    lines.push("**Supervisor final routing** (mark one):");
    lines.push("- [ ] partial-depth");
    lines.push("- [ ] messer-curriculum-gap");
    lines.push("- [ ] not-sb16");
    lines.push("- [ ] partial-adjacent-not-sb16");
    lines.push("");
    lines.push("---");
    lines.push("");
  });
  lines.push("## Summary by recommended routing");
  lines.push("");
  const counts = {};
  for (const r of results) {
    if (r.cc_recommended_routing) counts[r.cc_recommended_routing] = (counts[r.cc_recommended_routing] || 0) + 1;
  }
  for (const [k, v] of Object.entries(counts).sort()) lines.push(`- ${k}: ${v}`);

  writeFileSync(OUT_MD, lines.join("\n"));
  writeFileSync(OUT_JSON, JSON.stringify({ generated_at: new Date().toISOString(), pool_size: poolB.length, results }, null, 2));
  console.log(`Wrote ${OUT_MD}`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log("Recommended routing summary:");
  for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k}: ${v}`);
}

// ─── Self-test ────────────────────────────────────────────────────────
function selftest() {
  console.log("=== sb-fix-2-route-pool-b --selftest ===");

  // Needles — match + cram (unchanged baseline)
  const n1 = needlesFor({ term: "HMAC", def: "..." }, "cram");
  if (!n1.includes("HMAC")) throw new Error(`needles cram: missing 'HMAC' got ${JSON.stringify(n1)}`);
  const n2 = needlesFor({ prompt: "Defensive technique", answer: "Cable lock" }, "match");
  if (!n2.includes("Cable lock")) throw new Error(`needles match: missing 'Cable lock' got ${JSON.stringify(n2)}`);

  // ─── Needles — mc/scen augmentation (Task 1.1) ─────────────────────
  // (a) Acronym extractor: catches 2-6 char all-caps + hyphen extensions
  const a1 = needlesFor({ q: "Why does HMAC NOT provide non-repudiation?" }, "mc");
  if (!a1.includes("HMAC")) throw new Error(`acronym: missing 'HMAC' got ${JSON.stringify(a1)}`);
  // ACRONYM_STOPWORDS filters BEST/MOST/NOT noise
  if (a1.includes("NOT")) throw new Error(`acronym stopword: 'NOT' should be filtered, got ${JSON.stringify(a1)}`);

  // Multi-acronym + hyphenated
  const a2 = needlesFor({ q: "Which describes SD-WAN advantages over MPLS WAN?" }, "scen");
  if (!a2.includes("SD-WAN")) throw new Error(`acronym hyphen: missing 'SD-WAN' got ${JSON.stringify(a2)}`);
  if (!a2.includes("MPLS")) throw new Error(`acronym multi: missing 'MPLS' got ${JSON.stringify(a2)}`);
  if (!a2.includes("WAN")) throw new Error(`acronym multi: missing 'WAN' got ${JSON.stringify(a2)}`);

  // Acronym with digit (WPA2)
  const a3 = needlesFor({ q: "Compare WPA2 Personal and WPA2 Enterprise." }, "mc");
  if (!a3.includes("WPA2")) throw new Error(`acronym digit: missing 'WPA2' got ${JSON.stringify(a3)}`);

  // BEST/MOST framing — verify ACRONYM_STOPWORDS list works
  const a4 = needlesFor({ q: "Which control is BEST for MFA on mobile?" }, "mc");
  if (a4.includes("BEST")) throw new Error(`acronym stopword: 'BEST' should be filtered, got ${JSON.stringify(a4)}`);
  if (!a4.includes("MFA")) throw new Error(`acronym: 'MFA' should pass, got ${JSON.stringify(a4)}`);

  // (b) Quoted substring extractor
  const q1 = needlesFor({ q: 'The attacker exploited a "Spectre" vulnerability.' }, "mc");
  if (!q1.includes("Spectre")) throw new Error(`quoted: missing 'Spectre' got ${JSON.stringify(q1)}`);

  // (c) Last-clause noun phrase before ?
  const l1 = needlesFor({ q: "What is MAM?" }, "mc");
  if (!l1.includes("MAM")) throw new Error(`last-clause: missing 'MAM' got ${JSON.stringify(l1)}`);

  // last-clause: multi-word tail
  const l2 = needlesFor({ q: "Which technique mitigates credential stuffing?" }, "mc");
  if (!l2.some(s => /credential stuffing/i.test(s))) {
    throw new Error(`last-clause multi: missing 'credential stuffing' got ${JSON.stringify(l2)}`);
  }

  // No augmentation for cram/match (regression)
  const r1 = needlesFor({ term: "HMAC" }, "cram");
  // Should NOT include question-text-derived needles
  if (r1.includes("MAM")) throw new Error(`regression: cram should not get q-augmentation, got ${JSON.stringify(r1)}`);

  // countMatches
  if (countMatches("hello world hello", "hello") !== 2) throw new Error("countMatches basic");
  if (countMatches("HELLO world", "hello") !== 1) throw new Error("countMatches case-insensitive");
  if (countMatches("a.b.c", "a.b") !== 1) throw new Error("countMatches regex escape");

  // classifyItem — four outcomes
  const c1 = classifyItem({ citedHits: 3, anyCorpusHits: 0, corpusHitFiles: [], citedVideoIsBroadUmbrella: false });
  if (c1.label !== "not-sb16") throw new Error(`classifyItem cited-hit: expected not-sb16, got ${c1.label}`);

  const c2 = classifyItem({ citedHits: 0, anyCorpusHits: 7, corpusHitFiles: ["other-video"], citedVideoIsBroadUmbrella: false });
  if (c2.label !== "partial-adjacent-not-sb16") throw new Error(`classifyItem corpus-hit: expected partial-adjacent-not-sb16, got ${c2.label}`);

  const c3 = classifyItem({ citedHits: 0, anyCorpusHits: 0, corpusHitFiles: [], citedVideoIsBroadUmbrella: true });
  if (c3.label !== "partial-depth") throw new Error(`classifyItem umbrella-empty: expected partial-depth, got ${c3.label}`);

  const c4 = classifyItem({ citedHits: 0, anyCorpusHits: 0, corpusHitFiles: [], citedVideoIsBroadUmbrella: false });
  if (c4.label !== "messer-curriculum-gap") throw new Error(`classifyItem sibling-empty: expected messer-curriculum-gap, got ${c4.label}`);

  console.log("  ✓ needles extract for cram + match types (baseline)");
  console.log("  ✓ needles mc/scen acronym extractor: HMAC, SD-WAN, MPLS, WAN, WPA2, MFA");
  console.log("  ✓ needles mc/scen acronym stopwords: BEST/MOST/NOT filtered");
  console.log("  ✓ needles mc/scen quoted-substring extractor");
  console.log("  ✓ needles mc/scen last-clause noun phrase (single + multi-word)");
  console.log("  ✓ regression: cram/match unaffected by mc/scen augmentation");
  console.log("  ✓ countMatches: case-insensitive + regex-escape correct");
  console.log("  ✓ classify cited-hit → not-sb16");
  console.log("  ✓ classify corpus-hit → partial-adjacent-not-sb16");
  console.log("  ✓ classify umbrella-empty → partial-depth");
  console.log("  ✓ classify sibling-empty → messer-curriculum-gap");
  console.log("SB-fix-2 routing self-test PASS (4 classification outcomes + helpers + mc/scen augmentation)");
}

main();
