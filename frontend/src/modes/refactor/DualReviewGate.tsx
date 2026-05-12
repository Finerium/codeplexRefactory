'use client';

/**
 * DualReviewGate: 3-button SAFETY-FIRST review surface.
 *
 * Owner: Asclepius (Wave 2).
 * Pythia contract:
 *   - `_meta/contracts/asclepius-to-pandora.md` Validation steps "dual review
 *     gate buttons UI hookup"
 *   - `_meta/contracts/pandora-to-asclepius.md` lines 67-79 "Accept/Discard
 *     events published when user clicks button"
 *
 * 3 button surface (NOT a single Accept button, per Refactor Mode SAFETY-
 * FIRST defensibility):
 *   - Run Simulation: primary CTA. Enabled when a proposal is loaded but the
 *     simulation has not run yet, OR after a reset.
 *   - Accept changes: approve, secondary. Enabled only when stage =
 *     'completed' (drafts ready for review).
 *   - Discard: destructive tertiary. Enabled when stage = 'completed' OR
 *     after Run Simulation but before completion (user aborts).
 *
 * Wave 2 stub click handlers (Pythia anchor: `asclepius-to-pandora.md`):
 *   - simulate: starts the mock pump via useSimulationEvents().runSimulation()
 *   - accept: POSTs to `/api/refactor/accept` (Wave 3 Pandora); Wave 2 mock
 *     marks stage = 'accepted' which triggers GhostToSolidAnimation
 *   - discard: POSTs to `/api/refactor/discard` (Wave 3 Pandora); Wave 2
 *     mock marks stage = 'discarded' which triggers GhostToSolidAnimation
 *     fadeOut
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 (SAFETY-FIRST:
 * no real backend POST is made in Wave 2; production code never changes
 * here per AD-19). Lock 5 ([STUB Wave 2, real Wave 3 Pandora] labels).
 */

import { useCallback, useState } from 'react';
import { useAsclepiusStore, selectRefactorSlice } from '../health/asclepiusStore';
import { useSimulationEvents } from './useSimulationEvents';
import type { SimulationStage } from './simulationEvents';

type GateMode = 'mock' | 'websocket';

interface DualReviewGateProps {
  /** Mode for the simulation hook. Default 'mock' for Wave 2. */
  mode?: GateMode;
  /** Required when mode = 'websocket'. */
  simulationId?: string;
}

function buttonClass(variant: 'primary' | 'approve' | 'destruct' | 'idle'): string {
  switch (variant) {
    case 'primary':
      return 'inline-flex items-center justify-center gap-2 rounded-md bg-codeplex-ember px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-codeplex-void shadow-[0_0_24px_rgba(255,140,66,0.45)] hover:bg-codeplex-ember/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-codeplex-ember/60';
    case 'approve':
      return 'inline-flex items-center justify-center gap-2 rounded-md border border-emerald-300/60 bg-emerald-300/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-100 hover:bg-emerald-300/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60';
    case 'destruct':
      return 'inline-flex items-center justify-center gap-2 rounded-md border border-red-300/50 bg-red-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-red-200 hover:bg-red-400/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50';
    case 'idle':
    default:
      return 'inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/35';
  }
}

const IN_FLIGHT_STAGES: SimulationStage[] = [
  'tests_generating',
  'tests_written',
  'impl_generating',
  'impl_written',
  'diff_serializing',
];

export function DualReviewGate({
  mode = 'mock',
  simulationId,
}: DualReviewGateProps) {
  const slice = useAsclepiusStore(selectRefactorSlice);
  const setStage = useAsclepiusStore((s) => s.setStage);
  const { runSimulation } = useSimulationEvents({ mode, simulationId });
  const [acceptedToast, setAcceptedToast] = useState<string | null>(null);

  const stage = slice.stage;
  const inFlight = IN_FLIGHT_STAGES.includes(stage as SimulationStage);
  const isCompleted = stage === 'completed';
  const isTerminal = stage === 'accepted' || stage === 'discarded';

  const canSimulate = stage === 'proposed' && !inFlight && !isCompleted && !isTerminal;
  const canAccept = isCompleted;
  const canDiscard = isCompleted || inFlight;

  const handleSimulate = useCallback(() => {
    if (!canSimulate) return;
    runSimulation();
  }, [canSimulate, runSimulation]);

  const handleAccept = useCallback(() => {
    if (!canAccept) return;
    // [STUB Wave 2 mock action, Wave 3 Pandora POST /api/refactor/accept]
    // The accept transition routes through the store so GhostToSolidAnimation
    // picks up stage = 'accepted' + runs the 1.5sec solidify.
    setStage('accepted');
    setAcceptedToast('Accepted. Diff staged for download. Production code untouched until you apply.');
    setTimeout(() => setAcceptedToast(null), 4500);
  }, [canAccept, setStage]);

  const handleDiscard = useCallback(() => {
    if (!canDiscard) return;
    // [STUB Wave 2 mock action, Wave 3 Pandora POST /api/refactor/discard]
    setStage('discarded');
    setAcceptedToast('Discarded. Drafts preserved at the simulation path; production untouched.');
    setTimeout(() => setAcceptedToast(null), 4500);
  }, [canDiscard, setStage]);

  return (
    <div
      className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/10 bg-codeplex-shadow/85 p-4 text-xs text-white/80 backdrop-blur-glass"
      data-asclepius-panel="dual-review-gate"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
            SAFETY-FIRST
          </p>
          <h3 className="text-sm font-semibold text-white">
            Refactor review gate
          </h3>
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/55">
          AD-19
        </span>
      </header>

      <p className="text-[10px] leading-relaxed text-white/55">
        Production code never changes here. Drafts isolation is the safety
        property. Three explicit gates so AI cannot land changes on its own.
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSimulate}
          className={buttonClass(canSimulate ? 'primary' : 'idle')}
          disabled={!canSimulate}
          data-action="run-simulation"
          data-enabled={canSimulate}
        >
          Run Simulation
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className={buttonClass(canAccept ? 'approve' : 'idle')}
            disabled={!canAccept}
            data-action="accept-changes"
            data-enabled={canAccept}
          >
            Accept changes
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className={buttonClass(canDiscard ? 'destruct' : 'idle')}
            disabled={!canDiscard}
            data-action="discard"
            data-enabled={canDiscard}
          >
            Discard
          </button>
        </div>
      </div>

      {inFlight ? (
        <p className="text-[10px] text-white/55">
          Simulation engine in progress. Discard remains available to abort.
        </p>
      ) : null}

      {isTerminal ? (
        <p
          className={`text-[10px] ${
            stage === 'accepted' ? 'text-emerald-200' : 'text-red-200'
          }`}
        >
          {stage === 'accepted'
            ? 'Acceptance recorded. Wave 3 Pandora applies the diff on user confirm.'
            : 'Discard recorded. Drafts retained 7 days for resume.'}
        </p>
      ) : null}

      {acceptedToast ? (
        <div
          role="status"
          className="rounded-lg border border-white/15 bg-codeplex-void/80 px-3 py-2 text-[10px] text-white/75"
        >
          {acceptedToast}
        </div>
      ) : null}
    </div>
  );
}

DualReviewGate.displayName = 'DualReviewGate';
