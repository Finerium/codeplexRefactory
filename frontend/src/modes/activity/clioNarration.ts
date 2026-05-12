/**
 * Clio narration fetch helper for Activity Mode sprint retro flythrough.
 *
 * Owner: Boreas (Wave-Fixing #2 Cycle 1, 2026-05-13 Day 2 03:13 WIB).
 *
 * Per PRD Section 10.4 + 9.4: Clio narrates 60-second sprint retro
 * cinematic flythrough. LLM routes V4-Flash non-thinking (resident_id=Clio
 * per `backend/app/llm/resident_routing.py`). All numbers + facts come from
 * deterministic source (mock activity data Wave 2 + Demeter event store
 * Wave 3); Clio only wraps as readable prose.
 *
 * Wire: POST /api/chat with target=Clio + mode_context carrying activity
 * window stats. Returns SSE stream that we read fully (no streaming UI for
 * retro flythrough; we render the final assembled prose in narration
 * overlay during dwell).
 *
 * Fallback chain (graceful degradation):
 *   1. Real Triton /api/chat target=Clio -> V4-Flash non-think prose.
 *   2. Canned retro stub (when 401 / 503 / circuit-break).
 *   3. Empty string (overlay handles "..." state).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 4: routing locked V4-Flash non-think.
 *   Lock 5: real DeepSeek path is real; canned stub is labeled fallback.
 */

import type { ActivityData } from './types';

/**
 * Resolve API base URL. Production K8s deploy uses same-origin (relative
 * empty string). Local dev uses :8000 backend. Allow override via
 * NEXT_PUBLIC_API_BASE for testing against production from dev frontend.
 */
function resolveApiBase(): string {
  if (typeof window === 'undefined') return '';
  const envBase = process.env.NEXT_PUBLIC_API_BASE;
  if (envBase) return envBase;
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return '';
}

/**
 * Generate canned Clio retro prose deterministically from activity data.
 * Used as fallback when backend LLM unreachable. Tone matches PRD Section
 * 10.4 Clio voice: prose narrative from deterministic source.
 */
export function buildCannedRetroProse(
  data: ActivityData,
  rangeDays: 30 | 60 | 90
): string {
  const topHotspot = [...data.hotspots].sort(
    (a, b) => b.intensity - a.intensity
  )[0];
  const topOwner = data.summary.mostActiveOwner || 'tim engineering';
  const totalCommits = data.summary.totalCommits;
  const contributors = data.summary.uniqueContributors;
  const hotspotLabel = topHotspot?.buildingId ?? 'building utama';
  return [
    `Sprint retro ${rangeDays} hari terakhir: ${totalCommits} commit dari ${contributors} kontributor.`,
    `Gedung paling aktif ${hotspotLabel} dengan ${topHotspot?.commitCount ?? 0} commit, di-lead ${topOwner}.`,
    'Kalo lu klik gedung yang glow paling intens, lu liat detail evolusi. Sprint mostly tracked.',
  ].join(' ');
}

/**
 * Fetch Clio narration prose via real `/api/chat` SSE stream. Returns the
 * fully assembled text. Falls back to canned prose on failure.
 *
 * Wave-Fixing #2 Cycle 1 verification: enables Feature #30 verdict PASS
 * via real-browser (Activity Mode 60s flythrough triggers SSE stream call
 * + /api/llm/health calls_recorded increment).
 */
export async function fetchClioRetroNarration(
  data: ActivityData,
  rangeDays: 30 | 60 | 90
): Promise<{ text: string; usedFallback: boolean }> {
  // Determine API base: same-origin in production K8s deploy, localhost:8000
  // in dev. Local dev without backend running falls through to canned prose
  // via the catch block below.
  const apiBase = resolveApiBase();

  const topHotspots = [...data.hotspots]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);

  const payload = {
    thread_id: `clio-retro-${rangeDays}d-${Date.now()}`,
    target: 'Clio' as const,
    message: `Narate prosa sprint retro untuk window ${rangeDays} hari. Total ${data.summary.totalCommits} commit, ${data.summary.uniqueContributors} kontributor. Top hotspot: ${topHotspots.map((h) => `${h.buildingId} (${h.commitCount} commits)`).join(', ')}. Tulis 2-3 kalimat, voice naratif historian, sebut angka dari konteks.`,
    context: {
      current_mode: 'activity' as const,
      selected_building_id: topHotspots[0]?.buildingId ?? null,
      mode_context: {
        rangeDays,
        totalCommits: data.summary.totalCommits,
        uniqueContributors: data.summary.uniqueContributors,
        mostActiveBuilding: data.summary.mostActiveBuilding,
        mostActiveOwner: data.summary.mostActiveOwner,
        topHotspots: topHotspots.map((h) => ({
          buildingId: h.buildingId,
          commitCount: h.commitCount,
          intensity: h.intensity,
        })),
      },
    },
  };

  try {
    const response = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok || !response.body) {
      return { text: buildCannedRetroProse(data, rangeDays), usedFallback: true };
    }

    // Read SSE stream sequentially. Collect chunk text events.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assembled = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE events terminated by `\n\n`. Split + parse each.
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const evt of events) {
        const lines = evt.split('\n');
        let eventType = 'message';
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLine = line.slice(5).trim();
          }
        }
        if (eventType === 'chunk' && dataLine) {
          try {
            const parsed = JSON.parse(dataLine) as { text?: string };
            assembled += parsed.text ?? '';
          } catch {
            // ignore malformed chunk
          }
        }
      }
    }
    assembled = assembled.trim();
    if (!assembled) {
      return { text: buildCannedRetroProse(data, rangeDays), usedFallback: true };
    }
    return { text: assembled, usedFallback: false };
  } catch (err) {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    ) {
      // eslint-disable-next-line no-console
      console.warn('[boreas] Clio retro SSE failed, using canned prose', err);
    }
    return { text: buildCannedRetroProse(data, rangeDays), usedFallback: true };
  }
}
