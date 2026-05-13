/**
 * Procedural window-grid emissive shader patch.
 *
 * Owner: Iris (Wave-Fixing #3 final, STAMP 20260513-0551).
 *
 * Ported from `frontend/lib/marketing/cityEngine.ts` (the marketing landing
 * scene already had this working since WF#1). Production /city scene
 * archetype materials were still using plain MeshStandardMaterial with no
 * emissive shader, hence the regression Ghaisan flagged at Day 2 05:51 WIB
 * (window glow ABSENT, building faces flat solid color).
 *
 * Strategy: a single `applyWindowShaderPatch(material, options)` helper that
 * patches any MeshStandardMaterial via `onBeforeCompile` to inject a
 * procedural window-grid emissive fragment shader. Reads per-instance scale
 * from `instanceMatrix` columns in the vertex stage so window cell size stays
 * ~constant regardless of building scale.
 *
 * Per idea-draft H.2 line 410 "lampu-lampu jendela acak per building,
 * building yang sedang aktif diedit glow lebih". The `glow` uniform encodes
 * activity intensity per archetype family.
 *
 * Compliance:
 *  - Lock 5 (no asset dependency): procedural shader only, no texture load
 *  - Lock 1 (no em dash): clean
 *  - Lock 2 (no emoji): clean
 *  - Frustum culling unaffected (vertex stage only adds 3 varyings)
 */

import type { MeshStandardMaterial } from 'three';
import { Color } from 'three';

export interface WindowShaderOptions {
  /**
   * Base glow intensity multiplier 0..1. Active archetypes (landmark, recent
   * commit) should use higher value (0.8-1.0); idle generic 0.4-0.6.
   */
  glow: number;
  /**
   * Window cell density multiplier. 0.6 = sparse, 1.0 = medium, 1.6 = dense.
   * Per idea-draft H.2 active files dense, idle sparse.
   */
  density: number;
  /**
   * Warm window hex color (active file tint). Default codeplex amber.
   */
  windowWarm: string;
  /**
   * Cool window hex color (idle file tint). Default codeplex cool blue.
   */
  windowCool: string;
  /**
   * Optional flicker amount 0..1. 0 disables flicker (cheaper), 1 full flicker.
   */
  flicker?: number;
  /**
   * Optional emissive multiplier boost. Default 2.4 matches marketing.
   */
  emissiveBoost?: number;
}

/**
 * Container for shader uniforms shared across instances of a material. The
 * tick loop in scene controllers can mutate `uTime` per frame to drive
 * flicker animation cheaply.
 */
export interface WindowShaderUniforms {
  uTime: { value: number };
  uWindowGlow: { value: number };
  uWindowCool: { value: Color };
  uWindowWarm: { value: Color };
  uDensityMul: { value: number };
  uFlicker: { value: number };
  uEmissiveBoost: { value: number };
}

/**
 * Default codeplex window palette tuned for the dark night HDRI + bloom
 * intensity 1.05 + tone mapping exposure 1.4 in production Canvas.tsx.
 */
const DEFAULT_WARM = '#ffc878';
const DEFAULT_COOL = '#7d9eff';

/**
 * Patch a MeshStandardMaterial in place to add the procedural window-grid
 * emissive shader. Returns the uniforms container for the tick loop.
 *
 * Material MUST be a MeshStandardMaterial (PBR). The patch injects:
 *  - 3 varyings (vWindowUv, vWindowFaceNormal, vWindowScale)
 *  - 7 uniforms
 *  - ~30 lines fragment shader (cell grid + lit/dark + warm/cool tint)
 *
 * Performance budget: per-fragment cost is ~10 ALU + 2 hash ops. At
 * 200-300 instances * 1080p resolution, well within frame budget per Phase
 * B Topic D anchor (M-series 60fps validated in marketing scene already).
 */
export function applyWindowShaderPatch(
  material: MeshStandardMaterial,
  options: WindowShaderOptions,
): WindowShaderUniforms {
  const warmHex = options.windowWarm ?? DEFAULT_WARM;
  const coolHex = options.windowCool ?? DEFAULT_COOL;

  const uniforms: WindowShaderUniforms = {
    uTime: { value: 0 },
    uWindowGlow: { value: options.glow },
    uWindowCool: { value: new Color(coolHex) },
    uWindowWarm: { value: new Color(warmHex) },
    uDensityMul: { value: options.density },
    uFlicker: { value: options.flicker ?? 1.0 },
    uEmissiveBoost: { value: options.emissiveBoost ?? 2.4 },
  };

  // Force USE_UV so the `uv` attribute is declared in the vertex stage even
  // though we have no diffuse/emissive map. Without this define
  // MeshStandardMaterial omits the uv attribute and the shader patch breaks.
  material.defines = { ...(material.defines ?? {}), USE_UV: '' };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWindowGlow = uniforms.uWindowGlow;
    shader.uniforms.uWindowCool = uniforms.uWindowCool;
    shader.uniforms.uWindowWarm = uniforms.uWindowWarm;
    shader.uniforms.uDensityMul = uniforms.uDensityMul;
    shader.uniforms.uFlicker = uniforms.uFlicker;
    shader.uniforms.uEmissiveBoost = uniforms.uEmissiveBoost;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `
        #include <common>
        varying vec2 vWindowUv;
        varying vec3 vWindowFaceNormal;
        varying vec3 vWindowScale;
        `,
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vec3 instScale = vec3(
          length(instanceMatrix[0].xyz),
          length(instanceMatrix[1].xyz),
          length(instanceMatrix[2].xyz)
        );
        vWindowScale = instScale;
        vWindowUv = uv;
        vWindowFaceNormal = normal;
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `
        #include <common>
        varying vec2 vWindowUv;
        varying vec3 vWindowFaceNormal;
        varying vec3 vWindowScale;
        uniform float uTime;
        uniform float uWindowGlow;
        uniform vec3 uWindowCool;
        uniform vec3 uWindowWarm;
        uniform float uDensityMul;
        uniform float uFlicker;
        uniform float uEmissiveBoost;
        float irisHash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        `,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        // Skip top + bottom faces (normal.y dominant) so roof and base stay
        // flat-shaded. Side faces (|normal.y| < 0.5) carry the window grid.
        float sideMask = step(abs(vWindowFaceNormal.y), 0.5);
        float faceX = mix(vWindowScale.x, vWindowScale.z, abs(vWindowFaceNormal.x));
        float faceY = vWindowScale.y;
        vec2 cellSize = vec2(0.95, 1.35) / max(uDensityMul, 0.2);
        vec2 cellsPerFace = vec2(faceX, faceY) / cellSize;
        vec2 gridUv = vWindowUv * cellsPerFace;
        vec2 cellId = floor(gridUv);
        vec2 cellLocal = fract(gridUv);
        vec2 panel = smoothstep(vec2(0.18), vec2(0.22), cellLocal) *
                     (1.0 - smoothstep(vec2(0.78), vec2(0.82), cellLocal));
        float panelMask = panel.x * panel.y;
        float cellRand = irisHash(cellId + vec2(7.3, 2.1));
        float lit = step(0.42, cellRand);
        float warmPick = step(0.78, irisHash(cellId + vec2(11.7, 5.3)));
        vec3 windowColor = mix(uWindowCool, uWindowWarm, warmPick);
        float flickerPhase = cellRand * 6.2831;
        float flicker = mix(1.0, 0.72 + 0.28 * sin(uTime * 2.4 + flickerPhase), uFlicker);
        float windowEmission = panelMask * lit * uWindowGlow * flicker * sideMask;
        totalEmissiveRadiance += windowColor * windowEmission * uEmissiveBoost;
        `,
      );

    // Stash uniforms on material userData so the tick loop in Canvas can find
    // and mutate uTime for flicker animation without prop drilling.
    (material as unknown as {
      userData: { windowUniforms: WindowShaderUniforms };
    }).userData = { windowUniforms: uniforms };
  };

  return uniforms;
}

/**
 * Track all material uniforms registered via applyWindowShaderPatch so the
 * scene controller can drive uTime each frame. Module-scope registry so any
 * archetype material registration auto-joins.
 */
const REGISTRY: WindowShaderUniforms[] = [];

/**
 * Register a material's uniforms so the tick driver can update uTime per
 * frame. Returns an unregister function for cleanup on material dispose.
 */
export function registerWindowMaterial(
  uniforms: WindowShaderUniforms,
): () => void {
  REGISTRY.push(uniforms);
  return () => {
    const idx = REGISTRY.indexOf(uniforms);
    if (idx >= 0) REGISTRY.splice(idx, 1);
  };
}

/**
 * Tick all registered uniforms: bump uTime so flicker animates. Called from
 * a single useFrame inside ChronicleCanvas (Daedalus owns the trigger).
 */
export function tickWindowMaterials(deltaSeconds: number): void {
  for (const u of REGISTRY) {
    u.uTime.value += deltaSeconds;
  }
}
