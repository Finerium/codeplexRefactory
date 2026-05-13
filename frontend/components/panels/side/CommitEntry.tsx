'use client';

/**
 * Manager FINAL Cycle 2 (Persephone Cluster C, STAMP 20260513-0857):
 *
 * CommitEntry: one row in the per-floor commit timeline. Displays:
 *   - Floor index badge (vertical, left side)
 *   - Truncated 7-char commit hash (font-mono)
 *   - Author avatar (Avatar shadcn primitive)
 *   - Relative date label ("2 weeks ago")
 *   - Commit subject (single line, truncated with title)
 *   - Diff summary (+N -M, colored green / red)
 *
 * Click handler emits flyToFloor(buildingId, floorIndex) via the
 * `useFloorFocusDispatch` event bus (twin of clickBus + hoverBus).
 * Iris subscribes via `useFloorFocus(handler)` to tween camera to the
 * floor altitude (per Manager directive D-MF2-05 line 65).
 *
 * Hover handler emits floor-hover event so the Iris stacked-floor
 * shader can brighten only the hovered floor segment (D-MF2-05).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): synthetic flag forwarded to caller; no
 *     deceptive labels rendered here.
 */

import { useCallback, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { CommitEntry as CommitEntryData } from './usePerFloorCommits';

export interface CommitEntryProps {
  /** Commit data for this row. */
  commit: CommitEntryData;
  /** Floor index (1-based human label). Floor 1 = oldest. */
  floorIndex: number;
  /** Building id, forwarded to flyToFloor dispatch. */
  buildingId: string;
  /** True if this floor is currently selected (clicked). */
  active: boolean;
  /** True if this floor is the latest (top, floor N). */
  isLatest: boolean;
  /** Click handler: emits flyToFloor(buildingId, floorIndex). */
  onClick: (buildingId: string, floorIndex: number) => void;
  /** Hover handler: emits floor-hover for shader glow brighten. */
  onHover: (buildingId: string, floorIndex: number | null) => void;
  /** Optional className override. */
  className?: string;
}

/**
 * Relative time label "Xs ago" / "Xm ago" / "Xh ago" / "Xd ago" /
 * "Xw ago" / "Xmo ago" / "Xy ago". Matches the
 * `SelectedBuildingDetail.formatCommitTimestamp` style for consistency.
 */
function formatRelativeDate(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return 'in the future';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(d / 365);
  return `${yr}y ago`;
}

export function CommitEntry({
  commit,
  floorIndex,
  buildingId,
  active,
  isLatest,
  onClick,
  onHover,
  className,
}: CommitEntryProps) {
  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(buildingId, floorIndex);
    },
    [buildingId, floorIndex, onClick]
  );

  const handleEnter = useCallback(() => {
    onHover(buildingId, floorIndex);
  }, [buildingId, floorIndex, onHover]);

  const handleLeave = useCallback(() => {
    onHover(buildingId, null);
  }, [buildingId, onHover]);

  const dateLabel = formatRelativeDate(commit.author_date);
  const insertionLabel = `+${commit.insertions}`;
  const deletionLabel = `-${commit.deletions}`;
  const author = commit.author_login.replace(/^@/, '');

  return (
    <li
      className={cn(
        'group relative flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-left transition-colors',
        active
          ? 'border-codeplex-ember/60 bg-codeplex-ember/10'
          : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
        className
      )}
      data-floor-index={floorIndex}
      data-building-id={buildingId}
      data-active={active ? 'true' : 'false'}
      data-latest={isLatest ? 'true' : 'false'}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(buildingId, floorIndex);
        }
      }}
      aria-label={`Floor ${floorIndex} commit ${commit.short_hash} by ${author} ${dateLabel}: ${commit.subject}`}
    >
      {/* Floor number badge, vertical left rail */}
      <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-sm border font-mono text-[9px] font-semibold',
            isLatest
              ? 'border-codeplex-ember/60 bg-codeplex-ember/15 text-codeplex-ember'
              : active
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/15 bg-white/[0.04] text-white/55'
          )}
          aria-hidden
        >
          {floorIndex}
        </span>
        {isLatest ? (
          <span className="font-mono text-[8px] uppercase tracking-widest text-codeplex-ember/80">
            top
          </span>
        ) : null}
      </div>

      {/* Author avatar */}
      <Avatar className="h-6 w-6 shrink-0 border border-white/15">
        {commit.author_avatar_url ? (
          <AvatarImage src={commit.author_avatar_url} alt={author} />
        ) : null}
        <AvatarFallback className="bg-white/10 font-mono text-[9px] text-white/85">
          {author.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-mono text-[9.5px] text-white/55"
            title={commit.hash}
          >
            {commit.short_hash}
          </span>
          <span className="shrink-0 font-mono text-[9px] text-white/45">
            {dateLabel}
          </span>
        </div>
        <p
          className="truncate text-[10.5px] text-white/85"
          title={commit.subject}
        >
          {commit.subject}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-white/45">
            @{author}
          </span>
          <span className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="h-4 border-emerald-400/30 bg-emerald-400/10 px-1 font-mono text-[8.5px] text-emerald-300"
            >
              {insertionLabel}
            </Badge>
            <Badge
              variant="outline"
              className="h-4 border-rose-400/30 bg-rose-400/10 px-1 font-mono text-[8.5px] text-rose-300"
            >
              {deletionLabel}
            </Badge>
          </span>
        </div>
      </div>
    </li>
  );
}

CommitEntry.displayName = 'CommitEntry';
