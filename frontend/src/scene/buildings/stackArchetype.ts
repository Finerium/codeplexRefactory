/**
 * Stack archetype: Clio Library landmark.
 *
 * Silhouette: vertical book-stack pattern. Stack of progressively offset
 * blocks with subtle slot grooves (book spines) running vertical. Taller
 * than wide (proportion ratio 1:2.2), which is the key silhouette differ
 * from temple (squat) / cross (cruciform) / tower (very narrow) / beacon
 * (small cube). The book-spine grooves are baked into geometry as alternating
 * thin gaps between sub-boxes, readable as "library/archive" at distance.
 *
 * Material: warm amber stone (#a08560) to evoke library wood + paper warmth,
 * tying into Clio runtime resident historian persona (warm, archival).
 */

import { BoxGeometry, BufferGeometry, MeshStandardMaterial, Color } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { applyWindowShaderPatch, registerWindowMaterial } from './windowShaderPatch';

export function buildStackGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];

  // Foundation pad (slightly wider than stack so the building reads
  // grounded, not floating)
  const pad = new BoxGeometry(0.95, 0.06, 0.95);
  pad.translate(0, 0.03, 0);
  parts.push(pad);

  // Build 6 book-shelf tiers, each tier = 1 horizontal book-row block + 2
  // shelf gap markers. Tier height ~0.15, total stack reaches 0.90 above
  // the foundation, total height ~0.96.
  const tierCount = 6;
  const tierHeight = 0.15;
  for (let i = 0; i < tierCount; i++) {
    const baseY = 0.06 + i * tierHeight;
    const tierWidth = 0.78;
    const tierDepth = 0.78;

    // Main row block (the shelf of books, visible as horizontal band)
    const block = new BoxGeometry(tierWidth, tierHeight * 0.85, tierDepth);
    block.translate(0, baseY + (tierHeight * 0.85) / 2, 0);
    parts.push(block);

    // Shelf rim slats: thin protrusions on front + back so the silhouette
    // shows clear horizontal bands at distance (this is what makes the
    // building read as "stacked books" not "stacked office floors")
    const rimFront = new BoxGeometry(tierWidth * 1.04, tierHeight * 0.18, 0.04);
    rimFront.translate(0, baseY + tierHeight * 0.07, tierDepth / 2 + 0.02);
    parts.push(rimFront);

    const rimBack = new BoxGeometry(tierWidth * 1.04, tierHeight * 0.18, 0.04);
    rimBack.translate(0, baseY + tierHeight * 0.07, -tierDepth / 2 - 0.02);
    parts.push(rimBack);

    // Alternate offset on every other tier so the stack looks slightly
    // off-aligned (Clio's archive shelves feel hand-stacked, not regular)
    if (i % 2 === 1) {
      const accent = new BoxGeometry(tierWidth * 0.95, tierHeight * 0.4, 0.06);
      accent.translate(0, baseY + tierHeight * 0.5, tierDepth / 2);
      parts.push(accent);
    }
  }

  // Top cap (signals stack closure, slightly wider than top tier)
  const cap = new BoxGeometry(0.84, 0.05, 0.84);
  cap.translate(0, 0.06 + tierCount * tierHeight + 0.025, 0);
  parts.push(cap);

  // Vertical spine accent (book spines running floor-to-cap on one side, so
  // even at 10m camera angle the vertical stacking reads through)
  const spine = new BoxGeometry(0.04, tierCount * tierHeight + 0.04, 0.06);
  spine.translate(0.36, 0.06 + (tierCount * tierHeight) / 2, 0.32);
  parts.push(spine);

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  if (!merged) {
    throw new Error('Iris stackArchetype: mergeGeometries returned null');
  }
  merged.computeVertexNormals();
  return merged;
}

export function buildStackMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color('#a08560'),
    roughness: 0.78,
    metalness: 0.05,
  });
  // Clio library: amber warm reading-room glow, dense (study lights every shelf),
  // very low flicker (still reading room atmosphere).
  const uniforms = applyWindowShaderPatch(mat, {
    glow: 0.9,
    density: 1.5,
    windowWarm: '#ffba6a',
    windowCool: '#e0a060',
    flicker: 0.35,
    emissiveBoost: 2.6,
  });
  registerWindowMaterial(uniforms);
  return mat;
}
