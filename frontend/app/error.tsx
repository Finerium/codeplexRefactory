"use client";

/**
 * App-level error boundary.
 *
 * Hestia Wave-Fixing Final (manager cycle 3, E-5 + E-6 RECURRING).
 *
 * Next.js App Router convention: `app/error.tsx` is automatically wired as
 * a React 19 ErrorBoundary around every route segment that does not declare
 * its own error.tsx. Without this file, ANY uncaught error during render or
 * effect (e.g. a stale chunk reference, a third-party module crash, a 500
 * response that the calling code does not handle) collapses the route into
 * the default Next.js "Application error: a client-side exception has
 * occurred" banner with no recovery affordance.
 *
 * QA round Day 2 reported the bare "Application error" banner appearing on
 * the deployed duopoly.hackathon.sev-2.com site after clicking demo dataset
 * cards on /start/pick-repo (E-6) and after the right "Build from scratch"
 * door on /start (E-5). The actual cause was downstream (the Dockerfile
 * NEXT_PUBLIC_API_URL=/api build-arg, fixed by Atlas in this same cycle;
 * plus follow-on cascade from any post-hydration throw), but the user-facing
 * symptom was identical to "the app exploded with no explanation".
 *
 * This boundary replaces the bare banner with:
 *   1. A calm Codeplex-voice apology that names the route + the error.
 *   2. Two recovery affordances: "try again" (calls `reset()` provided by
 *      Next.js to re-render the segment) + "back to entry" (hard navigate
 *      to /start which is always known-good).
 *   3. Optional message body of the error itself so panitia + audit can read
 *      it without opening DevTools.
 *
 * Honest claim (Lock 5): this boundary mitigates the SYMPTOM, not the root
 * cause. Each underlying error still deserves its own fix. The boundary
 * stops one transient crash from black-holing the entire demo.
 *
 * Lock 1 (no em dash): clean.
 * Lock 2 (no emoji): clean.
 */

import { useEffect } from "react";
import type { CSSProperties } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Surface for audit harness + dev console, but do not throw further.
    // eslint-disable-next-line no-console
    console.error("[hestia error boundary] caught unhandled render error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main style={pageStyle} role="alert" aria-live="assertive">
      <div style={kickerStyle}>codeplex chronicle . runtime fault</div>
      <h1 style={titleStyle}>
        Something inside the city{" "}
        <span style={{ color: "oklch(0.78 0.14 55)" }}>stumbled</span>.
      </h1>
      <p style={paragraphStyle}>
        A component on this route threw an exception during render. The five
        residents are unharmed. Try the segment again, or step back to the
        entry doors and pick a different path.
      </p>
      <div style={detailWrapStyle}>
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
          try this view again
        </button>
        <a href="/start" style={ghostLinkStyle}>
          back to entry
        </a>
        <a href="/" style={ghostLinkStyle}>
          back to landing
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
