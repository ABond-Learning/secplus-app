// One-shot applier: append 5 §1.1 Control Categories vs Control Types
// items to questions.json. 4 MCs + 1 scenario covering CompTIA SY0-701
// 1.1's two orthogonal axes: Categories (Managerial / Operational /
// Technical / Physical) and Types (Preventive / Deterrent / Detective /
// Corrective / Compensating / Directive). Driven by TODO-content-quality.md
// Section 3 §1.1 — three practice-test misses on cybersecuritytrail.com
// 071825 q#1/q#2/q#4 on 2026-04-30.
//
// Distractor strategy: cross-axis-confusion tempters. Aiden's misses were
// all confusion errors where the question asked about one axis but the
// student picked an answer from the other axis. Q1, Q2, Q3 each include
// one cross-axis distractor that is TRUE about the asked control on the
// other axis but FALSE as an answer on the asked axis. The stem's word
// "category" or "type" is the disambiguator. Q4 tests within-Type nuance
// (visible camera = Deterrent vs hidden camera = Detective). Q5 forces
// student to classify a single control on BOTH axes simultaneously.
//
// Per CLAUDE.md rule 8: items are authored in natural option order
// (`authorA` = the position the author wrote the correct option in), and
// the script computes the final `a` deterministically via
// sha256(videoId + ":" + kind + ":" + insertionIdx) mod 4. If the hash
// target differs from the author position, opts[authorA] and opts[targetA]
// are swapped before the item is appended.
//
// Idempotent: detects already-appended items by stem-prefix match and
// skips. End-of-array insertion only — preserves SM-2 keys for items 0-10
// (MCs) and 0-5 (scenarios).
//
// Usage:
//   node scripts/add-control-axes-batch.mjs              # dry-run summary, no writes
//   node scripts/add-control-axes-batch.mjs --preview    # write preview to /tmp/
//   node scripts/add-control-axes-batch.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-control-axes-preview.json";

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
// Citation: messerVideo "1.1 - Security Controls" verified against
// MESSER_VIDEOS.md L11. subObjective "1.1" matches the existing 1.1.1
// catalogue convention (parent objective).
//
// CompTIA SY0-701 1.1 axis-naming convention (verified by Aiden 2026-05-01,
// matches existing catalogue):
//   "Category" = Managerial / Operational / Technical / Physical
//   "Type"     = Preventive / Deterrent / Detective / Corrective /
//                Compensating / Directive
const INSERTIONS = [
  // ───── Q1 — Physical CATEGORY with Deterrent cross-axis tempter ─────
  {
    videoId: "1.1.1",
    kind: "mc",
    q: "Fencing, bollards, and exterior lighting around a corporate campus are examples of which control category?",
    opts: [
      "Physical",
      "Technical",
      "Managerial",
      "Deterrent",
    ],
    authorA: 0,
    exp: "Physical controls are tangible, real-world barriers — fencing, bollards, lighting, locks, fences, mantraps. While these same controls also act as a Deterrent in the Type axis, the question asks for the CATEGORY (Managerial / Operational / Technical / Physical), not the Type (Preventive / Deterrent / Detective / Corrective / Compensating / Directive). Every control sits at the intersection of one Category AND one Type — they are independent axes.",
    messerVideo: "1.1 - Security Controls",
    subObjective: "1.1",
  },

  // ───── Q2 — Technical CATEGORY with Operational cross-axis tempter ─────
  {
    videoId: "1.1.1",
    kind: "mc",
    q: "An organization deploys motion detectors, fingerprint biometric scanners, and an intrusion detection system (IDS) across its facility. These tools are which control category?",
    opts: [
      "Operational",
      "Technical",
      "Physical",
      "Managerial",
    ],
    authorA: 1,
    exp: "Technical controls are electronic or hardware-based systems — motion sensors, biometric readers, IDS/IPS, firewalls, encryption. Operational controls are human-driven processes (guard patrols, change management, incident-response drills). The hardware of an IDS is Technical even when an Operational SOC team monitors its alerts; CompTIA classifies based on the control itself, not the process around it.",
    messerVideo: "1.1 - Security Controls",
    subObjective: "1.1",
  },

  // ───── Q3 — Directive TYPE with Managerial cross-axis tempter ─────
  {
    videoId: "1.1.1",
    kind: "mc",
    q: "A company's information security policy requires all employees to complete annual security training and to acknowledge the acceptable use policy at hire. These mandates are which control type?",
    opts: [
      "Managerial",
      "Detective",
      "Directive",
      "Preventive",
    ],
    authorA: 2,
    exp: "Directive controls instruct personnel on required behavior through policy, training, and acknowledgements. They are distinct from Preventive (active stops like firewalls or locks) and from Managerial — Managerial is a Category that describes WHO/WHAT the control acts on, while Directive is a Type that describes HOW the control works. A written policy is Managerial in Category AND Directive in Type.",
    messerVideo: "1.1 - Security Controls",
    subObjective: "1.1",
  },

  // ───── Q4 — Visible-vs-hidden camera Type contrast ─────
  {
    videoId: "1.1.1",
    kind: "mc",
    q: "A facility installs two security cameras: a visibly-mounted dome camera in the lobby ceiling, and a concealed pinhole camera covering a server-room corridor. The two cameras serve which control types, respectively?",
    opts: [
      "Visible camera = Deterrent (it discourages because it's seen); concealed camera = Detective (it records without warning)",
      "Visible camera = Detective; concealed camera = Deterrent — both record events, but only the hidden one is preventive",
      "Both are Detective — cameras only record activity, regardless of whether they are visible or concealed",
      "Both are Preventive — physically installed cameras stop unauthorized access from occurring",
    ],
    authorA: 0,
    exp: "Visible cameras deter — attackers who notice them are discouraged from acting because they expect to be recorded. Concealed cameras detect — they record without warning, so they don't deter (no one knows to be discouraged), but they capture evidence after the fact. The Type assignment depends on whether the camera is announcing its presence. The Category for both is Technical (electronic recording systems).",
    messerVideo: "1.1 - Security Controls",
    subObjective: "1.1",
  },

  // ───── Q5 — Scenario: same control, BOTH axes (orthogonality) ─────
  {
    videoId: "1.1.1",
    kind: "scen",
    q: "A bank installs a biometric palm-reader at its data-center vestibule. The same device is referenced in two compliance reports: one classifies it as part of the data-center's access-control infrastructure (electronic identity verification), and the other classifies it as a measure that stops unauthorized personnel from reaching the server racks. In CompTIA's SY0-701 framework, which classification pair is correct?",
    opts: [
      "Category = Technical; Type = Preventive — biometrics electronically authenticate AND stop unauthorized entry",
      "Category = Physical; Type = Deterrent — the device is a tangible wall-mounted unit that discourages approach",
      "Category = Operational; Type = Detective — the device logs each attempt as part of the security process",
      "Category = Technical; Type = Detective — biometrics electronically detect and record each entry attempt",
    ],
    authorA: 0,
    exp: "Biometric palm-readers are electronic identity-verification systems (Technical Category) whose primary purpose is to allow or deny entry (Preventive Type). The same device also logs each attempt (a Detective side-effect), but CompTIA classifies controls by their PRIMARY purpose — for access-control devices that's Preventive. Every control sits at the intersection of one Category AND one Type; the two axes are independent.",
    messerVideo: "1.1 - Security Controls",
    subObjective: "1.1",
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
const planRows = [];

for (const ins of INSERTIONS) {
  const video = videoById.get(ins.videoId);
  if (!video) {
    console.error(`ERROR: video ${ins.videoId} not found`);
    process.exit(1);
  }
  const targetList = ins.kind === "mc"
    ? (video.questions = video.questions || [])
    : (video.scenarios = video.scenarios || []);

  // Idempotency check: stem-prefix match
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

  // Hash-based position assignment: swap opts[authorA] ↔ opts[targetA]
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

console.log(`\nControl Categories vs Types batch — apply plan`);
console.log(`================================================`);
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
