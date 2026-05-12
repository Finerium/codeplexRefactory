'use client';

/**
 * TourVariantRouter: 4-variant selection UI.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D4.
 *
 * Mount: OUTSIDE the Canvas as a sibling DOM overlay (HUD), visible when no
 * tour is active.
 *
 * Behavior: click a variant button -> calls `onStart(variant)`. Parent
 * OnboardingMode wires onStart to useHermesTour.startTour().
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean.
 */

import type { TourVariant } from './types';
import {
  TOUR_VARIANTS,
  TOUR_VARIANT_LABELS,
  TOUR_VARIANT_DESCRIPTIONS,
  tourTotalDurationSeconds,
} from './tourDSL';
import { MOCK_TOURS } from './mockTours';

interface TourVariantRouterProps {
  /** Visible flag (driven by tour idle state). */
  visible: boolean;
  /** Called when user picks a variant. */
  onStart: (variant: TourVariant) => void;
}

export function TourVariantRouter({ visible, onStart }: TourVariantRouterProps) {
  return (
    <div
      role="region"
      aria-label="Hermes tour variant picker"
      className={[
        'pointer-events-none fixed bottom-8 left-1/2 z-30 -translate-x-1/2',
        'flex flex-col gap-3 px-6 py-5',
        'rounded-2xl border border-white/10 bg-codeplex-shadow/75 shadow-2xl backdrop-blur-glass',
        'transition-opacity duration-500',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <header className="flex items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-codeplex-ember">
          Hermes Tour
        </p>
        <p className="text-[10px] text-white/50">
          Pilih variant untuk start camera fly otomatis
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3">
        {TOUR_VARIANTS.map((variant) => {
          const label = TOUR_VARIANT_LABELS[variant];
          const desc = TOUR_VARIANT_DESCRIPTIONS[variant];
          const mockScript = MOCK_TOURS[variant];
          const duration = tourTotalDurationSeconds(mockScript);
          return (
            <li key={variant}>
              <button
                type="button"
                onClick={() => onStart(variant)}
                className={[
                  'pointer-events-auto flex h-full w-full flex-col items-start gap-1 rounded-xl border border-white/10',
                  'bg-white/[0.03] px-4 py-3 text-left text-white',
                  'transition-all duration-150',
                  'hover:border-codeplex-ember/60 hover:bg-white/[0.08] hover:shadow-lg',
                  'focus:outline-none focus:ring-2 focus:ring-codeplex-ember',
                ].join(' ')}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
                    ~{duration}s
                  </span>
                </div>
                <span className="text-[11px] leading-snug text-white/55">
                  {desc}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
                  variant: {variant}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
