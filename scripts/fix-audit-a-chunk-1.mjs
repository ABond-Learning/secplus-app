// Audit A apply, chunk 1 — Batches 1+2 (54 of 56 items).
//
// Source proposals:
//   .audit-working/audit-a-fix-proposal-batch-1.txt    (10 items)
//   .audit-working/audit-a-fix-proposal-batch-2.txt    (46 items)
//
// Two items are deferred to a follow-on fix (would not meet ≤ 1.50× ratio
// on actual char-counts of proposed text):
//   - scen-2.4.8-1 (1.504× boundary; needs ~1c distractor pad)
//   - scen-2.5.2-1 (1.776×; proposal authoring error — distractor padding
//     incomplete vs claim. Needs re-author.)
//
// REPLACEMENTS shape (per item):
//   {
//     id, videoId, kind ('mc' | 'scen'), index,
//     expectedOldStemPrefix,  // first 60 chars of current stem
//     expectedOldOpts,        // [4 strings] — current state, byte-exact
//     expectedOldA,           // current correct-answer index
//     newOpts,                // [4 strings] — proposed final state
//     newA,                   // preserved (in-place edit) or swapped
//                             // (only scen-2.3.2-2 swaps content within
//                             //  the same a=1 slot; index doesn't change)
//   }
//
// Special items in this chunk:
//   - scen-2.2.2-4 — canonical Smishing question that surfaced this audit.
//   - scen-2.3.2-2 — ANSWER-KEY BUG. Path A in-place content swap. opt[1]
//     remains correct (a=1 unchanged); content moves so opt[1] now holds
//     the actual correct randomization explanation.
//   - scen-2.4.1-0 — BROKEN OPTION recovery. Current opt[2] = "The decision
//     depends on" (truncated). Replaced with completed 130c sentence.
//
// Safety: each item's expectedOldOpts (4 strings) + expectedOldA must
// match current questions.json exactly. Stem prefix is also checked. If
// any item fails the safety check, halt before any mutation.
//
// Modes:
//   (no flag)   dry run; print summary; no writes.
//   --preview   write proposed final state to
//               .audit-working/questions-chunk-1-preview.json (NOT /tmp/).
//   --write     mutate questions.json in place.
//
// Idempotent: re-running --write after a successful apply skips items
// whose current opts already equal newOpts.
//
// Usage:
//   node scripts/fix-audit-a-chunk-1.mjs              # dry run
//   node scripts/fix-audit-a-chunk-1.mjs --preview    # write preview
//   node scripts/fix-audit-a-chunk-1.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const replacementsPath = resolve(here, "fix-audit-a-chunk-1-replacements.json");
const previewPath = resolve(repo, ".audit-working/questions-chunk-1-preview.json");

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// Items deferred to follow-on fix per
// .audit-working/full-audit-actual-ratio-check-2026-05-04.txt
const DEFERRED = new Set(["scen-2.4.8-1", "scen-2.5.2-1"]);

// Load REPLACEMENTS from the parser output (built from the proposals
// against the current questions.json BEFORE state). Filter out deferred.
const allReplacements = JSON.parse(readFileSync(replacementsPath, "utf8"));
const REPLACEMENTS = allReplacements.filter(r => !DEFERRED.has(r.id));

if (REPLACEMENTS.length !== 54) {
  console.error(`Expected 54 REPLACEMENTS after filtering, got ${REPLACEMENTS.length}`);
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

  // Stem prefix check.
  if (typeof r.expectedOldStemPrefix === "string" && r.expectedOldStemPrefix.length) {
    if (!(item.q || "").startsWith(r.expectedOldStemPrefix)) {
      refusals.push(`${r.id}: stem prefix mismatch
    expected: ${JSON.stringify(r.expectedOldStemPrefix)}
    actual:   ${JSON.stringify((item.q || "").slice(0, 60))}`);
      continue;
    }
  }

  // Idempotency: if current opts already match newOpts, this is a no-op skip.
  const sameOpts =
    Array.isArray(item.opts) && item.opts.length === 4 &&
    r.newOpts.every((s, i) => s === item.opts[i]);
  if (sameOpts) {
    planned.push({ item, r, kind: "skip" });
    continue;
  }

  // Verify current opts match expectedOldOpts byte-exact.
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
  // Verify current correct index matches.
  if (item.a !== r.expectedOldA) {
    refusals.push(`${r.id}: correct index drift  expected=${r.expectedOldA}  actual=${item.a}`);
  }

  // newOpts must contain 4 strings; newA must be a valid 0..3 index.
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

// Compute actual char-count ratios for the post-apply state to surface
// any item that doesn't actually meet ≤ 1.50× (defense in depth — should
// be 0 since all 54 already verified, but cheap to confirm).
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
console.log(`\nfix-audit-a-chunk-1  (${mode})`);
console.log(`Total REPLACEMENTS:           ${REPLACEMENTS.length}`);
console.log(`  applied:                    ${applied}`);
console.log(`  skipped (idempotent):       ${skipped}`);
console.log(`  refused (safety):           ${refusals.length}`);
console.log(`Deferred (excluded upstream): ${DEFERRED.size}  → ${[...DEFERRED].join(", ")}`);
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
