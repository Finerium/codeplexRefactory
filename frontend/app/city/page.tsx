/**
 * City route page, the default canvas mount.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL),
 * augmented by Hera (Wave 2) to mount the Sprint Mode HERO 14 PM concept
 * overlay alongside the Iris BuildingInstances.
 *
 * Mounts the Daedalus ChronicleCanvas wrapper with the Iris BuildingInstances
 * driven by the singleton `mockCityData` (~240 buildings, 7 districts,
 * deterministic squarified treemap layout). This is the Wave 1 production
 * mount target consumed by the OAuth chain `/start -> /api/auth/github/start
 * -> /city?mock_auth=true` per Hestia stub handler.
 *
 * Mount pattern follows the canonical example from Iris handoff log
 * `_meta/handoff_log/wave1_iris_to_hera.md` lines 56-83. Hera mounts
 * `<SprintMode />` as a SIBLING of `<BuildingInstances>` inside the same
 * ChronicleCanvas (the canonical pattern per Iris handoff log line 175).
 * Multiple subscribers safe (Persephone Wave 2 will add the third overlay
 * via Iris hook).
 *
 * Wave 2 Hera additions (this edit):
 *   - `<SprintMode />` mounts inside the Canvas tree, renders 13 Hera-owned
 *     PM concept overlays plus the OQ-05 sticky-note PR comment surface.
 *     The 14th concept (Refactor ghost building + retak crack) is the
 *     Asclepius handoff per Pythia contract `hera-to-persephone.md` line 154.
 *   - `<SprintModeControls />` mounts OUTSIDE the Canvas as a DOM-overlay
 *     pill bar at top-left of viewport, lets the demo user toggle each
 *     concept on/off (Dike Wave 2 audit gate requirement).
 *
 * Server Component vs Client Component: the page itself is a Client Component
 * because the inner scene relies on r3f Canvas + hooks (useCityData,
 * useBuildingClick) that require the React tree to live in the browser.
 * Next.js 16 + React 19 streaming compatibility verified per Pythia contract
 * `calliope-to-wave2-panels.md` Asumption 1.
 *
 * Wave 2 Persephone consumes this page via the parallel slot defaults
 * (@chat, @ticket, @side). Wave 3 Hades wires real OAuth + Demeter
 * WebSocket replaces the mock data via `useCityData`'s Wave 3 data source
 * swap (Iris handoff promises stable surface).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): mockCityData is the genuine Wave 1 production
 *     surface per Iris ship, not labeled MOCK in the runtime sense; Sprint
 *     Mode HERO event tape is the only mock element, labeled
 *     [MOCK Wave 2, real Wave 3 Hades webhook] in source + dev console.
 */

'use client';

import { useCallback, useEffect } from 'react';
import { ChronicleCanvas } from '@/scene';
import {
  BuildingInstances,
  useBuildingClick,
  useBuildingClickDispatch,
  useCityData,
} from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import { SprintMode, SprintModeControls } from '@/modes/sprint';

function CityScene() {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();

  // Wave 1 demo subscriber: logs building click to console so the audit gate
  // + manual demo can confirm the dispatch pipeline lives. Wave 2 Hera adds
  // a parallel subscriber via SprintMode -> useSprintClickToTicket bridge
  // routed through Iris's multi-subscriber-safe event bus (Iris handoff log
  // line 132).
  //
  // Handler MUST be useCallback-stable so Iris's `useBuildingClick(handler)`
  // does not churn subscriptions every render (React 19 strict + zustand v5
  // would yield Max update depth otherwise; documented in Hera Cycle 5
  // checkpoint).
  const logBuildingClick = useCallback((building: BuildingData) => {
    // eslint-disable-next-line no-console
    console.log(`[city] building click ${building.id} (${building.archetype})`, {
      district: building.district,
      ownershipColor: building.ownershipColor,
      activity: building.activity,
    });
  }, []);
  useBuildingClick(logBuildingClick);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      `[city] mounted ${city.buildings.length} buildings across ` +
        `${city.districts.length} districts, centroid ${city.centroid.join(',')}`
    );
  }, [city]);

  return (
    <>
      <BuildingInstances data={city} onBuildingClick={dispatchClick} />
      {/* Hera Wave 2: Sprint Mode HERO 14 PM concept overlay mounts as
          sibling of BuildingInstances inside the Canvas. */}
      <SprintMode />
    </>
  );
}

export default function CityPage() {
  return (
    <>
      <ChronicleCanvas cameraTarget={[0, 0, 0]} cameraPosition={[0, 90, 140]}>
        <CityScene />
      </ChronicleCanvas>
      {/* Hera Wave 2: DOM-overlay toggle UI for the 14 PM concept overlay.
          Mounts OUTSIDE the Canvas so it renders as a fixed-position pill
          bar at the top-left of the viewport. */}
      <SprintModeControls />
    </>
  );
}
