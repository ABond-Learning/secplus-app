// Sub-batch 2 mega-pass — §4.6 cohort (Identity & Access Management): 9 cohort items, 7 modified.
//
// 2 Convention B holdbacks:
//   - mc-4.6.2-0 (RBAC assignment recall: Roles / Individual users / Data labels /
//     Time-of-day — alternative-access-model term recall)
//   - mc-4.6.3-2 (FIDO2 phishing-resistance: SMS / email / TOTP / FIDO2 hardware key —
//     auth-method recall)
//
// 1 rebuild:
//   - mc-4.6.1-3  De-provisioning urgency
//
// 1 multi-pad:
//   - mc-4.6.2-2  ABAC granularity
//
// 5 simple-pad:
//   - mc-4.6.1-0  SSO security benefit (correct intrinsically short — distractors padded)
//   - mc-4.6.1-2  Permission creep mitigation (correct short — distractors padded)
//   - mc-4.6.3-0  MFA fingerprint+password
//   - mc-4.6.4-0  NIST length emphasis
//   - mc-4.6.4-1  NIST mandatory change rule
//
// Watchpoints respected:
//   - SSO vs federation distinct (SSO = single auth, federation = cross-domain trust).
//   - SAML / OAuth / OIDC distinct purposes.
//   - MFA factors: something you know / have / are / do / somewhere you are — distinct.
//   - FIDO2 origin-binding (cannot be phished via reverse-proxy or fake-site).
//   - RBAC / ABAC / DAC / MAC / RuBAC distinct models.
//   - NIST SP 800-63B: length > complexity, no forced periodic changes (only on
//     compromise evidence).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.6-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.6.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "SSO (Single Sign-On) improves security by",
    intensity: "simple-pad",
    newOpts: [
      "Eliminating the need for passwords entirely by replacing them with hardware-only auth tokens",       // 91
      "Centralizing authentication",                                                                          // ✓ 27
      "Removing the need for MFA because a single point of authentication is inherently strong enough",      // 95
      "Allowing users to share credentials across teams without compromising the audit trail",                // 87
    ],
  },
  {
    videoId: "4.6.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Permission creep is best addressed by",
    intensity: "simple-pad",
    newOpts: [
      "Provisioning all new users with administrator rights initially and then revoking them after onboarding",  // 100
      "Regular access reviews",                                                                                  // ✓ 22
      "Requiring users to request fresh access daily through the helpdesk ticketing portal",                       // 84
      "Removing all user permissions every quarter and forcing each user to re-request what they need",            // 96
    ],
  },
  {
    videoId: "4.6.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "De-provisioning must happen immediately when an employee leaves because",
    intensity: "rebuild",
    newOpts: [
      "Active accounts of departed employees are prime insider threat vectors — terminated employees or attackers using their accounts retain access",  // ✓ 141
      "Company policy requires it within a calendar week of the official termination paperwork",                                                            // 88
      "It frees up software licenses for reassignment to other employees on the active roster",                                                              // 88
      "HR requires it for payroll cycle close-out and final paycheck issuance scheduling",                                                                    // 80
    ],
  },
  // mc-4.6.2-0 — Convention B holdback (RBAC vs DAC vs MAC vs ABAC alternative-assignment recall).
  {
    videoId: "4.6.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "ABAC is the most granular access control model because",
    intensity: "multi-pad",
    newOpts: [
      "It uses the most complex passwords by enforcing per-role minimum entropy at registration",          // 89
      "Access decisions consider multiple attributes simultaneously — user department, device type, time, location, data classification",  // ✓ 128
      "It is the oldest model with decades of enterprise tooling integration and audit support",          // 87
      "It requires the most hardware because attribute lookups must run on dedicated appliances",          // 87
    ],
  },
  {
    videoId: "4.6.3", kind: "mc", index: 0,
    expectedOldStemPrefix: "Using a fingerprint AND a password is MFA because",
    intensity: "simple-pad",
    newOpts: [
      "Two different inputs are used at the login prompt regardless of which factor categories they are",  // 96
      "The fingerprint is more secure than a password and so the combination meets the MFA bar by default",  // 99
      "They are from two different factor categories — something you are (biometric) + something you know (password)",  // ✓ 109
      "Both factors are processed by the same authentication server through a single back-end pipeline",   // 95
    ],
  },
  // mc-4.6.3-2 — Convention B holdback (SMS / email / TOTP / FIDO2 — auth-method term recall).
  {
    videoId: "4.6.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "According to NIST SP 800-63B, which is the MOST important password security factor",
    intensity: "simple-pad",
    newOpts: [
      "Complexity (mixed character types required across uppercase, lowercase, digits, and symbols)",      // 92
      "Frequency of mandatory password changes scheduled every thirty, sixty, or ninety days",               // 86
      "Use of special characters drawn from the punctuation row of a US-English keyboard layout",            // 91
      "Length — longer passwords are exponentially harder to crack",                                          // ✓ 59
    ],
  },
  {
    videoId: "4.6.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "NIST SP 800-63B recommends that organizations should NOT force periodic password changes UNLESS",
    intensity: "simple-pad",
    newOpts: [
      "The password is over 90 days old based on the timestamp recorded in the directory user object",     // 96
      "There is evidence the password has been compromised",                                                 // ✓ 51
      "The user has not logged in recently and the directory has flagged the account as inactive",          // 91
      "The user's role changes within the organization to one that handles materially more sensitive data",   // 99
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
    console.error(`  current correct: "${currentCorrect}"`);
    refused++; continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\n§4.6 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
