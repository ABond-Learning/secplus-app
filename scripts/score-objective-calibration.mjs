// Task 1g.3 — Calibration scorer.
//
// Reads three already-on-disk inputs, joins them on `id`, and writes a
// numbers-only markdown report. $0 — pure read + compare + emit. No API
// calls. No pass/fail gate; the supervisor reads the gate.
//
// Inputs (paths fixed; the scorer is a one-shot calibration tool, not a
// reusable judge — no CLI args needed):
//   .audit-working/sb-1g-3/calibration-verdicts.json   (judge v1)
//   .audit-working/sb-1g-3/blind-reader-verdicts.json  (second reader, 30)
//   .audit-working/sb-1g-3/anchor-ground-truth.json    (Aiden's 5 anchors)
// Output:
//   .audit-working/sb-1g-3/calibration-scorecard.md

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const SB = resolve(repo, ".audit-working/sb-1g-3");

const JUDGE_PATH  = resolve(SB, "calibration-verdicts.json");
const BLIND_PATH  = resolve(SB, "blind-reader-verdicts.json");
const ANCHOR_PATH = resolve(SB, "anchor-ground-truth.json");
const OUT_PATH    = resolve(SB, "calibration-scorecard.md");

const judgeRaw  = JSON.parse(readFileSync(JUDGE_PATH,  "utf8"));
const blindRaw  = JSON.parse(readFileSync(BLIND_PATH,  "utf8"));
const anchorRaw = JSON.parse(readFileSync(ANCHOR_PATH, "utf8"));

// ─── Normalise + join on id ─────────────────────────────────────────
const judgeById = new Map();
for (const v of judgeRaw.verdicts) {
  judgeById.set(v.id, {
    id: v.id,
    code: v.verdict.objective_code,
    confidence: v.verdict.confidence,
    ambiguity_flag: v.verdict.ambiguity_flag,
  });
}
const blindById = new Map();
for (const v of blindRaw) {
  blindById.set(v.id, {
    id: v.id,
    code: v.objective_code,
    ambiguity_flag: v.ambiguity_flag,
  });
}
const anchorById = new Map();
for (const v of anchorRaw) {
  anchorById.set(v.id, { id: v.id, code: v.objective_code });
}

// Sanity: every blind id has a judge counterpart; every anchor id has both.
for (const id of blindById.keys()) {
  if (!judgeById.has(id)) throw new Error(`blind id ${id} not in judge`);
}
for (const id of anchorById.keys()) {
  if (!judgeById.has(id))  throw new Error(`anchor id ${id} not in judge`);
  if (!blindById.has(id))  throw new Error(`anchor id ${id} not in blind`);
}

const domain = (code) => code.split(".")[0];

// ─── A. Judge vs blind reader (all 30) ──────────────────────────────
const all30Ids = [...judgeById.keys()].sort();
let strictAgree = 0;
let domainAgree = 0;
const disagreements = [];
for (const id of all30Ids) {
  const j = judgeById.get(id);
  const b = blindById.get(id);
  const strict = j.code === b.code;
  const sameDomain = domain(j.code) === domain(b.code);
  if (strict) strictAgree++;
  if (sameDomain) domainAgree++;
  if (!strict) {
    disagreements.push({
      id,
      judge_code: j.code,
      blind_code: b.code,
      judge_flag: j.ambiguity_flag,
      blind_flag: b.ambiguity_flag,
      same_domain: sameDomain,
      judge_confidence: j.confidence,
    });
  }
}
const strictPct = +((strictAgree / all30Ids.length) * 100).toFixed(1);
const domainPct = +((domainAgree / all30Ids.length) * 100).toFixed(1);

// ─── B. Anchor smoke check ──────────────────────────────────────────
const anchorRows = [];
let anchorMatches = 0;
for (const id of [...anchorById.keys()].sort()) {
  const j = judgeById.get(id);
  const a = anchorById.get(id);
  const match = j.code === a.code;
  const sameDomain = domain(j.code) === domain(a.code);
  if (match) anchorMatches++;
  anchorRows.push({
    id,
    judge_code: j.code,
    anchor_code: a.code,
    match,
    same_domain: sameDomain,
  });
}

// ─── C. Ambiguity cross-tab ─────────────────────────────────────────
const judgeFlagged = all30Ids.filter((id) => judgeById.get(id).ambiguity_flag);
const blindFlagged = all30Ids.filter((id) => blindById.get(id).ambiguity_flag);
const flagDiffers = all30Ids
  .filter((id) => judgeById.get(id).ambiguity_flag !== blindById.get(id).ambiguity_flag)
  .map((id) => ({
    id,
    judge_flag: judgeById.get(id).ambiguity_flag,
    blind_flag: blindById.get(id).ambiguity_flag,
  }));

// ─── D. Confidence vs correctness (blind = comparison read) ────────
const judgeHighConfident       = all30Ids.filter((id) => judgeById.get(id).confidence === "high");
const judgeHighAndAgreed       = judgeHighConfident.filter((id) => judgeById.get(id).code === blindById.get(id).code);
const judgeHighAndDiverged     = judgeHighConfident.filter((id) => judgeById.get(id).code !== blindById.get(id).code);
const totalDisagreements       = disagreements.length;
const disagreedAndHighConf     = disagreements.filter((d) => d.judge_confidence === "high").length;

// ─── Emit scorecard ─────────────────────────────────────────────────
const NL = "\n";
const lines = [];
const p = (s = "") => lines.push(s);

p(`# Calibration scorecard — S-1 (judge v1)`);
p();
p(`**Inputs joined on \`id\` (n=30 judge, n=30 blind, n=5 anchor):**`);
p(`- \`.audit-working/sb-1g-3/calibration-verdicts.json\` — judge v1`);
p(`- \`.audit-working/sb-1g-3/blind-reader-verdicts.json\` — blind reader`);
p(`- \`.audit-working/sb-1g-3/anchor-ground-truth.json\` — anchors`);
p();
p(`**$0** — pure comparison; no API calls. No pass/fail verdict applied; the gate read is the supervisor's.`);
p();
p(`---`);
p();

// A.
p(`## A. Judge vs blind reader (n=30)`);
p();
p(`| Metric                       | Count | % of 30 |`);
p(`|------------------------------|------:|--------:|`);
p(`| Strict agreement (exact X.Y) | ${strictAgree} | ${strictPct.toFixed(1)}% |`);
p(`| Domain-collapse agreement (same first digit) | ${domainAgree} | ${domainPct.toFixed(1)}% |`);
p(`| Disagreements                | ${disagreements.length} | ${(100 - strictPct).toFixed(1)}% |`);
p();
p(`### A.1 Every disagreement`);
p();
if (disagreements.length === 0) {
  p(`_(none)_`);
} else {
  p(`| id | judge | blind | judge_flag | blind_flag | same-domain |`);
  p(`|----|-------|-------|:----------:|:----------:|:-----------:|`);
  for (const d of disagreements) {
    p(`| ${d.id} | ${d.judge_code} | ${d.blind_code} | ${d.judge_flag} | ${d.blind_flag} | ${d.same_domain ? "yes" : "no"} |`);
  }
}
p();
p(`---`);
p();

// B.
p(`## B. Anchor smoke check (n=5)`);
p();
p(`Exact match: **${anchorMatches} / 5**`);
p();
p(`| id | judge | anchor | match | same-domain |`);
p(`|----|-------|--------|:-----:|:-----------:|`);
for (const r of anchorRows) {
  p(`| ${r.id} | ${r.judge_code} | ${r.anchor_code} | ${r.match ? "yes" : "no"} | ${r.same_domain ? "yes" : "no"} |`);
}
p();
p(`---`);
p();

// C.
p(`## C. Ambiguity cross-tab`);
p();
p(`| Source           | flagged true | total |`);
p(`|------------------|-------------:|------:|`);
p(`| Judge            | ${judgeFlagged.length} | 30 |`);
p(`| Blind reader     | ${blindFlagged.length} | 30 |`);
p();
p(`Judge-flagged ids: ${judgeFlagged.length === 0 ? "_(none)_" : judgeFlagged.join(", ")}`);
p();
p(`Blind-flagged ids: ${blindFlagged.length === 0 ? "_(none)_" : blindFlagged.join(", ")}`);
p();
p(`### C.1 Ids where the two flags differ (n=${flagDiffers.length})`);
p();
if (flagDiffers.length === 0) {
  p(`_(none — flags match on all 30)_`);
} else {
  p(`| id | judge_flag | blind_flag |`);
  p(`|----|:----------:|:----------:|`);
  for (const r of flagDiffers) p(`| ${r.id} | ${r.judge_flag} | ${r.blind_flag} |`);
}
p();
p(`(For the record, not a gate. Judge flagged zero; the differences are exactly the blind reader's ${blindFlagged.length} flagged items.)`);
p();
p(`---`);
p();

// D.
p(`## D. Confidence vs correctness (blind = comparison read)`);
p();
p(`| Slice                                         | Count |`);
p(`|-----------------------------------------------|------:|`);
p(`| Judge verdicts at confidence=high             | ${judgeHighConfident.length} / 30 |`);
p(`| ...of which agreed with blind                 | ${judgeHighAndAgreed.length} |`);
p(`| ...of which diverged from blind               | ${judgeHighAndDiverged.length} |`);
p(`| Total disagreements                           | ${totalDisagreements} |`);
p(`| ...at judge confidence=high (confident-and-divergent) | ${disagreedAndHighConf} |`);
p();
if (judgeHighAndDiverged.length > 0) {
  p(`### D.1 Confident-and-divergent ids`);
  p();
  p(`| id | judge | blind | judge_conf | same-domain |`);
  p(`|----|-------|-------|:----------:|:-----------:|`);
  for (const id of judgeHighAndDiverged) {
    const j = judgeById.get(id);
    const b = blindById.get(id);
    const sd = domain(j.code) === domain(b.code);
    p(`| ${id} | ${j.code} | ${b.code} | ${j.confidence} | ${sd ? "yes" : "no"} |`);
  }
  p();
}
p(`---`);
p();
p(`_Generated by \`scripts/score-objective-calibration.mjs\`._`);
p();

writeFileSync(OUT_PATH, lines.join(NL), "utf8");
console.log(`scorecard written: ${OUT_PATH}`);
console.log();
console.log(`A. strict agreement: ${strictAgree}/30 (${strictPct.toFixed(1)}%)`);
console.log(`A. domain-collapse:  ${domainAgree}/30 (${domainPct.toFixed(1)}%)`);
console.log(`A. disagreements:    ${disagreements.length}`);
console.log(`B. anchor matches:   ${anchorMatches}/5`);
console.log(`C. judge flags:      ${judgeFlagged.length}, blind flags: ${blindFlagged.length}, differ: ${flagDiffers.length}`);
console.log(`D. confident-and-divergent: ${disagreedAndHighConf}/${totalDisagreements}`);
