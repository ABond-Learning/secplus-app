# SB-fix-1b packet 4 — supervisor decisions (34 items, final packet)

SUPERVISOR_NONCE: 2026-05-22T113553Z-packet-4-decisions
CC_NONCE_ECHO: 2026-05-22T112735Z-78d990ac

## Cadence read

Same operating framework as packet 3:
- cited video IS natural umbrella + technique absent → KEEP-AS-IS + sb16_candidate + partial-depth
- cited video is sibling concept + clear destination exists → re-cite
- corpus-wide hit in another transcript = re-cite to that destination (corpus evidence wins over umbrella framing when both are reasonable)

Acknowledging CC's noted log-text cosmetic issue (annotate script says "SB-fix-1a + SB-fix-1b packets 1-2" but actually loaded 163 items including packet 3). Hints output is accurate per CC; not fixing mid-packet per Rule 6. Worth a one-line fix at SB-fix-1b closure cleanup.

## Cross-packet inconsistency surfacing — SSL stripping (#100 vs #103)

Packet 3 #100 (SSL stripping cram) was decided KEEP-AS-IS + sb16 partial-depth on "cited 2.4 On-path Attacks IS the natural umbrella" reasoning. **Packet 4 #103 (SSL stripping match) has new corpus evidence:** CC's grep shows SSL stripping appears in cryptographic-attacks-sy0-701.txt 7 times — that's substantive teaching presence, not incidental mention.

Decision for #103: re-cite to 2.4 Cryptographic Attacks (corpus-verified).

Decision NOT to retroactively revise #100 (Rule 6 — no scope expansion mid-stream). Flag for cross-packet inconsistency backlog. SB-fix-2 (or post-Sec+ reconciliation pass) will revisit #100 with the same evidence and decide whether to revise.

This is the second confirmed cross-packet inconsistency (BEC was the first from packet 1). Adding to .audit-working/sb-fix-1b/cross-packet-inconsistencies.md.

## Decisions

### §2.4.9 On-path Attacks cluster (101-105)

**#101 cram HSTS** — manual: `"4.5 - Secure Protocols" / 4.5`
  (HSTS is the defensive mechanism — HTTP header forcing HTTPS. 4.5 Secure Protocols is the umbrella for protocol-level security mechanisms.)

**#102 cram BGP hijacking** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (2.4 On-path Attacks IS umbrella for network interception attacks; BGP hijacking IS routing-layer interception. Same pattern as SYN flood / evil twin.)

**#103 match SSL stripping** — manual: `"2.4 - Cryptographic Attacks" / 2.4`
  (Override packet 3 #100 precedent based on new corpus evidence — 7 hits in cryptographic-attacks-sy0-701.txt is substantive teaching presence. See cross-packet inconsistency note above. #100 will be revisited in SB-fix-2 reconciliation.)

**#104 match HSTS** — accept primary destination
  (Parser primary 4.5 Secure Protocols matches my #101 manual decision. Same cluster destination.)

**#105 match BGP hijacking** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #102.)

### §2.4.10 Replay Attacks (106)

**#106 cram Nonce** — manual: `"1.4 - Encryption Technologies" / 1.4`
  (Nonce is a fundamental cryptographic primitive used across encryption modes + authentication protocols + HMAC. 1.4 Encryption Technologies is the canonical home for crypto fundamentals.)

### §2.4.11 Malicious Code cluster (107-112)

**#107 cram Web shell** — manual: `"2.4 - Application Attacks" / 2.4`
  (Cross-packet precedent: SB-fix-1a #48 → 2.4 Application Attacks. By-precedent suggestion confirmed.)

**#108 cram Living off the land** — manual: `"2.4 - Other Malware Types" / 2.4`
  (Cross-packet precedent: SB-fix-1a #49 → 2.4 Other Malware Types.)

**#109 cram Dropper** — accept primary destination
  (Parser primary 2.4 An Overview of Malware matches SB-fix-1a #50 precedent.)

**#110 match Web shell** — manual: `"2.4 - Application Attacks" / 2.4`
  (Same as #107.)

**#111 match Living off the land** — manual: `"2.4 - Other Malware Types" / 2.4`
  (Same as #108.)

**#112 match Dropper** — accept primary destination
  (Same as #109.)

### §2.4.12 Application Attacks cluster (113-116)

**#113 cram IDOR** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #51 was kept-as-is-sb16-candidate. 2.4 Application Attacks IS umbrella.)

**#114 cram SSRF** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (No precedent but same pattern as IDOR: 2.4 Application Attacks IS umbrella for application-layer attacks.)

**#115 match IDOR** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #113.)

**#116 match SSRF** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #114.)

### §2.4.13 Cryptographic Attacks cluster (117-122)

Conceptual split: rainbow tables = attack technique (2.4 Password Attacks); key stretching = defensive technique (4.6 Password Security). POODLE stays in 2.4 Cryptographic Attacks (umbrella for crypto attacks).

**#117 cram POODLE** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (2.4 Cryptographic Attacks IS umbrella; POODLE IS a cryptographic attack. Same pattern as SSL stripping / SYN flood / evil twin.)

**#118 cram Rainbow table** — accept primary destination
  (Parser primary 2.4 Password Attacks. Corpus shows 3 hits in hashing-and-digital-signatures, but those appear to be incidental "rainbow tables defeated by salting" mentions in the hashing context — actual teaching depth lives in password attacks.)

**#119 cram Key stretching** — accept alternate: `4.6 - Password Security`
  (Key stretching is defensive — password storage hardening. 4.6 Password Security is the umbrella for password storage defenses; parser primary 2.4 Password Attacks is attack-side, wrong frame.)

**#120 match POODLE** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #117.)

**#121 match Rainbow table** — accept primary destination
  (Same as #118.)

**#122 match Key stretching** — accept primary destination
  (Parser primary 4.6 Password Security matches my #119 decision. Same destination as cram counterpart.)

### §2.4.14 Password Attacks cluster (123-126)

All four items follow SB-fix-1a precedent for password attack techniques: 2.4 Password Attacks IS umbrella, specific techniques absent from transcript.

**#123 cram Credential stuffing** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #54, #55, #57 all kept-as-is-sb16-candidate.)

**#124 cram Pass-the-hash** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #56 was kept-as-is-sb16-candidate.)

**#125 cram Hybrid attack** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (No precedent but same pattern as credential stuffing / pass-the-hash. 2.4 Password Attacks IS umbrella.)

**#126 match Credential stuffing** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #123.)

### §2.5.1 Segmentation and Access Control cluster (127-132)

**#127 cram DMZ** — manual: `"3.2 - Secure Infrastructures" / 3.2`
  (Cross-packet precedent: SB-fix-1a #59 → 3.2 Secure Infrastructures. By-precedent suggestion confirmed. Override parser primary 3.1 Network Infrastructure Concepts.)

**#128 cram Air gap** — manual: `"3.1 - Network Infrastructure Concepts" / 3.1`
  (Corpus shows hits in network-infrastructure-concepts (3 hits — most), common-threat-vectors (1), vulnerability-remediation (2). Network infrastructure concepts is the densest teaching home. Override parser primary 1.2 Physical Security — air gap is more network architecture than physical security despite the physical aspect.)

**#129 cram Microsegmentation** — manual: `"1.2 - Zero Trust" / 1.2`
  (Microsegmentation IS Zero Trust architecture per the def. 1.2 Zero Trust is umbrella. No parser primary; supplying manually.)

**#130 match DMZ** — manual: `"3.2 - Secure Infrastructures" / 3.2`
  (Same as #127.)

**#131 match Air gap** — manual: `"3.1 - Network Infrastructure Concepts" / 3.1`
  (Same as #128.)

**#132 match Microsegmentation** — accept primary destination
  (Parser primary 1.2 Zero Trust matches my #129 decision.)

### §2.5.3 Hardening Techniques cluster (133-134)

**#133 cram Secure boot** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (2.5 Hardening Techniques IS umbrella for hardening; Secure Boot IS a hardening technique (boot-time integrity). Specific technique not in transcript but conceptual home is correct.)

**#134 match Secure Boot** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #133. Override parser primary "3.1 - Infrastructure Considerations" — CC: please verify that video title exists in inventory; I'm not confident it does. Same destination logic as #133 — keep-as-is in cited 2.5 Hardening Techniques.)

## Tally

34 items reviewed:
- 20 re-cites (mix of accept-primary, accept-alternate, manual)
- 14 sb16-candidates (all partial-depth)
- 0 self-alternates
- 0 rejects
- 0 defers

20 + 14 = 34 ✓ (arithmetic verified this time)

## Notes for SB-fix-1b closure

Once packet 4 ships:
- **SB-fix-1b complete: 134/134 items shipped.** D2 partial-adjacent match/cram fully audited.
- **Cross-packet inconsistencies file** now has 2 confirmed entries (BEC from packet 1; SSL stripping from packets 3/4). Resolution method: transcript-grep reconciliation + SB-fix-2 evaluation.
- **Findings file for Report-#0010** carries: third catch-all pattern (mitigation-techniques cluster from packet 2), messer-curriculum-gap sb16_subcategory introduction (packet 2), umbrella-conceptual-fit framing validated across packets 3-4.
- **SB-fix-2 candidate pool** grows substantially: 14 sb16-candidates from packet 3 + 14 from packet 4 + earlier accumulated = ~60+ items total. Worth a brief tally at SB-fix-1b closure.

## Routing

CC copies this file to .audit-working/relays/from-supervisor/{ISO}-packet-4-decisions.md, commits, pushes.

Then CC:
1. Transcribes decisions to .audit-working/sb-fix-1b/packet-4-decisions.json
2. Generates dry-run preview
3. Surfaces dry-run for supervisor sign-off via standard from-cc/ file with URL in terminal output (per relay v2.1)

DO NOT proceed to real apply until supervisor authorises dry-run.

After packet 4 ships: brief docs-sync commit (PLAN.md + supervisor-handoff.md) marking SB-fix-1b at 134/134 complete + identifying next-session opener (SB-fix-2 vs weakness-tracker implementation — Aiden's choice).

---ready-for-cc---
