# CLAUDE.md — Security+ Study App Project Context

## Purpose

This project is a personal study application for the CompTIA Security+ SY0-701 certification exam. The single goal of this project is to help the owner (Aiden Bond, GitHub handle ABond-Learning) pass the Security+ SY0-701 exam.

There is no fixed exam date. Aiden is working through the syllabus at his own pace (currently early in the curriculum, through Cryptography). **Quality is the binding constraint, not calendar pressure.** A clean, well-padded, plausibly-distracted catalogue that takes longer to build is better than a rushed one with length-tells and weak distractors that undermine study.

The app exists to support studying. It is NOT a general-purpose Security+ platform for other users. Every decision — content, features, design — should be evaluated against "does this make Aiden more likely to pass?"

## Current State

- Single React component (`src/secplus-quiz.jsx`, ~2346 lines)
- The full question bank lives in an `ALL_SECTIONS` constant on a single ~712,000-character line inside the JSX file. This must be extracted to a proper JSON file early in the project.
- Uses React 19, Vite 8, Tailwind 3, Lucide icons
- Content: 28 sections, 120 videos, 433 MC questions, 277 scenarios, 580 matching pairs, 671 cram terms (approximate — confirm via audit)
- Existing features: MC quizzes, scenario quizzes, matching, cram mode, SM-2 spaced repetition, drill-wrong, weak-video detection, localStorage import/export

## Known Gaps

### Content weighting vs SY0-701 exam targets

- Domain 1 (General Security): 12% target / ~14.8% current (slight over)
- Domain 2 (Threats/Vulnerabilities): 22% target / ~33.7% current (heavy over)
- Domain 3 (Security Architecture): 18% target / ~17.0% current (good)
- Domain 4 (Security Operations): 28% target / ~22.1% current (under by ~6%)
- Domain 5 (Security Program Management): 20% target / ~12.4% current (under by ~8%)

### Other known issues

- No PBQ-style questions (real exam has ~15-20%)
- Domain 1 has zero scenario questions
- British English spelling used throughout (exam uses American)
- Many Domain 2 MCs are recall-style; exam uses "BEST/MOST" framing
- Quiz modes are fragmented — to be consolidated into 4 modes: Quiz / Flashcards / Review / Drill Wrong

## User Profile

- Non-coder. Previously had no dev experience. Just finished setting up WSL + Node + Vite + git + GitHub with step-by-step help.
- Currently scoring just below passing on practice exams. Known material weaknesses but wants balanced coverage per exam weights, not personal weighting.
- Primary video reference: Professor Messer SY0-701 course.
- Studies 1-2 hours daily, 7-14 hours/week. Pace is sustainable, not racing a deadline — quality over speed.

## Quality Rules — Non-Negotiable

These rules apply to EVERY new or modified question. A question that fails any of these is not acceptable output.

1. **Cite the Professor Messer video** it aligns with. Example: `{ messerVideo: "2.3 - Common Attack Types" }`. The video title should be exact, not paraphrased. If you cannot cite a specific video, flag this explicitly rather than inventing one.

2. **Cite the SY0-701 sub-objective** (e.g., "2.3.6"). If uncertain, cite the parent objective and flag. Never fabricate an objective number.

3. **Explanations must include reasoning**, not just the answer. A good explanation explains why the correct answer is correct AND why the most plausible wrong answer is wrong. Minimum 40 characters. Aim for 2-3 sentences of actual reasoning.

4. **American English spelling.** CompTIA exams use American English. Words like "authorisation" become "authorization", "colour" becomes "color", etc. Applies to ALL content.

5. **Flag uncertainty rather than bluff.** If you're unsure whether a particular answer is definitively "best" versus just "correct", write the question with a comment flagging the ambiguity for human review. Do NOT guess confidently.

6. **For BEST/MOST-framed questions:** all four options must be plausible or at least defensible, with only one being clearly superior according to CompTIA's perspective. Trivially wrong distractors are not acceptable.

7. **Keep scenarios professionally neutral.** No cultural-context-heavy examples unless CompTIA-specific.

8. **Assign correct-answer position by hash, not author judgment.** When generating new MC or scenario items in any future `add-domain*.mjs` / `rewrite-domain*.mjs` script, do NOT pick `a` by hand. Author the four options in whatever order is natural while writing, then set the correct-answer position deterministically: `a = sha256(videoId + ":" + kind + ":" + insertionIndex)[0..3] mod 4`, swapping `opts[originalCorrectIdx] ↔ opts[a]`. This avoids re-introducing the position bias Aiden's audit caught on 2026-04-27 (legacy MC: 75% at index 1; legacy scen: 87% at index 1; Task 1b items also drifted toward 0/1 and away from 3). The reusable mechanism lives in `scripts/shuffle-correct-positions.mjs` — generation scripts can either call into it or inline the same hash. Existing scripts are NOT being retroactively edited; this convention applies only to new generation work.

## Workflow Rules

1. **Commit to git after every significant task** with a descriptive message. For large refactors, work on a feature branch. Confirm `git status` is clean before starting major new work.

2. **For refactors, don't delete user progress.** The app uses localStorage with keys prefixed like `mc-`, `scen-`, `match-` to track SM-2 data, watched videos, question history. Any schema change must preserve these keys or migrate cleanly.

3. **Validate your own output.** Before reporting a task complete:
   - Run `npm run build` to check the app compiles
   - If you've added questions, write and run a validator script that checks every new question against the quality rules
   - Fix failures before asking for human review

4. **Do not modify the quiz schema without updating SCHEMA.md first.** The schema is the contract between questions.json and the React app.

5. **Preserve working code.** Make targeted edits rather than full rewrites when editing large files. If you must rewrite, confirm functional equivalence first.

6. **Ask before making destructive changes.** Deleting questions, renaming components, changing public URLs — flag these before doing them.

7. **Write a session report after every completed task.** Save to `Reports/Report-#NNNN.md` (zero-padded 4-digit sequence number; first is `Report-#0001.md`). Number monotonically increasing; never reuse or backdate. The report must cover what was asked, what was done, files changed, commits made, decisions reached, boundaries honored, and what's next. Check the highest existing `Report-#NNNN.md` in `Reports/` and increment from there. The report is part of the work product — commit it alongside the task changes (or in a follow-up commit if the task was already committed). This rule applies to ALL tasks, including documentation-only and scoping-only sessions. (Established 2026-05-13.)

8. **Long-running API scripts must support resume-on-restart from disk before first full-corpus use.** Any script that incurs API spend over more than ~10 minutes of wall-clock — LLM-as-judge audits, batch content evaluation, embeddings generation, anything where a mid-run halt would lose money — must read its existing `--output` file on startup, build a done-set keyed by stable content identity (e.g. `section|video|type|index`, not array index), skip already-processed items in the main loop, and flush output to disk periodically (every ~50 items, not just at end). Match keys must be order-independent so resume works after input reordering. Smoke-test the resume path with a fake "already complete" output file (should produce 0 API calls) before trusting the script with real volume. Add this support BEFORE the first big run, not after a sunk-cost incident — the cost up front (~30 min) is dwarfed by the cost of one mid-run failure (laptop travel, WSL crash, accidental halt). Established 2026-05-18 after SB1 full-corpus halted at call #688 / $7.42 sunk; resume patch retrofitted same day (`a4a30c3`).

9. **Emit NDJSON event-log entries at state transitions for all supervisor-directed CC tasks.** Any task initiated via a supervisor ship prompt — autonomous multi-task chain or single interactive task — must log state transitions to `.audit-working/runs/{runId}.eventlog.ndjson` via `scripts/lib/event-log.mjs` (`logEvent(runId, event, fields)`). Run-ID convention: `YYYY-MM-DD-<short-task-slug>` (e.g. `2026-05-24-item-3-hsts-input`); one run per ship prompt. Conversational back-and-forth (file inspection, status questions, mid-session checks) is not ship-prompt-initiated and doesn't require a run. NDJSON = one JSON object per line. Helper writes `{ts, event, ...fields}` atomically (`appendFileSync`). Eight known event types: `session_start` (chain begins; include run_id + chain_topic), `task_start` (one per task; include `task_id` + optional free-form `task_name` + est_minutes), `task_end` (one per task; include `task_id` + result), `pause_for_input` (chain blocked on external signal; include reason), `resume` (chain continues after pause; include trigger), `commit` (git commit landed; include hash + subject), `error` (recoverable or fatal anomaly; include where + msg), `session_end` (chain closes; include outcome + total_commits). Log STATE TRANSITIONS, not granular actions — pre-flight is one block (not 6 task_starts); a single edit + commit is one `commit` event (not two task_starts). **`task_id` is the join key (short kebab-case identifier like `task-1-0`, `pre-flight`) and MUST match exactly between task_start and task_end** — `task_name` is free-form and need not match. **The helper computes `actual_minutes` from the task_start → task_end timestamp delta and writes it to the task_end entry; callers MUST NOT pass `actual_minutes` themselves** (helper rejects). Example: `logEvent(runId, "task_start", { task_id: "task-1-0", task_name: "selftest infra for cluster-verify", est_minutes: 30 })`. Established 2026-05-23 for the autonomous-chain pattern; actual_minutes auto-computation added same-day after timing-audit one-liner caught fictional manually-passed durations. Cross-process `actual_minutes` capture fixed 2026-05-24 (shipped `058acdb`; spec `docs/event-log-persistent-state-spec.md`): because CC drives the helper as one `node` invocation per `logEvent`, the in-process Map was empty by `task_end` and the field was omitted on multi-process runs; the helper now persists `task_start_ts` to `.audit-working/runs/{runId}.state.json` and `task_end` reads it back (in-process Map fast-path, else disk rescue). Rescoped 2026-05-24 from autonomous-chains-only to all ship-prompt tasks; prior tasks (including today's Sybex Tier 2 corpus commit, docs+Report-#0012, and Item 3 HSTS input pull) ran under the narrower scope as the documented frozen baseline — not retro-logged.

10. **Verbatim-vs-summary on paste-relay file-content requests.** When the supervisor (or Aiden relaying for the supervisor) asks for a file's *contents* — "show me X", "paste the output of X", "give me the contents of X", "cat X" — emit the raw file bytes inside a single fenced code block with NO commentary before or after. Summary + analysis is the right default for direct interaction, but on a paste-relay it actively breaks the workflow: the human copies your prose summary into the supervisor's chat instead of the file, and the supervisor can't act on it (this happened with `packet-G.md` over 3 round-trips on 2026-05-23 before the cause was spotted). Ambiguous file-content requests default to VERBATIM. Save analysis for when it's asked for, or put it clearly *after* the fenced block with a label so it's obviously separable. Established 2026-05-23.

11. **Relay-tree pattern for supervisor-readable working files.** The supervisor reads repo files via `web_fetch` on `raw.githubusercontent.com`, which only works for git-tracked paths. Most working files (review packets, status blocks, diagnostic outputs) live under `.audit-working/`, which is gitignored except `.audit-working/relays/`. For any working file the supervisor needs to read directly, publish a copy under `.audit-working/relays/from-cc/<topic>/` (the tracked relay tree), commit, and push — then hand the supervisor the `raw.githubusercontent.com` URL. The authoritative working file stays where it is; the relay copy is read-only. Marked-up returns still apply against the authoritative copy. First implemented for the SB-fix-2 G + P packets (`bcfb273`, 2026-05-23); generalise to any supervisor-readable working artifact. NOTE: even tracked paths can be flaky on `web_fetch` (see supervisor-handoff "web_fetch reliability"); local `cat`/`git` is the source of truth, the relay tree is the supervisor's convenience path. Established 2026-05-23.

12. **Critical review of supervisor ship prompts.** Before executing any supervisor ship prompt — including obvious continuations, re-emits, re-pipes, and one-liners — review it critically: validate its figures, claims, scope, and any destructive or irreversible steps against live state. **Open every ship-prompt response with a single sentence naming what was checked**, e.g. `Rule #12: cross-checked the 30 blind ids against the S-1 sample, all match; proceeding`. The leading sentence is the auditable signal that the review actually happened; its absence indicates the review was skipped. A sound prompt warrants one sentence and proceed; a flawed prompt warrants substantive pushback via paste-relay before executing, not after. Continuation/re-emit/re-pipe prompts get the same treatment — those are precisely where stale figures, drifted script state, or unchecked claims slip past. Strengthened 2026-05-28 after self-audit caught inconsistent application — explicit review on structural ships, skipped or post-hoc on continuation ships; the prior wording's "silence-and-proceed is the correct response to a sound prompt" gave wiggle room that turned into autopilot.

## Files and Their Roles

- `src/secplus-quiz.jsx` — the React app. Should become ~500 lines (UI only) once question data is extracted.
- `questions.json` — the question bank (to be created in Task 1).
- `src/main.jsx` — Vite bootstrap.
- `src/index.css` — Tailwind entry point.
- `index.html` — HTML shell.
- `vite.config.js` — build config.
- `tailwind.config.js`, `postcss.config.js` — styling config.
- `package.json` — dependencies and npm scripts.
- `PLAN.md` — living task tracker (to be created in Task 1).
- `SCHEMA.md` — question schema documentation (to be created in Task 1).
- `CLAUDE.md` — this file.
- `Reports/` — per-task session reports, named `Report-#NNNN.md`. See Workflow Rule #7.

## The 3-Task Plan

### Task 1 — Foundations + Content Rebalance

- Extract `ALL_SECTIONS` from JSX into `questions.json` (pretty-printed)
- Update JSX to import from JSON
- Write audit script, produce audit report
- Write validator that enforces quality rules
- Generate new content to hit exam weights:
  - ~80 Domain 5 items (50 MC + 30 scenarios)
  - ~65 Domain 4 items (40 MC + 25 scenarios)
  - ~25 Domain 1 scenarios
  - Rewrite ~40 Domain 2 MCs into BEST/MOST framing
- American English spelling pass across all content
- Run validator, fix failures until clean
- Commit to git
- Produce PLAN.md, SCHEMA.md, task summary

### Task 2 — Mode Consolidation + Unified Quiz

- Collapse existing modes into 5: Quiz / Flashcards / Review / Drill Wrong / Matching (Matching kept standalone per design v2 Q-E)
- Customise drawer applies per-mode (mode-specific defaults; domain/format/length/SM-2 filter controls; last-used persistence; preset-saveable). See `docs/task2-design-v2.txt` §3.3 for the authoritative spec.
- Saved presets stored as a single array under `secplus-v4-presets` per Q-C. See `docs/task2-design-v2.txt` §3.4.
- All SM-2 keys preserved (§5.1 of design v2). Cross-device risk is sync-prefix registration; addressed by Sub-batch 0 hygiene-first protocol (already shipped).
- Commit

### Task 3 — PBQ System + Exam Simulation

- Extend schema to support PBQs
- Build drag-match, firewall-rule-ordering, log-analysis, port/protocol-matching PBQ components
- Author ~40 PBQs across formats, distributed by domain weight
- Integrate into unified Quiz with exam-realistic interleaving
- Build 90-question / 90-minute exam simulation mode (3-5 PBQs at start, scored on CompTIA's 100-900 scale)
- Commit

## What NOT To Do

- Do NOT generate questions without validator-passing citations and explanations.
- Do NOT change user progress storage keys without migration.
- Do NOT optimise for looking "done" over being correct.
- Do NOT skip the `npm run build` check after code changes.
- Do NOT use emojis in question content.
- Do NOT invent SY0-701 sub-objectives or Messer video titles.

## Session Start Protocol

When starting a new session:
1. Read CLAUDE.md (this file) and PLAN.md if it exists
2. Run `git status` to confirm clean working tree
3. Run `git log --oneline -5` to see recent history
4. Confirm the task to work on before making changes
