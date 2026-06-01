# Report-#0027 — Option B Piece 2: fetchGist truncation safety

**Date:** 2026-06-01
**Run:** `2026-06-01-task-1h-option-b-build` (Rule #9 event-log)
**Status:** SHIPPED (ungated integrity fix). Piece 1 follows under its three-part gate.

## What was asked

Option B (signed off) hardens weakness- sync in two pieces. **Piece 2** (this commit,
gate-free) closes a silent data-integrity hole in `fetchGist`: past GitHub's gist
content-truncation threshold the pull parsed to empty and sync silently stopped
reconciling for ALL data (SM-2 progress included) with no error surfaced. Piece 2 ships
first so the hole closes immediately while Piece 1 (the gated LOCAL_ONLY reclassify)
goes through its rollout.

## The bug

`fetchGist` read the gist file's inline `content` and `JSON.parse`d it inside a `catch`
that **returned an empty payload** `{ entries: {} }`. When `content` is truncated
(GitHub truncates inline content past ~1 MB and sets `truncated:true` + a `raw_url`),
the partial JSON throws → caught → empty → `doSync` keeps local and re-pushes →
cross-device reconciliation silently stops, no error shown.

## What was done

- **`src/sync/sync-engine.js` (`fetchGist`):**
  - An **absent** file is still legitimately empty (first run) — unchanged.
  - **`file.truncated`** → fetch `file.raw_url` for the full body; if `raw_url` is
    missing or the fetch is non-ok, **throw** a descriptive error (no silent empty).
  - A **present-but-unparseable** file (not truncated) now **throws** instead of
    returning empty — a present file that won't parse is corruption/truncation, not
    emptiness. Throwing routes to `doSync`'s catch, which records `lastError` + a
    degraded state and (because push is skipped on throw) does **not** clobber the Gist
    with a local-only payload.
  - The deliberate schema-mismatch path (`parsePayload` returns null on
    `schemaVersion` mismatch → treat as empty) is **preserved** — that's intentional
    forward/back-compat, not corruption.
- **`src/sync/SyncSettings.jsx` (`deriveHealth`):** extended the red-status regex from
  `/auth failed|gist not found/` to also match `truncated|unparseable|payload too
  large`, so a truncation failure shows a red "Error —" state immediately rather than a
  delayed amber "degraded." A silent truncation fix is no fix; the red state is the
  user-facing half.

## Threshold reconciliation

The repo docs weren't contradictory, just describing different limits: **~1 MB** =
inline-`content` truncation (PLAN.md's number; the silent-empty trigger, recoverable
via `raw_url`) vs **~10 MB** = the hard ceiling beyond which even raw fetch won't help
(impl-plan's "5–10 MB"). Piece 2 handles the 1 MB truncation; Piece 1 keeps the payload
bounded so we never approach the 10 MB ceiling. Documented-behavior basis; worth a
60-second confirm against GitHub's current gist API docs before relying on the exact
number.

## Validation

- `npm test` — **78/78 pass** (+3 new Piece 2 integration tests: raw_url recovery;
  truncated + raw fail → loud `lastError` + no push; present-but-unparseable → loud +
  no push). Driven through the public `setConfig`/`getStatus` path with a bespoke fake
  `fetch` via the existing injection seam.
- `node scripts/validate-questions.mjs` — 0 errors, 4 pre-existing content warns.
- `npm run build` — clean (pre-existing chunk-size warning).
- Targeted smoke (red-state path): confirmed the new `deriveHealth` regex maps all three
  thrown strings (`…truncated…`, `…unparseable…`, `…no raw_url…`) to RED, keeps the
  existing auth error RED, and does **not** over-match an unrelated transient error.

## Known coverage note (flagged, not hidden)

`deriveHealth` lives in `SyncSettings.jsx`; `node --test` can't import JSX (no React
component is unit-tested in this repo), so there is no direct unit test asserting
`deriveHealth(...) → red`. It's covered transitively: the integration tests prove the
exact `lastError` strings get produced, and the regex smoke (above) proves those strings
map to red. If we want a true unit test, the minimal path is extracting `deriveHealth`
+ `formatTime` into a plain `sync-health.js` (re-exported by `SyncSettings.jsx`) — a
small refactor flagged for the pause, not done unilaterally.

## Schema / sync impact

None to the payload schema (`schemaVersion` unchanged); no prefix changes (that's Piece
1). Purely a read-path robustness fix.

## What's next

**Piece 1** — reclassify `weakness-` as `LOCAL_ONLY` + flip the two tests at
`sync-engine.test.js:43-50`. Ships **alone** under the three-part gate (see
Report-#0028): (1) Piece 1 ships alone; (2) 24h elapse AND every device positively
confirmed on the new bundle; (3) Gist verified weakness-clean after all devices sync —
only then does commit 5 (Q-F-1 export/import) proceed.
