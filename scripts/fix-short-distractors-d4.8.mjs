// Sub-batch 2 mega-pass — §4.8 cohort (Incident Response): 8 cohort items, 7 modified.
//
// 1 Convention B holdback:
//   - mc-4.8.1-0 (NIST IR phase recall: Detection-and-Analysis / Containment / Eradication
//     / Recovery — IR-phase term recall)
//
// 0 rebuild.
//
// 4 multi-pad:
//   - mc-4.8.1-1  containment purpose
//   - mc-4.8.2-0  RCA purpose
//   - mc-4.8.3-1  chain of custody
//   - mc-4.8.3-2  write blocker
//
// 3 simple-pad:
//   - mc-4.8.1-2  evidence preservation
//   - mc-4.8.1-3  post-incident lessons
//   - mc-4.8.2-1  DRP/BCP
//
// Watchpoints respected:
//   - NIST IR phases: Preparation / Detection-and-Analysis / Containment-Eradication-Recovery /
//     Post-Incident — distinct.
//   - DRP (tactical IT recovery) is subset of BCP (strategic business continuity).
//   - Forensics (evidence preservation) vs IR (restore service) — distinct goals.
//   - Chain of custody: every handler documented; legally admissible only if unbroken.
//   - Write blocker: prevents accidental drive modification during imaging — only one
//     correct purpose.
//   - Order of volatility: registers/cache → memory → temp files → disk → archives.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.8-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // mc-4.8.1-0 — Convention B holdback (Eradication / Containment / Detection-and-Analysis / Recovery — IR-phase recall).
  {
    videoId: "4.8.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "The purpose of the containment phase is to",
    intensity: "multi-pad",
    newOpts: [
      "Identify who conducted the attack by correlating IOCs with known threat-actor TTPs",                 // 86
      "Restore systems to production immediately so business operations continue without interruption",     // 95
      "Stop the spread of the incident to other systems while investigation continues",                       // ✓ 78
      "Document lessons learned and brief stakeholders on the response so playbooks improve over time",       // 95
    ],
  },
  {
    videoId: "4.8.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Evidence preservation during incident response requires",
    intensity: "simple-pad",
    newOpts: [
      "Immediately reformatting compromised systems so the malware persistence path is destroyed",          // 92
      "Capturing memory dumps and forensic images BEFORE remediation — preserving evidence for investigation and potential legal action",  // ✓ 128
      "Deleting all malware binaries immediately so the attacker can no longer use them on the host",         // 95
      "Notifying all users that an incident has occurred and is being remediated by the SOC team",            // 91
    ],
  },
  {
    videoId: "4.8.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "Post-incident activity (lessons learned) is important because",
    intensity: "simple-pad",
    newOpts: [
      "It satisfies legal requirements only with no operational benefit beyond regulatory paperwork",        // 93
      "It closes the incident ticket so the SOC dashboard returns to a green-status overview",                // 89
      "It assigns blame to responsible parties so consequences can be applied during the next review cycle",  // 100
      "It identifies what worked and what failed — improving the IR plan, controls, and defenses to reduce impact of future incidents",  // ✓ 126
    ],
  },
  {
    videoId: "4.8.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "Root cause analysis (RCA) after an incident is used to",
    intensity: "multi-pad",
    newOpts: [
      "Identify the fundamental cause of the incident to prevent recurrence — not just treat the symptom",  // ✓ 97
      "Assign blame to the responsible individuals so consequences are applied during quarterly reviews",    // 96
      "Calculate financial losses by aggregating downtime cost across all affected revenue streams",         // 91
      "Complete the incident report by adding final timeline timestamps and ticket close-out fields",         // 92
    ],
  },
  {
    videoId: "4.8.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "A DRP (Disaster Recovery Plan) is a subset of BCP because",
    intensity: "simple-pad",
    newOpts: [
      "DRP specifically covers IT system recovery",                                                          // ✓ 42
      "DRP covers all business functions including HR, facilities, communications, and supply chain",        // 92
      "BCP is only for large organizations with multi-site footprints and dedicated continuity teams",        // 92
      "They are the same plan with different titles used by different industry verticals interchangeably",   // 99
    ],
  },
  {
    videoId: "4.8.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Chain of custody is required to",
    intensity: "multi-pad",
    newOpts: [
      "Speed up the investigation by allowing forensic analysts to skip image-verification steps",          // 91
      "Prevent unauthorized access to evidence by restricting the lab to forensic-team members only",       // 93
      "Store evidence securely in a sealed cabinet inside a locked forensic lab on the corporate site",      // 92
      "Document every person who handled the evidence and how — ensuring it's admissible in court and hasn't been tampered with",  // ✓ 120
    ],
  },
  {
    videoId: "4.8.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "A write blocker is used to",
    intensity: "multi-pad",
    newOpts: [
      "Block write permissions for suspects on their workstation accounts during an active investigation",  // 99
      "Speed up the imaging process by parallelizing reads across multiple SATA channels at once",            // 90
      "Encrypt the evidence drive with a forensic-team-owned key during imaging to prevent leaks",            // 91
      "Prevent any writes to the evidence drive during imaging — preserving the original state and maintaining integrity",  // ✓ 113
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

console.log(`\n§4.8 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
