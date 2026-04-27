// Catalogue-wide quality audit. Diagnostic only — no content modification.
//
// Flags MC + scenario items across five dimensions:
//   1. length-balance       — option length max/min ratio > 1.5x; correct vs distractor outlier
//   2. distractor-quality   — short distractors (<15 chars), filler distractors, fragment-shaped options
//   3. stem-quality         — colon-ended legacy patterns, very-short stems, all-caps shouting,
//                             missing trailing punctuation, stem ends mid-clause
//   4. duplication          — pairs of stems with token Jaccard similarity > 0.70
//   5. position-bias        — distribution of correct-answer index `a` across all MCs catalogue-wide
//                             and per-domain (chi-square against uniform 25% expectation)
//
// Output: per-dimension flag counts (catalogue-wide and per-domain), severity breakdowns,
//         worst-offender samples, fix-scope estimates.
//
// Usage:
//   node scripts/audit-catalogue-quality.mjs
//   node scripts/audit-catalogue-quality.mjs --domain=2          # filter to a single domain
//   node scripts/audit-catalogue-quality.mjs --details           # dump all flagged items, not just samples
//   node scripts/audit-catalogue-quality.mjs --dim=length        # focus a single dimension
//   node scripts/audit-catalogue-quality.mjs --report=quality-audit.md
//
// Idempotent. Pure JSON walk. No transcript dependency. No file writes unless --report.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");

const args = process.argv.slice(2);
const domainFilter = args.find((a) => a.startsWith("--domain="))?.split("=")[1];
const dimFilter = args.find((a) => a.startsWith("--dim="))?.split("=")[1];
const showDetails = args.includes("--details");
const reportPath = args.find((a) => a.startsWith("--report="))?.split("=")[1];
const pathOverride = args.find((a) => a.startsWith("--path="))?.split("=")[1];

const effectivePath = pathOverride ? resolve(pathOverride) : jsonPath;
const data = JSON.parse(readFileSync(effectivePath, "utf8"));

// ─── Tunables ────────────────────────────────────────────────────────────
const LENGTH_RATIO_LOW = 1.5;   // flagged at all
const LENGTH_RATIO_MED = 2.0;   // medium severity
const LENGTH_RATIO_HIGH = 3.0;  // high severity
const MIN_DISTRACTOR_CHARS = 15;
const SHORT_STEM_CHARS = 25;    // suspiciously short stem
const DUP_JACCARD = 0.70;       // stem-token overlap threshold
const SAMPLE_COUNT = 8;         // per-dimension worst-offender samples

// Filler-distractor matchers (case-insensitive, whole-string match after trim)
const FILLER_PATTERNS = [
  /^all of (the )?above$/i,
  /^none of (the )?above$/i,
  /^all of these$/i,
  /^none of these$/i,
  /^all (of )?the others?$/i,
  /^all three (are|of these)/i,
  /^both [ab]\s*(and|&)\s*[bc]$/i,
  /^a\s*(and|&)\s*b$/i,
  /^[abc]\s*(and|&)\s*[bcd]\s*(and|&)\s*[cd]$/i,
  /^not enough information$/i,
  /^cannot be determined$/i,
  /^it depends$/i,
  /^other$/i,
];

// Stop-words for stem-similarity tokenization
const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","has","have","in","is","it","its",
  "of","on","or","that","the","this","to","was","were","which","with","you","your","best",
  "most","which","what","when","where","who","why","how","does","do","not","than","then",
  "they","their","there","these","those","into","over","under","about","because","but","if",
  "after","before","during","while","also","such","some","any","each","every","one","two",
  "three","four","five","new","old","also","like","more","less","very","much","many","most",
  "user","users","system","systems","data","information","security","best","most","following",
]);

function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function jaccard(aSet, bSet) {
  if (aSet.size === 0 && bSet.size === 0) return 0;
  let inter = 0;
  for (const t of aSet) if (bSet.has(t)) inter++;
  const union = aSet.size + bSet.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─── Walk catalogue ───────────────────────────────────────────────────────
const items = []; // { domain, secId, vidId, kind, idx, loc, item }
for (const sec of data) {
  const domain = (sec.id || "?").split(".")[0];
  if (domainFilter && domain !== domainFilter) continue;
  for (const vid of sec.videos || []) {
    (vid.questions || []).forEach((q, i) => items.push({
      domain, secId: sec.id, vidId: vid.id, kind: "mc", idx: i,
      loc: `D${domain} §${sec.id}/${vid.id} mc[${i}]`, item: q,
    }));
    (vid.scenarios || []).forEach((s, i) => items.push({
      domain, secId: sec.id, vidId: vid.id, kind: "scen", idx: i,
      loc: `D${domain} §${sec.id}/${vid.id} scen[${i}]`, item: s,
    }));
  }
}

const totalMC = items.filter((x) => x.kind === "mc").length;
const totalScen = items.filter((x) => x.kind === "scen").length;
const totalItems = items.length;

console.log(`\nCatalogue-quality audit ${domainFilter ? `(D${domainFilter} only)` : "(all 5 domains)"}`);
console.log(`Loaded: ${totalItems} items (${totalMC} MC + ${totalScen} scen)\n`);

// ─── Dimension 1: length-balance ──────────────────────────────────────────
const lengthFlags = []; // { ...item, ratio, severity, longestIdx, shortestIdx, isCorrectOutlier }
function severityFromRatio(r) {
  if (r >= LENGTH_RATIO_HIGH) return "high";
  if (r >= LENGTH_RATIO_MED) return "med";
  if (r >= LENGTH_RATIO_LOW) return "low";
  return null;
}
for (const x of items) {
  const opts = x.item.opts || [];
  if (opts.length !== 4) continue;
  const lens = opts.map((o) => (typeof o === "string" ? o.length : 0));
  const maxLen = Math.max(...lens);
  const minLen = Math.min(...lens);
  if (minLen === 0) continue;
  const ratio = maxLen / minLen;
  const sev = severityFromRatio(ratio);
  if (!sev) continue;
  const longestIdx = lens.indexOf(maxLen);
  const shortestIdx = lens.indexOf(minLen);
  const a = x.item.a;
  // Outlier classification: which extreme is the correct answer at?
  let outlier = "neither";
  if (a === longestIdx) outlier = "correct-longest";
  else if (a === shortestIdx) outlier = "correct-shortest";
  else outlier = "distractor-extremes";
  lengthFlags.push({
    ...x, ratio, severity: sev, lens, longestIdx, shortestIdx,
    correctIdx: a, outlier,
  });
}

// ─── Dimension 2: distractor-quality ──────────────────────────────────────
const distractorFlags = []; // { ...item, optIdx, why, optText }
for (const x of items) {
  const opts = x.item.opts || [];
  const a = x.item.a;
  opts.forEach((opt, i) => {
    if (typeof opt !== "string") return;
    const trimmed = opt.trim();
    // skip the correct answer itself for "weak" checks (we judge distractors)
    if (i === a) return;
    if (trimmed.length < MIN_DISTRACTOR_CHARS) {
      distractorFlags.push({ ...x, optIdx: i, why: "short", optText: trimmed });
    }
    if (FILLER_PATTERNS.some((re) => re.test(trimmed))) {
      distractorFlags.push({ ...x, optIdx: i, why: "filler", optText: trimmed });
    }
    // Fragment heuristic: starts with lowercase AND no space (single-token), OR ends with comma
    if (/^[a-z]/.test(trimmed) && !/\s/.test(trimmed)) {
      distractorFlags.push({ ...x, optIdx: i, why: "fragment-lowercase-singleword", optText: trimmed });
    }
    if (/,$/.test(trimmed)) {
      distractorFlags.push({ ...x, optIdx: i, why: "fragment-trailing-comma", optText: trimmed });
    }
  });
}

// ─── Dimension 3: stem-quality ────────────────────────────────────────────
const stemFlags = []; // { ...item, why }
for (const x of items) {
  const q = (x.item.q || "").trim();
  if (!q) {
    stemFlags.push({ ...x, why: "empty-stem" });
    continue;
  }
  // Colon-ended legacy pattern (only a flag for MCs without BEST/MOST framing)
  if (x.kind === "mc" && /:\s*$/.test(q) && !/\b(BEST|MOST)\b/.test(q)) {
    stemFlags.push({ ...x, why: "colon-end-no-judgment-frame" });
  }
  // Very short stem
  if (q.length < SHORT_STEM_CHARS) {
    stemFlags.push({ ...x, why: "very-short-stem" });
  }
  // No terminal punctuation (and not colon-ended legacy)
  if (!/[?.!:]$/.test(q)) {
    stemFlags.push({ ...x, why: "no-terminal-punctuation" });
  }
  // ALL-CAPS shouting beyond the BEST/MOST keywords (heuristic: a 6+ letter run of caps)
  const capsRuns = q.match(/[A-Z]{6,}/g) || [];
  const noisyCaps = capsRuns.filter((r) => !/^(BEST|MOST|FIRST|LEAST|GREATEST|HIGHEST|LOWEST|MOSTLY)$/.test(r));
  if (noisyCaps.length > 0) {
    stemFlags.push({ ...x, why: `noisy-caps:${noisyCaps.join(",")}` });
  }
}

// ─── Dimension 4: cross-question duplication ──────────────────────────────
const dupFlags = []; // { aLoc, bLoc, sim, aStem, bStem, aDomain, bDomain }
const tokenIndex = items.map((x) => ({ x, tokens: new Set(tokenize(x.item.q || "")) }));
for (let i = 0; i < tokenIndex.length; i++) {
  const a = tokenIndex[i];
  if (a.tokens.size < 4) continue; // too short to compare meaningfully
  for (let j = i + 1; j < tokenIndex.length; j++) {
    const b = tokenIndex[j];
    if (b.tokens.size < 4) continue;
    // cheap rejection: if size ratio too far apart, skip (they can't reach 0.7 Jaccard)
    const small = Math.min(a.tokens.size, b.tokens.size);
    const big = Math.max(a.tokens.size, b.tokens.size);
    if (small / big < DUP_JACCARD) continue;
    const sim = jaccard(a.tokens, b.tokens);
    if (sim >= DUP_JACCARD) {
      dupFlags.push({
        aLoc: a.x.loc, bLoc: b.x.loc,
        aDomain: a.x.domain, bDomain: b.x.domain,
        sim,
        aStem: a.x.item.q,
        bStem: b.x.item.q,
      });
    }
  }
}

// ─── Dimension 5: correct-answer position bias ────────────────────────────
function positionDistribution(itemList) {
  const counts = [0, 0, 0, 0];
  let total = 0;
  for (const x of itemList) {
    const a = x.item.a;
    if (typeof a === "number" && a >= 0 && a <= 3) {
      counts[a]++;
      total++;
    }
  }
  const expected = total / 4;
  // chi-square statistic
  const chi2 = expected === 0 ? 0 : counts.reduce((s, c) => s + ((c - expected) ** 2) / expected, 0);
  return { counts, total, expected, chi2 };
}

const mcAll = items.filter((x) => x.kind === "mc");
const scenAll = items.filter((x) => x.kind === "scen");
const mcByDomain = {};
const scenByDomain = {};
for (const x of mcAll) (mcByDomain[x.domain] ??= []).push(x);
for (const x of scenAll) (scenByDomain[x.domain] ??= []).push(x);

const positionStats = {
  mcCatalogueWide: positionDistribution(mcAll),
  scenCatalogueWide: positionDistribution(scenAll),
  mcPerDomain: Object.fromEntries(Object.entries(mcByDomain).map(([d, list]) => [d, positionDistribution(list)])),
  scenPerDomain: Object.fromEntries(Object.entries(scenByDomain).map(([d, list]) => [d, positionDistribution(list)])),
};

// ─── Aggregation helpers ──────────────────────────────────────────────────
function countByDomain(flagList, key = "domain") {
  const m = {};
  for (const f of flagList) m[f[key]] = (m[f[key]] || 0) + 1;
  return m;
}
function countBy(flagList, fn) {
  const m = {};
  for (const f of flagList) {
    const k = fn(f);
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

// Deduplicate distractor flags by location+optIdx (a single option can hit multiple `why`s)
const distractorByItem = {};
for (const f of distractorFlags) {
  const k = f.loc;
  if (!distractorByItem[k]) distractorByItem[k] = { ...f, whys: new Set() };
  distractorByItem[k].whys.add(f.why);
}
const distractorItemFlags = Object.values(distractorByItem); // one entry per affected item

// Deduplicate stem flags by location (a single stem can hit multiple `why`s)
const stemByItem = {};
for (const f of stemFlags) {
  const k = f.loc;
  if (!stemByItem[k]) stemByItem[k] = { ...f, whys: new Set() };
  stemByItem[k].whys.add(f.why);
}
const stemItemFlags = Object.values(stemByItem);

// ─── Reporting ────────────────────────────────────────────────────────────
const lines = [];
const out = (s = "") => { lines.push(s); console.log(s); };

function header(title) { out(`\n══ ${title} ${"═".repeat(Math.max(0, 70 - title.length))}`); }
function pad(s, n) { return String(s).padEnd(n, " "); }

// ── 1. Length balance ──
if (!dimFilter || dimFilter === "length") {
  header("1. LENGTH-BALANCE (option max/min ratio > 1.5x)");
  out(`Total flagged items: ${lengthFlags.length} of ${totalItems} (${(100 * lengthFlags.length / totalItems).toFixed(1)}%)`);
  const sevCounts = countBy(lengthFlags, (f) => f.severity);
  out(`Severity:  high (≥${LENGTH_RATIO_HIGH}x): ${sevCounts.high || 0}   med (≥${LENGTH_RATIO_MED}x): ${sevCounts.med || 0}   low (≥${LENGTH_RATIO_LOW}x): ${sevCounts.low || 0}`);
  const outlierCounts = countBy(lengthFlags, (f) => f.outlier);
  out(`Outlier classification:`);
  out(`  correct-longest      ${(outlierCounts["correct-longest"] || 0).toString().padStart(4)}  (correct answer is the longest option — answer leakage)`);
  out(`  correct-shortest     ${(outlierCounts["correct-shortest"] || 0).toString().padStart(4)}  (correct answer is the shortest option — answer leakage)`);
  out(`  distractor-extremes  ${(outlierCounts["distractor-extremes"] || 0).toString().padStart(4)}  (correct answer is mid-length — less suspicious but still imbalanced)`);
  out(`Per domain:`);
  const perD = countByDomain(lengthFlags);
  for (const d of ["1","2","3","4","5"]) out(`  D${d}: ${perD[d] || 0}`);

  // Worst offenders by ratio, prioritizing correct-longest/shortest
  const sortable = [...lengthFlags].sort((a, b) => {
    const aLeak = a.outlier === "correct-longest" || a.outlier === "correct-shortest" ? 0 : 1;
    const bLeak = b.outlier === "correct-longest" || b.outlier === "correct-shortest" ? 0 : 1;
    if (aLeak !== bLeak) return aLeak - bLeak;
    return b.ratio - a.ratio;
  });
  const samples = showDetails ? sortable : sortable.slice(0, SAMPLE_COUNT);
  out(`\nWorst offenders (answer-leakage first, then by ratio):`);
  for (const f of samples) {
    out(`  [${f.severity}] ${f.outlier}  ratio=${f.ratio.toFixed(2)}  lens=[${f.lens.join(",")}]  a=${f.correctIdx}`);
    out(`    ${f.loc}`);
    out(`    Q: ${(f.item.q || "").slice(0, 100)}${f.item.q && f.item.q.length > 100 ? "…" : ""}`);
    f.item.opts.forEach((o, i) => {
      const tag = i === f.correctIdx ? "✓" : " ";
      const len = (o || "").length;
      out(`    ${tag} [${i}] (${len.toString().padStart(3)}) ${(o || "").slice(0, 80)}${o && o.length > 80 ? "…" : ""}`);
    });
    out("");
  }
}

// ── 2. Distractor quality ──
if (!dimFilter || dimFilter === "distractor") {
  header("2. DISTRACTOR-QUALITY");
  out(`Items with at least one weak distractor: ${distractorItemFlags.length} of ${totalItems} (${(100 * distractorItemFlags.length / totalItems).toFixed(1)}%)`);
  const totalOptFlags = distractorFlags.length;
  out(`Total option-level flags (one item can have multiple): ${totalOptFlags}`);
  const reasonCounts = countBy(distractorFlags, (f) => f.why);
  out(`By reason:`);
  for (const [why, n] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
    out(`  ${pad(why, 36)} ${n}`);
  }
  out(`Per domain (item count, deduped):`);
  const perD = countByDomain(distractorItemFlags);
  for (const d of ["1","2","3","4","5"]) out(`  D${d}: ${perD[d] || 0}`);

  // Show worst by-reason samples: filler first, then fragment, then short
  const order = { "filler": 0, "fragment-trailing-comma": 1, "fragment-lowercase-singleword": 2, "short": 3 };
  const sorted = [...distractorFlags].sort((a, b) => (order[a.why] ?? 9) - (order[b.why] ?? 9));
  const samples = showDetails ? sorted : sorted.slice(0, SAMPLE_COUNT * 2);
  out(`\nWorst offenders (filler first):`);
  for (const f of samples) {
    out(`  [${f.why}] opt[${f.optIdx}]  ${f.loc}`);
    out(`    Q: ${(f.item.q || "").slice(0, 100)}${f.item.q && f.item.q.length > 100 ? "…" : ""}`);
    out(`    opt[${f.optIdx}]: "${f.optText}"  (correct=opt[${f.item.a}]: "${(f.item.opts[f.item.a] || "").slice(0, 60)}")`);
    out("");
  }
}

// ── 3. Stem quality ──
if (!dimFilter || dimFilter === "stem") {
  header("3. STEM-QUALITY");
  out(`Items with at least one stem flag: ${stemItemFlags.length} of ${totalItems} (${(100 * stemItemFlags.length / totalItems).toFixed(1)}%)`);
  const reasonCounts = countBy(stemFlags, (f) => f.why.replace(/^noisy-caps:.+$/, "noisy-caps"));
  out(`By reason (raw flag count, items can hit multiple):`);
  for (const [why, n] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
    out(`  ${pad(why, 36)} ${n}`);
  }
  out(`Per domain (item count, deduped):`);
  const perD = countByDomain(stemItemFlags);
  for (const d of ["1","2","3","4","5"]) out(`  D${d}: ${perD[d] || 0}`);

  // Samples grouped by reason
  const reasons = ["empty-stem", "colon-end-no-judgment-frame", "very-short-stem", "no-terminal-punctuation"];
  const samplesPerReason = showDetails ? Infinity : 5;
  for (const why of reasons) {
    const matches = stemFlags.filter((f) => f.why === why);
    if (matches.length === 0) continue;
    out(`\nReason "${why}" — ${matches.length} flags, showing ${Math.min(matches.length, samplesPerReason)}:`);
    for (const f of matches.slice(0, samplesPerReason)) {
      out(`  ${f.loc}`);
      out(`    Q: "${(f.item.q || "").slice(0, 130)}${f.item.q && f.item.q.length > 130 ? "…" : ""}"`);
    }
  }
  // Noisy caps separately (the why string contains the actual run)
  const capsMatches = stemFlags.filter((f) => f.why.startsWith("noisy-caps:"));
  if (capsMatches.length > 0) {
    out(`\nReason "noisy-caps" — ${capsMatches.length} flags, showing ${Math.min(capsMatches.length, samplesPerReason)}:`);
    for (const f of capsMatches.slice(0, samplesPerReason)) {
      out(`  ${f.loc}  caps=${f.why.slice("noisy-caps:".length)}`);
      out(`    Q: "${(f.item.q || "").slice(0, 130)}${f.item.q && f.item.q.length > 130 ? "…" : ""}"`);
    }
  }
}

// ── 4. Duplication ──
if (!dimFilter || dimFilter === "duplication") {
  header(`4. DUPLICATION (stem token Jaccard ≥ ${DUP_JACCARD})`);
  out(`Total flagged pairs: ${dupFlags.length}`);
  // Sort by sim descending
  const sorted = [...dupFlags].sort((a, b) => b.sim - a.sim);
  const sameDomain = sorted.filter((f) => f.aDomain === f.bDomain).length;
  const crossDomain = sorted.length - sameDomain;
  out(`Same-domain pairs: ${sameDomain}   Cross-domain pairs: ${crossDomain}`);
  // Per-domain pair counts (count if either side is in that domain)
  const perD = {};
  for (const f of sorted) {
    perD[f.aDomain] = (perD[f.aDomain] || 0) + 1;
    if (f.aDomain !== f.bDomain) perD[f.bDomain] = (perD[f.bDomain] || 0) + 1;
  }
  out(`Per domain (counts pair if either side is in domain):`);
  for (const d of ["1","2","3","4","5"]) out(`  D${d}: ${perD[d] || 0}`);

  const samples = showDetails ? sorted : sorted.slice(0, SAMPLE_COUNT);
  out(`\nWorst offenders (highest similarity first):`);
  for (const f of samples) {
    out(`  sim=${f.sim.toFixed(2)}  ${f.aLoc}  ↔  ${f.bLoc}`);
    out(`    A: "${(f.aStem || "").slice(0, 130)}${f.aStem && f.aStem.length > 130 ? "…" : ""}"`);
    out(`    B: "${(f.bStem || "").slice(0, 130)}${f.bStem && f.bStem.length > 130 ? "…" : ""}"`);
    out("");
  }
}

// ── 5. Position bias ──
if (!dimFilter || dimFilter === "position") {
  header("5. CORRECT-ANSWER POSITION BIAS");
  function describe(label, dist) {
    const { counts, total, expected, chi2 } = dist;
    const pct = counts.map((c) => total === 0 ? 0 : (100 * c / total));
    out(`  ${pad(label, 30)} n=${total.toString().padStart(4)}  ` +
      `[0]:${counts[0].toString().padStart(3)} (${pct[0].toFixed(1).padStart(4)}%)  ` +
      `[1]:${counts[1].toString().padStart(3)} (${pct[1].toFixed(1).padStart(4)}%)  ` +
      `[2]:${counts[2].toString().padStart(3)} (${pct[2].toFixed(1).padStart(4)}%)  ` +
      `[3]:${counts[3].toString().padStart(3)} (${pct[3].toFixed(1).padStart(4)}%)  ` +
      `χ²=${chi2.toFixed(2)}`);
  }
  // chi-square critical value at df=3, p=0.05 is 7.815; p=0.01 is 11.345
  out(`(χ² > 7.82 indicates bias at p<0.05; > 11.34 at p<0.01; uniform expectation = 25%/position)`);
  out(`MC:`);
  describe("catalogue-wide MC", positionStats.mcCatalogueWide);
  for (const d of ["1","2","3","4","5"]) {
    if (positionStats.mcPerDomain[d]) describe(`D${d} MC`, positionStats.mcPerDomain[d]);
  }
  out(`Scenarios:`);
  describe("catalogue-wide scen", positionStats.scenCatalogueWide);
  for (const d of ["1","2","3","4","5"]) {
    if (positionStats.scenPerDomain[d]) describe(`D${d} scen`, positionStats.scenPerDomain[d]);
  }
}

// ── Fix-scope estimates ──
header("FIX-SCOPE ESTIMATES");
const lengthHigh = lengthFlags.filter((f) => f.severity === "high").length;
const lengthMed = lengthFlags.filter((f) => f.severity === "med").length;
const lengthAnswerLeak = lengthFlags.filter((f) => f.outlier === "correct-longest" || f.outlier === "correct-shortest").length;
const distractorFiller = distractorFlags.filter((f) => f.why === "filler").length;
const distractorShort = distractorFlags.filter((f) => f.why === "short").length;
const stemColon = stemFlags.filter((f) => f.why === "colon-end-no-judgment-frame").length;
const stemNoTerm = stemFlags.filter((f) => f.why === "no-terminal-punctuation").length;

out(`Dimension 1 (length): ${lengthHigh} HIGH + ${lengthMed} MED items; ${lengthAnswerLeak} have answer-leakage (correct = extreme).`);
out(`  Suggested batch: tackle the ${lengthAnswerLeak} answer-leakage items first (they're the actively-undermining ones).`);
out(`Dimension 2 (distractor): ${distractorItemFlags.length} items affected; ${distractorFiller} filler + ${distractorShort} short distractor flags.`);
out(`  Suggested batch: filler distractors first (${distractorFiller}); then short-fragment distractors.`);
out(`Dimension 3 (stem): ${stemItemFlags.length} items affected; ${stemColon} colon-ended-no-judgment + ${stemNoTerm} missing terminal punctuation.`);
out(`  Suggested batch: colon-ended legacy patterns are the highest study-friction signal.`);
out(`Dimension 4 (duplication): ${dupFlags.length} flagged pairs. Each pair = 1 review (keep one, rewrite the other, or accept).`);
const positionBiasedDomains = Object.entries(positionStats.mcPerDomain)
  .filter(([_, s]) => s.chi2 > 7.815)
  .map(([d, s]) => `D${d} (χ²=${s.chi2.toFixed(2)})`);
out(`Dimension 5 (position bias): catalogue-wide MC χ²=${positionStats.mcCatalogueWide.chi2.toFixed(2)}; biased-at-p<0.05 domains: ${positionBiasedDomains.length === 0 ? "none" : positionBiasedDomains.join(", ")}.`);
out(`  Fix scope is per-question (shuffle correct-answer index where bias is large).`);

// ─── Optional markdown report ─────────────────────────────────────────────
if (reportPath) {
  const mdPath = resolve(reportPath);
  writeFileSync(mdPath, lines.join("\n") + "\n");
  console.log(`\nWrote report to ${mdPath}`);
}
