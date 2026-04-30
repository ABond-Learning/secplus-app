// Sub-batch 2 mega-pass — §2.1 cohort (Threat Actors): 6 cohort items, 1 modified.
//
// 5 Convention B holdbacks (threat-actor category names — short-on-short symmetry is
// exam-realistic; same Convention B reasoning as §2.2 phishing-taxonomy and password-attack
// term recall):
//   - mc-2.1.1-0 (most resources → Nation-state)
//   - mc-2.1.1-1 (defacing → Hacktivist)
//   - mc-2.1.1-2 (pre-written tools → Unskilled attacker)
//   - mc-2.1.1-3 (employee stealing data → Insider threat)
//   - mc-2.1.1-5 (financial gain → Cybercriminal)
//
// 1 multi-pad:
//   - mc-2.1.1-6  Insider-distinguishing-trait — distractors describe insider attributes,
//                 not category names; balancing pads required.
//
// Watchpoints respected:
//   - Threat actor categories: nation-state / organized crime / hacktivist / insider threat /
//     unskilled attacker — distinct motivations and capabilities preserved. APT used as
//     synonym for nation-state per Messer convention.
//   - No invented APT-group names (Cozy Bear/Lazarus etc. are real and not used here)
//   - Plausible-AND-false rule: distractors describe traits that real but distinct actor
//     types might display, never traits that genuinely DO distinguish insiders.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2.1-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // mc-2.1.1-0 to mc-2.1.1-5 — all Convention B holdbacks (threat-actor category names).
  {
    videoId: "2.1.1", kind: "mc", index: 6,
    expectedOldStemPrefix: "What most distinguishes an insider threat from external attackers",
    intensity: "multi-pad",
    newOpts: [
      "High technical skill level beyond what most external attackers can match",                       // 73
      "Legitimate existing access to systems and data",                                                  // ✓ 46
      "Financial motivation as the dominant driver behind their attacks",                               // 64
      "Exclusive use of zero-day exploits provided by nation-state sponsors",                            // 70
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

console.log(`\n§2.1 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length} (5 holdbacks excluded)`);
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
