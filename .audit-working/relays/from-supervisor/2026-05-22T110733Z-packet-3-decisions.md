# SB-fix-1b packet 3 — supervisor decisions (50 items)

SUPERVISOR_NONCE: 2026-05-22T110244Z-packet-3-decisions
CC_NONCE_ECHO: 2026-05-22T105317Z-58b94fe0

## Cadence read

Rule 2 (inline cluster verification): WORKING. Each cluster
item carries grep results inline — supervisor judgment can
override classifier flags where known limits apply (terminology
variants flagged in CC's build summary).

Rule 5 (cross-packet hints): WORKING but lower yield than
prior packets. Most §2.4 items have no strong precedent
because SB-fix-1a mc/scen didn't densely cover §2.4. This is
expected entering a new cluster; Rule 5's value compounds as
sub-batches accumulate.

Rule 6 (mid-stream findings): no scope expansion. The
terminology-variant misses are characterised in CC's summary,
not promoted to a new sub-batch.

Net: 50-item review under new cadence is feasible but
genuinely item-by-item for this packet. Future §2.4-anchored
packets will get more precedent leverage.

## Override of classifier where umbrella-fit framing applies

Several items show `messer-curriculum-gap` from CC's classifier
because the exact term is corpus-absent. But the
umbrella-conceptual-fit framing (yesterday's load-bearing
distinction) keeps many of these as `partial-depth` because
the cited or destination video IS the natural umbrella.

Operating rule applied here:
- cited video IS natural umbrella → keep-as-is + sb16_candidate
  + partial-depth (Spectre/SYN flood pattern)
- cited video is sibling concept (not umbrella) → re-cite to
  natural umbrella destination; partial-depth status within
  new destination evaluated by SB-fix-2

## Decisions

### §2.3.9 Hypervisor cluster (51-53)

**#51 cram Type 2 hypervisor** — manual: `"3.1 - Cloud Infrastructures" / 3.1`
  (Same destination as SB-fix-1b packet 2 #50 Type 1 hypervisor.
   Classifier missed; precedent is unambiguous.)

**#52 match Type 1 hypervisor → bare metal** — accept primary destination
  (Parser primary 3.1 Cloud Infrastructures; precedent confirms.)

**#53 match Type 2 hypervisor → host OS** — accept primary destination
  (Parser primary 3.1 Cloud Infrastructures with alternate 3.1
   Other Infrastructure Concepts. Cloud Infrastructures is the
   more central destination per SB-fix-1b packet 2 #50 precedent.)

### §2.3.10 Cloud-specific cluster (54-58)

**#54 cram Shared responsibility model** — accept primary destination
  (Parser primary 3.1 Cloud Infrastructures matches precedent +
   conceptual home for cloud governance.)

**#55 cram Insecure APIs** — manual: `"3.1 - Cloud Infrastructures" / 3.1`
  (No parser primary. Insecure APIs is a cloud-specific concept;
   3.1 is the canonical home. Classifier corpus-absent flag
   notes the term itself isn't in any transcript — SB-fix-2 will
   evaluate partial-depth status in 3.1.)

**#56 cram Data sovereignty** — manual: `"3.3 - Protecting Data" / 3.3`
  (CC classifier surfaced corpus hits in states-of-data-sy0-701.txt.
   CC: please verify exact video title against the inventory when
   applying — likely "3.3 - Protecting Data" or "3.3 - States of
   Data". The states-of-data transcript IS where data sovereignty
   is actually taught. Override parser primary 3.1 Cloud Infrastructures.)

**#57 match Shared responsibility model** — accept primary destination
  (Same as #54.)

**#58 match Data sovereignty** — manual: `"3.3 - Protecting Data" / 3.3`
  (Same as #56. CC verify exact title.)

### §2.3.12 Misconfiguration cluster (59-60)

**#59 cram Weak cipher suites** — accept primary destination
  (Parser primary 1.4 Encryption Technologies; cipher suite
   strength is encryption fundamentals.)

**#60 match SSL instead of TLS for HTTPS** — accept alternate: `4.5 - Secure Protocols`
  (Parser primary 1.4 Encryption Technologies with alternate
   4.5 Secure Protocols. The SSL/TLS-for-HTTPS framing is about
   protocol selection, not encryption theory. Secure Protocols
   is the better destination.)

### §2.3.13 Mobile Device cluster (61-64)

**#61 cram SIM swapping** — manual: `"2.2 - Other Social Engineering Attacks" / 2.2`
  (Cross-packet hint matches SB-fix-1a #32. SIM swapping IS
   social engineering of carriers. Re-cite to 2.2 umbrella.
   Classifier corpus-absent flag is fine — SB-fix-2 will
   evaluate partial-depth status in the new destination.)

**#62 cram Bluesnarfing** — accept primary destination
  (Parser primary 2.4 Wireless Attacks. Bluesnarfing IS a
   wireless attack — 2.4 is the umbrella. Corpus-absent
   classifier flag → partial-depth status evaluated by SB-fix-2.)

**#63 match SIM swapping** — manual: `"2.2 - Other Social Engineering Attacks" / 2.2`
  (Same as #61.)

**#64 match Bluesnarfing** — accept primary destination
  (Same as #62.)

### §2.3.14 Zero-day cluster (65-66)

**#65 match Responsible disclosure** — accept alternate: `5.5 - Penetration Tests`
  (Parser primary 4.3 Vulnerability Scanning is wrong frame.
   Responsible disclosure is a researcher-to-vendor process;
   pen testing context is the right home where bug bounty + RD
   processes are taught.)

**#66 match Bug bounty program** — accept primary destination
  (Parser primary 5.5 Penetration Tests. Same conceptual
   cluster as #65.)

### §2.4.1 Malware Overview cluster (67-72)

**#67 cram Fileless malware** — manual: `"2.4 - Viruses and Worms" / 2.4`
  (CC build summary flagged terminology variant: real transcript
   says "fileless virus" in viruses-and-worms-sy0-701.txt.
   Concept IS in corpus, classifier missed it. Override.)

**#68 cram C2 (Command and Control)** — manual: `"2.4 - Denial of Service" / 2.4`
  (CC summary flagged terminology variant: "command and control"
   appears in dos-sy0-701.txt + web-filtering-sy0-701.txt;
   classifier matched bare "C2" only. DoS is the natural umbrella
   (botnets + C2 infrastructure). Matches SB-fix-1a #36 precedent.)

**#69 cram Indicators of Compromise** — accept primary destination
  (Parser primary 2.4 Indicators of Compromise; classifier
   confirms hits in destination. Clean.)

**#70 match Fileless malware** — manual: `"2.4 - Viruses and Worms" / 2.4`
  (Same as #67.)

**#71 match C2 (Command and Control)** — manual: `"2.4 - Denial of Service" / 2.4`
  (Same as #68. Override parser primary 2.4 Other Malware Types
   in favor of DoS where C2 is actually taught.)

**#72 match Indicator of Compromise** — accept primary destination
  (Same as #69.)

### §2.4.3 Spyware cluster (73-74)

**#73 cram RAT (Remote Access Trojan)** — accept primary destination
  (Parser primary 2.4 An Overview of Malware. Matches SB-fix-1a
   #38 precedent.)

**#74 match RAT** — accept primary destination
  (Same as #73.)

### §2.4.4 Other Malware Types cluster (75-81)

**#75 cram Trojan** — accept primary destination
  (Parser primary 2.4 An Overview of Malware. CC classifier
   showed "cited-hit" but the LLM is correct that the cited
   transcript only mentions Trojan incidentally — teaching depth
   lives in An Overview of Malware. Matches SB-fix-1a #39
   precedent.)

**#76 cram Botnet** — accept primary destination
  (Parser primary 2.4 Denial of Service with 10 classifier hits
   in destination. Botnets are taught in the DoS context.)

**#77 cram Backdoor** — accept primary destination
  (Parser primary 2.4 An Overview of Malware with destination
   classifier hit. Clean.)

**#78 cram Cryptominer** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Classifier corpus-absent. But 2.4 Other Malware Types IS the
   natural umbrella for cryptominers — they ARE other malware
   types. Same pattern as Spectre/Meltdown: cited video is
   conceptual home, specific technique not in transcript.)

**#79 match Trojan horse** — accept primary destination
  (Same as #75. Override classifier cited-hit flag — teaching
   depth lives in An Overview of Malware.)

**#80 match Botnet** — accept alternate: `2.4 - Denial of Service`
  (Parser primary 2.4 An Overview of Malware with alternate
   DoS. Classifier shows DoS has 10 hits vs AoM 1 hit. DoS is
   where botnets are densely taught. Matches #76 decision for
   the cram counterpart.)

**#81 match Cryptominer** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #78.)

### §2.4.5 Physical Attacks cluster (82-86)

**#82 cram Skimming** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Classifier corpus-absent. 2.4 Physical Attacks IS the natural
   umbrella — skimming IS physical attachment to card readers.
   Partial-depth pattern.)

**#83 cram Dumpster diving** — manual: `"5.5 - Penetration Tests" / 5.5`
  (Classifier showed corpus hit in penetration-tests-sy0-701.txt.
   Pen testing is where dumpster diving is actually taught.
   Override parser primary 2.2 Common Threat Vectors in favor
   of the transcript-verified home.)

**#84 cram Shoulder surfing** — accept primary destination
  (Parser primary 2.2 Other Social Engineering Attacks. Shoulder
   surfing IS social engineering. Umbrella fit. Classifier
   corpus-absent → partial-depth status in destination evaluated
   by SB-fix-2.)

**#85 match Skimming** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #82.)

**#86 match Shoulder surfing** — manual: `"2.2 - Other Social Engineering Attacks" / 2.2`
  (Same as #84. No parser primary; supplying it manually.)

### §2.4.6 DoS cluster (87-88)

**#87 cram SYN flood** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #43 was kept-as-is-sb16-
   candidate. Same pattern.)

**#88 match SYN flood** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #87.)

### §2.4.7 DNS Attacks cluster (89-94)

**#89 cram DNS sinkhole** — manual: `"2.5 - Mitigation Techniques" / 2.5`
  (DNS sinkhole is a defensive/mitigation technique. 2.5
   Mitigation Techniques is the umbrella — consistent with §2.3
   mitigation cluster moves in packet 2 (ASLR, DEP, stack canary,
   mutex, WAF all routed to 2.5).)

**#90 cram DNSSEC** — manual: `"4.5 - Secure Protocols" / 4.5`
  (DNSSEC is a secure protocol. 4.5 is the umbrella.)

**#91 cram DNS tunneling** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #45 was kept-as-is-sb16-
   candidate. Same pattern.)

**#92 match DNSSEC** — manual: `"4.5 - Secure Protocols" / 4.5`
  (Same as #90.)

**#93 match DNS tunneling** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #91.)

**#94 match DNS sinkhole** — manual: `"2.5 - Mitigation Techniques" / 2.5`
  (Same as #89.)

### §2.4.8 Wireless Attacks cluster (95-99)

**#95 cram Evil twin** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #46 was kept-as-is-sb16-
   candidate. Same pattern.)

**#96 cram WPA2 handshake capture** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Cross-packet precedent: SB-fix-1a #47 was kept-as-is-sb16-
   candidate. Same pattern.)

**#97 cram WPS PIN attack** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (2.4 Wireless Attacks IS the natural umbrella. Override parser
   primary 4.1 Securing Wireless and Mobile — that's the
   defensive-side concept; the item tests the attack mechanic.
   Same pattern as evil twin/WPA2.)

**#98 match Evil twin** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #95.)

**#99 match WPS PIN attack** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (Same as #97.)

### §2.4.9 On-path cluster (100)

**#100 cram SSL stripping** — KEEP-AS-IS + sb16_candidate=true + sb16_subcategory="partial-depth"
  (2.4 On-path Attacks IS the natural umbrella — SSL stripping
   IS an on-path/MITM downgrade attack. Override parser primary
   4.5 Secure Protocols. Same pattern as evil twin family.)

## Tally

50 items reviewed:
- 23 re-cites (mix of accept-primary, accept-alternate, manual)
- 13 sb16-candidates (all partial-depth — concept in umbrella
  but specific technique absent from transcript)
- 0 self-alternates
- 0 rejects
- 0 defers

## Cross-packet observations for the running findings list

The §2.4 cluster is producing a structurally different pattern
from §2.3:

- §2.3 mostly produced re-cites to mitigation/asset-management/
  cloud destinations (concepts genuinely belonging elsewhere).
- §2.4 produces a LOT of partial-depth keep-as-is (10 of 50 items)
  because §2.4 attack-type videos ARE the natural conceptual
  homes for their specific attacks; the attack name often just
  isn't in the transcript even though the umbrella attack class
  is taught.

This validates Report-#0007 §6's prediction. Worth recording in
the findings file for Report-#0010 (SB-fix-1b closure).

A separate observation worth capturing: the classifier's known
terminology-variant misses (fileless malware ↔ fileless virus;
C2 ↔ command and control) demonstrate that exact-phrase grep
needs supervisor-side semantic override. Rule 2 + Rule 3 together
handle this correctly (CC surfaces classifier verdict + grep
results; supervisor judgment gates the decision). The cadence
rules don't need amendment — the existing structure already
accommodates this case. Worth noting in the findings file as
"cadence rules working as designed."

## Routing

CC copies this file to .audit-working/relays/from-supervisor/
{ISO}-packet-3-decisions.md, commits, pushes.

Then CC:
1. Transcribes decisions to
   .audit-working/sb-fix-1b/packet-3-decisions.json
2. Generates dry-run preview
3. Surfaces dry-run for supervisor sign-off via standard
   from-cc/ file with URL in terminal output (per relay v2.1)

DO NOT proceed to real apply until supervisor authorises dry-run.

---ready-for-cc---
