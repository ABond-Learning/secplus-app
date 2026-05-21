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
  "answer": "Detective",
  "messerVideo": "1.1 - Security Controls",  // optional, only when re-cited
  "subObjective": "1.1"                       // optional, only when re-cited
}
```

Field | Required | Type | Notes
--- | --- | --- | ---
`prompt` | yes | string | The pair prompt.
`answer` | yes | string | The pair answer.
`messerVideo` | optional | string | Per-pair citation override. Absent → pair inherits the parent video's `title` for any UI purpose. Tooling-only metadata (see Audit-trail boundary below). Added by Audit D remediation scripts (SB-fix-1b). **Both-or-neither rule with `subObjective`** (see "Citation field rules" below).
`subObjective` | optional | string | Per-pair sub-objective. Must match `\d+\.\d+(\.\d+)?` if present. Same both-or-neither rule.

## Cram term

Lives in `video.cram[]`.

```jsonc
{
  "term": "Preventive control",
  "def": "Stops a threat BEFORE it occurs. Examples: firewall, lock, ACL, MFA.",
  "messerVideo": "1.1 - Security Controls",  // optional, only when re-cited
  "subObjective": "1.1"                       // optional, only when re-cited
}
```

Field | Required | Type | Notes
--- | --- | --- | ---
`term` | yes | string | The cram term.
`def` | yes | string | The definition.
`messerVideo` | optional | string | Per-term citation override. Same shape + rule as MatchItem. Added by Audit D remediation scripts (SB-fix-1b).
`subObjective` | optional | string | Per-term sub-objective. Must match `\d+\.\d+(\.\d+)?`. Same both-or-neither rule.

## Citation field rules (`messerVideo` + `subObjective`)

Both fields are **co-required when either is present.** Presence of `messerVideo` OR `subObjective` on any item (mc, scenario, matching pair, cram term) flips the item into "NEW" classification and requires both fields with valid values. Partial citation (one field present, the other absent) is a malformed state and the validator rejects it as `missing-messer` or `missing-subobj`.

Field | Type | Rule
--- | --- | ---
`messerVideo` | string | Exact Professor Messer video title (e.g. `"2.3 - Common Attack Types"`). Bounded by the 120-entry known-title set in `questions.json`. Quality Rule 1.
`subObjective` | string | SY0-701 sub-objective (e.g. `"2.3.6"`). Must match `\d+\.\d+(\.\d+)?`. Quality Rule 2.

Type-level enforcement:

Item type | NEW-item requires both? | Legacy info-flag emitted when absent?
--- | --- | ---
MC | YES | YES (`legacy-no-citation`)
Scenario | YES | YES (`legacy-no-citation`)
MatchItem | YES (when either present) | NO (citation is structurally optional)
CramTerm | YES (when either present) | NO (citation is structurally optional)

This split exists because mc/scen items required citations as part of Task 1b's quality bar (every NEW MC/scenario authored in Task 1b carries citations). Match + cram items inherit their citation from the parent video by default; Audit D remediation may add per-item overrides, in which case the both-or-neither rule applies.

## Citation enforcement on mc/scen vs match/cram — historical note

Per CLAUDE.md Quality Rules 1 and 2, every NEW question added in Task 1b must
include `messerVideo` + `subObjective`. Existing content was grandfathered.
Match + cram items historically had no citation fields; they were added as
optional per-item overrides in SB-fix-1b-prep (2026-05-21) to support Audit D
partial-adjacent remediation on the 134-item D2 match+cram pool deferred from
SB-fix-1a. The both-or-neither rule above governs the per-item override
mechanics across all four types; the type-level enforcement table above
captures the asymmetry (mc/scen citation REQUIRED for NEW items; match/cram
citation OPTIONAL but co-required when either field is present).

The validator (`scripts/validate-questions.mjs`) enforces these rules
uniformly via a single `checkCitation()` helper called from all four type
walkers since SB-fix-1b-prep.

## Audit-trail fields (`audit_*` prefix convention)

Any field on an item or video prefixed with `audit_` is **tooling-only
metadata** — written by audit / remediation scripts to record provenance and
review history. **The React app never reads these fields.** They are safe to
add to or remove from any item without UI impact.

Convention:

- `audit_*` fields are pure data records. The React app's JSON parser
  passes them through into in-memory item objects but no UI code branches on
  them.
- Future audit scripts that add new audit fields must use the `audit_`
  prefix to make the boundary unambiguous.
- Audit fields are valid input to the export/import flow (they round-trip
  via localStorage and gist sync) but do not affect SM-2 keys, study
  surfacing order, or scoring.

Current `audit_*` fields:

Field | Owner | Purpose
--- | --- | ---
`audit_d_review` | SB-fix-1a (shipped 2026-05-20) + SB-fix-1b (pending) remediation pipelines | Per-item record of the Audit D re-citation decision: `{ reviewed_at, packet_id, decision_type, from_messerVideo, from_subObjective, to_messerVideo, to_subObjective, kept_as_is?, sb16_candidate?, sb16_subcategory?, resolved_self_alternate?, note? }`. Added to mc/scen items by `scripts/sb-fix-1a-apply-packet.mjs` and (pending) to match/cram items by `scripts/sb-fix-1b-apply-packet.mjs` (same field shape across all four types).

### `audit_d_review.sb16_subcategory` semantics

Routes sb16-candidate items to the correct SB-fix-2 resolution path.
The load-bearing distinction is **umbrella-conceptual-fit** between the
tested technique and the cited video's taught content — not specific-
technique transcript presence.

Value | Meaning | Example
--- | --- | ---
`"partial-depth"` | Cited video's umbrella concept conceptually contains the tested technique; the specific technique is absent from the transcript (and may be absent from the corpus). SB-fix-2 may resolve by re-writing items to test the umbrella directly, or by adding a new sub-video citation. | Spectre/Meltdown under Hardware Vulnerabilities (umbrella = hardware-as-attack-vector subsumes CPU speculation). SYN flood under Denial of Service (umbrella subsumes SYN flooding).
`"messer-curriculum-gap"` | Cited video's umbrella does NOT contain the tested technique — the cited video is a SIBLING concept, not the parent. The tested concept has no umbrella home in the Messer corpus. SB-fix-2 may resolve by re-citing to a generic survey video, re-writing items to test a covered concept, or flagging for removal as out-of-Messer-scope. | Integer overflow under Buffer Overflows (buffer-overflow umbrella = memory-write-beyond-bounds; integer-overflow umbrella = arithmetic-exceeds-type-range; distinct concepts sharing only the word "overflow").

Backfill audit: SB-fix-1a's 10 sb16-candidates (Spectre/Meltdown, SYN
flood, DNS tunneling, evil twin, WPA2 handshake, IDOR, credential
stuffing x3, pass-the-hash) are all `partial-depth` — their cited
videos' umbrellas conceptually contain the tested techniques.
SB-fix-1b packet 2's integer overflow (#36, #37) introduces the first
`messer-curriculum-gap` cases. Established 2026-05-21.

When a new audit script needs a record on items, it should:
1. Pick a stable `audit_<scope>_<purpose>` name.
2. Add a row to the table above (one-line description).
3. Confirm via grep that no React code reads the new field.

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
5. Per-item `messerVideo` / `subObjective` on match / cram items does NOT
   affect SM-2 key shape — keys remain `{type}-{videoId}-{qi}` derived from
   the parent `videoId`. Adding or changing per-item citation is safe at the
   localStorage layer; no migration is required.

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
