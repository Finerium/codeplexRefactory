/**
 * TopContributors. Sprint contributor list with PR throughput bar.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx Contributors() function.
 * Avatar (initials fallback) + display name + handle + PR bar (proportional
 * to max in list) + PR count + review count.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import type { ContributorStats } from '@/lib/dashboard/types';

export interface TopContributorsProps {
  contributors: ContributorStats[];
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const TopContributors: React.FC<TopContributorsProps> = ({ contributors }) => {
  const maxPRs = Math.max(...contributors.map((c) => c.prsOpened), 1);

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div>
          <h3>Top contributors</h3>
          <div className={styles.cardSub}>sprint 14 · pr throughput</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        {contributors.map((c) => (
          <div key={c.githubLogin} className={styles.contribRow}>
            <div className={styles.avatar} aria-hidden>
              {initials(c.displayName)}
            </div>
            <div>
              <div className={styles.contribName}>{c.displayName}</div>
              <div className={styles.contribHandle}>@{c.githubLogin}</div>
            </div>
            <div
              className={styles.bar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={maxPRs}
              aria-valuenow={c.prsOpened}
              aria-label={`${c.prsOpened} of ${maxPRs} PRs opened`}
            >
              <i style={{ width: `${(c.prsOpened / maxPRs) * 100}%` }} />
            </div>
            <div
              className={styles.num}
              style={{ textAlign: 'right', color: 'var(--ink)', fontSize: 13 }}
            >
              {c.prsOpened} PR
            </div>
            <div
              className={`${styles.num} ${styles.muted}`}
              style={{ textAlign: 'right', fontSize: 11.5 }}
            >
              {c.reviewsSubmitted} rv
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
