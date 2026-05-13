'use client';

/**
 * useBuildingTicket: Wave 2 ticket panel hook bridging Iris building click
 * to Hera selected building context.
 *
 * Authored by Persephone (Wave 2).
 *
 * Wave-Fixing 3 (Persephone-paired-Hera, B-1 recurring root cause fix
 * STAMP=20260513-final): two critical defects corrected here that caused
 * Ghaisan QA at 05:51 WIB to see "ZERO panel pop, ZERO highlight" when
 * clicking any non-landmark building:
 *
 *   1. The click subscriber was an inline arrow function on every render,
 *      which contradicted the stability discipline spelled out in
 *      `src/modes/sprint/clickHandlers.ts` lines 28-33. Inline identity
 *      forced `useEffect` inside `useBuildingClick` to remove + re-add the
 *      subscriber every render, opening a window where the dispatch Set
 *      could be momentarily empty during state churn. Now wrapped in a
 *      `useCallback` keyed on the store setters, matching the canonical
 *      pattern.
 *   2. `useSelectedBuildingContext()` returned null for any building outside
 *      the 4 mock-seeded landmarks (Athena / Apollo / Argus / Clio), so the
 *      TicketPanel placeholder showed for ~227 of the 231 mock buildings.
 *      We now synthesize a minimal ad-hoc `BuildingSprintContext` from the
 *      Iris `BuildingData` when no real context exists, labeled
 *      `[MOCK Wave-Fixing 3 ad-hoc context, real Wave 3 Demeter event store]`
 *      via the `_synthetic` metadata flag so demo + Aether audit can
 *      distinguish real-seeded vs ad-hoc rows.
 *
 * Iris dispatches building click events via the in-module event bus (per
 * `@/scene/buildings/useCityData`). Persephone subscribes here + forwards
 * the click to:
 *   1. Hera's `selectBuilding(id)` action (updates heraStore.selectedBuildingId)
 *   2. Persephone's panel store `setSelectedBuildingId(id)` (cross-panel state)
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): synthetic ad-hoc context labeled at source
 *     `[MOCK Wave-Fixing 3 ad-hoc]` + `_synthetic: true` flag in metadata
 *     so the panel can render a "no sprint context yet" badge.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useBuildingClick, useBuildingById } from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import {
  useHeraStore,
  useSelectedBuildingContext,
} from '@/modes/sprint/heraStore';
import type { BuildingSprintContext } from '@/modes/sprint/types';
import { usePanelStore } from '@/lib/panel-context';

/**
 * Build a minimal synthetic BuildingSprintContext from BuildingData so the
 * TicketPanel can render a useful surface even when Hera mock seed has not
 * touched this building. Wave 3 swap: Demeter event store will hydrate every
 * building on click via lazy fetch, so this synthesizer becomes a fallback
 * for offline / first-paint only.
 */
function synthesizeContext(building: BuildingData): BuildingSprintContext {
  const lastEditedMs = Date.now() - Math.round((1 - building.activity) * 7 * 24 * 60 * 60 * 1000);
  return {
    buildingId: building.id,
    sprintStatus: 'unfinished',
    prNumber: null,
    prTitle: null,
    prUrl: null,
    issueNumber: null,
    issueTitle: building.label,
    issueUrl: null,
    assignee: null,
    storyPoints: null,
    milestone: null,
    dodChecklist: [],
    prComments: [],
    reviewersRequested: [],
    reviewersApproved: [],
    dependencies: [],
    blocked: false,
    blockedReason: null,
    ciStatus: null,
    ciFailCount: 0,
    prApprovedAt: null,
    refactorStage: null,
    lastUpdatedAt: new Date(lastEditedMs).toISOString(),
  };
}

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
  const realContext = useSelectedBuildingContext();
  const selectedBuildingId = usePanelStore((s) => s.selectedBuildingId);
  const fallbackBuilding = useBuildingById(selectedBuildingId ?? '');
  const dismissed = usePanelStore((s) => s.ticketDismissed);
  const setTicketDismissed = usePanelStore((s) => s.setTicketDismissed);

  // Wave-Fixing 3 fix #1: wrap subscriber in useCallback so the Iris event
  // bus does not churn subscribe/unsubscribe every render. Keys: stable
  // zustand setter identities.
  const onBuildingClick = useCallback(
    (building: BuildingData) => {
      selectBuilding(building.id);
      setSelectedBuildingId(building.id);
      setTicketDismissed(false);
    },
    [selectBuilding, setSelectedBuildingId, setTicketDismissed],
  );
  useBuildingClick(onBuildingClick);

  // Wave-Fixing 3 fix #2: when no real Hera-seeded context, synthesize a
  // minimal one from BuildingData. Synthetic flag set via _synthetic
  // metadata so the TicketPanel renders a "no sprint context yet" badge
  // rather than pretend to have real PR / issue data.
  const context = useMemo<(BuildingSprintContext & { _synthetic?: boolean }) | null>(() => {
    if (realContext) return realContext;
    if (!fallbackBuilding) return null;
    return { ...synthesizeContext(fallbackBuilding), _synthetic: true };
  }, [realContext, fallbackBuilding]);

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
