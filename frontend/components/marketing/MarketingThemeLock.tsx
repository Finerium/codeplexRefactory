'use client';

import { useLayoutEffect } from 'react';

/**
 * MarketingThemeLock, route-scoped light-mode + day-palette lock.
 *
 * Authored by Calliope (Wave 1) per Revision 1 (light mode lock, dark mode
 * retired). Daedalus owns the root `app/layout.tsx` which boots `<html
 * className="dark">` for the production city scene. When the user navigates
 * to the marketing landing this component flips html.dataset.mode = 'day',
 * removes the `dark` class on html if present, and reverts on unmount so
 * other routes inherit Daedalus's defaults.
 */
export function MarketingThemeLock() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevMode = html.dataset.mode;
    const prevLabels = html.dataset.labels;
    const hadDarkClass = html.classList.contains('dark');
    const prevBodyClass = body.className;

    html.dataset.mode = 'day';
    html.dataset.labels = 'scroll-only';
    if (hadDarkClass) html.classList.remove('dark');
    // Strip Daedalus body bg classes inside this route only so the
    // marketing palette can paint. Restored on unmount.
    body.className = '';
    body.classList.add('marketing-body');

    return () => {
      if (prevMode === undefined) {
        delete html.dataset.mode;
      } else {
        html.dataset.mode = prevMode;
      }
      if (prevLabels === undefined) {
        delete html.dataset.labels;
      } else {
        html.dataset.labels = prevLabels;
      }
      if (hadDarkClass) html.classList.add('dark');
      body.className = prevBodyClass;
    };
  }, []);

  return null;
}
