'use client';

/**
 * Manager FINAL Cycle 2 (Persephone Cluster G, STAMP 20260513-0857):
 *
 * TutorModal: 8-step onboarding overlay. Renders a centered glass card
 * with a step header, the current TutorStep body, and a control bar
 * (Previous + Next + Skip + Don't show again + step indicator dots).
 *
 * Behavior:
 *   - First open auto-positions to step 1
 *   - Esc key closes (treated as Skip, marks completed)
 *   - Click outside the card closes (Skip)
 *   - Next on step 8 = Finish (closes + marks completed)
 *   - Don't show again sets the localStorage flag without finishing
 *   - Step indicator dots are clickable for direct jump
 *
 * Manager decision D-MF2-03 lock: localStorage flag `tutor_completed`
 * suppresses auto-show after first dismiss. The modal does NOT touch
 * the flag on Previous or step navigation; only Skip + Finish + Don't
 * show again set the flag (via the markTourCompleted helper).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Glassmorphism } from '@/components/panels/Glassmorphism';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TUTOR_STEPS, TutorStep } from './TutorStep';
import { markTourCompleted } from '@/lib/tour-storage';

export interface TutorModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional initial step index (1-based). Defaults to 1. */
  initialStep?: number;
}

export function TutorModal({ open, onClose, initialStep = 1 }: TutorModalProps) {
  const total = TUTOR_STEPS.length;
  const [stepIndex, setStepIndex] = useState<number>(
    Math.max(1, Math.min(initialStep, total))
  );

  // Reset to initial step whenever the modal opens.
  useEffect(() => {
    if (open) {
      setStepIndex(Math.max(1, Math.min(initialStep, total)));
    }
  }, [open, initialStep, total]);

  // Esc key closes (treated as skip, marks completed).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        markTourCompleted();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setStepIndex((i) => Math.min(i + 1, total));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStepIndex((i) => Math.max(i - 1, 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [open, total, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleNext = useCallback(() => {
    if (stepIndex >= total) {
      markTourCompleted();
      onClose();
    } else {
      setStepIndex((i) => Math.min(i + 1, total));
    }
  }, [stepIndex, total, onClose]);

  const handlePrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 1));
  }, []);

  const handleSkip = useCallback(() => {
    markTourCompleted();
    onClose();
  }, [onClose]);

  const handleDontShow = useCallback(() => {
    markTourCompleted();
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close on direct backdrop click (not bubbled from card).
      if (e.target === e.currentTarget) {
        markTourCompleted();
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  const currentStep = TUTOR_STEPS[stepIndex - 1];
  const isFirst = stepIndex === 1;
  const isLast = stepIndex === total;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Codeplex Chronicle onboarding tour"
      data-tutor-modal="open"
      onClick={handleBackdropClick}
    >
      <Glassmorphism
        variant="default"
        className={cn(
          'flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/15 shadow-2xl shadow-black/60'
        )}
      >
        {/* Top kicker strip */}
        <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
            Codeplex Chronicle Tour
          </p>
          <Button
            variant="icon"
            size="icon"
            onClick={handleSkip}
            aria-label="Close tour (skip)"
            title="Close tour (Esc)"
            className="h-7 w-7 text-white/55 hover:text-white"
          >
            <span aria-hidden className="font-mono text-base leading-none">
              x
            </span>
          </Button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TutorStep step={currentStep} total={total} />
        </div>

        <Separator />

        {/* Step indicator dots */}
        <div
          className="flex items-center justify-center gap-1.5 px-4 py-2"
          role="tablist"
          aria-label="Tour step indicator"
        >
          {TUTOR_STEPS.map((s) => {
            const dotActive = s.index === stepIndex;
            const dotVisited = s.index < stepIndex;
            return (
              <button
                key={s.index}
                type="button"
                className={cn(
                  'h-2 rounded-full transition-all',
                  dotActive
                    ? 'w-6 bg-codeplex-ember'
                    : dotVisited
                      ? 'w-2 bg-white/55 hover:bg-white/85'
                      : 'w-2 bg-white/20 hover:bg-white/45'
                )}
                onClick={() => setStepIndex(s.index)}
                aria-label={`Jump to step ${s.index}: ${s.title}`}
                aria-selected={dotActive}
                role="tab"
              />
            );
          })}
        </div>

        <Separator />

        {/* Control bar */}
        <footer className="flex items-center justify-between gap-2 px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDontShow}
            className="text-[11px] text-white/55 hover:text-white/85"
          >
            Don&apos;t show again
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              variant="subtle"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
              className="h-8 px-3 text-[11px]"
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="h-8 px-3 text-[11px]"
            >
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </footer>
      </Glassmorphism>
    </div>
  );
}

TutorModal.displayName = 'TutorModal';
