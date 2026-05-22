// Cross-packet consistency annotation for SB-fix-1b packets
// (cadence Rule 5).
//
// For each item in the target packet, find prior adjudications
// (SB-fix-1a packets 1-3 + SB-fix-1b packets 1..N-1) whose item
// content matches in concept. Surface as inline hints:
//   - "matches SB-fix-1a #X (mc/scen on same parent video)" — strongest
//   - "matches SB-fix-1b packet N #Y (same parent video)" — strong
//   - "matches SB-fix-1a #X (different video, same concept)" — moderate
//
// Concept-match heuristic: shared significant noun phrase between
// the items' searchable text (q/exp for mc/scen; term/def for cram;
// prompt/answer for match), filtered through a stopword list.
//
// Supervisor reviews hints by EXCEPTION per Rule 5 — items where the
// proposed consistency hint is wrong. Failure mode (spurious match)
// is mitigated by post-sub-batch consistency audit pass.
//
// Usage:
//   node scripts/sb-fix-1b-cross-packet-annotate.mjs --packet 3
//
// Output:
//   .audit-working/sb-fix-1b/packet-N-cross-packet-hints.md
//   .audit-working/sb-fix-1b/packet-N-cross-packet-hints.json
//

import { readFileSync, writeFileSync, existsSync } from "node:fs";
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
  if (packet == null) {
    console.error("usage: --packet <N>");
    process.exit(2);
  }
  return { packet };
}
const args = parseArgs();

const QUESTIONS = resolve(repo, "questions.json");
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));

function findItem(section, video, type, index) {
  const sec = questions.find(s => s.id === section);
  if (!sec) return null;
  const vid = sec.videos.find(v => v.id === video);
  if (!vid) return null;
  const arr =
    type === "mc"   ? vid.questions :
    type === "scen" ? vid.scenarios :
    type === "match"? vid.matching  :
    type === "cram" ? vid.cram      : null;
  if (!arr) return null;
  return arr[index] || null;
}

// ─── Searchable text per item ────────────────────────────────────────
function searchableText(item, type) {
  if (!item) return "";
  if (type === "mc" || type === "scen") {
    return [item.q, item.exp, ...(item.opts || [])].filter(Boolean).join(" ");
  }
  if (type === "match") {
    return [item.prompt, item.answer].filter(Boolean).join(" — ");
  }
  if (type === "cram") {
    return [item.term, item.def].filter(Boolean).join(" — ");
  }
  return "";
}

// ─── Concept-noun extraction ─────────────────────────────────────────
const STOPWORDS = new Set([
  "a","an","the","of","in","on","at","by","to","for","with","or","and",
  "is","are","be","been","being","that","this","which","when","where",
  "what","how","why","not","no","yes","do","does","did","done",
  "can","could","may","might","should","would","will","shall",
  "as","but","if","then","than","also","very","more","most","less","least",
  "from","into","onto","over","under","through","across","between","among",
  "it","its","they","their","them","we","our","us","you","your","he","she","his","her",
  "i","me","my","mine",
  "one","two","three","four","five","six","seven","eight","nine","ten",
  "use","uses","used","using",
  "via","per","etc",
  "type","types","kind","kinds","sort","sorts","form","forms",
  "first","second","third","next","previous","last",
  "all","any","some","each","every","both","none","other","another","same",
  "different","new","old","like","unlike",
]);

function extractConcepts(text) {
  if (!text) return new Set();
  const concepts = new Set();
  // Lowercase, split on non-alphanumeric (keep numbers)
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  // 2-3 word sliding windows of non-stopwords
  for (let i = 0; i < tokens.length; i++) {
    if (STOPWORDS.has(tokens[i]) || tokens[i].length < 3) continue;
    // 1-word concept (the token itself if it's distinctive enough)
    if (tokens[i].length >= 4) concepts.add(tokens[i]);
    // 2-word concept
    if (i + 1 < tokens.length && !STOPWORDS.has(tokens[i+1]) && tokens[i+1].length >= 3) {
      concepts.add(`${tokens[i]} ${tokens[i+1]}`);
    }
    // 3-word concept
    if (i + 2 < tokens.length && !STOPWORDS.has(tokens[i+1]) && !STOPWORDS.has(tokens[i+2]) && tokens[i+2].length >= 3) {
      concepts.add(`${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`);
    }
  }
  return concepts;
}

// ─── Load prior adjudications ────────────────────────────────────────
function loadPrior(packetJsonPath, decisionsJsonPath, label) {
  if (!existsSync(packetJsonPath) || !existsSync(decisionsJsonPath)) {
    return [];
  }
  const packet = JSON.parse(readFileSync(packetJsonPath, "utf8"));
  const decisionsBlob = JSON.parse(readFileSync(decisionsJsonPath, "utf8"));
  const decisions = decisionsBlob.decisions || [];
  const decisionMap = new Map(decisions.map(d => [d.packet_index, d]));
  return packet.items.map(it => {
    const dec = decisionMap.get(it.packet_index);
    const item = findItem(it.location.section, it.location.video, it.location.type, it.location.index);
    const text = searchableText(item, it.location.type);
    return {
      label,
      packet_index: it.packet_index,
      location: it.location,
      parent_video_title: it.parent_video_title,
      item, text,
      concepts: extractConcepts(text),
      parsed_destinations: it.parsed_destinations || [],
      decision: dec || null,
    };
  });
}

const priorEntries = [
  ...loadPrior(
    resolve(repo, ".audit-working/sb-fix-1a/packet-1.json"),
    resolve(repo, ".audit-working/sb-fix-1a/packet-1-decisions.json"),
    "SB-fix-1a #1",
  ),
  ...loadPrior(
    resolve(repo, ".audit-working/sb-fix-1a/packet-2.json"),
    resolve(repo, ".audit-working/sb-fix-1a/packet-2-decisions.json"),
    "SB-fix-1a #2",
  ),
  ...loadPrior(
    resolve(repo, ".audit-working/sb-fix-1a/packet-3.json"),
    resolve(repo, ".audit-working/sb-fix-1a/packet-3-decisions.json"),
    "SB-fix-1a #3",
  ),
  ...loadPrior(
    resolve(repo, ".audit-working/sb-fix-1b/packet-1.json"),
    resolve(repo, ".audit-working/sb-fix-1b/packet-1-decisions.json"),
    "SB-fix-1b packet 1",
  ),
  ...loadPrior(
    resolve(repo, ".audit-working/sb-fix-1b/packet-2.json"),
    resolve(repo, ".audit-working/sb-fix-1b/packet-2-decisions.json"),
    "SB-fix-1b packet 2",
  ),
  ...loadPrior(
    resolve(repo, ".audit-working/sb-fix-1b/packet-3.json"),
    resolve(repo, ".audit-working/sb-fix-1b/packet-3-decisions.json"),
    "SB-fix-1b packet 3",
  ),
];

console.log(`Loaded ${priorEntries.length} prior-adjudicated items across SB-fix-1a (3 packets) + SB-fix-1b packets 1-2.`);

// ─── Load target packet ──────────────────────────────────────────────
const PACKET_JSON = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}.json`);
const packetData = JSON.parse(readFileSync(PACKET_JSON, "utf8"));

const targetEntries = packetData.items.map(it => {
  const item = findItem(it.location.section, it.location.video, it.location.type, it.location.index);
  const text = searchableText(item, it.location.type);
  return {
    packet_index: it.packet_index,
    location: it.location,
    parent_video_title: it.parent_video_title,
    item, text,
    concepts: extractConcepts(text),
    parsed_destinations: it.parsed_destinations,
  };
});

// ─── Match each target item against priors ───────────────────────────
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return inter / union;
}

function decisionDestination(d, priorParsedDestinations = []) {
  if (!d) return null;
  if (d.decision_type === "accept-primary") {
    const primary = priorParsedDestinations[0];
    return primary ? `accept-primary → \`${primary}\`` : "accept-primary (destination unknown)";
  }
  if (d.decision_type === "accept-alternate") return `accept-alternate → \`${d.to_alternate || "(unspecified)"}\``;
  if (d.decision_type === "manual") return `manual → \`${d.to_messerVideo || ""}\` / \`${d.to_subObjective || ""}\``;
  if (d.decision_type === "reject") return "reject — kept as-is";
  if (d.decision_type === "sb16-candidate") return `sb16-candidate (subcategory: ${d.sb16_subcategory || "?"})`;
  if (d.decision_type === "defer") return "deferred";
  if (d.decision_type === "self-alternate") return `self-alternate → \`${d.to_messerVideo || ""}\``;
  return `(${d.decision_type || "unknown"})`;
}

function annotateOne(target) {
  // Score each prior against the target. Same-parent-video gets a
  // strong bonus. Top-3 above a Jaccard threshold are returned.
  const scored = priorEntries.map(prior => {
    const sameParent = prior.location.section === target.location.section &&
                       prior.location.video === target.location.video;
    const sameSection = prior.location.section === target.location.section;
    const j = jaccard(target.concepts, prior.concepts);
    let bonus = 0;
    if (sameParent) bonus = 0.15;
    else if (sameSection) bonus = 0.05;
    return { prior, jaccard: j, score: j + bonus, sameParent, sameSection };
  });
  // Filter and sort
  const candidates = scored
    .filter(s => s.score >= 0.20 || s.sameParent && s.jaccard >= 0.10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return candidates;
}

// ─── Render ──────────────────────────────────────────────────────────
const lines = [];
const hintsJson = [];

lines.push(`# SB-fix-1b packet ${args.packet} — CROSS-PACKET CONSISTENCY HINTS (cadence Rule 5)`);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Per cadence Rule 5 (cross-packet consistency pre-annotation): for each item, CC identifies prior-adjudicated items whose concept matches. Supervisor reviews **by exception** — only flagging items where the proposed consistency hint is wrong.");
lines.push("");
lines.push("Match heuristic: Jaccard similarity on extracted 1-3-token concept noun phrases (stopwords filtered). Same-parent-video items get a +0.15 score bonus; same-section gets +0.05. Top 3 candidates above a minimum threshold are surfaced.");
lines.push("");
lines.push(`Prior decisions corpus: ${priorEntries.length} items across SB-fix-1a (3 packets, mc + scen) + SB-fix-1b (packets 1-2, match + cram).`);
lines.push("");

let withHints = 0;
let highConfidence = 0;
for (const target of targetEntries) {
  const candidates = annotateOne(target);
  hintsJson.push({
    packet_index: target.packet_index,
    location: target.location,
    candidates: candidates.map(c => ({
      label: c.prior.label,
      packet_index: c.prior.packet_index,
      location: c.prior.location,
      jaccard: Number(c.jaccard.toFixed(3)),
      score: Number(c.score.toFixed(3)),
      sameParent: c.sameParent,
      sameSection: c.sameSection,
      decision_summary: decisionDestination(c.prior.decision, c.prior.parsed_destinations),
    })),
  });

  if (candidates.length === 0) continue;
  withHints++;
  if (candidates[0].score >= 0.40) highConfidence++;

  lines.push(`### Item #${target.packet_index} — §${target.location.section} ${target.location.video} ${target.location.type}[${target.location.index}]`);
  lines.push("");
  // Content snippet
  const itemSnippet = target.location.type === "match"
    ? `prompt: \`${target.item?.prompt}\`, answer: \`${target.item?.answer}\``
    : `term: \`${target.item?.term}\`, def: \`${(target.item?.def || "").slice(0, 80)}${target.item?.def?.length > 80 ? "…" : ""}\``;
  lines.push(`**Item:** ${itemSnippet}`);
  lines.push("");
  lines.push(`**Parser primary:** ${target.parsed_destinations[0] || "(none)"}`);
  lines.push("");
  lines.push("**Top consistency hints:**");
  lines.push("");
  for (const c of candidates) {
    const parentMatch = c.sameParent ? " — SAME PARENT VIDEO" : c.sameSection ? " — same section" : "";
    lines.push(`- **${c.prior.label} #${c.prior.packet_index}** (Jaccard ${c.jaccard.toFixed(2)}, score ${c.score.toFixed(2)}${parentMatch})`);
    lines.push(`  - prior: §${c.prior.location.section} ${c.prior.location.video} ${c.prior.location.type}[${c.prior.location.index}]`);
    const priorSnippet = c.prior.location.type === "match"
      ? `prompt: "${c.prior.item?.prompt}" → answer: "${c.prior.item?.answer}"`
      : c.prior.location.type === "cram"
      ? `term: "${c.prior.item?.term}"`
      : `q: "${(c.prior.item?.q || "").slice(0, 80)}${c.prior.item?.q?.length > 80 ? "…" : ""}"`;
    lines.push(`  - prior item: ${priorSnippet}`);
    lines.push(`  - prior decision: ${decisionDestination(c.prior.decision, c.prior.parsed_destinations)}`);
  }
  lines.push("");
  // Synthesise a recommendation if the top candidate is reasonable
  // (score ≥ 0.30, includes precedent decision data).
  if (candidates[0].score >= 0.30 && candidates[0].prior.decision) {
    const top = candidates[0];
    const sameParent = top.sameParent ? " (same parent video)" : "";
    let suggested = "";
    if (top.prior.decision.decision_type === "manual" && top.prior.decision.to_messerVideo) {
      suggested = `manual → \`${top.prior.decision.to_messerVideo}\` / \`${top.prior.decision.to_subObjective}\`${sameParent}`;
    } else if (top.prior.decision.decision_type === "accept-primary") {
      const dest = top.prior.parsed_destinations[0];
      suggested = dest
        ? `accept-primary → \`${dest}\`${sameParent}`
        : `accept-primary${sameParent}`;
    } else if (top.prior.decision.decision_type === "sb16-candidate") {
      suggested = `sb16-candidate (subcategory: ${top.prior.decision.sb16_subcategory || "?"})${sameParent}`;
    } else {
      suggested = `(see ${top.prior.label} #${top.prior.packet_index})${sameParent}`;
    }
    lines.push(`**Suggested by-precedent decision:** ${suggested}`);
    lines.push("");
  }
  lines.push("---");
  lines.push("");
}

lines.push("## Summary");
lines.push("");
lines.push(`- Target packet items: ${targetEntries.length}`);
lines.push(`- Items with at least one consistency hint: ${withHints}`);
lines.push(`- Items with a high-confidence top hint (score ≥ 0.40): ${highConfidence}`);
lines.push("");

const OUT_MD = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}-cross-packet-hints.md`);
const OUT_JSON = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}-cross-packet-hints.json`);
writeFileSync(OUT_MD, lines.join("\n"));
writeFileSync(OUT_JSON, JSON.stringify({ packet: args.packet, generated_at: new Date().toISOString(), hints: hintsJson }, null, 2));
console.log(`Wrote ${OUT_MD}`);
console.log(`Wrote ${OUT_JSON}`);
console.log(`Items with hints: ${withHints}/${targetEntries.length}`);
console.log(`High-confidence: ${highConfidence}/${targetEntries.length}`);
