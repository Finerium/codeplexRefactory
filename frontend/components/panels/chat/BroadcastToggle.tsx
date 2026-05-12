'use client';

/**
 * BroadcastToggle: switch between single-resident chat and broadcast-to-all-5.
 *
 * Authored by Persephone (Wave 2).
 *
 * Visual: a 2-state pill toggle. When broadcast off, single resident routing
 * indicated by selected avatar above. When broadcast on, the chat sends to
 * all 5 residents in parallel (Wave 3 stretch per Pythia contract; Wave 2
 * stub picks the currently selected resident).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { cn } from '@/lib/utils';

export interface BroadcastToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

export function BroadcastToggle({ value, onChange, className }: BroadcastToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors',
        value
          ? 'border-codeplex-ember/50 bg-codeplex-ember/15 text-codeplex-ember'
          : 'border-white/15 bg-white/5 text-white/55 hover:border-white/30 hover:text-white/80',
        className
      )}
      title={value ? 'Broadcast on, query all 5 residents in parallel' : 'Single resident, switch via avatar'}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block h-2 w-2 rounded-full transition-colors',
          value ? 'bg-codeplex-ember' : 'bg-white/30'
        )}
      />
      {value ? 'Broadcast 5' : 'Single'}
    </button>
  );
}

BroadcastToggle.displayName = 'BroadcastToggle';
