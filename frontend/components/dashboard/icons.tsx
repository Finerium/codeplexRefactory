/**
 * Inline SVG icon set ported 1-to-1 from Designer bundle
 * `_meta/designer/prompt3-dashboard/handoff-bundle-extracted/dashboard/project/icons.jsx`.
 *
 * Stroke-based, currentColor, 16px default. Single component dispatches by `name`.
 */

import * as React from 'react';

export type IconName =
  | 'chev-down'
  | 'chev-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-flat'
  | 'arrow-right'
  | 'spark'
  | 'github'
  | 'check'
  | 'eye'
  | 'cube'
  | 'argus'
  | 'search'
  | 'close'
  | 'refresh'
  | 'download';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, ...rest }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };
  switch (name) {
    case 'chev-down':
      return (
        <svg {...common}>
          <path d="M4 6l4 4 4-4" />
        </svg>
      );
    case 'chev-right':
      return (
        <svg {...common}>
          <path d="M6 4l4 4-4 4" />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg {...common}>
          <path d="M8 13V3M4 7l4-4 4 4" />
        </svg>
      );
    case 'arrow-down':
      return (
        <svg {...common}>
          <path d="M8 3v10M4 9l4 4 4-4" />
        </svg>
      );
    case 'arrow-flat':
      return (
        <svg {...common}>
          <path d="M3 8h10M11 5l3 3-3 3" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M2 11l3-4 3 2 3-5 3 3" />
        </svg>
      );
    case 'github':
      return (
        <svg {...common} stroke="none" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8 1.3a6.7 6.7 0 0 0-2.12 13.06c.34.06.46-.15.46-.32v-1.1c-1.86.4-2.25-.9-2.25-.9-.3-.78-.74-.98-.74-.98-.6-.42.05-.4.05-.4.67.04 1.02.68 1.02.68.6 1.02 1.55.73 1.93.56.06-.44.23-.73.43-.9-1.5-.17-3.07-.74-3.07-3.3 0-.73.26-1.32.68-1.79-.07-.16-.3-.84.06-1.75 0 0 .56-.18 1.83.68a6.4 6.4 0 0 1 3.34 0c1.26-.86 1.82-.68 1.82-.68.36.91.13 1.59.06 1.75.43.47.68 1.06.68 1.79 0 2.57-1.57 3.13-3.07 3.3.24.2.45.6.45 1.22v1.82c0 .17.12.39.46.32A6.7 6.7 0 0 0 8 1.3z"
          />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M3 8l3 3 7-7" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
          <circle cx="8" cy="8" r="2" />
        </svg>
      );
    case 'cube':
      return (
        <svg {...common}>
          <path d="M8 1.8 2 4.6v6.8L8 14.2l6-2.8V4.6L8 1.8z" />
          <path d="M2 4.6 8 7.4l6-2.8M8 7.4v6.8" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M13 4a5.5 5.5 0 1 0 1.5 5" />
          <path d="M13 1.5V4.5h-3" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M8 2v8" />
          <path d="M4.5 7L8 10.5 11.5 7" />
          <path d="M3 13h10" />
        </svg>
      );
    case 'argus':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          {...rest}
        >
          <path d="M10 2.5 17.5 16h-15L10 2.5z" />
          <circle cx="10" cy="11.5" r="1.6" fill="var(--bg, #FCFCFB)" />
        </svg>
      );
    default:
      return null;
  }
};
