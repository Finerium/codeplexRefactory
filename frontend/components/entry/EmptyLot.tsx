"use client";

import { useMemo } from "react";
import type { EntryMotion } from "./tweak-defaults";
import { mulberry32 } from "./scene-helpers";

// Hestia Wave 1: empty lot SVG scene behind the right window pane (Build from
// scratch). Ported from bundle city-scenes.jsx EmptyLot. No creature rendering
// inside; Revision 1 removed Hermes from the page entirely.

interface EmptyLotProps {
  motion: EntryMotion;
  warmth: number;
}

export function EmptyLot({ motion, warmth }: EmptyLotProps) {
  const sodium = `oklch(${0.76 + warmth * 0.0008} 0.15 ${68 + warmth * 0.12})`;

  const distantSkyline = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const r = mulberry32(i * 19 + 1);
      const w = 14 + r() * 22;
      const h = 18 + r() * 38;
      const x = i * 19 - 4;
      return { key: `el${i}`, x, y: 340 - h, w, h };
    });
  }, []);

  return (
    <svg
      viewBox="0 0 400 520"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
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

      <rect x="0" y="0" width="400" height="360" fill="url(#el-sky)" />

      {distantSkyline.map((b) => (
        <rect
          key={b.key}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="oklch(0.16 0.03 240)"
          opacity={0.65}
        />
      ))}

      <ellipse cx="200" cy="340" rx="240" ry="20" fill="oklch(0.55 0.12 55)" opacity={0.12} />

      <rect x="0" y="340" width="400" height="180" fill="url(#el-ground)" />

      <g stroke="oklch(0.35 0.03 60)" strokeWidth="0.4" opacity="0.55">
        {[346, 356, 370, 388, 412, 442, 478, 520].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y} x2="400" y2={y} />
        ))}
        {Array.from({ length: 9 }, (_, i) => {
          const fx = (i - 4) * 80 + 200;
          return <line key={`v${i}`} x1={fx} y1="520" x2="200" y2="338" />;
        })}
      </g>

      <ellipse
        cx="118"
        cy="430"
        rx="120"
        ry="100"
        fill="url(#el-sodium)"
        style={{
          animation: motion !== "still" ? "cs-pulse 6s ease-in-out infinite" : undefined,
        }}
      />

      <g transform="translate(78, 320)">
        <rect x="-1" y="0" width="2" height="120" fill="oklch(0.28 0.03 60)" />
        <path
          d="M0 4 Q 28 4 38 26"
          stroke="oklch(0.32 0.03 60)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <g transform="translate(38, 26)">
          <path d="M -6 0 L 6 0 L 4 6 L -4 6 Z" fill="oklch(0.32 0.03 60)" />
          <rect
            x="-3.5"
            y="5"
            width="7"
            height="3"
            fill={sodium}
            style={{
              animation: motion !== "still" ? "cs-pulse 6s ease-in-out infinite" : undefined,
            }}
          />
        </g>
      </g>

      <g>
        {[
          { x: 140, y: 420 },
          { x: 320, y: 420 },
          { x: 156, y: 470 },
          { x: 344, y: 470 },
        ].map((p, i) => (
          <g key={`stake${i}`} transform={`translate(${p.x}, ${p.y})`}>
            <line x1="0" y1="0" x2="0" y2="-14" stroke="oklch(0.5 0.06 55)" strokeWidth="1.2" />
            <polygon points="0,-14 -1.6,-12 1.6,-12" fill="oklch(0.6 0.08 55)" />
          </g>
        ))}
        <polyline
          points="140,408 320,408 344,458 156,458 140,408"
          fill="none"
          stroke="oklch(0.7 0.13 75)"
          strokeWidth="0.5"
          strokeDasharray="3 3"
          opacity={0.7}
        />
      </g>

      <g transform="translate(232, 462)">
        <line x1="0" y1="0" x2="0" y2="-22" stroke="oklch(0.45 0.04 55)" strokeWidth="0.8" />
        <path d="M0 -22 L 10 -19 L 0 -16 Z" fill="oklch(0.78 0.14 30)" />
      </g>

      <rect
        x="172"
        y="416"
        width="148"
        height="56"
        fill="none"
        stroke="oklch(0.65 0.1 75)"
        strokeOpacity={0.45}
        strokeWidth="0.6"
        strokeDasharray="2 4"
      />

      <g transform="translate(246, 444)">
        <rect
          x="0"
          y="-7"
          width="3"
          height="9"
          fill={sodium}
          opacity={0.85}
          style={{ animation: "cs-blink 1.1s steps(2,end) infinite" }}
        />
      </g>
    </svg>
  );
}
