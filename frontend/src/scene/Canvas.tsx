'use client';

/**
 * ChronicleCanvas: 3D scene scaffold.
 *
 * Owner: Daedalus (Wave 1).
 * Contract: _meta/contracts/daedalus-to-iris.md (locked Wave 0 Pythia).
 * Reference anchors:
 *   - PRD Section 13 (Living City Visual Quality Bar non-negotiable)
 *   - PRD Section 17.2 (Tech stack: Three.js 0.184 + r3f 9.6 + React 19)
 *   - PRD Section 13.4 + AD-12 (drop-first feature flag order on regress)
 *   - Phase B Topic D anchor: raw instancedMesh per r3f #3306 (Iris consumer)
 *   - Phase B anchor 8: drop-first order DepthOfField, pixel ratio, Sparkles
 *   - Pythia contract Asumption 4: React Context (not Zustand) for perf state
 *
 * Iris consumes via:
 *   import { ChronicleCanvas, usePerformanceState } from '@/scene';
 *   <ChronicleCanvas>
 *     <BuildingInstances data={buildings} />
 *   </ChronicleCanvas>
 *
 * Wave 1 stubs CameraShake reference (commented). Wave 3 Nemesis wires real
 * trigger condition per Pythia contract `nemesis-to-asclepius.md` feedback edge
 * (Apollo critical finding cluster OR Pattern E commit hook bypass).
 */

import {
  Canvas as R3FCanvas,
  useThree,
  type RootState,
} from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerformanceMonitor,
  Sparkles,
  AdaptiveDpr,
  AdaptiveEvents,
  type PerformanceMonitorApi,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { ACESFilmicToneMapping, Fog } from 'three';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  PerformanceProvider,
  useRegressDebounce,
} from './PerformanceContext';
import { FEATURE_FLAGS } from './feature-flags';
import type { ChronicleCanvasProps } from './types';

/**
 * Default OrbitControls camera config per Pythia contract.
 *
 * 30-degree elevation isometric-ish view: [0, 50, 80] looking at origin.
 * Suggests "quiet hill overlooking the city at night" cinematic mood per
 * PRD Section 13.2 anti-AI-slop discipline. Not top-down, not eye-level.
 */
const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 50, 80];
const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 0, 0];

/**
 * Canvas performance bounds. min 0.5 means at worst we render at half DPR
 * before drop-first kicks in further. debounce 200ms matches r3f default.
 */
const PERFORMANCE_BOUNDS = { min: 0.5, max: 1, debounce: 200 } as const;

/**
 * Fog distance per PRD Section 13.2 Dubai-haze tier. Aggressive density
 * curve at distance hides far-LOD aggressively for Iris frustum perf.
 */
const FOG_COLOR = '#05070d';
const FOG_NEAR = 60;
const FOG_FAR = 220;

/**
 * Drop-first thresholds per AD-12.
 *
 * Stage 1 (factor < 0.85): turn off DOF.
 * Stage 2 (factor < 0.70): drop pixel ratio cap from 2 to 1.
 * Stage 3 (factor < 0.55): turn off Sparkles tier-3.
 *
 * Third directional light stays through stage 3, behind its own env flag.
 * Bloom never drops (Phase B finding: post-pass merges cheap).
 */
const DOF_DROP_THRESHOLD = 0.85;
const DPR_DROP_THRESHOLD = 0.7;
const SPARKLES_DROP_THRESHOLD = 0.55;

/**
 * SceneRig: lighting + fog + environment.
 *
 * Anti-AI-slop tuning: warm key from [10, 60, 20] suggesting interior glow,
 * cool fill from [-20, 40, -10] suggesting moonlight. Optional third light
 * adds depth on the back of buildings (drop-first if flag off).
 */
function SceneRig({ enableThirdLight }: { enableThirdLight: boolean }) {
  const { scene } = useThree();

  // Apply linear fog imperatively. THREE.Fog constructor is the supported
  // pattern; the JSX <fog> primitive can race with HDRI environment loader.
  useEffect(() => {
    scene.fog = new Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      <ambientLight intensity={0.18} color="#7d9cff" />
      <directionalLight
        position={[10, 60, 20]}
        intensity={1.05}
        color="#ffb472"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight
        position={[-20, 40, -10]}
        intensity={0.45}
        color="#7d9cff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {enableThirdLight ? (
        <directionalLight
          position={[0, 30, -60]}
          intensity={0.3}
          color="#c8b6ff"
        />
      ) : null}
    </>
  );
}

/**
 * PostPipeline: drop-first ordered post-processing.
 *
 * Bloom always on (cheap, defining mood per PRD 13.2).
 * DepthOfField behind ENABLE_DOF flag + adaptive disable on regress stage 1.
 * Sparkles tier-3 behind ENABLE_SPARKLES_TIER_3 + adaptive stage 3.
 * Vignette + Noise stay (Phase B: cheap, cinematic punch retained per AD-12).
 */
interface PostPipelineProps {
  enableDof: boolean;
  enableSparklesT3: boolean;
}

function PostPipeline({ enableDof, enableSparklesT3 }: PostPipelineProps) {
  return (
    <>
      {/*
        Sparkles is a Drei primitive, lives inside scene tree NOT inside
        EffectComposer (Phase B Topic D anchor: Sparkles is geometry plus
        ShaderMaterial, not a post pass).

        Tier 3 layout: 3 density bands creating depth illusion.
          - Foreground 1500 particles, small radius near camera target
          - Mid 800 particles, medium radius
          - Background 300 particles, large radius envelope
      */}
      {enableSparklesT3 ? (
        <>
          <Sparkles
            count={1500}
            scale={[80, 30, 80]}
            position={[0, 18, 0]}
            size={1.6}
            speed={0.2}
            opacity={0.7}
            color="#ffd6a5"
          />
          <Sparkles
            count={800}
            scale={[140, 50, 140]}
            position={[0, 30, 0]}
            size={2.4}
            speed={0.15}
            opacity={0.5}
            color="#a0c4ff"
          />
          <Sparkles
            count={300}
            scale={[220, 80, 220]}
            position={[0, 55, 0]}
            size={3.2}
            speed={0.08}
            opacity={0.35}
            color="#c8b6ff"
          />
        </>
      ) : null}

      <EffectComposer
        enableNormalPass={false}
        multisampling={0}
        autoClear={false}
      >
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.18}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
        {enableDof ? (
          <DepthOfField
            focusDistance={0.018}
            focalLength={0.04}
            bokehScale={2.4}
            height={480}
          />
        ) : (
          // EffectComposer requires at least one effect besides Bloom for
          // the merged-pass optimization to keep its shape stable. Vignette
          // is essentially free, stays as the "noop pad" when DOF drops.
          <Vignette offset={0.22} darkness={0.78} blendFunction={BlendFunction.NORMAL} />
        )}
        <Vignette
          offset={0.18}
          darkness={0.65}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  );
}

/**
 * Inner regress wiring lives inside Canvas so useThree returns the real
 * RootState. Drei OrbitControls onChange fires on every camera move; we
 * pipe that into state.performance.regress() per r3f docs canonical pattern
 * (https://r3f.docs.pmnd.rs/advanced/scaling-performance) and into the
 * 2-second debounce window for downstream Iris LOD.
 */
function RegressBridge({
  controlsRef,
  fireDebounced,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  fireDebounced: () => void;
}) {
  const regress = useThree((state: RootState) => state.performance.regress);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleChange = () => {
      regress();
      fireDebounced();
    };
    // Drei OrbitControls forwards 'change' from the underlying Three control.
    controls.addEventListener('change', handleChange);
    return () => {
      controls.removeEventListener('change', handleChange);
    };
  }, [controlsRef, regress, fireDebounced]);

  return null;
}

/**
 * ChronicleCanvas: full scene scaffold component.
 *
 * Performance regress flow:
 *   1. User moves OrbitControls -> r3f regress() fires -> performance.current
 *      drops to performance.min (0.5).
 *   2. AdaptiveDpr automatically reduces device pixel ratio while regressing.
 *   3. PerformanceMonitor.onChange(factor) tracks FPS-derived quality factor
 *      independent of regress, drives the 3-stage drop-first feature
 *      disable.
 *   4. Debounced 2s regress flag exposed via usePerformanceState() so Iris
 *      can drop LOD detail synchronously.
 *
 * WebGL2 absence: Canvas onCreated catches GL context failure, surfaces
 * fallback panel to user. We do NOT mount Canvas children in that branch.
 */
export function ChronicleCanvas({
  children,
  paused = false,
  cameraTarget = DEFAULT_CAMERA_TARGET,
  cameraPosition = DEFAULT_CAMERA_POSITION,
  className,
}: ChronicleCanvasProps) {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [dpr, setDpr] = useState<number | [number, number]>([1, 2]);
  const [qualityFactor, setQualityFactor] = useState<number>(1);
  const [enableDof, setEnableDof] = useState<boolean>(FEATURE_FLAGS.ENABLE_DOF);
  const [enableSparklesT3, setEnableSparklesT3] = useState<boolean>(
    FEATURE_FLAGS.ENABLE_SPARKLES_TIER_3,
  );

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [regressing, fireRegress] = useRegressDebounce(2000);

  // SSR-safe: defer WebGL2 detection to client. The Canvas onCreated below
  // is the authoritative check; this prevents flash of fallback content.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl2');
      setWebglAvailable(ctx !== null);
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  /**
   * Drop-first feature flag adjuster, called by PerformanceMonitor onChange.
   * Stages monotonic: once disabled, stays disabled until factor recovers
   * past hysteresis threshold (avoid flapping during demo).
   */
  const handlePerfChange = useCallback(
    (api: PerformanceMonitorApi) => {
      const factor = api.factor;
      setQualityFactor(factor);

      // Stage 1: DOF
      if (FEATURE_FLAGS.ENABLE_DOF) {
        if (factor < DOF_DROP_THRESHOLD && enableDof) {
          setEnableDof(false);
        } else if (factor > DOF_DROP_THRESHOLD + 0.1 && !enableDof) {
          setEnableDof(true);
        }
      }

      // Stage 2: pixel ratio (cap drops from 2 to 1 then floor 1 to 1).
      if (factor < DPR_DROP_THRESHOLD) {
        setDpr(1);
      } else if (factor > DPR_DROP_THRESHOLD + 0.1) {
        setDpr([1, 2]);
      }

      // Stage 3: Sparkles tier-3
      if (FEATURE_FLAGS.ENABLE_SPARKLES_TIER_3) {
        if (factor < SPARKLES_DROP_THRESHOLD && enableSparklesT3) {
          setEnableSparklesT3(false);
        } else if (
          factor > SPARKLES_DROP_THRESHOLD + 0.1 &&
          !enableSparklesT3
        ) {
          setEnableSparklesT3(true);
        }
      }
    },
    [enableDof, enableSparklesT3],
  );

  // WebGL2 unavailable fallback panel. Iris does not mount.
  if (webglAvailable === false) {
    return (
      <div className={className ?? 'min-h-screen w-full'}>
        <div className="chronicle-fallback-panel">
          <h2 className="mb-3 text-xl font-semibold text-codeplex-ember">
            WebGL2 not detected
          </h2>
          <p className="text-sm leading-relaxed text-white/80">
            Codeplex Chronicle renders a 3D city that requires WebGL2. Please
            use Chrome 90+, Safari 17+, or Edge 90+ on a desktop class device.
            The build experience is degraded on legacy browsers by design.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? 'fixed inset-0 h-screen w-screen'}>
      <R3FCanvas
        shadows
        dpr={dpr}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          stencil: false,
          depth: true,
        }}
        camera={{
          position: cameraPosition,
          fov: 42,
          near: 0.1,
          far: 600,
        }}
        performance={PERFORMANCE_BOUNDS}
        onCreated={({ gl }) => {
          // Confirm WebGL2 successfully bound. If not, flip fallback.
          const context = gl.getContext();
          if (!('createVertexArray' in (context as WebGL2RenderingContext))) {
            setWebglAvailable(false);
          } else {
            setWebglAvailable(true);
          }
        }}
      >
        <PerformanceMonitor
          factor={1}
          bounds={(refreshRate) => [55, refreshRate >= 90 ? 90 : 60]}
          flipflops={3}
          onChange={handlePerfChange}
          onFallback={() => {
            // Catastrophic perf: force DPR to 1, DOF off, Sparkles off.
            setDpr(1);
            setEnableDof(false);
            setEnableSparklesT3(false);
          }}
        />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <SceneRig
          enableThirdLight={FEATURE_FLAGS.ENABLE_THIRD_DIRECTIONAL_LIGHT}
        />

        <Suspense fallback={null}>
          <Environment preset="night" background={false} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={cameraTarget}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
          minDistance={20}
          maxDistance={220}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={!paused}
          autoRotateSpeed={0.18}
          makeDefault
        />

        <RegressBridge controlsRef={controlsRef} fireDebounced={fireRegress} />

        {/*
          [STUB: Wave 3 Nemesis wires real trigger]
          CameraShake mount slot for OQ-06 earthquake error visual.
          Wave 1 Daedalus leaves it unwired; Nemesis Wave 3 imports
          @react-three/drei CameraShake and feeds intensity from Apollo
          finding cluster severity. Contract: nemesis-to-asclepius.md.
        */}

        <PerformanceProvider
          qualityFactor={qualityFactor}
          regressing={regressing}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </PerformanceProvider>

        <PostPipeline
          enableDof={enableDof}
          enableSparklesT3={enableSparklesT3}
        />
      </R3FCanvas>
    </div>
  );
}

// Re-export the hook for convenience so consumers can either pull it from
// the named ChronicleCanvas import sibling or the barrel.
export { usePerformanceState } from './PerformanceContext';
