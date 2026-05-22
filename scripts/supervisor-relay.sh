#!/usr/bin/env bash
# supervisor-relay.sh — ship a supervisor response file into the
# from-supervisor/ relay directory, commit, push, verify.
#
# Usage:
#   ./scripts/supervisor-relay.sh <path-to-supervisor-response.md>
#
# Bridge script for the CC ↔ supervisor git-mediated relay.
# See .audit-working/relays/README.md for protocol details.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <path-to-supervisor-response.md>" >&2
  exit 64
fi

SRC="$1"
if [[ ! -f "$SRC" ]]; then
  echo "error: source file does not exist: $SRC" >&2
  exit 66
fi

# Derive topic from source filename (strip extension, kebab-case).
SRC_BASENAME="$(basename "$SRC")"
TOPIC="${SRC_BASENAME%.*}"
# Normalise whitespace/underscores/dots to hyphens; lowercase.
TOPIC="$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | tr ' _.' '---' | tr -s '-')"
# Trim leading/trailing hyphens.
TOPIC="${TOPIC#-}"; TOPIC="${TOPIC%-}"
if [[ -z "$TOPIC" ]]; then
  TOPIC="response"
fi

# Fresh UTC ISO timestamp (no colons — filesystem-safe).
TS="$(date -u +%Y-%m-%dT%H%M%SZ)"

REPO_ROOT="$(git rev-parse --show-toplevel)"
DEST_DIR="$REPO_ROOT/.audit-working/relays/from-supervisor"
mkdir -p "$DEST_DIR"
DEST="$DEST_DIR/${TS}-${TOPIC}.md"

cp "$SRC" "$DEST"
echo "wrote: $DEST"

cd "$REPO_ROOT"
git add "$DEST"
COMMIT_MSG="relay: supervisor → CC — ${TOPIC}"
git commit -m "$COMMIT_MSG"
COMMIT_SHA="$(git rev-parse --short HEAD)"
echo "committed: $COMMIT_SHA — $COMMIT_MSG"

echo "pushing to origin…"
git push origin HEAD

# Post-push verification: confirm the commit appears in origin's log.
git fetch --quiet origin
if git log --oneline "origin/$(git rev-parse --abbrev-ref HEAD)" | head -1 | grep -q "$COMMIT_SHA"; then
  echo "verified: commit $COMMIT_SHA on origin"
else
  echo "WARNING: post-push verification did not find $COMMIT_SHA on origin" >&2
  exit 70
fi

echo
echo "relay file: .audit-working/relays/from-supervisor/${TS}-${TOPIC}.md"
echo "CC will detect this within ~10s on next poll iteration."
