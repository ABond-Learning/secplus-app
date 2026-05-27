# Task 1g.2 — Schema documentation — PLAN for sign-off

**Status:** PLAN ONLY — not implemented. Awaiting sign-off.
**Base HEAD:** `3b3a619`
**Nonce:** `2aeb9c71`
**Run ID:** `2026-05-27-task-1g-2-schema-docs`
**Target file:** `SCHEMA.md` only (+ `Reports/Report-#0023.md`). No code, no `questions.json`.

---

## 0. Gate-safety

Docs-only. No code path, no `questions.json` item, no `sybex-` SM-2 key written.
**Independent of the 22:09 BST sync-engine hygiene gate** — this task documents the field
shapes 1g.1 already accepts and the key scheme PLAN already specifies; it changes nothing
runtime.

---

## 1. Section placement

SCHEMA.md current top-level structure (line anchors at HEAD `3b3a619`):

```
112  ## Citation field rules (messerVideo + subObjective)
132  ## Citation enforcement on mc/scen vs match/cram — historical note
148  ## Audit-trail fields (audit_ prefix convention)
172    ### audit_d_review.sb16_subcategory semantics
201    ### audit_d_review.sb_fix_2 semantics      <- nested sybex_reference shape (217-223)
254  ## localStorage compatibility               <- SM-2 key prefixes (259-263)
279  ## Cross-device sync (Task 1.5)
286    ### TRACKED_PREFIXES                       <- STALE list (290-293)
```

Three new blocks + one correction:

| Block | Insertion point | Rationale |
|---|---|---|
| **A. Top-level `sybex_reference` shape** | new `##` section **after** the citation historical note (after line 146), **before** `## Audit-trail fields` (148) | It is a PRIMARY citation (peer of `messerVideo`/`subObjective`), not an audit-trail field — belongs with the citation sections. Forward cross-refs the nested `sb_fix_2.sybex_reference` (201). |
| **B. `sourceProvenance` enum** | new `##` section immediately **after** block A, before `## Audit-trail fields` | Groups the two Sybex-native-item concepts (citation + provenance) together; both concern the same 500 items. |
| **C. Sybex SM-2 key scheme** | new `###` sub-section inside `## localStorage compatibility`, **after** line 277 (the existing implication list) | Same section as the existing `{type}-{videoId}-{qi}` key docs. |
| **D. TRACKED_PREFIXES correction** | edit the existing list at lines 290-293 | The doc is stale (see §6) — fold the fix in here since C touches the same area. |

---

## 2. Block A — top-level `sybex_reference` shape

Proposed section text (mirrors the 1g.1 validator decisions exactly):

> ## Sybex citation (`sybex_reference`, top-level)
>
> A **Sybex-native** item (folded in from the Sybex Study Guide test banks, Task 1g) cites
> its source with a top-level `sybex_reference` object instead of `messerVideo` +
> `subObjective`. The validator (since Task 1g.1, `822e04a`) accepts an item cited by EITHER
> the Messer pair OR a top-level `sybex_reference`, or both.
>
> ```jsonc
> {
>   "q": "...", "opts": [...], "a": 2, "exp": "...",
>   "sybex_reference": {
>     "edition": "Chapple 9th",     // required, non-empty string
>     "question_number": 1,          // required, integer >= 1
>     "chapter": 4                   // chapter OR practice_exam (exactly one), integer >= 1
>   }
> }
> ```
>
> | Field | Required | Type | Rule |
> |---|---|---|---|
> | `edition` | yes | string | Non-empty. Canonical value `"Chapple 9th"` is a **content** rule enforced by 1g.4 conversion, NOT the validator (validator checks non-empty only). |
> | `question_number` | yes | integer ≥ 1 | The source question number (`n`). |
> | `chapter` | one of | integer ≥ 1 | For chapter test-bank items (`chapter-NN.json`). **Exactly one** of `chapter`/`practice_exam`. |
> | `practice_exam` | one of | integer ≥ 1 | For practice-exam items (`practice-exam-NN.json`). |
> | `section` | optional | string | Accepted, unenforced at top level. |
> | `page` | optional | integer ≥ 1 | Accepted, unenforced. |
> | `quote_excerpt` | optional | string | Accepted, unenforced — see semantics note. |
> | `chapter_level_only` | optional | boolean | Accepted, **semantically inert** at top level — see note. |
> | `note` | optional | string | Free-text. |
>
> **Semantic difference vs `audit_d_review.sb_fix_2.sybex_reference`.** The nested
> audit-trail `sybex_reference` is an **evidence pointer** — it records *where in the book*
> a Messer-cited term also appears, with `quote_excerpt` as verbatim proof (waived by
> `chapter_level_only=true` when the term lives only in unreachable chapter prose). The
> top-level `sybex_reference` is a **primary content citation** — the item *is* the Sybex
> question, so there is no evidentiary burden: `quote_excerpt` is never required and
> `chapter_level_only` has nothing to waive (accepted only for shape compatibility with the
> nested form). See `## audit_d_review.sb_fix_2 semantics` for the audit-trail shape — this
> section does not duplicate it.
>
> **Validator error codes** (`scripts/validate-questions.mjs`, `checkSybexReference()`):
> `sybex-shape` (not an object), `sybex-edition` (missing/empty), `sybex-question-number`
> (missing or not int ≥ 1), `sybex-locator` (not exactly one of `chapter`/`practice_exam`,
> or a present locator not int ≥ 1).

I will also add a one-line back-pointer at the end of the `## audit_d_review.sb_fix_2
semantics` section: *"For the top-level Sybex-native citation (primary, not audit-trail),
see `## Sybex citation (sybex_reference, top-level)`."*

---

## 3. Block B — `sourceProvenance` enum

Proposed section text:

> ## `sourceProvenance` (item source provenance)
>
> Optional top-level string enum on any item, recording which corpus the item came from.
>
> | Value | Meaning |
> |---|---|
> | *(field absent)* | Implicit `"messer"` — all existing Professor Messer-derived content. |
> | `"messer"` | Explicit Messer provenance (rarely written; absence is the normal signal). |
> | `"sybex-chapter"` | Folded in from Sybex chapters 02-17 (Task 1g.4). |
> | `"sybex-practice-exam"` | Folded in from Sybex practice exams 1+2 (Task 1g.4). |
>
> **Existing items: OMIT the field (not backfilled).** Absence ≡ `"messer"`. Audit/filter
> code normalizes with `(item.sourceProvenance ?? "messer")`.
>
> **Audit-script filter convention.** Audit D scripts skip Sybex-native items via
> `(item.sourceProvenance ?? "messer") !== "messer"` (Sybex content is in-source by
> definition; no `audit_d_review` needed). **The validator does NOT enforce
> `sourceProvenance`** (Task 1g.1 scope). Enforcement landing points are deferred: 1g.4
> conversion *writes* the field on the 500 Sybex items; a future audit-script ship *adds*
> the skip filter.

**Lean on omit-vs-backfill: OMIT.** Reasoning: backfilling would rewrite every item in
`questions.json` (~700+ items) for zero functional gain — the absence already carries the
"messer" signal, and the filter normalizes absent → "messer". Omitting keeps the
conversion diff limited to the 500 new Sybex items and avoids a whole-file churn (which
also touches SM-2-irrelevant lines and bloats review). 1g.1 doesn't enforce the field, so
omission is safe.

---

## 4. Block C — SM-2 key-scheme extension

Proposed sub-section text:

> ### Sybex SM-2 key scheme (Task 1g)
>
> Sybex-native items use a **content-derived** key (not the array-index scheme below):
>
> | Source | Key pattern | Example |
> |---|---|---|
> | Sybex chapter | `mc-sybex-ch{NN}-q{N}` | `mc-sybex-ch04-q1` (chapter 4, question 1) |
> | Sybex practice exam | `mc-sybex-pe{NN}-q{N}` | `mc-sybex-pe01-q26` (practice exam 1, question 26) |
>
> `{NN}` = zero-padded chapter (`02`-`17`) or practice-exam (`01`-`02`) number; `{N}` =
> `sybex_reference.question_number`. Globally unique by construction.
>
> **Collision-safety.** The existing scheme is `mc-{videoId}-{qi}` where `videoId` is a
> dotted-decimal section id (e.g. `mc-2.4.9-2`). The literal `sybex-` infix can never appear
> in a dotted-decimal videoId, so the two namespaces are disjoint by construction — no
> collision is possible.

**KEY DESIGN SURFACE — needs confirmation.** The app currently derives SM-2 keys by **array
index**: `mcKey(videoId, qi) => \`mc-${videoId}-${qi}\`` (`src/secplus-quiz.jsx:44`). The
documented Sybex scheme is **content-derived** (chapter/exam + `question_number`), which does
NOT fall out of `mcKey(videoId, qi)` for a synthetic per-section video (that would yield
`mc-sybex-2.4-0`, not `mc-sybex-ch04-q1`). So the Sybex key scheme requires **app-side
wiring** — a `sybexKey()` helper (or a per-item key field) that reads `sybex_reference` — to
be added in **1g.4/1g.6**, not here. I will document the scheme as the spec and add an
explicit note that the app key derivation must be extended in 1g.4/1g.6.

This is arguably a *feature*: content-derived keys are **immune to the reorder-fragility**
that constrains the index scheme (localStorage compat rules 2-3) — a Sybex item's progress
survives array reordering. Confirm this is the intent.

**scen-/match-/cram- variants.** The initial 500-item fold-in is **all MC**, so only the
`mc-sybex-*` pattern is active now. The pattern generalizes as
`{type}-sybex-{ch|pe}{NN}-q{N}` if a future fold-in adds scenario/matching/cram Sybex items.
**Intent confirmation requested:** document the `mc-` pattern as active + the generalized
shape as forward-looking (my lean), OR pre-specify all four now?

---

## 5. Zero-padding convention

The existing schema uses **unpadded** dotted-decimal section ids (`2.4.9`); the new Sybex
keys use **zero-padded** segments (`ch04`, `pe01`). The inconsistency is real but harmless.

**Lean: KEEP zero-padding, do not align the two.** Reasoning:
- The Sybex source filenames are already zero-padded (`chapter-04.json`,
  `practice-exam-01.json`), so the key scheme **inherits** padding from the source — the
  conversion script (1g.4) gets it for free and the key visibly traces to its file.
- Fixed-width segments sort lexically in chapter/exam order (`ch02`…`ch17`), which the
  unpadded dotted-decimals do not need (they're a different namespace).
- The two namespaces **never mix** in any comparison or sort (disjoint per §4
  collision-safety), so there is no place the inconsistency could cause a bug.
- Aligning would mean either padding the existing dotted-decimals (a breaking key migration
  across the whole corpus — forbidden by localStorage compat rules) or un-padding the Sybex
  keys (losing the source-filename trace). Neither is worth it.

I will document the convention + this justification in the new SM-2 sub-section.

---

## 6. Decisions needing sign-off

1. **§1 placement** — approve blocks A+B between the citation historical note (146) and
   Audit-trail fields (148), and block C inside localStorage compatibility?
2. **§3 sourceProvenance — OMIT from existing items** (absence ≡ "messer"; filter
   normalizes). Approve?
3. **§4 content-derived keys + app-wiring deferred to 1g.4/1g.6.** Approve documenting the
   content-derived scheme (vs index) and flagging the `sybexKey()` wiring as a 1g.4/1g.6
   dependency?
4. **§4 scen/match/cram** — document `mc-` active + generalized shape forward-looking (lean),
   or pre-spec all four?
5. **§5 zero-padding** — keep (inherited from source filenames), don't align. Approve?
6. **§6-bonus: TRACKED_PREFIXES doc is STALE.** Code is
   `["mc-", "scen-", "match-", "cram-", "weakness-", "sybex-", "secplus-"]`; SCHEMA lines
   290-293 list only `mc-/scen-/match-/secplus-`. Approve bringing the doc current (add
   `cram-`, `weakness-`, `sybex-`) as part of this docs task? (Also worth a one-line note
   that `mc-sybex-*` keys are already covered by the `mc-` prefix; the standalone `sybex-`
   entry — added in 1g.0 — is defensive future-proofing for any key that leads with
   `sybex-`.)

## 7. Implementation footprint (post-sign-off)

`SCHEMA.md` only: ~2 new `##` sections (A, B), ~1 new `###` sub-section (C), one one-line
back-pointer in the `sb_fix_2` section, and the TRACKED_PREFIXES list correction (D).
~70-90 lines added, ~4 lines edited. No code, no `questions.json`. One commit; Report-#0023
in the same push (same commit or immediate follow-up) per Rule #7.
