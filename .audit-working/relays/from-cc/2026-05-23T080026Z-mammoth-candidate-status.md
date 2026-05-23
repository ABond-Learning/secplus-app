CC_NONCE: 2026-05-23T080026Z-e0c2def3

Topic: Mammoth-task candidate status — three options for unattended
multi-hour run while Aiden is out. Surface only; no kickoff yet.
Decision gate: supervisor + Aiden pick which mammoth (or none); CC
will then run the live 5-item smoke before full kickoff per CLAUDE.md
memory rule on long-running API scripts.

Session: fresh start after WSL restart 2026-05-23. Branch `main`,
working tree clean (3 pre-existing untracked Task 2 docs in `docs/`,
left alone per Audit D scoping D-J).

Starting commit: `9988130` (docs: PLAN + supervisor-handoff sync —
end-of-day 2026-05-22).

Orientation read (this session, $0):
- `docs/supervisor-handoff.md` (read full)
- `PLAN.md` (read header + Task 1f row + Task 2 row)
- `Reports/Report-#0009.md` (read full)
- `Reports/Report-#0008.md` (read partial — context for SB-fix-1b-prep)
- `.audit-working/weakness-tracker-implementation-plan.md` (read full)
- `.audit-working/findings/sb-fix-2-classifier-improvements.md`
- `.audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md`
- `TODO-content-quality.md` (read header + first item)
- `scripts/audit-d-llm-judge.mjs` (header + resume block + imports)

---

## TL;DR

**No candidate is a clean "mammoth fit" for several hours of
unattended LLM-driven grind, but for different reasons.** Honest
read across the three:

| Candidate | Mammoth-suitable? | Blocker |
|---|---|---|
| 1. Audit D full-corpus re-run | Mechanically yes; budget no | Budget ($19.08 remaining; re-run ≈ $25.92). Also, all 2,128 items already audited — would be a redundant re-run unless a methodology change motivates it. |
| 2. Weakness-tracker commit 5 (import/export) | Parallel-eligible but tiny (~30-45 min) | Not mammoth. Mechanical commit, no LLM, ends well short of "several hours." |
| 3. Content-cleanup backlog grind | Mostly NO (judgment-required) | Backlog items either need pedagogical decisions (TODO-content-quality.md) or are small script-tuning passes (~50 min total) (sb-fix-2 classifier improvements). |

Surface the report; ask supervisor + Aiden to pick (or to defer all
three and propose a fourth candidate). CC then live-smokes the
chosen path before full kickoff.

---

## Candidate 1 — Audit D full-corpus pass

### Status check

**Pending? NO.** SB1 full-corpus shipped 2026-05-19, $25.92 spent,
2,128 verdicts produced (zero data loss), 100% cache hit rate after
first call. Subsequent SB1.6 post-process refinement (2026-05-20)
landed 3 strict flips + 18 loose flags. Both result files on disk:

- `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts.json`
  (6,055,205 bytes — pre-SB1.6 baseline; preserved for clean
  provenance per "separate file" preference)
- `.audit-working/audit-d-sub-batch-1/full-corpus-verdicts-sb16.json`
  (6,055,205 bytes — post-SB1.6, current authoritative)

### Un-audited remaining count

**0.** The full corpus (2,128 items) has been judged:

| Type | Catalogue (questions.json) | Audited (verdicts) |
|---|---|---|
| mc      | 532 | 532 |
| scen    | 345 | 345 |
| match   | 580 | 580 |
| cram    | 671 | 671 |
| **Total** | **2,128** | **2,128** |

(Verdict counts confirmed via `node -e ... v.verdicts` on
`full-corpus-verdicts.json`; catalogue counts confirmed via
walk of `questions.json` sections × videos.)

A re-run would re-judge already-audited items. The script's resume
logic (see below) would IMMEDIATELY skip all 2,128 → 0 API calls
unless `--output` points at a fresh file path.

### Resume-on-restart status: IMPLEMENTED + PROVEN

Per `scripts/audit-d-llm-judge.mjs` lines 260-340:

- ✅ Reads existing `--output` file on startup: `if (existsSync(VERDICTS_PATH))` →
  loads `prior.verdicts[]`, rebuilds `doneLocations` Set.
- ✅ Done-set keyed by stable content identity:
  `locKey = (l) => '${l.section}|${l.video}|${l.type}|${l.index}'` —
  NOT array index. Order-independent across input reorderings.
- ✅ Skip-already-done in main loop: `if (doneLocations.has(locKey(item))) continue;`
- ✅ Periodic flush every 50 verdicts (`FLUSH_EVERY = 50`,
  `flushOutput()` called inside loop at line 466).
- ✅ Carries forward `priorMetadata` and `priorErrors` for
  cumulative cost visibility.
- ✅ Validated in production 2026-05-19: SB1 full-corpus ran
  cleanly to completion with zero data loss after the 2026-05-18
  travel-halt incident motivated the retrofit (commit `a4a30c3`).

**Smoke-test recommendation if re-run is approved:** point
`--output` at the existing `full-corpus-verdicts.json` and run with
HARD_CAP=5 → expect "Skipped (already done from prior session):
2128" + 0 API calls + script exits cleanly. CLAUDE.md memory rule
explicitly requires this smoke before any full-corpus run; current
script + current output file would pass.

### Estimated cost + runtime

- **Cost (fresh corpus):** ~$25.92 (matches 2026-05-19 actual;
  100% cache hit on second+ call; per-verdict avg $0.01234).
- **Runtime (fresh corpus):** ~3 hours wall-clock at ~9 verdicts/min
  (2,492 API calls including 364 verbatim retries = 17.1%).
- **Cost (re-run against existing output):** $0. Zero calls.

### Pre-flight checklist (if full re-run is approved)

| Check | Status |
|---|---|
| ANTHROPIC_API_KEY in `.env` | ✅ present (`grep -c` returned 1) |
| Anthropic SDK installed | ✅ `@anthropic-ai/sdk` in node_modules |
| Disk space | ✅ 951 GB free on `/dev/sdd` (catalogue + verdicts ≈ 14 MB) |
| Budget | ❌ $19.08 remaining vs ~$25.92 needed for fresh run (top-up required first) |
| Resume smoke | ⚠️ Untested THIS session; ready to run with HARD_CAP=5 + existing output path |
| No sudo required | ✅ user-space throughout |
| No interactive prompts in flow | ✅ verified — no `readline` / `stdin` / `prompt()` in `scripts/audit-d-llm-judge.mjs` |

### Detached-process kickoff pattern (not run; reference only)

```bash
nohup node scripts/audit-d-llm-judge.mjs \
  --input .audit-working/audit-d-sub-batch-1/full-corpus-sample.json \
  --output .audit-working/audit-d-sub-batch-1/full-corpus-verdicts-v2.json \
  > .audit-working/audit-d-sub-batch-1/sb1-v2-run.log 2>&1 &
echo $! > .audit-working/audit-d-sub-batch-1/sb1-v2.pid
echo "Started at $(date -u +%Y-%m-%dT%H%M%SZ); ETA ~3h" \
  > .audit-working/audit-d-sub-batch-1/sb1-v2.status
```

### Status file path

- **PID:** `.audit-working/audit-d-sub-batch-1/sb1-v2.pid`
- **Log:** `.audit-working/audit-d-sub-batch-1/sb1-v2-run.log`
- **Status header:** `.audit-working/audit-d-sub-batch-1/sb1-v2.status`
- **Periodic flushes:** written into the `--output` JSON itself
  (`metadata.last_flush_at` updated every 50 verdicts; `session_history`
  appended). Tail with: `node -e "const v=require('./<path>'); console.log(v.metadata.last_flush_at, v.verdicts.length)"`.

### Prompt-surface audit (external commands)

- ✅ **Pure Node + HTTPS-to-anthropic-only.** Imports (line 68-71):
  `@anthropic-ai/sdk` (HTTPS to api.anthropic.com), `node:fs`,
  `node:path`, `node:url`. Zero shell-outs.
- ✅ `grep -nE "execSync|spawn|exec\(|spawnSync|child_process"` against
  the judge script + sb-fix-2 build/route scripts returned no matches.
- ✅ Non-interactive end-to-end: no `readline`, no `stdin` reads, no
  `prompt()`, no `confirm()` patterns.

---

## Candidate 2 — Weakness-tracker commit 5 (import/export Q-F-1)

### Dependency order per `weakness-tracker-implementation-plan.md` §12

Anticipated sequence:

1. ✅ Sync-engine prefix (`829858f`, SHIPPED 2026-05-22)
2. ✅ recordWeakness helper + 5 call-sites + Fix A (`0b831ba`, SHIPPED 2026-05-22)
3. ⏳ ConfidenceRater UI + plumbing (PENDING; supervisor sign-off note —
   q/w/e/r keyboard collision check required FIRST)
4. ⏳ Pause-on-blur + reveal-on-resume Q-C-3 (PENDING)
5. ⏳ Import/export Q-F-1 (PENDING)
6. ⏳ SCHEMA.md weakness section
7. ⏳ PLAN + supervisor-handoff sync
8. ⏳ Report-#0010

### Is commit 5 parallel-eligible with 3 + 4?

**YES — technically parallel-eligible.** Reasoning:

- Commit 5 touches `exportStoreToFile` (line ~210) + `importStoreFromFile`
  (line ~235) in `src/secplus-quiz.jsx`. Both are localStorage-key-prefix
  scanners — they iterate all keys starting with `weakness-` and
  serialize/restore verbatim.
- Records written by commit 2 (the writer is live) already serialize
  cleanly without `confidence` (when null) or `interrupted` (when false)
  — those are conditional fields omitted from the record per §3 of the
  plan. Export round-trips perfectly with or without commits 3 + 4
  present.
- Tests in §11.1 + §11.2 + §11.3 don't cross-depend on the UI commits.

**Caveat:** while parallel-eligible from a code/test standpoint, the
plan's §12 sequence orders 3 + 4 BEFORE 5 because the UI commits
exercise the writer through real interaction (manual smoke per
§11.3). If commit 5 ships before 3 + 4, the import-export smoke test
exercises records with no `confidence` and no `interrupted` (every
record looks identical) — less informative than the same smoke
AFTER 3 + 4 land. Quality-wise: better to keep the §12 order.

### Mammoth fit

**NO.** Commit 5 is small:

- Code: ~30 lines added across 2 functions in `src/secplus-quiz.jsx`
  (per plan §9.1 + §9.2 diffs).
- Tests: 1-2 new fixtures in existing test files.
- Validator + build + smoke: ~5-10 minutes.
- Total wall-clock estimate: **30-45 minutes**, not 3+ hours.

Better suited as a normal interactive commit within a session,
not as a multi-hour unattended grind.

### Pre-flight checklist (if commit 5 is chosen)

| Check | Status |
|---|---|
| Code is read-only of localStorage in export, additive write in import | ✅ per plan §9.1-9.2 |
| Backwards-compat with older exports (`parsed.weakness` defaults `{}`) | ✅ per plan §9.3 |
| No new localStorage prefixes (uses existing `weakness-`) | ✅ — prefix shipped in commit 1 |
| Test scaffolding exists | ✅ existing `src/__tests__/` + `src/sync/__tests__/` |
| Disk space | ✅ 951 GB free |
| No LLM cost | ✅ $0 |
| Build clean baseline | ⚠️ untested this session; should run `npm run build` first |
| No interactive prompts in flow | ✅ — `npm run build` and `node --test` non-interactive |

### Detached-process kickoff pattern

Not applicable — commit 5 is interactive coding work, not a
long-running command. The "background" would be CC editing files
+ running tests in foreground; nothing to nohup.

### Status file path

N/A.

### Estimated runtime

30-45 min interactive.

### Prompt-surface audit

N/A (no script execution; all is `Edit` / `npm run build` / `node --test`
which are non-interactive and don't shell out to anything beyond Node + npm).

---

## Candidate 3 — Content-cleanup backlog grind

### Inventory of cleanup backlog

#### 3a. `.audit-working/findings/sb-fix-2-classifier-improvements.md`

Two specific improvements to `scripts/sb-fix-2-route-pool-b.mjs` +
`scripts/sb-fix-1b-cluster-verify.mjs`:

- **Improvement 1: needle extractor for mc/scen.** ~10 lines + fixture
  extension. Adds acronym extraction (2-6 uppercase letters), quoted
  substrings, last-clause noun phrase. ~30 min effort.
- **Improvement 2: `looksLikeUmbrellaTitle` heuristic.** ~15 lines +
  fixture extension. Replaces keyword whitelist with broader semantic
  check (CC's lean: Option 1 — whitelist all parent-video titles
  as potential umbrellas unless "Specific" / "Examples of" / "X vs Y"
  framing). ~20-30 min effort.
- **Acceptance criterion (per the findings file):** trigger the tuning
  if G or P packet adjudication shows >30% systematic divergence.
  Packet R hit 56% (10 of 18) — already past threshold. CC's lean
  (recorded in the findings file): defer until P packet 1, see if the
  divergence reproduces, then decide.

Total combined effort if both improvements ship: **~50 min**, single
commit, with `--selftest` fixture extension to verify.

#### 3b. `TODO-content-quality.md` Section 1 — 4 per-item content fixes

**NOT scriptable.** Each item requires pedagogical decisions, not a
mechanical edit:

1. `mc-2.4.14-2` — MOST framing ambiguity (credential stuffing vs
   password spraying both satisfy the criteria). Fix needs human
   judgment about how to disambiguate.
2. `scen-2.2.5-0` — vishing dimension missing from correct answer.
   Needs human judgment about whether to reframe the correct answer
   or replace a distractor.
3. (2 more items in the same file — same shape: weak distractor
   categorization, stem duplication, missing dimensions).

These are surfaced via app-driven study, not via script-driven
grind. Not a fit for unattended work.

#### 3c. `.audit-working/findings/d1-d3-d4-d5-partial-adjacent-from-pool-b.md`

1 entry (SD-WAN scen) — routes OUT of SB-fix-2 scope to a future
D1/D3/D4/D5 partial-adjacent cleanup pass. Not a grind candidate
in this session; explicitly deferred to the (C) successor in
PLAN.md.

#### 3d. `.audit-working/sb-fix-1b/cross-packet-inconsistencies.md`

2 confirmed entries (BEC packet 1 split between SB-fix-1a + SB-fix-1b;
SSL stripping packets 3/4 inconsistent treatment). Supervisor
deferred #100 reconciliation to SB-fix-2 closure per cadence Rule 6
(no mid-stream revision). Not a grind candidate.

### Mammoth fit

**NO.** The scriptable subset (3a — classifier improvements) totals
~50 min of coding + fixtures, not a multi-hour grind. The non-scriptable
subset (3b — content fixes) requires Aiden's pedagogical judgment per
item and is study-session-shaped work, not unattended-grind work.

### Pre-flight checklist (if 3a is chosen as a small interactive pass)

| Check | Status |
|---|---|
| Script `--selftest` infra exists | ✅ already established in sb-fix scripts (`--selftest` flag PASS pattern from SB-fix-1b-prep) |
| No LLM cost | ✅ $0 |
| Disk space | ✅ 951 GB free |
| Build dependencies | ✅ Node + existing test fixtures |
| No interactive prompts in flow | ✅ scripts run `--selftest` flag → exit 0/1 |

### Detached-process kickoff pattern

N/A — 3a is interactive coding work like commit 5. 3b is human-judgment
work and not detachable at all.

### Estimated runtime

3a: ~50 min interactive. 3b: hours of human-judgment work, not
unattended-fit.

### Prompt-surface audit

3a: same as candidate 2 — pure Node + fs + tests. No shell-outs.

---

## Cross-cutting notes

### Budget state (per `docs/supervisor-handoff.md`)

- $5 free + $50 paid (added 2026-05-14) → pre-Audit-D pool ~$53.71.
- Cumulative Audit D spend: $34.63 (SB0 $1.29 + SB1 halt $7.42 sunk
  + SB1 completion $25.92 + $0 across SB1.6 / SB-fix-1a / SB-fix-1b).
- **Remaining: ~$19.08.**
- A top-up is required before any sub-batch that re-runs the
  LLM-as-judge over the full corpus. Per the handoff: "Remaining
  $19.08 covers: SB-fix-1b apply work (no LLM), SB-fix-2 review (no
  LLM expected), Domain 1/3/4/5 PA sub-batches (no LLM expected),
  closure work, and a meaningful margin for any unexpected mid-arc
  LLM-as-judge work."

### CLAUDE.md memory rule on long-running API scripts

> Long-running API scripts must support resume-on-restart from disk
> before first full-corpus use. ... Add this support BEFORE the first
> big run, not after a sunk-cost incident — the cost up front (~30
> min) is dwarfed by the cost of one mid-run failure.

`scripts/audit-d-llm-judge.mjs` already satisfies this rule; the
infrastructure is reusable for any future LLM grind. If a fourth
candidate emerges that DOES involve corpus-wide LLM work, the same
resume + flush + smoke-test pattern is the gate.

### Q-letter checkpoint that's NOT a candidate but flagged in
opening orientation

`project_weakness_tracker_commit_3_keyboard_check.md` (memory) +
supervisor sign-off note 9c5df20: before commit 3 (ConfidenceRater UI)
ships, verify no `q` / `w` / `e` / `r` keyboard collision in existing
handlers. Worth surfacing here in case supervisor wants to authorize
that check as a fast win during this idle window — it's tiny (~5 min
grep + read) and unblocks commit 3.

---

## Recommended next steps (supervisor + Aiden choose)

Honest options as I see them:

**(α) Defer all three; choose a fourth mammoth candidate.** None of
the three above are a great several-hour-unattended fit. If supervisor
+ Aiden see a fourth candidate (e.g., draft D1/D3/D4/D5 partial-adjacent
sample build script + dry-run; pre-build P packets 1-3 against the
56-item pool so they're ready when Sybex book is available; produce
a methodology audit doc consolidating Reports #0005-#0009 patterns),
CC can take that direction.

**(β) Knock out the small interactive items as a chain.** Sequence:
keyboard-collision check (~5 min) → commit 3 ConfidenceRater UI (~60
min) → commit 4 pause-on-blur (~45 min) → commit 5 import/export
(~30-45 min) → SCHEMA + docs + Report-#0010. Total ~3-4 hours, all
interactive but chainable, no LLM cost, fits the time window without
being unattended. Maps to the (b) option in the next-session opener
on `docs/supervisor-handoff.md`.

**(γ) Re-run Audit D full-corpus only after budget top-up + a
methodology change motivates it.** Currently neither condition holds.
Park this for now.

**(δ) Defer to Aiden's home-time path:** SB-fix-2 G review at home
with Sybex book (the (a) option in the next-session opener). CC doesn't
participate in that path; the script work waits.

CC's lean: **(β)** — the small-interactive chain matches the time
window without leaving CC unattended at API spend, and progresses
weakness-tracker closure toward Report-#0010. But supervisor + Aiden
adjudicate.

---

## Boundary on this round

- ✅ Read orientation docs (handoff + PLAN + Report-#0009 + plan +
  findings).
- ✅ Verified resume infrastructure in `audit-d-llm-judge.mjs`.
- ✅ Inspected catalogue + verdicts counts (2,128 audited / 0 remaining).
- ✅ Audited prompt surface of LLM-judge script + sb-fix-2 scripts
  (pure Node + Anthropic SDK; no shell-outs; no interactive prompts).
- ✅ Verified pre-flight enablers (env key + SDK + disk).
- ❌ Did NOT run any candidate — kickoff strictly gated on supervisor
  + Aiden pick per the EOS framing.
- ❌ Did NOT run any LLM call (this entire session = $0).
- ❌ Did NOT modify `src/`, `scripts/`, `questions.json`, or `SCHEMA.md`.

Next gate: supervisor + Aiden pick a path (α / β / γ / δ / other);
CC then runs the live 5-item smoke before any full kickoff per
CLAUDE.md memory rule.

---ready-for-supervisor---
