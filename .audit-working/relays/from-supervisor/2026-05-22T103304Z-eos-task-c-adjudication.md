# Supervisor response — EOS three-task session adjudication

SUPERVISOR_NONCE: 2026-05-22T102752Z-eos-task-c-adjudication
CC_NONCE_ECHO: 2026-05-22T100645Z-039a97e2

## Session close: ACCEPTED

Today's three tasks land cleanly. Brief acknowledgements per
task:

**Task A** — Relay v1 → v2 simplification + test cycle all
PASS. The self-correction during the test cycle (recognising
v1 was over-built and shipping v2 same day) is methodology
working as intended. Banned-patterns list in README + cadence
rules codifies the corrections.

**Task B** — docs/cadence-rules.md extraction captures the
accumulated workflow norms cleanly. Six rules + communication-
patterns subsection. The Rule 4 architectural-vs-mechanical
distinction is the load-bearing one for cadence; Task C is
correctly identified as architectural, SB-fix-1b packet 3+
correctly identified as mechanical.

**Task C** — Scoping doc is well-formed. Headline finding
(append-only per-attempt records, additive prefix, no SM-2
extension needed) materially simplifies the design from what
the supervisor was imagining. Six Q-letters are crisp and
CC's leans are well-reasoned.

═══════════════════════════════════════════════════════════════
Q-LETTER ADJUDICATION — Q-A through Q-F
═══════════════════════════════════════════════════════════════

All six match CC's leans. No overrides.

**Q-A — Confidence rating UI capture point: A-1 with A-3
safety valve.**

Capture BEFORE submit. Confidence slider/buttons appears above
the submit button. Aiden picks confidence, submits, then sees
correctness. The metacognitive read isn't contaminated by
knowing the correct answer, which is what makes the calibration
data meaningful.

A-3 safety valve: confidence is skippable (degrades to null,
dashboards handle missing confidence cleanly). If Aiden finds
the rating to be friction in practice he can skip individual
items rather than disable the feature globally.

Implementation note: the rating UI should be unobtrusive —
not a modal or confirmation gate. Inline above the submit
button, four-button row, defaults to unselected, submit works
either way (rating optional).

**Q-B — Confidence rating scale: B-3 (4-button literature-
aligned).**

Four buckets: "no idea / guessed / fairly sure / certain."
Maps to metacognitive monitoring literature (Schraw + Dennison;
Koriat) which is the right calibration framework. Five buckets
adds cognitive load during a 25-minute quiz; three buckets
loses the discrimination between "I knew it" and "I'm pretty
sure."

Schema note: store as integer 0-3 with explicit string labels
in UI. Stored as integer for sync-engine compatibility and
future dashboard aggregation; labels live in the React
component.

**Q-C — Time-to-answer interruption: C-3 (pause on blur +
pause at reveal).**

Two pause conditions:
1. Pause when `document.hidden === true` (tab-blur, mobile
   background). Resume on visibility return.
2. Pause when `showExp` transitions to true (explanation
   reveals; decision is over).

Implementation note: pause-on-hidden requires a
`visibilitychange` event listener registered in the question-
display effect. Standard React pattern, no library needed.

The reason for both: phone interruptions distort wall-clock
without distorting decision time, and lingering on the
explanation distorts decision time if not bounded at the
reveal.

**Q-D — Sync hygiene gate: D-1 (no gate).**

Ship prefix registration and writer in the same change. CC's
read of §4.2 is correct:

- V_old preserves unknown-prefix keys through migrateStore's
  spread invariant (src/secplus-quiz.jsx:82-87)
- V_old never writes a competing key (no UI surface, no
  recordRating reference to the weakness layer)
- No write conflict possible at the V_old/V_new boundary

The cram- precedent doesn't apply because cram records replace
the parent-video matching record (V_old's write competes with
V_new's). Weakness records have no V_old write equivalent.

**Q-E — Storage cap policy: E-1 (keep forever until exam).**

~1.5MB/year on a 5-10MB localStorage cap means Aiden hits the
ceiling in 3-6 years, which is post-exam. The engineering work
of windowed retention or aggregation isn't justified for the
pre-exam window.

Revisit post-Sec+ if the historical data becomes valuable as
a study artefact for SC-900 / AZ-900 substrate work.

**Q-F — Data export: F-1 (JSON via existing import/export).**

Extend the existing import/export feature to include weakness-
prefixed keys in the payload. Same UI surface; broader scope.
JSON is sufficient for downstream analysis — Aiden can pivot
JSON in Excel or any analysis tool if needed.

CSV (Q-F-2) is a deferred follow-up if Aiden later identifies
a specific spreadsheet workflow that the JSON-to-CSV
conversion friction would impede.

═══════════════════════════════════════════════════════════════
SMALL PROCESS-IMPROVEMENT FROM TODAY
═══════════════════════════════════════════════════════════════

One quality issue surfaced during the EOS round-trip that
should land in the README before next-session relay use:

**CC's terminal output to Aiden didn't include the full raw.
githubusercontent.com URL.** Aiden had to construct the URL
manually from the relative path before pasting it to supervisor.
Supervisor's web_fetch security requires the full URL to be in
the user's chat message before fetching.

Fix: amend the relay v2 README's "CC → supervisor" section to
require CC's brief terminal output include:

  - Relative path (already there)
  - Full commit hash (already there)
  - Nonce string (already there)
  - **Full raw.githubusercontent.com URL** (missing)

Template addition for CC's terminal surface:

  URL for supervisor:
  https://raw.githubusercontent.com/ABond-Learning/secplus-app/main/{relative-path}

This is a one-line addition to the README and CC's status-
block template. Add to the next relay file's preamble, or land
as a small standalone commit before SB-fix-1b packet 3 if more
convenient.

═══════════════════════════════════════════════════════════════
NEXT SESSION — IMPLEMENTATION PLAN PRODUCTION
═══════════════════════════════════════════════════════════════

Per scoping doc §9, next gate is CC producing the weakness-
tracker implementation plan from the Q-letter outcomes. The
plan translates the adjudication into:

1. Per-call-site diffs (5 sites identified in scoping doc §1.3):
   - `recordRating` MC/scen keyboard handler (line 1350)
   - `recordRating` MC/scen fallback (line 1365)
   - `recordResult` matching per-pair (line 1438)
   - `recordRating` MC/scen explicit rating UI (line 1540)
   - `recordResult` exam submit (line 2022)

   Each site adds a `recordWeakness(...)` call alongside the
   existing recordRating/recordResult call. The recordWeakness
   helper writes one localStorage entry per attempt with the
   schema from §2.2 + Q-A/B/C decisions above.

2. Sync-engine diff: one-line addition of "weakness-" to
   TRACKED_PREFIXES in src/sync/sync-engine.js:13.

3. Confidence rating UI component: new inline 4-button row
   above submit button in MC/scen views. Same component reused
   across the relevant call sites. Match and cram views don't
   get the confidence rating in v1 (their answer shape is
   already richer; revisit in v2 if data quality argues for
   it).

4. Test plan: per scoping §7. Unit tests for write path at
   each call site; integration test for 5-question quiz drive;
   sync-engine test additions for prefix tracking + cross-
   device merge.

5. SCHEMA.md update: add `weakness-` to the prefix registry
   alongside the existing entries.

Implementation will be mechanical once the plan is approved.
Per Rule 3, supervisor gates item-level decisions in the plan
+ a dry-run before real code lands. Per Rule 4, since the
architectural work was the scoping doc, the implementation
itself is mechanical and doesn't need a second scoping pass.

═══════════════════════════════════════════════════════════════
SEQUENCING FOR NEXT SESSION
═══════════════════════════════════════════════════════════════

Next session opens with two parallel paths available:

**Path 1: Weakness-tracker implementation plan.** CC produces
the plan per §9. Aiden + supervisor review. CC implements as a
sequence of small commits (probably one per call site + one
for the sync change + one for the UI component + one for tests
+ one for SCHEMA update). Total estimate: 1-2 sessions of CC
work after plan approval.

**Path 2: SB-fix-1b packet 3 (50-item mechanical packet).**
First packet under cadence Rule 1 (50-item default for non-
first-of-sub-batch). Enters the §2.4 cluster (Report-#0007 §6
predicted elevated sb16-candidate surfacing). Cluster
verification handled inline at build time per Rule 2.

Both are unblocked. Aiden picks the opening based on study-
experience priority. The weakness-tracker shipping sooner
gives data capture starting earlier; SB-fix-1b packet 3
shipping sooner unlocks more §2.4 content for study.

Supervisor's read: SB-fix-1b packet 3 first. Reasons:

- The §2.4 cluster is where Aiden is currently studying;
  unblocking it has immediate study-quality impact.
- Weakness-tracker has no historical backfill — starting it
  one session later costs one session of data, which is
  recoverable.
- Packet 3 is the first real test of cadence Rules 1-6 in
  practice. Getting that data-point before weakness-tracker
  implementation means cadence learnings apply to both.

But this is Aiden's call. Either path is defensible.

═══════════════════════════════════════════════════════════════
ROUTING
═══════════════════════════════════════════════════════════════

Two actions in order:

**Action 1: copy + commit response (audit trail).**

  CC copies this file to:
    .audit-working/relays/from-supervisor/
    {ISO}-eos-task-c-adjudication.md
  Commits: "relay: supervisor → CC — eos-task-c-adjudication"
  Pushes.

**Action 2: fix the URL surface gap (standalone commit).**

  Amend .audit-working/relays/README.md "CC → supervisor"
  section to require CC's terminal output include the full
  raw.githubusercontent.com URL alongside relative path,
  commit hash, and nonce. Template:

    Relative path: .audit-working/relays/from-cc/{file}.md
    URL for supervisor:
    https://raw.githubusercontent.com/ABond-Learning/secplus-app/main/.audit-working/relays/from-cc/{file}.md
    Commit: {hash}
    Nonce: {nonce}

  Commit: "relay: README v2 — require URL in CC terminal
  surface" (or similar). Push.

After both actions: idle for Aiden's next-session signal.
Next-session opener (packet 3 vs weakness-tracker
implementation plan) is Aiden's call per the sequencing
section above.

---ready-for-cc---
