/**
 * Cross archetype: Apollo Hospital landmark.
 *
 * Silhouette: cross-shaped floor plan (two intersecting wings) + central
 * rotunda + thin spire on top. The wings make the building distinctive at
 * 10m distance, immediately readable as "hospital cross" different from
 * temple / tower / stack / beacon. Spire references medical institution
 * iconography.
 *
 * Material: clean white facade (#f5f5f0), no warm tint (Apollo runtime
 * resident is the clinical doctor persona, cool tone fits).
 */

import { BoxGeometry, CylinderGeometry, BufferGeometry, MeshStandardMaterial, Color } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyWindowShaderPatch, registerWindowMaterial } from './windowShaderPatch';

/**
 * Build the cross BufferGeometry. Normalized to unit footprint 1x1, height 1.
 */
export function buildCrossGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // North-south wing (taller, dominant axis of the cross)
  const wingNS = new BoxGeometry(0.34, 0.7, 1.0);
  wingNS.translate(0, 0.35, 0);
  parts.push(wingNS);

  // East-west wing (perpendicular, slightly shorter)
  const wingEW = new BoxGeometry(1.0, 0.62, 0.34);
  wingEW.translate(0, 0.31, 0);
  parts.push(wingEW);

  // Central rotunda where wings meet (cylinder, taller than wings)
  const rotunda = new CylinderGeometry(0.22, 0.22, 0.85, 12);
  rotunda.translate(0, 0.425, 0);
  parts.push(rotunda);

  // Rotunda cap (slightly wider, signals "drum" of dome)
  const rotundaCap = new CylinderGeometry(0.24, 0.22, 0.06, 12);
  rotundaCap.translate(0, 0.88, 0);
  parts.push(rotundaCap);

  // Dome (half-sphere stand-in: short tapered cylinder)
  const dome = new CylinderGeometry(0.18, 0.24, 0.1, 12);
  dome.translate(0, 0.96, 0);
  parts.push(dome);

  // Spire on top of dome (thin tall element, reads as hospital cross+spire)
  const spireBase = new CylinderGeometry(0.04, 0.06, 0.04, 8);
  spireBase.translate(0, 1.03, 0);
  parts.push(spireBase);

  const spireMid = new CylinderGeometry(0.02, 0.04, 0.1, 8);
  spireMid.translate(0, 1.1, 0);
  parts.push(spireMid);

  const spireTop = new CylinderGeometry(0.005, 0.02, 0.08, 8);
  spireTop.translate(0, 1.19, 0);
  parts.push(spireTop);

  // Cross arms accent (small thick bands at the spire base to read as
  // hospital cross signage from distance)
  const armH = new BoxGeometry(0.18, 0.03, 0.04);
  armH.translate(0, 1.05, 0);
  parts.push(armH);

  const armV = new BoxGeometry(0.04, 0.18, 0.04);
  armV.translate(0, 1.05, 0);
  parts.push(armV);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris crossArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

export function buildCrossMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color('#f5f5f0'),
    roughness: 0.55,
    metalness: 0.08,
  });
  // Apollo hospital: cool clinical tint, high density (24-hour care), full glow.
  const uniforms = applyWindowShaderPatch(mat, {
    glow: 0.92,
    density: 1.4,
    windowWarm: '#fff0c8',
    windowCool: '#b8d8ff',
    flicker: 0.6,
    emissiveBoost: 2.6,
  });
  registerWindowMaterial(uniforms);
  return mat;
}
