// Augment a SB-fix-1b packet review markdown with inline cluster
// verification verdicts (cadence Rule 2) and cross-packet
// consistency hints (cadence Rule 5).
//
// Reads:
//   .audit-working/sb-fix-1b/packet-N.md (build output)
//   .audit-working/sb-fix-1b/packet-N-cluster-verification.md (Rule 2)
//   .audit-working/sb-fix-1b/packet-N-cross-packet-hints.json (Rule 5)
//
// Produces:
//   .audit-working/sb-fix-1b/packet-N-augmented.md
//
// Augmentation: for each "### Item N." header in packet-N.md, insert
// a block immediately before the "**Aiden decision**" line containing
// (if applicable) the cluster verification recommendation and the
// top cross-packet hint with suggested decision.
//
// Usage:
//   node scripts/sb-fix-1b-augment-packet.mjs --packet 3

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

function parseArgs() {
  let packet = null;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--packet" && i + 1 < process.argv.length) {
      packet = Number(process.argv[++i]);
    }
  }
  if (packet == null) { console.error("usage: --packet <N>"); process.exit(2); }
  return { packet };
}
const args = parseArgs();

const BASE = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}.md`);
const CLUSTER_MD = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}-cluster-verification.md`);
const HINTS_JSON = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}-cross-packet-hints.json`);
const OUT = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}-augmented.md`);

const baseMd = readFileSync(BASE, "utf8");
const clusterMd = readFileSync(CLUSTER_MD, "utf8");
const hintsBlob = JSON.parse(readFileSync(HINTS_JSON, "utf8"));

// ─── Parse cluster verification: build a packet_index → verdict map ──
const clusterVerdicts = new Map();
{
  // Each item section starts with "### Item #N — §..." and ends at the
  // next "### Item #" or "---" or "**Cluster pattern summary**".
  const itemRe = /^### Item #(\d+) — (.+)$/gm;
  let m;
  const headers = [];
  while ((m = itemRe.exec(clusterMd)) != null) {
    headers.push({ idx: Number(m[1]), at: m.index, header: m[0] });
  }
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].at;
    const end = i + 1 < headers.length ? headers[i + 1].at : clusterMd.length;
    const body = clusterMd.slice(start, end);
    // Extract the "**Cluster verdict / recommendation:**" line.
    const recMatch = body.match(/\*\*Cluster verdict \/ recommendation:\*\*\s*(.+)/);
    const grepMatch = body.match(/\*\*Grep results:\*\*\s*\n\n([\s\S]*?)\n\n/);
    const corpusMatch = body.match(/\*\*Corpus-wide grep\*\*[\s\S]*?(?=\n\n\*\*Cluster verdict)/);
    clusterVerdicts.set(headers[i].idx, {
      recommendation: recMatch ? recMatch[1].trim() : null,
      grep_table: grepMatch ? grepMatch[1].trim() : null,
      corpus_block: corpusMatch ? corpusMatch[0].trim() : null,
    });
  }
}

// ─── Cross-packet hints by packet_index ─────────────────────────────
const hintsByIdx = new Map();
for (const h of hintsBlob.hints || []) {
  hintsByIdx.set(h.packet_index, h);
}

// ─── Build the augmentation block for an item ───────────────────────
function buildAugmentation(packetIndex) {
  const out = [];
  const cluster = clusterVerdicts.get(packetIndex);
  const hint = hintsByIdx.get(packetIndex);

  const hasCluster = cluster && cluster.recommendation;
  const topHint = hint && hint.candidates && hint.candidates[0];
  const hasHint = topHint && topHint.score >= 0.20;

  if (!hasCluster && !hasHint) return null;

  out.push("");
  out.push("**🔍 Cadence Rule 2 + 5 — pre-analysis**");
  out.push("");

  if (hasCluster) {
    out.push(`- **Cluster verification (Rule 2):** ${cluster.recommendation}`);
    if (cluster.grep_table) {
      out.push("  - Grep results:");
      out.push("");
      out.push("    " + cluster.grep_table.split("\n").join("\n    "));
      out.push("");
    }
    if (cluster.corpus_block) {
      out.push("    " + cluster.corpus_block.split("\n").join("\n    "));
      out.push("");
    }
  }

  if (hasHint) {
    out.push(`- **Cross-packet consistency (Rule 5):** ${hint.candidates.length} prior-adjudicated item(s) match.`);
    for (const c of hint.candidates) {
      const parentTag = c.sameParent ? " — same parent video" : c.sameSection ? " — same section" : "";
      out.push(`  - ${c.label} #${c.packet_index} (Jaccard ${c.jaccard}${parentTag}): ${c.decision_summary}`);
    }
    if (topHint.score >= 0.30) {
      out.push("");
      // Synthesise the precedent suggestion (mirrors cross-packet-annotate script)
      const summary = topHint.decision_summary;
      out.push(`  - **By-precedent suggestion:** ${summary}`);
    }
  }

  out.push("");
  return out.join("\n");
}

// ─── Splice augmentation into the packet markdown ───────────────────
const itemHeaderRe = /^### Item (\d+)\. /gm;
const headers = [];
let m;
while ((m = itemHeaderRe.exec(baseMd)) != null) {
  headers.push({ idx: Number(m[1]), at: m.index });
}

const augmented = [];
let cursor = 0;
for (let i = 0; i < headers.length; i++) {
  const start = headers[i].at;
  const end = i + 1 < headers.length ? headers[i + 1].at : baseMd.length;
  augmented.push(baseMd.slice(cursor, start));
  const block = baseMd.slice(start, end);
  // Find the "**Aiden decision** (mark one):" line and insert above it.
  const aidenIdx = block.indexOf("**Aiden decision**");
  const aug = buildAugmentation(headers[i].idx);
  if (aug == null || aidenIdx === -1) {
    augmented.push(block);
  } else {
    augmented.push(block.slice(0, aidenIdx));
    augmented.push(aug);
    augmented.push(block.slice(aidenIdx));
  }
  cursor = end;
}
augmented.push(baseMd.slice(cursor));

// Add a prefix block explaining the augmentation
const prefix = [
  "",
  "> **Pre-analysis augmentation per cadence Rules 2 + 5.** Each item below",
  "> may carry a `🔍 Cadence Rule 2 + 5 — pre-analysis` block immediately",
  "> above the decision checkboxes. The block contains CC's pre-computed",
  "> cluster verification verdict (Rule 2 — grep against cited + parser",
  "> destinations + corpus-wide for terms in cluster items) and",
  "> cross-packet consistency hints (Rule 5 — Jaccard concept match against",
  "> SB-fix-1a packets 1-3 + SB-fix-1b packets 1-2 decisions).",
  ">",
  "> Supervisor reviews the pre-analysis as part of the normal item-by-item",
  "> pass. Disagreements with the pre-analysis are normal — flag them in the",
  "> decision rather than as a separate gate.",
  "",
];

// Insert after the original "## How to review" section
const augmentedStr = augmented.join("");
// Find end of "## How to review" section (next "---" after that heading)
const reviewIdx = augmentedStr.indexOf("## How to review");
let insertAt = -1;
if (reviewIdx >= 0) {
  const afterReview = augmentedStr.slice(reviewIdx);
  const sepIdx = afterReview.indexOf("\n---\n");
  if (sepIdx >= 0) insertAt = reviewIdx + sepIdx;
}
const finalStr = insertAt >= 0
  ? augmentedStr.slice(0, insertAt) + "\n" + prefix.join("\n") + augmentedStr.slice(insertAt)
  : prefix.join("\n") + "\n" + augmentedStr;

writeFileSync(OUT, finalStr);
console.log(`Wrote ${OUT}`);
console.log(`Headers found: ${headers.length}`);
let augCount = 0;
for (const h of headers) if (buildAugmentation(h.idx)) augCount++;
console.log(`Items with augmentation: ${augCount}/${headers.length}`);
