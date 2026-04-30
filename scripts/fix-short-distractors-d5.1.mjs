// Sub-batch 2 mega-pass — §5.1 cohort (Policies/Standards/Procedures/Roles): 11 cohort items, 10 modified.
//
// 1 Convention B holdback:
//   - mc-5.1.4-4 (Separation of duties recall: Least privilege / Job rotation /
//     Separation of duties / Mandatory vacation — admin-control term recall)
//
// 1 rebuild:
//   - mc-5.1.4-0  GDPR scope
//
// 2 multi-pad:
//   - mc-5.1.1-1  AUP
//   - mc-5.1.4-1  Separation of duties prevents fraud
//
// 7 simple-pad:
//   - mc-5.1.1-0  Policy vs procedure
//   - mc-5.1.2-0  Standard vs policy
//   - mc-5.1.2-1  PCI/HIPAA external
//   - mc-5.1.3-1  Security playbook
//   - mc-5.1.4-2  72-hour breach notification
//   - mc-5.1.5-0  Data owner
//   - mc-5.1.5-1  Data processor
//
// Watchpoints respected:
//   - Governance hierarchy: Policy (intent) → Standard (specific requirements) →
//     Procedure (step-by-step) → Guideline (recommendation) — distinct documents.
//   - GDPR (EU) / HIPAA (US health) / PCI DSS (payment cards) / SOX (US public-co
//     finance) — distinct.
//   - Data controller (decides why/how) vs data processor (acts on controller's
//     behalf) — GDPR roles distinct.
//   - Separation of duties (split a single sensitive process across multiple actors)
//     vs least privilege (restrict each user to minimum access) vs job rotation
//     (cycle people through roles to detect fraud) vs mandatory vacation (force
//     coverage gap to surface misconduct) — all administrative controls but distinct.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d5.1-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "5.1.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "What distinguishes a security policy from a security procedure",
    intensity: "simple-pad",
    newOpts: [
      "Policies are technical documents written by engineers; procedures are administrative documents written by HR",  // 110
      "Policies state high-level management intent and requirements; procedures provide step-by-step instructions for implementing policy",  // ✓ 130
      "Policies are written by individual contributors at the engineer level; procedures are signed by senior management",                     // 116
      "They are the same document under different names used by different industry frameworks",                                                // 89
    ],
  },
  {
    videoId: "5.1.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "An Acceptable Use Policy (AUP) must be",
    intensity: "multi-pad",
    newOpts: [
      "Communicated to and signed by all employees — establishing permitted and prohibited uses of organizational technology",  // ✓ 117
      "Kept confidential from employees so attackers cannot harvest the document for social-engineering reconnaissance",         // 110
      "Written only for IT staff because end users do not need to understand acceptable-use boundaries",                          // 95
      "Updated daily to reflect every operational change in production system configurations",                                     // 86
    ],
  },
  {
    videoId: "5.1.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "A security standard differs from a policy in that",
    intensity: "simple-pad",
    newOpts: [
      "Standards are written exclusively by external regulators; organizations cannot author internal standards",                  // 102
      "Standards are optional reference documents; policies are mandatory regulatory submissions to auditors",                       // 99
      "Standards provide specific, measurable requirements",                                                                          // ✓ 51
      "They are identical documents distinguished only by which executive signed off on them initially",                             // 92
    ],
  },
  {
    videoId: "5.1.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "PCI DSS and HIPAA are examples of",
    intensity: "simple-pad",
    newOpts: [
      "Internal organizational standards developed and ratified by a single company's compliance team",                              // 92
      "External standards imposed by regulation",                                                                                      // ✓ 40
      "Optional best-practice frameworks adopted voluntarily without legal or contractual consequence",                                // 92
      "Security policies signed by an executive sponsor inside one organization for internal governance",                              // 96
    ],
  },
  {
    videoId: "5.1.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "A security playbook is used during incident response to",
    intensity: "simple-pad",
    newOpts: [
      "Provide general security awareness information to all employees during the annual training cycle",                            // 95
      "Provide detailed step-by-step procedures specific to a type of incident — ensuring consistent, correct response every time",  // ✓ 122
      "Replace the incident response team by automating every detection-to-recovery action without human review",                     // 100
      "Document the broad governance security policies covering retention, classification, and access scope",                          // 99
    ],
  },
  {
    videoId: "5.1.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "GDPR (General Data Protection Regulation) applies to",
    intensity: "rebuild",
    newOpts: [
      "Only EU-based organizations whose corporate headquarters reside in an EU/EEA member state",                                    // 90
      "Any organization that processes personal data of EU/EEA residents — regardless of where the organization is located",          // ✓ 115
      "Only government organizations in EU member states that handle citizen registry data centrally",                                  // 95
      "Only large enterprises with annual EU-derived revenue exceeding the GDPR turnover threshold",                                    // 92
    ],
  },
  {
    videoId: "5.1.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "Separation of duties prevents fraud by",
    intensity: "multi-pad",
    newOpts: [
      "Using stronger encryption on the records that document each privileged operation in the audit trail",                            // 100
      "Limiting access to one person who is fully accountable and held responsible if anything goes wrong",                              // 97
      "Requiring multiple people to complete a sensitive process — making it impossible for one person to commit fraud without collusion",  // ✓ 129
      "Logging all financial transactions to a tamper-evident WORM volume reviewed monthly",                                              // 84
    ],
  },
  {
    videoId: "5.1.4", kind: "mc", index: 2,
    expectedOldStemPrefix: "A data breach notification requirement of 72 hours means",
    intensity: "simple-pad",
    newOpts: [
      "72 hours to fix the breach by remediating the underlying vulnerability and rebuilding compromised systems",                       // 110
      "72 hours to discover the breach before regulators consider the response window to have been missed",                              // 99
      "72 hours to complete the investigation including root cause analysis and final containment confirmation",                          // 102
      "Affected parties and supervisory authorities must be notified within 72 hours of becoming aware of the breach (GDPR requirement)",  // ✓ 128
    ],
  },
  // mc-5.1.4-4 — Convention B holdback (Least privilege / Job rotation / Separation of duties / Mandatory vacation — admin-control term recall).
  {
    videoId: "5.1.5", kind: "mc", index: 0,
    expectedOldStemPrefix: "The data owner is responsible for",
    intensity: "simple-pad",
    newOpts: [
      "Technical storage of data on backend infrastructure including disk arrays, encryption keys, and replication",                      // 109
      "Processing data on behalf of other organizations under a documented data-processing agreement and BPA",                              // 97
      "Day-to-day IT management of data systems including patching, capacity planning, and routine restore checks",                          // 102
      "Setting data classification levels, access policies, and retention requirements — a senior business role, not IT",                    // ✓ 112
    ],
  },
  {
    videoId: "5.1.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "Under GDPR, a data processor is",
    intensity: "simple-pad",
    newOpts: [
      "The individual whose personal data is collected and stored under that individual's identifying attributes",                        // 102
      "A government regulator who oversees compliance with the GDPR within a specific EU member state",                                    // 96
      "The organization that determines why personal data is collected and how it is subsequently processed",                              // 100
      "An organization that processes personal data on behalf of the data controller — e.g. a cloud provider or payroll service",          // ✓ 120
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

console.log(`\n§5.1 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length} (1 holdback excluded)`);
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
