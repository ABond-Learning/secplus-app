// Audit D Sub-batch 0 — Stage 2 LLM-as-judge.
//
// For each item in the calibration sample, build a per-item LLM
// call with the cited transcript in context and ask for a verdict
// per the 6-way schema in the Audit D scoping doc.
//
// CRITICAL S-R3 INVARIANT (boundary): the LLM never sees Stage 1
// keyword results. The system prompt does not mention keyword
// absence / term presence. Conceptual judgment only.
//
// Cost guardrails (S-R5):
//   - HARD_CAP: abort if >100 API calls (we expect ~30)
//   - per-call cost printed live
//   - total cost printed at end
//
// Output: .audit-working/audit-d-calibration/llm-verdicts.json
//         + errors.json (sidecar, if any errors)
//
// Usage: node scripts/audit-d-llm-judge.mjs

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-calibration");

// ─── Load .env for ANTHROPIC_API_KEY ─────────────────────────────────
function loadEnv() {
  const envPath = resolve(repo, ".env");
  if (!existsSync(envPath)) throw new Error("No .env at project root");
  const txt = readFileSync(envPath, "utf8");
  for (const raw of txt.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY not set after loading .env");
}

const client = new Anthropic();
const MODEL = "claude-sonnet-4-5"; // Use sonnet-4-5 stable; sonnet-4-6 alias may not be live in this account
const HARD_CAP = 100;

// Anthropic pricing (USD per 1M tokens) for sonnet-4-5 standard tier.
// Approximate — used only for live cost printout. Final reconciliation
// via Anthropic console.
const PRICE_PER_M_INPUT  = 3.0;
const PRICE_PER_M_OUTPUT = 15.0;

function estimateCostUSD(usage) {
  if (!usage) return 0;
  return (usage.input_tokens  / 1e6) * PRICE_PER_M_INPUT +
         (usage.output_tokens / 1e6) * PRICE_PER_M_OUTPUT;
}

// ─── System prompt (S-R3: NO keyword stage references) ───────────────
const SYSTEM_PROMPT = `You are a content-audit assistant grading whether a study question's tested concept is properly grounded in its cited source material.

CONTEXT
- The study app is for the CompTIA Security+ SY0-701 exam.
- Source-authority hierarchy: CompTIA SY0-701 published objectives > Professor Messer video transcripts > Chapple/Seidl Sybex book > inline secondary sources.
- Each item is cited to a specific Messer video; you receive the full transcript of that video.
- Your job: judge whether the concept tested by the item is adequately covered in the cited transcript.

OUTPUT
Return JSON only. No prose outside the JSON. No Markdown code fences.

SCHEMA
{
  "category": "in-source" | "partial-depth" | "partial-adjacent" | "out-of-source" | "out-of-syllabus" | "ambiguous-call",
  "confidence": "high" | "medium" | "low",
  "fix_direction": "rewrite-to-source" | "move-to-correct-video" | "remove-from-catalog" | "mark-for-Sybex-arbitration" | "keep-as-enrichment",
  "justification_quote": "<verbatim string from transcript, OR null>",
  "justification_explanation": "<1-3 sentences>"
}

CATEGORY DEFINITIONS
- in-source: the tested concept appears in the cited transcript at sufficient depth to support the item as written.
- partial-depth: the concept appears in the transcript but is not taught to the depth the item expects (item assumes background the video doesn't deliver).
- partial-adjacent: the concept is plausibly in a different same-domain Sec+ video, but not the cited one.
- out-of-source: the concept does NOT appear in the cited transcript.
- out-of-syllabus: the concept is, to your knowledge, absent from any Sec+ source material.
- ambiguous-call: you cannot judge confidently from the transcript alone.

FIX-DIRECTION GUIDANCE
- rewrite-to-source: in-source but the item's framing diverges from the transcript; reword item.
- move-to-correct-video: partial-adjacent — re-cite to the correct video.
- remove-from-catalog: out-of-source AND out-of-syllabus, low pedagogical value.
- mark-for-Sybex-arbitration: borderline — needs human reference to the Sybex book.
- keep-as-enrichment: out-of-source but legitimate enrichment a Sec+ student may benefit from (e.g. background concept that strengthens understanding even though not on the exam).

JUSTIFICATION QUOTE RULES
- For in-source / partial-depth / partial-adjacent: justification_quote MUST be a verbatim substring from the transcript demonstrating the coverage (or its limit).
- For out-of-source / out-of-syllabus: justification_quote MUST be null (the concept is not in the transcript so there is no quote to give).
- For ambiguous-call: quote whatever fragment makes the ambiguity visible, or null if no relevant fragment exists.

Judge conceptually against the full transcript text. Do not rely on the literal presence of specific terms — if the concept is taught with different wording, that still counts as in-source.`;

// ─── Per-item user message ───────────────────────────────────────────
function describeItem(s) {
  const head = `type: ${s.type}\nsection: ${s.section} (${s.section_label})\nvideo: ${s.video} (${s.video_title})\ncitation: ${s.messer_video_citation}`;
  const it = s.item;
  if (s.type === "match") {
    return `${head}\n\nmatching_prompt: ${it.prompt}\nanswer: ${it.answer}`;
  }
  if (s.type === "cram") {
    return `${head}\n\ncram_term: ${it.term}\ncram_definition: ${it.def}`;
  }
  if (s.type === "mc" || s.type === "scen") {
    const correctOpt = (it.opts && typeof it.a === "number") ? it.opts[it.a] : "(unknown)";
    return `${head}\n\nstem: ${it.q}\ncorrect_option: ${correctOpt}\nexplanation: ${it.exp || ""}`;
  }
  return head;
}

function buildUserMessage(s, transcript) {
  return `<item>
${describeItem(s)}
</item>

<transcript source="Professor Messer ${s.messer_video_citation}">
${transcript}
</transcript>

Produce the JSON verdict per the schema.`;
}

// ─── Main ────────────────────────────────────────────────────────────
const sample = JSON.parse(readFileSync(resolve(OUT_DIR, "sample-selection.json"), "utf8"));

let totalCalls = 0;
let totalCost = 0;
const verdicts = [];
const errors = [];

console.log(`Starting LLM-as-judge: ${sample.items.length} items, model=${MODEL}, hard cap=${HARD_CAP}.`);

for (const item of sample.items) {
  if (totalCalls >= HARD_CAP) {
    console.error(`!! HARD CAP HIT (${HARD_CAP}). Aborting before remaining items.`);
    break;
  }

  const tpath = resolve(repo, item.transcript_path);
  if (!existsSync(tpath)) {
    errors.push({ location: item, error: "no-transcript", path: tpath });
    continue;
  }
  const transcript = readFileSync(tpath, "utf8");

  totalCalls++;
  let resp = null;
  let attempt = 0;
  while (attempt < 3) {
    try {
      resp = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(item, transcript) }],
      });
      break;
    } catch (e) {
      const status = e.status || e.statusCode;
      if ((status === 429 || status === 503) && attempt < 2) {
        const waitMs = (attempt + 1) * 2000;
        console.error(`  ${status} on ${item.section}/${item.video} — retry in ${waitMs}ms`);
        await new Promise(r => setTimeout(r, waitMs));
        attempt++;
        continue;
      }
      errors.push({ location: item, error: e.message, status });
      resp = null;
      break;
    }
  }
  if (!resp) continue;

  const cost = estimateCostUSD(resp.usage);
  totalCost += cost;

  // Parse JSON. The model is instructed to return JSON only.
  const raw = (resp.content?.[0]?.text || "").trim();
  let verdict;
  try {
    // Strip any accidental fences just in case.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    verdict = JSON.parse(cleaned);
  } catch (e) {
    errors.push({ location: item, error: "malformed-json", raw });
    console.log(`  [${totalCalls}/${sample.items.length}] §${item.video} ${item.type}[${item.index}] → JSON PARSE ERROR — $${cost.toFixed(4)}`);
    continue;
  }

  // Validate empty-quote rule (R1 mitigation)
  const allowEmptyQuote = ["out-of-source", "out-of-syllabus"];
  const quoteIsEmpty = verdict.justification_quote === null
                    || verdict.justification_quote === undefined
                    || (typeof verdict.justification_quote === "string" && !verdict.justification_quote.trim());
  let structural_flag = null;
  if (!allowEmptyQuote.includes(verdict.category) && quoteIsEmpty && verdict.category !== "ambiguous-call") {
    structural_flag = "empty-quote-on-positive-verdict";
  }
  // Verify quote is actually a substring of the transcript when present
  if (verdict.justification_quote && typeof verdict.justification_quote === "string") {
    if (!transcript.includes(verdict.justification_quote)) {
      structural_flag = structural_flag || "quote-not-verbatim";
    }
  }

  verdicts.push({
    location: { section: item.section, video: item.video, type: item.type, index: item.index },
    role: item.role,
    item: item.item,
    verdict,
    structural_flag,
    llm: {
      model: MODEL,
      usage: resp.usage,
      cost_usd: cost,
      timestamp: new Date().toISOString(),
    },
  });

  const flagStr = structural_flag ? ` [${structural_flag}]` : "";
  console.log(`  [${totalCalls}/${sample.items.length}] §${item.video} ${item.type}[${item.index}] → ${verdict.category} (${verdict.confidence})${flagStr} — $${cost.toFixed(4)} (running $${totalCost.toFixed(4)})`);
}

writeFileSync(resolve(OUT_DIR, "llm-verdicts.json"), JSON.stringify({
  metadata: {
    model: MODEL,
    total_calls: totalCalls,
    total_cost_usd: totalCost,
    hard_cap: HARD_CAP,
    timestamp: new Date().toISOString(),
  },
  verdicts,
}, null, 2));

if (errors.length) {
  writeFileSync(resolve(OUT_DIR, "errors.json"), JSON.stringify(errors, null, 2));
}

console.log(`\nDone. ${totalCalls} calls, $${totalCost.toFixed(4)} total, ${errors.length} errors.`);
