'use client';

/**
 * TimeRangeSelector. Segmented control for "Today | This sprint | This quarter".
 *
 * Ported 1-to-1 from Designer bundle sections.jsx TopBar() segmented control.
 * Selected segment renders with ink background + bg text (high contrast).
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';
import type { TimeRangeOption } from '@/lib/dashboard/types';

export const TIME_RANGES: TimeRangeOption[] = [
  { id: 'today', label: 'Today' },
  { id: 'sprint', label: 'This sprint' },
  { id: 'quarter', label: 'This quarter' },
];

export interface TimeRangeSelectorProps {
  active: TimeRangeOption;
  onChange: (range: TimeRangeOption) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  active,
  onChange,
}) => (
  <div className={styles.seg} role="tablist" aria-label="Time range">
    {TIME_RANGES.map((r) => (
      <button
        key={r.id}
        type="button"
        role="tab"
        aria-pressed={r.id === active.id}
        aria-selected={r.id === active.id}
        onClick={() => onChange(r)}
      >
        {r.label}
      </button>
    ))}
  </div>
);
