// Run with: node --test src/sync/__tests__/sync-engine.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isLocalOnly,
  isTracked,
  scanTrackedKeys,
  buildLocalEntries,
  mergeEntries,
  applyMergedEntries,
  buildPayload,
  parsePayload,
  PAYLOAD_SCHEMA_VERSION,
} from "../sync-engine.js";

// In-memory storage that quacks like Web Storage (length, key(i), getItem,
// setItem, removeItem). Keeps insertion order, which matches localStorage.
function makeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    key(i) {
      const arr = [...data.keys()];
      return i >= 0 && i < arr.length ? arr[i] : null;
    },
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    _entries() { return Object.fromEntries(data); },
  };
}

// ─── Classification ────────────────────────────────────────────

test("isTracked covers all SY0-701 SM-2 prefixes", () => {
  assert.equal(isTracked("mc-1.1.1-0"), true);
  assert.equal(isTracked("scen-1.2.3-5"), true);
  assert.equal(isTracked("match-2.3.4"), true);
  assert.equal(isTracked("secplus-v4"), true);
});

test("isTracked rejects non-app keys", () => {
  assert.equal(isTracked("randomKey"), false);
  assert.equal(isTracked(""), false);
  assert.equal(isTracked("anki-deck-1"), false);
});

test("isLocalOnly catches both prefix and exact rules", () => {
  assert.equal(isLocalOnly("secplus-sync-config"), true);
  assert.equal(isLocalOnly("secplus-sync-meta"), true);
  assert.equal(isLocalOnly("secplus-sync-pat"), true);
  assert.equal(isLocalOnly("secplus-last-backup-at"), true);
  assert.equal(isLocalOnly("secplus-backup-banner-snooze-until"), true);
  assert.equal(isLocalOnly("secplus-v4"), false);
  assert.equal(isLocalOnly("mc-1.1.1-0"), false);
});

test("LOCAL_ONLY overrides TRACKED_PREFIXES (deny-list wins)", () => {
  // secplus-sync-config has the secplus- prefix AND is in LOCAL_ONLY.
  // The deny-list must override the prefix list.
  assert.equal(isTracked("secplus-sync-config"), false);
  assert.equal(isTracked("secplus-sync-meta"), false);
  assert.equal(isTracked("secplus-last-backup-at"), false);
  assert.equal(isTracked("secplus-backup-banner-snooze-until"), false);
});

// ─── scanTrackedKeys ───────────────────────────────────────────

test("scanTrackedKeys returns tracked keys, skips local-only and untracked", () => {
  const storage = makeStorage({
    "mc-1.1.1-0": "{}",
    "scen-2.3.4-1": "{}",
    "match-3.1.1": "{}",
    "secplus-v4": "abc",
    "secplus-sync-config": "leaked-config",
    "secplus-sync-meta": "leaked-meta",
    "secplus-last-backup-at": "1700000000000",
    "secplus-backup-banner-snooze-until": "1700000000000",
    "unrelated-key": "x",
  });
  const out = scanTrackedKeys(storage);
  assert.deepEqual(
    Object.keys(out).sort(),
    ["match-3.1.1", "mc-1.1.1-0", "scen-2.3.4-1", "secplus-v4"]
  );
});

test("scanTrackedKeys handles empty storage and null storage", () => {
  assert.deepEqual(scanTrackedKeys(makeStorage()), {});
  assert.deepEqual(scanTrackedKeys(null), {});
});

// ─── mergeEntries ──────────────────────────────────────────────

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-01T00:00:00.000Z";
const T3 = "2026-03-01T00:00:00.000Z";

test("mergeEntries: empty local + remote populated → all remote", () => {
  const remote = { "mc-1.1.1-0": { value: "A", ts: T1 } };
  assert.deepEqual(mergeEntries({}, remote), remote);
});

test("mergeEntries: empty remote + local populated → all local", () => {
  const local = { "mc-1.1.1-0": { value: "A", ts: T1 } };
  assert.deepEqual(mergeEntries(local, {}), local);
});

test("mergeEntries: remote newer per-key → remote wins", () => {
  const local = { "mc-1.1.1-0": { value: "L", ts: T1 } };
  const remote = { "mc-1.1.1-0": { value: "R", ts: T2 } };
  assert.deepEqual(mergeEntries(local, remote), remote);
});

test("mergeEntries: local newer per-key → local wins", () => {
  const local = { "mc-1.1.1-0": { value: "L", ts: T3 } };
  const remote = { "mc-1.1.1-0": { value: "R", ts: T2 } };
  assert.deepEqual(mergeEntries(local, remote), local);
});

test("mergeEntries: tie → local wins (stability tie-break)", () => {
  const local = { "mc-1.1.1-0": { value: "L", ts: T1 } };
  const remote = { "mc-1.1.1-0": { value: "R", ts: T1 } };
  assert.deepEqual(mergeEntries(local, remote), local);
});

test("mergeEntries: keys present on only one side are kept verbatim", () => {
  const local = { "mc-1.1.1-0": { value: "L", ts: T1 } };
  const remote = { "scen-2.3.4-0": { value: "R", ts: T2 } };
  const merged = mergeEntries(local, remote);
  assert.deepEqual(Object.keys(merged).sort(), ["mc-1.1.1-0", "scen-2.3.4-0"]);
  assert.deepEqual(merged["mc-1.1.1-0"], local["mc-1.1.1-0"]);
  assert.deepEqual(merged["scen-2.3.4-0"], remote["scen-2.3.4-0"]);
});

test("mergeEntries: drops LOCAL_ONLY keys injected via remote (defence)", () => {
  const local = {};
  const remote = {
    "mc-1.1.1-0": { value: "ok", ts: T1 },
    "secplus-sync-pat": { value: "leaked-pat", ts: T1 },
    "secplus-sync-config": { value: "leaked-config", ts: T1 },
    "secplus-last-backup-at": { value: "leaked", ts: T1 },
    "secplus-backup-banner-snooze-until": { value: "leaked", ts: T1 },
  };
  const merged = mergeEntries(local, remote);
  assert.deepEqual(Object.keys(merged), ["mc-1.1.1-0"]);
});

test("mergeEntries: handles many keys, mixed ownership", () => {
  const local = {
    "mc-1.1.1-0": { value: "L1", ts: T1 },
    "mc-1.1.1-1": { value: "L2", ts: T3 },
    "scen-1.2.3-0": { value: "L3", ts: T2 },
  };
  const remote = {
    "mc-1.1.1-0": { value: "R1", ts: T2 }, // remote newer
    "mc-1.1.1-1": { value: "R2", ts: T1 }, // local newer
    "match-2.3.4": { value: "R3", ts: T1 }, // remote-only
  };
  const merged = mergeEntries(local, remote);
  assert.equal(merged["mc-1.1.1-0"].value, "R1");
  assert.equal(merged["mc-1.1.1-1"].value, "L2");
  assert.equal(merged["scen-1.2.3-0"].value, "L3");
  assert.equal(merged["match-2.3.4"].value, "R3");
});

// ─── buildLocalEntries ─────────────────────────────────────────

test("buildLocalEntries: uses localTs when present, fallback otherwise", () => {
  const storage = makeStorage({
    "mc-1.1.1-0": "v1",
    "mc-1.2.3-0": "v2",
    "secplus-sync-config": "secret",
    "secplus-last-backup-at": "1700000000000",
  });
  const localTs = { "mc-1.1.1-0": T1 };
  const fallback = T3;
  const out = buildLocalEntries(storage, localTs, fallback);
  assert.deepEqual(out, {
    "mc-1.1.1-0": { value: "v1", ts: T1 },
    "mc-1.2.3-0": { value: "v2", ts: fallback },
  });
});

// ─── applyMergedEntries ────────────────────────────────────────

test("applyMergedEntries writes new values and updates trackers", () => {
  const storage = makeStorage({ "mc-1.1.1-0": "old" });
  const merged = {
    "mc-1.1.1-0": { value: "new", ts: T2 },
    "scen-2.3.4-0": { value: "fresh", ts: T2 },
  };
  const lastObs = { "mc-1.1.1-0": "old" };
  const localTs = {};
  applyMergedEntries(merged, storage, lastObs, localTs);
  assert.equal(storage.getItem("mc-1.1.1-0"), "new");
  assert.equal(storage.getItem("scen-2.3.4-0"), "fresh");
  assert.equal(lastObs["mc-1.1.1-0"], "new");
  assert.equal(lastObs["scen-2.3.4-0"], "fresh");
  assert.equal(localTs["mc-1.1.1-0"], T2);
  assert.equal(localTs["scen-2.3.4-0"], T2);
});

test("applyMergedEntries skips storage write when value unchanged", () => {
  const inner = makeStorage({ "mc-1.1.1-0": "same" });
  let writes = 0;
  const wrapped = {
    get length() { return inner.length; },
    key(i) { return inner.key(i); },
    getItem(k) { return inner.getItem(k); },
    setItem(k, v) { writes++; inner.setItem(k, v); },
    removeItem(k) { inner.removeItem(k); },
  };
  const merged = { "mc-1.1.1-0": { value: "same", ts: T1 } };
  applyMergedEntries(merged, wrapped, {}, {});
  assert.equal(writes, 0);
});

// ─── Payload round-trip and validation ─────────────────────────

test("buildPayload + parsePayload round-trip", () => {
  const entries = { "mc-1.1.1-0": { value: "x", ts: T1 } };
  const payload = buildPayload({ entries, deviceId: "dev-abc" });
  assert.equal(payload.schemaVersion, PAYLOAD_SCHEMA_VERSION);
  assert.equal(payload.deviceId, "dev-abc");
  assert.equal(typeof payload.lastWriteAt, "string");
  assert.deepEqual(payload.entries, entries);

  const reparsed = parsePayload(JSON.parse(JSON.stringify(payload)));
  assert.equal(reparsed.schemaVersion, PAYLOAD_SCHEMA_VERSION);
  assert.deepEqual(reparsed.entries, entries);
});

test("parsePayload rejects future schemaVersion", () => {
  assert.equal(parsePayload({ schemaVersion: 999, entries: {} }), null);
});

test("parsePayload rejects malformed input", () => {
  assert.equal(parsePayload(null), null);
  assert.equal(parsePayload({}), null);
  assert.equal(parsePayload({ schemaVersion: 1 }), null);
  assert.equal(parsePayload({ schemaVersion: 1, entries: "not-an-object" }), null);
});

// ─── End-to-end pure-pipeline scenario ─────────────────────────

test("scenario: sequential edits A → B → A converge correctly", () => {
  // Models the realistic single-user-multi-device pattern: study on A,
  // sync, switch to B, study more, sync, back to A, sync.
  const t = (mins) => new Date(Date.UTC(2026, 3, 25, 10, mins, 0)).toISOString();
  let gist = {}; // shared fake Gist

  // T+0: A studies key X, syncs.
  const stA = makeStorage({ "mc-1.1.1-0": "A1" });
  const localTsA = { "mc-1.1.1-0": t(0) };
  const obsA = { "mc-1.1.1-0": "A1" };
  const localA = buildLocalEntries(stA, localTsA, t(0));
  gist = mergeEntries(localA, gist);
  applyMergedEntries(gist, stA, obsA, localTsA);
  assert.equal(gist["mc-1.1.1-0"].value, "A1");

  // T+5: B pulls (gets A1), studies key X (B2), syncs.
  const stB = makeStorage();
  const localTsB = {};
  const obsB = {};
  // pull: merge empty-local with gist → all from gist
  let merged = mergeEntries(buildLocalEntries(stB, localTsB, t(5)), gist);
  applyMergedEntries(merged, stB, obsB, localTsB);
  assert.equal(stB.getItem("mc-1.1.1-0"), "A1");
  // user studies on B → key updated locally with new ts
  stB.setItem("mc-1.1.1-0", "B2");
  localTsB["mc-1.1.1-0"] = t(5);
  // push: merge local with gist
  gist = mergeEntries(buildLocalEntries(stB, localTsB, t(5)), gist);
  assert.equal(gist["mc-1.1.1-0"].value, "B2");

  // T+10: A pulls (gets B2), studies key X (A3), syncs.
  merged = mergeEntries(buildLocalEntries(stA, localTsA, t(10)), gist);
  applyMergedEntries(merged, stA, obsA, localTsA);
  assert.equal(stA.getItem("mc-1.1.1-0"), "B2");
  stA.setItem("mc-1.1.1-0", "A3");
  localTsA["mc-1.1.1-0"] = t(10);
  gist = mergeEntries(buildLocalEntries(stA, localTsA, t(10)), gist);
  assert.equal(gist["mc-1.1.1-0"].value, "A3");
});

test("scenario: simultaneous edits — newer ts wins per-key", () => {
  const tEarly = "2026-04-25T10:00:00.000Z";
  const tLate  = "2026-04-25T10:00:01.000Z";

  // Both devices push to an empty Gist with different values for the same key.
  const fromA = { "mc-1.1.1-0": { value: "A", ts: tEarly } };
  const fromB = { "mc-1.1.1-0": { value: "B", ts: tLate } };

  // A pushes first, gist = fromA. B pulls and merges with its local fromB.
  let gist = mergeEntries(fromA, {});
  const merged = mergeEntries(fromB, gist);
  // B has the later ts, so B wins.
  assert.equal(merged["mc-1.1.1-0"].value, "B");
  // Now B pushes; gist holds B. A pulls and merges with its local fromA.
  gist = mergeEntries(merged, gist);
  const finalOnA = mergeEntries(fromA, gist);
  assert.equal(finalOnA["mc-1.1.1-0"].value, "B");
  // Both devices converge to B, the later write.
});

test("scenario: deleted-on-one-side gets restored from remote (v1 limitation)", () => {
  // Documents that v1 has no tombstones — deletes do not propagate.
  const t1 = "2026-04-25T10:00:00.000Z";
  const stB = makeStorage({ "mc-1.1.1-0": "kept" });
  const obsB = { "mc-1.1.1-0": "kept" };
  const localTsB = { "mc-1.1.1-0": t1 };

  // A pushed { mc-1.1.1-0: "kept" } at t1; gist holds it.
  const gist = { "mc-1.1.1-0": { value: "kept", ts: t1 } };

  // User deletes the key locally on B.
  stB.removeItem("mc-1.1.1-0");

  // Next sync: build local entries → key not present → merge keeps remote → applyMerged restores it.
  const localB = buildLocalEntries(stB, localTsB, t1);
  assert.equal(localB["mc-1.1.1-0"], undefined);
  const merged = mergeEntries(localB, gist);
  applyMergedEntries(merged, stB, obsB, localTsB);
  assert.equal(stB.getItem("mc-1.1.1-0"), "kept", "delete is reverted by merge");
});

test("scenario: device A first sync, device B joins, both converge", () => {
  // A has progress, B has different progress, both first-time activating.
  const tA = "2026-04-25T10:00:00.000Z";
  const tB = "2026-04-25T10:05:00.000Z"; // B activates 5 min later

  const storageA = makeStorage({
    "mc-1.1.1-0": "{\"score\":0.8}",
    "secplus-v4": "{\"watched\":[]}",
  });
  const storageB = makeStorage({
    "mc-1.1.1-0": "{\"score\":0.6}", // different on B
    "scen-2.3.4-0": "{\"score\":1.0}", // B-only key
  });

  // Step 1: A pushes all its tracked keys, no remote yet.
  const localA = buildLocalEntries(storageA, {}, tA);
  const merged1 = mergeEntries(localA, {});
  const remoteAfterA = merged1; // simulate Gist holding this

  // Step 2: B pulls remoteAfterA, merges with local.
  // B's local has fallbackTs tB > A's tA, so B wins per-key on overlap.
  const localB = buildLocalEntries(storageB, {}, tB);
  const merged2 = mergeEntries(localB, remoteAfterA);

  // mc-1.1.1-0: B wins (tB > tA)
  assert.equal(merged2["mc-1.1.1-0"].value, "{\"score\":0.6}");
  // secplus-v4: only on A side, kept
  assert.equal(merged2["secplus-v4"].value, "{\"watched\":[]}");
  // scen-2.3.4-0: only on B side, kept
  assert.equal(merged2["scen-2.3.4-0"].value, "{\"score\":1.0}");

  // Apply to B's storage; B now has all three keys.
  const obsB = {}; const localTsB = {};
  applyMergedEntries(merged2, storageB, obsB, localTsB);
  assert.equal(storageB.getItem("secplus-v4"), "{\"watched\":[]}");
  assert.equal(storageB.getItem("mc-1.1.1-0"), "{\"score\":0.6}");

  // Step 3: A pulls (B has now pushed merged2). A merges with its local.
  // A's localTs[mc-1.1.1-0] is still tA, B's is tB (>tA), so B's wins on A.
  const localA2 = buildLocalEntries(storageA, { "mc-1.1.1-0": tA, "secplus-v4": tA }, tA);
  const merged3 = mergeEntries(localA2, merged2);
  assert.equal(merged3["mc-1.1.1-0"].value, "{\"score\":0.6}");
  // Both devices now hold the same merged set — convergence reached.
});
