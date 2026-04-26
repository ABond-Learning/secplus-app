// Audit Domain 2 MCs for BEST/MOST-rewrite candidates per the criteria agreed in
// conversation, with tiered prioritization since Domain 2 is heavily recall-style
// (109 of 139 MCs end with ":") and not all recall stems benefit from BEST/MOST
// reframing (mechanism questions are objective and don't admit judgment framing).
//
// Tiered output:
//   Tier 1 (high-confidence rewrite wins): stem is judgment-amenable (Which / How /
//          Defense / Mitigation / Best), is currently recall-framed, AND has either
//          option-length asymmetry (>2.0×) or short-distractor signals — clear
//          benefit from BEST/MOST reframing
//   Tier 2 (moderate): recall stem on a topic that admits judgment (matches a
//          judgment-keyword set: best, prevent, mitigate, reduce, protect, defend,
//          most appropriate, primary purpose) — reframing could improve
//   Tier 3 (low — would not benefit): recall stem on an objective-mechanism topic
//          ("X mitigates Y by:", "X attacks target:", "X works by:") — rewriting
//          would just add a BEST/MOST keyword without changing the answer space
//   Excluded: already BEST/MOST framed, already scenario-opener, or non-MC items
//
// Usage:
//   node scripts/audit-domain2-rewrite-candidates.mjs            # tier summary
//   node scripts/audit-domain2-rewrite-candidates.mjs --details  # full per-item

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const showDetails = process.argv.includes("--details");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const d2 = data.filter((s) => s.id && s.id.startsWith("2"));

// ─── Detectors ────────────────────────────────────────────────────────
const BEST_MOST_EMPHASIS = /\b(BEST|MOST|LEAST|PRIMARY|FIRST|GREATEST|REQUIRES|WITHOUT|SHOULD|ALWAYS|NEVER)\b/;
const SCENARIO_OPENERS = /^(A |An |The )?(company|organization|user|employee|administrator|admin|developer|security team|SOC analyst|IT team|attacker|threat actor|network engineer|network team|business|customer|contractor|vendor|auditor|forensic investigator|penetration tester|red team|hacker|small office|large enterprise|healthcare|bank|financial|hospital|school|government|cloud|SaaS)\b/i;

// Judgment-keyword set: stems whose topic admits multi-option plausible answers
// where BEST/MOST framing meaningfully tightens the question.
const JUDGMENT_KEYWORDS = /\b(best|most appropriate|most effective|primary purpose|primary defense|primary mitigation|primary control|most important|most likely|prevent|mitigate|reduce|protect|defend|harden|control|countermeasure|defense)\b/i;

// Objective-mechanism patterns: "X mitigates Y by:", "X attacks target:", "X works by:"
// — recall stems whose answer space is a single objective fact, not a judgment call.
const OBJECTIVE_MECHANISM = /\b(mitigates?|targets?|exploits?|works? by|operates? by|prevents? by|defeats? by|forces? a|allows? an attacker|requires?|involves?) ?(.{0,30})?:?$/i;

// Strict heuristic: stem ends with colon and lacks BEST/MOST and lacks scenario opener.
function isRecallStem(stem) {
  if (BEST_MOST_EMPHASIS.test(stem)) return false;
  if (SCENARIO_OPENERS.test(stem.trim())) return false;
  if (stem.trim().endsWith(":")) return true;
  // Catch "Which of the following X" / "What is X?" without BEST/MOST keyword
  if (/^(What|Which) (is|are|of the following)\b/i.test(stem) && !BEST_MOST_EMPHASIS.test(stem)) return true;
  return false;
}

function hasJudgmentKeyword(stem) {
  return JUDGMENT_KEYWORDS.test(stem);
}

function isObjectiveMechanism(stem) {
  return OBJECTIVE_MECHANISM.test(stem.trim());
}

function lengthRatio(opts) {
  const lens = opts.filter((o) => typeof o === "string").map((o) => o.length);
  if (lens.length < 2) return 1;
  const min = Math.min(...lens);
  const max = Math.max(...lens);
  return min > 0 ? max / min : Infinity;
}

function hasShortDistractor(opts, a, threshold = 15) {
  return opts.some((o, i) => i !== a && typeof o === "string" && o.length < threshold);
}

// ─── Walk + classify ──────────────────────────────────────────────────
const tier1 = [], tier2 = [], tier3 = [], excluded = [];
const subObjMap = {};
let totalMC = 0;

for (const sec of d2) {
  for (const v of sec.videos) {
    const mcs = v.questions || [];
    const sub = v.id;
    if (!subObjMap[sub]) subObjMap[sub] = { title: v.title, mc: 0, t1: 0, t2: 0, t3: 0, ex: 0 };
    subObjMap[sub].mc += mcs.length;
    totalMC += mcs.length;
    mcs.forEach((q, i) => {
      if (typeof q.q !== "string") return;
      const stem = q.q;
      const opts = q.opts || [];
      const ratio = lengthRatio(opts);
      const shortDist = hasShortDistractor(opts, q.a);

      if (!isRecallStem(stem)) {
        excluded.push({ sub, idx: i, stem, reason: BEST_MOST_EMPHASIS.test(stem) ? "already-emphasized" : SCENARIO_OPENERS.test(stem.trim()) ? "scenario-opener" : "non-recall-form", title: v.title });
        subObjMap[sub].ex++;
        return;
      }

      const judgment = hasJudgmentKeyword(stem);
      const objective = isObjectiveMechanism(stem);
      const asymmetric = ratio > 2.0 || shortDist;

      const indicators = [];
      if (judgment) indicators.push("judgment-keyword");
      if (objective) indicators.push("objective-mechanism");
      if (asymmetric) indicators.push(`length-asym (ratio=${ratio.toFixed(2)}${shortDist ? ", short-dist" : ""})`);

      const item = { sub, idx: i, stem, indicators, ratio, shortDist, judgment, objective, title: v.title };
      // Tier assignment: judgment-amenable AND asymmetric = tier 1; judgment-amenable
      // alone = tier 2; objective mechanism = tier 3 (would not benefit).
      if (judgment && asymmetric) {
        tier1.push(item); subObjMap[sub].t1++;
      } else if (judgment) {
        tier2.push(item); subObjMap[sub].t2++;
      } else if (asymmetric && !objective) {
        tier1.push(item); subObjMap[sub].t1++;
      } else if (objective) {
        tier3.push(item); subObjMap[sub].t3++;
      } else {
        // Recall stem, no judgment cue, no objective-mechanism cue, no asymmetry — neutral.
        tier2.push(item); subObjMap[sub].t2++;
      }
    });
  }
}

// ─── Summary ───────────────────────────────────────────────────────────
console.log(`Domain 2 MCs scanned: ${totalMC}`);
console.log(`  Already well-framed (BEST/MOST or scenario or other): ${excluded.length} → excluded from rewrite`);
console.log(`  Tier 1 (high-confidence rewrite wins): ${tier1.length}`);
console.log(`  Tier 2 (judgment-amenable, no asymmetry): ${tier2.length}`);
console.log(`  Tier 3 (objective-mechanism — rewrite would not benefit): ${tier3.length}`);
console.log(`  Sum: ${excluded.length + tier1.length + tier2.length + tier3.length}\n`);

console.log("Per-sub-objective distribution (mc / excluded / t1 / t2 / t3):");
for (const [sub, info] of Object.entries(subObjMap).sort()) {
  const candidates = info.t1 + info.t2;
  console.log(`  §${sub.padEnd(7)} ${info.title.padEnd(40)}  ${info.mc} / ${info.ex} / ${info.t1} / ${info.t2} / ${info.t3}   (${candidates} candidate${candidates === 1 ? "" : "s"})`);
}

if (showDetails) {
  console.log("\n=== TIER 1 (high-confidence rewrite wins) ===");
  for (const c of tier1) {
    console.log(`  §${c.sub} mc[${c.idx}]  [${c.indicators.join("; ")}]`);
    console.log(`    "${c.stem.replace(/\s+/g, " ").slice(0, 120)}${c.stem.length > 120 ? "..." : ""}"`);
  }
  console.log("\n=== TIER 2 (judgment-amenable, less urgent) ===");
  for (const c of tier2) {
    console.log(`  §${c.sub} mc[${c.idx}]  [${c.indicators.join("; ") || "neutral-recall"}]`);
    console.log(`    "${c.stem.replace(/\s+/g, " ").slice(0, 120)}${c.stem.length > 120 ? "..." : ""}"`);
  }
  console.log("\n=== TIER 3 (objective-mechanism — would NOT benefit from rewrite) ===");
  for (const c of tier3) {
    console.log(`  §${c.sub} mc[${c.idx}]`);
    console.log(`    "${c.stem.replace(/\s+/g, " ").slice(0, 120)}${c.stem.length > 120 ? "..." : ""}"`);
  }
}
