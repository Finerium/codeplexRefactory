// Mock data for the Codeplex Chronicle dashboard.

const REPOS = [
  { id: 'chronicle-core',  name: 'codeplex/chronicle-core',  branch: 'main',        status: 'ok',    open: 23, drift: 1, spark: [12,14,13,16,18,17,19,18] },
  { id: 'auth-service',    name: 'codeplex/auth-service',    branch: 'main',        status: 'alert', open: 8,  drift: 4, spark: [10,9,11,8,7,9,8,7] },
  { id: 'observability',   name: 'codeplex/observability',   branch: 'release/4.2',  status: 'ok',    open: 5,  drift: 0, spark: [4,5,4,5,6,6,7,7] },
  { id: 'spatial-render',  name: 'codeplex/spatial-render',  branch: 'main',        status: 'warn',  open: 11, drift: 2, spark: [9,10,12,11,13,12,11,12] },
  { id: 'opsx-protocol',   name: 'codeplex/opsx-protocol',   branch: 'rfc/0014',    status: 'ok',    open: 3,  drift: 0, spark: [2,3,3,4,4,5,5,6] },
];

const KPIS = [
  { label: 'Velocity',           value: 18,   unit: 'pts',     delta: +12, deltaUnit: '%',  trend: 'up',   note: 'vs 8-sprint avg' },
  { label: 'Cycle time',         value: 2.1,  unit: 'days',    delta: -8,  deltaUnit: '%',  trend: 'down', note: 'PR open → merged, median' },
  { label: 'Change failure',     value: 4.2,  unit: '%',       delta: 0,   deltaUnit: 'pt', trend: 'flat', note: 'rolling 4 weeks' },
  { label: 'Deploys this week',  value: 14,   unit: '',        delta: +3,  deltaUnit: '',   trend: 'up',   note: 'vs last week' },
];

// Burndown — sprint days 0..10; ideal vs actual story points remaining
const BURNDOWN = {
  ideal:  [50,45,40,35,30,25,20,15,10, 5, 0],
  actual: [50,49,46,42,38,34,32,27,23, 0, 0],   // last two days projected (rendered dashed)
  projected_from: 8,
  day_index: 8, // sprint day 8 of 10
  days_to_ship: 3,
};

// Velocity over the last 8 sprints
const VELOCITY = [
  { sprint: 7,  points: 14 },
  { sprint: 8,  points: 16 },
  { sprint: 9,  points: 15 },
  { sprint: 10, points: 17 },
  { sprint: 11, points: 19 },
  { sprint: 12, points: 16 },
  { sprint: 13, points: 18 },
  { sprint: 14, points: 18, current: true },
];

const CONTRIBUTORS = [
  { name: 'Ghaisan K. Badruzaman', handle: 'ghbadr',     prs: 9, reviews: 14, additions: 1240 },
  { name: 'Hafiz Fauzan',          handle: 'hafzn',      prs: 7, reviews: 11, additions:  890 },
  { name: 'Anya Rahmadhani',       handle: 'arahma',     prs: 6, reviews: 18, additions:  710 },
  { name: 'Bayu Nugroho',          handle: 'bnugr',      prs: 5, reviews:  9, additions:  640 },
  { name: 'Citra Pertiwi',         handle: 'cpertiwi',   prs: 4, reviews:  8, additions:  480 },
  { name: 'Devanto Wijaya',        handle: 'dwijaya',    prs: 3, reviews:  6, additions:  370 },
];

// Five spec drift patterns — A..E, severity intentionally varied
const DRIFT_PATTERNS = [
  {
    code: 'A', severity: 2,
    title: 'Stale closed issue',
    desc:  'Issue closed >6 months but file still edited after.',
    count: 14, trend: '+2',
  },
  {
    code: 'B', severity: 1,
    title: 'Closed without merge',
    desc:  'Issue closed without a relevant PR merged.',
    count: 6, trend: '–1',
  },
  {
    code: 'C', severity: 3,
    title: 'Spec-implementation lag',
    desc:  'Gap between close timestamp and last file commit.',
    count: 22, trend: '+5',
  },
  {
    code: 'D', severity: 2,
    title: 'Reopened cycle',
    desc:  'Issue reopened twice or more.',
    count: 4, trend: '0',
  },
  {
    code: 'E', severity: 5,
    title: 'OpenSpec drift',
    desc:  'Commit touches a file in an archived spec without opsx: prefix.',
    count: 3, trend: '+1', district: 'auth',
  },
];

// Refactor proposal pipeline
const PROPOSALS_STAGES = [
  { id: 'proposed',  label: 'Proposed' },
  { id: 'running',   label: 'Running sim' },
  { id: 'drafted',   label: 'Drafted' },
  { id: 'accepted',  label: 'Accepted' },
  { id: 'archived',  label: 'Archived' },
];

const PROPOSALS = [
  { id: 'rp-201', stage: 'proposed',  title: 'Split auth/session into separate districts',           author: 'ghbadr', age: '2d' },
  { id: 'rp-202', stage: 'proposed',  title: 'Inline opsx: prefix linter into pre-commit hook',       author: 'arahma', age: '3d' },
  { id: 'rp-203', stage: 'proposed',  title: 'Collapse retry helpers in spatial-render::network',     author: 'hafzn',  age: '4d' },
  { id: 'rp-301', stage: 'running',   title: 'Replace nested context providers in core',              author: 'arahma', age: '1d' },
  { id: 'rp-302', stage: 'running',   title: 'Move telemetry batching out of render path',            author: 'bnugr',  age: '2d' },
  { id: 'rp-401', stage: 'drafted',   title: 'Extract token rotation into auth-service.tokens',       author: 'ghbadr', age: '5d' },
  { id: 'rp-402', stage: 'drafted',   title: 'Refactor citizen-pool into deterministic spawner',      author: 'cpertiwi', age: '1w' },
  { id: 'rp-501', stage: 'accepted',  title: 'Consolidate logging schemas under observability/v4',    author: 'hafzn',  age: '3d' },
  { id: 'rp-601', stage: 'archived',  title: 'Migrate edge cache to spatial-render gateway',          author: 'dwijaya', age: '6w' },
];

const TIME_RANGES = [
  { id: 'today',   label: 'Today' },
  { id: 'sprint',  label: 'This sprint' },
  { id: 'quarter', label: 'This quarter' },
];

Object.assign(window, {
  REPOS, KPIS, BURNDOWN, VELOCITY, CONTRIBUTORS, DRIFT_PATTERNS,
  PROPOSALS_STAGES, PROPOSALS, TIME_RANGES,
});
