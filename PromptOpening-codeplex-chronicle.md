/effort max

WAJIB pakai plugins/MCP yang available di environment ini. Aktifin MCP superpowers (writing-plans, code-review, debugging-reflection, subagent-driven-development), Context7 (latest library docs Next.js + R3F + Three.js + FastAPI + DeepSeek), Playwright (browser testing audit gate), dst yang udah ke-install. Selalu leverage tooling stack yang Ghaisan udah setup, BUKAN run vanilla Claude Code only.

JANGAN pakai `ultrathink` keyword (active bug per 12 Mei 2026, pin effort ke "high" yang downgrade dari xhigh/max). Adaptive thinking Opus 4.7 default always-on per effort tier ceiling.

# Codeplex Chronicle Wave 1 Kickoff

## 1. Project Identity (Locked)

**Codeplex Chronicle**, AI-resident development environment yang mentransformasi production codebase jadi 3D city. Files become buildings, folders become districts, errors become earthquakes you can feel. 5 AI residents (Athena, Apollo, Argus, Clio, Hermes) live in landmark buildings, serve 5 product modes (Onboarding, Sprint HERO, Refactor SAFETY-FIRST, Activity, Health).

| Field | Value |
|---|---|
| Tagline | `YOUR CODEBASE, ALIVE` |
| Sub-tagline | An AI-resident development environment |
| Type | hackathon (24-jam build, Refactory Round 03 Telkom) |
| Team | Tim Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin) |
| Event | Refactory Hackathon Round 03, Telkom University Bandung |
| Date | 12-13 Mei 2026 |
| Domain | https://duopoly.hackathon.sev-2.com (Refactory pre-provisioned) |
| GitHub akun | **Finerium** |
| Repository | github.com/Finerium/codeplexRefactory |

## 2. Tech Stack (Locked PRD Section 17)

- **Frontend**: Next.js 16 + React 19 + TypeScript + Three.js 0.184 + @react-three/fiber 9.6 + Tailwind + GSAP
- **Backend**: Python 3.12 + FastAPI async + tree-sitter-language-pack 11-language lazy-load (TS/JS, Python, Go, Java, C, C++, Rust, Ruby, PHP, Kotlin, Swift)
- **LLM**: DeepSeek V4-Flash + V4-Pro via OpenAI ChatCompletions API compat (1M context, thinking-mode toggle)
- **Spec**: OpenSpec Fission-AI core profile, dual-folder strategy (Folder A `openspec/` panitia + Folder B `.agent-openspec/` internal)
- **Deploy**: K8s namespace `duopoly` (Refactory pre-provisioned) + PostgreSQL event store
- **Auth**: GitHub OAuth akun Finerium (scope minimal: read:repo + read:org + read:issues + read:pull_requests + write:issues)

## 3. Operational Mode: Hands-Off

Ghaisan + Hafiz operator role TIGA only:
1. Relay handoff antar agent
2. Decision approval gate
3. Ferry knowledge

Yang Claude Code handle: folder setup + dep install + code gen + git ops + OpenSpec cycles + K8s deploy + demo dataset prep + smoke test + C4 diagram + slide deck prompt (Hafiz finalize manual Day 2 jam 11-13).

## 4. 5 Runtime Resident Personas (LOCKED PRD Section 10)

**Athena** (City Hall landmark, V4-Pro think high): The architect. Refactor proposal author + architectural reasoning. Voice: thoughtful Indonesian + English technical code-switch. Use case: "Athena, propose 2FA implementation for auth district". Output: proposal with affected files + ghost buildings + OpenSpec change folder.

**Apollo** (Hospital landmark, V4-Flash non-think): The doctor. Health findings narration + diagnostic. Voice: warm clinical. Use case: 5 Apollo detector (secrets, outdated deps, missing auth, unsafe SQL, complex untested) → finding narration.

**Argus** (Police Station landmark, V4-Flash think low): The watcher. Security CVSS scoring + exploit pattern + mitigation. Voice: watchful concise. Use case: enrich Apollo finding with CVE reference + CVSS score + suggested mitigation.

**Clio** (Library landmark, V4-Flash non-think): The historian. Git history + spec-drift narration (5 pattern A-E). Voice: factual elegant. Use case: "Clio, narrate Pattern D reopened cycle for issue #123".

**Hermes** (Tourist Info booth landmark, V4-Flash non-think): The guide. Onboarding tour narration + navigation guidance. Voice: warm welcoming bilingual Indonesian + English code-switch. Use case: 4 tour variant (generic 30s, sprint scoped, feature scoped, cross-onboarding @username).

**Anti-collision matrix**: 5 resident name LOCKED runtime, NEVER reuse as build-time worker name. Build-time worker pool uses Greek mythology dengan distinct names (Pythia, Hephaestus, Themis, Daedalus, Iris, Calliope, Hestia, Selene, Eunomia, Hera, Asclepius, Boreas, Persephone, Dike, Hades, Triton, Nemesis, Pandora, Demeter, Atlas, Aletheia, Pan). Per `_meta/contracts/_anti_collision_matrix.md`.

## 5. Workers Active Wave 1

Roster Wave 1 (sourced Metis Agentic Structure md Section 3 + Hephaestus prompts di `.claude/agents/`):

- **daedalus** (Master craftsman, labyrinth architect): 3D scene scaffold (Three.js + r3f Canvas + camera + lighting + HDRI) + post-processing pipeline (Bloom + DOF + Sparkles tier-3) + feature flag wiring (ENABLE_DOF / ENABLE_SPARKLES_TIER_3 / ENABLE_THIRD_DIRECTIONAL_LIGHT) + state.performance.regress() listener + Drei PerformanceMonitor adaptive. File: `.claude/agents/daedalus.md`. Effort: xhigh. **ZERO Designer dependency, gas duluan**.

- **iris** (Rainbow messenger, reclaimed from PRD D11 drop): Building geometry InstancedMesh 5 archetype (temple Athena + cross Apollo + tower Argus + stack Clio + beacon Hermes + generic) + raw `<instancedMesh>` per archetype + treemap layout + ownership color encoding + LOD/frustum culling. File: `.claude/agents/iris.md`. Effort: xhigh. **ZERO Designer dependency, gas duluan paralel Daedalus**.

- **calliope** (Eloquence muse): Landing page exec dari Designer Prompt 1 bundle, Awwwards-tier sticky-pinned hero + 3-angle differentiator + 5 mode preview + 5 resident preview + cursor-flee shy creatures + hackathon credit footer. File: `.claude/agents/calliope.md`. Effort: high. **Wait condition**: spawn HANYA kalau `_meta/designer/prompt1-landing/handoff-bundle-extracted/` populated. Kalau kosong, ferry V1 Orch.

- **hestia** (Hearth goddess): Entry page exec dari Designer Prompt 2 bundle, 2-card entry (Import a repository + Build from scratch) + 5 resident footer + v0.3 prototype badge + Hermes single shy creature + OAuth handoff stub. File: `.claude/agents/hestia.md`. Effort: medium. Wait condition: cek `_meta/designer/prompt2-entry/handoff-bundle-extracted/`.

- **selene** (Moon goddess): Dashboard exec dari Designer Prompt 3 bundle, instrument-panel manager-facing + 1-sentence briefing + KPI glance + burndown + velocity + top contributors + spec drift A-E + refactor proposals + cross-repo rail + city preview corner (Argus quiet companion) + decide OQ-02 charts library (Recharts default). File: `.claude/agents/selene.md`. Effort: high. Wait condition: cek `_meta/designer/prompt3-dashboard/handoff-bundle-extracted/`.

Plus Wave 1 auditor:
- **eunomia** (Goddess of good order): Wave 1 audit gate (H1 60fps + 3 page mount + openspec validate + contract conformance + Lighthouse 90+). File: `.claude/agents/eunomia.md`. Effort: max. **Spawn AT END of Wave 1**, block Wave 2 kalau critical fail flag.

## 6. Initial Task (Wave 1 Entry)

**Step 1**: Spawn `daedalus` + `iris` paralel via Task tool. Zero Designer dependency, gas duluan.

```bash
# V1 Orch dispatch via Task tool
Agent({ subagent_type: "daedalus", description: "Wave 1 scene scaffold", prompt: "..." })
Agent({ subagent_type: "iris", description: "Wave 1 buildings + treemap", prompt: "..." })
# Parallel
```

**Step 2**: Cek Designer bundle state:

```bash
ls _meta/designer/prompt1-landing/handoff-bundle-extracted/ 2>/dev/null
ls _meta/designer/prompt2-entry/handoff-bundle-extracted/ 2>/dev/null
ls _meta/designer/prompt3-dashboard/handoff-bundle-extracted/ 2>/dev/null
```

- Kalau populated: spawn `calliope`, `hestia`, `selene` paralel.
- Kalau kosong satu/lebih: ferry V1 Orch "Designer bundle prompt X belum landing, page worker queued, Daedalus + Iris jalan terus." Options: (A) tunggu bundle, (B) Ghaisan manual paste prompt-design ke claude.ai/design + extract, (C) drop page scope dari Wave 1 (drop protocol decision).

**Step 3**: Monitor 5 worker (atau 2 worker kalau 3 page queued). Worker self-plan via `superpowers:writing-plans`, ferry kalau hit 1 of 5 trigger HIGH bar (critical block / contract conflict / anti-pattern directive / scope decision / downstream cascade). V1 Orch standby buat resolve ferry.

**Step 4**: End of Wave 1 = semua 5 worker ship criteria done per `.claude/agents/<worker>.md` Section 10. Spawn `eunomia` audit gate.

- Eunomia PASS = Wave 2 unlock (spawn Hera + Asclepius + Boreas + Persephone paralel).
- Eunomia FAIL = re-spawn failed worker dengan correction OR ferry V1 Orch untuk drop protocol activate decision.

## 7. Workflow Reference

**4 mandatory artifacts per worker per cycle**:
- Decision log (append-only): `_meta/decision_log/<worker>.md`
- Uncertainty journal (medium confidence concerns): `_meta/uncertainty/<worker>-cycle<N>-<timestamp>.md`
- Checkpoint (per cycle stop): `_meta/checkpoints/<worker>-cycle<N>.md`
- Handoff contract (per handoff): `_meta/handoff_log/wave<N>_<from>_to_<to>.md`

**Audit gate per wave** (Lock 10 mandatory):
- Wave 1 → Eunomia (`.claude/agents/eunomia.md`)
- Wave 2 → Dike (`.claude/agents/dike.md`)
- Wave 3 → Aletheia final (`.claude/agents/aletheia.md`)
- Post-Wave 3 → Pan (`.claude/agents/pan.md`)

**Cross-roomchat handoff**: trigger 60-70% context, format `_meta/handoff_log/`. Worker stop cycle, author handoff, resume via `/resume` next session.

**Confidence-based action** (worker):
- High (85%+): proceed normal
- Medium (60-85%): mandatory uncertainty journal + proceed dengan flag
- Low (<60%): ferry V1 Orch kalau 5 trigger hit, else conservative + journal

**Ferry conditions HIGH bar** (worker → V1 Orch):
1. Critical block (semua direction blocked + > 30 menit debug fail)
2. Contract conflict (Pythia contracts incompatible)
3. Anti-pattern violation di V1 Orch directive
4. Decision lewat scope domain
5. Downstream cascade risk (blast radius > 1 worker)

## 8. Anti-Pattern Locks (10, inherited semua worker)

1. No em dash anywhere (code, comments, docs, commit message)
2. No emoji
3. No silent scope narrow (cut feature documented eksplisit decision log)
4. No silent assume (label `[ASSUMED]` / `[UNVERIFIED]` / `[INFERRED]` kalau ga validated empirik)
5. Mock/placeholder labeling `[MOCK]/[PLACEHOLDER]/[STUB]` clear
6. Capacity respect (> 1 jam frustrated = STOP, 15 menit istirahat)
7. Greek mythology naming compliant (anti-collision matrix LOCKED `_meta/contracts/_anti_collision_matrix.md`)
8. No paid services tanpa Ghaisan approval (DeepSeek $5 Hafiz approved, free tier GitHub Actions + Vercel + Supabase OK)
9. V_n locked snapshot per major milestone (critical artifacts ga continuous edit, major change goes V_n+1)
10. Per-wave auditor mandatory (Eunomia/Dike/Aletheia/Pan)

## 9. Critical Phase B Anchors (per worker reference)

- **r3f baseline**: raw `<instancedMesh>` NOT Drei `<Instances>` per r3f #3306 (Iris ownership)
- **Drop-first feature flag order on regress**: DepthOfField → pixel ratio → Sparkles (Daedalus + Eunomia audit)
- **OpenSpec dual-folder**: two `openspec init` runs, both core profile, distinct `--tools` per folder (Themis Wave 0 + Pandora Wave 3 generator)
- **DeepSeek reasoning_content quirk**: NEVER replay `reasoning_content` from prior turns (Triton CRITICAL anti-pattern)
- **Shared 3000-token system header**: H6 hypothesis cache-hit 98% discount (this PromptOpening file)
- **drafts/ isolation safety property**: production code NEVER changes by simulation engine, ONLY via explicit user Accept (Pandora Wave 3, AD-19 LOCKED, pitch defensibility)

## 10. Capacity Gate

Wave 1 budget ~5.3 jam (~16:00-21:30 Day 1). Wave 2 ~7.2 jam (~21:30-04:45 Day 2). Wave 3 ~6.7 jam (~04:45-11:30 Day 2). Pan ~1.9 jam (~11:30+ Day 2).

Tim 2 orang (Ghaisan + Hafiz), sleep cycle rotation. Hafiz physically attend Day 2 final presentation MANDATORY (Refactory rule: absence = withdrawal). Ghaisan remote support OK.

## 11. Submission Day 2 Deliverable (per PRD Section 24)

- PRD .md (agent-consumed, di `docs/prd/` already shipped Council Wave 0)
- PRD .pdf (panitia pitch-tier, already shipped)
- C4 diagram 4-tier formal (Themis Wave 0 Task 2 ship)
- Repository link (github.com/Finerium/codeplexRefactory Themis Wave 0 init + push)
- Slide presentation (**Hafiz** finalize manual Day 2 jam 11-13 submission window, Pan author template)

## 12. Status

Wave 0 complete (Pythia + Hephaestus + Themis ship). Pythia contracts 33 + 2 index files di `_meta/contracts/`. Hephaestus 19 prompt + this PromptOpening di `.claude/agents/` + project root. Themis pending (project-local setup + C4 + openspec + ERD + PanitSubmission + STATUS.md initialize + git init + push Finerium).

STATUS.md initialized after Themis Wave 0 ship.

Ready Wave 1 spawn. Gas, daedalus + iris first.

---

**End of PromptOpening-codeplex-chronicle.md**. V1 Orch consume on Wave 1 spawn ~16:00 WIB Day 1, ferry workers via Task tool dengan `.claude/agents/<worker>.md` reference.
