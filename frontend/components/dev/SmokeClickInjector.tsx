'use client';

/**
 * SmokeClickInjector: dev-only E2E hook exposing a window-level function that
 * triggers a building click via the Iris dispatch bus.
 *
 * Authored by Hera (Wave-Fixing #2 cycle 1, STAMP=20260513-0321) for B-1
 * verification: Playwright MCP cannot click WebGL canvas coords precisely,
 * so this injector lets a smoke test invoke the click pipeline end-to-end
 * via `window.__codeplex_smoke_click('<building-id>')`.
 *
 * Behavior:
 *   - Mounts once at /city route (sibling to ChronicleCanvas)
 *   - Registers `window.__codeplex_smoke_click(buildingId?)` in DEV mode only
 *   - Default behavior (no arg): clicks the first building in city.buildings
 *   - Production builds: hook returns null + no-op; window function NOT defined
 *
 * Critical: this is a TESTING surface, NOT a production click path. The
 * natural click via r3f onClick onInstancedMesh still ships unchanged.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): SMOKE-TAP label at top + dev-mode-only gating;
 *     production builds strip out the window registration entirely
 */

import { useEffect } from 'react';
import { useBuildingClickDispatch, useCityData } from '@/scene/buildings';
import type { ThreeEvent } from '@react-three/fiber';

declare global {
  interface Window {
    __codeplex_smoke_click?: (buildingId?: string) => string | null;
  }
}

export function SmokeClickInjector() {
  const city = useCityData();
  const dispatch = useBuildingClickDispatch();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    function clickTarget(buildingId?: string): string | null {
      const target = buildingId
        ? city.buildings.find((b) => b.id === buildingId)
        : city.buildings[0];
      if (!target) {
        // eslint-disable-next-line no-console
        console.warn(
          '[smoke-inject] no building found for id=',
          buildingId ?? '(first)',
        );
        return null;
      }
      const synthetic = {
        instanceId: 0,
        stopPropagation: () => {},
      } as unknown as ThreeEvent<MouseEvent>;
      // eslint-disable-next-line no-console
      console.log('[smoke-inject] dispatching click on', target.id);
      dispatch(target, synthetic);
      return target.id;
    }

    window.__codeplex_smoke_click = clickTarget;

    // Hash trigger fallback for Playwright MCP: navigate to
    // `/city#smoke-click=<id>` or `/city#smoke-click=first` to dispatch a
    // click on page load. Hash changes also trigger re-dispatch.
    function processHash() {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      const m = /#smoke-click=([^&]+)/.exec(hash);
      if (!m) return;
      const arg = decodeURIComponent(m[1]);
      const id = arg === 'first' ? undefined : arg;
      // Poll every 200ms for up to 15s waiting for Hera click bridge to
      // mount (window.__codeplex_hera_ready). Once detected, dispatch the
      // click + clear the interval. Hera bridge sets the flag in its
      // useEffect mount; reliable signal vs timing-based deferral.
      let elapsed = 0;
      const POLL_INTERVAL_MS = 200;
      const MAX_WAIT_MS = 15000;
      const poll = setInterval(() => {
        elapsed += POLL_INTERVAL_MS;
        const heraReady = (window as unknown as {
          __codeplex_hera_ready?: boolean;
        }).__codeplex_hera_ready;
        if (heraReady) {
          clearInterval(poll);
          clickTarget(id);
        } else if (elapsed >= MAX_WAIT_MS) {
          clearInterval(poll);
          // eslint-disable-next-line no-console
          console.warn(
            '[smoke-inject] Hera click bridge not ready after 15s, giving up',
          );
        }
      }, POLL_INTERVAL_MS);
    }
    processHash();
    window.addEventListener('hashchange', processHash);

    return () => {
      window.removeEventListener('hashchange', processHash);
      delete window.__codeplex_smoke_click;
    };
  }, [city, dispatch]);

  return null;
}

SmokeClickInjector.displayName = 'SmokeClickInjector';
