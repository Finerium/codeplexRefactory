/**
 * Public barrel for the chat library.
 *
 * Authored by Persephone (Wave 2). Triton Wave 3 imports from `@/lib/chat`
 * per Pythia contract `persephone-to-triton.md`.
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
} from './types';

export {
  RESIDENT_META,
  RESIDENT_ORDER,
  targetDisplayLabel,
  type ResidentMeta,
} from './residentMeta';

export { streamChat, STREAM_CHAT_MODE } from './mockResidentResponses';
