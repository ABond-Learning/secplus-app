// Sub-batch 2 mega-pass — §5.6 cohort (Security Awareness/User Training): 4 cohort items, 4 modified.
//
// 0 Convention B holdbacks.
//
// 0 rebuild.
//
// 3 multi-pad:
//   - mc-5.6.1-0  Phishing simulations
//   - mc-5.6.1-1  Role-based training value
//   - mc-5.6.2-0  Awareness training scope
//
// 1 simple-pad:
//   - mc-5.6.2-1  Just-in-time training
//
// Watchpoints respected:
//   - Phishing simulations measure susceptibility, identify training needs, and gauge
//     program effectiveness — not punishment.
//   - Role-based training tailors content to specific threats per role (BEC for finance,
//     secure coding for developers, social engineering for help desk).
//   - Awareness training scope: all employees + contractors + vendors with access — every
//     human with system access is a potential attack vector.
//   - Just-in-time training is contextual and immediate (when a risk decision occurs).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d5.6-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "5.6.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "Phishing simulations in security awareness programs are used to",
    intensity: "multi-pad",
    newOpts: [
      "Discipline employees who fail by reporting failures up to their manager with a formal warning",       // 100
      "Replace security technology like email gateway filters with a behavioral compensating control",         // 95
      "Send real phishing emails to external targets to test the maturity of those organizations' defenses",   // 102
      "Test employees' ability to recognize phishing and identify those needing additional training — measuring program effectiveness",  // ✓ 126
    ],
  },
  {
    videoId: "5.6.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Role-based security training is more effective than generic training because",
    intensity: "multi-pad",
    newOpts: [
      "It is cheaper to produce a single role-tailored module than a single generic training module",         // 96
      "It can be delivered online only without any in-person component or instructor-led time",                 // 91
      "It requires fewer instructors because each role-tailored module is shorter than the generic version",   // 102
      "Content is tailored to the specific threats and scenarios relevant to each role — finance staff get BEC training; developers get secure coding",  // ✓ 142
    ],
  },
  {
    videoId: "5.6.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "Security awareness training should be completed by",
    intensity: "multi-pad",
    newOpts: [
      "All employees AND contractors and vendors who have access to organizational systems — everyone is a potential attack vector",  // ✓ 123
      "Only IT and security staff who handle production system access on a routine operational basis",                                  // 95
      "Only executives and managers because they decide acceptable-use boundaries for their own teams",                                  // 96
      "Only staff who handle sensitive data such as PII, PHI, payment cards, or financial transactions",                                 // 96
    ],
  },
  {
    videoId: "5.6.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "Just-in-time security training is delivered",
    intensity: "simple-pad",
    newOpts: [
      "Annually in a classroom session covering the standard awareness curriculum for all employees",         // 96
      "Only after a security incident has occurred and lessons learned point to a specific gap",                // 92
      "At the precise moment an employee encounters a security decision or risk — when the lesson is most relevant and memorable",  // ✓ 121
      "During initial employee onboarding only — covered once during the first week and never repeated",        // 96
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

console.log(`\n§5.6 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
