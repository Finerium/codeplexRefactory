# Master Index: Codeplex Chronicle Cross-Agent Contracts

**Authored by**: Pythia (Wave 0 contract author)
**Date**: 2026-05-12 16:50 WIB
**Status**: locked
**Total contracts**: 33 worker + 2 index files = 35 files

## Purpose

Single index aggregating all cross-agent contracts authored by Pythia. Each contract documents one DAG edge from `_meta/metis/Agentic_Structure-codeplex-chronicle.md` Section 2 Task Graph. Use this index to find the canonical contract for any worker pair.

## Index by edge type

### Wave 1 internal + Designer bundle external (8 contracts, Cycle 1)

| # | Contract | Producer | Consumer | Edge type | Status |
|---|---|---|---|---|---|
| 1 | [daedalus-to-iris.md](daedalus-to-iris.md) | Daedalus | Iris | intra-wave | locked |
| 2 | [iris-to-hera.md](iris-to-hera.md) | Iris | Hera | cross-wave | locked |
| 3 | [claude-design-bundle-to-calliope.md](claude-design-bundle-to-calliope.md) | Ghaisan/claude.ai/design | Calliope | external | locked |
| 4 | [calliope-to-wave2-panels.md](calliope-to-wave2-panels.md) | Calliope | Wave 2 panel workers | cross-wave | locked |
| 5 | [claude-design-bundle-to-hestia.md](claude-design-bundle-to-hestia.md) | Ghaisan/claude.ai/design | Hestia | external | locked |
| 6 | [hestia-to-hades.md](hestia-to-hades.md) | Hestia | Hades | cross-wave | locked |
| 7 | [claude-design-bundle-to-selene.md](claude-design-bundle-to-selene.md) | Ghaisan/claude.ai/design | Selene | external | locked |
| 8 | [selene-to-persephone.md](selene-to-persephone.md) | Selene | Persephone | cross-wave | locked |

### Wave 1 to Wave 2/3 + Wave 2 internal + Wave 2 to Wave 3 (8 contracts, Cycle 2)

| # | Contract | Producer | Consumer | Edge type | Status |
|---|---|---|---|---|---|
| 9 | [selene-to-demeter.md](selene-to-demeter.md) | Selene | Demeter | cross-wave | locked |
| 10 | [hera-to-persephone.md](hera-to-persephone.md) | Hera | Persephone | intra-wave | locked |
| 11 | [hera-to-hades.md](hera-to-hades.md) | Hera | Hades | cross-wave | locked |
| 12 | [asclepius-to-triton.md](asclepius-to-triton.md) | Asclepius | Triton | cross-wave | locked |
| 13 | [asclepius-to-pandora.md](asclepius-to-pandora.md) | Asclepius | Pandora | cross-wave | locked |
| 14 | [boreas-to-triton.md](boreas-to-triton.md) | Boreas | Triton | cross-wave | locked |
| 15 | [boreas-to-demeter.md](boreas-to-demeter.md) | Boreas | Demeter | cross-wave | locked |
| 16 | [persephone-to-triton.md](persephone-to-triton.md) | Persephone | Triton | cross-wave | locked |

### Wave 3 internal first half (6 contracts, Cycle 3)

| # | Contract | Producer | Consumer | Edge type | Status |
|---|---|---|---|---|---|
| 17 | [hades-to-nemesis.md](hades-to-nemesis.md) | Hades | Nemesis | intra-wave | locked |
| 18 | [hades-to-pandora.md](hades-to-pandora.md) | Hades | Pandora | intra-wave | locked |
| 19 | [hades-to-demeter.md](hades-to-demeter.md) | Hades | Demeter | intra-wave | locked |
| 20 | [triton-to-nemesis.md](triton-to-nemesis.md) | Triton | Nemesis | intra-wave | locked |
| 21 | [triton-to-pandora.md](triton-to-pandora.md) | Triton | Pandora | intra-wave | locked |
| 22 | [triton-to-residents.md](triton-to-residents.md) | Triton | 5 runtime residents | intra-wave (terminates at runtime) | locked |

### Wave 3 second half + feedback edges + production (7 contracts, Cycle 4)

| # | Contract | Producer | Consumer | Edge type | Status |
|---|---|---|---|---|---|
| 23 | [nemesis-to-demeter.md](nemesis-to-demeter.md) | Nemesis | Demeter | intra-wave | locked |
| 24 | [nemesis-to-asclepius.md](nemesis-to-asclepius.md) | Nemesis | Asclepius | feedback (Wave 3 to Wave 2) | locked |
| 25 | [pandora-to-demeter.md](pandora-to-demeter.md) | Pandora | Demeter | intra-wave | locked |
| 26 | [pandora-to-asclepius.md](pandora-to-asclepius.md) | Pandora | Asclepius | feedback (Wave 3 to Wave 2) | locked |
| 27 | [demeter-to-selene.md](demeter-to-selene.md) | Demeter | Selene | feedback (Wave 3 to Wave 1) | locked |
| 28 | [demeter-to-boreas.md](demeter-to-boreas.md) | Demeter | Boreas | feedback (Wave 3 to Wave 2) | locked |
| 29 | [atlas-to-production.md](atlas-to-production.md) | Atlas | Production env | terminal (Wave 3 to deploy) | locked |

### Audit gates + Pan handoff (4 contracts, Cycle 5)

| # | Contract | Producer | Consumer | Edge type | Status |
|---|---|---|---|---|---|
| 30 | [eunomia-wave1-audit.md](eunomia-wave1-audit.md) | Wave 1 workers | Eunomia | audit gate | locked |
| 31 | [dike-wave2-audit.md](dike-wave2-audit.md) | Wave 2 workers | Dike | audit gate | locked |
| 32 | [aletheia-wave3-audit.md](aletheia-wave3-audit.md) | Wave 3 workers + Atlas | Aletheia | audit gate (final) | locked |
| 33 | [aletheia-to-pan.md](aletheia-to-pan.md) | Aletheia | Pan | handoff | locked |

### Index meta-files (2 files, Cycle 5)

| # | File | Description |
|---|---|---|
| 34 | [_anti_collision_matrix.md](_anti_collision_matrix.md) | Greek mythology name reuse documentation across Council + workers + runtime residents |
| 35 | [_master_index.md](_master_index.md) | This file |

## Index by worker (producer perspective)

### Wave 0 specialists

- **Pythia**: produces all 33 contracts + 2 index files (this file).
- **Hephaestus**: consumes Pythia output (Wave 0 internal next-spawn).
- **Themis**: consumes Pythia output + Hephaestus output (Wave 0 third spawn).

### Wave 1 builders

- **Daedalus** producer in: `daedalus-to-iris.md`.
- **Iris** producer in: `iris-to-hera.md`. Consumer in: `daedalus-to-iris.md`.
- **Calliope** producer in: `calliope-to-wave2-panels.md`. Consumer in: `claude-design-bundle-to-calliope.md`.
- **Hestia** producer in: `hestia-to-hades.md`. Consumer in: `claude-design-bundle-to-hestia.md`.
- **Selene** producer in: `selene-to-persephone.md`, `selene-to-demeter.md`. Consumer in: `claude-design-bundle-to-selene.md`, `demeter-to-selene.md` (feedback).

### Wave 2 visual modes

- **Hera** producer in: `hera-to-persephone.md`, `hera-to-hades.md`. Consumer in: `iris-to-hera.md`.
- **Asclepius** producer in: `asclepius-to-triton.md`, `asclepius-to-pandora.md`. Consumer in: `nemesis-to-asclepius.md` (feedback), `pandora-to-asclepius.md` (feedback).
- **Boreas** producer in: `boreas-to-triton.md`, `boreas-to-demeter.md`. Consumer in: `demeter-to-boreas.md` (feedback).
- **Persephone** producer in: `persephone-to-triton.md`. Consumer in: `selene-to-persephone.md`, `hera-to-persephone.md`, `calliope-to-wave2-panels.md`.

### Wave 3 backend

- **Hades** producer in: `hades-to-nemesis.md`, `hades-to-pandora.md`, `hades-to-demeter.md`. Consumer in: `hestia-to-hades.md`, `hera-to-hades.md`.
- **Triton** producer in: `triton-to-nemesis.md`, `triton-to-pandora.md`, `triton-to-residents.md`. Consumer in: `asclepius-to-triton.md`, `boreas-to-triton.md`, `persephone-to-triton.md`.
- **Nemesis** producer in: `nemesis-to-demeter.md`, `nemesis-to-asclepius.md` (feedback). Consumer in: `hades-to-nemesis.md`, `triton-to-nemesis.md`.
- **Pandora** producer in: `pandora-to-demeter.md`, `pandora-to-asclepius.md` (feedback). Consumer in: `hades-to-pandora.md`, `triton-to-pandora.md`, `asclepius-to-pandora.md`.
- **Demeter** producer in: `demeter-to-selene.md` (feedback), `demeter-to-boreas.md` (feedback). Consumer in: `selene-to-demeter.md`, `boreas-to-demeter.md`, `hades-to-demeter.md`, `nemesis-to-demeter.md`, `pandora-to-demeter.md`.
- **Atlas** producer in: `atlas-to-production.md` (terminal).

### Auditors

- **Eunomia** consumer in: `eunomia-wave1-audit.md` (audits Wave 1 outputs).
- **Dike** consumer in: `dike-wave2-audit.md` (audits Wave 2 outputs).
- **Aletheia** consumer in: `aletheia-wave3-audit.md` (audits Wave 3 outputs). Producer in: `aletheia-to-pan.md` (handoff).

### Universal worker

- **Pan** consumer in: `aletheia-to-pan.md` (post-Wave 3 handoff). Producer: dynamic per Day 2 task chain (no static contract).

## Index by edge type

### intra-wave (10 contracts)

Producer + consumer in same wave:
- `daedalus-to-iris.md` (Wave 1)
- `hera-to-persephone.md` (Wave 2)
- `hades-to-nemesis.md`, `hades-to-pandora.md`, `hades-to-demeter.md` (Wave 3)
- `triton-to-nemesis.md`, `triton-to-pandora.md`, `triton-to-residents.md` (Wave 3)
- `nemesis-to-demeter.md`, `pandora-to-demeter.md` (Wave 3)

### cross-wave (12 contracts)

Producer in earlier wave, consumer in later wave:
- Wave 1 to Wave 2: `iris-to-hera.md`, `calliope-to-wave2-panels.md`, `selene-to-persephone.md`
- Wave 1 to Wave 3: `hestia-to-hades.md`, `selene-to-demeter.md`
- Wave 2 to Wave 3: `hera-to-hades.md`, `asclepius-to-triton.md`, `asclepius-to-pandora.md`, `boreas-to-triton.md`, `boreas-to-demeter.md`, `persephone-to-triton.md`

### external (3 contracts)

Producer outside Claude Code workers (Ghaisan via claude.ai/design):
- `claude-design-bundle-to-calliope.md`
- `claude-design-bundle-to-hestia.md`
- `claude-design-bundle-to-selene.md`

### feedback (4 contracts)

Producer in later wave, consumer in earlier wave:
- `nemesis-to-asclepius.md` (Wave 3 to Wave 2)
- `pandora-to-asclepius.md` (Wave 3 to Wave 2)
- `demeter-to-selene.md` (Wave 3 to Wave 1)
- `demeter-to-boreas.md` (Wave 3 to Wave 2)

### terminal (1 contract)

Producer Wave 3, consumer is production environment:
- `atlas-to-production.md`

### audit gate (3 contracts)

Wave N workers as producer, auditor as consumer:
- `eunomia-wave1-audit.md`
- `dike-wave2-audit.md`
- `aletheia-wave3-audit.md`

### handoff (1 contract)

Auditor to next-phase worker:
- `aletheia-to-pan.md`

## Index by primary schema type

### TypeScript interface (frontend code, 14 contracts)

- daedalus-to-iris
- iris-to-hera
- calliope-to-wave2-panels
- selene-to-persephone
- hera-to-persephone
- asclepius-to-triton (frontend store + backend API)
- asclepius-to-pandora (frontend events)
- boreas-to-triton (DSL + backend API)
- persephone-to-triton (frontend types)
- claude-design-bundle-to-calliope (bundle file structure)
- claude-design-bundle-to-hestia (bundle file structure)
- claude-design-bundle-to-selene (bundle file structure)
- nemesis-to-asclepius (frontend events)
- pandora-to-asclepius (frontend hook)

### Pydantic + HTTP endpoint (backend API, 9 contracts)

- hestia-to-hades (FastAPI router)
- selene-to-demeter (FastAPI + Pydantic models)
- hera-to-hades (FastAPI WebSocket + webhook)
- boreas-to-demeter (FastAPI + Pydantic)
- hades-to-demeter (Python service interface + Pydantic)
- nemesis-to-demeter (Python service + Pydantic + SQL schema)
- pandora-to-demeter (Python service + Pydantic + SQL schema)
- demeter-to-selene (Python service + materialized view SQL)
- demeter-to-boreas (Python service + materialized view SQL)

### Python service interface (backend module, 6 contracts)

- hades-to-nemesis (parser service)
- hades-to-pandora (parser service for proposals + drafts verification)
- triton-to-nemesis (LLM client + Argus persona)
- triton-to-pandora (LLM client + multi-turn simulation)
- triton-to-residents (LLM client + per-resident routing)
- atlas-to-production (Dockerfile + K8s YAML + deploy script)

### Audit checklist (3 contracts)

- eunomia-wave1-audit
- dike-wave2-audit
- aletheia-wave3-audit

### Handoff document (1 contract)

- aletheia-to-pan

## Schema cross-references

### Shared canonical types

- **BuildingData / CityData / DistrictData** (TypeScript): defined in `iris-to-hera.md`, referenced by `calliope-to-wave2-panels.md`, `hera-to-persephone.md`, `boreas-to-triton.md`.
- **SprintStatus / BuildingSprintContext** (TypeScript): defined in `hera-to-persephone.md`, referenced by `hera-to-hades.md` (WebSocket event payload).
- **ApolloFinding** (TypeScript + Pydantic): defined in `asclepius-to-triton.md`, referenced by `nemesis-to-demeter.md` (Finding persist), `nemesis-to-asclepius.md` (feedback event).
- **SimulationEvent / RefactorProposalEvent / GhostBuildingHint** (TypeScript + Pydantic): defined in `asclepius-to-pandora.md`, referenced by `pandora-to-demeter.md`, `pandora-to-asclepius.md`.
- **DashboardData** (TypeScript + Pydantic): defined in `selene-to-persephone.md`, referenced by `selene-to-demeter.md`, `demeter-to-selene.md`.
- **ActivityData** (TypeScript + Pydantic): defined in `boreas-to-demeter.md`, referenced by `demeter-to-boreas.md`.
- **ChatMessage / ChatContext / ChatThread** (TypeScript + Pydantic): defined in `persephone-to-triton.md`, referenced by `triton-to-residents.md`.
- **LLMResponse / LLMMessage / ThinkingMode** (Python): defined in `triton-to-nemesis.md`, referenced by `triton-to-pandora.md`, `triton-to-residents.md`.
- **ParserService / ParsedRepo / ParsedFile / ParsedSymbol** (Python): defined in `hades-to-nemesis.md`, referenced by `hades-to-pandora.md`.
- **DemeterService / GitHubUserUpsert / PREventPersist** (Python): defined in `hades-to-demeter.md`, extended by `nemesis-to-demeter.md` (FindingPersist + DriftEventPersist) + `pandora-to-demeter.md` (ProposalPersist + SimulationEventPersist + LLMCallLog).

### WebSocket channels (3 channels, multiple contracts)

- `/api/ws/building-events`: defined in `hera-to-hades.md`. Consumed by Hera + Persephone.
- `/api/ws/finding-events`: defined in `nemesis-to-asclepius.md`. Consumed by Asclepius.
- `/api/ws/refactor-events`: defined in `pandora-to-asclepius.md`. Consumed by Asclepius.

### Postgres tables (8 tables across migrations)

- `users` (migration 001, defined in `hades-to-demeter.md`)
- `pr_events` (migration 001, defined in `hades-to-demeter.md`)
- `finding_events` (migration 002, defined in `nemesis-to-demeter.md`)
- `drift_log` (migration 002, defined in `nemesis-to-demeter.md`)
- `proposals` (migration 003, defined in `pandora-to-demeter.md`)
- `simulation_events` (migration 003, defined in `pandora-to-demeter.md`)
- `llm_call_log` (migration 003, defined in `pandora-to-demeter.md`)
- Materialized views (migration 004 + 005, defined in `demeter-to-selene.md` + `demeter-to-boreas.md`)

## Validation status

All 33 contracts mutually consistent per cross-reference table above. No orphan input/output, no schema conflict identified.

Per-cycle checkpoint validation:
- Cycle 1 checkpoint: `_meta/checkpoints/pythia-cycle1.md` (high confidence)
- Cycle 2 checkpoint: `_meta/checkpoints/pythia-cycle2.md` (high confidence)
- Cycle 3 checkpoint: `_meta/checkpoints/pythia-cycle3.md` (high confidence)
- Cycle 4 checkpoint: `_meta/checkpoints/pythia-cycle4.md` (high confidence)
- Cycle 5 checkpoint: `_meta/checkpoints/pythia-cycle5.md` (this cycle, generated post-this-file)

## Downstream consumption

This index is consumed by:
- **Hephaestus** (Wave 0 next spawn): authors worker prompts referencing contract paths from this index.
- **Themis** (Wave 0 third spawn): copies relevant contracts into `_meta/orches/` canonical files + `PanitSubmission/` curation.
- **Wave 1-3 workers**: read their assigned contracts before authoring artifacts.
- **Eunomia / Dike / Aletheia auditors**: cross-check worker outputs against contract schemas.
- **Pan**: rescue context if escalation includes specific contract conformance failure.

## Open evolution path

If Wave 2-3 workers detect schema gaps or inconsistencies, ferry V1 Orch with proposed amendment. Pythia post-Wave 0 is retired (Wave 0 spec); amendments tracked in `_meta/decisions/contract_amendment_<N>.md` with versioned suffix per Lock 9 V_n snapshot rule.
