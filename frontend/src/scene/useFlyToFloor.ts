'use client';

/**
 * useFlyToFloor: camera fly-to-floor altitude helper hook.
 *
 * Manager FINAL Cycle 2 (STAMP 20260513-0857): per-floor commit timeline
 * side panel (Persephone Cluster C+G) needs to click a row in the timeline
 * and have the camera tween to that floor's altitude on the selected
 * building. This hook exposes `flyToFloor(buildingId, floorIndex)` which
 * uses the existing CameraFocus tween machinery extended with a y offset
 * computed from BuildingData.floors + height.
 *
 * Coordination:
 *   - Persephone calls `flyToFloor(buildingId, floorIndex)` from the side
 *     panel timeline row click handler.
 *   - This hook updates a zustand-style module store with the latest
 *     floor request and the consuming `FloorFocusBridge` mounted inside
 *     the ChronicleCanvas runs a GSAP tween on camera + OrbitControls
 *     target to the floor altitude.
 *
 * Why not extend CameraFocus directly: CameraFocus owns the building-level
 * tween which is driven by `selectedBuildingId` state in panelStore.
 * Per-floor target is layered on top of that base focus, so we keep the two
 * concerns decoupled (the building-level focus picks the building, the
 * floor-level focus picks the y altitude within it).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5: real client-side hook, no mock label.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  useBuildingById,
  useFloorFocus,
  type FloorFocusEvent,
} from './buildings/useCityData';

/**
 * Module-scope floor focus request. Set by `flyToFloor(buildingId, floor)`
 * and consumed by the mounted FloorFocusBridge inside Canvas. We use a
 * module-scope ref + subscriber set so the hook can be called from any
 * component outside the Canvas tree (Persephone side panel) without prop
 * drilling through panelStore.
 */
interface FloorFocusRequest {
  buildingId: string;
  floorIndex: number;
  /** Monotonic counter so repeat clicks on the same floor still trigger. */
  nonce: number;
}

let latestRequest: FloorFocusRequest | null = null;
let nonceCounter = 0;
const subscribers = new Set<(req: FloorFocusRequest) => void>();

/**
 * Imperative API: request the camera tween to a specific floor altitude on
 * a specific building. Returns immediately; the actual tween fires inside
 * FloorFocusBridge mounted inside the Canvas.
 *
 * If `floorIndex` is -1 the bridge interprets as "release floor focus, fall
 * back to whole-building framing" (handled by CameraFocus).
 */
export function flyToFloor(buildingId: string, floorIndex: number): void {
  nonceCounter += 1;
  const req: FloorFocusRequest = {
    buildingId,
    floorIndex,
    nonce: nonceCounter,
  };
  latestRequest = req;
  for (const sub of subscribers) {
    try {
      sub(req);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('flyToFloor subscriber threw:', error);
    }
  }
}

/**
 * Hook variant for consumers that prefer the hook idiom. Returns the
 * imperative function; identity stable across renders.
 */
export function useFlyToFloor(): (
  buildingId: string,
  floorIndex: number,
) => void {
  return flyToFloor;
}

/**
 * Internal subscription helper for FloorFocusBridge.
 */
function subscribeFloorFocus(
  handler: (req: FloorFocusRequest) => void,
): () => void {
  subscribers.add(handler);
  if (latestRequest) {
    // Replay the latest request on subscribe so a delayed mount still
    // catches the most recent fly-to-floor request.
    try {
      handler(latestRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('flyToFloor replay handler threw:', error);
    }
  }
  return () => {
    subscribers.delete(handler);
  };
}

/**
 * FloorFocusBridge: r3f-side component that listens to floor focus requests
 * and runs the camera + OrbitControls tween. Mount as a CHILD of
 * `<ChronicleCanvas>`, sibling of `<BuildingInstances>` + `<CameraFocus>`.
 *
 * Behavior:
 *   - On request received, look up the building, compute the target y =
 *     building.position[1] + floorIndex * (height/floors) + floorHeight/2.
 *   - Tween camera + target to a 3/4-front offset of that floor center via
 *     GSAP `power2.inOut` 600ms.
 *   - If floorIndex is -1, do nothing (CameraFocus handles building-level
 *     framing on selectedBuildingId clear).
 */
export function FloorFocusBridge() {
  const { camera, controls } = useThree();
  // Track the active request as React state so building lookup re-renders when
  // a new floor focus arrives. Module-scope `latestRequest` is the source of
  // truth for the tween destination at fire time, but we need the state to
  // drive useBuildingById's reactive lookup.
  const [active, setActive] = useState<FloorFocusEvent | null>(null);
  const lastNonceRef = useRef<number>(-1);
  const building = useBuildingById(active?.buildingId ?? '');

  // Mirror Persephone's floor focus bus into the module-scope flyToFloor
  // request so consumers of either API path produce the same camera tween.
  const handleBusEvent = useCallback((event: FloorFocusEvent | null) => {
    if (!event) return;
    flyToFloor(event.buildingId, event.floorIndex);
  }, []);
  useFloorFocus(handleBusEvent);

  useEffect(() => {
    return subscribeFloorFocus((req) => {
      if (req.nonce === lastNonceRef.current) return;
      lastNonceRef.current = req.nonce;
      setActive({ buildingId: req.buildingId, floorIndex: req.floorIndex });
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    if (!building) return;
    if (active.buildingId !== building.id) return;
    if (active.floorIndex < 0) return;

    const orbit = (controls as OrbitControlsImpl) ?? null;
    if (!orbit) return;
    if (orbit.enabled === false) return;

    const floors = Math.max(1, building.floors);
    const floorHeight = building.height / floors;
    const clampedFloor = Math.max(
      0,
      Math.min(floors - 1, active.floorIndex),
    );
    const targetY =
      building.position[1] + clampedFloor * floorHeight + floorHeight * 0.5;
    const targetX = building.position[0];
    const targetZ = building.position[2];

    const distance = 22;
    const elevationOffset = 6;

    const posTween = gsap.to(camera.position, {
      x: targetX + distance,
      y: targetY + elevationOffset,
      z: targetZ + distance,
      duration: 0.7,
      ease: 'power2.inOut',
    });

    const targetTween = gsap.to(orbit.target, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 0.7,
      ease: 'power2.inOut',
      onUpdate: () => {
        orbit.update();
      },
    });

    return () => {
      posTween.kill();
      targetTween.kill();
    };
  }, [active, building, camera, controls]);

  return null;
}

FloorFocusBridge.displayName = 'FloorFocusBridge';
