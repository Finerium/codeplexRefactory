'use client';

/**
 * Badge primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/badge
 *
 * Variants:
 *   default     - bg-white/10 chip
 *   outline     - bordered, transparent fill
 *   secondary   - subtle warmth
 *   destructive - red tone
 *   success     - emerald tone
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/85 border border-white/15',
  outline: 'bg-transparent border border-white/25 text-white/80',
  secondary: 'bg-codeplex-ember/15 text-codeplex-ember border border-codeplex-ember/30',
  destructive: 'bg-red-500/15 text-red-200 border border-red-400/35',
  success: 'bg-emerald-300/15 text-emerald-200 border border-emerald-300/35',
  warning: 'bg-amber-300/15 text-amber-100 border border-amber-300/35',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant = 'default', ...rest }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider',
          variantClasses[variant],
          className
        )}
        {...rest}
      />
    );
  }
);

Badge.displayName = 'Badge';
