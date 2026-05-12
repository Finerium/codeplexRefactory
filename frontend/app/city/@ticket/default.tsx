/**
 * Default content for the @ticket parallel slot.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL).
 *
 * Next.js 16 requires every named parallel slot to ship a `default.tsx`.
 * This file fills the slot when no matching parallel route is active.
 *
 * Wave 2 Persephone consume target: replace this file with the real
 * `<TicketPanel />` per Pythia contract
 * `_meta/contracts/calliope-to-wave2-panels.md` line 78-80. The ticket
 * panel surfaces the BuildingData payload dispatched by the city
 * `useBuildingClick` subscriber.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): [STUB] label per anti-pattern convention.
 */

export default function TicketSlotDefault() {
  return (
    <div className="city-slot-placeholder" data-slot="ticket">
      <p className="city-slot-tag">[STUB: Wave 2 Persephone replace with ticket panel]</p>
      <p className="city-slot-hint">Building ticket detail (click any building)</p>
    </div>
  );
}
