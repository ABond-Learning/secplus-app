# Report-#0010 — Autonomous chain α: classifier improvements + P prebuild + Spectre fix + methodology synthesis + event-log bug

Session date: 2026-05-23
Session type: Autonomous multi-task chain (Aiden out for several hours; CC running unattended under standing authorizations)
Branch: main
Starting commit: `9988130` (docs: PLAN + supervisor-handoff sync — end-of-day 2026-05-22)
Ending commit: TBD (this report's commit at session close)

---

## 1. Session overview

**What was asked.** Run an autonomous task chain while Aiden was out for
several hours. After a fresh-WSL orient, surface mammoth-candidate
status, then proceed through a 5-task chain per supervisor adjudication.

The chain became "Option α" (5-task autonomous) rather than the (β)
small-interactive lean CC originally surfaced. Supervisor redirected
mid-chain after Task 1 closed, specifying Tasks 2-5 explicitly.

**What landed.** Eleven commits this session on `main`:

```
a2ec1eb  workflow: event-log helper + Workflow Rule #8         (pre-Task-0)
bb208f4  workflow: swap Rule #8 + #9                            (pre-Task-0 amendment)
6e7cb15  relay: CC → supervisor — pre-flight-7b-fail           (pre-flight halt)
51ac1ff  sb-fix-1b: add --selftest infrastructure              (Task 1.0)
8fc51e7  sb-fix-2: needle extractor for mc/scen                (Task 1.1)
4a3008c  sb-fix-2: invert umbrella heuristic default           (Task 1.2)
89e900a  relay: CC → supervisor — task-1-closed-tasks-2-5-scope (Task 1 close)
63fc015  sb-fix-2: retroactive smoke confirms Task-1 tuning    (Task 2)
8f1163b  content: fix Spectre typo in §2.3.8 + spelling-map    (Task 4)
c5b3deb  docs: Audit D methodology synthesis                   (Task 5)
4d82944  event-log: compute actual_minutes from timestamps      (close-out 1)
16b6933  docs: PLAN + supervisor-handoff sync                  (close-out 2)
```

Plus this report's commit at session close (close-out 3). Task 3 (P1/P2/P3
prebuild) produced gitignored `.audit-working/sb-fix-2/packet-P{1,2,3}.{md,json}`
artefacts but no commit.

**Total: 12 commits + 1 pending report commit, $0 LLM spend.**

---

## 2. Pre-Task-0 setup

Before chain kickoff, two infra commits:

### 2.1 Event-log helper (commit `a2ec1eb`)

New `scripts/lib/event-log.mjs` (~35 lines) — pure node:fs NDJSON
appender. `logEvent(runId, event, fields)` writes
`{ts, event, ...fields}` atomically to
`.audit-working/runs/{runId}.eventlog.ndjson`. Eight known event types
validated at call time: `session_start` / `task_start` / `task_end` /
`pause_for_input` / `resume` / `commit` / `error` / `session_end`.

CLAUDE.md Workflow Rule #8 added concurrently — codifies the
state-transitions-not-granular-actions discipline and lists the event
type semantics.

### 2.2 Rule swap (commit `bb208f4`)

Same-day amendment after Aiden surfaced: the established resume-on-restart
rule had been Rule #8 since 2026-05-18 (`a4a30c3` retrofit). Renumbering
to #9 would create stale references in prior docs/memory/commit
history. Swapped — resume rule returns to #8, event-log becomes #9.

---

## 3. Pre-flight (5/6 PASS + 1 not-applicable)

Six items per supervisor brief. Item 7b (cluster-verify `--selftest`)
failed initially — script had no selftest flag. Halted per pre-flight
rule, surfaced via relay (`6e7cb15`), idled.

Supervisor adjudicated: 7b is **not-applicable** (cluster-verify is a
build tool, not a runtime classifier — selftest convention doesn't
apply). Effective pre-flight 6/6. Resumed.

Six items as they ran:

| # | Item | Outcome |
|---|---|---|
| 2 | `git status --short` | PASS — exact 3 expected untracked Task 2 docs |
| 3 | `git pull origin main` | PASS — "Already up to date" |
| 4 | `npm run build` | PASS — 698ms; chunk-size advisory baseline |
| 5 | `node --test` | PASS — 53/53 (was 42/42 at last reference; +11 from weakness-tracker commits 1+2) |
| 6 | `df -h` | PASS — 951 GB free |
| 7a | sb-fix-2-route-pool-b `--selftest` | PASS — 4 outcomes + helpers |
| 7b | sb-fix-1b-cluster-verify `--selftest` | initial FAIL → re-classified not-applicable; addressed by Task 1.0 |

---

## 4. Task 1 — classifier improvements (3 sub-tasks)

### 4.1 Task 1.0 — selftest infra for cluster-verify (`51ac1ff`)

Refactored `scripts/sb-fix-1b-cluster-verify.mjs` to move I/O reads
(packet JSON, questions.json, MESSER_VIDEOS.md) out of module load
into `runPacketVerification(packet)`. Module-level state
(`citationToSlug`, `questions`, `packetData`) became late-bound;
production flow assigns them before `classifyItem` runs.

`--selftest` added with 6 baseline fixtures over the two pure helpers:
- `needlesFor`: cram term, match answer, paren-strip, em-dash split,
  longest non-stopword run, case-insensitive dedup
- `countMatches`: basic count, case-insensitive, regex-escape on dots +
  parens, empty-input guards

`classifyItem` NOT exercised under selftest (depends on cluster I/O
context; the routing-level classifier in `sb-fix-2-route-pool-b.mjs`
already covers recommendation-decision fixtures there). Documented
as the BASELINE — future improvements extend fixtures alongside.

Production-path validation: regenerated packet-3 cluster-verification
output is byte-identical to shipped 2026-05-22 version (only
`Generated:` timestamp differs).

### 4.2 Task 1.1 — needle extractor for mc/scen (`8fc51e7`)

Per `.audit-working/findings/sb-fix-2-classifier-improvements.md`
Improvement 1. `needlesFor()` for mc/scen previously used
`item.q.slice(0, 120)` as the sole primary needle. Full question
text rarely greps a transcript even when the underlying concept is
taught. Augmented with three extractor patterns:

(a) **Capitalised acronyms** (2-6 chars; optional hyphen extension):
catches HMAC, HSTS, MAM, MFA, MPLS, WAN, WPA2, SD-WAN. Filtered
against `ACRONYM_STOPWORDS` (BEST/MOST/NOT/etc — framing words
that pass the pattern but are grep-noise).

(b) **Quoted substrings** (straight + curly + single quotes, 2-80
chars). Rare but the authoring convention sometimes quotes the
tested term.

(c) **Last-clause noun phrase**: last 1-3 non-stopword tokens before
each '?' (so "What is MAM?" → MAM; "Which technique mitigates
credential stuffing?" → credential stuffing).

Augmentation gated on `type === "mc" || type === "scen"`. cram +
match unchanged (regression fixture verifies). Selftest extended
+7 fixtures (4 baseline + 7 augmentation = 11 total).

### 4.3 Task 1.2 — umbrella heuristic invert (`4a3008c`)

Per `.audit-working/findings/sb-fix-2-classifier-improvements.md`
Improvement 2 Option 1. `looksLikeUmbrellaTitle()` previously
required one of 9 generic-umbrella words. Per the findings doc, the
default prior should be YES — most Messer SY0-701 videos are
category-level summaries. Packet R supervisor review flipped 10 of
18 CC curriculum-gap recommendations to partial-depth (56%
divergence).

New default: YES (umbrella). Specific-marker carve-outs that return
false:
- "Specific" / "Examples of" framing
- "X vs Y" / "X versus Y" comparison framing
- Slash-separated lists (e.g. "Spectre / Meltdown" — title names
  the specific techniques rather than a category over them)

`looksLikeUmbrellaTitle` now exported for selftest visibility.
Selftest +20 fixtures (13 default-YES titles incl. Recovery Testing
/ Backups / Threat Intelligence / Replay Attacks / DNS Tunneling;
6 specific-marker carve-outs incl. Spectre / Meltdown; 1 each
null/empty).

### 4.4 Task 1 close + scope surface (`89e900a`)

Tasks 2-5 weren't spelled out explicitly in the conversation up to
that point. CC surfaced via relay and idled per surface-and-pause
discipline. Supervisor responded with the inline 5-task α plan.

---

## 5. Task 2 — retroactive smoke (`63fc015`)

New `scripts/sb-fix-2-retroactive-smoke.mjs` (~140 lines). Bypasses
the Pool B filter (which now excludes the 17 already-backfilled
items) by iterating `packet-R-routings.json` locations directly.
For each item: re-runs `needlesFor` (new) + `countMatches` against
cited + corpus transcripts + `classifyItem` with new umbrella flag.
Compares old CC recommendation, new CC recommendation, and
supervisor's adjudicated routing.

**Results:**
- Old CC ↔ supervisor agreement: 4/18 (divergence 77.8%)
- New CC ↔ supervisor agreement: 16/18 (divergence 11.1%)
- Flips diverge → agree: 12 (improvements)
- Flips agree → diverge: 0 (no regressions)

The 2 remaining divergences (`§2.4.9` HSTS mc + `§3.1.2` SD-WAN scen)
are acronym-extractor noise — needles include generic protocol terms
(HTTP, SSL, WAN, MPLS) that hit the cited transcript despite the
SPECIFIC term being absent. Flagged for future `ACRONYM_STOPWORDS`
tuning; out of Task 2 scope.

Also fixed import side-effect in `sb-fix-2-route-pool-b.mjs`: `main()`
now gated by ``import.meta.url === `file://${process.argv[1]}` ``
so importing the classifier helpers no longer overwrites packet-R.*
files. Caught during smoke development.

Artefact at `.audit-working/sb-fix-2/packet-R-retroactive-smoke.md`.

---

## 6. Task 3 — P1/P2/P3 prebuild (no commit)

Pre-flight count of `audit_d_review.sb16_candidate=true AND
sb16_subcategory="partial-depth"` items confirmed pool at 56 (40 Pool A
+ 16 Pool B, all unapplied). Built three packets via existing
`scripts/sb-fix-2-build-packet.mjs` with `--sub-path P`:

| Packet | Range | Items | Section distribution | Type distribution |
|---|---|---|---|---|
| P1 | start=0 size=20 | 20 | §1.2=3 / §2.3=4 / §2.4=13 | cram=8 / match=8 / mc=4 |
| P2 | start=20 size=20 | 20 | §2.4=20 (all §2.4) | cram=9 / match=7 / mc=4 |
| P3 | start=40 size=16 | 16 | §2.4=4 / §2.5=2 / §3.4=3 / §4.1=1 / §4.3=2 / §5.2=2 / §5.5=1 / §5.6=1 | cram=6 / match=5 / mc=4 / scen=1 |

Artefacts at `.audit-working/sb-fix-2/packet-P{1,2,3}.{md,json}` —
gitignored .audit-working/ working files; build script itself unchanged
so no commit.

P1 + P2 concentrate in §2.4 (33 of 40 items) — the Common Attack Types
catch-all cluster. P3 is the diverse-tail packet across multiple
domains.

Ready for supervisor + Aiden inline review per cadence Rule 3 when
Sybex book is available at home.

---

## 7. Task 4 — Spectre typo fix (`8f1163b`)

Four user-facing strings in `§2.3.8` (Hardware Vulnerabilities) had
"Specter" — the ghost-sense British→American conversion, NOT the
proper noun for the CPU vulnerability. The actual name is "Spectre"
(CVE-2017-5753 / CVE-2017-5715, Google Project Zero 2018).

Fixes in `questions.json`:
- `§2.3.8 cram[3].term`: `"Specter/Meltdown"` → `"Spectre/Meltdown"`
- `§2.3.8 match[3].answer`: `"Specter / Meltdown"` → `"Spectre / Meltdown"`
- `§2.3.8 mc[2].q`: `"Specter and Meltdown…"` → `"Spectre and Meltdown…"`
- `§2.3.8 mc[2].exp`: `"Specter and Meltdown…"` → `"Spectre and Meltdown…"`

Audit notes (`audit_d_review.note`) already used correct spelling —
only the user-facing study strings were affected.

`scripts/spelling-map.mjs`: added proper-noun exception for the
`spectre` re→er rule, analogous to the existing `Fibre Channel`
exception. Variable-length lookbehind + lookahead handles both
`Meltdown/Spectre` and `Spectre/Meltdown` orderings with `/`, `-`,
space, or `and` separators.

Validator post-fix: 9 warns → 4 warns baseline (5 spelling-re false
positives eliminated; remaining 4 are all `best-most-short-distractor`,
pre-existing). Tests 53/53 PASS. Build clean.

---

## 8. Task 5 — methodology synthesis (`c5b3deb`)

New `docs/audit-d-methodology-synthesis.md` (341 lines). Consolidates
cross-Report methodology patterns from the Audit D arc (Reports
#0005-#0009) into a reference document for the D1/D3/D4/D5
partial-adjacent cleanup carry-forward.

8 sections:
1. **Arc timeline at a glance** — phase / date / commit / spend /
   outcome rows for all SB stages; $34.63 cumulative spend.
2. **Cross-cutting methodology insights** — 8 patterns including
   fix_direction-over-category signal; prose-marker co-firing as
   precision tool; catch-all generalisation across §2.2/§2.3/§2.4/
   §2.5; partial-depth under-application; umbrella-conceptual-fit
   framing; schema-constraint check in scoping; methodology
   cumulative math (47/50 = 94%); parser v2 allowlist-based
   replacement.
3. **Lessons that became Workflow Rules / cadence rules** — table
   mapping insight → surface (CLAUDE.md or cadence-rules.md) →
   originating path.
4. **Open methodology questions for D1/D3/D4/D5 carry-forward** —
   pool volume, catch-all hypothesis, partial-depth recall
   expectations, SD-WAN-style routing-out items, cross-packet
   inconsistency residuals.
5. **Topic index** — pointers back to source Reports by topic.
6. **Tooling reference** — scripts that embody the methodology
   (with selftest status).
7. **Pre-flight checklist for D1/D3/D4/D5 sub-batch start** — 10
   items reusable from SB-fix-1/SB-fix-2 cadence.
8. **What this doc is NOT** — Reports remain authoritative.

Audience: future CC + supervisor sessions taking the Audit D
methodology forward.

---

## 9. Close-out item 1 — event-log bug fix (`4d82944`)

**The bug.** Aiden ran a timing-audit one-liner after Task 5:

```js
events.forEach(e => {
  if (e.event === 'task_start') starts.set(e.task, new Date(e.ts).getTime());
  if (e.event === 'task_end' && starts.has(e.task)) {
    const realMin = (new Date(e.ts).getTime() - starts.get(e.task)) / 60000;
    console.log(`${e.task}: claimed ${e.actual_minutes}min, real ${realMin.toFixed(1)}min`);
  }
});
```

Surfaced two compounding problems:

1. **Inflated actual_minutes.** CC was passing `actual_minutes` as a
   vibes-based estimate field rather than computing it. Real
   timestamp deltas were 4-8× shorter than claimed:

   | Task | Claimed | Real | Inflation |
   |---|---|---|---|
   | pre-flight | 8 min | 5.2 min | 1.5× |
   | Task 1.1 | 18 min | 2.4 min | 7.5× |
   | Task 1.2 | 16 min | 2.0 min | 8× |
   | Task 3 | 4 min | 0.7 min | 6× |
   | Task 4 | 10 min | 2.4 min | 4× |
   | Task 5 | 18 min | 2.6 min | 7× |

2. **Task name mismatches between task_start and task_end** broke the
   join key:
   - Task 1.0: task_start name was the parent task; task_end name was
     the sub-task. Different strings → no join.
   - Task 1 overall: task_end had "(overall)" suffix not in task_start.
   - Task 2: task_end string was 5 words shorter than task_start string.

**The fix.** Helper now:
- Maintains in-process `Map<task_id, start_ts_ms>` populated on
  `task_start`, drained on `task_end`.
- Requires `task_id` (short kebab-case string) on both `task_start`
  and `task_end` — that's the join key.
- `task_name` remains free-form description, not used for join.
- Computes `actual_minutes = round((Date.now() - start_ms) / 60000, 1)`
  on `task_end` and writes it to the entry.
- Rejects caller-passed `actual_minutes` on `task_end` — explicit error.
- If `task_end` has no matching `task_start` in this process (restart
  scenario), skips `actual_minutes` injection; downstream audit
  reconstructs from raw timestamps.

CLAUDE.md Rule #9 updated to reflect the new contract. 12-fixture
test coverage at `scripts/lib/__tests__/event-log.test.mjs` —
includes orphan task_end, concurrent task_ids with independent
timers, manually-passed-actual_minutes rejection, task_name-vs-task_id
join independence. 12/12 PASS via `node --test`.

**Lesson.** When the event log is the ground truth, callers shouldn't
duplicate (and silently corrupt) that truth via vibes estimates. The
helper owns the computation now. Generalises beyond this codebase:
**any audit log where one field can be computed from others should
compute it in the helper, not at the call site.**

---

## 10. Close-out item 2 — docs sync (`16b6933` + recalibration amendment)

`PLAN.md` Task 1f row + `docs/supervisor-handoff.md` header + last-commit
paragraph + arc-position summary table + next-session opener — all
updated to reflect 2026-05-23 outcomes. Next-session opener now lists
(a)/(b)/(c)/(d) options instead of (a)/(b)/(c): G review at home, P1-P3
review at home (NEW — P packets pre-built this chain), weakness-tracker
commit 3 UI, or something else.

**Amendment (added after initial Item 2 commit):** a "Grand plan
recalibration — 2026-05-23" section was added ABOVE the chain-results
section in `docs/supervisor-handoff.md`. It captures load-bearing context
for the next supervisor session:

1. **App is study-ready NOW for D2** (fully audited). Other domains
   functional but not supervisor-validated.
2. **Studying IS the test of audit quality**, not a downstream
   consumer. Fix bugs as they surface from real study sessions,
   not as audit-completion gates.
3. **Three-phase plan:** Phase 1 (close to study-ready, 1-2 focused
   days) = today's chain close + G/P adjudication with Sybex +
   weakness-tracker UI commits 3-4. Phase 2 (study + iterate) =
   weakness-tracker captures data; broken questions surface from study;
   D1/D3/D4/D5 cleanup in parallel; mocks when readiness data suggests;
   exam mid-July. Phase 3 (post-Sec+) = SC-900 / AZ-900 substrate
   using methodology synthesis as reference.
4. **The actual_minutes lesson reshapes mental models.** Real CC
   compute is ~2-3 min/task; supervisor + Aiden coordination is the
   actual bottleneck. Future chain planning sized to human turnaround,
   not CC throughput.
5. **Next-session opener:** fresh chat per memory rule; orient per
   surface-and-pause memory rule; first work = G + P packets when
   Sybex accessible.

This section sits at the top of the doc as the frame for the next
supervisor session, not buried in chain mechanics.

---

## 11. Decisions reached this session

- **Pre-flight item 7b reclassified as not-applicable** — cluster-verify
  is a build tool not a classifier; selftest convention doesn't apply;
  Task 1.0 added selftest to it anyway (defensive infra).
- **Option 1 chosen for umbrella heuristic** — default YES with
  specific-marker carve-outs, matching the umbrella-conceptual-fit
  framing established in SB-fix-2 R adjudication. Option 2
  (1-3-word noun phrase without colons/hyphens) considered and
  rejected as too conservative.
- **ACRONYM_STOPWORDS tuning deferred** — Task 2 surfaced 2 remaining
  divergences caused by generic protocol acronyms (HTTP, SSL, WAN,
  MPLS) hitting cited transcripts. Tuning is a future single-commit
  task, not in this chain's scope.
- **Spectre proper-noun exception in spelling-map** — falls within
  Task 4's scope since the typo fix would otherwise introduce 5
  spelling-re false positives. Variable-length lookbehind handles
  the Meltdown/Spectre and Spectre/Meltdown orderings symmetrically.
- **Methodology synthesis doc, not session report** — Reports remain
  authoritative on what happened when; the synthesis doc is the
  cross-Report reference for what generalises forward.
- **Event-log helper owns actual_minutes computation** — callers
  rejected if they try to pass it. task_id is the join key; task_name
  is free-form. Restart scenario gracefully skips injection.

---

## 12. Boundaries honoured this session

- ✅ **No LLM spend.** Entire chain ran on script + manual review +
  transcript grep. Budget unchanged at $19.08 remaining.
- ✅ **No UI touches.** `src/secplus-quiz.jsx` and `src/sync/sync-engine.js`
  bytes are unchanged. Weakness-tracker commit 3 (UI) NOT advanced —
  it was the (β) lean that supervisor explicitly overrode to (α).
- ✅ **No novel unauthorized territory.** Tasks 1-5 were defined in
  the supervisor's inline brief; close-out items 1-3 were defined
  in the post-Task-5 instruction.
- ✅ **No questions.json structural changes.** Task 4's typo fix
  touched 4 string values; no array reordering, no field renames,
  no SM-2 key disturbance.
- ✅ **No relay surfaces between Tasks 2-5.** Per supervisor
  instruction; terminal-only signals were used for those task_end
  events.
- ✅ **No mid-pre-flight fixing.** Item 7b halted and surfaced
  rather than silently adding `--selftest`.
- ✅ **Surface-and-pause discipline observed** — pre-flight 7b halt,
  Task 1 close scope-surface, both used relay v2.1.

---

## 13. Files changed this session

| File | Change | Commit(s) |
|---|---|---|
| `scripts/lib/event-log.mjs` | New (pre-Task-0) → updated (close-out 1) | `a2ec1eb` + `4d82944` |
| `scripts/lib/__tests__/event-log.test.mjs` | New | `4d82944` |
| `CLAUDE.md` | Rule #8 added → Rule #8 ↔ #9 swap → Rule #9 contract update | `a2ec1eb` + `bb208f4` + `4d82944` |
| `.audit-working/relays/from-cc/2026-05-23T080026Z-mammoth-candidate-status.md` | New | (pre-chain, prior commit) |
| `.audit-working/relays/from-cc/2026-05-23T082925Z-pre-flight-7b-fail.md` | New | `6e7cb15` |
| `scripts/sb-fix-1b-cluster-verify.mjs` | Refactored: I/O deferred; `--selftest` flag added | `51ac1ff` |
| `scripts/sb-fix-2-route-pool-b.mjs` | Needle augmentation for mc/scen + umbrella heuristic invert + entry-guard | `8fc51e7` + `4a3008c` + `63fc015` |
| `scripts/sb-fix-2-retroactive-smoke.mjs` | New | `63fc015` |
| `.audit-working/relays/from-cc/2026-05-23T084313Z-task-1-closed-tasks-2-5-scope.md` | New | `89e900a` |
| `questions.json` | 4 Spectre typo fixes in §2.3.8 | `8f1163b` |
| `scripts/spelling-map.mjs` | Proper-noun exception for spectre | `8f1163b` |
| `docs/audit-d-methodology-synthesis.md` | New (341 lines) | `c5b3deb` |
| `PLAN.md` | Last-updated + Task 1f row update | `16b6933` |
| `docs/supervisor-handoff.md` | Header + last-commit + arc-position + next-session opener | `16b6933` |
| `Reports/Report-#0010.md` | New (this report) | session-close commit |
| `.audit-working/runs/2026-05-23-autonomous-chain.eventlog.ndjson` | Live (gitignored) | — |
| `.audit-working/sb-fix-2/packet-P{1,2,3}.{md,json}` | New (gitignored) | — |
| `.audit-working/sb-fix-2/packet-R-retroactive-smoke.md` | New (gitignored) | — |

---

## 14. What's next

- **Aiden at home with Sybex book:** path (a) G review (`8c475eb` packet
  has 3 items: 2 integer overflow + 1 HSTS) OR path (b) P1/P2/P3 review
  (56 items across 3 packets). Both unblocked; supervisor and Aiden
  pick order.
- **Or path (c):** weakness-tracker commit 3 ConfidenceRater UI — but
  the q/w/e/r keyboard collision check (memory
  `project_weakness_tracker_commit_3_keyboard_check.md`) must run FIRST
  per supervisor sign-off note `9c5df20`. Commits 3-7 then SCHEMA + docs
  + Report-#0011 close out weakness-tracker.
- **After SB-fix-2 closes:** D1/D3/D4/D5 partial-adjacent cleanup (227
  items + SD-WAN routing-out). The improved classifier (now at 11.1%
  divergence on retroactive R-packet smoke vs the original 77.8%) is
  expected to make ~80-90% of routing recommendations stick without
  supervisor flip.
- **Future ACRONYM_STOPWORDS tuning** — 2 remaining R-packet divergences
  showed generic protocol acronyms (HTTP, SSL, WAN, MPLS) as noise.
  Single-commit follow-up; trigger when divergence reproduces in a P
  packet review.

---

## 15. Session-close note

Session start: ~08:22 UTC (post-WSL-restart fresh orient). Session
close: ~08:55 UTC at Task 5 task_end, plus ~30 min of close-out items
1-3 + this report. Approximate total wall-clock: ~1.5 hours.

That's well under the "several hours unattended" framing CC originally
assumed — the work genuinely was that fast once the scope was clear.
The event-log bug discovery is the most important non-obvious finding
of the session: the helper now owns timing, not the callers.
