'use client';

/**
 * Button primitive (shadcn-pattern hand-authored).
 *
 * Authored by Persephone (Wave 2) per Decision D1 + OQ-03 supplementary doc.
 * Reference: https://ui.shadcn.com/docs/components/button
 *
 * Variants:
 *   default - primary action, codeplex-ember on void
 *   ghost   - transparent, hover surface only
 *   outline - bordered, transparent fill
 *   icon    - square, icon-only
 *   destructive - red accent
 *
 * Sizes: sm / md (default) / lg / icon.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'default'
  | 'ghost'
  | 'outline'
  | 'icon'
  | 'destructive'
  | 'subtle';

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-codeplex-ember text-codeplex-void hover:bg-codeplex-ember/85 active:bg-codeplex-ember/95',
  subtle:
    'bg-white/10 text-white hover:bg-white/15 active:bg-white/20',
  ghost: 'text-white/85 hover:bg-white/10 hover:text-white',
  outline:
    'border border-white/20 bg-transparent text-white/85 hover:bg-white/8 hover:border-white/35',
  icon:
    'h-9 w-9 p-0 text-white/75 hover:bg-white/8 hover:text-white',
  destructive:
    'bg-red-500/85 text-white hover:bg-red-500 active:bg-red-500/95',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[11px]',
  md: 'h-8 px-3 text-xs',
  lg: 'h-10 px-4 text-sm',
  icon: 'h-8 w-8 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = 'default', size = 'md', type = 'button', ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseClasses,
          variantClasses[variant],
          variant === 'icon' ? sizeClasses.icon : sizeClasses[size],
          className
        )}
        {...rest}
      />
    );
  }
);

Button.displayName = 'Button';
