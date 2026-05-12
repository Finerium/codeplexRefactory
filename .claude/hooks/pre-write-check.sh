#!/usr/bin/env bash
# PreToolUse hook: block Write/Edit yang contain em dash atau emoji
# Lock 1 (no em dash) + Lock 2 (no emoji) deterministic enforcement
# Authored by Themis Wave 0 (2026-05-12)

set -euo pipefail

INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null || echo "")

# Lock 1: em dash detection (double-hyphen pattern, but allow CLI flags like --help)
# Block ONLY when -- appears in markdown/code body context (i.e., NOT followed by alphanumeric flag char + whitespace)
# Simple heuristic: detect `--` sequence followed by space or end-of-line (markdown em dash pattern)
if echo "$CONTENT" | grep -qE '[^-]--[[:space:]]'; then
  echo '{"block": true, "message": "Lock 1 violation: em dash (--) detected in content body. Use comma, parenthesis, or period instead. Bypass with [LOCK1_OVERRIDE: <reason>] in file header if intentional (e.g., CLI flag documentation)."}' >&2
  exit 2
fi

# Lock 2: emoji detection (rough unicode range)
# Emoji blocks: Misc Symbols & Pictographs (1F300-1F9FF), Misc Symbols (2600-27BF)
if echo "$CONTENT" | grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' >/dev/null 2>&1; then
  echo '{"block": true, "message": "Lock 2 violation: emoji detected. Use [CRITICAL] / [NOTE] / [TIP] text labels instead."}' >&2
  exit 2
fi

exit 0
