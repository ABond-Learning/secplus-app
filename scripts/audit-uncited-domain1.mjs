// Audit uncited Domain 1 MCs to plan citation backfill.
//
// For each uncited question, derive the IMPLICIT citation from its position in
// the JSON tree (which video it's filed under), then run a plausibility check
// against the transcript: does the central concept the question tests actually
// appear in the cited video?
//
// Output sorted by plausibility:
//   HIGH   = central concept clearly present in transcript (multiple matches);
//            citation is correct, just missing the field — safe to backfill
//   MEDIUM = central concept present but weakly (1-2 matches); worth spot-check
//   LOW    = central concept absent; question may be MISFILED (citation wrong)
//
// SKIP-AND-FLAG on pre-check failure (can't derive citation, transcript missing).
// No mutations — pure diagnostic.
//
// Usage:
//   node scripts/audit-uncited-domain1.mjs                 # summary + samples
//   node scripts/audit-uncited-domain1.mjs --details       # full per-item list
//   node scripts/audit-uncited-domain1.mjs --json=out.json # write structured output

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const cacheDir = resolve(repo, ".messer-transcripts");

const args = process.argv.slice(2);
const showDetails = args.includes("--details");
const jsonOut = args.find((a) => a.startsWith("--json="))?.split("=")[1];

// ─── Validate citations from MESSER_VIDEOS.md ─────────────────────
const messerMd = readFileSync(resolve(repo, "MESSER_VIDEOS.md"), "utf8");
const validCitations = new Set();
const citationToSlug = new Map();
let curSec = null;
for (const line of messerMd.split("\n")) {
  const sec = line.match(/^### (\d+\.\d+)\s+[–-]\s+(.+)$/);
  if (sec) { curSec = sec[1]; continue; }
  const vid = line.match(/^-\s+(.+)$/);
  if (vid && curSec) {
    const cite = `${curSec} - ${vid[1].trim()}`;
    validCitations.add(cite);
    const slug = vid[1].trim().toLowerCase()
      .replace(/[,'']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + "-sy0-701";
    citationToSlug.set(cite, slug);
  }
}

// ─── Synonym/acronym expansion (same as grounding audit) ──────────
const SYNONYMS = {
  "mfa": ["mfa", "multi-factor authentication", "multifactor authentication", "two-factor"],
  "aaa": ["aaa", "authentication, authorization, and accounting", "authentication authorization and accounting"],
  "cia": ["cia triad", "confidentiality, integrity", "confidentiality integrity availability"],
  "pki": ["pki", "public key infrastructure"],
  "tls": ["tls", "transport layer security"],
  "ssl": ["ssl", "secure sockets layer"],
  "vpn": ["vpn", "virtual private network"],
  "scada": ["scada", "industrial control", "control system"],
  "ics": ["ics", "industrial control system"],
  "ca": ["ca", "certificate authority", "certification authority"],
  "csr": ["csr", "certificate signing request"],
  "crl": ["crl", "certificate revocation list"],
  "ocsp": ["ocsp", "online certificate status protocol"],
  "aes": ["aes", "advanced encryption standard"],
  "des": ["des", "data encryption standard"],
  "rsa": ["rsa"],
  "ecc": ["ecc", "elliptic curve"],
  "sha": ["sha", "secure hash algorithm"],
  "md5": ["md5"],
  "hmac": ["hmac", "hash-based message authentication"],
  "kek": ["kek", "key encryption key"],
  "tpm": ["tpm", "trusted platform module"],
  "hsm": ["hsm", "hardware security module"],
  "ssh": ["ssh", "secure shell"],
  "https": ["https", "http over tls"],
  "non-repudiation": ["non-repudiation", "nonrepudiation"],
  "zero trust": ["zero trust", "zero-trust"],
  "honeypot": ["honeypot", "honey pot", "honeynet"],
  "honeyfile": ["honeyfile", "honey file"],
  "honeytoken": ["honeytoken", "honey token"],
  "deception": ["deception", "deceptive"],
  "disruption": ["disruption", "disruptive"],
  "rfid": ["rfid", "radio frequency identification"],
  "cab": ["cab", "change advisory board"],
  "rfc": ["rfc", "request for change"],
  "stand-by": ["stand-by", "standby"],
  "rollback": ["rollback", "roll back", "back out"],
  "key escrow": ["key escrow", "escrow"],
  "data masking": ["data masking", "masking"],
  "tokenization": ["tokenization", "tokenize"],
  "stenography": ["steganography", "stenography"],
  "blockchain": ["blockchain", "block chain", "distributed ledger"],
  "digital signature": ["digital signature", "digital signing"],
  "salt": ["salt", "salting"],
  "wildcard certificate": ["wildcard certificate", "wildcard cert"],
  "self-signed": ["self-signed", "self signed"],
  "root of trust": ["root of trust", "trust anchor"],
};
const variantToGroup = new Map();
for (const variants of Object.values(SYNONYMS)) {
  const set = new Set(variants.map((v) => v.toLowerCase()));
  for (const v of variants) variantToGroup.set(v.toLowerCase(), set);
}
function expandKeyword(kw) {
  const lc = kw.toLowerCase().trim();
  return variantToGroup.has(lc) ? [...variantToGroup.get(lc)] : [lc];
}

// ─── Central-concept extractor (tuned per Domain 1 audit findings) ──
const STOPWORDS = new Set([
  "best", "most", "which", "what", "the", "a", "an", "is", "are", "of", "to", "in",
  "primary", "primarily", "first", "least", "greatest", "should", "would", "could",
  "following", "above", "below", "and", "or", "but", "for", "from", "with", "as",
  "any", "all", "some", "many", "few", "this", "that", "these", "those",
  "true", "false", "correct", "incorrect", "valid", "invalid",
  "best defines", "best describes", "best captures", "best explains", "best distinguishes",
]);

function cleanCandidate(s) {
  return s.replace(/^(?:a |an |the )/i, "")
    .replace(/[?.,;:!"'()]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractCentralConcept(stem, correctOption) {
  // Patterns ordered by specificity (most specific first)
  const patterns = [
    /^Which BEST (?:defines?|describes?|captures?|distinguishes?|explains?|exemplifies)\s+(?:a |an |the |why )?(.{3,60}?)(?:\?|\.|$|\s+from\s+|\s+\(|;|\s+as\b|,\s+)/i,
    /^Which (?:is|are) (?:a |an |the )?BEST\s+(.{3,60}?)(?:\?|\.|$|\s+for\b|,\s+)/i,
    /^(.{3,60}?)\s+is\s+BEST\s+(?:defined|described|classified)\s+as/i,
    /^What (?:is|are)\s+(?:a |an |the )?(.{3,60}?)\?/i,
    /^Which (?:of the following)?\s*(?:is|describes|defines|exemplifies|illustrates)\s+(?:a |an |the )?(.{3,60}?)\?/i,
    // Terminology stems: "Phishing is:" / "RFID is used to:"
    /^([A-Z][A-Za-z0-9\-]{2,}(?:\s+[a-zA-Z0-9\-]{2,}){0,3})\s+(?:is|are|refers to|describes|involves|works by|allows|provides)\s*:/,
  ];
  for (const p of patterns) {
    const m = stem.match(p);
    if (m) {
      const c = cleanCandidate(m[1]);
      if (c && c.length >= 3 && !STOPWORDS.has(c)) return c;
    }
  }
  // Fallback: pick the most-specific noun from the correct option
  // (first multi-word capitalized phrase or known acronym)
  const acronym = (correctOption.match(/\b[A-Z][A-Z0-9]{2,5}\b/) || [])[0];
  if (acronym) return acronym.toLowerCase();
  return null;
}

function buildSupportingKeywords(stem, correctOption) {
  // Pull additional keywords from the correct option (lowercase nouns ≥6 chars not in stopwords)
  const supporting = new Set();
  const words = correctOption.toLowerCase().match(/\b[a-z][a-z\-]{5,}\b/g) || [];
  const stop = new Set(["because", "without", "through", "between", "across", "different", "various", "process", "system", "service", "control", "certain", "common", "general", "within", "during", "should", "always", "never", "either", "neither", "another", "several", "policy", "policies", "include", "includes", "compared", "applied", "actions", "options", "answers", "ensures", "provides", "occurs", "exists", "contains", "represents"]);
  for (const w of words) if (!stop.has(w) && supporting.size < 6) supporting.add(w);
  return [...supporting];
}

// ─── Walk Domain 1 tree ───────────────────────────────────────────
const data = JSON.parse(readFileSync(resolve(repo, "questions.json"), "utf8"));
const d1 = data.filter((s) => s.id && s.id.startsWith("1."));

const high = [], medium = [], low = [], skipped = [];

for (const sec of d1) {
  for (const v of sec.videos) {
    const sub = v.id;          // e.g. "1.2.1"
    const subObj = sub.split(".").slice(0, 2).join("."); // "1.2"
    const implicitCite = `${subObj} - ${v.title}`;

    for (const kind of ["questions", "scenarios"]) {
      const items = v[kind] || [];
      items.forEach((q, i) => {
        if (q.messerVideo && q.subObjective) return; // already cited
        const loc = `§${sub} ${kind === "questions" ? "mc" : "scen"}[${i}]`;

        // Pre-check: implicit citation must map to MESSER_VIDEOS.md
        if (!validCitations.has(implicitCite)) {
          skipped.push({ loc, reason: `bad-implicit-citation (${implicitCite})`, stem: (q.q || "").slice(0, 100) });
          return;
        }
        const slug = citationToSlug.get(implicitCite);
        const txtPath = resolve(cacheDir, `${slug}.txt`);
        if (!existsSync(txtPath)) {
          skipped.push({ loc, reason: `no-transcript (${slug})`, stem: (q.q || "").slice(0, 100) });
          return;
        }
        const txt = readFileSync(txtPath, "utf8");
        if (txt.length < 2000) {
          skipped.push({ loc, reason: `bad-transcript (${txt.length}ch)`, stem: (q.q || "").slice(0, 100) });
          return;
        }
        const txtLc = txt.toLowerCase();

        // Extract central concept (tuned)
        const stem = q.q || "";
        const correctOpt = (q.opts && typeof q.a === "number") ? (q.opts[q.a] || "") : "";
        const central = extractCentralConcept(stem, correctOpt);
        const supporting = buildSupportingKeywords(stem, correctOpt);

        if (!central) {
          // No central extracted — score by supporting alone (best-effort)
          const supportingHits = supporting.filter((s) => txtLc.includes(s)).length;
          const item = {
            loc, sub, implicitCite, stem: stem.slice(0, 100), central: "(none)",
            supporting, supportingHits, supportingTotal: supporting.length,
          };
          if (supportingHits === 0) low.push({ ...item, score: "LOW", note: "no central extracted; 0 supporting matched" });
          else if (supportingHits / supporting.length >= 0.5) medium.push({ ...item, score: "MEDIUM", note: "no central extracted; supporting partial" });
          else low.push({ ...item, score: "LOW", note: "no central extracted; supporting weak" });
          return;
        }

        // Plausibility: count central-keyword variant occurrences in transcript
        const variants = expandKeyword(central);
        let centralHits = 0;
        for (const variant of variants) {
          const re = new RegExp("\\b" + variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
          centralHits += (txtLc.match(re) || []).length;
        }
        const supportingHits = supporting.filter((s) => txtLc.includes(s)).length;

        const item = {
          loc, sub, implicitCite, stem: stem.slice(0, 100), central,
          centralHits, supportingHits, supportingTotal: supporting.length,
          slug,
        };

        if (centralHits >= 3) high.push({ ...item, score: "HIGH", note: `central appears ${centralHits}× in transcript` });
        else if (centralHits >= 1) medium.push({ ...item, score: "MEDIUM", note: `central appears only ${centralHits}× in transcript; supporting ${supportingHits}/${supporting.length}` });
        else low.push({ ...item, score: "LOW", note: `central "${central}" absent from transcript; supporting ${supportingHits}/${supporting.length} — possible misfile` });
      });
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────
const totalAudited = high.length + medium.length + low.length;
console.log("\nDomain 1 uncited-citation backfill audit");
console.log("═".repeat(70));
console.log(`Total uncited Domain 1 questions: ${totalAudited + skipped.length}`);
console.log(`  Skipped (pre-check fail): ${skipped.length}`);
console.log(`  Audited:                  ${totalAudited}`);
console.log(`    HIGH   (safe to backfill):       ${high.length}`);
console.log(`    MEDIUM (worth spot-check):       ${medium.length}`);
console.log(`    LOW    (citation may be wrong):  ${low.length}`);

if (skipped.length > 0) {
  console.log("\nSkipped items:");
  for (const s of skipped) console.log(`  ${s.loc.padEnd(20)} ${s.reason}`);
}

console.log("\nPer-sub-objective breakdown (HIGH / MEDIUM / LOW):");
const bySub = {};
for (const it of [...high, ...medium, ...low]) {
  bySub[it.sub] = bySub[it.sub] || { high: 0, med: 0, low: 0, video: it.implicitCite };
  if (it.score === "HIGH") bySub[it.sub].high++;
  else if (it.score === "MEDIUM") bySub[it.sub].med++;
  else bySub[it.sub].low++;
}
for (const sub of Object.keys(bySub).sort()) {
  const s = bySub[sub];
  console.log(`  §${sub.padEnd(7)} ${s.high.toString().padStart(2)} / ${s.med.toString().padStart(2)} / ${s.low.toString().padStart(2)}   (${s.video})`);
}

// Sample LOW (most suspicious) and a few HIGH (sanity)
console.log("\n=== LOW plausibility (citation may be wrong — possible misfile, ALL listed) ===");
for (const it of low) {
  console.log(`  ${it.loc.padEnd(20)} cite: "${it.implicitCite}"`);
  console.log(`    stem: "${it.stem}..."`);
  console.log(`    central: "${it.central}"  → ${it.note}`);
}

console.log("\n=== Sample HIGH (citation correct, safe to backfill — first 5) ===");
for (const it of high.slice(0, 5)) {
  console.log(`  ${it.loc.padEnd(20)} cite: "${it.implicitCite}"`);
  console.log(`    stem: "${it.stem}..."`);
  console.log(`    central: "${it.central}"  → ${it.note}`);
}

console.log("\n=== Sample MEDIUM (worth spot-check — first 5) ===");
for (const it of medium.slice(0, 5)) {
  console.log(`  ${it.loc.padEnd(20)} cite: "${it.implicitCite}"`);
  console.log(`    stem: "${it.stem}..."`);
  console.log(`    central: "${it.central}"  → ${it.note}`);
}

if (showDetails) {
  console.log("\n=== Full HIGH list ===");
  for (const it of high) console.log(`  ${it.loc.padEnd(20)} ${it.central.padEnd(30)} ${it.note}`);
  console.log("\n=== Full MEDIUM list ===");
  for (const it of medium) console.log(`  ${it.loc.padEnd(20)} ${it.central.padEnd(30)} ${it.note}`);
}

if (jsonOut) {
  writeFileSync(resolve(repo, jsonOut), JSON.stringify({ high, medium, low, skipped }, null, 2));
  console.log(`\nStructured output written to ${jsonOut}`);
}
