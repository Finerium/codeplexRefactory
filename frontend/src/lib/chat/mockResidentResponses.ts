/**
 * [WAVE-FIXING #2 CYCLE 1 Triton 20260513-0312, REAL SSE WAVE 3 SWAP COMPLETE]
 *
 * Previously: Wave 2 Persephone mock that returned canned welcome menu loop
 * without ever fetching the backend. Production verdict from Manager Wave-
 * Fixing #2 STAMP 20260513-0309: `/api/llm/health calls_recorded:0` for
 * every redeploy, confirming the frontend never touched DeepSeek. Bug 8 T-1
 * x 5 (all 5 residents MOCK).
 *
 * Now: real fetch to `POST /api/chat` SSE endpoint authored by Triton in
 * `backend/app/api/chat.py`. Same async generator surface
 * (`AsyncGenerator<StreamChatEvent>`) so all upstream consumers
 * (`useChatRouting.ts`, ChatPanel) keep working unchanged.
 *
 * Wire format consumed (matches `backend/app/api/chat.py::_sse`):
 *   event: chunk\n
 *   data: {"residentId":"Apollo","text":"<partial>"}\n\n
 *   ...
 *   event: done\n
 *   data: {"residentId":"Apollo","modelUsed":"V4-Flash-non-think","inputTokens":...}\n\n
 *
 * Backwards-compatible exports:
 *   - streamChat(req): async generator
 *   - STREAM_CHAT_MODE constant: now `'real-wave-3-sse'`
 *
 * File name retained (`mockResidentResponses.ts`) so the package `index.ts`
 * re-exports do not break and there is no import-site churn across the
 * codebase. Module-level header documents the migration clearly.
 *
 * Anti-pattern critical (Phase B): The SSE stream NEVER replays
 * reasoning_content. Backend strips it on outbound via
 * `DeepSeekClient._scrub_messages` (Triton Wave 3 ship). The frontend's
 * single responsibility is to forward chunks + the final metadata envelope.
 *
 * Network failure handling:
 *   - Non-200 response or fetch reject: emit a single graceful error chunk
 *     + a `done` event with conservative metadata so the chat panel can
 *     render the assistant bubble without hanging the `streaming` flag.
 *   - SSE parse error mid-stream: same graceful-end behaviour.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): real-wave-3-sse mode label at top + exported.
 *   Lock 4 (Phase B reasoning_content quirk): not replayed; documented.
 */

import { apiUrl, resolveApiBase } from '../apiUrl';
import type {
  ChatMessageMetadata,
  SendChatRequest,
  StreamChatEvent,
} from './types';

/**
 * Map Triton SSE response `req.target` enum to the wire literal. Backend
 * accepts the same TitleCase strings; this is a defensive identity map.
 */
function targetWireLabel(target: SendChatRequest['target']): string {
  return target;
}

/**
 * Build the `POST /api/chat` request body matching Triton's
 * `ChatRequestModel`.
 */
function buildBackendBody(req: SendChatRequest): Record<string, unknown> {
  return {
    thread_id: req.threadId,
    target: targetWireLabel(req.target),
    message: req.message,
    context: {
      current_mode: req.context.currentMode,
      selected_building_id: req.context.selectedBuildingId,
      mode_context: req.context.modeContext ?? {},
    },
  };
}

interface ParsedEvent {
  event: string;
  data: string;
}

/**
 * Parse a raw SSE buffer slice into discrete `event/data` records. Returns
 * the list of parsed events plus the unconsumed trailing buffer (one or two
 * lines that arrived partial across the chunk boundary).
 */
function parseSseBuffer(buffer: string): {
  events: ParsedEvent[];
  rest: string;
} {
  const events: ParsedEvent[] = [];
  // SSE records are separated by blank line ("\n\n").
  const segments = buffer.split('\n\n');
  // The trailing segment may be a partial record; keep it for the next pass.
  const rest = segments.pop() ?? '';
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (trimmed.length === 0) continue;
    let evt = 'message';
    const dataLines: string[] = [];
    for (const line of seg.split('\n')) {
      if (line.startsWith('event: ')) {
        evt = line.slice('event: '.length).trim();
      } else if (line.startsWith('data: ')) {
        dataLines.push(line.slice('data: '.length));
      }
    }
    events.push({ event: evt, data: dataLines.join('\n') });
  }
  return { events, rest };
}

/**
 * Translate the backend `done` JSON envelope into the frontend
 * `ChatMessageMetadata` shape. The backend already labels `modelUsed` using
 * the `UiModelLabel` literal so the cast is sound.
 *
 * Defensive: fall back to V4-Flash-non-think when the field is absent.
 */
function normalizeDoneMetadata(
  raw: Record<string, unknown>,
  latencyFallbackMs: number
): ChatMessageMetadata {
  const modelUsed = (raw.modelUsed as ChatMessageMetadata['modelUsed']) ??
    'V4-Flash-non-think';
  const inputTokens = Number(raw.inputTokens ?? 0);
  const outputTokens = Number(raw.outputTokens ?? 0);
  const latencyMs = Number(raw.latencyMs ?? latencyFallbackMs);
  const cacheHit = Boolean(raw.cacheHit ?? false);
  return {
    modelUsed,
    inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
    latencyMs: Number.isFinite(latencyMs) ? latencyMs : latencyFallbackMs,
    cacheHit,
  };
}

/**
 * Real Wave 3 chat stream consumer. POSTs to `/api/chat` and yields
 * `{ chunk }` + `{ done }` events as they arrive.
 *
 * The async-generator surface is unchanged from the Wave 2 mock so all chat
 * consumers (`useChatRouting`) continue to work.
 *
 * Broadcast target: backend handles fanout sequentially across 5 residents
 * (see `_stream_broadcast` in `backend/app/api/chat.py`). The frontend just
 * forwards each chunk as it arrives; the chunk payload carries `residentId`
 * so a future UI can split into 5 bubbles. Wave 3 cycle 3 ChatPanel renders
 * to a single thread, so we concatenate text into one bubble for broadcast
 * for now (Persephone scope to upgrade in Wave 4 if needed).
 */
export async function* streamChat(
  req: SendChatRequest
): AsyncGenerator<StreamChatEvent> {
  const startedAt = Date.now();
  // Wave-Fixing 3 Manager FINAL (Triton, STAMP 20260513-0626): URL composition
  // now goes through the canonical `apiUrl()` helper in `src/lib/apiUrl.ts`
  // which strips any accidental `/api` suffix in `NEXT_PUBLIC_API_URL` so the
  // T-1 double-prefix bug (`/api/api/chat` 404) cannot recur via ConfigMap
  // edit. See `src/lib/apiUrl.ts` module header for rationale.
  const url = apiUrl('/chat');
  const body = buildBackendBody(req);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include', // forward hades_session cookie when present
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Network error before reaching backend. Surface a single error chunk +
    // graceful done so the panel does not hang.
    yield {
      chunk:
        'Maaf, koneksi ke resident putus. Coba refresh atau cek koneksi internet kamu.',
    };
    yield {
      done: {
        modelUsed: 'V4-Flash-non-think',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        cacheHit: false,
      },
    };
    // eslint-disable-next-line no-console
    console.error('[triton] /api/chat fetch failed', err);
    return;
  }

  if (!response.ok || !response.body) {
    yield {
      chunk: `Apologies, residents temporarily unavailable (HTTP ${response.status}).`,
    };
    yield {
      done: {
        modelUsed: 'V4-Flash-non-think',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startedAt,
        cacheHit: false,
      },
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalMetadata: ChatMessageMetadata | undefined;
  // For broadcast, the stream interleaves chunks + done events per resident.
  // Wave 3 cycle 3 single-bubble rendering means we want the latest done
  // metadata to win (it represents the last resident in the sequence). A
  // future split-by-resident UI iteration is Persephone Wave 4 scope.

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const evt of events) {
        if (evt.data.length === 0) continue;
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(evt.data) as Record<string, unknown>;
        } catch (parseErr) {
          // eslint-disable-next-line no-console
          console.warn('[triton] SSE JSON parse error', parseErr, evt.data);
          continue;
        }
        if (evt.event === 'chunk') {
          const text = typeof parsed.text === 'string' ? parsed.text : '';
          if (text.length > 0) {
            yield { chunk: text };
          }
        } else if (evt.event === 'done') {
          finalMetadata = normalizeDoneMetadata(parsed, Date.now() - startedAt);
        }
      }
    }
    // Flush any trailing buffered record after stream close.
    if (buffer.trim().length > 0) {
      const { events } = parseSseBuffer(buffer + '\n\n');
      for (const evt of events) {
        if (evt.data.length === 0) continue;
        try {
          const parsed = JSON.parse(evt.data) as Record<string, unknown>;
          if (evt.event === 'chunk') {
            const text = typeof parsed.text === 'string' ? parsed.text : '';
            if (text.length > 0) yield { chunk: text };
          } else if (evt.event === 'done') {
            finalMetadata = normalizeDoneMetadata(
              parsed,
              Date.now() - startedAt
            );
          }
        } catch {
          // swallow trailing-byte JSON parse error
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[triton] SSE stream parse error', err);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // already released
    }
  }

  const fallbackMetadata: ChatMessageMetadata = finalMetadata ?? {
    modelUsed: 'V4-Flash-non-think',
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: Date.now() - startedAt,
    cacheHit: false,
  };
  yield { done: fallbackMetadata };
}

/**
 * Wave 3 SSE swap complete. Consumers (test suites, telemetry probes) can
 * import this constant to assert the runtime path.
 */
export const STREAM_CHAT_MODE = 'real-wave-3-sse' as const;

// ---------------------------------------------------------------------------
// Backwards-compatible deprecated export
// ---------------------------------------------------------------------------
//
// The previous `_unused_resident` reference and the Wave 2 canned templates
// are deliberately removed. If a future cycle wants to re-introduce a local
// fallback (for offline demo rehearsal), implement it as a separate module
// (`fallbackChat.ts`) and conditionally invoke based on a runtime flag.

// Helper exported for unit tests under `frontend/src/lib/chat/__tests__/`.
export const _internal = {
  parseSseBuffer,
  buildBackendBody,
  normalizeDoneMetadata,
  resolveApiBase,
} as const;

// Wave-Fixing #2 cycle 1 Triton.
// File touch reference for resident: Hermes, Apollo, Athena, Argus, Clio.
// Implicit dependency: backend `/api/chat` Triton SSE endpoint.
// Implicit dependency: backend `_metadata_json()` Persephone-shaped done envelope.
// END.
