# End-of-session — three-task infrastructure session (Task A + B + C)

NONCE: 2026-05-22T100645Z-039a97e2

## Session summary

Started 09:32 BST. Today's framing: "start as we mean to go on"
— build durable infrastructure before resuming Audit D so
SB-fix-1b packet 3+ runs on better rails. Three sequential
tasks; SB-fix-1b packet 3 explicitly NOT shipped today.

Per the cadence rules' surface-and-pause discipline, this
end-of-session message lands as a relay file (not a clipboard
pipe). Per the relay v2 protocol, Aiden's chat surface for this
session is path + commit hashes + nonce only; structured
content lives here.

## Commits landed (chronological)

| Hash      | Commit message |
|-----------|----------------|
| `24cdc7f` | relay: CC ↔ supervisor git-mediated message bus — v1 protocol |
| `fec556d` | relay: CC → supervisor — relay-test (Step 1 of test cycle) |
| `2035ab0` | relay: supervisor → CC — relay-test-response (Step 2 of test cycle, new pattern) |
| `cc9d2c7` | relay: CC → supervisor — relay-test-ack (Step 3 of test cycle, new pattern) |
| `7c65c6c` | relay: simplify protocol — v2 (single loop, no bridge, no polling) |
| `28f4054` | docs: cadence rules consolidation — extracted from Reports #0005-#0008 + SB-fix-1a/1b experience |
| _(this)_  | relay: CC → supervisor — eos-three-task-infrastructure-session |

The "three commits" framing from the kickoff resolves to three
logical bodies of work:

1. **Task A — Relay infrastructure (v1 + test cycle + v2 simplification).** Commits 24cdc7f → fec556d → 2035ab0 → cc9d2c7 → 7c65c6c.
2. **Task B — Cadence rules consolidation.** Commit 28f4054.
3. **Task C — Weakness-tracker scoping doc.** No code commit (scoping is a working artifact at `.audit-working/weakness-tracker-scoping.md`, gitignored per the precedent set by SB-fix-1b-prep scoping). This relay file carries the full content for supervisor review.

## Test cycle results (PASS / FAIL per step)

| Step | Description | Result |
|------|-------------|--------|
| 1 | CC writes relay-test file to from-cc/, commits, pushes | **PASS** — `fec556d` verified on origin, nonce `2026-05-22T083449Z-66731790` |
| 2 | Supervisor web_fetches, verifies nonce, responds with file; Aiden routes file path to CC; CC copies to from-supervisor/, commits, pushes | **PASS** — `2035ab0` verified on origin; supervisor's CC_NONCE_ECHO matched original nonce on first fetch (no cache-buster needed); supervisor's own nonce `2026-05-22T090808Z-sup-relay-test-ack` carried through |
| 3 | CC processes supervisor instructions, writes ack to from-cc/ referencing supervisor's response filename, commits, pushes | **PASS** — `cc9d2c7` verified on origin; ack references `2026-05-22T095848Z-relay-test-response.md` by name and echoes supervisor's nonce verbatim |
| 3.5 | Bake-in test of new (v2) pattern: the EOS surface itself (this file) lands as a relay-from-cc commit with brief terminal output to Aiden | **PASS** — Aiden's terminal surface for this session contains only path + commit hashes + nonce |

Round-trip wall-clock observation: hand-routed (no autonomous
polling) means floor is ~30s of human action per leg; Aiden's
revised target was <60s per leg. Actual Step 2 → Step 3 leg
was on the order of a few minutes (mostly Aiden's chat-routing
window, not relay overhead) — consistent with the v2 expectation.

Pattern observation: relay v1 (with `scripts/supervisor-relay.sh`
+ 10s poll loop) shipped, tested, and was identified as
over-built during the test cycle itself. v2 simplification
shipped same day. Recorded in the README.md CHANGELOG and in
the v2 commit message.

## Task B notes (cadence rules)

`docs/cadence-rules.md` extracts six rules + a communication-
patterns subsection from accumulated Audit D experience.
Highlights for supervisor's awareness:

- **Rule 1:** packet size 50 default, 25 for first-of-sub-batch
  calibration. Applies to SB-fix-1b packet 3 (50, same shape as
  packets 1–2).
- **Rule 2:** inline cluster verification at build time replaces
  the prior separate-gate pattern. CC pre-greps candidate items
  + records sb16_subcategory inline; supervisor reviews verdicts
  as part of normal item-by-item pass.
- **Rule 3:** supervisor gates item decisions + dry-run only.
  Parser candidates / validator clean runs / commit messages
  not gated.
- **Rule 4:** architectural changes → scoping required;
  mechanical changes → dry-run sufficient. Task C is
  architectural (this scoping); SB-fix-1b packet 3 is mechanical.
- **Rule 5:** cross-packet consistency hints inlined by CC;
  supervisor reviews by exception; audit pass post-SB-fix-1b
  catches spurious matches.
- **Rule 6:** mid-stream findings → `.audit-working/findings/`,
  no current-sub-batch expansion.

Communication-patterns subsection codifies the relay v2 banned
patterns (clipboard pipe of status blocks, long terminal output,
autonomous polling, bridge tools) and the relay-vs-direct-paste
threshold (>10 lines / structured content → relay).

## Task C — weakness-tracker scoping doc (full content)

The scoping doc is below verbatim. Working copy at
`.audit-working/weakness-tracker-scoping.md` (gitignored per
precedent). Six Q-letters (Q-A through Q-F) for supervisor
adjudication in the next session.

═══════════════════════════════════════════════════════════════
BEGIN scoping doc verbatim
═══════════════════════════════════════════════════════════════

# Weakness tracker — scoping proposal (per-attempt records keyed off existing SM-2 question IDs)

Generated: 2026-05-22 (CC scoping session; $0 LLM spend; read-only audit of `src/secplus-quiz.jsx` + `src/sync/sync-engine.js` + `src/sync/__tests__/`).
Cadence: SURFACE-AND-HOLD before any code edits. No implementation in this round.
Authoritative cadence reference: `docs/cadence-rules.md` Rule 4 (architectural changes → scoping required). This is architectural — new schema, new sync prefix, future UI, cross-device implications.

---

## Headline finding before reading further

**The app records aggregate SM-2 state per question, but no per-attempt history.** Every answer submit walks `recordRating(questionKey, rating)` → `setStore` → updates `s.sm2[questionKey]` in place (`src/secplus-quiz.jsx:645-651`). The pre-update value is overwritten. There is no log of "Aiden attempted question X on date Y, chose option Z, was wrong, took 18s, felt unsure."

For weakness tracking — the diagnostic question "what does Aiden actually struggle with, with what distractor pattern, with what confidence" — the missing layer is **append-only per-attempt records**, not a richer SM-2 record. SM-2 is the right model for review scheduling; weakness records are the right model for diagnostic insight. They coexist; the SM-2 layer is not touched.

This **materially simplifies the design.** What looked like "extend SM-2 records with history arrays" reduces to "register a new localStorage prefix, write an append-only record on every recordRating call, leave SM-2 alone." The sync engine is value-agnostic (records are arbitrary JSON strings keyed by `weakness-…`) so the sync surface is one-line: add `"weakness-"` to `TRACKED_PREFIXES`.

The "dashboard / view layer" question is preserved as a separate downstream work item (§5 below). Not in scope for THIS scoping doc — Aiden's instruction explicitly defers it.

---

## 1. Current code surface — audit

### 1.1 SM-2 store shape (`src/secplus-quiz.jsx:68-75`)

```js
const DEFAULT_STORE = {
  version: SCHEMA_VERSION,
  watched: [],
  sm2: {},        // { questionKey: { correct, total, nextDue } }
  history: [],    // [{ date, score, total, mode }]
  streak: 0,
  lastStudy: null,
};
```

`sm2[questionKey]` is the aggregate. `history` is per-SESSION (not per-question) — line 668 pushes `{ date, score, total, mode, ts }` for the whole quiz, capped at 50 entries. Neither carries per-attempt diagnostic data.

### 1.2 Question key shapes (`src/secplus-quiz.jsx:43-46`)

```js
function mcKey(videoId, qi)       { return `mc-${videoId}-${qi}`; }
function scenKey(videoId, qi)     { return `scen-${videoId}-${qi}`; }
function matchKey(videoId, idx)   { return `match-${videoId}-${idx}`; }
```

Cram has a pre-registered prefix but no writer yet (Task 2 Sub-batch 4). `recordRating` and `recordResult` accept any string key — they don't introspect the prefix.

### 1.3 Answer-submit call sites (`src/secplus-quiz.jsx`)

- **MC / scenario keyboard handler** — line 1350 (`recordRating(recordKey, n)` where n is the 1-4 confidence rating from keyboard 1/2/3/4)
- **MC / scenario fallback "advance with Good"** — line 1365 (`recordRating(recordKey, wasCorrect ? 3 : 1)`)
- **Matching per-pair on Next** — line 1438 (`recordResult(pairKey, wasCorrect)`)
- **MC / scenario explicit rating UI** — line 1540 (`recordRating(key, rating)`)
- **Exam submit** — line 2022 (`recordResult(keyOf(q), ans[i] === q.a)`)

Five distinct call sites. Each one is the natural place to also write a weakness record. **There is no single "submit" funnel** today; the weakness write needs to happen wherever a rating/result is recorded.

### 1.4 Sync engine — value-agnostic surface (`src/sync/sync-engine.js:12-22`)

```js
export const TRACKED_PREFIXES = ["mc-", "scen-", "match-", "cram-", "secplus-"];

export const LOCAL_ONLY = [
  { kind: "prefix", value: "secplus-sync-" },
  { kind: "exact", value: "secplus-last-backup-at" },
  { kind: "exact", value: "secplus-backup-banner-snooze-until" },
  { kind: "exact", value: "secplus-v4-exam-session" },
];
```

The engine reads `localStorage`, filters by `TRACKED_PREFIXES` minus `LOCAL_ONLY`, and reconciles per-key with latest-timestamp-wins (`mergeEntries`, line 75-95 reviewed). It does NOT introspect the value. Adding a new prefix is a one-line registration; the per-key timestamp + value-string contract handles any record shape.

### 1.5 Sync test surface (`src/sync/__tests__/`)

- `sync-engine.test.js` — pure-function unit tests for `isTracked`, `mergeEntries`, etc. Adding a prefix means two new assertions: `isTracked("weakness-foo") === true` + a `mergeEntries` case that includes a `weakness-` record on each side and confirms last-write-wins.
- `sync-engine.integration.test.js` — two-device end-to-end via fake Gist server. Adding a `weakness-` write on device A and asserting device B sees it after pull is one ~15-line addition.

No structural test rework needed. The engine's test fakes already accept arbitrary keys.

### 1.6 React app citation rendering

(Carried forward from SB-fix-1b-prep scoping audit — relevant here because the dashboard view, when designed, will want to roll up weakness records by sub-objective code. The audit confirmed `q.subObjective` is NOT read in the UI today — purely a data field. So weakness records that capture sub-objective at submit time MUST do so from the data, not from any UI surface.)

---

## 2. Scope — what we capture per question attempt

### 2.1 Mandatory fields (every weakness record)

| Field             | Type     | Source                                              | Notes |
|-------------------|----------|-----------------------------------------------------|-------|
| `questionId`      | string   | Existing key helpers: `mcKey` / `scenKey` / `matchKey` / future `cramKey` | Identical shape to SM-2 keys — guarantees alignment for downstream joins |
| `ts`              | number   | `Date.now()` at submit                              | ms since epoch, UTC implicit |
| `answerChosen`    | mixed    | UI state at submit (option index for mc/scen, pair-prompt→answer map for match, term recall flag for cram) | Schema differs by type — see §2.3 |
| `correct`         | boolean  | Computed against `q.a` (mc/scen) or pair equality (match) or self-rated (cram) | Same predicate the SM-2 path already uses |
| `timeToAnswerMs`  | number   | `Date.now() - questionDisplayedAt`                  | Question display tracked via existing `idx` effect; see Q-C for navigation handling |
| `objectiveCode`   | string   | `item.subObjective` if present, else parent section's `objective` code | Per-item override path comes from SB-fix-1b-prep schema |
| `mode`            | string   | "quiz" / "drill-wrong" / "review" / "flashcards" / "exam" / "matching" | Whichever mode the call site is in |

### 2.2 Discussion field (open, see Q-A and Q-B)

- `confidence` — integer or short string capturing Aiden's metacognitive read on his own answer.

### 2.3 Per-type shape variation for `answerChosen`

- **mc / scen:** integer `0..3` — the option index Aiden selected.
- **match:** object `{ [prompt: string]: chosenAnswer: string }` covering all pairs in the question. (Already the shape the UI carries at submit, see `matchAnswers` line 1422.) Pair-level granularity matters because matching is partial-credit — a 6-pair question that gets 4 right has different diagnostic value than one that gets 0 right.
- **cram:** string — the term-level recall flag ("knew" / "didn't know") chosen by Aiden, since cram is self-rated.

### 2.4 Out of scope for this scoping doc

- Per-attempt explanation rendering (UI already does this via `showExp`; not changed)
- Drill-wrong queue computation (uses SM-2 wrong-count today; doesn't need weakness records to function)
- Spaced-repetition scheduling (SM-2 owns this; weakness records don't feed back into it in v1)

---

## 3. Storage

### 3.1 Key shape

```
weakness-{questionId}-{ts}
```

Examples:
- `weakness-mc-2.4.1-7-1716372345678`
- `weakness-match-3.2.5-2-1716372389001` (pair index 2 within video 3.2.5)
- `weakness-cram-1.1.3-12-1716372401234`

Why include `ts` in the key? Two reasons:
1. **Append-only by construction.** Two attempts of the same question produce two distinct keys. No risk of accidental overwrite if a write races with itself.
2. **Sync-safe.** The sync engine merges per-key with last-write-wins. With `ts` in the key, two devices generating independent records for the same question can never conflict at the key level — each device's records merge as new keys, not as competing values.

Trade-off: the localStorage namespace grows linearly with total attempts. Estimated: 200 attempts/week × 52 weeks = ~10k records/year. JSON-encoded record at ~150 bytes each = ~1.5MB/year. localStorage cap is typically 5–10MB per origin. Discussion in Q-E (storage cap policy).

### 3.2 Value shape

Single JSON record per key:

```jsonc
{
  "questionId": "mc-2.4.1-7",
  "ts": 1716372345678,
  "answerChosen": 2,
  "correct": false,
  "timeToAnswerMs": 18432,
  "objectiveCode": "2.4.6",
  "mode": "quiz",
  "confidence": 2
}
```

Fields are flat — no nested structures except `answerChosen` for matching questions (§2.3).

### 3.3 Write semantics

Append-only. Each `recordRating` / `recordResult` call site grows by one weakness write. No mutation of existing records. No bulk read at write time (so write performance is independent of record count).

---

## 4. Sync engine integration

### 4.1 Required change

`src/sync/sync-engine.js:13`:

```diff
- export const TRACKED_PREFIXES = ["mc-", "scen-", "match-", "cram-", "secplus-"];
+ export const TRACKED_PREFIXES = ["mc-", "scen-", "match-", "cram-", "weakness-", "secplus-"];
```

One-line registration. No other engine changes needed because:

- Records are append-only (no mutation → no merge conflict on the value)
- Keys are unique per-attempt (no two devices ever write the same key with different values)
- The engine's `mergeEntries` value-agnostic last-write-wins handles this correctly

### 4.2 24-h hygiene gate question (Q-D)

`cram-` was added with a 24-hour sync-hygiene gate (Task 2 Sub-batch 0, commit `9e94fb9`, 2026-05-01) before the cram writer shipped, per the memory entry [[feedback_sync_engine_hygiene_first]]. The reason: writing on V_new before V_old had been retired from all devices would cause V_old to wipe the new records on its next sync pass.

**The weakness- case is structurally different.** Records are append-only with timestamped keys; V_old reading a store with `weakness-{...}-{ts}` keys passes them through `migrateStore`'s "preserve unknown fields" invariant (`src/secplus-quiz.jsx:82-87`). V_old never writes a competing key (no UI surface for weakness records yet, and `recordRating` doesn't reference the weakness layer). So V_old → V_new transition is **safe by construction** — V_old preserves the records it doesn't understand and syncs them through.

CC's recommendation: register the prefix at the same time as the writer ships. No 24-h gate needed. Q-D below asks for supervisor's read on this.

### 4.3 LOCAL_ONLY exclusion

Not needed. Weakness records ARE the diagnostic data we want cross-device. The whole point of writing them is to have them available wherever Aiden studies.

### 4.4 Cross-device expected behaviour

- Device A writes `weakness-mc-2.4.1-7-1716372345678` on submit
- Engine syncs to Gist on next push cycle (debounced 5s)
- Device B pulls on next scan cycle (2s interval), sees new key, writes to local storage
- Device B's reads (dashboard, when built) see device A's records merged with its own

No conflict possible because two devices never write the SAME `weakness-X-{ts}` key — the `ts` differs even if the questionId matches. Identical-ts collisions (same millisecond on two devices) are vanishingly rare and would result in last-write-wins on identical content, which is a no-op.

---

## 5. Dashboard view — deferred

Per Aiden's scoping instruction: separate follow-up work, not in this doc.

What the dashboard would need (sketch only, for the reader's mental model — DO NOT design here):

- Per-objective accuracy ribbon (e.g. "§2.4 — 67% over last 30 attempts")
- Recency-weighted weakness ranking (recent wrongs weighted higher than old ones)
- Distractor-pattern view (which wrong answer is Aiden picking on §X.Y questions when wrong)
- Time-to-answer trends (is Aiden getting faster on a domain or stalling)
- Confidence calibration (when Aiden self-rates "confident" how often is he correct)

Each of these is a read-only aggregation over the weakness- records — none affects the write path.

---

## 6. Migration

### 6.1 Schema migration impact

**None.** The change is purely additive — a new localStorage prefix that didn't exist before. Existing key shapes (`mc-` / `scen-` / `match-` / `cram-` / `secplus-`) are untouched.

`migrateStore` (`src/secplus-quiz.jsx:79-98`) is concerned with the SM-2 store object (`{ version, watched, sm2, history, streak, lastStudy }`), not with auxiliary localStorage prefixes. Weakness records live outside the store object — they are direct localStorage entries under their own prefix, not nested inside `store.sm2`.

### 6.2 No retroactive backfill

We do not synthesise weakness records from existing SM-2 state. SM-2 records contain only `{ correct, total, nextDue }` — no per-attempt timestamps, no answers chosen, no time-to-answer. Reconstructing per-attempt records from aggregates is impossible. Weakness tracking begins from the moment the writer ships forward.

The historical gap is documented and accepted: weakness data is **prospective only.**

### 6.3 Per-item objectiveCode override path

SB-fix-1b-prep schema (commits `12deabc` → `ae5495f`, 2026-05-21) added per-item `subObjective` override on MatchItem + CramTerm. The weakness writer must check `item.subObjective` first and only fall back to the parent section's `objective` if absent. Match/cram items that have not yet been re-cited will use the parent fallback. (Compatible with SB-fix-1b's gradual roll-out.)

---

## 7. Test coverage plan

Per memory entry [[feedback_resume_first_design]] / equivalent: write/read/show paths each get explicit coverage. WRITE and READ within scope of this scoping doc; SHOW deferred with the dashboard.

### 7.1 WRITE path

- **Unit test** (per-call-site): when `recordRating(key, rating)` runs, a `weakness-…` localStorage entry appears with the expected shape.
- **Integration test** (single-device): drive a 5-question quiz via the test harness, assert 5 weakness records written, each keyed correctly, each with `correct` matching the answer, each with `ts` advancing monotonically.
- **Robustness:** if `localStorage.setItem` throws (quota exceeded), the SM-2 write must still succeed. Weakness writes are best-effort and never block scoring.

### 7.2 READ path

- **Unit test:** given a fixture set of 20 weakness records spanning two videos and three objectives, the read-helper produces correct per-objective accuracy aggregates.
- **Unit test:** recency-weighted aggregate (e.g. exponential decay) over a fixture of records spanning 60 days returns the expected weighted score.
- **Unit test:** distractor-pattern aggregate over a fixture set returns the expected per-(question, chosen-option) frequencies.

### 7.3 SHOW path (deferred)

When the dashboard ships, add JSX-level tests that render the dashboard against a fixture set of records and assert key UI elements (objective ribbon, recency ranking, etc.) display correctly. Out of scope for this scoping round.

### 7.4 Sync test additions

- **`sync-engine.test.js`:** add `isTracked("weakness-foo") === true` and `isLocalOnly("weakness-foo") === false`. Add a `mergeEntries` case with a `weakness-` record on each side, identical key (constructed timestamp collision), confirming engine's tie-breaker rule applies.
- **`sync-engine.integration.test.js`:** drive a `weakness-` write on device A's fake storage, run the two-device sync, assert device B's fake storage has the record after merge.

---

## 8. Open questions for supervisor (Q-letters)

### Q-A — Confidence rating UI capture point

When is the confidence rating captured relative to the answer submit?

- **Q-A-1:** BEFORE submit. A confidence slider/buttons appears above the submit button. Aiden picks confidence, then submits, then sees correctness. Cleanest from a calibration-research POV (the metacognitive read isn't contaminated by knowing the correct answer).
- **Q-A-2:** IMMEDIATELY AFTER seeing correctness. Inline "how confident were you?" modal/buttons appear once `showExp` is true. Easier UX (one click vs two). Risk: confidence is reconstructed retrospectively and may reflect "I knew it" bias.
- **Q-A-3:** OPTIONAL, skippable. Confidence becomes a tag, not a gate. Lower friction; lower data quality; useful if Aiden finds 1-2 to be friction in practice.

CC's lean: Q-A-1 for the calibration value, but Q-A-3 as a safety valve (skippable degrades to null, dashboards handle missing confidence cleanly).

### Q-B — Confidence rating scale

What does the confidence rating look like?

- **Q-B-1:** 1–5 integer. Familiar Likert-style. Five buckets give finer-grained calibration data but require more deliberation per click.
- **Q-B-2:** 3 buttons — "guessing / unsure / confident." Coarser, faster. Maps cleanly to "exam-day decision class."
- **Q-B-3:** 4 buttons — "no idea / guessed / fairly sure / certain." Matches metacognitive monitoring literature (Schraw + Dennison; Koriat). Four buckets is the standard in retrospective confidence calibration studies.

CC's lean: Q-B-3 for the literature alignment. Aiden gets meaningful calibration data (over-confident on which objectives? under-confident on which?) without the cognitive load of a 5-point scale during a 25-minute quiz session.

### Q-C — Time-to-answer measurement

How does `timeToAnswerMs` handle interruptions?

- **Q-C-1:** Wall-clock. `Date.now() - questionDisplayedAt`. Includes phone-vibrating breaks, tab-switching, mobile background time. Honest measurement of "how long it took in real time"; less reliable as a "cognitive processing time" signal.
- **Q-C-2:** Pause on tab-blur (`document.hidden` event). Resume on tab-focus. Closer to "active engagement time"; reflects what we actually care about diagnostically.
- **Q-C-3:** Pause on tab-blur AND on the `showExp = true` transition (i.e. once explanation reveals, the timer stops even if Aiden lingers). Captures "decision time" specifically.

CC's lean: Q-C-3. The decision is what we want to time; the explanation reveal is a clean natural endpoint. Implementing pause-on-hidden adds an effect hook but is straightforward.

### Q-D — Sync hygiene gate

Does `weakness-` need the 24-hour sync-hygiene gate that `cram-` got (Task 2 Sub-batch 0)?

- **Q-D-1:** No gate. Ship prefix registration and writer in the same change. (CC's read: safe by construction per §4.2 — V_old preserves unknown-prefix keys through `migrateStore`'s spread invariant, and V_old never writes a competing key.)
- **Q-D-2:** 24-h gate. Ship prefix registration in commit N; ship writer in commit N+1 24+ hours later. Confirms all devices have V_new before the writer's records start flowing. More conservative; aligns with the `cram-` precedent.
- **Q-D-3:** Shorter gate (e.g. 2h or "after Aiden runs sync on each device manually"). Compromise.

CC's lean: Q-D-1. The cram precedent established the pattern because cram records replace the parent-video matching record (V_old's write competes with V_new's). Weakness records have no V_old write equivalent — V_old simply doesn't know the prefix exists.

### Q-E — Storage cap policy

What's the retention policy on weakness records?

- **Q-E-1:** Keep forever. Estimated ~1.5MB/year on localStorage's 5–10MB cap — Aiden hits the cap in 3–6 years, which is post-exam.
- **Q-E-2:** Cap to last N records (e.g. N=10000 or N="last 6 months"). Older records compressed into aggregate form before deletion. Preserves dashboard fidelity for recent history while bounding storage.
- **Q-E-3:** Hard cap with no compression — drop oldest record when localStorage usage exceeds threshold. Simpler; loses long-tail diagnostic value.

CC's lean: Q-E-1 until exam — the cap is far enough out that the engineering work of compression isn't justified. Revisit post-exam if the data is preserved as a study artefact.

### Q-F — Data export

Should Aiden have a way to export weakness data for offline analysis or migration?

- **Q-F-1:** Yes, JSON. Extend the existing import/export feature (which already covers SM-2 + watched + history) to include weakness records. Same UI, broader payload.
- **Q-F-2:** Yes, CSV. Separate export path optimised for spreadsheet analysis (one row per attempt, columns for each field). Useful if Aiden wants to run pivot tables / charts in Excel.
- **Q-F-3:** No. Sync engine + dashboard cover the analytics surface. Export is over-engineering for a single-user app.

CC's lean: Q-F-1 — folds into existing import/export with minimal UI cost. Q-F-2 is nice-to-have but deferred unless Aiden has a specific analysis workflow in mind.

---

## 9. DO NOT implement — boundaries

This scoping document is read-only. No code changes follow from CC writing it. Implementation gates:

1. Supervisor adjudicates Q-A through Q-F (Q-letter responses).
2. CC produces a follow-up "implementation plan" doc that translates Q-letter outcomes into per-call-site diffs, sync-engine diff, test plan.
3. Aiden sign-off on the implementation plan before any code edits begin.
4. Implementation lands as a series of small commits with the cadence rules' Rule 3 (supervisor gates item decisions + dry-run only) applied — i.e. the implementation is mechanical once Q-letters are resolved.

The architectural-vs-mechanical split (Rule 4) puts this design at the architectural end; the resulting implementation will be mechanical.

---

## Boundary on this round

- ✅ Read current code surface (sync engine, SM-2 store, recordRating call sites)
- ✅ Identify the additive prefix design (`weakness-` registration + per-attempt records)
- ✅ Identify the dashboard-deferred boundary
- ✅ List Q-letters with CC leans
- ❌ Do NOT edit SCHEMA.md
- ❌ Do NOT edit sync-engine.js
- ❌ Do NOT add a `recordWeakness` function
- ❌ Do NOT add UI for confidence rating
- ❌ Do NOT design the dashboard view

Next gate: Aiden + supervisor adjudication of Q-A through Q-F. Response routes through the relay v2 protocol per `docs/cadence-rules.md` Communication-patterns section.

═══════════════════════════════════════════════════════════════
END scoping doc verbatim
═══════════════════════════════════════════════════════════════

## Open Q-letters from C (summary for routing)

Six Q-letters; CC leans noted but supervisor decides.

| Q | Topic | CC's lean |
|---|-------|-----------|
| A | Confidence rating UI capture point (before/after/optional) | A-1 with A-3 as safety valve |
| B | Confidence rating scale (5-point / 3-button / 4-button literature) | B-3 (4-button) |
| C | Time-to-answer interruption handling (wall-clock / pause-on-blur / pause-on-blur-and-reveal) | C-3 (pause on blur + reveal) |
| D | Sync hygiene gate (none / 24h / shorter) | D-1 (no gate; safe by construction) |
| E | Storage cap policy (keep-forever / windowed / hard-cap) | E-1 (keep forever until exam) |
| F | Data export (JSON / CSV / no export) | F-1 (extend existing import/export to JSON) |

## What's next

- Supervisor adjudicates Q-A through Q-F. Response routes via
  the relay v2 protocol (supervisor writes response file →
  `present_files` → Aiden downloads + paths it to CC → CC
  copies to from-supervisor/, commits, pushes).
- CC then produces an implementation plan (per §9 of the
  scoping doc — translates Q-letter outcomes into per-call-site
  diffs + sync-engine diff + test plan). Aiden sign-off before
  any code edits.
- In parallel: SB-fix-1b packet 3 (50 items, mechanical per
  Rule 4) can resume any time. The new infrastructure (relay v2
  + cadence rules) is the medium it ships through.

## Report

Report-#0009.md to follow this commit, covering the session
per Workflow Rule #7. (Will be drafted after this relay file
lands.)

---ready-for-supervisor---
