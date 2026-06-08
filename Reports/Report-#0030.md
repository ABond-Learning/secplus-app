# Report-#0030 — Record SSH/push environment in CLAUDE.md (docs-only)

**Date:** 2026-06-08
**Type:** Documentation-only (environment note)

## What was asked

Record, factually and briefly, the git/push environment for this repo in
CLAUDE.md — following resolution (outside the CC session) of the push 403 that
blocked Report-#0029's commit. Verify the state against the live repo first
(don't take the summary as fact). Single-purpose docs commit; Report per Rule #7
in the same commit; remove the now-stale `.audit-working/push-blocked-auth.md`.

## Verification before writing (Rule #12)

Every claim checked against live state; all confirmed:

| Claim | Check | Result |
|---|---|---|
| Remote is SSH to ABond-Learning | `git remote -v` | `git@github.com:ABond-Learning/secplus-app.git` ✓ |
| HEAD 8d38ddb on origin/main, up to date | `git status` / `branch.ab` | `+0 -0`, upstream origin/main ✓ |
| Push actually landed (not stale local ref) | `git ls-remote origin refs/heads/main` | `8d38ddb` on the live remote ✓ (also proves SSH auth works) |
| Author is Aiden Bond / ABond-Learning noreply | `git config user.name`/`user.email` | `Aiden Bond` / `214842127+ABond-Learning@users.noreply.github.com` ✓ |
| Author override is per-repo | `git config --local` vs `--global` | local = ABond-Learning; global = ABond-SeafordITD ✓ |
| SSH key present | `ls ~/.ssh/id_ed25519` | exists (created 2026-06-08 13:50) ✓ |

## What was done

- Added a short factual **"Git / Push Environment"** section to `CLAUDE.md`
  (between "Files and Their Roles" and "The 3-Task Plan"), recording: SSH remote +
  `~/.ssh/id_ed25519` auth (not gh's helper); per-repo author = Aiden Bond /
  ABond-Learning noreply; the two work repos are ABond-SeafordITD over HTTPS,
  left as-is; and the historical 403 cause (gh credential helper served the work
  account globally over HTTPS, overriding the personal token; SSH sidesteps it).
- Deleted the stale `.audit-working/push-blocked-auth.md` (it was gitignored /
  untracked, so this is a disk cleanup, not a tracked change in the commit).

## Files changed

- `CLAUDE.md` — new "Git / Push Environment" section (factual, ~14 lines)
- `Reports/Report-#0030.md` — this report

## Gates

Docs-only; no code touched. `npm run build` / validator / tests not re-run
(nothing in their scope changed). Note: CLAUDE.md and the report are the only
tracked changes.

## Boundaries honored

Factual environment note, not narrative; single-purpose docs commit; verified
against live repo before writing; stale relay file removed.

## What's next

After this commit + push: return to Task 1h commit 5 (the suppression work in
Report-#0029 — `8d38ddb` — is shipped and live on origin/main).
