'use client';

/**
 * TimelineScrubber: DOM HUD scrubber + range toggle + ownership heatmap toggle.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D9.
 *
 * Mount: OUTSIDE the Canvas as a sibling DOM overlay (bottom-center HUD).
 *
 * UI structure (top to bottom):
 *   1. Summary row: total commits + contributors + most active building
 *   2. Range toggle row: 30d / 60d / 90d segmented buttons
 *   3. Scrubber rail with timeline markers overlaid + native HTML range
 *      input for accessibility
 *   4. Ownership heatmap toggle button + active range cursor label
 *
 * Frame-accurate drag: input type=range step=0.001 yields 1000 discrete
 * positions. Marker dots above the rail are absolute positioned by
 * `(marker.timestamp - startMs) / rangeMs * 100%` ratio.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: data labeled MOCK in mockActivityData.ts.
 */

import { useCallback, useMemo } from 'react';
import { useActivityData } from './useActivityData';
import { ACTIVITY_ANCHORED_NOW_MS } from './mockActivityData';
import {
  useActivityStore,
  selectRangeDays,
  selectScrubberPosition,
  selectOwnershipHeatmapActive,
} from './store';

const RANGE_OPTIONS: readonly (30 | 60 | 90)[] = [30, 60, 90];

const MARKER_DOT_COLORS = {
  commit: 'bg-white/85',
  pr_merged: 'bg-emerald-300/95',
  release: 'bg-codeplex-ember',
} as const;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function TimelineScrubber() {
  const data = useActivityData();
  const rangeDays = useActivityStore(selectRangeDays);
  const scrubberPosition = useActivityStore(selectScrubberPosition);
  const ownershipHeatmapActive = useActivityStore(selectOwnershipHeatmapActive);
  const setRangeDays = useActivityStore((s) => s.setRangeDays);
  const setScrubberPosition = useActivityStore((s) => s.setScrubberPosition);
  const toggleOwnershipHeatmap = useActivityStore((s) => s.toggleOwnershipHeatmap);

  // Compute range start/end timestamps for marker positioning. Use the
  // module-anchored ACTIVITY_ANCHORED_NOW_MS instead of Date.now() so the
  // mock data + UI scrubber agree on the same "now" (SSR + client hydration
  // mismatch otherwise). Wave 3 swap with real Demeter data sources
  // timestamps through React state, no hydration risk.
  const { startMs, endMs, rangeMs } = useMemo(() => {
    const nowMs = ACTIVITY_ANCHORED_NOW_MS;
    const range = rangeDays * 24 * 60 * 60 * 1000;
    return { startMs: nowMs - range, endMs: nowMs, rangeMs: range };
  }, [rangeDays]);

  const cursorTimestampMs = startMs + scrubberPosition * rangeMs;

  const handleRangeChange = useCallback(
    (range: 30 | 60 | 90) => {
      setRangeDays(range);
    },
    [setRangeDays]
  );

  const handleScrubChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setScrubberPosition(parseFloat(event.target.value));
    },
    [setScrubberPosition]
  );

  return (
    <div
      role="region"
      aria-label="Activity timeline scrubber"
      className={[
        'pointer-events-auto fixed bottom-6 left-1/2 z-30 -translate-x-1/2',
        'flex w-[42rem] max-w-[92vw] flex-col gap-3 px-5 py-4',
        'rounded-2xl border border-white/10 bg-codeplex-shadow/80 shadow-2xl backdrop-blur-glass',
      ].join(' ')}
    >
      {/* Summary row */}
      <div className="flex items-center justify-between text-[11px] text-white/70">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-codeplex-ember">
            Activity
          </span>
          <span>
            <strong className="text-white/95">{data.summary.totalCommits}</strong> commits
          </span>
          <span>
            <strong className="text-white/95">{data.summary.uniqueContributors}</strong> contributors
          </span>
        </div>
        <span className="font-mono text-[10px] text-white/50">
          most active: {data.summary.mostActiveBuilding || 'n/a'}
        </span>
      </div>

      {/* Range toggle + ownership heatmap toggle row */}
      <div className="flex items-center justify-between">
        <div
          role="radiogroup"
          aria-label="Time range in days"
          className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1"
        >
          {RANGE_OPTIONS.map((r) => {
            const active = rangeDays === r;
            return (
              <button
                key={r}
                role="radio"
                aria-checked={active}
                type="button"
                onClick={() => handleRangeChange(r)}
                className={[
                  'rounded-md px-3 py-1 font-mono text-[10px] uppercase tracking-widest',
                  'transition-colors duration-150',
                  active
                    ? 'bg-codeplex-ember/25 text-codeplex-ember'
                    : 'text-white/60 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                {r}d
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={ownershipHeatmapActive}
          onClick={toggleOwnershipHeatmap}
          className={[
            'rounded-lg border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest',
            'transition-colors duration-150',
            ownershipHeatmapActive
              ? 'bg-codeplex-ember/25 text-codeplex-ember'
              : 'text-white/60 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          ownership heatmap
        </button>
      </div>

      {/* Scrubber rail with markers + native range input */}
      <div className="relative flex flex-col gap-1">
        <div className="relative h-6">
          {/* Rail background */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/15"
          />
          {/* Markers */}
          {data.timelineMarkers.map((marker) => {
            const ratio = (marker.timestamp - startMs) / rangeMs;
            if (ratio < 0 || ratio > 1) return null;
            const cls = MARKER_DOT_COLORS[marker.eventType];
            return (
              <div
                key={marker.id}
                aria-label={marker.title}
                title={`${marker.title} (${formatDate(marker.timestamp)})`}
                style={{ left: `${ratio * 100}%` }}
                className={[
                  'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full',
                  'border border-white/30 shadow-md',
                  cls,
                ].join(' ')}
              />
            );
          })}
          {/* Cursor indicator */}
          <div
            aria-hidden
            style={{ left: `${scrubberPosition * 100}%` }}
            className={[
              'absolute top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full',
              'bg-codeplex-ember shadow-[0_0_8px_rgba(255,153,102,0.7)]',
            ].join(' ')}
          />
          {/* Native range input on top (transparent, accessible) */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={scrubberPosition}
            onChange={handleScrubChange}
            aria-label="Scrub timeline cursor"
            className={[
              'absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 cursor-pointer appearance-none',
              'bg-transparent opacity-0',
              'focus:outline-none focus:opacity-25',
            ].join(' ')}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-white/45">
          <span>{formatDate(startMs)}</span>
          <span className="text-codeplex-ember">cursor: {formatDate(cursorTimestampMs)}</span>
          <span>{formatDate(endMs)}</span>
        </div>
      </div>
    </div>
  );
}
