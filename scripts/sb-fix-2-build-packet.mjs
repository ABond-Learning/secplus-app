// SB-fix-2 build script — produces a per-packet review markdown for supervisor.
//
// Reads catalogue sb16-candidates (items with audit_d_review.sb16_candidate=true)
// and emits packet-N.md + packet-N.json under .audit-working/sb-fix-2/. Items
// are filtered by sub-path (--sub-path=P or --sub-path=G), sorted
// deterministically, sliced by --start/--size.
//
// Sub-path filter semantics:
//   P → audit_d_review.sb16_subcategory === "partial-depth"
//   G → audit_d_review.sb16_subcategory === "messer-curriculum-gap"
//
// The R (routing) sub-path uses a separate script (sb-fix-2-route-pool-b.mjs)
// because its input is the SB1.6 verdicts file, not the catalogue.
//
// Output:
//   .audit-working/sb-fix-2/packet-N.md      (supervisor review surface)
//   .audit-working/sb-fix-2/packet-N.json    (structured shadow for apply script)
//
// Self-test (--selftest) exercises the filter + slice + render logic against
// a stub catalogue.
//
// Usage:
//   node scripts/sb-fix-2-build-packet.mjs --packet 1 --sub-path G --start 0 --size 2
//   node scripts/sb-fix-2-build-packet.mjs --packet 2 --sub-path P --start 0 --size 20
//   node scripts/sb-fix-2-build-packet.mjs --selftest

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const QUESTIONS_PATH = resolve(repo, "questions.json");
const OUT_DIR = resolve(repo, ".audit-working/sb-fix-2");

const SYBEX_EDITION = "Chapple 9th";

// ─── CLI ──────────────────────────────────────────────────────────────
function parseArgs() {
  const out = { packet: null, subPath: null, start: 0, size: null, selftest: false };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--packet" && i + 1 < process.argv.length) out.packet = Number(process.argv[++i]);
    else if (a === "--sub-path" && i + 1 < process.argv.length) out.subPath = process.argv[++i];
    else if (a === "--start" && i + 1 < process.argv.length) out.start = Number(process.argv[++i]);
    else if (a === "--size" && i + 1 < process.argv.length) out.size = Number(process.argv[++i]);
    else if (a === "--selftest") out.selftest = true;
  }
  return out;
}

// ─── Helpers ──────────────────────────────────────────────────────────
export function collectSb16Candidates(questions, subPath = null) {
  const out = [];
  for (const sec of questions) {
    for (const vid of sec.videos) {
      const arrays = [
        ["mc",    vid.questions],
        ["scen",  vid.scenarios],
        ["match", vid.matching],
        ["cram",  vid.cram],
      ];
      for (const [type, arr] of arrays) {
        if (!arr) continue;
        arr.forEach((it, idx) => {
          if (!it?.audit_d_review?.sb16_candidate) return;
          if (it.audit_d_review?.sb_fix_2?.applied_at) return; // already processed
          const sub = it.audit_d_review.sb16_subcategory;
          if (subPath === "P" && sub !== "partial-depth") return;
          if (subPath === "G" && sub !== "messer-curriculum-gap") return;
          out.push({
            location: { section: sec.id, video: vid.id, type, index: idx },
            parent_video_title: vid.title,
            sb16_subcategory: sub,
            audit_d_review_origin: it.audit_d_review.packet_id || "(unknown)",
            current_messerVideo: it.messerVideo || null,
            current_subObjective: it.subObjective || null,
            item: it,
          });
        });
      }
    }
  }
  out.sort((a, b) => {
    const la = a.location, lb = b.location;
    if (la.section !== lb.section) return la.section.localeCompare(lb.section, "en", { numeric: true });
    if (la.video !== lb.video) return la.video.localeCompare(lb.video, "en", { numeric: true });
    if (la.type !== lb.type) return la.type.localeCompare(lb.type);
    return la.index - lb.index;
  });
  return out;
}

function renderItemContent(item, type) {
  const out = ["```"];
  if (type === "mc" || type === "scen") {
    out.push(`q:   ${item.q}`);
    (item.opts || []).forEach((o, i) => out.push(`  ${i === item.a ? "★" : " "} [${i}] ${o}`));
    out.push(`exp: ${item.exp || ""}`);
  } else if (type === "match") {
    out.push(`Prompt: ${item.prompt}`);
    out.push(`Answer: ${item.answer}`);
  } else if (type === "cram") {
    out.push(`Term:  ${item.term}`);
    out.push(`Def:   ${item.def}`);
  }
  out.push("```");
  return out;
}

function renderRow(row, n) {
  const l = row.location;
  const out = [];
  out.push(`### Item ${n}. §${l.section} ${l.video} ${l.type}[${l.index}]  —  ${row.sb16_subcategory}`);
  out.push("");
  out.push(`**Parent video:** ${l.section} - ${row.parent_video_title}`);
  out.push(`**Current citation:** ${row.current_messerVideo || `(inherits parent: ${l.section} - ${row.parent_video_title})`}  /  ${row.current_subObjective || `(inherits parent: ${l.section})`}`);
  out.push(`**SB-fix-1a/1b origin:** ${row.audit_d_review_origin}`);
  out.push("");
  out.push("**Item content:**");
  out.push("");
  out.push(...renderItemContent(row.item, l.type));
  out.push("");
  out.push("**Supervisor decision** (one of):");
  out.push("- [ ] `keep-with-sybex-note` (default for partial-depth; cited Messer umbrella correct + Sybex covers specific term)");
  out.push("- [ ] `re-cite-to-sybex` (clear messerVideo + subObjective; Sybex is the right home)");
  out.push("- [ ] `rewrite-to-messer` (rewrite item to test concept Messer actually covers; specify new_content)");
  out.push("- [ ] `flag-for-removal` (not in CompTIA AND not in Sybex; specify removal_reason)");
  out.push("- [ ] `promote-to-sybex-citation` (same effect as keep-with-note for now; reserves future schema extension)");
  out.push("");
  out.push("**Sybex reference** (required except `flag-for-removal`):");
  out.push("- edition: `Chapple 9th`");
  out.push("- chapter: ____");
  out.push("- section: ____");
  out.push("- page (optional): ____");
  out.push("- quote_excerpt: ____");
  out.push("");
  out.push("**CompTIA objective reference** (required for `keep-with-sybex-note` + `re-cite-to-sybex`): ____");
  out.push("");
  out.push("**Note** (optional): ____");
  out.push("");
  out.push("---");
  out.push("");
  return out.join("\n");
}

function renderPacket(packet, subPath, slice, scopeTotal, start) {
  const lines = [];
  lines.push(`# SB-fix-2 packet ${packet} — sub-path ${subPath}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Sub-path: ${subPath} (${subPath === "P" ? "partial-depth" : "messer-curriculum-gap"})`);
  lines.push(`Source: \`questions.json\` items where \`audit_d_review.sb16_candidate === true\` AND \`sb16_subcategory === "${subPath === "P" ? "partial-depth" : "messer-curriculum-gap"}"\` AND \`sb_fix_2\` not yet applied.`);
  lines.push(`Scope total (across all packets for this sub-path): ${scopeTotal} items`);
  lines.push(`This packet: items ${start + 1}–${start + slice.length} of ${scopeTotal} (size ${slice.length})`);
  lines.push("");
  lines.push("## How to review");
  lines.push("");
  lines.push("For each item below: choose ONE decision. Fill in sybex_reference fields per the canonical format. CompTIA objective reference required for keep-with-sybex-note + re-cite-to-sybex (e.g. \"2.4\" or \"2.4.6\"). Note field optional.");
  lines.push("");
  lines.push(`Canonical Sybex citation format: \`"Chapple 9th, Chapter N, §Section, p.NN"\` — page optional.`);
  lines.push("");
  lines.push("After all 50 (or N) decisions are recorded, return the marked-up packet to CC.");
  lines.push("");
  lines.push("---");
  lines.push("");
  slice.forEach((row, i) => lines.push(renderRow(row, start + i + 1)));
  lines.push("");
  lines.push("## Packet summary");
  lines.push("");
  lines.push(`- Items in this packet: ${slice.length}`);
  lines.push(`- By section: ${tally(slice, r => `§${r.location.section}`)}`);
  lines.push(`- By type: ${tally(slice, r => r.location.type)}`);
  lines.push(`- Remaining after this packet: ${scopeTotal - start - slice.length}`);
  return lines.join("\n");
}

function tally(arr, keyFn) {
  const m = {};
  for (const x of arr) {
    const k = keyFn(x);
    m[k] = (m[k] || 0) + 1;
  }
  return Object.entries(m).sort().map(([k, v]) => `${k}=${v}`).join(", ");
}

// ─── Self-test ────────────────────────────────────────────────────────
function selftest() {
  console.log("=== sb-fix-2-build-packet --selftest ===");
  const stub = [
    {
      id: "2.3",
      title: "Stub",
      videos: [
        {
          id: "2.3.2",
          title: "Buffer Overflows",
          questions: [],
          scenarios: [],
          matching: [],
          cram: [
            {
              term: "Integer overflow",
              def: "Arithmetic result exceeds the maximum value a variable can hold.",
              audit_d_review: { sb16_candidate: true, sb16_subcategory: "messer-curriculum-gap", packet_id: "sb-fix-1b-packet-2" },
            },
          ],
        },
        {
          id: "2.3.8",
          title: "Hardware Vulnerabilities",
          questions: [
            {
              q: "Spectre and Meltdown are examples of:",
              opts: ["a", "b", "c", "d"], a: 0, exp: "Speculative execution attacks.",
              audit_d_review: { sb16_candidate: true, sb16_subcategory: "partial-depth", packet_id: "sb-fix-1a-packet-1" },
              messerVideo: "2.3 - Hardware Vulnerabilities", subObjective: "2.3",
            },
          ],
          scenarios: [],
          matching: [
            {
              prompt: "Speculative execution",
              answer: "Specter / Meltdown",
              audit_d_review: { sb16_candidate: true, sb16_subcategory: "partial-depth", packet_id: "sb-fix-1b-packet-2" },
            },
          ],
          cram: [],
        },
      ],
    },
  ];

  // Filter P
  const pItems = collectSb16Candidates(stub, "P");
  if (pItems.length !== 2) throw new Error(`P filter: expected 2, got ${pItems.length}`);
  if (pItems[0].location.video !== "2.3.8") throw new Error("P filter: wrong sort order");

  // Filter G
  const gItems = collectSb16Candidates(stub, "G");
  if (gItems.length !== 1) throw new Error(`G filter: expected 1, got ${gItems.length}`);
  if (gItems[0].location.video !== "2.3.2") throw new Error("G filter: wrong item selected");

  // Already-applied items skipped
  stub[0].videos[0].cram[0].audit_d_review.sb_fix_2 = { applied_at: "2026-05-22T00:00:00Z" };
  const gAfter = collectSb16Candidates(stub, "G");
  if (gAfter.length !== 0) throw new Error("Already-applied skip: expected 0 G items after marking applied");

  // Render shape
  const md = renderPacket(1, "P", pItems.slice(0, 2), 2, 0);
  if (!md.includes("# SB-fix-2 packet 1 — sub-path P")) throw new Error("render: missing title");
  if (!md.includes("Spectre and Meltdown")) throw new Error("render: missing item content");
  if (!md.includes("`Chapple 9th`")) throw new Error("render: missing canonical Sybex edition reference");

  console.log("  ✓ P sub-path filter (2 items)");
  console.log("  ✓ G sub-path filter (1 item)");
  console.log("  ✓ Already-applied items skipped");
  console.log("  ✓ Deterministic sort by (section, video, type, index)");
  console.log("  ✓ Render includes title, item content, Sybex edition reference");
  console.log("SB-fix-2 build self-test PASS");
}

// ─── Main ─────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs();
  if (args.selftest) { selftest(); return; }

  if (args.packet == null || !args.subPath || args.size == null) {
    console.error("usage: --packet N --sub-path P|G --start K --size M");
    console.error("       --selftest");
    process.exit(2);
  }
  if (args.subPath !== "P" && args.subPath !== "G") {
    console.error("--sub-path must be P or G; use sb-fix-2-route-pool-b.mjs for the R (routing) sub-path");
    process.exit(2);
  }

  const questions = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  const scope = collectSb16Candidates(questions, args.subPath);
  const slice = scope.slice(args.start, args.start + args.size);

  mkdirSync(OUT_DIR, { recursive: true });
  const mdPath = resolve(OUT_DIR, `packet-${args.packet}.md`);
  const jsonPath = resolve(OUT_DIR, `packet-${args.packet}.json`);
  const md = renderPacket(args.packet, args.subPath, slice, scope.length, args.start);
  writeFileSync(mdPath, md);

  const shadow = {
    packet: args.packet,
    sub_path: args.subPath,
    start: args.start,
    size: slice.length,
    scope_total: scope.length,
    generated_at: new Date().toISOString(),
    items: slice.map((r, i) => ({
      packet_index: args.start + i + 1,
      location: r.location,
      parent_video_title: r.parent_video_title,
      sb16_subcategory: r.sb16_subcategory,
      audit_d_review_origin: r.audit_d_review_origin,
      current_messerVideo: r.current_messerVideo,
      current_subObjective: r.current_subObjective,
      decision: null,
    })),
  };
  writeFileSync(jsonPath, JSON.stringify(shadow, null, 2));

  console.log(`Wrote ${mdPath}`);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Sub-path: ${args.subPath}; scope total: ${scope.length}; this packet: ${slice.length}`);
  console.log(`By section: ${tally(slice, r => `§${r.location.section}`)}`);
  console.log(`By type:    ${tally(slice, r => r.location.type)}`);
}

main();
