# Iris Treemap Algorithm Decision

**Author**: Iris (Wave 1)
**Date**: 2026-05-12 (Wave 1 Cycle 1)
**Cross-ref**: `_meta/decision_log/iris.md` D-Iris-02, PRD AD-02, Phase B
compass_artifact research.

## Choice

Squarified treemap algorithm by Bruls, Huizing, van Wijk (2000).

Reference: Mark Bruls, Kees Huizing, Jarke J. van Wijk. "Squarified
Treemaps". Proceedings of the Joint Eurographics and IEEE TCVG Symposium on
Visualization, 2000.

PDF link (Eindhoven University): https://www.win.tue.nl/~vanwijk/stm.pdf

## Why squarified

PRD AD-02 LOCKED: "Treemap deterministic layout untuk building, NOT
force-directed". PRD does not specify which treemap variant. The 3 common
variants are:

| Variant | Aspect ratio | Determinism | 3D suitability |
|---|---|---|---|
| Slice-and-dice | Thin strip (1:N) | Deterministic | Looks like stacked pancakes at 3D camera |
| Squarified | Close to 1:1 | Deterministic | Reads as plots of land, city-like |
| Strip | Varies, depends on order | Deterministic | Mixed quality, edge cases |

Squarified is the canonical choice for treemap visualization where the
output must be readable as discrete rectangles (vs strips). At 3D camera
angles, slice-and-dice produces buildings that look like fences (long thin
rectangles), defeating the city metaphor.

## Why not adopt an existing library

Considered: `d3-hierarchy` treemap, `squarify` npm package.

Rejected because:

1. **Determinism control**: d3-hierarchy and most libs sort children by a
   sort function but DO NOT specify tie-break. Iris needs tie-break by id
   ascending for stable Hera Wave 2 overlay positioning. Writing in-tree
   lets us guarantee tie-break behavior.
2. **Dependency surface**: d3-hierarchy is ~70KB minified, has many other
   features Iris does not use. 200 LOC of in-tree algorithm is cheaper.
3. **3D adaptation**: 2D treemap libs return `{x, y, width, height}`; Iris
   needs `{x, z, width, depth}` plus emission of district bounds. Adapter
   layer between lib + Iris is the same scale as writing the algorithm.

## Algorithm details

1. **Input**: TreemapNode tree with leaf weights. Folders inherit weight
   from sum of children.
2. **Sort children**: by descending weight, tie-break by id ascending.
3. **Layout per folder**:
   - Compute proportional areas for children given the folder rectangle
     area + each child's weight share.
   - Run squarify pass: greedily add areas to a row, computing worst aspect
     ratio at each step. When adding the next area would worsen the row's
     worst aspect ratio, close the row + start fresh.
   - Layout each row along the short edge of the remaining rectangle.
4. **Recurse**: for each folder child, recurse into its rectangle with its
   children.
5. **Emit**: leaf nodes become BuildingData with position at rectangle
   center + footprint = rectangle width/depth shrunk by STREET_GAP for
   visible streets between buildings.

## Determinism guarantees

- Same input TreemapNode tree = same output BuildingData positions.
- Tested informally via `mockCityData` import: counted 240 buildings,
  verified position arrays stable across page reload.

## Trade-offs accepted

- **Floating point edge case**: deep recursion (4+ levels) could compound
  rounding error. Surfaced in uncertainty journal `iris-cycle4` U-Iris-04.
  Mock data uses 2-3 level recursion max, no observed overlap.
- **Aspect ratio not perfect 1:1**: squarified aims for close-to-1:1 but
  the actual achieved ratio depends on the child weight distribution. For
  highly imbalanced trees (one 90% file in a folder + ten 1% files), the
  big rectangle dominates and small rectangles become slivers. Mock data
  is balanced enough to avoid this.

## References cross-checked

- Bruls et al original paper (above link).
- Wikipedia "Treemapping" Squarified section: confirms algorithm pseudocode
  matches our implementation.
- d3-hierarchy source: cross-checked the worstRatio cost function.
