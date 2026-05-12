# Handoff Log: Boreas Wave-Fixing #2 Cycle 1

**Date**: 2026-05-13 03:23 WIB Day 2 (STAMP=20260513-0323)
**From**: Boreas (north wind + directed movement)
**To**: Demeter (event store + materialized view seed-inject) + Pan (post-Wave 3 universal demo rehearsal)
**Context**: Manager Wave-Fixing #2 cluster 8 ship clean

---

## Outbound contract to Demeter (seed-inject materialized views)

**Recipient**: Demeter Wave-Fixing #2 or Wave 3 cycle 2 follow-up
**Surface**: backend materialized views `commit_frequency_per_building` + `ownership_distribution` (migration `005_activity_views.py`)
**Current state**: views ship `WITH NO DATA`; `/api/activity?days=30&repo=all` returns empty arrays in production
**Request**: populate views with seed data from NodeGoat slice + fastapi/full-stack-fastapi-template repos so the endpoint returns real-shape data

**Boreas-side resilience**: `useActivityData` calls real `/api/activity`, falls back to mock data when server returns empty. When Demeter populates views, no Boreas code change needed; real data flows automatically.

**Suggested seed**:
- Insert ~50 mock `pr_events` rows distributed across the 30/60/90 day windows with `event_type='pr.merged'`, `building_id` matching `mockCityData.buildings[].id`, `lines_added` + `lines_deleted` realistic values, `author_login` from a pool of 6-8 contributors
- `REFRESH MATERIALIZED VIEW commit_frequency_per_building`
- `REFRESH MATERIALIZED VIEW ownership_distribution`
- Verify `/api/activity?days=30&repo=all` returns populated timeline + hotspots + ownership arrays

**Bonus enhancement**: extend `ActivityData` Pydantic in `app/services/activity_query.py` with `timeline_markers: List[TimelineMarkerOut]` field sourced from `pr_events.event_type IN ('pr.merged','release.tagged')`. Frontend `adaptServerToClient` then maps real markers (currently inherits from mock per U4 documented hybrid).

---

## Outbound contract to Pan (demo rehearsal verification)

**Recipient**: Pan post-Wave 3 cycle 2 or demo rehearsal cycle
**Verification checklist** (production `https://duopoly.hackathon.sev-2.com`):

1. Navigate `/city?mock_auth=true`. Verify:
   - [ ] Mode HUD side panel default shows "Activity" tab
   - [ ] Timeline scrubber visible bottom-center with 30/60/90 toggle + ownership heatmap button
   - [ ] "Trigger 60-second sprint retro flythrough with Clio narration" button visible bottom-right
   - [ ] Activity drilldown side panel shows top hotspots + ownership distribution

2. Click sprint retro button. Verify:
   - [ ] Button label changes to "Clio menulis prosa..."
   - [ ] Within ~7 seconds, narration overlay appears top-center showing Indonesian prose with "Clio Historian" + "V4-Flash non-think" labels
   - [ ] Camera fly begins; visits 3 buildings over 60 seconds
   - [ ] On completion, button label changes to "Replay retro"

3. Switch mode side panel tab to a future Onboarding selection (when usePanelStore adds onboarding-default tab; current default is activity). Or manually drive via panel store:
   - [ ] Onboarding variant router appears bottom-center with 4 cards (generic-30sec, sprint-goal, feature-scoped, cross-onboarding)
   - [ ] Click variant -> Hermes narration overlay appears + camera fly begins
   - [ ] At each waypoint dwell, Hermes narration text updates (1-3 sentence Indonesian + English code-switch)

4. Check `/api/llm/health calls_recorded` increments after retro flythrough + tour interactions (real DeepSeek path)

5. Lighthouse audit `/city`: target Performance >= 85 with Activity Mode active (mock data load is the dominant cost, well under budget)

**Known gap**: Pan should verify side panel has explicit way to switch to onboarding mode. Current Wave 2 side panel only exposes 3 tabs (Refactor, Health, Activity). Onboarding mode trigger may need a global mode button (out of Boreas scope; Persephone or Manager decides).

**Workaround for demo**: trigger onboarding via URL like `/city?mode=onboarding` would require additional wiring; current Wave 2 design assumes mode set via panel store. If Pan rehearses onboarding flow, document the manual trigger needed.

---

## Cross-worker dependencies resolved

### Triton (LLM gateway)
- ✓ `/api/chat target=Clio` SSE stream consumed via `fetchClioRetroNarration`
- ✓ `/api/onboarding/narration` POST consumed via `fetchWaypointNarration`
- No Triton changes required; both endpoints already locked Wave 3 cycle 1

### Persephone (panel mounting)
- ✓ `ActivityDrilldownVariant` side panel reads same `useActivityStore` selector as Boreas HUD; auto-syncs
- ✓ `usePanelStore.currentMode` triggers Boreas Activity/Onboarding layer mount on /city
- ✓ Compatible with Persephone Wave-Fixing #2 `SprintHud` + `chatCollapsed` + `sideCollapsed`

### Asclepius (Health + Refactor visual on /city)
- ✓ `AsclepiusBridge` mounted as sibling of BuildingInstances; both Boreas + Asclepius layers coexist via `currentMode` switch
- ✓ No shared state conflict

### Daedalus (Canvas + DirectorMode)
- ✓ `ChronicleCanvas paused={flyActive}` honors Daedalus contract surface; pauses orbit when retro flythrough or onboarding fly active
- ✓ `<DirectorModeButton />` continues to mount as fixed DOM overlay; independent of Boreas modes

### Demeter (event store)
- → Outstanding seed-inject task (above)

---

## File ownership summary this cycle

Boreas-owned NEW:
- `frontend/src/modes/activity/clioNarration.ts`
- `frontend/src/modes/activity/SprintRetroFlythrough.tsx`

Boreas-owned MODIFIED:
- `frontend/src/modes/activity/useActivityData.ts`
- `frontend/src/modes/onboarding/tourDSL.ts`
- `frontend/src/modes/activity/index.ts`

Coordinated mount (Boreas blocks added, peer workers preserved):
- `frontend/app/city/page.tsx` (Boreas Activity + Onboarding mount blocks added; Hera SprintMode + Asclepius bridge + Persephone SprintHud + Daedalus DirectorModeButton all preserved)

Artifacts:
- `_meta/decision_log/boreas.md` (D12-D15 appended)
- `_meta/uncertainty/boreas-wave-fixing-cycle1-20260513-0323.md`
- `_meta/checkpoints/boreas-wave-fixing-cycle1.md`
- `_meta/handoff_log/boreas_wave_fixing2_cycle1_20260513-0323.md` (this file)
- `_meta/orchestration_log/V5_boreas_wave_fixing_cycle1_20260513-0323.md`

---

## Verification summary

**Real backend endpoints verified live via curl** (`https://duopoly.hackathon.sev-2.com`):

| Endpoint | Method | Status | Evidence |
|---|---|---|---|
| `/api/llm/health` | GET | 200 | `calls_recorded` increment 3->5 after test, `total_cost_usd` $0.003621 -> $0.003785 |
| `/api/onboarding/narration` | POST | 200 | `model_used: "V4-Flash"`, real prose narration text |
| `/api/chat target=Clio` SSE | POST | 200 | V4-Flash-non-think Indonesian prose 415 tokens 6.9s latency |
| `/api/activity?days=30&repo=all` | GET | 200 | Empty arrays (materialized views WITH NO DATA, mock fallback triggered) |

**Local Playwright snapshot** (`http://localhost:3000/city?mock_auth=true`):
- Page renders with 200 status
- ActivityHud + TimelineScrubber visible
- 30/60/90 radio toggle visible
- Sprint Retro 60s button visible
- Side panel activity drilldown shows top hotspots + ownership

**TypeScript strict noEmit on Boreas-owned files**: clean (1 unrelated pre-existing TS6196 in Persephone scope)

---

## Ship status: CLEAN

No ferry. 8 uncertainty concerns documented with mitigation. 4 mandatory artifacts authored. V5 snapshot locked.

Boreas Wave-Fixing #2 Cycle 1 awaits Aletheia / Dike re-audit alongside other cluster ships.
