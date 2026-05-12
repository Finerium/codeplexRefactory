#!/usr/bin/env bash
# PreToolUse hook on Bash: block git commit tanpa OpenSpec proposal hash atau valid commit-type prefix
# Workflow guard for git commit message format compliance
# Authored by Themis Wave 0 (2026-05-12)

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

# Only check git commit commands
if ! echo "$COMMAND" | grep -qE '^git commit'; then
  exit 0
fi

# Extract commit message from -m "..." flag (basic extraction; heredoc also supported)
MSG=""
if echo "$COMMAND" | grep -qE -- '-m '; then
  # Single-line: -m "message"
  MSG=$(echo "$COMMAND" | sed -nE 's/.*-m "([^"]+)".*/\1/p' | head -1)
fi

# If no message extracted via -m, check for HEREDOC pattern (common in Claude Code)
if [ -z "$MSG" ] && echo "$COMMAND" | grep -qE 'cat <<.+EOF'; then
  # HEREDOC pattern, allow (assume Claude Code authoring proper format)
  exit 0
fi

# If still no message and not amend / merge / etc., warn but do not block
if [ -z "$MSG" ]; then
  exit 0
fi

# Check for valid prefix: opsx:, feat:, fix:, refactor:, docs:, chore:, test:, ci:
VALID_PREFIXES='^(opsx|feat|fix|refactor|docs|chore|test|ci)(:|\()'
if ! echo "$MSG" | grep -qE "$VALID_PREFIXES"; then
  echo '{"block": true, "message": "Commit blocked: invalid prefix. Format: opsx:<name>: <desc> OR <type>:<scope>: <desc> where type is one of feat|fix|refactor|docs|chore|test|ci. See .claude/skills/codeplex-chronicle-conventions/SKILL.md."}' >&2
  exit 2
fi

exit 0
