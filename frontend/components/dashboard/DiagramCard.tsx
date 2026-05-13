'use client';

/**
 * DiagramCard. Single Engineering Insights diagram preview card.
 *
 * Authored by Selene (Manager FINAL Cycle 2 Cluster H, 2026-05-13 08:57 WIB).
 *
 * Renders one of the three Phanes-rendered diagrams (architecture mermaid,
 * dependency graphviz, eralchemy ERD) inside the dashboard's Engineering
 * Insights section. SVG blobs are base64-encoded by the backend and surfaced
 * as `data:image/svg+xml;base64,...` URIs via `<img>` so no client-side
 * mermaid/viz.js rendering library is required (zero JS payload cost +
 * instant render). The data URI is a safe sandbox: SVG cannot execute script
 * relative to the host page when rendered through `<img>`.
 *
 * States surfaced (Lock 5 honest-claim):
 *   - loading: subtle spinner + dimmed background, no fake skeleton chart.
 *   - missing blob + render error: explicit error message naming the
 *     renderer ("Architecture render failed: <detail>").
 *   - present: SVG rendered with `object-fit: contain` inside the 400px max
 *     preview area; click opens full SVG in new tab for closer inspection.
 *   - empty (no blob, no error): "No data yet" copy.
 *
 * Coordinated with Phanes Cluster H (backend SVG blob shape) per
 * `manager_final_cycle2_directive_20260513-0857.md`.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';

export type DiagramKind = 'architecture' | 'dependency' | 'erd';

export interface DiagramCardProps {
  /** Display title above preview. */
  title: string;
  /** Renderer kind (drives error message + alt text). */
  kind: DiagramKind;
  /** Base64-encoded SVG bytes; undefined when render failed or pending. */
  svgBase64?: string;
  /** True while the parent hook is fetching. */
  loading?: boolean;
  /** Top-level fetch error (network, 404, schema mismatch). */
  error?: Error | null;
  /** Per-renderer error string (e.g. "architecture: mermaid timeout"). */
  rendererError?: string;
  /** Sub-line meta copy (e.g. "12 nodes, 34 edges"). */
  meta?: string;
  /** Refresh trigger callback; renders icon button top-right when provided. */
  onRefresh?: () => void;
}

const KIND_LABEL: Record<DiagramKind, string> = {
  architecture: 'Architecture (mermaid)',
  dependency: 'Dependency graph (graphviz)',
  erd: 'ERD (eralchemy)',
};

export const DiagramCard: React.FC<DiagramCardProps> = ({
  title,
  kind,
  svgBase64,
  loading = false,
  error = null,
  rendererError,
  meta,
  onRefresh,
}) => {
  const dataUri = svgBase64
    ? `data:image/svg+xml;base64,${svgBase64}`
    : null;

  // Loading takes priority for visual clarity; the user clicked refresh and
  // we want them to see the spinner immediately even if stale SVG is cached.
  const showSpinner = loading;
  const showError = !loading && (error || rendererError);
  const showSvg = !loading && !showError && dataUri;
  const showEmpty = !loading && !showError && !dataUri;

  return (
    <div className={styles.diagramCard}>
      <div className={styles.diagramCardHd}>
        <div className={styles.diagramCardTitleBlock}>
          <h4 className={styles.diagramCardTitle}>{title}</h4>
          <div className={styles.diagramCardSub}>{meta ?? KIND_LABEL[kind]}</div>
        </div>
        {onRefresh && (
          <button
            type="button"
            className={styles.diagramCardRefresh}
            onClick={onRefresh}
            disabled={loading}
            aria-label={`Refresh ${title}`}
            title="Refresh diagram"
          >
            <Icon name="refresh" size={13} />
          </button>
        )}
      </div>

      <div className={styles.diagramCardBody}>
        {showSpinner && (
          <div
            className={styles.diagramCardState}
            role="status"
            aria-live="polite"
          >
            <span className={styles.diagramSpinner} aria-hidden />
            <span>Rendering {KIND_LABEL[kind]}</span>
          </div>
        )}

        {showError && (
          <div
            className={styles.diagramCardStateError}
            role="alert"
          >
            <span>{KIND_LABEL[kind]} render failed</span>
            <span className={styles.diagramCardErrorDetail}>
              {rendererError ?? error?.message ?? 'Unknown error'}
            </span>
            {onRefresh && (
              <button
                type="button"
                className={styles.diagramCardRetry}
                onClick={onRefresh}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {showSvg && (
          <a
            className={styles.diagramCardSvgLink}
            href={dataUri ?? '#'}
            target="_blank"
            rel="noreferrer"
            title="Open SVG in new tab"
          >
            { /* eslint-disable-next-line @next/next/no-img-element */ }
            <img
              src={dataUri ?? ''}
              alt={`${KIND_LABEL[kind]} for current repository`}
              className={styles.diagramCardSvg}
              loading="lazy"
            />
          </a>
        )}

        {showEmpty && (
          <div className={styles.diagramCardState}>
            <span>No diagram available yet</span>
          </div>
        )}
      </div>
    </div>
  );
};
