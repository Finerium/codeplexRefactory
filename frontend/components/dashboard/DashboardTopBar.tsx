'use client';

/**
 * DashboardTopBar. Sticky top bar with brand, repo dropdown, time range, search, avatar.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx TopBar() function.
 *
 * Wave-Fixing #2 cycle 1 (Selene rescue identity, 2026-05-13 03:12 WIB) extends:
 *   - Feature #31 (multi-repo selector): MultiRepoDropdown now exposes a
 *     `onRequestConnect` callback wired by parent DashboardClient to a
 *     session-aware RepoPickerModal (D-1 fix).
 *   - Feature #32 (view toggle City <-> Dashboard): explicit "City view"
 *     button in the top bar. Carries the active repo slug as query param so
 *     /city loads the correct context. Pairs symmetrically with the city's
 *     "Dashboard" link (Daedalus / Persephone top nav) so panitia can flip
 *     between the two surfaces in a single click.
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
  /** Wave-Fixing #2 D-1 fix: parent renders RepoPickerModal when this fires. */
  onRequestConnect?: () => void;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  repos,
  activeRepo,
  onRepoChange,
  activeRange,
  onRangeChange,
  userInitials = 'GB',
  userLabel = 'Ghaisan Badruzaman',
  onRequestConnect,
}) => {
  // Feature #32 view toggle: deep link /city with active repo context.
  const cityHref =
    activeRepo.fullName && activeRepo.fullName !== 'all'
      ? `/city?repo=${encodeURIComponent(activeRepo.fullName)}`
      : '/city';

  return (
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

        <MultiRepoDropdown
          repos={repos}
          active={activeRepo}
          onSelect={onRepoChange}
          onRequestConnect={onRequestConnect}
        />

        {/* Feature #32 view toggle: explicit City view link */}
        <div className={styles.viewToggle} role="group" aria-label="View toggle">
          <span className={`${styles.viewToggleSeg} ${styles.viewToggleSegActive}`}>
            <Icon name="eye" size={12} />
            Dashboard
          </span>
          <a className={styles.viewToggleSeg} href={cityHref}>
            <Icon name="cube" size={12} />
            City view
          </a>
        </div>

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
};
