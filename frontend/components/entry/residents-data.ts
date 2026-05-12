// Hestia Wave 1: 5 resident persona roster for the Entry page footer.
//
// Note on Revision 1 (remove all pets):
// The Hermes floating creature on the page (HermesBlob + useHermes flee
// behavior) is removed entry-wide. The 5 resident persona cards in the
// footer, however, are introductions to the AI colleagues the visitor will
// meet inside the city. They are content, not creature ornaments, and stay
// intact. The "onSill" flag that previously paired Hermes the persona with
// the floating Hermes creature is removed too, so Hermes reads as a peer of
// the other four rather than an aside.
//
// Reference:
//   bundle file _meta/designer/prompt2-entry/handoff-bundle-extracted/
//     applicationentry-refactory/project/entry-app.jsx lines 407-413
//   PRD Section 10 (LOCKED resident roster)

export type ResidentGlyphKind = "hall" | "cross" | "eye" | "book" | "info";

export interface Resident {
  name: string;
  role: string;
  home: string;
  bio: string;
  glyph: ResidentGlyphKind;
}

export const RESIDENTS: ReadonlyArray<Resident> = [
  {
    name: "Athena",
    role: "the architect",
    home: "City Hall",
    bio: "Drafts the floor plan. Holds the load-bearing walls in her head.",
    glyph: "hall",
  },
  {
    name: "Apollo",
    role: "the doctor",
    home: "Hospital",
    bio: "Reads stack traces like x-rays. Knows where it hurts.",
    glyph: "cross",
  },
  {
    name: "Argus",
    role: "the watcher",
    home: "Police Station",
    bio: "A hundred eyes on every diff. Sleeps in shifts.",
    glyph: "eye",
  },
  {
    name: "Clio",
    role: "the historian",
    home: "Library",
    bio: "Keeps every commit on her shelves. Will find the one from June.",
    glyph: "book",
  },
  {
    name: "Hermes",
    role: "the guide",
    home: "Tourist Info booth",
    bio: "Meets you at the door. Points the way in.",
    glyph: "info",
  },
];
