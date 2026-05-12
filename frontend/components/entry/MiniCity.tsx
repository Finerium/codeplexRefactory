"use client";

import { useMemo } from "react";
import type { EntryMotion } from "./tweak-defaults";
import { mulberry32 } from "./scene-helpers";

// Hestia Wave 1: night city SVG scene behind the left window pane (Import a
// repository). Ported from bundle city-scenes.jsx MiniCity. No creature
// rendering inside; Revision 1 removed Hermes from the page entirely.

interface MiniCityProps {
  motion: EntryMotion;
  warmth: number;
}

type WindowRect = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  flicker: boolean;
  delay: string;
  duration: string;
};

function buildBuildingWindows(
  rand: () => number,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
  motion: EntryMotion,
  keyPrefix: string,
): ReadonlyArray<WindowRect> {
  const out: WindowRect[] = [];
  const pad = 4;
  const cw = (w - pad * 2) / cols;
  const rh = (h - pad * 2) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (rand() < 0.32) continue;
      const wx = x + pad + i * cw + cw * 0.18;
      const wy = y + pad + j * rh + rh * 0.18;
      const ww = cw * 0.55;
      const wh = rh * 0.55;
      const flicker = rand() < 0.18 && motion !== "still";
      const delay = (rand() * 6).toFixed(2);
      const dur = (3 + rand() * 5).toFixed(2);
      const opacity = 0.55 + rand() * 0.45;
      out.push({
        key: `${keyPrefix}-${i}-${j}`,
        x: wx,
        y: wy,
        width: ww,
        height: wh,
        opacity,
        flicker,
        delay,
        duration: dur,
      });
    }
  }
  return out;
}

export function MiniCity({ motion, warmth }: MiniCityProps) {
  const litColor = `oklch(${0.78 + warmth * 0.0008} 0.18 ${50 + warmth * 0.2})`;
  const dimColor = `oklch(0.55 0.14 ${50 + warmth * 0.15})`;

  const farBuildings = useMemo(() => {
    const r = mulberry32(91);
    const arr: { x: number; y: number; w: number; h: number }[] = [];
    let x = 0;
    while (x < 400) {
      const w = 16 + r() * 22;
      const h = 30 + r() * 55;
      arr.push({ x, y: 340 - h, w, h });
      x += w + 1;
    }
    return arr;
  }, []);

  const midBuildings = useMemo(() => {
    const r = mulberry32(217);
    const arr: { x: number; y: number; w: number; h: number; cols: number; rows: number }[] = [];
    let x = -10;
    while (x < 410) {
      const w = 22 + r() * 28;
      const h = 60 + r() * 100;
      arr.push({
        x,
        y: 360 - h,
        w,
        h,
        cols: 2 + Math.floor(r() * 2),
        rows: Math.max(3, Math.floor(h / 14)),
      });
      x += w + 2;
    }
    return arr;
  }, []);

  // Pre-resolve mid-building windows so each render is stable.
  const midWindows = useMemo(
    () =>
      midBuildings.map((b, i) =>
        buildBuildingWindows(
          mulberry32(i * 31 + 5),
          b.x,
          b.y,
          b.w,
          b.h,
          b.cols,
          b.rows,
          motion,
          `m${i}`,
        ),
      ),
    [midBuildings, motion],
  );

  const stars = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const sr = mulberry32(i * 17 + 3);
      const cx = sr() * 400;
      const cy = sr() * 200;
      const radius = sr() * 0.9 + 0.2;
      const opacity = 0.3 + sr() * 0.5;
      return { key: `s${i}`, cx, cy, r: radius, opacity };
    });
  }, []);

  const farWindowPins = useMemo(() => {
    const out: { key: string; x: number; y: number }[] = [];
    farBuildings.forEach((b, i) => {
      const r = mulberry32(i * 5 + 11);
      for (let k = 0; k < 4; k++) {
        if (r() < 0.5) continue;
        out.push({
          key: `fw${i}-${k}`,
          x: b.x + 2 + r() * (b.w - 4),
          y: b.y + 4 + r() * (b.h - 6),
        });
      }
    });
    return out;
  }, [farBuildings]);

  const hospitalWindows = useMemo(
    () =>
      buildBuildingWindows(mulberry32(901), 118, 252, 42, 100, 3, 7, motion, "hosp"),
    [motion],
  );
  const policeWindows = useMemo(
    () =>
      buildBuildingWindows(mulberry32(307), 270, 246, 48, 110, 3, 8, motion, "pol"),
    [motion],
  );

  return (
    <svg
      viewBox="0 0 400 520"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
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

      <rect x="0" y="0" width="400" height="360" fill="url(#cs-sky)" />
      <circle cx="312" cy="92" r="22" fill="oklch(0.94 0.04 80)" opacity="0.7" />
      <rect x="0" y="0" width="400" height="360" fill="url(#cs-moon)" />

      {stars.map((s) => (
        <circle
          key={s.key}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="oklch(0.94 0.04 80)"
          opacity={s.opacity}
        />
      ))}

      {farBuildings.map((b, i) => (
        <rect key={`f${i}`} x={b.x} y={b.y} width={b.w} height={b.h} fill="oklch(0.16 0.03 40)" />
      ))}
      {farWindowPins.map((p) => (
        <rect
          key={p.key}
          x={p.x}
          y={p.y}
          width={1}
          height={1.4}
          fill={dimColor}
          opacity={0.7}
        />
      ))}

      <rect x="0" y="240" width="400" height="120" fill="url(#cs-haze)" />

      {midBuildings.map((b, i) => (
        <g key={`mg${i}`}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="oklch(0.11 0.025 40)" />
          {midWindows[i].map((win) => (
            <rect
              key={win.key}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              fill={litColor}
              opacity={win.opacity}
              style={
                win.flicker
                  ? {
                      animation: `cs-twinkle ${win.duration}s ease-in-out ${win.delay}s infinite both`,
                    }
                  : undefined
              }
            />
          ))}
        </g>
      ))}

      <g data-layer="residents">
        <g>
          <rect x="30" y="220" width="74" height="140" fill="oklch(0.13 0.03 50)" />
          <rect x="36" y="232" width="62" height="120" fill="oklch(0.16 0.035 50)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={`col${i}`}
              x={42 + i * 12}
              y={320}
              width={4}
              height={40}
              fill="oklch(0.1 0.02 40)"
            />
          ))}
          <rect x="56" y="170" width="22" height="60" fill="oklch(0.14 0.03 50)" />
          <circle
            cx="67"
            cy="190"
            r="7"
            fill="oklch(0.86 0.13 75)"
            opacity={0.9}
            style={{
              animation: motion !== "still" ? "cs-pulse 4s ease-in-out infinite" : undefined,
            }}
          />
          <line x1="67" y1="190" x2="67" y2="185" stroke="oklch(0.18 0.03 40)" strokeWidth="0.6" />
          <line x1="67" y1="190" x2="71" y2="190" stroke="oklch(0.18 0.03 40)" strokeWidth="0.6" />
          <path d="M56 170 Q67 154 78 170 Z" fill="oklch(0.18 0.04 50)" />
          <circle cx="67" cy="152" r="1.8" fill={litColor} />
          <ellipse cx="67" cy="360" rx="60" ry="6" fill={litColor} opacity={0.12} />
        </g>

        <g>
          <rect x="116" y="240" width="46" height="120" fill="oklch(0.12 0.025 45)" />
          {hospitalWindows.map((win) => (
            <rect
              key={win.key}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              fill={litColor}
              opacity={win.opacity}
              style={
                win.flicker
                  ? {
                      animation: `cs-twinkle ${win.duration}s ease-in-out ${win.delay}s infinite both`,
                    }
                  : undefined
              }
            />
          ))}
          <rect x="128" y="218" width="22" height="22" fill="oklch(0.12 0.025 45)" />
          <g transform="translate(139,229)">
            <rect
              x="-7"
              y="-1.6"
              width="14"
              height="3.2"
              fill="oklch(0.92 0.04 30)"
              style={{
                animation: motion !== "still" ? "cs-pulse 2.6s ease-in-out infinite" : undefined,
              }}
            />
            <rect
              x="-1.6"
              y="-7"
              width="3.2"
              height="14"
              fill="oklch(0.92 0.04 30)"
              style={{
                animation: motion !== "still" ? "cs-pulse 2.6s ease-in-out infinite" : undefined,
              }}
            />
          </g>
          <ellipse cx="139" cy="360" rx="40" ry="5" fill={litColor} opacity={0.1} />
        </g>

        <g>
          <rect x="176" y="282" width="78" height="78" fill="oklch(0.13 0.025 45)" />
          <rect x="180" y="288" width="70" height="6" fill="oklch(0.17 0.03 50)" />
          <polygon points="176,278 215,260 254,278" fill="oklch(0.14 0.03 50)" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={`lc${i}`}
              x={183 + i * 11}
              y={296}
              width={5}
              height={56}
              fill="oklch(0.1 0.02 40)"
            />
          ))}
          <circle
            cx="215"
            cy="332"
            r="2.8"
            fill={litColor}
            style={{
              animation: motion !== "still" ? "cs-pulse 5s ease-in-out infinite" : undefined,
            }}
          />
          <ellipse cx="215" cy="360" rx="50" ry="6" fill={litColor} opacity={0.1} />
        </g>

        <g>
          <rect x="268" y="234" width="52" height="126" fill="oklch(0.12 0.025 45)" />
          {policeWindows.map((win) => (
            <rect
              key={win.key}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              fill={litColor}
              opacity={win.opacity}
              style={
                win.flicker
                  ? {
                      animation: `cs-twinkle ${win.duration}s ease-in-out ${win.delay}s infinite both`,
                    }
                  : undefined
              }
            />
          ))}
          <circle
            cx="294"
            cy="252"
            r="6"
            fill="oklch(0.1 0.02 35)"
            stroke={litColor}
            strokeOpacity={0.6}
            strokeWidth="0.8"
          />
          <circle cx="294" cy="252" r="2.4" fill={litColor} opacity={0.9} />
          <line x1="294" y1="234" x2="294" y2="208" stroke="oklch(0.4 0.04 60)" strokeWidth="0.8" />
          <circle
            cx="294"
            cy="207"
            r="1.4"
            fill="oklch(0.8 0.18 30)"
            style={{
              animation: motion !== "still" ? "cs-blink 2s steps(2,end) infinite" : undefined,
            }}
          />
          <ellipse cx="294" cy="360" rx="42" ry="5" fill={litColor} opacity={0.1} />
        </g>

        <g>
          <rect x="332" y="304" width="40" height="56" fill="oklch(0.13 0.03 50)" />
          <polygon points="328,304 376,304 372,294 332,294" fill="oklch(0.55 0.13 45)" opacity={0.85} />
          <rect
            x="338"
            y="316"
            width="28"
            height="20"
            fill={litColor}
            opacity={0.85}
            style={{
              animation: motion !== "still" ? "cs-pulse 3.4s ease-in-out infinite" : undefined,
            }}
          />
          <circle
            cx="372"
            cy="288"
            r="3"
            fill="oklch(0.85 0.12 80)"
            stroke="oklch(0.18 0.03 40)"
            strokeWidth="0.4"
          />
          <text
            x="372"
            y="290.5"
            textAnchor="middle"
            fontFamily="JetBrains Mono"
            fontSize="4"
            fontWeight="600"
            fill="oklch(0.18 0.03 40)"
          >
            i
          </text>
          <ellipse cx="352" cy="360" rx="32" ry="4" fill={litColor} opacity={0.1} />
        </g>
      </g>

      <rect x="0" y="360" width="400" height="160" fill="url(#cs-ground)" />
      {[60, 140, 230, 320].map((x, i) => (
        <g key={`lamp${i}`} transform={`translate(${x}, 380)`}>
          <line x1="0" y1="0" x2="0" y2="36" stroke="oklch(0.28 0.03 45)" strokeWidth="1.2" />
          <circle
            cx="0"
            cy="-2"
            r="2"
            fill={litColor}
            style={{
              animation:
                motion !== "still" ? `cs-pulse ${4 + i}s ease-in-out infinite` : undefined,
            }}
          />
          <ellipse cx="0" cy="40" rx="22" ry="3" fill={litColor} opacity={0.1} />
        </g>
      ))}
      <line x1="0" y1="436" x2="400" y2="436" stroke="oklch(0.22 0.03 45)" strokeWidth="0.6" />

      {motion === "animated-city" && (
        <>
          <circle r="1.4" fill="oklch(0.85 0.12 75)">
            <animateMotion dur="14s" repeatCount="indefinite" path="M -10 460 L 410 460" />
          </circle>
          <circle r="1.2" fill="oklch(0.75 0.14 55)">
            <animateMotion dur="22s" repeatCount="indefinite" path="M 410 470 L -10 470" />
          </circle>
        </>
      )}
    </svg>
  );
}
