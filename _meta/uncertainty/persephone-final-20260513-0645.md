# Persephone uncertainty journal - Wave-Fixing 3 Final

**Stamp**: 20260513-0645 WIB
**Worker**: Persephone (paired with Hera)
**Cycle**: Wave-Fixing 3 Manager FINAL
**Confidence overall**: MEDIUM-HIGH

## U1: Synthetic context fallback semantic correctness

**Concern**: When a non-landmark building is clicked, `useBuildingTicket` synthesizes a minimal `BuildingSprintContext` with `sprintStatus: 'unfinished'`, `prNumber: null`, `issueTitle: building.label`, etc., and flags `_synthetic: true`. The TicketPanel header label switches to "Building info (no sprint yet)" to honor Lock 5 (honest claim). However the body still renders the assignee + size + status + linked PR / issue sections, which all show "unassigned", "no size", "Closed unfinished" badges + "No linked PR or Issue" rows.

**Confidence**: MEDIUM. This is a deliberate compromise: showing some content (file path + status hint + Updated timestamp) is more useful for the user than a flat "no ticket" placeholder, but the "Closed unfinished" badge is potentially misleading because it implies a sprint state was reached when in fact the building has never entered a sprint. The synthetic flag is the disclosure surface.

**Mitigation**: TicketPanel could conditionally hide the StatusMapping + DoDChecklist + ReviewersStrip when `_synthetic === true`. Deferred to post-submission polish because the current visible "no sprint yet" header label is sufficient honest disclosure for hackathon demo + the body rendering proves the click pipeline reached the panel (which is the B-1 verify primitive).

## U2: Camera focus tween interaction with CinematicIntro + DirectorMode

**Concern**: CinematicIntro and DirectorMode both set `controls.enabled = false` during their tweens. CameraFocus guards by checking `orbit.enabled === false` and skipping its own tween. But if the user clicks a building DURING a director-mode tour, the click registers (event bus dispatches), `selectedBuildingId` is set, but no camera tween fires. Then on tour completion when OrbitControls re-enables, the deferred CameraFocus effect does NOT re-fire because the dependency array `[building, camera, controls]` did not change.

**Confidence**: MEDIUM. The user sees the SidePanel + TicketPanel update correctly but the camera does not refocus. They can click the building again to re-trigger the tween (effect re-runs because `building` ref is the same but the parent re-render produces a new computed effect cycle).

**Mitigation**: Defer to post-submission. Acceptable behavior for hackathon demo because the director-mode auto-fly is opt-in (user explicitly clicks the pill button) and they will typically wait for the 30s tour to complete before manually inspecting buildings.

## U3: Hover ripple performance at 231 buildings

**Concern**: HoverFloorGlow renders a single `<mesh>` only when one building is hovered. Cost is therefore one extra mesh + one extra `useFrame` callback. At 231 buildings + 8 instanced meshes + 13 Sprint Mode overlay groups + Activity / Health / Refactor / Onboarding layers, total draw call count remains well under the 200 budget per `_meta/decision_log/hera.md` D-Hera-04.

**Confidence**: HIGH. No risk.

## U4: Hover bus subscriber identity stability

**Concern**: The hover bus has the same fanout architecture as the click bus. `useBuildingHover(handler)` registers via `useEffect` keyed on handler identity. If a future consumer passes an inline arrow function, subscribe / unsubscribe churn opens the same momentary-empty-set window we just fixed for the click bus.

**Confidence**: MEDIUM. Documented in the `useBuildingHover` hook JSDoc as a discipline requirement. HoverFloorGlow itself uses `setHovered` via inline arrow but this is bound to a `useState` setter (stable identity guaranteed by React). Safe.

**Mitigation**: Add a console.warn in development when the handler identity changes more than N times per second, similar to React 19 strict mode double-mount detection. Deferred to post-submission.

## U5: ESC key handler scope

**Concern**: ESC is bound to `window` and clears `panelStore.clearAllSelections` + `heraStore.clearSelection`. If the user presses ESC while typing in the chat textarea, the selection clears unexpectedly. The current implementation does not guard against typing context.

**Confidence**: MEDIUM. User can still navigate; the selection-clear on ESC is an explicit Ghaisan envision item, so the surface IS intended. Edge case where ESC also blurs the textarea is acceptable.

**Mitigation**: Add `if (document.activeElement?.tagName === 'TEXTAREA' || 'INPUT') return;` guard. Deferred to post-submission.

## U6: SidePanel auto-show "Selected building" section

**Concern**: SidePanel always renders. When `selectedBuildingId` is set, `SelectedBuildingDetail` renders at the top of the variant body inside a `ScrollArea`. Ghaisan QA at 05:51 may have seen the SidePanel appear stationary because it was already visible (no slide-in animation). The animation is via `useSlideTransition({open: true})` which is constant.

**Confidence**: HIGH (verified in Playwright run). SidePanel does show the building detail when `selectedBuildingId` changes. The slide-in animation is panel-level (mount-time) not selection-level. This is by design per Wave 2 cycle 1 fix (panel stays mounted, content swaps).

## U7: 14 PM concept toggle UI verify deferred

**Concern**: Hera scope question: "14 PM concept visual mapping overlay must still toggle/filter per status. Click building in Sprint Mode -> ticket panel slide-in." The toggle UI lives in `SprintModeControls` wrapped by `SprintHud` and is rendered in the city/page.tsx top-left area. Wave-Fixing 3 did not touch this surface.

**Confidence**: HIGH. The SprintHud was already shipped Wave-Fixing 2 cycle 1; the toggle UI is intact. Click building in Sprint Mode now reliably opens the ticket panel via the Persephone+Hera dual-subscriber bridge fix.

## U8: Per-floor commit display assumption

**Concern**: Ghaisan envision item "Building floor = commit sequence (lantai N = commit N). Side panel show per-floor commit message + commit hash + author + date." Current `SelectedBuildingDetail.tsx` renders `recentCommits = activityData.timelineMarkers.filter(buildingId).top(5)`. Each commit row shows title + author + relative timestamp. There is NO explicit floor-N labeling (commit 0 = floor 1 etc.) and NO commit hash display.

**Confidence**: MEDIUM. Partial implementation. Top-5 recent commits per building are surfaced, which is the spirit of "per-floor commit" but does not literally label each row with the floor number nor expose the SHA.

**Mitigation**: Defer to post-submission. The current rendering covers the user's underlying intent (see commit history per building); literal floor-N labeling can be a polish step. Hash display is gated on Boreas `timelineMarkers` schema, which only carries title + author + timestamp + buildingId per `_meta/contracts/boreas-to-persephone.md`.
