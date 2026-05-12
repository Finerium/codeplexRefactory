# C4 Level 1: System Context (Codeplex Chronicle)

**Diagram type**: C4 Level 1 (System Context)
**Purpose**: Show how Codeplex Chronicle fits in its environment (users + external systems)
**Audience**: Refactory judge + new engineer onboarding the project
**Source**: PRD Section 8.1 + sourceoftruth Section 1-3 + Metis md Section 1 Project Recap
**Authored by**: Themis Wave 0 (project-local setup smith)
**Date**: 2026-05-12 16:50 WIB

```mermaid
flowchart TB
    classDef person fill:#08427B,color:#fff,stroke:#052E56,stroke-width:2px
    classDef softwareSystem fill:#1168BD,color:#fff,stroke:#0B4884,stroke-width:2px
    classDef external fill:#999,color:#fff,stroke:#666,stroke-width:2px

    %% People
    Engineer[("Engineer<br/>Aldo<br/>(primary persona)<br/>onboarding + spec authoring +<br/>refactor proposal review")]:::person
    Manager[("Engineering Manager<br/>Budi<br/>(primary persona)<br/>velocity tracking + sprint mgmt +<br/>cycle time review")]:::person
    Judge[("Refactory Judge<br/>(audience persona)<br/>pitch review + Q&A defense +<br/>technical assessment post-event")]:::person

    %% Core System
    CodeplexChronicle["Codeplex Chronicle<br/>(Web SPA + API)<br/><br/>AI-resident development<br/>environment 3D city + 5 modes +<br/>5 AI residents persona routing<br/><br/>https://duopoly.hackathon.sev-2.com"]:::softwareSystem

    %% External Systems
    GitHub["GitHub.com<br/>(External)<br/><br/>OAuth identity + repo +<br/>issues + milestones + PR +<br/>webhook events<br/><br/>akun Finerium org Tim Duopoly"]:::external
    DeepSeek["DeepSeek V4 API<br/>(External LLM)<br/><br/>V4-Flash primary +<br/>V4-Pro thinking-mode<br/><br/>https://api.deepseek.com<br/>Hafiz $5 throwaway"]:::external
    Postgres["PostgreSQL 16<br/>(External, Refactory-managed)<br/><br/>Event store + cache +<br/>ticket state aggregation +<br/>cycle/lead time<br/><br/>103.185.52.138:1185 db duopoly"]:::external
    K8s["Kubernetes Cluster<br/>(External, Refactory-managed)<br/><br/>Container orchestration +<br/>namespace duopoly +<br/>NGINX Ingress TLS<br/><br/>103.185.52.45:6443"]:::external

    %% Person to System
    Engineer -->|"browse 3D city +<br/>chat AI residents +<br/>OpenSpec authoring +<br/>refactor accept/discard"| CodeplexChronicle
    Manager -->|"view Dashboard 2D +<br/>velocity + burndown +<br/>spec drift summary"| CodeplexChronicle
    Judge -->|"pitch review +<br/>demo flow walkthrough +<br/>PRD + C4 + repo read"| CodeplexChronicle

    %% System to External
    CodeplexChronicle -->|"OAuth flow<br/>(scope: read:repo, read:org,<br/>read:issues, read:pull_requests,<br/>write:issues)"| GitHub
    CodeplexChronicle <-->|"Webhook events<br/>(HMAC verified)<br/>PR opened/approved/merged +<br/>issue created/closed"| GitHub
    CodeplexChronicle -->|"API read<br/>(milestones, issues, PR,<br/>CODEOWNERS, commits)"| GitHub
    CodeplexChronicle -->|"API write<br/>(1-click GitHub issue<br/>creation, Hybrid Layer 1)"| GitHub
    CodeplexChronicle -->|"LLM API calls<br/>(per-resident routing,<br/>defensive layer)"| DeepSeek
    CodeplexChronicle <-->|"Event store +<br/>cache +<br/>ticket state +<br/>materialized views"| Postgres
    CodeplexChronicle -.->|"Container deploy<br/>(kubectl apply)<br/>Atlas Wave 3"| K8s
```

## Legend

- **Solid arrow**: synchronous interaction (HTTP request / response, DB query)
- **Bidirectional arrow**: bidirectional communication (webhook + API + DB write)
- **Dashed arrow**: build-time / deploy-time interaction (not runtime data flow)
- **Person icon (filled top circle)**: human persona
- **Rounded rectangle (filled)**: internal software system (Codeplex Chronicle)
- **Rectangle (filled gray)**: external software system

## Description

Codeplex Chronicle is an AI-resident development environment that transforms production codebases into navigable 3D cities. Users include engineers (onboarding + refactor proposal review), engineering managers (velocity tracking + sprint management), and Refactory judges (pitch + technical assessment).

External system integrations:
- **GitHub** for source-of-truth ticket management (OAuth + API + webhooks)
- **DeepSeek V4** for LLM inference (5 resident persona routing, per-resident model + thinking-mode)
- **PostgreSQL** (Refactory pre-provisioned) for event store + cache + ticket state aggregation
- **Kubernetes** (Refactory pre-provisioned) for container orchestration + NGINX Ingress TLS

The system runs at https://duopoly.hackathon.sev-2.com (Refactory-pre-provisioned domain). All credentials live in `~/Documents/codeplexRefactory/.env` mode 600 (gitignored).

## Trust boundary

| Boundary | Inside (trusted) | Outside (untrusted) |
|---|---|---|
| Codeplex Chronicle internal | Backend FastAPI + Frontend SPA + LLM client + DB session | Browser user input, GitHub webhook payload, DeepSeek API response |
| GitHub OAuth scope | Read:repo + read:org + read:issues + read:pull_requests + write:issues | Repo write code, admin:org, admin:repo_hook, delete_repo, user:email |
| Refactory K8s namespace | `duopoly` pod + service + ingress | Other Refactory tenant namespace |
| `drafts/` sandbox | Refactor Mode simulation engine writes here ONLY | Production code never touched by simulation (AD-19 LOCKED) |

## Cross-references

- PRD Section 8.1 (C1 System Context ASCII sketch)
- PRD Section 19 (Security boundaries)
- sourceoftruth Section 3 (Credentials state)
- `_meta/contracts/_master_index.md` (33 contracts documenting internal handoffs)

---

**Diagram authored**: 2026-05-12 16:50 WIB by Themis Wave 0
**SVG export**: `docs/c4/C4-Context.svg` via `mmdc -i docs/c4/C4-Context.md -o docs/c4/C4-Context.svg`
**Mirror in PanitSubmission/**: `PanitSubmission/c4/C4-Context.{md,svg}`
