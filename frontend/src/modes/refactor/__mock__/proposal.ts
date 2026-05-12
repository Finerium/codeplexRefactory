/**
 * Wave 2 mock Refactor proposal + simulation event sequence.
 *
 * [MOCK Wave 2, real Wave 3 Pandora]
 *
 * Owner: Asclepius (Wave 2).
 * Pythia contract anchor: `asclepius-to-pandora.md` Validation steps
 *   "Wave 2 mock: simulate stage progression via setTimeout for demo without
 *    Wave 3 backend."
 *
 * Demo scenario chosen: "Add 2FA to login" per PRD Section 16 Q&A defense
 * card Q3 hero example + Section 14 demo dataset. The proposal touches the
 * security district (Argus' Police Station district), suggests 2 new ghost
 * buildings (the 2FA verifier module + the migration unit), and connects
 * them to existing files via import edges.
 *
 * Compliance: Lock 5 [MOCK Wave 2, real Wave 3 Pandora] labeled here +
 * on the event pump. Lock 1 (no em dash). Lock 2 (no emoji).
 */

import type {
  GhostBuildingHint,
  RefactorProposalEvent,
  SimulationEvent,
} from '../simulationEvents';

/**
 * 2 ghost buildings positioned to the side of the security district so they
 * do not collide with the existing Iris InstancedMesh treemap layout. The
 * specific x/z offset is +5 to +10 world units away from the security
 * cluster, well outside the district bounds (Iris squarified treemap fits
 * the city within roughly [-60, +60] on x/z; ghosts at x >= 65 stay clear).
 */
export const MOCK_GHOST_BUILDINGS: GhostBuildingHint[] = [
  {
    ghostId: 'ghost-2fa-verifier',
    position: [68, 0, -22],
    archetype: 'generic-office',
    width: 6,
    depth: 6,
    height: 12,
    connections: [
      { targetBuildingId: 'backend/app/security/scanner.py', relationship: 'import' },
      { targetBuildingId: 'backend/app/security/auth.py', relationship: 'import' },
    ],
    label: '2FA verifier module',
    suggestedFilePath: 'backend/app/security/two_factor.py',
  },
  {
    ghostId: 'ghost-2fa-migration',
    position: [78, 0, -22],
    archetype: 'generic-warehouse',
    width: 5,
    depth: 5,
    height: 6,
    connections: [
      { targetBuildingId: 'backend/app/models/model_3.py', relationship: 'reference' },
    ],
    label: '2FA schema migration',
    suggestedFilePath: 'backend/migrations/2026_05_12_add_2fa.py',
  },
];

/**
 * Canonical mock proposal published at Turn 0. Wave 3 Pandora swaps with
 * real Athena V4-Pro thinking high output; the schema is stable.
 */
export const MOCK_PROPOSAL: RefactorProposalEvent = {
  type: 'simulation.proposal',
  simulationId: 'sim-mock-add-2fa-login',
  openspecChangePath: 'openspec/changes/add-2fa-login/',
  title: 'Add two-factor authentication to the login flow',
  summary:
    'Introduce a TOTP-based second factor on the login endpoint. Two new files land in security/: a verifier service and a database migration. Existing scanner.py + auth.py gain an import edge to the new verifier. Coverage target: the new module ships with a failing test that the simulation engine fills.',
  userIntent: 'I want to add 2FA to login.',
  ghostBuildings: MOCK_GHOST_BUILDINGS,
  timestamp: '2026-05-12T22:45:00+07:00',
};

/**
 * Helper: build the canonical 7-event sequence Pandora will publish per
 * simulation. Each entry includes a timestamp + stage + payload. The smoke
 * pump in `mockEventStream.ts` walks this array with a setTimeout cadence.
 */
export function buildMockEventSequence(): SimulationEvent[] {
  const base = '2026-05-12T22:45:';
  const sec = (s: number, ms: number) =>
    `${base}${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}+07:00`;

  return [
    {
      type: 'simulation.stage',
      simulationId: MOCK_PROPOSAL.simulationId,
      stage: 'tests_generating',
      timestamp: sec(2, 100),
      payload: { progressPercent: 10 },
    },
    {
      type: 'simulation.stage',
      simulationId: MOCK_PROPOSAL.simulationId,
      stage: 'tests_written',
      timestamp: sec(6, 400),
      payload: {
        progressPercent: 35,
        filesAffected: [
          'drafts/sim-mock-add-2fa-login/tests/test_two_factor.py',
        ],
      },
    },
    {
      type: 'simulation.stage',
      simulationId: MOCK_PROPOSAL.simulationId,
      stage: 'impl_generating',
      timestamp: sec(7, 100),
      payload: { progressPercent: 45 },
    },
    {
      type: 'simulation.stage',
      simulationId: MOCK_PROPOSAL.simulationId,
      stage: 'impl_written',
      timestamp: sec(11, 800),
      payload: {
        progressPercent: 78,
        filesAffected: [
          'drafts/sim-mock-add-2fa-login/backend/app/security/two_factor.py',
          'drafts/sim-mock-add-2fa-login/backend/migrations/2026_05_12_add_2fa.py',
        ],
      },
    },
    {
      type: 'simulation.stage',
      simulationId: MOCK_PROPOSAL.simulationId,
      stage: 'diff_serializing',
      timestamp: sec(12, 200),
      payload: { progressPercent: 88 },
    },
    {
      type: 'simulation.stage',
      simulationId: MOCK_PROPOSAL.simulationId,
      stage: 'completed',
      timestamp: sec(14, 300),
      payload: {
        progressPercent: 100,
        draftsPath: 'drafts/sim-mock-add-2fa-login/',
      },
    },
  ];
}
