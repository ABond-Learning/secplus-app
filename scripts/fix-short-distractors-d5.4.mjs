// Sub-batch 2 mega-pass — §5.4 cohort (Compliance/Privacy): 4 cohort items, 4 modified.
//
// 0 Convention B holdbacks.
//
// 1 multi-pad:
//   - mc-5.4.2-0  GDPR data minimization
//
// 3 simple-pad:
//   - mc-5.4.1-1  GDPR penalties
//   - mc-5.4.2-1  Privacy by design
//   - mc-5.4.2-2  Right to erasure
//
// Watchpoints respected:
//   - GDPR fines: up to €20M or 4% global annual turnover, whichever higher.
//   - Privacy by design (PbD): bake privacy into design phase, not retrofit.
//   - Data minimization vs purpose limitation vs storage limitation — distinct GDPR
//     principles.
//   - Right to erasure (Article 17) vs right of access (Article 15) vs data portability
//     (Article 20) — distinct GDPR rights.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d5.4-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "5.4.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Non-compliance with GDPR can result in",
    intensity: "simple-pad",
    newOpts: [
      "Fines up to €20 million or 4% of global annual turnover — whichever is higher — plus reputational damage",  // ✓ 104
      "A warning letter only — GDPR has no monetary penalty mechanism beyond regulatory comment",                    // 92
      "Loss of technical certifications only — no monetary fines or business-operating constraints",                  // 95
      "Criminal prosecution of the CISO only — the corporate entity faces no penalty under the GDPR framework",      // 105
    ],
  },
  {
    videoId: "5.4.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "The GDPR principle of data minimization requires organizations to",
    intensity: "multi-pad",
    newOpts: [
      "Collect and process only personal data that is necessary for the specific purpose stated — not more",          // ✓ 99
      "Delete all collected personal data after 30 days regardless of business need or legal hold status",              // 99
      "Encrypt all data at rest and in transit using AES-256 with hardware-rooted keys for confidentiality",            // 100
      "Share data minimally across departments by routing every cross-departmental query through compliance",          // 100
    ],
  },
  {
    videoId: "5.4.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "Privacy by design means",
    intensity: "simple-pad",
    newOpts: [
      "Adding privacy controls after deployment as a follow-up project once the system is in production",            // 99
      "Making all data fields private by default and requiring explicit opt-in for any data sharing",                  // 95
      "Integrating privacy protections into systems and processes from the initial design phase — not as an afterthought",  // ✓ 113
      "Encrypting all data at rest with envelope encryption tied to a per-tenant key in the HSM",                       // 89
    ],
  },
  {
    videoId: "5.4.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Under GDPR, the right to erasure allows individuals to",
    intensity: "simple-pad",
    newOpts: [
      "Erase any criminal records held about them by national law enforcement databases on request",                  // 96
      "Delete data held by any organization worldwide regardless of jurisdiction or legal-hold status",                  // 99
      "Request deletion of their personal data under certain circumstances — e.g. when it's no longer needed or consent is withdrawn",  // ✓ 125
      "Access and export all their personal data from any organization that holds it in machine-readable form",         // 105
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
    refused++; continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\n§5.4 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
