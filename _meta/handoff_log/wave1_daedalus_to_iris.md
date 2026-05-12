# Handoff: Daedalus to Iris (Wave 1)

**Date**: 2026-05-12 18:50 WIB
**Producer**: Daedalus (Wave 1 builder, 3D scene scaffold)
**Consumer**: Iris (Wave 1 builder, building geometry + InstancedMesh + treemap)
**Trigger**: Daedalus ship-clean. Iris consumes scene scaffold to mount building instances as direct children of `ChronicleCanvas`.
**Edge contract**: `_meta/contracts/daedalus-to-iris.md` (Pythia locked Wave 0).

## Output produced (Daedalus to Iris)

### Public API exports (from `@/scene` barrel)

```typescript
// frontend/src/scene/index.ts re-exports
export { ChronicleCanvas } from './Canvas';
export { usePerformanceState } from './PerformanceContext';
export { FEATURE_FLAGS } from './feature-flags';
export type { ChronicleCanvasProps, PerformanceState, FeatureFlags } from './types';
```

### Mount pattern (Iris implements verbatim per Pythia contract)

```tsx
// Iris authors frontend/src/scene/CityScene.tsx (or equivalent root composite)
'use client';
import { ChronicleCanvas } from '@/scene';
import { BuildingInstances } from './buildings/BuildingInstances';

export function CityScene({ buildings }: { buildings: BuildingData[] }) {
  return (
    <ChronicleCanvas>
      <BuildingInstances data={buildings} />
    </ChronicleCanvas>
  );
}
```

### Public type contract (Iris consumes)

```typescript
export interface ChronicleCanvasProps {
  children: React.ReactNode;
  paused?: boolean;                              // default false
  cameraTarget?: [number, number, number];       // default [0, 0, 0]
  cameraPosition?: [number, number, number];     // default [0, 50, 80]
  className?: string;                            // default 'fixed inset-0 h-screen w-screen'
}

export interface PerformanceState {
  qualityFactor: number;                         // 0 to 1, PerformanceMonitor factor
  regressing: boolean;                           // true if regress fired in last 2s
}

export interface FeatureFlags {
  readonly ENABLE_DOF: boolean;
  readonly ENABLE_SPARKLES_TIER_3: boolean;
  readonly ENABLE_THIRD_DIRECTIONAL_LIGHT: boolean;
}
```

## Asumption baked (Daedalus to Iris)

1. **r3f@9.6 + Three.js 0.184 + React 19 stack stable**: per PRD Section 17 lock + Phase B Topic D confirmation. Daedalus did NOT independently verify pnpm install in this session (capacity respect); Eunomia validates empirically.
2. **Raw `<instancedMesh>` per r3f issue 3306**: Daedalus smoke harness uses raw primitive; Iris MUST follow same pattern across all 5 archetype meshes. Drei `<Instances>` rejected by lock anchor.
3. **Sparkles owned by Daedalus**: Iris MUST NOT mount additional Sparkles. The tier-3 layout (1500 / 800 / 300 particles, 3 density bands) is canonical. If Iris wants per-building particle effects, use raw `<points>` or `<sprite>` outside Sparkles namespace.
4. **EffectComposer owned by Daedalus**: Iris MUST NOT mount additional EffectComposer or post-processing effects. If Iris needs a per-building glow effect, encode it via emissive material on the InstancedMesh material, NOT a separate post pass.
5. **Performance state via React Context, not Zustand**: per Pythia contract Asumption 4. Iris reads `usePerformanceState()` for LOD coordination.
6. **Drop-first regress order is canonical**: stage 1 DOF, stage 2 pixel ratio, stage 3 Sparkles. Iris LOD layer should engage somewhere between stages (e.g., reduce instance count on `regressing === true`, simplify roof geometry when `qualityFactor < 0.7`).
7. **CameraShake stub left as comment**: Wave 3 Nemesis wires real trigger via Apollo finding cluster severity. Iris does NOT mount CameraShake.
8. **HDRI Environment preset "night"**: Iris ownership color encoding should be tuned against the near-black ambient. Wave 1 mock data uses `BuildingData.ownership` color drawn from a contrasting palette (Iris owns palette decision).

## Validation needed by consumer (Iris)

1. **Confirm `@/scene` barrel import works**: Iris should be able to `import { ChronicleCanvas, usePerformanceState } from '@/scene'` and the path alias resolves via tsconfig.json `paths`.
2. **Append building exports to barrel**: at the end of `frontend/src/scene/index.ts`, append:
   ```typescript
   export * from './buildings';
   ```
   This re-exports `BuildingData`, `DistrictData`, `CityData`, archetype types, plus any helpers from `frontend/src/scene/buildings/index.ts` (Iris authors that index file). Daedalus left a comment line marker.
3. **Smoke test the Iris consumer mount**: Iris should author a sibling smoke at `frontend/src/scene/__smoke__/buildings.smoke.tsx` or extend `canvas.smoke.tsx` to swap PlaceholderCity for BuildingInstances at full scale. Eunomia H1 audit hits the new mount.
4. **Read `frontend/src/scene/Canvas.tsx` lines 280 to 460**: the ChronicleCanvas component body documents the regress flow + drop-first ladder + WebGL2 fallback. If Iris LOD logic surprises Daedalus, both workers should re-sync via ferry to V1 Orch BEFORE Eunomia audit.

## Edge case handling (Daedalus owns)

- **WebGL2 unavailable**: ChronicleCanvas renders `chronicle-fallback-panel` copy and does NOT mount children. Iris gracefully invisible in this branch.
- **iOS Safari < 17**: ENABLE_DOF forced false regardless of env. Iris LOD does not need to special-case (just reads `usePerformanceState()`).
- **Browser tab hidden**: Canvas defaults `frameloop="always"` to keep idle drift cinematic. `paused` prop only stops OrbitControls auto-rotate; render loop continues. Iris BuildingInstances should NOT throw during invisible tab.
- **High DPI**: pixel ratio cap is dynamic state `[1, 2]` normal, drops to `1` at factor < 0.70.

## Open questions for Iris

1. **OQ-06 stub location**: Daedalus left CameraShake mount slot as comment in Canvas.tsx line 455. Wave 3 Nemesis wires real trigger. Iris does NOT need to coordinate with this slot, but should know it exists for future-proofing.
2. **Iris LOD coordination window**: at what `qualityFactor` threshold does Iris start dropping LOD detail? Daedalus recommends 0.85 (matches DOF drop) for symmetry. Iris owns the call.

## References

- Pythia contract `_meta/contracts/daedalus-to-iris.md` (locked Wave 0).
- Daedalus decision log `_meta/decision_log/daedalus.md` (D1 to D7 covers all scaffold decisions).
- Daedalus uncertainty journal `_meta/uncertainty/daedalus-cycle1-20260512-1850.md` (3 medium concerns, none ferry-worthy).
- Daedalus V_n snapshot `_meta/orchestration_log/V1_daedalus_canvas_20260512-1850.md` (locked, no further edit without V_n+1).
- PRD Section 13 Visual Quality Bar + Section 17 Tech Stack Lock.
- Phase B Topic D anchors: r3f 3306 raw instancedMesh, drop-first feature flag order, state.performance.regress canonical.

## Ship status

**Daedalus**: ship-clean. No ferry. Awaiting Iris ship-clean parallel and Eunomia Wave 1 audit gate.
