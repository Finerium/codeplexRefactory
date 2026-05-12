'use client';

/**
 * ActivityDrilldownVariant: side panel content for Activity Mode.
 *
 * Authored by Persephone (Wave 2). Consumes Boreas `useActivityStore` +
 * `useActivityData` from `@/modes/activity`.
 *
 * Renders:
 *   - Range buttons (30 / 60 / 90 day)
 *   - Summary stats (total commits + unique contributors + most active building)
 *   - Top 5 hotspot list (descending intensity)
 *   - Ownership heatmap toggle
 *   - Scrubber state indicator
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 5 (mock activity data labeled at Boreas source).
 */

import { cn } from '@/lib/utils';
import { useActivityStore } from '@/modes/activity/store';
import { useActivityData } from '@/modes/activity/useActivityData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ActivityDrilldownVariantProps {
  className?: string;
}

export function ActivityDrilldownVariant({ className }: ActivityDrilldownVariantProps) {
  const rangeDays = useActivityStore((s) => s.rangeDays);
  const setRangeDays = useActivityStore((s) => s.setRangeDays);
  const ownershipHeatmapActive = useActivityStore((s) => s.ownershipHeatmapActive);
  const toggleOwnershipHeatmap = useActivityStore((s) => s.toggleOwnershipHeatmap);
  const scrubberPosition = useActivityStore((s) => s.scrubberPosition);
  const setScrubberPosition = useActivityStore((s) => s.setScrubberPosition);

  const data = useActivityData();

  // Top 5 hotspots by intensity descending.
  const topHotspots = [...data.hotspots]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  // Top 5 ownership distributions (by primary owner share).
  const topOwnership = [...data.ownership]
    .sort((a, b) => b.primaryOwnerSharePercent - a.primaryOwnerSharePercent)
    .slice(0, 5);

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader>
        <CardDescription className="font-mono uppercase tracking-widest text-codeplex-ember">
          Activity Mode
        </CardDescription>
        <CardTitle>Engineering pulse, last {rangeDays} days</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <section className="flex items-center justify-between">
          <Tabs
            value={String(rangeDays)}
            onValueChange={(v) => setRangeDays(Number(v) as 30 | 60 | 90)}
          >
            <TabsList>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="60">60d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant={ownershipHeatmapActive ? 'default' : 'outline'}
            size="sm"
            onClick={toggleOwnershipHeatmap}
            aria-pressed={ownershipHeatmapActive}
            className="text-[10px]"
          >
            {ownershipHeatmapActive ? 'Heatmap on' : 'Heatmap off'}
          </Button>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Total commits
            </p>
            <p className="text-base font-semibold text-white">
              {data.summary.totalCommits.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Unique contributors
            </p>
            <p className="text-base font-semibold text-white">
              {data.summary.uniqueContributors}
            </p>
          </div>
          <div className="col-span-2 rounded-md border border-white/10 bg-white/[0.04] p-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Most active building
            </p>
            <p className="truncate font-mono text-[11px] text-codeplex-ember">
              {data.summary.mostActiveBuilding}
            </p>
            <p className="font-mono text-[9px] text-white/50">
              owned by {data.summary.mostActiveOwner}
            </p>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-1.5">
          <header className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
              Top hotspots
            </p>
            <p className="font-mono text-[9px] text-white/40">
              by intensity
            </p>
          </header>
          <ul className="flex flex-col gap-1">
            {topHotspots.length === 0 ? (
              <li className="rounded-md border border-dashed border-white/10 p-2 text-center text-[10px] text-white/40">
                No hotspots in window
              </li>
            ) : (
              topHotspots.map((h) => (
                <li
                  key={h.buildingId}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5"
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: '#ffb472',
                      boxShadow: `0 0 ${4 + h.intensity * 8}px #ffb47266`,
                      opacity: 0.4 + h.intensity * 0.6,
                    }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate font-mono text-[10px] text-white/80">
                    {h.buildingId}
                  </span>
                  <span className="font-mono text-[9px] text-white/50">
                    {h.commitCount} commits
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <Separator />

        <section className="flex flex-col gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Top ownership
          </p>
          <ul className="flex flex-col gap-1">
            {topOwnership.length === 0 ? (
              <li className="rounded-md border border-dashed border-white/10 p-2 text-center text-[10px] text-white/40">
                No ownership data
              </li>
            ) : (
              topOwnership.map((o) => (
                <li
                  key={o.buildingId}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5"
                >
                  <span className="flex-1 truncate font-mono text-[10px] text-white/80">
                    {o.buildingId}
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {o.primaryOwnerLogin}
                  </Badge>
                  <span className="font-mono text-[9px] text-white/55">
                    {Math.round(o.primaryOwnerSharePercent)}%
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <Separator />

        <section className="flex flex-col gap-1.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/45">
            Timeline cursor
          </p>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(scrubberPosition * 100)}
            onChange={(e) => setScrubberPosition(Number(e.target.value) / 100)}
            className="w-full accent-codeplex-ember"
            aria-label="Timeline scrubber position"
          />
          <p className="font-mono text-[9px] text-white/50">
            {scrubberPosition === 1 ? 'Now' : `${Math.round(scrubberPosition * rangeDays)}d ago`}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}

ActivityDrilldownVariant.displayName = 'ActivityDrilldownVariant';
