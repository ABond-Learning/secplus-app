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

**Last commit:** `a4a30c3` (Mon 2026-05-18, SB1 ops: resume support for audit-d-llm-judge) — plus the docs-update commit that introduced this paragraph (see `git log -1` for hash).

**Branch:** main, working tree clean except 3 pre-existing untracked
Task 2 docs in `docs/` (left alone per Audit D scoping D-J)

**Audit D arc position:**
- ✅ Pre-flight PLAN amendment (Wed 2026-05-13, `bfee22e`)
- ✅ Sub-batch 0 calibration (Wed 2026-05-13, `111be1f`)
- ✅ Sub-batch 1 pre-flight iter0 (Thu 2026-05-14, `aa32fad`) —
  partial pass, Rec 1 deferred to post-process
- ✅ Sub-batch 1.5 post-process (Mon 2026-05-18, `a26d42c` + `becaac9` + `dd6b0da` + `c99a6a1`) — PASS with supervisor sign-off recorded in Report-#0004
- ⏸ Sub-batch 1 full-corpus run — **ATTEMPTED 2026-05-18, HALTED at call #688 / $7.42 due to laptop travel.** Pre-flight signed off (scope=match+cram+MC+scen, N=2128, model=sonnet-4-5, HARD_CAP=3000, projection $30 mid / $45 stretch). Original script wrote verdicts only at end → $7.42 sunk. **Resume patch landed same day (`a4a30c3`):** `scripts/audit-d-llm-judge.mjs` now reads existing `--output`, skips done locations by `section|video|type|index`, flushes every 50 verdicts. Smoke-tested with fake 2128-verdict file → 0 API calls; cumulative cost preserved. Sample builder `scripts/audit-d-build-sub-batch-1-sample.mjs` shipped in `1a5798c`. **Restart tomorrow in a fresh CC session.**
- ⏸ Sub-batches 2-N fix runs
- ⏸ Closure sub-batch

## Sub-batch 1 full-corpus — decisions LOCKED 2026-05-18

All three previously-pending decisions were resolved at this session's
pre-flight sign-off:

**D-SB1-scope:** match + cram + MC + scen — full 2128 items
(sample-sampled from `questions.json`: mc=532, scen=345, match=580,
cram=671 across 28 sections / 120 videos).

**D-SB1-model:** sonnet-4-5 (locked). No SB1.5 supervisor cross-run
with sonnet-4-6 — straight to full corpus on the SB1.5-validated
model. Rationale: methodology calibrated against 4.5; SB1.5 passed on
4.5; introducing model drift now would invalidate the validation.

**D-SB1-schedule:** today (2026-05-18) — halted at call #688 due to
travel; resumes tomorrow in a fresh CC session using the resume-
capable script (`a4a30c3`). Resume-on-restart means a future halt
loses at most ~50 items of work (the periodic-flush interval).

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

- $5 free credit, ~$3.71 remaining at session start
- $50 paid credit added Thu 2026-05-14
- Total available pre-session: ~$53.71
- Sub-batch 1 partial-run spend 2026-05-18: $7.42 (halted at call #688, no on-disk verdicts — sunk)
- Total available now: **~$46.29**
- Cumulative Audit D spend: $1.29 prior + $7.42 today = **$8.71**
- Sub-batch 1 full-corpus REMAINING projection: ~$30 mid / ~$45 stretch on a fresh restart (the resume-patched script doesn't recover the $7.42, but tomorrow's fresh run uses the same projection as today's pre-flight). Cumulative across both attempts: $37 mid / $52 stretch — still under the $60 hard ceiling.
- Plenty of runway for Audit D end-to-end + future audits, but $7.42 of slack is gone

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
