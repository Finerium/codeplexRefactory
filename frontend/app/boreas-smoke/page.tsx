'use client';

/**
 * Boreas smoke route: isolated verification for Onboarding + Activity modes.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D11.
 *
 * This route mounts ChronicleCanvas + Iris BuildingInstances + Boreas mode
 * layers (Canvas-tree + DOM HUD) in a single page. Boreas-side artifacts
 * verified WITHOUT touching Calliope's `frontend/app/city/page.tsx`. Pattern
 * matches Iris `/iris-smoke` + Daedalus `/daedalus-smoke` smoke routes.
 *
 * Mode toggle: top-left button switches between 'onboarding' | 'activity' |
 * 'none' (free OrbitControls). Dike Wave 2 audit drives the toggle to
 * verify each mode's visual operation per the audit checklist.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: smoke labeled visibly in UI.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChronicleCanvas } from '@/scene';
import {
  BuildingInstances,
  useBuildingClick,
  useBuildingClickDispatch,
  useCityData,
} from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import {
  OnboardingCanvasLayer,
  OnboardingHud,
  useOnboardingController,
} from '@/modes/onboarding';
import {
  ActivityCanvasLayer,
  ActivityHud,
} from '@/modes/activity';

type SmokeMode = 'none' | 'onboarding' | 'activity';

function CityScene({ mode, controller }: { mode: SmokeMode; controller: ReturnType<typeof useOnboardingController> }) {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();

  // Demo subscriber to confirm click pipeline lives.
  useBuildingClick((building: BuildingData) => {
    // eslint-disable-next-line no-console
    console.log(`[boreas-smoke] building click ${building.id}`, {
      district: building.district,
      activity: building.activity,
    });
  });

  return (
    <>
      <BuildingInstances data={city} onBuildingClick={dispatchClick} />
      {mode === 'onboarding' ? <OnboardingCanvasLayer controller={controller} /> : null}
      {mode === 'activity' ? <ActivityCanvasLayer /> : null}
    </>
  );
}

export default function BoreasSmokePage() {
  const searchParams = useSearchParams();
  const queryMode = searchParams?.get('mode');
  // Initial mode from URL query for Playwright smoke entry.
  const initial: SmokeMode =
    queryMode === 'onboarding'
      ? 'onboarding'
      : queryMode === 'activity'
        ? 'activity'
        : 'none';
  const [mode, setMode] = useState<SmokeMode>(initial);
  const controller = useOnboardingController();

  // Sync URL changes (e.g., Playwright navigation).
  useEffect(() => {
    if (queryMode === 'onboarding' || queryMode === 'activity' || queryMode === 'none') {
      setMode(queryMode as SmokeMode);
    }
  }, [queryMode]);

  // Auto-start tour if variant query param present + mode === onboarding.
  const queryVariant = searchParams?.get('variant');
  useEffect(() => {
    if (mode === 'onboarding' && queryVariant && controller.tour.phase === 'idle' && !controller.tour.variant) {
      const variant = queryVariant as 'generic-30sec' | 'sprint-goal' | 'feature-scoped' | 'cross-onboarding';
      if (['generic-30sec', 'sprint-goal', 'feature-scoped', 'cross-onboarding'].includes(variant)) {
        void controller.handleStart(variant);
      }
    }
  }, [mode, queryVariant, controller]);

  // When user switches mode, reset the tour controller (defensive).
  const handleModeChange = (next: SmokeMode) => {
    if (next !== 'onboarding') controller.tour.reset();
    setMode(next);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-codeplex-void text-white">
      <ChronicleCanvas
        cameraTarget={[0, 0, 0]}
        cameraPosition={[0, 90, 140]}
        paused={mode === 'onboarding'}
      >
        <CityScene mode={mode} controller={controller} />
      </ChronicleCanvas>

      {/* Mode toggle HUD top-left */}
      <div className="pointer-events-auto fixed left-6 top-6 z-30 flex flex-col gap-2 rounded-2xl border border-white/10 bg-codeplex-shadow/80 p-4 backdrop-blur-glass">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-codeplex-ember">
          Boreas smoke
        </p>
        <p className="text-[11px] text-white/70">
          Mode toggle (Dike Wave 2 audit aid)
        </p>
        <div className="mt-1 flex flex-col gap-1.5">
          {(['none', 'onboarding', 'activity'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={[
                'rounded-lg border border-white/10 px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-widest',
                'transition-colors duration-150',
                mode === m
                  ? 'bg-codeplex-ember/25 text-codeplex-ember'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding HUD (variant router + narration + ending summary) */}
      {mode === 'onboarding' ? <OnboardingHud controller={controller} /> : null}

      {/* Activity HUD (scrubber + range toggle + heatmap toggle) */}
      {mode === 'activity' ? <ActivityHud /> : null}
    </main>
  );
}
