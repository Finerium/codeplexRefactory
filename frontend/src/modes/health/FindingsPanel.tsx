'use client';

/**
 * FindingsPanel: list of Apollo findings with severity-sorted ordering,
 * filter chips, and click-to-select-evidence interaction.
 *
 * Owner: Asclepius (Wave 2).
 * Contract: `_meta/contracts/asclepius-to-triton.md` Validation steps
 *   "Apollo findings panel UI list filterable by severity + category. Click
 *    finding sets selectedFindingId; side panel mode 'health' renders
 *    evidence detail."
 *
 * Visual + voice (Apollo doctor persona warm + clinical):
 *   - Severity-sorted (critical first, info last). Within same severity,
 *     newest detection first.
 *   - Filter chips for severity + category. Click chip to toggle.
 *   - Each row shows severity dot, title, file path, line range. Click row
 *     sets selectedFindingId; the EvidencePanel reads + renders.
 *   - Header carries total + critical + high counts so the user has a
 *     glance state independent of which finding is selected.
 *
 * Mount target: Persephone side panel slot at `@side/default.tsx` (mode
 * 'health'). Wave 2 mounts via smoke route until Persephone ships the
 * mode-routed side panel. Persephone consumes via barrel
 * `import { FindingsPanel } from '@/modes/health'`.
 *
 * Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 4 (severity
 * palette canonical, no remap).
 */

import { useMemo } from 'react';
import {
  selectApolloFilter,
  selectApolloFindings,
  selectSelectedFinding,
  useAsclepiusStore,
} from './asclepiusStore';
import type { ApolloFinding, FindingCategory, Severity } from './types';
import {
  CATEGORY_LABEL,
  SEVERITY_PALETTE,
  SEVERITY_RANK,
} from './types';

const ALL_SEVERITIES: Severity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

const ALL_CATEGORIES: FindingCategory[] = [
  'hardcoded-secret',
  'outdated-dependency',
  'missing-auth',
  'unsafe-sql',
  'complex-untested',
];

interface FindingsPanelProps {
  /** Optional title override. Default "Apollo Findings". */
  title?: string;
  /** Optional max height in px. Default 360. */
  maxHeight?: number;
}

function severityChipClass(active: boolean): string {
  // Active chip styling (border + text color) is applied inline via the
  // SEVERITY_PALETTE entry; the class string here covers layout + the
  // inactive look.
  if (active) {
    return `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider`;
  }
  return `inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white/50`;
}

export function FindingsPanel({
  title = 'Apollo Findings',
  maxHeight = 360,
}: FindingsPanelProps) {
  const findings = useAsclepiusStore(selectApolloFindings);
  const filter = useAsclepiusStore(selectApolloFilter);
  const selected = useAsclepiusStore(selectSelectedFinding);
  const selectFinding = useAsclepiusStore((s) => s.selectFinding);
  const applyFilter = useAsclepiusStore((s) => s.applyFilter);

  const openFindings = useMemo(() => {
    return Object.values(findings).filter((f) => f.status === 'open');
  }, [findings]);

  const filtered = useMemo(() => {
    return openFindings
      .filter((f) => filter.severity.includes(f.severity))
      .filter((f) => filter.category.includes(f.category))
      .sort((a, b) => {
        const rank = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
        if (rank !== 0) return rank;
        return b.detectedAt.localeCompare(a.detectedAt);
      });
  }, [openFindings, filter]);

  const counts = useMemo(() => {
    let critical = 0;
    let high = 0;
    for (const f of openFindings) {
      if (f.severity === 'critical') critical += 1;
      if (f.severity === 'high') high += 1;
    }
    return { total: openFindings.length, critical, high };
  }, [openFindings]);

  const toggleSeverity = (severity: Severity) => {
    if (filter.severity.includes(severity)) {
      applyFilter({ severity: filter.severity.filter((s) => s !== severity) });
    } else {
      applyFilter({ severity: [...filter.severity, severity] });
    }
  };

  const toggleCategory = (category: FindingCategory) => {
    if (filter.category.includes(category)) {
      applyFilter({ category: filter.category.filter((c) => c !== category) });
    } else {
      applyFilter({ category: [...filter.category, category] });
    }
  };

  return (
    <div
      className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/10 bg-codeplex-shadow/85 p-4 text-xs text-white/80 backdrop-blur-glass"
      data-asclepius-panel="findings"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-codeplex-ember">
            Apollo, Hospital
          </p>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <p className="text-right text-[10px] text-white/60">
          {counts.total} findings, {counts.critical} critical, {counts.high} high
        </p>
      </header>

      <section className="flex flex-wrap gap-1.5" aria-label="Severity filter">
        {ALL_SEVERITIES.map((severity) => {
          const active = filter.severity.includes(severity);
          return (
            <button
              key={severity}
              type="button"
              onClick={() => toggleSeverity(severity)}
              className={severityChipClass(active)}
              style={
                active
                  ? {
                      borderColor: SEVERITY_PALETTE[severity],
                      color: SEVERITY_PALETTE[severity],
                    }
                  : undefined
              }
              aria-pressed={active}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: SEVERITY_PALETTE[severity] }}
              />
              {severity}
            </button>
          );
        })}
      </section>

      <section className="flex flex-wrap gap-1.5" aria-label="Category filter">
        {ALL_CATEGORIES.map((category) => {
          const active = filter.category.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono lowercase tracking-wide ${
                active
                  ? 'border-white/40 text-white/85'
                  : 'border-white/10 text-white/40'
              }`}
              aria-pressed={active}
            >
              {CATEGORY_LABEL[category]}
            </button>
          );
        })}
      </section>

      <ul
        className="flex flex-col gap-2 overflow-y-auto pr-1"
        style={{ maxHeight }}
        aria-label="Findings list"
      >
        {filtered.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/15 p-3 text-center text-[11px] text-white/40">
            No findings match the active filter.
          </li>
        ) : (
          filtered.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              selected={selected?.id === finding.id}
              onClick={() => selectFinding(finding.id)}
            />
          ))
        )}
      </ul>
    </div>
  );
}

FindingsPanel.displayName = 'FindingsPanel';

interface FindingRowProps {
  finding: ApolloFinding;
  selected: boolean;
  onClick: () => void;
}

function FindingRow({ finding, selected, onClick }: FindingRowProps) {
  const color = SEVERITY_PALETTE[finding.severity];
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full flex-col gap-1 rounded-lg border bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06] ${
          selected ? 'border-white/35' : 'border-white/10'
        }`}
        aria-pressed={selected}
        data-finding-id={finding.id}
      >
        <header className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }}
            aria-hidden
          />
          <span className="grow text-[12px] font-medium text-white/90">
            {finding.title}
          </span>
          <span
            className="rounded-full border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider"
            style={{
              color,
              borderColor: color,
            }}
          >
            {finding.severity}
          </span>
        </header>
        <p className="text-[10px] text-white/55">
          {finding.filePath}
          {finding.lineStart === finding.lineEnd
            ? `:${finding.lineStart}`
            : `:${finding.lineStart}-${finding.lineEnd}`}
        </p>
        <p className="text-[10px] font-mono text-white/40">
          {CATEGORY_LABEL[finding.category]}
        </p>
      </button>
    </li>
  );
}
