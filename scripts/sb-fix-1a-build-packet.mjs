// Build an SB-fix-1a review packet from SB1.6 verdicts.
//
// Filters D2 partial-adjacent items in mc + scen types only (per supervisor
// TASK 3 sign-off — match + cram deferred to SB-fix-1b). Sorts deterministically
// by (section, video, type, index) so packets are stable across re-runs.
//
// For each item produces a markdown review row with: location header, parent
// video info, current citation, item content (q/opts/key/exp), LLM verdict,
// full justification, parser-suggested destinations, and Aiden-facing decision
// checkboxes.
//
// Usage:
//   node scripts/sb-fix-1a-build-packet.mjs --packet 1 --start 0 --size 25
//   node scripts/sb-fix-1a-build-packet.mjs --packet 2 --start 25 --size 25
//   node scripts/sb-fix-1a-build-packet.mjs --packet 3 --start 50 --size 13
//
// Output paths:
//   .audit-working/sb-fix-1a/packet-N.md  (Aiden review, clipboard-relay format)
//   .audit-working/sb-fix-1a/packet-N.json (structured shadow for the apply script)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const SB16_VERDICTS = resolve(repo, ".audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json");
const QUESTIONS = resolve(repo, "questions.json");
const OUT_DIR = resolve(repo, ".audit-working/sb-fix-1a");

// ─── CLI ───────────────────────────────────────────────────────────────
function parseArgs() {
  const out = { packet: null, start: null, size: null };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--packet" && i + 1 < process.argv.length) out.packet = Number(process.argv[++i]);
    else if (a === "--start" && i + 1 < process.argv.length) out.start = Number(process.argv[++i]);
    else if (a === "--size"  && i + 1 < process.argv.length) out.size  = Number(process.argv[++i]);
  }
  if (out.packet == null || out.start == null || out.size == null) {
    console.error("usage: --packet <N> --start <K> --size <M>");
    process.exit(2);
  }
  return out;
}
const args = parseArgs();

// ─── Load + filter ─────────────────────────────────────────────────────
const verdicts = JSON.parse(readFileSync(SB16_VERDICTS, "utf8")).verdicts;
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));

// Index questions for item lookup
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
  return { item: arr[index], parentVideoTitle: vid.title };
}

// Filter: D2 partial-adjacent, mc + scen only, sorted deterministically
const scope = verdicts
  .filter(r =>
    r.verdict?.category === "partial-adjacent" &&
    r.location?.section?.startsWith("2.") &&
    (r.location.type === "mc" || r.location.type === "scen")
  )
  .sort((a, b) => {
    const la = a.location, lb = b.location;
    if (la.section !== lb.section) return la.section.localeCompare(lb.section, "en", { numeric: true });
    if (la.video   !== lb.video)   return la.video.localeCompare(lb.video, "en", { numeric: true });
    if (la.type    !== lb.type)    return la.type.localeCompare(lb.type);
    return la.index - lb.index;
  });

const slice = scope.slice(args.start, args.start + args.size);
console.log(`Scope total: ${scope.length}. Slicing [${args.start}, ${args.start + args.size}) = ${slice.length} items.`);

// ─── Destination parser (allowlist-based) ──────────────────────────────
//
// v2 design (2026-05-20, after packet-1 supervisor review surfaced 4 parser
// bugs in regex-only v1): match prose against the known set of 120 Messer
// video titles. This eliminates by construction:
//   - "X or Y" truncation (each title matches independently, no greedy join)
//   - Inverted-primary on items where the LLM names the current citation as
//     a reference (caller filters those after candidates are collected)
//   - Prose-suffix capture ("per the inventory" etc — title regex is bounded
//     to the known string)
// Plus naturally filters out hallucinated/fabricated video references.

// Build allowlist once at module load.
const ALL_TITLES = [];
for (const sec of questions) {
  for (const vid of sec.videos) {
    ALL_TITLES.push({
      section: sec.id,
      title: vid.title,
      full: `${sec.id} - ${vid.title}`,
    });
  }
}
// Sort longest-title-first so the regex builder for "Email Security" doesn't
// pre-match before "Email Security Configuration" (defensive against future
// title additions; not strictly needed for current 120-title set).
ALL_TITLES.sort((a, b) => b.title.length - a.title.length);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// For each known title, build a regex that matches X.Y followed by -/–/—
// followed by the exact title, bounded by word boundaries. Case-insensitive.
const TITLE_PATTERNS = ALL_TITLES.map(t => ({
  full: t.full,
  pattern: new RegExp(
    `\\b${escapeRegex(t.section)}\\s*[-–—]\\s*${escapeRegex(t.title)}\\b`,
    "i",
  ),
}));

function parseDestinations(exp, currentCitation = null) {
  const dests = [];
  const seen = new Set();
  for (const { full, pattern } of TITLE_PATTERNS) {
    if (pattern.test(exp) && !seen.has(full)) {
      // Filter out the current citation — the LLM frequently names it as the
      // "transcript that does not cover X" reference; that's not a destination.
      if (currentCitation && full === currentCitation) continue;
      dests.push(full);
      seen.add(full);
    }
  }
  // Stable order: preserve order of FIRST occurrence in prose (not allowlist
  // order). Re-sort dests by their position in the input.
  dests.sort((a, b) => exp.indexOf(a.split(" - ")[1]) - exp.indexOf(b.split(" - ")[1]));
  return dests;
}

// ─── Render markdown ───────────────────────────────────────────────────
function renderRow(row, n) {
  const l = row.location;
  const v = row.verdict;
  const located = findItem(l.section, l.video, l.type, l.index);
  if (!located || !located.item) {
    return `### Item ${n}. §${l.section} ${l.video} ${l.type}[${l.index}]\n\n**ERROR: item not found in questions.json**\n\n---\n\n`;
  }
  const item = located.item;
  const parentTitle = located.parentVideoTitle;
  const currentMesser = item.messerVideo || "(inherits parent)";
  const currentSubObj = item.subObjective || "(inherits parent)";
  const dests = parseDestinations(v.justification_explanation || "", item.messerVideo);
  const primary = dests[0] || null;
  const alternates = dests.slice(1);

  const out = [];
  out.push(`### Item ${n}. §${l.section} ${l.video} ${l.type}[${l.index}]`);
  out.push("");
  out.push(`**Parent video:** ${parentTitle}`);
  out.push(`**Currently cited as:** \`${currentMesser}\` → \`${currentSubObj}\``);
  out.push("");
  out.push("**Item content:**");
  out.push("");
  out.push("```");
  out.push(`Q: ${item.q}`);
  for (let i = 0; i < (item.opts || []).length; i++) {
    const mark = i === item.a ? " ← KEY" : "";
    out.push(`  ${"abcd"[i]}) ${item.opts[i]}${mark}`);
  }
  out.push(`Explanation: ${item.exp}`);
  out.push("```");
  out.push("");
  out.push(`**LLM verdict:** \`${v.category}\` (confidence: ${v.confidence}) — fix_direction: \`${v.fix_direction}\``);
  out.push("");
  out.push("**LLM justification (full):**");
  out.push("");
  out.push(`> ${(v.justification_explanation || "(none)").replace(/\n/g, "\n> ")}`);
  out.push("");
  out.push("**Parser-suggested destinations:**");
  if (primary) {
    out.push(`- (primary) \`${primary}\``);
    for (const a of alternates) out.push(`- (alternate) \`${a}\``);
  } else {
    out.push(`- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)`);
  }
  out.push("");
  out.push("**Aiden decision** (mark one):");
  out.push("- [ ] accept primary destination");
  out.push("- [ ] accept alternate (specify): ____");
  out.push("- [ ] manual (specify messerVideo + subObjective): ____");
  out.push("- [ ] reject — keep current citation, mark as confirmed correct");
  out.push("- [ ] defer to next packet");
  out.push("");
  out.push("---");
  out.push("");
  return out.join("\n");
}

const lines = [];
lines.push(`# SB-fix-1a packet ${args.packet} — Domain 2 partial-adjacent re-citation review`);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Source: \`.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json\``);
lines.push(`Filter: \`category=partial-adjacent\` AND \`location.section startsWith "2."\` AND \`type in {mc, scen}\``);
lines.push(`Scope total (across all packets): ${scope.length} items`);
lines.push(`This packet: items ${args.start + 1}–${args.start + slice.length} of ${scope.length} (size ${slice.length})`);
lines.push("");
lines.push("## How to review");
lines.push("");
lines.push("For each item below: read the **Item content**, then the **LLM justification**, then choose ONE decision option.");
lines.push("");
lines.push("Decision options:");
lines.push("- **accept primary** — parser's first suggestion is the right destination. Apply script will set `item.messerVideo` to that string and `item.subObjective` to the matching numeric (CC will derive from the video-title prefix).");
lines.push("- **accept alternate** — parser found multiple candidates; you pick which.");
lines.push("- **manual** — parser suggestion is wrong; provide the correct messerVideo title AND sub-objective number. Format: `\"X.Y - Title\" / X.Y.Z`.");
lines.push("- **reject** — LLM was wrong; item really does belong where currently cited. Apply script will write `audit_d_review.kept_as_is = true` so the item won't be re-flagged in future audit passes.");
lines.push("- **defer** — edge case; pull this item into a later packet for re-discussion. No edit applied.");
lines.push("");
lines.push("Once decisions are recorded, return the marked-up packet to CC.");
lines.push("");
lines.push("---");
lines.push("");

slice.forEach((row, i) => lines.push(renderRow(row, args.start + i + 1)));

lines.push("");
lines.push("## Packet summary");
lines.push("");
lines.push(`- Items in this packet: ${slice.length}`);
lines.push(`- Parser-yielded primary destination available on: ${slice.filter(r => {
  const located = findItem(r.location.section, r.location.video, r.location.type, r.location.index);
  return parseDestinations(r.verdict.justification_explanation || "", located?.item?.messerVideo).length > 0;
}).length} / ${slice.length}`);
lines.push(`- mc items: ${slice.filter(r => r.location.type === "mc").length}`);
lines.push(`- scen items: ${slice.filter(r => r.location.type === "scen").length}`);
const sectionCounts = {};
for (const r of slice) sectionCounts[r.location.section] = (sectionCounts[r.location.section] || 0) + 1;
const secKeys = Object.keys(sectionCounts).sort();
lines.push(`- By section: ${secKeys.map(k => `§${k}=${sectionCounts[k]}`).join(", ")}`);
lines.push(`- Remaining after this packet: ${scope.length - args.start - slice.length} items (next packet start = ${args.start + slice.length})`);

// ─── Structured shadow JSON for apply-script consumption ───────────────
const shadow = {
  packet: args.packet,
  start: args.start,
  size: slice.length,
  scope_total: scope.length,
  generated_at: new Date().toISOString(),
  items: slice.map((row, i) => {
    const located = findItem(row.location.section, row.location.video, row.location.type, row.location.index);
    const dests = parseDestinations(row.verdict.justification_explanation || "", located?.item?.messerVideo);
    return {
      packet_index: args.start + i + 1,
      location: row.location,
      parent_video_title: located?.parentVideoTitle || null,
      current_messerVideo: located?.item?.messerVideo || null,
      current_subObjective: located?.item?.subObjective || null,
      llm_verdict: {
        category: row.verdict.category,
        confidence: row.verdict.confidence,
        fix_direction: row.verdict.fix_direction,
        justification_explanation: row.verdict.justification_explanation,
      },
      parsed_destinations: dests,
      decision: null, // to be filled in by Aiden + transcribed by CC
    };
  }),
};

mkdirSync(OUT_DIR, { recursive: true });
const mdPath = resolve(OUT_DIR, `packet-${args.packet}.md`);
const jsonPath = resolve(OUT_DIR, `packet-${args.packet}.json`);
writeFileSync(mdPath, lines.join("\n"));
writeFileSync(jsonPath, JSON.stringify(shadow, null, 2));

console.log(`Wrote ${mdPath} (${lines.join("\n").length} chars)`);
console.log(`Wrote ${jsonPath} (${slice.length} structured items)`);
console.log("");
console.log(`mc items: ${slice.filter(r => r.location.type === "mc").length}, scen items: ${slice.filter(r => r.location.type === "scen").length}`);
console.log(`By section: ${secKeys.map(k => `§${k}=${sectionCounts[k]}`).join(", ")}`);
console.log(`Parser primary-destination yield: ${slice.filter(r => {
  const located = findItem(r.location.section, r.location.video, r.location.type, r.location.index);
  return parseDestinations(r.verdict.justification_explanation || "", located?.item?.messerVideo).length > 0;
}).length} / ${slice.length}`);
