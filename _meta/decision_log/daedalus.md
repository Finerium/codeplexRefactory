# Decision Log: Daedalus (Wave 1)

Append-only. Each decision entry follows the template: id, date, summary, alternatives considered, chosen path, downstream impact, confidence, reference anchors.

## D1: Frontend package layout uses `frontend/` root with `app/` App Router beside `src/scene/`

**Date**: 2026-05-12 18:30 WIB
**Confidence**: High (PRD Section 17 + CLAUDE.md project structure both pin `frontend/`).

**Summary**: Frontend project lives in `frontend/` at repo root. Next.js 16 App Router is rooted at `frontend/app/`. Scene scaffold lives in `frontend/src/scene/`. Path alias `@/scene` resolves to `frontend/src/scene/index.ts`.

**Alternatives considered**:
- `frontend/src/app/` (Next.js supports this via `src/` flag): rejected because Iris already started under `frontend/src/...` and Calliope/Hestia spawned an early `src/app/layout.tsx` skeleton. To avoid conflict between two layout roots, the Daedalus root layout sits in `frontend/app/layout.tsx`. The Calliope-authored `src/app/` tree gets superseded once Calliope reads `_meta/handoff_log/wave1_daedalus_to_iris.md` plus the conventions skill.
- Single `frontend/app/scene/` colocated under App Router routes: rejected because the scene module ships TypeScript types Iris + Hera + Boreas + Persephone all consume; keeping it under `src/scene/` matches the Pythia contract storage location verbatim.

**Chosen**: `frontend/app/` for routes (App Router), `frontend/src/scene/` for Canvas + buildings (Iris subtree).

**Downstream impact**: Calliope must consume the `app/layout.tsx` written here. If Calliope ships a competing layout under `app/`, V1 Orch resolves; Daedalus does not re-author. The `src/app/layout.tsx` left by Calliope is dead code under Next.js 16 unless `pageExtensions` plus `experimental.appDir` source dir was set, which the next.config.ts here does NOT enable.

**References**: PRD Section 17.2, CLAUDE.md Architecture block, Pythia contract `daedalus-to-iris.md` Storage location.

## D2: Raw `<instancedMesh>` adopted in smoke test, signaling pattern to Iris

**Date**: 2026-05-12 18:35 WIB
**Confidence**: High (Phase B Topic D research anchor 7 r3f issue 3306, explicit lock).

**Summary**: The Daedalus smoke harness (`frontend/src/scene/__smoke__/canvas.smoke.tsx`) mounts a placeholder 8-cube city via raw `<instancedMesh>` primitive plus `setMatrixAt` plus `instanceMatrix.needsUpdate = true`. This is the same pattern Iris is expected to use across all 5 archetype meshes per the Pythia contract `iris-to-hera.md` schema.

**Alternatives considered**:
- Drei `<Instances>` plus `<Instance>` JSX: rejected per r3f issue 3306. Even at 8 cubes the smoke would set a bad precedent.
- Plain `<mesh>` cloned 8 times: rejected because the smoke explicitly exercises the InstancedMesh code path Iris will scale to 300.

**Chosen**: raw `<instancedMesh>` primitive in smoke.

**Downstream impact**: Iris BuildingInstances composite continues this pattern. Eunomia H1 audit benchmarks 60fps at 200 to 300 buildings using the same code path; Daedalus smoke verifies the path itself is correct.

**References**: Phase B Topic D anchor 7, Metis Section 8 anchor list, Pythia contract daedalus-to-iris.md Asumption 1.

## D3: Drop-first feature flag ladder uses three monotonic stages with hysteresis

**Date**: 2026-05-12 18:38 WIB
**Confidence**: High (PRD AD-12 + Section 13.4 explicit).

**Summary**: PerformanceMonitor.onChange callback delivers a 0 to 1 factor. The ladder is:
- Factor under 0.85: turn DepthOfField off.
- Factor under 0.70: drop pixel ratio cap from 2 to 1.
- Factor under 0.55: turn Sparkles tier 3 off.

Each stage has a 0.1 hysteresis band to avoid flapping. Vignette plus Noise never drop (they merge into the same EffectComposer pass cheaply). Bloom never drops (defining mood per PRD Section 13.2). Third directional light stays unless its dedicated env flag is off (not regress-driven, owner kill switch).

**Alternatives considered**:
- Drop pixel ratio first (cheapest path): rejected because PRD AD-12 + Phase B anchor 8 both lock DOF-first as the canonical order. Drop pixel ratio is stage 2 by design.
- Drop Sparkles first: rejected. Sparkles tier-3 is the most distinctive visual element per anti-AI-slop discipline; dropping it first would gut the visual identity at the lightest perf nudge.
- Continuous factor-driven blend (e.g., bokeh scale interpolation): rejected for Wave 1 scope. Binary on/off is faster to validate empirically.

**Chosen**: monotonic 3-stage ladder with hysteresis 0.1.

**Downstream impact**: Iris LOD logic reads `regressing` flag from `usePerformanceState()`; it can layer its own LOD drops on top (drop window glow detail, simplify roof geometry) without overlapping the Daedalus ladder. Hera Wave 2 PM concept overlays should NOT mount during stage 2 plus (Hera reads `qualityFactor < 0.7` as gate).

**References**: PRD AD-12, PRD Section 13.4, Phase B Topic D anchor 8.

## D4: Drei `<Environment preset="night">` chosen over custom HDR for Wave 1

**Date**: 2026-05-12 18:40 WIB
**Confidence**: High (capacity ship over polish; PRD Section 13.2 says cinematic but doesn't lock HDR file).

**Summary**: Wave 1 ships the Drei built-in "night" environment preset. Custom HDR (e.g., Poly Haven Kloofendal Misty Morning at 4K) is a Pan post-Wave 3 polish opportunity if capacity allows.

**Alternatives considered**:
- Custom HDR loaded via Drei `<Environment files="...">`: rejected for Wave 1. Adds asset hosting concerns plus a Suspense boundary that can stall the smoke boot under 3 seconds H1 assertion.
- Drei "city" preset: rejected. Bright daylight breaks the cinematic-dark mood (PRD locked dark mode default).
- Drei "sunset" preset: rejected. Beautiful but daylight tier; conflicts with night-themed Sparkles palette plus glowing window aesthetic.

**Chosen**: `<Environment preset="night" background={false}>`. background=false keeps clear color the codeplex-void hex.

**Downstream impact**: Iris ownership color encoding works against a near-black ambient. Pan post-Wave 3 may swap to custom HDR by editing one prop, zero downstream rewrite.

**References**: PRD Section 13.2 (HDRI sunset environment listed as ambitions stretch tier, not locked baseline), Pythia contract ship criteria.

## D5: PerformanceContext React Context, not Zustand store

**Date**: 2026-05-12 18:42 WIB
**Confidence**: High (Pythia contract Asumption 4 explicit lock).

**Summary**: usePerformanceState returns context value. Provider mounted INSIDE Canvas tree, so it is a child of r3f's RootState. Default value returned when used outside Canvas (graceful degradation for storybook-like isolation).

**Alternatives considered**:
- Zustand global store: rejected per Pythia Asumption 4. Performance state is local to the scene tree; cross-tree subscription not needed.
- r3f `useThree(state => state.performance)` direct: rejected because we add a 2-second debounce on top of the raw regress signal that the r3f state does not provide. Wrapping in a context lets us expose the debounced shape cleanly.

**Chosen**: React Context + custom useRegressDebounce hook.

**Downstream impact**: Iris imports `usePerformanceState` from `@/scene`. No store wiring required. If a future Wave 2 worker needs cross-tree perf state, they add a small adapter that bridges context to their own store.

**References**: Pythia contract daedalus-to-iris.md Asumption 4.

## D6: Smoke test mounts at `/__daedalus_smoke` route, removable post-audit

**Date**: 2026-05-12 18:44 WIB
**Confidence**: High.

**Summary**: `frontend/app/__daedalus_smoke/page.tsx` mounts CanvasSmokeHarness for self-validation plus Eunomia H1 60fps probe. NOT a panitia-facing route; underscore prefix signals internal usage.

**Alternatives considered**:
- Storybook setup: rejected for Wave 1 scope (would consume 30 to 60 minutes setup capacity).
- Vitest jsdom smoke: rejected because WebGL2 cannot run in jsdom; would test nothing meaningful.

**Chosen**: dedicated Next.js route for visual smoke. Pan post-Wave 3 can drop the route if PanitSubmission curation flags it.

**Downstream impact**: Eunomia audit script can probe `http://localhost:3000/__daedalus_smoke` directly with Drei `<Perf />` overlay. Calliope landing at `/` is independent.

## D7: Three.js Fog applied imperatively via useEffect, not JSX `<fog>` primitive

**Date**: 2026-05-12 18:45 WIB
**Confidence**: Medium. (See uncertainty journal entry C1.)

**Summary**: Linear fog applied via `scene.fog = new Fog(color, near, far)` inside a useEffect, cleanup sets `scene.fog = null` on unmount. The JSX `<fog>` primitive is supported but can race with HDRI environment loader on first frame (observed in r3f issue threads).

**Alternatives considered**:
- JSX `<fog attach="fog" args={[color, near, far]} />`: works in 90 percent of cases but the race with HDRI preset Suspense fallback has been observed.

**Chosen**: imperative fog set inside useEffect for deterministic ordering with environment Suspense boundary.

**References**: Uncertainty journal `_meta/uncertainty/daedalus-cycle1-20260512-1850.md` concern C1.
