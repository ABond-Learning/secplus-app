// Backfill Messer video + sub-objective citations on uncited MCs and scenarios
// for a given domain. Implicit citation derived from JSON tree position
// (authoritative by construction):
//
//   messerVideo  = "{X.Y} - {video.title}"   (e.g. "2.3 - SQL Injection")
//   subObjective = "{X.Y}"                    (e.g. "2.3")
//
// Idempotent: skip questions that already have BOTH messerVideo and
// subObjective. Non-destructive: only populates missing fields; never
// overwrites existing ones.
//
// Generalized from scripts/backfill-domain1-citations.mjs (committed `c08720a`,
// applied to Domain 1 then removed in the same prep commit that introduced
// this script).
//
// Usage:
//   node scripts/backfill-citations.mjs --domain=N            # dry-run summary
//   node scripts/backfill-citations.mjs --domain=N --preview  # write previewed copy to /tmp
//   node scripts/backfill-citations.mjs --domain=N --write    # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");

const args = process.argv.slice(2);
const domainArg = args.find((a) => a.startsWith("--domain="))?.split("=")[1];
const write = args.includes("--write");
const preview = args.includes("--preview");
if (!domainArg) {
  console.error("Usage: --domain=N (1-5) [--preview | --write]");
  process.exit(2);
}
const targetDomain = String(domainArg);
const previewPath = `/tmp/questions-d${targetDomain}-citation-backfill-preview.json`;

// Validate every implicit citation against MESSER_VIDEOS.md before applying.
const messerMd = readFileSync(resolve(repo, "MESSER_VIDEOS.md"), "utf8");
const validCitations = new Set();
let curSec = null;
for (const line of messerMd.split("\n")) {
  const sec = line.match(/^### (\d+\.\d+)\s+[–-]\s+(.+)$/);
  if (sec) { curSec = sec[1]; continue; }
  const vid = line.match(/^-\s+(.+)$/);
  if (vid && curSec) validCitations.add(`${curSec} - ${vid[1].trim()}`);
}

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

let added = 0, skipped = 0, errors = 0;
let mcAdded = 0, scenAdded = 0;
const perSub = {};

for (const sec of data) {
  if (!sec.id || !sec.id.startsWith(targetDomain + ".")) continue;
  for (const v of sec.videos) {
    const sub = v.id;                                    // "X.Y.Z"
    const subObj = sub.split(".").slice(0, 2).join("."); // "X.Y"
    const cite = `${subObj} - ${v.title}`;

    if (!validCitations.has(cite)) {
      console.error(`ERROR: implicit citation "${cite}" not in MESSER_VIDEOS.md — refusing to backfill §${sub}`);
      errors++;
      continue;
    }

    for (const kind of ["questions", "scenarios"]) {
      const items = v[kind] || [];
      items.forEach((q) => {
        const hasMV = !!q.messerVideo;
        const hasSO = !!q.subObjective;
        if (hasMV && hasSO) { skipped++; return; }
        if (!hasMV) q.messerVideo = cite;
        if (!hasSO) q.subObjective = subObj;
        added++;
        if (kind === "questions") mcAdded++; else scenAdded++;
        perSub[sub] = (perSub[sub] || 0) + 1;
      });
    }
  }
}

if (errors > 0) { console.error(`\n${errors} citation-validation errors — aborting.`); process.exit(1); }

console.log(`\nDomain ${targetDomain} citation backfill`);
console.log("═".repeat(70));
console.log(`Questions backfilled:    ${added}  (${mcAdded} MC + ${scenAdded} scen)`);
console.log(`Already cited (skipped): ${skipped}`);

console.log("\nPer-sub-objective additions:");
for (const sub of Object.keys(perSub).sort()) console.log(`  §${sub.padEnd(7)}  ${perSub[sub]}`);

// Confirm zero remaining uncited in target domain
let remaining = 0;
for (const sec of data) {
  if (!sec.id || !sec.id.startsWith(targetDomain + ".")) continue;
  for (const v of sec.videos) {
    for (const kind of ["questions", "scenarios"]) {
      for (const q of v[kind] || []) {
        if (!q.messerVideo || !q.subObjective) remaining++;
      }
    }
  }
}
console.log(`\nDomain ${targetDomain} uncited remaining after backfill: ${remaining} (target: 0)`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\nwrote ${jsonPath}`);
} else if (preview) {
  writeFileSync(previewPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\nwrote preview ${previewPath}`);
} else {
  console.log("\n(dry run — pass --write to persist, or --preview for validator preview)");
}
