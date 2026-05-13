"use client";

/**
 * DemoSourceBanner: honest disclosure of which dataset is rendering.
 *
 * Hestia Wave-Fixing Final (manager cycle 3, E-6 RECURRING fix).
 *
 * Background: /start/pick-repo gives the user three demo dataset cards
 * (NodeGoat, fastapi-template, PyGoat) that navigate to
 * `/city?demo=<key>&mock_auth=true`. The current city render in
 * `frontend/src/scene/buildings/` is the Iris Wave 1 singleton
 * `mockCityData` modeled after fastapi/full-stack-fastapi-template (per the
 * file header). All three demo keys silently render the same mock data.
 *
 * Hestia cannot swap the underlying singleton without crossing file
 * ownership boundaries (`src/scene/buildings/*` is Iris/Demeter territory).
 * What Hestia CAN do, per Lock 5 honest claim discipline, is mount a
 * top-of-screen banner that names:
 *   1. The requested dataset key (from `?demo=<key>` or `?repo=<full_name>`).
 *   2. The actual dataset currently rendering (the Wave 1 fastapi-style
 *      mock, ~240 buildings, 7 districts).
 *   3. The Wave 3 plan (Demeter materializes per-repo data via WebSocket).
 *
 * This converts the previous "silently wrong" failure mode into a "labeled
 * placeholder" mode that matches the PRD Section 14.1 R3 Pure Seed
 * strategy + the demo dataset triplet plan.
 *
 * The banner also handles the URL-paste path: when a user pastes a real
 * GitHub owner/name and clicks "Render this repo", the picker navigates to
 * `/city?repo=<full_name>`. The banner shows the repo name + the same
 * honest placeholder disclosure plus a hint about the PRD 50-300 file
 * sweet spot (the Wave 3 backend will reject repos outside this range per
 * PRD Section line 1534).
 *
 * Honest claim (Lock 5): the banner does NOT pretend each demo key is
 * rendering its real data. It labels what is rendered. Wave 3 Demeter
 * replaces the singleton with per-repo materialized data and the banner
 * copy auto-narrows.
 *
 * Lock 1 (no em dash): clean.
 * Lock 2 (no emoji): clean.
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type DemoKey = "nodegoat" | "fastapi-template" | "pygoat";

const DEMO_LABELS: Record<DemoKey, string> = {
  nodegoat: "OWASP NodeGoat",
  "fastapi-template": "fastapi/full-stack-fastapi-template",
  pygoat: "OWASP PyGoat",
};

interface BannerState {
  variant: "demo" | "repo" | "default" | null;
  requestedLabel: string;
  requestedKey: string;
}

function parseQuery(): BannerState {
  if (typeof window === "undefined") {
    return { variant: null, requestedLabel: "", requestedKey: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");
  const repo = params.get("repo");
  if (demo) {
    const key = demo as DemoKey;
    return {
      variant: "demo",
      requestedKey: demo,
      requestedLabel: DEMO_LABELS[key] ?? demo,
    };
  }
  if (repo) {
    return {
      variant: "repo",
      requestedKey: repo,
      requestedLabel: repo,
    };
  }
  // Default mount: no query, show nothing (the dashboard / city default
  // mock is already the visible affordance, no banner needed).
  return { variant: null, requestedKey: "", requestedLabel: "" };
}

export function DemoSourceBanner() {
  // Render nothing on SSR pass to avoid hydration mismatch with
  // window.location dependence.
  const [state, setState] = useState<BannerState>({
    variant: null,
    requestedKey: "",
    requestedLabel: "",
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setState(parseQuery());
  }, []);

  if (state.variant === null || dismissed) return null;

  const headline =
    state.variant === "demo"
      ? `Demo dataset: ${state.requestedLabel}`
      : `Repository: ${state.requestedLabel}`;

  const body =
    state.variant === "demo"
      ? "All three demo cards currently render the same Wave 1 reference city, a ~240-building fastapi-style mock layout. The per-dataset parser swap lands in Wave 3 via the Demeter event store. Five residents still work, every mode still demonstrates."
      : "The repository URL is captured. The Wave 1 city render is the reference fastapi-style mock; the real per-repo materialization lands in Wave 3 via the Demeter parser + event store. The 50 to 300 file demo sweet spot per PRD Section 14.1 is enforced server-side when the backend is wired.";

  return (
    <aside
      role="status"
      aria-live="polite"
      style={wrapStyle}
      data-testid="hestia-demo-source-banner"
    >
      <div style={leftColumnStyle}>
        <span style={kickerStyle}>data source</span>
        <span style={headlineStyle}>{headline}</span>
      </div>
      <p style={bodyStyle}>{body}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={dismissButtonStyle}
        aria-label="Dismiss data source banner"
      >
        dismiss
      </button>
    </aside>
  );
}

const wrapStyle: CSSProperties = {
  position: "fixed",
  top: 12,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 40,
  maxWidth: 720,
  width: "calc(100vw - 32px)",
  display: "grid",
  gridTemplateColumns: "minmax(180px, max-content) 1fr max-content",
  alignItems: "start",
  gap: "8px 18px",
  padding: "12px 16px",
  background: "oklch(0.16 0.02 60 / 0.92)",
  border: "1px solid oklch(0.55 0.12 50 / 0.45)",
  borderRadius: 10,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  color: "oklch(0.96 0.015 80)",
  fontFamily:
    "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
};

const leftColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
};

const kickerStyle: CSSProperties = {
  font: "500 10px/1.2 'JetBrains Mono', monospace",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "oklch(0.78 0.14 55)",
};

const headlineStyle: CSSProperties = {
  font: "500 13px/1.3 'Space Grotesk', sans-serif",
  color: "oklch(0.96 0.015 80)",
  wordBreak: "break-word",
};

const bodyStyle: CSSProperties = {
  margin: 0,
  font: "400 12px/1.55 'JetBrains Mono', monospace",
  color: "oklch(0.78 0.04 75)",
};

const dismissButtonStyle: CSSProperties = {
  appearance: "none",
  cursor: "pointer",
  background: "transparent",
  border: "1px solid oklch(0.3 0.04 60 / 0.5)",
  borderRadius: 6,
  padding: "6px 10px",
  color: "oklch(0.85 0.04 75)",
  font: "500 11px/1 'JetBrains Mono', monospace",
  alignSelf: "start",
  whiteSpace: "nowrap",
};
