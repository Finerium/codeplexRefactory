'use client';

/**
 * SprintMode composite (Hera Wave 2 root).
 *
 * Mounts ALL 14 PM concept overlays as children of `<ChronicleCanvas>` SIBLING
 * to Iris's `<BuildingInstances>`. Per-building overlay components are gated
 * on:
 *   1. Concept-level visibility from `useConceptVisibility()` (toggle UI)
 *   2. Per-building visual flags computed by `computeVisualFlags()` in
 *      `stateMachine.ts`
 *
 * Composition order (front-to-back):
 *   - DistrictBorder (per district, ground level, always visible)
 *   - Ground-anchored overlays: YellowTape (base), BlueprintPin (floating above)
 *   - Building-attached overlays: Scaffolding, Crane, InspectorNPC,
 *     GreenHaloGlow, SmokeRetakOverlay
 *   - Edge-level overlay: RedBridge between dependent buildings
 *   - HUD-style overlays: SizeBadge, CityHallBanner (Athena only), DoDChecklist
 *     (selected only), PRCommentSurface (per building with comments)
 *
 * Concept 14b (Refactor stage ghost building + retak pattern) is the
 * Asclepius handoff per Pythia contract `hera-to-persephone.md` line 154.
 * Hera publishes the `refactorStage` field via heraStore but does NOT mount
 * the ghost geometry; Asclepius Wave 2 RefactorMode + HealthMode overlays
 * subscribe to the store and render ghost meshes from their own modes.
 *
 * Performance budget per `_meta/decision_log/hera.md` D-Hera-04: total
 * draw call estimate ~25-35 Hera-side + 8 Iris baseline + post + env + Sparkles =
 * ~45-55 total. Budget < 200. Safe.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 4 (no concept remap): PRD Section 9.2 canonical mapping preserved
 *   - Lock 5 (honest claim): no mock label; mock events isolated to
 *     `__mock__/sprint_mock_events.ts` + dev-mode console label
 *
 * Anchor:
 *   - Iris handoff log line 175: SprintOverlay mounts as child of ChronicleCanvas
 *   - Pythia contract `iris-to-hera.md` Asumption 4: multiple subscribers safe
 */

import { useMemo } from 'react';
import { useCityData } from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings/types';
import { useHeraStore } from './heraStore';
import { useBuildingEvents } from './useBuildingEvents';
import { useSprintClickToTicket } from './clickHandlers';
import { computeVisualFlags } from './stateMachine';
import { Scaffolding } from './Scaffolding';
import { Crane } from './Crane';
import { BlueprintPin } from './BlueprintPin';
import { InspectorNPC } from './InspectorNPC';
import { GreenHaloGlow } from './GreenHaloGlow';
import { YellowTape } from './YellowTape';
import { SmokeRetakOverlay } from './SmokeRetakOverlay';
import { SizeBadge } from './SizeBadge';
import { CityHallBanner } from './CityHallBanner';
import { DistrictBorder } from './DistrictBorder';
import { DoDChecklist } from './DoDChecklist';
import { RedBridge } from './RedBridge';
import { PRCommentSurface } from './PRCommentSurface';
import { BacklogOffice } from './BacklogOffice';

/**
 * Per-building overlay group. Renders only the concepts active per the
 * building context, gated by the concept visibility map. Receives
 * pre-computed visual flags so it does not pay the recompute cost.
 */
function BuildingOverlays({ building }: { building: BuildingData }) {
  const context = useHeraStore((s) => s.contexts[building.id]);
  const selectedId = useHeraStore((s) => s.selectedBuildingId);
  const conceptVisibility = useHeraStore((s) => s.conceptVisibility);

  const isSelected = selectedId === building.id;
  const isAthenaLandmark = building.landmark === 'athena';

  const flags = useMemo(() => {
    if (!context) {
      return null;
    }
    return computeVisualFlags(context, isAthenaLandmark, isSelected);
  }, [context, isAthenaLandmark, isSelected]);

  if (!context || !flags) return null;

  return (
    <>
      <Scaffolding
        building={building}
        active={conceptVisibility.scaffolding && flags.hasScaffolding}
      />
      <Crane
        building={building}
        active={conceptVisibility.crane && flags.hasCrane}
      />
      <BlueprintPin
        building={building}
        active={conceptVisibility['blueprint-pin'] && flags.hasBlueprintPin}
      />
      <InspectorNPC
        building={building}
        active={conceptVisibility['inspector-npc'] && flags.hasInspectorNPC}
      />
      <GreenHaloGlow
        building={building}
        active={conceptVisibility['green-halo'] && flags.hasGreenHalo}
        opacity={flags.haloOpacity}
      />
      <YellowTape
        building={building}
        active={conceptVisibility['yellow-tape'] && flags.hasYellowTape}
      />
      <SmokeRetakOverlay
        building={building}
        active={conceptVisibility['smoke-retak'] && flags.hasSmokeRetak}
        intensity={flags.smokeIntensity}
      />
      <SizeBadge
        building={building}
        active={conceptVisibility['size-badge'] && flags.hasSizeBadge}
        size={context.storyPoints}
      />
      <CityHallBanner
        building={building}
        active={conceptVisibility['city-hall-banner'] && flags.hasCityHallBanner}
        milestone={context.milestone}
      />
      <DoDChecklist
        building={building}
        active={conceptVisibility['dod-checklist'] && flags.hasDoDChecklist}
        items={context.dodChecklist}
      />
      <PRCommentSurface
        building={building}
        active={conceptVisibility['pr-comment'] && flags.hasPRComment}
        unreadCount={flags.unreadCommentCount}
        isAthenaLandmark={isAthenaLandmark}
      />
      {/* RedBridge: rendered separately at SprintMode root (edge-level) */}
      {/* PRD Section 9.2 concept 14 ghost building + retak crack pattern */}
      {/* are handed off to Asclepius Wave 2 RefactorMode + HealthMode. */}
      {/* Hera publishes refactorStage via heraStore for Asclepius to read. */}
    </>
  );
}

/**
 * Render RedBridge edges across all building dependencies.
 */
function DependencyBridges({ buildingMap }: { buildingMap: Map<string, BuildingData> }) {
  const contexts = useHeraStore((s) => s.contexts);
  const visible = useHeraStore((s) => s.conceptVisibility['red-bridge']);

  if (!visible) return null;

  const edges: { source: BuildingData; target: BuildingData; key: string }[] = [];
  for (const [sourceId, ctx] of Object.entries(contexts)) {
    const source = buildingMap.get(sourceId);
    if (!source) continue;
    for (const targetId of ctx.dependencies) {
      const target = buildingMap.get(targetId);
      if (!target) continue;
      edges.push({ source, target, key: `${sourceId}::${targetId}` });
    }
  }

  return (
    <>
      {edges.map((e) => (
        <RedBridge
          key={e.key}
          sourceBuilding={e.source}
          targetBuilding={e.target}
          active={true}
        />
      ))}
    </>
  );
}

/**
 * District borders for all districts.
 */
function DistrictBorders() {
  const city = useCityData();
  const contexts = useHeraStore((s) => s.contexts);
  const visible = useHeraStore((s) => s.conceptVisibility['district-border']);

  if (!visible) return null;

  // Cache: which districts have at least one active sprint building
  const activeDistricts = new Set<string>();
  for (const ctx of Object.values(contexts)) {
    if (
      ctx.sprintStatus === 'frame' ||
      ctx.sprintStatus === 'painting' ||
      ctx.sprintStatus === 'finished'
    ) {
      const b = city.buildings.find((bb) => bb.id === ctx.buildingId);
      if (b) activeDistricts.add(b.district);
    }
  }

  return (
    <>
      {city.districts.map((d) => (
        <DistrictBorder
          key={d.id}
          district={d}
          active={true}
          hasActiveSprint={activeDistricts.has(d.id)}
        />
      ))}
    </>
  );
}

/**
 * SprintMode composite root. Mounts inside `<ChronicleCanvas>` SIBLING to
 * `<BuildingInstances>`. Wires the mock event tape, click-to-ticket bridge,
 * and renders all per-building overlays.
 */
export function SprintMode() {
  // Wire side-effect hooks (event tape + click routing).
  useBuildingEvents();
  useSprintClickToTicket();

  const city = useCityData();
  const contexts = useHeraStore((s) => s.contexts);

  // Index buildings by id for RedBridge lookup.
  const buildingMap = useMemo(() => {
    const m = new Map<string, BuildingData>();
    for (const b of city.buildings) m.set(b.id, b);
    return m;
  }, [city.buildings]);

  // Only render overlays for buildings with a sprint context (avoids walking
  // 240 buildings every frame when the demo tape touches 4).
  const overlaidBuildings = useMemo(
    () =>
      Object.keys(contexts)
        .map((id) => buildingMap.get(id))
        .filter((b): b is BuildingData => b !== undefined),
    [contexts, buildingMap]
  );

  return (
    <group name="hera-sprint-mode">
      {/* District borders (lightweight ground-level overlay) */}
      <DistrictBorders />

      {/* Per-building overlay stacks */}
      {overlaidBuildings.map((b) => (
        <BuildingOverlays key={b.id} building={b} />
      ))}

      {/* Edge-level bridges */}
      <DependencyBridges buildingMap={buildingMap} />

      {/* Backlog Office virtual building (NOT file-based) per PRD Section 9.2
          lines 520-525. Hera Wave-Fixing #2 cycle 1 ship: replaces Asclepius
          IssueFlyingPacket fallback target (was Athena City Hall) with the
          canonical PRD destination. Always mounted while SprintMode is active. */}
      <BacklogOffice active={true} />
    </group>
  );
}
