# V3 Snapshot: Pandora Wave 3 (Refactor Engine Locked, RETRO-AUTHORED)

**Worker**: Pandora (Wave 3)
**Wave**: 3
**Status**: SHIP CLEAN (retro-authored by Pan post-Wave 3)
**Original ship timestamp**: 2026-05-12 21:48 WIB Day 1 evening
**Retro-author timestamp**: 2026-05-12 23:55 WIB Day 1 evening (Pan Cycle 1 Duty 4)
**Authoring authority**: Pan (post-Wave 3 universal worker, per Aletheia handoff Section "Known limitations" Item 8)
**Audit gate**: Aletheia Wave 3 PASS-with-deferred (Section 13.x Pandora V_n file MISSING flagged as housekeeping deferred)

---

## Why this snapshot exists

Pandora Wave 3 cycle 1 shipped clean 2026-05-12 21:48 WIB with 43/43 test PASS + 4 mandatory artifact (decision log + uncertainty journal + checkpoint + handoff log) + Aletheia downstream audit PASS for Pandora ownership domain. However, the V_n locked snapshot file (per Lock 9 anti-pattern compliance) was NOT authored at ship time. Aletheia Wave 3 audit detected this as item 13.3 PASS-with-deviation (Pandora V_n MISSING), flagged it as low-effort housekeeping deferred to Pan post-Wave 3 Cycle 1.

This retro-authored snapshot consolidates Pandora ship state for completeness + audit trail integrity. Content derived from `_meta/checkpoints/pandora-cycle1.md` (130 line ship-clean checkpoint) + `_meta/decision_log/pandora.md` (10 decision entry) + `_meta/uncertainty/pandora-cycle1-20260512-2148.md` (8 medium concern) + handoff logs at `_meta/handoff_log/wave3_pandora_*.md`.

---

## Output produced (verbatim from cycle 1 ship)

### Backend services (8 file authored)

| Path | LOC | Purpose |
|---|---|---|
| `backend/app/services/refactor/__init__.py` | 64 | Barrel export module |
| `backend/app/services/refactor/types.py` | 296 | Pydantic schema + Asclepius enum mirror (9-stage SimulationStage) |
| `backend/app/services/refactor/drafts_isolation.py` | 296 | AD-19 safety guard + 5 attack-vector defence |
| `backend/app/services/refactor/prompts.py` | 195 | Athena persona + 4 prompt builder |
| `backend/app/services/refactor/llm_stub.py` | 245 | LLMClient stub + canned response router |
| `backend/app/services/refactor/proposal_author.py` | 357 | Athena intent analyser + ghost layout placer |
| `backend/app/services/refactor/openspec_generator.py` | 305 | Folder A + Folder B mirror generator |
| `backend/app/services/refactor/github_issue_fallback.py` | 196 | Progressive degradation fallback |
| `backend/app/services/refactor/simulation_engine.py` | 422 | 3-turn orchestrator + AD-19 isolation enforcement |
| `backend/app/services/refactor/ws_publisher.py` | 167 | In-memory bus + publisher |
| `backend/app/services/refactor/demeter_adapter.py` | 168 | Persist stub |

### Backend API (4 file authored)

| Path | LOC | Purpose |
|---|---|---|
| `backend/app/api/refactor/__init__.py` | 17 | Router barrel |
| `backend/app/api/refactor/routes.py` | 247 | 3 dual review gate endpoints + accept-info probe |
| `backend/app/api/refactor/ws_routes.py` | 69 | WebSocket /api/ws/refactor-events |
| `backend/app/api/refactor/schemas.py` | 56 | Request/response Pydantic |

### Tests (4 file authored, 43 test PASS)

| Path | Test count | Coverage |
|---|---|---|
| `backend/tests/test_drafts_isolation_smoke.py` | 14 | AD-19 LOCKED safety property |
| `backend/tests/test_refactor_types_smoke.py` | 11 | 9-stage enum + Pydantic parity |
| `backend/tests/test_simulation_engine_smoke.py` | 7 | E2E NodeGoat 2FA + Phase B Topic E + AD-19 mtime sentinel + degraded LLM path |
| `backend/tests/test_dual_review_gate_smoke.py` | 11 | 3 endpoint integration + WebSocket streaming |

---

## Critical safety property verification (AD-19 LOCKED, defensibility pitch core)

1. `safe_draft_write` raises `DraftIsolationViolation` on 5 distinct escape vectors before any disk write
2. `safe_draft_write` happy path resolved target is provably a subpath of `DRAFTS_ROOT / simulation_id` via `Path.relative_to` (NOT string startswith; defence-in-depth)
3. `test_simulation_engine_does_not_touch_production_paths` runs a full E2E simulation with `DRAFTS_ROOT=tmp_path` + asserts the mtime of `backend/app/__init__.py` + `frontend/src/modes/refactor/types.ts` is unchanged before vs after
4. Simulation engine catches `DraftIsolationViolation` explicitly + publishes `stage='discarded'` + cleans up drafts + returns with `result["stage"]="discarded"`. NO production write path exists in the simulation engine
5. Cleanup function `cleanup_simulation_dir` performs `_is_subpath(sim_dir, drafts_root)` check BEFORE `shutil.rmtree` (defence-in-depth against corrupted state)

## Phase B Topic E quirk handling (DeepSeek V4 reasoning_content NEVER replayed)

`test_multi_turn_does_not_replay_reasoning_content` introspects every LLM call captured during a full simulation + asserts no message has `role='assistant'`. Pandora prompt builders flatten Turn N-1 visible content into the Turn N user-role string, so `reasoning_content` cannot leak even if LLM client erroneously emits it. Strictest possible guard against the quirk.

---

## Asumption baked

1. AD-19 drafts/ isolation safety property LOCKED (production code never touched by simulation engine, only via explicit user Accept)
2. 9-stage SimulationStage enum parity Asclepius Wave 2 frontend mirror (verbatim string match)
3. Phase B Topic E reasoning_content NEVER replay (Pandora prompt builder flatten Turn N-1 visible content into Turn N user-role string)
4. drafts/ folder gitignored per project root .gitignore + AD-19 regenerable property
5. dual review gate Accept downloads diff (NOT auto-PR write) per PRD Section 19.3 minimal OAuth scope + PRD OQ-09 Accept behaviour
6. Athena V4-Pro thinking=high per PRD 18.3 resident routing LOCKED (Pandora consumes Triton LLMClient via Protocol injection)

## Stub-and-sync handoff at ship time

- LLMClient (Triton): Cycle 2 swap from `StubLLMClient` to `app.llm.client.get_deepseek_client`
- ParserService (Hades): Cycle 2 swap from `ParserServiceProtocol` to `app.parsers.get_parser_service`
- DemeterService (Demeter): Cycle 2 swap from `StubDemeterAdapter` to `app.services.demeter_service.get_demeter_service`
- EventBus (Hades): Cycle 2 swap from `InMemoryRefactorBus` to `app.services.event_bus.refactor_bus`

Cycle 2 swap is a 1-line import edit per Protocol because every call site consumes a Protocol-typed parameter.

---

## 4 mandatory artifact at ship time

1. **Decision log**: `_meta/decision_log/pandora.md` (10 decision entry)
2. **Uncertainty journal**: `_meta/uncertainty/pandora-cycle1-20260512-2148.md` (8 medium concern)
3. **Checkpoint**: `_meta/checkpoints/pandora-cycle1.md` (130 line ship-clean state)
4. **Handoff logs**:
   - `_meta/handoff_log/wave3_pandora_cycle1_stub.md`
   - `_meta/handoff_log/wave3_pandora_to_asclepius.md`
   - `_meta/handoff_log/wave3_pandora_to_demeter.md`

5. **V_n snapshot**: THIS FILE (retro-authored Pan Cycle 1 Duty 4, 2026-05-12 23:55 WIB)

---

## Validation evidence chain

| Check | Result | Source |
|---|---|---|
| 43/43 Pandora-owned test PASS | OK | `_meta/checkpoints/pandora-cycle1.md` |
| 14 AD-19 attack-vector PASS | OK | `test_drafts_isolation_smoke.py` |
| Phase B Topic E quirk guard | OK | `test_multi_turn_does_not_replay_reasoning_content` |
| Production mtime sentinel | OK | `test_simulation_engine_does_not_touch_production_paths` |
| 9-stage enum parity Asclepius | OK | `_meta/contracts/asclepius-to-pandora.md` |
| Dual review gate API 3 endpoint | OK | `backend/app/api/refactor/routes.py` |
| WebSocket streaming /api/ws/refactor-events | OK | `backend/app/api/refactor/ws_routes.py` |
| OpenSpec dual-folder generator | OK | `backend/app/services/refactor/openspec_generator.py` |
| GitHub issue fallback progressive | OK | `backend/app/services/refactor/github_issue_fallback.py` |
| Aletheia Wave 3 downstream audit | PASS-with-deferred | `_meta/audit/aletheia_wave3_audit.md` Section 2.3 |

---

## V_n lock authority

This V_n snapshot file represents Pandora Wave 3 SHIP CLEAN state at 2026-05-12 21:48 WIB ORIGINAL + retro-author 2026-05-12 23:55 WIB consolidation. Lock 9 V_n integrity property: this file is READ-ONLY post-Pan retro-author. Future Pandora work (none expected, Wave 3 ship complete) creates new V_n with new STAMP.

---

## Reference

- `_meta/checkpoints/pandora-cycle1.md` (source content)
- `_meta/decision_log/pandora.md` (10 decision evidence)
- `_meta/uncertainty/pandora-cycle1-20260512-2148.md` (8 medium concern)
- `_meta/handoff_log/wave3_pandora_*.md` (3 handoff contract)
- `_meta/audit/aletheia_wave3_audit.md` Section 13.3 (V_n missing flagged, deferred to Pan)
- `_meta/handoffs/aletheia_wave3_handoff.md` Section "Known limitations" Item 8 (Pan retro-author directive)
- `_meta/decision_log/pan.md` Decision 2 (Pan retro-author rationale)

---

**Pandora V_n snapshot LOCKED retro-author by Pan**: 2026-05-12 23:55 WIB Day 1 evening.
