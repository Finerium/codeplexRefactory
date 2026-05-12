'use client';

/**
 * MultiRepoDropdown. Repo selector with custom popover menu.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx TopBar() dropdown segment.
 * Trigger pill shows repo name + branch + chevron. Menu lists repos with
 * status dot, repo name (mono), and sub line (branch + open PR + drift count).
 * Active repo gets check mark.
 *
 * Wave-Fixing #2 cycle 1 (Selene rescue identity, 2026-05-13 03:12 WIB), bug D-1:
 * The trailing "+ Connect repository" affordance was previously hardcoded to
 * `<a href="/start">` which caused a redirect loop when the user was already
 * authenticated and had a repo selected (QA round 2 real-browser test).
 *
 * The fix promotes the affordance to a controlled callback `onRequestConnect`
 * that the parent `DashboardClient` wires to a session-aware `RepoPickerModal`:
 *
 *   - User authed + repos available -> modal lists GitHub repos via
 *     /api/repos/list, click row updates dashboard active repo.
 *   - User authed + no repos -> modal shows demo dataset cards + manual URL
 *     input.
 *   - User unauthed (401 from /api/repos/list) -> modal surfaces explicit
 *     "OAuth session expired" state + CTA to /start. This is the ONLY path
 *     that reroutes to /start.
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
  /**
   * Wave-Fixing #2 cycle 1 (D-1 fix): parent renders the RepoPickerModal
   * when this fires. Without this callback the dropdown falls back to the
   * Wave-Fixing #1 behavior (anchor href="/start"), preserved as a defensive
   * safety net so the dropdown never silently no-ops.
   */
  onRequestConnect?: () => void;
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
  onRequestConnect,
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
            Wave-Fixing #2 cycle 1 (Selene rescue identity, 2026-05-13 03:12 WIB):
            D-1 root cause fix. Previously this was a stub close, then a hardcoded
            `<a href="/start">` which still caused a redirect loop when the user
            was authed + had a repo selected. It now delegates to the parent
            DashboardClient via `onRequestConnect` so the parent renders the
            session-aware `RepoPickerModal`.

            Defensive fallback: when `onRequestConnect` is not wired (e.g. unit
            test or older Persephone consumer), the affordance falls back to an
            anchor to /start so the user is never stranded with a silent no-op.
          */}
          {onRequestConnect ? (
            <button
              type="button"
              className={styles.menuItem}
              role="option"
              aria-selected={false}
              tabIndex={0}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'inherit',
                font: 'inherit',
              }}
              onClick={() => {
                setOpen(false);
                onRequestConnect();
              }}
            >
              <div
                className={`${styles.menuItemLeft} ${styles.muted}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              >
                + Connect another repository
              </div>
            </button>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
};
