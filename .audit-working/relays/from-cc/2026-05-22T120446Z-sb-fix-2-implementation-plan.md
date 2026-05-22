# SB-fix-2 implementation plan — surface for review

NONCE: 2026-05-22T120446Z-a99c74fb

## Q-letter outcomes (recap)

| Q | Outcome |
|---|---|
| A-1 | Pool B routing first; unified pool downstream |
| B-1 | **Chapple/Seidl SY0-701 Study Guide, 9th edition** (explicit per Aiden) — citation format `"Chapple 9th, Chapter N, §Section, p.NN"` |
| C-1 | Sub-path-tuned sizing: R=18, G=2-5, P=20 |
| D-1 | Removal: NOT in CompTIA objectives AND NOT in Sybex/Tier-2 (conjunctive) |
| E-2 | `sybexReference` lives inside `audit_d_review.sb_fix_2` only — no item-level field, no validator change, no JSX change |
| F-2 | G first (calibration on hard cases), then P |
| G-1 | Re-use SB-fix-1b cluster-verify pre-grep methodology |

Combined sequencing: **R → G → P (P1 → P2 → optional P3
residual)**.

## Plan headline

CC built `.audit-working/sb-fix-2-implementation-plan.md`
(572 lines, 23 KB). Working copy gitignored per precedent;
full content inlined below for review.

The plan translates the 7 Q-letter outcomes into:

1. **Apply script shape** (`scripts/sb-fix-2-apply-packet.mjs`) —
   mirrors `sb-fix-1b-apply-packet.mjs` (~80% code reuse). Five
   decision types (keep-with-sybex-note / re-cite-to-sybex /
   rewrite-to-messer / flag-for-removal / promote-to-sybex-citation)
   with per-decision field requirements + validation rules.
2. **Per-packet workflow** — 4-5 packets expected (1 R + 1 G +
   2-3 P). Each packet runs the standard cadence Rules 1-6
   rhythm (build → relay surface → review → transcribe →
   dry-run → real apply → close-out brief).
3. **Audit field write spec** — additive
   `audit_d_review.sb_fix_2` block nests inside the existing
   audit-trail block (avoids field collision with SB-fix-1a/1b
   `from_*` and `applied_*` fields). Stores Sybex citation
   components separately (edition/chapter/section/page/excerpt)
   plus a `formatSybexCitation()` helper to render the canonical
   string format `"Chapple 9th, Chapter N, §Section, p.NN"`.
4. **Routing pre-step grep logic** — new script
   `scripts/sb-fix-2-route-pool-b.mjs` modelled on
   `sb-fix-1b-cluster-verify.mjs`. Four-way routing tree
   (partial-depth / messer-curriculum-gap / not-sb16 /
   partial-adjacent-not-sb16) with grep evidence inline for
   supervisor adjudication. CC's expected routing distribution
   (estimate only — supervisor decides): ~10 partial-depth, ~3
   curriculum-gap, ~3 not-sb16, ~2 partial-adjacent-deferred.

## Per-decision field-requirement matrix

| Field | keep-with-note | re-cite | rewrite | remove | promote |
|---|---|---|---|---|---|
| `decision` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `sybex_reference.edition` (= "Chapple 9th") | ✓ | ✓ | ✓ | — | ✓ |
| `sybex_reference.chapter` | ✓ | ✓ | ✓ | — | ✓ |
| `sybex_reference.section` | ✓ | ✓ | ✓ | — | ✓ |
| `sybex_reference.page` | optional | optional | optional | — | optional |
| `sybex_reference.quote_excerpt` (≤500 chars) | ✓ | ✓ | ✓ | — | ✓ |
| `comptia_objective_reference` | ✓ | ✓ | optional | optional | ✓ |
| `applied_at`, `applied_by` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `note` | opt | opt | opt | opt | opt |
| `from_messerVideo`, `from_subObjective` | — | ✓ snap | — | — | — |
| `original_content` | — | — | ✓ snap | — | — |
| `removal_reason` | — | — | — | ✓ | — |

## Commit sequence after sign-off

1. `sb-fix-2 scripts: apply + route + backfill skeletons` (4 new scripts with --selftest fixtures + SCHEMA.md update)
2. `SB-fix-2 R: Pool B routing build` (build packet R; surface)
3. `SB-fix-2 R: Pool B routing backfill (18 items)` (catalogue mutation after supervisor adjudication)
4. `SB-fix-2 G: messer-curriculum-gap items (N items, 1 packet)`
5. `SB-fix-2 P packet 1/M: 20 partial-depth re-citations + audit-field writes`
6. `SB-fix-2 P packet 2/M: 20 partial-depth …`
7. Optional `SB-fix-2 P packet 3/M: residual …`
8. `docs: PLAN + supervisor-handoff sync — SB-fix-2 CLOSED`
9. `Report-#0010 — SB-fix-2 closure + accumulated findings`

Estimated session count: 2-3. Per-packet supervisor review
~30-45 min; CC build/dry-run/apply ~10 min per packet.

## Edge cases addressed in plan

- Field collision between SB-fix-1a/1b `from_messerVideo` and SB-fix-2 — nested under `sb_fix_2` (§4.3).
- `packet_id` SB-fix-1a/1b name overlap acknowledged; SB-fix-2 uses `applied_by: "sb-fix-2-packet-N"` to avoid further collision.
- Pool A / Pool B zero overlap verified in scoping session.
- Future Chapple edition migration noted; out of scope until Aiden upgrades.

## What CC requests from Aiden

**Sign-off on the implementation plan.** Specifically:

- Decision-type set (5 values) acceptable?
- Citation field requirements acceptable (especially: is
  `page` optional, or should it be required for ≥X% of items)?
- Routing decision tree (4 outcomes for Pool B) acceptable?
- Commit sequence acceptable?

If yes: respond with brief authorisation, CC lands commit 1
(skeletons + SCHEMA) as the next session opener. If anything
needs adjustment: respond with the specific change and CC
revises before commit 1.

═══════════════════════════════════════════════════════════════
SB-fix-2 implementation plan (full content)
═══════════════════════════════════════════════════════════════

# SB-fix-2 — implementation plan (post-Q-letter resolution)

Generated: 2026-05-22 (CC implementation-plan session; $0 LLM spend; read-only audit of existing apply-script patterns + Q-letter outcomes).
Cadence: SURFACE-AND-HOLD before any code edits. Aiden sign-off gates implementation.
Successor to: `.audit-working/sb-fix-2-scoping-proposal.md` (Q-letter adjudication landed via direct chat 2026-05-22; Q-B-1 explicit, others at CC's leans).

---

## 1. Q-letter resolutions (recap)

| Q | Outcome | Effect on plan |
|---|---|---|
| A-1 | Pool B routing first; unified pool downstream | First SB-fix-2 packet is R (routing) |
| B-1 | Chapple/Seidl SY0-701 Study Guide, 9th edition | Citation string: `"Chapple 9th, Chapter N, §Section, p.NN"` |
| C-1 | Sub-path-tuned sizing | R=18, G=2-5, P=20 |
| D-1 | Removal: NOT in CompTIA objectives AND NOT in Sybex/Tier-2 | Removal threshold is conjunctive, not disjunctive |
| E-2 | `sybexReference` lives inside `audit_d_review.sb_fix_2` only | No item-level field; no validator change; no JSX change |
| F-2 | G first (2 items, calibration), then P | After R: G → P1 → P2 (+ residual P3 if Pool B routes inflate the P pool) |
| G-1 | Re-use SB-fix-1b cluster-verify pre-grep methodology | New script `scripts/sb-fix-2-route-pool-b.mjs` (modelled on `sb-fix-1b-cluster-verify.mjs`) |

Combined sequencing: **R → G → P (P1 → P2 → P3 residual)**.

---

## 2. Apply script shape — `scripts/sb-fix-2-apply-packet.mjs`

Modelled directly on `scripts/sb-fix-1b-apply-packet.mjs`
(established pattern, ~80% code reuse). Differences below; the
rest follows verbatim.

### 2.1 CLI

```
node scripts/sb-fix-2-apply-packet.mjs --decisions <path-to-packet-N-decisions.json> [--dry-run]
```

Same flag shape as SB-fix-1b. Same self-test-style validator
preflight + atomic-write pattern.

### 2.2 Decision types

Each packet's decisions JSON has per-item entries with one of
five `decision_type` values:

```jsonc
{
  "packet_index": 1,
  "decision_type": "keep-with-sybex-note",
  "sybex_reference": {
    "edition": "Chapple 9th",
    "chapter": 8,
    "section": "Bluetooth Attacks",
    "page": 342,
    "quote_excerpt": "Bluesnarfing is the unauthorized access of information from a wireless device through a Bluetooth connection."
  },
  "comptia_objective_reference": "2.4",
  "note": "Specific technique covered in Sybex §8 page 342; Messer 2.4 Wireless Attacks is the conceptual umbrella with bluesnarfing not in transcript."
}
```

Decision-type table:

| `decision_type` | Item mutation | Audit field write |
|---|---|---|
| `keep-with-sybex-note` | none | `audit_d_review.sb_fix_2.{decision, sybex_reference, comptia_objective_reference, applied_at, applied_by, note}` |
| `re-cite-to-sybex` | clears `messerVideo` + `subObjective` (sets to null) | same as above + `from_messerVideo`, `from_subObjective` |
| `rewrite-to-messer` | writes new `q`/`exp`/`opts` for mc/scen OR `term`/`def` for cram OR `prompt`/`answer` for match. Keeps existing citation. | same as above + `original_content` (snapshot of pre-rewrite item) |
| `flag-for-removal` | none (deferred cleanup) | same as above + `removal_reason` |
| `promote-to-sybex-citation` | none (item-level sybexReference deferred per Q-E-2) — for now this is identical to `keep-with-sybex-note` with a stronger note. Reserve the decision-type for future schema extension if Q-E flips to E-1/E-3. | same as `keep-with-sybex-note` |

Validation per decision (apply script error-and-halts on
violation):

- `sybex_reference.edition === "Chapple 9th"` required on
  every decision EXCEPT `flag-for-removal` (per Q-B-1)
- `sybex_reference.chapter` integer ≥ 1 required (except
  `flag-for-removal`)
- `sybex_reference.section` non-empty string required (except
  `flag-for-removal`)
- `sybex_reference.page` integer ≥ 1 OPTIONAL (Aiden may
  cite by section alone if page isn't readily available)
- `sybex_reference.quote_excerpt` non-empty, ≤ 500 chars
  (audit trail; truncate longer quotes)
- `comptia_objective_reference` non-empty string (e.g. "2.4",
  "2.4.6") required on `re-cite-to-sybex` and
  `keep-with-sybex-note`; OPTIONAL on others
- `removal_reason` non-empty required on `flag-for-removal`
- `original_content` snapshot required on `rewrite-to-messer`
  (the script captures it; supervisor doesn't write it
  manually in the decisions JSON)

### 2.3 Idempotency

Same pattern as SB-fix-1b: skip an item if
`item.audit_d_review.sb_fix_2.applied_at` exists and
`applied_by === currentPacketId`.

This means re-running a packet's apply is a no-op (apply
script writes nothing, exits cleanly). A different packet's
re-run on the same item also no-ops (the first apply wins;
later packets are expected to target different items).

### 2.4 Audit-trail vocabulary (constants)

Top of script (~20 lines, same pattern as SB-fix-1b):

```js
const AUDIT_FIELD_SB_FIX_2 = "sb_fix_2";
const DECISION_KEEP_WITH_NOTE = "keep-with-sybex-note";
const DECISION_RE_CITE = "re-cite-to-sybex";
const DECISION_REWRITE = "rewrite-to-messer";
const DECISION_REMOVE = "flag-for-removal";
const DECISION_PROMOTE = "promote-to-sybex-citation";
const VALID_DECISIONS = new Set([
  DECISION_KEEP_WITH_NOTE,
  DECISION_RE_CITE,
  DECISION_REWRITE,
  DECISION_REMOVE,
  DECISION_PROMOTE,
]);
const SYBEX_EDITION_REQUIRED = "Chapple 9th";
```

### 2.5 Backup + validator + atomic write

Same as SB-fix-1b:
- Backup `questions.json` to `.audit-working/sb-fix-2/backups/questions-{ISO}.json`
- Mutate in memory
- Write to `.questions-temp.json` in the working dir
- Run validator (`scripts/validate-questions.mjs`) against the
  temp tree
- Halt if errors > 0; warns informational only
- Atomic rename `.questions-temp.json` → `questions.json`

---

## 3. Per-packet workflow + ordering

### 3.1 Packet sequence (5 packets expected)

| # | Sub-path | Items | Purpose |
|---|---|---|---|
| 1 | R | 18 | Pool B routing — assign `sb16_subcategory` to each orphan item |
| 2 | G | 2 (Pool A) + N (Pool B → G routings) | messer-curriculum-gap deeper review; calibrates Sybex-citation workflow |
| 3 | P | 20 | partial-depth bulk pass #1 |
| 4 | P | 20 | partial-depth bulk pass #2 |
| 5 | P (residual) | ≤20 | only if Pool B routings inflate the P pool past 40 |

Total expected: 4-5 packets. Final count depends on Pool B
routing distribution (CC's expectation: most Pool B items will
route to P with a few going to G; some may route to "neither
sb16 — actually partial-adjacent" requiring a separate small
fix pass).

### 3.2 Each-packet rhythm

For G and P packets (the standard SB-fix-2 cadence):

1. **CC builds the packet** — runs build script (new:
   `scripts/sb-fix-2-build-packet.mjs`), produces packet-N.md
   + packet-N.json under `.audit-working/sb-fix-2/`. Per
   cadence Rule 2 inline pre-analysis: each item gets a
   pre-computed Sybex-lookup hint (CC searches Chapple 9th's
   TOC + index if a digital copy is available; otherwise
   marks "manual Sybex lookup required").
2. **Surface via relay v2.1** — from-cc/ file with status
   block + augmented packet inlined + URL/commit/nonce.
3. **Supervisor + Aiden review** — per-item decisions
   recorded against the schema in §2.2. Sybex references
   sourced by Aiden (he owns the physical / digital book).
4. **CC transcribes decisions** to
   `.audit-working/sb-fix-2/packet-N-decisions.json`.
5. **Dry-run preview** — `--dry-run` apply, captured to
   `.audit-working/sb-fix-2/packet-N-dry-run-preview.md`,
   surfaced via from-cc/ relay file for sign-off.
6. **Real apply** — after supervisor authorisation.
7. **Brief close-out signal** per cadence Rule 3 (validator
   clean → close brief; non-clean → full relay).

For the R packet (Pool B routing):

1. **CC builds the routing packet** —
   `scripts/sb-fix-2-route-pool-b.mjs` (§5 below) runs the
   grep heuristic, emits per-item recommended subcategory.
2. **Surface for supervisor review** via from-cc/ relay
   file.
3. **Supervisor adjudicates per-item subcategory** —
   `partial-depth` / `messer-curriculum-gap` / `not-sb16` /
   `partial-adjacent-not-sb16` (route to a separate fix pass).
4. **CC writes routing decisions to a backfill script**
   (`scripts/sb-fix-2-backfill-pool-b.mjs`) that writes
   `audit_d_review.sb16_candidate=true` +
   `audit_d_review.sb16_subcategory=<value>` for the 18
   items in `questions.json`. Items routed to `not-sb16` or
   `partial-adjacent-not-sb16` get a different audit note
   (`audit_d_review.sb1_6_review.routing="not-sb16"` or
   similar — keeps the SB1.6 flag visible in audit but
   excludes from SB-fix-2 scope).
5. **Backfill applies as a single commit** — separate from
   any SB-fix-2 decision packet.
6. **After R closes:** the unified pool is the input to
   packets 2-5.

### 3.3 Per-packet cadence rule application

| Rule | R packet | G packet | P packet |
|---|---|---|---|
| 1 (size) | 18 items (one-off routing) | 2-5 items | 20 items |
| 2 (inline cluster verify) | YES — grep is the routing methodology | YES — pre-Sybex-TOC-search per item | YES — pre-Sybex-TOC-search per item |
| 3 (supervisor gates item decisions + dry-run only) | applies; supervisor adjudicates subcategory; no dry-run on routing (backfill is mechanical) | applies | applies |
| 4 (mechanical vs architectural) | mechanical (routing per established methodology) | mechanical | mechanical |
| 5 (cross-packet consistency) | not applicable on R (routing is first packet, no prior SB-fix-2 precedent) | applies — G items can use SB-fix-1a/1b sb16-candidate precedents | applies |
| 6 (scope discipline) | applies — any items routed as `partial-adjacent-not-sb16` get captured to `.audit-working/findings/` not folded into SB-fix-2 | applies | applies |

---

## 4. Audit field write spec

Final shape of `item.audit_d_review.sb_fix_2` after apply:

```jsonc
{
  // ... existing audit_d_review fields preserved ...
  "sb16_candidate": true,
  "sb16_subcategory": "partial-depth",

  "sb_fix_2": {
    "decision": "keep-with-sybex-note",
    "sybex_reference": {
      "edition": "Chapple 9th",
      "chapter": 8,
      "section": "Bluetooth Attacks",
      "page": 342,
      "quote_excerpt": "Bluesnarfing is the unauthorized access of information from a wireless device through a Bluetooth connection."
    },
    "comptia_objective_reference": "2.4",
    "applied_at": "2026-05-23T14:00:00Z",
    "applied_by": "sb-fix-2-packet-3",
    "note": "Specific technique covered in Sybex §8 page 342; Messer 2.4 Wireless Attacks is the conceptual umbrella with bluesnarfing not in transcript."
  }
}
```

### 4.1 Citation string canonical format

Per Q-B-1: `"Chapple 9th, Chapter N, §Section, p.NN"`. The
audit-field structure above stores the components separately
(chapter / section / page); a helper function in the apply
script + future audit reporting tools formats them into the
canonical string for display:

```js
function formatSybexCitation(ref) {
  const parts = [`Chapple ${ref.edition.replace("Chapple ", "")}`];
  parts.push(`Chapter ${ref.chapter}`);
  parts.push(`§${ref.section}`);
  if (ref.page != null) parts.push(`p.${ref.page}`);
  return parts.join(", ");
}
// → "Chapple 9th, Chapter 8, §Bluetooth Attacks, p.342"
```

Storing structured fields rather than the formatted string
means future tools can sort / filter by chapter / page / etc.
without re-parsing.

### 4.2 Per-decision-type field requirements

| Field | keep-with-note | re-cite | rewrite | remove | promote |
|---|---|---|---|---|---|
| `decision` | ✓ required | ✓ | ✓ | ✓ | ✓ |
| `sybex_reference.edition` ("Chapple 9th") | ✓ | ✓ | ✓ | — | ✓ |
| `sybex_reference.chapter` | ✓ | ✓ | ✓ | — | ✓ |
| `sybex_reference.section` | ✓ | ✓ | ✓ | — | ✓ |
| `sybex_reference.page` | optional | optional | optional | — | optional |
| `sybex_reference.quote_excerpt` | ✓ | ✓ | ✓ | — | ✓ |
| `comptia_objective_reference` | ✓ | ✓ | optional | optional | ✓ |
| `applied_at`, `applied_by` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `note` | optional | optional | optional | optional | optional |
| `from_messerVideo`, `from_subObjective` | — | ✓ (snapshot) | — | — | — |
| `original_content` | — | — | ✓ (snapshot) | — | — |
| `removal_reason` | — | — | — | ✓ | — |

### 4.3 What stays unchanged in `audit_d_review`

The pre-existing fields from SB-fix-1a/1b remain:
- `packet_id` (SB-fix-1a/1b origin packet number)
- `from_messerVideo`, `from_subObjective` (SB-fix-1a/1b
  pre-state — these conflict with the SB-fix-2 `from_*`
  fields for `re-cite-to-sybex`; CC's apply script writes
  the SB-fix-2 ones INSIDE `sb_fix_2` to avoid collision)
- `decision_type_recorded` (SB-fix-1a/1b decision)
- `sb16_candidate`, `sb16_subcategory`
- `kept_as_is`
- `applied_at`, `applied_by` (SB-fix-1a/1b apply timestamps)
- `note`

SB-fix-2 audit fields nest inside `audit_d_review.sb_fix_2`
to preserve the SB-fix-1a/1b audit trail without collision.

---

## 5. Routing pre-step grep logic for Pool B

### 5.1 New script: `scripts/sb-fix-2-route-pool-b.mjs`

Modelled on `scripts/sb-fix-1b-cluster-verify.mjs` (already
reusable). For each of the 18 Pool B items:

1. Load item content from `questions.json` (location from
   verdicts file).
2. Extract search needles (same heuristic as cluster-verify:
   primary noun phrase + 2-3-token concept extraction).
3. Grep each needle against:
   - **Cited transcript** (the parent video the LLM said was
     out-of-source) — if hits, LLM may have been wrong;
     candidate "not-sb16" routing.
   - **Corpus-wide** — if hits exist in any other transcript,
     candidate `partial-adjacent-not-sb16` (item belongs in a
     different video; not SB-fix-2 scope).
   - **If neither has hits**: candidate `messer-curriculum-gap`
     (concept absent from Messer corpus entirely).
4. Emit a routing recommendation per item with the grep
   evidence inline.

### 5.2 Routing decision tree

For each Pool B item, supervisor reviews the grep evidence and
assigns ONE of:

| Routing | Meaning | Next sub-batch |
|---|---|---|
| `partial-depth` | cited video umbrella subsumes concept; specific term missing | SB-fix-2 P or G |
| `messer-curriculum-gap` | concept absent from corpus entirely | SB-fix-2 G |
| `not-sb16` | LLM was wrong; cited transcript actually covers concept | mark kept-as-is in catalogue with note; out of SB-fix-2 scope |
| `partial-adjacent-not-sb16` | concept exists in different Messer video; should be re-cited | feed into a D1/D3/D4/D5 partial-adjacent fix pass (post-SB-fix-2) |

CC's expectation distribution (from manual inspection of the
18 Pool B items):
- `partial-depth`: ~10 items (HSTS, Nonce, MAM, MTD, Security
  champions, etc. — concepts where the parent video is the
  umbrella but the specific term isn't in the transcript)
- `messer-curriculum-gap`: ~3 items (Metamorphic virus,
  Remediation validation, STIX/TAXII — possibly absent
  corpus-wide)
- `not-sb16`: ~3 items (Cable lock, Differential backup —
  may actually be in the cited transcript)
- `partial-adjacent-not-sb16`: ~2 items (SD-WAN, EPSS — may
  belong in different videos)

These are estimates; supervisor's adjudication is the truth.

### 5.3 Backfill script: `scripts/sb-fix-2-backfill-pool-b.mjs`

After supervisor adjudication, this script writes the
routing decisions into `questions.json`:

- For `partial-depth` / `messer-curriculum-gap`: set
  `audit_d_review.sb16_candidate=true`,
  `audit_d_review.sb16_subcategory=<value>`,
  `audit_d_review.packet_id="sb-fix-2-r"` (so future audits
  can see these are R-routed),
  `audit_d_review.applied_at`, `audit_d_review.applied_by`.
  Items then flow into G or P packets.
- For `not-sb16`: set `audit_d_review.sb1_6_review.routing="not-sb16"`
  + `audit_d_review.sb1_6_review.note=<reason>`. No
  `sb16_candidate` flag. Items exit SB-fix-2 scope.
- For `partial-adjacent-not-sb16`: set
  `audit_d_review.sb1_6_review.routing="partial-adjacent-deferred"`
  + `audit_d_review.sb1_6_review.note=<reason>`. Captured to
  `.audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md`
  for the future cleanup pass.

Single commit: `"SB-fix-2 R: Pool B routing backfill (18 items)"`.

---

## 6. Validator considerations

Per Q-E-2 (audit-only first pass), no validator changes are
needed. The validator already ignores `audit_d_review`
fields beyond the top-level invariant checks. Adding
`audit_d_review.sb_fix_2` to existing items has zero validator
impact.

If/when a future schema extension promotes `sybex_reference`
to item-level (Q-E-1/Q-E-3 path), the validator would need a
new `checkSybexReference()` helper analogous to the
`checkCitation()` helper from SB-fix-1b-prep. That work is
out of scope for this implementation plan.

---

## 7. Test plan

### 7.1 Apply script self-test

`--selftest` flag on the apply script (mirror SB-fix-1b-prep
validator pattern from commit `c1664c0`):

- 5 fixtures, one per decision type
- For each fixture: apply against a stub questions.json,
  assert the audit-field state matches expected, assert
  validator clean, assert idempotency (second run no-ops)

### 7.2 Pool B routing script self-test

`--selftest` flag on `sb-fix-2-route-pool-b.mjs`:

- 4 fixtures, one per routing outcome
- For each fixture: synthesise a grep environment with known
  hits/misses, run the routing logic, assert recommended
  outcome matches expected

### 7.3 End-to-end per-packet test

For each packet's dry-run:
- SHA256 pre/post comparison shows expected changes
- Validator pre/post counts identical (no new warnings)
- Backup file written before mutation
- Atomic rename only on validator-clean post-state

Pattern mirrors SB-fix-1a/1b's per-packet workflow.

---

## 8. Implementation order (commit sequence)

Anticipated commit chain after Aiden sign-off on this plan:

1. **`sb-fix-2 scripts: apply + route + backfill skeletons`**
   — create `scripts/sb-fix-2-apply-packet.mjs` (apply
   script, ~400 lines), `scripts/sb-fix-2-build-packet.mjs`
   (build script, ~250 lines), `scripts/sb-fix-2-route-pool-b.mjs`
   (routing script, ~200 lines),
   `scripts/sb-fix-2-backfill-pool-b.mjs` (backfill, ~150
   lines). All scripts include `--selftest` fixtures. No
   `questions.json` mutation in this commit.

2. **`SB-fix-2 R: Pool B routing build`** — run build,
   surface packet-R.md via relay for supervisor adjudication.
   No catalogue mutation.

3. **`SB-fix-2 R: Pool B routing backfill (18 items)`** —
   after supervisor adjudication, run backfill to write
   subcategory or routing-exit notes into 18 catalogue items.

4. **`SB-fix-2 G: messer-curriculum-gap items (N items, 1 packet)`**
   — packet 2 builds + reviews + applies.

5. **`SB-fix-2 P packet 1/M: 20 partial-depth re-citations + audit-field writes`**
   — packet 3.

6. **`SB-fix-2 P packet 2/M: 20 partial-depth …`** — packet 4.

7. **`SB-fix-2 P packet 3/M: residual …`** (if needed) —
   packet 5.

8. **`docs: PLAN + supervisor-handoff sync — SB-fix-2 CLOSED`**
   — closeout commit; updates PLAN.md row + supervisor-handoff.md.

9. **`Report-#0010 — SB-fix-2 closure + accumulated findings`** —
   per Workflow Rule #7.

Estimated session count: 2-3 sessions. Each packet (G, P, P
…) is ~30-45 min of supervisor item-review time; build +
dry-run + apply per packet is ~10 min CC time. Total
wall-clock 4-6 hours of focused work across the sessions.

---

## 9. SCHEMA.md update plan

After SB-fix-2 closes (or as part of the apply-script commit,
TBD), add a section to `SCHEMA.md`:

```markdown
## audit_d_review.sb_fix_2

Added 2026-05-22 by SB-fix-2 sub-batch. Records SB-fix-2
decisions per sb16-candidate item. Nested inside
`audit_d_review` to preserve SB-fix-1a/1b audit trail without
field collision.

Fields:
- `decision` (string, required): one of "keep-with-sybex-note",
  "re-cite-to-sybex", "rewrite-to-messer", "flag-for-removal",
  "promote-to-sybex-citation".
- `sybex_reference` (object, required except on flag-for-removal):
  - `edition` ("Chapple 9th" — canonical per Q-B-1)
  - `chapter` (integer ≥ 1)
  - `section` (string, non-empty)
  - `page` (integer, optional)
  - `quote_excerpt` (string, ≤ 500 chars)
- `comptia_objective_reference` (string): SY0-701 objective code
- `applied_at`, `applied_by`: ISO timestamp + sub-batch identifier
- Decision-specific extras (see implementation plan §4.2)

These fields are tooling-metadata; the React app does not read
them (per Q-D-1 from SB-fix-1b-prep + Q-E-2 from SB-fix-2
scoping).
```

This SCHEMA update is part of the implementation, not a
pre-step. Lands with the scripts skeleton commit or with the
first apply commit.

---

## 10. DO NOT implement — gating

Per cadence Rule 3 + the established surface-and-pause discipline,
implementation gates:

1. ✅ Q-letters A-G resolved (this session)
2. ⏳ Aiden sign-off on this implementation plan
3. ⏳ Then commit 1 lands (scripts skeleton + SCHEMA update)
4. ⏳ Then per-packet build + supervisor review + dry-run + apply
   per the sequence in §8

After Aiden sign-off, the implementation is mechanical per
cadence Rule 4 — no further scoping needed; per-packet
supervisor review per Rule 3 is the only gate from there.

---

## 11. Open questions for this plan (none expected)

CC believes the implementation plan is complete given the
Q-letter outcomes. If supervisor or Aiden flags a missing
consideration during review, this section captures it for
addition before commit 1.

Potential edge cases CC has considered and addressed:

- **Collision with SB-fix-1a/1b `from_messerVideo` field on
  re-cite items.** Handled: SB-fix-2 `from_*` fields nest
  inside `sb_fix_2` (§4.3).
- **`packet_id` field name collision between SB-fix-1a and
  SB-fix-1b.** Acknowledged in scoping doc; SB-fix-2 uses
  `applied_by: "sb-fix-2-packet-N"` to avoid further collision.
  Retrospective disambiguation of SB-fix-1a/1b packet IDs
  deferred to a separate cleanup pass.
- **Items in Pool B that already have `audit_d_review.sb16_candidate=true`.**
  Verified: zero overlap between Pool A and Pool B
  (confirmed via grep in scoping session).
- **Sybex chapter/section numbering changes between Chapple
  editions.** Hardcoded to 9th edition per Q-B-1; future
  edition references would require either a migration script
  or a `edition_specific_reference` field. Out of scope until
  Aiden upgrades editions.

---

## Boundary on this round

- ✅ Translated all 7 Q-letter outcomes into implementation spec
- ✅ Mapped apply script shape (decision types, field requirements,
  idempotency, backup/validator/atomic-write)
- ✅ Mapped per-packet workflow (R → G → P sequence)
- ✅ Spec'd audit field structure with Chapple 9th citation format
- ✅ Spec'd routing pre-step grep logic + supervisor decision tree
- ✅ Spec'd test plan (self-test fixtures + end-to-end per-packet)
- ✅ Listed expected commit sequence
- ✅ Drafted SCHEMA.md update
- ❌ Do NOT write any of the four new scripts yet
- ❌ Do NOT update SCHEMA.md yet
- ❌ Do NOT mutate `questions.json`

Next gate: Aiden sign-off on this plan via direct chat or
relay. After sign-off, commit 1 (scripts skeleton + SCHEMA)
lands; per-packet workflow runs from there.

---ready-for-supervisor---
