'use client';

/**
 * PurposeBanner. Frames the dashboard role explicitly for panitia + first-time
 * visitor so /dashboard vs /city ambiguity (bug D-2) goes away.
 *
 * Authored by Selene Wave-Fixing cycle 1 rescue identity, 2026-05-13 01:47 WIB.
 *
 * Content discipline:
 *  - "Project management overview" frames the role (manager-facing).
 *  - "Sprint progress. Velocity. Spec drift." gives the 3 surfaces panitia
 *    can scan and validate against PRD Section 9.2 dashboard view callout.
 *  - "Switch to /city" surfaces the cross-nav cue.
 *  - Active repo label inlined so the user sees the context match the
 *    dropdown they just used.
 *
 * Visual: monospace caption-row, subtle hairline divider, NOT marketing copy.
 * Mood instrument-panel per Designer Prompt 3 intent.md.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';

export interface PurposeBannerProps {
  /** Active repo display label, inlined so the framing reflects the live filter. */
  activeRepoLabel: string;
}

export const PurposeBanner: React.FC<PurposeBannerProps> = ({ activeRepoLabel }) => (
  <section className={styles.purposeBanner} aria-label="Dashboard purpose">
    <div className={styles.purposeRow}>
      <span className={styles.purposeKicker}>Manager view</span>
      <span className={styles.purposeBody}>
        Project management overview for <strong>{activeRepoLabel}</strong>.
        Sprint progress, velocity, spec-drift. For the 3D codebase + git timeline,
        switch to <a className={styles.purposeLink} href="/city">/city</a>.
      </span>
    </div>
  </section>
);
