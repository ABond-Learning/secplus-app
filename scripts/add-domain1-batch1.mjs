// One-shot applier: append 8 Domain 1 scenarios to questions.json.
// Idempotent: detects already-inserted items by stem prefix and skips.
//
// Usage:
//   node scripts/add-domain1-batch1.mjs           # dry-run, prints diff summary
//   node scripts/add-domain1-batch1.mjs --write   # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const write = process.argv.includes("--write");

// Each entry: { videoId, scenario }. Scenarios are appended to video.scenarios[].
// Appending at the end preserves existing indices — SM-2 keys are untouched.
const INSERTIONS = [
  {
    videoId: "1.1.1",
    scenario: {
      q: "A financial services firm is deploying new security tools after a recent breach. Leadership asks for a control that will STOP unauthorized database connections, not just notify staff after the fact. Which of the following BEST addresses this requirement?",
      opts: [
        "A SIEM rule that alerts on anomalous database logins",
        "Database activity monitoring with nightly exception reports",
        "A network firewall rule that blocks the application subnet from reaching the database except via the API tier",
        "A monthly access review of database service accounts",
      ],
      a: 2,
      exp: "Leadership wants a control that prevents the activity before it happens — that is a preventive control. A firewall rule that blocks the forbidden network path prevents the connection itself. SIEM alerting and DAM reports are detective (they notice the activity after it starts), and access reviews are administrative/detective. Only the firewall rule stops the connection.",
      messerVideo: "1.1 - Security Controls",
      subObjective: "1.1",
    },
  },
  {
    videoId: "1.1.1",
    scenario: {
      q: "A retailer's payment-processing terminals run an embedded OS that the vendor will not patch for six more months, even though a critical vulnerability was just disclosed. The terminals cannot be taken offline during the holiday season. Which control type BEST describes isolating those terminals on a dedicated VLAN with strict egress filtering until the patch arrives?",
      opts: [
        "Preventive control",
        "Detective control",
        "Compensating control",
        "Corrective control",
      ],
      a: 2,
      exp: "A compensating control is an alternative safeguard used when the primary control (here, patching) cannot be applied. Isolating the vulnerable terminals on a restricted VLAN mitigates risk until the vendor patches. Preventive describes the patch itself once available; corrective is what you apply after an incident; detective only observes. CompTIA uses 'compensating' specifically for this stop-gap scenario.",
      messerVideo: "1.1 - Security Controls",
      subObjective: "1.1",
    },
  },
  {
    videoId: "1.2.1",
    scenario: {
      q: "An energy utility's control engineers notice that a field device is reporting sensor readings that drift several seconds out of sync with reality. Attackers appear to be altering the values in transit between the device and the SCADA server. Which pillar of the CIA triad is MOST directly under attack?",
      opts: [
        "Confidentiality",
        "Integrity",
        "Availability",
        "Non-repudiation",
      ],
      a: 1,
      exp: "Tampering with sensor readings in transit violates integrity — the receiving system trusts data that no longer reflects what the device actually sent. Confidentiality is about secrecy (reading data), availability is about reachability (data arriving at all), and non-repudiation is about proving who sent a message (and is not a CIA pillar). Integrity is the most direct answer here.",
      messerVideo: "1.2 - The CIA Triad",
      subObjective: "1.2",
    },
  },
  {
    videoId: "1.2.2",
    scenario: {
      q: "A purchasing manager claims they never approved a $40,000 wire transfer, even though the workflow shows their account signed off. The security team must determine whether the approval can be definitively tied to the manager and not just anyone with their password. Which control provides the STRONGEST non-repudiation?",
      opts: [
        "Username and password audit logging in the application",
        "Time-stamped server logs forwarded to a central SIEM",
        "A digital signature applied with the manager's private key stored on a hardware token",
        "A scanned image of the manager's handwritten signature attached to the approval PDF",
      ],
      a: 2,
      exp: "Non-repudiation requires cryptographic evidence that only the private key holder could have produced. A hardware-token-backed digital signature binds the action to the physical device, not just the account — passwords alone can be stolen. Server logs and audit trails are evidence but can be undermined by credential theft; scanned handwritten signatures are trivially copyable and provide no cryptographic binding.",
      messerVideo: "1.2 - Non-repudiation",
      subObjective: "1.2",
    },
  },
  {
    videoId: "1.2.3",
    scenario: {
      q: "A helpdesk technician successfully logs into a ticketing platform with their corporate SSO credentials, but when they try to reassign a ticket to the system administrator group, the platform returns 'access denied.' Which stage of AAA is blocking the action?",
      opts: [
        "Authentication, because the credentials were invalid",
        "Authorization, because the user's role lacks the required permission",
        "Accounting, because the action was not logged successfully",
        "Identification, because the username could not be resolved",
      ],
      a: 1,
      exp: "Logging in succeeded, so authentication passed. What failed is authorization — the stage that checks whether the authenticated identity is permitted to perform the requested action. Accounting is the audit/logging step and does not block actions; identification (resolving the username) is part of the authentication stage, not a separate block on action.",
      messerVideo: "1.2 - Authentication, Authorization, and Accounting",
      subObjective: "1.2",
    },
  },
  {
    videoId: "1.3.1",
    scenario: {
      q: "A web application team needs to deploy a security patch within two hours to address an actively exploited zero-day. Which change management path BEST fits this situation while still preserving governance?",
      opts: [
        "Standard change with full CAB review scheduled for next week",
        "Emergency change with post-implementation CAB review",
        "Skip change management entirely because it is a security issue",
        "Normal change with the usual 48-hour stakeholder notification period",
      ],
      a: 1,
      exp: "Emergency changes are a recognized category specifically for urgent fixes that cannot wait for the normal CAB cadence. They still require governance, but the CAB review happens after implementation rather than before. Skipping change management abandons oversight, and standard or normal changes follow a slower pre-approval cadence that cannot meet a two-hour window.",
      messerVideo: "1.3 - Change Management",
      subObjective: "1.3",
    },
  },
  {
    videoId: "1.3.2",
    scenario: {
      q: "A database administrator is about to apply a complex schema migration to a production system during the approved maintenance window. Which element is MOST critical to include in the technical change plan before work begins?",
      opts: [
        "A color-coded Gantt chart of all recent database changes this quarter",
        "A documented backout plan with rollback steps that have been tested in a non-production environment",
        "A post-implementation screenshot of the updated schema for audit records",
        "A list of all developers who have accessed the database in the past 90 days",
      ],
      a: 1,
      exp: "A tested rollback plan is the single most critical technical artifact for a complex change — without it, a failed migration can leave production in an unrecoverable state. Gantt charts and developer access lists are supporting governance artifacts, not recovery tools. Post-implementation screenshots document what happened but do not help if the change must be reversed mid-window.",
      messerVideo: "1.3 - Technical Change Management",
      subObjective: "1.3",
    },
  },
  {
    videoId: "1.4.1",
    scenario: {
      q: "A browser shows a certificate warning when users visit a new internal web portal, even though the certificate was issued by the company's internal CA and is not expired. The CA's root certificate has not yet been distributed to user devices. What is the MOST likely cause of the warning?",
      opts: [
        "The server certificate has expired and needs to be reissued",
        "The browser does not trust the issuing CA because its root certificate is not in the device's trust store",
        "The certificate was issued with the wrong common name for the portal hostname",
        "The web server is negotiating a weak cipher suite that the browser rejects",
      ],
      a: 1,
      exp: "PKI trust flows from the client's local root store. An internal CA's root certificate must be pushed to each device (via GPO, MDM, or manual install) before browsers will trust the certificates it issues — otherwise every chain terminates in an unknown root and the browser warns. Expiry, wrong common name, and weak ciphers all produce more specific error messages than the generic untrusted-issuer warning described here.",
      messerVideo: "1.4 - Public Key Infrastructure",
      subObjective: "1.4",
    },
  },
];

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const videoById = new Map();
for (const section of data) {
  for (const video of section.videos) videoById.set(video.id, video);
}

let added = 0;
let skipped = 0;
for (const { videoId, scenario } of INSERTIONS) {
  const video = videoById.get(videoId);
  if (!video) {
    console.error(`ERROR: video ${videoId} not found`);
    process.exit(1);
  }
  if (!Array.isArray(video.scenarios)) video.scenarios = [];
  const stemHead = scenario.q.slice(0, 60);
  const already = video.scenarios.some((s) => typeof s.q === "string" && s.q.startsWith(stemHead));
  if (already) {
    console.log(`skip   ${videoId}: already has "${stemHead}..."`);
    skipped++;
    continue;
  }
  video.scenarios.push(scenario);
  console.log(`append ${videoId} scen[${video.scenarios.length - 1}]: "${stemHead}..."`);
  added++;
}

console.log(`\n${added} appended, ${skipped} skipped.`);

if (write) {
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${jsonPath}`);
} else {
  console.log("(dry run — pass --write to persist)");
}
