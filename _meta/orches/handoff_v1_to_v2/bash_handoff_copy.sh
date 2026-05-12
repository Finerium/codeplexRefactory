#!/bin/bash
# bash_handoff_copy.sh
# Reference script for orches-v1Refactory_1 to orches-v1Refactory_2 handoff bundle creation.
# Author: orches-v1Refactory_1
# Target: ~/Documents/orches-v1Refactory_1READYHANDOFF/ folder ready to zip + upload
#
# Usage (Ghaisan Mac terminal, fresh terminal NOT Manager Wave-Fixing session):
#   bash ~/path/to/bash_handoff_copy.sh
#
# OR copy the 1-line command below + paste directly to terminal (faster):

# ============================================================================
# 1-LINE COMMAND (copy-paste this to fresh Mac terminal)
# ============================================================================

mkdir -p ~/Documents/orches-v1Refactory_1READYHANDOFF/project_files_copy && \
cd ~/Documents/codeplexRefactory && \
rsync -a --prune-empty-dirs \
  --include='*/' \
  --include='STATUS.md' \
  --include='CLAUDE.md' \
  --include='README.md' \
  --include='docs/prd/***' \
  --include='docs/context/***' \
  --include='docs/handoffs/***' \
  --include='docs/c4/***' \
  --include='_meta/orchestration_log/***' \
  --include='_meta/audit/***' \
  --include='_meta/contracts/***' \
  --include='_meta/handoff/***' \
  --include='_meta/qa_screenshots/***' \
  --include='_meta/wave_layout.md' \
  --include='_meta/task_graph.md' \
  --include='_meta/roster.md' \
  --include='.claude/agents/***' \
  --include='.claude/skills/***' \
  --include='.claude/commands/***' \
  --include='.claude/settings.json' \
  --include='slides/***' \
  --include='PanitSubmission/***' \
  --include='openspec/project.md' \
  --exclude='*' \
  ./ ~/Documents/orches-v1Refactory_1READYHANDOFF/project_files_copy/ && \
echo "=== Handoff bundle stats ===" && \
du -sh ~/Documents/orches-v1Refactory_1READYHANDOFF/ && \
find ~/Documents/orches-v1Refactory_1READYHANDOFF/ -type f | wc -l && \
echo "files total"

# ============================================================================
# WHAT THE COMMAND DOES
# ============================================================================
#
# 1. mkdir -p target folder
# 2. cd into project root (~/Documents/codeplexRefactory)
# 3. rsync curated subset of files (Tier 1 + Tier 2 from handoff_memo Section 9)
#    to ~/Documents/orches-v1Refactory_1READYHANDOFF/project_files_copy/
#    - INCLUDE: PRD, V_n snapshots, audit reports, contracts, STATUS, CLAUDE,
#      README, handoff, qa_screenshots, themis wave 0 ref, slides, PanitSubmission,
#      .claude/agents+skills+commands, settings.json, openspec/project.md
#    - EXCLUDE: source code (frontend/, backend/, infra/), node_modules,
#      .next, .git, _meta/source-mirror (huge), _meta/designer (huge),
#      .env (sensitive, never copy)
# 4. Report bundle size + file count
#
# After this command, ALSO copy 3 files from gw orches-v1Refactory_1 deliverable
# (which Ghaisan downloaded from Claude.ai chat via present_files):
#
#   cp ~/Downloads/HANDOFF_README.md ~/Documents/orches-v1Refactory_1READYHANDOFF/
#   cp ~/Downloads/handoff_memo.md ~/Documents/orches-v1Refactory_1READYHANDOFF/
#   cp ~/Downloads/bash_handoff_copy.sh ~/Documents/orches-v1Refactory_1READYHANDOFF/
#
# Plus copy 4 Manager prompt files (Ghaisan downloaded from earlier chat output):
#
#   mkdir -p ~/Documents/orches-v1Refactory_1READYHANDOFF/manager_prompts
#   cp ~/Downloads/manager-wave-1.md ~/Documents/orches-v1Refactory_1READYHANDOFF/manager_prompts/
#   cp ~/Downloads/manager-wave-2.md ~/Documents/orches-v1Refactory_1READYHANDOFF/manager_prompts/
#   cp ~/Downloads/manager-wave-3.md ~/Documents/orches-v1Refactory_1READYHANDOFF/manager_prompts/
#   cp ~/Downloads/manager-wave-fixing.md ~/Documents/orches-v1Refactory_1READYHANDOFF/manager_prompts/
#
# Then zip + upload:
#
#   cd ~/Documents && zip -r orches-v1Refactory_1READYHANDOFF.zip orches-v1Refactory_1READYHANDOFF/
#   open ~/Documents
#   # Drag orches-v1Refactory_1READYHANDOFF.zip to new Claude.ai chat session
#
# ============================================================================
# SIZE ESTIMATE
# ============================================================================
#
# Expected bundle:
# - PRD + idea-draft + context docs: ~2-3 MB
# - V_n snapshots + audit + handoff: ~500 KB - 1 MB
# - Contracts: ~200 KB
# - QA screenshots 22 files: ~32 MB (largest contributor)
# - .claude/agents + skills + commands: ~500 KB
# - slides + PanitSubmission: variable, maybe 2-5 MB
# - Manager prompts 4 files: ~150 KB
# - Handoff memo + README + bash script: ~100 KB
#
# Total: ~38-45 MB zipped (Claude.ai upload limit OK)
#
# If too large, drop _meta/qa_screenshots/ from rsync (replace include with exclude)
# and reference them via git URL in handoff_memo instead.
#
# ============================================================================
# SAFETY CHECKS (Ghaisan run BEFORE bash command)
# ============================================================================
#
# 1. Verify Manager Wave-Fixing terminal session NOT in this directory while rsync runs:
#    (Manager modify file might cause rsync mid-update race, OK to retry if happen)
#
# 2. Verify .env NOT in include list (sensitive, gitignored, NEVER copy):
#    grep -E "include='\.env'" ~/path/to/bash_handoff_copy.sh
#    (should return nothing, .env not in includes)
#
# 3. Disk space (handoff ~50 MB + zip another 50 MB):
#    df -h ~/Documents | head -2
#
# ============================================================================
