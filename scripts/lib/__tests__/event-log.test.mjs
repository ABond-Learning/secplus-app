// Smoke tests for scripts/lib/event-log.mjs.
//
// Covers the task_id join key + auto-computed actual_minutes contract added
// 2026-05-23 after the timing-audit one-liner caught fictional manually-
// passed actual_minutes values across the autonomous chain.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { logEvent, logPath, _resetForTests } from "../event-log.mjs";

const RUN_ID = "event-log-test-run";

function readEntries() {
  const path = logPath(RUN_ID);
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").trim().split("\n").map(JSON.parse);
}

function reset() {
  _resetForTests();
  const path = logPath(RUN_ID);
  if (existsSync(path)) unlinkSync(path);
}

test("logEvent: rejects unknown runId", () => {
  reset();
  assert.throws(() => logEvent("", "session_start"), /runId required/);
  assert.throws(() => logEvent(null, "session_start"), /runId required/);
});

test("logEvent: rejects unknown event type", () => {
  reset();
  assert.throws(() => logEvent(RUN_ID, "blarg", {}), /unknown event/);
});

test("logEvent: writes session_start with ISO timestamp Z", () => {
  reset();
  logEvent(RUN_ID, "session_start", { run_id: RUN_ID, chain_topic: "test" });
  const e = readEntries();
  assert.equal(e.length, 1);
  assert.equal(e[0].event, "session_start");
  assert.match(e[0].ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("task_start: requires task_id", () => {
  reset();
  assert.throws(() => logEvent(RUN_ID, "task_start", {}), /task_start requires task_id/);
  assert.throws(() => logEvent(RUN_ID, "task_start", { task_id: "" }), /task_start requires task_id/);
  assert.throws(() => logEvent(RUN_ID, "task_start", { task_id: 123 }), /task_start requires task_id/);
});

test("task_end: requires task_id", () => {
  reset();
  assert.throws(() => logEvent(RUN_ID, "task_end", {}), /task_end requires task_id/);
});

test("task_end: rejects manually-passed actual_minutes", () => {
  reset();
  logEvent(RUN_ID, "task_start", { task_id: "t1" });
  assert.throws(
    () => logEvent(RUN_ID, "task_end", { task_id: "t1", actual_minutes: 5 }),
    /must not pass actual_minutes/
  );
});

test("task_end: computes actual_minutes from task_start timestamp", async () => {
  reset();
  logEvent(RUN_ID, "task_start", { task_id: "t1", task_name: "first" });
  // Sleep ~120ms so the delta is non-zero
  await new Promise(r => setTimeout(r, 120));
  logEvent(RUN_ID, "task_end", { task_id: "t1", result: "PASS" });
  const e = readEntries();
  assert.equal(e.length, 2);
  assert.equal(e[1].event, "task_end");
  assert.ok(typeof e[1].actual_minutes === "number", "actual_minutes injected");
  assert.ok(e[1].actual_minutes >= 0, "actual_minutes non-negative");
  // 120ms = 0.002min, rounds to 0 at 1-decimal precision — both 0 and 0.1 OK
  assert.ok(e[1].actual_minutes <= 0.1, `actual_minutes should be small, got ${e[1].actual_minutes}`);
});

test("task_id: join key — task_name can differ between start and end", () => {
  reset();
  logEvent(RUN_ID, "task_start", { task_id: "t2", task_name: "verbose start description" });
  logEvent(RUN_ID, "task_end", { task_id: "t2", task_name: "terse end", result: "PASS" });
  const e = readEntries();
  assert.equal(e.length, 2);
  assert.ok(typeof e[1].actual_minutes === "number", "actual_minutes injected despite name mismatch");
});

test("task_end: no matching task_start → no actual_minutes injected", () => {
  reset();
  // No prior task_start for "t3" in this process
  logEvent(RUN_ID, "task_end", { task_id: "t3", result: "orphan task_end" });
  const e = readEntries();
  assert.equal(e.length, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(e[0], "actual_minutes"), false);
});

test("multiple concurrent task_ids: independent timers", async () => {
  reset();
  logEvent(RUN_ID, "task_start", { task_id: "ta" });
  await new Promise(r => setTimeout(r, 50));
  logEvent(RUN_ID, "task_start", { task_id: "tb" });
  await new Promise(r => setTimeout(r, 80));
  logEvent(RUN_ID, "task_end", { task_id: "ta", result: "PASS" });
  logEvent(RUN_ID, "task_end", { task_id: "tb", result: "PASS" });
  const e = readEntries();
  // task_end for "ta" had ~130ms total → ~0 at 1-decimal
  // task_end for "tb" had ~80ms total → ~0 at 1-decimal
  // Just verify both have actual_minutes injected
  const ends = e.filter(x => x.event === "task_end");
  assert.equal(ends.length, 2);
  assert.ok(ends.every(x => typeof x.actual_minutes === "number"));
});

test("non-task events: unaffected by task_id rules", () => {
  reset();
  logEvent(RUN_ID, "commit", { hash: "abc1234", subject: "test commit" });
  logEvent(RUN_ID, "error", { where: "test", msg: "synthetic" });
  logEvent(RUN_ID, "pause_for_input", { reason: "test" });
  logEvent(RUN_ID, "resume", { trigger: "test" });
  logEvent(RUN_ID, "session_end", { outcome: "ok", total_commits: 1 });
  const e = readEntries();
  assert.equal(e.length, 5);
  // None of these should have actual_minutes
  assert.ok(e.every(x => !Object.prototype.hasOwnProperty.call(x, "actual_minutes")));
});

// Final cleanup
test("cleanup", () => {
  reset();
});
