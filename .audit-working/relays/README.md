# CC ↔ Supervisor Relay

Git-mediated message bus between Claude Code (running in WSL on
Aiden's machine) and the supervisor model (running in a separate
Claude conversation, fetched via web_fetch on
raw.githubusercontent.com).

**Why not paste-relay?** Each manual paste-relay round-trip is
~30-60s of Aiden time (iconv → clip.exe → switch tab → paste).
At the SB-fix-1b cadence of 4-6 round-trips per packet, that's
real overhead. Git push + supervisor web_fetch + supervisor
response + Aiden runs `supervisor-relay.sh` is ~20s total wall-
clock once warm.

## Directory layout

```
.audit-working/relays/
├── README.md                                   (this file)
├── .last-processed-from-supervisor             (CC bookmark)
├── from-cc/                                    (CC writes here)
│   └── {ISO-timestamp}-{topic}.md
└── from-supervisor/                            (supervisor writes here via Aiden's bridge script)
    └── {ISO-timestamp}-{topic}.md
```

`.audit-working/relays/` is the **only** subtree of
`.audit-working/` that is git-tracked. The rest of
`.audit-working/` remains gitignored (see top-level `.gitignore`).

## File naming convention

`{ISO-8601-timestamp}-{topic-kebab}.md`

Examples:
- `2026-05-22T093500Z-relay-test.md`
- `2026-05-22T101230Z-sb-fix-1b-packet-3.md`

Timestamps use UTC (Z) for ordering stability. Topic should be
kebab-case, short enough to scan, descriptive enough to identify
in `ls`.

## Markers

Every from-cc message ends with a terminating marker:

```
---ready-for-supervisor---
```

Every from-supervisor message ends with:

```
---ready-for-cc---
```

The marker confirms the writer finished the message (vs partial
write / commit-mid-edit). Supervisor verifies the marker before
processing; CC's poll loop verifies it before treating a file as
processable.

## Nonce / cache-staleness protocol

`raw.githubusercontent.com` has been observed serving stale
content (precedent: 2026-05-21 morning — supervisor fetched
yesterday's handoff doc and received the previous day's version).

Mitigation: every from-cc message embeds a unique nonce near the
top — the ISO timestamp suffices, but a separately-printed
`NONCE: <string>` line makes verification mechanical. Supervisor
compares the nonce in the fetched content against the nonce
quoted in chat by Aiden. Mismatch → fetch again with cache-
buster (`?_=<unix-ms>`) until match.

Same direction reversed: from-supervisor files include a nonce
that CC can verify against the chat hand-off if Aiden quotes it.

## CC orientation on session restart

```
1. Read .audit-working/relays/.last-processed-from-supervisor
   (if present). It contains the ISO timestamp of the last
   from-supervisor file CC has processed.
2. ls .audit-working/relays/from-supervisor/*.md and find any
   files newer than the bookmark.
3. Process the oldest unprocessed file first.
```

`.last-processed-from-supervisor` is a plain-text file
containing one line: the ISO timestamp of the last processed
file (matches the filename prefix). It IS git-tracked — survives
WSL restarts, branch switches, machine moves.

## CC poll loop (when actively awaiting a response)

After CC pushes a from-cc message, CC enters a poll cycle:

```
while true:
  git fetch --quiet
  git pull --quiet --ff-only
  scan from-supervisor/ for files newer than .last-processed-from-supervisor
  if new file present and ends with ---ready-for-cc---:
    process it (update bookmark, read, act)
    break
  sleep 10
```

The poll cadence is 10 seconds. Adjust if Aiden+supervisor
typically take longer to respond — but supervisor latency is
human-supervisor-bound, not network-bound, so 10s polling is
not wasteful.

## Bridge script (Aiden's side)

`scripts/supervisor-relay.sh` runs on Aiden's machine when
supervisor produces a response. Usage:

```
./scripts/supervisor-relay.sh <path-to-supervisor-response.md>
```

It:
1. Generates a fresh ISO timestamp
2. Copies the supplied file to
   `.audit-working/relays/from-supervisor/{ISO}-{topic}.md`
   (topic derived from input filename)
3. Stages, commits with message
   `relay: supervisor → CC — {topic}`, pushes
4. Confirms the push reached origin via post-push git log

## Failure modes + handling

- **Push fails (no network)**: bridge script reports failure;
  CC's poll loop continues polling indefinitely — no auto-retry,
  retry by re-running the bridge script.
- **Marker absent (partial write)**: poll loop skips the file
  until next iteration; if marker still absent after several
  iterations, surface as anomaly.
- **Nonce mismatch (cache staleness)**: supervisor re-fetches
  with cache-buster query string; if persistent, Aiden falls
  back to paste-relay for that round-trip.
- **Bookmark loss (file deleted)**: CC re-processes all
  from-supervisor files in timestamp order (idempotent since
  CC's commits would already exist).

## Versioning

This is v1 of the protocol. Changes go in a CHANGELOG section
below.

### CHANGELOG

- 2026-05-22 — v1 — initial protocol; established during Task A
  of "start as we mean to go on" infrastructure session.
