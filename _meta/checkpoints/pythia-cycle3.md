# Checkpoint: Pythia cycle 3

**Date**: 2026-05-12 16:08 WIB
**Status**: done

## Files modified this cycle

Created 6 contract files in `_meta/contracts/`:
- `hades-to-nemesis.md` (parser API for Apollo detector + spec-drift detector scan)
- `hades-to-pandora.md` (parser API for proposal author + simulation engine file query + drafts verification)
- `hades-to-demeter.md` (OAuth user upsert + webhook PR event persist)
- `triton-to-nemesis.md` (LLM client for Argus CVSS scoring)
- `triton-to-pandora.md` (LLM client for Athena proposal author + 3-turn simulation engine)
- `triton-to-residents.md` (LLM client for 5 runtime resident endpoint routing)

## Open todos

- [x] Cycle 1 + 2 + 3 authored (22 contracts)
- [ ] Cycle 4: Wave 3 second half + feedback edges + production (7 contracts)
- [ ] Cycle 5: Audit gates + Pan handoff + anti-collision + master index (6 files)
- [ ] Cycle 6: V_n snapshot + handoff to Hephaestus + final 20-item self-check

## Known issues

None this cycle. Cross-consistency checks:
- LLMClient interface in `triton-to-nemesis.md` + `triton-to-pandora.md` + `triton-to-residents.md` consistent (single LLMResponse + LLMMessage schema, defensive layer chain identical).
- ParserService interface in `hades-to-nemesis.md` + `hades-to-pandora.md` consistent (shared singleton via `get_parser_service`).
- DemeterService interface in `hades-to-demeter.md` extensible for additional persist methods (Nemesis + Pandora finding/simulation persist Cycle 4).
- PromptOpening shared header referenced consistently across triton-to-* contracts (Hephaestus Wave 0 single source).
- Per-resident routing PRD Section 18.3 enumerated identically in `persephone-to-triton.md` + `triton-to-residents.md` (no drift).

## Next-cycle dependencies

- Cycle 4 (feedback edges + production):
  - `nemesis-to-demeter.md` persists Finding to `finding_events` via DemeterService (extends `hades-to-demeter.md` interface).
  - `nemesis-to-asclepius.md` feedback to Wave 2 Asclepius glow trigger via WebSocket finding events.
  - `pandora-to-demeter.md` persists simulation events + LLM cost log to `llm_call_log` + `simulation_events`.
  - `pandora-to-asclepius.md` ghost-to-solid simulation event stream (already covered in `asclepius-to-pandora.md`; this is reverse direction documentation).
  - `demeter-to-selene.md` event-store queries feedback to Wave 1 dashboard (`selene-to-demeter.md` already specifies request schema; this documents Demeter's implementation perspective + materialized view refresh).
  - `demeter-to-boreas.md` event-store queries feedback to Wave 2 timeline (`boreas-to-demeter.md` defined; reverse documentation).
  - `atlas-to-production.md` K8s deploy + Dockerfile + smoke test E2E.

## Resumption instruction

If session resumes, read this file + cycle1 + cycle2 checkpoints + decision log. Then read 22 authored contracts in `_meta/contracts/`. Continue Cycle 4 starting with `nemesis-to-demeter.md`.

## Confidence

High. Wave 3 internal infrastructure contracts (Hades parser + Triton LLM client) fully grounded. Cycle 4 extends downstream usage to event store persistence + WebSocket feedback + production deploy.
