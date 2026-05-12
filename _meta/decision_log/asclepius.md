# Decision log: Asclepius (Wave 2)

## D1: Severity + FindingCategory enum reconciliation, follow Pythia contract

**Date**: 2026-05-12 23:00 WIB
**Cycle**: 1
**Confidence**: high

### Context

Three sources defined the Severity + FindingCategory enums in slightly
different shapes:

- `_meta/contracts/asclepius-to-triton.md` lines 33 + 44 (locked Pythia
  Wave 0): Severity = `'critical'|'high'|'medium'|'low'|'info'` (5 enum);
  FindingCategory =
  `'hardcoded-secret'|'outdated-dependency'|'missing-auth'|'unsafe-sql'|'complex-untested'`
  (5 enum, kebab-case).
- `.claude/agents/asclepius.md` Section 3 worker prompt block: Severity =
  7-enum (`'critical'|'red'|'high'|'orange'|'medium'|'yellow'|'low'`);
  FindingCategory = 5 enum (`'security'|'complexity'|'untested'|'outdated_dep'|'missing_auth'`,
  snake-case).
- PRD Section 11 functional copy: "red critical, orange high, yellow medium"
  (3 severity tier descriptive).

### Decision

Adopt the Pythia contract canonical (5-enum severity, 5-enum kebab-case
category) verbatim. Map PRD's red/orange/yellow descriptive text to the
locked palette in `SEVERITY_PALETTE` per PRD Section 11 lock.

### Rationale

- Pythia contracts are the cross-wave canonical schemas (Lock 16 of the
  20-item self-check: "Output match Pythia contract schema, format,
  fields"). Block fail item 16 = ferry V1 Orch. Following the worker prompt
  variant would have produced a schema mismatch with Nemesis Wave 3
  publishes (per `nemesis-to-asclepius.md` line 44 publishes 5 enum
  kebab-case category) + Triton Wave 3 `/api/chat/apollo` Pydantic
  validator (`asclepius-to-triton.md` line 134-137).
- PRD descriptive text is functional req copy, not schema. Honor by mapping
  visually in `SEVERITY_PALETTE` (critical=red `#ff4757`, high=orange
  `#ff8c42`, medium=yellow `#ffd23f`, low=blue `#5fa8d3`, info=blue-grey
  `#7aa8c2`) without amending the canonical enum.

### Impact

- Asclepius store + UI + WebSocket subscriber use 5-enum severity +
  5-enum kebab-case category.
- Mock dataset uses canonical enum exactly.
- Wave 3 Nemesis + Triton wire to canonical types without remap layer.
- Low + info findings render as cool-blue glow (subtle), in line with PRD
  decay-style "informational, low pressure" implied semantics.

## D2: Multi-finding building glow collapse to max severity

**Date**: 2026-05-12 23:05 WIB
**Cycle**: 1
**Confidence**: high

### Context

PRD Section 11 talks about glow per severity but does not specify what
happens when one building has 3 findings of different severities. Options:

1. Render 3 stacked glow windows (visual noise at city scale).
2. Aggregate to most-severe finding (1 glow per building).
3. Aggregate to count weighted scaling intensity.

### Decision

Option 2: max severity wins. `selectGlowWindows` returns one
`GlowWindowState` per building with the highest severity over its open
findings. The `count` field of `GlowWindowState` carries the multi-finding
count so the panel still shows total but the 3D scene shows one glow.

### Rationale

- City scale (~240 buildings, many can carry multiple findings) makes
  option 1 produce z-fighting + visual noise.
- Option 3 introduces an axis that's hard to map (count != severity in
  user mental model).
- Option 2 matches PRD Section 11 spirit ("merah critical, orange high")
  + ergonomic at scale + the `count` carries the total for tooltip /
  panel.

### Impact

- Selector `selectGlowWindows` does max-rank over open findings.
- FindingsPanel header still shows "6 findings, 2 critical, 2 high" so the
  count is visible.

## D3: Ghost geometry via direct import of Iris generic archetype builders

**Date**: 2026-05-12 23:20 WIB
**Cycle**: 3
**Confidence**: high

### Context

Iris exposes archetype geometry builders in
`frontend/src/scene/buildings/genericArchetype.ts` but does NOT re-export
them via the barrel `@/scene/buildings` (intentional per
`frontend/src/scene/buildings/index.ts` lines 20-26: "Archetype geometry
builders are intentionally NOT re-exported here, so consumers cannot
accidentally bypass BuildingInstances + couple to internal geometry. If a
future Wave 2 worker needs custom geometry mounting outside InstancedMesh,
they import the archetype builder directly with full path awareness.").

GhostBuilding needs a BufferGeometry per ghost archetype. Three options:

1. Build standalone ghost-specific BoxGeometry (lose iconic silhouette
   parity with real buildings).
2. Import Iris archetype builders directly (Iris contract sanctions this
   path explicitly).
3. Re-export via the Iris barrel (changes Iris module surface; not
   Asclepius scope).

### Decision

Option 2: direct import from
`@/scene/buildings/genericArchetype` for the 3 generic builders
(buildResidenceGeometry, buildWarehouseGeometry, buildOfficeGeometry).
Cache the 3 geometries at module load in `__ghost__/ghostGeometry.ts`.

### Rationale

- Iris contract handoff line 25-26 grants Asclepius this path with full
  path awareness.
- Iconic silhouette parity preserved (ghost looks like a real generic
  building, just transparent + edges-animated).
- No Iris surface change.

### Impact

- 3 ghost geometries shared across all GhostBuilding instances (matches
  Iris BuildingInstances memo pattern + Three.js GPU geometry cache).
- Wave 3 extension path (landmark ghosts e.g., proposal touches a landmark
  file) requires extending GhostArchetype enum + importing landmark
  builders (templeArchetype, etc.); reserved for Wave 3 if needed.

## D4: Glow visual technique selective bloom emissive plane, NOT shader rewrite

**Date**: 2026-05-12 23:25 WIB
**Cycle**: 2
**Confidence**: medium

### Context

Asclepius prompt + research expectations suggest UnrealBloom selective
layer for "engineering-feel" glow. Implementation paths:

1. Selective bloom layer on Object3D via `object.layers.set(BLOOM_LAYER)`
   + duplicate render pass with Three.js EffectComposer custom config
   (Codrops SINGULARITY pattern). High implementation cost; requires
   modifying Daedalus's `PostPipeline` block in `Canvas.tsx`.
2. Use the existing global Daedalus Bloom (always-on per Daedalus's
   ChronicleCanvas decision D4 + AD-12) by piping the glow color into the
   emissive property of MeshStandardMaterial. The global Bloom picks up
   anything with `emissiveIntensity > 0.3 + luminanceThreshold 0.55` and
   blooms it without per-mesh layer setup.

### Decision

Option 2. GlowWindow uses MeshStandardMaterial with `emissive` color +
`emissiveIntensity` modulated by severity + (for critical) animated
pulse via useFrame. Critical pulse runs through `emissiveIntensity`
range 0.4 to 1.3 which sits well above Daedalus's Bloom luminance
threshold 0.55 so the bloom output reads as "engineering glow" without
the selective-layer machinery.

### Rationale

- Lock 3 SAFETY-FIRST: option 1 requires modifying Daedalus's Canvas
  + EffectComposer setup, which is Daedalus' domain. Asclepius without
  ferry would be silent scope creep.
- Daedalus's Bloom is already calibrated (intensity 0.9, luminance
  threshold 0.55, mipmapBlur on, kernel LARGE) per `Canvas.tsx` lines
  213-219. Piping emissive through that pipeline is the canonical r3f
  pattern.
- 3-layer composition (top-mounted halo plane + ground ring + shaft)
  reads as engineering diagnostic, not generic-css-drop-shadow.
- Wave 2 visual budget tight (Dike audit pending). Option 1 risks scope
  overrun.

### Impact

- GlowWindow lives entirely inside the r3f scene tree, mounted by
  HealthGlowLayer next to BuildingInstances.
- Daedalus's Canvas + Bloom configuration unchanged.
- Wave 3 evolution to selective bloom layer remains feasible without
  breaking the GlowWindow public surface (only the material composition
  internals change).

## D5: Dual review gate button labels per Pythia + 3-explicit-button safety

**Date**: 2026-05-12 23:30 WIB
**Cycle**: 3
**Confidence**: high

### Context

PRD Section 9.3 line 549-551 ships 2-button language: "Accept changes" +
"Done viewing simulation". Asclepius prompt Section 4 + Metis ship
criteria + Pythia contract `asclepius-to-pandora.md` consistently use
3 buttons: "Run Simulation" + "Accept changes" + "Discard".

### Decision

3 explicit buttons: "Run Simulation" + "Accept changes" + "Discard". The
PRD's "Done viewing simulation" semantic is preserved by the Discard
button's behavior (production code untouched; drafts retained for 7 days
per `asclepius-to-pandora.md` Edge case bullet 4).

### Rationale

- 3 button surface enforces SAFETY-FIRST (per Wave 0 directive + Q3 Q&A
  defense card PRD line 1038): the user has to consciously elect one of
  3 actions, never a single auto-default. Single Accept is a known
  Anti-pattern.
- "Discard" reads more clearly as the destructive alternative than "Done
  viewing simulation" (which a non-expert might misread as "save +
  exit").
- Wave 3 Pandora wires real `POST /api/refactor/{simulate,accept,discard}`
  per `asclepius-to-pandora.md` lines 145-155 + `pandora-to-asclepius.md`
  lines 67-79. Aligned button labels reduce mapping work.

### Impact

- DualReviewGate ships 3 button surface with state machine: only
  simulate enabled when stage = 'proposed'; only accept enabled when
  stage = 'completed'; discard enabled when in-flight OR completed.
- Wave 3 backend endpoint names match button data-action attributes.

## D6: Refactor Mode does NOT touch /city/page.tsx (Hera + Persephone scope)

**Date**: 2026-05-12 23:35 WIB
**Cycle**: 4
**Confidence**: high

### Context

Wave 2 has 4 workers spawned paralel: Hera (SprintOverlay mount in /city
scene per Iris handoff line 132), Persephone (replace `@side` slot
default), Boreas (Onboarding + Activity), Asclepius (Health + Refactor).
All 4 could plausibly modify `frontend/app/city/page.tsx` to mount their
scene-layer.

### Decision

Asclepius produces 12 self-contained module files at
`frontend/src/modes/{health,refactor}/*` + 1 smoke route at
`frontend/app/asclepius-smoke/page.tsx`. Does NOT modify
`frontend/app/city/page.tsx`, `frontend/app/city/layout.tsx`, or any of
the `@chat/@ticket/@side` slot defaults.

Persephone (parallel worker) is the canonical owner of the slot defaults
per `_meta/handoff_log/wave1_calliope_to_wave2_panels.md` lines 165-173 +
Pythia contract `calliope-to-wave2-panels.md`. Persephone consumes
Asclepius via barrel `import { HealthMode, RefactorMode } from
'@/modes/health' / '@/modes/refactor'` when Persephone ships its
mode-routed side panel.

Hera (parallel worker) owns the scene-layer SprintOverlay mount + can
choose whether to add `<HealthGlowLayer />` + `<RefactorGhostLayer />`
as siblings under `<ChronicleCanvas>`; these layers are barrel-exported
ready.

### Rationale

- Lock 3 (no silent scope narrow + no overwrite parallel worker domain):
  4 workers writing `/city/page.tsx` concurrently is a merge minefield.
- Smoke route precedent: Daedalus + Iris each authored a `*-smoke` route
  for audit isolation. Asclepius follows the same pattern.
- Persephone is the explicit owner of the 3 slot defaults per Pythia
  contract; Asclepius integrating directly would be Lock 3 violation.

### Impact

- Dike Wave 2 audit visual at `/asclepius-smoke` (HTTP 200 verified).
- Persephone integration is a single import line away once Persephone
  ships side panel mode router.
- Hera mounts the 2 scene layers when Hera composes the city scene; the
  layers are pre-mounted in the smoke route as audit proof.

## D7: Cache GlowWindowState array inside store mutations, not selector

**Date**: 2026-05-12 23:50 WIB
**Cycle**: 4
**Confidence**: high

### Context

First mount of `/asclepius-smoke` triggered React 19 + Zustand v5
"Maximum update depth exceeded" + "getSnapshot should be cached" error.
Root cause: `selectGlowWindows` originally returned a fresh array on
each invocation; React's `useSyncExternalStore` requires the snapshot
reference to be stable until underlying state changes.

### Decision

Cache the derived array as a top-level store field `glowWindowList`,
recomputed inside each finding mutation (`setFinding`, `setFindings`,
`setGlow`, `markTicketed`, `reset`). The selector `selectGlowWindows`
returns this cached array reference.

### Rationale

- Reference-stable snapshot satisfies `useSyncExternalStore` contract.
- All mutation entry points control the recompute, so the cache stays
  consistent.
- No new dependency (zustand `shallow` or external memo lib).

### Impact

- `/asclepius-smoke` console: 0 errors verified via Playwright snapshot.
- HealthGlowLayer mounts cleanly + iterates the cached list.

## D8: Co-locate refactor proposal slice in the asclepius store

**Date**: 2026-05-12 23:55 WIB
**Cycle**: 1
**Confidence**: high

### Context

Pythia contracts split the schema across two contracts
(`asclepius-to-triton.md` for Apollo + `asclepius-to-pandora.md` for
refactor). The contracts do not require both to share a single
zustand store; could be two stores or one.

### Decision

Single store `asclepiusStore` with two slices: `apollo` +
`refactor`. Both panels (FindingsPanel + RefactorMode) read selectors
from the same store; component tree mounts the same provider-less
zustand hook.

### Rationale

- Triton chat surface (Wave 3) routes Apollo + Athena queries through
  the same chat panel (`asclepius-to-triton.md` line 11). A single
  store lets Persephone compose context for both residents without
  cross-store coordination.
- Module-local zustand store does not require provider wiring; single
  store keeps the public surface minimal.

### Impact

- `useAsclepiusStore` is the single hook for both modes.
- Selectors organized: Apollo (`selectApolloFindings`, `selectGlowWindows`,
  `selectSelectedFinding`, etc.) + Refactor (`selectRefactorSlice`).
- `useApolloQueryContext` ergonomic for Triton chat routing.
