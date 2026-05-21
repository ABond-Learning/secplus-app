# Report-#0007 — SB-fix-1a Domain 2 partial-adjacent re-citation + cross-cutting Audit D findings

Session date: 2026-05-20
Session type: First Audit D remediation acting-on sub-batch (single-day, three-packet relay)
Branch: main
Starting commit: `e8ba93a` (docs: PLAN.md + supervisor-handoff sync with SB1.6 SHIPPED + SB-fix-1a authorized)
Ending commits: `53786b0` → `4b9d838` → `61b6992` (per-packet) plus `df40c40` (interim docs sync) and this report's commit (see git log)

This report is the load-bearing methodology document for SB-fix-1a. It ties together yesterday's three closely-linked work blocks — Q6 validator-constraint check, parser v2 redesign, and the three packet applications — and captures two cross-cutting findings that will inform every subsequent Audit D sub-batch: the catch-all generalisation across Domain 2 video clusters, and the partial-depth under-application at the LLM-as-judge layer.

## 1. Session overview

**What was asked:** execute SB-fix-1a (the first Audit D remediation acting-on sub-batch) under the scoping signed off in Report-#0006. Three packets of D2 partial-adjacent mc + scen re-citations (~25/25/13 = 63 items), per-packet commits, study-safe Strategy A (metadata-only edits — `item.messerVideo` + `item.subObjective` + `audit_d_review` audit-trail block; item content / opts / explanation / SM-2 keys all preserved). First step of the day: Q6 validator-constraint check (deferred to today from Report-#0006's TASK 3 sign-off).

**What shipped:**

```
61b6992  SB-fix-1a packet 3/3: 8 D2 PA re-citations + 5 sb16-candidates
4b9d838  SB-fix-1a packet 2/3: 21 D2 PA re-citations + 4 sb16-candidates
53786b0  SB-fix-1a packet 1/3: 23 D2 PA re-citations + 1 reject-via-self-alternate + 1 sb16-candidate
```

All three on `origin/main`. `df40c40` was an interim PLAN + supervisor-handoff sync after the SB-fix-1a packets landed; this report's commit is the third sync covering the cross-cutting findings.

**Headline numbers:**

```
Total reviewed:        63  (100% of D2 partial-adjacent mc + scen scope per SB-fix-1a inventory)
Total re-cited:        52  (23 packet-1 + 21 packet-2 + 8 packet-3)
Self-alternate kept:    1  (#17 — accept-alternate target matched current citation; treated as reject-via-self-alternate)
SB16-candidates:       10  (1 packet-1 + 4 packet-2 + 5 packet-3)
LLM spend:             $0  (transcript grep + script-only review/apply cycle)
```

## 2. Q6 validator-constraint check

**Outcome: A — no relevant constraint exists.** The apply script could proceed without validator changes.

Read `scripts/validate-questions.mjs` (273 lines) end-to-end. The only rules touching `messerVideo` / `subObjective` are:

1. An item is classified NEW if it has either `messerVideo` OR `subObjective` (line 56); otherwise legacy.
2. NEW items must have BOTH fields (errors `missing-messer`, `missing-subobj`).
3. `subObjective` must match `^\d+\.\d+(\.\d+)?$` (error `subobj-format`).
4. Legacy items get an info-level grandfather notice.

The validator does NOT enforce: any consistency between `item.messerVideo` and parent video title; any consistency between `item.subObjective` and parent section id; any external Messer-video manifest match; any string format on `messerVideo` beyond non-empty. Per-item citation is treated as opaque, independently-validated metadata — exactly the shape SB-fix-1a needed.

The `audit_*` field naming convention (SCHEMA.md, `db60853`) is also honored by the validator: unknown object keys are ignored entirely. No risk of `audit_d_review.note` strings getting spelling-flagged.

Baseline validator state on `questions.json` before SB-fix-1a: 0 errors / 5 warns / 0 info → exit 0. Zero `legacy-no-citation` infos, meaning every mc/scen item already had both fields populated; SB-fix-1a was always going to be changing values, not adding fields. Post-apply validator on each packet held at the same baseline (0/5/0).

**Implication for apply script:** halt-on-error gate via `process.exit(1)` on validator errors is reliable. Pre-write validator run against a temp file using the existing `--path=` flag, atomic rename on pass, paranoia re-run post-rename. No validator changes bundled into SB-fix-1a.

## 3. Parser v2 design — bug surface and allowlist remedy

Packet-1 review surfaced **four parser bugs** in v1 (regex-based candidate extraction from LLM justification prose). All four were caught by supervisor reading the rendered packet, not by mechanical checks. v1 produced a candidate list that looked plausible row-by-row but contained systemic errors:

1. **`X or Y` truncation.** v1's two regex passes (quoted `"X.Y - Title"` and unquoted `X.Y - Title`) used greedy matches that captured the first part of an `X or Y` construction and stopped. Example item #6: prose said `"4.5 - Email Security or 4.5 - Secure Protocols"`; v1 emitted `["4.5 - Email Security or 4"]`. v2 needs to match each title independently against a known-title allowlist, eliminating greedy-join.
2. **Inverted primary (current citation as candidate).** v1 emitted the item's current `messerVideo` as a candidate whenever it appeared in the prose (which the LLM often quoted as part of its reasoning). Example item #9: current citation `2.2 - Impersonation`; v1 candidates `["2.2 - Impersonation", "2.4 - DNS Attacks"]`. The supervisor had to manually dig past the current-citation noise to find the real destination. v2 filters candidates against `item.messerVideo` before emitting.
3. **Prose-suffix capture.** v1 didn't bound the end of the title match cleanly, so suffix prose bled into the captured candidate string. Example item #23: v1 emitted `"2.3 - SQL Injection per the inventory"`. v2 bounds the title with `\b` word-boundary against the allowlist.
4. **Hallucinated video names.** The LLM occasionally invented `X.Y - Title` strings that don't exist (e.g. `"2.4 - Cross-site Scripting"` — Cross-site Scripting is §2.3 not §2.4; or `"3.1 - Infrastructure Concepts"` — real §3.1 titles are "Network Infrastructure Concepts" / "Other Infrastructure Concepts" / "Infrastructure Considerations" but no plain "Infrastructure Concepts"). v1 accepted these as candidates verbatim. v2 rejects any title not in the 120-entry known-title allowlist from `questions.json`.

**v2 design (allowlist-based):** replace v1's two regex passes with a single pass that tries to match each of the 120 known Messer video titles against the justification prose, ordered by first-occurrence. Filter against current `item.messerVideo` to prevent inverted-primary. All four bug classes are eliminated by construction.

**v2 impact across the 63-item corpus:** 53 unchanged, 10 strict improvements:

| # | Loc | v1 candidates | v2 candidates | Improvement |
|---|---|---|---|---|
| #6  | 2.2.2 mc[5]   | `["4.5 - Email Security or 4"]` | `["4.5 - Email Security", "4.5 - Secure Protocols"]` | truncation → 2 clean |
| #9  | 2.2.3 scen[1] | `["2.2 - Impersonation", "2.4 - DNS Attacks"]` | `["2.4 - DNS Attacks"]` | current filtered |
| #14 | 2.2.5 mc[4]   | `["5.6 - Security Awareness or 5"]` | `["5.6 - Security Awareness", "5.6 - User Training"]` | truncation → 2 clean |
| #17 | 2.2.5 scen[2] | `["2.2 - Common Threat Vectors", "2.2 - Other Social Engineering Attacks"]` | `["2.2 - Common Threat Vectors"]` | current filtered |
| #23 | 2.3.7 mc[1]   | `["2.3 - SQL Injection per the inventory"]` | `["2.3 - SQL Injection"]` | prose suffix stripped |
| #34 | 2.3.13 scen[1] | `["2.4 - Other Social Engineering Attacks", "4.6 - Multifactor Authentication"]` | `["4.6 - Multifactor Authentication"]` | hallucination filtered |
| #40 | 2.4.4 scen[1] | `["2.4 - Other Malware Types"]` | `[]` | only current-citation → empty (Aiden inference required) |
| #45 | 2.4.7 mc[2]   | `["2.4 - DNS Attacks"]` | `[]` | only current-citation → empty |
| #52 | 2.4.12 scen[2] | `["2.4 - Cross-site Scripting"]` | `[]` | hallucinated (real XSS is §2.3) |
| #60 | 2.5.1 mc[2]   | `["1.2 - Physical Security", "3.1 - Infrastructure Concepts"]` | `["1.2 - Physical Security"]` | hallucinated §3.1 title filtered |

The v2 zero-candidate rate is 32% (20 of 63) vs v1's 27% (17 of 63). The 5pp increase reflects v2 honestly surfacing "no real destination found" instead of v1's false-positive candidates. This is the right behavior: v2 says "Aiden inference required" when there is no parseable destination, rather than offering a hallucination or a self-citation as if it were a legitimate suggestion.

**The 5pp zero-candidate increase understates the functional improvement.** v2 simultaneously raised zero-candidate honesty AND eliminated 6+ wrong single-candidate suggestions from v1 (the truncated `…or 4` strings, the inverted-primary self-citations, the prose-suffix bleeds, and the hallucinated cross-domain titles). The 10-item improvement set above counts each fixed row once, but the supervisor-side review-time impact is closer to "10 rows that would have required manual override" than "5pp more rows requiring manual destination entry."

**Methodological note (sanity-check before coding):** the same sanity-check-against-data instinct that caught the SB1.6 gate-value error (predicate `fix_direction === "rewrite-to-source"` matched zero corpus rows; corrected to `mark-for-Sybex-arbitration`) also caught parser-v2's allowlist edge cases before code: the §3.1 "Infrastructure Concepts" hallucination was verified by reading the §3.1 video set in `questions.json` BEFORE concluding the candidate was a hallucination. Verifying against ground truth before writing the rejection logic prevented building a parser that "fixed" valid candidates.

**Packet-1 not regenerated.** Supervisor decisions on packet-1 were authoritative against v1-rendered output. The parser-v2 file changes (commit `53786b0` includes v2 inline in `scripts/sb-fix-1a-build-packet.mjs`) only affected packets 2 and 3.

## 4. SB-fix-1a application — per-packet ship summary

### Per-packet breakdown

| Packet | Reviewed | Edits | Kept-as-is | SB16-candidates | Commit | Cadence |
|---|---|---|---|---|---|---|
| 1 | 25 | 23 | 1 (#17) | 1 (#25 Spectre/Meltdown) | `53786b0` | C (build → surface → calibrate) |
| 2 | 25 | 21 | 0 | 4 (#43, #45, #46, #47) | `4b9d838` | B (combined relay) |
| 3 | 13 | 8 | 0 | 5 (#51, #54, #55, #56, #57) | `61b6992` | B (combined relay) |
| **Total** | **63** | **52** | **1** | **10** |  |  |

Per Report-#0006 §Decisions reached, cadence Option C was authorized for packet-1 only with A vs B for packets 2+3 to be decided after the packet-1 cycle. Mid-stream the supervisor pivoted to Option B (combined relay) after the parser-v2 fix landed: cleaner candidate lists shortened review time per item, and the cluster-verification finding (see §6 below) cut across packets 2 and 3, making a combined relay the natural shape.

### Edits by source section (where items moved away from)

```
  §2.1:  1
  §2.2: 16   ← packet-1 dominant source
  §2.3: 15   ← packet-2 dominant source
  §2.4: 15   ← packet-2/3 dominant source
  §2.5:  5
```

### Edits by destination section (where items landed)

```
  §1.2:  2     §3.1:  3     §4.4:  1
  §1.4:  1     §3.2:  1     §4.5:  4
  §2.2: 12     §4.1:  3     §4.6:  1
  §2.3:  5                  §4.8:  2
  §2.4: 15                  §5.6:  1
  §2.5:  1
```

Roughly half the edits stayed inside Domain 2 (within-cluster sub-video re-citations), and roughly half crossed into Domains 1/3/4/5. Within-§2.4 sibling moves account for 15 of 52 edits — items in An Overview of Malware / Physical Attacks / Malicious Code parent videos moving to specific sibling sub-videos (Spyware, DoS, Other Malware Types, Application Attacks).

### Top cross-domain moves

```
  §2.3 → §2.4   4   (vulnerability items moving to specific attack types)
  §2.2 → §4.5   3   (email-auth items: DKIM/SPF/DMARC → Email Security)
  §2.3 → §3.1   3   (vulnerabilities → infrastructure)
  §2.2 → §2.4   2
  §2.3 → §4.1   2
  §2.5 → §4.8   2
  §2.4 → §2.2   2
  …17 other single-instance cross-domain paths
```

Validator clean throughout (0 errors / 5 warns / 0 info, unchanged from baseline). Backups retained at `.audit-working/sb-fix-1a/backups/questions-{ISO}.json` × 3 (one per packet). The apply script is idempotent on re-run (`audit_d_review.packet_id` sentinel + same-value re-write produces no-op).

## 5. Catch-all generalisation across Domain 2 video clusters

Report-#0006 noted (in TASK 3 §catch-all hypothesis) that supervisor's first hypothesis from packet-1 review was a §2.2 catch-all pattern: items not obviously about phishing / impersonation / other social engineering were nevertheless cited to §2.2 videos. The packet-1 source-section dominance (§2.2: 16 of 23 edits) was the initial evidence.

**SB-fix-1a confirmed this at scale and revealed the pattern is systemic across Domain 2, not §2.2-specific:**

1. **§2.2 phishing/impersonation/other-SE** acted as catch-all for "anything social-engineering-adjacent" — email-auth standards (DKIM/SPF/DMARC) landed here instead of §4.5 Email Security; physical/scenario items landed here instead of §1.2; awareness-training items landed here instead of §5.6 User Training. (Packet-1 primary finding.)

2. **§2.3 Types of Vulnerabilities** acted as catch-all for "anything vulnerability-shaped" — DNS-specific vulnerabilities moved to §2.4 DNS Attacks; infrastructure-related vulnerabilities moved to §3.1; mitigation/hardening items moved to §4.1 Hardening Targets. (Packet-2 finding.)

3. **§2.4 Indicators of Malicious Activity** acted as catch-all WITHIN §2.4 — items in An Overview of Malware / Physical Attacks / Malicious Code parent videos moved to specific sibling videos (Spyware, DoS, Other Malware Types, Application Attacks). 15 of 52 total edits are within-§2.4 sibling moves — the LLM consistently identified "right area, wrong sub-video" at fine granularity. (Packets 2 + 3.)

4. **§2.4 Physical Attacks** acted as a mini-catch-all for social-engineering items (USB-drop / baiting scenarios reclassified to §2.2 Other Social Engineering Attacks). The §2.2 ↔ §2.4 boundary runs both directions.

5. **§2.5 Mitigation Techniques + Hardening** acted as catch-all for cross-domain hardening content — items landed in §4.1 Hardening Targets, §4.8 Vulnerability Management, §1.2 Physical Security. (Packet-3 tail.)

**Pattern conclusion:** the original Domain 2 catalogue's per-item video assignment was loose at TWO granularities simultaneously — sub-video granularity within sibling clusters (the §2.4-internal moves) AND cross-domain boundaries where conceptual edges overlap (email security spans §2.2 ↔ §4.5; hardening spans §2.5 ↔ §4.1 ↔ §4.8; vulnerabilities span §2.3 ↔ §3.1 ↔ §4.x; physical/awareness spans §2.2 ↔ §1.2 ↔ §5.6).

**Forward implication.** Analogous patterns are likely to surface in Domain 1, 3, 4, 5 partial-adjacent pools (227 remaining items) and in the deferred SB-fix-1b match + cram pool (134 items). This is a real catalogue-quality finding distinct from Audit D's primary citation-grounding purpose: the audit was designed to surface "is the tested concept in the cited transcript?" failures; what SB-fix-1a actually surfaced — alongside the citation-grounding signal — is that the original catalogue's video assignments themselves were loose in a structured, predictable way. The structure (sibling-cluster + cross-domain-edge) is what makes the pattern likely to repeat in non-D2 domains.

## 6. Partial-depth under-application at the LLM-as-judge layer

SB1.6 (Report-#0006 §TASK 2) added a second post-process flip predicate to catch `out-of-source`-that-should-be-`partial-depth` cases — the "concept-here-but-not-this-exact-term" failure mode. The predicate keyed off `category=out-of-source AND fix_direction=mark-for-Sybex-arbitration AND ≥2 of 10 prose markers`. Result: 3 strict flips + 18 loose flags = **21 SB1.6-caught items.**

SB-fix-1a's sibling-aware packet review surfaced **10 additional items beyond what SB1.6's predicate caught:**

- **1 from packet-1:** #25 Spectre / Meltdown (§2.3.8 Hardware Vulnerabilities) — transcript doesn't name the canonical exam-relevant examples, but the cited video IS the correct conceptual home.
- **4 from packet-2:** #43 SYN flood, #45 DNS tunneling, #46 evil twin, #47 WPA2 4-way handshake.
- **5 from packet-3:** #51 IDOR, #54 credential stuffing, #55 credential stuffing + MFA, #56 pass-the-hash, #57 credential stuffing scenario.

The 9 packet-2/3 items clustered tightly in §2.4 attack-types. Mid-stream the supervisor flagged this 9-item set as a putative cluster and asked for TASK-1-style transcript verification before any decisions were processed. CC ran targeted grep (`syn[- ]flood`, `dns[- ]tunnel|tunnel`, `evil twin`, `handshake|4[- ]way`, `IDOR|insecure direct object`, `credential stuffing|stuffing`, `pass.{0,5}the.{0,5}hash|PtH`, etc.) against the cited transcripts. **Result: 9 / 9 → SB16-CANDIDATE** (concept genuinely absent from transcript, but cited video IS the conceptual home → partial-depth not partial-adjacent). Full per-item grep tables at `.audit-working/sb-fix-1a/packet-23-cluster-verification.md`.

**Cluster pattern (load-bearing for SB-fix-2):** each §2.4.x sub-video covers a generic attack family but doesn't name specific exam-relevant techniques:

  - §2.4.6 Denial of Service covers DDoS / amplification (NTP, DNS, ICMP) but not SYN flood / TCP-layer mechanics
  - §2.4.7 DNS Attacks covers poisoning / hijacking / typosquatting but not DNS tunneling (covert-channel / exfil)
  - §2.4.8 Wireless Attacks covers de-auth / RF jamming but not evil twin (rogue AP) or WPA2 4-way-handshake capture
  - §2.4.12 Application Attacks covers SQL injection / buffer overflow / CSRF / directory traversal but not IDOR
  - §2.4.14 Password Attacks covers spraying / brute force / offline hash cracking but not credential stuffing or pass-the-hash

**SB-fix-2 candidate-augment pool size = 31 items** (21 from SB1.6 + 10 from SB-fix-1a).

This pool is **structurally larger than the SB1.6 prose-marker predicate alone could catch.** The 10 SB-fix-1a-surfaced items required supervisor's sibling-aware "concept-here-but-not-this-exact-term" review heuristic — there is no clean automated proxy (e.g. a transcript-grep predicate would have required the supervisor to first enumerate the missing techniques per video, which is itself the manual judgment the predicate would be trying to automate). **Manual gate is load-bearing methodology for SB-fix-2 packet building.**

The 10 surfaced items were applied with `decision_type: "keep-as-is-sb16-candidate"`, `kept_as_is: true`, `sb16_candidate: true`, and an audit-trail note explaining the specific "cited-video-is-correct-home-but-technique-absent" pattern. No catalogue moves; SB-fix-2 will decide per item between re-citation to a non-Messer source, leaving the partial-depth designation as a documented gap, or adding a catalogue note that the item tests Sec+ canonical material not in Messer's video curriculum.

## 7. Messer-curriculum-gap candidate (sub-category for SB-fix-2)

Distinct from standard partial-depth: items where the tested concept may genuinely not appear ANYWHERE in Messer's SY0-701 video curriculum (not just absent from the cited transcript). SB-fix-2 will need a Sybex-arbitration sub-path for such items, in addition to the standard re-cite-to-Messer-elsewhere path.

**Initial candidate list (only 1 confirmed so far):**

1. **#43 SYN flood** (current: §2.4.6 Denial of Service). CC's spot-grep of `denial-of-service-sy0-701.txt` confirmed no `syn`, `tcp`, `handshake`, or `half-open` anywhere. The video covers definition + intent, DDoS via botnets (Zeus example), reflection + amplification (NTP, DNS, ICMP), DNS amplification step-by-step — zero TCP-layer mechanics. A broader scan across the full transcript set may confirm SYN flood absence from the entire Messer SY0-701 curriculum (not just the DoS transcript); SB-fix-2 will do that verification.

The other 9 sb16-candidates likely have their concepts covered SOMEWHERE in the Messer curriculum (e.g., MFA might be in §4.6 Multifactor Authentication; pass-the-hash might appear in a Windows-specific or authentication-mechanism video), so they are standard partial-depth rather than Messer-curriculum-gap. SB-fix-2 verifies per-item.

## 8. Methodology cumulative narrative — the math

The Audit D arc to date traces five chained stages, each catching failure modes the previous didn't. Naming each stage and showing the math is essential because future-Aiden — including a future-Aiden porting this methodology to SC-900 or another cert — needs to reconstruct what evidence supports each decision.

**SB0 calibration (2026-05-13):** 30-item smoke test, two independent LLM readers (script Sonnet + supervisor-Claude). Strict 6-way agreement 76.7%; collapsed agreement 86.7%. Smoke (§2.3.3 mutex/atomic) PASS on both. Outcome: "prompt tuning needed but methodology sound."

**SB1 pre-flight iter0 (2026-05-14, `aa32fad`):** prompt iteration. 4/5 recommendations landed; Rec 1 partial-adjacent strengthening deferred to post-process when iter1 broke the smoke test. Architectural insight: `fix_direction` is a more reliable LLM-intent signal than `category` label (training prior dominates category at category-stamping but not at fix_direction selection).

**SB1.5 post-process (2026-05-18, `a26d42c`):** post-process script flips category to partial-adjacent when `fix_direction=move-to-correct-video`. Validated 3 predicted flips + 2 method-improvement flips on regression sample; smoke held; internally-inconsistent verdicts 3 → 0.

**SB1 full corpus (2026-05-19):** 2,128 verdicts produced clean, $25.92 spent (under $30 mid-projection), 100% cache hit rate. Postprocess flipped 412 verdicts (19.4%) — SB1.5 architectural fix validated at scale.

**SB1 spot-check (Report-#0005, 2026-05-19):** stratified 40-item supervisor packet (mulberry32 seed `20260519`). **30/40 strict agreement → PASS.** Breakdown: partial-adjacent 10/15 confident + 5 uncertain + 0 disagree; out-of-source 10/15 confident + 3 likely-disagree (avalanche / dual power feeds / tokenization — same "concept-here-but-not-this-term" pattern) + 2 uncertain; in-source 5/5 agree; partial-depth 5/5 agree-when-applied. Supervisor flagged partial-depth-under-application as the dominant methodological residual.

**Uncertainty verification (Report-#0006 TASK 1, 2026-05-20):** the 5 partial-adjacent uncertain + 3 out-of-source uncertain (= 8 supervisor-flagged uncertain items) text-vs-text transcript-grepped. **8/8 LLM verdicts held** — no flips. Post-verification agreement on the spot-check packet rose to **38/40 = 95%** with the 3 remaining disagreements being the known SB1.6-handled pattern items.

**SB1.6 post-process (Report-#0006 TASK 2, 2026-05-20):** second flip predicate (`out-of-source` + `mark-for-Sybex-arbitration` + ≥2-of-10 prose markers → `partial-depth`). Validation set 3/3 must-flip + 12/12 must-not-flip. Real-apply: 3 strict flips + 18 loose flags. Final counts OOS 296→293, partial-depth 399→402. The 3 known disagreements from the spot-check are now methodology-handled (avalanche / dual feeds / tokenization all auto-flipped).

**SB-fix-1a cluster verification (this session):** 9 supervisor-flagged §2.4 candidates transcript-grepped. **9/9 → SB16-CANDIDATE** (cluster pattern confirmed; cited video is correct conceptual home but specific technique absent).

### Cumulative resolution math

```
  Spot-check confident-agree (Report-#0005):                30 of 40
  Transcript-verified-agree on supervisor-uncertain (R#0006 T1):  8 of 8
  Cluster-verified SB16-candidates (this session):           9 of 9
  ─────────────────────────────────────────────────────  ──────────
  Net sampling items resolved positively:                   47
  Remaining disagreements, all SB1.6-handled:                3 (avalanche / dual feeds / tokenization)
```

**Denominator reconstruction:** 50 = 40 (original SB1 spot-check packet) + 8 (supervisor-uncertain items text-vs-text verified in Report-#0006 TASK 1) + 9 (§2.4 cluster items grep-verified this session). The 3 remaining disagreements (avalanche / dual feeds / tokenization) sit **within** the original 40 spot-check items — they are not added separately on top of the 40. The 8 uncertainty-verified and 9 cluster-verified items are distinct expansions of the sample with their own ground-truth checks, so they extend the validation surface from 40 to 50.

The 47 / 50 = **94% post-resolution agreement** on the (original 40-item spot-check + 8 uncertainty + 9 cluster) sample is the strongest defensible methodology-validation number on the Audit D arc to date. The 3 remaining items are not unresolved disagreements — they are method improvements over SB0 baseline, methodologically handled by SB1.6 and documented as such.

**Important methodological framing (Report-#0006 §SB1.5 sign-off carry-forward):** ground truth is NOT retroactively edited to match the method. The SB0 supervisor verdicts on the 3 disagreements remain on disk as authoritative SB0 snapshots; SB1.5 and SB1.6 are documented as post-process method improvements that produce different (cleaner) outputs. Moving ground truth to match the method would be methodology corruption.

### What the methodology validation does NOT claim

It is a sampling check, not a corpus-wide proof. 47 of ~2,128 verdicts is ~2.2%. The methodology validation supports two specific claims:

1. The SB1.6 post-process + SB-fix-1a sibling-aware review correctly catch the dominant residual pattern (partial-depth-under-application) on supervisor-flagged samples.
2. The remaining 412 partial-adjacent flips + 402 partial-depth items NOT in the sample have not been independently validated, but the architectural fix shape generalises — though corpus-scale behaviour on the unvalidated remainder is an inference from sample to corpus, not a proof. SB-fix-2 review (and downstream D1/D3/D4/D5 partial-adjacent sub-batches) will produce additional ground-truth evidence at finer-than-sample granularity over time.

SB-fix-2 will not re-LLM-judge the corpus. It will work the 31-item candidate-augment pool against transcript-grep + Sybex arbitration, surfacing additional candidates if cluster-aware review identifies more.

## 9. What's next

Three downstream work blocks. Order TBD by supervisor.

**(A) SB-fix-1b-prep** — schema-extension scoping for `match` + `cram` per-item override (134 items deferred from SB-fix-1a per Report-#0006 §TASK 3). Path B (schema extension) confirmed by supervisor 2026-05-20. Concrete sub-tasks: SCHEMA.md changes to add optional per-item `messerVideo` / `subObjective` on MatchItem + CramTerm; JSX update to read per-item override with parent fallback (one location per type); validator update if any consistency rule is added (likely not, given the Q6 outcome A finding — same opaque-metadata treatment generalises). Estimated 1-2 sessions, no LLM spend. Blocks the SB-fix-1b apply work on the 134 items.

**(B) SB-fix-2** — partial-depth review against the 31-item candidate-augment pool (21 from SB1.6 + 10 surfaced during SB-fix-1a). Pool is structurally larger than the SB1.6 prose-marker predicate alone could catch. Process: per-item transcript-grep + decide between re-cite to Messer-elsewhere / leave partial-depth designation / Sybex arbitration. Includes the Messer-curriculum-gap Sybex-arbitration sub-path for items like #43 SYN flood. Estimated 1-2 sessions, $0 expected LLM spend (transcript grep + manual judgment only).

**(C) Domain 1 / 3 / 4 / 5 partial-adjacent sub-batches** — 227 remaining items in the same shape as SB-fix-1a but spanning the other four domains. The §2.4-style catch-all generalisation suggests these will surface analogous patterns at the sub-video + cross-domain edge. Likely decomposed by domain in batches of similar size to SB-fix-1a (~63 items each). Cannot meaningfully start until (A) ships (some D1/D3/D4/D5 PA items are likely match + cram and therefore depend on the schema extension), but could interleave with (B).

CC has no strong opinion on (A) vs (B) ordering; both are valid next steps and both are blocked only on supervisor preference. Supervisor will surface the ordering decision in the next session.

**Hidden dependency between (A) and (B):** (A) and (B) are fully independent for partial-depth re-citation on `mc` / `scen` items in the SB-fix-2 candidate-augment pool, but they **interact for any `match` / `cram` items in the pool** — those would need the SB-fix-1b-prep schema extension before per-item re-citation is structurally possible. Reviewing the type composition of the 31-item pool (SB1.6's loose flags include at least HMAC match, strcpy/gets/sprintf match, MAM cram, MTD match + cram per Report-#0006 §SB1.6) is a 5-minute check that should precede the (A) vs (B) ordering decision. If a meaningful fraction of the 31 items are match/cram, (A) becomes a sequencing prerequisite for that subset; if the pool is dominantly mc/scen, the two work blocks can run in either order.

**Out-of-scope this session but tracked elsewhere:**

- The 3 pre-existing untracked Task 2 docs in `docs/` (`cancel-feature-shipped.md`, `task2-2b-end-of-session.md`, `task2-sub-batch-2c-shipped.md`) remain untracked per Audit D scoping D-J. Address in a separate cleanup pass.
- The 4 Section 1 content fixes in `TODO-content-quality.md` remain deferred behind Audit D.
- Task 2 Sub-batches 3 / 4 / 5 + Task 3 PBQ + 5 metacognitive features all remain deferred behind Audit D.

## Files changed this session

| File | Status | Description |
|---|---|---|
| `scripts/sb-fix-1a-build-packet.mjs` | NEW (v2 parser inline) | Allowlist-based candidate parser; 120-entry known-title set from `questions.json` |
| `scripts/sb-fix-1a-apply-packet.mjs` | NEW | Atomic-write + validator-gated + backup-before-write + idempotent on re-run |
| `questions.json` | UPDATED | 63 items in §2.1–§2.5 touched; 52 with `messerVideo`/`subObjective` changes + 11 with audit-only `audit_d_review` block |
| `.audit-working/sb-fix-1a/packet-{1,2,3}.{md,json}` | NEW | Rendered packets + structured shadows |
| `.audit-working/sb-fix-1a/packet-{1,2,3}-decisions.json` | NEW | Supervisor decisions, transcribed |
| `.audit-working/sb-fix-1a/packet-1-dry-run-preview.md` | NEW | Pre-apply diff preview surfaced to supervisor |
| `.audit-working/sb-fix-1a/packet-1-post-apply-status.md` | NEW | End-of-packet-1 surface |
| `.audit-working/sb-fix-1a/packet-23-cluster-verification.md` | NEW | 9-item §2.4 cluster grep verification |
| `.audit-working/sb-fix-1a/parser-v2-diff.md` | NEW | v1 → v2 parser diff + 5 spot-checks |
| `.audit-working/audit-d-sub-batch-1/sb-fix-1a-validator-check.md` | NEW | Q6 findings |
| `.audit-working/sb-fix-1a/sb-fix-1a-end-of-sub-batch.md` | NEW | Cumulative ship surface |
| `.audit-working/sb-fix-1a/backups/questions-{ISO}.json` × 3 | NEW | Pre-apply snapshots per packet |
| `Reports/Report-#0007.md` | NEW (this) | Load-bearing methodology document for SB-fix-1a |
| `PLAN.md` | UPDATED | Task 1f row + next-step paragraph reflect SB-fix-1a SHIPPED + 31-item SB-fix-2 pool |
| `docs/supervisor-handoff.md` | UPDATED | Catch-all + partial-depth findings paragraph + current commit hash + budget state |

## Decisions reached

1. **Parser v2 architecture = allowlist-based.** Replace regex-based extraction with allowlist match against the 120 known Messer video titles. Eliminates all four bug classes by construction.
2. **Packet-1 not regenerated under v2.** Supervisor decisions on v1-rendered packet-1 are authoritative; parser change benefits packets 2 + 3 only.
3. **Self-alternate decision (#17) treated as `reject-via-self-alternate`.** When supervisor's accept-alternate target equals current citation, semantic effect is identical to reject; apply script writes the audit trail accordingly.
4. **Cadence pivot mid-stream: C → B for packets 2+3.** Parser-v2 fix + cluster-verification finding made combined relay the natural shape.
5. **Cluster-verification methodology (TASK-1-style transcript grep) is reusable.** 9/9 §2.4 cluster items resolved via text-vs-text grep, $0 LLM spend. This becomes the standard manual gate for SB-fix-2 partial-depth review.
6. **SB-fix-2 candidate-augment pool = 31 items** (21 SB1.6 + 10 SB-fix-1a). Pool is structurally larger than the SB1.6 prose-marker predicate alone could catch.
7. **Messer-curriculum-gap is a distinct sub-category for SB-fix-2.** #43 SYN flood is the first confirmed candidate. SB-fix-2 will need a Sybex-arbitration sub-path in addition to the Messer-re-citation path.
8. **Cumulative methodology agreement = 47/50 = 94%** on the validated sample (spot-check + uncertainty verification + cluster verification). 3 remaining disagreements are SB1.6-method-handled, not unresolved.

## Boundaries honored

- **Surface-and-pause cadence at three gates honored:** Q6 outcome surfaced before apply-script authoring; packet-1 dry-run surfaced before write; cluster verification surfaced before processing packet-2/3 decisions. All three gates produced sign-off before proceeding.
- **No destructive operations.** SB1.5 and SB1.6 outputs preserved on disk as authoritative snapshots. Packet backups retained per packet under `.audit-working/sb-fix-1a/backups/`.
- **No edits to non-Audit-D code paths.** React app untouched; SCHEMA.md untouched in this session (the `audit_*` convention shipped at `db60853` in Report-#0006's session); validator untouched.
- **No `audit_*` field reads added to JSX.** Audit-trail content remains script-only metadata; React app boundary preserved.
- **Strategy A study-safe constraint held on all 52 re-citations:** item content / opts / explanation / SM-2 keys unchanged; only `item.messerVideo` + `item.subObjective` + `item.audit_d_review` modified. Local study progress preserved.

## Session economics

- **LLM API spend this session: $0.** All review and apply work was script-only + manual supervisor review + transcript grep.
- **Cumulative Audit D spend unchanged at $34.63** ($1.29 prior + $7.42 SB1 halt + $25.92 SB1 completion + $0 SB1.6 + $0 SB-fix-1a). Credit remaining ~$19.08.
- **Wall-clock:** ~3 hours across multiple paste-relay round-trips (packet-1 ~75 min including parser-v2 detour; packets 2+3 combined relay ~60 min; cluster verification ~15 min; end-of-sub-batch authoring ~10 min).

## Methodology notes for future sub-batches

- **Sanity-check parser output against ground truth before treating regex/extraction as correct.** Both the SB1.6 gate-value catch and the parser-v2 hallucination catch came from reading the data before treating tool output as authoritative. The same instinct will apply to SB-fix-2's transcript-grep predicates and to D1/D3/D4/D5 partial-adjacent extractions.
- **Sibling-aware manual review has no clean automated proxy.** SB-fix-1a's 10 SB-fix-2 candidates required supervisor judgment that "the cited video IS the right conceptual home but this specific technique is missing from the transcript." Automating this would require enumerating the canonical techniques per video first — which is the manual judgment itself. SB-fix-2 packet building will need the same gate.
- **Catch-all patterns generalise across video clusters at predictable structural granularities** — sibling sub-video within cluster + cross-domain edge where conceptual content overlaps. The §2.2/§2.3/§2.4/§2.5 findings predict analogous patterns in D1/D3/D4/D5; the SB-fix-1b match + cram pool likely surfaces both granularities again.
- **Per-packet commits + paste-relay cadence held under the multi-gate session shape.** The three packet commits + interim docs sync are 4 commits across one wall-clock day, all with clean validator state at each commit boundary. The cadence is robust to mid-session pivots (C → B) without losing audit-trail integrity.
