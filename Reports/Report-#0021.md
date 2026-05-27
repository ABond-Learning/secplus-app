# Report-#0021 — Orientation-manifest restructure: cat-paste procedural default, branch-pinned URL path removed

**Date:** 2026-05-27 (documenting work done in the 2026-05-26 afternoon supervisor chat)
**Run ID:** `2026-05-27-orientation-manifest-restructure`
**Commit (main task):** see end of this report / git log — `docs: orientation-manifest restructure — cat-paste default procedural, branch-pinned URL path removed (Report-#0021)`

## What was asked

Document, in a Report and in `docs/supervisor-handoff.md`, a restructure of the orientation
manifest that lives in the Claude.ai Project custom instructions. The restructure itself was
applied during the 2026-05-26 afternoon supervisor chat (in the Claude.ai Project settings,
outside this repo — not a file CC can edit). This task is the in-repo documentation of that
fix: a Report capturing the recurrence pattern, the structural diagnosis, the fix, the test
plan, and acceptance criteria; plus a one-line top-banner note in the handoff doc pointing at
this Report. No change to `tool-quirks.md` (its in-chat fetch guidance still applies).

## Background — the recurring orientation failure mode

Fresh supervisor chats open by orienting on repo state. The orientation manifest (in the
Claude.ai Project custom instructions) historically listed concrete branch-pinned
`raw.githubusercontent.com/main/...` URLs and instructed the supervisor to fetch them first.
`web_fetch` against branch-pinned URLs serves **stale Fastly-cached** bytes that lag the
pushed commit (documented in `docs/supervisor-handoff.md` § "web_fetch on this repo is
unreliable", from 2026-05-23). The supervisor would fetch stale state at orientation, build a
diagnosis on it, and waste turns before someone noticed the bytes were old.

### Recurrence pattern (four-plus incidents)

The same failure recurred across at least five distinct chats:

- **2026-05-23** — first documented occurrence (the incident that produced the
  "web_fetch on this repo is unreliable" handoff section and the branch-pinned-stale /
  commit-pinned-404 split).
- **2026-05-24 morning**
- **2026-05-24 evening**
- **2026-05-26 morning**
- **2026-05-26 afternoon (today's chat)** — the recurrence that triggered the structural fix.

## Structural diagnosis — procedural opener beat behavioural rules

Multiple **behavioural guards** were already in place and each failed to prevent recurrence:

- Memory entry: cat-paste / commit-pinned-URL default
  (`feedback_supervisor_current_doc_state.md`).
- Memory/working guidance: three-source-disagreement and stop-and-diagnose patterns.
- `docs/tool-quirks.md` sections on in-chat fetch decisions.
- The handoff doc's own "web_fetch on this repo is unreliable — local repo is source of
  truth" section.

These are **guards** — rules that fire *after* an action is contemplated, asking the
supervisor to second-guess a fetch. The orientation manifest, by contrast, was a
**procedural opener**: it told the supervisor exactly what to *do first*, and it listed
branch-pinned URLs concretely as the first step. A concrete "do this now" procedural step at
the very top of orientation beats an abstract "be careful about fetches" guard every time —
the supervisor follows the opener before it ever reaches the guard. The guards were
structurally downstream of the behaviour that produced the failure, so they could not stop
it. The failure was not a lapse in judgment; it was the manifest doing exactly what it said.

## The fix applied (2026-05-26 supervisor chat, Claude.ai Project custom instructions)

The orientation manifest was restructured so the procedural opener no longer points at
stale-prone state:

- **Branch-pinned `raw.githubusercontent.com/main/...` URL paths removed entirely** from the
  manifest. They are no longer listed as the first orientation step.
- **The procedural opener is now "ask Aiden to cat-paste"** the current state of the relevant
  files, rather than "fetch these URLs." The default first move reads local source-of-truth
  bytes via the human relay instead of a cache-prone fetch.
- **Commit-pinned URLs remain acceptable** when Aiden supplies them (a specific `<sha>` path
  is not subject to the branch-cache staleness, though it can still 404 on `web_fetch` per the
  handoff caveat — so they're allowed, not mandated).
- **Branch-pinned URLs moved to an explicit DO NOT** in the manifest.
- **The "When the handoff doc is stale" section was deleted** from the manifest as redundant —
  the new cat-paste-first opener makes it moot (you no longer fetch a doc that could be stale;
  you ask for current bytes).

The fix changes the *shape of the opener* rather than adding another guard. That is the point:
the prior guards were correct but positioned downstream; moving the correct behaviour into the
procedural opener itself is what should end the recurrence.

## In-repo changes (this task)

- `Reports/Report-#0021.md` — this report.
- `docs/supervisor-handoff.md` — one-line dated note added at the top of the banner pointing
  at this Report. The existing "web_fetch on this repo is unreliable" section (lines ~255–268)
  is left intact; it remains the in-chat fetch-decision guard and is unaffected by the manifest
  restructure.
- No change to `docs/tool-quirks.md` — its content governs in-chat fetch decisions and still
  applies.

## Test plan

The fix is in the orientation manifest, so the test is observational, not a script:

- **The next fresh supervisor chat after this commit is the test.** If, at orientation, it
  asks Aiden to cat-paste the current state (rather than fetching branch-pinned
  `raw.githubusercontent.com/main/...` URLs), the restructure held.
- A single passing chat is necessary but not sufficient — the prior behavioural guards also
  "worked" intermittently. The signal is the *absence of recurrence across a run* of fresh
  chats, not one good open.

## Acceptance criteria

Declare the fix successful when:

- **No stale-cache false alarms across the next ~5 fresh supervisor chats** — i.e. no chat
  opens by fetching branch-pinned URLs, ingesting stale bytes, and building a diagnosis on
  them.
- Each of those ~5 chats opens with a cat-paste request (or a commit-pinned URL Aiden
  supplied) for current state.

If a stale-cache false alarm recurs within that window, the manifest restructure was
insufficient and the failure mode needs a further structural change (escalate, do not just add
another guard).

## Decisions reached

- **Banner note added on top of the frozen 2026-05-25 banner, not into it.** Per the handoff
  convention that dated banners are point-in-time snapshots (see Report-#0020), the new note is
  a fresh dated line above the existing 2026-05-25 block rather than an edit inside it.
- **`tool-quirks.md` untouched** per the task — it governs in-chat fetch decisions, a separate
  concern from the orientation opener.
- **Date framing:** the supervisor chat and the manifest restructure occurred 2026-05-26; this
  report and commit are produced 2026-05-27. Both dates are stated explicitly rather than
  collapsed, to keep the commit timestamp and the event date honest.

## Boundaries honored

- Docs-only; no code, schema, question content, or progress-storage keys touched.
  `npm run build` not applicable; output validated via `git diff --cached`.
- The orientation manifest itself lives in the Claude.ai Project custom instructions and was
  edited by the supervisor in that chat — out of CC's reach. This task documents that fix; it
  does not (and cannot) re-apply it in the repo.
- Rule #9: event log written at state transitions
  (`.audit-working/runs/2026-05-27-orientation-manifest-restructure.eventlog.ndjson`).
- Rule #10/#11 unaffected; relay tree and verbatim-paste conventions still stand.

## What's next

- Watch the next ~5 fresh supervisor chats against the acceptance criteria above.
- If recurrence persists, escalate to a further structural change rather than another guard.
- Memory note worth writing: the structural lesson that a procedural opener outranks a
  downstream behavioural guard — fix the opener, don't stack guards. (Flagged for the
  supervisor; not written here.)
