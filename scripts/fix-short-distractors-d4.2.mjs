// Sub-batch 3 follow-up — §4.2 cohort item not included in mega-pass scope.
//
// The mega-pass brief listed 21 sub-objectives but §4.2 was omitted; cohort
// audit shows 1 item still pending: mc-4.2.1-1 (Domain 4, ratio 4.50×,
// shortCount=3, source=legacy).
//
// 1 multi-pad:
//   - mc-4.2.1-1  Media sanitization STRONGEST — 3 short distractors
//                 padded; correct preserved unchanged
//
// Watchpoints respected:
//   - NIST 800-88 sanitization hierarchy: Clear (overwrite), Purge
//     (degauss / crypto-erase), Destroy (physical destruction). Physical
//     destruction is universally strongest because the substrate itself
//     is eliminated.
//   - Degaussing effective on magnetic media only; mc-4.2.1-0 already
//     covers this WHY question — mc-4.2.1-1's distractor [1] reinforces
//     without recycling.
//   - Formatting is NOT a sanitization method per NIST 800-88; data
//     remains recoverable via undelete tools. Kept as the obvious-floor
//     distractor by Aiden's call (the "Formatting is not sanitization"
//     misconception is real and worth testing).
//   - Crypto-erase as a real NIST 800-88 method NOT introduced here; if
//     authored later it should land as a separate new §4.2 item rather
//     than swap into this question's distractor slot.
//
// Apply mechanism: standard multi-pad pattern (not convention-A). Script
// verifies item.opts[item.a] === existing correct text AND that the same
// text appears in newOpts; sets a = newOpts.indexOf(currentCorrect).
// Correct option text preserved verbatim, position preserved at index 2.
//
// Idempotent: re-running --write after a successful apply skips because
// item.opts already match newOpts.
//
// Usage:
//   node scripts/fix-short-distractors-d4.2.mjs              # dry-run
//   node scripts/fix-short-distractors-d4.2.mjs --preview    # write to /tmp/
//   node scripts/fix-short-distractors-d4.2.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.2-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.2.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Which media sanitization method provides the STRONGEST",
    intensity: "multi-pad",
    newOpts: [
      "Overwriting with zeros (single-pass disk wipe)",                              //  47
      "Degaussing the drive with a strong magnetic field",                           //  50
      "Physical destruction (shredding/incineration)",                                // ✓ 45 (unchanged correct, preserved at index 2)
      "Formatting the drive from the operating system",                              //  47
    ],
  },
];

let applied = 0, skipped = 0, refused = 0;
const log = [];
for (const r of REPLACEMENTS) {
  const sec = data.find((s) => s.id === r.videoId.split(".").slice(0, 2).join("."));
  if (!sec) { console.error(`section not found for ${r.videoId}`); refused++; continue; }
  const vid = sec.videos.find((v) => v.id === r.videoId);
  if (!vid) { console.error(`video not found for ${r.videoId}`); refused++; continue; }
  const list = r.kind === "mc" ? vid.questions : vid.scenarios;
  const item = list?.[r.index];
  if (!item) { console.error(`item not found at ${r.videoId} ${r.kind}[${r.index}]`); refused++; continue; }
  if (!item.q.startsWith(r.expectedOldStemPrefix)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — stem mismatch`);
    refused++; continue;
  }
  const sameOpts = r.newOpts.length === item.opts.length && r.newOpts.every((o, i) => o === item.opts[i]);
  if (sameOpts) { skipped++; continue; }

  // Standard multi-pad: existing correct text must appear unchanged in newOpts.
  const currentCorrect = item.opts[item.a];
  if (!r.newOpts.includes(currentCorrect)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
    console.error(`  current correct: "${currentCorrect}"`);
    refused++; continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);

  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldA: item.a, newA, oldOpts: item.opts.slice(), newOpts: r.newOpts });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\n§4.2 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length}`);
console.log(`  applied:  ${applied}`);
console.log(`  skipped (idempotent): ${skipped}`);
console.log(`  refused (safety): ${refused}`);
console.log();
for (const l of log) {
  console.log(`  ${l.qid}  a=${l.oldA}->${l.newA}  intensity=${l.intensity}`);
  console.log(`    BEFORE:`);
  l.oldOpts.forEach((o, i) => console.log(`      ${i === l.oldA ? "*" : " "} [${i}] (${o.length}ch) ${o}`));
  console.log(`    AFTER:`);
  l.newOpts.forEach((o, i) => console.log(`      ${i === l.newA ? "*" : " "} [${i}] (${o.length}ch) ${o}`));
}

if (write || preview) {
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote to ${target}`);
  if (preview) {
    console.log(`Run validator on preview:`);
    console.log(`  node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
  }
} else {
  console.log("\n(dry run — pass --preview to write to /tmp, --write to persist to questions.json)");
}
