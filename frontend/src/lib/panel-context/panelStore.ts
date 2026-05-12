'use client';

/**
 * Cross-panel Zustand store for current mode + selection state + chat target.
 *
 * Authored by Persephone (Wave 2) per Decision D6 (`_meta/decision_log/persephone.md`).
 * Subscribers: ChatPanel, TicketPanel, SidePanel, Hera/Asclepius/Boreas overlays.
 *
 * Zustand chosen because state is cross-tree (panel slots vs canvas tree), same
 * rationale Hera contract `hera-to-persephone.md` Asumption 1 cites.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 4 ([INFERRED] default mode = 'activity' per PRD Section 9.4 default landing).
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type {
  PanelContextActions,
  PanelContextState,
} from './types';

type Store = PanelContextState & PanelContextActions;

export const usePanelStore = create<Store>((set) => ({
  // Default Wave 2 demo: activity mode landing, no selection, Hermes chat target,
  // single (non-broadcast) mode, chat expanded, ticket not dismissed.
  currentMode: 'activity',
  selectedBuildingId: null,
  selectedProposalId: null,
  selectedFindingId: null,
  chatTarget: 'Hermes',
  broadcast: false,
  chatCollapsed: false,
  sideCollapsed: false,
  // Wave-Fixing cycle 2 (Persephone, C-new-4): Sprint Mode HUD hide toggle
  // parity with chat + side panel. Default false (visible) so demo flow
  // first-load shows the 14 PM concept overlay panel.
  sprintCollapsed: false,
  ticketDismissed: false,

  setMode: (mode) => set({ currentMode: mode }),
  setSelectedBuildingId: (id) =>
    set({ selectedBuildingId: id, ticketDismissed: false }),
  setSelectedProposalId: (id) => set({ selectedProposalId: id }),
  setSelectedFindingId: (id) => set({ selectedFindingId: id }),
  setChatTarget: (target) => set({ chatTarget: target }),
  setBroadcast: (broadcast) => set({ broadcast }),
  setChatCollapsed: (collapsed) => set({ chatCollapsed: collapsed }),
  setSideCollapsed: (collapsed) => set({ sideCollapsed: collapsed }),
  setSprintCollapsed: (collapsed) => set({ sprintCollapsed: collapsed }),
  setTicketDismissed: (dismissed) => set({ ticketDismissed: dismissed }),
  clearAllSelections: () =>
    set({
      selectedBuildingId: null,
      selectedProposalId: null,
      selectedFindingId: null,
      ticketDismissed: false,
    }),
}));

/**
 * Selector hook: derive the current ChatContext from the store.
 *
 * Critical Zustand pitfall avoided: returning a new object via `useStore(s =>
 * ({ ... }))` triggers infinite re-render because Zustand's default
 * Object.is comparison sees a fresh reference every call. We instead subscribe
 * to scalar fields independently + compose the ChatContext via useMemo so the
 * composed reference stays stable until an actual field change.
 */
export function useCurrentChatContext() {
  const currentMode = usePanelStore((s) => s.currentMode);
  const selectedBuildingId = usePanelStore((s) => s.selectedBuildingId);
  const selectedProposalId = usePanelStore((s) => s.selectedProposalId);
  const selectedFindingId = usePanelStore((s) => s.selectedFindingId);

  return useMemo(
    () => ({
      currentMode,
      selectedBuildingId,
      modeContext: {
        selectedProposalId,
        selectedFindingId,
      },
    }),
    [currentMode, selectedBuildingId, selectedProposalId, selectedFindingId]
  );
}
