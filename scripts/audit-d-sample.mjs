// Audit D Sub-batch 0 — calibration sample selection (Stage 0).
//
// Deterministic, seeded selection of 30 items: 4 must-include
// smoke-test items (§2.3.3 mutex + atomic in both matching AND
// cram) + 26 stratified-random remainder across 5 domains × 4 types.
//
// Per Audit D scoping doc §S1 (4 smoke items), §S2 (seed 20260513),
// and the stratification table in §1B of the sub-batch-0 orientation.
//
// Output: .audit-working/audit-d-calibration/sample-selection.json
//
// Usage: node scripts/audit-d-sample.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-calibration");
mkdirSync(OUT_DIR, { recursive: true });

const SEED = 20260513;

// ─── PRNG (Mulberry32) ───────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h >>> 0;
}
function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Transcript slug from Messer video title ─────────────────────────
function transcriptSlug(videoTitle) {
  return videoTitle.toLowerCase()
    .replace(/[,'']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-sy0-701";
}

// ─── Smoke-test cohort (must-include) ────────────────────────────────
const SMOKE = [
  { section: "2.3", video: "2.3.3", type: "match", index: 2 },
  { section: "2.3", video: "2.3.3", type: "match", index: 3 },
  { section: "2.3", video: "2.3.3", type: "cram",  index: 2 },
  { section: "2.3", video: "2.3.3", type: "cram",  index: 3 },
];

// ─── Stratified random allocation (per orientation §1B) ──────────────
const ALLOC = {
  "1": { mc: 1, scen: 1, match: 1, cram: 2 },
  "2": { mc: 1, scen: 1, match: 2, cram: 3 },
  "3": { mc: 1, scen: 1, match: 1, cram: 2 },
  "4": { mc: 1, scen: 1, match: 2, cram: 1 },
  "5": { mc: 1, scen: 1, match: 1, cram: 1 },
};
const FIELD_MAP = { mc: "questions", scen: "scenarios", match: "matching", cram: "cram" };

// ─── Main ────────────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));

function enrich(rec) {
  const sec = data.find(s => s.id === rec.section);
  const v = sec.videos.find(x => x.id === rec.video);
  const item = v[FIELD_MAP[rec.type]][rec.index];
  return {
    ...rec,
    section_label: sec.label,
    video_title: v.title,
    item,
    messer_video_citation: `${sec.id} - ${v.title}`,
    transcript_path: `.messer-transcripts/${transcriptSlug(v.title)}.txt`,
  };
}

function enumerateItems(domain, type) {
  const field = FIELD_MAP[type];
  const out = [];
  for (const sec of data) {
    if (!sec.id.startsWith(domain + ".")) continue;
    for (const v of sec.videos) {
      const arr = v[field] || [];
      arr.forEach((_, i) => out.push({ section: sec.id, video: v.id, type, index: i }));
    }
  }
  return out;
}

const smokeKey = (x) => `${x.video}|${x.type}|${x.index}`;
const smokeKeys = new Set(SMOKE.map(smokeKey));

const selected = [];
for (const s of SMOKE) selected.push({ ...enrich(s), role: "smoke-test" });

const samplingDetails = [];
for (const [domain, alloc] of Object.entries(ALLOC)) {
  for (const [type, n] of Object.entries(alloc)) {
    const pool = enumerateItems(domain, type).filter(x => !smokeKeys.has(smokeKey(x)));
    const subSeed = SEED ^ hashStr(`d${domain}-${type}`);
    const rng = mulberry32(subSeed);
    const shuffled = shuffle(pool, rng);
    const picks = shuffled.slice(0, n);
    for (const p of picks) selected.push({ ...enrich(p), role: "random-stratified" });
    samplingDetails.push({
      domain, type, requested: n, available: pool.length,
      sub_seed: subSeed, picked_indices: picks.map(p => `${p.video}[${p.index}]`),
    });
  }
}

const counts = {};
for (const s of selected) {
  const k = `D${s.section.split(".")[0]}-${s.type}`;
  counts[k] = (counts[k] || 0) + 1;
}

const out = {
  metadata: {
    seed: SEED,
    timestamp: new Date().toISOString(),
    total: selected.length,
    smoke_count: SMOKE.length,
    random_count: selected.length - SMOKE.length,
    allocation_table: ALLOC,
    actual_counts_by_domain_type: counts,
    sampling_details: samplingDetails,
  },
  items: selected,
};

writeFileSync(resolve(OUT_DIR, "sample-selection.json"), JSON.stringify(out, null, 2));

console.log(`Wrote sample-selection.json: ${selected.length} items`);
console.log(`  ${SMOKE.length} smoke-test (D2/2.3.3 mutex+atomic in match+cram)`);
console.log(`  ${selected.length - SMOKE.length} stratified-random`);
console.log("\nPer-bucket counts (D<n>-<type>):");
for (const [k, c] of Object.entries(counts).sort()) console.log(`  ${k}: ${c}`);
