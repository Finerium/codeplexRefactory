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
import { TIME_RANGES } from './TimeRangeSelector';
import { useDashboardData } from '@/lib/dashboard/useDashboardData';
import type { RepoStatus, TimeRangeOption } from '@/lib/dashboard/types';

export const DashboardClient: React.FC = () => {
  const { data, loading, error } = useDashboardData({ range: 'sprint', repo: 'all' });
  const [activeRange, setActiveRange] = React.useState<TimeRangeOption>(TIME_RANGES[1]!);
  const [activeRepo, setActiveRepo] = React.useState<RepoStatus | null>(null);

  // Initialize activeRepo from first repo of fetched data, stable across renders.
  React.useEffect(() => {
    if (data && data.repos.length > 0 && !activeRepo) {
      setActiveRepo(data.repos[0]!);
    }
  }, [data, activeRepo]);

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
      />

      <main className={styles.shell} style={{ flex: 1 }}>
        <BriefingHeader
          briefing={data.briefing}
          repoLabel={activeRepo.label}
          rangeLabel={activeRange.label}
          lastRefresh={data.lastRefresh}
        />

        <div className={styles.stack}>
          <KpiGlance kpis={data.kpis} />

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
                    <h3>Velocity · last 8 sprints</h3>
                    <div className={styles.cardSub}>story points completed per sprint</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <VelocityChart data={data.velocity} />
                </div>
              </div>
            </div>

            <CityPreviewCorner meta={data.cityPreviewMeta} />
          </div>

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
        </div>

        <footer className={styles.footer}>
          <span>
            Codeplex Chronicle · Tim Duopoly · Refactory Hackathon Round 03 · Telkom University Bandung · May 12-13 2026
          </span>
          <span>
            <a href="#" onClick={(e) => e.preventDefault()}>changelog</a>
            <span> · </span>
            <a href="#" onClick={(e) => e.preventDefault()}>docs</a>
          </span>
        </footer>
      </main>
    </>
  );
};
