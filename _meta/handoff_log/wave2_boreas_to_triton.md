# Handoff: Boreas (Wave 2) to Triton (Wave 3)

**Date**: 2026-05-12 ~23:55 WIB Day 1
**Producer**: Boreas (Wave 2, Onboarding camera fly + Hermes narration overlay + tour script DSL)
**Consumer**: Triton (Wave 3, DeepSeek V4 client + Hermes resident prompt wiring)
**Contract reference**: `_meta/contracts/boreas-to-triton.md` (locked Wave 0 Pythia).

## What Boreas delivers

### Tour script DSL (canonical Wave 2 frontend representation)

Boreas authored the canonical TourScript + TourWaypoint + TourVariant + supporting types at:

```typescript
import type {
  TourScript,
  TourWaypoint,
  TourVariant,
  EndingSummary,
  NarrationPromptContext,
  NarrationBuildingContext,
  NarrationVariantContext,
  NarrationRequest,
  NarrationResponse,
} from '@/modes/onboarding';
```

These types match the Pythia contract `_meta/contracts/boreas-to-triton.md` Section "Output schema" lines 22-83 verbatim. Specifically:

- `TourVariant`: `'generic-30sec' | 'sprint-goal' | 'feature-scoped' | 'cross-onboarding'`
- `TourWaypoint`: `index`, `targetBuildingId`, `cameraOffset`, `lookAtOffset`, `pauseDurationMs`, `transitionDurationMs`, `narrationPromptContext`
- `TourScript`: `id`, `variant`, `waypoints`, `endingSummary` (primaryEntryPath + primaryOwnerLogin + primaryOwnerAvatar)
- `NarrationRequest` (Wave 3 fetch shape): `tourId`, `waypointIndex`, `tourVariant`, `narrationPromptContext`
- `NarrationResponse`: `narrationText`

### Mock 4-variant tour scripts (Wave 2)

4 deterministic mock scripts ship at `frontend/src/modes/onboarding/mockTours.ts`:

| Variant | Waypoint count | Duration (~) | Key buildings |
|---|---|---|---|
| `generic-30sec` | 4 | 22.5s | main.py + diagnostic.py + scanner.py + tour.tsx (4 of 5 landmarks) |
| `sprint-goal` | 5 | 27.5s | main.py + scanner.py + auth.py + diagnostic.py + probes.py |
| `feature-scoped` | 3 | 16.5s | tour.tsx + welcome.tsx + checklist.tsx (onboarding district drill) |
| `cross-onboarding` | 3 | 16.5s | openspec/project.md + spec_1.md + doc_1.md (@hafiz-owned) |

Each waypoint includes complete `narrationPromptContext` per Pythia contract Asumption 1 (Triton wires variant-specific prompt framing). Camera offset convention documented in `_meta/uncertainty/boreas-cycle1-20260512-2350.md` U4: offset measured from building centroid `[x, height/2, z]`.

### Wave 2 mock narration (static line bank)

Boreas authored `frontend/src/modes/onboarding/hermesLines.ts` with bilingual Indonesian primary + English code-switch narration per (variant, waypointIndex). Each line is 1-3 sentence, ~10-20 word per sentence, sized for 2-3s dwell legibility. Voice = warm welcoming guide tone per PRD Section 10.5.

The `fetchWaypointNarration(tourId, waypoint)` API in `frontend/src/modes/onboarding/tourDSL.ts` returns these static lines Wave 2. Wave 3 Triton swap replaces with real DeepSeek fetch.

## What Triton Wave 3 must implement

### Backend endpoint per Pythia contract

```python
# backend/app/api/onboarding.py (Triton authors Wave 3)
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal

class BuildingContext(BaseModel):
    label: str
    archetype: str
    ownership: str
    recent_activity: str

class VariantContext(BaseModel):
    sprint_goal: str | None = None
    feature: str | None = None
    target_username: str | None = None

class NarrationPromptContext(BaseModel):
    purpose: str
    building_context: BuildingContext
    variant_context: VariantContext | None = None

class NarrationRequest(BaseModel):
    tour_id: str
    waypoint_index: int
    tour_variant: Literal["generic-30sec", "sprint-goal", "feature-scoped", "cross-onboarding"]
    narration_prompt_context: NarrationPromptContext

@router.post("/api/onboarding/narration")
async def fetch_narration(req: NarrationRequest, session: dict = Depends(require_session)):
    ...
```

Field naming: backend uses `snake_case`, frontend uses `camelCase`. Triton applies Pydantic alias generator to bridge (per `selene-to-demeter.md` precedent).

### DeepSeek routing per PRD Section 18.3

- Hermes resident: V4-Flash non-thinking mode (locked).
- System prompt: PromptOpening header + Hermes persona ("warm welcoming guide, brief, conversational") + variant-specific framing.
- Output: 1-3 sentence narration text, conversational, dev-tool warm.
- max_tokens: 150 cap per Pythia contract.

### Defensive layer

- Top-10 canned response pre-cached should include `Hermes-tour-intro`, `Hermes-tour-outro`, `Hermes-feature-handoff` patterns (Pythia contract validation step "consumer responsibility").
- Cascade: V4-Flash fail -> V4-Pro -> canned response.
- Tour variant unsupported: 422 with valid variant list per Pythia contract Section "Edge case handling".

### Frontend swap surface

Boreas's `frontend/src/modes/onboarding/tourDSL.ts` exports `fetchWaypointNarration(tourId, waypoint)` with the canonical Pythia signature. Wave 3 Triton swap replaces the function body to POST `/api/onboarding/narration` instead of looking up the static line bank. NO frontend consumer call sites change (the `useHermesTour` hook calls fetchWaypointNarration unchanged).

```typescript
// Wave 3 Triton-aligned swap (pseudo)
export async function fetchWaypointNarration(
  tourId: string,
  waypoint: TourWaypoint
): Promise<NarrationResponse> {
  const tourVariant = (tourId.split('-v')[0] as TourVariant) ?? 'generic-30sec';
  const response = await fetch('/api/onboarding/narration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tourId,
      waypointIndex: waypoint.index,
      tourVariant,
      narrationPromptContext: waypoint.narrationPromptContext,
    }),
    credentials: 'include',  // session cookie
  });
  if (!response.ok) {
    // Fallback to static line bank.
    return { narrationText: getHermesLine(tourVariant, waypoint.index) };
  }
  return await response.json();
}
```

## Asumption baked (Boreas to Triton)

1. **Pythia contract is canonical**: when agent.md mock schemas diverge from Pythia, Pythia wins. Boreas's types match Pythia verbatim (decision log D1).
2. **Camera offset convention**: offset measured from building centroid `[x, height/2, z]` (uncertainty U4). Triton may include building height in context if Wave 3 wants richer offset computation.
3. **Mock translation**: Wave 2 `recentActivity` field formatted as `"${count} commits last 30 days"` where count = `Math.round(building.activity * 30)`. Wave 3 Demeter swap supplies real commit count + format passthrough.
4. **tourId convention**: `${variant}-v${version}` (e.g., `generic-30sec-v1`). Wave 3 Triton extracts variant via `tourId.split('-v')[0]` for Pydantic routing.
5. **Wave 2 stub timing**: `fetchWaypointNarration` simulates 50ms async fetch via `setTimeout`. Wave 3 real fetch may take longer; Boreas's `useHermesTour.startTour` pre-fetches all waypoints upfront in parallel so the dwell experience is unaffected.

## Validation steps for Triton consumer

1. Read `frontend/src/modes/onboarding/types.ts` lines 1-200 to confirm types match Pydantic.
2. Read `frontend/src/modes/onboarding/mockTours.ts` to see Wave 2 sample request shape with full `narrationPromptContext` payload.
3. Implement `/api/onboarding/narration` endpoint accepting the JSON shape.
4. Smoke test: send a mock request like:
   ```json
   {
     "tourId": "generic-30sec-v1",
     "waypointIndex": 0,
     "tourVariant": "generic-30sec",
     "narrationPromptContext": {
       "purpose": "Welcome the new hire and introduce the main entry point of the backend.",
       "buildingContext": {
         "label": "main.py",
         "archetype": "temple",
         "ownership": "@backend-team",
         "recentActivity": "25 commits last 30 days"
       }
     }
   }
   ```
   Expected: 1-3 sentence conversational narration in Indonesian primary + English code-switch.
5. Replace `fetchWaypointNarration` body in `tourDSL.ts` with real fetch + verify `/boreas-smoke?mode=onboarding&variant=generic-30sec` plays full tour with real narration.

## Edge case handling (Boreas owns frontend-side fallback)

- DeepSeek API fail: Wave 3 Triton cascade to V4-Pro then canned. Boreas's Wave 3 swap recipe above falls back to static `getHermesLine()` on HTTP error so the tour stays playable in offline demo mode.
- Tour variant unsupported: Triton returns 422. Boreas swap consumes fallback line.
- User interrupts mid-tour (pointer down on canvas): Boreas's CameraFly cleanup kills GSAP timeline + restores OrbitControls. Triton's narration response (pending or cached) is harmless because no overlay reads narration after phase=idle.

## Open questions (deferred)

- **Localization toggle**: PRD Section 19.2 says Indonesian primary + English code-switch. Triton may want to accept `locale: 'id' | 'en' | 'id-en'` parameter in NarrationRequest. Pythia contract does not lock this; defer to Wave 3 Triton + Boreas re-handoff if needed.
- **tourId stability**: Wave 2 uses static `-v1` suffix per variant. Wave 3 may want session-scoped tour IDs (`generic-30sec-${sessionId}-v1`) for caching + analytics. Boreas's `resolveTour` helper can produce that easily; Triton signals if needed.

## Reference

- Pythia contract: `_meta/contracts/boreas-to-triton.md`
- Boreas decision log: `_meta/decision_log/boreas.md` D1 + D2 + D4 + D6
- Boreas uncertainty journal: `_meta/uncertainty/boreas-cycle1-20260512-2350.md` U2 + U4 + U7
- PRD Section 9.1 (Onboarding Mode + 4 Hermes tour variant)
- PRD Section 10.5 (Hermes Tourist Info Guide persona)
- PRD Section 18.3 (Hermes V4-Flash non-think routing locked)
- PRD Section 19.2 (Indonesian primary bilingual)

## Boreas ship status

- Onboarding Mode 7 component authored: CameraFly + HermesNarrationOverlay + EndingSummaryPanel + TourVariantRouter + tourDSL + OnboardingMode + useHermesTour. Plus mockTours + hermesLines + types = 10 onboarding source files.
- 4 tour variant mock scripts ship Wave 2 (generic-30sec full + 3 placeholders deterministic).
- Smoke test at `/boreas-smoke?mode=onboarding[&variant=X]` verified clean console + variant router + ending summary panel + bilingual Hermes narration overlay.
- TypeScript clean on Boreas-owned files.
- Triton Wave 3 unblocked.
