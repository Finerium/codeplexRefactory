/**
 * Trinity stage art, three SVG layers (code, residents, city).
 *
 * Authored by Calliope (Wave 1) ported from Designer Prompt 1 bundle file
 * `app-trinity-art.jsx`. Wave-Fixing cycle 1 L-2 revision applied:
 *
 *   1. Code snippet font color swapped from Matrix green #00ff41 (which had
 *      catastrophic contrast against the light-mode bg, the green-on-light
 *      collapse was the original QA complaint) to currentColor inheriting
 *      the marketing --ink token (near-black foreground). Drop-shadow glow
 *      removed since dark glyphs do not need a glow to read.
 *   2. Single accent token (string literal "'rise'") swapped from amber to
 *      var(--warm) so it tracks the primary marketing accent (cool blue in
 *      light mode) rather than introducing a third color.
 *   3. Bar chart (10-bar graph cluster underneath the code snippet) removed
 *      entirely (Manager Wave-Fixing Option B). Original intent was to
 *      hint "code -> data -> spatial," but the bars read neither as city
 *      buildings nor as a meaningful graph in screenshot QA. Replaced with
 *      a single eyebrow caption line so the SVG retains visual balance
 *      without ambiguous data viz.
 *
 * Residents and City layers retained verbatim from Designer bundle.
 */

import type { CSSProperties } from 'react';

const CODE_INK = 'var(--ink)';
const CODE_DIM: CSSProperties = { opacity: 0.78 };
const CODE_FAINT: CSSProperties = { opacity: 0.5 };

export function TrinityCode() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g
        fontFamily="Geist Mono, monospace"
        fontSize="11"
        fill={CODE_INK}
      >
        <text x="40" y="38" style={CODE_FAINT}>{'/* src/runtime/sprint.ts */'}</text>
        <text x="40" y="64" style={CODE_DIM}>export function raise(pr: PR) {'{'}</text>
        <text x="56" y="84" style={CODE_DIM}>  const district = locate(pr.path);</text>
        <text x="56" y="104" style={CODE_DIM}>  const floor = district.height + 1;</text>
        <text x="56" y="124" style={CODE_DIM}>
          {'  city.broadcast('}
          <tspan fill="var(--warm)" fontWeight="500">'rise'</tspan>
          {", { district, floor });"}
        </text>
        <text x="56" y="144" style={CODE_DIM}>  return floor;</text>
        <text x="40" y="164" style={CODE_DIM}>{'}'}</text>
      </g>
      <g transform="translate(40, 240)">
        <line x1="0" y1="0" x2="320" y2="0" stroke="var(--line)" strokeWidth="1" />
        <text
          x="0"
          y="26"
          fontFamily="Geist Mono, monospace"
          fontSize="10"
          fill="var(--ink-3)"
          letterSpacing="0.18em"
        >
          {'CODE -> SKYLINE  // each commit raises a floor'}
        </text>
        <text
          x="0"
          y="56"
          fontFamily="Geist Mono, monospace"
          fontSize="10"
          fill="var(--ink-3)"
          letterSpacing="0.12em"
        >
          {'$ tree-sitter parse  -> AST  -> district mapper'}
        </text>
        <text
          x="0"
          y="80"
          fontFamily="Geist Mono, monospace"
          fontSize="10"
          fill="var(--ink-3)"
          letterSpacing="0.12em"
        >
          {'$ city.broadcast()   -> 12.4ms  -> skyline tick'}
        </text>
      </g>
    </svg>
  );
}

export function TrinityResidents() {
  const dots = [
    { x: 200, y: 110, name: 'Athena' },
    { x: 320, y: 180, name: 'Apollo' },
    { x: 110, y: 200, name: 'Argus' },
    { x: 210, y: 290, name: 'Clio' },
    { x: 310, y: 320, name: 'Hermes' },
  ];
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#1a2538" strokeWidth="1" fill="none" opacity="0.6">
        {[...Array(28)].map((_, i) => {
          const x = 50 + (i % 7) * 45;
          const y = 80 + Math.floor(i / 7) * 60;
          const h = 18 + ((i * 17) % 40);
          return <rect key={i} x={x} y={y} width="28" height={h} />;
        })}
      </g>
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="5" fill="#ffb060" />
          <circle cx={d.x} cy={d.y} r="14" fill="none" stroke="#ffb060" strokeOpacity=".4" />
          <line x1={d.x + 8} y1={d.y - 8} x2={d.x + 50} y2={d.y - 30} stroke="#ffb060" strokeOpacity=".6" />
          <text
            x={d.x + 54}
            y={d.y - 26}
            fontFamily="Geist Mono, monospace"
            fontSize="11"
            fill="#ffe2c4"
          >
            {d.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function TrinityCity() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bld-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22304a" />
          <stop offset="100%" stopColor="#0a0d14" />
        </linearGradient>
      </defs>
      <g transform="translate(200, 260)">
        {[...Array(40)].map((_, i) => {
          const col = (i % 8) - 4;
          const row = Math.floor(i / 8) - 2;
          const x = (col - row) * 22;
          const y = (col + row) * 11;
          const h = 18 + ((i * 13) % 60);
          return (
            <g key={i}>
              <path d={`M${x} ${y - h} l22 11 v${h} l-22 -11 z`} fill="url(#bld-g)" />
              <path d={`M${x + 22} ${y - h + 11} l22 -11 v${h} l-22 11 z`} fill="#0f1622" />
              <path d={`M${x} ${y - h} l22 -11 l22 11 l-22 11 z`} fill="#1a2538" />
              {(i * 7) % 5 === 0 && <circle cx={x + 11} cy={y - h / 2} r="1.6" fill="#ffb060" />}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
