#!/usr/bin/env node
// Task 1g.3 step 3 — build the S-1 calibration sample (30 items), the blind-
// review packet, and the accidental-match ground-truth template. Read + select
// + emit only; no API calls, no network. Idempotent under a fixed SEED.
//
// Corpus: .audit-working/sybex-practice-tests/ (18 files = ch02-17 + pe01 +
// pe02 = 500 questions; ch01 excluded by design). Anchors are the 5 questions
// where `guess_matched_correct === true` (ch04 q1, ch08 q3, ch11 q15, ch12 q17,
// ch14 q20) — locked as ground-truth seeds for the 1g.3 calibration pass.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SEED = 20260528;
const SAMPLE_TOTAL = 30;
const CHAPTER_TOTAL = 19;
const PE_TOTAL = 11;
const ANCHOR_LOCATIONS = [
  { ch: 4, n: 1 },
  { ch: 8, n: 3 },
  { ch: 11, n: 15 },
  { ch: 12, n: 17 },
  { ch: 14, n: 20 },
];

const CORPUS_DIR = ".audit-working/sybex-practice-tests";
const OUTPUT_DIR = ".audit-working/sb-1g-3";

// mulberry32 — seedable 32-bit PRNG. Deterministic; identical seed →
// identical stream regardless of host or Node version.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadChapter(ch) {
  const nn = String(ch).padStart(2, "0");
  const path = resolve(CORPUS_DIR, `chapter-${nn}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  return data.questions.map((q) => ({
    ...q,
    id: `sybex-ch${nn}-q${q.n}`,
    source: `chapter-${nn}`,
    chapter: ch,
    bucket: "chapter",
  }));
}

function loadPE(pe) {
  const nn = String(pe).padStart(2, "0");
  const path = resolve(CORPUS_DIR, `practice-exam-${nn}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  return data.questions.map((q) => ({
    ...q,
    id: `sybex-pe${nn}-q${q.n}`,
    source: `practice-exam-${nn}`,
    pe,
    bucket: "pe",
  }));
}

function loadCorpus() {
  const chapters = [];
  for (let ch = 2; ch <= 17; ch++) chapters.push(loadChapter(ch));
  const pe = [loadPE(1), loadPE(2)];
  return { chapters, pe };
}

function integrityCheck({ chapters, pe }) {
  const errors = [];
  const fileCount = chapters.length + pe.length;
  if (fileCount !== 18) errors.push(`expected 18 files, got ${fileCount}`);
  const totalQ = chapters.flat().length + pe.flat().length;
  if (totalQ !== 500) errors.push(`expected 500 questions, got ${totalQ}`);
  const allItems = [...chapters.flat(), ...pe.flat()];
  const accidentalIds = allItems
    .filter((q) => q.guess_matched_correct === true)
    .map((q) => q.id)
    .sort();
  const expectedAnchorIds = ANCHOR_LOCATIONS.map(
    ({ ch, n }) => `sybex-ch${String(ch).padStart(2, "0")}-q${n}`,
  ).sort();
  const setsMatch =
    accidentalIds.length === expectedAnchorIds.length &&
    accidentalIds.every((id, i) => id === expectedAnchorIds[i]);
  if (!setsMatch) {
    errors.push(
      `accidental-match set mismatch: expected [${expectedAnchorIds.join(", ")}], got [${accidentalIds.join(", ")}]`,
    );
  }
  return { errors, fileCount, totalQ, accidentalIds, expectedAnchorIds };
}

function selectSample({ chapters, pe }, rand) {
  const expectedAnchorIds = ANCHOR_LOCATIONS.map(
    ({ ch, n }) => `sybex-ch${String(ch).padStart(2, "0")}-q${n}`,
  );
  const allChapterItems = chapters.flat();
  const anchors = expectedAnchorIds.map((id) => {
    const q = allChapterItems.find((x) => x.id === id);
    if (!q) throw new Error(`anchor not found: ${id}`);
    return q;
  });
  const anchorChapters = new Set(anchors.map((a) => a.chapter));
  const anchorIds = new Set(anchors.map((a) => a.id));

  // Pre-shuffle each chapter's non-anchor pool so the "pick one" inside the
  // selection rounds is deterministic and exhausts a chapter's pool in a
  // stable order.
  const shuffledByChapter = new Map();
  for (let ch = 2; ch <= 17; ch++) {
    const pool = allChapterItems.filter(
      (q) => q.chapter === ch && !anchorIds.has(q.id),
    );
    shuffledByChapter.set(ch, shuffle(pool, rand));
  }

  // Spread strategy: first cover chapters NOT already represented by an
  // anchor (one item each), then fill remaining slots from anchored chapters
  // so each contributes a second (non-anchor) item too. With 14 picks needed
  // and 11 uncovered chapters, round 1 yields 11; round 2 draws 3 more.
  const uncovered = [];
  const covered = [];
  for (let ch = 2; ch <= 17; ch++) {
    (anchorChapters.has(ch) ? covered : uncovered).push(ch);
  }
  const uncoveredOrder = shuffle(uncovered, rand);
  const coveredOrder = shuffle(covered, rand);

  const TARGET = CHAPTER_TOTAL - anchors.length; // 14
  const chapterPicks = [];
  const usedIds = new Set();
  const drawOne = (ch) => {
    const pool = shuffledByChapter.get(ch);
    const pick = pool.find((q) => !usedIds.has(q.id));
    if (pick) {
      chapterPicks.push(pick);
      usedIds.add(pick.id);
    }
  };
  for (const ch of uncoveredOrder) {
    if (chapterPicks.length >= TARGET) break;
    drawOne(ch);
  }
  for (const ch of coveredOrder) {
    if (chapterPicks.length >= TARGET) break;
    drawOne(ch);
  }

  // PE: combine pe01 + pe02 (180 items), shuffle, take 11. The pe01/pe02
  // split falls out of the seed naturally.
  const peCombined = [...pe[0], ...pe[1]];
  const pePicks = shuffle(peCombined, rand).slice(0, PE_TOTAL);

  return { anchors, chapterPicks, pePicks };
}

function emitJsonRecord(q) {
  return {
    id: q.id,
    source: q.source,
    n: q.n,
    stem: q.stem,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    is_accidental_match: q.guess_matched_correct === true,
    seed: SEED,
  };
}

function blindBlock(q) {
  const opts = Object.entries(q.options)
    .map(([k, v]) => `  ${k}. ${v}`)
    .join("\n");
  return `### ${q.id}

**Stem:** ${q.stem}

**Options:**
${opts}

**Correct:** ${q.correct.letter}. ${q.correct.text}

**Explanation:** ${q.explanation}
`;
}

function templateBlock(q) {
  const opts = Object.entries(q.options)
    .map(([k, v]) => `  ${k}. ${v}`)
    .join("\n");
  return `### ${q.id}

- **Source:** ${q.source} (n=${q.n})
- **Stem:** ${q.stem}

**Options:**
${opts}

**Correct:** ${q.correct.letter}. ${q.correct.text}

**Explanation:** ${q.explanation}

OBJECTIVE_CODE (X.Y): ____
NOTE: ____
`;
}

function main() {
  const corpus = loadCorpus();
  const integrity = integrityCheck(corpus);
  if (integrity.errors.length > 0) {
    console.error("INTEGRITY CHECK FAILED — refusing to sample on a drifted corpus:");
    for (const e of integrity.errors) console.error("  -", e);
    process.exit(1);
  }
  console.log(
    `integrity OK: ${integrity.fileCount} files, ${integrity.totalQ} questions, ${integrity.accidentalIds.length} accidental matches (= expected anchor set)`,
  );

  const rand = mulberry32(SEED);
  const { anchors, chapterPicks, pePicks } = selectSample(corpus, rand);

  // Final asserts.
  const allSelected = [...anchors, ...chapterPicks, ...pePicks];
  if (allSelected.length !== SAMPLE_TOTAL) {
    console.error(`FATAL: final count ${allSelected.length} != ${SAMPLE_TOTAL}`);
    process.exit(1);
  }
  if (anchors.length + chapterPicks.length !== CHAPTER_TOTAL) {
    console.error(
      `FATAL: chapter count ${anchors.length + chapterPicks.length} != ${CHAPTER_TOTAL}`,
    );
    process.exit(1);
  }
  if (pePicks.length !== PE_TOTAL) {
    console.error(`FATAL: PE count ${pePicks.length} != ${PE_TOTAL}`);
    process.exit(1);
  }
  // Defensive: only anchors should be accidental matches.
  const nonAnchorAccidentals = [...chapterPicks, ...pePicks].filter(
    (q) => q.guess_matched_correct === true,
  );
  if (nonAnchorAccidentals.length > 0) {
    console.error(
      `FATAL: non-anchor accidental match in selection: ${nonAnchorAccidentals.map((q) => q.id).join(", ")}`,
    );
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. calibration-sample-S1.json — all 30, sorted by id (stable).
  const sorted = [...allSelected].sort((a, b) => a.id.localeCompare(b.id));
  const jsonPath = resolve(OUTPUT_DIR, "calibration-sample-S1.json");
  writeFileSync(
    jsonPath,
    JSON.stringify(sorted.map(emitJsonRecord), null, 2) + "\n",
    "utf8",
  );

  // 2. calibration-sample-S1-blind.md — presentation order seed-shuffled.
  const blindShuffled = shuffle(allSelected, rand);
  const blindMd =
    `# Calibration Sample S-1 — Blind Review Packet\n\n` +
    `**Seed:** ${SEED}  \n` +
    `**Total:** ${SAMPLE_TOTAL} items (presentation order seed-shuffled; do not infer item type from position)\n\n` +
    `---\n\n` +
    blindShuffled.map(blindBlock).join("\n---\n\n");
  const blindPath = resolve(OUTPUT_DIR, "calibration-sample-S1-blind.md");
  writeFileSync(blindPath, blindMd, "utf8");

  // 3. accidental-match-ground-truth-template.md — anchors only, sorted by id.
  const anchorsSorted = [...anchors].sort((a, b) => a.id.localeCompare(b.id));
  const templateMd =
    `# Accidental-Match Ground-Truth Template\n\n` +
    `**Seed:** ${SEED}  \n` +
    `**Items:** ${anchors.length} anchors (the 5 accidental matches in the chapter pool)\n\n` +
    `Fill in **OBJECTIVE_CODE** as \`X.Y\` (e.g. \`2.4\`, not \`2.4.1\`). **NOTE** is free-form.\n\n` +
    `---\n\n` +
    anchorsSorted.map(templateBlock).join("\n---\n\n");
  const templatePath = resolve(
    OUTPUT_DIR,
    "accidental-match-ground-truth-template.md",
  );
  writeFileSync(templatePath, templateMd, "utf8");

  // Summary to stdout (consumed by the status-block builder).
  console.log("\nselection summary:");
  console.log("  anchors (5):", anchors.map((q) => q.id).join(", "));
  console.log("  chapter picks (14):", chapterPicks.map((q) => q.id).join(", "));
  console.log("  PE picks (11):", pePicks.map((q) => q.id).join(", "));
  const chapterSpread = {};
  for (const q of chapterPicks)
    chapterSpread[q.chapter] = (chapterSpread[q.chapter] ?? 0) + 1;
  console.log(
    "  chapter spread of the 14:",
    Object.entries(chapterSpread)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ch, c]) => `ch${String(ch).padStart(2, "0")}=${c}`)
      .join(", "),
  );
  const peSpread = { pe01: 0, pe02: 0 };
  for (const q of pePicks) peSpread[`pe0${q.pe}`] += 1;
  console.log(`  PE split: pe01=${peSpread.pe01}, pe02=${peSpread.pe02}`);
  console.log("\nwrote:");
  console.log("  " + jsonPath);
  console.log("  " + blindPath);
  console.log("  " + templatePath);
}

main();
