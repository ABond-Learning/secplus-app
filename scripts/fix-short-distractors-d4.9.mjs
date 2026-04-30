// Sub-batch 2 mega-pass — §4.9 cohort (Log Data): 2 cohort items, 2 modified.
//
// 0 Convention B holdbacks.
//
// 1 rebuild:
//   - mc-4.9.1-0  NTP critical for log analysis
//
// 1 simple-pad:
//   - mc-4.9.1-1  DNS logs value
//
// Watchpoints respected:
//   - NTP synchronizes time so events from different sources can be correlated reliably.
//   - DNS logs capture every domain query — valuable for C2 detection, DGA, DNS tunneling.
//   - Don't conflate NTP (time sync) with NTLM (auth protocol) or NTFS (filesystem).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4.9-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

export const REPLACEMENTS = [
  {
    videoId: "4.9.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "Why is NTP critical for security log analysis",
    intensity: "rebuild",
    newOpts: [
      "NTP improves network speed by reducing the round-trip time of typical TCP handshakes",                // 88
      "Accurate, synchronized time across all devices is essential for correlating events from multiple log sources during investigation",  // ✓ 129
      "NTP encrypts the contents of every transmitted log entry between the source and the SIEM",            // 91
      "NTP prevents log tampering by signing each event with a per-device cryptographic timestamp",          // 92
    ],
  },
  {
    videoId: "4.9.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "DNS logs are valuable for security monitoring because",
    intensity: "simple-pad",
    newOpts: [
      "They contain encrypted traffic payloads which the SIEM can decrypt server-side for inspection",        // 96
      "They are automatically centralized by every major DNS resolver vendor's default configuration",        // 95
      "They contain user credentials transmitted during DNS resolution against the corporate resolver",        // 96
      "All DNS queries are logged — revealing C2 communication, DNS tunneling, and connections to malicious domains",  // ✓ 108
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

console.log(`\n§4.9 fix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
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
