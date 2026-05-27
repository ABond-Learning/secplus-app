# Task 1g.1 — Validator extension (E1-refined) — PLAN for sign-off

**Status:** PLAN ONLY — not implemented. Awaiting sign-off per ship prompt.
**Base HEAD:** `db18068`
**Nonce:** `ceec47c8`
**Run ID:** `2026-05-27-task-1g-1-validator-extension`
**Target file:** `scripts/validate-questions.mjs` (validator + `--selftest` block); no other source touched.

---

## 0. Gate-safety (stated explicitly per ship prompt)

1g.1 only makes the validator **ACCEPT** a top-level `sybex_reference` as a valid
citation and adds shape-validation for it. **It writes nothing, touches no
`questions.json` item, and does not introduce any `sybex-` SM-2 key.** No item in the
corpus carries a top-level `sybex_reference` yet, so none of the new code paths fire on
the current corpus. 1g.1 is therefore **fully independent of the 24-hour sync-engine
hygiene gate** (the gate guards `sybex-` SM-2 keys, which arrive in 1g.4 conversion).
1g.1 also does **not** enforce `sourceProvenance` (Q-F) — that enum lands in 1g.2 (docs)
and 1g.4 (conversion).

---

## 1. `checkCitation()` generalisation

### Predicate change

`isNew()` currently means "has a Messer citation field." It is repurposed to "has *any*
citation," so a Sybex-only item is no longer mis-flagged as legacy:

```
isNew(item) = Boolean(item.messerVideo || item.subObjective || item.sybex_reference)
```

### New `checkCitation()` shape (pseudocode)

Error codes preserved **verbatim** per SB-fix-1b-prep Q-B refinement 1
(`missing-messer`, `missing-subobj`, `subobj-format`, `legacy-no-citation` are
byte-identical). Both-or-neither on `messerVideo`+`subObjective` still applies. The
Sybex block is purely additive.

```
function checkCitation(item, location, { requireCitation }) {
  const hasMesser = Boolean(item.messerVideo || item.subObjective);
  const hasSybex  = item.sybex_reference != null;

  // --- Messer block: UNCHANGED logic, codes verbatim ---
  if (hasMesser) {
    if (!item.messerVideo)  record("error", "missing-messer",  location, "...");   // verbatim
    if (!item.subObjective) record("error", "missing-subobj",  location, "...");   // verbatim
    else if (!SUBOBJ_PATTERN.test(item.subObjective))
                            record("error", "subobj-format",   location, "...");   // verbatim
  }

  // --- Sybex block: NEW, additive ---
  if (hasSybex) {
    checkSybexReference(item.sybex_reference, location);   // new codes, §2 below
  }

  // --- At-least-one / legacy rule ---
  // Grandfathering PRESERVED: an item with NONE of the three citation signals is
  // still legacy → info (not error). See §4 fixture #4 clarification.
  if (!hasMesser && !hasSybex && requireCitation) {
    record("info", "legacy-no-citation", location, "...");   // verbatim
  }
}
```

Note: an item may carry **both** a Messer citation and a `sybex_reference` (e.g. a
cross-cited item). Both blocks run; both must pass. This is the "both → PASS" fixture.

---

## 2. Top-level `sybex_reference` field rules

Q-A says reuse the `audit_d_review.sb_fix_2.sybex_reference` shape (edition / chapter /
section / page / quote_excerpt / chapter_level_only / note) at top level. The **shape is
mirrored**, but the **requirement semantics differ** for native items, and the existing
shape cannot represent a practice-exam question (no chapter). The two points below are
the decisions I need signed off — they go slightly beyond the literal Q-A text.

### 2a. Native vs audit-trail semantics (`quote_excerpt` / `chapter_level_only`)

In `sb_fix_2` (audit-trail), `sybex_reference` is a **pointer to evidence** that a tested
term lives somewhere in the book; `quote_excerpt` is required verbatim proof, waived only
when `chapter_level_only=true` (term lives in unreachable prose).

For a **Sybex-native item, the item IS the Sybex content** — there is no separate "prove
the term appears" burden, so there is nothing for `quote_excerpt` to evidence.

**Decision (proposed):** at top level, `quote_excerpt` is **never required**, regardless
of `chapter_level_only`. `quote_excerpt`, `chapter_level_only`, `section`, `page`, and
`note` are all **accepted (shape-mirrored) but optional/unenforced**. `chapter_level_only`
is therefore semantically inert at top level (nothing to waive) — accepted for shape
compatibility only. This makes fixture #6 (`chapter_level_only=true`, no `quote_excerpt`)
pass trivially.

### 2b. Practice-exam citation convention (the real gap)

Chapter test-bank questions have a chapter number; **practice-exam questions do not**
(corpus shape: `practice_set: "Practice Exam 1"`, question `n`). The prompt offers two
patterns. I evaluated both:

- **Option B (NOT recommended): `chapter = "practice-exam-01"` string.** Breaks the
  existing `chapter: integer ≥ 1` type contract and the `formatSybexCitation()` renderer
  (`"Chapter N"`). Overloads one field with two types. Rejected.

- **Option A (RECOMMENDED): minimal locator, no new discriminator field.** A top-level
  `sybex_reference` (always native by construction — audit-trail refs stay nested in
  `audit_d_review`) requires `edition` + `question_number` + **exactly one of**
  `chapter` | `practice_exam`. The presence of `chapter` vs `practice_exam` *is* the
  discriminator — no redundant `source_type` field (which would duplicate the top-level
  `sourceProvenance` enum from Q-F).
  - `chapter` — integer ≥ 1 (unchanged type), for `chapter-NN.json` items.
  - `practice_exam` — integer ≥ 1 (1 or 2), for `practice-exam-NN.json` items. NEW field.
  - `question_number` — integer ≥ 1 (the corpus `n`). NEW field.
  - These map 1:1 to the SM-2 key scheme already in PLAN (`mc-sybex-ch04-q1`,
    `mc-sybex-pe01-q26`).

I lean **Option A**. It keeps every existing field's type intact, adds the two minimal
fields the data actually needs, stays self-contained (no dependency on the unenforced
`sourceProvenance`), and avoids a discriminator redundant with Q-F.

### 2c. Minimum-field set to count as a valid top-level citation

```
edition          : non-empty string (canonical "Chapple 9th")
question_number  : integer ≥ 1
exactly one of   : chapter (integer ≥ 1)  XOR  practice_exam (integer ≥ 1)
```

Everything else (`section`, `page`, `quote_excerpt`, `chapter_level_only`, `note`) is
optional and unenforced.

### 2d. New error codes (additive; all existing codes untouched)

| Code | Fires when |
|---|---|
| `sybex-shape` | `sybex_reference` present but not an object |
| `sybex-edition` | `edition` missing or empty |
| `sybex-question-number` | `question_number` missing or not integer ≥ 1 |
| `sybex-locator` | not exactly one of `chapter` / `practice_exam` (zero, or both) |

(Granularity matches the existing `missing-messer` / `missing-subobj` / `subobj-format`
style. Collapsible to a single `sybex-malformed` code if you prefer fewer codes — flag it.)

---

## 3. Type coverage — lean (b), all four types

`checkCitation()` is **already** invoked uniformly across all four item types (mc + scen
with `requireCitation:true`; match + cram with `requireCitation:false`). Generalising the
Sybex acceptance *inside* `checkCitation()` therefore covers all four types at **zero
extra cost and zero extra code** — it is the same call sites.

**Lean: (b).** Reasoning: special-casing mc would require *adding* a type guard, i.e. more
code to do less. Q-E's literal "Sybex-cited mc items" governs the **fixtures** (the
initial 500 are MC-style), but the **predicate** should generalise uniformly so a future
Sybex match/cram fold-in needs no validator change. Fixtures stay mc-focused per Q-E; the
predicate is type-agnostic.

---

## 4. Selftest fixtures (8 new, added alongside the existing 6)

The existing 6 match/cram fixtures stay (regression safety). I add 8 Sybex-focused mc
fixtures. The fixture tuple gains a per-fixture `requireCitation` (default `false` keeps
the existing 6 byte-identical); mc fixtures set it `true` to exercise the legacy path.

| # | Fixture | `requireCitation` | Expected codes | Result |
|---|---|---|---|---|
| 1 | mc, valid Messer (both fields), no `sybex_reference` | true | `[]` | PASS |
| 2 | mc, valid top-level `sybex_reference` (edition+chapter+question_number), no Messer | true | `[]` | PASS |
| 3 | mc, valid Messer **and** valid `sybex_reference` | true | `[]` | PASS |
| 4 | mc, **none** of the three citation signals (bare) | true | `["legacy-no-citation"]` (**info**) | PASS-as-legacy |
| 5 | mc, `sybex_reference` missing `question_number` | true | `["sybex-question-number"]` | ERROR |
| 6 | mc, `sybex_reference` `chapter_level_only:true`, no `quote_excerpt` | true | `[]` | PASS |
| 7 | mc, practice-exam ref (edition + `practice_exam` + `question_number`, no chapter) | true | `[]` | PASS |
| 8 | mc, `sybex_reference` with **both** `chapter` and `practice_exam` | true | `["sybex-locator"]` | ERROR |

### Fixture #4 clarification (the "clarify legacy grandfathering behaviour" item)

The prompt's fixture list marks #4 as `→ ERROR`. **Recommended resolution: it is `info`
(`legacy-no-citation`), not error.** Rationale:

- The current corpus has grandfathered legacy items (no citation fields) flagged at
  **info** severity, by design (validator header lines 12–17). Flipping bare-item →
  error would light up every legacy item and **break the 0-error baseline** (§5).
- The validator **cannot** tell "this should have been a Sybex item but lost its
  citation" from "this is an intentionally grandfathered legacy item" without
  `sourceProvenance` — which 1g.1 does **not** enforce (gate-safe scope).
- Q-E's "at least one citation required" is satisfied **structurally**: the validator now
  *accepts* `sybex_reference` as a citation, so a Sybex item no longer needs Messer
  fields. Enforcing that Sybex items actually *carry* a citation belongs to 1g.4/1g.6
  (conversion writes `sybex_reference` for every Sybex item; a `sourceProvenance`-aware
  "sybex item missing citation → error" check can land then).

If you want bare-item → error in 1g.1 regardless, that is a **baseline-breaking** change
and I would need explicit sign-off plus a legacy-item remediation plan first. My
recommendation is to keep grandfathering as info.

---

## 5. Validator baseline after the change

**Affirmative:** the existing corpus runs **clean** after 1g.1 — the new code paths fire
only when a top-level `sybex_reference` is present, and **no corpus item has one yet**;
the Messer-citation logic is byte-identical. Baseline is unchanged.

**Baseline-count discrepancy flagged:** the ship prompt states "0 errors, 5 warns." The
**live** baseline at HEAD `db18068` is **0 errors / 4 warns** (all 4 are
`best-most-short-distractor`; 0 spelling warns, 0 info). The "5 warns" figure appears
stale. Confirming the live number is the acceptance target:

```
Validator results: 4 issues
  errors: 0
  warns:  4
  info:   0
By code:
      4  best-most-short-distractor
```

Selftest at baseline: `6 PASS, 0 FAIL`. After 1g.1: **14 PASS, 0 FAIL** (6 existing + 8
new). I will paste the real selftest output in the implementation commit body.

**If you confirm "5 warns" was the intended baseline, please point me at the 5th warn** —
I cannot reproduce it at `db18068` and would rather reconcile than assert a wrong number.

---

## Decisions needing sign-off (summary)

1. **§2b — practice-exam convention:** approve **Option A** (`practice_exam` +
   `question_number` integer fields; `chapter` XOR `practice_exam`)? This adds two fields
   beyond Q-A's literal shape.
2. **§2a — `quote_excerpt`/`chapter_level_only` never required at top level** for native
   items (semantics differ from audit-trail). Approve?
3. **§4 #4 — legacy grandfathering stays `info`**, not error (gate-safe, baseline-safe).
   Approve, or do you want a baseline-breaking strict mode?
4. **§2d — four granular `sybex-*` error codes** vs one collapsed `sybex-malformed`.
   Preference?
5. **§5 — baseline is 4 warns, not 5.** Confirm 4 is the acceptance target.

## Implementation footprint (post-sign-off)

~25–35 lines net in `scripts/validate-questions.mjs`: the `isNew()` one-liner, the
`hasSybex` branch in `checkCitation()`, a new `checkSybexReference()` (~15 lines), the
8 selftest fixtures + the per-fixture `requireCitation` tuple field. One commit, selftest
output in the commit body, validator-clean + baseline-unchanged confirmation.
