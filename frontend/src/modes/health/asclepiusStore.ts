/**
 * Asclepius store: Health Mode + Refactor Mode shared state.
 *
 * Owner: Asclepius (Wave 2).
 * Contracts:
 *   - `_meta/contracts/asclepius-to-triton.md` (Apollo context schema; Triton
 *      Wave 3 consumes via useApolloQueryContext for chat routing payload)
 *   - `_meta/contracts/asclepius-to-pandora.md` (Refactor event stream;
 *      Pandora Wave 3 publishes simulation stage events)
 *
 * Zustand v5 store, single source of truth for Apollo + Athena context. The
 * store is intentionally module-local (not React Context) so multiple
 * subscribers (FindingsPanel + GlowWindow layer + Triton chat sender) can
 * read selectors with stable identity without provider wiring. Zustand v5
 * `useStore` is the canonical pattern per the team's existing dashboard +
 * marketing surfaces (no new lib intro).
 *
 * Selector discipline: components import the slice they need (selectFindings,
 * selectGlowingBuildings, etc.), not the full state, so unrelated mutations
 * do not trigger re-render of the glow layer. The selectors live below the
 * store creator + export named for clarity.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (Severity
 * palette imported from types, not re-defined here, so the locked PRD
 * mapping cannot drift). Lock 5 ([STUB] only on websocket consumer, store
 * itself is canonical Wave 2 production surface for the asclepius-to-triton
 * context selector).
 */

import { create } from 'zustand';
import type {
  ApolloContext,
  ApolloFilter,
  ApolloFinding,
  GlowWindowState,
  Severity,
} from './types';
import { SEVERITY_RANK } from './types';
import type {
  RefactorEvent,
  RefactorProposalEvent,
  SimulationStage,
} from '../refactor/simulationEvents';

/**
 * Refactor proposal state slice. Held alongside Apollo context so the
 * Refactor Mode side panel can read both (e.g., a refactor proposal touching
 * a building that already has findings shows both visuals). Pythia contract
 * `asclepius-to-pandora.md` does not require this to be in the same store;
 * we co-locate for ergonomic reasons + Triton's two-resident chat surface
 * (Apollo for findings, Athena for refactors) routes via the same store
 * shape per `asclepius-to-triton.md` line 11.
 */
export interface RefactorProposalSlice {
  /** Active proposal, if any. Null when no proposal in progress. */
  proposal: RefactorProposalEvent | null;
  /** Current simulation stage. Idle = no proposal pending. */
  stage: SimulationStage | 'idle';
  /** Progress percent 0..100 when stage is in-progress (test_gen, impl_gen, diff). */
  progressPercent: number;
  /** Last error message if simulation failed. */
  errorMessage: string | null;
  /** Drafts path written by simulation (Pandora populates on completed stage). */
  draftsPath: string | null;
  /** Diff path written on accept. Pandora populates on accepted stage. */
  diffPath: string | null;
  /**
   * OpenSpec markdown bodies streamed by SSE proposal.openspec.* frames.
   * Asclepius Cycle 2 MF2 (Cluster D) populates these so RefactorReviewVariant
   * renders proposal.md / design.md / tasks.md in three tabs instead of the
   * URL-encoded link fallback. Each entry is the full markdown body (1-8 KB).
   * Null = not yet streamed by backend for this proposal.
   */
  openspecBodies: {
    proposal_md: string | null;
    design_md: string | null;
    tasks_md: string | null;
  };
}

/**
 * Full store state shape. Apollo + Refactor slice plus action setters.
 * Action signatures matched to Pythia contract `asclepius-to-triton.md`
 * lines 75-83 (setFinding / selectFinding / setGlow / applyFilter) and the
 * Refactor stage advancement helpers Asclepius needs internally.
 */
interface AsclepiusStoreState {
  apollo: ApolloContext;
  refactor: RefactorProposalSlice;
  /**
   * Cached GlowWindowState array derived from apollo.findings +
   * apollo.glowingBuildings. Maintained inside mutations so the returned
   * reference stays stable across renders that did not touch findings.
   * React 18+ useSyncExternalStore demands a stable snapshot reference;
   * recomputing on each selector call trips the infinite render loop.
   */
  glowWindowList: GlowWindowState[];

  // Apollo actions
  setFinding: (finding: ApolloFinding) => void;
  setFindings: (findings: ApolloFinding[]) => void;
  selectFinding: (findingId: string | null) => void;
  setGlow: (buildingId: string, severity: Severity | null) => void;
  applyFilter: (filter: Partial<ApolloFilter>) => void;
  markTicketed: (findingId: string, issueNumber: number) => void;
  reset: () => void;

  // Refactor actions
  setProposal: (proposal: RefactorProposalEvent | null) => void;
  setStage: (stage: SimulationStage | 'idle') => void;
  setProgress: (percent: number) => void;
  setRefactorError: (message: string | null) => void;
  setDraftsPath: (path: string | null) => void;
  setDiffPath: (path: string | null) => void;
  setOpenspecBody: (kind: 'proposal_md' | 'design_md' | 'tasks_md', body: string) => void;
  ingestRefactorEvent: (event: RefactorEvent) => void;
  resetRefactor: () => void;
}

/**
 * Default Apollo filter: all severities + all categories selected.
 */
const DEFAULT_FILTER: ApolloFilter = {
  severity: ['critical', 'high', 'medium', 'low', 'info'],
  category: [
    'hardcoded-secret',
    'outdated-dependency',
    'missing-auth',
    'unsafe-sql',
    'complex-untested',
  ],
};

const DEFAULT_APOLLO: ApolloContext = {
  glowingBuildings: {},
  findings: {},
  selectedFindingId: null,
  filter: DEFAULT_FILTER,
};

const DEFAULT_REFACTOR: RefactorProposalSlice = {
  proposal: null,
  stage: 'idle',
  progressPercent: 0,
  errorMessage: null,
  draftsPath: null,
  diffPath: null,
  openspecBodies: {
    proposal_md: null,
    design_md: null,
    tasks_md: null,
  },
};

/**
 * Compute the max-severity glow map from a record of findings. Multi-finding
 * buildings collapse to one glow at the most severe entry. Resolved + snoozed
 * + ticketed findings are excluded (only open findings glow per PRD Section
 * 11 + `nemesis-to-asclepius.md` lines 132-138 "Resolved findings remove
 * glow correctly").
 */
function computeGlowMap(
  findings: Record<string, ApolloFinding>,
): Record<string, Severity> {
  const map: Record<string, Severity> = {};
  for (const finding of Object.values(findings)) {
    if (finding.status !== 'open') continue;
    const existing = map[finding.buildingId];
    if (!existing || SEVERITY_RANK[finding.severity] > SEVERITY_RANK[existing]) {
      map[finding.buildingId] = finding.severity;
    }
  }
  return map;
}

export const useAsclepiusStore = create<AsclepiusStoreState>((set, get) => ({
  apollo: DEFAULT_APOLLO,
  refactor: DEFAULT_REFACTOR,
  glowWindowList: [],

  setFinding: (finding) =>
    set((state) => {
      const nextFindings = {
        ...state.apollo.findings,
        [finding.id]: finding,
      };
      const nextGlow = computeGlowMap(nextFindings);
      return {
        apollo: {
          ...state.apollo,
          findings: nextFindings,
          glowingBuildings: nextGlow,
        },
        glowWindowList: computeGlowWindowList(nextFindings, nextGlow),
      };
    }),

  setFindings: (findings) =>
    set((state) => {
      const next: Record<string, ApolloFinding> = { ...state.apollo.findings };
      for (const f of findings) next[f.id] = f;
      const nextGlow = computeGlowMap(next);
      return {
        apollo: {
          ...state.apollo,
          findings: next,
          glowingBuildings: nextGlow,
        },
        glowWindowList: computeGlowWindowList(next, nextGlow),
      };
    }),

  selectFinding: (findingId) =>
    set((state) => ({
      apollo: { ...state.apollo, selectedFindingId: findingId },
    })),

  setGlow: (buildingId, severity) =>
    set((state) => {
      const next = { ...state.apollo.glowingBuildings };
      if (severity === null) {
        delete next[buildingId];
      } else {
        next[buildingId] = severity;
      }
      return {
        apollo: { ...state.apollo, glowingBuildings: next },
        glowWindowList: computeGlowWindowList(state.apollo.findings, next),
      };
    }),

  applyFilter: (filter) =>
    set((state) => ({
      apollo: {
        ...state.apollo,
        filter: { ...state.apollo.filter, ...filter },
      },
    })),

  markTicketed: (findingId, issueNumber) =>
    set((state) => {
      const existing = state.apollo.findings[findingId];
      if (!existing) return state;
      const updated: ApolloFinding = {
        ...existing,
        status: 'ticketed',
        linkedIssueNumber: issueNumber,
      };
      const nextFindings = {
        ...state.apollo.findings,
        [findingId]: updated,
      };
      const nextGlow = computeGlowMap(nextFindings);
      return {
        apollo: {
          ...state.apollo,
          findings: nextFindings,
          glowingBuildings: nextGlow,
        },
        glowWindowList: computeGlowWindowList(nextFindings, nextGlow),
      };
    }),

  reset: () =>
    set(() => ({
      apollo: DEFAULT_APOLLO,
      glowWindowList: [],
    })),

  setProposal: (proposal) =>
    set((state) => ({
      refactor: { ...state.refactor, proposal },
    })),

  setStage: (stage) =>
    set((state) => ({
      refactor: { ...state.refactor, stage },
    })),

  setProgress: (percent) =>
    set((state) => ({
      refactor: { ...state.refactor, progressPercent: percent },
    })),

  setRefactorError: (message) =>
    set((state) => ({
      refactor: { ...state.refactor, errorMessage: message },
    })),

  setDraftsPath: (path) =>
    set((state) => ({
      refactor: { ...state.refactor, draftsPath: path },
    })),

  setDiffPath: (path) =>
    set((state) => ({
      refactor: { ...state.refactor, diffPath: path },
    })),

  setOpenspecBody: (kind, body) =>
    set((state) => ({
      refactor: {
        ...state.refactor,
        openspecBodies: {
          ...state.refactor.openspecBodies,
          [kind]: body,
        },
      },
    })),

  ingestRefactorEvent: (event) => {
    const { setProposal, setStage, setProgress, setRefactorError, setDraftsPath, setDiffPath } = get();
    if (event.type === 'simulation.proposal') {
      setProposal(event);
      setStage('proposed');
      setProgress(0);
      setRefactorError(null);
      return;
    }
    // event.type === 'simulation.stage'
    setStage(event.stage);
    if (typeof event.payload.progressPercent === 'number') {
      setProgress(event.payload.progressPercent);
    }
    if (event.payload.error) {
      setRefactorError(event.payload.error);
    }
    if (event.payload.draftsPath) {
      setDraftsPath(event.payload.draftsPath);
    }
    if (event.payload.diffFilePath) {
      setDiffPath(event.payload.diffFilePath);
    }
  },

  resetRefactor: () =>
    set(() => ({
      refactor: DEFAULT_REFACTOR,
    })),
}));

/**
 * Apollo selectors. Subscribe to slices, not the full state, so unrelated
 * mutations (e.g., refactor stage advance) do not re-render the glow layer.
 */
export const selectApolloFindings = (
  state: AsclepiusStoreState,
): Record<string, ApolloFinding> => state.apollo.findings;

export const selectApolloGlowMap = (
  state: AsclepiusStoreState,
): Record<string, Severity> => state.apollo.glowingBuildings;

export const selectSelectedFinding = (
  state: AsclepiusStoreState,
): ApolloFinding | null => {
  const id = state.apollo.selectedFindingId;
  return id ? state.apollo.findings[id] ?? null : null;
};

export const selectApolloFilter = (
  state: AsclepiusStoreState,
): ApolloFilter => state.apollo.filter;

/**
 * Compute the GlowWindowState array. Pure helper; called from inside the
 * store mutations so the returned array reference is cached + stable across
 * unrelated re-renders. React 18+ useSyncExternalStore requires the
 * snapshot reference to be stable until the underlying state changes;
 * returning a fresh array every render trips the "getSnapshot should be
 * cached" warning + infinite render loop.
 */
function computeGlowWindowList(
  findings: Record<string, ApolloFinding>,
  glow: Record<string, Severity>,
): GlowWindowState[] {
  const counts: Record<string, number> = {};
  for (const f of Object.values(findings)) {
    if (f.status !== 'open') continue;
    counts[f.buildingId] = (counts[f.buildingId] ?? 0) + 1;
  }
  const result: GlowWindowState[] = [];
  for (const [buildingId, severity] of Object.entries(glow)) {
    result.push({
      buildingId,
      severity,
      count: counts[buildingId] ?? 0,
    });
  }
  return result;
}

/**
 * Apollo query context for Triton chat routing per
 * `asclepius-to-triton.md` lines 87-93. Wave 3 Persephone chat panel calls
 * this hook + sends in `/api/chat/apollo` request body.
 */
export function useApolloQueryContext(): {
  selectedFinding: ApolloFinding | null;
  glowingBuildingsCount: number;
  criticalCount: number;
} {
  return useAsclepiusStore((state) => {
    const selectedFinding = selectSelectedFinding(state);
    const glowingBuildingsCount = Object.keys(
      state.apollo.glowingBuildings,
    ).length;
    let criticalCount = 0;
    for (const severity of Object.values(state.apollo.glowingBuildings)) {
      if (severity === 'critical') criticalCount += 1;
    }
    return { selectedFinding, glowingBuildingsCount, criticalCount };
  });
}

/**
 * Glow window list selector. Reads the cached array maintained inside the
 * store mutations so the reference is stable across unrelated re-renders.
 */
export const selectGlowWindows = (
  state: AsclepiusStoreState,
): GlowWindowState[] => state.glowWindowList;

/**
 * Refactor selectors.
 */
export const selectRefactorSlice = (
  state: AsclepiusStoreState,
): RefactorProposalSlice => state.refactor;
