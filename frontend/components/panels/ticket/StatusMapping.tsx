'use client';

/**
 * StatusMapping: PR / sprint lifecycle visual indicator.
 *
 * Authored by Persephone (Wave 2). Consumes Hera SprintStatus + ciStatus +
 * blocked flags. Maps to a 1-line visual showing state + qualifier.
 *
 * Stage to label + color:
 *   foundation  : sky    "issue open"
 *   frame       : amber  "PR opened, scaffolding"
 *   painting    : violet "in review, crane"
 *   finished    : emerald "merged, transient halo"
 *   unfinished  : red    "closed without merge"
 *
 * Modifier badges shown alongside:
 *   - blocked    : amber "blocked"
 *   - ci.fail    : red "CI failing"
 *   - refactorStage: violet stage label
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 4 (locked Pythia contract status enum, no remap).
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  BuildingSprintContext,
  SprintStatus,
} from '@/modes/sprint/types';

const STATUS_LABEL: Record<SprintStatus, string> = {
  foundation: 'Issue open',
  frame: 'PR opened',
  painting: 'In review',
  finished: 'Merged',
  unfinished: 'Closed unfinished',
};

const STATUS_HUE: Record<SprintStatus, string> = {
  foundation: '#7d9cff', // codeplex-moon
  frame: '#ffd23f', // amber
  painting: '#c8b6ff', // codeplex-athena
  finished: '#5dffaa', // emerald
  unfinished: '#ff4757', // red
};

export interface StatusMappingProps {
  context: BuildingSprintContext;
  className?: string;
}

export function StatusMapping({ context, className }: StatusMappingProps) {
  const hue = STATUS_HUE[context.sprintStatus];
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <Badge
        variant="outline"
        style={{ borderColor: hue, color: hue }}
        className="font-mono"
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: hue, boxShadow: `0 0 6px ${hue}80` }}
          aria-hidden
        />
        {STATUS_LABEL[context.sprintStatus]}
      </Badge>
      {context.blocked ? (
        <Badge variant="warning" aria-label={`Blocked: ${context.blockedReason ?? 'unknown'}`}>
          Blocked
        </Badge>
      ) : null}
      {context.ciStatus === 'fail' ? (
        <Badge variant="destructive" aria-label={`CI fail count ${context.ciFailCount}`}>
          CI fail {context.ciFailCount > 1 ? `x${context.ciFailCount}` : ''}
        </Badge>
      ) : null}
      {context.ciStatus === 'pass' ? (
        <Badge variant="success" aria-label="CI passing">
          CI pass
        </Badge>
      ) : null}
      {context.refactorStage ? (
        <Badge variant="secondary" aria-label={`Refactor stage ${context.refactorStage}`}>
          Refactor: {context.refactorStage}
        </Badge>
      ) : null}
    </div>
  );
}

StatusMapping.displayName = 'StatusMapping';
