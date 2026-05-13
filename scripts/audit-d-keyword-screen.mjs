// Audit D Sub-batch 0 — Stage 1 keyword pre-screen.
//
// For each matching + cram item in the calibration sample:
//   - extract the central term (m.answer or c.term)
//   - strip parentheticals, split slashes
//   - expand via SYNONYMS map
//   - check term-present / term-absent in parent video's transcript
//
// MC + scen items are SKIPPED at this stage per orientation §S3
// (sent straight to LLM-as-judge in Stage 2).
//
// Output: .audit-working/audit-d-calibration/keyword-screen-results.json
//
// Usage: node scripts/audit-d-keyword-screen.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const OUT_DIR = resolve(repo, ".audit-working/audit-d-calibration");

// ─── SYNONYMS (copied from scripts/audit-video-grounding.mjs) ────────
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

const variantToGroup = new Map();
for (const [, variants] of Object.entries(SYNONYMS)) {
  const lc = variants.map(v => v.toLowerCase());
  const set = new Set(lc);
  for (const v of lc) variantToGroup.set(v, set);
}

function expandSynonyms(kw) {
  const lc = kw.toLowerCase().trim();
  const group = variantToGroup.get(lc);
  return group ? [...group] : [lc];
}

// ─── Term normalization ──────────────────────────────────────────────
function stripParens(s) {
  const parts = new Set();
  const main = s.replace(/\s*\([^)]+\)\s*/g, " ").trim().replace(/\s+/g, " ");
  if (main) parts.add(main);
  for (const m of s.matchAll(/\(([^)]+)\)/g)) {
    const p = m[1].trim();
    if (p) parts.add(p);
  }
  if (parts.size === 0) parts.add(s.trim());
  return [...parts];
}

function splitSlashAlternates(s) {
  // "Offline/offsite backups" → ["Offline backups", "offsite backups"]
  // "TOCTOU" (no slash) → ["TOCTOU"]
  // "client-side/server-side" → ["client-side", "server-side"]
  if (!/[A-Za-z]\/[A-Za-z]/.test(s)) return [s];
  const m = s.match(/^([\w\-]+)\/([\w\-]+)(.*)$/);
  if (m) {
    const tail = m[3];
    return [`${m[1]}${tail}`, `${m[2]}${tail}`];
  }
  return [s];
}

function buildVariants(rawTerm) {
  const v = new Set();
  for (const p of stripParens(rawTerm)) {
    for (const alt of splitSlashAlternates(p)) {
      const lc = alt.toLowerCase().trim();
      if (lc.length >= 2) v.add(lc);
      for (const exp of expandSynonyms(lc)) v.add(exp);
    }
  }
  return [...v];
}

// Short or generic words need word-boundary regex to avoid false hits
// ("rat" matching "iterator", "mac" matching "machine", etc.)
function needsWordBoundary(term) {
  if (term.length <= 4) return true;
  const generic = ["the", "and", "but", "for", "out", "use", "can", "all", "any", "may", "see",
                    "mac", "rat", "sae", "pam", "fim", "jit", "cia", "spf", "ssh", "ssl"];
  return generic.includes(term.toLowerCase());
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function checkPresence(transcriptLc, transcriptFull, variants) {
  const hits = [];
  for (const v of variants) {
    if (!v || v.length < 2) continue;
    let found = false;
    if (needsWordBoundary(v)) {
      const re = new RegExp(`\\b${escRe(v)}\\b`, "i");
      found = re.test(transcriptFull);
    } else {
      found = transcriptLc.includes(v);
    }
    if (found) hits.push(v);
  }
  return hits;
}

// ─── Main ────────────────────────────────────────────────────────────
const sample = JSON.parse(readFileSync(resolve(OUT_DIR, "sample-selection.json"), "utf8"));

const results = [];
for (const itm of sample.items) {
  if (itm.type === "mc" || itm.type === "scen") {
    results.push({
      location: { section: itm.section, video: itm.video, type: itm.type, index: itm.index },
      role: itm.role,
      stage: "skipped",
      reason: "stage-1 skipped for mc/scen per S3 (sent straight to LLM)",
    });
    continue;
  }

  const central = itm.type === "match" ? itm.item.answer : itm.item.term;
  const variants = buildVariants(central);
  const transcriptPath = resolve(repo, itm.transcript_path);

  if (!existsSync(transcriptPath)) {
    results.push({
      location: { section: itm.section, video: itm.video, type: itm.type, index: itm.index },
      role: itm.role,
      central_term: central,
      variants,
      transcript_path: itm.transcript_path,
      flag: "no-transcript",
      hits: [],
    });
    continue;
  }

  const txt = readFileSync(transcriptPath, "utf8");
  const txtLc = txt.toLowerCase();
  const hits = checkPresence(txtLc, txt, variants);
  const flag = hits.length === 0 ? "term-absent" : "term-present";

  results.push({
    location: { section: itm.section, video: itm.video, type: itm.type, index: itm.index },
    role: itm.role,
    central_term: central,
    variants,
    transcript_path: itm.transcript_path,
    transcript_size: txt.length,
    hits,
    flag,
  });
}

writeFileSync(resolve(OUT_DIR, "keyword-screen-results.json"), JSON.stringify(results, null, 2));

// ─── Summary ─────────────────────────────────────────────────────────
const summary = { "term-absent": 0, "term-present": 0, "no-transcript": 0, "skipped": 0 };
for (const r of results) summary[r.flag || r.stage]++;
console.log("Keyword-screen results:", summary);

console.log("\nSmoke-test cohort (must be term-absent):");
for (const r of results.filter(x => x.role === "smoke-test")) {
  const mark = r.flag === "term-absent" ? "✓" : "✗";
  console.log(`  ${mark} §${r.location.video} ${r.location.type}[${r.location.index}] "${r.central_term}" → ${r.flag} (hits: ${(r.hits || []).join(", ") || "none"})`);
}
