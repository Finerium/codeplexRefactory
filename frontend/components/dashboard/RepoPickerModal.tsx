'use client';

/**
 * RepoPickerModal. Session-aware "connect repository" modal launched from
 * the dashboard MultiRepoDropdown "+ Connect repository" affordance.
 *
 * Authored by Selene Wave-Fixing #2 cycle 1 rescue identity, 2026-05-13 03:12 WIB.
 *
 * Wave-Fixing bug D-1 root cause: predecessor Selene Wave-Fixing #1 patched the
 * dropdown trailing item from a stub-close to `<a href="/start">`. QA round 2
 * surfaced this still loops the user back to OAuth selection even when they
 * are already authenticated and have a repo selected. Real-browser flow was
 * hollow body-grep claim.
 *
 * This component implements the three documented behaviors per dispatch:
 *
 *   1. Authed + repos available -> fetch GET /api/repos/list, render user's
 *      GitHub repos in the modal, click row navigates /city?repo=<full_name>.
 *      The dashboard then refreshes via the parent active-repo state setter.
 *   2. Authed + no repos available (empty list) -> render demo dataset cards
 *      + "Paste a repo URL" affordance (mirror of /start/pick-repo).
 *   3. Unauthed (401 from /api/repos/list) -> render "OAuth session expired"
 *      banner + CTA goes to /start. This is the ONLY path that reroutes
 *      to /start, and only when truly necessary.
 *
 * Lock 5 (honest claim): The modal labels its 401 state explicitly as
 * "OAuth session expired or cleared" rather than silently rerouting. The
 * 502 state surfaces demo datasets as a fallback.
 *
 * Lock 1 (no em dash): clean.
 * Lock 2 (no emoji): clean.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';

export interface RepoPickerModalProps {
  /** Active GitHub login (from session) used in the header copy. */
  authedAs?: string;
  /** Close handler from parent. */
  onClose: () => void;
  /**
   * When the user picks a repo, this fires with the full name (owner/name).
   * Parent uses it to navigate /city or update the dashboard active repo.
   */
  onRepoSelected: (fullName: string) => void;
}

interface RepoSummary {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string | null;
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; repos: RepoSummary[] }
  | { kind: 'unauthenticated' }
  | { kind: 'error'; message: string };

const DEMO_DATASETS = [
  {
    key: 'nodegoat',
    label: 'OWASP NodeGoat',
    description: 'Insecure Node.js training app. Argus security demo.',
  },
  {
    key: 'fastapi-template',
    label: 'fastapi/full-stack-fastapi-template',
    description: 'Reference FastAPI + React full-stack project. Apollo health demo.',
  },
] as const;

const REPO_NAME_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

function parseRepoInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('https://github.com/')) {
    const rest = trimmed
      .replace(/^https:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/$/, '');
    return REPO_NAME_RE.test(rest) ? rest : null;
  }
  return REPO_NAME_RE.test(trimmed) ? trimmed : null;
}

function backendBase(): string {
  const fromEnv =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL
      : '';
  return fromEnv.replace(/\/$/, '');
}

export const RepoPickerModal: React.FC<RepoPickerModalProps> = ({
  authedAs,
  onClose,
  onRepoSelected,
}) => {
  const [state, setState] = React.useState<FetchState>({ kind: 'loading' });
  const [search, setSearch] = React.useState('');
  const [manualInput, setManualInput] = React.useState('');
  const [manualError, setManualError] = React.useState<string | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch /api/repos/list on mount.
  React.useEffect(() => {
    let cancelled = false;
    const url = `${backendBase()}/api/repos/list`;
    void (async () => {
      try {
        const resp = await fetch(url, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (cancelled) return;
        if (resp.status === 401) {
          setState({ kind: 'unauthenticated' });
          return;
        }
        if (!resp.ok) {
          setState({
            kind: 'error',
            message: `repo list failed: status ${resp.status}`,
          });
          return;
        }
        const data = (await resp.json()) as RepoSummary[];
        setState({ kind: 'ready', repos: data });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'unknown network error';
        setState({ kind: 'error', message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Escape key + outside click close.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDocClick = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [onClose]);

  const filteredRepos = React.useMemo(() => {
    if (state.kind !== 'ready') return [];
    const q = search.trim().toLowerCase();
    if (!q) return state.repos;
    return state.repos.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.language ?? '').toLowerCase().includes(q),
    );
  }, [state, search]);

  const onPickRepo = React.useCallback(
    (fullName: string) => {
      onRepoSelected(fullName);
      onClose();
    },
    [onRepoSelected, onClose],
  );

  const onPickDemo = React.useCallback((key: string) => {
    window.location.href = `/city?demo=${encodeURIComponent(key)}&mock_auth=true`;
  }, []);

  const onManualSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const parsed = parseRepoInput(manualInput);
      if (!parsed) {
        setManualError('expected owner/name or https://github.com/owner/name');
        return;
      }
      setManualError(null);
      onPickRepo(parsed);
    },
    [manualInput, onPickRepo],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-picker-modal-title"
      className={styles.modalBackdrop}
    >
      <div ref={dialogRef} className={styles.modalDialog}>
        <header className={styles.modalHeader}>
          <div>
            <div className={styles.modalKicker}>
              {authedAs ? `signed in as ${authedAs}` : 'connect a repository'}
            </div>
            <h2 id="repo-picker-modal-title" className={styles.modalTitle}>
              Switch or connect a repository
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={14} />
          </button>
        </header>

        <div className={styles.modalBody}>
          {state.kind === 'loading' && (
            <div className={styles.modalStatus}>
              loading your GitHub repositories...
            </div>
          )}

          {state.kind === 'unauthenticated' && (
            <div className={`${styles.modalStatus} ${styles.modalStatusWarn}`}>
              <div className={styles.modalStatusTitle}>
                OAuth session expired or cleared
              </div>
              <p className={styles.modalStatusBody}>
                The repo picker needs a fresh OAuth token. Reconnect to GitHub
                or pick a demo dataset below.
              </p>
              <a href="/start" className={styles.modalPrimaryBtn}>
                Reconnect to GitHub
                <Icon name="arrow-right" size={12} />
              </a>
            </div>
          )}

          {state.kind === 'error' && (
            <div className={`${styles.modalStatus} ${styles.modalStatusWarn}`}>
              <div className={styles.modalStatusTitle}>
                could not reach /api/repos/list
              </div>
              <p className={styles.modalStatusBody}>
                {state.message}. Pick a demo dataset below or paste a repository
                URL manually.
              </p>
            </div>
          )}

          {state.kind === 'ready' && state.repos.length > 0 && (
            <section className={styles.modalSection}>
              <div className={styles.modalSectionHeader}>
                <h3 className={styles.modalSectionTitle}>
                  Your repositories
                  <span className={styles.modalSectionMuted}>
                    {state.repos.length} found
                  </span>
                </h3>
                <input
                  type="search"
                  placeholder="filter by name or language..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.modalSearch}
                />
              </div>

              {filteredRepos.length === 0 ? (
                <p className={styles.modalEmptyHint}>
                  no repositories match &quot;{search}&quot;. Clear the filter
                  to see all {state.repos.length} repos.
                </p>
              ) : (
                <ul className={styles.modalRepoList}>
                  {filteredRepos.map((repo) => (
                    <li key={repo.id}>
                      <button
                        type="button"
                        onClick={() => onPickRepo(repo.full_name)}
                        className={styles.modalRepoRow}
                        aria-label={`Switch to ${repo.full_name}`}
                      >
                        <div className={styles.modalRepoRowLeft}>
                          <div className={styles.modalRepoRowName}>
                            <span>{repo.full_name}</span>
                            {repo.private && (
                              <span className={styles.modalRepoBadge}>private</span>
                            )}
                            {repo.language && (
                              <span className={styles.modalRepoBadgeLang}>
                                {repo.language}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <div className={styles.modalRepoRowDesc}>
                              {repo.description}
                            </div>
                          )}
                        </div>
                        <span className={styles.modalRepoRowCta}>
                          select
                          <Icon name="arrow-right" size={11} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {state.kind === 'ready' && state.repos.length === 0 && (
            <div className={`${styles.modalStatus} ${styles.modalStatusInfo}`}>
              <div className={styles.modalStatusTitle}>
                no repositories returned
              </div>
              <p className={styles.modalStatusBody}>
                GitHub returned an empty list. Paste a repo URL or pick a demo
                dataset below.
              </p>
            </div>
          )}

          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>
              Or paste a repository URL
            </h3>
            <form onSubmit={onManualSubmit} className={styles.modalManualForm}>
              <input
                type="text"
                placeholder="owner/name or https://github.com/owner/name"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className={styles.modalManualInput}
                aria-label="repository owner/name or URL"
              />
              <button type="submit" className={styles.modalPrimaryBtn}>
                Switch to this repo
                <Icon name="arrow-right" size={11} />
              </button>
            </form>
            {manualError && (
              <p className={styles.modalManualError}>{manualError}</p>
            )}
          </section>

          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>
              Or load a demo dataset
              <span className={styles.modalSectionMuted}>
                pre-parsed, no GitHub call
              </span>
            </h3>
            <div className={styles.modalDemoGrid}>
              {DEMO_DATASETS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => onPickDemo(d.key)}
                  className={styles.modalDemoCard}
                  aria-label={`Load demo ${d.label}`}
                >
                  <div className={styles.modalDemoCardTitle}>{d.label}</div>
                  <div className={styles.modalDemoCardDesc}>{d.description}</div>
                  <span className={styles.modalDemoCardCta}>
                    load demo
                    <Icon name="arrow-right" size={11} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
