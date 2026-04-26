// One-shot applier: append 29 Domain 4 Batch 2 items + 1 in-place replacement
// (REPLACEMENT preserves SM-2 indices: §4.4.1 MC 3 NTP-duplicate is overwritten
// in place with new continuous-monitoring vs periodic-scanning content; the
// §4.9.1 NTP MC stays untouched).
//
// Total Batch 2 net: 17 MC + 13 scen = 30 new items (the replacement counts
// toward Batch 2 since it's a new question, but does NOT increase §4.4.1 MC count).
//
// Idempotent: insertions detect already-inserted items by stem prefix and skip;
// the replacement detects whether the target slot already holds the new content
// (skip), the original NTP content (replace), or something unexpected (error).
//
// Usage:
//   node scripts/add-domain4-batch2.mjs              # dry-run, prints diff summary
//   node scripts/add-domain4-batch2.mjs --preview    # write previewed copy to /tmp for validator
//   node scripts/add-domain4-batch2.mjs --write      # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d4b2-preview.json";
const write = process.argv.includes("--write");
const preview = process.argv.includes("--preview");

// ─── In-place replacement (NTP duplicate cleanup) ───
const REPLACEMENTS = [
  {
    videoId: "4.4.1",
    kind: "mc",
    index: 3,
    expectedOldStemPrefix: "Why is NTP critical for security log analysis?",
    item: {
      q: "A security team is choosing between continuous monitoring and periodic scanning for two different detection needs: (i) detecting active intrusion attempts in real time, and (ii) verifying compliance with a configuration baseline across the fleet on a quarterly basis. Which approach BEST fits each need?",
      opts: [
        "(i) Continuous monitoring (SIEM with real-time correlation, EDR streaming telemetry); (ii) Periodic scanning (quarterly compliance scan against the baseline)",
        "(i) Periodic scanning every 24 hours; (ii) Continuous monitoring of the configuration files in real time across the fleet",
        "(i) Continuous monitoring; (ii) Continuous monitoring — both needs require the same approach regardless of the detection question",
        "(i) Periodic scanning; (ii) Periodic scanning — both needs require the same approach regardless of the detection question",
      ],
      a: 0,
      exp: "Continuous monitoring runs always and alerts on deviations from baseline as they occur — appropriate for ACTIVE detection where time-to-detect matters (intrusion attempts, data exfiltration, anomalous logins). Periodic scanning runs on schedule and captures point-in-time state — appropriate for COMPLIANCE verification (quarterly configuration audit, monthly vulnerability scan, annual access review) where the question is 'is the state compliant right now?' rather than 'is something happening right now?'. Periodic scanning every 24 hours is too slow for active threats. Forcing one approach to fit both needs misses the time-axis distinction.",
      messerVideo: "4.4 - Security Monitoring",
      subObjective: "4.4",
    },
  },
];

const INSERTIONS = [
  // ─── §4.1 Security Techniques (3 items) ───
  {
    videoId: "4.1.3",
    kind: "mc",
    item: {
      q: "An organization is documenting three mobile device deployment models that it offers to different employee groups: (1) employees can use their personal smartphones for work email and corporate apps; (2) the company buys smartphones for sales staff and explicitly allows personal use too; (3) employees choose from a company-approved list of laptops, which the company purchases and owns. Which set of model labels matches in order?",
      opts: [
        "(1) BYOD; (2) COPE; (3) CYOD",
        "(1) COPE; (2) BYOD; (3) CYOD",
        "(1) CYOD; (2) BYOD; (3) COPE",
        "(1) BYOD; (2) CYOD; (3) COPE",
      ],
      a: 0,
      exp: "BYOD (Bring Your Own Device) — employee-owned, employee-managed (with optional MDM enrollment for corporate data); selective wipe is the typical data-removal authority (corporate data only, personal data untouched). COPE (Corporate-Owned, Personally-Enabled) — corporate buys the device but explicitly allows personal use; full MDM and full-device wipe authority. CYOD (Choose Your Own Device) — employee selects from a company-approved list of devices that the company buys and owns; full MDM and full-device wipe. The three models distinguish primarily by ownership and data-wipe authority.",
      messerVideo: "4.1 - Securing Wireless and Mobile",
      subObjective: "4.1",
    },
  },
  {
    videoId: "4.1.2",
    kind: "mc",
    item: {
      q: "An organization is hardening three different asset classes: enterprise servers, employee mobile devices, and IoT sensors deployed in a manufacturing plant. Which hardening priority is MOST distinctive to IoT (i.e. the priority that most differentiates IoT hardening from server or mobile hardening)?",
      opts: [
        "Strong password complexity policies — IoT devices benefit from the same password rules used for enterprise servers and managed laptops",
        "Disabling unnecessary services and changing default credentials — IoT devices ship with well-known defaults cataloged in attack tools, and run services not needed in the deployed environment",
        "Full-disk encryption — IoT devices must have encrypted local storage in a way that servers and mobile devices typically do not require for routine deployments",
        "Frequent operating-system patching via the device vendor — IoT vendors push patches monthly the same way Microsoft and Apple do for their fleets",
      ],
      a: 1,
      exp: "IoT hardening's most distinctive characteristic is that devices ship with well-known default credentials (often documented publicly and built into bot-net tools like Mirai), and many run services that are not needed in the deployed environment — so changing defaults and disabling unneeded services is the highest-leverage IoT-specific action. Password complexity helps but applies broadly. Full-disk encryption is more critical for mobile/laptop than for stationary IoT sensors. IoT vendors are notoriously irregular about patches — many devices receive no patches after the first year — so patching is harder, not easier, than for servers and mobile.",
      messerVideo: "4.1 - Hardening Targets",
      subObjective: "4.1",
    },
  },
  {
    videoId: "4.1.3",
    kind: "scenario",
    item: {
      q: "A company allows BYOD for employee smartphones. An employee enrolls their personal iPhone in the corporate MDM to access email and Slack. Six months later, the employee leaves the company. The MOST appropriate action by the IT team for the device is:",
      opts: [
        "Full device wipe — restore the iPhone to factory defaults so all data (corporate AND personal) is removed, ensuring no corporate residue remains anywhere",
        "Selective wipe via MDM — remove only the corporate profile, corporate apps, and corporate data (email, Slack, certificates); the employee's personal photos, contacts, and apps remain untouched",
        "Demand the employee surrender the personal device for forensic imaging before any wipe occurs, since the device may contain evidence of company data",
        "Take no action — the employee's personal device is their property and the company has no authority to act on it after departure under any circumstances",
      ],
      a: 1,
      exp: "For BYOD, the appropriate scope of corporate authority is the corporate data only — the device remains the employee's property, so a full wipe (which would destroy personal photos, contacts, apps) is not authorized and is also unnecessary. Selective wipe via MDM removes only the corporate profile, corporate apps, and corporate data (email, Slack, certificates) while leaving personal data intact. Demanding forensic imaging of a personal device is not warranted by routine departure (it would require legal cause). Taking no action leaves corporate data on the device, which is unacceptable. The selective-wipe capability is exactly why MDM enrollment is required for BYOD.",
      messerVideo: "4.1 - Securing Wireless and Mobile",
      subObjective: "4.1",
    },
  },

  // ─── §4.2 Asset Management (1 item) ───
  {
    videoId: "4.2.1",
    kind: "mc",
    item: {
      q: "A company maintains a hardware inventory of 5,000 assets and a software inventory generated by an asset-discovery tool that scans the network monthly. The asset-management team needs to verify that physical assets in the warehouse match the hardware inventory, and that deployed devices in the network match both inventories. Which combination of asset-tracking mechanisms is MOST appropriate for these two distinct verification needs?",
      opts: [
        "RFID for warehouse cycle counts; barcodes for shelf-level audits; software-discovery for deployed-device reconciliation against hardware inventory",
        "Use only barcodes everywhere — RFID is unnecessary, and software-discovery tools are unreliable for asset matching at any scale",
        "Use only RFID for both warehouse and network — RFID readers can detect deployed devices on the network as well as in storage areas",
        "Manual visual inspection of every asset quarterly — automated tracking systems are not sufficiently accurate for asset management at any scale",
      ],
      a: 0,
      exp: "Different verification needs call for different mechanisms. RFID enables bulk read from a distance — ideal for warehouse cycle counts (a single pass with a handheld reader inventories shelves of devices). Barcodes are line-of-sight and per-item — appropriate for shelf-level spot checks and tagging at intake. Software-discovery tools enumerate deployed devices via network presence (DHCP, agent check-in, etc.) and reconcile against the hardware inventory to flag missing or unknown assets. Each tool fits a distinct verification axis. Single-tool approaches leave gaps. Manual inspection does not scale to 5,000 assets and is error-prone.",
      messerVideo: "4.2 - Asset Management",
      subObjective: "4.2",
    },
  },

  // ─── §4.3 Vulnerability Management (4 items) ───
  {
    videoId: "4.3.5",
    kind: "mc",
    item: {
      q: "A vulnerability management team faces four different vulnerabilities. Vulnerability (i) is a critical RCE in a supported product with a vendor patch available. Vulnerability (ii) is a critical RCE in a legacy unsupported industrial controller that cannot be patched. Vulnerability (iii) is a low-severity finding where remediation cost ($500K) exceeds expected loss ($5K). Vulnerability (iv) is in a deprecated service no business unit still uses. Which treatment-mapping is correct?",
      opts: [
        "(i) PATCH (apply vendor patch); (ii) COMPENSATING CONTROL (segment + monitor); (iii) ACCEPT (formal risk acceptance); (iv) AVOID (decommission service)",
        "(i) COMPENSATING CONTROL (segment + monitor); (ii) PATCH (apply vendor patch); (iii) AVOID (decommission service); (iv) ACCEPT (formal risk acceptance)",
        "(i) AVOID (decommission service); (ii) ACCEPT (formal risk acceptance); (iii) COMPENSATING CONTROL (segment + monitor); (iv) PATCH (apply vendor patch)",
        "(i) PATCH; (ii) PATCH; (iii) PATCH; (iv) PATCH — patching is always the correct treatment regardless of feasibility or cost",
      ],
      a: 0,
      exp: "PATCH directly fixes the vulnerability — preferred when feasible (supported product, available vendor patch). COMPENSATING CONTROL leaves the vulnerability but adds mitigations (segmentation, monitoring, WAF rules) — typical for legacy or unsupported systems that cannot be patched. ACCEPT documents and accepts residual risk when remediation cost exceeds expected loss; requires formal risk acceptance with management sign-off. AVOID stops using the affected system entirely — appropriate when no business need remains. Universal patching ignores feasibility, cost, and business context.",
      messerVideo: "4.3 - Vulnerability Remediation",
      subObjective: "4.3",
    },
  },
  {
    videoId: "4.3.5",
    kind: "scenario",
    item: {
      q: "A vulnerability management team patched 90% of the affected production servers for a critical CVE within the SLA window. The remaining 10% (approximately 40 servers) cannot be patched in this cycle because they are part of a frozen change window for a quarter-end financial close. The MOST defensible action for the unpatched 10% is:",
      opts: [
        "Patch the remaining 10% immediately, breaking the change freeze — security must always override business change windows regardless of operational impact",
        "Accept the residual risk silently — the 90% patched is sufficient and the 10% will be addressed in the next cycle without any formal documentation",
        "Document the residual risk with a formal risk acceptance signed by an appropriate authority, deploy compensating controls (e.g. enhanced monitoring on the unpatched hosts, network segmentation), and schedule the patch for the first available change window after quarter-end",
        "Disable the 40 unpatched servers entirely until they can be patched, even though this halts the financial close and causes significant business disruption",
      ],
      a: 2,
      exp: "Partial remediation plus formal documentation of the remaining residual risk is the standard pattern when a hard business constraint blocks full patching. The defensible response is: (1) document the residual risk with a formal risk acceptance signed by an appropriate authority (the business owner accepting the constraint), (2) deploy compensating controls to reduce exploitability in the interim (enhanced monitoring, network segmentation), and (3) schedule the patch for the first available window after the constraint lifts. Breaking the change freeze unilaterally is rarely defensible. Silent acceptance leaves no audit trail. Disabling the servers is disproportionate.",
      messerVideo: "4.3 - Vulnerability Remediation",
      subObjective: "4.3",
    },
  },
  {
    videoId: "4.3.4",
    kind: "mc",
    item: {
      q: "A new vulnerability is discovered in a widely-used open-source library. Which sequence BEST describes the typical CVE workflow from discovery to remediation?",
      opts: [
        "Vendor advisory issued → CVE-ID assigned → discovery → CVSS scored → remediation deployed",
        "Discovery → CVE-ID assigned by a CNA (CVE Numbering Authority) → CVSS Base score computed → vendor advisory and patch issued → consumers remediate",
        "Remediation deployed → vendor advisory issued → discovery → CVE-ID assigned → CVSS scored",
        "Discovery → CVSS scored → patch deployed → CVE-ID assigned → vendor advisory issued",
      ],
      a: 1,
      exp: "The standard CVE workflow runs: a researcher or vendor DISCOVERS the vulnerability → a CNA (CVE Numbering Authority, e.g. MITRE or a participating vendor) ASSIGNS a CVE-ID → CVSS Base score is COMPUTED (often by the vendor or NVD) → the vendor issues an ADVISORY and patch → consumers REMEDIATE. CVE-IDs serve as the cross-vendor reference identifier; CVSS provides the severity scoring; vendor advisories are the actionable consumer-facing communication. The other options scramble the order — advisories cannot be issued before discovery, and remediation cannot precede CVE assignment.",
      messerVideo: "4.3 - Analyzing Vulnerabilities",
      subObjective: "4.3",
    },
  },
  {
    videoId: "4.3.5",
    kind: "scenario",
    item: {
      q: "A critical CVE is announced affecting a production database server. The vendor patch requires a service restart to take effect. The database is the back-end for a customer-facing payment system that processes transactions 24/7 with no scheduled downtime windows. The MOST appropriate combined approach is:",
      opts: [
        "Apply the patch immediately during business hours and accept the downtime — security takes precedence over availability in all cases without exception",
        "Decline the patch entirely — restarts cannot be tolerated, so the vulnerability must be permanently accepted as a residual risk indefinitely",
        "Deploy compensating controls immediately (enhanced WAF rules, IPS signatures targeting the CVE's exploit pattern, increased monitoring on the database tier), then schedule the patch + restart during the lowest-traffic maintenance window with full failover/cluster failover prep",
        "Take the system offline indefinitely until the vendor releases a patch that does not require a restart for the new fix",
      ],
      a: 2,
      exp: "The right pattern under hard availability constraints is COMBINED treatment: deploy compensating controls now (WAF rules, IPS signatures targeting the exploit, enhanced monitoring) to reduce exposure in the interim, then schedule the patch with proper failover prep at the lowest-impact window. Patching during peak hours risks customer-facing outage. Permanent acceptance ignores the available patch and is not defensible for a critical CVE. Indefinite offline status is disproportionate. Combined treatment lets the team address the vulnerability while respecting business constraints — the same compensating-controls-then-patch pattern used for any can't-restart-now situation.",
      messerVideo: "4.3 - Vulnerability Remediation",
      subObjective: "4.3",
    },
  },

  // ─── §4.4 Security Monitoring (2 items + 1 replacement above) ───
  {
    videoId: "4.4.1",
    kind: "mc",
    item: {
      q: "An enterprise generating 50 TB of logs per day across three datacenters is designing its log architecture and weighing centralized SIEM ingestion vs distributed forwarders vs a hybrid approach. Which statement BEST captures the central trade-off?",
      opts: [
        "All three patterns produce identical cost, correlation depth, and operational complexity at any scale — the choice is purely vendor preference",
        "Centralized SIEM gives the deepest correlation at the highest cost; distributed forwarders preprocess locally — lower cost, scales better, less correlation depth; hybrid combines both per source value",
        "Distributed forwarders should be used for all logs in all enterprises because centralized SIEM ingestion is universally too expensive to justify",
        "Centralized SIEM should be used for all logs in all enterprises because distributed forwarders introduce unmanageable complexity at every scale",
      ],
      a: 1,
      exp: "Each pattern has real trade-offs. Centralized SIEM ingestion sends every log to one SIEM — best correlation across sources, but expensive at scale (storage and ingest licensing) and bottlenecked at the SIEM tier. Distributed forwarders preprocess locally — filter, enrich, normalize — forwarding only the reduced stream; this scales better and lowers SIEM cost but loses some correlation depth on the filtered sources. Hybrid is what most large enterprises deploy: centralized ingestion for high-value sources (auth, network perimeter, EDR), forwarder pre-filtering for high-volume low-value sources (Windows event volume, debug logs).",
      messerVideo: "4.4 - Security Monitoring",
      subObjective: "4.4",
    },
  },
  {
    videoId: "4.4.1",
    kind: "scenario",
    item: {
      q: "A SOC analyst is investigating a suspected compromise of a developer's workstation. They need to reconstruct: who logged in and when (authentication trail), what network connections the host made (network trail), what files and processes ran on the host (host trail), and what application requests went to a key internal service (application trail). The MOST efficient investigation strategy is:",
      opts: [
        "Pull only the firewall logs — the firewall sees all traffic and is the single source of truth for any compromise investigation",
        "Correlate logs from multiple sources: auth logs (AD/SSO/LDAP) for the authentication trail; network logs (firewall, NetFlow, DNS) for the network trail; EDR/host logs for the file and process trail; application logs for the application requests; SIEM correlation links them by user, host, and timestamp",
        "Pull only the EDR telemetry — EDR sees everything happening on the endpoint and is sufficient for a complete investigation across all axes",
        "Interview the developer — they will remember what they did, which is more reliable than any log source for reconstructing activity",
      ],
      a: 1,
      exp: "Each log source answers a different investigation question, and a real compromise investigation almost always requires correlating across them. Auth logs (AD/SSO) reveal who authenticated and when. Network logs (firewall, NetFlow, DNS) reveal what destinations the host contacted. Host logs and EDR telemetry reveal what processes ran and what files changed on the endpoint. Application logs reveal what the host requested from a specific service. SIEM correlation links them via shared keys (username, host, timestamp). Single-source approaches leave large blind spots — the firewall does not see local process activity, the EDR does not see network destination context as well as the firewall. User memory is not a log source.",
      messerVideo: "4.4 - Security Monitoring",
      subObjective: "4.4",
    },
  },

  // ─── §4.5 Enterprise Security (5 items) ───
  {
    videoId: "4.5.5",
    kind: "scenario",
    item: {
      q: "A company is rolling out DMARC for the first time. Their DNS currently has SPF and DKIM but no DMARC record. The mail security team is debating whether to publish the initial DMARC policy as p=none, p=quarantine, or p=reject. The MOST appropriate rollout sequence is:",
      opts: [
        "Publish p=reject immediately — full enforcement is the goal, and any legitimate mail not covered by SPF/DKIM is the sender's problem to fix on their side",
        "Publish p=none for at least 4-6 weeks (collect aggregate reports, identify legitimate senders not yet aligned with SPF/DKIM), then move to p=quarantine for several more weeks (verify no significant false positives), then move to p=reject for full enforcement",
        "Publish p=quarantine permanently — quarantine catches abuse without the bounce risk of reject, so reject is unnecessary regardless of the deployment maturity",
        "Skip DMARC entirely — SPF and DKIM are sufficient on their own without a DMARC policy layer above them",
      ],
      a: 1,
      exp: "The standard DMARC rollout is a staged progression. p=none (monitor only) collects aggregate reports for at least 4-6 weeks so the team can identify any legitimate mail streams that are not yet aligned with SPF/DKIM (often: newsletter platforms, ticketing systems, third-party mailers using the corporate domain). p=quarantine then catches most abuse while non-aligned legitimate mail goes to spam folders rather than bouncing — a safety margin. p=reject is the final state once the team is confident no significant false positives remain. Premature p=reject causes legitimate mail to bounce. Permanent quarantine leaves more abuse than necessary. Skipping DMARC entirely leaves SPF and DKIM unenforced at the policy layer.",
      messerVideo: "4.5 - Email Security",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.6",
    kind: "mc",
    item: {
      q: "A company wants to detect three different data-leak vectors: (1) sensitive data being uploaded to a personal cloud service via a browser, (2) sensitive data being copied to a USB drive on a corporate laptop, and (3) sensitive data being shared in a Slack channel. Which DLP positioning catches each vector?",
      opts: [
        "(1) Cloud DLP (CASB or SaaS API integration); (2) Endpoint DLP (host agent); (3) Cloud DLP (Slack API integration)",
        "(1) Network DLP only — all egress traffic is visible at the network boundary regardless of destination",
        "(1) Endpoint DLP only — every action originates on an endpoint, so endpoint DLP catches everything across all vectors",
        "(1) Network DLP; (2) Network DLP; (3) Network DLP — all three should use the same tool for consistency",
      ],
      a: 0,
      exp: "Different DLP positionings catch different vectors. Cloud DLP integrates with SaaS APIs (Google Drive, Box, Slack, Microsoft 365) and inspects content shared via the SaaS — the only way to catch the Slack share and the cloud-API browser upload (network DLP cannot inspect TLS-encrypted SaaS traffic without breaking the connection). Endpoint DLP runs on the host and catches local actions invisible to the network — USB writes, printing, screen capture, copy to local clipboard. Network DLP inspects egress traffic and catches data leaving via uninspected channels — but TLS-encrypted SaaS uploads and host-local copies are blind spots. The right architecture combines all three.",
      messerVideo: "4.5 - Monitoring Data",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.2",
    kind: "mc",
    item: {
      q: "A company's web filter must block three different threats: (1) employees accessing gambling and adult-content websites during work hours; (2) brand-new typosquatting domains used in fresh phishing campaigns; (3) one specific malicious domain identified by the IR team yesterday. Which web filtering approach is BEST for each threat?",
      opts: [
        "(1) Category-based filtering (gambling/adult categories); (2) Reputation-based filtering (low-reputation/recently-registered domains); (3) Domain-list (explicit block list)",
        "(1) Domain-list block; (2) Domain-list block; (3) Domain-list block — explicit lists are sufficient for all web filtering needs at any scale",
        "(1) Reputation-based; (2) Category-based; (3) Reputation-based — reputation handles all dynamic threats across the board",
        "(1) Category-based; (2) Category-based; (3) Category-based — categories cover all threat types regardless of novelty",
      ],
      a: 0,
      exp: "The three approaches catch different threat patterns. Category-based filtering classifies sites by content category (gambling, adult, social media) and is best for policy enforcement of broad categories. Reputation-based filtering scores domains by signals like age, registrar, hosting infrastructure, and known-bad associations — best for catching brand-new threats not yet on category or block lists (typosquats, fresh phishing). Domain-list filtering uses explicit allow/block lists — best for known specific threats (the one IR-identified domain). Single-approach strategies leave gaps: category lists miss novel domains, domain lists do not generalize, reputation alone may miss policy violations on legitimate-looking sites.",
      messerVideo: "4.5 - Web Filtering",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.6",
    kind: "scenario",
    item: {
      q: "A DLP team is configuring rules to detect three sensitive data types in outbound email: (1) US Social Security Numbers (SSN), (2) the source code of a proprietary trading algorithm (a 200,000-line Python codebase), (3) customer credit card numbers. Which detection technique is MOST appropriate for each?",
      opts: [
        "(1) Pattern matching (regex with checksum validation, e.g. SSN format with the area-number rules); (2) Document fingerprinting (hash chunks of the codebase, detect significant overlap); (3) Pattern matching with Luhn checksum validation for the card number format",
        "(1) Exact-match dictionary lookup against a list of every issued SSN; (2) Pattern matching for 'Python keywords'; (3) Exact-match against a list of every issued card number",
        "(1) Document fingerprinting; (2) Pattern matching; (3) Document fingerprinting — fingerprinting is the universal solution for all sensitive data types",
        "(1) Manual reviewer reads every outbound email; (2) Manual reviewer reads every outbound email; (3) Manual reviewer reads every outbound email",
      ],
      a: 0,
      exp: "DLP detection technique should match the data type. PATTERN MATCHING (regex with structural validation) suits well-structured data with checksums — SSNs have area-number rules, credit cards have Luhn checksum validation; this catches actual SSN/card numbers with very low false-positive rates. DOCUMENT FINGERPRINTING hashes content chunks of a known sensitive document, then detects significant overlap in outbound content — the right technique for a proprietary codebase or sensitive document where you want to detect the specific content even after edits or excerpting. EXACT-MATCH lookup is impractical at scale, and pattern-matching for 'Python keywords' would generate massive false positives. Manual review does not scale.",
      messerVideo: "4.5 - Monitoring Data",
      subObjective: "4.5",
    },
  },
  {
    videoId: "4.5.7",
    kind: "scenario",
    item: {
      q: "A company deploys 802.1X-based Network Access Control (NAC) with posture assessment on its corporate wired network. A contractor connects their personal laptop to a network port; the NAC posture check finds the device has no corporate AV agent, no current OS patches, and is not domain-joined. The MOST appropriate NAC behavior is:",
      opts: [
        "Block the device entirely — drop the link with no notice to the user, who will figure out what happened on their own eventually",
        "Place the device into a quarantine VLAN with restricted access (e.g. only DHCP, DNS, and a remediation portal that explains the failure and offers remediation steps); allow full access only after the device meets the posture policy or after exception approval",
        "Allow full corporate network access — the contractor is on-site and presumably trusted because they were granted physical access to the building",
        "Disable the network port permanently to prevent future contractor connection attempts on that port regardless of who plugs in next",
      ],
      a: 1,
      exp: "The standard NAC posture-failure response is quarantine VLAN placement: the device gets restricted network access (DHCP, DNS, and a remediation portal explaining the failure and the remediation path) but cannot reach corporate resources until it meets posture or receives exception approval. Outright link drop with no notice leaves the user confused. Granting full access on the basis of physical presence defeats the entire purpose of posture assessment. Permanently disabling the port is disproportionate and harms future legitimate users. The remediation-portal pattern is what makes NAC operationally workable.",
      messerVideo: "4.5 - Endpoint Security",
      subObjective: "4.5",
    },
  },

  // ─── §4.6 IAM (4 items) ───
  {
    videoId: "4.6.4",
    kind: "mc",
    item: {
      q: "NIST SP 800-63B (Digital Identity Guidelines, 2017) deprecated several long-standing password practices. Which of the following is NOT recommended (and is in fact discouraged) by current NIST guidance?",
      opts: [
        "Long passphrases (16+ characters) and screening passwords against breached-password lists at registration and periodic intervals",
        "Allowing users to view their typed password on demand to reduce typing errors during entry",
        "Mandatory periodic password rotation without compromise evidence, AND composition rules (uppercase + number + special character)",
        "Multi-factor authentication for elevated-privilege accounts, with phishing-resistant factors preferred for highest-sensitivity accounts",
      ],
      a: 2,
      exp: "NIST SP 800-63B (2017) explicitly deprecated several pre-2017 'best practices': mandatory periodic rotation without evidence of compromise (it produces predictable patterns and weak passwords), composition rules requiring uppercase + number + special characters (they reduce entropy in practice and frustrate users), password hints, and knowledge-based authentication ('what's your mother's maiden name'). What NIST recommends instead: long passphrases, screening against known-breached password lists, and MFA. The view-on-demand option is a legitimate usability improvement, and MFA is current best practice. Option C bundles two things NIST specifically deprecated.",
      messerVideo: "4.6 - Password Security",
      subObjective: "4.6",
    },
  },
  {
    videoId: "4.6.2",
    kind: "mc",
    item: {
      q: "A security architect is documenting their privileged access strategy and uses three terms: PAM, PASM, and PEDM. Which set of definitions correctly relates them?",
      opts: [
        "PAM is a vendor product name; PASM and PEDM are the open-source equivalents from different communities",
        "PAM is the umbrella category for managing privileged access; PASM (Privileged Account and Session Management) is a PAM subcategory focused on credential vaulting + session brokering + recording; PEDM (Privilege Elevation and Delegation Management) is a PAM subcategory focused on elevating endpoint privileges on demand",
        "PAM, PASM, and PEDM are interchangeable terms for the same product category used by different vendors",
        "PAM stands for Public Access Management (web portals); PASM stands for Public Access Session Management; PEDM stands for Public Enterprise Domain Management",
      ],
      a: 1,
      exp: "PAM (Privileged Access Management) is the umbrella category for managing privileged accounts and sessions across an organization. PASM (Privileged Account and Session Management) is a PAM subcategory specifically focused on credential vaulting, session brokering (proxy), and session recording — the classic 'put admin credentials in a vault and broker the session' product. PEDM (Privilege Elevation and Delegation Management) is a different PAM subcategory focused on endpoint privilege elevation on demand (elevating a standard user to admin for a specific task without giving them a permanent admin account). Other PAM subcategories include Secrets Management for application/service credentials.",
      messerVideo: "4.6 - Access Controls",
      subObjective: "4.6",
    },
  },
  {
    videoId: "4.6.2",
    kind: "scenario",
    item: {
      q: "A company implements Just-in-Time (JIT) elevation for production database access. A developer needs production read access to debug an outage. Which workflow correctly describes how JIT elevation should function?",
      opts: [
        "The developer requests elevation via the JIT system → request routes to the approver(s) (manager + on-call security) → approval grants time-bound access (e.g. 4 hours) to the production database role → session is logged and recorded → access auto-expires at the end of the window with no manual revocation needed",
        "The developer is given standing production database admin access at hire so they can debug at any time without delay or approval steps",
        "The developer emails an admin who manually toggles the developer's account from 'developer' to 'admin' for the day, then forgets to revoke it after the work is finished",
        "JIT elevation does not require approval — any developer can self-elevate at any time as long as they document the reason in a wiki page after the fact",
      ],
      a: 0,
      exp: "JIT elevation's value is in its workflow: REQUEST (user explains why and what they need), APPROVE (an appropriate authority — typically manager + security on-call — grants the request), TIME-BOUND grant (access lasts only as long as needed), AUDIT (session is logged and recorded), AUTO-EXPIRE (access is removed automatically at the end of the window with no human action). Standing privilege defeats the JIT model entirely. Manual ad-hoc toggling without auto-expire creates the 'forgot to revoke' anti-pattern. Self-elevation without approval is not JIT — it's standing privilege with extra paperwork. The auto-expire and approval gates are what distinguish JIT from break-glass and from standing privilege.",
      messerVideo: "4.6 - Access Controls",
      subObjective: "4.6",
    },
  },
  {
    videoId: "4.6.1",
    kind: "mc",
    item: {
      q: "A security review identifies four account-management practices in a company. Which one represents a security ANTI-PATTERN that should be remediated?",
      opts: [
        "An administrator's single Active Directory account is used for both daily work (email, browsing) AND privileged tasks; the account holds Domain Admin rights at all times",
        "Service accounts running automation are configured as non-interactive (cannot be used for human login); credentials are stored in a secrets vault and rotated automatically on a schedule",
        "Each employee has a standard user account for daily work AND a separate admin account for privileged tasks; the admin account is used only when elevated work is required and is otherwise dormant",
        "Guest accounts for short-term visitors are time-bound, network-isolated to a guest VLAN, and automatically expire after the visit period without requiring manual cleanup",
      ],
      a: 0,
      exp: "Combining daily work and privileged administration in a single account is a long-standing anti-pattern: the account is exposed to phishing, browser drive-bys, and any other risk that comes with daily activity, but the account holds Domain Admin rights at all times — so any compromise of the account's daily-work activity immediately yields full domain compromise. The standard fix is the separation in option C: each privileged user has BOTH a standard daily-work account AND a separate admin account, with the admin account used only when elevated work is required. Service accounts should indeed be non-interactive with vaulted, rotated credentials. Guest accounts should be time-bound and network-isolated. Only option A is the anti-pattern.",
      messerVideo: "4.6 - Identity and Access Management",
      subObjective: "4.6",
    },
  },

  // ─── §4.7 Automation (2 items) ───
  {
    videoId: "4.7.1",
    kind: "mc",
    item: {
      q: "A security team is identifying high-value candidates for security automation. Which set of tasks is BEST suited for automation (high-volume, repetitive, well-defined input/output, low judgment required)?",
      opts: [
        "User account provisioning/deprovisioning when HR posts a hire/termination event; routine ticket creation when a SIEM alert exceeds a threshold; vulnerability scan triage that closes false-positive findings matching known patterns; IR playbook composition that orchestrates standard containment steps",
        "Strategic security architecture decisions; vendor selection negotiations; incident communication with regulators and the press; threat-actor attribution analysis under uncertainty",
        "Code review approvals that require deep judgment; legal contract review with negotiation; executive briefings on emerging risks; security policy authorship from scratch",
        "Manual penetration testing with novel exploitation paths; red-team campaign design and execution; security awareness training content authorship for adult learners",
      ],
      a: 0,
      exp: "Good automation candidates share four characteristics: high-volume (worth the build cost), repetitive (the same operation many times), well-defined input/output (clear contract), and low judgment (humans not adding value). Account provisioning, ticket creation, false-positive triage, and IR playbook composition all match. Strategic decisions, communications, and contract review require judgment, context, and accountability that automation cannot supply. Manual pen testing and content authorship are creative and exploratory. Choosing the right targets is the most important automation decision; automating the wrong things wastes effort and creates new failure modes.",
      messerVideo: "4.7 - Scripting and Automation",
      subObjective: "4.7",
    },
  },
  {
    videoId: "4.7.1",
    kind: "scenario",
    item: {
      q: "A SOC team is automating endpoint isolation in response to high-severity SIEM alerts. The playbook will: (1) parse the alert, (2) identify the affected endpoint, (3) call the EDR API to isolate the endpoint from the network. The team is concerned about a buggy detection rule auto-isolating dozens of production servers in a single false-positive cascade. The MOST appropriate guardrails are:",
      opts: [
        "No guardrails — the automation should run as fast as possible to maximize containment speed; any false positives can be reverted manually after the fact without consequence",
        "Validation (require the alert severity to match a strict rule, log the planned action), rate-limiting (cap the number of isolations per hour), approval gates for high-impact targets (require human approval before isolating servers tagged 'production critical'), and rollback (auto-revert the isolation if a follow-up signal indicates false positive within X minutes)",
        "Run the automation only quarterly so any cascade is naturally rate-limited by the long delay between executions of the playbook",
        "Disable EDR API access entirely so the automation cannot run at all and no risk of cascade exists in the environment",
      ],
      a: 1,
      exp: "High-impact automation needs guardrails proportional to the blast radius. The four standard guardrails are: VALIDATION (verify the trigger meets strict criteria before acting), RATE-LIMITING (cap the number of actions per time window so a buggy rule cannot cascade), APPROVAL GATES for high-impact targets (require human approval before acting on critical assets), and ROLLBACK (auto-revert the action if a follow-up signal indicates false positive). No-guardrails automation invites the exact cascade the team fears. Quarterly automation is too slow for active threats. Disabling the API entirely defeats the whole point. The guardrails-first design is what makes high-impact automation safe enough to deploy.",
      messerVideo: "4.7 - Scripting and Automation",
      subObjective: "4.7",
    },
  },

  // ─── §4.8 Incident Response (3 items) ───
  {
    videoId: "4.8.3",
    kind: "scenario",
    item: {
      q: "A forensic investigator collected a hard drive from a suspect's workstation, imaged it with a write blocker, and stored the image in evidence. Two weeks later, while preparing for trial, the investigator discovers that the chain-of-custody log has a 6-hour gap during which the original hard drive was unaccounted-for in the evidence room (the entry/exit log was not signed for that period). The MOST appropriate disclosure and recovery action is:",
      opts: [
        "Do not disclose the gap — fix the log retroactively to fill the gap with plausible entries so the trial proceeds without complication for the prosecution",
        "Disclose the chain-of-custody gap to opposing counsel and the court, document the gap in writing, and let the judge rule on admissibility — the integrity of evidence handling depends on accurate disclosure even when the disclosure damages the case",
        "Destroy the evidence to avoid the embarrassment of admitting the gap to the court at all and start the case over with new evidence",
        "Re-image the original hard drive now and use the new image as evidence, ignoring the gap in the original chain because the data is the same",
      ],
      a: 1,
      exp: "Chain-of-custody integrity depends on accurate disclosure of every gap, error, or anomaly. Fabricating retroactive entries is evidence tampering — a far more serious offense than an honest gap disclosure. Destroying evidence is also a serious offense (spoliation). Re-imaging now does not fix the historical gap and may itself constitute spoliation if the evidence has been altered in the gap window. The correct action is to disclose the gap to opposing counsel and the court, document it in writing, and let the judge rule on admissibility — possibly the evidence is still admissible with appropriate weight reduction, possibly it is excluded. The investigator's credibility and the case integrity both depend on the disclosure.",
      messerVideo: "4.8 - Digital Forensics",
      subObjective: "4.8",
    },
  },
  {
    videoId: "4.8.2",
    kind: "mc",
    item: {
      q: "An incident response team is conducting a post-mortem and is choosing among three root-cause-analysis frameworks: 5 Whys, Fishbone (Ishikawa), and Apollo. Which statement BEST distinguishes them?",
      opts: [
        "The three frameworks are equivalent and interchangeable — the choice is purely team preference with no methodological difference between them",
        "5 Whys: ask 'why' iteratively (5 times is a heuristic, not a strict count) until reaching a root cause that, if fixed, prevents recurrence; Fishbone (Ishikawa): categorical cause-mapping organized into branches (people, process, technology, environment, etc.) for visual exploration; Apollo: a more structured causal-chain method that links each effect to its causal conditions and actions",
        "5 Whys is for technical incidents only; Fishbone is for process incidents only; Apollo is for cultural incidents only — they are not interchangeable across categories",
        "All three frameworks yield the same root cause when applied correctly — they differ only in visual presentation style and report formatting",
      ],
      a: 1,
      exp: "The frameworks are real methodological alternatives with different strengths. 5 Whys is fast and conversational — ask 'why' iteratively until you hit a root cause that, when fixed, prevents recurrence; risk is shallow analysis if the team stops too soon. Fishbone (Ishikawa) is a categorical visual exploration — branches for people, process, technology, environment, etc. — useful when the team needs to canvas a broad space of possible causes. Apollo Root Cause Analysis is more structured and detailed — every effect links to its causal conditions AND the actions that caused it. The frameworks complement rather than substitute. The symptom-fix vs root-cause distinction matters across all three: patching the same issue repeatedly without RCA is symptom-fix.",
      messerVideo: "4.8 - Incident Planning",
      subObjective: "4.8",
    },
  },
  {
    videoId: "4.8.1",
    kind: "mc",
    item: {
      q: "At 11pm, a SOC analyst confirms a high-severity ransomware incident on a production server. Which escalation/communication order is MOST consistent with standard IR practice?",
      opts: [
        "SOC analyst → public press release on the company website immediately to maintain transparency; THEN internal notifications follow to leadership and the board",
        "SOC analyst → IR lead takes command → CISO/security leadership → CIO/IT leadership → executive leadership (CEO, legal, comms, CFO) → board if material → external counsel before any external statement → regulators per applicable law",
        "SOC analyst → board of directors directly, bypassing all middle management, because the board has ultimate authority over the technical and stakeholder response",
        "SOC analyst → law enforcement first, before any internal company notification, because external law-enforcement involvement should precede company communications",
      ],
      a: 1,
      exp: "Active-incident communication has both legal and operational ordering. The IR lead takes command of the technical response. Internal escalation runs UP the management chain (CISO → CIO → executive leadership → board if material) so each layer has the context they need to make decisions in their lane. External counsel is engaged BEFORE any external statement to manage privilege and regulatory exposure. Regulators are notified per the applicable law (HIPAA 60-day, GDPR 72-hour, state breach laws, SEC for material events). Premature external comms create legal exposure and may pre-empt a coordinated response. Bypassing management cuts off the people who need to authorize spend and reach customers. Notifying law enforcement before internal escalation is appropriate in narrow cases but is not the default order.",
      messerVideo: "4.8 - Incident Response",
      subObjective: "4.8",
    },
  },

  // ─── §4.9 Security Data Sources (5 items) ───
  {
    videoId: "4.9.1",
    kind: "mc",
    item: {
      q: "A SIEM team is normalizing log formats from three different sources: (1) a vendor security appliance that outputs CEF; (2) a Linux server outputting traditional syslog; (3) a cloud-native microservice outputting structured JSON. Which statement BEST describes how each format fits its use case?",
      opts: [
        "All three formats are equivalent and interchangeable — the SIEM treats them identically with no parser configuration needed",
        "CEF (Common Event Format): vendor-defined key-value pairs prefixed with a CEF header, designed for SIEM normalization and widely supported by security vendors; syslog: traditional Unix log format with severity + facility + timestamp + message, widespread but inconsistent across vendors (free-text message body); JSON: structured key-value, modern, easy to parse, increasingly the default for cloud-native services",
        "CEF is a deprecated format that should not be used; syslog and JSON are the only modern formats supported by current SIEM products",
        "JSON is impossible to ingest into a SIEM because it is too verbose; CEF and syslog are the only practical formats for any high-volume SIEM ingestion",
      ],
      a: 1,
      exp: "Each format has a distinct character. CEF (Common Event Format), originally from ArcSight, is a structured key-value format prefixed with a CEF header — designed for SIEM normalization and widely supported by security vendors. Traditional syslog (RFC 3164/5424) carries severity + facility + timestamp + hostname + free-text message body; widespread on Unix systems but the message body is unstructured, so each vendor's syslog needs its own parser. JSON is structured key-value, easy to parse, and increasingly the default for cloud-native and modern observability tooling. The three coexist; the SIEM team's job is to normalize all of them into a common schema for correlation.",
      messerVideo: "4.9 - Log Data",
      subObjective: "4.9",
    },
  },
  {
    videoId: "4.9.1",
    kind: "mc",
    item: {
      q: "A team is configuring alert thresholds for syslog ingestion. Which mapping of syslog severity numbers to severity names is correct?",
      opts: [
        "0 = Emergency, 1 = Alert, 2 = Critical, 3 = Error, 4 = Warning, 5 = Notice, 6 = Informational, 7 = Debug",
        "0 = Debug, 1 = Informational, 2 = Notice, 3 = Warning, 4 = Error, 5 = Critical, 6 = Alert, 7 = Emergency",
        "1 = Emergency, 2 = Alert, 3 = Critical, 4 = Error, 5 = Warning, 6 = Notice, 7 = Informational, 8 = Debug",
        "0 = Debug (least urgent), 1 = Informational, 2 = Notice, 3 = Warning, 4 = Error, 5 = Critical, 6 = Alert, 7 = Emergency (most urgent)",
      ],
      a: 0,
      exp: "syslog severity levels (RFC 3164/5424) run 0-7 from MOST severe to LEAST severe: 0 = Emergency (system unusable), 1 = Alert (action immediately), 2 = Critical, 3 = Error, 4 = Warning, 5 = Notice (normal but significant), 6 = Informational, 7 = Debug. The numbering is inverted from intuition (lower number = MORE severe, NOT 'lower number = more verbose debug detail'), which is the most common confusable. Practical alerting threshold pattern: production typically alerts/pages on 0-2, logs 3-5, suppresses 6-7. Both reversed-direction options (whether bare or labeled 'least urgent → most urgent') and off-by-one mappings are wrong.",
      messerVideo: "4.9 - Log Data",
      subObjective: "4.9",
    },
  },
  {
    videoId: "4.9.1",
    kind: "scenario",
    item: {
      q: "A SOC analyst is investigating a suspected lateral-movement incident. They need to answer four questions: (1) Did the suspected attacker authenticate to a domain controller? (2) Did the attacker establish outbound network connections to suspicious destinations? (3) What processes ran on the suspected jump-host? (4) Did the attacker submit any unusual queries to a key business application? Which log source set is MOST appropriate for each question?",
      opts: [
        "(1) AD security event logs / domain controller audit logs; (2) firewall + DNS + NetFlow logs; (3) EDR / Sysmon / OS process logs on the jump-host; (4) application logs from the business application",
        "Use only the firewall logs for all four questions — the firewall is the central source of truth for any investigation across all axes",
        "Use only EDR for all four questions — EDR sees everything that matters across authentication, network, host, and application data",
        "Interview the network administrator for all four questions — they will remember any unusual activity better than the logs do at 3am",
      ],
      a: 0,
      exp: "Each investigation question has a primary log source where the answer lives. Authentication events live in AD security event logs / domain controller audit logs (Event IDs 4624, 4625, 4768, etc.). Outbound network connections are visible in firewall logs (allow/deny + source/dest), DNS query logs (which destinations were resolved), and NetFlow (volume and pattern). Local process activity lives in EDR telemetry, Sysmon, and OS process logs on the affected host. Application requests live in the application's own access logs. Single-source approaches miss the question's core — the firewall does not see local process activity, EDR does not see DC authentication context as well as AD logs, and human memory is not a log source.",
      messerVideo: "4.9 - Log Data",
      subObjective: "4.9",
    },
  },
  {
    videoId: "4.9.1",
    kind: "scenario",
    item: {
      q: "A SIEM is ingesting authentication events from three sources: Active Directory (Windows event format with field 'EventID' and 'TargetUserName'), Linux PAM (syslog-format text 'sshd[12345]: Accepted publickey for alice from 1.2.3.4'), and Okta (JSON with field 'eventType' and 'actor.alternateId'). The SIEM cannot correlate 'failed login by Alice across AD + Linux + Okta in 5 minutes' until normalization is in place. The MOST appropriate normalization approach is:",
      opts: [
        "Map each source's authentication-event fields into a COMMON schema (e.g. ECS fields like user.name, event.action, source.ip), so a single correlation rule can match across all three sources by the same canonical field names",
        "Write three separate correlation rules — one per source format — and try to combine the alerts manually after the fact when an analyst notices the pattern",
        "Drop two of the three sources and only keep the one that the SIEM ingests natively without parsing, accepting reduced visibility as the cost",
        "Discard all authentication events at ingest because authentication events are too high-volume to correlate effectively across many sources",
      ],
      a: 0,
      exp: "SIEM normalization is the practice of mapping source-specific fields into a common schema. Common schemas exist in multiple flavors — ECS (Elastic Common Schema), CIM (Splunk Common Information Model), and OCSF (Open Cybersecurity Schema Framework) are three widely-used examples — but the principle is the same: map source-specific fields into canonical names (user.name, event.action, source.ip, event.outcome) so cross-source correlation works. Once normalized, a single correlation rule can match the same conceptual event across all sources regardless of native format. Per-source rules cannot easily express cross-source patterns like 'same user fails login on AD AND Linux AND Okta within 5 minutes.' Dropping sources creates blind spots. Discarding auth events eliminates one of the most important security signals.",
      messerVideo: "4.9 - Log Data",
      subObjective: "4.9",
    },
  },
  {
    videoId: "4.9.1",
    kind: "scenario",
    item: {
      q: "A company is designing a log retention policy. They need to satisfy three different requirements: (1) operational use — recent logs must be searchable from the SIEM for active investigations; (2) compliance — certain logs must be retained for 7 years per industry regulation; (3) legal hold — when litigation is active, logs related to the matter must be retained until the matter resolves regardless of normal retention rules. Which retention design is MOST appropriate?",
      opts: [
        "Three-tier design: operational retention (30-90 days, full SIEM searchable, supports active investigation); compliance retention (1-7 years per regulation, archived to lower-cost cold storage, supports audits and breach investigation); legal hold (indefinite, applies to specific subjects under litigation, overrides normal retention deletion)",
        "Single retention period of 30 days for everything — short retention reduces storage cost and breach exposure across the board",
        "Single retention period of 7 years for everything — the longest applicable requirement applied uniformly is operationally simplest to implement",
        "No retention policy — the SIEM auto-deletes old logs and the legal team handles legal holds informally if a matter arises requiring it",
      ],
      a: 0,
      exp: "The three-tier model maps each requirement to an appropriate storage and retention strategy. Operational retention (30-90 days) keeps recent logs in the SIEM where they are fully searchable for active investigation. Compliance retention (1-7 years per regulation) keeps required logs in cheaper cold/archive storage where they can be retrieved on audit/breach demand without inflating SIEM cost. Legal hold is an OVERRIDE: when litigation is active, logs related to the matter are retained indefinitely until the matter resolves, regardless of normal retention. Single-period designs are either too short for compliance or too expensive for operational. No-policy designs create both compliance and legal-spoliation risk.",
      messerVideo: "4.9 - Log Data",
      subObjective: "4.9",
    },
  },
];

// ─── Apply ─────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const videoById = new Map();
for (const sec of data) {
  for (const v of sec.videos) videoById.set(v.id, v);
}

let inserted = 0, skipped = 0, replaced = 0;
let mcAdded = 0, scenAdded = 0;

// REPLACEMENTS pass first.
for (const r of REPLACEMENTS) {
  const video = videoById.get(r.videoId);
  if (!video) {
    console.error(`ERROR: video ${r.videoId} not found for replacement`);
    process.exit(1);
  }
  const arrName = r.kind === "mc" ? "questions" : "scenarios";
  const arr = video[arrName] || [];
  const cur = arr[r.index];
  if (!cur) {
    console.error(`ERROR: ${r.videoId} ${r.kind}[${r.index}] does not exist for replacement`);
    process.exit(1);
  }
  const newStemHead = r.item.q.slice(0, 60);
  if (typeof cur.q === "string" && cur.q.startsWith(newStemHead)) {
    console.log(`skip   replacement ${r.videoId} ${r.kind}[${r.index}]: already replaced`);
    skipped++;
    continue;
  }
  if (typeof cur.q !== "string" || !cur.q.startsWith(r.expectedOldStemPrefix)) {
    console.error(`ERROR: ${r.videoId} ${r.kind}[${r.index}] has unexpected stem; refusing to replace.`);
    console.error(`  expected: "${r.expectedOldStemPrefix}..."`);
    console.error(`  found:    "${(cur.q || "").slice(0, 80)}..."`);
    process.exit(1);
  }
  arr[r.index] = r.item;
  console.log(`replace ${r.videoId} ${r.kind}[${r.index}]: NTP-duplicate → "${newStemHead}..."`);
  replaced++;
}

// INSERTIONS pass.
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
  inserted++;
  if (kind === "mc") mcAdded++; else scenAdded++;
}

console.log(`\n${replaced} replaced (in-place), ${inserted} appended (${mcAdded} MC + ${scenAdded} scen), ${skipped} skipped.`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${jsonPath}`);
} else if (preview) {
  writeFileSync(previewPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote preview ${previewPath} — run validator with --path=${previewPath}`);
} else {
  console.log("(dry run — pass --write to persist, or --preview for validator preview)");
}
