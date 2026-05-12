/**
 * Iris smoke test page.
 *
 * Mounts ChronicleCanvas (Daedalus output) + BuildingInstances (Iris output)
 * with the singleton mockCityData (~240 buildings, 7 districts). Run via
 * `pnpm dev` then visit /__iris_smoke to verify:
 *
 *   1. Canvas boots without console error
 *   2. 200-300 buildings render via 8 raw instancedMesh draw calls
 *   3. 5 landmark archetypes (temple/cross/tower/stack/beacon) visually
 *      distinguishable at default OrbitControls camera distance
 *   4. setMatrixAt deterministic: same mock data = same x/z layout every
 *      reload
 *   5. Ownership color encoding (12-hue palette) reads across the city
 *   6. Click handler dispatches BuildingData to subscribers
 *
 * Smoke test target H1 60fps benchmark: open Chrome DevTools, mount Drei
 * `<Perf />` overlay if needed (Daedalus PostPipeline may add this in dev
 * mode). On M-series MBP 16GB target sustained 60fps with full Daedalus
 * post-pipeline ON.
 *
 * This page is NOT shipped to production routes; it lives behind the
 * `__iris_smoke` prefix so Eunomia audit gate can verify H1 hypothesis +
 * Wave 2 worker Hera can sanity-check the contract surface.
 *
 * Compliance: anti-pattern Lock 5 ([NOTE] smoke is a verification page, not
 * a mock. The BuildingInstances + mockCityData are the production Wave 1
 * surface.)
 */

'use client';

import { useEffect } from 'react';
import { ChronicleCanvas } from '@/scene';
import {
  BuildingInstances,
  useCityData,
  useBuildingClick,
  useBuildingClickDispatch,
} from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';

function CitySceneBody() {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();

  // Smoke subscribe: log click to console for manual verification
  useBuildingClick((building: BuildingData) => {
    // eslint-disable-next-line no-console
    console.log(
      `[Iris smoke] click on ${building.id} (${building.archetype})`,
      {
        owner: building.ownershipColor,
        landmark: building.landmark,
        activity: building.activity,
      }
    );
  });

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      `[Iris smoke] mounted with ${city.buildings.length} buildings ` +
        `across ${city.districts.length} districts, centroid ${city.centroid.join(',')}`
    );
  }, [city]);

  return <BuildingInstances data={city} onBuildingClick={dispatchClick} />;
}

export default function IrisSmokePage() {
  return (
    <main className="fixed inset-0 h-screen w-screen bg-[#05070d]">
      <ChronicleCanvas cameraTarget={[0, 0, 0]} cameraPosition={[0, 90, 140]}>
        <CitySceneBody />
      </ChronicleCanvas>
      <div className="pointer-events-none absolute left-4 top-4 z-10 text-xs font-mono text-white/60">
        Iris smoke test, BuildingInstances + mockCityData (~240 buildings).
        Click any building to log to console.
      </div>
    </main>
  );
}
