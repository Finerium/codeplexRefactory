# Contract: Daedalus to Iris

**Edge type**: intra-wave (Wave 1 internal)
**Wave**: Wave 1 producer to Wave 1 consumer
**Status**: locked
**Authored**: 2026-05-12 14:50 WIB

## Producer

**Worker**: Daedalus (Wave 1)
**Domain**: 3D scene scaffold via Three.js + @react-three/fiber Canvas, camera setup (PerspectiveCamera + OrbitControls), lighting rig (1 ambient + 2 directional + 1 optional third behind feature flag), fog (linear distance), HDRI skybox via Drei `<Environment>`, post-processing pipeline via `<EffectComposer>` from pmndrs/postprocessing 3.x (Bloom + DepthOfField + Sparkles tier-3), feature flag wiring (ENABLE_DOF, ENABLE_SPARKLES_TIER_3, ENABLE_THIRD_DIRECTIONAL_LIGHT), `state.performance.regress()` listener wired to OrbitControls onChange, Drei `<PerformanceMonitor>` adaptive quality consumer.

## Consumer

**Worker**: Iris (Wave 1)
**Domain**: Building geometry (5 archetype + generic) via raw `<instancedMesh>` per archetype (NOT Drei `<Instances>` per r3f #3306 anchor), `setMatrixAt(index, matrix)` in `useLayoutEffect` for deterministic squarified treemap layout, ownership color encoding via CODEOWNERS regex + git blame mock data Wave 1, LOD via Drei `<Detailed>`, frustum culling automatic.

## Output schema (producer to consumer)

Daedalus exports a React component plus a context hook. Iris imports + mounts buildings as children inside the Canvas.

```typescript
// frontend/src/scene/Canvas.tsx
import { Canvas as R3FCanvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import { Sparkles } from '@react-three/drei';

export interface ChronicleCanvasProps {
  children: React.ReactNode;
  /** When true, disables auto-rotate idle drift; default false. */
  paused?: boolean;
  /** Override default OrbitControls target [x, y, z]; default city centroid. */
  cameraTarget?: [number, number, number];
  /** Override default camera position; default [0, 50, 80]. */
  cameraPosition?: [number, number, number];
}

export const ChronicleCanvas: React.FC<ChronicleCanvasProps>;

// Performance regress context exposed to children for Iris LOD coordination
export interface PerformanceState {
  /** Current adaptive quality factor 0-1 from PerformanceMonitor; 1 = full quality. */
  qualityFactor: number;
  /** True if regress() fired in last 2s; children should consider LOD reduction. */
  regressing: boolean;
}

export const usePerformanceState: () => PerformanceState;

// Feature flag values exposed at runtime via Next.js public env
export const FEATURE_FLAGS: {
  ENABLE_DOF: boolean;          // Default true, drop-first on regress
  ENABLE_SPARKLES_TIER_3: boolean;
  ENABLE_THIRD_DIRECTIONAL_LIGHT: boolean;
};
```

Mount pattern Iris follows:

```tsx
// frontend/src/scene/CityScene.tsx (Iris)
import { ChronicleCanvas } from './Canvas';
import { BuildingInstances } from './buildings/BuildingInstances';

export const CityScene: React.FC<{ buildings: BuildingData[] }> = ({ buildings }) => (
  <ChronicleCanvas>
    <BuildingInstances data={buildings} />
  </ChronicleCanvas>
);
```

## Storage location

- File path: `frontend/src/scene/Canvas.tsx` (Daedalus authors)
- Export points: `frontend/src/scene/index.ts` re-exports `ChronicleCanvas`, `usePerformanceState`, `FEATURE_FLAGS`
- Feature flag values sourced from `process.env.NEXT_PUBLIC_ENABLE_DOF`, `NEXT_PUBLIC_ENABLE_SPARKLES_TIER_3`, `NEXT_PUBLIC_ENABLE_THIRD_DIRECTIONAL_LIGHT` (coerce to boolean)

## Asumption baked

1. r3f@9.6 + Three.js 0.184 + Next.js 16 React 19 stack per PRD Section 17 locked. No prior compatibility verification for r3f@9 with React 19 strict mode required, both confirmed stable per Phase B Topic D.
2. `Sparkles` lives in Drei (not postprocessing) per Phase B Topic D anchor.
3. Drop-first feature flag order on regress: DepthOfField first, then pixel ratio, then Sparkles (per PRD AD-12 + Phase B anchor 8).
4. Performance state is shared via React Context, NOT Zustand store, because perf state is local to scene tree.
5. Iris MAY mount buildings using both r3f primitives AND `useThree` hook for scene introspection; Daedalus does not expose scene refs externally.

## Validation steps

**Producer responsibility (Daedalus)**:
- Canvas boots in <3 seconds on M-series MBP 16GB (per H1 hypothesis Phase B).
- Idle scene (no children, just empty Canvas + camera + lights + post-pipeline) holds 60fps.
- `state.performance.regress()` triggers when OrbitControls onChange fires during camera movement.
- Feature flag toggles via env do not require code change to flip.
- Smoke test: `pnpm dev` then visit landing page mount-target, scene renders with placeholder children.

**Consumer responsibility (Iris)**:
- Import `ChronicleCanvas` from `@/scene` path alias.
- Mount `BuildingInstances` as direct child of `ChronicleCanvas`.
- Subscribe to `usePerformanceState()` and reduce LOD/instance count when `regressing === true`.
- Do NOT mount second `<Canvas>` (would create separate WebGL context).
- Do NOT override `<EffectComposer>` (Daedalus owns post-processing pipeline).

## Edge case handling

- WebGL2 unavailable: Daedalus catches `<Canvas onCreated>` failure, renders fallback `<div>` with copy "Your browser does not support WebGL2. Please use Chrome 90+, Safari 17+, or Edge 90+." Iris does not mount, gracefully.
- Browser tab hidden: Daedalus pauses render via `<Canvas frameloop="demand">` only if `paused === true`. Default always render to keep idle drift cinematic.
- iOS Safari: feature flags `ENABLE_DOF` defaults false if user-agent matches iOS Safari < 17 (DepthOfField shader expensive on Apple WebGL).
- High DPI displays: Daedalus sets pixel ratio to `Math.min(window.devicePixelRatio, 2)`; regress drops to 1 if frame budget exceeded.

## Open questions

- OQ-06 (Earthquake error visual trigger): Daedalus Wave 1 stubs `<CameraShake>` component reference but does NOT wire trigger condition. Nemesis Wave 3 wires real trigger (Apollo critical finding cluster OR Pattern E commit hook bypass). Cross-reference contract `nemesis-to-asclepius.md` (feedback edge).

## Reference

- Metis Agentic Structure md Section 2 DAG: Wave 1 Daedalus to Iris edge
- Metis Section 5.2: Daedalus + Iris ship criteria detail
- PRD Section 8 (architecture) + Section 17 (tech stack locked) + Section 13 (visual quality bar)
- Phase B Deep Research compass_artifact Topic D (Three.js performance): r3f #3306 raw instancedMesh anchor, drop-first feature flag order
- PRD AD-12 (drop-first protocol)
- Feature flag env values: `~/Documents/codeplexRefactory/.env` (`ENABLE_DOF=true`, etc., per sourceoftruth Section 3.4)
