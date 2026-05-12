// Main app composition.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "saturation": 60,
  "severityContrast": 60,
  "accentPresence": 50,
  "dark": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [repo, setRepo] = React.useState(REPOS[0]);
  const [range, setRange] = React.useState(TIME_RANGES[1]); // this sprint

  // Apply tweaks as CSS variables on the root <div> ─────────────────────────
  // saturation 0..100 → chroma 0..0.16
  // severityContrast 0..100 → severity ramp lightness compression
  // accentPresence 0..100 → opacity of incidental accent elements (briefing dot, today line, sparkline accent, kpi delta tint)
  const cssVars = React.useMemo(() => {
    const chroma = (t.saturation / 100) * 0.13;
    const accentL = 0.55;
    const accentH = 265;
    const accentMain = `oklch(${accentL} ${chroma} ${accentH})`;
    const accent2 = `oklch(${accentL} ${chroma} ${accentH} / 0.12)`;
    const accent3 = `oklch(${accentL} ${chroma} ${accentH} / 0.06)`;

    // Severity ramp scaling — at contrast 0 the 5 steps collapse toward gray;
    // at 100 they spread further into warm amber. We always stay below the
    // alarmist red zone (chroma ≤ 0.08).
    const c = t.severityContrast / 100;
    const sevChroma = 0.01 + c * 0.07;
    return {
      '--accent': accentMain,
      '--accent-2': accent2,
      '--accent-3': accent3,
      '--sev-1': `oklch(0.92 ${0.005 + c * 0.005} 80)`,
      '--sev-2': `oklch(0.80 ${0.01 + c * 0.01} 75)`,
      '--sev-3': `oklch(0.62 ${0.015 + c * 0.02} 70)`,
      '--sev-4': `oklch(0.50 ${0.02 + c * 0.04} 60)`,
      '--sev-5': `oklch(0.42 ${sevChroma} 50)`,
      '--sev-bg-5': `oklch(0.42 ${sevChroma} 50 / ${0.04 + c * 0.06})`,
      '--accent-presence': t.accentPresence / 100,
    };
  }, [t.saturation, t.severityContrast, t.accentPresence]);

  // sync theme + density attributes on <html>
  React.useEffect(() => {
    document.documentElement.dataset.theme = t.dark ? 'dark' : 'light';
    document.documentElement.dataset.density = t.density;
  }, [t.dark, t.density]);

  return (
    <div className="app" style={cssVars}>
      <TopBar
        repo={repo} repos={REPOS} onRepoChange={setRepo}
        range={range} ranges={TIME_RANGES} onRangeChange={setRange}
      />

      <main className="shell" style={{ flex: 1 }}>
        <Briefing repo={repo} range={range} />

        <div className="stack">
          <KPIStrip kpis={KPIS} />

          <div className="grid-main">
            <div className="stack">
              <div className="card">
                <div className="card-hd">
                  <div>
                    <h3>Sprint 14 burndown</h3>
                    <div className="sub">{BURNDOWN.day_index} of 10 days · {BURNDOWN.days_to_ship} until ship</div>
                  </div>
                  <div className="num muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    27 / 50 pts remaining
                  </div>
                </div>
                <div className="card-body">
                  <Burndown data={BURNDOWN} />
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div>
                    <h3>Velocity · last 8 sprints</h3>
                    <div className="sub">story points completed per sprint</div>
                  </div>
                </div>
                <div className="card-body">
                  <Velocity data={VELOCITY} />
                </div>
              </div>
            </div>

            <CityCard />
          </div>

          <DriftSection patterns={DRIFT_PATTERNS} contrast={t.severityContrast} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 'var(--gap)' }}>
            <Contributors list={CONTRIBUTORS} />
            <Proposals stages={PROPOSALS_STAGES} items={PROPOSALS} />
          </div>

          <RepoRail repos={REPOS} activeId={repo.id} onSelect={setRepo} />
        </div>

        <footer className="footer">
          <span>Codeplex Chronicle · Tim Duopoly · Refactory Hackathon Round 03 · Telkom University Bandung · May 12-13 2026</span>
          <span><a href="#" onClick={(e) => e.preventDefault()}>changelog</a> · <a href="#" onClick={(e) => e.preventDefault()}>docs</a></span>
        </footer>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Mode">
          <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density" value={t.density}
                      options={['compact','regular','comfy']}
                      onChange={(v) => setTweak('density', v)} />
        </TweakSection>
        <TweakSection label="Palette">
          <TweakSlider label="Accent saturation" value={t.saturation} min={0} max={100} unit="%"
                       onChange={(v) => setTweak('saturation', v)} />
          <TweakSlider label="Accent presence"   value={t.accentPresence} min={0} max={100} unit="%"
                       onChange={(v) => setTweak('accentPresence', v)} />
        </TweakSection>
        <TweakSection label="Severity">
          <TweakSlider label="Severity contrast" value={t.severityContrast} min={0} max={100} unit="%"
                       onChange={(v) => setTweak('severityContrast', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
