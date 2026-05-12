/**
 * Beacon archetype: Hermes Tourist Info landmark.
 *
 * Silhouette: glass cube + central light pillar emanating from top. Smaller
 * footprint than other landmarks (info booth scale), so even at 10m the
 * beacon reads as "small kiosk with light tower" vs the big temple /
 * hospital / police / library nearby. The light pillar is a thin tall
 * cylinder that breaks the cube silhouette dramatically.
 *
 * Material: glass-like translucent white (#dde4ec) with high metalness +
 * low roughness so it picks up the HDRI environment reflection from
 * Daedalus' skybox. Wave 2 Asclepius can attach a soft point light at the
 * pillar tip for the "beacon" effect at runtime.
 *
 * Note: actual transparent glass via MeshPhysicalMaterial.transmission would
 * be more accurate but is GPU-expensive per draw call. We choose roughness
 * approximation for performance budget compliance (Phase B anchor 7: cheap
 * material on instanced mesh, expensive material only on landmarks if
 * needed Wave 2).
 */

import { BoxGeometry, CylinderGeometry, BufferGeometry, MeshStandardMaterial, Color } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function buildBeaconGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Foundation slab (slightly wider than cube to ground the structure)
  const slab = new BoxGeometry(0.95, 0.05, 0.95);
  slab.translate(0, 0.025, 0);
  parts.push(slab);

  // Stepped plinth
  const plinth = new BoxGeometry(0.78, 0.06, 0.78);
  plinth.translate(0, 0.08, 0);
  parts.push(plinth);

  // Main glass cube (the iconic Hermes info booth). Cube proportion exact
  // (0.7 x 0.7 x 0.7) so the silhouette reads as cube, not cuboid.
  const cube = new BoxGeometry(0.7, 0.7, 0.7);
  cube.translate(0, 0.11 + 0.35, 0);
  parts.push(cube);

  // Cube cap (thicker rim that signals roof closure + base for pillar)
  const cap = new BoxGeometry(0.76, 0.04, 0.76);
  cap.translate(0, 0.83, 0);
  parts.push(cap);

  // Central light pillar (thin tall cylinder rising from cube center). This
  // is the defining beacon silhouette element + tip for Wave 2 light
  // attachment.
  const pillarBase = new CylinderGeometry(0.05, 0.08, 0.08, 12);
  pillarBase.translate(0, 0.89, 0);
  parts.push(pillarBase);

  const pillarShaft = new CylinderGeometry(0.035, 0.05, 0.34, 12);
  pillarShaft.translate(0, 1.1, 0);
  parts.push(pillarShaft);

  // Pillar finial / tip (the light point)
  const tip = new CylinderGeometry(0.015, 0.035, 0.08, 12);
  tip.translate(0, 1.31, 0);
  parts.push(tip);

  // 4 corner posts on the cube edges (signal the glass-cube frame, like
  // exposed architectural framing of a real info kiosk). Posts are thin so
  // they read at silhouette without crowding.
  const postH = 0.7;
  const postW = 0.035;
  const inset = 0.34;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new BoxGeometry(postW, postH, postW);
      post.translate(sx * inset, 0.11 + postH / 2, sz * inset);
      parts.push(post);
    }
  }

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris beaconArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

export function buildBeaconMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color('#dde4ec'),
    roughness: 0.15,
    metalness: 0.6,
    envMapIntensity: 1.3,
  });
}
