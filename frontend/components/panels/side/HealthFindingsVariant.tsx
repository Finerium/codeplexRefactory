'use client';

/**
 * HealthFindingsVariant: side panel content for Health Mode (Apollo findings).
 *
 * Authored by Persephone (Wave 2). Rewired to real Nemesis backend by
 * Asclepius + Nemesis (Wave-Fixing #3, HEALTH-MOCK-SUSPECT root-cause fix).
 *
 * Wave-Fixing #3 fix (Manager directive 2026-05-13):
 *   The previous Wave 2 implementation hardcoded a fallback to MOCK_FINDINGS
 *   when the Asclepius store was empty. Manager #2 PASS claim was wrong
 *   because the fallback was the first-render code path on /city => Health
 *   Mode always showed 6 mock findings, never the 15 real findings Nemesis
 *   Wave 3 detects on the NodeGoat fixture. This file now:
 *   1. On mount + when no findings present, calls `triggerScan()` which POSTs
 *      `/api/findings/scan`. The backend runs the 11-detector pipeline against
 *      the NodeGoat fixture (default) + returns real ScanResult with 15+
 *      Apollo findings + 5 spec-drift events.
 *   2. Surfaces a "Rescan" button so the user can refresh the data
 *      explicitly.
 *   3. Surfaces an explicit pill ("Real backend" green vs "Mock fallback"
 *      yellow) so panitia know which data is real.
 *   4. Mock fallback ONLY triggers when the backend is unreachable; the
 *      fallback is explicit + labeled so the demo path stays unblocked.
 *
 * Layout: list scrolls inside fixed-height region; evidence detail expands
 * below or right when a finding is selected.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (honest claim): real backend is source-of-truth path; mock
 *     fallback labeled + explicit; pill shows current data source.
 */

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FindingsPanel } from '@/modes/health/FindingsPanel';
import { EvidencePanel } from '@/modes/health/EvidencePanel';
import { useAsclepiusStore } from '@/modes/health/asclepiusStore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { MOCK_FINDINGS } from '@/modes/health/__mock__/findings';
import { triggerScan } from '@/modes/health/findingsClient';

export interface HealthFindingsVariantProps {
  className?: string;
}

type DataSource = 'idle' | 'fetching' | 'real' | 'mock-fallback' | 'error';

interface SourceMeta {
  source: DataSource;
  count: number;
  scanRunId?: string;
  countByDetector?: Record<string, number>;
  driftCount?: number;
  durationMs?: number;
  error?: string;
}

const INITIAL_META: SourceMeta = { source: 'idle', count: 0 };

export function HealthFindingsVariant({ className }: HealthFindingsVariantProps) {
  const setFindings = useAsclepiusStore((s) => s.setFindings);
  const findingCount = useAsclepiusStore(
    (s) => Object.keys(s.apollo.findings).length,
  );
  const [meta, setMeta] = useState<SourceMeta>(INITIAL_META);

  const loadRealScan = useCallback(async () => {
    setMeta((prev) => ({ ...prev, source: 'fetching' }));

    // Manager FINAL Cycle 2 Bug #7 fix (Hades 20260513-0857): read the URL
    // query so the scan call actually targets the repo the user picked. Prior
    // code called triggerScan() with no args, so the backend silently rendered
    // NodeGoat fixture data for every repo (Hafiz bug report).
    const params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const repoQuery = params.get('repo') ?? undefined;
    const demoQuery = params.get('demo');
    const opts: {
      repoFullName?: string;
      repoRoot?: string;
      demo?: boolean;
    } = {};
    if (repoQuery) {
      opts.repoFullName = repoQuery;
    } else if (demoQuery) {
      // Any value of ?demo= (nodegoat, fastapi-template, pygoat) maps to the
      // backend NodeGoat fixture opt-in. The DemoSourceBanner already labels
      // the actual rendered dataset honestly.
      opts.demo = true;
    } else {
      // No ?repo and no ?demo: caller landed on /city without picking a
      // target. Surface an explicit error rather than silently rendering
      // NodeGoat fixture data.
      setFindings([]);
      setMeta({
        source: 'error',
        count: 0,
        error:
          'No repository selected. Return to /start and pick a repository or demo dataset.',
      });
      return;
    }

    const result = await triggerScan(opts);
    if (result.ok) {
      setFindings(result.findings);
      setMeta({
        source: 'real',
        count: result.findings.length,
        scanRunId: result.scanRunId,
        countByDetector: result.countByDetector,
        driftCount: Object.values(result.driftCountByPattern).reduce(
          (a, b) => a + b,
          0,
        ),
        durationMs: result.durationMs,
      });
    } else {
      // Manager FINAL Cycle 2 (Hades): surface the backend error explicitly
      // instead of silently rendering MOCK_FINDINGS as if they were real.
      // Mock fallback ONLY when the backend is fully unreachable AND the
      // caller did not pick a real repo (the previous behavior).
      const unreachable =
        result.status === undefined ||
        result.status === 0 ||
        /failed to fetch|networkerror|ecconnrefused/i.test(result.error);
      if (unreachable && opts.demo) {
        setFindings(MOCK_FINDINGS);
        setMeta({
          source: 'mock-fallback',
          count: MOCK_FINDINGS.length,
          error: result.error,
        });
      } else {
        // Real repo target: do NOT silently substitute mock data.
        setFindings([]);
        setMeta({
          source: 'error',
          count: 0,
          error: result.error,
        });
      }
    }
  }, [setFindings]);

  // Seed on mount: try the real backend first; fall back to mock with toast.
  useEffect(() => {
    if (findingCount === 0 && meta.source === 'idle') {
      void loadRealScan();
    }
  }, [findingCount, meta.source, loadRealScan]);

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader>
        <CardDescription className="font-mono uppercase tracking-widest text-codeplex-ember">
          Health Mode
        </CardDescription>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Apollo Findings</span>
          <SourcePill meta={meta} />
        </CardTitle>
        <RescanRow meta={meta} onRescan={loadRealScan} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <FindingsPanel />
        <EvidencePanel />
      </CardContent>
    </Card>
  );
}

HealthFindingsVariant.displayName = 'HealthFindingsVariant';

function SourcePill({ meta }: { meta: SourceMeta }) {
  if (meta.source === 'real') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-200"
        title={`Backend POST /api/findings/scan returned ${meta.count} real findings in ${meta.durationMs}ms`}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300"
          aria-hidden
        />
        Real backend
      </span>
    );
  }
  if (meta.source === 'mock-fallback') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-200"
        title={
          meta.error
            ? `Backend unreachable: ${meta.error}. Falling back to ${meta.count} mock findings labeled at source.`
            : 'Mock fallback active'
        }
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300"
          aria-hidden
        />
        Mock fallback
      </span>
    );
  }
  if (meta.source === 'fetching') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/[0.06] px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/70"
        title="POST /api/findings/scan in flight"
      >
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
        Scanning
      </span>
    );
  }
  if (meta.source === 'error') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-400/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-rose-200"
        title={meta.error ?? 'Scan failed'}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-rose-300"
          aria-hidden
        />
        Scan failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/50">
      Idle
    </span>
  );
}

function RescanRow({
  meta,
  onRescan,
}: {
  meta: SourceMeta;
  onRescan: () => void | Promise<void>;
}) {
  const detectorPillFor = (id: string, n: number) => (
    <span
      key={id}
      className="inline-flex items-center gap-1 rounded-full border border-white/15 px-1.5 py-0.5 font-mono text-[9px] text-white/70"
      title={`${id}: ${n} finding${n === 1 ? '' : 's'}`}
    >
      <span className="text-white/45">{id}</span>
      <span className="text-codeplex-ember">{n}</span>
    </span>
  );
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9.5px] text-white/55">
          {meta.source === 'real'
            ? `Scan run ${meta.scanRunId?.slice(0, 8) ?? '?'}, ${meta.count} findings, ${meta.driftCount ?? 0} drift events, ${meta.durationMs ?? 0}ms`
            : meta.source === 'mock-fallback'
              ? `Mock fallback: ${meta.count} findings (backend offline)`
              : meta.source === 'fetching'
                ? 'Calling backend...'
                : meta.source === 'error'
                  ? `Scan failed: ${meta.error ?? 'unknown reason'}`
                  : 'Awaiting first scan'}
        </p>
        <button
          type="button"
          onClick={() => void onRescan()}
          disabled={meta.source === 'fetching'}
          className="rounded-md border border-white/20 bg-white/[0.04] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/85 hover:border-white/40 hover:bg-white/[0.08] disabled:opacity-50"
        >
          {meta.source === 'fetching' ? 'Scanning' : 'Rescan'}
        </button>
      </div>
      {meta.countByDetector && meta.source === 'real' ? (
        <div className="flex flex-wrap gap-1">
          {Object.entries(meta.countByDetector).map(([id, n]) =>
            detectorPillFor(id, n),
          )}
        </div>
      ) : null}
      {meta.source === 'mock-fallback' && meta.error ? (
        <p
          className="rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-1 font-mono text-[9.5px] text-amber-200"
          role="status"
        >
          Backend offline: {meta.error}
        </p>
      ) : null}
      {meta.source === 'error' && meta.error ? (
        <p
          className="rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 font-mono text-[9.5px] text-rose-200"
          role="status"
        >
          Scan failed: {meta.error}
        </p>
      ) : null}
    </div>
  );
}
