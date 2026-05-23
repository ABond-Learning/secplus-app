// Append-only NDJSON event log for autonomous chains.
//
// Per CLAUDE.md Workflow Rule #8 — log state transitions, not granular
// actions. One file per runId at `.audit-working/runs/{runId}.eventlog.ndjson`.
// Pure node:fs; no dependencies. Atomic append via `appendFileSync`.

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

export function logEvent(runId, event, fields = {}) {
  if (!runId || typeof runId !== "string") {
    throw new Error("logEvent: runId required (string)");
  }
  if (!KNOWN_EVENTS.has(event)) {
    throw new Error(`logEvent: unknown event "${event}" (expected one of ${[...KNOWN_EVENTS].join(", ")})`);
  }
  mkdirSync(RUNS_DIR, { recursive: true });
  const entry = { ts: new Date().toISOString(), event, ...fields };
  appendFileSync(resolve(RUNS_DIR, `${runId}.eventlog.ndjson`), JSON.stringify(entry) + "\n", "utf8");
}

export function logPath(runId) {
  return resolve(RUNS_DIR, `${runId}.eventlog.ndjson`);
}
