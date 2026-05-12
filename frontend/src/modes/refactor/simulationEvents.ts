/**
 * Refactor Mode simulation event types.
 *
 * Owner: Asclepius (Wave 2) authors; Pandora (Wave 3) publishes.
 * Contracts:
 *   - `_meta/contracts/asclepius-to-pandora.md` lines 22-100 (canonical
 *      schema; Asclepius defines, Pandora implements as producer)
 *   - `_meta/contracts/pandora-to-asclepius.md` lines 16-65 (feedback edge:
 *      Pandora publishes events Asclepius consumes for ghost-to-solid
 *      visual feedback)
 *
 * Visual stance lock: per PRD AD-19 (drafts/ isolation safety property),
 * the production code NEVER changes by simulation engine, ONLY via explicit
 * user Accept. The 9-stage state machine encoded below mirrors the Pythia
 * contract verbatim so Pandora Wave 3 wires the producer side without
 * client-side schema drift.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 (safety-first
 * Refactor Mode: visual side only, dual review gate UI hookup; production
 * code mutation is Pandora backend territory).
 */

/**
 * Simulation stage discriminator per `asclepius-to-pandora.md` lines 25-35.
 * Stages advance monotonically except 'accepted' / 'discarded' which are
 * terminal user-action states reachable from 'completed'.
 */
export type SimulationStage =
  | 'proposed' // Athena published proposal, ghost buildings appear
  | 'tests_generating' // Turn 1 of simulation engine
  | 'tests_written' // Turn 1 complete, failing tests in drafts/
  | 'impl_generating' // Turn 2 of simulation engine
  | 'impl_written' // Turn 2 complete, implementation in drafts/
  | 'diff_serializing' // Turn 3 of simulation engine
  | 'completed' // Drafts ready for review (dual review gate enables Accept/Discard)
  | 'accepted' // User clicked Accept; ghost-to-solid transition
  | 'discarded'; // User clicked Discard; ghost fades

/**
 * Ghost building archetype enum. Matches Pythia
 * `asclepius-to-pandora.md` lines 41-43; Pandora suggests one of these per
 * ghost based on suggested file type. The string values are intentionally
 * distinct from `BuildingArchetype` in `@/scene/buildings/types.ts` because
 * the ghost is a synthetic suggestion (not a real file yet), so the
 * archetype hint is coarser (residence / warehouse / office).
 */
export type GhostArchetype =
  | 'generic-residence'
  | 'generic-warehouse'
  | 'generic-office';

/**
 * Ghost building hint per `asclepius-to-pandora.md` lines 36-53. Pandora
 * computes the position; Asclepius renders directly (Iris does NOT recompute
 * per contract Asumption 5). Wave 2 mock populates via Athena-style
 * pretend-proposal helper.
 */
export interface GhostBuildingHint {
  /** Synthetic id for ghost building, prefixed "ghost-". */
  ghostId: string;
  /** Suggested position in city space (matches BuildingData.position semantics). */
  position: [number, number, number];
  /** Suggested archetype for the synthetic ghost. */
  archetype: GhostArchetype;
  /** Footprint width in world units. */
  width: number;
  /** Footprint depth in world units. */
  depth: number;
  /** Building height in world units. */
  height: number;
  /** Connection lines to existing buildings (file references). */
  connections: {
    targetBuildingId: string;
    relationship: 'import' | 'reference' | 'callsite';
  }[];
  /** Tooltip label for ghost. */
  label: string;
  /** Suggested file path where Pandora simulation would write. */
  suggestedFilePath: string;
}

/**
 * SimulationEvent payload variants per `asclepius-to-pandora.md` lines 60-76.
 * The stage discriminator selects which optional fields are populated.
 */
export interface SimulationEventPayload {
  /** When stage = 'proposed': ghost building hints. */
  ghostBuildings?: GhostBuildingHint[];
  /** When stage = 'tests_written' or 'impl_written': file paths affected. */
  filesAffected?: string[];
  /** When stage = 'completed': drafts directory path. */
  draftsPath?: string;
  /** When stage = 'accepted': downloaded diff file path. */
  diffFilePath?: string;
  /** Progress percentage 0..100 for in-progress stages. */
  progressPercent?: number;
  /** Error message if simulation failed at this stage. */
  error?: string;
}

/**
 * Stage event published at every state transition per
 * `asclepius-to-pandora.md` line 55. Pandora batches a payload at each
 * stage; the consumer (this client) updates ghost visual + progress UI per
 * stage.
 */
export interface SimulationEvent {
  type: 'simulation.stage';
  /** Simulation id linking events; matches OpenSpec change folder name. */
  simulationId: string;
  stage: SimulationStage;
  /** Timestamp ISO 8601. */
  timestamp: string;
  /** Stage-specific payload. */
  payload: SimulationEventPayload;
}

/**
 * Proposal event published once at Turn 0 per `asclepius-to-pandora.md`
 * lines 79-94. Carries the OpenSpec change folder reference + ghost building
 * hints. Asclepius caches these per contract `pandora-to-asclepius.md`
 * Asumption 3 "ghost_buildings hints published once at Turn 0".
 */
export interface RefactorProposalEvent {
  type: 'simulation.proposal';
  simulationId: string;
  /** OpenSpec change folder relative path (e.g., "openspec/changes/add-2fa/"). */
  openspecChangePath: string;
  /** Athena-authored proposal title. */
  title: string;
  /** Athena-authored proposal summary (1-2 sentences). */
  summary: string;
  /** User intent that triggered proposal (verbatim from chat input). */
  userIntent: string;
  /** Ghost buildings to render. Match `simulation.stage.proposed.payload.ghostBuildings`. */
  ghostBuildings: GhostBuildingHint[];
  /** Timestamp ISO 8601. */
  timestamp: string;
}

/**
 * Union of refactor events per `asclepius-to-pandora.md` line 96. The
 * consumer narrows on `type` field.
 */
export type RefactorEvent = SimulationEvent | RefactorProposalEvent;

/**
 * Stage-to-label map for the SimulationProgressIndicator turn-by-turn UI.
 * Apollo persona warmth retained: clinical-but-friendly labels.
 */
export const STAGE_LABEL: Record<SimulationStage, string> = {
  proposed: 'Proposal authored',
  tests_generating: 'Generating failing tests',
  tests_written: 'Tests written to drafts',
  impl_generating: 'Generating implementation',
  impl_written: 'Implementation written to drafts',
  diff_serializing: 'Serializing diff',
  completed: 'Ready for review',
  accepted: 'Accepted, applied to production',
  discarded: 'Discarded, drafts preserved',
};

/**
 * Stage-to-turn map (Turn 1, 2, 3 per Pythia contract Asumption 1
 * "tests gen (V4-Pro think high), impl gen (V4-Pro think high), diff serial
 * (V4-Flash non-think)"). Used for the 3-step progress indicator.
 */
export const STAGE_TURN: Record<SimulationStage, 0 | 1 | 2 | 3 | 4> = {
  proposed: 0,
  tests_generating: 1,
  tests_written: 1,
  impl_generating: 2,
  impl_written: 2,
  diff_serializing: 3,
  completed: 4,
  accepted: 4,
  discarded: 4,
};
