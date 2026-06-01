# Report-#0028 — Option B Piece 1: reclassify weakness- as LOCAL_ONLY (GATED)

**Date:** 2026-06-01
**Run:** `2026-06-01-task-1h-option-b-build` (Rule #9 event-log)
**Status:** SHIPPED ALONE. **Three-part gate now running** — see below. Commit 5 is
blocked until all three clear.

## What was asked

Option B (signed off) Piece 1: stop live-syncing unbounded per-attempt weakness data by
reclassifying `weakness-` as `LOCAL_ONLY`, so it no longer enters the Gist payload (which
had no cap and risked the ~1 MB content-truncation threshold → silent sync breakage for
ALL data). Ships alone under a hard device-state gate; cross-device movement of weakness
data becomes export/import (Q-F-1, commit 5).

## What was done

- **`src/sync/sync-engine.js`** — added `{ kind: "prefix", value: "weakness-" }` to
  `LOCAL_ONLY` with a rationale comment. The override is correct by construction:
  `isTracked` checks `isLocalOnly` first (returns false before the `TRACKED_PREFIXES`
  allow-check), so `weakness-` keys stop entering `scanTrackedKeys → buildLocalEntries
  → buildPayload`; every other prefix is untouched.
- **Cleanup of already-pushed records is automatic** — no bespoke deletion code. On the
  first sync from a device running the new bundle, `mergeEntries` drops `weakness-` via
  its existing `isTracked` guard, and `pushGist` PATCHes a full payload sans weakness-,
  wholesale-replacing the Gist content. Local `weakness-` keys are **not** deleted
  (`applyMergedEntries` only writes merged keys) — export still sees them.

## ⚠ Four existing tests inverted (ship prompt said two)

The ship prompt cited "two tests at `sync-engine.test.js:43-50`." Running the full suite
surfaced **four** tests encoding the old (synced) behaviour — flagged per
verify-cited-baselines. All four flipped deliberately, each with an inversion comment:

1. `sync-engine.test.js` `isTracked covers weakness-` → now asserts `isTracked === false`.
2. `sync-engine.test.js` `isLocalOnly: weakness- NOT local-only` → now asserts `=== true`.
3. `sync-engine.test.js` `mergeEntries: weakness- records merge` → rewritten as
   **`mergeEntries: drops weakness- from BOTH local and remote (auto-prune mechanism)`** —
   the load-bearing prune fixture. Plus a new `scanTrackedKeys` fixture proving a
   new-bundle payload is weakness-clean.
4. `sync-engine.integration.test.js` `weakness- records propagate cross-device` →
   rewritten as **`weakness- records do NOT sync cross-device (LOCAL_ONLY)`**: each device
   keeps its own local record, neither receives the other's, the Gist is weakness-clean,
   and a genuinely-tracked `mc-` key still syncs (proving the deny-list only excludes
   weakness-).

## Validation

- `npm test` — **79/79 pass**, 0 fail (was 78; net +1 from splitting the merge test into
  the prune + scanTrackedKeys fixtures). Per-suite: unit 31, integration 14, study 22,
  main 12.
- `node scripts/validate-questions.mjs` — 0 errors, 4 pre-existing content warns.
- `npm run build` — clean (pre-existing chunk-size warning).

## THREE-PART GATE (verbatim) — runs before commit 5

> 1. Piece 1 ships alone.
> 2. Gate clears only when 24h elapse AND every device is positively confirmed on the
>    new bundle (device-state, not elapsed time — a stale-bundle device still tracks
>    weakness- and will re-push it, undoing the prune: the V_old-wipes-V_new shape).
> 3. Gist payload verified weakness-clean after all devices have synced.
> Commit 5 (import/export) proceeds only after all three clear.

Operationally: after this deploys, hard-reload the app on **every** device that syncs
(so each loads the new LOCAL_ONLY bundle), let each sync once, then verify the Gist no
longer contains any `weakness-` entries (DevTools or the gist file). Do not start commit
5 until all three conditions are positively confirmed — a single stale device re-pushes
the records and silently undoes the prune.

## Schema impact

None to the payload `schemaVersion`. This is a `LOCAL_ONLY` deny-list change; the Gist
payload simply stops carrying `weakness-` keys.

## What's next

Gate runs (above). Then **commit 5** (Q-F-1: extend export/import to include `weakness-`
records) — now the deliberate cross-device path. Separately logged, not now: the
`deriveHealth`/`formatTime` → `sync-health.js` extraction (Piece 2 follow-up) lands
alongside commit 6 (SCHEMA/docs).
