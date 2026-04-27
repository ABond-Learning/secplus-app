// Triage of HIGH-severity length-tell items (correct=longest, ratio ≥ 3×)
// into Pattern A (mechanically extractable post-separator prose) vs
// Pattern B (monolithic analytical reasoning) vs ambiguous.
//
// Pattern A criteria — ALL must hold:
//   1. Correct option contains " — " (em-dash + spaces) OR ": " (colon + space)
//   2. Suffix after the (first) separator is ≥30 chars
//   3. Prefix before the separator is a "coherent short answer" — heuristically:
//        a. 5–120 chars long
//        b. 1–12 words
//        c. doesn't end in comma/semicolon (would be mid-clause)
//        d. doesn't start with sentence-form words (This, That, It, These, Those, There, When, If, Yes, No)
//        e. doesn't contain typical sentence-form verbs in the prefix
//           (` is `, ` are `, ` was `, ` were `, ` have `, ` has `, ` can `, ` will `, ` should `, ` would `)
//
// Pattern B: no qualifying separator at all.
// Ambiguous: separator + 30+ suffix present, but prefix fails 3a-e (sentence-form prefix).
//
// Informational only: each Pattern A item also carries postTrimRatio showing
// what the option-array max/min ratio becomes after trimming the suffix off
// the correct option. If postTrimRatio < 2.0 the trim alone fixes the leak
// ("solo fix"); if postTrimRatio ≥ 2.0 the leak persists because distractors
// are also too short, so Pattern A is necessary but not sufficient ("combo
// fix" — Pattern A on the correct option PLUS distractor padding).
//
// Output:
//   - Per-domain triage table: A count, B count, ambiguous count
//   - 5 samples per pattern per domain (sorted by ratio descending) showing
//     stem + opts + char counts + correct mark + (for A) the proposed split
//
// Idempotent. Diagnostic only.
//
// Usage: node scripts/audit-length-tell-triaged.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));

const HIGH = 3.0;

// ─── Pattern A heuristics ────────────────────────────────────────────────
const SENTENCE_START = /^(This|That|It|These|Those|There|When|If|Yes|No)\b/;
const SENTENCE_VERBS = / (is|are|was|were|have|has|had|can|could|will|would|should|must|may) /;

function tryPatternA(opt, lens, correctIdx) {
  // Find the FIRST qualifying separator.
  const emDash = " — ";
  const colon = ": ";
  const emIdx = opt.indexOf(emDash);
  const colIdx = opt.indexOf(colon);

  // Pick whichever appears first; -1 means absent
  let sepIdx, sep;
  if (emIdx === -1 && colIdx === -1) return { kind: "no-separator" };
  if (emIdx !== -1 && (colIdx === -1 || emIdx < colIdx)) { sepIdx = emIdx; sep = emDash; }
  else { sepIdx = colIdx; sep = colon; }

  const prefix = opt.slice(0, sepIdx).trim();
  const suffix = opt.slice(sepIdx + sep.length).trim();

  // Criterion 2: suffix ≥30 chars
  if (suffix.length < 30) return { kind: "B", reason: "suffix-too-short", sep, prefix, suffix };

  // Criterion 3a: prefix length 5-120
  if (prefix.length < 5 || prefix.length > 120) {
    return { kind: "ambiguous", reason: `prefix-length-${prefix.length}`, sep, prefix, suffix };
  }
  // Criterion 3b: prefix word count 1-12
  const wordCount = prefix.split(/\s+/).filter(Boolean).length;
  if (wordCount > 12) {
    return { kind: "ambiguous", reason: `prefix-words-${wordCount}`, sep, prefix, suffix };
  }
  // Criterion 3c: not ending in comma/semicolon
  if (/[,;]$/.test(prefix)) {
    return { kind: "ambiguous", reason: "prefix-mid-clause", sep, prefix, suffix };
  }
  // Criterion 3d: not starting with sentence-form word
  if (SENTENCE_START.test(prefix)) {
    return { kind: "ambiguous", reason: "prefix-sentence-start", sep, prefix, suffix };
  }
  // Criterion 3e: no sentence-form verbs in the prefix
  // (use spaces around so "isolation"/"watershed" don't trigger)
  if (SENTENCE_VERBS.test(" " + prefix.toLowerCase() + " ")) {
    return { kind: "ambiguous", reason: "prefix-sentence-verb", sep, prefix, suffix };
  }

  // Informational: post-trim ratio (does Pattern A alone fix the leak?)
  const newLens = lens.slice();
  newLens[correctIdx] = prefix.length;
  const mn = Math.min(...newLens), mx = Math.max(...newLens);
  const newRatio = mn === 0 ? Infinity : mx / mn;
  const fixKind = newRatio < 2.0 ? "solo" : "combo";
  return { kind: "A", sep, prefix, suffix, newRatio, fixKind };
}

// ─── Walk and collect HIGH leak items ────────────────────────────────────
const items = []; // { domain, secId, vidId, kind, idx, qid, item, lens, ratio, classification }
for (const sec of data) {
  const domain = (sec.id || "?").split(".")[0];
  for (const vid of sec.videos || []) {
    const apply = (kind, list) => {
      list.forEach((q, i) => {
        if (!Array.isArray(q.opts) || q.opts.length !== 4) return;
        const lens = q.opts.map((o) => (o || "").length);
        const mn = Math.min(...lens), mx = Math.max(...lens);
        if (mn === 0) return;
        const ratio = mx / mn;
        if (ratio < HIGH) return;
        const longestIdx = lens.indexOf(mx);
        if (q.a !== longestIdx) return; // only correct=longest
        const correctOpt = q.opts[q.a] || "";
        const triage = tryPatternA(correctOpt, lens, q.a);
        let cls;
        if (triage.kind === "A") cls = "A";
        else if (triage.kind === "no-separator") cls = "B";
        else if (triage.kind === "B") cls = "B";
        else cls = "ambiguous";
        items.push({
          domain, secId: sec.id, vidId: vid.id, kind, idx: i,
          qid: `${kind}-${vid.id}-${i}`,
          item: q, lens, ratio, classification: cls, triage,
        });
      });
    };
    apply("mc", vid.questions || []);
    apply("scen", vid.scenarios || []);
  }
}

// ─── Section 1: per-domain triage table ──────────────────────────────────
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 1 — Per-domain triage of HIGH correct=longest items (ratio ≥ 3.0×)");
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log();
console.log("Pattern A = clean separator (em-dash or colon) + 30+ char suffix + short-answer prefix");
console.log("  A_solo  = post-trim ratio < 2.0× (trim alone fixes the leak)");
console.log("  A_combo = post-trim ratio ≥ 2.0× (trim helps but distractors are also too short)");
console.log("Pattern B = no qualifying separator (monolithic analytical content)");
console.log("Ambiguous = separator present but prefix is sentence-form (heuristic disqualified)");
console.log();
console.log("Dom |  A_solo | A_combo |  B  | Amb | TOTAL  (MC/scen splits in parens)");
console.log("----+---------+---------+-----+-----+-------");

function count(d, cls, kind, fixKind) {
  return items.filter((x) =>
    x.domain === d && x.classification === cls &&
    (kind == null || x.kind === kind) &&
    (fixKind == null || x.triage.fixKind === fixKind)
  ).length;
}

let totalsAsolo = 0, totalsAcombo = 0, totalsB = 0, totalsAmb = 0;
for (const d of ["1","2","3","4","5"]) {
  const aSolo  = count(d, "A", null, "solo");
  const aSoloMC = count(d, "A", "mc", "solo");
  const aSoloSc = count(d, "A", "scen", "solo");
  const aCombo = count(d, "A", null, "combo");
  const aComboMC = count(d, "A", "mc", "combo");
  const aComboSc = count(d, "A", "scen", "combo");
  const b      = count(d, "B");
  const bMC    = count(d, "B", "mc");
  const bSc    = count(d, "B", "scen");
  const am     = count(d, "ambiguous");
  const amMC   = count(d, "ambiguous", "mc");
  const amSc   = count(d, "ambiguous", "scen");
  totalsAsolo += aSolo; totalsAcombo += aCombo; totalsB += b; totalsAmb += am;
  console.log(
    `D${d}  | ${(aSolo + " (" + aSoloMC + "/" + aSoloSc + ")").padEnd(8)}|` +
    ` ${(aCombo + " (" + aComboMC + "/" + aComboSc + ")").padEnd(8)}|` +
    ` ${(b + " (" + bMC + "/" + bSc + ")").padEnd(4)}|` +
    ` ${(am + " (" + amMC + "/" + amSc + ")").padEnd(4)}|` +
    ` ${aSolo + aCombo + b + am}`
  );
}
console.log("─────────────────────────────────────────────────────────────────────────────");
console.log(`Catalogue HIGH correct=longest:`);
console.log(`  Pattern A solo  (trim alone fixes leak): ${totalsAsolo}`);
console.log(`  Pattern A combo (trim + distractor padding needed): ${totalsAcombo}`);
console.log(`  Pattern B (monolithic — no separator):    ${totalsB}`);
console.log(`  Ambiguous (prefix is sentence-form):      ${totalsAmb}`);
console.log(`  Total HIGH correct=longest items triaged: ${totalsAsolo + totalsAcombo + totalsB + totalsAmb}`);

// ─── Section 2: 5 samples per pattern per domain ─────────────────────────
function fmtA(x) {
  const t = x.triage;
  const fix = t.fixKind === "solo" ? "SOLO" : "COMBO (also needs distractor padding)";
  console.log(`  qid=${x.qid}  ratio=${x.ratio.toFixed(2)}× → post-trim ${t.newRatio.toFixed(2)}×  fix=${fix}   sep="${t.sep}"`);
  console.log(`    citation: ${x.item.messerVideo} (${x.item.subObjective})`);
  console.log(`    STEM: ${x.item.q}`);
  console.log(`    CURRENT correct opt (${x.item.opts[x.item.a].length} chars):`);
  console.log(`      "${x.item.opts[x.item.a]}"`);
  console.log(`    PROPOSED SPLIT:`);
  console.log(`      → option becomes (${t.prefix.length} chars): "${t.prefix}"`);
  console.log(`      → move to exp (${t.suffix.length} chars): "${t.suffix}"`);
  console.log(`    DISTRACTORS for context:`);
  x.item.opts.forEach((o, i) => {
    if (i === x.item.a) return;
    console.log(`      [${i}] (${(o || "").length.toString().padStart(3)}) ${o}`);
  });
  console.log();
}

function fmtBOrAmb(x) {
  console.log(`  qid=${x.qid}  ratio=${x.ratio.toFixed(2)}×   classification=${x.classification.toUpperCase()}` +
    (x.triage.reason ? `  reason=${x.triage.reason}` : ""));
  console.log(`    citation: ${x.item.messerVideo} (${x.item.subObjective})`);
  console.log(`    STEM: ${x.item.q}`);
  console.log(`    CORRECT opt (${x.item.opts[x.item.a].length} chars):`);
  console.log(`      "${x.item.opts[x.item.a]}"`);
  console.log(`    DISTRACTORS for context:`);
  x.item.opts.forEach((o, i) => {
    if (i === x.item.a) return;
    console.log(`      [${i}] (${(o || "").length.toString().padStart(3)}) ${o}`);
  });
  console.log();
}

console.log();
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 2A — Pattern A samples (3 SOLO + 2 COMBO per domain where available)");
console.log("══════════════════════════════════════════════════════════════════════════════");
for (const d of ["1","2","3","4","5"]) {
  const aAll = items.filter((x) => x.domain === d && x.classification === "A");
  const aSolo = aAll.filter((x) => x.triage.fixKind === "solo").sort((a, b) => b.ratio - a.ratio).slice(0, 3);
  const aCombo = aAll.filter((x) => x.triage.fixKind === "combo").sort((a, b) => b.ratio - a.ratio).slice(0, 2);
  const samples = [...aSolo, ...aCombo];
  console.log(`\n──── DOMAIN ${d} (${aAll.length} A items: ${aAll.filter((x) => x.triage.fixKind === "solo").length} solo, ${aAll.filter((x) => x.triage.fixKind === "combo").length} combo) ────`);
  if (samples.length === 0) { console.log("  (none)"); continue; }
  for (const x of samples) fmtA(x);
}

console.log();
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 2B — Pattern B samples (no qualifying separator — monolithic)");
console.log("══════════════════════════════════════════════════════════════════════════════");
for (const d of ["1","2","3","4","5"]) {
  const samples = items
    .filter((x) => x.domain === d && x.classification === "B")
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 5);
  console.log(`\n──── DOMAIN ${d} (${count(d, "B")} B items, showing up to 5) ────`);
  if (samples.length === 0) { console.log("  (none)"); continue; }
  for (const x of samples) fmtBOrAmb(x);
}

console.log();
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 2C — Ambiguous samples (separator present but heuristic disqualified)");
console.log("══════════════════════════════════════════════════════════════════════════════");
for (const d of ["1","2","3","4","5"]) {
  const samples = items
    .filter((x) => x.domain === d && x.classification === "ambiguous")
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 5);
  console.log(`\n──── DOMAIN ${d} (${count(d, "ambiguous")} Ambiguous items, showing up to 5) ────`);
  if (samples.length === 0) { console.log("  (none)"); continue; }
  for (const x of samples) fmtBOrAmb(x);
}

console.log();
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SUMMARY");
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log(`Pattern A solo  (trim alone fixes leak):           ${totalsAsolo} items`);
console.log(`Pattern A combo (trim + distractor padding needed): ${totalsAcombo} items`);
console.log(`Pattern B (monolithic — no separator):              ${totalsB} items`);
console.log(`Ambiguous (sentence-form prefix or off-spec):       ${totalsAmb} items`);
console.log(`Total HIGH correct=longest items triaged:           ${totalsAsolo + totalsAcombo + totalsB + totalsAmb}`);
