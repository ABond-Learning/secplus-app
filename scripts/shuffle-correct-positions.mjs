// Mechanical fix for catalog-wide correct-answer position bias.
// Shuffles the order of options inside each MC and scenario item so that
// the correct-option index distribution approaches uniform 25% per position.
//
// Key properties:
//   - Deterministic: target = stableHash(videoId + ":" + kind + ":" + idx) % 4
//     Same input → same output. Re-runs are no-ops once applied.
//   - Content-preserving: only the order of the options array changes;
//     the option text, stem, explanation, citation fields are untouched.
//   - SM-2 safe: localStorage keys are "mc-{videoId}-{idx}" and "scen-{videoId}-{idx}".
//     Shuffling within a slot does NOT change the key. User progress preserved.
//   - Validator-safe: option count stays 4, `a` stays in range, no string content changes.
//
// Mechanism: for each item where current `a` ≠ target,
//   swap opts[a] ↔ opts[target], then set a = target.
// (Single swap of two positions; the other two options stay where they were.)
//
// Usage:
//   node scripts/shuffle-correct-positions.mjs                 # dry-run summary + sample diffs
//   node scripts/shuffle-correct-positions.mjs --samples=20    # show more sample diffs
//   node scripts/shuffle-correct-positions.mjs --preview       # write shuffled copy to /tmp for validator
//   node scripts/shuffle-correct-positions.mjs --write         # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");
const previewPath = "/tmp/questions-shuffled-preview.json";
const sampleCount = Number(args.find((a) => a.startsWith("--samples="))?.split("=")[1] ?? 10);

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// ─── Stable hash → 0..3 ───────────────────────────────────────────────────
function targetFor(videoId, kind, idx) {
  const h = createHash("sha256").update(`${videoId}:${kind}:${idx}`).digest();
  // Use first 4 bytes as an unsigned int and mod 4. Distribution is effectively uniform
  // for the small N here (under 1000 items).
  const u32 = h.readUInt32BE(0);
  return u32 % 4;
}

// ─── Walk and plan swaps ──────────────────────────────────────────────────
const plan = []; // { domain, vidId, kind, idx, a, target, swap, q, opts }
for (const sec of data) {
  const domain = (sec.id || "?").split(".")[0];
  for (const vid of sec.videos || []) {
    const apply = (kind, list) => {
      list.forEach((q, i) => {
        if (!Array.isArray(q.opts) || q.opts.length !== 4) return;
        if (typeof q.a !== "number" || q.a < 0 || q.a > 3) return;
        const target = targetFor(vid.id, kind, i);
        plan.push({
          domain, vidId: vid.id, kind, idx: i,
          a: q.a, target, swap: q.a !== target,
          q: q.q, opts: q.opts.slice(),
          item: q,
        });
      });
    };
    apply("mc", vid.questions || []);
    apply("scen", vid.scenarios || []);
  }
}

const totalItems = plan.length;
const swaps = plan.filter((p) => p.swap);
const noops = plan.filter((p) => !p.swap);

// ─── Pre/post distribution ────────────────────────────────────────────────
function distribution(items, key) {
  const counts = [0, 0, 0, 0];
  for (const x of items) counts[x[key]]++;
  const total = items.length;
  const expected = total / 4;
  const chi2 = expected === 0 ? 0 : counts.reduce((s, c) => s + ((c - expected) ** 2) / expected, 0);
  return { counts, total, chi2 };
}
function fmtDist(label, dist) {
  const { counts, total, chi2 } = dist;
  const pct = counts.map((c) => total === 0 ? 0 : (100 * c / total));
  return `  ${label.padEnd(36)} n=${total.toString().padStart(4)}  ` +
    `[0]:${counts[0].toString().padStart(3)} (${pct[0].toFixed(1).padStart(4)}%)  ` +
    `[1]:${counts[1].toString().padStart(3)} (${pct[1].toFixed(1).padStart(4)}%)  ` +
    `[2]:${counts[2].toString().padStart(3)} (${pct[2].toFixed(1).padStart(4)}%)  ` +
    `[3]:${counts[3].toString().padStart(3)} (${pct[3].toFixed(1).padStart(4)}%)  ` +
    `χ²=${chi2.toFixed(2)}`;
}

const mcPlan = plan.filter((p) => p.kind === "mc");
const scenPlan = plan.filter((p) => p.kind === "scen");

console.log(`\nShuffle plan ${write ? "(APPLY mode)" : "(DRY-RUN)"}`);
console.log(`Total items: ${totalItems} (${mcPlan.length} MC + ${scenPlan.length} scen)`);
console.log(`Items needing swap: ${swaps.length} (${(100 * swaps.length / totalItems).toFixed(1)}%)`);
console.log(`Items already at target (no-op): ${noops.length}`);

console.log(`\n══ Distributions: BEFORE → AFTER (target) ═════════════════════════════`);
console.log(`MC catalogue-wide:`);
console.log(fmtDist("BEFORE", distribution(mcPlan, "a")));
console.log(fmtDist("AFTER ", distribution(mcPlan, "target")));
console.log(`\nScenarios catalogue-wide:`);
console.log(fmtDist("BEFORE", distribution(scenPlan, "a")));
console.log(fmtDist("AFTER ", distribution(scenPlan, "target")));

console.log(`\nMC per-domain:`);
for (const d of ["1","2","3","4","5"]) {
  const dom = mcPlan.filter((p) => p.domain === d);
  if (dom.length === 0) continue;
  console.log(fmtDist(`D${d} BEFORE`, distribution(dom, "a")));
  console.log(fmtDist(`D${d} AFTER `, distribution(dom, "target")));
}
console.log(`\nScenarios per-domain:`);
for (const d of ["1","2","3","4","5"]) {
  const dom = scenPlan.filter((p) => p.domain === d);
  if (dom.length === 0) continue;
  console.log(fmtDist(`D${d} BEFORE`, distribution(dom, "a")));
  console.log(fmtDist(`D${d} AFTER `, distribution(dom, "target")));
}

// ─── Sample diffs ─────────────────────────────────────────────────────────
console.log(`\n══ SAMPLE SWAPS (first ${sampleCount} that change) ═══════════════════════════`);
const samples = swaps.slice(0, sampleCount);
for (const p of samples) {
  console.log(`\n${p.domain} §${p.vidId} ${p.kind}[${p.idx}]:  a=${p.a} → ${p.target}`);
  console.log(`  Q: ${(p.q || "").slice(0, 110)}${p.q && p.q.length > 110 ? "…" : ""}`);
  console.log(`  BEFORE:`);
  p.opts.forEach((o, i) => {
    const tag = i === p.a ? "✓" : " ";
    console.log(`    ${tag} [${i}] ${(o || "").slice(0, 90)}${o && o.length > 90 ? "…" : ""}`);
  });
  // Compute the swapped order
  const after = p.opts.slice();
  [after[p.a], after[p.target]] = [after[p.target], after[p.a]];
  console.log(`  AFTER:`);
  after.forEach((o, i) => {
    const tag = i === p.target ? "✓" : " ";
    console.log(`    ${tag} [${i}] ${(o || "").slice(0, 90)}${o && o.length > 90 ? "…" : ""}`);
  });
}

// ─── Apply ────────────────────────────────────────────────────────────────
if (write || preview) {
  for (const p of plan) {
    if (!p.swap) continue;
    const opts = p.item.opts;
    [opts[p.a], opts[p.target]] = [opts[p.target], opts[p.a]];
    p.item.a = p.target;
  }
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote ${swaps.length} option-order swaps to ${target}.`);
  if (preview) {
    console.log(`Run validator on preview:`);
    console.log(`  node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
