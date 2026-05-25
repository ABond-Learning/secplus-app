# Report-#0019 — Memory architecture migration: CC batch

**Date:** 2026-05-25
**Run ID:** `2026-05-25-memory-arch-migration`
**Commit (main task):** `5091f7c` — `docs: memory architecture design + pre-migration snapshot`

## What was asked

Execute the CC half of the supervisor-Claude memory architecture migration — a five-step
batch supplied via a supervisor ship prompt. The Claude.ai UI work (project knowledge
upload, project instructions append) and the `memory_user_edits` tool work are handled
separately by Aiden and the supervisor respectively; this batch is repo + OneDrive + CC's
own memory.

Before execution, the prompt was sent in draft form (without the 30 memory entries) for a
structure-confirmation pass. That pass surfaced two issues, both fixed in the final prompt:
(1) the prompt referenced a `files v4/` staging folder that does not exist — only v1/v2/v3
are present, v3 is canonical and complete; (2) `git add -A` would have swept four
pre-existing unrelated untracked files into the commit — staging was scoped to exactly
three files. The final prompt also added Rule #9 (event log) and Rule #7 (this report) as
explicit deliverables, plus the MEMORY.md index update.

## What was done

**Step 1 — OneDrive folder structure.** Created (`mkdir -p`) under
`/mnt/c/Users/abond.SEAFORD/OneDrive - Seaford College/Claude/`:
`pattern-level/`, `secplus/`, `_meta/` (the last already existed). Verified by listing.

**Step 2 — Pre-migration snapshot.** Wrote the 30 current `memory_user_edits` entries
verbatim and numbered, with an explanatory header, to two locations:
- `~/projects/secplus-app/docs/memory-snapshots/2026-05-25-pre-architecture.md` (new dir)
- `…/OneDrive …/Claude/_meta/memory-snapshot-2026-05-25.md`

Verified byte-identical via `cmp` (clean), both 74 lines, 30 numbered entries.

**Step 3 — Pattern-level files to canonical location.** Copied the four pattern-level
topic files from `…/under-review-2026-05-25/files v3/` to `…/Claude/pattern-level/`:
`supervisor-cc-pattern.md`, `engineering-lessons.md`, `audit-methodology.md`,
`tool-quirks.md`. All four verified byte-identical to source via `cmp`.

**Step 4 — CC's own memory entry.** Updated `feedback_review_docs_to_clipboard` so the
file-location doctrine moves from `/tmp/*.txt` to
`~/projects/<project>/.audit-working/<subbatch-or-descriptive-name>/<file>.md`, with
`/tmp` now noted as acceptable only for within-session scratch (rationale: /tmp is volatile
across WSL shutdown). Preserved the iconv→UTF-16LE→clip.exe mechanics, the CP437 mojibake
table, and the trigger-type list. Updated the entry `name`, `description`, and body, plus
the MEMORY.md index line for the entry. Remaining `/tmp` mentions are doctrine ("NOT /tmp")
or dated history (2026-05-01 iconv incident; "previously directed to /tmp/*.txt").

**Step 5 — Commit architecture doc + snapshot.** Copied `files v3/memory-architecture.md`
(canonical; no v4 exists) to `docs/memory-architecture.md` (126 lines, byte-identical to
source). Confirmed the snapshot from Step 2 present at
`docs/memory-snapshots/2026-05-25-pre-architecture.md`. Added a `## Memory architecture
(2026-05-25)` section near the top of `docs/supervisor-handoff.md` (immediately after the
latest session-close summary, before the prior headers) pointing future supervisor chats at
`docs/memory-architecture.md`. Staged exactly three files (no `git add -A`), committed with
the supplied message, pushed to origin/main.

## Files changed

Committed in `5091f7c` (3 files, +212):
- `docs/memory-architecture.md` (new, 126 lines)
- `docs/memory-snapshots/2026-05-25-pre-architecture.md` (new, 74 lines)
- `docs/supervisor-handoff.md` (modified, +12)

Changed outside the repo / outside this commit:
- OneDrive: 3 folders created; `_meta/memory-snapshot-2026-05-25.md`; 4 files in `pattern-level/`
- CC memory: `feedback_review_docs_to_clipboard.md` + `MEMORY.md` index (the memory dir is
  outside the repo, not committed)
- Report-#0019.md (this file) — follow-up commit per Rule #7

## Decisions reached

- **v3 is canonical.** The prompt's `files v4/` references resolved to v3, which is the
  newest and complete staging set. Step 5.1 copies from v3.
- **Handoff section placement.** Inserted after the current latest-session summary block and
  before the prior-header sections — "near the top" (within the first ~40 lines of a 592-line
  doc) without fracturing the existing 2026-05-24 summary.
- **Report committed separately** from the main task commit (Rule #7 follow-up-commit
  allowance), preserving the exact supplied commit message and three-file scope for `5091f7c`.

## Boundaries honored

- Did NOT run the migration when the prompt arrived without the 30 entries — held for the
  structure-confirmation pass instead, surfaced the v4 and staging issues, then executed once
  the corrected prompt + entries arrived.
- Staged exactly three files; the four pre-existing untracked files
  (`item-3-hsts-adjudication-input.md`, `cancel-feature-shipped.md`,
  `task2-2b-end-of-session.md`, `task2-sub-batch-2c-shipped.md`) remain untracked.
- Did NOT touch `memory_user_edits` (supervisor's separate work) or the Claude.ai UI
  (Aiden's separate work).
- Rule #9 event log emitted at state transitions to
  `.audit-working/runs/2026-05-25-memory-arch-migration.eventlog.ndjson`.

## What's next

- Supervisor: apply the `memory_user_edits` changes (slim the 30-entry flat memory to the
  topic-file-pointing set per `docs/memory-architecture.md`).
- Aiden: Claude.ai UI work — upload the pattern-level files to project knowledge and append
  the project-instructions additions.
- Spot-check on the first post-migration CC task that review docs land in `.audit-working/`,
  not `/tmp/` (per the updated `feedback_review_docs_to_clipboard` entry).
