# Cadence Rules — Supervisor ↔ CC Workflow Norms

**Established 2026-05-22.** Extracted from supervisor's accumulated
experience across SB-fix-1a, SB-fix-1b packets 1–2, and Reports
#0005–#0008.

This document is the authoritative reference for **how
supervisor and CC pace each other** during audit-style work. It
sits alongside CLAUDE.md (which covers cross-cutting workflow
rules like commits and reports) and PLAN.md (which tracks
project state). Read this during session orientation alongside
CLAUDE.md.

The rules below capture cadence decisions specific to packetised
content-quality work. They are not exam-domain rules and not
schema decisions; those live in CLAUDE.md and SCHEMA.md
respectively.

Each rule below: **one-sentence statement**, **reasoning
paragraph**, **examples**. Reasoning is included so future-you
(or future-supervisor) can apply judgment to edge cases instead
of mechanically following the letter of the rule.

---

## Rule 1 — Packet size defaults

**Default packet size for partial-adjacent re-citation work is
50 items. First packet of a new sub-batch (or new content
shape) is 25 items, to calibrate review tempo and surface
unexpected issues early.**

### Reasoning

Match and cram items are short — each takes ~30 seconds of
focused supervisor review. A 50-item packet fits in ~20–25 min
of focused supervisor time, which is the natural review
chunk-size before fatigue degrades judgement. Halving the
paste-relay round-trip count vs 25-item packets is the
secondary benefit; primary benefit is matching supervisor's
sustainable attention envelope.

The first-packet caution exists because new sub-batches
sometimes surface parser bugs, schema mismatches, or category
edge cases that a smaller sample catches early at low cost.
SB-fix-1a packet 1 caught parser-bug candidates that wouldn't
have surfaced at 50-item scale until much more work was
re-derived. Pay the 25-item insurance premium on first
packets; default to 50 thereafter.

### Examples

- **SB-fix-1b packet 3 (next):** 50 items — same sub-batch
  shape as packets 1–2, no calibration needed.
- **SB-fix-2 (33-item pool):** single packet — entire pool
  fits under default; no split needed.
- **Any new sub-batch type** (e.g. D1 partial-adjacent first
  packet, future PBQ audits): start at 25 to calibrate.

---

## Rule 2 — Inline cluster verification

**When CC builds a packet and notices a cluster pattern (multiple
items in the same parent video where the cited video matches
concept umbrella but specific technique is plausibly absent from
transcript), CC pre-greps those items at build time and presents
verdicts inline in the packet.**

### Reasoning

Cluster verification was previously a separate paste-relay gate
(SB-fix-1a packets 2–3 and SB-fix-1b packet 2 both hit this).
Each gate adds a paste-relay round-trip — ~30–60s of Aiden
time plus context-switch cost. Inline at build time consolidates
the verification into the packet itself: supervisor still reviews
the verdicts during normal item-by-item review, but the
round-trip structure collapses from two trips to one for the
whole packet.

The CC-side mechanics are cheap: at packet-build time, identify
candidate cluster items (heuristic: ≥3 items from same parent
video with matching concept-umbrella but distinct specific
techniques), grep each candidate's specific technique against
the cited Messer transcript, record grep verdict + recommended
`sb16_subcategory` classification (partial-depth vs
messer-curriculum-gap) inline alongside the item. Supervisor
sees this in normal review and approves or contests.

### Examples

- **Packet 3 will likely hit §2.4 cluster items.** CC pre-greps
  the candidate items against the cited transcript at build
  time, presents grep results + recommended classification
  inline. Supervisor validates as part of the normal review,
  not as a separate gate.
- **SB-fix-2 (sb16-candidate adjudications):** likely benefits
  similarly — CC can pre-classify deferred-fix candidates
  inline rather than gating supervisor on the classification.

### Failure mode + mitigation

CC's grep heuristic misses an item that should have been
cluster-verified, or wrongly clusters an item that should not
have been. **Mitigation:** supervisor can request additional
verification during the normal item review — one extra round-trip
for that packet only, not a structural gate.

---

## Rule 3 — Supervisor review gates

**Per packet, supervisor reviews item-by-item decisions and the
dry-run diff preview. Nothing else is gated by default.**

### What is NOT gated (CC handles, surfaces only if exceptional)

- **Parser candidates** — shown in the packet body, not
  pre-reviewed.
- **Validator output** — only surfaced if non-clean. Clean
  validator runs are mentioned in passing, not gated.
- **Apply-script mechanics** — debugged on the CC side, trusted
  once smoke-tested. Bugs surface during dry-run review.
- **Commit message wording** — drafted by CC, supervisor signs
  off implicitly by approving the dry-run preview.

### Reasoning

Each gate adds a paste-relay round-trip. Gates are load-bearing
when they require genuine supervisor judgment that CC cannot
substitute (item-level fix-direction calls; cross-packet
consistency edge cases; schema decisions). Gates that just
rubber-stamp CC output — "validator clean, commit?" — are pure
overhead.

The principle: **gate where supervisor judgment is the bottleneck,
not where the act of confirmation is.** A clean validator run
is not a judgment call; a contested item is.

### Examples

- **SB-fix-1b packet 2 (yesterday):** supervisor reviewed
  21 item decisions + sb16-candidate classifications + dry-run
  diff. Did not separately review the parser scan output, the
  validator clean run, or the apply script's commit message.
  All three were CC-side preparation; supervisor saw their
  results in the packet/diff/commit-log.

---

## Rule 4 — Scoping documents are for architectural changes only

**Architectural changes require scoping documents and Q-letter
adjudication before implementation. Mechanical changes do not.**

### Architectural (scoping required)

- Schema extensions (new fields, new types, new prefixes)
- New sub-batch shapes (new patterns of input/output)
- Changes to validator rules (new pass/fail criteria)
- Changes to sync-engine prefixes (cross-device data shape)
- Anything with multiple downstream consumers (apply scripts,
  JSX, future audits, exports)

### Mechanical (no scoping required, dry-run preview sufficient)

- Per-packet runs of established work
- Apply-script tweaks within existing patterns
- Content fixes (citation corrections, spelling, typos)
- Cosmetic updates (formatting, kebab-case)
- Documentation syncs (PLAN.md updates after a packet ships)

### Reasoning

The SB-fix-1b-prep scoping proposal needed five Q-letters
(Q-A through Q-E) because the `sb16_subcategory` decision
affected the apply script, SB-fix-2 routing, future cert
audits, JSX surface, and the catalogue's long-term shape.
Mechanical changes don't have that downstream-consumer surface
— the dry-run preview is sufficient because only the packet's
own items are affected.

The rule biases toward less scoping overhead for everyday work
while preserving the slow-down-and-adjudicate response for
decisions that ripple.

### Examples

- **SCHEMA.md `sb16_subcategory` addition (2026-05-21)** —
  needed scoping. Was a schema decision affecting four
  downstream consumers.
- **Apply-script update to thread `sb16_subcategory` through
  the decision pipeline (2026-05-21)** — mechanical, no
  scoping. Was an implementation of an already-decided schema.
- **SB-fix-1b packet 3 build (next)** — mechanical, no
  scoping. Running established methodology.
- **Future SB-fix-2 (33-item adjudication pool)** —
  mechanical, no scoping. Running established methodology on a
  smaller pool.
- **Future weakness-tracker design (Task C this session)** —
  architectural, scoping required. New schema, new sync
  prefix, future UI, cross-device implications.

---

## Rule 5 — Cross-packet consistency (path 1)

**CC pre-annotates each packet item with cross-packet consistency
hints: "matches SB-fix-1a #X" or "matches SB-fix-1b packet N #Y"
when the concept clearly mirrors a prior adjudication. Supervisor
reviews for exceptions, not for re-derivation.**

### Reasoning

The catch-all generalisation finding (Report-#0007 §5) shows
that ~60–80% of partial-adjacent items in later packets are
concept-counterparts of earlier ones. Re-deriving each from
first principles is wasted supervisor time when the precedent
exists in the audit_d_review fields of the earlier item.

CC's mechanics: at packet-build time, for each candidate
partial-adjacent item, query the catalogue for already-decided
items with the same `sb16_subcategory`, similar
`fix_direction`, and overlapping concept text. Annotate the
item with the prior decision and rationale. Supervisor reviews
**by exception** — only flagging items where the proposed
consistency hint is wrong.

### Failure mode

**Spurious match.** CC's heuristic flags two items as
consistent when they actually test different concepts at
different depths. Supervisor reads the annotation as
authoritative and approves quickly because the precedent looks
right — bad decision ships.

### Mitigation

Cross-packet consistency audit pass after SB-fix-1b closure
(already in the backlog). Bad consistency hits get caught and
corrected then. The audit pass is cheap because the
`audit_d_review` fields record the full decision history per
item — diffing prior-item rationale against current-item
rationale flags suspect consistency claims.

### Examples

- **Future packet 3 BEC item:** if a packet-2 BEC adjudication
  exists, CC annotates inline; supervisor sees
  "matches SB-fix-1b packet 2 #14 (BEC → partial-depth)" and
  signs off in one read.
- **§2.4 cluster items (likely in packet 3):** apply Rule 2
  (inline cluster verification) and Rule 5 (cross-packet
  annotation) together — both reduce supervisor's per-item
  cognitive load.

---

## Rule 6 — Scope discipline: mid-stream findings

**Findings surfaced mid-packet that aren't directly load-bearing
on the current packet's decisions get captured in
`.audit-working/findings/{topic}.md` (or similar). They do NOT
expand the current sub-batch.**

### Reasoning

SB-fix-1b surfaced multiple incidental findings:
- BEC cross-packet inconsistency between SB-fix-1a and
  SB-fix-1b decisions
- Specter/Meltdown typo
- Mitigation-techniques catch-all sub-pattern

Each is real and worth recording. None should slow the current
sub-batch — that's how a 134-item sub-batch becomes a 200-item
sub-batch and then a six-month epic.

### Disposition

- **Small backlog** — cleanup pass between sub-batches
- **Large backlog** — post-Sec+ cleanup, after exam pass

The findings file IS the audit trail; nothing is lost. The rule
is just about not letting incidentals expand the active scope.

### Examples

- **2026-05-21:** during SB-fix-1b packet 2 build, CC noticed
  the Specter/Meltdown typo. Captured in a findings note;
  packet 2 shipped on schedule with the original 21-item
  scope. Typo fix is now in the small backlog.

---

## Communication patterns

Codifies the relay v2 protocol (see
`.audit-working/relays/README.md` for implementation detail).

### Banned

- **`iconv | clip.exe` of status blocks.** The clipboard pipe
  was useful as an interim mechanism before the relay existed.
  With the file-based relay in place, status content goes in
  the relay file. The clipboard pipe is acceptable only for
  very short copyable strings — nonces, file paths, single-line
  signals — and should not be the default mode for any
  multi-paragraph content.
- **Long terminal status output to Aiden.** CC's terminal text
  is path + commit hash + nonce + (optionally) one-sentence
  context. Aiden reads the relay file if more is needed. The
  relay file IS the surface; the terminal is the address bar.
- **Autonomous polling and bridge tools.** Aiden routes by
  hand using short signals. No background poll loops, no
  bridge scripts. Relay v1's `scripts/supervisor-relay.sh` was
  retired same-day as it landed (2026-05-22) once the v2
  pattern was identified during the test cycle.

### Required

- **Relay used for** any multi-paragraph supervisor exchange,
  any structured artefact (status reports, item-by-item review
  packets, scoping responses), any content that benefits from
  permanent audit trail.
- **Direct paste-relay used for** single-message exchanges,
  short queries, quick yes/no confirmations — anything where
  the git overhead exceeds the message value.

### Threshold

If the content would be a long status block (>10 lines or with
structured content), use the relay. Otherwise direct paste.

---

## Relationship to other standing docs

- **CLAUDE.md** — workflow rules that apply across all work
  (commits, reports, surface-and-pause framing, validator
  preflight). References this document as authoritative on
  cadence decisions specifically.
- **PLAN.md** — project state, pending sub-batches, packet
  numbering. Unchanged by this document.
- **`.audit-working/relays/README.md`** — implementation
  detail of the file-based relay protocol. This document
  references it for "how" the communication patterns are
  realised but does not duplicate the file-naming or
  marker-convention details.
- **SCHEMA.md** — question schema and audit field semantics.
  Unaffected by cadence rules.
- **Reports/** — per-task session records. Cadence decisions
  taken during a task are recorded there; cadence rules
  derived from accumulated experience get extracted up to
  this document.

---

## Changelog

- **2026-05-22 — initial** — extracted from Reports
  #0005–#0008 and SB-fix-1a/1b experience. Six rules + a
  communication-patterns subsection. Established during
  Task B of "start as we mean to go on" infrastructure
  session.
