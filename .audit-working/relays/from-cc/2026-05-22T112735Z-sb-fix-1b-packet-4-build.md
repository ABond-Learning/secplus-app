# SB-fix-1b packet 4 — build status + supervisor review surface

NONCE: 2026-05-22T112735Z-78d990ac

## Build summary

Packet 4 of 6 (will likely close out SB-fix-1b — only 34 items
remain in scope after this). Items 101–134 of 134 in the D2
partial-adjacent match + cram scope. 34 items (residual under
the cadence Rule 1 50-item default). Final §2.4 tail (videos
2.4.9 through 2.4.14) plus §2.5 entry (2.5.1 + 2.5.3).

| Field | Value |
|---|---|
| Packet | 4 |
| Slice | items 101–134 (size 34) of 134 |
| Match items | 16 |
| Cram items | 18 |
| §2.4 items | 26 |
| §2.5 items | 8 |
| Parser primary-destination yield | 12 / 34 (35%) |
| Clusters (≥3 items same parent) | 6 |

Parser yield is lower than packet 3 (54%) — likely because §2.5
"Mitigation Techniques" items typically lack quoted Messer video
titles in the LLM justification (the LLM names the concept but
not the destination video). Cross-packet hints + supervisor
judgment compensate.

Build artefacts (gitignored under `.audit-working/sb-fix-1b/`):
- `packet-4.md` (build output)
- `packet-4.json` (shadow with parser output)
- `packet-4-cluster-verification.md` (Rule 2)
- `packet-4-cross-packet-hints.{md,json}` (Rule 5)
- `packet-4-augmented.md` (supervisor review surface, inlined below)

Note (Rule 6 — non-expansion finding): the cross-packet annotate
script's console log says "across SB-fix-1a (3 packets) + SB-fix-1b
packets 1-2" but the load now includes packet 3 (count 163 = 113
prior + 50 packet 3). Cosmetic log text only; hints output is
accurate. Not fixing mid-packet.

## Cluster verification summary (Rule 2)

| Cluster | Items | Patterns |
|---|---|---|
| §2.4 2.4.9 "On-path Attacks" | 5 | `messer-curriculum-gap`=4, `partial-depth`=1 |
| §2.4 2.4.11 (Replay/Code attacks tail) | 6 | `messer-curriculum-gap`=6 |
| §2.4 2.4.12 (various) | 4 | `messer-curriculum-gap`=4 |
| §2.4 2.4.13 (various) | 6 | `messer-curriculum-gap`=2, `partial-depth`=4 |
| §2.4 2.4.14 (various) | 4 | `messer-curriculum-gap`=4 |
| §2.5 2.5.1 (Mitigation Techniques entry) | 6 | `messer-curriculum-gap`=4, `partial-depth`=2 |

Continued heavy `messer-curriculum-gap` classifier rate (24 of 31
cluster items). Same caveat as packet 3: exact-phrase grep often
misses terminology variants. Supervisor's umbrella-conceptual-fit
framing from packet 3 ("if cited video IS natural umbrella →
keep-as-is + sb16-candidate + partial-depth") will likely apply
to many of these.

## Cross-packet consistency summary (Rule 5)

| Metric | Value |
|---|---|
| Prior decisions corpus | 163 items (SB-fix-1a 3 packets + SB-fix-1b packets 1-3) |
| Items with at least one consistency hint | 15 / 34 |
| Items with score ≥ 0.30 (precedent suggestion) | ~5 / 34 |
| Items with score ≥ 0.40 (high confidence) | 0 / 34 |

Lower hint yield than packet 3 (15/34 vs 18/50). §2.4.9–§2.4.14
items don't have many concept-counterparts in earlier packets
because SB-fix-1a covered §2.4 only sparsely at mc/scen level.
§2.5.1 mitigation items DO match packet 2's mitigation moves
(ASLR/DEP/stack canary → 2.5) for several entries.

## Composition table (by parent video)

| Section | Video | Type | Items | Packet range |
|---|---|---|---|---|
| §2.4 | 2.4.9 | cram | 2 | #101–#102 |
| §2.4 | 2.4.9 | match | 3 | #103–#105 |
| §2.4 | 2.4.10 | cram | 1 | #106 |
| §2.4 | 2.4.11 | cram | 3 | #107–#109 |
| §2.4 | 2.4.11 | match | 3 | #110–#112 |
| §2.4 | 2.4.12 | cram | 2 | #113–#114 |
| §2.4 | 2.4.12 | match | 2 | #115–#116 |
| §2.4 | 2.4.13 | cram | 3 | #117–#119 |
| §2.4 | 2.4.13 | match | 3 | #120–#122 |
| §2.4 | 2.4.14 | cram | 3 | #123–#125 |
| §2.4 | 2.4.14 | match | 1 | #126 |
| §2.5 | 2.5.1 | cram | 3 | #127–#129 |
| §2.5 | 2.5.1 | match | 3 | #130–#132 |
| §2.5 | 2.5.3 | cram | 1 | #133 |
| §2.5 | 2.5.3 | match | 1 | #134 |

## What supervisor reviews

Per cadence Rule 3: item-by-item decisions for all 34 items +
the dry-run preview (one round-trip after decisions return).
Not gated: parser candidate yield, cluster grep mechanics,
cross-packet match mechanics, validator output (unless non-clean).

After this packet's apply, SB-fix-1b closes (134/134 items
shipped). Next steps: PLAN.md sync + Report-#0010 (SB-fix-1b
closure) + SB-fix-2 readiness assessment.

═══════════════════════════════════════════════════════════════
Augmented packet — supervisor review surface
═══════════════════════════════════════════════════════════════

# SB-fix-1b packet 4 — Domain 2 partial-adjacent re-citation review (match + cram)

Generated: 2026-05-22T11:27:00.796Z
Source: `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json`
Filter: `category=partial-adjacent` AND `location.section startsWith "2."` AND `type in {match, cram}`
Scope total (across all packets): 134 items
This packet: items 101–134 of 134 (size 34)

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

### Item 101. §2.4 2.4.9 cram[3]

**Parent video:** 2.4 - On-path Attacks
**Currently cited as:** `(inherits parent: 2.4 - On-path Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   HSTS (HTTP Strict Transport Security)
Def:    HTTP header instructing browsers to ALWAYS use HTTPS — mitigates SSL stripping.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> HSTS is not mentioned in this transcript. The video covers on-path attacks (ARP poisoning, on-path browser attacks) but does not discuss SSL stripping or HSTS as a mitigation. HSTS is a legitimate Sec+ concept that likely appears in a different Messer video covering secure protocols or HTTPS security, making this partial-adjacent rather than completely out-of-source. The correct video is likely in Section 4.5 (Secure Protocols) or a related security communications topic.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `HSTS (HTTP Strict Transport Security)` | 0 | (no destination) | — |
    | `HSTS` | 0 | (no destination) | — |
    | `hsts http strict transport security` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1b packet 3 #100 (Jaccard 0.07 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 102. §2.4 2.4.9 cram[4]

**Parent video:** 2.4 - On-path Attacks
**Currently cited as:** `(inherits parent: 2.4 - On-path Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   BGP hijacking
Def:    Attacker advertises false BGP routes — redirecting internet traffic through attacker-controlled infrastructure.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> BGP hijacking does not appear in this transcript. The video covers ARP poisoning and on-path browser attacks exclusively. BGP hijacking is a network-layer routing attack that belongs in infrastructure or DNS/routing attack coverage. The most likely home is '2.4 - DNS Attacks' or potentially a network infrastructure video in Section 3, but I cannot definitively place it from the video inventory alone.

**Parser-suggested destinations:**
- (primary) `2.4 - DNS Attacks`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `BGP hijacking` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 103. §2.4 2.4.9 match[2]

**Parent video:** 2.4 - On-path Attacks
**Currently cited as:** `(inherits parent: 2.4 - On-path Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Downgrading HTTPS to HTTP
Answer: SSL stripping
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers ARP poisoning and on-path browser attacks but does not mention SSL stripping, HTTPS downgrade attacks, or any mechanism for forcing protocol downgrades from HTTPS to HTTP. SSL stripping is a specific attack technique that belongs in security content but is not present in this video. This is likely covered in a different Messer video on web/application attacks or cryptographic attacks.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: cryptographic-attacks-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `SSL stripping` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `SSL stripping`: cryptographic-attacks-sy0-701.txt (×7)

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1b packet 3 #100 (Jaccard 0.121 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 104. §2.4 2.4.9 match[3]

**Parent video:** 2.4 - On-path Attacks
**Currently cited as:** `(inherits parent: 2.4 - On-path Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: HTTP header forcing HTTPS always
Answer: HSTS
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> HSTS (HTTP Strict Transport Security) is a security mechanism that forces browsers to use HTTPS connections, but this concept does not appear anywhere in the cited transcript. The transcript focuses exclusively on on-path/man-in-the-middle attacks via ARP poisoning and on-path browser attacks. HSTS is a defense mechanism against on-path attacks and protocol downgrade attacks, so it likely belongs in a video about secure protocols, HTTPS security, or web filtering (possibly '4.5 - Secure Protocols' or '4.5 - Web Filtering').

**Parser-suggested destinations:**
- (primary) `4.5 - Secure Protocols`
- (alternate) `4.5 - Web Filtering`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `HSTS` | 0 | 0 | 4.5 - Web Filtering: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 105. §2.4 2.4.9 match[4]

**Parent video:** 2.4 - On-path Attacks
**Currently cited as:** `(inherits parent: 2.4 - On-path Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: False BGP route advertisements redirect internet traffic
Answer: BGP hijacking
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> BGP hijacking is not discussed in this transcript. The transcript covers on-path attacks (ARP poisoning and browser-based attacks) but makes no mention of BGP (Border Gateway Protocol), routing protocols, or false route advertisements. BGP hijacking is a legitimate Security+ concept that likely belongs in a different Messer video covering network attacks or routing security, making this partial-adjacent rather than fully out-of-source. However, I cannot identify the specific correct video from the inventory provided, so I'm marking as out-of-source with move-to-correct-video as the fix direction.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `BGP hijacking` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 106. §2.4 2.4.10 cram[3]

**Parent video:** 2.4 - Replay Attacks
**Currently cited as:** `(inherits parent: 2.4 - Replay Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Nonce
Def:    Number used Once. Random value added to authentication to prevent replay — each session unique.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of nonce as a replay-prevention mechanism does not appear in this transcript. The transcript discusses salting passwords ('additional salting of the password so that, each time an authentication occurs, it's using a different salt') and encryption as replay countermeasures, but never introduces or names 'nonce' or 'number used once.' This is a core cryptographic concept that likely appears in Section 1.4 videos on encryption/authentication mechanisms or Section 4.6 on authentication methods, making this partial-adjacent rather than fully out-of-source.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 107. §2.4 2.4.11 cram[0]

**Parent video:** 2.4 - Malicious Code
**Currently cited as:** `(inherits parent: 2.4 - Malicious Code)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Web shell
Def:    Malicious script uploaded to a web server giving attacker remote command execution via HTTP.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malicious code broadly (executables, scripts, macros, Trojans) and gives three specific examples: WannaCry (SMB exploit), British Airways (cross-site scripting via JavaScript), and Estonian database (SQL injection). Web shells are not mentioned. However, web shells are a legitimate Security+ concept that likely appears in another Messer video covering web application attacks or post-exploitation techniques—possibly in the 2.4 series on attack types or Section 4 on security operations. This is partial-adjacent territory, but since I cannot identify the specific correct video from the inventory with certainty, I categorize as out-of-source with a move recommendation for human review to locate the proper citation.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Web shell` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #48 (Jaccard 0.198 — same parent video): manual → `2.4 - Application Attacks` / `2.4`

  - **By-precedent suggestion:** manual → `2.4 - Application Attacks` / `2.4`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 108. §2.4 2.4.11 cram[2]

**Parent video:** 2.4 - Malicious Code
**Currently cited as:** `(inherits parent: 2.4 - Malicious Code)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Living off the land (LOLBins)
Def:    Using legitimate system tools (PowerShell, WMI, certutil) for malicious purposes — evades detection.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malicious code broadly (executables, scripts, macro viruses, ransomware, XSS, SQL injection) but never mentions 'living off the land', LOLBins, or the specific legitimate tools (PowerShell, WMI, certutil) cited in the item. This is a distinct attack technique that likely appears in a different Messer video covering fileless malware or evasion techniques — it does not fit the scope of this particular 'Malicious Code' video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Living off the land (LOLBins)` | 0 | (no destination) | — |
    | `Living off the land` | 0 | (no destination) | — |
    | `land lolbins` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #49 (Jaccard 0.124 — same parent video): manual → `2.4 - Other Malware Types` / `2.4`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 109. §2.4 2.4.11 cram[3]

**Parent video:** 2.4 - Malicious Code
**Currently cited as:** `(inherits parent: 2.4 - Malicious Code)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Dropper
Def:    Initial malware that downloads and installs the main malicious payload. First stage of multi-stage attack.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malicious code in general terms (executables, scripts, macro viruses, Trojan horses) and provides case study examples (WannaCry, British Airways XSS, Estonian SQL injection), but never mentions 'dropper' as a term or describes the multi-stage attack pattern where initial malware downloads a secondary payload. The dropper concept is a specific malware delivery mechanism that does not appear in this video. This is likely covered in '2.4 - An Overview of Malware' or '2.4 - Viruses and Worms' where malware lifecycle and delivery mechanisms would be more appropriate.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`
- (alternate) `2.4 - Viruses and Worms`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Dropper` | 0 | 0 | 2.4 - Viruses and Worms: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #50 (Jaccard 0.057 — same parent video): accept-primary → `2.4 - An Overview of Malware`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 110. §2.4 2.4.11 match[0]

**Parent video:** 2.4 - Malicious Code
**Currently cited as:** `(inherits parent: 2.4 - Malicious Code)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Malicious script uploaded to web server for remote access
Answer: Web shell
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malicious code broadly (executables, scripts, macro viruses, Trojan horses) and provides examples of WannaCry, British Airways XSS, and Estonian SQL injection attacks. However, 'web shell' as a specific malicious code type uploaded to web servers for remote access is never mentioned or described. The concept of web shells is Security+-relevant and likely covered in another Messer video focused on web application attacks or post-exploitation techniques, making this partial-adjacent rather than out-of-source.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Web shell` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #48 (Jaccard 0.137 — same parent video): manual → `2.4 - Application Attacks` / `2.4`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 111. §2.4 2.4.11 match[2]

**Parent video:** 2.4 - Malicious Code
**Currently cited as:** `(inherits parent: 2.4 - Malicious Code)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Using legitimate system tools maliciously
Answer: Living off the land (LOLBins)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malicious code in general terms (executables, scripts, macros, Trojans) and specific attack examples (WannaCry, British Airways XSS, Estonian SQL injection), but does not mention 'living off the land' techniques or LOLBins — the specific concept of using legitimate system tools (like PowerShell, WMI, PsExec) maliciously. This is a distinct offensive technique that would likely be covered in a different Messer video focused on attacker methodologies or specific attack techniques, but I cannot identify which video from the inventory would be the correct home.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Living off the land (LOLBins)` | 0 | (no destination) | — |
    | `Living off the land` | 0 | (no destination) | — |
    | `land lolbins` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #2 #49 (Jaccard 0.084 — same parent video): manual → `2.4 - Other Malware Types` / `2.4`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 112. §2.4 2.4.11 match[3]

**Parent video:** 2.4 - Malicious Code
**Currently cited as:** `(inherits parent: 2.4 - Malicious Code)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Initial malware that downloads main payload
Answer: Dropper
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript discusses malicious code broadly (executables, scripts, macros, trojans) and provides real-world attack examples (WannaCry, British Airways XSS, Estonian SQL injection), but does not define or mention 'dropper' as a malware term. The dropper concept (initial stage malware that downloads/installs the main payload) is a legitimate Security+ topic likely covered in Messer's malware-specific videos such as '2.4 - An Overview of Malware' or '2.4 - Other Malware Types', not in this general 'Malicious Code' overview.

**Parser-suggested destinations:**
- (primary) `2.4 - An Overview of Malware`
- (alternate) `2.4 - Other Malware Types`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Dropper` | 0 | 0 | 2.4 - Other Malware Types: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 113. §2.4 2.4.12 cram[2]

**Parent video:** 2.4 - Application Attacks
**Currently cited as:** `(inherits parent: 2.4 - Application Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   IDOR (Insecure Direct Object Reference)
Def:    Accessing objects by manipulating predictable identifiers without proper authorization check.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers injection attacks, buffer overflows, replay attacks, privilege escalation, CSRF, and directory traversal in detail, but IDOR (Insecure Direct Object Reference) is never mentioned or described. IDOR is a distinct vulnerability class where users manipulate identifiers (like user IDs in URLs) to access unauthorized objects. This is a legitimate Security+ concept that likely belongs in a different Messer video covering web application vulnerabilities or access control issues, hence partial-adjacent would be appropriate if I could identify the correct video. However, reviewing the video inventory, no single video title clearly maps to IDOR coverage (it could fit under 'Application Attacks', 'Access Controls', or 'Analyzing Vulnerabilities'). Since I cannot positively identify the correct home video from the inventory, I classify this as out-of-source rather than partial-adjacent, though the fix-direction remains move-to-correct-video pending human review of where Messer actually teaches IDOR in the SY0-701 series.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `IDOR (Insecure Direct Object Reference)` | 0 | (no destination) | — |
    | `IDOR` | 0 | (no destination) | — |
    | `idor insecure direct object reference` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #51 (Jaccard 0.187 — same parent video): (keep-as-is-sb16-candidate)

  - **By-precedent suggestion:** (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 114. §2.4 2.4.12 cram[3]

**Parent video:** 2.4 - Application Attacks
**Currently cited as:** `(inherits parent: 2.4 - Application Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   SSRF (Server-Side Request Forgery)
Def:    Attacker makes the server fetch attacker-specified URLs — can reach internal services.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> SSRF (Server-Side Request Forgery) does not appear in the cited transcript. The transcript covers injection attacks, buffer overflows, replay attacks, privilege escalation, CSRF (cross-site request forgery), and directory traversal, but never mentions SSRF or the concept of an attacker making a server fetch attacker-specified URLs to reach internal services. SSRF is a distinct Security+ concept that likely belongs in a different Messer video focused on web application vulnerabilities or application attacks, but it is not in this particular 'Application Attacks' video.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `SSRF (Server-Side Request Forgery)` | 0 | (no destination) | — |
    | `SSRF` | 0 | (no destination) | — |
    | `ssrf server side request forgery` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 115. §2.4 2.4.12 match[2]

**Parent video:** 2.4 - Application Attacks
**Currently cited as:** `(inherits parent: 2.4 - Application Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Changing ?id=123 to ?id=124 to access another user's data
Answer: IDOR (Insecure Direct Object Reference)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers injection attacks, buffer overflows, replay attacks, privilege escalation, CSRF, and directory traversal, but does not mention IDOR (Insecure Direct Object Reference) or the pattern of modifying object identifiers in URLs to access other users' data. IDOR is a distinct access control vulnerability not covered in this video. This concept likely belongs in a video covering access control vulnerabilities or authorization failures.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `IDOR (Insecure Direct Object Reference)` | 0 | (no destination) | — |
    | `IDOR` | 0 | (no destination) | — |
    | `idor insecure direct object reference` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #51 (Jaccard 0.117 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 116. §2.4 2.4.12 match[3]

**Parent video:** 2.4 - Application Attacks
**Currently cited as:** `(inherits parent: 2.4 - Application Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Making server fetch attacker-controlled URLs
Answer: SSRF (Server-Side Request Forgery)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers injection attacks, buffer overflows, replay attacks, privilege escalation, CSRF (cross-site request forgery), and directory traversal. SSRF (Server-Side Request Forgery) — where an attacker makes the server fetch attacker-controlled URLs — does not appear in this transcript at all. SSRF is a distinct application attack type that should be covered in Security+ curriculum, making this partial-adjacent rather than out-of-source, but I cannot identify the correct Messer video from the inventory provided. A human reviewer should locate the proper video or confirm whether SSRF appears elsewhere in the course.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `SSRF (Server-Side Request Forgery)` | 0 | (no destination) | — |
    | `SSRF` | 0 | (no destination) | — |
    | `ssrf server side request forgery` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 117. §2.4 2.4.13 cram[2]

**Parent video:** 2.4 - Cryptographic Attacks
**Currently cited as:** `(inherits parent: 2.4 - Cryptographic Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   POODLE
Def:    Padding Oracle On Downgraded Legacy Encryption — exploits SSLv3 via protocol downgrade.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers downgrade attacks conceptually and describes SSL stripping in detail, but never mentions POODLE, SSLv3, or padding oracle attacks. POODLE is a specific named cryptographic attack that belongs in Security+ curriculum but is not present in this video. The concept likely appears elsewhere in the Messer SY0-701 series, making this partial-adjacent rather than truly out-of-source, but I cannot identify the correct video from the inventory provided.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `POODLE` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 118. §2.4 2.4.13 cram[3]

**Parent video:** 2.4 - Cryptographic Attacks
**Currently cited as:** `(inherits parent: 2.4 - Cryptographic Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Rainbow table
Def:    Precomputed hash-to-plaintext database. Defeated by salting.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of rainbow tables (precomputed hash databases) does not appear in this transcript. The transcript covers birthday attacks/hash collisions, downgrade attacks, and SSL stripping, but never mentions rainbow tables or precomputation attacks. Rainbow tables are a password attack technique that likely belongs in '2.4 - Password Attacks' based on the video inventory.

**Parser-suggested destinations:**
- (primary) `2.4 - Password Attacks`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: hashing-and-digital-signatures-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Rainbow table` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Rainbow table`: hashing-and-digital-signatures-sy0-701.txt (×3)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 119. §2.4 2.4.13 cram[4]

**Parent video:** 2.4 - Cryptographic Attacks
**Currently cited as:** `(inherits parent: 2.4 - Cryptographic Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Key stretching
Def:    bcrypt, PBKDF2, Argon2 — deliberately slow hashing algorithms making brute force impractical.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers cryptographic attacks (birthday attacks, hash collisions, downgrade attacks, SSL stripping) but does not mention key stretching, bcrypt, PBKDF2, or Argon2. Key stretching is a password hashing defense mechanism, not a cryptographic attack. This concept likely belongs in '2.4 - Password Attacks' or '4.6 - Password Security' where password storage and defense mechanisms would be covered.

**Parser-suggested destinations:**
- (primary) `2.4 - Password Attacks`
- (alternate) `4.6 - Password Security`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: encrypting-data-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Key stretching` | 0 | 0 | 4.6 - Password Security: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Key stretching`: encrypting-data-sy0-701.txt (×2)

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #53 (Jaccard 0.113 — same parent video): accept-alternate → `(unspecified)`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 120. §2.4 2.4.13 match[2]

**Parent video:** 2.4 - Cryptographic Attacks
**Currently cited as:** `(inherits parent: 2.4 - Cryptographic Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: SSLv3 padding oracle exploitation
Answer: POODLE attack
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The POODLE attack (Padding Oracle On Downgraded Legacy Encryption) is a specific named cryptographic attack against SSLv3 that exploits padding oracle vulnerabilities. The transcript covers downgrade attacks, SSL stripping, birthday attacks, and hash collisions, but never mentions POODLE, SSLv3 specifically, or padding oracle attacks. This is clearly a Security+ relevant concept that likely appears in a different Messer video covering SSL/TLS vulnerabilities or legacy protocol attacks.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `POODLE attack` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 121. §2.4 2.4.13 match[3]

**Parent video:** 2.4 - Cryptographic Attacks
**Currently cited as:** `(inherits parent: 2.4 - Cryptographic Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Precomputed hash database — defeated by salts
Answer: Rainbow table
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of rainbow tables as precomputed hash databases defeated by salts does not appear in this transcript. The transcript covers birthday attacks/hash collisions, MD5 weaknesses, downgrade attacks, and SSL stripping — none of which discuss rainbow tables or salting as a defense mechanism. Rainbow tables are a password-cracking technique likely covered in '2.4 - Password Attacks' or a similar video focused on authentication attacks.

**Parser-suggested destinations:**
- (primary) `2.4 - Password Attacks`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: hashing-and-digital-signatures-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Rainbow table` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Rainbow table`: hashing-and-digital-signatures-sy0-701.txt (×3)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 122. §2.4 2.4.13 match[4]

**Parent video:** 2.4 - Cryptographic Attacks
**Currently cited as:** `(inherits parent: 2.4 - Cryptographic Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Deliberately slow hashing to resist brute force
Answer: Key stretching (bcrypt, PBKDF2)
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of key stretching (bcrypt, PBKDF2) and deliberately slow hashing to resist brute force does not appear in this transcript. The video covers birthday attacks, hash collisions (MD5), downgrade attacks, and SSL stripping. Key stretching is a password security technique that likely belongs in '4.6 - Password Security' or '1.4 - Hashing and Digital Signatures' based on the video inventory.

**Parser-suggested destinations:**
- (primary) `4.6 - Password Security`
- (alternate) `1.4 - Hashing and Digital Signatures`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: encrypting-data-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Key stretching (bcrypt, PBKDF2)` | 0 | 0 | 1.4 - Hashing and Digital Signatures: 0 |
    | `Key stretching` | 0 | 0 | 1.4 - Hashing and Digital Signatures: 0 |
    | `key stretching bcrypt pbkdf2` | 0 | 0 | 1.4 - Hashing and Digital Signatures: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Key stretching`: encrypting-data-sy0-701.txt (×2)

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #53 (Jaccard 0.093 — same parent video): accept-alternate → `(unspecified)`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 123. §2.4 2.4.14 cram[1]

**Parent video:** 2.4 - Password Attacks
**Currently cited as:** `(inherits parent: 2.4 - Password Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Credential stuffing
Def:    Using stolen username/password pairs from one breach to try on other services (exploits password reuse).
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers password spraying, brute force attacks, and plaintext password storage, but does not mention credential stuffing or the concept of reusing stolen username/password pairs from one breach on other services. This is a distinct password attack type that belongs in the Security+ curriculum but is not covered in this particular video. The closest match in the Messer inventory would likely be a more comprehensive password attacks overview, but this specific concept is absent from the cited transcript.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Credential stuffing` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 3 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #57 (Jaccard 0.097 — same parent video): (keep-as-is-sb16-candidate)
  - SB-fix-1a #3 #54 (Jaccard 0.07 — same parent video): (keep-as-is-sb16-candidate)
  - SB-fix-1a #3 #55 (Jaccard 0.057 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 124. §2.4 2.4.14 cram[2]

**Parent video:** 2.4 - Password Attacks
**Currently cited as:** `(inherits parent: 2.4 - Password Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Pass-the-hash
Def:    Using a captured password hash directly for authentication — no need to crack it.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers password spraying, brute force attacks, plaintext storage, and hash-based password storage. Pass-the-hash is a distinct attack technique where captured NTLM or other authentication hashes are reused directly for authentication without cracking. This concept does not appear in the cited transcript. Given this is a legitimate Sec+ attack concept, it likely belongs in a different Messer video covering lateral movement or Windows authentication attacks, making this partial-adjacent rather than out-of-source.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Pass-the-hash` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 125. §2.4 2.4.14 cram[3]

**Parent video:** 2.4 - Password Attacks
**Currently cited as:** `(inherits parent: 2.4 - Password Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Term:   Hybrid attack
Def:    Dictionary words + rule modifications (capitalize, add numbers/symbols).
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers password spraying, brute force attacks, and plaintext vs. hashed password storage, but does not mention hybrid attacks or dictionary attacks with rule modifications. Hybrid attacks are a distinct password attack methodology that would logically appear in a comprehensive password attacks video, but this specific transcript does not contain it. This is partial-adjacent territory — the concept belongs in Security+ password attack coverage and likely appears elsewhere in Messer's curriculum, but I cannot identify the specific correct video from the inventory provided.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Hybrid attack` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 126. §2.4 2.4.14 match[1]

**Parent video:** 2.4 - Password Attacks
**Currently cited as:** `(inherits parent: 2.4 - Password Attacks)` → `(inherits parent: 2.4)`

**Item content:**

```
Prompt: Stolen credentials tried on other services
Answer: Credential stuffing
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers password spraying and brute force attacks but does not mention credential stuffing — the practice of taking stolen credentials from one service and systematically trying them on other services. This is a distinct attack pattern that belongs in a different Messer video, likely one covering broader authentication attacks or account compromise techniques.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Credential stuffing` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #55 (Jaccard 0.066 — same parent video): (keep-as-is-sb16-candidate)
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 127. §2.5 2.5.1 cram[2]

**Parent video:** 2.5 - Segmentation and Access Control
**Currently cited as:** `(inherits parent: 2.5 - Segmentation and Access Control)` → `(inherits parent: 2.5)`

**Item content:**

```
Term:   DMZ (Demilitarized Zone)
Def:    Isolated network segment for public-facing servers. Between internet and internal network.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers network segmentation concepts (physical, logical, VLANs), ACLs, and application allow/deny lists, but never mentions DMZ (Demilitarized Zone) or the concept of an isolated network segment positioned between the internet and internal network for public-facing servers. This is a fundamental network architecture concept that belongs in Security+ but is not present in this specific video. Based on the video inventory, this concept likely appears in videos covering network infrastructure or secure infrastructures (possibly '3.1 - Network Infrastructure Concepts' or '3.2 - Secure Infrastructures').

**Parser-suggested destinations:**
- (primary) `3.1 - Network Infrastructure Concepts`
- (alternate) `3.2 - Secure Infrastructures`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DMZ (Demilitarized Zone)` | 0 | 0 | 3.2 - Secure Infrastructures: 0 |
    | `DMZ` | 0 | 0 | 3.2 - Secure Infrastructures: 0 |
    | `dmz demilitarized zone` | 0 | 0 | 3.2 - Secure Infrastructures: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #59 (Jaccard 0.157 — same parent video): manual → `3.2 - Secure Infrastructures` / `3.2`

  - **By-precedent suggestion:** manual → `3.2 - Secure Infrastructures` / `3.2`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 128. §2.5 2.5.1 cram[3]

**Parent video:** 2.5 - Segmentation and Access Control
**Currently cited as:** `(inherits parent: 2.5 - Segmentation and Access Control)` → `(inherits parent: 2.5)`

**Item content:**

```
Term:   Air gap
Def:    Complete physical isolation — no network connection. Used for most sensitive systems.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of air gap (complete physical isolation with no network connection) does not appear in this transcript. The transcript discusses network segmentation through physical, logical, and virtual means, but never mentions air gap as a specific security control. Air gap is a Security+ concept that likely appears in a different Messer video covering physical security controls or infrastructure isolation techniques, such as '1.2 - Physical Security' or '3.1 - Secure Infrastructures'.

**Parser-suggested destinations:**
- (primary) `1.2 - Physical Security`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: common-threat-vectors-sy0-701.txt, network-infrastructure-concepts-sy0-701.txt, vulnerability-remediation-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Air gap` | 0 | 0 | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Air gap`: common-threat-vectors-sy0-701.txt (×1), network-infrastructure-concepts-sy0-701.txt (×3), vulnerability-remediation-sy0-701.txt (×2)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 129. §2.5 2.5.1 cram[5]

**Parent video:** 2.5 - Segmentation and Access Control
**Currently cited as:** `(inherits parent: 2.5 - Segmentation and Access Control)` → `(inherits parent: 2.5)`

**Item content:**

```
Term:   Microsegmentation
Def:    Granular segmentation — each workload isolated. Core Zero Trust architecture component.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers network segmentation concepts (physical, logical, VLANs, cloud/VM) and access controls, but never mentions microsegmentation as a distinct concept or its Zero Trust architecture connection. Microsegmentation — isolating each individual workload rather than subnet-level segmentation — is a more advanced segmentation pattern likely covered in Zero Trust or cloud infrastructure videos. The cited video teaches segmentation at subnet/VLAN granularity, not per-workload isolation.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Microsegmentation` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 130. §2.5 2.5.1 match[0]

**Parent video:** 2.5 - Segmentation and Access Control
**Currently cited as:** `(inherits parent: 2.5 - Segmentation and Access Control)` → `(inherits parent: 2.5)`

**Item content:**

```
Prompt: Isolated network for public-facing servers
Answer: DMZ / screened subnet
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers network segmentation concepts (physical, logical, VLANs, cloud-based segmentation) and access control lists, but never mentions DMZ, screened subnet, or the concept of an isolated network specifically for public-facing servers. This is a fundamental Security+ concept that likely appears in a different Messer video focused on network architecture or security zones (possibly in Section 3.1 or 3.2 dealing with infrastructure or secure architectures).

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `DMZ / screened subnet` | 0 | (no destination) | — |
    | `dmz screened subnet` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

- **Cross-packet consistency (Rule 5):** 1 prior-adjudicated item(s) match.
  - SB-fix-1a #3 #59 (Jaccard 0.072 — same parent video): manual → `3.2 - Secure Infrastructures` / `3.2`
**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 131. §2.5 2.5.1 match[2]

**Parent video:** 2.5 - Segmentation and Access Control
**Currently cited as:** `(inherits parent: 2.5 - Segmentation and Access Control)` → `(inherits parent: 2.5)`

**Item content:**

```
Prompt: Complete physical network isolation
Answer: Air gap
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The concept of 'air gap' (complete physical network isolation) does not appear in this transcript. The transcript discusses network segmentation including 'physical segmentation, where you are physically separating devices' but never introduces or defines the term 'air gap' or describes the specific concept of complete isolation from all networks. This is a legitimate Security+ concept that likely appears in a different Messer video covering physical security controls or network isolation techniques.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** partial-depth — concept absent from cited + parsed destinations; corpus-wide hits in: common-threat-vectors-sy0-701.txt, network-infrastructure-concepts-sy0-701.txt, vulnerability-remediation-sy0-701.txt. Likely sb16_subcategory=partial-depth.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Air gap` | 0 | (no destination) | — |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - `Air gap`: common-threat-vectors-sy0-701.txt (×1), network-infrastructure-concepts-sy0-701.txt (×3), vulnerability-remediation-sy0-701.txt (×2)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 132. §2.5 2.5.1 match[4]

**Parent video:** 2.5 - Segmentation and Access Control
**Currently cited as:** `(inherits parent: 2.5 - Segmentation and Access Control)` → `(inherits parent: 2.5)`

**Item content:**

```
Prompt: Per-workload isolation in Zero Trust
Answer: Microsegmentation
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers network segmentation, ACLs, and application allow/deny lists but never mentions 'microsegmentation' or the specific Zero Trust architectural pattern of per-workload isolation. Microsegmentation is a distinct concept (creating security zones around individual workloads, often at the VM/container level) that requires dedicated treatment. This concept almost certainly appears in '1.2 - Zero Trust' or possibly '3.1 - Cloud Infrastructures' given its prevalence in cloud/virtualization contexts.

**Parser-suggested destinations:**
- (primary) `1.2 - Zero Trust`
- (alternate) `3.1 - Cloud Infrastructures`


**🔍 Cadence Rule 2 + 5 — pre-analysis**

- **Cluster verification (Rule 2):** messer-curriculum-gap — needle absent corpus-wide. Likely sb16_subcategory=messer-curriculum-gap; defer to SB-fix-2 for Sybex arbitration.
  - Grep results:

    | Needle | Cited transcript | Primary destination | Alternates |
    |---|---|---|---|
    | `Microsegmentation` | 0 | 0 | 3.1 - Cloud Infrastructures: 0 |

    **Corpus-wide grep** (cited + parsed destinations all missed):
    
    - No hits across any of the 122+ transcripts.

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 133. §2.5 2.5.3 cram[2]

**Parent video:** 2.5 - Hardening Techniques
**Currently cited as:** `(inherits parent: 2.5 - Hardening Techniques)` → `(inherits parent: 2.5)`

**Item content:**

```
Term:   Secure boot
Def:    UEFI feature verifying boot software is signed and trusted — prevents bootkit attacks.
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers encryption (FDE, EFS, BitLocker), open ports, default passwords, EDR, host-based firewalls, HIPS, and application hardening. Secure boot — a UEFI firmware feature that verifies boot software signatures to prevent bootkit attacks — is not mentioned anywhere in the transcript. This is a distinct boot-time security mechanism that would more likely appear in a video covering firmware security, boot processes, or UEFI-specific hardening topics. Given the Security+ curriculum typically covers secure boot as part of system/firmware security, this is partial-adjacent rather than out-of-syllabus, but I cannot identify the specific correct Messer video from the inventory provided.

**Parser-suggested destinations:**
- (none — parser found no quoted Messer-video format in the justification; Aiden inference from prose required)

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---

### Item 134. §2.5 2.5.3 match[1]

**Parent video:** 2.5 - Hardening Techniques
**Currently cited as:** `(inherits parent: 2.5 - Hardening Techniques)` → `(inherits parent: 2.5)`

**Item content:**

```
Prompt: Verifying boot software is signed and trusted
Answer: Secure Boot
```

**LLM verdict:** `partial-adjacent` (confidence: high) — fix_direction: `move-to-correct-video`

**LLM justification (full):**

> The transcript covers system hardening techniques including encryption, endpoint security, firewalls, IPS, port management, and default passwords, but never mentions Secure Boot or boot software verification/signing. Secure Boot is a UEFI firmware feature that validates boot loader signatures—this is a boot-time security mechanism distinct from the OS-level and application-level hardening techniques discussed in this video. The concept likely belongs in a video covering firmware security or boot integrity (possibly '2.5 - Hardening Techniques' covers this in a section not captured, or it may appear in '3.1 - Infrastructure Considerations' or similar).

**Parser-suggested destinations:**
- (primary) `3.1 - Infrastructure Considerations`

**Aiden decision** (mark one):
- [ ] accept primary destination
- [ ] accept alternate (specify): ____
- [ ] manual (specify messerVideo + subObjective): ____
- [ ] reject — keep current citation, mark as confirmed correct
- [ ] defer to next packet

---


## Packet summary

- Items in this packet: 34
- Parser-yielded primary destination available on: 12 / 34
- match items: 16
- cram items: 18
- By section: §2.4=26, §2.5=8
- Remaining after this packet: 0 items (next packet start = 134)
---ready-for-supervisor---
