// Audit D Sub-batch 1 — full-corpus sample builder.
//
// Enumerates EVERY item in scope (mc + scen + match + cram across all 28
// sections / 120 videos / 5 domains) and emits a sample file in the same
// enriched format that audit-d-llm-judge.mjs and audit-d-postprocess-
// verdicts.mjs consume.
//
// No randomisation, no stratification — this is the full corpus pass. The
// emit order is deterministic: section.id (lexicographic) → video.id
// (lexicographic) → type (mc, scen, match, cram) → original array index.
// That stable order makes resume-from-cap and per-section progress easy
// to reason about.
//
// Output:
//   .audit-working/audit-d-sub-batch-1/full-corpus-sample.json
//
// Usage: node scripts/audit-d-build-sub-batch-1-sample.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1");
mkdirSync(OUT_DIR, { recursive: true });

const FIELD_MAP = { mc: "questions", scen: "scenarios", match: "matching", cram: "cram" };
const TYPE_ORDER = ["mc", "scen", "match", "cram"];

function transcriptSlug(videoTitle) {
  return videoTitle.toLowerCase()
    .replace(/[,'']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-sy0-701";
}

const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));

const items = [];
const perBucket = {};
const perSection = {};
const perVideo = {};

const sections = [...data].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
for (const sec of sections) {
  const videos = [...sec.videos].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
  for (const v of videos) {
    const videoKey = `${sec.id} ${v.id}`;
    perVideo[videoKey] = 0;
    for (const type of TYPE_ORDER) {
      const field = FIELD_MAP[type];
      const arr = v[field] || [];
      arr.forEach((it, index) => {
        items.push({
          section: sec.id,
          video: v.id,
          type,
          index,
          section_label: sec.label,
          video_title: v.title,
          item: it,
          messer_video_citation: `${sec.id} - ${v.title}`,
          transcript_path: `.messer-transcripts/${transcriptSlug(v.title)}.txt`,
          role: "sub-batch-1-full-corpus",
        });
        const domain = sec.id.split(".")[0];
        const bucket = `D${domain}-${type}`;
        perBucket[bucket] = (perBucket[bucket] || 0) + 1;
        perSection[sec.id] = (perSection[sec.id] || 0) + 1;
        perVideo[videoKey]++;
      });
    }
  }
}

const totalByType = { mc: 0, scen: 0, match: 0, cram: 0 };
for (const [k, c] of Object.entries(perBucket)) {
  const type = k.split("-")[1];
  totalByType[type] += c;
}

const out = {
  metadata: {
    timestamp: new Date().toISOString(),
    total: items.length,
    scope: "match + cram + mc + scen — full corpus, all 28 sections / 120 videos / 5 domains",
    enumeration_order: "section.id → video.id → type (mc,scen,match,cram) → array index (all stable)",
    totals_by_type: totalByType,
    counts_by_domain_type: perBucket,
    counts_by_section: perSection,
    video_count: Object.keys(perVideo).length,
    section_count: data.length,
  },
  items,
};

writeFileSync(resolve(OUT_DIR, "full-corpus-sample.json"), JSON.stringify(out, null, 2));

console.log(`Wrote full-corpus-sample.json: ${items.length} items`);
console.log(`Totals by type: mc=${totalByType.mc}  scen=${totalByType.scen}  match=${totalByType.match}  cram=${totalByType.cram}`);
console.log(`Sections: ${data.length}, videos: ${Object.keys(perVideo).length}`);
console.log("");
console.log("Per-bucket counts (D<n>-<type>):");
for (const [k, c] of Object.entries(perBucket).sort()) console.log(`  ${k}: ${c}`);
