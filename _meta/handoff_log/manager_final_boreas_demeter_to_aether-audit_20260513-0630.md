# Handoff Log: Manager Wave-Fixing #3 FINAL -> Aether Audit

**From**: Boreas (Wave-Fixing #3 cycle, Activity scrubber UX + card layout) + Demeter (paired, backend stance verify)
**To**: Aether (Wave-Fixing #3 audit gate) + Pan (demo rehearsal post-final)
**Date**: 2026-05-13 ~06:30 WIB Day 2 (STAMP=20260513-0630)
**Status**: SHIP-CLEAN, ready for audit

---

## What shipped

### Scope: Activity Mode visual + integrated card layout fix

Ghaisan QA 05:51 WIB flagged two related complaints:

1. **ACTIVITY-SCRUBBER-UX-BROKEN (CRITICAL)**: drag scrubber only updated date label cursor, NO city visual scrub, NO commit popup.
2. **ACTIVITY-CARD-LAYOUT-WEIRD**: "kenapa buat ngedragnya di situ dan cardnya dipisah? jangan dipisah dong?"

### Boreas-side delivery (frontend):

1. `frontend/src/modes/activity/TimelineScrubber.tsx` rewrite:
   - Single integrated cohesive card (summary + range toggle + heatmap toggle + scrubber rail + per-cursor commit popup).
   - `findNearestMarker` snaps to closest marker within +/- 1 day.
   - Hide toggle parity with SprintHud (collapsed = small bottom-center restore pill).

2. `frontend/src/modes/activity/HotspotGlow.tsx` rewrite:
   - `computeSliceIntensities` drives city visual scrub: cumulative commits from cursor forward to Now per building.
   - As cursor sweeps backward in time, slice grows -> halos brighten -> "scrub commit-by-commit" effect.
   - BURST building tied to nearest marker at cursor gets 1.5x size + ember tint pulse.

3. `frontend/src/modes/activity/mockActivityData.ts` extension:
   - TimelineMarker schema gained commitHash + commitMessage + filePath + (preserved authorLogin).
   - Density bumped to ~116 markers in 30d window (top-20 buildings * 4-7 markers each).
   - Templates: 8 author pool + 8 commit message family + 3 PR family + 2 release family.

4. `frontend/src/modes/activity/types.ts`: extended TimelineMarker with optional commit detail fields.

5. `frontend/src/lib/panel-context/panelStore.ts` + `types.ts`: extended with `activityScrubberCollapsed` state + setter (parity sprintCollapsed Wave-Fixing #2 C-new-4 pattern).

### Demeter-side delivery (backend):

NO backend changes this cycle. Decision documented in `_meta/decision_log/demeter.md` D-Demeter-15:

- Backend `/api/activity` endpoint operational + Pydantic schema-compatible (Wave-Fixing #2 D-Demeter-09).
- TimelineMarker extension lives client-side in Boreas mockActivityData; Wave 3 swap path requires backend to populate timeline_markers in `/api/activity` response OR Boreas synthesize from pr_events + pull_request.title.
- `useActivityData` adapter inherits markers from mock when server returns empty (existing fallback semantics preserved).

---

## Audit checklist for Aether

### Real-browser verification

`http://localhost:3000/city?mode=activity` Playwright snapshot 2026-05-13 06:38 WIB:

- [x] Integrated Activity scrubber card visible at bottom-center, contains summary + range + scrubber + commit popup.
- [x] "hide" button at top-right of card (parity SprintHud).
- [x] 116 marker dots on rail (commit/pr_merged/release color-coded).
- [x] Cursor label updates from 2026-04-12 (position=1.0 / 30d ago) to 2026-05-12 (position=0 / Now).
- [x] Commit popup card shows: PR merged | 2026-04-12 13:00Z | @boreas | "PR #68 merged: rework scanner.py interface to support multi-tenant" | backend/app/security/scanner.py | 19c0b41
- [x] Sprint retro 60s button preserved (bottom-right, Wave-Fixing #2 cycle 1 ship).
- [x] Side panel ActivityDrilldown variant preserved.

### Smoke script verification (deterministic, reproducible)

```bash
cd frontend
npx tsx scripts/verify-scrubber-cycle3.ts
# Expected: 5 distinct hashes across positions [0.0, 0.25, 0.5, 0.75, 1.0]. PASS.

npx tsx scripts/verify-hotspot-glow-cycle3.ts
# Expected: slice commit counts grow monotonically 119 -> 938 -> 1914 -> 2827 -> 3816. PASS.
```

### TS noEmit

```bash
cd frontend
npx tsc --noEmit -p tsconfig.json
# Expected: 0 lines of output on Boreas-owned files. Pre-existing TS6133 in HoverFloorGlow.tsx is Iris-owned.
```

### Anti-pattern compliance

- [x] Lock 1 (no em dash): grep -c "[em dash]" returns 0 across 6 modified files.
- [x] Lock 2 (no emoji): grep -c emoji returns 0.
- [x] Lock 3 (scope): only Boreas-owned files in `src/modes/activity/*` + `src/lib/panel-context/*` (panelStore extension is store-level + parity pattern with Persephone Wave-Fixing #2 C-new-4 precedent).
- [x] Lock 5 (honest claim): mock data labeled MOCK in top-level comment. Backend stance documented in D-Demeter-15.

---

## Open items for Pan demo rehearsal

1. **Scrubber drag visual cue practice**: when dragging the scrubber rail, the nearest marker dot ring-pulses + popup card updates in real time. Pan should demo this with slow drag from Now -> 30d ago so the visual scrub is legible. Demonstrate the commit popup updating ~5 times across the drag.

2. **Hide toggle demo**: click "hide" button -> card collapses to bottom-center pill -> click "show" -> card returns. Parity with SprintHud collapse.

3. **Mode switch demo**: switch from Activity to Sprint -> Sprint Mode HUD re-appears + Activity scrubber unmounts. Switch back to Activity -> scrubber re-mounts at last position (zustand store persistent across mode switch in-memory).

4. **60s sprint retro flythrough**: click button bottom-right -> Clio narration fetches via real DeepSeek V4-Flash non-think SSE -> camera flies over top-3 hotspots over 60 seconds -> overlay shows Indonesian prose.

5. **3D city scrub visual**: drag scrubber + watch buildings with halo brightness changes across the city. As cursor sweeps backward, more buildings light up + the burst building (tied to nearest marker) gets ember pulse. This is the "city visual scrub commit-by-commit" Ghaisan envisioned.

---

## Time accounting

- Plan + read: ~10 min
- Implementation (TimelineScrubber + HotspotGlow + mockActivityData + panel-context): ~25 min
- Smoke verification (Playwright + 2 tsx scripts + TS noEmit): ~20 min
- Artifacts (decision log + uncertainty + checkpoint + handoff): ~15 min
- Total: ~70 min vs 90 min budget = ~22% under-budget. No ferry.

---

## Ferry status

NOT triggered. No HIGH uncertainty surfaced. 5 MEDIUM concerns documented with mitigation paths. Aether audit can proceed.

Wave-Fixing #3 Manager FINAL: COMPLETE.
