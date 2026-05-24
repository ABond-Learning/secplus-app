# Report-#0013 — Workflow Rule #9 Rescope: Event-Logging for All Supervisor-Directed CC Tasks

**Date:** 2026-05-24
**Task type:** Workflow / process change (CLAUDE.md amendment + report)
**Run-ID:** `2026-05-24-clarify-rule-9`

---

## What was asked

Rescope CLAUDE.md Workflow Rule #9 (NDJSON event logging) from its original
autonomous-chains-only scope to **all supervisor-directed CC tasks**, add a run-ID
naming convention, and document the change. Run the task itself under event logging
as the first instance of the new scope.

## Trigger

Today (2026-05-24) three substantive supervisor-directed CC tasks ran with **no
event log**, because Rule #9 as written only applied to autonomous chains ("Aiden
out, CC running unattended"):

1. Sybex Tier 2 corpus commit (`d655a46`)
2. Docs refresh + `Reports/Report-#0012.md`
3. Item 3 HSTS adjudication-input pull (`.audit-working/relays/from-cc/item-3-hsts-adjudication-input.md`)

The gap surfaced when Aiden asked whether the timestamp rules were in effect. The
honest answer was "scope says no — these were interactive, not autonomous — but that
scope is too narrow." A supervisor-directed task carries the same auditability value
whether or not Aiden is physically away; the autonomous/interactive distinction was
the wrong axis. The right axis is **ship-prompt-initiated vs conversational**.

## Decision

Rescope Rule #9 to **all supervisor-directed CC tasks** — any task initiated via a
supervisor ship prompt, autonomous chain or single interactive task alike.

- **Run-ID convention:** `YYYY-MM-DD-<short-task-slug>` (e.g.
  `2026-05-24-item-3-hsts-input`); one run per ship prompt.
- **Out of scope:** conversational back-and-forth — file inspection, status
  questions, mid-session checks, re-piping a file — is not ship-prompt-initiated and
  does not require a run.

The eight event types, the `task_id`-join-key rule, the `actual_minutes`
auto-computation guard, the example, and the 2026-05-23 establishment date are all
preserved unchanged. Only the scope sentence, a run-ID convention sentence, and a
rescope-date sentence were added.

## Forward-only basis

Today's three tasks are **not** retro-logged. Reconstructing their `task_start` /
`task_end` timestamps after the fact would produce fictional durations — exactly the
failure mode the 2026-05-23 timing-audit fix (`actual_minutes` auto-computed from
real timestamp deltas, callers forbidden from passing it) was introduced to prevent.
This mirrors the Tier 1/2/3 source-grounding framework, which applies forward from
the G packet and leaves prior sub-batches as a documented frozen baseline rather than
retro-fitting them.

This report's own run (`2026-05-24-clarify-rule-9`) is the first task logged under
the new scope.

## Files changed

- `CLAUDE.md` — Rule #9: three targeted edits (scope sentence, run-ID convention,
  rescope-date note). No rewrite of the rest of the rule.
- `Reports/Report-#0013.md` — this report.

## Boundaries honored

- Targeted edits only; preserved every load-bearing element of Rule #9 (event types,
  join-key paragraph, actual_minutes guard, example, establishment date).
- No retro-logging of prior tasks (avoids fabricated durations).
- No code or catalogue content touched.

## What's next

- **Item 3 HSTS verdict** — adjudication input is on the clipboard / at
  `.audit-working/relays/from-cc/item-3-hsts-adjudication-input.md`, pending
  supervisor review (Tier 2 confirms Tier 1: HSTS/SSL-stripping not tested in Ch12).
- **P1/P2/P3 packets** — 56 partial-depth items, adjudicable against the Tier 2 corpus.
- **D1/D3/D4/D5 partial-adjacent cleanup** — 227+ items.
