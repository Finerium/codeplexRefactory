/**
 * Trinity stage art, three SVG layers (code, residents, city).
 *
 * Authored by Calliope (Wave 1) ported from Designer Prompt 1 bundle file
 * `app-trinity-art.jsx` with Revision 2 applied post-port: the code snippet
 * comment "src/runtime/sprint.ts" plus all subsequent lines were nearly
 * invisible in light mode because the original fill #a8d4ff (pale cool
 * blue) collapsed against the day palette. Every #a8d4ff swap to Matrix
 * green #00ff41 for terminal-hacker legibility + green drop-shadow glow on
 * the code text group. Warm amber accents #ffb060 preserved as secondary.
 */

const CODE_GREEN = '#00ff41';
const ACCENT_AMBER = '#ffb060';
const CODE_GLOW: React.CSSProperties = {
  filter: 'drop-shadow(0 0 6px #00ff4188)',
};

export function TrinityCode() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g
        fontFamily="Geist Mono, monospace"
        fontSize="11"
        fill={CODE_GREEN}
        style={CODE_GLOW}
      >
        <text x="40" y="38" opacity=".95">{'/* src/runtime/sprint.ts */'}</text>
        <text x="40" y="64" opacity=".75">export function raise(pr: PR) {'{'}</text>
        <text x="56" y="84" opacity=".75">  const district = locate(pr.path);</text>
        <text x="56" y="104" opacity=".75">  const floor = district.height + 1;</text>
        <text x="56" y="124" opacity=".75">
          {'  city.broadcast('}
          <tspan fill={ACCENT_AMBER}>'rise'</tspan>
          {", { district, floor });"}
        </text>
        <text x="56" y="144" opacity=".75">  return floor;</text>
        <text x="40" y="164" opacity=".75">{'}'}</text>
      </g>
      <g transform="translate(40, 220)">
        {[3, 7, 5, 8, 11, 9, 14, 7, 10, 12].map((h, i) => (
          <g key={i}>
            <rect
              x={i * 32}
              y={120 - h * 10}
              width="22"
              height={h * 10}
              fill="none"
              stroke={CODE_GREEN}
              strokeWidth="1"
            />
            <rect
              x={i * 32 + 6}
              y={120 - h * 10 + 8}
              width="2"
              height={h * 10 - 16}
              fill={ACCENT_AMBER}
              opacity={i % 3 === 0 ? 1 : 0.3}
            />
          </g>
        ))}
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
