# Spec — Persistent run-state file for `actual_minutes` capture in `scripts/lib/event-log.mjs`

**Status:** SPEC ONLY — pending supervisor review. No code changes in this commit.
Implementation is a separate ship after sign-off.
**Author run:** `2026-05-24-event-log-state-spec`
**Date:** 2026-05-24
**Touches:** `scripts/lib/event-log.mjs` (only)

---

## 1. Problem statement

The event-log helper (CLAUDE.md Workflow Rule #9) computes `actual_minutes` for a
task by subtracting the `task_start` timestamp from the `task_end` timestamp. It holds
the start timestamp in a **module-level in-process `Map`** (`taskStartTimes`,
`event-log.mjs:40`), populated on `task_start` and drained on `task_end`.

This works only when `task_start` and `task_end` run in the **same node process**. The
way CC actually drives the logger is **one `node` invocation per `logEvent` call** —
each transition is logged from a separate `node --input-type=module -e "..."` between
tool calls. The in-process Map does not survive process exit, so by the time
`task_end` fires in a fresh process, the Map is empty: the helper falls through to its
"no matching task_start" branch (`event-log.mjs:70-71`) and **omits `actual_minutes`**.

Observed in production across both runs that used the multi-process pattern:

| Run | task_end entries | `actual_minutes` present? |
| --- | --- | --- |
| `2026-05-24-clarify-rule-9` | 2 | no (omitted) |
| `2026-05-24-item-3-hsts-verdict` | 4 | no (omitted) |

The ISO `ts` fields are accurate, so durations are recoverable by a downstream pass
that pairs `task_start`/`task_end` by `task_id`. But `actual_minutes` is the headline
metric the 2026-05-23 timing-audit fix introduced (and is the field a quick
`jq`/one-liner reads), so leaving it null defeats the point. The fix: persist the open
`task_start` timestamps to disk, keyed by `runId`, so a later process can read them.

**Non-goal reminder:** the 2026-05-23 fix forbids callers from passing
`actual_minutes` themselves (to prevent fabricated durations). This spec preserves that
guard — `actual_minutes` is still always helper-computed, never caller-supplied. The
only change is *where* the start timestamp is read from (disk vs in-process Map).

---

## 2. Design

### 2.1 State file location and schema

One state file per run, alongside the NDJSON log:

```
.audit-working/runs/{runId}.state.json
```

Schema:

```jsonc
{
  "run_id": "2026-05-24-item-3-hsts-verdict",
  "open_tasks": {
    "<task_id>": { "task_start_ts": 1748102446163 }
  }
}
```

- `open_tasks` is keyed by `task_id` (the same join key as the NDJSON log).
- `task_start_ts` is `Date.now()` epoch-millis at the moment `task_start` was logged —
  the identical value the in-process Map stores today, so duration arithmetic is
  unchanged.
- `run_id` is carried in the file for human/debug legibility; the authoritative key is
  the filename.
- A task appears in `open_tasks` between its `task_start` and its `task_end`. A
  well-formed run ends with `open_tasks` empty (or the file removed — see lifecycle).

### 2.2 Lifecycle

| Event | State-file effect |
| --- | --- |
| `session_start` | none (no task open yet). File is **not** required to exist before the first `task_start`. |
| `task_start` | read state (or `{open_tasks:{}}` if absent) → set `open_tasks[task_id] = { task_start_ts: now }` → write. |
| `task_end` | read state → look up `open_tasks[task_id]`. If found: compute `actual_minutes` from `now - task_start_ts`, then `delete open_tasks[task_id]` and write. If absent: omit `actual_minutes`, log a line, no throw (§2.5). |
| `pause_for_input` / `resume` / `commit` / `error` | none. |
| `session_end` | **delete** the state file (default). Open tasks remaining at `session_end` are abnormal; see §2.3 / §6. |

Rationale for delete-on-`session_end`: a clean run leaves no orphan state. The NDJSON
log is the durable record; the state file is ephemeral scratch that only needs to live
for the duration of the run. Deleting it keeps `.audit-working/runs/` from
accumulating stale `.state.json` files.

**Alternative considered (not chosen):** mark the file `"closed": true` instead of
deleting. Rejected — it leaves litter with no consumer. If post-hoc inspection of which
tasks were open at close is ever wanted, that is reconstructable from the NDJSON log
(any `task_start` without a matching `task_end`). If the supervisor prefers
mark-closed over delete, it is a one-line change at sign-off.

### 2.3 Concurrency

**Out of scope for the supported use case.** The logger is driven by one synchronous
`node` process at a time (CC's tool calls are serialized; each `logEvent` invocation
runs to completion before the next starts). There is no concurrent writer.

Documented behavior: **last-write-wins.** Each `logEvent` does a full read → mutate →
write of the state file; there is no read-modify-write lock. If two processes ever
raced (not a supported scenario), the later writer's full object would clobber the
earlier's. We do not defend against this. Two distinct `runId`s never contend — they
use different files.

### 2.4 Atomicity

Use the **temp-file + atomic rename** pattern so a crash mid-write cannot leave a
truncated/corrupt state file:

1. Serialize the new state object.
2. Write to `.audit-working/runs/.{runId}.state.json.tmp` (dotfile temp, same dir so
   `rename` is atomic on the same filesystem).
3. `fs.renameSync(tmp, final)` — atomic replace on POSIX.

This mirrors the crash-safety intent of the NDJSON log's `appendFileSync` (atomic
append). Note the NDJSON log and the state file are written in the same `logEvent`
call; order them **state-write first, then NDJSON append** so that if the process dies
between the two, the durable NDJSON record is never ahead of the state (a missing
NDJSON line is more recoverable than a state file claiming a task is open/closed when
the log disagrees). At sign-off we can flip this if the reviewer prefers log-first;
the failure windows are tiny either way.

### 2.5 Backwards compatibility

- **Missing state file is normal, not an error.** `task_start` creates it if absent;
  `task_end` treats absence (or a missing `open_tasks[task_id]`) exactly as today's
  empty-Map branch: omit `actual_minutes`, emit a single stderr log line
  (`event-log: no open task_start for "<task_id>" in run <runId>; actual_minutes omitted`),
  do **not** throw.
- **Pre-existing runs** (`2026-05-23-autonomous-chain`, `2026-05-24-clarify-rule-9`,
  `2026-05-24-item-3-hsts-verdict`) have no `.state.json` and are never revisited —
  forward-only (§4).
- **Single-process callers** (a script that calls `logEvent` multiple times in one
  process, e.g. a future autonomous chain that imports the helper directly) keep
  working. The in-process Map is retained as a **fast-path / fallback** (§3): if the
  Map has the start ts, it is used; otherwise the disk state is consulted. This means
  single-process runs do not even need the disk file to get `actual_minutes`, and the
  disk file is what rescues multi-process runs. Keeping both is belt-and-suspenders and
  preserves all current single-process selftest behavior unchanged.

---

## 3. Helper API changes (`scripts/lib/event-log.mjs`)

**Public signature is unchanged:** `logEvent(runId, event, fields)`,
`logPath(runId)`, `_resetForTests()` all keep their current signatures. No new public
exports are required (a `statePath(runId)` export is optional, listed below).

| Function | Change |
| --- | --- |
| `logEvent` (`:42`) | In the `task_start` branch (`:53-57`): after `taskStartTimes.set(...)`, also write the start ts to disk state via `_writeState` (read-merge-write `open_tasks[task_id]`). In the `task_end` branch (`:58-72`): resolve the start ts as **`taskStartTimes.get(task_id) ?? _readState(runId).open_tasks[task_id]?.task_start_ts`**; if found, compute `actual_minutes` and clear it from **both** the Map and disk state; if not found, the existing omit-and-continue behavior plus the §2.5 stderr line. Add a `session_end` branch that calls `_deleteState(runId)`. The `actual_minutes`-rejection guard (`:62-64`) is **unchanged**. |
| `logPath` (`:79`) | unchanged. |
| `_resetForTests` (`:84`) | extend to also delete any test state files it knows about, or accept that tests call `_deleteState` explicitly. Keeps the in-process Map clear as today. |

New internal (non-exported) helpers:

| Helper | Responsibility |
| --- | --- |
| `_statePath(runId)` | `resolve(RUNS_DIR, \`${runId}.state.json\`)`. |
| `_readState(runId)` | Return parsed state, or `{ run_id: runId, open_tasks: {} }` if the file is missing or unparseable (corrupt file → treat as empty + stderr warn; do not throw). |
| `_writeState(runId, state)` | `mkdirSync(RUNS_DIR,{recursive:true})` then temp-file + atomic rename (§2.4). |
| `_deleteState(runId)` | `rmSync(path,{force:true})` — no error if absent. |

Optional export: `statePath(runId)` (public mirror of `_statePath`) if selftests or
downstream tooling want to assert the path. Low cost; include only if the reviewer
wants it.

New import needed: `renameSync`, `readFileSync`, `rmSync` from `node:fs` (currently
only `appendFileSync`, `mkdirSync` are imported at `:19`).

---

## 4. Migration / forward-only basis

The state file applies **forward only.** Existing runs are left exactly as they are:

- `2026-05-23-autonomous-chain` — already has `actual_minutes` where it ran
  single-process; unchanged.
- `2026-05-24-clarify-rule-9` and `2026-05-24-item-3-hsts-verdict` — `actual_minutes`
  stays omitted; their ISO timestamps remain the recovery path. **Not** back-filled —
  reconstructing and writing durations after the fact would manufacture data the
  2026-05-23 fix exists to prevent, and there is no behavioral reason to rewrite closed
  logs.

This is the same forward-only framing already used for (a) the Rule #9 rescope
(2026-05-24 — prior tasks are the documented frozen baseline, not retro-logged) and
(b) the Tier 1/2/3 source-grounding framework (applies forward from the G packet; D2
and earlier remain the frozen baseline). Consistency of convention is intentional.

---

## 5. Selftest plan

Add an in-file `--selftest` (or extend the existing test harness) using a temp `runId`
like `selftest-<pid>` and cleaning up state + log files afterward. Fixtures, at
minimum:

1. **Single-process round-trip (no regression).** `task_start` then `task_end` in the
   same process. Assert `actual_minutes` present and ≈ elapsed (use a small injected or
   tolerant delta). Confirms the in-process fast-path is unbroken.
2. **Multi-process round-trip (the fix).** Simulate process boundary by calling
   `_resetForTests()` (clears the Map) **between** `task_start` and `task_end`, leaving
   only disk state. Assert `task_end` reads `task_start_ts` from disk and writes a
   non-null `actual_minutes`. This is the core regression guard for the reported bug.
   - To make the duration deterministic, allow the test to seed `task_start_ts` in the
     state file to a known past value (e.g. write state with `now - 120000`) and assert
     `actual_minutes === 2.0`.
3. **Missing-state-file fallback.** `task_end` for a `task_id` with no Map entry and no
   state file (or no matching `open_tasks` key). Assert: `actual_minutes` omitted from
   the NDJSON entry, one stderr line emitted, **no throw**, entry still written.
4. **`session_end` cleanup.** After a full `session_start → task_start → task_end →
   session_end` sequence, assert the `.state.json` file is gone (or `closed:true` if
   that variant is chosen) and `open_tasks` was empty before deletion.
5. **Atomicity smoke (optional but cheap).** After a `task_start`, assert no
   `.{runId}.state.json.tmp` leftover exists (rename consumed it).
6. **`actual_minutes`-rejection guard still bites.** `task_end` with caller-passed
   `actual_minutes` still throws (unchanged behavior — guard at `:62-64`).

Self-test must report `N PASS, 0 FAIL` like the existing `validate-questions.mjs`
selftest, and clean up all temp `selftest-*` artifacts in `.audit-working/runs/`.

---

## 6. Out of scope

- **Concurrent multi-task / parallel writers** within one `runId` — single-process-
  per-event serialized use only; last-write-wins documented, not defended (§2.3).
- **Distributed / multi-host runs** — single local filesystem only.
- **Recovery from a crashed mid-task state** — if a process dies after `task_start`
  writes state but the run is never resumed, the orphan `open_tasks` entry and
  `.state.json` are left behind. No reaper/GC is specified. (A future cleanup could
  delete `.state.json` files older than N days, but not in this change.)
- **Back-filling closed runs** (§4) — explicitly not done.
- **Changing the NDJSON schema or the eight event types** — unchanged.
- **Nested/sub-tasks or overlapping tasks sharing a `task_id`** — `task_id` is assumed
  unique per open interval, as today.

---

## 7. Implementation estimate

Post-sign-off, rough effort:

| Work | Estimate |
| --- | --- |
| Core helper changes (`_statePath`/`_readState`/`_writeState`/`_deleteState`, wire into `task_start`/`task_end`/`session_end`, new imports) | ~25 min |
| `--selftest` fixtures (6 above) + cleanup harness | ~25 min |
| Smoke-run a real multi-process sequence + verify `actual_minutes` lands; update CLAUDE.md Rule #9 note + this doc's status to SHIPPED | ~10 min |
| **Total** | **~60 min** (one focused session) |

No new dependencies (pure `node:fs`). Risk is low and contained to the helper; the
public signature and NDJSON output shape are unchanged except that multi-process
`task_end` entries gain a non-null `actual_minutes`.
