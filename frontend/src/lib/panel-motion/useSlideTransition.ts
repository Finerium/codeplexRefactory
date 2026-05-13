'use client';

/**
 * GSAP-driven slide-in/out hook for panels.
 *
 * Authored by Persephone (Wave 2) per Decision D4 (`_meta/decision_log/persephone.md`).
 * GSAP already installed by Calliope Wave 1 (gsap@3.13.0). 300ms easeInOutCubic
 * equivalent via GSAP `power3.inOut` keyframe.
 *
 * 3 slide direction supported: 'right' (chat panel from right), 'left' (side
 * panel from left), 'bottom' (ticket panel from bottom). Translation distance
 * computed from element bounding rect; opacity also fades.
 *
 * Reduced motion respected: if prefers-reduced-motion is 'reduce', slide is
 * instant (no transform animation, only opacity 0/1 binary).
 *
 * Aether Wave-Fixing 3 Cycle 2 (STAMP=20260513-0857): open-enter animation
 * now uses `to` from the element's current state rather than `fromTo` from
 * a hardcoded invisible start. This eliminates the 1-frame window where GSAP
 * would reset the element to opacity=0/visibility=hidden before beginning the
 * tween (which caused perceived "no response" when the Zustand state update +
 * React re-render + GSAP fromTo reset created a 2-3 frame invisible flash).
 * The element now immediately becomes visible at the start of the open
 * transition with visibility forced to visible, then opacity + transform
 * animate to the final state over the duration. Result: user sees the panel
 * appear in the first frame after click, not after a full animation cycle.
 *
 * Default duration reduced from 0.3 to 0.18s to match the perceived
 * immediate-response expectation for a building click. Chat + side panel
 * callers pass explicit duration and are unaffected.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 4 ([INFERRED] reduced-motion floor per WCAG; verified at globals.css line 100+
 *     pattern already present in marketing.css).
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export type SlideDirection = 'left' | 'right' | 'bottom' | 'top';

interface UseSlideTransitionOptions {
  /** Direction the panel slides in FROM (and out TO). */
  direction: SlideDirection;
  /** Animation duration in seconds. Default 0.18 (180ms). */
  duration?: number;
  /** Initial open state. Default true (mount visible). */
  open?: boolean;
}

/**
 * Hook returns a ref + control object. Attach the ref to the panel root
 * element; the hook animates the element on mount + on `open` toggles.
 *
 * Usage:
 *   const { ref, open, setOpen } = useSlideTransition({ direction: 'right' });
 *   return <div ref={ref}>{children}</div>;
 */
export function useSlideTransition(options: UseSlideTransitionOptions) {
  const { direction, duration = 0.18, open = true } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: degrade to opacity binary.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const offsetX =
      direction === 'right' ? '24px' : direction === 'left' ? '-24px' : '0px';
    const offsetY =
      direction === 'bottom'
        ? '24px'
        : direction === 'top'
          ? '-24px'
          : '0px';

    if (open) {
      if (reduced) {
        gsap.set(el, { autoAlpha: 1, x: 0, y: 0 });
      } else if (!mountedRef.current) {
        // First mount while open: animate in from offscreen so initial
        // appearance has a slide-in feel.
        gsap.fromTo(
          el,
          { autoAlpha: 0, x: offsetX, y: offsetY },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );
      } else {
        // Subsequent open (after having been closed): immediately make visible
        // so the user sees a response in the FIRST rendered frame, then finish
        // the slide/fade animation. This eliminates the perceived "no response"
        // gap caused by GSAP resetting autoAlpha=0 before the tween begins.
        gsap.set(el, { visibility: 'visible' });
        gsap.to(el, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    } else {
      if (reduced) {
        gsap.set(el, { autoAlpha: 0 });
      } else {
        gsap.to(el, {
          autoAlpha: 0,
          x: offsetX,
          y: offsetY,
          duration,
          ease: 'power3.in',
          overwrite: 'auto',
        });
      }
    }
    mountedRef.current = true;
  }, [open, direction, duration]);

  return { ref };
}
