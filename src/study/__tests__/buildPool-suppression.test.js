// Affirmative exclusion proof for the `suppressed` flag.
//
// The validator / build / sm2-keys regression suite prove nothing BROKE; this
// proves the 6 figure-dependent Tier-A items are actually EXCLUDED from the
// served pool, and that the guard bites by exactly the right amount.
//
// Run with: node --test src/study/__tests__/buildPool-suppression.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPool } from "../buildPool.js";

const sections = JSON.parse(
  readFileSync(new URL("../../../questions.json", import.meta.url), "utf8")
);

// The 6 approved Tier-A keys (content-derived, NOT array position).
const SUPPRESSED_KEYS = [
  "sybex-mc-ch09-q19",
  "sybex-mc-pe02-q26",
  "sybex-mc-pe01-q85",
  "sybex-mc-pe02-q70",
  "sybex-mc-ch05-q8",
  "sybex-mc-ch14-q1",
];

// Re-derive the content key from a pooled item's sybex_reference. Mirrors
// src/sm2-keys.js (kept local so the test asserts by identity, not position).
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

// A maximal MC+scenario pool over the whole corpus, no SM-2 filtering.
function fullPool(secs) {
  return buildPool({
    mode: "quiz",
    filters: {
      domains: ["1", "2", "3", "4", "5"],
      watchedOnly: false,           // scope = all videos
      questionTypes: ["mc", "scen"],
      length: null,                 // no slice → deterministic, no rng
    },
    sections: secs,
    watchedVideos: [],
    store: { sm2: {} },
    today: 0,
  });
}

// Deep copy with every `suppressed` flag stripped — simulates "guard disabled".
function stripSuppressed(secs) {
  const copy = JSON.parse(JSON.stringify(secs));
  for (const sec of copy) {
    for (const v of sec.videos) {
      for (const q of v.questions || []) { delete q.suppressed; delete q.suppressionReason; }
      for (const q of v.scenarios || []) { delete q.suppressed; delete q.suppressionReason; }
    }
  }
  return copy;
}

test("the 6 figure-dependent items are flagged suppressed in questions.json", () => {
  const found = new Set();
  for (const sec of sections) {
    for (const v of sec.videos) {
      for (const q of v.questions || []) {
        const k = sybexMcKey(q.sybex_reference);
        if (k && SUPPRESSED_KEYS.includes(k)) {
          assert.equal(q.suppressed, true, `${k} should be suppressed`);
          found.add(k);
        }
      }
    }
  }
  assert.equal(found.size, 6, `all 6 keys present and flagged (found ${found.size})`);
});

test("none of the 6 suppressed items appear in the served pool", () => {
  const pool = fullPool(sections);
  const servedKeys = new Set(pool.map(it => sybexMcKey(it.sybex_reference)).filter(Boolean));
  for (const k of SUPPRESSED_KEYS) {
    assert.equal(servedKeys.has(k), false, `${k} must NOT be in the served pool`);
  }
});

test("positive control: guard removes EXACTLY 6 items (N → N-6)", () => {
  const withGuard = fullPool(sections);           // suppressed flags live
  const withoutGuard = fullPool(stripSuppressed(sections)); // flags stripped
  const delta = withoutGuard.length - withGuard.length;
  assert.equal(delta, 6, `expected pool to shrink by exactly 6, shrank by ${delta}`);

  // And the control pool DOES contain all 6 (proves they exist + the flag is
  // the only thing excluding them).
  const controlKeys = new Set(withoutGuard.map(it => sybexMcKey(it.sybex_reference)).filter(Boolean));
  for (const k of SUPPRESSED_KEYS) {
    assert.equal(controlKeys.has(k), true, `${k} should be present when guard disabled`);
  }
});
