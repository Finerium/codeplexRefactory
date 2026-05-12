# Handoff Log: Wave 3 Pandora to Wave 2 Asclepius (Feedback Edge)

**Edge**: Wave 3 Pandora (Refactor simulation engine + WebSocket publisher) to Wave 2 Asclepius (Refactor Mode visual + dual review gate UI).
**Contract**: `_meta/contracts/pandora-to-asclepius.md` (canonical) + `_meta/contracts/asclepius-to-pandora.md` (schema reverse direction).
**Date**: 2026-05-12 21:48 WIB Day 1 evening
**Status**: Pandora Cycle 1 ship clean; Asclepius Wave 2 already ship-clean (`SHIP-CLEAN 2026-05-12 23:55 WIB` per STATUS.md).

## What Pandora produces (publish surface)

### WebSocket channel

`/api/ws/refactor-events?simulationId=<id>`

Mounted at `backend/app/api/refactor/ws_routes.py`. Hades's WebSocket setup at `backend/app/api/websocket.py` will integrate this router via `app.include_router(ws_router)` at app boot. Cycle 1 ship: the WebSocket route works standalone via FastAPI TestClient (verified by `test_websocket_streams_event_sequence`).

### Event sequence per simulation

Per `_meta/handoff_log/wave2_asclepius_to_pandora.md` "Event publishing matrix":

| Sequence | Event type | Stage / payload |
|---|---|---|
| 1 (Turn 0) | `simulation.proposal` | RefactorProposalEvent: simulationId + openspecChangePath + title + summary + userIntent + ghostBuildings + timestamp |
| 2 (Turn 1 start) | `simulation.stage` | stage='tests_generating', payload.progressPercent=10 |
| 3 (Turn 1 complete) | `simulation.stage` | stage='tests_written', payload.progressPercent=35, payload.filesAffected=[...tests files...] |
| 4 (Turn 2 start) | `simulation.stage` | stage='impl_generating', payload.progressPercent=45 |
| 5 (Turn 2 complete) | `simulation.stage` | stage='impl_written', payload.progressPercent=78, payload.filesAffected=[...impl files...] |
| 6 (Turn 3 start) | `simulation.stage` | stage='diff_serializing', payload.progressPercent=88 |
| 7 (Turn 3 complete) | `simulation.stage` | stage='completed', payload.progressPercent=100, payload.draftsPath, payload.filesAffected=[...tests + impl + diff.patch...] |
| 8a (user clicks Accept) | `simulation.stage` | stage='accepted', payload.diffFilePath |
| 8b (user clicks Discard) | `simulation.stage` | stage='discarded' |
| Failure path | `simulation.stage` | stage='discarded', payload.error |

The event ordering is strict per Pandora's `SimulationEngine.run` implementation. Backfill on late subscription: the `InMemoryRefactorBus` retains the last 64 events per simulationId so a client connecting after the simulation completes receives the full history.

### Backend dual review gate endpoints

Per `_meta/handoff_log/wave2_asclepius_to_pandora.md` lines 117-137 + this Pandora ship:

- `POST /api/refactor/simulate` (returns 202 + simulation_id + openspec_change_path + title + summary + websocket_url).
- `GET /api/refactor/{simulation_id}/accept-info` (returns 200 + diff_path + diff_size_bytes; 404 if diff not yet ready).
- `POST /api/refactor/{simulation_id}/accept[?cleanup=true]` (returns 200 + FileResponse octet-stream filename=`refactor-<sim>.diff`).
- `POST /api/refactor/{simulation_id}/discard` (returns 200 + drafts_cleaned: true).

The Asclepius hook `useSimulationEvents` already supports `mode='websocket' + simulationId`; the Wave 3 swap from `mode='mock'` to `mode='websocket'` is a single config change on the React component (Asclepius Wave 2 implementation per the Wave 2 handoff doc lines 100-104).

### GhostBuildingHint position constraint

Per `_meta/handoff_log/wave2_asclepius_to_pandora.md` "Ghost building position computation": Pandora places ghosts at `x = 68 + 10 * idx, z = -22` (the Wave 2 mock band, outside the Iris squarified treemap envelope `x in [-60, +60]`). Asclepius rendering does NOT need to recompute; it reads the position field directly per contract Asumption 5.

If Wave 2 demo rehearsal feedback requests district-adjacent ghost placement, Pandora Cycle 2 polish would add `_district_adjacent_placer` (medium-confidence concern logged in `_meta/uncertainty/pandora-cycle1-20260512-2148.md` Concern 1).

## What Asclepius continues to do (already ship-clean)

Per the Asclepius Wave 2 handoff doc + STATUS.md Wave 2 progress:

- Subscribe via `useSimulationEvents({ mode: 'websocket', simulationId })` when user clicks "Run Simulation".
- Render `RefactorProposalEvent.ghostBuildings` as transparent + dashed-edge animated ghosts.
- Update `SimulationProgressIndicator` per stage progressPercent.
- Enable Accept + Discard buttons when stage reaches 'completed'.
- Animate ghost-to-solid on stage='accepted' (1.5s easeOutCubic).
- Fade out ghosts on stage='discarded' (0.7s easeOutCubic).
- Cache `ghostBuildings` from the Turn 0 proposal event; subsequent stage events do NOT repeat hints (Asumption 3 per contract).
- Mount via `<RefactorGhostLayer />` inside Hera's `/city` Canvas + `<RefactorMode source='websocket' />` inside Persephone side panel.

## Wave 3 cutover steps

1. Hades's Wave 3 ship integrates Pandora's `ws_router` into the main FastAPI app via `app.include_router(ws_router)` at `backend/app/main.py`.
2. Atlas Wave 3 deploy ensures the K8s pod mounts `DRAFTS_ROOT` to a persistent volume (per `_meta/uncertainty/pandora-cycle1-20260512-2148.md` Concern 5).
3. Asclepius Wave 2 frontend swaps `mode='mock'` to `mode='websocket'` in `frontend/src/modes/refactor/RefactorMode.tsx` (or whichever component drives the hook). The `simulationId` comes from the response of `POST /api/refactor/simulate`.
4. Demo rehearsal: trigger the full flow via `/asclepius-smoke` route; verify the WebSocket events match the matrix above; verify the Accept button downloads `refactor-<sim>.diff`; verify the Discard button clears the ghosts.

## Open questions for Asclepius Wave 3 polish (optional)

- Real-time per-stage progress percentage: PRD Section 9.3 mentions per-stage progress. Wave 3 default (per Pandora Decision 8 + handoff Asumption 5) = stage-level granularity (10/35/45/78/88/100). If Asclepius polish wants smoother percent interpolation, the UI interpolates between consecutive published events (no Pandora change needed).
- Late-subscriber UX: Asclepius's `useSimulationEvents` with `backfill: true` (default in `InMemoryRefactorBus`) replays the last 64 events on connect. If the user refreshes mid-simulation, the UI re-renders the full progression instantly. Verify in demo rehearsal.

## Pandora ferry status

NOT triggered. All 5 high-bar conditions ruled out per `_meta/checkpoints/pandora-cycle1.md`.

## References

- Pandora prompt: `.claude/agents/pandora.md`
- Plan file: `docs/superpowers/plans/20260512-pandora-wave3.md`
- Pandora Cycle 1 checkpoint: `_meta/checkpoints/pandora-cycle1.md`
- Pandora decisions: `_meta/decision_log/pandora.md`
- Pandora uncertainty journal: `_meta/uncertainty/pandora-cycle1-20260512-2148.md`
- Pythia contracts: `_meta/contracts/pandora-to-asclepius.md` + `_meta/contracts/asclepius-to-pandora.md`
- Asclepius Wave 2 handoff: `_meta/handoff_log/wave2_asclepius_to_pandora.md`
- Backend source: `backend/app/services/refactor/ws_publisher.py` + `backend/app/api/refactor/ws_routes.py`
- Frontend source (Asclepius): `frontend/src/modes/refactor/*`
