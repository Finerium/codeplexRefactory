import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Hestia Wave-Fixing cycle 1 (E-1 CRITICAL rescue):
//
// QA round Day 2 found that clicking "Build from Scratch" returned 404 because
// the right-door target previously pointed to /blank (route did not exist).
// EntryApp.tsx has been retargeted to /city?mock_auth=true&mode=empty in this
// cycle, but the alternate URL surface /start/build-from-scratch is also kept
// as a redirect-only Server Component so:
//   - Deep links shared by reviewers/panitia resolve.
//   - The path semantically describes the intent for any external scripts.
//
// This page renders nothing client-side: Next.js App Router server-side
// `redirect()` issues a 307 to /city?mock_auth=true&mode=empty before any
// markup ships.
//
// Reference:
//   _meta/handoff_log/hestia_wave_fixing_cycle1_*.md (this cycle)
//   frontend/components/entry/EntryApp.tsx (primary right-door target)

export const metadata: Metadata = {
  title: "Build from scratch . Codeplex Chronicle",
  description: "Empty lot entry. Buildings rise in-memory.",
};

export default function BuildFromScratchPage(): never {
  redirect("/city?mock_auth=true&mode=empty");
}
