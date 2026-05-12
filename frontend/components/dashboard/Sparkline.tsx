'use client';

/**
 * Sparkline. Tiny inline trend line for cross-repo rail.
 *
 * Selene keeps Designer's hand-authored inline SVG (charts.jsx Sparkline()) for
 * sparklines instead of Recharts; reason: each repo cell renders a 70x20px
 * sparkline, Recharts ResponsiveContainer adds overhead for 5 micro-charts.
 * Inline SVG polyline is the lean choice for this density.
 *
 * Designer fidelity: accent color when active, muted ink-2 stroke @ 0.55 opacity
 * for inactive. Stroke width 1.2.
 */

import * as React from 'react';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  accent?: boolean;
  ariaLabel?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 70,
  height = 20,
  accent = false,
  ariaLabel,
}) => {
  const padY = 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = padY + (1 - (v - min) / range) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
      role="img"
      aria-label={ariaLabel ?? 'sparkline'}
    >
      <polyline
        points={points}
        fill="none"
        stroke={accent ? 'var(--accent)' : 'var(--ink-2)'}
        strokeOpacity={accent ? 1 : 0.55}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
