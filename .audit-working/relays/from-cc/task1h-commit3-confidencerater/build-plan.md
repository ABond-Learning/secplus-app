# Task 1h commit 3 — ConfidenceRater UI: build plan (plan-first, no edits)

**Rule #12:** before planning I cross-checked the ship prompt's scale ("three
choices: certain / probably / guessing") against the signed-off weakness-tracker
implementation plan (`9c5df20`) and the scoping doc — they **conflict** (3-button vs
4-button). That conflict is DECISION 1 below and gates the whole build; everything
downstream is written against it. Capture is live, q/w/e/r are free, scenarios share
`type:"mc"` so one code path covers MC + scenario.

---

## DECISION 1 (BLOCKER) — confidence scale: 3 buttons or 4?

Two authoritative in-repo sources disagree:

**(A) PLAN.md feature #1** (lines 837–840, the source the ship prompt cites) and the
**ship prompt itself**:
> "Three-button row between option-select and Check Answer: **certain / probably /
> guessing**."

**(B) Signed-off implementation plan `9c5df20`, §6 + scoping doc Q-B-3** (adjudicated
*after* PLAN.md, with Aiden's sign-off):
> "Four-button row … **no idea / guessed / fairly sure / certain** … integer 0..3 …
> `q`/`w`/`e`/`r` map to confidence 0/1/2/3."

The scoping doc explicitly weighed a 3-button option (Q-B-2 "guessing / unsure /
confident") against the 4-button (Q-B-3) and the sign-off landed on **4-button**. So
the ship prompt has reverted to the older 3-button spec — possibly deliberately
(simpler, less friction), possibly because the Q-B-3 decision lives only in the
`.audit-working` impl plan and wasn't in view.

This needs an explicit one-word call before I build, because it changes the button
count, the stored encoding, the keyboard map, and the SCHEMA semantics line. **Good
news: nothing already shipped breaks either way** — the commit-2 helper writes
confidence with `if (confidence != null) r.confidence = confidence`, no range
validation, so it is scale-agnostic. The 15 unit tests assert "omitted when null /
written when present", not a specific range.

**My recommendation: go with the ship prompt's 3-choice (certain / probably /
guessing).** Reasons: (1) it's the current explicit instruction and matches PLAN.md
feature #1 — the canonical living tracker — verbatim; (2) coarser = lower friction,
which the spec itself flags as the main risk at point-of-failure; (3) 3 buckets still
capture both calibration signals the feature exists for (confident-and-wrong =
misconception; guessing-and-right = coverage gap); (4) zero shipped code breaks. The
cost is superseding the Q-B-3 sign-off — so I want that confirmed, not assumed.

**If you confirm 3-choice**, the rest of this plan applies as written. **If you'd
rather keep the signed-off 4-choice**, the deltas are flagged inline as `[4-choice:
…]`. Either is a clean build.

Sub-decision (minor, 3-choice only): I'll **store as integer `0=guessing, 1=probably,
2=certain`** (ascending = more confident), render buttons left→right
guessing→probably→certain, and map `q`/`w`/`e` to 0/1/2 (spatial L→R = low→high). This
keeps the encoding ordinal for a future calibration card and leaves `r` unused. (The
prompt *lists* them high→low; I flipped to ascending for sane sort order — say the
word if you want the literal certain/probably/guessing button order instead.)

---

## 1. Capture wiring — which of the 5 sites carry a real confidence value

| site | path | confidence |
|---|---|---|
| 1409 | QuizTab keyboard rate (post-check, mc/scen) | **real** — reads `confidenceForCurrent` |
| 1434 | QuizTab keyboard fallback-advance (mc/scen) | **real** |
| 1641 | QuizTab mouse rate-button (mc/scen) | **real** |
| 1522 | QuizTab matching `onNext` (per-pair) | **stays null** |
| 2133 | ExamTab submit | **stays null** |

The value is *selected* before Check (Q-A-1) and lives in `confidenceForCurrent`; the
three MC/scen sites *write* it at rating time (post-check), reading the same in-flight
selection. Matching and exam stay null, deliberately:

- **Matching stays null** — the answer shape is already per-pair-rich; a single
  whole-question confidence doesn't map onto N pairs cleanly (impl plan §6.5, scoping
  §2.2).
- **Exam stays null** — confidence is a *study-mode* coaching signal; the exam tab is
  the test-condition mode where the point is raw performance under time pressure, and
  a rating prompt would add friction at exactly the wrong moment (impl plan §6.5).
  Confidence is for the loop where you're *learning to calibrate*, not the loop where
  you're *simulating the test*.

## 2. UI placement

- **What's there now:** option grid (1590–1607) → optional `Check Answer` button
  (1624–1627, shown when `!checked && selected !== undefined`) → on check, explanation
  + the 4 SM-2 rating buttons (1636–1683).
- **What I'd add:** a `<ConfidenceRater>` row rendered **between the option grid and
  the Check Answer button**, gated on `!showExp && answers[idx] !== undefined &&
  q.type === "mc"` and **not** in the active-recall hidden-options state
  (`!hideOptions`). So: pick an option → rate confidence → Check. After check it's
  hidden (the SM-2 rating buttons take over that row).
- **Render:** one labelled row — `How confident are you?  [ guessing ] [ probably ]
  [ certain ]   (skip)` — reusing the existing option/`checkBtn` visual tokens
  (`#1e293b`/`#334155` borders, radius 6–8, same font sizes) but visually lighter than
  the answer options so it doesn't read as a 4th/5th choice. Selected button
  highlights with the existing `optionSelected` blue. Covers MC **and** scenario (same
  `type:"mc"` path). Not rendered for matching / exam / cram. `[4-choice: four buttons
  no idea/guessed/fairly sure/certain]`.

## 3. Keyboard

- **Mapping:** `q`=guessing(0), `w`=probably(1), `e`=certain(2). `r` unused.
  `[4-choice: q/w/e/r → 0/1/2/3]`. All free (pre-flight confirmed; full existing set
  is Escape/Space/Enter/1-4/n/p/f/arrows).
- **Where:** extend the *existing* QuizTab keydown handler (1363–1452) — not a new
  listener — with one branch: `else if (!ctx.showExp && ctx.answers[ctx.idx] !==
  undefined && ["q","w","e"].includes(key)) { e.preventDefault();
  setConfidenceForCurrent(mapKeyToConf(key)); }`. Gated to pre-check + answer-selected
  so key behavior matches when the UI row is actually visible. No collision with the
  numeric/Enter/Space branches (disjoint keys).
- **Stale-closure (Fix A reference) — how the value reaches the write without going
  stale:** the handler is mounted once (`[]` deps) so it must never read a closed-over
  state value. Two halves, both safe:
  1. *Setting* confidence on `q`/`w`/`e` calls `setConfidenceForCurrent(...)` — a
     React setter identity is stable, so calling it from the mount-time closure is
     always correct.
  2. *Writing* confidence at 1409/1434 reads `ctx.confidenceForCurrent` from
     `kbdRef.current`, **not** a closed-over `confidenceForCurrent`. I'll add
     `confidenceForCurrent` to the `kbdRef.current = {…}` assignment at line 1361 (it's
     re-assigned every render, so the ref is always live). This is exactly the Fix A
     pattern from commit 2 — read live state at write time, never at mount.
  - The mouse site (1641) is inside an `onClick` that re-renders each frame, so its
    closed-over `confidenceForCurrent` is already current; it reads the state var
    directly. Same single source of truth (`confidenceForCurrent`).

## 4. Optional vs required — recommend OPTIONAL (skippable)

`Check Answer` stays enabled regardless of whether a confidence button is pressed.
Skipping leaves `confidenceForCurrent === null` → the helper omits the field. Reasons:
required gating adds friction at the failure moment (the spec's own stated concern for
this feature family); a skipped rating degrades cleanly to an absent field that a
future calibration card already has to tolerate (every record written so far has no
confidence); and forcing a rating risks reflexive button-mashing that *degrades* the
calibration signal. This matches both the signed-off plan (Q-A-3) and PLAN.md.

## 5. State shape

- **In-flight selection:** `const [confidenceForCurrent, setConfidenceForCurrent] =
  useState(null);` added to the QuizTab body near the other `useState` (≈1325).
- **Reset between questions:** add `setConfidenceForCurrent(null);` to the **existing**
  `useEffect([idx])` at 1349–1353 (same effect that resets timing refs and
  `optionsRevealed`) — so it clears on every question advance with no new effect.
- **Threading to the write:** add `confidenceForCurrent` into `kbdRef.current` at 1361;
  at sites 1409/1434 replace `confidence: null` with `confidence:
  ctx.confidenceForCurrent`; at 1641 replace with `confidence: confidenceForCurrent`.
  1522 and 2133 keep `confidence: null` unchanged.
- **schemaVersion:** **no implication.** Additive optional field already reserved by
  the record builder. Confirmed below.

## 6. No-schema-bump / no-sync-change confirmation

- **Record builder** already does `if (confidence != null) r.confidence = confidence`
  (weakness.js:44) — the field is reserved; writing a real value is purely additive.
- **No migration:** older records simply lack `confidence` (already true today). No
  reader assumes its presence.
- **Sync engine:** `weakness-` is already a `TRACKED_PREFIX` (commit 1, `829898f`).
  Per-key last-write-wins; each attempt is a unique key; confidence is just more bytes
  in an already-synced value. **No `TRACKED_PREFIXES` change, no gist
  `schemaVersion` bump.**

## What this commit touches (all in `src/secplus-quiz.jsx` unless noted)

1. New `ConfidenceRater` inline component (render + click handlers).
2. QuizTab: `confidenceForCurrent` state + reset in `useEffect([idx])` + add to
   `kbdRef.current`.
3. Keyboard branch for `q`/`w`/`e` (+`r` if 4-choice).
4. Three write-site edits (1409 / 1434 / 1641): `confidence: null` →
   `confidence: <selection>`.
5. Render the rater between option grid and Check Answer.
6. Shortcut-hint line (1573–1574) updated to mention the confidence keys.

**Validation before reporting done:** `npm run build`; browser smoke per CLAUDE.md UI
rule + the impl plan's explicit "commit 3 warrants manual browser smoke" note — verify
(a) rater appears only after select + only pre-check, (b) each button + each key
records the right value, (c) skip → field absent, (d) resets between questions, (e) no
rater in matching/exam. SCHEMA.md confidence-semantics + docs sync land in the
follow-on doc commits (commits 6–7), reflecting whichever scale you pick here.

**NOT in this commit** (later commits, per the 8-commit plan): pause-on-blur Q-C-3
(commit 4), import/export Q-F-1 (commit 5), SCHEMA (6), docs sync (7), Report-#NNNN (8).

---

**Paused for sign-off.** I need DECISION 1 (3 vs 4) confirmed before I write code;
points 1–6 are ready to execute the moment it's settled.
