/**
 * Refactor Mode public type re-export barrel.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Consumers (Wave 2 Persephone side panel + Wave 3 Pandora):
 *   import type {
 *     SimulationStage,
 *     SimulationEvent,
 *     RefactorProposalEvent,
 *     GhostBuildingHint,
 *     RefactorEvent,
 *   } from '@/modes/refactor/types';
 *
 * The canonical schema lives in `./simulationEvents.ts` per Pythia contract
 * `_meta/contracts/asclepius-to-pandora.md` lines 22-100. This file forwards
 * the types only so the module surface stays focused on schema (.ts file
 * tree mirrors the health/types.ts pattern).
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

export type {
  SimulationStage,
  GhostArchetype,
  GhostBuildingHint,
  SimulationEventPayload,
  SimulationEvent,
  RefactorProposalEvent,
  RefactorEvent,
} from './simulationEvents';

export { STAGE_LABEL, STAGE_TURN } from './simulationEvents';
