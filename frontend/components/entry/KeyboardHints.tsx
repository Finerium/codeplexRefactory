// Hestia Wave 1: tiny keyboard hint strip under the two windows. Communicates
// arrow-key + enter affordance for keyboard users.

const kbdStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 6px",
  margin: "0 1px",
  background: "oklch(0.2 0.03 55)",
  border: "1px solid var(--rule-hi)",
  borderRadius: 3,
  color: "var(--ink-soft)",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 10,
};

export function KeyboardHints() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "10px 24px 0",
        font: "400 11px/1 'JetBrains Mono', monospace",
        color: "var(--faint)",
        letterSpacing: "0.05em",
      }}
      aria-hidden="true"
    >
      <kbd style={kbdStyle}>{"←"}</kbd> <kbd style={kbdStyle}>{"→"}</kbd> to choose .{" "}
      <kbd style={kbdStyle}>{"↵"}</kbd> to enter . <kbd style={kbdStyle}>esc</kbd> back to landing
    </div>
  );
}
