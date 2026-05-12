/**
 * Default content for the @side parallel slot.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL).
 *
 * Next.js 16 requires every named parallel slot to ship a `default.tsx`.
 * This file fills the slot when no matching parallel route is active.
 *
 * Wave 2 Persephone consume target: replace this file with the real
 * `<SidePanel />` (3 mode variant: refactor / health / activity) per
 * Pythia contract `_meta/contracts/calliope-to-wave2-panels.md` line
 * 78-80. The side panel hosts the mode-specific HUD overlays driven by
 * Wave 2 Hera + Asclepius + Boreas.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): [STUB] label per anti-pattern convention.
 */

export default function SideSlotDefault() {
  return (
    <div className="city-slot-placeholder" data-slot="side">
      <p className="city-slot-tag">[STUB: Wave 2 Persephone replace with side panel]</p>
      <p className="city-slot-hint">Mode HUD (refactor / health / activity)</p>
    </div>
  );
}
