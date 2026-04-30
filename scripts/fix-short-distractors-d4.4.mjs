// Sub-batch 2 mega-pass — §4.4 cohort (Security Monitoring/Tools): 6 cohort items, 6 modified.
//
// 0 Convention B holdbacks.
//
// 2 rebuild:
//   - mc-4.4.1-1  NetFlow vs PCAP
//   - mc-4.4.2-2  FIM detects (correct intrinsically short — distractors padded)
//
// 2 multi-pad:
//   - mc-4.4.2-0  EDR vs traditional AV
//   - mc-4.4.2-1  XDR
//
// 2 simple-pad:
//   - mc-4.4.1-0  SIEM primary function
//   - mc-4.4.1-2  SOAR
//
// Watchpoints respected:
//   - SIEM = aggregate + correlate (doesn't auto-respond); SOAR = automated response
//     playbooks; XDR = cross-layer (endpoint + network + cloud + email); EDR = endpoint
//     only.
//   - Traditional AV (signature) vs NGAV (behavioral) vs EDR (continuous behavioral +
//     investigation + response) — distinct.
//   - NetFlow = metadata only (5-tuple summary); PCAP = full packet capture.
//   - FIM (file integrity monitoring) detects file changes via hashing — not network
//     intrusions, not password attacks, not data movement (DLP territory).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.4-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.4.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "A SIEM provides which primary security function",
    intensity: "simple-pad",
    newOpts: [
      "Encrypts every captured log entry at rest using a per-tenant data encryption key",                    // 84
      "Automatically patches vulnerable systems based on its own correlated detection rules",                 // 87
      "Aggregates and correlates logs from across the environment to detect threats and enable investigation",  // ✓ 101
      "Blocks malicious traffic at the network level by injecting reset packets on session matches",          // 95
    ],
  },
  {
    videoId: "4.4.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "NetFlow differs from PCAP in that",
    intensity: "rebuild",
    newOpts: [
      "NetFlow provides traffic metadata without packet content; PCAP captures full packet contents",         // ✓ 92
      "NetFlow is more detailed than PCAP because it records every byte of the application payload",          // 93
      "NetFlow requires more storage than PCAP because metadata duplicates payload size on disk",             // 90
      "PCAP is faster to analyze at scale than NetFlow because metadata aggregation slows query times",       // 94
    ],
  },
  {
    videoId: "4.4.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "SOAR improves security operations by",
    intensity: "simple-pad",
    newOpts: [
      "Replacing human analysts entirely with autonomous agents that handle every alert without review",      // 95
      "Scanning for vulnerabilities by combining authenticated and unauthenticated checks across endpoints",  // 99
      "Blocking all threats automatically by injecting firewall denies for every alert that fires",            // 91
      "Automating repetitive response tasks and integrating disparate security tools — freeing analysts for complex investigation",  // ✓ 122
    ],
  },
  {
    videoId: "4.4.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "EDR differs from traditional antivirus in that",
    intensity: "multi-pad",
    newOpts: [
      "EDR only detects known malware via the same signature database that traditional AV uses",              // 91
      "EDR is only deployed on servers and offers no agent for endpoint workstations or laptops",              // 91
      "EDR provides continuous behavioral monitoring, investigation capability, and active response — not just signature-based detection",  // ✓ 129
      "EDR requires no management overhead because behavioral models are tuned automatically by the vendor",   // 99
    ],
  },
  {
    videoId: "4.4.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "XDR expands on EDR by",
    intensity: "multi-pad",
    newOpts: [
      "Providing better endpoint protection only with no expansion beyond the host where the agent runs",     // 95
      "Integrating detection across multiple layers — endpoint, network, cloud, and email — into a single unified platform",  // ✓ 115
      "Replacing SIEM entirely so the organization no longer needs centralized log aggregation",              // 88
      "Focusing exclusively on mobile device telemetry from MDM-enrolled phones and tablets only",            // 86
    ],
  },
  {
    videoId: "4.4.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "File Integrity Monitoring (FIM) is used to detect",
    intensity: "rebuild",
    newOpts: [
      "Network intrusions identified by signature matches at the perimeter firewall stack",                   // 81
      "Unauthorized modifications to critical system files",                                                   // ✓ 51
      "Password attacks against domain accounts identified by failed-logon-burst patterns",                    // 84
      "Data exfiltration over outbound TLS sessions to attacker-controlled cloud storage",                     // 81
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

console.log(`\n§4.4 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
