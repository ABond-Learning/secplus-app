# Report-#0017 — SB-fix-2 P1 packet closure + chapter-level Tier 3 protocol

**Date:** 2026-05-24
**Task type:** Audit D / SB-fix-2 remediation (packet closure) + reusable script/schema infra
**Run-ID:** `2026-05-24-sb-fix-2-packet-P1-closure`

---

## What was asked

Close the SB-fix-2 P1 packet by dispositioning the 13 items held during the initial P1
apply (run `2026-05-24-sb-fix-2-packet-P1-apply`, commit `f2c2c2a`, which applied 7 of
20). Four-phase structure with one surface-and-pause gate: Phase 1 apply Group A (4
items), Phase 2 surface Group B scoping and pause, Phase 3 apply Group B (9 items),
Phase 4 findings closure + this report.

## P1 closure summary — 20/20 items dispositioned

| Batch | Items | Mechanism | Commit |
| ----- | ----- | --------- | ------ |
| Initial apply | 7 (HMAC ×2, buffer-overflow, SYN flood ×3, evil twin) | `keep-with-sybex-note`, Tier 1 / Tier 2-confirmed | `f2c2c2a` |
| Group A | 4 (cryptominer ×2, skimming ×2) | `cross-source-curriculum-gap` (inline) | `b5b0f34` |
| Group B | 9 (cable lock, Spectre/Meltdown ×3, metamorphic, DNS tunneling ×3, WPA2 handshake) | chapter-level Tier 3 (`chapter_level_only`) | `979e994` |

Plus one reusable-infrastructure commit (`aef0eab`) between Phases 2 and 3.

## The Tier 1+2 vs Tier 3 distinction P1 surfaced

P1's central finding: "partial-depth" items split by **where the specific term can be
verified**, not just whether the cited Messer umbrella fits.

- **Tier 1** = Sybex glossary + book index (supervisor-reachable).
- **Tier 2** = Sybex practice-test corpus (`.audit-working/sybex-practice-tests/`,
  17 chapter sets + 2 practice exams; supervisor-reachable, grep-verified).
- **Tier 3** = Sybex chapter **prose** — only reachable with the physical book in hand.

The 13 held items all missed Tier 1+2 for their specific term. They then split three ways:

1. **Tier 2 hit on re-grep** — SYN flood (practice-exam-02 Q26). Already handled in the
   initial 7.
2. **Full source gap** (Group A) — term absent even from the Sybex **TOC**, so no chapter
   home exists. Cryptominer and skimming: in-scope for CompTIA 2.4 but taught by no study
   source at the depth tested.
3. **Chapter-mapped, term unconfirmed** (Group B) — the Sybex **chapter is the TOC home**,
   but the term isn't in Tier 1+2 and may live only in Tier 3 prose.

## Tier 3 protocol decision and forward applicability

Phase 2 (surface-and-pause) scoped how to ship Group B. The apply script rejected empty
`quote_excerpt`, so chapter-level-only citations had no path. Supervisor approved
**Option A**: a first-class `sybex_reference.chapter_level_only: true` boolean (over
Option B, a sentinel string in `quote_excerpt`).

Rationale (supervisor, for the record): the chapter-mapped / term-absent-from-Tier-1+2
shape recurs across the remaining audit backlog — **P2/P3 + D1/D3/D4/D5 partial-adjacent
cleanup, ~250+ items** where Sybex chapter prose is unreachable without the book.
Option B's zero-code shortcut is debt that compounds across all of them; Option A makes
chapter-level Tier 3 a queryable property of `sybex_reference` for all forward audit
work. The ~6-line validator change + selftest fixture + SCHEMA paragraph pays for itself
immediately. **The policy applies forward**: wherever the same TOC-home / term-absent
pattern holds, cite chapter-level with the flag rather than holding the item or
fabricating a quote.

## Schema / script changes (Phase 2 sign-off → `aef0eab`)

- `scripts/sb-fix-2-apply-packet.mjs`: `validateSybexReference` now validates
  `chapter_level_only` as boolean and **waives** the non-empty `quote_excerpt`
  requirement when it is `true` (quote then optional; length cap still enforced if
  present). The flag rides through `resolveAction`'s existing spread into the `sb_fix_2`
  block — machine-queryable. New `--selftest` fixture: applies a `chapter_level_only`
  decision without a quote, asserts the flag persists and `sb16_subcategory` is untouched,
  and confirms the validator still rejects an empty quote without the flag and a
  non-boolean flag. **Existing 5 fixtures unregressed** (selftest: all green).
- `SCHEMA.md`: added the `sybex_reference.chapter_level_only` field row, updated the
  `quote_excerpt` "required when" to note the exception, and added an explanatory
  paragraph distinguishing chapter-level Tier 3 (TOC home exists, term in prose) from
  `cross-source-curriculum-gap` (no home in any source; added at `9eb4311`).

### Group A mechanism note (no script change)

Group A could not use the apply script (it cannot promote `sb16_subcategory` and — even
with the new flag — `cross-source-curriculum-gap` carries no `sybex_reference` at all).
It was applied by a one-off inline-edit script
(`.audit-working/sb-fix-2/apply-group-a.mjs`, gitignored) replicating the G-packet
Item 3 HSTS convention (`9eb4311`): promote `sb16_subcategory`, add inline
`decision`/`applied_*`/`note`, preserve prior packet-3 audit history. The script
asserts each located item matches its expected term before mutating, backs up, and runs
the validator. Dry-run previewed full before/after; validator PASS.

## Deviations / decisions

- **Group A page handling:** the closest Sybex chapter home is carried in the note prose
  (matching HSTS), not as a structured `sybex_reference` — `cross-source-curriculum-gap`
  by definition has no term-level citation.
- **`packet_id` preservation (Group A):** unlike G Item 3 (which overwrote `packet_id`),
  Group A preserves the prior `packet-3` `packet_id` and marks the resolving packet via
  `applied_by: sb-fix-2-packet-P1` — strictly more provenance-preserving.
- **Group B `sb16_subcategory`:** stays `partial-depth` per Phase 2 Q4 — Messer-curriculum
  relationship and Sybex-citation-depth are orthogonal axes.

## Files changed

- `questions.json` — Group A (4 items inline, `b5b0f34`) + Group B (9 items, `979e994`).
- `scripts/sb-fix-2-apply-packet.mjs`, `SCHEMA.md` — `chapter_level_only` infra (`aef0eab`).
- `Reports/Report-#0017.md` — this report.
- Gitignored working artifacts: `.audit-working/sb-fix-2/packet-P1-group-a-decisions.json`,
  `apply-group-a.mjs`, `packet-P1-group-b-decisions.json`,
  `.audit-working/findings/sb-fix-2-p1-held-items.md` (updated to CLOSED).

## Commits

| # | Hash | Subject |
| - | ---- | ------- |
| 1 | `b5b0f34` | sb-fix-2: apply P1 packet Group A (cryptominer, skimming → cross-source-curriculum-gap) |
| 2 | `aef0eab` | sb-fix-2: add chapter_level_only flag to sybex_reference (chapter-level Tier 3 citations) |
| 3 | `979e994` | sb-fix-2: apply P1 packet Group B (chapter-level Tier 3 citations) |
| 4 | _(this)_ | docs: Report-#0017 P1 packet closure + Tier 3 protocol decision |

## Cumulative SB-fix-2 status

- **R packet** (routing/retroactive) — closed.
- **G packet** (integer overflow ×2 + HSTS) — closed (`9eb4311`, Report-#0014).
- **P1 packet** (20 partial-depth items) — **closed** (this report).
- **P2 / P3 packets** — remain. Sub-path P totals 56 partial-depth items; P1 covered
  items 1–20, leaving **36** across P2 (items ~21–40) and P3 (~41–56). The chapter-level
  Tier 3 protocol and the `cross-source-curriculum-gap` pattern are both now available to
  them.

## What's next

P2 is the natural next packet. No follow-up obligation outstanding from P1 — it is fully
closed. Boundaries honored: Rule #9 event-log trail for this run (pre-flight → Group A →
Phase 2 pause/resume → infra → Group B → closure docs); held items' verdicts never
silently flipped; the one surface-and-pause gate (Phase 2) observed with the scoping
block piped to clipboard; validator PASS at every apply.
