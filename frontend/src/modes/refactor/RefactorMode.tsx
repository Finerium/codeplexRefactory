'use client';

/**
 * RefactorMode: composite root for the Refactor Mode side-panel HUD.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Mount strategy mirrors HealthMode: this composite is the DOM-side root.
 * The in-scene ghost building layer lives in `RefactorGhostLayer` and
 * mounts inside `<ChronicleCanvas>` next to `<BuildingInstances>`. This
 * file owns the proposal summary card, the simulation progress indicator,
 * and the dual review gate.
 *
 * Wave 2 mounting via the smoke route until Persephone Wave 2 ships its
 * `@side/[mode]/page.tsx` router; Persephone consumes via barrel
 * `import { RefactorMode } from '@/modes/refactor'`.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock pump
 * upstream-labeled; this composite renders the canonical UI).
 */

import { useEffect } from 'react';
import { useAsclepiusStore, selectRefactorSlice } from '../health/asclepiusStore';
import { SimulationProgressIndicator } from './SimulationProgressIndicator';
import { DualReviewGate } from './DualReviewGate';
import { MOCK_PROPOSAL } from './__mock__/proposal';

interface RefactorModeProps {
  /** Source mode for the simulation event hook. Default 'mock' for Wave 2. */
  source?: 'mock' | 'websocket';
  /** Required when source = 'websocket'. */
  simulationId?: string;
  /**
   * When true, seed the store with the mock proposal on mount so the smoke
   * route displays the ghost buildings + dual review gate without waiting
   * for a user-triggered chat invocation. Default true for Wave 2 demo
   * affordance.
   */
  autoSeedProposal?: boolean;
}

/**
 * ProposalSummaryCard: top section. Shows title + summary + user intent +
 * the OpenSpec change folder path. When no proposal in store, shows a
 * lightweight CTA hint.
 */
function ProposalSummaryCard() {
  const proposal = useAsclepiusStore((s) => s.refactor.proposal);

  if (!proposal) {
    return (
      <div className="pointer-events-auto rounded-2xl border border-dashed border-white/15 bg-codeplex-shadow/60 p-4 text-center text-[11px] text-white/45 backdrop-blur-glass">
        Ask Athena to propose a refactor to populate this panel.
      </div>
    );
  }

  return (
    <div
      className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-white/10 bg-codeplex-shadow/85 p-4 text-xs text-white/80 backdrop-blur-glass"
      data-asclepius-panel="proposal-summary"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
        Athena, City Hall
      </p>
      <h3 className="text-sm font-semibold text-white">{proposal.title}</h3>
      <p className="text-[11px] leading-relaxed text-white/80">
        {proposal.summary}
      </p>
      <p className="text-[10px] italic text-white/55">
        Intent: {proposal.userIntent}
      </p>
      <p className="font-mono text-[10px] text-white/45">
        Change folder: {proposal.openspecChangePath}
      </p>
      <p className="font-mono text-[10px] text-white/45">
        Ghost buildings: {proposal.ghostBuildings.length}
      </p>
    </div>
  );
}

export function RefactorMode({
  source = 'mock',
  simulationId,
  autoSeedProposal = true,
}: RefactorModeProps) {
  const setProposal = useAsclepiusStore((s) => s.setProposal);
  const setStage = useAsclepiusStore((s) => s.setStage);
  const currentProposal = useAsclepiusStore((s) => s.refactor.proposal);
  const stage = useAsclepiusStore((s) => selectRefactorSlice(s).stage);

  // Seed the mock proposal once so the demo + smoke route has a populated
  // surface from first paint.
  useEffect(() => {
    if (!autoSeedProposal) return;
    if (currentProposal) return;
    setProposal(MOCK_PROPOSAL);
    if (stage === 'idle') {
      setStage('proposed');
    }
  }, [autoSeedProposal, currentProposal, setProposal, setStage, stage]);

  return (
    <div
      className="flex h-full w-full flex-col gap-3 overflow-y-auto"
      data-mode="refactor"
      data-source={source}
      data-simulation-id={simulationId ?? ''}
    >
      <ProposalSummaryCard />
      <SimulationProgressIndicator />
      <DualReviewGate mode={source} simulationId={simulationId} />
    </div>
  );
}

RefactorMode.displayName = 'RefactorMode';
