'use client';

/**
 * findingsClient: REST client for Nemesis Wave 3 real-scan endpoint.
 *
 * Owner: Asclepius (Wave-Fixing #3, HEALTH-MOCK-SUSPECT root-cause fix).
 *
 * Wave-Fixing #3 context (Manager directive 2026-05-13):
 *   Ghaisan flagged that Health Mode in `/city` still showed MOCK_FINDINGS even
 *   though Nemesis Wave 3 shipped 11 real detectors and Demeter Wave 3 shipped
 *   `POST /api/findings/scan`. The side-panel `HealthFindingsVariant.tsx`
 *   hardcoded a fallback to MOCK_FINDINGS when the store was empty. This
 *   bypassed the real backend entirely. The bug was visible at the demo, not
 *   at any unit test, because the fallback was the first render path.
 *
 * Resolution strategy:
 *   1. Fetch `/api/findings/scan` (POST default repo = NodeGoat fixture slice
 *      that ships with the backend; 15 real findings, all 5 detector categories
 *      trigger, including secrets + outdated-deps + missing-auth + unsafe-sql +
 *      complex-untested).
 *   2. Convert backend snake_case ApolloFinding payload to frontend camelCase
 *      `ApolloFinding` shape so the store + glow + panel render correctly.
 *   3. On non-200 or network failure, return `{ ok: false, error }` so the
 *      caller can decide whether to surface a toast + degrade visually.
 *   4. The fetch result is the SOURCE OF TRUTH. Mock fallback only triggers
 *      on explicit network failure + an opt-in toast labels the fallback path.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): backend response is the canonical real source;
 *     mock fallback labeled at every callsite + here.
 */

import { apiUrl } from '@/lib/apiUrl';
import type { ApolloFinding, FindingCategory, Severity } from './types';

/**
 * Backend ApolloFinding wire shape (snake_case, per
 * `backend/app/services/detectors/types.py`).
 */
interface BackendApolloFinding {
  id: string;
  detector_id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  file_path: string;
  line_start: number;
  line_end: number;
  code_snippet: string | null;
  suggested_fix: string | null;
  cvss_vector: string | null;
  cvss_base_score: number | null;
  exploit_pattern: string | null;
  cve_reference: string | null;
  detected_at: string;
  repo_full_name: string;
  building_id: string;
}

/**
 * Backend ScanResult wire shape (subset; the full backend type has
 * apollo_count_by_detector + drift_events + drift_count_by_pattern +
 * duration_ms + scan_run_id + cycle).
 */
interface BackendScanResult {
  scan_run_id: string;
  repo_full_name: string;
  apollo_findings: BackendApolloFinding[];
  drift_events: unknown[];
  apollo_count_by_detector: Record<string, number>;
  drift_count_by_pattern: Record<string, number>;
  duration_ms: number;
  cycle: string | null;
}

export interface ScanFetchResult {
  ok: true;
  scanRunId: string;
  repoFullName: string;
  findings: ApolloFinding[];
  countByDetector: Record<string, number>;
  driftCountByPattern: Record<string, number>;
  durationMs: number;
}

export interface ScanFetchError {
  ok: false;
  error: string;
  status?: number;
}

/**
 * Convert backend ApolloFinding to frontend ApolloFinding shape. The biggest
 * differences:
 *   - file_path / line_start / line_end -> filePath / lineStart / lineEnd
 *   - description + suggested_fix may be null in backend; frontend wants string
 *   - status defaults to 'open' (backend persistence layer manages life cycle,
 *     but the scan endpoint returns fresh findings so default is open).
 *   - buildingId defaults to file_path when backend leaves it empty (real
 *     impl ties to repo path so the glow lands on the file building).
 */
export function fromBackendFinding(f: BackendApolloFinding): ApolloFinding {
  return {
    id: f.id,
    buildingId: f.building_id || f.file_path,
    filePath: f.file_path,
    lineStart: f.line_start,
    lineEnd: f.line_end,
    category: f.category,
    severity: f.severity,
    title: f.title,
    description:
      f.description +
      (f.cvss_vector
        ? `\n\nCVSS: ${f.cvss_vector} (base score ${f.cvss_base_score ?? '?'})`
        : ''),
    suggestedFix: f.suggested_fix ?? '',
    detectedAt: f.detected_at,
    status: 'open',
    linkedIssueNumber: null,
  };
}

/**
 * Trigger a real Nemesis scan + return the ScanResult converted to
 * frontend-friendly shape.
 *
 * Manager FINAL Cycle 2 Bug #7 fix (20260513-0857, Hades): the backend
 * `POST /api/findings/scan` endpoint no longer silently falls back to the
 * NodeGoat fixture when no target is supplied. The caller MUST declare one
 * of: `repoFullName` (server-side shallow clones), `repoRoot` (local
 * checkout path), or `demo` (explicit NodeGoat opt-in). When the caller
 * supplies none of the above this function returns `{ ok:false, error }`
 * without hitting the network so the UI can surface an explicit reason.
 */
export async function triggerScan(opts?: {
  repoFullName?: string;
  repoRoot?: string;
  demo?: boolean;
}): Promise<ScanFetchResult | ScanFetchError> {
  // Manager FINAL Cycle 2 (Hades, Bug #7 fix): refuse to send a scan call
  // without an explicit target. The previous default `duopoly/codeplex-demo-
  // nodegoat-slice` shipped silent demo data when the frontend forgot to
  // pass query params.
  const hasTarget = Boolean(opts?.repoFullName || opts?.repoRoot || opts?.demo);
  if (!hasTarget) {
    return {
      ok: false,
      error:
        'scan target missing: pass one of repoFullName, repoRoot, or demo=true. Pick a repo or explicitly request the demo fixture.',
    };
  }

  // Wave-Fixing 3 Manager FINAL (Triton, STAMP 20260513-0626): canonical
  // `apiUrl()` helper handles same-origin production + localhost dev. Prior
  // local read of `NEXT_PUBLIC_API_BASE` (note the `_BASE` env var, distinct
  // from the canonical `NEXT_PUBLIC_API_URL` shipped via ConfigMap) silently
  // no-op'd because `_BASE` was never populated.
  const payload: Record<string, unknown> = {};
  if (opts?.repoFullName) payload.repo_full_name = opts.repoFullName;
  if (opts?.repoRoot) payload.repo_root = opts.repoRoot;
  if (opts?.demo) payload.demo = true;

  try {
    const resp = await fetch(apiUrl('/findings/scan'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      // Try to surface the backend's explicit reason so the user sees the
      // real cause (clone failure, missing target, etc.) instead of HTTP NNN.
      let detail = '';
      try {
        const j = await resp.json();
        if (j && typeof j.detail === 'string') {
          detail = `: ${j.detail}`;
        }
      } catch {
        // ignore parse failure, status code alone is enough
      }
      return {
        ok: false,
        status: resp.status,
        error: `POST /api/findings/scan -> HTTP ${resp.status}${detail}`,
      };
    }
    const data = (await resp.json()) as BackendScanResult;
    return {
      ok: true,
      scanRunId: data.scan_run_id,
      repoFullName: data.repo_full_name,
      findings: data.apollo_findings.map(fromBackendFinding),
      countByDetector: data.apollo_count_by_detector,
      driftCountByPattern: data.drift_count_by_pattern,
      durationMs: data.duration_ms,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch findings for a specific building (per-building lazy list). Used by
 * the Asclepius glow click flow when the user clicks a glowing building.
 */
export async function fetchFindingsForBuilding(
  buildingId: string,
): Promise<ApolloFinding[] | null> {
  // Wave-Fixing 3 Manager FINAL: same rationale as `triggerScan` above.
  try {
    const resp = await fetch(
      apiUrl(`/findings/by-building/${encodeURIComponent(buildingId)}`),
      { credentials: 'include' },
    );
    if (!resp.ok) return null;
    const rows = (await resp.json()) as BackendApolloFinding[];
    return rows.map(fromBackendFinding);
  } catch {
    return null;
  }
}
