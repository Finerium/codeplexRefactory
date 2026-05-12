'use client';

/**
 * DoDChecklist overlay (PRD Section 9.2 concept 11: Definition of Done).
 *
 * Floating panel above the SELECTED building (only one at a time to keep
 * draw count bounded) listing the DoD checklist items with checkboxes.
 * Items checked render with green tick + strikethrough; unchecked with
 * dim gray box. Uses Drei `<Html>` portal for crisp text + checkbox
 * rendering without SDF font handling overhead.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Compact card layout, NOT a wide bottom-of-screen toolbar
 *   - Camera-facing via Drei `<Html transform>` so panel reads from any
 *     camera angle
 *   - `<Html occlude="blending">` so building geometry hides the panel when
 *     behind, signalling spatial anchor
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean (icon uses unicode check mark BUT not emoji)
 *   - Lock 5 (honest claim): no mock label
 */

import { Html } from '@react-three/drei';
import type { BuildingData } from '@/scene/buildings/types';

interface DoDChecklistProps {
  building: BuildingData;
  active: boolean;
  items: { label: string; checked: boolean }[];
}

export function DoDChecklist({ building, active, items }: DoDChecklistProps) {
  if (!active || items.length === 0) return null;

  return (
    <Html
      position={[
        building.position[0],
        building.position[1] + building.height + 3.5,
        building.position[2],
      ]}
      center
      distanceFactor={18}
      occlude="blending"
      transform
      sprite
      zIndexRange={[100, 0]}
    >
      <div className="hera-dod-checklist" data-overlay="dod">
        <header className="hera-dod-title">Definition of Done</header>
        <ul className="hera-dod-list">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`hera-dod-item ${item.checked ? 'hera-dod-checked' : 'hera-dod-unchecked'}`}
            >
              <span className="hera-dod-box" aria-hidden="true">
                {item.checked ? 'x' : ''}
              </span>
              <span className="hera-dod-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Html>
  );
}
