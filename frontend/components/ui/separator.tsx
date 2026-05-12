'use client';

/**
 * Separator primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/separator
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  function Separator(
    { className, orientation = 'horizontal', ...rest },
    ref
  ) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          'shrink-0 bg-white/10',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
        {...rest}
      />
    );
  }
);

Separator.displayName = 'Separator';
