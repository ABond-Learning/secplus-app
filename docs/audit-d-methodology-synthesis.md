# Audit D — methodology synthesis across Reports #0005–#0009

Generated: 2026-05-23
Scope: Consolidates cross-Report methodology patterns from the Audit D arc.
Audience: future CC + supervisor sessions taking the Audit D methodology
forward to D1/D3/D4/D5 partial-adjacent cleanup (the (C) successor pass).

This is a **methodology reference**, not a session report. Reports #0005–#0009
remain authoritative on what happened *when*; this doc captures the
generalisable insights that became cadence rules, workflow rules, or
classifier-tuning decisions. Sections link back to the originating Report
for full context.

---

## 1. Audit D arc — timeline at a glance

| Phase | Date | Commit | Spend | Outcome |
|---|---|---|---|---|
| SB0 calibration | 2026-05-13 | `111be1f` | $0.32 | 30-item smoke; strict 76.7% / collapsed 86.7% |
| SB1 pre-flight iter0 | 2026-05-14 | `aa32fad` | $0.97 | Rec 2 + Rec 4 landed; Rec 1 deferred; smoke PASS |
| SB1.5 post-process | 2026-05-18 | `a26d42c` | $0 | fix_direction → category flip script; supervisor sign-off |
| SB1 full-corpus (halt) | 2026-05-18 | — | $7.42 sunk | Travel-halt at call #688; retrofit motivated |
| SB1 full-corpus (clean) | 2026-05-19 | — | $25.92 | 2,128 verdicts; 100% cache hit after first call |
| Spot-check sign-off | 2026-05-19 | (Report-#0005) | $0 | 30/40 strict (75% PASS) |
| 8-item uncertainty verification | 2026-05-20 | (Report-#0006) | $0 | 8/8 LLM verdicts held; agreement → 95% |
| SB1.6 post-process refinement | 2026-05-20 | (Report-#0006) | $0 | 3 strict flips + 18 loose flags |
| SB-fix-1a ship (D2 PA mc+scen) | 2026-05-20 | `53786b0`…`61b6992` | $0 | 63 reviewed / 52 re-cited / 10 sb16-candidates |
| Report-#0007 methodology lock | 2026-05-21 | `4e6fb9e` | $0 | Cumulative agreement 47/50 = 94% |
| SB-fix-1b-prep schema | 2026-05-21 | `c1464c0` | $0 | match/cram per-item citation override |
| SB-fix-1b 4 packets ship | 2026-05-21/22 | `c252fa1`…`f89b48e` | $0 | 102 edits + 32 sb16-candidates |
| sb16_subcategory formalised | 2026-05-21 | `12deabc` | $0 | partial-depth vs messer-curriculum-gap |
| Relay v1 → v2 + cadence rules | 2026-05-22 | `24cdc7f`…`28f4054` | $0 | Single-loop relay; 6 cadence rules |
| SB-fix-2 scripts + R sub-path | 2026-05-22 | `0bc18e6`…`0789b95` | $0 | 4 scripts; 18 Pool B items routed |
| Classifier improvements | 2026-05-23 | `51ac1ff`…`4a3008c` | $0 | Needle augmentation + umbrella heuristic invert |
| Retroactive smoke validation | 2026-05-23 | `63fc015` | $0 | R-packet divergence 77.8% → 11.1% |

**Cumulative Audit D spend: $34.63** (SB0 + SB1 halt + SB1 completion;
all post-SB1 work is $0 — script + manual review + transcript grep only).

---

## 2. Methodology insights — cross-cutting patterns

### 2.1 fix_direction is a more reliable LLM-intent signal than category

**Origin: Report-#0003 pre-flight findings; productionised in SB1.5
(Report-#0005).**

When an LLM-as-judge produces (category, fix_direction, justification)
triples, the *fix_direction* field reflects intent more cleanly than the
*category* field. Training prior `concept-not-in-this-transcript →
out-of-source` overrides explicit prompt instruction at category-
selection step, but fix_direction is less constrained so it reflects
actual reasoning.

**Application:** post-processing on `fix_direction → category`
consistency is structurally cleaner than further prompt iteration.

Generalises to any LLM-as-judge pipeline where the schema enforces
category-action pairing.

### 2.2 Prose-marker co-firing as a precision tool

**Origin: SB1.6 design (Report-#0006).**

Single prose markers in LLM justifications are too noisy to discriminate
must-flip from must-not-flip cases — markers like "the concept IS
taught" or "legitimate Security+ concept" appear in both. But requiring
**≥ 2 of N candidate markers to co-fire** gives 100% precision and
100% recall on the SB1.6 must-flip validation set (3/3 caught,
0/12 false-positives).

**Two-tier output is the right architecture** when prose-marker scanning
can't cleanly decide on phrasing alone:
- Strict tier (≥ 2 markers) → auto-flip
- Loose tier (= 1 marker) → flag-for-review (candidate-augment pool)

The loose tier feeds the next remediation sub-batch rather than being
discarded.

### 2.3 The catch-all pattern generalises across Domain 2 video clusters

**Origin: Packet-1 supervisor flag; confirmed at scale in
SB-fix-1a (Report-#0007 §5).**

§2.2 / §2.3 / §2.4 / §2.5 each act as catch-alls for cross-cluster
items:

- **§2.2** Social Engineering — bucketed DKIM/SPF/DMARC / DNS pharming /
  physical & awareness items.
- **§2.3** Types of Vulnerabilities — bucketed DNS-specific /
  infrastructure / mitigation items that belonged in §1.x / §3.x / §4.x.
- **§2.4** Common Attack Types — 15 of 52 SB-fix-1a edits were
  *within-cluster sibling reorganisation* (right area, wrong sub-video).
- **§2.5** Mitigation Techniques — bucketed cross-domain hardening
  content that belonged in §4.1 / §4.8 / §1.2.

**Application to D1/D3/D4/D5:** assume catch-alls exist in those domains
too. Look for parent videos with broad titles ("Common ...", "Types of
...", "Concepts of ...") and expect ~30-50% within-cluster sibling
reorganisation rather than cross-domain moves.

### 2.4 Partial-depth was systematically under-applied at the LLM layer

**Origin: SB-fix-1a (Report-#0007 §6).**

The LLM-as-judge under-recognised partial-depth verdicts (concept-here-
but-not-this-exact-term). Even with two prompt iterations and SB1.6
post-process, **10 additional sb16-candidates surfaced during SB-fix-1a
human review** beyond what the predicate caught — pushing the SB-fix-2
candidate-augment pool from 21 to 31 items.

9 of the 10 clustered in §2.4 attack-types where each parent video
covers a generic attack family but doesn't name canonical exam-relevant
techniques (SYN flood, DNS tunneling, evil twin, WPA2 handshake, IDOR,
credential stuffing, pass-the-hash).

**Application to D1/D3/D4/D5:** budget for a similar manual gate in
each follow-on sub-batch. Auto-prediction will miss 5-15% of partial-
depth cases that require sibling-aware "concept-here-but-not-this-
exact-term" review.

### 2.5 Umbrella-conceptual-fit framing is the load-bearing rule for sb16 routing

**Origin: SB-fix-2 R packet adjudication (handoff §"Active conventions");
formalised in `sb16_subcategory` schema (`12deabc` 2026-05-21).**

Decision axis: does the cited video's *umbrella concept* conceptually
contain the tested specific technique?

| Subcategory | Meaning | Example |
|---|---|---|
| `partial-depth` | Cited video's umbrella subsumes the tested technique; technique absent from transcript | Spectre/Meltdown under Hardware Vulnerabilities; SYN flood under DoS |
| `messer-curriculum-gap` | Cited video is a sibling concept; tested technique has no umbrella home anywhere in Messer's corpus | Integer overflow under Buffer Overflows |

**Application to D1/D3/D4/D5:** the umbrella-fit question is the right
discriminator. Once an item is sb16-candidate, the binary decision is
*does the parent video genuinely umbrella the tested technique* —
supervisor adjudicates per item with corpus grep evidence inline.

Classifier improvement 2026-05-23 (Task 1.2) inverted the default for
`looksLikeUmbrellaTitle()`: most Messer SY0-701 videos ARE
category-level summaries; the prior on "is this an umbrella?" should
be YES, not NO. Specific-marker carve-outs (slashes, "vs", "Examples
of") are the exceptions.

### 2.6 Schema-constraint check belongs in scoping, not implementation

**Origin: SB-fix-1 scoping (Report-#0006); recurred in SB-fix-1b-prep
(Report-#0008).**

Before scoping a "metadata-only" change across N items, verify the
schema actually supports per-item override on the field being changed.
For Audit D's partial-adjacent re-citation, 134 of 197 D2 items lived
in `match`/`cram` arrays where citation inherited from the parent video
— re-citation required either a structural move (breaks SM-2 keys) or
a schema extension. Catching this in scoping saved authoring an apply
script that would have silently broken study progress on 65 match items.

**Application to D1/D3/D4/D5:** when planning a sub-batch that touches
per-item fields, check SCHEMA.md's "never reorder / never change video
id" guarantees against the proposed remediation BEFORE writing the
apply script.

### 2.7 Patterns from Report-#0007 §8 — methodology cumulative math

The Audit D arc's overall LLM-as-judge methodology agreement number
locked at **47/50 = 94%** (30 spot-check + 8 uncertainty-verified + 9
cluster-verified; 3 remaining disagreements all SB1.6-method-handled).

**Discipline:**
- Spot-check supervisor verdicts do NOT get retroactively edited.
- Methodology numbers are reconstructed by counting same-direction
  flips; not by re-grading.
- "Method improvement over SB0 baseline" beats "script error" framing
  when post-process flips align with revised judgment.

### 2.8 Parser-v2 allowlist-based replacement

**Origin: SB-fix-1a parser v2 (Report-#0007 §3).**

Regex-based parsing of LLM verdict text (extracting destination video
title from justification) had 4 distinct bug classes in v1:
- truncation on "or" boundaries
- inverted primary/alternate parsing
- prose-suffix capture
- hallucinated titles

Replacing regex with **allowlist matching against the 120-entry known-
Messer-title canonical set** eliminated all 4 bug classes. Parser
became deterministic + reversible. Allowlist-based parsing improved 10
corpus items + left 53 unchanged.

**Application:** when extracting structured data from LLM output, prefer
*matching against a known canonical set* over *parsing free text*
whenever the target space is bounded.

---

## 3. Lessons that became Workflow Rules / cadence rules

| Insight | Surface | Path |
|---|---|---|
| Long-running API scripts must support resume-on-restart | CLAUDE.md Workflow Rule #8 | §2.1 sunk-cost incident (SB1 halt 2026-05-18 / $7.42) |
| Event-log NDJSON at state transitions for autonomous chains | CLAUDE.md Workflow Rule #9 | Established 2026-05-23 |
| Packet size defaults (50 items partial-adjacent / 25 first-packet) | `docs/cadence-rules.md` Rule 1 | SB-fix-1a packet 1 parser-bug catches |
| Inline cluster verification at build time | `docs/cadence-rules.md` Rule 2 | SB-fix-1b packets 3-4 |
| Supervisor review gates only where judgment is the bottleneck | `docs/cadence-rules.md` Rule 3 | Across SB-fix-1a/1b |
| Scoping docs only for architectural changes | `docs/cadence-rules.md` Rule 4 | SB-fix-1b-prep's 5 Q-letters |
| Cross-packet consistency hints at build time | `docs/cadence-rules.md` Rule 5 | Catch-all generalisation (§2.3) |
| Scope discipline — findings → `.audit-working/findings/`, not expansion | `docs/cadence-rules.md` Rule 6 | BEC / SSL stripping cross-packet inconsistencies |
| Surface-and-pause at decision gates | Memory `feedback_surface_and_pause.md` | SB1.5 straight-through 2026-05-18 |
| Long-running API loops need write-as-you-go from v1 | Memory `feedback_resume_first_design.md` | SB1 halt 2026-05-18 |
| Split commits by logical boundary | Memory `feedback_commit_split.md` | SB1-halt session |

---

## 4. Open methodology questions for D1/D3/D4/D5 carry-forward

Items NOT resolved by the D2 arc that the (C) successor pass will need
to handle:

### 4.1 D1/D3/D4/D5 partial-adjacent volume

D2 partial-adjacent: 197 items (63 mc+scen + 134 match+cram). Total
across all 5 domains from SB1 full-corpus: 227 + 197 = 424 (approximate).
The D1/D3/D4/D5 portion is ~227 items split unevenly. Pre-flight check:
re-count from `full-corpus-verdicts-postprocessed.json` filtering by
section prefix.

### 4.2 Will the catch-all pattern generalise to D1/D3/D4/D5?

Hypothesis (per §2.3): YES — assume catch-alls exist. Look for parent
videos with broad titles in each domain. D4 §4.x has many such titles
(SIEM/SOAR/DLP-style umbrellas); D5 §5.x has fewer (more discrete
governance topics).

### 4.3 Will partial-depth be similarly under-applied at the LLM layer?

Hypothesis (per §2.4): YES. Budget for a 5-15% manual gate per packet.
For Pool B items in any future cleanup, run the SB-fix-2 R-style
routing script first (now with improved classifier — 11.1% divergence
on R-packet retroactive smoke). Most curriculum-gap recommendations
will need supervisor flip to partial-depth.

### 4.4 SD-WAN routing-out — first instance, expect more

The R packet surfaced one item (`§3.1/3.1.2 scen[3]` SD-WAN) routed
OUT of SB-fix-2 scope to future D1/D3/D4/D5 cleanup. This is captured in
`.audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md`.
Expect 1-3 more such items per packet in the (C) pass — items where
the LLM-as-judge flagged out-of-source but the term genuinely lives in
a different parent video that DOES cover the concept.

### 4.5 Cross-packet inconsistency reconciliation

`.audit-working/sb-fix-1b/cross-packet-inconsistencies.md` has 2 entries
(BEC, SSL stripping) deferred to SB-fix-2 closure per cadence Rule 6.
The (C) pass should sweep up these residuals + any new ones surfaced
during D1/D3/D4/D5 review.

---

## 5. Topic index — pointers back to source Reports

| Topic | Primary Report | Sections |
|---|---|---|
| SB1 full-corpus completion + cache behaviour | #0005 | Phases 2–3 |
| Stratified spot-check methodology | #0005 | Phase 5 |
| Uncertainty verification ($0 transcript grep) | #0006 | TASK 1 |
| SB1.6 prose-marker design + two-tier output | #0006 | TASK 2 |
| SB-fix-1 scoping + match/cram constraint discovery | #0006 | TASK 3 |
| Q6 validator-constraint check (Outcome A) | #0007 | §2 |
| Parser v2 allowlist redesign | #0007 | §3 |
| SB-fix-1a per-packet ship (cumulative 63/63) | #0007 | §4 |
| Catch-all generalisation across §2.2/§2.3/§2.4/§2.5 | #0007 | §5 |
| Partial-depth under-application + sb16-candidate pool | #0007 | §6 |
| Cumulative methodology math (47/50 = 94%) | #0007 | §8 |
| SCHEMA per-item citation override (match/cram) | #0008 | §3 |
| Validator generalisation + 6-fixture selftest pattern | #0008 | §4–5 |
| Relay v1 → v2 simplification + banned patterns | #0009 | Task A |
| Cadence rules consolidation (6 rules) | #0009 | Task B |
| Weakness-tracker scoping (Q-A through Q-F) | #0009 | Task C |

---

## 6. Tooling reference — scripts that embody the methodology

Reusable across D1/D3/D4/D5:

| Script | Purpose | Selftest |
|---|---|---|
| `scripts/audit-d-llm-judge.mjs` | LLM-as-judge with cache + retry + resume | n/a (production-only) |
| `scripts/audit-d-postprocess-verdicts.mjs` | SB1.5 fix_direction → category flip | n/a |
| `scripts/audit-d-postprocess-sb16.mjs` | SB1.6 two-tier prose-marker scan | inline must-flip / must-not-flip set |
| `scripts/sb-fix-1a-build-packet.mjs` | Parser v2 allowlist-based packet build | inline parser fixture set |
| `scripts/sb-fix-1b-build-packet.mjs` | Match/cram per-item citation override packet | `--selftest` |
| `scripts/sb-fix-1b-cluster-verify.mjs` | Inline cluster verification (cadence Rule 2) | `--selftest` (added Task 1.0 / 2026-05-23) |
| `scripts/sb-fix-1b-cross-packet-annotate.mjs` | Jaccard similarity against prior decisions (cadence Rule 5) | inline |
| `scripts/sb-fix-2-build-packet.mjs` | P + G sub-path packet build | `--selftest` |
| `scripts/sb-fix-2-route-pool-b.mjs` | Pool B routing classifier (improved 2026-05-23) | `--selftest` (4 outcomes + helpers) |
| `scripts/sb-fix-2-retroactive-smoke.mjs` | Validates classifier improvements vs adjudicated routings | n/a (one-off validation) |
| `scripts/sb-fix-2-backfill-pool-b.mjs` | Applies R routings to catalogue audit_d_review | `--selftest` |
| `scripts/validate-questions.mjs` | Schema + spelling + heuristic validator | n/a |

All are gitignored-output writers (`.audit-working/`); none touch the
production user store (`localStorage`).

---

## 7. Pre-flight checklist for D1/D3/D4/D5 sub-batch start

Reusable from the SB-fix-1 / SB-fix-2 cadence:

1. `git status` clean? (allowing pre-existing untracked Task 2 docs)
2. `git pull` up-to-date
3. `npm run build` clean baseline
4. `node --test` all passing
5. Disk ≥ 1 GB free
6. `--selftest` on all sub-batch scripts PASS
7. Budget check: any LLM re-run requires top-up beyond $19.08 remaining
8. Scope decision: is this re-citation (per-item field change), structural
   move (changes videoId), or routing-only (audit_d_review.sb_fix_2.applied_at)?
9. Schema-constraint check (per §2.6) BEFORE writing apply script
10. Resume-on-restart smoke (per CLAUDE.md Rule #8) BEFORE first big run

---

## 8. What this doc is NOT

- **Not a session report.** Reports/Report-#NNNN.md remain authoritative.
- **Not a how-to manual.** Cadence rules + CLAUDE.md cover process.
- **Not a methodology tutorial.** Assumes familiarity with the Audit D
  arc; surfaces patterns rather than teaches the basics.
- **Not autoritative on individual decisions.** Per-item routings live
  in `.audit-working/sb-fix-2/packet-*.json` + the catalogue's
  `audit_d_review` fields.

When this doc and a session Report disagree on dates/numbers, the
Report wins. This doc consolidates; it doesn't override.
