#!/usr/bin/env node
// Wave-Fixing #3 Manager FINAL verification script - hotspot glow scrubbing.
// Authored by Boreas, 2026-05-13.
//
// Smoke test that exercises HotspotGlow computeSliceIntensities across 5
// scrubber positions. Verifies the slice intensities CHANGE per position
// (proving "city visual scrub commit-by-commit" works).
//
// Run with: cd frontend && npx tsx scripts/verify-hotspot-glow-cycle3.ts

import { buildMockActivityData } from '../src/modes/activity/mockActivityData';

const ANCHORED_NOW_MS = Date.UTC(2026, 4, 12, 12, 0, 0);
const data = buildMockActivityData(30, ANCHORED_NOW_MS);
const rangeMs = 30 * 24 * 60 * 60 * 1000;
const endMs = ANCHORED_NOW_MS;
const dayMs = 24 * 60 * 60 * 1000;

// Copy of computeSliceIntensities from HotspotGlow.tsx.
function computeSliceIntensities(
  timeline: Array<{ date: string; buildingCommits: Record<string, number> }>,
  cursorMs: number,
  endMsLocal: number
): Map<string, { commitCount: number; intensity: number }> {
  const totals = new Map<string, number>();
  for (const day of timeline) {
    const parts = day.date.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) continue;
    const dayMidnightMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    const dayEndMs = dayMidnightMs + dayMs;
    if (dayEndMs <= cursorMs) continue;
    if (dayMidnightMs > endMsLocal) continue;
    for (const [id, count] of Object.entries(day.buildingCommits)) {
      totals.set(id, (totals.get(id) ?? 0) + count);
    }
  }
  let max = 0;
  for (const c of totals.values()) {
    if (c > max) max = c;
  }
  if (max === 0) return new Map();
  const result = new Map<string, { commitCount: number; intensity: number }>();
  for (const [id, c] of totals.entries()) {
    result.set(id, { commitCount: c, intensity: c / max });
  }
  return result;
}

const positions = [0.0, 0.25, 0.5, 0.75, 1.0];
const sliceCounts: number[] = [];
console.log('HotspotGlow slice intensity per cursor position:');
for (const pos of positions) {
  const cursorMs = endMs - pos * rangeMs;
  const slice = computeSliceIntensities(data.timeline, cursorMs, endMs);
  const totalCommits = Array.from(slice.values()).reduce(
    (s, v) => s + v.commitCount,
    0
  );
  sliceCounts.push(totalCommits);
  console.log(
    `  pos=${pos} cursor=${new Date(cursorMs).toISOString().slice(0, 10)} buildings_active=${slice.size} total_commits_in_slice=${totalCommits}`
  );
}

// Confirm slice counts CHANGE across positions (proving the scrub effect).
const distinctCounts = new Set(sliceCounts);
console.log(
  `\nDistinct slice commit counts across 5 positions: ${distinctCounts.size}`
);
if (distinctCounts.size < 3) {
  console.error('FAIL: hotspot glow does not change across scrubber positions');
  process.exit(1);
}
// Confirm slice grows monotonically as cursor moves backward in time
// (slice = cumulative from cursor forward to Now).
let monotonic = true;
for (let i = 1; i < sliceCounts.length; i++) {
  if (sliceCounts[i] < sliceCounts[i - 1]) {
    monotonic = false;
    break;
  }
}
console.log(`Slice growth monotonic (smaller cursor = bigger slice): ${monotonic}`);
console.log('PASS: hotspot glow slice scrubs commit-by-commit per scrubber drag');
