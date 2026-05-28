// Task 1g.3 — Objective-tagging judge (LLM-as-judge).
//
// Repurposed from scripts/audit-d-llm-judge.mjs. The Audit D judge stays
// frozen; this script copies the carry-over machinery and replaces the
// verdict prompt, output schema, and input shape.
//
// CARRY-OVER (unchanged-in-spirit from audit-d-llm-judge.mjs):
//   - Anthropic SDK + .env loader
//   - CLI args (--input, --output)
//   - Prompt caching: objectives.md + instructional preamble pinned in the
//     cached system block (cache_control: ephemeral). Cache-hit-rate
//     warned at <90% post-first-call.
//   - Single-retry validation pattern: ONE retry per item if the model's
//     objective_code is malformed or out-of-set (the natural analog of
//     audit-d's "quote-not-verbatim" retry). Same +30% retry budget.
//   - Resume-on-restart: existing --output is read; doneIds rebuilt from
//     verdicts[].id; main loop skips already-tagged items.
//   - Periodic flush: every FLUSH_EVERY verdicts (10 for the 30-item
//     calibration; raise to 50 for full-corpus by changing the constant).
//   - Per-call cost + cache stats + cumulative cost across sessions.
//   - Rate-limit retry (429/503) with backoff, separate from the
//     validation retry.
//
// REPLACED:
//   - System prompt: objectives.md is the authoritative X.Y code space;
//     instructional preamble teaches the tagging task, not the Audit D
//     in-source/partial-* categorisation.
//   - Output schema (locked S-2): objective_code (X.Y, no .Z) +
//     confidence (high/medium/low) + justification + ambiguity_flag.
//     No secondary_objective_code at calibration.
//   - Input shape: flat array from .audit-working/sb-1g-3/
//     calibration-sample-S1.json. Reads only id, stem, options, correct,
//     explanation per item. is_accidental_match is NEVER read — the
//     judge stays blind to anchor status (anchors are 5 of 30, used
//     for downstream ground-truth comparison only).
//   - Location key: item.id (e.g. sybex-ch04-q1) — flat, not
//     section|video|type|index.
//
// Usage:
//   node scripts/objective-tagging-judge.mjs
//     (defaults: --input .audit-working/sb-1g-3/calibration-sample-S1.json
//                --output .audit-working/sb-1g-3/calibration-verdicts.json)
//   node scripts/objective-tagging-judge.mjs \
//     --input <path> --output <path>

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
const DEFAULT_INPUT = resolve(
  repo,
  ".audit-working/sb-1g-3/calibration-sample-S1.json",
);
const DEFAULT_OUTPUT = resolve(
  repo,
  ".audit-working/sb-1g-3/calibration-verdicts.json",
);
const SAMPLE_PATH = cliArgs.input ? resolve(repo, cliArgs.input) : DEFAULT_INPUT;
const VERDICTS_PATH = cliArgs.output ? resolve(repo, cliArgs.output) : DEFAULT_OUTPUT;
const ERRORS_PATH = resolve(dirname(VERDICTS_PATH), "calibration-errors.json");

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
// Model + caps. Calibration is 30 items; full-corpus will be 500. HARD_CAP
// sized for 500 × 1.3 (verbatim retries) + headroom.
const MODEL = "claude-sonnet-4-5";
const HARD_CAP = 1000;
const RETRY_BUDGET_RATIO = 0.3;
const FLUSH_EVERY = 50;

// ─── Pricing (USD per 1M tokens) for sonnet-4-5 standard tier ─────────
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

// ─── Load objectives.md (authoritative X.Y code space) ───────────────
const OBJECTIVES_MD = readFileSync(
  resolve(repo, ".audit-working/comptia-sy0-701/objectives.md"),
  "utf8",
);

// Derive the canonical set of valid X.Y codes from objectives.md so the
// validation retry can list them in the corrective hint. ### X.Y headers
// only — depth-2 only, no .Z third-level.
function parseValidCodes(md) {
  const codes = new Set();
  for (const line of md.split("\n")) {
    const m = line.match(/^###\s+(\d+\.\d+)\s+/);
    if (m) codes.add(m[1]);
  }
  return codes;
}
const VALID_CODES = parseValidCodes(OBJECTIVES_MD);
if (VALID_CODES.size !== 28) {
  throw new Error(
    `objectives.md should yield 28 X.Y codes; parser found ${VALID_CODES.size}`,
  );
}
const VALID_CODES_SORTED = [...VALID_CODES].sort((a, b) => {
  const [ax, ay] = a.split(".").map(Number);
  const [bx, by] = b.split(".").map(Number);
  return ax - bx || ay - by;
});

// ─── SYSTEM PROMPT (cached) ──────────────────────────────────────────
const SYSTEM_PROMPT_TEXT = `You are an objective-tagging assistant. Your job is to identify which CompTIA Security+ SY0-701 published exam objective a study question tests.

CONTEXT
- The study app is for the CompTIA Security+ SY0-701 exam.
- The authoritative code space is the official CompTIA SY0-701 objectives v5.0, included below in full.
- You receive one question at a time: stem, four options, correct option, and the explanation that accompanies it. You will NOT receive any source video, transcript, or anchor metadata. Tag the concept the question tests, not the test-bank file it came from.

TASK
For each question, assign the single best CompTIA SY0-701 X.Y subsection (depth-2; e.g. "2.4", never "2.4.1" or "2.4.a"). "Best" = the subsection whose published content most directly enables a student to answer the item correctly.

OUTPUT
Return JSON only. No prose outside the JSON. No Markdown code fences.

SCHEMA
{
  "objective_code": "<exactly one X.Y code from the published list below, e.g. \\"2.4\\">",
  "confidence": "high" | "medium" | "low",
  "justification": "<1-3 sentences citing the specific bullet, sub-bullet, or topic phrase from the matched subsection content below that the question tests against>",
  "ambiguity_flag": true | false
}

OBJECTIVE_CODE RULES
- Use the X.Y form only. Never include a third-level .Z.
- The code MUST be one of the 28 codes published in the objectives document below. If you cannot identify a code from that list that fits, return your best fit and set ambiguity_flag=true with a justification explaining the mismatch — do NOT invent a code.

AMBIGUITY_FLAG RULES
- Set ambiguity_flag=true ONLY when the question genuinely spans two distinct X.Y subsections — i.e. a student answering correctly would draw on content explicitly published under two different subsections in the document below. Mention the second subsection in the justification when you set the flag.
- Surface-level overlap (a vocabulary term used in two places) is not span. Only set the flag when answering the item requires content from two subsections.
- Set ambiguity_flag=false otherwise (the default).

CONFIDENCE CALIBRATION
- high: a single subsection in the document below explicitly publishes the concept, control, attack, term, or scenario the question tests. No plausible alternative reading.
- medium: the concept is published under your chosen subsection but the published wording is general or the item's framing required interpretation. A reasonable second reader could choose differently.
- low: the concept is not clearly published anywhere; your verdict is best-fit from limited evidence. Often paired with ambiguity_flag=true.

Sanity check: if every verdict comes back high, you are not calibrating. Mixed-difficulty corpora produce mixed-confidence verdicts; uniform high signals a problem.

JUSTIFICATION RULES
- Cite the matched subsection's published content (the bullet, sub-bullet, or topic phrase from the objectives document below) that the question tests against. Quote or paraphrase the published text — do not paraphrase the question itself.
- 1-3 sentences. When ambiguity_flag=true, name both subsections and explain the span.

AUTHORITATIVE OBJECTIVES DOCUMENT (CompTIA SY0-701 v5.0)

${OBJECTIVES_MD}`;

const systemParam = [
  { type: "text", text: SYSTEM_PROMPT_TEXT, cache_control: { type: "ephemeral" } },
];

// ─── Validation retry hint (round-2 message) ─────────────────────────
function validationHint(rawCode, reason) {
  return `Your previous response's objective_code (${JSON.stringify(rawCode)}) is ${reason}. The valid X.Y codes from the published objectives document are exactly:

${VALID_CODES_SORTED.join(", ")}

Re-read the item and return a corrected JSON verdict using one of those codes. If no single code is a clear fit, return your closest match and set ambiguity_flag=true with a justification explaining the mismatch. Return the corrected JSON only. No prose outside the JSON.`;
}

// ─── Per-item user message ───────────────────────────────────────────
function buildUserMessage(item) {
  const opts = Object.entries(item.options)
    .map(([k, v]) => `  ${k}. ${v}`)
    .join("\n");
  return `<item id="${item.id}">
stem: ${item.stem}

options:
${opts}

correct: ${item.correct.letter}. ${item.correct.text}

explanation: ${item.explanation}
</item>

Produce the JSON verdict per the schema.`;
}

// ─── Validation ──────────────────────────────────────────────────────
function validateVerdict(parsed) {
  // Returns { ok: true } | { ok: false, reason: string, badField: string }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "not an object", badField: "root" };
  }
  if (typeof parsed.objective_code !== "string") {
    return { ok: false, reason: "missing or non-string objective_code", badField: "objective_code" };
  }
  if (!/^\d+\.\d+$/.test(parsed.objective_code)) {
    return { ok: false, reason: "not in X.Y form (no .Z, no letters)", badField: "objective_code" };
  }
  if (!VALID_CODES.has(parsed.objective_code)) {
    return { ok: false, reason: "not in the published X.Y code set", badField: "objective_code" };
  }
  if (!["high", "medium", "low"].includes(parsed.confidence)) {
    return { ok: false, reason: "confidence must be high|medium|low", badField: "confidence" };
  }
  if (typeof parsed.justification !== "string" || !parsed.justification.trim()) {
    return { ok: false, reason: "justification must be a non-empty string", badField: "justification" };
  }
  if (typeof parsed.ambiguity_flag !== "boolean") {
    return { ok: false, reason: "ambiguity_flag must be boolean", badField: "ambiguity_flag" };
  }
  return { ok: true };
}

// ─── Main ────────────────────────────────────────────────────────────
const sample = JSON.parse(readFileSync(SAMPLE_PATH, "utf8"));
if (!Array.isArray(sample)) {
  throw new Error(
    `expected flat array at ${SAMPLE_PATH}, got ${typeof sample}`,
  );
}
mkdirSync(dirname(VERDICTS_PATH), { recursive: true });

// ─── Resume support (key = item.id) ─────────────────────────────────
const verdicts = [];
const doneIds = new Set();
let priorMetadata = null;
if (existsSync(VERDICTS_PATH)) {
  const prior = JSON.parse(readFileSync(VERDICTS_PATH, "utf8"));
  if (Array.isArray(prior.verdicts)) {
    for (const v of prior.verdicts) {
      verdicts.push(v);
      if (v.id) doneIds.add(v.id);
    }
    priorMetadata = prior.metadata || null;
  }
}
const priorErrors = [];
if (existsSync(ERRORS_PATH)) {
  try {
    const e = JSON.parse(readFileSync(ERRORS_PATH, "utf8"));
    if (Array.isArray(e)) priorErrors.push(...e);
  } catch { /* malformed errors file — start fresh */ }
}

let totalCalls = 0;
let totalCost = 0;
let retryCount = 0;
const cacheStats = [];
const errors = [];

const retryBudget = Math.max(5, Math.ceil(sample.length * RETRY_BUDGET_RATIO));
let sinceLastFlush = 0;
const sessionStartedAt = new Date().toISOString();
const initialDoneCount = doneIds.size;

console.log(`Starting objective-tagging judge: ${sample.length} items, model=${MODEL}, hard cap=${HARD_CAP}.`);
console.log(`Input:        ${SAMPLE_PATH}`);
console.log(`Output:       ${VERDICTS_PATH}`);
console.log(`Retry budget: ${retryBudget} (validation retries)`);
console.log(`Prompt cache: enabled (system block has cache_control: ephemeral)`);
console.log(`Flush every:  ${FLUSH_EVERY} verdicts`);
console.log(`Valid codes:  ${VALID_CODES.size} (parsed from objectives.md)`);
if (initialDoneCount > 0) {
  const remaining = sample.length - initialDoneCount;
  const priorCum =
    priorMetadata?.cumulative_cost_usd ??
    (priorMetadata?.session_history || []).reduce(
      (s, x) => s + (x.session_cost_usd || 0),
      0,
    ) ??
    priorMetadata?.total_cost_usd ??
    0;
  console.log(`RESUME: ${initialDoneCount} prior verdicts loaded; ${remaining} items remaining.`);
  console.log(`        Prior cumulative cost: $${(+priorCum).toFixed(4)}`);
}
console.log("");

for (const item of sample) {
  if (totalCalls >= HARD_CAP) {
    console.error(`!! HARD CAP HIT (${totalCalls}/${HARD_CAP}). Aborting before remaining items.`);
    break;
  }
  if (retryCount > retryBudget) {
    console.error(`!! RETRY BUDGET EXCEEDED (${retryCount}>${retryBudget}). Aborting before remaining items.`);
    break;
  }
  if (doneIds.has(item.id)) continue;

  let verdict = null;
  let structural_flag = null;
  let lastRawText = null;
  let lastRawCode = null;
  const usageRecords = [];
  let parseErrorThisItem = false;

  for (let round = 0; round < 2; round++) {
    const messages = [{ role: "user", content: buildUserMessage(item) }];
    if (round > 0) {
      messages.push({ role: "assistant", content: lastRawText });
      messages.push({
        role: "user",
        content: validationHint(lastRawCode, structural_flag || "invalid"),
      });
    }

    // Rate-limit retry loop (separate from validation retry)
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
        if (round > 0) retryCount++;
        break;
      } catch (e) {
        const status = e.status || e.statusCode;
        if ((status === 429 || status === 503) && attempt < 2) {
          const waitMs = (attempt + 1) * 2000;
          console.error(`  ${status} on ${item.id} — retry in ${waitMs}ms`);
          await new Promise((r) => setTimeout(r, waitMs));
          attempt++;
          continue;
        }
        errors.push({ id: item.id, error: e.message, status, round });
        resp = null;
        break;
      }
    }
    if (!resp) break;

    const cost = estimateCostUSD(resp.usage);
    totalCost += cost;
    usageRecords.push({ round, usage: resp.usage, cost });
    cacheStats.push({
      call_idx: totalCalls,
      round,
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
      errors.push({ id: item.id, error: "malformed-json", raw, round });
      if (round === 0) continue; // retry once on malformed JSON
      parseErrorThisItem = true;
      break;
    }
    lastRawCode = parsed?.objective_code ?? null;

    const v = validateVerdict(parsed);
    if (!v.ok) {
      structural_flag = `validation-failed: ${v.reason}`;
      if (round === 0 && retryCount < retryBudget) continue; // round-2 retry
      verdict = parsed; // keep best-effort verdict with a post-retry flag
      structural_flag = `${structural_flag}-after-retry`;
      break;
    }

    verdict = parsed;
    structural_flag = null;
    break;
  }

  if (parseErrorThisItem || !verdict) {
    const flagStr = parseErrorThisItem ? " [malformed-json]" : " [no-verdict]";
    console.log(`  ${item.id} → ERROR${flagStr}`);
    continue;
  }

  verdicts.push({
    id: item.id,
    source: item.source,
    n: item.n,
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
  doneIds.add(item.id);

  const flagStr = structural_flag ? ` [${structural_flag}]` : "";
  const retryStr = usageRecords.length > 1 ? " (retried)" : "";
  const itemCost = usageRecords.reduce((s, r) => s + r.cost, 0);
  console.log(`  [${totalCalls}] ${item.id} → ${verdict.objective_code} (${verdict.confidence})${verdict.ambiguity_flag ? " AMB" : ""}${flagStr}${retryStr} — $${itemCost.toFixed(4)} (running $${totalCost.toFixed(4)})`);

  sinceLastFlush++;
  if (sinceLastFlush >= FLUSH_EVERY) {
    flushOutput();
    sinceLastFlush = 0;
    console.log(`  [flush at ${verdicts.length}/${sample.length} verdicts; session $${totalCost.toFixed(4)}]`);
  }
}

// ─── Cache hit-rate computation (session-only) ───────────────────────
function buildCacheSummary() {
  const callsAfterFirst = cacheStats.slice(1);
  const cacheHitsAfterFirst = callsAfterFirst.filter((c) => c.cache_read > 0).length;
  const rate = callsAfterFirst.length > 0 ? cacheHitsAfterFirst / callsAfterFirst.length : 0;
  return {
    summary: {
      total_writes:              cacheStats.reduce((s, c) => s + c.cache_creation, 0),
      total_reads:               cacheStats.reduce((s, c) => s + c.cache_read,     0),
      calls_with_cache_write:    cacheStats.filter((c) => c.cache_creation > 0).length,
      calls_with_cache_read:     cacheStats.filter((c) => c.cache_read     > 0).length,
      cache_hit_rate_after_first: +rate.toFixed(4),
      per_call: cacheStats,
    },
    rate,
    hits: cacheHitsAfterFirst,
    after_first_total: callsAfterFirst.length,
  };
}

// ─── Output builder (used by periodic flush AND final write) ─────────
function buildOutput() {
  const cs = buildCacheSummary();
  const sessionEntry = {
    started_at: sessionStartedAt,
    last_flush_at: new Date().toISOString(),
    items_in_sample: sample.length,
    items_skipped_already_done: initialDoneCount,
    session_calls: totalCalls,
    session_retries: retryCount,
    session_cost_usd: +totalCost.toFixed(6),
    cache_hit_rate_after_first: cs.summary.cache_hit_rate_after_first,
  };
  const prior_history = priorMetadata?.session_history || [];
  const matchingIdx = prior_history.findIndex((x) => x.started_at === sessionStartedAt);
  const session_history = matchingIdx >= 0
    ? [...prior_history.slice(0, matchingIdx), sessionEntry, ...prior_history.slice(matchingIdx + 1)]
    : [...prior_history, sessionEntry];
  const cumulative_cost_usd = +session_history
    .reduce((s, x) => s + (x.session_cost_usd || 0), 0)
    .toFixed(6);
  return {
    metadata: {
      model: MODEL,
      sample_size: sample.length,
      total_calls: totalCalls,
      verdicts_produced: verdicts.length,
      retry_calls: retryCount,
      retry_budget: retryBudget,
      total_cost_usd: +totalCost.toFixed(6),
      cumulative_cost_usd,
      hard_cap: HARD_CAP,
      timestamp: new Date().toISOString(),
      input_path: SAMPLE_PATH,
      output_path: VERDICTS_PATH,
      prompt_cache_enabled: true,
      cache_stats: cs.summary,
      session_started_at: sessionStartedAt,
      items_skipped_already_done: initialDoneCount,
      session_history,
    },
    verdicts,
  };
}

function flushOutput() {
  writeFileSync(VERDICTS_PATH, JSON.stringify(buildOutput(), null, 2));
  if (errors.length || priorErrors.length) {
    writeFileSync(ERRORS_PATH, JSON.stringify([...priorErrors, ...errors], null, 2));
  }
}

// ─── Final flush ────────────────────────────────────────────────────
flushOutput();

// ─── Summary printout ──────────────────────────────────────────────
const cs = buildCacheSummary();
console.log("");
console.log(`Done. ${totalCalls} API calls (${verdicts.length} verdicts + ${retryCount} validation retries), $${totalCost.toFixed(4)} total, ${errors.length} errors this session.`);
console.log(`Skipped (already done from prior session): ${initialDoneCount}`);
const out = buildOutput();
console.log(`Cumulative cost across all sessions: $${out.metadata.cumulative_cost_usd.toFixed(4)}`);
console.log(`Cache stats (this session only):`);
console.log(`  Total cache writes: ${cs.summary.total_writes} tokens across ${cs.summary.calls_with_cache_write} call(s)`);
console.log(`  Total cache reads:  ${cs.summary.total_reads} tokens across ${cs.summary.calls_with_cache_read} call(s)`);
console.log(`  Cache hit rate (calls after first): ${cs.hits}/${cs.after_first_total} = ${(cs.rate*100).toFixed(1)}%`);

if (cs.after_first_total >= 2 && cs.rate < 0.9) {
  console.error(`!! WARNING: cache hit rate ${(cs.rate*100).toFixed(1)}% is below 90% — prompt caching may not be working as intended. Inspect cache_stats.per_call in the output JSON before scaling.`);
}
