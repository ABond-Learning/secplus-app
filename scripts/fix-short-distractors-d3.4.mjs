// Sub-batch 2 mega-pass — §3.4 cohort (Resilience): 11 cohort items, 9 modified.
//
// 2 Convention B holdbacks:
//   - mc-3.4.4-0 (backup-type recall: Incremental / Full / Differential / Snapshot)
//   - mc-3.4.4-1 (slowest restore — same backup-type term recall)
//
// 1 rebuild:
//   - mc-3.4.1-2  Geographic dispersal protects against
//   - mc-3.4.5-2  Dual power feeds (correct option short — distractors padded with longer
//                 power-failure-mode misconceptions)
//
// 4 multi-pad:
//   - mc-3.4.1-0  Hot vs warm site
//   - mc-3.4.2-0  Capacity planning
//   - mc-3.4.5-1  2N power configuration (correct intrinsically short — Convention B candidate
//                 but we extend distractors slightly for plausible misconceptions)
//
// 4 simple-pad:
//   - mc-3.4.3-0  Tabletop vs full interruption
//   - mc-3.4.3-1  Full interruption realism
//   - mc-3.4.4-4  Backup test importance
//   - mc-3.4.5-0  UPS purpose
//
// Watchpoints respected:
//   - Hot/warm/cold sites distinct — hot fully equipped+operational, warm needs config,
//     cold has space+power only.
//   - Backup types: full / incremental (since last backup) / differential (since last full)
//     / snapshot (point-in-time copy) — distinct.
//   - RAID levels protect against disk failure but NOT against ransomware or accidental
//     deletion (different protection scope).
//   - UPS bridges power-failure → generator-startup gap (typically minutes).
//   - 2N = double everything; N+1 = one extra; 2N+1 = double + one extra.
//   - Tabletop (talk-through) vs walkthrough (in-place review) vs simulation (test in
//     parallel) vs full interruption (actually fail over) — distinct fidelity tiers.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d3.4-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "3.4.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "A hot site differs from a warm site in that",
    intensity: "multi-pad",
    newOpts: [
      "A hot site is fully equipped and immediately operational — a warm site requires some configuration before use",  // ✓ 109
      "Hot sites use better hardware than warm sites because the workload demands more compute capacity",                  // 96
      "Hot sites are cheaper to maintain because automation reduces the staffing footprint required",                       // 90
      "A warm site has more bandwidth than a hot site because it carries replication traffic continuously",                 // 96
    ],
  },
  {
    videoId: "3.4.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Geographic dispersal of data center resources protects against",
    intensity: "rebuild",
    newOpts: [
      "Individual hardware failures inside a single rack within one data center facility",                                  // 81
      "Software vulnerabilities introduced by an unpatched application stack across all hosts",                              // 88
      "Network-level attacks targeting public-facing application services at the perimeter",                                  // 86
      "Site-level disasters (fire, flood, power outage) that could destroy a single location",                                // ✓ 85
    ],
  },
  {
    videoId: "3.4.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "Capacity planning in security context addresses",
    intensity: "multi-pad",
    newOpts: [
      "Ensuring sufficient people, technology, and infrastructure resources to maintain security operations under normal and peak load",  // ✓ 127
      "Only server hardware requirements forecasted from projected growth in compute workloads",                                            // 90
      "Only budget planning for next year's security tooling and staffing line items",                                                       // 80
      "Only network bandwidth forecasting for production WAN links between data centers",                                                    // 81
    ],
  },
  {
    videoId: "3.4.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "A tabletop exercise differs from a full interruption test in that",
    intensity: "simple-pad",
    newOpts: [
      "Tabletop tests use real systems and require failover of production traffic to recovery",                              // 89
      "Full interruption tests are cheaper and lower risk than tabletop discussions are by far",                              // 87
      "A tabletop exercise is discussion-based — no actual systems are involved or tested",                                    // ✓ 82
      "They test different scenarios with no overlap in the threats or failures they address",                                  // 86
    ],
  },
  {
    videoId: "3.4.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "A full interruption test is the MOST realistic DR test because",
    intensity: "simple-pad",
    newOpts: [
      "It uses the most complex scenarios that include compounding failures and cyber incidents",                            // 92
      "Production actually fails over to recovery systems — revealing real-world issues that tabletop or parallel tests miss",  // ✓ 117
      "It involves the most people because the entire IT organization must be physically on-site",                              // 92
      "It tests only network connectivity between primary and secondary sites at the WAN edge",                                  // 86
    ],
  },
  // mc-3.4.4-0 / mc-3.4.4-1 — Convention B holdbacks (backup-type term recall).
  {
    videoId: "3.4.4", kind: "mc", index: 4,
    expectedOldStemPrefix: "An organization discovers their backup files are corrupted when they try to restore",
    intensity: "simple-pad",
    newOpts: [
      "More frequent backups so the recovery point objective is much shorter than today",                                    // 81
      "Regularly testing backups by actually restoring them — an untested backup provides false confidence",                  // ✓ 99
      "Using a different backup software vendor that offers better hardware sensor monitoring",                                // 88
      "Storing backups on faster media to reduce the duration of any future restore window",                                    // 84
    ],
  },
  {
    videoId: "3.4.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "The primary purpose of a UPS in a data center is",
    intensity: "simple-pad",
    newOpts: [
      "Providing power for extended outages lasting many hours when no generator is available",                              // 87
      "Regulating voltage during normal operation by smoothing the AC waveform on the utility feed",                          // 91
      "Providing immediate battery power to bridge the gap between power failure and generator startup",                      // ✓ 95
      "Distributing rack PDUs across redundant power paths inside each cabinet for cabling neatness",                          // 93
    ],
  },
  {
    videoId: "3.4.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "2N power configuration means",
    intensity: "multi-pad",
    newOpts: [
      "Two UPS units installed in series so a single failure trips the next downstream battery",                              // 87
      "Two backup generators sharing a common load bus with manual transfer between them",                                    // 80
      "Power from two utility providers feeding the same single power distribution path",                                      // 80
      "A completely redundant power system",                                                                                  // ✓ 35
    ],
  },
  {
    videoId: "3.4.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "Dual power feeds for critical servers protect against",
    intensity: "rebuild",
    newOpts: [
      "Power surges from utility provider lightning strikes during summer thunderstorm seasons",                              // 88
      "Single power circuit failure",                                                                                          // ✓ 28
      "Generator failure when the primary diesel generator's fuel pump seizes during operation",                                // 90
      "UPS battery depletion during multi-hour utility outages exceeding the runtime budget",                                   // 85
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
    console.error(`  current correct: "${currentCorrect}"`);
    refused++; continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\n§3.4 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length} (2 holdbacks excluded)`);
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
