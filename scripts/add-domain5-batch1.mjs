// One-shot applier: append 20 Domain 5 items (14 MCs + 6 scenarios) to
// questions.json across §5.1 (Security Governance) and §5.2 (Risk Management).
// Idempotent: detects already-inserted items by stem prefix and skips.
//
// Usage:
//   node scripts/add-domain5-batch1.mjs           # dry-run, prints diff summary
//   node scripts/add-domain5-batch1.mjs --write   # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const write = process.argv.includes("--write");

// Each entry: { videoId, kind: "mc"|"scenario", item }.
// MCs go to video.questions[]; scenarios to video.scenarios[].
// Both are appended at the end so existing indices (and SM-2 keys) are preserved.
const INSERTIONS = [
  // ─── §5.1.1 Security Policies (2 MC + 1 scenario) ───
  {
    videoId: "5.1.1",
    kind: "mc",
    item: {
      q: "A company's information security manual contains all of the following entries. Which one is BEST classified as a guideline rather than a policy, standard, or procedure?",
      opts: [
        "All employees must encrypt customer data at rest.",
        "Customer data at rest must be encrypted using AES-256 or stronger.",
        "When sending sensitive files externally, prefer using the corporate file-share over an email attachment.",
        "To encrypt a file using the corporate tool, open the tool, select the file, and click Encrypt.",
      ],
      a: 2,
      exp: "Guidelines are recommended but not mandatory; the word 'prefer' signals optional behavior. The first entry is a high-level mandate (policy), the second specifies a technical requirement (standard), and the fourth gives step-by-step instructions (procedure). Confusing guidelines with policies is the most common exam trap because all four documents read as authoritative — language tone is the giveaway.",
      messerVideo: "5.1 - Security Policies",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.1",
    kind: "mc",
    item: {
      q: "Who in an organization is MOST appropriate to formally approve a new enterprise-wide information security policy?",
      opts: [
        "The IT security analyst who drafted it",
        "The CISO or executive owner with authority over the policy's domain",
        "The legal department, after review",
        "The end users who must comply with it",
      ],
      a: 1,
      exp: "Policies derive their authority from executive sign-off — typically the CISO or another executive owner — because policies set mandatory direction across the organization. Legal review is part of the drafting process but not approval; analysts draft; users comply. Without executive sign-off, a policy is unenforceable in practice and reviewers will challenge it in audits.",
      messerVideo: "5.1 - Security Policies",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.1",
    kind: "scenario",
    item: {
      q: "A new security analyst at a mid-size company finds the following document on the shared drive: 'Title: Cryptographic Standard. The following are approved encryption mechanisms for use in this company. Symmetric: AES-256-GCM. Asymmetric: RSA-3072 or ECDSA P-256. Hashing: SHA-256 or stronger. Use of any other mechanism requires written approval from the security architect.' The analyst asks the CISO whether this document is a policy, standard, procedure, or guideline. What is the BEST answer?",
      opts: [
        "Policy — it sets mandatory direction for the organization",
        "Standard — it specifies the approved technologies that implement a higher-level policy",
        "Procedure — it lists the exact steps needed to complete a task",
        "Guideline — it offers recommendations rather than requirements",
      ],
      a: 1,
      exp: "The document specifies which technologies are approved, which is the defining characteristic of a standard. Standards translate higher-level policies (e.g. 'encrypt sensitive data') into specific, mandatory technical choices. Procedures would describe step-by-step actions, and guidelines would use recommending language ('prefer', 'should consider') rather than the mandatory tone here. The 'requires written approval' wording also signals a binding rule, which rules out guideline.",
      messerVideo: "5.1 - Security Policies",
      subObjective: "5.1",
    },
  },

  // ─── §5.1.2 Security Standards (2 MC + 0 scenario) ───
  {
    videoId: "5.1.2",
    kind: "mc",
    item: {
      q: "An organization adopts NIST CSF as a guiding framework, but maps it to internally written documents that specify how the organization implements each function. The NIST CSF document, in this context, is BEST classified as:",
      opts: [
        "An external standard the organization has chosen to align with",
        "An internal policy that supersedes other governance documents",
        "A regulatory requirement enforced by federal law",
        "A procedure detailing how to perform security tasks",
      ],
      a: 0,
      exp: "NIST CSF is published by the National Institute of Standards and Technology and is voluntary for most private organizations — it is an external standard. It is not internally written (eliminating 'internal policy'), is not federal law for most sectors (eliminating 'regulatory requirement'), and operates at framework level rather than step-by-step actions (eliminating 'procedure'). The organization's own implementation documents are what bridge the external standard to internal practice.",
      messerVideo: "5.1 - Security Standards",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.2",
    kind: "mc",
    item: {
      q: "ISO/IEC 27001 differs from PCI DSS primarily in that:",
      opts: [
        "ISO 27001 is required by law in most countries, while PCI DSS is a voluntary, best-practice security standard.",
        "ISO 27001 is a generic ISMS framework that organizations apply broadly, while PCI DSS is a contractual standard scoped to entities handling payment card data.",
        "ISO 27001 covers only encryption requirements, while PCI DSS covers all enterprise information security domains.",
        "ISO 27001 is a step-by-step technical procedure, while PCI DSS is a high-level corporate policy document.",
      ],
      a: 1,
      exp: "ISO 27001 is a broad ISMS (information security management system) framework any organization can adopt to manage information security; PCI DSS is a contractual standard mandated by the PCI Council for entities that process, store, or transmit cardholder data, with scope bounded to the cardholder-data environment. Neither is law in the strict sense — the first option inverts the relationship — and ISO 27001 covers far more than encryption. Both operate at standard level, so neither is a policy or procedure.",
      messerVideo: "5.1 - Security Standards",
      subObjective: "5.1",
    },
  },

  // ─── §5.1.3 Security Procedures (1 MC + 1 scenario) ───
  {
    videoId: "5.1.3",
    kind: "mc",
    item: {
      q: "A SOC analyst is paged at 2 a.m. for a possible ransomware indicator. They open the company's runbook for ransomware. The runbook is MOST useful at 2 a.m. because:",
      opts: [
        "It removes the need for senior leadership approval during the incident",
        "It standardizes the immediate response so the analyst can act quickly without inventing steps under pressure",
        "It documents the legal exposure of the company in a ransomware incident",
        "It serves as the auditor-facing artifact proving compliance with regulations",
      ],
      a: 1,
      exp: "A runbook (procedure) translates high-level incident response policy into concrete steps so the on-call analyst can act consistently and quickly without making policy decisions at 2 a.m. Procedures are not approval-bypass mechanisms; the analyst still escalates per the runbook. They do not document legal exposure (a separate legal artifact), and although they can be used as audit evidence, that is not their primary purpose.",
      messerVideo: "5.1 - Security Procedures",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.3",
    kind: "scenario",
    item: {
      q: "A junior analyst on the SOC discovers an active ransomware indicator on a finance server during their shift. The company has a documented Ransomware Response Runbook that lists the first three steps as: (1) isolate the affected host from the network, (2) capture a memory image, (3) page the on-call IR lead. The analyst is unsure whether to also notify the company CFO (whose data is on the server) before completing the runbook steps. What is the BEST action?",
      opts: [
        "Notify the CFO first because the data belongs to their team",
        "Follow the runbook steps in order, then escalate to the IR lead, who will handle further notifications per the IR policy",
        "Skip the memory image because containment is more urgent",
        "Disconnect every system in the finance network as a precaution",
      ],
      a: 1,
      exp: "The runbook exists precisely so the on-call analyst doesn't have to make on-the-fly decisions about who to notify or which steps to skip. Following the runbook in order — including capturing the memory image, which is volatile evidence — and escalating to the IR lead allows the experienced lead to make stakeholder-notification decisions per the policy. Notifying the CFO ad hoc bypasses the documented chain; skipping forensic capture loses evidence; mass disconnection is over-broad and disrupts business unnecessarily.",
      messerVideo: "5.1 - Security Procedures",
      subObjective: "5.1",
    },
  },

  // ─── §5.1.4 Security Considerations (2 MC + 0 scenario) ───
  {
    videoId: "5.1.4",
    kind: "mc",
    item: {
      q: "A US-headquartered SaaS company stores European customer data in a Frankfurt data center. They use a US-based payroll provider that has access to EU employee data. Which of the following is the MOST important consideration for the SaaS company's compliance team?",
      opts: [
        "Whether the payroll provider has been certified PCI DSS Level 1",
        "Whether the cross-border data transfer to the US payroll provider has an appropriate legal basis under GDPR (such as Standard Contractual Clauses)",
        "Whether the Frankfurt data center has a SOC 2 Type II report",
        "Whether the company has CCPA opt-out workflows for California residents",
      ],
      a: 1,
      exp: "Sending EU residents' personal data to a US-based processor is a cross-border data transfer under GDPR, which requires an approved transfer mechanism such as Standard Contractual Clauses or an adequacy decision. Without it, the transfer is unlawful regardless of how secure either party is. PCI DSS applies to payment card data, not employee records; SOC 2 is operational assurance, not a transfer mechanism; CCPA covers California residents, not the EU.",
      messerVideo: "5.1 - Security Considerations",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.4",
    kind: "mc",
    item: {
      q: "Requiring two different employees to perform the 'request' and 'approve' actions for any wire transfer is an example of:",
      opts: [
        "Least privilege",
        "Separation of duties",
        "Job rotation",
        "Mandatory vacation",
      ],
      a: 1,
      exp: "Separation of duties splits a sensitive process across multiple people so no single individual can complete it alone — exactly what the request-versus-approve split for wire transfers does. Least privilege is about restricting each user's access to only what they need; job rotation moves people through different roles to detect fraud over time; mandatory vacation forces breaks so misconduct surfaces while the person is away. All four are administrative controls, but only separation of duties splits a single transaction across two actors.",
      messerVideo: "5.1 - Security Considerations",
      subObjective: "5.1",
    },
  },

  // ─── §5.1.5 Data Roles and Responsibilities (1 MC + 1 scenario) ───
  {
    videoId: "5.1.5",
    kind: "mc",
    item: {
      q: "A bank's data classification program designates a 'data steward' for each major data set. The data steward's PRIMARY responsibility is:",
      opts: [
        "Granting access to the data and being legally accountable for misuse",
        "Day-to-day enforcement of data-quality rules and classification labels for the data set on behalf of the data owner",
        "Operating the storage and backup systems where the data lives",
        "Acting on behalf of a third party that processes the data under contract",
      ],
      a: 1,
      exp: "The data steward operates as the data owner's delegate, handling day-to-day data quality, metadata, and classification labeling so the owner can focus on decisions about the data. The data owner (not steward) grants access and bears accountability; the data custodian operates the storage and backup infrastructure; a data processor acts on a third party's behalf. Steward-versus-owner is a frequent exam confusable because both touch the data closely.",
      messerVideo: "5.1 - Data Roles and Responsibilities",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.5",
    kind: "scenario",
    item: {
      q: "A retail company subject to GDPR collects customer purchase histories. Three parties interact with this data. Maria, the VP of Customer Analytics, decides which fields are collected and approves all access requests. Tom, a database administrator, runs the database servers, performs nightly backups, and restores data when needed. Acme Marketing Inc., a third-party agency, receives an extract each month to send promotional emails on the retailer's behalf. Under GDPR terminology, what roles are Maria, Tom, and Acme Marketing playing, respectively?",
      opts: [
        "Data controller, data custodian, data processor",
        "Data owner, data processor, data controller",
        "Data steward, data subject, data processor",
        "Data controller, data processor, data sub-processor",
      ],
      a: 0,
      exp: "Under GDPR, the data controller determines the purposes and means of processing personal data — that is Maria, deciding what data is collected and approving access. The data custodian (a security-role term, used alongside GDPR vocabulary) operates the systems holding the data — that is Tom. A data processor processes personal data on the controller's behalf under contract — that is Acme. The 'Data owner' option uses the NIST/non-GDPR term and reverses Tom and Acme's roles; Tom is not a data subject (the customers are); a sub-processor would be a party Acme itself contracts with.",
      messerVideo: "5.1 - Data Roles and Responsibilities",
      subObjective: "5.1",
    },
  },

  // ─── §5.2.1 Risk Management (2 MC + 1 scenario) ───
  {
    videoId: "5.2.1",
    kind: "mc",
    item: {
      q: "A risk register entry shows a Low likelihood (about once every ten years) but a Catastrophic impact ($100M loss and loss of key contracts). Using the basic risk equation likelihood times impact, this risk should BEST be:",
      opts: [
        "Ignored because the likelihood is low",
        "Reviewed alongside higher-likelihood risks because the magnitude of impact alone may justify investment",
        "Automatically transferred to insurance",
        "Treated as zero risk because Low times any-impact rounds to a small number",
      ],
      a: 1,
      exp: "Risk equals likelihood multiplied by impact, but a Catastrophic impact can overwhelm a Low likelihood when expressed in absolute dollar terms (e.g. $100M times 0.1 probability per year is a $10M expected annual loss). Discarding it because the likelihood is small is a classic mistake — exactly the kind of low-frequency, high-magnitude risk that risk registers are meant to surface. Insurance is one possible mitigation but not automatic, and 'zero risk' is incorrect because the product is non-zero.",
      messerVideo: "5.2 - Risk Management",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.1",
    kind: "mc",
    item: {
      q: "A risk assessment that rates risks as 'Low / Medium / High' on a five-by-five matrix is BEST described as:",
      opts: [
        "Quantitative, because the matrix produces a numeric coordinate",
        "Qualitative, because it uses subjective categories rather than monetary or probabilistic values",
        "Hybrid, because it combines numeric ranges with categorical labels",
        "Inherent, because it ignores existing controls",
      ],
      a: 1,
      exp: "A qualitative risk assessment uses ordinal categories (Low/Medium/High or 1–5) that reflect expert judgment rather than calculated monetary values. Quantitative assessments produce dollar-based metrics like SLE and ALE. The matrix's numeric coordinates are not true quantitative values — they are rank labels. Inherent versus residual is a separate dimension of risk (whether existing controls are factored in), not a label for the methodology itself.",
      messerVideo: "5.2 - Risk Management",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.1",
    kind: "scenario",
    item: {
      q: "A regional credit union is choosing between a qualitative or quantitative risk assessment approach for its annual security risk review. The CISO notes: most threats are well documented but precise loss amounts are hard to estimate without significant analyst time, the board prefers visual heat-map summaries, and the regulator accepts either approach. Which approach is the BEST initial choice?",
      opts: [
        "A quantitative approach, because regulators always prefer dollar-based metrics",
        "A qualitative approach, because it produces the heat-map outputs the board expects and is faster to execute when precise loss figures are hard to estimate",
        "A hybrid approach where every risk gets both a qualitative rating and a full ALE calculation",
        "Skip the assessment this year because either approach has limitations",
      ],
      a: 1,
      exp: "Qualitative assessments are well suited when impact figures are hard to estimate quantitatively, the audience consumes summary visualizations like heat maps, and time and analyst expertise are limited. Quantitative is more precise but expensive to produce; the regulator's neutrality removes that pressure. Demanding full ALE calculations for every risk wastes analyst time when most risks cannot be defensibly priced. Skipping the assessment is not an option for a regulated entity.",
      messerVideo: "5.2 - Risk Management",
      subObjective: "5.2",
    },
  },

  // ─── §5.2.2 Risk Analysis (2 MC + 1 scenario) ───
  {
    videoId: "5.2.2",
    kind: "mc",
    item: {
      q: "A risk analysis estimates that a single ransomware infection costs the company $50,000 to recover from. Threat intelligence suggests the company is likely to experience one such infection every five years. The Annualized Loss Expectancy (ALE) for ransomware is:",
      opts: [
        "$10,000",
        "$50,000",
        "$250,000",
        "$5,000",
      ],
      a: 0,
      exp: "ALE equals SLE times ARO. SLE (Single Loss Expectancy) is $50,000. ARO (Annualized Rate of Occurrence) is one event in five years, or 0.2 events per year. ALE = $50,000 × 0.2 = $10,000. The other options misuse the formula: $50,000 ignores the ARO entirely; $250,000 confuses the recurrence interval (one event every 5 years) with the ARO (0.2 events per year) — the formula uses ARO, not the inverse interval; $5,000 divides further than the formula calls for.",
      messerVideo: "5.2 - Risk Analysis",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.2",
    kind: "mc",
    item: {
      q: "A risk register shows two risks for a customer-facing web application. Risk A: SLE = $200,000, ARO = 0.05. Risk B: SLE = $20,000, ARO = 1.5. Comparing their ALEs, which statement is correct?",
      opts: [
        "Risk A's ALE is higher, so it is the priority",
        "Risk B's ALE is higher, so it is the priority",
        "Both have the same ALE; pick by impact severity",
        "ARO above 1.0 is invalid, so Risk B should be discarded",
      ],
      a: 1,
      exp: "ALE = SLE × ARO. Risk A: $200,000 × 0.05 = $10,000. Risk B: $20,000 × 1.5 = $30,000. Risk B's ALE is three times higher, making it the priority by ALE. ARO can exceed 1.0 — it represents the expected frequency per year, so 1.5 means an average of 1.5 events per year. Comparing only SLEs ignores how often each event happens, which is exactly the trap the formula is designed to avoid.",
      messerVideo: "5.2 - Risk Analysis",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.2",
    kind: "scenario",
    item: {
      q: "A company's risk register has the following entry: 'Risk: Stolen laptop containing unencrypted customer data. Asset value $5,000 (laptop) + $2,000,000 (regulatory fine if breached). Exposure factor: 0.4 if no encryption, near zero if encrypted. ARO = 0.1. Current control: none. Mitigation cost: $50 per laptop for full-disk encryption × 500 laptops = $25,000.' Based on this analysis alone, what is the BEST treatment recommendation?",
      opts: [
        "Accept the risk because the mitigation costs $25,000 up front",
        "Mitigate by deploying full-disk encryption — annualized cost is far below the ALE without controls",
        "Transfer the risk to cyber insurance, since insurance is always cheaper than encryption",
        "Avoid the risk by issuing all employees desktop computers instead of laptops",
      ],
      a: 1,
      exp: "Without encryption: SLE = asset value × exposure factor = $2,005,000 × 0.4 = $802,000. ALE = SLE × ARO = $802,000 × 0.1 = $80,200 per year. Mitigation costs $25,000 once (or roughly $25,000 per year amortized over the laptop refresh cycle). Encryption brings the exposure factor to near zero and the ALE to near zero, so it pays back in well under a year. Acceptance ignores the math; insurance does not always undercut a cheap technical control; avoidance via desktops is impractical for a workforce that needs mobility.",
      messerVideo: "5.2 - Risk Analysis",
      subObjective: "5.2",
    },
  },

  // ─── §5.2.3 Risk Management Strategies (1 MC + 1 scenario) ───
  {
    videoId: "5.2.3",
    kind: "mc",
    item: {
      q: "A company chooses to install web application firewalls and conduct quarterly penetration tests in front of its public e-commerce platform. This treatment strategy is BEST described as:",
      opts: [
        "Risk avoidance — eliminating the risk by not running an e-commerce platform",
        "Risk transference — moving liability to a third party",
        "Risk mitigation — reducing the likelihood or impact of the risk through controls",
        "Risk acceptance — explicit decision to take on the risk without further action",
      ],
      a: 2,
      exp: "Adding controls (a WAF and penetration tests) reduces the likelihood and impact of attacks against the application — that is the definition of risk mitigation. Avoidance would mean shutting the service down; transference moves financial liability via insurance or contract; acceptance is an explicit decision to do nothing further. Acceptance is the most plausible misread because controls 'feel' like accepting some residual risk, but the strategy itself is mitigation.",
      messerVideo: "5.2 - Risk Management Strategies",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.3",
    kind: "scenario",
    item: {
      q: "A small retail company's e-commerce platform processes credit card payments. The CFO notes that a major breach would be catastrophic — likely bankruptcy. Two options are on the table: (1) move all payment processing to a third-party PCI-compliant vendor (the company never sees the card data) or (2) keep processing in-house and purchase a $5M cyber insurance policy. The CFO asks the security team for the BEST recommendation. What should they recommend?",
      opts: [
        "Option 1 (move to a third-party processor) — risk avoidance is preferred when the consequence of failure is catastrophic and a viable avoidance path exists",
        "Option 2 (in-house with insurance) — risk transference is always cheaper than re-architecting",
        "Either option is equally good — both produce a defensible outcome, so the cheapest wins",
        "Neither — risk acceptance is the lowest-cost strategy when the company is already small",
      ],
      a: 0,
      exp: "Both options are defensible (avoidance and transference), but for a small company facing a catastrophic worst case, avoidance is BEST when a viable avoidance path exists — third-party tokenization is a mature, low-cost solution that takes the company out of PCI scope entirely. Insurance still leaves operational, reputational, and contractual fallout that the company would have to absorb. The 'always cheaper' claim in Option 2 is false in practice; Option 3 ignores the catastrophic-consequence weighting; Option 4 does not address the underlying risk at all.",
      messerVideo: "5.2 - Risk Management Strategies",
      subObjective: "5.2",
    },
  },

  // ─── §5.2.4 Business Impact Analysis (1 MC + 0 scenario) ───
  {
    videoId: "5.2.4",
    kind: "mc",
    item: {
      q: "An organization's BIA records an RTO of 4 hours and an RPO of 30 minutes for its order management system. After a hardware failure at 14:00, the system is restored and back online at 17:00 with data restored from a backup taken at 13:45. Which BIA targets, if any, were missed?",
      opts: [
        "RTO missed; RPO met",
        "RTO met; RPO missed",
        "Both RTO and RPO met",
        "Both RTO and RPO missed",
      ],
      a: 2,
      exp: "RTO (Recovery Time Objective) is the maximum acceptable downtime — 14:00 to 17:00 is 3 hours, within the 4-hour target. RPO (Recovery Point Objective) is the maximum acceptable data loss measured backward from the failure — a backup at 13:45 with failure at 14:00 means 15 minutes of data lost, within the 30-minute target. Both met. The exam confusable: RTO is forward-looking (how long to come back), RPO is backward-looking (how much data is acceptable to lose).",
      messerVideo: "5.2 - Business Impact Analysis",
      subObjective: "5.2",
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
