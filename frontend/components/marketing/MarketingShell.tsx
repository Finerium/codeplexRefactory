'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { initCity, type CityController } from '../../lib/marketing/cityEngine';

/**
 * MarketingShell, landing page outer orchestrator.
 *
 * Authored by Calliope (Wave 1) ported from Designer Prompt 1 bundle file
 * `app.jsx`. Owns the fixed #city-canvas, top navigation bar, scroll progress
 * rail, and City controller lifecycle. Revision 1 applied here: TWEAK_DEFAULTS
 * locked to production values (dayMode=true, fogDensity=0.22, motionIntensity=1.4,
 * windowGlow=1.4, labelsVis='scroll-only') and the "Daybreak (opt-in light)"
 * TweakToggle removed since the entire dark mode code path is retired.
 */

const TWEAK_DEFAULTS = {
  fogDensity: 0.22,
  motionIntensity: 1.4,
  dayMode: true,
  windowGlow: 1.4,
  labelsVis: 'scroll-only' as 'always' | 'scroll-only' | 'hidden',
};

const ACT_LABELS = ['Hero', 'Trinity', 'Sprint', 'Modes', 'Residents', 'Open'];

export function MarketingShell({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cityRef = useRef<CityController | null>(null);
  const [activeAct, setActiveAct] = useState(0);

  // City controller init + dispose
  useEffect(() => {
    if (cityRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const ctrl = initCity(canvas);
      cityRef.current = ctrl;
      // Lock production tweaks (Revision 1).
      ctrl.setFog(TWEAK_DEFAULTS.fogDensity);
      ctrl.setMotion(TWEAK_DEFAULTS.motionIntensity);
      ctrl.setSaturation(1.0);
      ctrl.setWindowGlow(TWEAK_DEFAULTS.windowGlow);
      ctrl.setWindowDensity('medium');
      ctrl.setFlicker('occasional');
      ctrl.setBuildingDetail('moderate');
      // setMode is a no-op (Revision 1, dark path retired) but kept for symmetry.
      ctrl.setMode(true);
      document.documentElement.dataset.mode = 'day';
      document.documentElement.dataset.labels = TWEAK_DEFAULTS.labelsVis;
    } catch (err) {
      // Defensive: WebGL init can fail on iOS Safari < 17 or older Linux GPU
      // drivers. The marketing landing must remain legible without the canvas,
      // so we swallow the error here. Real production scene Daedalus authors
      // owns the deeper fallback (WebGL2 detect, iOS Safari guard).
      console.warn('[Calliope cityEngine] WebGL init failed, marketing backdrop disabled', err);
    }
    return () => {
      cityRef.current?.dispose();
      cityRef.current = null;
    };
  }, []);

  // Scroll progress + act detection
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.labels = TWEAK_DEFAULTS.labelsVis;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? doc.scrollTop / max : 0;
      cityRef.current?.setScroll(p);
      html.dataset.scrolled = window.scrollY > 80 ? '1' : '0';
      const acts = document.querySelectorAll<HTMLElement>('[data-act]');
      let cur = 0;
      acts.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.45) {
          cur = Math.max(cur, parseInt(el.dataset.act ?? '0', 10));
        }
      });
      if (window.scrollY > 0) {
        const closer = document.querySelector('.closer');
        const modes = document.querySelector('.modes');
        const res = document.querySelector('.residents');
        if (closer && closer.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = 5;
        else if (res && res.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = 4;
        else if (modes && modes.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = 3;
      }
      setActiveAct(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <canvas id="city-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <nav className="topnav" aria-label="Top navigation">
        <a className="brand" href="#top">
          <span className="mark" />
          <span>Codeplex Chronicle</span>
        </a>
        <div className="meta">
          <span>
            <span className="dot" />
            v1.0, live
          </span>
          <span>duopoly.hackathon.sev-2.com</span>
        </div>
      </nav>

      <main id="top">
        <div className="progress" aria-hidden="true">
          {ACT_LABELS.map((l, i) => (
            <div key={i} className={'tick' + (i === activeAct ? ' active' : '')}>
              <span className="lbl">
                {String(i).padStart(2, '0')} / {l}
              </span>
            </div>
          ))}
        </div>
        {children}
      </main>
    </>
  );
}
