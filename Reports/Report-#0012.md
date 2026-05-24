# Report-#0012 — Sybex Practice Test Extraction — Tier 2 Corpus Complete

**Date:** 2026-05-24
**Task type:** Evidence-base build + corpus commit + documentation
**Audit D arc position:** Tier 2 source-grounding layer populated (forward from G packet)

---

## What was asked

Document and commit the completed Sybex SY0-701 test-bank extraction. The full
corpus (chapters 2–17 + Practice Exams 1 and 2 = 18 files, 500 questions) was
extracted by Aiden via Claude in Chrome over a multi-session run on 2026-05-24 and
landed in the Windows Downloads folder. The session's job: move and verify the
corpus, commit it as the Audit D Tier 2 evidence base, and refresh PLAN.md +
supervisor-handoff.md + this report.

## Goal

Build the **Tier 2 evidence base** for Audit D forward adjudication. The Tier 1/2/3
source-grounding framework adopted with the G packet (2026-05-23) defines:

- **Tier 1** — Sybex glossary (is the term in the cert vocabulary at all?)
- **Tier 2** — Sybex practice-test bank (does the cert actually *test* this, and how?)
- **Tier 3** — full Sybex chapter prose (chapter/section/page citation)

Tier 1 was already in place. This milestone populates **Tier 2** for all 16 chapters
and both practice exams, so SB-fix-style passes can ground "does the cert test this?"
without per-item manual book lookups.

## Method

**Claude in Chrome (CCh) with a deliberately-wrong protocol.** CCh worked through the
Wiley/Sybex online test bank choosing, for each question, the answer its Security+
reasoning judged *wrong* — capturing both the Sybex "correct" answer and CCh's
deliberately-wrong pick (`my_guess`). Where CCh's wrong-on-purpose pick still matched
Sybex's correct answer, that divergence is itself audit-useful signal (see below).

The run was **multi-session with written handoff briefs** (~500 words each) carrying
helper code, the JSON schema spec, current state, and anomalies across session
boundaries — necessary because CCh's sidepanel has no manual `/compact` and
auto-compaction breaks runs past ~5–6 chapters.

## Outcome

**18 files / 500 questions committed** at `.audit-working/sybex-practice-tests/`:

| Set | Files | Questions |
| --- | --- | --- |
| Chapters 02–17 | 16 | 320 (20 each) |
| Practice Exams 1–2 | 2 | 180 (90 each) |
| **Total** | **18** | **500** |

`chapter-01.json` is a legacy non-deliberate 6/20 run from prior actual studying —
**intentionally excluded** from the corpus (kept on disk, re-ignored in `.gitignore`).

**5 accidental matches** (`guess_matched_correct: true`) at: **ch04 Q1, ch08 Q3,
ch11 Q15, ch12 Q17, ch14 Q20**.

### Per-question data captured

Each question carries `n`, `stem`, `options` (A–D dict), `correct` ({letter, text}),
`explanation`, `image_referenced`, `notes`, plus:

- **`my_guess`** — CCh's deliberately-wrong pick. Records the Security+ reasoning vs
  the Sybex framing, which is the audit-useful payload of the deliberately-wrong
  protocol.
- **`guess_matched_correct`** — whether the wrong-on-purpose pick coincided with
  Sybex's correct answer.

Each file's `source` block carries the test-bank title, publisher, practice-set name,
`total_questions`, `completion_state`, `wall_clock_duration_seconds`, and
`average_per_question_seconds`.

### Shape verification

A verifier checked all 18 files: every file parses; counts match (20/chapter,
90/exam, 500 total); `options` is a dict with A–D keys; `n` is the sequential
question key; `wall_clock_duration_seconds` is present in every source block; and the
5 accidental matches sit exactly where expected.

**One schema drift found and fixed:** `practice-exam-02.json` stored `correct` as a
bare string (`"B"`) while the other 17 files used `correct: {letter, text}`. Per
Aiden's decision it was normalized to `{letter, text}` (reconstructing `text` from
`options[letter]`) so all 18 files share one shape for downstream adjudication
scripts. Purely structural — no answer changed. Post-normalization the verifier
reports 0 problems.

## Key methodological observations from the run

- **5 Security+-vs-Sybex collisions.** In 5 cases, CCh's deliberately-wrong pick (its
  Security+ reasoning's "wrong" answer) still matched Sybex's "correct" answer. These
  surface exactly where Sybex's framing diverges from common Security+ understanding —
  directly audit-relevant when adjudicating whether a catalogue item is mis-framed vs
  mis-cited.
- **Multi-session discipline is mandatory.** CCh's sidepanel has no manual `/compact`,
  so auto-compaction silently breaks runs past ~5–6 chapters. The run was split across
  sessions with explicit handoff briefs.
- **Written handoff-brief pattern.** A ~500-word brief per session preserved the
  helper code, the schema spec, the run state (which chapters done), and observed
  anomalies — the only thing that made cross-session continuity reliable.

## Workflow lessons (for future Claude-in-Chrome work)

- **CCh "Ask before acting" approves the whole plan upfront, not stepwise.** To force a
  real pause-and-confirm between steps, send the instructions as *separate messages*
  rather than one batched plan.
- **Long-running async JS loops time out at ~45s.** Batch work in chunks of ~25 items.
- **Post-END state wipe is standard Wiley UI behavior**, not a Ch12-specific bug —
  always plan for a `captureLocked` walk to recover answers/explanations after the
  test-bank UI locks a completed set.

## What this unblocks (carry-forward)

- **Item 3 (§2.4.9 HSTS mc[2])** — was HELD pending Chapter 12 data; Ch12 corpus now
  in hand (`chapter-12.json`), verdict can be adjudicated.
- **P1/P2/P3 packets** — 56 partial-depth items, now adjudicable against Tier 2.
- **D1/D3/D4/D5 partial-adjacent cleanup** — 227+ items (+ SD-WAN routing-out) gain a
  Tier 2 evidence base for forward adjudication.
- **Methodology shift** — Audit D forward adjudication moves from a Tier-1-only screen
  to a **Tier 1 + Tier 2** evidence base. D2 and all earlier sub-batches remain the
  documented frozen baseline (not retro-fitted).

## Files changed

- `.gitignore` — added a tracked-path exception for `.audit-working/sybex-practice-tests/`
  (mirrors the `relays/` precedent), with `chapter-01.json` re-ignored.
- `.audit-working/sybex-practice-tests/` — 18 corpus files committed (ch02–17 + 2
  exams); `practice-exam-02.json` normalized to the `{letter, text}` shape.
- `PLAN.md` — "Last updated" bumped to 2026-05-24; snapshot 1f cell extraction status
  flipped to COMPLETE; new "Session 2026-05-24" block at the end of the Task 1f detail
  section.
- `docs/supervisor-handoff.md` — title + 2026-05-24 update banner; "Sybex
  practice-test extraction underway" subsection replaced with the COMPLETE state;
  Item 3 HOLDING note marked UNBLOCKED.
- `Reports/Report-#0012.md` — this report.

## Decisions reached

- **Publish the corpus publicly** (Aiden confirmed): the repo is public, and committing
  the corpus republishes 500 verbatim Sybex/Wiley questions to public git history.
  Aiden accepted the copyright exposure; the supervisor-read (`web_fetch`) workflow
  depends on public hosting. Surfaced and confirmed before the push.
- **Normalize practice-exam-02** `correct` to `{letter, text}` (Aiden confirmed) for
  uniform downstream parsing.
- **Exclude chapter-01** from the corpus per the task spec (legacy non-deliberate run);
  file retained on disk, re-ignored in `.gitignore`.

## Boundaries honored

- Surfaced the public-repo copyright exposure and the schema drift as a pause-and-decide
  gate before any irreversible push (per the surface-and-pause cadence).
- The 3 pre-existing untracked Task 2 docs in `docs/` were left alone (per Audit D
  scoping D-J).
- No catalogue content (`questions.json`) was touched; this is evidence-base + docs only.

## What's next

Next-session opener is unchanged in shape: G + P packet adjudication when Aiden has the
Sybex book — now backed by the Tier 2 corpus. Specifically: Item 3 HSTS verdict (Ch12
unblocked), then P1/P2/P3 (56 items). After SB-fix-2 closes: D1/D3/D4/D5 partial-adjacent
cleanup (227+ items) with Tier 2 evidence.
