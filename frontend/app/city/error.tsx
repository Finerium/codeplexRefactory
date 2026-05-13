"use client";

/**
 * /city route-scoped error boundary.
 *
 * Hestia Wave-Fixing Final (manager cycle 3, E-6 RECURRING).
 *
 * Wraps the city render tree so any scene-mount throw (WebGL context lost,
 * useCityData hydration mismatch, an r3f child component bug, a Demeter
 * subscription teardown race) does not collapse the demo into the bare
 * Next.js "Application error" banner.
 *
 * Why route-scoped on top of app/error.tsx: the city page has the largest
 * runtime surface (ChronicleCanvas + ~240 building instances + 5 mode
 * overlays + 14 sprint PM concepts + onboarding + activity scrubber +
 * sprint retro flythrough + health glow + refactor ghosts). When something
 * goes wrong here, the user is most likely arriving from /start/pick-repo
 * or /start, so the dominant recovery path is "go back to picker" rather
 * than "go back to landing".
 *
 * This boundary is reset-safe: it exposes the Next.js `reset()` callback
 * which re-renders the same segment. If the underlying error is transient
 * (chunk hot-reload race, WebGL temporary fail) the user can retry without
 * losing query state. Hard-link fallbacks (/start, /start/pick-repo) jump
 * out of the failing segment when retry alone is not enough.
 *
 * Honest claim (Lock 5): the boundary mitigates symptom, not cause. Each
 * real underlying error still needs a real fix in its owning component
 * (Iris / Hera / Persephone / Boreas / Asclepius domains). The boundary
 * keeps the demo recoverable when something does slip through.
 *
 * Lock 1 (no em dash): clean.
 * Lock 2 (no emoji): clean.
 */

import { useEffect } from "react";
import type { CSSProperties } from "react";

interface CityErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CityRouteError({ error, reset }: CityErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[hestia /city boundary] scene render threw", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  // Best-effort surface of the inbound query so the user can see which
  // demo or repo they tried to load. Read on mount, never during SSR.
  const inboundQuery =
    typeof window !== "undefined" ? window.location.search : "";

  return (
    <main style={pageStyle} role="alert" aria-live="assertive">
      <div style={kickerStyle}>codeplex chronicle . city render fault</div>
      <h1 style={titleStyle}>
        The city scene{" "}
        <span style={{ color: "oklch(0.78 0.14 55)" }}>did not mount</span>.
      </h1>
      <p style={paragraphStyle}>
        A renderer in the 3D scene threw before the buildings could rise. The
        five residents are safe in their landmarks. Try the same view again,
        or step back and pick a different dataset.
      </p>
      <div style={detailWrapStyle}>
        <div style={detailLabelStyle}>inbound query</div>
        <code style={detailCodeStyle}>{inboundQuery || "(none)"}</code>
        <div style={detailLabelStyle}>error message</div>
        <code style={detailCodeStyle}>
          {error.message || "no message provided"}
        </code>
        {error.digest && (
          <>
            <div style={detailLabelStyle}>digest</div>
            <code style={detailCodeStyle}>{error.digest}</code>
          </>
        )}
      </div>
      <div style={buttonRowStyle}>
        <button
          type="button"
          onClick={() => {
            reset();
          }}
          style={primaryButtonStyle}
        >
          try the city again
        </button>
        <a href="/start/pick-repo" style={ghostLinkStyle}>
          pick a different dataset
        </a>
        <a href="/start" style={ghostLinkStyle}>
          back to entry doors
        </a>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "48px 24px",
  background: "oklch(0.115 0.018 55)",
  color: "oklch(0.96 0.015 80)",
  fontFamily:
    "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
  textAlign: "center",
  gap: 18,
};

const kickerStyle: CSSProperties = {
  font: "500 11px/1 'JetBrains Mono', monospace",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "oklch(0.78 0.14 55)",
};

const titleStyle: CSSProperties = {
  font: "400 clamp(28px, 4.2vw, 44px)/1.12 'Space Grotesk', sans-serif",
  letterSpacing: "-0.02em",
  margin: 0,
  maxWidth: 720,
};

const paragraphStyle: CSSProperties = {
  font: "400 14px/1.6 'JetBrains Mono', monospace",
  color: "oklch(0.7 0.03 75)",
  maxWidth: 560,
  margin: "4px 0 0",
};

const detailWrapStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "max-content 1fr",
  gap: "6px 14px",
  marginTop: 16,
  padding: "14px 18px",
  background: "oklch(0.16 0.02 60 / 0.55)",
  border: "1px solid oklch(0.3 0.04 60 / 0.5)",
  borderRadius: 10,
  maxWidth: 640,
  width: "100%",
  textAlign: "left",
};

const detailLabelStyle: CSSProperties = {
  font: "500 11px/1.4 'JetBrains Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: "oklch(0.65 0.03 75)",
  alignSelf: "start",
};

const detailCodeStyle: CSSProperties = {
  font: "400 12px/1.5 'JetBrains Mono', monospace",
  color: "oklch(0.88 0.04 60)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "center",
  marginTop: 12,
};

const primaryButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background:
    "linear-gradient(180deg, oklch(0.78 0.16 60), oklch(0.55 0.16 45))",
  color: "oklch(0.13 0.03 40)",
  border: "1px solid oklch(0.6 0.18 50)",
  borderRadius: 6,
  padding: "10px 18px",
  font: "600 13px/1 'Space Grotesk', sans-serif",
  letterSpacing: "0.01em",
};

const ghostLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "transparent",
  border: "1px solid oklch(0.3 0.04 60 / 0.6)",
  borderRadius: 6,
  padding: "10px 16px",
  color: "oklch(0.85 0.04 75)",
  textDecoration: "none",
  font: "500 13px/1 'JetBrains Mono', monospace",
};
