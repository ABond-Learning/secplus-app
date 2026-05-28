// Task 1g.3 — Corpus scorer (judge vs fresh blind reader, n=500).
//
// Reads two on-disk inputs, joins them on `id`, and writes a numbers-only
// markdown report. $0 — pure read + compare + emit. No API. No pass/fail
// gate in the script (the supervisor reads the gate).
//
// Separate from the calibration scorer:
//   - the calibration scorer joins three inputs (judge + blind + anchor)
//     and reports on n=30 + 5-anchor smoke + confidence-vs-correctness;
//   - this scorer joins two inputs (judge + blind) at n=500 and reports
//     disagreement clustering + cross-domain disagreements, which the
//     calibration version does not have.
//
// Inputs (paths fixed):
//   .audit-working/sb-1g-3/corpus-verdicts.json        (judge,   500)
//   .audit-working/sb-1g-3/corpus-blind-verdicts.json  (blind,   500)
// Output:
//   .audit-working/sb-1g-3/corpus-scorecard.md

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const SB = resolve(repo, ".audit-working/sb-1g-3");

const JUDGE_PATH = resolve(SB, "corpus-verdicts.json");
const BLIND_PATH = resolve(SB, "corpus-blind-verdicts.json");
const OUT_PATH   = resolve(SB, "corpus-scorecard.md");

// ─── Load + validate ───────────────────────────────────────────────
if (!existsSync(JUDGE_PATH)) {
  console.error(`FATAL: judge verdicts not found at ${JUDGE_PATH}`);
  process.exit(1);
}
if (!existsSync(BLIND_PATH)) {
  console.error(`FATAL: blind-reader verdicts not found at ${BLIND_PATH}`);
  process.exit(1);
}

const judgeRaw = JSON.parse(readFileSync(JUDGE_PATH, "utf8"));
const blindRaw = JSON.parse(readFileSync(BLIND_PATH, "utf8"));

if (!Array.isArray(judgeRaw?.verdicts) || judgeRaw.verdicts.length !== 500) {
  console.error(
    `FATAL: judge verdicts shape — expected verdicts[] of length 500, got ${
      Array.isArray(judgeRaw?.verdicts) ? judgeRaw.verdicts.length : "non-array"
    }`,
  );
  process.exit(1);
}
if (!Array.isArray(blindRaw) || blindRaw.length !== 500) {
  console.error(
    `FATAL: blind verdicts — expected flat array of length 500, got ${
      Array.isArray(blindRaw) ? blindRaw.length : "non-array"
    }`,
  );
  process.exit(1);
}

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
  if (!v?.id || typeof v.objective_code !== "string") {
    console.error(`FATAL: blind verdict missing id or objective_code: ${JSON.stringify(v)}`);
    process.exit(1);
  }
  if (typeof v.ambiguity_flag !== "boolean") {
    console.error(`FATAL: blind verdict missing boolean ambiguity_flag for id ${v.id}`);
    process.exit(1);
  }
  if (blindById.has(v.id)) {
    console.error(`FATAL: duplicate id in blind verdicts: ${v.id}`);
    process.exit(1);
  }
  blindById.set(v.id, {
    id: v.id,
    code: v.objective_code,
    ambiguity_flag: v.ambiguity_flag,
  });
}
if (judgeById.size !== 500) {
  console.error(`FATAL: judge unique ids = ${judgeById.size}, expected 500`);
  process.exit(1);
}
if (blindById.size !== 500) {
  console.error(`FATAL: blind unique ids = ${blindById.size}, expected 500`);
  process.exit(1);
}
const missingInBlind = [...judgeById.keys()].filter((id) => !blindById.has(id));
const extraInBlind = [...blindById.keys()].filter((id) => !judgeById.has(id));
if (missingInBlind.length || extraInBlind.length) {
  console.error(`FATAL: id-set mismatch — missing in blind: ${missingInBlind.length}, extra in blind: ${extraInBlind.length}`);
  if (missingInBlind.length) console.error(`  first missing: ${missingInBlind.slice(0,5).join(", ")}`);
  if (extraInBlind.length)   console.error(`  first extra:   ${extraInBlind.slice(0,5).join(", ")}`);
  process.exit(1);
}

const domain = (code) => code.split(".")[0];

// ─── Scoring ────────────────────────────────────────────────────────
const ids = [...judgeById.keys()].sort();
let strictAgree = 0;
let domainAgree = 0;
const disagreements = [];
for (const id of ids) {
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
      same_domain: sameDomain,
      judge_confidence: j.confidence,
    });
  }
}
const strictPct = +((strictAgree / ids.length) * 100).toFixed(1);
const domainPct = +((domainAgree / ids.length) * 100).toFixed(1);

// D. Clustering by code.
const byJudgeCode = new Map();
const byBlindCode = new Map();
for (const d of disagreements) {
  byJudgeCode.set(d.judge_code, (byJudgeCode.get(d.judge_code) ?? 0) + 1);
  byBlindCode.set(d.blind_code, (byBlindCode.get(d.blind_code) ?? 0) + 1);
}

// Code lookup tables — the full 28-code set, in canonical order.
const ALL_CODES = [
  "1.1","1.2","1.3","1.4",
  "2.1","2.2","2.3","2.4","2.5",
  "3.1","3.2","3.3","3.4",
  "4.1","4.2","4.3","4.4","4.5","4.6","4.7","4.8","4.9",
  "5.1","5.2","5.3","5.4","5.5","5.6",
];

// E. Cross-domain disagreements.
const crossDomain = disagreements.filter((d) => !d.same_domain);

// ─── Emit report ────────────────────────────────────────────────────
const NL = "\n";
const lines = [];
const p = (s = "") => lines.push(s);

p(`# Corpus scorecard — judge (n=500) vs fresh blind reader (n=500)`);
p();
p(`**Inputs joined on \`id\`:**`);
p(`- \`.audit-working/sb-1g-3/corpus-verdicts.json\` — judge`);
p(`- \`.audit-working/sb-1g-3/corpus-blind-verdicts.json\` — fresh blind reader`);
p();
p(`**$0** — pure comparison; no API. No pass/fail verdict applied; the gate read is the supervisor's.`);
p();
p(`---`);
p();

// A.
p(`## A. Strict agreement (exact X.Y match)`);
p();
p(`| Metric | Count | % of 500 |`);
p(`|--------|------:|---------:|`);
p(`| Strict agreement | ${strictAgree} | ${strictPct.toFixed(1)}% |`);
p(`| Disagreements    | ${disagreements.length} | ${(100 - strictPct).toFixed(1)}% |`);
p();
p(`---`);
p();

// B.
p(`## B. Domain-collapse agreement (same first digit)`);
p();
p(`| Metric | Count | % of 500 |`);
p(`|--------|------:|---------:|`);
p(`| Domain-collapse agreement | ${domainAgree} | ${domainPct.toFixed(1)}% |`);
p(`| Same X.Y wrong (in-domain misses) | ${strictAgree} → ${domainAgree}: ${domainAgree - strictAgree} | ${((domainAgree - strictAgree) / 500 * 100).toFixed(1)}% |`);
p(`| Cross-domain disagreements | ${crossDomain.length} | ${(crossDomain.length / 500 * 100).toFixed(1)}% |`);
p();
p(`---`);
p();

// C. Full disagreement list.
p(`## C. Full disagreement list (n=${disagreements.length})`);
p();
if (disagreements.length === 0) {
  p(`_(none)_`);
} else {
  p(`| id | judge | blind | same-domain | judge_conf |`);
  p(`|----|-------|-------|:-----------:|:----------:|`);
  for (const d of disagreements) {
    p(`| ${d.id} | ${d.judge_code} | ${d.blind_code} | ${d.same_domain ? "yes" : "**no**"} | ${d.judge_confidence} |`);
  }
}
p();
p(`---`);
p();

// D. Clustering.
p(`## D. Disagreement clustering by objective code`);
p();
p(`### D.1 By judge_code (where the judge placed the item)`);
p();
p(`| code | disagreement count |`);
p(`|------|-------------------:|`);
let totalJudgeBucket = 0;
for (const c of ALL_CODES) {
  const n = byJudgeCode.get(c) ?? 0;
  if (n > 0) {
    p(`| ${c} | ${n} |`);
    totalJudgeBucket += n;
  }
}
p(`| _(codes with 0 disagreements)_ | _${ALL_CODES.length - [...byJudgeCode.keys()].length} codes_ |`);
p(`| **total** | **${totalJudgeBucket}** |`);
p();
p(`### D.2 By blind_code (where the blind reader placed the item)`);
p();
p(`| code | disagreement count |`);
p(`|------|-------------------:|`);
let totalBlindBucket = 0;
for (const c of ALL_CODES) {
  const n = byBlindCode.get(c) ?? 0;
  if (n > 0) {
    p(`| ${c} | ${n} |`);
    totalBlindBucket += n;
  }
}
p(`| _(codes with 0 disagreements)_ | _${ALL_CODES.length - [...byBlindCode.keys()].length} codes_ |`);
p(`| **total** | **${totalBlindBucket}** |`);
p();
p(`---`);
p();

// E. Cross-domain only.
p(`## E. Cross-domain disagreements only (n=${crossDomain.length})`);
p();
p(`These are the disagreements that domain-collapse does **not** absorb — different first digit.`);
p();
if (crossDomain.length === 0) {
  p(`_(none)_`);
} else {
  p(`| id | judge | blind | judge_conf |`);
  p(`|----|-------|-------|:----------:|`);
  for (const d of crossDomain) {
    p(`| ${d.id} | ${d.judge_code} | ${d.blind_code} | ${d.judge_confidence} |`);
  }
  p();
  p(`### E.1 Cross-domain disagreement pair counts`);
  p();
  const pairs = new Map();
  for (const d of crossDomain) {
    const key = `${domain(d.judge_code)}↔${domain(d.blind_code)}`;
    pairs.set(key, (pairs.get(key) ?? 0) + 1);
  }
  p(`| domain pair (judge↔blind) | count |`);
  p(`|---------------------------|------:|`);
  for (const [k, v] of [...pairs.entries()].sort((a,b) => b[1] - a[1])) {
    p(`| ${k} | ${v} |`);
  }
}
p();
p(`---`);
p();
p(`_Generated by \`scripts/score-objective-corpus.mjs\`._`);
p();

writeFileSync(OUT_PATH, lines.join(NL), "utf8");
console.log(`scorecard written: ${OUT_PATH}`);
console.log();
console.log(`A. strict agreement: ${strictAgree}/500 (${strictPct.toFixed(1)}%)`);
console.log(`B. domain-collapse:  ${domainAgree}/500 (${domainPct.toFixed(1)}%)`);
console.log(`C. disagreements:    ${disagreements.length}`);
console.log(`E. cross-domain:     ${crossDomain.length}`);
