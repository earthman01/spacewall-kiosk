#!/usr/bin/env bash
# POST reload to ntfy after Pages has the new menu PNG.
# Usage: scripts/notify-dinner-reload.sh [message]
set -euo pipefail
TOPIC="sw-dinner-9078675918a9d356afae42e2731a4858"
MSG="${1:-reload}"
curl -fsS -d "$MSG" -H "Title: Dinner menu" -H "Tags: wine_glass" \
  "https://ntfy.sh/$TOPIC" >/dev/null
echo "ntfy posted: $MSG"
