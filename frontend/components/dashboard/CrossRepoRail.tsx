'use client';

/**
 * CrossRepoRail. 5-cell horizontal rail of connected repositories.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx RepoRail() function.
 * Each cell: status dot + repo label + sparkline (accent if active) + meta
 * row (open count + drift count). Cells are clickable and select the repo.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Sparkline } from './Sparkline';
import type { RepoStatus } from '@/lib/dashboard/types';

export interface CrossRepoRailProps {
  repos: RepoStatus[];
  activeFullName: string;
  onSelect: (repo: RepoStatus) => void;
}

const statusDotClass: Record<RepoStatus['statusDot'], string> = {
  green: styles.statusDotGreen ?? '',
  yellow: styles.statusDotYellow ?? '',
  red: styles.statusDotRed ?? '',
  gray: styles.statusDotGray ?? '',
};

export const CrossRepoRail: React.FC<CrossRepoRailProps> = ({
  repos,
  activeFullName,
  onSelect,
}) => {
  const totalDrift = repos.reduce((s, r) => s + r.driftCount, 0);
  return (
    <section style={{ marginTop: 'var(--gap)' }}>
      <div className={styles.repoRailHeader}>
        <div className={styles.sectionLabel}>Connected repositories</div>
        <div className={styles.sectionLabel} style={{ color: 'var(--muted-2)' }}>
          {repos.length} repos · {totalDrift} drift events
        </div>
      </div>
      <div className={styles.repoRail} role="list">
        {repos.map((r) => {
          const isActive = r.fullName === activeFullName;
          return (
            <button
              key={r.fullName}
              type="button"
              className={`${styles.repoCell} ${isActive ? styles.repoCellActive : ''}`}
              onClick={() => onSelect(r)}
              role="listitem"
              aria-pressed={isActive}
            >
              <div className={styles.repoCellHd}>
                <div className={styles.repoName}>
                  <span
                    className={`${styles.statusDot} ${statusDotClass[r.statusDot]}`}
                    aria-label={`status ${r.statusDot}`}
                  />
                  {r.label}
                </div>
                <Sparkline
                  data={r.sparkline}
                  accent={isActive}
                  ariaLabel={`${r.label} commit trend last 14 days`}
                />
              </div>
              <div className={styles.repoMeta}>
                <span>{r.openPRs} open</span>
                <span>{r.driftCount > 0 ? `${r.driftCount} drift` : 'no drift'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
