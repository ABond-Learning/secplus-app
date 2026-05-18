# Where Things Stand — 2026-05-18

Handoff document for supervisor-Claude continuity. Captures
institutional knowledge that isn't in the formal docs (PLAN.md,
Reports/, docs/).

Update this doc at natural breakpoints, especially before starting
fresh supervisor conversations. Treat as the "what I'd tell a new
supervisor on day one" briefing.

This file lives in the repo at `docs/supervisor-handoff.md` and is
fetched by supervisor-Claude conversations on orientation. Keep
this path stable; if it moves, update the project's custom
instructions to match.

## Current state

**Last commit:** `c99a6a1` (Mon 2026-05-18, Reports/Report-#0004.md: SB1.5 supervisor sign-off + methodology framing)

**Branch:** main, working tree clean except 3 pre-existing untracked
Task 2 docs in `docs/` (left alone per Audit D scoping D-J)

**Audit D arc position:**
- ✅ Pre-flight PLAN amendment (Wed 2026-05-13, `bfee22e`)
- ✅ Sub-batch 0 calibration (Wed 2026-05-13, `111be1f`)
- ✅ Sub-batch 1 pre-flight iter0 (Thu 2026-05-14, `aa32fad`) —
  partial pass, Rec 1 deferred to post-process
- ✅ Sub-batch 1.5 post-process (Mon 2026-05-18, `a26d42c` + `becaac9` + `dd6b0da` + `c99a6a1`) — PASS with supervisor sign-off recorded in Report-#0004
- ⏸ Sub-batch 1 full-corpus run (next major work)
- ⏸ Sub-batches 2-N fix runs
- ⏸ Closure sub-batch

## Pending decisions for Sub-batch 1 full-corpus

These were deferred at Sub-batch 1.5 sign-off. Need to be resolved
before the full-corpus run kicks off.

**D-SB1-scope:** match+cram only vs add MC+scen
- Match+cram only: ~1,251 items, $15-25 projected, original D2 scope
- Add MC+scen: ~2,128 items, $35-50 projected, expands beyond D2
  default
- Rationale for expansion: 4 MC+scen items in Sub-batch 0 calibration
  flagged not-in-source by both readers. April 27 "MC+scen are clean"
  finding holds for keyword methodology but not LLM judgment.
- Default per D2: match+cram only. Aiden can choose to expand.

**D-SB1-model:** sonnet-4-5 (calibrated) vs sonnet-4-6 (newer)
- Sonnet 4.5 was used in all of Sub-batch 0 + 1 pre-flight.
  Methodology calibrated against it.
- Sonnet 4.6 is newer; using it introduces model drift on top of
  the prompt tune.
- Recommended approach: small N=5 comparison on sonnet-4-5 vs
  sonnet-4-6 with iter0 prompt before committing to model upgrade
  for full corpus. ~$0.20 to run.

**D-SB1-schedule:** when to run
- Continuous CC time + cost burst (cache benefits from continuous
  run)
- Probably weekend or large weekday block
- Aiden's study cadence is the constraint (R7 audit-study collision
  mitigation)

## Sub-batch 1.5 sign-off annotations (carry forward)

From the formal sign-off at session close 2026-05-18:

1. Subset 1 strict: 3/6 → 6/6 (upper bound of Report-#0003
   prediction)
2. Subset 2 strict: 3/5 unchanged (PASS at threshold)
3. Subset 2 collapsed: 3/5 (FAIL at ≥4/5 threshold) — predicted,
   two known-unreachable residuals (HMAC + CCPA)
4. Smoke test HELD (4/4 §2.3.3 items correctly untouched)
5. Diagnostic metrics clean: inconsistent verdicts 3→0, paraphrase
   8.3%, cache 100%
6. Regression-sample 2 flips (rows 13 bare-metal, 14 integer
   overflow): **method improvement over SB0 supervisor baseline,
   NOT script error**

**Important methodological note:** SB0 supervisor verdicts on rows
13 and 14 should NOT be retroactively edited. Moving ground truth
to match the method would be methodology corruption. Document the
flips as "post-process surfaces 2 cases where SB0 supervisor was
category-conservative; these are method improvements over SB0
baseline."

**Practical implication for Sub-batch 1 full-corpus:** apply
post-process by default. The 2 regression-sample flips are
evidence the post-process generalizes correctly beyond the 3
predicted flips.

## Key insights worth preserving

**fix_direction as LLM-intent signal (from Sub-batch 1 pre-flight):**

When the LLM produces a verdict with a 6-way category + 5-way
fix_direction + justification, the fix_direction field is more
reliable than the category label as a signal of LLM intent. Reason:
training prior "concept-not-in-this-transcript → out-of-source"
overrides explicit prompt instruction at category-selection step,
but fix_direction is less constrained by training prior so it
reflects actual reasoning.

Post-processing on fix_direction → category consistency is
structurally cleaner than further prompt iteration. The pattern
generalizes to any LLM-as-judge pipeline where schema enforces
category-action pairing.

**Audit A lessons (carry-over from May 2026):**

1. Tool-gated execution beats self-reported discipline — Batch 4b
   76% rework vs Batch 5 0% after switching to verifier-tool gating
2. Actual-vs-claimed length distinction — proposals must measure
   outputs, not intentions
3. Find binding minimum across all options when padding, don't pad
   by name
4. Per-item exp-coverage check before trim-correct; state
   affirmatively in commits

**Supervisor-CC workflow (memory rule #7):**

CC must surface decision points via Aiden's paste-relay before
proceeding. Status block → save to .audit-working/ → iconv to
clipboard → pause for sign-off. Applies at pass/fail gates,
mid-sub-batch checkpoints, and "surface findings + hold" requests.
2026-05-18 Sub-batch 1.5 was an example of CC executing through
gates without surfacing; retrospective surface produced and
workflow course-corrected.

## Active conventions

- **Workflow Rule #7:** Every completed task gets
  `Reports/Report-#NNNN.md` per CLAUDE.md
- **Decision-block style:** Multi-letter sign-off blocks (D-A
  through D-J for Audit D scoping, D-K through D-N for SB1
  pre-flight closure, etc.)
- **iconv clipboard pattern:** `iconv -f UTF-8 -t UTF-16LE <path> |
  clip.exe` for status blocks
- **Untracked docs:** 3 Task 2 docs (cancel-feature-shipped,
  task2-2b-end-of-session, task2-sub-batch-2c-shipped) left
  untracked per D-J, address in separate cleanup pass

## Budget state

- $5 free credit, ~$3.71 remaining
- $50 paid credit added Thu 2026-05-14
- Total available: ~$52.42
- Cumulative Audit D spend: $1.29 (~2.4%)
- Sub-batch 1 full-corpus projection: $15-50 depending on scope
- Plenty of runway for Audit D end-to-end + future audits

## Tasks deferred behind Audit D

These are tracked in PLAN.md but waiting on Audit D closure:

- Task 2 Sub-batches 3 (saved presets), 4 (Flashcards SM-2), 5
  (cleanup)
- Task 3 PBQ system + exam sim
- 5 metacognitive features (deferred candidates per PLAN.md,
  re-evaluate after Task 2 closes + 3-5 study sessions)
- Matching UX polish: (a) topic names visible on cards [consider
  context-aware visibility for study vs exam modes], (b) progress
  bar on matching items
- 4 remaining Section 1 content fixes in TODO-content-quality.md

## Workflow change context (2026-05-18)

Supervisor role moved from regular Claude.ai chat to a Claude.ai
Project, but project knowledge intentionally stays near-empty —
strategic docs are fetched from GitHub instead of uploaded. Reasons:
- Multi-week Audit D arc + multi-day strategic conversations cause
  chat to become unwieldy; fresh project conversation gives clean
  context
- Single source of truth in the repo; no doc drift between repo
  and project knowledge
- Public repo provides web-fetch access to latest committed state
- Cowork considered but rejected: supervisor role is conversational
  not task-shaped; supervisor-CC pattern depends on independent
  instances

CC continues operating in WSL at `~/projects/secplus-app/` exactly
as before. Only the supervisor role changed location.

## How to use this document

Update at session boundaries when state changes materially:
- After major commits (Sub-batch closures, methodology changes)
- After decision-block sign-offs that affect future work
- When workflow conventions change
- When budget state shifts significantly

The formal docs (PLAN.md, Reports/, docs/audit-d-*.md) are
authoritative on their respective concerns. This doc is the
connecting tissue — context that crosses doc boundaries or doesn't
fit anywhere else.

Re-commit + push when materially updated. No re-upload to the
project needed; supervisor-Claude fetches the latest version from
GitHub.
