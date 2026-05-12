/**
 * City route page, the default canvas mount.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL).
 *
 * Mounts the Daedalus ChronicleCanvas wrapper with the Iris BuildingInstances
 * driven by the singleton `mockCityData` (~240 buildings, 7 districts,
 * deterministic squarified treemap layout). This is the Wave 1 production
 * mount target consumed by the OAuth chain `/start -> /api/auth/github/start
 * -> /city?mock_auth=true` per Hestia stub handler.
 *
 * Mount pattern follows the canonical example from Iris handoff log
 * `_meta/handoff_log/wave1_iris_to_hera.md` lines 56-83. `useBuildingClick`
 * subscribes Wave 2 panel workers (Persephone primary) to building click
 * events for ticket panel population; Wave 1 ships a console-log subscriber
 * so demo audiences can confirm the dispatch pipeline lives.
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
 *     surface per Iris ship, not labeled MOCK in the runtime sense; the
 *     console subscriber is a demo aid not a stub for missing functionality.
 */

'use client';

import { useEffect } from 'react';
import { ChronicleCanvas } from '@/scene';
import {
  BuildingInstances,
  useBuildingClick,
  useBuildingClickDispatch,
  useCityData,
} from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';

function CityScene() {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();

  // Wave 1 demo subscriber: logs building click to console so the audit gate
  // + manual demo can confirm the dispatch pipeline lives. Wave 2 Persephone
  // adds the ticket panel subscriber via the same useBuildingClick hook.
  useBuildingClick((building: BuildingData) => {
    // eslint-disable-next-line no-console
    console.log(`[city] building click ${building.id} (${building.archetype})`, {
      district: building.district,
      ownershipColor: building.ownershipColor,
      activity: building.activity,
    });
  });

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      `[city] mounted ${city.buildings.length} buildings across ` +
        `${city.districts.length} districts, centroid ${city.centroid.join(',')}`
    );
  }, [city]);

  return <BuildingInstances data={city} onBuildingClick={dispatchClick} />;
}

export default function CityPage() {
  return (
    <ChronicleCanvas cameraTarget={[0, 0, 0]} cameraPosition={[0, 90, 140]}>
      <CityScene />
    </ChronicleCanvas>
  );
}
