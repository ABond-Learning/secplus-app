# Task 1h commit 5 (import/export) — scoping findings: does weakness- already sync?

**Rule #12:** I traced the live sync path end-to-end in `src/sync/sync-engine.js`
(TRACKED_PREFIXES → isTracked → scanTrackedKeys → buildPayload → pushGist, and the
pull/parse path), cross-read Q-F + E-1 in the scoping + implementation-plan docs, and
checked PLAN.md's Gist-cap line — they don't fully agree, and the disagreement is the
finding. Read-only; no edits.

---

## 1. Do weakness- records sync live today? — YES, plainly.

`weakness-` is in `TRACKED_PREFIXES` (line 13) and is **not** excluded by `LOCAL_ONLY`
(lines 17–22, which only cover `secplus-sync-`, `secplus-last-backup-at`,
`secplus-backup-banner-snooze-until`, `secplus-v4-exam-session`). So:

- `isTracked("weakness-…")` → true (line 44–48).
- `scanTrackedKeys` collects every `weakness-` key into the local entry set (50–61).
- `buildPayload` → `pushGist` writes them all into the Gist (105–112, 311–325).
- On pull, `mergeEntries` keeps them (per-key max-ts LWW; `isTracked` re-checked at 79).

Each `weakness-{questionId}-{ts}` key is unique per attempt, so there are no per-key
conflicts — but **every attempt becomes its own permanently-synced entry.** Conclusion:
cross-device movement of weakness data is **already automatic via live Gist sync.**
Commit 5's import/export is therefore a **backup / portability / offline-analysis**
feature, **not** the cross-device mechanism.

## 2. What does Q-F say import/export is FOR? — backup/portability, and it's complementary, not the sync path.

Scoping doc Q-F (the question itself): *"Should Aiden have a way to export weakness data
for **offline analysis or migration**?"* — adjudicated **Q-F-1**: *"Yes, JSON. Extend the
existing import/export feature … Same UI, broader payload."* Implementation plan gloss:
*"extend `exportStoreToFile()` to also scan + include `weakness-` localStorage entries;
import writes them back."*

So Q-F/Q-F-1 was always scoped as a portability/backup layer **on top of** live sync, not
as the cross-device transport. The two aren't in conflict by intent. **But the scoping did
not reconcile retention against the live-sync payload** — see finding 3.

Verified against code: `exportStoreToFile` (jsx:214) currently serializes only `store`
(SM-2 / watched / history); weakness records live as standalone localStorage keys and are
**not** in `store`, so they are genuinely absent from today's export. Commit 5 adds the
`weakness-` scan to export + import-writeback. Mechanically small and harmless on its own.

## 3. Volume / payload growth — a real, under-reconciled concern.

**The two repo docs assume different caps, and the lower one predates weakness- being synced:**

- Implementation-plan **E-1**: *"keep forever; no truncation — ~1.5 MB/year on **5–10 MB
  cap** = post-exam timeline."*
- PLAN.md:259: *"Gist file size cap **(1 MB)**: well under for the personal namespace."*
  — this assessment was made about the **bounded** corpus (mc/scen/match/cram/sybex, one
  key per item) and was **not** revisited when `weakness-` (unbounded, one key per attempt)
  joined `TRACKED_PREFIXES` in commit 1. So: yes — the cap assessment and the
  unbounded-growth decision were made in different docs and never reconciled.

**Why it bites — the code has no guard:**
- `pushGist` (324) always stringifies the **entire** payload pretty-printed; there is **no
  cap, no pruning, no retention policy** anywhere in the engine (grep confirms none).
- `fetchGist` (302–308) reads `file.content` inline and `JSON.parse`s it. It does **not**
  check GitHub's `truncated` flag or fall back to `raw_url`. GitHub truncates a gist file's
  inline `content` once it exceeds the API threshold (commonly documented ~1 MB; I'd
  confirm the exact current number before relying on it). When that happens:
  `file.content` is partial → `JSON.parse` throws → the `catch` at 307 **silently returns
  an empty payload** `{ entries: {} }`.
- Net failure mode: past the threshold, **every pull looks empty**, each device keeps only
  its own local data and re-pushes the oversized file. Cross-device sync **silently stops
  reconciling**, with **no error surfaced to the user**. Local data isn't wiped (merge
  favors local when a remote key is absent), but the sync guarantee is quietly lost — and
  this takes out **all** synced data (SM-2 progress included), not just weakness.

**Rough size math (honest range, not false precision):** each weakness entry costs
~300–450 bytes in the pretty-printed Gist file (key + escaped value JSON + ts wrapper +
indentation). Records/day is the swing variable: quiz/scenario = 1 record each, **matching
= 1 record per pair** (a 6-pair item writes 6 records — a real amplifier). At ~350 bytes:

| records/day (~daily study) | ≈ per year |
|---|---|
| ~12 (impl-plan's implicit estimate) | ~1.5 MB |
| ~50 (moderate quizzing) | ~6 MB |
| ~120 (heavy + matching) | ~15 MB |

Against a ~1 MB inline-content threshold, even the optimistic case crosses it in ~8 months;
moderate quizzing crosses in ~2 months. With no fixed exam date and 1–2 hr/day study,
"comfortably post-exam" is **not** a safe assumption.

---

## What this means for commit 5 — three options to decide between

Commit 5 as literally specced (Q-F-1: add `weakness-` to export/import) is small, correct,
and useful **regardless** of what we decide about sync. The real decision the finding
forces is what to do about live-syncing unbounded weakness data:

- **Option A — Ship Q-F-1 as-is; treat sync growth as a separate tracked risk.**
  Import/export becomes a backup layer over live sync; open a follow-up for the
  retention/truncation problem (cap, prune-oldest, or `raw_url` truncation handling).
  Decouples a safe, ready feature from the harder architectural question. *Lowest risk now;
  leaves the latent sync break unaddressed until the follow-up.*

- **Option B — Reconcile: make `weakness-` `LOCAL_ONLY` and let import/export BE the
  deliberate cross-device path for weakness data.** Removes the truncation risk entirely,
  matches Q-F's "separate path" instinct, keeps the synced payload bounded (back to the
  finite corpus). Cost: weakness data no longer crosses devices automatically (manual
  export/import), AND this is a `TRACKED_PREFIXES`/`LOCAL_ONLY` change → triggers the
  **hygiene-first 24h-gate protocol** (sync-prefix changes ship standalone, verified on all
  devices before dependent feature work — memory `feedback_sync_engine_hygiene_first`).
  Note a migration wrinkle: weakness records already pushed to the live Gist would want
  cleaning up, or they linger in the synced payload.

- **Option C — Ship Q-F-1 now AND add a bounded retention/pruning policy to the synced
  weakness data** (e.g. cap synced weakness entries, or handle `truncated`/`raw_url`).
  Keeps auto cross-device sync but makes it safe. Largest scope; also a sync-engine change.

My lean: **A or B over C.** A is the cleanest immediate step (Q-F-1 is genuinely
independent and low-risk); B is the more principled end-state and the better reconciliation
of Q-F's design with the sync engine, but it's a gated sync change so it shouldn't be
bundled into commit 5 casually. C keeps the most behavior but is the heaviest and least
reversible. **Whichever way, Q-F-1 itself can ship — the question is purely what we do
about the live-sync growth, and that should be an explicit decision, not a default.**

---

**Paused for decision.** No edits, no build. Need a call on A / B / C (and, if B/C, the
hygiene-first sequencing) before I scope commit 5's actual contents.
