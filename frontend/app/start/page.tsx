import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { EntryApp } from "../../components/entry/EntryApp";
import "../../components/entry/entry-keyframes.css";

// Hestia Wave 1: Application Entry page at /start.
//
// Renders the threshold experience between the cinematic Landing and the
// working application. Visitor picks one of two doors (Import a repository or
// Build from scratch) and steps into the 3D city. Five resident colleagues
// introduced in the footer, v0.3 prototype badge in the header, DeepSeek data
// residency notice above the resident strip per PRD Section 19.4.
//
// Revisions applied post bundle port:
//  1. Hermes shy creature on the sill removed entry-wide (useHermes hook,
//     HermesBlob SVG, Shyness tweak slider). The 5 resident persona cards in
//     the footer are kept intact as colleague introductions.
//  2. TWEAK_DEFAULTS.motion set to "animated-city", the most animated
//     background variant of the bundle's 3 motion options (still / breathing /
//     animated-city), so the threshold scene reads as alive on first paint.
//
// Reference contracts:
//  _meta/contracts/claude-design-bundle-to-hestia.md (input edge)
//  _meta/contracts/hestia-to-hades.md (output edge, OAuth stub Wave 3 swap)

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
  title: "Entry . Codeplex Chronicle",
  description:
    "Two doors. One opens to your codebase. The other to a blank lot. Pick one and step into the city, five AI residents are already inside.",
};

export default function StartPage() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{
        fontFamily: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
        background: "oklch(0.115 0.018 55)",
        color: "oklch(0.96 0.015 80)",
        minHeight: "100vh",
      }}
    >
      <EntryApp />
    </div>
  );
}
