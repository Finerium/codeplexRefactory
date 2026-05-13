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
 *
 * Manager FINAL Cycle 2 (STAMP 20260513-0857): optional `floorIndex` arg
 * added so Persephone side panel can deep-link to the clicked floor's
 * commit row. Resolved by BuildingInstances from the click world-space y.
 */
export type BuildingClickHandler = (
  building: BuildingData,
  event: ThreeEvent<MouseEvent>,
  floorIndex?: number,
) => void;

/**
 * Internal click event bus. Module-level state so subscribers persist
 * across re-renders + Wave 1 singleton lookup is O(1). Wave 3 will move to
 * a context provider so multiple Canvas instances do not collide.
 */
const clickSubscribers = new Set<BuildingClickHandler>();

/**
 * Wave-Fixing 3 (Persephone + Hera paired): hover event bus, twin of
 * `clickSubscribers`. Fanout-safe, fires `null` when the hovered building
 * changes back to none. Drives `HoverFloorGlow` ripple effect.
 */
export type BuildingHoverHandler = (building: BuildingData | null) => void;
const hoverSubscribers = new Set<BuildingHoverHandler>();

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
  event: ThreeEvent<MouseEvent>,
  floorIndex?: number,
): void {
  for (const handler of clickSubscribers) {
    try {
      handler(building, event, floorIndex);
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
  return useCallback((building, event, floorIndex) => {
    dispatchClick(building, event, floorIndex);
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
 * Wave-Fixing 3 hover bus dispatcher hook. Returns a stable function that
 * BuildingInstances forwards via onPointerOver / onPointerOut handlers.
 */
export function useBuildingHoverDispatch(): BuildingHoverHandler {
  return useCallback((building) => {
    for (const handler of hoverSubscribers) {
      try {
        handler(building);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('useBuildingHover subscriber threw:', error);
      }
    }
  }, []);
}

/**
 * Public consumer hook: subscribe to hover building changes. Fires with the
 * BuildingData on hover-in, null on hover-out, same building on no-change.
 */
export function useBuildingHover(handler: BuildingHoverHandler): void {
  useEffect(() => {
    hoverSubscribers.add(handler);
    return () => {
      hoverSubscribers.delete(handler);
    };
  }, [handler]);
}

/**
 * Manager FINAL Cycle 2 (Persephone Cluster C, STAMP 20260513-0857):
 * Floor focus event bus. Twin of click + hover bus. Persephone
 * `PerFloorTimeline` dispatches a `flyToFloor(buildingId, floorIndex)`
 * event when the user clicks a commit entry in the side panel. Iris
 * subscribes via `useFloorFocus(handler)` to tween the camera to that
 * floor altitude (per Manager directive D-MF2-05 line 65). The hover
 * version (`floor-hover` bus) is consumed by the per-floor shader to
 * brighten only the hovered floor segment.
 *
 * Cluster C+G coordination: Persephone owns the dispatcher; Iris owns
 * the camera + shader subscriber. Decoupled so this ships even if Iris
 * camera tween lands in a later cycle.
 */
export interface FloorFocusEvent {
  buildingId: string;
  floorIndex: number;
}

export type FloorFocusHandler = (event: FloorFocusEvent | null) => void;
const floorFocusSubscribers = new Set<FloorFocusHandler>();
const floorHoverSubscribers = new Set<FloorFocusHandler>();

function dispatchFloorFocus(event: FloorFocusEvent | null): void {
  for (const handler of floorFocusSubscribers) {
    try {
      handler(event);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('useFloorFocus subscriber threw:', error);
    }
  }
}

function dispatchFloorHover(event: FloorFocusEvent | null): void {
  for (const handler of floorHoverSubscribers) {
    try {
      handler(event);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('useFloorHover subscriber threw:', error);
    }
  }
}

/**
 * Stable dispatcher for floor focus (click + camera tween).
 * Use from Persephone PerFloorTimeline.
 */
export function useFloorFocusDispatch(): FloorFocusHandler {
  return useCallback((event) => {
    dispatchFloorFocus(event);
  }, []);
}

/**
 * Stable dispatcher for floor hover (per-floor shader glow brightening).
 */
export function useFloorHoverDispatch(): FloorFocusHandler {
  return useCallback((event) => {
    dispatchFloorHover(event);
  }, []);
}

/**
 * Public consumer hook for Iris: subscribe to floor focus (click) events.
 * Iris uses this to tween camera to floor altitude.
 */
export function useFloorFocus(handler: FloorFocusHandler): void {
  useEffect(() => {
    floorFocusSubscribers.add(handler);
    return () => {
      floorFocusSubscribers.delete(handler);
    };
  }, [handler]);
}

/**
 * Public consumer hook for Iris: subscribe to floor hover events
 * (per-floor shader brighten on hover-in, null on hover-out).
 */
export function useFloorHover(handler: FloorFocusHandler): void {
  useEffect(() => {
    floorHoverSubscribers.add(handler);
    return () => {
      floorHoverSubscribers.delete(handler);
    };
  }, [handler]);
}

/**
 * Manager FINAL Cycle 4 TRULY FINAL (Cluster 4 Iris, STAMP 20260513-1015):
 * Demo-variant slice. /city render now reads `?demo=<key>` URL param + picks
 * a building subset so 3 demo URLs read visually distinct per Ghaisan QA
 * directive "banyaknya gedung = banyaknya file". Architecturally true: Wave 1
 * mockCityData is a singleton; Wave 3 Demeter swap is post-hackathon. This
 * surgical fix keeps the hook surface stable (no API change for Hera + Boreas
 * + Persephone consumers) while letting `?demo=nodegoat` / `?demo=pygoat`
 * trim the 245-building default to 120 / 80 respectively.
 *
 * Compliance:
 *  - Lock 4 [INFERRED slice strategy]: documented inline. Slicing the head of
 *    the buildings array preserves treemap district adjacency for the kept
 *    leaves (squarifyTreemap emits buildings in DFS order, so the first N are
 *    contiguous across the first few districts).
 *  - Districts with zero remaining buildings are filtered so TreeScatter +
 *    RoadGrid + district-border overlays do not render empty boxes.
 *  - Centroid recomputed inline from sliced buildings so CameraFocus +
 *    OrbitControls target frames the smaller city instead of the full extent.
 *  - Default `?demo=fastapi-template` + no-param + `?repo=...` all preserve
 *    the 245-building full city (Aether snapshot graceful degradation path
 *    already lives in the page-level loader and is not touched here).
 */

const DEMO_BUILDING_COUNTS: Record<string, number> = {
  // fastapi-template: undefined sentinel = full city (default branch)
  nodegoat: 120,
  pygoat: 80,
};

function readDemoKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('demo');
  } catch {
    return null;
  }
}

function recomputeCentroid(
  buildings: BuildingData[],
): [number, number, number] {
  if (buildings.length === 0) return [0, 0, 0];
  let sumX = 0;
  let sumZ = 0;
  for (const b of buildings) {
    sumX += b.position[0];
    sumZ += b.position[2];
  }
  return [sumX / buildings.length, 0, sumZ / buildings.length];
}

function deriveDemoCity(): CityData {
  const demoKey = readDemoKey();
  if (!demoKey || !(demoKey in DEMO_BUILDING_COUNTS)) return mockCityData;
  const count = DEMO_BUILDING_COUNTS[demoKey];
  if (typeof count !== 'number' || count >= mockCityData.buildings.length) {
    return mockCityData;
  }
  const buildings = mockCityData.buildings.slice(0, count);
  const keptDistrictIds = new Set(buildings.map((b) => b.district));
  const districts = mockCityData.districts.filter((d) =>
    keptDistrictIds.has(d.id),
  );
  const centroid = recomputeCentroid(buildings);
  return { buildings, districts, centroid };
}

/**
 * City data hook. Wave 1: returns the mock singleton (optionally sliced by
 * `?demo=` URL param per Manager FINAL Cycle 4), memoized. Wave 3: replace
 * with WebSocket stream. Hook surface identical, consumers unchanged.
 *
 * State pattern: useState seeded with derived city so the value is stable
 * across renders + future Wave 3 update path can call setCity(...) without
 * changing the hook shape. useMemo wrap is intentional, the returned object
 * reference stays stable until the underlying mock data changes (which is
 * never, in Wave 1, by design).
 */
export function useCityData(): CityData {
  const [city] = useState<CityData>(() => deriveDemoCity());
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
