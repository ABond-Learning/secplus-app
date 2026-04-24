// Spot-check: parse the still-untouched line 4 of the JSX as the source of truth,
// load questions.json, and confirm 3 hand-picked items match deep-equally.
// Picks: an MC, a scenario, and a matching pair, each from a different section.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deepStrictEqual } from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

const jsx = readFileSync(resolve(repo, "src/secplus-quiz.jsx"), "utf8");
const dataLine = jsx.split("\n")[3];
const PREFIX = "const ALL_SECTIONS = ";
const literal = dataLine.slice(PREFIX.length, -1);
const fromJsx = JSON.parse(literal);

const fromJson = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));

// Index sections by id for stable lookup.
const jsxBySection = Object.fromEntries(fromJsx.map((s) => [s.id, s]));
const jsonBySection = Object.fromEntries(fromJson.map((s) => [s.id, s]));

// Three picks from different sections + different types.
// Section ids are like "1.1", "2.3", etc. Pick ones we know exist.
const picks = [
  { section: "1.1", videoIdx: 0, kind: "questions", itemIdx: 0, label: "MC from §1.1, video 1, Q1" },
  { section: "2.3", videoIdx: 1, kind: "scenarios", itemIdx: 0, label: "Scenario from §2.3, video 2, S1" },
  { section: "4.1", videoIdx: 0, kind: "matching", itemIdx: 2, label: "Matching pair from §4.1, video 1, M3" },
];

let allOk = true;
for (const pick of picks) {
  const jsxSec = jsxBySection[pick.section];
  const jsonSec = jsonBySection[pick.section];
  if (!jsxSec || !jsonSec) {
    console.log(`SKIP ${pick.label}: section ${pick.section} not found in one source`);
    allOk = false;
    continue;
  }
  const jsxVid = jsxSec.videos?.[pick.videoIdx];
  const jsonVid = jsonSec.videos?.[pick.videoIdx];
  if (!jsxVid || !jsonVid) {
    console.log(`SKIP ${pick.label}: video index ${pick.videoIdx} not found`);
    allOk = false;
    continue;
  }
  const jsxItem = jsxVid[pick.kind]?.[pick.itemIdx];
  const jsonItem = jsonVid[pick.kind]?.[pick.itemIdx];
  if (!jsxItem || !jsonItem) {
    console.log(`SKIP ${pick.label}: item idx ${pick.itemIdx} of ${pick.kind} not found`);
    allOk = false;
    continue;
  }

  console.log("\n===== " + pick.label + " =====");
  console.log("Video: " + jsonVid.id + " — " + jsonVid.title);
  console.log("\nFrom JSX (source of truth):");
  console.log(JSON.stringify(jsxItem, null, 2));
  console.log("\nFrom questions.json:");
  console.log(JSON.stringify(jsonItem, null, 2));

  try {
    deepStrictEqual(jsonItem, jsxItem);
    console.log("\nVERDICT: deep-equal ✓");
  } catch (e) {
    console.log("\nVERDICT: MISMATCH ✗");
    console.log(e.message.slice(0, 1500));
    allOk = false;
  }
}

console.log("\n" + (allOk ? "All 3 spot-checks passed." : "SPOT-CHECK FAILURES PRESENT."));
process.exit(allOk ? 0 : 1);
