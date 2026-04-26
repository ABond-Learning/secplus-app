// One-shot REWRITE: 16 in-place BEST/MOST rewrites of legacy Domain 2 MCs —
// the second and final Batch under the Task 1b Domain 2 plan.
//
// All items use REPLACEMENTS pattern (same as add-domain4-batch2.mjs and
// rewrite-domain2-batch1.mjs): safety-checked old-stem-prefix match before
// overwrite, idempotent re-runs, SM-2 indices preserved.
//
// All 16 items currently lack messerVideo + subObjective (legacy). Rewrites
// add citations. This is the SECOND content modification (vs addition) in
// Task 1b; Batch 1 was the first.
//
// Usage:
//   node scripts/rewrite-domain2-batch2.mjs            # dry-run summary
//   node scripts/rewrite-domain2-batch2.mjs --preview  # write previewed copy to /tmp
//   node scripts/rewrite-domain2-batch2.mjs --write    # mutate questions.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2b2-preview.json";
const write = process.argv.includes("--write");
const preview = process.argv.includes("--preview");

const REPLACEMENTS = [
  // ─── Item 1: §2.3.4 mc[0] Malicious update dangerous (heavy) ───
  {
    videoId: "2.3.4", kind: "mc", index: 0,
    expectedOldStemPrefix: "A malicious update attack is dangerous primarily",
    item: {
      q: "Which BEST explains why a malicious update attack is so dangerous?",
      opts: [
        "It exploits user and system trust in legitimate update mechanisms — signed binaries from a trusted vendor pass normal security controls without raising alarms",
        "Updates always require kernel-level privileges to install, so any malicious update automatically runs as ring 0 regardless of the actual installer",
        "Update channels use unencrypted HTTP transport, so an on-path attacker can swap the payload during transit to the consumer",
        "Operating systems automatically install every offered update without any user consent or admin approval, regardless of source",
      ],
      a: 0,
      exp: "Malicious update attacks weaponize the trust chain that consumers extend to their software vendors. The malware arrives as a signed update from a vendor the user already trusts; allowlisting, EDR, and signature-verification rules typically pass it because the signature is valid and the source is approved. This is the SolarWinds-class pattern. The other distractors are factually wrong (kernel privileges aren't always required; modern updates use HTTPS) or misstate update behavior (most OS updates require user/admin consent). Trust exploitation is the defining axis.",
      messerVideo: "2.3 - Malicious Updates",
      subObjective: "2.3",
    },
  },

  // ─── Item 2: §2.3.5 mc[1] EOL OS risk (heavy) ───
  {
    videoId: "2.3.5", kind: "mc", index: 1,
    expectedOldStemPrefix: "Running an end-of-life (EOL) operating system",
    item: {
      q: "Which BEST captures why running an end-of-life operating system creates significant security risk?",
      opts: [
        "The vendor no longer issues security patches, so newly disclosed vulnerabilities in the OS become permanently exploitable — defenders have no upstream fix path",
        "EOL operating systems are inherently slower and consume more memory than supported versions because vendor performance patches stop after EOL",
        "EOL operating systems cannot run modern security tools because all major AV/EDR vendors immediately drop EOL OS support on the EOL date itself",
        "EOL operating systems are blocked from accessing the internet by ISPs to protect other users from compromised hosts on the open network",
      ],
      a: 0,
      exp: "The defining EOL risk is the loss of patches. When new CVEs are disclosed against a supported OS, the vendor releases a patch and defenders apply it. After EOL, no patches arrive — every newly disclosed vulnerability becomes a permanent exposure with no upstream remediation path. The distractors confuse OS support with: performance (B — wrong; performance is not the security risk), AV/EDR availability (C — partially true over very long timescales but not the defining EOL day-zero issue), and ISP-level blocking (D — fabricated). Compensating controls (segmentation, monitoring) reduce exposure but do not close the underlying gap.",
      messerVideo: "2.3 - Operating System Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 3: §2.3.8 mc[0] Firmware vulnerabilities difficult (heavy) ───
  {
    videoId: "2.3.8", kind: "mc", index: 0,
    expectedOldStemPrefix: "Firmware vulnerabilities are particularly difficult to remediate",
    item: {
      q: "Which BEST explains why firmware vulnerabilities are particularly difficult to remediate?",
      opts: [
        "Firmware operates below the OS and persists through OS reinstalls; vendor updates are infrequent, risky to apply (bricking), and many devices receive no firmware updates after the first product cycle",
        "Firmware is written in low-level assembly that defenders cannot read, so vulnerability researchers cannot publish proof-of-concept exploits or patches at all",
        "All firmware vulnerabilities are zero-days by definition because firmware never has a previous version to compare against for binary diffing",
        "Firmware vulnerabilities can only be patched by replacing the entire physical device because modern hardware does not support in-field firmware updates",
      ],
      a: 0,
      exp: "Firmware sits below the OS — BIOS/UEFI, NIC firmware, drive controller firmware, IPMI/BMC firmware — so wiping and reinstalling the OS does not touch it. Vendor update cadence is much slower than software updates (often quarterly or longer if at all), updates can brick the device if interrupted, and many devices receive no firmware patches after the first product cycle. This combination makes firmware exposure long-lived. The other distractors are wrong: defenders DO read firmware (binary reverse engineering is mature); zero-day status is per-vulnerability not per-class; modern devices generally support firmware updates (replacement is rarely required).",
      messerVideo: "2.3 - Hardware Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 4: §2.3.9 mc[1] VM sprawl (heavy + ownership-axis correct answer) ───
  {
    videoId: "2.3.9", kind: "mc", index: 1,
    expectedOldStemPrefix: "VM sprawl is a security concern because:",
    item: {
      q: "Which BEST captures the SECURITY concern with VM sprawl (vs operational concerns like cost or performance)?",
      opts: [
        "VMs proliferate without clear ownership and then get forgotten — they go unpatched, unhardened, and unmonitored over time, becoming easy targets that no team is responsible for fixing",
        "Hypervisor CPU oversubscription forces VMs to share execution slices, allowing one tenant's process to read another tenant's CPU register state via timing side channels",
        "VM-to-VM network traffic stays inside the hypervisor and never reaches the network monitoring stack, creating a permanent monitoring blind spot regardless of inventory state",
        "Each additional VM costs licensing fees and consumes datacenter cooling capacity, raising IT operational costs faster than the security team's budget grows",
      ],
      a: 0,
      exp: "The defining security concern with VM sprawl is unmanaged ownership: VMs spin up for testing, projects, demos, then no one updates the inventory, no team patches them, no one monitors their behavior. Over months/years, those VMs accumulate unpatched CVEs and weak configurations that an attacker reaching the network can pivot through. The fix is asset management, ownership tagging, and lifecycle policies — not raw VM count limits. Distractor B (CPU side-channel timing attacks) is a different topic — the Meltdown/Spectre family of hardware vulnerabilities, unrelated to VM sprawl. Distractor C is wrong — modern virtual networking exposes VM-to-VM traffic via vSwitch port mirroring/SPAN. Distractor D is the operational concern the stem explicitly dismisses.",
      messerVideo: "2.3 - Virtualization Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 5: §2.3.12 mc[0] Misconfig example (partial — pad) ───
  {
    videoId: "2.3.12", kind: "mc", index: 0,
    expectedOldStemPrefix: "Which of the following is an example of a misconfiguration vulnerability",
    item: {
      q: "Which of the following is BEST classified as a misconfiguration vulnerability (vs another vulnerability category)?",
      opts: [
        "A zero-day exploit in the OS kernel that no vendor patch yet exists for and no public details have been disclosed",
        "Leaving default vendor credentials (admin/admin) unchanged on a newly deployed network device that is reachable from the production network",
        "A buffer overflow in a web application's image-upload handler that allows attacker-supplied input to overwrite return addresses",
        "A supply chain attack in which a software dependency is compromised upstream and the malicious payload reaches consumers via signed updates",
      ],
      a: 1,
      exp: "A misconfiguration vulnerability is one introduced by HOW a system is set up — default credentials left in place, overly permissive firewall rules, public-by-default storage buckets, exposed admin endpoints. The fix is configuration management, not code or supply-chain action. Other categories: zero-day (A) is an unknown vendor-side defect; buffer overflow (C) is a code defect; supply chain (D) is an upstream compromise. Knowing the category matters because remediation paths differ — misconfig means reconfigure; code defect means patch; supply chain means vendor response and software bill of materials review.",
      messerVideo: "2.3 - Misconfiguration Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 6: §2.3.13 mc[0] Jailbreaking risk (heavy) ───
  {
    videoId: "2.3.13", kind: "mc", index: 0,
    expectedOldStemPrefix: "Jailbreaking an iOS device is a security risk because:",
    item: {
      q: "Which BEST captures the SECURITY risk of jailbreaking an iOS device?",
      opts: [
        "Jailbreaking removes iOS's app-sandbox and code-signing enforcement, allowing unsigned (potentially malicious) code to run with full device access; most platform security controls are disabled",
        "Jailbreaking voids the manufacturer warranty, removing the user's option to seek vendor repair if the device develops a hardware fault later",
        "Jailbreaking permanently slows the device by approximately 30% because the bypassed security checks consume CPU cycles when re-enabled by background apps",
        "Jailbreaking exposes the user's iCloud password to Apple Support staff, who can then read it during any subsequent support interaction",
      ],
      a: 0,
      exp: "Jailbreaking strips out iOS's defense-in-depth: the app sandbox that isolates apps from each other and from system data, the code-signing enforcement that ensures only signed apps run, and various kernel-level mitigations. Once removed, malicious apps from non-App-Store sources can run with full device access. Jailbroken devices also often stop receiving iOS security updates because update flows assume an unmodified system. The warranty distractor (B) is real but is a legal/business concern, not a security concern. Performance and Apple-Support-iCloud claims (C, D) are fabricated.",
      messerVideo: "2.3 - Mobile Device Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 7: §2.4.1 mc[2] Fileless malware (partial — replace 1) ───
  {
    videoId: "2.4.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "Fileless malware is difficult to detect with traditional antivirus",
    item: {
      q: "Which BEST explains why fileless malware evades traditional signature-based antivirus?",
      opts: [
        "It never writes the malicious payload to disk — execution stays in process memory; persistence rides registry keys, WMI subscriptions, or scheduled-task XML rather than executable files",
        "It uses living-off-the-land binaries (LOLBins like PowerShell, certutil, regsvr32) — legitimate signed Windows tools that traditional AV does not flag as malicious by default",
        "It disguises itself as legitimate system files in protected directories so signature scans treat it as benign system content rather than a candidate for inspection",
        "It changes its signature every hour through polymorphic encoding so AV signature databases cannot maintain coverage of the current variant in time",
      ],
      a: 0,
      exp: "Signature-based AV scans files at rest and at execution-write — its detection model is 'compare file bytes against malware hash database.' Fileless malware never writes the malicious payload to disk: it injects shellcode into a running process's memory, persists via registry keys or WMI subscriptions or scheduled-task XML, and runs in memory. With no file to scan, the AV's scanning model has no input. LOLBin abuse (B) is a related evasion technique but not the defining 'fileless' property. System-file disguise (C) is a different stealth technique. Polymorphism (D) is a different evasion technique. Modern AV/EDR adds behavioral and memory-scanning detection to address the fileless gap.",
      messerVideo: "2.4 - An Overview of Malware",
      subObjective: "2.4",
    },
  },

  // ─── Item 8: §2.4.3 mc[1] RAT dangerous (partial — replace 1) ───
  {
    videoId: "2.4.3", kind: "mc", index: 1,
    expectedOldStemPrefix: "A Remote Access Trojan (RAT) is particularly dangerous",
    item: {
      q: "Which BEST captures why a Remote Access Trojan is particularly dangerous?",
      opts: [
        "It self-propagates from host to host like a worm, infecting every reachable machine on the network without needing user action",
        "It gives the attacker interactive remote control of the victim's system — full access to keyboard, screen, camera, microphone, and file system, persisting as long as the channel survives",
        "It encrypts the victim's files in place and demands cryptocurrency payment for the decryption key, treating extortion as the primary monetization path",
        "It deletes itself after first execution to leave no forensic trace, ensuring the attacker's activity cannot be reconstructed even if the compromise is later detected",
      ],
      a: 1,
      exp: "A RAT's danger is interactive remote control — the attacker sees what the user sees and can drive the keyboard/mouse, capture camera/microphone feeds, browse the filesystem, install additional payloads, and pivot from the compromised host. The persistence and full-environment access make RATs much more dangerous than single-purpose malware. Distractors describe other malware categories: worms self-propagate (A); ransomware encrypts and extorts (C); self-deleting malware (D) is a separate stealth pattern not specific to RATs. Common RAT examples include njRAT and Quasar, all built around the remote-control primitive.",
      messerVideo: "2.4 - Spyware and Bloatware",
      subObjective: "2.4",
    },
  },

  // ─── Item 9: §2.4.6 mc[2] DNS amplification scenario (heavy, c2 — three components) ───
  {
    videoId: "2.4.6", kind: "mc", index: 2,
    expectedOldStemPrefix: "A DNS amplification attack is effective because:",
    item: {
      q: "An attacker generates a 50 Gbps DDoS flood at a target by sending small DNS queries (with the victim's address spoofed as the source) to thousands of open recursive DNS resolvers. The mechanism that BEST explains how a small attacker pipe produces large victim-side traffic is:",
      opts: [
        "Three effects combined: spoofed source IP reflects responses to the victim, small queries elicit ~50x larger responses (EDNS0/DNSSEC), and open recursive resolvers act as unwitting amplifiers using their bandwidth",
        "The DNS protocol uses TCP for amplification queries, which the attacker floods with SYN packets; each TCP connection consumes more victim resources than a UDP packet would",
        "DNS responses are inherently larger than queries because the protocol is inefficient; this inefficiency by itself is the amplification mechanism, no other components required",
        "The attacker compromises the victim's authoritative DNS server and uses it to respond to internet DNS queries, reflecting traffic at the victim from every DNS-using client globally",
      ],
      a: 0,
      exp: "DNS amplification combines three mechanisms. (1) REFLECTION: the attacker spoofs the victim's IP as the query source, so DNS responses go to the victim instead of the attacker — the attacker never sees the responses, which is fine because the attack goal is consumption of the victim's bandwidth. (2) AMPLIFICATION: a small ~64-byte query elicits a much larger ~3000+ byte response when DNSSEC and EDNS0 are involved — typical amplification factor ~50x. (3) THIRD-PARTY BANDWIDTH: open recursive DNS resolvers (misconfigured to answer any source) are the unwitting amplifiers — the attacker's small upload becomes the resolvers' large download to the victim. Removing any one component defeats the attack: source-IP filtering at the resolver kills reflection; response-rate limiting reduces amplification; closing open recursors removes the third-party bandwidth pool.",
      messerVideo: "2.4 - Denial of Service",
      subObjective: "2.4",
    },
  },

  // ─── Item 10: §2.4.11 mc[2] Dropper primary function (stem + length pad) ───
  {
    videoId: "2.4.11", kind: "mc", index: 2,
    expectedOldStemPrefix: "A dropper malware's primary function is:",
    item: {
      q: "Which BEST describes a dropper malware's primary function?",
      opts: [
        "Encrypting the victim's files in place and demanding cryptocurrency payment for the decryption key (the ransomware function)",
        "Serving as a small initial payload that downloads, decrypts, and installs the main malicious component on the compromised host",
        "Exfiltrating the victim's stored credentials, browser session tokens, and saved authentication material to attacker infrastructure (the info-stealer function)",
        "Providing the attacker with persistent interactive remote desktop access to the compromised host for hands-on-keyboard activity (the RAT function)",
      ],
      a: 1,
      exp: "A dropper is a small staged payload designed to land first on a compromised system and then fetch/install the main malware. The dropper itself is intentionally minimal — small footprint, sometimes obfuscated specifically to evade initial detection — because its job is just to bridge from the initial-access payload (e.g. a phishing attachment) to the larger second-stage malware. Distractors describe primary functions of OTHER categories: ransomware (A), info-stealer (C), RAT (D). Modern attack chains often involve a dropper then loader then main malware sequence, with each stage doing a different job.",
      messerVideo: "2.4 - Malicious Code",
      subObjective: "2.4",
    },
  },

  // ─── Item 11: §2.4.14 mc[1] Credential stuffing (stem + length pad) ───
  {
    videoId: "2.4.14", kind: "mc", index: 1,
    expectedOldStemPrefix: "Credential stuffing attacks work because:",
    item: {
      q: "Which BEST explains why credential stuffing attacks are effective?",
      opts: [
        "Many users reuse the same username and password across multiple services — credentials breached from one site work directly against many other services without any guessing",
        "Attackers guess a few common passwords across many user accounts to find an account where the guess matches (this is password spraying)",
        "Attackers buy or steal a password hash database from a target site and try every account with the recovered credentials (this is database theft + cracking)",
        "Attackers crack stolen NTLM hashes offline using GPU rigs and then replay the recovered cleartext passwords against the original target (offline cracking)",
      ],
      a: 0,
      exp: "Credential stuffing exploits PASSWORD REUSE across services. The attacker takes a username/password list breached from one site (or bought from a leak market) and replays it against many other sites. Wherever the user reused the credential, the login succeeds — no guessing, no cracking. Defense: unique passwords per site (password manager), MFA on every account, breach-credential monitoring at signup. Distractors describe related but distinct attacks: spraying (B), database theft + cracking (C), offline hash cracking (D). The defining reuse axis is what makes stuffing effective at scale.",
      messerVideo: "2.4 - Password Attacks",
      subObjective: "2.4",
    },
  },

  // ─── Item 12: §2.4.14 mc[3] Pass-the-hash dangerous (heavy) ───
  {
    videoId: "2.4.14", kind: "mc", index: 3,
    expectedOldStemPrefix: "Pass-the-hash is particularly dangerous because:",
    item: {
      q: "Which BEST captures why pass-the-hash is particularly dangerous in Windows enterprise environments?",
      opts: [
        "A captured NTLM hash authenticates as the target user against any NTLM-accepting service — no cracking needed, no rotation defeats it; lateral movement is one tool away wherever the user is logged in",
        "Pass-the-hash succeeds against modern Kerberos-based authentication out of the box, so even a fully Kerberos-enforced domain provides no protection against the technique",
        "NTLM hashes can be decrypted to cleartext passwords by anyone who knows the published Microsoft decryption key, so the hash itself acts like a cleartext credential",
        "Pass-the-hash gives the attacker raw kernel access on the target, allowing them to load any driver and disable EDR before performing the actual authentication attempt",
      ],
      a: 0,
      exp: "Pass-the-hash is dangerous because the hash IS the credential — capturing it (from lsass memory, SAM database, or domain controller replication) gives the attacker authenticated access to every NTLM-accepting service the user can reach. Because NTLM hashes don't change unless the user changes their password, and because Windows admin accounts are often used to log into many hosts (each leaving a hash in memory), one hash capture often unlocks broad lateral movement. This is why credential hygiene (admin tier separation, no admin logon to workstations, LAPS, strict NTLM restrictions) is critical. Kerberos-only enforcement DOES help (B is wrong); NTLM hashes are NOT reversible (C is wrong); kernel access is a different attack class (D is wrong).",
      messerVideo: "2.4 - Password Attacks",
      subObjective: "2.4",
    },
  },

  // ─── Item 13: §2.4.15 mc[1] High CPU IoC scenario (c2 partial) ───
  {
    videoId: "2.4.15", kind: "mc", index: 1,
    expectedOldStemPrefix: "Unexpected high CPU usage on a server",
    item: {
      q: "An on-call engineer notices a production server pinning 100% CPU at 3am with no scheduled jobs, no expected backups, and no user load. Which is the MOST likely cause to investigate FIRST?",
      opts: [
        "Routine background maintenance running on the server's monthly maintenance schedule that the on-call engineer has not yet noticed in the runbook documentation overnight",
        "Possible cryptomining or other resource-intensive malicious workload — off-hours timing plus full CPU saturation plus no expected load is the classic crypto-jacking pattern",
        "A failed software update that is silently retrying installation in a tight loop, consuming CPU until the next reboot or manual intervention by the support team",
        "Another administrator already debugging the issue with strace or perf attached to a hot process, consuming CPU as the diagnostic instrumentation collects samples",
      ],
      a: 1,
      exp: "The combination of '3am, no scheduled work, full CPU saturation' is the classic cryptojacking IoC pattern: malicious crypto-mining processes typically run when defenders aren't watching and use all available CPU because mining throughput depends on it. First-hour investigation: list running processes (top, ps), look for unfamiliar binaries or system processes spawning unusual children, check outbound connections (netstat, NetFlow) for mining-pool destinations (port 3333 stratum), and check sudden onset time. Benign causes (A routine maintenance, C failed-update loop, D admin debugging) are real possibilities and should be ruled out — but the scenario asks what to investigate FIRST, and the cryptojacking signature is most actionable.",
      messerVideo: "2.4 - Indicators of Compromise",
      subObjective: "2.4",
    },
  },

  // ─── Item 14: §2.5.2 mc[2] Isolation purpose (partial) ───
  {
    videoId: "2.5.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Isolating a compromised system is done to:",
    item: {
      q: "Which BEST captures why an IR team isolates a compromised system rather than immediately wiping or restoring it?",
      opts: [
        "Prevent the spread of malware or attacker access to other systems while preserving the compromised system intact for forensic investigation and root-cause analysis",
        "Preserve the compromised system in its current state strictly for later forensic analysis, with no other operational goal beyond evidence collection",
        "Immediately remove the malware and attacker tooling from the system so it can be safely returned to production within hours of the initial detection",
        "Trigger an automatic snapshot of the system's memory and disk for offline analysis while the attacker continues to operate normally on the system",
      ],
      a: 0,
      exp: "Isolation has TWO primary purposes that distinguish it from other IR steps: (1) STOP the spread — the compromised host can no longer reach other systems on the network, blocking lateral movement and exfiltration; (2) PRESERVE the system intact — for forensic investigation, evidence collection, and root-cause analysis. Wiping or restoring (C, D) destroys the evidence needed to understand HOW the compromise happened and WHAT the attacker accessed. Forensics-only framing (B) misses the spread-prevention purpose. The standard NIST IR sequence is contain then eradicate then recover; isolation is containment, not eradication or recovery.",
      messerVideo: "2.5 - Mitigation Techniques",
      subObjective: "2.5",
    },
  },

  // ─── Item 15: §2.3.14 mc[0] Zero-day definition (stem + minor pad) ───
  {
    videoId: "2.3.14", kind: "mc", index: 0,
    expectedOldStemPrefix: "A zero-day vulnerability is one that:",
    item: {
      q: "Which BEST defines a zero-day vulnerability?",
      opts: [
        "Has been patched for zero days since the public disclosure date — i.e. the patch dropped on day zero of disclosure",
        "Is unknown to the vendor at the time it is exploited and has no available patch — defenders have zero days to prepare a fix",
        "Affects zero deployed systems currently because zero-day refers to the day the vulnerability is first deployed in the wild",
        "Is rated 0.0 on the CVSS scale because zero-day vulnerabilities have not yet been scored by NVD at the time of discovery",
      ],
      a: 1,
      exp: "A zero-day vulnerability is one that the vendor doesn't know about (or hasn't patched) at the time it is being exploited — defenders have 'zero days' between learning of the vulnerability and needing to defend against active exploitation. The 'zero' in zero-day refers to the defender's preparation time, NOT to the patch age, system count, or CVSS score (the wordplay distractors). Zero-days are particularly dangerous because no signature/IoC exists yet, so detection relies on behavioral anomaly. Once the vendor releases a patch and the CVE is public, it becomes an 'n-day' vulnerability where n = days since disclosure.",
      messerVideo: "2.3 - Zero-day Vulnerabilities",
      subObjective: "2.3",
    },
  },

  // ─── Item 16: §2.4.8 mc[1] WPS best mitigated (stem + minor pad) ───
  {
    videoId: "2.4.8", kind: "mc", index: 1,
    expectedOldStemPrefix: "WPS vulnerabilities are best mitigated by:",
    item: {
      q: "Which is the BEST mitigation for WPS-related wireless attacks (e.g. Reaver-style PIN brute-force)?",
      opts: [
        "Using WPA3 exclusively across the network and removing WPA2 backwards compatibility from every access point in the environment",
        "Hiding the network SSID so attackers cannot see the wireless network exists during a passive site survey of the area",
        "Disabling WPS on all access points — the WPS PIN exchange is the attack surface, and turning it off eliminates the brute-force path entirely",
        "Using a stronger WPS PIN with more digits and a mix of letters and symbols to resist brute-force attempts",
      ],
      a: 2,
      exp: "WPS (Wi-Fi Protected Setup) was designed to make wireless setup easier — but the PIN-based variant has a fundamental flaw: the 8-digit PIN is split into two 4-digit halves checked separately, reducing brute-force complexity from 10^8 to ~11,000 combinations. Tools like Reaver exploit this directly. The only effective mitigation is to DISABLE WPS entirely; the PIN cannot be made resistant within the WPS spec. Moving to WPA3 helps but doesn't directly address WPS (you can run WPS on top of WPA3-Personal too); hiding the SSID is security theater (passive listeners see SSIDs in beacon frames or association requests anyway); a stronger PIN doesn't help because the protocol still leaks information about each half independently.",
      messerVideo: "2.4 - Wireless Attacks",
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
