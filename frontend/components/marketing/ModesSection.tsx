/**
 * ModesSection, Act 3 the other four modes.
 *
 * Authored by Calliope (Wave 1) ported 1-to-1 from Designer Prompt 1 bundle
 * file `app-modes.jsx`. Filter out the Sprint hero mode (covered in Act 2),
 * grid 4 other modes (Onboarding, Refactor, Activity, Health) with the
 * mode glyph + stat. Span asymmetric per Designer composition rule
 * (i==0 span-7, i==1 span-5, i==2 span-6, i==3 span-6).
 */
import { MODES, MODE_GLYPHS } from './data';

export function ModesSection() {
  const others = MODES.filter((m) => !m.hero);
  return (
    <section className="modes">
      <div className="head">
        <div>
          <div className="eyebrow">Four more modes</div>
          <h2 className="h2" style={{ margin: '18px 0 0', maxWidth: '18ch' }}>
            The city has work to do
            <br />
            after the sprint ends.
          </h2>
        </div>
        <p className="body" style={{ color: 'var(--ink-2)' }}>
          Five product modes total. One you saw above; four below. Each takes the same
          code-as-city substrate and asks a different question of it.
        </p>
      </div>
      <div className="modes-grid">
        {others.map((m, i) => (
          <article
            key={m.id}
            className="mode-card"
            style={{
              gridColumn: i === 0 ? 'span 7' : i === 1 ? 'span 5' : 'span 6',
            }}
          >
            <div className="top">
              <div>
                <div className="caps" style={{ marginBottom: 6 }}>
                  Mode {m.n}
                </div>
                <div className="name">{m.name}</div>
              </div>
              <div className="glyph" style={{ color: 'var(--cool)' }}>
                {MODE_GLYPHS[m.id]}
              </div>
            </div>
            <div>
              <h3 className="h3" style={{ margin: '0 0 12px', maxWidth: '22ch' }}>
                {m.line}
              </h3>
              <p className="desc">{m.body}</p>
            </div>
            <div className="foot">
              <div>
                <div className="caps" style={{ color: 'var(--ink-3)', marginBottom: 4 }}>
                  {m.statLbl}
                </div>
                <div
                  className="name"
                  style={{ fontSize: 'clamp(20px,2.2vw,28px)', color: 'var(--warm)' }}
                >
                  {m.stat}
                </div>
              </div>
              <div className="caps" style={{ color: 'var(--ink-3)' }}>
                {String(i + 1).padStart(2, '0')} / 04
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
