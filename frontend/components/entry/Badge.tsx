import type { CSSProperties, ReactNode } from "react";

// Hestia Wave 1: badge primitive ported from bundle entry-app.jsx Badge. Used
// for the v0.3 prototype indicator in the header + similar inline tone chips.

type BadgeTone = "brass" | "ember" | "cool";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  style?: CSSProperties;
}

const PALETTES: Record<BadgeTone, { bg: string; bd: string; fg: string }> = {
  brass: {
    bg: "rgba(214,170,90,0.08)",
    bd: "rgba(214,170,90,0.32)",
    fg: "oklch(0.82 0.11 82)",
  },
  ember: {
    bg: "rgba(230,120,60,0.08)",
    bd: "rgba(230,120,60,0.32)",
    fg: "oklch(0.78 0.14 55)",
  },
  cool: {
    bg: "rgba(120,150,200,0.06)",
    bd: "rgba(120,150,200,0.24)",
    fg: "oklch(0.72 0.05 235)",
  },
};

export function Badge({ children, tone = "brass", style }: BadgeProps) {
  const palette = PALETTES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 9px 4px 8px",
        borderRadius: 999,
        border: `1px solid ${palette.bd}`,
        background: palette.bg,
        color: palette.fg,
        font: "500 11px/1 'JetBrains Mono', monospace",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 5,
          height: 5,
          borderRadius: 999,
          background: palette.fg,
          boxShadow: `0 0 8px ${palette.fg}`,
        }}
      />
      {children}
    </span>
  );
}
