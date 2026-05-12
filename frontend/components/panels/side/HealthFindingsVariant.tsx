'use client';

/**
 * HealthFindingsVariant: side panel content for Health Mode (Apollo findings).
 *
 * Authored by Persephone (Wave 2). Drops in Asclepius `<FindingsPanel />`
 * (list) + `<EvidencePanel />` (detail) per Asclepius Wave 2 ship.
 *
 * Layout: list scrolls inside fixed-height region; evidence detail expands
 * below or right when a finding is selected. On mobile (Wave 3 stretch),
 * layout collapses to stacked drawer.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (mock findings labeled at Asclepius source).
 */

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FindingsPanel } from '@/modes/health/FindingsPanel';
import { EvidencePanel } from '@/modes/health/EvidencePanel';
import { useAsclepiusStore } from '@/modes/health/asclepiusStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_FINDINGS } from '@/modes/health/__mock__/findings';

export interface HealthFindingsVariantProps {
  className?: string;
}

export function HealthFindingsVariant({ className }: HealthFindingsVariantProps) {
  const setFindings = useAsclepiusStore((s) => s.setFindings);
  const findingCount = useAsclepiusStore((s) => Object.keys(s.apollo.findings).length);

  // Seed Wave 2 demo: load mock findings into Asclepius store if not present.
  useEffect(() => {
    if (findingCount === 0) {
      setFindings(MOCK_FINDINGS);
    }
  }, [findingCount, setFindings]);

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader>
        <CardDescription className="font-mono uppercase tracking-widest text-codeplex-ember">
          Health Mode
        </CardDescription>
        <CardTitle>Apollo Findings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <FindingsPanel />
        <EvidencePanel />
      </CardContent>
    </Card>
  );
}

HealthFindingsVariant.displayName = 'HealthFindingsVariant';
