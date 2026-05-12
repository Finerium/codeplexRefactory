'use client';

/**
 * CityPreviewCorner. Embedded city preview corner with Argus quiet companion.
 *
 * Ported 1-to-1 from Designer bundle:
 * - sections.jsx CityCard() (card frame, link, Argus icon corner)
 * - charts.jsx CityPreview() (static SVG district silhouettes + auth-district highlight)
 *
 * Decision D3 (see _meta/decision_log/selene.md): Wave 1 ships Designer's static
 * SVG silhouette rather than mounting Daedalus ChronicleCanvas inset. Rationale:
 * Designer chose SVG, FPS budget protected, decoupled from Daedalus build.
 * TODO(selene-cycle4-or-pan): swap SVG to ChronicleCanvas inset if Eunomia flags.
 *
 * Argus behavior: quiet companion, blinks via CSS keyframes (4s cycle), eye
 * tracks subtly NOT cursor-flee. Hover shows highlight ring per Designer
 * intent.md line 217-220.
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import { Icon } from './icons';
import type { CityPreviewMeta } from '@/lib/dashboard/types';

export interface CityPreviewCornerProps {
  meta: CityPreviewMeta;
  /** Optional handler when user clicks the "Open city view" link. */
  onOpenCity?: () => void;
}

function relativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hr ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} day ago`;
  } catch {
    return 'recently';
  }
}

/**
 * Static city silhouette. Designer-authored block plan with auth-district
 * highlighted to match the spec drift Pattern E firing site.
 */
const CitySilhouette: React.FC<{ flaggedDistrict: string | null }> = ({
  flaggedDistrict,
}) => {
  const authFlagged = flaggedDistrict === 'auth';
  return (
    <svg
      viewBox="0 0 320 260"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden
    >
      <defs>
        <pattern id="dashboardCityFloor" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 0H14M0 0V14" stroke="var(--hairline)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="260" fill="url(#dashboardCityFloor)" />
      {/* district blocks (silhouettes only) */}
      <g
        fill="var(--muted-2)"
        fillOpacity="0.42"
        stroke="var(--ink-2)"
        strokeOpacity="0.18"
        strokeWidth="0.7"
      >
        {/* core */}
        <rect x="32" y="120" width="40" height="80" />
        <rect x="78" y="100" width="28" height="100" />
        <rect x="112" y="130" width="34" height="70" />
        {/* observability */}
        <rect x="155" y="150" width="22" height="50" />
        <rect x="182" y="138" width="26" height="62" />
        {/* spatial */}
        <rect x="215" y="120" width="34" height="80" />
        <rect x="255" y="145" width="26" height="55" />
        {/* opsx */}
        <rect x="35" y="80" width="20" height="38" />
        <rect x="60" y="65" width="18" height="53" />
      </g>
      {/* auth district highlighted (Pattern E fired here) */}
      {authFlagged && (
        <g>
          <rect
            x="148"
            y="80"
            width="42"
            height="60"
            fill="var(--sev-bg-5)"
            stroke="var(--sev-5)"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
          <rect
            x="195"
            y="92"
            width="14"
            height="48"
            fill="var(--sev-bg-5)"
            stroke="var(--sev-5)"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <text
            x="169"
            y="74"
            textAnchor="middle"
            fill="var(--ink-2)"
            fontFamily="var(--font-mono)"
            fontSize={9}
            letterSpacing="0.08em"
          >
            AUTH · DRIFT
          </text>
        </g>
      )}
      {/* horizon line */}
      <line x1="0" y1="200" x2="320" y2="200" stroke="var(--hairline-strong)" strokeWidth="1" />
    </svg>
  );
};

/**
 * Argus icon with subtle blinking eye. Reduced-motion respected via CSS.
 */
const ArgusWatcher: React.FC = () => (
  <div
    className={styles.argus}
    title="Argus, the watcher"
    aria-label="Argus, the watcher resident"
    role="img"
  >
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
      <path
        d="M10 2.5 17.5 16h-15L10 2.5z"
        fill="currentColor"
      />
      <ellipse
        cx="10"
        cy="11.5"
        rx="1.6"
        ry="1.6"
        fill="var(--bg)"
        className={styles.argusEye}
      />
    </svg>
  </div>
);

export const CityPreviewCorner: React.FC<CityPreviewCornerProps> = ({
  meta,
  onOpenCity,
}) => (
  <div className={`${styles.card} ${styles.cityCard}`}>
    <div className={styles.cardHd}>
      <div>
        <h3>City preview</h3>
        <div className={styles.cardSub}>
          {meta.districtCount} districts
          {meta.flaggedDistrict ? ` · ${meta.flaggedDistrict} flagged` : ''}
        </div>
      </div>
    </div>
    <div className={styles.cardBody}>
      <div className={styles.city}>
        <CitySilhouette flaggedDistrict={meta.flaggedDistrict} />
        <a
          className={styles.cityLink}
          href={`/city?repo=${encodeURIComponent(meta.repoSlug)}`}
          onClick={(e) => {
            if (onOpenCity) {
              e.preventDefault();
              onOpenCity();
            }
          }}
        >
          Open city view
          <Icon name="arrow-right" size={12} />
        </a>
        <ArgusWatcher />
      </div>
      <div className={styles.cityMeta}>
        <span>Last build · {relativeTime(meta.lastBuildAt)}</span>
        <span>{meta.citizenCount.toLocaleString('en-US')} citizens</span>
      </div>
    </div>
  </div>
);
