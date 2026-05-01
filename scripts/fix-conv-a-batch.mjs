// Sub-batch 3 — 5 Convention A expansions deferred from the mega-pass.
//
// Each item in this batch has an intrinsically-short correct option that
// the mega-pass left at the original short length while padding the
// distractors. A Convention A expansion now reframes the correct to match
// the "Term — explanatory tail" pattern of the distractors, restoring
// length-balance.
//
// Items addressed:
//   mc-1.3.2-0   Allow listing                   13 -> 89 chars
//   mc-4.1.2-2   Network segmentation            20 -> 63 chars
//   mc-4.6.1-0   Centralizing authentication     27 -> 82 chars
//   mc-4.6.1-2   Regular access reviews          22 -> 84 chars
//   mc-4.7.1-0   Speed and consistency           21 -> 70 chars
//
// All ratios drop from 3.48-7.62× into the 1.15-1.40× band.
//
// Apply mechanism mirrors scripts/fix-short-distractors-d4.1.mjs's
// convention-A handling (added during the mega-pass for the SAE expansion
// at mc-4.1.4-0):
//   - intensity: "convention-A"
//   - expectedOldStemPrefix: stem-match safety
//   - expectedOldCorrect: verbatim current correct text (must match
//     item.opts[item.a] exactly or apply refuses)
//   - newCorrect: expanded text
//   - newOpts: 4 options including newCorrect; newA is computed by
//     newOpts.indexOf(newCorrect)
//
// CLAUDE.md rule 8 (hash-shuffle) does NOT apply: these are EDITS to
// existing items, not new generation. Each newCorrect is placed at the
// SAME index as the existing correct so the catalogue-wide position
// distribution from Sub-batch 1 is preserved.
//
// Idempotent: re-running --write after a successful apply skips because
// item.opts[item.a] no longer matches expectedOldCorrect.
//
// Usage:
//   node scripts/fix-conv-a-batch.mjs              # dry-run summary, no writes
//   node scripts/fix-conv-a-batch.mjs --preview    # write preview to /tmp/
//   node scripts/fix-conv-a-batch.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-conv-a-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  // ───── mc-1.3.2-0  Allow listing ─────
  {
    videoId: "1.3.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "Which process ensures only approved software",
    intensity: "convention-A",
    expectedOldCorrect: "Allow listing",
    newCorrect: "Allow listing — defining an explicit set of approved software versions cleared to execute",
    newOpts: [
      "Allow listing — defining an explicit set of approved software versions cleared to execute",                    // ✓ 89 (was at index 0)
      "Change management — approving the introduction of new software through CAB review",                            //   81 (unchanged)
      "Vulnerability scanning — checking installed software versions for known CVEs and CVSS scores",                 //   92 (unchanged)
      "Penetration testing — attempting to bypass installed software controls during scheduled engagements",          //   99 (unchanged)
    ],
  },

  // ───── mc-4.1.2-2  IoT segmentation ─────
  {
    videoId: "4.1.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Which hardening technique is most important for IoT",
    intensity: "convention-A",
    expectedOldCorrect: "Network segmentation",
    newCorrect: "Network segmentation — isolating IoT devices on dedicated VLANs",
    newOpts: [
      "Installing endpoint protection software on each constrained IoT device's onboard storage",                     //   88 (unchanged)
      "Full disk encryption on every IoT device's flash storage using hardware-rooted keys",                          //   83 (unchanged)
      "Network segmentation — isolating IoT devices on dedicated VLANs",                                              // ✓ 63 (was at index 2)
      "Deploying a host-based firewall directly onto each IoT device's microcontroller stack",                        //   85 (unchanged)
    ],
  },

  // ───── mc-4.6.1-0  SSO benefit ─────
  {
    videoId: "4.6.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "SSO (Single Sign-On) improves security by",
    intensity: "convention-A",
    expectedOldCorrect: "Centralizing authentication",
    newCorrect: "Centralizing authentication into a single identity provider with consistent policy",
    newOpts: [
      "Eliminating the need for passwords entirely by replacing them with hardware-only auth tokens",                 //   92 (unchanged)
      "Centralizing authentication into a single identity provider with consistent policy",                           // ✓ 82 (was at index 1)
      "Removing the need for MFA because a single point of authentication is inherently strong enough",               //   94 (unchanged)
      "Allowing users to share credentials across teams without compromising the audit trail",                        //   85 (unchanged)
    ],
  },

  // ───── mc-4.6.1-2  Permission creep ─────
  {
    videoId: "4.6.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Permission creep is best addressed by",
    intensity: "convention-A",
    expectedOldCorrect: "Regular access reviews",
    newCorrect: "Regular access reviews where managers certify each user's access is still appropriate",
    newOpts: [
      "Provisioning all new users with administrator rights initially and then revoking them after onboarding",        //  102 (unchanged)
      "Regular access reviews where managers certify each user's access is still appropriate",                         // ✓ 84 (was at index 1)
      "Requiring users to request fresh access daily through the helpdesk ticketing portal",                           //   83 (unchanged)
      "Removing all user permissions every quarter and forcing each user to re-request what they need",                //   94 (unchanged)
    ],
  },

  // ───── mc-4.7.1-0  Automation benefit ─────
  {
    videoId: "4.7.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "The PRIMARY security benefit of automation",
    intensity: "convention-A",
    expectedOldCorrect: "Speed and consistency",
    newCorrect: "Speed and consistency — automated tasks execute identically every time",
    newOpts: [
      "Automation is always more accurate than humans because the underlying logic never has bugs",                    //   90 (unchanged)
      "Automation is always cheaper than human analysts at every scale of security operations workload",               //   95 (unchanged)
      "Speed and consistency — automated tasks execute identically every time",                                        // ✓ 70 (was at index 2)
      "Automated tools need no maintenance because vendor-managed pipelines update playbooks invisibly",               //   95 (unchanged)
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
  let newA;
  if (r.intensity === "convention-A") {
    if (typeof r.expectedOldCorrect !== "string" || typeof r.newCorrect !== "string") {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — convention-A entry missing expectedOldCorrect or newCorrect`);
      refused++; continue;
    }
    if (item.opts[item.a] !== r.expectedOldCorrect) {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct does not match expectedOldCorrect`);
      console.error(`  expected: "${r.expectedOldCorrect}"`);
      console.error(`  actual:   "${item.opts[item.a]}"`);
      refused++; continue;
    }
    if (!r.newOpts.includes(r.newCorrect)) {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — newCorrect not in newOpts`);
      refused++; continue;
    }
    newA = r.newOpts.indexOf(r.newCorrect);
  } else {
    const currentCorrect = item.opts[item.a];
    if (!r.newOpts.includes(currentCorrect)) {
      console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
      refused++; continue;
    }
    newA = r.newOpts.indexOf(currentCorrect);
  }
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldA: item.a, newA, oldCorrect: item.opts[item.a], newCorrect: r.newOpts[newA] });
  if (write || preview) { item.opts = r.newOpts.slice(); item.a = newA; }
  applied++;
}

console.log(`\nConvention A batch ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length}`);
console.log(`  applied:  ${applied}`);
console.log(`  skipped (idempotent): ${skipped}`);
console.log(`  refused (safety): ${refused}`);
console.log();
for (const l of log) {
  console.log(`  ${l.qid}  a=${l.oldA}->${l.newA}  intensity=${l.intensity}`);
  console.log(`    old: "${l.oldCorrect}"`);
  console.log(`    new: "${l.newCorrect}"`);
}

if (write || preview) {
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote to ${target}`);
  if (preview) {
    console.log(`Run validator on preview:`);
    console.log(`  node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
  }
} else {
  console.log("\n(dry run — pass --preview to write to /tmp, --write to persist to questions.json)");
}
