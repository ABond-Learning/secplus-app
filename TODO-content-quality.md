# Content-Quality Backlog

Items flagged during Sub-batch 2 distractor-padding reviews that are **outside the
distractor-padding scope** and need a separate content-quality pass after Sub-batch 2
completes. Each entry: item ID, source review, the issue, and a sketch of the fix.

---

## §2.4 — Indicators of Compromise / Attacks

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

---

## §2.2 — Social Engineering / Phishing

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

---

## How to use this file

When working on a future content-quality pass (post-Sub-batch 2):
1. Pull this list, group by domain
2. For each item, draft a stem/option rework that addresses the flagged issue
3. Validate, preview, and run through the same review cadence as Sub-batch 2 fixes
4. Update this file as items are resolved (or strike them through with a date)

This is **separate** from the short-distractor-padding cohort work — these are content
issues that the cohort audit doesn't catch and that Aiden flagged during human review of
distractor-padding batches.
