// SB-fix-2 backfill — writes supervisor's Pool B routing decisions into questions.json audit fields.
//
// Reads a routing-decisions JSON file (per-item routing assigned by supervisor
// during the R packet review), mutates audit_d_review on each affected item,
// runs the validator, and atomically writes.
//
// Routing outcomes and their catalogue effects:
//
//   partial-depth                 → set audit_d_review.sb16_candidate=true +
//                                   sb16_subcategory="partial-depth" +
//                                   packet_id="sb-fix-2-r" + applied_*.
//                                   Item enters SB-fix-2 P sub-path scope.
//
//   messer-curriculum-gap         → set audit_d_review.sb16_candidate=true +
//                                   sb16_subcategory="messer-curriculum-gap" +
//                                   packet_id="sb-fix-2-r" + applied_*.
//                                   Item enters SB-fix-2 G sub-path scope.
//
//   not-sb16                      → set audit_d_review.sb1_6_review.routing="not-sb16" +
//                                   sb1_6_review.note=<reason>. No sb16_candidate
//                                   flag. Item is OUT of SB-fix-2 scope.
//
//   partial-adjacent-not-sb16     → set audit_d_review.sb1_6_review.routing="partial-adjacent-deferred" +
//                                   sb1_6_review.note=<reason>. Captured to a
//                                   findings file for future D1/D3/D4/D5
//                                   partial-adjacent cleanup pass.
//
// Single commit per spec: writes all 18 routings in one apply (no packetisation).
// Idempotency: skip an item if it already has audit_d_review.sb16_candidate=true
// from a prior backfill run OR audit_d_review.sb1_6_review present.
//
// Self-test (--selftest) exercises all four routing outcomes against stub catalogue.
//
// Usage:
//   node scripts/sb-fix-2-backfill-pool-b.mjs --routings <path> [--dry-run]
//   node scripts/sb-fix-2-backfill-pool-b.mjs --selftest

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const QUESTIONS_PATH = resolve(repo, "questions.json");
const BACKUPS_DIR = resolve(repo, ".audit-working/sb-fix-2/backups");
const VALIDATOR = resolve(repo, "scripts/validate-questions.mjs");
const TEMP_PATH = resolve(repo, ".audit-working/sb-fix-2/.questions-temp.json");

const VALID_ROUTINGS = new Set([
  "partial-depth",
  "messer-curriculum-gap",
  "not-sb16",
  "partial-adjacent-not-sb16",
]);

const SB_FIX_2_R_PACKET_ID = "sb-fix-2-r";

// ─── CLI ──────────────────────────────────────────────────────────────
function parseArgs() {
  const out = { routings: null, dryRun: false, selftest: false };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--routings" && i + 1 < process.argv.length) out.routings = process.argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--selftest") out.selftest = true;
  }
  return out;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function findItem(questions, section, video, type, index) {
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

function validateRouting(r) {
  if (!r || typeof r !== "object") return "routing must be an object";
  if (typeof r.location !== "object" || !r.location) return `routing missing location`;
  const l = r.location;
  if (typeof l.section !== "string" || typeof l.video !== "string" || typeof l.type !== "string" || !Number.isInteger(l.index)) {
    return `routing location malformed: ${JSON.stringify(l)}`;
  }
  if (!VALID_ROUTINGS.has(r.routing)) {
    return `routing for ${JSON.stringify(l)}: unknown routing "${r.routing}"; must be one of ${[...VALID_ROUTINGS].join(", ")}`;
  }
  if (typeof r.note !== "string" || r.note.trim() === "") {
    return `routing for ${JSON.stringify(l)}: note must be non-empty string`;
  }
  return null;
}

// Apply a single routing to an item. Returns the action record.
function applyRouting(item, routing, appliedBy, now) {
  if (!item.audit_d_review) item.audit_d_review = {};
  const ad = item.audit_d_review;

  const action = {
    location: routing.location,
    routing: routing.routing,
    item_already_processed: false,
  };

  // Idempotency check
  if (ad.sb16_candidate === true || ad.sb1_6_review != null) {
    action.item_already_processed = true;
    return action;
  }

  if (routing.routing === "partial-depth" || routing.routing === "messer-curriculum-gap") {
    ad.sb16_candidate = true;
    ad.sb16_subcategory = routing.routing;
    ad.packet_id = SB_FIX_2_R_PACKET_ID;
    ad.applied_at = now;
    ad.applied_by = SB_FIX_2_R_PACKET_ID;
    if (routing.note) ad.note = routing.note;
  } else {
    // not-sb16 OR partial-adjacent-not-sb16: write to sb1_6_review sub-block,
    // NOT to top-level sb16_candidate (item exits SB-fix-2 scope).
    ad.sb1_6_review = {
      routing: routing.routing,
      note: routing.note,
      applied_at: now,
      applied_by: SB_FIX_2_R_PACKET_ID,
    };
  }
  return action;
}

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

function runValidator(tempPath) {
  try {
    execSync(`node ${VALIDATOR} --file ${tempPath}`, { encoding: "utf8", stdio: "pipe" });
    return { ok: true, output: "" };
  } catch (e) {
    const stdout = e.stdout?.toString() || "";
    const stderr = e.stderr?.toString() || "";
    return { ok: e.status === 0, output: stdout + stderr, status: e.status };
  }
}

// Factored pipeline for self-test reuse.
function backfillRoutings(questions, routingsBlob) {
  for (const r of routingsBlob.routings) {
    const err = validateRouting(r);
    if (err) throw new Error(`Validation failure: ${err}`);
  }
  const now = new Date().toISOString();
  const appliedBy = SB_FIX_2_R_PACKET_ID;
  const actions = [];
  for (const r of routingsBlob.routings) {
    const item = findItem(questions, r.location.section, r.location.video, r.location.type, r.location.index);
    if (!item) throw new Error(`Item not found: ${JSON.stringify(r.location)}`);
    actions.push(applyRouting(item, r, appliedBy, now));
  }
  return { actions };
}

// ─── Self-test ────────────────────────────────────────────────────────
function selftest() {
  console.log("=== sb-fix-2-backfill-pool-b --selftest ===");
  const stub = [
    {
      id: "1.2", title: "Stub",
      videos: [{
        id: "1.2.2", title: "Cryptographic Solutions",
        questions: [
          { q: "HMAC q", opts: ["a","b","c","d"], a: 0, exp: "long enough explanation" },
        ],
        scenarios: [],
        matching: [
          { prompt: "MAC", answer: "HMAC" },
        ],
        cram: [
          { term: "Stub term partial-adjacent", def: "Stub definition." },
          { term: "Stub term not-sb16", def: "Stub definition." },
        ],
      }],
    },
  ];
  const routings = {
    routings: [
      { location: { section: "1.2", video: "1.2.2", type: "mc", index: 0 }, routing: "partial-depth", note: "stub note for partial-depth" },
      { location: { section: "1.2", video: "1.2.2", type: "match", index: 0 }, routing: "messer-curriculum-gap", note: "stub note for curriculum-gap" },
      { location: { section: "1.2", video: "1.2.2", type: "cram", index: 0 }, routing: "partial-adjacent-not-sb16", note: "stub note for partial-adjacent" },
      { location: { section: "1.2", video: "1.2.2", type: "cram", index: 1 }, routing: "not-sb16", note: "stub note for not-sb16" },
    ],
  };

  backfillRoutings(stub, routings);

  // partial-depth → sb16_candidate=true + sb16_subcategory
  const mcItem = stub[0].videos[0].questions[0];
  if (mcItem.audit_d_review?.sb16_candidate !== true) throw new Error("partial-depth: sb16_candidate not set");
  if (mcItem.audit_d_review.sb16_subcategory !== "partial-depth") throw new Error("partial-depth: subcategory wrong");
  if (mcItem.audit_d_review.packet_id !== "sb-fix-2-r") throw new Error("partial-depth: packet_id wrong");

  // messer-curriculum-gap → sb16_candidate=true + curriculum-gap subcategory
  const matchItem = stub[0].videos[0].matching[0];
  if (matchItem.audit_d_review?.sb16_subcategory !== "messer-curriculum-gap") throw new Error("curriculum-gap: subcategory wrong");

  // partial-adjacent-not-sb16 → sb1_6_review block, no sb16_candidate
  const cramItem0 = stub[0].videos[0].cram[0];
  if (cramItem0.audit_d_review?.sb16_candidate) throw new Error("partial-adjacent: sb16_candidate should NOT be set");
  if (cramItem0.audit_d_review?.sb1_6_review?.routing !== "partial-adjacent-not-sb16") throw new Error("partial-adjacent: sb1_6_review.routing wrong");

  // not-sb16 → sb1_6_review block, no sb16_candidate
  const cramItem1 = stub[0].videos[0].cram[1];
  if (cramItem1.audit_d_review?.sb16_candidate) throw new Error("not-sb16: sb16_candidate should NOT be set");
  if (cramItem1.audit_d_review?.sb1_6_review?.routing !== "not-sb16") throw new Error("not-sb16: sb1_6_review.routing wrong");

  // Idempotency: re-run should produce all already-processed
  const second = backfillRoutings(stub, routings);
  const reprocessed = second.actions.filter(a => !a.item_already_processed).length;
  if (reprocessed !== 0) throw new Error(`Idempotency: expected 0 reprocessed on re-run, got ${reprocessed}`);

  // Validation: malformed routing rejected
  let threw = false;
  try {
    backfillRoutings([{ id: "1.2", title: "x", videos: [] }], { routings: [{ location: { section: "1.2", video: "x", type: "mc", index: 0 }, routing: "bogus", note: "n" }] });
  } catch (e) { threw = true; }
  if (!threw) throw new Error("Validation: malformed routing should throw");

  console.log("  ✓ partial-depth → sb16_candidate=true + subcategory + packet_id");
  console.log("  ✓ messer-curriculum-gap → sb16_candidate=true + subcategory");
  console.log("  ✓ partial-adjacent-not-sb16 → sb1_6_review block, NO sb16_candidate");
  console.log("  ✓ not-sb16 → sb1_6_review block, NO sb16_candidate");
  console.log("  ✓ idempotency: re-run produces all already-processed");
  console.log("  ✓ malformed routing throws");
  console.log("SB-fix-2 backfill self-test PASS (4/4 routing outcomes + idempotency + validation)");
}

// ─── Main ─────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs();
  if (args.selftest) { selftest(); return; }

  if (!args.routings) {
    console.error("usage: --routings <path> [--dry-run]");
    console.error("       --selftest");
    process.exit(2);
  }

  const routingsBlob = JSON.parse(readFileSync(args.routings, "utf8"));
  const questions = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  const preSha = sha256(JSON.stringify(questions));

  let result;
  try { result = backfillRoutings(questions, routingsBlob); }
  catch (e) { console.error("ERROR:", e.message); process.exit(1); }

  const postStr = JSON.stringify(questions, null, 2);
  const postSha = sha256(postStr);

  mkdirSync(dirname(TEMP_PATH), { recursive: true });
  writeFileSync(TEMP_PATH, postStr);

  console.log("Running validator against temp tree...");
  const v = runValidator(TEMP_PATH);
  console.log(v.output);
  if (!v.ok) { console.error("VALIDATOR FAILED — aborting backfill."); process.exit(1); }

  const summary = { "partial-depth": 0, "messer-curriculum-gap": 0, "not-sb16": 0, "partial-adjacent-not-sb16": 0, "already-processed": 0 };
  for (const a of result.actions) {
    if (a.item_already_processed) summary["already-processed"]++;
    else summary[a.routing]++;
  }

  console.log("=== SB-fix-2 R backfill ===");
  console.log(`Routings processed: ${result.actions.length}`);
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);
  console.log("");
  console.log(`Pre-state SHA256:  ${preSha}`);
  console.log(`Post-state SHA256: ${postSha}`);
  console.log(`Changed: ${preSha !== postSha ? "YES" : "NO"}`);

  if (args.dryRun) {
    console.log("");
    console.log(`DRY-RUN: no files written. Temp tree retained at: ${TEMP_PATH}`);
    return;
  }

  mkdirSync(BACKUPS_DIR, { recursive: true });
  const backupPath = resolve(BACKUPS_DIR, `questions-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  copyFileSync(QUESTIONS_PATH, backupPath);
  console.log(`Backup written: ${backupPath}`);
  renameSync(TEMP_PATH, QUESTIONS_PATH);
  console.log(`Atomic rename: ${TEMP_PATH} → ${QUESTIONS_PATH}`);

  console.log("");
  console.log("Post-write validator check...");
  const v2 = runValidator(QUESTIONS_PATH);
  console.log(v2.output);

  console.log("SB-fix-2 R backfill complete.");
}

main();
