/**
 * Wave 2 mock Apollo findings dataset.
 *
 * [MOCK Wave 2, real Wave 3 Nemesis]
 *
 * Owner: Asclepius (Wave 2).
 * Pythia contract anchor: `asclepius-to-triton.md` Storage location bullet
 *   "Wave 2 mock: Asclepius hardcodes 5 sample findings (one per category)
 *    for demo glow visual."
 *
 * Coverage requirements per Asclepius ship criteria item 4 (5/5 Apollo
 * detector mock triggers correct glow color):
 *   - hardcoded-secret (critical -> red pulsing)
 *   - missing-auth     (critical -> red pulsing)
 *   - unsafe-sql       (high     -> orange steady)
 *   - outdated-dependency (medium -> yellow subtle)
 *   - complex-untested (low      -> blue subtle)
 *
 * Building ids reference the Iris `mockCityData` (see
 * `frontend/src/scene/buildings/mockCityData.ts`). Each id below is verified
 * present in mockCityData.ts so the glow renders on a real building, not on
 * an unknown id (which the store would log + skip per
 * `nemesis-to-asclepius.md` Edge case bullet 3).
 *
 * Compliance:
 *   Lock 5 [MOCK Wave 2, real Wave 3 Nemesis] labeled here + on stream pump.
 *   Lock 1 (no em dash). Lock 2 (no emoji).
 */

import type { ApolloFinding } from '../types';

/**
 * Sample 6 findings covering all 5 detectors + 2 critical for pulsing demo.
 * Building IDs chosen from Iris mockCityData: 3 landmark + 3 generic so the
 * glow visual lands on iconic silhouettes (Hospital + Police Station +
 * scattered residence).
 */
export const MOCK_FINDINGS: ApolloFinding[] = [
  {
    id: 'mock-finding-001',
    buildingId: 'backend/app/security/scanner.py',
    filePath: 'backend/app/security/scanner.py',
    lineStart: 47,
    lineEnd: 47,
    category: 'hardcoded-secret',
    severity: 'critical',
    title: 'API key committed in scanner module',
    description:
      'A high-entropy 32-character string matching AWS access key pattern was committed in this file. Gitleaks pattern match: `AKIA[0-9A-Z]{16}`. Severity critical because production credentials become public in git history.',
    suggestedFix:
      'Rotate the AWS access key immediately, move the credential to a sealed secret store (Vault or AWS Secrets Manager), and rewrite git history to purge the leaked value. Add a pre-commit hook with gitleaks to prevent recurrence.',
    detectedAt: '2026-05-12T22:30:00+07:00',
    status: 'open',
    linkedIssueNumber: null,
  },
  {
    id: 'mock-finding-002',
    buildingId: 'backend/app/api/route_5.py',
    filePath: 'backend/app/api/route_5.py',
    lineStart: 14,
    lineEnd: 22,
    category: 'missing-auth',
    severity: 'critical',
    title: 'Admin endpoint missing auth decorator',
    description:
      'The `POST /admin/users/delete` route exposes a destructive operation without an auth decorator (no `@require_admin` or equivalent on the FastAPI router). Any unauthenticated caller can delete a user record. Severity critical because the impact is data loss.',
    suggestedFix:
      'Add the `Depends(require_admin)` dependency to the route handler signature, write an integration test that asserts a 401 response for unauthenticated callers, and audit sibling admin routes in this file for the same pattern.',
    detectedAt: '2026-05-12T22:31:12+07:00',
    status: 'open',
    linkedIssueNumber: null,
  },
  {
    id: 'mock-finding-003',
    buildingId: 'backend/app/health/diagnostic.py',
    filePath: 'backend/app/health/diagnostic.py',
    lineStart: 89,
    lineEnd: 96,
    category: 'unsafe-sql',
    severity: 'high',
    title: 'Raw string concatenation in diagnostic query',
    description:
      'The diagnostic probe builds a SQL query via f-string interpolation of a user-supplied probe name argument. Pattern matches a classic SQL injection vector. Severity high because the endpoint is internal but reachable from probe orchestration that the user can influence indirectly.',
    suggestedFix:
      'Replace the f-string with a parameterized query using the ORM session.query() or text() with bind parameters. Add a unit test that submits a payload like "1; DROP TABLE users" and asserts the parameterizer escapes it correctly.',
    detectedAt: '2026-05-12T22:32:05+07:00',
    status: 'open',
    linkedIssueNumber: null,
  },
  {
    id: 'mock-finding-004',
    buildingId: 'backend/pyproject.toml',
    filePath: 'backend/pyproject.toml',
    lineStart: 22,
    lineEnd: 22,
    category: 'outdated-dependency',
    severity: 'medium',
    title: 'requests 2.28.1 has known CVE',
    description:
      'The pinned requests==2.28.1 dependency carries CVE-2023-32681 (Proxy-Authorization header leak on redirect to a different origin). OSV API confirms the affected range. Severity medium because the exploit requires a chained redirect and the application is not currently making proxied requests.',
    suggestedFix:
      'Bump requests to >=2.31.0 in pyproject.toml, run the test suite, and confirm no transitive dependency conflict. The patch is a single-line dependency bump.',
    detectedAt: '2026-05-12T22:33:18+07:00',
    status: 'open',
    linkedIssueNumber: null,
  },
  {
    id: 'mock-finding-005',
    buildingId: 'backend/app/services/service_7.py',
    filePath: 'backend/app/services/service_7.py',
    lineStart: 1,
    lineEnd: 248,
    category: 'complex-untested',
    severity: 'low',
    title: 'Service module cyclomatic complexity 24, zero tests',
    description:
      'Radon reports cyclomatic complexity 24 for the primary handler in this 248-line service module, and grep finds no corresponding `test_service_7.py` or pytest reference. Severity low (informational) because the service is not on a critical path, but the complexity-without-tests pattern is a known regression risk.',
    suggestedFix:
      'Extract the top 3 conditional branches into helper functions, write smoke tests covering the happy path + 2 known edge cases, and add a complexity ceiling rule to the CI config so future commits get blocked above complexity 15.',
    detectedAt: '2026-05-12T22:34:42+07:00',
    status: 'open',
    linkedIssueNumber: null,
  },
  {
    id: 'mock-finding-006',
    buildingId: 'frontend/src/components/Component3.tsx',
    filePath: 'frontend/src/components/Component3.tsx',
    lineStart: 56,
    lineEnd: 56,
    category: 'hardcoded-secret',
    severity: 'high',
    title: 'Stripe test key embedded in client bundle',
    description:
      'A Stripe test key matching pattern `sk_test_[A-Za-z0-9]{24}` is hardcoded in a client-rendered component. Severity high because the key is shipped to every page visitor. Test keys do not access live funds, but they expose webhook routing.',
    suggestedFix:
      'Move the key to a server-side environment variable, render it via a Next.js API route, and rotate the leaked key from the Stripe dashboard. Add a pre-build check that scans client bundles for `sk_test_` and `sk_live_` patterns.',
    detectedAt: '2026-05-12T22:35:21+07:00',
    status: 'open',
    linkedIssueNumber: null,
  },
];
