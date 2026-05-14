// Audit D Sub-batch 1 pre-flight — supervisor-Claude review packet
// builder for the 5 fresh micro-recalibration items (Subset 2).
//
// Subset 1 (7 disagreement re-run items) is NOT included in this
// packet — those items already have supervisor verdicts from
// Sub-batch 0 and will be evaluated against that existing ground
// truth.
//
// S-R4 invariant honored: packet contains zero script verdicts, zero
// keyword screen results. Supervisor-Claude must produce independent
// verdicts.
//
// Output:
//   .audit-working/audit-d-sub-batch-1-preflight/microrecal-supervisor-packet.md
//
// Usage: node scripts/audit-d-build-microrecal-supervisor-packet.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1-preflight");

const sample = JSON.parse(readFileSync(resolve(OUT_DIR, "microrecal-sample.json"), "utf8"));

const subset2 = sample.items.filter(s => s.role === "subset-2-fresh");
if (subset2.length === 0) {
  console.error("No subset-2-fresh items in microrecal-sample.json. Did you run the sample builder?");
  process.exit(1);
}

function itemSubject(s) {
  if (s.type === "match") return s.item.answer;
  if (s.type === "cram")  return s.item.term;
  if (s.type === "mc" || s.type === "scen") return s.item.q || "(no stem)";
  return "(unknown)";
}
function itemBody(s) {
  if (s.type === "match") return `prompt: ${s.item.prompt}`;
  if (s.type === "cram")  return `definition: ${s.item.def}`;
  if (s.type === "mc" || s.type === "scen") {
    const correctOpt = (s.item.opts && typeof s.item.a === "number") ? s.item.opts[s.item.a] : "";
    return `correct option: ${correctOpt}\nexplanation: ${s.item.exp || ""}`;
  }
  return "";
}

const PACKET_HEADER = `# Audit D Sub-Batch 1 Pre-flight — Micro-Recalibration Blind Review (Supervisor-Claude)

You are the **independent second reader** for the micro-recalibration phase of an LLM-driven content-audit pipeline. Sub-batch 0 (30 items) was the first calibration pass; the script-side prompt has since been tuned, and these 5 items are a fresh stratified-random draw (seed 20260514) used to verify the tuning generalises.

An earlier reader (Claude Sonnet 4.5 via the Anthropic API, with the **tuned** SYSTEM_PROMPT) has already produced verdicts on these 5 items in a separate process. You have NOT seen those verdicts. Your role is to produce verdicts **independently**, against the same items and source transcripts the first reader saw, so that agreement between the two readers can be measured on a fresh sample (i.e. without the tuning being able to overfit to a small set of known disagreements).

Do **not** consult external sources (CompTIA PDF, Sybex book, web search). Judge each item against the cited Professor Messer transcript only, provided inline per item.

## Source-authority hierarchy

When deciding "in syllabus" vs "out of syllabus":

1. **CompTIA SY0-701 published objectives** — final arbiter (not provided here; if you are confident the concept is in the CompTIA objectives outside of Messer's coverage, that is a legitimate \`partial-adjacent\` or \`keep-as-enrichment\` signal).
2. **Professor Messer transcripts** — primary teaching source; provided inline per item.
3. **Chapple/Seidl Sybex book** — supplementary; not provided here.
4. **Inline secondary sources** — used for standards references only.

For "in-source" judgment specifically: judge against the cited Messer transcript only.

## Verdict schema (per item)

\`\`\`json
{
  "row_id": <integer, matches the Item N header>,
  "category": "in-source" | "partial-depth" | "partial-adjacent" | "out-of-source" | "out-of-syllabus" | "ambiguous-call",
  "confidence": "high" | "medium" | "low",
  "fix_direction": "rewrite-to-source" | "move-to-correct-video" | "remove-from-catalog" | "mark-for-Sybex-arbitration" | "keep-as-enrichment",
  "justification_quote": "<verbatim substring from the inline transcript, OR null>",
  "justification_explanation": "<1-3 sentences>"
}
\`\`\`

## Category definitions

- **in-source** — the tested concept appears in the cited transcript at sufficient depth to support the item as written.
- **partial-depth** — the underlying concept appears in the transcript but the item's specific framing requires depth the video does not develop (e.g. the mechanism is taught but the specific named acronym / regulation / compliance angle is not).
- **partial-adjacent** — the concept does NOT appear in the cited transcript, BUT it is clearly a Security+-relevant concept that appears (or should appear) in a different SY0-701 Messer video. Prefer partial-adjacent over out-of-source when you can identify the likely correct video.
- **out-of-source** — the concept does NOT appear in the cited transcript and you cannot identify another Messer video that covers it.
- **out-of-syllabus** — the concept is, to your knowledge, absent from any Sec+ source material.
- **ambiguous-call** — you cannot judge confidently from the transcript alone.

## Fix-direction guidance

- **rewrite-to-source** — in-source but the item's framing diverges from the transcript; reword item.
- **move-to-correct-video** — partial-adjacent — re-cite to the correct video.
- **remove-from-catalog** — out-of-source AND out-of-syllabus, low pedagogical value.
- **mark-for-Sybex-arbitration** — borderline — needs human reference to the Sybex book.
- **keep-as-enrichment** — out-of-source but legitimate enrichment a Sec+ student may benefit from.

## Justification quote rules

- For \`in-source\` / \`partial-depth\` / \`partial-adjacent\`: \`justification_quote\` MUST be a verbatim substring from the transcript demonstrating the coverage (or its limit).
- For \`out-of-source\` / \`out-of-syllabus\`: \`justification_quote\` MUST be \`null\`.
- For \`ambiguous-call\`: quote whatever fragment makes the ambiguity visible, or \`null\` if no relevant fragment exists.

## Output format

After reading all 5 items, return a **single JSON array of 5 objects**, in row_id order, in one fenced \`json\` code block. No prose outside the JSON. No partial answers; complete all 5 in one response. Example shape:

\`\`\`json
[
  { "row_id": 1, "category": "in-source", "confidence": "high", "fix_direction": "keep-as-enrichment", "justification_quote": "...", "justification_explanation": "..." },
  { "row_id": 2, ... },
  ...
  { "row_id": 5, ... }
]
\`\`\`

---

# Items

`;

const packetLines = [PACKET_HEADER];
subset2.forEach((s, i) => {
  const rowId = i + 1;
  const tpath = resolve(repo, s.transcript_path);
  let transcript = "(transcript file not found)";
  try {
    transcript = readFileSync(tpath, "utf8");
  } catch (_) {}

  packetLines.push(`## Item ${rowId} — §${s.video} ${s.type}[${s.index}]\n`);
  packetLines.push(`- **Domain:** ${s.section.split(".")[0]}`);
  packetLines.push(`- **Section:** ${s.section_label}`);
  packetLines.push(`- **Video:** ${s.video} — ${s.video_title}`);
  packetLines.push(`- **Type:** ${s.type}`);
  packetLines.push(`- **Cited Messer video:** ${s.messer_video_citation}`);
  packetLines.push(`- **Item subject:** ${itemSubject(s)}`);
  packetLines.push(`- **Item body:**\n\n${itemBody(s).split("\n").map(l => "  " + l).join("\n")}\n`);
  packetLines.push(`### Cited transcript\n`);
  packetLines.push("```");
  packetLines.push(transcript.trimEnd());
  packetLines.push("```\n");
  packetLines.push("---\n");
});

packetLines.push(`\n# Submission\n`);
packetLines.push(`When you have reviewed all 5 items, return your verdicts as a single JSON array in one fenced \`json\` code block, as specified in the **Output format** section above. Aiden will paste the JSON array back to the audit pipeline for ingestion.`);

const packetPath = resolve(OUT_DIR, "microrecal-supervisor-packet.md");
writeFileSync(packetPath, packetLines.join("\n"));

console.log(`Wrote ${packetPath}`);
console.log(`  ${subset2.length} items (Subset 2 fresh stratified, seed ${sample.metadata.subset_2.seed})`);
console.log(`  Packet size: ${packetLines.join("\n").length} bytes`);
console.log("");
console.log("Items included:");
subset2.forEach((s, i) => {
  console.log(`  Item ${i+1}: D${s.section.split(".")[0]} §${s.video} ${s.type}[${s.index}] — ${itemSubject(s).slice(0, 60)}`);
});
