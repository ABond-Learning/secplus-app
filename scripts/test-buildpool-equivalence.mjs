#!/usr/bin/env node
// scripts/test-buildpool-equivalence.mjs — Task 2 Sub-batch 2A diff-test
//
// Per design v2 Q-N: assert SET equality between the new buildPool() and
// the legacy startQuiz pool-build branches across all 6 old modes plus
// the drill pseudo-mode.
//
// Why a one-shot script (not src/sync/__tests__/...): the legacyStartQuizPool
// reference implementation lives only during the migration window. It's
// deleted in Sub-batch 5, at which point this test loses its meaning.
//
// Strategy:
//  - Hardcoded fixture: 3 watched videos (1.1.1, 2.1.1, 4.5.1) covering
//    MC + scenarios + matching + cram, plus a 4.5.2 unwatched video.
//  - Synthetic SM-2 store with known due / unseen / weak distributions.
//  - For each mode, derive the legacy-shim filter set, run both
//    legacyStartQuizPool() and buildPool(), set-compare on a stable
//    item key (videoId + qi + type triple).
//  - Weak mode runs twice: equivalence (legacyVideoLevelWeak shim) and
//    divergence preview (per-question belowAccuracy=0.70). The divergence
//    is reported as INFO not FAIL — it's the intended Q-F behavior change
//    that 2C lights up.
//  - Drill pseudo-mode bypasses buildPool (preload list). Reported as
//    BYPASS — confirmed contract not exercised here.
//
// Exit code: 0 on all PASS/INFO/BYPASS, 1 on any FAIL.

import { buildPool, legacyStartQuizPool, seededRng, keyHelpers } from "../src/study/buildPool.js";

const { mcKey, scenKey } = keyHelpers;

// ─── fixture ────────────────────────────────────────────────────────
const TODAY = "2026-05-05";
const FUTURE = "2026-06-01";
const PAST = "2026-04-01";

function mkQ(stem) {
  return { q: stem, opts: ["a", "b", "c", "d"], a: 0, exp: "explanation goes here", messerVideo: "test", subObjective: "test" };
}
function mkScen(stem) {
  return { q: stem, opts: ["a", "b", "c", "d"], a: 0, exp: "scenario explanation here", messerVideo: "test", subObjective: "test" };
}

const SECTIONS = [
  {
    id: "1.1",
    label: "1.1 - Security Controls",
    videos: [
      {
        id: "1.1.1",
        title: "Security Controls",
        questions: [mkQ("1.1.1 q0"), mkQ("1.1.1 q1"), mkQ("1.1.1 q2")],
        scenarios: [mkScen("1.1.1 s0")],
        matching: [{ prompt: "p1", answer: "a1" }, { prompt: "p2", answer: "a2" }, { prompt: "p3", answer: "a3" }],
        cram: [{ term: "T1", def: "D1" }],
      },
    ],
  },
  {
    id: "2.1",
    label: "2.1 - Threat Actors",
    videos: [
      {
        id: "2.1.1",
        title: "Threat Actors",
        questions: [mkQ("2.1.1 q0"), mkQ("2.1.1 q1")],
        scenarios: [mkScen("2.1.1 s0"), mkScen("2.1.1 s1")],
        matching: [], // no matching exercise here
        cram: [{ term: "T1", def: "D1" }],
      },
    ],
  },
  {
    id: "4.5",
    label: "4.5 - SOC",
    videos: [
      {
        id: "4.5.1",
        title: "SOC operations",
        questions: [mkQ("4.5.1 q0"), mkQ("4.5.1 q1")],
        scenarios: [],
        matching: [{ prompt: "p1", answer: "a1" }, { prompt: "p2", answer: "a2" }, { prompt: "p3", answer: "a3" }, { prompt: "p4", answer: "a4" }],
        cram: [],
      },
      {
        id: "4.5.2",
        title: "Unwatched video",
        questions: [mkQ("4.5.2 q0")],
        scenarios: [],
        matching: [],
        cram: [],
      },
    ],
  },
];

const WATCHED_IDS = ["1.1.1", "2.1.1", "4.5.1"];
const WATCHED_VIDEOS = SECTIONS.flatMap(s => s.videos).filter(v => WATCHED_IDS.includes(v.id));

// SM-2 records:
//  1.1.1 q0  — seen, due TODAY,   1/2 correct (50% — weak, ≥2 attempts)
//  1.1.1 q1  — unseen
//  1.1.1 q2  — seen, due FUTURE,  4/4 correct (100% — fine)
//  1.1.1 s0  — seen, due PAST,    3/3 correct (100% — fine, but past-due is "due"-relative)
//  2.1.1 q0  — seen, due TODAY,   4/5 correct (80% — fine, NOT weak)
//  2.1.1 q1  — unseen
//  2.1.1 s0  — seen, due FUTURE,  3/3 correct (100%)
//  2.1.1 s1  — unseen
//  4.5.1 q0  — unseen (entire video unseen → legacy weak considers it weak)
//  4.5.1 q1  — unseen
const SM2 = {
  [mcKey("1.1.1", 0)]: { correct: 1, total: 2, nextDue: TODAY },
  [mcKey("1.1.1", 2)]: { correct: 4, total: 4, nextDue: FUTURE },
  [scenKey("1.1.1", 0)]: { correct: 3, total: 3, nextDue: PAST },
  [mcKey("2.1.1", 0)]: { correct: 4, total: 5, nextDue: TODAY },
  [scenKey("2.1.1", 0)]: { correct: 3, total: 3, nextDue: FUTURE },
};

const STORE = { sm2: SM2 };

// ─── set-equality helpers ──────────────────────────────────────────
function poolKey(item) {
  if (item.type === "matching") return `match-${item.videoId}`;
  if (item.isScenario) return `scen-${item.videoId}-${item.qi}`;
  return `mc-${item.videoId}-${item.qi}`;
}

function setOf(pool) {
  return new Set(pool.map(poolKey));
}

function setEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function setDiff(a, b) {
  const onlyA = [...a].filter(x => !b.has(x));
  const onlyB = [...b].filter(x => !a.has(x));
  return { onlyA, onlyB };
}

// ─── test cases ────────────────────────────────────────────────────
const SELECTED_ALL = WATCHED_IDS;

const CASES = [
  {
    name: "standard (Quiz default)",
    legacyMode: "standard",
    legacyArgs: { selectedVids: SELECTED_ALL, questionCount: 50, slice: false },
    buildPoolArgs: {
      mode: "quiz",
      filters: { questionTypes: ["mc"], videoIds: SELECTED_ALL, watchedOnly: true },
    },
  },
  {
    name: "new (preferUnseen MC+scen)",
    legacyMode: "new",
    legacyArgs: { questionCount: 50, slice: false },
    buildPoolArgs: {
      mode: "quiz",
      filters: { questionTypes: ["mc", "scen"], preferUnseen: true, watchedOnly: true },
    },
  },
  {
    name: "scenario (scen-only)",
    legacyMode: "scenario",
    legacyArgs: { selectedVids: SELECTED_ALL, questionCount: 50, slice: false },
    buildPoolArgs: {
      mode: "quiz",
      filters: { questionTypes: ["scen"], videoIds: SELECTED_ALL, watchedOnly: true },
    },
  },
  {
    name: "spaced (Review: dueOnly+includeUnseen, MC-only legacy)",
    legacyMode: "spaced",
    legacyArgs: {},
    buildPoolArgs: {
      mode: "review",
      filters: { questionTypes: ["mc"], dueOnly: true, includeUnseen: true, watchedOnly: true },
    },
  },
  {
    name: "weak (legacy video-level scope — 2A shim)",
    legacyMode: "weak",
    legacyArgs: {},
    buildPoolArgs: {
      mode: "drill",
      filters: { questionTypes: ["mc"], legacyVideoLevelWeak: true, watchedOnly: true },
    },
  },
  {
    name: "matching (whole exercises ≥3 pairs)",
    legacyMode: "matching",
    legacyArgs: { selectedVids: SELECTED_ALL },
    buildPoolArgs: {
      mode: "matching",
      filters: { questionTypes: ["match"], videoIds: SELECTED_ALL, watchedOnly: true },
    },
  },
];

// ─── runner ─────────────────────────────────────────────────────────
const results = [];
let anyFail = false;

for (const c of CASES) {
  const legacy = legacyStartQuizPool({
    m: c.legacyMode,
    watchedVideos: WATCHED_VIDEOS,
    store: STORE,
    today: TODAY,
    ...c.legacyArgs,
  });
  const novel = buildPool({
    sections: SECTIONS,
    watchedVideos: WATCHED_VIDEOS,
    store: STORE,
    today: TODAY,
    ...c.buildPoolArgs,
  });

  const setA = setOf(legacy);
  const setB = setOf(novel);
  const ok = setEqual(setA, setB);
  if (!ok) anyFail = true;
  results.push({
    mode: c.name,
    status: ok ? "PASS" : "FAIL",
    legacyCount: legacy.length,
    novelCount: novel.length,
    diff: ok ? null : setDiff(setA, setB),
  });
}

// ─── divergence preview: weak per-question (Q-F target behavior) ────
// 2A keeps legacy video-level weak; 2C swaps to per-question. This block
// previews what the divergence will look like so 2C can confirm it's the
// intended behavior change, not a regression.
{
  const legacyVideoLevel = legacyStartQuizPool({
    m: "weak", watchedVideos: WATCHED_VIDEOS, store: STORE, today: TODAY,
  });
  const newPerQuestion = buildPool({
    mode: "drill",
    filters: { questionTypes: ["mc"], belowAccuracy: 0.70, minAttempts: 2, watchedOnly: true },
    sections: SECTIONS,
    watchedVideos: WATCHED_VIDEOS,
    store: STORE,
    today: TODAY,
  });
  const setOld = setOf(legacyVideoLevel);
  const setNew = setOf(newPerQuestion);
  const { onlyA, onlyB } = setDiff(setOld, setNew);
  results.push({
    mode: "weak (divergence preview: per-question, Q-F target)",
    status: "INFO",
    legacyCount: legacyVideoLevel.length,
    novelCount: newPerQuestion.length,
    diff: { onlyInLegacy: onlyA, onlyInNew: onlyB },
  });
}

// ─── drill pseudo-mode (post-exam preload) ──────────────────────────
results.push({
  mode: "drill (post-exam preload — bypasses buildPool)",
  status: "BYPASS",
  legacyCount: null,
  novelCount: null,
  diff: null,
  note: "pendingDrill payload flows through QuizTab useEffect; no pool-build path. Manual UI test confirms contract preserved.",
});

// ─── report ─────────────────────────────────────────────────────────
console.log("\nbuildPool ↔ legacyStartQuizPool diff-test (Sub-batch 2A)");
console.log("=".repeat(72));
console.log("status  legacy / novel  mode");
console.log("-".repeat(72));
for (const r of results) {
  const counts = (r.legacyCount == null && r.novelCount == null)
    ? "  -    /   -  "
    : `${String(r.legacyCount).padStart(4)} / ${String(r.novelCount).padStart(4)}    `;
  console.log(`${r.status.padEnd(6)}  ${counts}  ${r.mode}`);
}
console.log("-".repeat(72));

const fails = results.filter(r => r.status === "FAIL");
if (fails.length) {
  console.log("\nFAILURE DETAIL:");
  for (const r of fails) {
    console.log(`  ${r.mode}`);
    console.log(`    only in legacy: ${JSON.stringify(r.diff.onlyA)}`);
    console.log(`    only in novel:  ${JSON.stringify(r.diff.onlyB)}`);
  }
}

const infos = results.filter(r => r.status === "INFO");
if (infos.length) {
  console.log("\nDIVERGENCE PREVIEW (informational; intentional Q-F behavior change in 2C):");
  for (const r of infos) {
    console.log(`  ${r.mode}`);
    console.log(`    legacy pool (size ${r.legacyCount}): ${JSON.stringify([...setOf(legacyStartQuizPool({ m: "weak", watchedVideos: WATCHED_VIDEOS, store: STORE, today: TODAY }))])}`);
    console.log(`    novel pool  (size ${r.novelCount}): ${JSON.stringify([...setOf(buildPool({ mode: "drill", filters: { questionTypes: ["mc"], belowAccuracy: 0.70, minAttempts: 2, watchedOnly: true }, sections: SECTIONS, watchedVideos: WATCHED_VIDEOS, store: STORE, today: TODAY }))])}`);
    console.log(`    only in legacy (would be lost in 2C): ${JSON.stringify(r.diff.onlyInLegacy)}`);
    console.log(`    only in novel  (would be added in 2C): ${JSON.stringify(r.diff.onlyInNew)}`);
  }
}

console.log("");
if (anyFail) {
  console.log("RESULT: FAIL");
  process.exit(1);
} else {
  console.log("RESULT: PASS (all equivalence cases match; divergences are flagged INFO)");
  process.exit(0);
}
