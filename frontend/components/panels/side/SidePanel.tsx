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

import { useEffect } from 'react';
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
import { SelectedBuildingDetail } from './SelectedBuildingDetail';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SidePanelProps {
  className?: string;
}

const VARIANT_TO_MODE: Record<SidePanelVariant, CurrentMode> = {
  refactor: 'refactor',
  health: 'health',
  activity: 'activity',
};

function VariantBody({
  variant,
  currentMode,
}: {
  variant: SidePanelVariant | null;
  currentMode: CurrentMode;
}) {
  if (variant === 'refactor') return <RefactorReviewVariant />;
  if (variant === 'health') return <HealthFindingsVariant />;
  if (variant === 'activity') return <ActivityDrilldownVariant />;
  // Manager FINAL Cycle 4 (Persephone, Cluster 11): onboarding mode has no
  // side panel surface (Boreas OnboardingHud overlays the canvas instead).
  // Surface a hint pointing user at the overlay so the tab click does not
  // appear inert.
  if (currentMode === 'onboarding') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
          Onboarding tour active
        </p>
        <p className="text-[11px] text-white/55">
          Hermes is guiding the tour overlay. The side panel surfaces Refactor,
          Health, or Activity drilldowns when active.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
        Side panel idle
      </p>
      <p className="text-[11px] text-white/55">
        Switch to Onboarding, Refactor, Health, or Activity mode to surface a
        panel here.
      </p>
    </div>
  );
}

export function SidePanel({ className }: SidePanelProps) {
  const currentMode = usePanelStore((s) => s.currentMode);
  const setMode = usePanelStore((s) => s.setMode);
  const sideCollapsed = usePanelStore((s) => s.sideCollapsed);
  const setSideCollapsed = usePanelStore((s) => s.setSideCollapsed);
  // Wave-Fixing #3 Manager FINAL (Asclepius, HEALTH-MOCK-SUSPECT verify): allow
  // a one-shot `?mode=health|refactor|activity` URL query param to set the
  // initial side panel mode. Useful for deeplinks, Playwright smoke tests and
  // pitch demos. Effect runs once at mount; subsequent user clicks via the
  // tab strip override.
  // Manager FINAL Cycle 4 (Persephone, Cluster 11): onboarding added per Pan
  // audit #17 verdict (Onboarding tab missing from /city HUD mode switcher,
  // PRD Section 15 demo flow step 4 requires HUD click).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (
      m === 'health' ||
      m === 'refactor' ||
      m === 'activity' ||
      m === 'onboarding'
    ) {
      setMode(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Wave-Fixing #2 cycle 1 (Persephone): selected building drives the
  // "Selected building" detail surface at top of the side panel content per
  // PRD Section 13.1 line 878 (contributor + commits + issues + PR + file
  // metadata when user clicks a building).
  const selectedBuildingId = usePanelStore((s) => s.selectedBuildingId);

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

  // Tab-driven mode override: user clicks one of 4 mode buttons in header.
  // Manager FINAL Cycle 4 (Persephone, Cluster 11): onboarding added as 5th
  // demo flow entry point per PRD Section 15 step 4. Onboarding has no side
  // panel variant; clicking the tab sets mode -> OnboardingHud overlay mounts
  // via /city/page.tsx mode-gated render (line 375).
  const onVariantSwitch = (value: string) => {
    if (value === 'onboarding') {
      setMode('onboarding');
      return;
    }
    const v = value as SidePanelVariant;
    setMode(VARIANT_TO_MODE[v]);
  };

  // Highlighted tab: when user is in onboarding mode, surface 'onboarding'
  // as the active tab; otherwise use the mode-derived variant. Falls back to
  // 'activity' for modes that do not surface here (sprint, dashboard) so the
  // strip never renders without an active highlight.
  const activeTab: string =
    currentMode === 'onboarding' ? 'onboarding' : variant ?? 'activity';

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
          value={activeTab}
          onValueChange={onVariantSwitch}
        >
          <TabsList className="w-full">
            <TabsTrigger value="onboarding" className="flex-1">
              Onboarding
            </TabsTrigger>
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

      <ScrollArea className="flex-1 px-2 py-2">
        <div className="flex flex-col gap-2">
          {selectedBuildingId ? (
            <SelectedBuildingDetail buildingId={selectedBuildingId} />
          ) : null}
          <VariantBody variant={variant} currentMode={currentMode} />
        </div>
      </ScrollArea>
    </Glassmorphism>
  );
}

SidePanel.displayName = 'SidePanel';
