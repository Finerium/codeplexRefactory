'use client';

/**
 * DashboardTopBar. Sticky top bar with brand, repo dropdown, time range, search, avatar.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx TopBar() function.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';
import { MultiRepoDropdown } from './MultiRepoDropdown';
import { TimeRangeSelector } from './TimeRangeSelector';
import type { RepoStatus, TimeRangeOption } from '@/lib/dashboard/types';

export interface DashboardTopBarProps {
  repos: RepoStatus[];
  activeRepo: RepoStatus;
  onRepoChange: (repo: RepoStatus) => void;
  activeRange: TimeRangeOption;
  onRangeChange: (range: TimeRangeOption) => void;
  /** Initials shown in the avatar; defaults to "GB" for Ghaisan Badruzaman. */
  userInitials?: string;
  /** Tooltip / aria-label for avatar. */
  userLabel?: string;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  repos,
  activeRepo,
  onRepoChange,
  activeRange,
  onRangeChange,
  userInitials = 'GB',
  userLabel = 'Ghaisan Badruzaman',
}) => (
  <header className={styles.topbar}>
    <div className={`${styles.shell} ${styles.topbarInner}`}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 1.5 1.5 5v8L9 16.5 16.5 13V5L9 1.5z" />
            <path d="M1.5 5 9 8.5 16.5 5M9 8.5v8" />
          </svg>
        </span>
        <span>Codeplex Chronicle</span>
        <span className={styles.brandSep}>/</span>
        <span className={styles.brandPage}>Dashboard</span>
      </div>

      <MultiRepoDropdown repos={repos} active={activeRepo} onSelect={onRepoChange} />

      <div className={styles.topbarSpacer} />

      <TimeRangeSelector active={activeRange} onChange={onRangeChange} />

      <button type="button" className={`${styles.ghost} ${styles.searchBtn}`} title="Search">
        <Icon name="search" size={13} />
        <span className={styles.searchBtnHint}>Cmd K</span>
      </button>

      <div
        className={styles.topbarAvatar}
        title={userLabel}
        aria-label={userLabel}
      >
        {userInitials}
      </div>
    </div>
  </header>
);
