'use client';

/**
 * TimeMachineOrchestrator: composite Activity Mode Time Machine wrapper.
 *
 * Owner: Boreas (Manager FINAL Cycle 2 Cluster B, STAMP 20260513-0857).
 *
 * Single-source-of-truth driver for the scrubber drag -> backend fetch ->
 * city height tween + commit tooltip pipeline. Mounted as a DOM-level
 * sibling of TimelineScrubber inside ActivityHud so the tooltip floats
 * above the city canvas while still living outside the r3f tree.
 *
 * The CANVAS-side height tween component lives in BuildingHeightTimeMachine
 * + must be mounted inside ChronicleCanvas separately (see
 * ActivityCanvasLayer below).
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean.
 *   Lock 5: when repoFullName is null we render an inert hint card so
 *     users know the Time Machine requires a repo selection.
 */

import { CommitTooltip } from './CommitTooltip';
import { useTimeMachine } from './useTimeMachine';

interface TimeMachineOrchestratorProps {
  /** Active repo. When null the orchestrator surfaces a graceful hint. */
  repoFullName: string | null | undefined;
}

export function TimeMachineHud({ repoFullName }: TimeMachineOrchestratorProps) {
  // Hook drives one fetch per scrubber tick (debounced 100ms inside hook).
  const { snapshot, loading, error, cursorTimestampIso } = useTimeMachine({
    repoFullName,
  });

  if (!repoFullName) {
    // No repo selected -> small inert hint card. Activity Mode still
    // renders all the mock visuals via TimelineScrubber but the Time
    // Machine specifically requires a repo.
    return (
      <div
        role="status"
        aria-live="polite"
        data-panel="activity-time-machine-hint"
        className={[
          'pointer-events-none fixed bottom-[14.5rem] left-1/2 z-40 -translate-x-1/2',
          'flex w-[26rem] max-w-[88vw] flex-col gap-1',
          'rounded-xl border border-white/12 bg-codeplex-shadow/70 px-3 py-2',
          'shadow-xl backdrop-blur-glass',
        ].join(' ')}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-codeplex-ember">
          Time Machine
        </span>
        <p className="text-[11px] leading-snug text-white/70">
          select a repo from /dashboard or pass <span className="font-mono text-white/90">?repo=owner/name</span> to enable Git Time Machine scrubbing.
        </p>
      </div>
    );
  }

  return (
    <CommitTooltip
      snapshot={snapshot}
      loading={loading}
      error={error}
      cursorTimestampIso={cursorTimestampIso}
      repoFullName={repoFullName}
    />
  );
}

export { BuildingHeightTimeMachine } from './BuildingHeightTimeMachine';
