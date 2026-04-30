// Sub-batch 2 mega-pass — §1.3 cohort (Change Management): 12 cohort items, 11 modified.
//
// 1 Convention B holdback:
//   - mc-1.3.1-4  Change types (Emergency / Major / Standard change / RFC) — all four are
//     change-management category names with discrete exam meanings; short-on-short
//     symmetry is exam-realistic. RFC at 3 chars is the abbreviation for Request For
//     Change. Same Convention B reasoning as §2.2 SPF acronym recall.
//
// 4 rebuild (3-short distractors each):
//   - mc-1.3.1-1  Rollback plan purpose
//   - mc-1.3.1-2  CAB approval
//   - mc-1.3.2-0  Allow listing
//   - mc-1.3.2-4  Immutable infrastructure
//
// 6 multi-pad (2-short distractors each):
//   - mc-1.3.1-0  Primary purpose of CM
//   - mc-1.3.1-3  Emergency patch process
//   - mc-1.3.1-5  Change freeze
//   - mc-1.3.1-6  Unauthorized change
//   - mc-1.3.2-2  Allow listing > block listing
//   - mc-1.3.2-3  Sandboxing
//
// 1 simple-pad (1-short distractor):
//   - mc-1.3.2-1  Configuration baseline
//
// Watchpoints respected:
//   - Standard / normal / emergency change distinction preserved
//   - Configuration baseline distinct from policy/standard/procedure
//   - Allow listing (default-deny) vs block listing (default-allow) distinction strict
//   - Immutable infrastructure framing (replace, not patch) preserved
//   - Change Advisory Board (CAB) vs Change Management Board (CMB) — Messer uses CAB
//   - RFC = Request For Change, not RFC as in Internet RFCs
//   - Plausible-AND-false rule: every distractor describes a real-but-different control
//     or a misframing of the actual answer, never a true alternative answer

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d1.3-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // ─── §1.3.1 Change Management ─────────────────────────────────────────
  {
    videoId: "1.3.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "The primary purpose of change management",
    intensity: "multi-pad",
    newOpts: [
      "Speed up software deployments by removing review and approval bottlenecks from release pipelines",                  // 99
      "Ensure changes are assessed, approved, and documented to minimize risk",                                             // ✓ 70
      "Replace vulnerability scanning by enforcing automated configuration drift detection on every host",                  // 99
      "Automate patch deployment so emergency security fixes can roll out without management oversight",                    // 95
    ],
  },
  {
    videoId: "1.3.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "A rollback plan is used to",
    intensity: "rebuild",
    newOpts: [
      "Speed up future deployments by caching the binaries from prior successful releases",                                 // 84
      "Train new engineers by giving them documented examples of past production changes",                                  // 84
      "Archive old configurations indefinitely so auditors can reconstruct historical state",                                // 86
      "Revert to the previous working state if a change fails",                                                              // ✓ 54
    ],
  },
  {
    videoId: "1.3.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Which group reviews and approves significant changes",
    intensity: "rebuild",
    newOpts: [
      "The CISO acting alone — no committee review is required for production changes",                                     // 79
      "The penetration testing team that validates the security posture of each proposed change",                            // 92
      "Help desk staff who escalate changes to the on-call engineer for after-hours review",                                  // 84
      "Change Advisory Board (CAB)",                                                                                          // ✓ 27
    ],
  },
  {
    videoId: "1.3.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "An emergency patch for a critical zero-day should",
    intensity: "multi-pad",
    newOpts: [
      "Follow an expedited change management process and be documented afterwards",                                          // ✓ 74
      "Skip all documentation since the urgency justifies bypassing every review step",                                       // 80
      "Bypass testing entirely — emergency patches are pre-validated by the vendor",                                          // 76
      "Require no approval — engineering teams self-authorize emergency security work",                                       // 79
    ],
  },
  // mc-1.3.1-4 — Convention B holdback (Emergency/Major/Standard/RFC change-type
  // terminology). No replacement.
  {
    videoId: "1.3.1", kind: "mc", index: 5,
    expectedOldStemPrefix: "A change freeze is implemented because",
    intensity: "multi-pad",
    newOpts: [
      "All vulnerabilities have been patched and no further changes are technically required",                                // 87
      "The rollback plan has failed in testing and engineers cannot ship without one",                                         // 80
      "The CAB has not met recently and requires fresh quorum before approving anything",                                     // 83
      "A high-risk period requires stability — no changes permitted",                                                          // ✓ 60
    ],
  },
  {
    videoId: "1.3.1", kind: "mc", index: 6,
    expectedOldStemPrefix: "An administrator changes a firewall rule without submitting an RFC",
    intensity: "multi-pad",
    newOpts: [
      "Acceptable for minor changes since firewall rule edits rarely cause production impact",                                 // 88
      "Standard practice for firewall administrators with senior-level operational privileges",                                 // 88
      "Required in emergency situations — the RFC step can always be skipped under time pressure",                              // 91
      "An unauthorized change that violates change management policy",                                                         // ✓ 61
    ],
  },

  // ─── §1.3.2 Technical Change Management ───────────────────────────────
  {
    videoId: "1.3.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "Which process ensures only approved software versions can execute",
    intensity: "rebuild",
    newOpts: [
      "Allow listing",                                                                                                        // ✓ 13
      "Change management — approving the introduction of new software through CAB review",                                    // 84
      "Vulnerability scanning — checking installed software versions for known CVEs and CVSS scores",                          // 92
      "Penetration testing — attempting to bypass installed software controls during scheduled engagements",                    // 96
    ],
  },
  {
    videoId: "1.3.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "A configuration baseline is used to",
    intensity: "simple-pad",
    newOpts: [
      "Document and enforce the standard secure state of a system",                                                          // ✓ 58
      "Define maximum user permissions allowed across each role in the directory",                                            // 75
      "Scan for vulnerabilities by comparing installed software versions to a CVE feed",                                       // 81
      "Apply default operating-system security profiles to every newly imaged endpoint at enrollment time",                    // 100
    ],
  },
  {
    videoId: "1.3.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Allow listing is considered more secure than block listing because",
    intensity: "multi-pad",
    newOpts: [
      "It requires less ongoing maintenance than maintaining a long block list of bad files",                                 // 88
      "It does not require administrative rights to enforce on standard endpoint workstations",                                // 89
      "It is faster to implement initially because the list of approved apps is usually small",                                 // 87
      "It blocks everything by default and only permits approved applications",                                                // ✓ 70
    ],
  },
  {
    videoId: "1.3.2", kind: "mc", index: 3,
    expectedOldStemPrefix: "Sandboxing a suspicious file is used to",
    intensity: "multi-pad",
    newOpts: [
      "Execute it in an isolated environment to observe behavior without risking production systems",                          // ✓ 92
      "Encrypt the file using a key derived from its hash for safe long-term archival storage",                                  // 87
      "Permanently delete the file by zeroing its disk blocks before the next backup window",                                   // 84
      "Forward the file directly to the antivirus vendor for inclusion in their signature feed",                                 // 87
    ],
  },
  {
    videoId: "1.3.2", kind: "mc", index: 4,
    expectedOldStemPrefix: "An immutable infrastructure approach means",
    intensity: "rebuild",
    newOpts: [
      "Production systems are deployed once at install and then never receive any updates whatsoever",                         // 92
      "Operating systems are configured so administrators cannot change any settings after deployment",                          // 95
      "All data on running systems is automatically encrypted at rest using filesystem-level encryption",                        // 96
      "Instead of patching running systems, they are replaced with pre-configured new instances",                                // ✓ 88
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
    console.error(`  expected: "${r.expectedOldStemPrefix}…"`);
    console.error(`  actual:   "${item.q.slice(0, 80)}…"`);
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

console.log(`\n§1.3 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
  console.log(`Wrote to ${target}`);
}
