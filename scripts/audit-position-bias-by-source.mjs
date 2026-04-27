// Per-source breakdown of correct-answer position bias.
//
// Identifies Task 1b items by extracting `q:` stems from every
// scripts/add-domain*.mjs and scripts/rewrite-domain*.mjs file,
// then matching against questions.json by exact stem equality.
//
// Anything that matches a Task 1b stem = task1b.
// Anything else = legacy (untouched by Task 1b authoring/rewrite work).
//
// Output: separate position distributions for each source × kind × domain.
//
// Usage:
//   node scripts/audit-position-bias-by-source.mjs
//   node scripts/audit-position-bias-by-source.mjs --details   # show per-script stem counts

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const scriptsDir = resolve(repo, "scripts");

const showDetails = process.argv.includes("--details");

// ─── Load questions.json ──────────────────────────────────────────────────
const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// ─── Extract Task 1b stems from add/rewrite scripts ───────────────────────
const task1bScripts = readdirSync(scriptsDir)
  .filter((f) => /^(add|rewrite)-domain\d+-batch\d+\.mjs$/.test(f))
  .sort();

// Each line that starts (after whitespace) with `q: "..."` declares a stem.
// The string can contain escaped quotes (\") and other escapes (\n etc.).
// Use a tolerant regex; the scripts always put q on its own line.
const Q_LINE = /^\s*q:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/;

function unescapeJsString(s) {
  // Handle the common escapes that appear in our stems: \" \' \\ \n \t \/
  return s
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\//g, "/");
}

const task1bStems = new Set(); // exact `q` strings as they should appear in JSON
const stemsPerScript = {}; // scriptName -> count
for (const fname of task1bScripts) {
  const text = readFileSync(resolve(scriptsDir, fname), "utf8");
  let count = 0;
  for (const line of text.split("\n")) {
    const m = line.match(Q_LINE);
    if (m) {
      task1bStems.add(unescapeJsString(m[1]));
      count++;
    }
  }
  stemsPerScript[fname] = count;
}

if (showDetails) {
  console.log("Task 1b script stem counts (raw matches; rewrites have 1 stem per item; adds have 1 per item):");
  for (const [f, n] of Object.entries(stemsPerScript)) console.log(`  ${f}: ${n}`);
  console.log(`\nDistinct Task 1b stems: ${task1bStems.size}`);
}

// ─── Classify every catalog item ──────────────────────────────────────────
const classified = []; // { domain, kind, source: 'task1b'|'legacy', a }
for (const sec of data) {
  const domain = (sec.id || "?").split(".")[0];
  for (const vid of sec.videos || []) {
    for (const q of vid.questions || []) {
      const source = task1bStems.has(q.q) ? "task1b" : "legacy";
      classified.push({ domain, kind: "mc", source, a: q.a });
    }
    for (const s of vid.scenarios || []) {
      const source = task1bStems.has(s.q) ? "task1b" : "legacy";
      classified.push({ domain, kind: "scen", source, a: s.a });
    }
  }
}

// ─── Stat helpers ─────────────────────────────────────────────────────────
function distribution(items) {
  const counts = [0, 0, 0, 0];
  let total = 0;
  for (const it of items) {
    if (typeof it.a === "number" && it.a >= 0 && it.a <= 3) {
      counts[it.a]++; total++;
    }
  }
  const expected = total / 4;
  const chi2 = expected === 0 ? 0 : counts.reduce((s, c) => s + ((c - expected) ** 2) / expected, 0);
  return { counts, total, expected, chi2 };
}

function fmtRow(label, dist) {
  const { counts, total, chi2 } = dist;
  const pct = counts.map((c) => total === 0 ? 0 : (100 * c / total));
  return `  ${label.padEnd(36)} n=${total.toString().padStart(4)}  ` +
    `[0]:${counts[0].toString().padStart(3)} (${pct[0].toFixed(1).padStart(4)}%)  ` +
    `[1]:${counts[1].toString().padStart(3)} (${pct[1].toFixed(1).padStart(4)}%)  ` +
    `[2]:${counts[2].toString().padStart(3)} (${pct[2].toFixed(1).padStart(4)}%)  ` +
    `[3]:${counts[3].toString().padStart(3)} (${pct[3].toFixed(1).padStart(4)}%)  ` +
    `χ²=${chi2.toFixed(2)}`;
}

// ─── Sanity check matched-count vs known totals ───────────────────────────
const totalTask1b = classified.filter((x) => x.source === "task1b").length;
const totalLegacy = classified.filter((x) => x.source === "legacy").length;
console.log(`\nClassification: ${totalTask1b} task1b + ${totalLegacy} legacy = ${classified.length} total`);
console.log(`(Expected ~193 task1b items per Task 1b memo; if mismatch, some stems failed extraction.)`);

const task1bByDomain = {};
const legacyByDomain = {};
for (const x of classified) {
  if (x.source === "task1b") (task1bByDomain[x.domain] ??= []).push(x);
  else (legacyByDomain[x.domain] ??= []).push(x);
}

console.log("\nTask 1b items per domain:");
for (const d of ["1","2","3","4","5"]) {
  const arr = task1bByDomain[d] || [];
  const mc = arr.filter((x) => x.kind === "mc").length;
  const scen = arr.filter((x) => x.kind === "scen").length;
  console.log(`  D${d}: ${mc} MC + ${scen} scen = ${mc + scen}`);
}
console.log("Legacy items per domain:");
for (const d of ["1","2","3","4","5"]) {
  const arr = legacyByDomain[d] || [];
  const mc = arr.filter((x) => x.kind === "mc").length;
  const scen = arr.filter((x) => x.kind === "scen").length;
  console.log(`  D${d}: ${mc} MC + ${scen} scen = ${mc + scen}`);
}

// ─── Distribution tables ──────────────────────────────────────────────────
const sources = ["task1b", "legacy"];
const kinds = ["mc", "scen"];

console.log("\n══ MC: catalogue-wide by source ══════════════════════════════════════");
for (const src of sources) {
  console.log(fmtRow(`${src} MC (all domains)`, distribution(classified.filter((x) => x.kind === "mc" && x.source === src))));
}

console.log("\n══ Scenarios: catalogue-wide by source ════════════════════════════════");
for (const src of sources) {
  console.log(fmtRow(`${src} scen (all domains)`, distribution(classified.filter((x) => x.kind === "scen" && x.source === src))));
}

console.log("\n══ MC per-domain by source ════════════════════════════════════════════");
for (const d of ["1","2","3","4","5"]) {
  for (const src of sources) {
    const subset = classified.filter((x) => x.kind === "mc" && x.source === src && x.domain === d);
    if (subset.length === 0) {
      console.log(`  D${d} MC ${src}                       n=   0   (no items)`);
      continue;
    }
    console.log(fmtRow(`D${d} MC ${src}`, distribution(subset)));
  }
}

console.log("\n══ Scenarios per-domain by source ═════════════════════════════════════");
for (const d of ["1","2","3","4","5"]) {
  for (const src of sources) {
    const subset = classified.filter((x) => x.kind === "scen" && x.source === src && x.domain === d);
    if (subset.length === 0) {
      console.log(`  D${d} scen ${src}                     n=   0   (no items)`);
      continue;
    }
    console.log(fmtRow(`D${d} scen ${src}`, distribution(subset)));
  }
}

console.log("\nχ² > 7.82 → biased at p<0.05; > 11.34 → p<0.01. Uniform expectation = 25% per position.");
