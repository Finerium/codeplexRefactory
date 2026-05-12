/**
 * Onboarding Mode public types.
 *
 * Owner: Boreas (Wave 2).
 * Contract: `_meta/contracts/boreas-to-triton.md` (locked Wave 0 Pythia).
 *
 * The TourScript + TourWaypoint schema here is the canonical Wave 2 frontend
 * representation that Wave 3 Triton consumes via the HTTP endpoint
 * `/api/onboarding/narration` per Pythia contract Section "Output schema".
 *
 * The schema follows Pythia hyphenated tour variant identifiers + rich
 * narration prompt context (purpose + buildingContext + variantContext).
 * Wave 2 Boreas authors 4 mock tour scripts (one per variant) at
 * `./mockTours.ts`. Wave 3 Triton swaps placeholder narration text with real
 * Hermes narration via the locked fetch contract.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim Wave 2 mock vs Wave 3 real): MOCK boundary lives in
 *     `./mockTours.ts` only; this types file is the canonical schema for
 *     both Wave 2 + Wave 3.
 */

/**
 * The 4 Hermes tour variants per PRD Section 9.1 + Pythia contract
 * `boreas-to-triton.md` line 22-29.
 *
 * - `generic-30sec`: new-hire baseline tour, top-3 districts via deterministic
 *   pick (ownership concentration + recent activity).
 * - `sprint-goal`: tour scoped to active sprint goal buildings (mock Wave 2:
 *   high-activity buildings + cluster around milestone).
 * - `feature-scoped`: tour following dependency graph from a feature entry
 *   point (e.g., user types "tour for feature onboarding").
 * - `cross-onboarding`: tour through buildings owned by a target user
 *   (`targetUsername` required in context).
 */
export type TourVariant =
  | 'generic-30sec'
  | 'sprint-goal'
  | 'feature-scoped'
  | 'cross-onboarding';

/**
 * BuildingContext fed to Hermes narration prompt. Boreas Wave 2 populates
 * from `BuildingData` (Iris) + mock recent activity translation. Wave 3
 * Demeter populates `recentActivity` from real commit metadata.
 */
export interface NarrationBuildingContext {
  /** Building display label (basename for file buildings). */
  label: string;
  /** Iris BuildingArchetype (temple, cross-shape, etc.). */
  archetype: string;
  /** CODEOWNERS owner string (e.g., "@backend-team"). */
  ownership: string;
  /**
   * Recent activity descriptor freeform string. Wave 2 mock format:
   * "${count} commits last 30 days". Wave 3 real: derived from
   * Demeter `commit_frequency_per_building` materialized view.
   */
  recentActivity: string;
}

/**
 * Variant-specific context fields. At most one of sprintGoal / feature /
 * targetUsername is set per the corresponding variant.
 */
export interface NarrationVariantContext {
  /** Set when variant === 'sprint-goal'. */
  sprintGoal?: string;
  /** Set when variant === 'feature-scoped'. */
  feature?: string;
  /** Set when variant === 'cross-onboarding'. */
  targetUsername?: string;
}

/**
 * Full narration prompt context fed to Triton Wave 3 for Hermes generation.
 * Wave 2 Boreas stores a static-line analog at `./hermesLines.ts` indexed by
 * `(variant, waypoint.index)`.
 */
export interface NarrationPromptContext {
  /** Purpose of this waypoint (e.g., "Introducing main entry point"). */
  purpose: string;
  /** Building metadata informing narration content. */
  buildingContext: NarrationBuildingContext;
  /** Variant-specific framing if applicable. */
  variantContext?: NarrationVariantContext;
}

/**
 * One waypoint in the camera fly sequence. Camera transitions through
 * waypoints in `index` order, dwelling at each for narration legibility.
 */
export interface TourWaypoint {
  /** Sequence id 0-based. */
  index: number;
  /** Iris BuildingData.id this waypoint frames. */
  targetBuildingId: string;
  /**
   * Camera position offset from building centroid `[x, y=height/2, z]`.
   * Convention documented at U4 (uncertainty journal cycle 1).
   * Positive Y = above centroid, positive Z = in front of building.
   */
  cameraOffset: [number, number, number];
  /**
   * Camera look-at target offset from building centroid. `[0, 0, 0]` looks
   * at exact centroid.
   */
  lookAtOffset: [number, number, number];
  /**
   * Pause duration at waypoint in ms. Narration overlay visible during this
   * window. Recommended 2000-4000ms for legibility.
   */
  pauseDurationMs: number;
  /**
   * Transition duration to NEXT waypoint in ms. Camera ease-in/out applied.
   * Last waypoint's transition is consumed by the ending summary panel
   * fade-in instead.
   */
  transitionDurationMs: number;
  /** Narration prompt context fed to Wave 3 Triton (or Wave 2 static line bank). */
  narrationPromptContext: NarrationPromptContext;
}

/**
 * Ending summary panel content shown after the final waypoint dwell.
 *
 * Wave 2: mock starting file path + mock owner. Wave 3 Demeter feedback
 * supplies real `primaryEntryPath` + `primaryOwnerLogin` + `primaryOwnerAvatar`.
 */
export interface EndingSummary {
  /** Suggested starting file for the new hire to read first. */
  primaryEntryPath: string;
  /** Owner GitHub login (with @ prefix kept for display consistency). */
  primaryOwnerLogin: string;
  /** Owner avatar URL or empty string Wave 2 placeholder. */
  primaryOwnerAvatar: string;
}

/**
 * Full tour script consumed by `CameraFly` + `HermesNarrationOverlay` +
 * `EndingSummaryPanel`. Author: Boreas (Wave 2 mock) + Wave 3 backend
 * top-3 district pick algorithm.
 */
export interface TourScript {
  /** Stable tour identifier (e.g., "generic-30sec-v1"). */
  id: string;
  /** Variant flavor. */
  variant: TourVariant;
  /** Sequence of waypoints. First is intro, last is outro before summary. */
  waypoints: TourWaypoint[];
  /** Ending summary card content. */
  endingSummary: EndingSummary;
}

/**
 * Request shape for the Wave 3 Triton narration fetch endpoint. Mirrors the
 * Pydantic `NarrationRequest` in `backend/app/api/onboarding.py` per Pythia
 * contract Section "Output schema".
 *
 * Wave 2: stub fetch returns static line from `./hermesLines.ts` mock.
 */
export interface NarrationRequest {
  tourId: string;
  waypointIndex: number;
  tourVariant: TourVariant;
  narrationPromptContext: NarrationPromptContext;
}

export interface NarrationResponse {
  narrationText: string;
}
