// One-shot applier: append 17 Domain 5 Batch 4 MCs (the fill batch) across
// §5.1, §5.2, §5.5, §5.6 to bring per-sub-objective totals to the +60 MC target.
// No new scenarios in this batch (closed at 60/60 after Batch 3).
// Idempotent: detects already-inserted items by stem prefix and skips.
//
// Usage:
//   node scripts/add-domain5-batch4.mjs           # dry-run, prints diff summary
//   node scripts/add-domain5-batch4.mjs --write   # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const write = process.argv.includes("--write");

const INSERTIONS = [
  // ─── §5.1 Security Governance (+6) ───
  {
    videoId: "5.1.1",
    kind: "mc",
    item: {
      q: "A company's information security policy states it must be 'reviewed at least annually and re-approved by the security executive sponsor.' Which of the following is the BEST description of why this annual review and re-approval is required?",
      opts: [
        "Annual reviews are a strict regulatory requirement under all major data-protection laws and security frameworks",
        "Annual reviews ensure the policy still reflects current threats, regulations, and business operations; re-approval re-establishes executive sponsorship",
        "Annual reviews are a vendor management requirement that allows external auditors to issue an annual report",
        "Annual reviews are needed only when the policy has been violated; otherwise the policy stays valid indefinitely",
      ],
      a: 1,
      exp: "Policies are living documents whose context (threats, regulations, business operations, technology) shifts over time; annual review and re-approval ensures the document still reflects reality and re-confirms the executive sponsor's commitment. Some — but not all — regulations require annual review (the option overstates this). External auditors do not issue annual reports from a single policy review. Policies do not become invalid only when violated — staleness alone is sufficient to invalidate a policy in audit findings.",
      messerVideo: "5.1 - Security Policies",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.2",
    kind: "mc",
    item: {
      q: "A company decides to adopt the NIST Cybersecurity Framework (CSF) but writes its own internal standard for password complexity that differs from the CSF's recommendations. From a standards-management perspective, this approach is:",
      opts: [
        "Inappropriate — once an external standard is adopted, the company must implement it exactly as published, with no variation",
        "Acceptable — companies routinely layer internal standards on top of external frameworks, choosing variations where business or regulatory context warrants",
        "Required — every external framework adoption must be accompanied by an internal override of every recommendation",
        "Discouraged — adopting any external framework while writing internal variants creates an unauditable compliance state",
      ],
      a: 1,
      exp: "External frameworks like NIST CSF are voluntary guidelines that organizations apply with judgment. It is normal and expected to layer internal standards on top, choosing where to follow the external framework directly and where to write a variant for business, regulatory, or technology reasons (e.g. an industry regulation that demands stricter passwords). The 'must implement exactly' framing misreads frameworks as mandatory law; 'must override every recommendation' is the opposite extreme; 'unauditable' overstates the audit impact when variances are documented.",
      messerVideo: "5.1 - Security Standards",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.3",
    kind: "mc",
    item: {
      q: "A company has two related documents. Document A is titled 'Password Reset Procedure' and reads: 'Step 1: Verify identity via security questions. Step 2: Generate temporary password. Step 3: Email to user. Step 4: Force reset on first login.' Document B is titled 'Password Hygiene Guideline' and reads: 'Use a passphrase of at least four random words; avoid passwords reused across services.' Which of the following BEST captures the formal difference between these two document types?",
      opts: [
        "Document A contains step-by-step instructions; Document B does not — the difference is the visible form",
        "Document B is recommending and non-binding; Document A is a mandatory, ordered set of steps employees must follow",
        "Document A is consistently shorter than guidelines, while Document B tends to be much longer in word count",
        "Document A is updated more frequently than Document B in most organizations' documentation practices",
      ],
      a: 1,
      exp: "Procedures are mandatory step-by-step instructions an employee must follow exactly to complete a defined task — failure to follow a procedure is auditable. Guidelines are recommending in tone and non-binding; they offer best-practice direction but compliance is not enforced. Both can read as 'instructions' on the surface (option 1's form distinction is partially right but not the formal defining feature), and length or update cadence are not characteristic differences. The binding-versus-recommending nature is what formally distinguishes the document types.",
      messerVideo: "5.1 - Security Procedures",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.4",
    kind: "mc",
    item: {
      q: "An organization deploys network firewalls, host-based antivirus, MFA on all admin accounts, encryption at rest, application allowlisting, and 24/7 SOC monitoring. The security principle this combination BEST illustrates is:",
      opts: [
        "Defense-in-depth — multiple overlapping security controls so failure of any one does not compromise the system",
        "Least privilege — users and services receive only the access required for their job role",
        "Zero trust — never trust, always verify, regardless of network location or origin",
        "Separation of duties — sensitive operations require two or more people to complete",
      ],
      a: 0,
      exp: "Defense-in-depth is the principle of layering multiple, complementary controls so that a single control failure does not compromise the system — exactly what the listed combination illustrates (network, host, identity, data, application, monitoring layers all reinforcing one another). Least privilege is about access restriction (one axis); zero trust is an architectural principle about verification (one axis); separation of duties splits a single sensitive operation across multiple people. None of those individually match the broad multi-control layering described.",
      messerVideo: "5.1 - Security Considerations",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.4",
    kind: "mc",
    item: {
      q: "A company's compliance team needs to identify the PRIMARY US regulation governing each of the following business activities. Which match is correct?",
      opts: [
        "Healthcare patient records → HIPAA; payment card data → PCI DSS; student educational records → FERPA; public-company financial reporting → SOX",
        "Healthcare patient records → SOX; payment card data → HIPAA; student educational records → PCI DSS; public-company financial reporting → FERPA",
        "Healthcare patient records → GDPR; payment card data → CCPA; student educational records → SOX; public-company financial reporting → HIPAA",
        "Healthcare patient records → FERPA; payment card data → SOX; student educational records → HIPAA; public-company financial reporting → PCI DSS",
      ],
      a: 0,
      exp: "HIPAA covers protected health information; PCI DSS is the contractual standard for payment card data; FERPA covers educational records of students; SOX covers public-company financial reporting controls. Each regulation has a defined scope mapped to a specific data type or business activity. The other options scramble the mappings — for example, GDPR is not a US regulation (it is EU), and CCPA is California-specific to consumer data, not payment cards.",
      messerVideo: "5.1 - Security Considerations",
      subObjective: "5.1",
    },
  },
  {
    videoId: "5.1.5",
    kind: "mc",
    item: {
      q: "A company classifies its data into four levels: Public, Internal, Confidential, and Restricted. Which of the following data items is BEST classified as 'Restricted'?",
      opts: [
        "The company's marketing brochures published on the corporate website for any visitor to read",
        "The company's organization chart, available to employees on the corporate intranet only",
        "The company's customer list with names and email addresses, used by the sales teams daily",
        "Customer credit card numbers and unencrypted Social Security Numbers in the payments database",
      ],
      a: 3,
      exp: "'Restricted' typically denotes the highest sensitivity tier — disclosure would cause severe harm and trigger regulatory or contractual consequences (e.g. PCI DSS for card data, breach notification for SSNs). Marketing brochures are Public; an internal org chart is Internal (not for external distribution but not catastrophic if leaked); a customer list with name and email is Confidential (PII but lower-sensitivity than card data). The classification axis is impact-of-disclosure, not just secrecy.",
      messerVideo: "5.1 - Data Roles and Responsibilities",
      subObjective: "5.1",
    },
  },

  // ─── §5.2 Risk Management (+7) ───
  {
    videoId: "5.2.1",
    kind: "mc",
    item: {
      q: "An external auditor is reviewing a company's enterprise risk assessment. The company's controls — encryption, MFA, monitoring, vendor due diligence — have been operating effectively for the past year. The auditor's primary risk-assessment focus, in this controlled environment, is on:",
      opts: [
        "Inherent risk — the level of risk that would exist with no controls in place at all",
        "Residual risk — the level of risk that remains after the existing controls have been applied",
        "Detection risk — the chance that the auditor's testing fails to find a material issue",
        "Reputational risk — the brand impact of a publicly disclosed control failure",
      ],
      a: 1,
      exp: "Once controls are deployed and operating, the risk that practically matters — and the focus of an auditor reviewing whether the residual position is acceptable — is residual risk: what remains after controls. Inherent risk is the theoretical pre-control baseline used during initial risk identification, not during operational reviews. Detection risk and reputational risk are different concepts entirely (audit-process risk and impact category, respectively). The 'controls have been operating' clue points unambiguously to residual.",
      messerVideo: "5.2 - Risk Management",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.1",
    kind: "mc",
    item: {
      q: "A company's board approves a statement that the company will 'accept moderate cyber risk in pursuit of its growth strategy.' Separately, the CISO publishes a directive that 'tier-1 systems may experience no more than 4 hours of unplanned downtime per year.' The first statement defines the company's risk appetite; the second defines:",
      opts: [
        "Risk appetite — the broad strategic level of risk the organization is willing to accept",
        "Risk tolerance — the specific allowable variance for an individual risk or asset class",
        "Risk capacity — the maximum risk the organization can absorb before solvency is threatened",
        "Risk velocity — the speed at which a risk materializes once triggered",
      ],
      a: 1,
      exp: "Risk appetite is the broad, strategic-level willingness the board sets — 'we accept moderate cyber risk for growth.' Risk tolerance is the specific allowable variance for individual risks or asset classes, often quantitative — '4 hours of unplanned downtime per year for tier-1 systems' is exactly that. Risk capacity is a different concept (maximum absorbable risk before solvency is at stake), and risk velocity describes timing dynamics, not an acceptance level.",
      messerVideo: "5.2 - Risk Management",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.2",
    kind: "mc",
    item: {
      q: "A risk register has four entries with the following indicators. Which risk should the security team treat as the HIGHEST priority for remediation budget?",
      opts: [
        "Risk A: SLE $50,000, ARO 0.1, current controls 'partial', mitigation cost $10,000 (high coverage)",
        "Risk B: SLE $5,000, ARO 4.0, current controls 'none', mitigation cost $2,000 (full coverage)",
        "Risk C: SLE $500,000, ARO 0.05, current controls 'effective', mitigation cost $100,000 (marginal incremental coverage)",
        "Risk D: SLE $10,000, ARO 0.5, current controls 'effective', mitigation cost $50,000 (marginal incremental coverage)",
      ],
      a: 1,
      exp: "ALE comparison: A = $5,000, B = $20,000, C = $25,000, D = $5,000. Risk B has the second-highest ALE but stands out because its current controls are 'none' AND mitigation cost is $2,000 with full coverage — an exceptionally favorable cost-benefit ratio. Risk C has the highest raw ALE but its existing controls are already effective (residual risk is small) and the mitigation cost is $100,000 with marginal additional coverage — poor return. Risks A and D have lower ALEs and less favorable economics. Priority decisions weigh ALE, control gap, and treatment cost together — not ALE alone.",
      messerVideo: "5.2 - Risk Analysis",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.2",
    kind: "mc",
    item: {
      q: "A data center experiences an HVAC failure that causes equipment damage on average about every 18 months. Each failure damages equipment worth $90,000, and historical data shows the damaged equipment loses on average 60% of its value (the rest can be restored or salvaged). What is the Annualized Loss Expectancy (ALE)?",
      opts: [
        "$36,000",
        "$54,000",
        "$60,000",
        "$90,000",
      ],
      a: 0,
      exp: "SLE = asset value × exposure factor = $90,000 × 0.6 = $54,000. ARO = expected events per year = 12 / 18 = 0.667. ALE = SLE × ARO = $54,000 × 0.667 ≈ $36,000. The other options misuse the formula: $54,000 is the SLE alone (ignoring frequency); $60,000 reflects the wrong assumption that the loss is the full asset value times 0.667; $90,000 is the asset value before any loss factor or frequency.",
      messerVideo: "5.2 - Risk Analysis",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.3",
    kind: "mc",
    item: {
      q: "A company's risk team is selecting a Key Risk Indicator (KRI) for the risk 'unauthorized access to customer data.' The team wants a LEADING KRI — one that gives early warning before a breach occurs. Which metric is the BEST choice?",
      opts: [
        "Number of customer data breaches reported to regulators in the past year",
        "Number of failed authentication attempts per day on the customer database, week-over-week",
        "Total dollars paid out under the cyber insurance policy in the previous fiscal year",
        "Number of customer complaints received about identity theft incidents this quarter",
      ],
      a: 1,
      exp: "Leading KRIs predict the likelihood of a future risk event, allowing intervention before harm — failed-auth attempt trends signal credential-stuffing or brute-force activity that often precedes a breach. Lagging KRIs (breach counts, insurance payouts, customer identity-theft complaints) measure outcomes that have already occurred, so they cannot be acted upon before the harm happens. KRIs differ from KPIs (performance) and from generic risk metrics — they are specifically risk-monitoring signals.",
      messerVideo: "5.2 - Risk Management Strategies",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.3",
    kind: "mc",
    item: {
      q: "A company faces a risk that, if it occurs, would cost $5M (likelihood: 1 in 20 years). The company is evaluating: (a) a $50,000-per-year mitigation that reduces likelihood by 80%, (b) a $40,000-per-year insurance policy that pays out 90% of the loss, (c) accepting the risk, (d) avoiding the activity. The BEST integrated treatment is:",
      opts: [
        "Avoidance only — stop the underlying activity entirely, since a $5M loss is too large to risk continuing",
        "Acceptance only — annualized loss is $250,000, well within the company's risk capacity",
        "Mitigation plus transference — apply the mitigation control to reduce likelihood, AND maintain insurance for the residual catastrophic case",
        "Transference only — the insurance fully covers the financial loss without any control investment",
      ],
      a: 2,
      exp: "Treatments are not always mutually exclusive. Mitigation reduces likelihood (80% reduction × $250,000 ALE = $50,000 residual ALE for $50,000 cost — break-even). Insurance covers the residual catastrophic case for $40,000 per year. Combined, the total annual cost is $90,000 to address what would otherwise be a $250,000 expected loss with $5M downside — strongly favorable. Avoidance loses the activity's value; acceptance leaves the catastrophic exposure; transference alone ignores the cost-effective likelihood reduction.",
      messerVideo: "5.2 - Risk Management Strategies",
      subObjective: "5.2",
    },
  },
  {
    videoId: "5.2.4",
    kind: "mc",
    item: {
      q: "A reliability engineer reports two metrics for a critical system: MTBF = 720 hours and MTTR = 4 hours. From a security and resilience perspective, which interpretation is correct?",
      opts: [
        "MTBF measures how long the system stays up between failures (720 hours); MTTR measures how long restoration takes after a failure (4 hours)",
        "MTBF measures how long restoration takes after a failure (720 hours); MTTR measures how long the system stays up between failures (4 hours)",
        "MTBF measures total annual uptime; MTTR measures total annual downtime — both are aggregates",
        "Both MTBF and MTTR measure the same thing — the terms are interchangeable in industry usage",
      ],
      a: 0,
      exp: "MTBF (Mean Time Between Failures) is a reliability metric — the expected interval between failures. MTTR (Mean Time To Repair, or Mean Time To Restore) is a recovery metric — how long it takes to restore service once a failure occurs. The values themselves give it away: 720 hours (~30 days between failures) is a long interval; 4 hours is a quick recovery. The reverse interpretation is the classic confusable. MTBF and MTTR are not the same thing, and neither maps directly to total annual up/downtime.",
      messerVideo: "5.2 - Business Impact Analysis",
      subObjective: "5.2",
    },
  },

  // ─── §5.5 Audits and Assessments (+2) ───
  {
    videoId: "5.5.1",
    kind: "mc",
    item: {
      q: "A SaaS company is preparing three different reports for three different audiences: (1) the financial-statement auditors of a customer who is a public company subject to SOX, who need assurance about controls relevant to the customer's financial reporting; (2) a customer's security and compliance team, who need detailed information about the SaaS company's security and availability controls under NDA; (3) prospective customers visiting the SaaS company's marketing website, who want general assurance that the company has independent security controls but cannot review confidential details. Which type of report is MOST appropriate for each audience, in order?",
      opts: [
        "(1) SOC 1, (2) SOC 2, (3) SOC 3",
        "(1) SOC 2, (2) SOC 1, (3) SOC 3",
        "(1) SOC 3, (2) SOC 2, (3) SOC 1",
        "(1) SOC 2, (2) SOC 3, (3) SOC 1",
      ],
      a: 0,
      exp: "SOC 1 reports on controls relevant to financial reporting — exactly what a SOX-bound customer's financial-statement auditors need. SOC 2 covers trust services criteria (security, availability, processing integrity, confidentiality, privacy) and is shared under NDA with security and compliance teams. SOC 3 is a derivative of SOC 2 designed for general distribution: no detailed control listing, no NDA, suitable for a marketing website. Confusing SOC 1 with SOC 2 is the most common exam mistake — SOC 1 is finance-controls-only.",
      messerVideo: "5.5 - Audits and Assessments",
      subObjective: "5.5",
    },
  },
  {
    videoId: "5.5.2",
    kind: "mc",
    item: {
      q: "A development team wants to find security flaws in a web application's source code BEFORE the application is deployed, accepting that some findings may be false positives that need triage. Which testing approach is MOST appropriate?",
      opts: [
        "SAST (Static Application Security Testing) — analyzes source code without executing it; finds flaws early in development but produces some false positives",
        "DAST (Dynamic Application Security Testing) — tests the running application from outside; finds real exploitable issues but cannot see source code",
        "IAST (Interactive Application Security Testing) — instruments the running app; combines source visibility with runtime context but requires execution",
        "Manual code review — line-by-line inspection by senior engineers; thorough but slow, expensive, and not scalable to all changes",
      ],
      a: 0,
      exp: "SAST analyzes source code without executing it, so it can fire early in development (pre-deploy, even pre-build), and is the right match for the 'find flaws in source code BEFORE deployment, accept some false positives' constraint. DAST cannot run pre-deploy because it needs a running app. IAST also requires a running app and runtime instrumentation. Manual code review is valuable but slow and not the same kind of automated tool. False-positive triage is a known SAST trade-off.",
      messerVideo: "5.5 - Penetration Tests",
      subObjective: "5.5",
    },
  },

  // ─── §5.6 Security Awareness (+2) ───
  {
    videoId: "5.6.1",
    kind: "mc",
    item: {
      q: "A security awareness manager wants to identify which individual employees should receive targeted retraining after the latest phishing simulation campaign. Which metric is the BEST choice for that specific outcome?",
      opts: [
        "Raw click rate across the entire campaign — percentage of all recipients who clicked the simulation",
        "Repeat-offender rate — number of employees who clicked simulations on multiple campaigns over a defined window",
        "Time-to-report — average time between simulation arrival and the first user reporting it to security",
        "Year-over-year click rate trend — directional change in simulation click rates across multiple program cycles",
      ],
      a: 1,
      exp: "To identify individuals for targeted retraining, the manager needs a per-employee signal — repeat-offender rate flags employees who have clicked phishing simulations across multiple campaigns, indicating a pattern that retraining is meant to address. Raw campaign-wide click rate measures program effectiveness but does not isolate individuals. Time-to-report measures real-time recognition (a different question). Year-over-year click trend measures program improvement direction. This is the classic 'which metric for which question' exam pattern.",
      messerVideo: "5.6 - Security Awareness",
      subObjective: "5.6",
    },
  },
  {
    videoId: "5.6.2",
    kind: "mc",
    item: {
      q: "A company's security awareness program includes three training types: annual all-employee training (cadence-triggered), department-specific training (role-triggered), and just-in-time training. Which of the following BEST describes the trigger pattern for just-in-time training?",
      opts: [
        "Calendar-based cadence — every employee completes the same module on their hire anniversary date",
        "Department-based assignment — when an employee transfers to a new role, the new department's curriculum is queued for completion",
        "Event-based microlearning — a specific user action (clicking a phishing simulation, etc.) triggers a brief, contextual module right after the event",
        "Manager-discretion — individual managers decide when each member of their team needs additional training",
      ],
      a: 2,
      exp: "Just-in-time training fires in response to a specific event — most often a phishing simulation click, a policy violation, or another behavioral signal — and delivers a brief, contextual module immediately so the lesson is most relevant. Calendar-based cadence is the annual-training pattern; department-based is role-based training; manager-discretion is ad hoc and not a structured program type. The 'event-triggered, immediately after the action' framing is the JIT signature.",
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
