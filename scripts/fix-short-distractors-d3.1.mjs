// Sub-batch 2 mega-pass — §3.1 cohort (Cloud / Network / Infra Considerations): 8 cohort items, 7 modified.
//
// 1 Convention B holdback:
//   - mc-3.1.1-1 (cloud service model recall: IaaS / PaaS / SaaS / On-premises) —
//     core deployment-model term recall.
//
// 1 rebuild:
//   - mc-3.1.2-1  Microsegmentation
//
// 4 multi-pad:
//   - mc-3.1.1-0  IaaS responsibility
//   - mc-3.1.1-3  Hybrid cloud security
//   - mc-3.1.4-0  RTO definition
//   - mc-3.1.4-1  RPO definition
//
// 2 simple-pad:
//   - mc-3.1.2-0  East-west traffic security
//   - mc-3.1.3-1  ICS/SCADA priorities
//
// Watchpoints respected:
//   - IaaS / PaaS / SaaS shared-responsibility models distinct: provider manages physical
//     and virtualization in IaaS; provider also manages OS/runtime in PaaS; provider
//     manages everything in SaaS.
//   - Public/private/hybrid/community cloud — distinct deployment models preserved.
//   - North-south = perimeter; east-west = lateral movement. Microsegmentation addresses
//     east-west specifically.
//   - ICS/SCADA = OT priorities (availability/safety > confidentiality), patch windows
//     can require facility shutdown.
//   - RTO = recovery TIME (how fast); RPO = recovery POINT (how much data loss). Don't
//     conflate.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d3.1-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "3.1.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "In the IaaS cloud model, the customer is responsible for",
    intensity: "multi-pad",
    newOpts: [
      "Physical hardware security and hypervisor patching at the cloud provider's data centers",         // 89
      "Nothing — the provider handles all security including OS patching and application logic",         // 90
      "Only the application data while the provider patches the OS and runtime layers",                   // 80
      "The operating system, applications, and data",                                                     // ✓ 44
    ],
  },
  // mc-3.1.1-1 — Convention B holdback (IaaS / PaaS / SaaS / On-premises model recall).
  {
    videoId: "3.1.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "A hybrid cloud architecture introduces which unique security challenge",
    intensity: "multi-pad",
    newOpts: [
      "Securing data and consistent policy enforcement across both private and public cloud environments",  // ✓ 97
      "Lack of encryption support — hybrid clouds cannot use TLS for data in transit between sites",         // 91
      "No access control options exist when private and public infrastructure coexist together",            // 89
      "Physical security of data centers fully shifts to the customer once any public cloud is involved",   // 96
    ],
  },
  {
    videoId: "3.1.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "East-west traffic security is important because",
    intensity: "simple-pad",
    newOpts: [
      "Attackers who breach the perimeter use lateral movement — traditional perimeter firewalls don't inspect internal traffic",  // ✓ 120
      "It is always encrypted by default and so requires no additional inspection or controls",                                     // 88
      "It travels faster than north-south traffic and overwhelms inspection appliance throughput",                                  // 91
      "It never contains sensitive data because internal applications scrub all PII at egress",                                     // 89
    ],
  },
  {
    videoId: "3.1.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "Microsegmentation addresses which limitation of traditional network security",
    intensity: "rebuild",
    newOpts: [
      "Perimeter-only security that leaves internal east-west traffic uninspected — enabling attacker lateral movement",  // ✓ 111
      "Lack of encryption at the network layer between traditional segmented zones in production",                          // 91
      "High cost of dedicated network appliance hardware in legacy three-tier architectures",                              // 84
      "Lack of user authentication on internal applications behind the corporate network firewall",                          // 92
    ],
  },
  {
    videoId: "3.1.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "ICS/SCADA systems have different security priorities than traditional IT because",
    intensity: "simple-pad",
    newOpts: [
      "Availability is the top priority — downtime in industrial control systems can have physical, safety, or economic consequences",  // ✓ 125
      "They use stronger encryption than IT systems by default for all process control data",                                            // 86
      "They are never connected to networks and remain physically air-gapped from corporate IT",                                          // 89
      "They only process non-sensitive data so confidentiality is never a meaningful concern",                                            // 86
    ],
  },
  {
    videoId: "3.1.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "RTO (Recovery Time Objective) defines",
    intensity: "multi-pad",
    newOpts: [
      "How much data the organization can afford to lose measured in time elapsed since the last backup",  // 95
      "The maximum acceptable time to restore a system or service after a failure or disaster",            // ✓ 86
      "How often backup jobs should run against a tier of business-critical production data",              // 84
      "The average time between system failures of a given component or subsystem",                         // 75
    ],
  },
  {
    videoId: "3.1.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "RPO (Recovery Point Objective) defines",
    intensity: "multi-pad",
    newOpts: [
      "How quickly systems must be restored after a failure or disaster strikes the data center",           // 88
      "The target uptime percentage that the SLA commits to over a calendar month",                         // 75
      "The maximum acceptable amount of data loss measured in time — determining backup frequency",         // ✓ 90
      "The time required to detect a failure has occurred before recovery efforts begin",                    // 81
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

console.log(`\n§3.1 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
