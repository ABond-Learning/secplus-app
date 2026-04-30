// Sub-batch 2 mega-pass — §4.1 cohort (Secure Baselines/Wireless/App Security): 11 cohort items, 11 modified.
//
// 0 Convention B holdbacks — every cohort item benefits from a balancing edit or pad.
//
// 5 rebuild:
//   - mc-4.1.1-2  SCAP
//   - mc-4.1.2-0  Switch hardening first action
//   - mc-4.1.4-2  WPS disable
//   - mc-4.1.4-0  WPA3 SAE (correct intrinsically short — distractors padded with WPA2-vs-WPA3 misconceptions)
//   - mc-4.1.5-0  Input validation
//
// 4 multi-pad:
//   - mc-4.1.3-0  Wireless site survey
//   - mc-4.1.4-1  WPA2-Enterprise per-user auth
//   - mc-4.1.5-1  SAST vs DAST
//
// 3 simple-pad:
//   - mc-4.1.2-2  IoT hardening segmentation
//   - mc-4.1.3-2  Geofencing
//   - mc-4.1.5-2  Fuzzing
//
// Watchpoints respected:
//   - WPA2-Personal (PSK) vs WPA2-Enterprise (802.1X/RADIUS) vs WPA3-Personal (SAE) vs
//     WPA3-Enterprise — distinct.
//   - WPS PIN brute-force ~11,000 attempts — only mitigation is disable WPS.
//   - SAST = static (source code, no execution) vs DAST = dynamic (running app) vs
//     IAST = instrumented runtime — distinct.
//   - SCAP = standardized config assessment protocol; not a scan vendor or specific tool.
//   - Input validation prevents injection; output encoding prevents XSS contextually;
//     parameterized queries prevent SQLi specifically.
//   - Geofencing = location-based access; doesn't blur into MDM, EMM, or remote wipe.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.1-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.1.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "SCAP is used to",
    intensity: "rebuild",
    newOpts: [
      "Automate security configuration assessment and compliance verification against defined standards",   // ✓ 96
      "Conduct external penetration tests against perimeter-facing services on a quarterly basis",           // 90
      "Monitor real-time network traffic flow patterns for anomalies on internal segments",                   // 84
      "Manage user identities and group memberships across federated directory environments",                  // 87
    ],
  },
  {
    videoId: "4.1.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "When hardening a new network switch, the FIRST action should be",
    intensity: "rebuild",
    newOpts: [
      "Enable all available switch features so monitoring tools have maximum visibility from day one",        // 92
      "Configure 802.1Q VLANs and trunk ports to match the network architecture immediately",                  // 85
      "Update the switch firmware to the latest vendor release before doing anything else",                    // 84
      "Change all default credentials",                                                                         // ✓ 30
    ],
  },
  {
    videoId: "4.1.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Which hardening technique is most important for IoT devices with limited security features",
    intensity: "simple-pad",
    newOpts: [
      "Installing endpoint protection software on each constrained IoT device's onboard storage",            // 89
      "Full disk encryption on every IoT device's flash storage using hardware-rooted keys",                  // 81
      "Network segmentation",                                                                                  // ✓ 20
      "Deploying a host-based firewall directly onto each IoT device's microcontroller stack",                  // 86
    ],
  },
  {
    videoId: "4.1.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "A wireless site survey is performed to",
    intensity: "multi-pad",
    newOpts: [
      "Test network speed only by running iperf bandwidth tests at each candidate access point location",     // 96
      "Scan for rogue access points broadcasting unauthorized SSIDs near the corporate facility",             // 89
      "Plan optimal access point placement and measure signal coverage before and after deployment",           // ✓ 91
      "Test wireless encryption strength by attempting WPA2 handshake captures at each location",              // 90
    ],
  },
  {
    videoId: "4.1.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "Geofencing is used in mobile device management to",
    intensity: "simple-pad",
    newOpts: [
      "Track device GPS coordinates continuously for asset management inventory reporting only",              // 89
      "Improve wireless signal strength to enrolled corporate devices in the same geographic region",         // 90
      "Restrict device functionality or access based on geographic location — blocking corporate access outside defined areas",  // ✓ 118
      "Monitor battery usage patterns to detect compromised devices reporting unusual telemetry",             // 91
    ],
  },
  {
    videoId: "4.1.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "WPA3-Personal improves on WPA2-Personal primarily because",
    intensity: "convention-A",
    expectedOldCorrect: "SAE replaces PSK",
    newCorrect: "SAE (Simultaneous Authentication of Equals) replaces PSK — preventing offline dictionary attacks",
    newOpts: [
      "It uses longer passwords by mandating a 16-character minimum on every WPA3 PSK",                                       // 79
      "It uses AES-256 instead of AES-128 by default for all session encryption traffic",                                      // 80
      "SAE (Simultaneous Authentication of Equals) replaces PSK — preventing offline dictionary attacks",                      // ✓ 100
      "It requires X.509 client certificates instead of any pre-shared secret material",                                       // 80
    ],
  },
  {
    videoId: "4.1.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "WPA2-Enterprise is more secure than WPA2-Personal because",
    intensity: "multi-pad",
    newOpts: [
      "It uses stronger AES encryption with a longer key length than WPA2-Personal AES-128 CCMP",             // 92
      "Per-user authentication via 802.1X/RADIUS — each user has unique credentials and unique session keys",  // ✓ 100
      "It is faster because session keys are pre-computed and cached at the access point during boot",         // 91
      "It doesn't require any passwords because every user's device is enrolled by serial number",             // 92
    ],
  },
  {
    videoId: "4.1.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "Disabling WPS on wireless access points mitigates",
    intensity: "rebuild",
    newOpts: [
      "Evil twin attacks where a rogue AP impersonates a legitimate corporate SSID to capture clients",       // 95
      "Deauthentication attacks that flood the channel with spoofed 802.11 management frames",                // 88
      "Encryption downgrade attacks that force WPA2-AES sessions back down to WEP-RC4 ciphers",                // 89
      "Brute-force attacks against the WPS PIN (which has a fundamental design flaw allowing ~11,000 attempts)",  // ✓ 103
    ],
  },
  {
    videoId: "4.1.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "Input validation is the PRIMARY defense against",
    intensity: "rebuild",
    newOpts: [
      "DDoS attacks targeting application bandwidth saturation at upstream peering links",                    // 82
      "Injection attacks (SQL injection, XSS, command injection) by ensuring user input cannot be interpreted as code",  // ✓ 110
      "Brute force password attacks where attackers guess passwords through repeated login attempts",         // 92
      "Physical security threats including tailgating into restricted server rooms after hours",              // 87
    ],
  },
  {
    videoId: "4.1.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "SAST differs from DAST in that",
    intensity: "convention-A",
    expectedOldCorrect: "SAST analyses source code without execution",
    newCorrect: "SAST analyzes source code without execution",
    newOpts: [
      "SAST is significantly more expensive to license per developer seat than DAST tooling",                  // 87
      "SAST is always automated by integration into the CI pipeline; DAST is always manual",                   // 84
      "SAST analyzes source code without execution",                                                            // ✓ 42
      "DAST finds more vulnerabilities than SAST because runtime testing covers every input path",             // 91
    ],
  },
  {
    videoId: "4.1.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "Fuzzing involves",
    intensity: "simple-pad",
    newOpts: [
      "Manually reviewing source code for vulnerabilities by walking each function with a checklist",         // 92
      "Sending random, unexpected, or malformed inputs to an application to discover crashes and security vulnerabilities",  // ✓ 114
      "Scanning the application binary for known vulnerability signatures from a vendor CVE feed",            // 90
      "Testing network protocols by capturing and replaying traffic to verify request handling",              // 89
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
  let newA;
  if (r.intensity === "convention-A") {
    // Convention A — correct option text changes (e.g. acronym expansion). Verify
    // that the existing correct text matches the explicitly-declared expectedOldCorrect
    // and that newCorrect appears in newOpts.
    if (typeof r.expectedOldCorrect !== "string" || typeof r.newCorrect !== "string") {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — convention-A entry missing expectedOldCorrect or newCorrect`);
      refused++; continue;
    }
    if (item.opts[item.a] !== r.expectedOldCorrect) {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct does not match expectedOldCorrect`);
      console.error(`  expected: "${r.expectedOldCorrect}"`);
      console.error(`  actual:   "${item.opts[item.a]}"`);
      refused++; continue;
    }
    if (!r.newOpts.includes(r.newCorrect)) {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — newCorrect not in newOpts`);
      refused++; continue;
    }
    newA = r.newOpts.indexOf(r.newCorrect);
  } else {
    const currentCorrect = item.opts[item.a];
    if (!r.newOpts.includes(currentCorrect)) {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
      console.error(`  current correct: "${currentCorrect}"`);
      refused++; continue;
    }
    newA = r.newOpts.indexOf(currentCorrect);
  }
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\n§4.1 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
