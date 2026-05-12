/**
 * Chat panel component re-exports of canonical types.
 *
 * Authored by Persephone (Wave 2). Re-exports types from `@/lib/chat` (Pythia
 * canonical contract surface). Components import either path; the canonical
 * source of truth is `@/lib/chat/types`.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

export type {
  ResidentId,
  ChatTarget,
  CurrentMode,
  ChatContext,
  ChatMessage,
  ChatMessageAuthor,
  ChatMessageMetadata,
  ChatThread,
  SendChatRequest,
  StreamChatEvent,
} from '@/lib/chat/types';

export {
  RESIDENT_META,
  RESIDENT_ORDER,
  type ResidentMeta,
} from '@/lib/chat/residentMeta';
