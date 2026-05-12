# Contract: Boreas to Triton

**Edge type**: cross-wave (Wave 2 to Wave 3)
**Wave**: Wave 2 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:37 WIB

## Producer

**Worker**: Boreas (Wave 2)
**Domain**: Onboarding camera fly + Hermes narration overlay (30-second tour ending summary), Activity timeline scrubber 30/60/90 day toggle + hotspot intensity glow + ownership heatmap toggle. Boreas authors the Hermes tour script DSL (waypoints + narration prompts) that Triton consumes to wire Hermes resident (V4-Flash non-think) to generate narration text per waypoint.

## Consumer

**Worker**: Triton (Wave 3)
**Domain**: DeepSeek V4 client + defensive layer + thinking-mode toggle + per-resident routing. Triton receives tour script DSL with prompts per waypoint, runs DeepSeek inference for Hermes resident, returns narration text. Triton handles 4 Hermes tour variant routing: generic 30-second, sprint goal scoped, feature scoped, cross-onboarding @username.

## Output schema (producer to consumer)

Boreas defines the tour script DSL; Triton consumes via HTTP endpoint.

```typescript
// frontend/src/modes/onboarding/tourScript.ts (Boreas authors)

export type TourVariant =
  | 'generic-30sec'      // 30-second baseline tour
  | 'sprint-goal'        // Scoped to current sprint goal
  | 'feature-scoped'     // Scoped to specific feature/issue
  | 'cross-onboarding';  // Cross-team handover targeting @username

export interface TourWaypoint {
  /** Sequence id within tour, 0-based. */
  index: number;
  /** Building id camera focuses on. */
  targetBuildingId: string;
  /** Camera position offset from building [x, y, z]. */
  cameraOffset: [number, number, number];
  /** Camera look-at target offset. */
  lookAtOffset: [number, number, number];
  /** Pause duration at waypoint in ms (waiting for narration to read). */
  pauseDurationMs: number;
  /** Transition duration to next waypoint in ms. */
  transitionDurationMs: number;
  /** Narration prompt context for Triton/Hermes to generate text. */
  narrationPromptContext: {
    /** What this waypoint is about (e.g., "introducing main entry point"). */
    purpose: string;
    /** Building metadata to inform narration. */
    buildingContext: {
      label: string;
      archetype: string;
      ownership: string;
      recentActivity: string;
    };
    /** Tour variant-specific context. */
    variantContext?: {
      sprintGoal?: string;       // For sprint-goal variant
      feature?: string;          // For feature-scoped variant
      targetUsername?: string;   // For cross-onboarding variant
    };
  };
}

export interface TourScript {
  /** Stable tour identifier. */
  id: string;
  variant: TourVariant;
  /** Sequence of waypoints; first is starting position, last is ending. */
  waypoints: TourWaypoint[];
  /** Final summary panel content (starting file + owner contact info). */
  endingSummary: {
    primaryEntryPath: string;
    primaryOwnerLogin: string;
    primaryOwnerAvatar: string;
  };
}

/** Request narration text from Triton for a waypoint. */
export async function fetchWaypointNarration(
  tourId: string,
  waypoint: TourWaypoint
): Promise<{ narrationText: string }>;
```

Triton backend endpoint:

```python
# backend/app/api/onboarding.py (Triton Wave 3)
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal
from app.services.deepseek_client import call_with_fallback

router = APIRouter(prefix="/api/onboarding")


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


@router.post("/narration")
async def fetch_narration(req: NarrationRequest, session: dict = Depends(require_session)):
    """Generates Hermes narration text for a tour waypoint.

    DeepSeek V4-Flash non-thinking per PRD Section 18.3 Hermes routing.
    System prompt = PromptOpening header + Hermes persona + tour variant context.
    Output: 1-3 sentence narration, conversational, dev-tool warm.
    """
    response = await call_with_fallback(
        messages=build_hermes_messages(req),
        prefer_pro=False,  # V4-Flash non-think
        max_retries=2,
        max_tokens=150,  # 1-3 sentences cap
    )
    return {"narration_text": response}
```

## Storage location

- Frontend DSL + fetch: `frontend/src/modes/onboarding/tourScript.ts` (Boreas)
- Tour generation logic: `frontend/src/modes/onboarding/generateTour.ts` (Boreas; deterministic top-3 district pick based on ownership + recent activity, mock Wave 2)
- Backend endpoint: `backend/app/api/onboarding.py` (Triton Wave 3)
- DeepSeek client: shared `backend/app/services/deepseek_client.py` (Triton)
- Wave 2 mock: Boreas hardcodes 4 sample tours (one per variant) with placeholder narration text; Wave 3 swap fetches real Hermes narration

## Asumption baked

1. Hermes routing: V4-Flash non-think per PRD Section 18.3. Triton wires correct model.
2. Narration text cap 150 tokens (1-3 sentences); Hermes conversational tone per persona prompt.
3. Tour variant 'generic-30sec' is mandatory; 'sprint-goal', 'feature-scoped', 'cross-onboarding' optional Wave 2 stretch (PRD AD-09).
4. Deterministic top-3 district pick algorithm Wave 2 mock (Boreas authors): score = (ownership concentration * 0.5) + (recent activity intensity * 0.5); pick top 3 districts; one waypoint per district plus entry point waypoint.
5. Cross-onboarding variant requires `targetUsername` context (Boreas validates presence in DSL before fetch).
6. Camera fly smoothness: cubic-bezier easing per Designer Prompt 1 motion philosophy (sharable across pages).

## Validation steps

**Producer responsibility (Boreas)**:
- Generate 4 tour variant samples Wave 2; each waypoint includes complete `narrationPromptContext`.
- Fetch narration on tour start; cache responses per waypoint per session.
- Camera fly smooth (no jitter 60fps per Boreas ship criteria); use GSAP timeline for orchestration.
- Hermes narration text overlay on screen, fade-in/out per `pauseDurationMs`.
- Smoke test: trigger generic-30sec tour, observe camera fly with placeholder narration; Wave 3 swap real Hermes responses.

**Consumer responsibility (Triton)**:
- Implement `/api/onboarding/narration` endpoint routing to V4-Flash non-think.
- System prompt includes PromptOpening header + Hermes persona ("warm welcoming guide, brief, conversational") + variant-specific framing.
- Defensive layer: top-10 canned responses pre-cached include common narration patterns (Hermes-tour-intro, Hermes-tour-outro, Hermes-feature-handoff).
- Smoke test: send mock waypoint request with building context "Athena City Hall + backend-team owner + 12 commits last week", response < 150 tokens, conversational.

## Edge case handling

- Tour variant unsupported (typo or future variant): Triton returns 422 with valid variant list.
- DeepSeek API failure on first request: defensive layer cascades to V4-Pro then canned (response may be generic "Welcome to your codebase.").
- Building context missing fields (e.g., recent_activity unknown): Triton falls back to generic narration without recent activity reference.
- Camera fly interrupted by user OrbitControls input: Boreas pauses tour, user resumes manually via "Resume Tour" button.

## Open questions

- Narration localization: Indonesian primary + English code-switch (PRD Section 19.2). Triton ensures Hermes persona prompt instructs bilingual capability. Boreas can supply locale preference in NarrationRequest.
- Tour variant 'feature-scoped' issue identifier: GitHub issue number? PRD Section 9.1 onboarding scope mentions feature handoff; Boreas + Triton finalize Wave 2-3 boundary.

## Reference

- Metis Agentic Structure md Section 2 DAG: Boreas Hermes tour script DSL consumed by Wave 3 Triton prompt-wiring
- Metis Section 5.4 Boreas + Section 5.6 Triton ship criteria
- PRD Section 9.1 (Onboarding Mode + 4 Hermes tour variant)
- PRD Section 18.3 (Hermes V4-Flash non-think locked)
- PRD Section 18.5 (canned response pre-cache top-10 demo questions)
- Phase B Topic E (DeepSeek V4 reliability)
- Hephaestus Wave 0 PromptOpening (Hermes persona + tour variant prompts)
