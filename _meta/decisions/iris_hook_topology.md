# Iris Hook Topology Decision

**Author**: Iris (Wave 1)
**Date**: 2026-05-12 (Wave 1 Cycle 3)
**Cross-ref**: `_meta/decision_log/iris.md` D-Iris-03.

## Choice

Module-level event bus for click subscription (Set of subscribers in
`useCityData.ts`), NOT React context for click events. React context still
used by Daedalus for `usePerformanceState`.

## Why

1. **Subscriber set is open**: Hera (ticket panel) + Persephone (side panel)
   + Boreas (tour pause) all want clicks. React context fanout requires all
   subscribers under the same provider tree.
2. **Persephone may not be inside Canvas**: Persephone side panel is a
   sibling DOM element next to the Canvas. A Canvas-scoped React context
   would not reach Persephone unless we lift the provider to the page
   root, which then loses the "scene-local state" property that Daedalus
   PerformanceContext relies on.
3. **Failure isolation**: a subscriber that throws should not break
   peers. Try/catch around dispatch isolates per-subscriber failure.
4. **Stable references**: module-level Set means the dispatch function +
   subscribe function have stable identity, no provider re-render churn.

## Topology

```
Module-level state (in useCityData.ts):
  clickSubscribers: Set<BuildingClickHandler>

Hooks:
  useCityData(): returns memoized mockCityData singleton
  useBuildingById(id): O(1) lookup via memoized index
  useBuildingClick(handler): subscribe on mount, unsubscribe on cleanup
  useBuildingClickDispatch(): returns stable dispatcher fn for scene to call

Component (city page in Wave 2):
  ChronicleCanvas
    -> CityScene (calls useBuildingClickDispatch + passes to BuildingInstances)
       -> BuildingInstances (raw <instancedMesh> per archetype, onClick fires
          dispatcher)

  SidePanel (Persephone Wave 2, sibling of Canvas)
    -> SubscriberComponent (calls useBuildingClick(handler) on mount)
```

When a building is clicked, the dispatcher fans out to all subscribers,
including Persephone outside the Canvas tree.

## Trade-offs accepted

1. **Single canvas only**: module-level state means 2 ChronicleCanvas
   instances on the same page share the subscriber set + would
   cross-broadcast clicks. Wave 1 demo has 1 canvas + 1 city. Wave 3 may
   need to switch to React context once multi-tenant deployment lands.
2. **Memory leak on subscriber leak**: if a subscriber forgets to unsub on
   unmount, the Set grows. Lock 5 documents this; useEffect cleanup
   handler enforces unsubscribe on every Wave 2 subscriber.

## Future migration path

Wave 3 multi-tenant scenario:

```typescript
// New design: BuildingClickProvider wraps page, contains subscriber Set.
// Iris hook reads from context instead of module state.
const BuildingClickContext = createContext<Set<BuildingClickHandler>>(new Set());
```

Migration is local to `useCityData.ts`; the hook surface stays identical so
Wave 2 worker (Hera, Persephone, Boreas) consumes unchanged.
