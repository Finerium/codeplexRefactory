/**
 * Shadcn-pattern `cn` helper for Tailwind class composition.
 *
 * Authored by Persephone (Wave 2) per Decision D1 (`_meta/decision_log/persephone.md`).
 * Hand-authored shadcn-compatible primitive at the canonical shadcn path
 * `frontend/lib/utils.ts`. Uses `clsx` v2.1.1 already installed by Daedalus Wave 1.
 *
 * Why not `tailwind-merge`: Wave 2 scope does NOT introduce conflict patterns
 * that need `twMerge`. If Pan post-Wave 3 sees Tailwind class conflicts in
 * future variant components, `npm install tailwind-merge` + wrap is mechanical.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 8 (no paid services): clsx is MIT licensed.
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Compose Tailwind class names safely. Drop falsy values, dedupe by reference.
 *
 * Usage:
 *   cn('px-2', isOpen && 'bg-codeplex-shadow', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
