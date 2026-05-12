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
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  PerformanceProvider,
  useRegressDebounce,
} from './PerformanceContext';
import { FEATURE_FLAGS } from './feature-flags';
import { RoadGrid } from './RoadGrid';
import { TreeScatter } from './TreeScatter';
import { FlyingCars } from './FlyingCars';
import { CinematicIntro } from './CinematicIntro';
import { DirectorModeRunner } from './DirectorMode';
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
 * Fog distance per PRD Section 13.2 Dubai-haze tier.
 *
 * Wave-Fixing #2 cycle 1 retune (Ghaisan ReferensiWindows.png parity target):
 * cycle 1 settled at NEAR 120 + FAR 480 but reference frame has visibly
 * brighter sky and less shadow swallow. Pushed NEAR to 180 (delay fog onset)
 * and FAR to 620 (softer falloff) so distant skyline reads as atmospheric
 * depth, not a black band. Color lifted to a warmer blue-purple matching
 * the night HDRI horizon hue. The Bloom pass still gathers warm halos on
 * top so the city pops without losing the mood.
 */
const FOG_COLOR = '#15203a';
const FOG_NEAR = 180;
const FOG_FAR = 620;

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
 *
 * Wave-Fixing #2 cycle 1 (Ghaisan ReferensiWindows.png parity, Hafiz dark
 * sky regression carry-over): ambient further lifted from 0.4 to 0.65,
 * cool fill from 0.7 to 0.95, third optional light intensity from 0.45 to
 * 0.6 (when enabled). Warm key shadow softened with larger mapSize bias to
 * eliminate the dark shadow band Hafiz flagged around the back of the
 * skyline. Net effect: building windows still pop emissive against a
 * twilight blue ambient, but no buildings fall into pure black.
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
      <ambientLight intensity={0.65} color="#a8c2ff" />
      <hemisphereLight
        args={['#7da7ff', '#1b1230', 0.5]}
      />
      <directionalLight
        position={[10, 60, 20]}
        intensity={1.25}
        color="#ffc28a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={260}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
      />
      <directionalLight
        position={[-20, 40, -10]}
        intensity={0.95}
        color="#a3bdff"
      />
      {enableThirdLight ? (
        <directionalLight
          position={[0, 30, -60]}
          intensity={0.6}
          color="#d4c5ff"
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

        Tier 3 layout: 4 density bands creating depth illusion plus the
        Wave-Fixing cycle 1 firefly layer per Ghaisan polish mandate.
          - Firefly 220 particles, warm yellow drift at building height
          - Foreground 1500 particles, small radius near camera target
          - Mid 800 particles, medium radius
          - Background 300 particles, large radius envelope
      */}
      {enableSparklesT3 ? (
        <>
          {/*
            Wave-Fixing cycle 1 firefly tier ("kunang-kunang"). Tight scale
            so particles ride at building height envelope, very slow drift
            speed 0.05 mimics actual firefly hover. Warm cream color blends
            with the existing warm window glow Iris produces. The Bloom pass
            below picks up the bright cores giving the characteristic halo.
          */}
          <Sparkles
            count={220}
            scale={[260, 18, 260]}
            position={[0, 8, 0]}
            size={2.4}
            speed={0.05}
            opacity={0.95}
            color="#fff3a0"
            noise={1.4}
          />
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
          intensity={1.05}
          luminanceThreshold={0.45}
          luminanceSmoothing={0.22}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
        {enableDof ? (
          /*
            Wave-Fixing cycle 1 C-1 blur fix: previous params focusDistance
            0.018 plus focalLength 0.04 plus bokehScale 2.4 made the entire
            scene out of focus on first paint (focus point hugged the near
            plane). Pulled focusDistance to 0.045 (about 27 units in world
            for default camera 90 unit altitude), shrunk focalLength to
            0.018 so the in-focus band is wider, and dropped bokehScale to
            1.4. The DOF mount is also deferred 900ms post-canvas-create in
            ChronicleCanvas so the first frame is guaranteed sharp.
          */
          <DepthOfField
            focusDistance={0.045}
            focalLength={0.018}
            bokehScale={1.4}
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
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise opacity={0.022} blendFunction={BlendFunction.OVERLAY} />
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
  enableIntro = true,
  enableDirectorMode = true,
  enableFlyingCars = true,
}: ChronicleCanvasProps) {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [dpr, setDpr] = useState<number | [number, number]>([1, 2]);
  const [qualityFactor, setQualityFactor] = useState<number>(1);
  /*
    Wave-Fixing cycle 1 C-1 fix: enableDof now boots FALSE regardless of the
    env feature flag so the first paint is guaranteed sharp. A post-mount
    effect below flips it to FEATURE_FLAGS.ENABLE_DOF after 900ms once the
    first frames are on screen and the user has had time to register the
    crisp silhouette. Drop-first regress can still flip it back off later.
  */
  const [enableDof, setEnableDof] = useState<boolean>(false);
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

  /*
    Wave-Fixing cycle 1 C-1: defer DOF enable so first frame paints sharp.
    900ms gives the camera and HDRI a few frames to settle. If the env flag
    is off (or iOS Safari < 17 guard tripped) we never flip on.
  */
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_DOF) return;
    const timeoutId = window.setTimeout(() => {
      setEnableDof(true);
    }, 900);
    return () => window.clearTimeout(timeoutId);
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
          // Wave-Fixing #2 cycle 1: exposure 1.25 to 1.4 for stronger
          // brightness parity with ReferensiWindows.png target. Bloom
          // luminanceThreshold compensates against blown-out highlights.
          toneMappingExposure: 1.4,
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

        {/*
          Wave-Fixing cycle 1 polish: ground plane plus emissive yellow road
          grid pattern, mounted under all building geometry. RoadGrid sits at
          y=-0.02 so Iris building base y=0 stays above. Anti-collision: Iris
          owns BuildingInstances geometry plus shader, Daedalus owns scene
          composition including ground plane and road grid.
        */}
        <RoadGrid />
        <TreeScatter />

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
          Cinematic intro (Feature #20 per PRD Section 7.3 Stretch Tier 1).
          Mounts inside the Canvas so it can drive the camera + controls ref
          directly through useThree. Auto-disables OrbitControls during play,
          restores on complete or user skip.
        */}
        {enableIntro ? (
          <CinematicIntro
            finalPosition={cameraPosition}
            finalTarget={cameraTarget}
            controlsRef={controlsRef}
            duration={5}
          />
        ) : null}

        {/*
          Director Mode runner (Feature #23 per PRD Section 7.3 Stretch Tier
          1). Sits idle until user clicks the DOM-overlay DirectorModeButton.
          The button is mounted OUTSIDE the Canvas in app/city/page.tsx.
        */}
        {enableDirectorMode ? (
          <DirectorModeRunner controlsRef={controlsRef} />
        ) : null}

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
          {/*
            FlyingCars consumes useCityData via the Iris hook tree, so it
            must mount inside the PerformanceProvider scope where the Iris
            data hooks are reachable. ~30 cars looping per Tier 2 stretch.
          */}
          {enableFlyingCars ? <FlyingCars /> : null}
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
