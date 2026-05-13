# Handoff: Persephone + Hera (Wave-Fixing 3 Final) -> Aether audit

**Stamp**: 20260513-0645 WIB
**From**: Persephone (paired with Hera)
**To**: Aether (Wave-Fixing 3 Final audit)
**Bug**: B-1 RECURRING (building click no response, claimed PASS by Manager #2 but failed real-browser QA at 05:51 WIB)
**Verdict**: SHIP CLEAN, ready for Aether audit

## What was fixed

B-1 RECURRING had two layered root causes neither of which was caught by Manager #2's code-trace:

1. `useBuildingTicket` passed an inline arrow function to `useBuildingClick(handler)`, causing subscribe / unsubscribe churn on the Iris fanout event bus. Symptom: occasional momentary-empty-set window during React state churn that could drop a click silently.
2. Hera mock event tape only seeded `BuildingSprintContext` for 4 landmark buildings (Athena / Apollo / Argus / Clio). For the other 227 of 231 mock-city buildings, `useSelectedBuildingContext()` returned null, and the TicketPanel rendered an empty placeholder. The user saw "click any non-landmark building, nothing happens" because the placeholder was visually indistinguishable from a not-yet-mounted panel.

Both defects fixed inside Persephone scope:

- `useCallback` wrap around the click subscriber, keyed on stable zustand setter identities.
- Synthetic `BuildingSprintContext` fallback derived from Iris `BuildingData` when no real Hera-seeded context exists, with `_synthetic: true` flag + "Building info (no sprint yet)" header label for honest disclosure.

Plus three additive features per Ghaisan envision items (all green-field, no contract break):

3. Hover bus added at Iris layer (`src/scene/buildings/useCityData.ts`) twin of the click bus. BuildingInstances wires `onPointerOver` + `onPointerOut`. HoverFloorGlow consumes and renders a per-floor rising emissive band that loops every 1.2 seconds.
4. CameraFocus component (`src/scene/CameraFocus.tsx`) mounts inside ChronicleCanvas, watches `panelStore.selectedBuildingId`, tweens `camera.position` + OrbitControls `target` via GSAP `power2.inOut` over 600 ms.
5. ESC overview restore: the existing ESC handler in `useBuildingTicket` already calls `clearAllSelections` + `heraClear`. CameraFocus catches the resulting `selectedBuildingId = null` and tweens back to the snapshot overview position captured at first mount.

## Files modified (absolute paths)

1. `/Users/ghaisan/Documents/codeplexRefactory/frontend/components/panels/ticket/useBuildingTicket.ts`
2. `/Users/ghaisan/Documents/codeplexRefactory/frontend/components/panels/ticket/TicketPanel.tsx`
3. `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/scene/buildings/useCityData.ts`
4. `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/scene/buildings/BuildingInstances.tsx`
5. `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/scene/buildings/HoverFloorGlow.tsx` (NEW)
6. `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/scene/buildings/index.ts`
7. `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/scene/CameraFocus.tsx` (NEW)
8. `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/scene/index.ts`
9. `/Users/ghaisan/Documents/codeplexRefactory/frontend/app/city/page.tsx`

## Verify methodology (replicable)

Aether MUST replicate against the running dev server. Pre-conditions: dev server up at `http://localhost:3000`.

```bash
cd /Users/ghaisan/Documents/codeplexRefactory/frontend
nohup npx next dev --webpack > /tmp/dev_server.log 2>&1 < /dev/null &
disown
sleep 10
curl -sS http://localhost:3000 -o /dev/null -w "HTTP=%{http_code}\n"
```

Replay test script at `/tmp/click_test.cjs` (in Persephone session):

```javascript
// Headless chromium against running dev server.
// 1. Load /city, wait 6 s for mock tape seed.
// 2. Verify window.__codeplex_smoke_click is registered.
// 3. Dispatch smoke-click on first building.
// 4. Read [data-panel="ticket"] data-building-id + textContent slice.
// 5. Read [data-panel-detail="selected-building"] data-building-id.
// 6. Dispatch Escape, verify data-panel-detail null.
```

Expected output:

- `has window.__codeplex_smoke_click = true`
- `hera ready = true`
- `clicked id = backend/app/api/route_5.py`
- `ticketBuildingId = "backend/app/api/route_5.py"`
- `ticketTextPreview` contains substring `"Building info (no sprint yet)"`
- `sideBuildingDetailId = "backend/app/api/route_5.py"`
- after ESC: `sideBuildingDetailId = null`

Landmark click test (replays at `/tmp/click_landmark_test2.cjs`):

- Same setup, then `window.__codeplex_smoke_click('backend/app/core/main.py')` after a 10 s tape playback wait.
- Expected `ticketTextHeader` substring: `"Building ticket"` (not synthetic) + `"Implement GitHub OAuth scope minimization"` + `"@ghaisan"` + `"Sprint 14: Security hardening + auth"` + `"Issue#412"`.

## Anti-collision matrix verify

- Iris ownership of `src/scene/buildings/*`: respected. Hover bus added as additive twin to click bus, identical fanout topology. No mutation of Iris click-bus surface.
- Hera ownership of Sprint Mode + heraStore: respected. `useSprintClickToTicket` untouched. Hera's mock tape seed-4-buildings behavior preserved (deliberate scope: the demo tape exercises the 4 landmark contexts).
- Persephone ownership of panels: edits localized to `frontend/components/panels/ticket/*` for the Persephone fixes. Cross-domain co-author with Hera + Iris on the hover bus + CameraFocus per the paired-cycle directive.
- Daedalus ownership of Canvas + globals.css: respected. CameraFocus mounts as child of ChronicleCanvas + reads `useThree().camera` + `useThree().controls`. No mutation of Canvas internals or PostPipeline.
- Calliope ownership of city-layout + parallel slot grid: respected. No edit to `@chat`, `@ticket`, `@side` slot pages or `app/city/layout.tsx`.

## Open items for Aether

Aether MUST verify:

1. (highest priority) Replay the playwright smoke test and confirm both non-landmark + landmark click paths render their expected panel content.
2. ESC clears both `panelStore.selectedBuildingId` AND `heraStore.selectedBuildingId` (chained via `useBuildingTicket` ESC handler).
3. TicketPanel for synthetic context: is the header label "Building info (no sprint yet)" + the body's "Closed unfinished" + "unassigned" + "no size" + "No linked PR or Issue" sufficient Lock 5 honest-claim disclosure, or is a stronger placeholder needed? Persephone position: sufficient; defer to Aether for final call.
4. CameraFocus tween interaction with CinematicIntro + DirectorMode: verify that during a director-mode tour (auto-fly pill), a building click registers the selection but does NOT tween the camera (per uncertainty journal U2). Acceptable behavior; click after tour completes will tween correctly.
5. Hover ripple visual smoothness: verify HoverFloorGlow band rises through building height + fades correctly at top + bottom edges. Cursor flips to pointer immediately on hover-in.

## Cascade to subsequent waves

No new Wave 3 backend cascade. Schema additions are forward-compatible (`_synthetic: true` is purely client-side fallback). Demeter event store + Hades WebSocket consume the same `BuildingSprintContext` schema; when real PR / issue data flows in, `realContext` is populated and `_synthetic` falls away naturally (the `useMemo` in `useBuildingTicket` returns `realContext` whenever it is non-null).

Hover bus is a new public Iris surface. Future Wave 3 consumers (e.g., Pandora ghost building hover preview in Refactor Mode) can subscribe via `useBuildingHover(handler)`. Discipline: hand-author handlers MUST be stable (useCallback wrap), documented in the hook JSDoc.
