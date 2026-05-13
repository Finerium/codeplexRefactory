/**
 * MilestoneProgress. Active milestone tracker panel.
 *
 * Authored by Selene (Manager Wave-Fixing #3, 2026-05-13). Closes the
 * carry-forward gap surfaced by Manager Wave-Fixing #2 cycle 1 (per
 * `_meta/audit/prd_feature_verification_20260513-0322.md` line 150):
 * DashboardData.milestones shape was already wired through the Pythia contract
 * + backend Pydantic + frontend types + mock derivation, but no React panel
 * mounted it on the page so the manager view had a gap.
 *
 * Renders one row per active milestone with:
 *  - label
 *  - percent-complete progress bar (0..100)
 *  - days-remaining (negative renders "overdue")
 *  - blockers count (open issues blocking the milestone)
 *
 * Voice: instrument-panel mood per Designer Prompt 3 line 215 (calm + sober).
 * Severity-aware: overdue + > 0 blockers tints the row sev-3, days <= 2 + 0
 * blockers tints sev-2 ("ship window narrow but green"); else default ink.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import type { MilestoneProgress as MilestoneProgressType } from '@/lib/dashboard/types';

export interface MilestoneProgressPanelProps {
  milestones: MilestoneProgressType[];
}

function rowSeverityClass(m: MilestoneProgressType): string {
  if (m.daysRemaining < 0) return styles.milestoneOverdue ?? '';
  if (m.daysRemaining <= 2 && m.blockersCount > 0) return styles.milestoneAtRisk ?? '';
  return '';
}

export const MilestoneProgressPanel: React.FC<MilestoneProgressPanelProps> = ({
  milestones,
}) => {
  if (!milestones || milestones.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div>
            <h3>Milestone progress</h3>
            <div className={styles.cardSub}>no active milestones for this scope</div>
          </div>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.muted} style={{ padding: '12px 0', margin: 0 }}>
            No milestones are currently active in the selected repository and time range.
          </p>
        </div>
      </div>
    );
  }

  const onTrack = milestones.filter(
    (m) => m.daysRemaining >= 0 && m.percentComplete >= 50,
  ).length;

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div>
          <h3>Milestone progress</h3>
          <div className={styles.cardSub}>
            {milestones.length} active · {onTrack} on track
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {milestones.map((m) => {
            const overdue = m.daysRemaining < 0;
            const daysLabel = overdue
              ? `${Math.abs(m.daysRemaining)}d overdue`
              : m.daysRemaining === 0
                ? 'ships today'
                : `${m.daysRemaining}d remaining`;
            const pct = Math.max(0, Math.min(100, m.percentComplete));
            return (
              <li
                key={m.id}
                className={rowSeverityClass(m)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 96px',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      gap: 12,
                    }}
                  >
                    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{m.label}</span>
                    <span
                      className={styles.muted}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${m.label} progress`}
                    style={{
                      height: 6,
                      background: 'var(--hairline)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: overdue
                          ? 'var(--sev-5)'
                          : pct >= 80
                            ? 'var(--accent)'
                            : 'var(--ink-2)',
                        transition: 'width 200ms ease',
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      color: overdue ? 'var(--sev-5)' : 'var(--ink-2)',
                      fontSize: 12,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {daysLabel}
                  </div>
                  <div
                    className={styles.muted}
                    style={{ fontSize: 11, marginTop: 2 }}
                  >
                    {m.blockersCount === 0
                      ? 'no blockers'
                      : `${m.blockersCount} blocker${m.blockersCount === 1 ? '' : 's'}`}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
