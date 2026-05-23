# Report-#0011 — GitHub Pages deploy failure: 401 Bad credentials root-caused to read-only Workflow permissions

Session date: 2026-05-23
Session type: Infrastructure diagnosis + fix (side-quest while awaiting G-packet adjudication)
Branch: main
Starting commit: `2516639` (sb-fix-2: apply G packet Items 1+2)
Ending commit: this report's commit

---

## 1. What was asked

Two GitHub failure-alert emails arrived earlier in the day. Aiden asked CC
to diagnose and fix "whatever problem might be happening" while the main
adjudication work was paused.

## 2. What was done

Diagnosed the failing **Deploy to GitHub Pages** workflow by elimination,
correcting the initial speculation (which had guessed missing workflow
permissions / missing environment — both wrong).

Findings, in order:

1. **Workflow YAML is correct.** `.github/workflows/deploy.yml` already
   declares `permissions: contents:read / pages:write / id-token:write`,
   the `github-pages` environment on the deploy job, and uses the Actions
   deploy method (`upload-pages-artifact@v3` + `deploy-pages@v4`). Last
   modified `687b4d1` (2026-04-24) — untouched by the autonomous chain.
2. **Build is healthy.** `npm run build` succeeds locally — 681ms, `dist/`
   at ~415 kB gzip, matching the artifact size the failed run reported.
3. **Pages source is correct** — Settings → Pages → Source = "GitHub Actions".
4. **Environment is clean** — github-pages allows `main`, no required
   reviewers, no wait timer, no blocking rule.
5. **Root cause:** Settings → Actions → General → **Workflow permissions
   was set to read-only** ("Read repository contents and packages
   permissions"). This caps `GITHUB_TOKEN` below the workflow's request,
   so the build job (read-only) passes but the first deploy *write* call
   gets rejected as `401 Bad credentials`.

**Fix (Aiden, in browser):** set Workflow permissions to "Read and write
permissions" + Save (sticky setting, won't recur). Then a fresh
`workflow_dispatch` run on `main` — explicitly NOT a re-run of the old
failed runs, since a re-run rebuilds that old commit's snapshot and could
publish stale content over current `main`.

**Verified:** live `index.html` asset hashes (`index-DCoxmxdu.css`,
`index-b06o3inH.js`) match local `dist/` byte-for-byte. Vite content-hashes
filenames, so identical hashes = identical built output. The live site
(https://abond-learning.github.io/secplus-app/) is serving current `main`,
including the autonomous-chain content.

## 3. Files changed

- No repo code/content changed — the fix was entirely a GitHub repo setting.
- Memory updated: `reference_deployment.md` gained a deploy-failure playbook
  (symptom, root cause, fix, diagnosis order) so this is a ~2-minute fix
  next time rather than a guessing game.

## 4. Commits

- This report (`Report-#0011.md`) — the only commit this session.

## 5. Decisions reached

- Re-running old failed runs was rejected in favor of one fresh
  `workflow_dispatch` on `main` HEAD, to avoid publishing a stale snapshot.
- Verification went beyond the green checkmark to an asset-hash diff of live
  vs local, per the established curl-and-verify deployment discipline.

## 6. Boundaries honored

- No `gh` CLI / no token in the WSL environment, so CC could not change repo
  settings or read run logs directly — surfaced the exact browser clicks for
  Aiden rather than bluffing a fix.
- Did not touch the working tree; the three untracked `docs/` files remain
  untracked and unrelated to this fix.
- Kept the side-quest from derailing the paused G-packet adjudication.

## 7. What's next

- Resume G-packet adjudication / CCh when ready (unchanged by this session).
- No follow-up obligation from the deploy fix — the setting is sticky and the
  live site is confirmed current.
