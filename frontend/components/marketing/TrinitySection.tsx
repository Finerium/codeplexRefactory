'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TrinityCode, TrinityResidents, TrinityCity } from './TrinityArt';

/**
 * TrinitySection, Act 1 three-step reveal.
 *
 * Authored by Calliope (Wave 1) ported 1-to-1 from Designer Prompt 1 bundle
 * file `app-trinity.jsx`. Scroll-driven step machine over 300vh pinned act,
 * shows Code -> Residents -> City layers with crossfade + slight scale-in.
 * No GSAP, raw IntersectionObserver fallback baked via scroll listener for
 * Lighthouse perf budget. prefers-reduced-motion handled in globals.css.
 */
export function TrinitySection() {
  const ref = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const h = el.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / h));
      const s = Math.min(2, Math.floor(p * 3));
      setStep(s);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    {
      num: 'I.',
      h: 'Code becomes city.',
      d: 'Every file is a building. Every folder is a district. Repo shape, made spatial.',
    },
    {
      num: 'II.',
      h: 'AI residents move in.',
      d: 'Five Greek-named residents take landmark buildings. They read, watch, narrate, diagnose, guide.',
    },
    {
      num: 'III.',
      h: 'Sprint, projected onto the skyline.',
      d: 'The agile board lives in the city. PRs rise as buildings, tickets stand next to the right district, sprint health reads at a glance. Project management and codebase visualization, in one workspace.',
    },
  ];

  return (
    <section className="act trinity" data-act="1" ref={ref}>
      <div className="pin">
        <div className="inner">
          <div className="trinity-stage">
            <TrinityLayer active={step === 0}>
              <TrinityCode />
            </TrinityLayer>
            <TrinityLayer active={step === 1}>
              <TrinityResidents />
            </TrinityLayer>
            <TrinityLayer active={step === 2}>
              <TrinityCity />
            </TrinityLayer>
          </div>
          <div>
            <div className="eyebrow">The Trinity</div>
            <h2 className="h2" style={{ margin: '18px 0 36px', maxWidth: '14ch' }}>
              Three layers, one place.
            </h2>
            <div className="trinity-rail">
              {steps.map((s, i) => (
                <div key={i} className={'step' + (step === i ? ' active' : '')}>
                  <div className="num">{s.num}</div>
                  <div>
                    <div className="h">{s.h}</div>
                    <div className="d">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrinityLayer({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className="trinity-layer"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(.96)',
      }}
    >
      {children}
    </div>
  );
}
