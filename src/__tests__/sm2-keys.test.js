// Run with: npm test (or: node --test src/__tests__/sm2-keys.test.js)
//
// Two test groups:
//   1. Sybex-keyed items produce `sybex-<type>-<bucket><NN>-q<n>` keys.
//   2. **REGRESSION:** every item in the CURRENT questions.json (the
//      pre-1g.6 corpus) produces a key byte-identical to the legacy form
//      `<type>-${videoId}-${qi}`. This is the load-bearing test — it's what
//      guarantees Aiden's existing SM-2 study progress doesn't get
//      orphaned by the new derivation path.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { mcKey, scenKey, matchKey } from "../sm2-keys.js";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");

// ─── Group 1: Sybex items get sybex-* keys ───────────────────────────

test("mcKey(sybex chapter item) → sybex-mc-chNN-qN", () => {
  const item = { sybex_reference: { edition: "Chapple 9th", chapter: 4, question_number: 1 } };
  assert.equal(mcKey("2.2.sybex", 0, item), "sybex-mc-ch04-q1");
});

test("mcKey(sybex practice-exam item) → sybex-mc-peNN-qN", () => {
  const item = { sybex_reference: { edition: "Chapple 9th", practice_exam: 1, question_number: 9 } };
  assert.equal(mcKey("1.2.sybex", 5, item), "sybex-mc-pe01-q9");
});

test("scenKey(sybex item) → sybex-scen-...", () => {
  const item = { sybex_reference: { chapter: 12, question_number: 17 } };
  assert.equal(scenKey("2.4.sybex", 0, item), "sybex-scen-ch12-q17");
});

test("matchKey(sybex item) → sybex-match-...", () => {
  const item = { sybex_reference: { practice_exam: 2, question_number: 90 } };
  assert.equal(matchKey("5.3.sybex", 0, item), "sybex-match-pe02-q90");
});

test("padding: single-digit chapter pads to 2 digits", () => {
  const item = { sybex_reference: { chapter: 2, question_number: 11 } };
  assert.equal(mcKey("2.2.sybex", 0, item), "sybex-mc-ch02-q11");
});

test("padding: two-digit chapter stays two digits (no triple-pad)", () => {
  const item = { sybex_reference: { chapter: 17, question_number: 20 } };
  assert.equal(mcKey("4.8.sybex", 0, item), "sybex-mc-ch17-q20");
});

test("every emitted Sybex key startsWith('sybex-') — the 1g.0 prefix is load-bearing", () => {
  // Spot a sample of (chapter, n) and (pe, n) pairs covering both buckets.
  const samples = [
    { chapter: 4,  question_number: 1   },
    { chapter: 8,  question_number: 3   },
    { chapter: 11, question_number: 15  },
    { chapter: 17, question_number: 20  },
    { practice_exam: 1, question_number: 9   },
    { practice_exam: 2, question_number: 90  },
  ];
  for (const ref of samples) {
    for (const fn of [mcKey, scenKey, matchKey]) {
      const k = fn("ignored.id", 0, { sybex_reference: ref });
      assert.ok(k.startsWith("sybex-"), `${fn.name}(${JSON.stringify(ref)}) → ${k} should startsWith("sybex-")`);
    }
  }
});

// ─── Group 2: REGRESSION — non-Sybex paths byte-identical to legacy ──

test("regression: mcKey called without item arg is byte-identical to legacy", () => {
  assert.equal(mcKey("1.1.1", 0),  "mc-1.1.1-0");
  assert.equal(mcKey("4.5.7", 23), "mc-4.5.7-23");
});

test("regression: mcKey with non-sybex item is byte-identical to legacy", () => {
  const item = { q: "x", opts: ["a","b","c","d"], a: 0, exp: "y" };
  assert.equal(mcKey("1.1.1", 0, item), "mc-1.1.1-0");
});

test("regression: scenKey/matchKey called without item arg are byte-identical to legacy", () => {
  assert.equal(scenKey("2.3.4", 5),  "scen-2.3.4-5");
  assert.equal(matchKey("3.2.1", 7), "match-3.2.1-7");
});

test("regression: an item with sybex_reference shape invalid (no chapter and no practice_exam) falls back to legacy", () => {
  // Defensive: malformed sybex_reference should NOT silently produce a
  // weird key — it falls through to the legacy form. The validator catches
  // shape errors separately (sybex-locator error code).
  const item = { sybex_reference: { edition: "Chapple 9th", question_number: 5 } };
  assert.equal(mcKey("1.1.1", 0, item), "mc-1.1.1-0");
});

test("regression LOAD-BEARING: every item in current questions.json produces the right SM-2 key", () => {
  // Two assertions per item, depending on whether it carries sybex_reference:
  //   - Non-Sybex items: BYTE-IDENTICAL to the pre-1g.6 legacy form
  //     `<type>-${videoId}-${qi}`. This is what protects existing study
  //     progress: every Messer-cited item must keep the same key.
  //   - Sybex items: must produce `sybex-<type>-...` so the 1g.0
  //     TRACKED_PREFIX entry is what does the work.
  const q = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));
  let checkedNonSybex = 0;
  let checkedSybex = 0;
  for (const section of q) {
    for (const v of section.videos || []) {
      for (const [qi, item] of (v.questions || []).entries()) {
        const k = mcKey(v.id, qi, item);
        if (item.sybex_reference) {
          assert.ok(k.startsWith("sybex-mc-"), `Sybex mc key wrong for ${v.id}[${qi}]: ${k}`);
          checkedSybex++;
        } else {
          assert.equal(k, `mc-${v.id}-${qi}`, `Legacy mc key changed for ${v.id}[${qi}]`);
          checkedNonSybex++;
        }
      }
      for (const [qi, item] of (v.scenarios || []).entries()) {
        const k = scenKey(v.id, qi, item);
        if (item.sybex_reference) {
          assert.ok(k.startsWith("sybex-scen-"), `Sybex scen key wrong for ${v.id}[${qi}]: ${k}`);
          checkedSybex++;
        } else {
          assert.equal(k, `scen-${v.id}-${qi}`, `Legacy scen key changed for ${v.id}[${qi}]`);
          checkedNonSybex++;
        }
      }
      for (const [pi, item] of (v.matching || []).entries()) {
        const k = matchKey(v.id, pi, item);
        if (item.sybex_reference) {
          assert.ok(k.startsWith("sybex-match-"), `Sybex match key wrong for ${v.id}[${pi}]: ${k}`);
          checkedSybex++;
        } else {
          assert.equal(k, `match-${v.id}-${pi}`, `Legacy match key changed for ${v.id}[${pi}]`);
          checkedNonSybex++;
        }
      }
    }
  }
  assert.ok(checkedNonSybex > 0, "regression test should cover non-Sybex items");
  // checkedSybex grows past 0 after 1g.6 merges items; this assertion
  // documents the dual-path expectation but doesn't require Sybex items
  // to exist (test still passes on a fresh checkout pre-1g.6).
});
