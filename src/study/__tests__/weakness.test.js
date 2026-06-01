// Unit tests for the weakness-tracker helpers.
//
// Run with: node --test src/study/__tests__/weakness.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { weaknessKey, hasAnyWeaknessRecordFor, buildWeaknessRecord, recordWeakness, confidenceFromKey, CONFIDENCE_KEYS, CONFIDENCE_LABELS } from "../weakness.js";

// Web-Storage-like fake (mirrors the sync-engine test pattern).
function makeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    key(i) {
      const arr = [...data.keys()];
      return i >= 0 && i < arr.length ? arr[i] : null;
    },
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    _entries() { return Object.fromEntries(data); },
  };
}

function makeStorageThatThrows() {
  return {
    get length() { return 0; },
    key() { return null; },
    getItem() { return null; },
    setItem() { throw new DOMException("QuotaExceededError", "QuotaExceededError"); },
    removeItem() {},
  };
}

// ─── weaknessKey ───────────────────────────────────────────────

test("weaknessKey: canonical shape", () => {
  assert.equal(weaknessKey("mc-2.4.1-7", 1716372345678), "weakness-mc-2.4.1-7-1716372345678");
  assert.equal(weaknessKey("match-3.2.5-2", 1716372389001), "weakness-match-3.2.5-2-1716372389001");
});

// ─── hasAnyWeaknessRecordFor ────────────────────────────────────

test("hasAnyWeaknessRecordFor: false on empty storage", () => {
  assert.equal(hasAnyWeaknessRecordFor(makeStorage(), "mc-2.4.1-7"), false);
});

test("hasAnyWeaknessRecordFor: true when matching key present", () => {
  const s = makeStorage({
    "weakness-mc-2.4.1-7-1000": "{}",
    "mc-2.4.1-7": "{}",
  });
  assert.equal(hasAnyWeaknessRecordFor(s, "mc-2.4.1-7"), true);
});

test("hasAnyWeaknessRecordFor: false when only different questionId records", () => {
  const s = makeStorage({
    "weakness-mc-2.4.1-8-1000": "{}",
    "weakness-scen-3.1.2-0-2000": "{}",
  });
  assert.equal(hasAnyWeaknessRecordFor(s, "mc-2.4.1-7"), false);
});

test("hasAnyWeaknessRecordFor: handles null storage gracefully", () => {
  assert.equal(hasAnyWeaknessRecordFor(null, "mc-2.4.1-7"), false);
});

// ─── buildWeaknessRecord ────────────────────────────────────────

test("buildWeaknessRecord: writes correct shape with all fields", () => {
  const r = buildWeaknessRecord({
    questionId: "mc-2.4.1-7", ts: 1000,
    correct: false, answerChosen: 2, timeToAnswerMs: 18432,
    objectiveCode: "2.4.6", mode: "quiz",
    confidence: 2, interrupted: true,
    priorSm2: { correct: 3, total: 5, nextDue: "2026-05-25T00:00:00.000Z" },
  });
  assert.deepEqual(r, {
    questionId: "mc-2.4.1-7", ts: 1000,
    correct: false, answerChosen: 2, timeToAnswerMs: 18432,
    objectiveCode: "2.4.6", mode: "quiz",
    confidence: 2, interrupted: true,
    prior_sm2: { correct: 3, total: 5, nextDue: "2026-05-25T00:00:00.000Z" },
  });
});

test("buildWeaknessRecord: omits confidence when null", () => {
  const r = buildWeaknessRecord({
    questionId: "mc-1.1.1-0", ts: 1000,
    correct: true, answerChosen: 0, timeToAnswerMs: 5000,
    objectiveCode: "1.1", mode: "quiz",
    confidence: null,
  });
  assert.equal("confidence" in r, false, "confidence field should be absent when null");
});

test("buildWeaknessRecord: omits interrupted when false", () => {
  const r = buildWeaknessRecord({
    questionId: "mc-1.1.1-0", ts: 1000,
    correct: true, answerChosen: 0, timeToAnswerMs: 5000,
    objectiveCode: "1.1", mode: "quiz",
    interrupted: false,
  });
  assert.equal("interrupted" in r, false, "interrupted field should be absent when false");
});

test("buildWeaknessRecord: omits prior_sm2 when not supplied", () => {
  const r = buildWeaknessRecord({
    questionId: "mc-1.1.1-0", ts: 1000,
    correct: true, answerChosen: 0, timeToAnswerMs: 5000,
    objectiveCode: "1.1", mode: "quiz",
  });
  assert.equal("prior_sm2" in r, false);
});

// ─── recordWeakness ─────────────────────────────────────────────

test("recordWeakness: writes record to storage with key shape", () => {
  const s = makeStorage();
  const record = recordWeakness({
    questionId: "mc-2.4.1-7",
    correct: false, answerChosen: 2, timeToAnswerMs: 18432,
    objectiveCode: "2.4.6", mode: "quiz",
    confidence: 1,
  }, { storage: s, store: { sm2: {} }, now: () => 5000 });
  assert.ok(record != null, "record returned");
  assert.equal(s.getItem("weakness-mc-2.4.1-7-5000") != null, true, "key written to storage");
  const parsed = JSON.parse(s.getItem("weakness-mc-2.4.1-7-5000"));
  assert.equal(parsed.questionId, "mc-2.4.1-7");
  assert.equal(parsed.ts, 5000);
  assert.equal(parsed.correct, false);
  assert.equal(parsed.confidence, 1);
});

test("recordWeakness: embeds prior_sm2 on first event per questionId", () => {
  const s = makeStorage();
  const store = {
    sm2: { "mc-2.4.1-7": { correct: 3, total: 5, nextDue: "2026-05-25T00:00:00.000Z" } },
  };
  // First call — prior_sm2 should be embedded
  const first = recordWeakness({
    questionId: "mc-2.4.1-7",
    correct: true, answerChosen: 0, timeToAnswerMs: 1000,
    objectiveCode: "2.4", mode: "quiz",
  }, { storage: s, store, now: () => 1000 });
  assert.ok(first.prior_sm2, "first event should embed prior_sm2");
  assert.equal(first.prior_sm2.correct, 3);
  assert.equal(first.prior_sm2.total, 5);

  // Second call — prior_sm2 should NOT be embedded (already has weakness record)
  const second = recordWeakness({
    questionId: "mc-2.4.1-7",
    correct: false, answerChosen: 1, timeToAnswerMs: 2000,
    objectiveCode: "2.4", mode: "quiz",
  }, { storage: s, store, now: () => 2000 });
  assert.equal("prior_sm2" in second, false, "second event should NOT embed prior_sm2");
});

test("recordWeakness: skips prior_sm2 when store.sm2 has no entry for questionId", () => {
  const s = makeStorage();
  const store = { sm2: {} }; // no entry for the question
  const r = recordWeakness({
    questionId: "mc-2.4.1-7",
    correct: true, answerChosen: 0, timeToAnswerMs: 1000,
    objectiveCode: "2.4", mode: "quiz",
  }, { storage: s, store, now: () => 1000 });
  assert.equal("prior_sm2" in r, false, "no prior_sm2 when store has no SM-2 record");
});

test("recordWeakness: omits confidence when null", () => {
  const s = makeStorage();
  const r = recordWeakness({
    questionId: "mc-1.1.1-0",
    correct: true, answerChosen: 0, timeToAnswerMs: 1000,
    objectiveCode: "1.1", mode: "quiz",
    confidence: null,
  }, { storage: s, store: { sm2: {} }, now: () => 1000 });
  assert.equal("confidence" in r, false);
  const parsed = JSON.parse(s.getItem("weakness-mc-1.1.1-0-1000"));
  assert.equal("confidence" in parsed, false);
});

test("recordWeakness: never throws on localStorage quota exceeded", () => {
  const s = makeStorageThatThrows();
  // The call should NOT throw; should return null.
  let returned;
  assert.doesNotThrow(() => {
    returned = recordWeakness({
      questionId: "mc-1.1.1-0",
      correct: true, answerChosen: 0, timeToAnswerMs: 1000,
      objectiveCode: "1.1", mode: "quiz",
    }, { storage: s, store: { sm2: {} }, now: () => 1000 });
  });
  assert.equal(returned, null, "should return null when storage throws");
});

test("recordWeakness: returns null when storage is null (defensive)", () => {
  const r = recordWeakness({
    questionId: "mc-1.1.1-0",
    correct: true, answerChosen: 0, timeToAnswerMs: 1000,
    objectiveCode: "1.1", mode: "quiz",
  }, { storage: null, store: { sm2: {} }, now: () => 1000 });
  assert.equal(r, null);
});

// ─── confidence scale (Q-B-3) ──────────────────────────────────

test("confidenceFromKey: q/w/e/r map to 0/1/2/3", () => {
  assert.equal(confidenceFromKey("q"), 0);
  assert.equal(confidenceFromKey("w"), 1);
  assert.equal(confidenceFromKey("e"), 2);
  assert.equal(confidenceFromKey("r"), 3);
});

test("confidenceFromKey: case-insensitive on the four keys", () => {
  assert.equal(confidenceFromKey("Q"), 0);
  assert.equal(confidenceFromKey("R"), 3);
});

test("confidenceFromKey: non-confidence keys return null (handler guard)", () => {
  for (const k of ["1", "2", "4", "Enter", "ArrowRight", "n", "p", "f", " ", "Escape", "t", ""]) {
    assert.equal(confidenceFromKey(k), null, `expected null for ${JSON.stringify(k)}`);
  }
});

test("confidenceFromKey: non-string / multi-char input returns null", () => {
  assert.equal(confidenceFromKey(undefined), null);
  assert.equal(confidenceFromKey(null), null);
  assert.equal(confidenceFromKey("qq"), null);
});

test("confidence scale: keys, labels, and mapping are mutually consistent", () => {
  // Render order (CONFIDENCE_LABELS index) must equal the stored value, and
  // each key must map to its own position — guards against a future edit that
  // reorders labels without reordering keys (key position != value bug).
  assert.equal(CONFIDENCE_LABELS.length, 4);
  Object.entries(CONFIDENCE_KEYS).forEach(([key, value]) => {
    assert.equal(confidenceFromKey(key), value);
    assert.ok(CONFIDENCE_LABELS[value] !== undefined, `label exists for value ${value}`);
  });
  assert.deepEqual([...Object.values(CONFIDENCE_KEYS)].sort(), [0, 1, 2, 3]);
});

test("buildWeaknessRecord: confidence 0 (no idea) is written, not omitted as falsy", () => {
  // 0 is the lowest-confidence value, NOT "skipped" — the helper must keep it.
  const r = buildWeaknessRecord({
    questionId: "mc-1.1.1-0", ts: 1000, correct: false, answerChosen: 1,
    timeToAnswerMs: 500, objectiveCode: "1.1", mode: "quiz", confidence: 0,
  });
  assert.equal(r.confidence, 0);
});

test("buildWeaknessRecord: confidence null (skipped) is omitted", () => {
  const r = buildWeaknessRecord({
    questionId: "mc-1.1.1-0", ts: 1000, correct: true, answerChosen: 2,
    timeToAnswerMs: 500, objectiveCode: "1.1", mode: "quiz", confidence: null,
  });
  assert.ok(!("confidence" in r));
});
