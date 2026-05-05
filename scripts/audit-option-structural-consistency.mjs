// Audit A — within-question option structural consistency.
//
// For each MC and scenario, compares the 4 options on three structural
// dimensions and flags items where ONE option breaks the pattern set by the
// other THREE. This is DIFFERENT from the catalogue-wide 1.5x length-ratio
// audit (audit-length-tell-detail.mjs / audit-short-distractor-cohort.mjs):
// here the comparison is within a single question, not across the catalogue.
//
// Dimensions:
//   1. em-dash separator       (" — ", catalog convention for "Term — explanation")
//   2. parenthetical content   ("(SPF)", "(read-only)", etc.)
//   3. clause vs noun phrase   (word-count based — see below)
//   4. char-length outlier     (one option > 2x or < 0.5x the median of the
//                               OTHER three; only applied when that median
//                               is >= 25 chars, so very-short-option recall
//                               questions don't false-flag)
//
// Clause-vs-phrase detection (intentionally word-count-based, no POS tagging):
//   isShortPhrase = wordCount <= 6
//   isLongClause  = wordCount >= 9
//   The 7-8 word middle is treated as ambiguous (neither bucket). Threshold
//   chosen so the canonical pre-fix scen-2.2.5-0 case (4-word and 6-word noun-
//   phrase distractors versus 13-word descriptive correct answer) flags as a
//   3-short-1-long structural break.
//
// Lead-token-as-verb detection was attempted but produced too many false
// positives (e.g., "Allow listing" is a gerund-form term name, not an
// imperative — but "Allow" is in any reasonable verb list). Dropped.
//
// Severity:
//   HIGH    primary structural break + length outlier
//   MEDIUM  primary structural break alone OR length outlier alone
//   LOW     parenthetical break only (no primary break, no length outlier)
//
// "Primary" = em-dash break OR clause-vs-phrase break.
// Parenthetical is "minor" because options that just differ on whether they
// expand an acronym usually have no comprehension-cue impact.
//
// Output:
//   stdout                     summary counts + per-sub-objective breakdown
//   /tmp/audit-a-flags.txt     full per-item details, sorted HIGH→MEDIUM→LOW
//
// Idempotent. Diagnostic only — no questions.json changes.
//
// Usage: node scripts/audit-option-structural-consistency.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));

const OUT_FILE = "/tmp/audit-a-flags.txt";

const SHORT_PHRASE_MAX_WORDS = 6;
const LONG_CLAUSE_MIN_WORDS  = 9;
const LENGTH_RATIO_HIGH      = 2.0;  // outlier > 2x median of other 3
const LENGTH_RATIO_LOW       = 0.5;  // outlier < 0.5x median of other 3
const LENGTH_MIN_MEDIAN      = 25;   // skip outlier check when other-3 median < this

// ─── Feature extraction ──────────────────────────────────────────────────

function tokenize(s) {
  return (s || "").toLowerCase().match(/[a-z][a-z'-]*/g) || [];
}

function hasEmDashSeparator(s) {
  return /\s—\s/.test(s);
}

function hasParenthetical(s) {
  return /\([^)]+\)/.test(s);
}

function classifyOption(s) {
  const wc = tokenize(s).length;
  return {
    text: s,
    charLength: (s || "").length,
    wordCount: wc,
    hasEmDash: hasEmDashSeparator(s),
    hasParenthetical: hasParenthetical(s),
    isShortPhrase: wc <= SHORT_PHRASE_MAX_WORDS,
    isLongClause:  wc >= LONG_CLAUSE_MIN_WORDS,
  };
}

// ─── Pattern detectors ────────────────────────────────────────────────────

// "3 of 4 agree, 1 differs" check on a boolean array of length 4.
function oneVsThreeBreak(boolArr) {
  const trueCount = boolArr.filter(Boolean).length;
  if (trueCount === 3) return { broken: boolArr.indexOf(false), majority: true };
  if (trueCount === 1) return { broken: boolArr.indexOf(true), majority: false };
  return null;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length;
  return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2;
}

// Char-length outlier: one option's length is more than 2x or less than 0.5x
// the median of the OTHER three. Skipped when that median is < LENGTH_MIN_MEDIAN
// (questions with all-very-short options where ratio noise dominates).
function lengthOutlier(lens) {
  let best = null;
  for (let i = 0; i < lens.length; i++) {
    const others = lens.filter((_, j) => j !== i);
    const med = median(others);
    if (med < LENGTH_MIN_MEDIAN) continue;
    const ratio = lens[i] / med;
    if (ratio > LENGTH_RATIO_HIGH || ratio < LENGTH_RATIO_LOW) {
      const score = ratio > 1 ? ratio : 1 / ratio;
      if (!best || score > best.score) {
        best = { idx: i, kind: ratio > 1 ? "long" : "short", med, val: lens[i], ratio, score };
      }
    }
  }
  return best;
}

// "Clause-vs-phrase" break — 3 options are short noun phrases and 1 is a long
// clause, OR 3 are long clauses and 1 is a short phrase. The 5-7 word "middle"
// range is intentionally not classified — items where the gap between options
// is in that ambiguous band don't fire.
function clauseVsPhraseBreak(features) {
  const isShort = features.map((f) => f.isShortPhrase);
  const isLong  = features.map((f) => f.isLongClause);
  // Three short + one long?
  const shortCount = isShort.filter(Boolean).length;
  const longCount  = isLong.filter(Boolean).length;
  if (shortCount === 3 && longCount === 1) {
    return { broken: isLong.indexOf(true), majority: false, kind: "3-short-1-long" };
  }
  if (longCount === 3 && shortCount === 1) {
    return { broken: isShort.indexOf(true), majority: false, kind: "3-long-1-short" };
  }
  return null;
}

// ─── Walk and flag ────────────────────────────────────────────────────────

const flagged = [];
let totalMC = 0, totalScen = 0;

for (const sec of data) {
  for (const vid of sec.videos || []) {
    const apply = (kind, list) => {
      list.forEach((q, i) => {
        if (kind === "mc") totalMC++;
        else totalScen++;
        if (!Array.isArray(q.opts) || q.opts.length !== 4) return;

        const features = q.opts.map(classifyOption);
        const lens = features.map((f) => f.charLength);

        const emDashBreak = oneVsThreeBreak(features.map((f) => f.hasEmDash));
        const parenBreak  = oneVsThreeBreak(features.map((f) => f.hasParenthetical));
        const cBreak      = clauseVsPhraseBreak(features);
        const lenOut      = lengthOutlier(lens);

        const primaryBreaks = [];
        if (emDashBreak) primaryBreaks.push({ name: "em-dash",          ...emDashBreak });
        if (cBreak)      primaryBreaks.push({ name: "clause-vs-phrase", ...cBreak });

        const minorBreaks = [];
        if (parenBreak) minorBreaks.push({ name: "parenthetical", ...parenBreak });

        if (primaryBreaks.length === 0 && !lenOut && minorBreaks.length === 0) return;

        let severity;
        if (primaryBreaks.length > 0 && lenOut)        severity = "HIGH";
        else if (primaryBreaks.length > 0 || lenOut)    severity = "MEDIUM";
        else                                            severity = "LOW";

        flagged.push({
          qid: `${kind}-${vid.id}-${i}`,
          domain: (sec.id || "?").split(".")[0],
          secId: sec.id, vidId: vid.id, kind, idx: i,
          stem: q.q, a: q.a,
          features, lens,
          primaryBreaks, minorBreaks, lenOut,
          severity,
        });
      });
    };
    apply("mc",   vid.questions || []);
    apply("scen", vid.scenarios || []);
  }
}

// ─── Console summary ──────────────────────────────────────────────────────

const bySev = { HIGH: 0, MEDIUM: 0, LOW: 0 };
for (const f of flagged) bySev[f.severity]++;

console.log(`Total items audited: ${totalMC} MC + ${totalScen} scen = ${totalMC + totalScen}`);
console.log(`Flagged: ${flagged.length} items (HIGH=${bySev.HIGH} MED=${bySev.MEDIUM} LOW=${bySev.LOW})`);
console.log("");

const bySubObj = new Map();
for (const f of flagged) {
  if (!bySubObj.has(f.secId)) bySubObj.set(f.secId, { HIGH: 0, MEDIUM: 0, LOW: 0 });
  bySubObj.get(f.secId)[f.severity]++;
}
console.log("Per-sub-objective breakdown (HIGH desc, then MED desc):");
const sorted = [...bySubObj.entries()].sort(
  (a, b) => b[1].HIGH - a[1].HIGH || b[1].MEDIUM - a[1].MEDIUM || a[0].localeCompare(b[0])
);
for (const [so, c] of sorted) {
  console.log(`  §${so.padEnd(4)}  HIGH=${String(c.HIGH).padStart(2)}  MED=${String(c.MEDIUM).padStart(2)}  LOW=${String(c.LOW).padStart(2)}`);
}

// ─── File output ──────────────────────────────────────────────────────────

const sevOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
flagged.sort((a, b) =>
  sevOrder[a.severity] - sevOrder[b.severity] ||
  a.qid.localeCompare(b.qid)
);

const lines = [];
lines.push("AUDIT A — Option structural consistency (within-question outliers)");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push(`Total items audited: ${totalMC} MC + ${totalScen} scen = ${totalMC + totalScen}`);
lines.push(`Flagged: ${flagged.length} (HIGH=${bySev.HIGH} MED=${bySev.MEDIUM} LOW=${bySev.LOW})`);
lines.push("");

for (const f of flagged) {
  lines.push("─".repeat(78));
  lines.push(`${f.severity}  ${f.qid}  (§${f.secId})`);
  lines.push(`Stem: ${f.stem}`);
  lines.push(`Correct answer: opt[${f.a}]`);
  lines.push("");
  for (let i = 0; i < f.features.length; i++) {
    const ft = f.features[i];
    const tag = i === f.a ? " ✓" : "  ";
    const phraseTag = ft.isShortPhrase ? "short" : (ft.isLongClause ? "long " : "mid  ");
    lines.push(
      `  opt[${i}]${tag} ${String(ft.charLength).padStart(3)}c ${String(ft.wordCount).padStart(2)}w ${phraseTag}` +
      `  emDash=${ft.hasEmDash ? "Y" : "."}` +
      ` paren=${ft.hasParenthetical ? "Y" : "."}`
    );
    lines.push(`    "${ft.text}"`);
  }
  lines.push("");
  lines.push("Breaks:");
  for (const b of f.primaryBreaks) {
    const detail = b.kind ? ` (${b.kind})` : "";
    lines.push(`  PRIMARY ${b.name.padEnd(18)} opt[${b.broken}] differs${detail}`);
  }
  for (const b of f.minorBreaks) {
    lines.push(`  MINOR   ${b.name.padEnd(18)} opt[${b.broken}] differs (others ${b.majority ? "have" : "lack"} pattern)`);
  }
  if (f.lenOut) {
    lines.push(`  LENGTH  outlier            opt[${f.lenOut.idx}] is ${f.lenOut.kind} (${f.lenOut.val}c vs other-3 median ${f.lenOut.med}c, ratio ${f.lenOut.ratio.toFixed(2)}x)`);
  }
  lines.push("");
}

writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
console.log("");
console.log(`Wrote: ${OUT_FILE}`);
