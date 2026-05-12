import { Badge } from "./Badge";
import { Wordmark } from "./Wordmark";

// Hestia Wave 1: Entry page top header. Wordmark on the left, build tag + v0.3
// prototype badge on the right. v0.3 prototype copy is panitia-canonical per
// Pythia decision log (supersedes older PRD v0.1 text).
//
// Hestia Wave-Fixing #2 cycle 1: Docs + Changelog nav links added per
// Manager Wave-Fixing #2 polish scope. Both link to anchors on the entry
// page itself (privacy notice section + footer) so they resolve without
// shipping new routes. Wave 3 follow-up wires real docs and changelog
// pages.

export function Header() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 44px",
        position: "relative",
        zIndex: 5,
      }}
    >
      <Wordmark />
      <nav
        aria-label="entry nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <a href="#privacy-notice" style={navLinkStyle}>
          Docs
        </a>
        <a
          href="https://github.com/Finerium/codeplexRefactory/commits/main"
          target="_blank"
          rel="noopener noreferrer"
          style={navLinkStyle}
        >
          Changelog
        </a>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 1,
            height: 16,
            background: "oklch(0.3 0.04 60 / 0.6)",
          }}
        />
        <span className="entry-micro" style={{ color: "var(--mute)" }}>
          build . 0.3.0-alpha . refactory-r03
        </span>
        <Badge tone="ember">v0.3 prototype</Badge>
      </nav>
    </header>
  );
}

const navLinkStyle = {
  font: "500 12px/1 'JetBrains Mono', monospace",
  color: "oklch(0.78 0.06 70)",
  textDecoration: "none",
  letterSpacing: "0.02em",
} as const;
