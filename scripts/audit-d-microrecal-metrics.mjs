// Audit D Sub-batch 1 pre-flight — micro-recalibration metrics.
//
// Computes Subset 1 + Subset 2 + combined agreement metrics for the
// 12-item micro-recalibration:
//
//   Subset 1 (7 items, role=subset-1-disagree) — ground truth is the
//     Sub-batch 0 supervisor-Claude verdicts on the SAME rows.
//     Source: .audit-working/audit-d-calibration/supervisor-verdicts.json
//
//   Subset 2 (5 items, role=subset-2-fresh) — ground truth is a NEW
//     supervisor-Claude pass on these 5 fresh items.
//     Source: .audit-working/audit-d-sub-batch-1-preflight/
//             microrecal-supervisor-verdicts.json
//
// Honors D-H: row 18 (containers vs VMs scenario) is genuinely ambiguous
// between partial-depth and in-source; either is treated as a pass.
//
// Outputs:
//   .audit-working/audit-d-sub-batch-1-preflight/microrecal-metrics-<tag>.json
//   .audit-working/audit-d-sub-batch-1-preflight/microrecal-comparison-<tag>.csv
//
// Usage:
//   node scripts/audit-d-microrecal-metrics.mjs
//     (defaults: --verdicts microrecal-verdicts.json, --tag current)
//   node scripts/audit-d-microrecal-metrics.mjs \
//     --verdicts microrecal-verdicts-iter0.json --tag iter0

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const PREFLIGHT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");
const SB0_DIR = resolve(repo, ".audit-working/audit-d-calibration");

// ─── CLI args ────────────────────────────────────────────────────────
function parseArgs() {
  const out = { verdicts: "microrecal-verdicts.json", tag: "current" };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--verdicts" && i + 1 < process.argv.length) out.verdicts = process.argv[++i];
    else if (a === "--tag" && i + 1 < process.argv.length) out.tag = process.argv[++i];
  }
  return out;
}
const args = parseArgs();

// ─── Inputs ─────────────────────────────────────────────────────────
const sample = JSON.parse(readFileSync(resolve(PREFLIGHT_DIR, "microrecal-sample.json"), "utf8"));
const verdicts = JSON.parse(readFileSync(resolve(PREFLIGHT_DIR, args.verdicts), "utf8"));

// Subset 1 ground truth — Sub-batch 0 supervisor verdicts on those rows
const sb0SupVerdicts = JSON.parse(readFileSync(resolve(SB0_DIR, "supervisor-verdicts.json"), "utf8"));
// Subset 2 ground truth — micro-recal supervisor verdicts on the 5 fresh items
const subset2SupVerdicts = JSON.parse(readFileSync(
  resolve(PREFLIGHT_DIR, "microrecal-supervisor-verdicts.json"),
  "utf8",
));

const DH_ROW_ID = 18;  // D-H: row 18 (containers vs VMs) — accept either category as pass

// ─── Helpers ────────────────────────────────────────────────────────
const keyOf = l => `${l.section}|${l.video}|${l.type}|${l.index}`;

function collapseCategory(c) {
  if (c === "partial-adjacent" || c === "out-of-source") return "not-in-transcript";
  return c;
}

function describeSubject(s) {
  if (s.type === "match") return s.item.answer;
  if (s.type === "cram")  return s.item.term;
  return (s.item.q || "").slice(0, 80);
}

const verdictByKey = new Map(verdicts.verdicts.map(v => [keyOf(v.location), v]));

// ─── Build per-row evaluation ───────────────────────────────────────
const rows = [];
for (let i = 0; i < sample.items.length; i++) {
  const s = sample.items[i];
  const microrecalRowId = i + 1;
  const scrV = verdictByKey.get(keyOf(s));
  if (!scrV) throw new Error(`Missing script verdict for ${keyOf(s)}`);

  let sup, supSource, dh = false;
  if (s.role === "subset-1-disagree") {
    // Sub-batch 0 row_id is preserved on the sample item as source_row_id
    sup = sb0SupVerdicts.find(v => v.row_id === s.source_row_id);
    supSource = "sub-batch-0 supervisor";
    if (s.source_row_id === DH_ROW_ID) dh = true;
  } else if (s.role === "subset-2-fresh") {
    // Map by Subset 2 ordinal position
    const subset2Index = sample.items.filter(x => x.role === "subset-2-fresh").indexOf(s);
    sup = subset2SupVerdicts.find(v => v.row_id === subset2Index + 1);
    supSource = "micro-recal supervisor (fresh)";
  } else {
    throw new Error(`Unknown role: ${s.role}`);
  }
  if (!sup) throw new Error(`Missing supervisor verdict for ${keyOf(s)}`);

  const strict_match = scrV.verdict.category === sup.category;
  const collapsed_match = collapseCategory(scrV.verdict.category) === collapseCategory(sup.category);
  // D-H rule: row 18 → accept either category as pass
  const strict_pass    = dh ? true : strict_match;
  const collapsed_pass = dh ? true : collapsed_match;

  rows.push({
    microrecal_row_id: microrecalRowId,
    source_row_id: s.source_row_id || null,
    role: s.role,
    location: `§${s.video} ${s.type}[${s.index}]`,
    domain: s.section.split(".")[0],
    type: s.type,
    subject: describeSubject(s),
    citation: s.messer_video_citation,
    script_category:    scrV.verdict.category,
    script_confidence:  scrV.verdict.confidence,
    script_fix:         scrV.verdict.fix_direction,
    structural_flag:    scrV.structural_flag,
    quote_retried:      !!scrV.quote_retried,
    supervisor_source:  supSource,
    sup_category:       sup.category,
    sup_confidence:     sup.confidence,
    sup_fix:            sup.fix_direction,
    strict_match,
    collapsed_match,
    dh_excluded:        dh,
    strict_pass,
    collapsed_pass,
  });
}

// ─── Aggregate ──────────────────────────────────────────────────────
const subset1 = rows.filter(r => r.role === "subset-1-disagree");
const subset2 = rows.filter(r => r.role === "subset-2-fresh");

const subset1Excl = subset1.filter(r => !r.dh_excluded);   // 6 items, D-H exclusion
const subset1Strict = subset1Excl.filter(r => r.strict_pass).length;
const subset1Collapsed = subset1Excl.filter(r => r.collapsed_pass).length;
const subset2Strict = subset2.filter(r => r.strict_pass).length;
const subset2Collapsed = subset2.filter(r => r.collapsed_pass).length;

const combinedExcl = [...subset1Excl, ...subset2];
const combinedStrict = combinedExcl.filter(r => r.strict_pass).length;
const combinedCollapsed = combinedExcl.filter(r => r.collapsed_pass).length;

// Distributions
const scriptCatDist = {};
const supCatDist = {};
const scriptConfDist = {};
const supConfDist = {};
for (const r of rows) {
  scriptCatDist[r.script_category] = (scriptCatDist[r.script_category] || 0) + 1;
  supCatDist[r.sup_category]       = (supCatDist[r.sup_category]       || 0) + 1;
  scriptConfDist[r.script_confidence] = (scriptConfDist[r.script_confidence] || 0) + 1;
  supConfDist[r.sup_confidence]       = (supConfDist[r.sup_confidence]       || 0) + 1;
}

// Paraphrase rate (structural flag accounting)
const paraphraseFlags = rows.filter(r => r.structural_flag && r.structural_flag.startsWith("quote-not-verbatim")).length;
const paraphraseRate = paraphraseFlags / rows.length;
const retriedCount = rows.filter(r => r.quote_retried).length;

// Inconsistency check: category=out-of-source + fix=move-to-correct-video
const inconsistentVerdicts = rows.filter(r =>
  r.script_category !== "partial-adjacent" && r.script_fix === "move-to-correct-video"
).length;

// ─── Pass criteria check ────────────────────────────────────────────
const passCriteria = {
  subset_1_strict: { actual: subset1Strict, threshold: 5, total: subset1Excl.length, pass: subset1Strict >= 5 },
  subset_2_strict: { actual: subset2Strict, threshold: 3, total: subset2.length, pass: subset2Strict >= 3 },
  subset_2_collapsed: { actual: subset2Collapsed, threshold: 4, total: subset2.length, pass: subset2Collapsed >= 4 },
  paraphrase_rate:  { actual: +paraphraseRate.toFixed(4), threshold: 0.10, pass: paraphraseRate < 0.10 },
  cache_hit_rate:   { actual: verdicts.metadata.cache_stats?.cache_hit_rate_after_first || null, threshold: 0.90, pass: (verdicts.metadata.cache_stats?.cache_hit_rate_after_first || 0) >= 0.90 },
};
const overallPass = Object.values(passCriteria).every(c => c.pass);

// ─── Output ─────────────────────────────────────────────────────────
const metrics = {
  generated: new Date().toISOString(),
  tag: args.tag,
  verdicts_file: args.verdicts,
  total: rows.length,
  subset_1: {
    total: subset1.length,
    excluded_DH: subset1.length - subset1Excl.length,
    strict_match: subset1Strict,
    strict_pct: +(subset1Strict / subset1Excl.length * 100).toFixed(1),
    collapsed_match: subset1Collapsed,
    collapsed_pct: +(subset1Collapsed / subset1Excl.length * 100).toFixed(1),
    note: "agreement vs Sub-batch 0 supervisor verdicts; row 18 excluded per D-H",
  },
  subset_2: {
    total: subset2.length,
    strict_match: subset2Strict,
    strict_pct: +(subset2Strict / subset2.length * 100).toFixed(1),
    collapsed_match: subset2Collapsed,
    collapsed_pct: +(subset2Collapsed / subset2.length * 100).toFixed(1),
    note: "agreement vs micro-recal supervisor verdicts (5 fresh items)",
  },
  combined: {
    total: combinedExcl.length,
    strict_match: combinedStrict,
    strict_pct: +(combinedStrict / combinedExcl.length * 100).toFixed(1),
    collapsed_match: combinedCollapsed,
    collapsed_pct: +(combinedCollapsed / combinedExcl.length * 100).toFixed(1),
  },
  distributions: {
    script_category: scriptCatDist,
    supervisor_category: supCatDist,
    script_confidence: scriptConfDist,
    supervisor_confidence: supConfDist,
  },
  paraphrase_rate: +paraphraseRate.toFixed(4),
  paraphrase_flags: paraphraseFlags,
  quote_retries: retriedCount,
  inconsistent_fix_direction: inconsistentVerdicts,  // category != partial-adjacent + fix == move-to-correct-video
  cache_hit_rate: verdicts.metadata.cache_stats?.cache_hit_rate_after_first || null,
  pass_criteria: passCriteria,
  overall_pass: overallPass,
  per_row: rows,
};

writeFileSync(
  resolve(PREFLIGHT_DIR, `microrecal-metrics-${args.tag}.json`),
  JSON.stringify(metrics, null, 2),
);

// CSV
function csvEscape(s) {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
const csvHeader = [
  "microrecal_row_id", "source_row_id", "role", "domain", "type", "location", "subject", "citation",
  "script_category", "script_confidence", "script_fix",
  "sup_category", "sup_confidence", "sup_fix",
  "structural_flag", "quote_retried", "dh_excluded", "strict_match", "collapsed_match", "strict_pass", "collapsed_pass",
];
const csvRows = [csvHeader.map(csvEscape).join(",")];
for (const r of rows) {
  csvRows.push(csvHeader.map(h => csvEscape(r[h])).join(","));
}
writeFileSync(
  resolve(PREFLIGHT_DIR, `microrecal-comparison-${args.tag}.csv`),
  csvRows.join("\n") + "\n",
);

// ─── Console summary ───────────────────────────────────────────────
console.log(`MICRO-RECAL METRICS — tag: ${args.tag}`);
console.log(`  Verdicts file: ${args.verdicts}`);
console.log("");
console.log(`Subset 1 (7 items, D-H excludes row 18 → 6 items):`);
console.log(`  Strict:    ${subset1Strict}/${subset1Excl.length} = ${metrics.subset_1.strict_pct}%   (threshold ≥5/6)`);
console.log(`  Collapsed: ${subset1Collapsed}/${subset1Excl.length} = ${metrics.subset_1.collapsed_pct}%`);
console.log("");
console.log(`Subset 2 (5 fresh items):`);
console.log(`  Strict:    ${subset2Strict}/${subset2.length} = ${metrics.subset_2.strict_pct}%   (threshold ≥3/5)`);
console.log(`  Collapsed: ${subset2Collapsed}/${subset2.length} = ${metrics.subset_2.collapsed_pct}%   (threshold ≥4/5)`);
console.log("");
console.log(`Combined (11 items, D-H excluded):`);
console.log(`  Strict:    ${combinedStrict}/${combinedExcl.length} = ${metrics.combined.strict_pct}%`);
console.log(`  Collapsed: ${combinedCollapsed}/${combinedExcl.length} = ${metrics.combined.collapsed_pct}%`);
console.log("");
console.log(`Distributions:`);
console.log(`  script category:    ${JSON.stringify(scriptCatDist)}`);
console.log(`  supervisor category: ${JSON.stringify(supCatDist)}`);
console.log(`  script confidence:  ${JSON.stringify(scriptConfDist)}`);
console.log(`  supervisor confidence: ${JSON.stringify(supConfDist)}`);
console.log("");
console.log(`Quote retries: ${retriedCount}/${rows.length} items`);
console.log(`Paraphrase rate (after retry): ${paraphraseFlags}/${rows.length} = ${(paraphraseRate*100).toFixed(1)}%   (threshold <10%)`);
console.log(`Cache hit rate (calls after first): ${metrics.cache_hit_rate !== null ? (metrics.cache_hit_rate*100).toFixed(1)+'%' : 'n/a'}   (threshold ≥90%)`);
console.log(`Internally inconsistent verdicts (category != partial-adjacent + fix == move-to-correct-video): ${inconsistentVerdicts}`);
console.log("");
console.log(`Pass criteria check:`);
for (const [name, c] of Object.entries(passCriteria)) {
  const mark = c.pass ? "✓" : "✗";
  console.log(`  ${mark} ${name}: actual ${c.actual} vs threshold ${c.threshold}`);
}
console.log("");
console.log(`OVERALL ${overallPass ? "PASS" : "FAIL"}`);
console.log("");
console.log(`Per-row strict/collapsed pass detail:`);
for (const r of rows) {
  const dh = r.dh_excluded ? " [D-H excluded]" : "";
  const s  = r.strict_pass ? "✓" : "✗";
  const c  = r.collapsed_pass ? "✓" : "✗";
  console.log(`  ${s} ${c} ${r.location} (${r.role}): ${r.script_category}/${r.script_confidence} vs sup ${r.sup_category}/${r.sup_confidence}${dh}`);
}
