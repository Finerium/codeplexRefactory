/**
 * KpiGlance. 4-tile KPI strip top of dashboard.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx KPIStrip() function.
 * Visual: 4 equal-width tiles with hairline dividers, value (36px Bricolage)
 * + delta arrow + monospace note. Trend direction maps to arrow icon.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon, type IconName } from './icons';
import type { KPIMetric } from '@/lib/dashboard/types';

export interface KpiGlanceProps {
  kpis: KPIMetric[];
}

function arrowIcon(trend: KPIMetric['trend']): IconName {
  switch (trend) {
    case 'up':
      return 'arrow-up';
    case 'down':
      return 'arrow-down';
    default:
      return 'arrow-flat';
  }
}

function signedDelta(value: number, unit: string): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${unit}`;
}

export const KpiGlance: React.FC<KpiGlanceProps> = ({ kpis }) => (
  <div className={styles.kpiStrip}>
    {kpis.map((k) => {
      const trendClass =
        k.trend === 'up' ? styles.up : k.trend === 'down' ? styles.down : styles.flat;
      return (
        <div key={k.id} className={styles.kpi}>
          <div>
            <div className={styles.kpiLabel}>{k.label}</div>
          </div>
          <div>
            <div className={styles.kpiValue}>
              <span className={styles.num}>{k.value}</span>
              {k.unitShort && <span className={styles.kpiValueUnit}>{k.unitShort}</span>}
            </div>
            <div className={`${styles.kpiDelta} ${trendClass}`}>
              <Icon name={arrowIcon(k.trend)} size={12} />
              <span className={`${styles.num} dir`}>
                {signedDelta(k.deltaPercent, k.deltaUnit)}
              </span>
              <span className={styles.muted}>· {k.note}</span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
