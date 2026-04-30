// Sub-batch 2 mega-pass — §2.5 cohort (Mitigation/Hardening): 5 cohort items, 4 modified.
//
// 1 Convention B holdback:
//   - mc-2.5.2-0 (mitigation-technique recall: Encryption / Patching / Network segmentation /
//     MFA — control category names; same Convention B reasoning as CIA components).
//
// 2 rebuild (3-short distractors each):
//   - mc-2.5.1-1  DMZ purpose
//   - mc-2.5.3-2  Secure Boot mitigates
//
// 1 multi-pad (2-short distractors):
//   - mc-2.5.2-1  Least privilege definition
//
// 1 simple-pad (1-short distractor):
//   - mc-2.5.3-0  System hardening BEST description
//
// Watchpoints respected:
//   - Mitigation categories: encryption / patching / segmentation / MFA / least privilege /
//     hardening — distinct preserved.
//   - Bootkit/rootkit boot-process attack vector preserved (Secure Boot scope).
//   - DMZ described as isolated public-facing segment (canonical Messer framing); not
//     conflated with screened subnet, jump host, or bastion.
//   - Plausible-AND-false rule: distractors describe real-but-different controls
//     (encryption vs DMZ, IDS vs DMZ, backup vault vs DMZ) — never a real DMZ purpose.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2.5-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // mc-2.5.2-0 — Convention B holdback (Encryption / Patching / Network segmentation / MFA).

  {
    videoId: "2.5.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "A DMZ (Demilitarized Zone) is used to",
    intensity: "rebuild",
    newOpts: [
      "Host public-facing servers in an isolated segment between the internet and internal network",     // ✓ 91
      "Encrypt all internal east-west traffic between segmented production and management subnets",      // 91
      "Store offline disaster-recovery backups in an isolated VLAN protected from production access",    // 92
      "Monitor all internal network traffic from a passive sensor mirroring switchport SPAN data",       // 89
    ],
  },
  {
    videoId: "2.5.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "Least privilege as a mitigation technique means",
    intensity: "multi-pad",
    newOpts: [
      "Granting users and processes only the minimum access necessary to perform their functions — nothing more",    // ✓ 104
      "Removing all user accounts except administrators — reducing the number of credential-bearing identities",    // 105
      "Requiring MFA for every operation — strengthening the trust placed on existing user permissions",             // 95
      "Encrypting all user data at rest with role-based key wrapping for confidentiality",                            // 81
    ],
  },
  {
    videoId: "2.5.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "System hardening is BEST described as",
    intensity: "simple-pad",
    newOpts: [
      "Installing the latest endpoint malware protection on every system before deployment",                          // 84
      "Reducing a system's attack surface by removing unnecessary features, services, accounts, and access",          // ✓ 99
      "Encrypting all system data at rest with full-disk encryption tied to a TPM key",                                // 78
      "Monitoring system logs for anomalies and forwarding suspicious events to the SIEM",                              // 81
    ],
  },
  {
    videoId: "2.5.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "Secure Boot mitigates which type of attack",
    intensity: "rebuild",
    newOpts: [
      "Application-layer SQL injection attacks targeting database parameter handling at runtime",                      // 92
      "Password spraying attacks that test one common password against many user accounts",                            // 84
      "Bootkit/rootkit attacks that modify the boot process before the OS loads",                                       // ✓ 72
      "Volumetric DDoS attacks that saturate the network edge with reflected UDP traffic",                              // 82
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

console.log(`\n§2.5 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
