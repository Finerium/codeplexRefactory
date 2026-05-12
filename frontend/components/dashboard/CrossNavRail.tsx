'use client';

/**
 * CrossNavRail. 3-card horizontal rail surfacing cross-product entries that
 * the dashboard alone does not host.
 *
 * Authored by Selene Wave-Fixing cycle 1 rescue identity, 2026-05-13 01:47 WIB.
 *
 * Wave-Fixing bug D-4: panitia did not perceive "git time machine" + "auto
 * diagram engine" mentioned by Ghaisan because neither term is a literal PRD
 * heading. This rail surfaces the honest pointers:
 *
 *  1. Git timeline -> /city Activity Mode (PRD Section 9.4 timeline scrubber
 *     30/60/90 day, Boreas Wave 2). Closest analogue to "git time machine".
 *  2. Static diagrams -> docs/c4/ + PanitSubmission/. NOT runtime auto-diagram
 *     engine - that one is post-hackathon Phase 2 (honest per
 *     `_meta/audit/prd_feature_verification_20260513-0147.md` Q2).
 *  3. 3D codebase -> /city default Sprint Mode. The dashboard is one of two
 *     surfaces; this nudges panitia to also visit the spatial workspace.
 *
 * Visual: 3 minimal cards with kicker + label + 1-line micro-description +
 * arrow icon. Hover ring per Designer Prompt 3 instrument-panel mood.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';

export interface CrossNavRailProps {
  /** Active repo slug used in /city deep link to keep context. */
  repoSlug: string;
}

interface NavCard {
  kicker: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export const CrossNavRail: React.FC<CrossNavRailProps> = ({ repoSlug }) => {
  const cards: NavCard[] = [
    {
      kicker: 'Activity Mode',
      title: 'Git timeline scrubber',
      description: 'Scrub last 30 / 60 / 90 days. Ownership heatmap, hotspot glow, sprint retro flythrough.',
      href: `/city?repo=${encodeURIComponent(repoSlug)}&mode=activity`,
      cta: 'Open timeline',
    },
    {
      kicker: 'Architecture',
      title: 'Static C4 + ERD diagrams',
      description: 'Formal 4-tier C4 + ERD authored Wave 0 in docs/c4/ + PanitSubmission/c4/. Runtime auto-diagram: post-hackathon.',
      href: '/docs/c4/C4-Context.md',
      cta: 'Browse diagrams',
    },
    {
      kicker: 'Spatial view',
      title: '3D codebase city',
      description: 'Files become buildings, errors become earthquakes. 5 resident AIs, 5 product modes spatial workspace.',
      href: `/city?repo=${encodeURIComponent(repoSlug)}`,
      cta: 'Enter city',
    },
  ];

  return (
    <section className={styles.crossNavRail} aria-label="Cross-product navigation">
      <div className={styles.crossNavHeader}>
        <span className={styles.sectionLabel}>Also in Codeplex Chronicle</span>
        <span className={styles.crossNavMutedHint}>For features outside the manager dashboard</span>
      </div>
      <div className={styles.crossNavGrid} role="list">
        {cards.map((c) => (
          <a
            key={c.title}
            className={styles.crossNavCard}
            href={c.href}
            role="listitem"
          >
            <div className={styles.crossNavCardKicker}>{c.kicker}</div>
            <div className={styles.crossNavCardTitle}>{c.title}</div>
            <div className={styles.crossNavCardDesc}>{c.description}</div>
            <div className={styles.crossNavCardCta}>
              <span>{c.cta}</span>
              <Icon name="arrow-right" size={12} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};
