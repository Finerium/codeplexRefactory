'use client';

/**
 * useBuildingEvents: WebSocket-event consume hook for Sprint Mode HERO.
 *
 * Wave 2 stub (this file): drives heraStore.applyEvent via the synthetic
 * `__mock__/sprint_mock_events.ts` tape. Loops every 90 seconds for
 * pitch rehearsal replay-ability.
 *
 * Wave 3 swap (Hades): replace `runMockTape` with a real WebSocket subscriber
 * at `/api/ws/building-events` per Pythia contract `hera-to-hades.md` lines
 * 22-180. The hook surface (return type) stays identical so consumers do not
 * need to change.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): file labels [MOCK Wave 2] + every event log
 *     during dev mode is prefixed `[hera/mock]` so demos cannot mistake the
 *     stub for real webhook data.
 */

import { useEffect, useMemo, useState } from 'react';
import { useCityData } from '@/scene/buildings';
import { useHeraStore } from './heraStore';
import {
  buildMockTape,
  MOCK_TAPE_DURATION_MS,
} from './__mock__/sprint_mock_events';
import type { BuildingEventsStatus } from './types';

/**
 * Resolution: pin demo tape to 4 specific buildings. Strategy:
 * 1. Athena landmark (City Hall) -> A (so City Hall banner reads milestone)
 * 2. Apollo landmark (Hospital) -> B (so blocked + CI fail demo has variety)
 * 3. Argus landmark (Police Station) -> C
 * 4. Clio landmark (Library) -> D
 *
 * If any landmark slot is missing in mock data (defensive), fall back to the
 * first 4 buildings in the city array. Iris Wave 1 mockCityData pins all 5
 * landmarks; this fallback is purely defensive against future Demeter swap.
 */
function pickDemoBuildings(buildingsList: { id: string; landmark?: string | null }[]): [string, string, string, string] {
  const byLandmark = (slot: string) =>
    buildingsList.find((b) => b.landmark === slot)?.id;

  const athena = byLandmark('athena') ?? buildingsList[0]?.id ?? '';
  const apollo = byLandmark('apollo') ?? buildingsList[1]?.id ?? '';
  const argus = byLandmark('argus') ?? buildingsList[2]?.id ?? '';
  const clio = byLandmark('clio') ?? buildingsList[3]?.id ?? '';

  return [athena, apollo, argus, clio];
}

/**
 * Hook return shape. Stable Wave 2 -> Wave 3 surface; consumer components
 * do not need to know which source backs the events.
 */
export interface UseBuildingEventsResult {
  /** Connection / playback status. Wave 2 = 'connected' once tape starts. */
  status: BuildingEventsStatus;
  /** Total events dispatched since hook mount (Wave 2: cumulative tape progress). */
  eventCount: number;
  /** Wave 2 only: tape ID label, useful for [MOCK] dev banner display. */
  source: 'mock-tape' | 'live-websocket';
}

/**
 * Consume hook. Mount once at SprintMode composite root. Returns connection
 * status for optional dev-mode banner; the heavy lifting is the side-effect
 * of dispatching events into heraStore (consumers subscribe via the store).
 */
export function useBuildingEvents(): UseBuildingEventsResult {
  const city = useCityData();
  const applyEvent = useHeraStore((s) => s.applyEvent);
  const setMockTapeRunning = useHeraStore((s) => s.setMockTapeRunning);
  const [status, setStatus] = useState<BuildingEventsStatus>('connecting');
  const [eventCount, setEventCount] = useState(0);

  const demoIds = useMemo<[string, string, string, string]>(
    () => pickDemoBuildings(city.buildings),
    [city.buildings]
  );

  useEffect(() => {
    // Defensive: bail if city has no buildings.
    if (demoIds.some((id) => id === '')) {
      setStatus('offline');
      return;
    }

    setMockTapeRunning(true);
    setStatus('connected');

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function scheduleTape() {
      if (cancelled) return;
      const tapeStartMs = Date.now();
      const tape = buildMockTape(demoIds, tapeStartMs);
      for (const entry of tape) {
        const t = setTimeout(() => {
          if (cancelled) return;
          applyEvent(entry.event);
          setEventCount((prev) => prev + 1);
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log(
              `[hera/mock] dispatched ${entry.event.type} on building ${entry.event.buildingId} at t=${entry.delayMs}ms`
            );
          }
        }, entry.delayMs);
        timers.push(t);
      }
      // Loop the tape every 90 seconds for rehearsal replay-ability.
      const loopTimer = setTimeout(() => {
        if (!cancelled) scheduleTape();
      }, MOCK_TAPE_DURATION_MS);
      timers.push(loopTimer);
    }

    scheduleTape();

    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
      setMockTapeRunning(false);
    };
  }, [demoIds, applyEvent, setMockTapeRunning]);

  return {
    status,
    eventCount,
    source: 'mock-tape',
  };
}
