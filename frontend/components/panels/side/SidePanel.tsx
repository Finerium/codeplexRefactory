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

  const variant = modeToVariant(currentMode);

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

  return (
    <Glassmorphism
      variant="default"
      forwardRef={ref}
      className={cn(
        'city-panel-mounted flex h-full flex-col text-white/85',
        className
      )}
      data-panel="side"
      data-mode={currentMode}
      role="region"
      aria-label="Side panel (mode HUD)"
    >
      <header className="flex flex-col gap-2 px-3 py-2.5">
        <p className="font-mono text-[9px] uppercase tracking-widest text-codeplex-ember">
          Mode HUD
        </p>
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
