'use client';

/**
 * Refactor Mode real-backend client (Wave-Fixing #2 Cycle 1).
 *
 * Owner: Pandora (Wave-Fixing #2 Cycle 1 rescue, STAMP=20260513-0313).
 *
 * Bridges the Asclepius Wave 2 UI shell to Pandora Wave 3 backend that
 * shipped at `/api/refactor/*` plus the live WebSocket channel at
 * `/api/ws/refactor-events`. The R-1 verdict CRITICAL was rooted in two
 * gaps: (1) `app/api/__init__.py` not mounting `refactor.router` so
 * `POST /api/refactor/simulate` returned 404, fixed in backend; and
 * (2) frontend never POSTed to the real backend even when wired, so
 * the "Mulai simulate" button silently no-op'd. This module ships the
 * second half.
 *
 * Streaming pattern (PRD Section 9.3 step 4 "side panel auto-generate
 * OpenSpec change folder live"):
 *
 * 1. User types intent in side panel.
 * 2. UI calls `streamProposal(intent)` -> POST /api/refactor/propose.
 *    Backend responds with SSE stream; each event delivers a chunk:
 *      - proposal.started   -> { simulation_id, title, summary }
 *      - proposal.ghost     -> single ghost building (cardinality 1..3)
 *      - proposal.openspec.proposal_md -> { path, body }
 *      - proposal.openspec.design_md   -> { path, body }
 *      - proposal.openspec.tasks_md    -> { path, body }
 *      - proposal.complete            -> RefactorProposalEvent verbatim
 *      - proposal.simulate_ready      -> { simulation_id }
 * 3. UI subscribes WS `/api/ws/refactor-events?simulationId=<id>` AFTER
 *    proposal.complete so the bus history backfills any inbound stage
 *    events. Connects via openWebsocket().
 * 4. User clicks "Run Simulation". UI calls `triggerSimulate(intent)`
 *    -> POST /api/refactor/simulate. Backend dispatches 3-turn engine
 *    in background; events stream via the WS connection from step 3.
 * 5. User clicks "Accept changes" -> downloadAcceptDiff(simulation_id)
 *    -> POST /api/refactor/{id}/accept; the browser triggers a file
 *    save dialog for refactor-<id>.diff (OQ-09 download diff path).
 * 6. User clicks "Discard" -> postDiscard(simulation_id) -> POST
 *    /api/refactor/{id}/discard; the backend cleans up drafts/.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 + AD-19
 * (production code never changes from this client; accept produces a
 * downloadable diff, not an in-place apply).
 */

import type {
  GhostBuildingHint,
  RefactorProposalEvent,
} from './simulationEvents';

const PROPOSE_URL = '/api/refactor/propose';
const SIMULATE_URL = '/api/refactor/simulate';
const ACCEPT_URL = (sid: string) => `/api/refactor/${encodeURIComponent(sid)}/accept`;
const DISCARD_URL = (sid: string) => `/api/refactor/${encodeURIComponent(sid)}/discard`;
const WS_URL = (sid: string) =>
  `/api/ws/refactor-events?simulationId=${encodeURIComponent(sid)}`;

export interface ProposeRequest {
  user_intent: string;
  repo_slug?: string;
  author_user_id?: number;
}

export interface ProposalStartedFrame {
  type: 'proposal.started';
  simulation_id: string;
  title: string;
  summary: string;
  user_intent: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface ProposalGhostFrame {
  type: 'proposal.ghost';
  simulation_id: string;
  ghost: GhostBuildingHint;
}

export interface ProposalOpenSpecFrame {
  type:
    | 'proposal.openspec.proposal_md'
    | 'proposal.openspec.design_md'
    | 'proposal.openspec.tasks_md';
  simulation_id: string;
  path: string;
  body: string;
}

export interface ProposalCompleteFrame {
  type: 'proposal.complete';
  proposal: RefactorProposalEvent;
}

export interface ProposalSimulateReadyFrame {
  type: 'proposal.simulate_ready';
  simulation_id: string;
  simulate_url: string;
  websocket_url: string;
}

export interface ProposalFallbackGithubIssueFrame {
  type: 'proposal.fallback.github_issue';
  simulation_id: string;
  issue_url: string;
  issue_title: string;
  issue_body_preview: string;
}

export interface ProposalErrorFrame {
  type: 'proposal.error';
  error: string;
}

export type ProposalFrame =
  | ProposalStartedFrame
  | ProposalGhostFrame
  | ProposalOpenSpecFrame
  | ProposalCompleteFrame
  | ProposalSimulateReadyFrame
  | ProposalFallbackGithubIssueFrame
  | ProposalErrorFrame;

/**
 * Stream the proposal SSE endpoint. Returns an AsyncIterable<ProposalFrame>
 * the caller iterates; cleanup (closing the underlying reader) is automatic
 * when the iterator exits.
 */
export async function* streamProposal(
  req: ProposeRequest,
  signal?: AbortSignal,
): AsyncIterable<ProposalFrame> {
  const response = await fetch(PROPOSE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(
      `propose failed: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frame separator is a blank line.
      let frameEnd: number;
      while ((frameEnd = buffer.indexOf('\n\n')) >= 0) {
        const rawFrame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const parsed = parseSseFrame(rawFrame);
        if (parsed) yield parsed;
      }
    }
    // Tail flush in case the server omitted the trailing blank line.
    buffer += decoder.decode();
    if (buffer.trim().length > 0) {
      const parsed = parseSseFrame(buffer.trim());
      if (parsed) yield parsed;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // already released
    }
  }
}

function parseSseFrame(raw: string): ProposalFrame | null {
  let event = 'message';
  let data = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim();
    }
  }
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (event === 'proposal.complete') {
      // The backend emits the RefactorProposalEvent fields inline;
      // wrap in our discriminated union shape.
      return {
        type: 'proposal.complete',
        proposal: parsed as RefactorProposalEvent,
      };
    }
    return { type: event, ...parsed } as ProposalFrame;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[refactor-client] SSE frame parse failed:', err, raw);
    return null;
  }
}

/**
 * POST /api/refactor/simulate. Server dispatches the 3-turn engine in
 * a background task; the response carries the simulation_id so the
 * client can connect the WebSocket for the stage stream.
 */
export interface SimulateResponse {
  simulation_id: string;
  proposal_id: string;
  openspec_change_path: string;
  title: string;
  summary: string;
  stage: 'proposed' | 'simulating';
  websocket_url: string;
}

export async function triggerSimulate(
  req: ProposeRequest,
): Promise<SimulateResponse> {
  const response = await fetch(SIMULATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`simulate failed: ${response.status} ${text}`);
  }
  return (await response.json()) as SimulateResponse;
}

/**
 * Open the refactor-events WebSocket and dispatch each parsed frame
 * to the supplied handler. Returns a teardown function the caller
 * uses in useEffect cleanup.
 */
export function openWebsocket(
  simulationId: string,
  onFrame: (frame: unknown) => void,
  onClose?: (event: CloseEvent) => void,
): () => void {
  // The WebSocket URL must use the same origin scheme: ws on http, wss
  // on https. Browser-only API; this module is `use client`.
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? 'wss:'
    : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
  const url = `${proto}//${host}${WS_URL(simulationId)}`;
  let ws: WebSocket | null = null;
  try {
    ws = new WebSocket(url);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[refactor-client] WebSocket construct failed:', err);
    return () => undefined;
  }
  ws.onmessage = (e: MessageEvent<string>) => {
    try {
      const frame = JSON.parse(e.data);
      onFrame(frame);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[refactor-client] WS parse failed:', err);
    }
  };
  ws.onerror = (err) => {
    // eslint-disable-next-line no-console
    console.warn('[refactor-client] WS error:', err);
  };
  if (onClose) {
    ws.onclose = onClose;
  }
  return () => {
    try {
      ws?.close();
    } catch {
      // already closed
    }
  };
}

/**
 * Trigger Accept; the server returns an octet-stream diff which we save
 * via a synthetic anchor click. Returns the download filename so the
 * caller can flash a toast.
 */
export async function downloadAcceptDiff(
  simulationId: string,
): Promise<string> {
  const response = await fetch(ACCEPT_URL(simulationId), { method: 'POST' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`accept failed: ${response.status} ${text}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const filename = `refactor-${simulationId}.diff`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the save before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export interface DiscardResponseBody {
  simulation_id: string;
  stage: 'discarded' | 'archived';
  drafts_cleaned: boolean;
}

export async function postDiscard(
  simulationId: string,
): Promise<DiscardResponseBody> {
  const response = await fetch(DISCARD_URL(simulationId), { method: 'POST' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`discard failed: ${response.status} ${text}`);
  }
  return (await response.json()) as DiscardResponseBody;
}
