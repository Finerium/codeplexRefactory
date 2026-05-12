'use client';

/**
 * RefactorGhostLayer: in-scene r3f component that renders all ghost
 * buildings for the current refactor proposal. Mounted as a child of
 * `<ChronicleCanvas>` next to `<BuildingInstances>`.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Reads the current proposal + simulation stage from the Asclepius store;
 * delegates the actual ghost geometry rendering to <GhostBuilding> and the
 * solid-progress animation to <GhostToSolidAnimation>.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

import { useAsclepiusStore } from '../health/asclepiusStore';
import { GhostBuilding } from './GhostBuilding';
import { GhostToSolidAnimation } from './GhostToSolidAnimation';

export function RefactorGhostLayer() {
  const proposal = useAsclepiusStore((s) => s.refactor.proposal);
  const stage = useAsclepiusStore((s) => s.refactor.stage);

  if (!proposal) return null;

  return (
    <group name="refactor-ghost-layer">
      <GhostToSolidAnimation stage={stage}>
        {({ solidProgress, fadeOut }) => (
          <>
            {proposal.ghostBuildings.map((hint) => (
              <GhostBuilding
                key={hint.ghostId}
                hint={hint}
                solidProgress={solidProgress}
                fadeOut={fadeOut}
              />
            ))}
          </>
        )}
      </GhostToSolidAnimation>
    </group>
  );
}

RefactorGhostLayer.displayName = 'RefactorGhostLayer';
