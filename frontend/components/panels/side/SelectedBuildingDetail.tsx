'use client';

/**
 * SelectedBuildingDetail: side panel surface for the currently selected
 * building. Implements PRD Section 13.1 line 878:
 *
 *   "Click building: zoom-and-focus dengan side panel auto-open berisi
 *    contributor detail, recent commits, linked issues (active + closed),
 *    open PR status, file metadata (LOC, complexity, last edited)."
 *
 * Authored by Persephone (Wave-Fixing #2 Cycle 1).
 *
 * Data sources (all already in-scope across the 3 stores):
 *   - Iris `useBuildingById(id)` for static metadata (label, archetype,
 *     district, height -> LOC, ownershipColor, activity, windowTint)
 *   - Hera `useBuildingContext(id)` for PR + issue + assignee + lastUpdatedAt
 *   - Boreas `useActivityData()` for ownership distribution + commit hotspot +
 *     timelineMarkers per building
 *
 * Visual language:
 *   - Section header "Selected building" + closeable
 *   - File metadata strip: path + LOC + complexity + last edited (uses Hera
 *     lastUpdatedAt when present, else "no recent activity")
 *   - Contributor list: top 5 by share percent, w/ login + share + avatar dot
 *   - Recent commits: filter timelineMarkers by buildingId, top 5 newest, w/
 *     short title + author + date
 *   - Linked issues: parse issueNumber/issueTitle + an "active" badge when
 *     sprintStatus is not 'finished'/'unfinished'
 *   - Open PR status: prNumber + prTitle + prUrl + sprintStatus + assignee
 *
 * Wave 3 swap: when Demeter pr_events table backs Boreas, the same hook
 * shape returns real data, this component is unchanged.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): no mock label needed; consumes mock data via
 *     Hera + Boreas hooks which label themselves at source.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useBuildingById } from '@/scene/buildings';
import { useBuildingContext } from '@/modes/sprint/heraStore';
import { useActivityData } from '@/modes/activity/useActivityData';
import { usePanelStore } from '@/lib/panel-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface SelectedBuildingDetailProps {
  buildingId: string;
  className?: string;
}

/**
 * Deterministic complexity heuristic from BuildingData.height + activity.
 * Wave 3 swap: real complexity = backend Demeter materialized view of
 * cyclomatic complexity computed via tree-sitter per file.
 */
function deriveComplexity(height: number, activity: number): {
  score: number;
  bucket: 'low' | 'medium' | 'high' | 'very-high';
  label: string;
} {
  // Score = 0..100 scale, height contributes 60%, activity 40%
  const normHeight = Math.min(height / 20, 1);
  const score = Math.round(normHeight * 60 + activity * 40);
  const bucket =
    score < 25 ? 'low' :
    score < 50 ? 'medium' :
    score < 75 ? 'high' : 'very-high';
  const label = `${score}`;
  return { score, bucket, label };
}

/**
 * Map BuildingData.height -> approximate LOC. Iris layout encodes height as
 * a function of LOC. Wave 3 swap: real LOC from Demeter file_metadata table.
 */
function deriveLoc(height: number): number {
  // Iris encoding: height ranges roughly 0.5 .. 8 (clamped) over LOC 10 .. 800
  return Math.max(10, Math.round(height * 90));
}

/**
 * Format ISO timestamp to short relative-time label.
 */
function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'no recent activity';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'no recent activity';
  const diffMs = Date.now() - t;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(mo / 12);
  return `${yr}y ago`;
}

function formatCommitTimestamp(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

function ComplexityBadge({ bucket, label }: { bucket: 'low' | 'medium' | 'high' | 'very-high'; label: string }) {
  const color =
    bucket === 'low' ? 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' :
    bucket === 'medium' ? 'text-amber-200 border-amber-400/30 bg-amber-400/10' :
    bucket === 'high' ? 'text-orange-300 border-orange-400/30 bg-orange-400/10' :
    'text-rose-300 border-rose-400/30 bg-rose-400/10';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest',
        color
      )}
      title={`Complexity ${label}/100 (heuristic)`}
    >
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      <span>{bucket.replace('-', ' ')}</span>
      <span className="text-white/55 lowercase">{label}/100</span>
    </span>
  );
}

function SprintStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const color =
    status === 'finished' ? 'success' :
    status === 'unfinished' ? 'destructive' :
    status === 'painting' ? 'default' :
    'secondary';
  return <Badge variant={color as 'default' | 'success' | 'destructive' | 'secondary'} className="lowercase">{status}</Badge>;
}

export function SelectedBuildingDetail({ buildingId, className }: SelectedBuildingDetailProps) {
  const building = useBuildingById(buildingId);
  const sprintContext = useBuildingContext(buildingId);
  const activityData = useActivityData();
  const clearSelection = usePanelStore((s) => s.clearAllSelections);

  // Ownership distribution for this building
  const ownership = useMemo(
    () => activityData.ownership.find((o) => o.buildingId === buildingId),
    [activityData.ownership, buildingId]
  );

  // Hotspot intensity for this building
  const hotspot = useMemo(
    () => activityData.hotspots.find((h) => h.buildingId === buildingId),
    [activityData.hotspots, buildingId]
  );

  // Recent commits = timeline markers filtered to this building, newest first, top 5
  const recentCommits = useMemo(
    () =>
      [...activityData.timelineMarkers]
        .filter((m) => m.buildingId === buildingId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5),
    [activityData.timelineMarkers, buildingId]
  );

  if (!building) {
    return (
      <div
        className={cn(
          'rounded-md border border-dashed border-white/15 bg-white/[0.03] p-3 text-center text-[10px] text-white/45',
          className
        )}
      >
        Building {buildingId} not found in city data.
      </div>
    );
  }

  const loc = deriveLoc(building.height);
  const complexity = deriveComplexity(building.height, building.activity);
  const lastUpdatedAt = sprintContext?.lastUpdatedAt ?? null;
  const ownerLogin = ownership?.primaryOwnerLogin ?? 'unowned';
  const contributors = ownership?.contributors ?? [];
  const totalContributors = contributors.length;

  // Linked issue active state: not 'finished' / 'unfinished' = active
  const issueActive = sprintContext
    ? !['finished', 'unfinished'].includes(sprintContext.sprintStatus)
    : null;

  const linkedIssue = sprintContext?.issueNumber
    ? {
        number: sprintContext.issueNumber,
        title: sprintContext.issueTitle,
        url: sprintContext.issueUrl,
        active: issueActive,
      }
    : null;

  const linkedPR = sprintContext?.prNumber
    ? {
        number: sprintContext.prNumber,
        title: sprintContext.prTitle,
        url: sprintContext.prUrl,
        status: sprintContext.sprintStatus,
        assignee: sprintContext.assignee,
        approvedAt: sprintContext.prApprovedAt,
        reviewersApproved: sprintContext.reviewersApproved,
        reviewersRequested: sprintContext.reviewersRequested,
      }
    : null;

  return (
    <section
      className={cn(
        'flex flex-col gap-2.5 rounded-md border border-white/10 bg-white/[0.04] p-2.5',
        className
      )}
      data-panel-detail="selected-building"
      data-building-id={buildingId}
      aria-label={`Selected building detail: ${building.label}`}
    >
      {/* Header strip */}
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="font-mono text-[9px] uppercase tracking-widest text-codeplex-ember">
            Selected building
          </p>
          <h3 className="truncate text-[12px] font-semibold text-white" title={building.id}>
            {building.label}
          </h3>
          <p className="truncate font-mono text-[9px] text-white/45" title={building.id}>
            {building.id}
          </p>
        </div>
        <Button
          variant="icon"
          size="icon"
          onClick={clearSelection}
          aria-label="Clear selection"
          title="Clear selection (Esc)"
          className="h-7 w-7 shrink-0 text-white/55 hover:text-white"
        >
          <span aria-hidden className="text-sm leading-none">
            x
          </span>
        </Button>
      </header>

      {/* File metadata strip */}
      <section className="flex flex-col gap-1">
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
          File metadata
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              LOC
            </p>
            <p className="text-[11px] font-semibold text-white">{loc.toLocaleString()}</p>
          </div>
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Complexity
            </p>
            <div className="flex items-center gap-1">
              <ComplexityBadge bucket={complexity.bucket} label={complexity.label} />
            </div>
          </div>
          <div className="col-span-2 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Last edited
            </p>
            <p className="text-[11px] text-white/85">{formatRelative(lastUpdatedAt)}</p>
          </div>
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              District
            </p>
            <p className="truncate font-mono text-[10px] text-white/85" title={building.district}>
              {building.district}
            </p>
          </div>
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Activity
            </p>
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: building.ownershipColor, boxShadow: `0 0 4px ${building.ownershipColor}80` }}
                aria-hidden
              />
              <span className="font-mono text-[10px] text-white/85">
                {Math.round(building.activity * 100)}%
              </span>
              {hotspot ? (
                <span className="font-mono text-[9px] text-white/45">
                  hotspot {Math.round(hotspot.intensity * 100)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contributors */}
      <section className="flex flex-col gap-1">
        <header className="flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Contributors
          </p>
          <p className="font-mono text-[9px] text-white/40">
            {totalContributors > 0
              ? `${totalContributors} active`
              : `primary @${ownerLogin.replace(/^@/, '')}`}
          </p>
        </header>
        {contributors.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-2 py-1.5 text-center text-[10px] text-white/45">
            primary @{ownerLogin.replace(/^@/, '')}
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {contributors.slice(0, 5).map((c) => (
              <li
                key={c.githubLogin}
                className="flex items-center gap-2 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/15"
                  style={{
                    background: building.ownershipColor,
                    opacity: 0.5 + c.sharePercent / 200,
                  }}
                  aria-hidden
                  title={`@${c.githubLogin.replace(/^@/, '')}`}
                />
                <span className="flex-1 truncate font-mono text-[10px] text-white/85">
                  @{c.githubLogin.replace(/^@/, '')}
                </span>
                <span className="font-mono text-[9px] text-white/55">
                  {Math.round(c.sharePercent)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* Recent commits */}
      <section className="flex flex-col gap-1">
        <header className="flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Recent commits
          </p>
          <p className="font-mono text-[9px] text-white/40">
            {hotspot ? `${hotspot.commitCount} in window` : 'no activity'}
          </p>
        </header>
        {recentCommits.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-2 py-1.5 text-center text-[10px] text-white/45">
            No commits in the selected timeline range
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentCommits.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-0.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10.5px] text-white/85" title={m.title}>
                    {m.title}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-white/45">
                    {formatCommitTimestamp(m.timestamp)}
                  </span>
                </div>
                {m.authorLogin ? (
                  <span className="font-mono text-[9px] text-white/55">
                    @{m.authorLogin.replace(/^@/, '')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* Linked issues + PR */}
      <section className="flex flex-col gap-1.5">
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
          Linked tickets
        </p>
        {linkedIssue ? (
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <p className="font-mono text-[9px] text-white/55">
                issue #{linkedIssue.number}
              </p>
              {linkedIssue.active === true ? (
                <Badge variant="secondary" className="lowercase">active</Badge>
              ) : linkedIssue.active === false ? (
                <Badge variant="success" className="lowercase">closed</Badge>
              ) : null}
            </div>
            {linkedIssue.title ? (
              <p className="text-[10.5px] text-white/85" title={linkedIssue.title}>
                {linkedIssue.title}
              </p>
            ) : null}
            {linkedIssue.url ? (
              <Button
                variant="subtle"
                size="sm"
                className="mt-1 h-6 px-2 text-[9.5px]"
                onClick={() => window.open(linkedIssue.url!, '_blank', 'noopener,noreferrer')}
              >
                Open issue
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-white/10 px-2 py-1.5 text-center text-[10px] text-white/45">
            No linked issue
          </div>
        )}

        {linkedPR ? (
          <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <p className="font-mono text-[9px] text-white/55">
                PR #{linkedPR.number}
              </p>
              <SprintStatusBadge status={linkedPR.status} />
            </div>
            {linkedPR.title ? (
              <p className="text-[10.5px] text-white/85" title={linkedPR.title}>
                {linkedPR.title}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {linkedPR.assignee ? (
                <Badge variant="outline" className="font-mono lowercase">
                  @{linkedPR.assignee.replace(/^@/, '')}
                </Badge>
              ) : null}
              {linkedPR.reviewersApproved.length > 0 ? (
                <Badge variant="success" className="lowercase">
                  {linkedPR.reviewersApproved.length} approved
                </Badge>
              ) : null}
              {linkedPR.reviewersRequested.length > linkedPR.reviewersApproved.length ? (
                <Badge variant="secondary" className="lowercase">
                  {linkedPR.reviewersRequested.length - linkedPR.reviewersApproved.length} pending
                </Badge>
              ) : null}
            </div>
            {linkedPR.url ? (
              <Button
                variant="subtle"
                size="sm"
                className="mt-1 h-6 px-2 text-[9.5px]"
                onClick={() => window.open(linkedPR.url!, '_blank', 'noopener,noreferrer')}
              >
                Open PR
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-white/10 px-2 py-1.5 text-center text-[10px] text-white/45">
            No open PR
          </div>
        )}
      </section>
    </section>
  );
}

SelectedBuildingDetail.displayName = 'SelectedBuildingDetail';
