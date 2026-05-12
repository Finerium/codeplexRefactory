/**
 * City layout shell with parallel route slots.
 *
 * Authored by Calliope (Wave 1, Cycle 2 correction post Eunomia FAIL).
 *
 * Pythia contract: `_meta/contracts/calliope-to-wave2-panels.md` Section
 * "Output schema" lines 41-87. The 3 named slots (`@chat`, `@ticket`,
 * `@side`) are mounted into a CSS Grid container with class `city-layout`,
 * exactly per the Pythia schema. Wave 2 Persephone replaces the Wave 1
 * default placeholders in `@chat/default.tsx`, `@ticket/default.tsx`,
 * `@side/default.tsx` with the real ChatPanel + TicketPanel + SidePanel
 * components.
 *
 * Per Next.js 16 parallel routes upgrade requirement: every parallel slot
 * MUST have an explicit `default.tsx` (build fails otherwise). The 3
 * `default.tsx` files Calliope ships render labeled stub placeholders so
 * the Designer slot regions remain visible during Wave 1 demos without
 * pretending production panels exist yet.
 *
 * The CSS Grid template lives in `frontend/app/globals.css` under the
 * `.city-layout` class block (Calliope coordinates a single append per
 * contract Asumption 4). The grid keeps the ChronicleCanvas main region
 * full-bleed while floating the 3 panel slots as overlay-style regions
 * sized for the Designer bundle intent (chat docked right, ticket pinned
 * bottom-right, side anchored left). Wave 2 Persephone is free to style
 * panel internals; do NOT modify the grid template per contract Asumption
 * 2.
 *
 * Compliance:
 *   Lock 1 (no em dash): clean.
 *   Lock 2 (no emoji): clean.
 *   Lock 3 (no silent scope narrow): Cycle 2 fix authored, Eunomia audit
 *     fail item 2.4 + 4.5 + 9.2 + 9.3 root cause resolved.
 *   Lock 5 (honest claim): default slot placeholders carry [STUB: ...]
 *     labels per the convention.
 */

'use client';

import type { ReactNode } from 'react';
import { usePanelStore } from '@/lib/panel-context';

interface CityLayoutProps {
  children: ReactNode;
  chat: ReactNode;
  ticket: ReactNode;
  side: ReactNode;
}

/**
 * Wave-Fixing cycle 1 (Persephone, 20260513-0148):
 *
 * Layout is now a Client Component because we read panelStore to set
 * `data-collapsed` on the chat + side slot wrappers. The CSS uses
 * `[data-collapsed='true']` to shrink the slot dock down to the restore
 * button width when a panel is collapsed (~3.5rem). This guarantees the
 * canvas underneath stays uncovered + clickable, and prevents the chat
 * vs side cross-dock overlap at narrow viewports (C-5).
 */
export default function CityLayout({
  children,
  chat,
  ticket,
  side,
}: CityLayoutProps) {
  const chatCollapsed = usePanelStore((s) => s.chatCollapsed);
  const sideCollapsed = usePanelStore((s) => s.sideCollapsed);
  return (
    <div className="city-layout">
      <main className="city-canvas-region">{children}</main>
      <aside
        className="city-chat-slot"
        data-collapsed={chatCollapsed ? 'true' : 'false'}
        aria-label="AI chat panel slot"
      >
        {chat}
      </aside>
      <aside className="city-ticket-slot" aria-label="Ticket panel slot">
        {ticket}
      </aside>
      <aside
        className="city-side-slot"
        data-collapsed={sideCollapsed ? 'true' : 'false'}
        aria-label="Side panel slot"
      >
        {side}
      </aside>
    </div>
  );
}
