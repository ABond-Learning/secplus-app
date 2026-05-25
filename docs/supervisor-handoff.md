# Where Things Stand — 2026-05-24 (session close: event-log persistent-state SHIPPED + SB-fix-2 P1 CLOSED + chapter_level_only infra)

> **2026-05-24 session close.** Same day, continuing; this batch landed after the
> G-packet / Tier-2 / Rule-#9 work in the header below.
>
> - **Event-log persistent-state implementation SHIPPED** — impl at `058acdb` (spec
>   revision `8f684f3`; Report-#0016 `3f42edd`). Disk-backed run-state file
>   (`.audit-working/runs/{runId}.state.json`) gives cross-process `actual_minutes`
>   capture even though CC drives the helper as one `node` per `logEvent`; 13 selftest
>   assertions PASS incl. a real cross-process fixture; smoke-verified non-null
>   `actual_minutes` across a real process boundary. NDJSON-first write ordering (durable
>   record before ephemeral state). **Supersedes the "known limitation" bullet in the
>   prior header** — multi-process runs now capture durations.
> - **SB-fix-2 P1 packet CLOSED — 20/20 items** across 4 commits: `f2c2c2a` (initial 7,
>   Tier 1 / Tier 2-confirmed `keep-with-sybex-note`), `b5b0f34` (Group A: cryptominer ×2,
>   skimming ×2 → `cross-source-curriculum-gap`), `979e994` (Group B: 9 chapter-level
>   Tier 3 items), `66783df` (Report-#0017). See `Reports/Report-#0017.md`.
> - **`chapter_level_only` flag on `sybex_reference` SHIPPED** at `aef0eab` as forward
>   infrastructure. Marks chapter-level Tier 3 citations — Sybex chapter is the TOC-mapped
>   home but the specific term is absent from Tier 1+2 (glossary/index/practice tests) and
>   may live only in chapter prose. Waives the verbatim `quote_excerpt` requirement;
>   `sb16_subcategory` stays orthogonal (`partial-depth`). **Applies forward to P2/P3 +
>   D1/D3/D4/D5 partial-adjacent cleanup (~250+ items)** where chapter prose is unreachable
>   without the book. See `SCHEMA.md §audit_d_review.sb_fix_2`.
> - **Memory architecture conversation surfaced.** A context doc was drafted by the
>   supervisor (not yet committed); a separate Aiden-driven chat now handles that design
>   work. Supervisor does not pick this up here unless Aiden brings it back.
> - **Recurrence-vs-awareness distinction** surfaced as a relevant frame for
>   supervisor-Claude persistence mechanisms (recurring scheduled execution vs. passive
>   awareness/recall of state).
> - **Next up:** P2 packet adjudication (20 items) → P3 (16 items) → PLAN.md restructure to
>   add the Sybex fold-in as a numbered task (with Aiden's review). Memory-architecture work
>   continues in the dedicated chat.
>
> Everything below the prior headers still describes current state for anything not listed
> above.

## (prior header) Where Things Stand — 2026-05-24 (G packet CLOSED + Sybex Tier 2 corpus committed + Rule #9 rescope)

> **2026-05-24 state (post-G-packet).** Three ship prompts landed today on `main`:
>
> - **G packet CLOSED** at `9eb4311` — all three items shipped. Items 1+2 (§2.3.2
>   integer overflow) → `keep-with-sybex-note`; Item 3 (§2.4.9 HSTS) →
>   `keep-with-sybex-note` + `cross-source-curriculum-gap`. See `Reports/Report-#0014.md`.
> - **Tier 1/2/3 framework validated end-to-end** across both failure modes it was
>   designed to separate: *in-source-needs-citation-note* (Items 1+2 — concept taught,
>   just cite the Sybex source) and *cross-source-gap* (Item 3 — concept absent from
>   Messer AND all Sybex tiers, kept-as-enrichment).
> - **`sb16_subcategory` is now a 3-value enum:** `partial-depth`,
>   `messer-curriculum-gap`, `cross-source-curriculum-gap` (new; first case = HSTS).
>   See `SCHEMA.md §audit_d_review.sb16_subcategory`.
> - **Rule #9 rescoped** at `bb4cc83` — event logging now applies to **all
>   supervisor-directed CC tasks** (any ship prompt), not just autonomous chains.
>   Run-ID convention `YYYY-MM-DD-<short-task-slug>`. See `Reports/Report-#0013.md`.
> - **Sybex Tier 2 corpus committed** at `d655a46` — 18 files / 500 questions at
>   `.audit-working/sybex-practice-tests/` (ch02-17 + 2 practice exams; ch01 excluded).
>   Audit D forward adjudication now runs on a **Tier 1 + Tier 2** evidence base.
>   See `Reports/Report-#0012.md`.
> - **Supervisor-side Sybex references:** the book index + TOC are in the supervisor
>   project at `/mnt/project/sy0-701_index.md` and `/mnt/project/sy0-701_toc.md`. Use
>   these directly for Tier 3 chapter/page lookups rather than asking Aiden to open the
>   physical book. (Glossary remains at `/mnt/project/Sybex_Glossary.pdf`.)
> - **Event-log helper — known limitation:** multi-process invocation (one `node` per
>   `logEvent`, as CC drives it) drops `actual_minutes` (ISO timestamps stay accurate).
>   Fix spec at `docs/event-log-persistent-state-spec.md` — disk-backed run-state file;
>   **pending review**, implementation is a separate ship after sign-off.
> - **Next up:** P1/P2/P3 packets (56 partial-depth items, pre-built at
>   `.audit-working/relays/from-cc/sb-fix-2-packets/`), then D1/D3/D4/D5 partial-adjacent
>   cleanup (227+ items + SD-WAN routing-out).
>
> Everything below the prior header still describes current state for everything not
> listed above (autonomous chain α, Pages deploy fix, web_fetch reliability, conventions).

## (prior header) Where Things Stand — 2026-05-23 (autonomous chain α SHIPPED + G-packet partial close + Tier 1/2/3 framework + Pages deploy fix)

Handoff document for supervisor-Claude continuity. Captures
institutional knowledge that isn't in the formal docs (PLAN.md,
Reports/, docs/).

Update this doc at natural breakpoints, especially before starting
fresh supervisor conversations. Treat as the "what I'd tell a new
supervisor on day one" briefing.

This file lives in the repo at `docs/supervisor-handoff.md` and is
fetched by supervisor-Claude conversations on orientation. Keep
this path stable; if it moves, update the project's custom
instructions to match.

## Grand plan recalibration — 2026-05-23

Load-bearing context for the next supervisor session. Read this before
chain details below — the recalibration changes the frame, not just the
numbers.

### 1. The app is study-ready NOW for Domain 2

D2 partial-adjacent items are fully audited (SB1 full-corpus + SB1.6 +
SB-fix-1a + SB-fix-1b 134/134 + SB-fix-2 R 18/18 routed + P1/P2/P3
packets pre-built awaiting Sybex inline review). The catalogue passes
the validator (0 errors, 4 warns baseline) and the build is clean.

Other domains (D1/D3/D4/D5) are functional but **not supervisor-
validated**. They render, they're answerable, they score correctly —
but the SB1 full-corpus methodology hasn't been carried through to
their partial-adjacent items yet (227 outstanding).

**Implication:** Aiden can study against the app today without waiting
for D1/D3/D4/D5 to close. D2-heavy study time is the highest-confidence
material; non-D2 study is high-confidence-for-the-test-material-itself
but the catalogue's citation provenance is less audited.

### 2. Studying IS the test of audit quality

Studying is **not** a downstream consumer of audit completion — it's
the actual test of whether the audit worked. Real study sessions
surface broken questions in a way that no LLM-as-judge pass and no
inline cluster verification can fully predict. When Aiden hits a
confusing question during a quiz, that's signal — not noise.

**Operational shift:** stop treating audit completion as a gate on
study. Fix bugs as they surface from real study sessions, in
background-work threads, rather than blocking on "all 227 D1/D3/D4/D5
items reviewed first."

### 3. Three-phase plan

**Phase 1 — Close to study-ready (1-2 focused days):**
- Today's chain close (this commit + Report-#0010 land).
- G + P packets adjudication with Sybex book (G packet `8c475eb`
  ready, P1/P2/P3 pre-built this chain).
- Weakness-tracker UI commits 3-4 (ConfidenceRater UI + pause-on-blur
  Q-C-3); commit 5 import/export already parallel-eligible.
- After these, full study-readiness achieved.

**Phase 2 — Study + iterate (mid-July exam target):**
- Aiden studies daily.
- Weakness-tracker captures per-attempt data (records the *what / how
  confident / how long / interrupted?* per question).
- Broken questions surface naturally during study; fix as background
  work, single-commit per fix.
- D1/D3/D4/D5 partial-adjacent cleanup runs **in parallel** with
  study, prioritised by what study surfaces first (not by section
  ordering or pool size).
- Mock exams when weakness-tracker readiness data suggests Aiden is
  near pass threshold (not on a calendar tickbox).

**Phase 3 — Post-Sec+:**
- SC-900 / AZ-900 substrate work using the same methodology.
- `docs/audit-d-methodology-synthesis.md` (shipped this chain) becomes
  the reference for that follow-on work — patterns, cadence,
  scripts all carry forward.

### 4. The actual_minutes lesson reshapes mental models

Discovered today via the timing-audit one-liner: prior CC-claimed
`actual_minutes` values across the chain were 3-5× inflated vs the
real `task_start → task_end` timestamp delta. Real CC compute time
per task is short (~2-3 min wall-clock for code edits + tests +
commit). The actual bottleneck is **supervisor + Aiden coordination**:
relay round-trips, adjudication time, Aiden-out windows.

**Implication for planning:** when budgeting future chains, the gating
constraint is human turnaround, not CC throughput. Chain plans that
sequence CC work expecting "several hours of CC compute" are likely
sized wrong — that compute will finish in 30-60 min, and the wall-clock
extends because Aiden + supervisor decisions punctuate the sequence.

The fix landed this session: helper now owns `actual_minutes`
computation (close-out item 1 / `4d82944`). Going forward the metric
will be ground-truth — the next chain's audit will compare to
reality, not to a vibes estimate.

### 5. Next-session opener

When Aiden returns:
- **Fresh chat per memory `feedback_collaboration.md` rule (~#16).**
  This session's context is large; the next session should not
  inherit it. Fresh orient.
- **Orient per memory `feedback_surface_and_pause.md` rule (~#17).**
  Re-read this handoff doc + PLAN.md + Report-#0010 + the
  methodology synthesis to land in the right state.
- **First work: G + P packets adjudication when Sybex book accessible.**
  G is small (3 items, fast). P1 next (20 items, §2.4-heavy). Then
  P2 (20 items, all §2.4 — the Common Attack Types catch-all
  cluster). Then P3 (16 items, diverse-tail).
- After SB-fix-2 closes, weakness-tracker UI commits 3-4 + then study
  begins.

---

## Current state

**Last commit:** `a082b11` (Sun 2026-05-24, Report-#0015 — arc summary). The 2026-05-24 supervisor arc added 5 commits on `main` (`d655a46` Tier 2 corpus → `bb4cc83` Rule #9 rescope → `9eb4311` G-packet Item 3 / CLOSED → `d1fc821` event-log spec + docs → `a082b11` Report-#0015) — see the top banner for that arc. The detail below this line describes the **2026-05-23** state, which still holds for everything the banner doesn't supersede: that day spanned TWO arcs on `main` — (1) the autonomous chain α from mammoth-pick, and (2) a post-chain adjudication + infra arc (G-packet partial close, Pages deploy fix, Tier framework, Sybex sourcing). See "Sessions arc — 2026-05-23 (post-chain)" below.

Chain α (2026-05-23, all on `main`): pre-Task-0 setup (event-log helper + CLAUDE.md Rule #8/9; `a2ec1eb` + `bb208f4`) → pre-flight halt + adjudication (`6e7cb15`) → Task 1 classifier improvements (`51ac1ff` + `8fc51e7` + `4a3008c`) → Task 1 close + scope surface (`89e900a`) → supervisor redirect: chain α not β → Task 2 retroactive smoke (`63fc015`) → Task 3 P1/P2/P3 prebuild (gitignored output) → Task 4 Spectre typo + spelling-map exception (`8f1163b`) → Task 5 methodology synthesis (`c5b3deb`) → close-out item 1 event-log bug fix (`4d82944`) → docs-sync (`16b6933`) + recalibration (`2253c38`) + Report-#0010 (`2376c2c`).

## Sessions arc — 2026-05-23 (post-chain: adjudication + infra)

After chain α closed, the day continued with supervisor-driven G-packet
adjudication and several infra/process findings. Commits: SB-fix-2
packets published to relay tree (`bcfb273`) → G-packet Items 1+2 applied
(`2516639`) → Report-#0011 Pages fix (`eec412e`) → this doc refresh.

### web_fetch on this repo is unreliable — local repo is source of truth

The supervisor's `web_fetch` against `raw.githubusercontent.com` failed
across multiple distinct modes on 2026-05-23:
- **Branch-pinned URLs** (`/main/...`) served **stale cached** content —
  the fetched bytes lagged the pushed commit.
- **Commit-pinned URLs** (`/<sha>/...`) returned **404** even when the
  same URL returned **200 OK** under `curl`.

Net: do not trust `web_fetch` to reflect repo state. **Local repo via
`cat` / `git` is the source of truth.** The relay tree (CLAUDE.md
Workflow Rule #11) is the supervisor's *convenience* path for reading
working files, but even tracked paths can be flaky on `web_fetch` — when
in doubt, CC pastes verbatim bytes (Workflow Rule #10) and Aiden relays.

### Tier 1/2/3 source-grounding framework (applies forward from G packet)

Adopted this session for SB-fix-2 G/P adjudication and forward:
- **Tier 1** — Sybex glossary first-pass screen (fast "is the term in the
  cert vocabulary at all?"). Supervisor-side project file at
  `/mnt/project/Sybex_Glossary.pdf`.
- **Tier 2** — Sybex practice-test bank (does the cert actually *test*
  this concept, and how?). Extraction underway (below).
- **Tier 3** — full Sybex chapter prose (chapter/section/page citation
  for `keep-with-sybex-note` / `re-cite-to-sybex` decisions).

**Scoping:** the framework applies FORWARD from the G packet. D2 and all
earlier sub-batches (SB0 → SB-fix-1b) shipped under the prior
LLM-as-judge + transcript-grep methodology and remain the **documented
frozen baseline** — NOT retro-fitted. Re-auditing closed D2 work against
the new tiers is explicitly out of scope unless real study surfaces a
problem (per the grand-plan recalibration: studying is the test).

### Sybex glossary discovered → Tier 1 source

`Sybex_Glossary.pdf` (Chapple/Seidl 9th) added as the Tier 1 first-pass
screen. Lets adjudication quickly separate "off-syllabus drift" from
"on-syllabus, just cited to the wrong source."

### Sybex Tier 2 corpus — COMPLETE (2026-05-24, committed)

The Tier 2 corpus is **built, verified, and committed** at
`.audit-working/sybex-practice-tests/` (tracked via a `.gitignore` exception
mirroring the `relays/` precedent — `.audit-working/*` is otherwise gitignored).

- **18 files / 500 questions**: chapters 02–17 (20 each = 320) + Practice Exams 1
  and 2 (90 each = 180). `chapter-01.json` is a legacy non-deliberate 6/20 run
  from prior actual studying — **intentionally excluded** from the corpus (kept on
  disk, re-ignored in `.gitignore`).
- **5 accidental matches** (deliberately-wrong pick still matched Sybex's correct):
  ch04 Q1, ch08 Q3, ch11 Q15, ch12 Q17, ch14 Q20 — flags where Sybex framing
  diverges from common Security+ understanding.
- **Shape**: per-question `n` / `stem` / `options` (A–D dict) / `correct`
  ({letter, text}) / `explanation` / `my_guess` / `guess_matched_correct`. The
  `my_guess` field records CCh's Security+ reasoning vs Sybex framing. One drift
  found + fixed: `practice-exam-02` had `correct` as a bare string; normalized to
  `{letter, text}` to match the other 17 (structural only, no answer changes).
- Web-fetchable for the supervisor at the same `raw.githubusercontent.com` path
  (subject to the `web_fetch` reliability caveat above — local `cat`/`git` remains
  source of truth).

This is the corpus that lets SB-fix-style passes ground "does the cert *test* this?"
without per-item manual book lookups. See `Reports/Report-#0012.md` for the run
methodology and Claude-in-Chrome workflow lessons.

### GitHub Pages deploy fix (see Report-#0011)

Two GitHub failure-alert emails → diagnosed the failing **Deploy to
GitHub Pages** workflow. Root cause was read-only Workflow permissions
producing `401 Bad credentials` (NOT the initially-guessed missing
workflow permissions / missing environment — both wrong; corrected by
elimination). Full diagnosis + fix in `Reports/Report-#0011.md`
(`eec412e`). The deploy YAML itself (`687b4d1`, 2026-04-24) was
untouched by the autonomous chain.

### G packet partial close

- **Items 1+2 SHIPPED (`2516639`):** §2.3.2 integer-overflow pair
  (cram[2] + match[2]) → `keep-with-sybex-note`, Chapple 9th Ch 6
  §Buffer Overflows p.177, objective 2.3.2. Audit-only; content
  unchanged. Sybex frames integer overflow as a buffer-overflow variant
  (storage-size) vs the catalogue's arithmetic-wraparound framing — both
  correct; framing alignment is a future content-quality note, not a
  blocker.
- **Item 3 HOLDING:** §2.4.9 HSTS mc[2]. Grep established SSL stripping
  lives in Messer's **Cryptographic Attacks** video (5 hits, framed as an
  on-path attack), NOT the cited **On-path Attacks** (0 hits); and HSTS
  is **absent corpus-wide** (0 transcript files). So the messerVideo
  correction is a within-§2.4 citation fix — verdict turns on whether it
  stays `keep-with-sybex-note` or shifts to `re-cite-to-sybex`. ~~Pending
  Chapter 12 Sybex practice-test data.~~ **UNBLOCKED 2026-05-24** — Ch12
  corpus is in hand (`chapter-12.json`, incl. the ch12 Q17 accidental
  match); ready to adjudicate. Applied under
  `applied_by=sb-fix-2-packet-G`, so a 1-item decisions file slots Item 3
  in later without re-touching Items 1+2.

**Prior reference (2026-05-22 EOD chain):** `0b831ba` (weakness-tracker commit 2: recordWeakness helper + 5 call-sites + Fix A). Yesterday's session chain (2026-05-22, all on `main`): relay v1 infra + test cycle + v2 simplification + cadence rules + Task C scoping + Report-#0009 (`24cdc7f` → `fec556d` → `2035ab0` → `cc9d2c7` → `7c65c6c` → `28f4054` → `84d575e` → `7955798`) → Q-letter adjudication relay (`0b457bf`) → relay v2.1 (`77ae671`) → SB-fix-1b packets 3+4 build/decisions/dry-run/apply (`78932e9` → `93f99de` → `7dd2dcd` → `a77ef4e` → `925022d` → `c21b60b` → `2fd99c1` → `f89b48e`) → SB-fix-1b closure docs-sync (`dcf9f5d`) → SB-fix-2 scoping (`0d12f9d`) → implementation plan (`3e0480f`) → plan sign-off (`52cd26d`) → scripts skeleton + SCHEMA (`0bc18e6`) → R packet build (`32b29fc`) → R routings + backfill (`592152b` → `0789b95`) → G packet build (`8c475eb`) → weakness-tracker implementation plan (`ecb2fb4`) → plan sign-off (`9c5df20`) → weakness-tracker commit 1 sync-engine (`829898f`) → weakness-tracker commit 2 helper + sites + Fix A (`0b831ba`) → this end-of-day sync commit.

**Branch:** main, working tree clean except 3 pre-existing untracked
Task 2 docs in `docs/` (left alone per Audit D scoping D-J)

**Audit D arc position:**
- ✅ Pre-flight PLAN amendment (Wed 2026-05-13, `bfee22e`)
- ✅ Sub-batch 0 calibration (Wed 2026-05-13, `111be1f`)
- ✅ Sub-batch 1 pre-flight iter0 (Thu 2026-05-14, `aa32fad`) —
  partial pass, Rec 1 deferred to post-process
- ✅ Sub-batch 1.5 post-process (Mon 2026-05-18, `a26d42c` + `becaac9` + `dd6b0da` + `c99a6a1`) — PASS with supervisor sign-off recorded in Report-#0004
- ✅ Sub-batch 1 full-corpus — **SHIPPED 2026-05-19.** 2,128 verdicts produced (zero data loss), $25.9170 spent, 100% cache hit rate after first call. Postprocess flipped 412 verdicts (19.4%) to `partial-adjacent` — SB1.5 architectural fix validated at scale. **Spot-check PASS at 75% strict agreement (30/40)** on the supervisor-reviewed stratified packet (matches SB0's 76.7%). Methodology validated; no catastrophic finding. Session report: Report-#0005. *Note: the original 2026-05-18 attempt halted at call #688 / $7.42 sunk; that sunk cost is included in the $34.63 cumulative figure but the SB1 verdicts on disk are entirely from the 2026-05-19 fresh run on the resume-capable script.*
- ✅ **8-item uncertainty verification (Tue 2026-05-20)** — text-vs-text grep against `.messer-transcripts/`, $0 spend. 8/8 LLM verdicts held — supervisor adjudication matched CC findings. Post-verification agreement = **38/40 = 95%**, with 3 remaining disagreements being the known SB1.6 pattern (#19 avalanche, #20 dual power feeds, #26 tokenization). Methodology-narrative reframing belongs in SB-fix-1a's report, not Report-#0006.
- ✅ **Sub-batch 1.6 post-process refinement — SHIPPED 2026-05-20.** Authored `scripts/audit-d-postprocess-sb16.mjs` (~220 lines). Predicate gate corrected from supervisor brief (`mark-for-Sybex-arbitration`, not `rewrite-to-source` — brief's value matched zero corpus rows; gate-value sanity-check caught this before any code). Two-tier output: strict (≥2 of 10 prose markers → auto-flip OOS to partial-depth) + loose (=1 marker → `sb16_action=flag-for-review`, no category change). Self-test PASS (3/3 must-flip, 12/12 must-not-flip incl. #23 gated out by `remove-from-catalog`); idempotency verified. Real-apply: 3 strict flips + 18 loose flags. Final counts: OOS 296→293, partial-depth 399→402. Output at `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json` (separate file per clean-provenance preference). Named SB1.5 residuals cross-check: CCPA §5.4.2 mc[6] self-resolved (already partial-depth); HMAC §1.2.2 cram[4] OOS but 2 siblings (mc[4]+match[3]) in loose-flag pool → reaches SB-fix-2 review as a unit.
- ✅ **SB-fix-1 scoping (Tue 2026-05-20)** — D2 partial-adjacent inventoried at 197 items. Schema-constraint finding split the work: mc + scen (63 items) per-item citable + Strategy A study-safe; match + cram (134 items) inherit citation from parent → SB-fix-1b deferred (Path B = schema extension).
- ✅ **SB-fix-1a SHIPPED 2026-05-20** (three commits: `53786b0` + `4b9d838` + `61b6992`). Q6 validator-constraint check first (Outcome A — no rule blocks per-item override). Then 3 packets of 25/25/13 items with per-packet commits. Cadence: C for packet-1 (built, surfaced, calibrate), pivoted to B for packets 2+3 (combined relay) after parser-v2 fix landed mid-stream. Parser-v2 replaced regex-based v1 with allowlist-based matching after packet-1 review surfaced 4 parser bugs (truncation on "or", inverted primary, prose-suffix capture, hallucinated titles); 10 corpus items improved, 53 unchanged. **Cumulative: 63 reviewed / 52 re-cited / 1 self-alternate (#17) / 10 sb16-candidates.** Mid-stream cluster verification on 9 supervisor-flagged items (TASK-1-style transcript grep) confirmed all 9 as SB16-CANDIDATE (concept-here-but-not-this-exact-term in §2.4 attack-types cluster). Validator clean throughout (0 errors / 5 warns unchanged from baseline). Backups retained at `.audit-working/sb-fix-1a/backups/`.
- ✅ **Report-#0007 SHIPPED 2026-05-21 (`4e6fb9e`).** Load-bearing methodology document for SB-fix-1a covering Q6 + parser v2 + all 3 packets + catch-all generalisation across §2.2/§2.3/§2.4/§2.5 + partial-depth under-application + Messer-curriculum-gap candidates. Cumulative methodology agreement number locked at **47/50 = 94%** (30 spot-check + 8 uncertainty-verified + 9 cluster-verified; 3 remaining disagreements all SB1.6-method-handled). Supervisor sign-off PASS with four framing nudges folded in (parser-v2 functional impact framing; denominator reconstruction in §8; corpus-scale claim softened; (A)↔(B) hidden dependency in §9).
- ✅ **SB-fix-2 pool composition walk 2026-05-21** — type-composition surfaced 14 of 31 items (45%) as match+cram → (A) is sequencing prerequisite for that subset. Ordering decided: Option 1 (A→B sequential).
- ✅ **SB-fix-1b-prep SHIPPED 2026-05-21 (`c1464c0`) + Report-#0008 (`5bec38a`).** Schema extension + validator generalisation. SCHEMA.md: MatchItem + CramTerm optional `messerVideo` + `subObjective` with both-or-neither rule; new Citation field rules section + type-level enforcement table. Validator: extracted `checkCitation()` helper (preserves existing error codes verbatim per Q-B refinement 1; explicit both-or-neither logic per Q-B refinement 2); called from match + cram walkers with `requireCitation: false`; Q-C comment in `forEachStringField`; `--selftest` flag with 6 fixtures (6/6 PASS). Q-A through Q-E supervisor-adjudicated; zero JSX changes per Q-D-1 (citation stays tooling-metadata; reserves Q-D-2 as future opt-in). Headline: scope reduced from feature-shaped to data-shaped after no-UI-read-path audit; supports BOTH 134-item SB-fix-1b apply pool AND 14-item SB-fix-2 match+cram subset under uniform schema.
- ✅ **SB-fix-1b packets 1+2 SHIPPED 2026-05-21 (`c252fa1` + `87b566e`).** 50/134 D2 PA match/cram items re-cited (37% of pool). Cadence Option A confirmed for packets 3-6 (per-packet surface-and-hold). Packet 1: 25 items all in §2.2 (11 match + 14 cram), 25 edits + 0 sb16-candidates. Packet 2: 25 items in §2.2 tail + §2.3 (14 match + 11 cram), 21 edits + 4 sb16-candidates (2 messer-curriculum-gap + 2 partial-depth). Headline finding (Report-#0009 backlog): mitigation-catch-all sub-pattern — 7 of 21 packet-2 edits (33%) move from §2.3 vulnerability videos into 2.5 Mitigation Techniques (ASLR/DEP/Stack canary/Mutex/WAF). Distinct shape from Report-#0007 §5's catch-alls. Cross-packet inconsistency surfaced: BEC items split between SB-fix-1a (Other Social Engineering Attacks) and SB-fix-1b (Phishing) — tracked in `.audit-working/sb-fix-1b/cross-packet-inconsistencies.md` for transcript-grep reconciliation after SB-fix-1b closure.
- ✅ **`sb16_subcategory` formalised 2026-05-21 (`12deabc`).** SCHEMA.md documents two values with umbrella-conceptual-fit framing: `partial-depth` (cited video's umbrella subsumes tested technique; technique absent from transcript — Spectre/Meltdown shape under Hardware Vulnerabilities; SYN flood under DoS) vs `messer-curriculum-gap` (cited video is a sibling concept; tested technique has no umbrella home anywhere in Messer's corpus — integer overflow shape under Buffer Overflows). Defining axis: does the cited video's umbrella concept conceptually contain the tested technique? Backfill (`6f796f7`) retrofitted all 10 SB-fix-1a sb16-candidates as `partial-depth`; integer overflow #36/#37 in SB-fix-1b packet 2 introduced the first `messer-curriculum-gap` cases. `sb16_subcategory` is now a required field on every sb16-candidate decision (threaded through `sb-fix-1b-apply-packet.mjs` in `ae5495f`).
- ✅ **Infrastructure session 2026-05-22 — relay + cadence rules + weakness-tracker scoping.** Three sequential tasks: (A) git-mediated CC ↔ supervisor relay v1 → v2 same-day simplification (`24cdc7f` … `7c65c6c`) — both sides write to `.audit-working/relays/{from-cc,from-supervisor}/`, Aiden routes short signals by hand, no bridge tool, no polling. (B) `docs/cadence-rules.md` extracts six workflow rules + communication-patterns subsection from accumulated Audit D experience (`28f4054`). (C) `.audit-working/weakness-tracker-scoping.md` scopes per-attempt diagnostic records as additive `weakness-` localStorage prefix; supervisor adjudicated all six Q-letters (A-F) at CC's leans next round-trip. Session report: Report-#0009 (`7955798`). Relay v2.1 amendment (`77ae671`) — CC terminal-output template now includes full `raw.githubusercontent.com` URL alongside path/commit/nonce.
- ✅ **SB-fix-1b packets 3+4 SHIPPED 2026-05-22 — SB-fix-1b CLOSED at 134/134 (`a77ef4e` + `f89b48e`).** First packets under new cadence Rules 1-6 + relay v2.1. Packet 3: 50 items (§2.3=16, §2.4=34), 36 edits + 14 sb16-candidates partial-depth. Packet 4: 34 items (§2.4 tail=26, §2.5 entry=8), 20 edits + 14 sb16-candidates partial-depth. Cumulative SB-fix-1b: 102 edits + 32 sb16-candidates (30 partial-depth + 2 messer-curriculum-gap). Three new build scripts implement Rule 2 (`scripts/sb-fix-1b-cluster-verify.mjs` — inline pre-grep against cited transcript + parser destinations + corpus-wide) and Rule 5 (`scripts/sb-fix-1b-cross-packet-annotate.mjs` — Jaccard similarity against 163-item prior-decisions corpus; `scripts/sb-fix-1b-augment-packet.mjs` — splices pre-analysis into packet `.md`). Reusable for D1/D3/D4/D5 future audits. Cross-packet inconsistencies file now has 2 confirmed entries (BEC + SSL stripping). Validator clean across all four packets (0 errors / 5 warns unchanged baseline). Supervisor's umbrella-conceptual-fit framing — "cited video IS natural umbrella → keep-as-is + sb16-candidate + partial-depth" — is the load-bearing rule for §2.4 attack-type items.
- 🔄 **SB-fix-2 IN PROGRESS 2026-05-22.** Scoping signed off (`3e0480f`). Pool re-counted to 60 items (42 catalogue sb16-candidates + 18 orphan Pool B SB1.6 loose flags). Scripts skeleton + SCHEMA extension `audit_d_review.sb_fix_2` SHIPPED (`0bc18e6`) — 4 scripts (apply/build/route/backfill) with --selftest fixtures, all PASS. **R sub-path CLOSED 2026-05-22 (`32b29fc` + `0789b95`):** 18 Pool B items routed by supervisor — 16 partial-depth + 1 messer-curriculum-gap + 1 partial-adjacent-not-sb16 (SD-WAN scen, exits SB-fix-2 to D1/D3/D4/D5 cleanup; captured in `.audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md`). Supervisor's umbrella-fit framing flipped 10 of CC's curriculum-gap recommendations to partial-depth — classifier improvements (needle-extractor + umbrella heuristic) captured in `.audit-working/findings/sb-fix-2-classifier-improvements.md`. **G packet built 2026-05-22 (`8c475eb`)** — 3 items (2 integer overflow from §2.3.2 + 1 HSTS mc from §2.4.9). **BLOCKED on Sybex book access** (Aiden at office, Chapple/Seidl 9th edition at home). G + P packets resume when Sybex available. Pool A partial-depth 40 + Pool B partial-depth 16 = 56 items pending P packets (3 packets at 20/20/16).
- 🔄 **Weakness-tracker IN PROGRESS 2026-05-22.** Scoping (`84d575e`) + all six Q-letters adjudicated at CC's leans + Aiden's glosses. Implementation plan signed off (`9c5df20`) with three interpretation calls confirmed (Q-A embedded `prior_sm2` in first-event record per questionId; Q-C-3 reveal-on-resume only if answer was selected before blur; Q-A-3 implicit skip via submit-without-clicking). **Commit 1 SHIPPED (`829898f`):** sync-engine `TRACKED_PREFIXES` += `"weakness-"` + 3 unit tests + 1 integration test; 11/11 sync-engine integration + 27/27 unit PASS. **Commit 2 SHIPPED (`0b831ba`):** new `src/study/weakness.js` module (~95 lines, 15 unit tests PASS) + App-level wrapper inside `secplus-quiz.jsx` + prop plumbing through StudyTab/QuizTab/ExamTab + timing refs in QuizTab + 5 call-site writes (lines ~1378/1403/1491/1603/2095). Smoke test surfaced a stale-React-closure bug in QuizTab's keyboard handler (mount-time recordWeakness captured empty DEFAULT_STORE before async loadStore resolved); **Fix A applied** — wrapper reads SM-2 state directly from localStorage at write time rather than React state, eliminating the closure-staleness class entirely. Smoke test verified prior_sm2 fires correctly post-Fix-A. Commits 3-8 pending: ConfidenceRater UI / pause-on-blur Q-C-3 / import-export Q-F-1 / SCHEMA / docs sync / Report-#0010. **Before commit 3 ships:** verify no q/w/e/r keyboard collision in existing handlers (supervisor sign-off note 9c5df20; tracked in memory `project_weakness_tracker_commit_3_keyboard_check.md`).
- ⏸ **D1/D3/D4/D5 partial-adjacent (227 items + SD-WAN routing-out)** — follows once D2 pattern is fully validated through SB-fix-2 closure.

## Findings backlog (gitignored under `.audit-working/`)

- `sb-fix-1b/cross-packet-inconsistencies.md` — 2 confirmed entries (BEC packet 1 — split between SB-fix-1a "Other Social Engineering Attacks" and SB-fix-1b "Phishing"; SSL stripping — packet 3 #100 kept-as-is-sb16 vs packet 4 #103 re-cited to "2.4 - Cryptographic Attacks" based on 7-hit corpus evidence; supervisor deferred #100 reconciliation to SB-fix-2 per Rule 6 no-mid-stream-revision).
- `findings/sb-fix-2-classifier-improvements.md` — needle-extractor improvement (mc/scen use full Q text; should extract acronyms) + `looksLikeUmbrellaTitle` heuristic too conservative (10 of 18 R items flipped). Tuning deferred to between P packets if divergence reproduces (>30% trigger threshold).
- `findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md` — SD-WAN scen routes out of SB-fix-2 scope to future D1/D3/D4/D5 cleanup pass (corpus-hit in `secure-communication-sy0-701.txt`).

## Autonomous chain α — 2026-05-23 results

Tasks 1-5 + close-out items 1-3 shipped this session, all $0 LLM spend.

| Task | Outcome | Commit |
|---|---|---|
| 1.0 | Cluster-verify selftest infra (6/6 fixtures; production byte-identical) | `51ac1ff` |
| 1.1 | Needle extractor for mc/scen (acronyms + quoted + last-clause; +7 fixtures) | `8fc51e7` |
| 1.2 | Umbrella heuristic invert (Option 1; +20 fixtures) | `4a3008c` |
| 2 | Retroactive smoke: R-packet divergence 77.8% → 11.1% (12 diverge→agree flips, 0 regressions) | `63fc015` |
| 3 | P1/P2/P3 packets pre-built against 56-item partial-depth pool (P1=20 / P2=20 / P3=16) | (artefacts gitignored) |
| 4 | Spectre typo fix in §2.3.8 (4 sites + spelling-map proper-noun exception) | `8f1163b` |
| 5 | Methodology synthesis doc across Reports #0005-#0009 (341 lines) | `c5b3deb` |
| close-out 1 | Event-log auto-compute actual_minutes + task_id join key + 12-fixture test | `4d82944` |
| close-out 2 | PLAN.md + supervisor-handoff sync (this commit) | TBD |
| close-out 3 | Report-#0010 | TBD |

**Event-log bug discovery 2026-05-23 (close-out 1):** the timing-audit
one-liner caught manually-passed `actual_minutes` values inflated 4-8×
vs the real `task_start → task_end` timestamp delta. Root cause:
helper had no compute-from-timestamps logic; callers (CC) supplied
vibes-based estimates. Fixed by requiring `task_id` as the join key,
computing `actual_minutes` in the helper, and rejecting caller-passed
`actual_minutes` on `task_end`. CLAUDE.md Rule #9 updated to reflect
the new contract.

## Next-session opener

Aiden's choice between:
- **(a)** SB-fix-2 G review at home with Sybex book (G packet `8c475eb` ready for Sybex chapter/section lookups)
- **(b)** SB-fix-2 P1/P2/P3 review at home with Sybex book (P packets pre-built this chain at `.audit-working/sb-fix-2/packet-P{1,2,3}.{md,json}`; gitignored but on local disk; supervisor + Aiden inline review per cadence Rule 3)
- **(c)** Weakness-tracker commit 3 ConfidenceRater UI — but verify no q/w/e/r keyboard collision in existing handlers FIRST per supervisor sign-off note (memory `project_weakness_tracker_commit_3_keyboard_check.md`). Subsequent commits 4/5 (Q-C-3 pause-on-blur, Q-F-1 import/export) then SCHEMA + docs + Report-#0011.
- **(d)** Something else — all work streams unblocked individually.
- ⏸ **Domain 1/3/4/5 partial-adjacent** (227 remaining items) — future sub-batches once D2 pattern is fully validated through SB-fix-2 + the now-improved classifier (re-applying it across all 5 domains is anticipated to surface ~80-90% of partial-depth candidates automatically).
- ⏸ **Closure sub-batch**

## Sub-batch 1 full-corpus — completion record 2026-05-19

Pre-flight decisions (locked 2026-05-18) held through completion:

**D-SB1-scope:** match + cram + MC + scen — full 2128 items
(sample-sampled from `questions.json`: mc=532, scen=345, match=580,
cram=671 across 28 sections / 120 videos). All 2,128 produced clean
verdicts. Zero items missing.

**D-SB1-model:** sonnet-4-5 (locked). 100% cache hit rate after first
call — perfect cache behaviour confirmed at corpus scale. No
SB1.5 cross-run was needed.

**D-SB1-schedule:** completed 2026-05-19 across one continuous run
(~3h wall-clock, ~9 verdicts/min, 2,492 API calls total including
364 verbatim retries = 17.1% retry rate). Resume-capable script
(`a4a30c3`) executed cleanly; the periodic-flush path was verified
at the ~50-verdict mark via direct file inspection — flush worked
exactly as designed (location-keyed done-set, order-independent).

**Spot-check stratified review (40 items, mulberry32 seed 20260519):**
15 partial-adjacent / 15 out-of-source / 5 in-source / 5 partial-depth.
Supervisor verdict: 30/40 strict agreement (PASS). Breakdown:
- Partial-adjacent: 10/15 confident-agree, 5 uncertain pending Aiden
  transcript verification, 0 disagree → 412 flips at scale look sound.
- Out-of-source: 10/15 confident-agree, 3 likely-disagree (avalanche,
  dual power feeds, tokenization — all same "concept-here-but-not-
  this-term" pattern), 2 uncertain.
- In-source: 5/5 agree.
- Partial-depth: 5/5 agree-when-applied (concern is under-application
  not mis-application).

Packet artefacts at `.audit-working/audit-d-sub-batch-1/spotcheck-
packet-v1.{json,md}`, generator at `build-spotcheck-packet.mjs`,
seed reproducible (same seed → same 40 items).

## Key findings from 2026-05-20 (now fully captured in Report-#0007)

Two findings carried into Report-#0007 §5 and §6:

**(1) The catch-all pattern generalises across Domain 2.** Packet-1 supervisor flagged the §2.2 cluster acting as a catch-all for "anything social-engineering-adjacent" (DKIM/SPF/DMARC items, DNS pharming, physical/awareness items). SB-fix-1a confirmed this at scale and revealed the pattern is **systemic across §2.2/§2.3/§2.4/§2.5**: §2.3 Types of Vulnerabilities bucketed DNS-specific / infrastructure / mitigation items that belonged elsewhere; §2.4 dominates within-cluster sibling reorganization (right area, wrong sub-video) with 15 of 52 edits being §2.4-internal moves; §2.5 Mitigation Techniques bucketed cross-domain hardening content that belonged in §4.1 / §4.8 / §1.2. Likely repeats in Domain 1/3/4/5 partial-adjacent pools (227 remaining items) and in the deferred SB-fix-1b match + cram pool (134 items).

**(2) Partial-depth was systematically under-applied at the LLM-as-judge layer.** SB1.6's prose-marker predicate caught 21 items (3 strict + 18 loose). SB-fix-1a review surfaced **10 additional sb16-candidates** beyond what the predicate caught — pushing the SB-fix-2 candidate-augment pool to 31 items. 9 of the 10 are clustered in §2.4 attack-types where each parent video covers a generic attack family but doesn't name canonical exam-relevant techniques (SYN flood, DNS tunneling, evil twin, WPA2 handshake, IDOR, credential stuffing, pass-the-hash). These required supervisor's sibling-aware "concept-here-but-not-this-exact-term" review heuristic with no clean automated proxy. SB-fix-2 will need a similar manual gate.

## Sub-batch 1.5 sign-off annotations (carry forward)

From the formal sign-off at session close 2026-05-18:

1. Subset 1 strict: 3/6 → 6/6 (upper bound of Report-#0003
   prediction)
2. Subset 2 strict: 3/5 unchanged (PASS at threshold)
3. Subset 2 collapsed: 3/5 (FAIL at ≥4/5 threshold) — predicted,
   two known-unreachable residuals (HMAC + CCPA)
4. Smoke test HELD (4/4 §2.3.3 items correctly untouched)
5. Diagnostic metrics clean: inconsistent verdicts 3→0, paraphrase
   8.3%, cache 100%
6. Regression-sample 2 flips (rows 13 bare-metal, 14 integer
   overflow): **method improvement over SB0 supervisor baseline,
   NOT script error**

**Important methodological note:** SB0 supervisor verdicts on rows
13 and 14 should NOT be retroactively edited. Moving ground truth
to match the method would be methodology corruption. Document the
flips as "post-process surfaces 2 cases where SB0 supervisor was
category-conservative; these are method improvements over SB0
baseline."

**Practical implication for Sub-batch 1 full-corpus:** apply
post-process by default. The 2 regression-sample flips are
evidence the post-process generalizes correctly beyond the 3
predicted flips.

## Key insights worth preserving

**fix_direction as LLM-intent signal (from Sub-batch 1 pre-flight):**

When the LLM produces a verdict with a 6-way category + 5-way
fix_direction + justification, the fix_direction field is more
reliable than the category label as a signal of LLM intent. Reason:
training prior "concept-not-in-this-transcript → out-of-source"
overrides explicit prompt instruction at category-selection step,
but fix_direction is less constrained by training prior so it
reflects actual reasoning.

Post-processing on fix_direction → category consistency is
structurally cleaner than further prompt iteration. The pattern
generalizes to any LLM-as-judge pipeline where schema enforces
category-action pairing.

**Prose-marker co-firing as a precision tool (from SB1.6 2026-05-20):**

Single prose markers in LLM justifications are too noisy to discriminate
must-flip from must-not-flip cases — markers like "the concept ... IS
taught" or "legitimate Security+ concept" appear in both. But requiring
**≥ 2 of N candidate markers to co-fire** gives 100% precision and
100% recall on the SB1.6 must-flip validation set (3/3 caught, 0/12
false-positives). The single-marker hits are kept as a flag-for-review
tier rather than discarded — they form a candidate-augment pool for
the next remediation sub-batch. Two-tier output (strict auto-flip +
loose flag) is the right architecture when prose-marker scanning can't
cleanly decide on the basis of phrasing alone.

**Schema-constraint check belongs in scoping, not implementation (from SB-fix-1 2026-05-20):**

Before scoping a "metadata-only" change across N items, verify the
schema actually supports per-item override on the field being changed.
For Audit D's partial-adjacent re-citation, 134 of 197 D2 items live in
`match` / `cram` arrays where citation inherits from the parent video —
re-citation requires either a structural move (breaks SM-2 keys) or a
schema extension. Catching this in scoping saved authoring an apply
script that would have silently broken study progress on 65 match items.
The lesson: when SCHEMA.md says "never reorder ... never change video
id," check whether the proposed remediation touches those guarantees
before drafting the apply path.

**`audit_*` field naming convention (locked 2026-05-20):**

Fields prefixed `audit_*` on items / videos are tooling-only metadata.
The React app never reads them. They are added by audit / remediation
scripts (e.g., `audit_d_review` on items processed by SB-fix-1a) for
provenance and decision tracking. Documented in SCHEMA.md's "Audit-trail
fields" section. Future audit scripts adding new state to items must use
this prefix to keep the study-relevant / audit-trail boundary clean.

**Audit A lessons (carry-over from May 2026):**

1. Tool-gated execution beats self-reported discipline — Batch 4b
   76% rework vs Batch 5 0% after switching to verifier-tool gating
2. Actual-vs-claimed length distinction — proposals must measure
   outputs, not intentions
3. Find binding minimum across all options when padding, don't pad
   by name
4. Per-item exp-coverage check before trim-correct; state
   affirmatively in commits

**Supervisor-CC workflow (memory rule #7):**

CC must surface decision points via Aiden's paste-relay before
proceeding. Status block → save to .audit-working/ → iconv to
clipboard → pause for sign-off. Applies at pass/fail gates,
mid-sub-batch checkpoints, and "surface findings + hold" requests.
2026-05-18 Sub-batch 1.5 was an example of CC executing through
gates without surfacing; retrospective surface produced and
workflow course-corrected.

## Active conventions

- **Workflow Rule #7:** Every completed task gets
  `Reports/Report-#NNNN.md` per CLAUDE.md
- **Decision-block style:** Multi-letter sign-off blocks (D-A
  through D-J for Audit D scoping, D-K through D-N for SB1
  pre-flight closure, etc.)
- **iconv clipboard pattern:** `iconv -f UTF-8 -t UTF-16LE <path> |
  clip.exe` for status blocks
- **Untracked docs:** 3 Task 2 docs (cancel-feature-shipped,
  task2-2b-end-of-session, task2-sub-batch-2c-shipped) left
  untracked per D-J, address in separate cleanup pass

## Budget state

- $5 free credit + $50 paid credit (added Thu 2026-05-14) → pre-Audit-D pool: ~$53.71
- Cumulative Audit D spend through 2026-05-21 (late afternoon close): **$34.63** (unchanged from 2026-05-19; SB-fix-1a + Report-#0007 + SB-fix-1b-prep + Report-#0008 + SB-fix-1b packets 1+2 + sb16_subcategory formalisation work were all pure script + documentation + paste-relay review, $0 LLM)
  - $1.29 — SB0 calibration + SB1 pre-flight iterations
  - $7.42 — SB1 halt attempt 2026-05-18 (sunk; no on-disk verdicts)
  - $25.92 — SB1 full-corpus completion 2026-05-19 ($25.9170 exact)
  - $0    — SB1.6 (transcript-grep + post-process script, no LLM calls)
  - $0    — SB-fix-1a (3 packets of script-only + Aiden review, no LLM calls anywhere)
  - $0    — Report-#0007 (documentation, no LLM)
  - $0    — SB-fix-1b-prep (schema + validator + self-test work, no LLM)
  - $0    — Report-#0008 (documentation, no LLM)
  - $0    — SB-fix-1b packets 1+2 (script-only apply + supervisor paste-relay review + corpus grep for integer overflow / SYN flood, no LLM)
  - $0    — sb16_subcategory SCHEMA + backfill + apply threading (documentation + script work)
- **Credit remaining: ~$19.08**
- SB1 actual ($25.92) came in **under mid-projection** ($30); stretch ($45) and ceiling ($60) never approached. 100% cache hit rate on calls after first; per-verdict cost averaged $0.01234.
- Remaining $19.08 covers: SB-fix-1b apply work (no LLM — transcript grep + manual review against 84 remaining items in packets 3-6), SB-fix-2 review (no LLM expected — manual gate against now-33-item pool), Domain 1/3/4/5 PA sub-batches (no LLM expected), closure work, and a meaningful margin for any unexpected mid-arc LLM-as-judge work. A top-up will be needed before any sub-batch that re-runs the LLM-as-judge over the full corpus.

## Tasks deferred behind Audit D

These are tracked in PLAN.md but waiting on Audit D closure:

- Task 2 Sub-batches 3 (saved presets), 4 (Flashcards SM-2), 5
  (cleanup)
- Task 3 PBQ system + exam sim
- 5 metacognitive features (deferred candidates per PLAN.md,
  re-evaluate after Task 2 closes + 3-5 study sessions)
- Matching UX polish: (a) topic names visible on cards [consider
  context-aware visibility for study vs exam modes], (b) progress
  bar on matching items
- 4 remaining Section 1 content fixes in TODO-content-quality.md

## Workflow change context (2026-05-18)

Supervisor role moved from regular Claude.ai chat to a Claude.ai
Project, but project knowledge intentionally stays near-empty —
strategic docs are fetched from GitHub instead of uploaded. Reasons:
- Multi-week Audit D arc + multi-day strategic conversations cause
  chat to become unwieldy; fresh project conversation gives clean
  context
- Single source of truth in the repo; no doc drift between repo
  and project knowledge
- Public repo provides web-fetch access to latest committed state
- Cowork considered but rejected: supervisor role is conversational
  not task-shaped; supervisor-CC pattern depends on independent
  instances

CC continues operating in WSL at `~/projects/secplus-app/` exactly
as before. Only the supervisor role changed location.

## How to use this document

Update at session boundaries when state changes materially:
- After major commits (Sub-batch closures, methodology changes)
- After decision-block sign-offs that affect future work
- When workflow conventions change
- When budget state shifts significantly

The formal docs (PLAN.md, Reports/, docs/audit-d-*.md) are
authoritative on their respective concerns. This doc is the
connecting tissue — context that crosses doc boundaries or doesn't
fit anywhere else.

Re-commit + push when materially updated. No re-upload to the
project needed; supervisor-Claude fetches the latest version from
GitHub.
