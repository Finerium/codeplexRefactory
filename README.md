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
