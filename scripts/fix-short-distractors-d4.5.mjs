// Sub-batch 2 — §4.5 cohort (Endpoint / Email / Monitoring): 16 changes across 16 cohort items.
// 0 Convention B holdbacks — every item benefits from a balancing edit or pad.
//
// 7 rebuild (3-short distractors each, full distractor rewrite):
//   - mc-4.5.1-0  TLS inspection on NGFW
//   - mc-4.5.4-0  Telnet vs SSH
//   - mc-4.5.7-0  EDR vs EPP
//   - mc-4.5.1-1  firewall rule processing order
//   - mc-4.5.5-0  SPF prevents email spoofing  (carefully avoiding §2.2 mc-2.2.2-5 prose reuse)
//   - mc-4.5.1-2  WAF protects against
//   - mc-4.5.7-1  posture assessment
//
// 3 Convention B-edit (small distractor edits for length balance under preserve-correct):
//   - mc-4.5.6-1  DLP control recognition (control-category recall)
//   - mc-4.5.5-1  DKIM CIA property recall (parenthetical disambiguation on each option)
//   - mc-4.5.3-2  UAC mitigates (minor wordsmithing on each distractor)
//
// 3 multi-pad (2-short distractors each, ratio pulls all 3 distractors upward):
//   - mc-4.5.4-1  SNMPv3 vs v1/v2
//   - mc-4.5.3-1  GPOs in Active Directory
//   - mc-4.5.2-0  DNS filtering effectiveness
//
// 3 simple-pad (1-short distractor each):
//   - mc-4.5.2-1  CASB use case
//   - mc-4.5.4-2  TLS 1.3 over TLS 1.2
//   - mc-4.5.6-0  DLP three states
//
// Watchpoints respected throughout (per Aiden's spec):
//   - DLP modes (Endpoint / Network / Cloud) preserved without conflation; FIM kept distinct
//     from DLP (different scope: file changes vs data movement)
//   - EDR / XDR / MDR / SIEM / SOAR scopes precise — EDR endpoint-only, XDR cross-domain,
//     MDR is a service offering, SIEM = aggregation/correlation, SOAR = automation/response
//   - Traditional AV vs NGAV vs EDR not blurred (no claims of "behavioral AV" or "signature EDR")
//   - DKIM / SPF / DMARC kept precisely distinct: DKIM = signing, SPF = sender-server list,
//     DMARC = policy framework. SPF-spoofing question (mc-4.5.5-0) tests the canonical
//     DKIM-vs-SPF confusion via a "per-message digital signature" distractor (different prose
//     from §2.2 mc-2.2.2-5's "Cryptographically signs..." correct option, no recycling).
//   - CSPM / CWPP / CASB distinct (CASB question mc-4.5.2-1 doesn't blur with CSPM/CWPP)
//   - SIEM doesn't "respond" — that's SOAR (no distractor claims SIEM auto-responds)
//   - Plausible-AND-false rule applied throughout
//   - No invented APT-group names, malware-family names, CVE numbers
//   - American English throughout
//
// Cross-script recycling check vs scripts/fix-short-distractors-d2.2.mjs:
//   §2.2 touched email-security prose in mc-2.2.2-5 (DKIM property). §4.5 mc-4.5.5-0
//   distractors deliberately avoid the §2.2 strings:
//     - §2.2 had "Encrypts the email body content end-to-end between sender and recipient"
//       → §4.5 uses "Encrypting outbound email message contents using S/MIME or PGP
//         cryptographic envelopes between mail servers" (S/MIME-or-PGP framing, not e2e)
//     - §2.2 had "Cryptographically signs the email to verify it came from the domain..."
//       → §4.5 uses "Generating a per-message digital signature to verify each message's
//         originating sender domain" (per-message framing, distinct verb structure)
//     - §2.2 had "Blocks phishing emails automatically based on sender reputation scoring"
//       → §4.5 uses "Scanning every inbound email message for malware signatures and
//         behavioral indicators at the gateway" (malware-scanning framing, different control)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.5-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // ─── §4.5.1 Firewalls ─────────────────────────────────────────────────
  {
    videoId: "4.5.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "TLS inspection on a NGFW is used because",
    intensity: "rebuild",
    newOpts: [
      "TLS itself is fundamentally insecure and modern NGFWs decrypt to ensure data confidentiality across the WAN",                                          // 110
      "TLS slows network performance and inspection allows the NGFW to compress and cache responses for clients",                                              // 107
      "Attackers increasingly hide malware and C2 traffic in encrypted TLS sessions — inspection reveals threats that bypass perimeter controls",            // ✓ 136
      "All TLS-encrypted outbound traffic is presumed malicious and must be decrypted to log session contents",                                                // 104
    ],
  },
  {
    videoId: "4.5.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Firewall rules are processed in which order",
    intensity: "rebuild",
    newOpts: [
      "In random order based on the rule hash to prevent attacker prediction of policy",                  // 79
      "Bottom-to-top, last matching rule applies and overrides earlier-defined rules",                    // 78
      "Alphabetical by the rule's name field, regardless of rule insertion order",                        // 74
      "Top-to-bottom, first matching rule applies — order matters significantly",                          // ✓ 72
    ],
  },
  {
    videoId: "4.5.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "A WAF (Web Application Firewall) is specifically designed to protect against",
    intensity: "rebuild",
    newOpts: [
      "Network-layer DDoS attacks targeting upstream bandwidth saturation at the ISP",                                       // 78
      "Physical server attacks like USB-based bootkit installation by an insider",                                            // 73
      "Application layer attacks like SQL injection, XSS, and CSRF targeting web applications",                              // ✓ 86
      "Wireless network attacks targeting WPA2 handshake capture and PSK cracking offline",                                   // 82
    ],
  },

  // ─── §4.5.2 Web Filtering ─────────────────────────────────────────────
  {
    videoId: "4.5.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "DNS filtering is effective at blocking malicious sites because",
    intensity: "multi-pad",
    newOpts: [
      "It inspects the contents of every IP packet leaving the corporate edge firewall",                            // 80
      "It works only on web browsers and is bypassed by non-browser applications entirely",                          // 84
      "It prevents DNS resolution of malicious domains — devices never even connect to the malicious IP",            // ✓ 96
      "It requires client software installation on every endpoint device that browses the web",                       // 89
    ],
  },
  {
    videoId: "4.5.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "A CASB (Cloud Access Security Broker) is most useful for",
    intensity: "simple-pad",
    newOpts: [
      "Filtering on-premises web traffic at the corporate proxy gateway level",                            // 71
      "Scanning all endpoints for malware signatures and behavioral indicators",                            // 72
      "Replacing the perimeter firewall as the primary network security control",                          // 74
      "Enforcing data security policies for cloud applications and preventing shadow IT usage",            // ✓ 86
    ],
  },

  // ─── §4.5.3 Operating System Security ─────────────────────────────────
  {
    videoId: "4.5.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Group Policy Objects (GPOs) in Active Directory allow administrators to",
    intensity: "multi-pad",
    newOpts: [
      "Centrally enforce security settings across all domain-joined Windows systems — password policies, screen lock, app restrictions",  // ✓ 127
      "Manually configure each domain-joined workstation through individual local policy editor sessions",                                  // 99
      "Monitor all live user activity by recording every keystroke and screenshot in real time",                                            // 89
      "Conduct authorized penetration tests against domain-joined systems on a recurring basis",                                            // 88
    ],
  },
  {
    videoId: "4.5.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "User Account Control (UAC) mitigates which risk",
    intensity: "convention-B-edit",
    newOpts: [
      "Network-layer attacks",          // 21
      "Data exfiltration attempts",      // 26
      "Password-cracking attacks",       // 25
      "Silent privilege escalation",     // ✓ 27
    ],
  },

  // ─── §4.5.4 Secure Protocols ──────────────────────────────────────────
  {
    videoId: "4.5.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "Why should Telnet be replaced with SSH",
    intensity: "rebuild",
    newOpts: [
      "SSH connects faster than Telnet thanks to lighter packet structure during the handshake",            // 87
      "Telnet is no longer supported by major operating systems and SSH is the only alternative",            // 88
      "SSH uses significantly less network bandwidth than Telnet across long-haul WAN links",                 // 84
      "Telnet transmits all data including credentials in plaintext — SSH encrypts the entire session",     // ✓ 94
    ],
  },
  {
    videoId: "4.5.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "SNMPv3 is preferred over SNMPv1/v2 because",
    intensity: "multi-pad",
    newOpts: [
      "SNMPv3 supports a larger number of MIBs and OIDs than v1 and v2 ever supported",                                  // 79
      "SNMPv1 and v2 transmit community strings and data in plaintext — SNMPv3 adds authentication and encryption",      // ✓ 106
      "SNMPv3 is fully backwards compatible with all earlier SNMP protocol versions and tools",                            // 87
      "SNMPv3 is free to use whereas earlier versions required commercial licensing fees",                                  // 81
    ],
  },
  {
    videoId: "4.5.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "TLS 1.3 improves security over TLS 1.2 by",
    intensity: "simple-pad",
    newOpts: [
      "Removing weak cipher suites, requiring forward secrecy, and simplifying the handshake — faster and more secure",    // ✓ 110
      "Adding more cipher suite options for backwards compatibility with older TLS clients",                                 // 84
      "Being fully backwards compatible with all SSLv3 and earlier-generation legacy clients",                                // 86
      "Adding mandatory client certificate authentication for every TLS session handshake",                                   // 83
    ],
  },

  // ─── §4.5.5 Email Security ────────────────────────────────────────────
  {
    videoId: "4.5.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "SPF prevents email spoofing by",
    intensity: "rebuild",
    newOpts: [
      "Encrypting outbound email message contents using S/MIME or PGP cryptographic envelopes between mail servers",                                       // 110
      "Inspecting every inbound message attachment in a sandbox detonation engine before delivery to user inboxes",                                       // 109 (review-1: reworded from "Scanning ... malware signatures and behavioral indicators at the gateway" to avoid §4.5-internal recycling against mc-4.5.2-1)
      "Generating a per-message digital signature to verify each message's originating sender domain",                                                       // 95
      "Publishing a DNS record listing servers authorized to send email for the domain — receiving servers reject email from unlisted sources",            // ✓ 134
    ],
  },
  {
    videoId: "4.5.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "DKIM provides which security property for email",
    intensity: "convention-B-edit",
    newOpts: [
      "Integrity and authentication",       // ✓ 28
      "Confidentiality (encryption)",        // 28
      "Availability (uptime)",                // 21
      "Access control (RBAC)",                // 21
    ],
  },

  // ─── §4.5.6 Monitoring Data ───────────────────────────────────────────
  {
    videoId: "4.5.6", kind: "mc", index: 0,
    expectedOldStemPrefix: "DLP monitors data in which three states",
    intensity: "simple-pad",
    newOpts: [
      "Encrypted-state, unencrypted-state, and compressed-state classifications",                       // 70
      "Backup state, production state, and archive state lifecycle stages",                              // 64
      "In motion (network), at rest (storage), and in use (endpoint actions)",                           // ✓ 69
      "Internal traffic, external traffic, and cloud traffic network zones",                             // 65
    ],
  },
  {
    videoId: "4.5.6", kind: "mc", index: 1,
    expectedOldStemPrefix: "An employee attempts to email a spreadsheet with 200 SSNs to a personal email account",
    intensity: "convention-B-edit",
    newOpts: [
      "DLP (Data Loss Prevention)",         // ✓ 26
      "Network firewall (NGFW)",             // 23
      "Endpoint antivirus (EPP)",            // 24
      "Network IDS (NIDS sensor)",           // 25
    ],
  },

  // ─── §4.5.7 Endpoint Security ─────────────────────────────────────────
  {
    videoId: "4.5.7", kind: "mc", index: 0,
    expectedOldStemPrefix: "EDR provides which capability that EPP does not",
    intensity: "rebuild",
    newOpts: [
      "Better malware signatures and a larger threat-intel database than traditional EPP provides",      // 91
      "Faster signature updates pushed to endpoints in real time from the vendor cloud",                  // 79
      "Behavioral monitoring, forensic investigation tools, and active response — including isolating compromised endpoints", // ✓ 116
      "Free cloud storage for endpoint backups and disaster-recovery rollback snapshots",                  // 79
    ],
  },
  {
    videoId: "4.5.7", kind: "mc", index: 1,
    expectedOldStemPrefix: "A posture assessment before network access checks",
    intensity: "rebuild",
    newOpts: [
      "User identity and password authentication only",                             // 47 (trimmed to fit 39-char correct's 1.5× ceiling of 58)
      "The physical location of the device on the network",                         // 51
      "Endpoint network traffic flow patterns recently observed",                    // 56
      "The security compliance of the endpoint",                                    // ✓ 39
    ],
  },
];

// ─── Apply (mirror of fix-short-distractors-d2.2.mjs) ─────────────────────
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
    console.log(`Audit preview:    node scripts/audit-short-distractor-cohort.mjs --path=${previewPath} --domain=4`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
