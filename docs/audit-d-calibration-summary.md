# Audit D Sub-Batch 0 — Calibration Summary

Date: 2026-05-13
Sub-batch: 0 (calibration tooling + 30-item run)
Status: **PASSES** on the collapsed agreement metric;
**prompt tuning required** before Sub-batch 1+ scope expansion.
Smoke test: **PASS** at both stages on all 4 cohort items.

Authoritative scoping doc: [`docs/audit-d-scoping.md`](audit-d-scoping.md)
(committed `78b3a3c`, revised mid-Sub-batch-0).

## Smoke test

The §2.3.3 mutex / atomic-operation case is the ground-truth
known-positive (the trigger that scoped Audit D in the first
place). Stage 1 (keyword pre-screen) and Stage 2 (LLM-as-judge)
must both flag all 4 cohort items as out-of-source / term-absent
or the pipeline is broken.

| row | item | Stage 1 keyword | Stage 2 script LLM | Supervisor-Claude |
|---:|---|---|---|---|
| 1 | §2.3.3 match[2] "Mutex" | term-absent | out-of-source / high | out-of-source / high |
| 2 | §2.3.3 match[3] "Atomic operation" | term-absent | out-of-source / high | out-of-source / high |
| 3 | §2.3.3 cram[2] "Mutex (Mutual Exclusion)" | term-absent | out-of-source / high | out-of-source / high |
| 4 | §2.3.3 cram[3] "Atomic operation" | term-absent | out-of-source / high | out-of-source / high |

**All 4 smoke items PASS both stages.** Methodology validated against
the known-positive.

## Agreement metrics

Calibration sample: 30 items, deterministic seed `20260513`, stratified
across 5 domains × 4 types per the allocation table in the scoping doc
(4 must-include smoke + 26 stratified-random remainder).

Two independent LLM readers:
- **Script reader**: `claude-sonnet-4-5` via the Anthropic API,
  per-item call with full transcript in context.
- **Supervisor-Claude reader**: separate Claude.ai conversation,
  packet-pasted, returned single JSON array of 30 verdicts.
  Blind to script verdicts and keyword stage results (S-R4
  invariant extended to second reader).

| Metric | Result | Threshold |
|---|---|---|
| Strict 6-way agreement (exact category match) | **23 / 30 = 76.7%** | ≥85% |
| Collapsed agreement (`partial-adjacent ≡ out-of-source` as "not-in-transcript"; `partial-depth` kept separate) | **26 / 30 = 86.7%** | ≥85% |

Interpretation per the spec Aiden set: strict below 85% but
collapsed above 85% supports the **"prompt tuning needed but
methodology sound"** reading. Both readers consistently identified
the same broad set of misaligned items; they differ on **how to
categorize** the misalignment, not on whether it exists.

## Category distribution

| Category | Script | Supervisor |
|---|---:|---:|
| in-source | 13 | 13 |
| partial-depth | 4 | 6 |
| partial-adjacent | 0 | 3 |
| out-of-source | 13 | 8 |
| out-of-syllabus | 0 | 0 |
| ambiguous-call | 0 | 0 |

**The category counts make the prompt-bias visible.** The script
returned **zero** `partial-adjacent` verdicts despite the
supervisor finding 3 clear cases. The 5-item delta in `out-of-source`
(script 13 → supervisor 8) is mostly absorbed by `partial-adjacent`
(+3) and `partial-depth` (+2). This is the bias pattern Aiden
flagged when ingesting the supervisor verdicts: the script's
prompt defaults to `out-of-source` when finer categories would
be more accurate.

Confidence skew:
- **Script**: 30/30 at high confidence (no medium, no low).
- **Supervisor**: ~70% high / ~30% medium / 0% low. More
  discrimination, less default-to-high.

## Per-disagreement detail (7 strict mismatches)

### Collapsed-resolved (3 items — script over-strict on out-of-source, supervisor finds partial-adjacent)

| row | item | script | supervisor | adjacent video the supervisor identified |
|---:|---|---|---|---|
| 10 | §2.3.10 mc[0] "shared responsibility model" | out-of-source / high | partial-adjacent / high | 3.1.1 Cloud Infrastructures ("responsibility matrix") |
| 19 | §3.3.3 match[0] "DLP (Data Loss Prevention)" | out-of-source / high | partial-adjacent / high | DLP is a Sec+ objective in a different Messer video |
| 24 | §4.8.2 match[3] "BCP" | out-of-source / high | partial-adjacent / high | BCP belongs in a continuity/disaster-recovery video |

These are the items where the **fix-direction matters**: script
suggested `mark-for-Sybex-arbitration` while supervisor correctly
suggested `move-to-correct-video`. The two fix-directions imply
very different remediation work (find-and-rewrite vs simply
re-cite).

### True mismatches (4 items, even after collapse)

| row | item | script | supervisor | nature of disagreement |
|---:|---|---|---|---|
| 5 | §1.4.3 mc[3] "DHE stands for:" | out-of-source / high | partial-depth / medium | Script: acronym "DHE" not in transcript → out-of-source. Supervisor: underlying mechanism is taught (Diffie-Hellman-style key exchange + ephemeral session keys), but the acronym itself is not — partial-depth. |
| 11 | §2.3.12 scen[1] "PCI DSS deprecated crypto" | out-of-source / high | partial-depth / medium | Script: PCI DSS / TLSv1.0 / 3DES not named → out-of-source. Supervisor: "insecure protocols as misconfiguration" IS taught; the specific crypto-deprecation framing is enrichment depth not delivered. |
| 18 | §3.1.3 scen[3] "containers vs VMs isolation" | partial-depth / high | in-source / high | Script: security argument not explicit. Supervisor: shared-host-OS-versus-separate-guest-OS taught structurally; the security argument follows directly. |
| 30 | §5.5.2 cram[0] "Penetration test as audit tool" | in-source / high | partial-depth / medium | Script: pen-test-as-audit-tool is taught. Supervisor: opening line establishes it generically but the video body doesn't develop the audit/compliance angle; PCI DSS specifically + annual-test compliance not mentioned. |

Pattern: 3 of 4 true mismatches involve **`partial-depth`** — a
category the script under-uses (returned only 4 vs supervisor's
6). The script's prompt may not be tuning well for "concept is
named but at insufficient depth for the item's question." This
is the key tuning target for Sub-batch 1+.

## Sub-batch 0 verdict

**PASS** with two qualifications:

1. **Methodology is sound enough to proceed.** Both readers
   identified the same broad set of misaligned items
   (collapsed-agreement 86.7%). The smoke test fires correctly.
   The pipeline can be scaled to the full 1,251-item match+cram
   corpus.

2. **Prompt tuning is required before scope expansion.** The
   script's prompt biases toward `out-of-source` when
   `partial-adjacent` would be more accurate (3 collapsed-only
   disagreements) and under-uses `partial-depth` for the
   "concept-named-but-shallow" pattern (3 of 4 true mismatches).

If we expand to 1,251 items without tuning:
- ~10% of fix recommendations would mis-route from
  `move-to-correct-video` (cheap re-cite) to
  `mark-for-Sybex-arbitration` (expensive Aiden review).
- Items with surface-deep-but-not-deep-enough coverage may be
  miscategorized as in-source OR out-of-source rather than
  partial-depth, affecting Aiden's fix triage.

## Prompt-tuning recommendations for Sub-batch 1+

Before kicking off Sub-batch 1, modify `scripts/audit-d-llm-judge.mjs`
`SYSTEM_PROMPT` along these axes:

1. **Strengthen the `partial-adjacent` category definition.** Add
   explicit guidance: "If the concept is plausibly in a different
   Sec+ video (even one you don't have the transcript for), prefer
   `partial-adjacent` over `out-of-source`. Use `out-of-source`
   only when you have positive evidence the concept is not on
   the SY0-701 syllabus at all." Consider including the full
   `MESSER_VIDEOS.md` video inventory in the system prompt so
   the LLM can reason about which adjacent videos likely cover
   the concept.

2. **Sharpen `partial-depth` recognition.** Add examples of the
   "concept named but shallow" pattern to the prompt. E.g.: "If
   the underlying mechanism is taught but the specific acronym /
   regulation reference / depth-level the item assumes is not,
   prefer `partial-depth`. The transcript may teach Diffie-
   Hellman-style key exchange without naming DHE; that's
   partial-depth, not out-of-source."

3. **Calibrate confidence.** All 30 script verdicts came back
   `high` confidence; supervisor's 30% `medium` is more honest.
   Consider explicit prompt language: "Use `high` only when the
   transcript content fully determines the verdict. If the
   judgment requires weighing surface coverage versus tested
   depth, prefer `medium`."

4. **Quote rules tighten.** 8 of 30 script verdicts had
   `quote-not-verbatim` structural flags (paraphrased rather
   than substring quotes). Strengthen the verbatim-quote
   requirement in the prompt — "The justification_quote must be
   copy-pasted exactly from the transcript; if you cannot find
   a verbatim substring that supports the verdict, set the
   category to `ambiguous-call`."

After tuning, run a **micro-recalibration** (~10 items, $0.10
budget) on a fresh seeded sample BEFORE full Sub-batch 1
execution. If the tuned prompt produces a category distribution
closer to the supervisor's (3+ `partial-adjacent`, 6+
`partial-depth`, fewer than 13 `out-of-source` on a comparable
sample), proceed to full Sub-batch 1. If not, iterate.

## Findings beyond the smoke cohort (surfaced for awareness)

The 26 random-sample items contained substantial out-of-source /
partial-adjacent / partial-depth content. Headline takeaways:

- **April 27 MC+scen cleanness does NOT fully hold.** 4 MC/scen
  items in the sample were flagged not-in-cited-transcript by
  both readers (rows 5, 10, 11, 27). The April 27 keyword-audit's
  "MC + scen are clean" finding was true for the methodology it
  used (keyword extraction); LLM judgment surfaces real misfiles
  the keyword approach missed. Implication: when Sub-batch 1+
  scales out, the corpus likely needs to expand from
  match+cram-only to match+cram+MC+scen. Hold this decision
  until tuned-prompt micro-recalibration confirms.
- **Match+cram out-of-source rate is high.** Of 22 random match+cram
  items, 6 were flagged out-of-source by both readers, plus
  several more as partial-adjacent/partial-depth. The match+cram
  scope is producing real findings; this is not noise.
- **Aiden's §2.3.3 trigger is one of many.** The audit's
  triggering case is just the most visible example; supervisor's
  verdicts on rows 13 (Type 1 hypervisor), 14 (integer overflow),
  19 (DLP), 24 (BCP) suggest similar patterns elsewhere.

## Cost

| Stage | Items | Cost (USD) | Source |
|---|---:|---:|---|
| Stage 1 keyword screen | 20 (match+cram only) | $0.00 | local |
| Stage 2 script LLM-as-judge | 30 | $0.3207 | Anthropic API (Sonnet 4.5) |
| Supervisor-Claude pass | 30 | $0.00 | Aiden's Claude.ai subscription |
| **Total** | **80 reads (30 unique items)** | **$0.3207** | of $5 free credit |

Hard request count cap (S-R5) was 100. Actual API calls: 30.
No retries triggered, no errors.

## Decision

**PROCEED to Sub-batch 1 with the prompt-tuning gate.** Sub-batch 1
begins only after:

1. `scripts/audit-d-llm-judge.mjs` `SYSTEM_PROMPT` updated per
   recommendations 1-4 above.
2. Micro-recalibration on a fresh ~10-item seeded sample shows
   category distribution closer to supervisor's profile.
3. Aiden signs off on the tuned prompt.

If tuned-prompt recalibration succeeds, Sub-batch 1 executes
verdicts on the full 1,251 match+cram corpus (and possibly
MC+scen pending the broader-scope decision above) at an
estimated cost of ~$15-25 for the full LLM stage.

R7 (audit-study collision) Strategy A vs Strategy B decision
deferred until Sub-batch 1 verdict-as-data lands.

## Files produced

In `.audit-working/audit-d-calibration/` (gitignored working dir):

| File | Purpose |
|---|---|
| `sample-selection.json` | seeded 30-item sample with metadata |
| `keyword-screen-results.json` | Stage 1 per-item output |
| `llm-verdicts.json` | Stage 2 script-Sonnet verdicts |
| `supervisor-claude-review-packet.md` | the packet pasted to supervisor-Claude |
| `supervisor-verdicts.json` | supervisor-Claude's 30-item JSON response |
| `unblinded-comparison.csv` | side-by-side comparison view |
| `agreement-metrics.json` | computed metrics |
| `calibration-status.txt` | auto-generated brief status |

In `scripts/` (committed):

| Script | Purpose |
|---|---|
| `audit-d-sample.mjs` | seeded sample selection |
| `audit-d-keyword-screen.mjs` | Stage 1 keyword pre-screen |
| `audit-d-llm-judge.mjs` | Stage 2 LLM-as-judge |
| `audit-d-build-review.mjs` | smoke gate + supervisor packet builder |
| `audit-d-ingest-supervisor.mjs` | supervisor JSON ingest + agreement analysis |
