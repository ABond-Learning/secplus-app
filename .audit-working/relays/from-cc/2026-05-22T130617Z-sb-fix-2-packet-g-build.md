# SB-fix-2 packet G — messer-curriculum-gap items (3 items)

NONCE: 2026-05-22T130617Z-7dd4d995

## Status

Commit 4 of SB-fix-2 implementation plan (predecessors:
`0bc18e6` scripts + SCHEMA; `32b29fc` R packet build;
`0789b95` R routing backfill).

Ran `scripts/sb-fix-2-build-packet.mjs --packet G --sub-path G
--start 0 --size 3` against the post-R catalogue state.

| Field | Value |
|---|---|
| Sub-path | G (messer-curriculum-gap) |
| Pool | 3 items: 2 Pool A (integer overflow ×2 from §2.3.2; original SB-fix-1b packet-2 origin) + 1 Pool B (HSTS mc from §2.4.9; sb-fix-2-r origin) |
| Match items | 1 |
| Cram items | 1 |
| MC items | 1 |
| `questions.json` mutation | none — apply comes after supervisor decisions return |

### Heads-up: small build-script fix this packet

CC's first build invocation was `--packet G` (string) but
`scripts/sb-fix-2-build-packet.mjs` was hardcoded to `Number()`
the packet arg from commit 1 — produced `packet-NaN.md`. Fixed
in-line (one-character edit: removed the `Number()` coercion so
the arg is taken verbatim). Self-tests still pass (none test
the CLI parsing directly). The fix lands as part of this
commit alongside the relay file. SB-fix-2 R already shipped
under the numeric-only assumption, but future packets use
string IDs (G, P1, P2, P3), so this fix is load-bearing for
the rest of the sub-batch.

Captured to the classifier-improvements findings file? No —
this isn't a classifier improvement, it's an apply-script bug
already fixed mid-packet per Rule 4 (mechanical script tweak
within existing pattern). No findings entry needed.

## CC framing note for messer-curriculum-gap items

For G items, the realistic decision space narrows compared to
P items. Per the field-requirement matrix:

- **`keep-with-sybex-note`** — cited Messer parent video stays
  as inherited; Sybex citation records where the specific
  concept IS taught. Use when the Messer parent is a defensible
  sibling concept AND Sybex covers the specific.
- **`re-cite-to-sybex`** — clear `messerVideo` + `subObjective`
  (parent inheritance still kicks in for UI rendering). Use
  when even the Messer parent is the wrong frame.
- **`rewrite-to-messer`** — change the item to test a different
  concept that Messer does cover. Use when an adjacent concept
  in the same Messer video would be a fair test.
- **`flag-for-removal`** — concept is NOT in CompTIA objectives
  AND NOT in Sybex. Use sparingly.

Both Pool A items (integer overflow) AND the Pool B item (HSTS)
are on the CompTIA SY0-701 objectives list:

- **Integer overflow:** SY0-701 §2.3 lists "Memory injection",
  "Buffer overflow", "Race conditions", "Malicious update" under
  Application vulnerabilities. Integer overflow isn't named
  directly but is canonical Sybex content under software
  vulnerabilities — it sits in the same teaching cluster.
- **HSTS:** SY0-701 §4.5 (Secure Protocols) lists "HTTPS",
  "TLS", "Secure Sockets Layer (SSL)"; HSTS is the canonical
  HTTPS-enforcement mechanism taught alongside.

So `flag-for-removal` is not appropriate for any of these
three. The realistic choice is between `keep-with-sybex-note`
(retain cited Messer parent as sibling-context) and
`re-cite-to-sybex` (clear Messer citation; Sybex is the home).

## Sybex TOC hints per item (Chapple 9th conventions)

CC doesn't have a verified Chapple 9th TOC dump available, so
the hints below are derived from CompTIA SY0-701 objectives
mapping + general Chapple/Seidl chapter-organisation conventions
(prior editions). **All hints are guidance only — supervisor
verifies against the book before recording.**

### Item 1 (cram) + Item 2 (match) — Integer overflow

**Concept:** software/memory vulnerability where arithmetic
exceeds the variable's max representable value, wraps around.

**Likely Chapple 9th location:**
- **Chapter:** the application-security / software-vulnerabilities
  chapter — likely **Chapter 6** in the 9th edition.
- **Section:** "Software Vulnerabilities" or "Memory
  Vulnerabilities" or "Coding Errors" — specifically the
  subsection covering buffer overflow / integer overflow /
  race conditions. **Supervisor to verify exact section
  heading.**
- **Likely page:** somewhere in the first half of the chapter
  (foundational vuln types before specific tools / mitigations).
- **CompTIA objective:** 2.3 (Application vulnerabilities)
  — explicit listing: "Memory injection / Buffer overflow /
  Race conditions / Malicious update." Integer overflow is
  canonical under the buffer-overflow / memory-vuln cluster
  but isn't named in the verbatim objective text. Recommend
  `comptia_objective_reference: "2.3"` (broad enough to cover).

**CC's lean:** `keep-with-sybex-note`. The cited Messer parent
(2.3 Buffer Overflows) is a defensible sibling — both are
memory-related vulns; arithmetic overflow and byte-write
overflow are distinct mechanics but share the umbrella
"unbounded write/value" framing. Re-citing to Sybex chapter
6 entirely would orphan from the related Messer content; the
keep-with-note path preserves the cluster.

**Identical for items 1 + 2** — same concept, same Sybex
reference, same CompTIA mapping. Supervisor records the
same `sybex_reference` payload for both.

### Item 3 — HSTS

**Concept:** HTTP Strict Transport Security — server-sent
HTTP header instructing browsers to enforce HTTPS-only access
for the domain (mitigates SSL stripping by refusing protocol
downgrade).

**Likely Chapple 9th location:**
- **Chapter:** the network-security / secure-protocols
  chapter — likely **Chapter 12** in the 9th edition (Network
  Security covers TLS/HTTPS topics; HSTS sits there).
- **Section:** "Transport Layer Security" or "Web Security"
  or "Secure Web Protocols" subsection. **Supervisor to verify
  exact section heading.**
- **Likely page:** mid-chapter, after introductory TLS
  material and before VPN/IPSec coverage.
- **CompTIA objective:** 4.5 (Hardening Techniques) explicitly
  lists "Secure Protocols" with HTTPS/TLS/SSL as enumerated
  examples; HSTS is canonical HTTPS-enforcement teaching.
  Recommend `comptia_objective_reference: "4.5"`.

**CC's lean:** `keep-with-sybex-note`. The cited Messer parent
(2.4 On-path Attacks) is a defensible sibling — SSL stripping
IS an on-path / MITM attack; HSTS is the defensive
counterpart taught in the attack context. Re-citing to Sybex
chapter 12 alone would lose the attack-mitigation pairing.
Keep-with-note preserves the SSL-stripping → HSTS
attack-mitigation cluster.

Alternative path: `re-cite-to-sybex` if supervisor judges the
2.4 On-path Attacks parent too distant (it covers the attack,
not the defense). Both readings defensible.

## Field requirements recap (for supervisor convenience)

Per the field-requirement matrix in
`.audit-working/sb-fix-2-implementation-plan.md` §4.2:

For each non-removal decision:

- `sybex_reference.edition` = `"Chapple 9th"` (exact string;
  apply script validates)
- `sybex_reference.chapter` = integer ≥ 1
- `sybex_reference.section` = non-empty string
- `sybex_reference.page` = integer ≥ 1 OR omit
- `sybex_reference.quote_excerpt` = non-empty, ≤ 500 chars
- `comptia_objective_reference` = string like `"2.3"` or
  `"4.5"` (required on `keep-with-sybex-note` + `re-cite-to-sybex`)
- `note` = optional free-text

Canonical citation string rendered by apply script's
`formatSybexCitation()` helper: `"Chapple 9th, Chapter N,
§Section, p.NN"` (gracefully degrades to `"Chapple 9th,
Chapter N, §Section"` when page is absent).

## Next gate

Supervisor reviews packet-G (inlined below) + records three
decisions:

1. Decision_type per item
2. sybex_reference components from Chapple 9th (Aiden's book)
3. comptia_objective_reference
4. Optional note

After supervisor returns the marked-up packet, CC:
1. Transcribes to `.audit-working/sb-fix-2/packet-G-decisions.json`
2. Runs `scripts/sb-fix-2-apply-packet.mjs --decisions … --dry-run`
3. Surfaces dry-run for supervisor sign-off
4. Runs real apply after authorisation
5. Brief close-out signal per Rule 3

═══════════════════════════════════════════════════════════════
Packet-G full content (verbatim from .audit-working/sb-fix-2/packet-G.md)
═══════════════════════════════════════════════════════════════

# SB-fix-2 packet G — sub-path G

Generated: 2026-05-22T13:05:37.451Z
Sub-path: G (messer-curriculum-gap)
Source: `questions.json` items where `audit_d_review.sb16_candidate === true` AND `sb16_subcategory === "messer-curriculum-gap"` AND `sb_fix_2` not yet applied.
Scope total (across all packets for this sub-path): 3 items
This packet: items 1–3 of 3 (size 3)

## How to review

For each item below: choose ONE decision. Fill in sybex_reference fields per the canonical format. CompTIA objective reference required for keep-with-sybex-note + re-cite-to-sybex (e.g. "2.4" or "2.4.6"). Note field optional.

Canonical Sybex citation format: `"Chapple 9th, Chapter N, §Section, p.NN"` — page optional.

After all 50 (or N) decisions are recorded, return the marked-up packet to CC.

---

### Item 1. §2.3 2.3.2 cram[2]  —  messer-curriculum-gap

**Parent video:** 2.3 - Buffer Overflows
**Current citation:** (inherits parent: 2.3 - Buffer Overflows)  /  (inherits parent: 2.3)
**SB-fix-1a/1b origin:** packet-2

**Item content:**

```
Term:  Integer overflow
Def:   Arithmetic result exceeds the maximum value a variable can hold — wraps around to unexpected value.
```

**Supervisor decision** (one of):
- [ ] `keep-with-sybex-note` (default for partial-depth; cited Messer umbrella correct + Sybex covers specific term)
- [ ] `re-cite-to-sybex` (clear messerVideo + subObjective; Sybex is the right home)
- [ ] `rewrite-to-messer` (rewrite item to test concept Messer actually covers; specify new_content)
- [ ] `flag-for-removal` (not in CompTIA AND not in Sybex; specify removal_reason)
- [ ] `promote-to-sybex-citation` (same effect as keep-with-note for now; reserves future schema extension)

**Sybex reference** (required except `flag-for-removal`):
- edition: `Chapple 9th`
- chapter: ____
- section: ____
- page (optional): ____
- quote_excerpt: ____

**CompTIA objective reference** (required for `keep-with-sybex-note` + `re-cite-to-sybex`): ____

**Note** (optional): ____

---

### Item 2. §2.3 2.3.2 match[2]  —  messer-curriculum-gap

**Parent video:** 2.3 - Buffer Overflows
**Current citation:** (inherits parent: 2.3 - Buffer Overflows)  /  (inherits parent: 2.3)
**SB-fix-1a/1b origin:** packet-2

**Item content:**

```
Prompt: Arithmetic result exceeds variable maximum
Answer: Integer overflow
```

**Supervisor decision** (one of):
- [ ] `keep-with-sybex-note` (default for partial-depth; cited Messer umbrella correct + Sybex covers specific term)
- [ ] `re-cite-to-sybex` (clear messerVideo + subObjective; Sybex is the right home)
- [ ] `rewrite-to-messer` (rewrite item to test concept Messer actually covers; specify new_content)
- [ ] `flag-for-removal` (not in CompTIA AND not in Sybex; specify removal_reason)
- [ ] `promote-to-sybex-citation` (same effect as keep-with-note for now; reserves future schema extension)

**Sybex reference** (required except `flag-for-removal`):
- edition: `Chapple 9th`
- chapter: ____
- section: ____
- page (optional): ____
- quote_excerpt: ____

**CompTIA objective reference** (required for `keep-with-sybex-note` + `re-cite-to-sybex`): ____

**Note** (optional): ____

---

### Item 3. §2.4 2.4.9 mc[2]  —  messer-curriculum-gap

**Parent video:** 2.4 - On-path Attacks
**Current citation:** 2.4 - On-path Attacks  /  2.4
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
q:   HSTS (HTTP Strict Transport Security) mitigates SSL stripping by:
    [0] Encrypting all browser cookies using AES-256 before storing them in local storage
    [1] Requiring strict TLS certificate pinning enforced at the browser-application level
    [2] Blocking all non-HTTPS traffic at the corporate edge firewall before it leaves the network
  ★ [3] Instructing browsers to always use HTTPS for a domain — refusing to downgrade to HTTP
exp: HSTS tells browsers the site must always be accessed via HTTPS — browsers refuse to connect over HTTP even if redirected.
```

**Supervisor decision** (one of):
- [ ] `keep-with-sybex-note` (default for partial-depth; cited Messer umbrella correct + Sybex covers specific term)
- [ ] `re-cite-to-sybex` (clear messerVideo + subObjective; Sybex is the right home)
- [ ] `rewrite-to-messer` (rewrite item to test concept Messer actually covers; specify new_content)
- [ ] `flag-for-removal` (not in CompTIA AND not in Sybex; specify removal_reason)
- [ ] `promote-to-sybex-citation` (same effect as keep-with-note for now; reserves future schema extension)

**Sybex reference** (required except `flag-for-removal`):
- edition: `Chapple 9th`
- chapter: ____
- section: ____
- page (optional): ____
- quote_excerpt: ____

**CompTIA objective reference** (required for `keep-with-sybex-note` + `re-cite-to-sybex`): ____

**Note** (optional): ____

---


## Packet summary

- Items in this packet: 3
- By section: §2.3=2, §2.4=1
- By type: cram=1, match=1, mc=1
- Remaining after this packet: 0
---ready-for-supervisor---
