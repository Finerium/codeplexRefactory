'use client';

/**
 * RefactorIntentInput: text input + submit button that drives the
 * Refactor Mode flow per PRD Section 9.3 step 1 "Intent input".
 *
 * Owner: Asclepius (Wave-Fixing #2 cycle 1, STAMP=20260513-0313 origin)
 *        rewired to real backend by Pandora (Wave-Fixing #2 cycle 1
 *        rescue R-1, STAMP=20260513-0313).
 *
 * Manager directive Cluster 6 anchor (Bug #12 + R-1 CRITICAL):
 *   "input intent -> 3 ghost building runtime appear + SSE streaming
 *    proposal/design/tasks render side panel + Run Simulation -> ghost
 *    -> solid animation"
 *
 * Wave-Fixing #2 cycle 1 (Pandora rescue R-1) changes:
 *   - Replace the Wave 2 mock dispatch (canned MOCK_PROPOSAL) with a
 *     real call to POST /api/refactor/propose via `streamProposal`. The
 *     SSE stream pushes proposal.started + proposal.ghost +
 *     proposal.openspec.* + proposal.complete frames; we ingest each
 *     into the Asclepius store so the side panel + r3f ghost layer
 *     light up as Athena V4-Pro thinks.
 *   - When the backend is unreachable (offline demo, dev without
 *     uvicorn), the catch fallback dispatches MOCK_PROPOSAL so the
 *     demo flow never breaks. The mock fallback is visibly labelled
 *     in console only; the UI remains pitch-clean.
 *   - The WebSocket subscription for stage events is owned by
 *     RefactorReviewVariant (it has access to the same simulation_id
 *     captured here via the store). This component fires the intent
 *     and emits the proposal events; the variant attaches the WS
 *     subscriber once the proposal lands.
 *
 * Visual quality (anti-AI-slop):
 *   - Multi-line textarea with placeholder showing a real demo intent
 *   - Three suggestion chips for instant pitch ("Add 2FA to login",
 *     "Extract payment service", "Migrate to async DB")
 *   - Submit button uses the Athena warm ember palette (City Hall accent)
 *   - "Athena thinking" indicator while SSE is streaming
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 3 (SAFETY-
 * FIRST: production code never changes from this client; drafts isolation
 * is Pandora backend safety property). Lock 5 (real-backend wiring; mock
 * fallback labelled in code + dev console only).
 */

import { useCallback, useRef, useState } from 'react';
import { useAsclepiusStore } from '../health/asclepiusStore';
import { MOCK_PROPOSAL } from './__mock__/proposal';
import {
  streamProposal,
  type ProposalFrame,
} from './refactorClient';
import type {
  GhostBuildingHint,
  RefactorProposalEvent,
} from './simulationEvents';

const SUGGESTIONS: { label: string; intent: string }[] = [
  { label: 'Add 2FA to login', intent: 'I want to add 2FA to login.' },
  {
    label: 'Extract payment service',
    intent: 'Extract payment service from the monolith into its own module.',
  },
  {
    label: 'Migrate to async DB',
    intent: 'Migrate the user repository from sync to async SQLAlchemy.',
  },
];

interface RefactorIntentInputProps {
  /** Optional title override. */
  title?: string;
  /** Class name passthrough for panel slot embedding. */
  className?: string;
}

export function RefactorIntentInput({
  title = 'Refactor intent',
  className,
}: RefactorIntentInputProps) {
  const ingestRefactorEvent = useAsclepiusStore((s) => s.ingestRefactorEvent);
  const setProposal = useAsclepiusStore((s) => s.setProposal);
  const setStage = useAsclepiusStore((s) => s.setStage);
  const resetRefactor = useAsclepiusStore((s) => s.resetRefactor);
  const existingProposal = useAsclepiusStore((s) => s.refactor.proposal);
  const stage = useAsclepiusStore((s) => s.refactor.stage);
  const [intent, setIntent] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streamingDetail, setStreamingDetail] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Backend dispatch: real SSE stream via streamProposal. The function
  // iterates each frame and updates the store. Mock fallback on network
  // failure so the demo never crashes.
  const dispatchReal = useCallback(
    async (userIntent: string): Promise<void> => {
      resetRefactor();
      setThinking(true);
      setStreamingDetail('Connecting to Athena (V4-Pro thinking high)...');
      // Cancel any in-flight stream.
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      // Track the accumulated ghost list so we can re-issue setProposal
      // with each frame (the store does not expose append).
      let accumulatedGhosts: GhostBuildingHint[] = [];
      let simulationId: string | null = null;

      try {
        for await (const frame of streamProposal(
          { user_intent: userIntent },
          abort.signal,
        )) {
          applyFrame(frame, {
            setSimulationId: (sid) => {
              simulationId = sid;
            },
            setStreamingDetail,
            resetGhosts: () => {
              accumulatedGhosts = [];
            },
            appendGhost: (g) => {
              accumulatedGhosts = [...accumulatedGhosts, g];
            },
            getAccumulatedGhosts: () => accumulatedGhosts,
            getSimulationId: () => simulationId,
            getUserIntent: () => userIntent,
            setProposal: (p) => setProposal(p),
            setStage,
            // Cast wrapper: RefactorEventLike loose stage union ('idle' is
            // allowed there but not in the canonical RefactorEvent stage
            // enum). At runtime applyFrame never produces an 'idle' stage
            // event so the cast is safe.
            ingestRefactorEvent: (event) => {
              ingestRefactorEvent(event as Parameters<typeof ingestRefactorEvent>[0]);
            },
          });
        }
        setStreamingDetail('Proposal complete. Click Run Simulation to dispatch.');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.warn('[refactor-intent] propose failed, mock fallback:', msg);
        setStreamingDetail(`Backend unreachable; mock fallback. (${msg})`);
        // Mock fallback so the demo continues even offline.
        const proposal: RefactorProposalEvent = {
          ...MOCK_PROPOSAL,
          userIntent,
          simulationId: `sim-mock-${slugify(userIntent)}-${Date.now() % 100000}`,
        };
        ingestRefactorEvent(proposal);
      } finally {
        setThinking(false);
        abortRef.current = null;
      }
    },
    [ingestRefactorEvent, resetRefactor, setProposal, setStage],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!intent.trim()) return;
      void dispatchReal(intent.trim());
    },
    [intent, dispatchReal],
  );

  const isBusy = thinking;
  const hasActiveProposal = existingProposal !== null && stage !== 'idle';

  return (
    <form
      className={
        'pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/10 bg-codeplex-shadow/85 p-4 text-xs text-white/80 backdrop-blur-glass ' +
        (className ?? '')
      }
      onSubmit={onSubmit}
      data-asclepius-panel="refactor-intent"
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
            Athena, City Hall
          </p>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {hasActiveProposal ? (
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-200">
            Active
          </span>
        ) : null}
      </header>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={3}
        placeholder='e.g. "I want to add 2FA to login"'
        className="w-full resize-none rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] text-white/90 placeholder:text-white/35 focus:border-codeplex-ember/60 focus:outline-none"
        disabled={isBusy}
        data-input="refactor-intent"
      />

      <section className="flex flex-wrap gap-1.5" aria-label="Intent suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setIntent(s.intent);
              void dispatchReal(s.intent);
            }}
            disabled={isBusy}
            className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-mono text-white/65 hover:border-codeplex-ember/45 hover:text-codeplex-ember disabled:opacity-50"
            data-action="suggestion-chip"
          >
            {s.label}
          </button>
        ))}
      </section>

      <footer className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-white/45">
          Athena drafts proposal + 3 ghost buildings appear in scene.
        </p>
        <button
          type="submit"
          disabled={isBusy || !intent.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-codeplex-ember px-3 py-1.5 text-[11px] font-medium text-codeplex-void hover:bg-codeplex-ember/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-codeplex-ember/60 disabled:cursor-not-allowed disabled:opacity-50"
          data-action="propose-refactor"
        >
          {isBusy ? 'Athena thinking...' : 'Ask Athena'}
        </button>
      </footer>

      {streamingDetail ? (
        <p
          className="font-mono text-[10px] text-codeplex-ember/85"
          role="status"
        >
          {streamingDetail}
        </p>
      ) : null}
    </form>
  );
}

RefactorIntentInput.displayName = 'RefactorIntentInput';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 32);
}

// ---------------------------------------------------------------------------
// SSE frame -> store ingest helper
// ---------------------------------------------------------------------------

interface FrameApplyDeps {
  setSimulationId: (sid: string) => void;
  setStreamingDetail: (msg: string | null) => void;
  resetGhosts: () => void;
  appendGhost: (g: GhostBuildingHint) => void;
  getAccumulatedGhosts: () => GhostBuildingHint[];
  getSimulationId: () => string | null;
  getUserIntent: () => string;
  setProposal: (proposal: RefactorProposalEvent | null) => void;
  setStage: (stage: 'idle' | 'proposed' | 'tests_generating' | 'tests_written' | 'impl_generating' | 'impl_written' | 'diff_serializing' | 'completed' | 'accepted' | 'discarded') => void;
  ingestRefactorEvent: (event: RefactorEventLike) => void;
}

// Loose helper type to satisfy ingestRefactorEvent without circular import.
type RefactorEventLike = RefactorProposalEvent | {
  type: 'simulation.stage';
  simulationId: string;
  stage: 'idle' | 'proposed' | 'tests_generating' | 'tests_written' | 'impl_generating' | 'impl_written' | 'diff_serializing' | 'completed' | 'accepted' | 'discarded';
  timestamp: string;
  payload: Record<string, unknown>;
};

function applyFrame(frame: ProposalFrame, deps: FrameApplyDeps): void {
  const {
    setSimulationId,
    setStreamingDetail,
    resetGhosts,
    appendGhost,
    getAccumulatedGhosts,
    getSimulationId,
    setProposal,
    setStage,
    ingestRefactorEvent,
  } = deps;

  switch (frame.type) {
    case 'proposal.queued':
      // Wave-Fixing #3 R-1 RECURRING fix: first SSE frame, arrives within
      // ~50 ms of the click. Used to give the user immediate feedback that
      // Athena received the intent + is thinking. The proposal.started
      // frame lands 30-60 sec later with the actual title + summary.
      setStreamingDetail(
        `${frame.message} (${frame.expected_latency_seconds_low}-${frame.expected_latency_seconds_high}s).`,
      );
      return;
    case 'proposal.started':
      setSimulationId(frame.simulation_id);
      resetGhosts();
      setProposal({
        type: 'simulation.proposal',
        simulationId: frame.simulation_id,
        openspecChangePath: `openspec/changes/${frame.simulation_id}/`,
        title: frame.title,
        summary: frame.summary,
        userIntent: frame.user_intent,
        ghostBuildings: [],
        timestamp: new Date().toISOString(),
      });
      setStage('proposed');
      setStreamingDetail(`Drafting "${frame.title}" (complexity: ${frame.complexity})...`);
      return;
    case 'proposal.ghost': {
      appendGhost(frame.ghost);
      const sid = getSimulationId();
      if (sid) {
        // Re-publish the proposal with accumulated ghosts so the
        // ghost-building r3f layer renders the new ghost.
        setProposal({
          type: 'simulation.proposal',
          simulationId: sid,
          openspecChangePath: `openspec/changes/${sid}/`,
          title: '', // patched in proposal.complete
          summary: '',
          userIntent: deps.getUserIntent(),
          ghostBuildings: getAccumulatedGhosts(),
          timestamp: new Date().toISOString(),
        });
      }
      setStreamingDetail(`Ghost building proposed: ${frame.ghost.label}`);
      return;
    }
    case 'proposal.openspec.proposal_md':
      setStreamingDetail(`Wrote proposal.md (${frame.body.length} chars).`);
      return;
    case 'proposal.openspec.design_md':
      setStreamingDetail(`Wrote design.md (${frame.body.length} chars).`);
      return;
    case 'proposal.openspec.tasks_md':
      setStreamingDetail(`Wrote tasks.md (${frame.body.length} chars).`);
      return;
    case 'proposal.complete':
      // Final canonical proposal envelope; ingest via the store hook so
      // the side panel + ghost layer get the authoritative payload.
      ingestRefactorEvent(frame.proposal);
      return;
    case 'proposal.fallback.github_issue':
      setStreamingDetail(
        `Repo has no openspec/ folder; GitHub Issue draft prepared: ${frame.issue_title}`,
      );
      return;
    case 'proposal.simulate_ready':
      // No-op; the user must click Run Simulation (Gate 1 review).
      return;
    case 'proposal.error':
      throw new Error(frame.error);
  }
}
