// src/study/buildPool.js — Task 2 Sub-batch 2A
//
// Unifies the 6 startQuiz pool-build branches in secplus-quiz.jsx into
// a single filter-driven function. This is the deepest internal change
// of Task 2 (per design v2 §6 Sub-batch 2). The diff-test at
// scripts/test-buildpool-equivalence.mjs is the contract — it asserts
// buildPool() with legacy-shim filters returns the same SET of items as
// the legacyStartQuizPool() copy of today's branches.
//
// Module shape:
//   - tiny key/shuffle helpers inlined (5-line redundancy with the JSX —
//     intentional, removed in Sub-batch 5 cleanup once everything routes
//     through this module).
//   - legacyStartQuizPool: verbatim copy of today's startQuiz pool-build
//     logic, with side effects stripped (no setState, no showAlert).
//     Lives only during the migration window; deleted in Sub-batch 5
//     alongside the orphaned 6-card grid in QuizTab.
//   - buildPool: filter-driven, mode-agnostic. Production calls this via
//     a legacy-shim in startQuiz (2A). Drawer wires real filters in 2B.
//   - seededRng: deterministic shuffle for the diff-test only.
//
// Filter shape (see design v2 §3.3):
//   {
//     domains?: string[],       // ["1","2","3","4","5"]; default = all
//     subObjectives?: string[], // section ids like "1.2"; default = none
//     videoIds?: string[],      // explicit video filter; default = []
//     watchedOnly?: boolean,    // default true
//     questionTypes: string[],  // subset of ["mc","scen","match","cram"]
//     preferUnseen?: boolean,   // default false; filters to !sm2[k]
//     belowAccuracy?: number|null, // 0..1; per-question accuracy threshold
//     minAttempts?: number,     // default 2; required for belowAccuracy
//     dueOnly?: boolean,        // default false
//     includeUnseen?: boolean,  // default false; composes with dueOnly
//     length?: number|null,     // null = no slice; number = shuffle+slice
//     legacyVideoLevelWeak?: boolean, // 2A-only shim; removed in 2C
//   }

// ─── tiny inline helpers (mirror src/secplus-quiz.jsx) ─────────────
const mcKey = (videoId, qi) => `mc-${videoId}-${qi}`;
const scenKey = (videoId, qi) => `scen-${videoId}-${qi}`;
const matchKey = (videoId, idx) => `match-${videoId}-${idx}`;

function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// mulberry32 — 5-line seeded PRNG; only used by the diff-test for
// reproducible shuffle output. Production never passes a seeded rng
// (and so never invokes this).
export function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Re-exported so the diff-test can construct stable Set keys.
export const keyHelpers = { mcKey, scenKey, matchKey };

// ─── legacy reference implementation ────────────────────────────────
// Verbatim copy of secplus-quiz.jsx startQuiz pool-build branches as of
// commit 9b6bc47 (Sub-batch 1 ship). Side effects (showAlert, setState)
// stripped. The diff-test treats this as ground truth for the migration.
// Removed in Sub-batch 5.
export function legacyStartQuizPool({
  m,
  watchedVideos,
  store,
  selectedVids = [],
  questionCount = 20,
  today,
  rng = Math.random,
  slice = true,
}) {
  const WEAK_RATIO = 0.70;
  let pool = [];

  if (m === "spaced") {
    watchedVideos.forEach(v => {
      v.questions.forEach((q, qi) => {
        const key = mcKey(v.id, qi);
        const rec = store.sm2[key];
        if (!rec || rec.nextDue <= today) {
          pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" });
        }
      });
    });
  } else if (m === "new") {
    watchedVideos.forEach(v => {
      v.questions.forEach((q, qi) => {
        if (!store.sm2[mcKey(v.id, qi)]) {
          pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" });
        }
      });
      (v.scenarios || []).forEach((q, qi) => {
        if (!store.sm2[scenKey(v.id, qi)]) {
          pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc", isScenario: true });
        }
      });
    });
    if (slice) pool = shuffle(pool, rng).slice(0, questionCount);
  } else if (m === "weak") {
    const weak = watchedVideos.filter(v => {
      const recs = v.questions.map((_, qi) => store.sm2[mcKey(v.id, qi)]).filter(Boolean);
      if (recs.length === 0) return true;
      return recs.reduce((n, r) => n + r.correct / r.total, 0) / recs.length < WEAK_RATIO;
    });
    weak.forEach(v => v.questions.forEach((q, qi) =>
      pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" })));
  } else if (m === "matching") {
    const vids = selectedVids.length ? watchedVideos.filter(v => selectedVids.includes(v.id)) : watchedVideos;
    vids.forEach(v => {
      if (v.matching && v.matching.length >= 3) {
        pool.push({ type: "matching", videoId: v.id, videoTitle: v.title, pairs: v.matching });
      }
    });
  } else if (m === "scenario") {
    const vids = selectedVids.length ? watchedVideos.filter(v => selectedVids.includes(v.id)) : watchedVideos;
    vids.forEach(v => {
      if (v.scenarios) {
        v.scenarios.forEach((q, qi) => pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc", isScenario: true }));
      }
    });
    if (slice) pool = shuffle(pool, rng).slice(0, questionCount);
  } else { // standard
    const vids = selectedVids.length ? watchedVideos.filter(v => selectedVids.includes(v.id)) : watchedVideos;
    vids.forEach(v => v.questions.forEach((q, qi) =>
      pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" })));
    if (slice) pool = shuffle(pool, rng).slice(0, questionCount);
  }

  return pool;
}

// ─── unified buildPool ─────────────────────────────────────────────
export function buildPool({
  mode,        // "quiz" | "flashcards" | "review" | "drill" | "matching"
  filters = {},
  sections,
  watchedVideos,
  store,
  today,
  rng = Math.random,
}) {
  const f = {
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
    length: null,
    legacyVideoLevelWeak: false,
    ...filters,
  };

  // ─── Step 1: video scope ─────────────────────────────────────────
  const allVideos = sections.flatMap(s => s.videos);
  let scope = f.watchedOnly ? watchedVideos : allVideos;

  if (f.videoIds && f.videoIds.length) {
    scope = scope.filter(v => f.videoIds.includes(v.id));
  }
  if (f.domains && f.domains.length < 5) {
    scope = scope.filter(v => f.domains.includes(v.id.split(".")[0]));
  }
  if (f.subObjectives && f.subObjectives.length) {
    const allowed = new Set(f.subObjectives);
    const sectionByVideo = new Map();
    sections.forEach(sec => sec.videos.forEach(sv => sectionByVideo.set(sv.id, sec.id)));
    scope = scope.filter(v => allowed.has(sectionByVideo.get(v.id)));
  }

  // 2A shim: video-level weak scope (Q-F drops this in 2C). Filters scope
  // BEFORE per-type aggregation so the questionTypes:["mc"] branch picks
  // up only weak-video MCs. Removed in 2C alongside the Drill card's
  // belowAccuracy wiring.
  if (f.legacyVideoLevelWeak) {
    const WEAK_RATIO = 0.70;
    scope = scope.filter(v => {
      const recs = v.questions.map((_, qi) => store.sm2[mcKey(v.id, qi)]).filter(Boolean);
      if (recs.length === 0) return true;
      return recs.reduce((n, r) => n + r.correct / r.total, 0) / recs.length < WEAK_RATIO;
    });
  }

  // ─── Step 2: aggregate items per type ────────────────────────────
  const types = new Set(f.questionTypes);
  let pool = [];

  if (types.has("mc")) {
    scope.forEach(v => {
      v.questions.forEach((q, qi) => {
        pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc" });
      });
    });
  }
  if (types.has("scen")) {
    scope.forEach(v => {
      (v.scenarios || []).forEach((q, qi) => {
        pool.push({ ...q, videoId: v.id, videoTitle: v.title, qi, type: "mc", isScenario: true });
      });
    });
  }
  if (types.has("match")) {
    scope.forEach(v => {
      if (v.matching && v.matching.length >= 3) {
        pool.push({ type: "matching", videoId: v.id, videoTitle: v.title, pairs: v.matching });
      }
    });
  }
  // cram: deferred to Sub-batch 4 (depends on cram-* SM-2 keys).

  // ─── Step 3: SM-2 filters ────────────────────────────────────────
  if (f.preferUnseen) {
    pool = pool.filter(item => {
      if (item.type === "matching") return true;
      const k = item.isScenario ? scenKey(item.videoId, item.qi) : mcKey(item.videoId, item.qi);
      return !store.sm2[k];
    });
  }

  if (f.dueOnly) {
    pool = pool.filter(item => {
      if (item.type === "matching") return true;
      const k = item.isScenario ? scenKey(item.videoId, item.qi) : mcKey(item.videoId, item.qi);
      const rec = store.sm2[k];
      if (!rec) return f.includeUnseen;
      return rec.nextDue <= today;
    });
  }

  if (f.belowAccuracy != null) {
    const min = f.minAttempts ?? 2;
    pool = pool.filter(item => {
      if (item.type === "matching") return true;
      const k = item.isScenario ? scenKey(item.videoId, item.qi) : mcKey(item.videoId, item.qi);
      const rec = store.sm2[k];
      if (!rec) return false;
      if (rec.total < min) return false;
      return (rec.correct / rec.total) < f.belowAccuracy;
    });
  }

  // ─── Step 4: optional length cap ─────────────────────────────────
  if (f.length != null) {
    pool = shuffle(pool, rng).slice(0, f.length);
  }

  return pool;
}
