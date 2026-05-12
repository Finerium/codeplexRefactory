'use client';

/**
 * useSimulationEvents: stream Wave 2 mock refactor events into the
 * Asclepius store. Drives the ghost-to-solid animation + dual review gate
 * lifecycle.
 *
 * [STUB Wave 2 mock pump, real Wave 3 Pandora publishes via WebSocket]
 *
 * Owner: Asclepius (Wave 2).
 * Contract: `_meta/contracts/pandora-to-asclepius.md` lines 82-102
 *   (useRefactorEvents subscriber pattern + WebSocket channel).
 *
 * Wave 2 implementation: imperative pump triggered when the user clicks
 * "Run Simulation". The pump walks `buildMockEventSequence()` with cadence
 * derived from each event's expected duration (Pandora Wave 3 will publish
 * at the natural cadence of the V4-Pro thinking high turns; Wave 2 mock
 * simulates that timing so the demo feels real-time).
 *
 * Wave 3 swap: switch `mode` to 'websocket' + provide `simulationId`. The
 * downstream store ingestion logic + components stay identical.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock pump
 * labeled here + in proposal mock module).
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAsclepiusStore } from '../health/asclepiusStore';
import {
  MOCK_PROPOSAL,
  buildMockEventSequence,
} from './__mock__/proposal';
import type { RefactorEvent } from './simulationEvents';

export type UseSimulationEventsMode = 'mock' | 'websocket';

interface UseSimulationEventsOptions {
  mode?: UseSimulationEventsMode;
  /** Required when mode = 'websocket'. */
  simulationId?: string;
  /**
   * Mock event cadence multiplier. 1.0 = real-time-ish (~14 sec total).
   * Demo footage uses 0.5 (~7 sec total) for tighter pitch beats.
   */
  mockSpeed?: number;
}

interface UseSimulationEventsApi {
  /** Trigger the mock simulation. Idempotent: re-running clears the previous run. */
  runSimulation: () => void;
  /** Reset to idle (clears proposal + stage). */
  reset: () => void;
}

function pumpMockEvents(
  speed: number,
  ingestRefactorEvent: (event: RefactorEvent) => void,
): () => void {
  const handles: ReturnType<typeof setTimeout>[] = [];
  const sequence = buildMockEventSequence();

  // Dispatch the proposal first (Turn 0) so ghost buildings appear before
  // any stage event lands.
  ingestRefactorEvent(MOCK_PROPOSAL);

  // Schedule each stage event at a wall-clock relative offset, scaled by
  // the speed multiplier. Total wall-clock for default speed = ~14 sec.
  // Offsets chosen to roughly mirror the timestamps embedded in the mock
  // sequence (sec 2.1 -> 14.3).
  const offsetsMs = [
    1100, // tests_generating after 1.1s
    4400, // tests_written after 4.4s (3.3s test gen)
    5100, // impl_generating after 5.1s
    9800, // impl_written after 9.8s (4.7s impl gen)
    10200, // diff_serializing after 10.2s
    12300, // completed after 12.3s
  ];

  sequence.forEach((event, idx) => {
    const handle = setTimeout(() => {
      ingestRefactorEvent(event);
    }, offsetsMs[idx] * speed);
    handles.push(handle);
  });

  return () => {
    for (const id of handles) clearTimeout(id);
  };
}

function startWebsocket(
  simulationId: string,
  ingestRefactorEvent: (event: RefactorEvent) => void,
): () => void {
  const url = `/api/ws/refactor-events?simulationId=${encodeURIComponent(
    simulationId,
  )}`;
  let ws: WebSocket | null = null;
  try {
    ws = new WebSocket(url);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[asclepius] Refactor WebSocket construct failed:', err);
    return () => undefined;
  }
  ws.onmessage = (e: MessageEvent<string>) => {
    try {
      const event = JSON.parse(e.data) as RefactorEvent;
      ingestRefactorEvent(event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[asclepius] Refactor WebSocket parse failed:', err);
    }
  };
  return () => {
    ws?.close();
  };
}

/**
 * Public hook. Returns imperative API; components call `runSimulation()` on
 * the "Run Simulation" button click. Cleanup cancels any in-flight pump.
 */
export function useSimulationEvents(
  options: UseSimulationEventsOptions = {},
): UseSimulationEventsApi {
  const { mode = 'mock', simulationId, mockSpeed = 1.0 } = options;
  const ingestRefactorEvent = useAsclepiusStore((s) => s.ingestRefactorEvent);
  const resetRefactor = useAsclepiusStore((s) => s.resetRefactor);
  const cancelRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  // WebSocket subscription, when configured.
  useEffect(() => {
    if (mode !== 'websocket' || !simulationId) return;
    const cancel = startWebsocket(simulationId, ingestRefactorEvent);
    cancelRef.current = cancel;
    return () => {
      cancel();
      cancelRef.current = null;
    };
  }, [mode, simulationId, ingestRefactorEvent]);

  const runSimulation = useCallback(() => {
    if (mode !== 'mock') {
      // Wave 3: imperative trigger is `POST /api/refactor/simulate`; the
      // WebSocket subscription effect above handles event ingestion.
      // Wave 2 mock pumps when invoked here.
      // eslint-disable-next-line no-console
      console.warn('[asclepius] runSimulation called in non-mock mode; backend should be triggered separately.');
      return;
    }
    cancelRef.current?.();
    resetRefactor();
    cancelRef.current = pumpMockEvents(1.0 / mockSpeed, ingestRefactorEvent);
  }, [mode, mockSpeed, ingestRefactorEvent, resetRefactor]);

  const reset = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    resetRefactor();
  }, [resetRefactor]);

  return { runSimulation, reset };
}
