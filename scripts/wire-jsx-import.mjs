// One-time edit: replace the inline ALL_SECTIONS literal on line 4 of
// src/secplus-quiz.jsx with a JSON import. Idempotent: refuses to run if the
// file is already wired.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const jsxPath = resolve(here, "..", "src/secplus-quiz.jsx");
const jsx = readFileSync(jsxPath, "utf8");
const lines = jsx.split("\n");

if (lines[1] && lines[1].includes('from "../questions.json"')) {
  console.log("Already wired — no changes.");
  process.exit(0);
}

if (!lines[3] || !lines[3].startsWith("const ALL_SECTIONS = [")) {
  console.error("ABORT: line 4 does not start with `const ALL_SECTIONS = [`");
  process.exit(1);
}

// Replace the import block (lines 1-5) with the new wired version.
//   line 1: existing React import
//   line 2: blank
//   line 3: comment
//   line 4: the giant literal
//   line 5: blank
const reactImport = lines[0];
const newHeader = [
  reactImport,
  'import ALL_SECTIONS from "../questions.json";',
  "",
  "// ─── DATA LIVES IN questions.json ──────────────────────────────",
  "",
];
const rebuilt = [...newHeader, ...lines.slice(5)].join("\n");

writeFileSync(jsxPath, rebuilt, "utf8");
console.log(`Wired. New file length: ${rebuilt.length} chars (was ${jsx.length}).`);
