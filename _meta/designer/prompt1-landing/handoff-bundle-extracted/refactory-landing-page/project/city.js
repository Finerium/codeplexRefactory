// city.js — volumetric obsidian city. window.City API: init, setScroll, setMode, setFog, setMotion, setSaturation.

(function () {
  const City = {};
  let renderer, scene, camera, clock;
  let buildingsMesh, landmarksGroup, ground;
  let pointLights = [];
  let fog;
  let scrollT = 0, targetScroll = 0;
  let mode = 'night';
  let motionIntensity = 0.65, satMul = 1.0;
  let mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let windowGlow = 0.85, flickerMode = 'occasional', windowDensity = 'medium';
  let stripsRef, warmRef;

  const PAL = {
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

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260512);

  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    scene = new THREE.Scene();
    scene.background = PAL.night.sky.clone();
    fog = new THREE.FogExp2(PAL.night.fogColor.clone(), 0.018);
    scene.fog = fog;

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 800);
    camera.position.set(0, 18, 60);
    camera.lookAt(0, 4, 0);

    const hemi = new THREE.HemisphereLight(PAL.night.hemiTop, PAL.night.hemiBot, 0.55);
    hemi.name = 'hemi'; scene.add(hemi);
    const key = new THREE.PointLight(PAL.night.keyAmber, 8, 80, 1.5);
    key.position.set(2, 14, 6); key.name = 'key'; scene.add(key);
    const cool = new THREE.DirectionalLight(PAL.night.keyCool, 0.35);
    cool.position.set(-30, 60, 20); cool.name = 'cool'; scene.add(cool);

    ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: PAL.night.ground.clone(), roughness: 0.45, metalness: 0.4 })
    );
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    buildBuildings();
    landmarksGroup = new THREE.Group(); scene.add(landmarksGroup);
    buildLandmarks();
    buildDust();

    clock = new THREE.Clock();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    onResize(); tick();
  }

  function buildBuildings() {
    const N = 220;
    const mat = new THREE.MeshStandardMaterial({
      color: PAL.night.buildBase.clone(), roughness: 0.85, metalness: 0.05,
    });
    buildingsMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), mat, N);
    const dummy = new THREE.Object3D();
    let placed = 0, tries = 0;
    const positions = [];
    while (placed < N && tries < 4000) {
      tries++;
      const r = 6 + rng() * 70;
      const a = rng() * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      let bad = false;
      for (const p of positions) {
        const dx = p.x - x, dz = p.z - z;
        if (dx*dx + dz*dz < 5.4) { bad = true; break; }
      }
      if (bad || r < 7.5) continue;
      const w = 1.4 + rng() * 2.6;
      const d = 1.4 + rng() * 2.6;
      const h = Math.pow(rng(), 1.4) * 22 + 2;
      positions.push({ x, z, w, d, h });
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(w, h, d); dummy.updateMatrix();
      buildingsMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    buildingsMesh.count = placed;
    buildingsMesh.instanceMatrix.needsUpdate = true;
    scene.add(buildingsMesh);

    const strips = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshBasicMaterial({ color: PAL.night.windowCool.clone(), transparent:true, opacity:0.8 }),
      placed * 2
    );
    strips.name = 'windowStrips';
    let s = 0;
    for (let i = 0; i < placed; i++) {
      const p = positions[i];
      const stripsPer = rng() < 0.55 ? 2 : (rng() < 0.6 ? 1 : 0);
      for (let k = 0; k < stripsPer; k++) {
        const face = Math.floor(rng() * 4);
        const sx = p.w * (0.12 + rng() * 0.16);
        const sz = p.d * (0.12 + rng() * 0.16);
        const sh = p.h * (0.4 + rng() * 0.45);
        let lx = p.x, lz = p.z;
        const off = 0.51;
        if (face === 0) lz = p.z + p.d * off;
        else if (face === 1) lz = p.z - p.d * off;
        else if (face === 2) lx = p.x + p.w * off;
        else lx = p.x - p.w * off;
        dummy.position.set(lx, sh / 2 + 0.5, lz);
        const t = 0.06;
        if (face < 2) dummy.scale.set(sx, sh, t);
        else dummy.scale.set(t, sh, sz);
        dummy.rotation.set(0,0,0); dummy.updateMatrix();
        strips.setMatrixAt(s, dummy.matrix);
        s++;
      }
    }
    strips.count = s;
    strips.instanceMatrix.needsUpdate = true;
    stripsRef = strips;
    scene.add(strips);

    const warmCount = 22;
    const warmMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshBasicMaterial({ color: PAL.night.windowWarm.clone(), transparent:true, opacity:0.95 }),
      warmCount
    );
    warmMesh.name = 'windowWarm';
    for (let w = 0; w < warmCount; w++) {
      const i = Math.floor(rng() * placed);
      const p = positions[i];
      const face = Math.floor(rng() * 4);
      const sx = p.w * 0.22, sz = p.d * 0.22;
      const sh = 0.55 + rng() * 0.8;
      let lx = p.x, lz = p.z;
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
        const pl = new THREE.PointLight(PAL.night.keyAmber, 4, 12, 2);
        pl.position.set(lx, ly, lz); scene.add(pl); pointLights.push(pl);
      }
    }
    warmMesh.count = warmCount;
    warmMesh.instanceMatrix.needsUpdate = true;
    warmRef = warmMesh;
    scene.add(warmMesh);
  }

  function buildLandmarks() {
    const mat = new THREE.MeshStandardMaterial({
      color: PAL.night.landmark.clone(), roughness: 0.65, metalness: 0.2,
    });
    const add = (g, n, pos) => {
      const m = new THREE.Mesh(g, mat.clone());
      m.name = n; m.position.set(...pos); landmarksGroup.add(m); return m;
    };
    add(new THREE.BoxGeometry(4, 18, 4),  'hall-b', [0, 9, 0]);
    add(new THREE.BoxGeometry(2.6, 6, 2.6),'hall-t', [0, 21, 0]);
    add(new THREE.ConeGeometry(0.8, 5, 4),'hall-s', [0, 26.5, 0]);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45,12,12),
      new THREE.MeshBasicMaterial({ color: PAL.night.windowWarm.clone() }));
    beacon.position.set(0,29,0); beacon.name = 'hall-bcn'; landmarksGroup.add(beacon);
    const beaconLight = new THREE.PointLight(PAL.night.keyAmber, 6, 30, 2);
    beaconLight.position.set(0,29,0); scene.add(beaconLight); pointLights.push(beaconLight);

    add(new THREE.BoxGeometry(6, 5, 2), 'hosp-x', [16, 2.5, 0]);
    add(new THREE.BoxGeometry(2, 5, 6), 'hosp-y', [16, 2.5, 0]);
    const hc = new THREE.Mesh(new THREE.BoxGeometry(0.4,1.2,0.4),
      new THREE.MeshBasicMaterial({ color: 0xffe2c4 }));
    hc.position.set(16,6,0); hc.name='hosp-cross'; landmarksGroup.add(hc);

    add(new THREE.BoxGeometry(5,4,5),  'pol-b', [-16,2,2]);
    add(new THREE.BoxGeometry(1.4,7,1.4),'pol-t',[-16,3.5,2]);

    add(new THREE.BoxGeometry(10,4,3),  'lib-s', [0,2,-18]);
    add(new THREE.BoxGeometry(10.4,0.4,3.4),'lib-r',[0,4.2,-18]);

    add(new THREE.BoxGeometry(2,2,2),   'ti-b', [0,1,16]);
    const tiCap = new THREE.Mesh(new THREE.SphereGeometry(0.55,16,12),
      new THREE.MeshBasicMaterial({ color: PAL.night.windowWarm.clone() }));
    tiCap.position.set(0,2.5,16); tiCap.name='ti-cap'; landmarksGroup.add(tiCap);
    const tiLight = new THREE.PointLight(PAL.night.keyAmber, 3, 14, 2);
    tiLight.position.set(0,2.6,16); scene.add(tiLight); pointLights.push(tiLight);
  }

  function buildDust() {
    const g = new THREE.BufferGeometry();
    const N = 600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (rng() - 0.5) * 160;
      pos[i*3+1] = rng() * 60 + 4;
      pos[i*3+2] = (rng() - 0.5) * 160;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xa9c7ff, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false,
    }));
    pts.name = 'dust'; scene.add(pts);
  }

  const waypoints = [
    { p: [22, 26, 70], l: [0, 6, 0] },
    { p: [16, 14, 44], l: [0, 4, 0] },
    { p: [-12, 9, 22], l: [0, 12, 0] },
    { p: [0, 38, 18],  l: [0, 4, -4] },
    { p: [-26, 6, 18], l: [10, 5, -2] },
    { p: [0, 22, 80],  l: [0, 6, 0] },
  ];
  function lerpVec(a,b,t,out){ out.set(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t); return out; }
  const _camP = new THREE.Vector3(), _camL = new THREE.Vector3();
  function updateCamera() {
    const segs = waypoints.length - 1;
    const u = Math.max(0, Math.min(1, scrollT)) * segs;
    const i = Math.min(segs - 1, Math.floor(u));
    let f = u - i;
    f = f < 0.5 ? 2*f*f : 1 - Math.pow(-2*f+2, 2)/2;
    const a = waypoints[i], b = waypoints[i+1];
    lerpVec(a.p, b.p, f, _camP); lerpVec(a.l, b.l, f, _camL);
    const mx = mouse.x * 1.6 * motionIntensity;
    const my = mouse.y * 0.8 * motionIntensity;
    camera.position.lerp(_camP.clone().add(new THREE.Vector3(mx, -my, 0)), 0.06);
    camera.lookAt(_camL);
  }

  function setMode(isDay) {
    mode = isDay ? 'day' : 'night';
    setSaturation(satMul);
    const p = PAL[mode];
    const hemi = scene.getObjectByName('hemi');
    if (hemi) { hemi.color = p.hemiTop.clone(); hemi.groundColor = p.hemiBot.clone();
      hemi.intensity = isDay ? 0.95 : 0.55; }
    const key = scene.getObjectByName('key');
    if (key) { key.color = p.keyAmber.clone(); key.intensity = isDay ? 2 : 8; }
    const cool = scene.getObjectByName('cool');
    if (cool) { cool.color = p.keyCool.clone(); cool.intensity = isDay ? 1.2 : 0.35; }
    renderer.toneMappingExposure = isDay ? 1.25 : 1.1;
  }
  function setFog(v) { fog.density = 0.005 + v * 0.04; }
  function setMotion(v) { motionIntensity = v; }
  function setSaturation(v) {
    satMul = v;
    const p = PAL[mode];
    const adj = (c) => { const h={h:0,s:0,l:0}; c.getHSL(h);
      return new THREE.Color().setHSL(h.h, Math.min(1, h.s*v), h.l); };
    scene.background = adj(p.sky);
    fog.color = adj(p.fogColor);
    ground.material.color = adj(p.ground);
    buildingsMesh.material.color = adj(p.buildBase);
    const strips = scene.getObjectByName('windowStrips');
    if (strips) strips.material.color = adj(p.windowCool);
    const warm = scene.getObjectByName('windowWarm');
    if (warm) warm.material.color = adj(p.windowWarm);
  }
  function setScroll(t) { targetScroll = Math.max(0, Math.min(1, t)); }
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  function onPointer(e) {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function tick() {
    requestAnimationFrame(tick);
    clock.getDelta();
    scrollT += (targetScroll - scrollT) * 0.08;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    updateCamera();
    const t = clock.elapsedTime;
    for (let i = 0; i < pointLights.length; i++) {
      const pl = pointLights[i];
      const base = pl.userData.base || (pl.userData.base = pl.intensity);
      pl.intensity = base * (0.88 + 0.12 * Math.sin(t * (1.2 + i*0.37) + i));
    }
    const dust = scene.getObjectByName('dust');
    if (dust) dust.rotation.y = t * 0.012;
    // Flicker windows
    if (stripsRef) {
      const rate = flickerMode === 'off' ? 0 : flickerMode === 'rare' ? 0.4 : 1.2;
      const base = windowGlow * (windowDensity === 'sparse' ? 0.55 : windowDensity === 'dense' ? 1.15 : 0.85);
      const f = rate > 0 ? (0.85 + 0.15 * Math.sin(t * (1.3 + rate))) : 1;
      stripsRef.material.opacity = Math.min(1, base * f);
      if (warmRef) warmRef.material.opacity = Math.min(1, (0.85 + 0.15 * Math.sin(t * 2.1 * rate)) * windowGlow);
    }
    renderer.render(scene, camera);
  }

  City.init = init; City.setScroll = setScroll; City.setMode = setMode;
  City.setFog = setFog; City.setMotion = setMotion; City.setSaturation = setSaturation;
  City.setWindowGlow = function(v){ windowGlow = v; };
  City.setWindowDensity = function(v){ windowDensity = v; };
  City.setFlicker = function(v){ flickerMode = v; };
  City.setBuildingDetail = function(v){
    if (!buildingsMesh) return;
    buildingsMesh.material.roughness = v === 'silhouette' ? 1.0 : v === 'full' ? 0.6 : 0.85;
    if (stripsRef) stripsRef.visible = v !== 'silhouette';
    if (warmRef) warmRef.visible = v !== 'silhouette';
  };
  window.City = City;
})();
