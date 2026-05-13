'use client';

/**
 * Manager FINAL Cycle 2 (Persephone Cluster G, STAMP 20260513-0857):
 *
 * Tour storage helper for the User Tutor onboarding flow. Persists the
 * "completed / suppressed" flag in localStorage so subsequent visits do
 * not auto-open the tour modal. Manual replay via `?tour=1` URL param or
 * the floating "?" button bypasses the flag (the user explicitly asked
 * to see the tour again).
 *
 * Manager decision D-MF2-03: localStorage flag `tutor_completed` suppress
 * auto-show after first dismiss. Auto-show first visit after OAuth + repo
 * select (which lands on `/city`).
 *
 * Failure modes:
 *   - SSR: typeof window === 'undefined' guard returns safe defaults
 *   - Privacy mode / disabled storage: try/catch swallows, returns
 *     defaults so the tour still opens once per session
 *   - Schema drift future: version field lets us invalidate old flags
 *     when we ship a new tour script
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

const STORAGE_KEY = 'codeplex_tutor_v1';

export interface TourStorageState {
  /** True if the user dismissed the tour or completed it before. */
  completed: boolean;
  /** Timestamp (ms) when the flag was set. Diagnostic only. */
  completed_at?: number;
  /** Tour script version, for future invalidation. */
  version: number;
}

const DEFAULT_STATE: TourStorageState = {
  completed: false,
  version: 1,
};

const CURRENT_VERSION = 1;

/**
 * Read the current tour storage state. SSR-safe (returns defaults).
 * If the stored value is for an older version, it is ignored (counts
 * as "never seen").
 */
export function readTourState(): TourStorageState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<TourStorageState>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
    if (parsed.version !== CURRENT_VERSION) return DEFAULT_STATE;
    return {
      completed: Boolean(parsed.completed),
      completed_at: parsed.completed_at,
      version: CURRENT_VERSION,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Mark tour as completed (user finished step 8 OR clicked
 * "Don't show again"). Subsequent visits will NOT auto-open the modal.
 */
export function markTourCompleted(): void {
  if (typeof window === 'undefined') return;
  try {
    const next: TourStorageState = {
      completed: true,
      completed_at: Date.now(),
      version: CURRENT_VERSION,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore: privacy mode or storage disabled
  }
}

/**
 * Reset the flag (used when the user explicitly clicks the "?" button
 * for a manual replay; OR the `?tour=1` URL param forces a replay).
 * Caller is expected to re-open the modal after calling this.
 */
export function resetTourState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Inspect the URL for a `?tour=1` force-trigger param. Returns true if
 * the param is present (manual replay path).
 */
export function shouldForceTour(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('tour');
    return v === '1' || v === 'true' || v === 'yes';
  } catch {
    return false;
  }
}

/**
 * Compose the auto-open decision: opens if
 *   1. URL has `?tour=1` (always force), OR
 *   2. The user has never completed the tour
 *
 * Caller (FloatingTutorButton) checks this on mount + opens the modal
 * automatically. Manual "?" click always opens regardless.
 */
export function shouldAutoOpenTour(): boolean {
  if (shouldForceTour()) return true;
  const state = readTourState();
  return !state.completed;
}
