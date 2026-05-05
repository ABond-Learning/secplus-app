# Task 2 Sub-batch 2B — Shipped

Date: 2026-05-05
Status: Shipped, deployed, all automated gates PASS. Manual activeRecall click-through pending Aiden's session.

Authoritative spec: `docs/task2-design-v2.txt` §3.3 (drawer UI), §5.1 (key class table), and decisions D5 (synced) / D6 (summary-chip-collapsed) / D8 (per-mode bag shape) — plus 2B-specific D9–D18 from the orient.

## Commits

- **`0c00620`** — Task 2 Sub-batch 2B: Customise drawer + persistence (753 insertions / 250 deletions across 3 files: 2 new modules + secplus-quiz.jsx restructure).

## Deploy verification

- Live bundle hash: **`index-Bu7UvPei.js`** at https://abond-learning.github.io/secplus-app/
- Hash poll: live match within ~60s of push.
- Live bundle size: 1,350,844 bytes — matches local build exactly.
- Spot-grep of live bundle confirms `secplus-v4-customise-last` localStorage key survives minification (the load-bearing identifier; component class names minify away as expected).

## All gates with results

| Gate | Result | Detail |
|---|---|---|
| `npm run build` | **PASS** | 1,350.84 kB / 405.41 kB gzip; below the 1.5 MB chunk warning |
| `node scripts/validate-questions.mjs` | **PASS** | 5 warns / 0 errors (4 best-most-short-distractor + 1 spelling-re — baseline-equal, no content touched) |
| `npm test` | **PASS** | 34 / 34 sync-engine tests pass (no engine changes; regression check) |
| `node scripts/test-buildpool-equivalence.mjs` | **PASS** | All 6 modes set-equal; weak divergence INFO; drill BYPASS (no buildPool changes in 2B but cheap regression confirmation) |
| Live bundle deploy | **PASS** | `index-Bu7UvPei.js` deployed within ~60s; size matches local; `secplus-v4-customise-last` string present |

## Manual activeRecall test results (static verification only — live test pending)

The live click-through cannot run in the implementation session (no UI runtime). Static verification of the wiring chain (drawer toggle → patch → handleStart → setSession({activeRecall}) → QuizTab `sessionActiveRecall` → kbdRef → `hideOptions`) shows both tests should PASS:

### Basic test (drawer → session → kbdRef freshness)

1. Pick Quiz card → drawer initializes from `loadDrawerState("quiz")` = MODE_DEFAULTS.quiz with `activeRecall: false`.
2. Toggle activeRecall checkbox → `patch("activeRecall", true)` → `setFilters({...prev, activeRecall: true})`.
3. Click Start → `handleStart()` → `saveDrawerState("quiz", filters)` + `onStart(filters, previewPool)`.
4. StudyTab's onStart → `setSession({id, mode: "quiz", pool, activeRecall: true, revealOptions: true})`.
5. QuizTab mounts (forced by `key={session.id}`) → `sessionActiveRecall = !!session.activeRecall = true`.
6. Running view: `hideOptions = sessionActiveRecall && !optionsRevealed && !showExp = true` initially → "Show Options" panel rendered + Space/Enter handler reveals.
7. Finish/abort → `onBack` → `setSession(null)` → drawer remounts.
8. User clicks "Back to modes" in drawer → picker shown.
9. Pick Review card → `loadDrawerState("review")` = MODE_DEFAULTS.review → `activeRecall: false` (review's slot doesn't exist yet on first pick).
10. Click Start → session.activeRecall = false → `hideOptions = false` → options visible from Q1.

**Static verification: PASS.**

### Aggressive test (persistence across abort)

1. Quiz drawer, activeRecall=true, Start. saveDrawerState writes `raw.quiz = {activeRecall: true, ...}`.
2. Answer 2 questions → click back → `setSession(null)` → drawer remounts with mode="quiz".
3. `loadDrawerState("quiz")` reads localStorage → returns `{activeRecall: true, ...}` (persisted).
4. Drawer's `filters` initialized to `{activeRecall: true, ...}` → checkbox shows checked, summary chip indicates settings (length etc., not activeRecall by current chip rules).
5. Uncheck → `patch("activeRecall", false)`.
6. Click Start → `saveDrawerState("quiz", {activeRecall: false, ...})` + `setSession({..., activeRecall: false})`.
7. Running view: `hideOptions = false` → options visible from Q1.

**Static verification: PASS.**

Aiden will run both tests live. If either fails, file an issue and bisect.

## Bundle size delta and per-file LOC delta

| | Sub-batch 2A | Sub-batch 2B | Delta |
|---|---|---|---|
| Bundle (KB) | 1342.25 | 1350.84 | **+8.59 kB (+0.64%)** |
| Hash | `index-CCpUiDk4.js` | `index-Bu7UvPei.js` | flipped |
| Files modified | — | 3 | — |

Per-file LOC delta:

| File | Lines added | Lines removed | Net |
|---|---|---|---|
| `src/study/CustomiseDrawer.jsx` | **390** | 0 | +390 (new) |
| `src/study/drawer-state.js` | **120** | 0 | +120 (new) |
| `src/secplus-quiz.jsx` | 109 | **250** | **−141** |
| **Project total** | 619 | 250 | **+369** net |

The JSX file shrinks by 141 lines net — the inline setup view (video selector, length slider, activeRecall toggle, new-mode counter, 6-card grid, presetMode useEffect, internal `startQuiz`, orphan `dialog`/`showAlert`) was substantial. The two new modules together are larger than the deletion because the drawer is filter-driven UI for ALL modes, whereas the deleted setup view was per-mode branching.

## Code-organization findings during drawer/state extraction

1. **`src/study/CustomiseDrawer.jsx` defines its own minimal styles inline** (`drawerStyles` const, ~25 entries) rather than importing the JSX file's `styles` constant (which is at the bottom of secplus-quiz.jsx and unexported). Inline styles in the component module is the same pattern as `SyncSettings.jsx`. Centralizing all styles is Sub-batch 5 cleanup territory.

2. **`MODE_DEFAULTS` lives in `drawer-state.js`, not `CustomiseDrawer.jsx`** — the persistence helpers and the defaults table travel together because `loadDrawerState` performs the spread-merge `{...MODE_DEFAULTS[mode], ...persisted}`. Splitting MODE_DEFAULTS into its own file would force two co-touching modules to evolve together; one module is simpler.

3. **`canonicalJSON` for the dirty-indicator compare** sorts top-level keys + sorts entries inside array values (domains/videoIds/questionTypes/subObjectives). Order-independent compare matters because checkbox-toggle order shouldn't make the chip falsely report "dirty." Implemented in 6 lines; no external dep.

4. **StudyTab now owns the post-exam drill-handoff path.** Previously it lived inside QuizTab's pendingDrill useEffect; in 2B it moved to StudyTab so the drawer is bypassed (drill handoff has a preloaded list — drawer is irrelevant). Same UX, cleaner ownership boundary.

5. **`session.id = ${mode}-${Date.now()}`** as the React `key={session.id}` on QuizTab forces a clean remount on every session start. Cheaper than `useEffect([session])` reset patterns and cannot leak prior-session state into a new session. The post-exam drill bypass uses `drill-${Date.now()}` for the same effect.

6. **`presetMode` prop on QuizTab is now an orphaned signature element.** No caller passes it; it deletes in 2C cleanup alongside `LEGACY_SHIM_FOR_MODE` / `legacyToBuildPoolMode` / `legacyEmptyMessage`. Kept in the signature for traceability.

7. **`subObjectives` filter defensively clears stale entries** when `domains` changes via `patch("domains", ...)` or `toggleArrayField("domains", ...)`. If a user has §1.2.5 selected then unchecks D1, the §1.2.5 entry self-removes — otherwise the filter would silently zero the pool with no visible cause.

## Behavior worth knowing about

### Cross-device sync of drawer state (R-2B-3)

`secplus-v4-customise-last` is a NEW localStorage key but matches the existing `secplus-` prefix in TRACKED_PREFIXES. Filter preferences sync across all 3 of Aiden's devices automatically per design §5.1 / D5:

- Set "D4-only Quiz, length 30, prefer unseen" on phone → click Start → next session on laptop opens Quiz drawer with the same filters.
- Same as how `secplus-v4-presets` will sync in Sub-batch 3.
- V_old (any device on Sub-batch 1 / 2A bundles) preserves the key in localStorage and round-trips it on push without dropping (verified §5.4(c) round-trip safety).

This is the design default; no opt-out toggle. If cross-device filter consistency turns out to be unwanted, a future sub-batch could move the key to LOCAL_ONLY — but that requires a 24-h sync hygiene gate similar to Sub-batch 0.

### Drill mode in 2B preserves legacy video-level scope

Drill drawer shows the per-question accuracy slider GREYED with the caption "2B preserves legacy video-level Drill scope (whole video pulled if its average accuracy is below 70%). 2C swaps to per-question per Q-F — slider lights up then." This matches the diff-test's INFO divergence preview: 2C will produce `["mc-1.1.1-0"]` (per-question) instead of `["mc-4.5.1-0", "mc-4.5.1-1"]` (video-level) on the synthetic fixture.

### Drawer save-on-Start with subtle dirty indicator (D16 caveat)

A small `*` appears next to the "Start Quiz" / "Start Review" / etc. button label whenever the in-memory drawer state differs from the persisted state. Below the button: "Filters changed since last save — Start writes them to your saved preferences." The asterisk disappears on Start (which writes). Reload mid-edit loses the unsaved changes — acceptable per D16 (Start = explicit intent).

## Anything surprising during implementation

A few minor points worth recording:

- **JSX file shrinks 141 LOC net** — bigger reduction than I forecast in the orient (~40 LOC net). The orient under-counted what was being deleted because the inline setup view's branching across `setupMode` produced multiple parallel UI fragments (standard/scenario/matching path + new-mode counter + activeRecall toggle + start button label switch). Drawer collapses all of this into one component with mode-keyed visibility flags.

- **Modal/dialog/showAlert state in QuizTab was orphaned post-restructure.** The setup view's empty-pool alerts ("No questions due today!", etc.) were the only callers; with pool-build now in the drawer (which has Start disabled when previewPool=0), QuizTab needs no dialogs. Removed in a follow-up edit before commit.

- **`useEffect` import was unused in CustomiseDrawer** after I switched to `useMemo` for `loadDrawerState` initialization. Caught and removed before commit.

- **MODE_DEFAULTS.review default of `{mc, scen}`** is the per-D4 user-visible improvement. Legacy spaced was MC-only; design v2 §3.2 makes mc+scen the new default. The diff-test's spaced equivalence assertion uses MC-only filters (matches legacy); the default-flip is what users get when they pick Review in 2B. No regression risk because users who want MC-only can uncheck "Scenarios" in the drawer.

- **Drill drawer's `legacyVideoLevelWeak` stays in MODE_DEFAULTS.drill** so the persistence round-trip doesn't lose the flag. 2C will both delete the flag from MODE_DEFAULTS and migrate any persisted `drill` slots (read existing slot, drop the flag, write it back) so users with saved Drill preferences land cleanly on per-question semantics.

## What waits next

**Sub-batch 2C: un-orphan + per-question weak scope.** Per design v2 / D3 risk-handling addition (2C explicitly flags the user-visible weak-mode behavior change in commit message + ship report).

Concretely 2C ships:

1. Delete `LEGACY_SHIM_FOR_MODE`, `legacyToBuildPoolMode`, `legacyEmptyMessage` from secplus-quiz.jsx (orphaned in 2B).
2. Delete the `presetMode` prop from QuizTab signature (orphaned in 2B).
3. Delete `STUDY_MODE_TO_DRAWER` if redundant (it's currently a 1:1 mapping).
4. Delete `MODE_DEFAULTS.drill.legacyVideoLevelWeak`. Set `MODE_DEFAULTS.drill.belowAccuracy: 0.70`. Ungrey the slider in CustomiseDrawer.
5. Remove the Drill-drawer 2B caption ("2B preserves legacy video-level...").
6. Migrate any persisted `drill` slot: on `loadDrawerState("drill")`, if the persisted slot has `legacyVideoLevelWeak: true`, drop it and ensure `belowAccuracy: 0.70` is set. One-time idempotent migration.
7. The 6-card grid inside QuizTab (orphaned via `presetMode` guard since Sub-batch 1) — already unreachable in 2B because StudyTab no longer routes through `presetMode`. Delete in 2C alongside the rest.

Diff-test divergence preview (already shipped in 2A) tells the 2C author exactly what to expect: weak pool flips from `["mc-4.5.1-0", "mc-4.5.1-1"]` (video-level — entire-video-because-no-records-yet) to `["mc-1.1.1-0"]` (per-question with ≥2 attempts at <70%) on the synthetic fixture.

After 2C: Sub-batch 3 (presets) and Sub-batch 4 (Flashcards SM-2 + cram in buildPool + multi-video Flashcards). Sub-batch 5 closes Task 2 with cleanup.

📋 To copy: iconv -f UTF-8 -t UTF-16LE docs/task2-sub-batch-2b-shipped.md | clip.exe
