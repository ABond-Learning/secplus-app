# Report-#0002 — Audit D Sub-Batch 0: Calibration Tooling + 30-Item Run

Session date: 2026-05-13
Session type: Tooling build + calibration execution + closure
Branch: main
Starting commit: 4636ac2 (Reports/ workflow + Report-#0001)
Closure commit: this commit (Sub-batch 0 ship)

## What was asked

Execute Audit D Sub-batch 0 per the scoping doc (`docs/audit-d-scoping.md`):
build the keyword pre-screen + LLM-as-judge pipeline, run it on a
30-item calibration sample including the §2.3.3 mutex / atomic
ground-truth, gate on the smoke test, surface artifacts to a
blind second reader, ingest second-reader verdicts, compute
agreement, decide Sub-batch 1 trigger.

Eight design decisions (S1-S10 from the orientation phase)
arrived signed off with two modifications: S-R3 mandatory (LLM
prompt cannot reference keyword stage results) and S-R4 promoted
to mandatory (blind reviewer cannot see LLM output before
committing their own verdicts).

Mid-sub-batch revision: the calibration blind reviewer is
**supervisor-Claude** (separate Claude.ai conversation), not
Aiden. Two independent LLM readers measuring agreement is the
methodology check. Aiden's role for Sub-batches 1+ as the human
arbiter on HIGH flags remains unchanged.

Boundaries: read-only on `questions.json` (verdict-as-data only);
no commits until Sub-batch 0 closes; cost cap $5; hard request
cap 100; halt before producing reviewer artifacts if the smoke
test fails.

## What was done

### Phase 1 — Orientation (pre-execution)

Inventoried preconditions: working tree clean, build passes,
.env present and gitignored, `ANTHROPIC_API_KEY` available
(provided by Aiden). `@anthropic-ai/sdk` not installed but
approved as devDep. Surfaced 10 design decisions (S1-S10) and
held for sign-off. Orientation doc at
`/tmp/audit-d-sub-batch-0-orientation.txt` (686 lines, piped to
clipboard via iconv).

### Phase 2 — Build (post sign-off)

Installed `@anthropic-ai/sdk` as devDependency (9 packages, 0
vulnerabilities). Authored four scripts plus a follow-on ingest
script after the supervisor-Claude pivot:

| Script | Lines | Purpose |
|---|---:|---|
| `scripts/audit-d-sample.mjs` | ~115 | Seeded sample selection (Mulberry32 PRNG, seed `20260513`) |
| `scripts/audit-d-keyword-screen.mjs` | ~190 | Stage 1: keyword pre-screen with SYNONYMS reuse |
| `scripts/audit-d-llm-judge.mjs` | ~215 | Stage 2: per-item LLM-as-judge with cost guardrails |
| `scripts/audit-d-build-review.mjs` | ~240 | Smoke gate + supervisor-Claude review packet builder |
| `scripts/audit-d-ingest-supervisor.mjs` | ~135 | Ingest supervisor JSON + compute agreement metrics |

S-R3 invariant honored: the `SYSTEM_PROMPT` in `audit-d-llm-judge.mjs`
makes zero reference to keyword stage results or term-presence.
S-R4 invariant honored: the supervisor-Claude review packet
contains zero script verdicts and zero keyword screen results.

### Phase 3 — Run

Sample selection produced 30 items: 4 smoke (§2.3.3 mutex+atomic
in match+cram) + 26 stratified-random across 5 domains × 4 types
(5 MC / 5 scen / 11 match / 9 cram — D2 slightly overweight
matching corpus distribution).

Stage 1 keyword screen: **16 term-absent / 4 term-present / 10
skipped** (MC + scen skipped per S3). All 4 smoke items flagged
`term-absent` ✓.

Stage 2 LLM-as-judge: **30 calls, $0.3207 total, 0 errors, 0
retries triggered**. Hard cap never approached. All 4 smoke
items returned `out-of-source / high` ✓. Distribution: 13
in-source / 13 out-of-source / 4 partial-depth / 0 partial-
adjacent / 0 out-of-syllabus / 0 ambiguous-call; 30/30 high
confidence; 8 quote-not-verbatim structural flags.

### Phase 4 — Surface for blind review

Smoke gate passed. Produced
`.audit-working/audit-d-calibration/aiden-review-blind.csv`
initially, then **revised mid-sub-batch** per Aiden's correction:
the calibration blind reviewer is supervisor-Claude, not Aiden.

Pivot work:
- Modified `scripts/audit-d-build-review.mjs` to produce a
  markdown packet instead of a CSV. Packet shape: per item —
  row id, domain, section, video, type, item subject/body,
  citation, and the full cited Messer transcript inline. Header
  contains task description, source-authority hierarchy,
  6-way schema, category + fix-direction + quote rules, and
  output format spec (single JSON array).
- Deleted the stale `aiden-review-blind.csv`.
- Updated `docs/audit-d-scoping.md` with a "Revision 2026-05-13"
  section documenting the role shift and noting Sub-batches 1+
  arbitration remains Aiden's.
- Updated `PLAN.md` Task 1f with a mid-sub-batch revision note.

Final packet: 252 KB, 1,786 lines. Verified zero leaks of script
verdicts or keyword results past the schema definition section.
Status doc piped to clipboard.

### Phase 5 — Ingest + analyze

Aiden ran supervisor-Claude in a separate Claude.ai conversation,
returned the JSON array of 30 verdicts, pasted back. Distribution:
13 in-source / 6 partial-depth / 3 partial-adjacent / 8 out-of-
source / 0 out-of-syllabus / 0 ambiguous-call; ~70% high / ~30%
medium / 0% low confidence.

Saved supervisor JSON to `.audit-working/audit-d-calibration/
supervisor-verdicts.json` and ran `audit-d-ingest-supervisor.mjs`:

- **Strict 6-way agreement: 23/30 = 76.7%** (below 85% threshold)
- **Collapsed agreement: 26/30 = 86.7%** (above 85% threshold)
  (Collapse rule: partial-adjacent ≡ out-of-source as
   "not-in-transcript"; partial-depth kept separate from
   in-source.)

Per Aiden's spec, this pattern (strict <85%, collapsed ≥85%)
supports the **"prompt tuning needed but methodology sound"**
interpretation. 7 strict mismatches: 3 collapsed-OK (script
defaulted to `out-of-source` where `partial-adjacent` was more
accurate); 4 true mismatches (3 of which involve `partial-depth`
— a category the script under-uses).

### Phase 6 — Closure

Produced `docs/audit-d-calibration-summary.md` (the canonical
sub-batch outcome doc) and this `Reports/Report-#0002.md`.
Updated `PLAN.md` Task 1f with the Sub-batch 0 closure status.

## Files changed

### New (committed)

| Path | Purpose |
|---|---|
| `scripts/audit-d-sample.mjs` | Stage 0 |
| `scripts/audit-d-keyword-screen.mjs` | Stage 1 |
| `scripts/audit-d-llm-judge.mjs` | Stage 2 |
| `scripts/audit-d-build-review.mjs` | Smoke gate + packet |
| `scripts/audit-d-ingest-supervisor.mjs` | Supervisor ingest + agreement |
| `docs/audit-d-calibration-summary.md` | Canonical Sub-batch 0 outcome |
| `Reports/Report-#0002.md` | This file |

### Modified (committed)

| Path | Change |
|---|---|
| `package.json` | `@anthropic-ai/sdk` devDep added |
| `package-lock.json` | lockfile update for SDK + 8 transitive deps |
| `docs/audit-d-scoping.md` | Added "Revision 2026-05-13" section (calibration reviewer is supervisor-Claude) |
| `PLAN.md` | Task 1f mid-sub-batch revision note + Sub-batch 0 closure status |

### Not committed (gitignored, kept on disk)

In `.audit-working/audit-d-calibration/`:
`sample-selection.json`, `keyword-screen-results.json`,
`llm-verdicts.json`, `supervisor-claude-review-packet.md`,
`supervisor-verdicts.json`, `unblinded-comparison.csv`,
`agreement-metrics.json`, `calibration-status.txt`.

## Decisions reached

1. **Sub-batch 0 PASSES on the collapsed agreement metric.**
   Methodology is sound enough to proceed to Sub-batch 1.
2. **Prompt tuning is required before Sub-batch 1 scope expansion.**
   The script's prompt biases toward `out-of-source` when
   `partial-adjacent` would be more accurate, and under-uses
   `partial-depth` for the "concept-named-but-shallow" pattern.
   Specific tuning targets and prompt edits documented in
   `docs/audit-d-calibration-summary.md` §"Prompt-tuning
   recommendations".
3. **Micro-recalibration gate.** Before full Sub-batch 1
   execution: tune prompt, run on a fresh ~10-item seeded
   sample, check that the category distribution moves closer
   to supervisor-Claude's profile, get Aiden sign-off.
4. **Broader-scope decision deferred.** Whether Sub-batches 1+
   expand from match+cram-only to match+cram+MC+scen is held
   until tuned-prompt recalibration. 4 MC/scen items in the
   calibration sample were flagged not-in-cited-transcript by
   both readers, suggesting the April 27 cleanness no longer
   fully holds under LLM judgment.

## Boundaries honored

- ✓ No `questions.json` changes.
- ✓ All Sub-batch 0 work staged as a single commit (this commit).
- ✓ Cost cap: $0.32 of $5 free credit; hard request cap 100,
  actual 30.
- ✓ S-R3: keyword stage results never in LLM context (verified by
  reading the `SYSTEM_PROMPT`).
- ✓ S-R4: blind-pass invariant extended to supervisor-Claude;
  packet contains zero script verdicts and zero keyword screen
  results.
- ✓ No Sub-batch 1+ work.
- ✓ Reports/Report-#0002.md produced per CLAUDE.md Workflow Rule #7.

## What's next

Sub-batch 1 pre-flight, in order:

1. **Prompt tuning** of `scripts/audit-d-llm-judge.mjs`
   `SYSTEM_PROMPT` per the four recommendations in
   `docs/audit-d-calibration-summary.md` §"Prompt-tuning
   recommendations".
2. **Micro-recalibration**: ~10-item fresh seeded sample with
   the tuned prompt; expected cost ~$0.10. Check category
   distribution moves toward supervisor-Claude's profile
   (`partial-adjacent` ≥ 1, `partial-depth` ≥ 2, `out-of-source`
   ≤ ~30% of sample, mixed confidence levels).
3. **Aiden sign-off** on the tuned prompt + micro-recalibration
   outcome.
4. **Scope decision**: match+cram only (default per D2) vs
   match+cram+MC+scen (if tuned recalibration confirms MC/scen
   misfiles).
5. **Sub-batch 1 execution**: full corpus LLM-as-judge run.
   Estimated cost $15-25 on match+cram only; ~$35-50 if MC+scen
   added.

R7 (audit-study collision) Strategy A vs Strategy B decision
remains deferred until Sub-batch 1 verdict-as-data lands.

Task 2 Sub-batches 3-5 stay deferred behind Audit D per D5.
