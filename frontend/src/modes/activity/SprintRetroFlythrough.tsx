'use client';

/**
 * SprintRetroFlythrough: 60s cinematic flythrough of top-3 hot buildings
 * + Clio narration via real DeepSeek V4-Flash non-think.
 *
 * Owner: Boreas (Wave-Fixing #2 Cycle 1, 2026-05-13 Day 2 03:13 WIB).
 *
 * Per PRD Section 9.4 Activity Mode use case "Sprint retro (60-second
 * flythrough perubahan sprint dengan Clio narration)" + Section 10.4 Clio
 * narrator role.
 *
 * Component composition (two-layer pattern same as Onboarding):
 *   - SprintRetroCanvasLayer: r3f child, mount INSIDE ChronicleCanvas
 *     -> reuses CameraFly via auto-synthesized TourScript over top-3 hot
 *        buildings.
 *   - SprintRetroHud: DOM HUD, mount OUTSIDE ChronicleCanvas
 *     -> trigger button + Clio narration overlay during flythrough.
 *
 * Lifecycle: idle -> fetching narration -> flying (camera + overlay) ->
 * complete. Single-shot; user clicks trigger again to replay.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 4: routing locked Clio V4-Flash.
 *   Lock 5: real DeepSeek fetch; canned fallback labeled.
 */

import { useCallback, useMemo, useState } from 'react';
import { CameraFly } from '@/modes/onboarding/CameraFly';
import type { TourPhase } from '@/modes/onboarding/useHermesTour';
import type { TourScript, TourWaypoint } from '@/modes/onboarding/types';
import { mockCityData } from '@/scene/buildings';
import { useActivityData } from './useActivityData';
import { useActivityStore, selectRangeDays } from './store';
import { fetchClioRetroNarration } from './clioNarration';

/** Phase machine for the retro flythrough. */
export type RetroPhase = 'idle' | 'fetching' | 'flying' | 'complete';

interface RetroState {
  phase: RetroPhase;
  script: TourScript | null;
  narration: string;
  usedFallback: boolean;
  currentWaypointIndex: number | undefined;
}

const INITIAL_STATE: RetroState = {
  phase: 'idle',
  script: null,
  narration: '',
  usedFallback: false,
  currentWaypointIndex: undefined,
};

/**
 * Auto-build a TourScript over top-3 hottest buildings in the current
 * Activity window. Each waypoint = 20 seconds = 60s total runtime. Camera
 * orbits each building at fixed offset for visual identity.
 */
function buildRetroScript(
  rangeDays: 30 | 60 | 90,
  topHotspotIds: string[]
): TourScript {
  const fallbackIds = mockCityData.buildings
    .slice(0, 3)
    .map((b) => b.id);
  const ids =
    topHotspotIds.length > 0 ? topHotspotIds.slice(0, 3) : fallbackIds;

  const waypoints: TourWaypoint[] = ids.map((id, i) => {
    const building = mockCityData.buildings.find((b) => b.id === id);
    const label = building?.label ?? id;
    return {
      index: i,
      targetBuildingId: id,
      // Orbit pattern: camera at fixed offset (X+25, Y+18, Z+25), looking
      // at building centroid.
      cameraOffset: [25, 18, 25],
      lookAtOffset: [0, 0, 0],
      pauseDurationMs: 8000,
      transitionDurationMs: 12000,
      narrationPromptContext: {
        purpose: `Sprint retro stop ${i + 1} of 3 at ${label}`,
        buildingContext: {
          label,
          archetype: building?.archetype ?? 'office',
          ownership: building?.district ?? 'unknown',
          recentActivity: `top hotspot in last ${rangeDays} days`,
        },
      },
    };
  });

  return {
    id: `sprint-retro-${rangeDays}d-v1`,
    variant: 'generic-30sec',
    waypoints,
    endingSummary: {
      primaryEntryPath: '',
      primaryOwnerLogin: '',
      primaryOwnerAvatar: '',
    },
  };
}

/**
 * Hook driving the retro flythrough state machine. Single source of truth
 * for both layers (Canvas + HUD).
 */
export function useSprintRetroController() {
  const data = useActivityData();
  const rangeDays = useActivityStore(selectRangeDays);
  const [state, setState] = useState<RetroState>(INITIAL_STATE);

  const start = useCallback(async () => {
    if (state.phase === 'fetching' || state.phase === 'flying') return;
    setState({ ...INITIAL_STATE, phase: 'fetching' });

    // Identify top-3 hotspots.
    const topIds = [...data.hotspots]
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3)
      .map((h) => h.buildingId);
    const script = buildRetroScript(rangeDays, topIds);

    // Fetch Clio narration prose (real DeepSeek -> canned fallback).
    const { text, usedFallback } = await fetchClioRetroNarration(
      data,
      rangeDays
    );

    setState({
      phase: 'flying',
      script,
      narration: text,
      usedFallback,
      currentWaypointIndex: 0,
    });
  }, [data, rangeDays, state.phase]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleFlyComplete = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'complete' }));
  }, []);

  // Adapter: CameraFly expects setPhase + setWaypointIndex from useHermesTour
  // signature, but we just need waypoint tracking for narration animation.
  const setPhaseShim = useCallback((phase: TourPhase) => {
    if (phase === 'complete') {
      setState((prev) => ({ ...prev, phase: 'complete' }));
    }
  }, []);

  const setWaypointShim = useCallback((index: number | undefined) => {
    setState((prev) => ({ ...prev, currentWaypointIndex: index }));
  }, []);

  return {
    state,
    start,
    reset,
    handleFlyComplete,
    setPhaseShim,
    setWaypointShim,
  };
}

/** Type alias matching useHermesTour state shape for CameraFly contract. */
export type RetroController = ReturnType<typeof useSprintRetroController>;

/**
 * Canvas-tree layer. Mounts CameraFly when phase === 'flying'. Reuses the
 * Onboarding CameraFly r3f component (battle-tested GSAP timeline).
 */
export function SprintRetroCanvasLayer({
  controller,
}: {
  controller: RetroController;
}) {
  const { state, setPhaseShim, setWaypointShim, handleFlyComplete, reset } =
    controller;
  if (state.phase !== 'flying' || !state.script) return null;
  return (
    <CameraFly
      script={state.script}
      setPhase={setPhaseShim}
      setWaypointIndex={setWaypointShim}
      onComplete={handleFlyComplete}
      onInterrupt={reset}
    />
  );
}

/**
 * DOM HUD: trigger button + Clio narration overlay during flythrough.
 */
export function SprintRetroHud({
  controller,
}: {
  controller: RetroController;
}) {
  const { state, start, reset } = controller;
  const rangeDays = useActivityStore(selectRangeDays);

  const buttonLabel = useMemo(() => {
    if (state.phase === 'idle') return `Sprint retro 60s (${rangeDays}d)`;
    if (state.phase === 'fetching') return 'Clio menulis prosa...';
    if (state.phase === 'flying') return 'Flythrough in progress';
    if (state.phase === 'complete') return 'Replay retro';
    return 'Sprint retro 60s';
  }, [state.phase, rangeDays]);

  const handleClick = useCallback(() => {
    if (state.phase === 'flying') return;
    if (state.phase === 'complete') {
      // Replay flow: reset then start.
      reset();
      // setTimeout 0 to flush state update before start.
      setTimeout(() => {
        void start();
      }, 0);
      return;
    }
    void start();
  }, [state.phase, start, reset]);

  return (
    <>
      {/* Trigger button: bottom-right corner of viewport. */}
      <button
        type="button"
        onClick={handleClick}
        disabled={state.phase === 'flying'}
        className={[
          'pointer-events-auto fixed bottom-32 right-6 z-30',
          'rounded-2xl border border-codeplex-ember/40 bg-codeplex-shadow/80 px-4 py-2.5',
          'backdrop-blur-glass shadow-2xl transition-colors duration-150',
          'font-mono text-[11px] uppercase tracking-widest text-codeplex-ember',
          'disabled:cursor-wait disabled:opacity-60',
          'hover:bg-codeplex-ember/15',
        ].join(' ')}
        aria-label="Trigger 60-second sprint retro flythrough with Clio narration"
      >
        {buttonLabel}
      </button>

      {/* Clio narration overlay during fetching + flying + complete. */}
      {(state.phase === 'fetching' ||
        state.phase === 'flying' ||
        state.phase === 'complete') && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Clio sprint retro narration"
          className={[
            'pointer-events-none fixed left-1/2 top-24 z-30 -translate-x-1/2',
            'w-[42rem] max-w-[92vw] rounded-2xl border border-white/10',
            'bg-codeplex-shadow/85 px-5 py-4 shadow-2xl backdrop-blur-glass',
          ].join(' ')}
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
            <span className="font-mono text-codeplex-ember">
              Clio Historian
            </span>
            <span className="font-mono text-white/40">
              {state.usedFallback
                ? 'Canned prose (LLM offline)'
                : 'V4-Flash non-think'}
            </span>
          </div>
          {state.phase === 'fetching' ? (
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              Clio sedang menulis prosa sprint retro berdasarkan deterministic
              source...
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-relaxed text-white/90">
              {state.narration || '...'}
            </p>
          )}
          {state.phase === 'complete' && (
            <p className="mt-3 font-mono text-[10px] text-white/45">
              Retro complete. Click button to replay or adjust window.
            </p>
          )}
        </div>
      )}
    </>
  );
}
