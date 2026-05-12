"use client";

import { WindowCard, type WindowSide } from "./WindowCard";
import { MiniCity } from "./MiniCity";
import { EmptyLot } from "./EmptyLot";
import type { EntryMotion } from "./tweak-defaults";

// Hestia Wave 1: two-window stage. Visitor picks left (Import) or right (Build)
// and the casement panels swing open. The center pillar still reads "CHOOSE .
// ONE" rotated vertical.
//
// Revision 1 (no pets): bundle Stage previously hosted a floating Hermes blob
// with cursor-flee behavior between the two windows. The useHermes hook, the
// HermesBlob SVG, and the "hermes . pick a door" speech tag are all removed.
// The center column now reads cleanly as architectural negative space.

interface StageProps {
  selected: WindowSide;
  setSelected: (side: WindowSide) => void;
  onSelect: (side: WindowSide) => void;
  opening: WindowSide | null;
  doorStrength: number;
  motion: EntryMotion;
  warmth: number;
}

export function Stage({
  selected,
  setSelected,
  onSelect,
  opening,
  doorStrength,
  motion,
  warmth,
}: StageProps) {
  return (
    <section
      style={{
        position: "relative",
        padding: "10px 44px 14px",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 60px 1fr",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <WindowCard
            side="left"
            kicker="01 . existing city"
            scene={<MiniCity motion={motion} warmth={warmth} />}
            title="Import a repository"
            body="Authorize with GitHub. Pick a repo. We render the city, every module a building, every commit a footprint."
            ctaLabel={
              <>
                Connect GitHub <span style={{ marginLeft: 4 }}>{"→"}</span>
              </>
            }
            hint="enter"
            focused={selected === "left"}
            onFocus={() => setSelected("left")}
            onSelect={() => onSelect("left")}
            doorStrength={doorStrength}
            opening={opening === "left"}
            disabled={opening !== null}
          />
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <div
            style={{
              position: "absolute",
              top: 24,
              bottom: 24,
              left: "50%",
              width: 1.5,
              transform: "translateX(-50%)",
              background:
                "linear-gradient(180deg, transparent, var(--rule-hi) 20%, var(--rule-hi) 80%, transparent)",
            }}
          />
          <span
            className="entry-micro"
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%) rotate(-90deg)",
              color: "var(--faint)",
              letterSpacing: "0.3em",
              whiteSpace: "nowrap",
            }}
          >
            CHOOSE . ONE
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <WindowCard
            side="right"
            kicker="02 . blank lot"
            scene={<EmptyLot motion={motion} warmth={warmth} />}
            title="Build from scratch"
            body="Start with an empty lot. We render as you code, buildings rise in-memory, no remote, no commits."
            ctaLabel={
              <>
                Open a blank city <span style={{ marginLeft: 4 }}>{"→"}</span>
              </>
            }
            hint="enter"
            focused={selected === "right"}
            onFocus={() => setSelected("right")}
            onSelect={() => onSelect("right")}
            doorStrength={doorStrength}
            opening={opening === "right"}
            disabled={opening !== null}
          />
        </div>
      </div>

      {opening !== null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          role="status"
          aria-live="polite"
        >
          <div
            style={{
              transform: "translateY(-30px)",
              padding: "10px 18px",
              background: "rgba(20,14,8,0.86)",
              border: "1px solid oklch(0.78 0.14 55 / 0.45)",
              borderRadius: 999,
              font: "500 12px/1 'JetBrains Mono', monospace",
              color: "oklch(0.92 0.06 75)",
              letterSpacing: "0.08em",
              animation: "cs-pulse 1.4s ease-in-out infinite",
            }}
          >
            {opening === "left"
              ? "stepping into your codebase . "
              : "breaking ground on a blank lot . "}
            <span style={{ color: "oklch(0.78 0.14 55)" }}>entering city view...</span>
          </div>
        </div>
      )}
    </section>
  );
}
