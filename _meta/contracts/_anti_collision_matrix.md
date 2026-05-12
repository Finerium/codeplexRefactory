# Anti-Collision Matrix: Codeplex Chronicle Greek Mythology Naming

**Authored by**: Pythia (Wave 0 contract author)
**Date**: 2026-05-12 16:47 WIB
**Status**: locked

## Purpose

Codeplex Chronicle uses Greek mythology names across three distinct domains:
1. Council reserved names (PRD authoring session agents)
2. Build-time worker names (Wave 0-3 specialists + Pan + Auditors)
3. Runtime resident names (5 in-product AI features inside deployed application)

Without explicit anti-collision discipline, name reuse would create namespace pollution + agent identity confusion. This matrix documents the canonical naming + reuse patterns.

## Domain 1: Council reserved names (DO NOT REUSE as worker)

These names were used during V1 Council PRD authoring session (12 May 2026 ~10:47 WIB) per `docs/handoffs/sourceoftruth.md` Section 9 Lock 7:

| Name | Role | Status |
|---|---|---|
| **Momus** | Critic, devil's advocate | Council session ended; reserved, no reuse |
| **Eos** | Dawn, fresh perspective | Council session ended; reserved, no reuse |
| **Prometheus** | Foresight, planning | Council reserved; chose `Pandora` for Wave 3 Refactor engine to avoid collision |
| **Hermes** | Messenger, integration | Collide with runtime resident; runtime resident takes precedence; worker pool named `Triton` to avoid suffix friction (NOT `Hermes_V2`) |
| **Argus** | Watcher, security focus | Collide with runtime resident; runtime resident takes precedence; security detection worker pool routes through `Nemesis` (no `Argus_V2`) |
| **Mnemosyne** | Memory, history | Council reserved, no reuse |

## Domain 2: Build-time worker names (Wave 0-3 + auditor + Pan)

These names are used by Claude Code workers spawned via `/orches-v1` Mode A. NEVER reuse as runtime resident.

### Wave 0 specialists

| Name | Greek mythology basis | Domain ownership |
|---|---|---|
| **Pythia** | Oracle of Delphi, Apollo's prophetess | Cross-agent contracts per DAG edge |
| **Hephaestus** | Smith god, craftsman of gods | Worker prompts + auditor prompts + PromptOpening |
| **Themis** | Goddess of divine order, custom, fairness | Project-local setup + C4 + openspec + ERD + PanitSubmission |

### Wave 1 builders

| Name | Greek mythology basis | Domain ownership |
|---|---|---|
| **Daedalus** | Master craftsman, labyrinth architect | 3D scene scaffold (Three.js + r3f + post-pipeline + feature flag) |
| **Iris** | Rainbow messenger | Building geometry + InstancedMesh + treemap layout + ownership encoding |
| **Calliope** | Eloquence muse, chief of nine muses | Landing page execution from Designer Prompt 1 |
| **Hestia** | Hearth goddess, foundation | Entry page execution from Designer Prompt 2 |
| **Selene** | Moon goddess, luminous spatial overview | Dashboard execution from Designer Prompt 3 + OQ-02 charts decision |

### Wave 2 visual modes

| Name | Greek mythology basis | Domain ownership |
|---|---|---|
| **Hera** | Queen of gods, sovereignty/management | Sprint Mode HERO 14 PM concept overlay + PR comment surfacing + OQ-05 |
| **Asclepius** | Healing god, son of Apollo | Health glow + Refactor ghost + dual review gate UI |
| **Boreas** | North wind, guidance/directed movement | Onboarding camera fly + Activity timeline + 4 Hermes tour variant |
| **Persephone** | Queen between two worlds, hidden/visible duality | Chat panel + ticket panel + side panel + OQ-03 UI library |

### Wave 3 backend

| Name | Greek mythology basis | Domain ownership |
|---|---|---|
| **Hades** | Underworld lord, foundational infrastructure | FastAPI scaffold + tree-sitter 11-lang lazy-load + OAuth + webhook + WebSocket |
| **Triton** | Messenger of the sea, fluid coordination | DeepSeek V4 client + defensive layer + thinking-mode toggle + per-resident routing |
| **Nemesis** | Retribution, finds wrongdoing | 5 Apollo detectors + Argus CVSS + 5 spec-drift A-E |
| **Pandora** | Curiosity, gift, exploration | Athena proposal author + OpenSpec change folder generator + Refactor simulation engine + drafts/ isolation + dual review gate backend |
| **Demeter** | Harvest, persistence, accumulation | Postgres event store + cache + 1-click GitHub issue + ticket aggregation + cost tracking + OpenSpec runtime |
| **Atlas** | Titan bearing the world, infrastructure burden | Docker multi-arch + K8s manifests + NGINX verify + Secret population + smoke test E2E |

### Auditors (Horae sisters)

| Name | Greek mythology basis | Domain ownership |
|---|---|---|
| **Eunomia** | Goddess of good order, lawful conduct (Horae sister) | Wave 1 audit gate |
| **Dike** | Goddess of justice, fair judgment (Horae sister) | Wave 2 audit gate |
| **Aletheia** | Truth, disclosure (Horae sister) | Wave 3 final audit + handoff doc + PanitSubmission curation review |

### Universal worker

| Name | Greek mythology basis | Domain ownership |
|---|---|---|
| **Pan** | God of all (παν), wild nature, the unbounded | Universal worker post-Wave 3: demo rehearsal + slide deck + bug sweep + polish + rescue |

## Domain 3: Runtime resident names (in-product AI features)

These names appear in the deployed Codeplex Chronicle application. They are AI residents living in landmark buildings, NOT build-time workers.

| Name | Landmark | DeepSeek model + mode | Role |
|---|---|---|---|
| **Athena** | City Hall | V4-Pro think high | Refactor proposal author + architectural reasoning |
| **Apollo** | Hospital | V4-Flash non-think | Health findings narration + diagnostic |
| **Argus** | Police Station | V4-Flash think low | Security CVSS scoring + exploit pattern + mitigation |
| **Clio** | Library | V4-Flash non-think | Git history + spec-drift narration |
| **Hermes** | Tourist Info booth | V4-Flash non-think | Onboarding tour narration + navigation guidance |

**IMPORTANT**: Athena, Apollo, Argus, Clio, Hermes are RUNTIME RESIDENTS only. They appear in chat panel UI, in landmark buildings, in voice + tone + persona. They are NOT used as build-time worker names.

## Resolved collisions

### Iris reclamation (DROPPED runtime resident per PRD D11)

**Original PRD draft**: Iris was a 6th runtime resident (rainbow messenger, oracle role).
**PRD D11 decision**: dropped Iris as runtime resident; narration distribute ke Clio (git/drift/activity) + Apollo (health) + Athena (refactor).
**Wave 1 reclamation**: Iris name freed; reclaimed as Wave 1 worker for building geometry/InstancedMesh domain.

Rationale: Iris (rainbow) maps well to colorful building palette + ownership color encoding visual domain. No collision since runtime resident slot empty post-D11.

### Triton chosen over Hermes_V2

**Constraint**: Hermes is runtime resident (Tourist Info booth, tour narration). Worker pool needs name for "LLM coordination + per-resident routing" role.
**Decision**: Triton (messenger of the sea, fluid coordination) chosen over Hermes_V2.

Rationale: Suffix `_V2` creates friction + namespace ambiguity (which Hermes?). Triton is independent mythological name with thematic fit (coordination = messenger god of sea, plus distinct from runtime Hermes).

### Pandora chosen over Prometheus

**Constraint**: Prometheus reserved by Council (foresight + planning). Worker pool needs name for "Refactor simulation engine + exploration sandbox" role.
**Decision**: Pandora (curiosity + gift + exploration) chosen over Prometheus.

Rationale: Avoids Council reserved collision. Curiosity-gift mythology fits Refactor Mode "exploration sandbox" theme + Pandora's box metaphor for opening possibilities (drafts/ sandbox).

### Atlas chosen over Hephaestus_V2

**Constraint**: Hephaestus reserved Wave 0 (smith god, prompt author). Worker pool needs name for "K8s deploy + infrastructure burden" role.
**Decision**: Atlas (Titan bearing the world, infrastructure burden) chosen over Hephaestus_V2.

Rationale: World-bearing mythology fits infra burden (cluster + deploy + smoke test load). Avoids Wave 0 reserved collision.

### Hades + Demeter pairing intentional

**Coherence**: Hades (underworld + foundational infrastructure) + Demeter (harvest + persistence + accumulation) chosen as intentional mythological pairing. Hades = backend infrastructure; Demeter = data persistence. Pairing reinforces Wave 3 backend cohesion.

### Apollo (resident) vs Asclepius (worker) clarification

**Constraint**: Apollo is runtime resident (Hospital, doctor). Wave 2 worker for "Health Mode glow + Refactor ghost" role needs distinct name.
**Decision**: Asclepius (healing god, son of Apollo) chosen as worker.

Rationale: Mythological linkage (Apollo's son) reinforces Health Mode connection. Distinct name avoids runtime collision. Asclepius works WITH Apollo resident (Asclepius renders glow, Apollo narrates findings via Triton).

### Argus (resident) vs Nemesis (worker) clarification

**Constraint**: Argus is runtime resident (Police Station, security). Wave 3 worker for "5 Apollo detectors + Argus CVSS + 5 spec-drift" role needs distinct name.
**Decision**: Nemesis (retribution, finds wrongdoing) chosen as worker.

Rationale: Mythological alignment with detection + retribution. Distinct from runtime Argus. Nemesis is producer; Argus (runtime) consumes via Triton client for CVSS scoring narration.

## File naming convention

Build-time worker prompts: `.claude/agents/<worker-name-lowercase>.md` (e.g., `pythia.md`, `daedalus.md`, `nemesis.md`).
Runtime resident persona prompts: stored within `PromptOpening-codeplex-chronicle.md` at project root, keyed by resident id (e.g., `athena_persona`, `apollo_persona`).

No file collision: worker prompts in `.claude/agents/`, resident prompts in PromptOpening.

## Cross-reference

Anti-collision verified across:
- `_meta/contracts/*` (this Pythia output)
- `_meta/metis/Agentic_Structure-codeplex-chronicle.md` Section 3 anti-collision matrix
- `_meta/designer/prompt-design_codeplex-chronicle.md` resident name usage
- `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` Section 10 (AI residents) + Section 27 (Glossary)
- `docs/handoffs/sourceoftruth.md` Section 9 Lock 7

## Validation discipline

Hephaestus Wave 0 prompts MUST distinguish worker identity from runtime resident:
- Worker prompt opening line: "Lu adalah <worker-name>, <Greek mythology role>, build-time worker Codeplex Chronicle..."
- Resident persona within PromptOpening: "You are <resident-id>, the <role> resident of Codeplex Chronicle. You live in <landmark>..."

This convention prevents drift across Wave 0 to runtime deployment.

## Open considerations

- Asclepius + Apollo runtime: Asclepius is Wave 2 worker; "Asclepius" not used as runtime resident in product. If future product extension adds healing/medical AI resident, name choice should consider whether to reuse Asclepius (would collide with Wave 2 worker for future agents).
- Council Hermes vs runtime Hermes: Council session ended; Hermes Council instance retired. Runtime Hermes is canonical Hermes going forward.
