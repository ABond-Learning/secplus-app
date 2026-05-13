// Audit D Sub-batch 0 — supervisor-Claude verdicts ingest + analysis.
//
// Inputs:
//   .audit-working/audit-d-calibration/sample-selection.json
//   .audit-working/audit-d-calibration/keyword-screen-results.json
//   .audit-working/audit-d-calibration/llm-verdicts.json       (script Sonnet)
//   .audit-working/audit-d-calibration/supervisor-verdicts.json (supervisor Claude)
//
// Outputs:
//   .audit-working/audit-d-calibration/unblinded-comparison.csv
//   .audit-working/audit-d-calibration/agreement-metrics.json
//
// Computes:
//   - Strict 6-way agreement (exact category match)
//   - Collapsed agreement: partial-adjacent + out-of-source → "not-in-transcript"
//     (partial-depth kept separate from in-source; out-of-syllabus + ambiguous-call
//     kept separate)
//   - Per-disagreement detail with collapsed-match flag
//
// Usage: node scripts/audit-d-ingest-supervisor.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-calibration");

const sample     = JSON.parse(readFileSync(resolve(OUT_DIR, "sample-selection.json"), "utf8"));
const keyword    = JSON.parse(readFileSync(resolve(OUT_DIR, "keyword-screen-results.json"), "utf8"));
const llm        = JSON.parse(readFileSync(resolve(OUT_DIR, "llm-verdicts.json"), "utf8"));
const supervisor = JSON.parse(readFileSync(resolve(OUT_DIR, "supervisor-verdicts.json"), "utf8"));

if (supervisor.length !== sample.items.length) {
  throw new Error(`Item count mismatch: ${supervisor.length} supervisor verdicts vs ${sample.items.length} sample items`);
}

const keyOf = (l) => `${l.section}|${l.video}|${l.type}|${l.index}`;
const llmByKey = new Map(llm.verdicts.map(v => [keyOf(v.location), v]));
const kwByKey  = new Map(keyword.map(k => [keyOf(k.location), k]));

function collapseCategory(c) {
  if (c === "partial-adjacent" || c === "out-of-source") return "not-in-transcript";
  return c;
}

function describeSubject(s) {
  if (s.type === "match") return s.item.answer;
  if (s.type === "cram")  return s.item.term;
  return (s.item.q || "").slice(0, 80);
}

const rows = sample.items.map((s, i) => {
  const rid = i + 1;
  const sup = supervisor.find(v => v.row_id === rid);
  const scr = llmByKey.get(keyOf(s));
  const kw  = kwByKey.get(keyOf(s));
  if (!sup) throw new Error(`Missing supervisor verdict for row_id ${rid}`);
  if (!scr) throw new Error(`Missing script verdict for ${keyOf(s)}`);

  const strict_match = scr.verdict.category === sup.category;
  const collapsed_match = collapseCategory(scr.verdict.category) === collapseCategory(sup.category);

  return {
    row_id: rid,
    location: `§${s.video} ${s.type}[${s.index}]`,
    type: s.type,
    role: s.role,
    domain: s.section.split(".")[0],
    subject: describeSubject(s),
    citation: s.messer_video_citation,
    script_category: scr.verdict.category,
    script_confidence: scr.verdict.confidence,
    script_fix_direction: scr.verdict.fix_direction,
    supervisor_category: sup.category,
    supervisor_confidence: sup.confidence,
    supervisor_fix_direction: sup.fix_direction,
    keyword_flag: kw ? (kw.flag || kw.stage || "n/a") : "n/a",
    strict_match,
    collapsed_match,
  };
});

const strictAgree = rows.filter(r => r.strict_match).length;
const collapsedAgree = rows.filter(r => r.collapsed_match).length;
const total = rows.length;

const disagreements = rows.filter(r => !r.strict_match);
const collapsedOnly = disagreements.filter(r => r.collapsed_match);
const trueDisagreements = disagreements.filter(r => !r.collapsed_match);

// ─── Unblinded comparison CSV ────────────────────────────────────────
function csvEscape(s) {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
const header = [
  "row_id", "domain", "location", "type", "role", "subject", "citation",
  "script_category", "script_confidence", "script_fix_direction",
  "supervisor_category", "supervisor_confidence", "supervisor_fix_direction",
  "keyword_flag", "strict_agree_Y_N", "collapsed_agree_Y_N",
];
const csvRows = [header];
for (const r of rows) {
  csvRows.push([
    r.row_id, r.domain, r.location, r.type, r.role, r.subject, r.citation,
    r.script_category, r.script_confidence, r.script_fix_direction,
    r.supervisor_category, r.supervisor_confidence, r.supervisor_fix_direction,
    r.keyword_flag,
    r.strict_match ? "Y" : "N",
    r.collapsed_match ? "Y" : "N",
  ].map(csvEscape));
}
writeFileSync(resolve(OUT_DIR, "unblinded-comparison.csv"), csvRows.map(r => r.join(",")).join("\n") + "\n");

// ─── Distribution counts ─────────────────────────────────────────────
const scriptDist = {};
const supDist = {};
for (const r of rows) {
  scriptDist[r.script_category]    = (scriptDist[r.script_category]    || 0) + 1;
  supDist[r.supervisor_category]   = (supDist[r.supervisor_category]   || 0) + 1;
}

// ─── Metrics JSON ────────────────────────────────────────────────────
const metrics = {
  generated: new Date().toISOString(),
  total,
  strict: {
    agree: strictAgree,
    rate: +(strictAgree / total).toFixed(4),
    rate_pct: +((strictAgree / total) * 100).toFixed(1),
  },
  collapsed: {
    agree: collapsedAgree,
    rate: +(collapsedAgree / total).toFixed(4),
    rate_pct: +((collapsedAgree / total) * 100).toFixed(1),
    definition: "partial-adjacent + out-of-source → 'not-in-transcript'; partial-depth kept separate from in-source",
  },
  distributions: {
    script_category: scriptDist,
    supervisor_category: supDist,
  },
  disagreements_strict: disagreements.map(d => ({
    row_id: d.row_id,
    location: d.location,
    subject: d.subject,
    script: `${d.script_category} / ${d.script_confidence}`,
    supervisor: `${d.supervisor_category} / ${d.supervisor_confidence}`,
    collapsed_match: d.collapsed_match,
  })),
  disagreements_after_collapse: trueDisagreements.length,
  disagreements_collapsed_resolved: collapsedOnly.length,
};
writeFileSync(resolve(OUT_DIR, "agreement-metrics.json"), JSON.stringify(metrics, null, 2));

// ─── Console summary ─────────────────────────────────────────────────
console.log("AUDIT D SUB-BATCH 0 — AGREEMENT METRICS");
console.log("");
console.log(`Total items:                   ${total}`);
console.log(`Strict 6-way agreement:        ${strictAgree}/${total} = ${metrics.strict.rate_pct}%`);
console.log(`Collapsed agreement:           ${collapsedAgree}/${total} = ${metrics.collapsed.rate_pct}%`);
console.log(`  Collapse rule: partial-adjacent + out-of-source → 'not-in-transcript'`);
console.log("");
console.log(`Disagreements (strict):        ${disagreements.length}`);
console.log(`  - resolved by collapse:      ${collapsedOnly.length}`);
console.log(`  - true disagreements:        ${trueDisagreements.length}`);
console.log("");
console.log("Script category distribution:    " + JSON.stringify(scriptDist));
console.log("Supervisor category distribution:" + " " + JSON.stringify(supDist));
console.log("");
console.log("Per-disagreement detail:");
for (const d of disagreements) {
  const r = d.collapsed_match ? "[collapse-OK]" : "[true mismatch]";
  console.log(`  ${r} row ${d.row_id} (${d.location}, ${d.subject})`);
  console.log(`     script:     ${d.script_category} / ${d.script_confidence}`);
  console.log(`     supervisor: ${d.supervisor_category} / ${d.supervisor_confidence}`);
}
