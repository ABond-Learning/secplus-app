// Sub-batch 2 mega-pass — §3.3 cohort (Data Types and Protection): 8 cohort items, 6 modified.
//
// 2 Convention B holdbacks:
//   - mc-3.3.1-2 (PHI/HIPAA recall: PCI DSS / GDPR / SOX / HIPAA — regulation-name term recall)
//   - mc-3.3.3-2 (data-protection technique recall: Encryption / Data masking / Tokenization /
//     Hashing — control-category term recall)
//
// 1 rebuild:
//   - mc-3.3.1-0  Data classification purpose
//
// 3 multi-pad:
//   - mc-3.3.1-1  PII definition
//   - mc-3.3.2-2  States of data not protected
//   - mc-3.3.3-1  IRM vs encryption
//
// 2 simple-pad:
//   - mc-3.3.1-3  Legal hold
//   - mc-3.3.2-1  Data in use difficulty
//
// Watchpoints respected:
//   - States of data: in motion / at rest / in use — distinct.
//   - Encryption protects different states differently; data in use requires plaintext
//     in CPU registers (secure enclaves, homomorphic encryption are advanced controls).
//   - Tokenization (substitute with non-sensitive token) vs masking (realistic-but-fake)
//     vs anonymization (irreversibly remove PII) vs pseudonymization (replace identifiers
//     reversibly with key) — distinct.
//   - PII: directly identifying or combination-identifying data; not all employee records,
//     not just government IDs.
//   - PHI/HIPAA = US health; GDPR = EU privacy; PCI DSS = payment cards; SOX = US public-
//     company finance — distinct jurisdictions/scopes.
//   - IRM (Information Rights Management) extends file-level access control with USAGE
//     control (read-only, no-print, time-limited) — different from encryption alone.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d3.3-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "3.3.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "Data classification is used to",
    intensity: "rebuild",
    newOpts: [
      "Determine appropriate protection levels and handling requirements based on data sensitivity",      // ✓ 91
      "Encrypt all data equally regardless of business value or regulatory exposure for simplicity",      // 91
      "Monitor who accesses data so the SIEM can correlate per-user data access patterns over time",      // 92
      "Backup data automatically based on a uniform retention schedule applied to every dataset",         // 90
    ],
  },
  {
    videoId: "3.3.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "PII (Personally Identifiable Information) is best described as",
    intensity: "multi-pad",
    newOpts: [
      "Any data stored in a corporate database that has more than ten records",                                              // 79
      "Only government-issued identification numbers (SSN, driver's license, passport)",                                     // 80
      "All employee records held in the HR system regardless of identifying content",                                        // 80
      "Data that identifies or could be used to identify a specific individual — name + SSN, email, fingerprint",            // ✓ 104
    ],
  },
  // mc-3.3.1-2 — Convention B holdback (PCI DSS / GDPR / SOX / HIPAA term recall).
  {
    videoId: "3.3.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "An organization places a legal hold on email archives related to a lawsuit",
    intensity: "simple-pad",
    newOpts: [
      "The emails must be immediately deleted to comply with the litigation request",                                        // 78
      "Only lawyers can access the emails — IT and management lose all read rights",                                          // 81
      "The emails must be encrypted with a court-managed key escrowed for the duration of the case",                          // 92
      "The emails cannot be deleted or modified — they must be preserved exactly as they are for litigation",                  // ✓ 100
    ],
  },
  {
    videoId: "3.3.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "Data in use is the most difficult state to protect because",
    intensity: "simple-pad",
    newOpts: [
      "It travels across insecure networks where TLS cipher selection is not under defender control",                         // 95
      "It uses too much memory to encrypt without a measurable performance penalty",                                          // 78
      "It is always stored insecurely in the operating system's swap and pagefile by default",                                // 89
      "The data must be decrypted and in plaintext for the CPU to process it — encryption must be removed temporarily",       // ✓ 110
    ],
  },
  {
    videoId: "3.3.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "An organization encrypts all laptop drives and uses HTTPS for all web applications",
    intensity: "multi-pad",
    newOpts: [
      "Data in use (being processed in RAM — not protected by either control)",                                              // ✓ 70
      "Data in transit (covered by HTTPS) — already protected against on-the-wire interception",                              // 92
      "Data at rest (covered by FDE) — laptop drives are encrypted at the block-device layer",                                 // 88
      "All states are protected — FDE plus HTTPS covers every data state the organization handles",                            // 91
    ],
  },
  {
    videoId: "3.3.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "Information Rights Management (IRM) differs from encryption in that",
    intensity: "multi-pad",
    newOpts: [
      "IRM controls HOW authorized users can use a document (read-only, no-print, time-limited) — not just who can access it",  // ✓ 117
      "IRM uses stronger encryption algorithms than what enterprise file encryption typically deploys",                          // 95
      "IRM is only for email and cannot apply to documents stored in cloud collaboration suites",                                // 89
      "Encryption is more secure than IRM because IRM relies entirely on the rendering application",                              // 92
    ],
  },
  // mc-3.3.3-2 — Convention B holdback (Encryption / Data masking / Tokenization / Hashing — data-protection technique recall).
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

console.log(`\n§3.3 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length} (2 holdbacks excluded)`);
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
