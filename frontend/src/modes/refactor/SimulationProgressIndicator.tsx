'use client';

/**
 * SimulationProgressIndicator: turn-by-turn progress UI for the 3-turn
 * simulation engine (test_gen + impl_gen + diff_serialize).
 *
 * Owner: Asclepius (Wave 2).
 *
 * Reads stage + progress percent from the Asclepius store. Renders:
 *   - A horizontal 3-step pill row (Turn 1: tests, Turn 2: impl, Turn 3:
 *     diff). The active turn glows.
 *   - A linear progress bar showing the overall percent.
 *   - A short status line with the canonical stage label.
 *   - Error banner if `errorMessage` is set on the slice.
 *
 * Pythia contract anchor: `asclepius-to-pandora.md` Validation steps
 *   "Display stage progress UI per `SimulationEvent.payload.progressPercent`"
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

import { useAsclepiusStore, selectRefactorSlice } from '../health/asclepiusStore';
import type { SimulationStage } from './simulationEvents';
import { STAGE_LABEL, STAGE_TURN } from './simulationEvents';

interface TurnPillProps {
  index: 1 | 2 | 3;
  label: string;
  state: 'pending' | 'active' | 'complete';
}

function TurnPill({ index, label, state }: TurnPillProps) {
  const baseClass =
    'flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors';
  const stateClass =
    state === 'active'
      ? 'border-codeplex-ember bg-codeplex-ember/15 text-white shadow-[0_0_18px_rgba(255,140,66,0.35)]'
      : state === 'complete'
      ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
      : 'border-white/15 bg-white/[0.03] text-white/45';
  return (
    <div className={`${baseClass} ${stateClass}`} data-turn={index} data-state={state}>
      <span className="font-mono text-[9px] uppercase tracking-widest opacity-70">
        Turn {index}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

export function SimulationProgressIndicator() {
  const slice = useAsclepiusStore(selectRefactorSlice);
  if (slice.stage === 'idle' || !slice.proposal) {
    return null;
  }

  const stage = slice.stage as SimulationStage;
  const turn = STAGE_TURN[stage];

  // Map stage to per-turn state.
  const turnStates: Array<'pending' | 'active' | 'complete'> = [1, 2, 3].map(
    (i) => {
      if (turn > i || stage === 'completed' || stage === 'accepted' || stage === 'discarded') {
        return 'complete';
      }
      if (turn === i) return 'active';
      return 'pending';
    },
  );

  // Stable progress percent fallback (some stages do not include it).
  const percent =
    slice.progressPercent ||
    (stage === 'completed' || stage === 'accepted' ? 100 : 0);

  return (
    <div
      className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/10 bg-codeplex-shadow/85 p-4 text-xs text-white/80 backdrop-blur-glass"
      data-asclepius-panel="simulation-progress"
    >
      <header className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
          Athena, Simulation Engine
        </p>
        <p className="font-mono text-[10px] text-white/45">
          sim: {slice.proposal.simulationId.slice(0, 18)}
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2" aria-label="Simulation turns">
        <TurnPill index={1} label="Generate tests" state={turnStates[0]} />
        <TurnPill index={2} label="Generate impl" state={turnStates[1]} />
        <TurnPill index={3} label="Serialize diff" state={turnStates[2]} />
      </section>

      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-codeplex-ember to-emerald-300 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[11px] text-white/75">
        {STAGE_LABEL[stage]}{' '}
        <span className="font-mono text-[10px] text-white/40">
          {percent}%
        </span>
      </p>

      {slice.errorMessage ? (
        <div className="rounded-lg border border-red-300/40 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
          Simulation error: {slice.errorMessage}
        </div>
      ) : null}
    </div>
  );
}

SimulationProgressIndicator.displayName = 'SimulationProgressIndicator';
