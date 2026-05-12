/**
 * Default content for the @chat parallel slot.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL).
 *
 * Next.js 16 requires every named parallel slot to ship a `default.tsx`
 * (parallel-routes upgrade requirement, builds fail otherwise). This file
 * fills the slot when no matching parallel route is active, which is the
 * Wave 1 baseline state.
 *
 * Wave 2 Persephone consume target: replace this file with the real
 * `<ChatPanel />` 5-resident routing UI per Pythia contract
 * `_meta/contracts/calliope-to-wave2-panels.md` line 78-80. Wave 1 ships a
 * labeled placeholder so the slot region is visible to the audit gate +
 * demo without claiming a real panel exists yet.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): [STUB] label per anti-pattern convention.
 */

export default function ChatSlotDefault() {
  return (
    <div className="city-slot-placeholder" data-slot="chat">
      <p className="city-slot-tag">[STUB: Wave 2 Persephone replace with chat panel]</p>
      <p className="city-slot-hint">AI chat (5 resident routing)</p>
    </div>
  );
}
