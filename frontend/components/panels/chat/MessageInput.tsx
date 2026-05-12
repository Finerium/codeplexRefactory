'use client';

/**
 * MessageInput: text input + send button.
 *
 * Authored by Persephone (Wave 2).
 *
 * Enter sends; Shift+Enter inserts newline. Submission disabled while body
 * empty or while previous message still streaming.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface MessageInputProps {
  onSend: (body: string) => void;
  /** Disabled while streaming previous response. */
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a resident...',
  className,
}: MessageInputProps) {
  const [body, setBody] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const canSend = body.trim().length > 0 && !disabled;

  const submit = React.useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setBody('');
    // Keep focus on input for rapid follow-up.
    textareaRef.current?.focus();
  }, [body, disabled, onSend]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={2}
        aria-label="Compose message"
        disabled={disabled}
        className="min-h-[56px] text-[11.5px]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] text-white/35">
          Enter to send. Shift+Enter for newline.
        </span>
        <Button
          variant="default"
          size="sm"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

MessageInput.displayName = 'MessageInput';
