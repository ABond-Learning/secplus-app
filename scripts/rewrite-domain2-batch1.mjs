// One-shot REWRITE: 19 in-place BEST/MOST rewrites of legacy Domain 2 MCs.
// All items use the REPLACEMENTS pattern from add-domain4-batch2.mjs:
// safety-checked old-stem-prefix match before overwrite, idempotent re-runs,
// SM-2 indices preserved (mc-2.X.Y-N keys retain their slot but get new content).
//
// All 19 items currently lack messerVideo + subObjective (legacy). The rewrites
// add citations — they become "new items" per validator classification, dropping
// the legacy-no-citation info count by 19.
//
// This is the FIRST content modification (vs addition) in Task 1b. Questions
// previously studied via SM-2 retain index stability but show new content. This
// is expected and acceptable per the rewrite plan.
//
// Usage:
//   node scripts/rewrite-domain2-batch1.mjs            # dry-run summary
//   node scripts/rewrite-domain2-batch1.mjs --preview  # write previewed copy to /tmp
//   node scripts/rewrite-domain2-batch1.mjs --write    # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2b1-preview.json";
const write = process.argv.includes("--write");
const preview = process.argv.includes("--preview");

const REPLACEMENTS = [
  // ─── Item 1: §2.1.1 mc[8] APT vs typical cyberattack (heavy) ───
  {
    videoId: "2.1.1", kind: "mc", index: 8,
    expectedOldStemPrefix: "An APT differs from a typical cyberattack",
    item: {
      q: "Which BEST distinguishes an APT (Advanced Persistent Threat) from a typical opportunistic cyberattack?",
      opts: [
        "APT actors target the broadest attack surface they can reach; opportunistic attackers focus on small numbers of pre-selected high-value targets",
        "APT campaigns prioritize long-term stealthy access and persistence; opportunistic attacks prioritize fast visible impact (deface, ransom, smash-and-grab)",
        "APT actors are typically motivated by short-term financial gain; opportunistic attackers pursue strategic intelligence over months",
        "APTs exclusively use zero-day exploits while opportunistic attacks rely only on known and already-patched CVEs",
      ],
      a: 1,
      exp: "Advanced Persistent Threats are characterized by long-term, stealthy access where the goal is to remain undetected and exfiltrate or position over time — typical of nation-state and named groups (APT29, Lazarus). Opportunistic attacks prioritize speed and impact: ransomware deployment, defacement, credential harvesting that monetizes quickly. The reversed-target distractor (A), reversed-motivation distractor (C), and zero-day-only distractor (D) are common confusions; in reality APTs use whatever access works, including phishing and known CVEs alongside zero-days.",
      messerVideo: "2.1 - Threat Actors",
      subObjective: "2.1",
    },
  },

  // ─── Item 2: §2.2.2 mc[3] Pharming vs phishing (heavy) ───
  {
    videoId: "2.2.2", kind: "mc", index: 3,
    expectedOldStemPrefix: "Pharming differs from phishing in that:",
    item: {
      q: "Which BEST distinguishes pharming from phishing?",
      opts: [
        "Pharming subverts DNS or hosts-file resolution so a user typing the correct URL is sent to a fake site; phishing requires the user to click a malicious link",
        "Pharming uses email lures while phishing exploits DNS resolution; the two attacks share the same goal but use opposite delivery channels",
        "Pharming targets only executives via spear-phishing techniques while phishing is broad-spectrum across the workforce",
        "Pharming requires browser zero-day exploits while phishing requires no software exploits at all to succeed",
      ],
      a: 0,
      exp: "Pharming poisons name resolution (DNS cache, hosts file, or DNS server itself) so a user typing the correct URL gets sent to an attacker-controlled site — no user error needed beyond visiting their normal destination. Phishing requires the user to click a malicious link or visit an attacker URL. The reversed distractor (B — 'pharming uses email') is the most common confusion because the two terms sound similar; the targeting axis (C) and the exploit-required axis (D) are not the defining differences.",
      messerVideo: "2.2 - Phishing",
      subObjective: "2.2",
    },
  },

  // ─── Item 3: §2.2.5 mc[3] Disinformation vs misinformation (heavy) ───
  {
    videoId: "2.2.5", kind: "mc", index: 3,
    expectedOldStemPrefix: "Disinformation differs from misinformation in that:",
    item: {
      q: "Which BEST distinguishes disinformation from misinformation?",
      opts: [
        "Disinformation is deliberately false content created with intent to deceive; misinformation is false content spread by people who believe it is true (no malicious intent)",
        "The two terms are interchangeable in standard usage and refer to the same phenomenon of false content circulating online",
        "Disinformation appears only in printed media while misinformation is exclusively a social-media phenomenon spread by ordinary users",
        "Disinformation is published only by state-sponsored actors while misinformation is shared only by individual social-media users",
      ],
      a: 0,
      exp: "The defining axis is intent. Disinformation is deliberately false — created and propagated by an actor (state, corporate, political) who knows it is false and seeks to deceive an audience for advantage. Misinformation is false content spread by people who genuinely believe it is true; the false claim still propagates but no deceit is intended. The terms are NOT interchangeable; medium and actor type are not the defining axis. The distinction matters operationally — countering disinformation requires attribution and source disruption, while countering misinformation requires factual correction and media literacy.",
      messerVideo: "2.2 - Other Social Engineering Attacks",
      subObjective: "2.2",
    },
  },

  // ─── Item 4: §2.3.6 mc[3] Blind SQLi vs in-band (heavy) ───
  {
    videoId: "2.3.6", kind: "mc", index: 3,
    expectedOldStemPrefix: "Blind SQL injection differs from regular SQLi",
    item: {
      q: "Which BEST distinguishes blind SQL injection from in-band SQL injection?",
      opts: [
        "In blind SQLi the database does not return query results in the response; the attacker infers data one bit at a time from side effects (boolean responses, timing, error presence)",
        "Blind SQLi targets stored procedures specifically while in-band targets only inline SQL queries embedded in the application code",
        "Blind SQLi requires authenticated access to the application while in-band runs unauthenticated against any reachable endpoint",
        "Blind SQLi works only against MySQL while in-band SQL injection works against any relational database management system",
      ],
      a: 0,
      exp: "In-band SQLi returns query results directly in the application's response, often via UNION SELECT or visible error messages. Blind SQLi has no direct data return — the attacker extracts data bit-by-bit by observing side effects: a true/false boolean condition that changes the page output, a timing difference (sleep-based), or the presence/absence of an error. Blind SQLi is slower but works against modern apps that suppress raw query output. Stored procedures, authentication state, and database vendor are not the defining axis.",
      messerVideo: "2.3 - SQL Injection",
      subObjective: "2.3",
    },
  },

  // ─── Item 5: §2.3.9 mc[2] Type 1 vs Type 2 hypervisor (partial) ───
  {
    videoId: "2.3.9", kind: "mc", index: 2,
    expectedOldStemPrefix: "A Type 1 hypervisor differs from a Type 2 hypervisor",
    item: {
      q: "Which BEST distinguishes a Type 1 hypervisor from a Type 2 hypervisor?",
      opts: [
        "Type 1 runs directly on bare metal hardware with its own minimal kernel; Type 2 runs as an application on top of a host operating system that mediates hardware access",
        "Type 1 is software-based and runs as an application on the host OS; Type 2 is hardware-based with its own embedded kernel and direct hardware access",
        "Type 1 hypervisors are designed for desktop and developer use; Type 2 hypervisors are designed for production data center virtualization workloads",
        "Type 1 supports only paravirtualized guest operating systems; Type 2 supports only fully virtualized guest operating systems with no overlap",
      ],
      a: 0,
      exp: "A Type 1 hypervisor (bare-metal) installs directly on hardware and contains its own minimal OS kernel — examples include VMware ESXi, Microsoft Hyper-V Server, and KVM. A Type 2 hypervisor runs as an application on top of an existing host OS — examples include VMware Workstation, VirtualBox, and Parallels Desktop. The reversed-software-vs-hardware distractor (B) is the classic misconception. The use-case reversal (C) confuses where each is typically deployed (Type 1 = production, Type 2 = developer/desktop). Para vs full virtualization (D) is a different axis.",
      messerVideo: "2.3 - Virtualization Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 6: §2.3.11 mc[0] Supply chain attack scenario (heavy, c2) ───
  {
    videoId: "2.3.11", kind: "mc", index: 0,
    expectedOldStemPrefix: "A supply chain attack differs from a direct attack",
    item: {
      q: "An attacker compromises a widely-used IT management product so that the vendor's signed update pushes a backdoor to thousands of customers via the normal update channel. This is BEST described as:",
      opts: [
        "A supply chain attack — the attacker compromises an upstream component (vendor product, dependency, hardware) so the malicious payload reaches downstream customers via legitimate trust relationships",
        "A watering hole attack — the attacker compromises a website that the target population is known to visit, infecting visitors via the trusted site",
        "A direct phishing campaign — the attacker sends crafted emails to each affected target organization individually with malicious links or attachments",
        "An insider threat — a malicious employee at each affected customer organization independently installed the backdoor on production systems",
      ],
      a: 0,
      exp: "Supply chain attacks compromise an upstream element — software dependency, vendor product, hardware component — that downstream consumers trust by default. The compromise then propagates to many targets via legitimate update or distribution channels (signed updates, package managers, vendor downloads). Watering hole targets a specific website; direct phishing requires per-target outreach; insider threat is a per-organization compromise. The signature of supply chain attacks is that ONE upstream compromise reaches many downstream victims through their normal trust relationships.",
      messerVideo: "2.3 - Supply Chain Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 7: §2.4.14 mc[0] Password spraying vs brute force (heavy) ───
  {
    videoId: "2.4.14", kind: "mc", index: 0,
    expectedOldStemPrefix: "Password spraying differs from traditional brute force",
    item: {
      q: "Which BEST distinguishes password spraying from a traditional brute-force attack?",
      opts: [
        "Password spraying tries a small number of common passwords across many user accounts to evade per-account lockout thresholds; traditional brute force tries many passwords against a single account",
        "Password spraying targets only enterprise SSO endpoints while traditional brute force targets only individual workstation login screens",
        "Password spraying requires the attacker to already have a valid password hash for offline cracking; traditional brute force is performed online against the live login service",
        "Password spraying succeeds only when MFA is disabled on the target accounts while traditional brute force succeeds even when MFA is enforced",
      ],
      a: 0,
      exp: "Password spraying inverts the brute-force pattern: instead of many passwords times one account (which triggers lockout fast), the attacker uses a few common passwords (Password123!, Spring2026!, Welcome01) times many accounts. Each account sees only one or two attempts, staying under the lockout threshold. Spraying does not require offline hashes, is not platform-limited to SSO, and the MFA framing is not the differentiator. Detection requires watching for a small set of failed-login passwords distributed across many accounts within a window.",
      messerVideo: "2.4 - Password Attacks",
      subObjective: "2.4",
    },
  },

  // ─── Item 8: §2.5.3 mc[3] EDR vs antivirus (partial) ───
  {
    videoId: "2.5.3", kind: "mc", index: 3,
    expectedOldStemPrefix: "EDR (Endpoint Detection and Response) differs from traditional antivirus",
    item: {
      q: "Which BEST distinguishes EDR from traditional signature-based antivirus?",
      opts: [
        "EDR only detects known malware signatures and is therefore equivalent to traditional AV with a different name",
        "EDR provides behavioral detection, continuous endpoint telemetry, and active response (isolation, kill, rollback) — not just file-signature matching",
        "EDR replaces the need for a SIEM because it correlates logs from network and identity sources directly without any separate platform",
        "EDR is delivered exclusively as a cloud-only managed service while traditional antivirus runs only on-premises endpoints",
      ],
      a: 1,
      exp: "Traditional signature-based antivirus matches files against a known-malware-hash database — fast on known threats but misses novel and polymorphic malware. EDR adds behavioral detection (process trees, parent-child anomalies, lateral movement signals), continuous endpoint telemetry streamed to a central plane for hunting and post-hoc investigation, and active response capabilities (isolate the host from network, kill processes, roll back changes). Distractor A is what a student picks if they think EDR is just rebranded AV. EDR does not replace SIEM (they are complementary), and EDR is not cloud-only.",
      messerVideo: "2.5 - Hardening Techniques",
      subObjective: "2.5",
    },
  },

  // ─── Item 9: §2.4.10 mc[1] Pass-the-hash as replay (partial) ───
  {
    videoId: "2.4.10", kind: "mc", index: 1,
    expectedOldStemPrefix: "Pass-the-hash is a type of replay attack because:",
    item: {
      q: "Which BEST explains why pass-the-hash is classified as a type of replay attack?",
      opts: [
        "The captured NTLM hash is replayed directly to a service for authentication — no need to crack or recover the original password; the hash itself is the authentication credential",
        "The attacker first cracks the captured hash offline to recover the cleartext password, then replays the cleartext to the target service to authenticate",
        "The attack requires the attacker to be on the same Layer 2 broadcast domain as both the original session and the target service for the replay to succeed",
        "The attack only works against web applications that use form-based authentication and stores the captured session hash in a session cookie",
      ],
      a: 0,
      exp: "Pass-the-hash exploits Windows authentication's design: the NTLM/NTLMv2 hash IS the authentication credential, so an attacker who captures the hash (from memory dump, lsass, etc.) can authenticate to any service that accepts NTLM by replaying the hash directly — no password recovery step needed. The cracking distractor describes a different attack flow (offline brute force then password use). The same-network distractor is wrong — pass-the-hash works across network boundaries as long as the attacker can reach the target service. Web/cookie scope is wrong — pass-the-hash targets Windows authentication, not web sessions.",
      messerVideo: "2.4 - Replay Attacks",
      subObjective: "2.4",
    },
  },

  // ─── Item 10: §2.2.1 mc[0] Threat vector best defined (partial) ───
  {
    videoId: "2.2.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "A threat vector is best defined as:",
    item: {
      q: "Which BEST defines a threat vector?",
      opts: [
        "A category of malware (virus, worm, trojan) classified by how it infects and propagates across endpoints",
        "The path or method an attacker uses to gain unauthorized access (e.g. email attachment, removable media, exposed RDP, supply chain)",
        "A numeric vulnerability severity score that quantifies the impact and exploitability of a discovered weakness",
        "A category of threat actor (e.g. nation-state, hacktivist, insider) ranked by typical motivation and technical capability",
      ],
      a: 1,
      exp: "A threat vector is the route or method by which an attacker reaches a target — common vectors include email, removable media, exposed remote services (RDP, SSH), supply chain components, and direct network access. Distinguishing it from related concepts: malware is the payload that arrives; CVSS is the severity score; threat actor is who is conducting the attack. The vector is the HOW-IT-GETS-IN axis specifically, distinct from the WHO and the WHAT.",
      messerVideo: "2.2 - Common Threat Vectors",
      subObjective: "2.2",
    },
  },

  // ─── Item 11: §2.4.4 mc[0] Trojan horse (stem + distractor purity per user) ───
  {
    videoId: "2.4.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "A Trojan horse malware is best described as:",
    item: {
      q: "Which BEST describes Trojan horse malware?",
      opts: [
        "Self-propagating malware that spreads from host to host across networks without requiring user action",
        "Malicious code disguised as legitimate software that requires the user to install or execute it (a delivery mechanism, not a payload category)",
        "Malware that encrypts the victim's data and demands cryptocurrency payment for the decryption key to restore access",
        "Stealthy malware that hides its presence by intercepting OS calls and concealing files, processes, and registry keys",
      ],
      a: 1,
      exp: "A Trojan is malicious code packaged inside something the user wants to install or run — pirated software, a fake app installer, a bundled 'free' tool. The defining axis is that it requires user-initiated execution and is a DELIVERY MECHANISM rather than a self-propagating category. A Trojan can CARRY ransomware, a backdoor, or other payloads, but the Trojan IS the disguise. The distractors describe distinct other categories: worms self-propagate (A); ransomware encrypts and extorts (C); rootkits hide presence (D). Confusing the delivery mechanism (Trojan) with the payload (ransomware/worm) is the most common error.",
      messerVideo: "2.4 - Other Malware Types",
      subObjective: "2.4",
    },
  },

  // ─── Item 12: §2.4.5 mc[2] Shoulder surfing scenario (heavy, c2) ───
  {
    videoId: "2.4.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "Shoulder surfing is best mitigated by:",
    item: {
      q: "An employee enters their banking PIN at a self-service kiosk in an open lobby and notices someone standing close behind them. Which mitigation is MOST effective at preventing this specific class of disclosure?",
      opts: [
        "Physical and visual mitigations specific to the threat: privacy filter on the screen, body-shield the keypad, and reposition the kiosk away from common over-the-shoulder sightlines",
        "Enforce multi-factor authentication on the account so that a stolen PIN alone cannot grant the attacker access to the underlying banking session",
        "Replace the static PIN with a stronger 12-character alphanumeric password to increase entropy and resist credential-guessing attacks",
        "Encrypt the device's local storage so that any captured screen image or input log stored on the kiosk cannot be read offline by an attacker who later seizes it",
      ],
      a: 0,
      exp: "Shoulder surfing is observation of credential entry by a person physically present. The threat axis is visual exposure during entry, so the effective mitigations are physical and visual: privacy filters that narrow the viewing angle, body-shielding the keypad, and kiosk positioning that prevents over-the-shoulder visibility. MFA addresses what an attacker can do AFTER capturing the PIN but does not stop the disclosure. A stronger password is still equally visible to the surfer. Encryption addresses an entirely different threat (offline data access). Students often default to MFA or stronger credentials for any 'stolen credential' scenario; for shoulder surfing the threat is in-the-moment observation and the mitigation must address that specifically.",
      messerVideo: "2.4 - Physical Attacks",
      subObjective: "2.4",
    },
  },

  // ─── Item 13: §2.5.1 mc[0] Network segmentation security benefit (heavy) ───
  {
    videoId: "2.5.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "The primary security benefit of network segmentation",
    item: {
      q: "Which BEST captures the primary SECURITY benefit (not operational benefit) of network segmentation?",
      opts: [
        "Limiting lateral movement — if one segment is compromised the attacker must cross additional controls to reach other segments, slowing spread and aiding detection",
        "Encrypting traffic between hosts in different segments via the segment boundary devices, providing built-in confidentiality without needing TLS or IPsec",
        "Blocking all external attacks at the network perimeter by ensuring inbound traffic from the internet cannot reach any internal segment under any condition",
        "Replacing the need for endpoint authentication because segment placement alone determines what each host can access in the environment",
      ],
      a: 0,
      exp: "The primary SECURITY benefit of network segmentation is limiting blast radius. When the network is divided into segments with controls between them (firewalls, ACLs, microsegmentation policies), an attacker who compromises one segment cannot freely reach others — they must cross another control, and that crossing is detectable and may fail. The encryption distractor confuses segmentation with TLS/IPsec (segmentation does not encrypt). The perimeter distractor confuses segmentation with edge defense (segmentation works on internal traffic too). The authentication distractor confuses placement with identity (placement is one input to access control, not a replacement). Operational benefits (speed, cost, management) are real but secondary.",
      messerVideo: "2.5 - Segmentation and Access Control",
      subObjective: "2.5",
    },
  },

  // ─── Item 14: §2.5.1 mc[2] Air gap STRONGEST (distractor-rework) ───
  {
    videoId: "2.5.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "An air gap provides the STRONGEST isolation",
    item: {
      q: "An air gap provides the STRONGEST isolation primarily because:",
      opts: [
        "The system has absolutely no network connection — there is no path for a remote attacker to reach it over a network at all, removing the entire remote-attack surface",
        "A DMZ with a WAF in front provides functionally equivalent isolation by inspecting all inbound traffic at the application layer before it reaches the protected system",
        "VLAN segmentation combined with strict access control lists provides equivalent isolation by separating broadcast domains at Layer 2 with policy enforcement",
        "A host-based firewall combined with EDR provides equivalent isolation by blocking unauthorized connections and detecting malicious behavior at the endpoint",
      ],
      a: 0,
      exp: "The defining property of an air gap is the complete absence of network connection — no Ethernet, no WiFi, no Bluetooth, no USB-bridged data path. That makes remote attacks impossible (the only attack paths are physical: introduced media, supply chain, or insider). DMZ + WAF, VLAN + ACL, and host-firewall + EDR all reduce attack surface but still maintain a network path to the system; with sufficient skill, a determined attacker can find a path through any of them. Air gap is a categorically different control class — it removes the path entirely rather than guarding it.",
      messerVideo: "2.5 - Segmentation and Access Control",
      subObjective: "2.5",
    },
  },

  // ─── Item 15: §2.5.1 mc[3] Allow list vs block list (heavy) ───
  {
    videoId: "2.5.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "An application allow list is more effective than a block list",
    item: {
      q: "Which BEST explains why an application allow list provides stronger protection than a block list?",
      opts: [
        "Allow lists implement default-deny — only explicitly approved applications run, so novel and unknown malware is blocked. Block lists implement default-allow — only known-bad is blocked, so any uncataloged malware runs freely",
        "Allow lists use cryptographic signature verification of every binary while block lists rely on file hashes and content patterns — signatures are cryptographically stronger overall",
        "Allow lists ship with built-in machine-learning detection of anomalous binary behavior while block lists rely only on static signature rules without behavioral analysis",
        "Allow lists prevent privileged-user override since administrators cannot bypass the policy to run unapproved binaries, while block lists permit administrators to whitelist exceptions on demand",
      ],
      a: 0,
      exp: "The structural difference is the default policy. Allow list = default-deny: by default nothing runs, only listed applications are permitted. Result: novel malware is blocked by default because it is not on the list. Block list = default-allow: by default everything runs except listed bad items. Result: novel malware runs freely until added to the block list. This is why allow lists are stronger but harder to operate — every legitimate application change requires updating the list. Cryptographic mechanisms (B) are independent of allow vs block; ML detection (C) is independent; admin override (D) is also not the structural difference — most enterprise allow-list implementations (Windows Defender Application Control, Apple Endpoint Security, etc.) DO support administrator overrides for legitimate purposes, and block lists likewise support exceptions.",
      messerVideo: "2.5 - Segmentation and Access Control",
      subObjective: "2.5",
    },
  },

  // ─── Item 16: §2.4.12 mc[3] CSRF primary mitigation (partial — pad shorts) ───
  {
    videoId: "2.4.12", kind: "mc", index: 3,
    expectedOldStemPrefix: "The primary mitigation for CSRF attacks is:",
    item: {
      q: "Which is the PRIMARY mitigation for CSRF (Cross-Site Request Forgery) attacks?",
      opts: [
        "Input validation on all form fields to reject script tags, SQL syntax, and other characters that should not appear in legitimate user input",
        "Content Security Policy (CSP) headers that restrict which domains a page can load scripts and stylesheets from to prevent script injection",
        "Unique, unpredictable anti-CSRF tokens issued per session and included in every state-changing request, validated server-side before the action is processed",
        "HTTPS encryption between the browser and the server to prevent on-path attackers from observing or modifying the request in flight over the network",
      ],
      a: 2,
      exp: "CSRF works by tricking an authenticated user's browser into submitting an attacker-crafted request to a site where the user is logged in (the browser includes session cookies automatically). The PRIMARY mitigation is anti-CSRF tokens: a unique, unpredictable token tied to the session that must be included in every state-changing request — the attacker's cross-site form cannot include the token because they cannot read it from the legitimate session. Input validation addresses XSS and injection, not CSRF. CSP is for XSS / script-source-restriction. HTTPS prevents on-path attacks but does not stop CSRF, which exploits the user's already-authenticated session. SameSite cookie attributes are a complementary modern mitigation.",
      messerVideo: "2.4 - Application Attacks",
      subObjective: "2.4",
    },
  },

  // ─── Item 17: §2.3.10 mc[1] #1 cause cloud breaches (stem + length pad) ───
  {
    videoId: "2.3.10", kind: "mc", index: 1,
    expectedOldStemPrefix: "The #1 cause of cloud data breaches is:",
    item: {
      q: "Which is the MOST common cause of cloud data breaches?",
      opts: [
        "Nation-state attackers using novel zero-day exploits to breach the cloud provider's infrastructure directly",
        "Weak encryption algorithms used by the cloud provider for data-at-rest and data-in-transit protection across services",
        "Misconfiguration by the customer — publicly accessible storage buckets, overly permissive IAM policies, exposed admin endpoints",
        "Outdated cloud platform software running on the provider's hypervisor and management plane unpatched against known CVEs",
      ],
      a: 2,
      exp: "Verizon DBIR, Mandiant M-Trends, and most cloud-provider incident reports consistently cite customer misconfiguration as the leading cause of cloud data breaches — exposed S3 buckets, overly permissive IAM roles, default-public storage settings, exposed management endpoints. Nation-state attacks on provider infrastructure, provider crypto weaknesses, and provider software vulnerabilities are all real but represent a much smaller share of actual breaches. The shared responsibility model places configuration squarely on the customer side, and customer misconfiguration is where the volume actually is.",
      messerVideo: "2.3 - Cloud-specific Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 18: §2.4.1 mc[0] Ransomware primary impact (stem + length pad) ───
  {
    videoId: "2.4.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "Ransomware primarily impacts organizations by:",
    item: {
      q: "Which BEST describes ransomware's primary business impact?",
      opts: [
        "Silently exfiltrating credentials, browser session tokens, and saved authentication material to enable downstream account takeover",
        "Encrypting the organization's data and demanding cryptocurrency payment for the decryption key, disrupting operations until pay-or-restore-from-backup",
        "Granting an attacker persistent remote interactive access to the compromised host, enabling lateral movement and additional payload delivery",
        "Deleting system logs and audit trails to obscure the attacker's prior activity and prevent forensic reconstruction of the compromise",
      ],
      a: 1,
      exp: "Ransomware's primary business impact is operational disruption from encrypted data — the organization cannot access its files, systems, or both, and faces the choice of paying the ransom or restoring from backup (which often takes days and may itself fail). The other options describe primary impacts of OTHER malware categories: info-stealers take credentials covertly; RATs provide persistent remote control; log deletion is post-compromise cleanup. Modern ransomware often combines categories (steal-then-encrypt double-extortion), but the defining impact is still encryption-and-extortion.",
      messerVideo: "2.4 - An Overview of Malware",
      subObjective: "2.4",
    },
  },

  // ─── Item 19: §2.4.4 mc[1] Rootkit primary purpose (stem + length pad) ───
  {
    videoId: "2.4.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "A rootkit is primarily designed to:",
    item: {
      q: "Which BEST describes a rootkit's primary purpose?",
      opts: [
        "Encrypt user files and demand cryptocurrency payment for the decryption key — the defining behavior of the ransomware category",
        "Self-propagate from host to host across the network without requiring any user interaction — the defining behavior of the worm category",
        "Hide the presence of malware and the attacker's activity by intercepting OS calls and concealing files, processes, and registry keys",
        "Record every keystroke a user types and exfiltrate the captured input to an attacker — the defining behavior of the keylogger category",
      ],
      a: 2,
      exp: "A rootkit's defining function is concealment — it operates at a privileged level (kernel or hypervisor) and intercepts OS calls (file enumeration, process listing, network connection listing) to hide malicious files, processes, and network activity from system tools and many security products. Other malware categories have different primary purposes: ransomware encrypts and extorts (A); worms self-propagate (B); keyloggers capture user input (D). Rootkits are often combined with other malware to provide stealth — a rootkit may hide a keylogger or a backdoor, for example.",
      messerVideo: "2.4 - Other Malware Types",
      subObjective: "2.4",
    },
  },
];

// ─── Apply ─────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const videoById = new Map();
for (const sec of data) for (const v of sec.videos) videoById.set(v.id, v);

let replaced = 0, skipped = 0, errors = 0;
for (const r of REPLACEMENTS) {
  const video = videoById.get(r.videoId);
  if (!video) { console.error(`ERROR: video ${r.videoId} not found`); errors++; continue; }
  const arr = (r.kind === "mc" ? video.questions : video.scenarios) || [];
  const cur = arr[r.index];
  if (!cur) { console.error(`ERROR: ${r.videoId} ${r.kind}[${r.index}] does not exist`); errors++; continue; }
  const newStemHead = r.item.q.slice(0, 60);
  if (typeof cur.q === "string" && cur.q.startsWith(newStemHead)) {
    console.log(`skip   ${r.videoId} ${r.kind}[${r.index}]: already replaced`);
    skipped++;
    continue;
  }
  if (typeof cur.q !== "string" || !cur.q.startsWith(r.expectedOldStemPrefix)) {
    console.error(`ERROR: ${r.videoId} ${r.kind}[${r.index}] has unexpected stem; refusing to replace.`);
    console.error(`  expected: "${r.expectedOldStemPrefix}..."`);
    console.error(`  found:    "${(cur.q || "").slice(0, 80)}..."`);
    errors++;
    continue;
  }
  arr[r.index] = r.item;
  console.log(`replace ${r.videoId} ${r.kind}[${r.index}]: "${cur.q.slice(0, 50)}..." → "${newStemHead}..."`);
  replaced++;
}

if (errors > 0) { console.error(`\n${errors} errors — aborting.`); process.exit(1); }
console.log(`\n${replaced} replaced (in-place), ${skipped} skipped.`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${jsonPath}`);
} else if (preview) {
  writeFileSync(previewPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote preview ${previewPath}`);
} else {
  console.log("(dry run — pass --write to persist, or --preview for validator preview)");
}
