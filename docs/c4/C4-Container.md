# C4 Level 2: Container Diagram (Codeplex Chronicle)

**Diagram type**: C4 Level 2 (Container)
**Purpose**: Decompose Codeplex Chronicle into deployable containers + show inter-container communication
**Audience**: Refactory judge + new engineer + Wave 3 backend implementer
**Source**: PRD Section 8.2 Container Diagram + PRD Section 17 Tech Stack + Metis md Section 3 Roster
**Authored by**: Themis Wave 0
**Date**: 2026-05-12 16:55 WIB

```mermaid
flowchart TB
    classDef person fill:#08427B,color:#fff,stroke:#052E56,stroke-width:2px
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:2px
    classDef database fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:2px
    classDef external fill:#999,color:#fff,stroke:#666,stroke-width:2px
    classDef cdn fill:#76B6E1,color:#000,stroke:#438DD5,stroke-width:2px

    %% People
    Engineer[("Engineer<br/>Manager<br/>Judge")]:::person

    %% Codeplex Chronicle Containers
    subgraph CCC["Codeplex Chronicle (System boundary)"]
        SPA["Frontend SPA<br/>(Container)<br/><br/>Next.js 16 App Router +<br/>React 19 + TypeScript<br/>+ Three.js 0.184<br/>+ @react-three/fiber 9.6<br/>+ Tailwind + GSAP<br/><br/>3D City View + Dashboard 2D +<br/>5 product mode UI +<br/>5 residents chat + ticket panel +<br/>side panel + landing + entry"]:::container

        APIServer["Backend API<br/>(Container)<br/><br/>Python 3.12 +<br/>FastAPI async +<br/>Uvicorn ASGI<br/><br/>OAuth flow + webhook receiver +<br/>tree-sitter parser pool +<br/>11 detector +<br/>Refactor simulation engine"]:::container

        WSChannel["WebSocket Channel<br/>(Container, in-process)<br/><br/>FastAPI WebSocket +<br/>3 channel:<br/>building-events,<br/>finding-events,<br/>refactor-events<br/><br/>Real-time PR-to-Building<br/>sync + simulation progress"]:::container

        LLMClient["LLM Gateway<br/>(Container, in-process)<br/><br/>openai Python SDK >=1.x<br/>base_url=api.deepseek.com<br/><br/>Defensive layer:<br/>semantic cache cosine 0.85 +<br/>canned response top-10 +<br/>retry simplified prompt +<br/>fallback Flash to Pro +<br/>circuit breaker 5-fail 60s"]:::container

        TSParser["Tree-sitter Parser Pool<br/>(Container, in-process)<br/><br/>tree-sitter-language-pack<br/>11 grammars lazy-load<br/>(TS/JS, Python, Go, Java,<br/>C, C++, Rust, Ruby, PHP,<br/>Kotlin, Swift)<br/><br/>Cold start &lt; 300ms target"]:::container

        DraftsFS["drafts/ Sandbox<br/>(Container, filesystem)<br/><br/>Refactor Mode<br/>simulation output<br/><br/>drafts/&lt;simulation-id&gt;/<br/>gitignored, regenerable<br/><br/>AD-19 LOCKED:<br/>production code NEVER<br/>touched by sim engine"]:::container

        OpenSpecCLI["OpenSpec Runtime<br/>(Container, subprocess)<br/><br/>OpenSpec CLI<br/>Fission-AI core profile<br/><br/>Folder A openspec/<br/>panitia primary<br/>Folder B .agent-openspec/<br/>internal workflow"]:::container
    end

    %% Internal database
    Postgres[("PostgreSQL<br/>(Container, external)<br/><br/>Refactory-managed<br/>103.185.52.138:1185<br/><br/>Tables: pr_events,<br/>finding_events, drift_log,<br/>simulation_events,<br/>llm_call_log, semantic_cache,<br/>proposals, ticket_state,<br/>materialized views x3")]:::database

    %% External
    GitHub["GitHub.com"]:::external
    DeepSeek["DeepSeek V4 API"]:::external
    K8sIngress["NGINX Ingress<br/>(Refactory-managed)<br/>HTTPS termination<br/>duopoly.hackathon.sev-2.com"]:::cdn

    %% Flow: User to Ingress to Containers
    Engineer -->|HTTPS<br/>browser request| K8sIngress
    K8sIngress -->|HTTP<br/>route| SPA
    K8sIngress -->|HTTP<br/>/api/*| APIServer
    K8sIngress -->|WSS<br/>/api/ws/*| WSChannel

    %% SPA to Backend
    SPA -->|REST + WebSocket subscribe| APIServer
    SPA <-->|WSS real-time push| WSChannel

    %% Backend internal
    APIServer -->|in-process call| LLMClient
    APIServer -->|in-process call| TSParser
    APIServer -->|filesystem write| DraftsFS
    APIServer -->|subprocess invoke<br/>openspec list/validate/archive| OpenSpecCLI
    APIServer <-->|in-process<br/>broadcast events| WSChannel

    %% Backend to external services
    APIServer -->|OAuth flow<br/>API read/write<br/>Webhook receive| GitHub
    APIServer -->|HTTPS<br/>per-resident routing<br/>thinking-mode toggle| DeepSeek
    LLMClient -->|HTTPS POST<br/>chat/completions| DeepSeek

    %% Backend to DB
    APIServer <-->|asyncpg pool<br/>SQLAlchemy 2.0 async| Postgres
```

## Legend

- **Container icon (filled blue rectangle)**: deployable container in Codeplex Chronicle system
- **Database icon (cylinder)**: persistent storage
- **External icon (gray)**: external system
- **CDN/Ingress icon (light blue)**: edge proxy
- **Solid arrow with label**: synchronous interaction (protocol)

## Container summary table

| Container | Tech | Wave 3 Owner | Responsibility |
|---|---|---|---|
| **Frontend SPA** | Next.js 16 + React 19 + Three.js + r3f | Wave 1 (Daedalus + Iris + Calliope + Hestia + Selene) + Wave 2 (Hera + Asclepius + Boreas + Persephone) | 3D City + Dashboard + 5 mode UI + chat/ticket/side panels |
| **Backend API** | Python 3.12 + FastAPI async | Hades (scaffold + OAuth + webhook + WS) | OAuth flow, webhook receiver, parser + detector + simulation orchestration |
| **WebSocket Channel** | FastAPI WebSocket, 3 channels | Hades (setup) + Pandora/Nemesis (publish) + Asclepius/Hera (consume) | Real-time PR-to-Building sync + finding events + refactor events |
| **LLM Gateway** | openai SDK >=1.x + defensive layer | Triton (Wave 3) | Per-resident routing + thinking-mode toggle + cache + retry + fallback + circuit breaker |
| **Tree-sitter Parser Pool** | tree-sitter-language-pack, 11 grammars | Hades (parser API) + cached output Day-0 prep | Lazy-load multi-language AST parsing, cold start < 300ms |
| **drafts/ Sandbox** | Filesystem (gitignored, regenerable) | Pandora (simulation engine writes here) | AD-19 LOCKED isolation: production never touched, only Accept materializes diff |
| **OpenSpec Runtime** | OpenSpec CLI subprocess + Fission-AI core | Demeter (runtime integration) + Pandora (change folder generator) | spec data via JSON, change folder author, drift detection, archive |
| **PostgreSQL** | PostgreSQL 16 (Refactory-managed) | Demeter (Wave 3) schema + migrations + queries | Event store + cache + ticket state + materialized views |

## Communication protocols

| Edge | Protocol | Schema |
|---|---|---|
| User → Ingress | HTTPS (TLS 1.3) | HTML / JSON |
| Ingress → SPA | HTTP | Static assets + HTML |
| Ingress → API | HTTP | REST JSON |
| Ingress → WS | WSS (WebSocket Secure) | JSON message |
| SPA → API | REST JSON | Pydantic-defined API contracts per `_meta/contracts/<edge>.md` |
| SPA ↔ WS | WSS bidirectional | TypeScript types per `_meta/contracts/<edge>.md` |
| API → GitHub | HTTPS REST + webhook (HMAC signed) | GitHub API v2022-11-28 |
| API → DeepSeek | HTTPS REST | OpenAI ChatCompletions compat |
| API ↔ Postgres | TCP (asyncpg) | SQL + SQLAlchemy 2.0 async ORM |
| API → OpenSpec | subprocess stdout/stderr | OpenSpec JSON output |
| API → drafts/ | filesystem write | Unified diff format files |

## Critical architecture decisions reflected

| Decision | Container affected | Visual |
|---|---|---|
| AD-01 monolith Next.js + FastAPI | Frontend SPA + Backend API | Single block per side, no microservice split |
| AD-04 OpenSpec dual-folder | OpenSpec Runtime + Backend API | Folder A and Folder B both visible in OpenSpec Runtime annotation |
| AD-06 DeepSeek per-resident routing | LLM Gateway | Defensive layer annotation explicit |
| AD-08 drafts/ isolation safety | drafts/ Sandbox + Backend API | AD-19 LOCKED annotation explicit |
| AD-10 tree-sitter lazy-load 11 grammars | Tree-sitter Parser Pool | 11 grammars listed + cold start budget annotation |

## Cross-references

- PRD Section 8.2 (C2 Container Diagram table)
- PRD Section 17 (Tech Stack locked)
- PRD Section 8.3 (Key architectural decisions AD-01 to AD-10)
- `_meta/contracts/_master_index.md` (per-container handoff schemas)
- C4-Component.md (Level 3 decomposition of Frontend SPA + Backend API)

---

**Diagram authored**: 2026-05-12 16:55 WIB by Themis Wave 0
**SVG export**: `docs/c4/C4-Container.svg`
**Mirror in PanitSubmission/**: `PanitSubmission/c4/C4-Container.{md,svg}`
