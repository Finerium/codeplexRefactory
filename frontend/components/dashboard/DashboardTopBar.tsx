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
 *
 * Manager FINAL Cycle 2 Cluster G coord (Selene + Calliope, 2026-05-13 08:57
 * WIB): adds a prominent glassmorphism "City" nav button immediately to the
 * right of the brand mark (top-left). Pairs symmetrically with the
 * Calliope-owned "Dashboard" button on /city top-right. The pre-existing
 * inline view toggle pill stays in place as the secondary affordance; the
 * glassmorphism pill is the primary entry the manager scans first.
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

        {/*
          Manager FINAL Cycle 2 Cluster G coord. Glassmorphism "City" pill
          mounted top-left adjacent to the brand. Pairs with the
          Calliope-owned "Dashboard" pill on /city for symmetric two-click
          navigation between the manager dashboard and the 3D codebase
          spatial workspace.
        */}
        <a
          href={cityHref}
          className={styles.cityNavGlass}
          aria-label="Open codebase 3D city view"
          data-testid="city-nav-glass"
        >
          <span className={styles.cityNavGlassIcon} aria-hidden>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1.8 2 4.6v6.8L8 14.2l6-2.8V4.6L8 1.8z" />
              <path d="M2 4.6 8 7.4l6-2.8M8 7.4v6.8" />
            </svg>
          </span>
          <span>City</span>
        </a>

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
