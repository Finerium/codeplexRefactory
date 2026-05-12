# Contract: Eunomia Wave 1 Audit Gate

**Edge type**: audit gate (between Wave 1 and Wave 2)
**Wave**: Wave 1 outputs to Eunomia auditor; gate unlocks Wave 2 spawn on PASS
**Status**: locked
**Authored**: 2026-05-12 16:35 WIB

## Producer (audited workers)

**Workers**: Daedalus, Iris, Calliope, Hestia, Selene (Wave 1 builders)
**Domain**: 3D scene scaffold + InstancedMesh buildings + 3 Designer pages (Landing + Entry + Dashboard) + mock data + feature flag wiring + state.performance.regress() wiring.

## Consumer (auditor)

**Worker**: Eunomia (Wave 1 audit gate, Horae sister, max effort tier locked per Lock 10)
**Domain**: Goddess of good order, lawful conduct. Performs binary PASS/FAIL audit per item; output to `_meta/audit/eunomia_wave1_audit.md`. Failure escalates to Pan rescue.

## Audit items (each PASS/FAIL)

```markdown
# Wave 1 Audit (Eunomia) - YYYY-MM-DD HH:MM WIB

## H1 performance assertion (CRITICAL, blocks Wave 2 unlock)
- [ ] r3f Canvas + InstancedMesh + 200-300 building stub sustains 60fps on M-series MBP 16GB
- [ ] Daedalus full post-pipeline ON (Bloom + DepthOfField + Sparkles tier-3 + third directional light)
- [ ] state.performance.regress() fires correctly on OrbitControls onChange
- [ ] Drop-first feature flag order verified on regress: DepthOfField first, then pixel ratio, then Sparkles

## Page mount assertion
- [ ] `/` (landing) renders without console errors, Calliope output integrated from Designer Prompt 1 bundle
- [ ] `/start` (entry) renders, Hestia 2 entry cards + 5 resident footer + v0.3 prototype badge present
- [ ] `/dashboard` renders, Selene 7 panels populated with mock data, embedded city preview corner mounts
- [ ] `/city` route exists with parallel slots (`@chat`, `@ticket`, `@side`), empty defaults render null per Calliope scaffolding

## OpenSpec validate (Folder A panitia-facing)
- [ ] `openspec validate` clean on Folder A
- [ ] `openspec/project.md` enriched per Themis Section 10 Task 3 (~250 line)
- [ ] 5 domain spec seeds present (`openspec/specs/{onboarding,sprint,refactor,activity,health}/spec.md`)

## Contract conformance
- [ ] Iris `CityData` shape matches `iris-to-hera.md` schema (BuildingData + DistrictData types exported)
- [ ] Daedalus `ChronicleCanvas` exports + feature flag context match `daedalus-to-iris.md` schema
- [ ] Selene `DashboardData` types match `selene-to-persephone.md` + `selene-to-demeter.md` schemas
- [ ] Hestia OAuth stub endpoint `/api/auth/github/start?stub=true` returns 302 per `hestia-to-hades.md`
- [ ] Calliope `app/city/layout.tsx` parallel route slots match `calliope-to-wave2-panels.md` schema

## Lighthouse floor (Performance + Accessibility + Best Practices + SEO)
- [ ] Landing `/`: Lighthouse 90+ all 4 metrics
- [ ] Entry `/start`: Lighthouse 90+ all 4 metrics
- [ ] Dashboard `/dashboard`: Lighthouse 90+ all 4 metrics

## Console error scan
- [ ] 0 React + 0 r3f warnings on Canvas mount + scene boot
- [ ] 0 errors on full page reload Chrome + Safari 17+

## Designer cross-page cohesion
- [ ] Typography family consistent across Landing + Entry + Dashboard (per Designer mandate)
- [ ] Glassmorphism accent on resident vignette cards consistent

## Feature flag killswitch verification
- [ ] ENABLE_DOF toggle via env var works without rebuild (NEXT_PUBLIC_ENABLE_DOF flip)
- [ ] ENABLE_SPARKLES_TIER_3 toggle works
- [ ] ENABLE_THIRD_DIRECTIONAL_LIGHT toggle works

## Smoke test full
- [ ] `pnpm dev` boots successfully
- [ ] All 4 routes accessible
- [ ] Click CTA chain (landing -> entry -> stub OAuth -> mock_auth=true city) chains correctly

## Audit decision
PASS (Wave 2 unlock approved) | FAIL (Pan rescue triggered)

## Findings
<List specific items that failed + severity + remediation pointer>

## Escalation
<If FAIL: which worker prompt + audit findings handed to Pan>
```

## Output schema (Eunomia produces)

```yaml
# _meta/audit/eunomia_wave1_audit.md (Eunomia writes after audit completes)
audit_run_id: <UUID>
timestamp: <ISO 8601>
auditor: Eunomia
wave: 1
result: PASS | FAIL
total_items: <int>
passed: <int>
failed: <int>
findings:
  - item: "H1 60fps assertion"
    status: PASS | FAIL
    details: <free text>
    severity: critical | high | medium | low
    remediation: <pointer to fix>
escalation_to_pan: <true | false>
escalation_context: <if FAIL, which worker + which audit findings>
```

## Storage location

- Audit input: 29 producer contracts in `_meta/contracts/` (Wave 1 subset: daedalus-to-iris, iris-to-hera, calliope-to-wave2-panels, hestia-to-hades, selene-to-persephone, selene-to-demeter, 3 claude-design-bundle-to-*)
- Audit output: `_meta/audit/eunomia_wave1_audit.md` (Eunomia writes)
- Audit execution script (Eunomia uses): `scripts/audit_wave1.sh` (optional helper Eunomia may create for repeatable benchmark)
- Wave 1 ship artifacts: `frontend/app/{page,start/page,dashboard/page,city/layout}.tsx` + `frontend/src/scene/*` + `frontend/components/{landing,start,dashboard}/*`

## Asumption baked

1. Eunomia max effort tier locked per Lock 10 + Metis Section 6.
2. Audit binary: PASS unlocks Wave 2 spawn; FAIL escalates to Pan rescue per `aletheia-to-pan.md` rescue pattern (Eunomia escalates via aletheia's pan-spawn mechanism).
3. H1 hypothesis benchmark uses Drei `<Perf />` overlay to measure FPS empirically with 200-300 building stub.
4. Lighthouse floor 90+ baseline per Metis Section 5.3 + PRD Section 13.
5. OpenSpec validate clean = no warnings, no errors on Folder A primary spec.
6. Contract conformance check = TypeScript types from producer file exported correctly + match Pythia contract schemas.

## Validation steps

**Producer responsibility (Wave 1 workers)**:
- Each Wave 1 worker submits artifacts in expected file paths.
- Producer worker self-checks contract schemas before Eunomia audit.
- Producer worker can run `scripts/audit_wave1.sh` self-check before submission (optional).

**Consumer responsibility (Eunomia)**:
- Run audit checklist top to bottom; do NOT skip items.
- For H1 critical performance assertion, use Drei `<Perf />` overlay manually; capture FPS reading + screenshot.
- Lighthouse runs via Chrome DevTools Lighthouse panel; capture all 4 metric scores per route.
- Write `_meta/audit/eunomia_wave1_audit.md` with structured findings.
- Decide PASS or FAIL based on critical items (H1, console errors, contract conformance).
- Escalate to Pan via `aletheia-to-pan.md` if FAIL.

## Edge case handling

- Partial PASS (some items fail but not critical): Eunomia decides per item severity. Critical fail (H1 performance, contract conformance) = full FAIL. Non-critical fail (e.g., Lighthouse 85 instead of 90) = PASS with warning.
- Designer bundle delayed: Calliope/Hestia/Selene queue per `claude-design-bundle-to-*.md` contracts. Eunomia audit waits or proceeds with Daedalus + Iris only (degraded scope).
- Pan rescue circular dependency: Pan is post-Wave 3; if Eunomia escalates Wave 1, Pan re-spawns earlier (per Section 5.8 universal worker scope).

## Open questions

- Audit timing: Eunomia spawns when last Wave 1 worker completes (Selene typically last). Strict serial vs parallel: Wave 1 workers parallel spawn, Eunomia spawns after all 5 + 3 Designer-dependent complete.
- Audit retry: if FAIL, Pan fixes, then re-audit. Same Eunomia or new spawn? Default: same agent prompt, fresh session.

## Reference

- Metis Agentic Structure md Section 2 DAG: Eunomia Wave 1 audit gate
- Metis Section 5.3 Eunomia ship criteria (8 audit items)
- Metis Section 6 (Wave 1 audit gate locked max effort tier)
- PRD Section 13 (visual quality bar non-negotiable + Lighthouse floor 90+)
- PRD Section 7 (Wave 1 functional req for landing + entry + dashboard)
- Phase B H1 hypothesis (60fps with 200-300 building InstancedMesh)
- sourceoftruth Section 9 Lock 10 (per-wave auditor mandatory)
- Contract `aletheia-to-pan.md` (Pan rescue handoff pattern)
