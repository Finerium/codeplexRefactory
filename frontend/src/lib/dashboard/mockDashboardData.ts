/**
 * [MOCK Wave 1, real Wave 3 Demeter]
 *
 * Hardcoded dashboard payload shaped per `DashboardData`. Selene Wave 1 wires
 * this into `useDashboardData` so the dashboard route renders end-to-end without
 * backend. Wave 3 Demeter swaps with a Postgres event-store query (same shape,
 * Pydantic alias generator emits matching camelCase JSON).
 *
 * Voice anchors per Designer Prompt 3 intent.md:
 * - briefing: "Sprint 14 ships in 3 days. Velocity holding at 18 points.
 *   One drift pattern triggered in the auth district."
 * - KPI strip 4 tiles (Velocity, Cycle time, Change failure rate, Deploys).
 * - Pattern E (OpenSpec drift) is the firing site -> auth district highlight.
 *
 * Wave-Fixing cycle 1 (Selene rescue identity, 2026-05-13 01:47 WIB) adds
 * `deriveMockForQuery(query)` so D-1 (no-op repo / time-window switch) is fixed.
 * Derivation is deterministic + side-effect-free so Wave 3 Demeter real
 * endpoint swap stays drop-in (only the data SOURCE changes, the shape stays).
 */

import type {
  DashboardData,
  KPIMetric,
  RepoStatus,
  TimeRangeId,
  VelocityPoint,
} from './types';
import type { DashboardQuery } from './queries';

export const mockDashboardData: DashboardData = {
  briefing:
    'Sprint 14 ships in 3 days. Velocity holding at 18 points. One drift pattern triggered in the auth district.',
  currentSprint: 'Sprint 14',
  lastRefresh: '2026-05-12T08:42:00+07:00',
  kpis: [
    {
      id: 'velocity',
      label: 'Velocity',
      value: 18,
      unit: 'points',
      unitShort: 'pts',
      trend: 'flat',
      deltaPercent: 0,
      deltaUnit: 'pts',
      note: 'vs last sprint',
    },
    {
      id: 'cycle-time',
      label: 'Cycle time',
      value: 2.4,
      unit: 'days',
      unitShort: 'd',
      trend: 'down',
      deltaPercent: -8,
      deltaUnit: '%',
      note: 'p50, last 30 days',
    },
    {
      id: 'change-failure-rate',
      label: 'Change failure rate',
      value: 6.1,
      unit: 'percent',
      unitShort: '%',
      trend: 'up',
      deltaPercent: 1.2,
      deltaUnit: 'pp',
      note: 'rolling 4 weeks',
    },
    {
      id: 'deploys-this-week',
      label: 'Deploys this week',
      value: 11,
      unit: 'count',
      trend: 'up',
      deltaPercent: 2,
      deltaUnit: '',
      note: 'vs last week',
    },
  ],
  burndown: [
    { day: 0, idealRemaining: 50, actualRemaining: 50 },
    { day: 1, idealRemaining: 45, actualRemaining: 48 },
    { day: 2, idealRemaining: 40, actualRemaining: 44 },
    { day: 3, idealRemaining: 35, actualRemaining: 41 },
    { day: 4, idealRemaining: 30, actualRemaining: 36 },
    { day: 5, idealRemaining: 25, actualRemaining: 30 },
    { day: 6, idealRemaining: 20, actualRemaining: 25 },
    { day: 7, idealRemaining: 15, actualRemaining: 20 },
    { day: 8, idealRemaining: 10, actualRemaining: 14 },
    { day: 9, idealRemaining: 5, actualRemaining: 9 },
    { day: 10, idealRemaining: 0, actualRemaining: 5 },
  ],
  burndownMeta: {
    sprintLabel: 'Sprint 14',
    todayIndex: 8,
    daysToShip: 3,
    pointsRemaining: 14,
    pointsTotal: 50,
  },
  velocity: [
    { sprintLabel: 'S7', pointsCompleted: 14, endDate: '2026-01-30' },
    { sprintLabel: 'S8', pointsCompleted: 16, endDate: '2026-02-13' },
    { sprintLabel: 'S9', pointsCompleted: 15, endDate: '2026-02-27' },
    { sprintLabel: 'S10', pointsCompleted: 19, endDate: '2026-03-13' },
    { sprintLabel: 'S11', pointsCompleted: 17, endDate: '2026-03-27' },
    { sprintLabel: 'S12', pointsCompleted: 16, endDate: '2026-04-10' },
    { sprintLabel: 'S13', pointsCompleted: 18, endDate: '2026-04-24' },
    { sprintLabel: 'S14', pointsCompleted: 18, endDate: '2026-05-15', isCurrent: true },
  ],
  milestones: [
    {
      id: 'm-1',
      label: 'Manager dashboard v1',
      percentComplete: 72,
      daysRemaining: 3,
      blockersCount: 1,
    },
    {
      id: 'm-2',
      label: 'OpenSpec dual-folder',
      percentComplete: 90,
      daysRemaining: 1,
      blockersCount: 0,
    },
  ],
  contributors: [
    {
      githubLogin: 'finerium',
      displayName: 'Ghaisan Badruzaman',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
      prsOpened: 7,
      prsMerged: 5,
      reviewsSubmitted: 9,
      linesAdded: 1820,
      linesDeleted: 740,
      issuesOpened: 3,
      issuesClosed: 4,
    },
    {
      githubLogin: 'hafizfauzan',
      displayName: 'Hafiz Fauzan',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
      prsOpened: 5,
      prsMerged: 4,
      reviewsSubmitted: 6,
      linesAdded: 1240,
      linesDeleted: 380,
      issuesOpened: 2,
      issuesClosed: 3,
    },
    {
      githubLogin: 'athena-ai',
      displayName: 'Athena (resident)',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
      prsOpened: 4,
      prsMerged: 3,
      reviewsSubmitted: 11,
      linesAdded: 980,
      linesDeleted: 1120,
      issuesOpened: 1,
      issuesClosed: 2,
    },
    {
      githubLogin: 'argus-ai',
      displayName: 'Argus (resident)',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
      prsOpened: 3,
      prsMerged: 2,
      reviewsSubmitted: 14,
      linesAdded: 420,
      linesDeleted: 180,
      issuesOpened: 5,
      issuesClosed: 4,
    },
    {
      githubLogin: 'apollo-ai',
      displayName: 'Apollo (resident)',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
      prsOpened: 2,
      prsMerged: 2,
      reviewsSubmitted: 7,
      linesAdded: 360,
      linesDeleted: 220,
      issuesOpened: 1,
      issuesClosed: 2,
    },
    {
      githubLogin: 'clio-ai',
      displayName: 'Clio (resident)',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4',
      prsOpened: 2,
      prsMerged: 1,
      reviewsSubmitted: 5,
      linesAdded: 280,
      linesDeleted: 90,
      issuesOpened: 0,
      issuesClosed: 1,
    },
  ],
  drifts: [
    {
      pattern: 'A',
      patternLabel: 'Stale closed issue',
      patternDescription: 'closed > 30 days, no follow-up linked',
      severity: 'low',
      severityLevel: 1,
      trend: 'flat',
      count: 4,
      resolutionRate: 0.82,
    },
    {
      pattern: 'B',
      patternLabel: 'Closed without merge',
      patternDescription: 'PR closed, branch alive, no replacement PR',
      severity: 'medium',
      severityLevel: 2,
      trend: '+1',
      count: 2,
      resolutionRate: 0.55,
    },
    {
      pattern: 'C',
      patternLabel: 'Spec-implementation lag',
      patternDescription: 'merged code not reflected in OpenSpec change',
      severity: 'medium',
      severityLevel: 3,
      trend: 'flat',
      count: 3,
      resolutionRate: 0.6,
    },
    {
      pattern: 'D',
      patternLabel: 'Reopened cycle',
      patternDescription: 'issue closed and reopened > 2 times in 14 days',
      severity: 'high',
      severityLevel: 4,
      trend: '-1',
      count: 1,
      resolutionRate: 0.4,
    },
    {
      pattern: 'E',
      patternLabel: 'OpenSpec drift',
      patternDescription: 'Folder A spec ahead of merged implementation',
      district: 'auth',
      severity: 'critical',
      severityLevel: 5,
      trend: '+2',
      count: 1,
      resolutionRate: 0.15,
    },
  ],
  refactorProposals: [
    {
      id: 'refactor-auth-session-store',
      title: 'Split session store from auth router',
      stage: 'proposed',
      authorResident: 'Athena',
      authorLogin: '',
      ageLabel: '2h ago',
      createdAt: '2026-05-12T06:30:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-auth-session-store',
    },
    {
      id: 'refactor-event-bus-pubsub',
      title: 'Migrate event bus to typed pubsub',
      stage: 'proposed',
      authorResident: 'Athena',
      authorLogin: '',
      ageLabel: '5h ago',
      createdAt: '2026-05-12T03:30:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-event-bus-pubsub',
    },
    {
      id: 'refactor-tree-sitter-lazy',
      title: 'Lazy-load tree-sitter language packs',
      stage: 'proposed',
      authorResident: 'user',
      authorLogin: 'finerium',
      ageLabel: '1d ago',
      createdAt: '2026-05-11T09:30:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-tree-sitter-lazy',
    },
    {
      id: 'refactor-llm-gateway-retry',
      title: 'Add retry simplified prompt to LLM gateway',
      stage: 'simulating',
      authorResident: 'Athena',
      authorLogin: '',
      ageLabel: '6h ago',
      createdAt: '2026-05-12T02:30:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-llm-gateway-retry',
    },
    {
      id: 'refactor-postgres-connection-pool',
      title: 'Tune Postgres connection pool defaults',
      stage: 'simulating',
      authorResident: 'user',
      authorLogin: 'hafizfauzan',
      ageLabel: '12h ago',
      createdAt: '2026-05-11T20:30:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-postgres-connection-pool',
    },
    {
      id: 'refactor-resident-cache',
      title: 'Add semantic cache to resident replies',
      stage: 'drafted',
      authorResident: 'Athena',
      authorLogin: '',
      ageLabel: '1d ago',
      createdAt: '2026-05-11T09:00:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-resident-cache',
    },
    {
      id: 'refactor-three-instanced-mesh',
      title: 'Switch city render to instancedMesh raw',
      stage: 'drafted',
      authorResident: 'user',
      authorLogin: 'finerium',
      ageLabel: '2d ago',
      createdAt: '2026-05-10T09:00:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-three-instanced-mesh',
    },
    {
      id: 'refactor-openspec-dual-folder',
      title: 'Dual-folder OpenSpec strategy A vs B',
      stage: 'accepted',
      authorResident: 'Athena',
      authorLogin: '',
      ageLabel: '3d ago',
      createdAt: '2026-05-09T09:00:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-openspec-dual-folder',
    },
    {
      id: 'refactor-fastapi-tree-sitter-init',
      title: 'Boot-time tree-sitter lazy init',
      stage: 'archived',
      authorResident: 'user',
      authorLogin: 'hafizfauzan',
      ageLabel: '6d ago',
      createdAt: '2026-05-06T09:00:00+07:00',
      openspecChangePath: 'openspec/changes/refactor-fastapi-tree-sitter-init',
    },
  ],
  repos: [
    {
      fullName: 'Finerium/codeplexRefactory',
      label: 'codeplexRefactory',
      branch: 'main',
      openPRs: 4,
      openIssues: 7,
      driftCount: 1,
      statusDot: 'green',
      sparkline: [3, 5, 6, 4, 7, 5, 8, 6, 7, 9, 6, 7, 8, 7],
    },
    {
      fullName: 'Finerium/codeplex-demo-nodegoat',
      label: 'nodegoat-demo',
      branch: 'main',
      openPRs: 2,
      openIssues: 5,
      driftCount: 4,
      statusDot: 'red',
      sparkline: [1, 2, 1, 3, 2, 4, 2, 3, 1, 2, 3, 1, 2, 2],
    },
    {
      fullName: 'Finerium/codeplex-demo-fastapi-fullstack',
      label: 'fastapi-fullstack',
      branch: 'main',
      openPRs: 3,
      openIssues: 4,
      driftCount: 0,
      statusDot: 'green',
      sparkline: [2, 4, 3, 5, 6, 4, 7, 5, 6, 7, 6, 8, 7, 9],
    },
    {
      fullName: 'Finerium/codeplex-residents',
      label: 'residents',
      branch: 'main',
      openPRs: 1,
      openIssues: 3,
      driftCount: 2,
      statusDot: 'yellow',
      sparkline: [4, 3, 5, 4, 3, 5, 4, 3, 5, 4, 3, 5, 4, 4],
    },
    {
      fullName: 'Finerium/codeplex-infra',
      label: 'codeplex-infra',
      branch: 'main',
      openPRs: 0,
      openIssues: 1,
      driftCount: 0,
      statusDot: 'green',
      sparkline: [1, 2, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 2, 2],
    },
  ],
  cityPreviewMeta: {
    repoSlug: 'Finerium/codeplexRefactory',
    districtCount: 6,
    flaggedDistrict: 'auth',
    lastBuildAt: '2026-05-12T08:18:00+07:00',
    citizenCount: 4200,
  },
};

/* ---------------------------------------------------------------------------
 * Wave-Fixing cycle 1: deriveMockForQuery
 *
 * Bug D-1: dropdown + segmented control change labels only on Wave 1 mock path
 * because `useDashboardData({ range: 'sprint', repo: 'all' })` was hardcoded.
 * This derivation reads the live (repo, range) query and returns a DashboardData
 * variant with visibly different KPI / velocity / burndown / contributor /
 * drift / city preview numbers per tuple. Deterministic, no randomness, no I/O.
 *
 * Wave 3 Demeter swap: this function becomes dead code once `fetch('/api/dashboard?...')`
 * lands. Until then the panitia perceive a real refetch on each switch.
 * ------------------------------------------------------------------------- */

/** Per-repo scalar multipliers for the headline KPIs + repo highlight. */
const REPO_SCALARS: Record<
  string,
  {
    velocityMul: number;
    cycleTimeMul: number;
    cfrAdd: number;
    deploysMul: number;
    burndownLag: number; // points above ideal at todayIndex
    driftBoost: number; // multiplier on per-pattern count
    flaggedDistrict: string | null;
    districtCount: number;
    citizenCount: number;
    sprintLabel: string;
    daysToShip: number;
    briefingTemplate: (
      sprintLabel: string,
      daysToShip: number,
      velocity: number,
      flaggedDistrict: string | null,
    ) => string;
  }
> = {
  'all': {
    velocityMul: 1,
    cycleTimeMul: 1,
    cfrAdd: 0,
    deploysMul: 1,
    burndownLag: 4,
    driftBoost: 1,
    flaggedDistrict: 'auth',
    districtCount: 6,
    citizenCount: 4200,
    sprintLabel: 'Sprint 14',
    daysToShip: 3,
    briefingTemplate: (s, d, v, fd) =>
      `${s} ships in ${d} days. Velocity holding at ${v} points. ${fd ? `One drift pattern triggered in the ${fd} district.` : 'No drift patterns triggered.'}`,
  },
  'Finerium/codeplexRefactory': {
    velocityMul: 1,
    cycleTimeMul: 1,
    cfrAdd: 0,
    deploysMul: 1,
    burndownLag: 4,
    driftBoost: 1,
    flaggedDistrict: 'auth',
    districtCount: 6,
    citizenCount: 4200,
    sprintLabel: 'Sprint 14',
    daysToShip: 3,
    briefingTemplate: (s, d, v, fd) =>
      `${s} ships in ${d} days. Velocity holding at ${v} points. ${fd ? `One drift pattern triggered in the ${fd} district.` : 'No drift patterns triggered.'}`,
  },
  'Finerium/codeplex-demo-nodegoat': {
    velocityMul: 0.55, // smaller team
    cycleTimeMul: 1.6, // legacy node, slower cycle
    cfrAdd: 4.2, // OWASP intentional vulns -> high CFR
    deploysMul: 0.35,
    burndownLag: 9, // way behind ideal
    driftBoost: 2.5, // 4 drift events vs 1
    flaggedDistrict: 'auth',
    districtCount: 4,
    citizenCount: 1850,
    sprintLabel: 'Sprint 7',
    daysToShip: 6,
    briefingTemplate: (s, d, v, fd) =>
      `${s} ships in ${d} days. Velocity drifting at ${v} points. ${fd ? `Four drift patterns triggered, ${fd} district under remediation.` : 'No drift patterns triggered.'}`,
  },
  'Finerium/codeplex-demo-fastapi-fullstack': {
    velocityMul: 1.2,
    cycleTimeMul: 0.75, // tidy fastapi template, fast cycle
    cfrAdd: -2.1,
    deploysMul: 1.6,
    burndownLag: 1, // tracking close to ideal
    driftBoost: 0, // clean repo
    flaggedDistrict: null,
    districtCount: 8,
    citizenCount: 5600,
    sprintLabel: 'Sprint 12',
    daysToShip: 2,
    briefingTemplate: (s, d, v, fd) =>
      `${s} ships in ${d} days. Velocity strong at ${v} points. ${fd ? `Drift pattern in ${fd} district.` : 'No drift patterns triggered, city is calm.'}`,
  },
  'Finerium/codeplex-residents': {
    velocityMul: 0.85,
    cycleTimeMul: 1.1,
    cfrAdd: 0.5,
    deploysMul: 0.9,
    burndownLag: 6,
    driftBoost: 1.4,
    flaggedDistrict: 'observability',
    districtCount: 5,
    citizenCount: 2400,
    sprintLabel: 'Sprint 9',
    daysToShip: 4,
    briefingTemplate: (s, d, v, fd) =>
      `${s} ships in ${d} days. Velocity steady at ${v} points. ${fd ? `One drift pattern triggered in the ${fd} district.` : 'Quiet sprint.'}`,
  },
  'Finerium/codeplex-infra': {
    velocityMul: 0.4, // infra repo small commit volume
    cycleTimeMul: 0.6,
    cfrAdd: -3.5,
    deploysMul: 1.3,
    burndownLag: 0,
    driftBoost: 0,
    flaggedDistrict: null,
    districtCount: 3,
    citizenCount: 720,
    sprintLabel: 'Sprint 21',
    daysToShip: 1,
    briefingTemplate: (s, d, v, fd) =>
      `${s} ships in ${d} days. Velocity stable at ${v} points. ${fd ? `Drift in ${fd} district.` : 'No drift patterns triggered.'}`,
  },
};

/** Range-specific scalar - widens windows shrink momentary noise. */
const RANGE_SCALARS: Record<
  TimeRangeId,
  { velocityWindowMul: number; deltaPercentBias: number; rangeLabel: string }
> = {
  today: { velocityWindowMul: 0.18, deltaPercentBias: -5, rangeLabel: 'today' },
  sprint: { velocityWindowMul: 1.0, deltaPercentBias: 0, rangeLabel: 'this sprint' },
  quarter: { velocityWindowMul: 6.4, deltaPercentBias: 8, rangeLabel: 'this quarter' },
};

function getRepoScalar(repo: string) {
  return REPO_SCALARS[repo] ?? REPO_SCALARS['all']!;
}

function getRangeScalar(range: TimeRangeId) {
  return RANGE_SCALARS[range] ?? RANGE_SCALARS.sprint;
}

function roundOne(n: number): number {
  return Math.round(n * 10) / 10;
}

function deriveKpis(
  base: KPIMetric[],
  repo: string,
  range: TimeRangeId,
): KPIMetric[] {
  const r = getRepoScalar(repo);
  const t = getRangeScalar(range);
  return base.map((k) => {
    if (k.id === 'velocity') {
      const v = Math.max(1, Math.round(k.value * r.velocityMul * t.velocityWindowMul));
      return { ...k, value: v, deltaPercent: roundOne(k.deltaPercent + t.deltaPercentBias / 2) };
    }
    if (k.id === 'cycle-time') {
      return {
        ...k,
        value: roundOne(k.value * r.cycleTimeMul),
        deltaPercent: roundOne(k.deltaPercent - t.deltaPercentBias / 3),
      };
    }
    if (k.id === 'change-failure-rate') {
      return {
        ...k,
        value: Math.max(0, roundOne(k.value + r.cfrAdd)),
        deltaPercent: roundOne(k.deltaPercent + t.deltaPercentBias / 6),
      };
    }
    if (k.id === 'deploys-this-week') {
      const v = Math.max(0, Math.round(k.value * r.deploysMul * t.velocityWindowMul));
      return { ...k, value: v, deltaPercent: Math.round(k.deltaPercent + t.deltaPercentBias / 4) };
    }
    return k;
  });
}

function deriveVelocity(
  base: VelocityPoint[],
  repo: string,
  range: TimeRangeId,
): VelocityPoint[] {
  const r = getRepoScalar(repo);
  // quarter shows last 8 sprints raw; sprint highlights last 4; today narrow.
  const slice =
    range === 'today' ? base.slice(-3) : range === 'quarter' ? base : base.slice(-6);
  return slice.map((p, i) => ({
    ...p,
    pointsCompleted: Math.max(1, Math.round(p.pointsCompleted * r.velocityMul)),
    isCurrent: i === slice.length - 1,
  }));
}

function deriveBurndown(repo: string): {
  burndown: DashboardData['burndown'];
  meta: DashboardData['burndownMeta'];
} {
  const r = getRepoScalar(repo);
  const pointsTotal = Math.max(20, Math.round(50 * r.velocityMul + 10));
  const todayIndex = 8;
  const dailyIdeal = pointsTotal / 10;
  const burndown = Array.from({ length: 11 }, (_, day) => {
    const ideal = Math.max(0, Math.round(pointsTotal - dailyIdeal * day));
    const actual =
      day <= todayIndex
        ? Math.max(0, Math.round(ideal + (r.burndownLag * (day / todayIndex))))
        : Math.max(0, Math.round(ideal + r.burndownLag * 0.5));
    return { day, idealRemaining: ideal, actualRemaining: actual };
  });
  return {
    burndown,
    meta: {
      sprintLabel: r.sprintLabel,
      todayIndex,
      daysToShip: r.daysToShip,
      pointsRemaining: burndown[todayIndex]!.actualRemaining,
      pointsTotal,
    },
  };
}

function deriveDrifts(repo: string): DashboardData['drifts'] {
  const r = getRepoScalar(repo);
  return mockDashboardData.drifts.map((d) => {
    const scaledCount = Math.max(0, Math.round(d.count * r.driftBoost));
    // Pattern E district follows repo highlight when boost > 0; clear otherwise.
    if (d.pattern === 'E') {
      const district = r.flaggedDistrict ?? undefined;
      const dropped: { count: number; district?: string } = { count: scaledCount };
      if (district !== undefined) dropped.district = district;
      return { ...d, ...dropped, severityLevel: scaledCount > 0 ? 5 : 1 };
    }
    return { ...d, count: scaledCount };
  });
}

function deriveActiveRepo(base: RepoStatus[], _repo: string): RepoStatus[] {
  // Wave-Fixing cycle 1: rail keeps the full repo list so the user always sees
  // every connected repo. The active highlight is handled in CrossRepoRail via
  // activeFullName prop. Reserved for Wave 3 Demeter when per-repo status_dot
  // is recomputed against fresh event store snapshot.
  return base;
}

/**
 * Wave-Fixing cycle 1: deterministic per-(repo, range) variant generator.
 * Returns a fully-typed DashboardData with KPI / velocity / burndown / drift /
 * briefing / city preview corner adjusted so the panitia perceive a real refetch.
 */
export function deriveMockForQuery(query: DashboardQuery): DashboardData {
  const repo = query.repo;
  const range = query.range;
  const r = getRepoScalar(repo);
  // range scalar applied per-section inside the derivation helpers; the top-level
  // function does not need the t object itself.

  const kpis = deriveKpis(mockDashboardData.kpis, repo, range);
  const velocity = deriveVelocity(mockDashboardData.velocity, repo, range);
  const { burndown, meta: burndownMeta } = deriveBurndown(repo);
  const drifts = deriveDrifts(repo);
  const velocityKpi = kpis.find((k) => k.id === 'velocity');
  const velocityValue = velocityKpi ? Math.round(velocityKpi.value) : 18;
  const briefing = r.briefingTemplate(
    r.sprintLabel,
    r.daysToShip,
    velocityValue,
    r.flaggedDistrict,
  );

  const cityPreviewMeta: DashboardData['cityPreviewMeta'] = {
    repoSlug: repo === 'all' ? 'Finerium/codeplexRefactory' : repo,
    districtCount: r.districtCount,
    flaggedDistrict: r.flaggedDistrict,
    lastBuildAt: '2026-05-13T01:30:00+07:00',
    citizenCount: r.citizenCount,
  };

  const lastRefresh = new Date().toISOString();

  return {
    ...mockDashboardData,
    briefing,
    kpis,
    velocity,
    burndown,
    burndownMeta,
    drifts,
    cityPreviewMeta,
    currentSprint: r.sprintLabel,
    lastRefresh,
    repos: deriveActiveRepo(mockDashboardData.repos, repo),
  };
}
