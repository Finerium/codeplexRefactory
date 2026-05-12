/**
 * Asclepius smoke route.
 *
 * Mounts the Health Mode + Refactor Mode Wave 2 deliverable as a stable
 * audit checkpoint independent of the production `/city` parallel slot
 * shell. Mirrors the pattern Iris + Daedalus established at
 * `/iris-smoke` and `/daedalus-smoke`.
 *
 * Visible regions:
 *   - Full-bleed `<ChronicleCanvas>` with Iris `<BuildingInstances>` plus
 *     Asclepius `<HealthGlowLayer>` + `<RefactorGhostLayer>` mounted as
 *     siblings.
 *   - Left dock: `<HealthMode>` composite (findings panel + evidence).
 *   - Right dock: `<RefactorMode>` composite (proposal summary + simulation
 *     progress + dual review gate).
 *   - Bottom strip: a switcher button to flip between Health-only / Refactor
 *     -only / both modes for screenshot capture by Dike audit.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock streams
 * labeled upstream; this smoke just composes the surfaces).
 */

'use client';

import { useState } from 'react';
import { ChronicleCanvas } from '@/scene';
import {
  BuildingInstances,
  useBuildingClick,
  useBuildingClickDispatch,
  useCityData,
} from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import {
  HealthMode,
  HealthGlowLayer,
  useAsclepiusStore,
  selectApolloFindings,
} from '@/modes/health';
import { RefactorMode, RefactorGhostLayer } from '@/modes/refactor';

type SmokeView = 'both' | 'health' | 'refactor';

function CityScene() {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();
  const selectFinding = useAsclepiusStore((s) => s.selectFinding);
  const findings = useAsclepiusStore(selectApolloFindings);

  // Building click subscriber: if the clicked building has an open finding,
  // select it so the evidence panel pops; otherwise no-op.
  useBuildingClick((building: BuildingData) => {
    for (const f of Object.values(findings)) {
      if (f.buildingId === building.id && f.status === 'open') {
        selectFinding(f.id);
        return;
      }
    }
  });

  return (
    <>
      <BuildingInstances data={city} onBuildingClick={dispatchClick} />
      <HealthGlowLayer />
      <RefactorGhostLayer />
    </>
  );
}

export default function AsclepiusSmokePage() {
  const [view, setView] = useState<SmokeView>('both');

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-codeplex-void text-white">
      <ChronicleCanvas cameraTarget={[0, 0, 0]} cameraPosition={[40, 80, 130]}>
        <CityScene />
      </ChronicleCanvas>

      {/* Left dock: Health Mode panel (findings + evidence) */}
      {view === 'both' || view === 'health' ? (
        <aside
          className="pointer-events-none absolute left-0 top-0 z-20 flex h-full w-[22rem] flex-col items-stretch justify-start gap-3 p-4"
          aria-label="Asclepius Health Mode dock"
        >
          <div className="pointer-events-auto">
            <HealthMode source="mock" />
          </div>
        </aside>
      ) : null}

      {/* Right dock: Refactor Mode panel (proposal + progress + gate) */}
      {view === 'both' || view === 'refactor' ? (
        <aside
          className="pointer-events-none absolute right-0 top-0 z-20 flex h-full w-[24rem] flex-col items-stretch justify-start gap-3 p-4"
          aria-label="Asclepius Refactor Mode dock"
        >
          <div className="pointer-events-auto">
            <RefactorMode source="mock" />
          </div>
        </aside>
      ) : null}

      {/* Bottom strip: view switcher + smoke route legend */}
      <footer
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 p-4"
        aria-label="Asclepius smoke route footer"
      >
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-codeplex-shadow/85 px-3 py-2 text-[10px] text-white/65 backdrop-blur-glass">
          <span className="font-mono uppercase tracking-widest text-codeplex-ember">
            Asclepius smoke
          </span>
          <span className="text-white/35">|</span>
          <button
            type="button"
            onClick={() => setView('both')}
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
              view === 'both'
                ? 'border-white/45 text-white'
                : 'border-white/15 text-white/45 hover:border-white/30 hover:text-white/70'
            }`}
            data-view-switch="both"
            aria-pressed={view === 'both'}
          >
            both
          </button>
          <button
            type="button"
            onClick={() => setView('health')}
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
              view === 'health'
                ? 'border-white/45 text-white'
                : 'border-white/15 text-white/45 hover:border-white/30 hover:text-white/70'
            }`}
            data-view-switch="health"
            aria-pressed={view === 'health'}
          >
            health
          </button>
          <button
            type="button"
            onClick={() => setView('refactor')}
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
              view === 'refactor'
                ? 'border-white/45 text-white'
                : 'border-white/15 text-white/45 hover:border-white/30 hover:text-white/70'
            }`}
            data-view-switch="refactor"
            aria-pressed={view === 'refactor'}
          >
            refactor
          </button>
        </div>
      </footer>
    </div>
  );
}
