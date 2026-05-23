# SB-fix-2 packet P3 — sub-path P

Generated: 2026-05-23T09:05:23.043Z
Sub-path: P (partial-depth)
Source: `questions.json` items where `audit_d_review.sb16_candidate === true` AND `sb16_subcategory === "partial-depth"` AND `sb_fix_2` not yet applied.
Scope total (across all packets for this sub-path): 56 items
This packet: items 41–56 of 56 (size 16)

## How to review

For each item below: choose ONE decision. Fill in sybex_reference fields per the canonical format. CompTIA objective reference required for keep-with-sybex-note + re-cite-to-sybex (e.g. "2.4" or "2.4.6"). Note field optional.

Canonical Sybex citation format: `"Chapple 9th, Chapter N, §Section, p.NN"` — page optional.

After all 50 (or N) decisions are recorded, return the marked-up packet to CC.

---

### Item 41. §2.4 2.4.14 mc[1]  —  partial-depth

**Parent video:** 2.4 - Password Attacks
**Current citation:** 2.4 - Password Attacks  /  2.4
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
q:   Which BEST explains why credential stuffing attacks are effective?
    [0] Attackers guess a few common passwords across many user accounts to find an account where the guess matches (this is password spraying)
  ★ [1] Many users reuse the same username and password across multiple services — credentials breached from one site work directly against many other services without any guessing
    [2] Attackers buy or steal a password hash database from a target site and try every account with the recovered credentials (this is database theft + cracking)
    [3] Attackers crack stolen NTLM hashes offline using GPU rigs and then replay the recovered cleartext passwords against the original target (offline cracking)
exp: Credential stuffing exploits PASSWORD REUSE across services. The attacker takes a username/password list breached from one site (or bought from a leak market) and replays it against many other sites. Wherever the user reused the credential, the login succeeds — no guessing, no cracking. Defense: unique passwords per site (password manager), MFA on every account, breach-credential monitoring at signup. Distractors describe related but distinct attacks: spraying (B), database theft + cracking (C), offline hash cracking (D). The defining reuse axis is what makes stuffing effective at scale.
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

### Item 42. §2.4 2.4.14 mc[2]  —  partial-depth

**Parent video:** 2.4 - Password Attacks
**Current citation:** 2.4 - Password Attacks  /  2.4
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
q:   Which attack is MOST effectively mitigated by MFA but NOT account lockout?
    [0] Brute force
    [1] Password spraying
    [2] Pass-the-hash
  ★ [3] Credential stuffing
exp: Credential stuffing uses valid credentials — account lockout won't trigger. MFA prevents access even with correct credentials.
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

### Item 43. §2.4 2.4.14 mc[3]  —  partial-depth

**Parent video:** 2.4 - Password Attacks
**Current citation:** 2.4 - Password Attacks  /  2.4
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
q:   Which BEST captures why pass-the-hash is particularly dangerous in Windows enterprise environments?
    [0] Pass-the-hash succeeds against modern Kerberos-based authentication out of the box, so even a fully Kerberos-enforced domain provides no protection against the technique
  ★ [1] A captured NTLM hash authenticates as the target user against any NTLM-accepting service — no cracking needed, no rotation defeats it; lateral movement is one tool away wherever the user is logged in
    [2] NTLM hashes can be decrypted to cleartext passwords by anyone who knows the published Microsoft decryption key, so the hash itself acts like a cleartext credential
    [3] Pass-the-hash gives the attacker raw kernel access on the target, allowing them to load any driver and disable EDR before performing the actual authentication attempt
exp: Pass-the-hash is dangerous because the hash IS the credential — capturing it (from lsass memory, SAM database, or domain controller replication) gives the attacker authenticated access to every NTLM-accepting service the user can reach. Because NTLM hashes don't change unless the user changes their password, and because Windows admin accounts are often used to log into many hosts (each leaving a hash in memory), one hash capture often unlocks broad lateral movement. This is why credential hygiene (admin tier separation, no admin logon to workstations, LAPS, strict NTLM restrictions) is critical. Kerberos-only enforcement DOES help (B is wrong); NTLM hashes are NOT reversible (C is wrong); kernel access is a different attack class (D is wrong).
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

### Item 44. §2.4 2.4.14 scen[0]  —  partial-depth

**Parent video:** 2.4 - Password Attacks
**Current citation:** 2.4 - Password Attacks  /  2.4
**SB-fix-1a/1b origin:** packet-3

**Item content:**

```
q:   An attacker obtains 10 million leaked username/password pairs from a social media breach. A script tests these credentials against a financial institution's login page. 23,000 pairs succeed — users who reused their social media password for their bank account. What attack is this, and what control would have been MOST effective?
    [0] Brute force attack — prevented by account lockout after 5 failed attempts
    [1] Password spraying — prevented by monitoring for single passwords across multiple accounts
    [2] Dictionary attack — prevented by requiring complex passwords
  ★ [3] Credential stuffing — most effectively prevented by MFA, which makes the correct password insufficient on its own
exp: Credential stuffing exploits password reuse — it uses correct passwords, so account lockout and complexity requirements don't help. MFA is the most effective control: even with the correct password, the attacker needs the second factor they don't have.
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

### Item 45. §2.5 2.5.3 cram[2]  —  partial-depth

**Parent video:** 2.5 - Hardening Techniques
**Current citation:** (inherits parent: 2.5 - Hardening Techniques)  /  (inherits parent: 2.5)
**SB-fix-1a/1b origin:** packet-4

**Item content:**

```
Term:  Secure boot
Def:   UEFI feature verifying boot software is signed and trusted — prevents bootkit attacks.
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

### Item 46. §2.5 2.5.3 match[1]  —  partial-depth

**Parent video:** 2.5 - Hardening Techniques
**Current citation:** (inherits parent: 2.5 - Hardening Techniques)  /  (inherits parent: 2.5)
**SB-fix-1a/1b origin:** packet-4

**Item content:**

```
Prompt: Verifying boot software is signed and trusted
Answer: Secure Boot
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

### Item 47. §3.4 3.4.3 cram[1]  —  partial-depth

**Parent video:** 3.4 - Recovery Testing
**Current citation:** (inherits parent: 3.4 - Recovery Testing)  /  (inherits parent: 3.4)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Term:  Parallel test
Def:   Recovery systems brought online alongside production — both running simultaneously. Validates recovery without risk.
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

### Item 48. §3.4 3.4.3 cram[2]  —  partial-depth

**Parent video:** 3.4 - Recovery Testing
**Current citation:** (inherits parent: 3.4 - Recovery Testing)  /  (inherits parent: 3.4)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Term:  Full interruption test
Def:   Production actually fails over to recovery — real outage. Most realistic, highest risk and cost.
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

### Item 49. §3.4 3.4.4 match[0]  —  partial-depth

**Parent video:** 3.4 - Backups
**Current citation:** (inherits parent: 3.4 - Backups)  /  (inherits parent: 3.4)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: All data changed since last full backup
Answer: Differential backup
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

### Item 50. §4.1 4.1.3 cram[4]  —  partial-depth

**Parent video:** 4.1 - Securing Wireless and Mobile
**Current citation:** (inherits parent: 4.1 - Securing Wireless and Mobile)  /  (inherits parent: 4.1)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Term:  MAM (Mobile Application Management)
Def:   Manages individual applications rather than the whole device — more granular than MDM.
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

### Item 51. §4.3 4.3.2 match[2]  —  partial-depth

**Parent video:** 4.3 - Threat Intelligence
**Current citation:** (inherits parent: 4.3 - Threat Intelligence)  /  (inherits parent: 4.3)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: Standardized threat intel sharing format
Answer: STIX/TAXII
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

### Item 52. §4.3 4.3.4 mc[2]  —  partial-depth

**Parent video:** 4.3 - Analyzing Vulnerabilities
**Current citation:** 4.3 - Analyzing Vulnerabilities  /  4.3
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
q:   EPSS improves vulnerability prioritization by:
  ★ [0] Adding the probability that a vulnerability will be actively exploited in the wild — helping focus on likely real-world threats
    [1] Replacing CVSS as the primary scoring framework used by every vulnerability scanner output
    [2] Automating patch deployment timelines based on the predicted exploitation probability score
    [3] Calculating the expected financial impact of each unpatched vulnerability per asset class
exp: CVSS measures severity; EPSS measures likelihood of exploitation. Combining them improves prioritization.
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

### Item 53. §5.2 5.2.4 cram[5]  —  partial-depth

**Parent video:** 5.2 - Business Impact Analysis
**Current citation:** (inherits parent: 5.2 - Business Impact Analysis)  /  (inherits parent: 5.2)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Term:  Maximum tolerable downtime (MTD)
Def:   Maximum time a business function can be unavailable before the organization fails to survive.
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

### Item 54. §5.2 5.2.4 match[4]  —  partial-depth

**Parent video:** 5.2 - Business Impact Analysis
**Current citation:** (inherits parent: 5.2 - Business Impact Analysis)  /  (inherits parent: 5.2)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: Maximum time before organization cannot survive
Answer: MTD
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

### Item 55. §5.5 5.5.2 match[2]  —  partial-depth

**Parent video:** 5.5 - Penetration Tests
**Current citation:** (inherits parent: 5.5 - Penetration Tests)  /  (inherits parent: 5.5)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Prompt: Retesting after fixes to confirm remediation
Answer: Remediation validation
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

### Item 56. §5.6 5.6.1 cram[3]  —  partial-depth

**Parent video:** 5.6 - Security Awareness
**Current citation:** (inherits parent: 5.6 - Security Awareness)  /  (inherits parent: 5.6)
**SB-fix-1a/1b origin:** sb-fix-2-r

**Item content:**

```
Term:  Security champions
Def:   Embedded security advocates within business teams — amplify security culture.
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

- Items in this packet: 16
- By section: §2.4=4, §2.5=2, §3.4=3, §4.1=1, §4.3=2, §5.2=2, §5.5=1, §5.6=1
- By type: cram=6, match=5, mc=4, scen=1
- Remaining after this packet: 0