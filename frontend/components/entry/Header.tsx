import { Badge } from "./Badge";
import { Wordmark } from "./Wordmark";

// Hestia Wave 1: Entry page top header. Wordmark on the left, build tag + v0.3
// prototype badge on the right. v0.3 prototype copy is panitia-canonical per
// Pythia decision log (supersedes older PRD v0.1 text).

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
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="entry-micro" style={{ color: "var(--mute)" }}>
          build . 0.3.0-alpha . refactory-r03
        </span>
        <Badge tone="ember">v0.3 prototype</Badge>
      </div>
    </header>
  );
}
