// Hestia Wave 1: small Codeplex Chronicle wordmark used in the Entry header.
// Two stacked tiles for the city mark plus the entry subtitle. Ported from
// bundle entry-app.jsx Wordmark.

export function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="22" height="22" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="entry-wm-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.13 80)" />
            <stop offset="100%" stopColor="oklch(0.55 0.16 45)" />
          </linearGradient>
        </defs>
        <rect x="3" y="11" width="6" height="10" fill="url(#entry-wm-g)" />
        <rect x="10" y="7" width="6" height="14" fill="url(#entry-wm-g)" opacity="0.75" />
        <rect x="17" y="13" width="4" height="8" fill="url(#entry-wm-g)" opacity="0.55" />
        <circle cx="6" cy="14" r="0.8" fill="oklch(0.16 0.03 50)" />
        <circle cx="13" cy="11" r="0.8" fill="oklch(0.16 0.03 50)" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            font: "600 13px/1 'Space Grotesk', sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          Codeplex Chronicle
        </span>
        <span
          className="entry-micro"
          style={{ color: "var(--mute)", marginTop: 3, fontSize: 10 }}
        >
          entry . threshold
        </span>
      </div>
    </div>
  );
}
