# Pre-Migration Memory Snapshot — 2026-05-25

This is a verbatim, point-in-time snapshot of supervisor-Claude's `memory_user_edits`
(the 30 entries, in order) captured immediately before the memory architecture
migration carried out on 2026-05-25.

It exists for rollback safety: if the migration to the topic-file architecture needs
to be reverted or audited, this file is the authoritative record of the prior
flat-memory state. The architecture design that supersedes this state is documented
at `docs/memory-architecture.md`.

Entries are reproduced verbatim and numbered 1-30, in their original order.

---

1. User's name is Aiden Bond. GitHub handle ABond-Learning.

2. When working with Claude Code or similar across multiple tasks, Claude must proactively evaluate session continuation vs restart based on working context (process signals like rework-rate spikes, surfaced quality concerns, mode-changes between work types). Not a blanket "restart after every task" rule and not "always continue" — empirical evaluation per inflection point. Bias slightly toward restart when in doubt.

3. For multi-session work in WSL/Claude Code projects: NEVER write artifacts intended to survive sessions to /tmp/. /tmp is volatile across WSL shutdowns (which happen routinely when the laptop shuts down at end of day). Default to a gitignored project-local directory like ~/projects/<project>/.audit-working/ or .working/ for any persistent artifacts. /tmp is acceptable only for within-session scratch that doesn't need to survive.

4. When estimating session length or work load: distinguish wall-clock time from actual cognitive load on Aiden. In the supervisor-CC workflow most session duration is CC tool-use time running in parallel to Aiden's attention, not consuming it. A 90-minute apply-phase session typically consumes 10-15 minutes of Aiden's focused review time. Don't recommend stopping or treat sessions as "long working days" based on wall-clock when Aiden's actual involvement was light review.

5. Audit lessons from Sec+ Audit A (May 2026): (1) Tool-gated execution beats self-reported discipline — Batch 4b 76% rework vs Batch 5 0% after switching to verifier-tool gating. (2) Actual-vs-claimed length distinction — proposals must measure outputs not intentions. (3) Find binding minimum across all options when padding, don't pad one by name. (4) Per-item exp-coverage check before trim-correct. State affirmatively in commits.

6. Sec+ project Audit D scoped 2026-05-13: hybrid keyword pre-screen + LLM-as-judge + Aiden arbitration on 1,251 un-audited matching+cram items. Ordered ahead of Task 2 Sub-batches 3-5 (source quality > UX polish when source quality broken). Plan persisted at docs/audit-d-scoping.md. Next execution: Sub-batch 0 calibration with §2.3.3 mutex/atomic as ground-truth smoke test.

7. Supervisor-CC workflow: CC must surface decision points to supervisor-Claude via Aiden's paste-relay BEFORE proceeding. Produce status block at decision gates, save to .audit-working/, pipe to clipboard via `iconv -f UTF-8 -t UTF-16LE <path> | clip.exe`, pause until sign-off. Applies at: pass/fail gates, mid-sub-batch checkpoints, "surface findings + hold". CC executing straight through has happened and should self-correct.

8. Sec+ supervisor role lives in a Claude.ai Project. Project knowledge intentionally near-empty — strategic docs are fetched from GitHub on orientation, not uploaded. Repo: github.com/ABond-Learning/secplus-app. Orientation manifest in the project's custom instructions: handoff doc (docs/supervisor-handoff.md) → PLAN.md → CLAUDE.md → latest Report-#NNNN.md → Audit D docs if relevant. New supervisor conversations fetch these before asking Aiden to re-explain context.

9. Test coverage on data-driven features needs all three of: write/build paths, read/aggregate paths, and scoring/display paths. The Sec+ matching-bug session 2026-05-18 surfaced three pre-existing bugs from project init because diff-tests covered only buildPool (write), not newToPractice (read/aggregate) or finishQuiz (scoring). When evaluating test coverage, ask: what gets written, what gets read back, what gets shown? All three need coverage independently.

10. Long-running API scripts must support resume-on-restart from disk before first full-corpus use. Sec+ SB1 halted at call #688 / $7.42 sunk on 2026-05-18 because the script wrote verdicts only at end. Pattern: read existing --output on startup, build done-set by content identity (not array index), skip done items, flush periodically (~50 items), smoke-test with fake-complete output → 0 calls. Add BEFORE the first big run, not after a sunk-cost incident.

11. LLM-as-judge audits over hierarchical corpora need sibling-aware human review beyond predicate regexes. Sec+ SB-fix-1a 2026-05-20: SB1.6 prose-marker predicate caught 21 partial-depth candidates; supervisor sibling-aware review surfaced 10 more the regex missed. Shape requiring manual judgement: cited video IS the natural home but specific exam technique isn't in the transcript. No clean automated proxy; build human gate into workflow.

12. LLM-as-judge audits surface authorship-quality patterns in source corpora as byproduct of per-item verdicts. Sec+ SB-fix-1a 2026-05-20: original catalogue's video assignments were loose at both sub-video granularity within sibling clusters AND cross-domain boundaries (§2.2/§2.3/§2.4/§2.5 all acted as catch-alls for adjacent content). Aggregate flow patterns visible only at scale across many items, not per-item verdicts. Surface these as findings in remediation reports.

13. Don't project end-of-day framing onto supervisor sessions without checking actual time. Aiden controls work cadence; supervisor-Claude responds to it. Failure mode 2026-05-21: repeatedly suggested "genuinely done for the day" / "have a good evening" at mid-day. Before suggesting a stop-point or using end-of-day framing, check the time via bash `date`. Don't decide for Aiden when he's done. Wait for his explicit signal.

14. Smoke-tests of data-write features need write-time state alignment, not just record presence/shape. Sec+ weakness-tracker 2026-05-22: 22 records appeared correctly-shaped but all lacked prior_sm2. Cause: useCallback([state]) + useEffect([]) captured empty-state closure at mount; handler stayed bound to stale wrapper. Query-time showed state populated; write-time closure saw empty. Principle: verify what SHOULD be captured vs IS captured. Fix: read durable storage at write time, not React state.

15. Numbered conventions grow at the end; new entries never displace established ones. When adding workflow rules, memory edits, packet IDs, or other numbered conventions, take the next-highest unused number. Never insert in the middle and never renumber existing entries to make room. Renumbering creates stale references in all docs citing old numbers. Sec+ 2026-05-23: CC added new event-log rule as #8, pushing established resume-on-restart from #8 to #9; supervisor caught and swapped back.

16. Supervisor self-evaluates restart suitability at natural pause points (task close, mode change, day boundary, before major work kickoff). Check: (a) conversation duration vs typical, (b) work mode shifting, (c) recent supervisor error/correction signals. Bias toward restart when in doubt — cost is small (re-orient from handoff doc + recent commits + event log), upside is fresh thinking. Surface recommendation honestly when warranted; don't wait to be asked. Sec+ supervisor-CC 2026-05-23.

17. Re-entry after autonomous CC chain: fresh supervisor chat orients via three sources in order — (1) docs/supervisor-handoff.md for project state, (2) the event log .audit-working/runs/{runId}.eventlog.ndjson for chain timeline, (3) git commits since the pre-chain anchor for code state. Report status BEFORE new work: how far through chain, errors, pause_for_input events needing adjudication. Sec+ 2026-05-23 first autonomous chain.

18. Watch for infrastructure-building displacing the primary goal. Periodically check whether continued meta-work serves goal X or has become its own activity. Sec+ 2026-05-23: 2 days of audit acceleration + workflow infrastructure while Aiden hadn't actually studied. App is study-ready NOW for fully-audited domains; other domains usable with caveats. Studying IS the test of audit quality, not a downstream consumer. Fix bugs as they surface from study, not as audit-completion gates.

19. When fresh chat or CC reports state discrepancy contradicting what prior chain claimed shipped, verify directly (git log, cat file) before building remediation. Web fetches via raw.githubusercontent.com can return stale content past typical cache windows. Sec+ 2026-05-23: fresh supervisor reported "recalibration section missing"; supervisor built diagnosis + remediation without verifying; CC confirmed section was at commit 2253c38 since chain close. Stale-cache false alarm.

20. Three-source disagreement protocol — fetch-suspect direction. Mirror of #19's CC-suspect direction. When web_fetch returns repo content contradicting CC/prior supervisor claim about main, treat local repo as ground truth and verify via git log origin/main before routing around. Sec+ 2026-05-23: web_fetch served pre-chain content for handoff doc + PLAN.md + relay packets despite chain shipping 14 commits; supervisor wasted multiple turns asking for pastes instead of diagnosing. git log closed it.

21. Commit-pinned URLs bypass branch-cache. raw.githubusercontent.com caches branch-pinned URLs (/main/path) via Fastly with long TTL; commit-pinned URLs (/{sha}/path) are immutable, fresh. web_fetch only accepts URLs from user message or prior search/fetch — supervisor cannot construct commit-pinned URLs unilaterally, Aiden pastes them. When branch-pinned fetch suspected stale: request commit-pinned URL. Sec+ 2026-05-23, verified on bcfb273 packet fetch.

22. Stop-and-diagnose rule. When a tool fails repeatedly with same shape, stop and diagnose before adding workarounds. Sec+ 2026-05-23: web_fetch returned stale content three times across orientation + relay fetch; supervisor accumulated workarounds (ask for paste, ask CC differently, ask CC again) instead of asking why. 2+ failures of same tool same shape → identify root cause before next attempt.

23. Sec+ Sybex glossary at /mnt/project/Sybex_Glossary.pdf (70 pages, clean text, Oct 2023 = Chapple 9th edition) is greppable Tier 1 source. For any Audit D item, first grep the glossary before book lookups or other tier checks. Hit → likely Tier 1 citation source. Miss → proceed to book lookup or downstream tiers. Cheaper than index+page hunts. Sec+ 2026-05-23, surfaced post Item 1+2 verdict.

24. Audit D source-grounding tiers (Sec+ 2026-05-23). T1: content in CompTIA / Messer / Sybex book or glossary → keep + cite. T2: absent from T1 but practice-test-confirmed → keep + annotated. T3: absent from T1 AND from practice tests, OR no practice-test check done → rewrite-to-messer or flag-for-removal. Supervisor does NOT add charitable 'exam-relevant' interpretations without source backing. Apply forward from G packet; D2 + earlier ship under prior methodology, documented as baseline.

25. Aiden's work laptop Windows username is `abond.SEAFORD`. Relevant for WSL ↔ Windows path conversions: e.g. `/mnt/c/Users/abond.SEAFORD/Downloads/` for Chrome download folder, or general `/mnt/c/Users/abond.SEAFORD/...` paths when moving files between Windows-side and WSL-side workflows.

26. web_fetch on raw.githubusercontent.com for this repo is unreliable across multiple failure modes — stale cache on branch-pinned URLs AND 404s on commit-pinned URLs that curl returns 200 OK fresh from same URL. Cause unclear (Anthropic-side fetcher routing suspected). Commit-pinned URLs (#21) help in some cases but not all. Reliable pattern: when web_fetch fails on this repo, ask Aiden to cat the file in WSL and paste. Local repo is source of truth (#19, #20). Sec+ 2026-05-23 Report-#0011 fetch.

27. Claude in Chrome "Ask before acting" mode approves the full plan upfront then executes without re-pausing. Embedded "wait for confirmation" mid-prompt does NOT create stepwise pauses — CCh executes through them as part of the approved plan. To force real pause-and-confirm: send instructions as separate messages. Msg1 = "do X, stop, don't proceed"; Msg2 (after review) = next phase. Two messages = two plan approvals. Sec+ 2026-05-24.

28. Sec+ repo: default to asking for cat-paste or commit-pinned URL when current doc state matters (CLAUDE.md, PLAN.md, docs/, Reports/). Don't fetch raw.githubusercontent.com/main/ first and treat staleness as exception. Branch cache is unreliable enough on this repo that fetch-then-flag-if-stale wastes turns. Supervisor can't construct commit-pinned URLs unilaterally — Aiden provides. Cat-paste is one step.

29. Don't suggest stopping work or ending sessions. Aiden decides when to stop; supervisor responds to that decision, doesn't propose it. Recommending a fresh chat for context reasons is fine when warranted; recommending "stop for today" or projecting end-of-work-session framing is not. Failure mode 2026-05-24 after explicit prior correction on same axis (memory #11).

30. When CC is paused at a decision gate (surface-and-pause checkpoint, awaiting sign-off, awaiting next ship prompt), every supervisor response leads with a paste-ready CC block: verbatim text Aiden copies to CC with no translation. Analysis for Aiden follows, never precedes. If nothing is needed for CC, say so explicitly ('nothing to send, waiting on X'). Aiden forwards; he doesn't translate. Sec+ 2026-05-24, recurring failure mode across multiple supervisor chats.
