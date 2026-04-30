// Sub-batch 2 — §2.4 cohort (Indicators of Compromise / Attacks): 24 changes across 28 cohort items.
// 4 Convention B holdbacks (term-recall, short-on-short symmetry exam-realistic):
//   - mc-2.4.2-0  worm-vs-other-malware-type recall (single-word options)
//   - mc-2.4.2-1  virus-requires-user-action recall (single-word options)
//   - mc-2.4.14-2 credential-stuffing-vs-password-spraying recall (short attack-name options)
//                 (MOST-framing ambiguity flagged in TODO-content-quality.md for future review)
//   - scen-2.4.15-1 Beaconing — Sub-batch 1 already extracted gloss to explanation; correct
//                   intrinsically a 9-char term, scenario carries the rationale; padding
//                   distractors to ≥14 chars would still leave ratio > 1.5×, and forcing
//                   single-word distractors loses meaning vs the noun-phrase scenario answers
//
// 6 rebuild (3-short distractors each, full distractor rewrite):
//   - mc-2.4.2-3  WannaCry — Convention A: em-dash expansion to match correct's structure
//   - mc-2.4.7-2  DNS tunneling
//   - mc-2.4.12-2 IDOR
//   - mc-2.4.9-0  on-path / MITM
//   - mc-2.4.1-3  C2 infrastructure
//   - mc-2.4.2-2  polymorphic virus
//
// 11 multi-pad (2-short distractors each, length asymmetry on remaining distractor pads up too):
//   CSRF, ARP-poisoning, RFID-cloning, downgrade, logic-bomb, evil-twin, HSTS,
//   DDoS-vs-DoS, ransomware-defense, file-hash-IoCs, DNSSEC
//
// 7 simple-pad (1-short distractor each — many also need ratio-pads on other distractors
//   because correct is intrinsically long and the ≤1.5× rule pulls every option upward):
//   physical-attack-pair scenario, nonces, rootkit-detection, impossible-travel,
//   spyware, directory-traversal, key-stretching
//
// Watchpoints respected throughout (per Aiden's spec):
//   - Phishing taxonomy preserved: spear/whaling/vishing/smishing/pharming distinct
//   - DDoS subtypes: volumetric vs protocol vs L7 not muddled
//   - Password attacks: brute/dictionary/rainbow/spraying/stuffing distinct
//   - Malware types: virus/worm/trojan/ransomware/rootkit/spyware/RAT/fileless not blurred
//   - IoC vs IoA terminology not muddled (didn't introduce IoA where Messer uses IoC broadly)
//   - Threat-actor categories not invented or blurred
//   - C2 specifics: beaconing concept used carefully; no invented C2 mechanisms
//   - Attack lifecycle: lateral movement / privilege escalation / persistence kept distinct
//   - No invented CVE numbers, APT-group designations, or malware-family names
//
// Distractor recycling: all 24 modified items use prose distinct from one another.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2.4-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // ─── §2.4.1 An Overview of Malware ────────────────────────────────────
  {
    videoId: "2.4.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "The BEST defense against ransomware data loss is",
    intensity: "multi-pad",
    newOpts: [
      "Maintaining regular offline or offsite backups not connected to the main network",  // ✓ 80
      "Enforcing strong unique passwords across all user and service accounts",              // 71
      "Paying the ransom quickly to restore data and minimize total downtime",                // 70
      "Installing endpoint antivirus software with up-to-date malware signatures",            // 74
    ],
  },
  {
    videoId: "2.4.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "C2 (Command and Control) infrastructure is used by attackers to",
    intensity: "rebuild",
    newOpts: [
      "Remotely communicate with and issue commands to compromised systems",            // ✓ 67
      "Encrypt stolen victim data on disk before demanding a ransom payment",            // 67
      "Conduct phishing campaigns to harvest corporate user credentials at scale",      // 73
      "Store harvested data and stolen credentials on attacker-controlled servers",     // 74
    ],
  },

  // ─── §2.4.2 Viruses and Worms ─────────────────────────────────────────
  // mc-2.4.2-0 and mc-2.4.2-1 held back as Convention B (single-word malware-type recall).
  {
    videoId: "2.4.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "A polymorphic virus is designed to",
    intensity: "rebuild",
    newOpts: [
      "Replicate across networks without requiring a host file or user execution",                              // 73 (worm confusion)
      "Change its code or signature with each infection to evade signature-based antivirus detection",          // ✓ 93
      "Encrypt files on the infected host until the victim pays a ransom",                                      // 65 → padded
      "Operate entirely in system memory without writing any payload to disk",                                  // 70 (fileless confusion)
    ],
  },
  {
    videoId: "2.4.2", kind: "mc", index: 3,
    expectedOldStemPrefix: "WannaCry spread rapidly without user interaction because it behaved like a",
    intensity: "rebuild",  // Convention A — em-dash expansion to match correct's structure
    newOpts: [
      "Trojan — disguised as legitimate software requiring user execution",                  // 65
      "Polymorphic virus — changing its signature on each infection to evade AV",            // 73
      "Worm — exploiting SMBv1 to self-propagate across networks",                            // ✓ 57
      "Rootkit — establishing kernel-level concealment after exploitation",                   // 67
    ],
  },

  // ─── §2.4.3 Spyware and Bloatware ─────────────────────────────────────
  {
    videoId: "2.4.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "Spyware primarily does which of the following",
    intensity: "simple-pad",
    newOpts: [
      "Encrypts files on the host system and demands ransom payment for decryption",                                       // 76 (ransomware confusion)
      "Creates a persistent backdoor for remote attacker access to the compromised host",                                  // 81 (RAT confusion)
      "Displays unwanted pop-up advertisements while the user is browsing the web",                                         // 76 (adware confusion)
      "Secretly monitors user activity and transmits data (keystrokes, screenshots, credentials) to an attacker",         // ✓ 104
    ],
  },

  // ─── §2.4.4 Other Malware Types ───────────────────────────────────────
  {
    videoId: "2.4.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "A logic bomb is",
    intensity: "multi-pad",
    newOpts: [
      "Malware that always executes immediately upon installation on the target system",                  // 80
      "Malicious code that lies dormant and executes only when a specific trigger condition is met",     // ✓ 91
      "A type of distributed denial-of-service amplification attack using public reflectors",             // 86
      "A hardware-level firmware vulnerability in BIOS or UEFI components below the OS",                 // 79
    ],
  },
  {
    videoId: "2.4.4", kind: "mc", index: 3,
    expectedOldStemPrefix: "Why are rootkits particularly difficult to detect",
    intensity: "simple-pad",
    newOpts: [
      "They use strong end-to-end encryption to obscure their network communications",                                                       // 78
      "They operate at the kernel level and intercept OS calls — hiding themselves from the very tools used to detect them",                  // ✓ 115
      "They change their executable code or signature with each new system infection",                                                        // 78 (polymorphism confusion)
      "They infect only BIOS or UEFI firmware below the operating system, not user-space",                                                    // 82 (bootkit-only narrowing)
    ],
  },

  // ─── §2.4.5 Physical Attacks ──────────────────────────────────────────
  {
    videoId: "2.4.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "RFID cloning is used to",
    intensity: "multi-pad",
    newOpts: [
      "Replay captured Wi-Fi authentication frames against a wireless access point",                              // 76 (wrong protocol family)
      "Copy the data from an RFID access card to create a duplicate that bypasses physical access controls",      // ✓ 99
      "Disrupt the RFID reader's radio signal so legitimate badges cannot authenticate to it",                    // 86 (RFID jamming distinction)
      "Brute-force the PIN entry on a smart-card reader using a programmable USB device",                          // 81 (wrong attack class)
    ],
  },
  {
    videoId: "2.4.5", kind: "scen", index: 0,
    expectedOldStemPrefix: "A penetration tester walks into a financial firm's building alongside a group of employees",
    intensity: "simple-pad",
    newOpts: [
      "Shoulder surfing the user's typed laptop password and RFID cloning the visitor's lobby badge",                                                                              // 92
      "Skimming credit-card details at the front lobby and social engineering the receptionist via phone",                                                                          // 97
      "Dumpster diving through visitor logs in the bin and baiting employees with branded malicious USB drives",                                                                    // 102
      "Tailgating (following employees through access control without authenticating) and impersonation (fake visitor badge from a known vendor)",                                   // ✓ 137
    ],
  },

  // ─── §2.4.6 Denial of Service ─────────────────────────────────────────
  {
    videoId: "2.4.6", kind: "mc", index: 0,
    expectedOldStemPrefix: "How does a DDoS attack differ from a basic DoS attack",
    intensity: "multi-pad",
    newOpts: [
      "DDoS attacks always use encryption to mask their malicious payloads in transit",                              // 78
      "DDoS attacks require the attacker to have physical access to the target's network",                            // 81
      "DDoS attacks only target web applications and never affect network or transport layers",                       // 87
      "DDoS originates from many distributed sources (botnet), making it much harder to block by IP",                // ✓ 92
    ],
  },

  // ─── §2.4.7 DNS Attacks ───────────────────────────────────────────────
  {
    videoId: "2.4.7", kind: "mc", index: 1,
    expectedOldStemPrefix: "DNSSEC mitigates DNS attacks by",
    intensity: "multi-pad",
    newOpts: [
      "Encrypting DNS query content between client and resolver to hide queries from observers",                  // 88 (DoH/DoT confusion)
      "Blocking all external DNS queries from corporate clients at the perimeter firewall",                        // 81
      "Cryptographically signing DNS records so resolvers can verify their authenticity",                          // ✓ 80
      "Requiring DNS queries to be performed only over IPv6-enabled resolvers",                                       // 70 (review-2: IPv6 has no relationship to DNSSEC's record-signing — replaces "MFA for DNS admin changes" which was a real operational practice and risked plausible-and-true rather than plausible-and-false)
    ],
  },
  {
    videoId: "2.4.7", kind: "mc", index: 2,
    expectedOldStemPrefix: "DNS tunneling is used to",
    intensity: "rebuild",
    newOpts: [
      "Hide data exfiltration or C2 traffic within DNS queries — often passing through firewalls that allow DNS",   // ✓ 104
      "Resolve hostnames faster by bypassing the standard recursive DNS hierarchy entirely",                          // 81 (DoH/local-cache confusion)
      "Conduct a denial-of-service attack against an authoritative DNS server's query handling",                      // 86 (wrong attack category)
      "Poison the DNS cache of a recursive resolver to redirect users to a malicious destination",                    // 87 (cache poisoning distinction)
    ],
  },

  // ─── §2.4.8 Wireless Attacks ──────────────────────────────────────────
  {
    videoId: "2.4.8", kind: "mc", index: 0,
    expectedOldStemPrefix: "An evil twin attack involves",
    intensity: "multi-pad",
    newOpts: [
      "Capturing the WPA2 four-way handshake to crack the pre-shared key offline later",                              // 79 (KRACK/handshake distinction)
      "Creating a rogue access point that mimics a legitimate network's SSID to intercept victim traffic",            // ✓ 97
      "Jamming wireless radio signals to disrupt legitimate access point communications",                              // 80 (DoS distinction)
      "Brute-forcing the WPA2 pre-shared key by trying every possible passphrase combination",                          // 86 (offline cracking distinction)
    ],
  },

  // ─── §2.4.9 On-path Attacks ───────────────────────────────────────────
  {
    videoId: "2.4.9", kind: "mc", index: 0,
    expectedOldStemPrefix: "An on-path (man-in-the-middle) attack allows an attacker to",
    intensity: "rebuild",
    newOpts: [
      "Crash the target host through resource exhaustion until it stops responding to requests",                        // 87 (DoS distinction)
      "Intercept and potentially read or modify communications between two parties without their knowledge",          // ✓ 99
      "Enumerate all open TCP and UDP ports on a target system to map exposed services",                                // 79 (recon distinction)
      "Inject deauthentication frames into wireless broadcast traffic to disconnect legitimate clients",                // 94 (wireless DoS distinction)
    ],
  },
  {
    videoId: "2.4.9", kind: "mc", index: 1,
    expectedOldStemPrefix: "ARP poisoning enables an on-path attack by",
    intensity: "multi-pad",
    newOpts: [
      "Flooding the switch's CAM table with spoofed MAC addresses until it fails open and broadcasts every frame",                                          // 110 (MAC flood distinction)
      "Sending fake ARP replies that associate the attacker's MAC address with a legitimate IP — redirecting LAN traffic through the attacker",            // ✓ 134
      "Forging ICMP redirect messages so each victim updates its routing table to send traffic via the attacker",                                            // 105 (ICMP redirect distinction)
      "Hijacking DHCP responses on the LAN to assign the attacker as the default gateway for client traffic",                                                // 102 (DHCP distinction)
    ],
  },
  {
    videoId: "2.4.9", kind: "mc", index: 2,
    expectedOldStemPrefix: "HSTS (HTTP Strict Transport Security) mitigates SSL stripping by",
    intensity: "multi-pad",
    newOpts: [
      "Encrypting all browser cookies using AES-256 before storing them in local storage",                  // 80
      "Requiring strict TLS certificate pinning enforced at the browser-application level",                  // 81 (real adjacent technique)
      "Blocking all non-HTTPS traffic at the corporate edge firewall before it leaves the network",          // 89 (perimeter vs browser-side distinction)
      "Instructing browsers to always use HTTPS for a domain — refusing to downgrade to HTTP",               // ✓ 85
    ],
  },

  // ─── §2.4.10 Replay Attacks ───────────────────────────────────────────
  {
    videoId: "2.4.10", kind: "mc", index: 2,
    expectedOldStemPrefix: "Nonces prevent replay attacks by",
    intensity: "simple-pad",
    newOpts: [
      "Encrypting all authentication traffic between client and server using TLS in transit",                              // 84
      "Requiring biometric authentication factors during the initial login session establishment",                          // 89
      "Adding a unique random value to each authentication request — old requests with invalid nonces are rejected",       // ✓ 107
      "Limiting login attempts and locking out accounts after repeated authentication failures",                            // 87
    ],
  },

  // ─── §2.4.12 Application Attacks ──────────────────────────────────────
  {
    videoId: "2.4.12", kind: "mc", index: 0,
    expectedOldStemPrefix: "A directory traversal attack uses",
    intensity: "simple-pad",
    newOpts: [
      "SQL code injected into file path parameters processed by the web application",                                                              // 76 (SQLi confusion)
      "'../' sequences in URLs to navigate outside the intended web root directory and access sensitive system files",                              // ✓ 109
      "JavaScript executed in the browser to modify file path parameters before the request is submitted",                                          // 96 (XSS layer confusion)
      "DNS queries to locate hidden file servers within the internal network infrastructure",                                                       // 84 (wrong protocol)
    ],
  },
  {
    videoId: "2.4.12", kind: "mc", index: 1,
    expectedOldStemPrefix: "CSRF (Cross-Site Request Forgery) attacks exploit",
    intensity: "multi-pad",
    newOpts: [
      "The server's trust in the authenticated victim's browser — tricking authenticated users into making unwanted requests",   // ✓ 117
      "The browser's misplaced trust in the server's TLS certificate during the connection handshake setup",                       // 99 (wrong trust direction)
      "Unparameterized SQL queries embedded in the form submission processing logic itself",                                       // 84 (SQLi confusion)
      "DNS cache poisoning at the recursive resolver to redirect victims to attacker-controlled sites",                            // 94 (wrong layer/protocol)
    ],
  },
  {
    videoId: "2.4.12", kind: "mc", index: 2,
    expectedOldStemPrefix: "IDOR (Insecure Direct Object Reference) vulnerabilities allow attackers to",
    intensity: "rebuild",
    newOpts: [
      "Inject SQL commands into the application's database queries to extract sensitive records",                                            // 88 (SQLi confusion)
      "Execute arbitrary code on the server by exploiting an unrestricted file upload vulnerability",                                        // 91 (RCE confusion)
      "Access objects belonging to other users by manipulating predictable identifiers without proper authorization checks",                  // ✓ 115
      "Bypass network firewall rules by smuggling protocols inside permitted application-layer traffic",                                       // 92 (wrong layer)
    ],
  },

  // ─── §2.4.13 Cryptographic Attacks ────────────────────────────────────
  {
    videoId: "2.4.13", kind: "mc", index: 1,
    expectedOldStemPrefix: "A downgrade attack forces a connection to",
    intensity: "multi-pad",
    newOpts: [
      "Use a newer untested protocol with unknown vulnerabilities still present in the codebase",                  // 90
      "Use stronger encryption keys without negotiating cipher suites with the server first",                       // 84 (opposite direction)
      "Disconnect entirely and force the user to authenticate again from scratch",                                  // 73
      "Use a weaker, older, vulnerable protocol version that the attacker can then exploit",                        // ✓ 83
    ],
  },
  {
    videoId: "2.4.13", kind: "mc", index: 2,
    expectedOldStemPrefix: "Key stretching algorithms like bcrypt mitigate brute force attacks by",
    intensity: "simple-pad",
    newOpts: [
      "Encrypting the password before hashing",                                  // 38
      "Being deliberately computationally slow",                                  // ✓ 39
      "Using asymmetric keys for password storage",                              // 42
      "Requiring a separate hardware token at login",                            // 45 (was 26 "Requiring a hardware token" — small clarifying pad keeps ≤1.5× ratio)
    ],
  },

  // ─── §2.4.14 Password Attacks ─────────────────────────────────────────
  // mc-2.4.14-2 held back as Convention B (password-attack-name recall, all 4 short).

  // ─── §2.4.15 Indicators of Compromise ─────────────────────────────────
  {
    videoId: "2.4.15", kind: "mc", index: 0,
    expectedOldStemPrefix: "An impossible travel alert fires when",
    intensity: "simple-pad",
    newOpts: [
      "A user account shows logins from geographically impossible locations within a short time — indicating credential compromise",       // ✓ 123
      "A user logs in multiple times within a single calendar day from their normal office location",                                       // 92
      "A backend server suddenly runs out of available disk space and stops accepting new writes",                                          // 88
      "A user downloads a single very large file from an internal corporate file share over the VPN",                                       // 92
    ],
  },
  {
    videoId: "2.4.15", kind: "mc", index: 2,
    expectedOldStemPrefix: "File hash IoCs are easily evaded by",
    intensity: "multi-pad",
    newOpts: [
      "Adding new firewall block rules at the network perimeter",        // 50
      "Encrypting all malware command-and-control communications",        // 50
      "Polymorphic malware that changes its code",                        // ✓ 41
      "Stolen legitimate code-signing certificate signatures",            // 51
    ],
  },
  // scen-2.4.15-1 held back as Convention B (Sub-batch 1 already extracted gloss; correct intrinsically 9 chars).
];

// ─── Apply (mirror of fix-short-distractors-d2.3.mjs) ─────────────────────
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
    console.error(`  expected: "${r.expectedOldStemPrefix}…"`);
    console.error(`  actual:   "${item.q.slice(0, 80)}…"`);
    refused++;
    continue;
  }
  const sameOpts = r.newOpts.length === item.opts.length &&
    r.newOpts.every((o, i) => o === item.opts[i]);
  if (sameOpts) { skipped++; continue; }
  const currentCorrect = item.opts[item.a];
  if (!r.newOpts.includes(currentCorrect)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
    console.error(`  current correct: "${currentCorrect}"`);
    console.error(`  newOpts: ${JSON.stringify(r.newOpts.map((o) => o.slice(0, 50)))}`);
    refused++;
    continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) {
    item.opts = r.newOpts.slice();
    item.a = newA;
  }
  applied++;
}

console.log(`\nFix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length}`);
console.log(`  applied:  ${applied}`);
console.log(`  skipped (idempotent): ${skipped}`);
console.log(`  refused (safety): ${refused}`);
const intensityCounts = {};
for (const l of log) intensityCounts[l.intensity] = (intensityCounts[l.intensity] || 0) + 1;
console.log(`Intensity:`, intensityCounts);

if (write || preview) {
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote to ${target}`);
  if (preview) {
    console.log(`Validate preview: node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
    console.log(`Audit preview:    node scripts/audit-short-distractor-cohort.mjs --path=${previewPath} --domain=2`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
