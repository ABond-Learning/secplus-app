// Audit A apply, deferred bundle — 4 items (closes apply phase).
//
// These 4 items were deferred from Chunks 1-3 because the proposals
// as authored landed above ≤1.50× ratio:
//   - scen-2.4.8-1  (deferred from Chunk 1 — proposal landed 1.504× boundary)
//   - scen-4.3.3-2  (deferred from Chunk 2 — proposal landed 1.507× boundary)
//   - scen-2.5.2-1  (deferred from Chunk 1 — proposal landed 1.776×)
//   - scen-3.3.3-0  (deferred from Chunk 2 — proposal landed 1.673×)
//
// Final paths (Aiden's selection per .audit-working/deferred-fix-candidates.txt):
//   scen-2.4.8-1  Mechanical: opt[1] +10c (append "protocols")
//   scen-4.3.3-2  Mechanical: opt[0] +8c (append "overall"),
//                             opt[3] +6c ("faster" → "more quickly")
//                 Note: opt[0]=149c was the actual binding minimum; padding
//                 only opt[3] would have landed at 1.497× — passes ≤1.50× but
//                 tight. Padding both gives clean margin (1.467×).
//   scen-2.5.2-1  Path A (substantive): pad distractors to ≥180c each, keep
//                 correct at 270c. Preserves "memory dump BEFORE shutdown"
//                 sequencing + 3-prompt investigation framing in option text.
//                 Final ratio 1.429×.
//   scen-3.3.3-0  Path A (substantive): trim correct from 506c → 235c,
//                 distractors at 165-172c (proposal-as-authored). 41c trim
//                 is mild — drops "the employee's" subject and "with
//                 immediate access revocation" tail (latter lives in exp).
//                 Final ratio 1.424×.
//
// REPLACEMENTS shape — same as chunk scripts. All 4 items: newA == expectedOldA
// (no answer-key changes; in-place edits).
//
// Safety: each item's expectedOldOpts (4 strings) + expectedOldA must
// match current questions.json exactly. Stem prefix is also checked.
//
// Modes:
//   (no flag)   dry run; print summary; no writes.
//   --preview   write to .audit-working/questions-deferred-preview.json.
//   --write     mutate questions.json in place.
//
// Usage:
//   node scripts/fix-audit-a-deferred.mjs              # dry run
//   node scripts/fix-audit-a-deferred.mjs --preview    # write preview
//   node scripts/fix-audit-a-deferred.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const replacementsPath = resolve(here, "fix-audit-a-deferred-replacements.json");
const previewPath = resolve(repo, ".audit-working/questions-deferred-preview.json");

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

const REPLACEMENTS = JSON.parse(readFileSync(replacementsPath, "utf8"));

if (REPLACEMENTS.length !== 4) {
  console.error(`Expected 4 REPLACEMENTS, got ${REPLACEMENTS.length}`);
  process.exit(1);
}

// ── Resolve + safety-check pass (no mutation) ──────────────────────────────
const planned = [];
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
console.log(`\nfix-audit-a-deferred  (${mode})`);
console.log(`Total REPLACEMENTS:           ${REPLACEMENTS.length}`);
console.log(`  applied:                    ${applied}`);
console.log(`  skipped (idempotent):       ${skipped}`);
console.log(`  refused (safety):           ${refusals.length}`);
if (ratioConcerns.length) {
  console.log(`\n⚠ Ratio > 1.50× on ${ratioConcerns.length} item(s):`);
  for (const c of ratioConcerns) console.log(`  ${c.id}  lens=${c.lens.join(",")}  ratio=${c.ratio.toFixed(3)}×`);
}
console.log(`\nPer-item ratios:`);
for (const e of log) {
  const lens = e.newLens;
  const mx = Math.max(...lens), mn = Math.min(...lens);
  console.log(`  ${e.id}  newLens=[${lens.join(", ")}]  ratio=${(mx/mn).toFixed(3)}×`);
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
