'use client';

/**
 * SizeBadge: story points T-shirt size (XS/S/M/L/XL) chip.
 *
 * Authored by Persephone (Wave 2). Consumes Hera's StorySize literal union
 * (post Wave 2 schema reconciliation per persephone-cycle1 uncertainty U2).
 *
 * Visual: small monospace chip with size letter + ring color matching the
 * warm-to-cool size spectrum in Hera's `SIZE_BADGE_COLORS` palette.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import type { StorySize } from '@/modes/sprint/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SizeBadgeProps {
  size: StorySize | null;
  className?: string;
}

const SIZE_HUES: Record<StorySize, string> = {
  XS: '#7dffae',
  S: '#7ddfff',
  M: '#7d9cff',
  L: '#c8b6ff',
  XL: '#ffb47d',
};

const SIZE_LABELS: Record<StorySize, string> = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
};

export function SizeBadge({ size, className }: SizeBadgeProps) {
  if (!size) {
    return (
      <Badge variant="outline" className={cn('text-[9px]', className)}>
        no size
      </Badge>
    );
  }
  const hue = SIZE_HUES[size];
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono font-semibold',
        className
      )}
      style={{ borderColor: hue, color: hue }}
      aria-label={`Story size ${SIZE_LABELS[size]}`}
    >
      {SIZE_LABELS[size]}
    </Badge>
  );
}

SizeBadge.displayName = 'SizeBadge';
