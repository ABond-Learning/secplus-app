// Sub-batch 2 mega-pass — §5.2 cohort (Risk Management): 8 cohort items, 8 modified.
//
// 0 Convention B holdbacks.
//
// 1 rebuild:
//   - mc-5.2.1-1  Inherent vs residual risk
//
// 3 multi-pad:
//   - mc-5.2.3-1  Risk transference
//   - mc-5.2.4-0  BIA purpose
//   - mc-5.2.4-2  MTBF definition
//
// 4 simple-pad:
//   - mc-5.2.1-0  Residual risk
//   - mc-5.2.2-1  ALE
//   - mc-5.2.3-2  Risk acceptance
//   - mc-5.2.4-1  RPO 4 hours implication
//
// Watchpoints respected:
//   - Risk treatments: accept / avoid / transfer / mitigate — distinct.
//   - Quantitative metrics: SLE = single-loss expectancy; ARO = annualized rate of
//     occurrence; ALE = SLE × ARO; EF = exposure factor — distinct.
//   - Qualitative analysis uses high/med/low ratings, not dollar figures.
//   - MTBF (mean time between failures, reliability) vs MTTR (mean time to repair,
//     recoverability) — distinct.
//   - Inherent (no controls) vs residual (after controls) — controls reduce inherent
//     to residual; residual ≠ zero.
//   - BIA = identifies critical functions, quantifies disruption impact, sets RTO/RPO.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d5.2-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "5.2.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "Residual risk is",
    intensity: "simple-pad",
    newOpts: [
      "The risk remaining after security controls have been implemented — some residual risk is always present",  // ✓ 103
      "The total risk that exists before any security controls or mitigations are applied",                          // 84
      "The risk that the deployed controls themselves fail unexpectedly during routine operation",                    // 95
      "Risk that arises only from external threats and excludes any internal employee or process risks",              // 97
    ],
  },
  {
    videoId: "5.2.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Inherent risk differs from residual risk in that",
    intensity: "rebuild",
    newOpts: [
      "They are the same measurement of risk reported through two different terminology conventions",            // 95
      "Inherent risk exists before any controls; residual risk remains after controls are applied",                // ✓ 90
      "Inherent risk is always lower than residual risk because raw risk excludes amplification factors",          // 99
      "Residual risk is always zero in any organization that has implemented a recognized control framework",      // 102
    ],
  },
  {
    videoId: "5.2.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "ALE (Annualized Loss Expectancy) is used to",
    intensity: "simple-pad",
    newOpts: [
      "Calculate the maximum possible loss in any single worst-case incident regardless of frequency",            // 96
      "Calculate exposure factor as a percentage representing how much an asset's value is destroyed per event",  // 109
      "Determine how often incidents occur within a calendar year by averaging historical frequency data",         // 100
      "Justify security investments by comparing the annual cost of a control against the expected annual loss it prevents",  // ✓ 115
    ],
  },
  {
    videoId: "5.2.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Risk transference via cyber insurance",
    intensity: "multi-pad",
    newOpts: [
      "Eliminates the risk entirely so the underlying technical vulnerabilities no longer require remediation",       // 103
      "Reduces the likelihood of a security incident by deterring attackers who learn coverage exists",                 // 95
      "Shifts the financial impact of a breach to the insurer — the technical risk remains",                              // ✓ 83
      "Prevents all cyberattacks by triggering automatic insurer-sourced investigation and incident response",            // 100
    ],
  },
  {
    videoId: "5.2.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "Risk acceptance requires",
    intensity: "simple-pad",
    newOpts: [
      "No documentation — risk acceptance is purely a verbal decision that engineering teams make ad hoc",            // 99
      "Implementing at least one compensating control before formally accepting the residual exposure",                 // 95
      "Formal written documentation and sign-off from an appropriate level of management — it is a conscious business decision",  // ✓ 119
      "Regulatory notification of the supervisory authority before the acceptance becomes legally binding",              // 99
    ],
  },
  {
    videoId: "5.2.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "A BIA (Business Impact Analysis) is used to",
    intensity: "multi-pad",
    newOpts: [
      "Identify vulnerabilities in IT systems by running authenticated network and application scans",                // 95
      "Determine which business functions are critical, quantify the impact of their disruption, and establish recovery priorities",  // ✓ 123
      "Conduct external penetration testing of the organization's perimeter at the start of every fiscal year",          // 100
      "Develop and ratify the corporate security policies that define acceptable use and access scope",                  // 95
    ],
  },
  {
    videoId: "5.2.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "If a system has an RPO of 4 hours, the organization must",
    intensity: "simple-pad",
    newOpts: [
      "Back up data at least every 4 hours — ensuring no more than 4 hours of data could be lost in an incident",      // ✓ 104
      "Not experience more than 4 hours of downtime in any single failure or rolling outage event",                      // 92
      "Restore the system within 4 hours of a failure regardless of how much data has been lost",                          // 92
      "Keep the system running 24/7 without ever incurring planned maintenance windows or change events",                  // 98
    ],
  },
  {
    videoId: "5.2.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "MTBF (Mean Time Between Failures) is a reliability metric meaning",
    intensity: "multi-pad",
    newOpts: [
      "The time required to recover and restore service after a single failure event",                                  // 78
      "The frequency at which scheduled maintenance is performed against the component over its life",                   // 96
      "The average time a component operates successfully between failures — higher MTBF = more reliable",                  // ✓ 97
      "The acquisition cost incurred each time a single component instance fails and must be replaced",                     // 96
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

console.log(`\n§5.2 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length} (0 holdbacks)`);
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
