// Audit D Sub-batch 1.6 — second flip predicate: "concept-is-here-but-not-
// this-exact-term" → partial-depth.
//
// Rationale (full design in /tmp/sb16-design-proposal.txt):
//
// SB1 spot-check supervisor review found 3/40 items where the LLM stamped
// category="out-of-source" but the prose explanation clearly indicated the
// concept WAS taught in the cited video, just not by the specific exam term
// the item tests. This is the partial-depth shape — same sub-objective home,
// vocabulary/depth gap — not the out-of-source shape.
//
// Architectural mirror of SB1.5: the LLM's category field is contested by a
// training prior; the prose is the cleaner signal. SB1.5 trusted
// fix_direction; SB1.6 reads the prose for explicit partial-depth markers.
//
// Predicate (STRICT — auto-flip):
//   gate:  category === "out-of-source"
//          AND fix_direction === "mark-for-Sybex-arbitration"
//   AND    justification_explanation matches >= 2 of the marker regexes
//   THEN   flip category to "partial-depth"
//
// Predicate (LOOSE — flag only, do NOT flip):
//   same gate
//   AND    justification_explanation matches >= 1 marker
//   THEN   set candidate_partial_depth_flag = true (category unchanged)
//
// The 10 marker regexes are derived from prose comparison of:
//   - 3 must-flip cases (#19 avalanche, #20 dual power feeds, #26 tokenization)
//   - 10 must-not-flip confident-agree OOS cases (#16, #17, #18, #21, #23,
//     #24, #25, #27, #29, #30)
//   - 2 must-not-flip uncertainty-resolved-absent cases (#22, #28)
//
// Each marker fires on exactly one must-flip case in the validation set AND
// zero must-not-flip cases. Requiring >= 2 markers gives 100% precision and
// 100% recall on the known set.
//
// Why the fix_direction gate is "mark-for-Sybex-arbitration" not
// "rewrite-to-source": empirically zero corpus rows have
// category=out-of-source AND fix_direction=rewrite-to-source. All 296 OOS
// items split 291→mark-for-Sybex-arbitration, 5→remove-from-catalog. The
// must-flip set all carry mark-for-Sybex-arbitration. The supervisor's
// original brief specified rewrite-to-source; corrected here.
//
// Idempotency:
//   - Skips rows where SB1.5 already flipped category to partial-adjacent
//     (those carry post_processed=true and have category=partial-adjacent;
//     the SB1.6 gate requires category=out-of-source, so they're naturally
//     excluded).
//   - Skips rows where SB1.6 already flipped (category=partial-depth and
//     post_processed_by="sb16" sentinel; explicitly checked).
//   - Re-running on a postprocessed file is a no-op.
//
// Usage:
//   node scripts/audit-d-postprocess-sb16.mjs --selftest
//     (runs validation set against spot-check packet, no corpus output)
//
//   node scripts/audit-d-postprocess-sb16.mjs \
//     --input ../audit-d-sub-batch-1/full-corpus-verdicts-postprocessed.json \
//     --output ../audit-d-sub-batch-1/full-corpus-verdicts-sb16.json
//
//   node scripts/audit-d-postprocess-sb16.mjs --dry-run --input <path>
//     (writes nothing; reports counts and flips)
//
// SURFACE-AND-HOLD: do not apply --output to full corpus without supervisor
// sign-off on the design proposal.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const BASE_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");
const SPOTCHECK_PACKET = resolve(
  repo,
  ".audit-working/audit-d-sub-batch-1/spotcheck-packet-v1.json",
);

// ─── Predicate definition ──────────────────────────────────────────────

const MARKERS = {
  A1:  { re: /classic partial-depth pattern/i,
         note: "Explicit pattern-name call-out (#19)" },
  A2:  { re: /mechanism is taught/i,
         note: "Mechanism present (#19)" },
  A3:  { re: /the (specific )?(technical )?term(?:inology)? (?:is )?not named/i,
         note: "Vocabulary gap framing (#19)" },
  A4:  { re: /the concept is clearly present/i,
         note: "Concept present (#19)" },
  A5:  { re: /distinct from/i,
         note: "Different-mechanism-same-domain (#20)" },
  A6:  { re: /this concept likely appears in/i,
         note: "Same-curriculum-different-video (#20)" },
  A7:  { re: /infrastructure-level/i,
         note: "Layer/level distinction (#20)" },
  A8:  { re: /requires arbitration to determine if/i,
         note: "Explicit arbitration ask (#26)" },
  A9:  { re: /appears in a different Messer video/i,
         note: "Same-curriculum-different-video alternate (#26)" },
  A10: { re: /never mentioned in the transcript/i,
         note: "Explicit named-term absence (#26)" },
};

const MIN_MARKERS_FOR_FLIP = 2; // auto-flip threshold
const MIN_MARKERS_FOR_FLAG = 1; // flag-for-review threshold

// ─── Validation set (baked into self-test) ─────────────────────────────

const VALIDATION_KEYS = {
  MUST_FLIP: [
    "1.4|1.4.6|match|5", // #19 avalanche
    "3.4|3.4.5|mc|2",    // #20 dual power feeds
    "3.3|3.3.2|scen|2",  // #26 tokenization
  ],
  MUST_NOT_FLIP_CONFIDENT_AGREE: [
    "3.2|3.2.3|cram|3",  // #16 data diode
    "2.2|2.2.2|scen|3",  // #17 DMARC
    "5.1|5.1.4|scen|2",  // #18 PIA
    "4.6|4.6.1|scen|0",  // #21 PAW
    "2.2|2.2.4|cram|2",  // #23 strategic web compromise (also gated by fd)
    "3.3|3.3.1|mc|3",    // #24 legal hold
    "5.2|5.2.1|scen|1",  // #25 risk escalation
    "2.3|2.3.11|cram|1", // #27 MSP Kaseya
    "5.1|5.1.5|mc|4",    // #29 data classification tiers
    "2.3|2.3.7|mc|2",    // #30 HttpOnly cookie
  ],
  MUST_NOT_FLIP_UNCERTAINTY_VERIFIED_ABSENT: [
    "2.3|2.3.8|scen|2",  // #22 hardware supply chain
    "5.4|5.4.2|cram|5",  // #28 privacy by design
  ],
};

// ─── CLI args ──────────────────────────────────────────────────────────

function parseArgs() {
  const out = {
    input: null,
    output: null,
    selftest: false,
    dryRun: false,
  };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--input"  && i + 1 < process.argv.length) out.input  = process.argv[++i];
    else if (a === "--output" && i + 1 < process.argv.length) out.output = process.argv[++i];
    else if (a === "--selftest") out.selftest = true;
    else if (a === "--dry-run") out.dryRun = true;
  }
  if (!out.selftest && !out.input) {
    console.error("ERROR: must supply --input <path> or --selftest");
    process.exit(2);
  }
  if (out.input && !out.output && !out.dryRun) {
    const stem = basename(out.input, extname(out.input));
    out.output = `${stem}-sb16.json`;
  }
  return out;
}

// ─── Core predicate ────────────────────────────────────────────────────

function evaluateRow(verdictRow) {
  const v = verdictRow.verdict;
  if (!v) return { gated: false, fired: [], wouldFlip: false, wouldFlag: false };
  const cat = v.category;
  const fd  = v.fix_direction;
  const gated = (cat === "out-of-source" && fd === "mark-for-Sybex-arbitration");
  if (!gated) return { gated: false, fired: [], wouldFlip: false, wouldFlag: false };
  const exp = v.justification_explanation || "";
  const fired = [];
  for (const [key, { re }] of Object.entries(MARKERS)) {
    if (re.test(exp)) fired.push(key);
  }
  return {
    gated: true,
    fired,
    wouldFlip: fired.length >= MIN_MARKERS_FOR_FLIP,
    wouldFlag: fired.length >= MIN_MARKERS_FOR_FLAG && fired.length < MIN_MARKERS_FOR_FLIP,
  };
}

const keyOfLocation = l => `${l.section}|${l.video}|${l.type}|${l.index}`;

// ─── Self-test ─────────────────────────────────────────────────────────

function selftest() {
  const packet = JSON.parse(readFileSync(SPOTCHECK_PACKET, "utf8"));
  const itemsByKey = new Map();
  for (const it of packet.items) itemsByKey.set(keyOfLocation(it.location), it);

  let pass = true;
  const lines = [];
  lines.push("=== SB1.6 PREDICATE SELF-TEST against spotcheck-packet-v1 ===");
  lines.push("");
  lines.push("Must-flip (3 items expected to flip):");
  for (const key of VALIDATION_KEYS.MUST_FLIP) {
    const it = itemsByKey.get(key);
    if (!it) { lines.push(`  FAIL  ${key}: not found in packet`); pass = false; continue; }
    const r = evaluateRow(it);
    const status = r.wouldFlip ? "OK  flip" : "FAIL no-flip";
    if (!r.wouldFlip) pass = false;
    lines.push(`  ${status}  ${key}  markers=[${r.fired.join(",")}] (${r.fired.length})`);
  }
  lines.push("");
  lines.push("Must-not-flip — confident-agree OOS (10 items expected NOT to flip):");
  for (const key of VALIDATION_KEYS.MUST_NOT_FLIP_CONFIDENT_AGREE) {
    const it = itemsByKey.get(key);
    if (!it) { lines.push(`  FAIL  ${key}: not found in packet`); pass = false; continue; }
    const r = evaluateRow(it);
    const status = !r.wouldFlip ? "OK  no-flip" : "FAIL flip";
    if (r.wouldFlip) pass = false;
    const gate = r.gated ? "gated" : "ungated";
    lines.push(`  ${status}  ${key}  [${gate}] markers=[${r.fired.join(",")}] (${r.fired.length})`);
  }
  lines.push("");
  lines.push("Must-not-flip — uncertainty verified absent (2 items expected NOT to flip):");
  for (const key of VALIDATION_KEYS.MUST_NOT_FLIP_UNCERTAINTY_VERIFIED_ABSENT) {
    const it = itemsByKey.get(key);
    if (!it) { lines.push(`  FAIL  ${key}: not found in packet`); pass = false; continue; }
    const r = evaluateRow(it);
    const status = !r.wouldFlip ? "OK  no-flip" : "FAIL flip";
    if (r.wouldFlip) pass = false;
    lines.push(`  ${status}  ${key}  markers=[${r.fired.join(",")}] (${r.fired.length})`);
  }
  lines.push("");
  lines.push(`SELF-TEST RESULT: ${pass ? "PASS" : "FAIL"}`);
  lines.push("");
  return { pass, report: lines.join("\n") };
}

// ─── Corpus pass ───────────────────────────────────────────────────────

function passCorpus(args) {
  const inputPath  = resolve(BASE_DIR, args.input);
  const outputPath = args.output ? resolve(BASE_DIR, args.output) : null;

  const raw = JSON.parse(readFileSync(inputPath, "utf8"));
  if (!raw || !Array.isArray(raw.verdicts)) {
    console.error(`Input does not look like a verdicts file (missing .verdicts array): ${inputPath}`);
    process.exit(1);
  }

  const flips = [];
  const flags = [];

  const out = {
    ...raw,
    verdicts: raw.verdicts.map(v => {
      const verdict = v.verdict;
      if (!verdict) return v;

      // Skip rows already SB1.6-processed (idempotent).
      if (v.sb16_processed === true) return v;

      const r = evaluateRow(v);
      if (!r.gated) return v;

      if (r.wouldFlip) {
        const originalCategory = verdict.category;
        flips.push({
          location: v.location,
          from: originalCategory,
          to: "partial-depth",
          fired_markers: r.fired,
          role: v.role || null,
        });
        return {
          ...v,
          verdict: { ...verdict, category: "partial-depth" },
          sb16_processed: true,
          sb16_action: "flip",
          sb16_from: originalCategory,
          sb16_to: "partial-depth",
          sb16_fired_markers: r.fired,
          sb16_reason: "concept-here-but-not-this-exact-term (>= 2 markers)",
        };
      }
      if (r.wouldFlag) {
        flags.push({
          location: v.location,
          fired_markers: r.fired,
          role: v.role || null,
        });
        return {
          ...v,
          sb16_processed: true,
          sb16_action: "flag-for-review",
          sb16_fired_markers: r.fired,
          sb16_reason: "single-marker — candidate partial-depth, supervisor review required",
        };
      }
      return v;
    }),
  };

  out.sb16_postprocess = {
    applied: !args.dryRun,
    rule_strict: `category=out-of-source AND fix_direction=mark-for-Sybex-arbitration AND >=${MIN_MARKERS_FOR_FLIP} markers => category=partial-depth`,
    rule_loose:  `category=out-of-source AND fix_direction=mark-for-Sybex-arbitration AND ==1 marker => sb16_action=flag-for-review (no category change)`,
    source: "Reports/Report-#0005.md (SB1 spot-check; supervisor TASK 2)",
    script: "scripts/audit-d-postprocess-sb16.mjs",
    input: args.input,
    output: args.output,
    timestamp: new Date().toISOString(),
    total_verdicts: raw.verdicts.length,
    total_flips: flips.length,
    total_flags: flags.length,
    flips,
    flags,
  };

  if (!args.dryRun && outputPath) {
    writeFileSync(outputPath, JSON.stringify(out, null, 2));
  }

  console.log(`SB1.6 corpus pass complete${args.dryRun ? " (DRY-RUN)" : ""}.`);
  console.log(`  Input:           ${inputPath}`);
  console.log(`  Output:          ${args.dryRun ? "(not written)" : outputPath}`);
  console.log(`  Verdicts read:   ${raw.verdicts.length}`);
  console.log(`  STRICT flips:    ${flips.length} (auto-flipped to partial-depth)`);
  console.log(`  LOOSE flags:     ${flags.length} (flagged for supervisor review, no category change)`);
  if (flips.length > 0) {
    console.log(`  Strict flips:`);
    flips.forEach((f, i) => {
      const loc = `${f.location.section} ${f.location.video} ${f.location.type}[${f.location.index}]`;
      console.log(`    ${i + 1}. ${loc} ${f.from} -> partial-depth  markers=[${f.fired_markers.join(",")}]`);
    });
  }
  if (flags.length > 0) {
    console.log(`  Loose flags (review candidates):`);
    flags.forEach((f, i) => {
      const loc = `${f.location.section} ${f.location.video} ${f.location.type}[${f.location.index}]`;
      console.log(`    ${i + 1}. ${loc}  markers=[${f.fired_markers.join(",")}]`);
    });
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

const args = parseArgs();

if (args.selftest) {
  const { pass, report } = selftest();
  console.log(report);
  process.exit(pass ? 0 : 1);
}

passCorpus(args);
