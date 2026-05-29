# Task 1g.8 plan — `framing_note` display wire-up (for sign-off)

**Date:** 2026-05-29
**Base HEAD:** `75d866d` (1g.7 doc/closeout)
**Predecessor:** Report-#0024 L6 (data populated in 1g.6, display never wired)
**Status:** plan-only — no edits staged

## Purpose

Surface the Sybex `framing_note` field study-facing on items that carry one. Closes the 1g arc by landing the display half that 1g.6 scoped but did not implement. Aiden's 2026-05-29 browser smoke confirmed the field is populated in the corpus (verified by reading the `2.2.sybex` ch04-q1 record post-merge) but never surfaces in the answer UI — `grep -rn framing_note src/` returns zero hits.

## Scope

- Single render hook in `src/secplus-quiz.jsx`, in the existing explanation block (current location: `src/secplus-quiz.jsx:1611-1615` at HEAD `75d866d`).
- Read `q.framing_note` after the existing `q.exp` render; render conditionally when the field is present and truthy.
- No data path change. No SM-2 key change. No validator change. No schema migration. No `questions.json` touch.

## Current state at HEAD `75d866d`

The MC/scenario explanation block reads:

```jsx
{showExp && (
  <div style={styles.explanation}>
    <strong>{selected === q.a ? "✓ Correct!" : "✗ Incorrect."}</strong> {q.exp}
  </div>
)}
```

Renders for both MC and scenario items (scenarios pass through the same Question component). The MatchingQuestion component has its own `showExp` block at line 1754 — out of scope for 1g.8 since the 499-item Sybex fold-in has zero matching items. Line 2290 is a separate non-quiz render path (likely review/history view) — also out of scope.

## Open adjudication questions

CC leans recommended below; supervisor's call on each.

**Q-A — Render placement.** After `q.exp` in the same `<div>`, or as a separate visually-distinct block?

- **A1 (recommended)** — Separate block immediately after the explanation `<div>`, visually distinct.
- A2 — Inline at the end of the explanation div with a `<br/>` separator.

**Q-B — Visual style.** What treatment makes this read as study-relevant context vs. a noisy UI addition?

- **B1 (recommended)** — Bordered callout with subtle background tint and a label prefix.
- B2 — Italic body text with no label.
- B3 — Same styling as `q.exp`, no differentiation.

**Q-C — Label text.** If labelled (B1), what wording?

- **C1 (recommended)** — `"Sybex framing note"` (explicit source attribution; matches the SCHEMA term).
- C2 — `"Why this matters for the exam"`.
- C3 — No label.

**Q-D — Always-on, or gated to wrong-answer.**

- **D1 (recommended)** — Always render when `q.framing_note` is truthy. The framing_note documents a divergence the learner needs to know whether they got the answer right by luck or by reasoning.
- D2 — Render only when `selected !== q.a` (wrong-answer learning moment).

**Q-E — Markdown rendering.** The framing_note text uses backtick inline code (e.g. `` `amaz0n.com` ``) — render literally or interpret?

- **E1 (recommended)** — Literal text. The current `q.exp` is plain text; staying consistent avoids introducing a markdown dependency for one field.
- E2 — Lightweight inline-code formatting via a custom span wrapper.

**Q-F — Scope (revisit).** Just the MC/scenario block at 1611-1615, or also matching (1754) and review-view (2290)?

- **F1 (recommended)** — MC/scenario only. The 499 Sybex items are all MC; matching/review can fold in if a future Sybex fold-in adds those types. Avoids touching three render sites for a five-anchor smoke surface.
- F2 — Thread through all three render sites in this commit.

## Implementation outline (post-sign-off)

1. **Rule #12 pre-flight:** re-grep `framing_note` in `src/` to confirm the gap is still live; re-read the explanation block in case line numbers drifted.
2. Apply chosen Q-A through Q-F decisions as a single targeted edit in `src/secplus-quiz.jsx`.
3. Add a `styles.framingNote` entry if B1 is chosen.
4. `npm run build` → expect clean.
5. `npm test` → expect 53/53 (no derivation touched; sm2-keys regression unchanged).
6. Start dev server.
7. Aiden browser smoke:
   - `2.2.sybex` ch04-q1 (Joseph/amaz0n.com phishing-vs-typosquat — primary anchor).
   - `3.1.sybex` ch08-q3 (cloud identity — secondary anchor).
   - Any non-Sybex item — confirm the framing-note block does NOT render (false-positive check).
8. Write `Reports/Report-#0025.md` covering decisions, files changed, smoke result.
9. Commit + push.

## Verification gates (pre-ship)

- Validator: 0 errors / 4 pre-existing warns (unchanged — no item touched).
- Tests: 53/53 green (no derivation touched).
- `npm run build`: clean.
- Dev server: boots clean.
- Aiden browser smoke: ≥1 anchor displays the framing_note; ≥1 non-Sybex item does not.

## Files anticipated

- `src/secplus-quiz.jsx` — single render-hook addition (~5-15 lines depending on Q-B / Q-C).
- `Reports/Report-#0025.md` — new.
- `.audit-working/runs/2026-05-?-task-1g-8-display.eventlog.ndjson` — Rule #9.

No `questions.json`, no `SCHEMA.md`, no validator, no sync-engine, no key derivation.

## Risk

Minimal — additive UI render in a conditional block. No state path, no key path, no storage path. Worst plausible regression: layout glitch on the explanation block for non-Sybex items, mitigated by Q-D / D1 lean rendering only when `q.framing_note` is truthy (non-Sybex items have no `framing_note` field, so the condition is false and the block is never inserted).

## What this does NOT do

- Does NOT add `framing_note` to non-Sybex items (no schema extension).
- Does NOT change the audit framework (`sourceProvenance` filter unchanged).
- Does NOT alter the matching (line 1754) or review-view (line 2290) render paths.
- Does NOT introduce a markdown rendering library.

## Sign-off needed

The six Q-letters above. Lean recommendations marked; supervisor's call on each. The implementation ships in one commit post-sign-off; Aiden's browser smoke at ≥1 anchor is the gate before commit lands.
