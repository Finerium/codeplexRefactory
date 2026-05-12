'use client';

/**
 * useFindings: stream Wave 2 mock findings into the Asclepius store.
 *
 * [STUB Wave 2 mock pump, real Wave 3 Nemesis publishes via WebSocket]
 *
 * Owner: Asclepius (Wave 2).
 * Contract: `_meta/contracts/nemesis-to-asclepius.md` lines 100-144
 *   (useFindingEvents subscriber pattern; same hook surface in Wave 3 swap).
 *
 * Wave 2 implementation strategy: a setTimeout pump dispatches each entry
 * of `MOCK_FINDINGS` one-by-one with a 250ms cadence. This exercises the
 * exact same `setFinding` -> compute glow map -> render glow code path that
 * Wave 3 will drive over `/api/ws/finding-events`. When Pandora wires the
 * real Nemesis publisher, only the data source swaps; downstream UI logic
 * is identical (this is the canonical r3f + zustand pattern: data flows
 * through the store, components subscribe via selectors).
 *
 * Optional `mode` parameter:
 *   - 'mock' (default in Wave 2): pump dispatch over setTimeout.
 *   - 'websocket' (Wave 3 swap): subscribe to /api/ws/finding-events.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock pump
 * labeled here + in MOCK_FINDINGS module).
 */

import { useEffect } from 'react';
import { useAsclepiusStore } from './asclepiusStore';
import { MOCK_FINDINGS } from './__mock__/findings';
import type { FindingEvent } from './findingEvents';

export type UseFindingsMode = 'mock' | 'websocket';

interface UseFindingsOptions {
  /** Source mode. Default 'mock' for Wave 2. */
  mode?: UseFindingsMode;
  /** Repo full name for the WebSocket subscription. Required when mode = 'websocket'. */
  repoFullName?: string;
  /**
   * Cadence between mock dispatches (ms). Default 250ms keeps the demo
   * visual lively without overwhelming the smoke route render cost. Set to
   * 0 to dispatch all findings synchronously on mount (useful for tests).
   */
  mockCadenceMs?: number;
}

/**
 * Wave 2 mock pump. Dispatches each MOCK_FINDINGS entry with the configured
 * cadence. Cleanup cancels any in-flight setTimeout via the captured id list.
 */
function startMockPump(
  setFinding: (finding: (typeof MOCK_FINDINGS)[number]) => void,
  cadenceMs: number,
): () => void {
  const ids: ReturnType<typeof setTimeout>[] = [];
  MOCK_FINDINGS.forEach((finding, index) => {
    const handle = setTimeout(() => {
      setFinding(finding);
    }, cadenceMs * index);
    ids.push(handle);
  });
  return () => {
    for (const id of ids) clearTimeout(id);
  };
}

/**
 * Wave 3 websocket subscriber. Schema matches `nemesis-to-asclepius.md`
 * lines 100-144. The implementation is here so Wave 3 only needs to switch
 * the default mode value + wire the backend; no client-side rewiring.
 */
function startWebsocket(
  repoFullName: string,
  setFinding: ReturnType<typeof useAsclepiusStore.getState>['setFinding'],
  setGlow: ReturnType<typeof useAsclepiusStore.getState>['setGlow'],
): () => void {
  const url = `/api/ws/finding-events?repo=${encodeURIComponent(repoFullName)}`;
  let ws: WebSocket | null = null;
  try {
    ws = new WebSocket(url);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[asclepius] WebSocket construct failed (Wave 3 backend?):', err);
    return () => undefined;
  }
  ws.onmessage = (e: MessageEvent<string>) => {
    try {
      const event = JSON.parse(e.data) as FindingEvent;
      if (event.type === 'finding.detected' && event.finding) {
        setFinding({
          id: event.finding.id,
          buildingId: event.finding.buildingId,
          severity: event.finding.severity,
          category: event.finding.category,
          title: event.finding.title,
          filePath: event.finding.filePath,
          lineStart: event.finding.lineStart,
          lineEnd: event.finding.lineEnd,
          description: '',
          suggestedFix: '',
          detectedAt: event.timestamp,
          status: 'open',
          linkedIssueNumber: null,
        });
      }
      if (event.type === 'finding.resolved' && event.finding) {
        setGlow(event.finding.buildingId, null);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[asclepius] WebSocket message parse failed:', err);
    }
  };
  return () => {
    ws?.close();
  };
}

/**
 * Public hook. Starts the configured stream on mount; cleans up on unmount.
 * Components do not need to read the return value; the store side-effects
 * drive the glow layer + findings panel.
 */
export function useFindings(options: UseFindingsOptions = {}): void {
  const { mode = 'mock', repoFullName, mockCadenceMs = 250 } = options;
  const setFinding = useAsclepiusStore((s) => s.setFinding);
  const setGlow = useAsclepiusStore((s) => s.setGlow);

  useEffect(() => {
    if (mode === 'mock') {
      return startMockPump(setFinding, mockCadenceMs);
    }
    if (mode === 'websocket' && repoFullName) {
      return startWebsocket(repoFullName, setFinding, setGlow);
    }
    return undefined;
  }, [mode, repoFullName, mockCadenceMs, setFinding, setGlow]);
}
