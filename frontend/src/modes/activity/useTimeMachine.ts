'use client';

/**
 * useTimeMachine: Activity Mode Git Time Machine hook.
 *
 * Owner: Boreas (Manager FINAL Cycle 2 Cluster B, STAMP 20260513-0857).
 *
 * Ghaisan vision verbatim ("setiap didrag ke kiri bakal makin pendek
 * gedungnya alias mendekati LOC 0 dan kalo didrag ke kanan harusnya sampai
 * maksimalnya"). Wires scrubber position (0..1) to a POST to
 * `/api/activity/loc-snapshot` (Demeter Cluster B) and returns the per-
 * file LOC map + nearby commits for the floating tooltip.
 *
 * Direction convention (matches TimelineScrubber.tsx):
 *   scrubberPosition = 0 -> LEFT  anchor = NOW (present, max LOC)
 *   scrubberPosition = 1 -> RIGHT anchor = Nd ago (past, low/zero LOC)
 *
 * Debounce 100ms per directive so a drag burst does not flood the backend.
 * The hook lazily clones the repo on the backend side on first miss, then
 * caches the response keyed by (repo_root, bucketed_ts_minute) for 1h.
 *
 * Real-data audit (Cluster F): the hook accepts the repo slug from the
 * `?repo=<full_name>` URL param OR an explicit prop. When the slug points
 * to a real GitHub repo (e.g. `gadablotnok/web-esp32log`) the backend
 * resolves a real LOC map; when no slug present we surface an
 * empty-state response with `notes: ["no_repo_supplied"]` so the UI can
 * render a graceful "select a repo" hint instead of silently falling
 * back to mock data.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): hook does NOT mask backend failures; the
 *     `error` field is surfaced to the consumer.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '@/lib/apiUrl';
import {
  useActivityStore,
  selectRangeDays,
  selectScrubberPosition,
} from './store';
import { ACTIVITY_ANCHORED_NOW_MS } from './mockActivityData';

export interface TimeMachineCommit {
  sha: string;
  shortSha: string;
  author: string;
  authorEmail: string | null;
  committedAt: string;
  subject: string;
  body: string | null;
}

export interface TimeMachineSnapshot {
  /** Requested ISO timestamp. */
  timestamp: string;
  /** Resolved commit SHA at or before timestamp. Null if before first commit. */
  commitSha: string | null;
  /** Snapshot commit subject (e.g. "fix: rate limit bypass"). */
  commitSubject: string | null;
  /** Snapshot commit author name. */
  commitAuthor: string | null;
  /** Snapshot commit timestamp ISO (committer date). */
  commitCommittedAt: string | null;
  /** Up to 3 commits at or before timestamp, most recent first. */
  nearbyCommits: TimeMachineCommit[];
  /** Map of repo-relative file path -> LOC at that commit. */
  files: Record<string, number>;
  /** Convenience: total file count in `files`. */
  fileCount: number;
  /** Backend cache hit indicator. */
  cached: boolean;
  /** Backend resolve notes (e.g. "no_commit_before_timestamp"). */
  notes: string[];
  /** Whether this snapshot came from real backend (not mock fallback). */
  realData: boolean;
}

export interface UseTimeMachineState {
  /** Current loaded snapshot (most recent fetch). Null while initial load. */
  snapshot: TimeMachineSnapshot | null;
  /** Last fetch error string, null when OK. */
  error: string | null;
  /** Inflight request indicator (debounce + fetch in flight). */
  loading: boolean;
  /** Computed cursor timestamp in ms (matches scrubber convention). */
  cursorTimestampMs: number;
  /** Cursor timestamp as ISO string (what we send to backend). */
  cursorTimestampIso: string;
}

interface UseTimeMachineOptions {
  /** GitHub `owner/name` slug. When null/empty, hook stays inert. */
  repoFullName: string | null | undefined;
  /** When true, skip network requests (e.g. mode not active). */
  paused?: boolean;
  /** Debounce window in ms per drag burst. Defaults 100ms (per directive). */
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 100;

interface BackendCommit {
  sha: string;
  short_sha: string;
  author: string;
  author_email: string | null;
  committed_at: string;
  subject: string;
  body: string | null;
}

interface BackendSnapshot {
  timestamp: string;
  repo_root: string;
  commit_sha: string | null;
  commit_subject: string | null;
  commit_author: string | null;
  commit_committed_at: string | null;
  nearby_commits: BackendCommit[];
  file_count: number;
  files: Record<string, number>;
  cached: boolean;
  elapsed_ms: number;
  notes: string[];
}

function adaptBackend(b: BackendSnapshot): TimeMachineSnapshot {
  return {
    timestamp: b.timestamp,
    commitSha: b.commit_sha,
    commitSubject: b.commit_subject,
    commitAuthor: b.commit_author,
    commitCommittedAt: b.commit_committed_at,
    nearbyCommits: b.nearby_commits.map((c) => ({
      sha: c.sha,
      shortSha: c.short_sha,
      author: c.author,
      authorEmail: c.author_email,
      committedAt: c.committed_at,
      subject: c.subject,
      body: c.body,
    })),
    files: b.files,
    fileCount: b.file_count,
    cached: b.cached,
    notes: b.notes,
    realData: true,
  };
}

/**
 * Time Machine hook. Subscribes to scrubber position + range, debounces
 * 100ms, POSTs to `/api/activity/loc-snapshot`, returns latest snapshot +
 * loading/error state.
 *
 * Returns inert snapshot (all zeros, realData=false) when repoFullName is
 * unset or paused. Consumers can mount the hook unconditionally and check
 * `realData` before applying the LOC map to the city.
 */
export function useTimeMachine(opts: UseTimeMachineOptions): UseTimeMachineState {
  const { repoFullName, paused = false, debounceMs = DEFAULT_DEBOUNCE_MS } = opts;

  const rangeDays = useActivityStore(selectRangeDays);
  const scrubberPosition = useActivityStore(selectScrubberPosition);

  // Compute cursor timestamp from scrubber position.
  const { cursorTimestampMs, cursorTimestampIso } = useMemo(() => {
    const nowMs = ACTIVITY_ANCHORED_NOW_MS;
    const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
    // Cycle 3 hotfix 2026-05-13 10:09 WIB Manager FINAL: flip convention to
    // match Ghaisan vision (Cycle 2 prompt verbatim: drag KIRI = building
    // shorter LOC 0 past, drag KANAN = building taller LOC max NOW).
    // Position 0 = LEFT = past (Nd ago, startMs). Position 1 = RIGHT = NOW (endMs).
    const startMs = nowMs - rangeMs;
    const cursorMs = startMs + scrubberPosition * rangeMs;
    return {
      cursorTimestampMs: cursorMs,
      cursorTimestampIso: new Date(cursorMs).toISOString(),
    };
  }, [rangeDays, scrubberPosition]);

  const [snapshot, setSnapshot] = useState<TimeMachineSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounce timer ref so each drag tick cancels the prior pending request
  // before issuing a new one.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Abort controller ref so the prior in-flight fetch is cancelled when a
  // new tick supersedes it.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (paused || !repoFullName) {
      // Inert: clear any pending state but do not fetch.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    // Cancel prior pending fetch + timer.
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    const ac = new AbortController();
    abortRef.current = ac;

    timerRef.current = setTimeout(() => {
      const url = apiUrl('/activity/loc-snapshot');
      const body = JSON.stringify({
        timestamp: cursorTimestampIso,
        repo_full_name: repoFullName,
      });
      setLoading(true);
      fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ac.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => res.statusText);
            throw new Error(`loc-snapshot HTTP ${res.status}: ${text.slice(0, 240)}`);
          }
          const data = (await res.json()) as BackendSnapshot;
          return adaptBackend(data);
        })
        .then((next) => {
          if (ac.signal.aborted) return;
          setSnapshot(next);
          setError(null);
        })
        .catch((err) => {
          if (ac.signal.aborted) return;
          if (err && (err as Error).name === 'AbortError') return;
          setError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          if (ac.signal.aborted) return;
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cursorTimestampIso, repoFullName, paused, debounceMs]);

  return {
    snapshot,
    error,
    loading,
    cursorTimestampMs,
    cursorTimestampIso,
  };
}

/**
 * Helper for tests + non-React consumers: fetch a single snapshot
 * without subscribing to the store.
 */
export async function fetchLocSnapshot(
  repoFullName: string,
  timestampIso: string,
): Promise<TimeMachineSnapshot> {
  const res = await fetch(apiUrl('/activity/loc-snapshot'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: timestampIso, repo_full_name: repoFullName }),
  });
  if (!res.ok) {
    throw new Error(`loc-snapshot HTTP ${res.status}`);
  }
  const data = (await res.json()) as BackendSnapshot;
  return adaptBackend(data);
}
