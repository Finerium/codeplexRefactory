// app-trinity.jsx — Act 1: code → AI residents → city. Three-step reveal.
/* global React, TrinityCode, TrinityResidents, TrinityCity */
const { useRef: triUseRef, useEffect: triUseEffect, useState: triUseState } = React;

function TrinitySection() {
  const ref = triUseRef(null);
  const [step, setStep] = triUseState(0);

  triUseEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const h = el.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / h));
      const s = Math.min(2, Math.floor(p * 3));
      setStep(s);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    { num:'I.',  h:'Code becomes city.',
      d:'Every file is a building. Every folder is a district. Repo shape, made spatial.' },
    { num:'II.', h:'AI residents move in.',
      d:'Five Greek-named residents take landmark buildings. They read, watch, narrate, diagnose, guide.' },
    { num:'III.',h:'The city listens.',
      d:'Errors quake. Commits raise floors. Hotspots glow. The codebase becomes a place you walk through.' },
  ];

  return (
    <section className="act trinity" data-act="1" ref={ref}>
      <div className="pin">
        <div className="inner">
          <div className="trinity-stage">
            <TrinityLayer active={step===0}><TrinityCode/></TrinityLayer>
            <TrinityLayer active={step===1}><TrinityResidents/></TrinityLayer>
            <TrinityLayer active={step===2}><TrinityCity/></TrinityLayer>
          </div>
          <div>
            <div className="eyebrow">The Trinity</div>
            <h2 className="h2" style={{ margin:'18px 0 36px', maxWidth:'14ch' }}>
              Three layers, one place.
            </h2>
            <div className="trinity-rail">
              {steps.map((s, i) => (
                <div key={i} className={'step' + (step===i ? ' active' : '')}>
                  <div className="num">{s.num}</div>
                  <div>
                    <div className="h">{s.h}</div>
                    <div className="d">{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrinityLayer({ active, children }) {
  return (
    <div className="trinity-layer"
         style={{ opacity: active ? 1 : 0, transform: active ? 'scale(1)' : 'scale(.96)' }}>
      {children}
    </div>
  );
}

Object.assign(window, { TrinitySection, TrinityLayer });
