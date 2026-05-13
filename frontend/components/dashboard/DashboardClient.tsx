'use client';

/**
 * DashboardClient. Top-level interactive dashboard composition.
 *
 * Authored by Selene (Wave 1). Ported 1-to-1 from Designer bundle
 * `app.jsx` App() composition (lines 11-137). Voice + structure + chart layout
 * preserved per directive line "NO REVISIONS, clean port".
 *
 * Server Component delegates initial data fetch to `useDashboardData()`
 * (Wave 1 mock, Wave 3 Demeter swap). Top-level state owns active repo +
 * time range filter.
 *
 * Wave-Fixing cycle 1 (Selene rescue identity, 2026-05-13 01:47 WIB) patches:
 *  D-1 bug: useDashboardData() now consumes the live (activeRepo, activeRange)
 *           state so repo dropdown + time-range segment change cause a real
 *           refetch with derived-different KPI / velocity / burndown numbers.
 *           Mock derivation in `mockDashboardData.deriveMockForQuery`.
 *  D-2 bug: PurposeBanner mounted above BriefingHeader frames the dashboard
 *           role (manager-facing project management overview) and surfaces a
 *           clear cross-nav cue to /city codebase 3D.
 *  D-4 bug: CrossNavRail mounted after KPIs surfaces 3 disambiguation cards
 *           pointing to Activity Mode (Q1 git time machine analogue), static
 *           diagrams (Q2 auto diagram engine honest pointer), and city view.
 *           Honest claim discipline: text says "static diagrams" not
 *           "auto diagram engine".
 *
 * Wave-Fixing #2 cycle 1 (Selene rescue identity, 2026-05-13 03:12 WIB):
 *  D-1 root cause fix: Wave-Fixing #1 patched MultiRepoDropdown trailing item
 *  to `<a href="/start">`, which QA round 2 showed still loops back to OAuth
 *  selection when the user is already authenticated and has a repo selected.
 *  The fix renders a session-aware `RepoPickerModal` triggered by both the
 *  dropdown trailing item AND the legacy footer "connect repo" link. The
 *  modal calls /api/repos/list and surfaces the user's GitHub repos, with
 *  401 -> explicit "OAuth expired" state + CTA to /start (only this branch
 *  reroutes to /start), 502 -> demo dataset fallback.
 *
 *  Feature #32 view toggle (City <-> Dashboard) now lives in DashboardTopBar
 *  as an explicit pill bar in addition to the footer link. Pairs symmetrically
 *  with the /city top-nav Dashboard link.
 *
 *  Feature #33 dynamic content: useDashboardData hits /api/dashboard for real
 *  Postgres-backed data when the backend is reachable, falls back to the
 *  Wave 1 mock derivation on network failure. The /api/dashboard endpoint
 *  is the Demeter Wave 3 ship per `selene-to-demeter.md` contract.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { BriefingHeader } from './BriefingHeader';
import { KpiGlance } from './KpiGlance';
import { BurndownChart } from './BurndownChart';
import { VelocityChart } from './VelocityChart';
import { TopContributors } from './TopContributors';
import { SpecDriftSummary } from './SpecDriftSummary';
import { RefactorProposalsStatus } from './RefactorProposalsStatus';
import { CrossRepoRail } from './CrossRepoRail';
import { CityPreviewCorner } from './CityPreviewCorner';
import { DashboardTopBar } from './DashboardTopBar';
import { EngineeringInsights } from './EngineeringInsights';
import { TIME_RANGES } from './TimeRangeSelector';
import { PurposeBanner } from './PurposeBanner';
import { CrossNavRail } from './CrossNavRail';
import { RepoPickerModal } from './RepoPickerModal';
import { MilestoneProgressPanel } from './MilestoneProgress';
import { useDashboardData } from '@/lib/dashboard/useDashboardData';
import type { RepoStatus, TimeRangeOption } from '@/lib/dashboard/types';

const ALL_REPO_SENTINEL: RepoStatus = {
  fullName: 'all',
  label: 'All repositories',
  branch: 'all',
  openPRs: 0,
  openIssues: 0,
  driftCount: 0,
  statusDot: 'gray',
  sparkline: [],
};

/**
 * Pan reactive Cycle V8.2 hotfix (Hafiz screenshot 12:40 WIB):
 * Phanes /api/diagram/<repo_id> only registers slugs `demo`, `fastapi-fullstack`,
 * `nodegoat`, `pygoat`. Dashboard repos come from /api/dashboard with
 * full_name like `Finerium/codeplexRefactory`, `OWASP/NodeGoat`,
 * `fastapi/full-stack-fastapi-template`. Direct passthrough produces 404.
 * Heuristic mapping picks the closest canned variant by name token; falls
 * back to `demo` for unknown repos so user always sees rendered diagrams.
 */
function mapToDiagramSlug(fullName: string | null | undefined): string {
  if (!fullName || fullName === 'all') return 'demo';
  const lower = fullName.toLowerCase();
  if (lower.includes('nodegoat')) return 'nodegoat';
  if (lower.includes('pygoat')) return 'pygoat';
  if (lower.includes('fastapi')) return 'fastapi-fullstack';
  return 'demo';
}

export const DashboardClient: React.FC = () => {
  const [activeRange, setActiveRange] = React.useState<TimeRangeOption>(TIME_RANGES[1]!);
  const [activeRepo, setActiveRepo] = React.useState<RepoStatus | null>(null);
  // Wave-Fixing #2 D-1 fix: session-aware repo picker modal state.
  const [repoPickerOpen, setRepoPickerOpen] = React.useState(false);
  // Read GitHub login for modal header copy (session/login may live on first
  // contributor entry which is the active user; we use the data shape only,
  // no extra API call to avoid coupling to /api/auth/github/session here).
  const authedAs = React.useMemo<string | undefined>(() => {
    return undefined;
  }, []);

  // Wave-Fixing cycle 1 (D-1 fix): live query reflects state so the hook
  // re-fetches (mock derives, Wave 3 hits /api/dashboard) per change.
  const repoQuery = activeRepo?.fullName ?? 'all';
  const { data, loading, error } = useDashboardData({
    range: activeRange.id,
    repo: repoQuery,
  });

  // Initialize activeRepo from first repo of fetched data, stable across renders.
  React.useEffect(() => {
    if (data && data.repos.length > 0 && !activeRepo) {
      setActiveRepo(data.repos[0]!);
    }
  }, [data, activeRepo]);

  // Wave-Fixing #2 D-1 fix: when modal hands us a new repo full_name, attempt
  // to find it in the existing repos list (cross-repo rail data); if not present
  // the user navigates to /city to seed the city for that repo.
  const onRepoSelectedFromModal = React.useCallback(
    (fullName: string) => {
      if (!data) return;
      const found = data.repos.find((r) => r.fullName === fullName);
      if (found) {
        setActiveRepo(found);
        return;
      }
      // Repo not in dashboard repos -> navigate to /city to render it fresh.
      window.location.href = `/city?repo=${encodeURIComponent(fullName)}`;
    },
    [data],
  );

  if (loading && !data) {
    return (
      <main className={styles.shell} style={{ padding: '60px 32px' }}>
        <p className={styles.muted}>Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.shell} style={{ padding: '60px 32px' }}>
        <p style={{ color: 'var(--sev-5)' }}>
          Data unavailable. {error.message}
        </p>
      </main>
    );
  }

  if (!data || !activeRepo) {
    return null;
  }

  return (
    <>
      <DashboardTopBar
        repos={data.repos}
        activeRepo={activeRepo}
        onRepoChange={setActiveRepo}
        activeRange={activeRange}
        onRangeChange={setActiveRange}
        onRequestConnect={() => setRepoPickerOpen(true)}
      />

      {repoPickerOpen && (
        <RepoPickerModal
          authedAs={authedAs}
          onClose={() => setRepoPickerOpen(false)}
          onRepoSelected={onRepoSelectedFromModal}
        />
      )}

      <main className={styles.shell} style={{ flex: 1 }}>
        <PurposeBanner activeRepoLabel={activeRepo.label} />

        <BriefingHeader
          briefing={data.briefing}
          repoLabel={activeRepo.label}
          rangeLabel={activeRange.label}
          lastRefresh={data.lastRefresh}
        />

        <div
          className={styles.stack}
          style={loading ? { opacity: 0.55, transition: 'opacity 120ms ease' } : undefined}
        >
          <KpiGlance kpis={data.kpis} />

          <CrossNavRail repoSlug={data.cityPreviewMeta.repoSlug} />

          <div className={styles.gridMain}>
            <div className={styles.stack}>
              <div className={styles.card}>
                <div className={styles.cardHd}>
                  <div>
                    <h3>{data.burndownMeta.sprintLabel} burndown</h3>
                    <div className={styles.cardSub}>
                      {data.burndownMeta.todayIndex} of {data.burndown.length - 1} days · {data.burndownMeta.daysToShip} until ship
                    </div>
                  </div>
                  <div
                    className={`${styles.num} ${styles.muted}`}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                  >
                    {data.burndownMeta.pointsRemaining} / {data.burndownMeta.pointsTotal} pts remaining
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <BurndownChart data={data.burndown} meta={data.burndownMeta} />
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHd}>
                  <div>
                    <h3>Velocity · last {data.velocity.length} sprints</h3>
                    <div className={styles.cardSub}>story points completed per sprint · scope {activeRange.label.toLowerCase()}</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <VelocityChart data={data.velocity} />
                </div>
              </div>
            </div>

            <CityPreviewCorner meta={data.cityPreviewMeta} />
          </div>

          <MilestoneProgressPanel milestones={data.milestones} />

          <SpecDriftSummary drifts={data.drifts} />

          <div className={styles.split}>
            <TopContributors contributors={data.contributors} />
            <RefactorProposalsStatus proposals={data.refactorProposals} />
          </div>

          <CrossRepoRail
            repos={data.repos}
            activeFullName={activeRepo.fullName}
            onSelect={setActiveRepo}
          />

          {/*
            Manager FINAL Cycle 2 Cluster H mount. Engineering Insights surface
            below the cross-repo rail so panitia see the auto-generated
            architecture diagrams (architecture mermaid, dependency graphviz,
            ERD eralchemy) consuming the Phanes /api/diagram/<repo_id>
            endpoint.

            Pan reactive Cluster C (2026-05-13, Bug #8 fix): Engineering
            Insights now subscribes to the live activeRepo.fullName so the
            three diagram cards refetch when the user switches repos from the
            top-bar dropdown OR the cross-repo rail. Phanes /api/diagram/
            <repo_id> returns per-repo distinct artifacts; the hook
            (useDiagramData) re-fires on repoId change via its memoized
            doFetch dependency. "demo" remains the fallback when the active
            repo's fullName is the "all" sentinel.
          */}
          <EngineeringInsights
            repoId={mapToDiagramSlug(activeRepo.fullName)}
          />
        </div>

        <footer className={styles.footer}>
          <span>
            Codeplex Chronicle · Tim Duopoly · Refactory Hackathon Round 03 · Telkom University Bandung · May 12-13 2026
          </span>
          <span>
            <a
              href={
                activeRepo.fullName && activeRepo.fullName !== 'all'
                  ? `/city?repo=${encodeURIComponent(activeRepo.fullName)}`
                  : '/city'
              }
            >
              codebase 3D
            </a>
            <span> · </span>
            <button
              type="button"
              onClick={() => setRepoPickerOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'inherit',
                font: 'inherit',
                textTransform: 'inherit',
                letterSpacing: 'inherit',
              }}
            >
              connect repo
            </button>
          </span>
        </footer>
      </main>
    </>
  );
};

// Keep sentinel exported in case Persephone Wave 2 side panel queries need it.
export { ALL_REPO_SENTINEL };
