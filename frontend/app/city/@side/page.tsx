/**
 * @side parallel slot mount point.
 *
 * Authored by Persephone (Wave 2). Replaces the Calliope Wave 1 STUB
 * placeholder `default.tsx` when active route is `/city`.
 *
 * The SidePanel composite routes to one of 3 variants based on the current
 * product mode:
 *   - refactor mode -> RefactorReviewVariant (proposal review + dual review gate)
 *   - health mode   -> HealthFindingsVariant (Asclepius FindingsPanel + EvidencePanel)
 *   - activity mode -> ActivityDrilldownVariant (timeline drill + hotspot + ownership)
 *   - other modes   -> idle hint
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { SidePanel } from '@/components/panels/side';

export default function SideSlot() {
  return <SidePanel />;
}
