import {
  MarketingShell,
  HeroSection,
  TrinitySection,
  SprintSection,
  ModesSection,
  ResidentsSection,
  CloserSection,
} from '../../components/marketing';

/**
 * Codeplex Chronicle landing page composition.
 *
 * Authored by Calliope (Wave 1) per Designer Prompt 1 bundle 1-to-1 port +
 * 4 Revision applied post-port:
 *   R1: Light mode lock (dark mode code path retired), Tweaks defaults reset
 *       to production values, Daybreak toggle removed.
 *   R2: Trinity code-art font color swapped a8d4ff to Matrix green 00ff41,
 *       drop-shadow glow for terminal-hacker legibility.
 *   R3: Hero vignette dark halo removed from DOM (CSS display:none).
 *   R4: Residents grid dividers swapped from --line-2 to --line for
 *       visibility in light mode.
 *
 * Source: _meta/designer/prompt1-landing/handoff-bundle-extracted/
 *   refactory-landing-page/project/{Codeplex Chronicle Landing.html, 11 jsx,
 *   city.js, creatures.jsx, tweaks-panel.jsx}.
 *
 * Server Component default; only the leaf children that own scroll listeners
 * or canvas state are 'use client'. Hackathon credit footer copy locked per
 * PRD Section 24.1 + Designer Prompt 1 line 74.
 */
export default function LandingPage() {
  return (
    <MarketingShell>
      <HeroSection />
      <TrinitySection />
      <SprintSection />
      <ModesSection />
      <ResidentsSection />
      <CloserSection />
    </MarketingShell>
  );
}
