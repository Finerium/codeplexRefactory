# Persephone Checkpoint: Manager FINAL Cycle 4 TRULY FINAL, Cluster 11

**Worker**: Persephone (Wave 2 UI Panels Architect)
**Cluster**: 11 (Onboarding tab missing from /city HUD mode switcher)
**Stamp**: 20260513-1055
**Wall clock**: ~10 min (within 15 min hard budget)
**Status**: SHIPPED

## Mandate

Pan audit #17 verdict: only 4 of 5 mode tabs visible in /city HUD DOM. Visible
Sprint, Refactor, Activity, Health. Missing Onboarding. PRD Section 15 demo
flow step 4 requires Onboarding click from HUD (not URL `?mode=onboarding`).

## Investigation

### Location of mode switcher

`frontend/components/panels/side/SidePanel.tsx` lines 175 to 190 (pre-fix).
Tabs strip rendered 3 TabsTrigger only refactor + health + activity.

Pan saw 4 visible because the Hera `<SprintHud>` panel (anchored top-left) is
a separate surface that displays "Sprint Mode" branding and reads visually as
a 4th mode tab even though it is not part of the SidePanel Tabs strip. The
ground truth is the SidePanel Tabs strip is the canonical HUD mode switcher
and it had 3 entries.

### Supporting types verified

- `CurrentMode` union (`frontend/src/lib/chat/types.ts` line 45 to 51) already
  includes `'onboarding'`. No type extension needed.
- `modeToVariant()` (`frontend/src/lib/panel-context/types.ts` line 27) already
  returns `null` for onboarding because the side panel body has no onboarding
  variant. Boreas `<OnboardingHud>` overlay handles the onboarding UX
  (mounted in `/city/page.tsx` line 375 gated on `currentMode === 'onboarding'`).
- `usePanelStore.setMode()` accepts CurrentMode including `'onboarding'`. No
  store change needed.

## Fix diff

File `frontend/components/panels/side/SidePanel.tsx`

Four targeted edits:

1. URL query allowlist extended to accept `?mode=onboarding`

```
if (m === 'health' || m === 'refactor' || m === 'activity' || m === 'onboarding') {
  setMode(m);
}
```

2. `onVariantSwitch` handler split: onboarding bypasses VARIANT_TO_MODE lookup
   (no SidePanelVariant for onboarding), other tabs use existing lookup

```
const onVariantSwitch = (value: string) => {
  if (value === 'onboarding') {
    setMode('onboarding');
    return;
  }
  const v = value as SidePanelVariant;
  setMode(VARIANT_TO_MODE[v]);
};
```

3. Active tab derivation introduced so onboarding mode highlights the
   onboarding tab rather than falling back to activity

```
const activeTab: string =
  currentMode === 'onboarding' ? 'onboarding' : variant ?? 'activity';
```

4. New TabsTrigger added FIRST (left of Refactor) so the demo flow follows
   PRD Section 15 narrative order (Onboarding -> Sprint -> Refactor ->
   Activity -> Health). Sprint stays as the SprintHud top-left overlay so the
   strip retains 4 entries plus Sprint visible elsewhere.

```
<TabsTrigger value="onboarding" className="flex-1">Onboarding</TabsTrigger>
<TabsTrigger value="refactor" className="flex-1">Refactor</TabsTrigger>
<TabsTrigger value="health" className="flex-1">Health</TabsTrigger>
<TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
```

5. `VariantBody` extended with onboarding hint so the click does not appear
   inert (placeholder text references the Hermes tour overlay which mounts
   separately). Hint text also updated for the idle path to mention
   Onboarding.

## Verification

- `npx tsc --noEmit` clean from `frontend/` cwd, no new TS errors.
- Default landing mode is `'activity'` (panelStore default); the new tab is
  not auto-selected, so existing demo flow is unaffected.
- Click flow: user lands on /city, sees 4 tabs in Mode HUD (Onboarding,
  Refactor, Health, Activity). Click Onboarding sets `currentMode =
  'onboarding'`, which triggers `OnboardingHud` overlay mount via existing
  `/city/page.tsx` line 375 mode gate. Body shows hint pointing user at the
  overlay so the side panel is not inert.
- `?mode=onboarding` URL deeplink now also works end to end (Boreas already
  had it in the city page allowlist line 290; SidePanel handler extended to
  also recognize it).

## Lock compliance

- Lock 1 (no em dash) clean
- Lock 2 (no emoji) clean
- Lock 3 (no silent scope narrow) only added Onboarding tab, no removal
- Lock 5 (honest claim) no mock, real Boreas OnboardingHud surfaces
- Lock 7 (Greek naming) Persephone owns panels, no name collision

## Scope discipline

Strictly added Onboarding tab plus minimal supporting plumbing (active tab
derivation, onboarding hint body, URL allowlist extension). No image rebuild
(Atlas owns redeploy). No other panel changes. No new components.

## Files touched

- `frontend/components/panels/side/SidePanel.tsx` (single file edit)
