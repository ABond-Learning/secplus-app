# PLAN.md — Living task tracker

Single source of truth for in-flight work. Update as state changes.
See CLAUDE.md for the underlying 3-task plan and quality rules.

Last updated: 2026-05-25

## Status snapshot

Priority order reflects the 2026-04-27 reorder triggered by study-session findings: catalogue quality issues (length-tell distractors, weak distractors) are actively undermining current study, and the "N new things to try" UX has no surfacing path. Both jumped ahead of continuing 1c grounding-audit tuning.

**2026-04-28 reframe (authoritative):** There is no fixed exam date. Aiden is currently early in the syllabus (only watched videos up to Cryptography). Quality > speed. Prior CLAUDE.md "8 weeks / late June 2026" framing was incorrect; treat catalogue quality as the binding constraint, not calendar pressure.

**2026-05-13 reframe (authoritative):** A study-blocking content-grounding issue surfaced 2026-05-10 (§2.3.3 matching/cram test mutex + atomic operation as concurrency primitives; neither appears in the Messer 2.3.3 transcript or the SY0-701 2.3 objective text — multiple unflagged instances confirmed). Scoped as **Task 1f — Audit D** on 2026-05-13 with eight decisions signed off (see `docs/audit-d-scoping.md`). Audit D is ordered **ahead of Task 2 Sub-batches 3, 4, 5**: source quality > UX polish when source quality is broken. Exception clause: if Audit D drags 2-3 weeks, Sub-batch 4 (cram in buildPool) may interleave. Default is Audit D first through closure. Audit B (semantic coherence) is subsumed into D; Audit C (length-ratio re-run) is deferred indefinitely; Task 1c-structural is superseded by D.

Task | State | Notes
--- | --- | ---
1a — Foundations + spelling pass | **complete, deployed** | All phases shipped. Live bundle verified clean.
1.5 — Cross-device sync via private Gist | **complete, deployed, verified on 3 devices** | Backup polish + sync engine + sync UI all live. Real-device sync verified across 3 of Aiden's devices post-deploy (joining-device guard holds; bidirectional sync works).
1b — Content generation | **complete, deployed** | All 5 domains done: Domain 1 scenarios (25), Domain 5 (78), Domain 4 (55), Domain 2 BEST/MOST rewrites (35 across 2 batches). **Total: 193 items added/modified.**
1c-structural — Citation backfill + grounding/anchor-gap audits | **citation backfill complete; grounding/anchor-gap audits SUPERSEDED BY AUDIT D (2026-05-13)** | Citation backfill DONE (728 → 0 legacy-no-citation on MC + scen; matching/cram have no per-item citation by design). Prior keyword-extractor grounding work (April 27) was noise-dominated on MC + scen and never scanned matching/cram — exactly where the §2.3.3 mutex case lives. Audit D (Task 1f) is the spiritual successor with LLM-as-judge methodology; see `docs/audit-d-scoping.md`.
**1d — Catalogue quality audit + fixes** | **shipped** | Sub-batch 1 (position shuffle + 95 Pattern A length-tells) and Sub-batch 2 (short-distractor padding) both complete. Sub-batch 2 closed via mega-pass `116cd40` (2026-04-30): **216 mods + 52 Convention B holdbacks across all 27 sub-objectives / 320 cohort items, 53 residual** (all intentional holdbacks + 1 out-of-scope §4.2 item). Validator: 0 errors, 5 warns. **10 follow-up items** captured for a future content-quality pass (Sub-batch 3 tentative, not next priority): 5 Convention A expansions + 2 mega-pass TODOs + 3 prior items already in TODO-content-quality.md.
**1e — New-content prioritization** | **NEW (2026-04-27)** | App reports "N new things to try" with no way to see/prioritize them. Either separate New mode or have existing modes prioritize unseen-from-watched-videos. Smaller scope than Task 2; ~1-2 hours.
1c-structural (continuation) — extractor tuning | **superseded by Audit D (2026-05-13)** | Keyword-extractor approach abandoned in favor of LLM-as-judge. See Task 1f.
1c-experiential — anchor-gap fixes | not started; **scope may overlap with Audit D** | Generate anchor questions for concepts not yet tested. Distinct from Audit D's "is tested content in source?" question, but the underlying transcript-driven analysis pipeline could be shared. Re-evaluate after Audit D closure.
**1f — Audit D: citation grounding** *(last updated 2026-05-25; SB-fix-1b CLOSED; SB-fix-2 P-path FULLY CLOSED at 56/56; weakness-tracker IN PROGRESS → promoted to Task 1h; Sybex fold-in scoped → Task 1g)* | **SB0 SHIPPED 2026-05-13 `111be1f`; SB1 pre-flight SHIPPED 2026-05-14 `aa32fad`; SB1.5 post-process SHIPPED 2026-05-18 `a26d42c`; SB1 full-corpus SHIPPED 2026-05-19; SB1.6 post-process refinement SHIPPED 2026-05-20; SB-fix-1a SHIPPED 2026-05-20 (`53786b0` + `4b9d838` + `61b6992`); Report-#0007 SHIPPED 2026-05-21 `4e6fb9e`; SB-fix-1b-prep SHIPPED 2026-05-21 `c1464c0`; SCHEMA sb16_subcategory + backfill + apply threading SHIPPED 2026-05-21 (`12deabc` + `6f796f7` + `ae5495f`); SB-fix-1b packet 1 SHIPPED 2026-05-21 `c252fa1`; SB-fix-1b packet 2 SHIPPED 2026-05-21 `87b566e`; relay v1→v2 infrastructure + docs/cadence-rules.md + weakness-tracker scoping SHIPPED 2026-05-22 (`24cdc7f` → `7c65c6c` → `28f4054`); relay v2.1 (URL in CC terminal) SHIPPED 2026-05-22 `77ae671`; SB-fix-1b packet 3 SHIPPED 2026-05-22 `a77ef4e`; SB-fix-1b packet 4 SHIPPED 2026-05-22 `f89b48e` — SB-fix-1b CLOSED at 134/134 D2 PA match/cram items shipped (100%). Cumulative SB-fix-1b: 102 edits + 32 sb16-candidates (30 partial-depth + 2 messer-curriculum-gap).** | Hybrid keyword pre-screen + LLM-as-judge + Aiden arbitration. SB0: 5 scripts + 30-item calibration, $0.32; smoke PASSED; strict 76.7% / collapsed 86.7%. SB1 pre-flight: tuned prompt + cache + verbatim-retry; Rec 2 partial-depth examples landed (3/3 targeted shifts); Rec 4 verbatim-retry landed (paraphrase 27%→8.3%); Rec 1 partial-adjacent attempted in iter1 but broke smoke + 10/23 regressions → rolled back. Pass-criteria 5/7 PASS. Spend $0.97. SB1.5 post-process script flips category to partial-adjacent whenever fix_direction=move-to-correct-video; validated on iter0 micro-recal + regression sample. **SB1 full-corpus 2026-05-19: 2,128 verdicts produced (zero data loss), $25.92 spent (under $30 mid), 100% cache hit rate after first call. Postprocess flipped 412 verdicts (19.4%). Spot-check on stratified 40-item packet: supervisor PASS at 75% strict agreement.** **SB1.6 2026-05-20: 8-item uncertainty verification (8/8 LLM verdicts held — transcript-grep, $0 spend) lifted post-verification agreement to 38/40 = 95%. Second flip predicate `category=out-of-source AND fix_direction=mark-for-Sybex-arbitration AND >=2 of 10 prose markers → partial-depth`. Real-apply: 3 strict flips + 18 loose flags. Final counts post-SB1.6: OOS 296→293, partial-depth 399→402.** **SB-fix-1a SHIPPED 2026-05-20 (three commits): Domain 2 partial-adjacent mc + scen re-citation, 3 packets of 25/25/13 items with per-packet commits, cadence Option B for packets 2+3. Cumulative: 63 items reviewed (100% of D2 PA mc+scen scope), 52 re-cited (23 + 21 + 8), 1 kept-as-is via self-alternate (#17 packet-1), 10 sb16-candidates (#25 + 4 + 5). Major findings: (a) catch-all pattern is systemic across §2.2/§2.3/§2.4/§2.5 — not §2.2-specific (§2.3 buckets DNS/infrastructure/mitigation items; §2.4 dominates within-cluster sibling reorganization; §2.5 buckets cross-domain hardening). (b) Partial-depth was systematically under-applied at the LLM-as-judge layer — SB-fix-1a review surfaced 10 sb16-candidates beyond SB1.6's 21 (3 strict + 18 loose) for a 31-item SB-fix-2 candidate-augment pool. The 10 SB-fix-1a-surfaced items required sibling-aware "concept-here-but-not-this-exact-term" review with no clean automated proxy. (c) Messer-curriculum-gap candidate list initialised: #43 SYN flood (DoS transcript covers volumetric/amplification only; possibly absent from entire Messer SY0-701 curriculum). SB-fix-2 will need a Sybex-arbitration sub-path for such items.** Schema-constraint finding during SB-fix-1a scoping deferred match + cram (134 items) to SB-fix-1b — requires Path B schema extension (per-item messerVideo/subObjective on MatchItem + CramTerm). Cumulative Audit D spend $34.63 ($1.29 prior + $7.42 SB1 halt + $25.92 SB1 completion + $0 SB1.6 + $0 SB-fix-1a); credit remaining $19.08. Closure docs `docs/audit-d-calibration-summary.md` (SB0), `Reports/Report-#0002.md` (SB0), `Reports/Report-#0003.md` (SB1 pre-flight), `Reports/Report-#0004.md` (SB1.5 + matching-bug fix), `Reports/Report-#0005.md` (SB1 full-corpus + spot-check sign-off), `Reports/Report-#0006.md` (uncertainty verification + SB1.6 + SB-fix-1 scoping), `Reports/Report-#0007.md` (SB-fix-1a + cross-cutting Audit D findings — load-bearing methodology document covering Q6 + parser v2 + 3-packet ship + catch-all generalisation + partial-depth under-application + Messer-curriculum-gap candidates + cumulative methodology math 47/50 = 94%), `Reports/Report-#0008.md` (SB-fix-1b-prep — schema extension + validator generalisation; per-item citation override on MatchItem + CramTerm; Q-A through Q-E supervisor adjudication with two Q-B refinements; 6-fixture validator self-test pattern established). Subsumes Audit B; defers Audit C indefinitely; supersedes Task 1c-structural. **SB-fix-1b closure complete 2026-05-22.** Cumulative across 4 packets: 102 edits + 32 sb16-candidates (30 partial-depth + 2 messer-curriculum-gap). Packets 3-4 ran under new cadence Rules 1-6 + relay v2.1 protocol. New build tooling (scripts/sb-fix-1b-cluster-verify.mjs, sb-fix-1b-cross-packet-annotate.mjs, sb-fix-1b-augment-packet.mjs) implements Rule 2 (inline cluster verification) + Rule 5 (cross-packet hints) at build time — reusable for D1/D3/D4/D5 future audits. Cross-packet inconsistencies file now has 2 confirmed entries (BEC from packet 1; SSL stripping from packets 3/4). **SB-fix-2 IN PROGRESS 2026-05-22:** scoping signed off (`3e0480f`); scripts skeleton + SCHEMA extension `audit_d_review.sb_fix_2` (`0bc18e6`, 4 scripts: apply/build/route/backfill with --selftest fixtures, all PASS); R sub-path closed (routing build `32b29fc` + backfill `0789b95` — 17 items routed to P/G + 1 SD-WAN exit to D1/D3/D4/D5 partial-adjacent cleanup); G packet built (`8c475eb`, 3 items: 2 integer overflow + 1 HSTS) awaiting Sybex book access for chapter/section/page lookups. ~~Pool A partial-depth 40 + Pool B partial-depth 16 = 56 items pending P packets (3 packets at 20/20/16).~~ **APPLIED 2026-05-25 — P-path CLOSED at 56/56** (P1 `66783df` + P2 `e430368` + P3 `04d3eba`; Report-#0018 `5f6d672`). **Weakness-tracker IN PROGRESS 2026-05-22 (promoted to Task 1h 2026-05-25):** scoping (`84d575e`, all six Q-letters adjudicated at CC's leans + Aiden's glosses); implementation plan signed off (`9c5df20`); commit 1 sync-engine TRACKED_PREFIXES + 4 tests (`829898f`); commit 2 recordWeakness helper + 5 call-site writes + Fix A stale-closure resolution (`0b831ba`, 15 unit tests PASS). Commits 3-8 pending (ConfidenceRater UI / pause-on-blur Q-C-3 / import-export Q-F-1 / SCHEMA / docs sync / Report-#0010). **Findings backlog files (all gitignored under `.audit-working/`):** `sb-fix-1b/cross-packet-inconsistencies.md` (BEC + SSL stripping); `findings/sb-fix-2-classifier-improvements.md` (needle-extractor + umbrella-heuristic tuning); `findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md` (SD-WAN routing-out captured for future cleanup). **Autonomous chain α SHIPPED 2026-05-23 — Tasks 1-5 + close-out.** Classifier improvements: needle augmentation for mc/scen + umbrella heuristic invert + selftest infra retrofitted to cluster-verify (`51ac1ff` + `8fc51e7` + `4a3008c`). Retroactive smoke confirms tuning effective — R-packet divergence 77.8% → 11.1%, 12 diverge→agree flips, 0 regressions (`63fc015`). P1/P2/P3 packets pre-built against the 56-item partial-depth pool (P1=20 / P2=20 / P3=16; gitignored .audit-working/sb-fix-2/packet-P{1,2,3}.{md,json}). Spectre typo fixed in §2.3.8 (4 user-facing strings) + spelling-map exception added (`8f1163b`). Methodology synthesis doc shipped at `docs/audit-d-methodology-synthesis.md` covering arc timeline + cross-cutting insights + cadence-rule lineage + D1/D3/D4/D5 carry-forward (`c5b3deb`). Event-log helper bug surfaced + fixed: actual_minutes auto-computed from task_start→task_end timestamps; task_id required as join key; CLAUDE.md Rule #9 + 12-fixture test coverage (`4d82944`). All work $0 LLM spend (script + manual review + transcript grep only). **Next-session opener: Aiden's choice between (a) SB-fix-2 G review at home with Sybex book (G packet `8c475eb` ready), (b) SB-fix-2 P1/P2/P3 review at home with Sybex book (P packets pre-built this chain), (c) weakness-tracker commit 3 ConfidenceRater UI (verify q/w/e/r keyboard collision first), (d) something else. After SB-fix-2 closes: D1/D3/D4/D5 partial-adjacent cleanup (227 items + SD-WAN routing-out) follows.** **SB-fix-2 G packet session 2026-05-23:** Items 1+2 SHIPPED (`2516639`) — the §2.3.2 integer-overflow pair (cram[2] + match[2]) → `keep-with-sybex-note`, Chapple 9th Ch 6 §Buffer Overflows p.177, CompTIA objective 2.3.2 (audit-only; content unchanged). Item 3 (§2.4.9 HSTS mc[2]) HELD pending Chapter 12 Sybex practice-test data — grep confirmed SSL-stripping lives in Messer's Cryptographic Attacks video (not the cited On-path Attacks) and HSTS is absent corpus-wide, so the verdict turns on whether the citation-correction stays a note or shifts to re-cite. **Tier 1/2/3 source-grounding framework adopted** (Tier 1 = Sybex glossary first-pass screen at supervisor-side `/mnt/project/Sybex_Glossary.pdf`; Tier 2 = Sybex practice-test bank; Tier 3 = full Sybex chapter prose): applies FORWARD from the G packet; D2 and all earlier sub-batches ship under the prior LLM-as-judge + transcript-grep methodology as the documented frozen baseline (not retro-fitted). **Sybex practice-test extraction COMPLETE 2026-05-24** via Claude in Chrome — Tier 2 corpus committed at `.audit-working/sybex-practice-tests/` (18 files: ch02-17 + 2 practice exams = 500 questions; ch01 is a legacy non-deliberate run, intentionally excluded; 5 accidental matches at ch04 Q1 / ch08 Q3 / ch11 Q15 / ch12 Q17 / ch14 Q20). Unblocks: Item 3 HSTS verdict (Ch12 data now in hand), P1/P2/P3 adjudication (56 items), and the D1/D3/D4/D5 partial-adjacent cleanup (227+ items). See the 2026-05-24 session block at the end of this section and `Reports/Report-#0012.md`. **P1/P2/P3 packets (56 partial-depth items, web-fetchable at `.audit-working/relays/from-cc/sb-fix-2-packets/`) ready for supervisor adjudication under the Tier 1/2/3 framework.** GitHub Pages deploy fix shipped same day — see `Reports/Report-#0011.md` (401 Bad credentials root-caused to read-only Workflow permissions).** **2026-05-24: G PACKET CLOSED (`9eb4311`).** Item 3 (§2.4.9 HSTS mc[2]) shipped → `keep-with-sybex-note` + new `cross-source-curriculum-gap` classification (HSTS absent from Messer AND all three Sybex tiers — glossary/practice-tests/index). `sb16_subcategory` enum extended 2→3 values (`partial-depth`, `messer-curriculum-gap`, `cross-source-curriculum-gap`); `VALID_SB16_SUBCATEGORIES` in `sb-fix-1b-apply-packet.mjs` extended to match; `validate-questions.mjs` structural-only (no enum check, 6/6 selftest). See `Reports/Report-#0014.md`. Same day: Rule #9 rescoped to all supervisor-directed CC tasks (`bb4cc83`, `Reports/Report-#0013.md`); Sybex Tier 2 corpus committed (`d655a46`, `Reports/Report-#0012.md`). **2026-05-25: SB-fix-2 P-path FULLY CLOSED at 56/56** (P1 `66783df` + P2 `e430368` + P3 `04d3eba`; Report-#0018 `5f6d672`). Cumulative `chapter_level_only` 29 (P1 9 / P2 10 / P3 10; 0 from R/G); cumulative `cross-source-curriculum-gap` 5 (HSTS from G + cryptominer ×2 + skimming ×2 from P1 Group A). P2/P3 were $0 LLM (supervisor adjudication + scripted apply); cumulative Audit D spend $34.63 unchanged, credit remaining $19.08. SB-fix-2 remaining = closure documentation only. **Next Audit D work: D1/D3/D4/D5 partial-adjacent cleanup (227+ items + SD-WAN routing-out).** Sybex fold-in now tracked as **Task 1g**; weakness-tracker promoted to **Task 1h** (both added 2026-05-25 — see sections below).
2 — Mode consolidation | **sub-batches 0 + 1 + 2A + 2B + 2C shipped; 3, 4, 5 deferred behind Audit D (2026-05-13)** | 5 modes (Quiz / Flashcards / Review / Drill Wrong / Matching) per design v2 Q-E; 3 top-level tabs (Progress / Study / Exam) per Q-A. Authoritative spec at `docs/task2-design-v2.txt`. Sub-batches 0–2C complete (latest: 5ed2cbe). Sub-batches 3 (saved presets), 4 (Flashcards SM-2), 5 (cleanup) deferred until Audit D match + cram fixes ship. SchemaVersion bump NOT required (Q-I).
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
- [x] **Domain 5 complete (78 items: 60 MC + 18 scenarios, all 4 batches committed and live)**. Final Domain 5 totals: **89 → 106 MCs, 60/60 scenarios**. Target +60 MC / +18 scenarios (correcting Domain 5's high scenario ratio) hit exactly across 4 mixed batches.
  - `77a5206` — Batch 1: 14 MC + 6 scen across §5.1 + §5.2.
  - `062781c` — Batch 2: 17 MC + 4 scen across §5.3 + §5.4.
  - `3f40fc1` — Batch 3: 12 MC + 8 scen across §5.5 + §5.6.
  - `4851623` — Batch 4: 17 MC fill batch across §5.1 (×6) + §5.2 (×7) + §5.5 (×2) + §5.6 (×2). No scenarios (target already met at 60/60).
- [x] **Domain 4 complete (55 items: 32 MC + 23 scenarios across 2 batches, committed and live)**. Final Domain 4 totals: **84 → 116 MCs, 73 → 96 scenarios**. Original target was +40 MC / +25 scen — finished at +32/+23 (gap accepted; coverage hits all priority confusables). The §4.4.1/§4.9.1 NTP duplicate was resolved in Batch 2 by replace-in-place at §4.4.1 MC[3] (preserves SM-2 indices; new content = continuous-monitoring vs periodic-scanning). The §4.9.1 NTP MC[0] kept as the canonical NTP-in-log-analysis question.
  - `bcded87` — Batch 1: 25 items (15 MC + 10 scen) across §4.1, §4.2, §4.3, §4.4, §4.5, §4.6, §4.7, §4.8 — confusables: WPA3 Personal/Enterprise, CVSS metric groups, SIEM/SOAR, SAML/OAuth/OIDC, HIDS/HIPS/EDR, FIDO2 origin binding, IR exercise types.
  - `3bcae44` — Batch 2: 30 items (17 MC + 13 scen across all sub-objectives, including 1 in-place replacement at §4.4.1 MC[3] for the NTP duplicate) — confusables: BYOD/COPE/CYOD, patch/compensating/accept/avoid, DMARC progression, DLP positioning, NIST 800-63B, PAM/PASM/PEDM, RCA frameworks, syslog severities, log retention tiers.
- [x] **Domain 2 BEST/MOST rewrites complete (35 items across 2 batches: Batch 1 = 19 items at commit `4b3d24b`; Batch 2 = 16 items at commit `fe02ffc`)**. Final cohort 35 vs original ~40 estimate (gap accepted; cohort defined by quality candidates per the C+D + Tier 2 audit, not arbitrary number-hitting). Used the same REPLACEMENTS in-place pattern as the §4.4.1 NTP cleanup — SM-2 indices preserved across all rewrites. All 35 items added `messerVideo` + `subObjective` citations on what were previously legacy-uncited items, dropping the legacy-no-citation info count from 709 → 674.
  - Batch 1 (`4b3d24b`): 9 sub-pattern C (discrimination "X differs from Y in that:") + 10 strongest sub-pattern D (judgment / "primarily because:") items. Includes 2 c2 scenario reframings (supply chain, shoulder surfing). Audit script at `scripts/audit-domain2-rewrite-candidates.mjs` staged with this commit.
  - Batch 2 (`fe02ffc`): 14 remaining sub-pattern D + 2 Tier 2 (zero-day definition, WPS mitigation). Includes 2 c2 scenario reframings (DNS amplification, high-CPU IoC).
- [x] **TASK 1b COMPLETE.** All 5 domains addressed: Domain 1 scenarios (25), Domain 5 (78), Domain 4 (55), Domain 2 BEST/MOST (35) = **193 items added or modified**.
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

### Domain 5 batch applier scripts

- `scripts/add-domain5-batch1.mjs` — 14 MC + 6 scen across §5.1.1–§5.1.5 and §5.2.1–§5.2.4 (committed `77a5206`).
- `scripts/add-domain5-batch2.mjs` — 17 MC + 4 scen across §5.3.1, §5.3.2, §5.4.1, §5.4.2 (committed `062781c`).
- `scripts/add-domain5-batch3.mjs` — 12 MC + 8 scen across §5.5.1, §5.5.2, §5.6.1, §5.6.2 (committed `3f40fc1`).
- `scripts/add-domain5-batch4.mjs` — 17 MCs closing the +60 MC target (committed `4851623`). Per-video: 5.1.1 ×1, 5.1.2 ×1, 5.1.3 ×1, 5.1.4 ×2, 5.1.5 ×1, 5.2.1 ×2, 5.2.2 ×2, 5.2.3 ×2, 5.2.4 ×1, 5.5.1 ×1, 5.5.2 ×1, 5.6.1 ×1, 5.6.2 ×1. Topics: guidelines-vs-procedures, defense-in-depth recognition, regulation-to-data-type mapping, data classification levels, inherent-vs-residual risk, risk appetite vs tolerance, KRIs leading vs lagging, MTBF vs MTTR, SOC 1/2/3 audience matching, SAST/DAST/IAST, phishing repeat-offender metric, JIT training trigger pattern. Validator post-apply: 0 errors (unchanged baseline). Live bundle verified clean.

All Domain 5 scripts are idempotent (skip on stem-prefix match). Safe to re-run.

### Domain 4 batch applier scripts

- `scripts/add-domain4-batch1.mjs` — 25 items (15 MC + 10 scen) across §4.1.2, §4.1.4, §4.2.1, §4.3.1, §4.3.4, §4.4.1, §4.4.2, §4.5.1, §4.5.4, §4.5.5, §4.5.7, §4.6.1, §4.6.2, §4.6.3, §4.7.1, §4.8.1, §4.8.2 (committed `bcded87`).
- `scripts/add-domain4-batch2.mjs` — 30 items (17 MC + 13 scen) including 1 REPLACE-in-place at §4.4.1 MC[3] (NTP duplicate cleanup). New REPLACEMENTS array in this script does a safety-checked in-place overwrite (refuses to apply if the target slot does not hold the expected old NTP stem, so re-runs are safe). Per-video distribution covers §4.1.2, §4.1.3, §4.2.1, §4.3.1, §4.3.4, §4.3.5, §4.4.1, §4.5.2, §4.5.5, §4.5.6, §4.5.7, §4.6.1, §4.6.2, §4.6.4, §4.7.1, §4.8.1, §4.8.2, §4.8.3, §4.9.1. Heavy §4.9.1 emphasis (5 items) addresses the previously-thin Security Data Sources sub-objective. Committed `3bcae44`.

All Domain 4 scripts are idempotent (insertions skip on stem-prefix match; replacements skip on already-replaced detection or refuse on unexpected stem). Safe to re-run.

### Domain 2 rewrite scripts

- `scripts/audit-domain2-rewrite-candidates.mjs` — tiered audit (committed `4b3d24b`). Categorizes Domain 2 MCs into Tier 1 (high-confidence rewrite wins, with sub-patterns C-discrimination / D-judgment / A-terminology / B-mechanism), Tier 2 (judgment-amenable, no asymmetry), Tier 3 (objective-mechanism — would not benefit). Used to identify the 35-item rewrite cohort.
- `scripts/rewrite-domain2-batch1.mjs` — 19 in-place REPLACEMENTS across §2.1.1, §2.2.1, §2.2.2, §2.2.5, §2.3.6, §2.3.9, §2.3.10, §2.3.11, §2.4.1, §2.4.4, §2.4.5, §2.4.10, §2.4.12, §2.4.14, §2.5.1, §2.5.3 (committed `4b3d24b`).
- `scripts/rewrite-domain2-batch2.mjs` — 16 in-place REPLACEMENTS across §2.3.4, §2.3.5, §2.3.8, §2.3.9, §2.3.12, §2.3.13, §2.3.14, §2.4.1, §2.4.3, §2.4.6, §2.4.8, §2.4.11, §2.4.14 (×2), §2.4.15, §2.5.2 (committed `fe02ffc`).

All Domain 2 rewrite scripts are idempotent (refuse to apply if the target slot does not hold the expected old stem prefix; skip if already replaced). Safe to re-run.

### Validator: `--path=` flag

`scripts/validate-questions.mjs` was extended in Batch 1 (commit `bcded87`) with an optional `--path=<file>` argument so it can validate an arbitrary JSON file. Used by both Domain 4 batch scripts via their `--preview` mode to validate proposed changes against `/tmp/questions-d4bN-preview.json` before any commit, preserving the "validate → review → apply" order.

## Task 1.5 — Cross-device sync via private GitHub Gist (complete, deployed)

**Shipped 2026-04-25** across three commits with per-batch user review and real-device verification:

- `39012e7` — 1.5a: prominent header Backup button, `secplus-backup-YYYY-MM-DD.json` filename, `secplus-last-backup-at` stamp, weekly reminder banner.
- `4ddddd4` — 1.5b: sync engine (`src/sync/sync-engine.js`, ~590 LOC), 34 tests including 5 two-engine integration scenarios. **Includes the joining-device guard**, added in response to a real-device bug (2026-04-25): on a second device's first `setConfig`, the React app's first-mount DEFAULT_STORE write was being stamped with "now" and silently overwriting the cloud. Guard detects "first sync + local has tracked keys + remote has tracked keys" and adopts cloud state without pushing.
- `a05b762` — 1.5c: Sync settings UI (`src/sync/SyncSettings.jsx`), header status pill, footer link, reload-after-setConfig, force pull/push with confirmation dialogs.

Real-device verification: two-browser-profile round-trip + joining-device test passed under the deployed UI. Aiden will do additional real-device testing on phone(s) outside-session; bugs found there will be follow-up commits.

### Engine summary (canonical reference: `src/sync/sync-engine.js` and SCHEMA.md "Cross-device sync")

- `TRACKED_PREFIXES = ["mc-", "scen-", "match-", "secplus-"]`
- `LOCAL_ONLY` (deny-list, overrides allow-list):
  - prefix `"secplus-sync-"` — PAT, Gist ID, sync metadata
  - exact `"secplus-last-backup-at"` — per-device backup timestamp
  - exact `"secplus-backup-banner-snooze-until"` — per-device snooze
- Gist payload `schemaVersion: 1` — bump only if payload shape changes (Task 2's mode consolidation does NOT necessarily trigger one).
- Per-key latest-timestamp-wins merge with local-wins tie-break.
- 5 s debounce, 2 s scanner, ETag pulls, retry backoff `5s → 15s → 60s → 300s → 600s`, 401/403/404 → permanent stop.
- Joining-device guard: first `setConfig` with both local and remote populated → adopt remote, do not push.
- DevTools handle: `window.__secplusSync` exposes the full API.

### Original design (kept for reference)


Goal: keep SM-2 progress, watched-video state, and other app data in step
across the user's three devices, using a per-user PAT against a single
private Gist as the backing store. Inserted ahead of Task 2 so progress
already syncs before Task 2's localStorage migration runs.

### Agreed design constraints (from session opening)

- No encryption of Gist contents.
- No password gating on the sync setup screen.
- Each device authenticates with the user's own PAT.
- Latest-timestamp-wins conflict resolution at **per-key** granularity, not whole-blob.
- Manual PAT entry — no QR pairing.
- Silent retry on failure; degraded banner only after >60 min without success.
- **Push policy** (revised 2026-04-25): commit and push after each sub-batch passes review, so the live Pages site is always current. Real-device testing happens at 1.5c against the deployed site; bugs found there go in a follow-up commit. Safety preserved by: `npm run build` clean before any commit, two-browser-profile sync test passes locally before 1.5b commit, sync hidden behind Settings → Advanced (opt-in, so non-PAT users see no functional change).

### Pre-flight — synced keyspace decision

`SCHEMA.md` notes that SM-2 keys are `mc-{videoId}-{qi}`, `scen-…`, `match-…`
(no `secplus-` prefix). The umbrella state is `secplus-v4`. The engine
therefore syncs a fixed **prefix list** rather than the literal `secplus-`
prefix:

- `TRACKED_PREFIXES = ["mc-", "scen-", "match-", "secplus-"]`
- `LOCAL_ONLY` (deny-list — overrides tracked list):
  - prefix `"secplus-sync-"` — PAT, Gist ID, sync metadata
  - exact `"secplus-last-backup-at"` — per-device backup timestamp (added in 1.5a)
  - exact `"secplus-backup-banner-snooze-until"` — per-device snooze (added in 1.5a)
  - The engine treats `LOCAL_ONLY` as a list of `{prefix?: string, exact?: string}` entries.

This avoids touching existing user progress during 1.5. (Alternative: rename
SM-2 keys to `secplus-mc-` etc. — rejected because it requires a
SCHEMA_VERSION bump and a per-device migration with no functional benefit.)

### Gist payload schema (versioned)

```jsonc
{
  "schemaVersion": 1,
  "deviceId": "<random-uuid>",       // stamped at first push
  "lastWriteAt": "2026-04-25T...",
  "entries": {
    "mc-1.1.1-0": { "value": "<original JSON-string>", "ts": "ISO" }
  }
}
```

`value` is the verbatim string the React app already wrote to localStorage,
so the engine stays value-agnostic. Bumping `schemaVersion` is required only
if the payload shape itself changes — Task 2's mode consolidation does not
necessarily trigger one (new keys appear, but the shape holds).

### Sub-batch 1.5a — Backup polish (~half-day)

Useful regardless of sync; benefits the user even if sync is never enabled.

- [ ] Prominent **Backup** button on main menu (not buried in Settings).
- [ ] Export filename: `secplus-backup-YYYY-MM-DD.json`.
- [ ] Stamp `secplus-last-backup-at` on every successful export.
- [ ] Banner if no backup in ≥7 days: "Last backup was N days ago — back up now?" Dismissable for 7 more days.
- [ ] Existing import path untouched.

Files: `src/secplus-quiz.jsx`. `npm run build` clean. Checkpoint before 1.5b: diff summary + UI walkthrough; user clicks backup once.

### Sub-batch 1.5b — Sync engine (no UI; ~1 day)

New module. Built and tested in isolation before any UI hooks it up.

Public API (from `src/sync/sync-engine.js`):

```js
initSync(); getStatus(); triggerPush(); setConfig({pat, gistId});
clearConfig(); createGist(); subscribe(cb);
```

Mechanics:

- Per-key `localTs` kept in `secplus-sync-meta` (local-only).
- Scanner every 2 s diffs current localStorage values vs last snapshot; changed keys get `localTs = now`.
- **On load**: pull → merge per-key latest-ts wins → write remote winners back to localStorage → push merged.
- **On change**: 5 s debounced PATCH `https://api.github.com/gists/{gistId}` with `{ files: { "secplus-sync.json": { content } } }`.
- **Retry**: 5 → 15 → 60 → 300 → 600 s ceiling. Silent.
- **Health**: `degraded` if no success in 60 min. Surfaced by 1.5c.
- **Errors**: 401/403/404 → stop retrying, set `lastError`, wait for config change.
- ETag caching on GET.

Tests:

- Pure-function merge unit tests (Vitest if present, otherwise `node --test`).
- Manual: two browser profiles, same PAT + Gist. Edit in A → check B. Simultaneous edits → newer wins.

Files: `src/sync/sync-engine.js`, `src/sync/__tests__/sync-engine.test.js`. No UI. Engine dormant until 1.5c provides config (or until devtools call `window.__secplusSync.setConfig(...)`). Checkpoint before 1.5c: walk through merge, show test output, manual devtools validation on one device.

### Sub-batch 1.5c — Sync UI (~half-day)

- Footer entry: **Settings → Advanced → Sync**.
- Form: PAT (`type="password"` with show/hide), Gist ID (+ **Create new private Gist** button), Enable/Disable toggle, **Test connection** button.
- Main-menu status indicator:
  - Green + "Synced HH:MM" (success <60 min ago)
  - Yellow + "Sync degraded" (success >60 min)
  - Red + error (401/403/404)
  - Hidden when disabled.
- **Sync now** manual flush.

Files: `src/secplus-quiz.jsx` (and possibly `src/sync/SyncSettings.jsx`). Checkpoint: enable on ≥2 real devices, confirm round-trip. Only then commit and push.

### Risks / open questions

- **PAT in plaintext localStorage**: acceptable per stated constraints. Surface to the user one more time in the 1.5c UI ("This token is stored unencrypted on this device").
- **Gist file size cap (1 MB)**: well under for the personal namespace.
- **Rate limits**: 5000 req/hr per PAT. Debounce keeps us at single digits/hr.
- **Task 2 interaction**: when mode consolidation rewrites localStorage, the engine sees new/missing keys; no `schemaVersion` bump needed unless the payload shape itself changes.

## Task 1c — split into structural and experiential

Originally a single task ("anchor questions + grounding audit"); split 2026-04-27 into two halves with different priorities after the citation-backfill phase exposed that the audit signal was noise-dominated by extractor quality rather than true misfiles.

### 1c-structural — Citation backfill + grounding/anchor-gap audits

**Citation backfill — DONE 2026-04-26.** All 867 questions across 5 domains now carry `messerVideo` + `subObjective`. Validator legacy-no-citation count: 728 → 0. Per-domain commits: D1 `c08720a`, D2 `407575d`, D3 `7e799b7`, D4 `5f675ae`, D5 `f8f5c44` (+ prep commit `2b01a36`).

**Audit infrastructure — built but bottlenecked.** Scripts shipped:
- `scripts/fetch-messer-transcripts.mjs` — pulls all 121 transcripts from professormesser.com; cache at `.messer-transcripts/` (gitignored, 935 KB); idempotent.
- `scripts/audit-video-grounding.mjs` — checks whether each question's central concept appears in its cited transcript.
- `scripts/audit-anchor-gaps.mjs` — extracts concepts from each transcript and checks if a recall question exists.
- `scripts/backfill-citations.mjs` — generalized from a Domain-1-only earlier version; takes `--domain=N`.

**Audit signal — noise-dominated.** Aggregate grounding audit across 867 questions: 125 PASS / 230 LOW / 454 MEDIUM / 58 HIGH (7%). Spot-checks of 30/58 HIGH flags across all 5 domains found **zero true misfiles**. Same shape on the anchor-gap side (Domain 1 reported 166 unanchored concepts but the extracted "concepts" included prose connectors like "These", "Another important control type").

**Extractor tuning — pending; deprioritized 2026-04-27.** Lower priority than 1d/1e because the grounding side mostly produces negative-confirmation (we already know misfiles are rare). The anchor-gap side has more value but is bottlenecked by the same extractor. Resume options when picked back up:
  - (A) Tune extractor to handle `X means:` / `X is used to:` / `X requires:` patterns; multi-word phrases before linking verbs; strip extracted clauses to noun heads; filter stop-words.
  - (B) Pivot to vocabulary-overlap grounding (count what fraction of question vocabulary appears in cited transcript). Less precise, lower false-positive rate.
  - (C) Skip grounding entirely; treat anchor-gap as the productive output and tune only its extraction path.

### 1c-experiential — Anchor-gap fixes (recall questions per video)

Once the extractor produces clean signal, generate ~150-250 "what is X?" / "X is used for which purpose?" recall-anchor questions across videos the audit flags as under-anchored. The current catalogue is heavy on discrimination and BEST/MOST application scenarios; learners need a recall anchor before being thrown into discrimination.

- Per-video target: at least 1 recall-anchor per Messer video that introduces a discrete concept.
- Anchors should be tagged so Task 2's Flashcards mode can pull them while Quiz mode pulls discrimination/scenarios. Tagging design lives in SCHEMA.md (TBD when 1c-experiential starts).
- Should land before Task 2 so the Flashcards mode has content to draw from on day one.

## Task 1d — Catalogue quality audit + fixes (NEW, 2026-04-27, **highest priority**)

Triggered by 2026-04-27 study session findings: length-tell distractors (correct answer noticeably longer/shorter than distractors, leakage of answer via length cue) and weak/filler distractors are actively undermining current study. Aiden has raised the broader "review the catalogue" concern multiple times.

**Approach:** audit first, fix second. The audit script produces the diagnostic picture; Aiden reviews and decides scope/priority for fix batches. No content modification in this step.

### 1d.1 — Audit script

`scripts/audit-catalogue-quality.mjs` — catalogue-wide across all 5 domains, flagging:

1. **Length-balance violations** — max/min option-length ratio > 1.5×, with severity buckets and correct-vs-distractor outlier distinction (so we can tell whether the correct answer or a distractor is the outlier).
2. **Distractor quality issues** — under 15 chars, filler distractors (e.g. "All of the above", "None of these"), sentence fragments, options that don't parse as a complete answer to the stem.
3. **Stem quality issues** — recall-only stems on judgment-amenable topics, grammatical issues, colon-ended legacy patterns ("X differs from Y in that:" without BEST/MOST framing).
4. **Cross-question duplication** — pairs of questions with > 70% stem-word overlap (Jaccard or token-set similarity).
5. **Correct-answer position bias** — statistical distribution of `a` (0/1/2/3) across all MCs catalogue-wide and per-domain. A truly randomized catalog should be ~25% each; large deviations suggest position bias.

**Output:** per-dimension flag counts catalogue-wide and per-domain, severity breakdowns (high/med/low), samples of worst offenders per dimension, estimated fix scope per dimension.

**Quality bar:** idempotent, no destructive ops, fast (pure JSON walk, no transcript dependency), `--domain=N` filter, `--details` for per-issue dump.

### 1d.2 — Fix batches (in progress)

#### Sub-batch 1 — position bias + Pattern A length-tell (shipped 2026-04-27)

- `1f6d022` — catalogue-wide hash-based position shuffle. MC χ² 553→1.79; scen χ² 625→5.84.
- `eb9581f` — CLAUDE.md rule 8 added (future generation scripts must use hash-based position assignment).
- `a4405fb` — 95 Pattern A length-tell items: definitional gloss relocated from option to explanation.
- 1 item (mc-5.5.1-1) held back in `HOLD_BACK` array of `fix-pattern-a-length-tells.mjs`.

#### Sub-batch 2 — short-distractor padding (complete, 2026-04-30)

Cohort definition: items with option-length ratio > 1.5× AND at least one distractor < 30 chars. Audit at `scripts/audit-short-distractor-cohort.mjs` (1/2/3 short-distractor categories, source-tagged via git compare against `a4405fb~1`).

Per-sub-objective pattern (used through §1.2/§1.4/§2.3/§2.4/§2.2/§4.5):
- Pull cohort → classify per-item → author distractors → validator-clean preview → side-by-side review → user approves → `--write` → real validator → build → commit → push → Pages live spot-check.

Conventions established:
- **Convention A** — expand all 4 options to "TLA (expanded form)" or "Term — explanatory tail" pattern when acronym/term discrimination is exam-tested.
- **Convention B holdback** — accept short-on-short symmetry when terms are complete category names (CIA components, hashing algorithms, malware-type names, password-attack names, etc.).
- **Convention B-edit** — small distractor edits to balance length under preserve-correct rule.
- **Plausible-AND-false rule** — distractors must be wrong-but-believable, not real-correct-but-not-best (added 2026-04-28 §2.4 review-2).
- Length target ≤1.5× ratio ideal; explicit code-comment ratio-acceptance for analytical scenarios with paragraph-length correct (e.g., scen-2.3.10-1 at 268 chars).

Ships to date:

| Sub-obj | Cohort | Modified | Holdbacks | Commit |
|---------|--------|----------|-----------|--------|
| §1.2    | 18     | 5        | 13        | `80246d9` |
| §1.4    | 20     | 11       | 9         | `adfc5fa` |
| §2.3    | 28     | 26       | 2         | `3d77f8b` |
| §2.4    | 28     | 24       | 4         | `671e80c` |
| §2.2    | 15     | 10       | 5         | `83b0ef5` |
| §4.5    | 16     | 16       | 0         | `4e88da0` |
| Mega-pass (21 sub-objs) | 143 | 124    | 19        | `116cd40` |
| **TOTAL (27 sub-objs)** | **320** | **216** | **52** |        |

Mega-pass at `116cd40` (2026-04-30) closed §1.1, §1.3, §2.1, §2.5, §3.1–§3.4, §4.1, §4.3, §4.4, §4.6–§4.9, §5.1–§5.6 in one comprehensive review document and one ship. The per-sub-objective rhythm of the first 6 batches was preserved as the review-and-author cadence; the ship was consolidated. 53 residual cohort items remaining are all intentional Convention B holdbacks (52) + 1 out-of-scope §4.2 item.

**10 follow-up items** flagged for a separate content-quality pass (out of distractor-padding scope), tracked in / to be added to `TODO-content-quality.md`:
- 3 prior items (already in TODO-content-quality.md): `mc-2.4.14-2` (MOST framing ambiguity), `scen-2.2.5-0` (vishing dimension missing from correct answer), `mc-2.2.5-2` (verbal-only distractors for physical-technique question).
- 2 mega-pass TODOs: `mc-3.2.5-1` vs `mc-4.5.1-2` (duplicate WAF stem), `mc-4.2.1-1` (§4.2 cohort item out of mega-pass scope).
- 5 deferred Convention A expansions: `mc-1.3.2-0`, `mc-4.1.2-2`, `mc-4.6.1-0`, `mc-4.6.1-2`, `mc-4.7.1-0`.

#### Sub-batch 3 — Tentative content-quality follow-up pass (not started; not next priority)

Captures the 10 items deferred from Sub-batch 2 review. Lower priority than Task 1e and the practice-test-gap content additions; will likely interleave rather than land as a single ship.

- **5 Convention A expansions** (deferred during mega-pass for "future content-quality pass" rather than padded in scope): `mc-1.3.2-0` (Allow listing), `mc-4.1.2-2` (IoT segmentation, correct "Network segmentation" 20 chars), `mc-4.6.1-0` (SSO benefit, correct "Centralizing authentication" 27 chars), `mc-4.6.1-2` (Permission creep, correct "Regular access reviews" 22 chars), `mc-4.7.1-0` (Automation benefit, correct "Speed and consistency" 21 chars). All have intrinsically-short correct options that need full TLA-expansion or term-with-tail rework.
- **2 mega-pass TODOs** (surfaced 2026-04-30): `mc-3.2.5-1` vs `mc-4.5.1-2` — duplicate WAF stem (pick one, repurpose the other); `mc-4.2.1-1` — §4.2 cohort item out of mega-pass scope (1 padding still pending).
- **3 prior content-quality items** already documented in `TODO-content-quality.md`: `mc-2.4.14-2` (MOST framing ambiguity), `scen-2.2.5-0` (vishing dimension missing from correct answer), `mc-2.2.5-2` (verbal-only distractors for physical-technique question).

## Task 1e — New-content prioritization (NEW, 2026-04-27)

Triggered by 2026-04-27 study session: app currently surfaces a "N new things to try" count with no way to see them or prioritize them. Aiden ends up replaying already-seen content because there's no "show me the unseen ones" path.

**Scope:** smaller than Task 2's full mode consolidation. ~1-2 hours. Two implementation paths to choose between:

- **Option A — Separate "New" mode**: a new top-level mode that pulls only unseen-from-watched-videos items. Easy to reason about, but adds another mode just before Task 2 collapses modes anyway.
- **Option B — Existing modes prioritize unseen**: when an existing mode has unseen items available from videos Aiden has marked watched, surface those first. Less disruptive, no new top-level surface, and naturally subsumed by Task 2's customise drawer later.

**Recommendation (subject to Aiden's call):** Option B, because Task 2 will collapse modes anyway. Adds a "prefer unseen" toggle to existing modes' query.

**Done when:** the daily "N new things to try" count actually translates into Aiden seeing those N things in his next session without manual hunting.

## Task 1f — Audit D: citation grounding (NEW, 2026-05-13, **highest priority**)

Detailed plan: **`docs/audit-d-scoping.md`** (committed `78b3a3c`).
This section is a pointer; do not duplicate the scoping doc here.

**Trigger:** Sunday 2026-05-10 study session. §2.3.3 (Race Conditions)
matching tests "Mutex" and "Atomic operation" as concurrency
primitives. Verified absent from `.messer-transcripts/race-conditions-sy0-701.txt`
(which covers race condition + TOCTOU with bank-transfer / Mars
Spirit / Tesla Pwn2Own examples) and from the SY0-701 2.3 objective
text. The §2.3.3 cram set has the same content. Aiden has confirmed
multiple unflagged instances exist beyond this example.

**Why this fills a real gap:** the April 27 grounding audit ran on
867 MC + scen items and found zero true misfiles in 30 spot-checks
— that finding is still correct for the audited corpus. But matching
(580 items) and cram (671 items) carry no per-item citation, were
out of scope for that audit, and have **never been grounded**.
Audit D fills that specific gap with corrected methodology
(LLM-as-judge with transcript-as-context, not keyword extraction).

**Eight decisions signed off 2026-05-13** (full text in scoping doc):

- **D1** Method: hybrid keyword pre-screen + LLM-as-judge + Aiden arbitration.
- **D2** Corpus: match + cram, with 30-item calibration including some MC + scen to re-verify April 27 cleanness.
- **D3** Source-authority hierarchy: CompTIA → Messer → Sybex → secondary (NIST / ISO / OWASP).
- **D4** Decomposition: pre-flight PLAN.md amendment → Sub-batch 0 calibration → per-domain verdict sub-batches → per-cluster fix sub-batches → closure.
- **D5** Order vs Task 2: Audit D first; Sub-batches 3-5 deferred. Exception: if Audit D drags 2-3 weeks, Sub-batch 4 may interleave.
- **D6** Verdict shape: 6-way split (in-source / partial-depth / partial-adjacent / out-of-source / out-of-syllabus / ambiguous-call) + confidence + fix-direction tags (rewrite-to-source / move-to-correct-video / remove-from-catalog / mark-for-Sybex-arbitration / keep-as-enrichment).
- **D7** Keyword-screen scope: parent-video only.
- **D8** Cram handling: verdict-as-data inclusive, advisory-only fixes.

**Three additions (Aiden, 2026-05-13)** baked into the scoping doc:

1. **Calibration smoke test.** The 30-item calibration MUST flag the §2.3.3 mutex / atomic case as out-of-source. If it doesn't, the pipeline is broken; do not expand scope.
2. **R7 mitigation (audit-study collision).** Aiden is currently studying. Strategy A (ship fixes during study breaks aligned to current domain) vs Strategy B (single end-of-audit ship over a non-study weekend); decision point after calibration.
3. **R8 enrichment-vs-misfile distinction.** Out-of-source verdicts do NOT auto-route to remove-from-catalog; they route to Aiden, who may pick `keep-as-enrichment` for content like mutex/atomic that he added deliberately.

**Mid-sub-batch revision (2026-05-13, during Sub-batch 0):** the calibration blind reviewer is **supervisor-Claude** (a separate Claude.ai conversation), not Aiden. Two independent LLM readers measuring agreement is the methodology check. Aiden's role for Sub-batches 1+ as human arbiter on HIGH flags (CompTIA PDF + Sybex book + study perspective) is unchanged. See scoping doc § "Revision 2026-05-13".

**Relationships to other planned work:**

- Audit A (structural option consistency): shipped 2026-05-04 to 2026-05-05. Out of scope here.
- Audit B (semantic coherence): **subsumed into Audit D**. Partial-depth + out-of-source verdicts capture semantic coherence failures.
- Audit C (length-ratio re-run): **deferred indefinitely**. Re-trigger only if Aiden surfaces length-tell complaints during study.
- Task 1c-structural (grounding/anchor-gap audits): **superseded by Audit D**.
- Metacognitive feature #4 (PBQ format audit, tracked 2026-05-10): **kept separate**. Different shape (format vs content). Run after Audit D.
- Task 2 Sub-batches 3, 4, 5: **deferred behind Audit D** per D5.
- Task 3 (PBQ system): runs after Audit D so PBQ authoring operates on a content-correct corpus.

**Sub-batch 0 SHIPPED 2026-05-13.** Tooling built (5 scripts:
`audit-d-sample.mjs`, `audit-d-keyword-screen.mjs`,
`audit-d-llm-judge.mjs`, `audit-d-build-review.mjs`,
`audit-d-ingest-supervisor.mjs`), 30-item calibration run
executed at $0.32 / $5 budget, smoke test PASSED at both
stages (§2.3.3 mutex+atomic flagged out-of-source by both
readers). Two independent LLM readers: script (Sonnet 4.5 via
API) + supervisor-Claude (separate Claude.ai conversation per
mid-sub-batch revision). **Strict 6-way agreement 76.7% (below
85%); collapsed agreement 86.7% (above 85%).** Per Aiden's
spec, this supports the "prompt tuning needed but methodology
sound" interpretation. Outcome doc at
`docs/audit-d-calibration-summary.md`; session report at
`Reports/Report-#0002.md`.

**Sub-batch 1 pre-flight SHIPPED 2026-05-14 at `aa32fad` (iteration 1 of N).** Tuned `audit-d-llm-judge.mjs` (255→461 lines) per the 4 recommendations from the calibration summary + 5 new scripts (microrecal-sample / supervisor-packet / metrics / regression-sample / regression-metrics) + `Reports/Report-#0003.md`. Spend $0.97 this session; cumulative Audit D $1.29 of $53.71 (~2.4%; API credit topped up mid-session). Six API runs across iter0 (12 items) + iter1 (12 items) + iter1 regression (23 items) + iter0 regression (23 items).

Outcomes per Rec:
- **Rec 2 partial-depth a/b/c examples** — LANDED. 3/3 targeted Subset 1 shifts (rows 5 DHE, 11 PCI DSS, 30 PCI pen test). Minor over-shift on 2 regression items (in tolerance).
- **Rec 4 verbatim-quote rule + ambiguous-call escape, single-retry mode 2** — LANDED. Paraphrase rate 27% (SB0 baseline) → 8.3% (iter0 micro-recal). Retry budget cap (+30%) never approached.
- **Prompt cache** (cache_control: ephemeral on system block) — LANDED. 100% hit rate after first call across micro-recal + regression. D-E caveat verified.
- **Rec 1 partial-adjacent strengthening** — DEFERRED to Sub-batch 1.5. iter0 produced 0 partial-adjacent verdicts. iter1 (reorder + decision-tree + consistency check) lifted to 4/12 but broke smoke test (3/4 §2.3.3 mutex/atomic items shifted) and caused 10/23 strict regressions on the regression-sample → rolled back. Architectural insight: LLM's `fix_direction` is a more reliable intent signal than `category` label (3 iter0 verdicts had `category: out-of-source` + `fix_direction: move-to-correct-video` — the LLM understands partial-adjacent but training prior overrides at category-stamping). Future: post-process script flips category to partial-adjacent when fix_direction is move-to-correct-video — separates LLM judgment from category-label mechanics. ~5 lines, no LLM call.
- **Rec 3 confidence calibration** — ACCEPTED AS LIMITATION. 12/12 high on iter0; soft prompt instructions don't bite; hard quotas would distort signal. Revisit only if full corpus surfaces real problems.

Pass-criteria status (iter0 shipping):
- PASS regression strict 2/23, smoke held, paraphrase 8.3%, cache 100%, Subset 2 strict 3/5
- FAIL Subset 1 strict 3/6 (need ≥5/6) — Rec 1 not biting
- FAIL Subset 2 collapsed 3/5 (need ≥4/5) — Rec 1 not biting

**Sub-batch 1.5 SHIPPED 2026-05-18.** `scripts/audit-d-postprocess-verdicts.mjs` (~140 lines incl. comments; idempotent; `--input` / `--output` CLI args). Spot-check on iter0 micro-recal: 3 flips on subset-1-disagree rows (§2.3.10 mc[0] shared-responsibility / §3.3.3 match[0] / §4.8.2 match[3]) — matches the predicted rows 10, 19, 24 from Report-#0003. Subset 1 strict 3/6 → **6/6** (D-H still excluded; predicted 5/6 or 6/6). Subset 1 collapsed held at 6/6. Subset 2 strict unchanged 3/5 (residuals are §1.2.2 cram[4] HMAC and §5.4.2 mc[6] CCPA — neither had fix_direction=move-to-correct-video, exactly as predicted). Internally inconsistent verdicts: **3 → 0**. On the 23-item regression sample: 2 additional flips (§2.3.9 match[2] hypervisor types / §2.3.2 cram[2] integer overflow) — both verdicts had iter0 prose explicitly identifying partial-adjacent reasoning ("belongs in a different Messer video") so these read as SB0-supervisor-too-conservative on those rows rather than script error. **Smoke-test invariant (§2.3.3 mutex/atomic) HELD** — those items had fix_direction != move-to-correct-video so the postprocess correctly left them alone. $0 cost (no LLM call).

**Sub-batch 1 full corpus — SHIPPED 2026-05-19.** Pre-flight signed off 2026-05-18 with scope=match+cram+MC+scen (N=2128 sample-sampled), model=sonnet-4-5 (no SB1.5 cross-run), HARD_CAP=3000, mid-projection $30 / stretch $45 under $60 ceiling. First attempt 2026-05-18 halted at call #688 / $7.42 due to laptop travel (no on-disk verdicts — sunk; resume patch `a4a30c3` retrofitted same day, smoke-tested 0-API on fake-complete fixture). **Fresh run 2026-05-19 on the resume-capable script completed cleanly: 2,492 API calls (2,128 verdicts + 364 verbatim retries), $25.9170 spent (under mid-projection), 100% cache hit rate after first call (2,491/2,491), 15 round=0 malformed-JSON errors all recovered on round=1 → zero items missing verdicts.** ~3h wall-clock, ~9 verdicts/min. The first periodic-flush event at verdict #50 was disk-verified before relying on the resume path for the rest of the run.

**Postprocess applied via `audit-d-postprocess-verdicts.mjs` (with relative-path workaround `../audit-d-sub-batch-1/...` — script hardcodes PREFLIGHT_DIR, ~5-min cleanup queued): 412 flips (19.4% of verdicts) — 406 out-of-source → partial-adjacent + 6 partial-depth → partial-adjacent. SB1.5 architectural fix validated at scale.** Per-domain flip rates: D1=10.0%, D2=31.2% (driver — threats/vulns span multiple §2.x videos), D3=22.2%, D4=16.5%, D5=9.9%. Post-flip category distribution: 47.3% in-source / 19.9% partial-adjacent / 18.8% partial-depth / 13.9% out-of-source (vs raw 47.3 / 0.6 / 19.0 / 33.0 — catalogue grounding profile is materially healthier than raw category labels suggested). Per-type verbatim-retry rate: scen=30.4% (driver, explains gap from iter0's 8.3%), mc=17.7%, cram=14.3%, match=11.9%, total=17.1%. Confidence 96.5% high (accepted as a one-bucket signal at current prompt design).

**Stratified spot-check packet (40 items, mulberry32 seed `20260519`): 15 partial-adjacent / 15 out-of-source / 5 in-source / 5 partial-depth.** Artefacts at `.audit-working/audit-d-sub-batch-1/spotcheck-packet-v1.{json,md}` (generator: `build-spotcheck-packet.mjs`, seed reproducible). **Supervisor review PASS at 75% strict agreement (30/40), matching SB0's 76.7%.** Per-stratum: partial-adjacent 10/15 confident-agree + 5 uncertain + 0 disagree; out-of-source 10/15 confident-agree + 3 likely-disagree (avalanche / dual power feeds / tokenization — same "concept-here-but-not-this-term" pattern) + 2 uncertain; in-source 5/5 agree; partial-depth 5/5 agree-when-applied. Methodology validated at scale; no catastrophic finding.

**Methodological finding (supervisor):** partial-depth is systematically under-applied. Items getting tagged out-of-source when they should be partial-depth share the pattern "specific term/framing not in transcript but underlying concept clearly is." Same architectural shape as the SB1.5 fix. **SB1.6 candidate (deferred):** post-process refinement to catch `out-of-source`-that-should-be-`partial-depth` on `fix_direction=rewrite-to-source` + justification-prose markers (e.g., "concept is taught but the specific term/framing the item tests is not in this video"). Structural mirror of SB1.5's flip rule; ought to extend the same script with a second flip predicate. Aiden may also want to manually transcript-check items #4 (C2 in malware overview), #7 (Impact in risk mgmt), #11/#13 (MAC filtering in port security), #14 (cryptominer), #15 (secure boot), #22 (hardware supply chain), #28 (privacy by design) to resolve supervisor uncertainty — ~15 min total.

**Safety-net observation:** `fix_direction` action mapping bounds the cost of category error. `mark-for-Sybex-arbitration` routes through Aiden; nothing auto-destroys content. A category mis-classification cannot directly produce a destructive remediation action — the human review gate is structurally upstream.

**Cumulative Audit D spend $34.63 ($1.29 prior + $7.42 SB1 halt + $25.92 SB1 completion + $0 SB1.6 + $0 SB-fix-1a + $0 Report-#0007 + $0 SB-fix-1b-prep + $0 SB-fix-1b packets 1+2); credit remaining $19.08. SB-fix-1a complete 2026-05-20; Report-#0007 + SB-fix-1b-prep shipped 2026-05-21. SB-fix-1b packets 1+2 shipped 2026-05-21 (50/134 items, 37%); cadence Option A confirmed for packets 3-6 (per-packet surface-and-hold). SCHEMA `sb16_subcategory` formalised 2026-05-21 (`12deabc`) with two values — `partial-depth` (cited video's umbrella subsumes tested technique; technique absent from transcript) and `messer-curriculum-gap` (cited video is a sibling concept; tested technique has no umbrella home anywhere in Messer's corpus). Defining axis: does the cited video's umbrella concept conceptually contain the tested technique? Backfill `6f796f7` retrofitted all 10 SB-fix-1a sb16-candidates as partial-depth; integer overflow #36/#37 (SB-fix-1b packet 2) introduced the first messer-curriculum-gap cases. SB-fix-2 partial-depth pool now 33 items (31 prior + 2 new messer-curriculum-gap). (A)↔(B) ordering decided 2026-05-21 = Option 1 (A→B sequential) after pool composition surfaced 14 of 31 SB-fix-2 items (45%) as match+cram. SB-fix-1b-prep (`c1464c0`) shipped schema extension + validator generalisation: MatchItem + CramTerm now carry optional per-item `messerVideo` + `subObjective` with both-or-neither rule; validator `checkCitation()` helper generalises across all 4 types with preserved error codes; `--selftest` flag with 6 fixtures (6/6 PASS); zero JSX changes per Q-D-1 (citation stays tooling-metadata). Unblocks BOTH (i) SB-fix-1b apply (134 D2 partial-adjacent match+cram items, ~6 packets) AND (ii) SB-fix-2 match+cram subset (14 of 31 partial-depth pool). Next: packet 3 build opens next session — first §2.4-cluster packet; expect cluster-verification rounds for sb16-candidate surfacing (same workflow as #36/#37 integer overflow this session). (C) Domain 1/3/4/5 partial-adjacent (227 items) follows once D2 pattern is fully validated through SB-fix-2.**

### Session 2026-05-24 — Sybex Tier 2 corpus COMPLETE (`Report-#0012.md`)

**Extraction milestone closed.** The Sybex SY0-701 9th-edition test bank was
extracted via Claude in Chrome over a multi-session run (2026-05-23 → 2026-05-24)
using the deliberately-wrong protocol. Full corpus now committed at
`.audit-working/sybex-practice-tests/` (tracked via a `.gitignore` exception
mirroring the `relays/` precedent; `.audit-working/*` stays gitignored otherwise).

- **18 files / 500 questions**: chapters 02–17 (20 questions each = 320) + Practice
  Exams 1 and 2 (90 each = 180). `chapter-01.json` is a legacy non-deliberate
  6/20 run from prior actual studying — intentionally excluded from the corpus and
  re-ignored in `.gitignore` (file kept on disk).
- **Per-question data**: `n`, `stem`, `options` (A–D dict), `correct` ({letter, text}),
  `explanation`, `image_referenced`, `notes`, plus the deliberately-wrong pick
  (`my_guess`) and `guess_matched_correct`. The `my_guess` field captures the
  Security+ reasoning vs Sybex framing — audit-useful where they diverge.
- **5 accidental matches** (CCh's deliberately-wrong pick still matched Sybex's
  "correct"): ch04 Q1, ch08 Q3, ch11 Q15, ch12 Q17, ch14 Q20. These surface spots
  where Sybex's framing differs from common Security+ understanding.
- **Shape verification**: all 18 files parse; counts correct; `options` is a dict;
  `n` is the sequential question key; `wall_clock_duration_seconds` present in every
  source block. One drift found and fixed: `practice-exam-02` stored `correct` as a
  bare string; normalized to `{letter, text}` to match the other 17 (purely
  structural, no answer changes).

**Methodology shift:** Audit D moves from a Tier-1-only screen (Sybex glossary) to a
**Tier 1 + Tier 2 evidence base** (glossary + practice-test bank). The Tier 1/2/3
framework adopted with the G packet now has its Tier 2 layer populated for all 16
chapters + both practice exams.

**Dual role (clarified 2026-05-25 PLAN restructure):** The Tier 2 corpus serves DUAL roles after the 2026-05-25 PLAN restructure: (1) audit evidence base for SB-fix-2 + future D1/D3/D4/D5 work (established 2026-05-24), and (2) source for the Sybex fold-in catalogue content (established 2026-05-25 — Task 1g). Same files, different uses; no duplication.

**Unblocks (carry-forward):**
- **Item 3 (§2.4.9 HSTS mc[2])** — was HELD pending Chapter 12 data; Ch12 corpus now
  in hand, verdict can be adjudicated.
- **P1/P2/P3 packets** — 56 partial-depth items, now adjudicable against Tier 2.
- **D1/D3/D4/D5 partial-adjacent cleanup** — 227+ items (+ SD-WAN routing-out) gain a
  Tier 2 evidence base for forward adjudication.

**2026-05-24 session close — SB-fix-2 P1 CLOSED + `chapter_level_only` convention adopted:**
- **SB-fix-2 status (as of 2026-05-24): R + G + P1 CLOSED.** P1 = 20/20 items across 4 commits (`f2c2c2a`
  initial 7; `b5b0f34` Group A → `cross-source-curriculum-gap`; `979e994` Group B
  chapter-level Tier 3; `66783df` Report-#0017). P2 (20 items) + P3 (16 items) = 36
  partial-depth items then remained. **(Superseded 2026-05-25: P2 + P3 now CLOSED —
  P-path FULLY CLOSED at 56/56. See the 2026-05-25 session block below.)**
- **`chapter_level_only` flag on `sybex_reference` (`aef0eab`) = adopted forward
  convention** for chapter-level Tier 3 citations: Sybex chapter is the TOC-mapped home
  but the specific term is absent from Tier 1+2 and may live only in chapter prose. It
  waives the verbatim `quote_excerpt` requirement and keeps `sb16_subcategory` orthogonal
  (stays `partial-depth`). Applies forward to P2/P3 + D1/D3/D4/D5 cleanup (~250+ items).
  See `SCHEMA.md §audit_d_review.sb_fix_2` and `Reports/Report-#0017.md`.
- **Sybex fold-in is NOT yet a numbered task in this PLAN.** ~~The Tier 1/2/3 framework,
  the Tier 2 corpus, and the apply infrastructure all exist, but the overall fold-in arc
  (P2/P3 closure → D1/D3/D4/D5 partial-adjacent cleanup) is tracked only in prose here
  and in the handoff — not as a first-class numbered task.~~ **RESOLVED 2026-05-25:** Sybex
  fold-in is now **Task 1g** (six scoping decisions Q-A through Q-F adjudicated this
  session), and weakness-tracker is promoted from a 1f sub-bullet to **Task 1h**. See the
  numbered sections below.

**Workflow lessons (for future Claude-in-Chrome runs):** CCh sidepanel has no manual
`/compact`, so auto-compaction breaks runs past ~5–6 chapters — multi-session with a
~500-word written handoff brief per session (helper code + schema spec + state +
anomalies) was required. CCh "Ask before acting" approves the whole plan upfront, not
stepwise — send instructions as separate messages to force real pause-and-confirm.
Long-running async JS loops time out at 45s → batch in ~25-item chunks. Post-END state
wipe is standard Wiley UI behavior (not a Ch12-specific bug) → always plan for a
`captureLocked` walk.

### Session 2026-05-25 — SB-fix-2 P-path CLOSED at 56/56 + PLAN restructure (`Report-#0018`)

**P-path fully adjudicated.** P2 (20 items, all §2.4) applied `e430368`; P3 (16 items,
§2.4/2.5/3.4/4.1/4.3/5.2/5.5/5.6) applied `04d3eba` — final P-path packet, closes the
partial-depth pool at 56/56. Both packets all `keep-with-sybex-note`, zero Group A
cross-source gaps, audit-only (zero content mutation, content-equivalence verified;
validator + build green pre/post-write). Report-#0018 (`5f6d672`) covers the P2+P3 pair.

- **P-path accounting (56/56):** P1 = 20 (16 keep-with-sybex-note: 7 T1/T2 + 9
  chapter-level; + 4 cross-source-curriculum-gap inline) · P2 = 20 (10 quote-cited + 10
  chapter-level) · P3 = 16 (6 quote-cited + 10 chapter-level).
- **Cumulative `chapter_level_only` = 29** across the P-path (P1 9 / P2 10 / P3 10; 0 from
  R/G). ~56% of P-path keep-with-note citations are chapter-level Tier 3 — reflects how
  much §2.4 attack-vocabulary and §3.4/§5.x program-vocabulary lives in Sybex prose, not
  glossary/index/practice-tests.
- **Cumulative `cross-source-curriculum-gap` = 5:** HSTS (G packet) + cryptominer ×2 +
  skimming ×2 (P1 Group A).
- **T2-grep methodology note (Report-#0018):** a grep match only counts as a Tier 2 hit
  if the matched text supports what the item TESTS, not merely that the token appears.
  WPS PIN attack (P2), parallel test + remediation validation (P3) matched the token in a
  non-supporting sense → chapter-level. Counter-case: SSL stripping (P2) was a Tier 1 miss
  but a real Tier 2 hit (practice-exam-01 describes the attack) → quote-cited; proves the
  per-item grep pays off even when Tier 1 misses.
- **Spend:** P2 + P3 were $0 LLM (supervisor adjudication + scripted apply). Cumulative
  Audit D spend **$34.63 unchanged**, credit remaining **$19.08**.
- **SB-fix-2 remaining = closure documentation only.** No further P-path items. Next
  Audit D work item: **D1/D3/D4/D5 partial-adjacent cleanup (227+ items + SD-WAN
  routing-out)** — `chapter_level_only` carries forward as the proven mechanism.

**PLAN restructure (this session, `2026-05-25-plan-restructure`):** Sybex fold-in promoted
to **Task 1g** (six scoping decisions encoded); weakness-tracker promoted from a 1f
sub-bullet to **Task 1h**. Documentation-only — no code / schema / questions.json changes.

## Task 1g — Sybex question fold-in (NEW, 2026-05-25, **next major Audit D adjacent work item**)

**Status: SCOPED. Implementation not started.** This entry tracks the task and encodes the
six adjudicated scoping decisions; the fold-in IMPLEMENTATION is the next major work item
after the D1/D3/D4/D5 cleanup is sequenced (parallel-eligible — see below).

**Trigger.** Tier 2 corpus of 500 Sybex-authored questions committed at
`.audit-working/sybex-practice-tests/` on 2026-05-24 (Report-#0012) as audit evidence base.
Aiden's directive to fold these in as study content settled 2026-05-24 — accepts worst-case
"remove if asked" copyright risk per supervisor-Claude conversation. 500 questions roughly
triples the existing MC pool and dramatically expands study volume, particularly for non-D2
domains where Audit D status is "functional but partial-adjacent items not yet
supervisor-validated."

**Position relative to other tasks.** Parallel-eligible with D1/D3/D4/D5 partial-adjacent
cleanup. Source-quality work (folding in Sybex-native content is in-source by definition),
not UX polish — does not violate the "source quality > UX polish" ordering. Practice-exam
questions (180 items) span all 5 domains and may surface broken non-D2 items faster than
Audit D cleanup would, per the recalibration's "studying IS the test of audit quality"
framing.

**Six scoping decisions adjudicated 2026-05-25:**

- **Q-A — Citation field shape: REUSE existing `sybex_reference` shape at top level of
  Sybex-native items.** Same structure as `audit_d_review.sb_fix_2.sybex_reference`
  (edition / chapter / section / page / quote_excerpt / chapter_level_only / note), but
  placed at top level rather than inside `audit_d_review`. Semantically: top-level
  `sybex_reference` = primary citation; inside-`audit_d_review` = audit-trail reference.
  Validator change is small (mirrors `checkCitation()` helper from SB-fix-1b-prep `c1464c0`).
- **Q-B — Tree placement: B1-aggregated. One synthetic Sybex video per section, holding
  ALL Sybex items objective-tagged to it regardless of source chapter.** E.g. "Sybex
  (§2.4)" holds Ch 4 + Ch 12 + practice-exam questions tagged 2.4. Source chapter remains
  traceable via `sybex_reference`. Tree stays uncluttered; domain dashboard works without
  UI changes. Depends on Q-C per-question objective tags; calibration must pass before
  B1-aggregated tree-integration ships.
- **Q-C — Objective tagging: C2-API. LLM-as-judge per question for SY0-701 objective
  tagging, ~$5 + verbatim-retry margin.** Repurpose Audit D pipeline (`audit-d-llm-judge.mjs`,
  ~460 lines) — new prompt + output schema, but caching/retry/resume/flush carries over.
  30-item stratified calibration before full-corpus run (same shape as SB0). Pass threshold
  ~85% (matches Audit D historical baseline). If calibration fails, fall back to B2
  (parallel tree) or C1 (manual tagging).
- **Q-D — Accidental match handling: D3 with `framing_note` output. Review each of the 5
  accidental matches (ch04 Q1, ch08 Q3, ch11 Q15, ch12 Q17, ch14 Q20) individually,
  produce a `framing_note` field on each item** documenting the Sybex-vs-common-Security+
  divergence. Framing notes surface in the explanation UI during study. ~30-45 min
  supervisor work. Captures the methodology finding (Sybex framing patterns) as side output.
- **Q-E — Validator extension: E1-refined. Validator accepts either
  `messerVideo`+`subObjective` OR top-level `sybex_reference` per item. At least one
  citation required.** Mirrors `checkCitation()` helper shape from SB-fix-1b-prep. Add
  selftest fixtures for Sybex-cited mc items. ~20 lines.
- **Q-F — Audit framework carve-out: F3. Top-level `sourceProvenance` enum on items.**
  Values: implicit `"messer"` default (existing items untagged), `"sybex-chapter"` (320
  items from Sybex chapters 02-17), `"sybex-practice-exam"` (180 items from practice exams
  1+2). Audit scripts add one-line filter on `sourceProvenance !== "messer"` to skip
  Sybex-native items (in-source by definition; no `audit_d_review` needed).

**SM-2 keying.** New prefix scheme: `sybex-mc-ch04-q1` for chapter questions,
`sybex-mc-pe01-q26` for practice-exam questions. Globally unique by construction. Sync
engine `TRACKED_PREFIXES` gets `"sybex-"` added — same shape as the `"cram-"` addition in
Task 2 SB-0, requiring a 24-hour gate before items actually start writing per the SB-0
precedent (see `feedback_sync_engine_hygiene_first`).

**No `schemaVersion` bump needed.** Additive changes only (new fields, new key prefix).
Existing parsers see new keys and ignore them. Sync-engine joining-device guard still
triggers correctly.

**Implementation sub-batches** (sequence pending implementation-time adjudication; not
gating this PLAN restructure):

- **1g.0 — Sync engine hygiene:** add `"sybex-"` to `TRACKED_PREFIXES`. Mirrors Task 2
  SB-0 pattern. Ship + 24-hour gate before 1g.4.
- **1g.1 — Validator extension:** E1-refined per Q-E. `checkCitation()` generalisation +
  selftest fixtures.
- **1g.2 — Schema documentation:** SCHEMA.md updates for top-level `sybex_reference`,
  `sourceProvenance` enum, SM-2 key-scheme extension.
- **1g.3 — Objective tagging:** C2-API per Q-C. New script `audit-sybex-objective-tag.mjs`
  repurposing Audit D infra. Calibration (30 items stratified) before full run. ~$5 spend.
- **1g.4 — Conversion script:** build `questions-sybex.json` from
  `.audit-working/sybex-practice-tests/` shape into `questions.json` shape, with
  `sybex_reference` + `sourceProvenance` + SM-2 keys. Per-item objective code from 1g.3.
- **1g.5 — Accidental-match adjudication:** D3 per Q-D. 5 items reviewed, `framing_note`
  populated on each.
- **1g.6 — Apply + smoke:** merge into questions.json via dry-run + atomic write. Validator
  clean. Build clean. App loads. Spot-check that Sybex items render in correct sections and
  study modes pick them up.
- **1g.7 — Report-#NNNN:** document the fold-in, the methodology, the 5 accidental-match
  framing notes, any calibration findings.
- **1g.8 — `framing_note` display wire-up:** read `item.framing_note` in the quiz
  explanation render block and surface it after `exp` when present. Single render hook
  in `src/secplus-quiz.jsx`. Smoke-pass at the `2.2.sybex` (ch04-q1) and `3.1.sybex`
  (ch08-q3, ch11-q15) anchors. Surfaced as L6 in Report-#0024 — data populated and
  verified in 1g.6, but the display surface was never wired. Plan-first; relay then
  ship.

**Status (2026-05-29, 1g arc CLOSED):** 1g.0-1g.6 SHIPPED (data half at `f39c358`);
1g.7 SHIPPED at `75d866d` (doc/closeout half + Report-#0024 L1-L6); 1g.8 SHIPPED
this commit (display wire-up + 3-gate smoke PASS + Report-#0025). The 1g arc closes
here; 1g.3 closure note in Report-#0025 documents the final ship.

**Risks:**
- C2-API calibration may fall below threshold for ambiguous items (phishing tested as
  recognition vs as organizational defense). Mitigation: stratified spot-check before full
  run; if calibration fails, Q-C fallback paths lean to B2 / C1.
- Sybex framing divergence may extend beyond the 5 known accidental matches. Mitigation:
  1g.5 captures known cases; additional cases surface via real study post-ship; treat as
  iterative.
- Copyright stance is Aiden-accepted ("remove if asked"). Mitigation: conversion script
  preserves source-attribution metadata; teardown (filter by `sourceProvenance`) is trivial
  if ever needed.

**Audit framework carve-out specifics:**
- `audit-d-llm-judge.mjs`: filter on `sourceProvenance` at item-load time.
- `validate-questions.mjs`: `checkCitation()` accepts either source.
- sb-fix-2 apply scripts: not affected (Sybex items have no `audit_d_review` block).
- D1/D3/D4/D5 partial-adjacent cleanup (future work): operates on Messer-cited items only.

## Task 1h — Weakness-tracker (promoted from 1f sub-bullet, 2026-05-25)

**Status: IN PROGRESS.** Commits 1+2 shipped (`829898f` sync-engine TRACKED_PREFIXES + 4
tests; `0b831ba` recordWeakness helper + 5 call-site writes + Fix A stale-closure
resolution, 15 unit tests PASS). Commits 3-8 pending.

**Purpose.** Per-attempt diagnostic data capture for study sessions. Records: question ID,
objective code, answer, correctness, time on question, confidence rating (planned),
prior_sm2 state at write time, timestamp.

**Why a separate task.** Parallel to Audit D, not blocking it. Touches the app data model.
Gates the metacognitive features deferred behind the Task 2 ship. Was buried as a 1f
sub-bullet but deserves its own slot given scope.

**Pre-work for commit 3.** Verify no `q`/`w`/`e`/`r` keyboard collision with existing
handlers before the ConfidenceRater UI ships (carried forward from supervisor sign-off note
`9c5df20`; see `project_weakness_tracker_commit_3_keyboard_check`).

**Commits 3-8:** ConfidenceRater UI (commit 3), pause-on-blur Q-C-3 (commit 4),
import-export Q-F-1 (commit 5), SCHEMA + docs (commit 6), Report-#NNNN (commit 7), final
integration (commit 8).

**Sync.** TRACKED_PREFIXES already includes `"weakness-"` (commit 1 shipped this).
Interleaves with audit work; not gated by Audit D closure.

## Task 2 — Mode consolidation (in flight)

Authoritative spec: `docs/task2-design-v2.txt` (recovered from JSONL on
2026-05-05; original authored 2026-05-01 alongside the Sub-batch 0 ship).
Top-level tabs collapse from 4 to 3 (Progress / Study / Exam — sync via
footer per Q-A / Q-J). Inside Study, 5 mode cards: Quiz / Flashcards /
Review / Drill Wrong / Matching (Matching standalone per Q-E). Customise
drawer with last-used persistence, visible filter summary, and preset
saveability lands in Sub-batch 2.

The risky part turns out NOT to be SM-2 key migration (all SM-2 keys are
PRESERVED per design v2 §5.1) but cross-device sync-engine prefix
registration for the new `cram-` SM-2 family. That's mitigated by the
hygiene-first protocol: Sub-batch 0 ships sync prefix changes alone with
a 24-hour gate before Sub-batch 4 (which actually starts writing
`cram-*` keys).

Sub-batch ledger:

- **0 — Sync engine hygiene** (shipped `9e94fb9`, 2026-05-01). cram-
  added to TRACKED_PREFIXES; secplus-v4-exam-session added to
  LOCAL_ONLY; migrateStore invariant comment added. 24-h gate between
  this ship and Sub-batch 4. All 3 devices reloaded the bundle by
  2026-05-05.
- **1 — UI scaffold** (shipped `c43ae49`, 2026-05-05; preliminary doc
  cleanup at `a62d378`). Top-level tabs 4→3; new StudyTab with 5-mode
  picker; old 6-card grid hidden via `presetMode` prop on QuizTab
  (kept reachable in code, removed in Sub-batch 5). Pure UI; no
  localStorage / sync changes. Live bundle `index-ByfmWJ4p.js`. 8/8
  manual click-through PASS. See `docs/task2-sub-batch-1-shipped.md`.
- **2 — buildPool unification + Customise drawer + diff-test** (split
  into 2A/2B/2C per Aiden's D1 sign-off; 2A shipped).
  - **2A** (shipped `b42fef7`, 2026-05-05) — `src/study/buildPool.js`
    + `scripts/test-buildpool-equivalence.mjs` + 6→1 startQuiz
    branch collapse via `LEGACY_SHIM_FOR_MODE`. Diff-test: 6 modes
    PASS, weak divergence INFO, drill BYPASS. Live bundle
    `index-CCpUiDk4.js` (+1.40 kB / +0.10%). Validator baseline-equal.
    See `docs/task2-sub-batch-2a-shipped.md`.
  - **2B** (shipped `0c00620`, 2026-05-05) — Customise drawer +
    `secplus-v4-customise-last` per-mode persistence. New modules
    `src/study/CustomiseDrawer.jsx` (~390 LOC) +
    `src/study/drawer-state.js` (~120 LOC); secplus-quiz.jsx
    shrinks 141 LOC net (inline setup view + 6-card grid +
    presetMode useEffect + startQuiz + dialog/showAlert all
    deleted). StudyTab is now session orchestrator. Active recall
    relocates from QuizTab session state to drawer state via
    props-driven kbdRef pattern (Risk #5 mitigation). Live bundle
    `index-Bu7UvPei.js` (1350.84 kB; +8.59 kB / +0.64% over 2A).
    Validator baseline-equal; 34 sync-engine tests PASS; diff-test
    PASS. Status doc at `docs/task2-sub-batch-2b-shipped.md`.
  - **2C** (shipped `5ed2cbe`, 2026-05-09) — cleanup +
    per-question weak scope. Deleted `LEGACY_SHIM_FOR_MODE` /
    `legacyToBuildPoolMode` / `legacyEmptyMessage` / `presetMode`
    prop / `STUDY_MODE_TO_DRAWER` + the orphan 6-card grid;
    switched Drill card to per-question `belowAccuracy: 0.70`
    (Q-F behavior change flipped on; flagged in commit + ship
    report per Aiden's risk-handling addition to D3); ungreyed
    the drawer slider; idempotent migration of any persisted
    `drill` slot drops `legacyVideoLevelWeak`. Status doc at
    `docs/task2-sub-batch-2c-shipped.md`. Live bundle
    `index-D1M-q5i7.js`.
- **3 — Saved presets** — **deferred behind Audit D (2026-05-13)**. Resume after Audit D closure.
- **4 — Flashcards SM-2 (`cram-*` keys)** — **deferred behind Audit D (2026-05-13)**. Sub-batch 0 hygiene + 24-h gate satisfied 2026-05-05, but the fix sequence runs after Audit D match + cram fixes ship. Exception clause per D5: if Audit D drags 2-3 weeks, may interleave since it touches the cram data path.
- **5 — Cleanup** — **deferred behind Audit D (2026-05-13)**. Final orphan removal pass.

### Task 2 — tracked polish items

Surfaced during sub-batch reviews. Not regressions, not on the design
v2 critical path. Track here so they don't get lost; promote into a
sub-batch slot or a between-sub-batch small commit when convenient.

- **(2026-05-05, Sub-batch 1 review) Matching UX: option-disappears-when-selected.**
  Pre-existing behavior, not introduced by Sub-batch 1. When a user
  picks an option in a matching dropdown, the chosen value disappears
  from the dropdown's visible state, making it harder to confirm
  what's already selected without expanding the dropdown again. Fix
  shape: keep the selected value visible as the dropdown's display
  text (today the chosen value remains stored in state but the
  dropdown reverts to placeholder). Likely lands in Sub-batch 5
  cleanup or as a small standalone commit between sub-batches.
- **(2026-05-05, Sub-batch 1 review) Per-mode counts on Study tab.**
  The 5-card picker doesn't show "N items available in this mode" on
  each card. Sub-batch 2's Customise drawer with live pool preview
  ("Drawing N items from M videos" per design v2 §3.3) may surface
  this naturally; if not, a small follow-up commit can add per-card
  counts to the picker.
- **(2026-05-18, surfaced during weekend study) Matching items
  expose section/video name during quiz.** Pre-existing behaviour,
  not introduced by recent sub-batches. The MatchingQuestion header
  shows the section + video title (e.g. "2.3 — Common Attack Types
  · Malware Variants"), where MC and scenario items mask the video
  title until after the answer is checked (see `e5fb838`
  "hide sub-objective title during running quiz to prevent answer
  leakage"). Effect: matching items leak topic context that MC/scen
  carefully suppress. Fix shape: gate the matching header label
  behind `showExp` the same way `qMeta` does at
  `src/secplus-quiz.jsx:1453`. **Open design question:** anonymise
  in study mode (current quiz flow) but keep visible in any future
  exam-simulation mode (Task 3), since CompTIA's UI does expose
  the objective context. Confirm before flipping.
- **(2026-05-18, surfaced during weekend study) Matching items
  lack a progress bar.** MC + scenario render the running quiz's
  progress bar (`src/secplus-quiz.jsx:1447`) but the
  MatchingQuestion component doesn't, so mixed quizzes that hit
  a matching item appear to lose position-feedback for that turn.
  Fix shape: lift the progress bar JSX out of the MC branch into
  a shared header rendered for both q.type values, OR add the
  same `<div style={styles.progressBar}>…</div>` block inside
  MatchingQuestion. Trivial; bundle into the next matching-area
  polish commit or alongside the header-leak fix above.

### Task 2 — proposed metacognitive features (deferred — re-evaluate after Task 2 ships + 3-5 study sessions)

Five features in priority order. **Source:** separate
study-strategy conversation with another Claude, 2026-05-05. That
conversation evaluated the current app against an evidence-based
daily loop (Messer video → handwritten Feynman summary → quiz
with active recall → spaced repetition next day) and found most
high-utility techniques already implemented. The five items below
are the remaining gaps, all clustered around metacognition.

**Status:** all five DEFERRED until Task 2 ships entirely
(Sub-batches 2C, 3, 4, 5 complete) AND 3-5 study sessions have
run on the new daily loop with the post-Task-2 app. Re-evaluate
priorities then; do NOT pull any of these into Task 2 mid-flight.

#### 1. Confidence rating before checking answer (highest leverage)

- Three-button row between option-select and Check Answer:
  certain / probably / guessing.
- Stored on the SM-2 record alongside correctness (additive
  field; no schemaVersion bump per Q-I; spread-merge invariant
  preserved).
- Cross-reference produces calibration data:
  - confident-and-wrong → misconception (knowing something
    incorrectly; no other tool surfaces this).
  - guessing-and-right → coverage gap masquerading as competence.
- New "calibration" card on Progress tab.
- Strongest single recommendation per source conversation.
- Schema impact: low (additive). Sync impact: rides existing
  prefix. Risk: low.

#### 2. Why-wrong tag on incorrect answers

- Optional dropdown when a question is missed: confused with
  similar concept / didn't recognize term / misread question /
  never seen before / other (free-text fallback).
- Feeds Weak Spots — group/filter by reason. Different reasons
  warrant different remediation paths.
- Pairs with #1: wrong-and-confident → "what did you confuse
  it with?"
- Concern: friction at point of failure. Design as
  optional/skippable, not required.

#### 3. Within-session re-test of wrong answers

- Verify first whether this already exists. Current evidence
  suggests not — drill-at-end exists, within-session retry
  does not.
- Wrong items reappear ~5-10 questions later in the same
  session.
- Test effect strongest when retry happens while the item is
  still cool but not cold.
- Affects pool ordering during a session, not pool composition.
- Could be a drawer toggle ("retry wrong items mid-session")
  with a reasonable default.

#### 4. Audit scenario question difficulty against real SY0-701 PBQ format

- Content/research work, not feature work.
- Pull 5-10 existing scenario questions, compare against
  Chapple/Seidl PBQ examples.
- If a gap exists, the fix is content (chained two-stage
  scenarios) more than infrastructure.
- May warrant a new question type — possibly Task 3 territory
  (CLAUDE.md: "PBQ system + exam simulation").
- Deferred until #1 and #2 produce data informing whether this
  is needed.
- **(2026-05-13)** Kept **separate** from Audit D per the Audit D
  scoping decision (different shape: format vs content). Runs
  after Audit D content corrections so PBQ-format work operates
  on a content-correct corpus.

#### 5. Typed Feynman summary per video on Progress tab

- 2-3 line text field, complements (not replaces) the
  handwritten notebook.
- Research favors handwritten for initial synthesis.
- Useful as a searchable index later.
- Lowest leverage of the five.

#### Recommended sequence (per source conversation)

1 → 3 (if absent) → 2 → 4 → 5

Metacognitive infrastructure (#1, #2) before content depth
(#4). Data from #1 and #2 informs whether #4 is needed.

If only one ships: **#1**. Clearest unique capability; the
others mostly complement existing functionality.

#### Out of scope (per source conversation)

- Real-world-hook notes on cram cards (handled in handwritten
  notebook).
- In-app daily session pacing (behavioral; risks feeling
  patronizing).
- Anything that duplicates the notebook for techniques where
  research favors handwriting.

#### Decision criteria for re-evaluation

Re-evaluate priorities after:
- Task 2 ships entirely (Sub-batches 2C, 3, 4, 5 complete).
- 3-5 study sessions on the new daily loop with the post-Task-2
  app.

Specifically check whether actual study experience confirms
the priority order or surfaces something none of these
proposals anticipate. **Audit A precedent:** the Smishing
question that triggered the entire structural-consistency
audit was found during a study session, not during audit
design. Real study reveals what theory misses.

#### Schema slot (informational)

Features #1 and #2 are SM-2 record additions. The natural slot
is alongside or after Sub-batch 4 (which adds `cram-{vid}-{idx}`
keys for Flashcards SM-2). By Sub-batch 4 ship, the SM-2 schema
changes will have flowed through Sub-batch 0's hygiene gate, so
adding additional fields fits the same migrateStore invariant
without further sync hygiene work.

## Task 3 — PBQ system (later)

Schema extension for PBQs. Drag-match, firewall ordering, log analysis, port/protocol matching.
~40 PBQs across formats. 90-question / 90-min exam simulation with 3-5 PBQs at start.
CompTIA 100-900 scoring scale.

## Future enhancements identified during study

Captured-but-not-yet-scoped items that have surfaced from real study sessions. Each entry: what was observed, why it matters, candidate fix shape. Promote into a numbered task when scoped.

- **(2026-04-27) Length-tell distractors actively undermining study.** On many MCs the correct answer is visibly longer (or shorter) than the distractors, leaking the answer via length cue. Fix path: addressed by Task 1d audit + fix batches (length-balance dimension).
- **(2026-04-27) Weak/filler distractors.** Some MCs include distractors that are obviously wrong (filler "All of the above" or sentence fragments) so the question functionally has 3 options instead of 4. Fix path: addressed by Task 1d audit + fix batches (distractor quality dimension).
- **(2026-04-27) "N new things to try" with no surfacing path.** App reports unseen-item count but offers no way to actually see those N items in the next session. Fix path: addressed by Task 1e (prefer-unseen toggle in existing modes, or separate New mode).
- **(2026-04-27) Catch-all: broader catalogue review.** Aiden has raised "review the catalogue" multiple times. Task 1d's audit is the structured form of this — additional concerns surfaced during fix-batch reviews get folded back here.

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
- **11 BEST/MOST short-distractor warnings** are heuristic, not blocking. Some flagged distractors are legitimate technical terms (Encryption, Hashing, Pass-the-hash). Review during Task 1b. (Down to 4 BEST/MOST post-mega-pass; 5 total warnings = 4 BEST/MOST + 1 Spectre spelling — both pre-existing and out of scope.)
- **Permissions config** (2026-04-28, commit `81b1330`): `.claude/settings.json` added with pre-authorized routine workflow shapes (validators, fix scripts, npm run build, git commit/push origin main, clip.exe pipe). Destructive git ops (force-push, hard-reset, rebase, --no-verify) explicitly denied to override broad existing local-settings allows. Supports unattended runs.
