import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { RepoPickerStep } from "../../../components/entry/RepoPickerStep";

// Hestia Wave-Fixing cycle 1 (E-3 HIGH rescue):
//
// Post-OAuth landing page that renders the repository picker. The backend
// callback (app/api/auth/github/callback) was patched in this same cycle to
// redirect here instead of jumping straight to /city, so the user can choose
// which repository to inspect (or fall back to a demo dataset).
//
// Server Component shell + client picker child. RepoPickerStep handles fetch
// to /api/repos/list, list rendering, demo dataset fallback, and final
// navigation into /city with selected repo as query.

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
  title: "Pick a repository . Codeplex Chronicle",
  description:
    "OAuth complete. Pick a repository to render as a city, or fall back to a demo dataset.",
};

export default function PickRepoPage() {
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
      <RepoPickerStep />
    </div>
  );
}
