'use client';

/**
 * ActivityMode: composite root exposing Canvas + HUD layers for Activity Mode.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D3.
 *
 * Two-layer composition (mirrors OnboardingMode pattern):
 *   - `<ActivityCanvasLayer />`: r3f children, mount INSIDE ChronicleCanvas
 *     -> HotspotGlow + OwnershipHeatmap + TimelineMarkers.
 *   - `<ActivityHud />`: DOM HUD, mount OUTSIDE Canvas
 *     -> TimelineScrubber.
 *
 * State: shared Zustand store at `./store.ts` (selectors prevent re-render
 * storm during scrubber drag, per D5).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: mock data labeled MOCK in
 *   mockActivityData.ts.
 */

import { HotspotGlow } from './HotspotGlow';
import { OwnershipHeatmap } from './OwnershipHeatmap';
import { TimelineMarkers } from './TimelineMarkers';
import { TimelineScrubber } from './TimelineScrubber';

/**
 * Canvas-tree layer. Mount as child of `<ChronicleCanvas>`.
 */
export function ActivityCanvasLayer() {
  return (
    <group name="boreas-activity-canvas-layer">
      <OwnershipHeatmap />
      <HotspotGlow />
      <TimelineMarkers />
    </group>
  );
}

/**
 * DOM HUD layer. Mount as sibling of `<ChronicleCanvas>`.
 */
export function ActivityHud() {
  return <TimelineScrubber />;
}

/**
 * Convenience composite. Returns a Fragment with both layers; parent decides
 * where each lives in the tree.
 *
 * NOTE: ActivityCanvasLayer must live INSIDE <ChronicleCanvas>; ActivityHud
 * must live OUTSIDE. Direct use of this composite is for tests + smoke
 * pages only.
 */
export function ActivityMode() {
  return (
    <>
      <ActivityCanvasLayer />
      <ActivityHud />
    </>
  );
}
