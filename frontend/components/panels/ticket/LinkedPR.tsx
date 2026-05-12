'use client';

/**
 * LinkedPR: GitHub PR + Issue links with title preview.
 *
 * Authored by Persephone (Wave 2). Renders PR + Issue rows when present.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { cn } from '@/lib/utils';
import type { BuildingSprintContext } from '@/modes/sprint/types';

export interface LinkedPRProps {
  context: BuildingSprintContext;
  className?: string;
}

interface RefRowProps {
  label: 'PR' | 'Issue';
  number: number | null;
  title: string | null;
  url: string | null;
}

function RefRow({ label, number, title, url }: RefRowProps) {
  if (number === null || !url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 rounded-md border border-white/10 bg-white/5 p-2 transition-colors hover:border-white/25 hover:bg-white/8"
    >
      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/70">
        {label}
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="font-mono text-[10px] text-codeplex-moon">
          #{number}
        </span>
        <span className="text-[11px] leading-snug text-white/85">
          {title ?? 'untitled'}
        </span>
      </span>
      <span className="font-mono text-[9px] text-white/35">{'->'}</span>
    </a>
  );
}

export function LinkedPR({ context, className }: LinkedPRProps) {
  const hasPR = context.prNumber !== null;
  const hasIssue = context.issueNumber !== null;
  if (!hasPR && !hasIssue) {
    return (
      <p
        className={cn(
          'rounded-md border border-dashed border-white/10 p-2 text-center text-[10px] text-white/40',
          className
        )}
      >
        No linked PR or Issue
      </p>
    );
  }
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <RefRow
        label="Issue"
        number={context.issueNumber}
        title={context.issueTitle}
        url={context.issueUrl}
      />
      <RefRow
        label="PR"
        number={context.prNumber}
        title={context.prTitle}
        url={context.prUrl}
      />
    </div>
  );
}

LinkedPR.displayName = 'LinkedPR';
