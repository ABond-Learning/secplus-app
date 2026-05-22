# CC ↔ Supervisor Relay (v2 — simplified)

Git-mediated message exchange between CC and the supervisor
model. Both sides write to the repo; Aiden routes short
signals between them.

## The loop

### CC → supervisor

- CC writes file to
  `.audit-working/relays/from-cc/{ISO-timestamp}-{topic}.md`.
- Terminating marker at bottom of every file:
  `---ready-for-supervisor---`.
- Include a unique NONCE near the top
  (format: `{ISO-timestamp}-{8-char-random-hex}`, e.g.
  `2026-05-22T083449Z-66731790`).
- CC commits + pushes.
- CC's terminal output to Aiden: ONLY path, commit hash,
  nonce string. No status block. No clipboard pipe.
- CC idles waiting for Aiden's next signal.

### Aiden → supervisor

- Aiden pastes the nonce + a brief trigger phrase (e.g.
  "packet 3 ready") into supervisor's chat.
- Supervisor `web_fetch`es the file at
  `raw.githubusercontent.com/ABond-Learning/secplus-app/main/.audit-working/relays/from-cc/{file}`.
- Supervisor verifies the fetched NONCE matches Aiden's
  quoted nonce. Mismatch → cache-staleness; refetch with
  `?_=<unix-ms>` cache-buster until match.

### Supervisor → Aiden

- Supervisor writes response via `create_file` in the
  supervisor sandbox at `/home/claude/relay-{topic}.md`.
- Calls `present_files` to make it downloadable.
- Response file includes:
  - Supervisor's own `SUPERVISOR_NONCE`
  - `CC_NONCE_ECHO` — CC's nonce echoed verbatim (proves
    fresh fetch)
  - Terminator marker `---ready-for-cc---`

### Aiden → CC

- Aiden downloads supervisor's file (typically into
  `~/Downloads/`).
- Messages CC: "Supervisor response at
  `~/Downloads/<filename>`" (or just pastes the path).
- That's the only routing Aiden does. No script, no
  bridge tool.

### CC processing

- Reads file from the Aiden-specified path.
- Copies it to
  `.audit-working/relays/from-supervisor/{ISO-timestamp}-{topic}.md`
  (audit trail).
- Commits + pushes with message
  `relay: supervisor → CC — {topic}`.
- Processes the instructions in the file.
- When ready for the next round-trip, writes a new
  `from-cc/` file → loop continues.

## What's banned

- **`iconv | clip.exe` of status blocks.** The clipboard
  pipe is only acceptable for very short copyable strings
  if at all (nonces, file paths, brief signals). Long
  status content lives in the relay file itself.
- **Long terminal status output.** CC's terminal to Aiden
  shows path + commit hash + nonce — nothing more. If
  Aiden wants more context, he reads the relay file in the
  repo. The relay file IS the surface.
- **Autonomous polling and bridge tools.** Aiden routes
  by hand using short signals. No `scripts/supervisor-relay.sh`.
  No 10-second poll loop. CC waits for Aiden's chat
  message.

## Audit trail

Both directions land in the repo as committed files:

- `from-cc/` — every CC → supervisor message
- `from-supervisor/` — every supervisor → CC message

Full conversation reconstructable from `git log` on those
two directories. No state lives only in chat or in
ephemeral terminal output.

## When relay is the wrong tool

Trivial single-message exchanges (small queries, quick
confirmations, "yes proceed") can use direct paste-relay.
The git overhead isn't worth it for one-line interactions.

Threshold: anything that would be a long status block
(>10 lines or with structured content) uses the relay.
Anything short can use direct paste between Aiden's two
chats.

## CC orientation on session restart

```
1. git pull --ff-only
2. ls .audit-working/relays/from-supervisor/*.md sorted by name
3. Compare against git log of from-cc/ commits: any
   from-supervisor file that has not been acknowledged by
   a later from-cc commit is unprocessed.
4. Process the oldest unprocessed file first.
```

No bookmark file is required — the git history is the
bookmark.

## Versioning

### CHANGELOG

- **2026-05-22 — v2** — simplified. Retired
  `scripts/supervisor-relay.sh` bridge tool and CC poll
  loop. Single round-trip pattern: both sides write to repo,
  Aiden routes short signals by hand. Banned `iconv | clip.exe`
  status blocks and long terminal output. Established
  during Task A.1 of "start as we mean to go on"
  infrastructure session.
- **2026-05-22 — v1** — initial protocol (file-based relay
  with bridge script + 10s poll loop). Tested end-to-end
  successfully (commits `fec556d` → `2035ab0` → `cc9d2c7`)
  but the bridge + poll layer was identified as over-built
  during the test cycle itself. Retired same day.
