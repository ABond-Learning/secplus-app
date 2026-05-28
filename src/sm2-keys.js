// SM-2 storage-key derivation.
//
// Single source of truth for the localStorage / sync-engine keys the app
// writes per item. Two variants:
//
//   Legacy (Messer-cited or any non-Sybex item):
//     mc-${videoId}-${qi}
//     scen-${videoId}-${qi}
//     match-${videoId}-${pairIdx}
//
//   Sybex-native (items carrying a top-level sybex_reference, per
//   SCHEMA.md §"Sybex citation"):
//     sybex-mc-${bucket}${NN}-q${question_number}
//     sybex-scen-${bucket}${NN}-q${question_number}
//     sybex-match-${bucket}${NN}-q${question_number}
//
//   where bucket = "ch" if sybex_reference.chapter is set,
//                  "pe" if sybex_reference.practice_exam is set,
//         NN     = the chapter/practice_exam number zero-padded to 2 digits.
//
// The `sybex-` outer prefix is what 1g.0 added to sync-engine
// TRACKED_PREFIXES; this derivation is what makes that prefix entry
// load-bearing rather than dead config. Order confirmed by Aiden 2026-05-28
// (Option A): sybex- first, type inner.
//
// Backwards-compatibility invariant: when called WITHOUT an item or with an
// item that has no sybex_reference, every function returns the EXACT same
// string the pre-1g.6 inline definitions returned. The byte-identical
// regression test in __tests__/sm2-keys.test.js walks the full current
// questions.json and asserts this.

function sybexTail(ref) {
  const bucket =
    Object.prototype.hasOwnProperty.call(ref, "chapter") ? "ch" :
    Object.prototype.hasOwnProperty.call(ref, "practice_exam") ? "pe" :
    null;
  if (!bucket) return null;
  const num = bucket === "ch" ? ref.chapter : ref.practice_exam;
  if (!Number.isInteger(num) || num < 1) return null;
  if (!Number.isInteger(ref.question_number) || ref.question_number < 1) return null;
  return `${bucket}${String(num).padStart(2, "0")}-q${ref.question_number}`;
}

export function mcKey(videoId, qi, item) {
  const tail = item?.sybex_reference ? sybexTail(item.sybex_reference) : null;
  return tail ? `sybex-mc-${tail}` : `mc-${videoId}-${qi}`;
}

export function scenKey(videoId, qi, item) {
  const tail = item?.sybex_reference ? sybexTail(item.sybex_reference) : null;
  return tail ? `sybex-scen-${tail}` : `scen-${videoId}-${qi}`;
}

export function matchKey(videoId, idx, item) {
  const tail = item?.sybex_reference ? sybexTail(item.sybex_reference) : null;
  return tail ? `sybex-match-${tail}` : `match-${videoId}-${idx}`;
}
