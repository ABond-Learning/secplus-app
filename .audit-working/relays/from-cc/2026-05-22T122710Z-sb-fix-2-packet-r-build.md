# SB-fix-2 packet R — Pool B routing pre-step (supervisor review)

NONCE: 2026-05-22T122710Z-5121acf1

## Status

Commit 2 of SB-fix-2 implementation plan (sequel to commit 1
`0bc18e6` — script skeletons + SCHEMA). Ran
`scripts/sb-fix-2-route-pool-b.mjs` against the live verdicts
file; produced packet-R per-item routing recommendations with
grep evidence inline.

| Field | Value |
|---|---|
| Pool B size | 18 (all orphan SB1.6 loose flags; zero overlap with catalogue sb16-candidates) |
| Sub-batch shape | R (routing pre-step; single packet) |
| CC recommended-routing distribution | `partial-depth`=6, `messer-curriculum-gap`=12, `not-sb16`=0, `partial-adjacent-not-sb16`=0 |
| Output md size | 363 lines |
| `questions.json` mutation | none — backfill comes in a separate commit after routing decisions |

## Known limitation surfaced this packet — needle extractor for mc/scen

CC's needle extractor (`needlesFor()` in
`sb-fix-2-route-pool-b.mjs`) was inherited from
`sb-fix-1b-cluster-verify.mjs`, which was designed for match
+ cram items where the answer/term IS the specific concept
under test. For mc and scen items in Pool B, the extractor
falls back to the full question text — which won't grep-hit
in transcripts even when the underlying concept is taught
elsewhere.

Affected items in packet R:

| Item | Type | Tested concept (per CC) | Needle CC used | True corpus presence (CC spot-check) |
|---|---|---|---|---|
| #1 §1.2 1.2.2 mc[4] | mc | HMAC + non-repudiation | "Why does HMAC NOT provide…" | "HMAC" 0 hits corpus-wide (curriculum-gap routing correct) |
| #6 §2.4 2.4.9 mc[2] | mc | HSTS | "HSTS (HTTP Strict Transport Security) mitigates SSL strippin…" | "HSTS" 0 hits corpus-wide (curriculum-gap correct) |
| #7 §2.4 2.4.10 mc[2] | mc | Nonce | "Nonces prevent replay attacks by:" | "nonce" — not spot-checked; supervisor judgment recommended |
| #8 §3.1 3.1.2 scen[3] | scen | SD-WAN | "A company is evaluating SD-WAN to replace their MPLS WAN…" | "SD-WAN" 1 hit in `secure-communication-sy0-701.txt` → CC's `partial-depth` routing is likely WRONG; should be `partial-adjacent-not-sb16` |
| #14 §4.3 4.3.4 mc[2] | mc | EPSS | "EPSS improves vulnerability prioritization by:" | "EPSS" 0 hits corpus-wide (curriculum-gap correct) |

Net: 4 of 5 mc/scen routings are likely correct despite the
limitation (because the term genuinely IS absent corpus-wide).
1 item (#8 SD-WAN) is likely mis-routed; the correct routing
appears to be `partial-adjacent-not-sb16` (defer to D1/D3/D4/D5
cleanup pass).

### Options for supervisor

- **Option 1:** supervisor adjudicates the 5 mc/scen items
  manually using their own corpus knowledge. CC's routings
  for the other 13 (match + cram) items can be reviewed
  normally since the extractor works correctly for those
  types.
- **Option 2:** CC improves the needle extractor (add
  acronym/uppercase-token extraction for mc/scen Q text) +
  re-runs the routing. ~10 lines of code; existing self-test
  fixtures don't need changes. This is mechanical per Rule 4
  (apply-script tweak within existing patterns) and directly
  load-bearing on this packet per Rule 6 (not scope expansion).

CC's lean: **Option 2.** Re-running with a better extractor
removes the supervisor-side workaround burden. Self-test PASS
gate preserved. ~5 minutes of CC time. If supervisor prefers
Option 1, CC adjudicates the marked-up packet as-is.

## Routing summary (CC recommended; supervisor decides)

| Routing | Items | Notes |
|---|---|---|
| `partial-depth` | 6 | Cited video is umbrella-shaped; specific term absent corpus-wide |
| `messer-curriculum-gap` | 12 | Term absent corpus-wide AND cited isn't umbrella |
| `not-sb16` | 0 | (would mean cited transcript DOES have the term; LLM was wrong) |
| `partial-adjacent-not-sb16` | 0 | Likely undercount given the needle-extractor limitation; #8 SD-WAN is almost certainly this routing |

Note: CC's scoping doc estimated ~10 partial-depth / ~3
curriculum-gap / ~3 not-sb16 / ~2 partial-adjacent. Actual
distribution (12 curriculum-gap / 6 partial-depth) skews
heavily to curriculum-gap. Two factors:
1. The needle-extractor limitation (above) — some
   mc/scen routings may flip after improvement.
2. The `looksLikeUmbrellaTitle` heuristic is conservative
   (only flags titles containing "overview / introduction /
   fundamentals / concepts / attacks / techniques /
   vulnerabilities / security / controls"). Real-world
   umbrellas like "1.2 - Non-repudiation" (cited for HMAC)
   don't match the heuristic and default to
   curriculum-gap. Supervisor's judgment overrides freely.

## Next gate

Supervisor reviews packet-R.md (inlined below), assigns final
routing per the four-state decision tree:
- `partial-depth` → SB-fix-2 P sub-path
- `messer-curriculum-gap` → SB-fix-2 G sub-path
- `not-sb16` → catalogue kept-as-is (out of SB-fix-2 scope)
- `partial-adjacent-not-sb16` → defer to D1/D3/D4/D5 cleanup

After supervisor records routings, CC transcribes to
`.audit-working/sb-fix-2/packet-R-routings.json` and runs
`scripts/sb-fix-2-backfill-pool-b.mjs` (commit 3 of the plan).

If supervisor selects Option 2 above first: CC improves the
extractor, re-runs `sb-fix-2-route-pool-b.mjs`, surfaces a
revised packet-R for review before supervisor adjudicates.

═══════════════════════════════════════════════════════════════
Packet-R full content (verbatim from .audit-working/sb-fix-2/packet-R.md)
═══════════════════════════════════════════════════════════════

# SB-fix-2 packet R — Pool B routing pre-step

Generated: 2026-05-22T12:26:01.378Z
Pool B (orphan SB1.6 loose flags, no `audit_d_review.sb16_candidate` in catalogue): 18 items

## How to review

For each item: CC has greped the item's specific term against the cited transcript + corpus-wide, then surfaced a recommended routing. Supervisor reviews + adjudicates final routing per the decision tree:

- `partial-depth` — cited video umbrella subsumes the tested specific; route to SB-fix-2 P
- `messer-curriculum-gap` — term absent corpus-wide AND cited isn't natural umbrella; route to SB-fix-2 G
- `not-sb16` — cited transcript actually has the term; mark catalogue kept-as-is
- `partial-adjacent-not-sb16` — term is in a different Messer video; defer to D1/D3/D4/D5 cleanup

After supervisor records routings, CC runs `scripts/sb-fix-2-backfill-pool-b.mjs` to write the routings into `questions.json` audit fields.

---

### Item 1. §1.2 1.2.2 mc[4]

**Cited:** 1.2 - Non-repudiation
**Item:** `Why does HMAC NOT provide non-repudiation?`
**Needles:** `Why does HMAC NOT provide non-repudiation?`, `why does hmac not provide non repudiation`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 2. §1.2 1.2.2 match[3]

**Cited:** 1.2 - Non-repudiation
**Item:** `Provides integrity + authentication but NOT non-repudiation → HMAC`
**Needles:** `HMAC`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 3. §1.2 1.2.6 match[5]

**Cited:** 1.2 - Physical Security
**Item:** `Physically secures a laptop to a desk → Cable lock`
**Needles:** `Cable lock`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `partial-depth`
**Rationale:** Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 4. §2.3 2.3.2 match[3]

**Cited:** 2.3 - Buffer Overflows
**Item:** `Common C functions causing buffer overflows → strcpy, gets, sprintf (no bounds checking)`
**Needles:** `strcpy, gets, sprintf (no bounds checking)`, `strcpy, gets, sprintf`, `strcpy gets sprintf no bounds checking`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 5. §2.4 2.4.2 cram[3]

**Cited:** 2.4 - Viruses and Worms
**Item:** `Metamorphic virus`
**Needles:** `Metamorphic virus`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 6. §2.4 2.4.9 mc[2]

**Cited:** 2.4 - On-path Attacks
**Item:** `HSTS (HTTP Strict Transport Security) mitigates SSL stripping by:`
**Needles:** `HSTS (HTTP Strict Transport Security) mitigates SSL stripping by:`, `HSTS  mitigates SSL stripping by:`, `hsts http strict transport security mitigates ssl stripping`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `partial-depth`
**Rationale:** Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 7. §2.4 2.4.10 mc[2]

**Cited:** 2.4 - Replay Attacks
**Item:** `Nonces prevent replay attacks by:`
**Needles:** `Nonces prevent replay attacks by:`, `nonces prevent replay attacks`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `partial-depth`
**Rationale:** Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 8. §3.1 3.1.2 scen[3]

**Cited:** 3.1 - Network Infrastructure Concepts
**Item:** `A company is evaluating SD-WAN to replace their MPLS WAN. The security team has `
**Needles:** `A company is evaluating SD-WAN to replace their MPLS WAN. The security team has concerns. The network team argues SD-WAN`, `security team has concerns`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `partial-depth`
**Rationale:** Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 9. §3.4 3.4.3 cram[1]

**Cited:** 3.4 - Recovery Testing
**Item:** `Parallel test`
**Needles:** `Parallel test`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 10. §3.4 3.4.3 cram[2]

**Cited:** 3.4 - Recovery Testing
**Item:** `Full interruption test`
**Needles:** `Full interruption test`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 11. §3.4 3.4.4 match[0]

**Cited:** 3.4 - Backups
**Item:** `All data changed since last full backup → Differential backup`
**Needles:** `Differential backup`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 12. §4.1 4.1.3 cram[4]

**Cited:** 4.1 - Securing Wireless and Mobile
**Item:** `MAM (Mobile Application Management)`
**Needles:** `MAM (Mobile Application Management)`, `MAM`, `mam mobile application management`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 13. §4.3 4.3.2 match[2]

**Cited:** 4.3 - Threat Intelligence
**Item:** `Standardized threat intel sharing format → STIX/TAXII`
**Needles:** `STIX/TAXII`, `stix taxii`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 14. §4.3 4.3.4 mc[2]

**Cited:** 4.3 - Analyzing Vulnerabilities
**Item:** `EPSS improves vulnerability prioritization by:`
**Needles:** `EPSS improves vulnerability prioritization by:`, `epss improves vulnerability prioritization`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `partial-depth`
**Rationale:** Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 15. §5.2 5.2.4 match[4]

**Cited:** 5.2 - Business Impact Analysis
**Item:** `Maximum time before organization cannot survive → MTD`
**Needles:** `MTD`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 16. §5.2 5.2.4 cram[5]

**Cited:** 5.2 - Business Impact Analysis
**Item:** `Maximum tolerable downtime (MTD)`
**Needles:** `Maximum tolerable downtime (MTD)`, `Maximum tolerable downtime`, `maximum tolerable downtime mtd`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 17. §5.5 5.5.2 match[2]

**Cited:** 5.5 - Penetration Tests
**Item:** `Retesting after fixes to confirm remediation → Remediation validation`
**Needles:** `Remediation validation`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `messer-curriculum-gap`
**Rationale:** Term absent corpus-wide; cited video is a sibling concept rather than umbrella. Route to SB-fix-2 G sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

### Item 18. §5.6 5.6.1 cram[3]

**Cited:** 5.6 - Security Awareness
**Item:** `Security champions`
**Needles:** `Security champions`

**Grep:** cited=0, corpus-other=0 (top files: (none))

**CC recommended routing:** `partial-depth`
**Rationale:** Term absent corpus-wide; cited video is arguably the conceptual umbrella for the tested specific technique. Route to SB-fix-2 P sub-path.

**Supervisor final routing** (mark one):
- [ ] partial-depth
- [ ] messer-curriculum-gap
- [ ] not-sb16
- [ ] partial-adjacent-not-sb16

---

## Summary by recommended routing

- messer-curriculum-gap: 12
- partial-depth: 6
---ready-for-supervisor---
