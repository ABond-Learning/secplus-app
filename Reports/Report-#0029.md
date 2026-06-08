# Report-#0029 — Suppress 6 figure-dependent Sybex MC items (Tier A)

**Date:** 2026-06-08
**Run:** 2026-06-08-sybex-figure-scan
**Type:** Content remediation (soft-retire) + pool-build guard + affirmative test

## What was asked

Following the 2026-06-08 figure-dependent scan (status block:
`.audit-working/sybex-figure-dependent-scan.md`), suppress the 6 confirmed
Tier-A Sybex MC items that depend on a book figure not carried into the fold-in
and are therefore unanswerable as text. Disposition: **flag, not delete**
(reversible). Tier B (2 items) and Tier C left untouched per Aiden's sign-off.

Added requirement: an **affirmative exclusion check** — prove the 6 are actually
excluded from the served pool and that the guard bites by exactly 6, not merely
that nothing regressed.

## The 6 suppressed items (content-derived keys)

| SM-2 key | Video | Stem (abridged) |
|---|---|---|
| `sybex-mc-ch09-q19` | 1.2.sybex | What type of physical security control is shown here? |
| `sybex-mc-pe02-q26` | 2.4.sybex | …Wireshark…the traffic shown here. What…network event? |
| `sybex-mc-pe01-q85` | 3.3.sybex | …the following table. What data minimization technique…? |
| `sybex-mc-pe02-q70` | 3.3.sybex | …printed roster…information shown here. What data protection…? |
| `sybex-mc-ch05-q8` | 4.3.sybex | …contained this vulnerability:[stripped image] What security control…? |
| `sybex-mc-ch14-q1` | 4.8.sybex | The following figure shows the…incident response cycle. What item is missing? |

## What was done

1. **Flag mechanism (not deletion).** Added `suppressed: true` +
   `suppressionReason` to each of the 6 items in `questions.json`, in place.
   Full record (`q`/`opts`/`a`/`exp`/`sybex_reference`) left intact; reversible
   by removing the two fields. Applied via `scripts/suppress-figure-items.mjs`,
   which matches by content-derived key (order-independent, re-runnable) and
   hard-fails unless exactly 6 are flagged. Diff: 18 insertions / 6 deletions,
   only the 6 objects touched.

2. **Pool-build guards (`q.suppressed === true`).** Two serving paths, both via
   early-return inside the existing `forEach` so surviving items keep their `qi`
   (no filter-then-index):
   - `src/study/buildPool.js` Step 2 (mc + scen) — Quiz/Flashcards/Review/Drill/preview.
   - `src/secplus-quiz.jsx` `startExam()` byDomain — exam simulator.

3. **Availability-count guards (Aiden decision #1 = include).** Same exclusion
   in the 3 stat sites so dashboards stay honest: `totalQ` (~L869),
   `newToPractice` (~L889/892), `stats[d].available` (~L1083).

4. **Schema contract (Aiden decision #2 = in this commit).** Documented
   `suppressed` + `suppressionReason` as optional MC fields in `SCHEMA.md`
   (Workflow Rule #4).

5. **Affirmative exclusion test** — `src/study/__tests__/buildPool-suppression.test.js`
   (in the `npm test` glob), 3 assertions:
   - all 6 keys are flagged in questions.json;
   - none of the 6 appear in a full `buildPool()` served set (asserted by
     content-derived key, not array position);
   - **positive control**: same build with flags stripped yields exactly 6 more
     items, and the control pool contains all 6 — proving the flag is the sole
     exclusion cause and the guard bites by the right amount.

## Affirmative outcome

**6 figure-dependent items confirmed excluded from the pool; pool size 1376 → 1370
(delta exactly 6).** The 6 are present in the guard-disabled control pool and
absent from the guard-live served pool. This is a proven exclusion, not a
no-regression inference.

## Index / SM-2 key safety

No SM-2 key changed value. Flagging mutates no array (no `qi` shift); and the 6
live only in `.sybex` videos, which are separate video objects from the Messer
videos in the same sections (e.g. `1.2.sybex` ≠ `1.2.1`…`1.2.7`). The sm2-keys
byte-identical regression test stays green. No Messer-cited item affected.

## Gates (pre → post)

| Gate | Pre | Post |
|---|---|---|
| `validate-questions.mjs` | 0 err / 4 warn | 0 err / 4 warn (pre-existing `best-most-short-distractor`, unrelated) |
| `npm test` | 79 pass | 82 pass / 0 fail (+3 new) |
| `npm run build` | green | green |

## Files changed

- `questions.json` — 6 items flagged
- `src/study/buildPool.js` — mc + scen guards
- `src/secplus-quiz.jsx` — startExam guard + 3 stat-count guards
- `SCHEMA.md` — `suppressed` / `suppressionReason` documented
- `scripts/suppress-figure-items.mjs` — one-shot flagger (new)
- `src/study/__tests__/buildPool-suppression.test.js` — exclusion proof (new)
- `Reports/Report-#0029.md` — this report

## Boundaries honored

Flag not delete (reversible); Tier B/C untouched; no Sybex stem text reworded
(Tier-1 sourcing line); single-purpose commit; SCHEMA.md is the Rule #4 contract,
not narrative docs.

## Out of scope / noted

`buildPool.js`'s local SM-2 filter helpers use the legacy index form
(`mc-${videoId}-${qi}`) rather than the content-derived Sybex key, so
preferUnseen/dueOnly/belowAccuracy mis-key Sybex items — a pre-existing latent
bug, untouched here to keep this commit single-purpose. Flagged for a future
session.

## What's next

Commit landed; **push pending Aiden sign-off** on the post-state gate results +
exclusion-check output. After push: 24h is not required (no sync-prefix change —
`suppressed` is a content field, not a TRACKED_PREFIXES change).
