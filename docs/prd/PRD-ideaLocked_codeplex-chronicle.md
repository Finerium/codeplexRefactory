# PRD-ideaLocked: Codeplex Chronicle

**Project**: Codeplex Chronicle
**Tagline**: YOUR CODEBASE, ALIVE
**Team**: Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Event**: Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026
**Theme**: Engineering Productivity x AI
**Domain (pre-provisioned)**: https://duopoly.hackathon.sev-2.com
**Repository**: github.com/Finerium/codeplexRefactory (Wave 0 init by Claude Code)

**Document version**: PRD-ideaLocked v1.0 (DRAFT, awaiting Phase F.3 lock confirmation)
**Authored by**: V1 Council (hari-H session, 12 May 2026)
**Locked by**: [pending Ghaisan eksplisit "PRD locked" confirmation]
**Source mode**: Mode B (refine existing locked idea, Phase B-C-E persona deliberation skipped per idea-draft Section A mandate, deliberation summary already in Section R of idea-draft)
**Source document**: `idea-draft_codeplex-chronicle.md` v1.0 (Ghaisan + Hafiz pre-event 9-10 May 2026, 8+ rounds brainstorming + 1 round deep research)
**Downstream consumption**: Metis (agentic structure) -> Designer-v1 (3 UI prompts) -> Orches-v1 (Wave 0-3 execution) -> Pan (universal worker)

---

## Table of Contents

1. [Project Identity & Type Lock](#1-project-identity--type-lock)
2. [Executive Summary](#2-executive-summary)
3. [Problem Statement](#3-problem-statement)
4. [Goals & Objectives](#4-goals--objectives)
5. [Target Users & Personas](#5-target-users--personas)
6. [User Stories](#6-user-stories)
7. [Solution Scope (In / Out / Stretch)](#7-solution-scope-in--out--stretch)
8. [Architecture Overview + C4 Hint](#8-architecture-overview--c4-hint)
9. [Functional Requirements per Product Mode](#9-functional-requirements-per-product-mode)
10. [AI Residents Specifications](#10-ai-residents-specifications)
11. [Spec-Drift Detection](#11-spec-drift-detection)
12. [Hybrid Write Strategy + Drop Protocol](#12-hybrid-write-strategy--drop-protocol)
13. [Visual Quality Bar + Performance Budget](#13-visual-quality-bar--performance-budget)
14. [Demo Dataset + Day-0 Prep](#14-demo-dataset--day-0-prep)
15. [Demo Flow + Pitch Script](#15-demo-flow--pitch-script)
16. [Q&A Defense Cards](#16-qa-defense-cards)
17. [Tech Stack (Locked)](#17-tech-stack-locked)
18. [AI Provider Integration: DeepSeek V4](#18-ai-provider-integration-deepseek-v4)
19. [Security Analysis](#19-security-analysis)
20. [Non-Functional Requirements](#20-non-functional-requirements)
21. [Acceptance Criteria per Feature](#21-acceptance-criteria-per-feature)
22. [Success Criteria + KPIs](#22-success-criteria--kpis)
23. [Risk Register](#23-risk-register)
24. [Constraints + Dependencies](#24-constraints--dependencies)
25. [Open Questions](#25-open-questions)
26. [Workflow + Downstream Handoff](#26-workflow--downstream-handoff)
27. [Glossary](#27-glossary)
28. [Appendix A: Decision Log](#28-appendix-a-decision-log)
29. [Appendix B: Research Findings Summary](#29-appendix-b-research-findings-summary)

---

## 1. Project Identity & Type Lock

| Field | Value |
|---|---|
| **Name** | Codeplex Chronicle |
| **Type [MANDATORY LOCK, Phase F.1]** | **hackathon** (24-hour build, Refactory Round 03 Telkom) |
| **Domain** | AI-resident development environment (engineering productivity + code visualization + spec-driven refactor) |
| **Timeline target** | 24-jam build window (12 Mei 13:00 WIB - 13 Mei 11:00 WIB), submission window 13 Mei 11:00-13:00 WIB, pitch window 13 Mei 15:00-17:00 WIB (kalau top 5) |
| **Audience** | Engineer + Engineering Manager (product); Refactory Hackathon judges (Round 03 evaluation lens) |
| **Pre-provisioned domain** | https://duopoly.hackathon.sev-2.com |
| **K8s namespace** | `duopoly` (Refactory managed, kubeconfig di team folder hari-H) |
| **Database** | PostgreSQL pre-provisioned by Refactory (credentials di team folder hari-H) |
| **Repository (Day-0 init)** | github.com/Finerium/codeplexRefactory |

**Type lock rationale**: idea-draft Section A + S eksplisit mandate hackathon type, 24-jam build, hands-off operator mode. Council Phase F.1 ga re-triage, type sourced dari idea-draft canonical. Hackathon type drives downstream defaults di Metis + Orches-v1: ship-now bar over sustainable quality bar, scope cut authority aggressive (drop protocol Section J idea-draft), audit depth per-wave (Eunomia/Dike/Aletheia) bukan continuous.

**Type-driven defaults**:
- Capacity gate: 24-jam hard ceiling
- Audit depth: per-wave (Wave 0-3 each end)
- Ship criteria: demo flow E2E + deployed + 3x consecutive successful trial run
- Cut scope authority: V1 Orch + Metis aggressive (drop protocol Section 12)
- Effort tier per worker: Metis decide per cycle (per idea-draft Section C worker design philosophy = pintar multi-task per worker)

---

## 2. Executive Summary

Codeplex Chronicle adalah **AI-resident development environment** yang mentransformasi real production codebases jadi kota 3D yang hidup. Files become buildings, folders become districts, errors become earthquakes you can feel. 5 specialized AI residents (Athena, Apollo, Argus, Clio, Hermes) tinggal di iconic landmark buildings dan melayani 5 product modes komplementari: Onboarding, Sprint (hero), Refactor, Activity, Health.

Kota BUKAN value proposition. Kota = **interface plus memory hook** yang spatial encoding bandwidth-nya lebih tinggi dari flat list (Jira/Linear) atau static graph (CodeCity/Sourcetrail). Value real ada di 5 product modes yang menyelesaikan engineering productivity pain real:

1. **Onboarding** untuk engineer baru join codebase (target: peta mental kebentuk 30 menit, BUKAN 2 minggu)
2. **Sprint (HERO)** untuk agile workflow spatial dengan PR-to-Building auto-sync real-time webhook
3. **Refactor (SAFETY-FIRST)** untuk spec-driven refactor exploration di sandbox `drafts/` folder dengan dual review gate sebelum production landing
4. **Activity** untuk git-backed engineering intelligence dengan ownership heatmap + hotspot tracking
5. **Health** untuk code diagnostic dengan 5 deterministic detector + hybrid write 1-click GitHub issue creation

**Differentiator 3-angle**:

> *"Other tools tell you what is in your code. Codeplex Chronicle tells you what your code promised vs what it actually delivered."* (philosophical)

> *"Flat ticket lists don't show where work lives. Static code maps don't show what's planned. Codeplex Chronicle is one map of cities: your codebase, your sprint, and the gap between what you planned and what you shipped."* (concrete)

> *"AI yang ngarang itu mahal. Refactor yang salah bisa break production. Codeplex Chronicle ngasih AI ruang untuk eksplorasi tanpa risiko: tiap proposal Athena dan tiap eksekusi refactor jalan di drafts/, BUKAN production code lu. Lu lihat blast radius lengkap dengan visual ghost-to-solid, lu baca diff dengan tenang, lu accept atau lu discard. Production code lu cuma berubah saat lu yang decide."* (closing punchline, defensibility tinggi di Q&A)

**Tech foundation**: Next.js 16 + React 19 + Three.js 0.184 + @react-three/fiber 9.6 frontend, Python 3.12 + FastAPI + tree-sitter (11 language grammar) backend, DeepSeek V4 (Flash primary + Pro fallback) sebagai LLM provider, OpenSpec (Fission-AI) sebagai spec layer dengan dual-folder strategy (Folder A panitia-facing, Folder B internal workflow), Kubernetes pre-provisioned by Refactory di namespace `duopoly`, PostgreSQL event store + cache.

**Operational mode**: hands-off. Ghaisan + Hafiz operator only (relay handoff + decision approval + ferry knowledge), Claude Code handle semua eksekusi termasuk K8s deploy + slide deck.

---

## 3. Problem Statement

### 3.1. Pain Points (Validated)

**Pain 1: Engineer onboarding takes 2+ weeks**

Engineer baru join codebase 100K LOC harus baca README, buka VSCode, navigate 200+ file tanpa peta mental. Tools yang ada (GitHub repo browser, IDE tree view, static code maps seperti CodeCity/Sourcetrail) flat dan ga ngasih context aktif: siapa yang own apa, dimana hotspot recent activity, file mana yang biasanya engineer baru sentuh first.

**Pain 2: Manager context-switch across 3+ tools**

Manager engineering harus pindah antara GitHub (PR + issue), Jira/Linear (sprint board + velocity), dashboard custom (analytics + burndown), wiki/Notion (spec + decision log). Tiap tools punya state model sendiri, sync manual, dan ga ada spatial anchor yang nge-connect "kerjaan di mana" dengan "code di mana".

**Pain 3: Refactor proposal lacks blast radius visibility**

Engineer propose refactor lewat plain text di PR description atau Jira ticket. Reviewer harus mental-simulate dampak: file mana yang affected, dependency graph yang break, test coverage yang gap. Tools yang ada (LLM code assistant seperti Cursor/Copilot Edit) langsung tulis ke production code atau branch tanpa visual review gate, blast radius cuma kelihatan setelah diff udah ada.

**Pain 4: Spec-implementation drift invisible**

Sprint goal didefinisikan di Milestone/issue, implementation jalan di branch, tapi gap antara apa yang spec-kan vs apa yang ship-kan ga ada tracking visual. Issue closed 6 bulan lalu tapi file masih di-edit, OpenSpec change folder archived tapi commit bypass hook, ini semua silent drift yang baru ketahuan saat audit manual.

### 3.2. Why Now

- **OpenSpec mature**: Fission-AI/OpenSpec v1.0 stable shipped pre-May 2026 (~46.1k stars), spec-driven development jadi viable methodology yang panitia Refactory pun mandate
- **r3f + Three.js performance ceiling**: r3f@9 + Three.js 0.184 dengan InstancedMesh + LOD + frustum culling = feasible render 200-500 building dengan 60fps di M-series demo laptop
- **LLM cheap + fast for narration**: DeepSeek V4-Flash $0.14/$0.28 per 1M token, OpenAI ChatCompletions API compatible, multi-turn coordination viable untuk Refactor Mode simulation
- **GitHub Issues + Milestones as backbone**: tim engineering modern udah de facto pakai GitHub workflow, no parallel ticket database needed

### 3.3. Pain Validation Status

| Pain | Validation Source | Confidence |
|---|---|---|
| Onboarding 2+ weeks | Industry standard (Stripe, Linear engineering blogs cite), Ghaisan + Hafiz personal experience POLBAN | high |
| Manager context-switch | Hafiz industry observation (PR comment surfacing feature dari Hafiz feedback), past Refactory winner pattern (DevEx tooling) | high |
| Refactor blast radius | Argus + Prometheus persona pre-event deliberation, defensibility 3-angle pitch hinge here | high |
| Spec-implementation drift | OpenSpec community discussion (idea-draft Section R), differentiator philosophical angle | medium (deterministic detector validates 5 patterns, broader claim "drift is real industry pain" semi-validated) |

---

## 4. Goals & Objectives

### 4.1. Primary Goals (Refactory Minimum: Goals)

**G1. Ship a functional, deployed product** yang real user (juri) bisa run end-to-end dalam 24 jam dengan 5 product modes operational dan demo flow stable (3x consecutive successful trial run).

**G2. Demonstrate spatial PM workspace** dengan Sprint Mode hero showcasing PR-to-Building auto-sync real-time, 14 PM concept visual mapping, dan dual view (City + Dashboard) untuk engineer + manager audience.

**G3. Demonstrate safety-first AI refactor** dengan Refactor Mode showing real Gemini-equivalent multi-turn coordination (DeepSeek V4 Flash + Pro) executing simulation write ke `drafts/` folder dengan dual review gate sebelum production landing.

**G4. Demonstrate spec-drift detection** dengan 5 deterministic retak patterns (A-E) + Clio LLM narrator sebagai storyteller (BUKAN judge), grounded di metadata git + OpenSpec.

**G5. Visual quality bar Awwwards-nominee tier** sebagai memory hook yang juri inget setelah pitch: NYC/Dubai-tier verticality + iconic landmark architecture per resident + cinematic intro + post-processing pipeline.

### 4.2. Secondary Objectives

**S1. Establish defensibility di Q&A** dengan 3-angle pitch (philosophical + concrete + safety) + prepared defense cards untuk 7-10 anticipated questions.

**S2. Showcase mandatory tech stack compliance** (OpenSpec + LLMs + K8s + PostgreSQL per Refactory rules) yang clean dan natural, BUKAN bolt-on.

**S3. Demonstrate Indonesian production code relevance** via closing slide bonus screenshot (tokopedia/gripmock + gojek/courier-android) signal cultural fit ke juri.

### 4.3. Non-Goals (Eksplisit Excluded)

- BUKAN replace Jira/Linear/GitHub. Codeplex Chronicle complement, piggyback GitHub Issues sebagai backbone.
- BUKAN autonomous AI coding agent. AI = narrator + navigator + summarizer + proposal author dengan sandbox execution. Production code change requires explicit user Accept.
- BUKAN full multi-tenant SaaS. MVP single-tenant OAuth session, multi-tenant deferred Phase 2.
- BUKAN scale-tested untuk 1M+ LOC. Demo target 200-300 building, theoretical scale 10K+ files untested.
- BUKAN local filesystem drag-drop. GitHub OAuth atau in-memory virtual FS only.

---

## 5. Target Users & Personas

### 5.1. Primary Persona A: Engineer Aldo

**Profile**:
- Full-stack engineer 2-4 tahun experience
- Tim 5-15 orang di startup/scale-up Indonesia (Tokopedia, Gojek, ruangguru, Sirclo, BukaWarung, Mekari, dst)
- Daily tools: VSCode + GitHub + Slack + Jira/Linear/Trello
- Pain: lost di codebase besar saat onboarding, harus context-switch antara IDE + ticket tool, refactor scary karena ga ada blast radius preview

**Use case primary**:
- Onboarding repo baru (Mode 1 Onboarding) -> Hermes 30-second tour
- Daily work di active sprint (Mode 2 Sprint) -> spatial workspace dengan scaffolding + crane + ticket overlay
- Propose refactor (Mode 3 Refactor) -> Athena ghost building + drafts/ simulation
- Daily standup (Mode 4 Activity) -> visualize 24h activity hotspot
- Code health monitoring (Mode 5 Health) -> Apollo findings + 1-click ticket

**Success indicator**: Aldo bisa explain mental model codebase dalam 30 menit setelah pakai Codeplex Chronicle, vs 2 minggu pakai approach lama.

### 5.2. Primary Persona B: Engineering Manager Budi

**Profile**:
- Engineering manager 5-10 tahun experience, lead 8-20 engineer
- Daily tools: GitHub web + Jira/Linear + custom dashboard + 1:1 meeting tools
- Pain: context-switch antar tools (velocity di Jira, code di GitHub, drift signal nowhere), butuh velocity report cepet + spatial anchor saat 1:1 dengan engineer

**Use case primary**:
- Default work di Dashboard View (flat 2D dengan velocity + burndown + milestone + contributor analytics + spec-drift summary + refactor proposal status + embedded city preview corner)
- Switch ke City View untuk spatial context saat 1:1 dengan engineer ("tunjukin gw distrik yang lu kerjain sprint ini")
- Sprint retrospective replay (Mode 4 Activity) -> 60-second flythrough kota dengan Clio narration perubahan sprint terakhir
- Velocity + cycle time + lead time observability via PostgreSQL event store

**Success indicator**: Budi bisa generate velocity + drift summary report dalam 1 menit, vs 15 menit pakai approach lama (manual aggregate dari 3 tools).

### 5.3. Secondary Persona: Refactory Hackathon Judge

**Profile**:
- Refactory mentor/judge dari industry Indonesia atau Refactory bootcamp alumni
- Past judging pattern: substansi-first engineering productivity tooling (Round 01 UGM LUNARIS, Round 02 UNAIR Effix.ai, UKDW Vibecode), bukan flashy 3D demo standalone
- Evaluation lens: Innovation & Creativity + Impact & Relevance + Technical Execution + UX & Design + Presentation & Communication

**Use case primary**:
- Run product themselves di laptop demo (per Refactory rule "judges will use your product, not just watch a slide deck")
- Walk-through 5 modes via prepared pitch flow 2 menit
- Q&A 8 menit dengan defense cards prepared untuk anticipated questions (scale, security, AI hallucination, 3D vs 2D, compete vs Jira, OpenSpec, API down fallback)

**Evaluation lens fit**:
| Refactory criterion | Codeplex Chronicle angle |
|---|---|
| Innovation & Creativity | 3D city + spec-drift detection + dual view + dual-folder OpenSpec strategy (panitia request) |
| Impact & Relevance | 5 real engineering productivity pain solved, Indonesian production code relevance via closing bonus slide |
| Technical Execution | OpenSpec first-class + K8s deploy + tree-sitter 11 language + DeepSeek V4 multi-turn + r3f 60fps |
| UX & Design | Awwwards-tier landing + cinematic intro + iconic landmark + dual view + glassmorphism |
| Presentation & Communication | 3-angle pitch flexibility + prepared Q&A defense cards + bahasa Indonesian primary dengan English code-switch natural |

---

## 6. User Stories

### 6.1. Engineer Aldo Stories (Mode-organized)

**Onboarding Mode**:
- **US-01**: Sebagai engineer baru, gw mau dapet 30-second tour codebase sehingga gw paham 3 distrik kunci yang akan gw sentuh paling sering plus owner contact-nya
- **US-02**: Sebagai engineer baru, gw mau click building tertentu dan baca detail (contributor, recent commits, linked issue, open PR status, file metadata) sehingga gw paham context tanpa harus pindah ke GitHub
- **US-03**: Sebagai engineer baru, gw mau scoped tour untuk specific sprint goal sehingga onboarding gw target ke kerjaan riil bukan generic

**Sprint Mode (HERO)**:
- **US-04**: Sebagai engineer, gw mau lihat active sprint scope di-overlay di kota sehingga gw paham dimana kerjaan jalan sekarang tanpa harus pindah Jira
- **US-05**: Sebagai engineer, gw mau click gedung dengan scaffolding dan dapet ticket panel detail (assignee, story points, linked PR, status) sehingga gw skip context-switch
- **US-06**: Sebagai engineer, gw mau PR comment unresolved visible sebagai sticky note di gedung sehingga gw langsung lihat bottleneck tanpa harus polling GitHub PR page
- **US-07**: Sebagai engineer, gw mau real-time PR-to-Building sync (< 5 detik latency) lewat webhook sehingga state PR (opened/reviewed/merged) propagate visual langsung

**Refactor Mode**:
- **US-08**: Sebagai engineer, gw mau type intent plain language ("add 2FA to login") dan Athena propose ghost building + auto-generate OpenSpec change folder sehingga proposal punya structured spec, BUKAN cuma deskripsi PR
- **US-09**: Sebagai engineer, gw mau review proposal di side panel dan click "Run Simulation" sehingga eksekusi jalan di drafts/ BUKAN langsung apply ke production
- **US-10**: Sebagai engineer, gw mau lihat ghost-to-solid animation real-time saat simulation jalan sehingga gw paham progress bukan progress bar generik
- **US-11**: Sebagai engineer, gw mau dapet 2 button (Accept changes / Done viewing simulation) setelah simulation selesai sehingga gw control kapan production code beneran berubah

**Activity Mode**:
- **US-12**: Sebagai engineer, gw mau lihat ownership concentration per distrik via heatmap warna sehingga gw paham siapa expert distrik mana saat butuh review
- **US-13**: Sebagai engineer, gw mau scrub timeline 30/60/90 days dan lihat hotspot perubahan glow lebih intens sehingga gw paham trend recent activity

**Health Mode**:
- **US-14**: Sebagai engineer, gw mau lihat building dengan critical finding glow merah (Apollo detect hardcoded secret / outdated dep / missing auth / unsafe SQL / complex untested) sehingga tech debt jadi spatial-visible
- **US-15**: Sebagai engineer, gw mau click finding dan dapet evidence panel (file path, line number, static analysis output, suggested mitigation) sehingga gw skip manual investigation
- **US-16**: Sebagai engineer, gw mau 1-click "Convert to Backlog Ticket" yang create GitHub issue dengan evidence chain pre-filled sehingga tech debt jadi actionable backlog item

### 6.2. Engineering Manager Budi Stories

- **US-17**: Sebagai manager, gw mau Dashboard View default dengan velocity + burndown + milestone progress + contributor analytics sehingga gw skip context-switch antar tools
- **US-18**: Sebagai manager, gw mau switch ke City View saat 1:1 engineer sehingga gw bisa narate spatial context ("tunjukin gw distrik payment yang lu kerjain")
- **US-19**: Sebagai manager, gw mau sprint retrospective 60-second flythrough dengan Clio narration sehingga retro meeting lebih engaging dari slide flat
- **US-20**: Sebagai manager, gw mau spec-drift summary per pattern (A-E) sehingga gw paham health spec-implementation gap di sprint sebelum jadi tech debt besar

### 6.3. Refactory Judge Stories (Pitch lens)

- **US-21**: Sebagai juri, gw mau run product sendiri di laptop demo (BUKAN cuma watch slide) sehingga gw bisa evaluate Technical Execution + UX dengan tangan sendiri
- **US-22**: Sebagai juri, gw mau lihat OpenSpec dual-folder strategy clear (Folder A panitia-facing dengan canonical layout, Folder B `.agent-openspec/` internal) sehingga gw bisa baca spec fitur pasca-hackathon tanpa noise
- **US-23**: Sebagai juri, gw mau dapet defense yang clear soal AI safety (Refactor Mode write ke drafts/, dual review gate, user explicit Accept) sehingga gw confident produk ga ngarang production code

---

## 7. Solution Scope (In / Out / Stretch)

### 7.1. In Scope (Locked for 24-jam Build)

**Frontend (Wave 1-2 visual-first sequencing)**:
- Next.js 16 App Router setup dengan TypeScript strict
- Three.js 0.184 + r3f@9 3D scene boilerplate (camera, lighting, fog, HDRI sunset environment, post-processing pipeline)
- Building geometry InstancedMesh dengan setMatrixAt imperative (200-300 building budget)
- District layout treemap deterministic (BUKAN force-directed)
- Living city visual baseline: glowing windows + hot file intensity + fog atmospheric + 3-tier Sparkles particles + camera idle drift cinematic
- Landing page Awwwards-tier (Designer-v1 Prompt 1 output)
- Application entry page (Designer-v1 Prompt 2 output, replace Claude template)
- Dashboard View flat 2D manager-facing (Designer-v1 Prompt 3 output)
- 5 product modes UI (Onboarding camera fly + Sprint scaffolding+crane+inspector+banner+ticket panel + Refactor ghost building + side panel + Activity heatmap + Health glow window + findings panel)
- AI residents chat panel UI (5 residents, click landmark or broadcast)
- "Build from scratch" entry option (in-memory virtual FS)
- Mode switcher top nav
- View toggle (City / Dashboard) top nav
- PR comment surfacing on building (Designer-v1 hari-H decide visual approach: sticky note 3D vs floating bubble vs marker pin + badge)

**Backend (Wave 3)**:
- Python 3.12+ + FastAPI async setup
- tree-sitter parsing dengan grammar mandatory: TypeScript/JavaScript, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift (11 language, lazy load per repo detected)
- GitHub OAuth flow real (scope: read:repo, read:org, read:issues, read:pull_requests, write:issues)
- GitHub webhook receiver dengan signature verification (events: PR opened/review_requested/approved/merged/closed, issue created/closed)
- 5 deterministic detector Apollo: hardcoded secrets (gitleaks pattern + entropy), outdated dependencies (OSV API CVE check), missing auth on protected routes (multi-language decorator/middleware parse), unsafe SQL patterns (raw concatenation detect multi-language), complex untested files (radon cyclomatic complexity + test coverage stub via import parse)
- Argus security triage dengan CVSS scoring + exploit pattern + suggested mitigation
- 5 spec-drift detector patterns A-E (pure deterministic, lihat Section 11)
- OpenSpec runtime integration: `openspec list --specs --json` for spec data, parse change folder for Athena proposal, `openspec validate <change-name>` for drift check, `openspec show <change-name> --diff` for diff visualization, `openspec archive` saat user Accept
- Refactor Mode simulation engine: DeepSeek V4 multi-turn coordination (test gen -> implementation gen -> diff serialization), output write ke `drafts/<simulation-id>/`
- 1-click GitHub issue creation endpoint (Hybrid Write Layer 1) dengan pre-filled evidence chain
- Refactor Mode `/opsx:apply` execution (Hybrid Write Layer 2) dengan `drafts/` sandbox isolation
- PostgreSQL event store (PR events, simulation events, finding events) untuk audit trail + cycle time/lead time derivation
- WebSocket real-time streaming untuk PR-to-Building sync + simulation progress

**Infrastructure (Wave 3)**:
- Docker image build + push to GitHub Container Registry (ghcr.io) atau Docker Hub
- K8s manifest deployment ke namespace `duopoly` (Refactory pre-provisioned)
- NGINX Ingress configuration (Refactory configured) untuk HTTPS termination domain `duopoly.hackathon.sev-2.com`
- PostgreSQL connection setup (Refactory pre-provisioned, credentials di team folder)
- Feature flag system runtime: `ENABLE_WRITE_OPS`, `ENABLE_WRITE_OPS_LAYER_2`, `ENABLE_DOF`, `ENABLE_SPARKLES_TIER_3`, `ENABLE_THIRD_DIRECTIONAL_LIGHT` (kill-switch for demo lag)
- Smoke test E2E

**Demo Dataset (Day-0 prep oleh Claude Code, 10-11 Mei)**:
- Fork OWASP/NodeGoat ke `duopoly/codeplex-demo-nodegoat` (hero Health Mode showcase, 5/5 OWASP detector fire authentic)
- Fork fastapi/full-stack-fastapi-template ke `duopoly/codeplex-demo-fastapi-fullstack` (secondary, mirror Codeplex Chronicle stack, OpenSpec init di repo ini)
- Fork OWASP/PyGoat ke `duopoly/codeplex-demo-pygoat` (fallback Python flavor)
- Populate agile data via GitHub API script (Milestones + issues + labels + size labels + linked PR + CODEOWNERS + reopened cycle untuk Pattern D + stale closed untuk Pattern A)
- Init OpenSpec di `codeplex-demo-fastapi-fullstack` repo dengan `core` profile + pre-fill `openspec/project.md` ~250 line + 2-3 archived change folder untuk Pattern E trigger
- Pre-render closing slide screenshot bonus: `tokopedia/gripmock` (Apache-2.0, Go ~50 files) + `gojek/courier-android`
- Cache tree-sitter parse output untuk semua 3 demo repo, save ke `/public/datasets/<repo-id>.json` untuk fast load

**Workflow Agentic (Build-time)**:
- Council (PRD authoring) -> Metis (AGENT_STRUCTURE.md agentic structure) -> Designer-v1 (3 UI prompts: Landing, Entry, Dashboard) -> Orches-v1 (Wave 0-3 execution) -> Pan (universal worker)
- Dual-folder OpenSpec: Folder A `openspec/` panitia-facing primary spec, Folder B `.agent-openspec/` internal workflow output
- Hands-off mode operator (Ghaisan + Hafiz relay handoff + decision approval + ferry knowledge)

**Submission Deliverable**:
- PRD comprehensive (this document, .md + .pdf)
- C4 diagram high-level (Claude Code agent generate, formal + detail + jelas, 4-tier Context-Container-Component-Code optional)
- Repository link github.com/Finerium/codeplexRefactory
- Slide presentation (Hafiz handle Day 2 jam 11-13 submission window)

### 7.2. Out of Scope (Eksplisit Excluded, Deferred Phase 2)

| Item | Reason cut |
|---|---|
| Local filesystem drag-drop (`File System Access API`) | Awkward permission flow di demo, dropped. Alternative: in-memory virtual FS "Build from scratch" |
| Multi-repo hierarchy 3-level (Country/Region + City + District + Building) | Phase 2. MVP Opsi A: one repo = one city dropdown switcher. 2-3 repo demo dataset pre-loaded |
| Drag ticket between milestones | Phase 2. MVP Sprint Mode passive read-only |
| Time Mode versi full (multi-year scrub dengan epoch detection) | Phase 2. MVP Activity Mode 30/60/90 day scrubber only |
| Iris resident (dedicated narrator) | DROPPED. Multi-mode narration distribute ke Clio (git/spec-drift/activity), Apollo (health), Athena (refactor) |
| Workspace persistence beyond browser session | Phase 2. MVP session-bound |
| Multi-tenant isolation beyond user OAuth session | Phase 2. MVP single-tenant |
| Custom domain configuration | Use pre-provisioned `duopoly.hackathon.sev-2.com` only |
| Self-hosted DeepSeek inference | Use hosted API only (V4-Flash + V4-Pro endpoints) |
| Gemini API integration | Pure shift to DeepSeek, no Gemini fallback |

### 7.3. Stretch Goals (Conditional on Wave 0 Capacity Assessment)

**Stretch Tier 1 (Mandatory if performance allow, per Eos lens push)**:
- Cinematic intro 5 detik first load (camera glide low altitude masuk city center, residents wake-up sequence)
- Verticality hero skyscraper (file >500 LOC pakai 2x current max height, custom tapered geometry + spire antenna emissive)
- Iconic landmark architecture per resident (Athena Greek temple, Apollo cross-shaped, Argus surveillance tower, Clio book stack vertical, Hermes glass beacon cube)
- Director Mode auto-fly through 5 highlights (pitch sendiri tanpa manual click, Wave 3 polish)

**Stretch Tier 2 (Welcomed kalau performance allow)**:
- Flying cars (`THREE.InstancedMesh` ~30 cars on path looping, color per microservice represent inter-district API call live)
- Window pattern variety hot/cold encoding (file aktif dense window + warm tint, idle sparse + cold blue tint)
- Earthquake error visual (tagline lock: *"errors become earthquakes you can feel"*, trigger condition TBD Wave 1 precise: Apollo critical finding cluster atau Pattern E spec-drift detect)
- Weather effects (thunder di active error rate spike, sunny healthy district, fog service degraded, snow service maintenance)

---

## 8. Architecture Overview + C4 Hint

Council kasih directional sketch high-level. **Full C4 diagram (4-tier: Context, Container, Component, optional Code) di-generate oleh Claude Code agent saat Wave 0 (output ke `docs/c4/`)**, formal + detail + jelas untuk panitia baca pasca-hackathon.

### 8.1. C1: System Context

```
                                    +-----------------------+
                                    |   GitHub.com          |
                                    |   (OAuth + API + Web) |
                                    +-----------+-----------+
                                                |
                                                | OAuth flow
                                                | Webhook events
                                                | API read/write
                                                |
   +--------+        +---------------------+    |
   | User   |------->| Codeplex Chronicle  |<---+
   | (Eng.+ |        | (Web SPA + API)     |
   |  Mgr.) |        |                     |
   +--------+        +-----+---------+-----+
                           |         |
                           |         | LLM API
                           |         |
                           v         v
                  +--------+--+   +--+----------+
                  | Postgres |   | DeepSeek    |
                  | (event   |   | V4 Flash    |
                  |  store)  |   | + V4 Pro    |
                  +----------+   +-------------+
```

External systems:
- **GitHub**: source of truth untuk repo, issues, milestones, PR, OAuth identity, webhook events
- **DeepSeek API** (`https://api.deepseek.com`): V4-Flash (primary, routing + narration + simple query) + V4-Pro (fallback, Refactor Mode multi-turn coordination yang butuh deep reasoning)
- **PostgreSQL** (Refactory pre-provisioned): event store + cache + ticket state aggregation untuk cycle time/lead time

### 8.2. C2: Container Diagram (High-Level)

| Container | Tech | Responsibility |
|---|---|---|
| **Frontend SPA** | Next.js 16 + React 19 + r3f@9 + Three.js 0.184 | 3D City View + Dashboard View dual + 5 mode UI + AI residents chat panel + landing/entry pages |
| **Backend API** | Python 3.12 + FastAPI + Uvicorn | OAuth flow, webhook receiver, GitHub API client, tree-sitter parser, 5 Apollo detectors, 5 spec-drift Argus detectors, Athena proposal author, Refactor Mode simulation engine |
| **LLM Client Layer** | OpenAI Python SDK (`openai>=1.x`) ke `https://api.deepseek.com` | DeepSeek V4-Flash + V4-Pro dengan thinking/non-thinking toggle, reasoning_effort, defensive code (retry + fallback Flash, semantic cache, canned response top 10 demo questions) |
| **Database** | PostgreSQL (Refactory managed) | Event store, cache layer, ticket state, parse cache |
| **OpenSpec Runtime** | OpenSpec CLI (Fission-AI, `core` profile) | Spec data via `--json`, change folder author by Athena, drift detection via `openspec validate` |
| **Ingress** | NGINX (Refactory configured) | HTTPS termination, route ke domain `duopoly.hackathon.sev-2.com` |
| **Container Orchestration** | Kubernetes (Refactory managed, namespace `duopoly`) | Pod deploy, scaling, secret mount |

### 8.3. Key Architectural Decisions (Made)

| # | Decision | Rationale |
|---|---|---|
| AD-01 | Monolith Next.js + FastAPI, NOT microservice | 24-jam build, monolith ship faster, microservice overhead unwarranted |
| AD-02 | Treemap deterministic layout untuk building, NOT force-directed | Force-directed berantakan di 3D, deterministic predictable + cacheable |
| AD-03 | Raw `<instancedMesh>` dengan `setMatrixAt()` untuk 200-300 building, NOT Drei `<Instances>` per-instance JSX | Drei slower per r3f issue #3306, raw faster |
| AD-04 | OpenSpec dual-folder strategy (Folder A panitia-facing + Folder B `.agent-openspec/` internal) | Panitia request eksplisit pre-event, prevent noise di canonical spec |
| AD-05 | Visual frontend-first wave sequencing (Wave 1-2 visual full, Wave 3 backend full), BUKAN paralel | Visual quality bar = differentiator yang susah revisi belakangan, backend pattern relatif standar |
| AD-06 | DeepSeek V4-Flash primary + V4-Pro fallback untuk complex reasoning, NOT Gemini | Pure DeepSeek shift per Ghaisan + Hafiz Day-0 decision, $5 budget Hafiz subscribe, OpenAI-compat API |
| AD-07 | GitHub Issues sebagai backbone ticket (BUKAN custom DB) + Sprint = Milestone + Story = Issue dengan label + PR = native | Ticket lives where work lives, OAuth gratis, no parallel sync |
| AD-08 | Refactor Mode write ke `drafts/<simulation-id>/` folder (BUKAN production), dual review gate | Safety-first AI compliance, defensibility tinggi di Q&A |
| AD-09 | 5 deterministic detector untuk Health (BUKAN AI-driven detection) | Grounded di static analysis output, AI sebagai narrator BUKAN judge, filosofi compliance |
| AD-10 | tree-sitter Python binding dengan 11 language grammar lazy-load | Multi-language requirement, lazy-load prevent cold start bloat |

### 8.4. Key Decisions Deferred (V1 Orch Handle in Wave 0)

| # | Decision | Defer reason |
|---|---|---|
| DD-01 | Background task: FastAPI BackgroundTasks vs Celery | Decide saat backend implementation Wave 3, depend on async complexity |
| DD-02 | Charts library: Recharts vs Chart.js | Designer-v1 decide hari-H based on Prompt 3 Dashboard output fit |
| DD-03 | Specific UI library (shadcn vs Mantine vs custom) | Designer-v1 decide via claude.ai/design output |
| DD-04 | CI/CD: GitHub Actions vs manual `kubectl apply` | Wave 3 decide based on time budget |
| DD-05 | PR comment surfacing visual approach (sticky note 3D vs floating bubble vs marker pin + badge) | Designer-v1 decide hari-H based on Wave 1-2 visual baseline |
| DD-06 | Earthquake error visual trigger condition precise definition | Wave 1 spec saat detector output integration |

---

## 9. Functional Requirements per Product Mode

### 9.1. FR-Mode-1: Onboarding Mode

**Hero use case**: new hire scenario, peta mental codebase kebentuk dalam 30 menit.

**Flow**:
1. Engineer baru join repo, klik Hermes (Tourist Info building, cube glass beacon)
2. Type intent `"give me a 30-second tour"`
3. Camera fly otomatis lewat top-3 distrik kunci (deterministic pick by ownership concentration + recent activity)
4. Gedung penting glow saat dilewati
5. Hermes narate via text di chat panel
6. Ending summary: starting point file + owner contact

**4 Hermes tour variant**:
- `"Give me 30-second tour"` (new hire generic)
- `"Tour for sprint goal X"` (Hermes baca sprint goal dari Milestone description)
- `"Tour for feature Y"` (Hermes follow dependency graph dari entry point feature)
- `"Tour as @username"` (cross-onboarding, distrik yang user X own/frequent contribute)

**Optional extension**: combine dengan Sprint Mode untuk goal-aware tour, atau Activity Mode untuk historical context.

**Outcome promise**: 30-menit mental map vs 2-minggu baseline.

### 9.2. FR-Mode-2: Sprint Mode (HERO)

**Hero use case**: agile workflow + ticket overlay + spatial PM workspace + dual audience.

**14 PM Concept Visual Mapping** (toggle-able overlay layer, filterable by status):

| Konsep Agile / PM | Visual di Codeplex Chronicle |
|---|---|
| Story / Task aktif | Scaffolding mengelilingi gedung |
| Open PR di file | Crane animasi naik turun saat review berjalan |
| Story di backlog | Blueprint pin floating di atas slot kosong / district |
| Story Done sprint ini | Gedung dengan glow hijau muda (transient 24 jam) |
| Story Blocked | Yellow tape + warning icon di gedung |
| Bug / open issue type=bug | Asap atau retak visual di gedung |
| Story Points (estimasi) | Size badge di scaffolding (S/M/L/XL via labels) |
| Sprint Goal | Banner besar di City Hall (Athena's building) |
| Epic | District yang di-highlight border-nya, flag epic di tengah |
| Definition of Done | Checklist floating di atas building under construction |
| Code Review (PR open) | Inspector NPC orbit gedung sampai approved |
| Dependency / Blocks | Red glowing bridge antar gedung (vs normal road = import) |
| Refactor proposal (Athena) | Ghost building transparent dengan animated dashed outline |
| Spec drift | Retak visual di gedung dengan crack pattern per pattern A-E |

**PR Comment Surfacing on Building** (NEW feature, dari Hafiz industry feedback):
- Comment di line of code visible sebagai annotation pada gedung
- PR pending dengan unresolved comment dapat visual indicator (sticky note + badge angka comment unread)
- Visual approach final di-decide oleh Designer-v1 hari-H (3 candidate: sticky note 3D, floating speech bubble, marker pin + badge)
- Use case real: PR pending blocked by comment = common bottleneck workflow engineering

**Click Building -> Ticket Panel**:
- Assignee (avatar + GitHub username)
- Story points (parse dari label convention `size:S/M/L/XL`)
- Status (mapping issue state + label: To Do / In Progress / In Review / Done)
- Linked PR (number + title + status)
- Workflow state visual: foundation -> frame -> painting -> finished mapping ke ticket lifecycle

**PR-to-Building Auto-Sync Real-Time Webhook**:
- Subscribe events: PR opened, PR review_requested, PR review approved, PR merged, PR closed without merge, issue created, issue closed
- State changes propagate ke building dalam < 5 detik (acceptance criteria, lihat Section 21)
- Event mapping:
  - PR opened -> crane appears at building
  - Review requested -> inspector NPC orbit building
  - Review approved -> green glow halo (transient 30 menit)
  - Merged -> crane removes, building briefly glow green, scaffolding cleared
  - Closed without merge -> crane removes, no glow, ticket panel update status
- Webhook receiver via FastAPI backend dengan signature verification (`X-Hub-Signature-256` HMAC)
- Event store di PostgreSQL untuk audit trail + cycle time/lead time derivation

**Backlog Office (Virtual Building)**:
- Special building di kota yang BUKAN represent file
- Represent backlog (issue tanpa milestone)
- Destination untuk Hybrid Write Layer 1 (Apollo finding -> 1-click create issue)
- Animation: issue terbang dari building yang ada finding ke Backlog Office sebagai visual confirmation create success
- Click Backlog Office -> backlog panel: list semua open issue tanpa milestone, sorted by priority (label-based), filter by label/assignee/age, story points roll-up

**MVP scope**: Sprint Mode passive (read-only). Drag ticket antar milestone defer ke Phase 2.

**Toggle ke Dashboard View**: flat 2D manager-facing dengan velocity chart + burndown live + milestone progress (Recharts/Chart.js, Designer-v1 decide).

### 9.3. FR-Mode-3: Refactor Mode (SAFETY-FIRST)

**Hero use case**: spec-driven refactor exploration di sandbox.

**9-step flow**:
1. **Intent input**: User type intent (e.g., `"I want to add 2FA to login"`, `"extract payment service from monolith"`)
2. **Athena think**: visual animation indicating processing (DeepSeek V4-Pro reasoning mode untuk deep analysis, V4-Flash untuk simpler intent)
3. **Ghost buildings appear**: 3 ghost buildings di kota dengan suggested location + connections ke existing buildings. Ghost transparent dengan animated dashed outline yang signal "proposed, not yet existing"
4. **Side panel auto-generate OpenSpec change folder live**: `openspec/changes/<change-name>/proposal.md` (ADDED Requirement), `design.md` (approach + reasoning + alternative considered), `tasks.md` (checkbox actionable). Live streaming. User boleh review di side panel atau buka di IDE native via deep link
5. **Clio narrator (BUKAN Iris, Iris dropped)** narrate trade-off context optional (e.g., `"approach JWT punya advantage X, trade-off Y"`)
6. **Review gate 1**: User approve proposal, klik `"Run Simulation"` button (BUKAN langsung apply)
7. **Simulation execution**: Backend execute simulation via DeepSeek V4 multi-turn coordination:
   - Turn 1: test generation (DeepSeek receive proposal+design+tasks context, generate test code)
   - Turn 2: implementation generation (DeepSeek receive test + design, generate implementation code)
   - Turn 3: diff serialization (DeepSeek output structured diff format)
   - Output streamed back ke backend via WebSocket
   - Backend write ke `drafts/<simulation-id>/` folder, BUKAN production code
   - Real-time progress streaming UI: tests written first, implementation lands incrementally, ghost-to-solid frame-by-frame
8. **Simulation complete**: ghost buildings fully solid di simulation view, side panel show diff + stats (files changed, lines added, tests passed). 2 button surface:
   - `"Accept changes"`: apply diff dari `drafts/<simulation-id>/` ke production code, commit, archive change folder via `openspec archive`, ghost building state become solid permanent di production
   - `"Done viewing simulation"`: keep simulation as draft di `drafts/` folder for later review atau eventual discard. Production code untouched. User boleh resume simulation later atau delete draft
9. **Review gate 2 implicit**: Step 8 button click adalah final approval gate

**Critical safety design**:
- Production code HANYA berubah di Step 8 saat user explicit click `"Accept changes"`
- Sebelum itu, semua eksekusi jalan di sandbox `drafts/` folder
- AI explore freely tanpa risiko production break

**Mirror workflow OpenSpec yang sudah practice di tim engineering**: propose, review, apply (di sandbox), accept-or-discard, archive. Mode ini visualize workflow itu spatial, BUKAN introduce new methodology.

**Defensibility di Q&A juri**: *"this is how we develop, we made it spatial. AI explores in drafts, you commit to production."*

### 9.4. FR-Mode-4: Activity Mode

**Hero use case**: git-backed engineering intelligence.

**Visualisasi**:
- Ownership concentration per distrik (heatmap warna by primary contributor)
- Contributor heatmap (overlay nama contributor di gedung mereka own)
- Hotspot perubahan (gedung yang paling sering di-edit recent period glow lebih intens)
- Evolution timeline scrubber (lite version dari Time Mode, scrub last 30/60/90 days)

**Use case primary**:
- Daily standup (`"show me last 24h activity"`)
- Sprint retro (60-second flythrough perubahan sprint dengan Clio narration)
- Onboarding context (`"show me what your colleague @username has been working on"`)
- Performance review prep (`"summarize my contributions last quarter"`)

**Time Mode versi full** (multi-year scrub dengan epoch detection auto-detect *"The TypeScript Migration Era"*, *"Scaling Era"*, *"Spec-Driven Era"*) parkir di Phase 2.

### 9.5. FR-Mode-5: Health Mode

**Hero use case**: code health diagnostic view.

**Flow**:
1. Switch ke Health Mode, kota berubah jadi diagnostic view
2. Gedung dengan glow merah punya critical finding, glow orange high, glow yellow medium
3. 5 deterministic detector dari Apollo trigger glow window per kategori warna
4. Click Apollo (Hospital building) -> Findings Panel: list semua glow building beserta kategori
5. Click specific finding membuka **evidence panel**: file path, line number, static analysis output, suggested mitigation direction
6. User decide treatment per finding

**Hybrid Write Layer 1**:
- Dari findings panel, user klik `"Convert to Backlog Ticket"` button
- Backend POST ke GitHub API (create issue endpoint)
- Issue baru muncul di Backlog Office dengan flying animation
- Issue body pre-filled dengan evidence chain (file path, line number, static analysis output, suggested label `bug/security/tech-debt`)
- User boleh edit di GitHub native sebelum confirm submission, atau langsung submit dari panel

**Apollo + Argus Complementary Triage**:
- Apollo: broader health (5 detector all aspect)
- Argus: security-deeper (granular triage per security finding dengan CVSS scoring, exploit potential analysis)
- User boleh route Apollo finding yang security-related ke Argus untuk deeper triage

---

## 10. AI Residents Specifications

5 specialized residents tinggal di iconic landmark buildings yang relevan dengan domain mereka. User klik building atau broadcast pertanyaan, agent yang relevan respond.

**LLM provider semua resident**: DeepSeek V4-Flash primary (non-thinking mode untuk routing + simple query, thinking mode untuk reasoning) + V4-Pro fallback untuk complex multi-turn (Refactor Mode). Defensive layer: semantic cache (cosine similarity threshold 0.85), pre-recorded canned response untuk top 10 demo questions, retry simplified prompt, fallback ke Flash kalau Pro fail, fallback canned kalau both fail.

### 10.1. Athena, City Hall (The Architect)

**Lokasi**: City Hall building (Greek temple silhouette dengan pillar columns + pediment, iconic landmark distinct).

**Domain scope**: refactor planning, spec authoring, dependency awareness, structural decision.

**Behavior**:
- OpenSpec proposal author dalam Refactor Mode workflow
- User describe intent in plain language
- Athena run static analysis pada current codebase, identify affected files + dependency
- Propose **ghost buildings** di kota dengan suggested location + connections
- Side panel auto-generate OpenSpec change folder di **Folder A `openspec/changes/<change-name>/`** (panitia-facing, BUKAN Folder B internal)
- Change folder berisi: `proposal.md` (ADDED/MODIFIED/REMOVED requirements), `design.md` (approach + reasoning + alternative considered), `tasks.md` (checkbox actionable)

**Critical filosofi**: Athena tidak unilateral landing production. Semua proposal melewati 2 human review gate:
1. Review proposal sebelum execute (user baca proposal + design + tasks di side panel)
2. Review simulation result sebelum accept (user lihat ghost-to-solid animation, baca diff, decide accept atau discard)

**Tiap proposal grounded** di static analysis output, BUKAN AI ngarang. Untuk repo tanpa `openspec/` directory, Athena fallback ke generate GitHub Issue draft dengan structured body (proposal-style content, progressive degradation).

**DeepSeek model preference**: V4-Pro thinking mode untuk proposal author (deep reasoning butuh). V4-Flash thinking mode untuk fallback kalau Pro fail.

### 10.2. Apollo, Hospital (The Doctor)

**Lokasi**: Hospital building (cross-shaped tower, iconic landmark).

**Domain scope**: code quality, complexity, test coverage, technical debt detection.

**5 deterministic detector yang Apollo monitor**:
1. **Hardcoded secrets**: regex + entropy check via gitleaks pattern
2. **Outdated dependencies**: parse manifest files (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, etc.) + cross-check OSV API untuk known CVE
3. **Missing auth on protected routes**: parse decorators/middleware, multi-language: TS/JS (Express, Next.js), Python (FastAPI, Flask, Django), Go (Gin, Echo), Java (Spring), Rust (Actix)
4. **Unsafe SQL patterns**: parse queries, detect raw string concatenation, multi-language
5. **Complex untested files**: radon cyclomatic complexity threshold + test coverage stub via parse import test files

**Behavior**:
- Tiap finding trigger glow window di gedung yang affected dengan kategori warna (merah = critical, orange = high, yellow = medium)
- Apollo prescribe fix dengan **evidence chain**: cite exact file path, line number, static analysis output
- Apollo TIDAK ngarang fix, dia surface evidence + suggest direction
- Finding bisa di-route ke 2 destination via Hybrid Write (lihat Section 12)

**DeepSeek model preference**: V4-Flash non-thinking mode untuk narration (deterministic detector udah produce structured data, LLM cuma wrap jadi prosa readable).

### 10.3. Argus, Police Station (The Watcher)

**Lokasi**: Police Station building (surveillance camera tower geometry, iconic landmark).

**Domain scope**: security scanner + vulnerability triager. Domain overlap dengan Apollo tapi specialize ke security.

**Findings dari**: gitleaks (secret pattern), OSV (CVE database), custom auth route checker.

**Beda dengan Apollo**:
- Apollo: broader-health (semua aspect health)
- Argus: security-deeper (lebih granular triage per finding, severity scoring CVSS, exploit potential analysis)

**Argus output**: structured vulnerability report dengan severity, exploit pattern (kalau ada di public CVE), suggested mitigation dengan reference ke advisories, evidence chain.

**Escalation**: severe finding (e.g., complex untested service yang butuh refactor) bisa di-escalate ke Athena untuk OpenSpec proposal (Hybrid Write Layer 2 di Refactor Mode), BUKAN cuma di-create sebagai issue.

**DeepSeek model preference**: V4-Flash thinking mode untuk CVSS scoring + exploit pattern analysis (perlu reasoning), V4-Pro fallback untuk complex security analysis.

### 10.4. Clio, Library (The Historian)

**Lokasi**: Library building (open book stack vertical, iconic landmark).

**Domain scope**: git archaeologist + sprint retrospective narrator + multi-mode prose narration.

**Catatan**: Iris (Observatory resident yang sebelumnya direncanakan sebagai dedicated narrator) **DI-DROP**. Multi-mode narration responsibility distribute ke Clio (untuk git/spec-drift/activity context), Apollo (untuk health finding context), Athena (untuk refactor proposal trade-off context).

**Use case primary**:
- Sprint retrospective replay (60-detik cinematic flythrough kota dengan animation perubahan sprint terakhir + Clio narration)
- Daily standup view (visualize aktivitas 24 jam terakhir dengan hotspot heatmap)
- Code archaeology (user click gedung lama, Clio narrate evolusi file)
- Onboarding context (combine dengan Hermes tour untuk historical perspective per district)
- **Spec-drift narration** (deterministic detector flag retak/ghost building, Clio narrate prosa kenapa retak berdasarkan timestamp + event metadata)

**Data dari**: git metadata (deterministic). LLM hanya narrate prosa, BUKAN analyze atau hypothesize. Semua angka + fact berasal dari deterministic source.

**Contoh narasi Clio untuk spec-drift**:
> *"Building auth/oauth.ts retak karena Pattern A: issue #234 closed 8 bulan lalu tapi file ini masih di-edit 12x dalam 3 bulan terakhir. Kemungkinan implementation drifted dari original spec issue. Reviewer terakhir: @hafiz, last commit: 2 minggu lalu."*

Semua angka (8 bulan, 12x edit, 3 bulan, 2 minggu) berasal dari deterministic source. LLM hanya menyusun prosa naratif.

**DeepSeek model preference**: V4-Flash non-thinking mode (narration tugas straightforward, no deep reasoning needed).

### 10.5. Hermes, Tourist Info (The Guide)

**Lokasi**: Tourist Info building (cube glass beacon, iconic landmark).

**Domain scope**: codebase tour generation, narrative-driven exploration, onboarding guide.

**4 variant tour yang Hermes generate**: (lihat Section 9.1)

**Behavior**:
- Camera fly otomatis lewat distrik-distrik kunci
- Gedung penting glow saat dilewati
- Hermes narate via text di chat panel
- Tour script generated dari deterministic codebase analysis (ownership, dependency, recency)
- Hermes narrative wrap structured data jadi prosa engaging
- User boleh pause tour mid-flythrough untuk explore manual, lalu resume ke next stop

**DeepSeek model preference**: V4-Flash non-thinking mode (narration + tour script wrap, no reasoning).

---

## 11. Spec-Drift Detection

Codebase visualize gap code-as-implemented vs code-as-specified. Differentiator philosophical: *"other tools tell you what is in your code, we tell you what your code promised vs what it actually delivered."*

### 11.1. OpenSpec First-Class + GitHub Issues Fallback

**First-class** (kalau repo punya `openspec/` directory di Folder A panitia-facing):
- OpenSpec sebagai source of truth (Folder A `openspec/`)
- Tiap change folder (`openspec/changes/<change-name>/`) berisi proposal.md + design.md + tasks.md, di-track sebagai active proposal
- Athena Refactor Mode generate change folder via `/opsx:propose`, write ke Folder A
- `/opsx:apply` trigger DeepSeek multi-turn simulation execution (test gen -> implementation gen -> diff serialization), output write ke `drafts/`
- `/opsx:archive` merge ke source of truth saat user accept changes

**Fallback** (kalau repo tidak punya `openspec/`):
- GitHub Issues sebagai informal spec source
- Issue body = description of intent
- Linked PR = implementation attempt
- Athena fallback generate GitHub Issue draft dengan proposal-style content

**Pattern**: progressive degradation (OpenSpec default, GitHub Issues fallback). Demo dataset pre-loaded mix repo dengan + tanpa OpenSpec untuk show both flows.

### 11.2. 3 Building States

| State | Definisi | Detection |
|---|---|---|
| **Solid (normal)** | File eksis di repo + ada PR yang touch file + PR link ke issue yang merged/closed-positively, OR change folder archived | Pure metadata join |
| **Ghost building** | Path mentioned di proposal/issue body/title (regex detect path-like seperti `auth/login.ts`), proposal/issue di milestone aktif, tapi path belum eksis di filesystem. Ghost muncul di koordinat yang seharusnya, transparent dengan animated dashed outline | Pure regex + filesystem check |
| **Retak (cracked) building** | 5 deterministic patterns yang signal drift | Pure deterministic detection |

### 11.3. 5 Retak Patterns

| Pattern | Definisi | Sinyal |
|---|---|---|
| **A. Stale closed issue** | Issue closed >6 bulan lalu, tapi file yang mention di issue terus di-edit setelah closed | Issue dianggap selesai tapi kerjaan masih jalan |
| **B. Closed without merge** | Issue closed tanpa ada PR yang merge dan touch file relevan | Issue ditutup mungkin karena tidak relevan, tapi spec tetap di tracker |
| **C. Spec-implementation lag** | Issue closed dan file di-touch, tapi gap antara closed timestamp dan file last commit > X bulan (configurable) | Implementation drifted dari original spec |
| **D. Reopened cycle** | Issue di-reopen >= 2x atau ada multiple closing PR yang reverted | Spec keeps changing, building unstable |
| **E. OpenSpec drift** | Commit yang touch file referenced di archived OpenSpec change tapi commit message tidak include `opsx:` prefix | Hook bypass atau merge dari branch tanpa workflow-guard |

### 11.4. Clio Narrator Role (LLM as Storyteller)

Deterministic detector flag retak. Clio narrate prosa berdasarkan timestamp + event metadata dari detector output. Semua angka + fact berasal dari deterministic source. LLM hanya menyusun prosa naratif.

**Filosofi compliance**: AI sebagai storyteller, BUKAN judge. Patterns extensible: future pattern bisa ditambah tanpa engine architecture change.

---

## 12. Hybrid Write Strategy + Drop Protocol

Spectrum write capability: read-only / hybrid 1-action / hybrid 2-action / full write. Codeplex Chronicle pilih **hybrid 2-action** dengan fallback protocol ke read-only.

### 12.1. Layer 1: Apollo Finding -> 1-Click GitHub Issue (Low Risk)

**Flow**:
1. Apollo detect tech debt finding di file
2. Side panel surface finding dengan evidence chain
3. User klik `"Convert to Backlog Ticket"` button
4. Backend POST ke GitHub API (create issue endpoint)
5. Issue baru muncul di Backlog Office dengan flying animation
6. Issue body pre-filled dengan evidence chain
7. User boleh edit di GitHub native sebelum confirm submission, atau langsung submit dari panel

**Implementation safety net**:
- **Optimistic UI**: visual gerak langsung, rollback kalau API gagal
- **Feature flag** `ENABLE_WRITE_OPS=true/false` di environment. Toggle = entire write disable. Demo fallback ga perlu re-deploy
- **Mock-able from day 1**: backend create-issue endpoint punya 2 mode (real GitHub API + mock fake success). Toggle via env
- **Build read-only first**: Wave 1-2 ship full read-only flow. Hybrid layer di-add paling akhir di Wave 3. Drop = disable layer atas, foundation utuh

### 12.2. Layer 2: Refactor Mode Simulation Execution to `drafts/` (Medium Risk, High Reward)

**Flow** (detail di Section 9.3 Refactor Mode):
1. Athena propose ghost building + auto-generate OpenSpec change folder
2. User review proposal di side panel
3. User klik `"Run Simulation"`
4. Backend execute simulation via DeepSeek V4 multi-turn coordination
5. Output write ke `drafts/<simulation-id>/` folder (BUKAN production)
6. Real-time streaming UI
7. Simulation complete: 2 button (Accept / Done viewing)
8. Accept: apply diff, commit, archive
9. Done viewing: keep as draft, production untouched

**Layer 2 lebih heavy daripada Layer 1**: butuh DeepSeek multi-turn coordination (proposal -> test gen -> implementation gen -> diff serialization), OpenSpec runtime integration, real-time streaming UI. Tapi visual demo wow paling tinggi (ghost-to-solid live animation real, BUKAN pre-recorded).

**Cost**: ~$0.50-1.00 per simulation run (estimasi pakai V4-Pro thinking mode), well within $5 Hafiz budget untuk demo 1-2 simulation trigger. NO Anthropic API call di runtime untuk Refactor Mode execution.

**Feature flag** `ENABLE_WRITE_OPS_LAYER_2` separate dari Layer 1, individually toggleable.

### 12.3. Drop Protocol Layer 1 (Hybrid Write Apollo -> Issue)

**Layer A: Timing Checkpoints (Hard Gates)**:

| Waktu | Status check | Cut criteria |
|---|---|---|
| Mid Wave 3 (backend integration phase) | OAuth flow jalan? Read API call ke GitHub jalan? | Kalau read foundation goyang -> DROP hybrid sekarang. Write dibangun above read |
| Late Wave 3 | Read pipeline end-to-end demoable? | Kalau Wave 3 mid masih struggle dengan read -> DROP. Write tidak feasible kalau read belum |
| Pre-deploy gate | Apollo finding output konkret? Create-issue endpoint backend exist? | Kalau Apollo finding belum konkret atau endpoint belum exist -> DROP |
| Post-deploy gate | Hybrid flow end-to-end clickable, walaupun kasar? | Kalau ada bug fundamental di flow -> DROP |
| Final gate (scope freeze) | Hybrid flow stable untuk demo (3x consecutive successful run tanpa bug)? | Kalau ga stable -> DROP NON-NEGOTIABLE |

**Layer B: Signal-Based Triggers (Anytime)**:
- **A. GitHub OAuth scope issue**: write scope ditolak user, atau test account ga punya write permission, atau token refresh masalah -> DROP
- **B. Rate limit hit during testing**: Wave 3 testing udah hit GitHub rate limit (5K/hour) -> DROP
- **C. 2 consecutive failed integration attempts**: wire Apollo finding -> create issue UI 2x dan fail (bug berbeda tiap kali) -> DROP
- **D. Worker stuck > 30 menit on write API**: cost tinggi -> DROP
- **E. Demo flow inconsistent**: 3 trial run tidak konsisten -> DROP. Demo hari-H pasti hadirkan kondisi yang kurang ideal
- **F. Burnout signal**: operator frustrated 1+ jam karena write API debugging -> DROP. Polish quality > scope completeness

**Layer C: Decision Protocol (kalau hit trigger)**:
1. **Pause + Confirm dengan partner operator** (5 menit, sleep cycle aware)
2. **Feature flag, jangan delete**: toggle `ENABLE_WRITE_OPS=false`. UI tetap punya `"Convert to Ticket"` button di Apollo finding, onclick redirect ke GitHub native dengan pre-filled body. Code write masih ada untuk Phase 2. Reversible kalau ternyata ada waktu fix
3. **Update demo script** (15 menit): demo script update `"User klik 'Convert to Ticket' -> opens GitHub native dengan pre-filled body"` instead of direct create. Pitch line ganti: `"Apollo detect issue -> 1-click prepare GitHub issue with full evidence chain pre-filled"`
4. **Communicate ke V1 Orch**: update orchestrator chat eksplisit. Jangan silent drop
5. **Redirect saved time ke Visual Quality Bar**: time yang dihemat -> polish glowing windows, fog, particles, camera idle drift

### 12.4. Drop Protocol Layer 2 (Refactor Mode Simulation)

**Layer A: Timing Checkpoints**:
- **Mid Wave 2** (modes implementation): Athena ghost building visual jalan? OpenSpec change folder generation jalan? Kalau belum -> consider DROP simulation execution, keep ghost building visual + side panel auto-generate proposal/design/tasks (no real `/opsx:apply`)
- **Mid Wave 3** (backend integration): DeepSeek multi-turn coordination feasible? `drafts/` folder write working? Kalau belum -> DROP `/opsx:apply` execution, demo Refactor Mode = display proposal only (read-only proposal display, no simulation, no accept-or-discard buttons)
- **Pre-demo rehearsal gate**: simulation flow end-to-end stable (3x consecutive successful)? Kalau ga -> DROP simulation, fallback ke proposal display only

**Layer B: Signal-Based Triggers**:
- DeepSeek turn drop atau hang > 30 detik -> DROP (timeout aggressive)
- Generated test fail produce passing run 2x consecutive -> DROP
- Ghost-to-solid animation glitchy (flicker, jump, miss frame) -> DROP visual fallback ke pre-scripted timeline
- OpenSpec `/opsx:apply` malfunction (DeepSeek malformed output persistent) -> DROP, fallback ke pre-scripted simulation result

**Layer C: Decision Protocol**:
- DROP Layer 2 -> Refactor Mode jadi read-only proposal display: Athena propose, ghost building muncul, side panel show proposal/design/tasks, BUT no `"Run Simulation"` button. Pitch line ganti: *"Athena propose refactor with full OpenSpec change folder. In production, this proposal goes to /opsx:apply for sandbox execution. Today we're showing the proposal flow."*
- Visual demo punch berkurang tapi filosofi compliance tetap kuat
- Time saved redirect ke polish Sprint Mode visual

### 12.5. Decision Matrix Singkat

| Faktor | Read-Only Only | Layer 1 Only | Layer 1 + Layer 2 (rekomen) |
|---|---|---|---|
| Engineering risk | Low | Low-Medium | Medium |
| Demo wow | Solid 7/10 | Strong 9/10 | Stronger 9.5/10 kalau flawless |
| Demo failure risk | Negligible | Low | Medium |
| Pitch defensibility | Medium | High | Very High (full Refactor Mode story) |
| Time to polish visual | Most | More | Less |
| Realistic 24-jam | Very feasible | Yes | Tight tapi feasible kalau workflow agentic disciplined |

---

## 13. Visual Quality Bar + Performance Budget

### 13.1. Foundation Mapping (Static Analysis Deterministic)

| Element | Mapping |
|---|---|
| Gedung | File (tinggi proporsional ke LOC, dengan non-linear scaling untuk reach NYC/Dubai-tier verticality untuk file >500 LOC) |
| District | Folder/module |
| Jalan glowing antar gedung | Import dependency |
| Pohon antar district | Density map ke test coverage (district well-tested rimbun, tanpa test botak) |
| Default warna gedung | Ownership (CODEOWNERS file kalau ada, fallback git blame aggregation) |
| Toggle warna alternative | Language atau recency commit |

**Layout**: treemap deterministic, BUKAN force-directed (yang berantakan di 3D). Performance-aware via LOD (level of detail), instancing, frustum culling untuk repo besar.

**Click building**: zoom-and-focus dengan side panel auto-open berisi contributor detail, recent commits, linked issues (active + closed), open PR status, file metadata (LOC, complexity, last edited). ESC kembali ke overview camera.

### 13.2. Living City Visual Quality Bar (Non-Negotiable Baseline)

Visual baseline yang bikin kota terasa hidup, BUKAN render statis. Layer-layer stacked:

- **Glowing windows random pattern** di tiap gedung (file aktif glow lebih banyak, file idle window mati)
- **Hot files** (sering di-edit) glow effect lebih intens
- **Fog atmospheric** (Dubai-haze tier, density curve agresif di distance)
- **Particles ambient** (3-tier layered Sparkles)
- **Camera idle drift cinematic** kalau user tidak interact > 10 detik
- **Post-processing pipeline**: Bloom (`mipmapBlur=true`) + DepthOfField + ChromaticAberration + Vignette + Noise + ACES Filmic ToneMapping
- **HDRI sunset environment**
- **3 directional light** dengan shadow mapping

**Non-negotiable**: visual quality bar ini differentiator yang bikin kota Codeplex Chronicle beda dari kompetitor (CodeCity, CodeCharta, SoftwareCity yang semua render statis). Tanpa baseline ini, kota cuma diagram 3D. Wajib selalu shipped.

### 13.3. Visual Ambition Stretch Vectors

**Stretch Tier 1 (mandatory if performance allow, per Eos lens push pre-event)**:
1. **Cinematic intro 5 detik first load**: camera glide low altitude dari laut/jauh masuk city center, residents wake-up sequence (lights turn on di landmark buildings)
2. **Verticality hero gedung skyscraper**: file >500 LOC pakai 2x current max height, custom tapered geometry (BoxGeometry + CylinderGeometry top section), spire antenna emissive
3. **Iconic landmark architecture per resident** (5 distinct geometry, sebagai listed di Section 10)
4. **Director mode auto-fly through 5 highlights**: pitch sendiri tanpa manual click. Wave 3 polish, super valuable saat pitch judges + saat rehearsal

**Stretch Tier 2 (welcomed kalau performance allow)**:
- **Flying cars** (`THREE.InstancedMesh` ~30 cars on path looping along glowing yellow paths, color per microservice represent inter-district API call live)
- **Window pattern variety hot/cold encoding** (file aktif dense window + warm tint, idle sparse + cold blue tint)
- **Earthquake error visual** (tagline lock: *"errors become earthquakes you can feel"*): saat error condition trigger di codebase (e.g., Apollo detect critical finding cluster, atau spec-drift Pattern E detect commit hook bypass), gedung shake + particle debris + ground crack pattern. Visual punch tinggi
- **Weather effects** (thunder kalau active error rate spike, sunny di healthy district, fog kalau service degraded, snow kalau service in maintenance)

### 13.4. Performance Budget + Optimization

**Performance ceiling per research pre-event (r3f docs + Codrops SINGULARITY benchmark)**:
- 200-500 InstancedMesh buildings via single draw call = within budget
- 60fps target di MacBook Pro M-series demo laptop = realistic
- **Drop-first order kalau regress**:
  1. DepthOfField (single biggest cost)
  2. Sparkles tier 3
  3. Salah satu directional shadow
- **JANGAN drop**: ChromaticAberration (cheap + adds cinematic punch)

**Optimization recommendations**:
- Raw `<instancedMesh>` dengan imperative `setMatrixAt()` untuk 200-300 building (BUKAN Drei `<Instances>` per-instance JSX, slower per r3f issue #3306)
- Untuk 30 flying car: Drei `<Instances>` masih OK karena small count
- **Performance tooling**: drop `<Perf />` r3f-perf overlay di dev mode untuk benchmark realtime
- **Wire `state.performance.regress()`** ke OrbitControls + GSAP camera arc events untuk auto-drop pixel ratio saat moving (cheap +20-30% perf)

**Feature flag killswitch mandatory**:
- `ENABLE_DOF` (DepthOfField post-processing)
- `ENABLE_SPARKLES_TIER_3` (highest particle tier)
- `ENABLE_THIRD_DIRECTIONAL_LIGHT` (third directional shadow)
- Runtime toggle untuk drop kalau demo lag

### 13.5. Three.js Version Lock

Three.js **0.184** pinned, NOT auto-update. Reason: r3f@9 + drei + post-processing dependency stability. Auto-update breaks frequent (per idea-draft research).

---

## 14. Demo Dataset + Day-0 Prep

Berdasarkan research pre-event (NodeGoat + FastAPI template + PyGoat picked, Juice Shop rejected karena 1000+ files), plus pivot ke Sprint Mode hero (butuh active Milestones + realistic Backlog + size labels + linked PR + CODEOWNERS + recent contributor activity), strategy locked **R3 Pure Seed**.

### 14.1. Day-0 Prep Action (Claude Code handle, BUKAN Ghaisan/Hafiz)

Claude Code execute Day-0 (10-11 Mei):

1. **Fork 3 repo** ke org Duopoly atau personal Ghaisan (Finerium):
   - `OWASP/NodeGoat` -> `duopoly/codeplex-demo-nodegoat` (hero Health Mode showcase, 5/5 OWASP detector fire authentic)
   - `fastapi/full-stack-fastapi-template` -> `duopoly/codeplex-demo-fastapi-fullstack` (mirror Codeplex Chronicle stack, juri instant recognize)
   - `OWASP/PyGoat` -> `duopoly/codeplex-demo-pygoat` (Python flavor fallback, Health Mode Python angle)

2. **Populate agile data** via GitHub API script:
   - Create 2-3 active Milestones per repo (e.g., `"Sprint 14: Security hardening"`, `"Sprint 15: Performance + auth"`)
   - Populate ~15-25 issues per repo dengan label: `type=feature/bug/chore`, `size:S/M/L/XL`, `priority:high/medium/low`, `in-progress/in-review`
   - Assign issues ke fictional team members (placeholder username + avatar)
   - Create ~5-8 open PR per repo linked ke issue (`Closes #N`)
   - Add CODEOWNERS file di setiap repo dengan ownership distribution
   - Create 2-3 closed issues dengan reopened cycle (untuk trigger Pattern D retak)
   - Create 1-2 issues dengan stale closed pattern (untuk trigger Pattern A retak)

3. **Init OpenSpec di demo repo Folder A** (product-level openspec yang panitia akan baca, di `codeplex-demo-fastapi-fullstack`):
   - `openspec init --tools claude --profile core` di repo root
   - Fill `openspec/project.md` ~250 line context
   - Create 2-3 archived `openspec/changes/` examples (untuk trigger Pattern E spec-drift kalau commit hook bypass)
   - **Note**: ini OpenSpec di-init di repo demo dataset (yang user import ke Codeplex Chronicle). Workflow agentic Ghaisan punya OpenSpec sendiri di Folder B `.agent-openspec/` di project root Codeplex Chronicle itu sendiri, terpisah

4. **Add closing slide screenshot bonus** untuk pitch:
   - Pre-render `tokopedia/gripmock` (Apache-2.0, Go ~50 files) sebagai bonus slide *"Codeplex Chronicle works on real Indonesian production code"*
   - Pre-render `gojek/courier-android` sebagai second bonus

5. **Cache parser output**: tree-sitter parse semua 3 demo repo, save building-graph JSON ke `/public/datasets/<repo-id>.json` untuk fast load

### 14.2. Demo Dataset Selection per Mode

| Mode | Primary Demo Dataset | Secondary | Notes |
|---|---|---|---|
| **Onboarding Mode** | `codeplex-demo-fastapi-fullstack` | `codeplex-demo-nodegoat` | FastAPI mirror stack, juri recognize, district split clean |
| **Sprint Mode (HERO)** | `codeplex-demo-fastapi-fullstack` | `codeplex-demo-nodegoat` | Pure seed Milestones + issues + PR rich data |
| **Refactor Mode** | `codeplex-demo-fastapi-fullstack` (with `openspec/`) | - | Only one with OpenSpec init, full Refactor flow |
| **Activity Mode** | `codeplex-demo-fastapi-fullstack` | `codeplex-demo-nodegoat` | Pure seed contributor data via fictional commit timeline |
| **Health Mode (HERO showcase)** | `codeplex-demo-nodegoat` | `codeplex-demo-pygoat` (fallback) | OWASP Top 10 fire 5/5 detector authentic |

### 14.3. Risk Disclosure di Pitch

Honest disclosure kalau juri tanya: *"Demo dataset adalah fork repo public OWASP/NodeGoat dan fastapi/full-stack-fastapi-template yang kami populate dengan agile data realistic untuk demo. Repo asli tetap public di GitHub fork kami, lihat duopoly org. Production user akan import repo mereka sendiri via OAuth."*

---

## 15. Demo Flow + Pitch Script

10 menit per tim di final, tapi pitch core 2 menit punchy. Sisanya Q&A + technical depth.

### 15.1. Opening Hook (15 detik)

> *"Engineer baru join codebase 100K LOC. Hari ini dia baca README, buka VSCode, lost di 200 file. Manager-nya minta velocity report, dia harus ke 3 tools beda. Kami satukan semua di satu kota."*

Layar buka Codeplex Chronicle landing page (Awwwards-tier visual), klik `"Import a repository"`, auto-load demo repo `codeplex-demo-fastapi-fullstack`. Cinematic intro 5 detik: camera glide low altitude masuk city center, residents wake-up sequence (lights turn on di Athena/Apollo/Argus/Clio/Hermes landmark buildings).

### 15.2. Mode 1: Onboarding (25 detik)

Klik Hermes (Tourist Info). Type `"give me a 30-second tour"`. Camera fly otomatis lewat 3 distrik kunci, Hermes narate via text, gedung penting glow saat dilewati. Ending: *"this codebase has 3 districts you'll touch most: auth, payment, api. Your starting point: auth/login.ts. Owner contact: @hafiz."*

### 15.3. Mode 2: Sprint Mode (45 detik, HERO)

Switch ke Sprint Mode. Kota berubah: scaffolding muncul di gedung dengan active ticket, crane di gedung dengan open PR, banner sprint goal di City Hall (*"Sprint 14: Security hardening + auth"*), inspector NPC orbit gedung yang di review. Click gedung dengan scaffolding -> ticket panel slide in (assignee, story points size:M, linked PR #45, status In Review). Show PR comment surfacing on building (sticky note dengan badge 3 unread comment).

Toggle ke Dashboard View -> flat manager-facing view dengan velocity chart + burndown live + milestone progress.

> *"This is what we mean by spatial PM. Ticket lives where the work lives."*

### 15.4. Mode 3: Refactor (30 detik)

Switch ke Refactor Mode. Type intent `"add 2FA to login flow."` Athena think 2 detik (DeepSeek V4-Pro thinking mode), 3 ghost buildings appear di kota (auth/oauth.ts, auth/totp.ts, auth/middleware.ts). Side panel auto-generate `openspec/changes/add-2fa/`: proposal.md, design.md, tasks.md live streaming.

Click `"Run Simulation"`. Real-time: tests written, implementation lands, ghost buildings turn solid frame-by-frame. Simulation complete: 2 button surface (`"Accept changes"` / `"Done viewing simulation"`). Click `"Done viewing simulation"`.

> *"AI explores in drafts. Production code only changes when you accept."*

### 15.5. Mode 4: Health -> 1-Click Ticket (25 detik)

Switch ke Health Mode dengan dataset `codeplex-demo-nodegoat`. 8 buildings glow merah/orange. Click Apollo (Hospital). *"What's wrong?"* Apollo respond: *"Hardcoded API key di config.ts line 12, missing auth on /admin route, payment.service.ts cyclomatic complexity 52."* Click `"Convert to Backlog Ticket"` pada finding pertama -> animation issue terbang ke Backlog Office -> live confirm di GitHub native (open di tab samping).

### 15.6. Closing Punchline (10 detik)

> *"Flat ticket lists don't show where work lives. Static code maps don't show what's planned. Codeplex Chronicle is one map of cities: your codebase, your sprint, and the gap between what you planned and what you shipped, all in one place. AI explores in drafts, you commit to production."*

Closing slide: 2 screenshot bonus pre-rendered (`tokopedia/gripmock` + `gojek/courier-android`) dengan caption *"Works on real Indonesian production code."*

---

## 16. Q&A Defense Cards

Anticipated questions plus answer (8 menit prepared defense):

| # | Question | Answer |
|---|---|---|
| Q1 | "Scale to 1M LOC?" | *"Treemap deterministic + LOD + InstancedMesh + frustum culling. Demo 300 file + 60fps. Theoretical scale 10K+ files dengan LOD aggressive, untested di production scale."* |
| Q2 | "Private repo security?" | *"GitHub OAuth scope minimal: read:repo, read:issues, read:pull_requests, write:issues. Token never leaves user browser session. Code parsed di backend client-isolated, no cross-tenant leak."* |
| Q3 | "How AI residents avoid hallucination?" | *"Semua insight grounded di static analysis output, git/ticket metadata, OpenSpec proposal, atau deterministic detector. AI sebagai narrator, BUKAN analyzer. Refactor Mode execute di drafts/ folder, BUKAN production. User explicit click Accept untuk apply ke production."* |
| Q4 | "Why 3D city, not 2D graph?" | *"Spatial encoding bandwidth lebih tinggi dari graph. Verticality encode LOC, district encode folder, glow encode activity, scaffolding encode work-in-progress. Combined dimensions tell story 2D graph ga bisa."* |
| Q5 | "Compete dengan Jira/Linear?" | *"BUKAN compete, complement. We piggyback GitHub Issues sebagai backbone, tim engineering existing workflow ga perlu pindah. We add spatial layer + AI residents on top."* |
| Q6 | "OpenSpec mandatory?" | *"OpenSpec first-class kalau repo user punya `openspec/`. Repo tanpa OpenSpec, fallback ke GitHub Issues sebagai informal spec source. Progressive degradation. Untuk Codeplex Chronicle sendiri, kami pakai dual-folder OpenSpec sesuai request panitia: `openspec/` untuk spec fitur utama yang panitia baca pasca-hackathon, `.agent-openspec/` untuk internal workflow agent output."* |
| Q7 | "What happens if DeepSeek API down?" | *"Defensive layer: semantic cache + pre-recorded canned response untuk top 10 demo questions. Fallback V4-Flash non-thinking mode kalau V4-Pro fail. Worst case demo flow tetap jalan dengan canned response."* |
| Q8 | "Why DeepSeek, not OpenAI/Anthropic?" | *"DeepSeek V4 punya cost-performance ratio 8-9x lebih murah dibanding GPT-5.5 atau Claude Opus 4.7 untuk equivalent output quality. OpenAI ChatCompletions API compatible, drop-in switch. Free tier Anthropic ga ada, OpenAI rate-limited. DeepSeek paid $5 cover seluruh hackathon scope dengan margin lebar."* |
| Q9 | "Refactor Mode kalau drafts/ folder hilang?" | *"`drafts/` di-track via simulation-id UUID dengan persist ke disk locally, plus event log di Postgres. User boleh resume simulation lewat side panel 'My Drafts' list. Worst case, drafts/ orphan recoverable via simulation-id lookup di event log."* |
| Q10 | "Hosted-DeepSeek China-based, ada data concern?" | *"Source code di-send ke DeepSeek API saat Refactor Mode simulation. User aware via OAuth consent flow + privacy notice. Untuk production deployment dengan compliance requirement, self-host DeepSeek V4-Flash di K8s feasible (MIT license, weights public di HuggingFace). MVP hackathon pakai hosted API."* |

---

## 17. Tech Stack (Locked)

Tech stack di-lock dari pre-event brainstorming + mandatory tech stack Refactory Hackathon. **Tidak boleh ada substitution atau alternative tech stack di hari-H** kecuali ada surprise rule baru dari panitia.

### 17.1. Mandatory Tech Stack per Refactory Rule

Refactory eksplisit list 4 tech stack mandatory di website (Section *"Technologies & Tools"*) + FAQ (*"all are mandatory"*):

| Tech | Status Refactory | Implementation di Codeplex Chronicle |
|---|---|---|
| **OpenSpec** | MANDATORY foundation | Fission-AI/OpenSpec v1.0+ stable, `core` profile, dual-folder strategy per panitia request. Folder A `openspec/` (panitia-facing, canonical layout `openspec/changes/`, `openspec/specs/`, `openspec/archive/`, source: Wave 0 initial spec + scope shift + Refactor Mode product feature change folder). Folder B `.agent-openspec/` (internal workflow, agent output dari Council/Metis/Designer/Orches/Pan + workers, BUKAN consume panitia) |
| **LLMs** | MANDATORY | DeepSeek V4-Flash primary + V4-Pro fallback. NO OpenAI, NO Anthropic API di runtime (Anthropic Claude HANYA di build-time workflow agentic via Max plan) |
| **Kubernetes** | MANDATORY | Pre-provisioned by Refactory, namespace `duopoly`, domain `duopoly.hackathon.sev-2.com` configured ingress. Deploy via Docker image push ke registry + `kubectl apply -f` |
| **PostgreSQL** | MANDATORY | Pre-provisioned by Refactory, credentials di team folder `duopoly`. Cache layer + ticket state + event store untuk cycle time/lead time observability |

### 17.2. Frontend Stack

| Layer | Stack | Version | Notes |
|---|---|---|---|
| **Framework** | Next.js | 16 (App Router) | React 19 dependency satisfied |
| **Language** | TypeScript | 5.x | Strict mode |
| **UI library** | React | 19 | r3f@9 requirement |
| **3D rendering core** | Three.js | 0.184 | Pinned version, NOT auto-update |
| **3D React binding** | @react-three/fiber | 9.6 | Pairing dengan React 19 |
| **3D helpers** | @react-three/drei | latest stable | Environment, Sparkles, OrbitControls, PerspectiveCamera, Outlines |
| **Post-processing** | @react-three/postprocessing | latest stable | EffectComposer dengan Bloom (`mipmapBlur=true`) + DepthOfField + ChromaticAberration + Vignette + Noise + ACES Filmic ToneMapping |
| **Camera animation** | GSAP | 3.x | Timeline-based camera arc untuk cinematic intro + Director Mode auto-fly |
| **Performance overlay** | r3f-perf (`<Perf />`) | latest | Dev mode only, dropped di production build |
| **Styling** | Tailwind CSS | 3.x | Utility-first |
| **Charts (Dashboard View)** | Recharts atau Chart.js | latest | Designer-v1 decide hari-H. Default Recharts karena React-native |
| **GitHub frontend client** | octokit/rest.js | latest | Browser-side OAuth flow |

### 17.3. Backend Stack

| Layer | Stack | Version | Notes |
|---|---|---|---|
| **Language** | Python | 3.12+ | Async/await native |
| **Web framework** | FastAPI | latest stable | Async, OpenAPI auto-doc, WebSocket support untuk real-time streaming |
| **ASGI server** | Uvicorn | latest | Production-grade |
| **Static analysis (multi-language)** | tree-sitter (Python binding) | latest | Grammar mandatory: TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift |
| **Diagram generation** | mermaid-py + graphviz + eralchemy | latest | Internal renderer pipeline, output JSON schema yang city renderer baca |
| **Security detector** | gitleaks pattern + OSV API | latest | Hardcoded secrets + outdated dependency CVE check |
| **GitHub backend client** | PyGithub | latest | Server-side webhook receiver + issue creation |
| **LLM client (DeepSeek)** | openai Python SDK >=1.x | latest | DeepSeek V4 OpenAI-compat API. base_url=`https://api.deepseek.com` |
| **Database ORM** | SQLAlchemy + asyncpg | latest | Async PostgreSQL |
| **Database migration** | Alembic | latest | Schema version control |
| **WebSocket** | FastAPI WebSocket | built-in | Real-time PR-to-Building sync via webhook + simulation streaming |
| **Background task** | FastAPI BackgroundTasks atau Celery | TBD | TBD per Wave 3 decision saat backend implementation |

### 17.4. Auth + GitHub Integration

| Layer | Stack | Notes |
|---|---|---|
| **OAuth provider** | GitHub OAuth App | Gratis, unlimited installation |
| **OAuth scopes** | `read:repo, read:issues, read:pull_requests, read:org, write:issues` | Read-only baseline + selective write untuk Layer 1 hybrid write |
| **Webhook receiver** | FastAPI endpoint dengan signature verification | Events: PR opened/review/merged/closed, issue created/closed |
| **Rate limit** | 5K req/hour per authenticated token | Free tier sufficient untuk demo scope |

### 17.5. Deploy + Infra (Pre-Provisioned by Refactory)

| Layer | Stack | Notes |
|---|---|---|
| **Container** | Docker | Image push ke GitHub Container Registry (ghcr.io) atau Docker Hub |
| **Orchestration** | Kubernetes (managed by Refactory) | Namespace `duopoly`, kubeconfig di team folder |
| **Ingress** | NGINX Ingress (Refactory configured) | Domain `duopoly.hackathon.sev-2.com` HTTPS |
| **Database** | PostgreSQL (Refactory managed) | Credentials di team folder |
| **CI/CD** | GitHub Actions atau manual `kubectl apply` | TBD per Wave 3 implementation |

### 17.6. Workflow Agentic (BUILD-TIME ONLY)

| Layer | Stack | Notes |
|---|---|---|
| **Orchestration** | Claude Opus 4.7 xhigh effort | Default per memory edit Ghaisan. HANYA untuk workflow agentic build (Council -> Metis -> Designer -> Orches -> Pan), BUKAN runtime product |
| **UI prompt platform** | claude.ai/design | Designer-v1 output 3 prompt: Landing Awwwards-tier, Entry, Dashboard |
| **Subscription** | Claude Max plan (Duopoly team) | Covered, no incremental cost |

### 17.7. Cost Analysis

**Product runtime cost** ~$5 paid hackathon scope (Hafiz subscribe DeepSeek API):

| Component | Cost basis | Hackathon estimate |
|---|---|---|
| **DeepSeek V4-Flash** | $0.14 input / $0.28 output per 1M token | ~$0.50-1.00 untuk 24-jam demo + dev + smoke test (semua AI residents query, narration, simple routing) |
| **DeepSeek V4-Pro** | $1.74 input / $3.48 output per 1M token (75% off until 2026-05-31) | ~$1.00-2.00 untuk Refactor Mode multi-turn simulation 1-2 trigger di demo + dev |
| **GitHub API** | Free tier (5K req/hour authenticated) | $0 |
| **Kubernetes** | Pre-provisioned by Refactory (namespace `duopoly`) | $0 |
| **PostgreSQL** | Pre-provisioned by Refactory | $0 |
| **Domain** | Pre-configured `duopoly.hackathon.sev-2.com` | $0 |
| **Build-time eksekusi** | Covered by Claude Max plan subscription | $0 incremental |

**Total estimated**: $2-4 untuk full 24-jam hackathon, well within $5 Hafiz budget. Effective tokens available: ~30 juta input + ~15 juta output di V4-Flash equivalent = far more than demo scope needs.

**No paid Anthropic API**, **no paid OpenAI API**, **no paid hosting**, **no paid GPU**, **no paid database**.

---

## 18. AI Provider Integration: DeepSeek V4

### 18.1. Why DeepSeek V4 (vs Gemini Original Plan)

Idea-draft pre-event lock Gemini 2.5 Flash + Flash-Lite. Ghaisan + Hafiz Day-0 shift ke **pure DeepSeek V4** (Flash + Pro) karena:
- Cost-performance superior (8-9x cheaper output dibanding GPT-5.5/Claude Opus 4.7 di output, ~90x cheaper di Flash)
- OpenAI ChatCompletions API compatible, drop-in switch dari `google-generativeai` SDK ke `openai` SDK
- 1M context window kedua model, sufficient untuk multi-turn Refactor Mode dengan large codebase context
- Dual mode thinking/non-thinking via `extra_body`, plus 3 reasoning effort modes (Non-think / Think High / Think Max)
- Hafiz subscribe $5 = comfortable buffer untuk 24-jam hackathon scope
- Indonesian dev community familiarity dengan DeepSeek growing post-V3 release

### 18.2. Client Setup

**Backend (`backend/app/llm/client.py`)**:

```python
import os
from openai import AsyncOpenAI

deepseek_client = AsyncOpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
)

# Model selection by resident + task
MODEL_FLASH = os.environ.get("DEEPSEEK_MODEL_FLASH", "deepseek-v4-flash")
MODEL_PRO = os.environ.get("DEEPSEEK_MODEL_PRO", "deepseek-v4-pro")
```

Drop-in pattern: same client used across all residents, only `model` + `reasoning_effort` + `extra_body` vary per use case.

### 18.3. Model Selection Strategy per Resident

| Resident | Default Model | Default Mode | Reasoning Effort | Notes |
|---|---|---|---|---|
| Athena (Architect) | `deepseek-v4-pro` | thinking | high | Refactor proposal author, butuh deep reasoning |
| Apollo (Doctor) | `deepseek-v4-flash` | non-thinking | n/a | Wrap deterministic detector output jadi prosa, no reasoning needed |
| Argus (Watcher) | `deepseek-v4-flash` | thinking | low | CVSS scoring + exploit pattern, light reasoning |
| Clio (Historian) | `deepseek-v4-flash` | non-thinking | n/a | Narration straightforward, no reasoning |
| Hermes (Guide) | `deepseek-v4-flash` | non-thinking | n/a | Tour script wrap, no reasoning |
| Refactor simulation engine | `deepseek-v4-pro` | thinking | high (max for complex) | Multi-turn coordination (test gen + impl gen + diff serialize) |

### 18.4. Defensive Code Pattern

Pattern wrap tiap LLM call dengan defensive layer (replace Gemini-specific MALFORMED_FUNCTION_CALL handling dari idea-draft):

```python
async def call_with_fallback(messages, prefer_pro=False, max_retries=2):
    """
    Defensive wrapper dengan:
    1. Semantic cache check (cosine similarity 0.85 threshold)
    2. Primary model call (V4-Pro kalau prefer_pro, else V4-Flash)
    3. Retry simplified prompt kalau fail
    4. Fallback ke other model
    5. Fallback ke canned response (top 10 demo questions pre-cached)
    """
    # 1. Semantic cache
    cached = await semantic_cache.lookup(messages, threshold=0.85)
    if cached:
        return cached
    
    primary_model = MODEL_PRO if prefer_pro else MODEL_FLASH
    fallback_model = MODEL_FLASH if prefer_pro else MODEL_PRO
    
    for attempt in range(max_retries):
        try:
            response = await deepseek_client.chat.completions.create(
                model=primary_model,
                messages=messages,
                stream=False,
                reasoning_effort="high" if prefer_pro else "low",
                extra_body={"thinking": {"type": "enabled" if prefer_pro else "disabled"}},
                timeout=30.0,
            )
            
            # Validate finish_reason + content
            if response.choices[0].finish_reason not in ("stop", "length"):
                raise ValueError(f"Bad finish_reason: {response.choices[0].finish_reason}")
            
            content = response.choices[0].message.content
            if not content or not content.strip():
                raise ValueError("Empty content")
            
            await semantic_cache.store(messages, content)
            return content
        
        except Exception as e:
            logger.warning(f"DeepSeek attempt {attempt} failed: {e}")
            # Simplified prompt for retry
            if attempt == 0:
                messages = simplify_prompt(messages)
            continue
    
    # Fallback to other model
    try:
        response = await deepseek_client.chat.completions.create(
            model=fallback_model,
            messages=messages,
            stream=False,
            timeout=15.0,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"DeepSeek fallback failed: {e}")
    
    # Final fallback: canned response
    return canned_response_lookup(messages) or DEFAULT_FALLBACK_TEXT
```

### 18.5. Canned Response Pre-Cache (Top 10 Demo Questions)

Pre-cache pakai semantic similarity (sentence-transformer embedding di backend init):

1. *"Give me a 30-second tour"* -> Hermes generic tour
2. *"Show me last 24h activity"* -> Activity Mode hotspot summary
3. *"What's wrong?"* -> Apollo critical finding summary (NodeGoat 5/5 fire)
4. *"Add 2FA to login flow"* -> Athena 3 ghost building proposal (auth/oauth.ts, auth/totp.ts, auth/middleware.ts) + OpenSpec change folder
5. *"Tour for sprint goal"* -> Hermes scoped tour Sprint 14 Security
6. *"Convert this finding to backlog ticket"* -> Apollo evidence chain + GitHub issue draft
7. *"Why is auth/oauth.ts cracked?"* -> Clio Pattern A narration
8. *"Run simulation for 2FA proposal"* -> DeepSeek multi-turn simulation pre-recorded result
9. *"Show me velocity for sprint 14"* -> Dashboard velocity panel data
10. *"What's the contributor heatmap for payment district?"* -> Activity Mode ownership summary

Demo flow harus prioritize hit cache (latency < 100ms) over live call (latency 1-3s) untuk smooth pitch.

### 18.6. Rate Limit + Throttle

DeepSeek rate limit per API docs: default 60 RPM per account, paid tier may scale higher. Hafiz $5 subscribe assumed paid tier.

Defensive throttle backend:
- Client-side: max 5 concurrent in-flight requests
- Server-side: 30 RPM cap per session (semaphore)
- Backoff: exponential 1s -> 2s -> 4s -> 8s -> 16s, max 5 retries
- Circuit breaker: 5 consecutive failures -> 60s cooldown, fallback ke canned only

### 18.7. Cost Tracking

PostgreSQL event store table `llm_call_log`:
- timestamp
- model
- input_tokens (from response.usage.prompt_tokens)
- output_tokens (from response.usage.completion_tokens)
- cost_estimate_usd (computed from model + tokens)
- session_id
- resident_id

Real-time cost dashboard (optional, kalau time allow) di Dashboard View "DeepSeek Spend This Session".

---

## 19. Security Analysis

Per arahan Ghaisan eksplisit, security section detail. Codeplex Chronicle handle source code user via OAuth, surface findings yang security-sensitive (CVE, hardcoded secret, missing auth), execute Refactor Mode simulation yang generate code, deploy ke shared K8s cluster. Threat surface lebar, mitigation harus eksplisit.

### 19.1. Threat Model

**Assets**:
1. User source code (read via GitHub OAuth, parse di backend)
2. GitHub OAuth access token (write:issues scope)
3. DeepSeek API key (`sk-90...`, throwaway hackathon account, $5 budget)
4. PostgreSQL credentials (Refactory pre-provisioned, in K8s Secret)
5. User session (browser cookie, OAuth-bound)
6. Refactor Mode generated code di `drafts/` folder

**Threat actors**:
- External attacker (Internet-facing domain `duopoly.hackathon.sev-2.com`)
- Malicious user (legitimate OAuth flow, attempt to abuse)
- Curious cohabitant (other Refactory teams sharing K8s cluster)
- Compromised DeepSeek inference (3rd party trust boundary)

**Threats (STRIDE-ish)**:

| Threat | Asset at risk | Mitigation |
|---|---|---|
| **S - Spoofing**: attacker forge OAuth callback | User session | OAuth state parameter (CSRF protection), PKCE flow |
| **T - Tampering**: webhook payload tampered | Event store integrity | HMAC `X-Hub-Signature-256` signature verification per request |
| **R - Repudiation**: user denies action (e.g., Accept simulation that broke prod) | Audit trail | Event store Postgres immutable log, simulation-id traceable |
| **I - Information Disclosure**: source code leak via DeepSeek inference | User source code | Privacy notice + OAuth consent, no PII scrubbing in MVP (limitation disclosed) |
| **D - DoS**: rate limit exhaustion | Service availability | Client + server throttle, circuit breaker, GitHub API rate limit handle gracefully |
| **E - Elevation of Privilege**: privilege escalation via misconfigured RBAC | K8s namespace | Refactory-managed namespace `duopoly`, no cross-namespace access |

### 19.2. Secrets Management

**`.env` (local development)**:
- Mode 600 (owner read/write only, set via `chmod 600 .env` post-scaffold)
- Listed di `.gitignore` (never committed)
- Real DeepSeek key + future GitHub OAuth secrets

**Production (K8s)**:
- All secrets sourced from K8s Secret object (NOT ConfigMap which is plaintext)
- Mount as env var di Pod spec
- Refactory PostgreSQL credentials di team folder -> create K8s Secret via `kubectl create secret generic duopoly-db --from-literal=...`
- DeepSeek API key di K8s Secret `duopoly-deepseek`
- GitHub OAuth client secret di K8s Secret `duopoly-github-oauth`
- Audit: `kubectl describe secret` shows metadata only, no values

**Rotation strategy** (post-hackathon Phase 2):
- DeepSeek throwaway account replaced post-event
- GitHub OAuth secret rotated via GitHub App settings
- Webhook secret regenerated saat OAuth client rotated

**Anti-pattern (eksplisit DON'T)**:
- Hard-code key di Docker image (visible di `docker history`)
- Pass secret via CLI argument (visible di `ps aux`)
- Log secret di application log (grep risk)
- Echo secret di error message ke client (XSS exfiltration risk)

### 19.3. GitHub OAuth Scope Minimization

**Requested scopes** (minimum sufficient):
- `read:repo`: read repo metadata, file content, branches
- `read:org`: read user org membership untuk CODEOWNERS attribution
- `read:issues`: read issue + milestone untuk Sprint Mode
- `read:pull_requests`: read PR + review + comment untuk Sprint Mode
- `write:issues`: CREATE issue only (NOT delete, NOT edit other user's issue) untuk Hybrid Write Layer 1

**NOT requested**:
- `repo` (write code) -> NOT needed, Refactor Mode write ke `drafts/` local, NOT user repo
- `admin:org`, `admin:repo_hook` -> NOT needed
- `delete_repo`, `delete:packages` -> NOT needed
- `user:email` -> NOT needed, OAuth username sufficient

**Consent flow**:
1. User klik "Login with GitHub" di Codeplex Chronicle entry page
2. Redirect ke `https://github.com/login/oauth/authorize?client_id=...&scope=read:repo,read:org,read:issues,read:pull_requests,write:issues&state=<csrf_token>`
3. GitHub display consent screen dengan scope list
4. User approve -> redirect to callback `https://duopoly.hackathon.sev-2.com/auth/callback?code=...&state=<csrf_token>`
5. Backend exchange code for access token, verify state == csrf_token (CSRF protection)
6. Store token in session (server-side, HTTP-only cookie) atau encrypted browser session storage

### 19.4. DeepSeek 3rd-Party Trust Boundary

**What gets sent to DeepSeek inference**:
- Refactor Mode: proposal text + design + tasks + file content excerpt (NOT full repo, only affected files)
- AI residents query: user query text + structured context (deterministic detector output)
- Multi-turn simulation: test code + implementation code (generated by DeepSeek itself, sent back for next turn)

**Privacy + compliance considerations**:
- DeepSeek China-based provider, data residency in China per public docs
- DeepSeek terms: per their privacy policy, training data usage for paid tier varies; check current ToS hari-H
- User source code is sensitive IP; for production deployment with compliance requirement (PDP Law UU 2022 Indonesia, GDPR equivalent), self-host DeepSeek V4-Flash di K8s feasible (MIT license, weights public di HuggingFace)
- MVP hackathon scope: hosted API, user aware via OAuth consent flow + privacy notice di entry page

**Privacy notice content** (entry page):
> *"By using Codeplex Chronicle, you acknowledge that code from your selected repository will be sent to DeepSeek inference API (hosted in China) for analysis and refactor proposal. No code is stored long-term by Codeplex Chronicle or DeepSeek beyond the duration of the inference request. For compliance-sensitive use cases, self-hosted DeepSeek deployment is available (contact team)."*

**Data minimization**:
- Only send affected files (NOT full repo) to DeepSeek
- Truncate file content above N lines (configurable, default 500 lines) untuk reduce token + reduce leak surface
- Strip comments yang mengandung PII pattern (email, phone, address) via regex pre-send (best effort, MVP)

### 19.5. Refactor Mode Sandbox Isolation

**Critical safety property**: production code di repo user NEVER changes via Codeplex Chronicle until user explicit click `"Accept changes"` di review gate 2.

**Implementation**:
- DeepSeek multi-turn output write ke `drafts/<simulation-id>/` folder di backend filesystem, NOT user's repo
- `drafts/` folder di-isolate per session_id (FK ke OAuth user)
- Backend never has `repo` scope (write code), only `write:issues` (issue create only)
- "Accept changes" flow:
  1. User confirm via UI button
  2. Backend read `drafts/<simulation-id>/`
  3. Backend output diff file via download endpoint (user save manually) OR generate PR via GitHub API (requires upgraded OAuth scope, NOT in MVP)
  4. MVP: download diff approach, user apply locally via `git apply`
- Audit: every Accept event logged di event store dengan simulation-id, user-id, timestamp, file list

**`drafts/` folder cleanup**:
- TTL: 24h post-simulation (cron job di backend)
- Cleanup on session end (OAuth token expire)
- Manual cleanup via "My Drafts" panel `Delete draft` button

### 19.6. SQL Injection Prevention

All Postgres queries via SQLAlchemy parameterized ORM (NOT raw string concatenation). Code review checklist: any `text()` raw SQL must use `:param` placeholder, never f-string interpolation.

**Anti-pattern (eksplisit DON'T)**:
```python
# DON'T: SQL injection risk
session.execute(f"SELECT * FROM events WHERE user_id = '{user_id}'")

# DO: parameterized
session.execute(text("SELECT * FROM events WHERE user_id = :uid"), {"uid": user_id})
```

### 19.7. XSS Prevention (Frontend)

React 19 default escape JSX expressions. Anti-pattern eksplisit:
- DON'T use `dangerouslySetInnerHTML` for user-generated content
- DON'T render LLM output directly as HTML
- DO render LLM output as plain text via `{content}` JSX (React escapes by default)
- DO sanitize Markdown rendering via `react-markdown` with `rehype-sanitize` plugin (if Markdown features needed)

### 19.8. CSRF Prevention

- OAuth flow uses `state` parameter (random nonce, verified on callback)
- API endpoints that mutate state require `Authorization: Bearer <token>` header (SameSite cookie alternative)
- CORS configuration: `Access-Control-Allow-Origin: https://duopoly.hackathon.sev-2.com` only (NOT wildcard)

### 19.9. Webhook Signature Verification

GitHub webhook send `X-Hub-Signature-256` header dengan HMAC SHA-256 of payload + secret. Backend MUST verify before processing:

```python
import hmac, hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

Reject payload (HTTP 401) kalau signature invalid. Prevent spoofed webhook from external attacker.

### 19.10. K8s Pod Security

- Run container as non-root user (Dockerfile `USER 1000:1000`)
- Read-only filesystem where possible (`securityContext: { readOnlyRootFilesystem: true }`), writable volume mount only for `drafts/` + cache
- `runAsNonRoot: true`, `allowPrivilegeEscalation: false`
- Resource limits (memory + CPU) set di Pod spec untuk prevent noisy neighbor di shared cluster
- NetworkPolicy: ingress only from NGINX Ingress, egress to DeepSeek API + GitHub API + Postgres only

### 19.11. HTTPS Termination

- All traffic via HTTPS (Refactory NGINX Ingress configured)
- HSTS header (`Strict-Transport-Security: max-age=31536000; includeSubDomains`)
- TLS 1.2+ only
- No mixed content (all assets via HTTPS)

### 19.12. Audit Logging

PostgreSQL event store:
- All OAuth events (login, logout, scope_grant, scope_revoke)
- All write events (issue created via Hybrid Layer 1, simulation accepted via Layer 2)
- All LLM call events (model, tokens, cost)
- All webhook events (PR/issue updates)

Retention: 7 days post-hackathon (Refactory cluster TTL), exported to local archive for evaluation.

### 19.13. Compliance Notes

**PDP Law UU 2022 (Indonesia)**:
- User consent obtained via OAuth flow (explicit scope grant)
- Privacy notice di entry page (Section 19.4)
- Data minimization (only affected files sent to DeepSeek, not full repo)
- Right to erasure: user can revoke OAuth token via GitHub settings, all session data deleted on token expire
- Cross-border transfer: source code sent to DeepSeek (China) -> noted in privacy notice, user acknowledges

**Limitations disclosed (MVP)**:
- No SOC2/ISO27001 certification (hackathon scope)
- No formal threat model review beyond this PRD section
- No penetration testing
- No DLP (Data Loss Prevention) beyond regex-based PII scrub (best effort)

---

## 20. Non-Functional Requirements

### 20.1. Performance

| Metric | Target | Measurement |
|---|---|---|
| **Frontend FPS** | 60fps sustained on M-series MacBook Pro demo laptop | r3f-perf `<Perf />` overlay dev mode |
| **Cold load TTI** | < 5 seconds dengan pre-cached parser output | Lighthouse atau manual stopwatch |
| **Pre-cached parser load** | < 500ms per repo (300 building treemap) | tree-sitter benchmark Wave 0 |
| **PR-to-Building sync latency** | < 5 seconds dari GitHub webhook ke building state change | E2E test webhook -> WebSocket -> UI |
| **LLM TTFT** | < 1.5s (cached) / < 3s (live V4-Flash) / < 8s (V4-Pro thinking) | DeepSeek client log |
| **Refactor simulation duration** | < 60s end-to-end (3 turns DeepSeek multi-turn) | Simulation event log |
| **GitHub API rate limit usage** | < 50% of 5K/hour authenticated quota | GitHub API response headers |

### 20.2. Reliability

| Metric | Target | Measurement |
|---|---|---|
| **Demo flow 3x consecutive successful run** | Pre-demo rehearsal gate | Manual smoke test |
| **LLM call success rate** | > 95% (with defensive layer) | DeepSeek client log + circuit breaker |
| **Webhook delivery latency** | < 5s p95 | Event store latency analysis |
| **K8s pod uptime during demo window** | 100% (Day 2 jam 14-17) | Refactory cluster monitoring |

### 20.3. Scalability (Theoretical, Untested)

| Metric | Target | Notes |
|---|---|---|
| **Building count** | 200-300 demo, 10K+ theoretical with LOD aggressive | r3f research feasible, production untested |
| **Concurrent users** | 1 (demo single user via OAuth) | MVP single-tenant |
| **Repo size** | 50-300 files demo, 1K files theoretical | NodeGoat 80-120, FastAPI template 150-250 |

### 20.4. Usability

| Aspect | Requirement |
|---|---|
| **Browser support** | Chrome/Edge latest, Safari 17+ (M-series demo laptop) |
| **Demo laptop spec** | M-series MacBook Pro, 16GB+ RAM, integrated graphics sufficient |
| **Onboarding zero-config** | OAuth flow auto-detect first-time user, show entry page |
| **Mobile responsive** | NOT in MVP (desktop demo only) |

### 20.5. Maintainability

| Aspect | Requirement |
|---|---|
| **Code style** | TypeScript strict mode, Python type hints, prettier + ruff format |
| **Test coverage** | > 50% on detector logic (deterministic, easier to test); LLM calls mocked in tests |
| **Documentation** | This PRD + C4 diagrams (Wave 0 generate) + OpenSpec Folder A spec |
| **Naming convention** | Greek mythology for AI residents (Athena/Apollo/Argus/Clio/Hermes); workflow agentic also Greek (Athena/Pythia/Hephaestus/Themis/Eunomia/Dike/Aletheia/Pan) |

### 20.6. Observability

| Signal | Source | Use |
|---|---|---|
| **Cycle time** | Event store (PR opened -> merged) | Dashboard View velocity panel |
| **Lead time** | Event store (issue created -> closed) | Dashboard View milestone progress |
| **LLM cost** | DeepSeek event log | Cost dashboard optional, demo evidence |
| **Spec-drift active** | Detector output | Dashboard View drift summary |
| **Refactor proposal status** | Event store (proposed/applied/archived/stale) | Dashboard View refactor panel |

---

## 21. Acceptance Criteria per Feature

### 21.1. AC-Onboarding Mode

- [ ] Hermes building clickable, opens chat panel within 200ms
- [ ] Type intent `"give me a 30-second tour"` triggers camera fly automation
- [ ] Camera fly traverses 3 distinct districts within 30s
- [ ] At least 3 buildings glow during fly-through (one per district)
- [ ] Ending summary text rendered in Hermes chat panel
- [ ] Sprint-goal-scoped tour: type variant `"tour for sprint X"`, camera fly traverses sprint-affected districts only
- [ ] User-scoped tour: type variant `"tour as @username"`, camera fly traverses user's owned/frequent districts

### 21.2. AC-Sprint Mode (HERO)

- [ ] Sprint Mode toggle in top nav, switches without page reload
- [ ] Active milestone sprint goal displayed as banner on City Hall building
- [ ] Scaffolding renders on buildings with active ticket (Issue with `in-progress` label)
- [ ] Crane renders on buildings with open PR
- [ ] Inspector NPC orbits buildings with `review_requested` state
- [ ] PR comment surfacing visual (Designer-v1 final approach) renders for unresolved comments
- [ ] Click building opens ticket panel within 300ms
- [ ] Ticket panel shows assignee, story points (parsed from `size:S/M/L/XL` label), status, linked PR
- [ ] Webhook PR_opened event propagates crane visual within 5s p95
- [ ] Webhook PR_merged event clears scaffolding within 5s p95
- [ ] View toggle (City <-> Dashboard) without page reload
- [ ] Dashboard View renders velocity chart + burndown + milestone progress + contributor analytics
- [ ] Backlog Office building visible in city, click opens backlog panel sorted by priority

### 21.3. AC-Refactor Mode (SAFETY-FIRST)

- [ ] Refactor Mode toggle in top nav
- [ ] Type intent (e.g., `"add 2FA to login"`) triggers Athena think animation
- [ ] Within 10s, 3 ghost buildings appear (animated dashed outline, transparent)
- [ ] Side panel auto-generates `proposal.md`, `design.md`, `tasks.md` content live streamed
- [ ] `"Run Simulation"` button enabled after side panel content render complete
- [ ] Click `"Run Simulation"` triggers DeepSeek multi-turn coordination
- [ ] Real-time progress UI: tests written, implementation lands, ghost-to-solid frame-by-frame
- [ ] Simulation complete: ghost buildings fully solid, 2 buttons (Accept / Done viewing) render
- [ ] Click `"Done viewing simulation"`: production code unchanged, simulation persists in `drafts/`
- [ ] Click `"Accept changes"`: diff downloadable via download endpoint OR PR created (if scope permits)
- [ ] `drafts/<simulation-id>/` folder visible in "My Drafts" panel
- [ ] Resume simulation flow: click draft in panel, reopens side panel + ghost building state

### 21.4. AC-Activity Mode

- [ ] Activity Mode toggle in top nav
- [ ] Ownership heatmap renders per district (color by primary contributor)
- [ ] Hotspot buildings glow intensity proportional to edit frequency
- [ ] Timeline scrubber slider (last 30/60/90 days)
- [ ] Scrub triggers visual update within 500ms

### 21.5. AC-Health Mode

- [ ] Health Mode toggle in top nav
- [ ] 5 deterministic detector run on demo dataset (NodeGoat fires all 5)
- [ ] Buildings with finding glow color-coded (red/orange/yellow)
- [ ] Click Apollo opens findings panel listing all findings
- [ ] Click specific finding opens evidence panel with file path + line number + static analysis output + suggested mitigation
- [ ] `"Convert to Backlog Ticket"` button creates GitHub issue with evidence chain pre-filled
- [ ] Animation: issue flies from finding building to Backlog Office building
- [ ] GitHub native confirmation visible in adjacent browser tab (or via deep link)

### 21.6. AC-Spec-Drift Detection

- [ ] 5 retak patterns (A-E) run on demo dataset (FastAPI template fires Patterns A + D + E via Day-0 prep)
- [ ] Retak buildings render crack visual pattern per pattern type
- [ ] Click cracked building triggers Clio narration prose
- [ ] Narration includes deterministic metadata (timestamp, edit count, reviewer)
- [ ] Ghost building renders for proposal/issue referencing non-existent path

### 21.7. AC-Submission Deliverable

- [ ] PRD-ideaLocked_codeplex-chronicle.md authored and committed to repo
- [ ] PRD PDF version generated (post-lock)
- [ ] C4 diagram authored (4 levels Context-Container-Component-Code optional) committed to `docs/c4/`
- [ ] Repository link github.com/Finerium/codeplexRefactory accessible
- [ ] Slide deck authored by Hafiz, committed to `slides/`
- [ ] All 4 deliverables submitted by Day 2 jam 13:00 WIB

---

## 22. Success Criteria + KPIs

(Refactory minimum: Success Criteria)

### 22.1. Hard Success Criteria (Must-Have for Ship)

| # | Criterion | Verification |
|---|---|---|
| **SC-01** | Deployed product accessible at `https://duopoly.hackathon.sev-2.com` | Browser visit, HTTP 200, app loads |
| **SC-02** | 5 product modes operational (Onboarding, Sprint, Refactor, Activity, Health) | Demo flow 2-min walkthrough |
| **SC-03** | 5 AI residents operational (Athena, Apollo, Argus, Clio, Hermes) | Click each landmark, chat response within 5s |
| **SC-04** | Demo flow 3x consecutive successful run | Pre-demo rehearsal Day 2 jam 13-15 |
| **SC-05** | OpenSpec Folder A panitia-facing populated with feature spec | `ls openspec/changes/` shows entries, `openspec/specs/` non-empty |
| **SC-06** | C4 diagram in `docs/c4/` formal + detail + jelas | Visual inspection |
| **SC-07** | PRD + slide deck submitted by Day 2 jam 13:00 | Submission portal confirmation |
| **SC-08** | Smoke test passes (E2E user flow without crash) | Automated test suite + manual |

### 22.2. Soft Success Criteria (Differentiation, Not Mandatory)

| # | Criterion | Verification |
|---|---|---|
| **SS-01** | Visual quality bar baseline shipped (glowing windows + fog + 3-tier Sparkles + post-processing pipeline + camera idle drift) | Visual inspection |
| **SS-02** | Stretch Tier 1 shipped (cinematic intro + verticality skyscraper + iconic landmark + Director mode auto-fly) | Visual inspection |
| **SS-03** | Hybrid Write Layer 1 + Layer 2 both operational | Demo flow trigger |
| **SS-04** | PR-to-Building real-time webhook < 5s latency | Latency log analysis |
| **SS-05** | Closing slide bonus screenshot (Tokopedia/Gojek) rendered | Visual inspection slide |

### 22.3. KPIs (Tracked During + Post-Demo)

| KPI | Target | Source |
|---|---|---|
| Pitch defensibility (Q&A handled) | >= 8 of 10 prepared questions answered confidently | Self-assessment + Hafiz observation |
| Visual quality juri perception | Strong positive feedback during pitch | Q&A engagement signal |
| Tech execution juri perception | Recognition of mandatory tech stack compliance | Q&A engagement signal |
| Top 5 finalist | Make it to Day 2 jam 15-17 pitch round | Mentor announcement |
| Top 3 winner | 1st/2nd/3rd place podium | Day 2 jam 19:00 announcement |

---

## 23. Risk Register

Risk that hasn't been fully mitigated, ranked by severity + likelihood. P prefix = Pre-event identified (idea-draft Section P), D prefix = DeepSeek-shift new risks.

### 23.1. Critical Risk (HIGH PRIORITY)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **D1** | DeepSeek V4-Pro thinking mode unexpectedly verbose (per Artificial Analysis 4x reasoning token), $5 budget burn faster than expected | Medium | Medium ($5 budget) | Cost tracking dashboard real-time, fallback ke V4-Flash if budget approaches $4 |
| **D2** | DeepSeek multi-turn coordination fail mid-simulation (analog Gemini MALFORMED_FUNCTION_CALL but DeepSeek-specific failure mode TBD) | Medium | High (Refactor Mode demo) | Defensive layer Section 18.4, retry simplified prompt, fallback Flash, fallback canned response, drop Layer 2 protocol Section 12.4 |
| **P11** | K8s deploy first-try success | Medium | High (no demo) | Hafiz familiarize K8s + dockerize sample app Day 0 prep mandatory. Mitigation: Day 0 dry run mandatory |
| **P12** | WiFi venue Telkom University reliability | Medium-High | High (demo run live needs internet) | Pre-load demo dataset cache di Postgres + browser session storage. Worst case offline mode minimal (canned response semua AI residents). Personal Wi-Fi hotspot per Refactory rule |

### 23.2. Medium Priority

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **P3** | Iris dropped, narration distribute ke 3 resident. Prompt design 3 resident handle multi-context narration, BUKAN dedicated narrator | Low-Medium | Low-Medium | Test prompt clarity Wave 2, hindari confusion role |
| **P4** | PR comment surfacing visual approach (3 candidate sticky note / floating bubble / marker pin). Designer-v1 decide, risk visual approach kompete dengan PM overlay layer existing | Medium | Low | Designer-v1 hari-H pakai check overlap dengan existing scaffolding+crane+banner |
| **P5** | Demo dataset agile data realism, juri detect "fake data" | Medium | Medium | Fictional user dengan realistic name+avatar, commit timeline disperse, comment thread realistic |
| **P6** | Earthquake error visual trigger condition not precisely defined | Low | Low (stretch feature) | Wave 1 spec saat detector output integration, default trigger Apollo critical finding cluster + Pattern E commit hook bypass |
| **P8** | Multi-language tree-sitter performance: 11 grammar load, cold start slow, memory bloat | Medium | Medium (parse latency) | Lazy load grammar per repo language detected, cache parser instance, benchmark Wave 0 |
| **P9** | r3f performance ceiling 200-300 building + flying car + post-pipeline + 3-tier Sparkles. End-to-end benchmark stack-specific BELUM tested | High | Medium | Day 1 Wave 0 benchmark via `<Perf />`, drop feature flag kalau regress |
| **D3** | DeepSeek China-based provider, source code data residency concern di Q&A juri | Low | Low | Defense card Q10 prepared (privacy notice + self-host alternative). MVP hackathon acceptable |
| **D4** | DeepSeek API rate limit ditemukan saat demo (default 60 RPM, paid tier scale tbd) | Low | Medium | Client+server throttle, circuit breaker, exponential backoff, fallback canned |

### 23.3. Low Priority

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **P13** | Pitch language Indonesian primary + English code-switch awkward | Low | Low | Rehearsal Day 2 jam 13-15 wait announcement window |
| **D5** | DeepSeek API key (`sk-90...`) leak via accidental commit (di chat history sudah ke-share) | Low | Medium (throwaway account) | Key throwaway, post-hackathon rotate. `.env` gitignored, mode 600 |
| **D6** | DeepSeek deprecation legacy `deepseek-chat`/`deepseek-reasoner` 2026-07-24 affect production post-hackathon | Low | Low | Eksplisit pakai `deepseek-v4-flash`/`deepseek-v4-pro` di env, no legacy aliases |

### 23.4. Resolved Pre-Event (Documented for Audit)

| # | Risk (resolved) | Resolution |
|---|---|---|
| P1 | Refactory rules formal compliance | RESOLVED via panitia distribution `RefactoryHackathonRules&FAQ.txt`. Codeplex Chronicle comply (Section 24) |
| P2 | Round 02 UNAIR winner pattern | Topic C research_finding.md adequate, no additional research per Council Phase D scope cut |
| P7 | Gemini multi-turn coordination (idea-draft) | Replaced by DeepSeek V4 multi-turn (D2 above), Gemini risk retired |
| P10 | Gemini MALFORMED_FUNCTION_CALL | Replaced by DeepSeek-equivalent failure mode (D2 above), defensive layer Section 18.4 |

---

## 24. Constraints + Dependencies

### 24.1. Refactory Hackathon Rules Compliance (per `RefactoryHackathonRules&FAQ.txt`)

**Eligibility + Team**: Ghaisan + Hafiz both <= 28 years (comply). Team size 2 (within 2-4 limit). Individual not allowed (Duopoly = 2, comply). Team name "Duopoly" respectful (no SARA, no provocative, comply). Both must physically attend final presentation (Hafiz physically present Day 2 mandatory).

**Build Constraint**:
- All projects developed during hackathon (open-source libraries allowed). Comply.
- NO pre-existing non-open-source code. Comply (all deps open-source: Next.js MIT, FastAPI MIT, tree-sitter MIT, OpenSpec MIT, DeepSeek MIT weights).
- NO outsourcing. Comply (no external developer involvement).
- NO receiving help from outside team. Comply (only Ghaisan + Hafiz operate).
- NO plagiarism. Comply (all design original, idea-draft Ghaisan + Hafiz pre-event 9-10 May).

**Tech Stack Mandate** (KRITIS):
- Per FAQ: *"Yes, all are mandatory. Except for mobile, choose one (Android or iOS)."*
- Refactory list: OpenSpec, LLMs, Kubernetes, PostgreSQL. All 4 used (Section 17). No mobile (web SPA only, mobile FAQ note not applicable).

**Code of Conduct**:
- NO external coaches/mentors. Comply.
- Quiet hours 10 PM WIB (if overnight). Comply.
- NO smoking, alcohol, drugs, sexual activity di venue. Comply.
- Wear lanyard, bring ID. Comply.

**Logistics**:
- Personal Wi-Fi hotspot recommended -> bring (P12 mitigation).
- Sleeping bag, toiletries, pillow, blanket -> bring sendiri.

**Submission**:
- PRD: this document.
- C4 diagram: Wave 0 Claude Code agent generate.
- Link repo: github.com/Finerium/codeplexRefactory (Wave 0 init by Claude Code).
- Slide presentasi: Hafiz handle Day 2 jam 11-13.

### 24.2. Technical Constraints

- Must run on free-tier (kecuali DeepSeek $5 paid). No paid hosting, no paid GPU, no paid database.
- Demo laptop: M-series MacBook Pro, 16GB+ RAM (typical Hafiz/Ghaisan dev setup).
- Browser: Chrome/Edge latest atau Safari 17+.
- Internet required (DeepSeek API + GitHub API). Offline degrade ke canned response.

### 24.3. Regulatory Constraints

- **PDP Law UU 2022 (Indonesia)**: user consent via OAuth, privacy notice, data minimization, right to erasure (Section 19.13).
- **OSS license compliance**: all deps MIT/Apache-2.0 compatible, no copyleft GPL. Codeplex Chronicle license TBD post-hackathon (likely MIT or Apache-2.0).
- **GitHub ToS**: API usage within rate limit, no scraping public data without OAuth, no automated content generation that violates GitHub Terms.
- **DeepSeek ToS**: usage within paid tier scope, no abuse, content yang di-send subject to DeepSeek terms.

### 24.4. Capacity Constraints

- Operator: Ghaisan + Hafiz (2 person, gantian sleep cycle).
- Build time: 24 jam hard ceiling (12 Mei 13:00 - 13 Mei 11:00 WIB).
- No human coding intervention (hands-off mode), all execution via Claude Code workers.
- Budget DeepSeek: $5 hackathon-throwaway account, ~$2-4 effective spend estimate (Section 17.7).

### 24.5. Dependencies (External)

| Dependency | Provider | Critical Path | Fallback |
|---|---|---|---|
| GitHub API | github.com | Yes (OAuth + read + write:issues) | Rate limit graceful degrade, demo dataset cached |
| DeepSeek API | api.deepseek.com | Yes (all 5 residents + Refactor Mode) | V4-Flash fallback if V4-Pro fail, canned response top 10 questions |
| Kubernetes cluster | Refactory managed | Yes (deploy target) | Local dev fallback via docker-compose (NOT for demo) |
| PostgreSQL | Refactory managed | Yes (event store) | In-memory store fallback (NOT for demo, audit trail lost) |
| Domain `duopoly.hackathon.sev-2.com` | Refactory pre-configured | Yes (demo URL) | No fallback (Refactory promise) |
| OpenSpec CLI | npm @fission-ai/openspec | Yes (Folder A panitia-facing) | None, mandatory per Refactory rule |
| tree-sitter Python binding | PyPI | Yes (parser) | None, no alternative multi-language parser |
| Three.js 0.184 + r3f@9 | npm | Yes (3D rendering) | None pinned version |
| OWASP NodeGoat fork | github.com/duopoly | Yes (demo dataset) | PyGoat fallback (Day-0 prep) |

---

## 25. Open Questions (V1 Orch/Metis Handle in Execution)

Council ga resolve di session ini, legitimate untuk downstream skill chain handle:

| # | Question | Owner | Defer reason |
|---|---|---|---|
| **OQ-01** | Background task framework: FastAPI BackgroundTasks vs Celery | V1 Orch Wave 3 | Decide based on async complexity di backend integration phase |
| **OQ-02** | Charts library Dashboard View: Recharts vs Chart.js | Designer-v1 hari-H | Decide based on Prompt 3 output fit + ease of integration |
| **OQ-03** | UI library: shadcn vs Mantine vs custom Tailwind | Designer-v1 hari-H | Decide via claude.ai/design output style |
| **OQ-04** | CI/CD: GitHub Actions vs manual `kubectl apply` | V1 Orch Wave 3 | Decide based on time budget remaining |
| **OQ-05** | PR comment surfacing visual approach (3 candidate) | Designer-v1 hari-H | Decide based on Wave 1-2 visual baseline overlap check |
| **OQ-06** | Earthquake error visual precise trigger condition | V1 Orch Wave 1 | Decide saat detector output integration |
| **OQ-07** | DeepSeek V4-Pro vs V4-Flash optimal split per resident finer tuning | V1 Orch Wave 2-3 | Decide based on smoke test latency + quality |
| **OQ-08** | Pre-cached top 10 demo questions exact list | V1 Orch Wave 2-3 | Decide based on demo flow finalization |
| **OQ-09** | Refactor Mode "Accept changes" implementation: download diff vs PR create | V1 Orch Wave 3 | MVP = download diff, PR create requires upgraded OAuth scope (Phase 2) |
| **OQ-10** | C4 diagram tooling: Mermaid vs PlantUML vs draw.io vs custom SVG | V1 Orch Wave 0 (Claude Code) | Decide based on output fidelity to "formal + detail + jelas" mandate |

---

## 26. Workflow + Downstream Handoff

PRD ini canonical idea-locked source of truth, consumed by **4-skill chain downstream**:

```
council-v1 (this skill, current session)
    |
    | PRD-ideaLocked attached
    v
(fork paralel, Ghaisan run sequential per session)
   /                                            \
  /                                              \
designer-v1                                   metis-v1
(optional, 3 prompt:                          (mandatory, agentic structure)
 Landing + Entry + Dashboard;                  output: Deep Research artifact
 City View NOT scope)                                  + AGENT_STRUCTURE.md
                                                       + Diagram.html
   \                                              /
    \                                            /
     v                                          v
(gabung input + PRD + Agentic Structure md + 3 design prompts)
                          |
                          v
                     orches-v1 (mandatory, Mode A)
                          |
                          v
                Wave 0 (Pythia + Hephaestus + Themis)
                          |
                          v
                Wave 1 (visual foundation: 3D scene + buildings + landing + entry + dashboard)
                          |
                          v
                Wave 2 (visual modes: Sprint hero + Health glow + Onboarding fly + Activity heatmap + Refactor ghost)
                          |
                          v
                Wave 3 (backend full: FastAPI + tree-sitter + OAuth + webhook + simulation engine + K8s deploy + slide deck via Pan)
                          |
                          v
                Submission Day 2 jam 11-13
                          |
                          v
                Pitch (kalau top 5) Day 2 jam 15-17
                          |
                          v
                Lesson-learned distillation post-event
```

### 26.1. Designer (`/designer-v1`, OPTIONAL but RECOMMENDED for visual scope)

1. Buka roomchat baru, fire `/designer-v1`
2. Attach `PRD-ideaLocked_codeplex-chronicle.md`
3. Designer baca section 1-9 + 13 + 19, author 3 prompt buat claude.ai/design platform:
   - Prompt 1: Landing Page Awwwards-tier
   - Prompt 2: Application Entry Page (replace Claude template)
   - Prompt 3: Dashboard View flat 2D manager-facing
4. Output: `prompt-design_codeplex-chronicle.md`
5. City View (3D scene + buildings + districts + roads + post-processing + chat panels + ticket panels) BUKAN Designer scope, Claude Code handle via worker spawn Wave 1-2

### 26.2. Metis (`/metis-v1`, MANDATORY untuk multi-agent project)

1. Buka roomchat baru, fire `/metis-v1`
2. Aktifin Deep Research feature di chat panel sebelum attach PRD
3. Attach `PRD-ideaLocked_codeplex-chronicle.md`
4. Metis lakuin Deep Research:
   - Domain agentic structure pattern multi-agent
   - Anthropic multi-agent research system reference
   - r3f visual frontend-first workflow patterns
   - DeepSeek multi-turn coordination patterns
5. Author 3 artifact:
   - Deep Research artifact (analysis output)
   - `AGENT_STRUCTURE.md` (Metis canonical output, visual frontend-first wave sequencing per Section C idea-draft mandate, worker design philosophy = pintar multi-task per worker)
   - `Diagram.html` (interactive agentic structure diagram)
6. Output drives Orches-v1 Wave 0-3 spawn pattern

### 26.3. Orches-v1 (`/orches-v1`, MANDATORY)

1. Buka roomchat baru, fire `/orches-v1` Mode A
2. Attach:
   - `PRD-ideaLocked_codeplex-chronicle.md` (this document)
   - `AGENT_STRUCTURE.md` (Metis output)
   - `prompt-design_codeplex-chronicle.md` (Designer output)
3. V1 Orch Mode A behavior:
   - Skip Phase A (brainstorm, idea LOCKED di PRD Section 1 + 2)
   - Skip Phase F.1 project type re-triage (sourced dari PRD Section 1 lock = `hackathon`)
   - Lanjut Phase B (lock-in 2 hal: OpenSpec on/off + tech stack final, both already locked in PRD Section 17 + 11)
   - Phase C onwards, spawn Wave 0 specialists shrunk dari 5 ke 3 (Pythia + Hephaestus + Themis):
     - **Pythia**: contracts per DAG edge dari Metis AGENT_STRUCTURE.md
     - **Hephaestus**: worker + auditor prompts ke `.claude/agents/` PLUS `PromptOpening-codeplex-chronicle.md` di project root
     - **Themis**: translate Metis md ke `_meta/` canonical files + project-local `.claude/` setup
4. V1 Orch boleh ferry ke Ghaisan/Hafiz kalau detect PRD/AGENT_STRUCTURE content ambiguous, BUT JANGAN unilateral edit content
5. Wave 1-3 execution per visual frontend-first sequencing (Section C idea-draft + AD-05 Section 8.3)

### 26.4. Pan (universal worker, Day 2 specifically)

Spawned dari Orches-v1 untuk atomic task hari-H:
- Demo flow rehearsal smoke test (Day 2 jam 13-15)
- Slide deck generation prompt (Day 2 jam 11-13, Hafiz consume + finalize)
- Bug sweep + polish (Day 2 jam 11-13)

### 26.5. Lesson-Learned Distillation (Post-Event)

After hackathon, Ghaisan run lesson-learned distill session:
- Author `lesson-learned-project_codeplex-chronicle.md` (Mode C Council future session input)
- Document what worked + what didn't di workflow agentic
- Document DeepSeek V4 reliability findings (real-world data post-event)
- Document r3f performance ceiling actual vs estimate
- Document hands-off mode operator-only feasibility lesson

---

## 27. Glossary

| Term | Definition |
|---|---|
| **AI Residents** | 5 specialized LLM-powered agents (Athena, Apollo, Argus, Clio, Hermes) yang tinggal di iconic landmark buildings di kota Codeplex Chronicle, serve domain-specific user queries |
| **City** | 3D visualization of a single repository, dengan buildings = files, districts = folders, roads = imports |
| **Codeplex Chronicle** | The product. AI-resident development environment yang visualize codebase as living 3D city |
| **Council** | Pre-execution V1 skill yang author PRD (this session) |
| **Crack pattern** | Visual indicator on building yang signal spec-drift detected via 5 retak patterns (A-E) |
| **Designer-v1** | V1 skill yang author UI prompt untuk claude.ai/design platform |
| **District** | Folder/module di codebase visualized sebagai cluster of buildings |
| **Drafts folder** | Sandbox isolation for Refactor Mode simulation output, located at `drafts/<simulation-id>/`. Production code NEVER changes here, only via explicit user Accept |
| **Folder A** | OpenSpec panitia-facing primary spec di `openspec/`. Canonical layout per Fission-AI standard. Audience: Refactory judges post-hackathon |
| **Folder B** | Internal workflow agent output di `.agent-openspec/` (hidden via dot-prefix). Audience: agent workflow only, BUKAN consume panitia |
| **Ghost building** | Visual representation of file mentioned in proposal/issue but not yet existing in filesystem |
| **Hands-off mode** | Operator workflow where Ghaisan + Hafiz only relay handoff + approve decision + ferry knowledge, NOT touch code. Claude Code handles all execution |
| **Hybrid Write Layer 1** | Apollo finding -> 1-click GitHub issue creation (low risk) |
| **Hybrid Write Layer 2** | Refactor Mode simulation execution to `drafts/` folder (medium risk, high reward) |
| **Idea-draft** | Pre-event locked document `idea-draft_codeplex-chronicle.md` v1.0, source of truth for this PRD |
| **Metis** | V1 skill yang author AGENT_STRUCTURE.md agentic structure for downstream Orches-v1 execution |
| **OpenSpec** | Fission-AI spec-driven development framework. Mandatory per Refactory rule. v1.0 stable, `core` profile used in Codeplex Chronicle |
| **Orches-v1** | V1 skill yang execute Wave 0-3 workflow via worker spawn pattern |
| **Pan** | Universal worker agent untuk atomic task yang ga fit specialized roles |
| **Refactor Mode** | Product Mode 3, spec-driven refactor exploration di sandbox `drafts/` with dual review gate |
| **Retak (cracked) building** | Visual state indicating spec-drift detected via 5 patterns (A-E) |
| **Spec-drift** | Gap between code-as-implemented and code-as-specified |
| **Sprint Mode** | Product Mode 2 (HERO), spatial agile workspace dengan ticket overlay |
| **Tim Duopoly** | Team name: Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin |
| **V4-Flash** | DeepSeek hosted model, 284B total / 13B active params, $0.14 input / $0.28 output per 1M token |
| **V4-Pro** | DeepSeek hosted model, 1.6T total / 49B active params, $1.74 input / $3.48 output per 1M token (75% off till 2026-05-31) |
| **Wave 0-3** | Orches-v1 execution phases: Wave 0 planning, Wave 1 visual foundation, Wave 2 visual modes, Wave 3 backend + integration + deploy |

---

## 28. Appendix A: Decision Log

Semua keputusan dari brainstorming pre-event 9-10 Mei 2026 yang locked di idea-draft + extended dengan Day-0 shift decisions:

| # | Decision | Outcome |
|---|---|---|
| **D1** | OpenSpec sebagai requirement? | KEEP requirement (Refactory mandate confirmed). OpenSpec first-class di product (Refactor Mode), plus mandatory di workflow agentic Council -> Pan |
| **D2** | Refactor Mode tetap atau drop? | KEEP dengan SAFETY DESIGN: Athena execute beneran tapi write ke `drafts/` folder, BUKAN production. User accept-or-discard gate |
| **D3** | Athena scope? | Full power: proposal author + dependency navigator + execution di sandbox. BUKAN declawed |
| **D4** | Audience? | Engineer + Manager dual audience, dual view (City View + Dashboard View) |
| **D5** | Ticket data source? | Pure GitHub. Sprint = Milestone, Backlog = open issues, Story = issue dengan label |
| **D6** | Default warna gedung? | Ownership (CODEOWNERS / git blame). Toggle ke language / recency tetap ada |
| **D7** | PM scope depth? | Heavy: full agile workflow termasuk burndown, velocity, retrospective replay |
| **D8** | Pitch closing? | Hybrid 3 angle (philosophical + concrete + safety). Closing punchline focus *"AI explores in drafts, you commit to production"* |
| **D9** | Multi-repo architecture? | MVP Opsi A (1 repo = 1 city, dropdown switcher). 2-3 repo demo dataset. Opsi C (hierarchy 3-level) Phase 2 |
| **D10** | Retak building detection? | 5 metadata patterns (A-E, pure deterministic). LLM (Clio) sebagai narrator, BUKAN analyzer |
| **D11** | Iris (NEW resident)? | DROPPED. Multi-mode narration distribute ke Clio (git/spec-drift/activity), Apollo (health), Athena (refactor). Total 5 resident |
| **D12** | Hybrid write scope? | Layer 1 (Apollo->issue) + Layer 2 (Refactor simulation drafts/). Drop protocol untuk both |
| **D13** | Drop protocol untuk hybrid? | Decision Tree Branch 7: timing checkpoints + signal triggers + 5-step protocol (Section 12) |
| **D14** | Pitch positioning | Substansi-first: engineering productivity tools (5 modes) yang kebetulan punya 3D interface, BUKAN 3D demo yang kebetulan bisa SDD. City = interface, BUKAN value prop |
| **D15** | Pitch order | Onboarding -> Sprint (hero) -> Refactor -> Health (closing 1-click ticket). Sprint Mode hero karena align past winner pattern (substantive engineering productivity tools) |
| **D16** | Demo dataset strategy | R3 Pure Seed: fork NodeGoat + FastAPI template + PyGoat, populate agile data via GitHub API script Day 0. Plus pre-render tokopedia/gripmock + gojek/courier-android closing bonus slide |
| **D17** | Multi-language tree-sitter | LOCKED: TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift. BUKAN cuma TS/JS (revert dari MVP scope IDEATION asli) |
| **D18** | LLM provider fallback | **REVISED Day-0**: Pure DeepSeek V4-Flash primary + V4-Pro fallback. NOT Gemini 2.5 Flash + Flash-Lite (original idea-draft plan retired) |
| **D19** | OpenSpec profile | `core` only, NOT expanded. Pre-fill `openspec/project.md` ~250 line. `/opsx:propose` one-shot |
| **D20** | r3f optimization | Raw `<instancedMesh>` untuk 200-300 building. Drop DepthOfField first kalau regress. `<Perf />` overlay dev mode |
| **D21** | Filesystem access | DROPPED. GitHub-only backbone. "Build from scratch" via in-memory virtual fs |
| **D22** | Designer-v1 scope | 3 prompt (Landing, Entry, Dashboard). City View = Claude Code handle |
| **D23** | Workflow sequencing | Visual frontend-first (Wave 1-2), backend deferred (Wave 3). Workers pintar multi-task per worker |
| **D24** | Hands-off mode | Ghaisan + Hafiz operator only, BUKAN coding. Claude Code handle semua eksekusi termasuk K8s deploy |
| **D25** | Earthquake error visual | LOCKED stretch tier 2 (welcomed kalau performance allow). Tagline locked di landing page |
| **D26** | PR comment surfacing | NEW feature dari Hafiz industry feedback. Visual approach delegated ke Designer-v1 hari-H |
| **D27** | OpenSpec dual-folder strategy | LOCKED per panitia eksplisit request: Folder A `openspec/` panitia-facing, Folder B `.agent-openspec/` internal workflow. Pattern E spec-drift detection track Folder A only |
| **D28** | DeepSeek model name (Day-0 web_search confirm) | `deepseek-v4-flash` + `deepseek-v4-pro` eksplisit. Legacy `deepseek-chat`/`deepseek-reasoner` deprecated 2026-07-24, NOT used |
| **D29** | DeepSeek client SDK | OpenAI Python SDK >=1.x dengan `base_url=https://api.deepseek.com`, drop-in pattern. Anthropic SDK alternative also supported but OpenAI default |
| **D30** | DeepSeek reasoning mode strategy | V4-Pro thinking mode high reasoning untuk Athena + Refactor Mode multi-turn. V4-Flash non-thinking untuk Apollo/Clio/Hermes narration. V4-Flash thinking low reasoning untuk Argus CVSS scoring |

---

## 29. Appendix B: Research Findings Summary

Highlights dari pre-event research session 9 Mei 2026 (full report `research_finding.md` di `docs/context/`):

### 29.1. Topic A: Demo Dataset

- **NodeGoat** (Apache-2.0, ~80-120 files): primary Health Mode hero, 5/5 OWASP detector fire authentic, Indonesian dev community high recognition
- **FastAPI full-stack template** (MIT, ~150-250 files): secondary, mirror Codeplex Chronicle stack, juri instant recognize
- **PyGoat** (MIT, ~60-90 files): fallback, Python flavor
- **Juice Shop** REJECTED: 1000+ files, fail 50-300 rule
- **Tokopedia/Gojek/Bukalapak**: mostly clean library code, REJECTED for primary, ACCEPTED as closing slide screenshot bonus

### 29.2. Topic B: OpenSpec Validation

- v1.0 stable shipped pre-May 2026, ~46.1k stars, very active maintenance
- Canonical layout: `openspec/specs/`, `openspec/changes/<change>/`, `openspec/archive/`
- Slash commands stable: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`, `/opsx:sync`
- `core` profile only untuk hackathon (NOT expanded, less failure surface)
- Pre-fill `openspec/project.md` ~250 line, `/opsx:propose` one-shot, clear context before `/opsx:apply`
- 50+ cycles in 24h plausible dengan `core` profile, expect 10-20% manual intervention
- **Dual-folder strategy locked** per panitia request

### 29.3. Topic C: Past Refactory Winner Pattern

- **Round 01 UGM Juara 1**: Tim LUNARIS Telkom University (theme "OpenSpec x AI" eksplisit)
- **Round 02 UNAIR Juara 3**: Tim Case Release UNAIR dengan Effix.ai (AI code optimizer)
- **Roadshow UKDW Dec 2025 Juara 1**: Tim Vibecode UTDI dengan Backstage plugins (DevEx tooling)
- Pattern: AI-assisted developer productivity tooling, deployed plus demoable, BUKAN flashy 3D demos
- Implication: pitch substansi-first, city = interface BUKAN value prop

### 29.4. Topic D: Three.js + r3f Performance

- 200-500 InstancedMesh buildings via single draw call within budget
- 60fps target M-series realistic
- Drop-first order: DepthOfField, Sparkles tier 3, third directional shadow
- Raw `<instancedMesh>` setMatrixAt > Drei `<Instances>` per-instance JSX
- `state.performance.regress()` wired ke camera moves, +20-30% perf

### 29.5. Topic E: DeepSeek V4 Reliability (REPLACES Gemini, post-Day-0 shift)

(Verified via web_search Day-0 12 Mei 2026)

- **V4 launch**: April 24 2026, hosted API `https://api.deepseek.com` available
- **V4-Flash specs**: 284B total / 13B active params (MoE), 1M context window, hybrid attention architecture (Compressed Sparse Attention + Heavily Compressed Attention), 384K max output
- **V4-Pro specs**: 1.6T total / 49B active params (MoE), 1M context window, max output 384K, performance rivaling top closed-source models (per official tech report, trailing only Gemini-3.1-Pro on world knowledge benchmarks)
- **API compatibility**: OpenAI ChatCompletions interface + Anthropic API both supported, same base_url
- **Reasoning modes**: Non-think (fast) / Think High (logical analysis) / Think Max (full reasoning extent), toggle via `extra_body={"thinking":{"type":"enabled"}}` + `reasoning_effort` parameter
- **Pricing per 1M tokens**: V4-Flash $0.14 input / $0.28 output. V4-Pro $1.74 input / $3.48 output (75% off until 2026-05-31 15:59 UTC). Cache-hit pricing reduced to 1/10 of launch price (effective 2026-04-26)
- **Legacy migration**: `deepseek-chat` and `deepseek-reasoner` deprecated 2026-07-24, currently routing to V4-Flash non-thinking/thinking modes. PRD eksplisit pakai V4 model names, no legacy aliases
- **Tool calling**: V4 behavior closer to Claude Code than V3.x, more aggressive retry/self-correct (more tokens per task), argument schema mostly backward compatible
- **Cost trap (V4-Pro)**: thinking mode "very verbose", 4x avg reasoning token vs V3.x reasoner. Mitigation: track usage real-time, fallback to V4-Flash if budget approaches $4 (D1 risk Section 23.1)
- **MALFORMED_FUNCTION_CALL equivalent**: not documented as frequent failure mode in DeepSeek V4 (Gemini-specific issue retired). Defensive layer still required per Section 18.4 (retry simplified prompt, fallback model, fallback canned)
- **Indonesia accessibility**: API endpoint accessible from Indonesia, no geo block reported as of May 2026

### 29.6. Topic F: Refactory Rules Formal Doc

**RESOLVED pre-event**: panitia distribute file `RefactoryHackathonRules&FAQ.txt` ke peserta. Content captured di Section 24.1.

Confirmed compliance points:
- Team 2-4 members (Duopoly = 2, comply)
- Deploy K8s mandatory (Section 17.5)
- Theme "Engineering Productivity x AI" (Section 2-3 align)
- OpenSpec mandatory (Section 17.1)
- All build during hackathon (open-source libs allowed pre-built, Section 24.1)
- Full team attend final presentation (Hafiz physically present mandatory)
- All 4 mandatory tech stack used: OpenSpec + LLMs + K8s + PostgreSQL (Section 17.1)

No re-fetch from Google Doc needed. Council hari-H captured surprise rule kalau ada on-the-spot clarification at technical meeting.

---

## Document Closing

**Status**: DRAFT pre-lock. Awaiting Ghaisan eksplisit "PRD locked" confirmation per Council Phase F.3 protocol.

**Lock criteria**:
- Council Mnemosyne aggregate confidence >= 80% (high, per persona deliberation Section R idea-draft + Day-0 research validation)
- Ghaisan review complete + eksplisit confirm
- After lock: PDF version generated via `pdf` skill, Council Phase G handoff package ready

**On lock**:
1. Update field `**Status**: locked` di header
2. Update field `**Locked by**: Ghaisan Khoirul Badruzaman` di header dengan timestamp
3. Generate PDF via `pdf` skill, output ke `docs/prd/PRD-ideaLocked_codeplex-chronicle.pdf`
4. Phase G handoff:
   - Primary deliverable: this PRD `.md` + `.pdf`
   - Supporting: idea-draft + research_finding + Refactory rules di `docs/context/`
   - Next steps Ghaisan: open roomchat baru, fire `/metis-v1` (deep research toggle on), attach PRD -> generate `AGENT_STRUCTURE.md`. Paralel kalau visual scope significant: `/designer-v1` -> generate `prompt-design_codeplex-chronicle.md`. Setelah both done, fire `/orches-v1` Mode A dengan attach PRD + AGENT_STRUCTURE + prompt-design.

**Council session this**: Phase A (skipped, idea LOCKED pre-event), Phase B (skipped, persona deliberation done pre-event 9-10 May), Phase C (skipped, Mnemosyne synthesis done pre-event), Phase D (research scope cut per Ghaisan directive, DeepSeek V4 web_search confirm only), Phase E (skipped, no refinement loop needed), Phase F.1 (project type lock = hackathon, sourced dari idea-draft Section A + S), Phase F.2 (PRD body authored = this document), Phase F.3 (PENDING Ghaisan lock confirmation), Phase G (PENDING handoff package).

**End of PRD-ideaLocked_codeplex-chronicle.md v1.0 (DRAFT)**.
