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
const matchKey = (videoId, pi) => `match-${videoId}-${pi}`;

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
  // Matching items are a single pool unit per video but their SM-2 records
  // live one-per-pair under `match-{videoId}-{pi}`. Each filter below
  // consults the per-pair records rather than treating matching as a
  // free pass (which was the pre-fix behaviour and corrupted study signal:
  // preferUnseen always passed matching, dueOnly always passed matching,
  // belowAccuracy always passed matching).
  if (f.preferUnseen) {
    pool = pool.filter(item => {
      if (item.type === "matching") {
        // Unseen iff no pair has any record yet.
        return !item.pairs.some((_p, pi) => store.sm2[matchKey(item.videoId, pi)]);
      }
      const k = item.isScenario ? scenKey(item.videoId, item.qi) : mcKey(item.videoId, item.qi);
      return !store.sm2[k];
    });
  }

  if (f.dueOnly) {
    pool = pool.filter(item => {
      if (item.type === "matching") {
        // Block is due if any pair is due. If no pair has a record at all,
        // include only when includeUnseen is on (parity with MC/scen path).
        const anyDue = item.pairs.some((_p, pi) => {
          const rec = store.sm2[matchKey(item.videoId, pi)];
          return rec && rec.nextDue <= today;
        });
        if (anyDue) return true;
        const anyRec = item.pairs.some((_p, pi) => store.sm2[matchKey(item.videoId, pi)]);
        return !anyRec && f.includeUnseen;
      }
      const k = item.isScenario ? scenKey(item.videoId, item.qi) : mcKey(item.videoId, item.qi);
      const rec = store.sm2[k];
      if (!rec) return f.includeUnseen;
      return rec.nextDue <= today;
    });
  }

  if (f.belowAccuracy != null) {
    const min = f.minAttempts ?? 2;
    pool = pool.filter(item => {
      if (item.type === "matching") {
        // Include the block if any single pair meets minAttempts AND is
        // below the accuracy threshold. Drill Wrong intent is "specific
        // cards you're missing"; for matching the cards are pairs.
        return item.pairs.some((_p, pi) => {
          const rec = store.sm2[matchKey(item.videoId, pi)];
          if (!rec || rec.total < min) return false;
          return (rec.correct / rec.total) < f.belowAccuracy;
        });
      }
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
