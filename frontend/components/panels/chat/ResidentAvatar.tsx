'use client';

/**
 * ResidentAvatar: 5 distinct geometric SVG portraits per resident.
 *
 * Authored by Persephone (Wave 2). Avatar shape maps to PRD Section 10
 * landmark geometry: temple / cross / surveillance tower / library stack /
 * glass beacon. The SVG is hand-drawn per resident to differentiate visually
 * at avatar scale (no generic ChatGPT-clone circle initials).
 *
 * Active state: codeplex-{resident} hue outer ring + 1.5x scale glow shadow.
 * Inactive: muted desaturated tone with subtle border.
 *
 * Anti-AI-slop: each avatar is a distinct geometric construction so the user
 * tells residents apart at thumbnail scale, NOT just by name label.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 */

import { cn } from '@/lib/utils';
import { RESIDENT_META, type ResidentId } from '@/lib/chat';

export interface ResidentAvatarProps {
  residentId: ResidentId;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  /** Show role + voice in hover tooltip; default false. */
  showTooltip?: boolean;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

/**
 * Per-shape SVG path constructions. Each shape conveys the landmark identity
 * at avatar scale without requiring text label.
 */
function ShapeSvg({
  shape,
  color,
  active,
}: {
  shape: 'temple' | 'cross' | 'tower' | 'stack' | 'beacon';
  color: string;
  active: boolean;
}) {
  const stroke = active ? color : 'rgba(255, 255, 255, 0.5)';
  const fill = active ? color : 'rgba(255, 255, 255, 0.18)';
  const opacity = active ? 1 : 0.65;

  switch (shape) {
    case 'temple':
      // Athena: 3 pillars + pediment + steps
      return (
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          aria-hidden
          style={{ opacity }}
        >
          <path
            d="M8 18 L24 8 L40 18 Z"
            stroke={stroke}
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="10" y="20" width="4" height="18" fill={fill} stroke={stroke} strokeWidth="1" />
          <rect x="22" y="20" width="4" height="18" fill={fill} stroke={stroke} strokeWidth="1" />
          <rect x="34" y="20" width="4" height="18" fill={fill} stroke={stroke} strokeWidth="1" />
          <rect x="6" y="38" width="36" height="3" fill={fill} stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case 'cross':
      // Apollo: medical cross
      return (
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          aria-hidden
          style={{ opacity }}
        >
          <path
            d="M20 8 H28 V20 H40 V28 H28 V40 H20 V28 H8 V20 H20 Z"
            stroke={stroke}
            fill={fill}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'tower':
      // Argus: surveillance tower with watching eye
      return (
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          aria-hidden
          style={{ opacity }}
        >
          <path
            d="M16 40 V18 L24 10 L32 18 V40 Z"
            stroke={stroke}
            fill={fill}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <ellipse cx="24" cy="24" rx="5" ry="3" fill={stroke} opacity={active ? 0.85 : 0.35} />
          <circle cx="24" cy="24" r="1.5" fill="rgba(0,0,0,0.8)" />
        </svg>
      );
    case 'stack':
      // Clio: stacked books / library shelves
      return (
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          aria-hidden
          style={{ opacity }}
        >
          <rect x="10" y="34" width="28" height="6" stroke={stroke} fill={fill} strokeWidth="1.2" />
          <rect x="12" y="24" width="24" height="8" stroke={stroke} fill={fill} strokeWidth="1.2" />
          <rect x="14" y="14" width="20" height="8" stroke={stroke} fill={fill} strokeWidth="1.2" />
          <rect x="16" y="6" width="16" height="6" stroke={stroke} fill={fill} strokeWidth="1.2" />
        </svg>
      );
    case 'beacon':
      // Hermes: glass cube beacon with light pulse
      return (
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          aria-hidden
          style={{ opacity }}
        >
          <path
            d="M14 38 L14 18 L24 10 L34 18 L34 38 Z"
            stroke={stroke}
            fill={fill}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="22" r="3" fill={stroke} opacity={active ? 0.95 : 0.4} />
          <line x1="24" y1="22" x2="24" y2="6" stroke={stroke} strokeWidth="1" opacity={active ? 0.6 : 0.25} />
        </svg>
      );
  }
}

export function ResidentAvatar({
  residentId,
  active = false,
  size = 'md',
  className,
  onClick,
  showTooltip = false,
}: ResidentAvatarProps) {
  const meta = RESIDENT_META[residentId];
  // Pull the hue from Tailwind palette via CSS variable resolution. We map
  // codeplex-{resident} to actual hex; could use Tailwind's color() function
  // but inline is simpler for SVG stroke + glow shadow.
  const hue: Record<ResidentId, string> = {
    Athena: '#c8b6ff',
    Apollo: '#ffd6a5',
    Argus: '#fdffb6',
    Clio: '#a0c4ff',
    Hermes: '#ffadad',
  };
  const color = hue[residentId];

  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-flex shrink-0 items-center justify-center rounded-full border bg-codeplex-void/70 p-0.5 transition-all',
        active
          ? 'border-white/35'
          : 'border-white/10 hover:border-white/25',
        sizeClasses[size],
        className
      )}
      style={
        active
          ? {
              boxShadow: `0 0 12px ${color}55, 0 0 0 2px ${color}40`,
            }
          : undefined
      }
      aria-label={`${meta.displayName}, ${meta.role}, ${meta.landmark}`}
      aria-pressed={active}
      data-resident-id={residentId}
    >
      <span className="inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full">
        <ShapeSvg shape={meta.avatarShape} color={color} active={active} />
      </span>
      {/* Glyph fallback dot in corner when active, for accessibility readers */}
      {active ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full border border-codeplex-void bg-codeplex-void font-mono text-[8px] font-bold"
          style={{ color }}
          aria-hidden
        >
          {meta.glyph}
        </span>
      ) : null}
    </button>
  );

  if (!showTooltip) return button;

  return (
    <span className="group/avatar relative inline-flex">
      {button}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 rounded-lg border border-white/15 bg-codeplex-void/95 p-2 text-left text-[10px] text-white/85 opacity-0 shadow-xl backdrop-blur transition-opacity group-hover/avatar:opacity-100"
      >
        <p className="font-mono uppercase tracking-wider" style={{ color }}>
          {meta.displayName}, {meta.role}
        </p>
        <p className="mt-0.5 text-white/65">{meta.landmark}</p>
        <p className="mt-1 leading-snug text-white/55">{meta.voiceTagline}</p>
        <p className="mt-1 font-mono text-[8px] text-white/40">{meta.modelMode}</p>
      </span>
    </span>
  );
}

ResidentAvatar.displayName = 'ResidentAvatar';
