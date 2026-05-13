# Audit D — Citation Grounding — Scoping & Agreed Plan

Date: 2026-05-13
Status: scoped; eight decisions signed off; execution pending.
Decision authority: Aiden Bond.

## Trigger

§2.3.3 (Race Conditions) matching set contains:

- "Ensures only one thread accesses resource at a time" → **Mutex**
- "Operation that cannot be interrupted" → **Atomic operation**

Both are CS concurrency primitives. Verified against the
Messer 2.3.3 transcript (`.messer-transcripts/race-conditions-sy0-701.txt`,
fetched 2026-04-26) — the transcript defines race condition and TOCTOU
and uses bank-transfer / Mars rover Spirit / Tesla Pwn2Own examples.
Neither mutex nor atomicity appears. The cram set for the same video
contains the same two terms with the same out-of-source content.

Aiden has confirmed multiple unflagged instances exist beyond this
example. This is wrong-content questions training incorrect knowledge
or testing out-of-syllabus material. Audit D is the structured response.

## Source-material inventory

### Professor Messer transcripts — present, local-only, complete

- Location: `.messer-transcripts/` (gitignored)
- Format: one `.txt` per video, fetched 2026-04-26 via
  `scripts/fetch-messer-transcripts.mjs`
- Coverage: 120 videos in `MESSER_VIDEOS.md` → 120 transcript files
  present (+ 1 extra for the 0.1 intro = 121 files total). 0 missing.
- Fetcher has 4-check verify-or-flag rules (HTTP 200, body > 2000ch,
  entry-content extractable, ≥3 paragraphs after chrome filter and
  ≥1000ch post-filter).

Every cited messerVideo on every MC/scen has a verifiable transcript
locally. Matching/cram items have no per-item citation but inherit
their video's transcript via the parent `video.id`.

### Chapple/Seidl Sybex book — NOT in repo

No PDF, no text, no extract. Physical-only on Aiden's desk. Zero hits
for "sybex"/"chapple" anywhere in `questions.json`. Cannot be used as
automated grounding source; available only as human-arbiter input.

### CompTIA SY0-701 published objectives — NOT in repo as text

`MESSER_VIDEOS.md` is the project's authoritative video list. There
is no parallel "CompTIA objectives text" file in the repo. The
CompTIA PDF lives on Aiden's desk; no automated check against
CompTIA's published text is possible.

### Other authoritative sources

Inline references in MC + scen explanations (substring match):
ISO 94, NIST 56, GDPR 23, PCI 18, HIPAA 13, CVSS 11, CVE 10,
CompTIA 3, RFC 3, OWASP 1, Sybex/Chapple 0. These are
inline-context references inside explanations, not per-question
citation fields. They support content but are not themselves a
citation system.

## Current catalogue state

| | Sections | Videos | MC | Scen | Match | Cram |
|---|---:|---:|---:|---:|---:|---:|
| **D1** | 4 | 18 | 113 | 27 | 112 | 129 |
| **D2** | 5 | 38 | 139 | 100 | 177 | 196 |
| **D3** | 4 | 18 | 59 | 62 | 88 | 102 |
| **D4** | 9 | 29 | 115 | 96 | 127 | 152 |
| **D5** | 6 | 17 | 106 | 60 | 76 | 92 |
| **Total** | 28 | 120 | 532 | 345 | 580 | 671 |

Testable total: **1,457**. Grand total (incl. cram): **2,128**.
D2 is the heaviest single domain (612 items inc. cram).

### Citation coverage — the structural finding

| Type | Count | With citation |
|---|---:|---:|
| MC | 532 / 532 | 100% |
| Scenarios | 345 / 345 | 100% |
| **Matching** | **0 / 580** | **0%** |
| **Cram** | **0 / 671** | **0%** |

1,251 items carry no per-item citation. They DO inherit a video-level
implicit citation via parent `video.id` and `video.title` — the §2.3.3
mutex case is locatable as "video 2.3.3, matching index N" and
grounded against the Race Conditions transcript.

### Prior grounding work

Per `PLAN.md` §1c-structural and `scripts/audit-video-grounding.mjs`:

- Citation backfill: **DONE**. 728 → 0 legacy-no-citation on MC + scen
  (matching/cram were not in scope).
- Grounding audit: **BUILT, RUN, DEPRIORITIZED** 2026-04-27. Ran on
  867 questions (MC + scen only). Result: 125 PASS / 230 LOW /
  454 MEDIUM / 58 HIGH (7%). Spot-checks: 30/58 HIGH reviewed,
  zero true misfiles.
- Anchor-gap audit: **BUILT**, extractor was noise-dominated
  (concepts included prose connectors like "These", "Another
  important control type").

The April 27 deprioritization decision is **still correct for the
audited corpus**; the prior audit just never looked at matching/cram,
where the §2.3.3 mutex case lives. Audit D fills that gap.

## Decisions — signed off 2026-05-13

### D1 — Method: hybrid pipeline

**APPROVED as recommended.**

1. **Keyword pre-screen** on matching + cram. Flags items where the
   answer term doesn't appear in the parent transcript. Cheap, fast,
   high-precision negatives. The Mutex case is in this set. Reuse
   the SYNONYMS/acronym map from `scripts/audit-video-grounding.mjs`
   as a starting point.
2. **LLM-as-judge** on flagged items + the calibration MC/scen
   sample. Per item: load the cited transcript + the item, produce
   a verdict + a short justification quote from the transcript.
   Empty-quote verdicts are a structural flag.
3. **Aiden arbitration** on HIGH flags using CompTIA PDF + Sybex
   book.

Rationale: pure-script rejected by April 27 noise; pure-LLM
workable but more expensive; pure-manual rejected at ~5min×1,400
items ≈ 100+ hours.

### D2 — Corpus scope: match + cram, calibration first

**APPROVED with caveat.**

Default scope: matching + cram (the 1,251 un-audited items).
Calibration sample: 30 items spread across domains and types.

**Caveat:** calibration MUST include some MC + scen items to
verify the April 27 cleanness still holds. If calibration
surfaces MC/scen misfiles, expand scope to include them. If
calibration confirms MC/scen remain clean, hold scope at
match + cram.

### D3 — Source-authority hierarchy

**APPROVED as recommended.**

1. **CompTIA SY0-701 published objectives** (physical PDF; final
   arbiter for "in syllabus")
2. **Professor Messer transcripts** (primary teaching source;
   final arbiter for "in source" per cited video)
3. **Chapple/Seidl Sybex book** (supplementary; used when Messer
   is silent on a topic CompTIA includes)
4. **Inline secondary sources** (NIST, ISO, OWASP) — verification
   of standards references only, not syllabus grounding decisions

Rationale (Aiden): exam tests against CompTIA, not Messer's
video coverage. If Messer omits something CompTIA includes,
the app should still test it. CompTIA outranks Messer.

### D4 — Decomposition shape

**APPROVED as recommended.**

1. **Pre-flight commit:** PLAN.md amendment carving out Audit D
   and recording priority shifts (this commit and the one after it
   are that pre-flight).
2. **Sub-batch 0:** tooling + calibration sample (30 items).
   Output: `audit-d-calibration-report.txt`. No `questions.json`
   changes. Single commit.
3. **Sub-batch 1..N:** per-domain LLM verdicts on match + cram
   (and optionally MC + scen if calibration warrants). Each
   domain → one verdict-as-data commit producing
   `.audit-working/audit-d-verdicts-d{N}.json`. No code changes.
4. **Apply sub-batches:** one per high-value fix cluster. Use
   the Audit A apply-script pattern (REPLACEMENTS JSON + dry-run
   + write modes + idempotent re-run).
5. **Closure sub-batch:** final ship report + PLAN.md ledger
   update with totals, deferred items, and lessons.

Verdict-as-data and fix-as-data are split so we land the verdict
corpus once, then iterate fixes against a stable verdict set.
Audit A learned the hard way that mixing verdict and fix
compounds proposal-phase mistakes (the actual-vs-claimed length
drift).

### D5 — Order vs Task 2 Sub-batches 3-5

**REVISED FROM RECOMMENDATION. Audit D first.**

Sub-batches 3, 4, 5 of Task 2 are deferred until Audit D
match + cram fixes ship.

Rationale (Aiden, per 2026-05-10 framing): source quality > UX
polish when source quality is broken. Better filtering on
possibly-wrong content isn't better study.

**Exception clause:** if Audit D execution turns into 2-3 weeks
of work, Task 2 Sub-batch 4 (Flashcards SM-2 + cram in
buildPool) may warrant interleaving since it touches the cram
data path. Decision point only if Audit D drags. Default:
Audit D first, all the way through closure.

### D6 — Verdict shape: 6-way + tags

**APPROVED as recommended, with one fix-direction addition.**

Six verdict categories:

- **in-source** — concept in source at depth supporting the question
- **partial-depth** — concept named but not taught to question's depth
- **partial-adjacent** — concept in adjacent same-domain video
- **out-of-source** — concept absent from cited video's source
- **out-of-syllabus** — concept absent from any Sec+ source
- **ambiguous-call** — automated + human reviewers disagree

Each item carries:

- **confidence:** high / medium / low
- **fix-direction:** one of
  - `rewrite-to-source`
  - `move-to-correct-video`
  - `remove-from-catalog`
  - `mark-for-Sybex-arbitration`
  - `keep-as-enrichment` *(added per addition #3 — see below)*

### D7 — Keyword-screen scope: parent-video only

**APPROVED as recommended.**

Stage-1 keyword screen runs against the parent video's transcript
only. Cross-video checks (is the term in 2.3.4 instead of 2.3.3?)
are deferred to the LLM stage, which handles that more cleanly.

### D8 — Cram-term handling: advisory-only fixes

**APPROVED as recommended.**

Include cram in verdict-as-data (cheap, same pipeline). On
fixes: advisory-only. No automatic removal of cram terms.
Aiden decides per-term. Cram is a low-stakes study-flashcard
format; the verdict tells him which cards may be enrichment
beyond Messer, but the keep/remove call is his.

## Revision 2026-05-13 (mid-Sub-batch-0): calibration blind reviewer = supervisor-Claude

The original scoping implicitly assumed Aiden would be the second
reader for the calibration sample (blind-pass review against the
LLM-as-judge script's verdicts). This is wrong on two grounds:

1. The calibration question is **"is the app's content grounded in
   its cited Messer transcripts?"** — a text-vs-text source-grounding
   question, not a pedagogical-judgment question. Aiden's role in
   this project is the **user**, not a second LLM check. He has
   already flagged real misalignment instances during study; asking
   him to grade individual items as a manual second reader isn't a
   good use of his time.
2. **Two independent LLM readers** (the script's Sonnet via
   Anthropic API + a separate "supervisor-Claude" conversation on
   Claude.ai) measuring agreement is still a valid methodology
   validation. It measures whether the audit pipeline's verdicts
   hold up to a second-reader review under the same item + source
   conditions.

**Revised procedure for calibration blind pass:**

- The pipeline generates `.audit-working/audit-d-calibration/supervisor-claude-review-packet.md`
  containing all 30 items, with the full cited transcript inline
  per item. The packet leaks no script LLM verdicts and no keyword
  screen results (S-R4 blind-pass invariant extended to the second
  reader).
- Aiden opens a fresh Claude.ai conversation, pastes the packet,
  and supervisor-Claude returns a JSON array of 30 verdicts in the
  same 6-way schema.
- Aiden pastes the JSON array back to this CC session; the audit
  pipeline ingests it, computes agreement rate against the script's
  Sonnet verdicts, and produces the Sub-batch 0 closure summary.

**What this revision does NOT change:**

- **Sub-batches 1+ human arbiter role remains Aiden's.** When the
  full-corpus audit produces HIGH flags requiring source-authority
  arbitration (CompTIA PDF + Sybex book + Aiden's own study
  experience), Aiden remains the final reviewer for those calls.
  Calibration is a methodology check; full-corpus HIGH-flag
  arbitration is a user-judgment task. These are different roles.
- **R7 (audit-study collision) mitigation strategies** still apply
  to Sub-batches 1+ ship cadence; calibration itself is not the
  study-disruptive phase.

## Three additions to the plan (Aiden, 2026-05-13)

### Addition 1 — Calibration smoke test

The 30-item calibration **MUST** include the §2.3.3 mutex / atomic
operation case as a known-positive. If the calibration pipeline
does not flag mutex + atomic operation as out-of-source against
the 2.3.3 Race Conditions transcript, **the method is broken**
and the pipeline needs reworking before scope expansion.

This case is ground truth. Sub-batch 0 cannot pass without it
flagging correctly.

### Addition 2 — R7 mitigation (audit-study collision)

Aiden is currently studying (Cryptography per CLAUDE.md). Fixes
that shift weak-sets mid-study are disruptive. Two mitigation
strategies:

- **Strategy A:** ship per-domain fix chunks during study breaks,
  aligned to Aiden's current domain (he is currently in D1
  Cryptography, so D1 fix sub-batches collide; D2-D5 fix
  sub-batches do not).
- **Strategy B:** hold all fixes until a single end-of-audit ship
  over a non-study weekend.

**Decision point:** after calibration completes, review schedule
and pick A or B. The strategy choice can wait until calibration
results land.

### Addition 3 — R8 intentional enrichment

The verdict pipeline must surface the distinction between
"misfile" and "intentional enrichment exceeding Messer". The
§2.3.3 mutex / atomic case may have been added deliberately
because Aiden's CS background made it feel natural to include.
The fix is not necessarily "remove" — it could be "keep, accept
enrichment, document intent".

The D6 fix-direction tag now includes **keep-as-enrichment** to
support this distinction. LLM verdicts of out-of-source or
out-of-syllabus do NOT auto-route to remove-from-catalog; they
route to Aiden's arbitration, who picks the fix-direction
including potentially keep-as-enrichment.

## Relationship to existing planned work

- **Audit A** (structural option consistency): shipped 2026-05-04
  to 2026-05-05. Out of scope here.
- **Audit B** (semantic coherence): **subsumed into Audit D**.
  Partial-depth + out-of-source verdicts capture semantic
  coherence failures.
- **Audit C** (length-ratio re-run): **deferred indefinitely**.
  Re-trigger only if Aiden surfaces length-tell complaints
  during study.
- **Task 1c-structural** (grounding/anchor-gap audits):
  **superseded by Audit D**. The April 27 deprioritization is
  retroactively correct; Audit D is the spiritual successor with
  the corrected methodology.
- **PBQ format audit** (metacognitive feature #4, tracked
  2026-05-10): **kept separate** from Audit D. Different shape
  (format vs content). Run after Audit D content corrections so
  PBQ work operates on a content-correct corpus.
- **Task 2 Sub-batches 3, 4, 5:** deferred behind Audit D per D5.
- **Task 3** (PBQ system): runs after Audit D. PBQ authoring on a
  content-correct corpus is meaningfully different from authoring
  on a corpus with un-validated content.

## Risk register

- **R1 — LLM hallucinated grounding judgment.** Mitigation: every
  verdict carries a short justification quote from the transcript.
  Empty-quote verdicts are a structural flag.
- **R2 — Over-aggressive "out-of-syllabus" verdicts.** Some content
  may be in the CompTIA PDF the LLM can't see. Mitigation:
  out-of-syllabus verdicts route to Aiden for cross-check against
  the physical CompTIA PDF.
- **R3 — Cram terms intentionally broader than Messer.** Mitigation:
  cram verdicts advisory-only per D8.
- **R4 — Acronym/jargon variants in matching answers** (TOCTOU vs
  Time-of-Check to Time-of-Use). Mitigation: reuse the SYNONYMS map
  from `scripts/audit-video-grounding.mjs` in the keyword
  pre-screen; case-insensitive matching with expansion handling.
- **R5 — Removing content shrinks the catalogue below useful
  density.** Mitigation: every removal proposal must be paired with
  a rewrite/replacement proposal OR a documented decision to
  accept lower density.
- **R6 — SM-2 progress preservation.** `match-*` and `mc-*` keys
  must survive Audit D changes. Removing a matching item by index
  shifts indices for all later items in the same video. Audit A
  handled this via REPLACEMENTS-in-place. Audit D needs the same
  discipline plus an explicit item-deletion migration path if
  content is removed entirely.
- **R7 — Audit-study collision.** Mitigation per addition 2 above.
- **R8 — Intentional-enrichment-vs-misfile.** Mitigation per
  addition 3 above (`keep-as-enrichment` fix-direction).

## Preconditions verified 2026-05-13

- **Working tree:** main branch, up to date with origin/main.
  Three untracked `docs/` notes (cancel-feature-shipped.md,
  task2-2b-end-of-session.md, task2-sub-batch-2c-shipped.md);
  no uncommitted source-code changes.
- **Last 5 commits:** 5ed2cbe (Sub-batch 2C), 6af9d85 (End-session
  button), 9190991 (metacog tracked), 56c0e9b + 0c00620
  (Sub-batch 2B).
- **Build baseline:** `npm run build` → built in 656ms, no errors.
- **Tooling baseline:**
  - `scripts/audit-video-grounding.mjs` (existing, MC + scen only)
  - `scripts/audit-anchor-gaps.mjs` (existing, concept extraction)
  - `scripts/audit-catalogue-quality.mjs` (Audit A precedent)
  - `scripts/fix-audit-a-chunk-{1,2,3,deferred}.mjs` (apply-script
    pattern, reusable)
  - `.messer-transcripts/` — 121 files, all referenced videos
    present, fetcher idempotent

## Next execution step

Sub-batch 0: calibration tooling + 30-item calibration run,
including the §2.3.3 mutex / atomic ground-truth case. Surface
the calibration design to Aiden before authoring. No
`questions.json` changes in Sub-batch 0.

The PLAN.md amendment that lands alongside this document closes
the pre-flight phase. Sub-batch 0 is a future session.
