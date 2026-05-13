'use client';

/**
 * TimelineScrubber: integrated DOM HUD card for Activity Mode.
 *
 * Owner: Boreas (Wave 2 + Wave-Fixing #3 Manager FINAL).
 * Decision: `_meta/decision_log/boreas.md` D9 + D16 (Wave-Fixing #3).
 *
 * Mount: OUTSIDE the Canvas as a sibling DOM overlay (bottom-center HUD).
 *
 * Wave-Fixing #3 Manager FINAL re-architecture (Ghaisan QA 05:51 WIB):
 *
 *   PROBLEM 1: drag scrubber only updated cursor date label, NO visible city
 *   visual scrub commit-by-commit, NO per-tick commit popup.
 *
 *   PROBLEM 2: scrubber card dipisah dari Activity content "kenapa buat
 *   ngedragnya di situ dan cardnya dipisah? jangan dipisah dong?"
 *
 *   FIX: rewrite as single cohesive card with:
 *     - Summary row (total commits + contributors + most active building)
 *     - Range toggle 30/60/90 segmented buttons + ownership heatmap toggle
 *     - Scrubber rail with event markers + active cursor highlight
 *     - Anchor labels (Now / Nd ago)
 *     - Per-cursor commit popup: nearest marker -> hash + author +
 *       message + file path surface inline below the rail
 *     - Hide toggle button (parity with SprintHud bottom-left) so the user
 *       can collapse the card to a small restore pill (city canvas
 *       unobstructed for cinematic screenshots).
 *
 *   CITY VISUAL SCRUB: HotspotGlow component (already mounted as canvas
 *   layer) reads scrubberPosition + adjusts halo intensity per-building
 *   based on cumulative commits up-to-cursor. See HotspotGlow.tsx Wave-
 *   Fixing #3 update.
 *
 * Direction convention (Wave-Fixing C-8 inversion fix, 2026-05-13):
 *   LEFT anchor  = "Now" (present, scrubberPosition = 0)
 *   RIGHT anchor = "Nd ago" (farthest past, scrubberPosition = 1)
 *   Drag right = scrub backward in time (reach further into history).
 *   Mapping: cursorTimestampMs = endMs - scrubberPosition * rangeMs.
 *   Marker ratio: (endMs - marker.timestamp) / rangeMs.
 *
 * Frame-accurate drag: input type=range step=0.001 yields 1000 discrete
 * positions. Marker dots above the rail are absolute positioned along the
 * flipped axis.
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
import { usePanelStore } from '@/lib/panel-context';
import type { TimelineMarker } from './types';

const RANGE_OPTIONS: readonly (30 | 60 | 90)[] = [30, 60, 90];

const MARKER_DOT_COLORS = {
  commit: 'bg-white/85',
  pr_merged: 'bg-emerald-300/95',
  release: 'bg-codeplex-ember',
} as const;

const MARKER_TEXT_LABELS = {
  commit: 'commit',
  pr_merged: 'PR merged',
  release: 'release',
} as const;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.toISOString().slice(0, 10)} ${d
    .toISOString()
    .slice(11, 16)}Z`;
}

/**
 * Find the marker closest to cursor timestamp (any direction). Returns null
 * if no markers exist or if the nearest marker is more than `maxDeltaMs`
 * away from cursor (keeps the popup empty when scrubber sits in a gap).
 */
function findNearestMarker(
  markers: TimelineMarker[],
  cursorMs: number,
  maxDeltaMs: number
): TimelineMarker | null {
  if (markers.length === 0) return null;
  let best: TimelineMarker | null = null;
  let bestDelta = Infinity;
  for (const m of markers) {
    const delta = Math.abs(m.timestamp - cursorMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = m;
    }
  }
  if (best && bestDelta <= maxDeltaMs) return best;
  return null;
}

export function TimelineScrubber() {
  const data = useActivityData();
  const rangeDays = useActivityStore(selectRangeDays);
  const scrubberPosition = useActivityStore(selectScrubberPosition);
  const ownershipHeatmapActive = useActivityStore(selectOwnershipHeatmapActive);
  const setRangeDays = useActivityStore((s) => s.setRangeDays);
  const setScrubberPosition = useActivityStore((s) => s.setScrubberPosition);
  const toggleOwnershipHeatmap = useActivityStore((s) => s.toggleOwnershipHeatmap);

  // Wave-Fixing #3 Manager FINAL: hide toggle parity with SprintHud. When
  // collapsed, render a small bottom-center restore pill so the city canvas
  // stays unobstructed.
  const collapsed = usePanelStore((s) => s.activityScrubberCollapsed);
  const setCollapsed = usePanelStore((s) => s.setActivityScrubberCollapsed);

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

  // C-8 inversion fix: scrubberPosition 0 = endMs (Now, left anchor),
  // scrubberPosition 1 = startMs (Nd ago, right anchor). Drag right ->
  // travel backward in time.
  const cursorTimestampMs = endMs - scrubberPosition * rangeMs;

  // Wave-Fixing #3: nearest marker for per-cursor commit popup. Snap window
  // = 1 day = generous enough that scrubber drag finds a match in most
  // positions but tight enough that "empty zones" still read as empty.
  const dayMs = 24 * 60 * 60 * 1000;
  const nearestMarker = useMemo(
    () => findNearestMarker(data.timelineMarkers, cursorTimestampMs, dayMs),
    [data.timelineMarkers, cursorTimestampMs, dayMs]
  );

  // Intermediate tick markers along the rail (in days-ago units). For 30d
  // range show [10, 20]. For 60d show [30]. For 90d show [30, 60]. Always
  // include the two anchors (0d / Nd) as outer labels rendered separately.
  const intermediateTicksDays = useMemo<number[]>(() => {
    if (rangeDays === 30) return [10, 20];
    if (rangeDays === 60) return [30];
    return [30, 60];
  }, [rangeDays]);

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

  // Collapsed state: small restore pill bottom-center. Parity with
  // SprintHud collapsed surface.
  if (collapsed) {
    return (
      <div
        data-panel="activity-scrubber"
        data-collapsed="true"
        role="region"
        aria-label="Activity timeline scrubber (collapsed)"
        className={[
          'pointer-events-auto fixed bottom-6 left-1/2 z-30 -translate-x-1/2',
          'flex items-center gap-2 px-3 py-2',
          'rounded-full border border-codeplex-ember/40 bg-codeplex-shadow/80',
          'shadow-2xl backdrop-blur-glass',
        ].join(' ')}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-codeplex-ember">
          Activity
        </span>
        <span className="font-mono text-[10px] text-white/55">
          cursor {formatDate(cursorTimestampMs)}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show Activity timeline scrubber"
          title="Show Activity timeline scrubber"
          className={[
            'rounded-full border border-white/20 bg-white/[0.06] px-2 py-0.5',
            'font-mono text-[10px] uppercase tracking-widest text-white/80',
            'transition-colors duration-150 hover:bg-white/15',
          ].join(' ')}
        >
          show
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Activity timeline scrubber"
      data-panel="activity-scrubber"
      data-collapsed="false"
      className={[
        'pointer-events-auto fixed bottom-6 left-1/2 z-30 -translate-x-1/2',
        'flex w-[48rem] max-w-[94vw] flex-col gap-3 px-5 py-4',
        'rounded-2xl border border-white/10 bg-codeplex-shadow/85 shadow-2xl backdrop-blur-glass',
      ].join(' ')}
    >
      {/* Summary row + hide button */}
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
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/50">
            most active: {data.summary.mostActiveBuilding || 'n/a'}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Hide Activity timeline scrubber"
            title="Hide Activity timeline scrubber"
            className={[
              'rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5',
              'font-mono text-[10px] uppercase tracking-widest text-white/70',
              'transition-colors duration-150 hover:bg-white/15 hover:text-white',
            ].join(' ')}
          >
            hide
          </button>
        </div>
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
          {/* Intermediate tick marks (days-ago grid) */}
          {intermediateTicksDays.map((d) => {
            const ratio = d / rangeDays;
            return (
              <div
                key={`tick-${d}`}
                aria-hidden
                style={{ left: `${ratio * 100}%` }}
                className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-white/25"
              />
            );
          })}
          {/* Event markers (commit / PR / release). Flipped ratio:
              right side of rail represents older timestamps. */}
          {data.timelineMarkers.map((marker) => {
            const ratio = (endMs - marker.timestamp) / rangeMs;
            if (ratio < 0 || ratio > 1) return null;
            const cls = MARKER_DOT_COLORS[marker.eventType];
            // Wave-Fixing #3: brighten marker when cursor near it.
            const isNearCursor =
              nearestMarker !== null && nearestMarker.id === marker.id;
            return (
              <div
                key={marker.id}
                aria-label={marker.title}
                title={`${marker.title} (${formatDate(marker.timestamp)})`}
                style={{
                  left: `${ratio * 100}%`,
                  transform: isNearCursor
                    ? 'translate(-50%, -50%) scale(1.6)'
                    : 'translate(-50%, -50%)',
                }}
                className={[
                  'absolute top-1/2 h-3 w-3 rounded-full',
                  'border border-white/30 shadow-md',
                  isNearCursor
                    ? 'ring-2 ring-codeplex-ember/60'
                    : '',
                  'transition-transform duration-100',
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
        {/* Anchor labels: LEFT = Now (0d, present), RIGHT = Nd ago (past).
            Intermediate tick labels positioned absolutely under their tick. */}
        <div className="relative h-7 font-mono text-[10px] text-white/55">
          {/* Left anchor: Now */}
          <div className="absolute left-0 top-0 flex flex-col leading-tight">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/85">
              Now
            </span>
            <span className="text-[9px] text-white/40">{formatDate(endMs)}</span>
          </div>
          {/* Cursor readout (centered, ember accent) */}
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-codeplex-ember">
            cursor: {formatDate(cursorTimestampMs)}
          </span>
          {/* Right anchor: Nd ago */}
          <div className="absolute right-0 top-0 flex flex-col items-end leading-tight">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/85">
              {rangeDays}d ago
            </span>
            <span className="text-[9px] text-white/40">{formatDate(startMs)}</span>
          </div>
          {/* Intermediate tick labels */}
          {intermediateTicksDays.map((d) => {
            const ratio = d / rangeDays;
            return (
              <span
                key={`tick-lbl-${d}`}
                style={{ left: `${ratio * 100}%` }}
                className="absolute top-[2px] -translate-x-1/2 text-[9px] text-white/35"
              >
                {d}d
              </span>
            );
          })}
        </div>
      </div>

      {/* Wave-Fixing #3: per-cursor commit popup card. Integrated into the
          same card (Ghaisan eksplisit: jangan dipisah). When cursor sits
          near a marker, surface hash + author + message + file path. */}
      <div
        role="status"
        aria-live="polite"
        aria-label="Commit detail at cursor"
        data-has-marker={nearestMarker !== null}
        className={[
          'rounded-lg border px-3 py-2',
          nearestMarker
            ? 'border-codeplex-ember/30 bg-codeplex-ember/[0.06]'
            : 'border-white/10 bg-white/[0.02]',
        ].join(' ')}
      >
        {nearestMarker ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'h-2 w-2 shrink-0 rounded-full',
                    MARKER_DOT_COLORS[nearestMarker.eventType],
                  ].join(' ')}
                  aria-hidden
                />
                <span className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
                  {MARKER_TEXT_LABELS[nearestMarker.eventType]}
                </span>
                <span className="font-mono text-[10px] text-white/45">
                  {formatDateTime(nearestMarker.timestamp)}
                </span>
              </div>
              <span className="font-mono text-[10px] text-white/55">
                {nearestMarker.authorLogin ?? '@unknown'}
              </span>
            </div>
            <p className="text-[12px] leading-snug text-white/90">
              {nearestMarker.commitMessage ?? nearestMarker.title}
            </p>
            <div className="flex items-center justify-between gap-2 text-[10px] text-white/50">
              <span className="truncate font-mono">
                {nearestMarker.filePath ?? nearestMarker.buildingId}
              </span>
              {nearestMarker.commitHash ? (
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/70">
                  {nearestMarker.commitHash}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-center text-[11px] text-white/40">
            Drag scrubber to a marker dot to see commit detail.
          </p>
        )}
      </div>
    </div>
  );
}
