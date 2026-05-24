# Report-#0014 — SB-fix-2 G-packet Item 3 (HSTS): keep-with-sybex-note + cross-source-curriculum-gap; G packet CLOSED

**Date:** 2026-05-24
**Task type:** Audit D remediation (G-packet closure) + schema extension
**Run-ID:** `2026-05-24-item-3-hsts-verdict`

---

## What was asked

Close G-packet Item 3 (§2.4.9 mc[2], HSTS) with a categorically accurate verdict.
"Option 2" — extend the `sb16_subcategory` taxonomy with a new value rather than
force-fit Item 3 into `messer-curriculum-gap` — was chosen for categorical accuracy
ahead of the P-packet work, where similar cross-source gaps are likely.

## Trigger

Item 3 was the one held item from the G packet (Items 1+2 shipped `2516639`). It was
held pending Chapter 12 Sybex practice-test data, which the Tier 2 corpus commit
(`d655a46`, 2026-05-24) delivered. With Tier 1 (glossary), Tier 2 (practice tests),
and Tier 3 (book index) all now checkable, the verdict could be settled.

## Tier 1/2/3 findings

- **Tier 1 — Sybex glossary (70 pages):** 0 hits. HSTS, "HTTP Strict Transport
  Security", and "SSL stripping" are all absent from the cert glossary vocabulary.
- **Tier 2 — Sybex Ch12 practice tests (20 questions, "Network Security"):** HSTS is
  not tested. The only on-path appearance is Q17, which tests a browser plug-in
  artifact — the *attack*, not the HSTS *defense*. (A keyword sweep returned one
  further "hit," but it was a spurious substring match on "communicati**on path**" in
  an unrelated zero-trust question.)
- **Tier 3 — Sybex book index (pp 629-652):** HSTS is not indexed. Adjacent entries
  exist — HTTPS (p409), TLS (pp 403-404), on-path attacks (p159) — but none cover
  HSTS as the SSL-stripping mitigation.

Net: HSTS-as-a-mitigation is absent from **all three Sybex tiers and Messer's
transcripts**. It is nonetheless exam-relevant — HSTS is the canonical defense against
SSL stripping under CompTIA objective 2.4 (on-path attacks). So the item is correct,
exam-relevant content with no available study-source citation to re-target to.

## Verdict

**`keep-with-sybex-note`**, classified **`cross-source-curriculum-gap`**. Audit-metadata
only — no change to the question stem, options, correct answer, explanation,
`messerVideo`, or `subObjective`.

## Schema change

`SCHEMA.md` `audit_d_review.sb16_subcategory` enum extended from **2 → 3** values:

- `partial-depth` (existing) — cited video's umbrella subsumes the tested technique.
- `messer-curriculum-gap` (existing) — cited video is a sibling concept; no umbrella
  home anywhere in the *Messer* corpus.
- **`cross-source-curriculum-gap` (new)** — concept absent from both Messer's
  transcripts AND Sybex (glossary, practice tests, and book index). The item is
  exam-relevant (cited CompTIA objective covers the topic area) but no study-source
  authority teaches the technique at the depth the question tests. Kept-as-enrichment;
  no citation re-targeting possible.

**Rationale:** `messer-curriculum-gap` asserts only that *Messer* lacks the concept,
implying a Sybex re-citation might still be possible. HSTS is absent from Sybex too, so
that implication is false for this item. The new value records the stronger, accurate
finding and keeps the taxonomy honest ahead of P-packet adjudication, where some items
may also turn out to be cross-source gaps.

## Forward-applicability

- The canonical enum allow-list `VALID_SB16_SUBCATEGORIES` in
  `scripts/sb-fix-1b-apply-packet.mjs` was extended to accept the new value, so future
  apply runs that assign `cross-source-curriculum-gap` validate cleanly.
- `scripts/validate-questions.mjs` does **not** enforce the `sb16_subcategory` enum
  (structural-only for that field), so it needed no change; its 6-fixture selftest
  still passes 6/6.
- Deferred (not needed yet): the pool-b routing enum `VALID_ROUTINGS` in
  `scripts/sb-fix-2-backfill-pool-b.mjs` and its routing→subcategory mapping do not yet
  emit `cross-source-curriculum-gap`. If the D1/D3/D4/D5 cleanup routes items to this
  category, that script's routing set + mapping will need the same extension at that
  time.

## Apply mechanics

Item 3 already carried a top-level `audit_d_review` block from the R routing pass
(`applied_by: sb-fix-2-r`), unlike Items 1+2, whose apply added a nested
`audit_d_review.sb_fix_2` block. Per the explicit field-level instruction, Item 3's
existing top-level block was updated in place (`sb16_subcategory`, `packet_id`,
`applied_by`, `applied_at`, a `decision: keep-with-sybex-note` disposition field, and a
replaced `note`) via a guarded one-off script. Guards asserted the target was the HSTS
item, that the prior block was `messer-curriculum-gap`/`sb-fix-2-r`, and that no content
field changed. The resulting git diff is exactly the audit_d_review block (6 insertions,
5 deletions); the validator reports 0 errors.

## Files changed

- `SCHEMA.md` — `sb16_subcategory` enum: third value + dated note.
- `scripts/sb-fix-1b-apply-packet.mjs` — `VALID_SB16_SUBCATEGORIES` extended to 3 values.
- `questions.json` — §2.4.9 mc[2] `audit_d_review` block updated (metadata only).
- `Reports/Report-#0014.md` — this report.

## G packet status

**CLOSED.** All three G-packet items shipped:
- Item 1 — §2.3.2 integer-overflow cram[2] → keep-with-sybex-note (`2516639`).
- Item 2 — §2.3.2 integer-overflow match[2] → keep-with-sybex-note (`2516639`).
- Item 3 — §2.4.9 HSTS mc[2] → keep-with-sybex-note + cross-source-curriculum-gap (this commit).

## Boundaries honored

- Audit-metadata only; no question content touched (guard-enforced).
- Targeted SCHEMA + script edits; preserved existing enum values and semantics.
- Minimal, localized questions.json diff (verified clean re-serialization, no trailing
  newline drift).

## What's next

- **P1/P2/P3 packets** — 56 partial-depth items, adjudicable against the Tier 1+2 corpus;
  the new `cross-source-curriculum-gap` value is available where Messer and Sybex both
  lack the topic.
- **D1/D3/D4/D5 partial-adjacent cleanup** — 227+ items (+ SD-WAN routing-out).
