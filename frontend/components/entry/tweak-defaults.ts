// Hestia Wave 1: TWEAK_DEFAULTS for the Entry page experience.
//
// Revision 1 (no pets): the bundle field "shyness" controlled the Hermes shy
// creature on the sill. Hermes creature is removed entry-wide per Ghaisan
// directive, so the shyness field is gone too. The 5 resident persona cards in
// the footer are a different concern (different file) and stay intact.
//
// Revision 2 (most animated background): bundle TweakRadio "Background motion"
// options are still | breathing | animated-city. animated-city is the most
// animated variant (adds two motion-path walkers on the sidewalk in MiniCity),
// so it is the new default. The Tweaks panel still allows manual override.
//
// Reference:
//   bundle file _meta/designer/prompt2-entry/handoff-bundle-extracted/
//     applicationentry-refactory/project/entry-app.jsx line 6-11

export type EntryMotion = "still" | "breathing" | "animated-city";

export interface EntryTweakDefaults {
  /** Ambient warmth of the room background, 0..100. */
  warmth: number;
  /** Door strength of the casement window frame + mullion, 0..100. */
  doorStrength: number;
  /** Background motion of the two SVG scenes behind the windows. */
  motion: EntryMotion;
}

export const TWEAK_DEFAULTS: EntryTweakDefaults = {
  warmth: 55,
  doorStrength: 78,
  motion: "animated-city",
};

export const MOTION_OPTIONS: ReadonlyArray<EntryMotion> = [
  "still",
  "breathing",
  "animated-city",
];
