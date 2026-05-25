# Report-#0018 — SB-fix-2 P2 + P3 packet closure (P-path CLOSED at 56/56)

**Date:** 2026-05-25
**Task type:** Audit D / SB-fix-2 remediation (packet closure, audit-only)
**Run-IDs:** `2026-05-24-sb-fix-2-packet-P2-apply`, `2026-05-25-sb-fix-2-packet-P3-apply`

---

## What was asked

Apply the final two partial-depth packets to `questions.json` and close the SB-fix-2
P-path:

- **P2** — 20 partial-depth items, all §2.4 (run committed at `e430368` without a report;
  this report covers it).
- **P3** — 16 partial-depth items across §2.4/2.5/3.4/4.1/4.3/5.2/5.5/5.6, final P-path
  packet (committed `04d3eba`).

Both packets: all `keep-with-sybex-note`, no Group A cross-source gaps expected. Per-item
workflow: build decisions JSON, grep the Tier 2 corpus for the unverified terms, dry-run,
apply via `scripts/sb-fix-2-apply-packet.mjs`, commit.

## P2 + P3 closure summary — 36 items applied

Both packets are **100% `keep-with-sybex-note`** with **zero Group A cross-source gaps** —
every Messer umbrella is the correct home, and every term has a Sybex chapter home (the only
question per item was whether the specific term is verifiable in Tier 1/2 or only in Tier 3
prose).

| Packet | Items | Quote-cited (T1 / T2 hit) | Chapter-level Tier 3 | Commit |
| ------ | ----- | ------------------------- | -------------------- | ------ |
| P2 | 20 (all §2.4) | 10 | 10 | `e430368` |
| P3 | 16 (§2.4–5.6) | 6 | 10 | `04d3eba` |
| **Total** | **36** | **16** | **20** | |

Audit-only on both: content-equivalence verified identical after stripping the
`sb_fix_2` audit blocks (zero question/answer/explanation mutation). `npm run build` clean
on both. Validator pass pre- and post-write on both. `sb16_subcategory` left at
`partial-depth` throughout (the apply script never touches it).

### P2 quote-cited (10)
Evil twin (22, 24), credential replay/nonces (29), IDOR (30, 32, 34), SSRF (31, 33),
pass-the-hash (38) — all STRONG Tier 1 (glossary/index). Plus SSL stripping (26) — a
**Tier 2 hit** (see methodology below).

### P2 chapter-level (10)
WPS PIN attack (21, 23), WPA2 4-way handshake (25, P1 #20 precedent), BGP hijacking
(27, 28), POODLE (35, 36), credential stuffing (37, 40), hybrid attack (39).

### P3 quote-cited (6)
Pass-the-hash (43, P2 #38 precedent), secure boot (45, 46), differential backup (49),
MAM (50), STIX/TAXII (51) — all STRONG Tier 1.

### P3 chapter-level (10)
Credential stuffing (41, 42, 44 — P2 precedent, no re-grep), parallel test (47), full
interruption test (48), EPSS (52), MTD (53, 54), remediation validation (55), security
champions (56).

## chapter_level_only flag usage — cumulative after P3

The `chapter_level_only: true` flag (introduced in P1, commit `aef0eab`) marks a citation
whose Sybex chapter is the TOC-mapped home but whose specific term is absent from Tier 1+2
and may live only in Tier 3 chapter prose. Cumulative usage across the whole SB-fix-2
keep-with-sybex-note corpus:

| Packet | keep-with-sybex-note items | chapter_level_only | quote-cited |
| ------ | -------------------------- | ------------------ | ----------- |
| G | 2 | 0 | 2 |
| P1 | 16 | 9 | 7 |
| P2 | 20 | 10 | 10 |
| P3 | 16 | 10 | 6 |
| **Total** | **54** | **29** | **25** |

Across the **P-path proper** (P1+P2+P3): 52 keep-with-sybex-note items, **29 chapter-level**,
23 quote-cited. (The remaining 4 P-path items are P1's Group A cross-source-curriculum-gap,
stored inline in `audit_d_review` rather than the `sb_fix_2` block.) So **roughly 56% of
P-path keep-with-note citations are chapter-level Tier 3** — a high rate that reflects how
much §2.4 attack-vector vocabulary (WPS PIN, BGP hijack, POODLE, credential stuffing,
hybrid, DNS tunnel, metamorphic) and §3.4/§5.x program vocabulary (parallel/full-interruption
test, EPSS, MTD, security champions) lives in Sybex prose rather than glossary/index/practice
tests.

## Methodology note — T2 grep evidence must support what the item TESTS

The single recurring judgment in P2 and P3 was distinguishing a real Tier 2 hit from a
token collision. **A grep match only counts as a hit if the matched text supports what the
item actually tests — not merely that the search token appears somewhere in the corpus.**
Three cases where the token matched but the evidence did not support the item:

- **WPS PIN attack (P2, items 21/23).** Grep `WPS|PIN attack|Wi-Fi Protected Setup` matched
  WPS *as a feature* ("Wi-Fi Protected Setup, a quick setup capability"; "WPS is being
  removed") in chapter-13 / practice-exam-01 — but the **PIN brute-force attack vector**,
  which is what the items test, is never described. → chapter-level, not a feature-level
  quote that would misrepresent coverage.
- **Parallel test (P3, item 47).** Grep `parallel test|simultaneous` matched only WPA3-SAE
  ("Simultaneous Authentication of Equals") and a browser-session attack — nothing about
  DR/BCP test types. → chapter-level.
- **Remediation validation (P3, item 55).** Grep `remediation` matched "remediation plan"
  in a risk-mitigation / risk-acceptance context — not the retest-after-fix *validation*
  rescan the item tests. → chapter-level.

Both judgment calls are documented in the decision notes (and surfaced to the supervisor on
the P2 findings return) so they can be flipped to a feature-level quote on review if the
strict-mechanical grep read was intended.

## SSL stripping — why T2 grep is worth doing even when T1 misses

SSL stripping (P2, item 26) is the counter-case that justifies the per-item grep step rather
than defaulting every Tier-1 miss to chapter-level. It is absent from the Sybex glossary and
index (Tier 1 miss), but practice-exam-01 carries a question explicitly on "an SSL/TLS
stripping attack" with the attack mechanism described in the explanation — a genuine,
concept-supporting Tier 2 hit:

> "SSL stripping (or TLS stripping) relies on making the end user believe"

Without the grep, this item would have been over-conservatively flagged chapter-level. The
grep upgraded it to a verbatim-cited keep-with-sybex-note. One real upgrade across 16
T2-VERIFY items (P2: WPS×2-miss, SSL-hit, BGP×2-miss, POODLE×2-miss, cred-stuffing×2-miss,
hybrid-miss; P3: parallel-miss, full-interruption-miss, EPSS-miss, MTD×2-miss, remediation-miss,
security-champion-miss) is a low but non-zero hit rate that pays for the cheap grep step.

## SB-fix-2 P-path FULLY CLOSED at 56/56

The partial-depth P-path pool is now fully adjudicated:

| Sub-path | Items | Mechanism | Commits |
| -------- | ----- | --------- | ------- |
| P1 | 20 | 16 keep-with-sybex-note (7 T1/T2 + 9 chapter-level) + 4 cross-source-curriculum-gap | `f2c2c2a`, `b5b0f34`, `aef0eab`, `979e994` |
| P2 | 20 | 20 keep-with-sybex-note (10 quote + 10 chapter-level) | `e430368` |
| P3 | 16 | 16 keep-with-sybex-note (6 quote + 10 chapter-level) | `04d3eba` |
| **P-path** | **56/56** | | |

Per the supervisor's overall SB-fix-2 structure (**R + G + P1 + P2 + P3**), the R packet
(18 routings) and the G packet (cross-source/HSTS group) were the companion sub-paths that
preceded the P1–P3 partial-depth packets; with P3 landed, the partial-depth pool is closed
at 56/56 and no P-path items remain.

## Remaining SB-fix-2 scope

**Closure documentation only — no further P-path items.** All partial-depth items are
adjudicated; all decisions are recorded in `audit_d_review.sb_fix_2` (or inline for the
4 cross-source items). Anything left is write-up / PLAN refresh, not content adjudication.

## Forward applicability of chapter_level_only to D1/D3/D4/D5 cleanup

The `chapter_level_only` mechanism (schema-supported, validator-aware, apply-script-tested)
generalises directly to the upcoming domain cleanups. The pattern proven across P1–P3 is
reusable as-is for any item where the Messer umbrella is correct and a Sybex chapter is the
TOC home but the specific term is unverifiable in Tier 1+2:

1. Grep the Tier 2 corpus for the term with a domain-appropriate pattern.
2. If a match **supports what the item tests** → quote-cite (verbatim, <15 words).
3. Otherwise → `chapter_level_only: true`, no quote, `partial-depth` retained.

D4 (Security Operations) and D5 (Security Program Management) are the most likely to lean on
chapter-level given how much of their vocabulary (program-management, governance, BCP/DR
metrics) lives in Sybex prose rather than glossary/index — the §3.4/§5.x P3 items
(parallel/full-interruption test, EPSS, MTD, security champions) are an early signal of that
skew.

## Files changed

- `questions.json` — 36 `audit_d_review.sb_fix_2` blocks added (P2: 20, P3: 16); zero
  content mutation.
- `.audit-working/sb-fix-2/packet-P2-decisions.json`, `packet-P3-decisions.json` — decision
  inputs (gitignored, matching prior packets).
- `Reports/Report-#0018.md` — this report.

## Commits made

- `e430368` — sb-fix-2: apply P2 packet 20 of 20 items (all §2.4 keep-with-sybex-note)
- `04d3eba` — sb-fix-2: apply P3 packet 16 of 16 items — P-path CLOSED at 56/56
- (this report committed in a follow-up)

## Boundaries honored

- Audit-only: zero content mutation, proven by content-equivalence check on both packets.
- No SM-2 / localStorage key changes; no schema changes (chapter_level_only already shipped
  in P1).
- Validator + build green pre- and post-write on both packets.
- Idempotency clean (0 skipped) — neither packet had been previously applied.
- Event-log NDJSON emitted for both runs per Workflow Rule #9.

## What's next

SB-fix-2 partial-depth adjudication is complete. Next decisions are Aiden's: PLAN.md refresh
to mark the P-path closed, then either resume Task 2 mode-consolidation work or open the
D1/D3/D4/D5 citation cleanup (where chapter_level_only carries forward).
