// Charts — burndown, velocity bars, sparklines. All static SVG.

function Burndown({ data, height = 220 }) {
  const W = 720, H = height;
  const padL = 36, padR = 16, padT = 14, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const days = data.ideal.length;
  const maxY = Math.max(...data.ideal, ...data.actual);
  const x = (i) => padL + (i / (days - 1)) * innerW;
  const y = (v) => padT + (1 - v / maxY) * innerH;

  const idealPath = data.ideal.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  // Actual: solid up to projected_from (the "today" point), dashed after
  const actualReal = data.actual.slice(0, data.projected_from + 1);
  const realPath = actualReal.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');

  // Y ticks
  const ticks = [0, Math.round(maxY * 0.5), maxY];
  const todayX = x(data.day_index);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* y gridlines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="grid-line" />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end">{t}</text>
        </g>
      ))}
      {/* x axis labels */}
      {Array.from({ length: days }).map((_, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle">{`D${i}`}</text>
      ))}
      {/* today marker */}
      <line x1={todayX} x2={todayX} y1={padT} y2={H - padB} stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
      <text x={todayX + 4} y={padT + 10} fill="var(--accent)" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>TODAY · D{data.day_index}</text>

      {/* ideal */}
      <path d={idealPath} stroke="var(--muted-2)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      {/* actual */}
      <path d={realPath} stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      {/* end dot */}
      <circle cx={x(data.projected_from)} cy={y(data.actual[data.projected_from])} r="3" fill="var(--accent)" />

      {/* legend */}
      <g transform={`translate(${padL}, ${padT - 6})`}>
        <line x1="0" y1="0" x2="14" y2="0" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="20" y="3" fill="var(--ink-2)">Actual</text>
        <line x1="80" y1="0" x2="94" y2="0" stroke="var(--muted-2)" strokeDasharray="3 3" strokeWidth="1" />
        <text x="100" y="3" fill="var(--ink-2)">Ideal</text>
      </g>
    </svg>
  );
}

function Velocity({ data, height = 180 }) {
  const W = 480, H = height;
  const padL = 32, padR = 14, padT = 14, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxY = Math.max(...data.map(d => d.points)) + 4;
  const bw = innerW / data.length - 8;
  const avg = data.reduce((s, d) => s + d.points, 0) / data.length;
  const y = (v) => padT + (1 - v / maxY) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* y baseline */}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} className="axis-line" />
      {/* avg line */}
      <line x1={padL} x2={W - padR} y1={y(avg)} y2={y(avg)} stroke="var(--muted-2)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={W - padR} y={y(avg) - 4} textAnchor="end" fill="var(--muted)" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>avg {avg.toFixed(1)}</text>

      {data.map((d, i) => {
        const bx = padL + i * (innerW / data.length) + 4;
        const by = y(d.points);
        const bh = (H - padB) - by;
        return (
          <g key={i}>
            <rect
              x={bx} y={by} width={bw} height={bh}
              fill={d.current ? 'var(--accent)' : 'var(--ink-2)'}
              fillOpacity={d.current ? 1 : 0.18}
              rx="1"
            />
            <text x={bx + bw / 2} y={H - 12} textAnchor="middle">{`S${d.sprint}`}</text>
            <text x={bx + bw / 2} y={by - 5} textAnchor="middle" fill={d.current ? 'var(--ink)' : 'var(--ink-2)'} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: d.current ? 600 : 400 }}>{d.points}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ data, height = 22, width = 80, accent = false }) {
  const padY = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + (1 - (v - min) / range) * (height - padY * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={accent ? 'var(--accent)' : 'var(--ink-2)'} strokeOpacity={accent ? 1 : 0.55} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Static city silhouette — simple grayscale block plan. No animation, no 3D, no detail.
function CityPreview() {
  // Districts laid out as simple stacked blocks. One ("auth") is subtly highlighted
  // because pattern E fired there.
  return (
    <svg viewBox="0 0 320 260" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
      <defs>
        <pattern id="floor" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 0H14M0 0V14" stroke="var(--hairline)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="260" fill="url(#floor)" />
      {/* district blocks (silhouettes only) */}
      <g fill="var(--muted-2)" fillOpacity="0.42" stroke="var(--ink-2)" strokeOpacity="0.18" strokeWidth="0.7">
        {/* core */}
        <rect x="32" y="120" width="40" height="80" />
        <rect x="78" y="100" width="28" height="100" />
        <rect x="112" y="130" width="34" height="70" />
        {/* observability */}
        <rect x="155" y="150" width="22" height="50" />
        <rect x="182" y="138" width="26" height="62" />
        {/* spatial */}
        <rect x="215" y="120" width="34" height="80" />
        <rect x="255" y="145" width="26" height="55" />
        {/* opsx */}
        <rect x="35" y="80" width="20" height="38" />
        <rect x="60" y="65" width="18" height="53" />
      </g>
      {/* auth district highlighted (E fired here) */}
      <g>
        <rect x="148" y="80" width="42" height="60" fill="var(--sev-bg-5)" stroke="var(--sev-5)" strokeOpacity="0.55" strokeWidth="1" />
        <rect x="195" y="92" width="14" height="48" fill="var(--sev-bg-5)" stroke="var(--sev-5)" strokeOpacity="0.45" strokeWidth="1" />
        <text x="169" y="74" textAnchor="middle" fill="var(--ink-2)" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em' }}>AUTH · DRIFT</text>
      </g>
      {/* horizon line */}
      <line x1="0" y1="200" x2="320" y2="200" stroke="var(--hairline-strong)" strokeWidth="1" />
    </svg>
  );
}

Object.assign(window, { Burndown, Velocity, Sparkline, CityPreview });
