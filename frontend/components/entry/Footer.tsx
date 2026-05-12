// Hestia Wave 1: hackathon credit footer. Copy is verbatim per Designer
// Prompt 2 line 132 ("Built at Refactory Hackathon Round 03, ...").

export function Footer() {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        padding: "20px 44px 32px",
        borderTop: "1px solid var(--rule)",
        color: "var(--mute)",
        font: "400 11.5px/1.6 'JetBrains Mono', monospace",
        position: "relative",
        zIndex: 4,
        flexWrap: "wrap",
      }}
    >
      <span>
        Built at <span style={{ color: "var(--ink-soft)" }}>Refactory Hackathon Round 03</span>,
        Telkom University Bandung, May 12 to 13 2026.
      </span>
      <span>
        Tim Duopoly <span style={{ color: "var(--faint)" }}>.</span>{" "}
        <span style={{ color: "var(--ink-soft)" }}>Ghaisan Khoirul Badruzaman</span>
        <span style={{ color: "var(--faint)" }}> + </span>
        <span style={{ color: "var(--ink-soft)" }}>Hafiz Fauzan Syafrudin</span>
      </span>
    </footer>
  );
}
