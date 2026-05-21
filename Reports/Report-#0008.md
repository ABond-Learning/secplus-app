# Report-#0008 — SB-fix-1b-prep: per-item citation override on MatchItem + CramTerm

Session date: 2026-05-21
Session type: Schema extension + validator generalisation (single work block, single commit)
Branch: main
Starting commit: `56875cb` (docs: PLAN.md + supervisor-handoff sync with SB-fix-1a SHIPPED + catch-all and partial-depth findings)
Ending commit: `c1464c0` (SCHEMA + validator: per-item citation override on MatchItem + CramTerm) — plus this report's commit and the PLAN/handoff sync commit.

## 1. Session overview

**What was asked:** ship SB-fix-1b-prep — the schema extension + validator generalisation that lets `match` and `cram` items carry per-item `messerVideo` + `subObjective` citations, mirroring mc/scen. The work was authorized as the (A) leg in the (A)→(B) sequential ordering chosen after the SB-fix-2 pool composition surfaced 14 of 31 items as match/cram (45% match/cram fraction → (A) is sequencing prerequisite for that subset).

**Three earlier work blocks fed into this session:**

1. SB-fix-1b-prep scoping proposal (this session, surfaced and signed off with Q-A through Q-E adjudications + two Q-B refinements).
2. Implementation (this session, single commit per Q-E).
3. Report + docs sync (this report + PLAN/handoff sync, two separate commits per the established commit-split convention).

**What shipped:**

```
c1464c0  SCHEMA + validator: per-item citation override on MatchItem + CramTerm (SB-fix-1b-prep)
```

Plus this report's commit and the PLAN/handoff sync commit at session close.

## 2. Headline finding — scope reduction

**There is no per-item citation READ path in the React app today.** Zero references to `q.messerVideo` or `q.subObjective` across `src/secplus-quiz.jsx` (2453 lines), `src/study/*.js[x]`, or `src/sync/*`. The UI exclusively renders the parent `video.title` via `q.videoTitle` (populated by `buildPool` from `v.title`).

This materially reduced the SB-fix-1b-prep scope **from feature-shaped to data-shaped:**

- **Anticipated scope** (per Report-#0006 §TASK 3 scoping framing): SCHEMA.md additions + JSX read-path changes + parent-fallback logic + new UI surface + validator changes + apply-script extension.
- **Actual scope (this session):** SCHEMA.md additions + validator changes only. No JSX work needed.

The "should UI ever read per-item citation?" question was preserved as **Q-D**, adjudicated by the supervisor as **Q-D-1 (NO — keep citation as tooling metadata)** with the principled justification that the `audit_*` convention establishes a "study-relevant schema vs audit-trail schema" boundary, and Q-D-1 keeps citation on the audit-trail side. Q-D-2 (expose per-item citation in UI) remains available as a future opt-in feature with its own preference toggle; this sign-off does not foreclose that.

## 3. SCHEMA.md changes

Six discrete additions in `c1464c0`:

(a) **MatchItem block** — extended with optional citation fields. JSONC example now includes the two optional fields with "only when re-cited" inline comments. Field table: `messerVideo` / `subObjective` rows added with both-or-neither rule cross-reference.

(b) **CramTerm block** — same shape extension as MatchItem.

(c) **New section: "Citation field rules (`messerVideo` + `subObjective`)"** — inserted between the CramTerm block and the old "Future fields" block. Explicitly states the co-required rule and provides a type-level enforcement table:

| Item type | NEW-item requires both? | Legacy info-flag emitted when absent? |
|---|---|---|
| MC | YES | YES (`legacy-no-citation`) |
| Scenario | YES | YES (`legacy-no-citation`) |
| MatchItem | YES (when either present) | NO (citation is structurally optional) |
| CramTerm | YES (when either present) | NO (citation is structurally optional) |

(d) **Old "Future fields (Task 1b)" section retitled** to "Citation enforcement on mc/scen vs match/cram — historical note" with a paragraph explaining the asymmetry origin (Task 1b authored mc/scen with required citations; match/cram are getting optional per-item overrides in SB-fix-1b-prep).

(e) **`audit_d_review` row updated** — now reflects SB-fix-1a SHIPPED 2026-05-20 + SB-fix-1b pending; field shape unified across all four types.

(f) **localStorage compatibility section** — one sentence added: "Per-item `messerVideo` / `subObjective` on match / cram items does NOT affect SM-2 key shape — keys remain `{type}-{videoId}-{qi}` derived from the parent `videoId`."

## 4. Validator changes

Seven discrete changes in `c1464c0`:

(a) **`--selftest` CLI flag** added at top: `const selftest = args.includes("--selftest");` plus `const data = selftest ? null : JSON.parse(...)` so self-test mode skips the questions.json walk.

(b) **`forEachStringField()` comment block** (Q-C):

> Intentionally does NOT walk `messerVideo` or `subObjective` on any item kind: those fields are bounded by the 120-entry known-Messer-title allowlist (the same allowlist used by `scripts/sb-fix-1a-build-packet.mjs` parser v2), so spelling/emoji scans would produce false positives against the canonical title set. Citation correctness is enforced separately by `checkCitation()`. Do not add `messerVideo` here without a corresponding allowlist-aware scan.

This comment exists specifically to prevent a future maintainer from adding the field back thinking it was an oversight.

(c) **NEW function `checkCitation(item, location, {requireCitation})`** — extracted from the old in-line block in `checkChoice()`. Same error codes verbatim: `missing-messer`, `missing-subobj`, `subobj-format`. The `requireCitation` flag controls whether legacy (neither-field-present) state emits `legacy-no-citation` info (mc/scen=YES) or stays silent (match/cram=NO).

(d) **`checkChoice()` reduced** — citation block replaced with single call: `checkCitation(item, location, { requireCitation: true });`. Preserves existing mc/scen behavior exactly.

(e) **match walker** — appended:
```js
// Citation is structurally optional on match items; co-required when either field is present.
checkCitation(m, loc, { requireCitation: false });
```

(f) **cram walker** — same shape:
```js
// Citation is structurally optional on cram items; co-required when either field is present.
checkCitation(c, loc, { requireCitation: false });
```

(g) **NEW `--selftest` block** (~52 lines) — 6 fixtures:

| Fixture | Item | Expected codes |
|---|---|---|
| match[0] | `{prompt, answer, messerVideo, subObjective}` valid | `[]` |
| match[1] | missing `subObjective` | `[missing-subobj]` |
| match[2] | bad `subObjective` format | `[subobj-format]` |
| cram[0]  | `{term, def, messerVideo, subObjective}` valid | `[]` |
| cram[1]  | missing `messerVideo` | `[missing-messer]` |
| cram[2]  | neither field present (optional) | `[]` |

Runs against `checkCitation()` with `requireCitation: false`. Exits 0 on full PASS, 1 on any FAIL.

## 5. Self-test approach + future pattern

The `--selftest` flag establishes a reusable test pattern for validator extensions. Three properties worth carrying forward to future schema work:

1. **Same script, different mode.** The validator file is the single source of truth for both production walking and self-test assertions; no separate test runner, no Vitest dependency for what is fundamentally a CLI script. Trade-off: tests live in the script not in a `__tests__/` directory; acceptable for a personal-study repo with one human maintainer.

2. **Snapshot-and-trim issue accumulator.** Each fixture snapshots `issues.length` before its `checkCitation` call, diffs `issues.slice(before)` to extract just the new codes, then `issues.length = before` to prevent self-test fixtures from polluting downstream output. Pattern can be reused for any other helper extracted from the main walk.

3. **Code-list comparison, not message comparison.** Fixtures assert against sorted code arrays (`[missing-subobj]`), not message strings. Message wording can evolve without breaking tests; rule semantics (which code fires) are what the test guards.

Future schema additions (e.g. a hypothetical `q.confidence` field for the deferred metacognitive feature #1) can extend the FIXTURES array with new lines following the same shape.

## 6. Sign-off math — Q-A through Q-E

Five questions adjudicated by supervisor 2026-05-21 with two refinements on Q-B folded into the implementation:

| Q | Topic | CC rec | Supervisor decision | Refinement |
|---|---|---|---|---|
| Q-A | Field names on match/cram | Same as mc/scen | **Same names** | — |
| Q-B | Validator citation enforcement on match/cram | Yes (Q-B-1 generalise) | **Yes, Q-B-1** | (1) Preserve existing error codes verbatim — no match-/cram-specific code variants. (2) "Either field present → both required" explicit in helper logic AND SCHEMA.md. |
| Q-C | Spell-scan `messerVideo` field | No | **No** | Add comment in `forEachStringField` near the deliberate skip explaining why, so future maintainers don't add it back. |
| Q-D | JSX UI read per-item citation | No (Q-D-1) | **No, Q-D-1** | Principled justification (captured here in §2): keeps citation on audit-trail side of `audit_*` convention boundary. Q-D-2 remains available as future opt-in feature. |
| Q-E | -prep commit shape | Single commit | **Single commit** | — |

All four recommendations adopted with no override. Both Q-B refinements were folded directly:
- Refinement (1) — preserved error codes: the extracted `checkCitation` function uses the same `record("error", "missing-messer", ...)`, `record("error", "missing-subobj", ...)`, `record("error", "subobj-format", ...)` calls as the original in-line block. No new codes introduced.
- Refinement (2) — explicit both-or-neither: stated in the helper docstring ("Both-or-neither: isNew() returned true because at least one field is present; require BOTH and reject partial state") AND in SCHEMA.md's new "Citation field rules" section ("Both fields are co-required when either is present").

## 7. What's unblocked

**(B-mc/scen) SB-fix-2 mc/scen subset (17 items)** — already unblocked since SB-fix-1a; this session does not change its status. CC's preference per Report-#0007 §9 was Option 1 (sequential A→B); this leg waits its turn behind (A).

**(A) SB-fix-1b apply (134 items)** — now unblocked. The 134 D2 partial-adjacent match + cram items deferred from SB-fix-1a per Report-#0006 §TASK 3 can be re-cited via:

- `scripts/sb-fix-1b-build-packet.mjs` (planned) — mirror of `sb-fix-1a-build-packet.mjs`, walks `video.matching` + `video.cram` arrays.
- `scripts/sb-fix-1b-apply-packet.mjs` (planned) — mirror of `sb-fix-1a-apply-packet.mjs`, writes per-pair / per-term `messerVideo` + `subObjective` + `audit_d_review`.

Both scripts will reuse the parser v2 allowlist matcher from `sb-fix-1a-build-packet.mjs`. Expected packet cadence: 134 items / 25 per packet ≈ 6 packets, mirroring SB-fix-1a's review tempo.

**(B-match/cram) SB-fix-2 match/cram subset (14 items)** — now unblocked. The 14 items of the 31-item partial-depth pool that live in `video.matching` / `video.cram` arrays can now carry per-item citation overrides + `audit_d_review` annotations using the same schema as the mc/scen subset.

## 8. What's next

Per the established (A) → (B) ordering signed off 2026-05-21:

1. **SB-fix-1b apply scoping (next session opener).** Build the first packet under cadence Option C — same shape as SB-fix-1a packet-1: build → surface → calibrate review tempo. Decide A vs B for packets 2-6 after the packet-1 cycle.
2. **SB-fix-1b apply packets 1-6** (~6 sessions; Aiden's per-item review tempo on SB-fix-1a was ~3 min/item average; 134 × 3 ≈ 7 hours review across multiple sessions).
3. **SB-fix-2** — partial-depth review against the 31-item candidate-augment pool (both mc/scen and match/cram subsets now unblocked).
4. **Domain 1/3/4/5 partial-adjacent** (227 items) — future sub-batches once D2 pattern is fully validated through SB-fix-2.

**Estimated total wall-clock to Audit D closure:** ~10 sessions (1 SB-fix-1b scoping + 6 SB-fix-1b apply + 2 SB-fix-2 + 1 closure scoping for D1/D3/D4/D5 PA). Budget headroom: $19.08 remaining is sufficient for all of this since none of the remaining work blocks require LLM-as-judge re-runs; transcript-grep + manual review is the dominant cost shape.

## 9. Files changed this session

| File | Status | Description |
|---|---|---|
| `SCHEMA.md` | UPDATED | 6 changes per §3 above — MatchItem + CramTerm citation fields, new Citation field rules section + type-level enforcement table, retitled historical-note section, audit_d_review row unified, localStorage compatibility sentence |
| `scripts/validate-questions.mjs` | UPDATED | 7 changes per §4 above — `--selftest` flag, `forEachStringField` Q-C comment, extracted `checkCitation()` helper, `checkChoice` reduced, match + cram walkers extended, 6-fixture self-test block |
| `Reports/Report-#0008.md` | NEW (this) | SB-fix-1b-prep session report |
| `.audit-working/audit-d-sub-batch-1/sb-fix-1b-prep-scoping-proposal.md` | NEW (gitignored) | Scoping proposal surfaced for Q-A through Q-E sign-off |
| `.audit-working/audit-d-sub-batch-1/sb-fix-2-pool-composition.md` | NEW (gitignored) | Pre-decision type-composition walk that established (A)↔(B) sequencing requirement |
| `PLAN.md` | UPDATED | Task 1f row reflects SB-fix-1b-prep SHIPPED; next-step paragraph reorganised for SB-fix-1b apply + SB-fix-2 |
| `docs/supervisor-handoff.md` | UPDATED | Date bumped to 2026-05-21; audit-arc state updated; SB-fix-1b apply + SB-fix-2 marked unblocked |

## 10. Decisions reached

1. **Same field names on match/cram** (`messerVideo`, `subObjective`) — mirrors mc/scen; lets `isNew()` predicate stay type-agnostic; future scripts can read citations uniformly across all four types.
2. **Validator generalisation via extracted `checkCitation()` helper** — preserves existing error codes; explicit both-or-neither rule in helper + SCHEMA.
3. **No spell-scan on `messerVideo`** — bounded enum from 120-title allowlist; comment block prevents future maintainer regression.
4. **No JSX UI read path** — citation stays on the audit-trail side of the `audit_*` convention boundary; Q-D-2 reserved as future opt-in.
5. **Single commit for SCHEMA + validator + self-test** — tightly coupled; clean bisect target.
6. **6-fixture self-test pattern established** — reusable for future schema-extension work via `--selftest` flag.
7. **(A)→(B) sequential ordering reaffirmed** — next session opens SB-fix-1b apply scoping (cadence Option C for packet-1, then decide).

## 11. Boundaries honored

- **Surface-and-pause cadence at two gates:** scoping proposal surfaced and held for Q-A through Q-E sign-off; pre-commit diff preview surfaced and held for final sign-off before the single commit landed. No proceed-without-sign-off.
- **No JSX changes.** Per Q-D-1, the React app is untouched. `npm run build` produced equivalent functional output (bundle hash differs only due to Vite filename re-minting).
- **No `questions.json` edits.** SB-fix-1b-prep is pure schema + tooling; the apply work block touches data.
- **No destructive operations.** Validator self-test snapshot-and-trims the issue accumulator so fixture runs don't pollute downstream state.
- **No new prefixes registered.** `match-` and `cram-` were already in TRACKED_PREFIXES from Task 2 Sub-batch 0 (`9e94fb9`, 2026-05-01). Zero sync-engine impact.
- **No SCHEMA_VERSION bump.** Per Aiden's design v2 Q-I — additive optional fields don't trigger migration.

## 12. Session economics

- **LLM API spend this session: $0.** Pure design + code + test work.
- **Cumulative Audit D spend unchanged at $34.63.** Credit remaining ~$19.08.
- **Wall-clock:** ~2 hours across three surface-and-hold gates (scoping proposal author + Q-A-E adjudication; implementation + pre-commit preview; final sign-off + commit + report + docs sync).

## 13. Methodology notes

- **Read-only audit before scoping pays off.** Spending ~10 minutes grep-walking `src/` for `q.messerVideo` / `q.subObjective` read sites before authoring the scoping proposal surfaced the no-UI-read-path finding, which collapsed the work scope by roughly half. The lesson generalises: for any "extend the schema" task, audit current read sites before designing the read path.
- **One-shape-per-sub-batch consistency held under (A)→(B) sequential ordering.** SB-fix-1a was mc+scen only; SB-fix-1b-prep is schema-only; SB-fix-1b apply will be match+cram only; SB-fix-2 will unify across all four types. Each sub-batch has a single shape; failure modes per sub-batch are clean.
- **Both-or-neither rule made explicit in two places.** Per Q-B refinement 2, the rule appears in the helper docstring (for future code readers) AND in SCHEMA.md's type-level enforcement table (for future schema readers). Belt-and-braces against drift.
- **Self-test fixtures are guardrails against extension-without-test.** Future schema additions (a `confidence` field, a new citation source, etc.) can extend FIXTURES with new lines; the test runner pattern is in place. The cost of adding the test was ~52 lines; the cost of not having it would be the next schema extension shipping with no validator coverage.
