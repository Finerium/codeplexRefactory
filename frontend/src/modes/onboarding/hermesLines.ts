/**
 * [MOCK Wave 2, real Wave 3 Triton] Hermes narration line bank.
 *
 * Owner: Boreas (Wave 2).
 * Contract: `_meta/contracts/boreas-to-triton.md` (Wave 3 Triton swap fetches
 * real DeepSeek V4-Flash non-think narration per request).
 *
 * Voice per PRD Section 10.5 (Hermes Tourist Info Guide) + Section 19.2
 * (bilingual Indonesian primary + English code-switch):
 *   - Warm, welcoming, brief.
 *   - 1-3 sentence per waypoint, ~10-20 word per sentence for 2-3s
 *     dwell legibility.
 *   - Indonesian primary + technical English code-switch ("main entry",
 *     "auth district", "owner").
 *   - Specific: cite building label + ownership + brief activity note,
 *     never generic ("Welcome to the city. Here is a building.").
 *
 * Wave 3 Triton swap: this static bank is replaced by a fetch call to
 * `/api/onboarding/narration` (Pythia contract Section "Output schema").
 * The line keys + variant + waypoint index continue to map deterministically
 * so Wave 3 cached responses align with the same waypoint sequence.
 *
 * Compliance:
 *   Lock 1: no em dash. Lock 2: no emoji. Lock 5: [MOCK Wave 2 ...] label
 *   at top per anti-pattern hard rule discipline.
 */

import type { TourVariant } from './types';

/**
 * Mock line bank keyed by `(variant, waypointIndex)`. Lookup happens in
 * `useHermesTour.ts` via fallback chain: try variant-specific line, fall back
 * to generic line, fall back to placeholder.
 */
type LineBank = Record<TourVariant, Record<number, string>>;

export const HERMES_LINES: LineBank = {
  // Generic 30-second tour: intro + 3 landmark stops + outro.
  'generic-30sec': {
    0: 'Selamat datang di Codeplex Chronicle. Gw Hermes, tour guide kota lu. 30 detik, gw kasih peta mental project.',
    1: 'Ini City Hall, rumah Athena the Architect. Backend core hidup di sini, owner @backend-team punya kontrol arsitektur. Recent commits intense.',
    2: 'Hospital, Apollo monitor kesehatan kode. Glow merah berarti ada finding kritis. Tim @platform jaga di sini.',
    3: 'Tourist Info, rumah gw sendiri. Glass cube ini onboarding district. Kalau lu butuh tour lagi, ketuk di sini.',
  },

  // Sprint-goal: 5 waypoint scoped to active sprint milestone.
  'sprint-goal': {
    0: 'Sprint goal kita: ship auth + health monitoring minggu ini. Gw tour gedung yang lagi aktif di sprint.',
    1: 'City Hall, ini main entry backend. Sprint scaffolding ada di sini, 12 commit terakhir 7 hari.',
    2: 'Auth district, Argus jaga keamanan. Security scanner sedang in review, PR open.',
    3: 'Health diagnostic, Apollo prep monitoring endpoint. 5 detector standby, kalau ada glow merah, escalate.',
    4: 'Tour selesai. Sprint goal mostly tracked. Cek ticket panel buat ownership detail.',
  },

  // Feature-scoped: drill into onboarding district.
  'feature-scoped': {
    0: 'Lu mau eksplor feature onboarding. Gw bawa lu ke 3 file kunci.',
    1: 'tour.tsx, ini glass cube. Hermes scripted di sini, owner @frontend-team.',
    2: 'welcome.tsx + checklist.tsx tetangga sebelahnya. Dependency graph clear, masuk lewat tour.tsx aman.',
  },

  // Cross-onboarding: tour buildings owned by @hafiz.
  'cross-onboarding': {
    0: 'Cross-onboarding sebagai @hafiz. Gw bawa lu ke distrik yang dia punya.',
    1: 'openspec/ district, @hafiz lead spec authoring. project.md jadi anchor untuk OpenSpec workflow.',
    2: 'docs/ district, @hafiz juga ngurusin. Pitch + handoff doc live di sini.',
  },
};

/**
 * Fallback placeholder when (variant, index) miss. Returns a generic
 * welcoming line so the overlay never renders blank.
 */
export const HERMES_FALLBACK_LINE =
  'Hermes lagi cari kata yang pas... Lanjut ke gedung berikut.';

/**
 * Lookup helper. Wave 3 useHermesTour swap can short-circuit this in favor
 * of real fetch + reuses this fallback when fetch fails.
 */
export function getHermesLine(variant: TourVariant, waypointIndex: number): string {
  const variantBank = HERMES_LINES[variant];
  if (!variantBank) return HERMES_FALLBACK_LINE;
  return variantBank[waypointIndex] ?? HERMES_FALLBACK_LINE;
}
