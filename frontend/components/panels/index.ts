/**
 * Panels barrel: top-level public surface for Persephone Wave 2 panels.
 *
 * Authored by Persephone (Wave 2). Re-exports the 3 panel composites + the
 * Glassmorphism wrapper. Wave 3 backend workers + Pan post-Wave 3 polish
 * consume from here.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

export { Glassmorphism, type GlassmorphismProps } from './Glassmorphism';

export { ChatPanel, type ChatPanelProps } from './chat';
export { TicketPanel, type TicketPanelProps } from './ticket';
export {
  SidePanel,
  type SidePanelProps,
  RefactorReviewVariant,
  HealthFindingsVariant,
  ActivityDrilldownVariant,
} from './side';
