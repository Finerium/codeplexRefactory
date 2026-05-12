# Contract: Calliope to Wave 2 Panels

**Edge type**: cross-wave (Wave 1 to Wave 2)
**Wave**: Wave 1 producer to Wave 2 consumer
**Status**: locked
**Authored**: 2026-05-12 15:08 WIB

## Producer

**Worker**: Calliope (Wave 1)
**Domain**: Landing page authoring at `frontend/app/page.tsx` per Designer Prompt 1 bundle. Awwwards-tier sticky-pinned hero + 3-angle differentiator + 5 modes preview + 5 residents preview + tech stack signal + Refactory hackathon credit footer. CTA "Open the city ->" routes to `/start` (Hestia entry page). Calliope also defines route structure scaffolding that Wave 2 panels mount into.

## Consumer

**Worker**: Wave 2 panel-mounting workers (Hera + Asclepius + Boreas + Persephone)
**Domain**: After Hestia entry page CTA "Open the city ->" routes to `/city`, Wave 2 workers mount their panels (chat panel, ticket panel, side panel) into the city route layout. Calliope's contribution = the route structure + layout shell that hosts these panels.

## Output schema (producer to consumer)

Calliope authors Next.js 16 App Router route tree. Wave 2 consumers mount components into designated slots.

```
frontend/app/
├── page.tsx              # Landing (Calliope, Designer Prompt 1)
├── start/page.tsx        # Entry (Hestia, Designer Prompt 2)
├── city/
│   ├── layout.tsx        # City layout shell (Calliope authors scaffolding, Wave 2 fills)
│   ├── page.tsx          # Default city view (3D scene mount via Daedalus + Iris)
│   ├── @chat/            # Parallel route slot for AI chat panel (Persephone Wave 2)
│   │   └── default.tsx
│   ├── @ticket/          # Parallel route slot for ticket panel (Persephone Wave 2)
│   │   └── default.tsx
│   └── @side/            # Parallel route slot for side panel (Persephone Wave 2)
│       └── default.tsx
└── dashboard/page.tsx    # Dashboard (Selene, Designer Prompt 3)
```

City layout shell schema:

```tsx
// frontend/app/city/layout.tsx (Calliope authors scaffolding)
import { ChronicleCanvas } from '@/scene/Canvas';
import { CityScene } from '@/scene/CityScene';

export default function CityLayout({
  children,
  chat,
  ticket,
  side,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
  ticket: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <div className="city-layout">
      <main className="city-canvas-region">
        <ChronicleCanvas>
          <CityScene />
          {children}
        </ChronicleCanvas>
      </main>
      <aside className="city-chat-slot">{chat}</aside>
      <aside className="city-ticket-slot">{ticket}</aside>
      <aside className="city-side-slot">{side}</aside>
    </div>
  );
}
```

Wave 2 Persephone slot defaults (Calliope provides empty default, Persephone replaces):

```tsx
// frontend/app/city/@chat/default.tsx
// Calliope authors: returns null (no chat by default)
// Persephone Wave 2 replaces: returns <ChatPanel /> with 5-resident routing
export default function ChatSlotDefault() {
  return null;
}
```

Routing contract:

```typescript
// Mount paths Calliope guarantees Wave 2 can rely on
export const CITY_ROUTES = {
  root: '/city',
  chat: '/city/@chat/<resident>',  // dynamic, Persephone wires
  ticket: '/city/@ticket/<id>',
  side: '/city/@side/<mode>',      // mode = refactor | health | activity
} as const;
```

## Storage location

- Files: `frontend/app/page.tsx` (landing), `frontend/app/city/layout.tsx` (city shell), `frontend/app/city/page.tsx` (default city view), `frontend/app/city/@chat/default.tsx` + `@ticket/default.tsx` + `@side/default.tsx` (empty defaults Wave 2 replaces).
- Tailwind classes: `city-layout`, `city-canvas-region`, `city-chat-slot`, `city-ticket-slot`, `city-side-slot` defined in `frontend/styles/globals.css` (Calliope authors layout grid CSS).
- CTA wiring: landing page "Open the city ->" routes to `/start` (Hestia), then "Connect GitHub ->" or "Open a blank city ->" routes to `/city` (after OAuth callback / stub for Wave 1).

## Asumption baked

1. Next.js 16 App Router parallel route slots (@chat, @ticket, @side) work as documented; React 19 streaming compatible.
2. Calliope's city layout grid provides 3 fixed aside regions; Wave 2 Persephone styles each slot's contents but does NOT modify layout grid.
3. CSS Grid layout for city-layout: main canvas takes 70% width, chat slot 20% right, ticket+side slots overlay (z-index based) per Designer prompt 2 + Persephone Wave 2 panel architecture.
4. Calliope does NOT mount real 3D scene Wave 1; placeholder containers per Designer Prompt 1 instruction. Wave 2 Hera + Asclepius + Boreas wire scene-mode overlays.
5. `/city` route requires OAuth completion Wave 3 (Hestia stub Wave 1 + 3 allows direct nav for dev/demo). Wave 3 Hades adds route protection middleware.

## Validation steps

**Producer responsibility (Calliope)**:
- All 4 routes (landing, start, city, dashboard) render without console errors.
- "Open the city ->" CTA on landing chains to `/start` (Hestia). Hestia "Connect GitHub ->" + "Open a blank city ->" chain to `/city`.
- City layout grid renders 3 aside slots empty (default returns null Wave 1).
- Lighthouse 90+ on landing route maintained after layout addition.

**Consumer responsibility (Wave 2 Persephone)**:
- Replace `@chat/default.tsx` with `ChatPanel` component (5-resident routing UI).
- Replace `@ticket/default.tsx` with `TicketPanel` component.
- Replace `@side/default.tsx` with `SidePanel` component (3 mode variant).
- Do NOT modify city layout grid CSS classes (consumers style panel internals).
- Consume Iris building click events via `useBuildingClick` hook to populate ticket panel.

## Edge case handling

- User navigates direct to `/city` without OAuth: Wave 1 + 2 allow direct nav for dev; Wave 3 middleware redirects to `/start`.
- Parallel route slot conflict (Persephone mounts panel in multiple slots simultaneously): each slot is independent React tree, no conflict by Next.js App Router design.
- Mobile viewport <768px: Calliope layout collapses chat + ticket + side to bottom-drawer pattern (out-of-scope for Wave 1 mock; defer to Pan if mobile demo needed).

## Open questions

- Side panel mode multiplexing: Wave 2 Persephone owns `@side/[mode]/page.tsx` dynamic route with 3 variants (refactor, health, activity). Calliope reserves slot only, mode-routing logic = Persephone scope.
- Mobile responsive: PRD demo target is desktop (M-series MBP). Mobile responsive out-of-scope unless Pan adds Day 2.

## Reference

- Metis Agentic Structure md Section 2 DAG: Calliope landing page mount-target consumed by Wave 2 chat-panel routing
- Metis Section 5.4 Persephone ship criteria (chat + ticket + side panel architecture)
- Designer doc `_meta/designer/prompt-design_codeplex-chronicle.md` Prompt 1 (Landing) + Prompt 2 (Entry)
- Next.js 16 App Router parallel routes documentation (https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- PRD Section 7.2 (3D City View architecture)
- PRD Section 8 (architecture sketches)
