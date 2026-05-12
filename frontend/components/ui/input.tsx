'use client';

/**
 * Input + Textarea primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/input + textarea.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = 'text', ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-white/15 bg-codeplex-void/40 px-3 py-1 text-xs text-white/90 placeholder:text-white/35',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className
        )}
        {...rest}
      />
    );
  }
);
Input.displayName = 'Input';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'flex min-h-[64px] w-full resize-none rounded-md border border-white/15 bg-codeplex-void/40 px-3 py-2 text-xs text-white/90 placeholder:text-white/35',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className
        )}
        {...rest}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
