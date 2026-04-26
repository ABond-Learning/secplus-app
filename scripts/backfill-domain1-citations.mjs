// Backfill Messer video + sub-objective citations on uncited Domain 1 MCs.
//
// Implicit citation derived from JSON tree position (authoritative by
// construction — a question filed under {video.id, video.title} in §X.Y is by
// definition a question about that video):
//   messerVideo  = "{X.Y} - {video.title}"   (e.g. "1.2 - The CIA Triad")
//   subObjective = "{X.Y}"                    (e.g. "1.2")
//
// Idempotent: skip questions that already have BOTH messerVideo and subObjective.
// Non-destructive: only populates missing fields; never overwrites existing ones.
// Per-question status logged for transparency.
//
// Usage:
//   node scripts/backfill-domain1-citations.mjs              # dry-run summary
//   node scripts/backfill-domain1-citations.mjs --preview    # write previewed copy to /tmp
//   node scripts/backfill-domain1-citations.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d1-citation-backfill-preview.json";
const write = process.argv.includes("--write");
const preview = process.argv.includes("--preview");

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
const perSub = {};
const logs = [];

for (const sec of data) {
  if (!sec.id || !sec.id.startsWith("1.")) continue;
  for (const v of sec.videos) {
    const sub = v.id;                                    // "1.2.1"
    const subObj = sub.split(".").slice(0, 2).join("."); // "1.2"
    const cite = `${subObj} - ${v.title}`;

    if (!validCitations.has(cite)) {
      console.error(`ERROR: implicit citation "${cite}" not in MESSER_VIDEOS.md — refusing to backfill §${sub}`);
      errors++;
      continue;
    }

    for (const kind of ["questions", "scenarios"]) {
      const items = v[kind] || [];
      items.forEach((q, i) => {
        const loc = `§${sub} ${kind === "questions" ? "mc" : "scen"}[${i}]`;
        const hasMV = !!q.messerVideo;
        const hasSO = !!q.subObjective;
        if (hasMV && hasSO) { skipped++; return; }

        const before = { messerVideo: q.messerVideo || null, subObjective: q.subObjective || null };
        if (!hasMV) q.messerVideo = cite;
        if (!hasSO) q.subObjective = subObj;

        added++;
        perSub[sub] = (perSub[sub] || 0) + 1;
        logs.push({ loc, before, added: { messerVideo: !hasMV ? cite : null, subObjective: !hasSO ? subObj : null } });
      });
    }
  }
}

if (errors > 0) { console.error(`\n${errors} citation-validation errors — aborting.`); process.exit(1); }

console.log(`\nDomain 1 citation backfill`);
console.log("═".repeat(70));
console.log(`Questions backfilled: ${added}`);
console.log(`Already cited (skipped): ${skipped}`);

console.log("\nPer-sub-objective additions:");
for (const sub of Object.keys(perSub).sort()) console.log(`  §${sub.padEnd(7)}  ${perSub[sub]}`);

// Confirm zero remaining uncited Domain 1 questions
let remaining = 0;
for (const sec of data) {
  if (!sec.id || !sec.id.startsWith("1.")) continue;
  for (const v of sec.videos) {
    for (const kind of ["questions", "scenarios"]) {
      for (const q of v[kind] || []) {
        if (!q.messerVideo || !q.subObjective) remaining++;
      }
    }
  }
}
console.log(`\nDomain 1 uncited remaining after backfill: ${remaining} (target: 0)`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\nwrote ${jsonPath}`);
} else if (preview) {
  writeFileSync(previewPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\nwrote preview ${previewPath}`);
} else {
  console.log("\n(dry run — pass --write to persist, or --preview for validator preview)");
}
