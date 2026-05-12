/**
 * Dashboard route layout. Scopes Designer Prompt 3 "Direction C, Graphite Signal"
 * light palette to /dashboard ONLY. Other routes (landing, entry, city) inherit
 * the dark cinematic Tailwind defaults from app/globals.css.
 *
 * Authored by Selene (Wave 1). Loads dashboard-specific fonts (Bricolage
 * Grotesque, Geist, Instrument Serif, Geist Mono) via Next.js next/font for
 * cross-page typography cohesion with Designer's mandate (font family same
 * across Calliope landing + Hestia entry + Selene dashboard).
 */

import type { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  Instrument_Serif,
} from 'next/font/google';
import styles from './dashboard.module.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Codeplex Chronicle · Dashboard',
  description:
    'Manager-facing instrument panel for Codeplex Chronicle. KPI glance, sprint burndown, velocity history, contributor analytics, spec-drift summary, refactor proposals, cross-repo rail, city preview corner.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${styles.dashboardRoot} ${bricolage.variable} ${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      {children}
    </div>
  );
}
