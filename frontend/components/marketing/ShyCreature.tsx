'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * ShyCreature, cursor-flee SDF-blob companion.
 *
 * Authored by Calliope (Wave 1) ported from Designer Prompt 1 bundle file
 * `creatures.jsx`. Cursor-fleeing creature pinned to an anchor element with
 * per-creature personality (5 kinds, one per resident). Distribute creatures
 * so that no more than one is visible per viewport per Designer Prompt 1
 * line 56. Hestia (Wave 1 Entry) reuses this component with single-creature
 * override (Hermes only).
 *
 * prefers-reduced-motion floor: creature hidden by CSS rule in globals.css.
 */
const __CREATURE_GLYPHS: Record<string, React.ReactNode> = {
  athena: (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ca-g" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity=".95" />
          <stop offset="55%" stopColor="#ffb060" stopOpacity=".85" />
          <stop offset="100%" stopColor="#7d3a10" stopOpacity=".75" />
        </radialGradient>
      </defs>
      <path d="M50 8 L82 60 Q82 92 50 92 Q18 92 18 60 Z" fill="url(#ca-g)" />
      <circle cx="42" cy="48" r="3.4" fill="#0a0d14" />
    </svg>
  ),
  apollo: (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cp-g" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffe6c4" stopOpacity=".98" />
          <stop offset="60%" stopColor="#ffae5e" stopOpacity=".85" />
          <stop offset="100%" stopColor="#7a3a14" stopOpacity=".75" />
        </radialGradient>
      </defs>
      <path d="M50 16 Q86 22 84 56 Q80 86 50 88 Q22 86 16 56 Q14 22 50 16 Z" fill="url(#cp-g)" />
      <circle cx="44" cy="46" r="3.2" fill="#0a0d14" />
      <circle cx="58" cy="46" r="3.2" fill="#0a0d14" />
    </svg>
  ),
  argus: (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cr-g" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#fff0d2" stopOpacity=".98" />
          <stop offset="60%" stopColor="#ffa856" stopOpacity=".85" />
          <stop offset="100%" stopColor="#6e2f10" stopOpacity=".75" />
        </radialGradient>
      </defs>
      <path d="M50 14 Q84 22 82 50 Q84 84 50 88 Q16 84 18 50 Q16 22 50 14 Z" fill="url(#cr-g)" />
      <circle cx="38" cy="44" r="2.6" fill="#0a0d14" />
      <circle cx="56" cy="40" r="2.6" fill="#0a0d14" />
      <circle cx="48" cy="60" r="2.6" fill="#0a0d14" />
    </svg>
  ),
  clio: (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cc-g" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#ffe2b0" stopOpacity=".98" />
          <stop offset="60%" stopColor="#ffb060" stopOpacity=".85" />
          <stop offset="100%" stopColor="#702f12" stopOpacity=".75" />
        </radialGradient>
      </defs>
      <path d="M50 6 Q70 30 76 60 Q78 90 50 92 Q22 90 24 60 Q30 30 50 6 Z" fill="url(#cc-g)" />
      <circle cx="50" cy="62" r="3.4" fill="#0a0d14" />
    </svg>
  ),
  hermes: (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ch-g" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#ffe6c0" stopOpacity=".98" />
          <stop offset="60%" stopColor="#ffb060" stopOpacity=".85" />
          <stop offset="100%" stopColor="#6c2f12" stopOpacity=".75" />
        </radialGradient>
      </defs>
      <path d="M50 22 Q80 30 78 60 Q72 90 50 90 Q28 90 22 60 Q20 30 50 22 Z" fill="url(#ch-g)" />
      <line
        x1="42"
        y1="22"
        x2="38"
        y2="8"
        stroke="#ffb060"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="58"
        y1="22"
        x2="62"
        y2="8"
        stroke="#ffb060"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="38" cy="8" r="2.4" fill="#ffd9a8" />
      <circle cx="62" cy="8" r="2.4" fill="#ffd9a8" />
      <circle cx="50" cy="58" r="3" fill="#0a0d14" />
    </svg>
  ),
};

interface ShyCreatureProps {
  kind: keyof typeof __CREATURE_GLYPHS;
  x: number;
  y: number;
  anchorRef: RefObject<HTMLElement | null>;
  fleeDist?: number;
  motion?: number;
}

// One-time global pointer track install.
if (typeof window !== 'undefined') {
  const w = window as unknown as {
    __mouseTrackInstalled?: boolean;
    __mouseX?: number;
    __mouseY?: number;
  };
  if (!w.__mouseTrackInstalled) {
    w.__mouseTrackInstalled = true;
    w.__mouseX = -9999;
    w.__mouseY = -9999;
    window.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        w.__mouseX = e.clientX;
        w.__mouseY = e.clientY;
      },
      { passive: true }
    );
  }
}

export function ShyCreature({
  kind,
  x,
  y,
  anchorRef,
  fleeDist = 180,
  motion = 0.7,
}: ShyCreatureProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const homeRef = useRef({ x, y });
  const stateRef = useRef({ vx: 0, vy: 0, x, y });

  useEffect(() => {
    homeRef.current = { x, y };
  }, [x, y]);

  useEffect(() => {
    let raf = 0;
    const w = window as unknown as { __mouseX?: number; __mouseY?: number };
    const step = () => {
      raf = requestAnimationFrame(step);
      const el = ref.current;
      if (!el) return;
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const onScreen = rect.bottom > -200 && rect.top < window.innerHeight + 200;
      if (!onScreen) return;

      const s = stateRef.current;
      const hx = homeRef.current.x;
      const hy = homeRef.current.y;
      const mx = (w.__mouseX ?? -9999) - rect.left;
      const my = (w.__mouseY ?? -9999) - rect.top;
      const dx = s.x - mx;
      const dy = s.y - my;
      const dist = Math.hypot(dx, dy);
      let ax = 0;
      let ay = 0;
      if (dist < fleeDist) {
        const k = (fleeDist - dist) / fleeDist;
        const inv = 1 / (dist || 0.0001);
        ax += dx * inv * 1.6 * k * motion;
        ay += dy * inv * 1.6 * k * motion;
        const t = performance.now() * 0.006;
        ax += -dy * inv * 0.4 * Math.sin(t) * motion;
        ay += dx * inv * 0.4 * Math.sin(t) * motion;
      } else {
        ax += (hx - s.x) * 0.004;
        ay += (hy - s.y) * 0.004;
      }
      s.vx = s.vx * 0.86 + ax;
      s.vy = s.vy * 0.86 + ay;
      const sp = Math.hypot(s.vx, s.vy);
      const cap = 9 * motion + 2;
      if (sp > cap) {
        s.vx = (s.vx / sp) * cap;
        s.vy = (s.vy / sp) * cap;
      }
      s.x += s.vx;
      s.y += s.vy;
      const squish = Math.min(1, sp / 6);
      const angle = Math.atan2(s.vy, s.vx);
      el.style.transform =
        `translate(${s.x - 40}px, ${s.y - 40}px) rotate(${angle * 0.35}rad) ` +
        `scale(${1 - squish * 0.15}, ${1 + squish * 0.18})`;
      el.style.filter = `drop-shadow(0 0 ${10 + squish * 22}px rgba(255,176,96,${0.45 + squish * 0.4}))`;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [anchorRef, fleeDist, motion]);

  return (
    <div
      className="creature"
      ref={ref}
      style={{ left: 0, top: 0, transform: `translate(${x - 40}px, ${y - 40}px)` }}
      data-kind={kind}
    >
      {__CREATURE_GLYPHS[kind]}
    </div>
  );
}
