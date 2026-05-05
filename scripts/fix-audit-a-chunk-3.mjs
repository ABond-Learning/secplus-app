// Audit A apply, chunk 3 — Batches 4b+5 (62 of 62 items, no deferrals).
//
// Source proposals:
//   .audit-working/audit-a-fix-proposal-batch-4b.txt  (33 items,
//                                                      §4.5+§4.6+§4.7+§4.8+§4.9)
//   .audit-working/audit-a-fix-proposal-batch-5.txt   (29 items, §5.x)
//
// All 62 items expected to apply cleanly. Zero deferrals — both Batch 4b
// and Batch 5 had final-ratio verification ≤1.50× per-item before
// proposal sign-off (Batch 5 was authored under the "Option B
// genuinely executed" measure-floor-first protocol, 0/29 rework).
//
// REPLACEMENTS shape (per item):
//   {
//     id, videoId, kind ('mc' | 'scen'), index,
//     expectedOldStemPrefix,  // first 60 chars of current stem
//     expectedOldOpts,        // [4 strings] — current state, byte-exact
//     expectedOldA,           // current correct-answer index
//     newOpts,                // [4 strings] — proposed final state
//     newA,                   // preserved (in-place edit) or swapped
//   }
//
// Special items in this chunk:
//   - mc-4.5.5-3   BROKEN OPTION recovery. Current correct option (a=2)
//                  was "SPF alone" (9c only — incomplete predicate).
//                  Replaced with completed 112c sentence. Verify
//                  "envelope-from header" pedagogy in exp afterwards
//                  (vs RFC5321 MAIL FROM / Return-Path).
//   - scen-4.5.1-2 Heaviest §4.5 trim (608c→237c, WAF false-positive).
//
// Safety: each item's expectedOldOpts (4 strings) + expectedOldA must
// match current questions.json exactly. Stem prefix is also checked. If
// any item fails the safety check, halt before any mutation.
//
// Modes:
//   (no flag)   dry run; print summary; no writes.
//   --preview   write proposed final state to
//               .audit-working/questions-chunk-3-preview.json (NOT /tmp/).
//   --write     mutate questions.json in place.
//
// Idempotent: re-running --write after a successful apply skips items
// whose current opts already equal newOpts.
//
// Usage:
//   node scripts/fix-audit-a-chunk-3.mjs              # dry run
//   node scripts/fix-audit-a-chunk-3.mjs --preview    # write preview
//   node scripts/fix-audit-a-chunk-3.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const replacementsPath = resolve(here, "fix-audit-a-chunk-3-replacements.json");
const previewPath = resolve(repo, ".audit-working/questions-chunk-3-preview.json");

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// No deferrals in this chunk.
const DEFERRED = new Set();

const allReplacements = JSON.parse(readFileSync(replacementsPath, "utf8"));
const REPLACEMENTS = allReplacements.filter(r => !DEFERRED.has(r.id));

if (REPLACEMENTS.length !== 62) {
  console.error(`Expected 62 REPLACEMENTS after filtering, got ${REPLACEMENTS.length}`);
  console.error(`(allReplacements: ${allReplacements.length}, deferred: ${DEFERRED.size})`);
  process.exit(1);
}

// ── Resolve + safety-check pass (no mutation) ──────────────────────────────
const planned = []; // { ref to live item, r, kind: "apply" | "skip" }
const refusals = [];

for (const r of REPLACEMENTS) {
  const sectionId = r.videoId.split(".").slice(0, 2).join(".");
  const sec = data.find(s => s.id === sectionId);
  if (!sec) { refusals.push(`${r.id}: section ${sectionId} not found`); continue; }
  const vid = (sec.videos || []).find(v => v.id === r.videoId);
  if (!vid) { refusals.push(`${r.id}: video ${r.videoId} not found`); continue; }
  const list = r.kind === "mc" ? vid.questions : vid.scenarios;
  const item = list?.[r.index];
  if (!item) { refusals.push(`${r.id}: item ${r.kind}[${r.index}] not found`); continue; }

  if (typeof r.expectedOldStemPrefix === "string" && r.expectedOldStemPrefix.length) {
    if (!(item.q || "").startsWith(r.expectedOldStemPrefix)) {
      refusals.push(`${r.id}: stem prefix mismatch
    expected: ${JSON.stringify(r.expectedOldStemPrefix)}
    actual:   ${JSON.stringify((item.q || "").slice(0, 60))}`);
      continue;
    }
  }

  const sameOpts =
    Array.isArray(item.opts) && item.opts.length === 4 &&
    r.newOpts.every((s, i) => s === item.opts[i]);
  if (sameOpts) {
    planned.push({ item, r, kind: "skip" });
    continue;
  }

  if (!Array.isArray(item.opts) || item.opts.length !== 4) {
    refusals.push(`${r.id}: current item has ${item.opts?.length ?? 0} opts, expected 4`);
    continue;
  }
  for (let i = 0; i < 4; i++) {
    if (item.opts[i] !== r.expectedOldOpts[i]) {
      refusals.push(`${r.id}: opt[${i}] drift
    expected: ${JSON.stringify(r.expectedOldOpts[i])}
    actual:   ${JSON.stringify(item.opts[i])}`);
    }
  }
  if (item.a !== r.expectedOldA) {
    refusals.push(`${r.id}: correct index drift  expected=${r.expectedOldA}  actual=${item.a}`);
  }

  if (!Array.isArray(r.newOpts) || r.newOpts.length !== 4 || r.newOpts.some(s => typeof s !== "string")) {
    refusals.push(`${r.id}: malformed newOpts`);
  }
  if (typeof r.newA !== "number" || r.newA < 0 || r.newA > 3) {
    refusals.push(`${r.id}: malformed newA`);
  }

  planned.push({ item, r, kind: "apply" });
}

if (refusals.length) {
  console.error(`\nSAFETY CHECK FAILED — ${refusals.length} issue(s):\n`);
  for (const m of refusals) console.error(`  - ${m}`);
  console.error(`\nNo mutation. Aborting.`);
  process.exit(1);
}

const ratioConcerns = [];
for (const p of planned) {
  if (p.kind !== "apply") continue;
  const lens = p.r.newOpts.map(s => s.length);
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  const ratio = max / min;
  if (ratio > 1.50) {
    ratioConcerns.push({ id: p.r.id, lens, ratio });
  }
}

// ── Apply (preview / write) ────────────────────────────────────────────────
let applied = 0, skipped = 0;
const log = [];

for (const p of planned) {
  if (p.kind === "skip") { skipped++; continue; }
  log.push({
    id: p.r.id,
    oldA: p.item.a, newA: p.r.newA,
    oldLens: p.item.opts.map(s => s.length),
    newLens: p.r.newOpts.map(s => s.length),
  });
  if (write || preview) {
    p.item.opts = p.r.newOpts.slice();
    p.item.a = p.r.newA;
  }
  applied++;
}

const mode = write ? "WRITE" : preview ? "PREVIEW" : "DRY-RUN";
console.log(`\nfix-audit-a-chunk-3  (${mode})`);
console.log(`Total REPLACEMENTS:           ${REPLACEMENTS.length}`);
console.log(`  applied:                    ${applied}`);
console.log(`  skipped (idempotent):       ${skipped}`);
console.log(`  refused (safety):           ${refusals.length}`);
console.log(`Deferred (excluded upstream): ${DEFERRED.size}${DEFERRED.size ? "  → " + [...DEFERRED].join(", ") : ""}`);
if (ratioConcerns.length) {
  console.log(`\n⚠ Ratio > 1.50× on ${ratioConcerns.length} item(s):`);
  for (const c of ratioConcerns) console.log(`  ${c.id}  lens=${c.lens.join(",")}  ratio=${c.ratio.toFixed(3)}×`);
}

if (write || preview) {
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote to ${target}`);
  if (preview) {
    console.log(`Validate preview:  node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
  }
} else {
  console.log("\n(dry run — pass --preview to write to .audit-working/, --write to persist)");
}
