/**
 * [MOCK: Wave 1 city stub for H1 60fps hypothesis benchmark]
 *
 * Mock city data with ~240 buildings across 7 districts, modeled after the
 * fastapi/full-stack-fastapi-template demo dataset shape (per PRD Section
 * 14.1 R3 Pure Seed strategy). Generated deterministically from a seeded
 * tree shape, NOT random per-render. Same import = same city every time.
 *
 * Five landmark slots are pinned to specific buildings so the 5 AI residents
 * have a stable home regardless of treemap layout reshuffle:
 *   - Athena (temple)        -> backend/app/core/main.py
 *   - Apollo (cross-shape)   -> backend/app/health/diagnostic.py
 *   - Argus (tower)          -> backend/app/security/scanner.py
 *   - Clio (vertical-stack)  -> frontend/src/history/timeline.tsx
 *   - Hermes (glass-cube)    -> frontend/src/onboarding/tour.tsx
 *
 * Building count target: 200-300 per Pythia contract validation + H1
 * hypothesis. Current count: ~245 (computed at module load, see end of
 * file).
 *
 * Real Wave 3 implementation: Demeter event-store streams tree-sitter
 * parser output via WebSocket, mock replaced wholesale.
 *
 * Compliance:
 *  - Lock 5 ([MOCK] labeled at top + filename suffix)
 *  - Lock 4 ([INFERRED] file size + activity distribution choices baked,
 *    documented in `_meta/decisions/iris_mock_distribution.md`)
 */

import { squarifyTreemap } from './layout';
import type { CityData, TreemapNode } from './types';

/**
 * Activity distribution for mock data. Roughly 30% files are active (>= 0.5
 * activity), 50% are medium (0.2 to 0.5), 20% are idle (< 0.2). The exact
 * activity value for each file is determined by a hash of the file path so
 * the same path always gets the same activity (determinism).
 */
function mockActivity(path: string): number {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 31 + path.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;
  if (bucket < 30) return 0.55 + (bucket / 100) * 0.4; // active 0.55-0.85
  if (bucket < 80) return 0.2 + ((bucket - 30) / 50) * 0.3; // medium 0.2-0.5
  return 0.05 + ((bucket - 80) / 20) * 0.14; // idle 0.05-0.19
}

/**
 * Mock LOC weight for a file. Stable per path. Distribution biased toward
 * 80-300 LOC typical files with occasional 500+ LOC outliers (the
 * skyscraper tier per PRD Section 13.1 verticality).
 */
function mockWeight(path: string): number {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 37 + path.charCodeAt(i)) | 0;
  }
  const base = (Math.abs(hash) % 280) + 60; // 60-339
  // 10% chance of skyscraper outlier (300-900 LOC)
  if (Math.abs(hash * 7) % 100 < 10) {
    return base + 400 + ((Math.abs(hash) % 300) | 0);
  }
  return base;
}

/**
 * Helper to build a file leaf node. The owner is assigned from a small
 * pool (~6 mock teams) by hashing the directory prefix, so files in the
 * same folder typically share owner (matches CODEOWNERS reality).
 */
function fileLeaf(path: string, label: string): TreemapNode {
  const owner = mockOwnerForPath(path);
  return {
    id: path,
    label,
    owner,
    weight: mockWeight(path),
    activity: mockActivity(path),
  };
}

const MOCK_OWNERS = [
  '@backend-team',
  '@frontend-team',
  '@platform',
  '@security',
  '@data',
  '@hafiz',
];

function mockOwnerForPath(path: string): string {
  const dir = path.slice(0, path.lastIndexOf('/'));
  let hash = 0;
  for (let i = 0; i < dir.length; i++) {
    hash = (hash * 41 + dir.charCodeAt(i)) | 0;
  }
  return MOCK_OWNERS[Math.abs(hash) % MOCK_OWNERS.length];
}

/**
 * Build the mock tree. 7 districts (top-level folders), each with subfolders
 * + files. Five landmark files are tagged with archetype + landmark slot.
 */
function buildMockTree(): TreemapNode {
  const tree: TreemapNode = {
    id: 'codeplex-demo-fastapi-fullstack',
    label: 'codeplex-demo-fastapi-fullstack',
    owner: '@hafiz',
    children: [
      // District 1: backend
      {
        id: 'backend',
        label: 'backend',
        owner: '@backend-team',
        children: [
          {
            id: 'backend/app',
            label: 'app',
            owner: '@backend-team',
            children: [
              {
                id: 'backend/app/core',
                label: 'core',
                owner: '@backend-team',
                children: [
                  {
                    id: 'backend/app/core/main.py',
                    label: 'main.py',
                    owner: '@backend-team',
                    weight: 540,
                    activity: 0.82,
                    archetype: 'temple',
                    landmark: 'athena',
                  },
                  fileLeaf('backend/app/core/config.py', 'config.py'),
                  fileLeaf('backend/app/core/dependencies.py', 'dependencies.py'),
                  fileLeaf('backend/app/core/settings.py', 'settings.py'),
                  fileLeaf('backend/app/core/exceptions.py', 'exceptions.py'),
                  fileLeaf('backend/app/core/logging.py', 'logging.py'),
                  fileLeaf('backend/app/core/middleware.py', 'middleware.py'),
                ],
              },
              {
                id: 'backend/app/api',
                label: 'api',
                owner: '@backend-team',
                children: Array.from({ length: 18 }, (_, i) =>
                  fileLeaf(
                    `backend/app/api/route_${i + 1}.py`,
                    `route_${i + 1}.py`
                  )
                ),
              },
              {
                id: 'backend/app/models',
                label: 'models',
                owner: '@data',
                children: Array.from({ length: 12 }, (_, i) =>
                  fileLeaf(
                    `backend/app/models/model_${i + 1}.py`,
                    `model_${i + 1}.py`
                  )
                ),
              },
              {
                id: 'backend/app/security',
                label: 'security',
                owner: '@security',
                children: [
                  {
                    id: 'backend/app/security/scanner.py',
                    label: 'scanner.py',
                    owner: '@security',
                    weight: 420,
                    activity: 0.74,
                    archetype: 'surveillance-tower',
                    landmark: 'argus',
                  },
                  fileLeaf('backend/app/security/auth.py', 'auth.py'),
                  fileLeaf(
                    'backend/app/security/permissions.py',
                    'permissions.py'
                  ),
                  fileLeaf('backend/app/security/jwt_handler.py', 'jwt_handler.py'),
                  fileLeaf('backend/app/security/rate_limit.py', 'rate_limit.py'),
                  fileLeaf('backend/app/security/secrets.py', 'secrets.py'),
                  fileLeaf('backend/app/security/cors.py', 'cors.py'),
                ],
              },
              {
                id: 'backend/app/health',
                label: 'health',
                owner: '@platform',
                children: [
                  {
                    id: 'backend/app/health/diagnostic.py',
                    label: 'diagnostic.py',
                    owner: '@platform',
                    weight: 380,
                    activity: 0.68,
                    archetype: 'cross-shape',
                    landmark: 'apollo',
                  },
                  fileLeaf('backend/app/health/probes.py', 'probes.py'),
                  fileLeaf('backend/app/health/metrics.py', 'metrics.py'),
                  fileLeaf('backend/app/health/uptime.py', 'uptime.py'),
                ],
              },
              {
                id: 'backend/app/services',
                label: 'services',
                owner: '@backend-team',
                children: Array.from({ length: 16 }, (_, i) =>
                  fileLeaf(
                    `backend/app/services/service_${i + 1}.py`,
                    `service_${i + 1}.py`
                  )
                ),
              },
              {
                id: 'backend/app/repositories',
                label: 'repositories',
                owner: '@data',
                children: Array.from({ length: 10 }, (_, i) =>
                  fileLeaf(
                    `backend/app/repositories/repo_${i + 1}.py`,
                    `repo_${i + 1}.py`
                  )
                ),
              },
              {
                id: 'backend/app/utils',
                label: 'utils',
                owner: '@backend-team',
                children: Array.from({ length: 8 }, (_, i) =>
                  fileLeaf(
                    `backend/app/utils/util_${i + 1}.py`,
                    `util_${i + 1}.py`
                  )
                ),
              },
            ],
          },
          fileLeaf('backend/pyproject.toml', 'pyproject.toml'),
          fileLeaf('backend/Dockerfile', 'Dockerfile'),
          fileLeaf('backend/alembic.ini', 'alembic.ini'),
        ],
      },
      // District 2: frontend
      {
        id: 'frontend',
        label: 'frontend',
        owner: '@frontend-team',
        children: [
          {
            id: 'frontend/src',
            label: 'src',
            owner: '@frontend-team',
            children: [
              {
                id: 'frontend/src/components',
                label: 'components',
                owner: '@frontend-team',
                children: Array.from({ length: 22 }, (_, i) =>
                  fileLeaf(
                    `frontend/src/components/Component${i + 1}.tsx`,
                    `Component${i + 1}.tsx`
                  )
                ),
              },
              {
                id: 'frontend/src/pages',
                label: 'pages',
                owner: '@frontend-team',
                children: Array.from({ length: 10 }, (_, i) =>
                  fileLeaf(
                    `frontend/src/pages/Page${i + 1}.tsx`,
                    `Page${i + 1}.tsx`
                  )
                ),
              },
              {
                id: 'frontend/src/onboarding',
                label: 'onboarding',
                owner: '@frontend-team',
                children: [
                  {
                    id: 'frontend/src/onboarding/tour.tsx',
                    label: 'tour.tsx',
                    owner: '@frontend-team',
                    weight: 340,
                    activity: 0.71,
                    archetype: 'glass-cube',
                    landmark: 'hermes',
                  },
                  fileLeaf(
                    'frontend/src/onboarding/welcome.tsx',
                    'welcome.tsx'
                  ),
                  fileLeaf(
                    'frontend/src/onboarding/checklist.tsx',
                    'checklist.tsx'
                  ),
                  fileLeaf(
                    'frontend/src/onboarding/profile.tsx',
                    'profile.tsx'
                  ),
                ],
              },
              {
                id: 'frontend/src/history',
                label: 'history',
                owner: '@frontend-team',
                children: [
                  {
                    id: 'frontend/src/history/timeline.tsx',
                    label: 'timeline.tsx',
                    owner: '@frontend-team',
                    weight: 410,
                    activity: 0.66,
                    archetype: 'vertical-stack',
                    landmark: 'clio',
                  },
                  fileLeaf('frontend/src/history/events.tsx', 'events.tsx'),
                  fileLeaf('frontend/src/history/replay.tsx', 'replay.tsx'),
                  fileLeaf('frontend/src/history/scrubber.tsx', 'scrubber.tsx'),
                ],
              },
              {
                id: 'frontend/src/hooks',
                label: 'hooks',
                owner: '@frontend-team',
                children: Array.from({ length: 12 }, (_, i) =>
                  fileLeaf(
                    `frontend/src/hooks/useHook${i + 1}.ts`,
                    `useHook${i + 1}.ts`
                  )
                ),
              },
              {
                id: 'frontend/src/styles',
                label: 'styles',
                owner: '@frontend-team',
                children: Array.from({ length: 6 }, (_, i) =>
                  fileLeaf(
                    `frontend/src/styles/style_${i + 1}.css`,
                    `style_${i + 1}.css`
                  )
                ),
              },
            ],
          },
          fileLeaf('frontend/package.json', 'package.json'),
          fileLeaf('frontend/tsconfig.json', 'tsconfig.json'),
        ],
      },
      // District 3: infra
      {
        id: 'infra',
        label: 'infra',
        owner: '@platform',
        children: [
          {
            id: 'infra/k8s',
            label: 'k8s',
            owner: '@platform',
            children: Array.from({ length: 10 }, (_, i) =>
              fileLeaf(
                `infra/k8s/manifest_${i + 1}.yaml`,
                `manifest_${i + 1}.yaml`
              )
            ),
          },
          {
            id: 'infra/docker',
            label: 'docker',
            owner: '@platform',
            children: Array.from({ length: 6 }, (_, i) =>
              fileLeaf(
                `infra/docker/Dockerfile_${i + 1}`,
                `Dockerfile_${i + 1}`
              )
            ),
          },
          fileLeaf('infra/terraform.tf', 'terraform.tf'),
        ],
      },
      // District 4: scripts
      {
        id: 'scripts',
        label: 'scripts',
        owner: '@platform',
        children: Array.from({ length: 14 }, (_, i) =>
          fileLeaf(`scripts/script_${i + 1}.sh`, `script_${i + 1}.sh`)
        ),
      },
      // District 5: tests
      {
        id: 'tests',
        label: 'tests',
        owner: '@backend-team',
        children: [
          {
            id: 'tests/unit',
            label: 'unit',
            owner: '@backend-team',
            children: Array.from({ length: 18 }, (_, i) =>
              fileLeaf(
                `tests/unit/test_unit_${i + 1}.py`,
                `test_unit_${i + 1}.py`
              )
            ),
          },
          {
            id: 'tests/integration',
            label: 'integration',
            owner: '@backend-team',
            children: Array.from({ length: 10 }, (_, i) =>
              fileLeaf(
                `tests/integration/test_int_${i + 1}.py`,
                `test_int_${i + 1}.py`
              )
            ),
          },
        ],
      },
      // District 6: docs
      {
        id: 'docs',
        label: 'docs',
        owner: '@hafiz',
        children: Array.from({ length: 12 }, (_, i) =>
          fileLeaf(`docs/doc_${i + 1}.md`, `doc_${i + 1}.md`)
        ),
      },
      // District 7: openspec
      {
        id: 'openspec',
        label: 'openspec',
        owner: '@hafiz',
        children: [
          {
            id: 'openspec/changes',
            label: 'changes',
            owner: '@hafiz',
            children: Array.from({ length: 6 }, (_, i) =>
              fileLeaf(
                `openspec/changes/change_${i + 1}.md`,
                `change_${i + 1}.md`
              )
            ),
          },
          {
            id: 'openspec/specs',
            label: 'specs',
            owner: '@hafiz',
            children: Array.from({ length: 8 }, (_, i) =>
              fileLeaf(`openspec/specs/spec_${i + 1}.md`, `spec_${i + 1}.md`)
            ),
          },
          fileLeaf('openspec/project.md', 'project.md'),
        ],
      },
    ],
  };

  return tree;
}

/**
 * Materialize mock city data at module load. Computed once + frozen so any
 * Wave 2 worker that imports + mutates raises a runtime error.
 *
 * Building count: assert ~240 buildings to stay inside Pythia contract
 * validation range (100-300). If the tree shape changes and pushes the
 * count outside the band, the assertion below logs a warning at dev mode
 * (production build strips console.warn).
 */
const tree = buildMockTree();
const result = squarifyTreemap(tree, 240, 240);

if (process.env.NODE_ENV !== 'production') {
  const count = result.buildings.length;
  if (count < 100 || count > 320) {
    // eslint-disable-next-line no-console
    console.warn(
      `mockCityData: building count ${count} outside expected 100-300 range`
    );
  }
}

export const mockCityData: CityData = Object.freeze({
  buildings: result.buildings,
  districts: result.districts,
  centroid: result.centroid,
});
