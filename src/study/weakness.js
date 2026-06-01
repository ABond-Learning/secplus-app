// Weakness-tracker helpers.
//
// Records per-attempt diagnostic data to localStorage under the
// `weakness-{questionId}-{ts}` key. SM-2 aggregate state in store.sm2
// stays the source of truth for review scheduling; these records are
// the source of truth for diagnostic queries (per-attempt correctness,
// time-to-answer, confidence rating, interruption flag).
//
// Pure functions for testability; React App wires a closure-bound
// recordWeakness() with live store + localStorage references.
//
// Schema reference: SCHEMA.md §weakness records.

const WEAKNESS_PREFIX = "weakness-";

// Confidence scale (Q-B-3, signed off in 9c5df20): a 4-button metacognitive
// self-assessment captured BEFORE the answer is checked, stored as integer
// 0..3 (higher = more confident). Keys + labels render left-to-right so key
// position matches value: q=no idea(0), w=guessed(1), e=fairly sure(2),
// r=certain(3). Pure data + a pure mapper so the keyboard wiring is testable
// without a DOM.
export const CONFIDENCE_LABELS = ["no idea", "guessed", "fairly sure", "certain"];
export const CONFIDENCE_KEYS = { q: 0, w: 1, e: 2, r: 3 };

// Map a single keystroke to a confidence integer, or null when the key isn't
// a confidence key. Case-insensitive on the four single-char keys; anything
// else (numbers, "Enter", "ArrowRight", …) returns null so callers can use
// it as a guard inside a shared keydown handler.
export function confidenceFromKey(key) {
  if (typeof key !== "string" || key.length !== 1) return null;
  const lower = key.toLowerCase();
  return Object.prototype.hasOwnProperty.call(CONFIDENCE_KEYS, lower)
    ? CONFIDENCE_KEYS[lower]
    : null;
}

export function weaknessKey(questionId, ts) {
  return `${WEAKNESS_PREFIX}${questionId}-${ts}`;
}

// O(N) scan over storage looking for ANY weakness-{questionId}-* entry.
// Used to detect "first new event per question after tracker ship" for
// the prior_sm2 backfill (Q-A retroactive backfill). N is the localStorage
// entry count; one call per submit; supervisor sign-off notes O(N) is
// acceptable for v1.
export function hasAnyWeaknessRecordFor(storage, questionId) {
  if (!storage) return false;
  const len = typeof storage.length === "number" ? storage.length : 0;
  const prefix = `${WEAKNESS_PREFIX}${questionId}-`;
  for (let i = 0; i < len; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(prefix)) return true;
  }
  return false;
}

// Build the record payload. Optional fields are omitted (not present)
// rather than set to null/false so the serialised JSON stays minimal
// and the schema's "absent when default" semantics are honored.
export function buildWeaknessRecord({
  questionId, ts, correct, answerChosen, timeToAnswerMs,
  objectiveCode, mode, confidence, interrupted, priorSm2,
}) {
  const r = { questionId, ts, correct, answerChosen, timeToAnswerMs, objectiveCode, mode };
  if (confidence != null) r.confidence = confidence;
  if (interrupted) r.interrupted = true;
  if (priorSm2) r.prior_sm2 = priorSm2;
  return r;
}

// Full helper: builds record, computes prior_sm2 if first event per
// questionId, writes to storage. Never throws — quota errors are
// logged and the call returns null (existing SM-2 write upstream is
// the source of truth; weakness write is best-effort).
//
// Args:
//   opts   — { questionId, correct, answerChosen, timeToAnswerMs,
//             objectiveCode, mode, confidence, interrupted }
//   ctx    — { storage, store, now }
//             storage: Web Storage-like (localStorage); null skips
//             store:   { sm2: {...} } for prior_sm2 backfill; null skips
//             now:     () => number; defaults to Date.now
//
// Returns the written record, or null when skipped (no storage / quota
// error / null record).
export function recordWeakness(opts, ctx = {}) {
  const { storage, store, now = Date.now } = ctx;
  if (!storage) return null;
  const ts = now();
  const key = weaknessKey(opts.questionId, ts);
  let priorSm2 = null;
  if (store && !hasAnyWeaknessRecordFor(storage, opts.questionId)) {
    const sm2Prior = store.sm2?.[opts.questionId];
    if (sm2Prior) {
      priorSm2 = {
        correct: sm2Prior.correct,
        total: sm2Prior.total,
        nextDue: sm2Prior.nextDue,
      };
    }
  }
  const record = buildWeaknessRecord({ ...opts, ts, priorSm2 });
  try {
    storage.setItem(key, JSON.stringify(record));
    return record;
  } catch (e) {
    console.error("[secplus] weakness write failed (likely localStorage quota):", e);
    return null;
  }
}
