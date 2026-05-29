# Report-#0025 — Task 1g.8: `framing_note` display wire-up — 1g arc CLOSED

**Date:** 2026-05-29
**Run ID:** `2026-05-29-task-1g-8-display`
**Base HEAD:** `33eaa48` (1g.8 plan publication; itself on top of `75d866d` 1g.7 doc/closeout)
**Predecessor:** Report-#0024 L6 (data populated and verified in 1g.6, display never wired)
**Plan (signed off):** `.audit-working/relays/from-cc/task-1g-8/task-1g-8-plan.md` (commit `33eaa48`)
**Scope:** single targeted edit in `src/secplus-quiz.jsx` — render hook + companion style.

## What was asked

Wire the Sybex `framing_note` field study-facing on items that carry one. The 1g.6 fold-in
(`f39c358`) populated the field on the 5 accidental-match anchors (ch04-q1, ch08-q3,
ch11-q15, ch12-q17, ch14-q20) and the regression test verifies it on disk, but no React
component read the field — `grep -rn framing_note src/` returned zero hits at HEAD pre-1g.8.
Aiden's 2026-05-29 browser smoke at the `2.2.sybex` ch04-q1 anchor caught the gap; 1g.8 is
the closing piece of the 1g arc, landing the display half.

## The six adjudicated decisions (all approved; one tightened)

1. **Q-A — A1 approved.** Separate block immediately after the explanation `<div>`,
   visually distinct.
2. **Q-B — B1 approved.** Bordered callout with subtle tint and a label prefix.
3. **Q-C — tightened C2.** The plan's lean was C1 (`"Sybex framing note"`); supervisor
   redirected to C2 with reasoning: the label should signal the note's **value** (how
   the exam reasons) not its **source** (which Sybex book it came from). Final wording:
   **`"Exam framing:"`** — short, leads with exam-relevance, reads cleanly as a callout
   label prefix. The longer alternative `"Why the exam scores it this way"` was also
   offered; the styling-call-on-length latitude went to "Exam framing".
4. **Q-D — D1 approved with hard gate.** Render whenever `q.framing_note` is truthy AND
   only inside the existing `{showExp && ...}` block — never before the answer is
   checked. The ch04-q1 note names the answer reasoning verbatim ("an email arrives
   unsolicited... that is phishing"), so pre-check display would be a direct answer
   leak. Implementation: the new `<div>` is a sibling of the explanation `<div>`,
   both wrapped in a Fragment inside the single `showExp` gate — React structurally
   does not render either until `showExp` flips true. Confirmed by smoke (Gate 1
   PASS), not assumed from structure.
5. **Q-E — E1 approved.** Literal text, no markdown processing — backticks render
   literally. Future polish if it grates; not blocking.
6. **Q-F — F1 approved.** MC/scenario block only (`src/secplus-quiz.jsx:1611-1615`).
   Matching (line 1754) and review-view (line 2290) out of scope — the 499-item Sybex
   fold-in is all MC; YAGNI.

## Implementation

Two micro-edits in `src/secplus-quiz.jsx`. Net +9 lines.

**Render hook (around line 1611) — wrap the explanation in a Fragment that also renders
the framing_note conditionally:**

```jsx
{showExp && (
  <>
    <div style={styles.explanation}>
      <strong>{selected === q.a ? "✓ Correct!" : "✗ Incorrect."}</strong> {q.exp}
    </div>
    {q.framing_note && (
      <div style={styles.framingNote}>
        <strong>Exam framing:</strong> {q.framing_note}
      </div>
    )}
  </>
)}
```

**Companion style (added to the `styles` object, alongside `styles.explanation`):**

```js
framingNote: { background: "#0f172a", border: "1px solid #334155", borderLeft: "3px solid #a78bfa", borderRadius: 8, padding: "12px", fontSize: 14, color: "#cbd5e1", lineHeight: 1.6, marginTop: 8 },
```

Same baseline as `styles.explanation` (matches the existing visual language) with three
deltas:

- `borderLeft: "3px solid #a78bfa"` — violet accent. Distinct from the green/red
  used by `optionCorrect` / `optionWrong` (so the callout doesn't compete with the
  ✓/✗ signal) and from the un-accented explanation div (so the two blocks read as
  related-but-different).
- `color: "#cbd5e1"` — slightly brighter than the explanation's `#94a3b8`, signalling
  additive context vs. supplemental explanation.
- `marginTop: 8` (vs. `12` for the explanation) — tighter spacing so the two blocks
  visually pair as a unit.

## Verification

- **Validator:** 0 errors / 4 pre-existing warns (unchanged — no item touched).
- **Tests:** 53/53 PASS (no derivation touched; sm2-keys byte-identical regression
  unchanged; sync-engine integration unchanged).
- **`npm run build`:** clean — `✓ built in 718ms`; pre-existing chunk-size advisory only.
- **Dev server:** boots clean; HMR live (Vite v8.0.10).

## Browser smoke result (2026-05-29)

Three gates, all PASS:

- **Gate 1 — pre-check leak test (ch04-q1):** No "Exam framing" callout visible before
  Check is pressed on the `2.2.sybex` ch04-q1 anchor. PASS. Confirmed by smoke (per
  supervisor direction) rather than assumed from JSX structure.
- **Gate 2 — post-check display (ch04-q1):** Standard explanation block renders, then
  immediately below it the "Exam framing:" callout renders with the violet left-border
  accent and the typosquat/phishing framing text. PASS, after a hard refresh cleared a
  stale HMR bundle in the open browser tab.
- **Gate 3 — non-Sybex no-show:** Confirmed on a non-Sybex Messer item AND on all
  other Sybex items (only the 5 anchors carry `framing_note`; the other 494 Sybex
  items correctly render no callout). PASS.

**Smoke lesson — stale HMR.** Vite HMR is structurally fine but the open browser
tab during the smoke was holding a pre-edit bundle on the page that the explanation
block re-used; the first answer-check post-edit showed explanation only, no
"Exam framing". Hard refresh (Ctrl+Shift+R) cleared the cached bundle and the
callout rendered correctly on the next attempt. Worth noting for future UI smokes:
if a behaviour change doesn't surface after a Vite save, do a hard refresh before
diagnosing the code.

## Files changed

- `src/secplus-quiz.jsx` — render hook at the MC/scenario explanation block + new
  `styles.framingNote` entry. Net +9 lines.
- `PLAN.md` — Task 1g status block: 1g.8 SHIPPED, 1g arc CLOSED.
- `docs/supervisor-handoff.md` — top header + new 2026-05-29 banner recording
  1g.7 + 1g.8 ships and the 1g arc close.
- `Reports/Report-#0025.md` — this report.
- `.audit-working/runs/2026-05-29-task-1g-8-display.eventlog.ndjson` — Rule #9
  event log.

## Boundaries honored

- Single targeted edit in `src/secplus-quiz.jsx`. No `questions.json` touch. No
  schema change. No validator change. No sync-engine touch. No SM-2 key derivation
  change.
- Matching (`src/secplus-quiz.jsx:1754`) and review-view (`src/secplus-quiz.jsx:2290`)
  render paths untouched — Q-F1 scope.
- The framing_note JSX is structurally inside the existing `showExp` gate; the
  Fragment wrapper is the only structural change to the existing block.
- Rule #9 event log written at state transitions across both 1g.7 and 1g.8 runs
  (`2026-05-29-task-1g-7-closeout` + `2026-05-29-task-1g-8-display`).
- Rule #12 pre-flight done before staging: `grep -rn framing_note src/` zero hits
  confirmed; explanation block at line 1611-1615 unmoved since plan was written.

## 1g arc close (2026-05-29)

The Task 1g Sybex fold-in arc ships across three commits:

| Half | Commit | Scope |
|---|---|---|
| Data | `f39c358` | 499/500 items merged + SM-2 key derivation + 5 framing_notes populated + regression test |
| Doc/closeout | `75d866d` | 5-file SM-2 key-order doc fix + Report-#0024 (L1-L6 limitations) + erratum footers on Reports #0022 + #0023 |
| Display | this commit | `framing_note` render hook + companion style + 3-gate smoke PASS |

**1g.3 closes here.** All six sub-objective scoping questions (Q-A through Q-F per
Task 1g) shipped per their adjudicated decisions across 1g.0 through 1g.8. The 499
Sybex items are now study-facing with their `sybex-mc-*` SM-2 keys synced via the
load-bearing `sybex-` TRACKED_PREFIX, and the 5 accidental-match anchors surface
their `framing_note` text post-check in a visually-distinct callout.

Six known limitations recorded in Report-#0024 stand as documented baseline:

- L1: 1/500 skipped (`sybex-ch02-q19`, 5-option choose-two).
- L2: judge v1 `ambiguity_flag` under-fires.
- L3: judge `confidence` field non-discriminating.
- L4: judge 4.4-over-4.9 lean (16 of 79 corpus disagreements).
- L5: cross-domain boundary seams (2x↔4x, 3.2↔4.5, 2.5↔4.1).
- L6: `framing_note` display — **CLOSED in this commit**.

## What's next

- **Task 1 closeout** — separate scoping conversation. The 1g arc closing
  completes the last sub-objective under Task 1f-Audit D's umbrella; Task 1
  proper (the foundational refactor + content rebalance per CLAUDE.md
  "The 3-Task Plan") still has open closeout work surfaced across the prior
  sub-batches (Reports/Report-#0007 and #0008 catalogue them).
- **Task 2** — mode consolidation work is mid-stream (sub-batches 0-2C
  shipped per memory; matching kept standalone; preset persistence per design
  v2 §3.4).
- **Weakness-tracker (Task 1h)** — commits 3-8 pending (ConfidenceRater UI +
  pause-on-blur + import/export + SCHEMA + docs + Report-#NNNN), gated on
  q/w/e/r keyboard-collision check.

No 1g sub-batch open. The 1g arc is CLOSED.
