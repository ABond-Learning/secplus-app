// Detailed review of correct-answer length-tells. Diagnostic only — no modification.
//
// Section 1: per-domain table — HIGH MC vs HIGH scen vs MED vs LOW counts.
// Section 2: 3 worst-offenders per domain (highest ratio first, correct=longest only).
// Section 3: 5-7 borderline items at 2x ≤ ratio < 3x, correct=longest, distributed across domains.
//
// Output is plain text formatted for one-pass human review.
//
// Usage: node scripts/audit-length-tell-detail.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));

const HIGH = 3.0, MED = 2.0, LOW = 1.5;
function severity(r) {
  if (r >= HIGH) return "high";
  if (r >= MED) return "med";
  if (r >= LOW) return "low";
  return null;
}

// ─── Walk and collect ─────────────────────────────────────────────────────
const flags = []; // { domain, secId, vidId, kind, idx, qid, item, lens, ratio, severity, longestIdx, shortestIdx, leak }
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
        const sev = severity(ratio);
        if (!sev) return;
        const longestIdx = lens.indexOf(mx);
        const shortestIdx = lens.indexOf(mn);
        const a = q.a;
        const leak = a === longestIdx ? "longest" : (a === shortestIdx ? "shortest" : "mid");
        flags.push({
          domain, secId: sec.id, vidId: vid.id, kind, idx: i,
          qid: `${kind}-${vid.id}-${i}`,
          item: q, lens, ratio, severity: sev, longestIdx, shortestIdx,
          leak,
        });
      });
    };
    apply("mc", vid.questions || []);
    apply("scen", vid.scenarios || []);
  }
}

// ─── Section 1: per-domain table ──────────────────────────────────────────
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 1 — Per-domain length-tell breakdown by severity × content type");
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("HIGH = ratio ≥ 3.0×    MED = 2.0–3.0×    LOW = 1.5–2.0×    (leak only)");
console.log();
console.log("Dom |  HIGH MC | HIGH scen |  MED MC | MED scen |  LOW MC | LOW scen |  TOTAL");
console.log("----+----------+-----------+---------+----------+---------+----------+--------");

function cell(domain, sev, kind) {
  return flags.filter((f) =>
    f.domain === domain && f.severity === sev && f.kind === kind && f.leak !== "mid"
  ).length;
}

let grandTotal = 0;
for (const d of ["1","2","3","4","5"]) {
  const hMC = cell(d, "high", "mc");
  const hSc = cell(d, "high", "scen");
  const mMC = cell(d, "med", "mc");
  const mSc = cell(d, "med", "scen");
  const lMC = cell(d, "low", "mc");
  const lSc = cell(d, "low", "scen");
  const tot = hMC + hSc + mMC + mSc + lMC + lSc;
  grandTotal += tot;
  console.log(
    `D${d}  | ${hMC.toString().padStart(7)} | ${hSc.toString().padStart(8)} | ` +
    `${mMC.toString().padStart(6)} | ${mSc.toString().padStart(7)} | ` +
    `${lMC.toString().padStart(6)} | ${lSc.toString().padStart(7)} | ${tot.toString().padStart(5)}`
  );
}
console.log(`────────────────────────────────────────────────────────────────────────────`);
console.log(`Catalogue-wide leak (correct = length extreme): ${grandTotal} items`);
console.log(`(For reference: total flagged regardless of leak = ${flags.length}; mid-position items = ${flags.filter((f) => f.leak === "mid").length})`);

// ─── Section 2: 3 worst per domain ────────────────────────────────────────
console.log();
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 2 — Top 3 worst-offenders per domain (correct = longest, ratio desc)");
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log();

function fmtItem(f) {
  const it = f.item;
  console.log(`  qid=${f.qid}    ratio=${f.ratio.toFixed(2)}×   severity=${f.severity.toUpperCase()}`);
  console.log(`  citation: ${it.messerVideo || "(none)"}    sub-objective: ${it.subObjective || "(none)"}`);
  console.log(`  STEM:`);
  console.log(`    ${it.q}`);
  console.log(`  OPTIONS:`);
  it.opts.forEach((o, i) => {
    const tag = i === it.a ? "✓" : " ";
    const len = (o || "").length;
    console.log(`    ${tag} [${i}] (${len.toString().padStart(4)} chars) ${o}`);
  });
  console.log();
}

for (const d of ["1","2","3","4","5"]) {
  console.log(`──── DOMAIN ${d} ───────────────────────────────────────────────────────────`);
  const cands = flags
    .filter((f) => f.domain === d && f.leak === "longest")
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
  if (cands.length === 0) { console.log("  (no correct=longest items)\n"); continue; }
  for (const f of cands) fmtItem(f);
}

// ─── Section 3: borderline items (2x ≤ ratio < 3x, correct = longest) ─────
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("SECTION 3 — Borderline samples (2.0× ≤ ratio < 3.0×, correct = longest)");
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("These are the per-item judgment-call items: the leak is real but moderate, so");
console.log("the correct-answer prose may or may not be necessarily longer.");
console.log();

const borderline = flags.filter((f) => f.leak === "longest" && f.ratio >= 2.0 && f.ratio < 3.0);
// One per domain first, then top-up by ratio descending; cap at 7
const bySamples = [];
for (const d of ["1","2","3","4","5"]) {
  const dom = borderline.filter((f) => f.domain === d).sort((a, b) => b.ratio - a.ratio);
  if (dom.length > 0) bySamples.push(dom[0]);
}
// Fill to 7 by adding the next-highest-ratio from any domain not already represented as an extra
const remaining = borderline
  .filter((f) => !bySamples.includes(f))
  .sort((a, b) => b.ratio - a.ratio);
while (bySamples.length < 7 && remaining.length > 0) bySamples.push(remaining.shift());

console.log(`Sampled ${bySamples.length} items (one per domain where available, then highest-ratio):\n`);
for (const f of bySamples) {
  console.log(`──── D${f.domain} ────`);
  fmtItem(f);
}

console.log("══════════════════════════════════════════════════════════════════════════════");
console.log(`Total borderline pool (2x ≤ ratio < 3x, correct = longest): ${borderline.length}`);
console.log(`Total HIGH-severity correct=longest items (ratio ≥ 3x): ${flags.filter((f) => f.leak === "longest" && f.severity === "high").length}`);
console.log("══════════════════════════════════════════════════════════════════════════════");
