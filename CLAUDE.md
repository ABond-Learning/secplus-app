# CLAUDE.md — Security+ Study App Project Context

## Purpose

This project is a personal study application for the CompTIA Security+ SY0-701 certification exam. The single goal of this project is to help the owner (Aiden Bond, GitHub handle ABond-Learning) pass the Security+ SY0-701 exam in approximately 8 weeks (target: late June 2026).

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
- Studies 1-2 hours daily, 7-14 hours/week.

## Quality Rules — Non-Negotiable

These rules apply to EVERY new or modified question. A question that fails any of these is not acceptable output.

1. **Cite the Professor Messer video** it aligns with. Example: `{ messerVideo: "2.3 - Common Attack Types" }`. The video title should be exact, not paraphrased. If you cannot cite a specific video, flag this explicitly rather than inventing one.

2. **Cite the SY0-701 sub-objective** (e.g., "2.3.6"). If uncertain, cite the parent objective and flag. Never fabricate an objective number.

3. **Explanations must include reasoning**, not just the answer. A good explanation explains why the correct answer is correct AND why the most plausible wrong answer is wrong. Minimum 40 characters. Aim for 2-3 sentences of actual reasoning.

4. **American English spelling.** CompTIA exams use American English. Words like "authorisation" become "authorization", "colour" becomes "color", etc. Applies to ALL content.

5. **Flag uncertainty rather than bluff.** If you're unsure whether a particular answer is definitively "best" versus just "correct", write the question with a comment flagging the ambiguity for human review. Do NOT guess confidently.

6. **For BEST/MOST-framed questions:** all four options must be plausible or at least defensible, with only one being clearly superior according to CompTIA's perspective. Trivially wrong distractors are not acceptable.

7. **Keep scenarios professionally neutral.** No cultural-context-heavy examples unless CompTIA-specific.

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

- Collapse existing modes into 4: Quiz / Flashcards / Review / Drill Wrong
- Unified Quiz has a "Customise" drawer (domain checkboxes with exam-weighted defaults, format checkboxes, length slider, reveal-options toggle)
- Saved presets for old mode use cases
- Migrate existing SM-2 localStorage keys — must not reset user progress
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
