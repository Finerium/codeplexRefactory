# Contract: Dike Wave 2 Audit Gate

**Edge type**: audit gate (between Wave 2 and Wave 3)
**Wave**: Wave 2 outputs to Dike auditor; gate unlocks Wave 3 spawn on PASS
**Status**: locked
**Authored**: 2026-05-12 16:38 WIB

## Producer (audited workers)

**Workers**: Hera, Asclepius, Boreas, Persephone (Wave 2 visual mode workers)
**Domain**: Sprint Mode HERO + Health Mode glow + Onboarding camera fly + Refactor Mode ghost + Activity timeline + chat/ticket/side panel UI architecture.

## Consumer (auditor)

**Worker**: Dike (Wave 2 audit gate, Horae sister, max effort tier locked per Lock 10)
**Domain**: Goddess of justice, fair judgment. Performs PASS/FAIL audit per item; output to `_meta/audit/dike_wave2_audit.md`. Failure escalates to Pan rescue.

## Audit items (each PASS/FAIL)

```markdown
# Wave 2 Audit (Dike) - YYYY-MM-DD HH:MM WIB

## 5 modes visual operational
- [ ] Onboarding Mode: camera fly + Hermes narration overlay + 30-sec tour ending summary
- [ ] Sprint Mode HERO: 14 PM concept overlay toggle-able + filterable
- [ ] Refactor Mode: ghost building + ghost-to-solid animation (mock data Wave 2) + dual review gate buttons UI
- [ ] Activity Mode: timeline scrubber 30/60/90 day + hotspot intensity glow + ownership heatmap toggle
- [ ] Health Mode: glow window per severity (red/orange/yellow) + Apollo findings panel UI

## 14 PM concept visual verification (Sprint Mode HERO)
- [ ] scaffolding visual on PR opened state
- [ ] crane visual on PR review requested state
- [ ] blueprint pin visual on issue assigned
- [ ] transient green glow on PR approved 30-min window
- [ ] yellow tape visual on PR blocked
- [ ] smoke/retak visual on critical error (Pattern E commit hook bypass) - handoff to Asclepius
- [ ] size badge visual on issue story points
- [ ] City Hall banner visual on milestone announcement
- [ ] district border visual on team boundaries
- [ ] DoD checklist visual on side panel mode ticket
- [ ] inspector NPC visual orbiting building on review
- [ ] red bridge visual on cross-team dependency
- [ ] ghost building visual on Refactor proposal handoff to Asclepius
- [ ] retak pattern visual on Pattern E drift handoff to Asclepius

## PR comment surfacing visual (OQ-05 decision verified)
- [ ] Hera decided OQ-05 from 3 candidates (sticky note 3D | floating bubble | marker pin + badge); document at `_meta/decisions/oq05_pr_comment_visual.md`
- [ ] Non-overlap check: PR comment visual does NOT z-fight with scaffolding + crane + banner layers (Dike critical check)

## Chat panel + ticket panel + side panel
- [ ] Chat panel slide-in/out smooth (~300ms)
- [ ] Chat panel 5-resident routing UI (target picker + response display)
- [ ] Ticket panel renders building sprint context from heraStore (per `hera-to-persephone.md`)
- [ ] Side panel 3 mode variant (refactor + health + activity) routes correctly
- [ ] Glassmorphism accent on resident vignette cards (Designer cross-page anchor)
- [ ] 0 console warnings on panel mount/unmount

## Performance + Lighthouse
- [ ] Lighthouse 85+ on Performance with 5 modes active (degraded from Wave 1 90+ acceptable due to scene complexity)
- [ ] FPS holds 30+ during heavy mode (Sprint Mode HERO + 14 PM overlay active + 200 building stub)
- [ ] Adaptive quality via Drei `<PerformanceMonitor>` works; pixel ratio drops on regress

## OQ-03 UI library lockdown
- [ ] Persephone Wave 2 + Selene Wave 1 consistency: same UI library (shadcn recommended)
- [ ] Document at `_meta/decisions/oq03_ui_library.md`

## Contract conformance
- [ ] heraStore types match `hera-to-persephone.md` schema (SprintStatus + BuildingSprintContext + PRComment)
- [ ] asclepiusStore types match `asclepius-to-triton.md` + `asclepius-to-pandora.md` schemas
- [ ] tourScript types match `boreas-to-triton.md` schema (TourWaypoint + TourVariant)
- [ ] Chat panel types match `persephone-to-triton.md` schema (ChatMessage + ChatThread)
- [ ] WebSocket event types match `hera-to-hades.md` + `nemesis-to-asclepius.md` schemas

## Console clean
- [ ] 0 console errors during 5-min soak test (mock event simulation)
- [ ] 0 React warnings (key prop, state mutation, etc.)

## Audit decision
PASS (Wave 3 unlock approved) | FAIL (Pan rescue triggered)

## Findings
<List specific items that failed + severity + remediation pointer>

## Escalation
<If FAIL: which worker prompt + audit findings handed to Pan>
```

## Output schema (Dike produces)

Same as Eunomia structure in `_meta/audit/dike_wave2_audit.md`:

```yaml
audit_run_id: <UUID>
timestamp: <ISO 8601>
auditor: Dike
wave: 2
result: PASS | FAIL
total_items: <int>
passed: <int>
failed: <int>
findings:
  - item: "14 PM concept N visual"
    status: PASS | FAIL
    details: <free text>
    severity: critical | high | medium | low
    remediation: <pointer to fix>
escalation_to_pan: <true | false>
escalation_context: <if FAIL>
```

## Storage location

- Audit input: 8 Wave 2 producer contracts (hera-to-*, asclepius-to-*, boreas-to-*, persephone-to-*) + 4 cross-wave inputs (iris-to-hera, calliope-to-wave2-panels, selene-to-persephone)
- Audit output: `_meta/audit/dike_wave2_audit.md`
- Wave 2 ship artifacts: `frontend/src/modes/{sprint,health,onboarding,refactor,activity}/*` + `frontend/components/panels/*` + parallel route slots `frontend/app/city/@{chat,ticket,side}/default.tsx`

## Asumption baked

1. Dike max effort tier locked per Lock 10 + Metis Section 6.
2. 14 PM concept visual verification = visual inspection per concept; Dike captures screenshots in `_meta/audit/screenshots/wave2/`.
3. Non-overlap check for PR comment surfacing: Dike toggles all 14 concepts simultaneously + verifies no z-fighting (per `iris-to-hera.md` OQ-05 constraint).
4. Mock data Wave 2 acceptable; Wave 3 swap is Wave 3 audit scope (Aletheia).
5. Lighthouse 85+ degraded from Wave 1 90+ acknowledged in Metis Section 5.5; reflects scene complexity vs page-only baseline.

## Validation steps

**Producer responsibility (Wave 2 workers)**:
- 5 modes visual operational with mock data.
- 14 PM concept visual coverage per Hera ship criteria.
- Panel architecture (chat + ticket + side) per Persephone ship criteria.
- OQ-05 + OQ-03 decisions documented.

**Consumer responsibility (Dike)**:
- Visual inspection per concept; toggle each on/off to confirm rendering.
- Cross-check contract schemas via TypeScript build (`pnpm tsc --noEmit`).
- Lighthouse measurement on city route with all modes available.
- Write `_meta/audit/dike_wave2_audit.md` with findings.
- Decide PASS/FAIL; escalate to Pan if FAIL.

## Edge case handling

- 1-2 PM concepts visually weak but functional: Dike PASS with warning (severity 'low').
- Z-fighting detected on PR comment surfacing: critical FAIL; Hera re-designs OQ-05 before Wave 3.
- Performance regress on full mode active: Pan rescue may drop feature flag (DoF off, Sparkles tier 2).
- Mock event simulation not implemented: Dike accepts Wave 3 real events as substitute audit data (audit re-runs after Wave 3 if needed).

## Open questions

- Lighthouse threshold floor: 85+ official Metis; if scene complexity warrants further degradation (e.g., 80), Dike documents + escalates to Pan for Pan Day 2 polish.
- OQ-05 visual decision authority: Hera has it, Dike audits non-overlap. Document decision rationale at `_meta/decisions/oq05_pr_comment_visual.md`.

## Reference

- Metis Agentic Structure md Section 2 DAG: Dike Wave 2 audit gate
- Metis Section 5.5 Dike ship criteria
- Metis Section 6 (Wave 2 audit max effort tier locked)
- PRD Section 9 (5 product modes functional req)
- PRD Section 13 (visual quality bar + accessibility floor)
- PRD Section 25 OQ-03 + OQ-05
- sourceoftruth Section 9 Lock 10
- Contract `eunomia-wave1-audit.md` (sibling audit pattern)
- Contract `aletheia-to-pan.md` (Pan rescue handoff)
