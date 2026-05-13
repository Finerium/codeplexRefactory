/**
 * Squarified treemap layout for the 3D city.
 *
 * Algorithm: Bruls, Huizing, van Wijk (2000), "Squarified Treemaps".
 * Reference: https://www.win.tue.nl/~vanwijk/stm.pdf
 *
 * Adapted from 2D rectangle packing to 3D building positioning by treating
 * the (x, z) ground plane as the 2D canvas and the y axis as building
 * height (encoded separately from layout, via BuildingData.height = f(LOC)).
 *
 * Why squarified over slice-and-dice:
 *   - Slice-and-dice produces thin strip rectangles that look like stacked
 *     pancakes at 3D camera angles, hard to read as a city.
 *   - Squarified targets aspect ratio close to 1:1 per rectangle, so each
 *     building footprint reads as a plot of land instead of a sliver.
 *   - Predictable layout, deterministic, same input = same output (verified
 *     by useCityData memo strategy).
 *
 * Determinism: input TreemapNode children are sorted by descending weight
 * before layout. Same input tree always yields same output positions. Hera
 * Wave 2 relies on this for stable PM overlay positioning across renders.
 *
 * Compliance: anti-pattern Lock 4 (no silent assume). Algorithm reference +
 * decision rationale recorded in `_meta/decisions/iris_treemap_algo.md`.
 */

import type {
  BuildingArchetype,
  BuildingData,
  DistrictData,
  TreemapNode,
  TreemapResult,
  WindowTint,
} from './types';
import { deriveOwnerColor } from './ownership';

/**
 * Building height encoding from leaf weight (LOC). Non-linear scaling per PRD
 * Section 13.1 + idea-draft H.2 line 422: file > 500 LOC reaches
 * "NYC/Dubai-tier verticality" via polynomial boost. Returns height in world
 * units, clamped to [4, 80] so no building dwarfs landmarks completely or
 * becomes a flat tile.
 *
 * Wave-Fixing #3 final (Manager FINAL skyscraper verticality fix STAMP
 * 20260513-0551): Ghaisan QA Day 2 05:51 WIB flagged "skyscraper height
 * per LOC NOT implemented". Investigation showed encodeHeight was correct
 * but cap 60 capped the LOC>500 outliers too aggressively. Bumped cap to 80
 * + boost polynomial exponent from 0.55 to 0.68 + boost multiplier from 0.8
 * to 1.15 so weight=540 (Athena landmark) yields ~32 unit, weight=900 yields
 * ~62 unit, comfortably above the typical 4-15 unit baseline.
 */
export function encodeHeight(weight: number): number {
  // Base linear scaling for typical files (< 200 LOC)
  if (weight <= 0) return 4;
  const linearPart = Math.min(weight, 200) * 0.05; // 200 LOC -> 10 units
  // Polynomial boost for big files (> 200 LOC) reaching skyscraper tier per
  // idea-draft H.2 line 422 LOC > 500 LOCKED skyscraper tier.
  const boostInput = Math.max(0, weight - 200);
  const boost = Math.pow(boostInput, 0.68) * 1.15;
  const raw = 4 + linearPart + boost;
  return Math.min(80, raw);
}

/**
 * Activity-driven window pattern tint. Above the warm/cold threshold the
 * building reads as an actively edited file, below it reads as idle.
 * Threshold tuned for the 200-300 building mock: ~30% buildings should
 * register warm, ~70% cold, so the city has a clear "hot zones" pattern.
 */
export function deriveWindowTint(activity: number): WindowTint {
  return activity >= 0.45 ? 'warm' : 'cold';
}

/**
 * Manager FINAL Cycle 2 (STAMP 20260513-0857): floor count derivation from
 * weight (mock proxy for git commit count). In Wave 1 the commits endpoint
 * is not yet wired so we approximate floor count from file weight (LOC):
 * the larger the file, the more commits it tends to have, the more floors.
 *
 * Formula: floors = clamp(round(weight / FLOOR_WEIGHT_PER), 1, 50).
 * FLOOR_WEIGHT_PER = 35 yields:
 *   weight 60 -> 2 floors (small util)
 *   weight 200 -> 6 floors (typical file)
 *   weight 500 -> 14 floors (large file)
 *   weight 900 -> 26 floors (skyscraper)
 *
 * Wave 2 worker Persephone calls the Demeter commits-per-building endpoint
 * to override this with real commit count for production mode. Floor count
 * drives per-floor geometry stacking visual + per-floor hover index.
 */
const FLOOR_WEIGHT_PER = 35;
const FLOOR_MAX = 50;

export function encodeFloors(weight: number): number {
  if (weight <= 0) return 1;
  const raw = Math.round(weight / FLOOR_WEIGHT_PER);
  return Math.max(1, Math.min(FLOOR_MAX, raw));
}

/**
 * Default archetype assignment for a leaf node without an explicit archetype
 * hint. Heuristic only used in mock Wave 1 data generation; real-mode Wave 3
 * derives from file role analysis (Demeter event store).
 */
export function defaultArchetype(weight: number): BuildingArchetype {
  if (weight > 800) return 'generic-warehouse';
  if (weight > 250) return 'generic-office';
  return 'generic-residence';
}

/**
 * Total weight of a treemap node, recursive sum of children weights.
 * Leaf nodes return their own weight (default 100 if unset).
 */
function totalWeight(node: TreemapNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, c) => sum + totalWeight(c), 0);
  }
  return node.weight ?? 100;
}

/**
 * Sort children descending by weight + return shallow copy. Squarified algo
 * relies on this ordering for the aspect-ratio greedy choice. Determinism
 * tie-break: equal weight sorted by id ascending so same input tree always
 * yields same layout.
 */
function sortedChildren(node: TreemapNode): TreemapNode[] {
  const kids = (node.children ?? []).slice();
  kids.sort((a, b) => {
    const wa = totalWeight(a);
    const wb = totalWeight(b);
    if (wb !== wa) return wb - wa;
    return a.id.localeCompare(b.id);
  });
  return kids;
}

/**
 * Internal rectangle in the (x, z) ground plane. Used by the squarified
 * algorithm as the placement surface that shrinks as rows are laid out.
 */
interface Rect {
  x: number;
  z: number;
  width: number;
  depth: number;
}

/**
 * Worst aspect ratio of a row of rectangles given a fixed short-edge length.
 * Used by squarified algo as the cost function to decide whether to add the
 * next item to the current row or close the row and start a new one.
 *
 * Per Bruls et al, the worst aspect ratio is max(w^2 * smax / s^2,
 * s^2 / (w^2 * smin)), where w is the short-edge length and s is the area.
 */
function worstRatio(areas: number[], shortEdge: number): number {
  if (areas.length === 0) return Number.POSITIVE_INFINITY;
  const sum = areas.reduce((a, b) => a + b, 0);
  const smax = Math.max(...areas);
  const smin = Math.min(...areas);
  const w2 = shortEdge * shortEdge;
  const s2 = sum * sum;
  return Math.max((w2 * smax) / s2, s2 / (w2 * smin));
}

/**
 * Lay out a row of areas along the short edge of the remaining rectangle.
 * Returns the laid-out positions + the updated remaining rectangle.
 * Internal helper for squarified pass.
 */
function layoutRow(
  row: number[],
  rect: Rect
): { boxes: Rect[]; remaining: Rect } {
  const total = row.reduce((a, b) => a + b, 0);
  const useWidthAsShort = rect.width <= rect.depth;
  const shortEdge = useWidthAsShort ? rect.width : rect.depth;
  const rowDepth = total / shortEdge;

  const boxes: Rect[] = [];
  let cursor = 0;
  for (const area of row) {
    const len = area / rowDepth;
    if (useWidthAsShort) {
      boxes.push({
        x: rect.x + cursor,
        z: rect.z,
        width: len,
        depth: rowDepth,
      });
      cursor += len;
    } else {
      boxes.push({
        x: rect.x,
        z: rect.z + cursor,
        width: rowDepth,
        depth: len,
      });
      cursor += len;
    }
  }

  const remaining: Rect = useWidthAsShort
    ? {
        x: rect.x,
        z: rect.z + rowDepth,
        width: rect.width,
        depth: rect.depth - rowDepth,
      }
    : {
        x: rect.x + rowDepth,
        z: rect.z,
        width: rect.width - rowDepth,
        depth: rect.depth,
      };

  return { boxes, remaining };
}

/**
 * Core squarified pass. Given a list of area weights and a containing
 * rectangle, returns the placed rectangles in input order.
 */
function squarify(areas: number[], rect: Rect): Rect[] {
  const placed: Rect[] = [];
  let remaining = { ...rect };
  let row: number[] = [];
  let queue = areas.slice();

  while (queue.length > 0) {
    const next = queue[0];
    const shortEdge = Math.min(remaining.width, remaining.depth);
    const currentRatio =
      row.length === 0 ? Number.POSITIVE_INFINITY : worstRatio(row, shortEdge);
    const trialRatio = worstRatio([...row, next], shortEdge);

    if (row.length === 0 || trialRatio <= currentRatio) {
      // Add to current row
      row.push(next);
      queue = queue.slice(1);
    } else {
      // Close the row, place it, start fresh
      const { boxes, remaining: rest } = layoutRow(row, remaining);
      placed.push(...boxes);
      remaining = rest;
      row = [];
    }
  }

  if (row.length > 0) {
    const { boxes } = layoutRow(row, remaining);
    placed.push(...boxes);
  }

  return placed;
}

/**
 * Constants for building footprint mapping. Treemap rectangle area is in
 * "ground units squared", we shrink each footprint by an inset gap so
 * neighboring buildings have a visible street between them (visual + Hera
 * Wave 2 PR-to-Building animation needs walkable space).
 *
 * Wave-Fixing #3 final (Manager FINAL spacing fix STAMP 20260513-0551):
 * STREET_GAP bumped from 0.8 to 2.6 per Ghaisan QA Day 2 05:51 WIB feedback
 * "building spacing dempetan, no breathing room". 2.6 = roughly one
 * generic-residence footprint width (~2.4-3.0 unit typical), so neighboring
 * buildings carry visible ~2 building-width breathing room. MIN_FOOTPRINT
 * also bumped to 2.6 so tight cells get pushed apart to a viable minimum
 * rather than collapsing to a single line.
 */
// Manager FINAL Cycle 2 (STAMP 20260513-0857): bump street gap 3.6 to 5.2
// + MIN_FOOTPRINT 2.4 to 3.4 per Ghaisan eyestrain caps lock feedback
// "spacing antar kota lebih lebar (3-5 unit district padding, 2-3 unit
// building gap)". Combined with canvas expansion 320 to 360 produces ~3-4
// building-width breathing room per neighbor at typical 6-8 unit rectangles.
const STREET_GAP = 5.2;
const MIN_FOOTPRINT = 3.4;

/**
 * Recursive treemap layout pass. Walks the tree, laying out children inside
 * the parent's rectangle, recurses into folder children, emits a building
 * for each leaf. Returns flat building list + district list + centroid.
 */
function layoutNode(
  node: TreemapNode,
  rect: Rect,
  depth: number,
  outBuildings: BuildingData[],
  outDistricts: DistrictData[]
): void {
  const kids = sortedChildren(node);
  const isFolder = kids.length > 0;

  if (isFolder) {
    // Record this folder as a district
    outDistricts.push({
      id: node.id,
      label: node.label,
      bounds: [rect.x, rect.z, rect.x + rect.width, rect.z + rect.depth],
      owner: node.owner,
      ownerColor: deriveOwnerColor(node.owner),
      treemapDepth: depth,
    });

    const areas = kids.map((k) => {
      const w = totalWeight(k);
      return (w * rect.width * rect.depth) / totalWeight(node);
    });
    const placed = squarify(areas, rect);

    for (let i = 0; i < kids.length; i++) {
      layoutNode(kids[i], placed[i], depth + 1, outBuildings, outDistricts);
    }
  } else {
    // Leaf: emit a building, shrink footprint by street gap
    const w = node.weight ?? 100;
    const footprintWidth = Math.max(MIN_FOOTPRINT, rect.width - STREET_GAP);
    const footprintDepth = Math.max(MIN_FOOTPRINT, rect.depth - STREET_GAP);
    const cx = rect.x + rect.width / 2;
    const cz = rect.z + rect.depth / 2;
    const archetype = node.archetype ?? defaultArchetype(w);
    const activity = node.activity ?? 0.3;

    outBuildings.push({
      id: node.id,
      label: node.label,
      archetype,
      landmark: node.landmark,
      district: findDistrictId(node.id),
      position: [cx, 0, cz],
      height: encodeHeight(w),
      width: footprintWidth,
      depth: footprintDepth,
      ownershipColor: deriveOwnerColor(node.owner),
      activity,
      windowTint: deriveWindowTint(activity),
      floors: encodeFloors(w),
    });
  }
}

/**
 * Helper: extract the district id (parent folder) from a leaf id. Mock Wave
 * 1 convention: leaf id is "<district>/<file>", district id is the parent
 * folder path. If no slash, the leaf has no district (root file), so we
 * return an empty string as a sentinel.
 */
function findDistrictId(leafId: string): string {
  const lastSlash = leafId.lastIndexOf('/');
  return lastSlash === -1 ? '' : leafId.slice(0, lastSlash);
}

/**
 * Compute the (x, z) centroid of a building list. Returns [x, 0, z] so the
 * y axis stays grounded (OrbitControls target frames the city floor).
 * Empty input returns origin.
 */
function computeCentroid(
  buildings: BuildingData[]
): [number, number, number] {
  if (buildings.length === 0) return [0, 0, 0];
  let sumX = 0;
  let sumZ = 0;
  for (const b of buildings) {
    sumX += b.position[0];
    sumZ += b.position[2];
  }
  return [sumX / buildings.length, 0, sumZ / buildings.length];
}

/**
 * Public entry: lay out a treemap tree into building + district data.
 * Returns deterministic positions; same input tree = same output positions.
 *
 * Default canvas size 200 x 200 world units fits a 300-building city
 * comfortably with the OrbitControls default camera at [0, 50, 80].
 */
export function squarifyTreemap(
  root: TreemapNode,
  canvasWidth = 200,
  canvasDepth = 200
): TreemapResult {
  const buildings: BuildingData[] = [];
  const districts: DistrictData[] = [];
  const rootRect: Rect = {
    x: -canvasWidth / 2,
    z: -canvasDepth / 2,
    width: canvasWidth,
    depth: canvasDepth,
  };
  layoutNode(root, rootRect, 0, buildings, districts);
  const centroid = computeCentroid(buildings);
  return { buildings, districts, centroid };
}
