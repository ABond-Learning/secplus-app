// Audit D Sub-batch 1 pre-flight — regression sample builder.
//
// Produces a 23-item sample of the Sub-batch 0 strict-agreement
// rows (the rows where Sub-batch 0 script and supervisor agreed
// on category). The iter1 tuned prompt is run on these to verify
// the tuning doesn't silently regress on items that were already
// correct.
//
// Strict-agreement rows = all 30 Sub-batch 0 rows MINUS the 7
// disagreement rows (5, 10, 11, 18, 19, 24, 30).
//
// Output:
//   .audit-working/audit-d-sub-batch-1-preflight/regression-sample.json
//
// Usage: node scripts/audit-d-build-regression-sample.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");
mkdirSync(OUT_DIR, { recursive: true });

const DISAGREE_ROW_IDS = new Set([5, 10, 11, 18, 19, 24, 30]);

const sb0Sample = JSON.parse(readFileSync(
  resolve(repo, ".audit-working/audit-d-calibration/sample-selection.json"),
  "utf8",
));

const items = [];
sb0Sample.items.forEach((it, idx) => {
  const rid = idx + 1;
  if (DISAGREE_ROW_IDS.has(rid)) return;
  items.push({
    ...it,
    role: "regression-strict-agree",
    source_row_id: rid,
  });
});

const out = {
  metadata: {
    timestamp: new Date().toISOString(),
    total: items.length,
    source: "sub-batch-0 strict-agreement rows (all 30 minus 7 disagreement rows)",
    excluded_row_ids: Array.from(DISAGREE_ROW_IDS).sort((a, b) => a - b),
    ground_truth_source: "sub-batch-0 supervisor-verdicts.json (the strict-agreement subset)",
  },
  items,
};

writeFileSync(resolve(OUT_DIR, "regression-sample.json"), JSON.stringify(out, null, 2));

console.log(`Wrote regression-sample.json: ${items.length} items`);
console.log(`  Excluded Sub-batch 0 disagreement rows: ${Array.from(DISAGREE_ROW_IDS).sort((a, b) => a - b).join(", ")}`);
console.log("");
const typeCount = {};
for (const it of items) {
  const k = `D${it.section.split(".")[0]}-${it.type}`;
  typeCount[k] = (typeCount[k] || 0) + 1;
}
console.log("Per-bucket counts:");
for (const [k, c] of Object.entries(typeCount).sort()) console.log(`  ${k}: ${c}`);
