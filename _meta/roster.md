# Roster (Full, Canonical)

**Translated from**: `_meta/metis/Agentic_Structure-codeplex-chronicle.md` Section 3 (Roster, Full)
**Translated by**: Themis (Wave 0 specialist)
**Translation date**: 2026-05-12 16:30 WIB
**Status**: locked (mirrors Metis canonical, enriched with worker prompt paths from Hephaestus output)

## Purpose

Single source of agent identity across all 4 waves. Each agent has Greek mythology basis, domain ownership, effort tier, and project-local worker prompt path. Use this roster to:

1. Locate worker prompt file for spawn dispatch (`.claude/agents/<agent>.md`)
2. Verify Greek naming compliance (Lock 7) against anti-collision matrix
3. Plan effort tier budgeting per worker dispatch
4. Cross-reference auditor identity for per-wave audit gate (Lock 10)

## Roster Table

| Wave | Agent | Greek mythology basis | Domain ownership | Effort tier | Worker prompt path |
|---|---|---|---|---|---|
| 0 | **Pythia** | Oracle of Delphi (Apollo's prophetess) | Cross-agent contracts per DAG edge (input/output schema, dependency declaration) | max (locked) | (Wave 0 specialist, no `.claude/agents/` file; spawned via `/orches-v1` mode A directive) |
| 0 | **Hephaestus** | Smith god, craftsman of gods | Worker prompts + auditor prompts to `.claude/agents/`, plus `PromptOpening-codeplex-chronicle.md` to project root | max (locked) | (Wave 0 specialist, no `.claude/agents/` file; spawned via `/orches-v1` mode A directive) |
| 0 | **Themis** | Goddess of divine order, custom, fairness | Project-local setup + C4 + openspec enrichment + ERD + PanitSubmission curation + `_meta/` canonical files + STATUS.md (extended duties per Ghaisan directive, formalized in Metis Section 10 delegation) | max (locked) | (Wave 0 specialist, no `.claude/agents/` file; spawned via `/orches-v1` mode A directive) |
| 1 | **Daedalus** | Master craftsman, labyrinth architect | 3D scene scaffold (Three.js + r3f Canvas + camera + lighting + fog + HDRI) + post-processing pipeline (Bloom + DepthOfField + Sparkles) + feature flag wiring + `state.performance.regress()` listener | xhigh | `.claude/agents/daedalus.md` |
| 1 | **Iris** | Rainbow messenger (DROPPED as runtime resident per PRD D11, reclaimed for build-time) | Building geometry (5 archetype + generic) + raw `<instancedMesh>` per archetype + squarified treemap deterministic layout + ownership color encoding + LOD/frustum culling | xhigh | `.claude/agents/iris.md` |
| 1 | **Calliope** | Eloquence muse, chief of nine muses | Landing page execution from `prompt-design` Prompt 1 (Awwwards-tier, dev-poetic copy voice, sticky-section + pinned-protagonist scroll, dark glass accent, three-mesh-gradient cinematic restraint) | high | `.claude/agents/calliope.md` |
| 1 | **Hestia** | Hearth goddess, foundation | Entry page execution from Prompt 2 (replace Claude template, 2 entry cards, 5 resident footer, `v0.1 prototype` badge, GitHub OAuth handoff stub) | medium | `.claude/agents/hestia.md` |
| 1 | **Selene** | Moon goddess, luminous spatial overview | Dashboard execution from Prompt 3 (flat 2D manager-facing: velocity + burndown + milestone + contributor + spec-drift + refactor status + cross-repo + embedded city preview) + decide charts library OQ-02 | high | `.claude/agents/selene.md` |
| 1 | **Eunomia** | Goddess of good order, lawful conduct (Horae sister) | Wave 1 audit gate: r3f 60fps assertion (H1), 3 page mount, openspec validate, contract conformance | max (locked) | `.claude/agents/eunomia.md` |
| 2 | **Hera** | Queen of gods, sovereignty/management | Sprint Mode HERO: 14 PM concept visual mapping overlay + PR comment surfacing visual decide OQ-05 + click building to ticket panel + PR-to-Building auto-sync webhook visual state machine | xhigh | `.claude/agents/hera.md` |
| 2 | **Asclepius** | Healing god, son of Apollo | Health Mode glow window per severity + Apollo findings panel UI + 1-click ticket viz + Refactor Mode ghost building + drafts/ simulation visual + ghost-to-solid animation + dual review gate buttons | high | `.claude/agents/asclepius.md` |
| 2 | **Boreas** | North wind, guidance/directed movement | Onboarding camera fly + Hermes narration overlay + 30-sec tour ending summary + Activity timeline scrubber 30/60/90 + hotspot intensity glow + ownership heatmap toggle | high | `.claude/agents/boreas.md` |
| 2 | **Persephone** | Queen between two worlds, hidden/visible duality | AI residents chat panel UI + ticket panel UI + side panel UI + glassmorphism styling + decide UI library OQ-03 | high | `.claude/agents/persephone.md` |
| 2 | **Dike** | Goddess of justice, fair judgment (Horae sister) | Wave 2 audit gate: 5 modes visual operational + 14 PM overlay toggle + PR comment non-overlap + panels render + Lighthouse + console clean | max (locked) | `.claude/agents/dike.md` |
| 3 | **Hades** | Underworld lord, foundational infrastructure | FastAPI async scaffold + tree-sitter 11-language lazy-load + GitHub OAuth real flow + webhook receiver HMAC + WebSocket setup | xhigh | `.claude/agents/hades.md` |
| 3 | **Triton** | Messenger of the sea, fluid coordination | DeepSeek V4 client + defensive layer (semantic cache + canned response + retry + fallback + circuit breaker) + thinking-mode toggle + per-resident model routing | xhigh | `.claude/agents/triton.md` |
| 3 | **Nemesis** | Retribution, finds wrongdoing | 5 Apollo detectors + Argus CVSS scoring + exploit pattern + 5 spec-drift detector patterns A-E (pure deterministic AST-diff) | xhigh | `.claude/agents/nemesis.md` |
| 3 | **Pandora** | Curiosity, gift, exploration | Athena proposal author (V4-Pro thinking high) + OpenSpec change folder generator Folder A + Refactor Mode simulation engine multi-turn + drafts/ isolation + dual review gate backend wiring | xhigh | `.claude/agents/pandora.md` |
| 3 | **Demeter** | Harvest, persistence, accumulation | PostgreSQL event store schema + cache layer + 1-click GitHub issue creation Hybrid Layer 1 + ticket state aggregation + cost tracking + OpenSpec runtime integration | high | `.claude/agents/demeter.md` |
| 3 | **Atlas** | Titan bearing the world, infrastructure burden | Docker multi-arch + K8s manifests + NGINX verify + K8s Secret population + feature flag runtime ConfigMap + smoke test E2E 3x consecutive | xhigh | `.claude/agents/atlas.md` |
| 3 | **Aletheia** | Truth, disclosure (Horae sister) | Wave 3 final audit + handoff doc + PanitSubmission final curation review | max (locked) | `.claude/agents/aletheia.md` |
| post-3 | **Pan** | God of all (πᾶν), wild nature, the unbounded | Universal worker: demo rehearsal 3x consecutive + slide deck generation prompt template + bug sweep + polish + rescue work when auditor escalates | max (locked) | `.claude/agents/pan.md` |

## Roster Summary

- **Total agents**: 22 (3 Wave 0 specialists + 5 Wave 1 builders + 1 Wave 1 auditor + 4 Wave 2 builders + 1 Wave 2 auditor + 6 Wave 3 builders + 1 Wave 3 auditor + 1 universal post-Wave 3 worker)
- **Worker prompt files**: 19 (`.claude/agents/` populated by Hephaestus Wave 0, 15 worker + 3 auditor + 1 Pan; 3 Wave 0 specialists Pythia/Hephaestus/Themis have no `.claude/agents/` file since they spawn from `/orches-v1` directive)
- **Effort tier distribution**: 8 max-locked (3 Wave 0 specialists + 3 auditors + 1 Pan + Hera/Iris/Daedalus among xhigh top) + 9 xhigh + 5 high + 1 medium (Hestia)

## Anti-Collision Matrix Summary

Sourced from `_meta/contracts/_anti_collision_matrix.md`. Highlights:

- Runtime residents Athena/Apollo/Argus/Clio/Hermes NOT used as build-time worker names (avoid namespace pollution).
- Iris reclaimed from PRD D11 drop (no longer runtime resident, safe for build-time worker).
- Triton chosen over Hermes_V2 to avoid suffix friction + namespace collision with runtime Hermes.
- Nemesis chosen over generic "Detector" for Greek pool consistency.
- Pandora chosen over Prometheus to avoid Council reserved collision; curiosity-gift mythology fits Refactor Mode exploration sandbox theme.
- Atlas chosen over Hephaestus_V2 (Hephaestus reserved Wave 0); world-bearing fits infra burden.
- Hades + Demeter pairing intentional mythological coherence (foundational + harvest = backend infrastructure + data persistence).
- No collision with Council reserved (Momus/Eos/Prometheus/Hermes/Argus/Mnemosyne).

For full anti-collision matrix detail, see `_meta/contracts/_anti_collision_matrix.md`.

## Reserved Names (NOT used as workers)

| Name | Reserved for | Reason |
|---|---|---|
| Athena | Runtime resident City Hall | LOCKED PRD Section 10.1 |
| Apollo | Runtime resident Hospital | LOCKED PRD Section 10.2 |
| Argus | Runtime resident Police Station + Council pre-event Phase F (different scope) | LOCKED PRD Section 10.3 |
| Clio | Runtime resident Library | LOCKED PRD Section 10.4 |
| Hermes | Runtime resident Tourist Info booth + Council pre-event Phase F-H (different scope) | LOCKED PRD Section 10.5 |
| Momus | Council pre-event Phase A (idea critique) | LOCKED Council session 2026-05-12 |
| Eos | Council pre-event Phase B (project type triage) | LOCKED Council session 2026-05-12 |
| Prometheus | Council pre-event Phase C (architecture sketch) | LOCKED Council session 2026-05-12 |
| Mnemosyne | Council pre-event Phase D-E (decision lock + memory) | LOCKED Council session 2026-05-12 |

## Workflow Roles Cross-Reference

Per `_meta/contracts/_master_index.md`:

### Wave 0 specialists
- **Pythia**: produces all 33 contracts + 2 index files
- **Hephaestus**: consumes Pythia output, produces 19 worker prompts + PromptOpening
- **Themis**: consumes Pythia + Hephaestus output, produces `_meta/` canonical + project-local setup + delegation outputs

### Wave 1 builders
- **Daedalus**: producer to Iris (3D scene canvas mount target)
- **Iris**: producer to Hera (BuildingData shape for Sprint overlay)
- **Calliope**: producer to Wave 2 panel workers (parallel route slot scaffolding)
- **Hestia**: producer to Hades (OAuth handoff stub redirect contract)
- **Selene**: producer to Persephone (DashboardData TypeScript types) + Demeter (DashboardQuery Pydantic schema)

### Wave 2 visual modes
- **Hera**: producer to Persephone (sprint overlay state) + Hades (PR webhook visual state machine)
- **Asclepius**: producer to Triton (resident response consume hook) + Pandora (simulation event consume hook)
- **Boreas**: producer to Triton (Hermes tour DSL) + Demeter (event-store query stub)
- **Persephone**: producer to Triton (ChatMessage/ChatContext/ChatThread types)

### Wave 3 backend
- **Hades**: producer to Nemesis (ParserService) + Pandora (ParserService) + Demeter (PREventPersist + GitHubUserUpsert)
- **Triton**: producer to Nemesis (LLMResponse) + Pandora (multi-turn coordination) + 5 runtime residents (per-resident routing)
- **Nemesis**: producer to Demeter (FindingPersist + DriftEventPersist) + Asclepius feedback (finding events)
- **Pandora**: producer to Demeter (ProposalPersist + SimulationEventPersist + LLMCallLog) + Asclepius feedback (simulation events)
- **Demeter**: producer to Selene feedback (materialized view SQL) + Boreas feedback (activity event-store)
- **Atlas**: producer to production env (Dockerfile + K8s YAML + deploy script)

### Auditors
- **Eunomia**: consumes Wave 1 outputs
- **Dike**: consumes Wave 2 outputs
- **Aletheia**: consumes Wave 3 outputs + produces handoff to Pan

### Universal worker
- **Pan**: consumes Aletheia handoff, dynamic dispatch per Day 2 task chain

## Source citation

- **Metis Section 3 (Roster, Full)**: line 148-184 of `_meta/metis/Agentic_Structure-codeplex-chronicle.md`
- **Hephaestus worker prompts**: `.claude/agents/*.md` 19 files locked 2026-05-12 19:30 WIB per `_meta/orchestration_log/V0_hephaestus_prompts_locked_20260512-1930.md`
- **Pythia contracts**: `_meta/contracts/_master_index.md` + `_meta/contracts/_anti_collision_matrix.md`
- **PRD D11 Iris drop**: `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` Section 28 Decision Log entry D11

## Open evolution path

If a future spawn requires a new agent or rename existing agent:
1. Ferry V1 Orch (Themis post-Wave 0 retired per Lock 9)
2. V1 Orch may amend roster via `_meta/decisions/roster_amendment_<N>.md` with version suffix
3. Original `_meta/roster.md` snapshot kept per Lock 9 V_n rule
4. New name must check `_meta/contracts/_anti_collision_matrix.md` before lock

---

**End of `_meta/roster.md`**. Downstream consumption: V1 Orch references this file pre-spawn to identify worker prompt path + effort tier. Auditors reference this file to confirm Greek naming compliance + correct effort tier match.
