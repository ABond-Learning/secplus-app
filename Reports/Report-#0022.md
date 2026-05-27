# Report-#0022 — Task 1g.1: validator accepts top-level `sybex_reference` (E1-refined)

**Date:** 2026-05-27
**Run ID:** `2026-05-27-task-1g-1-validator-extension`
**Base HEAD:** `db18068` → plan `7c2a5d8` → implementation (this report's commits)
**Plan (signed off):** `.audit-working/relays/from-cc/task-1g-1-plan-ceec47c8.md` (commit `7c2a5d8`)

## What was asked

Implement Task 1g.1 (Q-E, E1-refined): extend `scripts/validate-questions.mjs` so an item
is validly cited by EITHER the Messer pair (`messerVideo` + `subObjective`) OR a top-level
`sybex_reference`, with shape-validation for the latter. Plan-first; the plan
(`task-1g-1-plan-ceec47c8.md`) was dispatched for sign-off, then approved with five explicit
decisions before implementation. Validator + selftest only; no `questions.json` item touched.

## The five adjudicated decisions (all approved as recommended)

1. **Practice-exam convention (§2b) — Option A.** A top-level `sybex_reference` requires
   `edition` + `question_number` + **exactly one of** `chapter` | `practice_exam` (both
   integers ≥ 1). No `source_type` discriminator (redundant with the Q-F `sourceProvenance`
   enum), and `chapter` keeps its integer type (rejected the `chapter="practice-exam-01"`
   string overload). SM-2 key alignment confirmed by the supervisor: `chapter=4` +
   `question_number=1` → `mc-sybex-ch04-q1`; `practice_exam=1` + `question_number=26` →
   `mc-sybex-pe01-q26`.

2. **Native vs audit-trail semantics (§2a).** `quote_excerpt` and `chapter_level_only` are
   **never required** at top level. Both are accepted for shape compatibility with
   `sb_fix_2` but are semantically inert: the item IS the Sybex content, so there is no
   evidentiary burden and `chapter_level_only` has nothing to waive.

3. **Legacy grandfathering (§4 fixture #4) — stays `info`.** An item with no citation of any
   kind emits `legacy-no-citation` at **info**, never error. The validator cannot distinguish
   a lost-Sybex-citation item from an intentional legacy item without `sourceProvenance`,
   which 1g.1 does not enforce; the "Sybex item missing citation → error" check belongs to
   1g.4/1g.6 after `sourceProvenance` lands.

4. **Error-code granularity (§2d) — four granular codes.** `sybex-shape` / `sybex-edition` /
   `sybex-question-number` / `sybex-locator`, matching the existing `missing-messer` /
   `missing-subobj` / `subobj-format` style. Pays off when 1g.4 conversion writes 500 items.

5. **Baseline (§5) — 4 warns confirmed canonical.** The ship prompt's "5 warns" was a stale
   read of historical PLAN entries (SB-fix-1b / 1d sub-batch 2 era). Live measurement at
   `db18068` is canonical: **0 errors / 4 warns / 0 info**, all `best-most-short-distractor`.

**Edition-string clarification:** `edition` validation is non-empty-string only, not a
canonical-string match. "Chapple 9th" is a content rule enforced by 1g.4 conversion, not by
the validator.

## Implementation shape

All changes are in `scripts/validate-questions.mjs` (one file). Net ~70 lines added.

- **`isNew()` repurposed** — now `Boolean(messerVideo || subObjective || sybex_reference)`, so
  a Sybex-only item is not mis-flagged as legacy.
- **`checkCitation()` restructured** into two independent blocks plus the legacy rule:
  - Messer block (`hasMesser`) — **logic and error strings byte-identical** to the prior
    version (both-or-neither; `missing-messer` / `missing-subobj` / `subobj-format` preserved
    verbatim per SB-fix-1b-prep Q-B refinement 1).
  - Sybex block (`hasSybex`) — additive; delegates to the new `checkSybexReference()`.
  - Legacy rule — `!isNew(item) && requireCitation` → `legacy-no-citation` info (verbatim).
  - An item may carry both; both blocks run independently.
- **New `checkSybexReference(ref, location)`** — emits the four granular `sybex-*` codes.
  Minimum valid citation: `edition` (non-empty string) + `question_number` (int ≥ 1) +
  exactly one of `chapter` (int ≥ 1) / `practice_exam` (int ≥ 1). `section` / `page` /
  `quote_excerpt` / `chapter_level_only` / `note` accepted but unenforced.
- **Type coverage = all four types (option b).** `checkCitation()` is already called
  uniformly for mc/scen (`requireCitation:true`) and match/cram (`requireCitation:false`), so
  the generalisation covers all four at zero extra code. Fixtures are mc-focused per Q-E's
  literal scope; the predicate is type-agnostic.
- **Selftest extended 6 → 14.** The original 6 match/cram fixtures are unchanged (the tuple
  gained a per-fixture `requireCitation`, defaulted `false` for them); 8 new mc/sybex fixtures
  cover valid-Messer, valid-sybex-chapter, both, bare-legacy (info), missing-question_number,
  `chapter_level_only`-no-quote, practice-exam, and the both-locators error.

## Verification (commit-body evidence)

```
$ node scripts/validate-questions.mjs --selftest
Validator self-test: 14 PASS, 0 FAIL (of 14)

$ node scripts/validate-questions.mjs --quiet
Validator results: 4 issues
  errors: 0
  warns:  4
  info:   0
By code:
      4  best-most-short-distractor
```

`npm run build` — clean (`✓ built in 756ms`; pre-existing chunk-size advisory only). No
`questions.json` item touched (validator + selftest only).

## Files changed

- `scripts/validate-questions.mjs` — `isNew()` predicate, `checkCitation()` restructure,
  new `checkSybexReference()`, selftest 6 → 14.
- `Reports/Report-#0022.md` — this report (follow-up commit in the same push).
- `.audit-working/runs/2026-05-27-task-1g-1-validator-extension.eventlog.ndjson` — Rule #9
  event log (gitignored).

## Boundaries honored

- Gate-safe: the new code paths fire only when a top-level `sybex_reference` is present, and
  no corpus item has one yet. No `sybex-` SM-2 key introduced. Independent of the 24-hour
  sync-engine hygiene gate.
- `sourceProvenance` not enforced (Q-F lands in 1g.2/1g.4).
- Existing error codes preserved verbatim; baseline unchanged (0 errors / 4 warns).
- No schema doc change here — `SCHEMA.md` updates for the top-level `sybex_reference` shape
  are Task 1g.2's scope.
- Rule #9 event log written at state transitions (session_start, task_start, commit,
  pause_for_input, resume, commit, task_end, session_end).

## What's next

- **1g.2** — SCHEMA.md: document the top-level `sybex_reference` shape (including the
  `practice_exam` + `question_number` fields adopted here), the `sourceProvenance` enum, and
  the SM-2 key-scheme extension.
- **1g.3** — objective tagging (C2-API), **1g.4** — conversion script (writes `sybex-` keys;
  gated behind the 24-hour sync hygiene gate), **1g.5–1g.7** per PLAN.
