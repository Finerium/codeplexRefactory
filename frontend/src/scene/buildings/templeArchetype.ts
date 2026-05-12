/**
 * Temple archetype: Athena City Hall landmark.
 *
 * Silhouette: stepped foundation (3 plinth steps) + rectangular cella +
 * triangular pediment (roof) + colonnade hint along front edge. Targets the
 * Parthenon proportion 8 columns front, 17 columns side (8:17 ratio), but
 * scaled to a single InstancedMesh draw so columns are inset bumps on the
 * cella, not separate geometry. At 10m distance, the silhouette reads as
 * "Greek temple with pediment" distinct from cross / tower / stack / beacon.
 *
 * Material: marble white (#e8e2d3) base, ambient glow tint warmer near
 * window pattern. setColorAt(index, ...) at the BuildingInstances level
 * overrides per-instance with ownershipColor from BuildingData.
 *
 * Compliance: anti-pattern Lock 5 ([NOTE] this is a Wave 1 archetype, no
 * mock label needed since it is the production geometry).
 */

import { BoxGeometry, BufferGeometry, MeshStandardMaterial, Color } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Build the temple BufferGeometry. Normalized to footprint width=1, depth=1,
 * total height=1 at unit scale; BuildingInstances scales by BuildingData
 * width/height/depth to reach world dimensions.
 */
export function buildTempleGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Stepped foundation: 3 plinth layers, each slightly smaller than the one
  // below, total foundation height = 0.15
  const plinth1 = new BoxGeometry(1.0, 0.05, 1.0);
  plinth1.translate(0, 0.025, 0);
  parts.push(plinth1);

  const plinth2 = new BoxGeometry(0.94, 0.05, 0.94);
  plinth2.translate(0, 0.075, 0);
  parts.push(plinth2);

  const plinth3 = new BoxGeometry(0.88, 0.05, 0.88);
  plinth3.translate(0, 0.125, 0);
  parts.push(plinth3);

  // Cella body (the main rectangular hall above the plinth)
  // Height = 0.55, sits on top of plinth3
  const cella = new BoxGeometry(0.82, 0.55, 0.82);
  cella.translate(0, 0.425, 0);
  parts.push(cella);

  // Column suggestion: 4 corner pillars, slightly proud of cella front/back
  // (we cannot replicate full 8x17 colonnade in one InstancedMesh, so we
  // suggest temple feel via corner columns + thicker front pair)
  const colHeight = 0.55;
  const colHalf = colHeight / 2 + 0.15;
  const colW = 0.06;
  const colInset = 0.41; // half of cella width minus a hair
  const colZ = 0.41;

  // Front-left, front-right (slightly thicker to read as front colonnade)
  const colFL = new BoxGeometry(colW * 1.4, colHeight, colW * 1.4);
  colFL.translate(-colInset + colW * 0.7, colHalf, colZ - colW * 0.7);
  parts.push(colFL);

  const colFR = new BoxGeometry(colW * 1.4, colHeight, colW * 1.4);
  colFR.translate(colInset - colW * 0.7, colHalf, colZ - colW * 0.7);
  parts.push(colFR);

  // Back-left, back-right
  const colBL = new BoxGeometry(colW, colHeight, colW);
  colBL.translate(-colInset + colW / 2, colHalf, -colZ + colW / 2);
  parts.push(colBL);

  const colBR = new BoxGeometry(colW, colHeight, colW);
  colBR.translate(colInset - colW / 2, colHalf, -colZ + colW / 2);
  parts.push(colBR);

  // Pediment: triangular prism approximated by a stretched box rotated +
  // top-tapered via a smaller box on top. Single box stand-in for
  // single-draw-call discipline. Reads as gabled roof at distance.
  const pedimentBase = new BoxGeometry(0.85, 0.08, 0.86);
  pedimentBase.translate(0, 0.74, 0);
  parts.push(pedimentBase);

  const pedimentMid = new BoxGeometry(0.68, 0.08, 0.7);
  pedimentMid.translate(0, 0.82, 0);
  parts.push(pedimentMid);

  const pedimentTop = new BoxGeometry(0.4, 0.08, 0.42);
  pedimentTop.translate(0, 0.9, 0);
  parts.push(pedimentTop);

  // Apex point (small block on top to break flat silhouette)
  const apex = new BoxGeometry(0.12, 0.06, 0.14);
  apex.translate(0, 0.96, 0);
  parts.push(apex);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris templeArchetype: mergeGeometries returned null');
  }
  // Recenter on Y so origin = ground plane (foundation bottom)
  merged.translate(0, 0, 0);
  merged.computeVertexNormals();
  return merged;
}

/**
 * Temple material. Marble white base + warm ambient. Uses MeshStandardMaterial
 * for PBR-like lighting response with Daedalus' 2-3 directional rig.
 * vertexColors=true so per-instance setColorAt overrides via Iris
 * ownershipColor encoding.
 */
export function buildTempleMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color('#e8e2d3'),
    roughness: 0.7,
    metalness: 0.05,
    vertexColors: false,
  });
}
