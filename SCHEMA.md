# SCHEMA.md — questions.json

The contract between `questions.json` and `src/secplus-quiz.jsx`. Any change to
field names, types, or semantics must update this file and the validator first.

Counts as of Phase A extraction: 28 sections, 120 videos, 433 MC, 277 scenarios,
580 matching pairs, 671 cram terms.

## Top-level

`questions.json` is a JSON array of **section** objects, ordered by SY0-701
sub-objective number.

## Section

```jsonc
{
  "id": "1.1",                    // string, SY0-701 objective number
  "label": "1.1 – Security Controls",
  "videos": [ /* Video[] */ ]
}
```

Field | Required | Type | Notes
--- | --- | --- | ---
`id` | yes | string | Matches the parent SY0-701 objective. Must be unique across the file.
`label` | yes | string | Human-readable section title shown in the UI.
`videos` | yes | Video[] | At least one entry.

## Video

```jsonc
{
  "id": "1.1.1",                  // string, must start with parent section id + "."
  "title": "Security Controls",
  "cram": [ /* CramTerm[] */ ],   // required, may be empty
  "matching": [ /* Match[] */ ],  // required, may be empty
  "questions": [ /* MC[] */ ],    // required, may be empty
  "scenarios": [ /* Scenario[] */ ] // OPTIONAL — present on 102/120 videos
}
```

`id` is the localStorage key root. **Never reorder questions/scenarios within a
video, and never change a video id**, or you will silently invalidate users'
SM-2 progress (see "localStorage compatibility" below).

## MC (multiple-choice question)

Lives in `video.questions[]`.

```jsonc
{
  "q": "Which control type is designed to stop a threat BEFORE it occurs?",
  "opts": ["Detective", "Corrective", "Preventive", "Compensating"],
  "a": 2,                          // 0-based index into opts
  "exp": "Preventive controls stop threats before they happen — firewalls, ACLs, locks, MFA."
}
```

Field | Required | Type | Rule
--- | --- | --- | ---
`q` | yes | string | The question stem. No emojis.
`opts` | yes | string[] | Exactly 4 options.
`a` | yes | integer | 0-based index of the correct option, in range `[0, opts.length)`.
`exp` | yes | string | Explanation. Quality Rule 3: ≥40 chars, includes reasoning.

## Scenario

Same shape as MC, just lives in `video.scenarios[]`. Stems are typically longer
and describe a workplace situation.

## Matching pair

Lives in `video.matching[]`.

```jsonc
{
  "prompt": "CCTV monitoring a server room",
  "answer": "Detective"
}
```

Field | Required | Type
--- | --- | ---
`prompt` | yes | string
`answer` | yes | string

## Cram term

Lives in `video.cram[]`.

```jsonc
{
  "term": "Preventive control",
  "def": "Stops a threat BEFORE it occurs. Examples: firewall, lock, ACL, MFA."
}
```

Field | Required | Type
--- | --- | ---
`term` | yes | string
`def` | yes | string

## Future fields (Task 1b, not yet enforced)

Per CLAUDE.md Quality Rules 1 and 2, every NEW question added in Task 1b must
include the following fields. Existing content is grandfathered — flagged in the
audit report but not modified.

Field | Type | Rule
--- | --- | ---
`messerVideo` | string | Exact Professor Messer video title (e.g. `"2.3 - Common Attack Types"`). Quality Rule 1.
`subObjective` | string | SY0-701 sub-objective (e.g. `"2.3.6"`). Must match `\d+\.\d+(\.\d+)?`. Quality Rule 2.

The validator (Phase B) treats these as required only on items added after the
Phase A extraction.

## localStorage compatibility

The React app stores per-question SM-2 data using keys derived from
`videoId + index in array`:

Key prefix | Source
--- | ---
`mc-{videoId}-{qi}` | `video.questions[qi]`
`scen-{videoId}-{qi}` | `video.scenarios[qi]`
`match-{videoId}-{qi}` | `video.matching[qi]`

Implications for any future schema change:

1. Do not change a video `id`. If you must rename, write a migration that copies
   old keys to the new id.
2. Do not reorder items within `questions`, `scenarios`, or `matching`. Adding
   items at the END of an array is safe; inserting in the middle is not.
3. Removing items shifts indices for everything after. Don't.
4. The umbrella localStorage key is `STORE_KEY = "secplus-v4"` with
   `SCHEMA_VERSION = 2`. Bumping the version triggers the in-app migration path.

## Cross-device sync (Task 1.5)

The sync engine in `src/sync/sync-engine.js` reconciles a subset of
localStorage with a private GitHub Gist. It identifies sync-eligible keys
via two filters: TRACKED_PREFIXES (allow-list) and LOCAL_ONLY (deny-list,
which overrides the allow-list).

### TRACKED_PREFIXES

Any localStorage key starting with one of these is a sync candidate:

- `mc-` — multiple-choice SM-2 records
- `scen-` — scenario SM-2 records
- `match-` — matching-question SM-2 records
- `secplus-` — the umbrella store and any other app-prefixed key

### LOCAL_ONLY (deny-list)

Checked first — keys here are NEVER synced even if their prefix matches
TRACKED_PREFIXES. Stored as a list of `{kind, value}` so we can mix coarse
prefix rules with surgical exact-key entries:

Kind | Value | Reason
--- | --- | ---
`prefix` | `secplus-sync-` | PAT, Gist ID, deviceId, ETag, scanner state — per-device, must never reach the Gist (which is unencrypted).
`exact` | `secplus-last-backup-at` | Per-device backup timestamp — banner logic should reflect THIS device's local backup history, not other devices'.
`exact` | `secplus-backup-banner-snooze-until` | Per-device snooze.

### Gist payload (schemaVersion 1)

A single file `secplus-sync.json` per Gist. Shape:

```jsonc
{
  "schemaVersion": 1,
  "deviceId": "<uuid>",
  "lastWriteAt": "2026-04-25T12:34:56.789Z",
  "entries": {
    "mc-1.1.1-0": { "value": "<original JSON-string>", "ts": "ISO" },
    "secplus-v4":  { "value": "<original JSON-string>", "ts": "ISO" }
  }
}
```

`value` is the verbatim string the React app already wrote to localStorage,
so the engine is value-agnostic. `ts` is the local-time stamp of when this
device last observed that key change.

`parsePayload` rejects any payload whose `schemaVersion` doesn't match
`PAYLOAD_SCHEMA_VERSION` — bumping requires a migration path.

### Engine local-state keys

Held under the `secplus-sync-` prefix (covered by LOCAL_ONLY):

Key | Shape | Purpose
--- | --- | ---
`secplus-sync-config` | `{pat, gistId, deviceId}` | Persisted credentials + device identity.
`secplus-sync-meta` | `{localTs, lastObservedValues, etag, lastSuccessAt}` | Scanner/sync runtime state.

### Merge semantics

Per-key latest-timestamp-wins. Tie → local wins (stable, prevents
ping-pong). Local entries with no `localTs` get the fallback timestamp
(usually `now` at engine init), which means a freshly-activated device
generally claims its current state as authoritative — for joining-device
scenarios where this is wrong, the engine exposes `pushAll()` (force
upload) and `pullAll()` (force overwrite) for explicit direction.

### Tombstones / deletes (v1 limitation)

The engine does NOT propagate deletes. If a key is removed from
localStorage on one device, the next pull will restore it from the Gist.
Adding tombstones is a candidate for schemaVersion 2 if needed.
