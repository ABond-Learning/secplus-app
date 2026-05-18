# Report-#0004 — Matching study-signal bug fix + Audit D Sub-batch 1.5

Session date: 2026-05-18
Session type: Bug fix (study-blocking) + Audit D structural post-process
Branch: main
Starting commit: 64fb747 (PLAN.md: sync with Audit D Sub-batch 1 pre-flight closure)
Ending commit: becaac9 (PLAN.md: pin SB1.5 commit hash)
Commits this session (in order): 6de15b9, eb6009e, a26d42c, becaac9.

## What was asked

Aiden surfaced three findings from weekend study with the post-Sub-batch-2C app:

(a) UX observation — matching items display section/video name during the running quiz rather than masking like MC/scen. Probably intended UX; track as polish.
(b) Real UX bug — no progress bar on matching items during mixed quizzes. Track as polish.
(c) Real study-blocking bug — yesterday morning a 50-item mixed quiz with preferUnseen filter pooled to 28 matching items only (no MC/scen pulled). After completion:
  - Quiz showed 0% / 0/0 correct
  - "28 unseen" count on Progress did NOT decrement
  - Items the user clearly recognised were being served as "unseen"

Revised plan for the session:
1. PHASE 1: Investigate and fix (c) read-only first, surface findings, then fix in a standalone commit. Cannot wait through Audit D execution duration (~2 weeks) with this corrupting study state.
2. PHASE 2: Sub-batch 1.5 post-process per the SB1 pre-flight closure plan.
3. PHASE 3: (a) and (b) tracked in PLAN.md as polish items.

Three separate commits, separation of concerns. Phone verification gate between commit 1 and commit 2/3. Single Report-#0004 covers the whole morning.

## What was done

### Phase 1 — Read-only investigation of (c)

Traced match-key write/read paths, preferUnseen filter logic, finishQuiz path, and regression-vs-pre-existing status via git history. Identified three pre-existing bugs (all dating to project init `625589b`) collapsed into the one symptom:

1. `src/secplus-quiz.jsx:862` — `newToPractice` count checks the legacy single-record key `match-{videoId}` which is no longer written. Per-pair writes go to `match-{videoId}-{pairIdx}` (line 41 `matchKey`, write at line 1422). So every matching-bearing video permanently contributes +1 to newToPractice regardless of practice history.
2. `src/study/buildPool.js` — `preferUnseen`, `dueOnly`, and `belowAccuracy` filters all had `if (item.type === "matching") return true` shortcuts. Matching items unconditionally bypass every SM-2 filter, so preferUnseen serves them even after practice (read/aggregate side; per-pair records ARE written correctly).
3. `src/secplus-quiz.jsx:1567-1578` — `finishQuiz` only counts `q.type === "mc"` toward score. Scenarios count (they're tagged `type:"mc"` + `isScenario:true`); matching items silently add nothing to numerator or denominator. For a matching-only pool: `total=0`, `correct=0` → result screen shows 0/0, history row gets 0/1.

Confirmed not a Sub-batch 2C regression by inspecting the 5ed2cbe diff — that commit only cleaned up legacy shims and did not touch matching paths.

Findings surfaced to Aiden as a structured chat report with four sub-decision questions (newToPractice unit, finishQuiz scoring semantic, filter-fix scope, polluted-history-row handling). Aiden approved all four recommendations as proposed.

### Phase 2 — Bug fix implementation (commit `6de15b9`)

Three surgical edits in one commit, framed as USER-VISIBLE BEHAVIOR CHANGE per Aiden's request (mirrors the Sub-batch 2C commit-message framing):

- ProgressTab `newToPractice` (line 862): now `v.matching.some((_p, pi) => store.sm2[matchKey(v.id, pi)])` — counts a video as unseen iff zero pairs have any record.
- buildPool: all three SM-2 filters (preferUnseen / dueOnly / belowAccuracy) now consult per-pair records:
  - preferUnseen: unseen iff no pair has any record.
  - dueOnly: due iff any pair is due; honours `includeUnseen` when no pair has a record yet.
  - belowAccuracy: include iff any pair meets `minAttempts` AND is below the threshold (Drill Wrong intent = "specific cards you're missing"; for matching the cards are pairs).
- QuizTab `finishQuiz`: new `matchScoresRef` captures per-item `{correct, total}` at `onNext` (synchronous ref write — needed because finishQuiz runs synchronously after `setMatchScores` would have queued a pending state update, and a state setter would still be pending). Reads ref in finishQuiz to aggregate per-pair partial credit. `matchScoresRef.current = {}` on drill-wrong re-arm.

Build: `npm run build` clean (1351.47 kB / 405.41 kB gzip).
Tests: `npm test` 34/34 pass (sync-engine test suite — only test in the project).

### Phase 3 — Phone verification (between commits 1 and 2/3)

Wrote `/tmp/match-fix-verify.txt` with four concrete checks (Progress "new to try" drop / matching-only score real / preferUnseen pool size / Drill Wrong includes struggling pairs) and copied via `iconv -f UTF-8 -t UTF-16LE … | clip.exe` per the established review-docs-to-clipboard convention.

Aiden returned full verification PASS:
- Test 1 (matching included, no preferUnseen): result screen reported correct/total accurately under per-pair partial credit.
- Test 2 ("N new things to try"): dropped from 28 → 0 (all matching blocks have at least one pair practiced).
- Test 3 (preferUnseen rejected all 28 matching items): internally consistent with Test 2.

### Phase 4 — Polish items tracking (commit `eb6009e`)

Added two entries to PLAN.md `Task 2 — tracked polish items` section, dated 2026-05-18 with concrete file:line fix shapes. Bumped `Last updated:` 2026-05-13 → 2026-05-18.

Polish item (a) carries an open design question (anonymise matching topic in study mode but keep visible in any future exam-simulation mode per CompTIA's UI exposing objective context) — flagged for confirmation before flipping.

### Phase 5 — Audit D Sub-batch 1.5 post-process (commit `a26d42c`)

Per the Report-#0003 "What's next" Sub-batch 1.5 spec. Authored `scripts/audit-d-postprocess-verdicts.mjs` (~145 lines incl. comments), idempotent, `--input` / `--output` CLI args, defaults to `microrecal-verdicts.json` and stem-derived output name.

Rule enforced: if `verdict.fix_direction === "move-to-correct-video"` AND `verdict.category !== "partial-adjacent"`, flip category to `"partial-adjacent"` and stamp `post_processed: true`, `post_processed_from`, `post_processed_reason` on the verdict record. Adds `.postprocess` metadata block to the output (rule, source-report reference, script path, timestamp, full flip list with location + role + from-category).

Spot-check on iter0 micro-recal (`microrecal-verdicts-iter0.json` → `microrecal-verdicts-iter0-postprocessed.json`):
- 3 flips, all subset-1-disagree rows:
  - §2.3.10 mc[0] shared-responsibility: out-of-source → partial-adjacent
  - §3.3.3 match[0] (data source/output): out-of-source → partial-adjacent
  - §4.8.2 match[3] (incident response): out-of-source → partial-adjacent
- Matches the predicted rows 10, 19, 24 from Report-#0003.

Spot-check on iter0 regression sample (`regression-verdicts-iter0.json` → `regression-verdicts-iter0-postprocessed.json`):
- 2 additional flips:
  - §2.3.9 match[2] "Bare metal hardware (no host OS)": out-of-source → partial-adjacent
  - §2.3.2 cram[2] "Integer overflow": out-of-source → partial-adjacent
- Both verdicts had iter0 prose explicitly stating the concept "belongs in a different Messer video" / "likely belongs in a different vulnerability-types video" — i.e. they reasoned in partial-adjacent terms but stamped out-of-source. Reads as SB0-supervisor-too-conservative on those rows, not script error.
- Smoke-test invariant (§2.3.3 mutex/atomic) HELD: those items had fix_direction != move-to-correct-video in iter0 so postprocess correctly left them as out-of-source.

Metrics re-computed via existing `audit-d-microrecal-metrics.mjs` and `audit-d-regression-metrics.mjs` (no script changes needed — they already accept a `--verdicts` flag).

PLAN.md updated to mark SB1.5 as SHIPPED 2026-05-18 `a26d42c` and pivot the next-step text from "SB1.5 (next session)" to "SB1 full corpus (next Audit D session, after Aiden sign-off on SB1.5 results)". A tiny follow-up commit `becaac9` replaced the TBD-commit placeholder once the actual hash was known.

## Metrics

### Bug fix (commit 6de15b9)

| Path | Diff | Notes |
|---|---|---|
| `src/secplus-quiz.jsx` | +22 / -3 | newToPractice + matchScoresRef + finishQuiz |
| `src/study/buildPool.js` | +32 / -3 | Three SM-2 filters now consult per-pair records |

Build size: 1351.47 kB / 405.41 kB gzip (+1.22 kB / +0.09% over pre-fix baseline).

### Audit D SB1.5 — iter0 metrics, raw vs postprocessed

| Metric | iter0 raw | iter0 postprocessed | Threshold | Status |
|---|---|---|---|---|
| Subset 1 strict (D-H excluded) | 3/6 = 50% | **6/6 = 100%** | ≥5/6 | ✓ |
| Subset 1 collapsed | 6/6 = 100% | 6/6 = 100% | (info) | ✓ |
| Subset 2 strict | 3/5 = 60% | 3/5 = 60% (unchanged) | ≥3/5 | ✓ |
| Subset 2 collapsed | 3/5 = 60% | 3/5 = 60% (unchanged) | ≥4/5 | ✗ |
| Combined strict (11 items) | 6/11 = 54.5% | 9/11 = 81.8% | (info) | — |
| Combined collapsed | 9/11 = 81.8% | 9/11 = 81.8% | (info) | — |
| Internally inconsistent verdicts | 3 | **0** | (info) | ✓ |
| Paraphrase rate | 8.3% | 8.3% | <10% | ✓ |
| Cache hit rate | 100% | 100% | ≥90% | ✓ |

Subset 2 collapsed remains FAIL — that's the two residuals Report-#0003 predicted would not be reachable by post-process (HMAC + CCPA, neither had fix_direction=move-to-correct-video). Both will require either Aiden review or a different intervention.

### Audit D SB1.5 — iter0 regression metrics, raw vs postprocessed

| Metric | iter0 raw | iter0 postprocessed |
|---|---|---|
| Strict regressions (vs SB0 supervisor on 23 items) | 2 | 4 (+2 from postprocess) |
| Collapsed regressions | 0 | 2 |
| Smoke-test invariant (§2.3.3) | HELD | HELD |

The two new "strict regressions" introduced by postprocess (§2.3.9 hypervisor / §2.3.2 integer overflow) are collapsed-OK, and the iter0 prose on each explicitly identifies partial-adjacent reasoning. They read as the post-process surfacing genuine SB0-supervisor conservatism rather than script error. The other two strict regressions (rows 17, 27) are the Rec 2 over-shifts that were already present in iter0 raw.

## Files changed

### New (committed)

| Path | Lines | Purpose |
|---|---:|---|
| `scripts/audit-d-postprocess-verdicts.mjs` | ~145 | SB1.5 post-process: flip category to partial-adjacent on fix_direction=move-to-correct-video |
| `Reports/Report-#0004.md` | this file | Session report |

### Modified (committed)

| Path | Change |
|---|---|
| `src/secplus-quiz.jsx` | newToPractice key fix + matchScoresRef + finishQuiz partial credit + drill-wrong reset |
| `src/study/buildPool.js` | preferUnseen / dueOnly / belowAccuracy filters consult per-pair match keys |
| `PLAN.md` | Last-updated bump · 2 polish items (matching topic-label leak, matching progress bar) · SB1.5 ship line · next-step pivot to SB1 full corpus |

### Not committed (gitignored)

In `.audit-working/audit-d-sub-batch-1-preflight/`:
- `microrecal-verdicts-iter0-postprocessed.json` — postprocessed iter0 micro-recal verdicts
- `microrecal-metrics-iter0-postprocessed.json` + `microrecal-comparison-iter0-postprocessed.csv`
- `regression-verdicts-iter0-postprocessed.json` — postprocessed iter0 regression verdicts
- `regression-metrics-iter0-postprocessed.json`

## Decisions reached

1. **Three bugs, one symptom, one commit.** All three matching-related read-side bugs were pre-existing (project init `625589b`) and structurally related. Fixing them together in `6de15b9` is correct scope; splitting into three commits would have fragmented the user-visible-change narrative.
2. **Per-pair partial credit for matching scores.** Each pair = 1 to total, +1 if correct. Matches what the per-pair SM-2 records already store and gives a true work-done signal on matching-only quizzes.
3. **newToPractice unit = 1 per matching video.** "Unseen" iff zero pairs practiced. Matches buildPool's per-video item shape so the count and pool stay aligned.
4. **Fix all three filters together.** Same one-line bug pattern in preferUnseen / dueOnly / belowAccuracy. Leaving two broken to "stay narrow" is a foot-gun the user would hit on the next Drill Wrong or Review session that pulled matching.
5. **Leave the polluted 0/1 history row.** Cosmetic only, ages out after 49 more sessions. Building edit-history UI is scope creep.
6. **SB1.5 post-process script ships as-is.** Spot-check confirms predicted behaviour: 3 flips on micro-recal (rows 10, 19, 24), Subset 1 strict 3/6 → 6/6, internally-inconsistent verdicts 3 → 0. Smoke-test invariant HELD on regression sample. The 2 additional flips on the regression sample (rows 13 / 14) are sound per iter0 prose; surfaces SB0-supervisor conservatism rather than script error.
7. **Subset 2 collapsed remains FAIL (3/5) post-postprocess.** Predicted by Report-#0003 — the residuals (HMAC, CCPA) had fix_direction != move-to-correct-video so the postprocess correctly does not touch them. These will require Aiden review during SB1 full-corpus, or a different intervention.

## Boundaries honored

- ✓ Read-only investigation first; no code changes until findings surfaced and four sub-decisions approved.
- ✓ Three separate commits, separated concerns. Bug fix + polish-tracking + SB1.5 script never mixed.
- ✓ Bug fix verified on device (phone, full PASS on all three tests) before commits 2 and 3.
- ✓ No `questions.json` changes (this session was schema-stable: app code + tracker + script).
- ✓ SM-2 storage keys unchanged: `match-{videoId}-{pairIdx}` writes preserved; the fix is on the read/aggregate side only. No localStorage migration needed.
- ✓ SB1.5 post-process is idempotent and zero-cost (no LLM call). Cumulative Audit D total still ~$1.29 of $53.71 credit.
- ✓ S-R3 and S-R4 Audit D invariants untouched (script reads verdicts → writes verdicts, no prompt mutation, no keyword-screen exposure).
- ✓ Untracked Task 2 docs (`docs/cancel-feature-shipped.md`, `docs/task2-2b-end-of-session.md`, `docs/task2-sub-batch-2c-shipped.md`) left alone per their existing not-tracked state.
- ✓ Reports/Report-#0004.md produced per CLAUDE.md Workflow Rule #7 (single report covering all three commits since they were conceptually linked: study session → bug surfaced → fix → polish tracked → continue Audit D).

## What's next

### Audit D — SB1 full corpus (next Audit D session)

Plan unchanged from Report-#0003 modulo SB1.5 now being a precondition met:

1. Scope decision: match+cram only (1,251 items, $15-25) or +MC+scen (~2,200 items, $35-50). Default match+cram per scoping doc; expand only if SB1.5 micro-recal indicates MC/scen misfile rate is high. Note that SB1.5 ran clean on the mixed sample so the default scope stands.
2. Model decision: stay on sonnet-4-5 or upgrade to sonnet-4-6 / claude-opus-4-7. Prompt is locked in; model change can only help.
3. Bump HARD_CAP from 100 to e.g. 1,500.
4. Run `audit-d-llm-judge.mjs` on the full corpus.
5. Apply `audit-d-postprocess-verdicts.mjs` (this session's deliverable). Generate flip-rate stats vs raw output for transparency.
6. Aiden review of all `move-to-correct-video` verdicts (the post-process target) for spot-check accuracy.
7. Produce Audit D Sub-batch 1 final summary doc; this is the verdict-as-data input for the actual content remediation work.

Probably a 2-3 hour session given full-corpus volume.

### Matching polish items (a) + (b)

Tracked in PLAN.md under `Task 2 — tracked polish items`. Bundle into a small standalone commit between sub-batches or fold into Sub-batch 5 cleanup. Polish item (a) carries an open design question about study-mode vs exam-simulation-mode behaviour — confirm with Aiden before flipping.

### Task 2 Sub-batches 3, 4, 5

Still deferred behind Audit D per the existing D5 ordering decision.

### R7 (audit-study collision) Strategy A vs B

Still deferred until SB1 verdict-as-data lands.

────────────────────────────────────────────────────────────────────

End of Report-#0004.
