'use client';

/**
 * SprintHud: Persephone-owned wrapper that adds a hide-toggle for the Hera
 * `<SprintModeControls />` top-left overlay.
 *
 * Authored by Persephone (Wave-Fixing #2 Cycle 1, C-new-4). Provides CardKanan
 * (chat) + CardKiri (side panel) parity for the Sprint Mode HUD. Without this
 * wrapper, the Hera 14 PM concept toggle pill bar at the top-left of `/city`
 * could not be hidden, blocking the city canvas underneath when the user
 * wants a clean look at the 3D city.
 *
 * Anti-collision discipline:
 *   - Hera owns `frontend/src/modes/sprint/*` including the `<SprintModeControls />`
 *     component. We do NOT modify Hera files.
 *   - Persephone owns `frontend/components/panels/*` and `frontend/src/lib/panel-context/*`
 *     panelStore where the `sprintCollapsed` state lives.
 *   - The wrapper conditionally mounts the Hera component. When collapsed,
 *     it renders a small restore-button surface positioned where the Hera
 *     panel would appear, so the user can re-open the HUD.
 *
 * Visual parity with chat + side panel collapse surfaces:
 *   - Collapsed: 44x44px Glassmorphism pill with a chevron, top-left fixed,
 *     matching the touch-target floor + glass language of ChatPanel +
 *     SidePanel collapse surfaces.
 *   - Expanded: render Hera's `<SprintModeControls />` unchanged + overlay
 *     a small collapse button at the top-right corner of the Hera panel.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 3 (no silent scope narrow): wrapper does NOT mutate Hera component;
 *     all state lives in Persephone panelStore.
 *   Lock 5 (honest claim): no mock; production wrapper surface.
 *   Lock 7 (Greek naming): SprintHud distinct from Hera's SprintModeControls.
 */

import { usePanelStore } from '@/lib/panel-context';
import { SprintModeControls } from '@/modes/sprint';

export interface SprintHudProps {
  className?: string;
}

export function SprintHud({ className: _className }: SprintHudProps) {
  const sprintCollapsed = usePanelStore((s) => s.sprintCollapsed);
  const setSprintCollapsed = usePanelStore((s) => s.setSprintCollapsed);

  if (sprintCollapsed) {
    // Collapsed surface: small restore button. Positioned at top-left fixed,
    // matches Hera's `.hera-sprint-controls` anchor (top: 1.25rem, left: 1.25rem).
    // Glass token language pulled from globals.css `.glass-panel` family.
    return (
      <div
        data-panel="sprint-hud"
        data-collapsed="true"
        className="sprint-hud-collapsed"
        role="region"
        aria-label="Sprint Mode HUD (collapsed)"
      >
        <button
          type="button"
          onClick={() => setSprintCollapsed(false)}
          aria-label="Show Sprint Mode HUD"
          title="Show Sprint Mode HUD"
          className="sprint-hud-collapsed-btn"
        >
          <span aria-hidden className="sprint-hud-collapsed-icon">
            {'>'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-panel="sprint-hud"
      data-collapsed="false"
      className="sprint-hud-expanded"
    >
      <SprintModeControls />
      <button
        type="button"
        onClick={() => setSprintCollapsed(true)}
        aria-label="Hide Sprint Mode HUD"
        title="Hide Sprint Mode HUD"
        className="sprint-hud-hide-btn"
      >
        <span aria-hidden className="sprint-hud-hide-icon">
          {'<'}
        </span>
      </button>
    </div>
  );
}

SprintHud.displayName = 'SprintHud';
