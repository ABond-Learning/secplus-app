// Sub-batch 2 — §1.2 cohort: pad short distractors on 18 of the 31 cohort items.
// 13 items are explicitly held back as Convention B (terms are already complete
// category names; short-on-short symmetry is exam-realistic). Each item below is
// tagged with its rework intensity:
//   simple-pad     = 1 short distractor padded
//   multi-pad      = 2 short distractors padded (sometimes also extending a 3rd
//                    to bring max/min ratio under 1.5×)
//   rebuild        = 3 short distractors all expanded with plausibly-wrong content
//
// Pattern: REPLACEMENTS array with safety-checked old-stem prefix; idempotent
// (refuses to apply if the slot doesn't hold the expected old stem; skips if
// already-applied detected). Mirrors rewrite-domain2-batch1.mjs.
//
// Per-item authoring constraints:
//   - Correct option text NOT modified (preserved verbatim)
//   - BEST/MOST framing in stem preserved
//   - Distractors are plausibly wrong, testing real misconceptions in §1.2
//   - American English
//   - messerVideo + subObjective + a index preserved
//   - Length target: max/min ratio ≤ 1.5× across all four options where natural;
//     accepted up to ~1.6× for items where strict ≤1.5× would force unnaturally
//     verbose distractors
//
// Items HELD BACK as Convention B (no fix in this batch):
//   mc-1.2.1-0  CIA acronym recall (4 acronym expansions, all ~30 chars)
//   mc-1.2.1-1  Confidentiality recall (4 CIA terms)
//   mc-1.2.1-2  Hospital offline = Availability (4 CIA terms)
//   mc-1.2.1-3  Modifying records = Integrity (4 CIA terms)
//   mc-1.2.1-4  Encryption protects Confidentiality (4 CIA terms)
//   mc-1.2.1-5  DDoS = Availability (4 CIA terms)
//   mc-1.2.1-7  Hashing = Integrity (4 CIA terms)
//   mc-1.2.2-1  Tech for non-rep = Digital signatures (4 short tech names)
//   mc-1.2.2-3  Non-rep related to which CIA = Integrity (4 CIA terms)
//   mc-1.2.3-2  AAA component for resource access (4 AAA terms)
//   mc-1.2.3-5  Something you have = Hardware token (4 auth-factor terms)
//   mc-1.2.6-1  Vehicle attack = Bollard (4 physical-control terms)
//   mc-1.2.7-1  DNS C2 redirect = DNS sinkhole (4 deception terms)
//
// Usage:
//   node scripts/fix-short-distractors-d1.2.mjs            # dry-run summary
//   node scripts/fix-short-distractors-d1.2.mjs --preview  # write to /tmp for validator
//   node scripts/fix-short-distractors-d1.2.mjs --write    # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d1.2-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// Each REPLACEMENT: { videoId, kind, index, expectedOldStemPrefix, intensity, newOpts }
// Correct option text MUST match current item.opts[item.a] exactly so we never
// accidentally rewrite the correct answer. The script verifies this before applying.
const REPLACEMENTS = [
  // ─── §1.2.1 The CIA Triad ─────────────────────────────────────────────
  {
    videoId: "1.2.1", kind: "mc", index: 6,
    expectedOldStemPrefix: "Which of the following BEST supports availability",
    intensity: "rebuild",
    newOpts: [
      "Redundant systems and backups",                              // ✓ correct (29)
      "Strong password policies for all administrative accounts",    // 56 (Aiden review-2: replaced "Hashing all stored data files…" — too plausibly availability-supporting)
      "Encrypting data at rest with AES-256 storage",                // 45
      "Strict access control lists on shared drives",                // 45
    ],
  },

  // ─── §1.2.2 Non-repudiation ───────────────────────────────────────────
  {
    videoId: "1.2.2", kind: "mc", index: 4,
    expectedOldStemPrefix: "Why does HMAC NOT provide non-repudiation",
    intensity: "rebuild",
    newOpts: [
      "It uses asymmetric keys that anyone can verify with a public key",  // 65 (Aiden review-2: replaced "asymmetric keys, which only protect confidentiality not authorship" — false claim about asymmetric crypto. New text: still wrong about HMAC since HMAC is symmetric, but doesn't make false claims about asymmetric.)
      "Both parties share the same key so either could have created it",   // ✓ 63
      "It only verifies integrity but not the origin of the message",      // 60
      "It depends on a centralized timestamp authority that may not exist",// 66
    ],
  },
  {
    videoId: "1.2.2", kind: "mc", index: 5,
    expectedOldStemPrefix: "If Alice signs a message with her private key",
    intensity: "rebuild",
    newOpts: [
      "That the message body has been encrypted by Alice for him",                    // 58
      "Bob's own identity has been authenticated to Alice's system",                  // 60
      "Alice sent it and the content hasn't been altered",                            // ✓ 49
      "That the message will reach Bob without delay or loss",                        // 54
    ],
  },
  {
    videoId: "1.2.2", kind: "mc", index: 6,
    expectedOldStemPrefix: "Which BEST supports non-repudiation in a corporate email",
    intensity: "multi-pad",
    newOpts: [
      "TLS encryption on email transport",                       // 33 (unchanged)
      "Mandatory email archiving with retention policy",         // 48
      "SPF records published in DNS for the sending domain",     // 52
      "S/MIME digital signatures on emails",                     // ✓ 35 (unchanged)
    ],
  },

  // ─── §1.2.3 AAA ───────────────────────────────────────────────────────
  {
    videoId: "1.2.3", kind: "mc", index: 4,
    expectedOldStemPrefix: "RADIUS is primarily used for which function",
    intensity: "multi-pad",
    newOpts: [
      "Centralized AAA for network access",                      // ✓ 34 (unchanged)
      "Encrypting all data at rest on internal servers",         // 48
      "Generating digital certificates",                          // 31 (unchanged)
      "Hashing user passwords for secure storage",               // 42
    ],
  },
  {
    videoId: "1.2.3", kind: "mc", index: 6,
    expectedOldStemPrefix: "A user provides a password AND a fingerprint",
    intensity: "rebuild",
    newOpts: [
      "Single-factor authentication only",                        // 33
      "Two-factor authentication",                                // ✓ 25 (unchanged)
      "Authorization for resource access",                        // 33
      "Identification claim by the user",                         // 32
    ],
  },

  // ─── §1.2.4 Gap Analysis ──────────────────────────────────────────────
  {
    videoId: "1.2.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "Which document is commonly used as a baseline for a security gap",
    intensity: "rebuild",
    newOpts: [
      "A vulnerability scan report from last quarter",            // 45
      "A risk register listing accepted residual risks",          // 47
      "A security framework like NIST CSF or ISO 27001",          // ✓ 47 (unchanged)
      "A firewall ruleset showing currently allowed traffic",     // 52
    ],
  },
  {
    videoId: "1.2.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "After a gap analysis, the organization should produce",
    intensity: "multi-pad",
    newOpts: [
      "A prioritized remediation plan to close identified gaps",  // ✓ 55 (unchanged)
      "An immediate report to regulators on all findings",        // 49
      "A full penetration test against critical assets",          // 47
      "A new firewall ruleset blocking flagged ports",            // 45
    ],
  },
  {
    videoId: "1.2.4", kind: "mc", index: 3,
    expectedOldStemPrefix: "How does a gap analysis differ from a penetration test",
    intensity: "rebuild",
    newOpts: [
      "A gap analysis is always automated using vulnerability scanning tools",        // 69
      "A gap analysis and a penetration test are essentially the same exercise",      // 70
      "A gap analysis tests technical controls; a pen test reviews policies and procedures", // 82 (Aiden review-2: replaced "requires elevated network access" fabricated claim with reversed-distinction misconception)
      "Gap analysis reviews controls against a standard; pen test actively exploits vulnerabilities", // ✓ 92
    ],
  },

  // ─── §1.2.5 Zero Trust ────────────────────────────────────────────────
  {
    videoId: "1.2.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "A Zero Trust model treats internal network users",
    intensity: "multi-pad",
    newOpts: [
      "As fully trusted by default after VPN login",            // 44 (Aiden review-2: trimmed from 56 to bring ratio under 1.5×)
      "As administrators by default within the corporate LAN",  // 53
      "With higher trust than external users",                  // 37 (unchanged)
      "The same as external users — requiring verification",    // ✓ 51 (unchanged)
    ],
  },
  {
    videoId: "1.2.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "Micro-segmentation in a Zero Trust architecture",
    intensity: "rebuild",
    newOpts: [
      "Encrypt all data at rest on internal corporate servers",                 // 54
      "Replace traditional firewalls with software-defined perimeters",         // 62
      "Speed up authentication across enterprise applications",                 // 54
      "Divide networks into small isolated zones to limit lateral movement",    // ✓ 67 (unchanged)
    ],
  },

  // ─── §1.2.6 Physical Security ─────────────────────────────────────────
  {
    videoId: "1.2.6", kind: "mc", index: 0,
    expectedOldStemPrefix: "A mantrap (access control vestibule) is designed to",
    intensity: "rebuild",
    newOpts: [
      "Prevent tailgating by allowing only one person through at a time",   // ✓ 64 (unchanged)
      "Monitor video footage from CCTV cameras at the entrance",            // 54
      "Encrypt all physical media leaving the secure building",             // 54
      "Alert the SOC after detecting an unauthorized entry attempt",        // 59
    ],
  },
  {
    videoId: "1.2.6", kind: "mc", index: 2,
    expectedOldStemPrefix: "A Faraday cage is used to",
    intensity: "simple-pad", // technically pads 3 distractors to balance ratio, but cohort tag = 1-short
    newOpts: [
      "Prevent unauthorized physical entry into a secured area",            // 55
      "Log all physical access events to secured rooms",                    // 47
      "Block electromagnetic signals to prevent RF eavesdropping",          // ✓ 57 (unchanged)
      "Store encryption keys in a tamper-resistant module",                 // 50
    ],
  },
  {
    videoId: "1.2.6", kind: "mc", index: 3,
    expectedOldStemPrefix: "Two-person integrity requires",
    intensity: "rebuild",
    newOpts: [
      "Two passwords to be entered for system login",                       // 44
      "Two-factor authentication on every critical account",                // 51
      "Two people present to perform sensitive operations",                 // ✓ 50 (unchanged)
      "Two security guards on patrol at all entry points",                  // 50
    ],
  },

  // ─── §1.2.7 Deception and Disruption ──────────────────────────────────
  {
    videoId: "1.2.7", kind: "mc", index: 0,
    expectedOldStemPrefix: "A honeypot is best described as",
    intensity: "rebuild",
    newOpts: [
      "A decoy system designed to lure and study attackers",                // ✓ 51 (unchanged)
      "A signature-based malware scanning system",                          // 41
      "A firewall rule set that blocks known attackers",                    // 47
      "A centralized password vault for admin accounts",                    // 47
    ],
  },
  {
    videoId: "1.2.7", kind: "mc", index: 2,
    expectedOldStemPrefix: "A honeytoken is",
    intensity: "rebuild",
    newOpts: [
      "A fake decoy server in the DMZ designed to attract attackers",                              // 60
      "A small piece of malware planted by attackers to test detection",                           // 63 (Aiden review-2: tests honeytoken vs decoy-malware confusion)
      "A network monitoring agent that detects unusual access patterns",                           // 63 (Aiden review-2: tests honeytoken vs IDS-style monitoring)
      "A decoy piece of data (credentials, file, API key) that alerts when accessed or used",      // ✓ 84
    ],
  },
  {
    videoId: "1.2.7", kind: "mc", index: 3,
    expectedOldStemPrefix: "The primary purpose of deception technologies",
    intensity: "multi-pad",
    newOpts: [
      "Detect attackers and gather intelligence about their techniques",    // ✓ 63 (unchanged)
      "Replace traditional firewalls and IPS appliances",                   // 49
      "Block attacks immediately at the network edge",                      // 46
      "Automatically patch vulnerabilities upon detection",                 // 51
    ],
  },
  {
    videoId: "1.2.7", kind: "mc", index: 4,
    expectedOldStemPrefix: "Which deception technology would BEST help detect attackers who have already",
    intensity: "rebuild",
    newOpts: [
      "Honeytokens and honeyfiles placed on internal systems",              // ✓ 53 (unchanged)
      "Firewall rules at the network perimeter",                            // 40
      "An IDS deployed at the network perimeter",                           // 41
      "DNS filtering of known-malicious domains",                           // 40
    ],
  },
];

// ─── Apply ────────────────────────────────────────────────────────────────
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
  // Safety check: stem matches expected prefix
  if (!item.q.startsWith(r.expectedOldStemPrefix)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — stem mismatch`);
    console.error(`  expected: "${r.expectedOldStemPrefix}…"`);
    console.error(`  actual:   "${item.q.slice(0, 80)}…"`);
    refused++;
    continue;
  }
  // Idempotency check: if all 4 new opts already match current opts, skip
  const sameOpts = r.newOpts.length === item.opts.length &&
    r.newOpts.every((o, i) => o === item.opts[i]);
  if (sameOpts) { skipped++; continue; }
  // Verify the correct option text in newOpts matches the current correct option
  const currentCorrect = item.opts[item.a];
  if (!r.newOpts.includes(currentCorrect)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
    console.error(`  current correct: "${currentCorrect}"`);
    console.error(`  newOpts: ${JSON.stringify(r.newOpts.map((o) => o.slice(0, 50)))}`);
    refused++;
    continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  // Apply
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
    console.log(`Audit preview:    node scripts/audit-catalogue-quality.mjs --path=${previewPath} --dim=length`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
