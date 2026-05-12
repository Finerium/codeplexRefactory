'use client';

/**
 * SprintModeControls: DOM overlay for 14 PM concept toggle chips.
 *
 * Authored by Hera (Wave 2). Mounted OUTSIDE the `<ChronicleCanvas>` so it
 * renders as a fixed-position pill panel anchored to the screen, not the
 * scene. Each chip toggles one concept on/off via `useHeraStore.toggleConcept`.
 *
 * Anti-AI-slop choices per `_meta/decision_log/hera.md` D-Hera-04:
 *   - Compact pill bar at the top-left, NOT a chunky sidebar
 *   - Active chip shows colored dot + bright text; inactive dim gray
 *   - Concept labels short + recognizable (matches PRD Section 9.2 row names)
 *   - Subtle backdrop-blur via Tailwind / inline style
 *
 * Compliance:
 *   - Lock 1 (no em dash): clean
 *   - Lock 2 (no emoji): clean
 *   - Lock 5 (honest claim): no mock label
 *
 * Visual quality: this is the closest Hera-output gets to a Tailwind look.
 * Anti-slop discipline applied via specific color palette + concept labels,
 * NOT generic Tailwind chrome.
 */

import { useHeraStore } from './heraStore';
import type { ConceptKey } from './types';

interface ChipDescriptor {
  key: ConceptKey;
  label: string;
  /** Tier 1 chips show by default; Tier 2 chips hide behind "more" expand */
  tier: 1 | 2;
}

const CHIPS: ChipDescriptor[] = [
  { key: 'scaffolding', label: 'Scaffolding', tier: 1 },
  { key: 'crane', label: 'Crane', tier: 1 },
  { key: 'inspector-npc', label: 'Reviewer', tier: 1 },
  { key: 'green-halo', label: 'Approved glow', tier: 1 },
  { key: 'yellow-tape', label: 'Blocked', tier: 1 },
  { key: 'smoke-retak', label: 'CI fail', tier: 1 },
  { key: 'pr-comment', label: 'PR comments', tier: 1 },
  { key: 'size-badge', label: 'Size', tier: 1 },
  { key: 'blueprint-pin', label: 'Backlog', tier: 2 },
  { key: 'city-hall-banner', label: 'Sprint goal', tier: 2 },
  { key: 'district-border', label: 'District', tier: 2 },
  { key: 'dod-checklist', label: 'DoD', tier: 2 },
  { key: 'red-bridge', label: 'Dependency', tier: 2 },
  { key: 'refactor-stage', label: 'Refactor (Asclepius)', tier: 2 },
];

export function SprintModeControls() {
  const visibility = useHeraStore((s) => s.conceptVisibility);
  const toggleConcept = useHeraStore((s) => s.toggleConcept);
  const resetVisibility = useHeraStore((s) => s.resetConceptVisibility);
  const mockTapeRunning = useHeraStore((s) => s.mockTapeRunning);

  return (
    <div className="hera-sprint-controls" data-overlay="sprint-controls">
      <header className="hera-sprint-controls-header">
        <span className="hera-sprint-controls-title">Sprint Mode</span>
        <span className="hera-sprint-controls-subtitle">14 PM concept overlay</span>
        {mockTapeRunning ? (
          <span className="hera-sprint-controls-tape-tag">
            [MOCK Wave 2] demo tape running
          </span>
        ) : null}
      </header>

      <div className="hera-sprint-controls-grid">
        {CHIPS.map((chip) => {
          const on = visibility[chip.key];
          return (
            <button
              key={chip.key}
              type="button"
              className={`hera-chip ${on ? 'hera-chip-on' : 'hera-chip-off'}`}
              onClick={() => toggleConcept(chip.key)}
              aria-pressed={on}
              data-concept={chip.key}
              data-tier={chip.tier}
            >
              <span className="hera-chip-dot" aria-hidden="true" />
              <span className="hera-chip-label">{chip.label}</span>
            </button>
          );
        })}
      </div>

      <footer className="hera-sprint-controls-footer">
        <button
          type="button"
          className="hera-chip hera-chip-reset"
          onClick={resetVisibility}
        >
          Reset all
        </button>
      </footer>
    </div>
  );
}
