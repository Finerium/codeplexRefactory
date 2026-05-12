'use client';

/**
 * MessageList: render chat thread messages with role-based bubble styling.
 *
 * Authored by Persephone (Wave 2).
 *
 * Bubble style differentiation:
 *   - user messages: right-aligned, codeplex-ember warmth chip
 *   - resident messages: left-aligned, accent border ring matching residentId
 *   - streaming messages: blinking cursor at end of body
 *   - metadata footer when complete: model + tokens + latency + cache hit indicator
 *
 * Markdown rendering Wave 2: simple line-break + paragraph + bold + italic +
 * inline code + link (regex-based, no full markdown dep). Wave 3 may swap to
 * react-markdown if budget allows.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  RESIDENT_META,
  type ChatMessage,
  type ResidentId,
} from '@/lib/chat';
import { ResidentAvatar } from './ResidentAvatar';

export interface MessageListProps {
  messages: ChatMessage[];
  /** Auto-scroll on append. Default true. */
  autoScroll?: boolean;
  className?: string;
}

/**
 * Lightweight markdown-to-React parser for Wave 2 chat bodies. Handles:
 *   **bold**, *italic*, `code`, [text](url), and line breaks.
 * Not a full markdown lib; sufficient for canned mock responses + Wave 3
 * Triton stream output (which is plain prose + small markdown emphasis).
 */
function renderMarkdownLite(text: string): React.ReactNode {
  // Split into paragraphs on double newline; within each, render inline.
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((p, i) => (
    <p key={i} className="whitespace-pre-wrap leading-relaxed">
      {renderInline(p)}
    </p>
  ));
}

function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  // Tokenize by **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      out.push(
        <strong key={key++} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*')) {
      out.push(
        <em key={key++} className="italic text-white/75">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`')) {
      out.push(
        <code
          key={key++}
          className="rounded bg-white/8 px-1 py-0.5 font-mono text-[10px] text-codeplex-ember"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        out.push(
          <a
            key={key++}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-codeplex-clio underline decoration-codeplex-clio/40 underline-offset-2 hover:text-codeplex-clio hover:decoration-codeplex-clio"
          >
            {m[1]}
          </a>
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <li className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-codeplex-ember/30 bg-codeplex-ember/10 px-3 py-2 text-[11.5px] text-white/90">
        {renderMarkdownLite(message.body)}
      </div>
      <span className="font-mono text-[9px] text-white/35">
        you, {formatTime(message.createdAt)}
      </span>
    </li>
  );
}

function ResidentBubble({ message }: { message: ChatMessage }) {
  const residentId =
    message.author.type === 'resident' ? message.author.residentId : 'Hermes';
  const meta = RESIDENT_META[residentId];
  return (
    <li className="flex items-start gap-2">
      <ResidentAvatar residentId={residentId} active size="sm" />
      <div className="flex flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-[10px]">
          <span className={cn('font-mono uppercase tracking-wider', meta.textClass)}>
            {meta.displayName}
          </span>
          <span className="text-white/35">{meta.landmark}</span>
          <span className="text-white/25">{formatTime(message.createdAt)}</span>
        </span>
        <div
          className={cn(
            'max-w-full rounded-2xl rounded-tl-sm border bg-codeplex-shadow/60 px-3 py-2 text-[11.5px] text-white/85 backdrop-blur-glass',
            meta.borderClass
          )}
        >
          {renderMarkdownLite(message.body)}
          {!message.streamComplete ? (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3 w-0.5 -translate-y-px animate-pulse bg-white/65 align-middle"
            />
          ) : null}
        </div>
        {message.metadata && message.streamComplete ? (
          <span className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-white/30">
            <span>{message.metadata.modelUsed}</span>
            <span>{message.metadata.inputTokens} -&gt; {message.metadata.outputTokens} tok</span>
            <span>{message.metadata.latencyMs}ms</span>
            {message.metadata.cacheHit ? (
              <span className="rounded-full bg-emerald-300/15 px-1.5 py-0.5 text-emerald-200">
                cache hit
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function MessageList({ messages, autoScroll = true, className }: MessageListProps) {
  const ref = React.useRef<HTMLOListElement | null>(null);
  React.useEffect(() => {
    if (!autoScroll || !ref.current) return;
    const el = ref.current;
    // Scroll to bottom on append.
    el.scrollTop = el.scrollHeight;
  }, [messages, autoScroll]);

  // Cast residentId for ResidentBubble; we know message.author.type === 'resident'
  // when role is resident.
  const _unused: ResidentId = 'Athena';
  void _unused;

  return (
    <ol
      ref={ref}
      className={cn(
        'flex flex-col gap-3 overflow-y-auto pr-1',
        '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 hover:[&::-webkit-scrollbar-thumb]:bg-white/25',
        className
      )}
      aria-live="polite"
      aria-label="Conversation messages"
    >
      {messages.length === 0 ? (
        <li className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            No messages yet
          </p>
          <p className="text-[11px] text-white/55">
            Click a resident avatar to start, then ask anything.
          </p>
        </li>
      ) : (
        messages.map((m) =>
          m.author.type === 'user' ? (
            <UserBubble key={m.id} message={m} />
          ) : (
            <ResidentBubble key={m.id} message={m} />
          )
        )
      )}
    </ol>
  );
}

MessageList.displayName = 'MessageList';
