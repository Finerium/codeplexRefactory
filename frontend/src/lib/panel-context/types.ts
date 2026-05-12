/**
 * Cross-panel context types: current product mode, side panel variant routing,
 * chat panel open state. Shared by ChatPanel + TicketPanel + SidePanel.
 *
 * Authored by Persephone (Wave 2) per Decision D6 (`_meta/decision_log/persephone.md`).
 *
 * Distinct from `@/lib/chat/types` (chat messages) and `@/modes/sprint/heraStore`
 * (Hera sprint context). This file owns the cross-panel UI orchestration shape.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import type { CurrentMode } from '@/lib/chat';

/**
 * Side panel variant. 3 of the 5 product modes map to side panel variants;
 * onboarding + sprint route through their own scene overlays (Boreas + Hera).
 */
export type SidePanelVariant = 'refactor' | 'health' | 'activity';

/**
 * Map a product mode to side panel variant. Returns null for modes that do
 * NOT render a side panel variant (onboarding, sprint, dashboard).
 */
export function modeToVariant(mode: CurrentMode): SidePanelVariant | null {
  switch (mode) {
    case 'refactor':
      return 'refactor';
    case 'health':
      return 'health';
    case 'activity':
      return 'activity';
    case 'onboarding':
    case 'sprint':
    case 'dashboard':
      return null;
  }
}

/**
 * Cross-panel snapshot consumed by `useCurrentContext()`. Provides every panel
 * with the same view of "what mode is active, what building is selected, what
 * proposal / finding is selected".
 */
export interface PanelContextState {
  currentMode: CurrentMode;
  /** Building id from Iris BuildingData click event; null if none. */
  selectedBuildingId: string | null;
  /** Refactor proposal id if user is reviewing one in side panel. */
  selectedProposalId: string | null;
  /** Health finding id if user is reviewing one in side panel. */
  selectedFindingId: string | null;
  /** Chat panel: target resident or broadcast. */
  chatTarget: 'Athena' | 'Apollo' | 'Argus' | 'Clio' | 'Hermes' | 'broadcast';
  /** Chat panel: broadcast mode toggle (query all 5 in parallel). */
  broadcast: boolean;
  /** Chat panel collapsed state (Wave 2 always-open; Wave 3 may add toggle). */
  chatCollapsed: boolean;
  /** Ticket panel visible (gated on selectedBuildingId presence + user not closed). */
  ticketDismissed: boolean;
}

/**
 * Imperative actions on the panel context store.
 */
export interface PanelContextActions {
  setMode: (mode: CurrentMode) => void;
  setSelectedBuildingId: (id: string | null) => void;
  setSelectedProposalId: (id: string | null) => void;
  setSelectedFindingId: (id: string | null) => void;
  setChatTarget: (
    target: 'Athena' | 'Apollo' | 'Argus' | 'Clio' | 'Hermes' | 'broadcast'
  ) => void;
  setBroadcast: (broadcast: boolean) => void;
  setChatCollapsed: (collapsed: boolean) => void;
  setTicketDismissed: (dismissed: boolean) => void;
  /** Clear all selections (Esc key handler). */
  clearAllSelections: () => void;
}
