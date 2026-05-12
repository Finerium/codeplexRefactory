/**
 * Health Mode public barrel.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Consumer pattern (Persephone Wave 2 side panel + Wave 3 chat panel):
 *   import {
 *     HealthMode,
 *     FindingsPanel,
 *     EvidencePanel,
 *     ConvertToTicketButton,
 *     HealthGlowLayer,
 *     useAsclepiusStore,
 *     useApolloQueryContext,
 *   } from '@/modes/health';
 *
 * The barrel exposes ONLY stable surfaces. Mock data + the in-house pump
 * are intentionally not re-exported here so consumers cannot couple to
 * Wave 2 mock internals.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
 */

export { HealthMode } from './HealthMode';
export { HealthGlowLayer } from './HealthGlowLayer';
export { GlowWindow } from './GlowWindow';
export { FindingsPanel } from './FindingsPanel';
export { EvidencePanel } from './EvidencePanel';
export { ConvertToTicketButton } from './ConvertToTicketButton';

// Wave-Fixing #2 cycle 1 additions (STAMP=20260513-0313):
export {
  IssueFlyingPacketLayer,
  spawnFlyingPacket,
  useFlyingPackets,
} from './IssueFlyingPacket';
export type { FlyingPacketSpec } from './IssueFlyingPacket';
export { SpecDriftLayer, SPECDRIFT_MOCK_FLAGS } from './SpecDriftLayer';
export { SpecDriftCrackPattern, PATTERN_LABEL } from './SpecDriftCrackPattern';
export type { SpecDriftPattern, SpecDriftFlag } from './SpecDriftCrackPattern';

export { useFindings } from './useFindings';
export type { UseFindingsMode } from './useFindings';

export {
  useAsclepiusStore,
  useApolloQueryContext,
  selectApolloFindings,
  selectApolloGlowMap,
  selectApolloFilter,
  selectSelectedFinding,
  selectGlowWindows,
  selectRefactorSlice,
} from './asclepiusStore';

export type {
  ApolloFinding,
  ApolloContext,
  ApolloFilter,
  FindingCategory,
  GlowWindowState,
  Severity,
} from './types';

export {
  SEVERITY_PALETTE,
  SEVERITY_RANK,
  CATEGORY_LABEL,
} from './types';

export type {
  FindingEvent,
  FindingEventType,
  FindingEventPayload,
  ScanSummaryPayload,
} from './findingEvents';
