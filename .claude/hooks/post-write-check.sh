#!/usr/bin/env bash
# PostToolUse hook: warn kalau ada mock/fake/stub/placeholder pattern tanpa label
# Lock 5 (honest claim discipline) advisory
# Authored by Themis Wave 0 (2026-05-12)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Read file content; skip if file is too large (> 200KB) to avoid slow grep
SIZE=$(wc -c < "$FILE_PATH" 2>/dev/null || echo "0")
if [ "$SIZE" -gt 204800 ]; then
  exit 0
fi

CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")

# Detect mock/fake/stub/placeholder keyword case-insensitive
if echo "$CONTENT" | grep -iqE '\b(mock|fake|stub|placeholder)\b' 2>/dev/null; then
  # Check if labeled with [MOCK]/[PLACEHOLDER]/[STUB]
  if ! echo "$CONTENT" | grep -qE '\[(MOCK|PLACEHOLDER|STUB)' 2>/dev/null; then
    echo "[WARN] Lock 5: mock/fake/stub/placeholder keyword detected in $FILE_PATH without [MOCK]/[PLACEHOLDER]/[STUB] label." >&2
    echo "[WARN] Add label inline (e.g., '# [MOCK: returns canned response for demo]') or remove keyword." >&2
  fi
fi

exit 0
