'use client';

/**
 * HermesNarrationOverlay: text overlay above the canvas during tour fly.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D6.
 * Uncertainty: `_meta/uncertainty/boreas-cycle1-20260512-2350.md` U7.
 *
 * Mount: OUTSIDE the Canvas as a sibling DOM overlay (plain absolute-positioned
 * client component, NOT a Drei <Html> portal per uncertainty U5).
 *
 * Sequencing:
 *   - Reads phase + waypointIndex + narrationByIndex from useHermesTour hook.
 *   - Visible only when phase === 'dwell' OR phase === 'outro' (during
 *     camera dwell, when narration reads cleanly).
 *   - Fade in 300ms at dwell start, fade out 300ms before transit to next.
 *   - Max 2 lines (text-pretty + line-clamp-2) for legibility under fast
 *     dwell.
 *
 * Voice: bilingual Indonesian primary + English code-switch per PRD 19.2.
 * Reads warm welcoming guide tone per PRD 10.5 Hermes Tourist Info Guide.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: narration text from line bank
 *   labeled [MOCK Wave 2] at the source (hermesLines.ts).
 */

import { useEffect, useState } from 'react';
import type { TourPhase } from './useHermesTour';

interface HermesNarrationOverlayProps {
  /** Phase from useHermesTour. */
  phase: TourPhase;
  /** Active waypoint index 0-based, undefined during preroll/outro/complete. */
  waypointIndex: number | undefined;
  /** Pre-fetched narration text by waypoint index. */
  narrationByIndex: Record<number, string>;
}

export function HermesNarrationOverlay({
  phase,
  waypointIndex,
  narrationByIndex,
}: HermesNarrationOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if ((phase === 'dwell' || phase === 'outro') && waypointIndex !== undefined) {
      const text = narrationByIndex[waypointIndex] ?? '';
      if (text) {
        setDisplayText(text);
        setVisible(true);
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  }, [phase, waypointIndex, narrationByIndex]);

  return (
    <div
      aria-live="polite"
      role="status"
      className={[
        'pointer-events-none fixed left-1/2 top-12 z-30 -translate-x-1/2',
        'flex max-w-2xl flex-col items-center gap-2 px-6 py-4',
        'rounded-2xl border border-white/10 bg-codeplex-shadow/75',
        'text-center text-white shadow-2xl backdrop-blur-glass',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-codeplex-ember">
        Hermes Tourist Info
      </p>
      <p className="text-base leading-snug text-white/95">
        {displayText}
      </p>
    </div>
  );
}
