# PLAN.md — Living task tracker

Single source of truth for in-flight work. Update as state changes.
See CLAUDE.md for the underlying 3-task plan and quality rules.

Last updated: 2026-04-25

## Status snapshot

Task | State | Notes
--- | --- | ---
1a — Foundations + spelling pass | **complete, deployed** | All phases shipped. Live bundle verified clean.
1.5 — Cross-device sync via private Gist | **complete, deployed, verified on 3 devices** | Backup polish + sync engine + sync UI all live. Real-device sync verified across 3 of Aiden's devices post-deploy (joining-device guard holds; bidirectional sync works).
1b — Content generation | **in progress** — Domain 1 scenarios (25/25) and Domain 5 Batches 1-3 (61/78 items) committed. **Batch 4 drafted but unreviewed** — see `scripts/add-domain5-batch4.mjs`.
2 — Mode consolidation | not started | Touches localStorage migration; see SCHEMA.md. Will need a `schemaVersion` bump in the sync engine if payload shape changes.
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
- [x] **Domain 5 Batches 1-3 committed (61 items)**. Rebalanced target +60 MC / +18 scenarios (correcting Domain 5's high scenario ratio) split into 4 mixed batches.
  - `77a5206` — Batch 1: 14 MC + 6 scen across §5.1 + §5.2.
  - `062781c` — Batch 2: 17 MC + 4 scen across §5.3 + §5.4.
  - `3f40fc1` — Batch 3: 12 MC + 8 scen across §5.5 + §5.6.
- [ ] **Domain 5 Batch 4 — drafted but unreviewed**. 17 MCs (the fill batch — no scenarios since target hit at 60/60 after Batch 3). Ready to apply via `scripts/add-domain5-batch4.mjs` once Aiden reviews. Items: §5.1 × 6 + §5.2 × 7 + §5.5 × 2 + §5.6 × 2.
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

### Domain 5 batch applier scripts

- `scripts/add-domain5-batch1.mjs` — 14 MC + 6 scen across §5.1.1–§5.1.5 and §5.2.1–§5.2.4 (committed `77a5206`).
- `scripts/add-domain5-batch2.mjs` — 17 MC + 4 scen across §5.3.1, §5.3.2, §5.4.1, §5.4.2 (committed `062781c`).
- `scripts/add-domain5-batch3.mjs` — 12 MC + 8 scen across §5.5.1, §5.5.2, §5.6.1, §5.6.2 (committed `3f40fc1`).
- `scripts/add-domain5-batch4.mjs` — **drafted, untracked, awaiting Aiden's review.** 17 MCs to close the +60 MC target. Per-video: 5.1.1 ×1, 5.1.2 ×1, 5.1.3 ×1, 5.1.4 ×2, 5.1.5 ×1, 5.2.1 ×2, 5.2.2 ×2, 5.2.3 ×2, 5.2.4 ×1, 5.5.1 ×1, 5.5.2 ×1, 5.6.1 ×1, 5.6.2 ×1. Topics include guidelines-vs-procedures, defense-in-depth recognition, regulation-to-data-type mapping, data classification levels, inherent-vs-residual risk (scenario-applied), risk appetite vs tolerance, KRIs leading vs lagging, MTBF vs MTTR, SOC 1/2/3 audience matching, SAST/DAST/IAST, phishing repeat-offender metric, JIT training trigger pattern. Validator was 0 errors when last applied dry-run.

All Domain 5 scripts are idempotent (skip on stem-prefix match). Safe to re-run.

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
