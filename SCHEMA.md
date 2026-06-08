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
`suppressed` | optional | boolean | When `true`, the item is excluded from every served pool (Quiz/Flashcards/Review/Drill via `buildPool()`, the exam simulator, and availability counts) while remaining in the file. A reversible soft-retire — remove the field to restore. The record (`q`/`opts`/`a`/`exp`/`sybex_reference`) is left intact and its SM-2 key is unchanged. First used 2026-06-08 to retire 6 figure-dependent Sybex MCs that are unanswerable as text. Applies to scenarios too (same `video.scenarios[]` shape).
`suppressionReason` | optional | string | Free-text provenance for a `suppressed` item. Tooling/audit metadata only; not shown in the UI. Co-present with `suppressed` by convention.

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

## Sybex citation (`sybex_reference`, top-level)

A **Sybex-native** item (folded in from the Sybex Study Guide test banks, Task 1g) cites
its source with a top-level `sybex_reference` object instead of `messerVideo` +
`subObjective`. The validator (since Task 1g.1, `822e04a`) accepts an item cited by EITHER
the Messer pair OR a top-level `sybex_reference`, or both.

```jsonc
{
  "q": "...", "opts": ["..."], "a": 2, "exp": "...",
  "sybex_reference": {
    "edition": "Chapple 9th",     // required, non-empty string
    "question_number": 1,          // required, integer >= 1
    "chapter": 4                   // chapter OR practice_exam (exactly one), integer >= 1
  }
}
```

Field | Required | Type | Rule
--- | --- | --- | ---
`edition` | yes | string | Non-empty. Canonical value `"Chapple 9th"` is a **content** rule enforced by 1g.4 conversion, NOT the validator (validator checks non-empty only).
`question_number` | yes | integer ≥ 1 | The source question number (`n`).
`chapter` | one of | integer ≥ 1 | For chapter test-bank items (`chapter-NN.json`). **Exactly one** of `chapter` / `practice_exam`.
`practice_exam` | one of | integer ≥ 1 | For practice-exam items (`practice-exam-NN.json`). **Exactly one** of `chapter` / `practice_exam`.
`section` | optional | string | Accepted, unenforced at top level.
`page` | optional | integer ≥ 1 | Accepted, unenforced at top level.
`quote_excerpt` | optional | string | Accepted, unenforced — see semantics note.
`chapter_level_only` | optional | boolean | Accepted, **semantically inert** at top level — see semantics note.
`note` | optional | string | Free-text.

**Semantic difference vs `audit_d_review.sb_fix_2.sybex_reference`.** The nested audit-trail
`sybex_reference` is an **evidence pointer** — it records *where in the book* a Messer-cited
term also appears, with `quote_excerpt` as verbatim proof (waived by `chapter_level_only=true`
when the term lives only in unreachable chapter prose). The top-level `sybex_reference` is a
**primary content citation** — the item *is* the Sybex question, so there is no evidentiary
burden: `quote_excerpt` is never required and `chapter_level_only` has nothing to waive
(accepted only for shape compatibility with the nested form). See
`### audit_d_review.sb_fix_2 semantics` for the audit-trail shape — this section does not
duplicate it.

**Validator error codes** (`scripts/validate-questions.mjs`, `checkSybexReference()`):

Code | Fires when
--- | ---
`sybex-shape` | `sybex_reference` present but not an object
`sybex-edition` | `edition` missing or empty
`sybex-question-number` | `question_number` missing or not an integer ≥ 1
`sybex-locator` | not exactly one of `chapter` / `practice_exam` (zero or both), or a present locator not an integer ≥ 1

## `sourceProvenance` (item source provenance)

Optional top-level string enum on any item, recording which corpus the item came from.

Value | Meaning
--- | ---
*(field absent)* | Implicit `"messer"` — all existing Professor Messer-derived content.
`"messer"` | Explicit Messer provenance (rarely written; absence is the normal signal).
`"sybex-chapter"` | Folded in from Sybex chapters 02-17 (Task 1g.4).
`"sybex-practice-exam"` | Folded in from Sybex practice exams 1+2 (Task 1g.4).

**Existing items: the field is OMITTED (not backfilled).** Absence ≡ `"messer"`. Filter code
**should normalize** the absent case via `(item.sourceProvenance ?? "messer")`.

**Audit-script filter convention (future contract, not current behaviour).** This documents
the *intended* landing point for future audit-script work, not an existing implementation —
no audit script reads `sourceProvenance` today, and the Task 1g.1 validator does not reach
for it. When that filter ships, Audit D scripts are expected to skip Sybex-native items via
`(item.sourceProvenance ?? "messer") !== "messer"` (Sybex content is in-source by definition;
no `audit_d_review` needed). Enforcement landing points: 1g.4 conversion *writes* the field on
the 500 Sybex items; a future audit-script ship *adds* the skip filter.

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
`"cross-source-curriculum-gap"` | Concept is absent from both Messer's transcripts AND Sybex (glossary, practice tests, and book index). The item is exam-relevant (cited CompTIA objective covers the topic area) but no study-source authority teaches the technique at the depth the question tests. Items in this category are kept-as-enrichment; no citation re-targeting is possible. | HSTS under On-path Attacks (§2.4.9 mc[2]) — HSTS is the canonical SSL-stripping defense under CompTIA objective 2.4, but is absent from Messer transcripts, the Sybex glossary (70pp), Sybex Ch12 practice tests, and the Sybex book index (pp 629-652).

Backfill audit: SB-fix-1a's 10 sb16-candidates (Spectre/Meltdown, SYN
flood, DNS tunneling, evil twin, WPA2 handshake, IDOR, credential
stuffing x3, pass-the-hash) are all `partial-depth` — their cited
videos' umbrellas conceptually contain the tested techniques.
SB-fix-1b packet 2's integer overflow (#36, #37) introduces the first
`messer-curriculum-gap` cases. Established 2026-05-21.
`cross-source-curriculum-gap` added 2026-05-24 (G-packet Item 3); HSTS
(§2.4.9 mc[2]) is the first case — absent from Messer AND all three Sybex
tiers, so no citation re-targeting is possible and the item stays
kept-as-enrichment.

When a new audit script needs a record on items, it should:
1. Pick a stable `audit_<scope>_<purpose>` name.
2. Add a row to the table above (one-line description).
3. Confirm via grep that no React code reads the new field.

### `audit_d_review.sb_fix_2` semantics

Records SB-fix-2 decisions per sb16-candidate item. Nested inside
`audit_d_review` to preserve the SB-fix-1a/1b audit trail without
field-name collision (SB-fix-2 has its own `from_*` /
`applied_*` fields that would clash at the top level).

Added 2026-05-22 by SB-fix-2 sub-batch (`scripts/sb-fix-2-apply-packet.mjs`).
Tooling-metadata only — React app does not read this block (per
Q-D-1 from SB-fix-1b-prep + Q-E-2 from SB-fix-2 scoping).

Fields:

Field | Type | Required when | Notes
--- | --- | --- | ---
`decision` | string enum | always | One of `keep-with-sybex-note`, `re-cite-to-sybex`, `rewrite-to-messer`, `flag-for-removal`, `promote-to-sybex-citation`
`sybex_reference` | object | every decision except `flag-for-removal` | Structured citation; see sub-fields below
`sybex_reference.edition` | string | when `sybex_reference` present | Canonical value `"Chapple 9th"` per Q-B-1 (Chapple/Seidl SY0-701 Study Guide, 9th edition)
`sybex_reference.chapter` | integer ≥ 1 | when `sybex_reference` present |
`sybex_reference.section` | string non-empty | when `sybex_reference` present |
`sybex_reference.page` | integer ≥ 1 | optional | Section-anchored citations are robust to reprints; page is best-effort
`sybex_reference.chapter_level_only` | boolean | optional | `true` = chapter-level Tier 3 citation (see below); waives the `quote_excerpt` requirement
`sybex_reference.quote_excerpt` | string ≤ 500 chars | when `sybex_reference` present **unless `chapter_level_only` is `true`** | Audit-trail evidence; optional (and typically absent) for chapter-level citations
`comptia_objective_reference` | string | required on `re-cite-to-sybex` + `keep-with-sybex-note`; optional elsewhere | SY0-701 objective code, e.g. `"2.4"` or `"2.4.6"`
`applied_at` | ISO 8601 timestamp | always |
`applied_by` | string | always | E.g. `"sb-fix-2-packet-3"`
`note` | string | optional | Free-text explanation
`from_messerVideo` | string | written on `re-cite-to-sybex` | Pre-state snapshot of the Messer citation being cleared
`from_subObjective` | string | written on `re-cite-to-sybex` | Pre-state snapshot
`original_content` | object | written on `rewrite-to-messer` | Snapshot of pre-rewrite item state for audit replay
`removal_reason` | string | required on `flag-for-removal` |

Canonical citation string format (rendered by
`scripts/sb-fix-2-apply-packet.mjs`'s `formatSybexCitation()`
helper): `"Chapple 9th, Chapter N, §Section, p.NN"`. Gracefully
degrades to `"Chapple 9th, Chapter N, §Section"` when `page` is
absent.

`chapter_level_only` (chapter-level Tier 3 citation) added 2026-05-24
(P1-packet Group B). It marks a citation where the Sybex **chapter is the
TOC-mapped natural home** for the tested concept, but the **specific term
is absent from Tier 1+2** (the supervisor-reachable glossary, book index,
and practice-test corpus) and may live only in the chapter **prose**
(Tier 3 — unreachable without the physical book). For these,
`quote_excerpt` is waived (no verbatim term quote exists to cite), and the
flag makes "chapter-level" a first-class, queryable property rather than a
sentinel buried in the quote field. `sb16_subcategory` is **unaffected**
(it stays `partial-depth` — the Messer-curriculum relationship is a
separate axis from Sybex citation depth). Distinct from
`cross-source-curriculum-gap` (added at `9eb4311`), where the concept has
NO home in any source incl. the Sybex TOC; chapter-level Tier 3 items DO
have a TOC chapter home, just not a term-level quote.

For the top-level Sybex-native citation (primary content, not audit-trail), see
`## Sybex citation (sybex_reference, top-level)`.

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

### Sybex SM-2 key scheme (Task 1g)

Sybex-native items (Task 1g fold-in) use a **content-derived** key, not the array-index
scheme above:

Source | Key pattern | Example
--- | --- | ---
Sybex chapter | `sybex-mc-ch{NN}-q{N}` | `sybex-mc-ch04-q1` (chapter 4, question 1)
Sybex practice exam | `sybex-mc-pe{NN}-q{N}` | `sybex-mc-pe01-q26` (practice exam 1, question 26)

`{NN}` = zero-padded chapter (`02`-`17`) or practice-exam (`01`-`02`) number; `{N}` =
`sybex_reference.question_number`. Globally unique by construction.

**Collision-safety.** The existing scheme is `mc-{videoId}-{qi}` where `videoId` is a
dotted-decimal section id (e.g. `mc-2.4.9-2`). The literal `sybex-` infix can never appear in
a dotted-decimal videoId, so the two key namespaces are disjoint by construction — no
collision is possible.

**Zero-padding (deliberate inconsistency with dotted-decimal ids).** Section ids elsewhere
are unpadded dotted decimals (`2.4.9`); these Sybex keys zero-pad their segments (`ch04`,
`pe01`). This is intentional: the Sybex source filenames are already zero-padded
(`chapter-04.json`, `practice-exam-01.json`), so the key scheme inherits padding from the
source and each key visibly traces to its file; fixed-width segments also sort in
chapter/exam order. The two namespaces never mix in any comparison or sort (see
collision-safety), so the inconsistency cannot cause a bug. Aligning them would force either a
forbidden whole-corpus key migration (padding the dotted decimals) or losing the
source-filename trace (un-padding the Sybex keys) — both cost more than they save.

**App-wiring required (deferred to 1g.4/1g.6).** The app currently derives SM-2 keys by
**array index**: `mcKey(videoId, qi)` returns `mc-{videoId}-{qi}` (`src/secplus-quiz.jsx:44`).
This does NOT produce the content-derived Sybex keys above — a synthetic per-section video
would yield `mc-sybex-2.4-0`, not `sybex-mc-ch04-q1`. A `sybexKey()` helper (or a per-item key
override that reads `sybex_reference`) must be added when the fold-in lands. Documenting the
scheme here is the spec; the app derivation change is 1g.4/1g.6 scope. Side benefit: because
the key is content-derived (chapter/exam + `question_number`), Sybex item progress is **immune
to the array-reorder fragility** that constrains the index scheme (implications 2-3 above).

**scen-/match-/cram- variants (forward-looking).** The initial 500-item fold-in is all MC, so
only `sybex-mc-*` is active. The pattern generalizes to `sybex-{type}-{ch|pe}{NN}-q{N}` if a
future fold-in adds scenario/matching/cram Sybex items; not pre-specified now (YAGNI).

## Cross-device sync (Task 1.5)

The sync engine in `src/sync/sync-engine.js` reconciles a subset of
localStorage with a private GitHub Gist. It identifies sync-eligible keys
via two filters: TRACKED_PREFIXES (allow-list) and LOCAL_ONLY (deny-list,
which overrides the allow-list).

### TRACKED_PREFIXES

Any localStorage key starting with one of these is a sync candidate (current code list in
`src/sync/sync-engine.js`):

- `mc-` — multiple-choice SM-2 records (legacy / Messer-cited items only; Sybex MC keys lead
  with `sybex-` and are matched by the `sybex-` entry below)
- `scen-` — scenario SM-2 records
- `match-` — matching-question SM-2 records
- `cram-` — cram-term SM-2 records (added Task 2 SB-0)
- `weakness-` — per-attempt weakness-tracker records (added for the weakness-tracker, Task 1h)
- `sybex-` — load-bearing (added Task 1g.0, activated by 1g.6) for any key whose FIRST segment
  is `sybex-`. Covers the active `sybex-mc-*` corpus (499 items as of 1g.6) and any future
  `sybex-scen-*` / `sybex-match-*` / `sybex-cram-*` additions. `src/sm2-keys.js` emits this
  prefix on every item with a top-level `sybex_reference`.
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
