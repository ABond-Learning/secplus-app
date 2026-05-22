# Weakness-tracker implementation plan — surface for review

NONCE: 2026-05-22T140034Z-e34fcdd0

## Q-letter outcomes (with Aiden's glosses)

| Q | Outcome | Aiden's gloss |
|---|---|---|
| A-1 + A-3 | Confidence captured BEFORE submit; optional/skippable | "separate prefix + retroactive backfill on first new event" |
| B-3 | 4-button confidence scale | "no idea / guessed / fairly sure / certain" — int 0-3 + UI labels |
| C-3 | Pause timing on tab blur + reveal answer on resume | "pause SM-2 on blur, reveal answer on resume" — anti-gaming UX layer |
| D-1 | No sync hygiene gate | "no sync gate; localStorage truth" |
| E-1 | Keep records forever | "keep forever; no truncation" |
| F-1 | JSON export via existing import/export | "JSON export only" |

## Plan headline

CC built `.audit-working/weakness-tracker-implementation-plan.md`
(797 lines, 35 KB). Working copy gitignored per precedent; full
content inlined below for review.

The plan translates 6 Q-letter outcomes + Aiden's glosses into:

1. **`recordWeakness()` helper** — new function near existing
   `recordRating`/`recordResult` definitions; writes
   `weakness-{questionId}-{ts}` localStorage entries; embeds
   `prior_sm2` snapshot on first new event per questionId (Q-A
   backfill interpretation).
2. **Per-call-site diffs at all 5 sites** —
   `src/secplus-quiz.jsx` lines 1350, 1365, 1438, 1540, 2022.
   Existing `recordRating`/`recordResult` calls stay; new
   `recordWeakness` call added immediately after with explicit
   field extraction. Matching = per-pair record; exam = single
   per-question record with `timeToAnswerMs: null` (exam timing
   is exam-total only).
3. **Timing-ref machinery** — `questionDisplayedAtRef`,
   `blurredAtRef`, `pausedTimeMsRef`, `wasInterruptedRef` +
   `visibilitychange` listener for Q-C-3. `computeTimeToAnswerMs()`
   excludes accumulated pause durations. Reset on `idx` change.
4. **Sync-engine diff** — `src/sync/sync-engine.js:13`
   one-line addition of `"weakness-"` to `TRACKED_PREFIXES`. Plus
   3 unit tests + 1 integration test.
5. **`ConfidenceRater` UI component** — inline 4-button row above
   submit on MC/scen views when `!showExp` AND answer selected.
   Keyboard shortcuts q/w/e/r → 0/1/2/3 (avoid collision with
   1-4 used for option-select + SM-2 rating). Implicit skip
   (submit without clicking). NOT rendered on matching / cram /
   exam in v1.
6. **Pause-on-blur + reveal-on-resume behavior matrix** —
   state-by-state table covering all blur scenarios. Reveal
   fires only when answer was selected before blur.
7. **First-event backfill mechanism (Q-A)** —
   `hasAnyWeaknessRecordFor(questionId)` scan; first new record
   per question embeds `prior_sm2` snapshot.
8. **JSON export/import extension (Q-F-1)** — scan + serialise
   all `weakness-` localStorage entries into export payload;
   restore on import additively.
9. **SCHEMA.md update** — full record-shape table + sync notes
   + migration notes.
10. **Test plan** — 5 unit tests + 4 sync-engine test cases +
    8-step manual smoke per CLAUDE.md UI-changes rule.
11. **8-commit expected sequence** with per-commit scope
    boundaries.

## Two interpretation calls flagged in §1 + §14

These are CC's reads of Aiden's glosses; supervisor adjudicates
before commit 1 lands.

### Q-A "retroactive backfill on first new event"

**CC's interpretation:** on the FIRST new `weakness-{questionId}-{ts}`
write per questionId, embed pre-existing `store.sm2[questionId]`
aggregate as `prior_sm2: { correct, total, nextDue }`.
Subsequent records per the same questionId don't repeat.

**Alternative:** write a synthetic baseline record per question on
first app load post-ship.

**CC's lean:** embedded `prior_sm2` (selected option). Doesn't
pollute the per-attempt timeline with non-attempt records;
triggers only on real activity; scales naturally; preserves audit
honesty.

### Q-C-3 "reveal answer on resume" semantics

**CC's interpretation:** force `setShowExp(true)` on `visibilitychange`
to visible ONLY IF an answer was selected before the blur
(`answers[idx] !== undefined`). If no answer was selected, no
reveal — user can still answer (mid-question pause is honest
interruption, not gaming).

**Alternative:** reveal regardless of selection state (more
aggressive anti-gaming).

**CC's lean:** only-if-selected (selected option). Handles
phone/notification interruptions before user has chosen
without forcing a "no answer = wrong" commit.

### Q-A-3 skip mechanism

**CC's lean:** implicit (submit without clicking a confidence
button = `confidence: null` in the record). No explicit "skip"
button — keeps UI minimal. `(skip)` hint text in the row visual.

## Per-call-site diff summary

| Site | Line | Existing call | New call (added immediately after) |
|---|---|---|---|
| 1 | 1350 | `recordRating(recordKey, n)` (keyboard post-check) | `recordWeakness({..., mode: ctx.mode \|\| "quiz"})` |
| 2 | 1365 | `recordRating(recordKey, wasCorrect ? 3 : 1)` (n/N/→ fallback) | `recordWeakness({..., correct: wasCorrect})` |
| 3 | 1438 | `recordResult(pairKey, wasCorrect)` (matching per-pair forEach) | `recordWeakness({..., mode: "matching", confidence: null})` per pair |
| 4 | 1540 | `recordRating(key, rating)` (button-click rating UI) | `recordWeakness({...})` |
| 5 | 2022 | `recordResult(keyOf(q), ans[i] === q.a)` (exam submit forEach) | `recordWeakness({..., mode: "exam", timeToAnswerMs: null})` |

All five sites: existing SM-2 write is preserved unchanged; new
weakness write is added immediately after. Robustness guarantee:
`recordWeakness` never throws — quota errors logged, not
propagated. SM-2 state remains source of truth for review
scheduling.

## Commit sequence (8 commits)

1. `sync-engine: add weakness- to TRACKED_PREFIXES + tests`
2. `weakness-tracker: recordWeakness helper + timing refs + 5 call-site writes`
3. `weakness-tracker: ConfidenceRater UI component + plumbing`
4. `weakness-tracker: pause-on-blur + reveal-on-resume (Q-C-3)`
5. `weakness-tracker: extend import/export to include weakness records (Q-F-1)`
6. `docs: SCHEMA.md — weakness records section`
7. `docs: PLAN + supervisor-handoff sync — weakness-tracker SHIPPED`
8. `Report-#0010 — weakness-tracker + accumulated session findings`

Per CLAUDE.md "test UI changes in browser" rule: commits 2 (helper +
sites) and 3 (UI) both warrant a manual smoke test in the dev
server before commit-and-push. Per cadence Rule 3 supervisor
review per-commit via dry-run / surface signals.

## What CC requests from supervisor

**Sign-off on the implementation plan.** Specifically:

- Q-A backfill interpretation (embedded `prior_sm2` vs synthetic-baseline-records)
- Q-C-3 reveal-on-resume semantics (only-if-selected vs always-reveal)
- Q-A-3 skip mechanism (implicit submit vs explicit skip button)
- Commit sequence
- Test plan (especially manual smoke checkpoints)

If yes: respond with brief authorisation. CC lands commit 1
(sync-engine prefix + tests) as the next mechanical step.
If anything needs adjustment: respond with the specific change
and CC revises before commit 1.

═══════════════════════════════════════════════════════════════
Weakness-tracker implementation plan (full content)
═══════════════════════════════════════════════════════════════

# Weakness tracker — implementation plan (post-Q-letter resolution)

Generated: 2026-05-22 (CC implementation-plan session; $0 LLM spend; read-only audit of `src/secplus-quiz.jsx` + `src/sync/sync-engine.js` + per-call-site context).
Cadence: SURFACE-AND-HOLD before any code edits. Aiden sign-off gates implementation.
Successor to: `.audit-working/weakness-tracker-scoping.md` (Q-letter adjudication landed via supervisor relay 2026-05-22; all six confirmed at CC's leans + Aiden's specific glosses).

---

## 1. Q-letter resolutions (recap with Aiden's glosses)

| Q | Outcome | Aiden's gloss |
|---|---|---|
| A-1 + A-3 | Confidence captured BEFORE submit; optional/skippable | "separate prefix + retroactive backfill on first new event" — confirms additive `weakness-` prefix AND adds a backfill mechanism (capture existing SM-2 aggregate in first new attempt's record per question) |
| B-3 | 4-button confidence scale | "no idea / guessed / fairly sure / certain" — stored as integer 0–3 with string labels in UI |
| C-3 | Pause timing on tab blur + reveal answer on resume | "pause SM-2 on blur, reveal answer on resume" — stronger anti-gaming UX than just measurement: blur during mid-question forces `showExp=true` on return so user can't think offscreen and submit |
| D-1 | No sync hygiene gate | "no sync gate; localStorage truth" — `weakness-` prefix registers + writer ships in the same commit; safe by construction (V_old preserves unknown-prefix keys; no V_old write competes) |
| E-1 | Keep records forever | "keep forever; no truncation" — ~1.5 MB/year on 5–10 MB cap = post-exam timeline |
| F-1 | JSON export via existing import/export | "JSON export only" — extend `exportStoreToFile()` to also scan + include `weakness-` localStorage entries; import writes them back |

Two interpretation calls that need supervisor sign-off:

1. **Q-A "retroactive backfill on first new event":** CC interprets as — on the FIRST new `weakness-{questionId}-{ts}` write per `questionId` after the tracker ships, embed the pre-existing `store.sm2[questionId]` aggregate snapshot as `prior_sm2: { correct, total, nextDue }` on that record only. Subsequent records per the same questionId don't repeat this. This bootstraps historical context per-question without requiring a separate backfill pass. Alternative interpretation: write a single synthetic "baseline" record per question independent of new attempts. CC's lean is the embedded `prior_sm2` because it doesn't pollute the per-attempt timeline with synthetic data and triggers only on real activity.

2. **Q-C "reveal answer on resume":** CC interprets as — `visibilitychange` to hidden during a question (i.e., `showExp === false`) sets a `wasInterruptedRef` flag. On `visibilitychange` to visible, if the flag is set AND an answer has been selected (`answers[idx] !== undefined`), force `setShowExp(true)`. The user sees correctness immediately and can rate confidence after but cannot change their selected answer. If no answer was selected before the blur, no reveal — user can still answer (mid-question pause is honest interruption, not a gaming attempt). Alternative: reveal regardless of selection state (forces user to commit to "no answer" if they navigated away). CC's lean: only reveal if answered, to handle phone/notification interruptions before user has even chosen.

---

## 2. Final schema for weakness records

### 2.1 localStorage key shape

```
weakness-{questionId}-{ts}
```

Where:
- `questionId` matches the existing SM-2 key shape: `mc-{videoId}-{qi}`, `scen-{videoId}-{qi}`, `match-{videoId}-{pairIdx}`, `cram-{videoId}-{idx}`.
- `ts` is `Date.now()` at the moment the answer is submitted (not at question display, not at confidence rating).

Example keys:
- `weakness-mc-2.4.1-7-1716372345678`
- `weakness-match-3.2.5-2-1716372389001`

### 2.2 Value shape

Single JSON object per key:

```jsonc
{
  // ─── Always present ───
  "questionId": "mc-2.4.1-7",
  "ts": 1716372345678,            // ms since epoch, UTC implicit
  "correct": false,                // boolean; computed against q.a (mc/scen) / pair equality (match) / user self-rate (cram)
  "answerChosen": 2,               // mc/scen: option index 0..3; match: { [prompt]: answer } map; cram: "knew"|"didnt-know" rating
  "timeToAnswerMs": 18432,         // ms from question display → submit, EXCLUDING any tab-blur pauses
  "objectiveCode": "2.4.6",        // item.subObjective if present, else parent section.id (per SB-fix-1b-prep override path)
  "mode": "quiz",                  // "quiz" | "drill-wrong" | "review" | "flashcards" | "matching" | "exam"

  // ─── Optional (skippable per Q-A-3) ───
  "confidence": 2,                 // integer 0..3 OR null when skipped: 0=no idea, 1=guessed, 2=fairly sure, 3=certain

  // ─── Set when Q-C-3 interruption triggered ───
  "interrupted": true,             // boolean; true when tab-blur occurred during this question (showExp transitioned via Q-C-3 path); absent when false

  // ─── Backfill (only on FIRST new record per questionId) per Q-A "retroactive backfill" ───
  "prior_sm2": {                   // snapshot of store.sm2[questionId] at first new event
    "correct": 3,
    "total": 5,
    "nextDue": "2026-05-25T00:00:00.000Z"
  }
}
```

Per-type variation on `answerChosen`:

- **mc / scen:** integer 0..(opts.length-1). The selected option index.
- **match:** object `{ [prompt: string]: chosenAnswer: string }` — the full `matchAnswers` state at submit. Pair-level granularity preserved.
- **cram:** string — `"knew"` / `"didnt-know"` per the cram self-rate UI (Task 2 Sub-batch 4 ships the cram writer; for now, cram weakness records align with `recordRating(key, 3|1)` semantics with string label).

### 2.3 Records are immutable + append-only

No mutation after write. Two attempts of the same question = two distinct keys (different `ts`). The sync engine merges per-key with last-write-wins; since keys are unique per attempt, no conflict possible at the key level.

---

## 3. `recordWeakness()` helper — spec

A new function added near the existing `recordRating` / `recordResult` definitions (around `src/secplus-quiz.jsx:644`). Signature:

```js
function recordWeakness({
  questionId,         // string — SM-2 key shape
  correct,            // boolean
  answerChosen,       // mixed — see per-type variation
  timeToAnswerMs,     // number — caller computes; recordWeakness writes verbatim
  objectiveCode,      // string — caller resolves item.subObjective || parent section.id
  mode,               // string — "quiz" | "exam" | etc.
  confidence,         // integer 0..3 OR null
  interrupted,        // boolean — caller passes wasInterruptedRef.current
}) {
  const now = Date.now();
  const key = `weakness-${questionId}-${now}`;
  const record = {
    questionId, ts: now, correct, answerChosen,
    timeToAnswerMs, objectiveCode, mode,
  };
  if (confidence != null) record.confidence = confidence;
  if (interrupted) record.interrupted = true;
  // First-new-event backfill (Q-A retroactive)
  const isFirstForQuestion = !hasAnyWeaknessRecordFor(questionId);
  if (isFirstForQuestion) {
    const sm2Prior = store.sm2[questionId];
    if (sm2Prior) record.prior_sm2 = { correct: sm2Prior.correct, total: sm2Prior.total, nextDue: sm2Prior.nextDue };
  }
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch (e) {
    // Best-effort: never block scoring. Quota errors logged, not thrown.
    console.error("[secplus] weakness write failed (likely localStorage quota):", e);
  }
}

function hasAnyWeaknessRecordFor(questionId) {
  // Scan localStorage for any "weakness-{questionId}-..." entry.
  // O(N) where N = total localStorage keys; fine for the per-call cost (single call per submit).
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`weakness-${questionId}-`)) return true;
  }
  return false;
}
```

### Robustness guarantees

- `recordWeakness` never throws. localStorage quota errors are logged but swallowed.
- `recordWeakness` never blocks SM-2 writes. The existing `recordRating` / `recordResult` calls run before the new `recordWeakness` call at every site; SM-2 state remains the source of truth for review scheduling.
- `hasAnyWeaknessRecordFor` is O(N) localStorage scan. Costs are negligible (one call per submit; localStorage size ≪ 10 MB).

---

## 4. Per-call-site diffs (5 sites)

All five sites follow the same pattern: existing `recordRating` / `recordResult` call stays; new `recordWeakness` call added immediately after; question-display timestamp tracked via a `questionDisplayedAtRef` whose value is set when the current question becomes visible (via `useEffect` on `idx` change).

### 4.0 New ref + visibility tracking (added to component scope)

Add near the existing `useState` declarations in `QuizTab` (and `ExamTab` and `MatchingQuestion`'s parent):

```js
const questionDisplayedAtRef = useRef(Date.now());
const blurredAtRef = useRef(null);     // when tab became hidden mid-question
const pausedTimeMsRef = useRef(0);     // accumulated paused ms across blurs
const wasInterruptedRef = useRef(false); // Q-C-3 — true when a blur occurred during this question

// Reset timing refs when question changes
useEffect(() => {
  questionDisplayedAtRef.current = Date.now();
  blurredAtRef.current = null;
  pausedTimeMsRef.current = 0;
  wasInterruptedRef.current = false;
}, [idx]);

// Q-C-3 — pause on blur, reveal answer on resume
useEffect(() => {
  function onVisibilityChange() {
    if (document.hidden) {
      // Tab lost focus mid-question
      if (!showExp) {
        blurredAtRef.current = Date.now();
        wasInterruptedRef.current = true;
      }
    } else {
      // Tab regained focus
      if (blurredAtRef.current != null) {
        pausedTimeMsRef.current += Date.now() - blurredAtRef.current;
        blurredAtRef.current = null;
      }
      // If user had selected an answer before blur, force reveal on resume
      if (wasInterruptedRef.current && !showExp && answers[idx] !== undefined) {
        setShowExp(true);
      }
    }
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, [idx, showExp, answers]);
```

A `computeTimeToAnswerMs()` helper:

```js
function computeTimeToAnswerMs() {
  let elapsed = Date.now() - questionDisplayedAtRef.current - pausedTimeMsRef.current;
  // If tab is still hidden at submit (theoretical edge — submit while hidden via keyboard),
  // subtract the current open-blur interval too.
  if (blurredAtRef.current != null) {
    elapsed -= Date.now() - blurredAtRef.current;
  }
  return Math.max(0, elapsed);
}
```

### 4.1 Site at line 1350 — MC/scen keyboard handler (post-check rating)

**Existing code (lines 1346–1354):**
```js
} else {
  // Post-check: rate the card (1=Again, 2=Hard, 3=Good, 4=Easy)
  e.preventDefault();
  const recordKey = keyOf(q);
  recordRating(recordKey, n);
  setShowExp(false);
  if (ctx.idx + 1 >= ctx.quizQ.length) finishQuiz();
  else setIdx(ctx.idx + 1);
}
```

**Diff:**
```js
} else {
  // Post-check: rate the card (1=Again, 2=Hard, 3=Good, 4=Easy)
  e.preventDefault();
  const recordKey = keyOf(q);
  recordRating(recordKey, n);
+ recordWeakness({
+   questionId: recordKey,
+   correct: ctx.answers[ctx.idx] === q.a,
+   answerChosen: ctx.answers[ctx.idx],
+   timeToAnswerMs: computeTimeToAnswerMs(),
+   objectiveCode: q.subObjective || (q.videoId ? q.videoId.split(".").slice(0, 2).join(".") : null),
+   mode: ctx.mode || "quiz",
+   confidence: ctx.confidenceForCurrent,  // see §6 UI spec
+   interrupted: wasInterruptedRef.current,
+ });
  setShowExp(false);
  if (ctx.idx + 1 >= ctx.quizQ.length) finishQuiz();
  else setIdx(ctx.idx + 1);
}
```

Note: `n` is the SM-2 confidence rating (1–4) which is RELATED but DISTINCT from the weakness `confidence` field (0–3 metacognitive rating). SM-2 rating measures *answer quality / recall ease*; weakness `confidence` measures *pre-submit self-assessment*. Captured separately.

### 4.2 Site at line 1365 — MC/scen fallback "advance with Good"

**Existing code:**
```js
} else if ((key === "n" || key === "N" || key === "ArrowRight") && ctx.showExp) {
  // Fallback: advance without rating (records Good by default)
  e.preventDefault();
  const recordKey = keyOf(q);
  const wasCorrect = ctx.answers[ctx.idx] === q.a;
  recordRating(recordKey, wasCorrect ? 3 : 1);
  setShowExp(false);
  if (ctx.idx + 1 >= ctx.quizQ.length) finishQuiz();
  else setIdx(ctx.idx + 1);
}
```

**Diff:** identical `recordWeakness` call added after the `recordRating` line, with `correct: wasCorrect` (already computed).

### 4.3 Site at line 1438 — Matching per-pair on Next

**Existing code:**
```js
onNext={() => {
  let correct = 0;
  q.pairs.forEach((p, pairIdx) => {
    const pairKey = matchKey(q.videoId, pairIdx);
    const chosen = matchAnswers[p.prompt];
    const wasCorrect = chosen === p.answer;
    if (wasCorrect) correct++;
    recordResult(pairKey, wasCorrect);
  });
  // ...
}}
```

**Diff:** ONE `recordWeakness` per pair, called inside the forEach loop alongside `recordResult`. The `answerChosen` is the per-pair chosen string (not the full match map — pair granularity matches the pair-level SM-2 keying).

```js
onNext={() => {
  const submittedAt = Date.now();
  const ttAns = computeTimeToAnswerMs();
  let correct = 0;
  q.pairs.forEach((p, pairIdx) => {
    const pairKey = matchKey(q.videoId, pairIdx);
    const chosen = matchAnswers[p.prompt];
    const wasCorrect = chosen === p.answer;
    if (wasCorrect) correct++;
    recordResult(pairKey, wasCorrect);
+   recordWeakness({
+     questionId: pairKey,
+     correct: wasCorrect,
+     answerChosen: chosen,
+     timeToAnswerMs: ttAns,  // same for all pairs in this matching question — they were answered together
+     objectiveCode: q.subObjective || (q.videoId ? q.videoId.split(".").slice(0, 2).join(".") : null),
+     mode: "matching",
+     confidence: null,  // matching UI doesn't have confidence rating in v1 (per scoping doc §2.2 out-of-scope)
+     interrupted: wasInterruptedRef.current,
+   });
  });
  // ... rest unchanged
}}
```

Note: matching questions get `confidence: null` in v1 because the matching answer shape is already richer (per-pair correctness) — confidence rating per matching question is deferred unless data quality argues for it later.

### 4.4 Site at line 1540 — MC/scen explicit rating button UI

**Existing code:**
```js
const ratingBtn = (rating, label, color, emphasise) => (
  <button
    key={rating}
    onClick={() => {
      recordRating(key, rating);
      setShowExp(false);
      if (idx + 1 >= quizQ.length) finishQuiz();
      else setIdx(idx + 1);
    }}
    // ...
```

**Diff:** add `recordWeakness` after `recordRating`, mirror the site at line 1350. Same field-extraction pattern.

### 4.5 Site at line 2022 — Exam submit

**Existing code:**
```js
qs.forEach((q, i) => {
  if (ans[i] !== undefined) {
    recordResult(keyOf(q), ans[i] === q.a);
  }
});
```

**Diff:** add `recordWeakness` per answered question. Exam-specific: per-question `timeToAnswerMs` isn't tracked at exam granularity (exam is timed as a whole), so this site writes a synthetic per-question time based on `(examEndTs - examStartTs) / qs.length` OR `null` to indicate exam-mode (no per-question timing).

```js
qs.forEach((q, i) => {
  if (ans[i] !== undefined) {
    recordResult(keyOf(q), ans[i] === q.a);
+   recordWeakness({
+     questionId: keyOf(q),
+     correct: ans[i] === q.a,
+     answerChosen: ans[i],
+     timeToAnswerMs: null,  // exam timing is total-only, not per-question
+     objectiveCode: q.subObjective || (q.videoId ? q.videoId.split(".").slice(0, 2).join(".") : null),
+     mode: "exam",
+     confidence: null,  // exam doesn't surface confidence rating in v1
+     interrupted: false,  // exam tab-blur is governed by the exam-session save (out-of-scope here)
+   });
  }
});
```

Exam interaction: exam already has its own session-save mechanism (see `clearExamSession` / `examSession`). Q-C-3 pause-on-blur doesn't apply during exams (exam is single-page; the entire exam pauses + resumes via session save). Setting `interrupted: false` for exam records.

---

## 5. sync-engine.js diff

**File:** `src/sync/sync-engine.js`
**Line:** 13

```js
- export const TRACKED_PREFIXES = ["mc-", "scen-", "match-", "cram-", "secplus-"];
+ export const TRACKED_PREFIXES = ["mc-", "scen-", "match-", "cram-", "weakness-", "secplus-"];
```

One-line addition. No other engine changes needed because:

- Weakness records are immutable + append-only with timestamped keys (no two devices ever write the same key with different values).
- The engine's per-key last-write-wins merge handles any synthetic collision (same `ts` ms on two devices) by writing identical content.
- V_old devices preserve `weakness-` keys through `migrateStore`'s spread invariant — no data loss when an old device syncs with a new device's records.

### Sync-engine self-test additions

`src/sync/__tests__/sync-engine.test.js`:

```js
test("isTracked: weakness- prefix is tracked", () => {
  assert.equal(isTracked("weakness-mc-2.4.1-7-1716372345678"), true);
});

test("isLocalOnly: weakness- prefix is NOT local-only", () => {
  assert.equal(isLocalOnly("weakness-mc-2.4.1-7-1716372345678"), false);
});

test("mergeEntries: weakness records merge per-key last-write-wins", () => {
  const local  = { "weakness-mc-2.4.1-7-1000": { value: '{"correct":true}', ts: 1000 } };
  const remote = { "weakness-mc-2.4.1-7-1000": { value: '{"correct":false}', ts: 2000 } };
  const merged = mergeEntries(local, remote);
  assert.equal(merged["weakness-mc-2.4.1-7-1000"].value, '{"correct":false}');
});
```

`src/sync/__tests__/sync-engine.integration.test.js`: add a test that writes a `weakness-…` record on device A's fake storage, runs the two-device sync, asserts device B's fake storage has the record after merge.

---

## 6. Confidence rating UI component spec

### 6.1 Component shape

New inline component rendered above the submit button on MC/scen views (lines 1450–1545 in `src/secplus-quiz.jsx`'s `QuizTab` body) when `!showExp` AND `answers[idx] !== undefined` (i.e., user has selected an option but not yet revealed correctness).

```jsx
<ConfidenceRater
  value={ctx.confidenceForCurrent}
  onChange={ctx.setConfidenceForCurrent}
  disabled={showExp}
/>
```

### 6.2 Visual

Four-button row, inline, ~80 chars wide, subtle background (matching the existing rating-button styling at line 1545+ but visually distinct):

```
How confident are you?  [ no idea ] [ guessed ] [ fairly sure ] [ certain ]   (skip)
```

- Default state: no button selected; `confidenceForCurrent` is null. User can submit without rating.
- Clicked: the chosen button highlights; `confidenceForCurrent` set to 0/1/2/3.
- After Enter/submit: rating snapshot captured into `recordWeakness({ confidence: ctx.confidenceForCurrent })`.
- After advancing to next question: `confidenceForCurrent` resets to null (via the same `useEffect([idx])` that resets timing refs).

### 6.3 Keyboard shortcuts

To match the existing numeric keyboard shortcuts (1-4 for answer selection pre-check, 1-4 for SM-2 rating post-check), the confidence rating uses different keys to avoid collision:

- `q` / `w` / `e` / `r` map to confidence 0 / 1 / 2 / 3 (qwer left-to-right on QWERTY keyboards; spatially aligned with the four buttons).
- Optional skip: no key required; submit (Enter) without pressing q/w/e/r leaves confidence null.

### 6.4 State plumbing

`QuizTab` adds:
```js
const [confidenceForCurrent, setConfidenceForCurrent] = useState(null);
```

Reset on idx change via the existing `useEffect([idx])`.

### 6.5 Where it does NOT appear

- **Matching:** confidence rating is per-pair-level rich; whole-question confidence doesn't map cleanly. Deferred.
- **Cram:** existing UI is self-rated; confidence rating would conflict with the self-rate semantics. Deferred.
- **Exam:** under-time-pressure context; confidence rating adds friction. Deferred.

All three deferrals are captured in §2.2 of the scoping doc as out-of-scope for v1.

---

## 7. Pause-on-blur + reveal-on-resume behavior spec (Q-C-3)

Implementation per §4.0 above. Behavioral contract:

| State at blur | Behavior on resume |
|---|---|
| `!showExp` AND `answers[idx] === undefined` (user has not selected) | Resume normally; user continues thinking. `interrupted=true` flag set; `pausedTimeMs` accumulates. |
| `!showExp` AND `answers[idx] !== undefined` (user selected but not revealed) | Force `setShowExp(true)` on resume; correctness shown; user cannot change selection. `interrupted=true` set. |
| `showExp === true` (post-reveal) | No-op; user is already in rating-mode. `interrupted` not changed. |

The pause timing applies in all three cases (so `timeToAnswerMs` always excludes offscreen time).

### Edge cases

- **Blur immediately after answer-select but before reveal**: caught by the second row. Reveal forced; user submits with whatever rating they pick.
- **Blur during reveal (post-showExp)**: not interrupted; user can take time rating without timer penalty (rating happens after `timeToAnswerMs` snapshot anyway).
- **Multiple blurs in one question**: `wasInterruptedRef.current` stays true after first blur; `pausedTimeMs` accumulates across all blurs.
- **`document.hidden` not available** (older browsers): handler simply doesn't fire; behavior degrades to wall-clock timing. Acceptable.

---

## 8. Backfill-on-first-new-event mechanism (Q-A retroactive)

Per CC interpretation: on the FIRST new `weakness-` write per `questionId` after the tracker ships, embed `prior_sm2` from existing `store.sm2[questionId]`.

### Detection logic

`hasAnyWeaknessRecordFor(questionId)` (defined in §3) scans localStorage for any `weakness-{questionId}-…` key. Returns true if found; false if not.

- **First attempt post-ship** for a question: `hasAnyWeaknessRecordFor` returns false. `prior_sm2` written.
- **Subsequent attempts**: `hasAnyWeaknessRecordFor` returns true (the first record exists). `prior_sm2` NOT written.

### What `prior_sm2` looks like

```jsonc
"prior_sm2": {
  "correct": 3,           // store.sm2[questionId].correct at first new event
  "total": 5,             // store.sm2[questionId].total
  "nextDue": "2026-05-25T00:00:00.000Z"  // store.sm2[questionId].nextDue
}
```

If `store.sm2[questionId]` doesn't exist (e.g., user hasn't attempted the question before tracker ships), `prior_sm2` is omitted. The first new record starts cleanly.

### Cost analysis

- `hasAnyWeaknessRecordFor` is O(N) where N = localStorage entries. With ~10k records/year + ~3k SM-2 entries, N ≤ ~13k. Iteration over `localStorage.key(i)` is microsecond-fast. One call per submit. Negligible.

### Alternative not adopted

CC considered a separate backfill pass that, on first app load post-ship, walks all `store.sm2` entries and writes a synthetic baseline `weakness-` record per. **Rejected** because:
1. It pollutes the per-attempt timeline with non-attempt records.
2. It writes ~3k entries on first load (slow + quota risk).
3. It can't distinguish "genuinely studied" from "never seen" — SM-2 records may not exist for all questions but the user has still seen many.

The embedded-in-first-event approach (selected) triggers ONLY on real activity, scales naturally, and keeps the audit trail honest.

---

## 9. JSON export extension (Q-F-1)

### 9.1 Changes to `exportStoreToFile`

Current (line 210):
```js
function exportStoreToFile(store) {
  const payload = JSON.stringify({
    app: "secplus-quiz",
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    store,
  }, null, 2);
  // ...
}
```

Extended:
```js
function exportStoreToFile(store) {
  // Collect weakness records from localStorage
  const weakness = {};
  if (typeof localStorage !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("weakness-")) {
        const v = localStorage.getItem(k);
        if (v != null) weakness[k] = v;
      }
    }
  }
  const payload = JSON.stringify({
    app: "secplus-quiz",
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    store,
    weakness,
  }, null, 2);
  // ... rest unchanged
}
```

### 9.2 Changes to `importStoreFromFile`

Current (line 235): reads `parsed.store` and runs `migrateStore`.

Extended: also reads `parsed.weakness` (object map) and writes each entry into localStorage. Existing keys preserved (import is additive; doesn't wipe existing weakness data).

```js
function importStoreFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const raw = parsed && parsed.store ? parsed.store : parsed;
        // Restore weakness records (additive — existing entries preserved)
        const weakness = parsed && parsed.weakness ? parsed.weakness : {};
        if (typeof localStorage !== "undefined") {
          for (const [k, v] of Object.entries(weakness)) {
            try { localStorage.setItem(k, String(v)); }
            catch (e) { console.error("[secplus] import weakness write failed:", k, e); }
          }
        }
        resolve(migrateStore(raw));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsText(file);
  });
}
```

### 9.3 Backwards compatibility

Older exports without `weakness` field still load cleanly (`parsed.weakness` defaults to empty object). Newer exports loaded by older app versions silently drop the `weakness` field (older versions don't know about the prefix), but the localStorage entries are written verbatim — sync engine + future-version reads pick them up.

---

## 10. SCHEMA.md update

Add a new section after `## localStorage compatibility`:

```markdown
## Weakness records (`weakness-` localStorage prefix)

Added 2026-05-22 by the weakness-tracker sub-batch. Per-attempt
diagnostic records for retrospective analysis of Aiden's
question-answering patterns. Coexists with SM-2 aggregate state
in `store.sm2`; SM-2 remains source of truth for review
scheduling, weakness records are source of truth for diagnostic
queries.

### Key shape

`weakness-{questionId}-{ts}` where:
- `questionId` matches the SM-2 key shape (`mc-{videoId}-{qi}`,
  `scen-{videoId}-{qi}`, `match-{videoId}-{pairIdx}`,
  `cram-{videoId}-{idx}`).
- `ts` is `Date.now()` at answer submit.

### Record shape

Field | Type | Notes
--- | --- | ---
`questionId` | string | Matches SM-2 key shape (redundant with the key but kept for direct serialisation)
`ts` | number | ms since epoch at submit time
`correct` | boolean |
`answerChosen` | mixed | mc/scen: option index 0..n-1; match: `{[prompt]: chosenAnswer}`; cram: `"knew"|"didnt-know"`
`timeToAnswerMs` | number OR null | Excludes tab-blur pauses; null in exam mode (per-question timing unavailable)
`objectiveCode` | string | `item.subObjective` if present else parent `section.id`
`mode` | string | `"quiz" \| "drill-wrong" \| "review" \| "flashcards" \| "matching" \| "exam"`
`confidence` | integer 0..3 OR absent | `0=no idea, 1=guessed, 2=fairly sure, 3=certain`; absent when user skipped the rating; absent in matching/cram/exam modes in v1
`interrupted` | boolean OR absent | `true` when tab-blur occurred during this question; absent when false
`prior_sm2` | object OR absent | Written ONLY on first weakness record per questionId after tracker ship; `{correct, total, nextDue}` snapshot of `store.sm2[questionId]`

### Sync engine

`weakness-` is added to `TRACKED_PREFIXES` in `src/sync/sync-engine.js`. Records sync cross-device per-key last-write-wins. Because keys are unique per-attempt (timestamp), no merge conflict possible.

### Migration / backwards compatibility

- Additive only — no existing prefixes affected.
- V_old devices preserve `weakness-` keys through `migrateStore`'s spread invariant.
- Older exports without `weakness` field load cleanly (default empty object).
- No retroactive backfill pass; `prior_sm2` is embedded in the first new record per question per the Q-A "retroactive backfill on first new event" interpretation.

### React app reads

The React app does NOT read weakness records in v1 — they are tooling-metadata for future dashboard work. See `.audit-working/weakness-tracker-scoping.md` §5 for the deferred dashboard sketch.
```

---

## 11. Test plan

### 11.1 Unit tests (Node `node --test`)

Add a new test file `src/__tests__/recordWeakness.test.js`:

- **`recordWeakness writes correct shape`** — given stub inputs, asserts localStorage entry matches schema.
- **`recordWeakness writes prior_sm2 on first event per questionId`** — first call writes `prior_sm2`; second call for same questionId doesn't.
- **`recordWeakness omits confidence when null`** — skipped-rating path.
- **`recordWeakness omits interrupted when false`** — non-interrupted path.
- **`recordWeakness never throws on localStorage quota`** — mock localStorage that throws; recordWeakness logs but doesn't propagate.

### 11.2 Sync-engine tests

Extend `src/sync/__tests__/sync-engine.test.js` per §5 above (3 new test cases).
Extend `src/sync/__tests__/sync-engine.integration.test.js` with a 2-device weakness-record propagation test.

### 11.3 Manual smoke test (per CLAUDE.md "test UI changes in browser")

After landing the implementation:

1. Open the app, watch a video, attempt a question.
2. Open browser DevTools → Application → Local Storage; verify a `weakness-{key}-{ts}` entry exists with correct shape.
3. Verify the FIRST attempt's record has `prior_sm2` (if SM-2 already had data for the question) and SUBSEQUENT attempts don't.
4. Open a question, switch tabs for ~10 seconds, switch back. Verify:
   - `interrupted: true` appears on the eventual weakness record.
   - `timeToAnswerMs` does NOT include the ~10s tab-blur.
   - If an answer was selected before blur, correctness is auto-revealed on return.
5. Skip the confidence rating; verify the record has no `confidence` field.
6. Click each of the four confidence buttons; verify each records 0/1/2/3 correctly.
7. Export progress; verify the downloaded JSON includes a `weakness` object with the records.
8. Clear localStorage; import the file; verify weakness records restored.

### 11.4 What's deferred (out of v1 scope)

- Dashboard view (per scoping doc §5)
- Confidence rating UI for matching / cram / exam modes
- Storage cap / retention policy beyond "keep forever until exam"
- CSV export (Q-F-2 deferred)

---

## 12. Implementation commit sequence

Anticipated commit chain after Aiden sign-off:

1. **`sync-engine: add weakness- to TRACKED_PREFIXES + tests`**
   — one-line addition + 3 unit tests + 1 integration test.

2. **`weakness-tracker: recordWeakness helper + timing refs + 5 call-site writes`**
   — new helper function, ref machinery, all 5 call sites instrumented.
   No UI changes yet (confidence is always null until UI lands).
   Unit tests pass.

3. **`weakness-tracker: ConfidenceRater UI component + plumbing`**
   — new component, integration into QuizTab, state plumbing, keyboard
   shortcuts.

4. **`weakness-tracker: pause-on-blur + reveal-on-resume (Q-C-3)`**
   — visibilitychange listener, pause/reveal behavior, interrupted flag.

5. **`weakness-tracker: extend import/export to include weakness records (Q-F-1)`**
   — `exportStoreToFile` + `importStoreFromFile` extensions, backwards-compat
   defaults.

6. **`docs: SCHEMA.md — weakness records section`**
   — schema documentation.

7. **`docs: PLAN + supervisor-handoff sync — weakness-tracker SHIPPED`**
   — close-out commit.

8. **`Report-#0010 — weakness-tracker + accumulated session findings`**
   — per Workflow Rule #7.

Estimated session count: 1-2 sessions. Each commit is small (1-3 file changes); supervisor review per cadence Rule 3 happens between code commits via dry-run / surface signals.

**Strong recommendation per `npm run build` rule:** commit 2 (helper + 5 sites) and commit 3 (UI) both warrant a manual smoke test in the browser before commit-and-push. Per CLAUDE.md "Doing tasks" rule: "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete."

---

## 13. DO NOT implement — gating

Per cadence Rule 3 + surface-and-pause discipline:

1. ✅ Q-letters A–F resolved with Aiden's glosses (this session)
2. ⏳ Aiden sign-off on this implementation plan, specifically the two
   interpretation calls in §1 (Q-A backfill mechanism + Q-C-3 reveal-on-resume
   semantics)
3. ⏳ Then commit 1 (sync-engine prefix + tests)
4. ⏳ Subsequent commits per §12

After Aiden sign-off, implementation is mechanical per cadence Rule 4
(established pattern: per-call-site instrumentation + UI component +
schema doc update). Per-commit supervisor review per Rule 3 is the gate
from there.

---

## 14. Open questions for this plan

Two interpretation calls flagged in §1 + the Q-C-3 "reveal regardless of
selection state" alternative. If supervisor or Aiden flags additional
considerations during review, capture here for addition before commit 1:

### Q-A backfill interpretation

CC's lean: embed `prior_sm2` in first new event record per questionId.
Alternative: write synthetic baseline records on first app load post-ship.
Supervisor adjudicates.

### Q-C-3 reveal-on-resume semantics

CC's lean: only force reveal when an answer was selected before the blur.
Alternative: reveal regardless of selection state (more aggressive
anti-gaming). Supervisor adjudicates.

### Q-A skip / Q-A-3 friction

The 4-button confidence rating is skippable per Q-A-3. CC's design renders
the row inline above the submit button; user submits via Enter regardless.
Confirm: is "skip" a button, or implicit (submit without clicking)?
CC's lean: implicit (no skip button — just submit). Adds the `(skip)`
hint text in the row visual per §6.2 but no clickable skip element.

---

## Boundary on this round

- ✅ Translated 6 Q-letter outcomes + Aiden's glosses into implementation spec
- ✅ Spec'd final record schema with all fields + per-type variation
- ✅ Spec'd `recordWeakness` helper + first-event-backfill mechanism
- ✅ Diffed all 5 call sites with exact code patterns
- ✅ Spec'd sync-engine one-line addition + 4 test cases
- ✅ Spec'd confidence rating UI component (visual, keyboard shortcuts, state plumbing)
- ✅ Spec'd pause-on-blur + reveal-on-resume behavior with state matrix + edge cases
- ✅ Spec'd JSON export/import extensions with backwards compatibility
- ✅ Drafted SCHEMA.md section
- ✅ Test plan: unit + sync-engine + manual smoke
- ✅ 8-commit expected sequence
- ❌ Do NOT write any of the code yet
- ❌ Do NOT update SCHEMA.md yet
- ❌ Do NOT touch src/secplus-quiz.jsx or src/sync/sync-engine.js
- ❌ Do NOT mutate localStorage or write weakness records

Next gate: Aiden sign-off on this plan, especially the §14 interpretation
calls. After sign-off, commit 1 (sync-engine prefix + tests) is the first
mechanical step.

---ready-for-supervisor---
