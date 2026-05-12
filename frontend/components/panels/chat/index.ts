/**
 * Chat panel barrel.
 *
 * Authored by Persephone (Wave 2).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

export { ChatPanel, type ChatPanelProps } from './ChatPanel';
export { ResidentAvatar, type ResidentAvatarProps } from './ResidentAvatar';
export { MessageList, type MessageListProps } from './MessageList';
export { MessageInput, type MessageInputProps } from './MessageInput';
export { BroadcastToggle, type BroadcastToggleProps } from './BroadcastToggle';
export { useChatRouting, ALL_TARGETS } from './useChatRouting';

// Re-export canonical types for convenience
export type {
  ResidentId,
  ChatTarget,
  CurrentMode,
  ChatContext,
  ChatMessage,
  ChatThread,
} from './types';
