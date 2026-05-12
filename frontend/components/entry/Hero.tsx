// Hestia Wave 1: "Two doors" hero framing on the Entry page. Copy is verbatim
// per Designer Prompt 2 line 110 and locked by Eunomia Wave 1 audit.

export function Hero() {
  return (
    <section
      style={{
        textAlign: "center",
        padding: "12px 24px 28px",
        position: "relative",
        zIndex: 5,
      }}
    >
      <div
        className="entry-micro entry-upper"
        style={{ color: "var(--brass-soft)", marginBottom: 14 }}
      >
        you have arrived
      </div>
      <h1
        style={{
          font: "400 clamp(28px, 4.2vw, 52px)/1.12 'Space Grotesk', sans-serif",
          letterSpacing: "-0.02em",
          margin: "0 auto",
          maxWidth: 880,
          color: "var(--ink)",
        }}
      >
        Two doors. <span style={{ color: "var(--brass)" }}>One opens to your codebase.</span>
        <br />
        <span style={{ color: "var(--ink-soft)" }}>The other to a blank lot.</span>
      </h1>
      <p
        style={{
          font: "400 14px/1.55 'JetBrains Mono', monospace",
          color: "var(--mute)",
          margin: "16px auto 0",
          maxWidth: 560,
        }}
      >
        pick one. the city renders behind it. five residents are already inside, waiting.
      </p>
    </section>
  );
}
