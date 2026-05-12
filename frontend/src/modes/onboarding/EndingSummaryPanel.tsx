'use client';

/**
 * EndingSummaryPanel: glassmorphism card shown after tour completes.
 *
 * Owner: Boreas (Wave 2).
 * Decision: `_meta/decision_log/boreas.md` D10.
 *
 * Mount: OUTSIDE the Canvas as a sibling DOM overlay.
 *
 * Content per Pythia contract `boreas-to-triton.md` Section "Output schema":
 *   - Starting file path (clickable; Wave 3 deep-link IDE optional).
 *   - Owner contact (GitHub login with @ prefix + avatar URL).
 *
 * Visibility: shown when phase === 'complete'. Dismiss button restores camera
 * to default + resets tour state via onDismiss callback.
 *
 * Compliance:
 *   Lock 1: clean. Lock 2: clean. Lock 5: endingSummary fields driven by
 *   TourScript.endingSummary (mock Wave 2, real Wave 3 Demeter).
 */

import type { EndingSummary } from './types';

interface EndingSummaryPanelProps {
  /** Visible flag (driven by phase === 'complete' OR a wave 3 trigger). */
  visible: boolean;
  /** Summary content from TourScript.endingSummary. */
  summary: EndingSummary;
  /** Dismiss handler (resets tour state in parent). */
  onDismiss: () => void;
  /** Optional: click handler for the starting file path. */
  onStartingFileClick?: (path: string) => void;
}

export function EndingSummaryPanel({
  visible,
  summary,
  onDismiss,
  onStartingFileClick,
}: EndingSummaryPanelProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour ending summary"
      className={[
        'pointer-events-none fixed inset-0 z-40 flex items-center justify-center',
        'transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div
        className={[
          'pointer-events-auto flex w-[28rem] max-w-[90vw] flex-col gap-5',
          'rounded-3xl border border-white/15 bg-codeplex-shadow/85 p-7',
          'shadow-2xl backdrop-blur-glass',
        ].join(' ')}
      >
        <header className="flex flex-col gap-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-codeplex-ember">
            Tour complete
          </p>
          <h2 className="text-lg font-semibold text-white">
            Selamat datang di Codeplex Chronicle
          </h2>
          <p className="text-sm text-white/70">
            Lu udah lihat top 4 landmark distrik. Coba mulai eksplor dari sini.
          </p>
        </header>

        <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50">
            Starting file
          </p>
          <button
            type="button"
            onClick={() => onStartingFileClick?.(summary.primaryEntryPath)}
            className={[
              'rounded-md px-2 py-1 text-left font-mono text-sm text-white',
              'hover:bg-white/10 hover:text-codeplex-ember',
              'focus:outline-none focus:ring-2 focus:ring-codeplex-ember',
              'transition-colors duration-150',
            ].join(' ')}
          >
            {summary.primaryEntryPath}
          </button>
        </section>

        <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50">
            Owner contact
          </p>
          <div className="flex items-center gap-3">
            {summary.primaryOwnerAvatar ? (
              // Avatar URL provided (Wave 3 path).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={summary.primaryOwnerAvatar}
                alt={`${summary.primaryOwnerLogin} avatar`}
                className="h-10 w-10 rounded-full border border-white/20"
                loading="lazy"
              />
            ) : (
              // Placeholder circle Wave 2.
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 font-mono text-xs text-white/70">
                {summary.primaryOwnerLogin.replace(/^@/, '').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <p className="font-mono text-sm text-white">{summary.primaryOwnerLogin}</p>
              <p className="text-[11px] text-white/50">
                GitHub handle (Wave 3 wires DM + email)
              </p>
            </div>
          </div>
        </section>

        <footer className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className={[
              'rounded-lg border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-widest',
              'text-white/80 hover:bg-white/10 hover:text-white',
              'focus:outline-none focus:ring-2 focus:ring-codeplex-ember',
              'transition-colors duration-150',
            ].join(' ')}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
