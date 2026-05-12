/**
 * Public scene types.
 *
 * Source of truth for the Daedalus to Iris contract
 * (_meta/contracts/daedalus-to-iris.md, locked Wave 0 Pythia).
 *
 * Daedalus authors this file. Iris re-exports BuildingData and related
 * geometry types from frontend/src/scene/buildings/types.ts and they are
 * surfaced through @/scene barrel without collision (Iris owns the
 * `buildings/*` subtree; Daedalus owns root + Canvas + Performance).
 */

import type { ReactNode } from 'react';

/**
 * ChronicleCanvas props per Pythia contract.
 *
 * NOTE: when `paused` is true, Drei OrbitControls auto-rotate idle drift
 * stops. The render loop itself stays on `frameloop="always"` by default
 * so the night HDRI + Bloom + Sparkles continue feeling alive. Iris is
 * expected to flip `paused` when the Refactor SAFETY-FIRST simulation
 * preview opens (Wave 3 Pandora consumer).
 */
export interface ChronicleCanvasProps {
  /** Scene children. Iris mounts BuildingInstances + districts here. */
  children: ReactNode;
  /** When true, disables auto-rotate idle drift. Default false. */
  paused?: boolean;
  /** Override default OrbitControls target [x, y, z]. Default [0, 0, 0]. */
  cameraTarget?: [number, number, number];
  /** Override default camera position. Default [0, 50, 80]. */
  cameraPosition?: [number, number, number];
  /**
   * Optional className applied to the wrapping div (full-bleed by default).
   * Calliope/Hestia/Selene tighten when embedding preview corner.
   */
  className?: string;
}

/**
 * Performance state surfaced to children for Iris LOD coordination.
 *
 * `qualityFactor`: 0 to 1 adaptive factor from Drei PerformanceMonitor
 *   onChange callback. 1.0 = full quality. Below 1 = at least one regress
 *   event fired or the FPS factor dropped under the bounds.
 *
 * `regressing`: true if regress() fired within the last 2 seconds (debounce
 *   matches PerformanceMonitor default). Children should consider LOD
 *   reduction during this window. Auto-resets to false after 2s of calm.
 */
export interface PerformanceState {
  qualityFactor: number;
  regressing: boolean;
}

/**
 * Runtime feature flag values per PRD AD-12 drop-first protocol.
 *
 * Sourced from process.env.NEXT_PUBLIC_* at module load time, coerced
 * to booleans. Default ON, kill-switch off via env without rebuild.
 *
 * Drop-first order on regress (PRD Section 13.4 + Phase B anchor 8):
 *   1. ENABLE_DOF (DepthOfField, single biggest cost)
 *   2. pixel ratio drop (devicePixelRatio cap 2 to 1)
 *   3. ENABLE_SPARKLES_TIER_3 (highest particle tier)
 */
export interface FeatureFlags {
  ENABLE_DOF: boolean;
  ENABLE_SPARKLES_TIER_3: boolean;
  ENABLE_THIRD_DIRECTIONAL_LIGHT: boolean;
}
