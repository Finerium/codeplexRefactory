'use client';

/**
 * Manager FINAL Cycle 2 (Persephone Cluster G, STAMP 20260513-0857):
 *
 * FloatingTutorButton: persistent bottom-right glass "?" button mounted
 * globally across /city + /dashboard + /start + landing routes. Clicking
 * the button opens the TutorModal regardless of localStorage flag.
 *
 * Auto-open trigger:
 *   - On mount, if shouldAutoOpenTour() returns true (URL has `?tour=1`
 *     OR user has never completed the tour), open the modal.
 *   - Manual click always opens the modal.
 *
 * Mount strategy: rendered in `app/layout.tsx` so it persists across
 * route changes without re-evaluating its auto-open guard (the modal
 * itself manages its open/close state from there).
 *
 * Anti-clutter: button is fixed bottom-right with a generous 24px inset
 * so it never overlaps the SprintHud restore tab (top-left) or the
 * Activity scrubber HUD (bottom-center) at any viewport size.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 3 (no silent scope narrow): button visible on all routes per
 *     Manager directive Cluster G item 1 ("persistent across pages").
 */

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TutorModal } from './TutorModal';
import {
  shouldAutoOpenTour,
  shouldForceTour,
  resetTourState,
} from '@/lib/tour-storage';

export interface FloatingTutorButtonProps {
  /** Optional className override for the floating button container. */
  className?: string;
  /** Optional initial step (used when the URL has `?tour=N`). */
  initialStep?: number;
}

export function FloatingTutorButton({
  className,
  initialStep = 1,
}: FloatingTutorButtonProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // SSR-safe auto-open: only evaluate after hydration so the
  // localStorage read does not run on the server.
  useEffect(() => {
    setHydrated(true);
    if (shouldAutoOpenTour()) {
      // Force replay: reset the flag so a future fresh visit can
      // auto-open again per the user's wish.
      if (shouldForceTour()) {
        resetTourState();
      }
      // Delay 250ms so the underlying page mounts before the modal
      // captures focus + locks body scroll. Less jarring on first land.
      const t = window.setTimeout(() => setOpen(true), 250);
      return () => {
        window.clearTimeout(t);
      };
    }
  }, []);

  const handleClick = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {/* Button rendered after hydration to avoid SSR / client mismatch
          on the auto-open path. The button itself is a fixed overlay so
          it does not participate in layout. */}
      {hydrated ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Open Codeplex Chronicle tour"
          title="Open tour"
          data-tutor-floating-button="true"
          className={cn(
            'fixed bottom-6 right-6 z-[900] flex h-12 w-12 items-center justify-center rounded-full',
            'border border-white/20 bg-black/55 text-codeplex-ember backdrop-blur-md',
            'shadow-lg shadow-black/40 transition-all',
            'hover:scale-105 hover:border-codeplex-ember/60 hover:bg-codeplex-ember/15 hover:text-codeplex-ember',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-codeplex-ember/80',
            className
          )}
        >
          <span aria-hidden className="font-mono text-xl font-bold leading-none">
            ?
          </span>
        </button>
      ) : null}
      <TutorModal open={open} onClose={handleClose} initialStep={initialStep} />
    </>
  );
}

FloatingTutorButton.displayName = 'FloatingTutorButton';
