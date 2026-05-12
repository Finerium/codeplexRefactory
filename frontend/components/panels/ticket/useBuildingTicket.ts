'use client';

/**
 * useBuildingTicket: Wave 2 ticket panel hook bridging Iris building click
 * to Hera selected building context.
 *
 * Authored by Persephone (Wave 2).
 *
 * Iris dispatches building click events via the in-module event bus (per
 * `@/scene/buildings/useCityData`). Persephone subscribes here + forwards
 * the click to:
 *   1. Hera's `selectBuilding(id)` action (updates heraStore.selectedBuildingId)
 *   2. Persephone's panel store `setSelectedBuildingId(id)` (cross-panel state)
 *
 * Then `useSelectedBuildingContext()` returns the sprint context for the
 * ticket panel to render. Returns null when no building selected or no
 * context registered for the selected building.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (no mock; this is the canonical Wave 2 bridge production surface).
 */

import { useEffect } from 'react';
import { useBuildingClick } from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import {
  useHeraStore,
  useSelectedBuildingContext,
} from '@/modes/sprint/heraStore';
import { usePanelStore } from '@/lib/panel-context';

/**
 * Wires Iris building click to Hera + Panel store selection. Returns the
 * current sprint context for the ticket panel.
 *
 * Mount this hook once at the ticket panel root component. Multiple mounts
 * subscribe independently (Iris event bus is fanout-safe per Iris D6 design).
 */
export function useBuildingTicket() {
  const selectBuilding = useHeraStore((s) => s.selectBuilding);
  const setSelectedBuildingId = usePanelStore((s) => s.setSelectedBuildingId);
  const context = useSelectedBuildingContext();
  const dismissed = usePanelStore((s) => s.ticketDismissed);
  const setTicketDismissed = usePanelStore((s) => s.setTicketDismissed);

  useBuildingClick((building: BuildingData) => {
    selectBuilding(building.id);
    setSelectedBuildingId(building.id);
    setTicketDismissed(false);
  });

  // Auto-clear selection on Esc key (chained to panel store clearAllSelections).
  const clearAll = usePanelStore((s) => s.clearAllSelections);
  const heraClear = useHeraStore((s) => s.clearSelection);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        clearAll();
        heraClear();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearAll, heraClear]);

  return {
    context,
    dismissed,
    dismiss: () => setTicketDismissed(true),
    close: () => {
      setSelectedBuildingId(null);
      heraClear();
    },
  };
}
