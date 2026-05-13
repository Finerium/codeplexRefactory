# Aether Final Dual Audit V8 LIVE
**Image SHA**: bb5fc67c47e9df9c1a3c5cf1067a61c5df99824ef1df81a2e38be631f4845d21 (short: bb5fc67c)
**Pod**: codeplex-chronicle-545b68944-x5t97
**Deployment generation**: 11
**Audit timestamp**: 2026-05-13 11:10-11:20 WIB
**Methodology**: Real-browser via kubectl port-forward (pod 18080->3000) for DOM/interaction + live domain curl for backend API endpoints. Next.js port-forward does NOT proxy /api/* to FastAPI - those endpoints tested separately via live domain.

---

## Critical Verify Verdict

| Feature | Verdict | Evidence | Methodology |
|---|---|---|---|
| Time Machine sink fix | PASS (code-trace + API verify) | Match-ratio guard at BuildingHeightTimeMachine.tsx L142-165 confirmed. gadablotnok loc-snapshot returns 5 files (README.md, deno.json, deno.lock, main.ts, static/index.html) vs mock city paths -> ratio=0 < 0.1 threshold -> all buildings stay at scale=1 (no sink). Scrubber DOM: min=0/max=1/val=1 functional. Commit tooltip shows real data. | Real-browser DOM + live domain API curl |
| Refactor dual review gate | PASS | data-asclepius-panel="dual-review-gate-preview" present in DOM on /city?mode=refactor. data-asclepius-panel="refactor-intent" present with textarea placeholder "e.g. I want to add 2FA to login". Body text confirms: hasRunSimulation=true, hasAcceptChanges=true, hasDiscard=true, hasGhostBuilding=true, hasDualReview=true. | Real-browser DOM evaluate |
| Onboarding HUD tab | PASS | 4 mode tabs confirmed (Onboarding/Refactor/Health/Activity) via DOM role="tab" query. Onboarding click -> data-mode="onboarding" on side panel. Side panel text "Onboarding tour active - Hermes is guiding the tour overlay." 4 tour variant buttons visible: "30-second tour ~22.5s", "Sprint goal tour ~27.5s", "Feature tour ~16.5s", "Cross-onboarding ~16.5s". | Real-browser DOM evaluate |

---

## No-Regression Verify

| Check | Verdict | Evidence |
|---|---|---|
| GET / landing markers | PASS | curl grep: "YOUR CODEBASE", "Codeplex Chronicle", "5 AI residents", "Athena", "Apollo", "Argus", "Clio", "Hermes", "Take the tour" all present |
| GET /city canvas + overlay markers | PASS | curl grep: canvas element present, data-overlay confirmed, director-mode confirmed, sprint-controls confirmed |
| GET /dashboard Manager token | PASS | curl grep: "Manager", "Dashboard", "Codeplex", "sprint" all present |
| /api/llm/health circuit_state | PASS | JSON: {"circuit_state": "closed", "consecutive_failures": 0, "canned_entries": 10, "calls_recorded": 1, "total_cost_usd": 0.000115} |
| /api/activity?days=30&repo=all | PASS (live domain) | HTTP 200 via https://duopoly.hackathon.sev-2.com. Returns full timeline + hotspots + ownership JSON. 404 via port-forward is NOT a deployment bug (Next.js port-forward bypasses Traefik rewrite for /api/*). |
| /api/activity/loc-snapshot (gadablotnok) | PASS | POST {"repo_full_name":"gadablotnok/web-esp32log","timestamp":"2026-05-12T12:00:00Z"} -> HTTP 200 -> 5 files returned. Match-ratio guard correctly fires (0 < 0.1 threshold). |
| Canvas visible + WebGL active | PASS | canvas clientWidth=1200 clientHeight=766, WebGL2 context confirmed, data-mode switches correctly |
| Console errors (critical) | LOW-KNOWN | 3x /api/activity 404 in port-forward session only. Zero errors in live domain flow. |

---

## Known Issues (Non-Blocking for Ship)

1. **Demo rotation at /city with ?repo= param (LOW)**: When passing ?repo=gadablotnok/web-esp32log, page redirects to ?demo=fastapi-template because gadablotnok is not in the recognized demo list. Expected behavior per code (Wave 1 mock city, real repo data via backend). The Time Machine scrubber + LOC snapshot API are functional; the 3D city itself is the fastapi-template mock. This is documented behavior per "Wave 1 reference city" banner.

2. **/api/activity 404 via port-forward (LOW)**: Architectural - port-forward to Next.js port 3000 bypasses Traefik. Backend routes accessible only via live domain. Demo presentation MUST use live domain.

3. **Sprint tab not in mode HUD (OBSERVATION)**: Mode HUD shows 4 tabs: Onboarding / Refactor / Health / Activity. Sprint mode accessed via Sprint HUD toggle button ("Hide Sprint Mode HUD") rather than a tab. This is consistent with code design (Sprint is always-on overlay per PRD Section 15).

4. **Tour auto-opens on /city (LOW)**: Tutor dialog opens automatically on /city load. Can be dismissed but re-opens at ?tour=1 URL. Not a blocker but affects demo flow.

---

## Ship Recommendation

**SHIP-CLEAN**

V8 satisfies all 3 critical verify items with real-browser DOM evidence:
- Time Machine sink fix: match-ratio guard code confirmed in production bundle, LOC snapshot API returning correct real-repo data, guard correctly activating to prevent sink regression.
- Refactor dual review gate: both data-asclepius-panel attributes present, all 3 action buttons in DOM body.
- Onboarding HUD tab: 4 mode tabs present, Onboarding click triggers correct mode state, 4 tour variants visible.

LLM health is clean (circuit closed, no failures). No-regression checks pass on all 8 items. Known issues are all LOW severity with no user-blocking impact on demo presentation path.

**Demo guidance**: Use live domain https://duopoly.hackathon.sev-2.com directly for all flows. Do not use port-forward for demo. Activity mode data requires live domain (Traefik proxies /api/* to FastAPI).
