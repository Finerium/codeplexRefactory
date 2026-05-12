/**
 * @ticket parallel slot mount point.
 *
 * Authored by Persephone (Wave 2). Replaces the Calliope Wave 1 STUB
 * placeholder `default.tsx` when active route is `/city`.
 *
 * The TicketPanel composite subscribes to:
 *   - Iris building click event bus via `useBuildingClick`
 *   - Hera `useSelectedBuildingContext` for sprint-mode context
 *   - Persephone `usePanelStore` for cross-panel state
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { TicketPanel } from '@/components/panels/ticket';

export default function TicketSlot() {
  return <TicketPanel />;
}
