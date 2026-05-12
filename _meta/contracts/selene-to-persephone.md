# Contract: Selene to Persephone

**Edge type**: cross-wave (Wave 1 to Wave 2)
**Wave**: Wave 1 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 15:14 WIB

## Producer

**Worker**: Selene (Wave 1)
**Domain**: Dashboard execution at `frontend/app/dashboard/page.tsx` per Designer Prompt 3 bundle. 7 dashboard panel data shapes (velocity, burndown, milestone progress, contributor analytics, spec-drift summary, refactor proposal status, cross-repo summary) + embedded city preview corner + OQ-02 charts library decision + OQ-03 UI library decision (recommendation shadcn).

## Consumer

**Worker**: Persephone (Wave 2)
**Domain**: AI residents chat panel UI + ticket panel UI + side panel UI + glassmorphism styling. Persephone consumes Selene's data shape definitions to maintain consistency across dashboard panels and city-view side panels (the side panel shows similar data but in a different visual context inside the City View).

## Output schema (producer to consumer)

Selene defines the canonical data shapes; Persephone reuses these for side panel mode variants (refactor + health + activity).

```typescript
// frontend/src/lib/dashboard/types.ts (Selene authors, Persephone consumes)

export interface VelocityPoint {
  /** Sprint identifier (e.g., "Sprint 14"). */
  sprintLabel: string;
  /** Story points completed in this sprint. */
  pointsCompleted: number;
  /** Sprint end date ISO 8601. */
  endDate: string;
}

export interface BurndownPoint {
  /** Day index within sprint, 0-based. */
  day: number;
  /** Ideal points remaining per linear burndown. */
  idealRemaining: number;
  /** Actual points remaining at end of this day. */
  actualRemaining: number;
}

export interface MilestoneProgress {
  /** Milestone ID + label. */
  id: string;
  label: string;
  /** Percent complete 0..100. */
  percentComplete: number;
  /** Days remaining until milestone target date; negative if overdue. */
  daysRemaining: number;
  /** Open issue count blocking milestone. */
  blockersCount: number;
}

export interface ContributorStats {
  githubLogin: string;
  avatarUrl: string;
  /** Pull requests opened this sprint. */
  prsOpened: number;
  /** Pull requests merged this sprint. */
  prsMerged: number;
  /** Lines added in merged PRs this sprint. */
  linesAdded: number;
  /** Lines deleted in merged PRs this sprint. */
  linesDeleted: number;
  /** Issues created this sprint. */
  issuesOpened: number;
  /** Issues closed this sprint. */
  issuesClosed: number;
}

/** Spec-drift pattern identifier per PRD Section 11. */
export type DriftPattern = 'A' | 'B' | 'C' | 'D' | 'E';

export interface DriftSummary {
  pattern: DriftPattern;
  /** Display label for the pattern (e.g., "Stale closed issue"). */
  patternLabel: string;
  /** Count of detected occurrences in current scan window. */
  count: number;
  /** Severity bucket; encoding per Designer instrument-panel intent.md. */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  /** Resolution rate 0..1 (drifts addressed this period / total). */
  resolutionRate: number;
}

export type RefactorStage =
  | 'proposed'
  | 'simulating'
  | 'drafted'
  | 'accepted'
  | 'archived';

export interface RefactorProposal {
  /** Stable proposal id; matches OpenSpec change folder name. */
  id: string;
  /** Short title from proposal.md. */
  title: string;
  /** Workflow stage. */
  stage: RefactorStage;
  /** Author resident (Athena owns most; "user" for human-authored). */
  authorResident: 'Athena' | 'user';
  /** Created at ISO 8601. */
  createdAt: string;
  /** Linked OpenSpec change folder relative path (Folder A). */
  openspecChangePath: string;
}

export interface RepoStatus {
  /** Repository full name (owner/repo). */
  fullName: string;
  /** Display label, short form. */
  label: string;
  /** Open PRs count. */
  openPRs: number;
  /** Open issues count. */
  openIssues: number;
  /** Status dot color: green (ok), yellow (warning), red (critical), gray (idle). */
  statusDot: 'green' | 'yellow' | 'red' | 'gray';
  /** Sparkline data (last 14 days commit count). */
  sparkline: number[];
}

export interface KPIMetric {
  /** Metric identifier. */
  id: 'velocity' | 'cycle-time' | 'change-failure-rate' | 'deploys-this-week';
  /** Display label. */
  label: string;
  /** Current value (numeric, units in `unit` field). */
  value: number;
  unit: 'points' | 'days' | 'percent' | 'count';
  /** Percent change vs previous period; signed. */
  deltaPercent: number;
}

export interface DashboardData {
  /** One-sentence briefing displayed at top, template-filled. */
  briefing: string;
  kpis: KPIMetric[];
  velocity: VelocityPoint[];        // Last 8 sprints
  burndown: BurndownPoint[];        // Current sprint
  milestones: MilestoneProgress[];
  contributors: ContributorStats[];
  drifts: DriftSummary[];           // 5 patterns A-E
  refactorProposals: RefactorProposal[];
  repos: RepoStatus[];              // Cross-repo rail
  /** Current sprint label. */
  currentSprint: string;
  /** Last data refresh time ISO 8601. */
  lastRefresh: string;
}
```

Selene exposes a fetch hook + mock loader:

```typescript
// frontend/src/lib/dashboard/useDashboardData.ts (Selene)

/** Returns dashboard data; Wave 1 mock JSON, Wave 3 real Postgres query via Demeter. */
export const useDashboardData: (options?: {
  timeRange?: 'today' | 'sprint' | 'quarter';
  repoFilter?: string;
}) => {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
};
```

Persephone consumes for side panel mode variants:

```tsx
// frontend/components/panels/SidePanel.tsx (Persephone Wave 2)
import {
  RefactorProposal,
  DriftSummary,
  ContributorStats,
} from '@/lib/dashboard/types';

interface SidePanelProps {
  mode: 'refactor' | 'health' | 'activity';
  // mode === 'refactor': displays RefactorProposal detail
  // mode === 'health': displays DriftSummary detail + Apollo findings
  // mode === 'activity': displays ContributorStats detail + ownership heatmap
}
```

## Storage location

- Types: `frontend/src/lib/dashboard/types.ts` (Selene authors)
- Hook: `frontend/src/lib/dashboard/useDashboardData.ts` (Selene authors with Wave 1 mock + Wave 3 backend swap)
- Mock data: `frontend/src/lib/dashboard/mockDashboardData.ts` (Selene Wave 1; sample data shaped per types)
- Wave 3 backend swap: hook implementation calls `fetch('/api/dashboard?range=sprint')` returning DashboardData JSON (see `demeter-to-selene.md` for Demeter event-store query layer contract)

## Asumption baked

1. shadcn UI library decision (OQ-03) locked at Selene Wave 1 per Metis recommendation; Persephone Wave 2 consumes same library, no re-debate.
2. DashboardData is the canonical shape for both dashboard route AND side panel mode variants. Persephone does NOT define alternate shapes for side panel; reuses Selene's types.
3. Recharts charts library decision (OQ-02) locked at Selene Wave 1; component implementations Persephone uses for any chart visuals in side panel match Recharts pattern.
4. Spec-drift patterns A-E identifiers match PRD Section 11 enumeration verbatim. If PRD revises mid-hackathon, Selene updates type + Persephone re-uses (single source of truth).
5. Refactor proposal stage enum matches OpenSpec workflow: proposed -> simulating -> drafted -> accepted -> archived. No alternate states.
6. Wave 1 mock data ships in component bundle (small JSON); Wave 3 lazy-loads via SWR or React Query cache with revalidation.

## Validation steps

**Producer responsibility (Selene)**:
- All types in `types.ts` exported and re-exported via `frontend/src/lib/dashboard/index.ts`.
- Mock data passes TypeScript strict-mode check (no `any`, no `unknown`).
- Hook returns stable reference (memoization) when data unchanged.
- 7 panel components consume types correctly, no inline type definitions.
- TypeScript build smoke test: `pnpm tsc --noEmit` returns 0 errors on dashboard route.

**Consumer responsibility (Persephone)**:
- Import types from `@/lib/dashboard/types`, NOT redefine.
- Side panel mode variant components consume RefactorProposal/DriftSummary/ContributorStats directly.
- Glassmorphism styling on resident vignette cards consumes Designer cross-page anchor tokens.
- shadcn UI library used for buttons, dialogs, tooltips; consistency win with Selene dashboard.
- Smoke test: 3 panel mode variants render in side slot, types verified via TS build.

## Edge case handling

- Empty data sets (no PRs, no contributors, no drifts): Selene returns empty arrays; Persephone displays empty state placeholders per Designer intent.md.
- Network error fetching real data Wave 3: Selene's hook returns `error` field; Persephone displays "Data unavailable" graceful fallback.
- Time range filter switches mid-load: Selene cancels previous fetch, latest wins.
- Large data sets (100+ contributors, 50+ drifts): Selene paginates if needed; Persephone respects pagination in side panel detail views.

## Open questions

- OQ-03 UI library lockdown: Selene chooses shadcn Wave 1 per Metis recommendation. If Persephone Wave 2 finds shadcn insufficient for any specific panel feature, ferry V1 Orch BEFORE switching (consistency win is mandatory per Persephone scope).
- Embedded city preview Argus animation data: separate from DashboardData; Selene mounts independent r3f Canvas with Argus component, no Persephone touch.

## Reference

- Metis Agentic Structure md Section 2 DAG: Selene dashboard data shape consumed by Persephone panel mounting
- Metis Section 5.2 Selene + Section 5.4 Persephone ship criteria
- Designer doc `_meta/designer/prompt-design_codeplex-chronicle.md` Prompt 3 (Dashboard)
- PRD Section 9.4 (Activity Mode) + Section 9.5 (Health Mode) + Section 11 (spec-drift patterns A-E)
- PRD Section 25 OQ-02 + OQ-03
- Pythia decision log 2026-05-12 (OQ-03 shadcn recommendation locked)
