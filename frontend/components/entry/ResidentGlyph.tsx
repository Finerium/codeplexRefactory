import type { ResidentGlyphKind } from "./residents-data";

// Hestia Wave 1: small 32x32 SVG glyph for each resident card on the Entry
// footer. These represent the AI colleagues the visitor will meet inside the
// city, not creature mascots. Ported from bundle entry-app.jsx ResidentGlyph.

const STROKE = "oklch(0.78 0.13 80)";
const FILL = "oklch(0.18 0.03 50)";

interface ResidentGlyphProps {
  kind: ResidentGlyphKind;
}

export function ResidentGlyph({ kind }: ResidentGlyphProps) {
  switch (kind) {
    case "hall":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <path d="M6 32 L34 32" stroke={STROKE} strokeWidth="1.2" />
          <rect x="10" y="18" width="20" height="14" fill={FILL} stroke={STROKE} strokeWidth="0.8" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={`hall-col-${i}`}
              x={12 + i * 5}
              y={22}
              width={2}
              height={10}
              fill={STROKE}
              opacity={0.7}
            />
          ))}
          <path d="M10 18 Q20 8 30 18 Z" fill="none" stroke={STROKE} strokeWidth="1" />
          <circle cx="20" cy="13" r="1.6" fill={STROKE} />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <rect x="11" y="14" width="18" height="18" fill={FILL} stroke={STROKE} strokeWidth="0.8" />
          <rect x="17.5" y="18" width="5" height="11" fill={STROKE} opacity={0.85} />
          <rect x="14" y="21.5" width="12" height="4" fill={STROKE} opacity={0.85} />
          <circle cx="20" cy="10" r="1" fill={STROKE} />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <rect x="10" y="14" width="20" height="18" fill={FILL} stroke={STROKE} strokeWidth="0.8" />
          <line x1="20" y1="14" x2="20" y2="6" stroke={STROKE} strokeWidth="0.8" />
          <circle cx="20" cy="5" r="1.4" fill={STROKE} />
          <path d="M15 22 Q20 18 25 22 Q20 26 15 22 Z" fill="none" stroke={STROKE} strokeWidth="0.9" />
          <circle cx="20" cy="22" r="1.6" fill={STROKE} />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <rect x="9" y="16" width="22" height="16" fill={FILL} stroke={STROKE} strokeWidth="0.8" />
          <polygon points="9,16 31,16 27,12 13,12" fill={FILL} stroke={STROKE} strokeWidth="0.8" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={`book-bar-${i}`}
              x={11 + i * 3.2}
              y={18}
              width={2}
              height={12}
              fill={STROKE}
              opacity={0.7}
            />
          ))}
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 40 40" width="32" height="32">
          <polygon
            points="8,20 32,20 30,16 10,16"
            fill="oklch(0.55 0.13 45)"
            stroke={STROKE}
            strokeWidth="0.6"
          />
          <rect x="11" y="20" width="18" height="12" fill={FILL} stroke={STROKE} strokeWidth="0.8" />
          <rect x="14" y="23" width="12" height="6" fill={STROKE} opacity={0.5} />
          <circle cx="32" cy="13" r="2.2" fill="oklch(0.85 0.12 80)" />
          <text
            x="32"
            y="14.5"
            textAnchor="middle"
            fontFamily="JetBrains Mono"
            fontSize="3"
            fontWeight="700"
            fill="oklch(0.18 0.03 40)"
          >
            i
          </text>
        </svg>
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
