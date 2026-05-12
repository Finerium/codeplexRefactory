"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { Header } from "./Header";
import { Hero } from "./Hero";
import { Stage } from "./Stage";
import { Residents } from "./Residents";
import { Footer } from "./Footer";
import { PrivacyNotice } from "./PrivacyNotice";
import { KeyboardHints } from "./KeyboardHints";
import type { WindowSide } from "./WindowCard";
import { TWEAK_DEFAULTS } from "./tweak-defaults";

// Hestia Wave 1: top-level client composition for the Entry page.
//
// Revision 1 (no pets): the bundle root previously rendered a floating Hermes
// shy creature in Stage, mounted a useHermes flee hook, and exposed a Shyness
// slider in the Tweaks panel. All three are removed entry-wide. The 5 resident
// persona cards in the footer are a different concern and stay intact.
//
// Revision 2 (most animated background): TWEAK_DEFAULTS.motion is now
// "animated-city" rather than "breathing". The bundle's Tweaks panel was a
// host-side claude.ai/design ergonomic and is not ported into the production
// Next.js page (Eunomia audit non-goal), so the default is now baked.
//
// OAuth handoff: the left "Connect GitHub" CTA navigates to
// /api/auth/github/start?stub=true which Hestia stubs at a Next.js Route
// Handler returning 302 to /city?mock_auth=true. Wave 3 Hades replaces the
// stub with the real OAuth start flow. Contract: hestia-to-hades.md.

const OPEN_ANIMATION_MS = 2200;
const IMPORT_REPO_TARGET = "/api/auth/github/start?stub=true";
const BLANK_CITY_TARGET = "/blank";

export function EntryApp() {
  const [warmth] = useState<number>(TWEAK_DEFAULTS.warmth);
  const [doorStrength] = useState<number>(TWEAK_DEFAULTS.doorStrength);
  const [motion] = useState(TWEAK_DEFAULTS.motion);
  const [selected, setSelected] = useState<WindowSide>("left");
  const [opening, setOpening] = useState<WindowSide | null>(null);

  const onSelect = useCallback(
    (side: WindowSide) => {
      if (opening !== null) return;
      setSelected(side);
      setOpening(side);

      // After the casement panels finish swinging, navigate to the Wave 1
      // target. Left = OAuth stub redirect chain (Hestia/Hades handoff).
      // Right = blank city placeholder (Wave 3 may keep stub per PRD AD-15).
      window.setTimeout(() => {
        const target = side === "left" ? IMPORT_REPO_TARGET : BLANK_CITY_TARGET;
        window.location.href = target;
      }, OPEN_ANIMATION_MS);
    },
    [opening],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (opening !== null) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelected("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelected("right");
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(selected);
      } else if (e.key === "Escape") {
        e.preventDefault();
        window.location.href = "/";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, opening, onSelect]);

  // Ambient warmth tints the room background. Held constant in Wave 1 (Tweaks
  // panel host removed) but preserved as a styled signal for future control.
  const warmthStyle = useMemo<CSSProperties>(() => {
    const k = (warmth - 50) / 50;
    const hue = 55 + k * 12;
    const chroma = 0.018 + k * 0.014;
    const baseChroma = Math.max(0.005, chroma);
    const roomChroma = Math.max(0.008, chroma + 0.007);
    const vars: Record<string, string> = {
      "--bg-deep": `oklch(${0.115 + k * 0.005} ${baseChroma} ${hue})`,
      "--bg-room": `oklch(${0.16 + k * 0.005} ${roomChroma} ${hue + 5})`,
      "--wood": `oklch(${0.205 + k * 0.01} ${0.04 + k * 0.01} ${hue - 5})`,
    };
    return vars as CSSProperties;
  }, [warmth]);

  return (
    <div className="room" style={warmthStyle}>
      <Header />
      <Hero />
      <Stage
        selected={selected}
        setSelected={setSelected}
        onSelect={onSelect}
        opening={opening}
        doorStrength={doorStrength}
        motion={motion}
        warmth={warmth}
      />
      <KeyboardHints />
      <PrivacyNotice />
      <Residents />
      <Footer />
    </div>
  );
}
