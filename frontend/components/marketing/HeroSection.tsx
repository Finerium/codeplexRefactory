'use client';

import { useRef } from 'react';
import { TowerPOV } from './TowerPOV';

/**
 * HeroSection, Act 0 cinematic hero.
 *
 * Authored by Calliope (Wave 1) ported 1-to-1 from Designer Prompt 1 bundle
 * file `app-hero.jsx`. CTA wires to `/start` (Hestia threshold page Wave 1)
 * per Pythia contract `calliope-to-wave2-panels.md` Section "CTA wiring".
 * Live production link kept as fallback ref via title attribute.
 */
export function HeroSection() {
  const ref = useRef<HTMLElement | null>(null);
  return (
    <section className="act hero" data-act="0" ref={ref}>
      <div className="pin">
        <TowerPOV />

        <div className="hero-top">
          <div className="col">
            <span>RUNTIME</span>
            <span>v1.0.0, shipped</span>
          </div>
          <div className="col" style={{ textAlign: 'center' }}>
            <span>COORDINATES</span>
            <span>-6.97386, 107.63037</span>
          </div>
          <div className="col" style={{ textAlign: 'right' }}>
            <span>LOCAL TIME</span>
            <span>03:17 / WIB</span>
          </div>
        </div>

        <div className="hero-copy">
          <div className="lockup">
            <h1 className="display">
              Your codebase,
              <br />
              <em>alive</em>.
            </h1>
            <p className="sub lede">
              Project management, agile sprint workspace, and codebase visualization, fused
              into one 3D city. Files become buildings, sprints raise the skyline, AI
              residents read, watch, and narrate. Stop tab-juggling GitHub, Jira, and
              dashboards just to feel where the work stands.
            </p>
          </div>
          <div className="right">
            <a className="cta" href="/start" title="Open the city, threshold entry page">
              Open the city <span className="arrow">{'→'}</span>
            </a>
            <div className="meta-block">
              <span>STATUS</span>
              <b>Live, 5 AI residents online</b>
              <span>BUILD</span>
              <b>Refactory R03, May 12 to 13, 2026</b>
              <span>TEAM</span>
              <b>Tim Duopoly, 2 engineers</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
