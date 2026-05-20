# Where Things Stand — 2026-05-20

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

**Last commit:** `8375cb8` (Mon 2026-05-19, docs: PLAN.md + supervisor-handoff sync with SB1 full-corpus + spot-check PASS) — plus today's three planned commits (SCHEMA.md `audit_*` convention; Report-#0006; PLAN/handoff sync). See `git log -4` for hashes after today's commits land.

**Branch:** main, working tree clean except 3 pre-existing untracked
Task 2 docs in `docs/` (left alone per Audit D scoping D-J)

**Audit D arc position:**
- ✅ Pre-flight PLAN amendment (Wed 2026-05-13, `bfee22e`)
- ✅ Sub-batch 0 calibration (Wed 2026-05-13, `111be1f`)
- ✅ Sub-batch 1 pre-flight iter0 (Thu 2026-05-14, `aa32fad`) —
  partial pass, Rec 1 deferred to post-process
- ✅ Sub-batch 1.5 post-process (Mon 2026-05-18, `a26d42c` + `becaac9` + `dd6b0da` + `c99a6a1`) — PASS with supervisor sign-off recorded in Report-#0004
- ✅ Sub-batch 1 full-corpus — **SHIPPED 2026-05-19.** 2,128 verdicts produced (zero data loss), $25.9170 spent, 100% cache hit rate after first call. Postprocess flipped 412 verdicts (19.4%) to `partial-adjacent` — SB1.5 architectural fix validated at scale. **Spot-check PASS at 75% strict agreement (30/40)** on the supervisor-reviewed stratified packet (matches SB0's 76.7%). Methodology validated; no catastrophic finding. Session report: Report-#0005. *Note: the original 2026-05-18 attempt halted at call #688 / $7.42 sunk; that sunk cost is included in the $34.63 cumulative figure but the SB1 verdicts on disk are entirely from the 2026-05-19 fresh run on the resume-capable script.*
- ✅ **8-item uncertainty verification (Tue 2026-05-20)** — text-vs-text grep against `.messer-transcripts/`, $0 spend. 8/8 LLM verdicts held — supervisor adjudication matched CC findings. Post-verification agreement = **38/40 = 95%**, with 3 remaining disagreements being the known SB1.6 pattern (#19 avalanche, #20 dual power feeds, #26 tokenization). Methodology-narrative reframing belongs in SB-fix-1a's report, not Report-#0006.
- ✅ **Sub-batch 1.6 post-process refinement — SHIPPED 2026-05-20.** Authored `scripts/audit-d-postprocess-sb16.mjs` (~220 lines). Predicate gate corrected from supervisor brief (`mark-for-Sybex-arbitration`, not `rewrite-to-source` — brief's value matched zero corpus rows; gate-value sanity-check caught this before any code). Two-tier output: strict (≥2 of 10 prose markers → auto-flip OOS to partial-depth) + loose (=1 marker → `sb16_action=flag-for-review`, no category change). Self-test PASS (3/3 must-flip, 12/12 must-not-flip incl. #23 gated out by `remove-from-catalog`); idempotency verified. Real-apply: 3 strict flips + 18 loose flags. Final counts: OOS 296→293, partial-depth 399→402. Output at `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json` (separate file per clean-provenance preference). Named SB1.5 residuals cross-check: CCPA §5.4.2 mc[6] self-resolved (already partial-depth); HMAC §1.2.2 cram[4] OOS but 2 siblings (mc[4]+match[3]) in loose-flag pool → reaches SB-fix-2 review as a unit.
- ✅ **SB-fix-1 scoping (Tue 2026-05-20)** — D2 partial-adjacent inventoried at 197 items. Schema-constraint finding split the work: mc + scen (63 items) per-item citable + Strategy A study-safe; match + cram (134 items) inherit citation from parent → SB-fix-1b deferred (Path B = schema extension, separate prep work block). SB-fix-1a authorized as 3 packets (25 + 25 + 13), per-packet commits, cadence Option C (build packet-1 first, calibrate, then decide A vs B). Validator-constraint check on `messerVideo`/`subObjective` queued as first task of next session before apply-script authoring.
- ⏸ **SB-fix-1a apply (next session and beyond):** Q6 validator check → packet-1 build → Aiden review → apply → commit. 3 sessions to clear.
- ⏸ SB-fix-1b-prep (match + cram schema extension scoping) — separate proposal session after SB-fix-1a closes
- ⏸ SB-fix-2 (partial-depth augment, includes the 18 SB1.6 loose flags as candidate-augment pool) — downstream of SB-fix-1a closure
- ⏸ Domain 1/3/4/5 partial-adjacent (227 remaining items) — future sub-batches once D2 pattern is validated
- ⏸ Closure sub-batch

## Sub-batch 1 full-corpus — completion record 2026-05-19

Pre-flight decisions (locked 2026-05-18) held through completion:

**D-SB1-scope:** match + cram + MC + scen — full 2128 items
(sample-sampled from `questions.json`: mc=532, scen=345, match=580,
cram=671 across 28 sections / 120 videos). All 2,128 produced clean
verdicts. Zero items missing.

**D-SB1-model:** sonnet-4-5 (locked). 100% cache hit rate after first
call — perfect cache behaviour confirmed at corpus scale. No
SB1.5 cross-run was needed.

**D-SB1-schedule:** completed 2026-05-19 across one continuous run
(~3h wall-clock, ~9 verdicts/min, 2,492 API calls total including
364 verbatim retries = 17.1% retry rate). Resume-capable script
(`a4a30c3`) executed cleanly; the periodic-flush path was verified
at the ~50-verdict mark via direct file inspection — flush worked
exactly as designed (location-keyed done-set, order-independent).

**Spot-check stratified review (40 items, mulberry32 seed 20260519):**
15 partial-adjacent / 15 out-of-source / 5 in-source / 5 partial-depth.
Supervisor verdict: 30/40 strict agreement (PASS). Breakdown:
- Partial-adjacent: 10/15 confident-agree, 5 uncertain pending Aiden
  transcript verification, 0 disagree → 412 flips at scale look sound.
- Out-of-source: 10/15 confident-agree, 3 likely-disagree (avalanche,
  dual power feeds, tokenization — all same "concept-here-but-not-
  this-term" pattern), 2 uncertain.
- In-source: 5/5 agree.
- Partial-depth: 5/5 agree-when-applied (concern is under-application
  not mis-application).

Packet artefacts at `.audit-working/audit-d-sub-batch-1/spotcheck-
packet-v1.{json,md}`, generator at `build-spotcheck-packet.mjs`,
seed reproducible (same seed → same 40 items).

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

**Prose-marker co-firing as a precision tool (from SB1.6 2026-05-20):**

Single prose markers in LLM justifications are too noisy to discriminate
must-flip from must-not-flip cases — markers like "the concept ... IS
taught" or "legitimate Security+ concept" appear in both. But requiring
**≥ 2 of N candidate markers to co-fire** gives 100% precision and
100% recall on the SB1.6 must-flip validation set (3/3 caught, 0/12
false-positives). The single-marker hits are kept as a flag-for-review
tier rather than discarded — they form a candidate-augment pool for
the next remediation sub-batch. Two-tier output (strict auto-flip +
loose flag) is the right architecture when prose-marker scanning can't
cleanly decide on the basis of phrasing alone.

**Schema-constraint check belongs in scoping, not implementation (from SB-fix-1 2026-05-20):**

Before scoping a "metadata-only" change across N items, verify the
schema actually supports per-item override on the field being changed.
For Audit D's partial-adjacent re-citation, 134 of 197 D2 items live in
`match` / `cram` arrays where citation inherits from the parent video —
re-citation requires either a structural move (breaks SM-2 keys) or a
schema extension. Catching this in scoping saved authoring an apply
script that would have silently broken study progress on 65 match items.
The lesson: when SCHEMA.md says "never reorder ... never change video
id," check whether the proposed remediation touches those guarantees
before drafting the apply path.

**`audit_*` field naming convention (locked 2026-05-20):**

Fields prefixed `audit_*` on items / videos are tooling-only metadata.
The React app never reads them. They are added by audit / remediation
scripts (e.g., `audit_d_review` on items processed by SB-fix-1a) for
provenance and decision tracking. Documented in SCHEMA.md's "Audit-trail
fields" section. Future audit scripts adding new state to items must use
this prefix to keep the study-relevant / audit-trail boundary clean.

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

- $5 free credit + $50 paid credit (added Thu 2026-05-14) → pre-Audit-D pool: ~$53.71
- Cumulative Audit D spend through 2026-05-20: **$34.63** (unchanged from 2026-05-19)
  - $1.29 — SB0 calibration + SB1 pre-flight iterations
  - $7.42 — SB1 halt attempt 2026-05-18 (sunk; no on-disk verdicts)
  - $25.92 — SB1 full-corpus completion 2026-05-19 ($25.9170 exact)
  - $0    — SB1.6 (transcript-grep + post-process script, no LLM calls)
  - $0    — SB-fix-1 scoping (no LLM calls)
- **Credit remaining: ~$19.08**
- SB1 actual ($25.92) came in **under mid-projection** ($30); stretch ($45) and ceiling ($60) never approached. 100% cache hit rate on calls after first; per-verdict cost averaged $0.01234.
- Remaining $19.08 covers: SB-fix-1a apply work (no LLM calls — pure script work + Aiden review), modest verification re-runs if needed, and SB-fix-2 verification pass. A top-up will be needed before any sub-batch that re-runs the LLM-as-judge over the full corpus.

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
