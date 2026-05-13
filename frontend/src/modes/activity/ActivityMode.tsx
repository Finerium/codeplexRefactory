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
import { BuildingHeightTimeMachine } from './BuildingHeightTimeMachine';
import { TimeMachineHud } from './TimeMachineOrchestrator';
import { ScrubberTestInjector } from './__dev__/ScrubberTestInjector';

interface ActivityCanvasLayerProps {
  /** Optional active repo slug for Git Time Machine height tween. */
  repoFullName?: string | null;
}

/**
 * Canvas-tree layer. Mount as child of `<ChronicleCanvas>`.
 *
 * Manager FINAL Cycle 2 (STAMP 20260513-0857): added BuildingHeightTimeMachine
 * for the Cluster B "drag scrubber -> building heights shrink/grow"
 * pipeline. Layer is inert when no repo is selected so the non-Time-
 * Machine Activity visuals (hotspot glow + ownership heatmap + markers)
 * remain stable.
 */
export function ActivityCanvasLayer({ repoFullName }: ActivityCanvasLayerProps = {}) {
  return (
    <group name="boreas-activity-canvas-layer">
      <OwnershipHeatmap />
      <HotspotGlow />
      <TimelineMarkers />
      <BuildingHeightTimeMachine repoFullName={repoFullName ?? null} />
    </group>
  );
}

interface ActivityHudProps {
  /** Optional active repo slug for Git Time Machine commit tooltip. */
  repoFullName?: string | null;
}

/**
 * DOM HUD layer. Mount as sibling of `<ChronicleCanvas>`.
 *
 * Manager FINAL Cycle 2: added TimeMachineHud floating commit tooltip
 * that fires per scrubber drag tick. Renders a graceful "select a repo"
 * hint when no slug is provided.
 */
export function ActivityHud({ repoFullName }: ActivityHudProps = {}) {
  return (
    <>
      <TimelineScrubber />
      <TimeMachineHud repoFullName={repoFullName ?? null} />
      <ScrubberTestInjector />
    </>
  );
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
