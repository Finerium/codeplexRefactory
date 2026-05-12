/**
 * Finding event channel types.
 *
 * Owner: Asclepius (Wave 2) authors; Nemesis (Wave 3) publishes.
 * Contract: `_meta/contracts/nemesis-to-asclepius.md` lines 22-60 (feedback
 *   edge schema). WebSocket channel `/api/ws/finding-events?repo=<full_name>`
 *   broadcast by Nemesis after scan persist (per
 *   `nemesis-to-asclepius.md` line 80).
 *
 * Wave 2 stance: this module defines the schema; the WebSocket subscription
 * lives in `useFindingEvents.ts`. Wave 2 mock simulates events via
 * `__mock__/findingEventStream.ts` setTimeout pump so the smoke route
 * exercises the same code path Wave 3 will drive over WebSocket.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock pump
 * labeled at source).
 */

import type { FindingCategory, Severity } from './types';

/**
 * Event type discriminator per `nemesis-to-asclepius.md` lines 25-31.
 *   - finding.detected: new finding from scan run (full payload)
 *   - finding.resolved: finding resolved (status change; glow removed)
 *   - finding.ticketed: finding converted to GitHub issue (status update)
 *   - finding.snoozed:  user snoozed finding (status update)
 *   - scan.started:    scan run beginning (UI shows loading hint)
 *   - scan.completed:  scan run finished (UI shows summary)
 */
export type FindingEventType =
  | 'finding.detected'
  | 'finding.resolved'
  | 'finding.ticketed'
  | 'finding.snoozed'
  | 'scan.started'
  | 'scan.completed';

/**
 * Per-finding payload embedded in `finding.*` events. Shape matches Pythia
 * contract `nemesis-to-asclepius.md` lines 40-49 verbatim.
 */
export interface FindingEventPayload {
  id: string;
  buildingId: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Scan summary embedded in `scan.completed` events. Pythia contract lines
 * 51-56. Used for the findings panel header "12 findings, 3 critical, 4
 * high" subtitle.
 */
export interface ScanSummaryPayload {
  totalFindings: number;
  bySeverity: Record<Severity, number>;
  byCategory: Record<string, number>;
  durationMs: number;
}

/**
 * Full event envelope. Discriminator field is `type`; payloads are optional
 * fields populated based on type. WebSocket consumer narrows in the switch
 * block per `useFindingEvents.ts`.
 */
export interface FindingEvent {
  type: FindingEventType;
  /** Repo full name (e.g., "ghaisan/codeplexRefactory"). */
  repoFullName: string;
  /** Scan run id grouping events from the same scan. */
  scanRunId: string;
  /** Present when type starts with 'finding.'. */
  finding?: FindingEventPayload;
  /** Present when type = 'scan.completed'. */
  scanSummary?: ScanSummaryPayload;
  /** Timestamp ISO 8601. */
  timestamp: string;
}
