// Hestia Wave 1: data residency privacy notice per PRD Section 19.4. DeepSeek
// V4 is a China-based LLM provider, panitia visitors deserve a single-sentence
// disclosure on the threshold page so they can choose to proceed informed.
//
// Copy authored from PRD Section 19.4. "Learn more" link routes to /privacy
// which Pan post-Wave 3 may author as a full notice; for Wave 1 the route is a
// known placeholder that resolves to a stub.

export function PrivacyNotice() {
  return (
    <aside
      id="privacy-notice"
      style={{
        margin: "0 44px",
        padding: "12px 14px",
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        font: "400 11.5px/1.55 'JetBrains Mono', monospace",
        color: "var(--mute)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        position: "relative",
        zIndex: 4,
        scrollMarginTop: 80,
      }}
      aria-label="Data residency notice"
    >
      <span>
        Codeplex Chronicle calls DeepSeek, a China-based language-model provider,
        for each resident response. Repository metadata and prompt context travel
        outside the EU and US during a session.
      </span>
      <a
        href="/privacy"
        style={{
          color: "var(--ink-soft)",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textUnderlineOffset: "2px",
        }}
      >
        Learn more
      </a>
    </aside>
  );
}
