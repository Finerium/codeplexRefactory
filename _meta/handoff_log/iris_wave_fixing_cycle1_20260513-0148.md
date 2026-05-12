---
actual_timestamp: 20260513-0148
agent: Iris
identity: Iris rescue identity, Wave-Fixing cycle 1
scope_bugs:
  - C-2 (City visual gelap + gedung dempet ga ada glow window + landmark not distinct)
verdict_per_bug:
  C-2: SHIPPED (3 sub-fix: shader emissive window grid + 5 archetype landmark variant + spacing margin)
code_files_touched:
  - frontend/lib/marketing/cityEngine.ts
deferred_reasons: []
daedalus_coordination_notes:
  - Bloom interaction: emissive HDR multiplier 2.4x with ACES tonemap. If Daedalus Bloom threshold > 1.0 the window grid will bloom. Recommend Bloom luminanceThreshold ~0.6 + intensity ~0.4. NOT my scope.
  - Renderer toneMappingExposure left at 1.25 (Daedalus owns). City night-look would need exposure ~0.9, but per directive lock day palette boot it should stay 1.25.
  - Hemi + key + cool lights NOT touched. If scene still too dark after Daedalus passes, recommend Daedalus consider directional sun-key boost or hemi intensity bump.
  - Fog density default 0.018 + consumer setFog(0.22) yields fog.density = 0.005 + 0.22 * 0.04 = 0.0138. That is reasonable; my buildings should be visible at camera distance 60-70. NOT my scope.
  - PertamaBuka.png blur first-load = DOF or post-processing scope (Daedalus). Suggest verify Daedalus PostPipeline DOF focusDistance default - looks like near-plane focus stuck.
---

# Iris Wave-Fixing cycle 1 handoff

## Scope honored

Owner: BuildingInstances geometry + shader + landmark variant + spacing.
Avoided: scene wrapper (Canvas, renderer, tonemap), lighting setup (hemi, key, cool), fog, post-processing, dust particles, road grid, tree scatter, camera waypoints.

## Bug C-2 verdict: SHIPPED

Three sub-fixes landed di `frontend/lib/marketing/cityEngine.ts`:

### Sub-fix 1: Window glow shader (ReferensiWindows.png style)

Replaced flat `MeshStandardMaterial` for the InstancedMesh main buildings dengan onBeforeCompile patch that injects procedural window-grid emissive shader:

- Force `USE_UV` define so `uv` attribute is declared (MeshStandardMaterial without a uv-using map normally omits it).
- Vertex shader extracts per-instance scale from `instanceMatrix` columns (`length(instanceMatrix[0].xyz)` etc) so we can derive world-space face dimensions from BoxGeometry's 0-1 UV.
- Fragment shader:
  - Side-face mask via `step(abs(vWindowFaceNormal.y), 0.5)` so top + bottom stay flat (no windows on roof).
  - Cell size 0.95 wide x 1.35 tall world-units, scaled by uDensityMul (sparse 0.7 / medium 1.0 / dense 1.4).
  - Per-cell smoothstep rectangle gives panel mask (frame margin 0.18-0.82 of cell).
  - Deterministic per-cell hash decides lit/dark (threshold 0.42) and warm/cool tint (threshold 0.78 warm).
  - Per-cell sine flicker with deterministic phase shift, modulated by uFlicker uniform.
  - Emission multiplied by 2.4 HDR-range, added to `totalEmissiveRadiance` so it composes with MeshStandardMaterial PBR lighting properly (and feeds Bloom downstream).

Uniforms wired to animation tick:
- `uTime` <- clock elapsed
- `uWindowGlow` <- consumer `setWindowGlow(v)` value (default 1.4 from TWEAK_DEFAULTS)
- `uDensityMul` <- consumer `setWindowDensity()` mapping
- `uFlicker` <- consumer `setFlicker()` mapping
- `uWindowCool` + `uWindowWarm` <- recolorScene() syncs to palette saturation

No texture asset dependency. Lock 5 honest: this is procedural, not a texture-loaded asset.

### Sub-fix 2: 5 archetype landmark variant geometry

Replaced 12-line generic-Box landmark cluster with 5 distinct archetypes (53 mesh objects total in landmarksGroup):

| Resident | Archetype | Geometry composition |
|---|---|---|
| Athena (city hall) | Classical temple | 3-tier stepped base (8.5/7.5/6.5 box) + 22 column row (Parthenon-ish 8-front-8-back-3-side-each, CylinderGeometry h=5) + entablature beam + 3-side pediment (ConeGeometry sides=3) + beacon sphere |
| Apollo (hospital) | Cross floor plan | x-arm + z-arm cross extrusion + central rotunda cylinder + dome sphere + spire + red-tint beacon |
| Argus (police) | Surveillance tower | Tall narrow base + mid + overhanging observation deck + cabin + horizontal camera mount bracket + red eye-beacon sphere |
| Clio (library) | Vertical book stack | Reading hall base + 5 thin vertical book-spine boxes (varied heights 5.8-8.2) + roof slab |
| Hermes (tourist info) | Glass beacon | Transparent glass cube (MeshStandardMaterial opacity 0.55 metalness 0.85) + open-ended light pillar cylinder (DoubleSide) + cap beacon sphere + inner light core sphere |

All landmarks use the existing `landmarkMat` MeshStandardMaterial cloned per instance, except Apollo/Argus beacons (red MeshBasicMaterial), Hermes glass (custom translucent), and Hermes pillar/core (warm MeshBasicMaterial). Positions preserve old anchor points (center 0,0,0 + hospital +X 16 + police -X 16 + library -Z 18 + info +Z 16) for camera waypoint compatibility.

### Sub-fix 3: Building spacing margin

Bumped collision spacing minimum squared distance from 5.4 to 9.0 (~3 unit center-to-center vs avg footprint 2.8) per ReferensiWindows.png ~0.5-1.0 unit margin target. Inner ring radius 6 -> 9 and reject threshold 7.5 -> 10.5 so building cluster clears the Athena temple footprint (8.5 wide stepped base). Try-budget raised 4000 -> 6000 to compensate for tighter packing rejection rate; placed count should still hit N=220.

## Compliance check

- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 honest: window grid is PROCEDURAL shader, NOT asset texture. Landmark archetypes use BufferGeometry composites, NOT loaded models. Plain stated in code comments.

## Test plan (manual / Daedalus pair verify)

1. `cd frontend && npm run dev` then visit landing page route at `https://duopoly.hackathon.sev-2.com/`.
2. Verify VisualGedung.png reference shifted: building facades now show grid of glowing window panels (some lit warm, most cool), top/bottom of building flat.
3. Verify 5 landmarks distinguishable at camera waypoint 2-3 (mid-scroll zoom): temple columns + cross hospital + tower police silhouette + book-stack library + glass beacon info.
4. Verify spacing: building no longer touching, road-grid (if Daedalus adds) visible between blocks.
5. Smoke check: console no shader compile error from `WebGLProgram: shader error`.

## Daedalus coordination

If Daedalus wants Bloom pass to amplify the window emissive: recommend `luminanceThreshold ~0.6`, `intensity ~0.4`. My emissive multiplier 2.4 puts lit windows around HDR 1.5-2.0 range, well above Bloom 0.6 threshold.

If first-load blur (C-1, Daedalus scope) is DOF related: my emissive shader is unaffected by DOF (DOF is a post-process pass) so this fix complements Daedalus's DOF fix without interaction.

## Capacity report

Time: ~75 minutes (within 120 ferry threshold).
No ferry triggers hit.
