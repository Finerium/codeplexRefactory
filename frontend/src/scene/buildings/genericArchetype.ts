/**
 * Generic archetype family: residence / warehouse / office.
 *
 * 3 sub-archetypes share a base rectangular box silhouette but differ in
 * proportion + window pattern hint:
 *  - generic-residence: short box (typical source file)
 *  - generic-warehouse: wide flat box (large generated bundles)
 *  - generic-office: tall narrow box (multi-author core modules)
 *
 * All three are intentionally less detailed than landmarks so the 5
 * landmarks (temple/cross/tower/stack/beacon) read as iconic + the city
 * has a hierarchy: residents stand out, generic files form the background.
 *
 * Performance discipline: each generic archetype is a single merged
 * geometry with low poly count (~50 tris vs landmarks ~200-400 tris).
 * At 200-300 building count, generic dominates, so keeping them cheap is
 * critical for H1 60fps hypothesis.
 */

import { BoxGeometry, BufferGeometry, MeshStandardMaterial, Color } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyWindowShaderPatch, registerWindowMaterial } from './windowShaderPatch';

/**
 * Residence: typical source file building. Slight roof line + window
 * pattern hint via a thin band on each face. Proportion 1.0 x 1.0 footprint,
 * height varies via per-instance scale.
 */
export function buildResidenceGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Foundation
  const base = new BoxGeometry(1.0, 0.06, 1.0);
  base.translate(0, 0.03, 0);
  parts.push(base);

  // Main body
  const body = new BoxGeometry(0.92, 0.84, 0.92);
  body.translate(0, 0.48, 0);
  parts.push(body);

  // Roof cap (slight overhang so the building reads as having a roof line,
  // not a featureless box)
  const roof = new BoxGeometry(1.0, 0.06, 1.0);
  roof.translate(0, 0.93, 0);
  parts.push(roof);

  // Window band hint (a thin protrusion mid-height that suggests a window
  // row at silhouette; this is what reads as "building with windows" vs
  // "stacked crate" at distance)
  const bandFront = new BoxGeometry(0.96, 0.04, 0.02);
  bandFront.translate(0, 0.52, 0.47);
  parts.push(bandFront);

  const bandBack = new BoxGeometry(0.96, 0.04, 0.02);
  bandBack.translate(0, 0.52, -0.47);
  parts.push(bandBack);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris residenceArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

/**
 * Warehouse: wide flat box for large generated bundles. Proportion 1.4 x 1.4
 * footprint (artificially expanded by per-instance scale), low height.
 * Reads as "large flat building" distinct from residence (proportional) and
 * office (tall narrow).
 */
export function buildWarehouseGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Foundation
  const base = new BoxGeometry(1.0, 0.06, 1.0);
  base.translate(0, 0.03, 0);
  parts.push(base);

  // Body (deliberately shorter than residence)
  const body = new BoxGeometry(0.94, 0.58, 0.94);
  body.translate(0, 0.35, 0);
  parts.push(body);

  // Slanted shed roof (signal: warehouse, not residence). Approximated by
  // two stepped boxes ascending.
  const roof1 = new BoxGeometry(1.0, 0.06, 1.0);
  roof1.translate(0, 0.67, 0);
  parts.push(roof1);

  const roof2 = new BoxGeometry(0.82, 0.06, 0.82);
  roof2.translate(0, 0.73, 0);
  parts.push(roof2);

  // Loading dock hint (small bump on front face, reads as warehouse door)
  const dock = new BoxGeometry(0.36, 0.16, 0.08);
  dock.translate(0, 0.14, 0.5);
  parts.push(dock);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris warehouseArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

/**
 * Office: tall narrow box for multi-author core modules. Proportion 0.85 x
 * 0.85 footprint, height typically scaled large per-instance. Window bands
 * stack vertically so the silhouette reads as "office tower" vs the squat
 * residence / warehouse.
 */
export function buildOfficeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Foundation
  const base = new BoxGeometry(1.0, 0.06, 1.0);
  base.translate(0, 0.03, 0);
  parts.push(base);

  // Setback first floor (narrower than base)
  const floor1 = new BoxGeometry(0.88, 0.12, 0.88);
  floor1.translate(0, 0.12, 0);
  parts.push(floor1);

  // Main shaft (tall narrow body)
  const shaft = new BoxGeometry(0.78, 0.7, 0.78);
  shaft.translate(0, 0.54, 0);
  parts.push(shaft);

  // 3 horizontal window bands stacked on the shaft (reads as multi-floor
  // office tower)
  for (let i = 0; i < 3; i++) {
    const y = 0.3 + i * 0.2;
    const bandF = new BoxGeometry(0.82, 0.04, 0.02);
    bandF.translate(0, y, 0.4);
    parts.push(bandF);

    const bandB = new BoxGeometry(0.82, 0.04, 0.02);
    bandB.translate(0, y, -0.4);
    parts.push(bandB);
  }

  // Top mechanical floor (slightly wider, reads as building cap)
  const cap = new BoxGeometry(0.84, 0.08, 0.84);
  cap.translate(0, 0.93, 0);
  parts.push(cap);

  // Small antenna whisker (breaks flat silhouette, reads as office tower)
  const ant = new BoxGeometry(0.04, 0.06, 0.04);
  ant.translate(0, 1.0, 0);
  parts.push(ant);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris officeArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

/**
 * Generic archetype family materials. Each of the 3 generic types
 * (residence / warehouse / office) gets its own MeshStandardMaterial with
 * differentiated window shader params so the city visual hierarchy reads:
 *   - residence: medium density warm (cozy lit homes)
 *   - warehouse: sparse cool (industrial, mostly dark)
 *   - office: dense cool (tall stacked floors, many windows)
 *
 * Per idea-draft H.2 "building yang sedang aktif diedit glow lebih". The
 * activity-driven per-instance tint scaling in BuildingInstances continues
 * to modulate brightness through setColorAt, layered on top of these
 * archetype-baseline shader params.
 */
export function buildResidenceMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color('#9aa1ac'),
    roughness: 0.78,
    metalness: 0.08,
  });
  const uniforms = applyWindowShaderPatch(mat, {
    glow: 0.7,
    density: 1.0,
    windowWarm: '#ffc878',
    windowCool: '#7d9eff',
    flicker: 0.6,
    emissiveBoost: 2.2,
  });
  registerWindowMaterial(uniforms);
  return mat;
}

export function buildWarehouseMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color('#7c8493'),
    roughness: 0.85,
    metalness: 0.12,
  });
  const uniforms = applyWindowShaderPatch(mat, {
    glow: 0.55,
    density: 0.7,
    windowWarm: '#ffa860',
    windowCool: '#6080a0',
    flicker: 0.4,
    emissiveBoost: 2.0,
  });
  registerWindowMaterial(uniforms);
  return mat;
}

export function buildOfficeMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color('#8a93a0'),
    roughness: 0.55,
    metalness: 0.2,
  });
  const uniforms = applyWindowShaderPatch(mat, {
    glow: 0.85,
    density: 1.3,
    windowWarm: '#ffd098',
    windowCool: '#a0b8e0',
    flicker: 0.5,
    emissiveBoost: 2.4,
  });
  registerWindowMaterial(uniforms);
  return mat;
}

/**
 * Legacy entry point kept for any external import. Returns the residence
 * material as the canonical generic baseline. New BuildingInstances code uses
 * the per-archetype builders directly.
 */
export function buildGenericMaterial(): MeshStandardMaterial {
  return buildResidenceMaterial();
}
