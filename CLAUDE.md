# Project: Codeplex Chronicle

> YOUR CODEBASE, ALIVE

**Team**: Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Event**: Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026
**Theme**: Engineering Productivity x AI
**Domain**: https://duopoly.hackathon.sev-2.com
**Type**: hackathon (24-jam build)
**GitHub akun**: Finerium
**Repository**: github.com/Finerium/codeplexRefactory

## What

AI-resident development environment yang mentransformasi production codebase jadi 3D city. Files become buildings, errors become earthquakes. 5 AI residents (Athena, Apollo, Argus, Clio, Hermes) live in landmark buildings, serve 5 product modes (Onboarding, Sprint HERO, Refactor SAFETY-FIRST, Activity, Health).

## Tech stack (LOCKED PRD Section 17)

- **Frontend**: Next.js 16 + React 19 + TypeScript + Three.js 0.184 + @react-three/fiber 9.6 + Tailwind + GSAP
- **Backend**: Python 3.12 + FastAPI + tree-sitter-language-pack 11-language lazy-load
- **LLM**: DeepSeek V4-Flash + V4-Pro (OpenAI ChatCompletions API compat, `base_url=https://api.deepseek.com`)
- **Spec**: OpenSpec Fission-AI core profile, dual-folder strategy (LOCKED PRD D27)
- **Deploy**: Kubernetes namespace `duopoly` (Refactory pre-provisioned) + PostgreSQL event store
- **Auth**: GitHub OAuth (akun Finerium, scope minimal: read:repo + read:org + read:issues + read:pull_requests + write:issues)

## Commands

```bash
# Frontend dev (Wave 1+ init)
cd frontend && npm run dev                    # Next.js dev port 3000

# Backend dev (Wave 3 init)
cd backend && uvicorn app.main:app --reload   # FastAPI dev port 8000

# Tests
cd frontend && npm test
cd backend && pytest

# Lint
cd frontend && npm run lint
cd backend && ruff check && mypy

# OpenSpec (dual folder)
openspec list specs              # Folder A panitia
openspec validate                # Folder A
cd .agent-openspec && openspec validate  # Folder B internal

# K8s deploy (Wave 3 Atlas)
kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly apply -f infra/k8s/
```

## Code style

- TypeScript strict mode, ESM modules, ESLint + Prettier auto-format
- Python 3.12 strict (ruff + mypy strict), async/await aggressively, Pydantic v2 for API contracts
- File naming: kebab-case untuk file, PascalCase untuk component, camelCase untuk function/variable, SCREAMING_SNAKE_CASE untuk constants
- Test pattern: co-located `<file>.test.ts` / `test_<file>.py`
- Detail conventions: `.claude/skills/codeplex-chronicle-conventions/SKILL.md`

## Architecture

```
frontend/         Next.js + R3F 3D City View + 5 product mode UI (Wave 1-2)
backend/          FastAPI + tree-sitter parser + LLM gateway Triton DeepSeek (Wave 3)
infra/
  k8s/            Kubernetes manifests (Atlas Wave 3)
  docker/         Dockerfile multi-arch (Atlas Wave 3)
drafts/           Refactor Mode simulation sandbox (gitignored, regenerable, AD-19 isolation)
datasets/         Cached parser output for demo repos (NodeGoat, fastapi/full-stack-fastapi-template)
openspec/         Folder A panitia-facing primary spec (LOCKED D27)
.agent-openspec/  Folder B internal workflow agent output
_meta/            Orchestration metadata (workflow artifacts, audit trails, contracts, decision logs)
docs/             PRD + C4 diagrams + ERD + handoffs + pitch + source context
PanitSubmission/  Panitia-facing submission bundle (Ghaisan zip Day 2 jam 11-13)
```

## Workflow

This project follows Ghaisan's V1 Orchestrator workflow (`/orches-v1` skill chain). Hands-off operator mode:

- **Wave 0 specialists**: Pythia (contracts) + Hephaestus (worker prompts) + Themis (project-local setup + C4 + openspec + ERD + PanitSubmission)
- **Pre-Wave 0 external**: Council `/council-v1` (PRD lock) + Metis `/metis-v1` (Agentic Structure md) + Designer `/designer-v1` (3 claude.ai/design prompts)
- **Workers Wave 1-3 spawned via `.claude/agents/<worker>.md`** (19 worker prompts authored by Hephaestus, LOCKED V_n)
- **4 mandatory artifacts per cycle**: decision log (`_meta/decision_log/<worker>.md`), uncertainty journal (`_meta/uncertainty/<worker>-cycle<N>-*.md`), checkpoint (`_meta/checkpoints/<worker>-cycle<N>.md`), handoff contract (`_meta/handoff_log/wave<N>_<from>_to_<to>.md`)
- **Anti-pattern hard locks**: `.claude/skills/anti-pattern-locks/SKILL.md` (10 locks auto-load, enforcement via `.claude/hooks/pre-write-check.sh` + `.claude/hooks/post-write-check.sh` + `.claude/hooks/workflow-guard.sh`)
- **Audit gates Lock 10**: per-wave Eunomia (Wave 1) / Dike (Wave 2) / Aletheia (Wave 3) mandatory
- **Pan post-Wave 3**: universal agent standby + demo rehearsal 3x + slide deck prompt template + bug sweep + polish + rescue + lesson-learned author saat user trigger close session
- **Ferry threshold**: HIGH bar (5 trigger). Default = uncertainty journal medium concerns + proceed conservative.

## Key directories

- `.claude/`, Claude Code configuration (agents + skills + hooks + commands + settings.json)
- `_meta/`, orchestration metadata (contracts, decision_log, uncertainty, checkpoints, handoff_log, orchestration_log, audit, task_graph, roster, wave_layout)
- `docs/`, human-facing project docs (PRD, C4, ERD, handoffs, pitch, context)
- `openspec/` + `.agent-openspec/`, dual-folder spec layer (Folder A panitia + Folder B internal)
- `PanitSubmission/`, panitia-facing submission bundle (Ghaisan zip Day 2)

## Resumption

Always read `STATUS.md` at session start to know current state. Then read relevant `_meta/checkpoints/<active-worker>-cycle<N>.md` + `_meta/decision_log/<active-worker>.md` + latest V_n snapshot di `_meta/orchestration_log/`.

For Wave 1 spawn directive (V1 Orch consume turn-by-turn): read `PromptOpening-codeplex-chronicle.md` di project root.

## DeepSeek V4 LLM provider

- **Primary**: V4-Flash (1M context, 384K max output, $0.14 / $0.28 per 1M token)
- **Secondary**: V4-Pro (1.6T total params MoE, $1.74 / $3.48 per 1M token, 75% off until 2026-05-31 15:59 UTC)
- **Routing per resident** (LOCKED PRD Section 18.3):
  - Athena (City Hall, Refactor proposal author): V4-Pro thinking high
  - Apollo (Hospital, Health narration): V4-Flash non-thinking
  - Argus (Police Station, Security CVSS): V4-Flash thinking low
  - Clio (Library, Git / spec-drift narration): V4-Flash non-thinking
  - Hermes (Tourist Info, Tour script): V4-Flash non-thinking
- **Client SDK**: OpenAI Python SDK >=1.x with `base_url=https://api.deepseek.com`, drop-in pattern
- **Legacy aliases** `deepseek-chat` / `deepseek-reasoner` deprecated 2026-07-24, JANGAN pakai. Eksplisit pakai `deepseek-v4-flash` + `deepseek-v4-pro`.
- **Defensive layer**: semantic cache cosine 0.85 + canned response pre-cache + retry simplified prompt + fallback Flash to Pro + circuit breaker 5-fail 60s cooldown (Triton Wave 3)
- **Cost budget**: Hafiz $5 throwaway account. Real-time tracking via Demeter `llm_call_log` table + cost tracking aggregate per session.

## Critical Phase B anchors

- **r3f baseline**: raw `<instancedMesh>` NOT Drei `<Instances>` per r3f #3306
- **Drop-first feature flag order on regress**: DepthOfField first, then pixel ratio, then Sparkles
- **OpenSpec dual-folder**: two `openspec init` runs, both core profile, distinct `--tools` per folder
- **DeepSeek reasoning_content quirk**: NEVER replay `reasoning_content` from prior turns (Triton CRITICAL anti-pattern)
- **Shared 3000-token system header**: H6 hypothesis cache-hit 98% discount via PromptOpening
- **drafts/ isolation safety property**: production code NEVER changes by simulation engine, ONLY via explicit user Accept (Pandora Wave 3, AD-19 LOCKED, pitch defensibility)

## Submission deliverable (per PRD Section 24.1)

- PRD .md (agent-consumed) at `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` (Council Wave 0 ship)
- PRD .pdf (panitia pitch-tier) at `docs/prd/PRD-ideaLocked_codeplex-chronicle.pdf`
- C4 diagram 4-tier formal at `docs/c4/C4-{Context,Container,Component,Code}.md` + `.svg` (Themis Wave 0 ship)
- ERD at `docs/c4/ERD.md` + `.svg` (Themis Wave 0 ship)
- Repository link: github.com/Finerium/codeplexRefactory
- Slide presentation: Hafiz finalize manual Day 2 jam 11-13 submission window (Pan author template)
- PanitSubmission/ folder bundled = README + PRD copies + c4/ + openspec-snapshot/ + erd/ (Ghaisan zip Day 2)

## Source of truth

- `docs/prd/PRD-ideaLocked_codeplex-chronicle.md`, canonical idea-locked spec (2094 line)
- `docs/handoffs/sourceoftruth.md`, current execution state context (post-Council)
- `_meta/metis/Agentic_Structure-codeplex-chronicle.md`, agentic blueprint (worker + wave + DAG locked)
- `_meta/contracts/_master_index.md`, 33 contracts + 2 index files (locked Pythia Wave 0)
- `_meta/{task_graph,roster,wave_layout}.md`, canonical translation of Metis md (Themis Wave 0)
- `PromptOpening-codeplex-chronicle.md`, Wave 1 spawn directive + shared session header (Hephaestus Wave 0)

---

**Project doc last updated**: 2026-05-12 by Themis Wave 0
**Project context auto-load**: this file (CLAUDE.md) loaded by Claude Code at session start
