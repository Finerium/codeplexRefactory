# Boreas Pan reactive checkpoint A1 (post-V8.1)

- Worker: Boreas (Pan reactive cluster, owner: Time Machine animation + commit tooltip card hide)
- Stamp: 2026-05-13 11:47 WIB
- Cluster: A1 (post-V8.1 Ghaisan QA 11:39 WIB)
- Wall-clock: ~15 min (within 20 min HARD budget)
- Lock compliance: no em dash, no emoji, no scope expansion. Diff isolated to BuildingHeightTimeMachine.tsx + CommitTooltip.tsx.

## Context

V8.1 live (image 45bfc267, pod codeplex-chronicle-f9f98dd4c-hcpxh, HEAD 2aa3f21). Ghaisan QA flagged two regressions:

- Symptom 1: Time Machine scrubber drag updated commit popup card correctly (fa86be9 / c3b126e / 3613273 visible across positions) BUT building height STATIC across all drag positions. Zero geometry animation per drag.
- Symptom 2: Time Machine commit card occluded ~30% city view in center-right area. No hide toggle parity with Activity bottom scrubber SHOW/HIDE pill.

## Root cause confirmed

Manager FINAL pre-spawn forensic correct. Aether V8 Cluster 1 fix at BuildingHeightTimeMachine.tsx had introduced a `matchRatio < 0.1` guard that mapped all buildings to scale 1 (present-day height) when the mock building IDs did not overlap the real backend snapshot file paths. Trade-off intentionally prioritized "buildings visible" over "animation per drag." Side effect: at matchRatio < 10% the targetScales useMemo returned a frozen all-1 map regardless of scrubberPosition, so the useFrame lerp loop converged instantly + never re-fired.

## Fix Step 2: synthetic scrubber-driven animation fallback

Edit at `frontend/src/modes/activity/BuildingHeightTimeMachine.tsx`:

1. Added selector import for scrubberPosition.

   ```ts
   import { useActivityStore, selectScrubberPosition } from './store';
   ```

2. Extended `computeTargetScales` signature with `scrubberPosition: number` parameter (Option A per spawn directive).

3. Replaced the matchRatio < 0.1 all-1 fallback with synthetic-scale fallback:

   ```ts
   if (matchRatio < 0.1) {
     const syntheticScale = 0.3 + 0.7 * scrubberPosition;
     for (const b of city.buildings) result.set(b.id, syntheticScale);
     return result;
   }
   ```

   - scrubberPosition 0.0 (LEFT anchor, past) -> scale 0.3 (short but visible)
   - scrubberPosition 1.0 (RIGHT anchor, present) -> scale 1.0 (full)
   - Floor 0.3 prevents sink regression (V8 Cluster 1 original concern preserved)

4. Real-LOC branch (matchRatio >= 10%) untouched - preserves Wave 3 path-namespace-aligned behavior.

5. Caller useMemo now subscribes to scrubberPosition + threads it through:

   ```ts
   const scrubberPosition = useActivityStore(selectScrubberPosition);
   ...
   return computeTargetScales(city, snapshot.files, scrubberPosition);
   ...
   }, [city, snapshot, paused, scrubberPosition]);
   ```

   Re-evaluates per drag tick (TimelineScrubber input step 0.001 -> 1000 discrete positions), useFrame lerp tween (tau 0.2s) reads new target every render, smooth animation restored.

## Fix Step 3: CommitTooltip hide toggle with localStorage persistence

Edit at `frontend/src/modes/activity/CommitTooltip.tsx`:

1. Added hooks imports + localStorage key constant:

   ```ts
   import { useCallback, useEffect, useMemo, useState } from 'react';
   const COMMIT_TOOLTIP_HIDDEN_KEY = 'commit_tooltip_hidden';
   ```

2. Added local hidden state + persisted load/store via localStorage:

   - useState(false) default visible on mount
   - useEffect reads `commit_tooltip_hidden` key on mount, hydrates state if 'true'
   - persist() callback flips state + writes localStorage, ignoring failures (private mode / disabled storage)

3. Added hidden-mode pill render branch (parity with TimelineScrubber collapsed pill pattern). Position: `fixed bottom-[14.5rem] right-6 z-40` so it sits to the side of the scrubber's own collapse pill (which is bottom-6 left-1/2). pointer-events-auto on the pill so click registers.

4. Added inline hide button to expanded card top-right (next to the cursor date). The outer wrapper retains pointer-events-none (so it never steals city clicks during scrubber drag), but the hide button itself has pointer-events-auto override.

5. Both buttons use the same visual idiom as TimelineScrubber's existing hide pill: rounded-full, uppercase tracked-wide caption "hide" / "show", subtle ember/white border, hover transitions.

6. Hide preference independent of `activityScrubberCollapsed` - the Time Machine tooltip is owned by Time Machine pipeline (TimeMachineOrchestrator), distinct from the TimelineScrubber HUD card. Two surfaces toggle independently.

## Verification

### TypeScript

`cd frontend && npx tsc --noEmit` - PASS (zero diagnostics, 12s run).

### ESLint

Project `next lint` script broken at npm wiring level (pre-existing, not my doing). TypeScript strict mode is the primary compile-time gate; lint is informational.

### Rules of Hooks audit

- BuildingHeightTimeMachine: new `useActivityStore(selectScrubberPosition)` call placed BEFORE first conditional return - safe.
- CommitTooltip: new useState/useEffect/useCallback all placed BEFORE the existing `if (!repoFullName) return null` early return - safe. (Pre-existing useMemo after that early return is a prior pattern; left untouched per no-scope-expansion lock.)

### Real-browser Playwright

NOT executed in this cycle - spawn directive explicit "DO NOT REBUILD IMAGE - Atlas batches V8.2 redeploy." Pod currently runs V8.1 image (HEAD 2aa3f21) which does NOT contain this fix. Verification deferred to Atlas V8.2 redeploy + subsequent Ghaisan / Pan smoke pass.

When V8.2 deploy lands, expected behavior at `/city?repo=gadablotnok/web-esp32log&mode=activity`:

1. Drag scrubber rightmost (now) to leftmost (past): buildings should smoothly shrink from full present-day silhouette down to ~30% height (visible but compressed) over ~200ms tween per drag tick. Non-zero floor guarantees no sink regression.
2. Drag back rightward: buildings grow smoothly back toward full height.
3. Click "hide" on Time Machine commit card: card collapses to small "Time Machine [show]" pill at `bottom-[14.5rem] right-6`. City canvas visible underneath where the card used to sit (~30% center-right zone freed).
4. Click "show" on pill: card returns. Preference persisted across reload via localStorage.
5. TimelineScrubber bottom-center scrubber HUD `hide` button still works independently (parity, no regression).

## Lock compliance audit

- Lock 1 (no em dash): clean. Searched diff for `—` and `–` - zero hits. All separators are ASCII hyphens or full sentences.
- Lock 2 (no emoji): clean. Zero emoji bytes added to either file or this checkpoint.
- Lock 4 (no hidden config / no scope expansion): clean. Only two files touched per spawn mandate. No new dependencies, no new env vars, no schema changes, no contract violation - the BuildingHeightTimeMachineProps surface area is unchanged, CommitTooltipProps unchanged.
- Lock 5 (honest claim): clean. The synthetic fallback is commented as a documented degradation that activates only when mock-vs-real namespace mismatch occurs; real-LOC path still preserved + still labeled `realData` from useTimeMachine. Hide preference labeled as user UX choice, not as data fabrication.

## Files modified

- `frontend/src/modes/activity/BuildingHeightTimeMachine.tsx` (signature + fallback body + caller selector)
- `frontend/src/modes/activity/CommitTooltip.tsx` (state + localStorage + hide button + restore pill)

## Files inspected only (no edit)

- `frontend/src/modes/activity/store.ts` (confirmed selectScrubberPosition export)
- `frontend/src/modes/activity/TimelineScrubber.tsx` (collapse pill pattern reference)
- `frontend/src/modes/activity/TimeMachineOrchestrator.tsx` (CommitTooltip mount site, no plumbing change needed)
- `frontend/src/lib/panel-context/panelStore.ts` (verified activityScrubberCollapsed pattern; tooltip hide kept independent on purpose)

## Handoff to Atlas

Atlas: include this checkpoint's two file diffs in V8.2 rebuild batch. Expected image tag bump from 45bfc267 to next-build. No K8s manifest changes needed - the fix is pure frontend bundle.

## Outstanding (out of scope this cycle)

- Wave 3 Daedalus + Demeter joint contract for path-namespace alignment between mock city IDs and real backend snapshot paths. When that ships, matchRatio will routinely exceed 10% on real repos + the synthetic fallback becomes a tail-case safety net rather than the primary visible behavior.
- Pre-existing Rules-of-Hooks pattern in CommitTooltip (useMemo after conditional return) - left untouched per scope lock.

End of checkpoint.
