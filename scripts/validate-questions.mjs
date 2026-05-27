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
const pathOverride = args.find((a) => a.startsWith("--path="))?.split("=")[1];
const selftest = args.includes("--selftest");

const effectiveJsonPath = pathOverride ? resolve(pathOverride) : jsonPath;
const data = selftest ? null : JSON.parse(readFileSync(effectiveJsonPath, "utf8"));

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

// Classify an item as new (has any citation) or legacy (no citations).
// A top-level `sybex_reference` is a first-class citation alongside the Messer
// pair (Task 1g.1 / Q-E): a Sybex-native item carries `sybex_reference` and no
// Messer fields, and must NOT be mis-flagged as legacy.
const isNew = (item) =>
  Boolean(item?.messerVideo || item?.subObjective || item?.sybex_reference);

// Walk every string field in an item, calling cb(fieldName, value).
// Intentionally does NOT walk `messerVideo` or `subObjective` on any item kind:
// those fields are bounded by the 120-entry known-Messer-title allowlist (the
// same allowlist used by `scripts/sb-fix-1a-build-packet.mjs` parser v2), so
// spelling/emoji scans would produce false positives against the canonical
// title set. Citation correctness is enforced separately by `checkCitation()`.
// Do not add `messerVideo` here without a corresponding allowlist-aware scan.
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

// Citation rules — applied uniformly across mc / scen / match / cram.
//
// An item is validly cited by EITHER the Messer pair (messerVideo +
// subObjective) OR a top-level `sybex_reference`, OR both (Task 1g.1 / Q-E).
//
// Messer co-required rule (UNCHANGED): presence of either `messerVideo` or
// `subObjective` requires BOTH with valid values. Partial citation (one
// present, the other absent) is malformed and emits `missing-messer` or
// `missing-subobj` per the existing error codes (preserved verbatim).
//
// Sybex rule (additive): a present `sybex_reference` is shape-validated by
// `checkSybexReference()` (new `sybex-*` codes). It is independent of the
// Messer pair — an item may carry one, the other, or both.
//
// `requireCitation` distinguishes the type-level enforcement asymmetry:
//   - mc / scen call with requireCitation=true: legacy items (NO citation of
//     any kind) emit `legacy-no-citation` info. Grandfathering is preserved —
//     a citation-less item stays info, never error (1g.1 does not enforce
//     sourceProvenance, so it cannot tell a lost-Sybex-citation item from an
//     intentional legacy item; that check belongs to 1g.4/1g.6).
//   - match / cram call with requireCitation=false: citation is structurally
//     optional on these types, so legacy state is silent.
function checkCitation(item, location, { requireCitation }) {
  const hasMesser = Boolean(item.messerVideo || item.subObjective);
  const hasSybex = item.sybex_reference != null;

  // Messer block — both-or-neither; error codes preserved verbatim.
  if (hasMesser) {
    if (!item.messerVideo) {
      record("error", "missing-messer", location, "new item lacks 'messerVideo'");
    }
    if (!item.subObjective) {
      record("error", "missing-subobj", location, "new item lacks 'subObjective'");
    } else if (!SUBOBJ_PATTERN.test(item.subObjective)) {
      record("error", "subobj-format", location, `'subObjective' "${item.subObjective}" must match \\d+\\.\\d+(\\.\\d+)?`);
    }
  }

  // Sybex block — additive; only fires when a top-level sybex_reference exists.
  if (hasSybex) {
    checkSybexReference(item.sybex_reference, location);
  }

  // At-least-one / legacy rule — info, never error (grandfathering preserved).
  if (!isNew(item) && requireCitation) {
    record("info", "legacy-no-citation", location, "legacy item lacks messerVideo + subObjective (grandfathered)");
  }
}

// Validate a top-level `sybex_reference` — a Sybex-native question citation.
// (Audit-trail references live nested in `audit_d_review.sb_fix_2` and are NOT
// checked here.) Minimum valid citation (Q-A / 1g.1, §2c of the signed-off plan):
//   edition         : non-empty string (canonical-string match is a 1g.4 content
//                     rule, NOT a validator rule — non-empty is sufficient here)
//   question_number : integer ≥ 1
//   exactly one of  : chapter (int ≥ 1)  XOR  practice_exam (int ≥ 1)
// `section` / `page` / `quote_excerpt` / `chapter_level_only` / `note` are
// accepted (shape-mirrored from sb_fix_2) but NEVER required at top level: the
// item IS the Sybex content, so there is no evidentiary burden and
// `chapter_level_only` is semantically inert here (nothing to waive).
function checkSybexReference(ref, location) {
  if (typeof ref !== "object" || ref === null || Array.isArray(ref)) {
    record("error", "sybex-shape", location, "'sybex_reference' must be an object");
    return;
  }
  if (typeof ref.edition !== "string" || !ref.edition.trim()) {
    record("error", "sybex-edition", location, "'sybex_reference.edition' must be a non-empty string");
  }
  if (!Number.isInteger(ref.question_number) || ref.question_number < 1) {
    record("error", "sybex-question-number", location, "'sybex_reference.question_number' must be an integer ≥ 1");
  }
  const hasChapter = ref.chapter !== undefined;
  const hasExam = ref.practice_exam !== undefined;
  if (hasChapter === hasExam) {
    record("error", "sybex-locator", location, "'sybex_reference' must have exactly one of 'chapter' or 'practice_exam'");
  } else if (hasChapter && (!Number.isInteger(ref.chapter) || ref.chapter < 1)) {
    record("error", "sybex-locator", location, "'sybex_reference.chapter' must be an integer ≥ 1");
  } else if (hasExam && (!Number.isInteger(ref.practice_exam) || ref.practice_exam < 1)) {
    record("error", "sybex-locator", location, "'sybex_reference.practice_exam' must be an integer ≥ 1");
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

  // Citation rules — mc/scen require citations on NEW items and emit
  // legacy-no-citation info otherwise.
  checkCitation(item, location, { requireCitation: true });
}

// ─── Self-test fixtures (--selftest) ──────────────────────────────────────
//
// Runs 14 fixtures (3 match + 3 cram + 8 mc/sybex) against checkCitation() to
// verify: the Messer both-or-neither rule + subobj format rule + optional-by-
// default behaviour on match/cram (original 6), AND the Task 1g.1 top-level
// `sybex_reference` acceptance + shape validation + preserved legacy
// grandfathering (new 8). Exits 0 on full PASS, 1 on any FAIL.
//
// Added in SB-fix-1b-prep (2026-05-21) to establish the test pattern for
// schema additions; extended in Task 1g.1 (2026-05-27) for sybex_reference.
// Tuple: [kind, location, item, requireCitation, expectedIssues, description].
if (selftest) {
  const expected = [
    // Original 6 — match/cram, requireCitation:false (citation optional).
    ["match", "selftest match[0]", { prompt: "P", answer: "A", messerVideo: "1.1 - Security Controls", subObjective: "1.1" }, false, [], "valid: both fields present"],
    ["match", "selftest match[1]", { prompt: "P", answer: "A", messerVideo: "1.1 - Security Controls" }, false, ["missing-subobj"], "missing subObjective"],
    ["match", "selftest match[2]", { prompt: "P", answer: "A", messerVideo: "1.1 - Security Controls", subObjective: "bad-format" }, false, ["subobj-format"], "bad subObjective format"],
    ["cram",  "selftest cram[0]",  { term: "T", def: "D", messerVideo: "1.1 - Security Controls", subObjective: "1.1" }, false, [], "valid: both fields present"],
    ["cram",  "selftest cram[1]",  { term: "T", def: "D", subObjective: "1.1" }, false, ["missing-messer"], "missing messerVideo"],
    ["cram",  "selftest cram[2]",  { term: "T", def: "D" }, false, [], "neither field present (optional, no info on match/cram)"],
    // Task 1g.1 — mc, requireCitation:true (mc/scen require a citation on NEW items).
    ["mc", "selftest sybex[0]", { messerVideo: "1.1 - Security Controls", subObjective: "1.1" }, true, [], "valid Messer citation, no sybex_reference"],
    ["mc", "selftest sybex[1]", { sybex_reference: { edition: "Chapple 9th", chapter: 4, question_number: 1 } }, true, [], "valid top-level sybex_reference (chapter), no Messer"],
    ["mc", "selftest sybex[2]", { messerVideo: "1.1 - Security Controls", subObjective: "1.1", sybex_reference: { edition: "Chapple 9th", chapter: 4, question_number: 1 } }, true, [], "both Messer and sybex_reference"],
    ["mc", "selftest sybex[3]", {}, true, ["legacy-no-citation"], "no citation of any kind -> legacy (info, NOT error)"],
    ["mc", "selftest sybex[4]", { sybex_reference: { edition: "Chapple 9th", chapter: 4 } }, true, ["sybex-question-number"], "sybex_reference missing question_number"],
    ["mc", "selftest sybex[5]", { sybex_reference: { edition: "Chapple 9th", chapter: 4, question_number: 1, chapter_level_only: true } }, true, [], "chapter_level_only=true, no quote_excerpt -> PASS (never required at top level)"],
    ["mc", "selftest sybex[6]", { sybex_reference: { edition: "Chapple 9th", practice_exam: 1, question_number: 26 } }, true, [], "practice-exam reference (practice_exam + question_number, no chapter)"],
    ["mc", "selftest sybex[7]", { sybex_reference: { edition: "Chapple 9th", chapter: 4, practice_exam: 1, question_number: 1 } }, true, ["sybex-locator"], "both chapter and practice_exam -> locator error"],
  ];

  let passed = 0;
  let failed = 0;
  const failures = [];
  for (const [, loc, item, reqCit, want, desc] of expected) {
    // Snapshot issues so far, then run checkCitation, then diff.
    const before = issues.length;
    checkCitation(item, loc, { requireCitation: reqCit });
    const newIssues = issues.slice(before);
    const got = newIssues.map((i) => i.code).sort();
    const wantSorted = [...want].sort();
    const ok = got.length === wantSorted.length && got.every((c, i) => c === wantSorted[i]);
    if (ok) {
      passed++;
    } else {
      failed++;
      failures.push({ loc, desc, want: wantSorted, got });
    }
    // Trim back: self-test shouldn't pollute the issue accumulator.
    issues.length = before;
  }

  console.log(`\nValidator self-test: ${passed} PASS, ${failed} FAIL (of ${expected.length})`);
  for (const f of failures) {
    console.log(`  FAIL ${f.loc} — ${f.desc}`);
    console.log(`    expected codes: [${f.want.join(", ")}]`);
    console.log(`    got codes:      [${f.got.join(", ")}]`);
  }
  process.exit(failed > 0 ? 1 : 0);
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
      // Citation is structurally optional on match items; co-required when either field is present.
      checkCitation(m, loc, { requireCitation: false });
    });
    (video.cram ?? []).forEach((c, i) => {
      const loc = `${vidLoc} cram[${i}]`;
      if (typeof c.term !== "string" || !c.term.trim()) record("error", "cram-term", loc, "missing term");
      if (typeof c.def !== "string" || !c.def.trim()) record("error", "cram-def", loc, "missing def");
      // Citation is structurally optional on cram items; co-required when either field is present.
      checkCitation(c, loc, { requireCitation: false });
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
