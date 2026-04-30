// Sub-batch 2 mega-pass — §4.7 cohort (Scripting/Automation): 2 cohort items, 2 modified.
//
// 0 Convention B holdbacks.
//
// 1 rebuild:
//   - mc-4.7.1-1  SOAR playbook
//
// 1 simple-pad:
//   - mc-4.7.1-0  Automation primary benefit (correct intrinsically short)
//
// Watchpoints respected:
//   - Automation = speed + consistency primarily; cost reduction and accuracy are
//     secondary or context-dependent.
//   - SOAR playbook = documented, automated incident-response sequence; not a vendor
//     manual, network diagram, or firewall rule.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.7-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.7.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "The PRIMARY security benefit of automation over manual processes is",
    intensity: "simple-pad",
    newOpts: [
      "Automation is always more accurate than humans because the underlying logic never has bugs",         // 90
      "Automation is always cheaper than human analysts at every scale of security operations workload",     // 96
      "Speed and consistency",                                                                                // ✓ 21
      "Automated tools need no maintenance because vendor-managed pipelines update playbooks invisibly",     // 96
    ],
  },
  {
    videoId: "4.7.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "A SOAR playbook is",
    intensity: "rebuild",
    newOpts: [
      "A vendor product manual describing each module's GUI options and configuration screens",              // 86
      "A type of firewall rule that combines multiple ACL entries into a single grouped policy",              // 89
      "A documented, automated sequence of steps that executes in response to a specific type of security incident",  // ✓ 107
      "A network diagram showing the SOC architecture and data flows between security tools and the SIEM",   // 99
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

console.log(`\n§4.7 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
