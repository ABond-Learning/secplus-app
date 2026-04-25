// One-shot applier: append 20 Domain 5 Batch 3 items (12 MCs + 8 scenarios)
// across §5.5 (Audits and Assessments) and §5.6 (Security Awareness).
// Idempotent: detects already-inserted items by stem prefix and skips.
//
// Usage:
//   node scripts/add-domain5-batch3.mjs           # dry-run, prints diff summary
//   node scripts/add-domain5-batch3.mjs --write   # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const write = process.argv.includes("--write");

const INSERTIONS = [
  // ─── §5.5.1 Audits and Assessments (3 MC + 2 scenarios) ───
  {
    videoId: "5.5.1",
    kind: "mc",
    item: {
      q: "A company's CFO needs to confirm to the board that a recent SOX-relevant control change is operating as intended before the next external auditor visit. The CFO wants timely, internal-policy-aligned assurance. Which type of audit is MOST appropriate?",
      opts: [
        "An internal audit by the company's own audit function — independent of the operations being audited, focused on internal-policy alignment",
        "An external audit by the company's financial-statement auditor — to provide an independent third-party opinion before the next regulator filing",
        "A compliance attestation by an outside CPA firm specifically scoped to SOX section 404 — to satisfy regulator requirements directly",
        "A regulatory inspection by the SEC — to obtain authoritative pre-clearance of the control change before the external audit",
      ],
      a: 0,
      exp: "An internal audit gives the CFO timely, in-house assurance against the company's own policies, while remaining independent of the operations being audited (internal auditors typically report to the audit committee). External audits and SOX 404 attestations are scoped for regulator-facing assurance and are typically not pre-stage gates. SEC inspections are not a service the regulator provides on demand. The 'internal-policy alignment, before the external auditor visits' clue maps cleanly to internal audit.",
      messerVideo: "5.5 - Audits and Assessments",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.1",
    kind: "mc",
    item: {
      q: "A bank is launching a new mobile banking app. Senior leadership wants to find security bugs in the pre-release build with researchers who are vetted and bound by a non-disclosure agreement. Which bug bounty model is MOST appropriate?",
      opts: [
        "Public bug bounty — open to any researcher who registers, with the broadest possible coverage",
        "Private bug bounty — invitation-only, with vetted researchers who agree to confidentiality terms before testing",
        "No bug bounty — only contracted penetration tests are appropriate for any pre-release financial product",
        "Open-source disclosure — publish the code so the community can review without any program structure",
      ],
      a: 1,
      exp: "A private bug bounty restricts participation to invited researchers who have been vetted and have agreed to NDAs and program rules — appropriate for a sensitive pre-release product where the company wants targeted skill but not public exposure. A public bounty would broaden coverage but expose the unreleased product. Pen tests are useful but the question specifically asks about a bounty model. Open-source disclosure is a different program model and inappropriate for a closed-source banking product.",
      messerVideo: "5.5 - Audits and Assessments",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.1",
    kind: "mc",
    item: {
      q: "A company wants continuous, paid-on-discovery security testing of its customer-facing web applications throughout the year. Which assessment model is BEST suited to this requirement?",
      opts: [
        "A contracted penetration test — a time-boxed, methodology-driven engagement with pre-defined scope and price",
        "A bug bounty program — pays researchers per valid finding, providing continuous coverage by many testers",
        "An internal audit — performed by the company's own audit function on a periodic schedule each year",
        "A SOC 2 Type II attestation — gives a year-long view of control operating effectiveness for the chosen criteria",
      ],
      a: 1,
      exp: "Bug bounty programs are paid-on-discovery and continuous: many researchers can probe at any time, finding bugs as the application changes. Contracted pen tests are time-boxed and structured — best when the company needs a deep, methodical look (e.g. before a regulator audit), not continuous coverage. Internal audits are periodic and policy-focused, not discovery-driven. SOC 2 Type II is an attestation about control effectiveness, not vulnerability discovery.",
      messerVideo: "5.5 - Audits and Assessments",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.1",
    kind: "scenario",
    item: {
      q: "A SaaS company processes credit card data and stores PHI for several healthcare customers. The compliance team must produce: (1) a regulator-facing report of PCI DSS compliance, (2) third-party assurance for healthcare customers about ongoing security control effectiveness, and (3) internal verification that newly-rolled-out controls actually work. Which combination is MOST appropriate?",
      opts: [
        "(1) PCI DSS Report on Compliance from a QSA, (2) SOC 2 Type II covering security and confidentiality, (3) internal audit",
        "(1) SOC 2 Type I covering security only, (2) internal audit by the company's audit function, (3) PCI DSS self-assessment questionnaire",
        "(1) Internal audit by the company's own audit function, (2) ISO 9001 quality management certificate, (3) external SOC 1 audit",
        "(1) Bug bounty program findings report, (2) HIPAA self-attestation letter from the vendor, (3) marketing white paper on security",
      ],
      a: 0,
      exp: "Each output maps to a different assurance need. A PCI DSS Report on Compliance from a Qualified Security Assessor (QSA) is the regulator-facing artifact for PCI Level 1. A SOC 2 Type II covers operating effectiveness over time and is what enterprise healthcare customers expect for ongoing assurance. An internal audit gives timely in-house verification of newly-deployed controls before external audit cycles. The other options swap artifacts for purposes they don't serve.",
      messerVideo: "5.5 - Audits and Assessments",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.1",
    kind: "scenario",
    item: {
      q: "A researcher participating in a company's public bug bounty program reports a critical SQL injection vulnerability — but in their report, they note they accessed the company's production database for 4 hours and downloaded 50,000 customer records to 'prove the impact.' The scope rules clearly state that researchers must NOT exfiltrate data and must stop testing once they confirm the vulnerability. What is the BEST response from the bug bounty program owner?",
      opts: [
        "Pay the bounty in full and thank the researcher — the vulnerability was real and impact was demonstrated convincingly",
        "Refuse the bounty and trigger incident response — the researcher's actions exceeded program scope and constitute unauthorized data exfiltration",
        "Pay the bounty at a reduced rate and quietly remove the researcher from the program — no need to involve incident response",
        "Refer the researcher to law enforcement immediately, with no further internal communication or impact analysis",
      ],
      a: 1,
      exp: "Bug bounty programs depend on clearly bounded rules of engagement; a researcher who exfiltrates 50,000 customer records has exceeded program scope, regardless of the underlying bug being real. The program owner should refuse payment under the violated terms, trigger incident response (the data is now in unauthorized hands), and then determine appropriate follow-up. Paying the bounty rewards out-of-scope behavior. Quiet removal misses the data-exposure incident. Immediate law enforcement referral skips the internal analysis needed to assess the actual harm.",
      messerVideo: "5.5 - Audits and Assessments",
      subObjective: "5.5",
    },
  },

  // ─── §5.5.2 Penetration Tests (3 MC + 2 scenarios) ───
  {
    videoId: "5.5.2",
    kind: "mc",
    item: {
      q: "A company has just deployed a critical patch to a public-facing application. Leadership wants to verify that an unprivileged remote attacker — with no internal information — would be unable to exploit the underlying vulnerability or the patch itself. Which penetration test approach is MOST appropriate?",
      opts: [
        "White-box testing — the tester is given full source code, architecture diagrams, and credentials for realistic deep coverage",
        "Black-box testing — the tester is given no internal information and operates as an external attacker would",
        "Grey-box testing — the tester is given partial information (e.g. user-level credentials or network diagrams) for efficiency",
        "Compliance-driven vulnerability scanning — automated tools only, with no manual testing or chaining of findings",
      ],
      a: 1,
      exp: "The scenario's defining constraint is 'unprivileged remote attacker with no internal information' — black-box testing precisely models this, giving the tester only what an external attacker would discover from the public surface. White-box (full info) and grey-box (partial info) would not realistically model the unprivileged remote scenario. Vulnerability scanning alone misses chained exploits and logic flaws and is not a pen test.",
      messerVideo: "5.5 - Penetration Tests",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.2",
    kind: "mc",
    item: {
      q: "A company wants to assess its detection and response capability against an attacker who has already compromised a corporate workstation and is moving laterally inside the network. Which penetration test approach is MOST appropriate?",
      opts: [
        "External pen test — tester operates from outside the network, simulating a remote attacker with no foothold",
        "Internal pen test — tester operates from inside the network, simulating an insider or post-breach attacker with a foothold",
        "Web application pen test — tester focuses on the OWASP Top 10 against the company's public-facing applications",
        "Wireless pen test — tester focuses on the corporate Wi-Fi authentication and encryption configuration",
      ],
      a: 1,
      exp: "The scenario describes 'already compromised, moving laterally inside the network' — an internal pen test (tester starts inside the network) is the right model because it matches the attacker's position. External pen tests model remote attackers who have not yet established a foothold. Web app and wireless are scope variants that test specific surfaces, not the broader internal-network position the scenario calls for.",
      messerVideo: "5.5 - Penetration Tests",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.2",
    kind: "mc",
    item: {
      q: "A company wants to run an exercise where their offensive testers attempt new attack techniques against the live environment WHILE their detection-and-response team observes, learns, and improves their detection rules in real time — with the two teams openly sharing TTPs and findings during the exercise. Which team structure is MOST appropriate?",
      opts: [
        "Red team only — offensive testers operating in isolation without informing the defenders ahead of time",
        "Blue team only — defenders running tabletop exercises against historical incidents, with no live attacker present",
        "Purple team — red and blue teams collaborating in real time, sharing TTPs so detections improve during the exercise",
        "White team only — exercise observers and judges, with no active attack or defense participation in the exercise",
      ],
      a: 2,
      exp: "Purple team is defined by collaboration: red (offensive) and blue (defensive) actively share techniques and detection findings during the exercise so the blue team can improve detections in real time. Red-team-only typically keeps defenders blind to test detection gaps; blue-team-only has no live attacker; white team is observers and arbiters who facilitate but don't attack or defend. The 'real-time sharing' clue maps cleanly to purple.",
      messerVideo: "5.5 - Penetration Tests",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.2",
    kind: "scenario",
    item: {
      q: "A regulated organization has just rolled out an emergency patch for a critical vulnerability in its public banking portal. Before the next regulator audit, leadership wants assurance that an external attacker with no internal information cannot exploit the underlying flaw or any new flaw the patch may have introduced. The team has 5 days and a fixed budget. Which pen-test type is the BEST fit?",
      opts: [
        "Black-box external pen test against the public banking portal, with the patch as the focus area",
        "White-box internal pen test of the entire corporate network, including the patch's underlying systems",
        "Grey-box assessment with full architecture diagrams, focused on chaining vulnerabilities across multiple systems",
        "Wireless pen test of the corporate Wi-Fi to verify segmentation between guest and core networks",
      ],
      a: 0,
      exp: "The constraints — 'external attacker with no internal information', 'public banking portal', 'patch as focus area', limited time and budget — point to a black-box external test scoped to the patched portal. White-box internal would not match the threat model. Grey-box with full diagrams contradicts the 'no internal information' constraint. A wireless test is unrelated to the patched portal.",
      messerVideo: "5.5 - Penetration Tests",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.2",
    kind: "scenario",
    item: {
      q: "A company wants to improve the speed at which its SOC detects credential-theft attacks. They allocate budget for a multi-week exercise where a contracted offensive team simulates credential-theft TTPs (Kerberoasting, NTLM relay, OAuth abuse) and the SOC investigates each attempt. After each TTP, both teams convene to walk through what the offensive team did, what the SOC saw or missed, and what detection logic should change. Which team-structure label BEST describes this exercise?",
      opts: [
        "Red team — the offensive team operated independently, the SOC reacted, and there was no collaborative debrief",
        "Blue team — the SOC ran the exercise alone, replaying historical credential-theft logs and tuning detections",
        "Purple team — offensive and defensive teams shared TTPs and detection findings, deliberately improving SOC capability through joint walk-throughs",
        "White team — the company observed both teams from outside without participating in attack or defense activities",
      ],
      a: 2,
      exp: "The shared post-TTP debriefs to deliberately improve the SOC's detection capability — with offensive and defensive teams walking through what was attempted, what was seen, and what should change — are the defining features of a purple-team exercise. Red-team-only would not include the shared debriefs; blue-team-only would lack the live offensive component; white team is observers and arbiters, not participants. 'Joint walk-throughs to improve SOC capability' is the clearest purple-team marker.",
      messerVideo: "5.5 - Penetration Tests",
      subObjective: "5.5",
    },
  },

  // ─── §5.6.1 Security Awareness (3 MC + 2 scenarios) ───
  {
    videoId: "5.6.1",
    kind: "mc",
    item: {
      q: "A targeted email lands in the CEO's inbox. It appears to come from the company's external auditor, addresses the CEO by name, references a real audit finding from last year, and asks the CEO to click a link to 'review the new compliance report.' There is no malware in the email — just text and a link to a fake login portal. This is BEST classified as:",
      opts: [
        "Bulk phishing — broad, untargeted attempt that happens to reach the CEO's inbox",
        "Spear phishing — targeted at a specific individual using personal or contextual details",
        "Whaling — a spear-phishing variant specifically aimed at a high-value executive target like a CEO",
        "Smishing — phishing carried out via SMS messaging instead of email",
      ],
      a: 2,
      exp: "Whaling is a subset of spear phishing aimed specifically at executive or high-value targets — here, the CEO is the textbook target. Bulk phishing is non-targeted and would not include personalized context (the auditor reference, the prior-year finding). Spear phishing is also targeted, but whaling is the more precise label when the target is a top executive. Smishing is via SMS, not email.",
      messerVideo: "5.6 - Security Awareness",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.1",
    kind: "mc",
    item: {
      q: "A company's insider-threat program flags this indicator: 'An employee attempts to access HR salary records 47 times in a single day, despite never having needed access before, all between 23:00 and 02:00.' This indicator is BEST classified as:",
      opts: [
        "Behavioral — derived from the employee's stated attitudes or interpersonal interactions",
        "Technical — derived from system logs and access patterns that exceed the user's normal scope",
        "Contextual — derived from changes in the employee's life circumstances or organizational position",
        "Demographic — derived from the employee's tenure, job level, or department",
      ],
      a: 1,
      exp: "Technical indicators come from system logs — repeated unauthorized access attempts at 23:00 to 02:00 against records outside the user's need-to-know are a textbook technical insider-threat signal (off-hours access plus attempted out-of-scope access plus volume anomaly). Behavioral indicators describe stated attitudes (e.g. expressing dissatisfaction in writing). Contextual indicators describe situational factors (impending termination, financial pressure). Demographic factors are generally not used in insider-threat models because they invite bias.",
      messerVideo: "5.6 - Security Awareness",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.1",
    kind: "mc",
    item: {
      q: "An employee suspects their manager is downloading customer data to a personal account but is afraid retaliation could follow if their report is traced back to them. The MOST appropriate reporting channel is:",
      opts: [
        "Email the security team's general inbox — visible to multiple people on the security team",
        "Walk into HR and submit the report verbally with the employee's name attached to the formal record",
        "Use the company's anonymous reporting hotline — accepts anonymous tips and is protected from retaliation by policy",
        "Post the concern on the company's internal social channel so others are aware of the suspicion",
      ],
      a: 2,
      exp: "Anonymous reporting hotlines (often called whistleblower or ethics lines) are designed for exactly this scenario — when an employee has a credible suspicion involving a manager and fears retaliation. They are typically third-party-operated, confidential, and protected by anti-retaliation policy. Emailing the security team would name the reporter; HR with the name attached defeats the anonymity; a public internal channel would broadcast unconfirmed accusations and harm the suspected employee unfairly if wrong.",
      messerVideo: "5.6 - Security Awareness",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.1",
    kind: "scenario",
    item: {
      q: "A user receives the four emails below. Which is MOST likely a phishing attempt based on observable indicators a practiced eye would catch?",
      opts: [
        "From: payroll@company.com — Subject: 'Your payslip for this period is now available in the HR portal'. Body: 'Please log in to https://company.workday.com to view your payslip.' Plain HTML, no attachment, sender domain matches the company's known payroll provider.",
        "From: ceo@coompany.com — Subject: 'Urgent vendor invoice — approve by EOD'. Body: 'I'm in meetings; please process this without copying Finance. Attached: Invoice_Q4.pdf.exe.' Sender domain has a doubled letter; attachment uses a double extension.",
        "From: it-support@company.com — Subject: 'Scheduled maintenance Saturday 02:00 to 04:00'. Body: 'No action required; saving your work before 02:00 is recommended.' Sender domain matches; no links or attachments; signed by IT manager.",
        "From: docusign@docusign.net — Subject: 'You have a document to review and sign'. Body: 'Please click the button to open your envelope.' Sender matches a standard DocuSign sender; the link points to docusign.net.",
      ],
      a: 1,
      exp: "Option 2 has multiple indicators a practiced eye catches: a domain spoofed by character substitution ('coompany' versus 'company'), urgency framing ('EOD'), an explicit request to bypass normal channels ('without copying Finance'), and an attachment with a double extension ('Invoice_Q4.pdf.exe' is an executable). Each indicator alone might be a coincidence; together they are unmistakable. The other three are professional, internally consistent, and contain no anomalies — exactly the legitimate control case that students who 'spot phishing by grammar' get wrong.",
      messerVideo: "5.6 - Security Awareness",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.1",
    kind: "scenario",
    item: {
      q: "A company's insider-threat program correlates data from HR, identity systems, and email DLP. Over the past month for one employee, the program has logged: (1) a recent written performance improvement plan; (2) Slack messages expressing dissatisfaction about being passed over for promotion; (3) an unusual spike in downloads from the customer database to a USB drive over four consecutive late evenings; (4) attempts to access a sales pipeline system the employee has never used. What is the MOST appropriate next action?",
      opts: [
        "Confront the employee directly in a public setting and demand an explanation, before doing further investigation",
        "Brief the security and HR leads, preserve logs and DLP evidence, and prepare a coordinated, low-visibility intervention guided by legal counsel",
        "Take no action — performance issues are common, and an employee venting on Slack is not a security issue",
        "Terminate the employee immediately based on the indicators alone, then begin the investigation afterwards",
      ],
      a: 1,
      exp: "The cluster of indicators (behavioral: PIP, expressed dissatisfaction; technical: USB downloads, attempted out-of-scope access; contextual: pre-departure-like pattern) is a classic insider-threat profile worth taking seriously without overreacting. The right response is a coordinated, evidence-preserving intervention briefed to the relevant leads and counsel — designed to validate the indicators and intervene proportionately. Public confrontation contaminates evidence and can be unfair if the indicators are misread. Doing nothing accepts the risk. Immediate termination without investigation skips the validation needed to act fairly.",
      messerVideo: "5.6 - Security Awareness",
      subObjective: "5.6",
    },
  },

  // ─── §5.6.2 User Training (3 MC + 2 scenarios) ───
  {
    videoId: "5.6.2",
    kind: "mc",
    item: {
      q: "A finance employee receives an email that appears to be from the CEO, references a recent real acquisition, asks for an urgent wire transfer to a new vendor account, and instructs the recipient to bypass the usual two-person approval. The email contains no attachments or links — just text. This is BEST classified as:",
      opts: [
        "A standard malware-laden phishing email — opens a malicious attachment or link payload upon interaction",
        "BEC (Business Email Compromise) — no malware, executive impersonation, urgency framing, and a request to deviate from a standard payment control",
        "Smishing — social engineering carried out via SMS text messages, often with shortened URLs to fake login portals",
        "A legitimate executive request — the email matches the company's normal corporate messaging patterns",
      ],
      a: 1,
      exp: "BEC is defined by exactly the indicators in the scenario: no malware (defeats traditional email security), social engineering of a payments-authorized contact, executive impersonation (CEO), urgency framing, and an instruction to deviate from a standard control (the two-person approval). The 'no attachments or links' detail is the BEC signature — there is nothing for an attachment scanner to catch. Bulk malware phishing has malicious payloads. Smishing uses SMS. The email is not legitimate because of the multiple BEC indicators stacked together.",
      messerVideo: "5.6 - User Training",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.2",
    kind: "mc",
    item: {
      q: "A company's security awareness program recognizes three training types: general (all employees, annual), role-based (department-specific curriculum), and targeted retraining. Which of the following BEST describes a typical trigger for targeted retraining specifically?",
      opts: [
        "Annual hire-anniversary date — ensures every employee gets the same baseline curriculum once per year",
        "Repeated phishing-simulation failures — for example, an employee clicking three simulated phishing emails within a 90-day window",
        "Department reorganization — when an entire team's responsibilities change, role-based training is updated",
        "Regulatory mandate — every employee company-wide must complete a specific course this quarter",
      ],
      a: 1,
      exp: "Targeted retraining is triggered by a specific failure or concern about an individual or small group — repeated phishing-sim failures, a documented policy violation, or post-incident lessons-learned that affect a specific team. Annual anniversary cycles are general training. Department reorgs trigger role-based curriculum updates. Regulatory mandates that apply company-wide are general or role-based, not targeted. The 'repeated specific failures by an individual' framing is the targeted-retraining signature.",
      messerVideo: "5.6 - User Training",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.2",
    kind: "mc",
    item: {
      q: "A security awareness manager wants to measure whether employees recognize phishing attempts in real time. Which metric is the BEST direct measure of this specific outcome?",
      opts: [
        "Annual training completion rate — percentage of employees who finish the mandatory online course",
        "Time-to-report — average time between a phishing simulation landing in inboxes and the first user reporting it",
        "Year-over-year click rate trend — directional change in simulation click rates across multiple cycles",
        "Total number of awareness emails sent — measures the program's raw output volume each year",
      ],
      a: 1,
      exp: "'Recognize phishing attempts in real time' is a real-time recognition outcome — the directly aligned metric is time-to-report (how quickly users flag a suspicious email after it arrives). Completion rate measures whether training was finished, not whether it worked. Year-over-year click trend measures whether the program is improving over time (a different question). Total emails sent measures program output, not employee outcome. This is the classic 'pick the metric that answers the specific question' exam pattern.",
      messerVideo: "5.6 - User Training",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.2",
    kind: "scenario",
    item: {
      q: "A controller in a mid-size company receives an email at 4:30 p.m. on a Friday that appears to be from the CFO. The email references a real M&A deal under negotiation, instructs the controller to wire $2.4M to a new offshore account 'today before close, no exceptions', and asks them to bypass the standard dual-approval workflow because 'the lawyers will be calling Monday'. There are no attachments or links. The controller is uncertain. What is the MOST appropriate immediate action?",
      opts: [
        "Wire the funds immediately to avoid disrupting the M&A deal — confirming via email after the fact is sufficient",
        "Verify the request out-of-band by calling the CFO directly on a known phone number, and escalate to the CISO if the CFO did not send the email",
        "Reply to the email asking the CFO to confirm the request — if the CFO replies yes, the request is legitimate",
        "Forward the email to the IT helpdesk and wait for them to investigate before taking any other action",
      ],
      a: 1,
      exp: "The correct response to a suspected BEC is out-of-band verification — calling the supposed sender on a previously-known phone number, never replying to or trusting the email itself. BEC depends on email channel trust; breaking the channel is the only reliable check. Wiring on Friday close defeats every control by design. Replying inside the same email thread reaches the attacker, not the real CFO. Helpdesk delay leaves the wire decision unmade with the deadline approaching — the controller should escalate to the CISO directly, not wait.",
      messerVideo: "5.6 - User Training",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.2",
    kind: "scenario",
    item: {
      q: "An employee receives an SMS message reading: 'IT-Support: Your VPN credentials expire in 2 hours. Reset now: hxxp://it-support-portal.co/reset?u=jsmith. Failure to reset will lock your account.' The employee has never received IT communication via SMS before and is unsure. Which action is the MOST appropriate?",
      opts: [
        "Click the link from a personal device to reset credentials, since the work laptop may already be locked",
        "Forward the SMS to the phishing-report channel and verify through known IT channels (intranet, ticket system, IT phone) before any action",
        "Reply 'STOP' to the SMS — this will unsubscribe from any future phishing attempts",
        "Restart the work laptop, which will trigger a legitimate password-change prompt if the message is real",
      ],
      a: 1,
      exp: "The text shows multiple smishing indicators: an unfamiliar communication channel for IT (SMS rather than the usual portal), a non-corporate domain, urgency framing ('2 hours'), and a credential-reset action — the classic phishing aim. The right response is to verify through a channel the user knows is legitimate (intranet portal, ticket system, or directly calling IT) and to report the SMS for the security team to track. Clicking through on a personal device still hands credentials to the attacker. STOP replies don't apply to phishing senders (they are not legitimate marketers). Restarting the laptop won't trigger anything related to this attack.",
      messerVideo: "5.6 - User Training",
      subObjective: "5.6",
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
} else {
  console.log("(dry run — pass --write to persist)");
}
