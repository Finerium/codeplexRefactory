'use client';

/**
 * SidePanel: composite root + variant router.
 *
 * Authored by Persephone (Wave 2). Mount point:
 * `frontend/app/city/@side/page.tsx`.
 *
 * Mode-driven variant selection:
 *   - refactor mode -> RefactorReviewVariant
 *   - health mode   -> HealthFindingsVariant
 *   - activity mode -> ActivityDrilldownVariant
 *   - onboarding/sprint/dashboard -> placeholder hint (mode does not surface here)
 *
 * Mode switch toolbar in header lets user pick variant manually (independent
 * of chat panel + ticket panel).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { cn } from '@/lib/utils';
import { useSlideTransition } from '@/lib/panel-motion';
import { Glassmorphism } from '@/components/panels/Glassmorphism';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  usePanelStore,
  modeToVariant,
  type SidePanelVariant,
} from '@/lib/panel-context';
import type { CurrentMode } from '@/lib/chat';
import { RefactorReviewVariant } from './RefactorReviewVariant';
import { HealthFindingsVariant } from './HealthFindingsVariant';
import { ActivityDrilldownVariant } from './ActivityDrilldownVariant';

export interface SidePanelProps {
  className?: string;
}

const VARIANT_TO_MODE: Record<SidePanelVariant, CurrentMode> = {
  refactor: 'refactor',
  health: 'health',
  activity: 'activity',
};

function VariantBody({ variant }: { variant: SidePanelVariant | null }) {
  if (variant === 'refactor') return <RefactorReviewVariant />;
  if (variant === 'health') return <HealthFindingsVariant />;
  if (variant === 'activity') return <ActivityDrilldownVariant />;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
        Side panel idle
      </p>
      <p className="text-[11px] text-white/55">
        Switch to Refactor, Health, or Activity mode to surface a panel here.
      </p>
    </div>
  );
}

export function SidePanel({ className }: SidePanelProps) {
  const currentMode = usePanelStore((s) => s.currentMode);
  const setMode = usePanelStore((s) => s.setMode);
  const sideCollapsed = usePanelStore((s) => s.sideCollapsed);
  const setSideCollapsed = usePanelStore((s) => s.setSideCollapsed);

  const variant = modeToVariant(currentMode);

  // Wave-Fixing cycle 1 (Persephone, 20260513-0148, C-7 fix): always slide
  // open. The collapsed state renders a separate small restore-button
  // surface (see below) so the SidePanel toggle UI is never lost. The slot
  // CSS shrinks the dock width to ~3.5rem when collapsed so the City canvas
  // beneath remains uncovered + clickable.
  const { ref } = useSlideTransition({
    direction: 'left',
    open: true,
    duration: 0.3,
  });

  // Tab-driven variant override: user clicks one of 3 mode buttons in header.
  const onVariantSwitch = (value: string) => {
    const v = value as SidePanelVariant;
    setMode(VARIANT_TO_MODE[v]);
  };

  if (sideCollapsed) {
    return (
      <Glassmorphism
        variant="default"
        forwardRef={ref}
        className={cn(
          'city-panel-mounted flex h-full items-start justify-center pt-3',
          className
        )}
        data-panel="side"
        data-collapsed="true"
        data-mode={currentMode}
        role="region"
        aria-label="Side panel mode HUD (collapsed)"
      >
        <Button
          variant="icon"
          size="icon"
          onClick={() => setSideCollapsed(false)}
          aria-label="Show mode HUD panel"
          title="Show mode HUD panel"
          className="h-11 w-11 text-white/70 hover:text-white"
        >
          <span aria-hidden className="font-mono text-lg leading-none">
            {'>'}
          </span>
        </Button>
      </Glassmorphism>
    );
  }

  return (
    <Glassmorphism
      variant="default"
      forwardRef={ref}
      className={cn(
        'city-panel-mounted flex h-full flex-col text-white/85',
        className
      )}
      data-panel="side"
      data-collapsed="false"
      data-mode={currentMode}
      role="region"
      aria-label="Side panel (mode HUD)"
    >
      <header className="flex flex-col gap-2 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-widest text-codeplex-ember">
            Mode HUD
          </p>
          <Button
            variant="icon"
            size="icon"
            onClick={() => setSideCollapsed(true)}
            aria-label="Collapse mode HUD panel"
            title="Collapse mode HUD panel"
            className="h-11 w-11 text-white/55 hover:text-white"
          >
            <span aria-hidden className="font-mono text-lg leading-none">
              {'<'}
            </span>
          </Button>
        </div>
        <Tabs
          value={variant ?? 'activity'}
          onValueChange={onVariantSwitch}
        >
          <TabsList className="w-full">
            <TabsTrigger value="refactor" className="flex-1">
              Refactor
            </TabsTrigger>
            <TabsTrigger value="health" className="flex-1">
              Health
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <Separator />

      <div className="flex flex-1 flex-col overflow-hidden p-2">
        <VariantBody variant={variant} />
      </div>
    </Glassmorphism>
  );
}

SidePanel.displayName = 'SidePanel';
