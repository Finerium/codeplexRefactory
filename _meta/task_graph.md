# Task Graph (DAG, Canonical)

**Translated from**: `_meta/metis/Agentic_Structure-codeplex-chronicle.md` Section 2 (Task Graph, Full)
**Translated by**: Themis (Wave 0 specialist, project-local setup smith)
**Translation date**: 2026-05-12 16:30 WIB
**Status**: locked (mirrors Metis canonical, edges enriched with Pythia contract paths from `_meta/contracts/_master_index.md`)

## Purpose

Canonical DAG of all agentic work for Codeplex Chronicle. Each node = one agent (worker or auditor). Each edge = one handoff with explicit Pythia contract documenting input/output schema. Use this graph to:

1. Identify which agent spawns next given current Wave state
2. Trace handoff dependencies before re-spawning a failed agent
3. Verify no cycles, no orphan nodes per Lock 9 V_n snapshot integrity rule
4. Cross-reference contract paths during audit (Eunomia/Dike/Aletheia)

## Wave 0 (Sequential, 12% capacity, ~2.9 hours, ~13:00-16:00 Day 1)

| From | To | Edge type | Contract reference |
|---|---|---|---|
| (init) | Pythia | spawn | (N/A, Wave 0 entry) |
| Pythia | Hephaestus | intra-wave 0 internal | `_meta/handoff_log/wave0_pythia_to_hephaestus.md` |
| Hephaestus | Themis | intra-wave 0 internal | `_meta/handoff_log/wave0_hephaestus_to_themis.md` |
| Themis | Wave 1 entry | downstream unlock | `_meta/handoff_log/wave0_themis_to_wave1.md` (this cycle output) |

**Wave 0 outputs** (all consumed by Wave 1+):
- `_meta/contracts/*.md` 33 contracts + 2 index files (Pythia)
- `.claude/agents/*.md` 19 worker prompts + `PromptOpening-codeplex-chronicle.md` (Hephaestus)
- `_meta/{task_graph,roster,wave_layout}.md` canonical + `.claude/{skills,hooks,commands,settings.json}` + `_meta/` skeleton + `CLAUDE.md` + `STATUS.md` + `PanitSubmission/` + `docs/c4/` + `openspec/` enriched + `.agent-openspec/` init + ERD (Themis, this cycle)

## Wave 1 (Parallel branches, 22% capacity, ~5.3 hours, ~16:00-21:30 Day 1)

Five worker branches converge at Eunomia audit gate. Daedalus + Iris zero Designer dependency, fire first. Calliope + Hestia + Selene wait condition Designer bundle landing.

| From | To | Edge type | Contract reference |
|---|---|---|---|
| (V1 Orch dispatch) | Daedalus | spawn | (N/A, Wave 1 entry) |
| (V1 Orch dispatch) | Iris | spawn paralel Daedalus | (N/A, Wave 1 entry) |
| Daedalus | Iris | intra-wave 1 | `_meta/contracts/daedalus-to-iris.md` |
| Iris | Hera | cross-wave 1 to 2 | `_meta/contracts/iris-to-hera.md` |
| Ghaisan claude.ai/design bundle | Calliope | external | `_meta/contracts/claude-design-bundle-to-calliope.md` |
| Calliope | Wave 2 panel workers | cross-wave 1 to 2 | `_meta/contracts/calliope-to-wave2-panels.md` |
| Ghaisan claude.ai/design bundle | Hestia | external | `_meta/contracts/claude-design-bundle-to-hestia.md` |
| Hestia | Hades | cross-wave 1 to 3 | `_meta/contracts/hestia-to-hades.md` |
| Ghaisan claude.ai/design bundle | Selene | external | `_meta/contracts/claude-design-bundle-to-selene.md` |
| Selene | Persephone | cross-wave 1 to 2 | `_meta/contracts/selene-to-persephone.md` |
| Selene | Demeter | cross-wave 1 to 3 | `_meta/contracts/selene-to-demeter.md` |
| Wave 1 workers (Daedalus, Iris, Calliope, Hestia, Selene) | Eunomia | audit gate | `_meta/contracts/eunomia-wave1-audit.md` |
| Eunomia PASS | Wave 2 spawn unlock | gate clearance | (audit binary PASS/FAIL) |

## Wave 2 (Parallel branches, 30% capacity, ~7.2 hours, ~21:30 Day 1 to ~04:45 Day 2)

Four worker branches plus Dike audit. Hera is HERO mode carrying differentiator weight.

| From | To | Edge type | Contract reference |
|---|---|---|---|
| (V1 Orch dispatch post-Eunomia PASS) | Hera | spawn | (Wave 2 entry) |
| (V1 Orch dispatch post-Eunomia PASS) | Asclepius | spawn paralel | (Wave 2 entry) |
| (V1 Orch dispatch post-Eunomia PASS) | Boreas | spawn paralel | (Wave 2 entry) |
| (V1 Orch dispatch post-Eunomia PASS) | Persephone | spawn paralel | (Wave 2 entry) |
| Hera | Persephone | intra-wave 2 | `_meta/contracts/hera-to-persephone.md` |
| Hera | Hades | cross-wave 2 to 3 | `_meta/contracts/hera-to-hades.md` |
| Asclepius | Triton | cross-wave 2 to 3 | `_meta/contracts/asclepius-to-triton.md` |
| Asclepius | Pandora | cross-wave 2 to 3 | `_meta/contracts/asclepius-to-pandora.md` |
| Boreas | Triton | cross-wave 2 to 3 | `_meta/contracts/boreas-to-triton.md` |
| Boreas | Demeter | cross-wave 2 to 3 | `_meta/contracts/boreas-to-demeter.md` |
| Persephone | Triton | cross-wave 2 to 3 | `_meta/contracts/persephone-to-triton.md` |
| Wave 2 workers (Hera, Asclepius, Boreas, Persephone) | Dike | audit gate | `_meta/contracts/dike-wave2-audit.md` |
| Dike PASS | Wave 3 spawn unlock | gate clearance | (audit binary PASS/FAIL) |

## Wave 3 (Parallel + sequential mix, 28% capacity, ~6.7 hours, ~04:45 to ~11:30 Day 2)

Six backend workers plus Atlas deploy plus Aletheia final audit. Hades + Triton fire first (foundation infrastructure for downstream).

| From | To | Edge type | Contract reference |
|---|---|---|---|
| (V1 Orch dispatch post-Dike PASS) | Hades | spawn | (Wave 3 entry) |
| (V1 Orch dispatch post-Dike PASS) | Triton | spawn paralel Hades | (Wave 3 entry) |
| Hades | Nemesis | intra-wave 3 | `_meta/contracts/hades-to-nemesis.md` |
| Hades | Pandora | intra-wave 3 | `_meta/contracts/hades-to-pandora.md` |
| Hades | Demeter | intra-wave 3 | `_meta/contracts/hades-to-demeter.md` |
| Triton | Nemesis | intra-wave 3 | `_meta/contracts/triton-to-nemesis.md` |
| Triton | Pandora | intra-wave 3 | `_meta/contracts/triton-to-pandora.md` |
| Triton | 5 runtime residents (Athena/Apollo/Argus/Clio/Hermes) | intra-wave 3 terminating at runtime | `_meta/contracts/triton-to-residents.md` |
| Nemesis | Demeter | intra-wave 3 | `_meta/contracts/nemesis-to-demeter.md` |
| Nemesis | Asclepius | feedback Wave 3 to Wave 2 | `_meta/contracts/nemesis-to-asclepius.md` |
| Pandora | Demeter | intra-wave 3 | `_meta/contracts/pandora-to-demeter.md` |
| Pandora | Asclepius | feedback Wave 3 to Wave 2 | `_meta/contracts/pandora-to-asclepius.md` |
| Demeter | Selene | feedback Wave 3 to Wave 1 | `_meta/contracts/demeter-to-selene.md` |
| Demeter | Boreas | feedback Wave 3 to Wave 2 | `_meta/contracts/demeter-to-boreas.md` |
| Atlas | Production env (`duopoly.hackathon.sev-2.com`) | terminal deploy | `_meta/contracts/atlas-to-production.md` |
| Wave 3 workers (Hades, Triton, Nemesis, Pandora, Demeter, Atlas) | Aletheia | audit gate final | `_meta/contracts/aletheia-wave3-audit.md` |
| Aletheia PASS | Pan spawn unlock | gate clearance final | `_meta/contracts/aletheia-to-pan.md` |

## Post-Wave 3 Pan (Universal, 8% capacity, ~1.9 hours, ~11:30 Day 2 onwards)

Pan universal worker, no fixed contract per task. Dynamic dispatch per Day 2 need.

| From | To | Edge type | Contract reference |
|---|---|---|---|
| Aletheia handoff | Pan | post-Wave 3 spawn | `_meta/contracts/aletheia-to-pan.md` |
| Pan | (demo rehearsal 3x consecutive) | universal duty 1 | (no contract, ad-hoc) |
| Pan | (slide deck prompt template for Hafiz consume) | universal duty 2 | (no contract, ad-hoc) |
| Pan | (bug sweep + polish + rescue if auditor escalates) | universal duty 3 | (no contract, ad-hoc) |
| Pan | (PanitSubmission final pass curation) | universal duty 4 | (no contract, ad-hoc) |
| Pan | Lesson-learned author (on user trigger close session) | universal duty 5 | (no contract, ad-hoc) |
| Pan | Submission Day 2 jam 11-13 WIB | terminal handoff to operator | (Ghaisan/Hafiz handle submission portal upload) |
| (kalau top 5) | Pitch Day 2 jam 15-17 WIB | terminal handoff to operator | (Hafiz physically attend, mandatory per Refactory rule) |

## DAG Validation (per Metis md Section 11 self-check item 12)

- **No cycles**: Wave 0 to 1 to 2 to 3 to Pan is linear forward progression. Feedback edges (nemesis-to-asclepius, pandora-to-asclepius, demeter-to-selene, demeter-to-boreas) are state-update notifications, NOT new spawn triggers. Workers downstream consume events but do NOT re-trigger upstream workers per Lock 9.
- **No orphan nodes**: every node has at least one inbound edge (spawn trigger) and at least one outbound edge (handoff or terminal output to production/operator).
- **Intra-wave parallelism**: Wave 1 has 5 worker parallel branches converging at Eunomia. Wave 2 has 4 worker parallel branches converging at Dike. Wave 3 has 6 worker parallel branches converging at Aletheia. Audit gates ensure synchronization before next-wave spawn.
- **Cross-wave handoff explicit**: 12 cross-wave contracts (sourced `_meta/contracts/_master_index.md` "cross-wave (12 contracts)" section). Each cross-wave edge has explicit Pythia contract documenting schema + WebSocket channel + Python service interface as applicable.

## Edge type legend

- **intra-wave**: producer + consumer in same wave (e.g., `daedalus-to-iris.md` Wave 1)
- **cross-wave**: producer in earlier wave, consumer in later wave (e.g., `iris-to-hera.md` Wave 1 to Wave 2)
- **external**: producer outside Claude Code workers (Ghaisan via claude.ai/design platform)
- **feedback**: producer in later wave, consumer in earlier wave (state-update notification, NOT spawn trigger)
- **terminal**: producer Wave 3, consumer is production environment (e.g., `atlas-to-production.md`)
- **audit gate**: Wave N workers as producer, auditor (Eunomia/Dike/Aletheia) as consumer
- **handoff**: auditor to next-phase worker (e.g., `aletheia-to-pan.md`)

## Source citation

- **Metis Section 2 (Task Graph, Full)**: line 23-147 of `_meta/metis/Agentic_Structure-codeplex-chronicle.md`
- **Pythia contract paths**: `_meta/contracts/_master_index.md` (33 contracts + 2 index files locked 2026-05-12 16:50 WIB)
- **Hephaestus worker prompts**: `.claude/agents/*.md` 19 files locked 2026-05-12 19:30 WIB
- **Anti-collision matrix**: `_meta/contracts/_anti_collision_matrix.md`

## Open evolution path

If Wave 2-3 workers detect DAG ambiguity or unexpected dependency:
1. Ferry V1 Orch (Themis post-Wave 0 retired per Lock 9)
2. V1 Orch may amend DAG via `_meta/decisions/dag_amendment_<N>.md` with version suffix
3. Original `_meta/task_graph.md` snapshot kept per Lock 9 V_n rule (no in-place edit post-V0 lock)

---

**End of `_meta/task_graph.md`**. Downstream consumption: Wave 1-3 workers reference this file pre-cycle to validate edge contract before authoring artifacts. Auditors reference this file to confirm DAG integrity (no orphan, no cycle, no missing contract).
