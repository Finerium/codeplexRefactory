import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { BlankCityWorkspace } from "../../../components/start/BlankCityWorkspace";

// Hestia Wave-Fixing #2 cycle 1 (E-5 CRITICAL rescue):
//
// QA round Day 2 reported "Application error: a client-side exception has
// occurred" after clicking "Build from scratch". Wave-Fixing cycle 1 had
// retargeted the right door at `/city?mock_auth=true&mode=empty` and added
// this route as a Server Component redirect. The downstream `/city` page is
// in Iris/Hera/Persephone domain and was either throwing in the browser or
// silently rendering the full mock city, neither of which matches PRD
// Section 7.1 line 292 spec for "Build from scratch entry option
// (in-memory virtual FS)".
//
// This cycle replaces the redirect with a real Hestia-owned workspace page
// that satisfies PRD 7.1 entirely within Hestia file ownership boundaries:
//   - Empty city render initial (one anchor light + three seed buildings).
//   - In-app text editor (textarea, monospace, no heavy editor dep).
//   - File create handler that immediately raises a new building glyph in
//     a 2D SVG skyline. Glyphs animate-grow over 1.1s from the ground.
//   - Save to localStorage for session persistence (STORAGE_KEY in
//     BlankCityWorkspace.tsx).
//   - "Save to GitHub" placeholder button labeled honest (Wave 3 follow-up,
//     Lock 5 compliance) because the backend PyGithub tree-write is Hades
//     territory.
//
// File ownership boundary discipline:
//   - This page + `components/start/BlankCityWorkspace.tsx` are pure
//     Hestia, no edit on `src/scene/*` (Iris domain) or `cityEngine.ts`.
//   - If Iris wires a true 3D `mode=empty` mount on `/city` in a later
//     cycle, the right door in EntryApp.tsx can be re-pointed without
//     changing this page.
//
// Compliance:
//   Lock 1 (no em dash): clean.
//   Lock 2 (no emoji): clean.
//   Lock 4 (honest claim): the SVG skyline is a documented 2D placeholder
//     for the future Iris 3D mode=empty mount.
//   Lock 5 (no silent scope narrow): "Save to GitHub" labeled Wave 3
//     follow-up rather than faked. Editor + virtual FS + persistence are
//     genuine and labeled accurately.

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Build from scratch . Codeplex Chronicle",
  description:
    "Empty lot entry. Buildings rise in-memory as you create files. Nothing leaves the browser.",
};

export default function BuildFromScratchPage() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{
        fontFamily:
          "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
        background: "oklch(0.115 0.018 55)",
        color: "oklch(0.96 0.015 80)",
        minHeight: "100vh",
      }}
    >
      <BlankCityWorkspace />
    </div>
  );
}
