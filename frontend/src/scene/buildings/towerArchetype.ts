/**
 * Tower archetype: Argus Police Station landmark.
 *
 * Silhouette: tall narrow surveillance tower + cylindrical observation deck
 * near top + single beacon point (Argus the watcher motif). Distinct from
 * generic office tower by the observation deck overhang + the beacon.
 * Material is dark slate (#3a4250) so the tower reads as authoritative +
 * watchful, different from temple marble / hospital white.
 *
 * Note on red blinking light: actual beacon animation is Wave 2 Asclepius
 * domain (health glow + dynamic lights). Iris ships the geometry only;
 * Asclepius adds animated emissive at runtime.
 */

import { BoxGeometry, CylinderGeometry, BufferGeometry, MeshStandardMaterial, Color } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyWindowShaderPatch, registerWindowMaterial } from './windowShaderPatch';

export function buildTowerGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Wide stout base (police station ground floor)
  const base = new BoxGeometry(1.0, 0.18, 1.0);
  base.translate(0, 0.09, 0);
  parts.push(base);

  // Setback first floor
  const floor1 = new BoxGeometry(0.85, 0.12, 0.85);
  floor1.translate(0, 0.24, 0);
  parts.push(floor1);

  // Tall narrow tower shaft (the surveillance tower itself, dominates the
  // vertical silhouette)
  const shaft = new BoxGeometry(0.34, 0.65, 0.34);
  shaft.translate(0, 0.625, 0);
  parts.push(shaft);

  // Observation deck (cylindrical, wider than shaft, overhangs visibly)
  const deck = new CylinderGeometry(0.32, 0.3, 0.1, 12);
  deck.translate(0, 0.97, 0);
  parts.push(deck);

  // Eye-like circular window slot (a darker disk on the front face of the
  // observation deck, modeled as a thin cylinder protrusion). The eye motif
  // ties to Argus the many-eyed watcher.
  const eye = new CylinderGeometry(0.08, 0.08, 0.04, 12);
  eye.rotateX(Math.PI / 2);
  eye.translate(0, 0.97, 0.31);
  parts.push(eye);

  // Beacon spire (above observation deck, slim point for the red light to
  // sit at runtime via Asclepius animation)
  const beaconBase = new CylinderGeometry(0.04, 0.06, 0.03, 8);
  beaconBase.translate(0, 1.04, 0);
  parts.push(beaconBase);

  const beaconShaft = new CylinderGeometry(0.025, 0.04, 0.08, 8);
  beaconShaft.translate(0, 1.09, 0);
  parts.push(beaconShaft);

  // Beacon tip (this is where Wave 2 Asclepius will attach the blinking red
  // emissive point light; geometry presence here defines the spot)
  const beaconTip = new CylinderGeometry(0.015, 0.025, 0.06, 8);
  beaconTip.translate(0, 1.16, 0);
  parts.push(beaconTip);

  // Antenna whisker (long thin spike, breaks the rounded silhouette so the
  // tower reads as comms tower at distance, not just an office)
  const antenna = new CylinderGeometry(0.005, 0.005, 0.18, 6);
  antenna.translate(0, 1.28, 0);
  parts.push(antenna);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris towerArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

export function buildTowerMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color('#3a4250'),
    roughness: 0.65,
    metalness: 0.25,
  });
  // Argus surveillance tower: sparse but intense red-warm tint (watch tower,
  // surveillance station, partial lights only), high flicker (security camera
  // monitor screens).
  const uniforms = applyWindowShaderPatch(mat, {
    glow: 0.85,
    density: 0.9,
    windowWarm: '#ff9a68',
    windowCool: '#ff6b6b',
    flicker: 1.0,
    emissiveBoost: 2.8,
  });
  registerWindowMaterial(uniforms);
  return mat;
}
