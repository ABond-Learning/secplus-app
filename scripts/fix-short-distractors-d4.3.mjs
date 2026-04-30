// Sub-batch 2 mega-pass — §4.3 cohort (Vulnerability Management): 8 cohort items, 7 modified.
//
// 1 Convention B holdback:
//   - mc-4.3.4-1 (CVSS severity recall: Low / Medium / High / Critical — severity-bucket
//     term recall).
//
// 1 rebuild:
//   - mc-4.3.4-2  EPSS
//
// 1 multi-pad:
//   - mc-4.3.1-0  credentialed scan
//   - mc-4.3.2-0  OSINT
//
// 4 simple-pad:
//   - mc-4.3.3-1  RoE
//   - mc-4.3.5-0  post-patch validation
//   - mc-4.3.5-1  formal risk acceptance
//   - mc-4.3.5-2  unpatchable critical system
//
// Watchpoints respected:
//   - CVSS scoring: Base / Temporal / Environmental — distinct vectors.
//   - CVSS bands: 0.1-3.9 Low / 4.0-6.9 Medium / 7.0-8.9 High / 9.0-10.0 Critical.
//   - EPSS = exploitation probability (complements CVSS severity).
//   - Credentialed vs non-credentialed scans (visibility into local config vs external view).
//   - Active vs passive scanning distinct.
//   - OSINT = openly available; threat intel feeds, dark web, classified are distinct sources.
//   - Risk treatments: accept/avoid/transfer/mitigate — distinct.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.3-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.3.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "A credentialed vulnerability scan provides more accurate results because",
    intensity: "multi-pad",
    newOpts: [
      "It scans more IP addresses across the corporate range than a non-credentialed scan does",             // 90
      "It uses more attack signatures from the vendor's premium signature feed library",                      // 80
      "The scanner authenticates to systems",                                                                  // ✓ 36
      "It runs faster because cached fingerprint data avoids the need for service interrogation",            // 90
    ],
  },
  {
    videoId: "4.3.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "OSINT (Open Source Intelligence) uses",
    intensity: "multi-pad",
    newOpts: [
      "Classified government intelligence reports shared through cleared partner channels only",             // 88
      "Publicly available sources including news sites, social media, vulnerability databases, and public forums",  // ✓ 105
      "Only commercial threat feeds purchased from vendors with paid signature subscriptions",                // 88
      "Only dark web sources accessed through a Tor exit node from a cleanroom workstation",                  // 84
    ],
  },
  {
    videoId: "4.3.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Rules of Engagement (RoE) define",
    intensity: "simple-pad",
    newOpts: [
      "The scope, timing, permitted techniques, and off-limits systems — legally protecting both tester and organization",  // ✓ 113
      "The payment terms for the test engagement including hourly rate and final report deliverables",                       // 95
      "The reporting format including required sections, risk-rating taxonomy, and executive summary length",                 // 99
      "The vulnerabilities to be found before the test starts so that scope is locked down at outset",                         // 92
    ],
  },
  // mc-4.3.4-1 — Convention B holdback (CVSS severity-band recall).
  {
    videoId: "4.3.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "EPSS improves vulnerability prioritization by",
    intensity: "rebuild",
    newOpts: [
      "Adding the probability that a vulnerability will be actively exploited in the wild — helping focus on likely real-world threats",  // ✓ 127
      "Replacing CVSS as the primary scoring framework used by every vulnerability scanner output",                                          // 90
      "Automating patch deployment timelines based on the predicted exploitation probability score",                                          // 92
      "Calculating the expected financial impact of each unpatched vulnerability per asset class",                                            // 91
    ],
  },
  {
    videoId: "4.3.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "After applying a patch for a critical vulnerability, the next step should be",
    intensity: "simple-pad",
    newOpts: [
      "Validate the remediation — rescan or retest to confirm the vulnerability is actually fixed",         // ✓ 90
      "Mark the vulnerability as closed immediately because the vendor patch installed without errors",    // 95
      "Apply the same patch to all other systems immediately without testing in a staging environment",     // 92
      "Report to management with a brief description of the patch deployment and an SLA confirmation",      // 91
    ],
  },
  {
    videoId: "4.3.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "Formally accepting a vulnerability risk requires",
    intensity: "simple-pad",
    newOpts: [
      "No documentation — risk acceptance is purely a verbal decision once an engineer chooses to accept",  // 96
      "Purchasing cyber insurance with a coverage limit appropriate for the worst-case incident",            // 89
      "Immediate notification to regulators including the CVE identifier and the affected asset list",      // 92
      "Management sign-off, documentation of the risk accepted, and a plan for periodic review",             // ✓ 87
    ],
  },
  {
    videoId: "4.3.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "Which remediation approach would an organization use if a critical system cannot be patched",
    intensity: "simple-pad",
    newOpts: [
      "Apply compensating controls (network segmentation, WAF, enhanced monitoring) while scheduling maintenance for patching",  // ✓ 118
      "Accept unlimited risk and document the decision in a one-line note in the risk register only",                              // 92
      "Immediately shut down the system permanently regardless of business operational requirements",                                // 91
      "Remove the system from the network permanently and rebuild every dependent integration from scratch",                          // 96
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

console.log(`\n§4.3 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length} (1 holdback excluded)`);
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
