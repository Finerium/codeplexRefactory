'use client';

/**
 * Manager FINAL Cycle 2 (Persephone Cluster C, STAMP 20260513-0857):
 *
 * PerFloorTimeline: stacked-floor commit list for the side panel
 * `building-click` variant. Per Manager directive D-MF2-05:
 *
 *   "Per-floor visual locked: building height = N floors per N commits.
 *    Floor segments stacked BoxGeometry (Iris). Per-floor hover ripple
 *    via shader uniform `hovered_floor` (Iris). Click -> side panel
 *    commit timeline (Persephone) + camera fly to floor altitude (Iris)."
 *
 * Layout:
 *   - Floor 1 (oldest) at bottom of the list
 *   - Floor N (latest) at top of the list
 *   - Each entry rendered via `CommitEntry` (hash + author + date +
 *     subject + diff summary +N -M)
 *   - Click an entry: emit flyToFloor(buildingId, floorIndex) via the
 *     `useFloorFocusDispatch` event bus. Iris subscribes via
 *     `useFloorFocus` to tween camera to floor altitude.
 *   - Hover an entry: emit floor-hover via `useFloorHoverDispatch` so
 *     Iris stacked-floor shader brightens the matching segment.
 *
 * Loading + error states:
 *   - Loading: skeleton list with floor index placeholders
 *   - Error: visible error banner WITHOUT falling back to silent demo
 *     fixture (Lock 5 honest claim). Retry button available.
 *   - Synthetic mock fallback: header reads "Per-floor timeline
 *     (no git data yet)" so the demo never claims to render real history
 *     when Demeter has not shipped the endpoint yet.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): synthetic flag forwarded via header label.
 *   Lock 4 ([INFERRED] route preserves PRD 13.1 line 878 contract).
 */

import { useMemo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useFloorFocusDispatch,
  useFloorHoverDispatch,
  type BuildingData,
} from '@/scene/buildings';
import { usePerFloorCommits } from './usePerFloorCommits';
import { CommitEntry } from './CommitEntry';

export interface PerFloorTimelineProps {
  /** Selected building. PerFloorTimeline returns null if undefined. */
  building: BuildingData | null | undefined;
  /** Optional className override. */
  className?: string;
}

export function PerFloorTimeline({
  building,
  className,
}: PerFloorTimelineProps) {
  const {
    commits,
    loading,
    error,
    synthetic,
    repoSlug,
    filePath,
    refetch,
  } = usePerFloorCommits(building);

  const dispatchFloorFocus = useFloorFocusDispatch();
  const dispatchFloorHover = useFloorHoverDispatch();

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Floors top-down: latest (floor N) first, oldest (floor 1) last.
  // commits[0] = oldest from the hook; reverse for display.
  const orderedCommits = useMemo(() => {
    return commits
      .map((c, idx) => ({ commit: c, floorIndex: idx + 1 }))
      .reverse();
  }, [commits]);

  const totalFloors = commits.length;

  const handleClick = useCallback(
    (buildingId: string, floorIndex: number) => {
      setSelectedFloor(floorIndex);
      dispatchFloorFocus({ buildingId, floorIndex });
    },
    [dispatchFloorFocus]
  );

  const handleHover = useCallback(
    (buildingId: string, floorIndex: number | null) => {
      if (floorIndex === null) {
        dispatchFloorHover(null);
      } else {
        dispatchFloorHover({ buildingId, floorIndex });
      }
    },
    [dispatchFloorHover]
  );

  if (!building) {
    return null;
  }

  return (
    <section
      className={cn('flex flex-col gap-1.5', className)}
      data-panel-detail="per-floor-timeline"
      data-building-id={building.id}
      data-synthetic={synthetic ? 'true' : 'false'}
      aria-label={`Per-floor commit timeline for ${building.label}`}
    >
      <Separator />

      {/* Header */}
      <header className="flex items-start justify-between gap-2 pt-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Per-floor timeline
            {synthetic ? (
              <span className="ml-1 normal-case text-amber-300/85">
                (no git data yet)
              </span>
            ) : null}
          </p>
          <p
            className="truncate font-mono text-[9px] text-white/40"
            title={`${repoSlug} / ${filePath}`}
          >
            {repoSlug}
          </p>
          <p
            className="truncate font-mono text-[9px] text-white/55"
            title={filePath}
          >
            {filePath}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <p className="font-mono text-[9px] text-white/45">
            {totalFloors > 0
              ? `${totalFloors} floor${totalFloors === 1 ? '' : 's'}`
              : 'no floors'}
          </p>
          {error ? (
            <Button
              variant="subtle"
              size="sm"
              className="h-6 px-2 text-[9.5px]"
              onClick={refetch}
            >
              Retry
            </Button>
          ) : null}
        </div>
      </header>

      {/* Error banner */}
      {error ? (
        <div
          className="rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1.5 text-[10px] text-rose-200"
          role="alert"
        >
          <p className="font-mono text-[9px] uppercase tracking-widest text-rose-300/85">
            Commits endpoint error
          </p>
          <p className="mt-0.5 truncate" title={error}>
            {error}
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-rose-300/55">
            Showing deterministic preview instead of real history.
          </p>
        </div>
      ) : null}

      {/* Loading state */}
      {loading ? (
        <ul className="flex flex-col gap-1">
          {Array.from({ length: Math.min(5, building.floors || 5) }).map((_, i) => (
            <li
              key={i}
              className="flex h-12 animate-pulse items-center gap-2 rounded-md border border-white/8 bg-white/[0.03] px-2"
              aria-hidden
            >
              <span className="h-5 w-5 rounded-sm bg-white/10" />
              <span className="h-6 w-6 rounded-full bg-white/10" />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="h-2 w-1/3 rounded bg-white/10" />
                <span className="h-2 w-2/3 rounded bg-white/8" />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Empty state */}
      {!loading && commits.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 px-2 py-2 text-center text-[10px] text-white/45">
          No commits recorded for this file yet.
        </div>
      ) : null}

      {/* Commit list (latest top, oldest bottom) */}
      {!loading && commits.length > 0 ? (
        <ul
          className="flex flex-col gap-1"
          aria-label={`${totalFloors} commit floor entries, latest at top`}
        >
          {orderedCommits.map(({ commit, floorIndex }) => (
            <CommitEntry
              key={commit.hash}
              commit={commit}
              floorIndex={floorIndex}
              buildingId={building.id}
              active={selectedFloor === floorIndex}
              isLatest={floorIndex === totalFloors}
              onClick={handleClick}
              onHover={handleHover}
            />
          ))}
        </ul>
      ) : null}

      {/* Footer hint */}
      {!loading && commits.length > 0 ? (
        <p className="px-1 font-mono text-[9px] text-white/40">
          Click a floor to fly camera to that altitude. Hover highlights the floor on the 3D building.
        </p>
      ) : null}
    </section>
  );
}

PerFloorTimeline.displayName = 'PerFloorTimeline';
