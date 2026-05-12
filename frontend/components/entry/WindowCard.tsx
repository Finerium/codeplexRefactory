"use client";

import type { CSSProperties, ReactNode } from "react";

// Hestia Wave 1: a single casement window card. The visitor picks one of two
// (Import or Build) and the doors swing open into the scene behind the glass.
// Ported from bundle entry-app.jsx WindowCard. No creature element inside;
// Revision 1 removed Hermes from the page entirely.

export type WindowSide = "left" | "right";

interface WindowCardProps {
  side: WindowSide;
  scene: ReactNode;
  kicker: string;
  title: string;
  body: string;
  ctaLabel: ReactNode;
  hint: string;
  focused: boolean;
  onFocus: () => void;
  onSelect: () => void;
  /** 0..100, modulates frame width + mullion intensity. */
  doorStrength: number;
  /** True while the swing-open animation runs. */
  opening: boolean;
  /** Disable click (e.g. while another door is mid-swing). */
  disabled: boolean;
}

export function WindowCard({
  side,
  scene,
  kicker,
  title,
  body,
  ctaLabel,
  hint,
  focused,
  onFocus,
  onSelect,
  doorStrength,
  opening,
  disabled,
}: WindowCardProps) {
  const frameW = 8 + (doorStrength / 100) * 14;
  const mullionW = 1 + (doorStrength / 100) * 3.5;
  const mullionOpacity = 0.35 + (doorStrength / 100) * 0.55;
  const hardwareVisible = doorStrength > 35;
  const cols = 3;
  const rows = 4;
  const colLines = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const rowLines = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);

  const buttonStyle: CSSProperties = {
    all: "unset",
    cursor: disabled ? "default" : "pointer",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: 460,
    transform: focused ? "translateY(-4px)" : "translateY(0)",
    transition: "transform 320ms cubic-bezier(.2,.7,.2,1), filter 320ms",
    filter: focused
      ? "drop-shadow(0 24px 40px rgba(0,0,0,0.5))"
      : "drop-shadow(0 8px 18px rgba(0,0,0,0.35))",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      style={buttonStyle}
      aria-label={title}
      aria-pressed={focused}
      disabled={disabled && !opening}
      className="entry-focusable"
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "4 / 5",
          background: "var(--frame)",
          borderRadius: 3,
          padding: frameW,
          border: "1px solid var(--frame-edge)",
          boxShadow: focused
            ? "inset 0 0 0 1px rgba(255,200,120,0.18), 0 0 0 1px rgba(255,200,120,0.12), 0 0 40px -8px rgba(230,140,60,0.4)"
            : "inset 0 0 0 1px rgba(255,200,120,0.05)",
          transition: "box-shadow 320ms",
        }}
      >
        {hardwareVisible && (
          <>
            {(
              [
                [6, 6],
                [null, 6],
                [6, null],
                [null, null],
              ] as Array<[number | null, number | null]>
            ).map(([l, t], i) => (
              <span
                key={`hw${i}`}
                style={{
                  position: "absolute",
                  left: l === 6 ? 6 : "auto",
                  right: l === null ? 6 : "auto",
                  top: t === 6 ? 6 : "auto",
                  bottom: t === null ? 6 : "auto",
                  width: 10,
                  height: 10,
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.12 82), oklch(0.5 0.08 70))",
                  borderRadius: 1.5,
                  opacity: 0.7,
                }}
              />
            ))}
          </>
        )}

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "oklch(0.1 0.02 40)",
            borderRadius: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: opening ? "scale(1.04)" : "scale(1)",
              filter: opening ? "brightness(1.15) saturate(1.1)" : "brightness(1) saturate(1)",
              transition:
                "transform 900ms cubic-bezier(.2,.7,.2,1), filter 900ms",
            }}
          >
            {scene}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(115deg, rgba(255,240,210,0.07) 0%, rgba(255,240,210,0) 38%, rgba(255,240,210,0) 62%, rgba(255,240,210,0.05) 100%)",
              mixBlendMode: "screen",
            }}
          />

          {rowLines.map((p, i) => (
            <div
              key={`mh${i}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${p}%`,
                height: mullionW,
                background: "var(--frame)",
                boxShadow:
                  "0 1px 0 rgba(0,0,0,0.4), 0 -1px 0 rgba(255,200,140,0.05)",
                opacity: mullionOpacity,
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          ))}
          {colLines.map((p, i) => {
            const isCenter =
              colLines.length > 1 ? i === Math.floor(colLines.length / 2) : true;
            return (
              <div
                key={`mv${i}`}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${p}%`,
                  width: mullionW,
                  background: "var(--frame)",
                  boxShadow:
                    "1px 0 0 rgba(0,0,0,0.4), -1px 0 0 rgba(255,200,140,0.05)",
                  opacity: mullionOpacity,
                  transform:
                    opening && isCenter
                      ? side === "left"
                        ? "translateX(-220%)"
                        : "translateX(220%)"
                      : "translateX(-50%)",
                  transition: "transform 900ms cubic-bezier(.4,.0,.2,1)",
                  pointerEvents: "none",
                }}
              />
            );
          })}

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(20,14,8,0.55), rgba(20,14,8,0.1))",
                transformOrigin: "left center",
                transform: opening
                  ? "perspective(900px) rotateY(-95deg)"
                  : "rotateY(0deg)",
                opacity: opening ? 1 : 0,
                transition:
                  "transform 900ms cubic-bezier(.4,.0,.2,1), opacity 240ms",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "50%",
                height: "100%",
                background:
                  "linear-gradient(270deg, rgba(20,14,8,0.55), rgba(20,14,8,0.1))",
                transformOrigin: "right center",
                transform: opening
                  ? "perspective(900px) rotateY(95deg)"
                  : "rotateY(0deg)",
                opacity: opening ? 1 : 0,
                transition:
                  "transform 900ms cubic-bezier(.4,.0,.2,1), opacity 240ms",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              font: "500 10px/1 'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              color: focused ? "oklch(0.92 0.05 80)" : "oklch(0.75 0.04 75)",
              textTransform: "uppercase",
              mixBlendMode: "screen",
              opacity: 0.85,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            {kicker}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          marginTop: -2,
          background:
            "linear-gradient(180deg, var(--sill), oklch(0.22 0.04 50))",
          borderTop: "1px solid var(--frame-edge)",
          borderLeft: "1px solid rgba(0,0,0,0.4)",
          borderRight: "1px solid rgba(0,0,0,0.4)",
          borderBottom: "1px solid rgba(0,0,0,0.6)",
          padding: "16px 18px 16px",
          boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: 6,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,220,170,0.16), transparent)",
          }}
        />
        <h2
          style={{
            margin: 0,
            font: "500 19px/1.2 'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "8px 0 14px",
            font: "400 13px/1.5 'JetBrains Mono', monospace",
            color: "var(--ink-soft)",
          }}
        >
          {body}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: focused
                ? "linear-gradient(180deg, oklch(0.78 0.16 60), oklch(0.55 0.16 45))"
                : "oklch(0.22 0.04 50)",
              color: focused ? "oklch(0.13 0.03 40)" : "var(--ink)",
              font: "600 13px/1 'Space Grotesk', sans-serif",
              letterSpacing: "0.01em",
              borderRadius: 6,
              border:
                "1px solid " + (focused ? "oklch(0.6 0.18 50)" : "var(--frame-edge)"),
              boxShadow: focused
                ? "0 4px 18px -4px oklch(0.6 0.18 50 / 0.6)"
                : "none",
              transition: "all 200ms",
            }}
          >
            {ctaLabel}
          </span>
          <span className="entry-micro" style={{ color: "var(--mute)" }}>
            {hint}
          </span>
        </div>
      </div>
    </button>
  );
}
