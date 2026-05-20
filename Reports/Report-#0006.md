# Report-#0006 — Audit D three-gate session: uncertainty verification + SB1.6 ship + SB-fix-1 scoping

Session date: 2026-05-20
Session type: Three-gate audit pipeline session (verification → post-process refinement → first remediation scoping)
Branch: main
Starting commit: `8375cb8` (docs: PLAN.md + supervisor-handoff sync with SB1 full-corpus + spot-check PASS)
Ending commit: (this report's commit; see git log)
Commits this session (in order, planned): SCHEMA.md `audit_*` convention; this Report-#0006; PLAN.md + supervisor-handoff sync.

## What was asked

A three-gate session opening from the day-prior SB1 spot-check PASS sign-off. Each gate to surface-and-hold for supervisor adjudication before proceeding.

1. **TASK 1** — Resolve the 8 spot-check items the supervisor flagged as "uncertain — pending transcript verification." Text-vs-text grep against `.messer-transcripts/`, no LLM call. Items: #4 (C2 in malware), #7 (Impact in risk-management), #11 + #13 (MAC filtering in port-security), #14 (Cryptominer in other-malware-types), #15 (Secure Boot in hardening-techniques), #22 (hardware supply chain in hardware-vulnerabilities), #28 (Privacy by design in privacy).
2. **TASK 2** — SB1.6 post-process refinement. Architectural mirror of SB1.5: add a second flip predicate for the "concept-is-here-but-not-this-exact-term" failure mode. Must flip spot-check items #19 (avalanche), #20 (dual power feeds), #26 (tokenization); must NOT flip 10 supervisor confident-agree out-of-source items; must be idempotent with SB1.5. Surface design proposal BEFORE applying to full corpus.
3. **TASK 3** — SB-fix-1 scoping. First remediation sub-batch is Domain 2 partial-adjacent re-citation (~191 items). Design per-item review format, application script shape, packet cadence; confirm Strategy A (study-safe metadata-only interleave). Surface scoping proposal BEFORE building any packets or apply scripts.

Order of operations: three surface-and-hold gates, one per task. Stop for the day at TASK 3 surface; apply SB-fix-1 packet-1 in the next session.

## What was done

### TASK 1 — 8-item transcript verification packet

For each of the 8 items, ran targeted `grep -niE` against the cited transcript file with search-term guidance from the task brief. Confirmed each transcript is complete (header reports `Paragraphs: N, Length: Xch`, all paragraphs present in the file). Concept assessment is text-vs-text only — no LLM judgement layered.

**Result: 8 / 8 LLM verdicts confirmed — no change.** The supervisor's "uncertain" pool was, on direct text inspection, entirely correct.

| # | Location | Concept | Grep result | Verdict held |
|---|---|---|---|---|
| 4  | §2.4.1 mc[3]    | C2 / Command-and-Control      | 0 (only `botnet` 1× as outcome listing)              | yes |
| 7  | §5.2.1 cram[6]  | Impact (risk magnitude)       | 0 across impact/harm/magnitude/consequence/severity  | yes |
| 11 | §3.2.4 mc[2]    | MAC filtering                 | 0 across MAC/spoof/layer-2                           | yes |
| 13 | §3.2.4 cram[5]  | MAC filtering                 | 0 (same transcript as #11)                           | yes |
| 14 | §2.4.4 cram[5]  | Cryptominer                   | 0 across cryptominer/cryptocurrency/mining/bitcoin   | yes |
| 15 | §2.5.3 match[1] | Secure Boot                   | 0 across secure-boot/bootloader/UEFI/BIOS/firmware   | yes |
| 22 | §2.3.8 scen[2]  | Hardware supply chain attack  | `manufactur` 5× — but **patch-lifecycle context only** | yes |
| 28 | §5.4.2 cram[5]  | Privacy by design             | 0 across by-design/principle near privacy/design     | yes |

**Nuance flagged for supervisor (informed TASK 2 design):** item #22's transcript contains `manufactur` 5×, but exclusively in a patch-lifecycle context (Trane Comfortlink case study + EOL/EOSL), not supply-chain-attack context. The LLM's out-of-source verdict is correct, but the surface-keyword presence is a cautionary tale: the SB1.6 partial-depth flip predicate must not key off lone-word similarity.

Artifact: `.audit-working/audit-d-sub-batch-1/uncertainty-verification.md` (11,085 bytes). Surfaced via `iconv -f UTF-8 -t UTF-16LE /tmp/uncertainty-verification.txt | clip.exe` per [[feedback_review_docs_to_clipboard]].

Supervisor adjudication: **PASS. 8/8 verifications hold; supervisor adjudication matches CC's transcript-grep findings on all items.** The methodology-narrative refinement (38/40 = 95% agreement, with the 3 known-pattern disagreements being #19/#20/#26) was noted for inclusion in the SB-fix-1 report, not this one.

### TASK 2 — SB1.6 design + apply

**Three structural findings during design:**

1. **The supervisor brief's predicate gate value (`fix_direction === "rewrite-to-source"`) matched zero corpus rows.** Cross-tab of the 2128 verdicts showed all 296 out-of-source rows split 291 → `mark-for-Sybex-arbitration`, 5 → `remove-from-catalog`. The 3 must-flip items all carry `mark-for-Sybex-arbitration`. Surfaced this in the design proposal as Q1; supervisor confirmed corrected gate value.

2. **Prose-marker scanning cannot cleanly separate must-flip from must-not-flip on single markers.** Many candidate markers fire on both. E.g. "the concept ... IS taught/present" appears in #19 (must-flip) AND #27 (must-not-flip MSP Kaseya). The supervisor's distinction relies on a judgment about whether the tested term belongs in the cited video's sub-objective scope — a regex can't determine that. Honest framing surfaced; supervisor credited as the right architectural framing.

3. **Discriminating markers exist via co-firing.** Identified 10 markers where each fires on exactly one must-flip case and zero must-not-flip in the validation set (A1–A4 for #19; A5–A7 for #20; A8–A10 for #26). Each marker individually is suggestive; requiring **≥ 2 markers** to fire gives 100% precision and 100% recall on the validation set. Two-tier output: strict tier auto-flips (≥2 markers), loose tier annotates `sb16_action=flag-for-review` (=1 marker, no category change).

**Script:** `scripts/audit-d-postprocess-sb16.mjs` (~220 lines). Modes: `--selftest` (runs validation set, exits PASS/FAIL), `--dry-run` (no write), real-apply (`--input` + `--output`). Idempotency: `sb16_processed=true` sentinel + the gate (`category=out-of-source`) naturally excludes SB1.5-flipped rows that became `partial-adjacent`.

**Validation results:**

- Self-test against spot-check packet: **PASS** (3/3 must-flip flipped, 10/10 confident-agree OOS unchanged, 2/2 uncertainty-resolved-absent unchanged, #23 correctly gated out by `remove-from-catalog`).
- Full-corpus dry-run: 3 strict flips (validation set only) + 18 loose flags + 0 false positives in validation.
- Idempotency smoke test: re-running on own output → 0 new flips, 0 new flags.

Surfaced via clipboard. Supervisor adjudication: **PASS, with strong notes.**

**Real-apply executed** to `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json` (clean-provenance route per supervisor preference; SB1.5 output preserved as authoritative SB1.5 snapshot).

**Final category counts (SB1.5 → SB1.6):**

```
  category           SB1.5  →  SB1.6   delta
  ─────────────────  ─────────────────  ─────
  ambiguous-call         3 →     3      0
  in-source           1006 →  1006      0
  out-of-source        296 →   293     −3
  partial-adjacent     424 →   424      0
  partial-depth        399 →   402     +3
  ─────────────────  ─────────────────  ─────
  TOTAL               2128 →  2128      0
```

**Strict flips (3):**

1. §1.4 1.4.6 match[5] — Avalanche effect (4 markers: A1,A2,A3,A4)
2. §3.3 3.3.2 scen[2] — Tokenization (3 markers: A8,A9,A10)
3. §3.4 3.4.5 mc[2] — Dual power feeds (3 markers: A5,A6,A7)

**Loose flags (18) — SB-fix-2 candidate-augment pool:** annotated `sb16_action=flag-for-review`, category unchanged. Strongest candidates per CC review: HMAC ×2 (§1.2.2 mc[4], match[3]), strcpy/gets/sprintf (§2.3.2 match[3]), MAM (§4.1.3 cram[4]), EPSS (§4.3.4 mc[2]), MTD ×2 (§5.2.4 match[4], cram[5]).

**Methodology-coherence cross-check on the two named SB1.5 unreachable residuals:**

| Residual | State after SB1.6 | Status |
|---|---|---|
| HMAC §1.2.2 cram[4] | OOS, untouched (no markers fired on this row) | Pending — but its 2 SIBLINGS (mc[4], match[3]) are in the loose-flag pool; HMAC concept reaches review as a unit at SB-fix-2 |
| CCPA §5.4.2 mc[6] | `partial-depth` (already, from SB1 full-corpus LLM judging) | Self-resolved between Sub-batch 2 and SB1 |

Clean chain: SB1.5 + SB1.6 chained correctly, neither named residual was lost.

Supervisor credited three quality calls: gate-value sanity check before code; two-tier strict/loose architectural improvement; honest "regex can't decide #26 vs #30 on phrasing alone" framing.

### TASK 3 — SB-fix-1 Domain 2 partial-adjacent re-citation scoping

**Inventory:** Total D2 partial-adjacent in SB1.6 output = **197 items** (191 SB1.5-flipped + 6 LLM-direct). Distribution: §2.1 (1), §2.2 (46), §2.3 (53), §2.4 (84 — 43% of D2 PA, consistent with malware-overview misciting common attack types), §2.5 (13).

**Headline finding: schema constraint splits the work.** The supervisor's brief framed re-citation as Strategy A (metadata-only, study-safe). On inspection of SCHEMA.md + JSX, this is **strictly true only for mc + scen items.**

| Type | D2 PA | Per-item citation? | SM-2 tracked? | Difficulty |
|---|---|---|---|---|
| mc       | 44 | yes (item.messerVideo) | yes | trivial metadata edit |
| scen     | 19 | yes (item.messerVideo) | yes | trivial metadata edit |
| match    | 65 | **no — inherits parent** | yes (key uses videoId) | **schema decision required** |
| cram     | 69 | **no — inherits parent** | **no SM-2 tracking** | **schema decision required** |

For match + cram (134 / 197), re-citation requires either array-move (loses 65 match SM-2 keys; cram neutral) or schema extension (adds optional messerVideo/subObjective; preserves all progress; needs UI + validator updates).

**Recommended scope split, surfaced:**

- **SB-fix-1a (immediate):** mc + scen only, **63 items**, strictly Strategy A.
- **SB-fix-1b (deferred):** match + cram, 134 items, pending separate scoping after schema decision.

**Destination-video parser test** (5 patterns against 197 justification_explanation strings): 63% parseable (125 of 197) — pre-populates suggestions but every row still requires Aiden review.

**Review-packet format:** structured markdown rows with item content, current citation, full LLM justification, parser-suggested primary/alternate destinations, and decision area (accept primary / accept alternate / manual / reject / defer). 25 items per packet → 3 packets to clear SB-fix-1a (25 + 25 + 13).

**Application script sketch:** `scripts/sb-fix-1a-apply-packet.mjs` — reads packet decisions JSON, edits item.messerVideo + item.subObjective, adds `audit_d_review` audit-trail block, validator-checks before atomic write, idempotent on re-run, backup to `.audit-working/sb-fix-1a/backups/`.

**Strategy A confirmation matrix** (for SB-fix-1a only): item text / opts / key / explanation all unchanged; messerVideo + subObjective change by design; SM-2 keys unchanged (parent videoId + within-array index both preserved); existing localStorage progress preserved; can interleave with active study.

Surfaced via clipboard. Supervisor adjudication: **PASS with notes.**

**Adjudications received:**

- Q1 scope-split → APPROVED (mc + scen only for SB-fix-1a)
- Q2 schema decision → Path B (schema extension), but NOT bundled into SB-fix-1a — becomes its own SB-fix-1b-prep scoped block
- Q3 cadence → Option C confirmed (build packet-1 only, run full cycle, then decide A vs B for remaining)
- Q4 commits → per-packet ("SB-fix-1a packet N/3: M D2 PA re-citations applied")
- Q5 packet-1 authorization → YES for next session, after Q6 check
- Q6 validator constraint check → YES, first thing next session before any apply-script authoring

**Supervisor design addition:** make explicit in SCHEMA.md that fields prefixed `audit_*` are tooling-only metadata never read by the React app. Same convention for any future audit field. Prevents future "what is this field for" confusion and clarifies the boundary between study-relevant schema and audit-trail schema. Shipped in this session's SCHEMA.md commit.

Supervisor credited three quality calls: catching the schema-constraint problem before scoping as if it didn't exist; honest three-way A/B/C framing on the schema decision; parser-yield reality check (63% vs 37%) confirming 25-item packet size.

## Files changed

| File | Status | Description |
|---|---|---|
| `scripts/audit-d-postprocess-sb16.mjs` | NEW | SB1.6 post-process script (~220 lines) — selftest, dry-run, real-apply, idempotent |
| `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json` | NEW (6.05 MB) | SB1.6 output — 3 strict flips + 18 loose flags applied |
| `.audit-working/audit-d-sub-batch-1/uncertainty-verification.md` | NEW (11 KB) | TASK 1 verification packet |
| `.audit-working/audit-d-sub-batch-1/sb16-design-proposal.md` | NEW (15 KB) | TASK 2 design proposal |
| `.audit-working/audit-d-sub-batch-1/sb16-apply-report.md` | NEW (7 KB) | TASK 2 apply result + named-residual cross-check |
| `.audit-working/audit-d-sub-batch-1/sb-fix-1-scoping-proposal.md` | NEW (15 KB) | TASK 3 scoping proposal |
| `SCHEMA.md` | UPDATED | Added "Audit-trail fields (`audit_*` prefix convention)" section |
| `Reports/Report-#0006.md` | NEW (this) | Three-gate session report |
| `PLAN.md` | UPDATED | Task 1f row reflects SB1.6 SHIPPED + SB-fix-1a authorized; next-step paragraph updated |
| `docs/supervisor-handoff.md` | UPDATED | Today's three gates closed; next-session entry plan |

## Decisions reached

1. **Gate value for SB1.6 predicate is `mark-for-Sybex-arbitration`** (not `rewrite-to-source` as in the brief — corrected from data).
2. **SB1.6 uses two-tier output:** strict tier auto-flips on ≥2 markers; loose tier annotates `sb16_action=flag-for-review` on =1 marker (no category change).
3. **18 loose flags become the SB-fix-2 candidate-augment pool**, NOT a separate SB1.7 review packet. Treated as inline candidates during partial-depth scoping later.
4. **SB-fix-1a scope = mc + scen only** (63 items). match + cram deferred to SB-fix-1b.
5. **SB-fix-1b path = schema extension** (Path B), but scoped as separate SB-fix-1b-prep work block — not bundled into SB-fix-1a.
6. **SB-fix-1a cadence = Option C** (build packet-1, full cycle, then decide).
7. **SB-fix-1a commits = per-packet** ("SB-fix-1a packet N/3: M D2 PA re-citations applied").
8. **`audit_*` prefix convention** locked in SCHEMA.md for tooling-only fields. React app never reads them.

## Boundaries honored

- **Three surface-and-hold gates honored, one per task.** No proceed-without-sign-off; no actions during HOLD windows beyond what the prior gate authorized.
- **No commits this session before this report.** All work staged in `.audit-working/` and on the working tree. Three commits planned together at session close (SCHEMA.md, this report, PLAN/handoff sync).
- **No edits to questions.json.** The catalogue is unchanged on this branch. SB-fix-1a's first edit happens in next session after Q6 validator check + packet-1 review + Aiden authorization.
- **No destructive action.** Both SB1.5 output (`full-corpus-verdicts-postprocessed.json`) and the raw SB1 output (`full-corpus-verdicts.json`) preserved on disk as authoritative snapshots of their respective pipeline stages.
- **Surface-and-pause cadence honored** per [[feedback_surface_and_pause]]: status block produced, saved to `.audit-working/`, piped via `iconv -f UTF-8 -t UTF-16LE … | clip.exe` per [[feedback_review_docs_to_clipboard]], then HOLD before next gate.
- **No `audit_*` field reads added to JSX.** SCHEMA.md update only documents the convention; React app untouched in this session.

## What's next

**Next session (planned order):**

1. **Q6 validator constraint check (FIRST).** Read `scripts/validate-questions.mjs` end-to-end; identify any rule touching messerVideo/subObjective consistency between item and parent video. Surface findings: "no relevant rule" OR "rule X exists, needs Y change to support per-item override on mc+scen." If a constraint exists, propose validator update inline with apply-script work.
2. **Build SB-fix-1a packet-1** (~25 items, balanced mix of mc + scen, balanced across §2.2/2.3/2.4/2.5). Includes parser-suggested destinations where parseable; manual-decision rows where not.
3. **Surface packet-1 markdown via iconv-clipboard** for Aiden review. HOLD for decisions.

**Following session (after Aiden's packet-1 decisions land):**

- Author `scripts/sb-fix-1a-apply-packet.mjs`
- Dry-run on packet-1 decisions; surface diff preview; HOLD for Aiden's authorization
- Real apply, validator-check, commit packet-1 ("SB-fix-1a packet 1/3: M D2 PA re-citations applied")
- Decide A vs B for packets 2 + 3 based on review-tempo signal from packet-1

**Out-of-scope this session but tracked elsewhere:**

- SB-fix-1b-prep (match + cram schema extension scoping) — separate proposal session later
- SB-fix-2 (partial-depth augment, includes the 18 SB1.6 loose flags) — after SB-fix-1a closes
- Domain 1/3/4/5 partial-adjacent (227 remaining items) — future remediation sub-batches once D2 pattern is validated

## Session economics

- LLM API spend this session: **$0.** TASK 1 was text-vs-text grep; TASK 2 was scripted post-process; TASK 3 was scoping.
- Cumulative Audit D spend unchanged at $34.63 ($1.29 prior + $7.42 SB1 halt + $25.92 SB1 completion); credit remaining $19.08.
- Wall-clock: ~3 hours CC time across three gates. Each gate's surface-and-hold honored.

## Methodology notes

- The three-gate session shape (TASK 1 → TASK 2 → TASK 3, each with explicit surface-and-hold) worked well. Compared to straight-through session shape, the gates produced three pieces of validated state instead of one — TASK 1 ground truth informed TASK 2 design (especially item #22's surface-keyword cautionary tale); TASK 2 output informed TASK 3 inventory and parser yield.
- The 95% post-verification agreement number (38/40 spot-check) is a stronger validation narrative than the 75% strict-agreement number from yesterday. Per supervisor's TASK 3 sign-off note: this reframing folds into the SB-fix-1a report covering the first acting-on sub-batch, NOT this report. Today's report captures the three-gate work product; the methodology narrative reframing belongs with the first remediation action.
- Schema-constraint discovery during TASK 3 inventory (catching that 134 of 197 items can't be metadata-only re-cited) saved a substantial future bug. Adding the constraint check earlier in scoping is the lesson; this is now baked into the SB-fix-1b-prep handoff for the match+cram pipeline.
