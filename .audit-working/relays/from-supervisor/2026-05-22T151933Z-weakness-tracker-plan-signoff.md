# Supervisor response — weakness-tracker implementation plan sign-off

SUPERVISOR_NONCE: 2026-05-22T150233Z-weakness-tracker-plan-signoff
CC_NONCE_ECHO: 2026-05-22T140034Z-e34fcdd0

## Plan accepted

Plan is thorough and well-grounded. Proceed to commit 1 (sync-engine prefix + tests).

## Three interpretation calls — all confirmed at CC's leans

### Q-A backfill — CC's lean: embedded `prior_sm2` — CONFIRMED

Embedded `prior_sm2` in first new event per questionId is the right call. The synthetic-baseline alternative would:
- Pollute the per-attempt timeline with non-attempt records
- Write ~3k entries on first app load (slow + quota risk)
- Conflate "genuinely studied" with "never seen"

Embedded approach triggers only on real activity, scales naturally, and preserves audit-honesty (synthetic records would be lies about study events that didn't happen).

### Q-C-3 reveal-on-resume — CC's lean: only-if-selected — CONFIRMED

Only forcing `setShowExp(true)` when `answers[idx] !== undefined` is the right semantics. Always-reveal would spoil questions where the user was merely reading mid-question before getting distracted. The genuine gaming risk (think offscreen, submit) requires the user to have committed to an answer before blurring; only-if-selected catches that case while preserving honest reading interruptions.

### Q-A-3 skip mechanism — CC's lean: implicit — CONFIRMED

Implicit skip (submit without clicking = `confidence: null`) is right. Explicit skip button is UI noise. The `(skip)` hint text in the row visual per §6.2 is enough signaling. Users who don't want to rate just submit; users who do want to rate click.

## Two notes on implementation details

### Keyboard shortcut collision check

q/w/e/r for confidence 0/1/2/3 is a sensible choice (left hand, spatial alignment, avoids 1-4 collision with answer-select + SM-2 rating). 

**One verification step before commit 3 (UI) lands:** CC should grep `src/secplus-quiz.jsx` for existing `KeyboardEvent` / `onKeyDown` handlers to confirm no other UI element uses q/w/e/r. If a collision surfaces, fall back to alternative keys (suggestions: numpad 7/8/9/+ for spatial alignment with the four buttons, or shift+1/2/3/4 to namespace from the existing 1-4 handlers).

Not a blocker now — just verify during commit 3 implementation.

### `hasAnyWeaknessRecordFor` O(N) scan — acceptable for v1

The O(N) localStorage scan on every weakness write is fine for v1. CC's analysis (N ≤ ~13k, microsecond-fast, single call per submit) holds.

If profiling later shows perceptible cost (e.g., a noticeable lag between submit and answer-reveal during dense study sessions), the optimization is straightforward: cache a Set of "questions with at least one weakness record" in component state, populated on first scan, updated on each new write. Defer until profiling argues for it.

## Cram coverage deferred to Task 2 Sub-batch 4

CC's plan correctly omits cram call sites because the cram writer ships in Task 2 SB4. The schema in §2.2 documents the future cram answer shape (`"knew"|"didnt-know"`) without committing to a call site now. Good defensive design.

When Task 2 SB4 lands, the cram weakness-record call site folds in naturally — same `recordWeakness` helper, `mode: "cram"`, `answerChosen` is the self-rate string, `confidence: null` (cram self-rate semantics conflict with confidence rating per §6.5).

No action needed in this implementation; just noting the future hook.

## Commit sequence — accepted

8 commits as listed. Two manual smoke-test checkpoints (commits 2 and 3) per CLAUDE.md UI-changes rule. Per-cadence-Rule-3 supervisor review between commits via dry-run / surface signals.

## Test plan — accepted

Unit tests + sync-engine tests + manual smoke test cover the bases. The 8-step manual smoke (especially steps 3-6 covering prior_sm2 backfill, blur interruption, and confidence rating) is the right ground-truth check before declaring complete.

## Routing — commit 1 authorized

Proceed to commit 1: `sync-engine: add weakness- to TRACKED_PREFIXES + tests`.

Scope:
- One-line addition at `src/sync/sync-engine.js:13`: `"weakness-"` added to `TRACKED_PREFIXES`
- 3 unit tests in `src/sync/__tests__/sync-engine.test.js` (isTracked / isLocalOnly / mergeEntries last-write-wins)
- 1 integration test in `src/sync/__tests__/sync-engine.integration.test.js` (2-device propagation)
- Zero `src/secplus-quiz.jsx` changes in this commit
- Zero localStorage mutation
- Tests pass via `npm test` (or equivalent — CC handles)

After commit 1 lands, surface brief close-out signal per Rule 3. Aiden then decides whether to continue to commit 2 (helper + 5 call-site writes) today or pause.

## CC routing

CC copies this file to `.audit-working/relays/from-supervisor/{ISO}-weakness-tracker-plan-signoff.md`, commits, pushes. Then proceeds to commit 1.

Commit 1 is small + mechanical (one-line code + tests). Should be straightforward. Brief close-out signal after.

---ready-for-cc---
