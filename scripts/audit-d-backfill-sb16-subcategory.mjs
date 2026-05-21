// One-off backfill: add sb16_subcategory to existing sb16-candidates.
//
// Established in SB-fix-1b packet 2 cluster verification (2026-05-21):
// the load-bearing distinction between sb16-candidate sub-types is
// umbrella-conceptual-fit between the tested technique and the cited
// video's taught content.
//
//   "partial-depth"          : cited video's umbrella concept
//                              conceptually contains the tested
//                              technique; technique absent from
//                              transcript (and may be absent corpus-
//                              wide). Spectre/Meltdown shape.
//   "messer-curriculum-gap"  : cited video's umbrella does NOT contain
//                              the tested technique — cited video is
//                              a sibling concept, not the parent.
//                              Integer overflow shape.
//
// All 10 SB-fix-1a sb16-candidates (locked in by supervisor verification
// during SB-fix-1a packets 1-3) are partial-depth under the umbrella-fit
// framing. Integer overflow (SB-fix-1b packet 2 #36/#37) introduces the
// first messer-curriculum-gap cases — those are written directly by
// sb-fix-1b-apply-packet.mjs at packet-2 apply time, not retrofitted here.
//
// This script:
//   1. Walks questions.json
//   2. Finds every item with audit_d_review.sb16_candidate === true
//      AND audit_d_review.sb16_subcategory absent
//   3. Sets sb16_subcategory = "partial-depth" on each
//   4. Validator-gates the result
//   5. Atomic-write with backup
//
// Idempotent: items that already have sb16_subcategory are skipped.
//
// Usage:
//   node scripts/audit-d-backfill-sb16-subcategory.mjs --dry-run
//   node scripts/audit-d-backfill-sb16-subcategory.mjs

import { readFileSync, writeFileSync, mkdirSync, renameSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const QUESTIONS_PATH = resolve(repo, "questions.json");
const BACKUPS_DIR = resolve(repo, ".audit-working/audit-d-sub-batch-1/backfill-backups");
const VALIDATOR = resolve(repo, "scripts/validate-questions.mjs");
const TEMP_PATH = resolve(repo, ".audit-working/audit-d-sub-batch-1/.questions-backfill-temp.json");

const args = { dryRun: process.argv.includes("--dry-run") };

const raw = readFileSync(QUESTIONS_PATH, "utf8");
const preSha = createHash("sha256").update(raw).digest("hex");
const questions = JSON.parse(raw);

const touched = [];
const skipped = [];
for (const sec of questions) {
  for (const vid of sec.videos) {
    const arrs = [
      ["mc",    vid.questions  || []],
      ["scen",  vid.scenarios  || []],
      ["match", vid.matching   || []],
      ["cram",  vid.cram       || []],
    ];
    for (const [type, arr] of arrs) {
      arr.forEach((item, idx) => {
        const r = item.audit_d_review;
        if (!r || r.sb16_candidate !== true) return;
        const loc = `§${sec.id} ${vid.id} ${type}[${idx}]`;
        if (r.sb16_subcategory) {
          skipped.push({ loc, existing: r.sb16_subcategory });
          return;
        }
        r.sb16_subcategory = "partial-depth";
        touched.push({ loc, packet_id: r.packet_id, note_head: (r.note || "").slice(0, 60) });
      });
    }
  }
}

console.log("=== sb16_subcategory backfill ===");
console.log(`Mode: ${args.dryRun ? "DRY-RUN" : "REAL"}`);
console.log(`Items touched: ${touched.length}`);
console.log(`Items skipped (already had sb16_subcategory): ${skipped.length}`);
console.log("");
console.log("Touched:");
for (const t of touched) {
  console.log(`  ${t.loc.padEnd(28)}  ${t.packet_id}  set sb16_subcategory="partial-depth"`);
  console.log(`    note: ${t.note_head}...`);
}
if (skipped.length) {
  console.log("");
  console.log("Skipped:");
  for (const s of skipped) {
    console.log(`  ${s.loc}  already had sb16_subcategory="${s.existing}"`);
  }
}

if (touched.length === 0) {
  console.log("");
  console.log("No items to backfill. Exiting with no write.");
  process.exit(0);
}

// Write temp + validate
mkdirSync(dirname(TEMP_PATH), { recursive: true });
writeFileSync(TEMP_PATH, JSON.stringify(questions, null, 2));

console.log("");
console.log("Running validator against temp tree...");
let validatorExit = 0;
try {
  const out = execSync(`node "${VALIDATOR}" --path="${TEMP_PATH}" --quiet`, { encoding: "utf8" });
  console.log(out.trim());
} catch (e) {
  console.log(((e.stdout || "") + (e.stderr || "")).trim());
  validatorExit = e.status || 1;
}
console.log(`Validator exit: ${validatorExit}`);
if (validatorExit !== 0) {
  console.error("VALIDATOR FAILED — halting before write.");
  process.exit(1);
}

const postSha = createHash("sha256").update(JSON.stringify(questions, null, 2)).digest("hex");
console.log("");
console.log(`Pre-state  SHA256: ${preSha}`);
console.log(`Post-state SHA256: ${postSha}`);
console.log(`Changed: ${preSha !== postSha ? "YES" : "NO"}`);

if (args.dryRun) {
  console.log("");
  console.log("DRY-RUN: no files written. Temp tree retained at:", TEMP_PATH);
  process.exit(0);
}

// Real apply
mkdirSync(BACKUPS_DIR, { recursive: true });
const backupPath = resolve(BACKUPS_DIR, `questions-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
copyFileSync(QUESTIONS_PATH, backupPath);
console.log("");
console.log(`Backup written: ${backupPath}`);
renameSync(TEMP_PATH, QUESTIONS_PATH);
console.log(`Atomic rename → ${QUESTIONS_PATH}`);

console.log("");
console.log("Post-write validator check...");
try {
  const out = execSync(`node "${VALIDATOR}" --quiet`, { encoding: "utf8" });
  console.log(out.trim());
} catch (e) {
  console.error("POST-WRITE VALIDATOR FAILED");
  console.error(((e.stdout || "") + (e.stderr || "")).trim());
  console.error("Restore from backup:", backupPath);
  process.exit(1);
}

console.log("");
console.log("Backfill complete.");
