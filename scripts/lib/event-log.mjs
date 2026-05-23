// Append-only NDJSON event log for autonomous chains.
//
// Per CLAUDE.md Workflow Rule #9 — log state transitions, not granular
// actions. One file per runId at `.audit-working/runs/{runId}.eventlog.ndjson`.
// Pure node:fs; no dependencies. Atomic append via `appendFileSync`.
//
// task_id is the join key: task_start emits {task_id, task_name?, ...} and
// stores Date.now() in a module-level Map keyed by task_id. task_end emits
// {task_id, ...} and the helper computes actual_minutes from the timestamp
// delta. CALLERS MUST NOT pass actual_minutes on task_end — helper rejects
// it. task_name is free-form description and does not need to match between
// task_start and task_end.
//
// Restart caveat: the in-process Map is lost on process exit. A task_end
// fired in a new process for a task_start from a prior process will skip
// the actual_minutes injection (downstream audit recomputes from raw
// timestamps).

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = resolve(HERE, "..", "..", ".audit-working", "runs");

const KNOWN_EVENTS = new Set([
  "session_start",
  "task_start",
  "task_end",
  "pause_for_input",
  "resume",
  "commit",
  "error",
  "session_end",
]);

// In-process Map<task_id, start_ts_ms> populated on task_start, drained on
// task_end. Survives multiple logEvent calls within one process; does NOT
// survive process exit.
const taskStartTimes = new Map();

export function logEvent(runId, event, fields = {}) {
  if (!runId || typeof runId !== "string") {
    throw new Error("logEvent: runId required (string)");
  }
  if (!KNOWN_EVENTS.has(event)) {
    throw new Error(`logEvent: unknown event "${event}" (expected one of ${[...KNOWN_EVENTS].join(", ")})`);
  }

  const now = Date.now();
  const augmented = { ...fields };

  if (event === "task_start") {
    if (!fields.task_id || typeof fields.task_id !== "string") {
      throw new Error("logEvent: task_start requires task_id (non-empty string)");
    }
    taskStartTimes.set(fields.task_id, now);
  } else if (event === "task_end") {
    if (!fields.task_id || typeof fields.task_id !== "string") {
      throw new Error("logEvent: task_end requires task_id (non-empty string)");
    }
    if (Object.prototype.hasOwnProperty.call(fields, "actual_minutes")) {
      throw new Error("logEvent: callers must not pass actual_minutes on task_end — helper computes it from task_start timestamp");
    }
    const startMs = taskStartTimes.get(fields.task_id);
    if (startMs != null) {
      augmented.actual_minutes = Math.round(((now - startMs) / 60000) * 10) / 10;
      taskStartTimes.delete(fields.task_id);
    }
    // else: no matching task_start in this process — leave actual_minutes
    // out and let any downstream audit compute it from raw timestamps.
  }

  mkdirSync(RUNS_DIR, { recursive: true });
  const entry = { ts: new Date(now).toISOString(), event, ...augmented };
  appendFileSync(resolve(RUNS_DIR, `${runId}.eventlog.ndjson`), JSON.stringify(entry) + "\n", "utf8");
}

export function logPath(runId) {
  return resolve(RUNS_DIR, `${runId}.eventlog.ndjson`);
}

// Test-only: clear the in-process Map (smoke tests that simulate restart).
export function _resetForTests() {
  taskStartTimes.clear();
}
