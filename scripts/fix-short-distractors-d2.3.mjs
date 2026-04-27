// Sub-batch 2 — §2.3 cohort (vulnerabilities): 26 changes across 28 cohort items.
// 2 items pure Convention B hold; 2 items Convention A (parenthetical-expansion);
// 1 item Convention B with light edit (parallelize bare term names); 9 rebuild;
// 12 multi-pad; 2 simple-pad (1 analytical scenario with intrinsically-long correct
// — explicit ratio-acceptance noted on that item).
//
// Watchpoints respected throughout (per Aiden's spec):
//   - Buffer / heap / stack / integer overflows kept distinct
//   - SQLi types (union/error/blind boolean/blind time) not muddled
//   - XSS three-type taxonomy (stored/reflected/DOM) preserved
//   - TOCTOU treated as a TYPE of race condition, not a separate category
//   - CVE / CVSS / CWE distinctions kept clean
//   - Zero-day = "no patch available", not "exploited within first day"
//   - Memory injection sub-techniques (DLL inj, process hollowing, reflective DLL) distinct
//   - No invented CVE numbers, CVSS scores, or fake exploit names
//   - No "is exclusively" / "always" absolutes about vulnerabilities
//
// Pure Convention B holds (no change this batch):
//   mc-2.3.14-2  Zero-day BEST mitigation — correct = "Defense-in-depth" (16 chars), preserve-correct rule
//   mc-2.3.3-1   "TOCTOU stands for" — TLA expansion recall, all 4 distractors are TLA expansions

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const jsonPath = resolve(repo, "questions.json");
const previewPath = "/tmp/questions-d2.3-distractor-preview.json";

const args = process.argv.slice(2);
const write = args.includes("--write");
const preview = args.includes("--preview");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

const REPLACEMENTS = [
  // ─── §2.3.1 Memory Injections ─────────────────────────────────────────
  {
    videoId: "2.3.1", kind: "mc", index: 0,
    expectedOldStemPrefix: "DLL injection is a technique used to",
    intensity: "multi-pad",
    newOpts: [
      "Force a running process to load and execute a malicious library within its address space",  // ✓ 88
      "Encrypt sensitive data in process memory at rest in the swap",                                // 60
      "Extract user passwords from the operating system credential store",                           // 65
      "Intercept network traffic between processes via shared kernel memory",                        // 68
    ],
  },
  {
    videoId: "2.3.1", kind: "mc", index: 1,
    expectedOldStemPrefix: "Process hollowing involves",
    intensity: "multi-pad",
    newOpts: [
      "Creating a legitimate process, suspending it, and replacing its code with malicious code",  // ✓ 88
      "Deleting all suspicious processes on the system during boot-up",                              // 62
      "Encrypting all process memory pages at runtime to prevent inspection",                        // 68
      "Hijacking a running process by injecting code into its open file handles",                   // 72
    ],
  },
  {
    videoId: "2.3.1", kind: "mc", index: 2,
    expectedOldStemPrefix: "ASLR mitigates memory attacks by",
    intensity: "multi-pad",
    newOpts: [
      "Encrypting all process memory pages at rest in the operating system kernel",                  // 74
      "Preventing code execution in memory regions specifically designated for data",                 // 76 (intentional DEP-confusion distractor)
      "Monitoring all memory allocation requests by running user processes in real time",             // 79
      "Randomizing where processes, libraries, and stacks are loaded — making buffer overflows harder to exploit",  // ✓ 105
    ],
  },
  {
    videoId: "2.3.1", kind: "mc", index: 3,
    expectedOldStemPrefix: "DEP (Data Execution Prevention) mitigates memory attacks by",
    intensity: "rebuild",
    newOpts: [
      "Encrypting executable code in memory to prevent disassembly",                                 // 60 (Aiden review-2: replaced recycled "Encrypting all process memory pages at runtime continuously" with this distinct mechanism in DEP's adjacent domain)
      "Monitoring memory usage and allocation in real time",                                         // 51
      "Randomizing memory addresses to prevent address prediction",                                  // 58 (intentional ASLR-confusion distractor)
      "Preventing code from executing in memory regions designated for data storage",                // ✓ 76
    ],
  },

  // ─── §2.3.2 Buffer Overflows ──────────────────────────────────────────
  {
    videoId: "2.3.2", kind: "mc", index: 0,
    expectedOldStemPrefix: "A buffer overflow attack works by",
    intensity: "multi-pad",
    newOpts: [
      "Flooding a server with very high-volume network traffic until it crashes",                    // 71
      "Decrypting protected data using brute-force cryptographic key search",                        // 69
      "Injecting SQL commands into a web form to manipulate the underlying database",                 // 76
      "Writing more data than a buffer can hold, overwriting adjacent memory to potentially redirect execution", // ✓ 103
    ],
  },
  {
    videoId: "2.3.2", kind: "mc", index: 1,
    expectedOldStemPrefix: "A stack canary is used to",
    intensity: "rebuild",
    newOpts: [
      "Marking stack memory as non-executable to prevent shellcode",                                 // 60 (Aiden review-2: replaced recycled "Encrypt all stack memory pages…" with this DEP-mechanism distractor — intentional stack-canary-vs-DEP cross-confusion)
      "Randomize all process memory addresses at load time to prevent injection",                    // 72 (intentional ASLR-confusion)
      "Monitor network traffic for buffer overflow attack signature patterns",                        // 69
      "Detect buffer overflow attempts by placing a random value before the return address",         // ✓ 83
    ],
  },
  {
    videoId: "2.3.2", kind: "mc", index: 2,
    expectedOldStemPrefix: "Buffer overflows are most commonly found in programs written in",
    intensity: "rebuild",
    newOpts: [
      "Python or Java which use managed memory and bounds checking",                                  // 60
      "C or C++ which allow direct memory access without bounds checking",                            // ✓ 65
      "HTML or JavaScript which run in interpreted runtime sandboxes",                                 // 62
      "SQL or other database query languages without compiled code",                                   // 60
    ],
  },
  {
    videoId: "2.3.2", kind: "mc", index: 3,
    expectedOldStemPrefix: "Which combination of mitigations BEST protects against buffer overflow",
    intensity: "rebuild",
    newOpts: [
      "Network firewall rules and intrusion detection",                                               // 46
      "VPN tunneling and end-to-end encryption",                                                      // 40
      "Multi-factor authentication and strong passwords",                                              // 49
      "ASLR, DEP, stack canaries, and input validation",                                               // ✓ 47
    ],
  },

  // ─── §2.3.3 Race Conditions ───────────────────────────────────────────
  {
    videoId: "2.3.3", kind: "mc", index: 2,
    expectedOldStemPrefix: "A developer checks if a file is owned by the correct user, then opens it",
    intensity: "convention-B-edit",
    newOpts: [
      "A TOCTOU race condition",       // ✓ 23
      "A SQL injection attack",        // 22 (was "A SQL injection" 15 — light edit for short-on-short symmetry)
      "A buffer overflow attack",      // 24 (was "A buffer overflow" 17)
      "A DLL injection attack",        // 22 (was "A DLL injection" 15)
    ],
  },

  // ─── §2.3.4 Malicious Updates ─────────────────────────────────────────
  {
    videoId: "2.3.4", kind: "mc", index: 1,
    expectedOldStemPrefix: "The SolarWinds attack is an example of",
    intensity: "rebuild",
    newOpts: [
      "A supply chain attack via a compromised software update",          // ✓ 55
      "A targeted spear-phishing campaign against admins",                 // 50
      "A watering hole attack via compromised website",                    // 47
      "A buffer overflow exploit in the network stack",                    // 47
    ],
  },

  // ─── §2.3.5 OS Vulnerabilities ────────────────────────────────────────
  {
    videoId: "2.3.5", kind: "mc", index: 2,
    expectedOldStemPrefix: "The WannaCry ransomware exploited which legacy Windows protocol vulnerability",
    intensity: "rebuild",  // Convention A — parenthetical-expansion match correct's "(EternalBlue vulnerability)" pattern
    newOpts: [
      "SMBv1 (EternalBlue vulnerability)",      // ✓ 33
      "NTLM (legacy Windows authentication)",    // 36
      "RDP (Remote Desktop Protocol)",           // 29
      "NetBIOS (legacy Windows networking)",     // 35
    ],
  },
  {
    videoId: "2.3.5", kind: "mc", index: 3,
    expectedOldStemPrefix: "Which is the MOST effective mitigation for operating system vulnerabilities",
    intensity: "rebuild",
    newOpts: [
      "Routinely using a corporate VPN connection",            // 42
      "Changing all default administrator passwords",           // 44
      "Regular and timely application of security patches",     // ✓ 50
      "Enabling full disk encryption on all endpoints",         // 46
    ],
  },

  // ─── §2.3.6 SQL Injection ─────────────────────────────────────────────
  {
    videoId: "2.3.6", kind: "mc", index: 0,
    expectedOldStemPrefix: "SQL injection attacks target",
    intensity: "multi-pad",
    newOpts: [
      "Network bandwidth and overall availability of services",         // 53
      "Physical security control systems and access badges",             // 50
      "Wireless network encryption protocols and pre-shared keys",       // 57
      "Web application databases by inserting malicious SQL code into input fields",  // ✓ 75
    ],
  },
  {
    videoId: "2.3.6", kind: "mc", index: 1,
    expectedOldStemPrefix: "What is the PRIMARY mitigation against SQL injection",
    intensity: "multi-pad",
    newOpts: [
      "Parameterized queries (prepared statements)",   // ✓ 43
      "Strict input length limits enforced at the form",  // 46
      "A web application firewall as the only control",   // 46
      "HTTPS encryption for all client-server traffic",   // 46
    ],
  },
  {
    videoId: "2.3.6", kind: "mc", index: 2,
    expectedOldStemPrefix: "An attacker enters ' OR '1'='1 into a login form",
    intensity: "rebuild",
    newOpts: [
      "SQL injection for authentication bypass",        // ✓ 39
      "A stack-based buffer overflow exploit",          // 37
      "A cross-site scripting (XSS) attack",            // 35
      "A directory traversal exploitation attempt",     // 43
    ],
  },

  // ─── §2.3.7 Cross-site Scripting ──────────────────────────────────────
  {
    videoId: "2.3.7", kind: "mc", index: 0,
    expectedOldStemPrefix: "Cross-site scripting (XSS) attacks inject malicious scripts into",
    intensity: "rebuild",
    newOpts: [
      "Network packets at the data link or network transport layer",   // 60
      "Trusted web pages viewed by other users — executing in their browsers",  // ✓ 69
      "Database query strings sent from the application to the server",  // 62
      "DNS query responses returned by upstream recursive resolvers",   // 60
    ],
  },
  {
    videoId: "2.3.7", kind: "mc", index: 2,
    expectedOldStemPrefix: "The HttpOnly cookie attribute mitigates XSS by",
    intensity: "multi-pad",
    newOpts: [
      "Encrypting all cookie contents using AES",        // 41
      "Making cookies expire immediately on close",      // 43
      "Blocking all cookies at the browser level",       // 42
      "Preventing JavaScript from accessing the cookie", // ✓ 47
    ],
  },
  {
    videoId: "2.3.7", kind: "mc", index: 3,
    expectedOldStemPrefix: "An attacker posts a comment on a website containing malicious JavaScript",
    intensity: "rebuild",  // Convention A — XSS-type recall with parenthetical expansion
    newOpts: [
      "Reflected XSS (non-persistent type)",          // 36
      "DOM-based XSS (client-side type)",             // 33
      "CSRF (cross-site request forgery) attack",     // 40 (Aiden review-2: replaced "SQL injection vulnerability" — wrong-category filler. CSRF is a real web-attack-vs-XSS confusion.)
      "Stored (persistent) XSS",                      // ✓ 23
    ],
  },

  // ─── §2.3.8 Hardware Vulnerabilities ──────────────────────────────────
  {
    videoId: "2.3.8", kind: "mc", index: 1,
    expectedOldStemPrefix: "A side-channel attack extracts information by",
    intensity: "multi-pad",
    newOpts: [
      "Analyzing physical signals such as power consumption or electromagnetic emissions — without attacking the software directly",  // ✓ 123
      "Injecting malicious shellcode directly into the application's process memory",                                                   // 76
      "Intercepting network traffic between client and server using a MITM proxy attack",                                               // 81
      "Exploiting SQL injection vulnerabilities in the application's database query layer",                                              // 83
    ],
  },
  {
    videoId: "2.3.8", kind: "mc", index: 2,
    expectedOldStemPrefix: "Specter and Meltdown are examples of",
    intensity: "rebuild",
    newOpts: [
      "Software-based code injection attacks against running applications",                            // 66
      "CPU hardware vulnerabilities exploiting speculative execution to read protected memory",       // ✓ 86
      "Firmware vulnerabilities found in BIOS or UEFI boot components",                                // 62
      "Social engineering attacks targeting end users with phishing emails",                            // 67
    ],
  },

  // ─── §2.3.10 Cloud-specific Vulnerabilities ───────────────────────────
  {
    // Ratio 6.87× intentionally accepted — analytical scenario where the correct answer's depth IS its substance. Padding distractors further would create false analytical content. Same approach as Pattern B scenarios in earlier work that we left untouched.
    // Analytical scenario: correct option is intrinsically long (268 chars) because
    // it carries the prioritization reasoning. Strict ≤1.5× ratio would require all
    // distractors at ≥179 chars — infeasible without making distractors absurdly verbose.
    // Simple-pad opt 1 to remove stub flag; explicitly accept the high length asymmetry.
    videoId: "2.3.10", kind: "scen", index: 1,
    expectedOldStemPrefix: "A security team reviewing cloud posture finds",
    intensity: "simple-pad-ratio-accepted",
    newOpts: [
      "API Gateway > S3 bucket > IAM role > EC2 security group",                                                                                                                                                                                                                                  // 55 (unchanged)
      "All four findings are equal in priority",                                                                                                                                                                                                                                                  // 39 (was 27 "All four are equal priority")
      "S3 bucket > IAM role > API Gateway > EC2 security group",                                                                                                                                                                                                                                  // 55 (unchanged)
      "EC2 security group (RDP open to internet) and API Gateway (no auth) are critical — immediate exposure to unauthenticated access. IAM role is high (excessive permissions). S3 versioning is medium — important for ransomware resilience but not immediate external exposure",            // ✓ 268 (unchanged)
    ],
  },

  // ─── §2.3.11 Supply Chain Vulnerabilities ─────────────────────────────
  {
    videoId: "2.3.11", kind: "mc", index: 1,
    expectedOldStemPrefix: "An SBOM (Software Bill of Materials) helps organizations",
    intensity: "multi-pad",
    newOpts: [
      "Track physical hardware inventory and asset tags across all enterprise data centers",                                              // 83
      "Monitor live network traffic flows for anomalous communication patterns continuously",                                              // 84
      "Identify all software components and dependencies so they can assess and respond to vulnerabilities in those components",          // ✓ 119
      "Manage user access rights and group memberships across all enterprise applications",                                                 // 82
    ],
  },

  // ─── §2.3.12 Misconfiguration Vulnerabilities ─────────────────────────
  {
    videoId: "2.3.12", kind: "mc", index: 1,
    expectedOldStemPrefix: "CIS Benchmarks are used to",
    intensity: "multi-pad",
    newOpts: [
      "Conduct routine penetration tests against all deployed systems",                                                  // 62
      "Classify vulnerability severity rankings by overall business impact",                                              // 67
      "Provide prescriptive secure configuration guidance for operating systems and applications",                        // ✓ 89
      "Monitor live network traffic for threat indicators in real time",                                                   // 62
    ],
  },
  {
    videoId: "2.3.12", kind: "mc", index: 2,
    expectedOldStemPrefix: "Which approach BEST prevents misconfiguration vulnerabilities at scale",
    intensity: "simple-pad",
    newOpts: [
      "Manual review of each system individually by a system admin",                                       // 59
      "Configuration management using secure baselines and automated compliance scanning",                 // ✓ 81
      "Replacing all systems with brand new hardware every year",                                          // 55
      "Using only fully managed cloud services for all infrastructure",                                    // 62
    ],
  },

  // ─── §2.3.13 Mobile Device Vulnerabilities ────────────────────────────
  {
    videoId: "2.3.13", kind: "mc", index: 1,
    expectedOldStemPrefix: "A SIM swapping attack involves",
    intensity: "multi-pad",
    newOpts: [
      "Physically cloning a SIM card using a specialized hardware reader device",                                              // 72
      "Intercepting SMS messages while they are in transit between mobile carriers",                                           // 75
      "Social engineering a mobile carrier into transferring a victim's phone number to an attacker-controlled SIM",          // ✓ 107
      "Installing malware on a phone via a malicious app from the official store",                                              // 74
    ],
  },
  {
    videoId: "2.3.13", kind: "mc", index: 2,
    expectedOldStemPrefix: "MDM helps secure mobile devices by",
    intensity: "multi-pad",
    newOpts: [
      "Enforcing security policies, detecting jailbroken/rooted devices, and enabling remote wipe",   // ✓ 90
      "Physically securing devices using lockable hardware containers",                                 // 61
      "Encrypting all Bluetooth connections between devices automatically",                              // 66
      "Preventing SIM swapping attempts at the mobile carrier level",                                    // 60
    ],
  },
];

// ─── Apply (mirror of fix-short-distractors-d1.4.mjs) ─────────────────────
let applied = 0, skipped = 0, refused = 0;
const log = [];
for (const r of REPLACEMENTS) {
  const sec = data.find((s) => s.id === r.videoId.split(".").slice(0, 2).join("."));
  if (!sec) { console.error(`section not found for ${r.videoId}`); refused++; continue; }
  const vid = sec.videos.find((v) => v.id === r.videoId);
  if (!vid) { console.error(`video not found for ${r.videoId}`); refused++; continue; }
  const list = r.kind === "mc" ? vid.questions : vid.scenarios;
  const item = list?.[r.index];
  if (!item) { console.error(`item not found at ${r.videoId} ${r.kind}[${r.index}]`); refused++; continue; }
  if (!item.q.startsWith(r.expectedOldStemPrefix)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — stem mismatch`);
    console.error(`  expected: "${r.expectedOldStemPrefix}…"`);
    console.error(`  actual:   "${item.q.slice(0, 80)}…"`);
    refused++;
    continue;
  }
  const sameOpts = r.newOpts.length === item.opts.length &&
    r.newOpts.every((o, i) => o === item.opts[i]);
  if (sameOpts) { skipped++; continue; }
  const currentCorrect = item.opts[item.a];
  if (!r.newOpts.includes(currentCorrect)) {
    console.error(`REFUSING ${r.videoId} ${r.kind}[${r.index}] — current correct option not in newOpts`);
    console.error(`  current correct: "${currentCorrect}"`);
    console.error(`  newOpts: ${JSON.stringify(r.newOpts.map((o) => o.slice(0, 50)))}`);
    refused++;
    continue;
  }
  const newA = r.newOpts.indexOf(currentCorrect);
  log.push({ qid: `${r.kind}-${r.videoId}-${r.index}`, intensity: r.intensity, oldOpts: item.opts.slice(), newOpts: r.newOpts, oldA: item.a, newA });
  if (write || preview) {
    item.opts = r.newOpts.slice();
    item.a = newA;
  }
  applied++;
}

console.log(`\nFix plan ${write ? "(APPLY mode)" : preview ? "(PREVIEW mode)" : "(DRY-RUN)"}`);
console.log(`Total REPLACEMENTS: ${REPLACEMENTS.length}`);
console.log(`  applied:  ${applied}`);
console.log(`  skipped (idempotent): ${skipped}`);
console.log(`  refused (safety): ${refused}`);
const intensityCounts = {};
for (const l of log) intensityCounts[l.intensity] = (intensityCounts[l.intensity] || 0) + 1;
console.log(`Intensity:`, intensityCounts);

if (write || preview) {
  const target = write ? jsonPath : previewPath;
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWrote to ${target}`);
  if (preview) {
    console.log(`Validate preview: node scripts/validate-questions.mjs --path=${previewPath} --quiet`);
    console.log(`Audit preview:    node scripts/audit-short-distractor-cohort.mjs --path=${previewPath} --domain=2`);
  }
} else {
  console.log(`\n(Dry-run: no file changes. Re-run with --preview or --write.)`);
}
