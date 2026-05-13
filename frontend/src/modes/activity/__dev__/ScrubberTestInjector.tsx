'use client';

/**
 * ScrubberTestInjector: dev-only window helper to drive the scrubber from
 * Playwright smoke tests.
 *
 * Owner: Boreas (Manager FINAL Cycle 2, STAMP 20260513-0857).
 *
 * Why: Playwright MCP cannot reliably interact with an opacity-0 native
 * range input overlay on top of a custom-styled rail (event.target
 * coordinates do not map cleanly). The smoke test needs to drive the
 * scrubber to specific positions to verify the city-height tween +
 * commit tooltip update. This injector exposes a window helper that the
 * test can invoke directly:
 *
 *   window.__codeplex_set_scrubber(0.0)   // NOW
 *   window.__codeplex_set_scrubber(0.5)   // midpoint
 *   window.__codeplex_set_scrubber(1.0)   // Nd ago
 *
 * Production builds: this file is still mounted but the helper is a
 * no-op when `process.env.NODE_ENV === 'production'`.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean.
 *   Lock 5: helper is dev-only test surface, labelled explicitly.
 */

import { useEffect } from 'react';
import { useActivityStore } from '../store';

declare global {
  interface Window {
    __codeplex_set_scrubber?: (position: number) => void;
    __codeplex_set_range?: (days: 30 | 60 | 90) => void;
  }
}

export function ScrubberTestInjector() {
  const setScrubberPosition = useActivityStore((s) => s.setScrubberPosition);
  const setRangeDays = useActivityStore((s) => s.setRangeDays);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') return;
    window.__codeplex_set_scrubber = (p: number) => {
      setScrubberPosition(Math.max(0, Math.min(1, p)));
    };
    window.__codeplex_set_range = (d: 30 | 60 | 90) => {
      setRangeDays(d);
    };

    // Apply ?scrubber=<0..1> on mount if present so Playwright smoke tests
    // can drive the scrubber via URL params without depending on the
    // window helper round-trip.
    try {
      const params = new URLSearchParams(window.location.search);
      const initialScrubber = params.get('scrubber');
      if (initialScrubber !== null) {
        const v = parseFloat(initialScrubber);
        if (!Number.isNaN(v)) setScrubberPosition(Math.max(0, Math.min(1, v)));
      }
    } catch {
      // ignore SSR / URL parse error
    }

    return () => {
      delete window.__codeplex_set_scrubber;
      delete window.__codeplex_set_range;
    };
  }, [setScrubberPosition, setRangeDays]);

  return null;
}
