// Sub-batch 2 — §1.4 cohort (crypto + certificates): pad short distractors on
// 19 of 28 cohort items. 9 items held back as Convention B.
//
// Same shape as fix-short-distractors-d1.2.mjs: REPLACEMENTS array with
// safety-checked old-stem prefix, idempotent, refuses on stem mismatch.
//
// Convention B holdbacks (no fix this batch):
//   mc-1.4.1-1  "PKI is used to manage" — short-term recall
//   mc-1.4.1-6  Asymmetric encryption examples (AES/3DES/ChaCha20/RSA — algorithm names)
//   mc-1.4.2-1  TLS protects data in which state (in transit/in use/at rest/in backup)
//   mc-1.4.2-5  TLS replaced SSL (TLA recall: SSH/TLS/IPsec/SFTP)
//   mc-1.4.4-1  BitLocker hardware (TPM/HSM/UEFI/Smart card)
//   mc-1.4.4-3  Best protection for private keys (HSM/TPM/etc) — correct = "A dedicated HSM" (15 chars), preserve-correct rule prevents Convention A expansion
//   mc-1.4.6-0  256-bit hashing standard (SHA-256/MD5/SHA-1/SHA-512)
//   mc-1.4.7-2  Blockchain CIA property (Integrity and non-repudiation/Confidentiality/Availability/Authentication)
//
// Convention B holdbacks with light edit:
//   mc-1.4.6-1  Salt vs Pepper vs Nonce vs IV — IV trimmed from "(Initialization Vector)" expansion to bare "IV"
//               for Convention B short-on-short symmetry. Correct option ("Salt") unchanged.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d1.4-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // ─── §1.4.1 PKI ───────────────────────────────────────────────────────
  {
    videoId: "1.4.1", kind: "mc", index: 4,
    expectedOldStemPrefix: "An intermediate CA in a PKI hierarchy is used to",
    intensity: "rebuild",
    newOpts: [
      "Self-sign and issue root certificates for the entire PKI tree",                                  // 61
      "Maintain the master Certificate Revocation List for the entire PKI",                             // 66 (Aiden review-2: replaced "Revoke certificates that have expired or been compromised" — true claim. New: false because CRLs are per-issuing-CA.)
      "Store the root CA private keys in protected hardware escrow",                                    // 59
      "Issue certificates on behalf of the root CA, protecting the root from direct exposure",          // ✓ 85
    ],
  },

  // ─── §1.4.2 Encrypting Data ───────────────────────────────────────────
  {
    videoId: "1.4.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Full disk encryption (FDE) primarily protects against",
    intensity: "rebuild",
    newOpts: [
      "Unauthorized access to data when a device is lost or stolen",     // ✓ 59
      "Network eavesdropping while data is in transit",                   // 46
      "Malware execution after the system has booted",                    // 46
      "Phishing attacks targeting user credentials",                      // 44
    ],
  },
  {
    videoId: "1.4.2", kind: "mc", index: 4,
    expectedOldStemPrefix: "Cryptographic erasure is",
    intensity: "simple-pad",
    newOpts: [
      "Destroying the encryption key to render encrypted data permanently unreadable",   // ✓ 77
      "Physically destroying the storage media using shredding",                           // 55
      "Overwriting all data on the disk multiple times with random patterns",              // 68
      "Deleting the file system index from the storage device",                            // 54
    ],
  },

  // ─── §1.4.3 Key Exchange ──────────────────────────────────────────────
  {
    videoId: "1.4.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "Diffie-Hellman is used to",
    intensity: "rebuild",
    newOpts: [
      "Sign digital certificates with the issuer's private key",          // 54
      "Establish a shared secret over an insecure public channel",        // ✓ 57
      "Hash user passwords stored in a database",                          // 40
      "Encrypt email attachments using a public key",                     // 44
    ],
  },
  {
    videoId: "1.4.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Perfect Forward Secrecy (PFS) ensures that",
    intensity: "simple-pad",
    newOpts: [
      "Encryption keys never expire and remain valid forever",                          // 53
      "One key is reused for every encryption session over time",                       // 56
      "All keys are stored permanently in a key escrow database",                       // 56
      "Compromising the long-term private key does not expose past session keys",       // ✓ 72
    ],
  },
  {
    videoId: "1.4.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "Why is RSA key exchange being phased out of modern TLS",
    intensity: "multi-pad",
    newOpts: [
      "RSA key exchange is no longer mathematically secure against modern computers",  // 75 (Aiden review-2: replaced "has known cryptographic vulnerabilities" — too vague-and-true. Cleaner false claim about RSA's mathematical security.)
      "RSA encryption is too slow for modern hardware speeds",                         // 53
      "RSA key exchange requires a separate certificate per session",                  // 60
      "RSA key exchange does not provide Perfect Forward Secrecy",                     // ✓ 57
    ],
  },

  // ─── §1.4.4 Encryption Technologies ───────────────────────────────────
  {
    videoId: "1.4.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "A TPM (Trusted Platform Module) is used to",
    intensity: "simple-pad",
    newOpts: [
      "Provide secure internet access through a trusted hardware module",                          // 64
      "Block malware at the corporate network perimeter via firewall rules",                       // 68
      "Securely store cryptographic keys and support hardware-based encryption tied to a device",  // ✓ 88
      "Manage user passwords centrally in Active Directory user groups",                           // 63
    ],
  },
  {
    videoId: "1.4.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "A secure enclave is",
    intensity: "multi-pad",
    newOpts: [
      "A physically locked and access-controlled secure server room with biometrics",                  // 76
      "An encrypted backup storage location managed entirely by the OS itself",                        // 70
      "A type of VPN tunnel used for secure remote administration of the device",                      // 72
      "An isolated processor area that protects sensitive code and data from the main operating system", // ✓ 95
    ],
  },

  // ─── §1.4.5 Obfuscation ───────────────────────────────────────────────
  {
    videoId: "1.4.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "Tokenization replaces sensitive data with",
    intensity: "simple-pad",
    newOpts: [
      "A random non-sensitive token that maps back to the original in a secure vault",   // ✓ 77
      "An encrypted version of the original data using AES-256",                          // 55
      "A cryptographic hash of the original data using SHA-256",                          // 55
      "A compressed version of the original data using zlib compression",                 // 64
    ],
  },
  {
    videoId: "1.4.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "Data masking is used to",
    intensity: "rebuild",
    newOpts: [
      "Permanently delete and overwrite sensitive data records in production",                                       // 69
      "Monitor and audit-log all access to sensitive data files for review",                                          // 66
      "Encrypt backup data at rest using strong industry-standard ciphers",                                           // 65
      "Replace real data with realistic-looking fake data so developers can test without real PII",                  // ✓ 90
    ],
  },
  {
    videoId: "1.4.5", kind: "mc", index: 3,
    expectedOldStemPrefix: "How does steganography differ from encryption",
    intensity: "simple-pad",
    newOpts: [
      "Steganography is always cryptographically stronger than encryption",                          // 66
      "Steganography hides the existence of the message; encryption hides its content",              // ✓ 78
      "They are essentially the same cryptographic technique",                                       // 53
      "Steganography is more efficient than encryption for protecting large files",                 // 74 (Aiden review-2: replaced "Encryption is illegal in most countries…" — legally misleading.)
    ],
  },

  // ─── §1.4.6 Hashing and Digital Signatures ────────────────────────────
  {
    videoId: "1.4.6", kind: "mc", index: 2,
    expectedOldStemPrefix: "Why is MD5 no longer recommended for security purposes",
    intensity: "rebuild",  // Aiden review-2: upgraded from multi-pad to full distractor rebuild — the original "too slow / asymmetric / requires password" filler distractors didn't test real misconceptions, and expanding them reinforced false claims.
    newOpts: [
      "It produces fixed-length 128-bit output regardless of input size",                          // 64 (true claim framed as flaw — tests "shorter output = vulnerable?" misconception)
      "It cannot be used with a salt to defend against rainbow tables",                            // 62 (false — MD5 can be salted; tests salt-MD5 misconception)
      "It was deprecated by NIST in 2008 due to quantum computing threats",                        // 66 (false reason — actually deprecated due to collision attacks)
      "It produces collision vulnerabilities — different inputs can produce the same hash",        // ✓ 82
    ],
  },
  {
    // Aiden review-2: Convention B trim — original "IV (Initialization Vector)" (26 chars) was anomalously long
    // vs ✓Salt (4) / Pepper (6) / Nonce (5). Trim IV to bare "IV" so all four are short term-recall options
    // under Convention B (short-on-short symmetry). Intentionally accepts ratio 6/2 = 3.0 — exam-realistic for
    // crypto-term recall.
    videoId: "1.4.6", kind: "mc", index: 1,
    expectedOldStemPrefix: "What is added to a password BEFORE hashing to defend against rainbow table attacks",
    intensity: "convention-B-trim",
    newOpts: [
      "IV",        // 2  (was 26: "IV (Initialization Vector)")
      "Salt",      // ✓ 4
      "Pepper",    // 6
      "Nonce",     // 5
    ],
  },
  {
    videoId: "1.4.6", kind: "mc", index: 4,
    expectedOldStemPrefix: "HMAC provides which security properties",
    intensity: "simple-pad",
    newOpts: [
      "Message encryption and compression of payload data",                            // 50
      "Non-repudiation and full message confidentiality",                              // 48
      "Integrity and authentication using a shared secret key",                        // ✓ 54
      "Key exchange and digital signature generation",                                  // 45
    ],
  },

  // ─── §1.4.7 Blockchain ────────────────────────────────────────────────
  {
    videoId: "1.4.7", kind: "mc", index: 0,
    expectedOldStemPrefix: "A blockchain is best described as",
    intensity: "simple-pad",
    newOpts: [
      "A centralized encrypted database for storing all transactions",                                  // 61
      "A distributed immutable ledger where each block contains a hash of the previous block",          // ✓ 85
      "A type of symmetric encryption algorithm used widely in banking",                                // 63
      "A certificate authority that issues and revokes digital certificates",                            // 68
    ],
  },

  // ─── §1.4.8 Certificates ──────────────────────────────────────────────
  {
    videoId: "1.4.8", kind: "mc", index: 1,
    expectedOldStemPrefix: "A wildcard certificate (*.example.com) covers",
    intensity: "multi-pad",
    newOpts: [
      "All first-level subdomains of example.com",                       // ✓ 41
      "Only the example.com root domain itself",                         // 39
      "Multiple unrelated domains in one certificate",                   // 45
      "Only internal IP addresses on the LAN",                           // 37
    ],
  },
  {
    videoId: "1.4.8", kind: "mc", index: 2,
    expectedOldStemPrefix: "A self-signed certificate is signed by",
    intensity: "rebuild",
    newOpts: [
      "The entity that owns it, using its own private key",              // ✓ 50
      "An intermediate certificate authority in the PKI",                // 48
      "A trusted root CA at the top of the chain",                       // 41
      "A separate registration authority entity",                         // 40
    ],
  },
  {
    videoId: "1.4.8", kind: "mc", index: 3,
    expectedOldStemPrefix: "Certificate pinning is used to",
    intensity: "multi-pad",
    newOpts: [
      "Prevent MITM attacks by hardcoding the expected certificate or public key in an application",   // ✓ 91
      "Speed up TLS handshakes by skipping the certificate validation step",                            // 67
      "Automatically renew certificates before they reach their expiration date",                       // 72
      "Generate Certificate Signing Requests to send to the CA for signing",                            // 67
    ],
  },
  {
    videoId: "1.4.8", kind: "mc", index: 4,
    expectedOldStemPrefix: "What is a CSR (Certificate Signing Request)",
    intensity: "multi-pad",
    newOpts: [
      "A formal revocation notice sent from the certificate holder to the issuing CA",                                              // 77
      "A cryptographic hash of an existing certificate used for fingerprint comparison",                                            // 79
      "A firewall rule that controls HTTPS traffic flow to a specific application",                                                  // 74
      "A document generated by the requester containing their public key and identity info, sent to a CA for signing",              // ✓ 109
    ],
  },
  {
    videoId: "1.4.8", kind: "mc", index: 5,
    expectedOldStemPrefix: "OCSP stapling improves performance by",
    intensity: "multi-pad",
    newOpts: [
      "Caching trusted certificates locally on each client browser to allow reuse later",                                                                            // 80
      "Compressing the certificate chain data using standard zlib compression algorithms",                                                                          // 81
      "Having the server include the OCSP revocation response in the TLS handshake, eliminating a separate client lookup",                                          // ✓ 113
      "Reducing the public key size used during handshake to speed up TLS processing",                                                                                // 78
    ],
  },
];

// ─── Apply (same shape as fix-short-distractors-d1.2.mjs) ─────────────────
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
    console.log(`Audit preview:    node scripts/audit-short-distractor-cohort.mjs --path=${previewPath} --domain=1`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
