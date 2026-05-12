// app-tower.jsx — empty interior: the city IS the protagonist now.
/* global React */

function TowerPOV() {
  return (
    <div className="tower-pov" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ceil-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0a0d14"/>
            <stop offset="100%" stopColor="#0a0d14" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="floor-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0a0d14" stopOpacity="0"/>
            <stop offset="100%" stopColor="#0a0d14"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="160" fill="url(#ceil-grad)"/>
        <rect x="0" y="700" width="1600" height="200" fill="url(#floor-grad)"/>
        <g stroke="#0a0d14" strokeWidth="2" opacity="0.85">
          <line x1="0" y1="0" x2="0" y2="900"/>
          <line x1="120" y1="0" x2="120" y2="900"/>
          <line x1="1480" y1="0" x2="1480" y2="900"/>
          <line x1="1600" y1="0" x2="1600" y2="900"/>
        </g>
        <g stroke="#0a0d14" strokeWidth="1" opacity="0.45">
          <line x1="240" y1="0" x2="240" y2="900"/>
          <line x1="1360" y1="0" x2="1360" y2="900"/>
        </g>
        <g stroke="#a8d4ff" strokeWidth="1" opacity="0.05">
          <line x1="0" y1="240" x2="1600" y2="240"/>
          <line x1="0" y1="640" x2="1600" y2="640"/>
        </g>
        <g stroke="#a8d4ff" strokeWidth="1" opacity="0.32" fill="none">
          <path d="M 40 40 L 40 80 M 40 40 L 80 40"/>
          <path d="M 1560 40 L 1560 80 M 1560 40 L 1520 40"/>
          <path d="M 40 860 L 40 820 M 40 860 L 80 860"/>
          <path d="M 1560 860 L 1560 820 M 1560 860 L 1520 860"/>
        </g>
        <g fontFamily="Geist Mono, monospace" fontSize="11" fill="#a8d4ff" opacity="0.5">
          <text x="50" y="56" letterSpacing="2">POV</text>
          <text x="50" y="76" letterSpacing="2">FL.41 — 03:17 LOCAL</text>
        </g>
      </svg>
    </div>
  );
}

Object.assign(window, { TowerPOV });
