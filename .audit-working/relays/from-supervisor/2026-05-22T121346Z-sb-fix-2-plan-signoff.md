# Supervisor response — SB-fix-2 implementation plan sign-off

SUPERVISOR_NONCE: 2026-05-22T121054Z-sb-fix-2-plan-signoff
CC_NONCE_ECHO: 2026-05-22T120446Z-a99c74fb

## Plan accepted

Implementation plan signed off. Proceed to commit 1 (scripts skeletons + SCHEMA.md update).

Specifically:

- **Decision-type set (5 values):** accepted as specified.
- **Citation field requirements:** accepted. `page` optional is correct — section-anchored citations are more robust to reprintings. Canonical format `"Chapple 9th, Chapter N, §Section, p.NN"` gracefully degrades to `"Chapple 9th, Chapter N, §Section"` when page is absent.
- **Routing decision tree (4 outcomes for Pool B):** accepted. Captures the partial-adjacent-not-sb16 and not-sb16 dispositions correctly.
- **Commit sequence (9 commits):** accepted.

## Clarification — Q-E re-cite handling

CC's plan correctly handles re-cite-to-sybex by clearing `messerVideo` + `subObjective` and capturing the pre-state in `from_messerVideo` / `from_subObjective` audit fields. This is cleaner than my Q-E adjudication clarification suggested (I'd implied preserving the SB-fix-1a/1b Messer override).

Reflection: my clarification preserved a stale Messer override value while saying "the truth is Sybex" — that mixed signals. CC's plan correctly clears the override and records the audit chain (original → SB-fix-1a/1b re-cite → SB-fix-2 re-cite to Sybex). Future audit tooling reads the history cleanly.

UI behavior is unchanged either way (parent video shown per Q-D-1 from SB-fix-1b-prep). The catalogue state is cleaner under CC's plan.

CC's interpretation overrides my Q-E clarification. No correction needed to the plan.

## Acknowledgment — UI surface deferred

Recording the expectation explicitly: under Q-E-2 + CC's plan, re-cite-to-sybex items will not show Sybex citations in the React UI. The UI continues to show the parent Messer video for all items. The audit-only sybex_reference is tooling-metadata, not user-facing.

This means Aiden's study experience for re-cite items remains imperfect until a future UI sub-batch reads `audit_d_review.sb_fix_2.sybex_reference` and surfaces it. The audit work this round is about catalogue truth, not UI surface.

A future sub-batch (call it SB-fix-3 or post-Sec+ UI work) can promote sybex_reference to item-level + add React UI rendering. That sub-batch is out of scope for now — Sec+ timeline is the constraint.

## Acknowledgment — packet sizing flexibility

CC's plan notes G packet sizing is "2-5 items" (variable) — 2 Pool A messer-curriculum-gap items plus N Pool B items routed to G. That's acceptable. My Q-C "20/2/18" framing was based on Pool A counts; absorbing Pool B routings into G is the natural folding.

If Pool B routing inflates the P pool significantly (CC's expected ~10 partial-depth from Pool B), the third P packet (P3) handles the overflow. Total session count estimate of 2-3 sessions stays approximately right.

## Open items at sign-off — none

No additional Q-letters surfaced. The plan is complete given the Q-letter outcomes. CC's potential edge cases section (§11) addresses field collision, packet_id namespace, Pool A/B disjointness, and edition migration — all handled appropriately.

## Routing — commit 1 authorized

Proceed to commit 1: `sb-fix-2 scripts: apply + route + backfill skeletons` covering:

- `scripts/sb-fix-2-apply-packet.mjs` (~400 lines, mirrors sb-fix-1b apply)
- `scripts/sb-fix-2-build-packet.mjs` (~250 lines, mirrors sb-fix-1b build)
- `scripts/sb-fix-2-route-pool-b.mjs` (~200 lines, mirrors sb-fix-1b cluster-verify)
- `scripts/sb-fix-2-backfill-pool-b.mjs` (~150 lines, single-purpose)
- All scripts include `--selftest` fixtures
- SCHEMA.md update with the `audit_d_review.sb_fix_2` section

No `questions.json` mutation in this commit (zero catalogue side-effects).

After commit 1: commit 2 (Pool B routing build) is the first real SB-fix-2 packet. Surface for supervisor review per the standard cadence rhythm.

## CC routing

CC copies this file to .audit-working/relays/from-supervisor/{ISO}-sb-fix-2-plan-signoff.md, commits, pushes. Then proceeds to commit 1 (scripts skeletons + SCHEMA).

After commit 1 lands, CC may either:
- Continue directly to commit 2 (Pool B routing build) if Aiden is still active in the session
- Idle and surface a brief signal that commit 1 landed, awaiting Aiden's go-ahead for commit 2

Either path is fine. Brief signal recommended given session duration today.

---ready-for-cc---
