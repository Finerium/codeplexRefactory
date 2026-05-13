/**
 * Activity Mode UI state Zustand store.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D5.
 *
 * Why Zustand over React Context:
 *  - Multiple consumers across the r3f Canvas tree boundary (DOM HUD
 *    scrubber + Canvas-tree HotspotGlow + OwnershipHeatmap + TimelineMarkers).
 *  - Zustand selectors prevent re-render storm during scrubber drag at 60fps
 *    (Context would re-render every consumer per state change).
 *  - Daedalus's Asumption 4 ("React Context not Zustand for performance
 *    state") governs perf state specifically; activity UI state is a
 *    separate concern + Zustand is the canonical r3f cross-tree pattern.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: not applicable (no mock content).
 */

import { create } from 'zustand';
import type { TimelineState } from './types';

interface ActivityStoreActions {
  setRangeDays: (range: 30 | 60 | 90) => void;
  setScrubberPosition: (position: number) => void;
  setOwnershipHeatmapActive: (active: boolean) => void;
  toggleOwnershipHeatmap: () => void;
  /** Reset scrubber to start of range; used when range toggle flips. */
  resetScrubber: () => void;
}

type ActivityStore = TimelineState & ActivityStoreActions;

/**
 * Default timeline state on mount. 30-day range = primary daily standup use
 * case per PRD Section 9.4. Cycle 3 hotfix 2026-05-13 10:09 WIB: scrubber
 * default 1.0 maps to NOW (right edge) per flipped convention. Buildings
 * render at current LOC (visible) on initial mount instead of LOC 0 (past).
 * Ownership heatmap toggle defaults off so hotspot glow reads first.
 */
const DEFAULT_TIMELINE_STATE: TimelineState = {
  rangeDays: 30,
  scrubberPosition: 1.0,
  ownershipHeatmapActive: false,
};

export const useActivityStore = create<ActivityStore>((set) => ({
  ...DEFAULT_TIMELINE_STATE,
  setRangeDays: (range) =>
    set((state) => {
      if (state.rangeDays === range) return state;
      // Range toggle resets scrubber to "now" (1.0) per D9 UX decision.
      return { rangeDays: range, scrubberPosition: 1.0 };
    }),
  setScrubberPosition: (position) =>
    set({ scrubberPosition: Math.max(0, Math.min(1, position)) }),
  setOwnershipHeatmapActive: (active) =>
    set({ ownershipHeatmapActive: active }),
  toggleOwnershipHeatmap: () =>
    set((state) => ({ ownershipHeatmapActive: !state.ownershipHeatmapActive })),
  resetScrubber: () => set({ scrubberPosition: 1.0 }),
}));

/**
 * Selector helpers to avoid re-rendering consumers that only need one slice.
 * Canonical Zustand pattern.
 */
export const selectRangeDays = (s: ActivityStore) => s.rangeDays;
export const selectScrubberPosition = (s: ActivityStore) => s.scrubberPosition;
export const selectOwnershipHeatmapActive = (s: ActivityStore) =>
  s.ownershipHeatmapActive;
