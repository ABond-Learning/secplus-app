# PLAN.md — Living task tracker

Single source of truth for in-flight work. Update as state changes.
See CLAUDE.md for the underlying 3-task plan and quality rules.

Last updated: 2026-04-24

## Status snapshot

Task | State | Notes
--- | --- | ---
1a — Foundations + spelling pass | **in progress (Phase A done, awaiting Checkpoint 1 review)** | Extraction + JSX wiring + docs committed.
1b — Content generation | not started | Blocked on 1a sign-off.
2 — Mode consolidation | not started | Touches localStorage migration; see SCHEMA.md.
3 — PBQ system + exam sim | not started | Schema extension + new components.

## Task 1a — checkpoints

### Phase A — Extraction (DONE pending review)

- [x] Located `ALL_SECTIONS` (line 4 of `src/secplus-quiz.jsx`, 712,318 chars).
- [x] Wrote `scripts/extract-questions.mjs`. Semantic round-trip check passes.
- [x] Generated `questions.json` (876 KB pretty-printed). Counts match CLAUDE.md baseline: 28 / 120 / 433 / 277 / 580 / 671.
- [x] 3-question spot-check (`scripts/spot-check.mjs`) — all deep-equal vs original line 4.
- [x] Wired JSX to `import ALL_SECTIONS from "../questions.json";`. JSX dropped 818 KB → 106 KB.
- [x] `npm run build` passes (942 KB chunk, gzip 288 KB; warning is informational since Vite inlines JSON).
- [x] `SCHEMA.md` written from observed shape.
- [x] `PLAN.md` (this file).
- [ ] **CHECKPOINT 1 REVIEW** — awaiting user sign-off, then commit Phase A.

### Phase B — Validator + audit + spelling pass

- [ ] Write `scripts/validate-questions.mjs` enforcing the quality rules.
- [ ] Run validator on existing content; produce `audit-report.md`.
- [ ] Show curated British→American conversion list to user for approval.
- [ ] Apply spelling pass; re-run validator.
- [ ] **CHECKPOINT 2 REVIEW**.
- [ ] Commit + push, watch Pages deploy green, verify live site loads.
- [ ] **TASK 1A COMPLETE — pause for full review.**

## Task 1b — Content generation (after 1a sign-off)

Order: Domain 1 scenarios → Domain 5 → Domain 4 → Domain 2 BEST/MOST rewrites.
Each batch: count + 3-5 sample questions + validator-clean confirmation, then user review.

- [ ] ~25 Domain 1 scenarios (currently zero).
- [ ] ~80 Domain 5 items (50 MC + 30 scenarios), 2 batches of ~40.
- [ ] ~65 Domain 4 items (40 MC + 25 scenarios), 2 batches.
- [ ] 40 Domain 2 BEST/MOST rewrites.
- [ ] Final domain-weight audit vs CLAUDE.md targets.
- [ ] Commit + Pages deploy.

## Task 2 — Mode consolidation (later)

Collapse to 4 modes: Quiz / Flashcards / Review / Drill Wrong. Unified Quiz with
Customise drawer. Saved presets. **localStorage migration is the risky part** —
SCHEMA.md "localStorage compatibility" section is the contract.

## Task 3 — PBQ system (later)

Schema extension for PBQs. Drag-match, firewall ordering, log analysis, port/protocol matching.
~40 PBQs across formats. 90-question / 90-min exam simulation with 3-5 PBQs at start.
CompTIA 100-900 scoring scale.

## Files produced so far

- `questions.json` — extracted question bank (Phase A).
- `scripts/extract-questions.mjs` — one-time extractor with round-trip integrity check.
- `scripts/spot-check.mjs` — manual JSON↔JSX comparison (only useful pre-wiring).
- `scripts/wire-jsx-import.mjs` — one-time JSX rewrite, idempotent.
- `scripts/probe-schema.mjs` — schema discovery used to write SCHEMA.md.
- `SCHEMA.md` — schema documentation.
- `PLAN.md` — this file.

## Open questions / risks

- **Bundle size**: post-extraction the JS chunk is 942 KB because Vite inlines the
  JSON import. Acceptable for a personal study app; Task 2 or 3 could move to a
  dynamic `fetch("/questions.json")` if needed.
- **Existing content lacks Messer/sub-objective citations**. Per user directive,
  these are flagged in audit but not modified. New content (Task 1b) must include them.
- **British spelling is widespread** in existing content (e.g. "unsanitised" found
  in §2.3 spot-check). Spelling pass at end of Phase B handles this.
