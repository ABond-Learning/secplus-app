# Report-#0024 — Task 1g.7: 1g arc closeout — known limitations + doc consistency fix

**Date:** 2026-05-29
**Run ID:** `2026-05-29-task-1g-7-closeout`
**1g.6 ship:** `f39c358`. **HEAD at 1g.7 start:** `a7ea18a` (two docs-only handoff refreshes on top of `f39c358` — `7a08ce4` + `a7ea18a`; no code/corpus/schema changes between).
**Scope:** docs-only — no `questions.json` touch, no app code, no validator change.

## What was asked

Close out the Task 1g arc by (a) capturing the known limitations of the merge that
1g.6 (`f39c358`) carried forward as a documented baseline rather than a quality bar
to beat, and (b) reconciling the SM-2 key-order documentation across PLAN.md /
SCHEMA.md / supervisor-handoff.md / Report-#0022 / Report-#0023 to the canonical
shipped order, `sybex-mc-{ch|pe}NN-q{N}` (Option A: `sybex-` outer prefix, type
inner). Pre-1g.6 docs cited the inverted `mc-sybex-` order, which was never the
shipped form — Aiden confirmed Option A on 2026-05-28 and `src/sm2-keys.js` ships
the `sybex-` outer prefix exclusively.

## What 1g.6 actually shipped (recap, for the limitations frame)

- **499 of 500 Sybex items merged** into `questions.json` under 28 synthetic
  `X.Y.sybex` videos (B1-aggregated per the supervisor's Q-B for Task 1g).
- **App SM-2 key derivation extracted** to `src/sm2-keys.js` (57 lines).
  `mcKey`/`scenKey`/`matchKey` take an optional `item`; when `item.sybex_reference`
  is present they emit `sybex-<type>-<bucket>NN-q<n>`; otherwise they emit the
  legacy `<type>-<videoId>-<qi>` form byte-identically. The regression test
  (`src/__tests__/sm2-keys.test.js`) walks every item in `questions.json` and
  asserts the right form per item — zero existing-key drift.
- **`sybex-` TRACKED_PREFIX is load-bearing** (was added defensively at 1g.0;
  activated at 1g.6). The `mc-` prefix does NOT cover Sybex keys — `sybex-mc-*`
  keys lead with `sybex-`, matched by the `sybex-` entry.
- **`DomainAccuracyCard` builds a key→videoId index** from sections so
  Sybex-keyed SM-2 records get bucketed by the synthetic video that holds them;
  legacy keys still fall through to `videoIdFromKey`.
- **5 `framing_note` strings** attached at the accidental-match anchors
  (ch04-q1, ch08-q3, ch11-q15, ch12-q17, ch14-q20), documenting Sybex-vs-common-
  Security+ divergence (Aiden-approved 2026-05-28).

Quality gates at `f39c358`: validator 0 errors / 4 pre-existing warns; tests 53/53
green (sync 41 + sm2-keys 12, including the byte-identical regression);
`npm run build` clean; dev server boots clean.

## Known limitations (1g.6 baseline; not bugs)

### L1. One item skipped: `sybex-ch02-q19`

"Choose-two" question with 5 options; falls outside the canonical 4-option
single-correct MC shape `questions.json` carries today. Net effect: 499/500 (99.8%)
of the Sybex MC corpus is folded in. A multi-correct shape would require a schema
extension (`correctAnswers: [Letter, ...]` plus app rendering / scoring changes)
that is not in 1g scope. Carried as a single-item limitation rather than gating
the merge.

### L2. `ambiguity_flag` under-fires in the judge (v1 prompt)

Calibration scorecard (n=30):

| Source       | flagged true | total |
|--------------|-------------:|------:|
| Judge        | 0 | 30 |
| Blind reader | 6 | 30 |

Corpus full run (n=500): judge flagged 0. The v1 judge prompt has no ambiguity
sanity check; the blind reader's 6 flags correspond to questions where the answer
is defensible under multiple sub-objectives (ch03-q1, ch08-q3, ch11-q11, ch16-q5,
pe01-q58, pe02-q90). The judge treats these as ordinary high-confidence
classifications. **Implication:** the assigned objective code on these items
should not be treated as exclusively definitive — they're "primary tagging" not
"only tagging." A future v2 prompt with an ambiguity sanity check would let
ambiguous items surface their alternate codes.

### L3. `confidence` field is non-discriminating

Calibration scorecard:

| Slice | Count |
|-------|------:|
| Judge verdicts at confidence=high | 28 / 30 |
| ...agreed with blind | 25 |
| ...diverged from blind | 3 |
| Total disagreements | 3 |
| ...at judge confidence=high | 3 |

100% of calibration disagreements were at the judge's `confidence=high`. The
confidence field does not predict agreement and should not be used as a quality
gate or filter. Acts as session metadata only.

### L4. Judge over-picks 4.4 ("software development lifecycle") over 4.9 ("vulnerability management")

Corpus disagreement clustering, top judge codes:

| code | disagreements | as % of 79 |
|------|--------------:|-----------:|
| 4.4 | 16 | 20.3% |
| 3.2 | 11 | 13.9% |
| 2.5 | 8 | 10.1% |
| 2.4 | 7 | 8.9% |

Three Chapter-14 items (ch14-q14, ch14-q16, ch14-q20) are all judge=4.4 /
blind=4.9. These items frame around "secure coding practices broadly" (4.4 in the
judge's read) and "vulnerability management response workflows" (4.9 in the blind
reader's). Both are defensible; the judge's lean is systematic in this seam.

### L5. Cross-domain boundary seams (3.2↔4.5, 2.x↔4.x, 2.5↔4.1)

Cross-domain disagreement pair counts (n=45 of 79 total disagreements):

| domain pair (judge↔blind) | count |
|---------------------------|------:|
| 2↔4 | 13 |
| 3↔4 | 9 |
| 4↔2 | 4 |
| 1↔4 | 4 |
| 2↔5 | 3 |
| 5↔3 | 3 |

Specific seam clusters in the per-item disagreement list:

- **3.2 (architecture / enterprise infrastructure) ↔ 4.5 (incident response):**
  6+ items (ch12-q3, ch12-q9, ch12-q10, ch12-q12, pe02-q9, pe02-q20). Sybex
  Chapter 12 framing places these in incident response (4.5) where the judge
  reads enterprise infrastructure (3.2).
- **2.x (threats/vulns) ↔ 4.x (security ops):** 13+4 = 17 items. Items framed
  around attack technique (2.x) versus operational response (4.x) — both lenses
  are defensible per Security+ objectives.
- **2.5 ↔ 4.1 (mitigation techniques ↔ security techniques applied to
  enterprise):** 4 items (ch11-q8, ch11-q11, pe02-q42 partial). Edge cases where
  the same technique reads as mitigation (2.5) or applied security control (4.1).

**Net:** 84.2% strict / 91.0% domain-collapse agreement on the corpus run is
defensible boundary noise, not a quality regression. The supervisor's
2026-05-28 close-banner phrasing ("disagreements on defensible boundary seams") is
the right frame.

### L6. `framing_note` display not yet wired

The 5 anchor items carry correct, populated `framing_note` fields in the corpus
(verified), but no quiz/explanation component reads the field — `grep src/`
returns zero references. Browser smoke 2026-05-29 confirmed render +
pool-inclusion pass; `framing_note` does not surface study-facing. Deferred to
1g.8 (one render hook in the explanation component + re-smoke). 1g closure note
below reflects this — the data half landed at `f39c358`, the doc/closeout half
lands at this commit, and the display half lands at 1g.8.

## What was done in 1g.7 (this commit)

Doc consistency pass to bring all SM-2-key citations to the canonical
`sybex-mc-` order at HEAD `f39c358`.

- **PLAN.md** — 2 lines (Task 1g design block). Live correction.
- **docs/supervisor-handoff.md** — 2 lines (architectural finding in the
  2026-05-27 banner). Live correction.
- **SCHEMA.md** — 4 lines straight substitution (key-pattern table + scen/match/cram
  forward-looking paragraph + the "would yield" example in the app-wiring paragraph),
  plus a TRACKED_PREFIXES rewrite covering 6 more lines: the `mc-` entry's
  parenthetical and the `sybex-` entry's whole paragraph both had to change from
  "`mc-` covers `mc-sybex-*` keys; `sybex-` is defensive" to "`mc-` covers
  legacy only; `sybex-` is load-bearing for `sybex-mc-*` and any future
  `sybex-scen-*` / `sybex-match-*` / `sybex-cram-*`." This is a semantic correction
  beyond pure substitution because the documented coverage logic was inverted.
- **Reports/Report-#0022.md** + **Reports/Report-#0023.md** — appended one-line
  erratum footers per the supervisor's 1g.7 spec. Shipped report text left
  as-authored (no history rewrite).
- **Reports/Report-#0024.md** — this file.

## Files changed

- `PLAN.md`
- `SCHEMA.md`
- `docs/supervisor-handoff.md`
- `Reports/Report-#0022.md` (erratum footer appended)
- `Reports/Report-#0023.md` (erratum footer appended)
- `Reports/Report-#0024.md` (new — this file)

## Boundaries honored

- Docs-only. No `questions.json` item touched. No code change in `src/`. No
  validator change. No schema migration.
- Pre-1g.6 reports preserved as-authored — corrected via erratum footer, not
  history rewrite.
- Living docs (PLAN, SCHEMA, handoff) corrected in place.
- The semantic TRACKED_PREFIXES rewrite in SCHEMA.md is flagged separately
  in this report so it can be reverted if it overreaches 1g.7 scope.

## Browser smoke result (2026-05-29)

Aiden ran the smoke at `http://localhost:5173/secplus-app/` post-staging.
The two carry-forward checks from 1g.6 (render + pool-inclusion) PASSED;
the third (framing_note display) surfaced the L6 gap.

- **Render PASS** — synthetic Sybex videos appear in the section list; Sybex
  items render cleanly in the quiz UI (verified on `1.1.sybex` Carl/PCI-DSS
  compensating + Brady/DLP technical, both Chapter 4 control-type items).
- **Pool-inclusion PASS** — study modes pull Sybex items into the active pool.
  The low item count on `1.1.sybex` (3 MC) is the real corpus shape, not a
  filter bug — see L4/L5 (judge classifies by question content, not Sybex
  chapter; Sybex Chapter 1 maps mostly to 1.2/1.4 in SY0-701).
- **framing_note display GAP** — Aiden reached `2.2.sybex` ch04-q1 (the
  Joseph/amaz0n.com anchor), answered it, and the explanation block showed
  only `exp`. `framing_note` field is populated in the corpus but no component
  reads it. See L6. Carried open as 1g.8.

## What's next

- **1g.7 closes the doc/closeout half** of the 1g arc — five-file doc fix +
  erratum footers on `Report-#0022` and `Report-#0023` + this report.
- **1g.8 — framing_note display wire-up (next ship, plan-first).** One render
  hook in the quiz explanation component that reads `item.framing_note` and
  surfaces it after `exp` when present. Smoke-pass target: anchor items on
  `2.2.sybex` (ch04-q1, the Joseph/phishing-vs-typosquat note) and
  `3.1.sybex` (ch08-q3 cloud identity + ch11-q15 embedded constraints). Plan
  goes to the relay tree for sign-off before implementation.
- **The 1g arc closes when 1g.8 ships** — data half at `f39c358`,
  doc/closeout half at this commit, display half at 1g.8.
- The six named limitations (L1-L6) are documented baseline. L1-L5 are
  defensible boundary characteristics carried as documented behaviour; L6 is
  the deferred display wire-up.
- Task 1 closeout pending — separate scoping conversation.
