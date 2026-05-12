'use client';

/**
 * TicketPanel: composite root for the GitHub-native ticket detail.
 *
 * Authored by Persephone (Wave 2). Mount point:
 * `frontend/app/city/@ticket/page.tsx`.
 *
 * Consumes Hera `useSelectedBuildingContext` via `useBuildingTicket`. Renders
 * issue + PR refs, assignee avatar, story points, status mapping, DoD
 * checklist, PR comments timeline, and a close action.
 *
 * Visual language: GitHub-native feel (assignee avatar inline, PR number link
 * out, checklist tick marks, comment thread). Persephone glassmorphism shell.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (mock data via Hera mockTape labeled at source).
 */

import { useSlideTransition } from '@/lib/panel-motion';
import { Glassmorphism } from '@/components/panels/Glassmorphism';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssigneeAvatar } from './AssigneeAvatar';
import { SizeBadge } from './SizeBadge';
import { StatusMapping } from './StatusMapping';
import { LinkedPR } from './LinkedPR';
import { useBuildingTicket } from './useBuildingTicket';
import type { BuildingSprintContext } from '@/modes/sprint/types';

export interface TicketPanelProps {
  className?: string;
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function DoDChecklist({ items }: { items: BuildingSprintContext['dodChecklist'] }) {
  if (items.length === 0) return null;
  const checked = items.filter((i) => i.checked).length;
  return (
    <section className="flex flex-col gap-1.5">
      <header className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
          Definition of Done
        </p>
        <p className="font-mono text-[9px] text-white/40">
          {checked} / {items.length}
        </p>
      </header>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[10.5px] leading-snug">
            <span
              className={cn(
                'mt-0.5 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border',
                item.checked
                  ? 'border-emerald-400/55 bg-emerald-400/15 text-emerald-200'
                  : 'border-white/25 bg-transparent text-transparent'
              )}
              aria-hidden
            >
              {item.checked ? <span className="text-[9px]">x</span> : null}
            </span>
            <span className={cn(item.checked ? 'text-white/55 line-through' : 'text-white/85')}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewersStrip({ context }: { context: BuildingSprintContext }) {
  if (
    context.reviewersRequested.length === 0 &&
    context.reviewersApproved.length === 0
  ) {
    return null;
  }
  return (
    <section className="flex flex-col gap-1.5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
        Reviewers
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {context.reviewersApproved.map((r) => (
          <Badge variant="success" key={`a-${r}`}>
            <span className="lowercase">approved @{r.replace(/^@/, '')}</span>
          </Badge>
        ))}
        {context.reviewersRequested
          .filter((r) => !context.reviewersApproved.includes(r))
          .map((r) => (
            <Badge variant="outline" key={`r-${r}`}>
              <span className="lowercase">requested @{r.replace(/^@/, '')}</span>
            </Badge>
          ))}
      </div>
    </section>
  );
}

function CommentsThread({ context }: { context: BuildingSprintContext }) {
  if (context.prComments.length === 0) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <header className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
          PR comments
        </p>
        <p className="font-mono text-[9px] text-white/40">
          {context.prComments.length}
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {context.prComments.map((c) => (
          <li
            key={c.id}
            className={cn(
              'rounded-md border bg-white/[0.04] p-2',
              c.resolved
                ? 'border-emerald-400/20 opacity-65'
                : 'border-white/12'
            )}
          >
            <header className="mb-1 flex items-center gap-2">
              <AssigneeAvatar
                githubLogin={c.githubLogin}
                avatarUrl={c.avatarUrl}
                size="xs"
                showLabel
              />
              <span className="font-mono text-[9px] text-white/35">
                {formatTimeShort(c.createdAt)}
              </span>
              {c.resolved ? (
                <Badge variant="success" className="ml-auto">
                  resolved
                </Badge>
              ) : null}
            </header>
            <p className="text-[10.5px] leading-snug text-white/80">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketPanel({ className }: TicketPanelProps) {
  const { context, dismissed, close } = useBuildingTicket();

  // Panel visibility: only when a building is selected AND has a context AND
  // user has not explicitly closed the panel.
  const open = context !== null && !dismissed;

  const { ref } = useSlideTransition({
    direction: 'bottom',
    open,
    duration: 0.3,
  });

  if (!context) {
    // Render an empty placeholder so the slot region keeps its shape; the
    // GSAP fade keeps the placeholder invisible until a building click.
    return (
      <Glassmorphism
        variant="default"
        forwardRef={ref}
        className={cn(
          'city-panel-mounted flex flex-col items-center justify-center px-3 py-2 text-[10px] text-white/35',
          className
        )}
        data-panel="ticket"
        aria-hidden
      >
        Click a building to inspect its ticket.
      </Glassmorphism>
    );
  }

  return (
    <Glassmorphism
      variant="default"
      forwardRef={ref}
      className={cn(
        'city-panel-mounted flex h-full flex-col text-white/85',
        className
      )}
      data-panel="ticket"
      data-building-id={context.buildingId}
      role="region"
      aria-label="Building ticket detail"
    >
      <header className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="font-mono text-[9px] uppercase tracking-widest text-codeplex-ember">
            Building ticket
          </p>
          <h2 className="truncate text-[12px] font-semibold text-white">
            {context.issueTitle ?? context.prTitle ?? context.buildingId}
          </h2>
          <p className="truncate font-mono text-[9px] text-white/40">
            {context.buildingId}
          </p>
        </div>
        <Button
          variant="icon"
          size="icon"
          onClick={close}
          aria-label="Close ticket panel"
          className="shrink-0"
        >
          <span aria-hidden className="text-base leading-none">
            x
          </span>
        </Button>
      </header>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-2.5">
        <div className="flex flex-col gap-3">
          <StatusMapping context={context} />

          <div className="flex flex-wrap items-center gap-2">
            <AssigneeAvatar githubLogin={context.assignee} size="sm" />
            <SizeBadge size={context.storyPoints} />
            {context.milestone ? (
              <Badge variant="secondary" className="lowercase">
                {context.milestone}
              </Badge>
            ) : null}
          </div>

          <LinkedPR context={context} />

          <DoDChecklist items={context.dodChecklist} />

          <ReviewersStrip context={context} />

          <CommentsThread context={context} />

          {context.dependencies.length > 0 ? (
            <section className="flex flex-col gap-1.5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
                Dependencies
              </p>
              <ul className="flex flex-col gap-0.5 font-mono text-[10px] text-white/65">
                {context.dependencies.map((dep) => (
                  <li key={dep} className="truncate">
                    {'->'} {dep}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </ScrollArea>

      <Separator />

      <footer className="flex items-center justify-between gap-2 px-3 py-2">
        <p className="font-mono text-[9px] text-white/35">
          Updated {formatTimeShort(context.lastUpdatedAt)}
        </p>
        {context.prUrl ? (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => window.open(context.prUrl!, '_blank', 'noopener,noreferrer')}
            aria-label={`Open PR ${context.prNumber} on GitHub`}
          >
            Open on GitHub
          </Button>
        ) : null}
      </footer>
    </Glassmorphism>
  );
}

TicketPanel.displayName = 'TicketPanel';
