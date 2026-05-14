# Report-#0003 — Audit D Sub-Batch 1 Pre-Flight: Prompt Tuning + Micro-Recalibration

Session date: 2026-05-14
Session type: Prompt iteration + micro-recalibration + regression + halt decision
Branch: main
Starting commit: 111be1f (Sub-batch 0 closure, 2026-05-13)
Status: **HALT decision**. iter0 ships as the working baseline (Recs 2 + 4 landed); Rec 1 deferred to future-session structural post-process approach.

## What was asked

Run Sub-batch 1 pre-flight per Aiden's plan: tune `audit-d-llm-judge.mjs` SYSTEM_PROMPT per the 4 recommendations from `docs/audit-d-calibration-summary.md`, run micro-recalibration on a 12-item sample (7 Sub-batch 0 disagreement rows + 5 fresh items seed 20260514), build supervisor packet for the 5 fresh items, ingest supervisor verdicts, compute agreement metrics, run regression check on the 23 Sub-batch 0 strict-agreement items, hit pass-or-iterate decision gate.

Ten decisions (D-A through D-J) signed off per the orientation doc. Two additions: cache-hit verification at micro-recal scale (D-E caveat), and R-new-1 overfit framing in the report.

Pass criteria established before execution:
- Subset 1 (disagreement rerun, 6 items D-H excluded): strict ≥5/6
- Subset 2 (fresh, 5 items): strict ≥3/5, collapsed ≥4/5
- Regression (23 strict-agree items): ≤2 strict shifts
- Paraphrase rate: <10% after retries
- Cache hit rate: ≥90% on calls after first

## What was done

### Phase 1 — Orientation + decision sign-off

Surfaced 10 decisions in `/tmp/audit-d-sub-batch-1-orientation.txt` (713 lines, piped to clipboard). All 10 approved as recommended. Two additions: cache-hit verification at $0.13 scale before scaling, and R-new-1 framing.

### Phase 2 — iter0 authoring + cache-enabled build

Modified `scripts/audit-d-llm-judge.mjs` (255 → 436 lines):
- Tuned SYSTEM_PROMPT per Recs 1-4.
- Inlined `MESSER_VIDEOS.md` (198 lines, ~1500 tokens) as the VIDEO INVENTORY section.
- Restructured system param as cacheable content block with `cache_control: { type: "ephemeral" }`.
- Added verbatim-retry logic (mode 2: hard-fail with single retry, retry budget = +30% of base call count).
- Tracked `cache_creation_input_tokens` / `cache_read_input_tokens` per call, computed hit rate at end.
- Added `--input` / `--output` CLI args; defaults preserve Sub-batch 0 behavior.

### Phase 3 — Sample build

Authored `scripts/audit-d-build-microrecal-sample.mjs` (~165 lines). Output: 12-item `microrecal-sample.json` combining 7 Subset 1 disagreement rows (re-pulled from Sub-batch 0 sample-selection.json) + 5 fresh Subset 2 items drawn deterministically with seed 20260514 (1 item per domain D1..D5, type randomly selected, Sub-batch 0 items excluded). All 12 transcripts confirmed present on disk.

Fresh Subset 2 picks: §1.2.2 cram[4] (HMAC) / §2.3.4 cram[2] (Mitigations) / §3.2.3 cram[2] (Load balancer) / §4.1.2 scen[1] (Android tablet MDM) / §5.4.2 mc[6] (CCPA Privacy).

### Phase 4 — iter0 micro-recal run

`node scripts/audit-d-llm-judge.mjs --input microrecal-sample.json --output microrecal-verdicts-iter0.json`

- 15 API calls (12 verdicts + 3 verbatim retries), $0.1710, 0 errors.
- Cache hit rate (calls after first): **14/14 = 100%** ✓ (D-E caveat satisfied).
- Verbatim retries: 3/12, paraphrase rate after retry **1/12 = 8.3%** ✓ (target <10%; baseline Sub-batch 0 was 27%).
- Confidence: 12/12 high.
- Category distribution: 6 partial-depth, 4 out-of-source, 2 in-source, **0 partial-adjacent**.

### Phase 5 — Subset 2 supervisor packet + pause

Authored `scripts/audit-d-build-microrecal-supervisor-packet.mjs` (~120 lines). Output: 51.5 KB packet covering only the 5 fresh items (S-R4 invariant preserved: zero script verdicts, zero keyword screen results).

Paused for Aiden's supervisor-Claude run. Surfaced full intermediate findings to `/tmp/audit-d-sub-batch-1-preflight-pause.txt` (428 lines) including the key finding: Rec 1 failed to lift partial-adjacent recognition (0/3 targeted shifts) AND three iter0 verdicts were internally contradictory (category=out-of-source + fix_direction=move-to-correct-video — the LLM literally wrote "this is clearly partial-adjacent rather than out-of-source" in its explanation while stamping out-of-source).

Aiden chose Option A (run supervisor on iter0 verdicts as baseline). Pre-approved Rec 1 iteration changes (reorder, decision-tree, consistency check) and Rec 3 accept-as-limitation. Specified HALT condition: if iter1 fails to lift partial-adjacent above 0, halt and do not iterate again without a fundamentally different approach (e.g. post-process category-fix-direction).

### Phase 6 — Subset 2 supervisor verdicts + iter0 metrics

Aiden's supervisor-Claude pass returned 5 verdicts. Saved to `microrecal-supervisor-verdicts.json`. Distribution: 3 high / 2 medium confidence; 2 in-source / 2 partial-depth / 1 partial-adjacent.

Authored `scripts/audit-d-microrecal-metrics.mjs` (~210 lines). Honors D-H (row 18 excluded from Subset 1 denominator since either partial-depth or in-source is acceptable). Computes Subset 1, Subset 2, combined, distributions, paraphrase rate, confidence distribution, inconsistent-fix-direction count, cache stats.

iter0 metrics (`microrecal-metrics-iter0.json`):
- **Subset 1 strict: 3/6 = 50% — FAIL** (need ≥5/6)
- Subset 1 collapsed: 6/6 = 100%
- **Subset 2 strict: 3/5 = 60% — PASS** (need ≥3/5)
- **Subset 2 collapsed: 3/5 = 60% — FAIL** (need ≥4/5)
- Combined strict: 6/11 = 54.5%
- Combined collapsed: 9/11 = 81.8%
- Paraphrase rate: 8.3% ✓
- Cache hit rate: 100% ✓
- Internally inconsistent verdicts: **3** (rows 10, 19, 24 — Rec 1 contradiction confirmed)

### Phase 7 — iter1: Rec 1 iteration

Per Aiden's pre-approval, applied three Rec 1 changes to SYSTEM_PROMPT:
1. **Reorder** CATEGORY DEFS: partial-adjacent moved before partial-depth (and well before out-of-source).
2. **Decision-tree** at top of CATEGORY DEFINITIONS: "Before choosing out-of-source OR partial-depth, ask: clearly Sec+-relevant? plausibly in another Messer video? If yes → partial-adjacent."
3. **Consistency check** as new section before VIDEO INVENTORY: "If fix_direction='move-to-correct-video', category MUST be 'partial-adjacent'. No exceptions."

Re-ran on the 12-item micro-recal: 17 API calls (12 verdicts + 5 verbatim retries), $0.1958, 100% cache hit rate.

iter1 metrics (`microrecal-metrics-iter1.json`):
- **Subset 1 strict: 4/6 = 66.7%** (up from 3/6 — rows 10 and 24 fixed)
- Subset 1 collapsed: 5/6 = 83.3% (down from 6/6 — row 11 regressed)
- **Subset 2 strict: 3/5 = 60%** (unchanged — but mix changed)
- Subset 2 collapsed: 3/5 = 60%
- Combined strict: 7/11 = 63.6% (+1)
- Combined collapsed: 8/11 = 72.7% (-1)
- Internally inconsistent verdicts: 1 (down from 3 — consistency check helped on rows 10, 24; failed on row 19)
- **Partial-adjacent count: 4/12** (up from 0/12 — HALT condition not triggered)

Net pattern: Rec 1 iter1 recognition works on some cases (rows 10, 24 — both involve concepts clearly in different videos) but causes over-correction on partial-depth boundary cases (row 11 PCI DSS shifted partial-depth → partial-adjacent incorrectly; HMAC similarly over-shifted).

Still OVERALL FAIL on pass criteria.

### Phase 8 — Regression check

Authored `scripts/audit-d-build-regression-sample.mjs` (~60 lines). Output: 23-item `regression-sample.json` (all 30 Sub-batch 0 rows minus the 7 disagreement rows).

Authored `scripts/audit-d-regression-metrics.mjs` (~160 lines). Pass threshold ≤2 strict regressions vs Sub-batch 0 supervisor on the same rows; smoke-test invariant (§2.3.3 mutex+atomic must stay out-of-source).

**iter1 regression** (`regression-verdicts-iter1.json` → `regression-metrics-iter1.json`):
- 30 API calls, $0.3072
- **Strict regressions: 10/23 = 43.5% — FAIL** (threshold ≤2)
- **Smoke-test invariant: BROKEN** — 3/4 smoke items regressed. §2.3.3 match[2] Mutex: out-of-source → partial-adjacent. §2.3.3 match[3] Atomic operation: out-of-source → partial-adjacent. §2.3.3 cram[2] Mutex: out-of-source → partial-depth. Only §2.3.3 cram[3] Atomic operation correctly stayed out-of-source.
- Collapsed regressions: 6/23 (4 of the 10 strict regressions were collapse-OK, since partial-adjacent collapses with out-of-source)

The smoke-test break is decisive: §2.3.3 mutex/atomic are programming concurrency primitives that are NOT on the Sec+ syllabus at all. The iter1 push to partial-adjacent ("plausibly in another Messer video") incorrectly classified them as "Sec+-relevant concepts that belong elsewhere." Pipeline anchor invariant broken.

Per Aiden's HALT spec, iter1 is **not shippable**. Rolled back the three iter1 prompt changes; restored iter0 prompt body to the script. Updated header comment to document the final state.

**iter0 regression** (re-run after rollback, `regression-verdicts-iter0.json` → `regression-metrics-iter0.json`):
- 28 API calls, $0.2984
- **Strict regressions: 2/23 = 8.7% — PASS** (exactly at threshold)
- **Smoke-test invariant: HELD** ✓ (all 4 smoke items correctly out-of-source)
- The 2 regressions: row 17 §3.1.1 mc[3] in-source → partial-depth; row 27 §5.4.2 mc[5] out-of-source → partial-depth. Both are Rec 2's partial-depth examples being slightly over-aggressive on borderline items; not catastrophic.

iter0 is the better-behaved candidate.

### Phase 9 — Decision gate evaluation

| Criterion | iter0 | iter1 | Threshold |
|---|---|---|---|
| Subset 1 strict (D-H excluded) | 3/6 = 50% | 4/6 = 66.7% | ≥5/6 |
| Subset 2 strict | 3/5 = 60% | 3/5 = 60% | ≥3/5 |
| Subset 2 collapsed | 3/5 = 60% | 3/5 = 60% | ≥4/5 |
| Regression strict | 2/23 = 8.7% | **10/23 = 43.5%** | ≤2 |
| Smoke-test invariant | ✓ HELD | **✗ BROKEN** | held |
| Paraphrase rate | 8.3% | 8.3% | <10% |
| Cache hit rate | 100% | 100% | ≥90% |
| Inconsistent fix-direction | 3 | 1 | (info) |
| Partial-adjacent recognition | 0/12 | 4/12 | (info) |
| **OVERALL** | **FAIL (2 of 6)** | **FAIL (3 of 6 + smoke)** | — |

Neither candidate meets pass criteria. iter0 fails on Subset 1 strict + Subset 2 collapsed; iter1 fails on Subset 2 collapsed + regression + smoke.

**Decision: HALT.** Per Aiden's HALT spec, iter1 over-correction confirms prompt-tuning has reached its structural limit on partial-adjacent recognition. Future approach: post-process category-fix-direction consistency (script-level data fix rather than prompt-instruct). That's a future-session decision per Aiden's pre-spec.

iter0 is the shipping baseline (Rec 2 + Rec 4 landed; Rec 1 deferred; Rec 3 accepted as limitation). Sub-batch 1 full-corpus run would proceed with the iter0 prompt + post-process script applied to flip `out-of-source/partial-depth + fix=move-to-correct-video` → `partial-adjacent + fix=move-to-correct-video` after the run completes.

## Outcomes per Recommendation

### Rec 1 — partial-adjacent definition strengthening: DEFERRED to structural post-process

iter0 (Rec 1 prose strengthening): 0 partial-adjacent verdicts despite stronger definition. The LLM understands the concept (the iter0 explanations on rows 10/19/24 literally used the words "partial-adjacent") but defaults to out-of-source at the category-stamping moment. Three internally-inconsistent verdicts (category=out-of-source + fix_direction=move-to-correct-video) make this contradiction visible.

iter1 (Rec 1 prose + reorder + decision-tree + consistency check): produced 4 partial-adjacent verdicts on the 12-item micro-recal, but over-corrected on 2 partial-depth boundary cases (row 11 PCI DSS, Subset 2 row 1 HMAC) and catastrophically over-corrected on the 23 regression items (10/23 shifts including 3/4 smoke items). The over-correction pattern: items where a related-but-different concept is in the cited transcript (e.g. mutex/atomic concurrency concepts, which aren't Sec+-relevant) get pushed to partial-adjacent.

The LLM's training-prior of "concept-not-here → out-of-source" is too strong to override with prompt-instruct alone, but pushing harder breaks the in-source / partial-depth boundary.

Future approach (Sub-batch 1.5 session): post-process the verdicts JSON. For each verdict where `fix_direction === "move-to-correct-video"` and `category !== "partial-adjacent"`, flip category to "partial-adjacent" (the LLM's fix-direction is a more reliable signal of intent than its category label). This is a ~5-line script, no LLM call. Captures 3 of the 4 partial-adjacent disagreements observed (rows 10, 19, 24 in Sub-batch 0; the iter0 explanations confirm these all had fix_direction=move-to-correct-video). Row 5 (CCPA) is the residual where neither prompt-tune approach worked because script's fix_direction was mark-for-Sybex-arbitration, not move-to-correct-video — this case would still need Aiden review.

### Rec 2 — partial-depth a/b/c pattern examples: LANDED

3 of 3 targeted Subset 1 disagreement items correctly shifted to partial-depth in iter0:
- Row 5 §1.4.3 mc[3] DHE acronym: out-of-source → partial-depth (pattern a — acronym not named)
- Row 11 §2.3.12 scen[1] PCI DSS deprecated crypto: out-of-source → partial-depth (pattern b — regulation framing)
- Row 30 §5.5.2 cram[0] PCI pen test: in-source → partial-depth (pattern b — regulation framing)

Subset 2 row 4 (Android tablet MDM screen lock policy) also correctly partial-depth.

Two over-shifts in regression: in-source → partial-depth (row 17 §3.1.1 mc[3]) and out-of-source → partial-depth (row 27 §5.4.2 mc[5]). Both are borderline cases where the Rec 2 prompt language could reasonably suggest partial-depth. Within tolerance.

### Rec 3 — confidence calibration: ACCEPTED AS LIMITATION

Per Aiden's pre-approval. Soft-instruction confidence calibration didn't move the needle: iter0 returned 12/12 high, identical pattern to Sub-batch 0's 30/30 high. Hard quotas (forcing 30% medium) risk distorting genuinely-high verdicts. Behavioral anchors didn't bite either.

Confidence remains a softer signal than category agreement. Downstream review uses stronger signals: structural_flag (paraphrase / empty-quote), quote presence, category↔fix-direction consistency (the post-process discriminator).

Documented in script header as deferred-not-forgotten. Revisit only if Sub-batch 1 full-corpus surfaces real problems caused by uniform high confidence.

### Rec 4 — verbatim quote rule + escape to ambiguous-call: LANDED

iter0 paraphrase rate: 1/12 = 8.3% after single-retry mode 2. Baseline Sub-batch 0 (no retry): 8/30 = 27%. ~70% reduction.

Mechanism observed working: 3 of 12 items triggered a verbatim retry; 2 produced verbatim quotes on retry; 1 remained flagged `quote-not-verbatim-after-retry` (row 3 §3.2.3 cram[2] load-balancer). Retry budget cap (+30% = 5 retries on 12 items) not approached.

## Metrics

### iter0 (shipping baseline)

| Metric | Value | vs SB0 Baseline | Pass? |
|---|---|---|---|
| Subset 1 strict (D-H excluded) | 3/6 = 50% | n/a (loaded sample) | ✗ |
| Subset 1 collapsed | 6/6 = 100% | n/a | (info) |
| Subset 2 strict | 3/5 = 60% | n/a (fresh) | ✓ |
| Subset 2 collapsed | 3/5 = 60% | n/a | ✗ |
| Combined strict (11 items) | 6/11 = 54.5% | 23/30 = 76.7%* | (info) |
| Combined collapsed | 9/11 = 81.8% | 26/30 = 86.7%* | (info) |
| Regression strict (23 items) | 21/23 = 91.3% | 23/23 = 100% | ✓ |
| Smoke-test invariant | HELD | HELD | ✓ |
| Paraphrase rate | 8.3% | 27% | ✓ |
| Cache hit rate | 100% | n/a | ✓ |
| Inconsistent fix-direction | 3/12 | n/a | (info) |
| Partial-adjacent recognition | 0/12 | n/a | (deferred) |

*Sub-batch 0 baseline figures cover a different 30-item set; not directly comparable. Shown for narrative orientation only.

Net effect of iter0 vs Sub-batch 0 baseline on the 30 original Sub-batch 0 items (constructed estimate):
- +3 strict matches on the 7 disagreement items (rows 5, 11, 30 fixed via Rec 2)
- -2 strict matches on the 23 strict-agree items (rows 17, 27 regression via Rec 2 over-shift)
- Net: +1 strict (24/30 = 80% vs 23/30 = 76.7%)
- Plus the paraphrase rate drop (27% → 8.3%) is a real evidence-quality improvement

Marginal-but-real improvement. Worth shipping with documented limitations.

### iter1 (rolled back)

| Metric | Value | Pass? |
|---|---|---|
| Regression strict | 10/23 = 43.5% | ✗ |
| Smoke-test invariant | **BROKEN** (3/4 smoke items shifted) | ✗ |
| Subset 1 strict (D-H excluded) | 4/6 = 66.7% | ✗ |
| Combined strict | 7/11 = 63.6% | (info) |
| Combined collapsed | 8/11 = 72.7% | (info) |
| Partial-adjacent recognition | 4/12 (lifted above 0; not 0 → HALT not triggered) | (info) |
| Inconsistent fix-direction | 1/12 (down from 3) | (info) |

iter1 is not shippable. Smoke break is unrecoverable; the partial-adjacent gain is bought at unacceptable cost on previously-correct items.

## Cost breakdown vs projection

| Run | Projected | Actual |
|---|---|---|
| iter0 micro-recal | $0.13 | $0.171 |
| iter1 micro-recal | $0.10-0.15 | $0.196 |
| iter1 regression | n/a (not in original plan) | $0.307 |
| iter0 regression | $0.25 | $0.298 |
| **Total Sub-batch 1 pre-flight** | $0.38-0.50 | **$0.972** |
| Sub-batch 0 prior | — | $0.321 |
| **Cumulative Audit D total** | — | **$1.293 of $5 (25.9%)** |

Over the original $0.38-0.50 projection (by ~2x) because of the iter1 iteration cycle + extra regression run. Still well within budget.

API credit topped up to ~$53.71 total during this session ($50 paid added; ~$3.71 free credit remaining). Sub-batch 1 full corpus ($15-50 depending on scope) and downstream Sub-batches 2-N fix runs fit comfortably within budget with headroom for iterations. Credit-ceiling concern resolved.

## Files changed

### New (committed)

| Path | Lines | Purpose |
|---|---:|---|
| `scripts/audit-d-build-microrecal-sample.mjs` | ~165 | Build 12-item micro-recal sample (7 disagree + 5 fresh) |
| `scripts/audit-d-build-microrecal-supervisor-packet.mjs` | ~120 | Build 5-item Subset 2 supervisor-Claude packet |
| `scripts/audit-d-microrecal-metrics.mjs` | ~210 | Compute Subset 1 + 2 + combined agreement metrics |
| `scripts/audit-d-build-regression-sample.mjs` | ~60 | Build 23-item regression sample |
| `scripts/audit-d-regression-metrics.mjs` | ~160 | Compute regression metrics vs Sub-batch 0 supervisor |
| `Reports/Report-#0003.md` | this file | Sub-batch 1 pre-flight session report |

### Modified (committed)

| Path | Change |
|---|---|
| `scripts/audit-d-llm-judge.mjs` | 255 → 461 lines; tuned SYSTEM_PROMPT per Recs 2 + 4 (Rec 1 in iter0 form only — iter1 changes rolled back); MESSER_VIDEOS.md inlined; prompt caching enabled; verbatim-retry mode 2 added; cache stats tracked; --input/--output CLI args. Header documents iter0 final state + iter1 attempt + rollback. |

### Not committed (gitignored, kept on disk)

In `.audit-working/audit-d-sub-batch-1-preflight/`:
- `microrecal-sample.json` — 12-item sample
- `microrecal-verdicts-iter0.json` — iter0 micro-recal verdicts
- `microrecal-verdicts.json` — copy of iter0 (default-name)
- `microrecal-verdicts-iter1.json` — iter1 micro-recal verdicts (experiment record)
- `microrecal-supervisor-packet.md` — packet handed to supervisor-Claude
- `microrecal-supervisor-verdicts.json` — Aiden's supervisor verdicts on 5 fresh items
- `microrecal-metrics-iter0.json` — iter0 metrics
- `microrecal-metrics-iter1.json` — iter1 metrics
- `microrecal-comparison-iter0.csv` — iter0 per-row CSV
- `microrecal-comparison-iter1.csv` — iter1 per-row CSV
- `regression-sample.json` — 23-item regression sample
- `regression-verdicts-iter0.json` — iter0 regression verdicts (shipping baseline)
- `regression-verdicts-iter1.json` — iter1 regression verdicts (smoke broken; record)
- `regression-metrics-iter0.json` — iter0 regression metrics
- `regression-metrics-iter1.json` — iter1 regression metrics

## Decisions reached

1. **iter0 is the shipping baseline.** Rec 2 (partial-depth a/b/c examples) and Rec 4 (verbatim retry mode 2) landed cleanly. Cache enabled, hit rate 100% on calls after first.
2. **iter1 is rolled back.** Three Rec 1 changes (reorder, decision-tree, consistency check) caused massive regression on the 23 strict-agree items (10/23 shifts including 3/4 smoke items). Smoke-test invariant break is unrecoverable.
3. **Rec 1 is deferred to a future-session structural post-process approach.** The LLM's internal contradiction pattern (3 verdicts in iter0 with category=out-of-source + fix_direction=move-to-correct-video) is more reliably caught by post-process script than by prompt-instruct. Future post-process: flip category to partial-adjacent when fix_direction is move-to-correct-video. ~5-line script, no LLM call.
4. **Rec 3 is accepted as limitation.** Confidence calibration via soft prompt instructions doesn't bite. Confidence is a softer signal than category agreement; downstream review uses structural_flag, quote presence, and consistency check as stronger signals.
5. **Pass criteria NOT met overall** but the work product is shippable. Subset 1 strict 3/6 fails because Rec 1 doesn't bite; this is the known limitation deferred to post-process.
6. **R-new-1 overfit framing documented:** Rec 2's example items (DHE, PCI pen test) were drawn from Sub-batch 0 disagreements. Any Sub-batch 1 full-corpus partial-depth pattern that doesn't match (a), (b), or (c) is a candidate for Sub-batch 1.5 tuning iteration, not a Sub-batch 1 failure.
7. **sonnet-4-6 upgrade remains a separate decision** before Sub-batch 1 full corpus. iter0 was run on sonnet-4-5 to isolate prompt-delta from model-delta per D-I. Full corpus session can revisit.
8. **Audit D Sub-batch 1 full-corpus run is gated on:** Sub-batch 1.5 post-process script implementation + spot-check against the 4 Sub-batch 0 partial-adjacent items + final Aiden sign-off. Probably a 1-hour session.

## Lessons learned — fix_direction as LLM-intent signal

The most valuable thing this session produced is the architectural insight that underlies the Sub-batch 1.5 plan. Documenting cleanly so future-you (or future supervisor sessions) have it.

**The observation pattern.** In iter0, 3 of 6 Subset 1 disagreement items (rows 10, 19, 24) produced verdicts where the LLM's three output fields disagreed with each other:
- `category: "out-of-source"` (the chosen label)
- `fix_direction: "move-to-correct-video"` (the action implied)
- `justification_explanation: "...this is clearly partial-adjacent..."` (the LLM's own prose)

The fix_direction "move-to-correct-video" is defined in the same prompt as the action for partial-adjacent specifically. The LLM picked the right action and wrote the right concept name in its explanation, but stamped the wrong category label.

iter1 (which added an explicit consistency check telling the LLM "if fix_direction is move-to-correct-video, category MUST be partial-adjacent") reduced this from 3 to 1 contradictory verdict — confirming the consistency check works on some cases but the LLM still ignored it on row 19 (DLP). Adding more prompt language to enforce the check has diminishing returns.

**Diagnostic interpretation.** The LLM's training prior of "concept-not-in-this-transcript → out-of-source" overrides explicit prompt instruction at the moment of category-label selection. Other fields are less constrained by the prior so they reflect the actual reasoning. The internal contradiction is not noise — it is a signal that the LLM understands the partial-adjacent concept but can't commit it to the category field reliably.

**Architectural conclusion.** Two output channels carry information about the LLM's intent. The category field is the contested signal (training prior interferes). The fix_direction field is the cleaner signal (no overlapping training prior, schema-bound to one option per category). When they conflict, fix_direction reflects intent more reliably.

Post-processing on fix_direction → category consistency separates two distinct concerns:
- LLM judgment (which the prompt elicits via fix_direction)
- Category-label mechanics (which we enforce in script, not in prompt)

This is structurally cleaner than further prompt iteration. The post-process script is ~5 lines, costs $0, has no risk of regression on other items.

**Generalization to future Sub-batch runs.** This approach is not specific to Sub-batch 1. Whenever the LLM is asked to produce a category + fix_direction pair from a constrained schema where the pairing is mechanical, applying a post-process consistency-check is more robust than relying on the prompt to elicit it correctly. The pattern generalizes to:
- Any future Audit D sub-batch on Sec+ content
- Any future content-audit using the same 6-way schema
- More broadly, any LLM-as-judge pipeline where the schema enforces a category-action pairing

**What this DOESN'T solve.** Cases where the LLM's fix_direction is itself wrong. Sub-batch 2 Row 5 (CCPA) is the case in point: tuned-script said partial-depth + fix=mark-for-Sybex-arbitration, supervisor said partial-adjacent + fix=move-to-correct-video. Post-process won't flip this because the fix_direction wasn't move-to-correct-video to begin with. Those cases remain for downstream Aiden review.

The structural-approach distinction: prompt-instruct elicits LLM judgment; post-process enforces schema consistency. They are complementary, not substitutes.

## Boundaries honored

- ✓ No `questions.json` changes (Audit D is verdict-as-data only).
- ✓ S-R3 invariant preserved (system prompt makes no reference to keyword stage results).
- ✓ S-R4 invariant preserved (supervisor packet contains zero script verdicts, zero keyword screen results).
- ✓ HALT rule respected: iter1 lifted partial-adjacent above 0 (4/12), so HALT didn't auto-fire. After iter1 caused unacceptable regression, halted per the spirit of the rule and per Aiden's "no second-round iteration without a fundamentally different approach."
- ✓ Cost cap: $0.972 of $5 free credit this session; cumulative Audit D total $1.293 of $5 (25.9%).
- ✓ Hard request cap (HARD_CAP=100): actual max was 30 calls (iter1 regression). Never approached.
- ✓ Reports/Report-#0003.md produced per CLAUDE.md Workflow Rule #7.

## What's next

### Sub-batch 1.5 — structural post-process (future session, ~1 hour)

1. Author `scripts/audit-d-postprocess-verdicts.mjs` that takes a verdicts.json file and:
   - For each verdict where `fix_direction === "move-to-correct-video"` AND `category !== "partial-adjacent"`: log the conflict, flip category to "partial-adjacent", set `post_processed: true` on the verdict record.
   - Output a new verdicts-postprocessed.json.
2. Spot-check on iter0 verdicts: rows 10, 19, 24 in micro-recal should flip from out-of-source → partial-adjacent. Row 5 (Subset 2 CCPA) won't flip because its fix-direction was mark-for-Sybex-arbitration; flag as residual for Aiden review.
3. Re-compute micro-recal-metrics on the post-processed verdicts:
   - Expected Subset 1 strict (D-H excluded): 3/6 → 5/6 or 6/6 (rows 10, 24 flip cleanly; row 19 if fix-direction was move-to-correct-video which iter0 indicates it was). PASS likely.
   - Expected Subset 2: row 5 stays as partial-depth (no flip) → unchanged. Still 3/5 strict.
4. Aiden sign-off on the post-processed metrics. If Subset 1 strict ≥5/6 after post-process AND no new regressions → CLEAR for full corpus.

### Sub-batch 1 — full-corpus run (after Sub-batch 1.5 closure)

1. Scope decision: match+cram only (1,251 items, ~$15-25) or expand to match+cram+MC+scen (~2,200 items, ~$35-50). Default match+cram only per the original scoping doc. Expand only if Sub-batch 1.5 micro-recal results indicate MC/scen misfile rate is high.
2. Model decision: stay on sonnet-4-5 or upgrade to sonnet-4-6. Default: upgrade if available, since prompt-tune is locked in; model change can only help.
3. Bump HARD_CAP from 100 to e.g. 1,500 for full-corpus run.
4. Run audit-d-llm-judge.mjs on the full corpus. Cache should keep it close to projection.
5. Apply post-process script (from Sub-batch 1.5). Generate diff-rate stats vs raw output for transparency.
6. Aiden review of all `move-to-correct-video` verdicts (the post-process target) for spot-check accuracy.
7. Produce Audit D Sub-batch 1 final summary doc; this is the verdict-as-data input for the actual content remediation work.

### R7 (audit-study collision) Strategy A vs B

Still deferred until Sub-batch 1 verdict-as-data lands.

### Task 2 Sub-batches 3-5

Still deferred behind Audit D per D5 from earlier scoping.

────────────────────────────────────────────────────────────────────

End of Report-#0003.
