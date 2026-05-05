# Task 2 Sub-batch 1 — Shipped

Date: 2026-05-05
Status: Shipped, deployed, manually verified.

Authoritative spec: `docs/task2-design-v2.txt` §6 Sub-batch 1.

## Commits

- **`a62d378`** — Persist Task 2 design v2 doc + correct stale Task 2 framing (preliminary cleanup; design v1+v2 to `docs/`, CLAUDE.md and PLAN.md staleness fixes, 4 dangling audit scripts committed).
- **`c43ae49`** — Task 2 Sub-batch 1: UI scaffold for 3-tab + 5-mode collapse (140 ins / 18 del, net +122 LOC in `src/secplus-quiz.jsx`).

## Deploy verification

- Live bundle hash: **`index-ByfmWJ4p.js`** at https://abond-learning.github.io/secplus-app/
- Hash poll confirmed deploy match within ~60 s of push.
- Spot-grep of live bundle confirms new identifiers/strings: `presetMode`, `Back to modes`, `📚 Study`, `Flashcards`, `Drill Wrong`.

## Validation criterion result (per design §6)

> "Clicking each new mode card produces the same pool as the corresponding old mode."

Manual click-through: **8/8 PASS**.

| # | Check | Result |
|---|---|---|
| 1 | Top-nav has 3 tabs (Progress / Study / Exam) | PASS |
| 2 | Study tab shows 5-card responsive picker | PASS |
| 3 | Quiz card → Standard setup; back button works; session runs | PASS |
| 4 | Flashcards card → cram flip cards; title "Flashcards"; back works | PASS |
| 5 | Review card → Spaced Repetition setup | PASS |
| 6 | Drill Wrong card → Weak Spots setup | PASS |
| 7 | Matching card → Matching setup | PASS |
| 8 | Post-exam drill handoff lands on Drill Wrong with running session | PASS |

State isolation between mode switches confirmed working — picking a different card resets the running session cleanly via the `presetMode` change useEffect (lastPresetRef pattern).

## Tracked future items (not regressions)

Surfaced during click-through; not blocking Sub-batch 2.

1. **Matching UX polish: option-disappears-when-selected.** Pre-existing behavior, not introduced by Sub-batch 1. Track for Sub-batch 5 cleanup or a small between-sub-batch commit.
2. **Per-mode counts on Study tab.** Old tab structure may or may not have surfaced these; the new picker doesn't. Sub-batch 2's Customise drawer with a live pool preview ("Drawing N items from M videos" per design §3.3) may subsume this naturally; if not, a small follow-up commit.

Both logged in `PLAN.md` "Task 2 — tracked polish items" section.

## Anything surprising during implementation

The session's biggest surprise was upstream: the design doc was recovered from a session JSONL on the same day. Once recovered (`docs/task2-design-v2.txt`), the implementation itself was uneventful. Two minor points worth recording:

- **+122 LOC vs +80 estimate.** The overage is entirely inline cross-references to design v2 in the new `StudyTab` and `QuizTab` `presetMode` docstrings. Per Aiden's preference, these are kept verbose so future-Claude can find the design rationale without re-reading the doc.
- **`lastPresetRef` first-mount guard.** Without it, the `presetMode` useEffect would fire once on mount, redundantly resetting state that the `useState(presetMode || "standard")` initializer just set. Caught during code review before commit. Pattern is standard React but worth noting in case Sub-batch 2's Customise drawer adds similar prop-driven state machinery.
- **CramTab empty-state escape hatch.** The `if (watchedVideos.length === 0)` path needed an `onBack` button in the empty state too — otherwise a user with no watched videos who picked Flashcards would be trapped. Added `alignSelf: flex-start` to keep the back button left-aligned within the empty-state's centered layout.

## Hygiene state at ship time

- Build clean (1340.85 kB JS, +1.93 kB / +0.14% vs Sub-batch 0).
- Validator clean: 5 warns / 0 errors (4 best-most-short-distractor + 1 spelling-re; pre-existing baseline).
- All 3 of Aiden's devices have reloaded the Sub-batch 0 bundle (`9e94fb9`) since 2026-05-01. The 24-hour gate for Sub-batch 4 is satisfied; Sub-batch 4 timing is unblocked but should still ship after Sub-batches 2 and 3 per design v2 §6.1 sequencing recommendation.

## What waits next

**Sub-batch 2: buildPool unification + Customise drawer + diff-test.** Spec at `docs/task2-design-v2.txt` §3.3 (drawer UI), §4 (old → new intent mapping), §6 Sub-batch 2 (decomposition + validation criterion). Ships:

- `buildPool({mode, filters})` unification — replaces the 6 `startQuiz` branches.
- Customise drawer UI with last-used persistence (`secplus-v4-customise-last`) and visible filter summary chip.
- Diff-test script (`scripts/test-buildpool-equivalence.mjs`, ~50–100 LOC) asserting set-equality between old startQuiz output and buildPool output across the 6 old modes + drill pseudo-mode.
- Active recall toggle moves from per-session to drawer-level.

Risk: LOW-MEDIUM. The buildPool refactor is the deepest internal change of Task 2; mitigated by the diff-test (per Q-N).

After Sub-batch 2 ships, the temporarily-orphaned "new" and "scenario" sub-modes become reachable via drawer filters (`preferUnseen`, `questionTypes: ["scen"]`).
