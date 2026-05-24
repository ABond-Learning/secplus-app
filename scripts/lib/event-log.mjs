// Append-only NDJSON event log for supervisor-directed CC tasks.
//
// Per CLAUDE.md Workflow Rule #9 — log state transitions, not granular
// actions. One file per runId at `.audit-working/runs/{runId}.eventlog.ndjson`.
// Pure node:fs (child_process is used only by --selftest). Atomic append via
// `appendFileSync`.
//
// task_id is the join key: task_start emits {task_id, task_name?, ...} and
// stores Date.now() in (a) a module-level Map keyed by task_id AND (b) a
// per-run state file `.audit-working/runs/{runId}.state.json`. task_end emits
// {task_id, ...} and the helper computes actual_minutes from the timestamp
// delta, resolving the start ts from the Map (fast-path) or the state file
// (cross-process rescue). CALLERS MUST NOT pass actual_minutes on task_end —
// helper rejects it. task_name is free-form and need not match between
// task_start and task_end.
//
// Cross-process capture: CC drives the helper as one `node` invocation per
// logEvent, so the in-process Map is dead by the time task_end fires in a
// fresh process. The disk state file carries task_start_ts across that
// boundary so actual_minutes lands on multi-process task_end entries too.
// See docs/event-log-persistent-state-spec.md.
//
// Write ordering (spec §2.4): NDJSON append FIRST, then the state write. The
// NDJSON log is the durable record; the state file is ephemeral scratch. A
// crash between the two leaves recoverable orphan state, never an
// unrecoverable hole in the durable timeline.

import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
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
// task_end. Fast-path for single-process callers; does NOT survive process
// exit (the disk state file covers that — see _readState/_writeState).
const taskStartTimes = new Map();

// --- internal state-file helpers (not exported) ---------------------------

function _statePath(runId) {
  return resolve(RUNS_DIR, `${runId}.state.json`);
}

// Return parsed state, or a fresh empty shape if the file is missing or
// unparseable. A missing file is normal (ENOENT, no warn). A corrupt file is
// treated as empty + a stderr warn — never a throw (spec §2.5).
function _readState(runId) {
  let raw;
  try {
    raw = readFileSync(_statePath(runId), "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return { run_id: runId, open_tasks: {} };
    }
    process.stderr.write(
      `event-log: could not read state for run ${runId} (${err && err.message}); treating as empty\n`,
    );
    return { run_id: runId, open_tasks: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.open_tasks !== "object" ||
      parsed.open_tasks === null
    ) {
      throw new Error("malformed state shape");
    }
    return { run_id: parsed.run_id ?? runId, open_tasks: parsed.open_tasks };
  } catch (err) {
    process.stderr.write(
      `event-log: corrupt state file for run ${runId} (${err && err.message}); treating as empty\n`,
    );
    return { run_id: runId, open_tasks: {} };
  }
}

// Atomic write: temp dotfile in the same dir + renameSync (spec §2.4).
function _writeState(runId, state) {
  mkdirSync(RUNS_DIR, { recursive: true });
  const tmp = resolve(RUNS_DIR, `.${runId}.state.json.tmp`);
  writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
  renameSync(tmp, _statePath(runId));
}

function _deleteState(runId) {
  rmSync(_statePath(runId), { force: true });
}

// --- public API ------------------------------------------------------------

export function logEvent(runId, event, fields = {}) {
  if (!runId || typeof runId !== "string") {
    throw new Error("logEvent: runId required (string)");
  }
  if (!KNOWN_EVENTS.has(event)) {
    throw new Error(`logEvent: unknown event "${event}" (expected one of ${[...KNOWN_EVENTS].join(", ")})`);
  }

  const now = Date.now();
  const augmented = { ...fields };

  // Validation + actual_minutes computation run BEFORE any write so a bad call
  // throws without emitting. Disk-state mutation runs AFTER the NDJSON append
  // (spec §2.4: NDJSON-first).
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
    // Resolve start ts: in-process Map fast-path, else disk state (the
    // cross-process rescue). ?? only falls through on null/undefined.
    const startMs =
      taskStartTimes.get(fields.task_id) ??
      _readState(runId).open_tasks[fields.task_id]?.task_start_ts;
    if (startMs != null) {
      augmented.actual_minutes = Math.round(((now - startMs) / 60000) * 10) / 10;
    } else {
      process.stderr.write(
        `event-log: no open task_start for "${fields.task_id}" in run ${runId}; actual_minutes omitted\n`,
      );
    }
  }

  // 1. Durable record first.
  mkdirSync(RUNS_DIR, { recursive: true });
  const entry = { ts: new Date(now).toISOString(), event, ...augmented };
  appendFileSync(resolve(RUNS_DIR, `${runId}.eventlog.ndjson`), JSON.stringify(entry) + "\n", "utf8");

  // 2. Ephemeral state second (spec §2.2 lifecycle).
  if (event === "task_start") {
    const state = _readState(runId);
    state.open_tasks[fields.task_id] = { task_start_ts: now };
    _writeState(runId, state);
  } else if (event === "task_end") {
    taskStartTimes.delete(fields.task_id);
    const state = _readState(runId);
    if (state.open_tasks[fields.task_id]) {
      delete state.open_tasks[fields.task_id];
      _writeState(runId, state);
    }
  } else if (event === "session_end") {
    _deleteState(runId);
  }
}

export function logPath(runId) {
  return resolve(RUNS_DIR, `${runId}.eventlog.ndjson`);
}

// Test-only: clear the in-process Map (simulates the in-process fast-path
// being unavailable). Does NOT touch disk state.
export function _resetForTests() {
  taskStartTimes.clear();
}

// --- selftest ---------------------------------------------------------------
// Run: `node scripts/lib/event-log.mjs --selftest`
// Guarded so importing the module (incl. the cross-process child invocations
// below, which run via `-e` without this flag) never triggers it.

if (process.argv.includes("--selftest")) {
  const { execSync } = await import("node:child_process");
  const { existsSync, readdirSync } = await import("node:fs");

  let pass = 0;
  const failures = [];
  const ok = (cond, name) => {
    if (cond) pass++;
    else failures.push(name);
  };
  const lastEntry = (runId) => {
    const lines = readFileSync(logPath(runId), "utf8").trim().split("\n");
    return JSON.parse(lines[lines.length - 1]);
  };
  // Capture process.stderr.write while running fn; return array of strings.
  const captureStderr = (fn) => {
    const orig = process.stderr.write.bind(process.stderr);
    const lines = [];
    process.stderr.write = (chunk, ...rest) => {
      lines.push(String(chunk));
      return true;
    };
    try {
      fn();
    } finally {
      process.stderr.write = orig;
    }
    return lines;
  };

  const PID = process.pid;
  const HELPER = fileURLToPath(import.meta.url);
  const runIds = new Set();
  const RUN = (suffix) => {
    const id = `selftest-${PID}-${suffix}`;
    runIds.add(id);
    return id;
  };

  // Fixture 1 — single-process round-trip (no regression; fast-path).
  {
    const runId = RUN("single");
    _resetForTests();
    logEvent(runId, "task_start", { task_id: "t1" });
    logEvent(runId, "task_end", { task_id: "t1" });
    const e = lastEntry(runId);
    ok(typeof e.actual_minutes === "number", "1: single-process actual_minutes present (number)");
    ok(e.actual_minutes >= 0, "1: single-process actual_minutes non-negative");
  }

  // Fixture 2 — REAL multi-process round-trip (the fix). Process A writes
  // task_start then seeds task_start_ts to now-120000 in the state file;
  // process B (fresh node, dead Map) writes task_end and must read the disk
  // ts, yielding actual_minutes === 2.0.
  {
    const runId = RUN("xproc");
    const statePath = _statePath(runId);
    const codeA =
      `import { logEvent } from "${HELPER}";` +
      `import { readFileSync, writeFileSync } from "node:fs";` +
      `logEvent("${runId}", "task_start", { task_id: "xp" });` +
      `const st = JSON.parse(readFileSync("${statePath}", "utf8"));` +
      `st.open_tasks["xp"].task_start_ts = Date.now() - 120000;` +
      `writeFileSync("${statePath}", JSON.stringify(st), "utf8");`;
    const codeB =
      `import { logEvent } from "${HELPER}";` +
      `logEvent("${runId}", "task_end", { task_id: "xp" });`;
    execSync(`node --input-type=module -e '${codeA}'`, { stdio: "pipe" });
    const mapWasDead = !taskStartTimes.has("xp"); // parent never saw the child's Map
    execSync(`node --input-type=module -e '${codeB}'`, { stdio: "pipe" });
    const e = lastEntry(runId);
    ok(mapWasDead, "2: parent Map has no entry from child process (real boundary)");
    ok(e.event === "task_end" && e.actual_minutes === 2.0, "2: cross-process actual_minutes === 2.0 from disk");
  }

  // Fixture 3 — missing-state-file fallback. No Map entry, no state file.
  {
    const runId = RUN("missing");
    _resetForTests();
    _deleteState(runId);
    let threw = false;
    const stderr = captureStderr(() => {
      try {
        logEvent(runId, "task_end", { task_id: "ghost" });
      } catch {
        threw = true;
      }
    });
    const e = lastEntry(runId);
    ok(!threw, "3: missing-state task_end does not throw");
    ok(!("actual_minutes" in e), "3: missing-state task_end omits actual_minutes");
    ok(
      stderr.length === 1 && stderr[0].includes('no open task_start for "ghost"'),
      "3: exactly one stderr warn emitted",
    );
    ok(!existsSync(_statePath(runId)), "3: no state file created by missing-state task_end");
  }

  // Fixture 4 — session_end cleanup.
  {
    const runId = RUN("cleanup");
    _resetForTests();
    logEvent(runId, "session_start", { run_id: runId });
    logEvent(runId, "task_start", { task_id: "t4" });
    logEvent(runId, "task_end", { task_id: "t4" });
    const beforeEnd = _readState(runId);
    ok(Object.keys(beforeEnd.open_tasks).length === 0, "4: open_tasks empty before session_end");
    logEvent(runId, "session_end", { outcome: "ok", total_commits: 0 });
    ok(!existsSync(_statePath(runId)), "4: state file deleted on session_end");
  }

  // Fixture 5 — atomicity: no temp file leftover after task_start.
  {
    const runId = RUN("atomic");
    _resetForTests();
    logEvent(runId, "task_start", { task_id: "t5" });
    const tmp = resolve(RUNS_DIR, `.${runId}.state.json.tmp`);
    ok(!existsSync(tmp), "5: no .tmp leftover after task_start (rename consumed it)");
    ok(existsSync(_statePath(runId)), "5: state file present after task_start");
  }

  // Fixture 6 — actual_minutes-rejection guard still bites.
  {
    const runId = RUN("guard");
    _resetForTests();
    logEvent(runId, "task_start", { task_id: "t6" });
    let threw = false;
    try {
      logEvent(runId, "task_end", { task_id: "t6", actual_minutes: 99 });
    } catch {
      threw = true;
    }
    ok(threw, "6: caller-passed actual_minutes still throws");
  }

  // Cleanup — remove all selftest-* artifacts (ndjson, state, stray tmp).
  for (const f of readdirSync(RUNS_DIR)) {
    if (f.includes(`selftest-${PID}-`)) {
      rmSync(resolve(RUNS_DIR, f), { force: true });
    }
  }

  console.log(`event-log selftest: ${pass} PASS, ${failures.length} FAIL`);
  if (failures.length > 0) {
    for (const f of failures) console.log(`  FAIL: ${f}`);
    process.exit(1);
  }
}
