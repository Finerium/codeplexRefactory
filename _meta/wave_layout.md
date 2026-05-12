# Wave Layout (Full, Canonical)

**Translated from**: `_meta/metis/Agentic_Structure-codeplex-chronicle.md` Section 4 (Wave Layout, Full)
**Translated by**: Themis (Wave 0 specialist)
**Translation date**: 2026-05-12 16:30 WIB
**Status**: locked (mirrors Metis canonical, enriched with hard handoff timestamps + auditor gate cross-refs)

## Purpose

Defines wave boundaries, capacity allocation, wall-clock targets, goals per wave, ship criteria per wave, and the auditor gate that must clear before the next wave spawns. Use this layout to:

1. Pace V1 Orch wave-by-wave dispatch
2. Verify capacity budget is honored (no overload beyond allocation)
3. Reference auditor gate criteria for Eunomia (Wave 1) / Dike (Wave 2) / Aletheia (Wave 3) pre-spawn checklist
4. Set hard handoff timestamps for cross-wave transitions
5. Plan sleep-cycle rotation (Ghaisan + Hafiz, hands-off mode)

## Wave Layout Table

| Wave | Capacity % | Wall-clock (24h base) | Hard handoff timestamp | Goal | Ship criteria summary | Auditor gate |
|---|---|---|---|---|---|---|
| **0** | 12% | ~2.9 hours (~13:00-16:00 Day 1) | Wave 0 end ~16:00 WIB Day 1 | Blueprint locked + Themis extended duties (C4 + openspec + ERD + PanitSubmission) | All `.claude/agents/*.md` ready, `_meta/` canonical, `docs/c4/` populated, openspec enriched, PanitSubmission seeded, STATUS.md initialized | (none, optional Pan smoke-check; Wave 0 internal handoff verified via Pythia + Hephaestus + Themis self-audit per 20-item checklist) |
| **1** | 22% | ~5.3 hours (~16:00-21:30 Day 1) | Wave 1 to Wave 2 ~21:30 WIB Day 1 | Visual foundation runnable | Canvas + InstancedMesh + 3 Designer pages render, mock data loaded, Eunomia audit pass | **Eunomia** mandatory pre-Wave 2 spawn (audit file `_meta/audit/eunomia_wave1_audit.md`, binary PASS/FAIL; FAIL = re-spawn failed Wave 1 worker with correction OR ferry V1 Orch drop protocol decision) |
| **2** | 30% | ~7.2 hours (~21:30 Day 1 - ~04:45 Day 2) | Wave 2 to Wave 3 ~04:45 WIB Day 2 | Visual modes operational | 5 modes visual + 14 PM overlay + UI panels + OQ-02/03/05 decided, Dike audit pass | **Dike** mandatory pre-Wave 3 spawn (audit file `_meta/audit/dike_wave2_audit.md`, binary PASS/FAIL) |
| **3** | 28% | ~6.7 hours (~04:45 Day 2 - ~11:30 Day 2) | Wave 3 end ~11:30 WIB Day 2 | Backend full + integration + deploy | Real FastAPI + DeepSeek per-resident routing + GitHub OAuth + webhook + detectors fire + drafts/ simulation + Postgres event store + K8s deploy live at domain, Aletheia final audit pass | **Aletheia** mandatory pre-Pan spawn (audit file `_meta/audit/aletheia_wave3_audit.md`, binary PASS/FAIL) |
| **Post-3 (Pan)** | 8% | ~1.9 hours (~11:30 Day 2 onwards, including jam 13-15 rehearsal window) | Submission window Day 2 jam 11-13 WIB + pitch Day 2 jam 15-17 WIB kalau top 5 | Polish + demo rehearsal + slide deck prompt + bug sweep + rescue | Demo flow 3x consecutive run, slide deck Hafiz-ready, 0 bug regression, ready Day 2 jam 15-17 pitch window | (none, Pan reports directly to operator; Aletheia handoff doc `_meta/contracts/aletheia-to-pan.md` consumed as input) |

**Capacity sum validation**: 12 + 22 + 30 + 28 + 8 = **100%** (exact).

## Capacity Allocation Rationale

Per Metis Section 4 rationale (line 197-204):

- **Wave 0 = 12%** includes Themis extended duties (C4 + openspec enrichment + ERD + PanitSubmission); without those Themis would be 8-10%. The extra 2-4% absorbs panitia submission deliverable burden upfront so Wave 1-3 workers focus on product, not artifact curation.

- **Wave 1 = 22%** slightly above default standard because visual-first sequencing puts foundation burden here (3D scene scaffold + 5 archetype InstancedMesh + 3 Designer pages). Phase B H1 hypothesis validation point (60fps M-series MBP 16GB with 200-300 building stub + full pipeline ON).

- **Wave 2 = 30%** within default range but trimmed because 4 workers vs typical 5+; HERO mode Hera carries differentiator weight. Sprint Mode = THE differentiator (14 PM concept overlay), so Hera gets xhigh effort tier and biggest budget chunk.

- **Wave 3 = 28%** above default standard, hedging against Wave 3 squeeze risk per Phase B research warning (6 workers covering FastAPI + tree-sitter + DeepSeek defensive + 11 detectors + Refactor engine + Postgres + K8s deploy = integration density high). The extra capacity prevents Wave 3 from being squeezed by Wave 2 spillover.

- **Pan post-3 = 8%** mid-range of 5-10% buffer default, hackathon-sprint variant. Pan handles: demo rehearsal 3x + slide deck prompt + bug sweep + polish + rescue if auditor escalates + lesson-learned author on session close.

## Visual-First Inversion (per AD-05 + Section C idea-draft)

**Standard hackathon-sprint pattern**: backend foundation first (Wave 1) → API integration (Wave 2) → frontend polish (Wave 3).

**Codeplex Chronicle inversion**: visual foundation first (Wave 1) → visual modes (Wave 2) → backend full (Wave 3).

**Rationale**: Wave 1+2 combined = 52% (majority of total capacity) satisfies visual-first sequencing mandate. Visual quality bar = non-negotiable per PRD Section 13 (cinematic restraint, glassmorphism atmospheric, Awwwards-tier feel). Difficult to revise visual quality late in hackathon. Backend integration density Wave 3 higher than typical hackathon Wave 3, hence 28% allocation hedging.

## Hard Handoff Timestamps

| Boundary | Target time WIB | Slip tolerance | Action if slip |
|---|---|---|---|
| Wave 0 → Wave 1 | ~16:00 Day 1 | up to 30 min (Wave 1 start ~16:30 max) | Ferry V1 Orch if > 30 min slip; defer Themis non-priority tasks (Code tier C4, ERD enrichment) to Pan post-Wave 3 |
| Wave 1 → Wave 2 (post Eunomia PASS) | ~21:30 Day 1 | up to 1 hour (Wave 2 start ~22:30 max) | Ferry V1 Orch if > 1 hour slip; consider drop protocol Layer 1+2 for Wave 2 simplification |
| Wave 2 → Wave 3 (post Dike PASS) | ~04:45 Day 2 | up to 1 hour (Wave 3 start ~05:45 max) | Ferry V1 Orch if > 1 hour slip; consider drop protocol Layer 2 (Refactor Mode multi-turn) for Wave 3 simplification |
| Wave 3 → Pan (post Aletheia PASS) | ~11:30 Day 2 | strict (Pan starts immediately to fit pre-submission jam 11-13 window) | Submission jam 11-13 NEGOTIABLE per Refactory portal upload timing; pitch jam 15-17 NEGOTIABLE only if top 5 |
| Submission deadline | Day 2 jam 13:00 WIB | strict per Refactory rule | Ferry operator (Ghaisan/Hafiz) for portal upload; Pan polishes slides + ensures repo link + demo URL live |
| Pitch (if top 5) | Day 2 jam 15:00-17:00 WIB | strict per Refactory rule | Hafiz physically attend MANDATORY per Refactory rule (absence = withdrawal) |

## Auditor Gate Detail

### Wave 1 → Eunomia (binary PASS/FAIL)

Per `_meta/contracts/eunomia-wave1-audit.md` + `.claude/agents/eunomia.md`:
- H1 performance assertion: r3f Canvas + InstancedMesh + 200-300 building stub sustains 60fps on M-series MBP 16GB with Daedalus full pipeline ON (Bloom + DepthOfField + Sparkles tier-3 + third directional)
- `state.performance.regress()` fires correctly on OrbitControls onChange
- Drop-first feature flag order verified (DepthOfField first, then pixel ratio, then Sparkles)
- 3 Designer page mount assertion (`/landing`, `/start` entry, `/dashboard`) render no console error
- OpenSpec validate clean Folder A
- Contract conformance (Iris BuildingData + Daedalus ChronicleCanvas + Selene DashboardData + Hestia OAuth stub + Calliope parallel route slots match Pythia contracts)
- Lighthouse 90+ all 4 metric per Designer page
- Console error scan 0 React + 0 r3f warnings
- Designer cross-page cohesion (typography family + glassmorphism)
- Feature flag toggle works via env var no rebuild
- Smoke test full E2E chain

### Wave 2 → Dike (binary PASS/FAIL)

Per `_meta/contracts/dike-wave2-audit.md` + `.claude/agents/dike.md`:
- 5 modes visual operational (Onboarding + Sprint HERO + Refactor + Activity + Health)
- 14 PM concept overlay Sprint Mode toggle-able + filterable per status
- OQ-05 PR comment surfacing decided + non-overlap check no z-fighting with scaffolding/crane/banner
- Chat panel + ticket panel + side panel slide-in/out smooth 0 console warning
- Glassmorphism WCAG AA contrast verify
- Lighthouse 85+ Performance with 5 modes active console clean
- Integration: Hera click building to Persephone ticket panel works
- Asclepius Refactor ghost-to-solid handoff hooks ready
- Boreas camera fly smooth no jitter 60fps

### Wave 3 → Aletheia (binary PASS/FAIL, final audit)

Per `_meta/contracts/aletheia-wave3-audit.md` + `.claude/agents/aletheia.md`:
- Deploy live + accessible at `duopoly.hackathon.sev-2.com` external network
- 5 modes E2E real backend no mock left
- Demo flow 2-min 3x consecutive trial run pass no mid-run recovery
- OpenSpec validate clean Folder A + Folder B
- GitHub OAuth real flow E2E (browser to consent to callback session)
- GitHub webhook receives events from real PR on demo repo
- DeepSeek per-resident routing verified
- Canned cache hit top-10 demo questions latency under 100ms
- Lighthouse 85+ maintained landing + entry + dashboard no regression
- Console error scan 0 errors 0 warnings on full demo flow
- PanitSubmission final curation review C4 final + openspec snapshot + ERD final + PRD copies + spec-drift algo notes + revision history

## Sleep-Cycle Awareness

Tim 2 orang (Ghaisan + Hafiz), hands-off operator mode. Sleep-cycle rotation:

- **Day 1 ~13:00-21:30 (Wave 0+1)**: kedua operator awake, monitoring + relay handoff antar agent + decision approval gate
- **Day 1 ~21:30 - Day 2 ~04:45 (Wave 2)**: rotation begins. Hafiz handle saat Ghaisan tidur, Ghaisan handle saat Hafiz tidur. Bukan domain split, bukan tugas spesifik. Hands-off mode tetap.
- **Day 2 ~04:45-11:30 (Wave 3)**: rotation continues. Both should be awake by ~10:00 for Aletheia audit + Pan spawn.
- **Day 2 ~11:30-13:00 (Submission window)**: both operators awake, Hafiz finalize slides, Ghaisan submission upload.
- **Day 2 ~13:00-15:00 (Rehearsal if top 5)**: Pan run demo rehearsal 3x consecutive, both operators rehearse pitch script (per PRD Section 15).
- **Day 2 ~15:00-17:00 (Pitch window if top 5)**: Hafiz physically attend MANDATORY (Refactory rule). Ghaisan remote support OK.

## Source citation

- **Metis Section 4 (Wave Layout, Full)**: line 185-204 of `_meta/metis/Agentic_Structure-codeplex-chronicle.md`
- **Auditor contracts**: `_meta/contracts/eunomia-wave1-audit.md`, `_meta/contracts/dike-wave2-audit.md`, `_meta/contracts/aletheia-wave3-audit.md`, `_meta/contracts/aletheia-to-pan.md`
- **PRD AD-05 visual-first sequencing**: `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` Section 8 + AD-05 Decision Log
- **Refactory rules**: `docs/context/RefactoryHackathonRules&FAQ.txt` + PRD Section 24.1

## Open evolution path

If wave wall-clock slips beyond tolerance:
1. Ferry V1 Orch (Themis post-Wave 0 retired per Lock 9)
2. V1 Orch evaluates drop protocol options:
   - Layer 1 drop (Hybrid Write Apollo → GitHub issue)
   - Layer 2 drop (Refactor Mode simulation engine)
   - Visual feature flag drop (DepthOfField → Sparkles tier-3 → third directional)
   - Defer Themis non-priority tasks to Pan post-Wave 3
3. Decision documented `_meta/decisions/wave_slip_<N>.md`

---

**End of `_meta/wave_layout.md`**. Downstream consumption: V1 Orch references this file pre-wave-spawn to verify capacity + check hard handoff timestamp. Auditors reference this file to confirm wave ship criteria before clearing the gate.
