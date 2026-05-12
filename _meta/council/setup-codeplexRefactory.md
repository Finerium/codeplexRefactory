# Setup Codeplex Chronicle - One-Block Scaffolding Command

Paste blok bash di bawah ke terminal lu (macOS zsh atau bash). Eksekusi auto-create folder structure di `~/Documents/codeplexRefactory`, tulis `.env` dengan DeepSeek key + model names lock, `.gitignore`, `README.md`, `openspec/project.md`, chmod `.env` ke mode 600, dan auto-copy source context dari `~/Documents/KonteksRefactoryHackathon/` ke `docs/context/`.

Council ga author prompt apa-apa di scaffolding ini (worker + auditor prompts + `PromptOpening-codeplex-chronicle.md` itu Hephaestus di Wave 0 Orches-v1 yang author).

---

## Command

```bash
mkdir -p ~/Documents/codeplexRefactory && cd ~/Documents/codeplexRefactory && \
mkdir -p \
  .claude/{agents,commands,skills} \
  .agent-openspec/{changes,specs,archive} \
  openspec/{changes,specs,archive} \
  _meta/council/{deliberation,research} \
  _meta/{metis,designer,orches} \
  docs/{prd,c4,handoffs,pitch,context} \
  slides frontend backend drafts datasets \
  infra/{k8s,docker} \
  scripts/day0-prep && \
touch \
  .claude/{agents,commands,skills}/.gitkeep \
  .agent-openspec/{changes,specs,archive}/.gitkeep \
  openspec/{changes,specs,archive}/.gitkeep \
  _meta/council/{deliberation,research}/.gitkeep \
  _meta/{metis,designer,orches}/.gitkeep \
  docs/{prd,c4,handoffs,pitch,context}/.gitkeep \
  slides/.gitkeep frontend/.gitkeep backend/.gitkeep \
  infra/{k8s,docker}/.gitkeep \
  drafts/.gitkeep datasets/.gitkeep \
  scripts/day0-prep/.gitkeep

cat > .env <<'ENVEOF'
# ============================================================
# Codeplex Chronicle - Local Environment
# Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
# Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026
# DO NOT COMMIT THIS FILE (gitignored by default)
# ============================================================

# ----- DeepSeek API (LLM provider primary, paid Hafiz $5 hackathon-throwaway account) -----
DEEPSEEK_API_KEY=REDACTED_DEEPSEEK_KEY
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FLASH=deepseek-v4-flash
DEEPSEEK_MODEL_PRO=deepseek-v4-pro
# Pricing per 1M tokens (source: api-docs.deepseek.com, May 2026):
#   V4-Flash: $0.14 input / $0.28 output
#   V4-Pro:   $1.74 input / $3.48 output (75% off until 2026-05-31 15:59 UTC)
# OpenAI ChatCompletions + Anthropic API both supported on same base_url.
# Reasoning modes: Non-think / Think High / Think Max via extra_body={"thinking":{"type":"enabled"}} + reasoning_effort
# Legacy aliases deepseek-chat / deepseek-reasoner deprecated 2026-07-24, use v4 names eksplisit.

# ----- GitHub OAuth (Wave 0 Claude Code setup, account: Finerium) -----
GITHUB_USER=Finerium
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URI=https://duopoly.hackathon.sev-2.com/auth/callback
GITHUB_OAUTH_SCOPES=read:repo,read:org,read:issues,read:pull_requests,write:issues
GITHUB_WEBHOOK_SECRET=

# ----- Refactory pre-provisioned (fill from team folder duopoly hari-H) -----
DATABASE_URL=postgresql://duopoly:CHANGEME@HOST:5432/duopoly
KUBECONFIG_PATH=
K8S_NAMESPACE=duopoly
APP_DOMAIN=duopoly.hackathon.sev-2.com

# ----- Feature flags (per idea-draft Section J.3 + K, runtime drop kill-switches) -----
ENABLE_WRITE_OPS=true
ENABLE_WRITE_OPS_LAYER_2=true
ENABLE_DOF=true
ENABLE_SPARKLES_TIER_3=true
ENABLE_THIRD_DIRECTIONAL_LIGHT=true

# ----- Application runtime -----
APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
PYTHONUNBUFFERED=1

# ----- OpenSpec (telemetry off for firewall safety per research) -----
OPENSPEC_TELEMETRY=0
DO_NOT_TRACK=1
ENVEOF

cat > .env.example <<'EXEOF'
# Template, no real secrets. Copy to .env and fill in.

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FLASH=deepseek-v4-flash
DEEPSEEK_MODEL_PRO=deepseek-v4-pro

GITHUB_USER=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URI=
GITHUB_OAUTH_SCOPES=read:repo,read:org,read:issues,read:pull_requests,write:issues
GITHUB_WEBHOOK_SECRET=

DATABASE_URL=
KUBECONFIG_PATH=
K8S_NAMESPACE=duopoly
APP_DOMAIN=duopoly.hackathon.sev-2.com

ENABLE_WRITE_OPS=true
ENABLE_WRITE_OPS_LAYER_2=true
ENABLE_DOF=true
ENABLE_SPARKLES_TIER_3=true
ENABLE_THIRD_DIRECTIONAL_LIGHT=true

APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
PYTHONUNBUFFERED=1

OPENSPEC_TELEMETRY=0
DO_NOT_TRACK=1
EXEOF

cat > .gitignore <<'GIEOF'
# Environment (NEVER commit real secrets)
.env
.env.local
.env.*.local

# Node
node_modules/
.next/
out/
.turbo/
*.log

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
.pytest_cache/
.mypy_cache/
.ruff_cache/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Sandbox + cache (transient, regenerable)
drafts/*
!drafts/.gitkeep
datasets/cache/
datasets/*.json

# K8s secrets (NEVER commit)
infra/k8s/secrets/
*.kubeconfig
*.pem
*.key

# Build artifacts
dist/
build/
*.egg-info/

# Auto-generated handoff zips (large, archive elsewhere)
docs/handoffs/*.zip
GIEOF

cat > README.md <<'RMEOF'
# Codeplex Chronicle

> YOUR CODEBASE, ALIVE

**Team**: Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Event**: Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026
**Theme**: Engineering Productivity x AI
**Domain**: https://duopoly.hackathon.sev-2.com

## What

Codeplex Chronicle turns real production codebases into living 3D cities. Files become buildings, folders become districts, errors become earthquakes you can feel. Five AI residents (Athena, Apollo, Argus, Clio, Hermes) live in landmark buildings and serve five product modes: Onboarding, Sprint (hero), Refactor, Activity, Health.

## Status

Pre-event scaffolding 12 May 2026. PRD authoring in progress (Council session). Wave 0-3 execution kickoff at approx 13:00 WIB Day 1.

## Stack (locked per PRD)

- Frontend: Next.js 16 + React 19 + TypeScript + Three.js 0.184 + @react-three/fiber 9.6 + Tailwind + GSAP
- Backend: Python 3.12+ + FastAPI + tree-sitter (11 language grammar)
- LLM: DeepSeek V4-Flash + V4-Pro (OpenAI ChatCompletions API compatible)
- Spec: OpenSpec (Fission-AI, core profile) with dual-folder strategy
  - `openspec/` panitia-facing, primary spec for jurors post-hackathon
  - `.agent-openspec/` internal workflow agent output
- Deploy: Kubernetes namespace `duopoly` (Refactory pre-provisioned) + PostgreSQL
- Auth: GitHub OAuth

## Workflow

```
Council (PRD)
  -> Metis (AGENT_STRUCTURE.md)
  -> Designer-v1 (3 UI prompts: Landing, Entry, Dashboard)
  -> Orches-v1 (Wave 0-3 execution)
  -> Pan (universal worker)
```

Hands-off mode: operators only (Ghaisan + Hafiz), Claude Code handles all execution including K8s deploy.

## Structure

```
.claude/             Claude Code agents + commands + OpenSpec auto-detect skills
.agent-openspec/     Folder B internal workflow agent output (hidden)
openspec/            Folder A panitia-facing primary spec
_meta/               Council + Metis + Designer + Orches workflow artifacts
docs/                PRD, C4 diagrams, handoffs, pitch script, source context
slides/              Hafiz handles Day 2 11:00-13:00 submission window
frontend/            Next.js + Three.js + r3f (Wave 1-2)
backend/             FastAPI + tree-sitter (Wave 3)
infra/               K8s manifests + Dockerfile (Wave 3)
drafts/              Refactor Mode simulation sandbox (gitignored)
scripts/day0-prep/   demo dataset fork + populate via GitHub API
datasets/            cached parser output for demo repos (gitignored)
```

## License

TBD post-hackathon.
RMEOF

cat > openspec/project.md <<'PMEOF'
# Codeplex Chronicle - Project Context

(Wave 0 Pythia will enrich this file to approx 250 lines per OpenSpec hackathon best practice. Below is the scaffolding seed; fields tagged [TO ENRICH] are Wave 0 mandate.)

## Project identity

- **Name**: Codeplex Chronicle
- **Tagline**: YOUR CODEBASE, ALIVE
- **Type**: hackathon (24-hour build, Refactory Round 03 Telkom)
- **Domain**: https://duopoly.hackathon.sev-2.com
- **Team**: Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
- **Timeline**: 12-13 May 2026

## What this product is

An AI-resident development environment for understanding, refactoring, and securing real production codebases, visualized as a 3D city explored alongside 5 expert AI residents. City is interface plus memory hook, NOT value proposition. Value lives in 5 product modes solving real engineering productivity pain.

## Why this product exists

Engineers spend 2+ weeks onboarding new codebases. Managers context-switch across GitHub + Jira + dashboards. Refactor proposals lack blast radius visibility before commit. Codeplex Chronicle unifies these in one spatial interface with AI as narrator and proposal author, never autonomous decision maker.

## Who uses this

- Primary: software engineers + engineering managers on GitHub-based workflows
- Secondary: Refactory Hackathon judges (May 12-13 2026)

## Core principles

1. AI as narrator + navigator + summarizer + proposal author with sandbox execution, NEVER autonomous landing on production
2. All insights grounded in deterministic source (static analysis, git metadata, OpenSpec proposals, deterministic detectors)
3. Refactor Mode writes to `drafts/`, never production until explicit user Accept
4. Spatial encoding bandwidth higher than 2D graphs
5. Progressive degradation (OpenSpec default, GitHub Issues fallback)

## Conventions

[TO ENRICH in Wave 0]
- Coding conventions (TypeScript style, Python style, commit message format, branch naming)
- Key entities (Repo, City, District, Building, Resident, Ticket, Proposal, Drift)
- Architectural decisions (treemap layout, InstancedMesh, FastAPI async, dual-folder OpenSpec)
- Runtime constraints (60fps target, 200-300 buildings, M-series demo laptop)

## Tech stack

See `README.md`. Authoritative source: `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` (Council output).

## In scope (hackathon MVP)

- 5 product modes (Onboarding, Sprint hero, Refactor, Activity, Health)
- 5 AI residents (Athena, Apollo, Argus, Clio, Hermes)
- 3D City View + Dashboard View dual audience
- Dual-folder OpenSpec strategy
- GitHub OAuth + read API + selective write (Hybrid Layer 1+2)
- Demo dataset: NodeGoat + fastapi/full-stack-fastapi-template forks

## Out of scope (deferred Phase 2)

- Local filesystem drag-drop (in-memory virtual FS only for "Build from scratch")
- Multi-repo hierarchy 3-level (1 repo = 1 city dropdown for MVP)
- Drag ticket between milestones (Sprint Mode passive read-only)
- Time Mode full multi-year scrub (Activity Mode 30/60/90 day only)
- Workspace persistence beyond browser session
- Multi-tenant isolation beyond user OAuth session
PMEOF

chmod 600 .env

if [ -d ~/Documents/KonteksRefactoryHackathon ]; then
  cp ~/Documents/KonteksRefactoryHackathon/*.md docs/context/ 2>/dev/null
  cp ~/Documents/KonteksRefactoryHackathon/*.txt docs/context/ 2>/dev/null
  cp ~/Documents/KonteksRefactoryHackathon/*.pdf docs/context/ 2>/dev/null
  cp ~/Documents/KonteksRefactoryHackathon/duopoly.zip docs/context/ 2>/dev/null
  echo "source context copied to docs/context/"
fi

echo ""
echo "=== scaffolding complete: ~/Documents/codeplexRefactory ==="
echo ""
find . -maxdepth 2 -type d -not -path '*/\.*' | sort
echo ""
echo "credentials: .env (mode 600, gitignored), .env.example (template, committable)"
echo "PRD landing: docs/prd/"
echo "handoffs landing: docs/handoffs/"
echo "next: Council session lanjut author PRD-ideaLocked, lu attach hari-H ke Metis -> Designer -> Orches"
```

---

## Verifikasi post-run yang lu cek

1. `cd ~/Documents/codeplexRefactory && cat .env | head -5` -> DeepSeek key + model names visible
2. `ls -la .env` -> permission `-rw-------` (cuma owner read/write)
3. `find . -maxdepth 2 -type d -not -path '*/\.*'` -> 15 top-level folder structure ke-list
4. `ls docs/context/` -> isi `idea-draft_codeplex-chronicle.md`, `idea-draft_codeplex-chronicle.pdf`, `research_finding.md`, `refactory-hackathon-WebsiteInformation.md`, `RefactoryHackathonRules&FAQ.txt`, `duopoly.zip` udah ke-copy

## Catatan tambahan

- Source context auto-copy dari `~/Documents/KonteksRefactoryHackathon/` ke `docs/context/`. Kalau lu rename folder atau pindahin, manual `cp` aja.
- `.env.example` aman di-commit (no real values), `.env` real ga akan ke-commit karena `.gitignore` cover.
- DeepSeek pricing comment di `.env`: V4-Flash $0.14/$0.28 per 1M token. Quote Hafiz $0.38/$0.76 itu untuk legacy `deepseek-chat` V3.x, V4 jauh lebih murah lagi. $5 budget Hafiz effective jadi puluhan juta token, lebih dari cukup untuk 24-jam hackathon scope.
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` masih kosong, fill saat Claude Code Wave 0 GitHub OAuth app create di akun Finerium.
- `DATABASE_URL` + `KUBECONFIG_PATH` fill hari-H pas lu dapet credential dari panitia di team folder duopoly.
- Folder `.claude/agents/`, `.claude/commands/`, `.claude/skills/` empty placeholder. Hephaestus (Wave 0 Orches-v1) yang drop file di sini, plus author `PromptOpening-codeplex-chronicle.md` di project root.

Kalau lu lihat ada folder/file yang missing setelah eksekusi, ping gw. Kalau aman, gw lanjut Council Phase F authoring `PRD-ideaLocked_codeplex-chronicle.md` + PDF.
