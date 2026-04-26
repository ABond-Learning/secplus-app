// One-shot applier: append 25 Domain 4 Batch 1 items (15 MC + 10 scenarios)
// across §4.1, §4.2, §4.3, §4.4, §4.5, §4.6, §4.7, §4.8 to begin the
// +40 MC / +25 scenario rebalance for Domain 4. §4.9 deferred to Batch 2.
// Idempotent: detects already-inserted items by stem prefix and skips.
//
// Usage:
//   node scripts/add-domain4-batch1.mjs              # dry-run, prints diff summary
//   node scripts/add-domain4-batch1.mjs --preview    # write previewed copy to /tmp for validator
//   node scripts/add-domain4-batch1.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4b1-preview.json";
const write = process.argv.includes("--write");
const preview = process.argv.includes("--preview");

const INSERTIONS = [
  // ─── §4.1 Security Techniques (3 items: 2 MC + 1 scen) ───
  {
    videoId: "4.1.4",
    kind: "mc",
    item: {
      q: "WPA3-Personal replaces WPA2-Personal's 4-way PSK handshake with SAE (Simultaneous Authentication of Equals). The PRIMARY vulnerability that SAE was designed to fix is:",
      opts: [
        "WPA2-PSK transmitted the pre-shared key in plaintext over the air during association",
        "WPA2-PSK's 4-way handshake exposed material that allowed offline dictionary attacks against the captured handshake",
        "WPA2-PSK lacked any form of authentication entirely, allowing any client to associate without a password",
        "WPA2-PSK used DES encryption, which has been deprecated since the early 2000s for being computationally weak",
      ],
      a: 1,
      exp: "SAE (a Dragonfly key exchange) provides forward secrecy and resistance to offline cracking even when the password is weak — its central improvement is eliminating the offline-dictionary-attack window that WPA2-PSK's 4-way handshake exposed (an attacker who captured the handshake could brute-force the PSK offline at unlimited speed). WPA2-PSK never transmits the PSK in plaintext, it does authenticate via PSK derivation, and it uses AES-CCMP (not DES). The KRACK family of attacks against the 4-way handshake is the historical context for SAE's design.",
      messerVideo: "4.1 - Wireless Security Settings",
      subObjective: "4.1",
    },
  },
  {
    videoId: "4.1.4",
    kind: "mc",
    item: {
      q: "An organization protecting classified or highly sensitive data over its wireless network is choosing between WPA3-Personal (SAE) and WPA3-Enterprise with the 192-bit mode. The PRIMARY reason to choose WPA3-Enterprise 192-bit over WPA3-Personal in this scenario is:",
      opts: [
        "WPA3-Personal (SAE) and WPA3-Enterprise 192-bit have identical security properties — only the marketing names differ; either mode is suitable for classified data handling",
        "WPA3-Enterprise 192-bit pairs 802.1X per-user authentication with a 192-bit cryptographic suite (AES-256-GCM, BIP-GMAC-256) meeting CNSA-tier requirements; WPA3-Personal uses a shared SAE password and a lower-tier cryptographic suite",
        "WPA3-Personal (SAE) is faster than WPA3-Enterprise 192-bit, and the performance advantage is the primary reason it is chosen for high-sensitivity wireless networks",
        "WPA3-Enterprise 192-bit is intended for guest networks while WPA3-Personal is intended for employee networks — the 192-bit mode is specifically a guest-isolation feature",
      ],
      a: 1,
      exp: "WPA3-Enterprise 192-bit mode requires a 192-bit cryptographic suite — typically AES-256-GCM for unicast traffic and BIP-GMAC-256 for management frames — and uses 802.1X authentication with per-user credentials. The combination meets the US government's Commercial National Security Algorithm (CNSA) suite requirements for handling sensitive and classified data over wireless. WPA3-Personal (SAE) uses a shared password and a lower-tier cryptographic suite; while SAE itself defeats offline dictionary attacks, the shared-credential model and lower crypto are not appropriate for classified data. Naming alone does not capture the difference, performance is not the structural distinction, and the 192-bit mode is not a guest-network feature.",
      messerVideo: "4.1 - Wireless Security Settings",
      subObjective: "4.1",
    },
  },
  {
    videoId: "4.1.4",
    kind: "scenario",
    item: {
      q: "A small office of 25 employees uses WPA2-Personal with a single pre-shared key (PSK) for all employees. An employee with a documented grievance is terminated on Friday and their network access (Active Directory account, VPN, email) is revoked the same day. On Monday, the security team observes unfamiliar devices associating with the wireless network from the parking lot. The MOST appropriate immediate action AND the MOST appropriate longer-term remediation are:",
      opts: [
        "Immediate: rotate the WPA2-PSK and re-distribute to all employees. Long-term: continue with WPA2-Personal but rotate the PSK quarterly going forward.",
        "Immediate: rotate the WPA2-PSK and re-distribute to all employees. Long-term: migrate to WPA2-Enterprise (or WPA3-Enterprise) with per-user 802.1X authentication so revoking an individual's identity revokes their wireless access.",
        "Immediate: do nothing — the terminated employee no longer works at the company so legally they cannot use the wireless network. Long-term: continue with WPA2-Personal.",
        "Immediate: disable wireless entirely until an investigation completes. Long-term: continue with WPA2-Personal but require that every employee sign a non-disclosure agreement covering the PSK.",
      ],
      a: 1,
      exp: "WPA2-Personal's PSK is shared by every user, so revoking the terminated employee's individual accounts does not revoke their wireless access — they (or anyone they shared the PSK with) can still associate. The immediate action is to rotate the PSK; the structural fix is to migrate to an Enterprise mode that uses 802.1X with per-user credentials, so identity revocation at the IdP also revokes wireless access. Quarterly rotation helps marginally but does not solve the structural problem. Doing nothing ignores the active threat. Disabling wireless entirely is disproportionate, and an NDA does not technically prevent access.",
      messerVideo: "4.1 - Wireless Security Settings",
      subObjective: "4.1",
    },
  },

  // ─── §4.2 Asset Management (2 items: 1 MC + 1 scen) ───
  {
    videoId: "4.2.1",
    kind: "mc",
    item: {
      q: "An asset management program tracks a laptop through its full lifecycle. Which of the following correctly orders the major asset lifecycle stages?",
      opts: [
        "Acquisition → Assignment → Operation/Maintenance → Decommissioning → Disposal/Sanitization",
        "Disposal → Acquisition → Assignment → Operation/Maintenance → Decommissioning",
        "Acquisition → Decommissioning → Assignment → Disposal → Operation/Maintenance",
        "Assignment → Acquisition → Operation/Maintenance → Disposal → Decommissioning",
      ],
      a: 0,
      exp: "The standard asset lifecycle moves Acquisition (procurement, intake, tagging) → Assignment (issuance to a custodian/user) → Operation/Maintenance (ongoing tracking, patching, configuration management) → Decommissioning (formal removal from active service) → Disposal/Sanitization (data sanitization first, then physical disposal, resale, or destruction). The other orderings violate the natural flow — disposal before acquisition, decommissioning before assignment, and assignment before acquisition are all out of order. Knowing the stage names and their order is exam-tested directly.",
      messerVideo: "4.2 - Asset Management",
      subObjective: "4.2",
    },
  },
  {
    videoId: "4.2.1",
    kind: "scenario",
    item: {
      q: "A company is decommissioning storage from three different sources: (1) 50 spinning-platter (HDD) drives from a file server, (2) 20 SSDs from developer workstations, and (3) 10 hybrid laptops with built-in self-encrypting SSDs that have been encrypted with a strong key for the entire device lifetime. The data classification is 'Restricted.' For each source, which sanitization method is MOST appropriate?",
      opts: [
        "(1) Degauss; (2) Degauss; (3) Degauss — degaussing is the universal answer for all magnetic and solid-state media",
        "(1) Degauss or destroy; (2) Cryptographic erase if the SSD supports it, otherwise destroy; (3) Cryptographic erase by destroying the encryption key (crypto-shred), then dispose",
        "(1) Single-pass overwrite; (2) Single-pass overwrite; (3) Single-pass overwrite — overwrite is sufficient for all media types when followed by verification",
        "(1) Cryptographic erase; (2) Degauss; (3) Single-pass overwrite — match each method to the most aggressive option for each technology",
      ],
      a: 1,
      exp: "HDDs (spinning platters) are vulnerable to degaussing and can also be physically destroyed; both are appropriate for Restricted data. SSDs do NOT respond to degaussing because their data is held in NAND flash, not magnetic media; the correct approach is the SSD's built-in cryptographic erase (sanitize command), or physical destruction if the device does not support it. Self-encrypting devices that have always been encrypted can be sanitized by destroying the encryption key (crypto-shred), which renders the underlying ciphertext unrecoverable. Universal overwrite is unreliable on SSDs due to wear leveling. Universal degaussing does not work on SSDs at all.",
      messerVideo: "4.2 - Asset Management",
      subObjective: "4.2",
    },
  },

  // ─── §4.3 Vulnerability Management (3 items: 2 MC + 1 scen) ───
  {
    videoId: "4.3.4",
    kind: "mc",
    item: {
      q: "CVSS scores are computed from three metric groups: Base, Temporal, and Environmental. Which statement about these groups is CORRECT?",
      opts: [
        "Base metrics describe characteristics that change over time; Temporal describe inherent attack characteristics; Environmental describe organization-specific factors",
        "Base metrics describe inherent attack characteristics that do not change; Temporal describe characteristics that change over time (e.g. exploit code maturity); Environmental describe organization-specific factors",
        "Base, Temporal, and Environmental all measure the same dimensions and are computed identically — they are interchangeable groupings used by different vendors",
        "Base metrics describe organization-specific factors; Temporal describe inherent attack characteristics; Environmental describe characteristics that change over time",
      ],
      a: 1,
      exp: "Base metrics capture intrinsic, time-invariant properties of the vulnerability — attack vector, attack complexity, privileges required, user interaction, scope, and CIA impact. Temporal metrics capture characteristics that change over time — exploit code maturity, remediation level, and report confidence. Environmental metrics let an organization tailor the score to their specific deployment — modified base metrics plus impact subscore weights for CIA. Options A and D scramble the assignments; option C confuses the groups, which are deliberately distinct so a score can be progressively refined from inherent severity to organization-specific risk.",
      messerVideo: "4.3 - Analyzing Vulnerabilities",
      subObjective: "4.3",
    },
  },
  {
    videoId: "4.3.4",
    kind: "scenario",
    item: {
      q: "A vulnerability management team is prioritizing two findings from the same scan. Vulnerability X has a CVSS Base score of 9.1 (critical) but an EPSS score of 0.4% (very low probability of exploitation in the next 30 days). Vulnerability Y has a CVSS Base score of 7.2 (high) but an EPSS score of 38% (high probability of exploitation in the next 30 days). The team has resources to remediate ONE this sprint. Which should be remediated first AND why?",
      opts: [
        "Vulnerability X — its CVSS score of 9.1 is higher, and CVSS is the only authoritative severity standard; EPSS is just a vendor metric",
        "Vulnerability Y — although its CVSS is lower, its 38% probability of exploitation indicates active or imminent threat in the wild, so the real-world risk is meaningfully higher than the theoretically more severe X",
        "Vulnerability X — CVSS critical is always remediated first regardless of any other factor, by NIST policy",
        "Either is fine — the two metrics are equivalent and either choice would produce the same risk reduction",
      ],
      a: 1,
      exp: "CVSS measures inherent severity (what could happen if exploited); EPSS measures the probability of exploitation in the wild within a short window. They answer complementary questions and prioritization should weigh both. Vulnerability Y has lower theoretical severity but a much higher probability of being actively exploited, so the expected risk (severity × probability) is higher in the immediate term. CVSS-alone prioritization misses the real-world exploitation signal. EPSS is published by FIRST, not a vendor. Many organizations now combine CVSS thresholds with EPSS thresholds in their prioritization rules.",
      messerVideo: "4.3 - Analyzing Vulnerabilities",
      subObjective: "4.3",
    },
  },
  {
    videoId: "4.3.1",
    kind: "mc",
    item: {
      q: "A security team is selecting a vulnerability scanning approach for a fleet of 800 servers, including some that are isolated from the management network (no inbound network access from the scanner's subnet). Which scanning approach is MOST appropriate?",
      opts: [
        "Network-based credentialed scan from the central scanner — most accurate, and credentials let the scanner enumerate installed packages without local agent installation",
        "Network-based unauthenticated scan from the central scanner — least intrusive, no credentials needed, and works on any network-reachable host",
        "Agent-based scan with a lightweight agent installed on each host — accurate package enumeration, works on hosts the central scanner cannot reach, and reports back over outbound connections",
        "Manual host-by-host inspection by a system administrator — most accurate of all because a human reviews each system in person",
      ],
      a: 2,
      exp: "Agent-based scanning is the right choice when some hosts are unreachable from the central scanner: the agent runs locally and reports outbound, bypassing the inbound-blocked constraint, and gives accurate package-level enumeration. Network-based credentialed scanning is excellent when the scanner can reach the host but fails on the isolated hosts described. Unauthenticated scans are less accurate because they only see what is exposed on the network. Manual inspection is impractical at 800 hosts. Many enterprises deploy a hybrid: agent-based for unreachable assets, credentialed network-based for the rest.",
      messerVideo: "4.3 - Vulnerability Scanning",
      subObjective: "4.3",
    },
  },

  // ─── §4.4 Security Monitoring (4 items: 2 MC + 2 scen) ───
  {
    videoId: "4.4.1",
    kind: "mc",
    item: {
      q: "A SOC manager is explaining the distinction between SIEM and SOAR to a new analyst. Which statement BEST captures the difference?",
      opts: [
        "SIEM and SOAR are competing products that perform the same function; organizations choose one or the other based on vendor preference",
        "SIEM aggregates and correlates log data to detect events and generate alerts; SOAR consumes those alerts (and other inputs) to orchestrate and automate response actions across multiple tools",
        "SIEM is the cloud version of SOAR; SOAR is the on-premises version of SIEM",
        "SIEM handles authentication and identity events; SOAR handles network traffic events — they cover different security domains",
      ],
      a: 1,
      exp: "SIEM and SOAR are complementary, not competing. SIEM's central job is to ingest logs from many sources, correlate them, and detect events worth alerting on — its output is alerts. SOAR's central job is to consume those alerts (plus tickets, threat intel, and other inputs), then orchestrate response across tools — open a ticket, isolate a host via EDR, block an IP at the firewall, notify on-call — often through automated playbooks. They are typically deployed together. SIEM answers 'what happened?'; SOAR answers 'now what do we do about it?'. The other options misstate the relationship.",
      messerVideo: "4.4 - Security Monitoring",
      subObjective: "4.4",
    },
  },
  {
    videoId: "4.4.1",
    kind: "scenario",
    item: {
      q: "A 24/7 SOC of three analysts processes 11,000 SIEM alerts per day. The analysts can realistically triage about 600 alerts per shift between them, so most alerts are auto-closed without review or are reviewed superficially. The SOC manager has budget for ONE intervention this quarter to address the backlog. Which is MOST likely to produce the largest sustained reduction in unprocessed alerts?",
      opts: [
        "Hire two more analysts to triage more alerts per shift",
        "Aggressive alert tuning — eliminate duplicate rules, deduplicate similar events, raise thresholds on noisy low-fidelity rules, and suppress alerts that historically yield zero true positives",
        "Replace the SIEM with a different SIEM vendor's product",
        "Disable the SIEM entirely and rely on EDR alerts only, since EDR has higher fidelity than SIEM rules",
      ],
      a: 1,
      exp: "The root cause of alert fatigue is rule volume and noise, not analyst headcount. Tuning addresses the cause: cutting duplicate rules, deduping similar events, raising thresholds on chatty rules, and suppressing rules with zero true-positive history can routinely cut alert volume by 40-80% and improves true-positive density. Hiring helps marginally but is expensive and does not fix the noise problem — the new analysts will also be overwhelmed. A vendor swap is high-cost, high-disruption, and rarely solves a tuning problem. Disabling SIEM loses correlation and broad-source visibility that EDR cannot replace.",
      messerVideo: "4.4 - Security Monitoring",
      subObjective: "4.4",
    },
  },
  {
    videoId: "4.4.2",
    kind: "mc",
    item: {
      q: "A security director is comparing endpoint and broader detection approaches. Which set of definitions is correct?",
      opts: [
        "EDR is endpoint detection and response; XDR extends detection across multiple data sources (endpoint, network, cloud, email, identity); MDR is a managed service offering, typically a vendor or MSSP operating EDR/XDR on the customer's behalf",
        "EDR, XDR, and MDR are all the same product category — the names differ by vendor marketing only",
        "EDR is for Windows endpoints; XDR is for cross-platform endpoints; MDR is for mobile endpoints exclusively",
        "EDR is an open-source category; XDR is the commercial version of EDR; MDR is the cloud version of XDR",
      ],
      a: 0,
      exp: "EDR (Endpoint Detection and Response) focuses on endpoint telemetry — process trees, file activity, registry changes — for detection and response. XDR (Extended Detection and Response) broadens telemetry across endpoints, network, cloud, email, identity, and other sources, correlating across them. MDR (Managed Detection and Response) is a service category — a vendor or MSSP runs the detection-and-response function for the customer, often using EDR or XDR as the underlying tooling. The distinguishing axes are scope of telemetry (EDR vs XDR) and operational ownership (in-house vs managed). The other options misstate platform, license, or marketing axes.",
      messerVideo: "4.4 - Security Tools",
      subObjective: "4.4",
    },
  },
  {
    videoId: "4.4.2",
    kind: "scenario",
    item: {
      q: "A security team deploys File Integrity Monitoring (FIM) on production Windows servers, configured out-of-the-box to alert on any change to any file in C:\\Windows and C:\\Program Files. Within a week the FIM is producing 4,000 alerts per day, mostly from routine Windows Update activity, antivirus signature updates, and application telemetry log writes. The team must reduce alert volume without losing detection of unauthorized changes. The MOST appropriate tuning approach is:",
      opts: [
        "Disable FIM entirely — it is producing too much noise to be useful",
        "Define an allow-list (exclusion list) for known-benign change sources (Windows Update process, AV signature directories, application log paths), and keep alerting on changes that fall outside the allow-list",
        "Reduce alert severity to 'informational' for everything, so alerts no longer page on-call but are still recorded somewhere",
        "Increase the FIM polling interval from 5 minutes to 24 hours so fewer alerts are generated overall",
      ],
      a: 1,
      exp: "The tuning principle is to filter out KNOWN-benign change sources while retaining alerts on UNKNOWN changes — that is exactly what an allow-list of expected change sources accomplishes (Windows Update, AV signature paths, application log directories, etc.). Disabling FIM entirely loses the detection capability. Lowering severity hides the noise but does not reduce volume and still misses the signal. Increasing the polling interval reduces alert frequency but also widens the detection gap and does not improve the signal-to-noise ratio. After tuning, alert volume typically drops by an order of magnitude with no loss of true-positive detection.",
      messerVideo: "4.4 - Security Tools",
      subObjective: "4.4",
    },
  },

  // ─── §4.5 Enterprise Security (6 items: 4 MC + 2 scen) ───
  {
    videoId: "4.5.1",
    kind: "mc",
    item: {
      q: "A web-facing application is being targeted by SQL injection attempts in HTTPS-encrypted POST request bodies. Which firewall type is BEST positioned to detect and block these attempts at the application layer?",
      opts: [
        "Stateful packet-filtering firewall — operates at Layers 3-4 and tracks connection state efficiently",
        "Next-generation firewall (NGFW) — adds application awareness and IPS capabilities to a stateful firewall foundation",
        "Web Application Firewall (WAF) — purpose-built to inspect HTTP/HTTPS traffic at Layer 7, with rules specifically designed for web application attacks like SQLi and XSS",
        "Network address translation (NAT) device — provides inbound port translation and basic packet inspection",
      ],
      a: 2,
      exp: "A WAF is purpose-built to inspect HTTP/HTTPS traffic at Layer 7 with rules tuned for web application attacks (SQLi, XSS, path traversal, etc.); for the described threat it is the best fit. Stateful packet-filtering operates too low in the stack to inspect request bodies. NGFW is closer — it adds application awareness and can include some web-attack detection — but it is a general-purpose appliance, while a WAF is the specialist with dedicated rule sets, virtual patching, and web-app context integration. NAT does not perform application-layer inspection at all.",
      messerVideo: "4.5 - Firewalls",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.1",
    kind: "scenario",
    item: {
      q: "A firewall has the following rules, processed top-to-bottom: (1) Allow TCP from 10.0.0.0/8 to 10.50.0.0/16 on port 443, (2) Deny TCP from any to 10.50.10.5 on port 443 (intent: block one specific server), (3) Implicit deny all. A junior administrator reports that rule 2 'is not working' — traffic from 10.20.5.7 to 10.50.10.5 on port 443 is still being allowed. The MOST likely cause is:",
      opts: [
        "The deny rule on line 2 is misconfigured — TCP/443 is implicitly always allowed for HTTPS",
        "Firewalls process rules in alphabetical order by destination, so the order on the page is misleading",
        "Rule processing is top-to-bottom and the broader allow on line 1 (10.0.0.0/8 to 10.50.0.0/16:443) matches first; the deny on line 2 is never evaluated for traffic that already matched line 1",
        "The implicit deny on line 3 overrides all rules above it, so all traffic should be blocked instead",
      ],
      a: 2,
      exp: "Firewalls evaluate rules top-to-bottom and stop at the first match. Traffic from 10.20.5.7 to 10.50.10.5:443 matches the broad allow on line 1 (source falls within 10.0.0.0/8, destination within 10.50.0.0/16:443), so the firewall permits it and never reaches line 2. The fix is to move the more-specific deny ABOVE the broader allow: specific rules first, broader rules later. HTTPS is not implicitly allowed. Firewalls do not sort alphabetically. The implicit deny is the LAST rule and only fires when no earlier rule matches, so it does not override.",
      messerVideo: "4.5 - Firewalls",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.4",
    kind: "mc",
    item: {
      q: "A network engineer is replacing legacy clear-text protocols across the environment. Which substitution table is correct?",
      opts: [
        "Telnet → SSH; FTP → SFTP or FTPS; HTTP → HTTPS; SNMPv1/v2c → SNMPv3",
        "Telnet → FTP; SSH → Telnet; HTTPS → HTTP; SNMPv3 → SNMPv1",
        "Telnet → SNMP; FTP → DHCP; HTTP → DNS; SNMPv1 → ICMP",
        "Telnet → RDP; FTP → SMB; HTTP → SMTP; SNMPv1/v2c → LDAP",
      ],
      a: 0,
      exp: "The standard secure replacements are Telnet (clear-text terminal) → SSH (encrypted terminal); FTP (clear-text file transfer) → SFTP (over SSH) or FTPS (FTP over TLS); HTTP (clear-text web) → HTTPS (HTTP over TLS); SNMPv1/v2c (community string in clear-text) → SNMPv3 (with USM authentication and privacy). Option B reverses each pairing. Options C and D substitute completely unrelated protocols that serve different functions. The correct mappings are exam-tested directly and worth memorizing as a table.",
      messerVideo: "4.5 - Secure Protocols",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.4",
    kind: "scenario",
    item: {
      q: "A network team identifies that 200 production network devices (switches, routers) are still being polled with SNMPv2c using a community string of 'public' over UDP/161. The team has resources to either (a) migrate all 200 devices to SNMPv3 over the next 4 weeks, (b) restrict SNMPv2c access to a single management subnet via firewall rules now and migrate to SNMPv3 over the next 6 months, or (c) leave SNMPv2c in place because most network monitoring tools still support it. The MOST defensible decision is:",
      opts: [
        "(a) — migrate everything immediately, accepting the 4-week disruption to network monitoring during cutover",
        "(b) — restrict SNMPv2c to a management subnet immediately to reduce exposure (defense in depth), then migrate to SNMPv3 over 6 months under change control",
        "(c) — leave SNMPv2c in place because compatibility risk outweighs the security risk of community-string polling",
        "Disable all SNMP (v2c and v3) on every device immediately and rely on alternative monitoring (syslog, streaming telemetry) only",
      ],
      a: 1,
      exp: "Option (b) is the defensible middle path: it reduces the immediate exposure (community-string SNMPv2c traffic is no longer reachable from arbitrary network positions) while allowing a controlled migration to SNMPv3 with proper change management. Option (a) is technically purer but a 4-week monitoring blackout during cutover risks operational visibility loss that may be more harmful than the residual SNMPv2c risk. Option (c) ignores a known weakness — community strings are sniffable and 'public' is the well-known default. Disabling SNMP entirely is disproportionate and removes monitoring capability that is needed for operational and security purposes.",
      messerVideo: "4.5 - Secure Protocols",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.5",
    kind: "mc",
    item: {
      q: "A security analyst is asked which email authentication standard alone protects against which threat. Which mapping is CORRECT?",
      opts: [
        "SPF alone — protects against any sender-spoofing of the visible From header; DKIM alone — protects against email tampering in transit; DMARC alone — protects against phishing attempts overall",
        "SPF alone — authorizes which IPs can send for a domain (protects the Return-Path/envelope sender, not the visible From header); DKIM alone — provides cryptographic integrity and origin authentication of the message; DMARC alone — does not authenticate; it tells receivers what to do when SPF/DKIM fail or do not align with the visible From header",
        "SPF, DKIM, and DMARC are equivalent — any one alone provides the same protection as the others",
        "None of the three protects against any form of email spoofing — they are all advisory standards with no enforcement effect at receiving mail servers",
      ],
      a: 1,
      exp: "SPF authorizes sending IPs for a domain — it protects the envelope sender (Return-Path), NOT the visible From header that users see. DKIM cryptographically signs message content and selected headers — it provides integrity and proves the message originated from a system holding the signing key. DMARC does not authenticate at all — it is the policy layer that tells receivers what to do (none/quarantine/reject) when SPF or DKIM fail or do not ALIGN with the visible From header. The three are complementary; the common misconception is that SPF alone protects the visible From header (it does not), and equivalence is wrong because the three measure different things.",
      messerVideo: "4.5 - Email Security",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.7",
    kind: "mc",
    item: {
      q: "A security architect is choosing between HIDS, HIPS, and EDR for endpoint protection. Which set of distinguishing characteristics is correct?",
      opts: [
        "HIDS detects on the host (passive — alerts but does not block); HIPS prevents on the host (active — can block in real time); EDR provides detection plus response with rich telemetry sent to a central management plane (search, hunt, isolate)",
        "HIDS, HIPS, and EDR all do the same thing — they are vendor-specific names for the same product category",
        "HIDS runs on the network only; HIPS runs on servers only; EDR runs on workstations only",
        "HIDS is the legacy name for HIPS; HIPS is the legacy name for EDR; only EDR is in current use today",
      ],
      a: 0,
      exp: "HIDS (Host Intrusion Detection System) is passive — it monitors the host and alerts on suspicious activity but does not block. HIPS (Host Intrusion Prevention System) is active — it can block actions in real time (kill a process, deny a file write). EDR (Endpoint Detection and Response) is the modern evolution — detection plus response with rich telemetry (process trees, file activity, registry changes) streamed to a central management plane that supports search, hunting, and remote response actions like host isolation. The three are distinguishable by passive vs active and by telemetry/management scope. The other options misstate placement, equivalence, or lineage.",
      messerVideo: "4.5 - Endpoint Security",
      subObjective: "4.5",
    },
  },

  // ─── §4.6 Identity and Access Management (4 items: 2 MC + 2 scen) ───
  {
    videoId: "4.6.1",
    kind: "mc",
    item: {
      q: "A solutions architect is choosing among SAML, OAuth 2.0, and OIDC for three different needs: (1) browser-based SSO between a corporate IdP and 30 SaaS applications, (2) granting a third-party API client delegated access to a user's resources without sharing the user's password, (3) modern web/mobile SSO that needs both an authentication signal AND an access token. Which protocol fits each need?",
      opts: [
        "(1) OAuth 2.0; (2) OIDC; (3) SAML",
        "(1) OIDC; (2) SAML; (3) OAuth 2.0",
        "(1) SAML; (2) OAuth 2.0; (3) OIDC",
        "(1) SAML; (2) OIDC; (3) OAuth 2.0",
      ],
      a: 2,
      exp: "SAML is XML-based browser-redirect SSO and is the long-standing fit for IdP-to-SaaS federation (need 1). OAuth 2.0 is an authorization framework for delegated API access — the user authorizes a client to access their resources via tokens, without sharing their password (need 2). OIDC is OAuth 2.0 plus an identity layer (an ID token in addition to the access token) — it is the modern web/mobile SSO standard (need 3). The exam-tested distinction is AuthN vs AuthZ: SAML and OIDC handle authentication (who is the user); OAuth 2.0 handles authorization (what can the client do on the user's behalf). The other options scramble the mappings.",
      messerVideo: "4.6 - Identity and Access Management",
      subObjective: "4.6",
    },
  },
  {
    videoId: "4.6.1",
    kind: "scenario",
    item: {
      q: "A company federates 47 SaaS applications to a single corporate Identity Provider (IdP) using SAML. On a Monday morning, the IdP becomes unavailable due to a regional cloud outage. None of the 47 SaaS applications can authenticate any user. The MOST appropriate medium-term mitigation (deployed before the next outage, accepted as design improvement) is:",
      opts: [
        "Stop using federation entirely — go back to local accounts in each SaaS application so they cannot all fail at once",
        "Deploy the IdP across at least two geographic regions (active-active or active-passive) with health-checked failover, so a single regional outage does not take down authentication",
        "Tell users to write down their passwords in case the IdP is down — out-of-band credential storage as a paper backup",
        "Replace SAML with OAuth 2.0 — OAuth does not have the single-IdP failure mode that SAML has",
      ],
      a: 1,
      exp: "The structural risk is single-region IdP availability. The fix is to deploy the IdP redundantly across regions with health-checked failover so a regional outage does not take authentication offline for 47 downstream applications. Going back to local accounts loses the central identity benefits and creates 47 separate identity stores with their own provisioning/deprovisioning problems. Out-of-band paper passwords are a security regression. OAuth 2.0 has the same single-IdP risk if the authorization server is single-region — the protocol choice does not resolve the availability architecture problem. The lesson: federation concentrates availability risk; treat the IdP as a critical availability service.",
      messerVideo: "4.6 - Identity and Access Management",
      subObjective: "4.6",
    },
  },
  {
    videoId: "4.6.2",
    kind: "mc",
    item: {
      q: "A large enterprise with 50,000 users and 15,000 resources is choosing between RBAC and ABAC for fine-grained access control. The team observes that RBAC's role count would balloon to thousands of distinct roles to capture all the per-resource, per-context distinctions needed. ABAC would represent these as attribute rules instead. Which statement BEST captures the trade-off?",
      opts: [
        "RBAC is always the better choice because it is simpler — large organizations should accept the role count as a cost of clarity",
        "ABAC is always the better choice because it is more flexible — RBAC has been deprecated by NIST for enterprise use",
        "RBAC scales well at moderate scale and is easier to audit ('who has role X?'); ABAC scales better when fine-grained, context-dependent rules are needed but is harder to reason about and audit; many large enterprises combine the two (RBAC for coarse-grained, ABAC for fine-grained policies on top)",
        "RBAC and ABAC are functionally identical — the difference is only naming convention used by different vendors",
      ],
      a: 2,
      exp: "RBAC assigns permissions to roles and users to roles — easy to audit ('everyone with the Finance Manager role has these permissions') and works well at moderate scale. As the matrix of resources × contexts × user attributes grows, RBAC's role count explodes ('Finance Manager — North America — Contract Class 3') to capture every needed distinction. ABAC evaluates attribute rules at access time (subject attributes, resource attributes, environment attributes) and scales better for fine-grained, context-dependent policies, but is harder to reason about and audit. Many enterprises combine them: RBAC for coarse-grained role assignment, ABAC layered on top for fine-grained policy. RBAC is not deprecated and the two are not interchangeable.",
      messerVideo: "4.6 - Access Controls",
      subObjective: "4.6",
    },
  },
  {
    videoId: "4.6.3",
    kind: "scenario",
    item: {
      q: "A company currently uses TOTP-based MFA (Google Authenticator-style 6-digit codes) for all employee accounts. After a successful phishing campaign in which 30 employees entered both their password AND a TOTP code on a fake login page, security leadership decides to migrate to FIDO2/WebAuthn hardware authenticators. The PRIMARY security benefit of FIDO2 over TOTP that BEST addresses this incident is:",
      opts: [
        "FIDO2 codes are 8 digits instead of 6, so they are harder to type into a phishing site quickly",
        "FIDO2 authenticators perform cryptographic origin checks — they will not produce a valid signature for a relying party origin (domain) that does not match the registered one, so the authenticator does not respond to a phishing site even if the user attempts to authenticate",
        "FIDO2 codes refresh every 10 seconds instead of every 30 seconds, narrowing the phishing window for an attacker",
        "FIDO2 is end-to-end encrypted on the wire while TOTP is plaintext over HTTPS, so the codes cannot be intercepted",
      ],
      a: 1,
      exp: "The phishing failure mode of TOTP is that the user can be tricked into entering both factors on a fake site and the attacker relays them in real time. FIDO2/WebAuthn is phishing-resistant by design: the authenticator binds its signature to the relying party origin (the domain) at registration. When the user is on a phishing domain, the authenticator's origin check fails and it produces no usable signature — the user cannot give the attacker a working credential even if they try. The other options misstate the mechanism: FIDO2 does not use codes at all (it uses public-key signatures), and the protection is not about wire encryption (TOTP is also already over HTTPS).",
      messerVideo: "4.6 - Multifactor Authentication",
      subObjective: "4.6",
    },
  },

  // ─── §4.7 Automation and Orchestration (1 item: 1 MC) ───
  {
    videoId: "4.7.1",
    kind: "mc",
    item: {
      q: "A security team is comparing automation and orchestration in the context of their SOAR platform. Which statement BEST distinguishes the two?",
      opts: [
        "Automation and orchestration are different vendor names for the same concept; they can be used interchangeably",
        "Automation refers to a single-task script (e.g. reset a password, run a vulnerability scan, block an IP); orchestration refers to a multi-system workflow that combines multiple automated tasks across several tools (e.g. when SIEM alerts, isolate the endpoint via EDR, capture a forensic image, open a ticket, notify on-call) into a coordinated process",
        "Automation runs on-premises; orchestration runs in the cloud",
        "Automation is for security operations only; orchestration is for IT operations only — they apply to different teams",
      ],
      a: 1,
      exp: "Automation is the unit task — a single script or action that replaces a manual step (reset a password, block an IP, run a scan). Orchestration is the workflow that strings multiple automated tasks across multiple systems into a coordinated, conditional process — typically encoded as a SOAR playbook with branching logic. The distinction is scope: automation = one task; orchestration = multi-step, multi-tool workflow. Vendor terms are not equivalent. Deployment location does not differentiate them. Both are used in security and broader IT.",
      messerVideo: "4.7 - Scripting and Automation",
      subObjective: "4.7",
    },
  },

  // ─── §4.8 Incident Response (2 items: 1 MC + 1 scen) ───
  {
    videoId: "4.8.1",
    kind: "scenario",
    item: {
      q: "At 2pm on a business day, a SOC analyst confirms that an internal-facing finance application server is actively being exfiltrated from — outbound traffic to a known-malicious IP, ongoing for the past 30 minutes. The application is mid-quarter-close and is being used by 200 finance staff right now; isolating the host will halt the close. The CFO has asked the security team to 'wait until end of day' to isolate. The MOST appropriate immediate action is:",
      opts: [
        "Wait until end of day as the CFO requested — the business impact of stopping the close mid-day outweighs additional 4 hours of exfiltration",
        "Isolate the host from the network immediately, escalate the business impact and recovery plan to the CFO and CIO in writing, and engage the IR plan; document the decision and the executive escalation",
        "Do not isolate; instead block the outbound destination IP at the firewall and continue monitoring, accepting that the attacker may pivot to a different destination",
        "Shut the host down completely without isolation so the attacker stops, even though shutdown destroys volatile evidence in memory",
      ],
      a: 1,
      exp: "Active exfiltration is an ongoing data-loss event; allowing it to continue for hours to preserve a business deadline is generally not defensible — every additional minute increases the data loss. The right action is to isolate the host (containment), escalate to the executive chain in writing with the recovery options and timeline, and follow the IR plan. Pure firewall blocking is brittle — the attacker can switch destinations. Full shutdown destroys volatile forensic evidence (memory, network state). Waiting prioritizes business continuity over an active loss event without proper authority — and the IR plan typically gives the IR lead authority to contain regardless of business pressure, with mandatory executive notification.",
      messerVideo: "4.8 - Incident Response",
      subObjective: "4.8",
    },
  },
  {
    videoId: "4.8.2",
    kind: "mc",
    item: {
      q: "A company is planning incident response exercises and is choosing among four formats: tabletop, walkthrough, simulation, and full-interrupt. Which statement correctly characterizes the formats?",
      opts: [
        "Tabletop is discussion-based with no systems touched; walkthrough is a step-by-step review of the IR plan; simulation involves role-play with realistic injects but production systems are not disrupted; full-interrupt actually disrupts production systems to test live response (highest realism, highest risk)",
        "Tabletop disrupts production; walkthrough involves role-play; simulation is discussion-based; full-interrupt is a step-by-step plan review",
        "All four exercise types are functionally identical — the labels differ by industry tradition only",
        "Tabletop and full-interrupt are the same thing; walkthrough and simulation are the same thing — there are only two distinct categories",
      ],
      a: 0,
      exp: "The four exercise types are arrayed along an intrusiveness/realism axis. Tabletop is the lowest — purely discussion-based, no systems touched; useful for validating decision-making and roles. Walkthrough is a structured step-by-step review of the IR plan against a scenario. Simulation involves role-play with realistic scenario injects (often with a facilitator playing external parties) but production is not disrupted. Full-interrupt is the most realistic — it actually disrupts production systems (e.g. takes a database offline) to test live response, and carries the highest operational risk. Higher intrusiveness gives higher realism but higher business risk; most organizations cycle through all four as their program matures.",
      messerVideo: "4.8 - Incident Planning",
      subObjective: "4.8",
    },
  },
];

// ─── Apply ─────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const videoById = new Map();
for (const sec of data) {
  for (const v of sec.videos) videoById.set(v.id, v);
}

let added = 0;
let skipped = 0;
let mcAdded = 0;
let scenAdded = 0;
for (const { videoId, kind, item } of INSERTIONS) {
  const video = videoById.get(videoId);
  if (!video) {
    console.error(`ERROR: video ${videoId} not found`);
    process.exit(1);
  }
  const arrName = kind === "mc" ? "questions" : "scenarios";
  if (!Array.isArray(video[arrName])) video[arrName] = [];
  const stemHead = item.q.slice(0, 60);
  const already = video[arrName].some((s) => typeof s.q === "string" && s.q.startsWith(stemHead));
  if (already) {
    console.log(`skip   ${videoId} ${kind}: already has "${stemHead}..."`);
    skipped++;
    continue;
  }
  video[arrName].push(item);
  console.log(`append ${videoId} ${kind}[${video[arrName].length - 1}]: "${stemHead}..."`);
  added++;
  if (kind === "mc") mcAdded++; else scenAdded++;
}

console.log(`\n${added} appended (${mcAdded} MC + ${scenAdded} scenarios), ${skipped} skipped.`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${jsonPath}`);
} else if (preview) {
  writeFileSync(previewPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote preview ${previewPath} — run validator with --path=${previewPath}`);
} else {
  console.log("(dry run — pass --write to persist, or --preview for validator preview)");
}
