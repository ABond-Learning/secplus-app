// One-shot applier: append 5 §1.2.5 Zero Trust questions to questions.json.
// 4 MCs + 1 scenario covering NIST SP 800-207 component identification
// (PE / PA / PEP). Driven by TODO-content-quality.md Section 3 §1.2 — three
// practice-test misses across cybersecuritytrail.com 071825 q#5/q#8 and
// 090125 q#4 on 2026-04-30.
//
// Per CLAUDE.md rule 8: items are authored in natural option order
// (`authorA` = the position the author wrote the correct option in), and
// the script computes the final `a` deterministically via
// sha256(videoId + ":" + kind + ":" + insertionIdx) mod 4. If the hash
// target differs from the author position, opts[authorA] and opts[target]
// are swapped before the item is appended. This mirrors
// scripts/shuffle-correct-positions.mjs's mechanism so the position
// distribution stays uniform across the catalogue.
//
// Idempotent: detects already-appended items by stem-prefix match and skips.
// End-of-array insertion only — preserves SM-2 keys for existing items.
//
// Usage:
//   node scripts/add-zero-trust-batch.mjs              # dry-run summary, no writes
//   node scripts/add-zero-trust-batch.mjs --preview    # write preview to /tmp/
//   node scripts/add-zero-trust-batch.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-zt-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

// ─── Hash-based correct-answer target (CLAUDE.md rule 8) ──────────────────
function targetFor(videoId, kind, idx) {
  const h = createHash("sha256").update(`${videoId}:${kind}:${idx}`).digest();
  return h.readUInt32BE(0) % 4;
}

// ─── INSERTIONS (author-natural order; positions hash-shuffled at apply) ──
//
// Each entry is one item to append. `authorA` is the index at which the
// author wrote the correct option in `opts`; the apply phase computes the
// final `a` from the hash and swaps opts[authorA] ↔ opts[target] if they
// differ. The Sub-batch-2 conventions (length ≤1.5× ratio, plausible-AND-
// false rule) are pre-checked on the author-order options; swapping two
// positions is text-preserving and doesn't disturb either.
//
// Citation: messerVideo "1.2 - Zero Trust" verified against MESSER_VIDEOS.md.
// subObjective "1.2" matches the existing 1.2.5 catalogue convention
// (parent objective; CLAUDE.md rule 2 permits parent-tagging when uncertain).
const INSERTIONS = [
  // ───── Q1 — PEP component ID with concrete device ─────
  {
    videoId: "1.2.5",
    kind: "mc",
    q: "In a Zero Trust architecture following NIST SP 800-207, an identity-aware proxy that inspects each user request and either permits or blocks the connection is acting as which component?",
    opts: [
      "Policy Enforcement Point (PEP) — it sits inline with the traffic and enforces the access decision",
      "Policy Engine (PE) — it generates the trust score that drives the access decision",
      "Policy Administrator (PA) — it issues the session token after the decision is made",
      "Resource server — it hosts the application the request is destined for",
    ],
    authorA: 0,
    exp: "An identity-aware proxy that allows or denies traffic in real time is the PEP — it sits on the data plane. The PE makes the decision; the PA communicates it; the proxy enforces it. The resource server is what the PEP is protecting, not the enforcement point itself.",
    messerVideo: "1.2 - Zero Trust",
    subObjective: "1.2",
  },

  // ───── Q2 — PE component ID (positive test) ─────
  {
    videoId: "1.2.5",
    kind: "mc",
    q: "In a Zero Trust architecture, the component that evaluates context — including device posture, user identity, and threat intelligence — to produce an allow-or-deny decision is the:",
    opts: [
      "Policy Enforcement Point (PEP) — it sits inline with traffic and applies whatever decision was made",
      "Policy Engine (PE) — it consults the trust algorithm to decide whether the request should be granted",
      "Policy Administrator (PA) — it issues a session credential after the decision has been reached",
      "Resource Server — it hosts the protected data the subject is trying to access",
    ],
    authorA: 1,
    exp: "The PE is the brain of Zero Trust: it consumes signals (identity, device posture, threat intel) and consults the trust algorithm. The PA acts on the PE's decision by issuing a session credential; the PEP enforces it on traffic; the resource server is what the PEP is protecting.",
    messerVideo: "1.2 - Zero Trust",
    subObjective: "1.2",
  },

  // ───── Q3 — PE vs PEP forced discrimination (with AAA-vs-ZT addendum) ─────
  {
    videoId: "1.2.5",
    kind: "mc",
    q: "In a NIST SP 800-207 Zero Trust deployment, which statement BEST distinguishes the Policy Engine from the Policy Enforcement Point?",
    opts: [
      "The Policy Engine decides whether to grant access; the Policy Enforcement Point applies that decision to live traffic",
      "The Policy Engine sits inline with traffic; the Policy Enforcement Point lives in the control plane",
      "The Policy Engine and Policy Enforcement Point are interchangeable terms for the same component",
      "The Policy Engine handles authentication; the Policy Enforcement Point handles authorization",
    ],
    authorA: 0,
    exp: "PE = decision; PEP = enforcement. PE lives on the control plane and consults the trust algorithm; PEP lives on the data plane and applies the verdict to live traffic. Crucially, neither replaces authentication or authorization — Zero Trust is an architecture for HOW access decisions are made and enforced, not the AAA process itself. The PE consumes signals (after authn), produces an authorization decision, and the PEP enforces it.",
    messerVideo: "1.2 - Zero Trust",
    subObjective: "1.2",
  },

  // ───── Q4 — PA's specific role (NIST-leaning grounding flagged in proposal) ─────
  {
    videoId: "1.2.5",
    kind: "mc",
    q: "In a Zero Trust architecture, what is the specific role of the Policy Administrator (PA)?",
    opts: [
      "Inspecting each request against firewall and proxy rules and blocking disallowed traffic",
      "Evaluating user identity, device posture, and contextual signals to compute a trust score",
      "Communicating the Policy Engine's decision to the enforcement point and issuing or revoking the session credential",
      "Storing the protected data and serving it to subjects after authorization succeeds",
    ],
    authorA: 2,
    exp: "PA bridges the PE's decision and the PEP's enforcement: once the PE says 'allow,' the PA generates a session-specific credential or token, hands it to the PEP, and tracks the session. When trust changes mid-session, PA revokes the credential. The PA's role is most clearly articulated in NIST SP 800-207; some Zero Trust framings collapse PA into PE on the control plane.",
    messerVideo: "1.2 - Zero Trust",
    subObjective: "1.2",
  },

  // ───── Q5 — Multi-component scenario (component-ID in context) ─────
  {
    videoId: "1.2.5",
    kind: "scen",
    q: "An IT architect is implementing Zero Trust at a financial services firm. The team deploys a SIEM that ingests endpoint telemetry, identity provider events, and threat intelligence feeds; an existing reverse proxy at the application edge is configured to consult an internal API before forwarding any HTTP request, and a small service tracks active sessions and revokes their tokens when a device's compliance status changes. In NIST SP 800-207 terms, which mapping is correct?",
    opts: [
      "SIEM/risk feeds → Policy Engine inputs; reverse proxy → Policy Enforcement Point; session-token service → Policy Administrator",
      "Reverse proxy → Policy Engine; SIEM → Policy Enforcement Point; session-token service → resource server",
      "All three are different views of the Policy Engine — NIST 800-207 treats the control plane as a single PE",
      "Reverse proxy → Policy Administrator; SIEM → Policy Engine; session-token service → Policy Enforcement Point",
    ],
    authorA: 0,
    exp: "The SIEM feeds risk signals into the PE's trust algorithm; the PE produces the decision. The reverse proxy sits inline with HTTP traffic and applies the decision — that's the PEP. The session-token service that issues and revokes credentials is the PA, the bridge between PE decisions and PEP enforcement. NIST 800-207 explicitly splits the control plane into PE and PA; collapsing them or swapping the planes is the most common student error.",
    messerVideo: "1.2 - Zero Trust",
    subObjective: "1.2",
  },
];

// ─── Apply ────────────────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const videoById = new Map();
for (const section of data) {
  for (const video of section.videos) videoById.set(video.id, video);
}

let added = 0;
let skipped = 0;
const planRows = []; // for dry-run summary

for (const ins of INSERTIONS) {
  const video = videoById.get(ins.videoId);
  if (!video) {
    console.error(`ERROR: video ${ins.videoId} not found`);
    process.exit(1);
  }
  const targetList = ins.kind === "mc"
    ? (video.questions = video.questions || [])
    : (video.scenarios = video.scenarios || []);

  // Idempotency check: stem-prefix match against existing items
  const stemHead = ins.q.slice(0, 60);
  const already = targetList.some((q) => typeof q.q === "string" && q.q.startsWith(stemHead));
  if (already) {
    console.log(`skip   ${ins.videoId} ${ins.kind}: already has "${stemHead}..."`);
    skipped++;
    continue;
  }

  // Insertion index = current array length (end-of-array push).
  const insertionIdx = targetList.length;
  const targetA = targetFor(ins.videoId, ins.kind, insertionIdx);

  // Apply hash-based position assignment: swap opts[authorA] ↔ opts[targetA]
  // if needed, then set `a = targetA`. Single-swap mechanism mirrors
  // scripts/shuffle-correct-positions.mjs.
  const opts = ins.opts.slice();
  if (ins.authorA !== targetA) {
    [opts[ins.authorA], opts[targetA]] = [opts[targetA], opts[ins.authorA]];
  }

  const item = {
    q: ins.q,
    opts,
    a: targetA,
    exp: ins.exp,
    messerVideo: ins.messerVideo,
    subObjective: ins.subObjective,
  };

  targetList.push(item);
  planRows.push({
    videoId: ins.videoId,
    kind: ins.kind,
    insertionIdx,
    authorA: ins.authorA,
    targetA,
    swapped: ins.authorA !== targetA,
    stemHead,
    correctText: opts[targetA],
  });
  added++;
}

console.log(`\nZero Trust batch — apply plan`);
console.log(`================================`);
for (const r of planRows) {
  const swapTag = r.swapped ? `swap ${r.authorA}→${r.targetA}` : `no-op (authorA=${r.targetA})`;
  console.log(`  ${r.kind}-${r.videoId}-${r.insertionIdx}  ${swapTag}`);
  console.log(`    Q: ${r.stemHead}…`);
  console.log(`    correct now at [${r.targetA}]: ${r.correctText.slice(0, 90)}${r.correctText.length > 90 ? "…" : ""}`);
}
console.log(`\n${added} appended, ${skipped} skipped.`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${jsonPath}`);
} else if (preview) {
  writeFileSync(previewPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote preview to ${previewPath}`);
  console.log(`Run validator on preview:`);
  console.log(`  node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
} else {
  console.log("(dry run — pass --preview to write to /tmp, --write to persist to questions.json)");
}
