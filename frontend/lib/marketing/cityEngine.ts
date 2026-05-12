/**
 * cityEngine, vendored Three.js volumetric obsidian city used by the marketing
 * landing fixed canvas backdrop. Independent of the production r3f scene
 * Daedalus authors in `@/scene/` (which renders the actual code-as-city). This
 * module is marketing-only, a cinematic non-interactive backdrop.
 *
 * Authored by Calliope (Wave 1) ported from Designer Prompt 1 bundle file
 * `city.js`. The original UMD-style closure rewritten as an ES module factory
 * that returns a controller object. Revision 1 applied: City.setMode() boots
 * directly in 'day' palette (light mode lock) and any future setMode(false)
 * call is now a no-op so the dark code path can never regress.
 */
import * as THREE from 'three';

export interface CityController {
  setScroll(t: number): void;
  setMode(isDay: boolean): void;
  setFog(v: number): void;
  setMotion(v: number): void;
  setSaturation(v: number): void;
  setWindowGlow(v: number): void;
  setWindowDensity(v: 'sparse' | 'medium' | 'dense'): void;
  setFlicker(v: 'off' | 'rare' | 'occasional' | 'continuous'): void;
  setBuildingDetail(v: 'silhouette' | 'moderate' | 'full'): void;
  dispose(): void;
}

interface PaletteEntry {
  sky: THREE.Color;
  fogColor: THREE.Color;
  ground: THREE.Color;
  buildBase: THREE.Color;
  windowCool: THREE.Color;
  windowWarm: THREE.Color;
  landmark: THREE.Color;
  hemiTop: THREE.Color;
  hemiBot: THREE.Color;
  keyAmber: THREE.Color;
  keyCool: THREE.Color;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initCity(canvas: HTMLCanvasElement): CityController {
  const rng = mulberry32(20260512);

  const PAL: Record<'night' | 'day', PaletteEntry> = {
    night: {
      sky: new THREE.Color('#0c1018'),
      fogColor: new THREE.Color('#0e1420'),
      ground: new THREE.Color('#080a10'),
      buildBase: new THREE.Color('#0f1622'),
      windowCool: new THREE.Color('#7dff95'),
      windowWarm: new THREE.Color('#ffc878'),
      landmark: new THREE.Color('#22304a'),
      hemiTop: new THREE.Color('#1a2538'),
      hemiBot: new THREE.Color('#05060a'),
      keyAmber: new THREE.Color('#ffaf68'),
      keyCool: new THREE.Color('#5a8cff'),
    },
    day: {
      sky: new THREE.Color('#dfe4ec'),
      fogColor: new THREE.Color('#cfd5e0'),
      ground: new THREE.Color('#b6bcc6'),
      buildBase: new THREE.Color('#cad0d8'),
      windowCool: new THREE.Color('#9eb6cf'),
      windowWarm: new THREE.Color('#e08b3d'),
      landmark: new THREE.Color('#a8b0bc'),
      hemiTop: new THREE.Color('#eef2f6'),
      hemiBot: new THREE.Color('#aab1bc'),
      keyAmber: new THREE.Color('#ff9a3a'),
      keyCool: new THREE.Color('#6f8fb8'),
    },
  };

  // Revision 1: boot in 'day' palette directly; setMode() argument ignored.
  let mode: 'day' = 'day';
  let motionIntensity = 0.65;
  let satMul = 1.0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let windowGlow = 0.85;
  let flickerMode: 'off' | 'rare' | 'occasional' | 'continuous' = 'occasional';
  let windowDensity: 'sparse' | 'medium' | 'dense' = 'medium';
  let scrollT = 0;
  let targetScroll = 0;
  let raf = 0;
  let stripsRef: THREE.InstancedMesh | undefined;
  let warmRef: THREE.InstancedMesh | undefined;
  const pointLights: THREE.PointLight[] = [];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = PAL.day.sky.clone();
  const fog = new THREE.FogExp2(PAL.day.fogColor.clone(), 0.018);
  scene.fog = fog;

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 800);
  camera.position.set(0, 18, 60);
  camera.lookAt(0, 4, 0);

  const hemi = new THREE.HemisphereLight(PAL.day.hemiTop, PAL.day.hemiBot, 0.95);
  hemi.name = 'hemi';
  scene.add(hemi);
  const keyLight = new THREE.PointLight(PAL.day.keyAmber, 2, 80, 1.5);
  keyLight.position.set(2, 14, 6);
  keyLight.name = 'key';
  scene.add(keyLight);
  const coolLight = new THREE.DirectionalLight(PAL.day.keyCool, 1.2);
  coolLight.position.set(-30, 60, 20);
  coolLight.name = 'cool';
  scene.add(coolLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({
      color: PAL.day.ground.clone(),
      roughness: 0.45,
      metalness: 0.4,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const buildingsMat = new THREE.MeshStandardMaterial({
    color: PAL.day.buildBase.clone(),
    roughness: 0.85,
    metalness: 0.05,
  });
  const N = 220;
  const buildingsMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingsMat, N);
  const dummy = new THREE.Object3D();
  let placed = 0;
  let tries = 0;
  const positions: Array<{ x: number; z: number; w: number; d: number; h: number }> = [];
  while (placed < N && tries < 4000) {
    tries++;
    const r = 6 + rng() * 70;
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    let bad = false;
    for (const p of positions) {
      const dx = p.x - x;
      const dz = p.z - z;
      if (dx * dx + dz * dz < 5.4) {
        bad = true;
        break;
      }
    }
    if (bad || r < 7.5) continue;
    const w = 1.4 + rng() * 2.6;
    const d = 1.4 + rng() * 2.6;
    const h = Math.pow(rng(), 1.4) * 22 + 2;
    positions.push({ x, z, w, d, h });
    dummy.position.set(x, h / 2, z);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    buildingsMesh.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  buildingsMesh.count = placed;
  buildingsMesh.instanceMatrix.needsUpdate = true;
  scene.add(buildingsMesh);

  const stripsMat = new THREE.MeshBasicMaterial({
    color: PAL.day.windowCool.clone(),
    transparent: true,
    opacity: 0.8,
  });
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stripsMat, placed * 2);
  strips.name = 'windowStrips';
  let s = 0;
  for (let i = 0; i < placed; i++) {
    const p = positions[i];
    const stripsPer = rng() < 0.55 ? 2 : rng() < 0.6 ? 1 : 0;
    for (let k = 0; k < stripsPer; k++) {
      const face = Math.floor(rng() * 4);
      const sx = p.w * (0.12 + rng() * 0.16);
      const sz = p.d * (0.12 + rng() * 0.16);
      const sh = p.h * (0.4 + rng() * 0.45);
      let lx = p.x;
      let lz = p.z;
      const off = 0.51;
      if (face === 0) lz = p.z + p.d * off;
      else if (face === 1) lz = p.z - p.d * off;
      else if (face === 2) lx = p.x + p.w * off;
      else lx = p.x - p.w * off;
      dummy.position.set(lx, sh / 2 + 0.5, lz);
      const t = 0.06;
      if (face < 2) dummy.scale.set(sx, sh, t);
      else dummy.scale.set(t, sh, sz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      strips.setMatrixAt(s, dummy.matrix);
      s++;
    }
  }
  strips.count = s;
  strips.instanceMatrix.needsUpdate = true;
  stripsRef = strips;
  scene.add(strips);

  const warmCount = 22;
  const warmMat = new THREE.MeshBasicMaterial({
    color: PAL.day.windowWarm.clone(),
    transparent: true,
    opacity: 0.95,
  });
  const warmMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), warmMat, warmCount);
  warmMesh.name = 'windowWarm';
  for (let w = 0; w < warmCount; w++) {
    const i = Math.floor(rng() * placed);
    const p = positions[i];
    const face = Math.floor(rng() * 4);
    const sx = p.w * 0.22;
    const sz = p.d * 0.22;
    const sh = 0.55 + rng() * 0.8;
    let lx = p.x;
    let lz = p.z;
    const off = 0.51;
    if (face === 0) lz = p.z + p.d * off;
    else if (face === 1) lz = p.z - p.d * off;
    else if (face === 2) lx = p.x + p.w * off;
    else lx = p.x - p.w * off;
    const ly = (0.35 + rng() * 0.6) * p.h;
    dummy.position.set(lx, ly, lz);
    const t = 0.07;
    if (face < 2) dummy.scale.set(sx, sh, t);
    else dummy.scale.set(t, sh, sz);
    dummy.updateMatrix();
    warmMesh.setMatrixAt(w, dummy.matrix);
    if (w < 6) {
      const pl = new THREE.PointLight(PAL.day.keyAmber, 2, 12, 2);
      pl.position.set(lx, ly, lz);
      scene.add(pl);
      pointLights.push(pl);
    }
  }
  warmMesh.count = warmCount;
  warmMesh.instanceMatrix.needsUpdate = true;
  warmRef = warmMesh;
  scene.add(warmMesh);

  // Landmarks
  const landmarkMat = new THREE.MeshStandardMaterial({
    color: PAL.day.landmark.clone(),
    roughness: 0.65,
    metalness: 0.2,
  });
  const landmarksGroup = new THREE.Group();
  scene.add(landmarksGroup);
  const addLandmark = (g: THREE.BufferGeometry, name: string, pos: [number, number, number]) => {
    const m = new THREE.Mesh(g, landmarkMat.clone());
    m.name = name;
    m.position.set(...pos);
    landmarksGroup.add(m);
  };
  addLandmark(new THREE.BoxGeometry(4, 18, 4), 'hall-b', [0, 9, 0]);
  addLandmark(new THREE.BoxGeometry(2.6, 6, 2.6), 'hall-t', [0, 21, 0]);
  addLandmark(new THREE.ConeGeometry(0.8, 5, 4), 'hall-s', [0, 26.5, 0]);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 12, 12),
    new THREE.MeshBasicMaterial({ color: PAL.day.windowWarm.clone() })
  );
  beacon.position.set(0, 29, 0);
  landmarksGroup.add(beacon);
  addLandmark(new THREE.BoxGeometry(6, 5, 2), 'hosp-x', [16, 2.5, 0]);
  addLandmark(new THREE.BoxGeometry(2, 5, 6), 'hosp-y', [16, 2.5, 0]);
  addLandmark(new THREE.BoxGeometry(5, 4, 5), 'pol-b', [-16, 2, 2]);
  addLandmark(new THREE.BoxGeometry(1.4, 7, 1.4), 'pol-t', [-16, 3.5, 2]);
  addLandmark(new THREE.BoxGeometry(10, 4, 3), 'lib-s', [0, 2, -18]);
  addLandmark(new THREE.BoxGeometry(10.4, 0.4, 3.4), 'lib-r', [0, 4.2, -18]);
  addLandmark(new THREE.BoxGeometry(2, 2, 2), 'ti-b', [0, 1, 16]);
  const tiCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 12),
    new THREE.MeshBasicMaterial({ color: PAL.day.windowWarm.clone() })
  );
  tiCap.position.set(0, 2.5, 16);
  landmarksGroup.add(tiCap);

  // Dust particles
  const dustGeom = new THREE.BufferGeometry();
  const Ndust = 600;
  const pos = new Float32Array(Ndust * 3);
  for (let i = 0; i < Ndust; i++) {
    pos[i * 3] = (rng() - 0.5) * 160;
    pos[i * 3 + 1] = rng() * 60 + 4;
    pos[i * 3 + 2] = (rng() - 0.5) * 160;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dustGeom,
    new THREE.PointsMaterial({
      color: 0xa9c7ff,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  dust.name = 'dust';
  scene.add(dust);

  const waypoints: Array<{ p: [number, number, number]; l: [number, number, number] }> = [
    { p: [22, 26, 70], l: [0, 6, 0] },
    { p: [16, 14, 44], l: [0, 4, 0] },
    { p: [-12, 9, 22], l: [0, 12, 0] },
    { p: [0, 38, 18], l: [0, 4, -4] },
    { p: [-26, 6, 18], l: [10, 5, -2] },
    { p: [0, 22, 80], l: [0, 6, 0] },
  ];
  const lerpVec = (
    a: [number, number, number],
    b: [number, number, number],
    t: number,
    out: THREE.Vector3
  ) => {
    out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    return out;
  };
  const _camP = new THREE.Vector3();
  const _camL = new THREE.Vector3();
  const updateCamera = () => {
    const segs = waypoints.length - 1;
    const u = Math.max(0, Math.min(1, scrollT)) * segs;
    const i = Math.min(segs - 1, Math.floor(u));
    let f = u - i;
    f = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const a = waypoints[i];
    const b = waypoints[i + 1];
    lerpVec(a.p, b.p, f, _camP);
    lerpVec(a.l, b.l, f, _camL);
    const mx = mouse.x * 1.6 * motionIntensity;
    const my = mouse.y * 0.8 * motionIntensity;
    camera.position.lerp(_camP.clone().add(new THREE.Vector3(mx, -my, 0)), 0.06);
    camera.lookAt(_camL);
  };

  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const onPointer = (e: PointerEvent) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  onResize();

  const clock = new THREE.Clock();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    clock.getDelta();
    scrollT += (targetScroll - scrollT) * 0.08;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    updateCamera();
    const tt = clock.elapsedTime;
    for (let i = 0; i < pointLights.length; i++) {
      const pl = pointLights[i];
      const baseRecord = pl.userData as { base?: number };
      if (baseRecord.base === undefined) baseRecord.base = pl.intensity;
      pl.intensity = baseRecord.base * (0.88 + 0.12 * Math.sin(tt * (1.2 + i * 0.37) + i));
    }
    const dustObj = scene.getObjectByName('dust');
    if (dustObj) dustObj.rotation.y = tt * 0.012;
    if (stripsRef) {
      const rate = flickerMode === 'off' ? 0 : flickerMode === 'rare' ? 0.4 : 1.2;
      const base =
        windowGlow * (windowDensity === 'sparse' ? 0.55 : windowDensity === 'dense' ? 1.15 : 0.85);
      const f = rate > 0 ? 0.85 + 0.15 * Math.sin(tt * (1.3 + rate)) : 1;
      (stripsRef.material as THREE.MeshBasicMaterial).opacity = Math.min(1, base * f);
      if (warmRef) {
        (warmRef.material as THREE.MeshBasicMaterial).opacity = Math.min(
          1,
          (0.85 + 0.15 * Math.sin(tt * 2.1 * rate)) * windowGlow
        );
      }
    }
    renderer.render(scene, camera);
  };
  tick();

  const adj = (c: THREE.Color) => {
    const h = { h: 0, s: 0, l: 0 };
    c.getHSL(h);
    return new THREE.Color().setHSL(h.h, Math.min(1, h.s * satMul), h.l);
  };
  const recolorScene = () => {
    const p = PAL[mode];
    scene.background = adj(p.sky);
    fog.color = adj(p.fogColor);
    ground.material.color = adj(p.ground);
    buildingsMesh.material.color = adj(p.buildBase);
    if (stripsRef)
      (stripsRef.material as THREE.MeshBasicMaterial).color = adj(p.windowCool);
    if (warmRef)
      (warmRef.material as THREE.MeshBasicMaterial).color = adj(p.windowWarm);
  };

  return {
    // Revision 1: setMode is no-op. Boot is forced 'day' palette; any caller
    // trying to flip to night is silently ignored so the dark code path can
    // never regress through this controller.
    setMode(_isDay: boolean) {
      mode = 'day';
      recolorScene();
    },
    setFog(v: number) {
      fog.density = 0.005 + v * 0.04;
    },
    setMotion(v: number) {
      motionIntensity = v;
    },
    setSaturation(v: number) {
      satMul = v;
      recolorScene();
    },
    setScroll(t: number) {
      targetScroll = Math.max(0, Math.min(1, t));
    },
    setWindowGlow(v: number) {
      windowGlow = v;
    },
    setWindowDensity(v: 'sparse' | 'medium' | 'dense') {
      windowDensity = v;
    },
    setFlicker(v: 'off' | 'rare' | 'occasional' | 'continuous') {
      flickerMode = v;
    },
    setBuildingDetail(v: 'silhouette' | 'moderate' | 'full') {
      buildingsMesh.material.roughness = v === 'silhouette' ? 1.0 : v === 'full' ? 0.6 : 0.85;
      if (stripsRef) stripsRef.visible = v !== 'silhouette';
      if (warmRef) warmRef.visible = v !== 'silhouette';
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      renderer.dispose();
    },
  };
}
