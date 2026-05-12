/**
 * Refactor Mode public barrel.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Consumer pattern (Persephone Wave 2 side panel + Wave 3 chat panel):
 *   import {
 *     RefactorMode,
 *     RefactorGhostLayer,
 *     GhostBuilding,
 *     GhostToSolidAnimation,
 *     DualReviewGate,
 *     SimulationProgressIndicator,
 *     useSimulationEvents,
 *   } from '@/modes/refactor';
 *
 * Schema imports go via `@/modes/refactor/types` which re-exports from
 * `simulationEvents.ts` (the canonical schema location).
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

export { RefactorMode } from './RefactorMode';
export { RefactorGhostLayer } from './RefactorGhostLayer';
export { GhostBuilding } from './GhostBuilding';
export { GhostToSolidAnimation } from './GhostToSolidAnimation';
export { DualReviewGate } from './DualReviewGate';
export { SimulationProgressIndicator } from './SimulationProgressIndicator';
export { useSimulationEvents } from './useSimulationEvents';

// Wave-Fixing #2 cycle 1 addition (STAMP=20260513-0313):
// Refactor intent input dispatches the Athena propose flow so ghost
// buildings auto-generate on /city without requiring smoke-route mount.
export { RefactorIntentInput } from './RefactorIntentInput';

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
