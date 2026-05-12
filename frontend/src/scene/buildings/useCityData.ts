'use client';

/**
 * City data hook + click event bus.
 *
 * Wave 1 mock implementation: useCityData() returns the singleton city data
 * computed once from `mockCityData.ts`, memoized so the reference is stable
 * across renders. useBuildingById(id) provides O(1) lookup. useBuildingClick
 * registers a handler in the click event bus, which BuildingInstances calls
 * via prop forwarding.
 *
 * Wave 3 will replace the singleton with a WebSocket subscription via
 * Demeter event-store: same hook surface, new data source. Hera Wave 2
 * never needs to know which mode is active because the schema is stable.
 *
 * Click event bus rationale: BuildingInstances is the single click source
 * (raw `<instancedMesh>` event), but multiple Wave 2 workers (Hera ticket
 * panel + Persephone side panel + Boreas tour) may want to react. A fanout
 * bus lets all subscribers receive the event without coupling.
 *
 * Compliance:
 *  - Lock 4 ([INFERRED] singleton vs context choice): documented in
 *    `_meta/decisions/iris_hook_topology.md`. Singleton mock is sufficient
 *    for Wave 1; Wave 3 switches to React context provider mounted at the
 *    Canvas root so SSR works clean.
 *  - Lock 5 ([MOCK]: mockCityData) labeled at source.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { BuildingData, CityData } from './types';
import { mockCityData } from './mockCityData';

/**
 * Click event handler signature. Re-exported from BuildingInstances at the
 * scene/buildings barrel for consumer convenience.
 */
export type BuildingClickHandler = (
  building: BuildingData,
  event: ThreeEvent<MouseEvent>
) => void;

/**
 * Internal click event bus. Module-level state so subscribers persist
 * across re-renders + Wave 1 singleton lookup is O(1). Wave 3 will move to
 * a context provider so multiple Canvas instances do not collide.
 */
const clickSubscribers = new Set<BuildingClickHandler>();

/**
 * Dispatch a click event to all current subscribers. Called from
 * BuildingInstances via the onBuildingClick prop, which the city scene
 * forwards from useBuildingClickDispatch().
 *
 * Failure isolation: if one subscriber throws, the rest still receive the
 * event. Wave 2 worker can break itself without breaking Hera + Persephone.
 */
function dispatchClick(
  building: BuildingData,
  event: ThreeEvent<MouseEvent>
): void {
  for (const handler of clickSubscribers) {
    try {
      handler(building, event);
    } catch (error) {
      // Subscriber error isolated, log for dev debugging only
      // eslint-disable-next-line no-console
      console.error('useBuildingClick subscriber threw:', error);
    }
  }
}

/**
 * Hook for the city scene component to obtain the dispatcher. Returned
 * function is stable across renders (Hera depends on stable identity).
 * Pass this into BuildingInstances `onBuildingClick` prop.
 */
export function useBuildingClickDispatch(): BuildingClickHandler {
  return useCallback((building, event) => {
    dispatchClick(building, event);
  }, []);
}

/**
 * Public consumer hook: subscribe to building clicks. Returns nothing; the
 * subscription is auto-cleaned on unmount. Wave 2 worker Hera + Persephone
 * + Boreas mount their handlers via this hook.
 *
 * Discipline: subscribers receive every click; if they only care about one
 * archetype or one district, they filter in the handler. Iris does not
 * pre-filter because each subscriber has different needs.
 */
export function useBuildingClick(handler: BuildingClickHandler): void {
  useEffect(() => {
    clickSubscribers.add(handler);
    return () => {
      clickSubscribers.delete(handler);
    };
  }, [handler]);
}

/**
 * City data hook. Wave 1: returns the mock singleton, memoized. Wave 3:
 * replace with WebSocket stream. Hook surface identical, consumers unchanged.
 *
 * State pattern: useState seeded with mockCityData so the value is stable
 * across renders + future Wave 3 update path can call setCity(...) without
 * changing the hook shape. useMemo wrap is intentional, the returned object
 * reference stays stable until the underlying mock data changes (which is
 * never, in Wave 1, by design).
 */
export function useCityData(): CityData {
  const [city] = useState<CityData>(() => mockCityData);
  return useMemo(() => city, [city]);
}

/**
 * Lookup hook. Returns the BuildingData for a given id, or undefined if not
 * found. Index built once from useCityData + cached by id so each lookup is
 * O(1) without re-scanning the building array.
 */
export function useBuildingById(id: string): BuildingData | undefined {
  const city = useCityData();
  const index = useMemo(() => {
    const map = new Map<string, BuildingData>();
    for (const b of city.buildings) map.set(b.id, b);
    return map;
  }, [city]);
  return index.get(id);
}
