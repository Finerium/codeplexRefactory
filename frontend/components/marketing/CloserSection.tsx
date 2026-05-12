/**
 * CloserSection, final CTA + hackathon credit footer.
 *
 * Authored by Calliope (Wave 1) ported 1-to-1 from Designer Prompt 1 bundle
 * file `app-closer.jsx`. Exact credit copy locked per PRD Section 24.1 +
 * Designer Prompt 1 line 74. CTA primary wires to `/start` (Hestia entry
 * page Wave 1) so the suite chain Landing -> Entry -> City stays cohesive.
 */
export function CloserSection() {
  return (
    <section className="closer">
      <div className="inner">
        <div className="eyebrow" style={{ marginBottom: 24 }}>
          The city is live.
        </div>
        <h2 className="big">
          You have seen
          <br />
          the skyline.
          <br />
          <em>Walk in.</em>
        </h2>
        <div className="row">
          <a className="cta" href="/start" title="Open the city, threshold entry page">
            Open the city <span className="arrow">{'→'}</span>
          </a>
          <a className="cta cta--ghost" href="#residents">
            View the residents {'→'}
          </a>
        </div>
        <div className="credit">
          <div className="col">
            <span>BUILT AT</span>
            <span>
              <b>Refactory Hackathon Round 03</b>
            </span>
            <span>Telkom University Bandung, May 12 to 13, 2026</span>
          </div>
          <div className="col" style={{ textAlign: 'right' }}>
            <span>TEAM</span>
            <span>
              <b>Tim Duopoly</b>
            </span>
            <span>Ghaisan Khoirul Badruzaman, Hafiz Fauzan Syafrudin</span>
          </div>
        </div>
      </div>
    </section>
  );
}
