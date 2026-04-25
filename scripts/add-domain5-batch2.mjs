// One-shot applier: append 21 Domain 5 Batch 2 items (17 MCs + 4 scenarios)
// across §5.3 (Third-party Risk) and §5.4 (Security Compliance).
// Idempotent: detects already-inserted items by stem prefix and skips.
//
// Usage:
//   node scripts/add-domain5-batch2.mjs           # dry-run, prints diff summary
//   node scripts/add-domain5-batch2.mjs --write   # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const write = process.argv.includes("--write");

const INSERTIONS = [
  // ─── §5.3.1 Third-party Risk Assessment (4 MC + 1 scenario) ───
  {
    videoId: "5.3.1",
    kind: "mc",
    item: {
      q: "A risk team is assessing a new cloud-based SaaS payroll vendor. They want a questionnaire whose questions are mapped specifically to cloud security controls (e.g. shared responsibility, data residency, multi-tenancy). Which questionnaire is BEST for this purpose?",
      opts: [
        "SIG (Shared Assessments) — a broad, cross-industry vendor security questionnaire",
        "CAIQ (Cloud Security Alliance) — questions mapped to the Cloud Controls Matrix and scoped to cloud concerns",
        "SOC 2 Type II report — provided by the vendor's auditor in lieu of a questionnaire",
        "PCI DSS Self-Assessment Questionnaire (SAQ) — published by the PCI Council",
      ],
      a: 1,
      exp: "CAIQ (Consensus Assessments Initiative Questionnaire) is published by the Cloud Security Alliance and is mapped one-to-one to the Cloud Controls Matrix, making it the right tool for cloud-specific risk questions. SIG is comprehensive and cross-industry, useful when you don't know yet whether the vendor is cloud-only — but less precise for cloud-specific issues. A SOC 2 report is auditor-attested evidence, not a questionnaire the vendor fills in. PCI DSS SAQ is for cardholder-data scope only.",
      messerVideo: "5.3 - Third-party Risk Assessment",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.1",
    kind: "mc",
    item: {
      q: "A risk team needs to determine whether a vendor's security controls have been operating effectively over the past year. Which artifact is the MOST appropriate evidence?",
      opts: [
        "ISO 27001 certificate — confirms the vendor maintains an information security management system aligned to the standard's scope",
        "SOC 2 Type II report — describes whether controls were designed AND operating effectively over a period (typically 6 to 12 months)",
        "SOC 2 Type I report — confirms control design at a single point in time, without testing operating effectiveness",
        "Vendor penetration test summary — findings against a representative sample of systems, not control effectiveness",
      ],
      a: 1,
      exp: "SOC 2 Type II covers the operating effectiveness of controls over a time window (commonly 6 to 12 months), which directly answers the question. ISO 27001 certifies that an ISMS exists and meets the standard's scope but is point-in-time-ish (with annual surveillance audits) and does not directly attest to control operating effectiveness. SOC 2 Type I only addresses control design at a single moment. A pen test reports on specific findings, not on whether the broader control set operated effectively across time.",
      messerVideo: "5.3 - Third-party Risk Assessment",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.1",
    kind: "mc",
    item: {
      q: "A company wants to perform their own penetration test against a SaaS vendor's production application. Which of the following is the MOST important consideration?",
      opts: [
        "Whether the vendor's contract includes a right-to-test clause and any required notification, scope, and rules of engagement",
        "Whether the vendor will accept the company's preferred testing tools without restriction",
        "Whether the company can run the test entirely without notifying the vendor in advance, to keep results unbiased",
        "Whether the test will be cheaper than reviewing the vendor's existing SOC 2 report",
      ],
      a: 0,
      exp: "Penetration testing a third party's production system without explicit contractual permission can violate cloud-provider acceptable-use policies, vendor contracts, and computer-misuse laws. A right-to-test clause defines whether testing is allowed at all, what notification is required, and what scope and rules apply (including blackout windows and cloud-provider notifications). Tool-choice and cost questions are downstream of the legal authorization; covert testing of a third party is rarely defensible.",
      messerVideo: "5.3 - Third-party Risk Assessment",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.1",
    kind: "mc",
    item: {
      q: "A vendor announces that the product the company depends on will reach end-of-service in 18 months and will no longer receive security patches after that date. From a third-party risk perspective, the MOST important step for the company is to:",
      opts: [
        "Add the impending end-of-service to the third-party risk register and begin a transition or compensating-control plan now",
        "Ignore the announcement until the actual end-of-service date arrives, since security patches are still being issued",
        "Immediately terminate the contract to avoid being on an unsupported product before the date arrives",
        "Ask the vendor for a discount in exchange for the inconvenience and disruption to the company's roadmap",
      ],
      a: 0,
      exp: "End-of-service means the loss of security patches, support, and often the ability to remediate vulnerabilities. The risk team should record the future state in the risk register now and begin planning the transition or, if a transition is impossible, the compensating controls (segmentation, monitoring, hardening) that will reduce exposure during and after the unsupported period. Ignoring it is exactly what the announcement is designed to prevent. Immediate termination may not be feasible. Discount-seeking is a procurement matter, not a risk treatment.",
      messerVideo: "5.3 - Third-party Risk Assessment",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.1",
    kind: "scenario",
    item: {
      q: "A healthcare company is contracting with a new cloud-based EHR (electronic health record) vendor that will store PHI. The risk team needs to gather assurance that the vendor's security controls are appropriate for HIPAA-covered data and have been operating effectively over time. Which combination of artifacts BEST satisfies this requirement?",
      opts: [
        "A SOC 2 Type II report covering security and confidentiality, plus a HIPAA Business Associate Agreement",
        "An ISO 9001 quality management certificate plus a vendor questionnaire response",
        "A vendor self-attestation letter plus the vendor's marketing security white paper",
        "A SOC 1 report focused on financial reporting controls plus the vendor's privacy policy",
      ],
      a: 0,
      exp: "SOC 2 Type II provides time-window evidence of operating effectiveness for the security and confidentiality trust services criteria — directly relevant to PHI handling. The HIPAA Business Associate Agreement establishes legal obligations and breach-notification responsibilities required when a third party handles PHI. ISO 9001 is a quality management standard, not security; vendor attestations and marketing materials are not independent assurance; SOC 1 covers financial reporting controls (think SOX), not the security and confidentiality criteria relevant here.",
      messerVideo: "5.3 - Third-party Risk Assessment",
      subObjective: "5.3",
    },
  },

  // ─── §5.3.2 Agreement Types (5 MC + 1 scenario) ───
  {
    videoId: "5.3.2",
    kind: "mc",
    item: {
      q: "A company needs documents for three relationships: (1) a vendor that must meet measurable uptime and remediation obligations, (2) a high-level statement of intent with another company exploring a future partnership but not yet bound, (3) a formal joint-operations arrangement between two government agencies with binding commitments. The MOST appropriate document type for each, in order, is:",
      opts: [
        "(1) SLA, (2) MOU, (3) MOA",
        "(1) MOU, (2) SLA, (3) MOA",
        "(1) SLA, (2) MOA, (3) MOU",
        "(1) MOA, (2) SLA, (3) MOU",
      ],
      a: 0,
      exp: "An SLA (Service Level Agreement) defines measurable performance obligations and remediation when the vendor misses targets — fitting (1). An MOU (Memorandum of Understanding) is a high-level, generally non-binding statement of intent — fitting (2). An MOA (Memorandum of Agreement) is more formal than an MOU and includes binding commitments, often used for joint operational arrangements between government agencies — fitting (3). The classic exam confusable is MOU versus MOA on the formal/binding axis: MOU expresses intent, MOA imposes obligations.",
      messerVideo: "5.3 - Agreement Types",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.2",
    kind: "mc",
    item: {
      q: "A Business Partnership Agreement (BPA) is BEST described as:",
      opts: [
        "A document establishing terms for an ongoing business relationship between two partners (roles, profit-sharing, disputes, termination)",
        "A general framework establishing the legal terms applying to ALL future Statements of Work between two parties, regardless of the project",
        "A document defining measurable service-level performance targets, reporting cadences, and remediation for missing them",
        "A document used between two government agencies to formalize a joint operational arrangement with binding commitments",
      ],
      a: 0,
      exp: "A BPA establishes the terms governing an ongoing relationship between two specific partners — covering how the partnership operates, how each side's responsibilities and rewards are defined, and how the partnership ends. Option 2 describes an MSA (Master Service Agreement). Option 3 describes an SLA. Option 4 describes an MOA. The BPA-versus-MSA distinction is the most exam-tested confusable: BPA is partner-specific, MSA is a future-work framework that may apply across many engagements.",
      messerVideo: "5.3 - Agreement Types",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.2",
    kind: "mc",
    item: {
      q: "A company has agreed to share threat intelligence data with a state-government agency. Both parties want a written document that imposes binding obligations on each side and is enforceable if disputes arise. Which document type is MOST appropriate?",
      opts: [
        "An MOU (Memorandum of Understanding) — typically non-binding, used to express intent and explore future cooperation",
        "An MOA (Memorandum of Agreement) — more formal than an MOU and may impose specific binding obligations",
        "A general partnership letter signed by senior staff without formal legal review or enforceable clauses",
        "A handshake agreement followed by a public press release announcing the partnership",
      ],
      a: 1,
      exp: "An MOA is more formal than an MOU and is the appropriate choice when both parties want enforceable, binding commitments — common between government and private organizations, or between two agencies. An MOU is generally a non-binding statement of intent and would not give either side a clear remedy if obligations aren't met. The other two options have no enforceability and would be unsuitable for a sensitive intel-sharing relationship. The MOA-versus-MOU distinction is one of the most-tested confusables in this domain.",
      messerVideo: "5.3 - Agreement Types",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.2",
    kind: "mc",
    item: {
      q: "Which of the following is the MOST accurate description of how a typical commercial NDA (Non-Disclosure Agreement) operates?",
      opts: [
        "Obligations end immediately when the employment or engagement relationship is terminated",
        "Obligations may continue for a defined period (often years) after employment or engagement ends",
        "Applies only to verbal disclosures, never to written documents or electronic communications",
        "Required only between business competitors and never between an employer and its employees",
      ],
      a: 1,
      exp: "NDAs almost always include a 'survival' clause that keeps the confidentiality obligation in force after the contractual relationship ends — typically two to five years for commercial NDAs and indefinitely for trade secrets. Limiting protection to active employment would defeat the purpose. NDAs cover any form of disclosure (verbal, written, electronic). And NDAs are routinely used between employer and employee, not just between competitors.",
      messerVideo: "5.3 - Agreement Types",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.2",
    kind: "mc",
    item: {
      q: "An SLA that defines uptime targets but contains no specific, measurable security commitments or remediation clauses for security incidents is BEST described as:",
      opts: [
        "Aspirational — it implies an intent to provide secure service but does not bind the vendor on any specific security behavior",
        "Binding-but-vague — the security obligations exist but cannot be tested against measurable thresholds",
        "Fully enforceable — uptime IS a security control, so the SLA implicitly covers security as well",
        "Sufficient — a SOC 2 Type II report from the vendor compensates for gaps in the SLA wording",
      ],
      a: 0,
      exp: "When an SLA contains no specific, measurable security commitments and no remediation for security incidents, the security side is aspirational — the contract may imply security as an expectation but provides no enforceable bar against the vendor. 'Binding-but-vague' would apply if a security clause existed but lacked measurable thresholds. Treating uptime as a security control covers only one narrow attribute (availability) and ignores confidentiality and integrity. A separate SOC 2 report is useful but does not substitute for contract language defining what counts as a breach of obligation.",
      messerVideo: "5.3 - Agreement Types",
      subObjective: "5.3",
    },
  },
  {
    videoId: "5.3.2",
    kind: "scenario",
    item: {
      q: "A company plans to use a consulting firm for a series of unrelated security projects over the next five years (penetration tests, IR retainers, compliance audits, training). Each engagement will have its own scope, deliverables, and price. The legal team wants to put a single overarching document in place once, with individual project paperwork on top. Which combination of agreement types is BEST?",
      opts: [
        "An MSA (Master Service Agreement) for the overarching terms, with individual SOWs (Statements of Work) per engagement",
        "A BPA (Business Partnership Agreement) for the overarching terms, with separate SLAs per engagement",
        "A separate MSA per engagement, since each is a different project",
        "A single SLA that covers all five years and any future engagements",
      ],
      a: 0,
      exp: "An MSA establishes the legal framework — liability, IP, confidentiality, payment terms — that applies to ALL future Statements of Work between two parties. Individual SOWs then define the scope, deliverables, and price for each engagement. This is exactly the multi-engagement consulting pattern. A BPA is for an ongoing partnership rather than a vendor-customer relationship; per-engagement MSAs duplicate the legal framework unnecessarily; an SLA defines performance commitments, not legal terms — a single SLA cannot substitute for an MSA.",
      messerVideo: "5.3 - Agreement Types",
      subObjective: "5.3",
    },
  },

  // ─── §5.4.1 Compliance (4 MC + 1 scenario) ───
  {
    videoId: "5.4.1",
    kind: "mc",
    item: {
      q: "A security manager finds that a critical control (encryption of database backups) has been disabled for the past quarter. Per a typical internal compliance reporting structure, the manager should FIRST escalate this finding to:",
      opts: [
        "The audit committee of the board, before any internal review or assessment of the issue",
        "Their direct manager and the compliance/risk function, who decide whether further escalation is needed",
        "External regulators, since the control failure could constitute non-compliance",
        "The general counsel, to assess litigation exposure before any internal communication",
      ],
      a: 1,
      exp: "Internal compliance reporting follows a chain — line management and the compliance/risk function are the first stop because they own the control and the response. They will assess severity, determine whether the audit committee or board needs to be informed, and decide on regulator notification if required. Going directly to the board, regulators, or counsel skips internal triage and may violate the company's incident response or compliance reporting policy.",
      messerVideo: "5.4 - Compliance",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.1",
    kind: "mc",
    item: {
      q: "A US-based healthcare provider experiences a data breach affecting 2,000 patients. Under HIPAA breach-notification rules, which external party MUST be notified, and roughly when?",
      opts: [
        "Affected patients, the Secretary of HHS, and prominent media outlets when applicable — within 60 days of discovery",
        "Only the affected patients, within 24 hours, with no obligation to notify federal or state regulators",
        "Only the state attorney general, within 30 days, since HIPAA enforcement is delegated to states",
        "No notification is required as long as the breach has been contained and remediated internally",
      ],
      a: 0,
      exp: "HIPAA's Breach Notification Rule requires notification of affected individuals and the HHS Secretary within 60 days of discovery. Prominent media notification is additionally required when 500 or more individuals are affected in a single state. Patient-only notification is incomplete; AG-only is wrong (federal HHS is required); 'no notification' contradicts the rule entirely. This is the kind of question students get wrong by recognizing pieces of the rule but not the full set of recipients.",
      messerVideo: "5.4 - Compliance",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.1",
    kind: "mc",
    item: {
      q: "Beyond financial fines, the consequences of a serious compliance failure for a regulated company can include all of the following EXCEPT:",
      opts: [
        "Loss of operating license or industry certification (e.g. PCI DSS Level 1 status)",
        "Reputational damage and lost customer trust, including media coverage and review-site fallout",
        "Contract termination by enterprise customers whose own compliance depends on the vendor",
        "Automatic forgiveness of the underlying control failures by the relevant regulators",
      ],
      a: 3,
      exp: "Real consequences beyond fines include loss of license or certification (no longer authorized to process card data, hold patient data, etc.), reputational fallout that hurts customer acquisition and retention, and contract termination by enterprise customers who cannot risk a non-compliant vendor in their own audit chain. Regulators do NOT automatically forgive control failures — that distractor flips the relationship between compliance and consequence and is the only one that is not a real consequence of non-compliance.",
      messerVideo: "5.4 - Compliance",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.1",
    kind: "mc",
    item: {
      q: "A vendor provides their company's risk team with a SOC 2 Type II report. The MOST accurate description of what this report represents is:",
      opts: [
        "A full audit in which the auditor issues an opinion based on independent testing of the entire control environment",
        "An attestation in which the auditor opines on the design and operating effectiveness of controls against specified trust services criteria",
        "A self-assessment performed internally by the vendor against a published standard, with no third-party involvement",
        "A regulatory inspection report issued by a government agency that supervises the vendor's industry",
      ],
      a: 1,
      exp: "SOC 2 is technically an attestation engagement under AICPA standards, not an audit. The CPA firm provides an opinion on management's assertions about the design and operating effectiveness of controls that meet the chosen trust services criteria (security, availability, processing integrity, confidentiality, privacy). A full audit (e.g. a financial statement audit) is broader and goes deeper. A SOC 2 is not a self-assessment (it requires an independent CPA), nor a regulatory inspection (no government agency issues SOC reports).",
      messerVideo: "5.4 - Compliance",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.1",
    kind: "scenario",
    item: {
      q: "A retail company's quarterly internal control review finds that user access reviews — required by their internal policy and SOX framework — were not completed for the previous quarter on the company's financial reporting system. The compliance manager must escalate. Which sequence of communications is MOST appropriate?",
      opts: [
        "Inform the system owner, then the compliance and internal audit functions, who decide whether to disclose to the audit committee and external auditor",
        "Disclose the failure publicly via a press release and SEC filing the same day to demonstrate transparency",
        "Wait until the next external audit cycle and let the external auditors flag the control gap themselves",
        "Notify the company's customers and shareholders of the control gap before any internal escalation has occurred",
      ],
      a: 0,
      exp: "Internal compliance reporting starts with the system owner who can confirm facts and remediation status, escalates to compliance/risk and internal audit (who own the response process), and culminates in audit committee and external auditor disclosure if material. Public disclosure or SEC notification without internal review is premature. Waiting for the external auditor risks worse findings and possibly material weakness reporting. Customer or shareholder notification is far downstream of internal review.",
      messerVideo: "5.4 - Compliance",
      subObjective: "5.4",
    },
  },

  // ─── §5.4.2 Privacy (4 MC + 1 scenario) ───
  {
    videoId: "5.4.2",
    kind: "mc",
    item: {
      q: "A company appoints a Data Protection Officer (DPO) under GDPR. The DPO's PRIMARY statutory responsibility is to:",
      opts: [
        "Sign off on every customer-facing privacy notice and consent banner before any can be published",
        "Inform and advise the company on its GDPR obligations, monitor compliance, and serve as the contact point for the supervisory authority",
        "Personally approve every cross-border data transfer the company makes outside the EU",
        "Take legal liability for any GDPR violation by the company on behalf of the data controller",
      ],
      a: 1,
      exp: "GDPR Article 39 sets the DPO's tasks: informing and advising the controller (or processor) and its employees of their GDPR obligations, monitoring compliance, advising on data protection impact assessments, cooperating with the supervisory authority, and acting as the contact point for the authority and data subjects. The DPO does not approve every notice or transfer (those are controller decisions), and the DPO is not personally liable for the controller's violations.",
      messerVideo: "5.4 - Privacy",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.2",
    kind: "mc",
    item: {
      q: "Under GDPR Article 37, which of the following companies is MOST clearly required to appoint a Data Protection Officer (DPO)?",
      opts: [
        "A small e-commerce company selling handmade goods to EU consumers, processing a few hundred orders per month",
        "A digital advertising platform whose core activity is large-scale, regular and systematic monitoring of EU data subjects' browsing behavior",
        "A US-based company with no EU customers, no EU employees, and no operations within the European Union",
        "A two-person law firm that occasionally takes on EU clients for unrelated commercial litigation",
      ],
      a: 1,
      exp: "GDPR Article 37 requires a DPO when (a) the controller is a public authority, (b) the core activities of the controller require regular and systematic monitoring of data subjects on a large scale, or (c) the core activities consist of large-scale processing of special-category data or data on criminal convictions. Large-scale, regular and systematic monitoring is exactly what a digital advertising platform does. A small e-commerce company processes routine orders below the threshold; a US company with no EU presence has no GDPR scope; a two-person law firm occasionally taking EU clients is neither large-scale nor systematic monitoring.",
      messerVideo: "5.4 - Privacy",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.2",
    kind: "mc",
    item: {
      q: "An EU customer of a streaming service sends a written request asking to receive their personal data in a structured, commonly used, machine-readable format AND to have the service transmit it directly to a competing streaming service of their choice. This request invokes:",
      opts: [
        "The right of access (GDPR Article 15)",
        "The right to data portability (GDPR Article 20)",
        "The right to rectification (GDPR Article 16)",
        "The right to object (GDPR Article 21)",
      ],
      a: 1,
      exp: "Article 20 — right to data portability — gives data subjects the right to receive their personal data in a structured, commonly used and machine-readable format AND to transmit it to another controller. The right of access (Article 15) is about getting the data in a readable form (often a PDF or summary), but does not extend to machine-readable transmission to a third party. Rectification corrects errors; objection stops processing. Portability also has a narrower scope — it only applies when processing is based on consent or contract, not legal obligation.",
      messerVideo: "5.4 - Privacy",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.2",
    kind: "mc",
    item: {
      q: "A US-based SaaS company is updating its privacy program. They serve customers worldwide. Which statement BEST captures the difference in scope between GDPR and CCPA (CPRA) for this company?",
      opts: [
        "GDPR applies based on where the data subject is (EU residents), regardless of controller location; CCPA applies to qualifying for-profit businesses processing California residents' personal data",
        "Both apply to any company worldwide whose website is accessible from the EU or California, regardless of any other criterion or threshold",
        "GDPR applies only to companies physically headquartered in the EU; CCPA applies only to companies physically located in California",
        "Both laws are functionally identical in scope, definitions, and applicable thresholds — meeting one automatically means meeting the other",
      ],
      a: 0,
      exp: "GDPR has extra-territorial scope: it applies to controllers and processors handling EU residents' personal data regardless of the controller's location (Article 3). CCPA / CPRA applies to for-profit businesses that meet specific thresholds (revenue, data volume, or share of revenue from selling personal information) and that process California residents' personal information. Geographic-presence-only readings of either law are wrong; equating their scope is also wrong because thresholds, definitions of 'personal information', and rights granted differ.",
      messerVideo: "5.4 - Privacy",
      subObjective: "5.4",
    },
  },
  {
    videoId: "5.4.2",
    kind: "scenario",
    item: {
      q: "An EU customer of a streaming service sends a single written request asking the service to (1) provide a copy of all personal data the service holds about them in a machine-readable format AND (2) afterwards delete all the data. The processing is based on the customer's contract with the service. The privacy team receives the request. Which combination of rights is being invoked, and which is the MOST important constraint to keep in mind?",
      opts: [
        "Right to portability (Article 20) and right to erasure (Article 17). Erasure has exceptions (legal obligations, public interest, legal-claims defense), so verify these before deleting",
        "Right of access (Article 15) and right to rectification (Article 16). The team should provide the data and correct any errors the customer points out, but is not obligated to delete it",
        "Only the right of access (Article 15). 'Delete' requests are not recognized under GDPR and can be safely ignored by the controller",
        "Only the right to erasure (Article 17). The portability portion can be safely ignored because the deletion request supersedes any need to provide a copy",
      ],
      a: 0,
      exp: "The two requests map to portability (Article 20 — machine-readable format and onward transmission rights, available because processing is based on contract) and erasure (Article 17 — the right to be forgotten). However, erasure has explicit exceptions in Article 17(3) — including compliance with legal obligations, archiving in the public interest, and exercise or defense of legal claims — so the team must check whether any apply before deleting. Mistakes here include treating access as portability, ignoring deletion entirely (the right is recognized), or ignoring the portability piece (the customer is entitled to a machine-readable copy before deletion).",
      messerVideo: "5.4 - Privacy",
      subObjective: "5.4",
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
