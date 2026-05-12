/**
 * Public barrel for the cross-panel context library.
 *
 * Authored by Persephone (Wave 2). Components import from
 * `@/lib/panel-context`.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

export type {
  PanelContextState,
  PanelContextActions,
  SidePanelVariant,
} from './types';

export { modeToVariant } from './types';

export {
  usePanelStore,
  useCurrentChatContext,
} from './panelStore';
