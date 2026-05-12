'use client';

/**
 * SpecDriftLayer: in-scene r3f component that renders SpecDriftCrackPattern
 * overlays for the 5 demo retak (cracked) buildings, one per pattern A-E.
 *
 * Owner: Asclepius (Wave-Fixing #2 cycle 1, STAMP=20260513-0313).
 *
 * Manager directive Feature #29 + 3 building states:
 *   - "3 building state visual: Solid (normal), Ghost (proposal/issue path
 *      belum exist), Retak (5 pattern)"
 *   - Boreas owns timeline + retro narrate prose
 *   - Asclepius (this file + SpecDriftCrackPattern) owns the visual shaders
 *
 * Wave 3 swap: Demeter Wave 3 spec-drift detector emits drift events with
 * pattern enum + building id; Boreas narrates. Wave 2 + Wave-Fixing #2 ships
 * a deterministic mock list assigning one building to each of A-E so a
 * juror sees 5 visually distinct patterns side by side.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock flags
 * labeled at SPECDRIFT_MOCK_FLAGS source).
 */

import { useMemo } from 'react';
import { useCityData } from '@/scene/buildings';
import {
  SpecDriftCrackPattern,
  type SpecDriftFlag,
  type SpecDriftPattern,
} from './SpecDriftCrackPattern';

/**
 * [MOCK Wave-Fixing #2 cycle 1] 5 spec-drift flags, one per pattern A-E.
 *
 * Building ids chosen from Iris mockCityData generic buildings so the
 * cracks land on actual rendered buildings. Patterns spread across
 * districts so demo footage shows all 5 patterns in one camera pan.
 */
export const SPECDRIFT_MOCK_FLAGS: SpecDriftFlag[] = [
  {
    buildingId: 'backend/app/api/route_1.py',
    pattern: 'A',
  },
  {
    buildingId: 'backend/app/api/route_5.py',
    pattern: 'B',
  },
  {
    buildingId: 'backend/app/services/service_3.py',
    pattern: 'C',
  },
  {
    buildingId: 'backend/app/services/service_10.py',
    pattern: 'D',
  },
  {
    buildingId: 'backend/app/repositories/repo_2.py',
    pattern: 'E',
  },
];

interface SpecDriftLayerProps {
  /** Override flag list. Defaults to the canonical 5-pattern mock. */
  flags?: SpecDriftFlag[];
}

export function SpecDriftLayer({
  flags = SPECDRIFT_MOCK_FLAGS,
}: SpecDriftLayerProps) {
  const city = useCityData();

  const resolved = useMemo(() => {
    const byId = new Map(city.buildings.map((b) => [b.id, b]));
    return flags
      .map((flag) => {
        const building = byId.get(flag.buildingId);
        if (!building) {
          // eslint-disable-next-line no-console
          console.warn(
            `[asclepius] spec-drift building id ${flag.buildingId} not present; skipping pattern ${flag.pattern}`,
          );
          return null;
        }
        return { building, pattern: flag.pattern as SpecDriftPattern };
      })
      .filter((x): x is { building: NonNullable<ReturnType<typeof byId.get>>; pattern: SpecDriftPattern } => x !== null);
  }, [city.buildings, flags]);

  return (
    <group name="spec-drift-layer">
      {resolved.map(({ building, pattern }) => (
        <SpecDriftCrackPattern
          key={`${building.id}-${pattern}`}
          building={building}
          pattern={pattern}
        />
      ))}
    </group>
  );
}

SpecDriftLayer.displayName = 'SpecDriftLayer';
