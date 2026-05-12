# Asclepius Wave-Fixing #2 cycle 1 uncertainty journal

**Date**: 2026-05-13 03:13 WIB Day 2
**Confidence**: high (proceed without ferry)

## Backlog Office building stand-in (FlyingPacket target)

**Question**: PRD Section 9.5 line 596 + Section 12.1 line 776 reference
"Backlog Office" as the flying-packet arrival destination. mockCityData
does not contain an explicit Backlog Office building; the city has 5
landmarks (Athena City Hall, Apollo Hospital, Argus Police Station, Clio
Library, Hermes Tourist Info) but no Backlog Office.

**Decision**: use Athena City Hall as the default flying-packet target.
City Hall is the architect/governance landmark + thematically closest to
"backlog" as a planning destination. Document the stand-in in code +
provide a `targetBuildingId` override field in `FlyingPacketSpec` so a
future Hera ship of a dedicated Backlog Office building can wire in
without code churn.

**Confidence**: medium-high. Demo viewers may not perceive the
distinction since the visual story (issue spawned, packet flying to a
landmark) reads correctly either way. If Hera ships a Backlog Office
building in a later cycle, swap the default in `IssueFlyingPacketLayer`.

## SpecDriftLayer pattern mock data

**Question**: the 5 patterns A-E (PRD Section 11.3) map to deterministic
detector signals that Demeter Wave 3 will surface. Wave-Fixing #2 needs
visible patterns now; should the mock data assign patterns randomly or
deterministically by building id?

**Decision**: deterministic mock list of 5 buildings, one per pattern, in
the backend services district. Allows demo footage to show all 5 patterns
in a single camera pan without random reshuffle between page loads.

**Confidence**: high. The list is explicitly labeled MOCK Wave-Fixing #2
at source + scoped to a clearly demo-only export
(`SPECDRIFT_MOCK_FLAGS`).

## Crack pattern shader scope

**Question**: PRD Section 11.3 specifies 5 retak patterns with semantic
descriptions but no visual specifications. How distinct should each
pattern be visually?

**Decision**: 5 patterns with semantically-distinct geometry:
- A horizontal high-up crack (ceiling stale metaphor)
- B dotted X scar (intent crossed-out)
- C wide horizontal gap with glow (drift gap)
- D zigzag vertical (stress-fracture cycle)
- E broken ring (workflow loop bypassed)

Each pattern uses a unique color tint within the codeplex-clio family so
"spec-drift is Clio's domain" reads visually. The geometries are
intentionally readable from camera distance ~80 units.

**Confidence**: high. The visual distinctness is the manager directive
literal ("DISTINCT (5 custom shader pattern, A different from B, etc)").
Future iterations can swap procedural geometry for textured shaders if
demo prep wants higher fidelity.

## Multi-route mode propagation

**Question**: setting URL `?mode=health` works, but if user navigates
between routes the panelStore retains the last mode. Should
AsclepiusBridge auto-reset on route change?

**Decision**: no. The mode state is a user-driven choice via SidePanel
tabs; URL param is the demo deep-link affordance. If audit needs a
deterministic reset, the test harness can reload the route or click the
Activity tab.

**Confidence**: high. The behavior matches how Persephone Wave 2 +
Wave-Fixing #1 already manage mode persistence.
