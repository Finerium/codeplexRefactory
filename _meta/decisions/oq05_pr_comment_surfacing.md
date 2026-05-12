# OQ-05 Decision: PR Comment Surfacing Visual

**Decided by**: Hera (Wave 2 Sprint Mode HERO worker)
**Date**: 2026-05-12 ~23:00 WIB
**Status**: LOCKED V1 (Wave 2 entry, Dike Wave 2 audit gate non-overlap verifier)
**Authority**: Hera per Pythia contract `iris-to-hera.md` line 159 + Hera prompt `.claude/agents/hera.md` Section 4 OQ-05 mandate + PRD Section 9.2 line 498 + Section 25 OQ-05 row.

## Decision

**Variant locked**: **Sticky Note 3D**.

PR pending unresolved comments surface as a small paper sticky-note plane attached to the upper face of the affected building, with a square red badge displaying unread comment count, oriented camera-billboard so the text always reads. Click expands a small panel hovering next to the building (Drei `<Html>` portal), shows top 3 comment previews; further click routes to `heraStore.selectBuilding(buildingId)` which Persephone's ticket panel inhales for the full thread.

## 3 candidate evaluation matrix

| Candidate | Visual identity | Non-overlap with scaffolding/crane/banner | Demo-readability | Implementation cost | PRD evidence | Verdict |
|---|---|---|---|---|---|---|
| **Sticky Note 3D** | Paper note plane + red badge, billboard text | Note anchors above building roof; scaffolding wraps lower body; crane sits 20-unit above roof but tilts away from camera; banner is City Hall-only (Athena landmark, restricted to one building). Sticky note vertical anchor `[x, y+height+0.5, z]` with billboard rotation, NO z-fight risk because scaffolding/crane occupy `y` band `[0, height+15]` while sticky note plane occupies thin `[height+0.4, height+1.6]` band facing camera | High: paper-yellow note + red badge reads instantly as "GitHub PR comment" semantic by every engineer | Moderate: 1 plane geometry + 1 badge Sprite + Drei `<Html>` panel on click | PRD line 244 (US-06 demo wording "sticky note"), line 1004 (demo script "sticky note dengan badge 3 unread comment"), line 497 (visual hint sticky note + badge convention) | **WIN** |
| Floating Bubble (chat-bubble) | Speech bubble silhouette + tail pointer pointing at building face | Bubble floats above building same vertical band as Crane's tip + Banner ribbon. Z-fight risk: bubble tail intersects scaffolding pipe joints on lower zoom; bubble shape competes with Banner pennant on Athena landmark | Medium: more cartoony, can read as "chat" rather than "PR comment" specifically | Higher: requires custom SDF shader or layered mesh to render speech bubble silhouette crisply at all camera distances | PRD line 498 mentions "floating speech bubble" only as alternate candidate | Lose: overlap + ambiguity |
| Marker Pin + Badge | Map-style pin + numeric badge attached to roof | Pin protrudes vertically same axis as Crane top. Z-fight risk: pin tip collides with Crane cable at certain elevation angles. Also pin visual identity reads as "geo location" not "comment thread", semantic mismatch | Low: most generic look | Cheapest: just CylinderGeometry + SphereGeometry pin | PRD line 498 candidate fallback | Lose: weakest semantic, biggest visual collision |

## Non-overlap verification (Dike audit gate critical)

Sticky note vertical-band reservation:
- Building base (y = 0): foundation
- Scaffolding band: `y in [0, height]` (wraps the wall, all 14 PM concepts visible together)
- Yellow tape band: `y in [0, 1.5]` (low ring around base, never collides with note)
- Smoke billow: `y in [height*0.5, height+8]` (rises from roof, billows outward but sticky note plane sits flatter and camera-facing)
- Crane: `y in [height+1, height+15]` (above roof; sticky note sits at `height+0.4`, comfortably under)
- Banner (City Hall only): `y in [height+0.2, height+3]` on Athena landmark only; sticky note placement on Athena moves to opposite face if Banner present (collision-aware placement, see implementation note below)
- Inspector NPC: orbit `y in [height*0.4, height*0.7]`, never touches sticky note plane
- DoD checklist: `y in [height+2, height+5]` (hovers higher than sticky note)
- Size badge: `y in [height+5, height+6]` (highest single anchor above the building, sticky note sits well below)
- Green halo glow: emits from `y = height*0.5` outward in 3D sphere, low alpha, no occlusion of sticky note

Implementation note for Athena landmark collision: when a building has `landmark === 'athena'` AND `prComments.length > 0`, the sticky note plane positions on the back face (looking at fixed `[-1, 0, 0]` building-local normal) instead of front; the banner occupies front. For all other buildings, sticky note uses front face (positive `+z` building-local). This is a 1-line conditional in `PRCommentSurface.tsx`.

## Click expand interaction (Persephone integration)

Sticky note plane has an onClick (r3f raycaster picks up the plane mesh). Click dispatches `heraStore.selectBuilding(buildingId)` -> Persephone TicketPanel renders the full comment thread under the linked PR section. The note itself does NOT expand inline (avoiding nested HTML inside the canvas tree at scale). Demo script reads "click sticky note -> ticket panel comment thread surfaces", matching PRD line 1004 demo flow.

Hover surface: pointer on sticky note increments z-translate by 0.15 + scale 1.05x via GSAP (subtle hover affordance, no GSAP timeline needed for hover) signaling clickability.

## Rationale top-level

1. **PRD precedent already names it**: line 244 (user story), line 497 (visual convention), line 1004 (demo script) all reference "sticky note". Picking Sticky Note 3D aligns Hera output with the locked PRD demo script verbatim. Boreas Wave 2 Onboarding tour script reads naturally.
2. **Semantic clarity**: paper note + numeric badge = ubiquitous office-floor "FYI message you need to read". Engineering managers + engineers parse this in <1 second without label. Avoids confusion with the City Hall banner (sprint goal announcement) and crane (active review work).
3. **Non-overlap audit safety**: sticky note thin vertical band hugs roof edge below crane and below DoD checklist, comfortably above yellow tape and scaffolding. The only collision risk is on Athena landmark (banner reservation), solved by 1-line back-face placement.
4. **Implementation cost moderate, ship reliable**: 1 PlaneGeometry + texture (paper-yellow gradient + text emoji-free), 1 Sprite for badge, Drei `<Billboard>` wrapper for camera-facing. ~30-line component, fits Cycle 3 budget.

## Variant fallback (if Dike audit gate FAILS non-overlap)

Wave 2 final-mile rescue: if Dike spots z-fighting on demo capture (e.g., M1 Mac integrated GPU different precision), Hera Wave 2 cycle 5 swap to Marker Pin variant at the same anchor point, dropping cost to 0 net visual collision (Pin top y = `height+0.4` same band but smaller silhouette eliminates plane intersection). Decision deferral is OK because the geometry swap is trivial.

## References

- Hera prompt `.claude/agents/hera.md` Section 4 hard rules + Section 4 OQ-05 mandate
- Pythia contract `_meta/contracts/iris-to-hera.md` line 159 (OQ-05 Hera authority)
- Pythia contract `_meta/contracts/hera-to-persephone.md` line 153 (Persephone comment timeline follows Hera visual decision)
- Pythia contract `_meta/contracts/dike-wave2-audit.md` line 46-48 (non-overlap audit gate)
- PRD Section 9.2 line 498 (3 candidate listing) + line 1004 (demo script line) + line 244 (US-06) + Section 25 line 1811 (OQ-05 row)
- 14 PM concept canonical mapping PRD Section 9.2 lines 480-493 (locked, no remap)
