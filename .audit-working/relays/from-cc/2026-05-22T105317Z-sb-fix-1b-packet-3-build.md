# SB-fix-1b packet 3 — build status + supervisor review surface

NONCE: 2026-05-22T105317Z-58b94fe0

## Build summary

Packet 3 of 6, items 51–100 of 134 in the D2 partial-adjacent
match + cram scope. 50 items (cadence Rule 1 default). First
packet to enter the §2.4 cluster (Report-#0007 §6 predicted
elevated sb16-candidate surfacing).

| Field | Value |
|---|---|
| Packet | 3 |
| Slice | items 51–100 (size 50) of 134 |
| Match items | 24 |
| Cram items | 26 |
| §2.3 items | 16 |
| §2.4 items | 34 |
| Parser primary-destination yield | 27 / 50 |
| Clusters (≥3 items same parent) | 8 |

Build artefacts (working copies in `.audit-working/sb-fix-1b/`,
gitignored per precedent — content inlined below):

- `packet-3.md` (1545 lines, 66 KB) — base build output
- `packet-3-cluster-verification.md` (755 lines, 25 KB) — Rule 2 pre-analysis
- `packet-3-cross-packet-hints.md` (315 lines, 11 KB) — Rule 5 pre-analysis
- `packet-3-augmented.md` (2173 lines, 92 KB) — the supervisor review surface, with Rule 2 + Rule 5 pre-analysis inlined per cluster/cross-packet item

The augmented packet is reproduced verbatim in §"Augmented
packet — supervisor review surface" below.

## Cluster verification summary (Rule 2)

Per cadence Rule 2 (inline cluster verification at build time):
for each cluster of ≥3 items in the same parent video, CC
pre-grepped the item's specific term/answer against the cited
transcript + parser primary destination + corpus-wide if both
missed.

| Cluster | Items | Patterns |
|---|---|---|
| §2.3 2.3.10 "Cloud-specific Vulnerabilities" | 5 | `messer-curriculum-gap`=3, `partial-depth`=2 |
| §2.3 2.3.13 "Memory Injections" | 4 | `messer-curriculum-gap`=4 |
| §2.3 2.3.9 "Virtualization Vulnerabilities" | 3 | `messer-curriculum-gap`=2, `alternate-hit`=1 |
| §2.4 2.4.1 "An Overview of Malware" | 6 | `partial-depth`=2, `messer-curriculum-gap`=2, `destination-hit`=2 |
| §2.4 2.4.4 (various) | 7 | `cited-hit`=1, `destination-hit`=4, `messer-curriculum-gap`=2 |
| §2.4 2.4.5 (various) | 5 | `messer-curriculum-gap`=4, `partial-depth`=1 |
| §2.4 2.4.7 (various) | 6 | `partial-depth`=2, `messer-curriculum-gap`=4 |
| §2.4 2.4.8 (various) | 5 | `messer-curriculum-gap`=5 |

**Heavy `messer-curriculum-gap` rate (~25 of 41 cluster items).**
This aligns with Report-#0007 §6 prediction that §2.4 (and
adjacent §2.3 cloud topics) would surface elevated sb16-
candidates. The classifier uses **exact-phrase grep** of the
item's term/answer — supervisor should treat
`messer-curriculum-gap` as a candidate label, not a final
verdict. Known terminology-variant misses:

- "fileless malware" → real transcript says "fileless virus"
  (viruses-and-worms-sy0-701.txt). Concept IS covered;
  exact-phrase grep missed it. (Items #67, #70.)
- "C2 (Command and Control)" → "command and control" appears
  in dos-sy0-701 + web-filtering-sy0-701 transcripts; bare
  "C2" doesn't. Exact-phrase grep correctly returned 0 for
  "C2" + "C2 (Command and Control)" + "c2 command". Concept
  IS in corpus under different phrasing. (Items #68, #71.)

The supervisor's `cited-hit`/`destination-hit` calls in the
augmented packet take precedence over these classifier
flags — CC's pre-analysis is a starting point, not a final
verdict (cadence Rule 3 — supervisor judgment gates item
decisions).

## Cross-packet consistency summary (Rule 5)

Per cadence Rule 5 (pre-annotation): each item is matched
against the 113-item prior-decisions corpus (SB-fix-1a packets
1–3 mc + scen + SB-fix-1b packets 1–2 match + cram) by
Jaccard similarity on 1–3-token concept noun phrases (stop-
words filtered), with a +0.15 bonus for same-parent-video
matches and +0.05 for same-section matches.

| Metric | Value |
|---|---|
| Items with at least one consistency hint | 18 / 50 |
| Items with score ≥ 0.30 (precedent suggestion synthesised) | ~8 / 50 |
| Items with score ≥ 0.40 (high confidence) | 1 / 50 |

The 60–80% match rate predicted by Report-#0007 §5 catch-all
generalisation isn't fully visible because:

- §2.4 (34 of 50 items) wasn't deeply re-cited in SB-fix-1a
  mc+scen — the parent videos there hadn't gathered prior
  decisions yet, so cross-packet matches naturally thin out.
- §2.3.9 + §2.3.10 (8 items) DO show clear consistency hints
  pointing at "3.1 - Cloud Infrastructures" — those mirror
  SB-fix-1a #2 #27 + #28 + #29.

The 1 "high-confidence" (score ≥ 0.40) item is #52 (§2.3.9
match[2] "Type 1 hypervisor runs on" → "Bare metal hardware")
which precedent-suggests `accept-primary → 3.1 - Cloud
Infrastructures` based on SB-fix-1b packet 2 #50 (Type 1
hypervisor cram).

## Mid-stream findings (Rule 6)

No expansion findings to capture this packet. The
terminology-variant misses noted above are characterised in
this status block + the augmented packet's pre-analysis
blocks — they're known limits of the exact-phrase classifier,
not unexpected catches. No new file in
`.audit-working/findings/`.

## Composition table (by parent video)

| Section | Video | Type | Items | Packet range |
|---|---|---|---|---|
| §2.3 | 2.3.9 | cram | 1 | #51 |
| §2.3 | 2.3.9 | match | 2 | #52–#53 |
| §2.3 | 2.3.10 | cram | 3 | #54–#56 |
| §2.3 | 2.3.10 | match | 2 | #57–#58 |
| §2.3 | 2.3.12 | cram | 1 | #59 |
| §2.3 | 2.3.12 | match | 1 | #60 |
| §2.3 | 2.3.13 | cram | 2 | #61–#62 |
| §2.3 | 2.3.13 | match | 2 | #63–#64 |
| §2.3 | 2.3.14 | match | 2 | #65–#66 |
| §2.4 | 2.4.1 | cram | 3 | #67–#69 |
| §2.4 | 2.4.1 | match | 3 | #70–#72 |
| §2.4 | 2.4.3 | cram | 1 | #73 |
| §2.4 | 2.4.3 | match | 1 | #74 |
| §2.4 | 2.4.4 | cram | 4 | #75–#78 |
| §2.4 | 2.4.4 | match | 3 | #79–#81 |
| §2.4 | 2.4.5 | cram | 3 | #82–#84 |
| §2.4 | 2.4.5 | match | 2 | #85–#86 |
| §2.4 | 2.4.6 | cram | 1 | #87 |
| §2.4 | 2.4.6 | match | 1 | #88 |
| §2.4 | 2.4.7 | cram | 3 | #89–#91 |
| §2.4 | 2.4.7 | match | 3 | #92–#94 |
| §2.4 | 2.4.8 | cram | 3 | #95–#97 |
| §2.4 | 2.4.8 | match | 2 | #98–#99 |
| §2.4 | 2.4.9 | cram | 1 | #100 |

## What supervisor reviews

Per cadence Rule 3 (supervisor gates item decisions + dry-run
only), the review of this packet covers:

1. Item-by-item decisions for all 50 items (accept-primary /
   accept-alternate / manual / reject / sb16-candidate / defer).
2. Acceptance or override of CC's pre-analysis (cluster
   verdicts, cross-packet hints).
3. After CC produces the dry-run preview from the recorded
   decisions: one round-trip dry-run review.

Not gated:

- Parser candidate yield (already inline)
- Cluster grep mechanics (already inline)
- Cross-packet match mechanics (already inline)
- Validator output (will be surfaced inline post-apply if non-clean)
- Apply-script mechanics (debugged + trusted)

## Next gate

Supervisor reviews the augmented packet below + records 50
decisions in the `decision` field of each item. Returns the
marked-up packet via the relay (supervisor writes response
file → `create_file` + `present_files` → Aiden downloads +
messages CC the path → CC copies to from-supervisor/, commits,
pushes, processes decisions).

CC then transcribes decisions to `.audit-working/sb-fix-1b/packet-3-decisions.json`, generates the dry-run preview, surfaces
for supervisor sign-off, runs the apply script, commits the
real apply with the per-packet message convention, and
surfaces the end-of-packet status with validator results.

═══════════════════════════════════════════════════════════════
Augmented packet — supervisor review surface
═══════════════════════════════════════════════════════════════

# SB-fix-1b packet 3 — Domain 2 partial-adjacent re-citation review (match + cram)

Generated: 2026-05-22T10:45:31.148Z
Source: `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json`
Filter: `category=partial-adjacent` AND `location.section startsWith "2."` AND `type in {match, cram}`
Scope total (across all packets): 134 items
This packet: items 51–100 of 134 (size 50)

## How to review

For each item below: read the **Item content**, then the **LLM justification**, then choose ONE decision option.

Match items show `Prompt` (left-column phrase) → `Answer` (right-column phrase). Cram items show `Term` → `Def`. Match/cram have less content per item than mc/scen — review tempo should be faster.

Decision options:
- **accept primary** — parser's first suggestion is the right destination. Apply script will write `item.messerVideo` (new per-item override field, added in SB-fix-1b-prep) and `item.subObjective` to the named target.
- **accept alternate** — parser found multiple candidates; you pick which.
- **manual** — parser suggestion is wrong; provide the correct messerVideo title AND sub-objective number. Format: `"X.Y - Title" / X.Y.Z`.
- **reject** — LLM was wrong; item really does belong where currently cited (i.e. inherits parent correctly). Apply script will write `audit_d_review.kept_as_is = true` so the item won't be re-flagged in future audit passes.
- **defer** — edge case; pull this item into a later packet for re-discussion. No edit applied.

Once decisions are recorded, return the marked-up packet to CC.


> **Pre-analysis augmentation per cadence Rules 2 + 5.** Each item below
> may carry a `🔍 Cadence Rule 2 + 5 — pre-analysis` block immediately
> above the decision checkboxes. The block contains CC's pre-computed
> cluster verification verdict (Rule 2 — grep against cited + parser
> destinations + corpus-wide for terms in cluster items) and
> cross-packet consistency hints (Rule 5 — Jaccard concept match against
> SB-fix-1a packets 1-3 + SB-fix-1b packets 1-2 decisions).
>
> Supervisor reviews the pre-analysis as part of the normal item-by-item
> pass. Disagreements with the pre-analysis are normal — flag them in the
> decision rather than as a separate gate.

---

### Item 51. §2.3 2.3.9 cram[4]

**Parent video:** 2.3 - Virtualization Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Virtualization Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   Type 2 hypervisor
Def:    Runs on top of a host operating system. Examples: VirtualBox, VMware Workstation.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The cited transcript discusses hypervisors, VM escapes, and resource reuse but never defines or distinguishes Type 1 vs Type 2 hypervisors. The concept of hypervisor types is a foundational virtualization architecture topic that likely appears in a different Messer video covering virtualization basics, not in this vulnerability-focused video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Type 2 hypervisor` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 2 prior-adjudicated item(s) match.
  - SB-fix-1b packet 2 #50 (Jaccard 0.125 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
  - SB-fix-1a #2 #27 (Jaccard 0.092 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 52. §2.3 2.3.9 match[2]

**Parent video:** 2.3 - Virtualization Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Virtualization Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Type 1 hypervisor runs on
Answer: Bare metal hardware (no host OS)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript does not mention hypervisor types (Type 1/Type 2) or the bare-metal architecture distinction. The video focuses exclusively on VM escape and resource reuse vulnerabilities. Type 1 vs Type 2 hypervisor architecture is a foundational infrastructure concept that would logically belong in Section 3.1 'Cloud Infrastructures' or 'Network Infrastructure Concepts' videos, not in a vulnerability-focused video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Bare metal hardware (no host OS)` | 0 | (no destination) | — |
    | `Bare metal hardware` | 0 | (no destination) | — |
    | `bare metal hardware no host os` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 2 prior-adjudicated item(s) match.
  - SB-fix-1b packet 2 #50 (Jaccard 0.36 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
  - SB-fix-1a #2 #27 (Jaccard 0.069 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`

  - **By-precedent suggestion:** accept-primary → `3.1 - Cloud Infrastructures`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 53. §2.3 2.3.9 match[3]

**Parent video:** 2.3 - Virtualization Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Virtualization Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Type 2 hypervisor runs on
Answer: A host operating system
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses hypervisors and virtual machines but never distinguishes between Type 1 and Type 2 hypervisors. The concept of Type 2 hypervisors running on a host operating system (versus Type 1 bare-metal hypervisors) is Security+ curriculum material but belongs in a different video, most likely '3.1 - Cloud Infrastructures' or '3.1 - Other Infrastructure Concepts' where hypervisor architectures would be introduced.

**Parser-suggested destinations:**
- (primary) `3.1 - Cloud Infrastructures`
- (alternate) `3.1 - Other Infrastructure Concepts`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** alternate-hit — primary missed but an alternate destination has the term. Consider accept-alternate.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `A host operating system` | 0 | 0 | 3.1 - Other Infrastructure Concepts: 1 |
    | `host operating system` | 0 | 0 | 3.1 - Other Infrastructure Concepts: 5 |

- **Cross-packet consistency (Rule 5):** 2 prior-adjudicated item(s) match.
  - SB-fix-1b packet 2 #50 (Jaccard 0.1 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
  - SB-fix-1a #2 #27 (Jaccard 0.062 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 54. §2.3 2.3.10 cram[0]

**Parent video:** 2.3 - Cloud-specific Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Cloud-specific Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   Shared responsibility model
Def:    Cloud security responsibilities split between provider and customer. Provider secures infrastructure; customer secures data/config.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The shared responsibility model concept does not appear in this transcript. The video focuses on specific attack types against cloud applications (DoS, directory traversal, code injection, etc.) and poor security practices, but never discusses the division of security responsibilities between cloud provider and customer. This is a fundamental cloud security concept that likely appears in a different video covering cloud infrastructure or governance (possibly '3.1 - Cloud Infrastructures' or a security governance video in Section 5).

**Parser-suggested destinations:**
- (primary) `3.1 - Cloud Infrastructures`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Shared responsibility model` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 2 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #28 (Jaccard 0.214 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
  - SB-fix-1a #2 #29 (Jaccard 0.132 — same parent video): accept-primary → `2.3 - Misconfiguration Vulnerabilities`

  - **By-precedent suggestion:** accept-primary → `3.1 - Cloud Infrastructures`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 55. §2.3 2.3.10 cram[2]

**Parent video:** 2.3 - Cloud-specific Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Cloud-specific Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   Insecure APIs
Def:    Cloud services accessed via APIs — poorly secured APIs are a major attack vector.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses cloud application vulnerabilities (DoS, authentication bypass, directory traversal, unpatched systems, code injection, etc.) but does not mention APIs at all, let alone 'insecure APIs' as an attack vector. APIs are a distinct cloud security topic likely covered in a different video. This is a clear case where the tested concept is curriculum-relevant but absent from the cited source.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Insecure APIs` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 56. §2.3 2.3.10 cram[3]

**Parent video:** 2.3 - Cloud-specific Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Cloud-specific Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   Data sovereignty
Def:    Data must remain in specific geographic regions due to legal requirements — cloud complicates this.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers cloud application vulnerabilities (DoS, authentication bypass, directory traversal, unpatched systems, Log4j/Spring Cloud, XSS, SQL injection) but never mentions data sovereignty, geographic data residency requirements, or legal/compliance constraints on data location. This is a legitimate Security+ concept that likely appears in cloud infrastructure or governance videos (e.g., '3.1 - Cloud Infrastructures' or '5.4 - Compliance'), but is absent from this vulnerability-focused transcript.

**Parser-suggested destinations:**
- (primary) `3.1 - Cloud Infrastructures`
- (alternate) `5.4 - Compliance`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: states-of-data-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Data sovereignty` | 0 | 0 | 5.4 - Compliance: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Data sovereignty`: states-of-data-sy0-701.txt (×3)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 57. §2.3 2.3.10 match[1]

**Parent video:** 2.3 - Cloud-specific Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Cloud-specific Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Provider secures infrastructure; customer secures data
Answer: Shared responsibility model
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The shared responsibility model is a fundamental cloud security concept that defines the division of security duties between cloud provider and customer. This transcript focuses entirely on cloud-specific attack vectors (DoS, directory traversal, authentication bypass, code injection) and vulnerability management concerns, but never mentions, describes, or teaches the shared responsibility model concept. This concept almost certainly appears in '3.1 - Cloud Infrastructures' or another foundational cloud architecture video in Section 3.1, making this partial-adjacent rather than fully out-of-source.

**Parser-suggested destinations:**
- (primary) `3.1 - Cloud Infrastructures`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Shared responsibility model` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 2 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #28 (Jaccard 0.203 — same parent video): accept-primary → `3.1 - Cloud Infrastructures`
  - SB-fix-1a #2 #29 (Jaccard 0.125 — same parent video): accept-primary → `2.3 - Misconfiguration Vulnerabilities`

  - **By-precedent suggestion:** accept-primary → `3.1 - Cloud Infrastructures`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 58. §2.3 2.3.10 match[3]

**Parent video:** 2.3 - Cloud-specific Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Cloud-specific Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Legal requirement for data to stay in specific regions
Answer: Data sovereignty
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of data sovereignty (legal requirements for data to remain in specific geographic regions) does not appear in this transcript. The transcript focuses on application-layer vulnerabilities in cloud environments (DoS, authentication bypass, directory traversal, unpatched systems, code injection) but never discusses data residency, geographic restrictions, or compliance requirements related to where data is physically stored. Data sovereignty is a legitimate Security+ concept that likely appears in a different Messer video covering cloud infrastructure concepts, governance, or compliance topics.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: states-of-data-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Data sovereignty` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Data sovereignty`: states-of-data-sy0-701.txt (×3)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 59. §2.3 2.3.12 cram[2]

**Parent video:** 2.3 - Misconfiguration Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Misconfiguration Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   Weak cipher suites
Def:    Using outdated/weak encryption algorithms (SSL, DES, MD5) when stronger ones are available.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses insecure protocols (Telnet, FTP, SMTP, IMAP, HTTP) that send traffic in the clear, but never mentions weak cipher suites, SSL, DES, MD5, or the concept of choosing between stronger vs. weaker encryption algorithms when encryption IS being used. The transcript's encryption discussion is binary (no encryption vs. encryption), not about cipher suite strength. This concept likely belongs in a cryptography-focused video such as '1.4 - Encryption Technologies' or '1.4 - Hashing and Digital Signatures'.

**Parser-suggested destinations:**
- (primary) `1.4 - Encryption Technologies`
- (alternate) `1.4 - Hashing and Digital Signatures`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 60. §2.3 2.3.12 match[1]

**Parent video:** 2.3 - Misconfiguration Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Misconfiguration Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Using SSL instead of TLS for HTTPS
Answer: Weak cipher suite misconfiguration
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses insecure protocols (HTTP, Telnet, FTP, SMTP, IMAP) and the importance of using secure alternatives (HTTPS, SSH, SFTP), but does not mention SSL, TLS, cipher suites, or the distinction between SSL and TLS versions. The concept of weak cipher suite configuration is a legitimate Security+ topic that belongs in cryptographic or secure communication videos (likely '1.4 - Encryption Technologies' or '4.5 - Secure Protocols'), not in this general misconfiguration overview.

**Parser-suggested destinations:**
- (primary) `1.4 - Encryption Technologies`
- (alternate) `4.5 - Secure Protocols`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 61. §2.3 2.3.13 cram[4]

**Parent video:** 2.3 - Mobile Device Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Mobile Device Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   SIM swapping
Def:    Attacker social engineers carrier to transfer victim's number to attacker-controlled SIM.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> SIM swapping is not mentioned or taught in this transcript. The video covers jailbreaking, rooting, sideloading, and MDM bypass — mobile device OS/firmware security issues. SIM swapping is a social engineering attack against cellular carriers that likely belongs in a social engineering, mobile security settings, or authentication video (possibly '2.2 - Other Social Engineering Attacks' or '4.1 - Securing Wireless and Mobile').

**Parser-suggested destinations:**
- (primary) `2.2 - Other Social Engineering Attacks`
- (alternate) `4.1 - Securing Wireless and Mobile`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `SIM swapping` | 0 | 0 | 4.1 - Securing Wireless and Mobile: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #32 (Jaccard 0.11 — same parent video): manual → `2.2 - Other Social Engineering Attacks` / `2.2`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 62. §2.3 2.3.13 cram[5]

**Parent video:** 2.3 - Mobile Device Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Mobile Device Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Term:   Bluesnarfing
Def:    Unauthorized data access via Bluetooth.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept 'bluesnarfing' (unauthorized data access via Bluetooth) does not appear in the cited transcript. The transcript covers jailbreaking, rooting, and sideloading but contains no discussion of Bluetooth vulnerabilities. This is clearly a Security+ relevant concept that likely belongs in '2.4 - Wireless Attacks' or a similar wireless security video.

**Parser-suggested destinations:**
- (primary) `2.4 - Wireless Attacks`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Bluesnarfing` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 63. §2.3 2.3.13 match[3]

**Parent video:** 2.3 - Mobile Device Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Mobile Device Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Attacker convinces carrier to transfer victim's phone number
Answer: SIM swapping
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of SIM swapping (attacker convincing carrier to transfer victim's phone number) does not appear in this transcript. The transcript covers jailbreaking, rooting, sideloading, and mobile device management security concerns, but contains no discussion of SIM cards, carrier fraud, or phone number portability attacks. This is a legitimate mobile security vulnerability that should be covered in the SY0-701 curriculum, making this partial-adjacent rather than out-of-source, but I cannot identify the specific correct Messer video from the inventory provided. The concept is clearly Security+-relevant mobile device security content.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `SIM swapping` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #32 (Jaccard 0.093 — same parent video): manual → `2.2 - Other Social Engineering Attacks` / `2.2`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 64. §2.3 2.3.13 match[4]

**Parent video:** 2.3 - Mobile Device Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Mobile Device Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Unauthorized data access via Bluetooth
Answer: Bluesnarfing
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers mobile device vulnerabilities related to jailbreaking, rooting, and sideloading, but does not mention Bluetooth attacks, Bluesnarfing, or any Bluetooth-related vulnerabilities. Bluesnarfing is a legitimate Security+ concept involving unauthorized Bluetooth data access, but it does not appear in this video. This likely belongs in '2.4 - Wireless Attacks' or another wireless-focused video.

**Parser-suggested destinations:**
- (primary) `2.4 - Wireless Attacks`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Bluesnarfing` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 65. §2.3 2.3.14 match[1]

**Parent video:** 2.3 - Zero-day Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Zero-day Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Researcher notifies vendor before going public
Answer: Responsible disclosure
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers zero-day vulnerabilities and attack cycles but never discusses disclosure processes or the distinction between responsible/coordinated disclosure versus other disclosure models. The concept of 'responsible disclosure' (researcher notifying vendor before public release) is a legitimate Security+ topic that belongs in vulnerability management or security assessment contexts, most likely '4.3 - Vulnerability Scanning' or '5.5 - Penetration Tests' where disclosure processes are typically taught.

**Parser-suggested destinations:**
- (primary) `4.3 - Vulnerability Scanning`
- (alternate) `5.5 - Penetration Tests`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 66. §2.3 2.3.14 match[2]

**Parent video:** 2.3 - Zero-day Vulnerabilities
**Currently cited as:** `(inherits parent: 2.3 - Zero-day Vulnerabilities)` → `(inherits parent: 2.3)`

**Item content:**

```
Prompt: Pay researchers to find and report vulnerabilities
Answer: Bug bounty program
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of bug bounty programs (paying researchers to find and report vulnerabilities) does not appear in this transcript. The transcript mentions researchers working to identify vulnerabilities and sharing them with developers, but never discusses payment mechanisms, formal bounty programs, or any organized incentive structure for vulnerability disclosure. This concept likely belongs in '2.3 - Analyzing Vulnerabilities' or '5.5 - Penetration Tests' where vulnerability discovery processes and security testing programs would be covered.

**Parser-suggested destinations:**
- (primary) `5.5 - Penetration Tests`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 67. §2.4 2.4.1 cram[1]

**Parent video:** 2.4 - An Overview of Malware
**Currently cited as:** `(inherits parent: 2.4 - An Overview of Malware)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Fileless malware
Def:    Lives entirely in memory — no file written to disk. Harder to detect with traditional AV.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malware broadly (viruses, worms, ransomware, Trojans, rootkits, keyloggers, etc.) but never mentions fileless malware or the concept of malware residing purely in memory without disk artifacts. This is a legitimate Sec+ concept that likely appears in a different Messer video covering advanced malware techniques or evasion methods.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: security-tools-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Fileless malware` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Fileless malware`: security-tools-sy0-701.txt (×1)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 68. §2.4 2.4.1 cram[2]

**Parent video:** 2.4 - An Overview of Malware
**Currently cited as:** `(inherits parent: 2.4 - An Overview of Malware)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   C2 (Command and Control)
Def:    Infrastructure attackers use to communicate with and control compromised systems.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malware types, propagation, ransomware, and general infection methods but never mentions 'command and control,' 'C2,' or the infrastructure attackers use to communicate with compromised systems. This is a core security concept that appears elsewhere in the SY0-701 curriculum — likely in videos covering botnets (2.4.1 mentions 'turn your system into a botnet' but doesn't develop C2 infrastructure) or DDoS attacks. This is partial-adjacent: the concept belongs in Sec+ but in a different video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `C2 (Command and Control)` | 0 | (no destination) | — |
    | `C2` | 0 | (no destination) | — |
    | `c2 command` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #36 (Jaccard 0.102 — same parent video): accept-primary → `2.4 - Denial of Service`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 69. §2.4 2.4.1 cram[3]

**Parent video:** 2.4 - An Overview of Malware
**Currently cited as:** `(inherits parent: 2.4 - An Overview of Malware)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Indicators of compromise (IoC)
Def:    Artefacts indicating a system may be compromised: known malicious IPs/hashes/domains, unusual behavior.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers malware types, infection vectors, ransomware, and prevention best practices, but does not define or explain indicators of compromise (IoC) as artifacts like known malicious IPs, hashes, domains, or unusual behavior. The video inventory contains '2.4 - Indicators of Compromise' as a dedicated video where this concept belongs.

**Parser-suggested destinations:**
- (primary) `2.4 - Indicators of Compromise`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Indicators of compromise (IoC)` | 0 | 0 | — |
    | `Indicators of compromise` | 0 | 1 hit(s) | — |
    | `compromise ioc` | 0 | 0 | — |

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 70. §2.4 2.4.1 match[1]

**Parent video:** 2.4 - An Overview of Malware
**Currently cited as:** `(inherits parent: 2.4 - An Overview of Malware)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Exists only in memory, no disk file
Answer: Fileless malware
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of fileless malware (malware that exists only in memory with no disk file) does not appear in this transcript. The transcript discusses malware broadly and mentions malware 'loads into memory' but never distinguishes fileless malware as a category or describes the memory-only, no-disk-persistence characteristic the item tests. This is a legitimate Sec+ concept that likely appears in another Messer video covering malware types in greater detail.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: security-tools-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Fileless malware` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Fileless malware`: security-tools-sy0-701.txt (×1)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 71. §2.4 2.4.1 match[2]

**Parent video:** 2.4 - An Overview of Malware
**Currently cited as:** `(inherits parent: 2.4 - An Overview of Malware)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Infrastructure for controlling compromised systems
Answer: C2 (Command and Control)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of C2 (Command and Control) infrastructure is not mentioned in this transcript. The transcript discusses malware types, infection vectors, ransomware, and general malware behavior, but does not cover the command and control architecture used to manage botnets or compromised systems. This concept likely belongs in a video about botnets, network attacks, or specific malware infrastructure (possibly '2.4 - Other Malware Types' or a DDoS/botnet-focused video).

**Parser-suggested destinations:**
- (primary) `2.4 - Other Malware Types`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `C2 (Command and Control)` | 0 | 0 | — |
    | `C2` | 0 | 0 | — |
    | `c2 command` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #36 (Jaccard 0.068 — same parent video): accept-primary → `2.4 - Denial of Service`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 72. §2.4 2.4.1 match[4]

**Parent video:** 2.4 - An Overview of Malware
**Currently cited as:** `(inherits parent: 2.4 - An Overview of Malware)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Evidence a system may be compromised
Answer: Indicator of Compromise (IoC)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of 'Indicator of Compromise (IoC)' does not appear in this transcript. The transcript covers malware types, infection vectors, and ransomware, but does not define or discuss IoCs. However, the video inventory contains '2.4 - Indicators of Compromise' as a dedicated video in the same section, which is the obvious correct home for this item.

**Parser-suggested destinations:**
- (primary) `2.4 - Indicators of Compromise`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Indicator of Compromise (IoC)` | 0 | 0 | — |
    | `Indicator of Compromise` | 0 | 11 hit(s) | — |
    | `compromise ioc` | 0 | 0 | — |

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 73. §2.4 2.4.3 cram[4]

**Parent video:** 2.4 - Spyware and Bloatware
**Currently cited as:** `(inherits parent: 2.4 - Spyware and Bloatware)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   RAT (Remote Access Trojan)
Def:    Gives attacker remote control of victim system — spyware capabilities plus remote command execution.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers spyware (monitoring, keyloggers, affiliate fraud) and bloatware (unwanted pre-installed applications), but does not mention RATs, remote access trojans, or remote command execution capabilities. RATs are a distinct malware category that should appear in a different video — likely '2.4 - An Overview of Malware' or '2.4 - Other Malware Types' based on the curriculum structure.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`
- (alternate) `2.4 - Other Malware Types`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #38 (Jaccard 0.053 — same parent video): accept-primary → `2.4 - An Overview of Malware`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 74. §2.4 2.4.3 match[3]

**Parent video:** 2.4 - Spyware and Bloatware
**Currently cited as:** `(inherits parent: 2.4 - Spyware and Bloatware)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Full remote control of victim machine
Answer: RAT (Remote Access Trojan)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers spyware and bloatware but does not mention RATs (Remote Access Trojans) or the concept of full remote control of victim machines. RATs are a distinct malware category typically covered in malware taxonomy videos. The correct Messer video is likely '2.4 - An Overview of Malware' or '2.4 - Other Malware Types' where different malware categories including trojans and remote access tools would be systematically discussed.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`
- (alternate) `2.4 - Other Malware Types`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 75. §2.4 2.4.4 cram[0]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Trojan (Trojan horse)
Def:    Disguised as legitimate software. Requires user to install it. Contains hidden malicious payload.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript mentions 'Trojan' twice—once as 'Remote Access Trojan' (RAT) in the keylogger section and once in the logic bomb example where a malicious attachment 'installed a Trojan.' However, neither passage defines what a Trojan is or explains its core characteristics (disguised as legitimate software, requires user installation, contains hidden payload). The term is used incidentally assuming prior knowledge. The tested concept—the definition of a Trojan—does not appear at teaching depth in this video. Given that Trojans are a fundamental malware type and this is Section 2.4 'Indicators of Malicious Activity,' the concept almost certainly appears in a different 2.4 video, likely '2.4 - An Overview of Malware' which would be the natural home for foundational malware definitions.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** cited-hit — LLM may be wrong; needle does appear in cited transcript. Consider reject (kept_as_is=true).
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Trojan (Trojan horse)` | 0 | 0 | — |
    | `Trojan` | 4 hit(s) | 1 hit(s) | — |
    | `trojan trojan horse` | 0 | 0 | — |

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #39 (Jaccard 0.07 — same parent video): accept-primary → `2.4 - An Overview of Malware`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 76. §2.4 2.4.4 cram[3]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Botnet
Def:    Network of compromised systems (bots) controlled via C2 server. Used for DDoS, spam, credential stuffing.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers keyloggers, logic bombs, and rootkits in detail but does not mention botnets, C2 servers, DDoS, spam, or credential stuffing. Botnets are a Security+ core concept that clearly belongs in the Messer curriculum — likely in '2.4 - Denial of Service' or '2.4 - An Overview of Malware' based on the video inventory.

**Parser-suggested destinations:**
- (primary) `2.4 - Denial of Service`
- (alternate) `2.4 - An Overview of Malware`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Botnet` | 0 | 10 hit(s) | 2.4 - An Overview of Malware: 1 |

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 77. §2.4 2.4.4 cram[4]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Backdoor
Def:    Hidden access method installed by attacker for persistent re-entry — bypasses normal authentication.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers keyloggers, logic bombs, and rootkits in detail but does not mention backdoors at all. The concept of a backdoor (persistent hidden access bypassing authentication) is a fundamental Security+ concept that clearly belongs in the curriculum. Based on the video inventory, the most likely correct home is '2.4 - Other Malware Types' itself (which this claims to be) or possibly '2.4 - An Overview of Malware'. Since the concept is absent from this specific transcript, this is out-of-source with high confidence that it belongs elsewhere in section 2.4.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Backdoor` | 0 | 1 hit(s) | — |

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 78. §2.4 2.4.4 cram[5]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Cryptominer
Def:    Uses victim's CPU/GPU to mine cryptocurrency without consent — causes performance degradation.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers keyloggers, logic bombs, and rootkits in detail but does not mention cryptominers, cryptocurrency mining, or any related concepts. Cryptominers are a distinct malware category that would logically appear in a different Messer video covering malware types, making this partial-adjacent rather than purely out-of-source, but since I cannot identify the specific correct video from the inventory provided, I classify as out-of-source with move-to-correct-video as the fix direction.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Cryptominer` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 79. §2.4 2.4.4 match[0]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Disguised as legitimate software, hidden payload
Answer: Trojan horse
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The tested concept 'Trojan horse' (malware disguised as legitimate software with hidden payload) does not appear in this transcript. The transcript mentions 'Remote Access Trojan' and 'Trojan' only in the context of the 2013 South Korea logic bomb incident, but does not explain what a Trojan horse is or its defining characteristic of disguising itself as legitimate software. This is clearly a Security+-relevant concept that belongs in the Messer curriculum, likely in '2.4 - An Overview of Malware' or a similar foundational malware video.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Trojan horse` | 0 | 1 hit(s) | — |

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 80. §2.4 2.4.4 match[3]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Network of compromised systems under C2 control
Answer: Botnet
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers keyloggers, logic bombs, and rootkits in detail but does not mention botnets, command-and-control (C2) infrastructure, or networks of compromised systems. Botnets are a distinct malware category that would logically appear in a different Messer video covering network-based threats or distributed malware architectures, likely '2.4 - An Overview of Malware' or '2.4 - Denial of Service' (where botnets are commonly used for DDoS attacks).

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`
- (alternate) `2.4 - Denial of Service`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** destination-hit — accept-primary is well-supported; specific term appears in proposed destination transcript.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Botnet` | 0 | 1 hit(s) | 2.4 - Denial of Service: 10 |

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 81. §2.4 2.4.4 match[4]

**Parent video:** 2.4 - Other Malware Types
**Currently cited as:** `(inherits parent: 2.4 - Other Malware Types)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Uses victim CPU to mine cryptocurrency
Answer: Cryptominer
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers keyloggers, logic bombs, and rootkits in detail but does not mention cryptominers or cryptocurrency mining malware. Cryptominers are a distinct malware category that uses victim CPU/GPU resources to mine cryptocurrency, which is completely absent from this transcript. This concept likely belongs in a different Messer video covering malware types, possibly '2.4 - An Overview of Malware' or another malware-focused video in section 2.4.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Cryptominer` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 82. §2.4 2.4.5 cram[1]

**Parent video:** 2.4 - Physical Attacks
**Currently cited as:** `(inherits parent: 2.4 - Physical Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Skimming
Def:    Device attached to card readers (ATMs, POS) to capture card data.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of skimming (devices attached to card readers to capture card data) does not appear in the cited transcript. The transcript covers brute force physical attacks, RFID cloning, and environmental attacks, but never mentions skimming, ATMs, POS systems, or card data capture. Skimming is a legitimate Security+ concept that likely appears in a different Messer video covering malware types or physical attack variations not included in this particular video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Skimming` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 83. §2.4 2.4.5 cram[2]

**Parent video:** 2.4 - Physical Attacks
**Currently cited as:** `(inherits parent: 2.4 - Physical Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Dumpster diving
Def:    Searching rubbish bins for sensitive information — documents, hardware, sticky notes with passwords.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers brute force physical attacks, RFID cloning, and environmental attacks but does not mention dumpster diving or searching rubbish bins for sensitive information. Dumpster diving is a legitimate Security+ concept but belongs in a different video — most likely '2.2 - Common Threat Vectors' or one of the social engineering videos in section 2.2, as it is a common reconnaissance/information-gathering attack vector.

**Parser-suggested destinations:**
- (primary) `2.2 - Common Threat Vectors`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: penetration-tests-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Dumpster diving` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Dumpster diving`: penetration-tests-sy0-701.txt (×1)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 84. §2.4 2.4.5 cram[3]

**Parent video:** 2.4 - Physical Attacks
**Currently cited as:** `(inherits parent: 2.4 - Physical Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Shoulder surfing
Def:    Physically observing someone entering credentials or viewing sensitive information.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of shoulder surfing (physically observing credential entry or sensitive information viewing) does not appear in this transcript. The transcript covers brute force physical attacks, RFID cloning, and environmental attacks, but never mentions observation-based attacks. Shoulder surfing is a legitimate Security+ concept that likely belongs in '2.2 - Other Social Engineering Attacks' or a similar social engineering video.

**Parser-suggested destinations:**
- (primary) `2.2 - Other Social Engineering Attacks`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Shoulder surfing` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 85. §2.4 2.4.5 match[1]

**Parent video:** 2.4 - Physical Attacks
**Currently cited as:** `(inherits parent: 2.4 - Physical Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Device on ATM capturing card data
Answer: Skimming
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers brute force physical attacks, RFID cloning, and environmental attacks, but does not mention skimming or ATM card data capture. Skimming is a distinct physical attack method that belongs in the SY0-701 curriculum but is not covered in this video. The concept likely appears in a different Messer video covering point-of-sale or card-based attacks.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Skimming` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 86. §2.4 2.4.5 match[3]

**Parent video:** 2.4 - Physical Attacks
**Currently cited as:** `(inherits parent: 2.4 - Physical Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Watching someone type their password
Answer: Shoulder surfing
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of shoulder surfing (watching someone type their password) does not appear in this transcript. The transcript covers brute force physical attacks, RFID cloning, and environmental attacks, but does not mention shoulder surfing or any form of visual eavesdropping. This is a legitimate Security+ concept that almost certainly appears in another Messer video covering social engineering attacks (likely in section 2.2).

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Shoulder surfing` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 87. §2.4 2.4.6 cram[4]

**Parent video:** 2.4 - Denial of Service
**Currently cited as:** `(inherits parent: 2.4 - Denial of Service)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   SYN flood
Def:    Sends many SYN packets without completing handshake — exhausts server connection table (half-open connections).
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers DDoS, botnet mechanics, and DNS amplification attacks in detail, but does not mention SYN floods, TCP handshakes, or connection table exhaustion. SYN floods are a fundamental DoS attack type that would logically appear in a Messer video covering network-layer DoS mechanisms. The cited video focuses on service-level DoS and amplification rather than TCP-specific attacks.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #43 (Jaccard 0.169 — same parent video): (keep-as-is-sb16-candidate)

  - **By-precedent suggestion:** (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 88. §2.4 2.4.6 match[2]

**Parent video:** 2.4 - Denial of Service
**Currently cited as:** `(inherits parent: 2.4 - Denial of Service)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: TCP handshake exploit leaving half-open connections
Answer: SYN flood
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers DDoS attacks, amplification attacks, and DNS reflection, but does not mention SYN floods or TCP handshake exploits leaving half-open connections. SYN flood is a specific DoS technique that likely appears in a different Messer video covering network attacks or TCP/IP vulnerabilities. The concept is clearly Security+ relevant but absent from this cited source.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #43 (Jaccard 0.064 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 89. §2.4 2.4.7 cram[2]

**Parent video:** 2.4 - DNS Attacks
**Currently cited as:** `(inherits parent: 2.4 - DNS Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   DNS sinkhole
Def:    Redirecting malicious domain lookups to a controlled IP — blocks malware C2 communication.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers DNS poisoning, domain hijacking, and URL hijacking/typosquatting but does not mention DNS sinkholes. DNS sinkholes are a defensive technique where malicious domain lookups are redirected to a controlled server to block C2 traffic. This is a legitimate Security+ concept but belongs in a different video, likely one covering network security controls, intrusion prevention, or mitigation techniques rather than this attack-focused video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: log-data-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DNS sinkhole` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `DNS sinkhole`: log-data-sy0-701.txt (×1)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 90. §2.4 2.4.7 cram[3]

**Parent video:** 2.4 - DNS Attacks
**Currently cited as:** `(inherits parent: 2.4 - DNS Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   DNSSEC
Def:    DNS Security Extensions — cryptographically signs DNS records to prevent poisoning/spoofing.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> DNSSEC (DNS Security Extensions) and cryptographic signing of DNS records to prevent poisoning/spoofing are not mentioned anywhere in this transcript. The transcript covers DNS poisoning attacks, domain hijacking, and URL hijacking/typosquatting, but does not discuss DNSSEC as a mitigation technique. DNSSEC is a legitimate Security+ concept that likely appears in a different Messer video focused on DNS security controls or mitigation techniques rather than attack vectors.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DNSSEC` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 91. §2.4 2.4.7 cram[4]

**Parent video:** 2.4 - DNS Attacks
**Currently cited as:** `(inherits parent: 2.4 - DNS Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   DNS tunneling
Def:    Hiding data exfiltration or C2 traffic within DNS queries — often overlooked by firewalls that allow DNS.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The cited transcript covers DNS poisoning, domain hijacking, and URL hijacking/typosquatting but does not mention DNS tunneling, which is a distinct attack technique involving data exfiltration or C2 communication encoded within DNS queries. DNS tunneling is a legitimate Security+ concept that likely belongs in a different Messer video covering data exfiltration techniques or command-and-control methods, but it is not present in this DNS Attacks video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DNS tunneling` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #45 (Jaccard 0.17 — same parent video): (keep-as-is-sb16-candidate)

  - **By-precedent suggestion:** (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 92. §2.4 2.4.7 match[2]

**Parent video:** 2.4 - DNS Attacks
**Currently cited as:** `(inherits parent: 2.4 - DNS Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Cryptographic signing of DNS records
Answer: DNSSEC
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses DNS poisoning, domain hijacking, and URL hijacking attacks but never mentions DNSSEC or cryptographic signing of DNS records as a mitigation technique. DNSSEC is a Security+ topic that would appear in a different Messer video focused on secure protocols or DNS security controls, not in this attacks-focused video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DNSSEC` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 93. §2.4 2.4.7 match[3]

**Parent video:** 2.4 - DNS Attacks
**Currently cited as:** `(inherits parent: 2.4 - DNS Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Data hidden in DNS queries for exfiltration
Answer: DNS tunneling
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers DNS spoofing/poisoning, domain hijacking, and URL hijacking/typosquatting, but does not mention DNS tunneling or the concept of hiding data in DNS queries for exfiltration. DNS tunneling is a distinct attack technique involving data exfiltration through DNS protocol abuse, which is Security+ relevant but not covered in this video. This likely belongs in a different Messer video on data exfiltration techniques or covert channels.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DNS tunneling` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #45 (Jaccard 0.056 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 94. §2.4 2.4.7 match[4]

**Parent video:** 2.4 - DNS Attacks
**Currently cited as:** `(inherits parent: 2.4 - DNS Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Redirecting malware C2 DNS to controlled IP
Answer: DNS sinkhole
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of DNS sinkholing (redirecting malware C2 traffic to controlled IPs for mitigation/monitoring) does not appear in this transcript. The transcript covers DNS poisoning, domain hijacking, and URL hijacking as attacker techniques. DNS sinkholes are a defensive security technique typically covered in mitigation/monitoring contexts. This likely belongs in a video about mitigation techniques, intrusion prevention, or security monitoring.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: log-data-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DNS sinkhole` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `DNS sinkhole`: log-data-sy0-701.txt (×1)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 95. §2.4 2.4.8 cram[0]

**Parent video:** 2.4 - Wireless Attacks
**Currently cited as:** `(inherits parent: 2.4 - Wireless Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Evil twin
Def:    Rogue access point mimicking a legitimate SSID. Victims connect and attacker intercepts traffic (MITM).
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers deauthentication attacks and RF jamming but does not mention evil twin attacks, rogue access points mimicking legitimate SSIDs, or man-in-the-middle interception via fake APs. This is a legitimate Sec+ wireless attack concept that likely appears in a different Messer video on wireless security topics.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Evil twin` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #46 (Jaccard 0.104 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 96. §2.4 2.4.8 cram[2]

**Parent video:** 2.4 - Wireless Attacks
**Currently cited as:** `(inherits parent: 2.4 - Wireless Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   WPA2 handshake capture
Def:    Capturing the 4-way handshake during authentication for offline brute-force cracking.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers deauthentication attacks and RF jamming but does not mention WPA2 handshake capture or offline brute-force cracking of captured handshakes. This is a distinct wireless attack technique likely covered in a different Messer video on wireless security or password attacks. The concept is clearly Security+ relevant but absent from this particular transcript.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `WPA2 handshake capture` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #47 (Jaccard 0.109 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 97. §2.4 2.4.8 cram[3]

**Parent video:** 2.4 - Wireless Attacks
**Currently cited as:** `(inherits parent: 2.4 - Wireless Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   WPS PIN attack
Def:    Brute-forcing WPS 8-digit PIN. Only 11,000 combinations needed (design flaw). Disable WPS.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers wireless deauthentication attacks and RF jamming but does not mention WPS (Wi-Fi Protected Setup), WPS PINs, or the specific 8-digit PIN brute-force vulnerability. WPS attacks are a legitimate Security+ topic but are not discussed in this video. Based on the video inventory, this concept likely belongs in '4.1 - Securing Wireless and Mobile' or '4.1 - Wireless Security Settings' where WPS configuration guidance would naturally appear.

**Parser-suggested destinations:**
- (primary) `4.1 - Securing Wireless and Mobile`
- (alternate) `4.1 - Wireless Security Settings`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `WPS PIN attack` | 0 | 0 | 4.1 - Wireless Security Settings: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 98. §2.4 2.4.8 match[0]

**Parent video:** 2.4 - Wireless Attacks
**Currently cited as:** `(inherits parent: 2.4 - Wireless Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Rogue AP with same SSID as legitimate network
Answer: Evil twin
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers deauthentication attacks and RF jamming but does not mention evil twin attacks, rogue access points, or SSIDs being spoofed to impersonate legitimate networks. Evil twin is a distinct wireless attack concept not present in this video. Based on the video inventory, this concept likely belongs in a different wireless security video or possibly '4.1 - Securing Wireless and Mobile' or '4.1 - Wireless Security Settings'.

**Parser-suggested destinations:**
- (primary) `4.1 - Securing Wireless and Mobile`
- (alternate) `4.1 - Wireless Security Settings`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Evil twin` | 0 | 0 | 4.1 - Wireless Security Settings: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #46 (Jaccard 0.068 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 99. §2.4 2.4.8 match[2]

**Parent video:** 2.4 - Wireless Attacks
**Currently cited as:** `(inherits parent: 2.4 - Wireless Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Brute-forcing WPS 8-digit PIN
Answer: WPS PIN attack
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers wireless deauthentication attacks and RF jamming in detail, but does not mention WPS (Wi-Fi Protected Setup), WPS PIN attacks, or brute-forcing WPS 8-digit PINs at all. WPS attacks are a distinct wireless attack vector that would logically appear in Messer's wireless security coverage, but not in this particular video. This is a clear case of partial-adjacent — the concept belongs in the SY0-701 curriculum but is cited to the wrong video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `WPS PIN attack` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 100. §2.4 2.4.9 cram[2]

**Parent video:** 2.4 - On-path Attacks
**Currently cited as:** `(inherits parent: 2.4 - On-path Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   SSL stripping
Def:    Downgrades HTTPS to HTTP — attacker sees plaintext traffic. Requires MITM position.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> SSL stripping is a specific HTTPS-downgrade attack technique that does not appear in this transcript. The transcript covers ARP poisoning and on-path browser attacks but never mentions SSL/TLS downgrade attacks, certificate manipulation, or the SSL stripping mechanism. This concept likely belongs in a video covering secure protocols or TLS-specific attacks (possibly '4.5 - Secure Protocols' or another encryption-focused video), making this partial-adjacent rather than fully out-of-source since SSL stripping is a legitimate Security+ topic that should appear somewhere in the Messer curriculum.

**Parser-suggested destinations:**
- (primary) `4.5 - Secure Protocols`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---


## Packet summary

- Items in this packet: 50
- Parser-yielded primary destination available on: 27 / 50
- match items: 24
- cram items: 26
- By section: §2.3=16, §2.4=34
- Remaining after this packet: 34 items (next packet start = 100)
---ready-for-supervisor---
