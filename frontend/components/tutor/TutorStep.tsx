'use client';

/**
 * Manager FINAL Cycle 2 (Persephone Cluster G, STAMP 20260513-0857):
 *
 * TutorStep: one of the 8 onboarding panels in the User Tutor modal.
 * Renders title + body copy + optional visual cue (icon glyph or
 * accent badge). Layout discipline: title at top, body in the middle,
 * accent strip pinned to the bottom-left so step indicator dots align
 * cleanly on the right (handled by TutorModal).
 *
 * Step content authored per Manager directive Cluster G item 2
 * (lines 105-117 of directive):
 *   Step 1 Welcome
 *   Step 2 5 modes (Onboarding + Sprint + Refactor + Health + Activity)
 *   Step 3 5 residents (Athena + Apollo + Argus + Clio + Hermes)
 *   Step 4 City navigation (orbit drag, click building, hover ripple)
 *   Step 5 Dashboard manager view (top-right nav button)
 *   Step 6 Refactor mode flow
 *   Step 7 Health Mode findings
 *   Step 8 Activity Mode Time Machine scrubber
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TutorStepData {
  /** 1-based step index (used for indicator dots + a11y label). */
  index: number;
  /** Short step title. */
  title: string;
  /** Step kicker tag (uppercase mono accent). */
  kicker: string;
  /** Body content (string lines OR ready-made ReactNode). */
  body: ReactNode;
  /** Optional accent color for the kicker. Defaults to codeplex ember. */
  accent?: 'ember' | 'azure' | 'jade' | 'amber' | 'rose' | 'violet';
}

const ACCENT_TO_COLOR: Record<NonNullable<TutorStepData['accent']>, string> = {
  ember: 'text-codeplex-ember',
  azure: 'text-sky-300',
  jade: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  violet: 'text-violet-300',
};

export interface TutorStepProps {
  step: TutorStepData;
  total: number;
  className?: string;
}

export function TutorStep({ step, total, className }: TutorStepProps) {
  const accentColor = ACCENT_TO_COLOR[step.accent ?? 'ember'];
  return (
    <article
      className={cn('flex flex-col gap-3 px-1 py-0.5', className)}
      data-tutor-step={step.index}
      aria-label={`Tutor step ${step.index} of ${total}: ${step.title}`}
    >
      {/* Header strip */}
      <header className="flex flex-col gap-1">
        <p
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest',
            accentColor
          )}
        >
          {step.kicker} - {step.index} / {total}
        </p>
        <h3 className="text-base font-semibold text-white">{step.title}</h3>
      </header>

      {/* Body */}
      <div className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-white/85">
        {step.body}
      </div>
    </article>
  );
}

TutorStep.displayName = 'TutorStep';

/**
 * Canonical 8-step tour script. Edit copy here to update the user
 * onboarding experience. Manager directive locks the topic ordering;
 * we are free to refine copy.
 */
export const TUTOR_STEPS: TutorStepData[] = [
  {
    index: 1,
    title: 'Welcome to Codeplex Chronicle',
    kicker: 'Welcome',
    accent: 'ember',
    body: (
      <>
        <p>
          Codeplex Chronicle turns your production codebase into a living 3D
          city. Files become buildings, commits become floors, errors become
          earthquakes.
        </p>
        <p className="text-white/65">
          Click the floating <span className="font-mono">{'?'}</span> button
          anytime to replay this tour.
        </p>
      </>
    ),
  },
  {
    index: 2,
    title: 'Five product modes',
    kicker: 'Modes',
    accent: 'azure',
    body: (
      <ul className="flex flex-col gap-1">
        <li>
          <span className="font-mono text-[11px] text-codeplex-ember">
            Onboarding
          </span>
          <span className="text-white/65"> - guided fly-through for new joiners</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-codeplex-ember">
            Sprint HERO
          </span>
          <span className="text-white/65"> - live PM concept overlays + PR sticky notes</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-codeplex-ember">
            Refactor SAFETY
          </span>
          <span className="text-white/65"> - ghost-building proposal with accept gate</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-codeplex-ember">
            Health
          </span>
          <span className="text-white/65"> - findings glow + evidence drilldown</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-codeplex-ember">
            Activity Time Machine
          </span>
          <span className="text-white/65"> - scrub timeline left or right to watch buildings grow</span>
        </li>
      </ul>
    ),
  },
  {
    index: 3,
    title: 'Five AI residents',
    kicker: 'Residents',
    accent: 'jade',
    body: (
      <ul className="flex flex-col gap-1">
        <li>
          <span className="font-mono text-[11px] text-amber-300">Athena</span>
          <span className="text-white/65"> - City Hall, refactor architect (V4-Pro thinking high)</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-rose-300">Apollo</span>
          <span className="text-white/65"> - Hospital, health narration (V4-Flash)</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-sky-300">Argus</span>
          <span className="text-white/65"> - Police Station, security CVSS (V4-Flash thinking low)</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-emerald-300">Clio</span>
          <span className="text-white/65"> - Library, git + spec drift (V4-Flash)</span>
        </li>
        <li>
          <span className="font-mono text-[11px] text-violet-300">Hermes</span>
          <span className="text-white/65"> - Tourist Info, onboarding tour (V4-Flash)</span>
        </li>
      </ul>
    ),
  },
  {
    index: 4,
    title: 'City navigation',
    kicker: 'Navigate',
    accent: 'azure',
    body: (
      <>
        <p>
          Drag the canvas to orbit the camera. Scroll to zoom. Click any
          building to open its side panel with file metadata, contributor
          list, and per-floor commit timeline.
        </p>
        <p className="text-white/65">
          Hover a building to see a per-floor glow ripple. Press
          <span className="ml-1 inline-flex items-center rounded-sm border border-white/20 px-1 py-0.5 font-mono text-[10px] text-white/85">
            Esc
          </span>
          {' '}to return to the overview camera.
        </p>
      </>
    ),
  },
  {
    index: 5,
    title: 'Dashboard manager view',
    kicker: 'Dashboard',
    accent: 'amber',
    body: (
      <>
        <p>
          Click the
          <span className="ml-1 inline-flex items-center rounded-sm border border-codeplex-ember/40 bg-codeplex-ember/15 px-1 py-0.5 font-mono text-[10px] text-codeplex-ember">
            Dashboard
          </span>
          {' '}link in the top-right of the city header for the manager
          view: sprint metrics, health rollup, activity charts, and the
          Engineering Insights diagram gallery (architecture, dependency
          graph, ERD).
        </p>
      </>
    ),
  },
  {
    index: 6,
    title: 'Refactor mode',
    kicker: 'Refactor',
    accent: 'violet',
    body: (
      <>
        <p>
          Type a refactor intent in the chat panel (for example, &quot;add 2FA to
          login&quot;). Athena returns a proposal, a design sketch, a task list,
          and three ghost buildings render alongside the production city.
        </p>
        <p className="text-white/65">
          Use the side panel review gate to accept or discard. Until you
          accept, no file in your repo changes.
        </p>
      </>
    ),
  },
  {
    index: 7,
    title: 'Health mode',
    kicker: 'Health',
    accent: 'rose',
    body: (
      <>
        <p>
          Switch to Health to see findings glow on buildings by severity
          (critical, high, medium, low, info). Click a glowing building to
          open the evidence panel and convert any finding into a GitHub
          issue with one click.
        </p>
      </>
    ),
  },
  {
    index: 8,
    title: 'Activity Time Machine',
    kicker: 'Activity',
    accent: 'jade',
    body: (
      <>
        <p>
          Switch to Activity, then drag the bottom-center scrubber. Left
          rewinds time, right returns to now. Building heights animate
          based on lines-of-code at each timestamp so you can watch your
          codebase grow.
        </p>
        <p className="text-white/65">
          That is the full tour. Click
          <span className="ml-1 inline-flex items-center rounded-sm border border-white/20 px-1 py-0.5 font-mono text-[10px] text-white/85">
            Finish
          </span>
          {' '}to dismiss, or
          <span className="ml-1 inline-flex items-center rounded-sm border border-white/20 px-1 py-0.5 font-mono text-[10px] text-white/85">
            ?
          </span>
          {' '}anytime to replay.
        </p>
      </>
    ),
  },
];
