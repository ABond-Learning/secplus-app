// Audit D Sub-batch 1.5 — verdict post-process: enforce category↔fix_direction
// consistency.
//
// Rationale (full reasoning in Reports/Report-#0003.md "Lessons learned —
// fix_direction as LLM-intent signal"):
//
// In Sub-batch 1 pre-flight iter0, three verdicts came back internally
// contradictory: category="out-of-source" + fix_direction="move-to-correct-
// video". The fix_direction "move-to-correct-video" is defined in the prompt
// as the action specifically for partial-adjacent. The LLM's prose
// explanation on each of those rows also used the phrase "partial-adjacent" —
// it understood the concept but stamped the wrong category label. iter1
// attempted to fix this in prompt-instruct (reorder + decision-tree +
// consistency check) and catastrophically over-corrected on previously
// correct items (10/23 regressions, smoke-test broken). HALT decision: do
// not iterate prompt further; fix structurally in script.
//
// This script enforces the schema rule "if fix_direction is
// 'move-to-correct-video', category must be 'partial-adjacent'" as a
// post-process pass over a verdicts.json file. The LLM's fix_direction is
// the cleaner intent channel (no overlapping training prior); the category
// field is contested by the prior. Where they conflict, this script trusts
// fix_direction.
//
// Behaviour:
//   - For each verdict where verdict.verdict.fix_direction ===
//     "move-to-correct-video" AND verdict.verdict.category !== "partial-
//     adjacent":
//       - Set verdict.verdict.category = "partial-adjacent"
//       - Set verdict.post_processed = true
//       - Set verdict.post_processed_from = <original category>
//       - Set verdict.post_processed_reason =
//         "fix_direction=move-to-correct-video implies partial-adjacent"
//   - All other verdicts pass through unchanged.
//   - Adds .postprocess metadata block to the output file.
//
// Does NOT touch verdicts where fix_direction is anything other than
// "move-to-correct-video" (e.g. mark-for-Sybex-arbitration cases like Sub-
// batch 0 row 5 CCPA — those remain for downstream Aiden review).
//
// Usage:
//   node scripts/audit-d-postprocess-verdicts.mjs
//     (defaults: --input microrecal-verdicts.json,
//                --output <input-stem>-postprocessed.json)
//
//   node scripts/audit-d-postprocess-verdicts.mjs \
//     --input microrecal-verdicts-iter0.json \
//     --output microrecal-verdicts-iter0-postprocessed.json
//
//   node scripts/audit-d-postprocess-verdicts.mjs \
//     --input regression-verdicts-iter0.json --tag regression-iter0
//
// Idempotent: re-running on an already-postprocessed file is a no-op
// because the targets have category="partial-adjacent" already.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const PREFLIGHT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");

// ─── CLI args ────────────────────────────────────────────────────────
function parseArgs() {
  const out = { input: "microrecal-verdicts.json", output: null };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--input" && i + 1 < process.argv.length) out.input = process.argv[++i];
    else if (a === "--output" && i + 1 < process.argv.length) out.output = process.argv[++i];
  }
  if (out.output == null) {
    const stem = basename(out.input, extname(out.input));
    out.output = `${stem}-postprocessed.json`;
  }
  return out;
}
const args = parseArgs();

const inputPath = resolve(PREFLIGHT_DIR, args.input);
const outputPath = resolve(PREFLIGHT_DIR, args.output);

// ─── Load + transform ───────────────────────────────────────────────
const raw = JSON.parse(readFileSync(inputPath, "utf8"));
if (!raw || !Array.isArray(raw.verdicts)) {
  console.error(`Input does not look like a verdicts file (missing .verdicts array): ${inputPath}`);
  process.exit(1);
}

const flips = [];
const out = {
  ...raw,
  verdicts: raw.verdicts.map(v => {
    const verdict = v.verdict;
    if (!verdict) return v;
    if (verdict.fix_direction === "move-to-correct-video" && verdict.category !== "partial-adjacent") {
      const originalCategory = verdict.category;
      flips.push({
        location: v.location,
        from: originalCategory,
        to: "partial-adjacent",
        role: v.role || null,
      });
      return {
        ...v,
        verdict: { ...verdict, category: "partial-adjacent" },
        post_processed: true,
        post_processed_from: originalCategory,
        post_processed_reason: "fix_direction=move-to-correct-video implies partial-adjacent",
      };
    }
    return v;
  }),
};

out.postprocess = {
  applied: true,
  rule: "fix_direction=move-to-correct-video => category=partial-adjacent",
  source: "Reports/Report-#0003.md (Sub-batch 1 pre-flight; HALT decision)",
  script: "scripts/audit-d-postprocess-verdicts.mjs",
  input: args.input,
  output: args.output,
  timestamp: new Date().toISOString(),
  total_verdicts: raw.verdicts.length,
  total_flips: flips.length,
  flips,
};

writeFileSync(outputPath, JSON.stringify(out, null, 2));

// ─── Report ─────────────────────────────────────────────────────────
console.log(`Post-process complete.`);
console.log(`  Input:  ${inputPath}`);
console.log(`  Output: ${outputPath}`);
console.log(`  Verdicts read:  ${raw.verdicts.length}`);
console.log(`  Verdicts flipped (category=>partial-adjacent): ${flips.length}`);
if (flips.length === 0) {
  console.log(`  No category changes — either file already postprocessed, or no fix_direction=move-to-correct-video conflicts found.`);
} else {
  console.log(`  Flips:`);
  flips.forEach((f, i) => {
    const loc = `${f.location.section} ${f.location.video} ${f.location.type}[${f.location.index}]`;
    console.log(`    ${i + 1}. ${loc} ${f.role ? `[${f.role}] ` : ""}${f.from} -> partial-adjacent`);
  });
}
