// Applies the curated British → American spelling rules to questions.json.
// Reuses spelling-map.mjs (same rules the validator uses) so there is exactly
// one source of truth.
//
// Usage:
//   node scripts/apply-spelling-pass.mjs            # apply, write file, summarise
//   node scripts/apply-spelling-pass.mjs --dry-run  # report only, do not write

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyRules } from "./spelling-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const path = resolve(repo, "questions.json");
const dryRun = process.argv.includes("--dry-run");

const data = JSON.parse(readFileSync(path, "utf8"));

// Each substitution log entry: { location, family, original, replacement, before, after }
const log = [];

function transform(value, location) {
  if (typeof value !== "string") return value;
  const { fixed, hits } = applyRules(value);
  if (hits.length === 0) return value;
  for (const hit of hits) {
    log.push({
      location,
      family: hit.family,
      original: hit.original,
      replacement: hit.replacement,
      before: value,
      after: fixed,
    });
  }
  return fixed;
}

for (const section of data) {
  const secLoc = `§${section.id}`;
  section.label = transform(section.label, `${secLoc}.label`);
  for (const video of section.videos) {
    const vidLoc = `${secLoc}/${video.id}`;
    video.title = transform(video.title, `${vidLoc}.title`);
    for (const [i, q] of (video.questions ?? []).entries()) {
      const loc = `${vidLoc} mc[${i}]`;
      q.q = transform(q.q, `${loc}.q`);
      q.opts = q.opts.map((o, oi) => transform(o, `${loc}.opts[${oi}]`));
      q.exp = transform(q.exp, `${loc}.exp`);
    }
    for (const [i, s] of (video.scenarios ?? []).entries()) {
      const loc = `${vidLoc} scen[${i}]`;
      s.q = transform(s.q, `${loc}.q`);
      s.opts = s.opts.map((o, oi) => transform(o, `${loc}.opts[${oi}]`));
      s.exp = transform(s.exp, `${loc}.exp`);
    }
    for (const [i, m] of (video.matching ?? []).entries()) {
      const loc = `${vidLoc} match[${i}]`;
      m.prompt = transform(m.prompt, `${loc}.prompt`);
      m.answer = transform(m.answer, `${loc}.answer`);
    }
    for (const [i, c] of (video.cram ?? []).entries()) {
      const loc = `${vidLoc} cram[${i}]`;
      c.term = transform(c.term, `${loc}.term`);
      c.def = transform(c.def, `${loc}.def`);
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────
const byFamily = {};
for (const entry of log) byFamily[entry.family] = (byFamily[entry.family] ?? 0) + 1;

console.log(`Substitutions: ${log.length}`);
for (const [family, n] of Object.entries(byFamily).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(4)}  ${family}`);
}

// Affected fields (de-dup by location).
const affectedLocations = new Set(log.map((l) => l.location));
console.log(`Distinct fields touched: ${affectedLocations.size}`);

if (dryRun) {
  console.log("\n[dry-run] no file written");
  process.exit(0);
}

writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`\nWrote ${path}`);
