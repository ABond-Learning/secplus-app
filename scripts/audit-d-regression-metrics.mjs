// Audit D Sub-batch 1 pre-flight — regression metrics for the 23
// Sub-batch 0 strict-agreement items run through the iter1 prompt.
//
// Compares iter1 verdicts on the 23 items vs Sub-batch 0 supervisor
// verdicts on the same items (which were also Sub-batch 0 script
// verdicts, by definition — they were strict-agreement).
//
// Pass threshold: ≤2 of 23 strict-category shifts (≤8.7%).
//
// Outputs:
//   .audit-working/audit-d-sub-batch-1-preflight/regression-metrics-<tag>.json
//
// Usage:
//   node scripts/audit-d-regression-metrics.mjs --verdicts regression-verdicts-iter1.json --tag iter1

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const PREFLIGHT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");
const SB0_DIR = resolve(repo, ".audit-working/audit-d-calibration");

function parseArgs() {
  const out = { verdicts: "regression-verdicts-iter1.json", tag: "iter1" };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--verdicts" && i + 1 < process.argv.length) out.verdicts = process.argv[++i];
    else if (a === "--tag" && i + 1 < process.argv.length) out.tag = process.argv[++i];
  }
  return out;
}
const args = parseArgs();

const sample = JSON.parse(readFileSync(resolve(PREFLIGHT_DIR, "regression-sample.json"), "utf8"));
const verdicts = JSON.parse(readFileSync(resolve(PREFLIGHT_DIR, args.verdicts), "utf8"));
const sb0Sup = JSON.parse(readFileSync(resolve(SB0_DIR, "supervisor-verdicts.json"), "utf8"));

const keyOf = l => `${l.section}|${l.video}|${l.type}|${l.index}`;
const verdictByKey = new Map(verdicts.verdicts.map(v => [keyOf(v.location), v]));

function collapseCategory(c) {
  if (c === "partial-adjacent" || c === "out-of-source") return "not-in-transcript";
  return c;
}

function describeSubject(s) {
  if (s.type === "match") return s.item.answer;
  if (s.type === "cram")  return s.item.term;
  return (s.item.q || "").slice(0, 80);
}

const rows = [];
for (const s of sample.items) {
  const v = verdictByKey.get(keyOf(s));
  if (!v) {
    rows.push({
      source_row_id: s.source_row_id,
      location: `§${s.video} ${s.type}[${s.index}]`,
      subject: describeSubject(s),
      iter1_category: null,
      iter1_confidence: null,
      sb0_category: null,
      strict_match: false,
      collapsed_match: false,
      error: "missing verdict",
    });
    continue;
  }
  const sup = sb0Sup.find(x => x.row_id === s.source_row_id);
  if (!sup) throw new Error(`Missing SB0 supervisor verdict for row ${s.source_row_id}`);
  const strict_match    = v.verdict.category === sup.category;
  const collapsed_match = collapseCategory(v.verdict.category) === collapseCategory(sup.category);
  rows.push({
    source_row_id: s.source_row_id,
    location: `§${s.video} ${s.type}[${s.index}]`,
    role: s.role,
    domain: s.section.split(".")[0],
    type: s.type,
    subject: describeSubject(s),
    iter1_category:    v.verdict.category,
    iter1_confidence:  v.verdict.confidence,
    iter1_fix:         v.verdict.fix_direction,
    iter1_structural_flag: v.structural_flag,
    sb0_category:      sup.category,
    sb0_confidence:    sup.confidence,
    strict_match,
    collapsed_match,
    is_smoke:          [1, 2, 3, 4].includes(s.source_row_id),
  });
}

const totalEvaluated = rows.filter(r => r.iter1_category !== null).length;
const regressions = rows.filter(r => r.iter1_category !== null && !r.strict_match);
const collapsedRegressions = rows.filter(r => r.iter1_category !== null && !r.collapsed_match);

const smokeRows = rows.filter(r => r.is_smoke);
const smokeRegressions = smokeRows.filter(r => r.iter1_category !== null && !r.strict_match);

const PASS_THRESHOLD = 2;
const pass = regressions.length <= PASS_THRESHOLD;

const distScript = {};
const distSb0 = {};
for (const r of rows) {
  if (r.iter1_category) distScript[r.iter1_category] = (distScript[r.iter1_category] || 0) + 1;
  if (r.sb0_category) distSb0[r.sb0_category] = (distSb0[r.sb0_category] || 0) + 1;
}

const metrics = {
  generated: new Date().toISOString(),
  tag: args.tag,
  verdicts_file: args.verdicts,
  total: rows.length,
  evaluated: totalEvaluated,
  regressions: regressions.length,
  regressions_pct: +(regressions.length / totalEvaluated * 100).toFixed(1),
  collapsed_regressions: collapsedRegressions.length,
  smoke_total: smokeRows.length,
  smoke_regressions: smokeRegressions.length,
  smoke_test_invariant_held: smokeRegressions.length === 0,
  threshold: PASS_THRESHOLD,
  pass,
  distributions: {
    iter1_category: distScript,
    sb0_supervisor_category: distSb0,
  },
  regression_detail: regressions.map(r => ({
    source_row_id: r.source_row_id,
    location: r.location,
    subject: r.subject,
    sb0_category: r.sb0_category,
    iter1_category: r.iter1_category,
    collapsed_match: r.collapsed_match,
    is_smoke: r.is_smoke,
  })),
  per_row: rows,
};

writeFileSync(resolve(PREFLIGHT_DIR, `regression-metrics-${args.tag}.json`), JSON.stringify(metrics, null, 2));

console.log(`REGRESSION METRICS — tag: ${args.tag}`);
console.log(`  Verdicts file: ${args.verdicts}`);
console.log("");
console.log(`Total items:                    ${rows.length}`);
console.log(`Evaluated:                      ${totalEvaluated}`);
console.log(`Strict regressions:             ${regressions.length}/${totalEvaluated} = ${metrics.regressions_pct}%   (threshold ≤${PASS_THRESHOLD})`);
console.log(`Collapsed regressions:          ${collapsedRegressions.length}/${totalEvaluated}`);
console.log(`Smoke-test invariant (§2.3.3): ${smokeRegressions.length === 0 ? '✓ HELD' : `✗ BROKEN — ${smokeRegressions.length}/${smokeRows.length} smoke items regressed`}`);
console.log("");
console.log(`Iter1 category distribution:    ${JSON.stringify(distScript)}`);
console.log(`SB0 supervisor distribution:    ${JSON.stringify(distSb0)}`);
console.log("");
console.log(`OVERALL ${pass ? "PASS" : "FAIL"}`);
console.log("");
console.log(`Regression detail (${regressions.length} items):`);
for (const r of regressions) {
  const smoke = r.is_smoke ? " [SMOKE]" : "";
  const collapsed = r.collapsed_match ? " (collapsed-OK)" : "";
  console.log(`  ✗ row ${r.source_row_id} ${r.location}${smoke}: ${r.sb0_category} → ${r.iter1_category}${collapsed}`);
}
