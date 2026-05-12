# Asclepius uncertainty journal, Cycle 4

**Date**: 2026-05-12 23:50 WIB
**Worker**: Asclepius (Wave 2)
**Cycle**: 4 (smoke route + Playwright + handoff finalize)

## U-Ascl-001: Sibling Wave 2 worker TSC error in Boreas + Persephone deltas

**Confidence**: medium
**Severity**: medium (does not block Asclepius ship; Dike audit will see)
**Status**: not gw's domain to fix, flagged for V1 Orch awareness

### Context

At end of Cycle 3 + Cycle 4, running `cd frontend && npx tsc --noEmit`
surfaced 3 errors NOT in Asclepius-owned files:

```
components/panels/chat/BroadcastToggle.tsx(18,1): error TS6133
  'React' is declared but its value is never read.
components/panels/chat/ResidentAvatar.tsx(22,1): error TS6133
  'React' is declared but its value is never read.
src/modes/sprint/SprintMode.tsx(74,9): error TS6133
  'allContexts' is declared but its value is never read.
```

The Boreas HotspotGlow CanvasTexture error visible mid-Cycle 3
(`src/modes/activity/HotspotGlow.tsx(54,5): TS2322 CanvasTexture`)
appears to have been corrected by Boreas concurrently (not in latest run).

### Risk

These TSC errors propagate at production build (Next.js fails build on
TS errors by default). Wave 2 ship clean requires the full TSC pass,
which Dike audit will require per Wave 2 audit gate contract.

### Mitigation

Asclepius does NOT modify Persephone (BroadcastToggle, ResidentAvatar)
or Hera (SprintMode) files per Lock 3 + Lock 7 anti-pattern hard locks.
Surface this to V1 Orch via uncertainty journal so the sibling workers
can fix their deltas before Dike Wave 2 audit. Asclepius-owned files
TSC clean: `npx tsc --noEmit` zero errors when only filtering the
Asclepius scope.

### Action

V1 Orch dispatches Persephone + Hera fix sweeps before Dike Wave 2 audit
spawn; Asclepius ships clean against its own files.

## U-Ascl-002: Refactor ghost building position collision with treemap

**Confidence**: medium
**Severity**: low (mock positions chosen well outside treemap bounds)
**Status**: documented, future Pandora hint computation must verify

### Context

Mock ghost building positions in `__mock__/proposal.ts`:

```
ghost-2fa-verifier: [68, 0, -22]
ghost-2fa-migration: [78, 0, -22]
```

Iris squarified treemap fits ~240 buildings within roughly [-60, +60] on
x/z based on the mockCityData dimension setup. The mock positions sit
just outside that envelope so ghosts do not collide with real buildings
during the smoke route demo.

### Risk

Wave 3 Pandora's `_publish_proposal` is responsible for computing ghost
positions; nothing in the current contract `asclepius-to-pandora.md`
forbids collision with existing buildings. If a real proposal positions
a ghost at x=10, z=10 (a real building exists there), the ghost mesh
will z-fight with the real Iris InstancedMesh.

### Mitigation

Document at Pandora handoff `wave2_asclepius_to_pandora.md` so Pandora
honors a collision-aware position picker. Alternative: pick ghost
positions deterministically as a fixed offset (e.g., +5 world units past
the treemap envelope on the side closest to the affected buildings),
which is the strategy gw used in the mock. Asclepius does not own this
algorithm.

## U-Ascl-003: Dual review gate state machine when Discard during in-flight

**Confidence**: medium
**Severity**: low (terminal stage 'discarded' triggers fadeOut animation)
**Status**: gw made a choice, document for Pandora coordination

### Context

PRD Section 9.3 + Pythia contract describe the simulation lifecycle but
don't fully specify the discard-during-in-flight semantics. Options:

1. Discard during 'tests_generating' / 'impl_generating' / 'diff_serializing'
   aborts the in-flight LLM call + Pandora cleans drafts immediately.
2. Discard waits for stage 'completed' (button disabled in-flight).
3. Discard during in-flight transitions to 'discarded' on client; Pandora
   races to cancel any in-flight LLM call.

### Decision in DualReviewGate

Option 1 + 3 hybrid: button enabled during in-flight stages (IN_FLIGHT_STAGES
array). Client-side stage flips to 'discarded' immediately on click,
GhostToSolidAnimation runs fadeOut. Wave 3 Pandora is responsible for
canceling the in-flight LLM turn + cleaning the drafts directory.

### Risk

Wave 3 Pandora may not have a cancel mechanism for V4-Pro thinking high
in-flight turns (DeepSeek API does not document mid-turn cancel as of
2026-05-12). Drafts cleanup is a follow-up best-effort.

### Mitigation

Handoff doc surfaces this; Pandora Wave 3 documents the chosen cancel
strategy (best-effort cancel + cleanup-on-next-poll) in
`pandora-to-asclepius.md` v2 if needed.

## U-Ascl-004: HUD panel mount on /city via Persephone is async

**Confidence**: medium
**Severity**: low (smoke route stable; Persephone integration is one
import line away)
**Status**: documented, blocking for Wave 2 Dike audit IF strict

### Context

Asclepius ship deliverables are 12 component files + 1 smoke route. The
canonical mount target for the HealthMode + RefactorMode HUD panels is
the Persephone `@side/[mode]/page.tsx` slot (per Persephone Wave 2 ship
criteria + Pythia contract `calliope-to-wave2-panels.md`). Persephone
spawned in parallel with Asclepius at the same Wave 2 spawn moment,
so Persephone's slot router may not yet exist.

### Risk

If Dike Wave 2 audit checks for the HUD panels mounted on `/city`
specifically (not `/asclepius-smoke`), the audit may fail on visual
inspection of /city while passing on /asclepius-smoke.

### Mitigation

Asclepius barrel re-exports `HealthMode` + `RefactorMode` as 1-line
import targets for Persephone. Smoke route exercises identical
component tree so the visual is verifiable. Once Persephone ships the
mode-routed side panel, integration is a `<RefactorMode />` or
`<HealthMode />` mount inside Persephone's `@side/[mode]/page.tsx`
component. No code change to Asclepius.

Document at handoff `wave2_asclepius_to_pandora.md` + visible via
`@/modes/{health,refactor}` barrel index entries.

## U-Ascl-005: Pulse animation cost at city scale (many critical findings)

**Confidence**: low
**Severity**: low (Wave 2 mock has 2 critical findings, well below cost)
**Status**: documented, Wave 3 Nemesis cardinality determines

### Context

GlowWindow pulses critical-severity findings via useFrame, modulating
emissiveIntensity each frame. At 240 building scale with N critical
findings, the pulse loop runs N times per frame.

### Risk

Mock = 2 critical findings, well within budget. Wave 3 Nemesis publishing
50+ critical findings (e.g., a CVE storm in a 5000-file repo) could
produce 50 useFrame callbacks per frame. Each callback only updates one
material's emissiveIntensity, no allocation, but the React 19 reconciler
loop could surface as a perf hit if Nemesis publishes 200+ findings.

### Mitigation

PRD Section 13.4 + Lighthouse 85+ floor (Dike Wave 2 audit item):
Asclepius ships with the 6-finding mock = 2 critical. If Wave 3
empirically tips over the 85+ Lighthouse, Pan post-Wave 3 polish can
introduce a critical-cap (e.g., only pulse the top-10 most-recent
critical) or move pulse to a single shared material uniform driven by a
global useFrame.

## U-Ascl-006: TSC strict + r3f material type narrowing required `unknown` cast

**Confidence**: high (works correctly at runtime; TSC type quirk)
**Severity**: low (defensive cast pattern matches Iris ref usage)
**Status**: documented, no further action

### Context

`mesh.material` typed by Three.js as `Material | Material[]` (multi-material
support). r3f doesn't narrow it for the JSX `<meshStandardMaterial>`
case. TSC strict mode rejects the direct cast `as { opacity: number, ... }`
because the types do not overlap "sufficiently".

### Decision in GlowWindow + GhostBuilding

Defensive cast pattern:

```typescript
const raw = mesh.material;
const mat = (Array.isArray(raw) ? raw[0] : raw) as unknown as {
  opacity?: number;
  emissiveIntensity?: number;
} | undefined;
```

The two-step cast `as unknown as` is the canonical TSC strict mode
escape hatch for narrowing intent. Runtime behavior identical.

### Mitigation

None needed; pattern is idiomatic. Consider extracting to a small helper
`materialAt<T>(mesh)` if a Wave 3 pass adds more emissive shader mutators.
