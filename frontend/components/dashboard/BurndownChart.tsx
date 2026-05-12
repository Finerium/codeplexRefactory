'use client';

/**
 * BurndownChart. Sprint burndown as Recharts ComposedChart.
 *
 * Ported from Designer bundle charts.jsx Burndown() function. Designer drew
 * a custom SVG path; Selene reimplements via Recharts to satisfy OQ-02
 * decision lock (Recharts for chart visuals, see
 * `_meta/decisions/oq02_charts_library.md`).
 *
 * Visual: dashed ideal line (muted-2) + solid actual line (accent) with subtle
 * fill underlay (accent-3) + today reference line (accent dashed) + dot at the
 * "projected from" point. Y axis 0..max + 3 gridlines. X axis day labels D0..DN.
 */

import * as React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { BurndownPoint, BurndownMeta } from '@/lib/dashboard/types';

export interface BurndownChartProps {
  data: BurndownPoint[];
  meta: BurndownMeta;
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: string | number };
}

const AxisTick: React.FC<TickProps> = ({ x, y, payload }) => (
  <text
    x={x}
    y={y}
    dy={10}
    fill="var(--muted)"
    fontFamily="var(--font-mono)"
    fontSize={10}
    textAnchor="middle"
  >
    D{payload?.value ?? ''}
  </text>
);

const YTick: React.FC<TickProps> = ({ x, y, payload }) => (
  <text
    x={x}
    y={y}
    dx={-4}
    dy={3}
    fill="var(--muted)"
    fontFamily="var(--font-mono)"
    fontSize={10}
    textAnchor="end"
  >
    {payload?.value ?? ''}
  </text>
);

export const BurndownChart: React.FC<BurndownChartProps> = ({ data, meta }) => {
  /*
   * Split actualRemaining series into "real" (<= todayIndex) and "projection"
   * (> todayIndex). Designer rendered the projection segment as a dashed
   * dotted continuation. Recharts achieves this with two separate Line series
   * + null gaps.
   */
  const chartData = data.map((d) => ({
    day: d.day,
    ideal: d.idealRemaining,
    actualReal: d.day <= meta.todayIndex ? d.actualRemaining : null,
    actualProjected: d.day >= meta.todayIndex ? d.actualRemaining : null,
  }));

  const maxY = Math.max(...data.map((d) => Math.max(d.idealRemaining, d.actualRemaining)));
  const todayActual = data[meta.todayIndex]?.actualRemaining ?? 0;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart
        data={chartData}
        margin={{ top: 18, right: 16, bottom: 4, left: 4 }}
      >
        <CartesianGrid stroke="var(--hairline)" strokeDasharray="2 3" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="var(--hairline)"
          tick={<AxisTick />}
          tickLine={false}
          axisLine={{ stroke: 'var(--hairline)' }}
        />
        <YAxis
          stroke="var(--hairline)"
          domain={[0, maxY]}
          ticks={[0, Math.round(maxY / 2), maxY]}
          tick={<YTick />}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: '1px solid var(--ink)',
            borderRadius: 5,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
          labelStyle={{ color: 'var(--bg)' }}
          itemStyle={{ color: 'var(--bg)' }}
          labelFormatter={(d) => `Day ${d}`}
          formatter={(v, name) => {
            if (v == null) return ['', ''];
            const labelMap: Record<string, string> = {
              ideal: 'Ideal',
              actualReal: 'Actual',
              actualProjected: 'Projected',
            };
            return [`${v} pts`, labelMap[String(name)] ?? String(name)];
          }}
        />
        <Area
          type="monotone"
          dataKey="actualReal"
          stroke="transparent"
          fill="var(--accent-3)"
          fillOpacity={1}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="var(--muted-2)"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="actualReal"
          stroke="var(--accent)"
          strokeWidth={1.5}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="actualProjected"
          stroke="var(--accent)"
          strokeWidth={1.2}
          strokeDasharray="3 3"
          dot={false}
          connectNulls={false}
          strokeOpacity={0.6}
          isAnimationActive={false}
        />
        <ReferenceLine
          x={meta.todayIndex}
          stroke="var(--accent)"
          strokeOpacity={0.45}
          strokeDasharray="3 3"
          label={{
            value: `TODAY · D${meta.todayIndex}`,
            position: 'insideTopRight',
            fill: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          }}
        />
        <ReferenceDot
          x={meta.todayIndex}
          y={todayActual}
          r={3}
          fill="var(--accent)"
          stroke="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
