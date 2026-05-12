'use client';

/**
 * useChatRouting: chat thread state machine + streamChat dispatch.
 *
 * Authored by Persephone (Wave 2) per Decision D5.
 *
 * Manages per-target thread state (one thread per resident + one broadcast
 * thread). Sends user message + receives streaming canned response Wave 2
 * via mock streamChat; Wave 3 swap replaces mockResidentResponses with
 * real `/api/chat` SSE endpoint.
 *
 * Anti-pattern: NEVER store reasoning_content from prior turns; only the
 * `body` + `metadata` are persisted. Triton Wave 3 strips reasoning content
 * server-side before sending next request to DeepSeek.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (mock streaming labeled at source).
 */

import * as React from 'react';
import {
  RESIDENT_ORDER,
  streamChat,
  type ChatContext,
  type ChatMessage,
  type ChatMessageMetadata,
  type ChatTarget,
  type ChatThread,
  type ResidentId,
} from '@/lib/chat';

/**
 * Generate stable id from timestamp + counter. Avoids `crypto.randomUUID` for
 * compat with older browser test envs.
 */
let _msgCounter = 0;
function messageId(): string {
  _msgCounter += 1;
  return `m-${Date.now().toString(36)}-${_msgCounter.toString(36)}`;
}

function threadIdFor(target: ChatTarget): string {
  return `thread-${target.toLowerCase()}`;
}

function buildEmptyThread(target: ChatTarget): ChatThread {
  return {
    threadId: threadIdFor(target),
    target,
    messages: [],
  };
}

interface UseChatRoutingResult {
  /** Get the active thread for the given target (lazily created). */
  thread: ChatThread;
  /** Send a user message + start streaming response. */
  sendMessage: (body: string) => Promise<void>;
  /** Streaming pending flag for input disable. */
  streaming: boolean;
  /** Clear all threads (Esc handler). */
  clearAll: () => void;
}

export function useChatRouting(
  target: ChatTarget,
  context: ChatContext
): UseChatRoutingResult {
  const [threads, setThreads] = React.useState<Record<string, ChatThread>>({});
  const [streaming, setStreaming] = React.useState(false);

  const tid = threadIdFor(target);
  const thread = threads[tid] ?? buildEmptyThread(target);

  const sendMessage = React.useCallback(
    async (body: string) => {
      if (streaming) return;
      setStreaming(true);

      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: messageId(),
        author: { type: 'user', userId: 'me' },
        body,
        createdAt: now,
        streamComplete: true,
        context,
      };

      // For broadcast Wave 2, fall back to first resident (Hermes).
      // Wave 3 may run 5 parallel + merge.
      const residentTarget: ResidentId =
        target === 'broadcast' ? 'Hermes' : (target as ResidentId);
      const residentMessage: ChatMessage = {
        id: messageId(),
        author: { type: 'resident', residentId: residentTarget },
        body: '',
        createdAt: new Date().toISOString(),
        streamComplete: false,
      };

      // Append both to thread.
      setThreads((prev) => {
        const t = prev[tid] ?? buildEmptyThread(target);
        return {
          ...prev,
          [tid]: {
            ...t,
            messages: [...t.messages, userMessage, residentMessage],
          },
        };
      });

      // Stream via mock client.
      let finalMetadata: ChatMessageMetadata | undefined;
      try {
        for await (const ev of streamChat({
          threadId: tid,
          target,
          message: body,
          context,
        })) {
          if ('chunk' in ev) {
            setThreads((prev) => {
              const t = prev[tid];
              if (!t) return prev;
              const idx = t.messages.findIndex(
                (m) => m.id === residentMessage.id
              );
              if (idx === -1) return prev;
              const updated = [...t.messages];
              updated[idx] = {
                ...updated[idx],
                body: updated[idx].body + ev.chunk,
              };
              return { ...prev, [tid]: { ...t, messages: updated } };
            });
          } else if ('done' in ev) {
            finalMetadata = ev.done;
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[persephone] streamChat error', err);
      }

      // Finalize message: mark streamComplete + attach metadata.
      setThreads((prev) => {
        const t = prev[tid];
        if (!t) return prev;
        const idx = t.messages.findIndex((m) => m.id === residentMessage.id);
        if (idx === -1) return prev;
        const updated = [...t.messages];
        updated[idx] = {
          ...updated[idx],
          streamComplete: true,
          metadata: finalMetadata,
        };
        return { ...prev, [tid]: { ...t, messages: updated } };
      });

      setStreaming(false);
    },
    [streaming, target, tid, context]
  );

  const clearAll = React.useCallback(() => {
    setThreads({});
  }, []);

  return { thread, sendMessage, streaming, clearAll };
}

/**
 * Convenience export: ordered list of all resident targets plus broadcast.
 */
export const ALL_TARGETS: readonly ChatTarget[] = [
  ...RESIDENT_ORDER,
  'broadcast',
] as const;
