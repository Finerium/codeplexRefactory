/**
 * BriefingHeader. 1-sentence templated briefing top of dashboard.
 *
 * Ported 1-to-1 from Designer bundle sections.jsx Briefing() function.
 * Voice: "Sprint 14 ships in 3 days. Velocity holding at 18 points. One drift
 * pattern triggered in the auth district."
 *
 * Visual: muted-indigo dot + Bricolage Grotesque 26px + italic Instrument Serif
 * inline emphasis on key spans + monospace meta line (repo + range + timestamp).
 */

import * as React from 'react';
import styles from '../../app/dashboard/dashboard.module.css';

export interface BriefingHeaderProps {
  briefing: string;
  repoLabel: string;
  rangeLabel: string;
  lastRefresh: string;
}

/**
 * Splits the briefing into nodes, italicizing spans matched by patterns the
 * Designer emphasized in `sections.jsx` (Briefing component) so the moveable
 * parts ("3 days", "auth district") render with serif italic. Falls back to
 * plain text if patterns do not match.
 */
function renderBriefing(text: string): React.ReactNode {
  const patterns: Array<RegExp> = [
    /(\d+ days?)/i,
    /(\w+ district)/i,
    /(\d+ point[s]?)/i,
  ];
  let nodes: React.ReactNode[] = [text];
  patterns.forEach((re, patternIdx) => {
    nodes = nodes.flatMap((node, nodeIdx): React.ReactNode[] => {
      if (typeof node !== 'string') return [node];
      const parts = node.split(re);
      return parts.map((part, partIdx): React.ReactNode =>
        part && re.test(part) ? (
          <em key={`em-${patternIdx}-${nodeIdx}-${partIdx}`}>{part}</em>
        ) : (
          part
        ),
      );
    });
  });
  return nodes;
}

function formatRefresh(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({
  briefing,
  repoLabel,
  rangeLabel,
  lastRefresh,
}) => (
  <section className={styles.briefing}>
    <span className={styles.briefingDot} aria-hidden />
    <div>
      <p>{renderBriefing(briefing)}</p>
      <div className={styles.briefingMeta}>
        {repoLabel} · {rangeLabel.toLowerCase()} · {formatRefresh(lastRefresh)}
      </div>
    </div>
  </section>
);
