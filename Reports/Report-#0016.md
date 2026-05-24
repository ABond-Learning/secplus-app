# Report-#0016 — event-log persistent-state: spec revision + implementation (cross-process actual_minutes)

**Date:** 2026-05-24
**Task type:** Tooling — `scripts/lib/event-log.mjs` (Workflow Rule #9 helper)
**Run-ID:** `2026-05-24-event-log-state-impl`

---

## What was asked

Three-part ship prompt:

1. **Spec edits** to `docs/event-log-persistent-state-spec.md` — two supervisor-approved
   tweaks, single commit.
2. **Implement** `scripts/lib/event-log.mjs` against the revised spec, with a
   surface-and-pause checkpoint after drafting and before running selftests.
3. **Smoke test** a real multi-process sequence, then write this report.

The underlying problem: the helper computes `actual_minutes` from the
`task_start`→`task_end` timestamp delta, holding the start ts in a module-level
in-process `Map`. CC drives the helper as **one `node` invocation per `logEvent`**, so
by the time `task_end` fires in a fresh process the Map is empty and `actual_minutes`
was being omitted. The fix persists the open `task_start` timestamps to a per-run disk
file so a later process can read them.

## Spec tweaks (commit 1 — `8f684f3`)

- **(a) §2.4 Atomicity — write ordering flipped to NDJSON-first.** The prior spec
  ordered state-write before the NDJSON append (rationale: a missing NDJSON line was
  deemed more recoverable than disagreeing state). Reversed to **NDJSON append first,
  then state write.** Rationale folded in: the NDJSON log is the *durable* record
  (§2.2, §4); the state file is *ephemeral scratch*. A crash between the two should
  leave orphan state (cosmetic, and detectable from the log — an `open_tasks` entry
  with no matching `task_end` event) rather than a missing durable event (an
  unrecoverable hole in the timeline). When one side must lose, lose the recoverable
  one.
- **(b) §5 fixture #2 — real cross-process test.** The prior fixture cleared the
  in-process Map via `_resetForTests()` to *simulate* the process boundary. Replaced
  with a **real** boundary: process A writes `task_start` via `child_process.execSync`
  running `node --input-type=module -e "..."`, then process B writes `task_end` via a
  separate `execSync`. This mirrors exactly how CC drives the helper in production. The
  deterministic-duration trick is retained — process A seeds `task_start_ts` to a known
  past value (`now - 120000`) so process B's `task_end` produces `actual_minutes === 2.0`.
- **(+) Minor:** §3's optional `statePath` public export was dropped (public surface
  stays minimal; the path is internal `_statePath` only). §1 status line updated to note
  the 2026-05-24 revision with tweaks (a)+(b) so the diff is self-documenting. Still SPEC.

## Implementation summary (commit 2 — `058acdb`)

`scripts/lib/event-log.mjs`, 86 → 337 lines. Public API unchanged: `logEvent`,
`logPath`, `_resetForTests` keep their signatures; no new public exports.

- **New internal helpers (non-exported):** `_statePath`, `_readState`, `_writeState`,
  `_deleteState`.
  - `_readState`: missing file (ENOENT) → empty shape, **no** warn (normal). Corrupt /
    malformed file → empty shape + one stderr warn, **never throws** (spec §2.5).
  - `_writeState`: temp dotfile `.{runId}.state.json.tmp` + `renameSync` (atomic, §2.4).
  - `_deleteState`: `rmSync(path, { force: true })`.
- **`logEvent` flow:** validation + `actual_minutes` computation happen *before* any
  write (a bad call throws without emitting). Then **NDJSON `appendFileSync` first**,
  then the disk-state effect (§2.4). `task_start` writes `open_tasks[task_id] =
  { task_start_ts: now }`; `task_end` resolves the start ts as
  `Map.get(task_id) ?? _readState(runId).open_tasks[task_id]?.task_start_ts` (in-process
  fast-path, else disk rescue), computes `actual_minutes`, and clears the key from both
  Map and disk; `session_end` deletes the state file. The caller-supplied-`actual_minutes`
  rejection guard is unchanged.
- **State-file schema:** `.audit-working/runs/{runId}.state.json` →
  `{ run_id, open_tasks: { "<task_id>": { task_start_ts } } }`.

### Deviation from spec — `writeFileSync` import

Spec §3 listed the new `node:fs` imports as `renameSync`, `readFileSync`, `rmSync`.
Implementation also imports **`writeFileSync`** — required to write the temp file before
`renameSync` (a truncate-write, not an append; `appendFileSync` would corrupt a stale
temp left by a prior crash). Acknowledged by the supervisor at the surface-and-pause
gate as a correction to the spec's import enumeration; no spec re-edit required. This
report is the record of that correction.

## Selftest results

`node scripts/lib/event-log.mjs --selftest` → **13 PASS, 0 FAIL** (exit 0). Six fixtures
(13 assertions):

1. Single-process round-trip — `actual_minutes` present (number), ≥ 0.
2. **Real cross-process round-trip (the fix)** — `execSync` proc A (`task_start` + seed
   `task_start_ts = now-120000`) then `execSync` proc B (`task_end`) →
   `actual_minutes === 2.0`; also asserts the parent's Map never held the child's entry.
3. Missing-state fallback — no throw, omits `actual_minutes`, exactly one stderr warn,
   no state file created.
4. `session_end` cleanup — `open_tasks` empty before close, state file gone after.
5. Atomicity — no `.tmp` leftover after `task_start`.
6. Rejection guard — caller-passed `actual_minutes` still throws.

The harness cleans up all `selftest-<pid>-*` artifacts; verified none remain in
`.audit-working/runs/`.

## Smoke-test evidence

Throwaway runId `2026-05-24-smoke-event-log-impl`, four separate `node -e` invocations
(real process boundary), 5s sleep between `task_start` and `task_end`. The `task_end`
entry — written by a different process than `task_start`, with a dead in-process Map:

```json
{"ts":"2026-05-24T16:47:34.444Z","event":"task_end","task_id":"smoke-task","result":"slept ~5s","actual_minutes":0.1}
```

`actual_minutes` is **non-null** — exactly the entry that returned no value before the
fix. The `.state.json` file was gone after `session_end` (lifecycle delete confirmed),
and all smoke artifacts were removed.

### 0.1 rounding note

ts delta = `16:47:34.444 − 16:47:29.410` = 5.034s = 0.0839 min (true). The helper rounds
to 0.1-min granularity (`Math.round(x*10)/10`), so the stored value is **0.1**. The ship
prompt's "≈ 0.08" is the true seconds value; 0.1 is the correct rounded form at the
helper's existing precision (unchanged by this work). Not a defect.

## Files changed

- `docs/event-log-persistent-state-spec.md` — tweaks (a)+(b) + statePath drop + status
  line (commit 1).
- `scripts/lib/event-log.mjs` — persistent-state implementation + 6-fixture selftest
  (commit 2).
- `Reports/Report-#0016.md` — this report (commit 3).
- `CLAUDE.md` — Rule #9 note: cross-process `actual_minutes` fix shipped at `058acdb`
  (commit 3).

## Commits

| # | Hash | Subject |
| - | ---- | ------- |
| 1 | `8f684f3` | docs: revise event-log persistent-state spec with NDJSON-first ordering and real cross-process fixture |
| 2 | `058acdb` | feat(event-log): persist task_start to disk for cross-process actual_minutes capture |
| 3 | _(this commit)_ | docs: Report-#0016 event-log persistent-state implementation |

## Decisions reached

- NDJSON-first ordering adopted as the durable-record-wins rule (tweak a).
- Real cross-process test over in-process simulation — the test now exercises the exact
  production failure mode, not an approximation (tweak b).
- `writeFileSync` added to imports (deviation above), supervisor-acknowledged.
- Public surface kept minimal — no `statePath` export.

## Boundaries honored

- Rule #9: full event-log trail for this run (`session_start` → spec-revision
  start/commit/end → implementation start → `pause_for_input` → `resume` → commit →
  end → smoke-and-report → `session_end`). Each `logEvent` was a separate `node`
  invocation, faithfully reproducing — and dogfooding — the cross-process path the fix
  targets.
- Two surface-and-pause gates honored: implementation shape before selftests, and smoke
  evidence before this report commit. Both status blocks piped to clipboard via
  `iconv -f UTF-8 -t UTF-16LE`.
- Forward-only: no closed run logs back-filled (spec §4).
- Public API and NDJSON output shape unchanged except that multi-process `task_end`
  entries now gain a non-null `actual_minutes`.

## What's next

- Spec doc remains marked SPEC with the revision note; it can be flipped to SHIPPED at
  any later housekeeping pass (low priority — the code is authoritative and tested).
- No follow-up obligation. The helper is now correct for both single- and multi-process
  drive patterns; future supervisor-directed runs get accurate `actual_minutes`
  automatically.
