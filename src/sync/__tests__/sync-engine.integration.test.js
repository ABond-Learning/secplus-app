// Two-device integration test for the sync engine.
//
// Spins up two engine instances against a single in-memory fake Gist
// server with mocked storages and a mocked fetch. This validates the
// full pull-merge-push pipeline including the GitHub Gist HTTP wire
// format — what the real two-browser-profile test would also exercise.
//
// Run with: npm test (auto-discovered by node --test)

import { test } from "node:test";
import assert from "node:assert/strict";
import { createEngine } from "../sync-engine.js";

// ─── Fakes ─────────────────────────────────────────────────────

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

// In-memory fake of the parts of the GitHub Gist API the engine uses.
// One server can be shared between two engine instances to simulate two
// devices syncing through the same Gist.
function makeFakeGistServer({ initialFiles = {} } = {}) {
  const gists = new Map(); // gistId → { etag, files: { [name]: { content } } }
  let nextEtag = 1;

  function bumpEtag(gistId) {
    const g = gists.get(gistId);
    g.etag = `W/"${nextEtag++}"`;
  }

  function ensure(id) {
    if (!gists.has(id)) gists.set(id, { etag: `W/"${nextEtag++}"`, files: {} });
    return gists.get(id);
  }

  // Pre-create a gist with id "gist-shared" if files were given.
  if (Object.keys(initialFiles).length > 0) {
    const g = ensure("gist-shared");
    g.files = JSON.parse(JSON.stringify(initialFiles));
  }

  function makeRes(status, body, etag) {
    const headers = new Map();
    if (etag) headers.set("etag", etag);
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: { get: (k) => headers.get(k.toLowerCase()) || null },
      async json() { return body; },
      async text() { return JSON.stringify(body); },
    };
  }

  async function fetchFn(url, opts = {}) {
    const u = new URL(url);
    const method = (opts.method || "GET").toUpperCase();

    // POST /gists — create
    if (method === "POST" && u.pathname === "/gists") {
      const newId = `gist-${Math.random().toString(36).slice(2, 8)}`;
      const g = ensure(newId);
      const body = JSON.parse(opts.body);
      g.files = body.files || {};
      bumpEtag(newId);
      return makeRes(201, { id: newId, html_url: `https://gist.github.com/${newId}` }, g.etag);
    }

    // GET /gists/:id
    const m = u.pathname.match(/^\/gists\/([^/]+)$/);
    if (m) {
      const id = m[1];
      if (!gists.has(id)) return makeRes(404, { message: "Not Found" });
      const g = gists.get(id);
      if (method === "GET") {
        const ifNoneMatch = (opts.headers || {})["If-None-Match"];
        if (ifNoneMatch && ifNoneMatch === g.etag) {
          return makeRes(304, null, g.etag);
        }
        return makeRes(200, { id, files: g.files }, g.etag);
      }
      if (method === "PATCH") {
        const body = JSON.parse(opts.body);
        for (const [name, payload] of Object.entries(body.files || {})) {
          g.files[name] = { content: payload.content };
        }
        bumpEtag(id);
        return makeRes(200, { id, files: g.files }, g.etag);
      }
    }

    return makeRes(405, { message: "method not allowed" });
  }

  return {
    fetch: fetchFn,
    _state: () => ({
      gists: Object.fromEntries(
        [...gists.entries()].map(([k, v]) => [k, { etag: v.etag, files: v.files }])
      ),
    }),
    _seedGist(id) {
      const g = ensure(id);
      return g;
    },
  };
}

// ─── Tests ─────────────────────────────────────────────────────

test("integration: two devices converge on a shared Gist", async () => {
  const server = makeFakeGistServer();
  // Pre-create the shared Gist so both devices point at the same id.
  server._seedGist("gist-shared");

  const storageA = makeStorage({ "mc-1.1.1-0": "{\"score\":0.8}" });
  const storageB = makeStorage();

  const engineA = createEngine({ storage: storageA, fetchFn: server.fetch });
  const engineB = createEngine({ storage: storageB, fetchFn: server.fetch });

  // A configures sync, pulls (empty), pushes its data.
  await engineA.setConfig({ pat: "tokenA", gistId: "gist-shared" });

  // Verify Gist now contains A's data.
  const afterA = server._state().gists["gist-shared"];
  const payloadA = JSON.parse(afterA.files["secplus-sync.json"].content);
  assert.equal(payloadA.entries["mc-1.1.1-0"].value, "{\"score\":0.8}");

  // B configures sync, pulls A's data, applies it locally, pushes (no change).
  await engineB.setConfig({ pat: "tokenB", gistId: "gist-shared" });
  assert.equal(storageB.getItem("mc-1.1.1-0"), "{\"score\":0.8}");

  // B studies — updates the key — triggers a sync via the test seam.
  storageB.setItem("mc-1.1.1-0", "{\"score\":0.9}");
  await engineB._scanAndSync();
  const afterB = server._state().gists["gist-shared"];
  const payloadB = JSON.parse(afterB.files["secplus-sync.json"].content);
  assert.equal(payloadB.entries["mc-1.1.1-0"].value, "{\"score\":0.9}");

  // A pulls; A's local now reflects B's update.
  await engineA._scanAndSync();
  assert.equal(storageA.getItem("mc-1.1.1-0"), "{\"score\":0.9}");

  // Cleanup so timers don't keep the process alive.
  engineA.clearConfig();
  engineB.clearConfig();
});

test("integration: simultaneous edits — both devices converge to newer ts", async () => {
  const server = makeFakeGistServer();
  server._seedGist("gist-shared");

  const storageA = makeStorage();
  const storageB = makeStorage();
  const engineA = createEngine({ storage: storageA, fetchFn: server.fetch });
  const engineB = createEngine({ storage: storageB, fetchFn: server.fetch });

  await engineA.setConfig({ pat: "tokenA", gistId: "gist-shared" });
  await engineB.setConfig({ pat: "tokenB", gistId: "gist-shared" });

  // A writes value A; syncs.
  storageA.setItem("mc-1.1.1-0", "A-value");
  await engineA._scanAndSync();

  // B writes value B (local) — its scanner will stamp this with a fresh
  // ts. Because the writes happen in real time, B's ts > A's ts.
  // Force a small time gap so timestamps differ.
  await new Promise(r => setTimeout(r, 5));
  storageB.setItem("mc-1.1.1-0", "B-value");
  await engineB._scanAndSync();

  // After B's sync, the Gist should hold B's value (newer ts wins).
  const final = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.equal(final.entries["mc-1.1.1-0"].value, "B-value");

  // A pulls again — converges to B's value.
  await engineA._scanAndSync();
  assert.equal(storageA.getItem("mc-1.1.1-0"), "B-value");

  engineA.clearConfig();
  engineB.clearConfig();
});

test("integration: 401 from server triggers permanent stop (no retry storm)", async () => {
  const storage = makeStorage();
  const fetchFn = async () => ({
    status: 401,
    ok: false,
    headers: { get: () => null },
    async json() { return { message: "bad credentials" }; },
    async text() { return "bad credentials"; },
  });
  const engine = createEngine({ storage, fetchFn });

  // setConfig calls runPullMergePush — should set lastError and not throw.
  await engine.setConfig({ pat: "bad-token", gistId: "gist-x" });
  const status = engine.getStatus();
  assert.equal(status.enabled, true);
  assert.match(status.lastError || "", /auth failed \(401\)/);
  // No retry was scheduled (permanent error). triggerPush again returns the
  // same error rather than queuing.
  await engine.triggerPush();
  assert.match(engine.getStatus().lastError || "", /auth failed/);

  engine.clearConfig();
});

test("integration: 404 (deleted Gist) triggers permanent stop", async () => {
  const storage = makeStorage();
  const fetchFn = async () => ({
    status: 404,
    ok: false,
    headers: { get: () => null },
    async json() { return { message: "Not Found" }; },
    async text() { return "Not Found"; },
  });
  const engine = createEngine({ storage, fetchFn });

  await engine.setConfig({ pat: "ok-token", gistId: "gist-deleted" });
  assert.match(engine.getStatus().lastError || "", /gist not found/);
  engine.clearConfig();
});

// ─── Joining-device guard ──────────────────────────────────────
//
// Regression for the bug Aiden hit on 2026-04-25: setting up sync on a
// second device silently wiped the cloud. Cause: the React app saves
// DEFAULT_STORE to localStorage on its first mount, BEFORE the user
// triggers setConfig from DevTools. setConfig then scanned this empty
// default-store, stamped it with "now", outranked the cloud's earlier
// real-data timestamps, and pushed empty over the cloud.
//
// Fix: when this device has never synced (no META_KEY) AND has tracked
// keys AND the remote also has tracked keys, treat as a joining device:
// adopt remote state, do not push.

function presetGistFile(server, gistId, payload) {
  const g = server._seedGist(gistId);
  g.files = { "secplus-sync.json": { content: JSON.stringify(payload, null, 2) } };
}

test("regression (2026-04-25): joining device with default-store does NOT wipe cloud", async () => {
  // A's data, already in the cloud, stamped at the time A pushed it.
  const tA = "2026-04-25T12:16:45.000Z";
  const aData = JSON.stringify({ watched: ["1.1.1", "1.2.1"], sm2: { foo: 1 }, streak: 5 });
  const server = makeFakeGistServer();
  presetGistFile(server, "gist-shared", {
    schemaVersion: 1,
    deviceId: "device-A",
    lastWriteAt: tA,
    entries: { "secplus-v4": { value: aData, ts: tA } },
  });

  // B's storage simulates the React app having already saved DEFAULT_STORE
  // to localStorage on its first mount (the trigger condition for the bug).
  const defaultStore = JSON.stringify({ watched: [], sm2: {}, streak: 0 });
  const storageB = makeStorage({ "secplus-v4": defaultStore });
  const engineB = createEngine({ storage: storageB, fetchFn: server.fetch });

  await engineB.setConfig({ pat: "tokenB", gistId: "gist-shared" });

  // After setConfig, B's localStorage MUST hold A's real data (cloud won).
  assert.equal(storageB.getItem("secplus-v4"), aData,
    "B's local secplus-v4 should be replaced with A's cloud data");

  // The cloud MUST still hold A's data — B's empty default-store must NOT
  // have been pushed over A's data.
  const gistAfter = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.equal(gistAfter.entries["secplus-v4"].value, aData,
    "cloud secplus-v4 must remain A's real data, not B's default-empty");
  assert.equal(gistAfter.entries["secplus-v4"].ts, tA,
    "cloud ts must remain A's original push timestamp");

  engineB.clearConfig();
});

test("joining-device: B-only key is preserved and propagates on next scan", async () => {
  // B has two keys: one that overlaps with the cloud (default-store) and
  // one that's local-only. After setConfig, the overlap should be replaced
  // with cloud data; the B-only key should survive locally and reach the
  // cloud on the next scan/push tick.
  const tA = "2026-04-25T12:00:00.000Z";
  const aData = JSON.stringify({ watched: ["1.1.1"], sm2: {} });
  const server = makeFakeGistServer();
  presetGistFile(server, "gist-shared", {
    schemaVersion: 1,
    deviceId: "device-A",
    lastWriteAt: tA,
    entries: { "secplus-v4": { value: aData, ts: tA } },
  });

  const storageB = makeStorage({
    "secplus-v4": JSON.stringify({ watched: [], sm2: {} }), // overlap
    "mc-2.3.4-0": "{\"score\":0.5}", // B-only
  });
  const engineB = createEngine({ storage: storageB, fetchFn: server.fetch });

  await engineB.setConfig({ pat: "tokenB", gistId: "gist-shared" });

  // Overlap was replaced with A's data.
  assert.equal(storageB.getItem("secplus-v4"), aData);
  // B-only key was kept locally.
  assert.equal(storageB.getItem("mc-2.3.4-0"), "{\"score\":0.5}");

  // Cloud at this point holds only A's secplus-v4 — joining branch did
  // not push B-only key yet.
  let gistNow = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.deepEqual(Object.keys(gistNow.entries), ["secplus-v4"]);

  // Next scan tick should pick up the B-only key, stamp it, and push.
  await engineB._scanAndSync();
  gistNow = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.deepEqual(Object.keys(gistNow.entries).sort(), ["mc-2.3.4-0", "secplus-v4"]);
  assert.equal(gistNow.entries["mc-2.3.4-0"].value, "{\"score\":0.5}");
  // Overlap key still A's data — not overwritten by B's empty.
  assert.equal(gistNow.entries["secplus-v4"].value, aData);

  engineB.clearConfig();
});

test("joining-device guard does NOT trigger when local has no tracked keys", async () => {
  // True empty-localStorage case. Joining branch should be a no-op; the
  // normal merge path should pull A's data and B should converge.
  const tA = "2026-04-25T12:00:00.000Z";
  const aData = JSON.stringify({ watched: ["1.1.1"] });
  const server = makeFakeGistServer();
  presetGistFile(server, "gist-shared", {
    schemaVersion: 1,
    deviceId: "device-A",
    lastWriteAt: tA,
    entries: { "secplus-v4": { value: aData, ts: tA } },
  });

  const storageB = makeStorage(); // truly empty — no React mount yet
  const engineB = createEngine({ storage: storageB, fetchFn: server.fetch });

  await engineB.setConfig({ pat: "tokenB", gistId: "gist-shared" });

  // B should now have A's data.
  assert.equal(storageB.getItem("secplus-v4"), aData);
  // Cloud unchanged.
  const gistNow = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.equal(gistNow.entries["secplus-v4"].value, aData);

  engineB.clearConfig();
});

test("joining-device guard does NOT trigger when remote is empty (seeding case)", async () => {
  // Seeding-from-A case: A has data, cloud is empty. setConfig should fall
  // through to normal sync and push A's data up.
  const server = makeFakeGistServer();
  server._seedGist("gist-shared"); // exists but no file content yet

  const aData = JSON.stringify({ watched: ["1.1.1", "1.2.1"], sm2: { foo: 1 } });
  const storageA = makeStorage({ "secplus-v4": aData });
  const engineA = createEngine({ storage: storageA, fetchFn: server.fetch });

  await engineA.setConfig({ pat: "tokenA", gistId: "gist-shared" });

  const gistNow = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.equal(gistNow.entries["secplus-v4"].value, aData,
    "seeding device with non-empty local + empty remote should push local up");

  engineA.clearConfig();
});

test("joining-device guard surfaces 401 from probe and does not push", async () => {
  // If the probe returns a permanent error, the engine must bail with
  // lastError set and NOT fall through to runPullMergePush (which could
  // potentially still run, but we want the early exit path to be clean).
  const fetchFn = async () => ({
    status: 401,
    ok: false,
    headers: { get: () => null },
    async json() { return { message: "bad credentials" }; },
    async text() { return "bad credentials"; },
  });
  const storageB = makeStorage({ "secplus-v4": "{\"watched\":[]}" });
  const engineB = createEngine({ storage: storageB, fetchFn });

  await engineB.setConfig({ pat: "bad-pat", gistId: "gist-x" });
  const status = engineB.getStatus();
  assert.match(status.lastError || "", /auth failed \(401\)/);

  engineB.clearConfig();
});

test("integration: weakness- records propagate cross-device (added 2026-05-22)", async () => {
  // Weakness records are append-only with timestamped keys. Two devices
  // each writing distinct weakness keys must converge to a union of all
  // records on both sides. This is the only test path for the new
  // TRACKED_PREFIXES entry — the unit tests cover classification + merge;
  // this exercises the end-to-end Gist round-trip.
  const server = makeFakeGistServer();
  server._seedGist("gist-shared");

  const storageA = makeStorage({
    "weakness-mc-2.4.1-7-1716372345678": JSON.stringify({ questionId: "mc-2.4.1-7", ts: 1716372345678, correct: true, mode: "quiz" }),
  });
  const storageB = makeStorage({
    "weakness-mc-2.4.1-7-1716372400000": JSON.stringify({ questionId: "mc-2.4.1-7", ts: 1716372400000, correct: false, mode: "quiz" }),
  });

  const engineA = createEngine({ storage: storageA, fetchFn: server.fetch });
  const engineB = createEngine({ storage: storageB, fetchFn: server.fetch });

  // A configures sync, pushes its record.
  await engineA.setConfig({ pat: "tokenA", gistId: "gist-shared" });
  // B configures sync — joining branch pulls A's record + preserves B's local.
  // (joining-device guard doesn't push B-only keys on initial setConfig;
  // they propagate on next scan tick — see "joining-device: B-only key is
  // preserved and propagates on next scan" test above for the pattern.)
  await engineB.setConfig({ pat: "tokenB", gistId: "gist-shared" });

  // After B's config: B has both records locally.
  assert.equal(storageB.getItem("weakness-mc-2.4.1-7-1716372345678") != null, true, "B should have A's record after pull");
  assert.equal(storageB.getItem("weakness-mc-2.4.1-7-1716372400000") != null, true, "B should still have its own record");

  // B's next scan tick pushes the B-only key to the Gist.
  await engineB._scanAndSync();

  // A pulls; A now has B's record too.
  await engineA._scanAndSync();
  assert.equal(storageA.getItem("weakness-mc-2.4.1-7-1716372345678") != null, true, "A should still have its own record");
  assert.equal(storageA.getItem("weakness-mc-2.4.1-7-1716372400000") != null, true, "A should have B's record after pull");

  // The Gist holds both records (different keys, both kept).
  const stored = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  assert.deepEqual(
    Object.keys(stored.entries).filter(k => k.startsWith("weakness-")).sort(),
    ["weakness-mc-2.4.1-7-1716372345678", "weakness-mc-2.4.1-7-1716372400000"]
  );

  engineA.clearConfig();
  engineB.clearConfig();
});

test("integration: PAT and meta keys never leak to the Gist", async () => {
  const server = makeFakeGistServer();
  server._seedGist("gist-shared");
  const storage = makeStorage({
    "mc-1.1.1-0": "{}",
    "secplus-sync-config": "should-not-appear",
    "secplus-sync-meta": "should-not-appear",
    "secplus-last-backup-at": "1700000000000",
    "secplus-backup-banner-snooze-until": "1700000000000",
  });
  const engine = createEngine({ storage, fetchFn: server.fetch });

  await engine.setConfig({ pat: "pat-secret", gistId: "gist-shared" });

  // Inspect the Gist contents — none of the local-only values may be present.
  const stored = JSON.parse(
    server._state().gists["gist-shared"].files["secplus-sync.json"].content
  );
  const keys = Object.keys(stored.entries);
  assert.deepEqual(keys, ["mc-1.1.1-0"]);
  // Belt-and-braces: search the raw JSON string.
  const raw = server._state().gists["gist-shared"].files["secplus-sync.json"].content;
  assert.equal(raw.includes("pat-secret"), false, "PAT must never reach the Gist");
  assert.equal(raw.includes("should-not-appear"), false, "sync meta must never reach the Gist");

  engine.clearConfig();
});

// ─── Piece 2: fetchGist truncation safety (Option B) ───────────
//
// GitHub truncates a gist file's inline `content` past ~1 MB (sets
// truncated:true + raw_url). The old fetchGist JSON.parse'd the partial
// content, threw, and silently returned an EMPTY payload — which makes
// doSync keep local + re-push, stopping cross-device reconciliation for
// ALL data with no error. These cover the recover-via-raw_url path and the
// loud-failure paths.

function mkRes(status, bodyObj, rawText, etag) {
  const h = new Map();
  if (etag) h.set("etag", etag);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (k) => h.get(k.toLowerCase()) || null },
    async json() { return bodyObj; },
    async text() { return rawText != null ? rawText : JSON.stringify(bodyObj); },
  };
}

const RAW_URL = "https://gist.githubusercontent.com/raw/abc";

test("Piece 2: truncated gist file recovers full payload via raw_url", async () => {
  const full = { schemaVersion: 1, entries: { "mc-9.9.9-0": { value: "{\"x\":1}", ts: "2026-06-01T00:00:00.000Z" } } };
  let patch = 0;
  const fetchFn = async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    if (url === RAW_URL) return mkRes(200, null, JSON.stringify(full));
    if (method === "PATCH") { patch++; return mkRes(200, { id: "g", files: {} }, null, 'W/"2"'); }
    return mkRes(200, { id: "g", files: { "secplus-sync.json": { truncated: true, raw_url: RAW_URL, content: '{"schemaVersion":1,"entr' } } }, null, 'W/"1"');
  };
  const storage = makeStorage();
  const engine = createEngine({ storage, fetchFn });
  const status = await engine.setConfig({ pat: "t", gistId: "g" });
  assert.equal(status.lastError, null, "recovery path must not record an error");
  assert.equal(storage.getItem("mc-9.9.9-0"), "{\"x\":1}", "recovered remote entry applied locally");
  engine.clearConfig();
});

test("Piece 2: truncated + raw_url fetch fails -> loud lastError, gist not clobbered", async () => {
  let patch = 0;
  const fetchFn = async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    if (url === RAW_URL) return mkRes(500, null, "upstream error");
    if (method === "PATCH") { patch++; return mkRes(200, { id: "g", files: {} }, null, 'W/"2"'); }
    return mkRes(200, { id: "g", files: { "secplus-sync.json": { truncated: true, raw_url: RAW_URL, content: "partial" } } }, null, 'W/"1"');
  };
  const storage = makeStorage();
  const engine = createEngine({ storage, fetchFn });
  await engine.setConfig({ pat: "t", gistId: "g" });
  const status = engine.getStatus();
  assert.match(status.lastError || "", /truncated/i, "must surface a loud truncation error");
  assert.equal(patch, 0, "must NOT push a local-only payload over an unreadable remote");
  engine.clearConfig();
});

test("Piece 2: present-but-unparseable content -> loud lastError, not silent-empty", async () => {
  let patch = 0;
  const fetchFn = async (url, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    if (method === "PATCH") { patch++; return mkRes(200, { id: "g", files: {} }, null, 'W/"2"'); }
    return mkRes(200, { id: "g", files: { "secplus-sync.json": { truncated: false, content: "{not valid json" } } }, null, 'W/"1"');
  };
  const storage = makeStorage();
  const engine = createEngine({ storage, fetchFn });
  await engine.setConfig({ pat: "t", gistId: "g" });
  const status = engine.getStatus();
  assert.match(status.lastError || "", /unparseable/i, "present-but-broken content is corruption, not emptiness");
  assert.equal(patch, 0, "must NOT clobber the gist when remote is unreadable");
  engine.clearConfig();
});
