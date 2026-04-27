// Sub-batch 2 scoping audit: identify items where the correct option is fine
// but at least one distractor is a stub (<30 chars), AND the overall length
// ratio is still > 1.5× (so the item still leaks the answer via length).
//
// Categorizes by short-distractor count (1, 2, or 3 stubs).
// Tags each item by whether Sub-batch 1 (commit a4405fb) modified its
// correct option vs whether it's a net-new legacy stub problem.
//
// Idempotent. Diagnostic only.
//
// Usage:
//   node scripts/audit-short-distractor-cohort.mjs                # default
//   node scripts/audit-short-distractor-cohort.mjs --details      # full per-item dump
//   node scripts/audit-short-distractor-cohort.mjs --domain=2     # filter

import { readFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");

const args = process.argv.slice(2);
const showDetails = args.includes("--details");
const domainFilter = args.find((a) => a.startsWith("--domain="))?.split("=")[1];
const pathOverride = args.find((a) => a.startsWith("--path="))?.split("=")[1];

const SHORT_DISTRACTOR = 30;   // <30 chars = stub
const LENGTH_RATIO_FLAG = 1.5; // overall question still has length leak

// ─── Load current + pre-Sub-batch-1 catalogs ──────────────────────────────
const effectivePath = pathOverride ? resolve(pathOverride) : jsonPath;
const data = JSON.parse(readFileSync(effectivePath, "utf8"));

// Get the pre-Sub-batch-1 version for diff. Fail soft if commit isn't reachable.
let preData = null;
try {
  const preJson = execSync("git show a4405fb~1:questions.json", { cwd: repo, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  preData = JSON.parse(preJson);
} catch (e) {
  console.warn("(WARN: couldn't load pre-Sub-batch-1 catalog via git — Sub-batch 1 tagging will be skipped.)");
}

// Build qid → preBatch1OptText lookup so we can detect "was the correct option modified by Sub-batch 1?"
const preCorrectOpt = new Map();
if (preData) {
  for (const sec of preData) {
    for (const vid of sec.videos || []) {
      (vid.questions || []).forEach((q, i) => preCorrectOpt.set(`mc-${vid.id}-${i}`, (q.opts || [])[q.a]));
      (vid.scenarios || []).forEach((s, i) => preCorrectOpt.set(`scen-${vid.id}-${i}`, (s.opts || [])[s.a]));
    }
  }
}

// ─── Walk and collect cohort ──────────────────────────────────────────────
const cohort = []; // { domain, secId, vidId, kind, idx, qid, item, lens, ratio, shortIdxes, shortCount, source }
for (const sec of data) {
  const domain = (sec.id || "?").split(".")[0];
  if (domainFilter && domain !== domainFilter) continue;
  for (const vid of sec.videos || []) {
    const apply = (kind, list) => {
      list.forEach((q, i) => {
        if (!Array.isArray(q.opts) || q.opts.length !== 4) return;
        const lens = q.opts.map((o) => (o || "").length);
        const mn = Math.min(...lens), mx = Math.max(...lens);
        if (mn === 0) return;
        const ratio = mx / mn;
        if (ratio < LENGTH_RATIO_FLAG) return; // no length leak → not in cohort
        const a = q.a;
        // Identify short distractors (excluding the correct option itself)
        const shortIdxes = [];
        for (let j = 0; j < q.opts.length; j++) {
          if (j === a) continue;
          if ((q.opts[j] || "").length < SHORT_DISTRACTOR) shortIdxes.push(j);
        }
        if (shortIdxes.length === 0) return;
        const qid = `${kind}-${vid.id}-${i}`;
        // Source classification: Sub-batch 1 fix vs legacy
        let source = "unknown";
        if (preData) {
          const wasOpt = preCorrectOpt.get(qid);
          if (wasOpt === undefined) source = "new-since-pre"; // shouldn't happen
          else if (wasOpt !== q.opts[a]) source = "sub-batch-1-fix";
          else source = "legacy";
        }
        cohort.push({
          domain, secId: sec.id, vidId: vid.id, kind, idx: i,
          qid, item: q, lens, ratio,
          shortIdxes, shortCount: shortIdxes.length,
          source,
          subObjective: q.subObjective,
        });
      });
    };
    apply("mc", vid.questions || []);
    apply("scen", vid.scenarios || []);
  }
}

// ─── Section 1: per-domain table ──────────────────────────────────────────
console.log(`\nShort-distractor cohort audit ${domainFilter ? `(D${domainFilter} only)` : "(all 5 domains)"}`);
console.log(`Definition: question length ratio > ${LENGTH_RATIO_FLAG}× AND at least one distractor < ${SHORT_DISTRACTOR} chars.\n`);

console.log("══ Section 1: per-domain × short-count ═══════════════════════════════════════");
console.log("Dom | 1-short | 2-short | 3-short | TOTAL  (MC/scen splits in parens)");
console.log("----+---------+---------+---------+-------");

function count(d, sc, kind) {
  return cohort.filter((x) =>
    x.domain === d && x.shortCount === sc && (kind == null || x.kind === kind)
  ).length;
}

let grandTotal = 0;
for (const d of ["1","2","3","4","5"]) {
  const a = count(d, 1), aMC = count(d, 1, "mc"), aSc = count(d, 1, "scen");
  const b = count(d, 2), bMC = count(d, 2, "mc"), bSc = count(d, 2, "scen");
  const c = count(d, 3), cMC = count(d, 3, "mc"), cSc = count(d, 3, "scen");
  const tot = a + b + c;
  grandTotal += tot;
  console.log(
    `D${d}  | ${(a + " (" + aMC + "/" + aSc + ")").padEnd(8)}|` +
    ` ${(b + " (" + bMC + "/" + bSc + ")").padEnd(8)}|` +
    ` ${(c + " (" + cMC + "/" + cSc + ")").padEnd(8)}| ${tot}`
  );
}
console.log("─────────────────────────────────────────────────────────────────────────────");
const tot1 = cohort.filter((x) => x.shortCount === 1).length;
const tot2 = cohort.filter((x) => x.shortCount === 2).length;
const tot3 = cohort.filter((x) => x.shortCount === 3).length;
console.log(`Catalogue: 1-short=${tot1}  2-short=${tot2}  3-short=${tot3}  TOTAL=${grandTotal}`);

// ─── Section 2: source breakdown ──────────────────────────────────────────
if (preData) {
  console.log(`\n══ Section 2: source (Sub-batch 1 fix vs legacy) ═════════════════════════════`);
  console.log("Dom | sub-batch-1-fix | legacy | TOTAL");
  console.log("----+-----------------+--------+------");
  let totFix = 0, totLeg = 0;
  for (const d of ["1","2","3","4","5"]) {
    const f = cohort.filter((x) => x.domain === d && x.source === "sub-batch-1-fix").length;
    const l = cohort.filter((x) => x.domain === d && x.source === "legacy").length;
    totFix += f; totLeg += l;
    console.log(`D${d}  | ${f.toString().padStart(15)} | ${l.toString().padStart(6)} | ${f + l}`);
  }
  console.log("─────────────────────────────────────────────────────────────────────────────");
  console.log(`Catalogue: sub-batch-1-fix=${totFix}  legacy=${totLeg}`);
  console.log(`(Sub-batch 1 modified 95 items; ${totFix} of those still have ≥1 short distractor in the cohort.)`);
}

// ─── Section 3: sub-objective clustering ──────────────────────────────────
console.log(`\n══ Section 3: top sub-objectives by cohort count ═════════════════════════════`);
const subObjCounts = {};
for (const x of cohort) {
  const so = x.subObjective || "(uncited)";
  subObjCounts[so] = (subObjCounts[so] || 0) + 1;
}
const ranked = Object.entries(subObjCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log("Sub-obj | count");
for (const [so, n] of ranked) {
  console.log(`  ${so.padEnd(8)} ${n}`);
}

// ─── Section 4: samples ───────────────────────────────────────────────────
function fmt(x) {
  console.log(`  ${x.qid}  D${x.domain}  ratio=${x.ratio.toFixed(2)}×  shortCount=${x.shortCount}  source=${x.source}`);
  console.log(`    citation: ${x.item.messerVideo} (${x.subObjective})`);
  console.log(`    STEM: ${x.item.q}`);
  x.item.opts.forEach((o, i) => {
    const tag = i === x.item.a ? "✓" : (x.shortIdxes.includes(i) ? "·" : " ");
    console.log(`    ${tag} [${i}] (${(o || "").length.toString().padStart(3)}) ${o}`);
  });
  console.log();
}

const PER_CATEGORY_SAMPLES = showDetails ? Infinity : 10;

console.log(`\n══ Section 4A: samples — 1-short distractor (${tot1} items) ═════════════════════`);
const cat1 = cohort.filter((x) => x.shortCount === 1).sort((a, b) => b.ratio - a.ratio).slice(0, PER_CATEGORY_SAMPLES);
for (const x of cat1) fmt(x);

console.log(`\n══ Section 4B: samples — 2-short distractors (${tot2} items) ═══════════════════`);
const cat2 = cohort.filter((x) => x.shortCount === 2).sort((a, b) => b.ratio - a.ratio).slice(0, PER_CATEGORY_SAMPLES);
for (const x of cat2) fmt(x);

console.log(`\n══ Section 4C: samples — 3-short distractors (${tot3} items) ═══════════════════`);
const cat3 = cohort.filter((x) => x.shortCount === 3).sort((a, b) => b.ratio - a.ratio).slice(0, PER_CATEGORY_SAMPLES);
for (const x of cat3) fmt(x);

console.log(`\n══ Summary ═══════════════════════════════════════════════════════════════════`);
console.log(`Total cohort: ${grandTotal}`);
console.log(`  1-short: ${tot1} items (1 distractor to pad per item)`);
console.log(`  2-short: ${tot2} items (2 distractors to pad per item)`);
console.log(`  3-short: ${tot3} items (3 distractors to pad per item — full distractor rebuild)`);
console.log(`Effort proxy (total distractors needing pad): ${tot1 + 2 * tot2 + 3 * tot3}`);
