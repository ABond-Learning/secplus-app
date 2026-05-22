# SB-fix-1b packet 4 — dry-run preview for sign-off (closes SB-fix-1b)

NONCE: 2026-05-22T114112Z-22d0551f

## Status

34 supervisor decisions transcribed to
`.audit-working/sb-fix-1b/packet-4-decisions.json`. Dry-run
executed; validator clean (no new issues). All `accept-primary`
items have non-empty shadow `parsed_destinations` — no
#52-style conversion needed this packet.

| Field | Value |
|---|---|
| Decisions in packet | 34 |
| Actions resolved | 34 |
| Skipped (already applied) | 0 |
| Edits | 20 |
| sb16-candidates (partial-depth) | 14 |
| Self-alternate / reject / defer | 0 / 0 / 0 |
| Pre-state SHA256 | `ce2d62a803c5e2e321da3db8dafea45de39e6c34eae62c2f2cb292a5ca590a3a` (matches packet 3 post-state) |
| Post-state SHA256 | `83db0c1297208e65cb67d0a3067e7d5e30ce1e6002bff9518330854f32298f93` |
| Changed | YES |
| Validator (pre and post) | 0 errors, 5 warns (4 best-most-short-distractor + 1 spelling-re), 0 info — pre-existing baseline, unchanged |
| Decision-type tally | 7 accept-primary + 1 accept-alternate + 12 manual + 14 keep-as-is-sb16-candidate = 34 |

## What lands

Closes SB-fix-1b at **134/134 items shipped** (100 prior + 34
here). Cumulative across packets 1–4:

| Packet | Items | Range | Commit |
|---|---|---|---|
| 1 | 25 | #1–#25 | `c252fa1` |
| 2 | 25 | #26–#50 | `87b566e` |
| 3 | 50 | #51–#100 | `a77ef4e` |
| 4 (this) | 34 | #101–#134 | _pending_ |
| **Total** | **134** | | |

## Cluster-view rollup (parent video → destination)

| Source parent | Destination | Items |
|---|---|---|
| 2.4 - On-path Attacks | 4.5 - Secure Protocols | #101, #104 (HSTS) |
| 2.4 - On-path Attacks | 2.4 - Cryptographic Attacks | #103 (SSL stripping — corpus-evidence override of packet 3 #100 precedent; backlog entry added) |
| 2.4 - Replay Attacks | 1.4 - Encryption Technologies | #106 (Nonce) |
| 2.4 - Malicious Code | 2.4 - Application Attacks | #107, #110 (Web shell) |
| 2.4 - Malicious Code | 2.4 - Other Malware Types | #108, #111 (Living off the land) |
| 2.4 - Malicious Code | 2.4 - An Overview of Malware | #109, #112 (Dropper) |
| 2.4 - Cryptographic Attacks | 2.4 - Password Attacks | #118, #121 (Rainbow table) |
| 2.4 - Cryptographic Attacks | 4.6 - Password Security | #119, #122 (Key stretching) |
| 2.5 - Segmentation and Access Control | 3.2 - Secure Infrastructures | #127, #130 (DMZ) |
| 2.5 - Segmentation and Access Control | 3.1 - Network Infrastructure Concepts | #128, #131 (Air gap) |
| 2.5 - Segmentation and Access Control | 1.2 - Zero Trust | #129, #132 (Microsegmentation) |

Plus 14 sb16-candidates (no edit, flagged for SB-fix-2 with
`sb16_subcategory=partial-depth`):

- BGP hijacking: #102, #105
- IDOR: #113, #115
- SSRF: #114, #116
- POODLE: #117, #120
- Credential stuffing: #123, #126
- Pass-the-hash: #124
- Hybrid attack: #125
- Secure boot: #133, #134

## Items requiring no flag (none this packet)

Unlike packet 3 (3 flagged: #52 conversion, #56/#58 title
verification, tally arithmetic), packet 4 has no flags:

- All 7 accept-primary items have non-empty shadow
  destinations (verified during transcription).
- Supervisor's tally arithmetic verified (20 + 14 = 34 ✓).
- Cross-packet inconsistency on SSL stripping (#100 vs #103)
  is captured per Rule 6 in
  `.audit-working/sb-fix-1b/cross-packet-inconsistencies.md`
  — no retroactive revision this packet.
- #134 supervisor noted "CC verify '3.1 - Infrastructure
  Considerations' exists" — CC confirmed it does exist in
  `MESSER_VIDEOS.md`, but it's the *rejected* parser primary,
  not the kept destination. #134 keeps-as-is (citation
  inherits from parent 2.5 Hardening Techniques) so no video
  title needs to be applied. Non-issue.

## Validator detail

Pre-apply state: 5 warns (4 best-most-short-distractor + 1
spelling-re), 0 errors. Post-dry-run state: identical 5
warns, 0 errors. Same items as packet 3's baseline — none
touched by packets 3 or 4.

## Authorisation requested

Supervisor decision: **authorise real apply?**

If yes: respond with brief authorisation. CC will then:

1. Run `scripts/sb-fix-1b-apply-packet.mjs --decisions .audit-working/sb-fix-1b/packet-4-decisions.json` (no --dry-run).
2. Commit with conventional message:
   `SB-fix-1b packet 4/6: 20 D2 PA match/cram re-citations + 14 sb16-candidates (closes SB-fix-1b at 134/134)`.
3. Push to origin.
4. Brief docs-sync commit (PLAN.md + supervisor-handoff.md)
   marking SB-fix-1b complete at 134/134, identifying
   next-session opener (SB-fix-2 vs weakness-tracker — Aiden's
   call).
5. Surface end-of-packet brief signal per Rule 3 (validator
   clean → close out brief; full relay only if non-clean).

═══════════════════════════════════════════════════════════════
Full dry-run preview (verbatim)
═══════════════════════════════════════════════════════════════

```
Running validator against temp tree...
Validator results: 5 issues
  errors: 0
  warns:  5
  info:   0

By code:
      4  best-most-short-distractor
      1  spelling-re
Validator exit: 0

=== SB-fix-1b apply DRY-RUN — packet-4 ===
Decisions in packet: 34
Actions resolved:    34
Skipped (already applied): 0

Per-item diff:
  #101 §2.4 2.4.9 cram[3]  "HSTS (HTTP Strict Transport Security)"  EDIT  manual
      from: (inherits parent: 2.4 - On-path Attacks)
      to:   "4.5 - Secure Protocols" / 4.5
  #102 §2.4 2.4.9 cram[4]  "BGP hijacking"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #103 §2.4 2.4.9 match[2]  "SSL stripping"  EDIT  manual
      from: (inherits parent: 2.4 - On-path Attacks)
      to:   "2.4 - Cryptographic Attacks" / 2.4
  #104 §2.4 2.4.9 match[3]  "HSTS"  EDIT  accept-primary
      from: (inherits parent: 2.4 - On-path Attacks)
      to:   "4.5 - Secure Protocols" / 4.5
  #105 §2.4 2.4.9 match[4]  "BGP hijacking"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #106 §2.4 2.4.10 cram[3]  "Nonce"  EDIT  manual
      from: (inherits parent: 2.4 - Replay Attacks)
      to:   "1.4 - Encryption Technologies" / 1.4
  #107 §2.4 2.4.11 cram[0]  "Web shell"  EDIT  manual
      from: (inherits parent: 2.4 - Malicious Code)
      to:   "2.4 - Application Attacks" / 2.4
  #108 §2.4 2.4.11 cram[2]  "Living off the land (LOLBins)"  EDIT  manual
      from: (inherits parent: 2.4 - Malicious Code)
      to:   "2.4 - Other Malware Types" / 2.4
  #109 §2.4 2.4.11 cram[3]  "Dropper"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Malicious Code)
      to:   "2.4 - An Overview of Malware" / 2.4
  #110 §2.4 2.4.11 match[0]  "Web shell"  EDIT  manual
      from: (inherits parent: 2.4 - Malicious Code)
      to:   "2.4 - Application Attacks" / 2.4
  #111 §2.4 2.4.11 match[2]  "Living off the land (LOLBins)"  EDIT  manual
      from: (inherits parent: 2.4 - Malicious Code)
      to:   "2.4 - Other Malware Types" / 2.4
  #112 §2.4 2.4.11 match[3]  "Dropper"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Malicious Code)
      to:   "2.4 - An Overview of Malware" / 2.4
  #113 §2.4 2.4.12 cram[2]  "IDOR (Insecure Direct Object Reference)"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #114 §2.4 2.4.12 cram[3]  "SSRF (Server-Side Request Forgery)"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #115 §2.4 2.4.12 match[2]  "IDOR (Insecure Direct Object Reference)"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #116 §2.4 2.4.12 match[3]  "SSRF (Server-Side Request Forgery)"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #117 §2.4 2.4.13 cram[2]  "POODLE"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #118 §2.4 2.4.13 cram[3]  "Rainbow table"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Cryptographic Attacks)
      to:   "2.4 - Password Attacks" / 2.4
  #119 §2.4 2.4.13 cram[4]  "Key stretching"  EDIT  accept-alternate
      from: (inherits parent: 2.4 - Cryptographic Attacks)
      to:   "4.6 - Password Security" / 4.6
  #120 §2.4 2.4.13 match[2]  "POODLE attack"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #121 §2.4 2.4.13 match[3]  "Rainbow table"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Cryptographic Attacks)
      to:   "2.4 - Password Attacks" / 2.4
  #122 §2.4 2.4.13 match[4]  "Key stretching (bcrypt, PBKDF2)"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Cryptographic Attacks)
      to:   "4.6 - Password Security" / 4.6
  #123 §2.4 2.4.14 cram[1]  "Credential stuffing"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #124 §2.4 2.4.14 cram[2]  "Pass-the-hash"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #125 §2.4 2.4.14 cram[3]  "Hybrid attack"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #126 §2.4 2.4.14 match[1]  "Credential stuffing"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #127 §2.5 2.5.1 cram[2]  "DMZ (Demilitarized Zone)"  EDIT  manual
      from: (inherits parent: 2.5 - Segmentation and Access Control)
      to:   "3.2 - Secure Infrastructures" / 3.2
  #128 §2.5 2.5.1 cram[3]  "Air gap"  EDIT  manual
      from: (inherits parent: 2.5 - Segmentation and Access Control)
      to:   "3.1 - Network Infrastructure Concepts" / 3.1
  #129 §2.5 2.5.1 cram[5]  "Microsegmentation"  EDIT  manual
      from: (inherits parent: 2.5 - Segmentation and Access Control)
      to:   "1.2 - Zero Trust" / 1.2
  #130 §2.5 2.5.1 match[0]  "DMZ / screened subnet"  EDIT  manual
      from: (inherits parent: 2.5 - Segmentation and Access Control)
      to:   "3.2 - Secure Infrastructures" / 3.2
  #131 §2.5 2.5.1 match[2]  "Air gap"  EDIT  manual
      from: (inherits parent: 2.5 - Segmentation and Access Control)
      to:   "3.1 - Network Infrastructure Concepts" / 3.1
  #132 §2.5 2.5.1 match[4]  "Microsegmentation"  EDIT  accept-primary
      from: (inherits parent: 2.5 - Segmentation and Access Control)
      to:   "1.2 - Zero Trust" / 1.2
  #133 §2.5 2.5.3 cram[2]  "Secure boot"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #134 §2.5 2.5.3 match[1]  "Secure Boot"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)

Summary by action type:
  edit                          : 20
  kept-as-is (self-alternate)   : 0
  kept-as-is (reject)           : 0
  sb16-candidate                : 14

Cluster-view rollup (source parent → destination):
  2.4 - Cryptographic Attacks  →  2.4 - Password Attacks  (2 items)
    - #118 cram[3]  "Rainbow table"
    - #121 match[3]  "Rainbow table"
  2.4 - Cryptographic Attacks  →  4.6 - Password Security  (2 items)
    - #119 cram[4]  "Key stretching"
    - #122 match[4]  "Key stretching (bcrypt, PBKDF2)"
  2.4 - Malicious Code  →  2.4 - An Overview of Malware  (2 items)
    - #109 cram[3]  "Dropper"
    - #112 match[3]  "Dropper"
  2.4 - Malicious Code  →  2.4 - Application Attacks  (2 items)
    - #107 cram[0]  "Web shell"
    - #110 match[0]  "Web shell"
  2.4 - Malicious Code  →  2.4 - Other Malware Types  (2 items)
    - #108 cram[2]  "Living off the land (LOLBins)"
    - #111 match[2]  "Living off the land (LOLBins)"
  2.4 - On-path Attacks  →  2.4 - Cryptographic Attacks  (1 item)
    - #103 match[2]  "SSL stripping"
  2.4 - On-path Attacks  →  4.5 - Secure Protocols  (2 items)
    - #101 cram[3]  "HSTS (HTTP Strict Transport Security)"
    - #104 match[3]  "HSTS"
  2.4 - Replay Attacks  →  1.4 - Encryption Technologies  (1 item)
    - #106 cram[3]  "Nonce"
  2.5 - Segmentation and Access Control  →  1.2 - Zero Trust  (2 items)
    - #129 cram[5]  "Microsegmentation"
    - #132 match[4]  "Microsegmentation"
  2.5 - Segmentation and Access Control  →  3.1 - Network Infrastructure Concepts  (2 items)
    - #128 cram[3]  "Air gap"
    - #131 match[2]  "Air gap"
  2.5 - Segmentation and Access Control  →  3.2 - Secure Infrastructures  (2 items)
    - #127 cram[2]  "DMZ (Demilitarized Zone)"
    - #130 match[0]  "DMZ / screened subnet"

Pre-state SHA256: ce2d62a803c5e2e321da3db8dafea45de39e6c34eae62c2f2cb292a5ca590a3a
Post-state SHA256: 83db0c1297208e65cb67d0a3067e7d5e30ce1e6002bff9518330854f32298f93
Changed: YES

DRY-RUN: no files written. Temp tree retained at: /home/abond/projects/secplus-app/.audit-working/sb-fix-1b/.questions-temp.json
```

---ready-for-supervisor---
