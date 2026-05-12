# C4 Level 3: Component Diagram (Codeplex Chronicle)

**Diagram type**: C4 Level 3 (Component)
**Purpose**: Decompose Frontend SPA + Backend API + LLM Gateway containers into components with mode-specific responsibility
**Audience**: Wave 1-3 implementer + Aletheia final audit + Refactory judge technical review
**Source**: PRD Section 9 Functional Requirements per Mode + Metis md Section 3 Roster + `_meta/contracts/_master_index.md`
**Authored by**: Themis Wave 0
**Date**: 2026-05-12 17:00 WIB

## Frontend SPA components

```mermaid
flowchart TB
    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8,stroke-width:2px
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:2px
    classDef external fill:#999,color:#fff,stroke:#666,stroke-width:2px

    subgraph SPA["Frontend SPA Container"]
        CityView["3D City View<br/>(Component)<br/><br/>Three.js + r3f scene<br/>+ InstancedMesh<br/>5 archetype<br/>+ treemap layout<br/><br/>Daedalus (scaffold) +<br/>Iris (geometry)"]:::component

        ModePanels["5 Product Mode UI Panels<br/>(Component)<br/><br/>Onboarding (Boreas) +<br/>Sprint HERO (Hera) +<br/>Refactor (Asclepius) +<br/>Activity (Boreas) +<br/>Health (Asclepius)"]:::component

        ChatPanel["AI Residents Chat Panel<br/>(Component)<br/><br/>5-resident routing<br/>+ message thread<br/>+ broadcast/single toggle<br/><br/>Persephone slide-in/out anim<br/>+ glassmorphism dark accent"]:::component

        TicketPanel["Ticket Panel<br/>(Component)<br/><br/>GitHub issue +<br/>assignee + size badge +<br/>status mapping +<br/>linked PR<br/><br/>Persephone slot integration"]:::component

        SidePanel["Side Panel (3 variants)<br/>(Component)<br/><br/>Refactor proposal review<br/>+ Health findings detail<br/>+ Activity drilldown<br/><br/>Persephone slot integration"]:::component

        Dashboard["Dashboard 2D View<br/>(Component)<br/><br/>Selene flat 2D<br/>manager-facing<br/>+ KPI glance +<br/>velocity + burndown +<br/>spec drift A-E summary +<br/>cross-repo rail +<br/>city preview corner"]:::component

        LandingPage["Landing Page<br/>(Component)<br/><br/>Calliope Awwwards-tier<br/>cinematic-restraint<br/>dev-poetic voice"]:::component

        EntryPage["Entry Page<br/>(Component)<br/><br/>Hestia 2-card entry<br/>(Import repo +<br/>Build from scratch)<br/>+ 5 resident footer"]:::component
    end

    APIServer["Backend API<br/>(Container)"]:::container
    WSChannel["WebSocket Channel<br/>(Container)"]:::container

    LandingPage -->|navigate to| EntryPage
    EntryPage -->|OAuth handoff| APIServer
    EntryPage -->|navigate to| CityView
    EntryPage -->|navigate to| Dashboard

    CityView -->|click building| ModePanels
    CityView -->|click resident landmark| ChatPanel
    ModePanels -->|click ticket| TicketPanel
    ModePanels -->|click proposal/finding| SidePanel

    ChatPanel -->|REST POST<br/>resident query| APIServer
    SidePanel <-->|REST GET/POST<br/>proposal/finding fetch + accept| APIServer
    TicketPanel -->|REST POST<br/>1-click GitHub issue| APIServer

    CityView <-->|WSS subscribe<br/>building-events| WSChannel
    ModePanels <-->|WSS subscribe<br/>finding/refactor/sprint events| WSChannel

    Dashboard <-->|REST GET<br/>aggregated metrics| APIServer
```

## Backend API components

```mermaid
flowchart TB
    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8,stroke-width:2px
    classDef container fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:2px
    classDef external fill:#999,color:#fff,stroke:#666,stroke-width:2px
    classDef database fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:2px

    subgraph API["Backend API Container"]
        AuthService["Auth Service<br/>(Component)<br/><br/>Hades scaffold<br/>GitHub OAuth flow<br/>state CSRF + PKCE +<br/>scope minimization +<br/>session management"]:::component

        WebhookReceiver["Webhook Receiver<br/>(Component)<br/><br/>Hades scaffold<br/>HMAC X-Hub-Signature-256<br/>verify per request<br/>+ event router PR/issue<br/>+ event persist Demeter"]:::component

        ParserService["Parser Service<br/>(Component)<br/><br/>Hades scaffold<br/>tree-sitter 11-grammar<br/>lazy-load<br/>+ ParsedRepo/ParsedFile/<br/>ParsedSymbol API<br/>+ cold start &lt; 300ms"]:::component

        DetectorService["Detector Service<br/>(Component)<br/><br/>Nemesis 11 detector:<br/>5 Apollo (secrets/deps/<br/>auth/SQL/complexity) +<br/>Argus CVSS scoring +<br/>5 spec-drift A-E"]:::component

        RefactorService["Refactor Service<br/>(Component)<br/><br/>Pandora<br/>Athena proposal author +<br/>simulation engine multi-turn<br/>(test_gen V4-Pro think,<br/>impl_gen V4-Pro think,<br/>diff_serialize V4-Flash)<br/>+ drafts/ isolation<br/>+ dual review gate backend"]:::component

        OpenSpecAdapter["OpenSpec Adapter<br/>(Component)<br/><br/>Demeter<br/>subprocess invoke<br/>openspec list specs --json<br/>+ validate change<br/>+ show change --diff<br/>+ archive on Accept<br/>+ Folder A primary<br/>+ Folder B internal"]:::component

        EventStore["Event Store Service<br/>(Component)<br/><br/>Demeter<br/>Alembic migrations +<br/>pr_events + finding_events +<br/>drift_log + simulation_events +<br/>llm_call_log + materialized<br/>views cycle_time + lead_time +<br/>ownership_distribution"]:::component

        IssueAdapter["Issue Adapter<br/>(Component)<br/><br/>Demeter<br/>1-click GitHub issue<br/>POST /api/findings/<br/>{id}/to-issue<br/>+ pre-filled evidence chain +<br/>suggested label<br/>+ Hybrid Layer 1"]:::component
    end

    LLMGateway["LLM Gateway<br/>(Container)"]:::container
    DraftsFS["drafts/ Sandbox<br/>(Container)"]:::container
    Postgres[("PostgreSQL")]:::database
    GitHub["GitHub.com"]:::external

    AuthService -->|OAuth code exchange| GitHub
    AuthService -->|persist user| EventStore
    WebhookReceiver -->|persist event| EventStore
    WebhookReceiver -->|push real-time<br/>building-events| Postgres
    ParserService -->|cached output| EventStore

    DetectorService -->|consume ParsedRepo| ParserService
    DetectorService -->|persist FindingPersist/<br/>DriftEventPersist| EventStore
    DetectorService -->|enrich CVSS via Argus| LLMGateway

    RefactorService -->|consume ParsedRepo| ParserService
    RefactorService -->|generate via Athena/<br/>multi-turn V4-Pro| LLMGateway
    RefactorService -->|write diff| DraftsFS
    RefactorService -->|persist ProposalPersist/<br/>SimulationEventPersist/<br/>LLMCallLog| EventStore

    OpenSpecAdapter -->|change folder author| RefactorService
    OpenSpecAdapter -->|drift check feedback| DetectorService

    IssueAdapter -->|POST /repos/.../issues| GitHub
    IssueAdapter -->|persist Issue link to Finding| EventStore

    EventStore <-->|asyncpg pool<br/>SQLAlchemy 2.0 async| Postgres
```

## LLM Gateway components (Triton defensive layer)

```mermaid
flowchart TB
    classDef component fill:#85BBF0,color:#000,stroke:#5D82A8,stroke-width:2px
    classDef external fill:#999,color:#fff,stroke:#666,stroke-width:2px
    classDef database fill:#438DD5,color:#fff,stroke:#2E6295,stroke-width:2px

    subgraph LLMG["LLM Gateway Container (Triton)"]
        Router["Per-Resident Router<br/>(Component)<br/><br/>Athena V4-Pro think high<br/>Apollo V4-Flash non-think<br/>Argus V4-Flash think low<br/>Clio V4-Flash non-think<br/>Hermes V4-Flash non-think"]:::component

        SemanticCache["Semantic Cache<br/>(Component)<br/><br/>cosine 0.85 threshold<br/>+ embedding via DeepSeek<br/>+ Postgres pgvector"]:::component

        CannedCache["Canned Response Cache<br/>(Component)<br/><br/>Top-10 demo questions<br/>pre-cached<br/>+ latency &lt; 100ms<br/>+ in-memory dict"]:::component

        RetryLayer["Retry Layer<br/>(Component)<br/><br/>Simplified prompt on 429 +<br/>Exponential backoff 1s/2s/4s +<br/>Max 3 retry"]:::component

        FallbackLayer["Fallback Layer<br/>(Component)<br/><br/>Fallback V4-Pro to V4-Flash<br/>(NOT vice versa)<br/>on V4-Pro 500 / timeout"]:::component

        CircuitBreaker["Circuit Breaker<br/>(Component)<br/><br/>5-fail trigger +<br/>60s cooldown +<br/>fallback canned/static<br/>during open state"]:::component

        ThinkingToggle["Thinking-Mode Toggle<br/>(Component)<br/><br/>extra_body={thinking: enabled}<br/>+ reasoning_effort low/medium/high<br/>+ NEVER replay reasoning_content<br/>multi-turn anti-pattern"]:::component
    end

    APIServer["Backend API<br/>(Container)"]
    DeepSeek["DeepSeek V4 API"]:::external
    Postgres[("PostgreSQL +<br/>pgvector embeddings")]:::database

    APIServer -->|"resident query<br/>(athena/apollo/argus/clio/hermes)"| Router
    Router -->|cache lookup first| SemanticCache
    Router -->|known top-10 question| CannedCache
    SemanticCache <-->|embedding store + cosine search| Postgres
    Router -->|miss cache, send to DeepSeek| ThinkingToggle
    ThinkingToggle -->|"chat/completions<br/>extra_body params"| DeepSeek
    ThinkingToggle -->|on retry-eligible error| RetryLayer
    RetryLayer -->|on max-retry exhausted| FallbackLayer
    FallbackLayer -->|on still-failing| CircuitBreaker
    CircuitBreaker -.->|open state alt| CannedCache
```

## Component summary table

### Frontend SPA components

| Component | Owner (worker) | Wave | Source contract |
|---|---|---|---|
| 3D City View | Daedalus (scaffold) + Iris (geometry) | 1 | daedalus-to-iris.md |
| 5 Product Mode UI Panels | Hera (Sprint) + Asclepius (Health+Refactor) + Boreas (Onboarding+Activity) | 2 | iris-to-hera.md + hera-to-persephone.md + asclepius-to-pandora.md + boreas-to-triton.md |
| AI Residents Chat Panel | Persephone | 2 | persephone-to-triton.md + calliope-to-wave2-panels.md |
| Ticket Panel | Persephone | 2 | hera-to-persephone.md + selene-to-persephone.md |
| Side Panel (3 variants) | Persephone | 2 | asclepius-to-pandora.md + asclepius-to-triton.md |
| Dashboard 2D View | Selene | 1 | claude-design-bundle-to-selene.md + selene-to-demeter.md |
| Landing Page | Calliope | 1 | claude-design-bundle-to-calliope.md |
| Entry Page | Hestia | 1 | claude-design-bundle-to-hestia.md + hestia-to-hades.md |

### Backend API components

| Component | Owner (worker) | Wave | Source contract |
|---|---|---|---|
| Auth Service | Hades | 3 | hestia-to-hades.md |
| Webhook Receiver | Hades | 3 | hera-to-hades.md |
| Parser Service | Hades | 3 | hades-to-nemesis.md + hades-to-pandora.md |
| Detector Service | Nemesis | 3 | hades-to-nemesis.md + triton-to-nemesis.md + nemesis-to-demeter.md + nemesis-to-asclepius.md |
| Refactor Service | Pandora | 3 | hades-to-pandora.md + triton-to-pandora.md + pandora-to-demeter.md + pandora-to-asclepius.md |
| OpenSpec Adapter | Demeter | 3 | (subprocess wrapper, no contract) |
| Event Store Service | Demeter | 3 | hades-to-demeter.md + nemesis-to-demeter.md + pandora-to-demeter.md + selene-to-demeter.md + boreas-to-demeter.md + demeter-to-selene.md + demeter-to-boreas.md |
| Issue Adapter | Demeter (Hybrid Layer 1) | 3 | nemesis-to-demeter.md (FindingPersist) |

### LLM Gateway components (Triton)

| Component | Owner (worker) | Wave | Source contract |
|---|---|---|---|
| Per-Resident Router | Triton | 3 | triton-to-residents.md + triton-to-nemesis.md + triton-to-pandora.md |
| Semantic Cache | Triton | 3 | (internal to LLM gateway, no cross-worker contract) |
| Canned Response Cache | Triton | 3 | (internal, top-10 demo question lookup) |
| Retry Layer | Triton | 3 | (internal) |
| Fallback Layer | Triton | 3 | (internal) |
| Circuit Breaker | Triton | 3 | (internal) |
| Thinking-Mode Toggle | Triton | 3 | triton-to-residents.md (per-resident toggle config) |

## Key behavior

### Drop-first feature flag order (per Phase B H1)

If 60fps regress on M-series MBP 16GB + 200-300 building:
1. `ENABLE_DOF=false` (DepthOfField post-processing)
2. Pixel ratio 2.0 to 1.5
3. `ENABLE_SPARKLES_TIER_3=false`
4. `ENABLE_THIRD_DIRECTIONAL_LIGHT=false`

Daedalus listener: `state.performance.regress()` on `OrbitControls.onChange`.

### drafts/ isolation (AD-19 LOCKED)

```
User intent (chat) -> Athena V4-Pro think high -> proposal.md/design.md/tasks.md authored in openspec/changes/<change-name>/
   |
   v
Pandora simulation engine multi-turn:
   Turn 1 (test_gen V4-Pro think high)
   Turn 2 (impl_gen V4-Pro think high)  
   Turn 3 (diff_serialize V4-Flash non-think)
   |
   v
Write to drafts/<simulation-id>/ ONLY  
(production code NEVER touched per AD-19 LOCKED safety property)
   |
   v
Asclepius ghost-to-solid animation (frontend visual)
   |
   v
User Accept (dual review gate UI) -> create real diff via GitHub PR / patch
       OR
       Discard -> drafts/<simulation-id>/ deleted, no production change
```

### Per-resident routing (Triton)

```
Resident query -> Router determines model + thinking-mode:
   Athena -> V4-Pro thinking_high  (Refactor proposal author)
   Apollo -> V4-Flash non-thinking  (Health narration)
   Argus -> V4-Flash thinking_low  (Security CVSS scoring)
   Clio -> V4-Flash non-thinking  (Git/spec-drift narration)
   Hermes -> V4-Flash non-thinking  (Tour script)

   Refactor sim multi-turn -> V4-Pro thinking_high (Turn 1-2) + V4-Flash (Turn 3 diff serialize)
   Defensive layer applied at every call:
       semantic cache (cosine 0.85 hit) -> early return
       canned response (top-10 match) -> early return < 100ms
       call DeepSeek with thinking-mode toggle
       on error: retry simplified -> fallback V4-Flash -> circuit breaker -> canned
```

## Cross-references

- PRD Section 9 Functional Requirements per Mode
- PRD Section 18 DeepSeek V4 Integration (Section 18.3 model selection strategy)
- `_meta/contracts/_master_index.md` (per-component handoff schemas)
- `_meta/roster.md` (worker domain ownership)
- C4-Container.md (Level 2 parent containers)
- C4-Context.md (Level 1 system boundary)

---

**Diagram authored**: 2026-05-12 17:00 WIB by Themis Wave 0
**SVG export**: `docs/c4/C4-Component.svg`
**Mirror in PanitSubmission/**: `PanitSubmission/c4/C4-Component.{md,svg}`
