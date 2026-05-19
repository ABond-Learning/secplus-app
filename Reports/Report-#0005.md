# Report-#0005 — Audit D Sub-batch 1 full-corpus completion + spot-check sign-off

Session date: 2026-05-19
Session type: Audit D Sub-batch 1 full-corpus execution + post-process + supervisor-reviewed spot-check
Branch: main
Starting commit: `d47c16a` (docs: log SB1 halt + resume-patch state for tomorrow's restart)
Ending commit: (this report's commit; see git log)
Commits this session (in order, planned): CLAUDE.md Rule #8 (already pushed earlier in session), this Report-#0005, and a follow-up docs commit (PLAN.md + docs/supervisor-handoff.md).

## What was asked

The session opened with two preparatory items and then the main task:

1. **CLAUDE.md Workflow Rule #8** — codify the resume-first design lesson from the SB1 halt of 2026-05-18. Standalone commit, push, then proceed to SB1 restart. (Shipped earlier in this session as `25764ea`.)

2. **SB1 full-corpus restart** — the resume-patched `scripts/audit-d-llm-judge.mjs` against the N=2128 sample (`.audit-working/audit-d-sub-batch-1/full-corpus-sample.json`), launched in background with event-driven monitoring (halt signals / $15/$30/$50 cost thresholds / cache warnings / completion / milestone calls #500/#1000/#1500/#2000/#2128). A one-time disk-verification check at ~50 verdicts confirmed the periodic-flush path was writing valid JSON.

3. **Post-run pipeline** — run `scripts/audit-d-postprocess-verdicts.mjs` to apply the SB1.5 architectural fix at scale (flip `category=partial-adjacent` whenever `fix_direction=move-to-correct-video`); surface raw-vs-postprocessed flip stats per domain plus per-type verbatim-retry breakdown; **surface-and-hold** for supervisor review packet.

4. **Stratified spot-check packet** — sample 40 items (15 partial-adjacent / 15 out-of-source / 5 in-source / 5 partial-depth) with a fixed seed for reproducibility; produce supervisor-reviewable JSON + markdown; surface via iconv-clipboard for paste-relay.

5. **Parallel one-liner** — check whether the 15 malformed-JSON-then-recovered errors cluster suspiciously or look random.

## What was done

### Phase 1 — CLAUDE.md Workflow Rule #8 (already shipped this session, commit `25764ea`)

Appended Rule #8 to CLAUDE.md after Rule #7, codifying: any API-spend script running over ~10 minutes of wall-clock must read its existing `--output` on startup, build a done-set keyed by stable content identity (`section|video|type|index`, not array index), skip already-processed items in the main loop, flush periodically (every ~50 items, not just at end), and smoke-test the resume path with a fake-complete output file (0 API calls) before trusting it with real volume. Add the support BEFORE the first big run, not after a sunk-cost incident.

The `audit-d-llm-judge.mjs` codebase is already compliant on the resume patch (`a4a30c3` 2026-05-18). Rule #8 is forward-looking for future API-spend scripts (SC-900 port, embeddings, batch evaluators).

Standalone commit + push per [[feedback_commit_split]] and Aiden's explicit instruction.

### Phase 2 — SB1 full-corpus run

Launched via Bash `run_in_background` with stdout/stderr to `.audit-working/audit-d-sub-batch-1/sb1-run.log`. Armed `Monitor` (persistent, 1h timeout cap raised) on the logfile with a tight grep filter covering: startup confirmation (`Starting LLM`, `RESUME:`), every periodic flush (`flush at N/2128 verdicts; session $X`), halt signals (`HARD CAP`, `RETRY BUDGET`, `Aborting`), cache warning (`WARNING.*cache hit rate`), completion (`^Done\.`, `Cumulative cost`, `Cache hit rate`), per-item errors (`→ ERROR`), and the milestone calls Aiden listed (`\[500\] §`, `\[1000\] §`, `\[1500\] §`, `\[2000\] §`, `\[2128\] §`). Crash signatures included (`Traceback`, `Killed`, `^!!`).

**Per-50-verdict flush disk verification (~5 min into the run):** when the `[flush at 50/2128 verdicts; session $0.7457]` event landed, I read `full-corpus-verdicts.json` directly: 140 KB, parses cleanly, `verdicts.length === 50` exactly, `cumulative_cost_usd: 0.7457` matches the flush log, `items_skipped_already_done: 0` (cold start as expected). I additionally re-checked the resume-shape invariant — verdicts store location nested as `v.location`, sample items are flat `{section,video,type,index}`, both produce the same `section|video|type|index` set key (script lines 269/278/332). A halt-and-restart would correctly skip these 50.

**Mid-run observations:**
- Per-verdict cost normalised to ~$0.012 after a transient $0.018 spike at flush #400-450 (corpus heterogeneity, not regression).
- Cache hit rate reached 100% after the first call and held there for the full run (perfect cache behaviour).
- The `[500] §` milestone line was *skipped* (filter never matched) because one verbatim retry had already fired by then, pushing `totalCalls` past exact 500 without a verdict landing at that count. I diagnosed this from the log (call #500 was the first attempt of §2.2.1 scen[1] which retried; success line then jumped from `[499]` to `[501]`). The flush events at the same verdict counts proved to be the reliable milestone signal — they fire one-per-50 with no retry skew.
- Two mid-run sitreps were produced on request (calls/cost/flush state/errors/retry-rate/ETA), each from a parallel Node script that read the live verdicts file + log tail.

**Cost trip at $15:** when flush #1250 landed at $15.35, surfaced as the first designated alarm. Projection at that point remained ~$26 total — well under $30 mid. The $30 and $50 alarms never fired.

**Completion (T+~3h):** 2,492 API calls (2,128 verdicts + 364 verbatim retries) / $25.9170 / 100.0% cache hit rate on calls after first (2,491/2,491) / 15 errors this session.

The "15 errors" required a moment's investigation: the script's `Done.` line conflates failed *rounds* with failed *items*. Inspection of `errors.json` showed all 15 are `malformed-json` failures on `round=0` — and cross-referencing against `verdicts.json` confirmed all 15 error locations have recovered verdicts on disk (the retry path produced clean JSON on round=1). **Net data loss: zero.** All 2,128 sample items have a valid verdict with category / confidence / fix_direction / justification_quote / justification_explanation.

### Phase 3 — Postprocess (412 flips)

`scripts/audit-d-postprocess-verdicts.mjs` hardcodes `PREFLIGHT_DIR = ".audit-working/audit-d-sub-batch-1-preflight"` on line 62 and resolves `--input` / `--output` relative to it on lines 80-81. This is a leftover from the SB1 pre-flight micro-recal convention. Worked around by passing paths relative to that base:

```
node scripts/audit-d-postprocess-verdicts.mjs \
  --input  ../audit-d-sub-batch-1/full-corpus-verdicts.json \
  --output ../audit-d-sub-batch-1/full-corpus-verdicts-postprocessed.json
```

Filed as a non-blocking follow-up; ~5-min cleanup if the script will be reused on future audit dirs (SC-900 port etc.). Did not patch in this session per [[feedback_commit_split]] — would have constituted scope drift in the middle of an Audit D execution session.

**Result: 412 flips of 2,128 verdicts (19.4%)**, all from various categories → `partial-adjacent`. Breakdown:
- 406 flipped from `out-of-source` → `partial-adjacent`
- 6 flipped from `partial-depth` → `partial-adjacent`

**Per-domain flip rates:**

| domain | flips | n | rate |
|---|---|---|---|
| 1 | 38 | 381 | 10.0% |
| 2 | 191 | 612 | **31.2%** (driver) |
| 3 | 69 | 311 | 22.2% |
| 4 | 81 | 490 | 16.5% |
| 5 | 33 | 334 | 9.9% |
| **TOTAL** | **412** | **2,128** | **19.4%** |

Domain 2's dominance is the cleanest signal in the data: threats/vulnerabilities naturally span multiple §2.x videos, so wrong-video citations are common but rescue-able. Domain 5's low flip rate plus a relatively high residual `out-of-source` rate (20.7% post-flip) means Domain 5's `out-of-source` items are more often *genuinely* not in any Messer video, rather than mis-cited — that's the partial-depth/coverage gap, not a citation problem. This matches the project's known Domain 5 under-weighting (CLAUDE.md: 12.4% current vs 20% target).

**Total category distribution, raw → postprocessed:**

| category | raw | postprocessed | delta |
|---|---|---|---|
| in-source | 1,006 (47.3%) | 1,006 (47.3%) | +0 |
| partial-adjacent | 12 (0.6%) | 424 (19.9%) | **+412** |
| partial-depth | 405 (19.0%) | 399 (18.8%) | -6 |
| out-of-source | 702 (33.0%) | 296 (13.9%) | **-406** |
| not-in-objective | 0 | 0 | +0 |
| ambiguous | 0 | 0 | +0 |

The catalogue's grounding profile is materially healthier post-flip: 47.3% in-source + 19.9% rescue-able partial-adjacent + 18.8% partial-depth (cover-but-not-deep-enough) = **86.0% covered in some form by Messer**. The residual 13.9% out-of-source is the catalogue's actual grounding-gap, not the inflated 33% the raw category labels suggested.

**Per-type verbatim-retry rate (Aiden's addition to the surface):**

| type | total | retried | retry-rate |
|---|---|---|---|
| mc | 532 | 94 | 17.7% |
| scen | 345 | 105 | **30.4%** (driver) |
| match | 580 | 69 | 11.9% |
| cram | 671 | 96 | 14.3% |
| **TOTAL** | **2,128** | **364** | **17.1%** |

This explains the gap from iter0 micro-recal's 8.3% paraphrase rate: scenarios drive the rate up. Iter0 was 12 items skewed toward mc/match; the full corpus includes 345 scenarios which are long, multi-paragraph prose where the LLM tends to paraphrase rather than verbatim-quote, triggering the rewrite-and-retry path 30.4% of the time. The conclusion: this is signal about *corpus shape* (scenarios behave differently), not about *scale* (model regression). The retry path is doing its job — every retried item carries a verbatim quote in its final verdict.

**Confidence distribution (postprocessed):** 96.5% high, 3.5% medium, 0% low. Per Audit D iter1 findings, confidence calibration is essentially a one-bucket signal at the current prompt design. Accepted as a limitation.

### Phase 4 — Surface-and-hold review block

Wrote `/tmp/sb1-surface.txt` (177 lines, 8.9 KB) covering: cost+cache, raw-vs-postprocessed totals, per-domain category distribution, flips per domain, per-type retry rate, confidence distribution, errors detail (with affected locations enumerated), cost+credit accounting, and an explicit "holding state" footer listing what was deferred and the next-step options for Aiden's decision.

Piped to clipboard via `iconv -f UTF-8 -t UTF-16LE /tmp/sb1-surface.txt | clip.exe` per [[feedback_review_docs_to_clipboard]]. Aiden's response was the pre-completion gate sign-off: run healthy, headline finding (412 flips validating the SB1.5 architectural fix at scale) was exactly what we hoped to see. Authorized proceeding to the spot-check packet; explicit instruction NOT to proceed to remediation or Report-#0005 yet.

### Phase 5 — Stratified spot-check packet (40 items)

Wrote `.audit-working/audit-d-sub-batch-1/build-spotcheck-packet.mjs` (single-purpose generator, ~140 lines). Implementation choices:
- **Seeded RNG:** mulberry32 with `SEED = 20260519` (YYYYMMDD), documented in the packet metadata so the same 40 items can be re-derived on demand.
- **Stratified sampling:** 15 partial-adjacent (from 424 candidates), 15 out-of-source (from 296), 5 in-source (from 1,006), 5 partial-depth (from 399). Sample-without-replacement within each stratum.
- **Transcript-path resolution:** `.messer-transcripts/_fetch-status.json` maps Messer video titles to slug-based filenames. Strip leading "N.M -" prefix, look up title, get slug, construct `${slug}.txt`.
- **Type-aware item rendering:** mc/scen emit stem + 4 options + key + explanation; match emits `prompt` ↔ `answer` (NOT `left`/`right` — that was the first generator bug); cram emits `term` + `def`. Each type's verdict carries the same supervisor-review checkbox tail.
- **Per-item citation lookup:** mc/scen items carry their own `messerVideo` field; match/cram items do not — for those, the script falls back to the parent video's `title` from `questions.json` (looked up by `location.video` id). This was the second generator bug to fix; v1 originally treated all items as carrying citation, producing `(none)` placeholders for match/cram.

Both bugs caught by a sanity-scan of the rendered markdown before clipboard surface — first row revealed `?` placeholders for the match item, and `Cited Messer video: (none)` for items that demonstrably had been judged against a real transcript.

**Packet outputs:**
- `.audit-working/audit-d-sub-batch-1/spotcheck-packet-v1.json` (112 KB — machine-readable)
- `.audit-working/audit-d-sub-batch-1/spotcheck-packet-v1.md` (78 KB / 1,612 lines — supervisor review form)

Each row carries: location, parent video title (or item-level citation if present), transcript path, item text (type-aware), LLM verdict block (category / confidence / fix_direction / justification_quote / justification_explanation), postprocess-flip provenance and retry flag where applicable, and a supervisor-review checkbox block.

For partial-adjacent items the proposed destination video is not a discrete field on the verdict — the LLM embeds the recommendation in `justification_explanation` prose (e.g., *"The correct video is likely '4.2 - Intrusion Prevention' or '4.4 - Security Monitoring'"*). Supervisor parses from prose. This is acceptable signal but is a candidate for prompt extension in future audit work if scale of remediation justifies it.

Surfaced to clipboard via iconv-UTF-16LE per protocol.

### Phase 6 — Malformed-JSON error cluster (parallel one-liner)

Output emitted alongside the packet generator:

> N=15 (all malformed-JSON, round=0); by-type {"mc":1,"cram":3,"match":10,"scen":1}; by-domain {"1":4,"2":3,"3":4,"4":4}; videos-with-multiple-errors [["3.4.4",2],["4.3.1",2]]

**Read:** weak clustering by video (only 2 videos repeated, 11 distinct), strong clustering by type — match items are 27% of corpus but 67% of errors, a ~5x enrichment. Most likely cause: match items produce shorter LLM responses (`{prompt, answer}` → short JSON output), creating a different JSON-formatting failure mode than longer prose responses. Domain 5 entirely clean.

Not random, not catastrophic, not blocking. Worth noting if a future audit script reuses this pipeline (filter for malformed responses on short-output item types more aggressively).

### Phase 7 — Supervisor verdicts + sign-off

Aiden relayed supervisor-Claude's review of the 40-item packet:

**PASS at threshold. 30/40 strict agreement (75%) — matches SB0 calibration's 76.7%.** Methodology validated at scale; no catastrophic finding.

**Per-stratum breakdown:**

1. **Partial-adjacent (15 sampled):** 10 confident-agree, 5 uncertain pending transcript verification, 0 disagree. The 412 partial-adjacent flips at scale look sound.
2. **Out-of-source (15 sampled):** 10 confident-agree, 3 likely-disagree (items #19 avalanche, #20 dual power feeds, #26 tokenization — all same failure mode), 2 uncertain.
3. **In-source (5 sampled):** 5/5 agree. No false-positive grounding claims.
4. **Partial-depth (5 sampled):** 5/5 agree when applied; concern is under-application not mis-application.

**Methodological findings (supervisor):**

5. **Partial-depth is systematically under-applied.** Items getting tagged out-of-source when they should be partial-depth share the pattern *"specific term/framing not in transcript but underlying concept clearly is."* Same architectural shape as the SB1.5 fix; candidate for an **SB1.6 post-process refinement** that catches `out-of-source` verdicts with `fix_direction=rewrite-to-source` AND justification-prose markers indicating "concept-is-here-but-not-this-exact-term." Same structural pattern as SB1.5 (`out-of-source` + `fix_direction=move-to-correct-video` → `partial-adjacent`); the script ought to extend cleanly.

6. **Safety-net observation:** `fix_direction` action mapping bounds the cost of category error. `mark-for-Sybex-arbitration` routes through Aiden; nothing auto-destroys content. This means a category mis-classification cannot directly produce a destructive remediation action even if it survives the post-process — the human review gate is structurally upstream of any item modification.

**Items Aiden may want to manually transcript-check (~15 min total):** #4 (C2 in malware overview), #7 (Impact in risk mgmt), #11/#13 (MAC filtering in port security), #14 (cryptominer), #15 (secure boot), #22 (hardware supply chain), #28 (privacy by design).

These are items where the supervisor was uncertain pending transcript verification — Aiden's direct read of the relevant Messer transcripts will resolve them faster than another LLM-mediated round.

## Files changed

In this report's session (excluding the CLAUDE.md Rule #8 commit which already shipped earlier):

- `Reports/Report-#0005.md` (this file).
- `PLAN.md` — Task 1f row updated (SB1 SHIPPED 2026-05-19), SB1 paragraph rewritten to reflect completion (verdicts/cost/postprocess/spot-check PASS), SB1.6 candidate added as a deferred follow-up.
- `docs/supervisor-handoff.md` — "Current state" + "Sub-batch 1 full-corpus" + "Budget state" sections updated; old "ATTEMPTED-AND-HALTED" paragraph replaced with completion record.
- `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts.json` (5.6 MB — 2,128 verdicts; not committed to git, lives in `.audit-working/` per convention).
- `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-postprocessed.json` (412 flips applied; not committed).
- `.audit-working/audit-d-sub-batch-1/errors.json` (15 round-0 malformed-JSON; not committed).
- `.audit-working/audit-d-sub-batch-1/sb1-run.log` (process log; not committed).
- `.audit-working/audit-d-sub-batch-1/postprocess.log` (postprocess summary; not committed).
- `.audit-working/audit-d-sub-batch-1/spotcheck-packet-v1.{json,md}` (review packet; not committed — supervisor-review state, not source-of-truth).
- `.audit-working/audit-d-sub-batch-1/build-spotcheck-packet.mjs` (single-purpose generator; not committed — same justification as the rest of `.audit-working/`).

The three pre-existing untracked `docs/` files (cancel-feature-shipped, task2-2b-end-of-session, task2-sub-batch-2c-shipped) were left alone per the prior session's "left untracked per Audit D scoping D-J" convention.

## Commits made this session

1. **`25764ea`** — `docs: CLAUDE.md Workflow Rule #8 — resume support for long-running API scripts` (pushed earlier in session).
2. **(this report)** — `Reports/Report-#0005.md` standalone per CLAUDE.md Workflow Rule #7 + [[feedback_commit_split]].
3. **(docs follow-up)** — `PLAN.md` + `docs/supervisor-handoff.md` together as a single docs commit.

Both 2 and 3 pushed to origin/main at session close.

## Decisions reached + boundaries honored

- **Pre-launch gate honored:** surfaced launch checklist (script/input/output/smoke-test status/budget/HARD_CAP/projection) and held for explicit "GO" before starting the API loop. Aiden authorized launch with background mode + quiet event-driven monitoring + one-time ~50-verdict flush-path check.
- **Pre-completion gate honored:** surfaced the full result block (cost/cache/category dist/per-domain flips/per-type retries/errors) to clipboard for supervisor review BEFORE running postprocess or building any remediation. Aiden authorized proceeding to the spot-check packet.
- **Post-spot-check gate honored:** surfaced the 40-item packet to clipboard for supervisor-Claude paste-relay; explicitly did NOT proceed to remediation or to drafting this report until supervisor sign-off landed.
- **No destructive action:** no items modified, no categories overwritten in `questions.json`, no remediation patches generated. All `.audit-working/` outputs are read-only artefacts of the audit pipeline.
- **Memory hygiene:** the `[[project_task1a_done]]` memory entry currently records "SB1 full-corpus attempted-and-halted 2026-05-18" — being updated inline at session close to reflect completion, so tomorrow's session starts with accurate state rather than stale narrative.

## What's next

**Aiden's authorised next steps (no further work in this session):**

1. Aiden reads Report-#0005 in his own time.
2. Aiden decides remediation ordering — which category (partial-adjacent rescue / out-of-source drop-or-rewrite / partial-depth augment) and which domain to tackle first.
3. Aiden optionally runs the ~15-minute transcript spot-check on items #4/#7/#11/#13/#14/#15/#22/#28 to resolve supervisor uncertainty.
4. After Aiden's decision, the next session can scope SB1.6 (post-process refinement) and/or the first remediation sub-batch.

**SB1.6 candidate (deferred, captured in PLAN.md):** post-process refinement to catch `out-of-source`-that-should-be-`partial-depth` on `fix_direction=rewrite-to-source` + justification-prose markers (e.g., *"concept is taught but the specific term/framing the item tests is not in this video"*). Structural mirror of SB1.5's `out-of-source` → `partial-adjacent` flip rule; ought to extend the same script with a second flip predicate.

**Known non-blocking awkwardness (not in scope for this session):** `scripts/audit-d-postprocess-verdicts.mjs` hardcodes `PREFLIGHT_DIR` (line 62) and resolves `--input`/`--output` relative to it (lines 80-81). Used `../audit-d-sub-batch-1/...` workaround today. ~5-min cleanup the next time the script is touched.

**Tasks that remain deferred behind Audit D closure** (carried over from prior sessions, unchanged):
- Task 2 Sub-batches 3 (saved presets), 4 (Flashcards SM-2), 5 (cleanup).
- Task 3 PBQ system + exam simulation.
- 5 metacognitive features (re-evaluate after Task 2 closes + 3-5 study sessions).
- Matching UX polish (topic-name visibility, progress bar).
- 4 remaining Section 1 content fixes in `TODO-content-quality.md`.

## Budget state

| | |
|---|---|
| Audit D credit at session start | $45.00 |
| Spent this session (SB1 full-corpus) | $25.9170 |
| **Audit D credit remaining** | **$19.08** |
| Cumulative Audit D spend | $34.63 ($1.29 prior + $7.42 SB1 halt sunk + $25.92 SB1 completion) |
| vs SB1 pre-flight projection | mid $30 → actual $25.92 → **UNDER MID** |

API spend trajectory is healthy. $19.08 covers any SB1.6 post-process refinement (script change, ~$0 LLM cost), modest re-runs if remediation requires a verification batch, and likely the first remediation sub-batch's verification pass. A budget top-up will be needed before any sub-batch that re-runs the LLM-as-judge over the full corpus.

## Session-close hygiene

- All 5 launch-cycle tasks closed (`TaskCreate` 1-5 from launch phase).
- All 5 closeout tasks closed at session end (`TaskCreate` 6-12, including this report).
- Monitor `b6loxmuzy` auto-ended at log-tail close (not manually stopped — `TaskStop` reported it already gone).
- Memory updated inline: `[[project_task1a_done]]` reflects SB1 SHIPPED, [[reference_jsonl_recovery]] still valid, [[feedback_resume_first_design]] vindicated by today's clean run on the patched script.
- Two commits pushed to origin/main (this report + docs follow-up).

No further work tonight. Tomorrow Aiden reads this report and decides the remediation order.
