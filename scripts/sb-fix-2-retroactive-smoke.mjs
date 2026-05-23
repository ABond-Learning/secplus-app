// Task 2 / 2026-05-23 — retroactive smoke of improved classifier against R packet
//
// The standard Pool B builder in sb-fix-2-route-pool-b.mjs filters out items
// where catalogue audit_d_review.sb16_candidate === true. After the R-packet
// backfill landed 2026-05-22 (commit 0789b95), 17 of the 18 R items have that
// flag set — Pool B is now near-empty. To validate Task 1's classifier
// improvements (needle augmentation + umbrella heuristic invert) against the
// original R-packet pool, this script bypasses the filter and re-runs the
// updated classifier on the 18 known R locations.
//
// Comparison target: .audit-working/sb-fix-2/packet-R-routings.json
//   (supervisor's adjudicated routings — 16 partial-depth + 1 messer-curriculum-
//    gap + 1 partial-adjacent-not-sb16).
//
// Baseline (pre-Task-1): CC's original packet-R.json had 56% divergence vs
// supervisor (10 of 18 items flipped, per
// .audit-working/findings/sb-fix-2-classifier-improvements.md).
//
// Output: stdout summary + .audit-working/sb-fix-2/packet-R-retroactive-smoke.md

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  needlesFor, countMatches, classifyItem, looksLikeUmbrellaTitle
} from "./sb-fix-2-route-pool-b.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

const ROUTINGS = resolve(repo, ".audit-working/sb-fix-2/packet-R-routings.json");
const ORIGINAL_PACKET = resolve(repo, ".audit-working/sb-fix-2/packet-R.json");
const QUESTIONS = resolve(repo, "questions.json");
const TRANSCRIPTS_DIR = resolve(repo, ".messer-transcripts");
const MESSER_MD = resolve(repo, "MESSER_VIDEOS.md");
const OUT = resolve(repo, ".audit-working/sb-fix-2/packet-R-retroactive-smoke.md");

// ─── Citation → slug map ────────────────────────────────────────────
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

function corpusGrep(needles) {
  const hits = new Map(); // file → total count
  const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith(".txt"));
  for (const f of files) {
    const txt = readFileSync(resolve(TRANSCRIPTS_DIR, f), "utf8");
    for (const n of needles) {
      const c = countMatches(txt, n);
      if (c > 0) hits.set(f, (hits.get(f) || 0) + c);
    }
  }
  return hits;
}

function findItem(sections, sectionId, videoId, type, index) {
  const sec = sections.find(s => s.id === sectionId);
  if (!sec) return null;
  const vid = sec.videos.find(v => v.id === videoId);
  if (!vid) return { parentVideoTitle: null, item: null };
  const arr =
    type === "mc"    ? vid.questions :
    type === "scen"  ? vid.scenarios :
    type === "match" ? vid.matching  :
    type === "cram"  ? vid.cram      : null;
  return { parentVideoTitle: vid.title, item: arr ? arr[index] : null };
}

// ─── Main ───────────────────────────────────────────────────────────
const routings = JSON.parse(readFileSync(ROUTINGS, "utf8")).routings;
const originalPacket = JSON.parse(readFileSync(ORIGINAL_PACKET, "utf8")).results;
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));
const citationToSlug = buildCitationToSlug();

const supervisorByLoc = new Map();
for (const r of routings) {
  const key = `${r.location.section}|${r.location.video}|${r.location.type}|${r.location.index}`;
  supervisorByLoc.set(key, r);
}
const originalByLoc = new Map();
for (const r of originalPacket) {
  const key = `${r.location.section}|${r.location.video}|${r.location.type}|${r.location.index}`;
  originalByLoc.set(key, r);
}

const smokeRows = [];
let oldAgree = 0;
let newAgree = 0;
let flipsFromDivergeToAgree = 0;
let flipsFromAgreeToDiverge = 0;
const newRecommendationDist = {};

for (const r of routings) {
  const locKey = `${r.location.section}|${r.location.video}|${r.location.type}|${r.location.index}`;
  const { parentVideoTitle, item } = findItem(
    questions, r.location.section, r.location.video, r.location.type, r.location.index
  );
  if (!item) {
    smokeRows.push({ locKey, error: "item-not-found", supervisor: r.routing });
    continue;
  }
  const citedCitation = originalByLoc.get(locKey)?.cited_citation;
  const originalCC = originalByLoc.get(locKey)?.cc_recommended_routing;

  // Apply NEW classifier
  const needles = needlesFor(item, r.location.type);
  const citedTxt = citedCitation ? loadTranscriptFor(citedCitation, citationToSlug) : null;
  let citedHits = 0;
  for (const n of needles) citedHits += citedTxt ? countMatches(citedTxt, n) : 0;

  const corpusHitsMap = corpusGrep(needles);
  // Exclude the cited transcript from corpus hits (cited measured separately)
  const citedSlug = citationToSlug.get(citedCitation);
  const citedFile = citedSlug ? `${citedSlug}.txt` : null;
  let anyCorpusHits = 0;
  const corpusHitFiles = [];
  for (const [f, c] of corpusHitsMap.entries()) {
    if (f === citedFile) continue;
    anyCorpusHits += c;
    corpusHitFiles.push(f);
  }

  const umbrella = looksLikeUmbrellaTitle(parentVideoTitle);
  const verdict = classifyItem({
    citedHits, anyCorpusHits, corpusHitFiles, citedVideoIsBroadUmbrella: umbrella
  });
  const newCC = verdict.label;

  newRecommendationDist[newCC] = (newRecommendationDist[newCC] || 0) + 1;

  const oldAgreed = originalCC === r.routing;
  const newAgreed = newCC === r.routing;
  if (oldAgreed) oldAgree++;
  if (newAgreed) newAgree++;
  if (!oldAgreed && newAgreed) flipsFromDivergeToAgree++;
  if (oldAgreed && !newAgreed) flipsFromAgreeToDiverge++;

  smokeRows.push({
    locKey,
    type: r.location.type,
    parent: parentVideoTitle,
    cited: citedCitation,
    needles_new: needles,
    cited_hits: citedHits,
    corpus_hits_total: anyCorpusHits,
    corpus_hit_files: corpusHitFiles,
    umbrella_new: umbrella,
    old_cc: originalCC,
    new_cc: newCC,
    supervisor: r.routing,
    old_agreed: oldAgreed,
    new_agreed: newAgreed,
    delta:
      !oldAgreed && newAgreed ? "diverge → agree (improved)"
      : oldAgreed && !newAgreed ? "agree → diverge (regression)"
      : oldAgreed && newAgreed ? "agree → agree"
      : "diverge → diverge"
  });
}

const total = routings.length;
const oldDivergence = ((total - oldAgree) / total * 100).toFixed(1);
const newDivergence = ((total - newAgree) / total * 100).toFixed(1);

console.log("=== Retroactive smoke — R packet ===");
console.log(`Total items:                  ${total}`);
console.log(`Old CC ↔ supervisor agreement: ${oldAgree}/${total} (divergence ${oldDivergence}%)`);
console.log(`New CC ↔ supervisor agreement: ${newAgree}/${total} (divergence ${newDivergence}%)`);
console.log(`Flips diverge → agree:        ${flipsFromDivergeToAgree}`);
console.log(`Flips agree → diverge:        ${flipsFromAgreeToDiverge}`);
console.log(`New recommendation distribution:`, newRecommendationDist);

// ─── Markdown report ────────────────────────────────────────────────
const lines = [];
lines.push("# SB-fix-2 R packet — retroactive smoke of improved classifier (Task 2)");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Re-runs the post-Task-1 classifier (needle augmentation + umbrella heuristic invert) against the 18 items routed in SB-fix-2 packet R, comparing per-item CC recommendation to supervisor's adjudicated routing.");
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- **Total items:** ${total}`);
lines.push(`- **OLD CC ↔ supervisor agreement:** ${oldAgree}/${total} (${(oldAgree/total*100).toFixed(1)}% / divergence ${oldDivergence}%)`);
lines.push(`- **NEW CC ↔ supervisor agreement:** ${newAgree}/${total} (${(newAgree/total*100).toFixed(1)}% / divergence ${newDivergence}%)`);
lines.push(`- **Flips diverge → agree:** ${flipsFromDivergeToAgree} (improvements)`);
lines.push(`- **Flips agree → diverge:** ${flipsFromAgreeToDiverge} (regressions)`);
lines.push(`- **New recommendation distribution:** ${JSON.stringify(newRecommendationDist)}`);
lines.push("");
lines.push("## Per-item breakdown");
lines.push("");
lines.push("| # | Loc | Type | Parent video | Old CC | New CC | Supervisor | Δ |");
lines.push("|---|---|---|---|---|---|---|---|");
for (let i = 0; i < smokeRows.length; i++) {
  const s = smokeRows[i];
  if (s.error) {
    lines.push(`| ${i+1} | ${s.locKey} | — | (error) | — | — | ${s.supervisor} | ${s.error} |`);
    continue;
  }
  lines.push(`| ${i+1} | ${s.locKey} | ${s.type} | ${s.parent} | \`${s.old_cc}\` | \`${s.new_cc}\` | \`${s.supervisor}\` | ${s.delta} |`);
}
lines.push("");
lines.push("## Detail — items where NEW ↔ supervisor still diverges");
lines.push("");
const stillDiverged = smokeRows.filter(s => !s.error && !s.new_agreed);
if (stillDiverged.length === 0) {
  lines.push("(none — new classifier matches supervisor on every item)");
} else {
  for (const s of stillDiverged) {
    lines.push(`### ${s.locKey} — ${s.type}`);
    lines.push("");
    lines.push(`- Parent: ${s.parent}`);
    lines.push(`- Cited: ${s.cited}`);
    lines.push(`- Umbrella heuristic (NEW): ${s.umbrella_new}`);
    lines.push(`- Cited hits (NEW): ${s.cited_hits}`);
    lines.push(`- Corpus hits total (NEW): ${s.corpus_hits_total} across ${s.corpus_hit_files.length} files`);
    lines.push(`- Needles (NEW): ${s.needles_new.map(n => "`"+n+"`").join(", ")}`);
    lines.push(`- Old CC: \`${s.old_cc}\` | New CC: \`${s.new_cc}\` | Supervisor: \`${s.supervisor}\``);
    lines.push("");
  }
}

writeFileSync(OUT, lines.join("\n"));
console.log(`\nWrote ${OUT}`);
