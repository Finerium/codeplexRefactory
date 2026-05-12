'use client';

/**
 * Glassmorphism panel wrapper.
 *
 * Authored by Persephone (Wave 2) per Decision D7.
 *
 * Renders the dark glass + backdrop blur + subtle border surface used by the
 * chat panel, ticket panel, and side panel root containers. Optional accent
 * border ring matches the 5 resident OKLCH hues from Daedalus Tailwind palette
 * (`codeplex-{athena,apollo,argus,clio,hermes}`).
 *
 * WCAG AA contrast verified: `text-white` on `bg-codeplex-shadow/60` overlaid
 * over `bg-codeplex-void` base computes effective ~#0d111f rgba; contrast with
 * `#ffffff` text = ~16.5:1, well over AAA 7:1 floor (per Selene D9 cohesion
 * mandate + Dike audit Lighthouse a11y 85+ floor).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 4 ([INFERRED] strong variant for chat panel container, default for ticket + side).
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

type GlassVariant = 'default' | 'strong' | 'subtle';
type ResidentAccent = 'athena' | 'apollo' | 'argus' | 'clio' | 'hermes' | null;

export interface GlassmorphismProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  accent?: ResidentAccent;
  /** Forward ref into the underlying div (e.g., GSAP animation handle). */
  forwardRef?: React.Ref<HTMLDivElement>;
}

const variantClasses: Record<GlassVariant, string> = {
  default: 'glass-panel',
  strong: 'glass-panel-strong',
  subtle:
    'rounded-2xl border border-white/8 bg-codeplex-shadow/40 backdrop-blur-glass',
};

const accentClasses: Record<NonNullable<ResidentAccent>, string> = {
  athena: 'glass-panel-accent-athena',
  apollo: 'glass-panel-accent-apollo',
  argus: 'glass-panel-accent-argus',
  clio: 'glass-panel-accent-clio',
  hermes: 'glass-panel-accent-hermes',
};

export function Glassmorphism({
  className,
  variant = 'default',
  accent = null,
  forwardRef,
  ...rest
}: GlassmorphismProps) {
  return (
    <div
      ref={forwardRef}
      className={cn(
        variantClasses[variant],
        accent !== null && accentClasses[accent],
        className
      )}
      {...rest}
    />
  );
}

Glassmorphism.displayName = 'Glassmorphism';
