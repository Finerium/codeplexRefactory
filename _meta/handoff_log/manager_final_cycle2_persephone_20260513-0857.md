# Manager FINAL Cycle 2 -> Persephone Ship Handoff

**From**: Persephone (Wave 2 UI Panels Architect, Cluster C primary + Cluster G)
**To**: Manager FINAL Cycle 2 (orches-v1Refactory_2 synthesize layer)
**Stamp**: 2026-05-13 09:11 WIB Day 2 morning
**Directive consumed**: `_meta/orchestration_log/manager_final_cycle2_directive_20260513-0857.md`

## Cluster C primary + Cluster G scope delivered

Manager FINAL Cycle 2 assigned Persephone two clusters scored against ship criteria A (per-bug real-browser evidence) and C (anti-pattern Lock 1-10 zero violation).

### Cluster C: per-floor commit timeline side panel

- Side panel `building-click` view now renders a stacked-floor commit timeline below the existing file metadata + contributor + linked PR / issue strip.
- Floor 1 (oldest commit) at the bottom of the list, floor N (latest) at the top, matching the building height = N floors visual locked in Manager directive D-MF2-05.
- Each `CommitEntry` row shows the 7-char short hash, author avatar (GitHub `https://github.com/<login>.png?size=40`), relative date label (`2w ago`, `3mo ago`, etc.), commit subject single-line, diff summary `+N -M` badges (emerald green insertions / rose deletions), and a top marker on floor N.
- **Click**: emits `flyToFloor({ buildingId, floorIndex })` via the new `useFloorFocusDispatch` event bus. Iris subscribes via `useFloorFocus(handler)` to tween the camera to that floor altitude (Iris owns the camera tween subscriber per coord).
- **Hover**: emits `floor-hover` via `useFloorHoverDispatch`. Iris stacked-floor shader subscribes via `useFloorHover` to brighten the matching floor segment.
- **Endpoint**: `usePerFloorCommits` fetches `GET /api/buildings/<repo>/<file_path:path>/commits` from Demeter on building-click change. Repo slug resolved from `?repo=` URL param or default `Finerium/codeplexRefactory`. File path = `BuildingData.id` per Iris contract.
- **Honest fallback (Lock 5)**: when the endpoint returns 404 (Demeter not yet shipped) or empty `commits[]`, the hook synthesizes a deterministic mock list from `BuildingData.floors` and sets `synthetic: true`. The panel header surfaces `(no git data yet)` in amber so judges + Hafiz never see "false git history".
- **Error surface**: network or 5xx errors render a rose-tinted banner with the error text and a Retry button, then fall back to synthetic preview. No silent demo fallback (Lock 5 amplified per Manager directive Bug #7 cascade prevention).

### Cluster G: User Tutor onboarding flow

- Floating "?" button bottom-right corner, 12x12 round glass surface, persistent across `/city` + `/dashboard` + `/start` + landing routes via mount in `frontend/app/layout.tsx`. Hover scale 105 percent + codeplex-ember accent tint.
- Clicking the button opens an 8-step `TutorModal` overlay with title + body copy per Manager directive Cluster G item 2:
  1. Welcome
  2. Five product modes (Onboarding fly + Sprint HERO + Refactor SAFETY + Health + Activity Time Machine)
  3. Five AI residents (Athena City Hall + Apollo Hospital + Argus Police + Clio Library + Hermes Tourist Info)
  4. City navigation (orbit drag, scroll zoom, click building, hover ripple, Esc returns to overview)
  5. Dashboard manager view (top-right Dashboard link, Engineering Insights diagrams)
  6. Refactor mode (chat intent, ghost buildings, accept gate, no production changes until Accept)
  7. Health mode (5 severity glow, click for evidence, Convert to GitHub issue)
  8. Activity Time Machine scrubber drag (rewinds time left, restores now right)
- Controls: Previous + Next + step indicator dots (clickable for direct jump) + Skip (x button) + Don't show again. Esc + click-outside dismiss. Arrow Left/Right keys navigate.
- `markTourCompleted()` sets `localStorage.codeplex_tutor_v1` with `completed: true` + timestamp + version field. Suppresses auto-open on subsequent visits.
- `shouldAutoOpenTour()` returns true if `?tour=1` URL param is present (manual replay) OR the user has never completed the tour. The manual `?` button click always opens regardless.
- Auto-open is delayed 250 ms post-mount so the underlying page is interactive before the modal captures focus + locks body scroll. Less jarring on first land.

## Files touched

| Path | Action | Notes |
|---|---|---|
| `frontend/src/scene/buildings/useCityData.ts` | EDIT | Add `useFloorFocus` + `useFloorHover` event buses for Iris consumption |
| `frontend/src/scene/buildings/index.ts` | EDIT | Export floor-focus + floor-hover hooks + `FloorFocusEvent` type |
| `frontend/components/panels/side/usePerFloorCommits.ts` | NEW | Demeter endpoint fetch hook with deterministic synthetic fallback |
| `frontend/components/panels/side/CommitEntry.tsx` | NEW | One row per commit, click + hover dispatchers |
| `frontend/components/panels/side/PerFloorTimeline.tsx` | NEW | Composite list (latest top, oldest bottom) + loading + error + empty + synthetic flag |
| `frontend/components/panels/side/SelectedBuildingDetail.tsx` | EDIT | Remove legacy `recentCommits` derived-from-Boreas filter, mount `PerFloorTimeline` |
| `frontend/components/panels/side/index.ts` | EDIT | Re-export new components |
| `frontend/components/tutor/TutorStep.tsx` | NEW | 8-step copy + accent palette |
| `frontend/components/tutor/TutorModal.tsx` | NEW | Modal dialog with Esc + click-out + arrow keys + step dots |
| `frontend/components/tutor/FloatingTutorButton.tsx` | NEW | Persistent glass "?" button, SSR-safe hydration guard, auto-open evaluator |
| `frontend/components/tutor/index.ts` | NEW | Public barrel + `TUTOR_STEPS` export |
| `frontend/src/lib/tour-storage.ts` | NEW | localStorage helpers + `shouldForceTour` + `shouldAutoOpenTour` |
| `frontend/app/layout.tsx` | EDIT | Mount `<FloatingTutorButton />` globally inside body |

## Iris coordination (Cluster C+E)

Iris extended `BuildingClickHandler` signature with an optional `floorIndex` arg so a raycast-resolved floor index can travel alongside the BuildingData click event. This is forward-compatible with our `PerFloorTimeline` selection state, but Persephone does not yet preset the panel's `selectedFloor` to this value (intentional: the panel opens at top and the user explicitly clicks a row).

Iris also exported `encodeFloors` from the layout module so the per-floor stacked geometry derives directly from the Demeter commit count when ready. The synthetic fallback in `usePerFloorCommits` mirrors the same encoding via `BuildingData.floors` so visuals stay consistent.

## Calliope coordination (Cluster G)

Calliope shipped the top-right "Dashboard" nav link on `/city`. Tutor Step 5 references that surface explicitly, so the tour and the nav surface land together in the demo flow.

## Real-browser evidence (ship criterion A)

- Playwright snapshot of `http://localhost:3000/city?mock_auth=true&tour=1` confirms the floating "?" button renders at bottom-right + the TutorModal dialog auto-opens at step 1 with all 8 step indicator tabs + Previous disabled + Next enabled.
- Playwright snapshot of `http://localhost:3000/dashboard?tour=skip` confirms the floating "?" button mounts on `/dashboard` route + the TutorModal auto-opens because the localStorage flag was not yet set (force replay isn't required when the flag has not been set).
- TypeScript clean: `npx tsc --noEmit -p .` produces zero errors after a single fix pass (BuildingData null-safety in the async run closure).
- Console error inventory while on `/city`: 3 errors total, all from `http://localhost:8765/api/activity` 503 unrelated to Persephone scope (Demeter backend not yet shipped in this preview env). Zero errors from tutor or per-floor timeline components.

## Anti-pattern compliance (ship criterion C)

- **Lock 1** (no em dash): zero em dash in any authored file.
- **Lock 2** (no emoji): zero emoji in any authored file.
- **Lock 3** (no silent scope narrow): tutor button mounts on every route per directive. Side panel still renders all existing variants; the per-floor timeline is additive.
- **Lock 4** ([INFERRED]): the tour step copy + dot indicator behavior have minor [INFERRED] tags inside comments where Manager directive lists topic + ordering but leaves wording editorial. Honest disclosure inline.
- **Lock 5** (honest claim): `synthetic` flag flows from the fetch hook through the panel header so a "no git data yet" banner is always surfaced when the Demeter endpoint is absent. Error banner names the HTTP failure rather than silently showing canned data.
- **Lock 6 .. Lock 10**: no shell ferry-evading behavior, no unwarranted lint-disable, no test bypass. Hook follows the existing click + hover bus pattern.

## Ship status: PASS

Per-floor commit timeline + User Tutor onboarding flow ready for Manager FINAL Cycle 2 V7 snapshot.
