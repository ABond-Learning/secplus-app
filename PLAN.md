# PLAN.md — Living task tracker

Single source of truth for in-flight work. Update as state changes.
See CLAUDE.md for the underlying 3-task plan and quality rules.

Last updated: 2026-04-24

## Status snapshot

Task | State | Notes
--- | --- | ---
1a — Foundations + spelling pass | **complete, deployed** | All phases shipped. Live bundle verified clean.
1b — Content generation | **in progress** — Domain 1 scenarios complete (25/25). Next: Domain 5.
2 — Mode consolidation | not started | Touches localStorage migration; see SCHEMA.md.
3 — PBQ system + exam sim | not started | Schema extension + new components.

## Task 1a — completed

### Phase A — Extraction (commit `c89772a`)

- [x] Extracted `ALL_SECTIONS` (line 4 of `src/secplus-quiz.jsx`, 712,318 chars) to `questions.json` via `scripts/extract-questions.mjs` with semantic round-trip integrity check.
- [x] Counts match CLAUDE.md baseline: 28 sections / 120 videos / 433 MC / 277 scenarios / 580 matching pairs / 671 cram terms.
- [x] Spot-check (`scripts/spot-check.mjs`) — 3 random questions across sections deep-equal vs original line 4.
- [x] Wired JSX with `import ALL_SECTIONS from "../questions.json";`. JSX dropped 818 KB → 106 KB.
- [x] `npm run build` passes. SCHEMA.md and PLAN.md written.
- [x] Question IDs / array order preserved → SM-2 localStorage keys still resolve.

### Phase B — Validator + audit + spelling pass (commits `1f75cd0`, `5e776ab`, `4f95317`)

- [x] `scripts/spelling-map.mjs` — curated British→American dictionary. 45 -ise stems, substring rules for -our/-ce/-ogue/-mme/-il-to-ill, explicit forms for -re and double-l. Excludes universal verbs (compromise, exercise, advise, etc.) and stylistic forms (judgement, grey, learnt). Fibre Channel preserved via negative lookahead.
- [x] `scripts/validate-questions.mjs` — quality-rule validator. Severities: error / warn / info. New items require messerVideo + subObjective; legacy grandfathered.
- [x] `scripts/apply-spelling-pass.mjs` — pass runner reusing the same map.
- [x] Audit produced (`audit-report.md`).
- [x] §4.1/4.1.5 scen[2] fixed: 5 options → 4 (dropped the weakest distractor "All three are equal severity"). Commit `1f75cd0`.
- [x] Spelling pass applied: **727 substitutions across 604 fields, 8 families** (510 ise / 89 our / 36 mme / 35 ce / 26 re / 26 double-l / 3 ogue / 2 il-to-ill). Commit `5e776ab`.
- [x] Hot-fix for `-ational` adjective suffix (commit `4f95317`): live-bundle audit found 6 surviving `organisational` hits; ISE_SUFFIX extended to include `ational`/`ationally`. 6 more substitutions applied.
- [x] Validator final state: **1450 → 722 issues (−728)**, **0 errors**, 12 warnings (11 BEST/MOST short-distractor heuristics + 1 ambiguous `analyses` flag), 710 info (legacy items missing citations — grandfathered).
- [x] Pushed and deployed. Live bundle (`index-CyNJm9S_.js`) verified clean: 0 hits across all 18 audited British forms; HTTP 200; no triple-l corruption.

### Bugs found and fixed mid-task (lessons for Task 1b)

1. **Substring rules + already-doubled BrE forms**: bare `/fulfil/` matched inside `fulfilled` (already double-l in BrE), corrupting it to `fulfillled`. Same risk for `enrol`/`enrolled`. **Fix**: use negative lookahead `/(?!l)/` so the rule only matches single-l forms. **Lesson for Task 1b**: when adding new substring spelling rules, check whether the British form is itself an inner substring of any naturally-doubled form in either dialect. If yes, use negative lookahead.
2. **Suffix list completeness**: ISE_SUFFIX initially covered noun forms (ation, ations) but not adjective forms (ational, ationally), so `organisational` (6 hits) was missed. **Fix**: extended suffix alternation. **Lesson for Task 1b**: when adding new -ise stems, mentally derive all common suffix forms (ation/al/ally, er/ers) before assuming the suffix list covers them.

Both bugs were caught by external-source verification (live bundle grep), not just local validator runs. Live-bundle audits are worth doing after any future spelling-rule changes.

## Task 1b — Content generation (in progress)

Order: Domain 1 scenarios → Domain 5 → Domain 4 → Domain 2 BEST/MOST rewrites.
Each batch: count + all questions + validator-clean confirmation, then user review.

- [x] **25 Domain 1 scenarios (complete, committed `add6534`)**. 3 batches of 8/8/9, each user-reviewed before moving on. Distribution: 1.1 × 6, 1.2 × 6, 1.3 × 5, 1.4 × 8. Per-video breakdown: 1.1.1 × 6; 1.2.1-3 × 1 each, 1.2.5-7 × 1 each; 1.3.1 × 3, 1.3.2 × 2; 1.4.1-8 × 1 each. All citations verified against MESSER_VIDEOS.md. Validator remained at pre-batch baseline (722 issues, 0 errors, 12 warns) through all three batches. See "Domain 1 deferrals" below.
- [ ] ~80 Domain 5 items (50 MC + 30 scenarios), 2 batches of ~40. **NEXT**.
- [ ] ~65 Domain 4 items (40 MC + 25 scenarios), 2 batches.
- [ ] 40 Domain 2 BEST/MOST rewrites (target: tighten recall-style stems into "BEST/MOST" framing per CLAUDE.md Quality Rule 6).
- [ ] Final domain-weight audit vs CLAUDE.md targets (1: 12% / 2: 22% / 3: 18% / 4: 28% / 5: 20%).
- [ ] Commit + Pages deploy per domain.

All new content must:
- Include `messerVideo` (exact per MESSER_VIDEOS.md) and `subObjective` fields (validator enforces — error severity for new items).
- Have `exp` ≥40 chars with reasoning.
- Use American English (validator catches anything the spelling pass would have).
- Pass the validator before commit.

### Domain 1 deferrals

- **§1.2.4 Gap Analysis — 0 scenarios (intentional)**. The video covers a narrow, definition-heavy topic already well served by 4 existing MCs. Scenario framing would be largely redundant with those MCs. The 6-scenario target for Domain 1.2 was met without it (CIA, Non-repudiation, AAA, Zero Trust, Physical Security, Deception and Disruption). If later review indicates Gap Analysis under-tests on practice exams, add 1-2 scenarios then — leave it alone for now.

### Domain 1 batch applier scripts (retained for reproducibility)

- `scripts/add-domain1-batch1.mjs` — 8 scenarios (1.1 × 2, 1.2 × 3, 1.3 × 2, 1.4 × 1)
- `scripts/add-domain1-batch2.mjs` — 8 scenarios (1.1 × 2, 1.2 × 3, 1.3 × 1, 1.4 × 2)
- `scripts/add-domain1-batch3.mjs` — 9 scenarios (1.1 × 2, 1.3 × 2, 1.4 × 5)

All three are idempotent (skip on stem-prefix match). Safe to re-run during future audits.

## Task 2 — Mode consolidation (later)

Collapse to 4 modes: Quiz / Flashcards / Review / Drill Wrong. Unified Quiz with
Customise drawer. Saved presets. **localStorage migration is the risky part** —
SCHEMA.md "localStorage compatibility" section is the contract. Question IDs and
array order must remain stable to keep SM-2 progress intact.

## Task 3 — PBQ system (later)

Schema extension for PBQs. Drag-match, firewall ordering, log analysis, port/protocol matching.
~40 PBQs across formats. 90-question / 90-min exam simulation with 3-5 PBQs at start.
CompTIA 100-900 scoring scale.

## Files produced

Phase A:
- `questions.json` — question bank (876 KB pretty-printed).
- `scripts/extract-questions.mjs` — one-time extractor (kept for reproducibility).
- `scripts/spot-check.mjs` — manual JSON↔JSX comparison (only useful pre-wiring).
- `scripts/wire-jsx-import.mjs` — one-time JSX rewrite (idempotent).
- `scripts/probe-schema.mjs` — schema discovery (used to write SCHEMA.md).

Phase B:
- `scripts/spelling-map.mjs` — curated British→American rules; shared by validator and pass.
- `scripts/validate-questions.mjs` — quality-rule validator.
- `scripts/apply-spelling-pass.mjs` — pass runner.
- `audit-report.md` — current validator state (auto-generated).

Docs:
- `SCHEMA.md` — schema contract.
- `PLAN.md` — this file.

## Open questions / risks

- **Bundle size**: 942 KB JS chunk because Vite inlines JSON. Acceptable for a personal study app; Task 2 or 3 could move to a dynamic `fetch("/questions.json")` if needed.
- **Legacy content has no Messer/sub-objective citations** (710 info-level flags). Per user directive, grandfathered as-is. Task 1b adds citations only on new items.
- **`analyses` ambiguity** (1 hit at §4.1/4.1.5 mc[1].opts[1]): plural noun (same in AmE) vs verb (AmE = "analyzes"). Flagged for manual review during Task 1b or later.
- **11 BEST/MOST short-distractor warnings** are heuristic, not blocking. Some flagged distractors are legitimate technical terms (Encryption, Hashing, Pass-the-hash). Review during Task 1b.
