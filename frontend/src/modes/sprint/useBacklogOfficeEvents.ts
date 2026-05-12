'use client';

/**
 * useBacklogOfficeEvents: pub/sub for backlog office arrival pulses.
 *
 * Owner: Hera (Wave-Fixing #2 cycle 1, STAMP=20260513-0319).
 *
 * Asclepius IssueFlyingPacket fires a 'issue.arrived' event when its
 * quadratic-Bezier flying animation completes at the target landing pad. The
 * BacklogOffice component subscribes here + fires an arrival glow pulse.
 *
 * Hera mock tape can also fire arrivals on issue.opened (the demo flow PRD
 * Section 9.5 line 596) so the office reads alive during the 90s loop even
 * without a user actively clicking Convert to Backlog Ticket.
 *
 * Multiple subscribers safe (matches Iris useBuildingClick fanout pattern).
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): production pub/sub, no mock label
 */

import { useEffect } from 'react';

export interface BacklogOfficeEvent {
  type: 'issue.arrived';
  /** Source building id (finding origin), if any. */
  sourceBuildingId?: string;
  /** Linked GitHub issue number. */
  issueNumber?: number;
  /** Trigger timestamp (ms epoch). */
  timestamp: number;
}

type Handler = (event: BacklogOfficeEvent) => void;

const subscribers = new Set<Handler>();

/**
 * Dispatch a backlog office event to all current subscribers.
 *
 * Failure isolation: a throwing subscriber does not break the fanout.
 */
export function dispatchBacklogOfficeEvent(event: BacklogOfficeEvent): void {
  for (const handler of subscribers) {
    try {
      handler(event);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[hera/useBacklogOfficeEvents] subscriber threw:', error);
    }
  }
}

/**
 * Subscribe to backlog office events. Auto-unsubscribe on unmount.
 */
export function useBacklogOfficeEvents(handler: Handler): void {
  useEffect(() => {
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, [handler]);
}
