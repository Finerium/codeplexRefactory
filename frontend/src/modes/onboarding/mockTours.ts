/**
 * [MOCK Wave 2, real Wave 3 Demeter ranked query] Mock 4-variant tour scripts.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D4.
 *
 * Wave 2 produces 4 deterministic tour scripts pinned to known mock building
 * ids from Iris `mockCityData`. Wave 3 Demeter replaces with ranked
 * top-3-district pick from real materialized view query per Pythia
 * `boreas-to-triton.md` Asumption 4 algorithm:
 *
 *   score = (ownership concentration * 0.5) + (recent activity intensity * 0.5)
 *
 * The 5 landmark slots from Iris are pinned to:
 *   - Athena (temple)        -> backend/app/core/main.py
 *   - Apollo (cross-shape)   -> backend/app/health/diagnostic.py
 *   - Argus (tower)          -> backend/app/security/scanner.py
 *   - Clio (vertical-stack)  -> frontend/src/history/timeline.tsx
 *   - Hermes (glass-cube)    -> frontend/src/onboarding/tour.tsx
 *
 * Camera offset convention per uncertainty journal U4: offset measured from
 * building centroid `[building.x, building.height/2, building.z]`. Positive Y
 * = above centroid, positive Z = in front of building. Mock values tuned to
 * produce cinematic medium-shot framing per waypoint (camera ~30 units away,
 * elevation +20 above centroid, slight forward Z).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: [MOCK Wave 2 ...] label at top.
 */

import type { TourScript } from './types';

/**
 * Cinematic medium-shot offset convention applied to every waypoint unless
 * specifically overridden. Reads as "step back 30 units, lift up 20, peek
 * forward 30 along Z".
 */
const MEDIUM_SHOT_OFFSET: [number, number, number] = [30, 20, 30];
const CENTROID_LOOK: [number, number, number] = [0, 0, 0];

/**
 * Standard waypoint durations per Pythia + D2 decision:
 *   transition 2.5s ease-in/out + dwell 3.0s for narration legibility.
 *
 * Generic-30sec total runtime: 4 waypoints * (2.5 + 3.0) = 22s + 8s
 * pre-roll + outro fade = ~30s. Matches PRD Section 9.1 "30-second tour"
 * wording.
 */
const STANDARD_TRANSITION_MS = 2500;
const STANDARD_DWELL_MS = 3000;

/**
 * Helper to construct a building-context waypoint with mock activity translation
 * matching uncertainty journal U2 decision: convert building.activity (0..1)
 * to "${count} commits last 30 days" via `Math.round(activity * 30)`.
 */
function mockRecentActivity(activity: number): string {
  const count = Math.round(activity * 30);
  return `${count} commits last 30 days`;
}

export const MOCK_GENERIC_30SEC: TourScript = {
  id: 'generic-30sec-v1',
  variant: 'generic-30sec',
  waypoints: [
    {
      index: 0,
      // Athena City Hall
      targetBuildingId: 'backend/app/core/main.py',
      cameraOffset: [25, 22, 30],
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Welcome the new hire and introduce the main entry point of the backend.',
        buildingContext: {
          label: 'main.py',
          archetype: 'temple',
          ownership: '@backend-team',
          recentActivity: mockRecentActivity(0.82),
        },
      },
    },
    {
      index: 1,
      // Apollo Hospital
      targetBuildingId: 'backend/app/health/diagnostic.py',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Introduce the Apollo Hospital and the 5 deterministic detectors for code health.',
        buildingContext: {
          label: 'diagnostic.py',
          archetype: 'cross-shape',
          ownership: '@platform',
          recentActivity: mockRecentActivity(0.68),
        },
      },
    },
    {
      index: 2,
      // Argus Police Station
      targetBuildingId: 'backend/app/security/scanner.py',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Introduce Argus Police Station, the security district sentinel.',
        buildingContext: {
          label: 'scanner.py',
          archetype: 'surveillance-tower',
          ownership: '@security',
          recentActivity: mockRecentActivity(0.74),
        },
      },
    },
    {
      index: 3,
      // Hermes Tourist Info (outro, self-introduction)
      targetBuildingId: 'frontend/src/onboarding/tour.tsx',
      cameraOffset: [20, 18, 25],
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS + 500,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Outro at Hermes home glass cube; invite the user to reopen the tour later.',
        buildingContext: {
          label: 'tour.tsx',
          archetype: 'glass-cube',
          ownership: '@frontend-team',
          recentActivity: mockRecentActivity(0.71),
        },
      },
    },
  ],
  endingSummary: {
    primaryEntryPath: 'backend/app/core/main.py',
    primaryOwnerLogin: '@backend-team',
    primaryOwnerAvatar: '',
  },
};

export const MOCK_SPRINT_GOAL: TourScript = {
  id: 'sprint-goal-v1',
  variant: 'sprint-goal',
  waypoints: [
    {
      index: 0,
      targetBuildingId: 'backend/app/core/main.py',
      cameraOffset: [28, 24, 32],
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Frame the sprint goal banner over City Hall and orient sprint scope.',
        buildingContext: {
          label: 'main.py',
          archetype: 'temple',
          ownership: '@backend-team',
          recentActivity: mockRecentActivity(0.82),
        },
        variantContext: {
          sprintGoal: 'Ship auth + health monitoring this week',
        },
      },
    },
    {
      index: 1,
      targetBuildingId: 'backend/app/security/scanner.py',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Auth district active sprint work, scanner.py in PR review.',
        buildingContext: {
          label: 'scanner.py',
          archetype: 'surveillance-tower',
          ownership: '@security',
          recentActivity: mockRecentActivity(0.74),
        },
        variantContext: {
          sprintGoal: 'Ship auth + health monitoring this week',
        },
      },
    },
    {
      index: 2,
      targetBuildingId: 'backend/app/security/auth.py',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'auth.py active building, scaffolding visible for sprint ticket.',
        buildingContext: {
          label: 'auth.py',
          archetype: 'generic-office',
          ownership: '@security',
          recentActivity: mockRecentActivity(0.6),
        },
        variantContext: {
          sprintGoal: 'Ship auth + health monitoring this week',
        },
      },
    },
    {
      index: 3,
      targetBuildingId: 'backend/app/health/diagnostic.py',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Health monitoring prep; 5 detector ready, escalation path documented.',
        buildingContext: {
          label: 'diagnostic.py',
          archetype: 'cross-shape',
          ownership: '@platform',
          recentActivity: mockRecentActivity(0.68),
        },
        variantContext: {
          sprintGoal: 'Ship auth + health monitoring this week',
        },
      },
    },
    {
      index: 4,
      targetBuildingId: 'backend/app/health/probes.py',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Wrap sprint tour, point to ticket panel for details.',
        buildingContext: {
          label: 'probes.py',
          archetype: 'generic-residence',
          ownership: '@platform',
          recentActivity: mockRecentActivity(0.5),
        },
        variantContext: {
          sprintGoal: 'Ship auth + health monitoring this week',
        },
      },
    },
  ],
  endingSummary: {
    primaryEntryPath: 'backend/app/security/scanner.py',
    primaryOwnerLogin: '@security',
    primaryOwnerAvatar: '',
  },
};

export const MOCK_FEATURE_SCOPED: TourScript = {
  id: 'feature-scoped-onboarding-v1',
  variant: 'feature-scoped',
  waypoints: [
    {
      index: 0,
      targetBuildingId: 'frontend/src/onboarding/tour.tsx',
      cameraOffset: [22, 20, 28],
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Open the onboarding feature drill at its entry point.',
        buildingContext: {
          label: 'tour.tsx',
          archetype: 'glass-cube',
          ownership: '@frontend-team',
          recentActivity: mockRecentActivity(0.71),
        },
        variantContext: {
          feature: 'onboarding',
        },
      },
    },
    {
      index: 1,
      targetBuildingId: 'frontend/src/onboarding/welcome.tsx',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Show welcome.tsx, the first user-facing screen.',
        buildingContext: {
          label: 'welcome.tsx',
          archetype: 'generic-residence',
          ownership: '@frontend-team',
          recentActivity: mockRecentActivity(0.5),
        },
        variantContext: {
          feature: 'onboarding',
        },
      },
    },
    {
      index: 2,
      targetBuildingId: 'frontend/src/onboarding/checklist.tsx',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Wrap the feature tour at checklist.tsx, the completion gate.',
        buildingContext: {
          label: 'checklist.tsx',
          archetype: 'generic-residence',
          ownership: '@frontend-team',
          recentActivity: mockRecentActivity(0.45),
        },
        variantContext: {
          feature: 'onboarding',
        },
      },
    },
  ],
  endingSummary: {
    primaryEntryPath: 'frontend/src/onboarding/tour.tsx',
    primaryOwnerLogin: '@frontend-team',
    primaryOwnerAvatar: '',
  },
};

export const MOCK_CROSS_ONBOARDING: TourScript = {
  id: 'cross-onboarding-hafiz-v1',
  variant: 'cross-onboarding',
  waypoints: [
    {
      index: 0,
      targetBuildingId: 'openspec/project.md',
      cameraOffset: [22, 18, 24],
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'Open the @hafiz-owned openspec district at its anchor file.',
        buildingContext: {
          label: 'project.md',
          archetype: 'generic-residence',
          ownership: '@hafiz',
          recentActivity: mockRecentActivity(0.55),
        },
        variantContext: {
          targetUsername: 'hafiz',
        },
      },
    },
    {
      index: 1,
      targetBuildingId: 'openspec/specs/spec_1.md',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'A representative spec @hafiz authored recently.',
        buildingContext: {
          label: 'spec_1.md',
          archetype: 'generic-residence',
          ownership: '@hafiz',
          recentActivity: mockRecentActivity(0.4),
        },
        variantContext: {
          targetUsername: 'hafiz',
        },
      },
    },
    {
      index: 2,
      targetBuildingId: 'docs/doc_1.md',
      cameraOffset: MEDIUM_SHOT_OFFSET,
      lookAtOffset: CENTROID_LOOK,
      pauseDurationMs: STANDARD_DWELL_MS,
      transitionDurationMs: STANDARD_TRANSITION_MS,
      narrationPromptContext: {
        purpose: 'A representative doc @hafiz maintains.',
        buildingContext: {
          label: 'doc_1.md',
          archetype: 'generic-residence',
          ownership: '@hafiz',
          recentActivity: mockRecentActivity(0.35),
        },
        variantContext: {
          targetUsername: 'hafiz',
        },
      },
    },
  ],
  endingSummary: {
    primaryEntryPath: 'openspec/project.md',
    primaryOwnerLogin: '@hafiz',
    primaryOwnerAvatar: '',
  },
};

/**
 * Public registry: lookup mock tour by variant. Wave 3 backend replaces this
 * helper with a real fetch that runs the top-3 district pick algorithm per
 * Pythia contract.
 */
export const MOCK_TOURS: Record<string, TourScript> = {
  'generic-30sec': MOCK_GENERIC_30SEC,
  'sprint-goal': MOCK_SPRINT_GOAL,
  'feature-scoped': MOCK_FEATURE_SCOPED,
  'cross-onboarding': MOCK_CROSS_ONBOARDING,
};
