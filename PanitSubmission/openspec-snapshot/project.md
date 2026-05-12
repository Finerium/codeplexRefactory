# Codeplex Chronicle - Project Context

## Project identity

- **Name**: Codeplex Chronicle
- **Tagline**: YOUR CODEBASE, ALIVE
- **Sub-tagline**: An AI-resident development environment
- **Type**: hackathon (24-hour build, Refactory Round 03 Telkom)
- **Domain**: https://duopoly.hackathon.sev-2.com (Refactory pre-provisioned)
- **Team**: Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
- **Event**: Refactory Hackathon Round 03, Telkom University Bandung
- **Timeline**: 12-13 May 2026 (kickoff Day 1 jam 13:00 WIB, submission Day 2 jam 11-13, pitch Day 2 jam 15-17 if top 5)
- **Theme**: Engineering Productivity x AI
- **GitHub akun**: Finerium (Ghaisan personal, repository github.com/Finerium/codeplexRefactory)

## What this product is

Codeplex Chronicle is an AI-resident development environment that transforms a production codebase into a navigable 3D city visualized alongside 5 expert AI residents. Files become buildings, folders become districts, and errors become earthquakes you can feel.

- **City = interface + memory hook**, NOT value proposition.
- **Value lives in 5 product modes** solving real engineering productivity pain:
  1. **Onboarding Mode**: new-hire mental map in 30 minutes vs 2-week baseline
  2. **Sprint Mode HERO**: agile workflow + ticket overlay + 14 PM concept visual mapping + PR-to-Building auto-sync
  3. **Refactor Mode SAFETY-FIRST**: AI proposal author + drafts/ simulation isolation + dual review gate
  4. **Activity Mode**: timeline scrubber 30/60/90 day + hotspot intensity + ownership heatmap
  5. **Health Mode**: 5 deterministic detectors (secrets/deps/auth/SQL/complexity) + Argus CVSS scoring + 1-click GitHub issue creation
- **5 AI residents** live in landmark buildings, each per-resident model + thinking-mode routing via DeepSeek V4:
  - Athena (City Hall, V4-Pro thinking high): Refactor proposal author
  - Apollo (Hospital, V4-Flash non-thinking): Health narration
  - Argus (Police Station, V4-Flash thinking low): Security CVSS scoring + exploit pattern
  - Clio (Library, V4-Flash non-thinking): Git history + spec-drift narration A-E
  - Hermes (Tourist Info booth, V4-Flash non-thinking): Onboarding tour + navigation guidance

## Why this product exists

Engineers spend 2+ weeks onboarding new codebases. Engineering managers context-switch across GitHub + Jira + multiple dashboards. Refactor proposals lack blast radius visibility before commit. Spec-drift accumulates silently across sprints. Codeplex Chronicle unifies these pain points in one spatial interface with AI as narrator and proposal author, never autonomous decision maker.

## Who uses this

- **Primary persona A**: software engineer (PRD Section 5.1 "Engineer Aldo") on GitHub-based workflow, doing onboarding + spec authoring + refactor proposal review
- **Primary persona B**: engineering manager (PRD Section 5.2 "Engineering Manager Budi"), tracking velocity + sprint management + cycle time review
- **Secondary persona**: Refactory Hackathon judge (PRD Section 5.3, audience persona for pitch + technical assessment post-event)

## Core principles

1. **AI as narrator + navigator + summarizer + proposal author with sandbox execution, NEVER autonomous landing on production code** (drafts/ isolation safety property AD-19 LOCKED)
2. **All insights grounded in deterministic source** (static analysis, git metadata, OpenSpec proposals, deterministic detectors A-E). LLM is storyteller, NOT judge.
3. **Refactor Mode writes to `drafts/<simulation-id>/` ONLY**, production code never changed by simulation engine. Only explicit user Accept materializes diff via PR/patch.
4. **Spatial encoding bandwidth higher than 2D graphs**. City is memory hook (engineer remembers "the tall red building in the Hermes district" more than "src/auth/login.ts line 42").
5. **Progressive degradation**: OpenSpec default + GitHub Issues fallback. Target repo with no `openspec/` folder gracefully falls back to GitHub Issue creation.
6. **Dual audience**: 3D City View for engineers + Dashboard 2D View for managers. Same data, two presentations.
7. **Safety-first AI compliance**: defensive layer (semantic cache + canned response + retry simplified + fallback V4-Flash + circuit breaker) prevents API outage from breaking demo.

## Conventions

### TypeScript / Frontend

- Strict mode, ESM modules
- ESLint + Prettier auto-format
- File naming: kebab-case (`building-tile.tsx`, `chat-panel.tsx`)
- Component naming: PascalCase exported (`BuildingTile`, `ChatPanel`)
- Function / variable: camelCase (`computeTreemap`, `buildingData`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_BUILDINGS`, `FEATURE_FLAGS`)
- Test pattern: co-located `<file>.test.ts` co-located with implementation

### Python / Backend

- Python 3.12 strict
- ruff + mypy strict
- async/await aggressively (FastAPI async + asyncpg + SQLAlchemy 2.0 async)
- Pydantic v2 for API contracts + LLM payload validation
- File naming: snake_case (`llm_client.py`, `tree_sitter_lazy.py`)
- Class naming: PascalCase (`ApolloFinding`, `RefactorSimulation`)
- Test pattern: `test_<file>.py` co-located

### Git commit format

- OpenSpec change: `opsx:<change-name>: <description>`
- Generic: `<type>:<scope>: <description>` where type is one of `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`
- Branch naming: `feat/<feature>` / `fix/<bug>` / `refactor/<scope>` / `chore/<task>`
- NEVER skip hooks (`--no-verify`), force push without explicit approval, amend published commits

## Key entities

| Entity | Description | Example |
|---|---|---|
| **Repo** | GitHub repository = one city | `github.com/Finerium/codeplexRefactory` |
| **City** | 3D space visualization of one repo | `https://duopoly.hackathon.sev-2.com/city` |
| **District** | Top-level folder = district within city | `frontend/`, `backend/`, `infra/` |
| **Building** | File = building within district | `frontend/components/landing/Hero.tsx` |
| **Resident** | 5 AI personas living in landmark buildings | Athena (City Hall), Apollo (Hospital), Argus (Police Station), Clio (Library), Hermes (Tourist Info) |
| **Ticket** | GitHub Issue + Milestone + size labels + linked PR | `#123: Implement 2FA, Milestone: Sprint 7, size: M, linked: PR #145` |
| **Proposal** | OpenSpec change folder | `openspec/changes/<change-name>/{proposal,design,tasks}.md` |
| **Drift** | Spec-implementation gap detected via 5 deterministic patterns A-E | Pattern A: stale closed issue; Pattern E: OpenSpec drift |
| **Cycle** | Worker execution unit within Wave 0-3 | "Themis Cycle 5" = one cycle of work by Themis worker |
| **Spec** | OpenSpec specification file | `openspec/specs/<domain>/spec.md` |

## Architectural decisions (AD-01 to AD-10, locked PRD Section 8.3)

1. **AD-01 Monolith Next.js + FastAPI**: 24-hour build, ship faster than microservice
2. **AD-02 Treemap deterministic layout**: predictable + cacheable vs force-directed berantakan
3. **AD-03 Raw `<instancedMesh>` per archetype** (NOT Drei `<Instances>`): faster per r3f #3306 for 200-300 building
4. **AD-04 OpenSpec dual-folder strategy**: Folder A `openspec/` panitia primary + Folder B `.agent-openspec/` internal workflow
5. **AD-05 Visual frontend-first wave sequencing**: Wave 1+2 = 52% capacity, visual quality bar non-negotiable
6. **AD-06 DeepSeek V4-Flash primary + V4-Pro fallback** (NOT Gemini): pure shift Day-0, $5 Hafiz throwaway, OpenAI-compat
7. **AD-07 GitHub Issues as backbone ticket**: Sprint=Milestone, Story=Issue+labels, PR native. OAuth gratis, no parallel sync
8. **AD-08 Refactor Mode write to drafts/ + dual review gate**: safety-first AI, defensibility tinggi
9. **AD-09 5 deterministic detector for Health** (NOT AI-driven): grounded static analysis, AI=narrator, compliance philosophy
10. **AD-10 tree-sitter Python binding with 11 grammar lazy-load**: multi-language requirement, lazy-load prevents cold start bloat

## Additional architectural decisions

- **AD-19 drafts/ isolation LOCKED safety property**: production code never modified by simulation engine, only via explicit user Accept
- **AD-21 Per-wave auditor gate Lock 10**: Eunomia Wave 1, Dike Wave 2, Aletheia Wave 3 mandatory before next-wave spawn
- **AD-22 Greek mythology naming convention**: 22 agents canonical, anti-collision matrix LOCKED

## Runtime constraints

- **60fps target** on M-series MacBook Pro 16GB with 200-300 building stub (Phase B H1 hypothesis validated Wave 1 via Eunomia audit)
- **1M token DeepSeek V4 context** sufficient for whole repo analysis (no chunking needed for typical demo repo size <= 50k LOC)
- **Cost budget $5** Hafiz throwaway DeepSeek account, real-time tracking via `llm_call_log` table
- **Browser**: Chrome / Edge latest or Safari 17+
- **K8s namespace `duopoly`** Refactory pre-provisioned (no custom domain config)
- **NGINX Ingress HTTPS termination** Refactory-managed (no cert-manager override)
- **PostgreSQL** at `103.185.52.138:1185` db `duopoly` (Refactory pre-provisioned)
- **kubeconfig** at `~/.kube/duopoly-config` mode 600 (outside repo entirely)

## Tech stack

See `CLAUDE.md` and `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` Section 17 for authoritative tech stack lock. Summary:

- **Frontend**: Next.js 16 + React 19 + TypeScript + Three.js 0.184 + @react-three/fiber 9.6 + Tailwind + GSAP
- **Backend**: Python 3.12 + FastAPI + tree-sitter-language-pack 11-grammar lazy-load
- **LLM**: DeepSeek V4-Flash + V4-Pro (OpenAI ChatCompletions API compat, base_url https://api.deepseek.com)
- **Spec**: OpenSpec Fission-AI core profile + dual-folder strategy
- **Deploy**: Kubernetes namespace `duopoly` (Refactory pre-provisioned) + PostgreSQL event store
- **Auth**: GitHub OAuth akun Finerium (scope minimal: read:repo + read:org + read:issues + read:pull_requests + write:issues)

## In scope (hackathon MVP, LOCKED PRD Section 7.1)

- 5 product modes (Onboarding, Sprint HERO, Refactor SAFETY-FIRST, Activity, Health)
- 5 AI residents (Athena, Apollo, Argus, Clio, Hermes) with per-resident DeepSeek V4 routing
- 3D City View + Dashboard 2D View dual audience
- Dual-folder OpenSpec strategy (Folder A + Folder B)
- GitHub OAuth + read API + selective write (Hybrid Layer 1 issue creation + Hybrid Layer 2 refactor simulation)
- Demo dataset: NodeGoat (hero Health) + fastapi/full-stack-fastapi-template (Sprint + OpenSpec init) + PyGoat (fallback)
- 11 detector (5 Apollo Health + Argus CVSS + 5 spec-drift A-E)
- WebSocket real-time PR-to-Building sync + simulation progress
- Demo URL live at `https://duopoly.hackathon.sev-2.com`

## Out of scope (Phase 2 deferred, LOCKED PRD Section 7.2)

- Local filesystem drag-drop (`File System Access API`): awkward demo permission flow, dropped
- Multi-repo hierarchy 3-level (Country/Region/City/District): Phase 2, MVP 1 repo = 1 city dropdown
- Drag ticket between milestones: Phase 2, MVP Sprint Mode passive read-only
- Time Mode full multi-year scrub: Phase 2, MVP Activity Mode 30/60/90 day only
- Iris resident (dedicated narrator): DROPPED per PRD D11, narration distributed to Clio + Apollo + Athena
- Workspace persistence beyond browser session: Phase 2, MVP session-bound
- Multi-tenant isolation beyond OAuth session: Phase 2, MVP single-tenant
- Custom domain configuration: use pre-provisioned `duopoly.hackathon.sev-2.com` only
- Self-hosted DeepSeek inference: hosted API only
- Gemini API integration: pure shift to DeepSeek, no Gemini fallback

## Refactory Hackathon rules compliance (per PRD Section 24.1)

- **Tech stack mandate**: OpenSpec + LLMs (DeepSeek) + Kubernetes + PostgreSQL all 4 used
- **Eligibility**: both team members <= 28 years, physically present Day 2 final presentation mandatory (Hafiz)
- **Build constraint**: all code developed during hackathon, open-source libraries only, no pre-existing non-OSS, no outsourcing
- **Submission deliverable**: PRD .md + .pdf + C4 diagram 4-tier + ERD + repository link + slide deck
- **Demo flow**: 2-min walkthrough 3x consecutive successful trial run (per PRD SC-04)

---

**Project context last updated**: 2026-05-12 by Themis Wave 0 (Cycle 6 OpenSpec enrichment)
**Source authority**: PRD Section 7.1 + Section 8 + Section 11 + Section 17 + Section 24.1
**Cross-references**: `CLAUDE.md` + `docs/handoffs/sourceoftruth.md` + `_meta/metis/Agentic_Structure-codeplex-chronicle.md`
