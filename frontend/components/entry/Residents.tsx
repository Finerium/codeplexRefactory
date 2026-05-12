import { RESIDENTS } from "./residents-data";
import { ResidentGlyph } from "./ResidentGlyph";

// Hestia Wave 1: 5 resident introduction strip on the Entry page footer.
//
// Revision 1 note: bundle previously rendered a special "on the sill" badge
// for Hermes (the only resident with onSill: true). That badge paired with the
// floating Hermes creature on the page. Since the creature is removed entry-
// wide, the "on the sill" badge is removed here too and Hermes reads as a
// peer of the other four colleagues.
//
// Reference:
//   bundle file entry-app.jsx lines 469-535 (original Residents)

export function Residents() {
  return (
    <section
      style={{
        padding: "30px 44px 18px",
        borderTop: "1px solid var(--rule)",
        position: "relative",
        zIndex: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span
            className="entry-micro entry-upper"
            style={{ color: "var(--brass-soft)" }}
          >
            // the residents
          </span>
          <span className="entry-micro" style={{ color: "var(--mute)" }}>
            five colleagues already inside
          </span>
        </div>
        <span className="entry-micro" style={{ color: "var(--faint)" }}>
          n=5 . ai . resident
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 1,
          background: "var(--rule)",
          border: "1px solid var(--rule)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {RESIDENTS.map((r) => (
          <article
            key={r.name}
            style={{
              padding: "16px 14px 14px",
              background: "oklch(0.155 0.025 55)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <ResidentGlyph kind={r.glyph} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  font: "600 16px/1.1 'Space Grotesk', sans-serif",
                  color: "var(--ink)",
                }}
              >
                {r.name}
              </h3>
              <div
                className="entry-micro"
                style={{ color: "var(--brass-soft)", marginTop: 4 }}
              >
                {r.role}
                <span style={{ color: "var(--mute)" }}> . {r.home}</span>
              </div>
            </div>
            <p
              style={{
                margin: "4px 0 0",
                font: "400 12.5px/1.5 'JetBrains Mono', monospace",
                color: "var(--ink-soft)",
              }}
            >
              {r.bio}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
