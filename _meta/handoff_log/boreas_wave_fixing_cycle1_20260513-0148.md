---
actual_timestamp: 2026-05-13T01:48+07:00
agent: Boreas
identity: rescue / Wave-Fixing cycle 1
scope_bugs: [C-8]
verdict_per_bug:
  C-8: FIXED
code_files_touched:
  - frontend/src/modes/activity/TimelineScrubber.tsx
deferred_reasons: none
---

# Boreas Wave-Fixing Cycle 1 Handoff

## Identity context

Rescue identity dispatched by Manager Wave-Fixing untuk Cluster 6a (Activity Mode timeline cursor inversion). Reflection casual, English code.

## Cluster 6a: Activity Timeline Cursor Inversion (C-8 HIGH)

### Bug report

Hafiz Bug #3 / QA Day 2: Activity timeline scrubber direction ambiguous. State pre-fix:
- Slider position 0 (max KIRI) mapped ke `startMs` (Now - 90d), labeled raw ISO date `2026-02-12` style.
- Slider position 1 (max KANAN) mapped ke `endMs` (Now), labeled raw ISO date `2026-05-13`.
- No semantic "Now" / "Nd ago" anchor wording.
- Direction implicit chronological forward (left=past, right=present), tapi tanpa label arah dan tanpa intermediate tick = user (Hafiz) struggling baca scrubber.

### Manager preference (LOCKED)

- LEFT anchor = "Now" (0d, latest, present).
- RIGHT anchor = "90d ago" / "60d ago" / "30d ago" tergantung range active (farthest past).
- Convention: drag right = scrub backward into past.
- Explicit semantic labels (besar + uppercase + tracked) + intermediate tick markers (30d / 60d midpoints).

### Root cause

`frontend/src/modes/activity/TimelineScrubber.tsx`:
- Line 68 (pre-fix): `cursorTimestampMs = startMs + scrubberPosition * rangeMs` = position=0 maps to past start, position=1 maps to present end. Manager wants inverse.
- Line 167 (pre-fix): marker ratio `(marker.timestamp - startMs) / rangeMs` = older event left, newer event right. Must flip.
- Bottom row labels = raw `formatDate(startMs)` / `formatDate(endMs)` tanpa semantic anchor copy.

### Fix applied

Single file edit. Three changes:

1. **Cursor timestamp inversion** (line 75-78):
   ```ts
   const cursorTimestampMs = endMs - scrubberPosition * rangeMs;
   ```
   scrubberPosition 0 = endMs (Now, kiri). scrubberPosition 1 = startMs (Nd ago, kanan).

2. **Event marker ratio flipped** (line 199):
   ```ts
   const ratio = (endMs - marker.timestamp) / rangeMs;
   ```
   Older events render rightward, newer events render leftward. Konsisten dengan anchor convention.

3. **Semantic anchor labels + intermediate ticks** (line 241-275):
   - Left anchor "Now" big uppercase + small ISO date sub.
   - Right anchor "{rangeDays}d ago" big uppercase + small ISO date sub.
   - Intermediate tick marks (vertical white lines) di rail position 30d=10/20, 60d=30, 90d=30/60.
   - Tick labels under axis "10d" / "20d" / "30d" / "60d" smaller weight.
   - Cursor readout center, ember accent (preserved).

4. **Header docstring updated** (line 18-23): explicit direction convention block dengan mapping formula + drag-right semantic.

### Visual verification (intent description, no Playwright run)

- Slider thumb posisi default `scrubberPosition = 0` => thumb di kiri => di bawah label "Now" => cursor readout = endMs ISO.
- User drag thumb ke kanan setengah jalan => thumb di tengah => cursor readout mundur 15d (untuk 30d range) => intermediate tick "20d" + "10d" visible flanking.
- User drag thumb ke kanan maksimum => thumb di bawah label "30d ago" / "60d ago" / "90d ago" => cursor readout = startMs ISO.
- Event marker dots (commit / PR / release) tetap rendered di rail, tapi older events now appear rightward.

### Compliance check

- **Lock 1** (no scaffold mutation): clean. Single file edit, no architecture shift.
- **Lock 2** (no scope drift): clean. Only C-8 inversion + label, no tangential refactor.
- **Lock 5** (honest mock label): clean. `mockActivityData.ts` MOCK label tidak diubah.
- **TypeScript**: zero errors in `TimelineScrubber.tsx`. Existing pre-existing errors in unrelated `src/scene/Canvas.tsx` (out-of-scope for C-8).

### Defensive observation

Cursor visual indicator (`<div>` line 219) tetap `left: ${scrubberPosition * 100}%`. Sengaja TIDAK diinvert karena cursor harus follow native input thumb position. Input thumb 0 = kiri = "Now" anchor = correct visual alignment. Time mapping di-invert melalui formula `cursorTimestampMs`, bukan via visual position. Konsisten antara visual thumb position dan semantic anchor.

## Deferred / Out-of-scope

None. C-8 fully addressed within single file edit. No ferry trigger.

## Files touched (absolute paths)

- `/Users/ghaisan/Documents/codeplexRefactory/frontend/src/modes/activity/TimelineScrubber.tsx`

## Verdict

C-8 FIXED. Activity scrubber sekarang reads "Now" (kiri) sampai "{rangeDays}d ago" (kanan) dengan intermediate tick markers + cursor readout center. Mapping inverted di formula level, visual thumb position konsisten. Single file edit, no cascading risk.

Capacity used: ~10 menit. Well under 45 min ferry threshold.
