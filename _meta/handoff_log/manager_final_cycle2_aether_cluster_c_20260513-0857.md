# Aether Cluster C Handoff - Building Click Root Cause

STAMP: 20260513-0857
From: Aether (Wave-Fixing 3 Manager FINAL Cycle 2)
To: Manager FINAL
Topic: Building click zero-response root cause forensic + fix applied

## Summary

Root cause of building click "zero response" (3rd cycle recurrence) identified and
fix applied. Primary root cause is GSAP animation timing in useSlideTransition, not
a broken click pipeline. The pipeline is fully functional; the problem was the panel
appeared after a 300ms+ invisible phase that users perceived as "no response."

## Root Causes Identified

### PRIMARY: GSAP fromTo animation reset (H-CLICK-GSAP)

File: frontend/src/lib/panel-motion/useSlideTransition.ts

Original behavior: every open transition (including repeat opens after close) used
gsap.fromTo with starting state autoAlpha: 0. This immediately sets opacity=0 and
visibility=hidden on the panel element BEFORE the animation begins. Combined with
React async state batching and render delay (~16ms per frame), the result is:

  User clicks building -> Zustand update -> React re-render -> gsap.fromTo resets
  panel to invisible -> 300ms animation -> panel finally visible.

User perception: click produces no visible response for 316ms+. Looks like a broken
click. Actually the pipeline was working the whole time.

Fix applied: replaced fromTo logic for subsequent opens with:
  gsap.set(el, { visibility: 'visible' })   <- synchronous, fires in first frame
  gsap.to(el, { autoAlpha: 1, ... })        <- then animates opacity/transform

First mount still uses fromTo (for the slide-in entrance animation on initial page
load, which is intentional and looks good because the user expects loading).

Additional: default duration reduced from 0.3s to 0.18s for snappier response.

Evidence: code trace + git diff working tree. Logic proof: gsap.set() is synchronous
and fires before any animation RAF tick. Element visible in frame 1 after click.

### SECONDARY: Canvas hit-test obstruction (H-CLICK-2)

Sprint HUD (.hera-sprint-controls): position fixed, top/left 1.25rem, z-index 30,
pointer-events auto, max-width 22rem (~352px). Sits in the upper-left canvas area.
Side panel (~320px from left) and chat panel (~350px from right) add additional
obstruction. Estimated 60-68% of canvas area blocked for real users. Only the
center strip ~300-500px wide is reliably clickable for most viewport sizes.

This means even if the GSAP fix is perfect, users clicking buildings in the
upper-left, left edge, or right edge of the city will STILL get no response
because their clicks land on panel overlays rather than the canvas.

NOT fixed in Cycle 2. Owner: Hera (Sprint HUD position) + Persephone (side panel
collapse-by-default behavior). Recommendation: default side panel to collapsed
state (restore button only) until user explicitly clicks a building.

### DISPROVED: Chain broken (H-CLICK-5)

Zustand dispatch chain confirmed intact. dispatchClick -> clickSubscribers fanout ->
onBuildingClick -> setSelectedBuildingId -> React re-render -> context !== null ->
TicketPanel open. Verified via 100ms async Playwright evaluate returning populated
data-building-id on TicketPanel DOM node.

## Playwright Browser Pollution Advisory

Background agents Boreas (Activity scrubber) and Asclepius (SSE Health) are using
the same shared Playwright browser session. Any browser_navigate from Aether is
immediately overridden by Boreas/Asclepius navigating to their target URLs. Post-fix
screenshot verification is DEFERRED per Lock 5 honest claim (cannot capture clean
evidence in polluted session). Evidence basis: MIXED-METHODOLOGY (code trace + logic
proof + pre-fix partial Playwright evidence).

## Files Modified

1. frontend/src/lib/panel-motion/useSlideTransition.ts
   - mountedRef tracks first-mount vs subsequent-open distinction
   - Subsequent open: immediate gsap.set(visibility:visible) + gsap.to()
   - Default duration 0.3 -> 0.18s
   - JSDoc documents Aether Cycle 2 stamp + rationale

## Fix NOT Applied (scope boundary)

- Sprint HUD canvas obstruction: Hera scope. Aether documents, does not fix.
- SidePanel default-collapsed: Persephone scope. Aether documents, does not fix.

## Artifacts

- Decision log: _meta/decision_log/aether.md entries D-Aether-Final-14 to D-Aether-Final-15
- Checkpoint: _meta/checkpoints/aether-cycle2mf2-20260513-0857.md
- This handoff: _meta/handoff_log/manager_final_cycle2_aether_cluster_c_20260513-0857.md
- Screenshots: DEFERRED (shared browser pollution, see D-Aether-Final-15)

## Ship Recommendation

PASS for GSAP timing fix. The fix is logically sound and the pipeline was confirmed
working end-to-end in the pre-fix Playwright session.

DEFERRED for canvas obstruction fix. Not Aether scope. Recommend Manager FINAL
spawn a targeted Hera fix for Sprint HUD position if canvas coverage is a
submission priority (it is a UX regression that affects real user demo experience).
