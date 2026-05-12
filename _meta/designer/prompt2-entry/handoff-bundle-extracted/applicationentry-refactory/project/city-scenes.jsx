// city-scenes.jsx
// SVG scenes for the Entry page:
//   - MiniCity  : procedural night city with 5 resident landmarks + twinkling windows
//   - EmptyLot  : empty grid, foundation stakes, sodium streetlight
//   - HermesBlob: soft glowing blob with eyes (parent positions it)
// All sized to a 400×520 viewBox; the parent stretches them into window panes.

const { useEffect, useMemo, useRef, useState } = React;

// ─── deterministic PRNG so the city doesn't reshuffle on every render ─────
function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── twinkling windows on a building ──────────────────────────────────────
function buildingWindows(rand, x, y, w, h, cols, rows, color, motion) {
  const out = [];
  const pad = 4;
  const cw = (w - pad * 2) / cols;
  const rh = (h - pad * 2) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rand() < 0.32) continue; // dark window
      const wx = x + pad + i * cw + cw * 0.18;
      const wy = y + pad + j * rh + rh * 0.18;
      const ww = cw * 0.55;
      const wh = rh * 0.55;
      const flicker = rand() < 0.18 && motion !== "still";
      const delay = (rand() * 6).toFixed(2);
      const dur = (3 + rand() * 5).toFixed(2);
      out.push(
        <rect
          key={`${x}-${y}-${i}-${j}`}
          x={wx} y={wy} width={ww} height={wh}
          fill={color}
          opacity={0.55 + rand() * 0.45}
          style={
            flicker
              ? { animation: `cs-twinkle ${dur}s ease-in-out ${delay}s infinite both` }
              : undefined
          }
        />
      );
    }
  }
  return out;
}

// ─── MINI CITY ────────────────────────────────────────────────────────────
function MiniCity({ motion = "breathing", warmth = 50 }) {
  const rand = useMemo(() => mulberry32(7733), []);
  const litColor = `oklch(${0.78 + warmth * 0.0008} 0.18 ${50 + warmth * 0.2})`;
  const dimColor = `oklch(0.55 0.14 ${50 + warmth * 0.15})`;

  // far skyline (background silhouettes)
  const farRand = mulberry32(91);
  const farBuildings = useMemo(() => {
    const arr = [];
    let x = 0;
    while (x < 400) {
      const w = 16 + farRand() * 22;
      const h = 30 + farRand() * 55;
      arr.push({ x, y: 340 - h, w, h });
      x += w + 1;
    }
    return arr;
  }, []);

  // mid layer
  const midRand = mulberry32(217);
  const midBuildings = useMemo(() => {
    const arr = [];
    let x = -10;
    while (x < 410) {
      const w = 22 + midRand() * 28;
      const h = 60 + midRand() * 100;
      arr.push({ x, y: 360 - h, w, h, cols: 2 + Math.floor(midRand() * 2), rows: Math.max(3, Math.floor(h / 14)) });
      x += w + 2;
    }
    return arr;
  }, []);

  return (
    <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice" style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.22 0.05 35)" />
          <stop offset="55%" stopColor="oklch(0.28 0.09 45)" />
          <stop offset="100%" stopColor="oklch(0.18 0.06 40)" />
        </linearGradient>
        <radialGradient id="cs-moon" cx="0.78" cy="0.18" r="0.18">
          <stop offset="0%" stopColor="oklch(0.92 0.06 80)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0.92 0.06 80)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cs-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.18 0.04 40)" />
          <stop offset="100%" stopColor="oklch(0.1 0.03 35)" />
        </linearGradient>
        <linearGradient id="cs-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.16 55)" stopOpacity="0" />
          <stop offset="100%" stopColor="oklch(0.7 0.16 55)" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect x="0" y="0" width="400" height="360" fill="url(#cs-sky)" />
      <circle cx="312" cy="92" r="22" fill="oklch(0.94 0.04 80)" opacity="0.7" />
      <rect x="0" y="0" width="400" height="360" fill="url(#cs-moon)" />

      {/* stars */}
      {Array.from({ length: 28 }, (_, i) => {
        const sr = mulberry32(i * 17 + 3);
        return (
          <circle key={i}
            cx={sr() * 400} cy={sr() * 200}
            r={sr() * 0.9 + 0.2}
            fill="oklch(0.94 0.04 80)" opacity={0.3 + sr() * 0.5} />
        );
      })}

      {/* far skyline silhouette */}
      {farBuildings.map((b, i) => (
        <rect key={"f" + i} x={b.x} y={b.y} width={b.w} height={b.h}
              fill="oklch(0.16 0.03 40)" />
      ))}
      {/* far windows — sparse pinpricks */}
      {farBuildings.map((b, i) => {
        const r = mulberry32(i * 5 + 11);
        return Array.from({ length: 4 }, (_, k) => {
          if (r() < 0.5) return null;
          return (
            <rect key={"fw" + i + "-" + k}
              x={b.x + 2 + r() * (b.w - 4)} y={b.y + 4 + r() * (b.h - 6)}
              width="1" height="1.4" fill={dimColor} opacity={0.7} />
          );
        });
      })}

      {/* warm haze over skyline */}
      <rect x="0" y="240" width="400" height="120" fill="url(#cs-haze)" />

      {/* mid buildings */}
      {midBuildings.map((b, i) => (
        <g key={"m" + i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="oklch(0.11 0.025 40)" />
          {buildingWindows(mulberry32(i * 31 + 5), b.x, b.y, b.w, b.h, b.cols, b.rows, litColor, motion)}
        </g>
      ))}

      {/* ─── FRONT LAYER: 5 RESIDENT LANDMARKS ─── */}
      <g data-layer="residents">
        {/* City Hall — Athena. Dome + clock tower, central. */}
        <g>
          <rect x="30" y="220" width="74" height="140" fill="oklch(0.13 0.03 50)" />
          <rect x="36" y="232" width="62" height="120" fill="oklch(0.16 0.035 50)" />
          {/* columns at front */}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={42 + i * 12} y={320} width="4" height="40" fill="oklch(0.1 0.02 40)" />
          ))}
          {/* clock tower */}
          <rect x="56" y="170" width="22" height="60" fill="oklch(0.14 0.03 50)" />
          <circle cx="67" cy="190" r="7" fill="oklch(0.86 0.13 75)" opacity="0.9"
            style={{ animation: motion !== "still" ? "cs-pulse 4s ease-in-out infinite" : undefined }} />
          <line x1="67" y1="190" x2="67" y2="185" stroke="oklch(0.18 0.03 40)" strokeWidth="0.6" />
          <line x1="67" y1="190" x2="71" y2="190" stroke="oklch(0.18 0.03 40)" strokeWidth="0.6" />
          {/* dome */}
          <path d="M56 170 Q67 154 78 170 Z" fill="oklch(0.18 0.04 50)" />
          <circle cx="67" cy="152" r="1.8" fill={litColor} />
          {/* glow */}
          <ellipse cx="67" cy="360" rx="60" ry="6" fill={litColor} opacity="0.12" />
        </g>

        {/* Hospital — Apollo. Cross sign. */}
        <g>
          <rect x="116" y="240" width="46" height="120" fill="oklch(0.12 0.025 45)" />
          {buildingWindows(mulberry32(901), 118, 252, 42, 100, 3, 7, litColor, motion)}
          {/* cross signage */}
          <rect x="128" y="218" width="22" height="22" fill="oklch(0.12 0.025 45)" />
          <g transform="translate(139,229)">
            <rect x="-7" y="-1.6" width="14" height="3.2" fill="oklch(0.92 0.04 30)"
              style={{ animation: motion !== "still" ? "cs-pulse 2.6s ease-in-out infinite" : undefined }} />
            <rect x="-1.6" y="-7" width="3.2" height="14" fill="oklch(0.92 0.04 30)"
              style={{ animation: motion !== "still" ? "cs-pulse 2.6s ease-in-out infinite" : undefined }} />
          </g>
          <ellipse cx="139" cy="360" rx="40" ry="5" fill={litColor} opacity="0.1" />
        </g>

        {/* Library — Clio. Columns, low + wide. */}
        <g>
          <rect x="176" y="282" width="78" height="78" fill="oklch(0.13 0.025 45)" />
          <rect x="180" y="288" width="70" height="6" fill="oklch(0.17 0.03 50)" />
          {/* portico */}
          <polygon points="176,278 215,260 254,278" fill="oklch(0.14 0.03 50)" />
          {[0,1,2,3,4,5].map(i => (
            <rect key={i} x={183 + i * 11} y={296} width="5" height="56" fill="oklch(0.1 0.02 40)" />
          ))}
          {/* warm lamp at entrance */}
          <circle cx="215" cy="332" r="2.8" fill={litColor}
            style={{ animation: motion !== "still" ? "cs-pulse 5s ease-in-out infinite" : undefined }} />
          <ellipse cx="215" cy="360" rx="50" ry="6" fill={litColor} opacity="0.1" />
        </g>

        {/* Police Station — Argus. Antenna + watching eye. */}
        <g>
          <rect x="268" y="234" width="52" height="126" fill="oklch(0.12 0.025 45)" />
          {buildingWindows(mulberry32(307), 270, 246, 48, 110, 3, 8, litColor, motion)}
          {/* eye sign — round porthole */}
          <circle cx="294" cy="252" r="6" fill="oklch(0.1 0.02 35)" stroke={litColor} strokeOpacity="0.6" strokeWidth="0.8" />
          <circle cx="294" cy="252" r="2.4" fill={litColor} opacity="0.9" />
          {/* antenna */}
          <line x1="294" y1="234" x2="294" y2="208" stroke="oklch(0.4 0.04 60)" strokeWidth="0.8" />
          <circle cx="294" cy="207" r="1.4" fill="oklch(0.8 0.18 30)"
            style={{ animation: motion !== "still" ? "cs-blink 2s steps(2,end) infinite" : undefined }} />
          <ellipse cx="294" cy="360" rx="42" ry="5" fill={litColor} opacity="0.1" />
        </g>

        {/* Tourist Info — Hermes. Small kiosk near foreground. */}
        <g>
          <rect x="332" y="304" width="40" height="56" fill="oklch(0.13 0.03 50)" />
          {/* awning */}
          <polygon points="328,304 376,304 372,294 332,294" fill="oklch(0.55 0.13 45)" opacity="0.85" />
          {/* window */}
          <rect x="338" y="316" width="28" height="20" fill={litColor} opacity="0.85"
            style={{ animation: motion !== "still" ? "cs-pulse 3.4s ease-in-out infinite" : undefined }} />
          {/* "i" sign */}
          <circle cx="372" cy="288" r="3" fill="oklch(0.85 0.12 80)" stroke="oklch(0.18 0.03 40)" strokeWidth="0.4" />
          <text x="372" y="290.5" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="4" fontWeight="600" fill="oklch(0.18 0.03 40)">i</text>
          <ellipse cx="352" cy="360" rx="32" ry="4" fill={litColor} opacity="0.1" />
        </g>
      </g>

      {/* ground / street */}
      <rect x="0" y="360" width="400" height="160" fill="url(#cs-ground)" />
      {/* street lamps along sidewalk */}
      {[60, 140, 230, 320].map((x, i) => (
        <g key={"lamp" + i} transform={`translate(${x}, 380)`}>
          <line x1="0" y1="0" x2="0" y2="36" stroke="oklch(0.28 0.03 45)" strokeWidth="1.2" />
          <circle cx="0" cy="-2" r="2" fill={litColor}
            style={{ animation: motion !== "still" ? `cs-pulse ${4 + i}s ease-in-out infinite` : undefined }} />
          <ellipse cx="0" cy="40" rx="22" ry="3" fill={litColor} opacity="0.1" />
        </g>
      ))}
      {/* sidewalk seam */}
      <line x1="0" y1="436" x2="400" y2="436" stroke="oklch(0.22 0.03 45)" strokeWidth="0.6" />

      {/* tiny moving dots — a couple of "residents" walking */}
      {motion === "animated-city" && (
        <>
          <circle r="1.4" fill="oklch(0.85 0.12 75)">
            <animateMotion dur="14s" repeatCount="indefinite"
              path="M -10 460 L 410 460" />
          </circle>
          <circle r="1.2" fill="oklch(0.75 0.14 55)">
            <animateMotion dur="22s" repeatCount="indefinite"
              path="M 410 470 L -10 470" />
          </circle>
        </>
      )}
    </svg>
  );
}

// ─── EMPTY LOT ────────────────────────────────────────────────────────────
function EmptyLot({ motion = "breathing", warmth = 50 }) {
  const sodium = `oklch(${0.76 + warmth * 0.0008} 0.15 ${68 + warmth * 0.12})`;
  return (
    <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice" style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="el-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.16 0.04 250)" />
          <stop offset="55%" stopColor="oklch(0.24 0.06 245)" />
          <stop offset="100%" stopColor="oklch(0.18 0.04 240)" />
        </linearGradient>
        <linearGradient id="el-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.18 0.025 60)" />
          <stop offset="100%" stopColor="oklch(0.08 0.015 55)" />
        </linearGradient>
        <radialGradient id="el-sodium" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={sodium} stopOpacity="0.45" />
          <stop offset="60%" stopColor={sodium} stopOpacity="0.12" />
          <stop offset="100%" stopColor={sodium} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky */}
      <rect x="0" y="0" width="400" height="360" fill="url(#el-sky)" />

      {/* distant faint skyline (the inhabited city, glimpsed across the lot) */}
      {Array.from({ length: 22 }, (_, i) => {
        const r = mulberry32(i * 19 + 1);
        const w = 14 + r() * 22;
        const h = 18 + r() * 38;
        const x = i * 19 - 4;
        return <rect key={i} x={x} y={340 - h} width={w} height={h}
          fill="oklch(0.16 0.03 240)" opacity="0.65" />;
      })}

      {/* warm distant glow from the inhabited city, peeking over horizon */}
      <ellipse cx="200" cy="340" rx="240" ry="20" fill="oklch(0.55 0.12 55)" opacity="0.12" />

      {/* ground */}
      <rect x="0" y="340" width="400" height="180" fill="url(#el-ground)" />

      {/* perspective grid */}
      <g stroke="oklch(0.35 0.03 60)" strokeWidth="0.4" opacity="0.55">
        {/* lateral lines */}
        {[346, 356, 370, 388, 412, 442, 478, 520].map((y, i) => (
          <line key={"h" + i} x1="0" y1={y} x2="400" y2={y} />
        ))}
        {/* converging lines toward vanishing point at 200, 338 */}
        {Array.from({ length: 9 }, (_, i) => {
          const fx = (i - 4) * 80 + 200;
          return <line key={"v" + i} x1={fx} y1="520" x2="200" y2="338" />;
        })}
      </g>

      {/* sodium streetlight cone */}
      <ellipse cx="118" cy="430" rx="120" ry="100" fill="url(#el-sodium)"
        style={{ animation: motion !== "still" ? "cs-pulse 6s ease-in-out infinite" : undefined }} />

      {/* streetlight pole */}
      <g transform="translate(78, 320)">
        <rect x="-1" y="0" width="2" height="120" fill="oklch(0.28 0.03 60)" />
        {/* arm */}
        <path d="M0 4 Q 28 4 38 26" stroke="oklch(0.32 0.03 60)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* lamp head */}
        <g transform="translate(38, 26)">
          <path d="M -6 0 L 6 0 L 4 6 L -4 6 Z" fill="oklch(0.32 0.03 60)" />
          <rect x="-3.5" y="5" width="7" height="3" fill={sodium}
            style={{ animation: motion !== "still" ? "cs-pulse 6s ease-in-out infinite" : undefined }} />
        </g>
      </g>

      {/* foundation stakes — corner pegs with twine */}
      <g>
        {/* the 4 corner stakes */}
        {[
          { x: 140, y: 420 },
          { x: 320, y: 420 },
          { x: 156, y: 470 },
          { x: 344, y: 470 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${p.y})`}>
            <line x1="0" y1="0" x2="0" y2="-14" stroke="oklch(0.5 0.06 55)" strokeWidth="1.2" />
            <polygon points="0,-14 -1.6,-12 1.6,-12" fill="oklch(0.6 0.08 55)" />
          </g>
        ))}
        {/* twine */}
        <polyline points="140,408 320,408 344,458 156,458 140,408"
          fill="none" stroke="oklch(0.7 0.13 75)" strokeWidth="0.5"
          strokeDasharray="3 3" opacity="0.7" />
      </g>

      {/* a single construction marker — like a survey flag */}
      <g transform="translate(232, 462)">
        <line x1="0" y1="0" x2="0" y2="-22" stroke="oklch(0.45 0.04 55)" strokeWidth="0.8" />
        <path d="M0 -22 L 10 -19 L 0 -16 Z" fill="oklch(0.78 0.14 30)" />
      </g>

      {/* footprint outline — dashed rectangle suggesting "your future building" */}
      <rect x="172" y="416" width="148" height="56" fill="none"
        stroke="oklch(0.65 0.1 75)" strokeOpacity="0.45"
        strokeWidth="0.6" strokeDasharray="2 4" />

      {/* faint cursor blink, just to read as "in-memory / programmable" */}
      <g transform="translate(246, 444)">
        <rect x="0" y="-7" width="3" height="9" fill={sodium} opacity="0.85"
          style={{ animation: "cs-blink 1.1s steps(2,end) infinite" }} />
      </g>
    </svg>
  );
}

// ─── HERMES BLOB ──────────────────────────────────────────────────────────
// A soft squircle with inner glow + two eyes; positioned by parent (transform).
function HermesBlob({ size = 64, glow = true, dir = 0, eyesDir = { x: 0, y: 0 } }) {
  const eyeShift = (axis) => Math.max(-1.4, Math.min(1.4, eyesDir[axis] * 1.4));
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="h-body" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0%" stopColor="oklch(0.78 0.16 55)" />
          <stop offset="55%" stopColor="oklch(0.52 0.16 45)" />
          <stop offset="100%" stopColor="oklch(0.32 0.13 40)" />
        </radialGradient>
        <radialGradient id="h-core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="oklch(0.95 0.16 70)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="oklch(0.7 0.18 55)" stopOpacity="0" />
        </radialGradient>
        <filter id="h-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* outer ember halo */}
      {glow && (
        <circle cx="50" cy="55" r="44" fill="oklch(0.7 0.18 55)" opacity="0.18" filter="url(#h-glow)" />
      )}
      {/* body — soft squircle */}
      <path
        d="M 50 8
           C 78 8, 92 26, 92 50
           C 92 76, 76 92, 50 92
           C 24 92, 8 76, 8 50
           C 8 26, 22 8, 50 8 Z"
        fill="url(#h-body)"
      />
      {/* inner core glow */}
      <ellipse cx="50" cy="52" rx="28" ry="22" fill="url(#h-core)" opacity="0.8" />
      {/* tiny feet/blobs at bottom */}
      <ellipse cx="38" cy="92" rx="6" ry="3" fill="oklch(0.32 0.13 40)" />
      <ellipse cx="62" cy="92" rx="6" ry="3" fill="oklch(0.32 0.13 40)" />
      {/* eyes */}
      <g transform={`translate(${eyeShift("x")}, ${eyeShift("y")})`}>
        <ellipse cx="38" cy="46" rx="5" ry="6.5" fill="oklch(0.96 0.02 80)" />
        <ellipse cx="62" cy="46" rx="5" ry="6.5" fill="oklch(0.96 0.02 80)" />
        <circle cx={38 + eyeShift("x") * 0.6} cy={46 + eyeShift("y") * 0.6} r="2.4" fill="oklch(0.15 0.03 40)" />
        <circle cx={62 + eyeShift("x") * 0.6} cy={46 + eyeShift("y") * 0.6} r="2.4" fill="oklch(0.15 0.03 40)" />
        {/* eye sparkle */}
        <circle cx={37 + eyeShift("x") * 0.6} cy={44.5 + eyeShift("y") * 0.6} r="0.8" fill="oklch(0.98 0 0)" />
        <circle cx={61 + eyeShift("x") * 0.6} cy={44.5 + eyeShift("y") * 0.6} r="0.8" fill="oklch(0.98 0 0)" />
      </g>
    </svg>
  );
}

// keyframes (registered once)
(function injectSceneKeyframes() {
  if (document.getElementById("cs-kf")) return;
  const s = document.createElement("style");
  s.id = "cs-kf";
  s.textContent = `
    @keyframes cs-twinkle {
      0%, 100% { opacity: 0.95; }
      45% { opacity: 0.2; }
      55% { opacity: 1; }
    }
    @keyframes cs-pulse {
      0%, 100% { opacity: 0.95; }
      50% { opacity: 0.6; }
    }
    @keyframes cs-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes cs-breathe {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-1.5px) scale(1.005); }
    }
  `;
  document.head.appendChild(s);
})();

Object.assign(window, { MiniCity, EmptyLot, HermesBlob });
