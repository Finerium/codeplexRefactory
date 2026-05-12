'use client';

/**
 * ScrollArea primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/scroll-area
 *
 * Implementation: native overflow-y-auto with Tailwind scrollbar utility.
 * No Radix portal needed for Wave 2 panel scope (panels are non-portal).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional max height; ScrollArea overflow-y triggers above this. */
  maxHeight?: number | string;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea({ className, maxHeight, style, children, ...rest }, ref) {
    const composedStyle: React.CSSProperties = {
      ...style,
      ...(maxHeight !== undefined ? { maxHeight } : {}),
    };
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-y-auto overflow-x-hidden',
          'scrollbar-thin [scrollbar-color:rgba(255,255,255,0.20)_transparent]',
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15',
          'hover:[&::-webkit-scrollbar-thumb]:bg-white/25',
          className
        )}
        style={composedStyle}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
