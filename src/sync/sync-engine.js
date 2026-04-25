// Cross-device sync engine for the Security+ study app.
//
// One file per Gist; one Gist per user. The engine reads localStorage keys
// matching TRACKED_PREFIXES (minus LOCAL_ONLY) and reconciles them with the
// Gist using per-key latest-timestamp-wins semantics.
//
// Public API at the bottom. Pure helpers exported for unit tests.
// `createEngine({storage, fetchFn})` returns a fresh engine instance with
// injectable adapters — used by integration tests to simulate multiple
// devices in one process.

// ─── Constants ─────────────────────────────────────────────────
export const TRACKED_PREFIXES = ["mc-", "scen-", "match-", "secplus-"];

// LOCAL_ONLY entries override TRACKED_PREFIXES — keys that match here are
// never synced even if their prefix would normally include them.
export const LOCAL_ONLY = [
  { kind: "prefix", value: "secplus-sync-" },
  { kind: "exact", value: "secplus-last-backup-at" },
  { kind: "exact", value: "secplus-backup-banner-snooze-until" },
];

export const PAYLOAD_SCHEMA_VERSION = 1;

const GIST_FILENAME = "secplus-sync.json";
const GIST_DESCRIPTION = "Security+ study app — personal cross-device sync";
const SCAN_INTERVAL_MS = 2000;
const DEBOUNCE_MS = 5000;
const BACKOFF_MS = [5000, 15000, 60000, 300000, 600000];
const CONFIG_KEY = "secplus-sync-config";
const META_KEY = "secplus-sync-meta";

// ─── Pure helpers (exported for tests) ─────────────────────────

export function isLocalOnly(key) {
  for (const entry of LOCAL_ONLY) {
    if (entry.kind === "prefix" && key.startsWith(entry.value)) return true;
    if (entry.kind === "exact" && key === entry.value) return true;
  }
  return false;
}

export function isTracked(key) {
  if (isLocalOnly(key)) return false;
  for (const p of TRACKED_PREFIXES) if (key.startsWith(p)) return true;
  return false;
}

export function scanTrackedKeys(storage) {
  const out = {};
  if (!storage) return out;
  const len = typeof storage.length === "number" ? storage.length : 0;
  for (let i = 0; i < len; i++) {
    const k = storage.key(i);
    if (k == null || !isTracked(k)) continue;
    const v = storage.getItem(k);
    if (v != null) out[k] = v;
  }
  return out;
}

export function buildLocalEntries(storage, localTs, fallbackTs) {
  const tracked = scanTrackedKeys(storage);
  const out = {};
  for (const k of Object.keys(tracked)) {
    out[k] = { value: tracked[k], ts: localTs[k] || fallbackTs };
  }
  return out;
}

// Per-key max-ts merge. Ties favour local for stability — otherwise two
// devices with identical timestamps would ping-pong each other's value
// forever.
export function mergeEntries(local, remote) {
  const out = {};
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  for (const k of keys) {
    if (!isTracked(k)) continue; // belt-and-braces: drop any LOCAL_ONLY keys leaked from remote
    const l = local[k];
    const r = remote[k];
    if (!l) { out[k] = r; continue; }
    if (!r) { out[k] = l; continue; }
    const lt = Date.parse(l.ts) || 0;
    const rt = Date.parse(r.ts) || 0;
    out[k] = (rt > lt) ? r : l;
  }
  return out;
}

export function applyMergedEntries(merged, storage, lastObservedValues, localTs) {
  if (!storage) return;
  for (const k of Object.keys(merged)) {
    const entry = merged[k];
    if (!entry || typeof entry.value !== "string") continue;
    const cur = storage.getItem(k);
    if (cur !== entry.value) {
      storage.setItem(k, entry.value);
    }
    lastObservedValues[k] = entry.value;
    localTs[k] = entry.ts;
  }
}

export function buildPayload({ entries, deviceId }) {
  return {
    schemaVersion: PAYLOAD_SCHEMA_VERSION,
    deviceId,
    lastWriteAt: new Date().toISOString(),
    entries,
  };
}

export function parsePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.schemaVersion !== PAYLOAD_SCHEMA_VERSION) return null;
  if (!raw.entries || typeof raw.entries !== "object") return null;
  return raw;
}

// ─── Engine factory ────────────────────────────────────────────
// Each call creates a fresh engine instance with its own state. Production
// uses a single default instance (see exports at bottom). Tests use the
// factory directly to simulate multiple devices in one process.
export function createEngine({ storage: injectedStorage, fetchFn: injectedFetch } = {}) {
  const state = {
    enabled: false,
    pat: null,
    gistId: null,
    deviceId: null,
    inFlight: null,         // 'pull' | 'push' | null
    lastSuccessAt: null,    // ISO
    lastErrorAt: null,      // ISO
    lastError: null,        // string
    retryAttempt: 0,
    retryTimeoutId: null,
    scanIntervalId: null,
    pushTimeoutId: null,
    etag: null,
    localTs: {},
    lastObservedValues: {},
    subscribers: new Set(),
  };

  function nowIso() { return new Date().toISOString(); }
  function getStorage() {
    if (injectedStorage) return injectedStorage;
    return typeof localStorage !== "undefined" ? localStorage : null;
  }
  function getFetch() {
    if (injectedFetch) return injectedFetch;
    return typeof fetch !== "undefined" ? fetch.bind(globalThis) : null;
  }

  function generateDeviceId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function loadConfig() {
    const s = getStorage(); if (!s) return {};
    try {
      const raw = s.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("[secplus-sync] loadConfig failed:", e);
      return {};
    }
  }

  function saveConfig() {
    const s = getStorage(); if (!s) return;
    try {
      if (!state.pat || !state.gistId) {
        s.removeItem(CONFIG_KEY);
        return;
      }
      s.setItem(CONFIG_KEY, JSON.stringify({
        pat: state.pat,
        gistId: state.gistId,
        deviceId: state.deviceId,
      }));
    } catch (e) {
      console.error("[secplus-sync] saveConfig failed:", e);
    }
  }

  function loadMeta() {
    const s = getStorage(); if (!s) return;
    try {
      const raw = s.getItem(META_KEY);
      if (!raw) return;
      const m = JSON.parse(raw);
      state.localTs = m.localTs || {};
      state.lastObservedValues = m.lastObservedValues || {};
      state.etag = m.etag || null;
      state.lastSuccessAt = m.lastSuccessAt || null;
    } catch (e) {
      console.error("[secplus-sync] loadMeta failed:", e);
    }
  }

  function saveMeta() {
    const s = getStorage(); if (!s) return;
    try {
      s.setItem(META_KEY, JSON.stringify({
        localTs: state.localTs,
        lastObservedValues: state.lastObservedValues,
        etag: state.etag,
        lastSuccessAt: state.lastSuccessAt,
      }));
    } catch (e) {
      console.error("[secplus-sync] saveMeta failed:", e);
    }
  }

  function notify() {
    const status = getStatus();
    for (const cb of state.subscribers) {
      try { cb(status); } catch (e) { console.error("[secplus-sync] subscriber error:", e); }
    }
  }

  function startScanner() {
    if (state.scanIntervalId) return;
    scanOnce();
    state.scanIntervalId = setInterval(scanOnce, SCAN_INTERVAL_MS);
  }

  function stopScanner() {
    if (state.scanIntervalId) clearInterval(state.scanIntervalId);
    state.scanIntervalId = null;
  }

  function scanOnce() {
    const s = getStorage(); if (!s) return;
    const tracked = scanTrackedKeys(s);
    let dirty = false;
    for (const k of Object.keys(tracked)) {
      if (state.lastObservedValues[k] !== tracked[k]) {
        state.localTs[k] = nowIso();
        dirty = true;
      }
    }
    state.lastObservedValues = tracked;
    if (dirty) {
      saveMeta();
      scheduleDebouncedPush();
    }
  }

  function scheduleDebouncedPush() {
    if (state.pushTimeoutId) clearTimeout(state.pushTimeoutId);
    state.pushTimeoutId = setTimeout(() => {
      state.pushTimeoutId = null;
      runPullMergePush().catch(e => console.error("[secplus-sync] debounced push failed:", e));
    }, DEBOUNCE_MS);
  }

  function cancelPush() {
    if (state.pushTimeoutId) clearTimeout(state.pushTimeoutId);
    state.pushTimeoutId = null;
  }

  function cancelRetry() {
    if (state.retryTimeoutId) clearTimeout(state.retryTimeoutId);
    state.retryTimeoutId = null;
  }

  function scheduleRetry() {
    cancelRetry();
    const i = Math.min(state.retryAttempt, BACKOFF_MS.length - 1);
    const delay = BACKOFF_MS[i];
    state.retryAttempt++;
    state.retryTimeoutId = setTimeout(() => {
      state.retryTimeoutId = null;
      runPullMergePush().catch(e => console.error("[secplus-sync] retry failed:", e));
    }, delay);
  }

  async function fetchGist() {
    const f = getFetch();
    if (!f) throw new Error("fetch unavailable");
    const headers = {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${state.pat}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (state.etag) headers["If-None-Match"] = state.etag;
    const res = await f(`https://api.github.com/gists/${state.gistId}`, { headers });
    if (res.status === 304) return null;
    if (res.status === 401 || res.status === 403) {
      const err = new Error(`auth failed (${res.status})`); err.permanent = true; throw err;
    }
    if (res.status === 404) {
      const err = new Error("gist not found"); err.permanent = true; throw err;
    }
    if (!res.ok) throw new Error(`fetchGist: ${res.status}`);
    state.etag = res.headers.get("ETag") || state.etag;
    const data = await res.json();
    const file = data.files && data.files[GIST_FILENAME];
    if (!file) return { schemaVersion: PAYLOAD_SCHEMA_VERSION, entries: {} };
    let payload;
    try { payload = JSON.parse(file.content); }
    catch { return { schemaVersion: PAYLOAD_SCHEMA_VERSION, entries: {} }; }
    return parsePayload(payload) || { schemaVersion: PAYLOAD_SCHEMA_VERSION, entries: {} };
  }

  async function pushGist({ entries }) {
    const f = getFetch();
    if (!f) throw new Error("fetch unavailable");
    const payload = buildPayload({ entries, deviceId: state.deviceId });
    const res = await f(`https://api.github.com/gists/${state.gistId}`, {
      method: "PATCH",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${state.pat}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: { [GIST_FILENAME]: { content: JSON.stringify(payload, null, 2) } },
      }),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error(`auth failed (${res.status})`); err.permanent = true; throw err;
    }
    if (res.status === 404) {
      const err = new Error("gist not found"); err.permanent = true; throw err;
    }
    if (!res.ok) throw new Error(`pushGist: ${res.status}`);
    state.etag = res.headers.get("ETag") || state.etag;
  }

  async function runPullMergePush() {
    if (!state.enabled) return;
    if (state.inFlight) return;
    const s = getStorage(); if (!s) return;

    state.inFlight = "pull";
    notify();
    try {
      cancelRetry();
      const remote = await fetchGist();
      const local = buildLocalEntries(s, state.localTs, nowIso());
      const remoteEntries = remote ? remote.entries : {};
      const merged = mergeEntries(local, remoteEntries);

      applyMergedEntries(merged, s, state.lastObservedValues, state.localTs);

      state.inFlight = "push";
      notify();
      await pushGist({ entries: merged });

      state.inFlight = null;
      state.lastSuccessAt = nowIso();
      state.lastErrorAt = null;
      state.lastError = null;
      state.retryAttempt = 0;
      saveMeta();
      notify();
    } catch (e) {
      state.inFlight = null;
      state.lastErrorAt = nowIso();
      state.lastError = e.message || String(e);
      notify();
      if (e.permanent) {
        console.error("[secplus-sync] permanent error, not retrying:", e);
        return;
      }
      scheduleRetry();
    }
  }

  function getStatus() {
    return {
      enabled: state.enabled,
      inFlight: state.inFlight,
      lastSuccessAt: state.lastSuccessAt,
      lastErrorAt: state.lastErrorAt,
      lastError: state.lastError,
      deviceId: state.deviceId,
      gistId: state.gistId,
      hasPat: !!state.pat,
    };
  }

  function subscribe(cb) {
    state.subscribers.add(cb);
    return () => state.subscribers.delete(cb);
  }

  async function setConfig({ pat, gistId }) {
    if (!pat || !gistId) throw new Error("pat and gistId required");
    state.pat = pat;
    state.gistId = gistId;
    if (!state.deviceId) state.deviceId = generateDeviceId();
    state.enabled = true;
    state.lastError = null;
    state.lastErrorAt = null;
    state.retryAttempt = 0;
    state.etag = null;

    // Snapshot two facts BEFORE we touch state or start the scanner:
    //   1. Has this device ever synced before? (presence of META_KEY)
    //   2. Does the device's localStorage already hold tracked keys?
    // We need (1) before loadMeta() because loadMeta is idempotent on
    // missing keys and we'd lose the signal otherwise.
    const s = getStorage();
    const isFirstSyncOnDevice = !!s && !s.getItem(META_KEY);
    const localKeyCount = s ? Object.keys(scanTrackedKeys(s)).length : 0;

    saveConfig();
    loadMeta();

    // Joining-device guard. The React app saves a DEFAULT_STORE entry
    // (secplus-v4 = empty store) to localStorage as soon as it mounts,
    // before the user can run setConfig in DevTools. Without this guard,
    // setConfig would scan that default-empty value, stamp it with "now",
    // beat the cloud's earlier real-data timestamp, and silently overwrite
    // the cloud. So: when this device has never synced, has tracked keys
    // already, AND the cloud also has tracked keys, treat this as joining
    // a sync set rather than seeding one — apply the cloud's state to
    // local without pushing. Users who genuinely want this device to
    // overwrite the cloud can call pushAll() afterwards.
    if (isFirstSyncOnDevice && localKeyCount > 0) {
      try {
        const remote = await fetchGist();
        const remoteEntries = remote ? remote.entries : {};
        if (Object.keys(remoteEntries).length > 0) {
          applyMergedEntries(remoteEntries, s, state.lastObservedValues, state.localTs);
          state.lastSuccessAt = nowIso();
          state.lastErrorAt = null;
          state.lastError = null;
          state.retryAttempt = 0;
          saveMeta();
          startScanner();
          notify();
          return getStatus();
        }
        // Remote is empty — fall through to normal sync (will seed cloud
        // from this device).
      } catch (e) {
        if (e.permanent) {
          state.lastErrorAt = nowIso();
          state.lastError = e.message || String(e);
          notify();
          return getStatus();
        }
        // Transient error — fall through to runPullMergePush which has
        // its own retry handling.
        console.warn("[secplus-sync] joining-device probe failed, falling through:", e);
      }
    }

    startScanner();
    await runPullMergePush();
    return getStatus();
  }

  function clearConfig() {
    stopScanner();
    cancelPush();
    cancelRetry();
    state.enabled = false;
    state.pat = null;
    state.gistId = null;
    state.etag = null;
    state.inFlight = null;
    saveConfig();
    notify();
  }

  async function triggerPush() {
    cancelPush();
    await runPullMergePush();
    return getStatus();
  }

  async function createGist({ pat, description = GIST_DESCRIPTION } = {}) {
    const f = getFetch();
    if (!f) throw new Error("fetch unavailable");
    if (!pat) throw new Error("pat required");
    const deviceId = state.deviceId || generateDeviceId();
    const initial = buildPayload({ entries: {}, deviceId });
    const res = await f("https://api.github.com/gists", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${pat}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public: false,
        description,
        files: { [GIST_FILENAME]: { content: JSON.stringify(initial, null, 2) } },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`createGist: ${res.status} ${text}`);
    }
    const data = await res.json();
    return { gistId: data.id, url: data.html_url, deviceId };
  }

  // Force-overwrite remote with current local. Bypasses merge — every key
  // gets a fresh "now" timestamp so other devices' next pull will take
  // this state.
  async function pushAll() {
    if (!state.enabled) throw new Error("sync disabled");
    const s = getStorage(); if (!s) throw new Error("storage unavailable");
    const ts = nowIso();
    const local = buildLocalEntries(s, state.localTs, ts);
    const stamped = {};
    for (const k of Object.keys(local)) {
      stamped[k] = { value: local[k].value, ts };
      state.localTs[k] = ts;
    }
    await pushGist({ entries: stamped });
    state.lastSuccessAt = nowIso();
    saveMeta();
    notify();
    return getStatus();
  }

  // Force-overwrite local with current remote.
  async function pullAll() {
    if (!state.enabled) throw new Error("sync disabled");
    const s = getStorage(); if (!s) throw new Error("storage unavailable");
    state.etag = null;
    const remote = await fetchGist();
    const remoteEntries = remote ? remote.entries : {};
    applyMergedEntries(remoteEntries, s, state.lastObservedValues, state.localTs);
    state.lastSuccessAt = nowIso();
    saveMeta();
    notify();
    return getStatus();
  }

  function initSync(options = {}) {
    const { devtoolsHandle = true, exposeOnWindow = true } = options;
    const cfg = loadConfig();
    state.deviceId = cfg.deviceId || state.deviceId;

    if (devtoolsHandle && exposeOnWindow && typeof window !== "undefined") {
      window.__secplusSync = api;
    }

    if (cfg.pat && cfg.gistId) {
      state.pat = cfg.pat;
      state.gistId = cfg.gistId;
      state.enabled = true;
      if (!state.deviceId) state.deviceId = generateDeviceId();
      saveConfig();
      loadMeta();
      startScanner();
      runPullMergePush().catch(e => console.error("[secplus-sync] initial sync failed:", e));
    }
  }

  // Test seam — force scanOnce + push synchronously, bypassing the
  // 5s debounce. NOT exposed on window in production.
  async function _scanAndSync() {
    scanOnce();
    cancelPush();
    await runPullMergePush();
  }

  const api = {
    initSync, getStatus, subscribe, setConfig, clearConfig,
    triggerPush, createGist, pushAll, pullAll, _scanAndSync,
  };
  return api;
}

// ─── Default singleton (production wiring) ─────────────────────
const _default = createEngine();
export const initSync = (opts) => _default.initSync(opts);
export const getStatus = () => _default.getStatus();
export const subscribe = (cb) => _default.subscribe(cb);
export const setConfig = (cfg) => _default.setConfig(cfg);
export const clearConfig = () => _default.clearConfig();
export const triggerPush = () => _default.triggerPush();
export const createGist = (opts) => _default.createGist(opts);
export const pushAll = () => _default.pushAll();
export const pullAll = () => _default.pullAll();
