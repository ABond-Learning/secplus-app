# PLAN.md — Living task tracker

Single source of truth for in-flight work. Update as state changes.
See CLAUDE.md for the underlying 3-task plan and quality rules.

Last updated: 2026-04-28

## Status snapshot

Priority order reflects the 2026-04-27 reorder triggered by study-session findings: catalogue quality issues (length-tell distractors, weak distractors) are actively undermining current study, and the "N new things to try" UX has no surfacing path. Both jumped ahead of continuing 1c grounding-audit tuning.

**2026-04-28 reframe (authoritative):** There is no fixed exam date. Aiden is currently early in the syllabus (only watched videos up to Cryptography). Quality > speed. Prior CLAUDE.md "8 weeks / late June 2026" framing was incorrect; treat catalogue quality as the binding constraint, not calendar pressure.

Task | State | Notes
--- | --- | ---
1a — Foundations + spelling pass | **complete, deployed** | All phases shipped. Live bundle verified clean.
1.5 — Cross-device sync via private Gist | **complete, deployed, verified on 3 devices** | Backup polish + sync engine + sync UI all live. Real-device sync verified across 3 of Aiden's devices post-deploy (joining-device guard holds; bidirectional sync works).
1b — Content generation | **complete, deployed** | All 5 domains done: Domain 1 scenarios (25), Domain 5 (78), Domain 4 (55), Domain 2 BEST/MOST rewrites (35 across 2 batches). **Total: 193 items added/modified.**
1c-structural — Citation backfill + grounding/anchor-gap audits | **partially complete; remaining work DEPRIORITIZED** | Citation backfill DONE (728 → 0 legacy-no-citation; 100% catalog coverage). Grounding + anchor-gap audit scripts built but extractor produces noise-dominated output — 30 spot-checks across all 5 domains found zero true misfiles. Extractor tuning pending; lower priority than 1d/1e because grounding side mostly produces negative-confirmation. See "Task 1c — split into structural and experiential" below.
**1d — Catalogue quality audit + fixes** | **in progress, partially shipped** | Sub-batch 1 (position shuffle + 95 Pattern A length-tell extractions) shipped. Sub-batch 2 (short-distractor padding) shipped on 6 sub-objectives: §1.2/§1.4/§2.3/§2.4/§2.2/§4.5 — 92 items modified + 33 Convention B holdbacks across 125 cohort items. **177 cohort items remain across 21 untouched sub-objectives.** Next planned move: single mega-pass through all 21 remaining sub-objectives, producing one comprehensive review document. 3 future-content-quality TODOs flagged in TODO-content-quality.md (mc-2.4.14-2, scen-2.2.5-0, mc-2.2.5-2).
**1e — New-content prioritization** | **NEW (2026-04-27)** | App reports "N new things to try" with no way to see/prioritize them. Either separate New mode or have existing modes prioritize unseen-from-watched-videos. Smaller scope than Task 2; ~1-2 hours.
1c-structural (continuation) — extractor tuning | not started | Tune grounding/anchor-gap extractors to handle `X means:` / `X is used to:` / `X requires:` patterns; multi-word phrases before linking verbs; clause-fragment stripping; stop-word filtering. Bottlenecks both audits.
1c-experiential — anchor-gap fixes | not started | Generate anchor questions for concepts the audit flags as uncovered. Real pedagogical value once extractor is tuned.
2 — Mode consolidation | not started | Bigger UX redesign. Naturally folds in any other UX issues identified during study. Touches localStorage migration; see SCHEMA.md. Will need a `schemaVersion` bump in the sync engine if payload shape changes.
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

#### Sub-batch 2 — short-distractor padding (in progress)

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
| **TOTAL** | **125** | **92** | **33**   |        |

**Next planned move:** single mega-pass through all 21 remaining sub-objectives. 177 cohort items remaining across 21 untouched sub-objectives. (The 6 already-shipped sub-objectives also contain 33 Convention B holdbacks, captured in code comments and tracked in the cumulative table — those don't need further work.) One comprehensive review document, one ship. Aiden will kick this off in a future session when ready. The per-sub-objective rhythm worked well for the first 6 batches but is too slow for the remainder.

3 items flagged for a separate post-Sub-batch-2 content-quality pass (out of distractor-padding scope) — see `TODO-content-quality.md`:
- `mc-2.4.14-2` (MOST framing ambiguity)
- `scen-2.2.5-0` (vishing dimension missing from correct answer)
- `mc-2.2.5-2` (verbal-only distractors for physical-technique question)

#### Sub-batch 3 and beyond — TBD after Sub-batch 2 mega-pass completes

## Task 1e — New-content prioritization (NEW, 2026-04-27)

Triggered by 2026-04-27 study session: app currently surfaces a "N new things to try" count with no way to see them or prioritize them. Aiden ends up replaying already-seen content because there's no "show me the unseen ones" path.

**Scope:** smaller than Task 2's full mode consolidation. ~1-2 hours. Two implementation paths to choose between:

- **Option A — Separate "New" mode**: a new top-level mode that pulls only unseen-from-watched-videos items. Easy to reason about, but adds another mode just before Task 2 collapses modes anyway.
- **Option B — Existing modes prioritize unseen**: when an existing mode has unseen items available from videos Aiden has marked watched, surface those first. Less disruptive, no new top-level surface, and naturally subsumed by Task 2's customise drawer later.

**Recommendation (subject to Aiden's call):** Option B, because Task 2 will collapse modes anyway. Adds a "prefer unseen" toggle to existing modes' query.

**Done when:** the daily "N new things to try" count actually translates into Aiden seeing those N things in his next session without manual hunting.

## Task 2 — Mode consolidation (later)

Collapse to 4 modes: Quiz / Flashcards / Review / Drill Wrong. Unified Quiz with
Customise drawer. Saved presets. **localStorage migration is the risky part** —
SCHEMA.md "localStorage compatibility" section is the contract. Question IDs and
array order must remain stable to keep SM-2 progress intact.

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
- **11 BEST/MOST short-distractor warnings** are heuristic, not blocking. Some flagged distractors are legitimate technical terms (Encryption, Hashing, Pass-the-hash). Review during Task 1b. (Down to 4 post-Sub-batch-2.)
- **Permissions config** (2026-04-28, commit `81b1330`): `.claude/settings.json` added with pre-authorized routine workflow shapes (validators, fix scripts, npm run build, git commit/push origin main, clip.exe pipe). Destructive git ops (force-push, hard-reset, rebase, --no-verify) explicitly denied to override broad existing local-settings allows. Supports unattended runs.
