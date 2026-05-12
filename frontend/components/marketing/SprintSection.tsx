'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SprintSection, Act 2 hero mode (Sprint, Designer Prompt 1 line 38).
 *
 * Authored by Calliope (Wave 1) ported 1-to-1 from Designer Prompt 1 bundle
 * file `app-sprint.jsx`. Pinned 260vh stage with scroll-driven PR queue
 * filling left-to-right. PRs progressively reveal + animate to MERGED state.
 * Wave 2 Hera consumes the same MODES copy via `data.tsx`, this section
 * shows the dynamic sprint stack visual.
 */

interface SprintPR {
  id: string;
  t: string;
  st: 'MERGED' | 'REVIEW' | 'CI';
}

const SPRINT_PRS: SprintPR[] = [
  { id: '#0419', t: 'feat(sprint): broadcast PR to district on merge', st: 'MERGED' },
  { id: '#0421', t: 'fix(activity): hotspot decay window 90 to 180d', st: 'REVIEW' },
  { id: '#0420', t: 'refactor(athena): split planner into 3 stages', st: 'CI' },
  { id: '#0418', t: 'feat(health): add detector for circular import', st: 'REVIEW' },
  { id: '#0417', t: 'chore(apollo): vocabulary pass on diagnoses', st: 'MERGED' },
];

export function SprintSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const h = el.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / h));
      setTick(Math.floor(p * (SPRINT_PRS.length + 1)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="act sprint" data-act="2" ref={ref}>
      <div className="pin">
        <div className="inner">
          <div>
            <div className="eyebrow">Mode 02 / Hero</div>
            <h2 className="h2" style={{ margin: '18px 0 24px', maxWidth: '14ch' }}>
              Sprint.
              <br />
              The skyline ships with you.
            </h2>
            <p className="lede" style={{ marginBottom: 28 }}>
              Pull requests rise as buildings. CI passes, the floors climb. Merge, and a
              window lights. Your team watches the skyline change in real time, the agile
              board, projected onto the city.
            </p>
            <p className="body" style={{ color: 'var(--ink-3)', marginBottom: 32 }}>
              The other modes, Onboarding, Refactor, Activity, Health, come further down.
              Sprint is what most days look like.
            </p>
            <div className="caps">Live event stream</div>
          </div>
          <SprintCard tick={tick} />
        </div>
      </div>
    </section>
  );
}

function SprintCard({ tick }: { tick: number }) {
  return (
    <div className="sprint-card">
      <div className="head">
        <span>SPRINT / 24 / WEEK 03</span>
        <span>{'●'} 5 active</span>
      </div>
      <div className="stack">
        {SPRINT_PRS.map((p, i) => {
          const visible = i <= tick;
          const merged = p.st === 'MERGED' && i <= tick - 1;
          return (
            <div
              key={p.id}
              className="pr"
              style={{
                transform: `translateY(${visible ? 0 : 16}px)`,
                opacity: visible ? 1 : 0,
                borderColor: merged
                  ? 'color-mix(in oklab, var(--warm) 45%, transparent)'
                  : 'var(--line-2)',
                transitionDelay: `${i * 40}ms`,
              }}
            >
              <span className="id">{p.id}</span>
              <span className="ti">{p.t}</span>
              <span className="st" style={{ color: merged ? 'var(--warm)' : 'var(--ink-3)' }}>
                {p.st}
              </span>
            </div>
          );
        })}
      </div>
      <div className="sprint-stat">
        <div>
          <span className="n">{Math.min(tick, SPRINT_PRS.length)}</span>
          <span className="l">events rendered</span>
        </div>
        <div>
          <span className="n">12.4ms</span>
          <span className="l">PR to building latency</span>
        </div>
        <div>
          <span className="n">+3</span>
          <span className="l">floors this week</span>
        </div>
      </div>
    </div>
  );
}
