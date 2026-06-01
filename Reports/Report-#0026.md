# Report-#0026 — Task 1h commit 3: ConfidenceRater UI

**Date:** 2026-06-01
**Run:** `2026-06-01-task-1h-commit3` (Rule #9 event-log)
**Status:** SHIPPED. Static gates green; all four browser-smoke gates passed.

## What was asked

Build commit 3 of the weakness-tracker (Task 1h): a pre-check confidence
rating, captured before the answer is checked, written onto the `weakness-`
record that every call site already stamped with `confidence: null`. Plan-first
sign-off happened in the prior turn (relay `21d65ce`); this session implements
the approved plan.

## Decision resolved before building (Rule #12)

The ship prompt's first text described a **3-button** scale (certain / probably /
guessing, quoting PLAN.md feature #1). Pre-flight + plan review surfaced that this
conflicts with the **signed-off 4-button scale** in `9c5df20` (scoping Q-B-3:
no idea / guessed / fairly sure / certain → integer 0..3), which SCHEMA and the
15 commit-2 tests already assume. Supervisor adjudicated: **honor `9c5df20`'s
4-button scale**; PLAN.md feature #1 was the stale source and is corrected in
this commit.

Final scale + key map (rendered left-to-right so key position = value):

| key | label | value |
|---|---|---|
| q | no idea | 0 |
| w | guessed | 1 |
| e | fairly sure | 2 |
| r | certain | 3 |

## What was done

- **`src/study/weakness.js`** — added pure, DOM-free confidence primitives:
  `CONFIDENCE_LABELS`, `CONFIDENCE_KEYS`, and `confidenceFromKey(key)` (case-
  insensitive on the four keys; null for everything else so it doubles as a
  keydown-handler guard).
- **`src/secplus-quiz.jsx`:**
  - `confidenceForCurrent` state in `QuizTab`, reset to null per-question in the
    existing `useEffect([idx])`.
  - Added `confidenceForCurrent` to `kbdRef.current` so the mount-time keydown
    listener reads the live value at write time (Fix A pattern — no stale
    closure).
  - New keyboard branch: q/w/e/r set the rating, gated to pre-check
    (`!showExp`) + answer-selected, matching the visible rater.
  - Three MC/scen write sites (keyboard-rate, keyboard-fallback, mouse
    rate-button) now write `confidence: <selection>` instead of `null`.
    **Matching and exam sites stay `null`** by design (matching is per-pair
    rich; exam is the test-condition mode where coaching metacognition is
    wrong).
  - New `<ConfidenceRater>` component rendered between the option grid and Check
    Answer, gated `!checked && selected !== undefined && type==="mc"`; covers MC
    + scenario (shared `type:"mc"` path). Skippable; clicking the active button
    clears it. Shortcut-hint line updated.
- **`src/study/__tests__/weakness.test.js`** — 7 new tests: q/w/e/r mapping,
  case-insensitivity, null for non-confidence keys / non-string / multi-char,
  key↔label↔value consistency, and that `confidence: 0` is written while `null`
  is omitted.
- **`package.json`** — `test` script glob extended to include
  `src/study/__tests__/*.test.js`. **Inherited test-coverage gap closed (not a
  new regression):** commit 2's 15 weakness tests were authored and passing but
  were never in the `npm test` glob, so they were **not enforced in CI between
  commit 2 (`0b831ba`) and this commit**. They still pass; the gap was that a
  regression in `weakness.js` over that window would not have failed `npm test`.
  This commit brings all 22 weakness tests (15 prior + 7 new) into the run.
- **`PLAN.md`** — feature #1 corrected from the stale 3-button text to the
  shipped 4-button reality, pointing at `9c5df20` as the live decision and the
  `weakness-` record (not SM-2) as the store.

## Validation

- `npm test` — **75/75 pass** (was 53; +22 from the glob fix).
- `node scripts/validate-questions.mjs` — 0 errors, 4 pre-existing content
  warns (`best-most-short-distractor`), unrelated to this commit.
- `npm run build` — clean (the >500 kB chunk warning is pre-existing).
- Browser smoke — **all four gates PASSED** (Aiden, 2026-06-01):
  - (a) rater shows after option-select, hidden after Check — confirmed.
  - (b) `e`→2 and `r`→3 written correctly, keyboard AND mouse — the commit-2
    stale-closure path is clean.
  - (c) resets between questions at the value level (two consecutive unrated
    questions carry no confidence; a `w` press shows a distinct 1; no bleed).
  - (d) an unrated question writes the full record with `confidence` **omitted**
    (key absent, not `null`) — confirmed against the live localStorage string
    (`"confidence" in record === false`), matching the helper-level test.

  **Gate-(d) measurement-artefact note:** the initial scare ("skipped question
  has confidence:3") was a *measurement* fault, not a code fault. The first
  console snippet used alphabetical `.sort().pop()`, which kept returning a
  stale `scen-1.2.2-0` record (confidence 3 from gate b) regardless of recency.
  A timestamp-sorted dump showed unrated questions correctly write
  `confidence: undefined` (omitted). No code change resulted.

## Schema / sync impact

None. Additive optional field already reserved by `buildWeaknessRecord`; no
`schemaVersion` bump; `weakness-` already a `TRACKED_PREFIX`; no migration.

## Boundaries honored

- No SM-2 key changes; no progress-storage schema change.
- Matching/exam confidence deferred per scoping §2.2 (not silently added).
- Plan-first → sign-off → implement; smoke gate before commit.

## Design decision locked: rating stays OPTIONAL

The confidence rating is optional (Q-4 as signed off and built), not a required
gate before Check. Rationale (recorded so it isn't re-litigated): a hard gate on
every question risks study-loop friction over long sessions — the spec's own
stated worry — which is the costlier and harder-to-reverse failure mode.
optional→required is a trivial later change. We let real study produce the
rating-rate data rather than reverse a signed-off decision on a prediction.

## Follow-up (study-surfaced, not pending work)

After ~3–5 real study sessions on the new loop, query the fraction of
`weakness-` records that carry a `confidence` value. If ratings are too sparse
to be useful, *that data* decides whether the optional rating needs a soft nudge
(e.g. a gentle prompt, still not a hard gate). No nudge is built speculatively —
this is a decision to make when the usage data exists, not a queued task.

## What's next

Remaining Task 1h commits — pause-on-blur Q-C-3 (commit 4), import/export Q-F-1
(commit 5), SCHEMA.md §weakness records (commit 6), docs sync (commit 7).
