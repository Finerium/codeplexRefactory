// app-closer.jsx — Final CTA + hackathon credit.
/* global React */

function CloserSection() {
  return (
    <section className="closer">
      <div className="inner">
        <div className="eyebrow" style={{ marginBottom: 24 }}>The city is live.</div>
        <h2 className="big">
          You've seen<br/>the skyline.<br/><em>Walk in.</em>
        </h2>
        <div className="row">
          <a className="cta" href="https://duopoly.hackathon.sev-2.com">
            Open the city <span className="arrow">→</span>
          </a>
          <a className="cta cta--ghost" href="#">View the residents →</a>
        </div>
        <div className="credit">
          <div className="col">
            <span>BUILT AT</span>
            <span><b>Refactory Hackathon Round 03</b></span>
            <span>Telkom University Bandung · May 12–13, 2026</span>
          </div>
          <div className="col" style={{ textAlign:'right' }}>
            <span>TEAM</span>
            <span><b>Tim Duopoly</b></span>
            <span>Ghaisan Khoirul Badruzaman · Hafiz Fauzan Syafrudin</span>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { CloserSection });
