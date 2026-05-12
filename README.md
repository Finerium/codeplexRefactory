# Codeplex Chronicle

> **YOUR CODEBASE, ALIVE**
>
> An AI-resident development environment that turns a real production codebase into an interactive 3D city, where sprint tickets, pull requests, code health, and security risk all live on top of the same map.

[![Deploy](https://img.shields.io/badge/deploy-duopoly.hackathon.sev--2.com-2ea44f)](https://duopoly.hackathon.sev-2.com)
[![License](https://img.shields.io/badge/license-TBD%20post--hackathon-lightgrey)](#license)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-orange?logo=threedotjs)](https://threejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.12-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek%20V4-blue)](https://api.deepseek.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-namespace%20duopoly-326ce5?logo=kubernetes)](https://kubernetes.io)
[![OpenSpec](https://img.shields.io/badge/OpenSpec-Fission--AI%20core-purple)](https://github.com/Fission-AI/OpenSpec)

---

## Pitch

Codeplex Chronicle adalah platform project management dan agile software development yang menyatukan **sprint management**, **codebase visualization**, dan **AI assistants** ke dalam satu workspace berbentuk **kota 3D interaktif**. Engineer dan manager tidak perlu lagi berpindah-pindah antara GitHub, Jira, dashboard analytics, dan dokumentasi hanya untuk memahami progres pengembangan software. Setiap file direpresentasikan sebagai bangunan, setiap task sprint langsung terhubung ke bagian kode yang sedang dikerjakan, dan tim bisa melihat secara visual di mana pekerjaan berlangsung, siapa yang mengerjakan, PR mana yang masih direview, hingga bagian mana yang bermasalah atau mengalami spec drift.

The system is operated by **five resident AI agents**: **Hermes** as the onboarding guide that helps engineers map an unfamiliar codebase, **Athena** as the architect that drafts refactor proposals and technical plans, **Clio** as the historian that narrates Git history and sprint progress, **Apollo** as the health agent that monitors code quality and technical debt, and **Argus** as the security agent that detects vulnerabilities and risk hotspots. On top of these residents, five product modes turn the city into actionable workflow: **Sprint Mode** untuk visualisasi task agile real-time di atas codebase, **Onboarding Mode** untuk membantu engineer baru memahami struktur project dalam hitungan menit, **Activity Mode** untuk memantau kontribusi dan hotspot dari histori Git, **Refactor Mode** untuk simulasi perubahan kode secara aman sebelum diterapkan ke production (sandbox `drafts/` isolation), dan **Health Mode** untuk mendeteksi masalah code quality + security dan langsung mengubahnya menjadi backlog ticket.

Dengan pendekatan ini Codeplex Chronicle berfungsi sebagai **living workspace** untuk software engineering team: project management, kolaborasi, sprint monitoring, dan pengembangan software berjalan di dalam satu sistem terpadu, bukan empat tab browser yang berbeda.

---

## Known issues (infra-tier, documented for jurors)

These are infrastructure annotations on the deployed environment, NOT functional bugs. The app at `https://duopoly.hackathon.sev-2.com` is live and serving 200 OK on all routes (smoke test 3x consecutive PASS per Atlas Wave-Fixing #2 cycle 2 ship snapshot, image `sha256:f12322b5...`, multi-arch amd64+arm64). Full details in [`_meta/audit/atlas_ghcr_tls_verification_20260513-0149.md`](_meta/audit/atlas_ghcr_tls_verification_20260513-0149.md) and [`_meta/orchestration_log/V5_wave_fixing_2_complete_20260513-0424.md`](_meta/orchestration_log/V5_wave_fixing_2_complete_20260513-0424.md).

- **GHCR container package is private by default.** The page [`github.com/Finerium/codeplexRefactory/pkgs/container/codeplexrefactory`](https://github.com/Finerium/codeplexRefactory/pkgs/container/codeplexrefactory) returns 404 to anonymous viewers. The image (`ghcr.io/finerium/codeplexrefactory:latest@sha256:f12322b5...`, multi-arch amd64+arm64) exists and is being pulled by the deployed K8s cluster via `imagePullSecrets`. Jurors who want to inspect the package: authenticate with `gh auth login` (any PAT with `read:packages` scope) then visit the link, or pull directly via authenticated `docker pull`. The repository owner can flip the package to public via GitHub Web UI: visit [`github.com/users/Finerium/packages/container/codeplexrefactory/settings`](https://github.com/users/Finerium/packages/container/codeplexrefactory/settings), scroll to Danger Zone, Change visibility, Public, confirm by typing the package name. PAT-based API flip requires `admin:packages` scope which is not present on the current Finerium build token.
- **TLS cert on the live domain is Traefik default self-signed** (`CN=TRAEFIK DEFAULT CERT`, valid until 2027-05-12). Chromium-family and Firefox browsers will show a "Connection Not Private" interstitial. Click `Advanced -> Proceed` to continue. For a clean screen-recording or demo session, launch Chrome with `--ignore-certificate-errors --user-data-dir=/tmp/demo-profile`. Re-issuing with a real CA (LetsEncrypt) requires Refactory cluster admin action and is out of team Duopoly scope.

---

## Agent Structure

Build pipeline orchestrated via Ghaisan's V1 Orchestrator (`/orches-v1`) hands-off workflow. Wave 0 specialists author the foundation (contracts, worker prompts, project scaffold), Wave 1 builds the visual foundation in 3D, Wave 2 layers the five product modes, Wave 3 brings backend + LLM gateway + spec-drift detection + Kubernetes deploy, and Pan does post-Wave 3 polish + demo rehearsal + slide template + submission packaging.

![Agent Structure](docs/diagrams/agent-structure.png)

*Agent structure across Wave 0-3 + Pan post-wave. Each box is a specialized worker prompt LOCKED at Wave 0, spawned via `.claude/agents/<worker>.md`, audited per wave by Eunomia (Wave 1), Dike (Wave 2), and Aletheia (Wave 3).*

---

## Features

### Product Modes

| Mode | Purpose | Visual signal |
|---|---|---|
| **Sprint** *(hero)* | Real-time visualization of agile tickets attached to specific code regions. Sprint backlog, in-progress, review, done lanes render as colored auras on buildings. | Glow + ticket marker on each affected building |
| **Onboarding** | New engineer tour. Hermes walks the visitor through entry points, key modules, and "where to start" districts. | Cinematic camera arc + Hermes voiceover narration |
| **Activity** | Git history heatmap. Recently changed buildings glow warmer, dormant ones cool. Hotspots + contributor density visible at a glance. | Heatmap shader + contributor avatar markers |
| **Refactor** *(safety-first)* | Simulate code changes inside `drafts/` sandbox isolation. Athena proposes, the city previews the new shape, dual review gate (engineer + AI) required before any production write. | Side-by-side ghost city overlay |
| **Health** | Code quality + security scan output. Earthquakes for vulnerabilities, cracks for tech debt, every finding convertible to a GitHub issue with one click. | Earthquake + crack effect on impacted buildings |

### AI Residents

| Resident | Landmark | Role | LLM routing |
|---|---|---|---|
| **Athena** | City Hall | Architect. Drafts refactor proposals + technical plans. | DeepSeek V4-Pro (thinking high) |
| **Apollo** | Hospital | Health agent. Narrates code quality + technical debt findings. | DeepSeek V4-Flash (non-thinking) |
| **Argus** | Police Station | Security agent. Detects vulnerabilities, scores CVSS. | DeepSeek V4-Flash (thinking low) |
| **Clio** | Library | Historian. Narrates Git history + spec-drift events. | DeepSeek V4-Flash (non-thinking) |
| **Hermes** | Tourist Info | Onboarding guide. Tour scripts + entry-point explainers. | DeepSeek V4-Flash (non-thinking) |

Each resident is a stateful agent with a defined system prompt, scope of authority, and per-mode trigger contract. Routing is locked in PRD Section 18.3.

---

## Architecture

```
frontend/      Next.js 16 App Router + R3F 3D city renderer + 5 product mode UI
backend/       FastAPI gateway + tree-sitter parser + LLM client + WebSocket stream
infra/         Kubernetes manifests (namespace duopoly) + multi-arch Dockerfile
drafts/        Refactor Mode sandbox (gitignored, regenerable, AD-19 isolation)
datasets/      Cached parser output for demo repos (NodeGoat etc.)
openspec/      Folder A panitia-facing primary spec (dual-folder D27)
.agent-openspec/  Folder B internal workflow agent output
docs/          PRD + C4 + ERD + diagrams + handoffs + pitch
_meta/         Orchestration metadata (contracts, decisions, audits)
PanitSubmission/  Panitia-facing zip bundle (assembled Day 2 jam 11-13)
```

**Frontend**: Next.js 16 (App Router) + React 19 + TypeScript strict + Three.js 0.184 (pinned, not auto-update) + @react-three/fiber 9.6 + @react-three/drei + @react-three/postprocessing (Bloom + DoF + ChromaticAberration + Vignette + Noise + ACES Filmic ToneMapping) + Tailwind CSS + GSAP for cinematic camera arcs. Critical anchor: raw `<instancedMesh>` is used instead of Drei `<Instances>` per r3f issue #3306 for stable batched rendering at scale.

**Backend**: Python 3.12+ + FastAPI (async + WebSocket) + Uvicorn + tree-sitter-language-pack with 11 grammars lazy-loaded (TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift) + SQLAlchemy async + asyncpg + Alembic migrations + PyGithub for server-side webhook handling. The diagram pipeline (mermaid-py + graphviz + eralchemy2) renders architecture, dependency, and ERD views on demand at `/api/diagram/<repo-id>` returning a JSON payload of nodes, edges, and SVG blobs that the city renderer consumes for layout hints (demo-repo scope, multi-repo Phase 2).

**Infra**: Docker multi-arch image push to ghcr.io + `kubectl apply -f infra/k8s/` against pre-provisioned Refactory namespace `duopoly` + NGINX Ingress HTTPS on `duopoly.hackathon.sev-2.com`.

**Database**: PostgreSQL event store with 9 tables covering sprints, tickets, building state cache, residents, LLM call logs, spec snapshots, drift events, sandbox sessions, and audit trail. Full schema lives in [`docs/c4/ERD.md`](docs/c4/ERD.md) with rendered diagram at [`docs/c4/ERD.png`](docs/c4/ERD.png).

**LLM**: DeepSeek V4-Flash (1M context, $0.14 / $0.28 per 1M token) as primary + DeepSeek V4-Pro (1.6T MoE, $1.74 / $3.48 per 1M token, 75% off until 2026-05-31) as secondary, both via OpenAI Python SDK 1.x with `base_url=https://api.deepseek.com`. Per-resident routing locked in PRD Section 18.3. Defensive layer: semantic cache (cosine 0.85) + canned response pre-cache + retry with simplified prompt + Flash to Pro fallback + circuit breaker (5 fail / 60s cooldown) implemented in the Triton gateway.

**Spec layer**: OpenSpec (Fission-AI, `core` profile) in dual-folder mode (PRD D27 LOCKED). Folder A `openspec/` is the panitia-facing canonical layout (`changes/`, `specs/`, `archive/`). Folder B `.agent-openspec/` is the internal workflow agent output, never consumed by panitia evaluators.

**Auth**: GitHub OAuth (account `Finerium`) with minimal scopes `read:repo + read:org + read:issues + read:pull_requests + write:issues`.

### C4 Diagrams

Full C4 model rendered to PNG + SVG, source markdown in [`docs/c4/`](docs/c4/):

- [Context](docs/c4/C4-Context.md) ([PNG](docs/c4/C4-Context.png) / [SVG](docs/c4/C4-Context.svg))
- [Container](docs/c4/C4-Container.md) ([PNG](docs/c4/C4-Container.png) / [SVG](docs/c4/C4-Container.svg))
- [Component](docs/c4/C4-Component.md) (Frontend / Backend / LLM Gateway, PNG + SVG bundled)
- [ERD](docs/c4/ERD.md) ([PNG](docs/c4/ERD.png) / [SVG](docs/c4/ERD.svg))

---

## Tech Stack

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![GSAP](https://img.shields.io/badge/GSAP-3.x-88ce02)](https://gsap.com)
[![R3F](https://img.shields.io/badge/@react--three/fiber-9.6-000)](https://r3f.docs.pmnd.rs)
[![tree-sitter](https://img.shields.io/badge/tree--sitter-11%20grammars-228b22)](https://tree-sitter.github.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-event%20store-4169e1?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-multi--arch-2496ed?logo=docker)](https://www.docker.com)

---

## Getting Started

### Prerequisites

- Node.js 20+ + npm 10+
- Python 3.12+ + `uv` (recommended) or pip
- Docker Desktop (optional, for K8s deploy)
- A `.env` with `DEEPSEEK_API_KEY` + GitHub OAuth client ID/secret + Postgres DSN

### Clone

```bash
git clone https://github.com/Finerium/codeplexRefactory.git
cd codeplexRefactory
```

### Frontend dev

```bash
cd frontend
npm install
npm run dev
# Next.js dev server on http://localhost:3000
```

### Backend dev

```bash
cd backend
uv pip install -e .
uvicorn app.main:app --reload
# FastAPI on http://localhost:8000 (OpenAPI docs at /docs)
```

### OpenSpec (dual folder)

```bash
openspec list specs                                 # Folder A (panitia)
openspec validate
cd .agent-openspec && openspec validate             # Folder B (internal)
```

### Kubernetes deploy

```bash
kubectl --kubeconfig=$HOME/.kube/duopoly-config -n duopoly apply -f infra/k8s/
```

### Tests + lint

```bash
cd frontend && npm test && npm run lint
cd backend && pytest && ruff check && mypy
```

---

## Team + Event

| Field | Value |
|---|---|
| **Team** | Duopoly |
| **Members** | Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin |
| **Event** | Refactory Hackathon Round 03 |
| **Venue** | Telkom University Bandung |
| **Dates** | 12-13 May 2026 (24-hour build) |
| **Theme** | Engineering Productivity x AI |
| **Live demo** | https://duopoly.hackathon.sev-2.com |
| **Repository** | https://github.com/Finerium/codeplexRefactory |

---

## License

**TBD post-hackathon**. The repository is currently maintained for Refactory Hackathon Round 03 evaluation. A permissive license (MIT or Apache 2.0) is the most likely outcome once the team finalises post-event direction.

---

## Acknowledgments

- **Refactory** Hackathon Round 03 panitia, for pre-provisioning the Kubernetes namespace, PostgreSQL instance, and `*.hackathon.sev-2.com` domain.
- **DeepSeek AI**, for providing V4-Flash + V4-Pro at a price point that makes a 24-hour multi-resident agentic build economically viable.
- **OWASP NodeGoat**, **OWASP PyGoat**, and `fastapi/full-stack-fastapi-template`, used as demo datasets to showcase the city renderer on real production-scale code.
- **Fission-AI/OpenSpec**, the spec layer that backs the Refactor Mode dual-folder workflow.
- **Anthropic Claude** (Max plan, build-time only), the workflow orchestrator that wrote, audited, and locked every wave of this project end to end.
