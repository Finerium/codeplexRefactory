'use client';

/**
 * VelocityChart. Last-8-sprints story-points completed as Recharts BarChart.
 *
 * Ported from Designer bundle charts.jsx Velocity() function. Bars at 18%
 * opacity for previous sprints, full accent fill for the current sprint
 * (isCurrent flag in mock data). Average line dashed across the chart.
 *
 * Recharts replaces Designer's hand-authored SVG per OQ-02 decision lock.
 */

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Tooltip,
  LabelList,
} from 'recharts';
import type { VelocityPoint } from '@/lib/dashboard/types';

export interface VelocityChartProps {
  data: VelocityPoint[];
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: string | number };
}

const XTick: React.FC<TickProps> = ({ x, y, payload }) => (
  <text
    x={x}
    y={y}
    dy={12}
    fill="var(--muted)"
    fontFamily="var(--font-mono)"
    fontSize={10}
    textAnchor="middle"
  >
    {payload?.value ?? ''}
  </text>
);

interface BarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string;
  index?: number;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  const avg = data.reduce((s, d) => s + d.pointsCompleted, 0) / data.length;
  const chartData = data.map((d) => ({
    sprint: d.sprintLabel,
    points: d.pointsCompleted,
    isCurrent: d.isCurrent ?? false,
  }));

  const renderTopLabel = (props: BarLabelProps): React.ReactNode => {
    const { x, y, width, value, index } = props;
    if (x == null || y == null || width == null || value == null || index == null) {
      return null;
    }
    const nx = typeof x === 'number' ? x : Number(x);
    const ny = typeof y === 'number' ? y : Number(y);
    const nw = typeof width === 'number' ? width : Number(width);
    const isCurrent = chartData[index]?.isCurrent ?? false;
    return (
      <text
        x={nx + nw / 2}
        y={ny - 5}
        textAnchor="middle"
        fill={isCurrent ? 'var(--ink)' : 'var(--ink-2)'}
        fontFamily="var(--font-mono)"
        fontSize={10}
        fontWeight={isCurrent ? 600 : 400}
      >
        {value}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={chartData}
        margin={{ top: 24, right: 14, bottom: 8, left: 4 }}
        barCategoryGap="20%"
      >
        <XAxis
          dataKey="sprint"
          stroke="var(--hairline)"
          tick={<XTick />}
          tickLine={false}
          axisLine={{ stroke: 'var(--hairline)' }}
        />
        <YAxis hide domain={[0, Math.max(...chartData.map((d) => d.points)) + 4]} />
        <Tooltip
          cursor={{ fill: 'var(--hover)' }}
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
          formatter={(v: number) => [`${v} pts`, 'Completed']}
        />
        <ReferenceLine
          y={avg}
          stroke="var(--muted-2)"
          strokeDasharray="3 3"
          strokeWidth={1}
          label={{
            value: `avg ${avg.toFixed(1)}`,
            position: 'insideTopRight',
            fill: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          }}
        />
        <Bar dataKey="points" radius={[1, 1, 0, 0]} isAnimationActive={false}>
          {chartData.map((d) => (
            <Cell
              key={d.sprint}
              fill={d.isCurrent ? 'var(--accent)' : 'var(--ink-2)'}
              fillOpacity={d.isCurrent ? 1 : 0.18}
            />
          ))}
          <LabelList dataKey="points" content={renderTopLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
