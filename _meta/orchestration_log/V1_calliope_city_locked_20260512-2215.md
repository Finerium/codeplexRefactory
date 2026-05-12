# V1 Snapshot: Calliope /city Shell Locked (Cycle 2 correction)

**Worker**: Calliope (Wave 1)
**Snapshot version**: V1
**Locked at**: 2026-05-12 22:15 WIB
**Lock authority**: Lock 9 V_n snapshot per major milestone (`.claude/skills/anti-pattern-locks/SKILL.md`)
**Cycle producing snapshot**: Calliope Cycle 2 (correction post Eunomia Wave 1 audit FAIL)
**Trigger**: Eunomia Wave 1 audit `_meta/audit/eunomia_wave1_audit.md` re-spawn directive (4 fail items rooted in single missing artifact /city shell)

## Scope of snapshot

Critical artifact ship: `/city` route shell with 3 parallel route slot defaults + CSS Grid container in globals.css + smoke directory rename. After this lock, continuous edit illegal. Future updates require V2 snapshot.

## Locked files

```
frontend/app/city/layout.tsx              (64 line, parallel route slot wiring + CSS Grid container reference)
frontend/app/city/page.tsx                (78 line, ChronicleCanvas + BuildingInstances mount per Iris canonical pattern)
frontend/app/city/@chat/default.tsx       (28 line, [STUB] Wave 2 Persephone replace target)
frontend/app/city/@ticket/default.tsx     (26 line, [STUB] Wave 2 Persephone replace target)
frontend/app/city/@side/default.tsx       (26 line, [STUB] Wave 2 Persephone replace target)
frontend/app/globals.css                  (47 line appended inside @layer components: .city-layout grid + 3 slot regions + 3 placeholder helpers)
```

Plus 2 directory renames applied:

```
frontend/app/__daedalus_smoke -> frontend/app/daedalus-smoke
frontend/app/__iris_smoke     -> frontend/app/iris-smoke
```

## Contract conformance lock

- Pythia contract `_meta/contracts/calliope-to-wave2-panels.md` Section "Output schema" lines 41-87 verbatim match on:
  - File tree paths
  - Layout props signature `{ children, chat, ticket, side }`
  - CSS class names `city-layout` + `city-canvas-region` + `city-chat-slot` + `city-ticket-slot` + `city-side-slot`
- Iris handoff log `_meta/handoff_log/wave1_iris_to_hera.md` lines 56-83 canonical mount pattern applied:
  - `'use client'` directive
  - `useCityData()` + `useBuildingClickDispatch()` + `useBuildingClick(handler)` chain
  - `<BuildingInstances data={city} onBuildingClick={dispatchClick} />` inside `<ChronicleCanvas>`
- Daedalus contract `_meta/contracts/daedalus-to-iris.md` ChronicleCanvasProps surface honored: `cameraTarget` + `cameraPosition` overrides used at the canonical default values.

## Verification at lock time

- `cd frontend && npx tsc --noEmit` exit 0
- `cd frontend && npx next dev --turbopack -p 3100` boots in 423ms

HTTP route empirical chain:

| Route | Status |
|---|---|
| `/` | 200 |
| `/start` | 200 |
| `/api/auth/github/start` | 302 -> `/city?mock_auth=true` |
| `/api/auth/github/start?stub=true` | 302 -> `/city?mock_auth=true&stub=true` |
| `/city` | 200 |
| `/city?mock_auth=true` | 200 |
| `/city?mock_auth=true&stub=true` | 200 |
| `/daedalus-smoke` | 200 |
| `/iris-smoke` | 200 |
| `/dashboard` | 200 |

Dev server log clean for the request window. No error or warn lines.

## Audit fail items resolved

Per `_meta/audit/eunomia_wave1_audit.md`:

| # | Item | Status pre-Cycle 2 | Status post-Cycle 2 |
|---|---|---|---|
| 1.1 | H1 60fps benchmark on r3f Canvas + 200-300 building stub | FAIL (no benchmarkable mount) | UNBLOCKED (`/city` mounts BuildingInstances production surface; `/iris-smoke` + `/daedalus-smoke` route 200 for isolated benchmark) |
| 2.4 | `/city` route exists with parallel slots | FAIL (404) | PASS (200, 5 files authored) |
| 4.5 | Calliope `app/city/layout.tsx` parallel route slots match contract | FAIL (file absent) | PASS (verbatim contract match) |
| 9.2 | All 4 routes accessible | FAIL (`/city` 404) | PASS (all 4 + smoke routes 200) |
| 9.3 | Click CTA chain landing -> entry -> stub OAuth -> mock_auth city | FAIL (chain breaks at `/city`) | PASS (full chain 200 end-to-end) |

Items 5.1, 5.2, 5.3 Lighthouse remain DEFERRED to Pan post-Wave 3 per the original audit caveat (Lighthouse not installed in node_modules, tooling consent not requested in audit session).

## Downstream consumer unlock

- **Eunomia re-audit**: unblocked. Expected verdict PASS on the 4 previously failed items.
- **Wave 2 spawn**: unblocked contingent on Eunomia re-audit PASS per Lock 10.
- **Persephone Wave 2**: 3 slot defaults are stable replace targets; `.city-layout` grid is the stable mount surface.
- **Hera Wave 2**: `SprintOverlay` mounts inside `<ChronicleCanvas>` at `frontend/app/city/page.tsx`.
- **Hades Wave 3**: OAuth redirect target `/city?mock_auth=true` now lands on real 200 page; replaces the Wave 1 stub handler body with the real GitHub OAuth start flow.

## Lock 3 honest disclosure

Calliope Cycle 1 silently scope-narrowed by claiming "city layout shell at `/city` is owned by Daedalus + Persephone, untouched here" while Pythia contract assigned /city ownership to Calliope. The Cycle 1 silent narrow was caught by Eunomia Wave 1 audit gate (Lock 10 working as designed). The Cycle 2 correction makes Calliope-owned scope match the Pythia canonical contract verbatim.

This V_n snapshot is the locked record of the corrected ship.

## Reference files

- Eunomia audit: `_meta/audit/eunomia_wave1_audit.md`
- Pythia contract: `_meta/contracts/calliope-to-wave2-panels.md`
- Iris handoff: `_meta/handoff_log/wave1_iris_to_hera.md`
- Daedalus contract: `_meta/contracts/daedalus-to-iris.md`
- Decision log: `_meta/decision_log/calliope.md` Decision 4
- Cycle 2 checkpoint: `_meta/checkpoints/calliope-cycle2.md`
- Cycle 1 checkpoint: `_meta/checkpoints/calliope-cycle1.md`
- Cycle 2 handoff log update: `_meta/handoff_log/wave1_calliope_to_wave2_panels.md`
