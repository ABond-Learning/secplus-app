// Curated British → American spelling rules for Security+ content.
//
// DESIGN
//
// Each rule has:
//   family : tag for grouping in reports ("ise", "our", "re", "ce", "ogue",
//            "double-l", "il-to-ill", "word", "flag")
//   pattern: case-insensitive global RegExp matching the British form
//   fix    : function that takes the captured tail (or "") and returns the
//            American replacement in lowercase. Case is preserved separately.
//   note   : optional human-readable explanation
//
// Rules deliberately EXCLUDE words that look British but are identical in
// American English. The Greek-origin -ize verbs change; Latin/French -ise verbs
// do not. Excluded (do NOT add): advertise, advise, apprise, arise, chastise,
// compromise, comprise, demise, despise, devise, disguise, enterprise,
// excise, exercise, expertise, franchise, improvise, incise, merchandise,
// noise, premise, prise, promise, raise, revise, supervise, surmise, surprise,
// televise. Also NOT changed: emphasis (noun), analysis (noun), basis, crisis.
//
// SUFFIX PATTERN for -ise verbs:
//   matches stem + "s" + one of (e | ed | es | ing | ation | ations | er | ers)
//   followed by a word boundary. Captures the suffix so the replacement keeps
//   it (e.g. "organising" → "organizing").
//
// AMBIGUOUS CASES — see FLAG_ONLY rules at bottom. These are not auto-fixed.

// Suffix family for -ise verbs and their derived nouns/adjectives.
// "ational"/"ationally" cover the adjective forms (organisational, etc.) —
// added after audit found 6 missed 'organisational' hits.
const ISE_SUFFIX = "(e|ed|es|ing|ation|ations|ational|ationally|er|ers)";

// Build an -ise rule for a stem (e.g. "authori" matches authorise/d/s/ing/ation/ations/er/ers).
// No leading \b — that lets us catch prefixed forms (unauthorised, unsanitised,
// non-authorised, subcategorised, etc.). Stems are specific enough that they
// don't accidentally match inside unrelated words when constrained by the strict
// trailing verb-suffix + word boundary.
const ise = (stem) => ({
  family: "ise",
  pattern: new RegExp(`${stem}s${ISE_SUFFIX}\\b`, "gi"),
  fix: (suffix) => `${stem}z${suffix}`,
});

// Substring rule (purely additive at the start; suffix forms inherit).
const sub = (family, from, to, note) => ({
  family,
  pattern: new RegExp(from, "gi"),
  fix: () => to,
  note,
});

// Whole-word rule (case-insensitive, word-bounded).
const word = (family, from, to, note) => ({
  family,
  pattern: new RegExp(`\\b${from}\\b`, "gi"),
  fix: () => to,
  note,
});

export const RULES = [
  // ─── -ise / -isation family ────────────────────────────────────────────
  // Each ise(stem) covers stem + s + (e|ed|es|ing|ation|ations|er|ers)
  ise("authori"),
  ise("organi"),
  ise("recogni"),
  ise("minimi"),
  ise("maximi"),
  ise("prioriti"),
  ise("standardi"),
  ise("customi"),
  ise("optimi"),
  ise("categori"),
  ise("centrali"),
  ise("decentrali"),
  ise("containeri"),
  ise("virtuali"),
  ise("synchroni"),
  ise("saniti"),
  ise("tokeni"),
  ise("normali"),
  ise("randomi"),
  ise("initiali"),
  ise("personali"),
  ise("parameteri"),
  ise("capitali"),
  ise("characteri"),
  ise("contextuali"),
  ise("critici"),
  ise("demilitari"),
  ise("emphasi"),       // emphasise (verb), NOT emphasis (noun) — pattern requires verb suffix
  ise("formali"),
  ise("materiali"),
  ise("neutrali"),
  ise("operationali"),
  ise("pulveri"),
  ise("reali"),
  ise("speciali"),
  ise("annuali"),
  ise("fundrai"),       // fundraiser → fundraizer? NO — see exclude. Pull back: this would mistakenly hit "fundraiser" which is correct American. Removing.
  // Removing the bad one above by re-defining without it:
];
RULES.pop(); // drop the bad fundrai entry above. Kept as a doc breadcrumb.

RULES.push(
  // -ise verbs continued
  ise("modernise".slice(0, -2)),  // "moderni"
  ise("monetise".slice(0, -2)),   // "moneti"
  ise("harmoni"),
  ise("jeopardi"),
  ise("familiari"),
  ise("summari"),
  ise("utili"),
  ise("visuali"),
  ise("legitimi"),
  ise("legali"),
  ise("itemi"),
  ise("memori"),       // memorise → memorize
  ise("hospitali"),    // hospitalise — unlikely but harmless
  ise("traumati"),
  ise("quanti"),       // quantise — rare
  ise("publici"),      // publicise → publicize

  // Narrow rule for analyse (the noun "analysis" stays unchanged).
  // This intentionally OMITS suffix "es" because "analyses" is ambiguous —
  // see FLAG_ONLY below.
  {
    family: "ise",
    pattern: /analys(e|ed|ing)\b/gi,
    fix: (suffix) => `analyz${suffix}`,
    note: "analyse/d/ing only — 'analyses' is flag-only (ambiguous noun vs verb). Leading \\b dropped to catch e.g. 'reanalysed'.",
  },

  // ─── -our → -or ────────────────────────────────────────────────────────
  // Substring rules cover all -our derivatives (behaviour/al/ally, etc.)
  sub("our", "behaviour", "behavior"),
  sub("our", "favour",    "favor"),     // favour, favours, favoured, favouring, favourable, favourably, favourite
  sub("our", "neighbour", "neighbor"),  // neighbour, neighbours, neighbouring, neighbourhood
  sub("our", "harbour",   "harbor"),
  sub("our", "colour",    "color"),
  sub("our", "honour",    "honor"),
  sub("our", "humour",    "humor"),
  sub("our", "armour",    "armor"),
  sub("our", "rumour",    "rumor"),
  sub("our", "vapour",    "vapor"),
  sub("our", "valour",    "valor"),
  sub("our", "savour",    "savor"),
  sub("our", "endeavour", "endeavor"),
  sub("our", "saviour",   "savior"),
  sub("our", "vigour",    "vigor"),
  sub("our", "splendour", "splendor"),
  sub("our", "candour",   "candor"),
  sub("our", "demeanour", "demeanor"),
  // NOTE: "labour" → "labor" intentionally OMITTED. UK political party "Labour" is
  // a proper noun. Unlikely in Sec+ content, but flag (see FLAG_ONLY) instead of fix.

  // ─── -re → -er (metathesis — explicit forms required) ─────────────────
  // Substring rules don't work here ("centred" doesn't yield "centered").
  word("re", "centre",       "center"),
  word("re", "centres",      "centers"),
  word("re", "centred",      "centered"),
  word("re", "centring",     "centering"),
  word("re", "centrepiece",  "centerpiece"),
  // Fibre Channel is the official INCITS protocol name — keep British spelling
  // when followed by " Channel" or "-Channel" (case-insensitive). Negative lookahead.
  {
    family: "re",
    pattern: /\bfibre(?![- ][Cc]hannel)/gi,
    fix: () => "fiber",
    note: "fibre → fiber, EXCEPT 'Fibre Channel' (proper noun, INCITS standard)",
  },
  word("re", "fibres", "fibers"),
  word("re", "metre",  "meter"),    // unit of length; "meter" as in watt-meter is same in both
  word("re", "metres", "meters"),
  word("re", "litre",  "liter"),
  word("re", "litres", "liters"),
  word("re", "theatre",  "theater"),
  word("re", "spectre",  "specter"),
  word("re", "calibre",  "caliber"),
  word("re", "manoeuvre", "maneuver"),
  word("re", "manoeuvres", "maneuvers"),

  // ─── -ce noun → -se noun ───────────────────────────────────────────────
  // Substring rules work (defenceless, licenced, offences all become correct).
  sub("ce", "defence",  "defense"),   // defence, defences, defenceless
  sub("ce", "offence",  "offense"),   // offence, offences
  sub("ce", "pretence", "pretense"),  // pretence, pretences
  sub("ce", "licence",  "license"),   // licence (noun), licences, licenced. American "license" is both noun + verb.
  // NOTE: "practice" (noun) is same in both. "practise" (verb, BrE only) → "practice".
  sub("ce", "practis", "practic"),    // practise, practised, practising, practises (verb forms)

  // ─── -ogue → -og ───────────────────────────────────────────────────────
  sub("ogue", "catalogue", "catalog"),  // catalogue, catalogues, catalogued, cataloguing
  sub("ogue", "analogue",  "analog"),
  sub("ogue", "dialogue",  "dialog"),
  sub("ogue", "monologue", "monolog"),
  sub("ogue", "prologue",  "prolog"),

  // ─── -mme → -m ─────────────────────────────────────────────────────────
  sub("mme", "programme", "program"),  // programme, programmes
  // NOTE: "programming"/"programmer" are same in both — substring rule above
  // doesn't match them (their "programm" is followed by ing/er, not by 'e').

  // ─── doubled-l verbs (BrE doubles, AmE doesn't, when stress isn't on last syllable) ─
  // Explicit forms only. Generic /lling/→/ling/ would break "compelling",
  // "controlling", "referring" which are correct in both.
  word("double-l", "travelling", "traveling"),
  word("double-l", "travelled",  "traveled"),
  word("double-l", "traveller",  "traveler"),
  word("double-l", "travellers", "travelers"),
  word("double-l", "modelling",  "modeling"),
  word("double-l", "modelled",   "modeled"),
  word("double-l", "modeller",   "modeler"),
  word("double-l", "labelling",  "labeling"),
  word("double-l", "labelled",   "labeled"),
  word("double-l", "cancelling", "canceling"),
  word("double-l", "cancelled",  "canceled"),
  word("double-l", "counselling","counseling"),
  word("double-l", "counsellor", "counselor"),
  word("double-l", "tunnelling", "tunneling"),
  word("double-l", "tunnelled",  "tunneled"),
  word("double-l", "channelling","channeling"),
  word("double-l", "channelled", "channeled"),
  word("double-l", "signalling", "signaling"),
  word("double-l", "signalled",  "signaled"),
  word("double-l", "jewellery",  "jewelry"),
  word("double-l", "marvelling", "marveling"),
  word("double-l", "marvelled",  "marveled"),

  // ─── -il → -ill (BrE single l, AmE double) ─────────────────────────────
  sub("il-to-ill", "skilful",    "skillful"),    // skilful, skilfully — no -ed/-ing forms
  sub("il-to-ill", "wilful",     "willful"),     // wilful, wilfully — no -ed/-ing forms
  sub("il-to-ill", "instalment", "installment"), // instalment, instalments — no -ed/-ing forms
  // fulfil/enrol need negative lookahead (?!l) — bare substring would corrupt
  // "fulfilled"/"fulfilling"/"enrolled"/"enrolling" (already double-l in BrE
  // because the l doubles before -ed/-ing) into "fulfillled" / "enrollled".
  // The lookahead lets us catch fulfil/fulfils/fulfilment (single l forms only).
  {
    family: "il-to-ill",
    pattern: /fulfil(?!l)/gi,
    fix: () => "fulfill",
    note: "matches fulfil/fulfils/fulfilment but NOT fulfilled/fulfilling (already double-l in BrE)",
  },
  {
    family: "il-to-ill",
    pattern: /enrol(?!l)/gi,
    fix: () => "enroll",
    note: "matches enrol/enrols/enrolment but NOT enrolled/enrolling (already double-l in BrE)",
  },

  // ─── individual word replacements ──────────────────────────────────────
  word("word", "whilst",     "while"),
  word("word", "amongst",    "among"),
  word("word", "ageing",     "aging"),
  word("word", "aluminium",  "aluminum"),
  word("word", "speciality", "specialty"),
  // NOTE: stylistic forms (judgement/judgment, grey/gray, learnt/spelt/burnt/dreamt/
  // leapt/spilt) deliberately excluded. Both forms appear in real American English;
  // zero CompTIA exam impact. Over-editing risks making content feel synthetic.
);

// ─── FLAG-ONLY rules (ambiguous, do not auto-fix) ──────────────────────────
export const FLAG_ONLY = [
  {
    family: "flag",
    pattern: /\banalyses\b/gi,
    note: "Ambiguous: 'analyses' is the plural of the noun 'analysis' (same in both AmE and BrE) AND the 3rd-person singular of the verb 'analyse' (AmE 'analyzes'). Resolve manually based on context.",
  },
  {
    family: "flag",
    pattern: /\blabour[a-z]*\b/gi,
    note: "Ambiguous: 'labour' (BrE common noun) → 'labor' (AmE), but 'Labour' may refer to the UK Labour Party (proper noun, leave). Resolve manually.",
  },
];

// Apply the casing of `original` to the lowercase `replacement`.
//   ALL CAPS   → ALL CAPS
//   Capitalize → Capitalize
//   lowercase  → lowercase
// Mixed-case originals fall through to lowercase replacement.
export function preserveCase(original, replacement) {
  if (original.length > 1 && original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

// Apply all auto-fix rules to a string. Returns { fixed, hits } where hits is
// an array of { family, original, replacement, index } per substitution.
export function applyRules(text) {
  const hits = [];
  let fixed = text;
  for (const rule of RULES) {
    fixed = fixed.replace(rule.pattern, (match, ...groups) => {
      // The captured tail is the first group; if no groups, pass empty string.
      const tail = typeof groups[0] === "string" ? groups[0] : "";
      const lowerReplacement = rule.fix(tail);
      const cased = preserveCase(match, lowerReplacement);
      hits.push({ family: rule.family, original: match, replacement: cased });
      return cased;
    });
  }
  return { fixed, hits };
}

// Find FLAG_ONLY hits in a string. Does NOT modify the string.
export function findFlags(text) {
  const flags = [];
  for (const rule of FLAG_ONLY) {
    for (const m of text.matchAll(rule.pattern)) {
      flags.push({ family: rule.family, original: m[0], note: rule.note });
    }
  }
  return flags;
}
