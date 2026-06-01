# Option B (refined) — weakness- sync hardening: build plan (plan-first, no edits)

**Rule #12:** I re-traced the full sync cycle (`doSync` 342–368: fetch → buildLocal →
merge → apply → push), the merge-drop guard (`mergeEntries` line 79), `fetchGist`
(283–309), the status/health surface (`getStatus` + `deriveHealth`), and the existing
sync tests. Two things the ship prompt didn't anticipate fell out and are flagged
inline: **the prune is automatic (no cleanup code needed) but gated on all-devices-
reloaded**, and **two existing tests assert the exact behaviour Piece 1 inverts**.
Read-only; no edits.

This supersedes commit 5 as the next build. Commit 5 (Q-F-1 export/import) follows
after B lands and its gate clears.

---

## PIECE 1 — reclassify `weakness-` as LOCAL_ONLY

### 1.1 The change + mechanism (confirmed correct)

One line in `src/sync/sync-engine.js`:

```js
export const LOCAL_ONLY = [
  { kind: "prefix", value: "secplus-sync-" },
  { kind: "exact",  value: "secplus-last-backup-at" },
  { kind: "exact",  value: "secplus-backup-banner-snooze-until" },
  { kind: "exact",  value: "secplus-v4-exam-session" },
  { kind: "prefix", value: "weakness-" },   // NEW
];
```

Shape: `{ kind: "prefix", value: "weakness-" }` (prefix, not exact — keys are
`weakness-{questionId}-{ts}`). Deny-list override is already correct by construction:
`isTracked` (line 44–48) returns `false` immediately if `isLocalOnly` matches, *before*
checking `TRACKED_PREFIXES`. So `weakness-` keys stop entering `scanTrackedKeys` →
`buildLocalEntries` → `buildPayload`, while every other prefix is untouched. Verified
against the existing `LOCAL_ONLY overrides TRACKED_PREFIXES` test (line 94).

### 1.2 ⚠ Two existing tests assert the OPPOSITE — they must flip

`sync-engine.test.js` currently encodes the soon-to-be-old behaviour and will fail
after the change unless updated in the same commit:

- **L43–46** `isTracked covers weakness- prefix (added 2026-05-22)` → asserts
  `isTracked("weakness-…") === true`. Must become `=== false`.
- **L49–50** `isLocalOnly: weakness- prefix is NOT local-only (syncs cross-device)` →
  asserts `isLocalOnly("weakness-…") === false`. Must become `=== true`, and the test
  name/intent inverted.

These aren't collateral breakage — they're the regression guards for the *previous*
decision. Flipping them (with a comment citing this Option-B reclassification) is part
of Piece 1, and is the auditable record that the behaviour change was deliberate.

### 1.3 Cleanup of already-pushed records — automatic, no extra code

Already-synced `weakness-` entries are pruned **automatically on the first sync from a
device running the new bundle**, via the existing merge-drop:

- `doSync` pushes `merged` (line 355), and `mergeEntries` drops any key where
  `!isTracked(k)` (line 79 — the "belt-and-braces drop LOCAL_ONLY keys leaked from
  remote" guard, already tested at L172). After reclassify, `weakness-` is not tracked
  → dropped from `merged` → `pushGist` PATCHes the file with a **full** payload sans
  weakness- (line 324 is a wholesale content overwrite, not a delta). One push cleans
  the Gist entirely.

No devtools one-liner or manual force-push needed. **Local `weakness-` records are NOT
deleted** — `applyMergedEntries` only *writes* merged keys, never removes local ones —
so export (commit 5) still sees the full local history. The reclassification stops
syncing the data; it does not destroy it.

### 1.4 The race, and why the gate is mandatory

The prune is **not durable until every device runs the new bundle.** If Device A has
the new bundle (drops weakness- on push) but Device B still runs the old bundle:
B's `local` still includes weakness- → B fetches A's cleaned Gist → merges → B's
weakness- keys are `isTracked === true` *on B* → survive → **B re-pushes them back.**
The Gist ping-pongs until the last stale device reloads.

→ This is exactly the **hygiene-first 24h-gate** (SB-0 / Task 1g.0 precedent;
memory `feedback_sync_engine_hygiene_first`). Stated explicitly:

1. Piece 1 ships **alone** (no dependent behaviour in the same release).
2. **All devices reload** the new LOCAL_ONLY bundle (hard refresh) before the prune is
   trusted. With no other code riding the change, a stale device can only delay the
   prune, never corrupt other data (weakness- local copies are intact everywhere).
3. **Wait 24h** + verify on each device that sync is green and the Gist no longer
   carries weakness- entries, before commit 5 (the dependent feature) builds.

Cross-device note: weakness records already synced to a device stay on that device;
records that hadn't yet propagated simply won't. That divergence is the accepted Option-B
trade — export/import (commit 5) becomes the deliberate cross-device path.

Optional pre-step (not blocking): before shipping, Aiden can size the current Gist /
count its weakness- entries via the DevTools snippet to gauge how bloated it already is
— informational only.

---

## PIECE 2 — `fetchGist` truncation safety (independent integrity fix)

Lands **regardless** of Piece 1 — it protects SM-2 progress even if the payload never
bloats. Recommend it ships **first** (ungated), so the data-loss-masking bug is closed
before anything else.

### 2.1 The current bug (confirmed)

`fetchGist` (302–308): `JSON.parse(file.content)` with a `catch` that **returns
`{ entries: {} }`**. It never checks `file.truncated` or `file.raw_url`. Past the
truncation threshold, `file.content` is partial → parse throws → caught → empty payload
→ `mergeEntries(local, {})` keeps local and re-pushes it → **cross-device reconciliation
silently stops for ALL data, with no error surfaced.** Silent degradation, the worst
kind.

### 2.2 The fix

In `fetchGist`, after resolving `file`:

```
if (file.truncated && file.raw_url) {
  // GitHub truncates inline `content` past ~1 MB; full body is at raw_url.
  const rawRes = await f(file.raw_url, { headers: authHeaders });
  if (!rawRes.ok) throw new Error(`sync payload truncated; raw fetch failed (${rawRes.status})`);
  const rawText = await rawRes.text();
  try { return parsePayload(JSON.parse(rawText)) || EMPTY; }
  catch { throw new Error("sync payload truncated and unparseable from raw_url"); }
}
```

And critically — for the **non-truncated** parse failure (the existing `catch` at 307):
distinguish "remote genuinely empty / first run" (file absent → legitimately empty, keep
the 304/no-file path returning empty) from "file present but content unparseable" →
**throw** instead of returning empty. A present-but-unparseable file is corruption, not
emptiness; throwing routes to `doSync`'s catch (364–368) which sets `lastError` +
`notify()` → loud degraded state, and (because `merged`/push is skipped on throw) **does
not overwrite the Gist** with a local-only payload.

### 2.3 Make it loud in the UI

`deriveHealth` (`SyncSettings.jsx:50`) only red-flags `/auth failed|gist not found/`.
A truncation error would currently fall through to amber "degraded" only after staleness.
Extend the red-condition regex to also match the truncation marker (e.g.
`/auth failed|gist not found|truncated|payload too large/i`) so the user sees a clear
red "Sync error — payload too large" immediately, not a vague delayed amber. This is the
"loud lastError" the decision calls for.

### 2.4 Threshold reconciliation (the docs both describe different limits)

GitHub gist API documented behaviour:
- A file's inline **`content` is truncated once it exceeds ~1 MB**; the response sets
  `truncated: true` and provides `raw_url`. → **This is the silent-empty trigger, and it
  is recoverable via raw_url.** PLAN.md's "1 MB" refers to *this*.
- **raw_url serves up to ~10 MB**; files larger than that aren't retrievable via the API
  at all. → This is the hard ceiling. The impl-plan's "5–10 MB" loosely refers to *this*.

So both numbers are right about different thresholds; neither doc said which. Piece 2
handles the 1 MB truncation (raw_url recovery + loud failure); Piece 1 keeps the payload
bounded so we never approach the ~10 MB hard ceiling. I'll cite "~1 MB inline-content
truncation / ~10 MB hard cap" in the code comment + error text, and recommend a 60-second
confirmation against GitHub's current gist API docs before merging (I'm stating documented
behaviour from knowledge, not a live check).

---

## Tests to add / change

**Piece 1 (pure-fn, `sync-engine.test.js`):**
- Flip L43–46 and L49–50 (see §1.2) — weakness- now `isTracked === false` /
  `isLocalOnly === true`, with an Option-B comment.
- Regression guard: `isTracked` still true for `mc-/scen-/match-/cram-/sybex-/secplus-`
  (deny-list doesn't over-match) — extend the existing prefix test.
- `scanTrackedKeys` on mixed storage (weakness- + mc- + scen-) → output excludes
  weakness-, includes the rest.
- **Prune fixture (the load-bearing one):** `mergeEntries(localWithoutWeakness,
  remoteWithWeaknessEntries)` → `merged` contains **no** weakness- keys (proves the
  auto-clean on next push). Extends the existing L172 "drops LOCAL_ONLY via remote" test
  to the weakness- case specifically.

**Piece 2 (integration, `sync-engine.integration.test.js`, fake `fetch` per the existing
`fetch: fetchFn` injection at L107):**
- truncated `content` + valid `raw_url` whose body parses → `fetchGist` returns the
  recovered payload (recovery path); a subsequent merge sees real remote entries.
- truncated + `raw_url` fetch non-ok → throws; `getStatus().lastError` set, Gist NOT
  overwritten (assert no push of local-only payload).
- truncated + `raw_url` body unparseable → throws (degraded), not silent-empty.
- present-but-unparseable inline content (not truncated) → throws (degraded), not empty.
- not-truncated valid content → unchanged behaviour (regression).
- file absent (first run) → still legitimately empty (no false alarm).
- `deriveHealth` unit: a `lastError` containing "truncated" → red status (not amber).

---

## Sequencing summary

1. **Commit B-2 (Piece 2) first** — truncation safety + deriveHealth + tests. Ungated,
   pure integrity; protects SM-2 data immediately and during Piece 1's rollout window.
2. **Commit B-1 (Piece 1)** — LOCAL_ONLY reclassify + flipped/added tests. Ships
   **alone**; all devices hard-reload; **24h gate** + verify Gist is weakness-clean and
   sync green on every device.
3. **Then commit 5 (Q-F-1 export/import)** builds — now genuinely the cross-device path
   for weakness data.

(If you'd rather one B commit, the two are independent and could combine — but Piece 1 is
the gated sync-prefix change, and hygiene-first wants it standalone, so I recommend the
split above.)

**Flag-if-wrong checks for you:** (a) the prune-via-merge-drop being automatic — agree no
explicit cleanup code is needed? (b) shipping Piece 2 before Piece 1 — or do you want
Piece 1's reclassify to land first? (c) extending `deriveHealth`'s red regex — in scope
for Piece 2, or keep it minimal and let degraded-amber suffice?

---

**Paused for sign-off.** No edits, no build. On approval I implement Piece 2 → tests →
build → (no browser gate needed; it's sync-layer, integration-tested) → commit; then
Piece 1 standalone under the 24h gate.
