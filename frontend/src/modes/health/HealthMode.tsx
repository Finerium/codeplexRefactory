'use client';

/**
 * HealthMode: composite root for the Health Mode side-panel HUD.
 *
 * Owner: Asclepius (Wave 2).
 *
 * Mount strategy: this composite is rendered in the DOM tree (NOT inside
 * the r3f Canvas). The in-scene glow effect lives in `HealthGlowLayer` and
 * is mounted inside `<ChronicleCanvas>`; the HUD pieces (panel + evidence)
 * mount as DOM siblings to the canvas at the Persephone `@side` slot per
 * Pythia contract `_meta/contracts/calliope-to-wave2-panels.md`.
 *
 * Wave 2 deliverable: Persephone Wave 2 has not yet shipped the mode-router
 * for `@side/[mode]/page.tsx`. Until then, this component is consumed
 * directly via the smoke route `/asclepius-smoke` so Dike Wave 2 audit has
 * a stable visual checkpoint. Persephone integration is a barrel re-export
 * away once Persephone ships.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 (mock pump is
 * the upstream-labeled source; this composite just renders).
 */

import { useFindings } from './useFindings';
import { FindingsPanel } from './FindingsPanel';
import { EvidencePanel } from './EvidencePanel';

interface HealthModeProps {
  /** Streaming source; default 'mock' for Wave 2. */
  source?: 'mock' | 'websocket';
  /** Required when source = 'websocket'. */
  repoFullName?: string;
}

/**
 * Composite root. Hosts the findings list at top + evidence detail below.
 * Layout: vertical flex, gap 12px, panel width determined by parent slot
 * styling (Persephone side panel is 18rem, Calliope CSS pre-styled).
 */
export function HealthMode({
  source = 'mock',
  repoFullName,
}: HealthModeProps) {
  useFindings({ mode: source, repoFullName });

  return (
    <div
      className="flex h-full w-full flex-col gap-3 overflow-y-auto"
      data-mode="health"
    >
      <FindingsPanel />
      <EvidencePanel />
    </div>
  );
}

HealthMode.displayName = 'HealthMode';
