/**
 * Resident presentation metadata: landmark, palette, role label, voice tagline.
 *
 * Authored by Persephone (Wave 2). Values sourced from PRD Section 10 + Iris
 * landmark assignment + Daedalus Tailwind palette `codeplex-{resident}` tokens.
 *
 * This file is presentation-only; it lives in `@/lib/chat` because the chat
 * panel + ticket panel + side panel all need the same metadata to render
 * resident avatars + role labels.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 7 (Greek naming): 5 LOCKED runtime residents Athena/Apollo/Argus/Clio/Hermes.
 */

import type { ResidentId } from './types';

export interface ResidentMeta {
  id: ResidentId;
  /** Display name (matches id but typed clearly). */
  displayName: string;
  /** Landmark building per PRD Section 10. */
  landmark: 'City Hall' | 'Hospital' | 'Police Station' | 'Library' | 'Tourist Info';
  /** Role tagline rendered under display name. */
  role: 'The Architect' | 'The Doctor' | 'The Watcher' | 'The Historian' | 'The Guide';
  /** One-line voice persona anchor per PRD Section 10. */
  voiceTagline: string;
  /** Tailwind text color class for resident accent. */
  textClass: string;
  /** Tailwind background color class for resident accent. */
  bgClass: string;
  /** Tailwind border color class for resident accent. */
  borderClass: string;
  /** Glassmorphism accent variant key. */
  accentKey: 'athena' | 'apollo' | 'argus' | 'clio' | 'hermes';
  /** DeepSeek model + mode per PRD Section 18.3 LOCKED. */
  modelMode:
    | 'V4-Pro-think-high'
    | 'V4-Flash-non-think'
    | 'V4-Flash-think-low';
  /** Avatar shape geometry hint (rendered SVG-side per ResidentAvatar component). */
  avatarShape: 'temple' | 'cross' | 'tower' | 'stack' | 'beacon';
  /** Single-character glyph fallback when SVG fails. */
  glyph: 'A' | 'P' | 'G' | 'C' | 'H';
}

/**
 * Resident metadata table. Order matches Iris landmark order in mockCityData
 * (Athena first per City Hall convention).
 */
export const RESIDENT_META: Record<ResidentId, ResidentMeta> = {
  Athena: {
    id: 'Athena',
    displayName: 'Athena',
    landmark: 'City Hall',
    role: 'The Architect',
    voiceTagline:
      'Thoughtful refactor proposals grounded in dependency analysis.',
    textClass: 'text-codeplex-athena',
    bgClass: 'bg-codeplex-athena/10',
    borderClass: 'border-codeplex-athena/40',
    accentKey: 'athena',
    modelMode: 'V4-Pro-think-high',
    avatarShape: 'temple',
    glyph: 'A',
  },
  Apollo: {
    id: 'Apollo',
    displayName: 'Apollo',
    landmark: 'Hospital',
    role: 'The Doctor',
    voiceTagline:
      'Health diagnostics with evidence chain, no fabrication.',
    textClass: 'text-codeplex-apollo',
    bgClass: 'bg-codeplex-apollo/10',
    borderClass: 'border-codeplex-apollo/40',
    accentKey: 'apollo',
    modelMode: 'V4-Flash-non-think',
    avatarShape: 'cross',
    glyph: 'P',
  },
  Argus: {
    id: 'Argus',
    displayName: 'Argus',
    landmark: 'Police Station',
    role: 'The Watcher',
    voiceTagline:
      'Security CVSS scoring, exploit pattern, mitigation evidence.',
    textClass: 'text-codeplex-argus',
    bgClass: 'bg-codeplex-argus/10',
    borderClass: 'border-codeplex-argus/40',
    accentKey: 'argus',
    modelMode: 'V4-Flash-think-low',
    avatarShape: 'tower',
    glyph: 'G',
  },
  Clio: {
    id: 'Clio',
    displayName: 'Clio',
    landmark: 'Library',
    role: 'The Historian',
    voiceTagline:
      'Git archaeology and spec-drift narration from metadata.',
    textClass: 'text-codeplex-clio',
    bgClass: 'bg-codeplex-clio/10',
    borderClass: 'border-codeplex-clio/40',
    accentKey: 'clio',
    modelMode: 'V4-Flash-non-think',
    avatarShape: 'stack',
    glyph: 'C',
  },
  Hermes: {
    id: 'Hermes',
    displayName: 'Hermes',
    landmark: 'Tourist Info',
    role: 'The Guide',
    voiceTagline:
      'Bilingual codebase tour, welcoming onboarding cadence.',
    textClass: 'text-codeplex-hermes',
    bgClass: 'bg-codeplex-hermes/10',
    borderClass: 'border-codeplex-hermes/40',
    accentKey: 'hermes',
    modelMode: 'V4-Flash-non-think',
    avatarShape: 'beacon',
    glyph: 'H',
  },
};

/**
 * Ordered list per landmark layout (Iris mockCityData landmark order).
 */
export const RESIDENT_ORDER: readonly ResidentId[] = [
  'Athena',
  'Apollo',
  'Argus',
  'Clio',
  'Hermes',
] as const;

/**
 * Map ChatTarget to display label for the broadcast toggle UI.
 */
export function targetDisplayLabel(target: 'Athena' | 'Apollo' | 'Argus' | 'Clio' | 'Hermes' | 'broadcast'): string {
  if (target === 'broadcast') return 'All 5 residents';
  return RESIDENT_META[target].displayName;
}
