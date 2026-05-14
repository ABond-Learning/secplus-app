// Audit D Stage 2 LLM-as-judge.
//
// SUB-BATCH 1 PRE-FLIGHT FINAL STATE (2026-05-14):
//   This file ships the iter0 prompt: Recs 2 + 4 landed; Rec 1 deferred to
//   a future-session structural post-process approach; Rec 3 accepted as
//   a known limitation.
//
//   Rec 1 (partial-adjacent definition strengthening): DEFERRED.
//     iter0 (Rec 1 in-prompt only) produced 0 partial-adjacent recognition.
//     iter1 (iter0 + reorder + decision-tree + consistency check) produced
//     5/12 partial-adjacent verdicts on micro-recal but caused 10/23 strict
//     regressions on the regression-sample including 3/4 smoke-test items
//     (§2.3.3 mutex/atomic shifted from out-of-source to partial-adjacent).
//     iter1 rolled back. Future session: post-process verdicts to flip any
//     verdict with fix_direction="move-to-correct-video" and category
//     ≠ partial-adjacent — addresses the LLM's internal contradiction
//     pattern (3 such verdicts observed in iter0) without prompt-tuning
//     trade-offs.
//
//   Rec 2 (partial-depth a/b/c pattern examples): LANDED.
//     3/3 targeted Subset 1 disagreement items shifted to correct
//     partial-depth verdict (rows 5 DHE, 11 PCI DSS, 30 PCI pen test).
//
//   Rec 3 (confidence calibration with behavioral anchors): ACCEPTED AS
//     LIMITATION. Soft prompt instructions did not move the needle —
//     iter0 returned 12/12 high confidence on micro-recal, matching
//     Sub-batch 0's 30/30 high. Confidence remains a softer signal than
//     category agreement; downstream review uses structural_flag, quote
//     presence, and category↔fix-direction consistency as stronger
//     signals. Tighter confidence rules deferred — revisit only if
//     Sub-batch 1 full-corpus surfaces real problems caused by uniform
//     high confidence.
//
//   Rec 4 (verbatim-quote rule + escape to ambiguous-call): LANDED.
//     Paraphrase rate dropped from 27% (Sub-batch 0, no retry) to 8.3%
//     (iter0 micro-recal, single-retry mode).
//   - Included MESSER_VIDEOS.md inventory in system prompt to ground
//     partial-adjacent judgments in canonical video titles.
//   - Enabled Anthropic prompt caching (cache_control: ephemeral) on
//     the system block. Tracks cache_creation_input_tokens and
//     cache_read_input_tokens per call.
//   - Added single-retry verbatim enforcement: on quote-not-verbatim,
//     retry once with corrective hint; retry budget capped at +30% of
//     base call count.
//   - Added --input / --output CLI args. Defaults preserve Sub-batch 0
//     behavior.
//
// CRITICAL S-R3 INVARIANT (boundary): the LLM never sees Stage 1
// keyword results. The system prompt does not mention keyword
// absence / term presence. Conceptual judgment only.
//
// Cost guardrails (S-R5):
//   - HARD_CAP: abort if >100 API calls (covers micro-recal + regression;
//     full-corpus Sub-batch 1 will need an override, separate decision)
//   - per-call cost printed live
//   - cache hit rate verified at end (warn if <90% after first call)
//
// Output: <input-dir>/llm-verdicts.json (or --output path)
//         + errors.json (sidecar, if any errors)
//
// Usage:
//   node scripts/audit-d-llm-judge.mjs
//     (defaults to Sub-batch 0 calibration paths)
//   node scripts/audit-d-llm-judge.mjs \
//     --input .audit-working/audit-d-sub-batch-1-preflight/microrecal-sample.json \
//     --output .audit-working/audit-d-sub-batch-1-preflight/microrecal-verdicts.json

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

// ─── CLI args ────────────────────────────────────────────────────────
function parseArgs() {
  const out = { input: null, output: null };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if ((a === "--input" || a === "-i") && i + 1 < process.argv.length) {
      out.input = process.argv[++i];
    } else if ((a === "--output" || a === "-o") && i + 1 < process.argv.length) {
      out.output = process.argv[++i];
    }
  }
  return out;
}
const cliArgs = parseArgs();
const DEFAULT_DIR = resolve(repo, ".audit-working/audit-d-calibration");
const SAMPLE_PATH = cliArgs.input
  ? resolve(repo, cliArgs.input)
  : resolve(DEFAULT_DIR, "sample-selection.json");
const SAMPLE_DIR = dirname(SAMPLE_PATH);
const VERDICTS_PATH = cliArgs.output
  ? resolve(repo, cliArgs.output)
  : resolve(SAMPLE_DIR, "llm-verdicts.json");
const ERRORS_PATH = resolve(SAMPLE_DIR, "errors.json");

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
const MODEL = "claude-sonnet-4-5";
const HARD_CAP = 100;
const RETRY_BUDGET_RATIO = 0.3;

// ─── Pricing (USD per 1M tokens) for sonnet-4-5 standard tier ─────────
// Approximate — used only for live cost printout. Final reconciliation
// via Anthropic console.
const PRICE_PER_M_INPUT       = 3.0;
const PRICE_PER_M_OUTPUT      = 15.0;
const PRICE_PER_M_CACHE_WRITE = 3.75;   // 1.25x base input
const PRICE_PER_M_CACHE_READ  = 0.30;   // 0.1x base input

function estimateCostUSD(usage) {
  if (!usage) return 0;
  return (usage.input_tokens               || 0) / 1e6 * PRICE_PER_M_INPUT +
         (usage.cache_creation_input_tokens || 0) / 1e6 * PRICE_PER_M_CACHE_WRITE +
         (usage.cache_read_input_tokens     || 0) / 1e6 * PRICE_PER_M_CACHE_READ +
         (usage.output_tokens              || 0) / 1e6 * PRICE_PER_M_OUTPUT;
}

// ─── MESSER_VIDEOS.md inventory (for partial-adjacent grounding) ─────
const MESSER_INVENTORY = readFileSync(resolve(repo, "MESSER_VIDEOS.md"), "utf8");

// ─── Tuned SYSTEM_PROMPT (S-R3: NO keyword stage references) ─────────
const SYSTEM_PROMPT_TEXT = `You are a content-audit assistant grading whether a study question's tested concept is properly grounded in its cited source material.

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

- partial-depth: the underlying concept appears in the transcript but the item's specific framing requires depth the video does not develop. Concrete patterns:
  (a) The mechanism is taught but the specific acronym, regulation name, or named-term the item asks about is not used. Example: the transcript teaches Diffie-Hellman-style ephemeral key exchange but never names "DHE" — that is partial-depth, not out-of-source, because the underlying mechanism IS in the video.
  (b) The surface concept is named but the item assumes a specific application or compliance framing the video does not develop. Example: the transcript mentions pen tests are used in audits, but the item assumes PCI-DSS-specific annual-pen-test compliance details — partial-depth, not in-source.
  (c) The structural feature is taught but a security argument the item tests is left implicit. Example: transcript shows containers share a host OS versus VM guest-OS architecture, but the item asks about the kernel-exploit security boundary directly. Whether this is partial-depth or in-source depends on whether the security argument follows DIRECTLY from the structural teaching — judge case by case.

- partial-adjacent: the concept does NOT appear in the cited transcript, BUT you have positive reason to believe it appears in a different SY0-701 Messer video because (i) it is clearly a Security+-relevant concept that belongs somewhere in the curriculum, or (ii) the video inventory below contains an obvious correct home for it. Prefer partial-adjacent over out-of-source whenever you can name a likely correct video. Fix-direction in this case is "move-to-correct-video".

- out-of-source: the concept does NOT appear in the cited transcript and you cannot identify another Messer video that covers it. Use this when the concept is curriculum-relevant but you cannot place it.

- out-of-syllabus: the concept appears to be entirely outside Sec+ scope (not in CompTIA objectives, not in any Messer video, not Sec+-relevant material).

- ambiguous-call: you cannot judge confidently from the transcript alone, OR you cannot find a verbatim quote to support a positive verdict (see quote rules below).

CONFIDENCE CALIBRATION
Use confidence to signal how a senior reviewer should treat your verdict:
- high: the transcript content fully determines the verdict; no plausible alternative reading exists. You would describe this conclusion to a senior reviewer without caveats.
- medium: the verdict required weighing surface coverage against tested depth, or reasonable readers could categorize this differently. You would want the reasoning flagged for review.
- low: the transcript is genuinely ambiguous or the verdict is your best guess from limited evidence. You would request arbitration.

Sanity check: in prior calibration, a careful second reader returned ~30% medium-confidence verdicts. If every verdict in your pass comes back high, you are not calibrating — re-examine borderline items.

FIX-DIRECTION GUIDANCE
- rewrite-to-source: in-source but the item's framing diverges from the transcript; reword item.
- move-to-correct-video: partial-adjacent — re-cite to the correct video.
- remove-from-catalog: out-of-source AND out-of-syllabus, low pedagogical value.
- mark-for-Sybex-arbitration: borderline — needs human reference to the Sybex book.
- keep-as-enrichment: out-of-source but legitimate enrichment a Sec+ student may benefit from (e.g. background concept that strengthens understanding even though not on the exam).

JUSTIFICATION QUOTE RULES — STRICT VERBATIM
- For in-source / partial-depth / partial-adjacent: justification_quote MUST be a verbatim substring copy-pasted from the transcript. Verbatim means: exact, contiguous, character-for-character match including punctuation, spaces, and capitalization. Do not abbreviate with ellipsis. Do not combine non-adjacent fragments. Do not paraphrase.
- If you cannot find a verbatim substring that supports your intended positive verdict: set the category to "ambiguous-call" instead, and put the closest-relevant verbatim fragment in the quote — or null if no relevant fragment exists.
- For out-of-source / out-of-syllabus: justification_quote MUST be null (the concept is absent from the transcript so there is no quote to give).

VIDEO INVENTORY
The following is the full inventory of Professor Messer SY0-701 video titles (no transcript bodies). Use it to judge partial-adjacent decisions — if you have reason to believe an item's concept belongs in one of these videos but is not in the cited one, that is partial-adjacent rather than out-of-source.

${MESSER_INVENTORY}

Judge conceptually against the full transcript text. Do not rely on the literal presence of specific terms — if the concept is taught with different wording, that still counts as in-source (unless one of the partial-depth patterns above applies).`;

const systemParam = [
  { type: "text", text: SYSTEM_PROMPT_TEXT, cache_control: { type: "ephemeral" } },
];

// ─── Verbatim retry hint (used on round-2 messages) ──────────────────
const VERBATIM_RETRY_HINT = `Your previous response's justification_quote is not a verbatim substring of the transcript. Re-read the transcript and provide a corrected JSON verdict. Either:

(a) Provide a verbatim substring (exact, contiguous, character-for-character including punctuation, spaces, and capitalization) from the transcript that supports your verdict, OR

(b) If no verbatim substring exists to support a positive verdict, change category to "ambiguous-call" and either provide the closest-relevant verbatim fragment or use null.

Return the corrected JSON only. No prose outside the JSON.`;

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
const sample = JSON.parse(readFileSync(SAMPLE_PATH, "utf8"));
mkdirSync(SAMPLE_DIR, { recursive: true });

let totalCalls = 0;
let totalCost = 0;
let retryCount = 0;
const cacheStats = [];
const verdicts = [];
const errors = [];

const retryBudget = Math.max(5, Math.ceil(sample.items.length * RETRY_BUDGET_RATIO));

console.log(`Starting LLM-as-judge: ${sample.items.length} items, model=${MODEL}, hard cap=${HARD_CAP}.`);
console.log(`Input:        ${SAMPLE_PATH}`);
console.log(`Output:       ${VERDICTS_PATH}`);
console.log(`Retry budget: ${retryBudget} (verbatim retries)`);
console.log(`Prompt cache: enabled (system block has cache_control: ephemeral)`);
console.log("");

for (const item of sample.items) {
  if (totalCalls >= HARD_CAP) {
    console.error(`!! HARD CAP HIT (${totalCalls}/${HARD_CAP}). Aborting before remaining items.`);
    break;
  }
  if (retryCount > retryBudget) {
    console.error(`!! RETRY BUDGET EXCEEDED (${retryCount}>${retryBudget}). Aborting before remaining items.`);
    break;
  }

  const tpath = resolve(repo, item.transcript_path);
  if (!existsSync(tpath)) {
    errors.push({ location: item, error: "no-transcript", path: tpath });
    continue;
  }
  const transcript = readFileSync(tpath, "utf8");

  let verdict = null;
  let structural_flag = null;
  let lastRawText = null;
  const usageRecords = [];
  let parseErrorThisItem = false;

  for (let quoteRound = 0; quoteRound < 2; quoteRound++) {
    const messages = [{ role: "user", content: buildUserMessage(item, transcript) }];
    if (quoteRound > 0) {
      messages.push({ role: "assistant", content: lastRawText });
      messages.push({ role: "user", content: VERBATIM_RETRY_HINT });
    }

    // Rate-limit retry loop (separate from verbatim retry)
    let resp = null;
    let attempt = 0;
    while (attempt < 3) {
      try {
        resp = await client.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: systemParam,
          messages,
        });
        totalCalls++;
        if (quoteRound > 0) retryCount++;
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
        errors.push({ location: item, error: e.message, status, round: quoteRound });
        resp = null;
        break;
      }
    }
    if (!resp) break;

    const cost = estimateCostUSD(resp.usage);
    totalCost += cost;
    usageRecords.push({ round: quoteRound, usage: resp.usage, cost });
    cacheStats.push({
      call_idx: totalCalls,
      round: quoteRound,
      input_tokens:    resp.usage.input_tokens                || 0,
      cache_creation:  resp.usage.cache_creation_input_tokens || 0,
      cache_read:      resp.usage.cache_read_input_tokens     || 0,
      output_tokens:   resp.usage.output_tokens               || 0,
    });

    const raw = (resp.content?.[0]?.text || "").trim();
    lastRawText = raw;

    let parsed;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      errors.push({ location: item, error: "malformed-json", raw, round: quoteRound });
      if (quoteRound === 0) {
        // Retry once on malformed JSON too (covered by same retry budget)
        continue;
      }
      parseErrorThisItem = true;
      break;
    }

    // Verify quote per category
    const positiveCats = ["in-source", "partial-depth", "partial-adjacent"];
    const quoteIsEmpty = parsed.justification_quote === null
                      || parsed.justification_quote === undefined
                      || (typeof parsed.justification_quote === "string" && !parsed.justification_quote.trim());
    let flag = null;
    if (positiveCats.includes(parsed.category)) {
      if (quoteIsEmpty) {
        flag = "empty-quote-on-positive-verdict";
      } else if (typeof parsed.justification_quote === "string" && !transcript.includes(parsed.justification_quote)) {
        flag = "quote-not-verbatim";
      }
    }

    if (flag && quoteRound === 0 && retryCount < retryBudget) {
      // Trigger one verbatim retry
      continue;
    }

    verdict = parsed;
    structural_flag = flag ? (quoteRound === 0 ? flag : `${flag}-after-retry`) : null;
    break;
  }

  if (parseErrorThisItem || !verdict) {
    const flagStr = parseErrorThisItem ? " [malformed-json]" : " [no-verdict]";
    console.log(`  §${item.video} ${item.type}[${item.index}] → ERROR${flagStr}`);
    continue;
  }

  verdicts.push({
    location: { section: item.section, video: item.video, type: item.type, index: item.index },
    role: item.role,
    item: item.item,
    verdict,
    structural_flag,
    quote_retried: usageRecords.length > 1,
    llm: {
      model: MODEL,
      rounds: usageRecords,
      cost_usd: usageRecords.reduce((s, r) => s + r.cost, 0),
      timestamp: new Date().toISOString(),
    },
  });

  const flagStr = structural_flag ? ` [${structural_flag}]` : "";
  const retryStr = usageRecords.length > 1 ? " (retried)" : "";
  const itemCost = usageRecords.reduce((s, r) => s + r.cost, 0);
  console.log(`  [${totalCalls}] §${item.video} ${item.type}[${item.index}] → ${verdict.category} (${verdict.confidence})${flagStr}${retryStr} — $${itemCost.toFixed(4)} (running $${totalCost.toFixed(4)})`);
}

// ─── Cache hit-rate computation ─────────────────────────────────────
const callsAfterFirst = cacheStats.slice(1);
const cacheHitsAfterFirst = callsAfterFirst.filter(c => c.cache_read > 0).length;
const cacheHitRate = callsAfterFirst.length > 0
  ? cacheHitsAfterFirst / callsAfterFirst.length
  : 0;

const cacheSummary = {
  total_writes:              cacheStats.reduce((s, c) => s + c.cache_creation, 0),
  total_reads:               cacheStats.reduce((s, c) => s + c.cache_read,     0),
  calls_with_cache_write:    cacheStats.filter(c => c.cache_creation > 0).length,
  calls_with_cache_read:     cacheStats.filter(c => c.cache_read     > 0).length,
  cache_hit_rate_after_first: +cacheHitRate.toFixed(4),
  per_call: cacheStats,
};

// ─── Write output ───────────────────────────────────────────────────
const output = {
  metadata: {
    model: MODEL,
    sample_size: sample.items.length,
    total_calls: totalCalls,
    verdicts_produced: verdicts.length,
    retry_calls: retryCount,
    retry_budget: retryBudget,
    total_cost_usd: +totalCost.toFixed(6),
    hard_cap: HARD_CAP,
    timestamp: new Date().toISOString(),
    input_path: SAMPLE_PATH,
    output_path: VERDICTS_PATH,
    prompt_cache_enabled: true,
    cache_stats: cacheSummary,
  },
  verdicts,
};

writeFileSync(VERDICTS_PATH, JSON.stringify(output, null, 2));

if (errors.length) {
  writeFileSync(ERRORS_PATH, JSON.stringify(errors, null, 2));
}

// ─── Summary printout ──────────────────────────────────────────────
console.log("");
console.log(`Done. ${totalCalls} API calls (${verdicts.length} verdicts + ${retryCount} verbatim retries), $${totalCost.toFixed(4)} total, ${errors.length} errors.`);
console.log(`Cache stats:`);
console.log(`  Total cache writes: ${cacheSummary.total_writes} tokens across ${cacheSummary.calls_with_cache_write} call(s)`);
console.log(`  Total cache reads:  ${cacheSummary.total_reads} tokens across ${cacheSummary.calls_with_cache_read} call(s)`);
console.log(`  Cache hit rate (calls after first): ${cacheHitsAfterFirst}/${callsAfterFirst.length} = ${(cacheHitRate*100).toFixed(1)}%`);

if (callsAfterFirst.length >= 2 && cacheHitRate < 0.9) {
  console.error(`!! WARNING: cache hit rate ${(cacheHitRate*100).toFixed(1)}% is below 90% — prompt caching may not be working as intended. Inspect cache_stats.per_call in the output JSON before scaling.`);
}
