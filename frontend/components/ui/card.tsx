'use client';

/**
 * Card primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1.
 * Reference: https://ui.shadcn.com/docs/components/card
 *
 * Composable: Card + CardHeader + CardTitle + CardDescription + CardContent + CardFooter.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function Card({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/10 bg-codeplex-shadow/70 text-white/90 shadow-2xl backdrop-blur-glass',
        className
      )}
      {...rest}
    />
  );
});
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 border-b border-white/8 px-4 py-3', className)}
      {...rest}
    />
  );
});
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...rest }, ref) {
  return (
    <h3
      ref={ref}
      className={cn('text-sm font-semibold text-white tracking-[-0.01em]', className)}
      {...rest}
    />
  );
});
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...rest }, ref) {
  return (
    <p
      ref={ref}
      className={cn('text-[11px] text-white/55', className)}
      {...rest}
    />
  );
});
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn('px-4 py-3', className)}
      {...rest}
    />
  );
});
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-between gap-2 border-t border-white/8 px-4 py-2', className)}
      {...rest}
    />
  );
});
CardFooter.displayName = 'CardFooter';
