// app-hero.jsx — Act 0: cinematic hero with city + window POV + lockup.
/* global React, TowerPOV */
const { useRef: heroUseRef } = React;

function HeroSection() {
  const ref = heroUseRef(null);
  return (
    <section className="act hero" data-act="0" ref={ref}>
      <div className="pin">
        <TowerPOV />

        <div className="hero-top">
          <div className="col">
            <span>RUNTIME</span>
            <span>v1.0.0 — shipped</span>
          </div>
          <div className="col" style={{ textAlign: 'center' }}>
            <span>COORDINATES</span>
            <span>−6.97386, 107.63037</span>
          </div>
          <div className="col" style={{ textAlign: 'right' }}>
            <span>LOCAL TIME</span>
            <span>03:17 / WIB</span>
          </div>
        </div>

        <div className="hero-copy">
          <div className="lockup">
            <h1 className="display">
              Your codebase,<br/><em>alive</em>.
            </h1>
            <p className="sub lede">
              An AI-resident development environment.
              Production codebases as living 3D cities — files become buildings,
              folders become districts, errors become earthquakes you can feel.
            </p>
          </div>
          <div className="right">
            <a className="cta" href="https://duopoly.hackathon.sev-2.com">
              Open the city <span className="arrow">→</span>
            </a>
            <div className="meta-block">
              <span>STATUS</span><b>Live · 5 AI residents online</b>
              <span>BUILD</span><b>Refactory R03 · May 12–13, 2026</b>
              <span>TEAM</span><b>Tim Duopoly · 2 engineers</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HeroSection });
