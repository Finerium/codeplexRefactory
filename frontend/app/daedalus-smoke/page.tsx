'use client';

/**
 * Daedalus smoke route.
 *
 * Wave 1 self-validation surface. NOT a panitia-facing route. Calliope
 * Wave 1 ships the real `/` landing; Hestia ships `/start`; Selene ships
 * `/dashboard`; Calliope also ships `/city` with parallel route slots.
 *
 * This page exists so Daedalus + Eunomia can probe the scene scaffold in
 * isolation, separate from the Designer-driven page workers. Safe to remove
 * post Wave 1 audit clean.
 */

import { CanvasSmokeHarness } from '@/scene/__smoke__/canvas.smoke';

export default function DaedalusSmokePage() {
  return (
    <main className="relative min-h-screen w-full bg-codeplex-void">
      <CanvasSmokeHarness />
      <aside className="pointer-events-none absolute bottom-6 left-6 z-10 rounded-xl border border-white/10 bg-codeplex-shadow/70 px-4 py-3 text-xs text-white/70 backdrop-blur-glass">
        <div className="font-mono uppercase tracking-widest text-codeplex-ember">
          Daedalus smoke
        </div>
        <div className="mt-1">
          Wave 1 scene scaffold. Drag to test regress, watch DOF + Sparkles +
          dpr drop-first ladder.
        </div>
      </aside>
    </main>
  );
}
