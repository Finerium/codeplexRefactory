'use client';

/**
 * CommitTooltip: floating popup near the timeline scrubber showing the top
 * 1-3 commits at or before the cursor timestamp.
 *
 * Owner: Boreas (Manager FINAL Cycle 2 Cluster B, STAMP 20260513-0857).
 *
 * Per directive: "plus commit message popup per cursor tick: show top 1-3
 * commits at that timestamp via floating tooltip near scrubber".
 *
 * Composition:
 *   - DOM-overlay sibling of TimelineScrubber. Positioned absolute above
 *     the scrubber card so it floats over the city canvas while the drag
 *     is happening.
 *   - When no repo selected -> renders the integrated mock-commit hint
 *     consumed by TimelineScrubber instead (this component only fires
 *     when a real Time Machine snapshot is available).
 *   - When 0 nearby commits returned (timestamp older than first commit)
 *     -> renders a small "before history" empty state.
 *   - 1-3 commits stack vertically with hash + author + relative time +
 *     subject; the FIRST entry is the resolved snapshot commit (matches
 *     the LOC heights currently rendered on the city).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): only renders when real backend snapshot
 *     received; mock path stays in TimelineScrubber.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TimeMachineCommit, TimeMachineSnapshot } from './useTimeMachine';

const COMMIT_TOOLTIP_HIDDEN_KEY = 'commit_tooltip_hidden';

interface CommitTooltipProps {
  snapshot: TimeMachineSnapshot | null;
  loading: boolean;
  error: string | null;
  cursorTimestampIso: string;
  repoFullName: string | null | undefined;
}

function formatRelative(iso: string, cursorIso: string): string {
  try {
    const t = new Date(iso).getTime();
    const c = new Date(cursorIso).getTime();
    const deltaMs = c - t;
    if (deltaMs < 0) return new Date(iso).toISOString().slice(0, 10);
    const days = Math.floor(deltaMs / 86_400_000);
    if (days === 0) return 'same day';
    if (days === 1) return '1 day before';
    if (days < 30) return `${days} days before`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} before`;
  } catch {
    return iso.slice(0, 10);
  }
}

function CommitRow({
  commit,
  cursorIso,
  isAnchor,
}: {
  commit: TimeMachineCommit;
  cursorIso: string;
  isAnchor: boolean;
}) {
  return (
    <div
      data-commit-row={isAnchor ? 'anchor' : 'context'}
      className={[
        'flex flex-col gap-0.5 rounded-md border px-2.5 py-1.5',
        isAnchor
          ? 'border-codeplex-ember/45 bg-codeplex-ember/[0.08]'
          : 'border-white/12 bg-white/[0.04]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 text-[10px] text-white/55">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={[
              'h-1.5 w-1.5 rounded-full',
              isAnchor ? 'bg-codeplex-ember' : 'bg-white/40',
            ].join(' ')}
          />
          <span className="font-mono text-white/90">{commit.shortSha}</span>
          <span>{commit.author}</span>
        </div>
        <span className="font-mono text-white/45">
          {formatRelative(commit.committedAt, cursorIso)}
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug text-white/85">
        {commit.subject}
      </p>
    </div>
  );
}

export function CommitTooltip({
  snapshot,
  loading,
  error,
  cursorTimestampIso,
  repoFullName,
}: CommitTooltipProps) {
  // Pan reactive cycle post-V8.1 (Boreas 2026-05-13 11:39 WIB): hide toggle
  // parity with TimelineScrubber activityScrubberCollapsed. Persisted via
  // localStorage so the user's preference survives reload. We keep this
  // independent of usePanelStore (the tooltip is owned by Time Machine
  // pipeline, distinct from the scrubber HUD card) so the two surfaces can
  // be toggled independently.
  const [hidden, setHidden] = useState<boolean>(false);

  // Read localStorage on mount (avoid SSR mismatch by guarding window).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(COMMIT_TOOLTIP_HIDDEN_KEY);
      if (stored === 'true') setHidden(true);
    } catch {
      // localStorage unavailable (private mode / disabled): default visible.
    }
  }, []);

  const persist = useCallback((next: boolean) => {
    setHidden(next);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        COMMIT_TOOLTIP_HIDDEN_KEY,
        next ? 'true' : 'false',
      );
    } catch {
      // ignore persistence failure; in-memory state still flips.
    }
  }, []);

  // Render nothing when no repo selected (graceful degrade; mock branch
  // covered by TimelineScrubber's integrated card).
  if (!repoFullName) return null;

  const commits = useMemo<TimeMachineCommit[]>(
    () => (snapshot ? snapshot.nearbyCommits.slice(0, 3) : []),
    [snapshot],
  );

  // Hidden state: small bottom-center restore pill so the user can bring
  // the tooltip back without losing screen real-estate. Independent of
  // the scrubber collapse pill.
  if (hidden) {
    return (
      <div
        data-panel="activity-time-machine-tooltip"
        data-collapsed="true"
        className={[
          'pointer-events-auto fixed bottom-[14.5rem] right-6 z-40',
          'flex items-center gap-2 px-2.5 py-1',
          'rounded-full border border-codeplex-ember/40 bg-codeplex-shadow/80',
          'shadow-2xl backdrop-blur-glass',
        ].join(' ')}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-codeplex-ember">
          Time Machine
        </span>
        <button
          type="button"
          onClick={() => persist(false)}
          aria-label="Show Time Machine commit tooltip"
          title="Show Time Machine commit tooltip"
          className={[
            'rounded-full border border-white/20 bg-white/[0.06] px-2 py-0.5',
            'font-mono text-[10px] uppercase tracking-widest text-white/80',
            'transition-colors duration-150 hover:bg-white/15 hover:text-white',
          ].join(' ')}
        >
          show
        </button>
      </div>
    );
  }

  // Position: fixed bottom 13.5rem (above the scrubber card which sits
  // bottom-6 with height ~9rem) + same horizontal centering.
  // Outer wrapper is pointer-events-none so it does not steal city clicks,
  // but the hide button is pointer-events-auto so it remains clickable.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Time Machine commit tooltip"
      data-panel="activity-time-machine-tooltip"
      data-collapsed="false"
      data-state={loading ? 'loading' : error ? 'error' : 'ready'}
      className={[
        'pointer-events-none fixed bottom-[14.5rem] left-1/2 z-40 -translate-x-1/2',
        'flex w-[26rem] max-w-[88vw] flex-col gap-1.5',
        'rounded-xl border border-codeplex-ember/30 bg-codeplex-shadow/85 px-3 py-2',
        'shadow-2xl backdrop-blur-glass',
      ].join(' ')}
    >
      <div className="flex items-center justify-between text-[10px] text-white/55">
        <span className="font-mono uppercase tracking-[0.25em] text-codeplex-ember">
          Time Machine
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-white/45">
            {new Date(cursorTimestampIso).toISOString().slice(0, 10)}
          </span>
          <button
            type="button"
            onClick={() => persist(true)}
            aria-label="Hide Time Machine commit tooltip"
            title="Hide Time Machine commit tooltip"
            className={[
              'pointer-events-auto rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5',
              'font-mono text-[10px] uppercase tracking-widest text-white/70',
              'transition-colors duration-150 hover:bg-white/15 hover:text-white',
            ].join(' ')}
          >
            hide
          </button>
        </div>
      </div>
      {error ? (
        <p className="text-[11px] leading-snug text-rose-300/90">
          snapshot error: <span className="font-mono">{error}</span>
        </p>
      ) : null}
      {loading && !snapshot ? (
        <p className="text-[11px] leading-snug text-white/55">
          fetching LOC snapshot at cursor (initial clone may take a few seconds)...
        </p>
      ) : null}
      {snapshot && commits.length === 0 ? (
        <p className="text-[11px] leading-snug text-white/55">
          cursor sits before the first commit of this repo. drag right to find earlier history.
        </p>
      ) : null}
      {snapshot && snapshot.commitSha && commits.length > 0 ? (
        <div className="flex flex-col gap-1">
          {commits.map((c, idx) => (
            <CommitRow
              key={c.sha}
              commit={c}
              cursorIso={cursorTimestampIso}
              isAnchor={idx === 0}
            />
          ))}
        </div>
      ) : null}
      {snapshot && snapshot.commitSha ? (
        <div className="flex items-center justify-between text-[10px] text-white/45">
          <span>
            files at cursor:{' '}
            <strong className="text-white/80">{snapshot.fileCount}</strong>
          </span>
          {snapshot.cached ? (
            <span className="font-mono text-emerald-300/80">cached</span>
          ) : (
            <span className="font-mono text-white/40">live</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
