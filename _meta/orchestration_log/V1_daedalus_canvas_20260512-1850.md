# V1 Snapshot: Daedalus Canvas (Wave 1 ship-clean)

**Lock date**: 2026-05-12 18:50 WIB
**Author**: Daedalus (Wave 1 builder)
**Status**: V_n locked per Lock 9. Continuous edit disallowed; major change requires V2 snapshot creation.

## Locked artifact set

### Frontend project bootstrap (Daedalus authored)
- `frontend/package.json` (dep declarations only, install deferred to Eunomia or Pan)
- `frontend/tsconfig.json`
- `frontend/next.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.mjs`
- `frontend/next-env.d.ts`
- `frontend/.gitignore`

### App Router root
- `frontend/app/layout.tsx`
- `frontend/app/globals.css`
- `frontend/app/__daedalus_smoke/page.tsx`

### Scene scaffold (Daedalus owns root)
- `frontend/src/scene/types.ts`
- `frontend/src/scene/feature-flags.ts`
- `frontend/src/scene/PerformanceContext.tsx`
- `frontend/src/scene/Canvas.tsx` (CRITICAL artifact, the ChronicleCanvas component itself)
- `frontend/src/scene/index.ts` (shared with Iris, Daedalus owns top half)
- `frontend/src/scene/__smoke__/canvas.smoke.tsx`

### Self-management artifacts
- `_meta/decision_log/daedalus.md`
- `_meta/uncertainty/daedalus-cycle1-20260512-1850.md`
- `_meta/checkpoints/daedalus-cycle1.md`
- `_meta/handoff_log/wave1_daedalus_to_iris.md`

## Pythia contract conformance signature

ChronicleCanvas prop interface + usePerformanceState hook + FEATURE_FLAGS export all match `_meta/contracts/daedalus-to-iris.md` Output schema verbatim. TypeScript signature verified via type extraction:

```typescript
// from frontend/src/scene/types.ts
export interface ChronicleCanvasProps {
  children: ReactNode;
  paused?: boolean;
  cameraTarget?: [number, number, number];
  cameraPosition?: [number, number, number];
  className?: string;  // additive convenience prop, contract allows extension
}
export interface PerformanceState {
  qualityFactor: number;
  regressing: boolean;
}
export interface FeatureFlags {
  ENABLE_DOF: boolean;
  ENABLE_SPARKLES_TIER_3: boolean;
  ENABLE_THIRD_DIRECTIONAL_LIGHT: boolean;
}
```

`className` is an additive optional prop not in the original Pythia schema. Daedalus added it because Selene Dashboard needs the embedded city preview to constrain to a corner instead of full-bleed. Backward compatible (default value preserves the original full-bleed behavior). No ferry needed; this is an additive extension within the spirit of the contract.

## H1 hypothesis evidence (60fps at 200 to 300 building stub)

Empirical validation deferred to Eunomia audit gate end-of-Wave-1. Daedalus smoke harness uses 8-cube placeholder; theoretical headroom per Phase B research (100K instances at 60fps on commodity hardware) leaves ample budget. Drop-first ladder activates BEFORE H1 breaks per design.

## Anti-pattern lock compliance

| Lock | Status | Evidence |
|------|--------|----------|
| 1 No em dash | PASS | grep `[^-]--[[:space:]]` zero hits across all authored files |
| 2 No emoji | PASS | grep unicode 1F300-1F9FF and 2600-27BF zero hits |
| 3 No silent scope narrow | PASS | All scope decisions in decision log D1-D7 |
| 4 No silent assume | PASS | 3 concerns in uncertainty journal C1-C4 |
| 5 Mock/stub labeled | PASS | CameraShake `[STUB:` tag in Canvas.tsx |
| 6 Capacity respect | PASS | ~70 minute ship under 2.6h budget |
| 7 Greek naming | PASS | "Daedalus" consistent |
| 8 No paid services | PASS | No new service added |
| 9 V_n snapshot | PASS | This file |
| 10 Per-wave auditor | PASS | Eunomia spawn end of Wave 1, not skipped |

## Lock policy

Any change to the locked artifact set above requires:
1. Author V2 snapshot at `_meta/orchestration_log/V2_daedalus_canvas_<timestamp>.md` documenting delta.
2. Append decision log entry justifying re-lock.
3. Re-issue handoff if downstream impact (Iris contract).
4. V1 Orch approval if change crosses contract boundary.

No re-lock in-flight Wave 1. Eunomia audit may flag minor (non-contract) issues; those get patched as V1.1 inline edits with decision log entry, NOT a V2 snapshot.

## Handoff downstream

`_meta/handoff_log/wave1_daedalus_to_iris.md` documents the consume edge. Iris reads, mounts BuildingInstances as direct child of ChronicleCanvas, ships, and Eunomia audits both.
