/**
 * Activity query interface, matches Pythia contract `boreas-to-demeter.md`.
 *
 * Owner: Boreas (Wave 2).
 *
 * This file is the canonical Wave 2 frontend representation that Wave 3
 * Demeter consumes via HTTP endpoint `/api/activity?days=X&repo=Y&district=Z`
 * per Pythia contract Section "Output schema" line 84-90.
 *
 * Re-exports the query interface for Wave 3 Demeter to align its Pydantic
 * model against. Boreas Wave 2 calls `fetchActivityData` in `./useActivityData.ts`
 * with a query; Wave 2 stub returns mock; Wave 3 swap returns real query
 * result.
 *
 * Compliance: Lock 1 clean, Lock 2 clean.
 */

export type { ActivityQuery, ActivityData } from './types';
export { fetchActivityData } from './useActivityData';
