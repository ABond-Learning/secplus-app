# Supervisor response — SB-fix-2 packet R routings (18 items)

SUPERVISOR_NONCE: 2026-05-22T124603Z-packet-r-routings
CC_NONCE_ECHO: 2026-05-22T122710Z-5121acf1

## Chose Option 1 (manual adjudication, no re-run)

Rationale: the needle-extractor fix only addresses 5 mc/scen items, but the `looksLikeUmbrellaTitle` heuristic limitation affects ~10 more items across all types. Fixing the extractor + re-running doesn't fix the heuristic issue. Supervisor judgment override is anyway authoritative per Rule 3.

For future SB-fix-2 packets (G and P), worth backlog-noting:
1. **Needle extractor for mc/scen** — should extract acronyms / specific tested concepts from Q text, not use full Q as needle. (CC's Option 2 fix.)
2. **`looksLikeUmbrellaTitle` heuristic** — too conservative; misses titles like "Recovery Testing", "Backups", "Threat Intelligence", "Viruses and Worms". A title that's a noun phrase naming a concept category is usually the umbrella for specific instances under that category.

These aren't blocking — supervisor judgment overrides cleanly. But if future G/P packets show similar systematic over-routing to curriculum-gap, worth a one-commit fix.

## Routing decisions (18 items)

Operating rule: **partial-depth where cited video's title names a concept category that conceptually contains the tested specific.** Examples: "Recovery Testing" subsumes "Parallel test" + "Full interruption test"; "Backups" subsumes "Differential backup"; "Business Impact Analysis" subsumes BIA metrics like MTD.

### §1.2 cluster (items 1-3)

**Item 1 §1.2.2 mc[4] HMAC + non-repudiation** — `partial-depth`
  (1.2 Non-repudiation IS umbrella; HMAC is the foil concept used to teach what does/doesn't provide non-repudiation. Override CC's curriculum-gap.)

**Item 2 §1.2.2 match[3] HMAC** — `partial-depth`
  (Same as item 1. Override.)

**Item 3 §1.2.6 match[5] Cable lock** — `partial-depth`
  (Agrees with CC. 1.2 Physical Security IS umbrella for physical security mechanisms.)

### §2.3 cluster (item 4)

**Item 4 §2.3.2 match[3] strcpy/gets/sprintf** — `partial-depth`
  (2.3 Buffer Overflows IS umbrella; specific C functions are the mechanism implementations. Override CC's curriculum-gap.)

### §2.4 cluster (items 5-7)

**Item 5 §2.4.2 cram[3] Metamorphic virus** — `partial-depth`
  (2.4 Viruses and Worms IS umbrella for virus types. Override CC's curriculum-gap.)

**Item 6 §2.4.9 mc[2] HSTS** — `messer-curriculum-gap`
  (2.4 On-path Attacks teaches attacks; HSTS is the defense. Sibling concept, not umbrella. Override CC's partial-depth. The natural umbrella for HSTS is 4.5 Secure Protocols which doesn't have HSTS in transcript either per CC's spot-check. Genuine curriculum-gap.)

**Item 7 §2.4.10 mc[2] Nonce** — `partial-depth`
  (2.4 Replay Attacks IS umbrella for replay prevention; Nonce is one mechanism. Agrees with CC.
   
   Note: packet 4 #106 sent a similar Nonce cram item to 1.4 Encryption Technologies because that framing was about Nonce-as-crypto-primitive. This item's framing is Nonce-as-replay-prevention. Both framings are valid; the routing depends on which framing the item tests. For #106 we kept it as crypto-primitive; for this item we keep it as replay-prevention. The two items have different conceptual homes despite sharing the term.)

### §3.1 cluster (item 8)

**Item 8 §3.1.2 scen[3] SD-WAN** — `partial-adjacent-not-sb16`
  (CC's spot-check correctly identified the corpus hit in `secure-communication-sy0-701.txt`. SD-WAN belongs in that video, not the cited 3.1 Network Infrastructure Concepts. Route OUT of SB-fix-2 to a future D1/D3/D4/D5 partial-adjacent cleanup pass. Override CC's partial-depth.)

### §3.4 cluster (items 9-11)

**Item 9 §3.4.3 cram[1] Parallel test** — `partial-depth`
  (3.4 Recovery Testing IS umbrella; parallel test is a recovery test type. Override CC's curriculum-gap.)

**Item 10 §3.4.3 cram[2] Full interruption test** — `partial-depth`
  (Same as item 9. Override.)

**Item 11 §3.4.4 match[0] Differential backup** — `partial-depth`
  (3.4 Backups IS umbrella; differential backup is a backup type. Override CC's curriculum-gap.)

### §4.1 cluster (item 12)

**Item 12 §4.1.3 cram[4] MAM** — `partial-depth`
  (4.1 Securing Wireless and Mobile IS umbrella; MAM is a mobile management specific. Override CC's curriculum-gap.)

### §4.3 cluster (items 13-14)

**Item 13 §4.3.2 match[2] STIX/TAXII** — `partial-depth`
  (4.3 Threat Intelligence IS umbrella; STIX/TAXII is a threat intel sharing format. Override CC's curriculum-gap.)

**Item 14 §4.3.4 mc[2] EPSS** — `partial-depth`
  (4.3 Analyzing Vulnerabilities IS umbrella; EPSS is a vulnerability scoring system. Agrees with CC.)

### §5.2 cluster (items 15-16)

**Item 15 §5.2.4 match[4] MTD** — `partial-depth`
  (5.2 Business Impact Analysis IS umbrella; MTD is a BIA metric. Override CC's curriculum-gap.)

**Item 16 §5.2.4 cram[5] MTD** — `partial-depth`
  (Same as item 15. Override.)

### §5.5 cluster (item 17)

**Item 17 §5.5.2 match[2] Remediation validation** — `partial-depth`
  (5.5 Penetration Tests IS umbrella for pen testing phases; remediation validation is a post-test phase. Override CC's curriculum-gap.)

### §5.6 cluster (item 18)

**Item 18 §5.6.1 cram[3] Security champions** — `partial-depth`
  (5.6 Security Awareness IS umbrella; security champions is an SA program element. Agrees with CC.)

## Tally

18 items routed:
- **partial-depth: 16** (items 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18)
- **messer-curriculum-gap: 1** (item 6 HSTS)
- **partial-adjacent-not-sb16: 1** (item 8 SD-WAN)
- **not-sb16: 0**

Total: 18 ✓

Big divergence from CC's recommendation (6/12/0/0): 10 items flipped from curriculum-gap to partial-depth based on umbrella-fit framing.

## Downstream impact on SB-fix-2 packet counts

Original projection (from scoping doc):
- R: 18 items (this packet)
- G: 2 (Pool A messer-curriculum-gap) + ~3 (Pool B routings) = ~5 items
- P: 40 (Pool A partial-depth) + ~10 (Pool B routings) = ~50 items → 2-3 packets

Revised projection after these routings:
- R: 18 items (done)
- **G: 2 (Pool A) + 1 (Pool B item 6 HSTS) = 3 items** (one packet)
- **P: 40 (Pool A) + 16 (Pool B partial-depth) = 56 items → 3 packets** (20+20+16)
- 1 item (SD-WAN) routes OUT of SB-fix-2 scope to future D1/D3/D4/D5 cleanup

Total SB-fix-2 packets after R: 1 G + 3 P = 4 packets. Plus this R packet = 5 total. Same as CC's plan estimate, slightly different distribution.

The SD-WAN item routing to `partial-adjacent-not-sb16` should be captured in `.audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md` per the scoping doc §5.3. One item — quick capture.

## Backlog notes for future packets

When CC builds G and P packets:

1. **Needle extractor improvement** (Option 2 fix) — extract acronyms / specific tested concepts from mc/scen Q text rather than using full Q as needle. ~10 lines per CC's estimate. Not blocking but useful for future routing accuracy.

2. **`looksLikeUmbrellaTitle` heuristic** — current heuristic is conservative; ~10 of 18 R items were correctly partial-depth but CC's heuristic defaulted them to curriculum-gap. Worth tuning: any title that's a noun phrase naming a concept category should likely be umbrella for specific instances under it. If future G/P packets show similar over-routing, worth a one-commit fix between packets.

Capture both as findings/.audit-working/findings/sb-fix-2-classifier-improvements.md or similar.

## Routing — commit 3 authorized

Proceed to commit 3 (backfill): run `scripts/sb-fix-2-backfill-pool-b.mjs` against this packet's routings. Writes:

- **16 items → audit_d_review.sb16_candidate=true + sb16_subcategory="partial-depth" + packet_id="sb-fix-2-r" + applied_at + applied_by="sb-fix-2-r"** — these items become part of Pool A for the P packets
- **1 item (item 6 HSTS) → audit_d_review.sb16_candidate=true + sb16_subcategory="messer-curriculum-gap" + packet_id="sb-fix-2-r"** — this item folds into the G packet
- **1 item (item 8 SD-WAN) → audit_d_review.sb1_6_review.routing="partial-adjacent-deferred" + audit_d_review.sb1_6_review.note="SD-WAN should re-cite to secure-communication-sy0-701; deferred to D1/D3/D4/D5 partial-adjacent cleanup pass"** — exits SB-fix-2 scope
- Capture #8 to .audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md

Commit message: `SB-fix-2 R: Pool B routing backfill (18 items)`.

## CC routing

CC copies this file to `.audit-working/relays/from-supervisor/{ISO}-packet-r-routings.md`, commits, pushes.

Then CC:
1. Transcribes routings to `.audit-working/sb-fix-2/packet-R-routings.json`
2. Runs `scripts/sb-fix-2-backfill-pool-b.mjs` with the routings file
3. Verifies post-state via validator
4. Commits backfill as commit 3 of the implementation plan
5. Captures #8 to findings file (separate small commit OR appended to backfill commit at CC's preference)
6. Surfaces brief close-out signal per Rule 3 (validator clean → brief)

DO NOT proceed to G packet build today. R closure is the natural pause point — supervisor + Aiden decide whether to continue or stop at that signal.

---ready-for-cc---
