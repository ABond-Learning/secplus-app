# SB-fix-2 packet P1 — sub-path P

Generated: 2026-05-23T09:05:18.730Z
Sub-path: P (partial-depth)
Source: `questions.json` items where `audit_d_review.sb16_candidate === true` AND `sb16_subcategory === "partial-depth"` AND `sb_fix_2` not yet applied.
Scope total (across all packets for this sub-path): 56 items
This packet: items 1–20 of 56 (size 20)

## How to review

For each item below: choose ONE decision. Fill in sybex_reference fields per the canonical format. CompTIA objective reference required for keep-with-sybex-note + re-cite-to-sybex (e.g. "2.4" or "2.4.6"). Note field optional.

Canonical Sybex citation format: `"Chapple 9th, Chapter N, §Section, p.NN"` — page optional.

After all 50 (or N) decisions are recorded, return the marked-up packet to CC.

---

### Item 1. §1.2 1.2.2 match[3]  —  partial-depth

**Parent video:** 1.2 - Non-repudiation
**Current citation:** (inherits parent: 1.2 - Non-repudiation)  /  (inherits parent: 1.2)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: Provides integrity + authentication but NOT non-repudiation
Answer: HMAC
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

### Item 2. §1.2 1.2.2 mc[4]  —  partial-depth

**Parent video:** 1.2 - Non-repudiation
**Current citation:** 1.2 - Non-repudiation  /  1.2
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
q:   Why does HMAC NOT provide non-repudiation?
    [0] It uses asymmetric keys that anyone can verify with a public key
  ★ [1] Both parties share the same key so either could have created it
    [2] It only verifies integrity but not the origin of the message
    [3] It depends on a centralized timestamp authority that may not exist
exp: Non-repudiation requires that only one party could have created the proof. HMAC's shared key means either party could have.
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

### Item 3. §1.2 1.2.6 match[5]  —  partial-depth

**Parent video:** 1.2 - Physical Security
**Current citation:** (inherits parent: 1.2 - Physical Security)  /  (inherits parent: 1.2)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: Physically secures a laptop to a desk
Answer: Cable lock
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

### Item 4. §2.3 2.3.2 match[3]  —  partial-depth

**Parent video:** 2.3 - Buffer Overflows
**Current citation:** (inherits parent: 2.3 - Buffer Overflows)  /  (inherits parent: 2.3)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: Common C functions causing buffer overflows
Answer: strcpy, gets, sprintf (no bounds checking)
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

### Item 5. §2.3 2.3.8 cram[3]  —  partial-depth

**Parent video:** 2.3 - Hardware Vulnerabilities
**Current citation:** (inherits parent: 2.3 - Hardware Vulnerabilities)  /  (inherits parent: 2.3)
**SB-fix-1a/1b origin:** packet-2

**Item content:**

```
Term:  Specter/Meltdown
Def:   CPU speculative execution vulnerabilities allowing reading of protected memory. Hardware-level flaw.
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

### Item 6. §2.3 2.3.8 match[3]  —  partial-depth

**Parent video:** 2.3 - Hardware Vulnerabilities
**Current citation:** (inherits parent: 2.3 - Hardware Vulnerabilities)  /  (inherits parent: 2.3)
**SB-fix-1a/1b origin:** packet-2

**Item content:**

```
Prompt: CPU vulnerability exploiting speculative execution
Answer: Specter / Meltdown
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

### Item 7. §2.3 2.3.8 mc[2]  —  partial-depth

**Parent video:** 2.3 - Hardware Vulnerabilities
**Current citation:** 2.3 - Hardware Vulnerabilities  /  2.3
**SB-fix-1a/1b origin:** packet-1

**Item content:**

```
q:   Specter and Meltdown are examples of:
    [0] Software-based code injection attacks against running applications
  ★ [1] CPU hardware vulnerabilities exploiting speculative execution to read protected memory
    [2] Firmware vulnerabilities found in BIOS or UEFI boot components
    [3] Social engineering attacks targeting end users with phishing emails
exp: Specter and Meltdown are CPU hardware-level vulnerabilities — they exploit speculative execution to leak protected memory contents.
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

### Item 8. §2.4 2.4.2 cram[3]  —  partial-depth

**Parent video:** 2.4 - Viruses and Worms
**Current citation:** (inherits parent: 2.4 - Viruses and Worms)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Term:  Metamorphic virus
Def:   Completely rewrites its own code with each infection — most evasive type.
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

### Item 9. §2.4 2.4.4 cram[5]  —  partial-depth

**Parent video:** 2.4 - Other Malware Types
**Current citation:** (inherits parent: 2.4 - Other Malware Types)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Term:  Cryptominer
Def:   Uses victim's CPU/GPU to mine cryptocurrency without consent — causes performance degradation.
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

### Item 10. §2.4 2.4.4 match[4]  —  partial-depth

**Parent video:** 2.4 - Other Malware Types
**Current citation:** (inherits parent: 2.4 - Other Malware Types)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Prompt: Uses victim CPU to mine cryptocurrency
Answer: Cryptominer
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

### Item 11. §2.4 2.4.5 cram[1]  —  partial-depth

**Parent video:** 2.4 - Physical Attacks
**Current citation:** (inherits parent: 2.4 - Physical Attacks)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Term:  Skimming
Def:   Device attached to card readers (ATMs, POS) to capture card data.
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

### Item 12. §2.4 2.4.5 match[1]  —  partial-depth

**Parent video:** 2.4 - Physical Attacks
**Current citation:** (inherits parent: 2.4 - Physical Attacks)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Prompt: Device on ATM capturing card data
Answer: Skimming
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

### Item 13. §2.4 2.4.6 cram[4]  —  partial-depth

**Parent video:** 2.4 - Denial of Service
**Current citation:** (inherits parent: 2.4 - Denial of Service)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Term:  SYN flood
Def:   Sends many SYN packets without completing handshake — exhausts server connection table (half-open connections).
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

### Item 14. §2.4 2.4.6 match[2]  —  partial-depth

**Parent video:** 2.4 - Denial of Service
**Current citation:** (inherits parent: 2.4 - Denial of Service)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Prompt: TCP handshake exploit leaving half-open connections
Answer: SYN flood
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

### Item 15. §2.4 2.4.6 mc[1]  —  partial-depth

**Parent video:** 2.4 - Denial of Service
**Current citation:** 2.4 - Denial of Service  /  2.4
**SB-fix-1a/1b origin:** packet-2

**Item content:**

```
q:   A SYN flood attack works by:
  ★ [0] Sending many TCP SYN packets without completing the three-way handshake, exhausting the server's connection table
    [1] Flooding a target with large UDP packets
    [2] Amplifying traffic using DNS servers
    [3] Disrupting application-layer HTTP requests
exp: SYN floods leave many half-open TCP connections — eventually the server's connection table is full and it can't accept legitimate connections.
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

### Item 16. §2.4 2.4.7 cram[4]  —  partial-depth

**Parent video:** 2.4 - DNS Attacks
**Current citation:** (inherits parent: 2.4 - DNS Attacks)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Term:  DNS tunneling
Def:   Hiding data exfiltration or C2 traffic within DNS queries — often overlooked by firewalls that allow DNS.
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

### Item 17. §2.4 2.4.7 match[3]  —  partial-depth

**Parent video:** 2.4 - DNS Attacks
**Current citation:** (inherits parent: 2.4 - DNS Attacks)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Prompt: Data hidden in DNS queries for exfiltration
Answer: DNS tunneling
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

### Item 18. §2.4 2.4.7 mc[2]  —  partial-depth

**Parent video:** 2.4 - DNS Attacks
**Current citation:** 2.4 - DNS Attacks  /  2.4
**SB-fix-1a/1b origin:** packet-2

**Item content:**

```
q:   DNS tunneling is used to:
  ★ [0] Hide data exfiltration or C2 traffic within DNS queries — often passing through firewalls that allow DNS
    [1] Resolve hostnames faster by bypassing the standard recursive DNS hierarchy entirely
    [2] Conduct a denial-of-service attack against an authoritative DNS server's query handling
    [3] Poison the DNS cache of a recursive resolver to redirect users to a malicious destination
exp: DNS tunneling encodes data within DNS queries — many firewalls allow all DNS traffic, making it a covert channel.
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

### Item 19. §2.4 2.4.8 cram[0]  —  partial-depth

**Parent video:** 2.4 - Wireless Attacks
**Current citation:** (inherits parent: 2.4 - Wireless Attacks)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Term:  Evil twin
Def:   Rogue access point mimicking a legitimate SSID. Victims connect and attacker intercepts traffic (MITM).
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

### Item 20. §2.4 2.4.8 cram[2]  —  partial-depth

**Parent video:** 2.4 - Wireless Attacks
**Current citation:** (inherits parent: 2.4 - Wireless Attacks)  /  (inherits parent: 2.4)
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
Term:  WPA2 handshake capture
Def:   Capturing the 4-way handshake during authentication for offline brute-force cracking.
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

- Items in this packet: 20
- By section: §1.2=3, §2.3=4, §2.4=13
- By type: cram=8, match=8, mc=4
- Remaining after this packet: 36