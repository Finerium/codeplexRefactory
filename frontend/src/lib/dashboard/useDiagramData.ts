'use client';

/**
 * useDiagramData. Client hook for the Phanes Engineering Insights pipeline.
 *
 * Authored by Selene (Manager FINAL Cycle 2 Cluster H, 2026-05-13 08:57 WIB).
 *
 * Behavior:
 *   - Mount: fires `GET /api/diagram/<repo_id>` (cache 60s server-side per
 *     Phanes DiagramService).
 *   - `refresh()`: fires `POST /api/diagram/<repo_id>/refresh` (force
 *     regenerate + WS push), then merges the returned artifact into state.
 *   - On any non-2xx OR network failure: leaves `data` null + sets `error`.
 *     Unlike `useDashboardData`, the dashboard Engineering Insights section
 *     surfaces an explicit error state on each card; mock fallback is not
 *     appropriate here because the diagrams are honest engineering artifacts
 *     (Lock 5 honest-claim discipline: no fake mermaid graph).
 *
 * Coordinated with Phanes Cluster H backend per Manager FINAL Cycle 2
 * directive (`manager_final_cycle2_directive_20260513-0857.md`).
 */

import * as React from 'react';
import { apiUrl } from '../apiUrl';
import type { DiagramArtifact } from './types';

export interface UseDiagramDataOptions {
  /** Repo id registered with Phanes DiagramService (e.g. "demo"). */
  repoId: string;
  /** When true, skip auto-fetch on mount (manual refresh-only). */
  manual?: boolean;
}

export interface UseDiagramDataResult {
  /** Latest artifact, null while loading or after error. */
  data: DiagramArtifact | null;
  /** Initial fetch + every refresh transition flips loading true. */
  loading: boolean;
  /** Error state (network failure, 404, 500, malformed JSON). */
  error: Error | null;
  /** Manual refresh trigger; invokes POST /refresh endpoint. */
  refresh: () => Promise<void>;
}

/**
 * Validate the parsed JSON shape against the v1 contract before returning.
 * Returns null when the response is not a recognizable DiagramArtifact so
 * the caller surfaces an explicit error instead of rendering broken state.
 */
function parseArtifact(raw: unknown): DiagramArtifact | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.schema_version !== 'string') return null;
  if (typeof r.repo_id !== 'string') return null;
  if (typeof r.generated_at_iso !== 'string') return null;
  if (!Array.isArray(r.nodes)) return null;
  if (!Array.isArray(r.edges)) return null;
  if (!r.svg_blobs || typeof r.svg_blobs !== 'object') return null;
  if (!r.stats || typeof r.stats !== 'object') return null;
  if (!Array.isArray(r.render_errors)) return null;
  // Gate on schema major version. Bump in lockstep with backend.
  if (!r.schema_version.startsWith('v1.')) return null;
  return raw as DiagramArtifact;
}

export function useDiagramData(options: UseDiagramDataOptions): UseDiagramDataResult {
  const { repoId, manual = false } = options;

  const [data, setData] = React.useState<DiagramArtifact | null>(null);
  const [loading, setLoading] = React.useState(!manual);
  const [error, setError] = React.useState<Error | null>(null);

  // Track in-flight token so a stale refresh does not clobber a newer one
  // when the user clicks Refresh twice rapidly across the 60s cache window.
  const inFlightToken = React.useRef(0);

  const doFetch = React.useCallback(
    async (force: boolean): Promise<void> => {
      const token = ++inFlightToken.current;
      setLoading(true);
      setError(null);

      const url = force
        ? apiUrl(`/diagram/${encodeURIComponent(repoId)}/refresh`)
        : apiUrl(`/diagram/${encodeURIComponent(repoId)}`);

      try {
        const resp = await fetch(url, {
          method: force ? 'POST' : 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        if (token !== inFlightToken.current) return; // stale

        if (!resp.ok) {
          const detail = await resp.text().catch(() => resp.statusText);
          throw new Error(
            `Diagram fetch failed (${resp.status}): ${detail.slice(0, 200)}`,
          );
        }

        const json = (await resp.json()) as unknown;
        if (token !== inFlightToken.current) return;

        const artifact = parseArtifact(json);
        if (!artifact) {
          throw new Error('Diagram response shape invalid (schema mismatch)');
        }

        setData(artifact);
        setLoading(false);
      } catch (err) {
        if (token !== inFlightToken.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    },
    [repoId],
  );

  React.useEffect(() => {
    if (manual) return;
    void doFetch(false);
  }, [manual, doFetch]);

  const refresh = React.useCallback(async () => {
    await doFetch(true);
  }, [doFetch]);

  return { data, loading, error, refresh };
}
