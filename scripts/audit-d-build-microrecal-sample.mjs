// Audit D Sub-batch 1 pre-flight — micro-recalibration sample builder.
//
// Produces a 12-item sample for the tuned-prompt micro-recalibration:
//
//   Subset 1 (7 items): the strict-disagreement rows from Sub-batch 0
//     (row_ids 5, 10, 11, 18, 19, 24, 30). These are the items the
//     tuned prompt is specifically expected to handle better than the
//     baseline. Ground truth for evaluation is the Sub-batch 0
//     supervisor-Claude verdicts.
//
//   Subset 2 (5 items): a fresh stratified-random draw — 1 item per
//     domain D1..D5 — using a NEW seed (20260514, deterministic). All
//     30 Sub-batch 0 items are excluded from the pool. Ground truth
//     for evaluation will be a new supervisor-Claude pass on these 5.
//
// Output:
//   .audit-working/audit-d-sub-batch-1-preflight/microrecal-sample.json
//
// Usage: node scripts/audit-d-build-microrecal-sample.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");
mkdirSync(OUT_DIR, { recursive: true });

const SEED = 20260514;

// ─── PRNG (Mulberry32) — same as audit-d-sample.mjs ──────────────────
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

// ─── Transcript slug — same as audit-d-sample.mjs ────────────────────
function transcriptSlug(videoTitle) {
  return videoTitle.toLowerCase()
    .replace(/[,'']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-sy0-701";
}

// ─── Sub-batch 0 disagreement row_ids ────────────────────────────────
// Source: .audit-working/audit-d-calibration/agreement-metrics.json
//   disagreements_strict array.
const DISAGREE_ROW_IDS = [5, 10, 11, 18, 19, 24, 30];

const FIELD_MAP = { mc: "questions", scen: "scenarios", match: "matching", cram: "cram" };
const DOMAINS = ["1", "2", "3", "4", "5"];
const TYPES = ["mc", "scen", "match", "cram"];

// ─── Load source data ────────────────────────────────────────────────
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));
const sb0Sample = JSON.parse(readFileSync(
  resolve(repo, ".audit-working/audit-d-calibration/sample-selection.json"),
  "utf8",
));

// ─── Enrich helper (matches audit-d-sample.mjs format) ───────────────
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

// ─── Subset 1 — disagreement re-run ──────────────────────────────────
// Pull straight from Sub-batch 0 sample-selection.json (already enriched).
const subset1 = DISAGREE_ROW_IDS.map(rid => {
  const it = sb0Sample.items[rid - 1];
  return {
    section: it.section,
    video: it.video,
    type: it.type,
    index: it.index,
    section_label: it.section_label,
    video_title: it.video_title,
    item: it.item,
    messer_video_citation: it.messer_video_citation,
    transcript_path: it.transcript_path,
    role: "subset-1-disagree",
    source_row_id: rid,
  };
});

// ─── Subset 2 — 5 fresh, 1 per domain (seed 20260514) ────────────────
const excludedKeys = new Set(sb0Sample.items.map(s => `${s.video}|${s.type}|${s.index}`));
const subset2 = [];
const samplingDetails = [];
for (const domain of DOMAINS) {
  const pool = [];
  for (const type of TYPES) {
    for (const rec of enumerateItems(domain, type)) {
      const key = `${rec.video}|${rec.type}|${rec.index}`;
      if (!excludedKeys.has(key)) pool.push(rec);
    }
  }
  const subSeed = SEED ^ hashStr(`subset-2-d${domain}`);
  const rng = mulberry32(subSeed);
  const shuffled = shuffle(pool, rng);
  const pick = shuffled[0];
  if (!pick) {
    samplingDetails.push({ domain, available: 0, picked: null, sub_seed: subSeed });
    continue;
  }
  subset2.push({ ...enrich(pick), role: "subset-2-fresh", sub_seed: subSeed });
  samplingDetails.push({
    domain,
    available: pool.length,
    sub_seed: subSeed,
    picked: `${pick.video}[${pick.type}/${pick.index}]`,
  });
}

const all = [...subset1, ...subset2];

// ─── Stats ───────────────────────────────────────────────────────────
const typeCount = {};
for (const it of all) {
  const k = `D${it.section.split(".")[0]}-${it.type}`;
  typeCount[k] = (typeCount[k] || 0) + 1;
}
const roleCount = {
  "subset-1-disagree": subset1.length,
  "subset-2-fresh":    subset2.length,
};

// ─── Output ──────────────────────────────────────────────────────────
const out = {
  metadata: {
    timestamp: new Date().toISOString(),
    total: all.length,
    subset_1: {
      name: "disagreement-rerun",
      source: "sub-batch-0 strict-disagreement rows",
      row_ids: DISAGREE_ROW_IDS,
      count: subset1.length,
      ground_truth_source: "sub-batch-0 supervisor-verdicts.json (already collected)",
    },
    subset_2: {
      name: "fresh-stratified",
      strategy: "1 per domain D1..D5, random type, excludes Sub-batch 0 items",
      seed: SEED,
      count: subset2.length,
      sampling_details: samplingDetails,
      ground_truth_source: "fresh supervisor-Claude pass (Aiden to run after packet ready)",
    },
    role_count: roleCount,
    type_count: typeCount,
  },
  items: all,
};

writeFileSync(resolve(OUT_DIR, "microrecal-sample.json"), JSON.stringify(out, null, 2));

console.log(`Wrote microrecal-sample.json: ${all.length} items`);
console.log(`  Subset 1 (disagreement re-run): ${subset1.length} items, row_ids ${DISAGREE_ROW_IDS.join(", ")}`);
console.log(`  Subset 2 (fresh stratified):    ${subset2.length} items`);
console.log("");
console.log("Per-bucket counts:");
for (const [k, c] of Object.entries(typeCount).sort()) console.log(`  ${k}: ${c}`);
console.log("");
console.log("Subset 2 picks:");
for (const it of subset2) {
  console.log(`  D${it.section.split(".")[0]} §${it.video} ${it.type}[${it.index}]: ${it.video_title}`);
}
