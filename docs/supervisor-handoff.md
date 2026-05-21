# Where Things Stand — 2026-05-21 (late afternoon close; after SB-fix-1b packets 1+2 ship)

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

**Last commit:** `87b566e` (Thu 2026-05-21, SB-fix-1b packet 2/6) — plus today's late-afternoon docs-sync commit landing this paragraph. Recent chain: SB-fix-1a packets 1/3 / 2/3 / 3/3 (`53786b0` / `4b9d838` / `61b6992`); PLAN/handoff sync end-of-day 2026-05-20 (`df40c40`); Report-#0007 (`4e6fb9e`); PLAN/handoff sync after Report-#0007 (`56875cb`); SB-fix-1b-prep single commit (`c1464c0`); Report-#0008 (`5bec38a`); PLAN/handoff sync after Report-#0008 (`a05f417`); SB-fix-1b packet 1/6 (`c252fa1`); SCHEMA sb16_subcategory semantics (`12deabc`); sb16_subcategory backfill on SB-fix-1a candidates (`6f796f7`); apply-script sb16_subcategory threading (`ae5495f`); SB-fix-1b packet 2/6 (`87b566e`); this late-afternoon sync commit.

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
- ✅ **SB-fix-1 scoping (Tue 2026-05-20)** — D2 partial-adjacent inventoried at 197 items. Schema-constraint finding split the work: mc + scen (63 items) per-item citable + Strategy A study-safe; match + cram (134 items) inherit citation from parent → SB-fix-1b deferred (Path B = schema extension).
- ✅ **SB-fix-1a SHIPPED 2026-05-20** (three commits: `53786b0` + `4b9d838` + `61b6992`). Q6 validator-constraint check first (Outcome A — no rule blocks per-item override). Then 3 packets of 25/25/13 items with per-packet commits. Cadence: C for packet-1 (built, surfaced, calibrate), pivoted to B for packets 2+3 (combined relay) after parser-v2 fix landed mid-stream. Parser-v2 replaced regex-based v1 with allowlist-based matching after packet-1 review surfaced 4 parser bugs (truncation on "or", inverted primary, prose-suffix capture, hallucinated titles); 10 corpus items improved, 53 unchanged. **Cumulative: 63 reviewed / 52 re-cited / 1 self-alternate (#17) / 10 sb16-candidates.** Mid-stream cluster verification on 9 supervisor-flagged items (TASK-1-style transcript grep) confirmed all 9 as SB16-CANDIDATE (concept-here-but-not-this-exact-term in §2.4 attack-types cluster). Validator clean throughout (0 errors / 5 warns unchanged from baseline). Backups retained at `.audit-working/sb-fix-1a/backups/`.
- ✅ **Report-#0007 SHIPPED 2026-05-21 (`4e6fb9e`).** Load-bearing methodology document for SB-fix-1a covering Q6 + parser v2 + all 3 packets + catch-all generalisation across §2.2/§2.3/§2.4/§2.5 + partial-depth under-application + Messer-curriculum-gap candidates. Cumulative methodology agreement number locked at **47/50 = 94%** (30 spot-check + 8 uncertainty-verified + 9 cluster-verified; 3 remaining disagreements all SB1.6-method-handled). Supervisor sign-off PASS with four framing nudges folded in (parser-v2 functional impact framing; denominator reconstruction in §8; corpus-scale claim softened; (A)↔(B) hidden dependency in §9).
- ✅ **SB-fix-2 pool composition walk 2026-05-21** — type-composition surfaced 14 of 31 items (45%) as match+cram → (A) is sequencing prerequisite for that subset. Ordering decided: Option 1 (A→B sequential).
- ✅ **SB-fix-1b-prep SHIPPED 2026-05-21 (`c1464c0`) + Report-#0008 (`5bec38a`).** Schema extension + validator generalisation. SCHEMA.md: MatchItem + CramTerm optional `messerVideo` + `subObjective` with both-or-neither rule; new Citation field rules section + type-level enforcement table. Validator: extracted `checkCitation()` helper (preserves existing error codes verbatim per Q-B refinement 1; explicit both-or-neither logic per Q-B refinement 2); called from match + cram walkers with `requireCitation: false`; Q-C comment in `forEachStringField`; `--selftest` flag with 6 fixtures (6/6 PASS). Q-A through Q-E supervisor-adjudicated; zero JSX changes per Q-D-1 (citation stays tooling-metadata; reserves Q-D-2 as future opt-in). Headline: scope reduced from feature-shaped to data-shaped after no-UI-read-path audit; supports BOTH 134-item SB-fix-1b apply pool AND 14-item SB-fix-2 match+cram subset under uniform schema.
- ✅ **SB-fix-1b packets 1+2 SHIPPED 2026-05-21 (`c252fa1` + `87b566e`).** 50/134 D2 PA match/cram items re-cited (37% of pool). Cadence Option A confirmed for packets 3-6 (per-packet surface-and-hold). Packet 1: 25 items all in §2.2 (11 match + 14 cram), 25 edits + 0 sb16-candidates. Packet 2: 25 items in §2.2 tail + §2.3 (14 match + 11 cram), 21 edits + 4 sb16-candidates (2 messer-curriculum-gap + 2 partial-depth). Headline finding (Report-#0009 backlog): mitigation-catch-all sub-pattern — 7 of 21 packet-2 edits (33%) move from §2.3 vulnerability videos into 2.5 Mitigation Techniques (ASLR/DEP/Stack canary/Mutex/WAF). Distinct shape from Report-#0007 §5's catch-alls. Cross-packet inconsistency surfaced: BEC items split between SB-fix-1a (Other Social Engineering Attacks) and SB-fix-1b (Phishing) — tracked in `.audit-working/sb-fix-1b/cross-packet-inconsistencies.md` for transcript-grep reconciliation after SB-fix-1b closure.
- ✅ **`sb16_subcategory` formalised 2026-05-21 (`12deabc`).** SCHEMA.md documents two values with umbrella-conceptual-fit framing: `partial-depth` (cited video's umbrella subsumes tested technique; technique absent from transcript — Spectre/Meltdown shape under Hardware Vulnerabilities; SYN flood under DoS) vs `messer-curriculum-gap` (cited video is a sibling concept; tested technique has no umbrella home anywhere in Messer's corpus — integer overflow shape under Buffer Overflows). Defining axis: does the cited video's umbrella concept conceptually contain the tested technique? Backfill (`6f796f7`) retrofitted all 10 SB-fix-1a sb16-candidates as `partial-depth`; integer overflow #36/#37 in SB-fix-1b packet 2 introduced the first `messer-curriculum-gap` cases. `sb16_subcategory` is now a required field on every sb16-candidate decision (threaded through `sb-fix-1b-apply-packet.mjs` in `ae5495f`).
- ⏸ **SB-fix-1b packets 3-6 (84 items remaining).** Next-session opener: packet 3 build — first §2.4 cluster packet (60 items in §2.4 spans packets 3-5). Expect cluster-verification rounds for sb16-candidate surfacing — same shape as #36/#37 integer overflow workflow this session. Cadence Option A (per-packet surface-and-hold).
- ⏸ **SB-fix-2** — partial-depth review against the now-**33-item** candidate-augment pool (21 from SB1.6 + 10 surfaced during SB-fix-1a + 2 new messer-curriculum-gap from SB-fix-1b packet 2 #36/#37). Both mc/scen subset (17 items) AND match/cram subset (14 items + 2 new messer-curriculum-gap = 16) now structurally unblocked. SB-fix-2 will need separate routing for the two `sb16_subcategory` values: partial-depth candidates can often resolve via re-cite or item rewrite to umbrella; messer-curriculum-gap candidates require a deeper content-vs-Messer decision (re-cite to survey video / rewrite to covered concept / flag for removal). Order: after SB-fix-1b apply completes.
- ⏸ **Domain 1/3/4/5 partial-adjacent** (227 remaining items) — future sub-batches once D2 pattern is fully validated through SB-fix-2.
- ⏸ **Closure sub-batch**

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

## Key findings from 2026-05-20 (now fully captured in Report-#0007)

Two findings carried into Report-#0007 §5 and §6:

**(1) The catch-all pattern generalises across Domain 2.** Packet-1 supervisor flagged the §2.2 cluster acting as a catch-all for "anything social-engineering-adjacent" (DKIM/SPF/DMARC items, DNS pharming, physical/awareness items). SB-fix-1a confirmed this at scale and revealed the pattern is **systemic across §2.2/§2.3/§2.4/§2.5**: §2.3 Types of Vulnerabilities bucketed DNS-specific / infrastructure / mitigation items that belonged elsewhere; §2.4 dominates within-cluster sibling reorganization (right area, wrong sub-video) with 15 of 52 edits being §2.4-internal moves; §2.5 Mitigation Techniques bucketed cross-domain hardening content that belonged in §4.1 / §4.8 / §1.2. Likely repeats in Domain 1/3/4/5 partial-adjacent pools (227 remaining items) and in the deferred SB-fix-1b match + cram pool (134 items).

**(2) Partial-depth was systematically under-applied at the LLM-as-judge layer.** SB1.6's prose-marker predicate caught 21 items (3 strict + 18 loose). SB-fix-1a review surfaced **10 additional sb16-candidates** beyond what the predicate caught — pushing the SB-fix-2 candidate-augment pool to 31 items. 9 of the 10 are clustered in §2.4 attack-types where each parent video covers a generic attack family but doesn't name canonical exam-relevant techniques (SYN flood, DNS tunneling, evil twin, WPA2 handshake, IDOR, credential stuffing, pass-the-hash). These required supervisor's sibling-aware "concept-here-but-not-this-exact-term" review heuristic with no clean automated proxy. SB-fix-2 will need a similar manual gate.

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
- Cumulative Audit D spend through 2026-05-21 (late afternoon close): **$34.63** (unchanged from 2026-05-19; SB-fix-1a + Report-#0007 + SB-fix-1b-prep + Report-#0008 + SB-fix-1b packets 1+2 + sb16_subcategory formalisation work were all pure script + documentation + paste-relay review, $0 LLM)
  - $1.29 — SB0 calibration + SB1 pre-flight iterations
  - $7.42 — SB1 halt attempt 2026-05-18 (sunk; no on-disk verdicts)
  - $25.92 — SB1 full-corpus completion 2026-05-19 ($25.9170 exact)
  - $0    — SB1.6 (transcript-grep + post-process script, no LLM calls)
  - $0    — SB-fix-1a (3 packets of script-only + Aiden review, no LLM calls anywhere)
  - $0    — Report-#0007 (documentation, no LLM)
  - $0    — SB-fix-1b-prep (schema + validator + self-test work, no LLM)
  - $0    — Report-#0008 (documentation, no LLM)
  - $0    — SB-fix-1b packets 1+2 (script-only apply + supervisor paste-relay review + corpus grep for integer overflow / SYN flood, no LLM)
  - $0    — sb16_subcategory SCHEMA + backfill + apply threading (documentation + script work)
- **Credit remaining: ~$19.08**
- SB1 actual ($25.92) came in **under mid-projection** ($30); stretch ($45) and ceiling ($60) never approached. 100% cache hit rate on calls after first; per-verdict cost averaged $0.01234.
- Remaining $19.08 covers: SB-fix-1b apply work (no LLM — transcript grep + manual review against 84 remaining items in packets 3-6), SB-fix-2 review (no LLM expected — manual gate against now-33-item pool), Domain 1/3/4/5 PA sub-batches (no LLM expected), closure work, and a meaningful margin for any unexpected mid-arc LLM-as-judge work. A top-up will be needed before any sub-batch that re-runs the LLM-as-judge over the full corpus.

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
