# Report-#0023 — Task 1g.2: schema documentation for Sybex fold-in

**Date:** 2026-05-27
**Run ID:** `2026-05-27-task-1g-2-schema-docs`
**Base HEAD:** `3b3a619` → plan `eea87c1` → implementation (this report's commits)
**Plan (signed off):** `.audit-working/relays/from-cc/task-1g-2-plan-2aeb9c71.md` (commit `eea87c1`)

## What was asked

Document in `SCHEMA.md` the three Sybex-fold-in schema additions that 1g.1 (`822e04a`) and
PLAN Task 1g defined but never wrote into the schema: the top-level `sybex_reference` shape,
the `sourceProvenance` enum, and the Sybex SM-2 key scheme. Plan-first; the plan
(`task-1g-2-plan-2aeb9c71.md`) was dispatched for sign-off, then approved with six decisions
plus a wording nudge. Docs-only — no code, no `questions.json`.

## The six adjudicated decisions (all approved)

1. **Section placement.** Blocks A (`sybex_reference`) + B (`sourceProvenance`) inserted
   between the citation historical note and `## Audit-trail fields`; block C (SM-2 key scheme)
   inside `## localStorage compatibility`; block D (TRACKED_PREFIXES correction) in the sync
   section.
2. **`sourceProvenance` OMIT from existing items** — absence ≡ `"messer"`; no whole-corpus
   backfill. 1g.4 writes the field on the 500 Sybex items only.
3. **Content-derived keys, app-wiring deferred.** The content-derived scheme
   (`mc-sybex-ch{NN}-q{N}` / `mc-sybex-pe{NN}-q{N}`) is documented as the spec, with an
   explicit flag that the existing index-based `mcKey(videoId, qi)` does not produce these
   keys (see architectural finding below).
4. **scen/match/cram — CC's lean.** Document `mc-` as active; describe the generalized
   `{type}-sybex-{ch|pe}{NN}-q{N}` shape as forward-looking. No pre-spec (YAGNI).
5. **Zero-padding kept** — inherited from the zero-padded Sybex source filenames
   (`chapter-04.json`, `practice-exam-01.json`); namespaces never mix; aligning costs more
   than it saves.
6. **TRACKED_PREFIXES stale-doc correction** — brought the doc current to the code list (see
   below).

**Wording nudge applied (§3 Block B).** The `sourceProvenance` filter language was changed
from present tense to a future-contract framing: "Filter code **should normalize** … via
`(item.sourceProvenance ?? "messer")`", and the filter paragraph is explicitly headed
"(future contract, not current behaviour)" — no audit script reads `sourceProvenance` today
and 1g.1 does not reach for it.

## Architectural finding — content-derived keys require app-wiring (flag for 1g.4 scoping)

The documented Sybex SM-2 key scheme is **content-derived**: the key encodes
`sybex_reference`'s chapter/exam + `question_number` (e.g. `mc-sybex-ch04-q1`). The app's
current derivation is **array-index-based**: `mcKey(videoId, qi)` returns `mc-{videoId}-{qi}`
(`src/secplus-quiz.jsx:44`). A synthetic per-section Sybex video (Q-B aggregation) would
therefore yield `mc-sybex-2.4-0`, **not** `mc-sybex-ch04-q1`. The two do not reconcile without
new app code.

**Consequence for 1g.4 scoping:** the conversion/integration must add a `sybexKey()` helper
(or a per-item key override that reads `sybex_reference`) so Sybex items get their
content-derived keys. This is documented in `SCHEMA.md` as a deferred 1g.4/1g.6 dependency,
not silently assumed.

**Side benefit (kept deliberately):** because the key is content-derived rather than
positional, Sybex item progress is **immune to the array-reorder fragility** that constrains
the index scheme (localStorage compat implications 2-3). The content-derived approach is the
better design here, not just a workaround.

## TRACKED_PREFIXES stale-doc correction

The SCHEMA `### TRACKED_PREFIXES` list listed only `mc- / scen- / match- / secplus-`. The
live code (`src/sync/sync-engine.js:13`) is
`["mc-", "scen-", "match-", "cram-", "weakness-", "sybex-", "secplus-"]`. The doc was missing
`cram-` (Task 2 SB-0), `weakness-` (Task 1h), and `sybex-` (Task 1g.0). Brought current, with
the parenthetical that `mc-sybex-*` keys are already covered by the `mc-` prefix and the
standalone `sybex-` entry is defensive future-proofing for keys whose first segment is
`sybex-` (e.g. `cram-sybex-*` / `match-sybex-*`).

## Files changed

- `SCHEMA.md` — blocks A, B, C added; one back-pointer added to the `sb_fix_2` section;
  TRACKED_PREFIXES list corrected (D). 124 insertions, 2 deletions.
- `Reports/Report-#0023.md` — this report (follow-up commit in the same push).
- `.audit-working/runs/2026-05-27-task-1g-2-schema-docs.eventlog.ndjson` — Rule #9 event log
  (gitignored).

## Boundaries honored

- Docs-only: **no code change, no `questions.json` touch.** Verified via `git status` (only
  `SCHEMA.md` modified) and `git diff --stat`. `npm run build` not applicable.
- Gate-safe: no `sybex-` SM-2 key written; independent of the 22:09 BST sync-engine gate.
- The four pre-existing untracked files were left untouched (not swept into the commit).
- Rule #9 event log written at state transitions (session_start, task_start, commit,
  pause_for_input, resume, commit ×2, task_end, session_end).

## What's next

- **1g.3 — objective tagging (C2-API):** repurpose the Audit D LLM-as-judge pipeline
  (`audit-d-llm-judge.mjs`) to tag each of the 500 Sybex questions with a SY0-701 objective
  code; 30-item stratified calibration (~85% threshold) before the full ~$5 run, per PLAN
  Task 1g.3.

---

> **Erratum (2026-05-29, 1g.7):** SM-2 key examples in this report use the
> pre-correction `mc-sybex-` order; canonical shipped order is `sybex-mc-`
> (src/secplus-quiz.jsx:43-46). Text left as-authored; see Report-#0024.
