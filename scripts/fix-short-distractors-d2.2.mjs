// Sub-batch 2 — §2.2 cohort (Social Engineering / Phishing): 10 changes across 15 cohort items.
// 5 Convention B holdbacks (term-recall, short-on-short symmetry exam-realistic):
//   - mc-2.2.2-0 whaling — phishing-taxonomy term recall (whaling/spear/smishing/vishing)
//   - mc-2.2.2-1 smishing — phishing-taxonomy term recall (vishing/smishing/whaling/spear)
//   - mc-2.2.2-4 SPF — email-standard acronym recall (DKIM/DMARC/SPF/TLS — intrinsically 3–5 chars)
//   - mc-2.2.5-1 scarcity — SE principle name recall (Authority/Scarcity/Social proof/Liking)
//   - mc-2.2.5-2 tailgating — SE technique recall ("Piggybacking/tailgating" 23 vs single
//                terms 7–10; slash-notation in correct preserved verbatim under the
//                preserve-correct rule, so balancing is structurally impossible)
//
// 3 Convention B-edit (small distractor edits to balance length under preserve-correct):
//   - mc-2.2.2-2 vishing channel — pad/trim distractors to ~15–17 chars
//   - mc-2.2.4-2 watering hole — pad shortest distractor ("Spear phishing" → "Spear phishing attack")
//   - mc-2.2.1-2 configuration-based vector — pad shortest distractor (was 22/33 = 1.50× exactly)
//
// 2 rebuild (3-short distractors each, full distractor rewrite):
//   - mc-2.2.3-1 BEC primary target
//   - mc-2.2.5-4 MOST effective SE control
//
// 1 multi-pad (2-short distractors each, but ratio pulls all 3 distractors upward):
//   - scen-2.2.5-0 two-technique physical scenario
//
// 4 simple-pad (1-short distractor each, but ratio pulls all 3 distractors upward):
//   - mc-2.2.3-2 typosquatting
//   - mc-2.2.2-5 DKIM property
//   - mc-2.2.1-1 attack-surface reduction
//   - mc-2.2.3-0 pretexting
//
// Watchpoints respected throughout (per Aiden's spec):
//   - Phishing taxonomy distinct: phishing / spear / whaling (subset of spear) / vishing /
//     smishing / pharming / BEC — never blurred in distractors
//   - SE principles (Authority, Intimidation, Urgency, Scarcity, Familiarity, Trust) kept
//     distinct from SE techniques (pretexting, watering hole, tailgating, dumpster diving,
//     shoulder surfing, brand/typo impersonation)
//   - Misinformation (unintentional) vs disinformation (intentional) not introduced where
//     not relevant
//   - Plausible-AND-false rule (added in §2.4 review-2): no distractors that are real,
//     correct mitigations of the question's domain — only verifiably-wrong-but-plausible
//   - No invented APT-group designations, malware-family names, CVE numbers
//   - American English throughout
//
// Distractor recycling: all 10 modified items use prose distinct from one another.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2.2-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // ─── §2.2.1 Common Threat Vectors ─────────────────────────────────────
  {
    videoId: "2.2.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Reducing the attack surface involves",
    intensity: "simple-pad",
    newOpts: [
      "Adding more network security monitoring tools at the perimeter layer",                       // 68
      "Eliminating unnecessary services, closing unused ports, removing default accounts",          // ✓ 81
      "Increasing user permissions and access rights to improve productivity",                       // 70
      "Deploying additional honeypots to detect ongoing reconnaissance attempts",                    // 72
    ],
  },
  {
    videoId: "2.2.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Default credentials on a newly deployed network device represent which type of vulnerability",
    intensity: "convention-B-edit",
    newOpts: [
      "Physical access attack vector",        // 29 (was "Physical attack vector" 22 — pad to balance)
      "Supply chain vulnerability",            // 26
      "Configuration-based attack vector",     // ✓ 33
      "Social engineering vector",             // 25
    ],
  },

  // ─── §2.2.2 Phishing ──────────────────────────────────────────────────
  // mc-2.2.2-0 (whaling), mc-2.2.2-1 (smishing), mc-2.2.2-4 (SPF) — held back as Convention B
  {
    videoId: "2.2.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Vishing is phishing conducted via",
    intensity: "convention-B-edit",
    newOpts: [
      "Voice phone calls",       // ✓ 17
      "SMS text messages",       // 17 (was "SMS text message" 16 — minor plural)
      "Email messaging",         // 15 (was "Email" 5 — pad to balance)
      "Social media DMs",        // 16 (was "Social media direct messages" 28 — trim to balance)
    ],
  },
  {
    videoId: "2.2.2", kind: "mc", index: 5,
    expectedOldStemPrefix: "DKIM provides which security property for email",
    intensity: "simple-pad",
    newOpts: [
      "Cryptographically signs the email to verify it came from the domain and wasn't altered in transit",   // ✓ 97
      "Encrypts the email body content end-to-end between sender and recipient",                              // 72
      "Publishes a list of authorized sender mail servers in DNS TXT records",                                // 70 (SPF-confusion distractor)
      "Blocks phishing emails automatically based on sender reputation scoring",                              // 72
    ],
  },

  // ─── §2.2.3 Impersonation ─────────────────────────────────────────────
  {
    videoId: "2.2.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "Pretexting involves",
    intensity: "simple-pad",
    newOpts: [
      "Sending malicious email attachments to a broad list of harvested email targets",                                // 79
      "Cracking encrypted passwords offline using a captured password hash",                                            // 67
      "Installing keyloggers remotely on the victim's compromised endpoint workstation",                                // 80
      "Fabricating a believable scenario to manipulate a victim into providing information or access",                  // ✓ 93
    ],
  },
  {
    videoId: "2.2.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Business Email Compromise (BEC) attacks primarily target",
    intensity: "rebuild",
    newOpts: [
      "Executives and finance staff to authorize fraudulent wire transfers or reveal credentials",                      // ✓ 89
      "Personal email accounts of low-ranking employees to harvest reusable credentials",                                // 79
      "Network infrastructure devices to deploy persistent command-and-control backdoors",                                // 81
      "Web application databases via SQL injection through unauthenticated contact forms",                                // 81
    ],
  },
  {
    videoId: "2.2.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "Typosquatting involves",
    intensity: "simple-pad",
    newOpts: [
      "Injecting malicious code into legitimate websites visited by victims",                                            // 67
      "Spoofing email sender addresses to bypass DMARC enforcement at the recipient",                                    // 76
      "Registering domain names similar to legitimate ones to catch users who mistype URLs",                              // ✓ 83
      "Cloning RFID access badges to bypass physical building access controls",                                          // 70
    ],
  },

  // ─── §2.2.4 Watering Hole Attacks ─────────────────────────────────────
  {
    videoId: "2.2.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "A threat actor wants to target engineers at an energy company. They compromise a popular ICS/SCADA industry news website",
    intensity: "convention-B-edit",
    newOpts: [
      "A watering hole attack",       // ✓ 22
      "Brand impersonation",           // 19
      "Spear phishing attack",         // 21 (was "Spear phishing" 14 — pad to balance)
      "A supply chain attack",         // 21
    ],
  },

  // ─── §2.2.5 Other Social Engineering Attacks ──────────────────────────
  // mc-2.2.5-1 (scarcity), mc-2.2.5-2 (tailgating) — held back as Convention B
  {
    videoId: "2.2.5", kind: "scen", index: 0,
    expectedOldStemPrefix: "An attacker calls reception, claims to be from their IT vendor",
    intensity: "multi-pad",
    newOpts: [
      "Impersonation/pretexting to gain physical access, and a physical keylogger installation once inside",            // ✓ 99
      "Vishing pretext over the phone and DLL injection of a remote process on the receptionist's PC",                    // 92
      "Tailgating silently through the lobby door and ARP poisoning of the conference room LAN",                          // 87
      "Baiting with a malicious USB drop in the parking lot and a watering hole attack on a vendor site",                // 95
    ],
  },
  {
    videoId: "2.2.5", kind: "mc", index: 4,
    expectedOldStemPrefix: "Which control MOST effectively mitigates social engineering attacks",
    intensity: "rebuild",
    newOpts: [
      "Network firewall rules at the perimeter edge",                                  // 46
      "Security awareness training for all employees",                                  // ✓ 45
      "Network intrusion detection systems on the LAN",                                  // 47
      "Stronger encryption of data at rest on endpoints",                                // 49
    ],
  },
];

// ─── Apply (mirror of fix-short-distractors-d2.4.mjs) ─────────────────────
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
