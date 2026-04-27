// Sub-batch 1: mechanical Pattern A length-tell fix.
//
// For each item that classifies as Pattern A under audit-length-tell-triaged.mjs
// criteria (clean separator + 30+ char suffix + 1-6 word concept-name prefix that
// passes all rejection filters), perform a content-preserving relocation:
//   - Replace the correct option with the prefix only
//   - Prepend the suffix to the existing explanation
//   - Capitalize the first letter of the suffix and ensure it ends in `.`
//   - Preserve all other fields: a index, distractors, citations, messerVideo, subObjective
//
// Naturally idempotent: after a fix, the option is just the prefix, which no
// longer contains a "separator + 30+ char suffix" structure. Re-runs find no
// Pattern A items to fix.
//
// Usage:
//   node scripts/fix-pattern-a-length-tells.mjs                # dry-run, summary + 10 random samples
//   node scripts/fix-pattern-a-length-tells.mjs --samples=20   # show more samples
//   node scripts/fix-pattern-a-length-tells.mjs --preview      # write fixed copy to /tmp for validator
//   node scripts/fix-pattern-a-length-tells.mjs --write        # mutate questions.json
//
// Pre-write quality gates (this script reports them; user reviews before --write):
//   1. Dry-run sample diffs
//   2. --preview + run validator on preview path
//   3. --preview + run audit-catalogue-quality on preview path

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-pattern-a-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");
const sampleCount = Number(args.find((a) => a.startsWith("--samples="))?.split("=")[1] ?? 10);

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

// Items explicitly held back from this batch, pending separate manual review.
// Each entry: { qid, reason }.
const HOLD_BACK = [
  { qid: "mc-5.5.1-1", reason: "Distractors discriminate from 'A formal declaration' alone, but suffix carries who/what definitional substance — flagged for manual review per Aiden's 2026-04-27 spec." },
];
const heldQids = new Set(HOLD_BACK.map((h) => h.qid));

// ─── Pattern A classification (mirrors audit-length-tell-triaged.mjs) ─────
const HIGH = 3.0;
const SENTENCE_START = /^(This|That|It|These|Those|There|When|If|Yes|No)\b/;
const SENTENCE_VERBS = / (is|are|was|were|have|has|had|can|could|will|would|should|must|may) /;
const IMPERATIVE_VERBS = /^(Investigate|Use|Apply|Restore|Notify|Establish|Deploy|Configure|Enable|Disable|Implement|Document|Maintain|Monitor|Detect|Identify|Analyze|Analyse|Report|Backup|Recover|Verify|Validate|Invoke|Engage|Trigger)\b/i;
const QUANTITY_WORDS = /\b(approximately|several|multiple|many|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;
const HAS_DIGIT = /\d/;
const VAGUE_CATEGORY = /^(critical|high|major|significant|serious|important|minor|low|moderate)\s+(risk|priority|issue|problem|concern|factor|failure|failures|gap|gaps|impact|level)$/i;
const BAD_PREFIX_END = /[.!?,;:\-–—]$/;

function classifyPatternA(item) {
  const opts = item.opts || [];
  if (opts.length !== 4) return null;
  const lens = opts.map((o) => (o || "").length);
  const mn = Math.min(...lens), mx = Math.max(...lens);
  if (mn === 0) return null;
  const ratio = mx / mn;
  if (ratio < HIGH) return null;
  const longestIdx = lens.indexOf(mx);
  if (item.a !== longestIdx) return null;
  const opt = opts[item.a];
  const emDash = " — ", colon = ": ";
  const emIdx = opt.indexOf(emDash), colIdx = opt.indexOf(colon);
  let sepIdx, sep;
  if (emIdx === -1 && colIdx === -1) return null;
  if (emIdx !== -1 && (colIdx === -1 || emIdx < colIdx)) { sepIdx = emIdx; sep = emDash; }
  else { sepIdx = colIdx; sep = colon; }
  const prefix = opt.slice(0, sepIdx).trim();
  const suffix = opt.slice(sepIdx + sep.length).trim();
  if (suffix.length < 30) return null;
  if (prefix.length < 5 || prefix.length > 60) return null;
  const wordCount = prefix.split(/\s+/).filter(Boolean).length;
  if (wordCount > 6) return null;
  if (IMPERATIVE_VERBS.test(prefix)) return null;
  if (HAS_DIGIT.test(prefix)) return null;
  if (QUANTITY_WORDS.test(prefix)) return null;
  if (VAGUE_CATEGORY.test(prefix)) return null;
  if (BAD_PREFIX_END.test(prefix)) return null;
  if (SENTENCE_START.test(prefix)) return null;
  if (SENTENCE_VERBS.test(" " + prefix.toLowerCase() + " ")) return null;
  // post-trim ratio (informational)
  const newLens = lens.slice();
  newLens[item.a] = prefix.length;
  const newRatio = Math.max(...newLens) / Math.min(...newLens);
  return { sep, prefix, suffix, newRatio, fixKind: newRatio < 2.0 ? "solo" : "combo", oldRatio: ratio };
}

// ─── Suffix → exp normalizer ──────────────────────────────────────────────
function normalizeSuffix(suffix) {
  let s = suffix.trim();
  // Capitalize first letter
  if (s.length > 0 && /[a-z]/.test(s[0])) s = s[0].toUpperCase() + s.slice(1);
  // Ensure terminal punctuation
  if (!/[.!?]$/.test(s)) s = s + ".";
  return s;
}

// ─── Walk and plan fixes ──────────────────────────────────────────────────
const plan = [];
for (const sec of data) {
  const domain = (sec.id || "?").split(".")[0];
  for (const vid of sec.videos || []) {
    const apply = (kind, list) => {
      list.forEach((q, i) => {
        const cls = classifyPatternA(q);
        if (!cls) return;
        const qid = `${kind}-${vid.id}-${i}`;
        if (heldQids.has(qid)) return;
        // Idempotency check: skip if exp already begins with the normalized suffix
        const normSuffix = normalizeSuffix(cls.suffix);
        const expHead = (q.exp || "").trim().slice(0, normSuffix.length);
        if (expHead === normSuffix) return;
        plan.push({
          domain, secId: sec.id, vidId: vid.id, kind, idx: i,
          qid: `${kind}-${vid.id}-${i}`,
          item: q,
          oldOpt: q.opts[q.a],
          newOpt: cls.prefix,
          oldExp: q.exp,
          newExp: normSuffix + " " + (q.exp || "").trim(),
          movedText: normSuffix,
          ...cls,
        });
      });
    };
    apply("mc", vid.questions || []);
    apply("scen", vid.scenarios || []);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────
const totalSolo = plan.filter((p) => p.fixKind === "solo").length;
const totalCombo = plan.filter((p) => p.fixKind === "combo").length;
const totalMC = plan.filter((p) => p.kind === "mc").length;
const totalScen = plan.filter((p) => p.kind === "scen").length;

console.log(`\nFix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Pattern A items to fix: ${plan.length}`);
console.log(`  ${totalSolo} solo + ${totalCombo} combo`);
console.log(`  ${totalMC} MC + ${totalScen} scenarios`);
console.log(`Per domain:`);
for (const d of ["1","2","3","4","5"]) {
  const n = plan.filter((p) => p.domain === d).length;
  if (n > 0) console.log(`  D${d}: ${n}`);
}
if (HOLD_BACK.length > 0) {
  console.log(`\nHELD BACK from this batch (${HOLD_BACK.length}):`);
  for (const h of HOLD_BACK) console.log(`  ${h.qid} — ${h.reason}`);
}

// ─── Sample diffs ─────────────────────────────────────────────────────────
console.log(`\n══ SAMPLE DIFFS (${Math.min(sampleCount, plan.length)} random items) ═════════════════════════════`);

// Deterministic "random" sample using stable shuffle on qid
function shuffle(arr, seed = 42) {
  const out = arr.slice();
  let r = seed;
  for (let i = out.length - 1; i > 0; i--) {
    r = (r * 9301 + 49297) % 233280;
    const j = Math.floor((r / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const samples = shuffle(plan).slice(0, sampleCount);
for (const p of samples) {
  console.log(`\n──── ${p.qid}  (D${p.domain}, ${p.fixKind}, ratio ${p.oldRatio.toFixed(2)}× → ${p.newRatio.toFixed(2)}×) ────`);
  console.log(`  citation: ${p.item.messerVideo} (${p.item.subObjective})`);
  console.log(`  STEM: ${p.item.q}`);
  console.log();
  console.log(`  OLD option (${p.oldOpt.length} chars):`);
  console.log(`    "${p.oldOpt}"`);
  console.log(`  NEW option (${p.newOpt.length} chars):`);
  console.log(`    "${p.newOpt}"`);
  console.log();
  console.log(`  OLD exp (${(p.oldExp || "").length} chars):`);
  console.log(`    "${p.oldExp}"`);
  console.log(`  NEW exp (${p.newExp.length} chars):`);
  console.log(`    "${p.newExp}"`);
}

// ─── Apply ────────────────────────────────────────────────────────────────
if (write || preview) {
  for (const p of plan) {
    p.item.opts[p.item.a] = p.newOpt;
    p.item.exp = p.newExp;
  }
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote ${plan.length} fixes to ${target}`);
  if (preview) {
    console.log(`\nNext steps to validate the preview:`);
    console.log(`  node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
    console.log(`  # quality audit against preview requires the audit script to support --path; skipping for now`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
