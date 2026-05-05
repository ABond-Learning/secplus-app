# Content-Quality Audit Lessons

## Source

Audit A apply phase, Sec+ app, 2026-05-03 to 2026-05-05. 187 of 187 HIGH
structural-consistency items proposed and shipped across 4 commits
(`19c84de`, `58d224b`, `477690f`, `fed56d8`). Closure document at
`.audit-working/audit-a-apply-phase-complete.txt` (gitignored; this file is
the durable distillation).

## Lesson 1 — Verifier-tool pattern (gating execution, not self-report)

Batch 5 (proposal phase) recorded a 0/29 first-pass rework rate after the
author switched from "I claim to measure floors before drafting distractors"
to "`/tmp/verify.mjs` gates each item before I move on". Batch 4b's
same-stated-discipline run had 25/33 = 76% rework. The difference was tool
gating, not author intent.

The reusable artifacts for this pattern in this repo:

- `scripts/fix-audit-a-{chunk-1,chunk-2,chunk-3,deferred}.mjs` — each does a
  non-mutating safety pass (BEFORE-state byte match + ratio check) before
  any write. The DRY-RUN mode prints every per-item ratio, so review and
  apply are the same tool.
- `.audit-working/parse-all-batches.mjs` — parses proposal docs into
  structured REPLACEMENTS, surfaces length-claim mismatches and BEFORE
  drift before any apply.
- `.audit-working/full-audit-actual-ratio-check-2026-05-04.txt` —
  cross-checks claimed-vs-actual char counts on every proposal item. This
  is what surfaced the 4 deferred items in the first place; the proposal
  review missed actual-text length drift.

Future audits should adopt the same pattern: write the tool first, have
the author/reviewer drive through the tool, treat tool output as the source
of truth, not narrated discipline.

## Lesson 2 — Actual-vs-claimed length distinction

Multiple proposal items claimed final lengths in their `Final: A,B,C,D →
ratio N.NN×` lines that did not match the actual char counts of their
authored option text. Examples:

- **scen-2.4.8-1** — claimed final 1.50× (170/113), actual landed 1.504×
  (170/113 with 113c that wasn't quite reproducible after authoring)
- **scen-2.5.2-1** — claimed final 1.47× (270/184), actual landed 1.776×
  (proposal text was 152-157c, not 184c as claimed)
- **scen-3.3.3-0** — claimed final 1.27× (209/165), actual landed 1.673×
  (proposal text was 276c, not 209c as claimed)

Root cause: the proposal author measured "what I would write" rather than
"what I wrote". The claimed-length numbers were mental targets, not
measured outputs.

Future audit proposals should measure actual char counts of authored text
in the same script that emits the proposal — never let claimed and actual
numbers diverge.

## Lesson 3 — Find binding minimum, not just one short option

`scen-4.3.3-2` was deferred with a note "needs ~2c distractor pad" based
on opt[3]=148c being the assumed-shortest. After the mechanical-pad was
authored, ratio still landed 1.497× because opt[0]=149c was actually the
binding minimum. The fix required padding both options, not just one.

Future deferred-bundle authoring should compute the binding minimum across
all distractors and pad whichever option(s) push min above the threshold,
not pad one option by name without verification.

## Lesson 4 — Per-item exp-coverage check before trim-correct

When a TRIM-CORRECT proposal cuts pedagogical detail from the correct
option, that detail must still live somewhere — usually the `exp` field.
Chunk 2's special-case handoff included 12 items flagged for exp coverage
verification; all 12 were checked post-apply and zero needed updates
(existing exp fields covered the trimmed detail). But the check is
non-optional — without it a trim could silently drop content the student
needs.

The `chunk-2-shipped.txt` note flagged a transparency issue with the
commit message phrasing: the message claimed exp updates were "included
where needed" without affirmatively stating that the "where needed" set
was empty in this chunk. Future commits should state coverage outcomes
affirmatively: "exp coverage verified for N items, M updates landed" —
not the boilerplate template.

## Reusable artifacts in repo

- `scripts/audit-option-structural-consistency.mjs` — audit script that
  flags HIGH/MED/LOW items by ratio and structural pattern.
- `scripts/fix-audit-a-{chunk-1,chunk-2,chunk-3,deferred}.mjs` —
  apply-script pattern with safety check + dry-run + preview + write
  modes. Each script does a non-mutating safety pass (BEFORE-state byte
  match + stem-prefix match + ratio check) before any write. Idempotent:
  re-running `--write` after a successful apply skips items whose current
  opts already equal `newOpts`.
- `.audit-working/verify.mjs` — per-item verifier with floor / ratio /
  batch / floors modes. Gitignored but reproducible from the patterns in
  the chunk-apply scripts.

## Application

Future content-quality audits on this repo should follow the same pattern:

1. Write the verifier first.
2. Drive proposals through the verifier (not narrated discipline).
3. Measure actual outputs, not authorial intent.
4. Compute binding constraints across all options before applying
   mechanical fixes.
5. Verify exp coverage affirmatively when trimming correct options.
