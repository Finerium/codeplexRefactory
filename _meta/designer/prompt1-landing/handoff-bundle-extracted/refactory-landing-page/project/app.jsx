// app.jsx — main shell. Mounts city, wires scroll, composes sections, owns Tweaks.
/* global React, ReactDOM, City,
   HeroSection, TrinitySection, SprintSection, ModesSection, ResidentsSection, CloserSection,
   TweaksPanel, useTweaks, TweakSection, TweakSlider, TweakToggle, TweakRadio */
const { useEffect: aUseEffect, useRef: aUseRef, useState: aUseState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "fogDensity": 0.55,
  "motionIntensity": 0.70,
  "dayMode": false,
  "windowGlow": 0.85,
  "labelsVis": "scroll-only"
}/*EDITMODE-END*/;

const ACT_LABELS = ['Hero','Trinity','Sprint','Modes','Residents','Open'];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeAct, setActiveAct] = aUseState(0);
  const initRef = aUseRef(false);

  aUseEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const canvas = document.getElementById('city-canvas');
    if (canvas && window.City) City.init(canvas);
  }, []);

  aUseEffect(() => {
    if (!window.City) return;
    City.setMode(t.dayMode);
    City.setFog(t.fogDensity);
    if (City.setSaturation) City.setSaturation(1.0);
    City.setMotion(t.motionIntensity);
    if (City.setWindowGlow) City.setWindowGlow(t.windowGlow);
    if (City.setWindowDensity) City.setWindowDensity('medium');
    if (City.setFlicker) City.setFlicker('occasional');
    if (City.setBuildingDetail) City.setBuildingDetail('moderate');
    document.documentElement.dataset.mode = t.dayMode ? 'day' : 'night';
  }, [t.dayMode, t.fogDensity, t.motionIntensity, t.windowGlow]);

  aUseEffect(() => {
    const html = document.documentElement;
    html.dataset.labels = t.labelsVis;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? doc.scrollTop / max : 0;
      if (window.City) City.setScroll(p);
      if (window.scrollY > 80) html.dataset.scrolled = '1'; else html.dataset.scrolled = '0';
      const acts = document.querySelectorAll('[data-act]');
      let cur = 0;
      acts.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.45) cur = Math.max(cur, parseInt(el.dataset.act, 10));
      });
      if (window.scrollY > 0) {
        const closer = document.querySelector('.closer');
        const modes  = document.querySelector('.modes');
        const res    = document.querySelector('.residents');
        if (closer && closer.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = 5;
        else if (res && res.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = 4;
        else if (modes && modes.getBoundingClientRect().top <= window.innerHeight * 0.5) cur = 3;
      }
      setActiveAct(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [t.labelsVis]);

  return (
    <main>
      <div className="progress">
        {ACT_LABELS.map((l, i) => (
          <div key={i} className={'tick' + (i === activeAct ? ' active' : '')}>
            <span className="lbl">{String(i).padStart(2,'0')} · {l}</span>
          </div>
        ))}
      </div>

      <HeroSection/>
      <TrinitySection/>
      <SprintSection/>
      <ModesSection/>
      <ResidentsSection/>
      <CloserSection/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Atmosphere"/>
        <TweakToggle label="Daybreak (opt-in light)" value={t.dayMode}
          onChange={(v)=>setTweak('dayMode', v)}/>
        <TweakSlider label="Fog opacity" value={t.fogDensity} min={0} max={1} step={0.02}
          onChange={(v)=>setTweak('fogDensity', v)}/>
        <TweakSlider label="Window glow" value={t.windowGlow} min={0} max={1.4} step={0.02}
          onChange={(v)=>setTweak('windowGlow', v)}/>

        <TweakSection label="Motion"/>
        <TweakSlider label="Camera intensity" value={t.motionIntensity} min={0} max={1.4} step={0.02}
          onChange={(v)=>setTweak('motionIntensity', v)}/>

        <TweakSection label="Interface"/>
        <TweakRadio label="Section labels"
          options={['always','scroll-only','hidden']} value={t.labelsVis}
          onChange={(v)=>setTweak('labelsVis', v)}/>
      </TweaksPanel>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
