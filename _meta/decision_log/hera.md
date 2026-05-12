# Hera Decision Log

**Worker**: Hera (Wave 2, Sprint Mode HERO 14 PM concept overlay architect)
**Spawned**: 2026-05-12 22:45 WIB
**Effort tier**: xhigh (Hera prompt Section 4 + effort max session-wide override)
**Domain**: Sprint Mode HERO end-to-end visual implementation per PRD Section 9.2 + OQ-05 PR comment surfacing + click-to-ticket-panel routing + PR-to-Building state machine + WebSocket consume stub.

---

## D-Hera-01 (Cycle 1, 2026-05-12 ~23:00 WIB): Adopt zustand 5.0.13 for heraStore cross-tree state

**Decision**: Install zustand@latest (resolved 5.0.13) into `frontend/` via `npm install zustand --legacy-peer-deps`. Author `frontend/src/modes/sprint/heraStore.ts` as the canonical Pythia-defined cross-tree state container per `_meta/contracts/hera-to-persephone.md` lines 22-88.

**Rationale**:
1. Pythia contract `hera-to-persephone.md` Asumption 1 explicitly mandates "Zustand chosen over React Context for cross-tree state sharing (sprint overlay visual lives in Canvas tree, ticket panel lives in aside slot; Zustand cuts through tree boundaries)". The 3D sprint overlay components are children of `<ChronicleCanvas>` inside `app/city/page.tsx main`, while Persephone's TicketPanel lives in `app/city/@ticket/default.tsx` aside slot. React Context across this parallel-route boundary requires lifting state to the layout, which couples Persephone to Hera's tree.
2. zustand 5 supports React 19 + Next.js 16 SSR safely via `useStoreWithEqualityFn` + selector-based subscription.
3. `--legacy-peer-deps` flag accepted because @react-spring 9.7.5 still declares peer react@18 (legacy upstream lag, harmless override; existing Daedalus + Iris install already runs this pattern per Wave 1 ship).
4. Lock 8 (no paid services) clean: zustand is MIT open source.

**Alternative considered**: React Context provider at `<ChronicleCanvas>` root. Rejected because Persephone TicketPanel lives in a different parallel-route subtree and Next.js 16 parallel routes do NOT share Context across slot boundaries without lifting state to `app/city/layout.tsx`; that lift requires Calliope's layout file edit (Wave 1 owner) which is out of Hera Wave 2 scope per Lock 4 (no unilateral cross-worker file mutation).

**Risk**: zustand 5 minor breaking changes from 4 (selector signature stricter). Mitigation: heraStore uses `create<HeraStoreState>()` + selectors with explicit equality functions; canonical pattern from zustand docs.

---

## D-Hera-02 (Cycle 1): OQ-05 PR comment surfacing variant locked to Sticky Note 3D

**Decision**: PR comment surfacing visual = sticky note 3D variant. Details in `_meta/decisions/oq05_pr_comment_surfacing.md`.

**Rationale** (summary, full doc in side decision):
- PRD line 244, 497, 1004 already name sticky note in user story + visual convention + demo script
- Non-overlap matrix shows sticky note thin vertical band (y in [height+0.4, height+1.6]) sits comfortably under crane (y >= height+1) and under DoD checklist (y >= height+2), above yellow tape (y <= 1.5)
- Athena landmark banner collision solved by back-face placement (1-line conditional)
- Implementation cost moderate (~30 line), fits Cycle 3 budget
- Variant fallback to Marker Pin reserved if Dike audit gate spots z-fight on M1 GPU

**Authority**: Hera per Pythia contract `iris-to-hera.md` line 159 + `.claude/agents/hera.md` Section 4 OQ-05 mandate.

---

## D-Hera-03 (Cycle 1): SprintStatus state machine reconciliation between PRD lifecycle + Pythia contract

**Decision**: Use the Pythia contract `hera-to-persephone.md` line 27-32 vocabulary as the canonical SprintStatus enum: `'foundation' | 'frame' | 'painting' | 'finished' | 'unfinished'`. Map the PRD Section 9.2 PR webhook event sequence (PR opened, review_requested, approved, merged, closed-without-merge) onto these 5 states deterministically.

**Mapping**:

| PR-to-Building event | From state | To state | Visual outcome |
|---|---|---|---|
| Issue opened, no PR yet | initial (no entry) | `foundation` | Building lit, scaffolding NOT yet, foundation tier only |
| PR opened | `foundation` | `frame` | Scaffolding wraps, crane appears, blueprint pin |
| Review requested | `frame` | `painting` | Inspector NPC orbits, crane keeps spinning |
| Review approved (all required) | `painting` | `painting` (stays until merge) | Persistent painting state; PR approved triggers green halo SEPARATELY for 30-min transient (not a state transition, a side-effect transient overlay) |
| PR merged | `painting` | `finished` | Crane removes, scaffolding clears, brief 30-min green halo, building solid |
| PR closed without merge | `painting` / `frame` | `unfinished` | Crane removes, scaffolding clears, no glow, ticket status update |
| CI/test failure (composite event) | any active state | stays + adds smoke+retak overlay | Visual side-effect, NOT state transition (orthogonal to lifecycle) |
| Issue closed (with merge) | `finished` | `finished` (done) | No change |
| Issue closed (without merge) | active state | `unfinished` | drift Pattern B |

**Rationale**: Pythia `hera-to-persephone.md` Asumption 2 + `hera-to-hades.md` line 100-103 + PRD Section 9.2 PR webhook list anchor the 5 lifecycle stages. The Hera prompt Section 5 example uses different verbs (`'planning'|'in_progress'|'review'|'approved'|'merged'|'blocked'|'failed'|'done'`) but that conflicts with the LOCKED Pythia contract; I follow the Pythia contract canonical names because they map to Persephone TicketPanel consumption fields verbatim and Wave 3 Hades webhook receiver translates webhook events onto these same names per `hera-to-hades.md` line 100-103 `SprintTransitionPayload`. The Hera prompt example is illustrative-only.

**Side overlays orthogonal to state machine**:
- Green halo (PR approved 30-min transient): timestamp-based decay, attaches to building when `prApprovedAt` set, fades to 0 over 30 min, NOT a state value
- Smoke + retak (CI fail): boolean flag `metadata.ciFailed`, additive overlay on top of any state
- Yellow tape (blocked / help wanted label): boolean flag `metadata.blocked`, additive overlay on top of any state
- Red bridge (dependency edge): edge-level not building-level state
- Inspector NPC: derived from state `'painting'`

**Risk**: Hades Wave 3 webhook receiver MUST translate `pr.review.submitted (state=approved)` -> SprintTransitionPayload `fromStatus: 'painting', toStatus: 'painting'` + side-effect `prApprovedAt` field write. Hera handoff `_meta/handoff_log/wave2_hera_to_hades.md` documents this explicit translation requirement; Hades cannot transition to a non-existent state.

---

## D-Hera-04 (Cycle 1): Mount strategy = Drei `<Html>` for 2D HUD overlays + r3f meshes for 3D-anchored geometry

**Decision**: Split overlay concerns into two render modes:

- **3D-anchored** (geometry that needs depth + transform inheritance): Scaffolding, Crane, BlueprintPin, InspectorNPC, GreenHaloGlow, YellowTape, RedBridge, DistrictBorder, CityHallBanner (banner ribbon mesh), SmokeRetakOverlay -> author as r3f `<group>` + r3f primitives, mounted as children of `<ChronicleCanvas>` inside `app/city/page.tsx CityScene` SIBLING to BuildingInstances
- **HUD-style** (text/badge/checklist that should always face camera + crisp text): SizeBadge, DoDChecklist, PRCommentSurface (sticky note with text body), CityHallBanner text label -> use Drei `<Html>` portal with `transform` + `occlude="blending"` + `distanceFactor` for size-on-zoom. r3f handles depth via Drei's portal stencil.

**Rationale**:
1. Drei `<Html>` portals out to DOM but respects 3D position + depth via `occlude` prop. Text remains crisp without SDF font shader pain. Badge rendering via shadcn Badge primitive (Persephone Wave 2 installs) for chip-style.
2. Pure r3f `<group>` mesh path avoids HTML reflow cost on the high-instance overlays (scaffolding + crane + halo all attach to many buildings, HTML cost prohibitive at 50+ active overlays). r3f mesh + InstancedMesh-for-particles pattern keeps draw-call budget intact.
3. Performance budget per PRD Section 13.4: 200-300 InstancedMesh buildings + post-pipeline = 60fps M-series target. Adding Drei `<Html>` per-active-overlay (worst case 14 concept x 50 buildings = 700 HTML portals) catastrophic. We constrain `<Html>` mount to: selected building only (1 PR comment panel), top-5 active sprint buildings (size badge + DoD checklist), and the 1 City Hall banner text. All other 14 concepts use pure r3f meshes.
4. SpritePerformance for size badge: Drei `<Billboard>` with `<Text>` (SDF) is the high-instance friendly path (no DOM cost). Used for size badge at scale.

**Performance budget envelope estimate**:
- Iris baseline: 8 InstancedMesh archetypes + ~240 instances per archetype average -> ~8 draw calls
- Hera additions (worst case demo scenario, ~20 active sprint buildings):
  - Scaffolding instanced: 1 draw call (one InstancedMesh shared across 20)
  - Crane geometry shared per active state: 1-3 draw calls (jib + cable + counterweight, instanced)
  - Blueprint pin (planning state, deferred Wave 3): 1 draw call
  - Inspector NPC: 1 draw call (instanced sphere + briefcase merged)
  - Green halo glow shader sphere: 1 draw call per active (max ~5 transient)
  - Yellow tape instanced: 1 draw call
  - Smoke + retak: 2 draw calls (particle billboard + decal plane)
  - Size badge `<Billboard><Text/>`: 5-10 draw calls (top sprints only)
  - DoD checklist `<Html>`: max 1-2 active (selected building only)
  - PR comment sticky note: 1 draw call per building with prComments, ~5 active
  - District border line: 1 draw call (Drei Line, shared geometry)
  - Red bridge: 1 draw call (instanced tube)
  - City Hall banner: 1 draw call (Athena landmark only, 1 instance)
- Total estimated: ~25-35 draw calls Hera-side + 8 Iris baseline + 4 post + 3 Sparkles + 5 environment = ~45-55 draw calls
- Budget per Hera prompt Section 4 Item 9: < 200 total. 73% headroom remaining.

---

## D-Hera-05 (Cycle 1): Mock event stream Wave 2 = setInterval-driven synthetic event tape

**Decision**: `frontend/src/modes/sprint/__mock__/sprint_mock_events.ts` defines a deterministic 15-event tape that drives the `useBuildingEvents` hook in absence of Wave 3 Hades WebSocket. Each event labeled `[MOCK Wave 2, real Wave 3 Hades webhook]` per Lock 5 honest claim discipline.

**Tape composition** (15 events fired across 90 seconds during demo):
1. `t=0s`: issue.opened on building A -> A enters `foundation`
2. `t=4s`: pr.opened on building A -> A `foundation -> frame`, scaffolding + crane + blueprint pin appear
3. `t=10s`: pr.review_requested on A -> A `frame -> painting`, inspector NPC appears
4. `t=14s`: comment.created on A unresolved -> sticky note appears with count=1
5. `t=18s`: comment.created on A unresolved -> count=2
6. `t=22s`: comment.created on A unresolved -> count=3 (matches PRD line 1004 demo "3 unread")
7. `t=28s`: issue.opened on building B (blocker) -> B `foundation`, blocked label, yellow tape on B
8. `t=32s`: dependency edge A -> B (red bridge appears)
9. `t=38s`: pr.approved on A (all required) -> green halo 30-min transient starts, inspector NPC fades
10. `t=44s`: pr.merged on A -> A `painting -> finished`, crane removes + scaffolding clears, green halo continues
11. `t=52s`: ci.fail on building C (orthogonal smoke+retak) -> smoke billows, crack pattern appears
12. `t=58s`: issue.closed on A -> A stays `finished`, done state confirmed
13. `t=66s`: comment.created on C resolved -> badge appears with count=1 + resolved tick
14. `t=74s`: building D enters `frame` (parallel PR demo)
15. `t=82s`: end-of-tape, halo on A reaches ~26% opacity (decay 30-min curve sampled)

Demo loop: tape resets at t=90s for replay-ability during pitch rehearsal. Tape buildings A, B, C, D pinned to first 4 buildings of mockCityData (deterministic, no random selection).

**Rationale**: Tape encodes the demo script (PRD line 1004) so judges see the full state machine flow + 14 concepts active without manual click sequence. Lock 5 honest claim: file labeled `[MOCK]` at top + each event labeled in console log so audit + dev cannot mistake for real webhook.

---
