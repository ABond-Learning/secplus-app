// Sub-batch 2 mega-pass — §3.2 cohort (Network Security Concepts): 12 cohort items, 11 modified.
//
// 1 Convention B holdback:
//   - mc-3.2.4-1 (802.1X supplicant role recall: RADIUS server / network switch /
//     client device / firewall) — 802.1X role-name term recall.
//
// 1 rebuild:
//   - mc-3.2.6-3  IPsec modes
//
// 7 multi-pad / rebuild-at-cohort-cap:
//   - mc-3.2.1-1  fail-closed
//   - mc-3.2.1-2  attack surface reduction
//   - mc-3.2.3-2  NGFW vs stateful
//   - mc-3.2.4-0  IEEE 802.1X (correct option short — distractors padded with longer 802.1X-context misconceptions)
//   - mc-3.2.4-2  MAC filtering weakness
//   - mc-3.2.5-1  WAF (DUPLICATE of §4.5 mc-4.5.1-2 — distractors authored independently to avoid recycling; logged in TODO)
//
// 3 simple-pad:
//   - mc-3.2.2-2  IPS false negative vs false positive
//   - mc-3.2.3-1  data diode
//   - mc-3.2.5-0  stateful firewall
//   - mc-3.2.6-1  SASE
//
// Watchpoints respected:
//   - NGFW vs stateful firewall vs WAF distinct: NGFW = app-aware + IPS + identity;
//     stateful = TCP session tracking; WAF = HTTP/HTTPS app-layer.
//   - Data diode = one-way physical hardware flow (used in OT/critical), not a software
//     enforcement.
//   - 802.1X roles: supplicant (client) / authenticator (switch/AP) / authentication
//     server (RADIUS) — preserved.
//   - SASE = cloud-converged net+sec; CASB / SWG / ZTNA / FWaaS are sub-components.
//   - IPsec tunnel mode (entire packet) vs transport mode (payload only) — only correct
//     IPsec mode pair; do not invent active/passive, sym/asym, or client/server modes.
//
// Cross-script recycling notes:
//   - mc-3.2.5-1 WAF stem is a DUPLICATE of §4.5 mc-4.5.1-2 (already shipped in d4.5).
//     This script's distractors deliberately do NOT recycle the §4.5 distractors —
//     §4.5 used "Network-layer DDoS / Physical USB bootkit / Wireless WPA2 handshake".
//     §3.2 uses different prose ("Layer 3 IP spoofing / Layer 2 ARP poisoning / Insider
//     USB exfiltration") so the two duplicate stems still feel distinct in randomized
//     quizzes. The duplication itself is logged for content-quality follow-up.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d3.2-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "3.2.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "A fail-closed (fail-secure) security device",
    intensity: "multi-pad",
    newOpts: [
      "Continues to pass all traffic if it fails — prioritizing availability over the security function",   // 96
      "Alerts the security operations team but never blocks any traffic regardless of severity",            // 89
      "Blocks all traffic if the security function fails — prioritizing security over availability",        // ✓ 91
      "Fails to a half-open state where TCP handshakes complete but no data passes through",                 // 84
    ],
  },
  {
    videoId: "3.2.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Attack surface reduction involves",
    intensity: "multi-pad",
    newOpts: [
      "Adding more security monitoring tools so every event has multiple detection signals",                 // 87
      "Increasing system redundancy so a primary system failure has a hot standby waiting",                  // 87
      "Minimizing exposed services, components, and access points — anything not needed is removed or disabled",  // ✓ 103
      "Deploying more firewalls along every internal segment to inspect east-west traffic",                  // 84
    ],
  },
  {
    videoId: "3.2.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "A false negative in IPS is more concerning than a false positive because",
    intensity: "simple-pad",
    newOpts: [
      "A false negative means a real attack succeeded undetected — a false positive only blocks legitimate traffic",  // ✓ 107
      "False negatives are easier to fix once the SOC tunes the IPS signature feed monthly",                            // 86
      "False positives cause more financial damage when blocked legitimate traffic is business-critical",                // 95
      "They both have equal impact and consume comparable analyst time during alert triage",                              // 86
    ],
  },
  {
    videoId: "3.2.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "A data diode is used when",
    intensity: "simple-pad",
    newOpts: [
      "Data must only flow in one direction — preventing any return path that could be used for exfiltration or attack",  // ✓ 111
      "Bidirectional traffic is required between paired control-system endpoints with low latency budgets",                // 96
      "High-speed networking is required at line rate beyond what conventional firewalls can sustain",                      // 92
      "All traffic must be encrypted before crossing the security boundary, with key escrow",                                // 87
    ],
  },
  {
    videoId: "3.2.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "A Next-Generation Firewall (NGFW) differs from a traditional stateful firewall by",
    intensity: "multi-pad",
    newOpts: [
      "Being significantly faster but markedly less secure than the stateful firewall it replaces",          // 90
      "Adding application awareness, user identification, SSL inspection, and integrated IPS to traditional stateful inspection",  // ✓ 120
      "Using only signature-based detection without any session state tracking or anomaly checks",            // 89
      "Operating at Layer 2 only and so unable to enforce policy on routed network traffic",                  // 80
    ],
  },
  {
    videoId: "3.2.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "IEEE 802.1X is used for",
    intensity: "rebuild",
    newOpts: [
      "WPA2/WPA3 wireless encryption negotiation between client and access point",                          // 75
      "Port-based Network Access Control",                                                                  // ✓ 33
      "Centralized firewall rule management across distributed enterprise sites",                           // 73
      "VLAN configuration on managed enterprise switches and trunk ports",                                  // 65
    ],
  },
  // mc-3.2.4-1 — Convention B holdback (RADIUS server / switch / client / firewall — 802.1X role-name recall).
  {
    videoId: "3.2.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "MAC address filtering is considered a weak access control because",
    intensity: "multi-pad",
    newOpts: [
      "It requires 802.1X port-based authentication to function on the switch or access point",            // 88
      "MAC addresses can be easily viewed and spoofed — an attacker can clone a legitimate device's MAC address",  // ✓ 104
      "It only works on wireless networks and offers no protection against wired physical access",          // 90
      "It requires a dedicated RADIUS server which most small environments cannot deploy",                  // 81
    ],
  },
  {
    videoId: "3.2.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "A stateful firewall is more secure than a packet filtering firewall because",
    intensity: "simple-pad",
    newOpts: [
      "It uses stronger encryption algorithms when forwarding traffic between security zones",              // 86
      "It is faster than packet filtering at high traffic rates because of session caching",                 // 84
      "It inspects application-layer protocols including HTTP request methods and SQL parameters",          // 90
      "It tracks the state of network connections — blocking packets that don't belong to established sessions",  // ✓ 103
    ],
  },
  {
    videoId: "3.2.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "A WAF (Web Application Firewall) is specifically designed to protect against",
    intensity: "rebuild",
    newOpts: [
      "Application layer attacks like SQL injection, XSS, and CSRF targeting web applications",             // ✓ 86
      "Layer 3 network reconnaissance scans like nmap port enumeration against datacenter ranges",          // 91
      "Layer 2 ARP-cache poisoning attacks intercepting LAN traffic between hosts on the switch",           // 89
      "Insider data exfiltration through unauthorized USB removable storage media on workstations",         // 91
    ],
  },
  {
    videoId: "3.2.6", kind: "mc", index: 1,
    expectedOldStemPrefix: "SASE (Secure Access Service Edge) provides",
    intensity: "simple-pad",
    newOpts: [
      "On-premises security appliances stacked at each branch office's WAN entry point",                    // 80
      "Cloud-delivered security services (CASB, SWG, ZTNA, FWaaS) integrated with SD-WAN — security close to the user",  // ✓ 110
      "Physical network segmentation between operational technology and corporate IT zones",                 // 86
      "A single VPN appliance for all users that aggregates all branch traffic at headquarters",             // 89
    ],
  },
  {
    videoId: "3.2.6", kind: "mc", index: 3,
    expectedOldStemPrefix: "IPsec can be deployed in which two modes",
    intensity: "rebuild",
    newOpts: [
      "Active mode (verifies endpoints with X.509 certificates) and passive mode (logs traffic only)",       // 95
      "Symmetric mode (single shared key) and asymmetric mode (RSA key pair on both sides)",                  // 84
      "Tunnel mode (encrypts entire packet) and transport mode (encrypts payload only)",                       // ✓ 79
      "Client mode (TLS-only) and server mode (full deep packet inspection of session traffic)",               // 90
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

console.log(`\n§3.2 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
