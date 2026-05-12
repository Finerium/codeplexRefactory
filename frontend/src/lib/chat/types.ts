/**
 * Chat panel type contract per Pythia `persephone-to-triton.md`.
 *
 * Authored by Persephone (Wave 2) per Decision D2 (`_meta/decision_log/persephone.md`).
 * Storage path matches contract line 170 verbatim
 * (`frontend/src/lib/chat/types.ts`). Wave 3 Triton imports from `@/lib/chat`.
 *
 * Field shape mirrors contract `persephone-to-triton.md` Section "Output schema"
 * lines 22-71. Persephone Wave 2 does NOT extend with presentational fields
 * outside the contract; if presentation needs extra context, those live in
 * `@/lib/panel-context/types.ts` instead.
 *
 * Resident routing per PRD Section 18.3 LOCKED:
 *   Athena = V4-Pro thinking high
 *   Apollo = V4-Flash non-think
 *   Argus  = V4-Flash thinking low
 *   Clio   = V4-Flash non-think
 *   Hermes = V4-Flash non-think
 *
 * Anti-pattern critical (Phase B): NEVER replay `metadata` from prior turns
 * back to the LLM. Triton strips prior `reasoning_content` (DeepSeek V4
 * thinking-mode quirk). Persephone UI displays current message metadata for
 * the user to observe; the conversation history sent to Triton is body-only.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

/**
 * 5 AI residents per PRD Section 10. TitleCase string literal matches Pythia
 * contract `persephone-to-triton.md` line 25 verbatim.
 */
export type ResidentId = 'Athena' | 'Apollo' | 'Argus' | 'Clio' | 'Hermes';

/**
 * Chat thread target. `broadcast` queries all 5 in parallel (Wave 3 stretch).
 */
export type ChatTarget = ResidentId | 'broadcast';

/**
 * Product mode the user is currently in. Drives system prompt context per
 * resident (e.g., Athena Refactor proposals reference current proposalId).
 */
export type CurrentMode =
  | 'onboarding'
  | 'sprint'
  | 'refactor'
  | 'activity'
  | 'health'
  | 'dashboard';

/**
 * Context attached to a message when sent. Triton uses to inform response.
 *
 * `modeContext` is mode-specific opaque key-value bag (e.g., Apollo finding id,
 * Hera ticket number, Pandora proposal id, Boreas tour stop index). Schema is
 * the consumer's responsibility.
 */
export interface ChatContext {
  currentMode: CurrentMode;
  selectedBuildingId: string | null;
  modeContext: Record<string, unknown>;
}

/**
 * Optional metadata attached to assistant messages. Populated Wave 3 by Triton
 * post-stream-done event. Wave 2 mock emits a stub shape.
 *
 * Anti-pattern critical: `reasoning_content` (DeepSeek V4 thinking mode quirk)
 * is NEVER stored here. Triton strips it from prior assistant messages before
 * sending the next request.
 */
export interface ChatMessageMetadata {
  modelUsed: 'V4-Flash-non-think' | 'V4-Flash-think-low' | 'V4-Pro-think-high';
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cacheHit: boolean;
}

/**
 * Message author identity. Discriminated union on `type`.
 */
export type ChatMessageAuthor =
  | { type: 'user'; userId: string }
  | { type: 'resident'; residentId: ResidentId };

/**
 * Single message in a chat thread.
 *
 * `streamComplete` flags whether the body is still streaming (Wave 3 SSE chunk
 * accumulation) or finalized. Wave 2 mock toggles this when canned response
 * generation finishes.
 */
export interface ChatMessage {
  id: string;
  author: ChatMessageAuthor;
  /** Markdown body for resident responses; plain text user messages. */
  body: string;
  /** ISO 8601 timestamp at message creation. */
  createdAt: string;
  streamComplete: boolean;
  context?: ChatContext;
  metadata?: ChatMessageMetadata;
}

/**
 * A chat thread groups messages by target resident (or broadcast).
 *
 * Multiple threads coexist (one per resident plus optional broadcast). UI
 * surface shows active thread per resident selection or broadcast toggle.
 */
export interface ChatThread {
  threadId: string;
  target: ChatTarget;
  messages: ChatMessage[];
}

/**
 * Request body for `POST /api/chat` (Triton Wave 3 implements).
 */
export interface SendChatRequest {
  threadId: string;
  target: ChatTarget;
  /** User message body, plain text. */
  message: string;
  context: ChatContext;
}

/**
 * Streaming event yielded by `streamChat`. Either a chunk (partial body text)
 * or done (metadata finalization).
 */
export type StreamChatEvent =
  | { chunk: string }
  | { done: ChatMessageMetadata };
