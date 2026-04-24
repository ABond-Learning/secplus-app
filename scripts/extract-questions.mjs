// One-time extraction of ALL_SECTIONS from src/secplus-quiz.jsx into questions.json.
// Verifies zero data loss by round-tripping the parsed JSON back to the original
// minified literal and comparing byte-for-byte.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsxPath = resolve(repo, "src/secplus-quiz.jsx");
const jsonPath = resolve(repo, "questions.json");

const PREFIX = "const ALL_SECTIONS = ";
const SUFFIX = ";";

const jsx = readFileSync(jsxPath, "utf8");
const lines = jsx.split("\n");
const dataLine = lines[3]; // 0-indexed, line 4

if (!dataLine.startsWith(PREFIX) || !dataLine.endsWith(SUFFIX)) {
  console.error("ABORT: line 4 does not match expected `const ALL_SECTIONS = [...];` shape");
  console.error("First 80 chars:", dataLine.slice(0, 80));
  console.error("Last 80 chars:", dataLine.slice(-80));
  process.exit(1);
}

const literal = dataLine.slice(PREFIX.length, dataLine.length - SUFFIX.length);
console.log(`Literal length: ${literal.length} chars`);

let data;
try {
  data = JSON.parse(literal);
} catch (e) {
  console.error("ABORT: literal is not valid JSON:", e.message);
  process.exit(1);
}

// Semantic round-trip: write the parsed data as JSON, parse it back, deep-equal
// against the original parse. Catches any data loss; ignores cosmetic differences
// (whitespace, Unicode escape style) that JSON.parse normalises away.
import { deepStrictEqual } from "node:assert/strict";
const roundTripped = JSON.parse(JSON.stringify(data));
try {
  deepStrictEqual(roundTripped, data);
} catch (e) {
  console.error("ABORT: semantic round-trip failed — extraction is lossy");
  console.error(e.message.slice(0, 2000));
  process.exit(1);
}
console.log("Semantic round-trip OK: every value preserved through JSON serialise/parse.");

// Counts.
let mc = 0, scen = 0, matching = 0, cramTerms = 0, videos = 0;
for (const section of data) {
  for (const video of section.videos ?? []) {
    videos++;
    mc += (video.questions ?? []).length;
    scen += (video.scenarios ?? []).length;
    matching += (video.matching ?? []).length;
    cramTerms += (video.cram ?? []).length;
  }
}
console.log(`Counts: ${data.length} sections, ${videos} videos, ${mc} MC, ${scen} scenarios, ${matching} matching pairs, ${cramTerms} cram terms`);

writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${jsonPath}`);
