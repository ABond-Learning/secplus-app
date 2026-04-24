// One-shot applier: append 8 more Domain 1 scenarios to questions.json.
// Same shape and idempotency as add-domain1-batch1.mjs.
//
// Usage:
//   node scripts/add-domain1-batch2.mjs           # dry-run
//   node scripts/add-domain1-batch2.mjs --write   # mutate

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const write = process.argv.includes("--write");

const INSERTIONS = [
  {
    videoId: "1.1.1",
    scenario: {
      q: "After a successful phishing campaign went undetected for several weeks, a company's audit team asks for a control whose PRIMARY purpose is to discover similar incidents sooner next time. Which implementation BEST fits that request?",
      opts: [
        "A spam filter at the email gateway that quarantines suspected phishing messages before delivery",
        "Quarterly user awareness training delivered to all staff on identifying phishing attempts",
        "A SIEM use case that correlates suspicious inbox-rule creation with anomalous sign-in locations and alerts the SOC",
        "A written security policy that prohibits clicking links in unsolicited external email",
      ],
      a: 2,
      exp: "The audit team explicitly wants to discover similar events sooner — that is the definition of a detective control. A SIEM correlation rule that surfaces suspicious mailbox activity is detective. The spam filter is preventive (it blocks the message before delivery); awareness training is preventive/administrative (it reduces the chance of clicks); a written policy is directive. Only the SIEM rule is designed to detect incidents already underway.",
      messerVideo: "1.1 - Security Controls",
      subObjective: "1.1",
    },
  },
  {
    videoId: "1.1.1",
    scenario: {
      q: "A newly hired security analyst is asked to classify the organization's controls by category for an upcoming audit. Which of the following is BEST described as a managerial control rather than a technical, operational, or physical control?",
      opts: [
        "A Group Policy setting that enforces a 15-minute screen lock on all workstations",
        "A written acceptable use policy reviewed and signed annually by all employees",
        "A firewall rule set that blocks outbound traffic to known command-and-control IP addresses",
        "A security guard who patrols the data center perimeter during overnight hours",
      ],
      a: 1,
      exp: "Managerial (administrative) controls are documented decisions — policies, standards, procedures, risk management artifacts. A signed acceptable use policy is the classic example. The Group Policy screen-lock and the firewall rule are technical controls (enforced by technology). The perimeter guard is a physical control. Only the AUP belongs in the managerial category.",
      messerVideo: "1.1 - Security Controls",
      subObjective: "1.1",
    },
  },
  {
    videoId: "1.2.5",
    scenario: {
      q: "A company is moving away from a legacy 'castle-and-moat' VPN model in which authenticated users gain broad access to the internal network. The security team is implementing a zero trust architecture. Which change BEST reflects a zero trust principle?",
      opts: [
        "Expanding the VPN concentrator capacity so more remote users can authenticate simultaneously at peak times",
        "Requiring per-application access decisions that evaluate identity, device posture, and request context on every request",
        "Extending the internal VLAN reach into every branch office so users have the same flat network experience everywhere",
        "Reducing the number of firewall rules by trusting all traffic that originates inside the corporate WAN",
      ],
      a: 1,
      exp: "Zero trust replaces implicit network-location trust with explicit per-request verification of identity, device posture, and context. Making access decisions at each request, per application, is the core zero trust pattern. Expanding VPN capacity perpetuates the old implicit-trust model; extending a flat VLAN and trusting internal WAN traffic move in the opposite direction by enlarging the trust zone.",
      messerVideo: "1.2 - Zero Trust",
      subObjective: "1.2",
    },
  },
  {
    videoId: "1.2.6",
    scenario: {
      q: "A regional office stores backup tapes for the primary data center. Management requires three things: only authorized staff may enter the tape vault, unauthorized entries must generate an alert, and the organization must be able to identify who entered after the fact. Which combination of physical controls BEST satisfies all three requirements?",
      opts: [
        "A single pin-pad entry using a shared numeric code that is rotated quarterly among staff",
        "A badged card reader plus an interior motion sensor alarm, with card-reader logs retained for 90 days",
        "A padlock and key, with the key held by the facilities manager and signed out as needed",
        "A visitor sign-in sheet at the lobby desk that all visitors complete before proceeding to the vault",
      ],
      a: 1,
      exp: "The requirements demand authentication (who), alerting (detection), and attribution (records). A badged card reader authenticates individuals and logs entries for attribution; an interior motion sensor alarms on unauthorized entry. A shared pin-pad code defeats attribution because everyone uses the same code. A padlock has no detection or individual logging. A lobby sign-in sheet neither protects the vault nor reliably attributes entries. Only option B satisfies all three needs.",
      messerVideo: "1.2 - Physical Security",
      subObjective: "1.2",
    },
  },
  {
    videoId: "1.2.7",
    scenario: {
      q: "An SOC lead wants earlier warning when attackers who have already bypassed the perimeter begin exploring the internal network. Budget is tight and there is no room for large new infrastructure. Which deception technique BEST fits these constraints while producing a high-confidence alert?",
      opts: [
        "Deploying a full-scale honeynet that mirrors the production environment for attackers to explore",
        "Seeding the environment with honeytokens — plausible but unused credentials, files, and API keys that alert when accessed",
        "Adding an additional next-generation firewall in front of existing NGFWs for deeper defense in depth",
        "Publishing the company's internal IP ranges to an external threat feed to mislead attackers during reconnaissance",
      ],
      a: 1,
      exp: "Honeytokens are deliberately planted bait artifacts — unused credentials, fake API keys, decoy files — that generate high-confidence alerts because no legitimate user has any reason to touch them. They are extremely low cost to deploy. A full honeynet provides richer data but exceeds the stated budget and infrastructure constraints. Adding another firewall is defense in depth, not deception. Publishing internal IP ranges externally is neither standard practice nor helpful.",
      messerVideo: "1.2 - Deception and Disruption",
      subObjective: "1.2",
    },
  },
  {
    videoId: "1.3.1",
    scenario: {
      q: "A proposed change will replace the authentication provider used by the company's core financial application. The change advisory board meets tomorrow. Which group is MOST critical to include in the impact analysis for this change?",
      opts: [
        "The HR department alone, because authentication ultimately affects employee access",
        "The finance team that owns the application, the identity team that owns the auth provider, and the owners of any downstream systems integrated via SSO",
        "The facilities team alone, because physical access decisions are related to authentication",
        "The desktop support team alone, because they will field any user help tickets that result from the change",
      ],
      a: 1,
      exp: "Change impact analysis must cover the application owner, the platform owner of the component being changed, and downstream integrations that could break. The finance application owners, identity team, and SSO-integrated system teams together represent all three categories. Any single team by itself — HR, facilities, or desktop support — misses critical stakeholder scope, and narrow stakeholder scoping is one of the most common causes of botched changes.",
      messerVideo: "1.3 - Change Management",
      subObjective: "1.3",
    },
  },
  {
    videoId: "1.4.2",
    scenario: {
      q: "A compliance auditor reviews a database holding patient records. The database resides on an encrypted volume, but the auditor flags a concern about data protection during backup replication to an offsite site over the public Internet. Which protection MOST directly addresses the auditor's concern?",
      opts: [
        "Increasing the complexity and rotation frequency of the database administrator's password",
        "Enabling TLS for the replication connection so that data is encrypted in transit between the primary and the offsite site",
        "Rotating the volume-level encryption key on the primary database server every month",
        "Adding row-level access controls inside the database so only specific roles can read patient records",
      ],
      a: 1,
      exp: "The auditor's concern is specifically about replication traffic traversing the public Internet — that is a data-in-transit problem, not a data-at-rest problem. The encrypted volume and any at-rest key rotation protect the disk where the data lives, not the wire between sites. Row-level access controls enforce authorization, not confidentiality on the network. TLS on the replication connection encrypts the data as it moves between sites, which is exactly what the auditor flagged.",
      messerVideo: "1.4 - Encrypting Data",
      subObjective: "1.4",
    },
  },
  {
    videoId: "1.4.6",
    scenario: {
      q: "A software vendor publishes an installer along with a SHA-256 hash posted on the same download page. A customer wants assurance not only that the installer has not been altered in transit, but also that it actually came from the vendor and not from an attacker who compromised the download page. Which additional artifact BEST provides that assurance?",
      opts: [
        "A second SHA-256 hash of the installer posted to a different section of the same vendor website",
        "A digital signature on the installer that can be verified against the vendor's public certificate obtained from a trusted source",
        "A larger hash algorithm such as SHA-512 used in place of SHA-256 for the published hash value",
        "A password-protected ZIP archive wrapping the installer, with the password emailed separately to registered customers",
      ],
      a: 1,
      exp: "A hash alone proves integrity only if the hash source itself is trustworthy — if the attacker can modify the installer on the page, they can replace the posted hash too. A digital signature binds the file to the signer's private key, and verifying it against a public certificate obtained from a trusted source (CA chain or pre-installed trust store) establishes both integrity and authenticity. A stronger hash algorithm has the same provenance weakness; a password-protected ZIP does not prove the signer's identity.",
      messerVideo: "1.4 - Hashing and Digital Signatures",
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
