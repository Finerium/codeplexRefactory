'use client';

/**
 * WhatIfScenario. What-If architecture simulation panel.
 *
 * Authored by Selene (Pan reactive Cluster C, 2026-05-13).
 *
 * Mounts below the 3 Engineering Insights diagram cards. Mentor masukan: let
 * the manager simulate "what would the architecture look like if I added X?"
 * without touching any code. The flow:
 *
 *   1. User types a free-form intent ("add 2FA service") into the input.
 *   2. Frontend POSTs `/api/diagram/<repo-id>/simulate` with
 *      `{ user_intent }`. Phanes returns a canned response for the demo:
 *      `{ base_diagram, proposed_nodes, proposed_edges, narration }`.
 *   3. The preview area renders the base architecture SVG with a clearly
 *      labelled "PROPOSED" annotation panel listing the new nodes + edges,
 *      and a toggle to flip between "Original" and "With proposal".
 *
 * Visual contract per directive: dashed border + label "PROPOSED: <name>"
 * for proposed nodes. Wave 1 implements the panel + toggle + annotation
 * card; full SVG graph overlay is Phase 2 (would require editing the raw
 * SVG DOM to inject a dashed-bordered node into the rendered graph, which
 * is out of scope for the 25 min budget).
 *
 * Lock 5 honest-claim: when Phanes returns no proposed_nodes the panel says
 * "no proposed components" rather than rendering a fake placeholder.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { apiUrl } from '@/lib/apiUrl';

export interface WhatIfScenarioProps {
  /** Repo id passed to the simulate endpoint. */
  repoId: string;
  /**
   * Base architecture SVG (base64) reused for the preview area so the user
   * sees the current diagram before submission. Optional: if absent the
   * preview shows a "no base diagram available" copy instead.
   */
  baseArchitectureSvg?: string;
}

/** Phanes simulate response shape (matches stub backend contract). */
interface SimulateResponse {
  /** Base SVG (base64) returned by the backend; same as architecture mermaid. */
  base_diagram?: string;
  /** Newly proposed nodes the user's intent introduces. */
  proposed_nodes?: Array<{
    id: string;
    label: string;
    type?: string;
  }>;
  /** Edges connecting proposed nodes to the existing graph. */
  proposed_edges?: Array<{
    src: string;
    dst: string;
    kind?: string;
  }>;
  /** Optional 1-2 sentence narration explaining the proposed change. */
  narration?: string;
}

type ViewMode = 'original' | 'proposal';

export const WhatIfScenario: React.FC<WhatIfScenarioProps> = ({
  repoId,
  baseArchitectureSvg,
}) => {
  const [intent, setIntent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<SimulateResponse | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('proposal');

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = intent.trim();
      if (!trimmed || submitting) return;

      setSubmitting(true);
      setError(null);
      try {
        const resp = await fetch(
          apiUrl(`/diagram/${encodeURIComponent(repoId)}/simulate`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            credentials: 'include',
            cache: 'no-store',
            body: JSON.stringify({ user_intent: trimmed }),
          },
        );
        if (!resp.ok) {
          const text = await resp.text().catch(() => resp.statusText);
          throw new Error(
            `Simulate failed (${resp.status}): ${text.slice(0, 160)}`,
          );
        }
        const json = (await resp.json()) as SimulateResponse;
        setResponse(json);
        setViewMode('proposal');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [intent, repoId, submitting],
  );

  // When repoId changes (user switched repos), wipe the prior proposal so the
  // panel does not display stale 2FA suggestion against the new architecture.
  React.useEffect(() => {
    setResponse(null);
    setError(null);
  }, [repoId]);

  // Pick which SVG blob to render: prefer the simulate response's base_diagram
  // because it is generated under the simulate context; fall back to the
  // pre-fetched architecture SVG for the very first render.
  const previewSvg = response?.base_diagram ?? baseArchitectureSvg;
  const previewUri = previewSvg
    ? `data:image/svg+xml;base64,${previewSvg}`
    : null;

  const proposedNodes = response?.proposed_nodes ?? [];
  const proposedEdges = response?.proposed_edges ?? [];
  const hasProposal = proposedNodes.length > 0 || proposedEdges.length > 0;

  return (
    <section className={styles.whatIfSection} aria-label="What-If Scenario">
      <div className={styles.whatIfHeader}>
        <div>
          <h3 className={styles.whatIfTitle}>What-If Scenario</h3>
          <p className={styles.whatIfSubtitle}>
            Simulate adding a component to see proposed architecture
          </p>
        </div>
        {response && hasProposal && (
          <div className={styles.whatIfToggle} role="tablist" aria-label="Diagram view">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'original'}
              className={`${styles.whatIfToggleBtn} ${viewMode === 'original' ? styles.whatIfToggleBtnActive : ''}`}
              onClick={() => setViewMode('original')}
            >
              Show original
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'proposal'}
              className={`${styles.whatIfToggleBtn} ${viewMode === 'proposal' ? styles.whatIfToggleBtnActive : ''}`}
              onClick={() => setViewMode('proposal')}
            >
              Show with proposal
            </button>
          </div>
        )}
      </div>

      <form className={styles.whatIfForm} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.whatIfInput}
          placeholder="e.g. add 2FA service"
          aria-label="What-If intent input"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          disabled={submitting}
          maxLength={200}
        />
        <button
          type="submit"
          className={styles.whatIfSubmit}
          disabled={submitting || !intent.trim()}
        >
          {submitting ? 'Simulating...' : 'Simulate'}
        </button>
      </form>

      {error && (
        <div className={styles.whatIfError} role="alert">
          Simulate failed. {error}
        </div>
      )}

      {response && (
        <div className={styles.whatIfPreview}>
          <div className={styles.whatIfPreviewDiagram}>
            {previewUri ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUri}
                  alt={
                    viewMode === 'proposal'
                      ? 'Proposed architecture diagram'
                      : 'Original architecture diagram'
                  }
                  className={styles.whatIfPreviewSvg}
                />
                {viewMode === 'proposal' && hasProposal && (
                  <div className={styles.whatIfProposalOverlay}>
                    <div className={styles.whatIfOverlayLabel}>PROPOSED</div>
                    {proposedNodes.map((n) => (
                      <div key={n.id} className={styles.whatIfProposalNode}>
                        <span className={styles.whatIfProposalDot} aria-hidden />
                        <span className={styles.whatIfProposalText}>
                          PROPOSED: {n.label}
                          {n.type ? ` (${n.type})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.whatIfPreviewEmpty}>
                No base diagram available for preview.
              </div>
            )}
          </div>

          <div className={styles.whatIfSummary}>
            {response.narration && (
              <p className={styles.whatIfNarration}>{response.narration}</p>
            )}
            {hasProposal ? (
              <>
                {proposedNodes.length > 0 && (
                  <div className={styles.whatIfList}>
                    <div className={styles.whatIfListLabel}>Proposed nodes</div>
                    <ul>
                      {proposedNodes.map((n) => (
                        <li key={n.id}>
                          <strong>{n.label}</strong>
                          {n.type ? <span className={styles.whatIfMuted}> · {n.type}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {proposedEdges.length > 0 && (
                  <div className={styles.whatIfList}>
                    <div className={styles.whatIfListLabel}>Proposed edges</div>
                    <ul>
                      {proposedEdges.map((e, i) => (
                        <li key={`${e.src}-${e.dst}-${i}`}>
                          <code>{e.src}</code>
                          <span className={styles.whatIfMuted}>
                            {' '}
                            -&gt;{' '}
                          </span>
                          <code>{e.dst}</code>
                          {e.kind ? <span className={styles.whatIfMuted}> ({e.kind})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.whatIfMuted}>
                Simulation returned no proposed components for this intent.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
