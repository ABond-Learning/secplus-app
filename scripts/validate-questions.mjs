// Validates questions.json against the CLAUDE.md quality rules.
//
// Usage:
//   node scripts/validate-questions.mjs              # summary to stdout, exit 1 on errors
//   node scripts/validate-questions.mjs --report=audit-report.md
//   node scripts/validate-questions.mjs --quiet      # only summary, no per-issue table
//
// Severities:
//   error : must fix before commit (broken structure, exp too short, missing
//           citations on NEW items, options out of range)
//   warn  : should review (spelling auto-fixable, BEST/MOST short distractors,
//           ambiguous flags)
//   info  : grandfathered (legacy items missing messerVideo/subObjective)
//
// "NEW item" = has either `messerVideo` or `subObjective` field. "Legacy" =
// has neither. Per Phase A directive, legacy items are flagged at info severity
// only and are not modified.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RULES, FLAG_ONLY, applyRules, findFlags } from "./spelling-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");

const args = process.argv.slice(2);
const reportPath = args.find((a) => a.startsWith("--report="))?.split("=")[1];
const quiet = args.includes("--quiet");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// ─── Constants ────────────────────────────────────────────────────────────
const MIN_EXP_CHARS = 40;
const MIN_DISTRACTOR_CHARS = 15;
const SUBOBJ_PATTERN = /^\d+\.\d+(\.\d+)?$/;
// "BEST"/"MOST" framing: ALL-CAPS BEST or MOST as a standalone word in the stem.
const BEST_MOST_PATTERN = /\b(BEST|MOST)\b/;
// Emojis: any character in the common emoji ranges (Misc Symbols, Pictographs,
// Emoticons, Transport, Flags, Supplemental Symbols, Symbols and Pictographs Ext-A).
const EMOJI_PATTERN = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

// ─── Issue accumulator ────────────────────────────────────────────────────
const issues = [];
function record(severity, code, location, detail, snippet) {
  issues.push({ severity, code, location, detail, snippet });
}

// Truncate a string for snippet display.
const trunc = (s, n = 120) => (s.length <= n ? s : s.slice(0, n - 1) + "…");

// Classify an item as new (has citation fields) or legacy (no citations).
const isNew = (item) => Boolean(item?.messerVideo || item?.subObjective);

// Walk every string field in an item, calling cb(fieldName, value).
function forEachStringField(item, kind, cb) {
  switch (kind) {
    case "mc":
    case "scenario":
      cb("q", item.q);
      (item.opts ?? []).forEach((o, i) => cb(`opts[${i}]`, o));
      cb("exp", item.exp);
      break;
    case "matching":
      cb("prompt", item.prompt);
      cb("answer", item.answer);
      break;
    case "cram":
      cb("term", item.term);
      cb("def", item.def);
      break;
    case "video":
      cb("title", item.title);
      break;
    case "section":
      cb("label", item.label);
      break;
  }
}

// Validate one MC or scenario item.
function checkChoice(item, location) {
  // Structural
  if (typeof item.q !== "string" || !item.q.trim()) {
    record("error", "missing-q", location, "missing or empty 'q'");
  }
  if (!Array.isArray(item.opts) || item.opts.length !== 4) {
    record("error", "opts-shape", location, `opts must be 4 items, got ${item.opts?.length ?? "none"}`);
  }
  if (typeof item.a !== "number" || item.a < 0 || item.a >= (item.opts?.length ?? 0)) {
    record("error", "answer-range", location, `'a' (${item.a}) out of range for opts of length ${item.opts?.length ?? 0}`);
  }
  if (typeof item.exp !== "string") {
    record("error", "missing-exp", location, "missing 'exp'");
  } else if (item.exp.length < MIN_EXP_CHARS) {
    record("error", "exp-too-short", location, `exp is ${item.exp.length} chars, need ≥${MIN_EXP_CHARS}`, item.exp);
  }

  // BEST/MOST distractor heuristic
  if (typeof item.q === "string" && BEST_MOST_PATTERN.test(item.q)) {
    const opts = item.opts ?? [];
    const a = item.a;
    opts.forEach((opt, i) => {
      if (i === a) return; // the correct answer length isn't a distractor concern
      if (typeof opt === "string" && opt.length < MIN_DISTRACTOR_CHARS) {
        record(
          "warn",
          "best-most-short-distractor",
          `${location}.opts[${i}]`,
          `BEST/MOST framing but distractor is only ${opt.length} chars (${trunc(opt, 50)})`,
          opt,
        );
      }
    });
  }

  // Citation rules — only enforced on NEW items.
  if (isNew(item)) {
    if (!item.messerVideo) {
      record("error", "missing-messer", location, "new item lacks 'messerVideo'");
    }
    if (!item.subObjective) {
      record("error", "missing-subobj", location, "new item lacks 'subObjective'");
    } else if (!SUBOBJ_PATTERN.test(item.subObjective)) {
      record("error", "subobj-format", location, `'subObjective' "${item.subObjective}" must match \\d+\\.\\d+(\\.\\d+)?`);
    }
  } else {
    // Legacy — record info-level missing citation (one entry per item).
    record("info", "legacy-no-citation", location, "legacy item lacks messerVideo + subObjective (grandfathered)");
  }
}

// Walk and validate everything.
const seenSectionIds = new Set();
const seenVideoIds = new Set();

for (const section of data) {
  // Section structure
  const secLoc = `§${section.id ?? "?"}`;
  if (typeof section.id !== "string") record("error", "section-id", secLoc, "missing section.id");
  else if (seenSectionIds.has(section.id)) record("error", "section-id-dup", secLoc, `duplicate section id '${section.id}'`);
  else seenSectionIds.add(section.id);
  if (typeof section.label !== "string") record("error", "section-label", secLoc, "missing section.label");
  if (!Array.isArray(section.videos) || section.videos.length === 0) {
    record("error", "section-videos", secLoc, "section has no videos");
    continue;
  }

  for (const video of section.videos) {
    const vidLoc = `${secLoc}/${video.id ?? "?"}`;
    if (typeof video.id !== "string") record("error", "video-id", vidLoc, "missing video.id");
    else if (seenVideoIds.has(video.id)) record("error", "video-id-dup", vidLoc, `duplicate video id '${video.id}'`);
    else seenVideoIds.add(video.id);
    if (typeof video.title !== "string") record("error", "video-title", vidLoc, "missing video.title");

    (video.questions ?? []).forEach((q, i) => checkChoice(q, `${vidLoc} mc[${i}]`));
    (video.scenarios ?? []).forEach((s, i) => checkChoice(s, `${vidLoc} scen[${i}]`));
    (video.matching ?? []).forEach((m, i) => {
      const loc = `${vidLoc} match[${i}]`;
      if (typeof m.prompt !== "string" || !m.prompt.trim()) record("error", "match-prompt", loc, "missing prompt");
      if (typeof m.answer !== "string" || !m.answer.trim()) record("error", "match-answer", loc, "missing answer");
    });
    (video.cram ?? []).forEach((c, i) => {
      const loc = `${vidLoc} cram[${i}]`;
      if (typeof c.term !== "string" || !c.term.trim()) record("error", "cram-term", loc, "missing term");
      if (typeof c.def !== "string" || !c.def.trim()) record("error", "cram-def", loc, "missing def");
    });

    // Spelling + emoji + flag scan over EVERY string field of EVERY item, including the section/video.
    const scan = (fieldName, value, baseLoc) => {
      if (typeof value !== "string") return;
      const loc = `${baseLoc}.${fieldName}`;
      if (EMOJI_PATTERN.test(value)) {
        record("error", "emoji", loc, "contains emoji character", trunc(value));
      }
      const { hits } = applyRules(value);
      for (const hit of hits) {
        record("warn", `spelling-${hit.family}`, loc, `'${hit.original}' → '${hit.replacement}'`, trunc(value));
      }
      const flags = findFlags(value);
      for (const flag of flags) {
        record("warn", `spelling-flag`, loc, `'${flag.original}' — ${flag.note}`, trunc(value));
      }
    };

    forEachStringField(section, "section", (f, v) => scan(f, v, secLoc));
    forEachStringField(video, "video", (f, v) => scan(f, v, vidLoc));
    (video.questions ?? []).forEach((q, i) => forEachStringField(q, "mc", (f, v) => scan(f, v, `${vidLoc} mc[${i}]`)));
    (video.scenarios ?? []).forEach((s, i) => forEachStringField(s, "scenario", (f, v) => scan(f, v, `${vidLoc} scen[${i}]`)));
    (video.matching ?? []).forEach((m, i) => forEachStringField(m, "matching", (f, v) => scan(f, v, `${vidLoc} match[${i}]`)));
    (video.cram ?? []).forEach((c, i) => forEachStringField(c, "cram", (f, v) => scan(f, v, `${vidLoc} cram[${i}]`)));
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────
const bySeverity = { error: 0, warn: 0, info: 0 };
const byCode = {};
for (const issue of issues) {
  bySeverity[issue.severity]++;
  byCode[issue.code] = (byCode[issue.code] ?? 0) + 1;
}

console.log(`\nValidator results: ${issues.length} issues`);
console.log(`  errors: ${bySeverity.error}`);
console.log(`  warns:  ${bySeverity.warn}`);
console.log(`  info:   ${bySeverity.info}`);
console.log("\nBy code:");
for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(5)}  ${code}`);
}

// ─── Markdown report ──────────────────────────────────────────────────────
if (reportPath) {
  const out = [];
  out.push("# Audit report — questions.json");
  out.push("");
  out.push(`Generated by \`scripts/validate-questions.mjs\` on ${new Date().toISOString().slice(0, 10)}.`);
  out.push("");
  out.push("## Summary");
  out.push("");
  out.push(`- Total issues: **${issues.length}**`);
  out.push(`- Errors: **${bySeverity.error}** (block commit)`);
  out.push(`- Warnings: **${bySeverity.warn}** (review; spelling auto-fixable)`);
  out.push(`- Info: **${bySeverity.info}** (legacy grandfathered)`);
  out.push("");
  out.push("### Counts by code");
  out.push("");
  out.push("| Code | Count | Severity |");
  out.push("|---|---:|---|");
  const codeSeverity = {};
  for (const issue of issues) codeSeverity[issue.code] ??= issue.severity;
  for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
    out.push(`| \`${code}\` | ${n} | ${codeSeverity[code]} |`);
  }
  out.push("");

  // Group by severity, then by code.
  for (const sev of ["error", "warn", "info"]) {
    const sevIssues = issues.filter((i) => i.severity === sev);
    if (sevIssues.length === 0) continue;
    out.push(`## ${sev.toUpperCase()} (${sevIssues.length})`);
    out.push("");
    const byCodeMap = {};
    for (const i of sevIssues) (byCodeMap[i.code] ??= []).push(i);
    for (const [code, items] of Object.entries(byCodeMap).sort((a, b) => b[1].length - a[1].length)) {
      out.push(`### \`${code}\` — ${items.length} ${items.length === 1 ? "occurrence" : "occurrences"}`);
      out.push("");
      // For high-volume codes, show top 10 + summary; for low-volume, show all.
      const showAll = items.length <= 25;
      const sample = showAll ? items : items.slice(0, 15);
      for (const item of sample) {
        out.push(`- **${item.location}** — ${item.detail}`);
        if (item.snippet) out.push(`  > ${item.snippet.replace(/\n/g, " ")}`);
      }
      if (!showAll) {
        out.push(`- … and ${items.length - sample.length} more`);
      }
      out.push("");
    }
  }

  writeFileSync(resolve(repo, reportPath), out.join("\n"), "utf8");
  console.log(`\nWrote ${reportPath}`);
}

if (!quiet && issues.length > 0 && !reportPath) {
  console.log("\n(Use --report=audit-report.md for full per-issue listing)");
}

process.exit(bySeverity.error > 0 ? 1 : 0);
