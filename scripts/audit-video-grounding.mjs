// Audit whether each question's content is supported by the cited Messer
// transcript. For every question:
//   1. Pre-check: has citation, citation valid, transcript present, transcript ≥2000 chars
//   2. Extract central concept(s) from stem + correct option
//   3. Build keyword set with synonyms/acronym expansions
//   4. Score: PASS / LOW (sanity) / MEDIUM / HIGH (flagged)
//
// Output: per-sub-objective summary + flag list sorted HIGH-first.
// SKIP-AND-FLAG on every pre-check failure; nothing scored that hasn't been verified.
//
// Usage:
//   node scripts/audit-video-grounding.mjs --domain=1
//   node scripts/audit-video-grounding.mjs --domain=1 --details

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const cacheDir = resolve(repo, ".messer-transcripts");

const args = process.argv.slice(2);
const domainArg = args.find((a) => a.startsWith("--domain="))?.split("=")[1];
const showDetails = args.includes("--details");
if (!domainArg) {
  console.error("Usage: --domain=N (1-5)");
  process.exit(2);
}
const targetDomain = domainArg.toString();

// ─── Load MESSER_VIDEOS.md → title → section + slug ────────────────
const messerMd = readFileSync(resolve(repo, "MESSER_VIDEOS.md"), "utf8");
const validCitations = new Set(); // "X.Y - Title" form
const citationToSlug = new Map(); // "X.Y - Title" → slug
let curSec = null;
for (const line of messerMd.split("\n")) {
  const sec = line.match(/^### (\d+\.\d+)\s+[–-]\s+(.+)$/);
  if (sec) { curSec = sec[1]; continue; }
  const vid = line.match(/^-\s+(.+)$/);
  if (vid && curSec) {
    const title = vid[1].trim();
    const cite = `${curSec} - ${title}`;
    validCitations.add(cite);
    // Slug: lowercase, spaces→hyphens, append -sy0-701
    const slug = title.toLowerCase()
      .replace(/[,'']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + "-sy0-701";
    citationToSlug.set(cite, slug);
  }
}

// ─── Synonym / acronym expansion map ───────────────────────────────
// Each entry: a "central key" → list of variants that are equivalent.
const SYNONYMS = {
  "mfa": ["mfa", "multi-factor authentication", "multifactor authentication", "two-factor", "2fa"],
  "edr": ["edr", "endpoint detection and response", "endpoint detection"],
  "xdr": ["xdr", "extended detection and response"],
  "mdr": ["mdr", "managed detection and response"],
  "siem": ["siem", "security information and event management", "security information"],
  "soar": ["soar", "security orchestration"],
  "dlp": ["dlp", "data loss prevention"],
  "pki": ["pki", "public key infrastructure"],
  "aaa": ["aaa", "authentication, authorization, and accounting", "authentication authorization and accounting"],
  "cia": ["cia triad", "confidentiality, integrity", "confidentiality integrity availability"],
  "waf": ["waf", "web application firewall"],
  "ngfw": ["ngfw", "next-generation firewall", "next generation firewall"],
  "tls": ["tls", "transport layer security"],
  "vpn": ["vpn", "virtual private network"],
  "mdm": ["mdm", "mobile device management"],
  "saml": ["saml", "security assertion markup language"],
  "oauth": ["oauth", "open authorization"],
  "oidc": ["oidc", "openid connect"],
  "ddos": ["ddos", "distributed denial of service", "distributed denial-of-service"],
  "csrf": ["csrf", "cross-site request forgery"],
  "xss": ["xss", "cross-site scripting"],
  "sqli": ["sqli", "sql injection"],
  "apt": ["apt", "advanced persistent threat"],
  "byod": ["byod", "bring your own device"],
  "cope": ["cope", "corporate-owned"],
  "cyod": ["cyod", "choose your own device"],
  "wps": ["wps", "wi-fi protected setup", "wifi protected setup"],
  "rat": ["rat", "remote access trojan"],
  "hids": ["hids", "host intrusion detection"],
  "hips": ["hips", "host intrusion prevention"],
  "nips": ["nips", "network intrusion prevention"],
  "nids": ["nids", "network intrusion detection"],
  "nac": ["nac", "network access control"],
  "ioc": ["ioc", "indicators of compromise", "indicator of compromise"],
  "rbac": ["rbac", "role-based access control"],
  "abac": ["abac", "attribute-based access control"],
  "mac": ["mac", "mandatory access control"],
  "dac": ["dac", "discretionary access control"],
  "spf": ["spf", "sender policy framework"],
  "dkim": ["dkim", "domainkeys identified mail"],
  "dmarc": ["dmarc"],
  "block list": ["block list", "blocklist", "deny list", "denylist"],
  "allow list": ["allow list", "allowlist", "whitelist", "white list"],
  "zero trust": ["zero trust", "zero-trust"],
  "ssh": ["ssh", "secure shell"],
  "snmp": ["snmp", "simple network management protocol"],
  "ssl": ["ssl", "secure sockets layer"],
  "https": ["https", "http over tls", "http over ssl"],
  "fido2": ["fido2", "fido 2", "webauthn"],
  "totp": ["totp", "time-based one-time password"],
  "sast": ["sast", "static application security testing"],
  "dast": ["dast", "dynamic application security testing"],
  "cvss": ["cvss", "common vulnerability scoring system"],
  "cve": ["cve", "common vulnerabilities and exposures"],
  "epss": ["epss", "exploit prediction scoring system"],
  "ntlm": ["ntlm", "nt lan manager"],
  "kerberos": ["kerberos"],
  "fim": ["fim", "file integrity monitoring"],
  "lolbin": ["lolbin", "living off the land", "living-off-the-land"],
  "wpa3": ["wpa3", "wpa 3"],
  "wpa2": ["wpa2", "wpa 2"],
  "sae": ["sae", "simultaneous authentication of equals", "dragonfly"],
  "macsec": ["macsec", "ieee 802.1ae"],
  "pam": ["pam", "privileged access management"],
  "pasm": ["pasm", "privileged account and session management"],
  "pedm": ["pedm", "privilege elevation"],
  "jit": ["jit", "just-in-time", "just in time"],
};

// Build reverse lookup: any variant → set of all variants in its group
const variantToGroup = new Map();
for (const [key, variants] of Object.entries(SYNONYMS)) {
  for (const v of variants) variantToGroup.set(v.toLowerCase(), new Set(variants.map((x) => x.toLowerCase())));
}

function expandKeyword(kw) {
  const lc = kw.toLowerCase().trim();
  const group = variantToGroup.get(lc);
  return group ? [...group] : [lc];
}

// ─── Concept extraction from question ──────────────────────────────
function extractConcepts(stem, correctOption) {
  const concepts = new Set();

  // Pattern: "Which BEST [verb] [a/an/the] X?" or "X from Y" or "X (vs ...)"
  let m;
  const patterns = [
    /Which BEST (?:defines?|describes?|captures?|distinguishes?|explains?|exemplifies)\s+(?:a |an |the |why )?(.{3,60}?)(?:\?|\.|$|\s+from\s+|\s+\(|;)/i,
    /Which (?:is|are) (?:a |an |the )?BEST\s+(.{3,60}?)(?:\?|\.|$)/i,
    /(.{3,60}?)\s+is\s+BEST\s+(?:defined|described|classified)\s+as/i,
    /What (?:is|are)\s+(?:a |an |the )?(.{3,60}?)\?/i,
    /Which (?:of the following)?\s*(?:is|describes|defines|exemplifies)\s+(?:a |an |the )?(.{3,60}?)\?/i,
  ];
  for (const p of patterns) {
    m = stem.match(p);
    if (m) {
      const term = m[1].trim().replace(/[?.,;:]+$/, "");
      if (term.length >= 3 && term.length <= 60) concepts.add(term.toLowerCase());
      break;
    }
  }

  // Acronyms: 2-6 all-caps letters
  const acronyms = (stem + " " + correctOption).match(/\b[A-Z][A-Z0-9]{1,5}\b/g) || [];
  for (const a of acronyms) {
    const lc = a.toLowerCase();
    // Skip common English: "USB", "CPU" are fine; "I", "OK", "AS" filter inappropriate?
    if (lc.length < 2) continue;
    if (["the", "and", "but", "for", "out", "use", "can", "all", "any", "may", "see"].includes(lc)) continue;
    concepts.add(lc);
  }

  // Pull notable phrases from stem (multi-word capitalized noun phrases)
  const phrases = stem.match(/\b[A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[a-z]{2,}|\d+))+\b/g) || [];
  for (const ph of phrases) {
    if (ph.length >= 8 && ph.length <= 50) concepts.add(ph.toLowerCase());
  }

  // Pull notable nouns from correct option (lowercase nouns ≥6 chars)
  const optWords = correctOption.toLowerCase().match(/\b[a-z][a-z\-]{5,}\b/g) || [];
  const stopwords = new Set(["because", "without", "through", "between", "across", "different", "various", "process", "system", "service", "control", "certain", "common", "general", "across", "within", "during", "should", "always", "never", "either", "neither", "another", "several", "policy", "policies", "include", "includes", "includes", "compared", "applied", "actions", "options", "answers", "ensures", "provides"]);
  for (const w of optWords.slice(0, 8)) if (!stopwords.has(w)) concepts.add(w);

  return [...concepts];
}

// ─── Main ──────────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));
const sections = data.filter((s) => s.id && s.id.startsWith(targetDomain + "."));

const skipped = []; // { loc, reason }
const flagged = []; // { loc, sub, stem, citation, conf, sample }
const passed = []; // { sub }

let totalSeen = 0;

for (const sec of sections) {
  for (const v of sec.videos) {
    const sub = v.id;
    for (const kind of ["questions", "scenarios"]) {
      const items = v[kind] || [];
      items.forEach((q, i) => {
        totalSeen++;
        const loc = `§${sub} ${kind === "questions" ? "mc" : "scen"}[${i}]`;
        if (!q.messerVideo) { skipped.push({ loc, reason: "uncited" }); return; }
        if (!validCitations.has(q.messerVideo)) { skipped.push({ loc, reason: `bad-citation (${q.messerVideo})` }); return; }
        const slug = citationToSlug.get(q.messerVideo);
        const txtPath = resolve(cacheDir, `${slug}.txt`);
        if (!existsSync(txtPath)) { skipped.push({ loc, reason: `no-transcript (${slug})` }); return; }
        let txt;
        try { txt = readFileSync(txtPath, "utf8"); }
        catch (e) { skipped.push({ loc, reason: `read-error: ${e.message}` }); return; }
        if (txt.length < 2000) { skipped.push({ loc, reason: `bad-transcript (${txt.length}ch)` }); return; }
        const txtLc = txt.toLowerCase();

        // Extract concepts from stem + correct option
        const stem = q.q || "";
        const correctOpt = (q.opts && typeof q.a === "number") ? (q.opts[q.a] || "") : "";
        const concepts = extractConcepts(stem, correctOpt);

        if (concepts.length === 0) {
          flagged.push({ loc, sub, stem: stem.slice(0, 80), citation: q.messerVideo, conf: "MEDIUM", sample: "no-concepts-extracted" });
          return;
        }

        // First concept treated as central; rest as supporting.
        const central = concepts[0];
        const centralVariants = expandKeyword(central);
        const centralFound = centralVariants.some((v) => txtLc.includes(v));

        const supportingFoundCount = concepts.slice(1).filter((c) => {
          const vs = expandKeyword(c);
          return vs.some((v) => txtLc.includes(v));
        }).length;
        const supportingTotal = Math.max(1, concepts.length - 1);

        // Confidence:
        //   HIGH  = central absent AND no supporting found
        //   MEDIUM= central absent but some supporting found
        //   LOW   = central present (sanity flag for review)
        //   PASS  = central present and ≥50% supporting
        let conf, sample;
        if (!centralFound && supportingFoundCount === 0) {
          conf = "HIGH";
          sample = `central="${central}" + 0/${supportingTotal} supporting`;
        } else if (!centralFound && supportingFoundCount > 0) {
          conf = "MEDIUM";
          sample = `central="${central}" missing; ${supportingFoundCount}/${supportingTotal} supporting present`;
        } else if (centralFound && supportingFoundCount / supportingTotal >= 0.5) {
          conf = "PASS";
          sample = `central="${central}" + ${supportingFoundCount}/${supportingTotal} supporting`;
        } else {
          conf = "LOW";
          sample = `central="${central}" present, supporting weak (${supportingFoundCount}/${supportingTotal})`;
        }

        if (conf === "PASS") passed.push({ sub });
        else flagged.push({ loc, sub, stem: stem.slice(0, 80), citation: q.messerVideo, conf, sample });
      });
    }
  }
}

// ─── Report ────────────────────────────────────────────────────────
console.log(`\nDomain ${targetDomain} video-grounding audit`);
console.log("═".repeat(70));
console.log(`Total questions seen:       ${totalSeen}`);
console.log(`  Skipped (pre-check fail): ${skipped.length}`);
console.log(`  Audited:                  ${totalSeen - skipped.length}`);
console.log(`    PASS: ${passed.length}`);
console.log(`    LOW (sanity):  ${flagged.filter((f) => f.conf === "LOW").length}`);
console.log(`    MEDIUM:        ${flagged.filter((f) => f.conf === "MEDIUM").length}`);
console.log(`    HIGH (flag):   ${flagged.filter((f) => f.conf === "HIGH").length}`);

console.log("\nSkip reasons:");
const byReason = {};
for (const s of skipped) {
  const k = s.reason.split(" (")[0];
  byReason[k] = (byReason[k] || 0) + 1;
}
for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(4)}  ${r}`);
}

// Per-sub-objective table
const bySub = {};
for (const p of passed) (bySub[p.sub] = bySub[p.sub] || { pass: 0, low: 0, med: 0, high: 0 }).pass++;
for (const f of flagged) {
  bySub[f.sub] = bySub[f.sub] || { pass: 0, low: 0, med: 0, high: 0 };
  if (f.conf === "LOW") bySub[f.sub].low++;
  else if (f.conf === "MEDIUM") bySub[f.sub].med++;
  else bySub[f.sub].high++;
}
console.log("\nPer-sub-objective summary (pass / LOW / MED / HIGH):");
for (const sub of Object.keys(bySub).sort()) {
  const s = bySub[sub];
  console.log(`  §${sub.padEnd(7)}  ${s.pass.toString().padStart(3)} / ${s.low.toString().padStart(2)} / ${s.med.toString().padStart(2)} / ${s.high.toString().padStart(2)}`);
}

// HIGH flags first (most actionable)
const highFirst = flagged.sort((a, b) => {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return order[a.conf] - order[b.conf];
});

if (showDetails) {
  console.log("\nFull flag list (HIGH first):");
  for (const f of highFirst) {
    console.log(`  [${f.conf.padEnd(6)}] ${f.loc.padEnd(22)} ${f.citation}`);
    console.log(`             stem: "${f.stem}..."`);
    console.log(`             ${f.sample}`);
  }
} else {
  // Sample top 10 HIGH flags
  const sampleHigh = highFirst.filter((f) => f.conf === "HIGH").slice(0, 10);
  if (sampleHigh.length > 0) {
    console.log("\nSample HIGH flags (top 10):");
    for (const f of sampleHigh) {
      console.log(`  ${f.loc.padEnd(22)} ${f.citation}`);
      console.log(`    stem: "${f.stem}..."`);
      console.log(`    ${f.sample}`);
    }
  }
}
