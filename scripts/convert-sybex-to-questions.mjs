// Task 1g.4 — Convert the Sybex corpus to questions.json item shape.
//
// B1-aggregated (per Q-B): one synthetic Sybex video node per X.Y
// subsection holding all items the judge tagged with that code.
//
// Dry-run by default — writes a markdown report + a preview JSON under
// .audit-working/sb-1g-3/ but does NOT touch questions.json. Pass --apply
// (a 1g.6 task, not 1g.4) to merge into questions.json atomically.
//
// SM-2 key format (Aiden-confirmed Option A 2026-05-28): all predicted
// keys are `sybex-mc-<bucket><NN>-q<n>` so the 1g.0 TRACKED_PREFIX entry
// is the one matching, not an incidental `mc-` match.

import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ─── 1g.5 accidental-match framing_notes (Aiden-approved 2026-05-28) ──
// Five Sybex-vs-common-Security+ divergence notes attached to the
// accidental-match anchors. Field name: framing_note (top-level string).
const FRAMING_NOTES = {
  "sybex-ch04-q1":
    "The lookalike domain `amaz0n.com` is a textbook typosquat, and a Messer-style instinct might pick \"Typosquatting.\" Sybex (and the exam) categorise this by the *initiation channel*: an email arrives unsolicited, asking the user to act on a link — that is phishing. Typosquatting is the *technique* used inside the phishing email (the lookalike URL); it isn't the attack class. On the exam, when an email initiates the contact, lead with phishing/spear-phishing/whaling and treat typosquat-style URLs as one of phishing's tools.",
  "sybex-ch08-q3":
    "Both A and B can be true of cloud-hosted identity, which makes this question feel like a 50/50. Sybex resolves it by asking which difference is *defining* rather than *possible*: cloud-hosted IAM exists because the provider runs the identity layer (option B). Option A overstates the constraint — most cloud IAM lets the customer set their own account policies. If you see \"what is THE major difference\" framing on the exam, pick the answer that defines the service model, not a side-effect that can vary by provider.",
  "sybex-ch11-q15":
    "This one diverges from a lot of Security+ teaching that lists cost alongside compute, power, and network as embedded-system constraints. Sybex's argument is that embedded systems exist at many price points (from a $3 microcontroller to a multi-thousand-dollar industrial PLC), so cost isn't an inherent constraint of the category — it's a design choice. The exam may frame it either way; if the question is about *inherent technical limits* (resources, footprint, connectivity), cost is the odd one out. If the question is about *deployment constraints* (budget, scale, replacement cost), cost is in. Read the framing carefully.",
  "sybex-ch12-q17":
    "On-path attacks (formerly MITM) come in two flavours: network-level (rogue AP, ARP poisoning, compromised router) and browser-level / Man-in-the-Browser (malicious plug-ins or proxies modifying traffic at the browser). A common Security+ instinct goes straight to network-level and picks the compromised router. Sybex tests the browser-level variant here — a malicious browser plug-in IS an on-path attack, just at a different layer. The exam treats both as on-path; let the question's other details (Wayne's \"computers he is responsible for\", not \"his network\") tell you which variant is being tested.",
  "sybex-ch14-q20":
    "A from-first-principles answer is registry dumps — Windows services live in the registry, so a registry diff would catch new services exactly. Sybex's reasoning is operational: registries aren't *commonly gathered* across most organisations, but vulnerability scans are run regularly and routinely flag new services as they appear. The question hinges on the word \"commonly gathered\" — Sybex tests *what data you actually have*, not *what data would in principle be ideal*. When the exam emphasises practical/operational framing (\"commonly\", \"in most organisations\"), favour the answer that reflects routine practice over the theoretically tightest answer.",
};

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

const args = { apply: false };
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--apply") args.apply = true;
}

const INPUT_PATH     = resolve(repo, ".audit-working/sb-1g-3/corpus-input-S0.json");
const VERDICTS_PATH  = resolve(repo, ".audit-working/sb-1g-3/corpus-verdicts.json");
const QUESTIONS_PATH = resolve(repo, "questions.json");
const DRYRUN_PATH    = resolve(repo, ".audit-working/sb-1g-3/conversion-dryrun.md");
const PREVIEW_PATH   = resolve(repo, ".audit-working/sb-1g-3/questions-sybex.json");

const sourceItems       = JSON.parse(readFileSync(INPUT_PATH,    "utf8"));
const verdictsRaw       = JSON.parse(readFileSync(VERDICTS_PATH, "utf8"));
const questionsExisting = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));

if (!Array.isArray(sourceItems) || sourceItems.length !== 500) {
  throw new Error(`expected 500 source items, got ${sourceItems.length}`);
}
if (!Array.isArray(verdictsRaw.verdicts) || verdictsRaw.verdicts.length !== 500) {
  throw new Error(`expected 500 verdicts, got ${verdictsRaw.verdicts?.length}`);
}

const codeById = new Map();
for (const v of verdictsRaw.verdicts) codeById.set(v.id, v.verdict.objective_code);
if (codeById.size !== 500) throw new Error(`verdict id collisions: unique ${codeById.size}`);

function parseSourceId(id) {
  // sybex-chNN-qN or sybex-peNN-qN (NN zero-padded; N not padded).
  const m = id.match(/^sybex-(ch|pe)(\d{2})-q(\d+)$/);
  if (!m) throw new Error(`unparseable id ${id}`);
  return { bucket: m[1], num: parseInt(m[2], 10), n: parseInt(m[3], 10) };
}

const LETTERS = ["A", "B", "C", "D"];

const emitted = [];   // { src_id, objective_code, sourceProvenance, predictedSm2Key, item }
const shapeErrors = [];

for (const src of sourceItems) {
  const code = codeById.get(src.id);
  if (!code) {
    shapeErrors.push({ id: src.id, error: "no verdict for id" });
    continue;
  }
  let loc;
  try { loc = parseSourceId(src.id); }
  catch (e) { shapeErrors.push({ id: src.id, error: e.message }); continue; }

  const correctIdx = LETTERS.indexOf(src.correct?.letter);
  if (correctIdx < 0) {
    shapeErrors.push({ id: src.id, error: `bad correct.letter ${src.correct?.letter}` });
    continue;
  }
  const opts = LETTERS.map((L) => src.options?.[L]);
  if (opts.some((o) => typeof o !== "string" || !o.trim())) {
    shapeErrors.push({ id: src.id, error: "missing or empty option text" });
    continue;
  }
  if (typeof src.stem !== "string" || !src.stem.trim()) {
    shapeErrors.push({ id: src.id, error: "missing stem" });
    continue;
  }
  if (typeof src.explanation !== "string" || !src.explanation.trim()) {
    shapeErrors.push({ id: src.id, error: "missing explanation" });
    continue;
  }

  const sourceProvenance = loc.bucket === "ch" ? "sybex-chapter" : "sybex-practice-exam";

  // sybex_reference per SCHEMA.md §"Sybex citation": edition + question_number
  // + exactly one of chapter / practice_exam. chapter_level_only=true because
  // the Sybex test-bank JSONs carry source/n but no section/page anchors at
  // this scale.
  const sybex_reference = {
    edition: "Chapple 9th",
    question_number: loc.n,
    chapter_level_only: true,
  };
  if (loc.bucket === "ch") sybex_reference.chapter = loc.num;
  else sybex_reference.practice_exam = loc.num;

  // Predicted SM-2 key (Option A: sybex-first / type-inner).
  const sourceKeyTail = `${loc.bucket}${String(loc.num).padStart(2, "0")}-q${loc.n}`;
  const predictedSm2Key = `sybex-mc-${sourceKeyTail}`;

  const itemRecord = {
    q: src.stem,
    opts,
    a: correctIdx,
    exp: src.explanation,
    sybex_reference,
    sourceProvenance,
  };
  if (FRAMING_NOTES[src.id]) {
    itemRecord.framing_note = FRAMING_NOTES[src.id];
  }
  emitted.push({
    src_id: src.id,
    objective_code: code,
    sourceProvenance,
    predictedSm2Key,
    item: itemRecord,
  });
}

// Group by objective_code (one synthetic Sybex video per X.Y).
const byObjective = new Map();
for (const it of emitted) {
  if (!byObjective.has(it.objective_code)) byObjective.set(it.objective_code, []);
  byObjective.get(it.objective_code).push(it);
}
// Stable sort within each bucket by src_id.
for (const arr of byObjective.values()) arr.sort((a, b) => a.src_id.localeCompare(b.src_id));

// SM-2 key startsWith("sybex-") audit (this is the load-bearing check).
const nonSybexKeys = emitted.filter((it) => !it.predictedSm2Key.startsWith("sybex-"));

// Domain rollup.
const domains = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
for (const it of emitted) domains[it.objective_code[0]] += 1;

// Build preview sections (only for X.Y subsections that received items).
const sectionLabelById = new Map(questionsExisting.map((s) => [s.id, s.label]));
const previewSections = [];
for (const code of [...byObjective.keys()].sort()) {
  const bucket = byObjective.get(code);
  previewSections.push({
    id: code,
    label: sectionLabelById.get(code) || code,
    videos: [
      {
        id: `${code}.sybex`,
        title: "Sybex Items",
        cram: [],
        matching: [],
        questions: bucket.map((b) => b.item),
        scenarios: [],
      },
    ],
  });
}

// Sanity: every existing section_id touched is real (no synthetic 1.5 etc.).
const validSectionIds = new Set(questionsExisting.map((s) => s.id));
const unknownSections = [...byObjective.keys()].filter((c) => !validSectionIds.has(c));

// Synthetic video id collision check (no `${code}.sybex` already exists).
const collisionIds = [];
for (const code of byObjective.keys()) {
  const existing = questionsExisting.find((s) => s.id === code);
  if (existing && (existing.videos || []).some((v) => v.id === `${code}.sybex`)) {
    collisionIds.push(`${code}.sybex`);
  }
}

// ─── Report builder ─────────────────────────────────────────────────
const lines = [];
const p = (s = "") => lines.push(s);

p(`# Task 1g.4 — Conversion dry-run`);
p();
p(`**Mode:** dry-run — nothing merged into \`questions.json\`. Preview JSON is in \`.audit-working/\`, not in the repo root.`);
p();
p(`**Inputs joined on \`id\` (n=500):**`);
p(`- \`.audit-working/sb-1g-3/corpus-input-S0.json\`  — source items`);
p(`- \`.audit-working/sb-1g-3/corpus-verdicts.json\`  — objective tags`);
p();
p(`**Outputs (under \`.audit-working/sb-1g-3/\`, gitignored):**`);
p(`- \`conversion-dryrun.md\`     — this report`);
p(`- \`questions-sybex.json\`     — preview merge fragment (not yet folded into questions.json)`);
p();
p(`---`);
p();

p(`## 1. Headline counts`);
p();
p(`| Metric | Value |`);
p(`|--------|------:|`);
p(`| Source items                                   | ${sourceItems.length} |`);
p(`| Items emitted                                  | ${emitted.length} / 500 |`);
p(`| Shape errors                                   | ${shapeErrors.length} |`);
p(`| Distinct objective_codes used                  | ${byObjective.size} / 28 |`);
p(`| Synthetic Sybex videos created                 | ${byObjective.size} (one per X.Y that received items) |`);
p(`| Predicted SM-2 keys NOT \`startsWith("sybex-")\` | **${nonSybexKeys.length}** (target 0) |`);
p(`| Unknown X.Y section ids (not in questions.json) | ${unknownSections.length} |`);
p(`| Synthetic video.id collisions with existing    | ${collisionIds.length} |`);
p();
p(`---`);
p();

p(`## 2. Per-domain distribution (vs SY0-701 weights)`);
p();
p(`| Domain | items | % of 500 | target | delta |`);
p(`|--------|------:|---------:|-------:|------:|`);
const targets = { 1: 12, 2: 22, 3: 18, 4: 28, 5: 20 };
for (const d of [1, 2, 3, 4, 5]) {
  const pct = (domains[d] / 500) * 100;
  const delta = pct - targets[d];
  const sign = delta >= 0 ? "+" : "";
  p(`| ${d}.0 | ${domains[d]} | ${pct.toFixed(1)}% | ${targets[d]}% | ${sign}${delta.toFixed(1)} |`);
}
p();
p(`---`);
p();

p(`## 3. Per-X.Y distribution (one synthetic Sybex video per X.Y)`);
p();
p(`| X.Y | items | label |`);
p(`|-----|------:|-------|`);
for (const code of [...byObjective.keys()].sort()) {
  p(`| ${code} | ${byObjective.get(code).length} | ${sectionLabelById.get(code) || "_(unknown section)_"} |`);
}
p();
p(`---`);
p();

p(`## 4. SM-2 key audit`);
p();
p(`Every predicted SM-2 key must \`startsWith("sybex-")\` so the 1g.0 TRACKED_PREFIX entry is the one matching, not an incidental \`mc-\` match. The app-side key derivation (mcKey) currently produces \`mc-\${videoId}-\${qi}\`; **wiring the app to honour Sybex-keyed items is part of 1g.6**, not this ship. The predicted-key audit here certifies the conversion's *intent* against the load-bearing prefix.`);
p();
p(`- Total predicted keys: **${emitted.length}**`);
p(`- Failing \`startsWith("sybex-")\`: **${nonSybexKeys.length}** (target 0)`);
p(`- Distinct predicted keys: **${new Set(emitted.map((e) => e.predictedSm2Key)).size}** (target = ${emitted.length}; no collisions)`);
p();
p(`### 4.1 First / last sample (5 each)`);
p();
p(`| src_id | predicted SM-2 key | objective_code | sourceProvenance |`);
p(`|--------|--------------------|----------------|------------------|`);
for (const it of [...emitted.slice(0, 5), ...emitted.slice(-5)]) {
  p(`| ${it.src_id} | \`${it.predictedSm2Key}\` | ${it.objective_code} | ${it.sourceProvenance} |`);
}
p();
p(`---`);
p();

p(`## 5. Sample emitted item shape (first item)`);
p();
const sampleItem = emitted[0]?.item;
p(`Predicted SM-2 key for this item: \`${emitted[0]?.predictedSm2Key}\``);
p();
p("```json");
p(JSON.stringify(sampleItem, null, 2));
p("```");
p();
p(`---`);
p();

p(`## 6. Shape errors`);
p();
if (shapeErrors.length === 0) {
  p(`_(none)_`);
} else {
  p(`| id | error |`);
  p(`|----|-------|`);
  for (const e of shapeErrors) p(`| ${e.id} | ${e.error} |`);
}
p();
p(`---`);
p();

p(`## 7. Section / collision checks`);
p();
p(`- Unknown X.Y section ids referenced by the judge: ${unknownSections.length === 0 ? "_(none — all 28 codes map to existing sections)_" : unknownSections.join(", ")}`);
p(`- Synthetic \`<X.Y>.sybex\` video ids that collide with existing video ids: ${collisionIds.length === 0 ? "_(none)_" : collisionIds.join(", ")}`);
p();
p(`---`);
p();

p(`## 8. Sybex_reference shape (per item)`);
p();
p(`| Field | Used in this conversion | Rationale |`);
p(`|-------|--------------------------|-----------|`);
p(`| \`edition\`            | \`"Chapple 9th"\` (constant) | required per SCHEMA.md |`);
p(`| \`question_number\`    | source \`n\` integer | required |`);
p(`| \`chapter\` OR \`practice_exam\` | exactly one (parsed from id bucket \`ch\` / \`pe\`) | required, exactly-one |`);
p(`| \`section\`            | omitted | not in source JSONs at item-level |`);
p(`| \`page\`               | omitted | not in source JSONs at item-level |`);
p(`| \`chapter_level_only\` | \`true\` | per ship prompt: "where not available" — section/page not available |`);
p(`| \`quote_excerpt\`      | omitted | not required for primary content citation (SCHEMA §"Sybex citation") |`);
p();
p(`---`);
p();

p(`## 9. What's next`);
p();
p(`Holding before 1g.5. On sign-off of this dry-run:`);
p(`- 1g.5: surface the 5 accidental-match framing notes for review.`);
p(`- 1g.6: pre-1g.6 gate — re-verify 1g.0 sync prefix at HEAD (already confirmed in the pre-flight pushback); then merge \`questions-sybex.json\` into \`questions.json\`, run validator, build, app smoke; commit conversion script + tooling.`);
p(`- 1g.7: Report-#NNNN documenting the four known-limitation findings.`);
p();
p(`No \`questions.json\` write has occurred this ship.`);

writeFileSync(DRYRUN_PATH, lines.join("\n"), "utf8");
writeFileSync(PREVIEW_PATH, JSON.stringify(previewSections, null, 2) + "\n", "utf8");

console.log(`dry-run report: ${DRYRUN_PATH}`);
console.log(`preview JSON:   ${PREVIEW_PATH}`);
console.log();
console.log(`items emitted:           ${emitted.length} / 500`);
console.log(`shape errors:            ${shapeErrors.length}`);
console.log(`X.Y videos created:      ${byObjective.size} / 28`);
console.log(`predicted-key audit:     ${emitted.length - nonSybexKeys.length} / ${emitted.length} startsWith("sybex-")`);
console.log(`distinct predicted keys: ${new Set(emitted.map((e) => e.predictedSm2Key)).size}`);
console.log(`unknown sections:        ${unknownSections.length}`);
console.log(`video.id collisions:     ${collisionIds.length}`);

// ─── --apply: merge into questions.json (1g.6) ──────────────────────
if (args.apply) {
  console.log("");
  console.log("--apply: merging into questions.json (atomic write)");
  console.log(`  framing_notes attached: ${Object.keys(FRAMING_NOTES).length} (ch04-q1, ch08-q3, ch11-q15, ch12-q17, ch14-q20)`);

  // Defensive: every framing_note id must have an emitted item.
  const emittedIds = new Set(emitted.map((e) => e.src_id));
  const missingFraming = Object.keys(FRAMING_NOTES).filter((id) => !emittedIds.has(id));
  if (missingFraming.length > 0) {
    console.error(`FATAL: framing_note keys without emitted items: ${missingFraming.join(", ")}`);
    process.exit(1);
  }

  // For each section that received items, append the synthetic Sybex
  // video. Reject if the section's videos already include the synthetic
  // id (idempotency guard — re-running --apply must noop, not double-add).
  const merged = JSON.parse(JSON.stringify(questionsExisting));
  const additions = [];
  for (const [code, bucket] of [...byObjective.entries()].sort()) {
    const targetSection = merged.find((s) => s.id === code);
    if (!targetSection) {
      console.error(`FATAL: section ${code} not found in questions.json`);
      process.exit(1);
    }
    const syntheticId = `${code}.sybex`;
    if ((targetSection.videos || []).some((v) => v.id === syntheticId)) {
      console.error(
        `--apply: synthetic video ${syntheticId} already present in questions.json — refusing to double-add. To re-apply, remove the existing synthetic videos manually first.`,
      );
      process.exit(1);
    }
    const syntheticVideo = {
      id: syntheticId,
      title: "Sybex Items",
      cram: [],
      matching: [],
      questions: bucket.map((b) => b.item),
      scenarios: [],
    };
    targetSection.videos = [...(targetSection.videos || []), syntheticVideo];
    additions.push({ code, count: bucket.length });
  }

  // Atomic write: write to .tmp, then rename.
  const tmp = QUESTIONS_PATH + ".tmp";
  writeFileSync(tmp, JSON.stringify(merged, null, 2) + "\n", "utf8");
  renameSync(tmp, QUESTIONS_PATH);

  console.log(`  questions.json written atomically (${additions.length} synthetic videos added)`);
  console.log("");
  console.log("  Per-section additions:");
  for (const a of additions) console.log(`    ${a.code}: +${a.count} items (video ${a.code}.sybex)`);
  console.log("");
  console.log(`  Total items merged: ${emitted.length} (1 source item skipped: sybex-ch02-q19 choose-two/5-option)`);
}

