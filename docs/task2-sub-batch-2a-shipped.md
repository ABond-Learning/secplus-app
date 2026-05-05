# Task 2 Sub-batch 2A — Shipped

Date: 2026-05-05
Status: Shipped, deployed, diff-test PASS. Manual click-through pending Aiden's session.

Authoritative spec: `docs/task2-design-v2.txt` §6 Sub-batch 2 (decomposition); §3.3 (drawer UI — lands in 2B, not 2A); Q-N (diff-test mandate).

## Commits

- **`b42fef7`** — Task 2 Sub-batch 2A: buildPool unification + diff-test (648 insertions / 75 deletions across 3 files: `src/study/buildPool.js` new, `scripts/test-buildpool-equivalence.mjs` new, `src/secplus-quiz.jsx` shrinks the 6-branch startQuiz from ~85 LOC to ~25 LOC plus a 50-LOC shim table at module scope).

## Deploy verification

- Live bundle hash: **`index-CCpUiDk4.js`** at https://abond-learning.github.io/secplus-app/
- Hash poll: live match within ~60 s of push.
- Live bundle size: 1,342,256 bytes (matches local build's 1342.25 kB exactly).
- Spot-grep of live bundle confirms new identifiers preserved: `LEGACY_SHIM_FOR_MODE`, `legacyVideoLevelWeak`, `buildPool` — 3 grep hits (object keys + property accesses survive minification).

## Diff-test PASS/FAIL per mode

`node scripts/test-buildpool-equivalence.mjs` — exit 0.

| Status | Legacy / Novel | Mode |
|---|---|---|
| **PASS** | 7 / 7 | standard (Quiz default) |
| **PASS** | 5 / 5 | new (preferUnseen MC+scen) |
| **PASS** | 3 / 3 | scenario (scen-only) |
| **PASS** | 6 / 6 | spaced (Review: dueOnly+includeUnseen, MC-only legacy) |
| **PASS** | 2 / 2 | weak (legacy video-level scope — 2A shim) |
| **PASS** | 2 / 2 | matching (whole exercises ≥3 pairs) |
| **INFO** | 2 / 1 | weak (divergence preview: per-question, Q-F target) |
| **BYPASS** | – / – | drill (post-exam preload — bypasses buildPool) |

All 6 equivalence cases pass on synthetic fixture (3 watched videos covering MC + scenarios + matching + cram + 2 unwatched, with synthetic SM-2 records exercising due/unseen/weak). 8th case (drill pseudo-mode) bypasses buildPool entirely — the `pendingDrill` payload flows through QuizTab's existing useEffect (line 1305-1319 of secplus-quiz.jsx); 2A makes no changes to that path.

### Weak mode divergence preview (informational)

The diff-test runs weak mode twice:
- **Equivalence run** — `legacyVideoLevelWeak: true` shim → matches today's per-VIDEO scope. PASS.
- **Divergence preview** — per-question `belowAccuracy: 0.70, minAttempts: 2` filter (the 2C target per design v2 Q-F). Surfaced as INFO, not FAIL.

Concrete divergence on the synthetic fixture:
- **Legacy pool (size 2):** `["mc-4.5.1-0", "mc-4.5.1-1"]` — 4.5.1 has zero SM-2 records; legacy treats "no records yet" as weak and includes ALL its MCs.
- **New pool (size 1):** `["mc-1.1.1-0"]` — only the actual 50%-accuracy item with ≥2 attempts.

The divergence is exactly what Q-F intends: stop conflating "video I haven't worked on" with "items I'm bad at." Aiden has signed off on this for 2C.

## Build size delta vs Sub-batch 1 baseline

| | Sub-batch 1 | Sub-batch 2A | Delta |
|---|---|---|---|
| Bundle (KB) | 1340.85 | 1342.25 | **+1.40 kB (+0.10%)** |
| Hash | `index-ByfmWJ4p.js` | `index-CCpUiDk4.js` | flipped |

Below the +5 kB heuristic budget. Most of the delta is the buildPool function body + LEGACY_SHIM_FOR_MODE table; the 6-branch startQuiz it replaces was nearly the same size, so the net is small.

## Validator state

`node scripts/validate-questions.mjs` — 5 warns / 0 errors. **Baseline-equal.**

| Code | Count |
|---|---|
| best-most-short-distractor | 4 |
| spelling-re | 1 |

Identical to Sub-batch 1's pre-ship validator state. No content was touched in 2A.

## Manual click-through results

Static contract verified via diff-test (set-equality across all 6 modes). Live click-through deferred to Aiden's session.

Sub-batch 1's 8/8 manual click-through equivalence baseline (per `docs/task2-sub-batch-1-shipped.md`) remains in force — 2A's contract is "buildPool with legacy-shim filters returns the same SET as today's startQuiz branches." That contract is asserted by the diff-test on all 6 modes; if Aiden's manual click-through diverges, it would be a wiring bug between QuizTab → startQuiz → shim, not a pool-build math bug.

Suggested manual passes when Aiden does click through:
1. Quiz card → Start (no video selection) → confirm pool ≈ all-watched MC.
2. Quiz card → select 2 videos → Start → confirm pool drawn from those 2 only.
3. Review card → Start → confirm pool = today-due + unseen MC across watched.
4. Drill Wrong card → Start → confirm pool = ALL MC from any video with avg accuracy < 70% OR no records (legacy video-level — 2A shim still active; per-question scope lands in 2C).
5. Matching card → select 1 video with ≥3 pairs → Start → confirm matching exercises load.
6. Post-exam Drill handoff (run a partial exam, click "Drill N Wrong") → confirm session loads with the same N items.

Risk #5 from the orientation (activeRecall stale ref) is NOT exercised by 2A because 2A leaves activeRecall as a per-session toggle. The relocation to drawer is 2B; the click-through Aiden specified ("enable activeRecall in drawer → start session...") becomes the gate for 2B's manual verification, not 2A's.

## Code-organization findings during buildPool extraction

1. **`src/study/buildPool.js` is a leaf module.** No imports from secplus-quiz.jsx. The five tiny helpers (`mcKey`, `scenKey`, `matchKey`, `shuffle`, plus the new `seededRng`) are inlined in 8 lines at the top of the new module. Intentional 5-line redundancy with the JSX file; centralizing them is scope-creep for 2A and lands naturally in Sub-batch 5 cleanup.

2. **`legacyStartQuizPool` lives in the same module as `buildPool`** rather than a separate `legacy.js`. Co-location signals "these are sibling implementations under migration" and gives the diff-test a single import path. The export deletes when Sub-batch 5 lands.

3. **The shim helpers (`LEGACY_SHIM_FOR_MODE`, `legacyToBuildPoolMode`, `legacyEmptyMessage`) live at module scope in secplus-quiz.jsx**, just above QuizTab. Considered putting them in `buildPool.js` but they're the **JSX file's** translation layer — they reference QuizTab's UI state (`selectedVids`, `questionCount`) and emit JSX-flavored alert messages with em-dashes. Keeping them adjacent to QuizTab keeps the migration boundary visible.

4. **`buildPool` accepts `mode` as a signature-only param.** No internal logic branches on it in 2A. Drawer in 2B will use `mode` to drive the visible filter set and lock `questionTypes` for Matching mode; 2A's pure-function behavior is filter-driven only.

5. **`subObjectives` filter implemented but dormant.** Drawer in 2B wires it; diff-test never exercises it (legacy has no sub-objective filter). The 4-line implementation is cheap insurance — 2B doesn't need to touch buildPool.

6. **`belowAccuracy` filter implemented and tested via the divergence preview.** 2C wires the Drill card's slider to it.

## Bundle hash delta

Sub-batch 1: `index-ByfmWJ4p.js` (1340.85 kB)
Sub-batch 2A: `index-CCpUiDk4.js` (1342.25 kB) ← live now

## What waits next

**Sub-batch 2B: Customise drawer UI + `secplus-v4-customise-last` persistence.** Per design v2 §3.3 (drawer UI controls); §5.1 (sync via `secplus-` prefix); D5 (synced not local-only); D6 (summary-chip-collapsed pattern); D8 (per-mode bag shape).

Orient against §3.3 in the next session before authoring. Concretely 2B ships:
- Summary-chip-collapsed drawer attached to each StudyTab mode card
- Filter controls: domain checkboxes (D1-D5), sub-objective filter, video multi-select, watchedOnly toggle, questionTypes checkboxes (Matching mode locks `match`), preferUnseen, belowAccuracy slider, dueOnly + includeUnseen, length slider, activeRecall toggle, revealOptions toggle, showRatingPanel (Flashcards-only)
- Live pool preview chip ("Drawing N items from M videos") — calls `buildPool(...)` per filter change
- Per-mode persistence: read `secplus-v4-customise-last[mode]` on mount, write on Start
- Active recall toggle moves from QuizTab session state to drawer state (per design Q-G)
- Risk #5 manual click-through gate per Aiden's instructions: enable activeRecall in drawer → start → confirm hidden → finish → start different mode without activeRecall → confirm visible

After 2B ships: 2C un-orphans "new"/"scenario" via drawer filters and removes the `presetMode` bridge. 2C's commit message and ship report MUST flag the per-question weak scope behavior change explicitly (per Aiden's risk-handling addition to D3).

📋 To copy: iconv -f UTF-8 -t UTF-16LE docs/task2-sub-batch-2a-shipped.md | clip.exe
