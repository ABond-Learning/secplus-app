// src/study/drawer-state.js — Task 2 Sub-batch 2B
//
// Persistence + defaults for the Customise drawer. Per design v2 §3.3
// (mode-defaults table) / §5.1 (key class table) / D5 (synced) /
// D8 (per-mode bag shape).
//
// Storage:
//   secplus-v4-customise-last → { quiz: {filters}, review: {filters},
//                                  drill: {filters}, matching: {filters} }
// Synced via the existing "secplus-" prefix in TRACKED_PREFIXES — no
// sync-engine change required (verified §5.4(c) round-trip safety).
//
// Schema-evolution invariant (mirrors the migrateStore comment in
// secplus-quiz.jsx line 80): loadDrawerState spreads MODE_DEFAULTS first
// and persisted state second, so any field added to MODE_DEFAULTS in a
// future sub-batch is automatically picked up by users whose persisted
// state predates the addition. Future refactors that drop unknown
// persisted fields would break additive evolution — DON'T.

export const DRAWER_STATE_KEY = "secplus-v4-customise-last";

// MODE_DEFAULTS mirrors design v2 §3.3 lines 211–262. Quiz/Review/Drill/
// Matching each get a slot. Flashcards is intentionally absent in 2B
// (D10): Flashcards routes to CramTab unchanged until Sub-batch 4 adds
// cram-* SM-2 keys and multi-video sessions.
//
// Per-mode mapping to legacyShim (in secplus-quiz.jsx): see comments
// against each mode. 2C will collapse the legacy shim into these
// defaults; 2B uses the shim only as an orphaned reference.
export const MODE_DEFAULTS = {
  quiz: {
    domains: ["1", "2", "3", "4", "5"],
    subObjectives: [],
    videoIds: [],
    watchedOnly: true,
    questionTypes: ["mc", "scen"],
    preferUnseen: false,
    belowAccuracy: null,
    minAttempts: 2,
    dueOnly: false,
    includeUnseen: false,
    length: 20,
    activeRecall: false,
    revealOptions: true,
  },
  review: {
    // NEW DEFAULT (D4): legacy spaced was MC-only; design v2 §3.2
    // makes mc+scen the Review default. Diff-test compares MC-only
    // equivalence; this default-flip is a user-visible improvement
    // flagged in the 2B ship report.
    domains: ["1", "2", "3", "4", "5"],
    subObjectives: [],
    videoIds: [],
    watchedOnly: true,
    questionTypes: ["mc", "scen"],
    preferUnseen: false,
    belowAccuracy: null,
    minAttempts: 2,
    dueOnly: true,
    includeUnseen: false,
    length: null,
    activeRecall: false,
    revealOptions: true,
  },
  drill: {
    // 2B preserves legacy video-level scope via legacyVideoLevelWeak.
    // 2C swaps to belowAccuracy:0.70 per Q-F (intentional behavior
    // change documented in 2C commit + ship report).
    domains: ["1", "2", "3", "4", "5"],
    subObjectives: [],
    videoIds: [],
    watchedOnly: true,
    questionTypes: ["mc", "scen"],
    preferUnseen: false,
    belowAccuracy: null,
    minAttempts: 2,
    legacyVideoLevelWeak: true,
    dueOnly: false,
    includeUnseen: false,
    length: null,
    activeRecall: false,
    revealOptions: true,
  },
  matching: {
    domains: ["1", "2", "3", "4", "5"],
    subObjectives: [],
    videoIds: [],
    watchedOnly: true,
    questionTypes: ["match"],
    preferUnseen: false,
    length: null,
    activeRecall: false,
    revealOptions: true,
  },
};

function safeReadJSON(key) {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteJSON(key, value) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error("[secplus-drawer] failed to persist drawer state:", e);
  }
}

// Spread-merge: persisted state overrides defaults at field granularity.
// For Matching, defensively re-lock questionTypes to ["match"] in case
// a corrupted persisted state has wrong types (R-2B-7).
export function loadDrawerState(mode) {
  const raw = safeReadJSON(DRAWER_STATE_KEY);
  const defaults = MODE_DEFAULTS[mode];
  if (!defaults) return null;
  const persisted = (raw && raw[mode] && typeof raw[mode] === "object") ? raw[mode] : null;
  const merged = persisted ? { ...defaults, ...persisted } : { ...defaults };
  if (mode === "matching") merged.questionTypes = ["match"];
  return merged;
}

export function saveDrawerState(mode, filters) {
  if (!MODE_DEFAULTS[mode]) return;
  const raw = safeReadJSON(DRAWER_STATE_KEY);
  raw[mode] = filters;
  safeWriteJSON(DRAWER_STATE_KEY, raw);
}

// Stable JSON-string compare. Filter objects are flat (primitives + arrays
// of primitives), so JSON.stringify after sorting array entries gives a
// canonical form. Used by the dirty-state indicator on the Start button
// per Aiden's D16 caveat (2026-05-05).
export function filtersAreEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return canonicalJSON(a) === canonicalJSON(b);
}

function canonicalJSON(obj) {
  // Sort top-level keys; sort entries inside array values for order-
  // independent compare on domains/videoIds/questionTypes/subObjectives.
  const sortedKeys = Object.keys(obj).sort();
  const out = {};
  for (const k of sortedKeys) {
    const v = obj[k];
    out[k] = Array.isArray(v) ? [...v].sort() : v;
  }
  return JSON.stringify(out);
}
