# Tasks: Add 2FA to login

> Actionable checklist for the Athena proposal. Track completion in `_meta/decision_log/pandora.md` plus the dual review gate stage events.

## 1. Proposal authoring (Athena Turn 0)

- [x] Capture user intent: `I want to add 2FA to login.`
- [x] Parser pre-pass (Hades `find_callsites`) collect candidate symbols
- [x] Athena V4-Pro think high call to produce proposal JSON
- [x] Compute deterministic ghost building positions
- [x] Generate this OpenSpec change folder (proposal.md plus design.md plus tasks.md)

## 2. Simulation engine (3-turn)

- [ ] Turn 1 test_gen (V4-Pro think high): generate failing tests, write under `drafts/add-2fa-to-login-00eb8c/tests/`
- [ ] Turn 2 impl_gen (V4-Pro think high): generate implementation, write under `drafts/add-2fa-to-login-00eb8c/`
- [ ] Turn 3 diff_serialize (V4-Flash non-think): produce `drafts/add-2fa-to-login-00eb8c/diff.patch`
- [ ] Publish SimulationEvent at each stage to `/api/ws/refactor-events`
- [ ] Persist SimulationEvent rows in Demeter `simulation_events` table

## 3. Dual review gate

- [ ] User reviews the diff in the Asclepius dual review gate UI
- [ ] On Accept: POST /api/refactor/add-2fa-to-login-00eb8c/accept returns `drafts/add-2fa-to-login-00eb8c/diff.patch` as a FileResponse download (OQ-09)
- [ ] On Discard: POST /api/refactor/add-2fa-to-login-00eb8c/discard cleans up the drafts directory

## 4. Archival (post-Accept)

- [ ] Move `openspec/changes/add-2fa-to-login-00eb8c/` to `openspec/archive/add-2fa-to-login-00eb8c/`
- [ ] Mirror move under `.agent-openspec/archive/add-2fa-to-login-00eb8c/`
- [ ] Update Demeter `proposals.stage` to `accepted`

## 5. Cleanup

- [ ] On Discard, mark Demeter `proposals.stage` to `discarded`
- [ ] Remove `drafts/add-2fa-to-login-00eb8c/` (best-effort, see `drafts_isolation.cleanup_simulation_dir`)
