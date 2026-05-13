'use client';

/**
 * EngineeringInsights. Auto-generated architecture insights section.
 *
 * Authored by Selene (Manager FINAL Cycle 2 Cluster H, 2026-05-13 08:57 WIB).
 *
 * Mounts below the cross-repo rail in DashboardClient. Section renders three
 * DiagramCard children (architecture mermaid, dependency graphviz, ERD
 * eralchemy) sourced from a single Phanes `/api/diagram/<repo_id>` fetch.
 * One hook drives all three cards (atomic refresh, single network round
 * trip) and each card surfaces its own per-renderer error message so panitia
 * see exactly which pipeline stage broke when a renderer fails.
 *
 * The section header reads:
 *   "Engineering Insights"
 *   "Auto-generated architecture insights for current repository"
 *
 * Manager FINAL Cycle 2 directive (`manager_final_cycle2_directive_20260513-0857.md`)
 * decision D-MF2-04 pinned Option B (dashboard section) over Option A (User
 * Tutor) + Option C (city side panel).
 *
 * Coordinated with Phanes Cluster H backend.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { DiagramCard } from './DiagramCard';
import { useDiagramData } from '@/lib/dashboard/useDiagramData';

export interface EngineeringInsightsProps {
  /**
   * Repo id registered with Phanes DiagramService. Wave 1 default "demo"
   * (backend dir self-introspection). Wave 3 wires real GitHub repo slugs
   * via the multi-repo dropdown (Hades repo registration).
   */
  repoId?: string;
}

/**
 * Extract a per-renderer error message from the artifact's `render_errors`
 * list. Phanes formats entries as "architecture: <detail>" so we filter by
 * prefix and strip the renderer name for display.
 */
function findRendererError(
  errors: string[] | undefined,
  prefix: string,
): string | undefined {
  if (!errors) return undefined;
  const hit = errors.find((e) => e.startsWith(`${prefix}:`));
  return hit ? hit.slice(prefix.length + 1).trim() : undefined;
}

/**
 * Build a 1-line summary for the section header sub-copy. Uses the
 * generation timestamp + node/edge stats so the manager sees freshness at a
 * glance without opening any card.
 */
function buildHeaderMeta(
  generatedAtIso: string | undefined,
  stats: Record<string, number> | undefined,
): string {
  if (!generatedAtIso) return 'Awaiting first generation';
  const nodes = stats?.nodes ?? 0;
  const edges = stats?.edges ?? 0;
  try {
    const ts = new Date(generatedAtIso);
    const hh = String(ts.getUTCHours()).padStart(2, '0');
    const mm = String(ts.getUTCMinutes()).padStart(2, '0');
    return `${nodes} nodes, ${edges} edges, generated ${hh}:${mm} UTC`;
  } catch {
    return `${nodes} nodes, ${edges} edges`;
  }
}

export const EngineeringInsights: React.FC<EngineeringInsightsProps> = ({
  repoId = 'demo',
}) => {
  const { data, loading, error, refresh } = useDiagramData({ repoId });

  const archError = findRendererError(data?.render_errors, 'architecture');
  const depError = findRendererError(data?.render_errors, 'dependency');
  const erdError = findRendererError(data?.render_errors, 'erd');

  const headerMeta = buildHeaderMeta(data?.generated_at_iso, data?.stats);

  const handleRefresh = React.useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <section
      className={styles.engInsightsRail}
      aria-label="Engineering Insights"
    >
      <div className={styles.engInsightsHeader}>
        <div>
          <h2 className={styles.engInsightsTitle}>Engineering Insights</h2>
          <p className={styles.engInsightsSubtitle}>
            Auto-generated architecture insights for current repository
          </p>
        </div>
        <div className={styles.engInsightsMeta}>{headerMeta}</div>
      </div>

      <div className={styles.engInsightsGrid} role="list">
        <div role="listitem">
          <DiagramCard
            title="Architecture"
            kind="architecture"
            svgBase64={data?.svg_blobs.architecture}
            loading={loading}
            error={error}
            rendererError={archError}
            onRefresh={handleRefresh}
          />
        </div>
        <div role="listitem">
          <DiagramCard
            title="Dependency graph"
            kind="dependency"
            svgBase64={data?.svg_blobs.dependency}
            loading={loading}
            error={error}
            rendererError={depError}
            onRefresh={handleRefresh}
          />
        </div>
        <div role="listitem">
          <DiagramCard
            title="ERD"
            kind="erd"
            svgBase64={data?.svg_blobs.erd}
            loading={loading}
            error={error}
            rendererError={erdError}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </section>
  );
};
