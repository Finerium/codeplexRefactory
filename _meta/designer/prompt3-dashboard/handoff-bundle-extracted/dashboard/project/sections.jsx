// Composite sections.

const { useState, useRef, useEffect } = React;

// ── TopBar ─────────────────────────────────────────────────────────────────
function TopBar({ repo, repos, onRepoChange, range, ranges, onRangeChange, onToggleTweaks }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <div className="brand">
          <span className="brand-mark">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 1.5 1.5 5v8L9 16.5 16.5 13V5L9 1.5z" />
              <path d="M1.5 5 9 8.5 16.5 5M9 8.5v8" />
            </svg>
          </span>
          <span>Codeplex Chronicle</span>
          <span className="brand-sep">/</span>
          <span className="brand-page">Dashboard</span>
        </div>

        {/* repo dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button className="pill" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
            <Icon name="github" size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{repo.name}</span>
            <span className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>· {repo.branch}</span>
            <Icon name="chev-down" size={12} className="chev" />
          </button>
          {open && (
            <div className="menu" role="listbox">
              {repos.map(r => (
                <div key={r.id}
                     className={`menu-item ${r.id === repo.id ? 'active' : ''}`}
                     onClick={() => { onRepoChange(r); setOpen(false); }}>
                  <span className={`status-dot ${r.status}`} />
                  <div className="left">
                    <div className="repo-name" style={{ fontFamily: 'var(--font-mono)' }}>{r.name}</div>
                    <div className="sub">{r.branch} · {r.open} open PRs · {r.drift} drift</div>
                  </div>
                  {r.id === repo.id && <Icon name="check" size={13} />}
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--hairline)', margin: '6px 4px' }} />
              <div className="menu-item">
                <div className="left muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>+ Connect repository</div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-spacer" />

        <div className="seg" role="tablist" aria-label="Time range">
          {ranges.map(r => (
            <button key={r.id} role="tab"
                    aria-pressed={r.id === range.id}
                    onClick={() => onRangeChange(r)}>{r.label}</button>
          ))}
        </div>

        <button className="ghost" title="Search">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>⌘K</span>
        </button>

        <div className="avatar" title="Ghaisan Badruzaman" style={{ width: 28, height: 28, fontSize: 11 }}>GB</div>
      </div>
    </header>
  );
}

// ── Briefing ───────────────────────────────────────────────────────────────
function Briefing({ repo, range }) {
  return (
    <section className="briefing">
      <span className="dot" aria-hidden="true" />
      <div>
        <p>
          Sprint 14 ships in <em>3 days</em>. Velocity holding at 18 points. One drift pattern triggered in the <em>auth district</em>.
        </p>
        <div className="meta">
          {repo.name.split('/')[1]} · {range.label.toLowerCase()} · {new Date('2026-05-12T09:00:00').toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </section>
  );
}

// ── KPI strip ──────────────────────────────────────────────────────────────
function KPIStrip({ kpis }) {
  return (
    <div className="kpi-strip">
      {kpis.map(k => {
        const dir = k.trend === 'up' ? 'arrow-up' : k.trend === 'down' ? 'arrow-down' : 'arrow-flat';
        const sign = k.delta > 0 ? '+' : '';
        return (
          <div key={k.label} className="kpi">
            <div>
              <div className="kpi-label">{k.label}</div>
            </div>
            <div>
              <div className="kpi-value">
                <span className="num">{k.value}</span>
                {k.unit && <span className="unit">{k.unit}</span>}
              </div>
              <div className={`kpi-delta ${k.trend}`} style={{ marginTop: 10 }}>
                <Icon name={dir} size={12} />
                <span className="dir num">{sign}{k.delta}{k.deltaUnit}</span>
                <span className="muted">· {k.note}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Drift section ──────────────────────────────────────────────────────────
function DriftRow({ pattern, contrast = 60 }) {
  // contrast (0..100) scales how strongly severity 4 and 5 get warm tint vs gray
  const meterCls = (i) => i < pattern.severity ? `on${pattern.severity}` : '';
  return (
    <div className="drift-row" data-sev={pattern.severity}>
      <div className="drift-tag">{pattern.code}</div>
      <div>
        <div className="drift-title">{pattern.title}</div>
        <div className="drift-desc">{pattern.desc}{pattern.district ? ` · ${pattern.district} district` : ''}</div>
      </div>
      <div className="meter" aria-label={`severity ${pattern.severity} of 5`}>
        {[0,1,2,3,4].map(i => <i key={i} className={meterCls(i)} />)}
      </div>
      <div className="num muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        trend {pattern.trend}
      </div>
      <div className="drift-count">{pattern.count}</div>
    </div>
  );
}

function DriftSection({ patterns, contrast }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>Spec drift summary</h3>
          <div className="sub">five patterns · scanning across {patterns.reduce((s, p) => s + p.count, 0)} events</div>
        </div>
        <button className="ghost">
          <span>Open drift inspector</span>
          <Icon name="arrow-right" size={12} />
        </button>
      </div>
      <div className="card-body" style={{ paddingTop: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 120px 100px', gap: 18, padding: '6px 0', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <span></span>
          <span>Pattern</span>
          <span>Severity</span>
          <span>Δ vs last</span>
          <span style={{ textAlign: 'right' }}>Count</span>
        </div>
        {patterns.map(p => <DriftRow key={p.code} pattern={p} contrast={contrast} />)}
      </div>
    </div>
  );
}

// ── Contributors ───────────────────────────────────────────────────────────
function Contributors({ list }) {
  const maxPRs = Math.max(...list.map(c => c.prs));
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>Top contributors</h3>
          <div className="sub">sprint 14 · pr throughput</div>
        </div>
      </div>
      <div className="card-body">
        {list.map((c, i) => (
          <div key={c.handle} className="contrib-row">
            <div className="avatar">{c.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
            <div>
              <div className="contrib-name">{c.name}</div>
              <div className="contrib-handle">@{c.handle}</div>
            </div>
            <div className="bar"><i style={{ width: `${(c.prs / maxPRs) * 100}%` }} /></div>
            <div className="num" style={{ textAlign: 'right', color: 'var(--ink)', fontSize: 13 }}>{c.prs} PR</div>
            <div className="num muted" style={{ textAlign: 'right', fontSize: 11.5 }}>{c.reviews} rv</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Refactor proposals ─────────────────────────────────────────────────────
function Proposals({ stages, items }) {
  const grouped = {};
  stages.forEach(s => { grouped[s.id] = items.filter(it => it.stage === s.id); });
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>Refactor proposals</h3>
          <div className="sub">9 open · 1 awaiting accept</div>
        </div>
        <button className="ghost">
          <span>All proposals</span>
          <Icon name="arrow-right" size={12} />
        </button>
      </div>
      <div className="card-body">
        <div className="kanban">
          {stages.map(s => (
            <div key={s.id}>
              <div className="kanban-col-hd">
                <span className="label">{s.label}</span>
                <span className="count num">{grouped[s.id].length}</span>
              </div>
              <div className="kanban-col">
                {grouped[s.id].map(p => (
                  <div key={p.id} className="proposal">
                    <div className="proposal-title">{p.title}</div>
                    <div className="proposal-meta">
                      <span className="proposal-tag">{p.id}</span>
                      <span>@{p.author}</span>
                      <span style={{ marginLeft: 'auto' }}>{p.age}</span>
                    </div>
                  </div>
                ))}
                {grouped[s.id].length === 0 && (
                  <div style={{ height: 60, border: '1px dashed var(--hairline)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--muted-2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── City preview card ─────────────────────────────────────────────────────
function CityCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-hd">
        <div>
          <h3>City preview</h3>
          <div className="sub">5 districts · auth flagged</div>
        </div>
      </div>
      <div className="card-body" style={{ flex: 1 }}>
        <div className="city">
          <CityPreview />
          <a className="city-link" href="#" onClick={(e) => e.preventDefault()}>
            Open city view
            <Icon name="arrow-right" size={12} />
          </a>
          <div className="argus" title="Argus — the watcher" aria-label="Argus, the watcher resident">
            <Icon name="argus" size={20} />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <span>Last build · 12 min ago</span>
          <span>1,284 citizens</span>
        </div>
      </div>
    </div>
  );
}

// ── Cross-repo rail ────────────────────────────────────────────────────────
function RepoRail({ repos, activeId, onSelect }) {
  return (
    <section style={{ marginTop: 'var(--gap)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 0 12px' }}>
        <div className="section-label">Connected repositories</div>
        <div className="section-label" style={{ color: 'var(--muted-2)' }}>{repos.length} repos · 7 drift events</div>
      </div>
      <div className="repo-rail" style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderTop: 0, borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
        {repos.map(r => (
          <div key={r.id} className={`repo-cell ${r.id === activeId ? 'active' : ''}`} onClick={() => onSelect(r)}>
            <div className="hd">
              <div className="repo-name" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                <span className={`status-dot ${r.status}`} />
                {r.name.split('/')[1]}
              </div>
              <Sparkline data={r.spark} width={70} height={20} accent={r.id === activeId} />
            </div>
            <div className="repo-meta">
              <span>{r.open} open</span>
              <span>{r.drift > 0 ? `${r.drift} drift` : 'no drift'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, {
  TopBar, Briefing, KPIStrip, DriftSection, Contributors, Proposals, CityCard, RepoRail,
});
