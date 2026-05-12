// app-data.jsx — copy + glyphs (no components).

const MODES = [
  {
    id: 'onboarding', n: '01', name: 'Onboarding',
    line: 'Drop in. The city teaches itself.',
    body: 'A new engineer walks in from the gate and Hermes meets them. Thirty minutes through landmarks, naming the streets. Not two weeks of catching up.',
    stat: '30 min', statLbl: 'new-eng walk-in',
  },
  {
    id: 'sprint', n: '02', name: 'Sprint', hero: true,
    line: 'Pull requests rise as buildings. The skyline updates while you ship.',
    body: 'The agile board projects onto the city. PR opens, a foundation sets. CI passes, the floors climb. Merge, and a window lights. The team watches the skyline change in real time.',
    stat: '0 ms', statLbl: 'PR→skyline',
  },
  {
    id: 'refactor', n: '03', name: 'Refactor',
    line: 'Athena drafts a new district in the sandbox. You keep what holds.',
    body: 'Structural changes are proposed against a shadow folder — same files, different shape. You walk both versions of the city side by side. Accept moves them in. Discard leaves no trace.',
    stat: '1-click', statLbl: 'sandbox accept',
  },
  {
    id: 'activity', n: '04', name: 'Activity',
    line: 'Ownership glows. Hotspots burn.',
    body: 'Six months of git history projected as light: who lives where, which blocks were rebuilt this quarter, which corners haven’t been touched since the founding commit.',
    stat: '180 d', statLbl: 'commit memory',
  },
  {
    id: 'health', n: '05', name: 'Health',
    line: 'The city reports its symptoms. One click files the ticket.',
    body: 'Deterministic detectors run on every save. Apollo lists the fevers in plain English; each one writes its own ticket, scoped to the right team, attached to the right building.',
    stat: '47', statLbl: 'detectors live',
  },
];

const RESIDENTS = [
  { id:'athena', name:'Athena', role:'The Architect', landmark:'City Hall',
    line:'Reads the city’s bones. Holds the blueprint open while you draw on it.' },
  { id:'apollo', name:'Apollo', role:'The Doctor', landmark:'Hospital',
    line:'Listens for fevers. Files the ticket before the alert fires.' },
  { id:'argus',  name:'Argus',  role:'The Watcher', landmark:'Police Station',
    line:'Counts the lit windows at 3AM. Knows which districts work late.' },
  { id:'clio',   name:'Clio',   role:'The Historian', landmark:'Library',
    line:'Remembers every commit. Will recite the morning of June 14th on request.' },
  { id:'hermes', name:'Hermes', role:'The Guide', landmark:'Tourist Info',
    line:'Walks new engineers in from the gate. Names the streets in order.' },
];

// Mode glyphs — minimal architectural marks, single-shape silhouettes
const MODE_GLYPHS = {
  onboarding: (
    <svg viewBox="0 0 80 80">
      <g stroke="currentColor" fill="none" strokeWidth="1.2">
        <path d="M8 60 L40 22 L72 60 Z"/>
        <path d="M40 22 L40 60"/>
        <circle cx="40" cy="44" r="3" fill="currentColor"/>
      </g>
    </svg>
  ),
  sprint: (
    <svg viewBox="0 0 80 80">
      <g stroke="currentColor" fill="none" strokeWidth="1.2">
        <rect x="14" y="50" width="10" height="20"/>
        <rect x="28" y="36" width="10" height="34"/>
        <rect x="42" y="22" width="10" height="48"/>
        <rect x="56" y="10" width="10" height="60"/>
        <path d="M19 50 L33 36 L47 22 L61 10" />
      </g>
    </svg>
  ),
  refactor: (
    <svg viewBox="0 0 80 80">
      <g stroke="currentColor" fill="none" strokeWidth="1.2">
        <rect x="10" y="14" width="24" height="52" strokeDasharray="2 3"/>
        <rect x="44" y="14" width="24" height="52"/>
        <path d="M34 40 L46 40 M40 34 L46 40 L40 46"/>
      </g>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 80 80">
      <g stroke="currentColor" fill="none" strokeWidth="1.2">
        <circle cx="40" cy="40" r="26"/>
        <circle cx="40" cy="40" r="18"/>
        <circle cx="40" cy="40" r="10"/>
        <path d="M40 14 L40 66 M14 40 L66 40"/>
        <circle cx="52" cy="34" r="3" fill="currentColor"/>
      </g>
    </svg>
  ),
  health: (
    <svg viewBox="0 0 80 80">
      <g stroke="currentColor" fill="none" strokeWidth="1.2">
        <path d="M10 42 L26 42 L32 28 L40 56 L48 36 L54 42 L70 42"/>
      </g>
    </svg>
  ),
};

const RESIDENT_PORTRAITS = {
  athena: (
    <svg viewBox="0 0 200 120">
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <path d="M100 8 L156 96 L44 96 Z"/>
        <path d="M100 8 L100 96"/>
        <path d="M72 56 L128 56"/>
      </g>
    </svg>
  ),
  apollo: (
    <svg viewBox="0 0 200 120">
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <rect x="44" y="36" width="112" height="60"/>
        <rect x="80" y="20" width="40" height="76"/>
        <rect x="90" y="40" width="20" height="36"/>
        <path d="M100 46 L100 70 M88 58 L112 58"/>
      </g>
    </svg>
  ),
  argus: (
    <svg viewBox="0 0 200 120">
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <rect x="50" y="40" width="100" height="56"/>
        <rect x="80" y="20" width="40" height="76"/>
        <circle cx="100" cy="36" r="3" fill="currentColor"/>
      </g>
    </svg>
  ),
  clio: (
    <svg viewBox="0 0 200 120">
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <rect x="24" y="36" width="152" height="60"/>
        <rect x="24" y="30" width="152" height="6"/>
        {[...Array(11)].map((_,i)=> (
          <path key={i} d={`M${36+i*14} 40 L${36+i*14} 92`}/>
        ))}
      </g>
    </svg>
  ),
  hermes: (
    <svg viewBox="0 0 200 120">
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <rect x="80" y="48" width="40" height="48"/>
        <path d="M70 48 L100 24 L130 48"/>
        <circle cx="100" cy="38" r="3" fill="currentColor"/>
      </g>
    </svg>
  ),
};

Object.assign(window, { MODES, RESIDENTS, MODE_GLYPHS, RESIDENT_PORTRAITS });
