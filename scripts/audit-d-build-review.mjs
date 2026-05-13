// Audit D Sub-batch 0 — smoke-test gate + supervisor-Claude review
// packet builder.
//
// REVISED 2026-05-13: calibration blind reviewer shifted from Aiden
// to supervisor-Claude (separate Claude.ai conversation). Two
// independent LLM readers (script's Sonnet + supervisor-Claude)
// measuring agreement is the methodology check. Aiden is the user,
// not a second LLM reader; his arbitration role remains for
// Sub-batches 1+ on HIGH flags.
//
// 1. Gate on the smoke-test cohort (§2.3.3 mutex+atomic in match+cram):
//    - Stage 1 keyword screen must flag all 4 as "term-absent"
//    - Stage 2 LLM verdict must categorize all 4 as "out-of-source"
//      or "out-of-syllabus" with high or medium confidence
//    If ANY smoke-test item fails, HALT and write
//    smoke-test-FAILURE.json. Do NOT produce the review packet.
//
// 2. If gate passes, produce the supervisor-Claude review packet
//    at .audit-working/audit-d-calibration/supervisor-claude-review-packet.md.
//    Markdown file containing, per item: row id, domain, section,
//    video, type, item subject + body, citation, and the FULL
//    transcript content inline. NO script LLM verdicts, NO keyword
//    screen results — supervisor-Claude must produce independent
//    verdicts (S-R4 invariant extended to second reader).
//
// 3. Also writes calibration-status.txt — human-readable summary.
//
// The unblinded comparison view is built by a follow-on script
// after Aiden pastes supervisor-Claude's verdicts back.
//
// Usage: node scripts/audit-d-build-review.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-calibration");

const sample = JSON.parse(readFileSync(resolve(OUT_DIR, "sample-selection.json"), "utf8"));
const keyword = JSON.parse(readFileSync(resolve(OUT_DIR, "keyword-screen-results.json"), "utf8"));
const llm = JSON.parse(readFileSync(resolve(OUT_DIR, "llm-verdicts.json"), "utf8"));

const keyByLoc = (l) => `${l.section}|${l.video}|${l.type}|${l.index}`;
const kwByKey = new Map(keyword.map(k => [keyByLoc(k.location), k]));
const llmByKey = new Map(llm.verdicts.map(v => [keyByLoc(v.location), v]));

// ─── Smoke gate ──────────────────────────────────────────────────────
const SMOKE_KEYS = sample.items.filter(s => s.role === "smoke-test").map(s => keyByLoc(s));

const failures = [];
for (const k of SMOKE_KEYS) {
  const kw = kwByKey.get(k);
  const lv = llmByKey.get(k);
  if (!kw) { failures.push({ key: k, reason: "keyword result missing" }); continue; }
  if (!lv) { failures.push({ key: k, reason: "llm verdict missing" }); continue; }
  // Keyword: term-absent required
  if (kw.flag !== "term-absent") {
    failures.push({
      key: k, reason: "keyword stage did not flag term-absent",
      keyword_flag: kw.flag, hits: kw.hits, central: kw.central_term,
    });
  }
  // LLM: out-of-source or out-of-syllabus required, confidence ≥ medium
  const okCat = ["out-of-source", "out-of-syllabus"].includes(lv.verdict.category);
  const okConf = ["high", "medium"].includes(lv.verdict.confidence);
  if (!okCat || !okConf) {
    failures.push({
      key: k, reason: "llm verdict did not match smoke-test expectation",
      llm_category: lv.verdict.category, llm_confidence: lv.verdict.confidence,
      llm_quote: lv.verdict.justification_quote, llm_explanation: lv.verdict.justification_explanation,
    });
  }
}

if (failures.length > 0) {
  const failurePayload = {
    timestamp: new Date().toISOString(),
    smoke_keys: SMOKE_KEYS,
    failures,
    interpretation: "Pipeline methodology is broken. Halt Sub-batch 0 before producing the Aiden review CSV. Investigate LLM prompt and / or keyword screen logic before re-running.",
  };
  writeFileSync(resolve(OUT_DIR, "smoke-test-FAILURE.json"), JSON.stringify(failurePayload, null, 2));
  console.error("\n╔════════════════════════════════════════════════════════╗");
  console.error("║  SMOKE TEST FAILED  —  HALTING BEFORE CSV PRODUCTION   ║");
  console.error("╚════════════════════════════════════════════════════════╝");
  console.error(`Wrote ${resolve(OUT_DIR, "smoke-test-FAILURE.json")}`);
  for (const f of failures) console.error("  -", JSON.stringify(f));
  process.exit(2);
}

console.log("✓ Smoke test PASSED on all 4 cohort items.");

// ─── Supervisor-Claude review packet builder ─────────────────────────
function itemSubject(s) {
  if (s.type === "match") return s.item.answer;
  if (s.type === "cram")  return s.item.term;
  if (s.type === "mc" || s.type === "scen") {
    return s.item.q || "(no stem)";
  }
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

const PACKET_HEADER = `# Audit D Sub-Batch 0 — Calibration Blind Review (Supervisor-Claude)

You are the **second independent reader** for a calibration test of an LLM-driven content-audit pipeline. An earlier reader (Claude Sonnet 4.5 via the Anthropic API) has already produced verdicts on these 30 items in a separate process; you have NOT seen those verdicts. Your role is to produce verdicts **independently**, against the same items and source transcripts the first reader saw, so that agreement between the two readers can be measured as a methodology validity check.

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
- **partial-depth** — the concept appears in the transcript but is not taught to the depth the item expects (item assumes background the video doesn't deliver).
- **partial-adjacent** — the concept is plausibly in a different same-domain Sec+ video, but not the cited one.
- **out-of-source** — the concept does NOT appear in the cited transcript.
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
- For \`out-of-source\` / \`out-of-syllabus\`: \`justification_quote\` MUST be \`null\` (the concept is not in the transcript so there is no quote to give).
- For \`ambiguous-call\`: quote whatever fragment makes the ambiguity visible, or \`null\` if no relevant fragment exists.

## Output format

After reading all 30 items, return a **single JSON array of 30 objects**, in row_id order, in one fenced code block. No prose outside the JSON. No partial answers; complete all 30 in one response. Example shape:

\`\`\`json
[
  { "row_id": 1, "category": "out-of-source", "confidence": "high", "fix_direction": "mark-for-Sybex-arbitration", "justification_quote": null, "justification_explanation": "..." },
  { "row_id": 2, ... },
  ...
  { "row_id": 30, ... }
]
\`\`\`

---

# Items

`;

const packetLines = [PACKET_HEADER];
sample.items.forEach((s, i) => {
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
packetLines.push(`When you have reviewed all 30 items, return your verdicts as a single JSON array in one fenced \`json\` code block, as specified in the **Output format** section above. Aiden will paste the JSON array back to the audit pipeline for ingestion.`);

const packetPath = resolve(OUT_DIR, "supervisor-claude-review-packet.md");
writeFileSync(packetPath, packetLines.join("\n"));

// ─── Summary report (calibration-status.txt) ────────────────────────
const llmCounts = {};
for (const v of llm.verdicts) {
  llmCounts[v.verdict.category] = (llmCounts[v.verdict.category] || 0) + 1;
}
const llmConfCounts = {};
for (const v of llm.verdicts) {
  llmConfCounts[v.verdict.confidence] = (llmConfCounts[v.verdict.confidence] || 0) + 1;
}
const kwCounts = { "term-absent": 0, "term-present": 0, "no-transcript": 0, "skipped": 0 };
for (const k of keyword) kwCounts[k.flag || k.stage]++;
const structuralFlags = llm.verdicts.filter(v => v.structural_flag).length;

const lines = [];
lines.push("AUDIT D SUB-BATCH 0 — CALIBRATION STATUS");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("SMOKE TEST: PASSED on all 4 cohort items.");
lines.push("");
lines.push(`Stage 1 keyword screen (match + cram only; mc + scen skipped per S3):`);
for (const [k, v] of Object.entries(kwCounts)) lines.push(`  ${k}: ${v}`);
lines.push("");
lines.push(`Stage 2 LLM verdicts (model=${llm.metadata.model}, total cost $${llm.metadata.total_cost_usd.toFixed(4)}):`);
lines.push(`  Calls: ${llm.metadata.total_calls} / 30 expected (hard cap ${llm.metadata.hard_cap})`);
lines.push(`  Category distribution:`);
for (const [k, v] of Object.entries(llmCounts).sort()) lines.push(`    ${k}: ${v}`);
lines.push(`  Confidence distribution:`);
for (const [k, v] of Object.entries(llmConfCounts).sort()) lines.push(`    ${k}: ${v}`);
lines.push(`  Structural flags (empty-quote / non-verbatim): ${structuralFlags}`);
lines.push("");
lines.push("Smoke-test detail:");
for (const k of SMOKE_KEYS) {
  const kw = kwByKey.get(k);
  const lv = llmByKey.get(k);
  lines.push(`  ${k}`);
  lines.push(`    keyword: ${kw.flag} (term: ${kw.central_term})`);
  lines.push(`    llm:     ${lv.verdict.category} / ${lv.verdict.confidence}`);
  lines.push(`    fix-direction: ${lv.verdict.fix_direction}`);
  if (lv.verdict.justification_explanation) {
    lines.push(`    why: ${lv.verdict.justification_explanation.slice(0, 200)}`);
  }
}
lines.push("");
lines.push("FILES PRODUCED");
lines.push("  .audit-working/audit-d-calibration/sample-selection.json");
lines.push("  .audit-working/audit-d-calibration/keyword-screen-results.json");
lines.push("  .audit-working/audit-d-calibration/llm-verdicts.json");
lines.push("  .audit-working/audit-d-calibration/supervisor-claude-review-packet.md  ← paste to a fresh Claude.ai conversation");
lines.push("");
lines.push("NEXT STEP (Aiden)");
lines.push("  Open a fresh Claude.ai conversation (supervisor-Claude).");
lines.push("  Paste the contents of supervisor-claude-review-packet.md.");
lines.push("  Supervisor-Claude will return a JSON array of 30 verdicts.");
lines.push("  Paste the JSON array back to me here in this CC session.");
lines.push("  I'll ingest, compute agreement rate against the script's");
lines.push("  Sonnet verdicts, and produce the Sub-batch 0 closure");
lines.push("  report + Report-#0002 + commit.");

const statusTxt = lines.join("\n") + "\n";
writeFileSync(resolve(OUT_DIR, "calibration-status.txt"), statusTxt);

console.log("\n--- calibration-status.txt ---");
console.log(statusTxt);
