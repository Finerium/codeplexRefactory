'use client';

/**
 * MultiRepoDropdown. Repo selector with custom popover menu.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx TopBar() dropdown segment.
 * Trigger pill shows repo name + branch + chevron. Menu lists repos with
 * status dot, repo name (mono), and sub line (branch + open PR + drift count).
 * Active repo gets check mark. Last item is "+ Connect repository" stub.
 *
 * Dismiss-on-click-outside via global mousedown listener (matches Designer behavior).
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';
import type { RepoStatus } from '@/lib/dashboard/types';

export interface MultiRepoDropdownProps {
  repos: RepoStatus[];
  active: RepoStatus;
  onSelect: (repo: RepoStatus) => void;
}

const statusDotClass: Record<RepoStatus['statusDot'], string> = {
  green: styles.statusDotGreen ?? '',
  yellow: styles.statusDotYellow ?? '',
  red: styles.statusDotRed ?? '',
  gray: styles.statusDotGray ?? '',
};

export const MultiRepoDropdown: React.FC<MultiRepoDropdownProps> = ({
  repos,
  active,
  onSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.dropWrap}>
      <button
        type="button"
        className={styles.pill}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon name="github" size={13} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {active.fullName}
        </span>
        <span
          className={styles.muted}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          · {active.branch}
        </span>
        <Icon name="chev-down" size={12} className={styles.pillChev} />
      </button>
      {open && (
        <div className={styles.menu} role="listbox">
          {repos.map((r) => {
            const isActive = r.fullName === active.fullName;
            return (
              <div
                key={r.fullName}
                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(r);
                    setOpen(false);
                  }
                }}
                role="option"
                aria-selected={isActive}
                tabIndex={0}
              >
                <span
                  className={`${styles.statusDot} ${statusDotClass[r.statusDot]}`}
                  aria-hidden
                />
                <div className={styles.menuItemLeft}>
                  <div className={styles.menuItemRepoName}>{r.fullName}</div>
                  <div className={styles.menuItemSub}>
                    {r.branch} · {r.openPRs} open PRs · {r.driftCount} drift
                  </div>
                </div>
                {isActive && <Icon name="check" size={13} />}
              </div>
            );
          })}
          <div className={styles.menuDivider} />
          {/*
            Wave-Fixing cycle 1 (Selene rescue identity, 2026-05-13 01:47 WIB):
            D-1c fix. "+ Connect repository" was a stub that only closed the
            menu. It now navigates to /start which hosts the GitHub OAuth +
            "Import a repository" + "Build from scratch" entry flow (Hestia
            Wave 1, PRD Section 7.1 line 300 GitHub OAuth scope minimal).
          */}
          <a
            className={styles.menuItem}
            href="/start"
            role="option"
            aria-selected={false}
            tabIndex={0}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className={`${styles.menuItemLeft} ${styles.muted}`}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              + Connect repository
            </div>
          </a>
        </div>
      )}
    </div>
  );
};
