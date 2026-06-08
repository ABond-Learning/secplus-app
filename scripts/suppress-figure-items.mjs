// One-shot: flag the 6 Tier-A figure-dependent Sybex MC items as suppressed.
//
// Suppression is a FLAG, not a deletion: each item keeps its full record and
// its array position; we only add `suppressed:true` + `suppressionReason`.
// Items are matched by their content-derived SM-2 key (sybex_reference), never
// by array position, so the script is order-independent and re-runnable.
//
// Run: node scripts/suppress-figure-items.mjs
import { readFileSync, writeFileSync } from "node:fs";

const REASON =
  "figure-dependent: unanswerable as text without the book figure (Tier A, 2026-06-08 scan)";

// The 6 approved Tier-A keys (content-derived; see .audit-working/sybex-figure-dependent-scan.md).
const TARGET_KEYS = new Set([
  "sybex-mc-ch09-q19",
  "sybex-mc-pe02-q26",
  "sybex-mc-pe01-q85",
  "sybex-mc-pe02-q70",
  "sybex-mc-ch05-q8",
  "sybex-mc-ch14-q1",
]);

function sybexMcKey(ref) {
  if (!ref) return null;
  const bucket = Object.prototype.hasOwnProperty.call(ref, "chapter") ? "ch"
    : Object.prototype.hasOwnProperty.call(ref, "practice_exam") ? "pe" : null;
  if (!bucket) return null;
  const num = bucket === "ch" ? ref.chapter : ref.practice_exam;
  if (!Number.isInteger(num) || num < 1) return null;
  if (!Number.isInteger(ref.question_number) || ref.question_number < 1) return null;
  return `sybex-mc-${bucket}${String(num).padStart(2, "0")}-q${ref.question_number}`;
}

const path = "questions.json";
const data = JSON.parse(readFileSync(path, "utf8"));

const flagged = [];
for (const sec of data) {
  for (const v of sec.videos) {
    for (const q of v.questions || []) {
      const key = sybexMcKey(q.sybex_reference);
      if (key && TARGET_KEYS.has(key)) {
        q.suppressed = true;
        q.suppressionReason = REASON;
        flagged.push({ key, video: v.id });
      }
    }
  }
}

if (flagged.length !== TARGET_KEYS.size) {
  console.error(`FAIL: expected to flag ${TARGET_KEYS.size}, flagged ${flagged.length}`);
  console.error("flagged:", flagged.map(f => f.key));
  process.exit(1);
}

writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Flagged ${flagged.length} items:`);
for (const f of flagged) console.log(`  ${f.key}  (${f.video})`);
