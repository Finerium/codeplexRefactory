/**
 * ModesSection, Act 3 the five product modes.
 *
 * Authored by Calliope (Wave 1) ported 1-to-1 from Designer Prompt 1 bundle
 * file `app-modes.jsx`. Wave-Fixing cycle 1 L-3 revision: previously the
 * grid filtered out `m.hero` (Sprint) on the assumption that SprintSection
 * upstream covered MODE 02 as a hero spotlight, leaving the grid showing
 * only 4 cards (Onboarding 01, Refactor 03, Activity 04, Health 05). QA
 * round 2 flagged this as a completeness gap: the eyebrow promised five
 * modes but the grid showed four, and the numbering jumped 01 -> 03 with
 * no visible 02 entry.
 *
 * Fix: render all five MODES in the grid, including Sprint, with a small
 * "HERO SPOTLIGHT" pill on the Sprint card so its dual role (full Act 2
 * pinned spotlight above + grid entry here) reads as intentional rather
 * than redundant. Eyebrow updated to "Five product modes" and counter
 * denominator bumped 04 -> 05. Span composition kept compatible: Sprint
 * inserted at its natural position (index 1), spans adjusted so the row
 * widths still sum to 12 (Tailwind grid contract).
 */
import { MODES, MODE_GLYPHS } from './data';

const MODE_SPANS: Record<number, string> = {
  0: 'span 7',
  1: 'span 5',
  2: 'span 6',
  3: 'span 6',
  4: 'span 12',
};

export function ModesSection() {
  return (
    <section className="modes">
      <div className="head">
        <div>
          <div className="eyebrow">Five product modes</div>
          <h2 className="h2" style={{ margin: '18px 0 0', maxWidth: '18ch' }}>
            The city has work to do
            <br />
            after the sprint ends.
          </h2>
        </div>
        <p className="body" style={{ color: 'var(--ink-2)' }}>
          Five product modes total. Sprint is the hero you saw above. The other four take
          the same code-as-city substrate and ask a different question of it: onboarding,
          refactor, activity, health.
        </p>
      </div>
      <div className="modes-grid">
        {MODES.map((m, i) => (
          <article
            key={m.id}
            className="mode-card"
            style={{ gridColumn: MODE_SPANS[i] ?? 'span 6' }}
          >
            <div className="top">
              <div>
                <div className="caps" style={{ marginBottom: 6 }}>
                  Mode {m.n}
                  {m.hero ? (
                    <span
                      style={{
                        marginLeft: 10,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'color-mix(in oklab, var(--warm) 16%, transparent)',
                        color: 'var(--warm)',
                        fontSize: 9.5,
                        letterSpacing: '0.18em',
                      }}
                    >
                      HERO SPOTLIGHT
                    </span>
                  ) : null}
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
                {String(i + 1).padStart(2, '0')} / 05
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
