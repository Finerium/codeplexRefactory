'use client';

/**
 * Click building -> Persephone ticket panel routing hook.
 *
 * Authored by Hera (Wave 2). Subscribes to Iris's `useBuildingClick` event
 * bus and dispatches `heraStore.selectBuilding(buildingId)`. Persephone's
 * TicketPanel renders the selected context.
 *
 * Multiple subscribers safe (Iris handoff log line 132). This Hera hook is
 * ONE subscriber; Boreas / Asclepius may add others without conflict.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label needed; behavior fully wired Wave 2
 */

import { useCallback, useEffect } from 'react';
import { useBuildingClick } from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import { useHeraStore } from './heraStore';

/**
 * Hook that wires building click into heraStore selection. Mount once at
 * SprintMode composite root. Cleanup via Iris's hook unsubscribe.
 *
 * Discipline: handler MUST be stable across renders (useCallback) so Iris's
 * `useBuildingClick(handler)` does NOT churn the subscription set every
 * frame. Without the useCallback wrap, React 19 strict mode + zustand v5
 * yields a Max update depth loop because the effect re-runs each render
 * (handler identity changes -> subscribe/unsubscribe -> next render).
 */
export function useSprintClickToTicket(): void {
  const selectBuilding = useHeraStore((s) => s.selectBuilding);

  const handler = useCallback(
    (building: BuildingData) => {
      selectBuilding(building.id);
    },
    [selectBuilding]
  );

  useBuildingClick(handler);

  // Optional debug log for Wave 2 demo / Dike audit visibility.
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[hera/clickHandlers] sprint click-to-ticket bridge mounted');
    }
  }, []);
}
