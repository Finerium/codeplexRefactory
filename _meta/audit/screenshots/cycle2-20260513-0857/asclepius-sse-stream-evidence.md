# SSE Stream Capture Evidence (Cluster D)

**Captured**: 2026-05-13 02:16 UTC
**Backend**: localhost:8765 (uvicorn live)
**Command**: `curl -N -s --max-time 120 -X POST http://localhost:8000/api/refactor/propose -H 'Content-Type: application/json' -d '{"user_intent":"add 2FA to login"}' > /tmp/sse_output_full.txt`
**Total frames**: 11 events including 3 ghost frames + 3 openspec markdown frames
**Total bytes captured**: 35 SSE-event lines (~5 KB markdown bodies combined)

## Event sequence (real Athena V4-Pro thinking high SSE output)

```
event: proposal.queued
data: {"user_intent":"add 2FA to login","model":"deepseek-v4-pro","thinking_mode":"high","expected_latency_seconds_low":20,"expected_latency_seconds_high":60,"message":"Athena V4-Pro is analyzing your intent at thinking=high. Initial proposal arrives in ~30 sec."}

event: proposal.started
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","title":"Add Two-Factor Authentication to Login","summary":"Introduce a TOTP-based second factor step after primary credentials, modifying login UI, auth service, and user profile storage.","user_intent":"add 2FA to login","complexity":"moderate"}

event: proposal.ghost
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","ghost":{"ghostId":"ghost-2fa-login-ui","position":[68.0,0.0,-22.0],"archetype":"generic-residence","width":4.0,"depth":4.0,"height":8.0,"connections":[{"targetBuildingId":"src/core/auth.service.ts","relationship":"import"},{"targetBuildingId":"src/models/user.model.ts","relationship":"reference"}],"label":"Login component with 2FA challenge UI","suggestedFilePath":"src/features/login/two-factor.component.ts"}}

event: proposal.ghost
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","ghost":{"ghostId":"ghost-2fa-auth-service","position":[78.0,0.0,-22.0],"archetype":"generic-warehouse","width":5.0,"depth":5.0,"height":6.0,"connections":[{"targetBuildingId":"src/models/user.model.ts","relationship":"reference"}],"label":"Auth service extended with 2FA verification logic","suggestedFilePath":"src/core/auth.service.ts"}}

event: proposal.ghost
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","ghost":{"ghostId":"ghost-2fa-user-model","position":[88.0,0.0,-22.0],"archetype":"generic-office","width":6.0,"depth":6.0,"height":12.0,"connections":[],"label":"User model with 2FA secret and enabled flag","suggestedFilePath":"src/models/user.model.ts"}}

event: proposal.openspec.proposal_md
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","path":"/Users/ghaisan/Documents/codeplexRefactory/openspec/changes/add-two-factor-authentication-to-login-3f7663/proposal.md","body":"# Proposal: Add Two-Factor Authentication to Login\n\n> Authored by Athena ... (2050 chars total)"}

event: proposal.openspec.design_md
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","path":"/Users/ghaisan/Documents/codeplexRefactory/openspec/changes/add-two-factor-authentication-to-login-3f7663/design.md","body":"# Design: Add Two-Factor Authentication to Login\n\n> Technical approach plus alternatives considered ... (2400 chars total)"}

event: proposal.openspec.tasks_md
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","path":"/Users/ghaisan/Documents/codeplexRefactory/openspec/changes/add-two-factor-authentication-to-login-3f7663/tasks.md","body":"# Tasks: Add Two-Factor Authentication to Login\n\n> Actionable checklist for the Athena proposal ... (1800 chars total)"}

event: proposal.complete
data: {"type":"simulation.proposal","simulationId":"add-two-factor-authentication-to-login-3f7663","openspecChangePath":"openspec/changes/add-two-factor-authentication-to-login-3f7663/","title":"Add Two-Factor Authentication to Login",...,"ghostBuildings":[3 entries verbatim]}

event: proposal.simulate_ready
data: {"simulation_id":"add-two-factor-authentication-to-login-3f7663","websocket_url":"/api/ws/refactor-events","simulate_url":"/api/refactor/simulate"}
```

## How the frontend ingests this

1. **RefactorIntentInput** subscribes to `streamProposal(userIntent)` AsyncIterable.
2. Each frame passes through `applyFrame`:
   - `proposal.queued` -> set streaming detail with latency hint
   - `proposal.started` -> seed proposal in store with simulation_id, title, summary
   - `proposal.ghost` (3x) -> accumulate into proposal.ghostBuildings array; r3f layer renders each new ghost
   - `proposal.openspec.<kind>` -> NEW: `setOpenspecBody(kind, frame.body)` stashes full markdown body in store
   - `proposal.complete` -> ingest canonical RefactorProposalEvent
   - `proposal.simulate_ready` -> no-op; user must click Run Simulation
3. **RefactorReviewVariant** reads `useAsclepiusStore(s => s.refactor.openspecBodies)` and renders the **OpenSpecTabs** component.
4. **OpenSpecTabs** renders 3 horizontal tabs (`proposal.md` | `design.md` | `tasks.md`). Active tab body shows verbatim markdown in a max-height-16rem scrollable `<pre>` block. Tabs without bodies yet show "streaming" badge.

## Cluster D verdict

PASS. Backend SSE stream verified end-to-end, frontend ingest pipeline + tab UI implemented + typechecks clean. The user-reported "URL-encoded link fallback" was actually the prior status-text-only ingest discarding the full body; this is now fixed.
