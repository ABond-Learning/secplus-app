# SB-fix-1b packet 3 — dry-run preview for sign-off

NONCE: 2026-05-22T111105Z-0d3c10b8

## Status

50 supervisor decisions transcribed to `.audit-working/sb-fix-1b/packet-3-decisions.json`. Dry-run executed via `scripts/sb-fix-1b-apply-packet.mjs --decisions … --dry-run`. Validator clean (no new issues introduced).

| Field | Value |
|---|---|
| Decisions in packet | 50 |
| Actions resolved | 50 |
| Skipped (already applied) | 0 |
| Edits | 36 |
| sb16-candidates (partial-depth) | 14 |
| Self-alternate / reject / defer | 0 / 0 / 0 |
| Pre-state SHA256 | `2ae38e6b53a5daa82cd9bd8155c775df665247c58b89854645fff15784a9b6f5` |
| Post-state SHA256 | `38a971f2b406563e9bb4d6bbab6efa34acc6d7a81cc48ff00366489b425d643c` |
| Changed | YES |
| Validator (pre and post) | 0 errors, 5 warns (4 best-most-short-distractor + 1 spelling-re), 0 info — pre-existing baseline, no new issues |
| Decision-type tally | 17 accept-primary + 3 accept-alternate + 16 manual + 14 keep-as-is-sb16-candidate = 50 |

## Items flagged for supervisor confirmation

Three items need supervisor sign-off before real apply. Each has been transcribed in the decisions JSON with my reasoning recorded inline; if any conflicts with intent, send a corrected response. Otherwise authorise real apply.

### Flag 1 — Item #52 conversion: accept-primary → manual (same destination)

Supervisor wrote `accept primary destination` for #52 with rationale "Parser primary 3.1 Cloud Infrastructures; precedent confirms." However the build script's shadow JSON shows `parsed_destinations: []` for #52 — the LLM's justification didn't quote a parseable video title for this item, so the parser yielded none. The apply script's accept-primary path requires shadow.parsed_destinations[0] and errored out.

Resolution: converted to `manual` with `to_messerVideo: "3.1 - Cloud Infrastructures"`, `to_subObjective: "3.1"`. Same destination supervisor's reasoning paragraph pointed at (cross-packet hint from SB-fix-1b packet 2 #50). Semantically identical effect.

This is one of 23 items in packet 3 with empty parser destinations. Supervisor's other "accept primary" calls (#53, #54, #57, #59, etc.) all had non-empty parser destinations and applied cleanly.

### Flag 2 — Items #56 + #58 destination: "3.3 - States of Data" (not "3.3 - Protecting Data")

Supervisor wrote `manual: "3.3 - Protecting Data" / 3.3` for both items but the reasoning paragraph says "states-of-data transcript IS where data sovereignty is actually taught" and asked CC to verify. CC checked `MESSER_VIDEOS.md` — both videos exist under §3.3 ("Protecting Data" and "States of Data"). The classifier corpus hits for "Data sovereignty" landed in `states-of-data-sy0-701.txt` (×3). Both transcript evidence and supervisor's own reasoning point at "States of Data."

Transcribed with `to_messerVideo: "3.3 - States of Data"` for both #56 and #58. If supervisor intended "3.3 - Protecting Data" literally (overriding their own reasoning paragraph), respond and CC will re-do.

### Flag 3 — Supervisor tally arithmetic (no item action implied)

Supervisor's tally at the bottom of the decisions file says:

> 50 items reviewed:
> - 23 re-cites (mix of accept-primary, accept-alternate, manual)
> - 13 sb16-candidates

23 + 13 = 36, not 50. CC's per-item parse gives 17 accept-primary + 3 accept-alternate + 16 manual + 14 keep-as-is-sb16-candidate = 50. Per-item decisions in the doc body are unambiguous; the tally line summary is the only arithmetic that's off. Surfacing for awareness; no item-level action implied.

## Cluster-view rollup (parent video → destination)

| Source parent | Destination | Items | Indexes |
|---|---|---|---|
| 2.3 - Virtualization Vulnerabilities | 3.1 - Cloud Infrastructures | 3 | #51, #52, #53 |
| 2.3 - Cloud-specific Vulnerabilities | 3.1 - Cloud Infrastructures | 3 | #54, #55, #57 |
| 2.3 - Cloud-specific Vulnerabilities | 3.3 - States of Data | 2 | #56, #58 |
| 2.3 - Misconfiguration Vulnerabilities | 1.4 - Encryption Technologies | 1 | #59 |
| 2.3 - Misconfiguration Vulnerabilities | 4.5 - Secure Protocols | 1 | #60 |
| 2.3 - Mobile Device Vulnerabilities | 2.2 - Other Social Engineering Attacks | 2 | #61, #63 |
| 2.3 - Mobile Device Vulnerabilities | 2.4 - Wireless Attacks | 2 | #62, #64 |
| 2.3 - Zero-day Vulnerabilities | 5.5 - Penetration Tests | 2 | #65, #66 |
| 2.4 - An Overview of Malware | 2.4 - Viruses and Worms | 2 | #67, #70 |
| 2.4 - An Overview of Malware | 2.4 - Denial of Service | 2 | #68, #71 |
| 2.4 - An Overview of Malware | 2.4 - Indicators of Compromise | 2 | #69, #72 |
| 2.4 - Spyware and Bloatware | 2.4 - An Overview of Malware | 2 | #73, #74 |
| 2.4 - Other Malware Types | 2.4 - An Overview of Malware | 3 | #75, #77, #79 |
| 2.4 - Other Malware Types | 2.4 - Denial of Service | 2 | #76, #80 |
| 2.4 - Physical Attacks | 2.2 - Other Social Engineering Attacks | 2 | #84, #86 |
| 2.4 - Physical Attacks | 5.5 - Penetration Tests | 1 | #83 |
| 2.4 - DNS Attacks | 2.5 - Mitigation Techniques | 2 | #89, #94 |
| 2.4 - DNS Attacks | 4.5 - Secure Protocols | 2 | #90, #92 |

Plus 14 sb16-candidates (no edit; flagged for SB-fix-2 review with sb16_subcategory=partial-depth): #78 + #81 (cryptominer), #82 + #85 (skimming), #87 + #88 (SYN flood), #91 + #93 (DNS tunneling), #95 + #98 (evil twin), #96 (WPA2 handshake), #97 + #99 (WPS PIN), #100 (SSL stripping).

## Validator detail

Pre-apply state (`node scripts/validate-questions.mjs`): 5 warns, 0 errors, 0 info.

Post-dry-run state (same command against temp tree): 5 warns, 0 errors, 0 info.

Same warns both pre and post: 4 × `best-most-short-distractor` + 1 × `spelling-re`. These are pre-existing baseline warns on items NOT touched by this packet. No new issues introduced; no regressions.

## Authorisation requested

Supervisor decision: **authorise real apply?**

If yes: respond with a brief authorisation (no need to re-send full decisions; the JSON is already transcribed). CC will then:

1. Run `scripts/sb-fix-1b-apply-packet.mjs --decisions .audit-working/sb-fix-1b/packet-3-decisions.json` (no --dry-run).
2. Commit with conventional packet message: "SB-fix-1b packet 3/6: …"
3. Push to origin.
4. Surface end-of-packet status via from-cc/ relay (per cadence Rule 3 — post-apply only if validator non-clean, else just close out).

If any of the three flagged items needs adjustment first: respond with the correction and CC will update the decisions JSON and re-run the dry-run.

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

=== SB-fix-1b apply DRY-RUN — packet-3 ===
Decisions in packet: 50
Actions resolved:    50
Skipped (already applied): 0

Per-item diff:
  #51 §2.3 2.3.9 cram[4]  "Type 2 hypervisor"  EDIT  manual
      from: (inherits parent: 2.3 - Virtualization Vulnerabilities)
      to:   "3.1 - Cloud Infrastructures" / 3.1
  #52 §2.3 2.3.9 match[2]  "Bare metal hardware (no host OS)"  EDIT  manual
      from: (inherits parent: 2.3 - Virtualization Vulnerabilities)
      to:   "3.1 - Cloud Infrastructures" / 3.1
  #53 §2.3 2.3.9 match[3]  "A host operating system"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Virtualization Vulnerabilities)
      to:   "3.1 - Cloud Infrastructures" / 3.1
  #54 §2.3 2.3.10 cram[0]  "Shared responsibility model"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Cloud-specific Vulnerabilities)
      to:   "3.1 - Cloud Infrastructures" / 3.1
  #55 §2.3 2.3.10 cram[2]  "Insecure APIs"  EDIT  manual
      from: (inherits parent: 2.3 - Cloud-specific Vulnerabilities)
      to:   "3.1 - Cloud Infrastructures" / 3.1
  #56 §2.3 2.3.10 cram[3]  "Data sovereignty"  EDIT  manual
      from: (inherits parent: 2.3 - Cloud-specific Vulnerabilities)
      to:   "3.3 - States of Data" / 3.3
  #57 §2.3 2.3.10 match[1]  "Shared responsibility model"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Cloud-specific Vulnerabilities)
      to:   "3.1 - Cloud Infrastructures" / 3.1
  #58 §2.3 2.3.10 match[3]  "Data sovereignty"  EDIT  manual
      from: (inherits parent: 2.3 - Cloud-specific Vulnerabilities)
      to:   "3.3 - States of Data" / 3.3
  #59 §2.3 2.3.12 cram[2]  "Weak cipher suites"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Misconfiguration Vulnerabilities)
      to:   "1.4 - Encryption Technologies" / 1.4
  #60 §2.3 2.3.12 match[1]  "Weak cipher suite misconfiguration"  EDIT  accept-alternate
      from: (inherits parent: 2.3 - Misconfiguration Vulnerabilities)
      to:   "4.5 - Secure Protocols" / 4.5
  #61 §2.3 2.3.13 cram[4]  "SIM swapping"  EDIT  manual
      from: (inherits parent: 2.3 - Mobile Device Vulnerabilities)
      to:   "2.2 - Other Social Engineering Attacks" / 2.2
  #62 §2.3 2.3.13 cram[5]  "Bluesnarfing"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Mobile Device Vulnerabilities)
      to:   "2.4 - Wireless Attacks" / 2.4
  #63 §2.3 2.3.13 match[3]  "SIM swapping"  EDIT  manual
      from: (inherits parent: 2.3 - Mobile Device Vulnerabilities)
      to:   "2.2 - Other Social Engineering Attacks" / 2.2
  #64 §2.3 2.3.13 match[4]  "Bluesnarfing"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Mobile Device Vulnerabilities)
      to:   "2.4 - Wireless Attacks" / 2.4
  #65 §2.3 2.3.14 match[1]  "Responsible disclosure"  EDIT  accept-alternate
      from: (inherits parent: 2.3 - Zero-day Vulnerabilities)
      to:   "5.5 - Penetration Tests" / 5.5
  #66 §2.3 2.3.14 match[2]  "Bug bounty program"  EDIT  accept-primary
      from: (inherits parent: 2.3 - Zero-day Vulnerabilities)
      to:   "5.5 - Penetration Tests" / 5.5
  #67 §2.4 2.4.1 cram[1]  "Fileless malware"  EDIT  manual
      from: (inherits parent: 2.4 - An Overview of Malware)
      to:   "2.4 - Viruses and Worms" / 2.4
  #68 §2.4 2.4.1 cram[2]  "C2 (Command and Control)"  EDIT  manual
      from: (inherits parent: 2.4 - An Overview of Malware)
      to:   "2.4 - Denial of Service" / 2.4
  #69 §2.4 2.4.1 cram[3]  "Indicators of compromise (IoC)"  EDIT  accept-primary
      from: (inherits parent: 2.4 - An Overview of Malware)
      to:   "2.4 - Indicators of Compromise" / 2.4
  #70 §2.4 2.4.1 match[1]  "Fileless malware"  EDIT  manual
      from: (inherits parent: 2.4 - An Overview of Malware)
      to:   "2.4 - Viruses and Worms" / 2.4
  #71 §2.4 2.4.1 match[2]  "C2 (Command and Control)"  EDIT  manual
      from: (inherits parent: 2.4 - An Overview of Malware)
      to:   "2.4 - Denial of Service" / 2.4
  #72 §2.4 2.4.1 match[4]  "Indicator of Compromise (IoC)"  EDIT  accept-primary
      from: (inherits parent: 2.4 - An Overview of Malware)
      to:   "2.4 - Indicators of Compromise" / 2.4
  #73 §2.4 2.4.3 cram[4]  "RAT (Remote Access Trojan)"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Spyware and Bloatware)
      to:   "2.4 - An Overview of Malware" / 2.4
  #74 §2.4 2.4.3 match[3]  "RAT (Remote Access Trojan)"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Spyware and Bloatware)
      to:   "2.4 - An Overview of Malware" / 2.4
  #75 §2.4 2.4.4 cram[0]  "Trojan (Trojan horse)"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Other Malware Types)
      to:   "2.4 - An Overview of Malware" / 2.4
  #76 §2.4 2.4.4 cram[3]  "Botnet"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Other Malware Types)
      to:   "2.4 - Denial of Service" / 2.4
  #77 §2.4 2.4.4 cram[4]  "Backdoor"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Other Malware Types)
      to:   "2.4 - An Overview of Malware" / 2.4
  #78 §2.4 2.4.4 cram[5]  "Cryptominer"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #79 §2.4 2.4.4 match[0]  "Trojan horse"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Other Malware Types)
      to:   "2.4 - An Overview of Malware" / 2.4
  #80 §2.4 2.4.4 match[3]  "Botnet"  EDIT  accept-alternate
      from: (inherits parent: 2.4 - Other Malware Types)
      to:   "2.4 - Denial of Service" / 2.4
  #81 §2.4 2.4.4 match[4]  "Cryptominer"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #82 §2.4 2.4.5 cram[1]  "Skimming"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #83 §2.4 2.4.5 cram[2]  "Dumpster diving"  EDIT  manual
      from: (inherits parent: 2.4 - Physical Attacks)
      to:   "5.5 - Penetration Tests" / 5.5
  #84 §2.4 2.4.5 cram[3]  "Shoulder surfing"  EDIT  accept-primary
      from: (inherits parent: 2.4 - Physical Attacks)
      to:   "2.2 - Other Social Engineering Attacks" / 2.2
  #85 §2.4 2.4.5 match[1]  "Skimming"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #86 §2.4 2.4.5 match[3]  "Shoulder surfing"  EDIT  manual
      from: (inherits parent: 2.4 - Physical Attacks)
      to:   "2.2 - Other Social Engineering Attacks" / 2.2
  #87 §2.4 2.4.6 cram[4]  "SYN flood"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #88 §2.4 2.4.6 match[2]  "SYN flood"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #89 §2.4 2.4.7 cram[2]  "DNS sinkhole"  EDIT  manual
      from: (inherits parent: 2.4 - DNS Attacks)
      to:   "2.5 - Mitigation Techniques" / 2.5
  #90 §2.4 2.4.7 cram[3]  "DNSSEC"  EDIT  manual
      from: (inherits parent: 2.4 - DNS Attacks)
      to:   "4.5 - Secure Protocols" / 4.5
  #91 §2.4 2.4.7 cram[4]  "DNS tunneling"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #92 §2.4 2.4.7 match[2]  "DNSSEC"  EDIT  manual
      from: (inherits parent: 2.4 - DNS Attacks)
      to:   "4.5 - Secure Protocols" / 4.5
  #93 §2.4 2.4.7 match[3]  "DNS tunneling"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #94 §2.4 2.4.7 match[4]  "DNS sinkhole"  EDIT  manual
      from: (inherits parent: 2.4 - DNS Attacks)
      to:   "2.5 - Mitigation Techniques" / 2.5
  #95 §2.4 2.4.8 cram[0]  "Evil twin"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #96 §2.4 2.4.8 cram[2]  "WPA2 handshake capture"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #97 §2.4 2.4.8 cram[3]  "WPS PIN attack"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #98 §2.4 2.4.8 match[0]  "Evil twin"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #99 §2.4 2.4.8 match[2]  "WPS PIN attack"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)
  #100 §2.4 2.4.9 cram[2]  "SSL stripping"  SB16-CANDIDATE  subcategory=partial-depth  (no edit; flagged for SB-fix-2)

Summary by action type:
  edit                          : 36
  kept-as-is (self-alternate)   : 0
  kept-as-is (reject)           : 0
  sb16-candidate                : 14

Cluster-view rollup (source parent → destination):
  2.3 - Cloud-specific Vulnerabilities  →  3.1 - Cloud Infrastructures  (3 items)
    - #54 cram[0]  "Shared responsibility model"
    - #55 cram[2]  "Insecure APIs"
    - #57 match[1]  "Shared responsibility model"
  2.3 - Cloud-specific Vulnerabilities  →  3.3 - States of Data  (2 items)
    - #56 cram[3]  "Data sovereignty"
    - #58 match[3]  "Data sovereignty"
  2.3 - Misconfiguration Vulnerabilities  →  1.4 - Encryption Technologies  (1 item)
    - #59 cram[2]  "Weak cipher suites"
  2.3 - Misconfiguration Vulnerabilities  →  4.5 - Secure Protocols  (1 item)
    - #60 match[1]  "Weak cipher suite misconfiguration"
  2.3 - Mobile Device Vulnerabilities  →  2.2 - Other Social Engineering Attacks  (2 items)
    - #61 cram[4]  "SIM swapping"
    - #63 match[3]  "SIM swapping"
  2.3 - Mobile Device Vulnerabilities  →  2.4 - Wireless Attacks  (2 items)
    - #62 cram[5]  "Bluesnarfing"
    - #64 match[4]  "Bluesnarfing"
  2.3 - Virtualization Vulnerabilities  →  3.1 - Cloud Infrastructures  (3 items)
    - #51 cram[4]  "Type 2 hypervisor"
    - #52 match[2]  "Bare metal hardware (no host OS)"
    - #53 match[3]  "A host operating system"
  2.3 - Zero-day Vulnerabilities  →  5.5 - Penetration Tests  (2 items)
    - #65 match[1]  "Responsible disclosure"
    - #66 match[2]  "Bug bounty program"
  2.4 - An Overview of Malware  →  2.4 - Denial of Service  (2 items)
    - #68 cram[2]  "C2 (Command and Control)"
    - #71 match[2]  "C2 (Command and Control)"
  2.4 - An Overview of Malware  →  2.4 - Indicators of Compromise  (2 items)
    - #69 cram[3]  "Indicators of compromise (IoC)"
    - #72 match[4]  "Indicator of Compromise (IoC)"
  2.4 - An Overview of Malware  →  2.4 - Viruses and Worms  (2 items)
    - #67 cram[1]  "Fileless malware"
    - #70 match[1]  "Fileless malware"
  2.4 - DNS Attacks  →  2.5 - Mitigation Techniques  (2 items)
    - #89 cram[2]  "DNS sinkhole"
    - #94 match[4]  "DNS sinkhole"
  2.4 - DNS Attacks  →  4.5 - Secure Protocols  (2 items)
    - #90 cram[3]  "DNSSEC"
    - #92 match[2]  "DNSSEC"
  2.4 - Other Malware Types  →  2.4 - An Overview of Malware  (3 items)
    - #75 cram[0]  "Trojan (Trojan horse)"
    - #77 cram[4]  "Backdoor"
    - #79 match[0]  "Trojan horse"
  2.4 - Other Malware Types  →  2.4 - Denial of Service  (2 items)
    - #76 cram[3]  "Botnet"
    - #80 match[3]  "Botnet"
  2.4 - Physical Attacks  →  2.2 - Other Social Engineering Attacks  (2 items)
    - #84 cram[3]  "Shoulder surfing"
    - #86 match[3]  "Shoulder surfing"
  2.4 - Physical Attacks  →  5.5 - Penetration Tests  (1 item)
    - #83 cram[2]  "Dumpster diving"
  2.4 - Spyware and Bloatware  →  2.4 - An Overview of Malware  (2 items)
    - #73 cram[4]  "RAT (Remote Access Trojan)"
    - #74 match[3]  "RAT (Remote Access Trojan)"

Pre-state SHA256: 2ae38e6b53a5daa82cd9bd8155c775df665247c58b89854645fff15784a9b6f5
Post-state SHA256: 38a971f2b406563e9bb4d6bbab6efa34acc6d7a81cc48ff00366489b425d643c
Changed: YES

DRY-RUN: no files written. Temp tree retained at: /home/abond/projects/secplus-app/.audit-working/sb-fix-1b/.questions-temp.json
```

---ready-for-supervisor---
