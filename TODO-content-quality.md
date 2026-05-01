# Content-Quality Backlog

Items captured for future content-quality passes — beyond the
distractor-padding scope of Sub-batch 2 (which closed 2026-04-30 via mega-pass
`116cd40`). See PLAN.md "Sub-batch 3" for status context: this work is
tentative, lower priority than Task 1e and the practice-test-gap content
additions, and will likely interleave rather than land as a single ship.

**Total active inventory: 11 items across 3 categories** (1 resolved 2026-05-01)
- Section 1 — Per-item content fixes (4): substantive question issues requiring pedagogical decisions
- Section 2 — Per-item padding follow-ups (6): mechanical distractor work deferred from Sub-batch 2
- Section 3 — New content additions (1 active queue + 1 resolved): §1.1 control types vs categories remains; §1.2 Zero Trust shipped in `197f4fe`

Each section's items are listed with: ID, source/trigger, the issue, and a
fix sketch. New work should follow the same review cadence as Sub-batch 2
(preview → side-by-side review → `--write` → validator → build → commit → push).

---

## 1. Per-item content fixes (4 items)

Substantive question issues — flawed framing, missing dimensions in correct
answers, weak distractor categorization, stem duplication. Each requires
thinking about pedagogy, not a mechanical edit.

### `mc-2.4.14-2` — MOST framing ambiguity (flagged 2026-04-28, §2.4 review-1)

**Stem:** "Which attack is MOST effectively mitigated by MFA but NOT account lockout?"

**Options (all Convention B holdback, 11–19 chars):**
- Brute force
- Password spraying
- Pass-the-hash
- ✓ Credential stuffing

**Issue:** Both **credential stuffing** and **password spraying** satisfy the criteria —
each pushes one password against many accounts (or one account with one password against
many systems), staying below per-account lockout thresholds, and each is blocked by MFA.
The "MOST" framing is borderline: a careful student could defensibly pick password
spraying.

**Fix sketch:** Either (a) reframe stem to disambiguate (e.g., "MOST effectively mitigated
by MFA when reused-password leaks are the attacker's source"), or (b) replace one of the
two valid distractors with a clearer wrong answer.

### `scen-2.2.5-0` — vishing dimension missing from correct answer (flagged 2026-04-28, §2.2 review-1)

**Stem (abridged):** Attacker calls reception (impersonates IT vendor, claims critical
network issue), receptionist escorts attacker in without verification, attacker installs
keylogger on unlocked workstation. **What TWO attack techniques were used?**

**Correct option:** "Impersonation/pretexting to gain physical access, and a physical
keylogger installation once inside"

**Issue:** The first technique used in the scenario is a **vishing** call (attacker
impersonating IT vendor over the phone). The correct answer collapses this into
"impersonation/pretexting" without naming the vishing channel. A student who answers
"Vishing followed by impersonation" or "Vishing and a physical keylogger install" is
arguably more correct than the canonical answer.

**Fix sketch:** Reframe correct option to one of:
- "Vishing pretext over the phone followed by a physical keylogger installation once inside"
- "Vishing combined with impersonation, and a physical keylogger once granted access"

Pre-existing question issue, NOT introduced by Sub-batch 2 padding (the rework only
modified the wrong-pair distractors).

### `mc-2.2.5-2` — weak verbal-only distractors for a physical-technique question (flagged 2026-04-28, §2.2 review-1)

**Stem:** "Following an authorized person through a badge-access door without using your
own credentials is:"

**Options (all Convention B holdback):**
- ✓ Piggybacking/tailgating (23)
- Vishing (7)
- Pretexting (10)
- Eliciting (9)

**Issue:** The correct answer is a **physical** SE technique, but all three distractors
are **verbal/info-elicitation** techniques. A student can rule out the distractors purely
by physical-vs-verbal categorization without actually knowing what tailgating is. Better
distractors would be other **physical** techniques (Shoulder surfing, Dumpster diving,
Skimming) that test physical-technique confusion.

**Fix sketch:** Replace the three verbal distractors with three other physical SE
techniques. New options would still be Convention B (single-word terms), still pass the
distractor-padding cohort definition, but actually test physical-technique discrimination.

Convention B holdback was the correct call within the **distractor-padding scope** (the
options ARE all short technique names with the structural slash-notation issue on
correct), but the question itself is weak.

### `mc-3.2.5-1` vs `mc-4.5.1-2` — duplicate WAF stem (flagged 2026-04-30, mega-pass)

**Stem (both items):** "A WAF (Web Application Firewall) is specifically designed to protect against:"

**Correct option (both):** Same canonical answer (web-application-layer attacks — SQL injection, XSS, etc.).

**Issue:** Two items in different sub-objectives carry the **same stem and same correct
answer**. The mega-pass authored DIFFERENT distractor sets for each (so the items don't
recycle one another mechanically), but the underlying stem-and-answer duplication
remains. A student encountering both will see the second one as already-answered.

**Fix sketch:** Reframe one of the two to test a different WAF angle while keeping the
other as the canonical "what does WAF protect against" question. Candidate angles for the
reframe:
- "Where in the application stack does a WAF operate?" (Layer 7 / HTTP-aware reverse proxy)
- "What distinguishes a WAF from a traditional network firewall?" (application-layer inspection vs port/protocol filtering)
- "Which deployment mode does a WAF use?" (inline reverse proxy vs out-of-band span port)

Alternative: delete one of the two items outright if a different angle isn't pedagogically
useful in the second sub-objective.

---

## 2. Per-item padding follow-ups (6 items)

Sub-batch 2 cohort items deferred from the mega-pass. Mechanical work: known
fix shape, no pedagogy decisions. Can land as a small batch in any future
session using the same per-sub-objective fix-script pattern.

### Convention A expansions (5 items)

Each item has an intrinsically-short correct option that triggered a length-ratio
violation the mega-pass chose not to pad in scope. Convention A treatment: expand all 4
options to "Term — explanatory tail" or "TLA (expanded form)" pattern so all options sit
near the same length. Source for each: mega-pass review document, 2026-04-30.

| ID | Sub-obj | Topic | Current correct (chars) | Ratio | Recommended Convention A expansion (target chars) |
|---|---|---|---|---|---|
| `mc-1.3.2-0` | §1.3.2 | Allow listing | "Allow listing" (13) | 7.62× | "Allow listing — only approved software can execute" (~50) |
| `mc-4.1.2-2` | §4.1.2 | IoT segmentation | "Network segmentation" (20) | 4.40× | "Network segmentation — isolating IoT devices on dedicated VLANs" (~65) |
| `mc-4.6.1-0` | §4.6.1 | SSO benefit | "Centralizing authentication" (27) | 3.48× | "Centralizing authentication into a single identity provider" (~58) |
| `mc-4.6.1-2` | §4.6.1 | Permission creep | "Regular access reviews" (22) | 4.64× | "Regular access reviews to remove no-longer-needed permissions" (~60) |
| `mc-4.7.1-0` | §4.7.1 | Automation benefit | "Speed and consistency" (21) | 4.52× | "Speed and consistency — automated tasks execute identically every time" (~70) |

When applying: also expand the 3 distractors to the same length band so the ratio drops
below 1.5× catalogue-wide. Use the d4.1 fix script's `expectedOldCorrect` /
`newCorrect` pattern (added in mega-pass for the SAE expansion at `mc-4.1.4-0`) to
preserve the SM-2 index when the correct-answer text changes.

### Scope-omitted padding (1 item)

#### `mc-4.2.1-1` — §4.2 cohort item not included in mega-pass scope

**Issue:** Mega-pass brief listed 21 sub-objectives; §4.2 was omitted. Cohort audit shows
1 item still pending there: `mc-4.2.1-1` (Domain 4, ratio 4.50×, shortCount=3,
source=legacy).

**Fix sketch:** Author distractors using the same conventions applied throughout
Sub-batch 2 (length ≤1.5× ratio target, plausible-AND-false rule, preserve correct).
Standard per-sub-objective fix script (`scripts/fix-short-distractors-d4.2.mjs`) pattern.
Single-item batch.

---

## 3. New content additions from practice-test gaps (2 multi-question queues)

Different shape from Sections 1 and 2 — these are NEW questions to author, not edits to
existing ones. Driven by practice-test misses on cybersecuritytrail.com on 2026-04-30
evening.

### ~~§1.2 Zero Trust components (NIST SP 800-207)~~ — ✓ RESOLVED 2026-05-01

**Resolution:** Shipped in commit `197f4fe` — 5 items added to video 1.2.5
(4 MC + 1 scenario):
- `mc-1.2.5-5` — PEP component ID (identity-aware proxy → PEP)
- `mc-1.2.5-6` — PE component ID (context-evaluator → PE)
- `mc-1.2.5-7` — PE vs PEP forced discrimination
- `mc-1.2.5-8` — PA's specific role (NIST-leaning, caveat in explanation)
- `scen-1.2.5-1` — Multi-component scenario (SIEM / proxy / session-token-svc → PE inputs / PEP / PA)

**AAA-vs-ZT addendum** (originally proposed as option (b) — author a 6th item):
woven into `mc-1.2.5-7`'s explanation per option (a) decision. The
distinction "Zero Trust is an architecture for HOW access decisions are
made and enforced, not the AAA process itself" appears directly in the
explanation, addressing the 090125 q#4 miss without a separate item.
If practice tests reveal the gap persists after this batch, author a
follow-up at that point — not speculatively.

Original content preserved below for reference (trigger phrases remain
useful anchors for any future §1.2 ZT authoring).

---

~~**Source:** cybersecuritytrail.com practice tests, 2026-04-30 evening:~~
- Test 071825 q#5 — picked Policy Engine when Policy Enforcement Point was correct
- Test 071825 q#8 — picked Policy Engine when Policy Enforcement Point was correct (recurring confusion)
- Test 090125 q#4 — picked Authorization when Zero Trust as a concept was correct ("authenticate users AND devices")

~~**Gap:** The PE/PA/PEP component distinction and Zero-Trust-as-architecture vs AAA
confusion are both real misses. Current §1.2 catalogue under-tests these dimensions.~~

~~**Recommend adding 4–5 questions to §1.2:**~~
- 2 MC on PE/PA/PEP component identification with concrete devices named (firewall = PEP; SIEM/risk-engine = PE; etc.)
- 1 MC distinguishing strategic-decision (PE) from tactical-enforcement (PEP) wording
- 1 MC on PA's role specifically (most often forgotten — generates session-specific tokens, communicates between PE and PEP)
- 1 scenario testing component identification in context

**Trigger phrases (still useful for any future §1.2 ZT authoring):**
- "Dynamic conditions" / "context-aware" / "risk-based decision" → **PE** (Policy Engine)
- "Enforces policies" / "checks traffic against rules" / "firewall" / "proxy" / "VPN gateway" / "API gateway" → **PEP** (Policy Enforcement Point)
- "Communicates the decision" / "session token generation" → **PA** (Policy Administrator)
- **Control Plane** = where PE/PA operate (decision layer)
- **Data Plane** = where PEP operates (traffic layer)

Citation target: Messer video "1.2 - Zero Trust" (confirmed in MESSER_VIDEOS.md L18). Sub-objective: 1.2 (parent objective convention).

### §1.1 Control types vs control categories (orthogonal axes) — MEDIUM PRIORITY

**Source:** cybersecuritytrail.com practice test 071825, 2026-04-30 evening:
- Q#1 — picked Operational for a Technical control set (motion detector, biometric, IDS/IPS)
- Q#2 — picked Deterrent (function category) when Physical (type) was wanted (fencing, bollards, lighting)
- Q#4 — picked Managerial (type) when Directive (function) was wanted (policies and directives compliance)

**Gap:** The catalogue may conflate the **Type** axis with the **Function/Category** axis.
These are orthogonal — every control has BOTH a type AND a function/category. CompTIA's
labeling is itself confusing:

- **Type axis** (Managerial / Operational / Technical / Physical) — sometimes called "Categories" in CompTIA materials.
- **Function axis** (Preventive / Deterrent / Detective / Corrective / Compensating / Directive) — sometimes called "Types" in CompTIA materials.

Naming aside, the two axes are independent: a single control sits at the intersection of
one type AND one function.

**Recommend adding 4–6 questions to §1.1:**
- "What TYPE of control is X?" (testing M/O/T/P)
- "What FUNCTION/CATEGORY does X perform?" (testing Preventive/Deterrent/Detective/Corrective/Compensating/Directive)
- A scenario asking BOTH for a single control (forces student to recognize the orthogonality)

**Specific control mappings worth testing:**

| Control | Type | Function |
|---|---|---|
| Fencing / bollards / lighting | Physical | Deterrent |
| Motion detectors / biometrics | Technical | Detective / Preventive |
| IDS | Technical | Detective |
| IPS | Technical | Preventive |
| Security policies | Managerial | Directive |
| Security awareness training | Operational | Directive / Preventive |
| Backups | Technical | Corrective |
| Locked door | Physical | Preventive |
| Visible camera | Technical | Deterrent (deters because seen) |
| Hidden camera | Technical | Detective (records, doesn't deter) |

The visible-vs-hidden camera contrast is particularly testable — same physical device,
different function depending on visibility.

Citation target: Messer video "1.1 - Security Controls" (confirm exact title against
MESSER_VIDEOS.md before authoring). Sub-objective: 1.1.

---

## How to use this file

When working on a future content-quality pass:

1. Pick a section based on the kind of work you want to do:
   - **Section 1** — pedagogy decisions, one item at a time, slow review cadence.
   - **Section 2** — mechanical distractor work, can batch multiple items in one ship.
   - **Section 3** — new authoring, full Sub-batch-2-style review cadence per question.
2. For per-item entries, draft the rework against the documented fix sketch.
3. Validate, preview, and run through the same review cadence as Sub-batch 2 fixes
   (preview → side-by-side review → `--write` → validator → build → commit → push).
4. Strike completed items through with a date, or remove them as the file becomes
   resolved.

This file is **separate** from the short-distractor-padding cohort work — these are
content issues that the cohort audit doesn't catch (Sections 1 and 3) or that were
deferred from the mega-pass scope (Section 2).
