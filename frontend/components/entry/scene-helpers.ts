// Hestia Wave 1: deterministic PRNG for the MiniCity + EmptyLot SVG scenes
// behind the two casement windows on the Entry page. mulberry32 keeps the
// procedural skyline stable across renders so the city is not reshuffled on
// every Tweak change.
//
// Reference:
//   _meta/designer/prompt2-entry/handoff-bundle-extracted/
//     applicationentry-refactory/project/city-scenes.jsx lines 10-20

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function tick(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
