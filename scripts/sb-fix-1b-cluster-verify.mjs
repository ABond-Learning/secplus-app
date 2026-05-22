// Inline cluster-verification for SB-fix-1b packets (cadence Rule 2).
//
// For each item in a packet where the parser proposed a re-citation
// destination, grep the item's specific term/answer against:
//   (a) the CITED transcript (parent video) — confirms LLM's absence claim
//   (b) the parser's PRIMARY destination transcript — validates target
//   (c) corpus-wide — distinguishes partial-depth from messer-curriculum-gap
//
// Output is a markdown report intended to be inlined into packet-N.md
// alongside the relevant items, per cadence rule 2 (inline cluster
// verification at build time, not as a separate gate).
//
// Usage:
//   node scripts/sb-fix-1b-cluster-verify.mjs --packet 3
//
// Output:
//   .audit-working/sb-fix-1b/packet-N-cluster-verification.md
//
// Cluster definition: items grouped by (section, video) with count ≥ 3.
// Single-item parent videos are not clustered (no compounding context).

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

// ─── CLI ─────────────────────────────────────────────────────────────
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

// ─── Inputs ──────────────────────────────────────────────────────────
const PACKET_JSON = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}.json`);
const QUESTIONS = resolve(repo, "questions.json");
const TRANSCRIPTS_DIR = resolve(repo, ".messer-transcripts");
const MESSER_MD = resolve(repo, "MESSER_VIDEOS.md");
const OUT = resolve(repo, `.audit-working/sb-fix-1b/packet-${args.packet}-cluster-verification.md`);

const packetData = JSON.parse(readFileSync(PACKET_JSON, "utf8"));
const questions = JSON.parse(readFileSync(QUESTIONS, "utf8"));

// ─── Citation → slug map (per audit-video-grounding.mjs precedent) ───
const citationToSlug = new Map();
{
  const md = readFileSync(MESSER_MD, "utf8");
  let curSec = null;
  for (const line of md.split("\n")) {
    const sec = line.match(/^### (\d+\.\d+)\s+[–-]\s+(.+)$/);
    if (sec) { curSec = sec[1]; continue; }
    const vid = line.match(/^-\s+(.+)$/);
    if (vid && curSec) {
      const title = vid[1].trim();
      const cite = `${curSec} - ${title}`;
      const slug = title.toLowerCase()
        .replace(/[,'']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + "-sy0-701";
      citationToSlug.set(cite, slug);
    }
  }
}

function transcriptPathFor(citation) {
  const slug = citationToSlug.get(citation);
  if (!slug) return null;
  const path = resolve(TRANSCRIPTS_DIR, `${slug}.txt`);
  return existsSync(path) ? path : null;
}

function loadTranscript(path) {
  if (!path) return null;
  try { return readFileSync(path, "utf8"); }
  catch { return null; }
}

// ─── Item resolution ─────────────────────────────────────────────────
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

// ─── Search-needle extraction ────────────────────────────────────────
// For matching items, the answer is the specific term being tested.
// For cram items, the term is the specific term.
//
// We use both the answer/term verbatim AND a "core noun" extracted by
// taking the longest meaningful phrase (≥2 words, sans stopwords). The
// caller greps both: if either hits, we say term-present.
const STOPWORDS = new Set([
  "a","an","the","of","in","on","at","by","to","for","with","or","and",
  "is","are","be","that","this","which","when","where","what","how",
]);

function needlesFor(item, type) {
  const needles = [];
  let primary = type === "match" ? (item.answer || "") : (item.term || "");
  primary = primary.trim();
  if (primary) needles.push(primary);
  // Add a "core phrase" — strip parenthesised clarifications, take the
  // first chunk before " — " or " - " if present.
  const stripped = primary
    .replace(/\([^)]*\)/g, "")
    .split(/\s+[-—–]\s+/)[0]
    .trim();
  if (stripped && stripped.toLowerCase() !== primary.toLowerCase()) needles.push(stripped);
  // Also add a "longest non-stopword run" for fuzzy matching in the
  // transcript (e.g. "shared responsibility model" appearing in the
  // transcript as "shared responsibility" without "model").
  const tokens = primary.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const runs = [];
  let cur = [];
  for (const t of tokens) {
    if (STOPWORDS.has(t)) { if (cur.length >= 2) runs.push(cur.join(" ")); cur = []; }
    else cur.push(t);
  }
  if (cur.length >= 2) runs.push(cur.join(" "));
  runs.sort((a, b) => b.length - a.length);
  if (runs[0]) needles.push(runs[0]);
  // Dedupe (case-insensitive)
  const seen = new Set();
  return needles.filter(n => {
    const k = n.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── Grep ────────────────────────────────────────────────────────────
function countMatches(text, needle) {
  if (!text || !needle) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (text.match(re) || []).length;
}

function corpusGrep(needle) {
  const hits = [];
  const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith(".txt"));
  for (const f of files) {
    const txt = readFileSync(resolve(TRANSCRIPTS_DIR, f), "utf8");
    const n = countMatches(txt, needle);
    if (n > 0) hits.push({ file: f, n });
  }
  return hits;
}

// ─── Cluster identification ──────────────────────────────────────────
const clusters = new Map(); // key = `${section}|${video}` → [items]
for (const it of packetData.items) {
  const key = `${it.location.section}|${it.location.video}`;
  if (!clusters.has(key)) clusters.set(key, []);
  clusters.get(key).push(it);
}
const clusterKeys = [...clusters.keys()].filter(k => clusters.get(k).length >= 3);
clusterKeys.sort();

// ─── Verify each cluster item ────────────────────────────────────────
function classifyItem(it) {
  const item = findItem(it.location.section, it.location.video, it.location.type, it.location.index);
  if (!item) return { error: "item-not-found" };

  const citedTranscript = loadTranscript(transcriptPathFor(it.parent_citation));
  const primaryDest = it.parsed_destinations[0] || null;
  const primaryTranscript = primaryDest ? loadTranscript(transcriptPathFor(primaryDest)) : null;
  const altDests = it.parsed_destinations.slice(1);
  const altTranscripts = altDests.map(d => ({ dest: d, txt: loadTranscript(transcriptPathFor(d)) }));

  const needles = needlesFor(item, it.location.type);

  // Per-needle counts in cited + primary + alternates
  const perNeedle = needles.map(n => ({
    needle: n,
    cited: citedTranscript ? countMatches(citedTranscript, n) : null,
    primary: primaryTranscript ? countMatches(primaryTranscript, n) : null,
    alts: altTranscripts.map(a => ({ dest: a.dest, n: a.txt ? countMatches(a.txt, n) : null })),
  }));

  // Aggregate: any needle present in cited? primary? alt? corpus?
  const anyCitedHit = perNeedle.some(p => p.cited > 0);
  const anyPrimaryHit = perNeedle.some(p => p.primary != null && p.primary > 0);
  const anyAltHit = perNeedle.some(p => p.alts.some(a => a.n != null && a.n > 0));

  // Corpus-wide grep only if cited + all parsed destinations missed (cheap to skip)
  let corpus = null;
  if (!anyCitedHit && !anyPrimaryHit && !anyAltHit) {
    const corpusByNeedle = needles.map(n => ({ needle: n, hits: corpusGrep(n) }));
    corpus = corpusByNeedle;
  }

  // Recommended sb16_subcategory classification
  let recommendation;
  if (anyCitedHit) {
    recommendation = "cited-hit — LLM may be wrong; needle does appear in cited transcript. Consider reject (kept_as_is=true).";
  } else if (anyPrimaryHit) {
    recommendation = "destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.";
  } else if (anyAltHit) {
    recommendation = "alternate-hit — primary missed but an alternate destination has the term. Consider accept-alternate.";
  } else if (corpus && corpus.some(c => c.hits.length > 0)) {
    const allHits = corpus.flatMap(c => c.hits);
    recommendation = `partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: ${[...new Set(allHits.map(h => h.file))].slice(0, 3).join(", ")}${allHits.length > 3 ? ", …" : ""}. Likely sb16_subcategory=partial-depth.`;
  } else {
    recommendation = "messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.";
  }

  return {
    packet_index: it.packet_index,
    location: it.location,
    needles,
    perNeedle,
    primary_destination: primaryDest,
    alt_destinations: altDests,
    corpus_summary: corpus
      ? corpus.map(c => ({ needle: c.needle, hit_files: c.hits.map(h => `${h.file} (×${h.n})`) }))
      : null,
    recommendation,
  };
}

// ─── Render markdown ─────────────────────────────────────────────────
const lines = [];
lines.push(`# SB-fix-1b packet ${args.packet} — INLINE CLUSTER VERIFICATION (cadence Rule 2)`);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Per cadence Rule 2 (inline cluster verification at build time): for each cluster of ≥3 items in the same parent video, CC pre-greps the item's specific term/answer against the cited transcript + parser primary destination + corpus-wide if both miss. Outcome is a recommended `sb16_subcategory` classification (partial-depth vs messer-curriculum-gap) presented alongside the item in this report. Supervisor reviews verdicts as part of normal item-by-item pass (NOT as a separate gate).");
lines.push("");
lines.push("**Reading guide:**");
lines.push("");
lines.push("- `cited-hit` — LLM may have been wrong; consider `reject` decision in the packet.");
lines.push("- `destination-hit` — accept-primary is well-supported; the proposed Messer video transcript covers the specific term.");
lines.push("- `alternate-hit` — primary missed but an alternate parsed destination has the term.");
lines.push("- `partial-depth` — concept absent from cited + parsed destinations but present elsewhere in the Messer corpus; route to SB-fix-2 with `sb16_subcategory=partial-depth`.");
lines.push("- `messer-curriculum-gap` — term absent corpus-wide; route to SB-fix-2 with `sb16_subcategory=messer-curriculum-gap` (Sybex arbitration path).");
lines.push("");
lines.push(`Clusters in this packet (≥3 items per parent video): ${clusterKeys.length}`);
lines.push("");

const clusterSummary = [];

for (const key of clusterKeys) {
  const [section, video] = key.split("|");
  const items = clusters.get(key);
  const parentTitle = items[0].parent_video_title;
  lines.push("---");
  lines.push("");
  lines.push(`## Cluster §${section} ${video} — "${parentTitle}" (${items.length} items)`);
  lines.push("");
  lines.push(`Items #${items[0].packet_index}–#${items[items.length-1].packet_index}.`);
  lines.push("");

  const itemReports = [];
  for (const it of items) {
    const report = classifyItem(it);
    itemReports.push(report);

    lines.push(`### Item #${it.packet_index} — §${it.location.section} ${it.location.video} ${it.location.type}[${it.location.index}]`);
    lines.push("");
    if (report.error) {
      lines.push(`**ERROR:** ${report.error}`);
      lines.push("");
      continue;
    }

    lines.push(`**Search needles:** ${report.needles.map(n => `\`${n}\``).join(", ")}`);
    lines.push("");

    lines.push("**Grep results:**");
    lines.push("");
    lines.push("| Needle | Cited transcript | Primary destination | Alternates |");
    lines.push("|---|---|---|---|");
    for (const pn of report.perNeedle) {
      const citedStr = pn.cited == null ? "(no transcript)" : pn.cited > 0 ? `${pn.cited} hit(s)` : "0";
      const primStr = pn.primary == null ? "(no destination)" : pn.primary > 0 ? `${pn.primary} hit(s)` : "0";
      const altStr = pn.alts.length === 0 ? "—" : pn.alts.map(a => {
        const n = a.n == null ? "?" : a.n;
        return `${a.dest}: ${n}`;
      }).join("; ");
      lines.push(`| \`${pn.needle}\` | ${citedStr} | ${primStr} | ${altStr} |`);
    }
    lines.push("");

    if (report.corpus_summary) {
      const anyCorpusHits = report.corpus_summary.some(c => c.hit_files.length > 0);
      lines.push("**Corpus-wide grep** (cited + parsed destinations all missed):");
      lines.push("");
      if (anyCorpusHits) {
        for (const c of report.corpus_summary) {
          if (c.hit_files.length === 0) continue;
          lines.push(`- \`${c.needle}\`: ${c.hit_files.slice(0, 5).join(", ")}${c.hit_files.length > 5 ? `, … (+${c.hit_files.length - 5} more)` : ""}`);
        }
      } else {
        lines.push("- No hits across any of the 122+ transcripts.");
      }
      lines.push("");
    }

    lines.push(`**Cluster verdict / recommendation:** ${report.recommendation}`);
    lines.push("");
  }

  // Cluster-level pattern summary
  const recs = itemReports.map(r => (r.recommendation || "").split(" — ")[0]);
  const distinct = [...new Set(recs)];
  lines.push("**Cluster pattern summary:**");
  lines.push("");
  for (const d of distinct) {
    const ct = recs.filter(r => r === d).length;
    lines.push(`- \`${d}\`: ${ct} item(s)`);
  }
  lines.push("");

  clusterSummary.push({
    section, video, parentTitle, count: items.length,
    patterns: distinct.map(d => ({ kind: d, count: recs.filter(r => r === d).length })),
  });
}

lines.push("---");
lines.push("");
lines.push("## Cluster-set summary");
lines.push("");
lines.push("| Cluster | Items | Patterns |");
lines.push("|---|---|---|");
for (const c of clusterSummary) {
  const patternsStr = c.patterns.map(p => `\`${p.kind}\`=${p.count}`).join(", ");
  lines.push(`| §${c.section} ${c.video} "${c.parentTitle}" | ${c.count} | ${patternsStr} |`);
}
lines.push("");

writeFileSync(OUT, lines.join("\n"));
console.log(`Wrote ${OUT}`);
console.log(`Clusters analysed: ${clusterKeys.length}`);
for (const c of clusterSummary) {
  console.log(`  §${c.section} ${c.video}: ${c.count} items — ${c.patterns.map(p => `${p.kind}=${p.count}`).join(", ")}`);
}
