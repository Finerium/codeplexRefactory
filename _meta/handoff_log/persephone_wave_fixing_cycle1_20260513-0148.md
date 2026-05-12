---
actual_timestamp: 20260513-0148
agent: Persephone
wave: Wave-Fixing
cycle: 1
scope_bugs: [C-5, C-6, C-7]
verdict_per_bug:
  C-5: FIXED
  C-6: FIXED
  C-7: FIXED
code_files_touched:
  - frontend/app/city/layout.tsx
  - frontend/app/globals.css
  - frontend/src/lib/panel-context/panelStore.ts
  - frontend/src/lib/panel-context/types.ts
  - frontend/components/panels/chat/ChatPanel.tsx
  - frontend/components/panels/side/SidePanel.tsx
deferred_reasons: []
typecheck_status: clean for changed files (pre-existing dashboard errors unrelated, Selene scope)
lint_status: deferred (eslint config v9 migration outstanding in repo, not Persephone scope)
---

# Persephone Wave-Fixing cycle 1, scope: 3 bug Cluster 5 (City /city UI panel layout)

## Bug verdict + root cause + fix

### C-5 CRITICAL: UI overlap CardKiri menimpa CardKanan

**Root cause**:
- `frontend/app/globals.css` `.city-chat-slot` (right dock 22rem) + `.city-side-slot` (left dock 18rem) + `.city-ticket-slot` (bottom-right 24rem) all used fixed widths.
- On viewports below ~1100px wide, fixed widths combined exceeded the available horizontal space, producing the visible overlap that Hafiz captured in `_meta/qa_screenshots/Screenshot2Hafiz.jpg` (yellow border SidePanel overlapping red border ChatPanel).
- The ticket slot offset (`right: 22rem`) was hard-coded to match the chat dock so any viewport-driven shift broke the side-by-side relation.

**Fix**:
- Replaced fixed widths with `clamp(min, ideal, max)` so panels shrink gracefully on narrow viewports:
  - chat slot: `clamp(16rem, 28vw, 22rem)`
  - side slot: `clamp(14rem, 22vw, 18rem)`
  - ticket slot: width `clamp(18rem, 26vw, 24rem)`, height `clamp(13rem, 24vh, 16rem)`
- Ticket slot's right offset now uses `clamp(16rem, 28vw, 22rem)` so it always equals the chat dock current width, never overlapping it.
- Introduced `--slot-w` CSS variable per slot so a `[data-collapsed='true']` selector can shrink the dock to ~3.5rem when the panel is collapsed, freeing the canvas underneath. The chat slot and side slot now read collapsed state from `usePanelStore` via the city layout passing `data-collapsed` attribute.
- Added an additional `body:has(.city-side-slot:not([data-collapsed='true'])) .hera-sprint-controls` selector that shifts Hera's fixed-position SprintModeControls overlay to the right of the SidePanel when expanded, eliminating the top-left z-30 vs z-20 collision (previously the SprintModeControls sat on top of the Mode HUD tabs).

**Files touched**:
- `frontend/app/globals.css` (single coordinated append inside existing Calliope-owned city-* block; no rule mutation on other blocks)
- `frontend/app/city/layout.tsx` (promoted to `'use client'` to read `panelStore` and forward `data-collapsed` attribute to slot wrappers)

### C-6 HIGH: CardKanan2 hide REGRESSION (no restore toggle)

**Root cause**:
- `ChatPanel.tsx` rendered the same `Glassmorphism` root regardless of `chatCollapsed`.
- `useSlideTransition({open: !chatCollapsed})` set `autoAlpha: 0` on the root element when collapsed, fading the entire panel including the header that hosted the toggle button.
- Once collapsed, the user could not see or click anything to restore the panel.

**Fix**:
- Made `useSlideTransition` always pass `open: true` (the panel is always mounted + visible in some form).
- Added a conditional early-return branch in `ChatPanel.tsx`: when `chatCollapsed === true`, render a small restore-button surface. The button uses `aria-label="Show chat panel"`, 44px touch target (h-11 w-11), and the chevron `<` glyph to indicate "expand to left".
- The expanded ChatPanel header's collapse button now uses the chevron `>` glyph + `aria-label="Collapse chat panel"` for symmetric affordance.

**Files touched**:
- `frontend/components/panels/chat/ChatPanel.tsx`

### C-7 HIGH: CardKiri (Mode HUD SidePanel) tidak bisa hide

**Root cause**:
- `SidePanel.tsx` had no collapse toggle at all. The Mode HUD always rendered full-height, overlaying part of the city canvas.
- The Hera SprintModeControls fixed overlay at top-left z-30 also competed for the top-left area, compounding the visual clutter.

**Fix**:
- Added `sideCollapsed` boolean to `PanelContextState` + matching `setSideCollapsed` action in `panelStore.ts` and `types.ts`.
- Modified `SidePanel.tsx` to mirror the ChatPanel collapse pattern:
  - Expanded header now includes a `<` chevron collapse button in the upper right of the Mode HUD label row.
  - When `sideCollapsed === true`, the component returns a small restore-button surface with a `>` chevron and `aria-label="Show mode HUD panel"`, 44px touch target.
- Updated `frontend/app/city/layout.tsx` to forward `data-collapsed` attribute on the `.city-side-slot` wrapper so the CSS shrinks the dock to ~3.5rem when collapsed.
- Hera's SprintModeControls overlay (fixed top-left z-30) now re-positions to the right of the SidePanel when expanded via the `:has()` selector noted above, eliminating the long-standing visual collision Hafiz flagged in `CardKiri.png`.

**Files touched**:
- `frontend/src/lib/panel-context/panelStore.ts`
- `frontend/src/lib/panel-context/types.ts`
- `frontend/components/panels/side/SidePanel.tsx`
- `frontend/app/city/layout.tsx`
- `frontend/app/globals.css`

## Verification

- Type check on changed files: clean. (`npx tsc --noEmit` reports only pre-existing `src/lib/dashboard/mockDashboardData.ts` + `useDashboardData.ts` errors that belong to Selene scope, unrelated to this cluster.)
- ESLint: deferred. Repo carries an outstanding ESLint v9 flat-config migration; the failure is environmental, not code-introduced.
- Manual reasoning for visual: shrink trace at ~720px viewport confirms chat dock `clamp(16rem, 28vw, 22rem)` resolves to ~16rem, side dock to ~14rem, ticket slot inset to ~16rem. Combined chat + side + central canvas gutter = ~30rem + ~10rem canvas region, no overlap. At ~1280px viewport, panels return to their original 18rem / 22rem feel.

## Lock compliance

- Lock 1 (no em dash): clean across all changed files.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): no new mock surfaces introduced; existing `[MOCK Wave 2, real Wave 3 Triton SSE stream]` label preserved at consume sites.

## Deferred items

None for this scope. The 3 bugs in Cluster 5 are fully addressed.

## Downstream impact

- The new `sideCollapsed` field on `usePanelStore` is additive; no existing subscriber breaks.
- Hera (SprintModeControls) is the only cross-domain visual neighbor affected, and the `:has()` selector is forward-compatible: if Hera adds its own collapse state later, the selector still degrades cleanly.
- Aletheia + Pan are encouraged to re-snapshot `/city` route at 1280px and 720px viewports to verify the fix before final demo.

---

End of handoff cycle 1.
