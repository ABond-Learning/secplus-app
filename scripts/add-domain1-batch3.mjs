// One-shot applier: append the final 9 Domain 1 scenarios to questions.json.
// Same shape and idempotency as batches 1 and 2.
//
// Usage:
//   node scripts/add-domain1-batch3.mjs           # dry-run
//   node scripts/add-domain1-batch3.mjs --write   # mutate

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
      q: "A ransomware incident encrypted several user file shares before the SOC contained it. The immediate priority is to return the affected shares to service with minimal data loss. Which action is BEST described as a corrective control in this situation?",
      opts: [
        "An intrusion detection system alert that originally notified the SOC of the ransomware activity",
        "Restoring the encrypted shares from last night's verified immutable backup onto a rebuilt file server",
        "The mandatory annual security awareness training attended by all staff earlier in the quarter",
        "The firewall rule that blocks outbound SMB traffic from user workstation subnets",
      ],
      a: 1,
      exp: "A corrective control acts after an incident to restore normal operation or reduce damage. Restoring encrypted shares from a verified backup is a textbook corrective action. The IDS alert is detective — it identified the incident but did not correct it. The awareness training and outbound SMB firewall rule are both preventive. Only the restore actively reverses damage that has already occurred.",
      messerVideo: "1.1 - Security Controls",
      subObjective: "1.1",
    },
  },
  {
    videoId: "1.1.1",
    scenario: {
      q: "A facilities manager asks the security team to recommend a low-cost addition to the parking lot and building perimeter that will discourage casual trespassers without relying on active monitoring or physically blocking access. Which recommendation BEST describes a deterrent control?",
      opts: [
        "Motion-activated floodlights paired with clearly visible signage stating the area is under video surveillance",
        "A biometric palm reader on the employee entrance door that is the only sanctioned way to enter the building",
        "A line of concrete bollards installed along the frontage to block unauthorized vehicles from approaching the entrance",
        "An SOC analyst assigned to watch the parking-lot camera feeds continuously on a 24/7 rotation",
      ],
      a: 0,
      exp: "Deterrent controls discourage bad behavior by signaling consequences, rather than physically blocking, detecting, or responding. Floodlights and visible surveillance signage are classic deterrents — they make a would-be trespasser choose a softer target without ever touching the attacker. A biometric door lock is preventive (it actually stops entry). Concrete bollards are physical/preventive. A 24/7 camera analyst is detective. Only the signage + lighting combination is primarily a deterrent.",
      messerVideo: "1.1 - Security Controls",
      subObjective: "1.1",
    },
  },
  {
    videoId: "1.3.1",
    scenario: {
      q: "A mid-sized organization's change advisory board keeps rejecting proposed changes because they arrive without documented test results from a staging environment. One team pushes back, arguing that their change is 'too small to bother testing.' Which response BEST aligns with sound change management practice?",
      opts: [
        "Accept the team's assessment because small changes statistically rarely cause production problems",
        "Require documented test results regardless of change size, because the CAB cannot assess risk without evidence that the change actually worked in a non-production environment",
        "Carve out a standing exemption so changes the team self-classifies as small can bypass the CAB entirely",
        "Move the change straight to production so its outcome can be observed in the real environment and rolled back if needed",
      ],
      a: 1,
      exp: "Test results are a required input to the CAB's risk decision — without them, the board is guessing. 'Too small to test' is exactly the category of change that tends to cause outages because risk is assumed away rather than evaluated. Accepting the team's claim, carving out a self-classified bypass, or skipping straight to production all remove the evidence that the change process depends on. Requiring documented test results for every change preserves the governance contract.",
      messerVideo: "1.3 - Change Management",
      subObjective: "1.3",
    },
  },
  {
    videoId: "1.3.2",
    scenario: {
      q: "A DevOps team needs to update a shared TLS cipher configuration across 200 web servers. They propose applying the change through their version-controlled configuration management system, with every change tracked as a reviewed pull request. Which statement BEST describes the advantage of this approach over ad-hoc changes made directly on each server?",
      opts: [
        "It eliminates the need for a documented backout plan, because version control itself can always roll a change back cleanly",
        "It provides an auditable history of configuration changes, consistent application across every server, and a reviewable diff before the change is applied",
        "It removes the need for a change advisory board review, because the changes are delivered through automation rather than by hand",
        "It allows the team to bypass the organization's normal maintenance window requirements, because automated changes are low risk",
      ],
      a: 1,
      exp: "Version-controlled configuration management delivers three concrete properties for technical change management: an auditable change history (who changed what, when), consistent application across all servers (no snowflake hosts), and a reviewable diff before the change merges. It does not replace a tested backout plan, CAB review, or maintenance windows — those governance and recovery requirements remain regardless of the delivery mechanism. Option B captures the real advantages without overstating them.",
      messerVideo: "1.3 - Technical Change Management",
      subObjective: "1.3",
    },
  },
  {
    videoId: "1.4.3",
    scenario: {
      q: "Two systems need to establish a shared symmetric session key to encrypt a large data transfer. Their only communication path is the public Internet and they have never pre-shared any secret. Which cryptographic technique BEST solves this key establishment problem?",
      opts: [
        "Agreeing in advance that both endpoints will use the same symmetric algorithm, such as AES-256 in GCM mode",
        "An ephemeral Diffie-Hellman (or ECDHE) key exchange, which lets each side compute the same shared secret without ever transmitting it over the wire",
        "Each side independently hashing a fixed shared password with SHA-256 and using the resulting digest as the session key",
        "The sender encrypting a randomly chosen session key with a pre-shared password and emailing it to the recipient before the transfer begins",
      ],
      a: 1,
      exp: "Diffie-Hellman (and its elliptic-curve variant ECDHE) lets two parties derive the same shared secret over a public channel without ever transmitting the secret — which is exactly the situation described. Agreeing on an algorithm like AES-256 is not a key exchange. Hashing a shared password assumes a pre-shared secret, which the scenario explicitly rules out. Emailing a password-wrapped key also assumes a pre-shared password and exposes the key to anyone who intercepts the email and guesses that password.",
      messerVideo: "1.4 - Key Exchange",
      subObjective: "1.4",
    },
  },
  {
    videoId: "1.4.4",
    scenario: {
      q: "A financial company must store the root signing key for its internal certificate authority in such a way that the key can still be used for signing operations but cannot be extracted, even by a privileged administrator with full access to the host server. Which technology BEST meets this requirement?",
      opts: [
        "A software-encrypted key file on the CA server, protected by a strong administrative passphrase that only trusted staff know",
        "A hardware security module (HSM) that stores the key in tamper-resistant hardware and exposes only signing operations to the CA, never the key material itself",
        "A TPM-sealed key file tied to the boot state of the CA server, so the key is only accessible when the expected boot environment is measured",
        "A Windows DPAPI-protected blob stored in the CA service account's user profile, automatically unlocked when the service logs on",
      ],
      a: 1,
      exp: "A hardware security module stores cryptographic keys in tamper-resistant hardware and exposes only operations (sign, encrypt, decrypt), not the key material — privileged administrators of the host cannot extract the key. Software-encrypted key files and DPAPI blobs are ultimately only as strong as the administrator account that protects them. A TPM-sealed file provides strong platform binding but is designed for boot-state attestation, not non-extractable custody of a CA root key that must survive hardware refresh and remain usable by the CA.",
      messerVideo: "1.4 - Encryption Technologies",
      subObjective: "1.4",
    },
  },
  {
    videoId: "1.4.5",
    scenario: {
      q: "A developer needs to share a production database snapshot with an offshore analytics vendor so the vendor can tune query performance. Real customer names and Social Security numbers cannot leave the production environment, but the column structure and realistic-looking data distributions must be preserved so that query plans behave the same way as in production. Which technique BEST fits this need?",
      opts: [
        "Full-disk encryption applied to the exported snapshot file before it is handed off to the vendor",
        "Data masking that replaces sensitive fields with realistic but fictional values while preserving the column schema, data types, and distributions",
        "Hashing every sensitive field with SHA-256 before export so that the original values are irreversible on the vendor side",
        "Compressing and password-protecting the snapshot archive with a strong passphrase shared out of band with the vendor",
      ],
      a: 1,
      exp: "Data masking replaces sensitive values with realistic-but-fictional substitutes while preserving column types, formats, and distributions — the vendor sees data that behaves like production for query-plan purposes without exposing any real customer. Encryption and password-protected archives only hide data in transit or at rest; once decrypted, the real PII is visible again. Hashing destroys distributions and is still vulnerable to dictionary attacks on low-entropy fields like Social Security numbers.",
      messerVideo: "1.4 - Obfuscation",
      subObjective: "1.4",
    },
  },
  {
    videoId: "1.4.7",
    scenario: {
      q: "A consortium of shipping suppliers wants a shared ledger that records each parcel's custody transfers between companies. Any participant must be able to read the full ledger, no single participant should be able to retroactively alter past entries without detection, and there is no central authority to control the system. Which technology BEST fits these requirements?",
      opts: [
        "A shared SQL database hosted in the data center of the largest consortium member, with read-write accounts issued to the other members",
        "A distributed blockchain ledger in which each block is cryptographically chained to the previous block and replicated across participating nodes",
        "A centralized document management system where every supplier is granted read-write access to a single shared folder of custody records",
        "A shared SFTP folder where each supplier uploads a digitally signed CSV of its custody transfers at the end of each business day",
      ],
      a: 1,
      exp: "A distributed blockchain ledger provides all three properties the scenario explicitly requires: tamper evidence (each block is hashed and chained to the previous one, so altering a past entry invalidates every subsequent hash), shared readability across all participants, and no single controlling authority. A central SQL database or document system concentrates trust in one participant. A shared SFTP folder of signed CSVs provides integrity per file but allows silent rewrites of history and does not produce a single consortium-visible ordered ledger.",
      messerVideo: "1.4 - Blockchain Technology",
      subObjective: "1.4",
    },
  },
  {
    videoId: "1.4.8",
    scenario: {
      q: "A private key for a production web server's TLS certificate was accidentally committed to a public code repository and briefly indexed by a search engine. The team has already removed the file and reissued a new certificate bound to a new key pair. Which action is MOST important to complete to protect users who may still encounter the old certificate in caches or from attackers replaying it?",
      opts: [
        "Rotate the server's administrative SSH key pair used by the operations team to log into the host",
        "Submit the compromised certificate to the issuing CA for revocation and ensure the revocation is published through both CRL and OCSP",
        "Rename the old certificate and key files on the server's file system so that Apache or nginx cannot accidentally load them again",
        "Send an email to all customers asking them to clear their browser caches and restart their devices before visiting the site again",
      ],
      a: 1,
      exp: "Once a private key has been exposed publicly, the compromised certificate must be revoked through the issuing CA so that clients performing CRL or OCSP checks see the certificate as invalid — otherwise an attacker holding the leaked key can still impersonate the server to clients that trust the cert. Rotating SSH keys addresses an unrelated credential. Renaming files on the server does not reach any external client. Asking customers to clear caches is neither reliable nor scalable and is not a certificate lifecycle control.",
      messerVideo: "1.4 - Certificates",
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
