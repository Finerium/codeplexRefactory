'use client';

/**
 * RefactorReviewVariant: side panel content for Refactor Mode (proposal review).
 *
 * Authored by Persephone (Wave 2). Consumes Asclepius `useAsclepiusStore`
 * `refactor` slice + Wave 2 mock proposal from `@/modes/refactor/__mock__/proposal`.
 *
 * Renders:
 *   - Proposal title + summary + user intent (Athena verbatim)
 *   - Ghost building list with suggested file path + connections
 *   - Simulation progress: stage step (Turn 1/2/3 indicator) + progress bar
 *   - Dual review gate buttons: Run Simulation (when proposed), Accept + Discard (when completed)
 *
 * Dual review gate (PRD AD-19 safety property):
 *   Gate 1: review proposal BEFORE Run Simulation
 *   Gate 2: review simulation result BEFORE Accept (production code untouched until Accept)
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 3 (safety-first; production code mutation is Pandora Wave 3 backend,
 *     Persephone Wave 2 only wires the dual review gate UI).
 *   Lock 5 ([STUB] simulation pump is mock setTimeout via Asclepius reducer
 *     in Wave 2, real Pandora SSE in Wave 3).
 */

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAsclepiusStore } from '@/modes/health/asclepiusStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  STAGE_LABEL,
  STAGE_TURN,
  type SimulationStage,
} from '@/modes/refactor/simulationEvents';
import { MOCK_PROPOSAL, buildMockEventSequence } from '@/modes/refactor/__mock__/proposal';

export interface RefactorReviewVariantProps {
  className?: string;
}

function StageTimeline({ stage }: { stage: SimulationStage | 'idle' }) {
  const stages: SimulationStage[] = [
    'proposed',
    'tests_generating',
    'tests_written',
    'impl_generating',
    'impl_written',
    'diff_serializing',
    'completed',
  ];
  const activeIdx = stage === 'idle' ? -1 : stages.indexOf(stage);
  const turn = stage === 'idle' ? 0 : STAGE_TURN[stage];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-mono uppercase tracking-widest text-white/45">
          Simulation progress
        </span>
        <span className="font-mono text-white/55">
          Turn {turn} of 4
        </span>
      </div>
      <ol className="flex flex-col gap-1">
        {stages.map((s, i) => {
          const passed = i < activeIdx;
          const active = i === activeIdx;
          return (
            <li
              key={s}
              className={cn(
                'flex items-center gap-2 rounded px-2 py-1 text-[10px]',
                passed && 'bg-emerald-500/5 text-emerald-200/55',
                active && 'bg-codeplex-ember/10 text-codeplex-ember',
                !passed && !active && 'text-white/40'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border text-[7px] font-mono',
                  passed && 'border-emerald-300/60 bg-emerald-300/20 text-emerald-100',
                  active && 'border-codeplex-ember bg-codeplex-ember/30 text-codeplex-ember',
                  !passed && !active && 'border-white/15 text-white/40'
                )}
                aria-hidden
              >
                {passed ? 'x' : i + 1}
              </span>
              <span className="flex-1 truncate">{STAGE_LABEL[s]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function RefactorReviewVariant({ className }: RefactorReviewVariantProps) {
  const proposal = useAsclepiusStore((s) => s.refactor.proposal);
  const stage = useAsclepiusStore((s) => s.refactor.stage);
  const progressPercent = useAsclepiusStore((s) => s.refactor.progressPercent);
  const errorMessage = useAsclepiusStore((s) => s.refactor.errorMessage);
  const draftsPath = useAsclepiusStore((s) => s.refactor.draftsPath);
  const ingestRefactorEvent = useAsclepiusStore((s) => s.ingestRefactorEvent);
  const setStage = useAsclepiusStore((s) => s.setStage);
  const resetRefactor = useAsclepiusStore((s) => s.resetRefactor);

  // Load proposal on mount if not yet present. Wave 2 demo: Athena auto-publishes
  // the canonical "Add 2FA" proposal so the variant renders immediately.
  // Wave 3 Pandora publishes via SSE; this lazy-mount is the demo path.
  const ensureProposal = useCallback(() => {
    if (proposal) return;
    ingestRefactorEvent(MOCK_PROPOSAL);
  }, [proposal, ingestRefactorEvent]);

  // Wave 2 mock pump: walk event sequence with setTimeout when user clicks
  // "Run Simulation". Wave 3 Pandora swap = subscribe to /events SSE.
  const runSimulation = useCallback(() => {
    ensureProposal();
    const events = buildMockEventSequence();
    let i = 0;
    const tick = () => {
      if (i >= events.length) return;
      const ev = events[i];
      ingestRefactorEvent(ev);
      i += 1;
      if (i < events.length) {
        // Pacing roughly matches the timestamps in the canonical mock (1.5-2s steps).
        setTimeout(tick, 1500);
      }
    };
    tick();
  }, [ensureProposal, ingestRefactorEvent]);

  const accept = useCallback(() => {
    setStage('accepted');
  }, [setStage]);

  const discard = useCallback(() => {
    setStage('discarded');
  }, [setStage]);

  const newProposal = useCallback(() => {
    resetRefactor();
  }, [resetRefactor]);

  // Wave 2: if no proposal in store, render onboarding state pointing at Athena.
  if (!proposal) {
    return (
      <Card className={cn('flex flex-col', className)}>
        <CardHeader>
          <CardDescription className="font-mono uppercase tracking-widest text-codeplex-ember">
            Refactor SAFETY-FIRST
          </CardDescription>
          <CardTitle>No active proposal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-[11.5px] leading-relaxed text-white/70">
          <p>
            Athena drafts each proposal in <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-codeplex-ember">openspec/changes/</code> with grounding from static analysis. The simulation never touches production code; everything writes to <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-codeplex-ember">drafts/</code> until you accept.
          </p>
          <p className="text-white/55">
            Ask Athena in the chat panel for a refactor idea, or load the canned demo proposal.
          </p>
          <Button variant="default" size="sm" onClick={ensureProposal}>
            Load demo proposal
          </Button>
        </CardContent>
      </Card>
    );
  }

  const showRun = stage === 'idle' || stage === 'proposed';
  const showProgress = stage !== 'idle' && stage !== 'proposed' && stage !== 'accepted' && stage !== 'discarded';
  const showGate2 = stage === 'completed';
  const isAccepted = stage === 'accepted';
  const isDiscarded = stage === 'discarded';

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="font-mono uppercase tracking-widest text-codeplex-ember">
            Refactor SAFETY-FIRST
          </CardDescription>
          <Badge variant="secondary">{proposal.simulationId}</Badge>
        </div>
        <CardTitle>{proposal.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <section className="flex flex-col gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            User intent
          </p>
          <p className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] italic text-white/70">
            {proposal.userIntent}
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Summary (Athena)
          </p>
          <p className="text-[11px] leading-relaxed text-white/85">{proposal.summary}</p>
          <p className="font-mono text-[9px] text-white/40">
            OpenSpec: {proposal.openspecChangePath}
          </p>
        </section>

        <Separator />

        <section className="flex flex-col gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Ghost buildings ({proposal.ghostBuildings.length})
          </p>
          <ul className="flex flex-col gap-1.5">
            {proposal.ghostBuildings.map((ghost) => (
              <li
                key={ghost.ghostId}
                className="rounded-md border border-white/10 bg-white/[0.04] p-2"
              >
                <header className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium text-white/85">
                    {ghost.label}
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {ghost.archetype}
                  </Badge>
                </header>
                <p className="mt-0.5 font-mono text-[9.5px] text-codeplex-clio">
                  {ghost.suggestedFilePath}
                </p>
                {ghost.connections.length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-0.5 font-mono text-[9px] text-white/50">
                    {ghost.connections.map((c, i) => (
                      <li key={i} className="truncate">
                        {c.relationship} {'->'} {c.targetBuildingId}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {showProgress ? (
          <>
            <Separator />
            <section className="flex flex-col gap-2">
              <StageTimeline stage={stage} />
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/8"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-codeplex-ember transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {draftsPath ? (
                <p className="font-mono text-[9px] text-emerald-200/85">
                  Drafts at <span className="text-emerald-200">{draftsPath}</span>
                </p>
              ) : null}
              {errorMessage ? (
                <p className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 font-mono text-[9.5px] text-red-200">
                  {errorMessage}
                </p>
              ) : null}
            </section>
          </>
        ) : null}

        {isAccepted ? (
          <section className="flex flex-col gap-1.5 rounded-md border border-emerald-300/30 bg-emerald-300/10 p-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-200">
              Accepted, applied to production
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-100/85">
              Diff serialized, drafts merged, ghost buildings transitioned to solid. Athena will archive the change folder.
            </p>
          </section>
        ) : null}

        {isDiscarded ? (
          <section className="flex flex-col gap-1.5 rounded-md border border-white/15 bg-white/[0.04] p-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/70">
              Discarded
            </p>
            <p className="text-[11px] leading-relaxed text-white/65">
              Drafts preserved at {draftsPath ?? 'drafts/'}; production code untouched. Start a new proposal to try a different angle.
            </p>
          </section>
        ) : null}
      </CardContent>
      <CardFooter>
        {showRun ? (
          <>
            <p className="font-mono text-[9px] text-white/45">
              Gate 1: review before simulation
            </p>
            <Button variant="default" size="sm" onClick={runSimulation}>
              Run Simulation
            </Button>
          </>
        ) : null}
        {showGate2 ? (
          <>
            <p className="font-mono text-[9px] text-white/45">
              Gate 2: review diff before accept
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={discard}>
                Discard
              </Button>
              <Button variant="default" size="sm" onClick={accept}>
                Accept
              </Button>
            </div>
          </>
        ) : null}
        {(isAccepted || isDiscarded) ? (
          <Button variant="subtle" size="sm" onClick={newProposal} className="ml-auto">
            New proposal
          </Button>
        ) : null}
        {showProgress ? (
          <p className="font-mono text-[9px] text-white/45">
            Simulating, please wait...
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}

RefactorReviewVariant.displayName = 'RefactorReviewVariant';
