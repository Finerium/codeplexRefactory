/**
 * SpecDriftSummary. 5-pattern A-E severity-encoded drift table.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx DriftSection() + DriftRow().
 * Header row + 5 pattern rows with severity meter (5 bars, level fills sev-1
 * through sev-5 OKLCH ramp) + trend delta + count. Pattern E severity 5 row
 * has tinted background per Designer intent.md scannable < 1s discipline.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';
import type { DriftSummary } from '@/lib/dashboard/types';

export interface SpecDriftSummaryProps {
  drifts: DriftSummary[];
}

const meterLevelClasses: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: styles.on1 ?? '',
  2: styles.on2 ?? '',
  3: styles.on3 ?? '',
  4: styles.on4 ?? '',
  5: styles.on5 ?? '',
};

const DriftRow: React.FC<{ pattern: DriftSummary }> = ({ pattern }) => {
  const sev5 = pattern.severityLevel === 5;
  return (
    <div
      className={`${styles.driftRow} ${sev5 ? styles.driftRowSev5 : ''}`}
      data-sev={pattern.severityLevel}
      role="row"
    >
      <div className={styles.driftTag}>{pattern.pattern}</div>
      <div>
        <div className={styles.driftTitle}>{pattern.patternLabel}</div>
        <div className={styles.driftDesc}>
          {pattern.patternDescription}
          {pattern.district ? ` · ${pattern.district} district` : ''}
        </div>
      </div>
      <div
        className={styles.meter}
        aria-label={`severity ${pattern.severityLevel} of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <i
            key={i}
            className={
              i <= pattern.severityLevel
                ? meterLevelClasses[pattern.severityLevel as 1 | 2 | 3 | 4 | 5]
                : ''
            }
          />
        ))}
      </div>
      <div
        className={`${styles.num} ${styles.muted}`}
        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        trend {pattern.trend}
      </div>
      <div className={styles.driftCount}>{pattern.count}</div>
    </div>
  );
};

export const SpecDriftSummary: React.FC<SpecDriftSummaryProps> = ({ drifts }) => {
  const total = drifts.reduce((s, p) => s + p.count, 0);
  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div>
          <h3>Spec drift summary</h3>
          <div className={styles.cardSub}>
            five patterns · scanning across {total} events
          </div>
        </div>
        <button type="button" className={styles.ghost}>
          <span>Open drift inspector</span>
          <Icon name="arrow-right" size={12} />
        </button>
      </div>
      <div className={styles.cardBody} style={{ paddingTop: 4 }}>
        <div className={styles.driftHeader} role="row">
          <span></span>
          <span>Pattern</span>
          <span>Severity</span>
          <span>Trend vs last</span>
          <span>Count</span>
        </div>
        {drifts.map((p) => (
          <DriftRow key={p.pattern} pattern={p} />
        ))}
      </div>
    </div>
  );
};
