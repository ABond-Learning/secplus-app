// src/study/buildPool.js
//
// Filter-driven, mode-agnostic question pool builder. Used by the
// Customise drawer (live preview) and StudyTab (Start handoff).
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
//   }

const mcKey = (videoId, qi) => `mc-${videoId}-${qi}`;
const scenKey = (videoId, qi) => `scen-${videoId}-${qi}`;

function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


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
