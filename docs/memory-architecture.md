# Supervisor-Claude Memory Architecture

Design document for the persistent-memory architecture used by supervisor-Claude in this project and intended for reuse across the certification pipeline.

## Why this exists

The Sec+ supervisor-CC pattern accumulated 30 memory_user_edits entries between project start and 2026-05-25. The 30-entry cap is per-project and binding; the next useful lesson would have been dropped. Consolidation treats the symptom, not the cause: memory had become the catch-all for anything that should persist across chats, and the cap was always going to re-bind a few weeks later.

The deeper problem was scope. Future projects (SC-900, AZ-900, AZ-104, ITIL Foundation, ITIL Managing Professional) repeat this same supervisor-CC pattern. Pattern-level wisdom needs a transport mechanism between projects. Memory and the auto-summary block (the userMemories section auto-derived from chat history and re-injected each turn alongside memory_user_edits) are both project-scoped, so neither transfers automatically. Without a cross-project mechanism, every new cert restarts the supervisor's learning curve.

## The architecture

Four storage classes with explicit roles, mirroring the pattern Claude Code uses (CLAUDE.md plus MEMORY.md index plus topic files plus Auto Dream).

### Project custom instructions

Always loaded into the system prompt every turn. Unbounded length. Aiden-editable via Claude.ai UI.

Holds: orientation manifest (which doubles as the bootstrap rule, run first on every chat), must-fire mid-chat behavioural guards, topic-file consultation rule.

This is the equivalent of CLAUDE.md in CC's memory model.

### memory_user_edits (index)

Always loaded. 30-entry cap, 500 chars per entry. Tool-editable.

Holds: short index labels pointing to topic files, plus a small set of frequently-used reference facts (e.g. user environment specifics). Not used for full lesson content.

Post-migration this sits at 8/30 entries with significant headroom. New lessons land as fresh entries until they consolidate into topic files.

This is the equivalent of MEMORY.md in CC's memory model.

### Project knowledge files (topic files)

On-demand search via `project_knowledge_search`. Unbounded. Aiden-uploads via Claude.ai UI as mirror copies of the canonical OneDrive files.

Holds: full lesson content for pattern-level wisdom (supervisor-CC pattern, engineering lessons, audit methodology, tool quirks). Cert-specific lore where applicable.

This is the equivalent of CC's topic files in `~/.claude/projects/...`.

### OneDrive canonical store

Cloud-synced filesystem path: `OneDrive/Claude/`. Persistent across projects, devices, products.

Holds: authoritative copies of pattern-level topic files plus per-cert subfolders. Sec+ project knowledge files are mirrors of these, re-uploaded when canonical files change.

The cross-project transport mechanism. When SC-900 launches, the new project's knowledge starts with these pattern-level files copied in.

## What lives where

| Storage class | Always-loaded? | Capped? | Cross-project? | Content type |
|---|---|---|---|---|
| Project instructions | Yes | No | No (per project) | Must-fire rules, orientation manifest |
| memory_user_edits | Yes | 30 entries | No (per project) | Index labels, small reference facts |
| Project knowledge | On-demand | Unbounded | No (per project) | Mirrors of OneDrive topic files, Sec+-specific lore |
| OneDrive | Filesystem only | Unbounded | Yes | Canonical topic files, per-cert subfolders |
| Repo docs | On-demand | Unbounded | No (per project) | Project state, Reports, methodology docs |

## Topic files

Four pattern-level files live in `OneDrive/Claude/pattern-level/` and mirror to each cert project's knowledge:

- `supervisor-cc-pattern.md`: roles, surface-and-pause discipline, ship-prompt structure with iconv footer, paste-ready CC block discipline, restart self-evaluation, re-entry after autonomous chains, watch for infrastructure-displacing-goal, Reports workflow, numbered conventions grow at the end, wall-clock versus cognitive load, don't suggest stopping, cross-cert application notes
- `engineering-lessons.md`: resume-on-restart, smoke-test write-time alignment, three-path test coverage, tool-gated execution, actual-versus-claimed length, padding finds binding minimum, per-item exp-coverage check, stop-and-diagnose, /tmp volatility
- `audit-methodology.md`: hybrid keyword-plus-LLM-judge-plus-arbiter pattern, calibration sub-batches, sibling-aware review beyond regex predicates, fix_direction over category label, source authority Tier 1/2/3 frame, blind text-vs-text grounding delegation, authorship-quality byproduct patterns, Tier 1 grepping order
- `tool-quirks.md`: web_fetch unreliability on raw.githubusercontent.com, branch-vs-commit-pinned URL mechanics, three-source disagreement protocol, verify state discrepancy directly, cat-paste default for repo docs, Claude in Chrome stepwise pause behaviour, Cowork WSL access patterns, Cowork bash UNC block, request_cowork_directory remount bug, Cowork-side Claude no-access default mode

Per-cert subfolders (`OneDrive/Claude/secplus/`, future `OneDrive/Claude/sc-900/`) hold cert-specific lore that goes beyond what's in the cert's repo.

## Cross-product reach

Pattern-level files are reachable from:

- **Chat-side Claude** (any project): via `project_knowledge_search` against the mirror copies in each project's knowledge, or via Microsoft 365 connector against OneDrive directly
- **Cowork** (when configured): via filesystem when working folder is set to the OneDrive sync path. Cowork can read and propose edits
- **Claude Code** (via filesystem): via `/mnt/c/Users/<user>/<OneDrive-folder>/Claude/...` from WSL, when CC needs to consult or update. The `<OneDrive-folder>` is `OneDrive` for personal accounts and `OneDrive - <Tenant>` for work/school accounts. On Aiden's machine the literal path is `/mnt/c/Users/abond.SEAFORD/OneDrive - Seaford College/Claude/...`
- **Other devices**: via OneDrive sync to any signed-in device

This is the cross-product reliable retrieval Aiden asked for at the start of this design.

## Cross-project transport

When a new certification project launches:

1. Create the new Claude.ai project
2. Upload pattern-level files from `OneDrive/Claude/pattern-level/` to project knowledge
3. Set up the new project's instructions (mostly cloned from Sec+ with cert-specific tuning)
4. Memory entries for the new project: same 8-entry template with cert-specific updates (entry 2 swaps Sec+ Sybex for the new cert's equivalent; entry 8 points to the new cert's repo)
5. Begin work

Pattern-level wisdom from prior certs is immediately available. Cert-specific learning happens in the new cert's subfolder and repo.

## Phase 2: Cowork automation (deferred)

After the architecture above settles for two to three weeks:

- Set up a Cowork project with working folder = `C:\Users\<user>\OneDrive\Claude\`
- Cowork instructions: weekly task. Read latest supervisor-handoff doc plus recent Reports plus any pasted-in chat extracts. Propose updates to topic files as diffs in `proposed-updates/{date}/`
- Aiden reviews proposed updates weekly. Accepts, rejects, or edits
- Accepted updates land in canonical topic files. Aiden re-uploads to project knowledge

This is optional. The base architecture works without it. Cowork accelerates topic-file maintenance once Aiden has confidence the architecture is stable.

## Failure modes and mitigations

| Failure mode | Mitigation |
|---|---|
| Mid-chat behavioural drift | Must-fire rules in project instructions (loaded every turn); topic-file consultation rule routes the supervisor to deeper guidance when needed |
| Awareness-sufficient rules fail to fire when needed | Topic-file consultation rule in instructions reminds supervisor to call `project_knowledge_search` |
| Project knowledge drift from canonical OneDrive | Re-upload routine when canonical files change; Phase 2 automation can manage this |
| Cross-chat coherence loss | OneDrive canonical store outlives any single chat |
| Cap-driven loss of nuance | Promotion rule moves consolidated lessons to topic files, frees memory slots |
| Bootstrap fragility | Project instructions loads turn 1; orientation manifest there is what makes the rest loadable |

## Maintenance cadence

- **Per-task**: Reports/Report-#NNNN.md captures task-specific lessons in the cert repo
- **Per-week (after Phase 2 lands)**: Cowork drafts topic-file updates for review
- **Per-cert-launch**: pattern-level files copied to new project; cert subfolder seeded
- **As-needed**: memory entries added for new lessons; promoted to topic files when consolidated

## History

- 2026-05-24: 30-entry memory cap first bound. Initial consolidation attempt rejected; deeper architecture question raised by Aiden
- 2026-05-25: design produced via dedicated supervisor chat; review pass completed (file-level via Cowork, repo-verification via CC)
- **2026-05-25**: Migration completed. CC batch landed at commit `5091f7c` (architecture doc + pre-migration snapshot + handoff update); Report-#0019 landed at `918b68f`. Supervisor-side memory migration completed same day (30 entries → 8 entries, 22 slots free). Smoke test in a fresh chat passed both probes (resume-on-restart pattern from engineering-lessons.md; Audit D tier frameworks from docs/audit-d-scoping.md).
