'use client';

/**
 * heraStore: cross-tree state container for Sprint Mode HERO.
 *
 * Authored by Hera (Wave 2). Pythia contract `hera-to-persephone.md` Asumption
 * 1: Zustand chosen over React Context because the sprint overlay lives in
 * the Canvas tree and the ticket panel lives in the @ticket parallel-route
 * slot tree; Zustand cuts through tree boundaries.
 *
 * Persephone TicketPanel consumes via `useSelectedBuildingContext`. Hades
 * Wave 3 WebSocket receiver dispatches `applyEvent` to feed real PR events.
 * Asclepius Wave 2 RefactorMode reads `refactorStage` field from contexts.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): Wave 2 driven by mock tape; Wave 3 swaps to real
 *     WebSocket events via the same `applyEvent` action surface.
 *
 * Anchor: Pythia contract `_meta/contracts/hera-to-persephone.md` lines 71-88.
 */

import { create } from 'zustand';
import { reduceSprintEvent } from './stateMachine';
import type {
  BuildingEvent,
  BuildingSprintContext,
  ConceptVisibility,
} from './types';
import { DEFAULT_CONCEPT_VISIBILITY } from './types';

/**
 * Store shape per Pythia contract `hera-to-persephone.md` lines 71-88. Extra
 * fields beyond the canonical contract (conceptVisibility, demoTape state)
 * are Hera-internal; Persephone only consumes the contracted surface.
 */
export interface HeraStoreState {
  /** Map of building id to sprint context. Empty for unseen buildings. */
  contexts: Record<string, BuildingSprintContext>;
  /** Currently selected building id (Persephone TicketPanel reads). */
  selectedBuildingId: string | null;
  /** 14 PM concept toggle visibility, drives SprintMode filter UI chips. */
  conceptVisibility: ConceptVisibility;
  /**
   * Wave 2-only mock demo tape running flag. Set true when the synthetic
   * event tape starts playing; UI may show a small "[MOCK Wave 2] demo tape"
   * label. Wave 3 Hades wired real WebSocket so this flag stays false in
   * production runtime.
   */
  mockTapeRunning: boolean;

  // ----- Actions -----

  /**
   * Apply a single building event to the appropriate context. Idempotent over
   * duplicate events (reducer dedups comments by id). Multiple subscribers
   * (Persephone TicketPanel, Asclepius RefactorMode overlay) get triggered
   * via zustand's auto-subscription on context map change.
   */
  applyEvent: (event: BuildingEvent) => void;

  /**
   * Set the entire context for a building (e.g., initial hydration from a
   * backfill API call). Replaces existing context if any.
   */
  setContext: (buildingId: string, context: BuildingSprintContext) => void;

  /**
   * Partial update for a building context. Persephone TicketPanel uses for
   * inline DoD checklist toggle (user manual check / uncheck).
   */
  updateContext: (buildingId: string, patch: Partial<BuildingSprintContext>) => void;

  /** Mark a building as the currently selected one. */
  selectBuilding: (buildingId: string | null) => void;

  /** Clear the selected building. */
  clearSelection: () => void;

  /** Toggle one of the 14 concept overlay visibility chips. */
  toggleConcept: (key: keyof ConceptVisibility) => void;

  /** Reset all concept visibility to default (all Hera concepts ON, Asclepius OFF). */
  resetConceptVisibility: () => void;

  /** Set the mock tape running flag (called by useBuildingEvents Wave 2 stub). */
  setMockTapeRunning: (running: boolean) => void;
}

export const useHeraStore = create<HeraStoreState>((set) => ({
  contexts: {},
  selectedBuildingId: null,
  conceptVisibility: DEFAULT_CONCEPT_VISIBILITY,
  mockTapeRunning: false,

  applyEvent: (event) => {
    set((state) => {
      const current = state.contexts[event.buildingId] ?? null;
      const next = reduceSprintEvent(current, event);
      return {
        contexts: { ...state.contexts, [event.buildingId]: next },
      };
    });
  },

  setContext: (buildingId, context) => {
    set((state) => ({
      contexts: { ...state.contexts, [buildingId]: context },
    }));
  },

  updateContext: (buildingId, patch) => {
    set((state) => {
      const current = state.contexts[buildingId];
      if (!current) return state;
      return {
        contexts: {
          ...state.contexts,
          [buildingId]: { ...current, ...patch },
        },
      };
    });
  },

  selectBuilding: (buildingId) => {
    set({ selectedBuildingId: buildingId });
  },

  clearSelection: () => {
    set({ selectedBuildingId: null });
  },

  toggleConcept: (key) => {
    set((state) => ({
      conceptVisibility: {
        ...state.conceptVisibility,
        [key]: !state.conceptVisibility[key],
      },
    }));
  },

  resetConceptVisibility: () => {
    set({ conceptVisibility: DEFAULT_CONCEPT_VISIBILITY });
  },

  setMockTapeRunning: (running) => {
    set({ mockTapeRunning: running });
  },
}));

/**
 * Convenience selector hook: returns the currently selected building context
 * or null if no selection. Persephone TicketPanel uses this.
 *
 * Stable identity across renders when the underlying context object does not
 * change. Persephone re-renders only on actual context change, not on every
 * action dispatch.
 */
export function useSelectedBuildingContext(): BuildingSprintContext | null {
  return useHeraStore((s) =>
    s.selectedBuildingId ? s.contexts[s.selectedBuildingId] ?? null : null
  );
}

/**
 * Selector hook: returns the building context for a specific id. SprintMode
 * overlay components use this per-building to derive visual flags.
 */
export function useBuildingContext(buildingId: string): BuildingSprintContext | null {
  return useHeraStore((s) => s.contexts[buildingId] ?? null);
}

/**
 * Selector hook: returns the concept visibility map for the SprintMode filter
 * UI + per-concept render gates.
 */
export function useConceptVisibility(): ConceptVisibility {
  return useHeraStore((s) => s.conceptVisibility);
}

/**
 * Selector hook: returns a single concept visibility flag. Stable identity
 * preserved (zustand uses Object.is by default).
 */
export function useConceptVisible(key: keyof ConceptVisibility): boolean {
  return useHeraStore((s) => s.conceptVisibility[key]);
}
