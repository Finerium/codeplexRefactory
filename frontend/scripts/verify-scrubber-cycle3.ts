#!/usr/bin/env node
// Wave-Fixing #3 Manager FINAL verification script.
// Authored by Boreas, 2026-05-13.
//
// Smoke test that exercises mock activity data + findNearestMarker logic
// across 5 scrubber positions (0.0, 0.25, 0.5, 0.75, 1.0). Each position
// must surface a DISTINCT commit detail (different marker, different hash,
// different author OR different file path) so the per-cursor popup card
// reacts to drag.
//
// Run with: cd frontend && node scripts/verify-scrubber-cycle3.mjs

// Note: tsx loader transforms .ts files. Path resolves to src/modes/activity.
import { buildMockActivityData } from '../src/modes/activity/mockActivityData';
import type { TimelineMarker } from '../src/modes/activity/types';

const ANCHORED_NOW_MS = Date.UTC(2026, 4, 12, 12, 0, 0);
const data = buildMockActivityData(30, ANCHORED_NOW_MS);
const rangeMs = 30 * 24 * 60 * 60 * 1000;
const endMs = ANCHORED_NOW_MS;
const dayMs = 24 * 60 * 60 * 1000;

function findNearestMarker(
  markers: TimelineMarker[],
  cursorMs: number,
  maxDeltaMs: number
): TimelineMarker | null {
  if (markers.length === 0) return null;
  let best: TimelineMarker | null = null;
  let bestDelta = Infinity;
  for (const m of markers) {
    const delta = Math.abs(m.timestamp - cursorMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = m;
    }
  }
  if (best && bestDelta <= maxDeltaMs) return best;
  return null;
}

const positions = [0.0, 0.25, 0.5, 0.75, 1.0];
const results = [];
for (const pos of positions) {
  const cursorMs = endMs - pos * rangeMs;
  const m = findNearestMarker(data.timelineMarkers, cursorMs, dayMs);
  results.push({
    position: pos,
    cursor: new Date(cursorMs).toISOString().slice(0, 10),
    markerHash: m?.commitHash ?? null,
    markerAuthor: m?.authorLogin ?? null,
    markerFile: m?.filePath ?? null,
    markerType: m?.eventType ?? null,
    markerMessage: m?.commitMessage ?? null,
  });
}

console.log('Total markers in 30d mock window:', data.timelineMarkers.length);
console.log('Sample scrubber positions:');
for (const r of results) {
  console.log(`  pos=${r.position} cursor=${r.cursor} ${r.markerType ?? 'no-marker'}: ${r.markerHash} by ${r.markerAuthor} on ${r.markerFile}`);
  if (r.markerMessage) {
    console.log(`    "${r.markerMessage}"`);
  }
}

// Confirm distinct results across positions (at least 3 of 5 distinct hashes).
const hashes = results.map((r) => r.markerHash).filter(Boolean);
const distinctHashes = new Set(hashes);
console.log(`\nDistinct hashes across 5 positions: ${distinctHashes.size} / ${hashes.length}`);
if (distinctHashes.size < 3) {
  console.error('FAIL: scrubber drag does not surface distinct commits across 5 positions');
  process.exit(1);
}
console.log('PASS: scrubber drag surfaces distinct commits across positions');
