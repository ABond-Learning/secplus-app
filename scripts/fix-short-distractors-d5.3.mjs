// Sub-batch 2 mega-pass — §5.3 cohort (Third-party Risk): 2 cohort items, 2 modified.
//
// 0 Convention B holdbacks.
//
// 1 rebuild:
//   - mc-5.3.1-1  SOC 2 Type II vs Type I
//
// 1 simple-pad:
//   - mc-5.3.2-2  ISA
//
// Watchpoints respected:
//   - SOC 1 (financial controls), SOC 2 (security/availability/processing/confidentiality/
//     privacy), SOC 3 (public summary) — distinct.
//   - SOC 2 Type I (point-in-time control existence) vs Type II (operating effectiveness
//     over period 6-12 months) — distinct.
//   - Agreement types: SLA / OLA / MSA / NDA / MOU / DPA / BPA / ISA — distinct purposes.
//     ISA (Interconnection Security Agreement) governs network interconnections.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d5.3-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "5.3.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "A SOC 2 Type II report differs from SOC 2 Type I in that",
    intensity: "rebuild",
    newOpts: [
      "Type II covers more controls than Type I including additional Trust Service Criteria categories",         // 99
      "Type I is more valuable to a customer than Type II because Type I is conducted more frequently",           // 96
      "Type II demonstrates that controls were operating effectively over a period of time (6-12 months) — Type I only verifies controls exist at a point in time",  // ✓ 154
      "They are the same report distinguished only by the auditor firm performing the engagement",                  // 95
    ],
  },
  {
    videoId: "5.3.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "An ISA (Interconnection Security Agreement) is used when",
    intensity: "simple-pad",
    newOpts: [
      "Two organizations share a non-disclosure agreement covering an upcoming acquisition discussion",          // 96
      "Two organizations connect their networks to each other — defining the security requirements, controls, and responsibilities for each side",  // ✓ 137
      "A vendor provides cloud services and an SLA covers availability uptime guarantees and remedies",            // 95
      "An employee works remotely from a personal residence using corporate-issued equipment only",                 // 92
    ],
  },
];

let applied = 0, skipped = 0, refused = 0;
const log = [];
for (const r of REPLACEMENTS) {
  const sec = data.find((s) => s.id === r.videoId.split(".").slice(0, 2).join("."));
  if (!sec) { console.error(`section not found for ${r.videoId}`); refused++; continue; }
  const vid = sec.videos.find((v) => v.id === r.videoId);
  if (!vid) { console.error(`video not found for ${r.videoId}`); refused++; continue; }
  const list = r.kind === "mc" ? vid.questions : vid.scenarios;
  const item = list?.[r.index];
  if (!item) { console.error(`item not found at ${r.videoId} ${r.kind}[${r.index}]`); refused++; continue; }
  if (!item.q.startsWith(r.expectedOldStemPrefix)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — stem mismatch`);
    refused++; continue;
  }
  const sameOpts = r.newOpts.length === item.opts.length && r.newOpts.every((o, i) => o === item.opts[i]);
  if (sameOpts) { skipped++; continue; }
  const currentCorrect = item.opts[item.a];
  if (!r.newOpts.includes(currentCorrect)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
    refused++; continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\n§5.3 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length}`);
console.log(`  applied:  ${applied}`);
console.log(`  skipped (idempotent): ${skipped}`);
console.log(`  refused (safety): ${refused}`);
const intensityCounts = {};
for (const l of log) intensityCounts[l.intensity] = (intensityCounts[l.intensity] || 0) + 1;
console.log(`Intensity:`, intensityCounts);

if (write || preview) {
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`Wrote to ${target}`);
}
