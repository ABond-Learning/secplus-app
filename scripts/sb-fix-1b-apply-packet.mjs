// SB-fix-1b apply script — applies packet decisions to questions.json (match + cram).
//
// Reads a packet decisions JSON (per-item Aiden choices) plus the packet
// shadow JSON (parser output / item locations / current citations), produces
// in-memory mutations to questions.json, validates, and either writes
// atomically (real apply) or prints a diff preview (dry-run).
//
// Mirror of sb-fix-1a-apply-packet.mjs but writes to video.matching[i] /
// video.cram[i] instead of video.questions[i] / video.scenarios[i]. The
// per-item override fields (messerVideo + subObjective + audit_d_review)
// were added to MatchItem + CramTerm in SB-fix-1b-prep (c1664c0).
//
// Decision types:
//   accept-primary       : set messerVideo from shadow.parsed_destinations[0]
//                          set subObjective from "X.Y" prefix
//   accept-alternate     : explicit to_messerVideo + to_subObjective from decisions
//   manual               : explicit to_messerVideo + to_subObjective from decisions
//   reject               : no item edit; audit_d_review.kept_as_is = true
//   keep-as-is-sb16-cand : no item edit; audit_d_review.kept_as_is = true +
//                          sb16_candidate = true (sibling-aware partial-depth path)
//
// Special handling: if a resolved to_messerVideo equals the item's effective
// current citation (per-item override OR inherited parent), demote to
// "reject-via-self-alternate" — same effect as reject but preserves the audit
// trail of what Aiden actually chose. Because match/cram items typically
// inherit from parent, the self-alternate comparison falls back to the parent
// citation when no per-item override exists.
//
// Idempotency: an item with audit_d_review.packet_id matching this run's
// packet is skipped (this packet's decisions already applied to it).
//
// Backup: before any write, copy current questions.json to
// .audit-working/sb-fix-1b/backups/questions-{ISO timestamp}.json.
//
// Validator: runs scripts/validate-questions.mjs against the in-memory result
// via a temp file. Halts (exit 1) if errors > 0; warns are informational.
// The validator's checkCitation() helper now covers MatchItem + CramTerm
// (added in SB-fix-1b-prep, c1664c0).
//
// Usage:
//   node scripts/sb-fix-1b-apply-packet.mjs --decisions <path> --dry-run
//   node scripts/sb-fix-1b-apply-packet.mjs --decisions <path>

import { readFileSync, writeFileSync, mkdirSync, renameSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const QUESTIONS_PATH = resolve(repo, "questions.json");
const BACKUPS_DIR = resolve(repo, ".audit-working/sb-fix-1b/backups");
const VALIDATOR = resolve(repo, "scripts/validate-questions.mjs");

// ─── Audit-trail vocabulary (constants, not magic strings) ────────────
//
// Same vocabulary as SB-fix-1a so SB-fix-2 review tooling can filter
// audit_d_review uniformly across mc/scen/match/cram items.
const AUDIT_FIELD_SB16_CANDIDATE = "sb16_candidate";
const AUDIT_FIELD_SB16_SUBCATEGORY = "sb16_subcategory";
const AUDIT_FIELD_KEPT_AS_IS = "kept_as_is";
const AUDIT_FIELD_RESOLVED_SELF_ALT = "resolved_self_alternate";
const DECISION_KEPT_AS_IS = "kept-as-is";
const DECISION_SB16_CANDIDATE = "keep-as-is-sb16-candidate";
const VALID_SB16_SUBCATEGORIES = new Set(["partial-depth", "messer-curriculum-gap"]);

// ─── CLI ───────────────────────────────────────────────────────────────
function parseArgs() {
  const out = { decisions: null, dryRun: false };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--decisions" && i + 1 < process.argv.length) out.decisions = process.argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
  }
  if (!out.decisions) {
    console.error("usage: --decisions <path-to-packet-N-decisions.json> [--dry-run]");
    process.exit(2);
  }
  return out;
}
const args = parseArgs();

// ─── Load inputs ───────────────────────────────────────────────────────
const decisionsPath = resolve(args.decisions);
const decisionsDoc = JSON.parse(readFileSync(decisionsPath, "utf8"));
const packetId = `packet-${decisionsDoc.packet}`;
const shadowPath = resolve(dirname(decisionsPath), `packet-${decisionsDoc.packet}.json`);
const shadow = JSON.parse(readFileSync(shadowPath, "utf8"));

const questionsRaw = readFileSync(QUESTIONS_PATH, "utf8");
const preStateSha = createHash("sha256").update(questionsRaw).digest("hex");
const questions = JSON.parse(questionsRaw);

// ─── Helpers ───────────────────────────────────────────────────────────
function findItem(section, video, type, index) {
  const sec = questions.find(s => s.id === section);
  if (!sec) return null;
  const vid = sec.videos.find(v => v.id === video);
  if (!vid) return null;
  const arr =
    type === "match" ? vid.matching :
    type === "cram"  ? vid.cram     : null;
  if (!arr) return null;
  return { item: arr[index], parentVideoTitle: vid.title, parentSection: sec.id };
}

function deriveSubObjective(messerVideo) {
  // "X.Y - Title" → "X.Y"
  const m = messerVideo.match(/^(\d+\.\d+(?:\.\d+)?)\s*-/);
  return m ? m[1] : null;
}

function shadowFor(packetIndex) {
  return shadow.items.find(it => it.packet_index === packetIndex);
}

// Effective current citation for self-alternate detection. Match/cram items
// usually inherit from the parent video — so when there's no per-item
// override, compare against the parent's citation.
function effectiveCurrentCitation(item, parentSection, parentVideoTitle) {
  if (item.messerVideo) return item.messerVideo;
  return `${parentSection} - ${parentVideoTitle}`;
}

// ─── Resolve each decision into a concrete action ─────────────────────
const actions = [];
const skipped = [];
const reviewedAt = new Date().toISOString();

for (const dec of decisionsDoc.decisions) {
  const sh = shadowFor(dec.packet_index);
  if (!sh) {
    console.error(`ERROR: packet_index ${dec.packet_index} not found in shadow`);
    process.exit(1);
  }
  const loc = sh.location;
  const located = findItem(loc.section, loc.video, loc.type, loc.index);
  if (!located || !located.item) {
    console.error(`ERROR: item ${loc.section}/${loc.video} ${loc.type}[${loc.index}] not found in questions.json`);
    process.exit(1);
  }
  const item = located.item;

  // Idempotency: skip if this packet already applied
  if (item.audit_d_review?.packet_id === packetId) {
    skipped.push({ packet_index: dec.packet_index, loc, reason: `audit_d_review.packet_id === ${packetId} (already applied)` });
    continue;
  }

  // Resolve to action
  let toMesser = null, toSubObj = null, decisionType = dec.decision_type;
  let auditExtra = {};

  if (decisionType === "accept-primary") {
    if (!sh.parsed_destinations || sh.parsed_destinations.length === 0) {
      console.error(`ERROR: #${dec.packet_index} decision=accept-primary but shadow has no parsed_destinations`);
      process.exit(1);
    }
    toMesser = sh.parsed_destinations[0];
    toSubObj = deriveSubObjective(toMesser);
  } else if (decisionType === "accept-alternate" || decisionType === "manual") {
    toMesser = dec.to_messerVideo;
    toSubObj = dec.to_subObjective;
  } else if (decisionType === "reject") {
    auditExtra[AUDIT_FIELD_KEPT_AS_IS] = true;
    if (dec.note) auditExtra.note = dec.note;
  } else if (decisionType === DECISION_SB16_CANDIDATE) {
    auditExtra[AUDIT_FIELD_KEPT_AS_IS] = true;
    auditExtra[AUDIT_FIELD_SB16_CANDIDATE] = true;
    // sb16_subcategory routes SB-fix-2 resolution per the umbrella-conceptual-
    // fit framing in SCHEMA.md (added 2026-05-21, 12deabc):
    //   "partial-depth"         → cited video's umbrella subsumes the
    //                             tested technique; technique absent from
    //                             transcript
    //   "messer-curriculum-gap" → cited video is a sibling concept; tested
    //                             technique has no umbrella home anywhere in
    //                             Messer's corpus
    // Required on every sb16-candidate decision from packet 2 onward
    // (existing SB-fix-1a candidates were retrofitted via
    // audit-d-backfill-sb16-subcategory.mjs in 6f796f7).
    if (!dec.sb16_subcategory) {
      console.error(`ERROR: #${dec.packet_index} decision=keep-as-is-sb16-candidate but missing sb16_subcategory`);
      console.error(`       must be one of: ${[...VALID_SB16_SUBCATEGORIES].join(", ")}`);
      process.exit(1);
    }
    if (!VALID_SB16_SUBCATEGORIES.has(dec.sb16_subcategory)) {
      console.error(`ERROR: #${dec.packet_index} unknown sb16_subcategory: "${dec.sb16_subcategory}"`);
      console.error(`       must be one of: ${[...VALID_SB16_SUBCATEGORIES].join(", ")}`);
      process.exit(1);
    }
    auditExtra[AUDIT_FIELD_SB16_SUBCATEGORY] = dec.sb16_subcategory;
    auditExtra.note = dec.note || "concept-here-but-not-this-exact-term pattern (SB1.6); review during SB-fix-2";
  } else {
    console.error(`ERROR: #${dec.packet_index} unknown decision_type: ${decisionType}`);
    process.exit(1);
  }

  // Self-alternate detection (resolved target equals effective current citation).
  // For match/cram, "current" usually means the inherited parent video. The
  // primary decision_type field reflects ACTUAL EFFECT ("kept-as-is"), not
  // original intent. Original decision_type is preserved in `original_decision`.
  // resolved_self_alternate stays as a hard flag for query tooling.
  const effectiveCurrent = effectiveCurrentCitation(item, located.parentSection, located.parentVideoTitle);
  let resolvedSelfAlternate = false;
  let originalDecisionForAudit = null;
  if (toMesser && toMesser === effectiveCurrent) {
    resolvedSelfAlternate = true;
    originalDecisionForAudit = dec.decision_type;
    decisionType = DECISION_KEPT_AS_IS;
    auditExtra[AUDIT_FIELD_KEPT_AS_IS] = true;
    auditExtra.note = `${dec.decision_type} target equals effective current citation; treated as kept-as-is via self-alternate (no edit applied)`;
    toMesser = null;
    toSubObj = null;
  }

  actions.push({
    packet_index: dec.packet_index,
    loc,
    item, // reference into the in-memory questions tree
    parent_video_title: located.parentVideoTitle,
    parent_section: located.parentSection,
    from_messerVideo: item.messerVideo || null,
    from_subObjective: item.subObjective || null,
    effective_current: effectiveCurrent,
    to_messerVideo: toMesser,
    to_subObjective: toSubObj,
    decision_type_recorded: decisionType,
    original_decision: originalDecisionForAudit,
    resolved_self_alternate: resolvedSelfAlternate,
    auditExtra,
    parsed_destinations: sh.parsed_destinations || [],
  });
}

// ─── Apply actions in memory ──────────────────────────────────────────
for (const act of actions) {
  if (act.to_messerVideo && act.to_subObjective) {
    act.item.messerVideo = act.to_messerVideo;
    act.item.subObjective = act.to_subObjective;
  }
  act.item.audit_d_review = {
    reviewed_at: reviewedAt,
    packet_id: packetId,
    decision_type: act.decision_type_recorded,
    ...(act.original_decision ? { original_decision: act.original_decision } : {}),
    ...(act.resolved_self_alternate ? { [AUDIT_FIELD_RESOLVED_SELF_ALT]: true } : {}),
    // Match/cram items typically had no per-item citation prior to SB-fix-1b;
    // record the effective-current (inherited parent) so the audit trail is
    // complete. from_messerVideo + from_subObjective preserved when they
    // actually existed as overrides.
    ...(act.from_messerVideo ? { from_messerVideo: act.from_messerVideo } : { inherited_from_parent: act.effective_current }),
    ...(act.from_subObjective ? { from_subObjective: act.from_subObjective } : {}),
    ...(act.to_messerVideo ? { to_messerVideo: act.to_messerVideo } : {}),
    ...(act.to_subObjective ? { to_subObjective: act.to_subObjective } : {}),
    ...act.auditExtra,
  };
}

// ─── Write to temp + run validator ────────────────────────────────────
const tempPath = resolve(repo, ".audit-working/sb-fix-1b/.questions-temp.json");
mkdirSync(dirname(tempPath), { recursive: true });
writeFileSync(tempPath, JSON.stringify(questions, null, 2));

console.log("Running validator against temp tree...");
let validatorOutput = "";
let validatorExit = 0;
try {
  validatorOutput = execSync(`node "${VALIDATOR}" --path="${tempPath}" --quiet`, { encoding: "utf8" });
} catch (e) {
  validatorOutput = (e.stdout || "") + (e.stderr || "");
  validatorExit = e.status || 1;
}
console.log(validatorOutput.trim());
console.log(`Validator exit: ${validatorExit}`);
if (validatorExit !== 0) {
  console.error("VALIDATOR FAILED — halting before write. Temp tree at:", tempPath);
  process.exit(1);
}

// ─── Diff preview ──────────────────────────────────────────────────────
console.log("");
console.log(`=== SB-fix-1b apply ${args.dryRun ? "DRY-RUN" : "REAL"} — ${packetId} ===`);
console.log(`Decisions in packet: ${decisionsDoc.decisions.length}`);
console.log(`Actions resolved:    ${actions.length}`);
console.log(`Skipped (already applied): ${skipped.length}`);
console.log("");
// Concept label for cluster-view rollup, derived programmatically from
// item.term (cram) / item.answer (match) — never hand-annotated. Fixes the
// packet-1 dry-run preview drift where hand-written labels at indices 1-3 of
// §2.2.3 (Brand impersonation / BEC / Typosquatting) got shifted into the
// wrong rows. Source-of-truth is the catalogue itself.
function conceptLabel(item, type) {
  if (type === "cram") return item.term || "?";
  if (type === "match") return item.answer || "?";
  return "?";
}

console.log("Per-item diff:");
const byType = { edit: 0, "kept-as-is (self-alternate)": 0, "kept-as-is (reject)": 0, "sb16-candidate": 0 };
for (const act of actions) {
  const locStr = `§${act.loc.section} ${act.loc.video} ${act.loc.type}[${act.loc.index}]`;
  const label = conceptLabel(act.item, act.loc.type);
  if (act.resolved_self_alternate) {
    byType["kept-as-is (self-alternate)"]++;
    console.log(`  #${String(act.packet_index).padStart(2)} ${locStr}  "${label}"  KEPT-AS-IS via SELF-ALTERNATE  (original=${act.original_decision}; target=effective-current=${act.effective_current})`);
  } else if (act.decision_type_recorded === DECISION_SB16_CANDIDATE) {
    byType["sb16-candidate"]++;
    const subcat = act.auditExtra?.[AUDIT_FIELD_SB16_SUBCATEGORY] || "(unset)";
    console.log(`  #${String(act.packet_index).padStart(2)} ${locStr}  "${label}"  SB16-CANDIDATE  subcategory=${subcat}  (no edit; flagged for SB-fix-2)`);
  } else if (act.decision_type_recorded === "reject") {
    byType["kept-as-is (reject)"]++;
    console.log(`  #${String(act.packet_index).padStart(2)} ${locStr}  "${label}"  REJECT  (no edit; kept_as_is=true)`);
  } else {
    byType.edit++;
    console.log(`  #${String(act.packet_index).padStart(2)} ${locStr}  "${label}"  EDIT  ${act.decision_type_recorded}`);
    const fromLabel = act.from_messerVideo ? `"${act.from_messerVideo}" / ${act.from_subObjective}` : `(inherits parent: ${act.effective_current})`;
    console.log(`      from: ${fromLabel}`);
    console.log(`      to:   "${act.to_messerVideo}" / ${act.to_subObjective}`);
  }
}
console.log("");
console.log("Summary by action type:");
for (const [k, n] of Object.entries(byType)) console.log(`  ${k.padEnd(30)}: ${n}`);

// Cluster-view rollup: group items by source parent video and target. This
// replaces the hand-annotated cluster-view that drifted in packet-1's dry-run
// preview. Source-of-truth is `act` (script-resolved) plus catalogue labels.
console.log("");
console.log("Cluster-view rollup (source parent → destination):");
const clusters = new Map();
for (const act of actions) {
  if (act.resolved_self_alternate || act.decision_type_recorded === DECISION_SB16_CANDIDATE || act.decision_type_recorded === "reject") continue;
  const key = `${act.parent_section} - ${act.parent_video_title}  →  ${act.to_messerVideo}`;
  if (!clusters.has(key)) clusters.set(key, []);
  clusters.get(key).push(act);
}
const sortedClusterKeys = [...clusters.keys()].sort();
for (const key of sortedClusterKeys) {
  const items = clusters.get(key);
  console.log(`  ${key}  (${items.length} item${items.length === 1 ? "" : "s"})`);
  for (const act of items) {
    const label = conceptLabel(act.item, act.loc.type);
    console.log(`    - #${String(act.packet_index).padStart(2)} ${act.loc.type}[${act.loc.index}]  "${label}"`);
  }
}
console.log("");
console.log(`Pre-state SHA256: ${preStateSha}`);
const postStateSha = createHash("sha256").update(JSON.stringify(questions, null, 2)).digest("hex");
console.log(`Post-state SHA256: ${postStateSha}`);
console.log(`Changed: ${preStateSha !== postStateSha ? "YES" : "NO"}`);

if (args.dryRun) {
  console.log("");
  console.log("DRY-RUN: no files written. Temp tree retained at:", tempPath);
  process.exit(0);
}

// ─── Real apply: backup + atomic rename ───────────────────────────────
mkdirSync(BACKUPS_DIR, { recursive: true });
const backupName = `questions-${reviewedAt.replace(/[:.]/g, "-")}.json`;
const backupPath = resolve(BACKUPS_DIR, backupName);
copyFileSync(QUESTIONS_PATH, backupPath);
console.log("");
console.log(`Backup written: ${backupPath}`);

renameSync(tempPath, QUESTIONS_PATH);
console.log(`Atomic rename: ${tempPath} → ${QUESTIONS_PATH}`);

// Post-write validator paranoia check
console.log("");
console.log("Post-write validator check...");
try {
  const postOut = execSync(`node "${VALIDATOR}" --quiet`, { encoding: "utf8" });
  console.log(postOut.trim());
} catch (e) {
  console.error("POST-WRITE VALIDATOR FAILED — questions.json may be in a bad state");
  console.error((e.stdout || "") + (e.stderr || ""));
  console.error("Restore from backup:", backupPath);
  process.exit(1);
}

console.log("");
console.log(`SB-fix-1b ${packetId} apply complete.`);
