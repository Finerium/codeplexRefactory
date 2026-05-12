'use client';

/**
 * ChatPanel: composite root for the AI residents 5-resident chat surface.
 *
 * Authored by Persephone (Wave 2). Mount point: `frontend/app/city/@chat/page.tsx`.
 *
 * Layout:
 *   Header: resident switcher (5 avatars + broadcast toggle)
 *   Body  : ScrollArea with MessageList
 *   Footer: MessageInput
 *
 * State: subscribed to usePanelStore for chatTarget + broadcast + chatCollapsed.
 * Chat thread state owned per-target via useChatRouting.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (mockResidentResponses labeled at consume site).
 */

import { cn } from '@/lib/utils';
import { useSlideTransition } from '@/lib/panel-motion';
import {
  RESIDENT_ORDER,
  RESIDENT_META,
  type ChatContext,
  type ChatTarget,
  type ResidentId,
} from '@/lib/chat';
import {
  usePanelStore,
  useCurrentChatContext,
} from '@/lib/panel-context';
import { Glassmorphism } from '@/components/panels/Glassmorphism';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ResidentAvatar } from './ResidentAvatar';
import { BroadcastToggle } from './BroadcastToggle';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatRouting } from './useChatRouting';

export interface ChatPanelProps {
  className?: string;
  /** Override target (overrides usePanelStore.chatTarget). Mostly for storybook. */
  target?: ChatTarget;
  /** Override context (overrides usePanelStore-derived). */
  contextOverride?: ChatContext;
}

export function ChatPanel({
  className,
  target: targetOverride,
  contextOverride,
}: ChatPanelProps) {
  const storeTarget = usePanelStore((s) => s.chatTarget);
  const storeBroadcast = usePanelStore((s) => s.broadcast);
  const setChatTarget = usePanelStore((s) => s.setChatTarget);
  const setBroadcast = usePanelStore((s) => s.setBroadcast);
  const chatCollapsed = usePanelStore((s) => s.chatCollapsed);
  const setChatCollapsed = usePanelStore((s) => s.setChatCollapsed);

  const storeContext = useCurrentChatContext();
  const target: ChatTarget =
    targetOverride ?? (storeBroadcast ? 'broadcast' : (storeTarget as ResidentId));
  const context: ChatContext = contextOverride ?? storeContext;

  const { thread, sendMessage, streaming } = useChatRouting(target, context);

  // GSAP slide-in from right. Panel always mounted; collapsed = opacity 0 + offset.
  const { ref } = useSlideTransition({
    direction: 'right',
    open: !chatCollapsed,
    duration: 0.3,
  });

  // Header subtitle reflects current target.
  const headerSubtitle =
    target === 'broadcast'
      ? 'Broadcast, 5 residents in parallel'
      : RESIDENT_META[target as ResidentId].landmark;

  // Active accent for panel: matches current single resident; null on broadcast.
  const accent =
    target === 'broadcast'
      ? null
      : RESIDENT_META[target as ResidentId].accentKey;

  return (
    <Glassmorphism
      variant="strong"
      accent={accent}
      forwardRef={ref}
      className={cn(
        'city-panel-mounted flex h-full flex-col text-white/85',
        className
      )}
      data-panel="chat"
      role="region"
      aria-label="AI residents chat panel"
    >
      {/* Header: title + resident switcher + broadcast toggle + collapse */}
      <header className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col leading-tight">
            <p className="font-mono text-[9px] uppercase tracking-widest text-codeplex-ember">
              5 residents online
            </p>
            <h2 className="text-[13px] font-semibold text-white">
              {target === 'broadcast'
                ? 'Broadcast'
                : RESIDENT_META[target as ResidentId].displayName}
            </h2>
            <p className="text-[10px] text-white/45">{headerSubtitle}</p>
          </div>
          <Button
            variant="icon"
            size="icon"
            onClick={() => setChatCollapsed(!chatCollapsed)}
            aria-label={chatCollapsed ? 'Expand chat panel' : 'Collapse chat panel'}
            className="text-white/55 hover:text-white"
          >
            <span aria-hidden className="text-base leading-none">
              {chatCollapsed ? '+' : '-'}
            </span>
          </Button>
        </div>

        {/* 5 resident avatars row */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {RESIDENT_ORDER.map((rid) => (
              <ResidentAvatar
                key={rid}
                residentId={rid}
                active={!storeBroadcast && storeTarget === rid}
                size="sm"
                showTooltip
                onClick={() => {
                  setBroadcast(false);
                  setChatTarget(rid);
                }}
              />
            ))}
          </div>
          <BroadcastToggle
            value={storeBroadcast}
            onChange={(v) => {
              setBroadcast(v);
              if (v) {
                setChatTarget('broadcast');
              } else {
                // On toggling off, fall back to current resident or Hermes
                if (storeTarget === 'broadcast') setChatTarget('Hermes');
              }
            }}
          />
        </div>
      </header>

      <Separator />

      {/* Message list scroll area */}
      <ScrollArea className="flex-1 px-3 py-3">
        <MessageList messages={thread.messages} />
      </ScrollArea>

      <Separator />

      {/* Composer */}
      <footer className="px-3 py-3">
        <MessageInput
          onSend={sendMessage}
          disabled={streaming}
          placeholder={
            streaming
              ? 'Resident is thinking...'
              : `Ask ${
                  target === 'broadcast'
                    ? 'all 5 residents'
                    : RESIDENT_META[target as ResidentId].displayName
                }...`
          }
        />
      </footer>
    </Glassmorphism>
  );
}

ChatPanel.displayName = 'ChatPanel';
