'use client';

/**
 * Shared visual utilities for Sprint Mode HERO overlays.
 *
 * Authored by Hera (Wave 2). Geometry helpers, deterministic pseudo-random
 * (seeded by building id), color helpers for the 14 PM concept components.
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label needed; pure utility module
 */

import type { BuildingData } from '@/scene/buildings/types';

/**
 * Anchor a small object at a position relative to a building (top-center).
 * Used by Crane, GreenHalo, BlueprintPin, etc.
 */
export function topCenterOf(b: BuildingData, yOffset: number = 0): [number, number, number] {
  return [b.position[0], b.position[1] + b.height + yOffset, b.position[2]];
}

/**
 * Bottom-center anchor (ground level). Used by YellowTape, ground decals.
 */
export function bottomCenterOf(b: BuildingData, yOffset: number = 0): [number, number, number] {
  return [b.position[0], b.position[1] + yOffset, b.position[2]];
}

/**
 * Front-face anchor (positive +z building-local). Used by sticky note PR
 * comment placement.
 */
export function frontFaceOf(b: BuildingData, yFrac: number = 0.7, zPad: number = 0.5): [number, number, number] {
  return [
    b.position[0],
    b.position[1] + b.height * yFrac,
    b.position[2] + b.depth / 2 + zPad,
  ];
}

/**
 * Back-face anchor (negative -z building-local). Used by Athena-landmark
 * sticky note placement to avoid CityHallBanner collision.
 */
export function backFaceOf(b: BuildingData, yFrac: number = 0.7, zPad: number = 0.5): [number, number, number] {
  return [
    b.position[0],
    b.position[1] + b.height * yFrac,
    b.position[2] - b.depth / 2 - zPad,
  ];
}

/**
 * Deterministic pseudo-random in [0, 1) seeded by building id. Used to vary
 * sub-element placements (scaffolding rung offsets, smoke particle phases)
 * so each building reads as unique without losing reproducibility.
 */
export function seededRandom(id: string, salt: number = 0): number {
  // djb2-derived 32-bit hash, normalize to [0,1)
  let hash = 5381;
  const text = `${id}::${salt}`;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33 + text.charCodeAt(i)) | 0;
  }
  return ((hash >>> 0) % 100000) / 100000;
}

/**
 * Anti-AI-slop color tokens for Sprint Mode HERO overlays. Curated for
 * cinematic anchor mood (Phase B + PRD Section 13.2). All hex values are
 * scoped to this module; sibling Wave 2 workers should NOT mutate.
 */
export const SPRINT_PALETTE = {
  scaffoldingWood: '#a87742',
  scaffoldingMetal: '#9ba3ad',
  scaffoldingJoint: '#5b6168',
  craneYellow: '#e8b13a',
  craneCable: '#3b3f47',
  craneCounterweight: '#666b73',
  blueprintBlue: '#3a6df0',
  blueprintCanvas: '#f0e7d0',
  greenHaloEmissive: '#5dffaa',
  greenHaloFill: '#a8ffd4',
  yellowTapeYellow: '#f5d033',
  yellowTapeBlack: '#1f1d18',
  smokeGrey: '#7a7670',
  smokeAsh: '#3d3a36',
  retakDark: '#1c1716',
  inspectorBriefcase: '#5b3a1a',
  inspectorBody: '#2c3a4a',
  inspectorHardHat: '#e8b13a',
  bannerCloth: '#c83a2a',
  bannerFringe: '#e4b76b',
  bannerPole: '#4a3a2a',
  districtGlow: '#7d9cff',
  dodCheckGreen: '#5dffaa',
  dodCheckGray: '#5a5e64',
  redBridgeEmissive: '#ff4757',
  redBridgeTrim: '#7a1822',
  stickyNotePaper: '#f7e07a',
  stickyNoteShadow: '#aa9740',
  stickyNoteBadge: '#e22128',
  stickyNoteBadgeText: '#ffffff',
  sizeBadgeBg: '#1a1d22',
  sizeBadgeBorder: '#c8b6ff',
  sizeBadgeText: '#f1f3f8',
} as const;

/**
 * Mapping XS/S/M/L/XL story-size letter to a color hex (warm to cool spectrum
 * so engineers parse complexity at a glance).
 */
export const SIZE_BADGE_COLORS: Record<'XS' | 'S' | 'M' | 'L' | 'XL', string> = {
  XS: '#7dffae',
  S: '#7ddfff',
  M: '#7d9cff',
  L: '#c8b6ff',
  XL: '#ffb47d',
};

/**
 * 30-min halo full duration. Re-exported for SprintMode banner display.
 */
export { HALO_DURATION_MS } from './stateMachine';
