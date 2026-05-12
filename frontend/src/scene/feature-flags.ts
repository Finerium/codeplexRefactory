/**
 * Feature flag resolution layer.
 *
 * Per sourceoftruth Section 3.4: ENABLE_DOF, ENABLE_SPARKLES_TIER_3, and
 * ENABLE_THIRD_DIRECTIONAL_LIGHT default ON, env value 'false' opts out
 * without rebuild.
 *
 * Also applies an iOS Safari < 17 guard for ENABLE_DOF per Pythia contract
 * `daedalus-to-iris.md` Edge case handling (DepthOfField shader expensive on
 * Apple WebGL on older Safari).
 *
 * Module-level constant evaluation is fine here: Next.js inlines
 * NEXT_PUBLIC_* at build time. Runtime kill via .env edit + dev server
 * restart, NOT live toggle. The audit gate flips env, restarts pnpm dev,
 * and re-validates within 30 seconds.
 */

import type { FeatureFlags } from './types';

function envFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  // Treat literal string 'false' or '0' as off. Everything else stays on.
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === '') {
    return false;
  }
  return true;
}

/**
 * Detect iOS Safari < 17. SSR-safe, returns false when window is undefined.
 *
 * We avoid the now-deprecated `navigator.userAgent` parsing only where the
 * browser exposes `userAgentData`. Apple ships neither client hint nor the
 * modern `navigator.userAgentData`, so for iOS we fall back to UA sniffing.
 * That is acceptable for a feature flag guard, not a security boundary.
 */
function isLegacyAppleWebGL(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  // iPad and iPhone share Safari WebKit binary.
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  // Match "Version/<major>.<minor>" pattern Safari emits.
  const versionMatch = ua.match(/Version\/(\d+)\.(\d+)/);
  if (!versionMatch) return false;
  const major = Number.parseInt(versionMatch[1] ?? '0', 10);
  return major < 17;
}

const RAW_DOF = envFlag(process.env.NEXT_PUBLIC_ENABLE_DOF, true);
const RAW_SPARKLES_T3 = envFlag(
  process.env.NEXT_PUBLIC_ENABLE_SPARKLES_TIER_3,
  true,
);
const RAW_THIRD_LIGHT = envFlag(
  process.env.NEXT_PUBLIC_ENABLE_THIRD_DIRECTIONAL_LIGHT,
  true,
);

/**
 * Resolved feature flags. iOS Safari < 17 forces DOF off regardless of env.
 *
 * Frozen object so downstream consumers cannot mutate accidentally. Iris
 * reads via `FEATURE_FLAGS.ENABLE_SPARKLES_TIER_3` only; the third light
 * + DOF gates stay internal to Daedalus.
 */
export const FEATURE_FLAGS: Readonly<FeatureFlags> = Object.freeze({
  ENABLE_DOF: RAW_DOF && !isLegacyAppleWebGL(),
  ENABLE_SPARKLES_TIER_3: RAW_SPARKLES_T3,
  ENABLE_THIRD_DIRECTIONAL_LIGHT: RAW_THIRD_LIGHT,
});
