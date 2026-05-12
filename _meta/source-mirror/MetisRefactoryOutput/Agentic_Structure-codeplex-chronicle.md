# Agentic Structure: Codeplex Chronicle

**Authored by**: V1 Metis, 2026-05-12 ~12:15 WIB (master gabungan, locked)
**Source PRD**: `PRD-ideaLocked_codeplex-chronicle.md` (Council Phase F lock, 12 May 2026)
**Source Deep Research**: `compass_artifact_wf-96c21fb3-d652-4554-a319-b2c1cfc595e5_text_markdown.md` (Phase B artifact, downloadable from chat panel; full anchors + hypotheses + source citations live there, Section 8 below references only)
**Source operator directives**: Ghaisan intake (PanitSubmission folder mandatory, Themis C4 + openspec + ERD priority ordering, visual frontend-first sequencing per AD-05 + Section C idea-draft, worker design philosophy pintar multi-task per worker)
**Project type**: hackathon (24-jam build, Refactory Round 03 Telkom)
**Total agents**: 22 (3 Wave 0 + 5 Wave 1 + 4 Wave 2 + 6 Wave 3 + 3 auditor + 1 Pan)
**Peak simultaneous agents**: 6 (Wave 3, within Anthropic Agent Teams safe range per Phase B research)
**Total waves**: 4 (Wave 0-3) + Pan post-3
**Downstream consumption**: `/orches-v1` Mode A with PRD + this Agentic Structure + `prompt-design_codeplex-chronicle.md`

---

## 1. Project Recap

**Codeplex Chronicle** is an AI-resident development environment that visualizes real production codebases as living 3D cities. Files become buildings, folders become districts, errors become earthquakes you can feel. Five product residents (Athena/Apollo/Argus/Clio/Hermes) live in iconic landmark buildings and serve five product modes (Onboarding, Sprint hero, Refactor safety-first, Activity, Health). The city is interface plus memory hook, NOT value proposition; real value lives in the five product modes solving engineering productivity pain.

Tech stack locked: Next.js 16 + React 19 + Three.js 0.184 + @react-three/fiber 9.6 + Tailwind + GSAP frontend, Python 3.12 + FastAPI + tree-sitter 11-language grammar backend, DeepSeek V4-Flash + V4-Pro LLM (OpenAI ChatCompletions compat, 1M context, thinking-mode toggle), OpenSpec Fission-AI core profile dual-folder strategy (Folder A `openspec/` panitia-facing, Folder B `.agent-openspec/` internal), Kubernetes namespace `duopoly` + PostgreSQL Refactory pre-provisioned, GitHub OAuth via Finerium account.

Ship criteria high-level: deployed product at `duopoly.hackathon.sev-2.com`, 5 modes operational, demo flow E2E with 3x consecutive successful trial run, Awwwards-nominee tier visual quality bar, judge runs MVP themselves (not slides) per Refactory rubric. Submission Day 2 jam 11-13 WIB, pitch Day 2 jam 15-17 if top-5.

## 2. Task Graph (DAG, Full)

```
                              [Wave 0: 12% capacity, ~2.9 hours]

        Pythia (contracts per DAG edge)
                |
                | _meta/contracts/*.md per edge
                v
        Hephaestus (worker prompts + auditor prompts + PromptOpening-codeplex-chronicle.md)
                |
                | .claude/agents/<agent>.md + project-root PromptOpening
                v
        Themis (project-local setup + C4 + openspec enrichment + ERD + PanitSubmission)
                |
                | _meta/{metis,designer,orches}/*.md canonical
                | docs/c4/*.{md,svg,png}
                | openspec/{project.md ~250 line, specs/<domain>/spec.md seed}
                | PanitSubmission/{README.md, c4/, openspec-snapshot/, erd/, PRD copies}
                | STATUS.md initialized
                v
        [Wave 0 audit by Pan smoke-check, optional]
                |
                v
                              [Wave 1: 22% capacity, ~5.3 hours]

        Daedalus (3D scene scaffold + camera + post-pipeline + lighting + HDRI + feature flag wiring)
                |
                | Canvas mount target consumed by Iris
                v
        Iris (building geometry + InstancedMesh 5 archetypes + treemap layout + ownership color encoding)
                |
                | building data shape consumed by Hera Sprint overlay Wave 2
                v
        Calliope (Landing page exec from Prompt 1, Awwwards-tier static HTML)
                |
                | landing page mount-target consumed by Wave 2 chat-panel routing
                v
        Hestia (Entry page exec from Prompt 2, 2-card entry + 5 resident footer)
                |
                | OAuth handoff stub consumed by Wave 3 Hades real OAuth flow
                v
        Selene (Dashboard exec from Prompt 3, flat 2D manager-facing)
                |
                | dashboard data shape consumed by Wave 2 Persephone panel mounting
                v
        Eunomia (Wave 1 audit gate)
                |
                | audit: r3f render 60fps 200-300 building (H1), 3 page mount, openspec validate, contract conform
                v
        [unlock Wave 2 spawn]
                |
                v
                              [Wave 2: 30% capacity, ~7.2 hours]

        Hera (Sprint Mode HERO: 14 PM concept overlay + PR comment surfacing + ticket panel integration + PR-to-Building sync visual)
                |
                | sprint overlay state consumed by Persephone ticket-panel
                | building visual hooks consumed by Wave 3 Hades webhook receiver
                v
        Asclepius (Health Mode glow + Apollo findings panel + Refactor ghost building + drafts simulation visual + dual review gate buttons)
                |
                | glow-window state consumed by Wave 3 Triton resident response
                | ghost-to-solid animation consumed by Wave 3 Pandora simulation engine
                v
        Boreas (Onboarding camera fly + Hermes narration overlay + Activity timeline scrubber + hotspot intensity + ownership heatmap)
                |
                | tour script DSL consumed by Wave 3 Triton Hermes prompt-wiring
                | timeline state consumed by Wave 3 Demeter event-store query layer
                v
        Persephone (chat panel UI 5-resident routing + ticket panel UI + side panel UI + glassmorphism styling + decide shadcn vs Mantine OQ-03)
                |
                | panel slots consumed by Wave 3 Triton resident response stream
                v
        Dike (Wave 2 audit gate)
                |
                | audit: 5 modes visual + 14 PM overlay toggle + PR comment surfacing decided + panels render
                v
        [unlock Wave 3 spawn]
                |
                v
                              [Wave 3: 28% capacity, ~6.7 hours]

        Hades (FastAPI scaffold + tree-sitter 11-lang lazy-load + GitHub OAuth real + webhook HMAC + WebSocket)
                |
                | parser API consumed by Nemesis + Pandora
                | OAuth + webhook consumed by Demeter event ingestion
                v
        Triton (DeepSeek V4 client + defensive layer + thinking-mode toggle + per-resident routing)
                |
                | LLM client module consumed by Nemesis + Pandora + 5 resident query endpoints
                v
        Nemesis (5 Apollo detectors + Argus CVSS + 5 spec-drift patterns A-E)
                |
                | detection results -> Demeter event-store + Asclepius glow trigger
                v
        Pandora (Athena proposal author + OpenSpec change folder generator + Refactor simulation multi-turn + drafts/ isolation + dual review gate backend)
                |
                | simulation events -> Demeter event-store + Asclepius ghost-to-solid trigger
                v
        Demeter (PostgreSQL event store + 1-click GitHub issue + ticket state aggregation + cost tracking + OpenSpec runtime integration)
                |
                | event-store queries consumed by Selene dashboard + Boreas timeline scrubber
                v
        Atlas (Docker multi-arch + K8s manifests + NGINX verify + K8s Secret population + feature flag runtime + smoke test E2E)
                |
                | deployed at duopoly.hackathon.sev-2.com
                v
        Aletheia (Wave 3 final audit + handoff doc + PanitSubmission final curation review)
                |
                v
                              [Post-3 Pan: 8% capacity, ~1.9 hours]

        Pan (universal post-Wave 3 worker)
                |
                | demo rehearsal 3x consecutive + slide deck prompt template + bug sweep + polish + rescue
                v
        [Submission Day 2 jam 11-13 WIB]
                |
                v
        [Pitch (if top 5) Day 2 jam 15-17 WIB]
```

Interactive Phase D HTML diagram (separate artifact) surfaces hover-detail per node. Plain text DAG above is canonical for readability.

## 3. Roster (Full)

| Wave | Agent | Greek mythology basis | Domain ownership | Effort tier |
|---|---|---|---|---|
| 0 | **Pythia** | Oracle of Delphi (Apollo's prophetess) | Cross-agent contracts per DAG edge (input/output schema, dependency declaration) | max (locked) |
| 0 | **Hephaestus** | Smith god, craftsman of gods | Worker prompts + auditor prompts to `.claude/agents/`, plus `PromptOpening-codeplex-chronicle.md` to project root | max (locked) |
| 0 | **Themis** | Goddess of divine order, custom, fairness | Project-local setup + C4 + openspec enrichment + ERD + PanitSubmission curation + `_meta/` canonical files + STATUS.md (extended duties per Ghaisan directive, formalized in Section 10 delegation) | max (locked) |
| 1 | **Daedalus** | Master craftsman, labyrinth architect | 3D scene scaffold (Three.js + r3f Canvas + camera + lighting + fog + HDRI) + post-processing pipeline (Bloom + DepthOfField + Sparkles) + feature flag wiring + `state.performance.regress()` listener | xhigh |
| 1 | **Iris** | Rainbow messenger (DROPPED as runtime resident per PRD D11, reclaimed for build-time) | Building geometry (5 archetype + generic) + raw `<instancedMesh>` per archetype + squarified treemap deterministic layout + ownership color encoding + LOD/frustum culling | xhigh |
| 1 | **Calliope** | Eloquence muse, chief of nine muses | Landing page execution from `prompt-design` Prompt 1 (Awwwards-tier, dev-poetic copy voice, sticky-section + pinned-protagonist scroll, dark glass accent, three-mesh-gradient cinematic restraint) | high |
| 1 | **Hestia** | Hearth goddess, foundation | Entry page execution from Prompt 2 (replace Claude template, 2 entry cards, 5 resident footer, `v0.1 prototype` badge, GitHub OAuth handoff stub) | medium |
| 1 | **Selene** | Moon goddess, luminous spatial overview | Dashboard execution from Prompt 3 (flat 2D manager-facing: velocity + burndown + milestone + contributor + spec-drift + refactor status + cross-repo + embedded city preview) + decide charts library OQ-02 | high |
| 1 | **Eunomia** | Goddess of good order, lawful conduct (Horae sister) | Wave 1 audit gate: r3f 60fps assertion (H1), 3 page mount, openspec validate, contract conformance | max (locked) |
| 2 | **Hera** | Queen of gods, sovereignty/management | Sprint Mode HERO: 14 PM concept visual mapping overlay + PR comment surfacing visual decide OQ-05 + click building to ticket panel + PR-to-Building auto-sync webhook visual state machine | xhigh |
| 2 | **Asclepius** | Healing god, son of Apollo | Health Mode glow window per severity + Apollo findings panel UI + 1-click ticket viz + Refactor Mode ghost building + drafts/ simulation visual + ghost-to-solid animation + dual review gate buttons | high |
| 2 | **Boreas** | North wind, guidance/directed movement | Onboarding camera fly + Hermes narration overlay + 30-sec tour ending summary + Activity timeline scrubber 30/60/90 + hotspot intensity glow + ownership heatmap toggle | high |
| 2 | **Persephone** | Queen between two worlds, hidden/visible duality | AI residents chat panel UI + ticket panel UI + side panel UI + glassmorphism styling + decide UI library OQ-03 | high |
| 2 | **Dike** | Goddess of justice, fair judgment (Horae sister) | Wave 2 audit gate: 5 modes visual operational + 14 PM overlay toggle + PR comment non-overlap + panels render + Lighthouse + console clean | max (locked) |
| 3 | **Hades** | Underworld lord, foundational infrastructure | FastAPI async scaffold + tree-sitter 11-language lazy-load + GitHub OAuth real flow + webhook receiver HMAC + WebSocket setup | xhigh |
| 3 | **Triton** | Messenger of the sea, fluid coordination | DeepSeek V4 client + defensive layer (semantic cache + canned response + retry + fallback + circuit breaker) + thinking-mode toggle + per-resident model routing | xhigh |
| 3 | **Nemesis** | Retribution, finds wrongdoing | 5 Apollo detectors + Argus CVSS scoring + exploit pattern + 5 spec-drift detector patterns A-E (pure deterministic AST-diff) | xhigh |
| 3 | **Pandora** | Curiosity, gift, exploration | Athena proposal author (V4-Pro thinking high) + OpenSpec change folder generator Folder A + Refactor Mode simulation engine multi-turn + drafts/ isolation + dual review gate backend wiring | xhigh |
| 3 | **Demeter** | Harvest, persistence, accumulation | PostgreSQL event store schema + cache layer + 1-click GitHub issue creation Hybrid Layer 1 + ticket state aggregation + cost tracking + OpenSpec runtime integration | high |
| 3 | **Atlas** | Titan bearing the world, infrastructure burden | Docker multi-arch + K8s manifests + NGINX verify + K8s Secret population + feature flag runtime ConfigMap + smoke test E2E 3x consecutive | xhigh |
| 3 | **Aletheia** | Truth, disclosure (Horae sister) | Wave 3 final audit + handoff doc + PanitSubmission final curation review | max (locked) |
| post-3 | **Pan** | God of all (πᾶν), wild nature, the unbounded | Universal worker: demo rehearsal 3x consecutive + slide deck generation prompt template + bug sweep + polish + rescue work when auditor escalates | max (locked) |

**Anti-collision matrix**:
- Runtime residents Athena/Apollo/Argus/Clio/Hermes NOT used as build-time worker names (avoid namespace pollution).
- Iris reclaimed from PRD D11 drop (no longer runtime resident, safe for build-time worker).
- Triton chosen over Hermes_V2 to avoid suffix friction + namespace collision with runtime Hermes.
- Nemesis chosen over generic "Detector" for Greek pool consistency.
- Pandora chosen over Prometheus to avoid Council reserved collision; curiosity-gift mythology fits Refactor Mode "exploration sandbox" theme.
- Atlas chosen over Hephaestus_V2 (Hephaestus reserved Wave 0); world-bearing fits infra burden.
- Hades + Demeter pairing is intentional mythological coherence (foundational + harvest = backend infrastructure + data persistence).
- No collision with Council reserved (Momus/Eos/Prometheus/Hermes/Argus/Mnemosyne).

## 4. Wave Layout (Full)

| Wave | Capacity % | Wall-clock (24h base) | Goal | Ship criteria summary |
|---|---|---|---|---|
| **0** | 12% | ~2.9 hours (~13:00-16:00 Day 1) | Blueprint locked + Themis extended duties (C4 + openspec + ERD + PanitSubmission) | All `.claude/agents/*.md` ready, `_meta/` canonical, `docs/c4/` populated, openspec enriched, PanitSubmission seeded, STATUS.md initialized |
| **1** | 22% | ~5.3 hours (~16:00-21:30 Day 1) | Visual foundation runnable | Canvas + InstancedMesh + 3 Designer pages render, mock data loaded, Eunomia audit pass |
| **2** | 30% | ~7.2 hours (~21:30 Day 1 - ~04:45 Day 2) | Visual modes operational | 5 modes visual + 14 PM overlay + UI panels + OQ-02/03/05 decided, Dike audit pass |
| **3** | 28% | ~6.7 hours (~04:45 Day 2 - ~11:30 Day 2) | Backend full + integration + deploy | Real FastAPI + DeepSeek per-resident routing + GitHub OAuth + webhook + detectors fire + drafts/ simulation + Postgres event store + K8s deploy live at domain, Aletheia final audit pass |
| **Post-3 (Pan)** | 8% | ~1.9 hours (~11:30 Day 2 onwards, including jam 13-15 rehearsal window) | Polish + demo rehearsal + slide deck prompt + bug sweep + rescue | Demo flow 3x consecutive run, slide deck Hafiz-ready, 0 bug regression, ready Day 2 jam 15-17 pitch window |

**Capacity sum validation**: 12 + 22 + 30 + 28 + 8 = **100%** (exact).

**Capacity allocation rationale**:
- Wave 0 = 12% includes Themis extended duties (C4 + openspec enrichment + ERD + PanitSubmission); without those Themis would be 8-10%.
- Wave 1 = 22% slightly above default standard because visual-first sequencing puts foundation burden here. Phase B H1 hypothesis validation point.
- Wave 2 = 30% within default range but trimmed because 4 workers vs typical 5+; HERO mode Hera carries differentiator weight.
- Wave 3 = 28% above default standard, hedging against Wave 3 squeeze risk per Phase B research warning (6 workers covering FastAPI + tree-sitter + DeepSeek defensive + 11 detectors + Refactor engine + Postgres + K8s deploy = integration density high).
- Pan post-3 = 8% mid range of 5-10% buffer default, hackathon-sprint variant.

Visual-first inversion vs hackathon-sprint default: Wave 1+2 combined = 52% (majority of total capacity), satisfies visual-first sequencing mandate per AD-05 + Section C idea-draft. Wave 3 backend integration density higher than typical hackathon Wave 3.

## 5. Ship Criteria Detail per Agent

### 5.1 Wave 0 specialists

**Pythia (contracts)**:
- Every DAG edge (Wave 0->1, Wave 1->2, Wave 2->3, Wave 3->Aletheia) has contract file in `_meta/contracts/<edge-name>.md`
- Each contract spec: input schema, output schema, ownership transfer rules, error handling
- Cross-contract consistency check passes (no orphan input/output, no schema conflict)
- Specific contracts: `daedalus-to-iris.md` (Canvas mount target), `iris-to-hera.md` (building data shape), `hestia-to-hades.md` (OAuth stub to real handoff), `wave1-to-eunomia.md` (audit input bundle), Wave 2-3 contracts authored (no orphan)

**Hephaestus (prompts)**:
- 16 prompts in `.claude/agents/<agent>.md` (12 worker + 3 auditor + 1 Pan)
- 1 `PromptOpening-codeplex-chronicle.md` at project root (shared system header ~3000 tokens, DeepSeek V4 cache-hit optimized per Phase B H6)
- Each prompt 10-step structure: identity, scope, inputs, outputs, ship criteria, tool permissions, error handling, escalation rule, audit hooks, closing

**Themis (project-local setup, extended duties per Section 10 delegation)**:
- `_meta/orches/` populated with canonical files (`task_graph.md`, `roster.md`, `wave_layout.md` translated from this Agentic Structure)
- `STATUS.md` initialized at project root with Wave 0 progress checklist
- `docs/c4/` populated with C4 diagrams (Section 10 Task 2)
- `openspec/project.md` enriched from ~30-line seed to ~250-line (Section 10 Task 3)
- `openspec/specs/<domain>/spec.md` seed for 5 product mode domains (Section 10 Task 3)
- ERD generated in `docs/c4/ERD.md` + `docs/c4/ERD.svg` (Section 10 Task 4)
- `PanitSubmission/` folder created with curation index README (Section 10 Task 1)
- `.claude/skills/openspec/` skill drop for OpenSpec auto-detect, separate init Folder A vs Folder B
- GitHub OAuth app created at akun Finerium (`GITHUB_CLIENT_ID` + `_SECRET` filled, NOT committed)
- Webhook secret generated, `GITHUB_WEBHOOK_SECRET` filled
- Smoke check: `pnpm install` succeeds, `uv sync` succeeds, `kubectl get ns duopoly` returns ready

### 5.2 Wave 1 workers

**Daedalus (3D scene scaffold)**:
- `frontend/src/scene/Canvas.tsx` mounts r3f Canvas with PerspectiveCamera + OrbitControls
- Lighting: 1 ambient + 2 directional with shadow map (third directional behind `ENABLE_THIRD_DIRECTIONAL_LIGHT` flag)
- Fog: linear distance fog, dark mode default
- HDRI skybox via Drei `<Environment preset="night">` or custom HDR loaded once
- Post-processing pipeline via `<EffectComposer>` (pmndrs/postprocessing 3.x): Bloom + DepthOfField behind `ENABLE_DOF` flag + Sparkles tier-3 behind `ENABLE_SPARKLES_TIER_3` flag
- `state.performance.regress()` wired to OrbitControls onChange; Drei `<PerformanceMonitor>` adaptive quality consumer
- Drop-first feature flag toggle order on regress: DepthOfField first, then pixel ratio, then Sparkles
- Smoke test: scene boots <3s on M-series, 60fps idle, regress fires correctly on camera move

**Iris (building geometry + InstancedMesh)**:
- 5 archetype geometries in `frontend/src/scene/buildings/<archetype>.ts`: temple (Athena landmark City Hall), cross-shape (Apollo Hospital), surveillance tower (Argus Police Station), vertical book stack (Clio Library), glass-cube beacon (Hermes Tourist Info), plus generic building
- Raw `<instancedMesh args={[geometry, material, count]}>` per archetype, NOT Drei `<Instances>` (per r3f #3306 + Phase B anchor)
- `setMatrixAt(index, matrix)` in `useLayoutEffect`, deterministic squarified treemap layout for x/z positioning
- Ownership color encoding via CODEOWNERS regex + git blame mock data Wave 1 (real backend Wave 3 Hades)
- LOD via Drei `<Detailed>` for buildings beyond camera distance threshold
- Frustum culling automatic from r3f
- Window pattern: dense + warm tint for active files, sparse + cold tint for idle (mock Wave 1)
- Smoke test: 300 buildings render at 60fps on M-series with Daedalus full pipeline ON (H1 validation point)

**Calliope (Landing page)**:
- Static HTML + CSS + JS produced from prompt-design Prompt 1, integrated as `app/page.tsx`
- Awwwards-tier sticky-pinned hero + 3-angle differentiator + 5 modes preview + 5 residents preview + tech stack signal + Refactory hackathon credit footer
- Typography: characterful display + neo-grotesque body per Designer ban-list adherence
- Three.js mount-target empty placeholder containers per Designer instruction (Wave 2 wires actual scene)
- `prefers-reduced-motion` graceful fallback (accessibility floor)
- `animation-timeline: view()` scroll-driven reveal where supported, IntersectionObserver fallback
- Smoke test: Lighthouse 90+ on Performance + Accessibility + Best Practices + SEO; renders in Chrome + Edge + Safari 17+

**Hestia (Entry page)**:
- Static HTML produced from Prompt 2, integrated as `app/start/page.tsx`
- 2 entry cards: "Import a repository" (GitHub OAuth stub button) + "Build from scratch" (in-memory virtual FS stub Wave 1)
- 5 resident introduction footer (Athena/Apollo/Argus/Clio/Hermes badge cards)
- `v0.1 prototype` badge top-right
- Privacy notice per PRD Section 19.4
- Smoke test: 2 cards render, OAuth stub redirect chains correctly, accessibility floor maintained

**Selene (Dashboard)**:
- Static HTML produced from Prompt 3, integrated as `app/dashboard/page.tsx`
- 7 dashboard panels: velocity, burndown, milestone progress, contributor analytics, spec-drift summary, refactor proposal status, cross-repo summary
- Embedded city preview corner (~300x200px Canvas inset, full City View link)
- Glassmorphism accent on resident vignette cards (Designer cross-page anchor)
- OQ-02 charts library proposal: Recharts (React-native declarative, tree-shake friendly), document at `_meta/decisions/oq02_charts_library.md`
- OQ-03 UI library proposal: shadcn (consistency with Persephone Wave 2)
- Mock data Wave 1, real Postgres queries Wave 3 Demeter
- Smoke test: 7 panels render correctly, charts responsive, embedded city inset loads independent Canvas

### 5.3 Wave 1 auditor

**Eunomia (Wave 1 audit gate)**:
- Performance assertion: 60fps with Daedalus + Iris + 300 building stub on M-series (H1 validation, escalate if fail)
- Mount target assertion: Calliope landing + Hestia entry + Selene dashboard render + route correctly
- Contract conformance: Iris building data shape matches `iris-to-hera.md` Pythia contract
- OpenSpec validate clean: Folder A primary spec no warning
- Lighthouse floor 90+ on Performance + Accessibility + Best Practices all 3 Designer pages
- Console error scan: 0 React + 0 r3f warnings + 0 errors on Canvas mount + scene boot
- Smoke test: full page reload Chrome + Safari 17+ no regression
- Audit output: `_meta/audit/eunomia_wave1_audit.md` PASS/FAIL per item

### 5.4 Wave 2 workers

**Hera (Sprint Mode HERO)**:
- 14 PM concept visual mapping per PRD Section 9.2 table: scaffolding, crane, blueprint pin, transient green glow, yellow tape, smoke/retak, size badge, City Hall banner, district border, DoD checklist, inspector NPC, red bridge, ghost building handoff to Asclepius, retak pattern handoff to Asclepius
- PR comment surfacing visual: OQ-05 decide hari-H from 3 candidates (sticky note 3D, floating bubble, marker pin + badge), non-overlap check with scaffolding+crane+banner
- Click building to ticket panel UI hookup (Persephone provides slot, Hera populates with mock data Wave 2)
- PR-to-Building auto-sync webhook visual state machine: opened to crane, review requested to inspector orbit, approved to green halo transient 30 min, merged to crane removes + scaffolding cleared
- Workflow state visual: foundation to frame to painting to finished per ticket lifecycle
- Smoke test: 14 concept overlay toggle-able + filterable by status

**Asclepius (Health + Refactor diagnostic)**:
- Health Mode glow window per severity (red critical, orange high, yellow medium)
- Apollo findings panel UI: list glow building + category + click opens evidence panel
- Convert to Backlog Ticket button viz (1-click Hybrid Layer 1 stub Wave 2, real Wave 3 Demeter)
- Refactor Mode ghost building: transparent + animated dashed outline + suggested location
- drafts/ simulation visual: ghost-to-solid animation real-time
- Dual review gate buttons UI: Run Simulation + Accept changes + Discard
- Smoke test: 5/5 Apollo detector mock triggers correct glow color, Refactor ghost animates correctly

**Boreas (Onboarding + Activity navigation)**:
- Onboarding camera fly script with deterministic top-3 district pick (ownership + recent activity, mock Wave 2)
- Hermes narration text overlay during fly, ending summary panel (starting file + owner contact)
- 4 Hermes tour variant routing: generic 30-second, sprint goal scoped, feature scoped, cross-onboarding @username
- Activity timeline scrubber 30/60/90 day toggle, drag scrubber
- Hotspot intensity glow encoding (mock commit frequency Wave 2)
- Ownership heatmap toggle (CODEOWNERS distribution)
- Smoke test: camera fly smooth (no jitter 60fps), narration readable, timeline scrub no frame drop

**Persephone (UI panels architect)**:
- AI residents chat panel: 5-resident routing, response display, slide-in/out, broadcast vs single toggle
- Ticket panel: assignee avatar + GitHub username, story points size badge, status mapping, linked PR
- Side panel: 3 mode variant (Refactor proposal review, Health findings detail, Activity drilldown)
- Glassmorphism accent per Designer cross-page anchor (dark glass on resident vignette only, NOT global)
- OQ-03 UI library proposal: shadcn (consistency win, Phase B production-grade, Tailwind compat), document at `_meta/decisions/oq03_ui_library.md`
- Smoke test: 3 panel types slide-in/out smooth, glassmorphism WCAG AA, 0 console warnings

### 5.5 Wave 2 auditor

**Dike (Wave 2 audit gate)**:
- 5 modes visual operational: Onboarding + Sprint + Refactor + Activity + Health
- 14 PM concept overlay toggle-able + filterable
- PR comment surfacing OQ-05 decided + non-overlap (no z-fighting with scaffolding/crane/banner layers)
- Chat panel + ticket panel + side panel slide-in/out smooth + 0 console warnings
- Lighthouse 85+ on Performance with 5 modes active + console clean
- Audit output: `_meta/audit/dike_wave2_audit.md` PASS/FAIL per item

### 5.6 Wave 3 workers

**Hades (Core API + Parser)**:
- FastAPI async with project structure (`backend/app/{api,models,services,llm,parsers}/`)
- tree-sitter via `tree-sitter-language-pack` (Phase B Topic 3c recommendation, MIT permissive grammars)
- 11 language grammars on-demand: TypeScript, JavaScript, Python, Go, Java, C, C++, Rust, Ruby, PHP, Kotlin, Swift
- Cold start budget: <300ms total via lazy load (H3 validation)
- GitHub OAuth real flow: state CSRF + PKCE + scope minimization (read:repo, read:org, read:issues, read:pull_requests, write:issues only per PRD Section 19.3)
- GitHub webhook receiver: HMAC `X-Hub-Signature-256` per request, event subscribe PR opened/review_requested/approved/merged/closed + issue created/closed
- WebSocket setup for real-time PR-to-Building sync + simulation progress streaming
- Smoke test: parse NodeGoat fork, OAuth flow completes browser to callback, webhook receives test event

**Triton (LLM Integration)**:
- DeepSeek V4 client per PRD Section 18.2 (OpenAI Python SDK, base_url=https://api.deepseek.com)
- MODEL_FLASH + MODEL_PRO env-driven selection
- Defensive layer `call_with_fallback(messages, prefer_pro=False, max_retries=2)` per PRD Section 18.4
- Semantic cache cosine 0.85 threshold via sentence-transformer embeddings
- Canned response pre-cache top-10 demo questions per PRD Section 18.5 loaded at backend init
- Retry simplified prompt on first failure, fallback model on second, canned on final
- Circuit breaker: 5 consecutive failures to 60s cooldown, canned only
- Thinking-mode toggle: `extra_body={"thinking":{"type":"enabled"|"disabled"}}` + `reasoning_effort`
- CRITICAL Phase B quirk: NEVER replay `reasoning_content` from prior turns in multi-turn (DeepSeek API ignores it but pollutes context)
- Per-resident routing per PRD Section 18.3: Athena V4-Pro thinking high, Apollo V4-Flash non-think, Argus V4-Flash thinking low, Clio V4-Flash non-think, Hermes V4-Flash non-think
- Refactor simulation engine: V4-Pro thinking high (Think Max for complex turns)
- Shared 3000-token system header for cache-hit (H6 validation, 98% cache-hit discount on input)
- Smoke test: each resident routes correct model + mode, defensive fallback chain works, cache-hit logs visible

**Nemesis (Detector Suite)**:
- Detector 1: hardcoded secrets gitleaks pattern + entropy 3.5-4.5 + custom `.gitleaks.toml`, run `gitleaks dir --report-format json`
- Detector 2: outdated dependencies via OSV API CVE check, parse package.json/requirements.txt/go.mod/Cargo.toml/pom.xml/Gemfile/composer.json
- Detector 3: missing auth on protected routes via tree-sitter queries per Phase B Topic 3c (Express middleware, FastAPI Depends, Flask decorator, Django middleware, Gin/Echo middleware, Spring annotation, Actix guard)
- Detector 4: unsafe SQL patterns via regex + tree-sitter query for raw string concatenation in SQL contexts
- Detector 5: complex untested files via radon cyclomatic complexity + test coverage stub via parse import test files
- Argus security: CVSS scoring + exploit pattern lookup public CVE database + suggested mitigation with advisories reference
- 5 spec-drift patterns A-E per PRD Section 11 deterministic: A issue closed but file edited, B OpenSpec archived but commit bypass hook, C orphan import, D reopened issue cycle, E commit hook bypass on spec-controlled file
- AST-diff per Phase B inferred algorithm: parse OpenSpec requirement clauses, extract referenced symbols, confirm presence via tree-sitter parsed tree, missing references = drift
- Smoke test: NodeGoat fork triggers all 5 Apollo detector (5/5 authentic per PRD), all 5 spec-drift patterns trigger on prepared demo dataset

**Pandora (Refactor Engine)**:
- Athena proposal author via Triton client (V4-Pro thinking high)
- User intent plain language to Athena static analysis via Hades parser to affected files + dependency identification
- Propose ghost buildings with location + connection visual data (handoff Asclepius Wave 2)
- Side panel auto-generate OpenSpec change folder Folder A `openspec/changes/<change-name>/`: proposal.md + design.md + tasks.md per OpenSpec v1.0 canonical layout
- Refactor Mode simulation engine multi-turn per Phase B inferred workflow:
  - Turn 1: test generation (V4-Pro thinking high, failing tests for new requirement)
  - Turn 2: implementation generation (V4-Pro thinking high, code to make tests pass)
  - Turn 3: diff serialization (V4-Flash non-think, unified diff format)
- Output writes to `drafts/<simulation-id>/` ONLY
- Production code NEVER changes here, only via explicit user Accept (PRD critical safety property)
- Dual review gate backend: `POST /api/refactor/simulate`, `POST /api/refactor/accept` (download diff per OQ-09), `POST /api/refactor/discard`
- GitHub Issue fallback (progressive degradation): when target repo has no `openspec/`, Athena fallback to structured GitHub Issue draft
- Smoke test: simulate 2FA proposal on NodeGoat fork produces 3 ghost building + valid OpenSpec change folder + drafts/<id>/ output with diff serialized

**Demeter (Data Layer + Write Ops)**:
- PostgreSQL event store schema authored + migrated via Alembic:
  - `pr_events`, `simulation_events`, `finding_events`, `llm_call_log` per PRD Section 18.7, `drift_log`
  - Cycle-time/lead-time derivation views (materialized) for Selene dashboard
- Semantic cache embeddings storage + canned response storage tables
- 1-click GitHub issue creation Hybrid Layer 1: `POST /api/findings/{finding_id}/to-issue`, pre-filled body with evidence chain + suggested label
- Ticket state aggregation for Sprint Mode (Story Done count, In Progress count)
- Cost tracking real-time dashboard data: aggregate `llm_call_log.cost_estimate_usd` per session
- OpenSpec runtime: subprocess `openspec list --specs --json`, `openspec validate <change-name>`, `openspec show <change-name> --diff`, `openspec archive` on Accept
- Smoke test: full event chain (webhook PR opened to Demeter persists to WebSocket pushes to Hera updates building visual) works end-to-end

**Atlas (Infra Deploy)**:
- Multi-stage Dockerfile: builder (uv sync + pnpm install + pnpm build) to runtime (FastAPI + static Next.js export)
- Multi-arch ARM64 + AMD64 image build
- Push to ghcr.io/finerium/codeplexrefactory:latest or docker.io alternative
- K8s manifests in `infra/k8s/`: deployment.yaml + service.yaml + ingress.yaml + configmap.yaml + secret.yaml (NEVER commit secrets)
- NGINX Ingress verify (Refactory-managed, confirm routing + TLS termination)
- Refactory PostgreSQL connection via DATABASE_URL from duopoly.zip creds
- K8s Secret population: `duopoly-deepseek` + `duopoly-github-oauth` + `duopoly-db`
- Smoke test E2E 3x consecutive successful trial run: load landing, Import a repository, OAuth flow, switch to City View, click building, query Hermes tour, switch Health Mode, see findings glow, click finding to evidence panel, Convert to Backlog Ticket, verify GitHub issue created
- Demo flow ship criteria: 2-menit pitch flow rehearsed 3x without break

### 5.7 Wave 3 auditor

**Aletheia (Wave 3 final audit + handoff)**:
- Deploy live + accessible at `duopoly.hackathon.sev-2.com` from external network
- 5 modes E2E with real backend (no mock left): all 5 modes hit real APIs
- Demo flow 2-menit 3x consecutive trial run pass (no mid-run recovery)
- OpenSpec validate clean: Folder A + Folder B both pass
- GitHub OAuth real flow works end-to-end (browser to consent to callback to session)
- GitHub webhook receives events from real PR on demo repo
- DeepSeek per-resident routing verified: each resident hits correct model+mode
- Canned cache hit on top-10 demo questions verified (latency <100ms)
- Lighthouse 85+ maintained on landing + entry + dashboard, no regression vs Wave 1-2
- Console error scan: 0 errors, 0 React warnings on full demo flow
- PanitSubmission/ final curation review: C4 final + openspec export snapshot + ERD final + PRD .md+.pdf + spec-drift detection algo notes + revision history
- Write `_meta/audit/aletheia_wave3_audit.md` PASS/FAIL per item + handoff doc summary
- Initialize Pan spawn instructions for post-Wave 3
- Smoke test: full E2E 3x without issue, all audit items PASS

### 5.8 Pan post-Wave 3

**Pan**:
- Demo flow 2-menit rehearsal smoke test: 3x consecutive successful run with Ghaisan + Hafiz operator timing, 0 mid-run recovery
- Slide deck generation prompt template + outline drafted to `slides/codeplex-chronicle-pitch-template.md`:
  - Slide 1: Title (Codeplex Chronicle, tagline, team Duopoly)
  - Slide 2: Problem statement (4 engineering productivity pain points per PRD Section 3.1)
  - Slide 3: Solution (5 modes + 5 residents overview)
  - Slide 4: HERO mode showcase (Sprint Mode 14 PM concept visual)
  - Slide 5: Safety-first Refactor Mode (drafts/ sandbox + dual review gate)
  - Slide 6: Tech stack signal (DeepSeek V4 + OpenSpec dual-folder + K8s + tree-sitter 11-language)
  - Slide 7: Demo flow callout (live URL `duopoly.hackathon.sev-2.com`)
  - Slide 8: Closing punchline ("AI explores in drafts, you commit to production")
  - Slide 9: Closing bonus (tokopedia/gripmock + gojek/courier-android Indonesian production code relevance)
  - Hafiz consume + finalize manual Day 2 jam 11-13 submission window
- Bug sweep regression detection on full E2E demo flow, log to `_meta/audit/pan_bug_sweep.md`
- Polish work: post-pipeline tuning if regress visible during demo, animation timing for ghost-to-solid + camera fly smoothness, copy adjustments per Hafiz feedback
- Rescue work: if Aletheia escalates Wave 3 worker failure, Pan inherits worker prompt + audit findings, applies surgical fix, re-validates ship criteria
- PanitSubmission/ final pass: confirm all panitia-facing artifacts present, update PanitSubmission/README.md curation index with submission timestamp

## 6. Effort Tier Rationale

**Locked baseline** (per agentic-structure-protocol):
- Wave 0 specialists Pythia/Hephaestus/Themis = SELALU max (cross-cutting cascade impact)
- Auditors Eunomia/Dike/Aletheia = SELALU max (Lock 10 audit gate mandate)
- Pan = SELALU max (universal worker scope unbounded)

**Workers (Metis judgment by ide weight)**:

| Worker | Wave | Tier | Rationale |
|---|---|---|---|
| Daedalus | 1 | xhigh | Three.js scene scaffold + post-pipeline + feature flag + regress wiring = architectural decision (not pattern application). Critical foundation; if wrong abstraction ships, all Wave 2 visual mode workers inherit broken contract. H1 hypothesis validation lives here. |
| Iris | 1 | xhigh | Squarified treemap + raw InstancedMesh + 5 archetype geometry + ownership encoding = domain-specific implementation per Codeplex Chronicle 3D city core differentiator. Performance ceiling test point. |
| Calliope | 1 | high | Awwwards-tier landing page from Designer prompt = sophisticated pattern application + Awwwards-tier polish judgment, but Designer prompt covers ~70% of lift. |
| Hestia | 1 | medium | Entry page 2-card + 5 resident footer + OAuth stub = standard pattern application from Designer prompt. Smaller scope than Calliope or Selene. |
| Selene | 1 | high | Dashboard 7-panel + charts library decision + city preview embed + glassmorphism accent = pattern application + multi-component + OQ-02 decision + city preview integration complexity. |
| Hera | 2 | xhigh | Sprint Mode HERO 14-concept overlay = highest visual complexity in product, plus OQ-05 decision authority + click-building integration + webhook state machine. HERO justifies xhigh; if Hera ships wrong, entire pitch defensibility collapses. |
| Asclepius | 2 | high | 2 mode combined (Health glow + Refactor ghost) + dual review gate + animations real-time. Multi-task per worker; high not xhigh because Designer-prompt influence reduces independent design judgment. |
| Boreas | 2 | high | 2 mode combined (Onboarding camera fly + Activity timeline) + 4 Hermes tour variant routing. Camera fly + timeline scrubber both standard r3f patterns, combined scope justifies high. |
| Persephone | 2 | high | 3 panel type architect (chat + ticket + side) + OQ-03 decision authority + glassmorphism integration. Cross-cutting work consumed by every Wave 3 backend worker for response display. |
| Hades | 3 | xhigh | FastAPI scaffold + 11-language tree-sitter lazy-load + OAuth real flow + webhook HMAC + WebSocket = foundational backend infrastructure. If Hades ships wrong, all Wave 3 downstream workers fail. H3 hypothesis lives here. |
| Triton | 3 | xhigh | DeepSeek client + defensive layer per PRD Section 18.4 + per-resident routing + thinking-mode wiring + Phase B documented quirks. High failure surface, max research grounding required. |
| Nemesis | 3 | xhigh | 5 Apollo detector + Argus CVSS + 5 spec-drift A-E = 11 detector implementations across multi-framework. Heaviest pure-implementation worker. Phase B spec-drift algorithm inferred (no community precedent), elevated effort warranted. |
| Pandora | 3 | xhigh | Refactor simulation engine multi-turn + OpenSpec change folder generator + drafts/ sandbox safety property + dual review gate. Safety-critical (production code NEVER changes until explicit Accept) demands max care. Defensibility pitch hinge. |
| Demeter | 3 | high | PostgreSQL schema + Alembic migration + cache + event store + 1-click issue + OpenSpec runtime. Pattern application heavy on standard SQL+REST, not architectural decision. |
| Atlas | 3 | xhigh | Docker multi-arch + K8s manifests + NGINX verify + Secret population + smoke test E2E. Last-mile deploy responsibility, single-point-of-failure for entire submission ship criteria. |

**xhigh tier note**: per memory Opus 4.7 era default Claude Code, xhigh sits between high and max. Used for workers whose output sets architectural precedent for downstream waves OR carries single-point-of-failure responsibility OR has high failure surface requiring max research grounding.

## 7. Open Questions

### 7.1 PRD OQ-01 to OQ-10 (sourced PRD Section 25, Metis acknowledges + recommends)

| # | Question | Owner | Metis recommendation |
|---|---|---|---|
| **OQ-01** | Background task framework: FastAPI BackgroundTasks vs Celery | V1 Orch Wave 3 (Hades) | FastAPI BackgroundTasks (Celery overkill for hackathon scope per Phase B) |
| **OQ-02** | Charts library Dashboard: Recharts vs Chart.js | Designer-v1 hari-H (Selene Wave 1) | Recharts (React-native, declarative, tree-shake friendly); decision at `_meta/decisions/oq02_charts_library.md` |
| **OQ-03** | UI library: shadcn vs Mantine vs custom Tailwind | Designer-v1 hari-H (Persephone Wave 2) | shadcn (Selene + Persephone consistency win, Tailwind compat, minimal install); decision at `_meta/decisions/oq03_ui_library.md` |
| **OQ-04** | CI/CD: GitHub Actions vs manual `kubectl apply` | V1 Orch Wave 3 (Atlas) | Manual kubectl with prepared script `scripts/deploy.sh` (GitHub Actions overhead unwarranted hackathon, per Phase B) |
| **OQ-05** | PR comment surfacing visual approach | Designer-v1 hari-H (Hera Wave 2) | Hera decision authority; constraint non-overlap with scaffolding+crane+banner (Dike audit gate verifies) |
| **OQ-06** | Earthquake error visual precise trigger | V1 Orch Wave 1 + Wave 3 (Daedalus stub, Nemesis wires real) | Default trigger Apollo critical finding cluster OR Pattern E commit hook bypass; Daedalus Wave 1 stub camera shake hook, Nemesis Wave 3 wires real condition |
| **OQ-07** | DeepSeek V4-Pro vs V4-Flash optimal split | V1 Orch Wave 2-3 (Triton smoke test) | Baseline per PRD Section 18.3 lock; smoke test Wave 3 reveals if Athena V4-Pro thinking high latency too slow for demo (>10s), fallback to V4-Flash thinking high |
| **OQ-08** | Pre-cached top 10 demo questions exact list | V1 Orch Wave 2-3 (Triton implementation) | PRD Section 18.5 baseline; Triton finalize embedding cache; Pan Day 2 may add 1-2 based on rehearsal feedback |
| **OQ-09** | Refactor "Accept changes": download diff vs PR create | V1 Orch Wave 3 (Pandora) | Download diff (MVP, no upgraded OAuth scope needed; PR create requires `repo` scope NOT requested) |
| **OQ-10** | C4 diagram tooling | V1 Orch Wave 0 (Themis) | **Mermaid as default** (markdown-embed friendly + GitHub renders natively + panitia view in repo browser) + standalone SVG export via `mermaid-cli` for PanitSubmission/ |

### 7.2 Metis-specific blind spots (Phase B Deep Research)

| # | Blind spot | Mitigation strategy |
|---|---|---|
| **M-BS-01** | No public postmortem of 24h, 20+ agent, Anthropic Agent Teams build exists for direct throughput calibration | Empirical validation Wave 0-1; if peak Wave 3 (6+1 simultaneous) coordination drifts, collapse via "pintar multi-task" merger (e.g., Triton merge into Hades) per H5 fallback |
| **M-BS-02** | DeepSeek V4 + `reasoning_content` + tool-calling in agentic loops not publicly documented as reference workflow | Triton Wave 3 implements defensive layer per PRD Section 18.4 with extra logging for `reasoning_content` field; ferry Ghaisan if multi-turn behavior diverges |
| **M-BS-03** | M-series performance for r3f@9 + Three.js 0.184 + heavy post-processing not benchmarked publicly | H1 hypothesis test at Wave 1; Eunomia audit validates 60fps with 300 building before Wave 2 unlock. If fail, drop-first feature flag order applied |
| **M-BS-04** | PromptOpening 10-step pattern is Tim Duopoly internal convention; no external prior art | Hephaestus Wave 0 authors per internal convention; if downstream worker reports prompt confusion, Pan Day 2 rescue applies |
| **M-BS-05** | Greek mythology naming as anti-collision strategy empirically unstudied | No mitigation needed; cosmetic risk only. Anti-collision matrix Section 3 documented |
| **M-BS-06** | Round 02 Refactory 1st-place winner identity unknown publicly (sourced correction: Effix.ai was 3rd-place Tim Case Release UNAIR, NOT 1st) | Downstream avoid citing Effix.ai as winning-team benchmark. Tim LUNARIS Round 01 + Tim Vibecode UKDW = confirmed winner references for pitch positioning |

## 8. Reference Findings

**Source**: Phase B Deep Research artifact `compass_artifact_wf-96c21fb3-d652-4554-a319-b2c1cfc595e5_text_markdown.md` (separate downloadable file, Ghaisan local copy). Full executive summary + per-category findings + source citations live there. This section is a working synthesis for downstream Orches-v1 + worker consumption, NOT a reproduction.

### 8.1 High-confidence anchors (12 locked design constraints)

1. Orchestrator-worker pattern with Anthropic Agent Teams substrate (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, v2.1.45+); 22 total agents fit; peak simultaneous Wave 3 = 6-7 within tested range
2. Agent Skills SKILL.md packaging per worker, <500 lines / <5000 tokens, descriptions optimized for discovery-stage reasoning
3. DAG with explicit edge contracts; no cycles. MAST evidence: simple fixes insufficient without combined role specs + contract typing + topology discipline
4. DeepSeek V4-Flash default, V4-Pro escalation Wave 0 + Wave 3 reasoning; cache-heavy shared system header ~3000 tokens for 98% cache-hit discount
5. Thinking-mode toggle per Wave: Wave 0 enabled high, Wave 1-2 disabled default, Wave 3 enabled high, auditors enabled high; NEVER replay `reasoning_content`
6. Visual frontend-first sequencing: Waves 1-2 ship visual fully before Wave 3 begins; Wave 3 integrates against locked frontend contracts (AD-05 + Section C idea-draft)
7. r3f baseline: raw `<instancedMesh>` NOT Drei `<Instances>` per r3f #3306; per-archetype InstancedMesh; draw-call budget <=100; `state.performance.regress()` wired
8. Drop-first feature flag order on regress: post-processing (DepthOfField first, then Bloom) to pixel ratio to LOD to shadows to particles
9. OpenSpec core profile dual-folder novel implementation: two `openspec init` runs, both core profile, distinct `--tools` per folder. Folder A panitia-facing, Folder B internal
10. 24-hour capacity split: Wave 0 ~12%, Wave 1-2 ~52% combined (visual), Wave 3 ~28%, Pan post-3 ~8%; hard freeze T-3h before pitch
11. Demo: judges run MVP themselves; deck is supporting (Refactory rubric); 2-menit pitch with 30-60 min rehearsal block at T-2h
12. Auditors are not optional; MAST binding: Eunomia/Dike/Aletheia gates between every wave; failure escalates to Pan rescue

### 8.2 Medium-confidence hypotheses (validate during Wave 0-1, 6 items)

| H# | Hypothesis | Validation point | Mitigation if false |
|---|---|---|---|
| H1 | M-series MBP 16GB sustains 60fps with 300 InstancedMesh + DepthOfField + Bloom + Sparkles 1500 at 1080p | Eunomia Wave 1 audit | Cut Sparkles to 500, defer DepthOfField behind regress |
| H2 | DeepSeek V4-Flash thinking-disabled completes Wave 2 visual mode boilerplate <8s p95 | Triton smoke test Wave 3 start | Switch Wave 2 V4-Flash non-think with narrower per-call output budget |
| H3 | tree-sitter 11-grammar lazy load <300ms total cold start on M-series | Hades Wave 3 parser smoke test | Prebuild single pickled grammar bundle |
| H4 | OpenSpec dual-folder no conflict same core profile, different `--tools` | Themis Wave 0 init | Collapse to single folder with two top-level subdirectories |
| H5 | Anthropic Agent Teams handles 18-20 active teammates without coordination drift (peak Wave 3 = 6-7, conservative) | Wave 3 spawn | Collapse Wave 3 workers via "pintar multi-task" merger (Triton merge into Hades) |
| H6 | DeepSeek cache-hit ratio >70% across 22-worker run with shared 3000-token system header | Triton Wave 3 mid-execution metric | Lengthen shared header + pre-warm cache via no-op call at session start |

### 8.3 Persistent blind spots

See Section 7.2 (M-BS-01 to M-BS-06). Full source citations in Phase B artifact.

## 9. Handoff Instruction for /orches-v1 Mode A

`/orches-v1` Mode A receives this Agentic Structure (master) + PRD-ideaLocked + prompt-design as 3 attached files. Behavior:

1. **Force-load priority** (Step 1 read order): PRD to Agentic Structure master to prompt-design.

2. **Skip Phase A** (brainstorm, idea LOCKED at PRD Section 1+2).

3. **Skip Phase F.1 project type re-triage** (sourced PRD Section 1 = `hackathon`).

4. **Phase B lock-in minimal**: confirm OpenSpec on (already PRD Section 17.1), confirm tech stack final (locked PRD Section 17). No re-debate.

5. **Phase C onwards spawn Wave 0 specialists shrunk 5 to 3**:
   - **Pythia**: contracts per DAG edge from this Agentic Structure to `_meta/contracts/*.md`
   - **Hephaestus**: 12 worker + 3 auditor + 1 Pan prompts to `.claude/agents/` + `PromptOpening-codeplex-chronicle.md` to project root (16 prompts total)
   - **Themis**: translate Agentic Structure to `_meta/orches/` canonical (task_graph.md + roster.md + wave_layout.md) + project-local `.claude/` setup + execute Themis delegation section tasks (Section 10 below)

6. **Wave 1-3 execution per visual frontend-first sequencing**:
   - Wave 1: spawn Daedalus + Iris + Calliope + Hestia + Selene in parallel, Eunomia audit gate at end
   - Wave 2: spawn Hera + Asclepius + Boreas + Persephone in parallel, Dike audit gate at end
   - Wave 3: spawn Hades + Triton + Nemesis + Pandora + Demeter + Atlas in parallel (peak simultaneous = 6), Aletheia final audit gate at end
   - Pan post-3: reactive spawn for atomic Day 2 task chain

7. **Per-wave audit mandatory** (Lock 10): Eunomia/Dike/Aletheia gates, Pan rescue if escalation.

8. **Blueprint locked from Metis**: if `/orches-v1` detects ambiguity OR Wave 0-3 worker disagrees with Agentic Structure content, **FERRY Ghaisan/Hafiz**, JANGAN unilateral edit. Same canonical treatment as PRD per Council Phase F lock.

9. **Operator authority retained**: Ghaisan + Hafiz can override any worker decision (effort tier shift, scope cut, drop protocol activation) via ferry; Orches relays, never auto-resolves.

10. **Handoff doc on completion**: Aletheia writes `_meta/handoffs/aletheia_wave3_handoff.md` capturing shipped + deferred + Pan task list Day 2 + known issues. Pan Day 2 consumes this doc.

## 10. Themis Delegation Section (Formal Task List)

**Why this section exists**: per `themis-delegation-protocol.md`, default Themis duties cover `.claude/` + `_meta/` + root files + STATUS.md. Ghaisan operator directive mandates additional Wave 0 setup beyond default SOP: **C4 + openspec enrichment + ERD + PanitSubmission folder + curation**. This section formalizes for Orches-v1 Themis pickup.

### Task 1: PanitSubmission/ folder + curation index

**Why delegated**: Operator directive. PanitSubmission/ is panitia-facing submission bundle Ghaisan zip at submission window Day 2 jam 11-13. Themis seeds, Wave 1-3 workers maintain, Aletheia final pass.

**Input**: Project root `~/Documents/codeplexRefactory/`; existing `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` + `.pdf`.

**Output expected**:
- `PanitSubmission/` folder at project root
- `PanitSubmission/README.md` curation index: what's inside + reading order (README to PRD .pdf to C4 Context diagram to demo URL) + submission workflow
- `PanitSubmission/PRD-ideaLocked_codeplex-chronicle.md` + `.pdf` (copies)
- Workers Wave 1-3 boleh nambah file asal ga bloat (max 15-20 files total reasonable sizes)
- Revisi PRD/C4 dari Ghaisan + Hafiz: append with version suffix (e.g., `PRD-ideaLocked_codeplex-chronicle_v2.md`), original kept for audit trail per Lock 9

**Ship criteria**: PanitSubmission/ exists, README.md readable <2 min, PRD copies present, Aletheia final audit verifies all required artifacts.

### Task 2: C4 diagram generation (PRIORITY 1 per Ghaisan directive)

**Why delegated**: panitia mandate per PRD Section 24.1 + 7.1 submission deliverable. Default Themis duty covers folder skeleton, NOT diagram content authoring.

**Input**: PRD Section 8 architecture sketches (Context + Container high-level) + PRD Section 17 tech stack + this Agentic Structure roster for component-level granularity.

**Output expected**:
- `docs/c4/C4-Context.md` (Mermaid) + `docs/c4/C4-Context.svg` (standalone export)
- `docs/c4/C4-Container.md` + `.svg`
- `docs/c4/C4-Component.md` (decompose Frontend SPA + Backend API) + `.svg`
- `docs/c4/C4-Code.md` (optional, lightweight: AI Resident class hierarchy + Refactor simulation state machine) + `.svg`
- All 4 files copied to `PanitSubmission/c4/`
- Follows formal + detail + jelas mandate per PRD Section 7.1

**Tooling decision (OQ-10)**: Mermaid as default (markdown-embed friendly, GitHub renders natively, panitia repo browser view) + standalone SVG export via `mermaid-cli` (`mmdc`) for PanitSubmission/ offline.

**Ship criteria**: 3 required tier diagrams (Context + Container + Component) ready, optional Code tier if time allows, Mermaid syntax validates, all legible at standard zoom, PanitSubmission/c4/ mirror populated.

### Task 3: OpenSpec enrichment (PRIORITY 2 per Ghaisan directive)

**Why delegated**: OpenSpec mandatory per Refactory rule + dual-folder strategy novel + `openspec/project.md` ~250 line enrichment is Phase B Topic 3c best practice. Default Themis duty covers folder skeleton, NOT spec content authoring.

**Input**: PRD Section 1 + 17 + 8 + 9-12 + 19; existing `openspec/project.md` ~30-line seed from setup script.

**Output expected**:
- `openspec/project.md` enriched ~30 to ~250 line: project identity + product description + why exists + who uses + core principles + conventions + key entities + architectural decisions + runtime constraints + tech stack + in-scope + out-of-scope
- `openspec/specs/<domain>/spec.md` seed for 5 product mode domains: onboarding, sprint (HERO), refactor, activity, health
- Folder B `.agent-openspec/` parallel init with internal workflow scope
- Both folders pass `openspec validate` clean
- OpenSpec export snapshot copied to `PanitSubmission/openspec-snapshot/` (read-only mirror)

**Ship criteria**: `openspec/project.md` ~250 line panitia-grade quality (no `[TO ENRICH]` placeholders), 5 domain spec seeds present (~50-100 line each), Folder A + B both `openspec validate` clean, PanitSubmission/openspec-snapshot/ mirror populated.

### Task 4: ERD generation (PRIORITY 3 per Ghaisan directive)

**Why delegated**: documents PostgreSQL event store schema + Refactory pre-provisioned tables. Useful for panitia technical review + agent reference. Default Themis duty covers folder skeleton, NOT ERD authoring.

**Input**: PRD Section 18.7 schema (`llm_call_log`) + implied event tables; Demeter Wave 3 final schema (Themis seeds Wave 0 best estimate, Demeter refines, Aletheia final audit confirms).

**Output expected**:
- `docs/c4/ERD.md` (Mermaid erDiagram) + `docs/c4/ERD.svg` (standalone)
- Tables: `pr_events`, `simulation_events`, `finding_events`, `llm_call_log`, `drift_log`, `semantic_cache_embeddings`, materialized views (`cycle_time_aggregate`, `lead_time_aggregate`, `ownership_distribution`)
- Foreign key relationships documented
- Copied to `PanitSubmission/erd/ERD.svg` + `.md` mirror

**Ship criteria**: ERD covers 7+ tables, foreign keys clearly visualized, Mermaid erDiagram syntax validates, PanitSubmission/erd/ mirror populated, Demeter Wave 3 verifies schema match (no drift, if drift Demeter updates before Aletheia final audit).

### Cross-task notes for Themis

- **Priority ordering**: Themis executes Task 2 (C4) before Task 3 (openspec) before Task 4 (ERD) per Ghaisan directive priority lock. Task 1 (PanitSubmission/) executes first (destination folder for Task 2-4 outputs).
- **Revisi handling**: if Ghaisan or Hafiz revises PRD or C4 mid-hackathon, Themis (or Pan if escalated) updates with `_v2`/`_v3` suffix in PanitSubmission/, original kept per Lock 9.
- **Audit hookup**: Aletheia Wave 3 final audit explicitly checks PanitSubmission/ contains all required artifacts before declaring submission-ready.

## 11. Self-Check Protocol Output (12-Item)

**2026-05-12 ~12:15 WIB - Master file gabungan locked**

| # | Item | Status |
|---|------|--------|
| 1 | Deep Research artifact ready (Phase B done, accessible chat panel) | OK (Ghaisan local copy `compass_artifact_wf-96c21fb3-d652-4554-a319-b2c1cfc595e5_text_markdown.md`) |
| 2 | Agentic_Structure-codeplex-chronicle.md master gabungan authored | OK (this file) |
| 3 | Agentic_Structure-codeplex-chronicle_Diagram.html authored | PENDING (Phase D, next step) |
| 4 | Lock 1 (no em dash) verified | OK (self-scan: no double-hyphen sequence) |
| 5 | Lock 2 (no emoji) verified | OK |
| 6 | Lock 3+4 (no silent narrow + no silent assume) verified, assumptions labeled | OK (Phase B hypotheses H1-H6 labeled, blind spots M-BS-01 to M-BS-06 labeled, [INFERRED] markers where applicable) |
| 7 | Lock 7 (Greek naming) compliant + anti-collision matrix consistent | OK (Section 3 anti-collision documented, no collision with Council/runtime residents/Wave 0 specialists) |
| 8 | Lock 10 (discussion-decision discipline) respected, no unilateral project type/scope decide | OK (project type sourced PRD lock, capacity inversion confirmed by Ghaisan at intake, filename convention confirmed, no unilateral scope cut) |
| 9 | Phase B citation present Section 8 reference findings | OK (lean reference to Phase B artifact, 12 anchors + 6 hypotheses + 6 blind spots, full detail in artifact) |
| 10 | Audit trio + Pan in roster | OK (Eunomia Wave 1, Dike Wave 2, Aletheia Wave 3, Pan post-3, all max effort tier locked) |
| 11 | Capacity allocation Section 4 sum = 100% | OK (12+22+30+28+8 = 100% exact) |
| 12 | DAG validated (no cycles, no orphan nodes) | OK (Wave 0 to 1 to 2 to 3 to Pan linear progression, intra-wave parallel branches converge at auditor gate, no cycle, no orphan; cross-wave handoff contracts explicit per Pythia Wave 0 output) |

**Status**: 11/12 OK, 1 PENDING (Phase D Diagram.html). Master locked, gas Phase D next.

---

**End of master `Agentic_Structure-codeplex-chronicle.md`**. Downstream consumption: `/orches-v1` Mode A with this + PRD + prompt-design attached.
