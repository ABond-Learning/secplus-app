import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ALL_SECTIONS from "../questions.json";
import SyncSettings, { deriveHealth } from "./sync/SyncSettings.jsx";
import { getStatus as getSyncStatus, subscribe as subscribeSync } from "./sync/sync-engine.js";

// ─── DATA LIVES IN questions.json ──────────────────────────────

// ─── STORAGE ───────────────────────────────────────────────────
const STORE_KEY = "secplus-v4";
const SCHEMA_VERSION = 2;

// ─── CONFIG ────────────────────────────────────────────────────
// Tunable knobs pulled out of their use sites so they're easy to find and
// change. These are the values that change when the exam spec changes
// (if SY0-701 is revised) or when we want to adjust how strict the app is
// about flagging weak spots. The SM-2 algorithm constants (initial ease,
// ease adjustments, interval multipliers) stay inside applyRating since
// changing them means changing the algorithm itself — different kind of edit.
const CONFIG = {
  // Exam configuration — mirrors the real SY0-701 spec
  EXAM_TIMER_SECONDS: 5400,      // 90 minutes
  EXAM_QUESTION_COUNT: 90,
  PASS_PERCENT: 75,              // minimum score to pass

  // Domain accuracy dashboard colour bands (ratios 0–1)
  DOMAIN_STRONG_RATIO: 0.85,     // ≥ this = green
  DOMAIN_OK_RATIO: 0.70,         // ≥ this = amber; below = red

  // Weak-spot quiz mode: videos below this average accuracy are included
  WEAK_SPOT_RATIO: 0.70,
};

// ─── SM-2 STORE KEY HELPERS ─────────────────────────────────────
// Keys are prefixed by question type to prevent collisions:
//   mc-{videoId}-{qi}          → multiple-choice question
//   scen-{videoId}-{qi}        → scenario (long-form) question
//   match-{videoId}-{pairIdx}  → individual matching pair (partial-credit era)
//   match-{videoId}            → legacy single matching record (pre-partial-credit)
// The prefix replaces the old `qi + 1000` hack, which assumed no video
// would ever carry 1000+ MC questions — safe today, but fragile.
function mcKey(videoId, qi)       { return `mc-${videoId}-${qi}`; }
function scenKey(videoId, qi)     { return `scen-${videoId}-${qi}`; }
function matchKey(videoId, idx)   { return `match-${videoId}-${idx}`; }
function keyOf(q) {
  // Unified key for any MC-style question (regular or scenario).
  return q.isScenario ? scenKey(q.videoId, q.qi) : mcKey(q.videoId, q.qi);
}
// Extract the videoId portion from a new-format SM-2 key. Returns null for
// unrecognised keys. Used by the domain-accuracy dashboard to bucket records.
function videoIdFromKey(key) {
  const firstDash = key.indexOf("-");
  if (firstDash < 0) return null;
  const prefix = key.slice(0, firstDash);
  if (prefix !== "mc" && prefix !== "scen" && prefix !== "match") return null;
  const rest = key.slice(firstDash + 1);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash < 0) return rest; // match-{videoId} legacy form
  const tail = rest.slice(lastDash + 1);
  // If the tail is numeric it's an index/qi — strip it to get the videoId.
  // If not, the whole rest is a videoId that happens to contain a dash
  // (shouldn't happen with current videoIds but handled defensively).
  if (/^\d+$/.test(tail)) return rest.slice(0, lastDash);
  return rest;
}

const DEFAULT_STORE = {
  version: SCHEMA_VERSION,
  watched: [],
  sm2: {},        // { questionKey: { correct, total, nextDue } }
  history: [],    // [{ date, score, total, mode }]
  streak: 0,
  lastStudy: null,
};

// Defensive migration: fills in missing fields and coerces types so a
// partially-corrupt or older-schema store still loads instead of throwing.
function migrateStore(data) {
  if (!data || typeof data !== "object") return { ...DEFAULT_STORE };
  const incomingVersion = typeof data.version === "number" ? data.version : 1;
  const merged = { ...DEFAULT_STORE, ...data, version: SCHEMA_VERSION };
  if (!Array.isArray(merged.watched)) merged.watched = [];
  if (!merged.sm2 || typeof merged.sm2 !== "object") merged.sm2 = {};
  if (!Array.isArray(merged.history)) merged.history = [];
  if (typeof merged.streak !== "number") merged.streak = 0;
  // v1 → v2: SM-2 keys gain mc-/scen-/match- prefixes. Only run once,
  // when we detect a store written before v2.
  if (incomingVersion < 2) {
    merged.sm2 = migrateKeysV1toV2(merged.sm2);
  }
  return merged;
}

// Converts the flat `${videoId}-${suffix}` SM-2 keys from v1 stores into the
// prefixed v2 format. Safe to call on an already-migrated store — recognisable
// v2 keys (starting with a known prefix) pass through untouched.
function migrateKeysV1toV2(sm2) {
  if (!sm2 || typeof sm2 !== "object") return {};
  const out = {};
  Object.entries(sm2).forEach(([key, rec]) => {
    if (!rec) return;
    // Already v2 — preserve as-is.
    if (key.startsWith("mc-") || key.startsWith("scen-") || key.startsWith("match-")) {
      out[key] = rec;
      return;
    }
    // v1: ${videoId}-${suffix}. Use lastIndexOf to split — videoIds look like "1.1.1".
    const lastDash = key.lastIndexOf("-");
    if (lastDash < 0) { out[key] = rec; return; }
    const left = key.slice(0, lastDash);
    const suffix = key.slice(lastDash + 1);
    // v1 per-pair matching: `${videoId}-m-${pairIdx}` — lastIndexOf puts the
    // split between "m" and the index, so `left` ends in "-m".
    if (left.endsWith("-m") && /^\d+$/.test(suffix)) {
      const realVideoId = left.slice(0, -2);
      out[matchKey(realVideoId, suffix)] = rec;
      return;
    }
    // v1 legacy single-record matching: `${videoId}-m`
    if (suffix === "m") {
      out[`match-${left}`] = rec;
      return;
    }
    // v1 MC or scenario — suffix is numeric, ≥1000 means scenario (qi+1000 hack).
    if (/^\d+$/.test(suffix)) {
      const qi = parseInt(suffix, 10);
      if (qi >= 1000) out[scenKey(left, qi - 1000)] = rec;
      else            out[mcKey(left, qi)] = rec;
      return;
    }
    // Unrecognised — preserve rather than drop.
    out[key] = rec;
  });
  return out;
}

// Returns { data, status: { primary, fallbackUsed, error } }
// primary = "window.storage" | "localStorage" | "none"
async function loadStore() {
  let lastError = null;
  // 1. Try window.storage (artifact-native persistence)
  try {
    if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
      const result = await window.storage.get(STORE_KEY);
      if (result && result.value) {
        return { data: migrateStore(JSON.parse(result.value)), status: { primary: "window.storage", fallbackUsed: false, error: null } };
      }
    }
  } catch (e) {
    console.error("[secplus] window.storage.get failed, trying localStorage:", e);
    lastError = String(e && e.message ? e.message : e);
  }
  // 2. Fall back to localStorage
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        return { data: migrateStore(JSON.parse(raw)), status: { primary: "localStorage", fallbackUsed: true, error: lastError } };
      }
    }
  } catch (e) {
    console.error("[secplus] localStorage.getItem failed:", e);
    lastError = String(e && e.message ? e.message : e);
  }
  // 3. Nothing saved yet (or both unavailable)
  return { data: { ...DEFAULT_STORE }, status: { primary: lastError ? "none" : "window.storage", fallbackUsed: false, error: lastError } };
}

// Writes to BOTH window.storage and localStorage when available, so that a
// failure in either path does not lose data. Returns { windowOk, localOk, error }.
async function saveStore(s) {
  const payload = JSON.stringify(s);
  let windowOk = false, localOk = false, lastError = null;
  try {
    if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
      await window.storage.set(STORE_KEY, payload);
      windowOk = true;
    }
  } catch (e) {
    console.error("[secplus] window.storage.set failed:", e);
    lastError = String(e && e.message ? e.message : e);
  }
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORE_KEY, payload);
      localOk = true;
    }
  } catch (e) {
    console.error("[secplus] localStorage.setItem failed:", e);
    lastError = String(e && e.message ? e.message : e);
  }
  return { windowOk, localOk, error: lastError };
}

// ─── BACKUP REMINDER ───────────────────────────────────────────
// Tracked in localStorage so the reminder survives reloads and is visible
// to the (later) sync engine's local-only deny-list.
const LAST_BACKUP_KEY = "secplus-last-backup-at";
const BACKUP_BANNER_SNOOZE_KEY = "secplus-backup-banner-snooze-until";
const BACKUP_REMINDER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

// ─── EXPORT / IMPORT ───────────────────────────────────────────
function exportStoreToFile(store) {
  const payload = JSON.stringify({
    app: "secplus-quiz",
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    store,
  }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `secplus-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
    }
  } catch (e) {
    console.error("[secplus] last-backup-at write failed:", e);
  }
}

function importStoreFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        // Accept both wrapped ({ app, store }) and raw shapes
        const raw = parsed && parsed.store ? parsed.store : parsed;
        resolve(migrateStore(raw));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsText(file);
  });
}

// ─── EXAM SESSION PERSISTENCE ──────────────────────────────────
// In-progress exam state is stored under a separate key so it doesn't bloat
// the main store and so it can be cleared independently on submit/discard.
const EXAM_SESSION_KEY = "secplus-v4-exam-session";
const EXAM_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — older = discarded

function saveExamSession(session) {
  try {
    const payload = JSON.stringify({ ...session, savedAt: Date.now() });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(EXAM_SESSION_KEY, payload);
    }
    if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
      window.storage.set(EXAM_SESSION_KEY, payload).catch(e => {
        console.error("[secplus] exam session save to window.storage failed:", e);
      });
    }
  } catch (e) {
    console.error("[secplus] saveExamSession failed:", e);
  }
}

async function loadExamSession() {
  let raw = null;
  try {
    if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
      const r = await window.storage.get(EXAM_SESSION_KEY);
      if (r && r.value) raw = r.value;
    }
  } catch (e) {
    console.error("[secplus] loadExamSession window.storage failed:", e);
  }
  if (!raw) {
    try {
      if (typeof localStorage !== "undefined") raw = localStorage.getItem(EXAM_SESSION_KEY);
    } catch (e) {
      console.error("[secplus] loadExamSession localStorage failed:", e);
    }
  }
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session || !session.savedAt) return null;
    if (Date.now() - session.savedAt > EXAM_SESSION_TTL_MS) return null;
    if (!Array.isArray(session.questions) || session.questions.length === 0) return null;
    return session;
  } catch (e) {
    console.error("[secplus] loadExamSession parse failed:", e);
    return null;
  }
}

function clearExamSession() {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(EXAM_SESSION_KEY);
  } catch (e) {
    console.error("[secplus] clearExamSession localStorage failed:", e);
  }
  try {
    if (typeof window !== "undefined" && window.storage) {
      if (typeof window.storage.delete === "function") {
        window.storage.delete(EXAM_SESSION_KEY).catch(() => {});
      } else if (typeof window.storage.set === "function") {
        // Fallback if delete isn't available — overwrite with empty marker
        window.storage.set(EXAM_SESSION_KEY, "").catch(() => {});
      }
    }
  } catch (e) {
    console.error("[secplus] clearExamSession window.storage failed:", e);
  }
}

// ─── SM-2 ANKI-STYLE SCHEDULING ─────────────────────────────────
// Each record tracks:
//   correct, total   — cumulative tally for the accuracy dashboard
//   ease             — ease factor (multiplier), starts at 2.5
//   interval         — days until next review
//   reps             — consecutive non-Again reviews
//   nextDue          — ISO date string
//   lastRating       — last rating applied (1-4)
// Ratings: 1 Again (failed), 2 Hard, 3 Good, 4 Easy
function applyRating(record, rating) {
  const r = {
    correct: 0,
    total: 0,
    ease: 2.5,
    interval: 0,
    reps: 0,
    ...(record || {}),
  };
  r.total += 1;
  if (rating >= 2) r.correct += 1;

  if (rating === 1) {
    // Again — reset streak and come back tomorrow; drop ease
    r.reps = 0;
    r.interval = 1;
    r.ease = Math.max(1.3, r.ease - 0.2);
  } else if (rating === 2) {
    // Hard — small interval growth; drop ease slightly
    r.interval = Math.max(1, Math.round((r.interval || 1) * 1.2));
    r.ease = Math.max(1.3, r.ease - 0.15);
    r.reps += 1;
  } else if (rating === 3) {
    // Good — standard SM-2 progression
    if (r.reps === 0) r.interval = 1;
    else if (r.reps === 1) r.interval = 6;
    else r.interval = Math.max(1, Math.round(r.interval * r.ease));
    r.reps += 1;
  } else if (rating === 4) {
    // Easy — longer interval; bump ease
    if (r.reps === 0) r.interval = 4;
    else if (r.reps === 1) r.interval = 6;
    else r.interval = Math.max(1, Math.round(r.interval * r.ease * 1.3));
    r.ease = r.ease + 0.15;
    r.reps += 1;
  }

  const d = new Date();
  d.setDate(d.getDate() + r.interval);
  // Use local-time date stamp (en-CA gives YYYY-MM-DD) so streak rollover
  // follows the user's actual calendar day rather than UTC.
  r.nextDue = d.toLocaleDateString("en-CA");
  r.lastRating = rating;
  return r;
}

function todayStr() { return new Date().toLocaleDateString("en-CA"); }

// ─── HELPERS ────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle the answer options on an MC/scenario question so the correct answer
// isn't memorised by position. Returns a new question object with `opts`
// reordered and `a` remapped to the new index of the correct option.
// No-op for questions without opts (matching, etc.).
function shuffleOptions(q) {
  if (!q || !Array.isArray(q.opts) || typeof q.a !== "number") return q;
  const indexed = q.opts.map((opt, i) => ({ opt, orig: i }));
  const shuffled = shuffle(indexed);
  const newA = shuffled.findIndex(x => x.orig === q.a);
  return { ...q, opts: shuffled.map(x => x.opt), a: newA };
}

function getAllVideos(sections) {
  return sections.flatMap(s => s.videos);
}

function getWatchedVideos(sections, watched) {
  return getAllVideos(sections).filter(v => watched.includes(v.id));
}

// ─── ERROR BOUNDARY ────────────────────────────────────────────
// React class component (hooks can't implement error boundaries). Wraps each
// tab so an uncaught exception in one tab — bad data from an import, missing
// field on an SM-2 record from an older schema version, etc. — doesn't take
// down the whole app. The user can stay on a working tab and continue. Export
// is still reachable from Progress even if Quiz or Exam crashes.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Log to console; nothing else we can do without a server.
    console.error(`[ErrorBoundary:${this.props.name || "unknown"}]`, error, info);
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: "#450a0a22", border: "1px solid #ef4444", borderRadius: 12, margin: "16px 0", color: "#fca5a5" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>⚠ The {this.props.name || "tab"} tab hit an error.</div>
          <div style={{ fontSize: 13, marginBottom: 12, color: "#fecaca", opacity: 0.9 }}>
            Other tabs should still work. If this keeps happening, head to Progress → Backup & Restore and export your progress so nothing's lost, then try reloading the page.
          </div>
          {this.state.error && (
            <details style={{ fontSize: 12, fontFamily: "monospace", background: "#1e293b", padding: 8, borderRadius: 6, marginBottom: 12, color: "#cbd5e1" }}>
              <summary style={{ cursor: "pointer", marginBottom: 4 }}>Technical details</summary>
              <div>{String(this.state.error && this.state.error.message || this.state.error)}</div>
            </details>
          )}
          <button onClick={this.handleReset} style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── MODAL ─────────────────────────────────────────────────────
// Simple dark-themed modal used as a drop-in replacement for native
// window.confirm / window.alert. Some artifact sandboxes silently swallow
// synchronous browser dialogs, so rendering our own avoids that class of
// bug entirely. Dismissing via backdrop click or Escape keeps behaviour
// consistent with the native prompts.
function Modal({ open, title, body, actions, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={styles.modalBackdrop}>
      <div onClick={e => e.stopPropagation()} style={styles.modalCard}>
        {title && <div style={styles.modalTitle}>{title}</div>}
        <div style={styles.modalBody}>{body}</div>
        <div style={styles.modalActions}>{actions}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [store, setStore] = useState(DEFAULT_STORE);
  const [loaded, setLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState({ primary: "unknown", fallbackUsed: false, error: null });
  const [importMsg, setImportMsg] = useState(null); // { kind: 'ok'|'err', text }
  const [tab, setTab] = useState("progress"); // progress | quiz | cram | exam
  const [view, setView] = useState("main");   // main | sync
  // Backup reminder state — hydrated from localStorage on mount, updated on
  // every successful export. Both stored as ms-epoch numbers; null means
  // "no record yet" (first-run users see the reminder banner immediately).
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [bannerSnoozeUntil, setBannerSnoozeUntil] = useState(null);
  // Sync engine status mirror — subscribed once on mount.
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  // When an exam's "Drill Wrong" button is clicked, the wrong questions are
  // stored here and the user is switched to the Quiz tab, which picks them up
  // and starts a drill session. null means no pending drill.
  const [pendingDrill, setPendingDrill] = useState(null);
  // Modal dialog state. `null` = closed. Shape: { title?, body, actions }.
  const [dialog, setDialog] = useState(null);

  // Load persisted store on mount
  useEffect(() => {
    loadStore().then(({ data, status }) => {
      setStore(data);
      setStorageStatus(status);
      setLoaded(true);
    });
  }, []);

  // Subscribe to sync engine status changes — keeps the header indicator
  // and any UI showing engine state in sync without polling.
  useEffect(() => {
    setSyncStatus(getSyncStatus());
    return subscribeSync(setSyncStatus);
  }, []);

  // Re-render the sync indicator once a minute so the "synced HH:MM" age
  // check transitions to "degraded" after 60 minutes without traffic.
  useEffect(() => {
    const i = setInterval(() => setSyncStatus(getSyncStatus()), 60 * 1000);
    return () => clearInterval(i);
  }, []);

  // Hydrate backup reminder state from localStorage on mount
  useEffect(() => {
    try {
      if (typeof localStorage === "undefined") return;
      const lba = localStorage.getItem(LAST_BACKUP_KEY);
      if (lba) {
        const n = Number(lba);
        if (Number.isFinite(n)) setLastBackupAt(n);
      }
      const sn = localStorage.getItem(BACKUP_BANNER_SNOOZE_KEY);
      if (sn) {
        const n = Number(sn);
        if (Number.isFinite(n)) setBannerSnoozeUntil(n);
      }
    } catch (e) {
      console.error("[secplus] backup reminder hydrate failed:", e);
    }
  }, []);

  // Save whenever store changes — but only after initial load to avoid
  // overwriting real data with the empty DEFAULT_STORE on first render
  useEffect(() => {
    if (!loaded) return;
    saveStore(store).then(res => {
      if (!res.windowOk && !res.localOk) {
        setStorageStatus({ primary: "none", fallbackUsed: false, error: res.error || "Both storage layers unavailable" });
      } else if (!res.windowOk && res.localOk) {
        setStorageStatus(s => s.primary === "localStorage" ? s : { primary: "localStorage", fallbackUsed: true, error: res.error });
      } else if (res.windowOk && !res.localOk) {
        setStorageStatus(s => s.primary === "window.storage" ? s : { primary: "window.storage", fallbackUsed: false, error: null });
      } else {
        // Both OK — clear any prior error
        setStorageStatus(s => s.error ? { ...s, error: null } : s);
      }
    });
  }, [store, loaded]);

  // Export / import handlers
  const onExport = useCallback(() => {
    try {
      exportStoreToFile(store);
      setLastBackupAt(Date.now());
      setImportMsg({ kind: "ok", text: "Backup downloaded — check your Downloads folder." });
    } catch (e) {
      console.error("[secplus] export failed:", e);
      setImportMsg({ kind: "err", text: "Backup failed: " + (e && e.message ? e.message : e) });
    }
  }, [store]);

  const onImport = useCallback(async (file) => {
    if (!file) return;
    try {
      const imported = await importStoreFromFile(file);
      setDialog({
        title: "Replace progress?",
        body: "Replace your current progress with the imported file? This cannot be undone.",
        actions: (
          <>
            <button
              onClick={() => { setDialog(null); setImportMsg({ kind: "ok", text: "Import cancelled." }); }}
              style={styles.modalBtn}
            >Cancel</button>
            <button
              onClick={() => {
                setDialog(null);
                setStore(imported);
                setImportMsg({ kind: "ok", text: `Imported ${imported.watched.length} watched videos and ${Object.keys(imported.sm2).length} question records.` });
              }}
              style={styles.modalBtnDanger}
            >Replace</button>
          </>
        ),
      });
    } catch (e) {
      console.error("[secplus] import failed:", e);
      setImportMsg({ kind: "err", text: "Import failed: " + (e && e.message ? e.message : "invalid file") });
    }
  }, []);

  const watched = store.watched;
  const watchedSet = new Set(watched);

  // Backup reminder banner visibility — only after the store has loaded so
  // we don't briefly show "no backup" before localStorage is read.
  const backupBanner = (() => {
    if (!loaded) return null;
    const now = Date.now();
    if (bannerSnoozeUntil && bannerSnoozeUntil > now) return null;
    if (lastBackupAt) {
      const days = Math.floor((now - lastBackupAt) / DAY_MS);
      if (days < BACKUP_REMINDER_DAYS) return null;
      return { message: `It's been ${days} days since your last backup — back up now?` };
    }
    return { message: "You haven't backed up your progress yet — back up now?" };
  })();

  const snoozeBackupBanner = () => {
    const until = Date.now() + BACKUP_REMINDER_DAYS * DAY_MS;
    setBannerSnoozeUntil(until);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(BACKUP_BANNER_SNOOZE_KEY, String(until));
      }
    } catch (e) {
      console.error("[secplus] backup reminder snooze write failed:", e);
    }
  };

  function toggleWatched(vid) {
    setStore(s => {
      const arr = s.watched.includes(vid)
        ? s.watched.filter(x => x !== vid)
        : [...s.watched, vid];
      return { ...s, watched: arr };
    });
  }

  // Preferred API: record a confidence rating (1=Again, 2=Hard, 3=Good, 4=Easy)
  function recordRating(questionKey, rating) {
    setStore(s => {
      const prev = s.sm2[questionKey];
      const next = applyRating(prev, rating);
      return { ...s, sm2: { ...s.sm2, [questionKey]: next } };
    });
  }

  // Compat wrapper — used by Exam (binary correctness) and matching questions
  // where per-card rating doesn't apply. Wrong maps to Again; correct to Good.
  function recordResult(questionKey, isCorrect) {
    recordRating(questionKey, isCorrect ? 3 : 1);
  }

  function recordSession(score, total, mode) {
    setStore(s => {
      const today = todayStr();
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-CA");
      const isNewDay = s.lastStudy !== today;
      const isConsecutive = s.lastStudy === yesterdayStr;
      return {
        ...s,
        history: [{ date: today, score, total, mode, ts: Date.now() }, ...s.history].slice(0, 50),
        streak: isNewDay ? (isConsecutive ? (s.streak || 0) + 1 : 1) : s.streak,
        lastStudy: today,
      };
    });
  }

  const watchedVideos = getWatchedVideos(ALL_SECTIONS, watched);

  return (
    <>
    <div style={styles.app}>
      {(storageStatus.primary === "none" || storageStatus.error) && (
        <div style={{ background: "#7f1d1d", color: "#fecaca", padding: "10px 16px", textAlign: "center", fontSize: 13, borderBottom: "1px solid #991b1b" }}>
          ⚠️ <strong>Progress may not be saving.</strong>{" "}
          {storageStatus.primary === "none"
            ? "Neither artifact storage nor localStorage is available in this context."
            : `Active store: ${storageStatus.primary}${storageStatus.fallbackUsed ? " (fallback)" : ""}.`}
          {storageStatus.error && <span style={{ opacity: 0.8 }}> — {storageStatus.error}</span>}
          {" "}Export your progress regularly as a backup.
        </div>
      )}
      {importMsg && (
        <div style={{ background: importMsg.kind === "ok" ? "#064e3b" : "#7f1d1d", color: importMsg.kind === "ok" ? "#bbf7d0" : "#fecaca", padding: "10px 16px", textAlign: "center", fontSize: 13, borderBottom: "1px solid #000", display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} style={{ background: "rgba(255,255,255,0.15)", color: "inherit", border: "none", borderRadius: 4, padding: "2px 10px", cursor: "pointer", fontSize: 12 }}>Dismiss</button>
        </div>
      )}
      {backupBanner && (
        <div style={{ background: "#78350f", color: "#fed7aa", padding: "10px 16px", textAlign: "center", fontSize: 13, borderBottom: "1px solid #000", display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>{backupBanner.message}</span>
          <button
            onClick={onExport}
            style={{ background: "#f59e0b", color: "#0f172a", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
          >Back up now</button>
          <button
            onClick={snoozeBackupBanner}
            style={{ background: "rgba(255,255,255,0.15)", color: "inherit", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
          >Remind me in 7 days</button>
        </div>
      )}
      <div style={{ display: view === "main" ? "block" : "none" }}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.headerTitle}>Security+ SY0-701</div>
            <div style={styles.headerSub}>Prof. Messer Course Companion</div>
          </div>
          <div style={styles.headerStats}>
            <StatPill label="Watched" value={`${watched.length}/${getAllVideos(ALL_SECTIONS).length}`} />
            <StatPill label="Streak" value={`${store.streak}🔥`} />
            <button
              onClick={onExport}
              title="Download a backup of your progress as a JSON file"
              style={styles.headerBackupBtn}
            >
              💾 Backup
            </button>
            {syncStatus.enabled && (
              <button
                onClick={() => setView("sync")}
                title="Open sync settings"
                style={styles.headerSyncPill}
              >
                <span style={{ ...styles.headerSyncDot, background: deriveHealth(syncStatus).color }} />
                <span style={styles.headerSyncLabel}>{deriveHealth(syncStatus).label}</span>
              </button>
            )}
          </div>
        </div>
        <nav style={styles.nav}>
          {[["progress","📊 Progress"],["quiz","❓ Quiz"],["cram","📖 Cram"],["exam","🎓 Exam"]].map(([t,label]) => (
            <button key={t} onClick={() => setTab(t)} style={{...styles.navBtn, ...(tab===t?styles.navBtnActive:{})}}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        {/* All tabs stay mounted so in-progress quiz/exam state survives a
            switch to Progress and back. Only the active tab is visible. Each
            tab is wrapped in an ErrorBoundary so a crash in one tab can't
            take down the whole app — the user can switch to a working tab
            and export their data from Progress. */}
        <div style={{ display: tab === "progress" ? "block" : "none" }}>
          <ErrorBoundary name="Progress">
            <ProgressTab
              sections={ALL_SECTIONS}
              store={store}
              watchedSet={watchedSet}
              toggleWatched={toggleWatched}
              onExport={onExport}
              onImport={onImport}
              storageStatus={storageStatus}
            />
          </ErrorBoundary>
        </div>
        <div style={{ display: tab === "quiz" ? "block" : "none" }}>
          <ErrorBoundary name="Quiz">
            <QuizTab
              sections={ALL_SECTIONS}
              watchedVideos={watchedVideos}
              store={store}
              recordResult={recordResult}
              recordRating={recordRating}
              recordSession={recordSession}
              pendingDrill={pendingDrill}
              clearPendingDrill={() => setPendingDrill(null)}
            />
          </ErrorBoundary>
        </div>
        <div style={{ display: tab === "cram" ? "block" : "none" }}>
          <ErrorBoundary name="Cram">
            <CramTab
              watchedVideos={watchedVideos}
            />
          </ErrorBoundary>
        </div>
        <div style={{ display: tab === "exam" ? "block" : "none" }}>
          <ErrorBoundary name="Exam">
            <ExamTab
              watchedVideos={watchedVideos}
              store={store}
              recordResult={recordResult}
              recordSession={recordSession}
              onDrillWrongAsQuiz={(wrongQs) => {
                setPendingDrill(wrongQs);
                setTab("quiz");
              }}
            />
          </ErrorBoundary>
        </div>
      </main>
      <footer style={styles.footer}>
        <button onClick={() => setView("sync")} style={styles.footerLink}>
          ⚙ Sync settings
        </button>
      </footer>
      </div>
      {view === "sync" && (
        <SyncSettings onBack={() => setView("main")} setDialog={setDialog} />
      )}
    </div>
    <Modal
      open={!!dialog}
      title={dialog && dialog.title}
      body={dialog && dialog.body}
      actions={dialog && dialog.actions}
      onClose={() => setDialog(null)}
    />
    </>
  );
}

// ─── STAT PILL ─────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div style={styles.statPill}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </div>
  );
}

// ─── PROGRESS TAB ──────────────────────────────────────────────
function ProgressTab({ sections, store, watchedSet, toggleWatched, onExport, onImport, storageStatus }) {
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef(null);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const allVids = getAllVideos(sections);
  const watched = [...watchedSet];
  const totalQ = allVids.reduce((n, v) => n + v.questions.length, 0);

  // "Due for Review" = questions you've attempted at least once whose next
  // review date has arrived or passed. New questions (never attempted) are
  // NOT due for review — they're new material, counted separately below.
  // Overdue items are included in the due count because they're still
  // actionable; SM-2 doesn't penalise lateness, it just wants them revisited.
  const today = todayStr();
  let dueForReview = 0;
  Object.values(store.sm2 || {}).forEach(rec => {
    if (!rec || typeof rec.total !== "number" || rec.total === 0) return;
    if (rec.nextDue && rec.nextDue <= today) dueForReview++;
  });

  // "New to Practice" = questions on watched videos that have no SM-2
  // record yet. Counts MC, scenarios, and matching across all watched videos.
  let newToPractice = 0;
  sections.forEach(sec => {
    sec.videos.forEach(v => {
      if (!watchedSet.has(v.id)) return;
      v.questions.forEach((_q, qi) => {
        if (!store.sm2[mcKey(v.id, qi)]) newToPractice++;
      });
      (v.scenarios || []).forEach((_q, qi) => {
        if (!store.sm2[scenKey(v.id, qi)]) newToPractice++;
      });
      if (v.matching && v.matching.length > 0 && !store.sm2[`match-${v.id}`]) {
        newToPractice++;
      }
    });
  });

  return (
    <div>
      {/* Summary cards */}
      <div style={styles.cardRow}>
        <SummaryCard title="Videos Watched" value={`${watched.length}/${getAllVideos(sections).length}`} color="#3b82f6" />
        <SummaryCard
          title="Due for Review"
          value={dueForReview}
          color="#f59e0b"
          subtitle={newToPractice > 0 ? `+ ${newToPractice} new to try` : null}
        />
        <SummaryCard title="Total Questions" value={totalQ} color="#8b5cf6" />
        <SummaryCard title="Sessions" value={store.history.length} color="#10b981" />
      </div>

      {/* Per-domain accuracy dashboard */}
      <DomainAccuracyCard sections={sections} store={store} watchedSet={watchedSet} />

      {/* Backup & Restore */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>💾 Backup & Restore</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          Export your progress as a JSON file to keep a backup outside the app. Import it later to restore.
          {storageStatus && (
            <span style={{ display: "block", marginTop: 6, fontSize: 12, color: storageStatus.primary === "none" ? "#f87171" : "#64748b" }}>
              Active storage: <code style={{ color: "#cbd5e1" }}>{storageStatus.primary}</code>
              {storageStatus.fallbackUsed ? " (fallback)" : ""}
              {storageStatus.error ? ` · error: ${storageStatus.error}` : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={onExport}
            style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            ⬇ Export Progress
          </button>
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            ⬆ Import Progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (file) onImport(file);
              // Reset so importing the same file again re-triggers the handler
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Recent history */}
      {store.history.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Recent Sessions</div>
          {store.history.slice(0, 5).map((h, i) => (
            <div key={i} style={styles.historyRow}>
              <span style={styles.historyDate}>{h.date}</span>
              <span style={styles.historyMode}>{h.mode}</span>
              <span style={{ color: h.score / h.total >= CONFIG.PASS_PERCENT / 100 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                {h.score}/{h.total} ({Math.round(h.score / h.total * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Section tree */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Professor Messer Videos</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {["all","watched","unwatched"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {sections.map(sec => {
          const secVideos = sec.videos.filter(v =>
            filter === "all" ? true : filter === "watched" ? watchedSet.has(v.id) : !watchedSet.has(v.id)
          );
          if (secVideos.length === 0) return null;
          const secWatched = sec.videos.filter(v => watchedSet.has(v.id)).length;
          return (
            <div key={sec.id} style={styles.sectionRow}>
              <button onClick={() => toggle(sec.id)} style={styles.sectionHeader}>
                <span>{expanded[sec.id] ? "▼" : "▶"} {sec.label}</span>
                <span style={styles.sectionCount}>{secWatched}/{sec.videos.length}</span>
              </button>
              {expanded[sec.id] && secVideos.map(v => {
                const isWatched = watchedSet.has(v.id);
                const rec = v.questions.map((_, qi) => store.sm2[mcKey(v.id, qi)]).filter(Boolean);
                const avgAcc = rec.length > 0
                  ? Math.round(rec.reduce((n, r) => n + r.correct / r.total, 0) / rec.length * 100)
                  : null;
                return (
                  <div key={v.id} style={styles.videoRow}>
                    <div style={styles.videoInfo}>
                      <span style={{ color: isWatched ? "#10b981" : "#6b7280", fontSize: 18, marginRight: 8 }}>
                        {isWatched ? "✓" : "○"}
                      </span>
                      <span style={{ color: isWatched ? "#f1f5f9" : "#9ca3af", fontSize: 14 }}>
                        {v.id} – {v.title}
                      </span>
                      {avgAcc !== null && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: avgAcc >= CONFIG.PASS_PERCENT ? "#10b981" : "#f59e0b" }}>
                          {avgAcc}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleWatched(v.id)}
                      style={{ ...styles.watchBtn, ...(isWatched ? styles.watchBtnActive : {}) }}>
                      {isWatched ? "Watched ✓" : "Mark Watched"}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color, subtitle }) {
  return (
    <div style={{ ...styles.summaryCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

// ─── DOMAIN ACCURACY CARD ──────────────────────────────────────
// Aggregates SM-2 correct/total records by domain so you can see which of the
// five Security+ domains is actually dragging your score. Only counts
// questions you've attempted at least once — unattempted questions aren't a
// weakness, just unseen territory.
const DOMAIN_NAMES = {
  "1": "General Security Concepts",
  "2": "Threats, Vulnerabilities & Mitigations",
  "3": "Security Architecture",
  "4": "Security Operations",
  "5": "Security Program Mgmt & Oversight",
};
const DOMAIN_WEIGHTS_PCT = { "1": 12, "2": 22, "3": 18, "4": 28, "5": 20 };

function DomainAccuracyCard({ sections, store, watchedSet }) {
  // Compute stats per domain from the sm2 record set
  const stats = { "1": { correct: 0, total: 0, attempted: 0, available: 0, weakest: null },
                  "2": { correct: 0, total: 0, attempted: 0, available: 0, weakest: null },
                  "3": { correct: 0, total: 0, attempted: 0, available: 0, weakest: null },
                  "4": { correct: 0, total: 0, attempted: 0, available: 0, weakest: null },
                  "5": { correct: 0, total: 0, attempted: 0, available: 0, weakest: null } };

  // First pass: walk all videos to count available questions per domain
  // and build a lookup from videoId -> { section label, title }
  const videoMeta = {};
  sections.forEach(sec => {
    const d = sec.id.split(".")[0];
    sec.videos.forEach(v => {
      videoMeta[v.id] = { title: v.title, section: sec.label };
      if (!stats[d]) return;
      if (watchedSet.has(v.id)) {
        stats[d].available += v.questions.length + ((v.scenarios || []).length);
      }
    });
  });

  // Second pass: walk sm2 records, bucket by domain, track per-video accuracy
  // to surface the weakest topic per domain.
  const perVideo = {}; // videoId -> { correct, total }
  Object.entries(store.sm2 || {}).forEach(([key, rec]) => {
    if (!rec || typeof rec.total !== "number" || rec.total === 0) return;
    const videoId = videoIdFromKey(key);
    if (!videoId) return;
    const d = videoId.split(".")[0];
    if (!stats[d]) return;
    stats[d].correct += rec.correct || 0;
    stats[d].total += rec.total;
    stats[d].attempted += 1;
    if (!perVideo[videoId]) perVideo[videoId] = { correct: 0, total: 0 };
    perVideo[videoId].correct += rec.correct || 0;
    perVideo[videoId].total += rec.total;
  });

  // Identify the weakest video per domain (lowest accuracy, min 3 attempts)
  Object.entries(perVideo).forEach(([videoId, rec]) => {
    const d = videoId.split(".")[0];
    if (!stats[d]) return;
    if (rec.total < 3) return; // don't call 1/1 or 0/1 a weak spot
    const acc = rec.correct / rec.total;
    const meta = videoMeta[videoId];
    if (!meta) return;
    const current = stats[d].weakest;
    if (!current || acc < current.acc) {
      stats[d].weakest = { videoId, title: meta.title, acc, correct: rec.correct, total: rec.total };
    }
  });

  const anyAttempts = Object.values(stats).some(s => s.total > 0);
  if (!anyAttempts) {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>📊 Accuracy by Domain</div>
        <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
          Answer some quiz questions and this chart will show which of the 5 Security+ domains
          you're strongest and weakest in — weighted so you can prioritise the domains that
          matter most on exam day.
        </div>
      </div>
    );
  }

  // Color bands for accuracy
  const colorFor = (acc, total) => {
    if (total === 0) return "#475569";
    if (acc >= CONFIG.DOMAIN_STRONG_RATIO) return "#10b981"; // strong
    if (acc >= CONFIG.DOMAIN_OK_RATIO) return "#f59e0b"; // needs work
    return "#ef4444"; // weak
  };

  // Overall weighted score — simulates exam performance if your per-domain
  // accuracy matched the exam's domain weights
  const weightedPct = Object.entries(stats).reduce((sum, [d, s]) => {
    if (s.total === 0) return sum;
    const acc = s.correct / s.total;
    return sum + acc * (DOMAIN_WEIGHTS_PCT[d] / 100);
  }, 0);
  const totalWeight = Object.entries(stats).reduce((sum, [d, s]) => {
    return sum + (s.total > 0 ? DOMAIN_WEIGHTS_PCT[d] / 100 : 0);
  }, 0);
  const projectedScore = totalWeight > 0 ? Math.round((weightedPct / totalWeight) * 100) : 0;

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={styles.cardTitle}>📊 Accuracy by Domain</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          Weighted projection: <strong style={{ color: projectedScore >= CONFIG.PASS_PERCENT ? "#10b981" : "#f59e0b", fontSize: 14 }}>{projectedScore}%</strong>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>
        Projection applies the real exam's domain weights to your per-domain accuracy. A
        projection of 75%+ generally corresponds to a likely pass. Domains you haven't
        attempted yet are excluded from the projection.
      </div>
      {["1", "2", "3", "4", "5"].map(d => {
        const s = stats[d];
        const acc = s.total > 0 ? s.correct / s.total : 0;
        const pct = Math.round(acc * 100);
        const color = colorFor(acc, s.total);
        return (
          <div key={d} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ fontSize: 13, color: "#e2e8f0" }}>
                <strong>D{d}</strong> {DOMAIN_NAMES[d]}
                <span style={{ color: "#64748b", fontSize: 11, marginLeft: 6 }}>
                  (exam weight {DOMAIN_WEIGHTS_PCT[d]}%)
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color }}>
                {s.total > 0 ? `${pct}% · ${s.correct}/${s.total}` : "—"}
              </div>
            </div>
            <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.3s" }} />
            </div>
            {s.weakest && acc < CONFIG.DOMAIN_STRONG_RATIO && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                Weakest: <span style={{ color: "#cbd5e1" }}>{s.weakest.videoId} {s.weakest.title}</span>
                {" "}<span style={{ color: "#ef4444" }}>({Math.round(s.weakest.acc * 100)}%)</span>
              </div>
            )}
            {s.total === 0 && s.available > 0 && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                {s.available} questions unlocked — not yet attempted
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── QUIZ TAB ──────────────────────────────────────────────────
function QuizTab({ sections, watchedVideos, store, recordResult, recordRating, recordSession, pendingDrill, clearPendingDrill }) {
  const [mode, setMode] = useState(null); // null | "setup" | "running" | "results"
  const [dialog, setDialog] = useState(null); // modal state: { title?, body, actions } | null
  const showAlert = (body, title) => setDialog({
    title,
    body,
    actions: <button onClick={() => setDialog(null)} style={styles.modalBtnPrimary}>OK</button>,
  });
  const [setupMode, setSetupMode] = useState("standard");
  const [selectedVids, setSelectedVids] = useState([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [quizQ, setQuizQ] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExp, setShowExp] = useState(false);
  const [matchAnswers, setMatchAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  // Active recall: when true, options are hidden until user clicks "Show Options".
  // `optionsRevealed` tracks per-question reveal state — cleared on next question.
  const [activeRecall, setActiveRecall] = useState(false);
  const [optionsRevealed, setOptionsRevealed] = useState(false);

  // Active recall: whenever the question changes, re-hide the options so the
  // user has to consciously reveal them again. Show is sticky per-question.
  useEffect(() => {
    setOptionsRevealed(false);
  }, [idx]);

  // If a pending drill arrives from the Exam tab (user clicked "Drill Wrong"
  // on their exam results), load it as a quiz drill session and clear the
  // pending marker so navigating away and back doesn't re-trigger it.
  useEffect(() => {
    if (!pendingDrill || pendingDrill.length === 0) return;
    // Normalise exam question shape to the MC quiz shape and shuffle options
    const normalised = pendingDrill.map(q => shuffleOptions({ ...q, type: "mc" }));
    setQuizQ(shuffle(normalised));
    setIdx(0);
    setAnswers({});
    setShowExp(false);
    setMatchAnswers({});
    setShowResults(false);
    setResultData(null);
    setSetupMode("drill");
    setMode("running");
    clearPendingDrill && clearPendingDrill();
  }, [pendingDrill, clearPendingDrill]);

  // Keyboard shortcuts for the quiz running view:
  //   1-4  = select answer option OR rate card (depending on state)
  //   Enter= check answer when one is selected
  //   N / →= next question (after rating, but rating auto-advances, so N is a fallback)
  // Refs keep the listener callback reading current state without re-subscribing.
  const kbdRef = useRef({});
  kbdRef.current = { mode, quizQ, idx, answers, showExp, setupMode, activeRecall, optionsRevealed };
  useEffect(() => {
    function handler(e) {
      const ctx = kbdRef.current;
      if (ctx.mode !== "running") return;
      // Don't intercept when user is typing in an input (matching dropdowns etc.)
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const q = ctx.quizQ[ctx.idx];
      if (!q || q.type !== "mc") return; // matching has no keyboard flow
      const key = e.key;

      // Active recall: when options are hidden, Space/Enter reveals them.
      // Intercept BEFORE the normal shortcut logic so 1-4 don't fire on
      // invisible options.
      const optionsHidden = ctx.activeRecall && !ctx.optionsRevealed && !ctx.showExp;
      if (optionsHidden) {
        if (key === " " || key === "Enter") {
          e.preventDefault();
          setOptionsRevealed(true);
        }
        return;
      }

      // Numeric keys 1-4
      if (["1","2","3","4"].includes(key)) {
        const n = parseInt(key, 10);
        if (!ctx.showExp) {
          // Pre-check: select answer option (if it exists)
          if (n - 1 < q.opts.length) {
            e.preventDefault();
            setAnswers(a => ({ ...a, [ctx.idx]: n - 1 }));
          }
        } else {
          // Post-check: rate the card (1=Again, 2=Hard, 3=Good, 4=Easy)
          e.preventDefault();
          const recordKey = keyOf(q);
          recordRating(recordKey, n);
          setShowExp(false);
          if (ctx.idx + 1 >= ctx.quizQ.length) finishQuiz();
          else setIdx(ctx.idx + 1);
        }
      } else if (key === "Enter") {
        if (!ctx.showExp && ctx.answers[ctx.idx] !== undefined) {
          e.preventDefault();
          setShowExp(true);
        }
      } else if ((key === "n" || key === "N" || key === "ArrowRight") && ctx.showExp) {
        // Fallback: advance without rating (records Good by default)
        e.preventDefault();
        const recordKey = keyOf(q);
        const wasCorrect = ctx.answers[ctx.idx] === q.a;
        recordRating(recordKey, wasCorrect ? 3 : 1);
        setShowExp(false);
        if (ctx.idx + 1 >= ctx.quizQ.length) finishQuiz();
        else setIdx(ctx.idx + 1);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (watchedVideos.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>No videos watched yet</div>
        <div style={{ color: "#9ca3af", marginTop: 8 }}>Go to Progress and mark videos as watched to unlock questions</div>
      </div>
    );
  }

  if (showResults && resultData) {
    return (
      <ResultsView
        data={resultData}
        quizQ={quizQ}
        answers={answers}
        onReset={() => { setShowResults(false); setMode(null); }}
        onDrillWrong={(wrongQs) => {
          if (!wrongQs || wrongQs.length === 0) return;
          setQuizQ(shuffle(wrongQs.map(shuffleOptions)));
          setIdx(0);
          setAnswers({});
          setShowExp(false);
          setMatchAnswers({});
          setShowResults(false);
          setResultData(null);
          // Flag the session mode so the result header can say "Drill"
          setSetupMode("drill");
          setMode("running");
        }}
      />
    );
  }

  if (!mode) {
    return (
      <>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Quiz Mode</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            ["standard","📝 Standard","Choose topics & count"],
            ["scenario","🎯 Scenario","Real-world situation questions"],
            ["spaced","🔁 Spaced Repetition","Questions due today"],
            ["weak","⚡ Weak Spots","Your lowest-scoring topics"],
            ["matching","🔗 Matching Exercise","Term-to-definition matching"],
          ].map(([m, title, desc]) => (
            <button key={m} onClick={() => setSetupMode(m)} style={{ ...styles.modeCard, ...(setupMode === m ? styles.modeCardActive : {}) }}>
              <div style={{ fontSize: 24 }}>{title.split(" ")[0]}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{title.slice(2)}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{desc}</div>
            </button>
          ))}
        </div>

        {(setupMode === "standard" || setupMode === "matching" || setupMode === "scenario") && (
          <div>
            <div style={styles.formLabel}>Select videos:</div>
            {sections.map(sec => {
              const available = sec.videos.filter(v => store.watched.includes(v.id));
              if (available.length === 0) return null;
              return (
                <div key={sec.id} style={{ marginBottom: 8 }}>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>{sec.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {available.map(v => (
                      <button key={v.id} onClick={() => setSelectedVids(s => s.includes(v.id) ? s.filter(x => x !== v.id) : [...s, v.id])}
                        style={{ ...styles.vidChip, ...(selectedVids.includes(v.id) ? styles.vidChipActive : {}) }}>
                        {v.id}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setSelectedVids(watchedVideos.map(v => v.id))} style={styles.linkBtn}>Select all</button>
              <button onClick={() => setSelectedVids([])} style={styles.linkBtn}>Clear</button>
            </div>
            {setupMode === "standard" && (
              <div style={{ marginTop: 12 }}>
                <div style={styles.formLabel}>Questions: {questionCount}</div>
                <input type="range" min={5} max={50} value={questionCount} onChange={e => setQuestionCount(+e.target.value)}
                  style={{ width: "100%" }} />
              </div>
            )}
          </div>
        )}

        {setupMode !== "matching" && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, padding: "10px 12px", background: "#1e293b", borderRadius: 6, cursor: "pointer", border: activeRecall ? "1px solid #3b82f6" : "1px solid #334155" }}>
            <input
              type="checkbox"
              checked={activeRecall}
              onChange={e => setActiveRecall(e.target.checked)}
              style={{ marginTop: 2, cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>🧠 Active recall mode</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, lineHeight: 1.4 }}>
                Hide the answer options until you're ready. Read the question, think of the answer in your head, then reveal the options to pick from. Stronger learning, slower pace.
              </div>
            </div>
          </label>
        )}

        <button onClick={() => startQuiz(setupMode)} style={styles.startBtn}>
          Start {setupMode === "spaced" ? "Spaced Repetition" : setupMode === "weak" ? "Weak Spots" : setupMode === "matching" ? "Matching" : setupMode === "scenario" ? "Scenario Quiz" : "Quiz"}
        </button>
      </div>
      <Modal
        open={!!dialog}
        title={dialog && dialog.title}
        body={dialog && dialog.body}
        actions={dialog && dialog.actions}
        onClose={() => setDialog(null)}
      />
      </>
    );
  }

  if (mode === "running") {
    const q = quizQ[idx];
    if (!q) return null;

    if (q.type === "matching") {
      return (
        <MatchingQuestion
          key={`match-${q.videoId}-${idx}`}
          q={q}
          matchAnswers={matchAnswers}
          setMatchAnswers={setMatchAnswers}
          showExp={showExp}
          onCheck={() => setShowExp(true)}
          onNext={() => {
            // Partial credit: record each pair as its own SM-2 card so
            // consistently-missed pairs surface in weak spots. New writes
            // use `match-${videoId}-${pairIdx}`; legacy `${videoId}-m` and
            // `${videoId}-m-${pairIdx}` records are converted on load.
            q.pairs.forEach((p, pairIdx) => {
              const pairKey = matchKey(q.videoId, pairIdx);
              const chosen = matchAnswers[p.prompt];
              const wasCorrect = chosen === p.answer;
              recordResult(pairKey, wasCorrect);
            });
            setMatchAnswers({});
            setShowExp(false);
            if (idx + 1 >= quizQ.length) finishQuiz();
            else setIdx(idx + 1);
          }}
        />
      );
    }

    const selected = answers[idx];
    const checked = showExp;
    return (
      <div style={styles.card}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((idx + 1) / quizQ.length) * 100}%` }} />
        </div>
        <div style={styles.qMeta}>
          {setupMode === "drill" && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 11, marginRight: 6, fontWeight: 700 }}>DRILL</span>}
          {q.isScenario && <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 11, marginRight: 6, fontWeight: 700 }}>SCENARIO</span>}
          {q.videoId} – {q.videoTitle}
        </div>
        <div style={styles.questionText}>{q.q}</div>
        {(() => {
          // Active recall gating: hide options until user reveals them.
          // `showExp` means the answer has already been checked, so options
          // must always be visible at that point (they are the feedback UI).
          const hideOptions = activeRecall && !optionsRevealed && !showExp;
          return (
            <>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                {hideOptions ? (
                  <>Shortcuts: <kbd style={kbdStyle}>Space</kbd>/<kbd style={kbdStyle}>Enter</kbd> reveal options</>
                ) : (
                  <>Shortcuts: <kbd style={kbdStyle}>1</kbd>–<kbd style={kbdStyle}>4</kbd> select ·{" "}
                  <kbd style={kbdStyle}>Enter</kbd> check{checked ? <> · <kbd style={kbdStyle}>1</kbd>–<kbd style={kbdStyle}>4</kbd> rate</> : null}</>
                )}
              </div>
              {hideOptions ? (
                <div style={{ padding: "24px 16px", background: "#1e293b", borderRadius: 8, border: "1px dashed #3b82f6", textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
                    🧠 Think of your answer first. When ready, reveal the options to pick from.
                  </div>
                  <button
                    onClick={() => setOptionsRevealed(true)}
                    style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
                  >
                    Show Options
                  </button>
                </div>
              ) : (
                <div style={styles.optionGrid}>
                  {q.opts.map((opt, oi) => {
                    let bg = styles.option;
                    if (checked) {
                      if (oi === q.a) bg = { ...styles.option, ...styles.optionCorrect };
                      else if (oi === selected) bg = { ...styles.option, ...styles.optionWrong };
                    } else if (oi === selected) {
                      bg = { ...styles.option, ...styles.optionSelected };
                    }
                    return (
                      <button key={oi} onClick={() => !checked && setAnswers(a => ({ ...a, [idx]: oi }))} style={bg}>
                        <span style={{ display: "inline-block", minWidth: 22, marginRight: 8, color: "#64748b", fontWeight: 700, fontSize: 12 }}>{oi + 1}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
        {showExp && (
          <div style={styles.explanation}>
            <strong>{selected === q.a ? "✓ Correct!" : "✗ Incorrect."}</strong> {q.exp}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {!checked && selected !== undefined && (
            <button onClick={() => setShowExp(true)} style={styles.checkBtn}>
              Check Answer
            </button>
          )}
          {checked && (() => {
            const key = keyOf(q);
            const prev = store.sm2[key];
            const wasWrong = selected !== q.a;
            // Compute previews of the next interval for each rating so user
            // can make an informed choice. These never mutate state.
            const previewInterval = (rating) => applyRating(prev, rating).interval;
            const ratingBtn = (rating, label, color, emphasise) => (
              <button
                key={rating}
                onClick={() => {
                  recordRating(key, rating);
                  setShowExp(false);
                  if (idx + 1 >= quizQ.length) finishQuiz();
                  else setIdx(idx + 1);
                }}
                style={{
                  flex: "1 1 120px",
                  padding: "10px 12px",
                  background: emphasise ? color : "#1e293b",
                  color: emphasise ? "#fff" : color,
                  border: `2px solid ${color}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
                title={`Schedule this card for ${previewInterval(rating)} day${previewInterval(rating) === 1 ? "" : "s"} from now`}
              >
                <div>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                  {previewInterval(rating)}d
                </div>
              </button>
            );
            return (
              <>
                {ratingBtn(1, "Again", "#ef4444", wasWrong)}
                {ratingBtn(2, "Hard", "#f59e0b", false)}
                {ratingBtn(3, "Good", "#10b981", !wasWrong)}
                {ratingBtn(4, "Easy", "#06b6d4", false)}
              </>
            );
          })()}
        </div>
      </div>
    );
  }

  function startQuiz(m) {
    let pool = [];
    if (m === "spaced") {
      const today = todayStr();
      watchedVideos.forEach(v => {
        v.questions.forEach((q, qi) => {
          const key = mcKey(v.id, qi);
          const rec = store.sm2[key];
          if (!rec || rec.nextDue <= today) {
            pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" });
          }
        });
      });
      if (pool.length === 0) {
        showAlert("No questions due today! Come back tomorrow or switch to Standard mode.");
        return;
      }
    } else if (m === "weak") {
      const weak = watchedVideos.filter(v => {
        const recs = v.questions.map((_, qi) => store.sm2[mcKey(v.id, qi)]).filter(Boolean);
        if (recs.length === 0) return true;
        return recs.reduce((n, r) => n + r.correct / r.total, 0) / recs.length < CONFIG.WEAK_SPOT_RATIO;
      });
      if (weak.length === 0) {
        showAlert(`No weak spots detected! All watched videos are at ${Math.round(CONFIG.WEAK_SPOT_RATIO * 100)}%+ accuracy. Try Standard mode instead.`);
        return;
      }
      weak.forEach(v => v.questions.forEach((q, qi) => pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" })));
    } else if (m === "matching") {
      const vids = selectedVids.length ? watchedVideos.filter(v => selectedVids.includes(v.id)) : watchedVideos;
      vids.forEach(v => {
        if (v.matching && v.matching.length >= 3) {
          pool.push({ type: "matching", videoId: v.id, videoTitle: v.title, pairs: v.matching });
        }
      });
      if (pool.length === 0) { showAlert("Select at least one video with matching pairs."); return; }
    } else if (m === "scenario") {
      const vids = selectedVids.length ? watchedVideos.filter(v => selectedVids.includes(v.id)) : watchedVideos;
      if (vids.length === 0) { showAlert("Select at least one video."); return; }
      vids.forEach(v => {
        if (v.scenarios) {
          v.scenarios.forEach((q, qi) => pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc", isScenario: true }));
        }
      });
      if (pool.length === 0) {
        showAlert("No scenario questions available for selected videos yet. Domain 2 videos have scenarios — try selecting those.");
        return;
      }
      pool = shuffle(pool).slice(0, questionCount);
    } else {
      const vids = selectedVids.length ? watchedVideos.filter(v => selectedVids.includes(v.id)) : watchedVideos;
      if (vids.length === 0) { showAlert("Select at least one video."); return; }
      vids.forEach(v => v.questions.forEach((q, qi) => pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" })));
      pool = shuffle(pool).slice(0, questionCount);
    }

    setQuizQ(shuffle(pool.map(shuffleOptions)));
    setIdx(0);
    setAnswers({});
    setShowExp(false);
    setMatchAnswers({});
    setMode("running");
  }

  function finishQuiz() {
    // Use quizQ index directly - indexOf breaks when question objects are structurally identical
    let correct = 0, total = 0;
    quizQ.forEach((q, qIdx) => {
      if (q.type !== "mc") return;
      total++;
      if (answers[qIdx] === q.a) correct++;
    });
    recordSession(correct, total || 1, setupMode);
    setResultData({ correct, total });
    setShowResults(true);
  }

  return null;
}

function MatchingQuestion({ q, matchAnswers, setMatchAnswers, showExp, onCheck, onNext }) {
  const prompts = q.pairs.map(p => p.prompt);
  // Memoised so selecting a dropdown doesn't trigger a re-shuffle mid-exercise.
  // Key by the joined answer list so two matching questions from the same
  // video (which share q.videoId) don't alias each other's shuffled options.
  // The caller also passes a unique `key` prop so React remounts this between
  // questions — belt and braces.
  const pairKey = q.pairs.map(p => p.answer).join("|");
  const answers = useMemo(() => shuffle(q.pairs.map(p => p.answer)), [pairKey]);

  return (
    <div style={styles.card}>
      <div style={styles.qMeta}>{q.videoId} – {q.videoTitle} — Matching</div>
      <div style={styles.questionText}>Match each item to its correct answer:</div>
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {prompts.map(prompt => {
          const correct = q.pairs.find(p => p.prompt === prompt)?.answer;
          const chosen = matchAnswers[prompt];
          const isCorrect = showExp && chosen === correct;
          const isWrong = showExp && chosen && chosen !== correct;
          return (
            <div key={prompt} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", padding: "8px 12px", background: "#1e293b", borderRadius: 8, fontSize: 14, color: "#e2e8f0" }}>
                {prompt}
              </div>
              <div style={{ color: "#64748b" }}>→</div>
              <select
                value={chosen || ""}
                onChange={e => !showExp && setMatchAnswers(a => ({ ...a, [prompt]: e.target.value }))}
                disabled={showExp}
                style={{ flex: "1 1 200px", padding: "8px 12px", background: isCorrect ? "#064e3b" : isWrong ? "#450a0a" : "#1e293b", color: "#e2e8f0", borderRadius: 8, border: "1px solid " + (isCorrect ? "#10b981" : isWrong ? "#ef4444" : "#334155"), fontSize: 14 }}>
                <option value="">— select —</option>
                {answers.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {isWrong && (
                <div style={{ flex: "1 1 100%", fontSize: 12, color: "#94a3b8", paddingLeft: 12 }}>
                  ✓ Correct answer: <span style={{ color: "#10b981" }}>{correct}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showExp && (() => {
        const correctCount = q.pairs.filter(p => matchAnswers[p.prompt] === p.answer).length;
        const total = q.pairs.length;
        const pct = Math.round((correctCount / total) * 100);
        const allRight = correctCount === total;
        return (
          <div style={{ ...styles.explanation, background: allRight ? "#064e3b22" : correctCount > 0 ? "#78350f22" : "#450a0a22", borderLeft: `3px solid ${allRight ? "#10b981" : correctCount > 0 ? "#f59e0b" : "#ef4444"}` }}>
            <strong>{correctCount}/{total} correct ({pct}%)</strong>
            {allRight && " — perfect!"}
            {!allRight && correctCount > 0 && " — partial credit recorded per pair."}
            {correctCount === 0 && " — each pair will come back in review."}
          </div>
        );
      })()}
      <div style={{ display: "flex", gap: 8 }}>
        {!showExp && <button onClick={onCheck} style={styles.checkBtn}>Check Answers</button>}
        {showExp && <button onClick={onNext} style={styles.nextBtn}>Next →</button>}
      </div>
    </div>
  );
}

function ResultsView({ data, quizQ, answers, onReset, onDrillWrong }) {
  const pct = Math.round((data.correct / (data.total || 1)) * 100);
  const pass = pct >= CONFIG.PASS_PERCENT;
  // Build the list of wrong MC questions for potential re-drill
  const wrongQs = quizQ.filter((q, qIdx) => q.type === "mc" && answers[qIdx] !== q.a);
  const wrongCount = wrongQs.length;
  return (
    <div style={styles.card}>
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 64 }}>{pass ? "🎉" : "📚"}</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: pass ? "#10b981" : "#f59e0b", marginTop: 8 }}>{pct}%</div>
        <div style={{ color: "#9ca3af", marginTop: 4 }}>{data.correct}/{data.total} correct</div>
        <div style={{ color: pass ? "#10b981" : "#f59e0b", fontWeight: 700, marginTop: 8 }}>
          {pass ? "Excellent work! 🏆" : "Keep studying — you've got this!"}
        </div>
      </div>
      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
        {quizQ.map((q, qIdx) => {
          if (q.type !== "mc") return null;
          const correct = answers[qIdx] === q.a;
          return (
            <div key={qIdx} style={{ padding: "10px 12px", background: correct ? "#064e3b22" : "#450a0a22", borderRadius: 8, marginBottom: 6, borderLeft: `3px solid ${correct ? "#10b981" : "#ef4444"}` }}>
              <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 4 }}>{q.q}</div>
              {!correct && (
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  <span style={{ color: "#ef4444" }}>✗ You: {q.opts[answers[qIdx]] ?? "—"}</span>
                  {" · "}
                  <span style={{ color: "#10b981" }}>✓ {q.opts[q.a]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {wrongCount > 0 && onDrillWrong && (
          <button
            onClick={() => onDrillWrong(wrongQs)}
            style={{ ...styles.startBtn, background: "#ef4444", flex: "1 1 240px" }}
          >
            🎯 Drill {wrongCount} Wrong {wrongCount === 1 ? "Answer" : "Answers"}
          </button>
        )}
        <button onClick={onReset} style={{ ...styles.startBtn, background: wrongCount > 0 ? "#475569" : styles.startBtn.background, flex: "1 1 240px" }}>
          Back to Quiz Setup
        </button>
      </div>
    </div>
  );
}

// ─── CRAM TAB ──────────────────────────────────────────────────
function CramTab({ watchedVideos }) {
  const [selected, setSelected] = useState(watchedVideos[0]?.id || null);
  const [flipped, setFlipped] = useState({});

  // If the list of watched videos changes (e.g. progress reset, video
  // unwatched) and the currently selected id is no longer present, fall
  // back to the first available video so the dropdown doesn't point at
  // a ghost entry.
  useEffect(() => {
    if (watchedVideos.length === 0) return;
    if (!watchedVideos.some(v => v.id === selected)) {
      setSelected(watchedVideos[0].id);
      setFlipped({});
    }
  }, [watchedVideos, selected]);

  if (watchedVideos.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Watch a video first</div>
      </div>
    );
  }

  const vid = watchedVideos.find(v => v.id === selected);

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Cram Sheets</div>
        <select value={selected || ""} onChange={e => { setSelected(e.target.value); setFlipped({}); }}
          style={styles.select}>
          {watchedVideos.map(v => <option key={v.id} value={v.id}>{v.id} – {v.title}</option>)}
        </select>
      </div>
      {vid && vid.cram && vid.cram.length > 0 && (
        <div>
          <div style={styles.cardTitle} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {vid.cram.map((card, i) => (
              <button key={i} onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
                style={{ ...styles.flashcard, ...(flipped[i] ? styles.flashcardFlipped : {}) }}>
                {flipped[i] ? (
                  <span style={{ color: "#93c5fd", fontSize: 13, lineHeight: 1.5 }}>{card.def}</span>
                ) : (
                  <span style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700 }}>{card.term}</span>
                )}
                <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 11, color: "#475569" }}>
                  {flipped[i] ? "tap to hide" : "tap to reveal"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EXAM TAB ──────────────────────────────────────────────────
function ExamTab({ watchedVideos, store, recordResult, recordSession, onDrillWrongAsQuiz }) {
  const [running, setRunning] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(CONFIG.EXAM_TIMER_SECONDS);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef(null);
  // Modal state — replaces native window.confirm/alert to keep dialogs working
  // inside artifact sandboxes that swallow browser-native prompts.
  const [dialog, setDialog] = useState(null);
  const showAlert = (body, title) => setDialog({
    title,
    body,
    actions: <button onClick={() => setDialog(null)} style={styles.modalBtnPrimary}>OK</button>,
  });

  // Navigator panel: collapsed by default to keep the question in focus.
  // Filter narrows the tile list when user opens it to hunt for specific
  // questions (e.g. "find my flagged ones").
  const [navOpen, setNavOpen] = useState(false);
  const [navFilter, setNavFilter] = useState("all"); // "all" | "unanswered" | "flagged"

  // Resumable session support: on mount we check for a saved in-progress
  // exam. If one exists and isn't stale, the user can resume or discard it.
  const [savedSession, setSavedSession] = useState(null);
  // When the exam timer hits zero we flip this flag from inside the setTimeLeft
  // updater (which must stay pure). A dedicated useEffect below watches for the
  // transition and calls submitExam() exactly once — avoiding the StrictMode
  // double-invoke of the updater that would otherwise cause clearExamSession()
  // to fire twice.
  const [timedOut, setTimedOut] = useState(false);

  // Refs that mirror state so the timer's setInterval callback (which captures
  // state from the render when it was created) can read CURRENT values when
  // auto-submitting on timeout, and so the periodic session-save inside the
  // timer tick writes current values without re-subscribing the interval.
  const questionsRef = useRef(questions);
  const answersRef = useRef(answers);
  const idxRef = useRef(idx);
  const flaggedRef = useRef(flagged);
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { flaggedRef.current = flagged; }, [flagged]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Keyboard shortcuts for the exam running view:
  //   1-4     = select answer option
  //   N / →   = next question
  //   P / ←   = previous question
  //   F       = toggle flag on current question
  const examKbdRef = useRef({});
  examKbdRef.current = { running, showResults, questions, idx, flagged };
  useEffect(() => {
    function handler(e) {
      const ctx = examKbdRef.current;
      if (!ctx.running || ctx.showResults) return;
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const q = ctx.questions[ctx.idx];
      if (!q) return;
      const key = e.key;
      if (["1","2","3","4"].includes(key)) {
        const n = parseInt(key, 10);
        if (n - 1 < (q.opts || []).length) {
          e.preventDefault();
          setAnswers(a => ({ ...a, [ctx.idx]: n - 1 }));
        }
      } else if (key === "n" || key === "N" || key === "ArrowRight") {
        if (ctx.idx < ctx.questions.length - 1) {
          e.preventDefault();
          setIdx(ctx.idx + 1);
        }
      } else if (key === "p" || key === "P" || key === "ArrowLeft") {
        if (ctx.idx > 0) {
          e.preventDefault();
          setIdx(ctx.idx - 1);
        }
      } else if (key === "f" || key === "F") {
        e.preventDefault();
        setFlagged(f => ({ ...f, [ctx.idx]: !f[ctx.idx] }));
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for a persisted session exactly once on mount
  useEffect(() => {
    loadExamSession().then(s => {
      setSavedSession(s);
    });
  }, []);

  // Persist the in-progress exam whenever meaningful state changes.
  // (timeLeft is NOT in the deps — it changes every second and the timer
  // handles its own periodic save every 10s to avoid write thrash.)
  useEffect(() => {
    if (!running) return;
    saveExamSession({
      questions: questionsRef.current,
      idx,
      answers,
      flagged,
      timeLeft: timeLeftRef.current,
    });
  }, [running, idx, answers, flagged]);

  useEffect(() => {
    if (running && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setTimedOut(true); return 0; }
          const newT = t - 1;
          // Persist every 10s so a crash or refresh loses at most ~10s of timer
          if (newT % 10 === 0) {
            saveExamSession({
              questions: questionsRef.current,
              idx: idxRef.current,
              answers: answersRef.current,
              flagged: flaggedRef.current,
              timeLeft: newT,
            });
          }
          return newT;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running, showResults]);

  // When the timer flags a timeout, submit exactly once. Keeping the actual
  // submitExam() call out of the updater above means React is free to discard
  // the updater function during StrictMode double-invoke without causing side
  // effects (clearExamSession, setShowResults, etc.) to fire twice.
  useEffect(() => {
    if (timedOut) {
      submitExam();
      setTimedOut(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  function startExam() {
    // Real SY0-701 exam blueprint weights
    const DOMAIN_WEIGHTS = { "1": 0.12, "2": 0.22, "3": 0.18, "4": 0.28, "5": 0.20 };
    const TARGET = CONFIG.EXAM_QUESTION_COUNT;

    // Bucket available questions by domain
    const byDomain = { "1": [], "2": [], "3": [], "4": [], "5": [] };
    watchedVideos.forEach(v => {
      const d = v.id.split(".")[0];
      if (!byDomain[d]) return;
      v.questions.forEach((q, qi) => byDomain[d].push({ ...q, videoId: v.id, videoTitle: v.title, qi }));
      (v.scenarios || []).forEach((q, qi) => byDomain[d].push({ ...q, videoId: v.id, videoTitle: v.title, qi, isScenario: true }));
    });

    const totalAvail = Object.values(byDomain).reduce((n, arr) => n + arr.length, 0);
    if (totalAvail < 5) { showAlert("Watch more videos to unlock the exam simulator (need at least 5 questions)."); return; }

    // Calculate target per domain; scale down proportionally if a domain has fewer questions than its target
    const targets = {};
    let domainTargets = {};
    Object.keys(DOMAIN_WEIGHTS).forEach(d => {
      domainTargets[d] = Math.round(TARGET * DOMAIN_WEIGHTS[d]);
    });

    // Two-pass: first allocate what's available, then redistribute surplus to domains that have capacity
    let allocated = 0;
    let surplus = 0;
    Object.keys(domainTargets).forEach(d => {
      const avail = byDomain[d].length;
      const want = domainTargets[d];
      if (avail >= want) {
        targets[d] = want;
        allocated += want;
      } else {
        targets[d] = avail;
        allocated += avail;
        surplus += (want - avail);
      }
    });

    // Distribute surplus proportionally to domains that have spare capacity
    if (surplus > 0) {
      const canTake = Object.keys(domainTargets).filter(d => byDomain[d].length > targets[d]);
      canTake.forEach(d => {
        const extra = Math.min(surplus, byDomain[d].length - targets[d]);
        targets[d] += extra;
        surplus -= extra;
        if (surplus <= 0) return;
      });
    }

    // Draw questions from each domain pool
    const qs = [];
    Object.keys(targets).forEach(d => {
      const pool = shuffle([...byDomain[d]]);
      qs.push(...pool.slice(0, targets[d]));
    });

    setQuestions(shuffle(qs.map(shuffleOptions)));
    setIdx(0);
    setAnswers({});
    setFlagged({});
    setTimeLeft(CONFIG.EXAM_TIMER_SECONDS);
    setShowResults(false);
    setRunning(true);
  }

  function submitExam() {
    clearInterval(timerRef.current);
    // Read from refs so a timer-triggered submit sees current state, not the
    // stale closure from the render when the interval was created.
    const qs = questionsRef.current;
    const ans = answersRef.current;
    const correct = qs.filter((q, i) => ans[i] === q.a).length;
    recordSession(correct, qs.length, "exam");
    // Only record SM-2 outcomes for questions the user actually answered.
    // Timing out on unanswered questions shouldn't nuke your review intervals
    // for those cards — they deserve to be tried again, not marked wrong.
    qs.forEach((q, i) => {
      if (ans[i] !== undefined) {
        recordResult(keyOf(q), ans[i] === q.a);
      }
    });
    clearExamSession();
    setSavedSession(null);
    setShowResults(true);
    setRunning(false);
  }

  function resumeExam() {
    if (!savedSession) return;
    setQuestions(savedSession.questions);
    setIdx(savedSession.idx || 0);
    setAnswers(savedSession.answers || {});
    setFlagged(savedSession.flagged || {});
    setTimeLeft(savedSession.timeLeft || CONFIG.EXAM_TIMER_SECONDS);
    setShowResults(false);
    setSavedSession(null);
    setRunning(true);
  }

  function discardSession() {
    clearExamSession();
    setSavedSession(null);
  }

  if (watchedVideos.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Watch more videos first</div>
      </div>
    );
  }

  if (!running && !showResults) {
    const DOMAIN_WEIGHTS = { "1": 0.12, "2": 0.22, "3": 0.18, "4": 0.28, "5": 0.20 };
    const DOMAIN_NAMES = { "1": "General Security Concepts", "2": "Threats & Vulnerabilities", "3": "Security Architecture", "4": "Security Operations", "5": "Governance & Oversight" };
    const domainStats = {};
    ["1","2","3","4","5"].forEach(d => {
      const vids = watchedVideos.filter(v => v.id.split(".")[0] === d);
      const mc = vids.reduce((n, v) => n + v.questions.length, 0);
      const sc = vids.reduce((n, v) => n + (v.scenarios || []).length, 0);
      domainStats[d] = { total: mc + sc, target: Math.round(CONFIG.EXAM_QUESTION_COUNT * DOMAIN_WEIGHTS[d]), weight: Math.round(DOMAIN_WEIGHTS[d] * 100) };
    });
    const totalAvail = Object.values(domainStats).reduce((n, s) => n + s.total, 0);

    // Summary data for the resume card (if a saved session exists)
    const answeredCount = savedSession ? Object.keys(savedSession.answers || {}).length : 0;
    const mins = savedSession ? Math.floor((savedSession.timeLeft || 0) / 60) : 0;
    const secs = savedSession ? (savedSession.timeLeft || 0) % 60 : 0;
    const savedWhen = savedSession ? new Date(savedSession.savedAt).toLocaleString() : "";

    return (
      <>
        {savedSession && (
          <div style={{ ...styles.card, borderLeft: "4px solid #10b981" }}>
            <div style={styles.cardTitle}>⏸ Exam in progress</div>
            <div style={{ color: "#cbd5e1", marginBottom: 14, lineHeight: 1.6, fontSize: 14 }}>
              You have a saved exam with <strong>{savedSession.questions.length}</strong> questions,{" "}
              <strong>{answeredCount}</strong> answered, <strong>{mins}m {secs}s</strong> on the clock.
              <br />
              <span style={{ color: "#64748b", fontSize: 12 }}>Saved {savedWhen}</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={resumeExam} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                ▶ Resume exam
              </button>
              <button
                onClick={() => {
                  setDialog({
                    title: "Discard saved exam?",
                    body: "Your in-progress answers will be lost.",
                    actions: (
                      <>
                        <button onClick={() => setDialog(null)} style={styles.modalBtn}>Cancel</button>
                        <button onClick={() => { setDialog(null); discardSession(); }} style={styles.modalBtnDanger}>Discard</button>
                      </>
                    ),
                  });
                }}
                style={{ background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
              >
                🗑 Discard
              </button>
            </div>
          </div>
        )}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🎓 Exam Simulator</div>
        <div style={{ color: "#94a3b8", marginBottom: 16, lineHeight: 1.6 }}>
          Mirrors the real SY0-701 exam blueprint — questions weighted by domain, 90 min timer, 75% to pass.
        </div>
        <div style={{ marginBottom: 16 }}>
          {["1","2","3","4","5"].map(d => {
            const s = domainStats[d];
            const pct = s.total > 0 ? Math.min(100, Math.round((s.total / s.target) * 100)) : 0;
            const ready = s.total >= s.target;
            return (
              <div key={d} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: "#e2e8f0" }}>D{d} {DOMAIN_NAMES[d]}</span>
                  <span style={{ color: ready ? "#10b981" : "#f59e0b" }}>
                    {Math.min(s.total, s.target)}/{s.target} q · {s.weight}%
                  </span>
                </div>
                <div style={{ height: 4, background: "#1e293b", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: ready ? "#10b981" : "#f59e0b", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ color: "#f59e0b", marginBottom: 16, fontSize: 13 }}>
          {totalAvail} questions available · exam draws up to 90 weighted by domain
        </div>
        <button onClick={startExam} style={styles.startBtn}>Start Weighted Exam</button>
      </div>
      <Modal
        open={!!dialog}
        title={dialog && dialog.title}
        body={dialog && dialog.body}
        actions={dialog && dialog.actions}
        onClose={() => setDialog(null)}
      />
      </>
    );
  }

  if (showResults) {
    const correct = questions.filter((q, i) => answers[i] === q.a).length;
    const pct = Math.round(correct / questions.length * 100);
    const pass = pct >= CONFIG.PASS_PERCENT;
    return (
      <div style={styles.card}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 64 }}>{pass ? "🏆" : "📚"}</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: pass ? "#10b981" : "#ef4444" }}>{pct}%</div>
          <div style={{ color: "#9ca3af" }}>{correct}/{questions.length} correct</div>
          <div style={{ color: pass ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 20, marginTop: 8 }}>
            {pass ? "PASS 🎉" : "NOT YET — keep studying!"}
          </div>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
          {questions.map((q, i) => {
            const correct = answers[i] === q.a;
            return (
              <div key={i} style={{ padding: "10px 12px", background: correct ? "#064e3b22" : "#450a0a22", borderRadius: 8, marginBottom: 6, borderLeft: `3px solid ${correct ? "#10b981" : "#ef4444"}` }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>Q{i+1} · {q.videoId}</div>
                <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 4 }}>{q.q}</div>
                {!correct && (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    <span style={{ color: "#ef4444" }}>✗ {q.opts[answers[i]] ?? "—"}</span>
                    {" · "}
                    <span style={{ color: "#10b981" }}>✓ {q.opts[q.a]}</span>
                    <div style={{ marginTop: 4, color: "#64748b" }}>{q.exp}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(() => {
            const wrongQs = questions.filter((q, i) => answers[i] !== q.a);
            const wrongCount = wrongQs.length;
            if (wrongCount > 0 && onDrillWrongAsQuiz) {
              return (
                <button
                  onClick={() => onDrillWrongAsQuiz(wrongQs)}
                  style={{ ...styles.startBtn, background: "#ef4444", flex: "1 1 240px" }}
                >
                  🎯 Drill {wrongCount} Wrong {wrongCount === 1 ? "Answer" : "Answers"} (as Quiz)
                </button>
              );
            }
            return null;
          })()}
          <button
            onClick={() => { setShowResults(false); setRunning(false); }}
            style={{ ...styles.startBtn, background: "#475569", flex: "1 1 240px" }}
          >
            Back to Exam Setup
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const selected = answers[idx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 300 ? "#ef4444" : "#f59e0b";

  return (
    <>
    <div style={styles.card}>
      {/* Timer and navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>Question {idx + 1} of {questions.length}</div>
        <div style={{ fontWeight: 700, color: timerColor, fontSize: 18 }}>
          ⏱ {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
        </div>
        <button onClick={() => setFlagged(f => ({ ...f, [idx]: !f[idx] }))}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>
          {flagged[idx] ? "🚩" : "⚐"}
        </button>
      </div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <div style={styles.qMeta}>{q.videoId} – {q.videoTitle}</div>
      <div style={styles.questionText}>{q.q}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
        Shortcuts: <kbd style={kbdStyle}>1</kbd>–<kbd style={kbdStyle}>4</kbd> select ·{" "}
        <kbd style={kbdStyle}>N</kbd>/<kbd style={kbdStyle}>→</kbd> next ·{" "}
        <kbd style={kbdStyle}>P</kbd>/<kbd style={kbdStyle}>←</kbd> prev ·{" "}
        <kbd style={kbdStyle}>F</kbd> flag
      </div>
      <div style={styles.optionGrid}>
        {q.opts.map((opt, oi) => (
          <button key={oi} onClick={() => setAnswers(a => ({ ...a, [idx]: oi }))}
            style={{ ...styles.option, ...(selected === oi ? styles.optionSelected : {}) }}>
            <span style={{ display: "inline-block", minWidth: 22, marginRight: 8, color: "#64748b", fontWeight: 700, fontSize: 12 }}>{oi + 1}.</span>
            {opt}
          </button>
        ))}
      </div>

      {/* Question navigator — collapsed by default to keep focus on the
          current question. The summary bar shows totals at a glance; clicking
          it expands a filterable grid with 36px tap targets. */}
      {(() => {
        const answeredCount = Object.keys(answers).length;
        const flaggedCount = Object.values(flagged).filter(Boolean).length;
        const filteredIndices = questions.map((_, i) => i).filter(i => {
          if (navFilter === "unanswered") return answers[i] === undefined;
          if (navFilter === "flagged") return flagged[i];
          return true;
        });
        return (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setNavOpen(o => !o)}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "10px 14px", cursor: "pointer", color: "#e2e8f0", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
            >
              <span>
                <strong>Q{idx + 1}/{questions.length}</strong>
                <span style={{ color: "#94a3b8", marginLeft: 10 }}>{answeredCount} answered</span>
                {flaggedCount > 0 && <span style={{ color: "#f59e0b", marginLeft: 10 }}>🚩 {flaggedCount} flagged</span>}
              </span>
              <span style={{ color: "#64748b", fontSize: 12 }}>{navOpen ? "▲ Hide" : "▼ Navigator"}</span>
            </button>
            {navOpen && (
              <div style={{ marginTop: 8, padding: 10, background: "#0f172a", border: "1px solid #334155", borderRadius: 6 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {[["all", `All (${questions.length})`], ["unanswered", `Unanswered (${questions.length - answeredCount})`], ["flagged", `Flagged (${flaggedCount})`]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setNavFilter(val)}
                      style={{
                        background: navFilter === val ? "#3b82f6" : "#1e293b",
                        color: navFilter === val ? "#fff" : "#cbd5e1",
                        border: "1px solid " + (navFilter === val ? "#3b82f6" : "#334155"),
                        borderRadius: 4,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {filteredIndices.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 13, padding: "8px 4px", textAlign: "center" }}>
                    No questions match this filter.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                    {filteredIndices.map(i => (
                      <button
                        key={i}
                        onClick={() => { setIdx(i); setNavOpen(false); }}
                        style={{
                          minWidth: 44,
                          height: 44,
                          borderRadius: 6,
                          border: i === idx ? "2px solid #fff" : "none",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          background: i === idx ? "#3b82f6" : flagged[i] ? "#f59e0b" : answers[i] !== undefined ? "#10b981" : "#1e293b",
                          color: "#fff",
                          position: "relative",
                        }}
                        title={`Q${i+1}${answers[i] !== undefined ? " · answered" : ""}${flagged[i] ? " · flagged" : ""}`}
                      >
                        {i + 1}
                        {flagged[i] && <span style={{ position: "absolute", top: 1, right: 3, fontSize: 9 }}>🚩</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#3b82f6", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }}></span>current</span>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#10b981", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }}></span>answered</span>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#f59e0b", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }}></span>flagged</span>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#1e293b", borderRadius: 2, marginRight: 4, verticalAlign: "middle", border: "1px solid #334155" }}></span>unanswered</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {idx > 0 && <button onClick={() => setIdx(idx - 1)} style={styles.checkBtn}>← Prev</button>}
        {idx < questions.length - 1 && <button onClick={() => setIdx(idx + 1)} style={styles.nextBtn}>Next →</button>}
        {idx === questions.length - 1 && (
          <button
            onClick={() => {
              setDialog({
                title: "Submit exam?",
                body: `You've answered ${Object.keys(answers).length}/${questions.length} questions.`,
                actions: (
                  <>
                    <button onClick={() => setDialog(null)} style={styles.modalBtn}>Cancel</button>
                    <button onClick={() => { setDialog(null); submitExam(); }} style={styles.modalBtnPrimary}>Submit</button>
                  </>
                ),
              });
            }}
            style={{ ...styles.startBtn, flex: 1 }}>
            Submit Exam
          </button>
        )}
      </div>
    </div>
    <Modal
      open={!!dialog}
      title={dialog && dialog.title}
      body={dialog && dialog.body}
      actions={dialog && dialog.actions}
      onClose={() => setDialog(null)}
    />
    </>
  );
}

// ─── STYLES ────────────────────────────────────────────────────
const kbdStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderBottomWidth: 2,
  borderRadius: 3,
  padding: "1px 5px",
  fontSize: 10,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#cbd5e1",
};
const styles = {
  app: { minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 },
  header: { background: "#1e293b", borderBottom: "1px solid #334155", position: "sticky", top: 0, zIndex: 10 },
  headerInner: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" },
  headerTitle: { fontSize: 18, fontWeight: 900, color: "#3b82f6" },
  headerSub: { fontSize: 12, color: "#64748b" },
  headerStats: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  headerBackupBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, marginLeft: 4, lineHeight: 1.2 },
  headerSyncPill: { display: "inline-flex", alignItems: "center", gap: 6, background: "#0f172a", border: "1px solid #334155", borderRadius: 20, padding: "5px 11px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.2 },
  headerSyncDot: { width: 8, height: 8, borderRadius: "50%" },
  headerSyncLabel: { whiteSpace: "nowrap" },
  footer: { borderTop: "1px solid #334155", marginTop: 32, padding: "14px 16px", textAlign: "center" },
  footerLink: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: "4px 8px" },
  statPill: { background: "#0f172a", borderRadius: 20, padding: "4px 12px", display: "flex", flexDirection: "column", alignItems: "center" },
  statLabel: { fontSize: 10, color: "#64748b" },
  statValue: { fontSize: 13, fontWeight: 700, color: "#f1f5f9" },
  nav: { display: "flex", gap: 2, padding: "0 12px 0" },
  navBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "10px 14px", fontSize: 13, borderBottom: "2px solid transparent", fontWeight: 500 },
  navBtnActive: { color: "#3b82f6", borderBottom: "2px solid #3b82f6" },
  main: { maxWidth: 800, margin: "0 auto", padding: "16px" },
  card: { background: "#1e293b", borderRadius: 12, padding: "16px", marginBottom: 16, border: "1px solid #334155" },
  cardTitle: { fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 12 },
  cardRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 },
  summaryCard: { background: "#1e293b", borderRadius: 12, padding: "14px", border: "1px solid #334155", textAlign: "center" },
  historyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e293b", fontSize: 14 },
  historyDate: { color: "#64748b", fontSize: 12 },
  historyMode: { color: "#94a3b8", fontSize: 12 },
  sectionRow: { marginBottom: 4 },
  sectionHeader: { width: "100%", display: "flex", justifyContent: "space-between", background: "#0f172a", border: "none", color: "#94a3b8", cursor: "pointer", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600 },
  sectionCount: { color: "#64748b", fontSize: 12 },
  videoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px 6px 24px" },
  videoInfo: { display: "flex", alignItems: "center", flex: 1 },
  watchBtn: { background: "#1e293b", border: "1px solid #334155", color: "#64748b", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
  watchBtnActive: { background: "#064e3b", border: "1px solid #10b981", color: "#10b981" },
  filterBtn: { background: "#0f172a", border: "1px solid #334155", color: "#64748b", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" },
  filterBtnActive: { background: "#1d4ed8", border: "1px solid #3b82f6", color: "#fff" },
  modeCard: { background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left", color: "#e2e8f0" },
  modeCardActive: { borderColor: "#3b82f6", background: "#1e3a5f" },
  formLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 6, fontWeight: 600 },
  vidChip: { background: "#0f172a", border: "1px solid #334155", color: "#64748b", borderRadius: 6, padding: "3px 8px", fontSize: 12, cursor: "pointer" },
  vidChipActive: { background: "#1d4ed8", border: "1px solid #3b82f6", color: "#fff" },
  startBtn: { width: "100%", padding: "14px", background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 },
  linkBtn: { background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 13, marginRight: 12 },
  select: { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "10px", fontSize: 14 },
  progressBar: { height: 4, background: "#334155", borderRadius: 2, marginBottom: 16, overflow: "hidden" },
  progressFill: { height: "100%", background: "#3b82f6", borderRadius: 2, transition: "width 0.3s" },
  qMeta: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  questionText: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 16 },
  optionGrid: { display: "grid", gap: 8 },
  option: { width: "100%", background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "12px 14px", cursor: "pointer", textAlign: "left", fontSize: 14, lineHeight: 1.4 },
  optionSelected: { border: "2px solid #3b82f6", background: "#1e3a5f" },
  optionCorrect: { border: "2px solid #10b981", background: "#064e3b", color: "#6ee7b7" },
  optionWrong: { border: "2px solid #ef4444", background: "#450a0a", color: "#fca5a5" },
  explanation: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "12px", fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginTop: 12 },
  checkBtn: { flex: 1, padding: "12px", background: "#334155", border: "none", borderRadius: 8, color: "#f1f5f9", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  nextBtn: { flex: 1, padding: "12px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  flashcard: { background: "#0f172a", border: "2px solid #334155", borderRadius: 12, padding: "20px 16px", cursor: "pointer", textAlign: "left", minHeight: 100, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" },
  flashcardFlipped: { border: "2px solid #3b82f6", background: "#1e3a5f" },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#64748b" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: { background: "#1e293b", borderRadius: 12, border: "1px solid #334155", padding: 20, maxWidth: 440, width: "100%", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)" },
  modalTitle: { fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 10 },
  modalBody: { fontSize: 14, color: "#cbd5e1", lineHeight: 1.5, marginBottom: 18 },
  modalActions: { display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  modalBtn: { padding: "10px 16px", background: "#334155", border: "none", borderRadius: 8, color: "#f1f5f9", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  modalBtnPrimary: { padding: "10px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  modalBtnDanger: { padding: "10px 16px", background: "#dc2626", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
};
