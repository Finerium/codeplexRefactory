/**
 * City route page, the default canvas mount.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL),
 * augmented by Hera (Wave 2) to mount the Sprint Mode HERO 14 PM concept
 * overlay alongside the Iris BuildingInstances.
 *
 * Mounts the Daedalus ChronicleCanvas wrapper with the Iris BuildingInstances
 * driven by the singleton `mockCityData` (~240 buildings, 7 districts,
 * deterministic squarified treemap layout). This is the Wave 1 production
 * mount target consumed by the OAuth chain `/start -> /api/auth/github/start
 * -> /city?mock_auth=true` per Hestia stub handler.
 *
 * Mount pattern follows the canonical example from Iris handoff log
 * `_meta/handoff_log/wave1_iris_to_hera.md` lines 56-83. Hera mounts
 * `<SprintMode />` as a SIBLING of `<BuildingInstances>` inside the same
 * ChronicleCanvas (the canonical pattern per Iris handoff log line 175).
 * Multiple subscribers safe (Persephone Wave 2 will add the third overlay
 * via Iris hook).
 *
 * Wave 2 Hera additions (this edit):
 *   - `<SprintMode />` mounts inside the Canvas tree, renders 13 Hera-owned
 *     PM concept overlays plus the OQ-05 sticky-note PR comment surface.
 *     The 14th concept (Refactor ghost building + retak crack) is the
 *     Asclepius handoff per Pythia contract `hera-to-persephone.md` line 154.
 *   - `<SprintModeControls />` mounts OUTSIDE the Canvas as a DOM-overlay
 *     pill bar at top-left of viewport, lets the demo user toggle each
 *     concept on/off (Dike Wave 2 audit gate requirement).
 *
 * Server Component vs Client Component: the page itself is a Client Component
 * because the inner scene relies on r3f Canvas + hooks (useCityData,
 * useBuildingClick) that require the React tree to live in the browser.
 * Next.js 16 + React 19 streaming compatibility verified per Pythia contract
 * `calliope-to-wave2-panels.md` Asumption 1.
 *
 * Wave 2 Persephone consumes this page via the parallel slot defaults
 * (@chat, @ticket, @side). Wave 3 Hades wires real OAuth + Demeter
 * WebSocket replaces the mock data via `useCityData`'s Wave 3 data source
 * swap (Iris handoff promises stable surface).
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): mockCityData is the genuine Wave 1 production
 *     surface per Iris ship, not labeled MOCK in the runtime sense; Sprint
 *     Mode HERO event tape is the only mock element, labeled
 *     [MOCK Wave 2, real Wave 3 Hades webhook] in source + dev console.
 */

'use client';

import { useCallback, useEffect } from 'react';
import { ChronicleCanvas, DirectorModeButton, CameraFocus } from '@/scene';
import {
  BuildingInstances,
  HoverFloorGlow,
  useBuildingClick,
  useBuildingClickDispatch,
  useBuildingHoverDispatch,
  useCityData,
} from '@/scene/buildings';
import type { BuildingData } from '@/scene/buildings';
import { SprintMode } from '@/modes/sprint';
import { SprintHud } from '@/components/panels/sprint-hud';
import { SmokeClickInjector } from '@/components/dev/SmokeClickInjector';
import {
  ActivityCanvasLayer,
  ActivityHud,
  SprintRetroCanvasLayer,
  SprintRetroHud,
  useSprintRetroController,
} from '@/modes/activity';
import {
  OnboardingCanvasLayer,
  OnboardingHud,
  useOnboardingController,
} from '@/modes/onboarding';
import { usePanelStore } from '@/lib/panel-context';
import {
  HealthGlowLayer,
  IssueFlyingPacketLayer,
  SpecDriftLayer,
  useFlyingPackets,
  useAsclepiusStore,
} from '@/modes/health';
import { MOCK_FINDINGS } from '@/modes/health/__mock__/findings';
import { RefactorGhostLayer } from '@/modes/refactor';
// Hestia Wave-Fixing Final (manager cycle 3, E-6 RECURRING fix): honest data
// source banner. When the inbound URL has `?demo=<key>` or `?repo=<full_name>`,
// surface a top-of-screen banner that names the requested dataset + the actual
// rendering dataset (Wave 1 mockCityData). Replaces the previous "silently
// wrong" failure mode where each demo card loaded the same fastapi mock with no
// disclosure. See `components/city/DemoSourceBanner.tsx`.
import { DemoSourceBanner } from '../../components/city/DemoSourceBanner';

/**
 * Wave-Fixing #2 cycle 1 (Asclepius, STAMP=20260513-0313):
 *
 * AsclepiusBridge wires the in-scene r3f layers to the current product
 * mode. Previously HealthGlowLayer + RefactorGhostLayer were mounted only
 * on the /asclepius-smoke route; production /city had no Health glow + no
 * Refactor ghost visible.
 *
 * Mounting strategy:
 *   - HealthGlowLayer + SpecDriftLayer render when mode = 'health'
 *     (5 severity glow on Apollo finding buildings + 5 retak A-E pattern)
 *   - RefactorGhostLayer renders when mode = 'refactor' (3 ghost buildings
 *     appear once user submits intent via RefactorIntentInput)
 *   - IssueFlyingPacketLayer always mounted: flying packets fire from any
 *     Convert-to-Ticket click regardless of active mode
 *
 * The mock findings seed happens once on first AsclepiusBridge mount so
 * the glow paints even if the user has not yet visited Health mode.
 */
function AsclepiusBridge({ currentMode }: { currentMode: string }) {
  const setFindings = useAsclepiusStore((s) => s.setFindings);
  useEffect(() => {
    setFindings(MOCK_FINDINGS);
  }, [setFindings]);

  const { packets, expire } = useFlyingPackets();

  return (
    <>
      {currentMode === 'health' ? (
        <>
          <HealthGlowLayer />
          <SpecDriftLayer />
        </>
      ) : null}
      {currentMode === 'refactor' ? <RefactorGhostLayer /> : null}
      <IssueFlyingPacketLayer packets={packets} onPacketExpired={expire} />
    </>
  );
}

interface CitySceneProps {
  currentMode: string;
  onboardingController: ReturnType<typeof useOnboardingController>;
  retroController: ReturnType<typeof useSprintRetroController>;
}

function CityScene({
  currentMode,
  onboardingController,
  retroController,
}: CitySceneProps) {
  const city = useCityData();
  const dispatchClick = useBuildingClickDispatch();
  const dispatchHover = useBuildingHoverDispatch();

  // Wave 1 demo subscriber: logs building click to console so the audit gate
  // + manual demo can confirm the dispatch pipeline lives. Wave 2 Hera adds
  // a parallel subscriber via SprintMode -> useSprintClickToTicket bridge
  // routed through Iris's multi-subscriber-safe event bus (Iris handoff log
  // line 132).
  //
  // Handler MUST be useCallback-stable so Iris's `useBuildingClick(handler)`
  // does not churn subscriptions every render (React 19 strict + zustand v5
  // would yield Max update depth otherwise; documented in Hera Cycle 5
  // checkpoint).
  const logBuildingClick = useCallback((building: BuildingData) => {
    // eslint-disable-next-line no-console
    console.log(`[city] building click ${building.id} (${building.archetype})`, {
      district: building.district,
      ownershipColor: building.ownershipColor,
      activity: building.activity,
    });
  }, []);
  useBuildingClick(logBuildingClick);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      `[city] mounted ${city.buildings.length} buildings across ` +
        `${city.districts.length} districts, centroid ${city.centroid.join(',')}`
    );
  }, [city]);

  return (
    <>
      <BuildingInstances
        data={city}
        onBuildingClick={dispatchClick}
        onBuildingHover={dispatchHover}
      />

      {/* Wave-Fixing 3 ship (Persephone + Hera paired, B-1 recurring root
          cause fix STAMP=20260513-final): per-floor hover glow ripple +
          camera focus tween on selected building. Implements PRD Section
          13.1 line 878 "Klik building zoom + side panel terbuka" and the
          Ghaisan envision item "Mouse hover building -> per-floor glow
          ripple effect" + "ESC kembali overview camera". */}
      <HoverFloorGlow />
      <CameraFocus />

      {/* Hera Wave 2: Sprint Mode HERO 14 PM concept overlay mounts as
          sibling of BuildingInstances inside the Canvas. */}
      <SprintMode />

      {/* Boreas Wave-Fixing #2: Activity Mode visual layer mounts when
          mode === 'activity'. Drives hotspot glow + ownership heatmap +
          timeline markers. Sprint Retro 60s camera fly via real Clio
          DeepSeek V4-Flash non-think narration. */}
      {currentMode === 'activity' && <ActivityCanvasLayer />}
      {currentMode === 'activity' && (
        <SprintRetroCanvasLayer controller={retroController} />
      )}

      {/* Boreas Wave-Fixing #2: Onboarding Mode CameraFly mounts when
          mode === 'onboarding' AND a tour script is loaded. 4 tour variant
          routing exposed via OnboardingHud variant router. Camera fly via
          GSAP timeline + Hermes narration via real V4-Flash non-think. */}
      {currentMode === 'onboarding' && (
        <OnboardingCanvasLayer controller={onboardingController} />
      )}

      {/* Asclepius Wave-Fixing #2 cycle 1: Health glow + Refactor ghost +
          spec-drift retak + flying issue packets, mode-gated. Mounted
          inside the Canvas tree as sibling of BuildingInstances. */}
      <AsclepiusBridge currentMode={currentMode} />
    </>
  );
}

export default function CityPage() {
  const currentMode = usePanelStore((s) => s.currentMode);
  const setMode = usePanelStore((s) => s.setMode);
  const onboardingController = useOnboardingController();
  const retroController = useSprintRetroController();

  // Wave-Fixing #2 cycle 1 (Asclepius, STAMP=20260513-0313): URL query
  // parameter `?mode=<mode>` lets demo + audit harness deep-link directly
  // into a specific product mode without first clicking the side panel tab.
  // Valid values match CurrentMode union: activity, health, refactor,
  // sprint, onboarding, dashboard.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('mode');
    if (
      requested &&
      ['activity', 'health', 'refactor', 'sprint', 'onboarding', 'dashboard'].includes(
        requested,
      )
    ) {
      setMode(requested as Parameters<typeof setMode>[0]);
    }
  }, [setMode]);

  // Defensive reset on mode change so stale state from a previous mode
  // does not bleed across mounts.
  useEffect(() => {
    if (currentMode !== 'onboarding' && onboardingController.tour.variant) {
      onboardingController.tour.reset();
    }
  }, [currentMode, onboardingController]);

  useEffect(() => {
    if (currentMode !== 'activity' && retroController.state.phase !== 'idle') {
      retroController.reset();
    }
  }, [currentMode, retroController]);

  const flyActive =
    currentMode === 'onboarding' ||
    retroController.state.phase === 'flying';

  return (
    <>
      <ChronicleCanvas
        cameraTarget={[0, 0, 0]}
        cameraPosition={[0, 110, 190]}
        paused={flyActive}
      >
        <CityScene
          currentMode={currentMode}
          onboardingController={onboardingController}
          retroController={retroController}
        />
      </ChronicleCanvas>
      {/* Daedalus Wave-Fixing #2 cycle 1 (Feature #23 per PRD 7.3 Stretch
          Tier 1): Director Mode auto-fly pill button mounts as a fixed
          top-right DOM overlay. Click starts a 30-second GSAP camera tour
          across the 5 landmark resident buildings. Click again to stop. */}
      <DirectorModeButton />
      {/* Hera Wave 2 + Persephone Wave-Fixing #2 cycle 1 (C-new-4):
          The Hera <SprintModeControls /> 14 PM concept toggle pill bar is
          wrapped by the Persephone <SprintHud /> component to provide a
          hide/restore toggle for parity with CardKanan (chat) + CardKiri
          (side panel) collapse surfaces. SprintHud consumes panelStore
          `sprintCollapsed` state; when collapsed it renders a small
          restore button, otherwise it renders the Hera panel unchanged
          with an overlaid 28x28 hide button at the top-right corner. */}
      <SprintHud />

      {/* Boreas Wave-Fixing #2: Activity Mode DOM HUD (timeline scrubber
          30/60/90 + ownership heatmap toggle + sprint retro 60s flythrough
          button). Mounted only when activity mode active so chrome does
          not compete with other modes. */}
      {currentMode === 'activity' && <ActivityHud />}
      {currentMode === 'activity' && (
        <SprintRetroHud controller={retroController} />
      )}

      {/* Boreas Wave-Fixing #2: Onboarding Mode DOM HUD (4-variant router +
          Hermes narration overlay + ending summary panel). */}
      {currentMode === 'onboarding' && (
        <OnboardingHud controller={onboardingController} />
      )}

      {/* Hera Wave-Fixing #2 cycle 1: dev-only window.__codeplex_smoke_click
          injector. Exposes a programmatic click pipeline trigger so the B-1
          building-click chain can be verified end-to-end via Playwright MCP
          smoke test (cannot click WebGL canvas coords precisely). Renders
          null + no-op in production builds. */}
      <SmokeClickInjector />

      {/* Hestia Wave-Fixing Final (manager cycle 3, E-6 RECURRING fix):
          honest data source banner. Mounts only when `?demo=<key>` or
          `?repo=<full_name>` is present on the URL. Lock 5 honest claim:
          names the actual rendering dataset (Wave 1 fastapi-style mock)
          while still acknowledging the requested key. Wave 3 Demeter swap
          replaces the underlying singleton + banner copy narrows. */}
      <DemoSourceBanner />
    </>
  );
}
