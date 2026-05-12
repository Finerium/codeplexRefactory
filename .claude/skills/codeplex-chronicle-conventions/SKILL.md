---
name: codeplex-chronicle-conventions
description: Project-specific conventions for Codeplex Chronicle. Auto-load when authoring code, components, or infrastructure for this project. Covers Next.js 16 + React 19 + Three.js + r3f frontend patterns, FastAPI + tree-sitter backend patterns, DeepSeek V4 LLM client conventions, OpenSpec dual-folder strategy, file naming, common pitfalls, and dataset/draft isolation safety properties.
---

# Codeplex Chronicle Conventions

Use these conventions when authoring any code, infrastructure, or content for the Codeplex Chronicle hackathon project. Project type: hackathon (24-hour build, Refactory Round 03 Telkom Bandung 12-13 May 2026).

## Tech stack (LOCKED per PRD Section 17)

### Frontend
- **Next.js 16** with App Router + parallel route slots for chat/ticket/side panels
- **React 19** (concurrent rendering, Server Components where applicable)
- **TypeScript** strict mode (ESM modules, ESLint + Prettier auto-format)
- **Three.js 0.184** (LOCKED, no upgrade mid-hackathon)
- **@react-three/fiber 9.6** (LOCKED)
- **@react-three/drei** for OrbitControls + PerformanceMonitor + Sparkles + utility hooks
- **@react-three/postprocessing** for Bloom + DepthOfField pipeline
- **Tailwind CSS** for utility-first styling (config extension from Designer tokens)
- **GSAP** for cinematic motion (idle drift, camera fly)

### Backend
- **Python 3.12** strict (ruff + mypy strict, async/await aggressively)
- **FastAPI** async server
- **tree-sitter-language-pack** lazy-load (TS/JS, Python, Go, Java, C, C++, Rust, Ruby, PHP, Kotlin, Swift; 11 grammars)
- **Pydantic v2** for API contracts + LLM payload validation
- **asyncpg** for PostgreSQL async (NOT psycopg2)
- **SQLAlchemy 2.0** async (NOT 1.x legacy sync pattern)

### LLM
- **DeepSeek V4-Flash** primary (1M context, 384K max output, $0.14/$0.28 per 1M)
- **DeepSeek V4-Pro** secondary (1.6T MoE, $1.74/$3.48 per 1M, 75% off until 2026-05-31 15:59 UTC)
- Client SDK: `openai` Python SDK >=1.x with `base_url=https://api.deepseek.com`
- Legacy alias `deepseek-chat` / `deepseek-reasoner` DEPRECATED 2026-07-24, JANGAN pakai
- Per-resident routing locked PRD Section 18.3:
  - Athena (Refactor proposal): V4-Pro thinking high
  - Apollo (Health narration): V4-Flash non-thinking
  - Argus (Security CVSS): V4-Flash thinking low
  - Clio (Git/spec-drift narration): V4-Flash non-thinking
  - Hermes (Tour script): V4-Flash non-thinking

### Spec
- **OpenSpec Fission-AI core profile**
- **Dual-folder strategy** (LOCKED PRD D27):
  - Folder A `openspec/` panitia-facing primary spec
  - Folder B `.agent-openspec/` internal workflow agent output
- Both folders independent `openspec validate` clean

### Deploy
- **Kubernetes** namespace `duopoly` (Refactory pre-provisioned)
- **PostgreSQL** event store at `103.185.52.138:1185` db `duopoly`
- **NGINX Ingress** Refactory-managed TLS termination
- **Domain**: `duopoly.hackathon.sev-2.com`

### Auth
- **GitHub OAuth** akun Finerium (scope minimal: read:repo + read:org + read:issues + read:pull_requests + write:issues)
- NEVER request: `repo` (write code), `admin:org`, `admin:repo_hook`, `delete_repo`, `user:email`

## File naming conventions

- **Frontend file**: kebab-case (`building-tile.tsx`, `chat-panel.tsx`)
- **React component**: PascalCase exported (`BuildingTile`, `ChatPanel`)
- **Function / variable**: camelCase (`computeTreemap`, `buildingData`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_BUILDINGS`, `FEATURE_FLAGS`)
- **Test file co-located**: `<file>.test.ts` / `test_<file>.py`
- **Python module**: snake_case (`llm_client.py`, `tree_sitter_lazy.py`)
- **Python class**: PascalCase (`ApolloFinding`, `RefactorSimulation`)

## Git commit conventions

- Format: `opsx:<change-name>: <description>` if change tracked via OpenSpec
- Or: `feat:<scope>: <description>`, `fix:<scope>: <description>`, `refactor:<scope>: <description>`, `docs:<scope>: <description>`
- Branch naming: `feat/<feature>` / `fix/<bug>` / `refactor/<scope>` / `chore/<task>`
- NEVER: skip hooks (`--no-verify`), force push without explicit approval, amend published commits

## Common patterns

### Raw `<instancedMesh>` per archetype (NOT Drei `<Instances>`)

Per r3f issue #3306, raw instancedMesh provides better control + perf over Drei wrapper for 200-300 building scale. Use:

```tsx
<instancedMesh ref={meshRef} args={[null, null, count]}>
  <boxGeometry args={[1, height, 1]} />
  <meshStandardMaterial color={ownershipColor} />
</instancedMesh>
```

Update via `meshRef.current.setMatrixAt(idx, matrix)` + `meshRef.current.instanceMatrix.needsUpdate = true`.

### Drop-first feature flag order on regress

Per Phase B research H1 hypothesis. If r3f Canvas + InstancedMesh + 200-300 building stub drops below 60fps on M-series MBP 16GB, drop in order:
1. DepthOfField (`ENABLE_DOF=false`)
2. Pixel ratio (lower from 2.0 to 1.5)
3. Sparkles tier-3 (`ENABLE_SPARKLES_TIER_3=false`)
4. Third directional light (`ENABLE_THIRD_DIRECTIONAL_LIGHT=false`)

NEVER drop: InstancedMesh batching, deterministic treemap layout, ownership color encoding.

### DeepSeek reasoning_content quirk (CRITICAL)

NEVER replay `reasoning_content` from prior turns in multi-turn conversation. DeepSeek API ignores it but it pollutes context window unnecessarily.

```python
# WRONG: replay reasoning_content
messages = [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": prev.content, "reasoning_content": prev.reasoning_content},  # BAD
    {"role": "user", "content": "next turn"},
]

# RIGHT: only replay content
messages = [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": prev.content},
    {"role": "user", "content": "next turn"},
]
```

### Shared 3000-token system header (H6 cache-hit 98% discount)

Per `PromptOpening-codeplex-chronicle.md`. DeepSeek V4 caches system prompts; reuse shared header at session start for 98% cache hit discount. Header includes: project identity + tech stack + 5 resident persona + workflow + anti-pattern locks.

### drafts/ isolation safety property (AD-19 LOCKED)

Refactor Mode simulation writes to `drafts/<simulation-id>/` ONLY. Production code NEVER changes by simulation engine. Only via explicit user Accept action which then creates real diff via GitHub PR / patch.

Pitch defensibility: "AI explores in drafts, you commit to production." (per PRD D8)

### OpenSpec dual-folder cycle

```bash
# Folder A panitia primary (default)
cd ~/Documents/codeplexRefactory
openspec list specs       # see existing specs
openspec list changes     # see active changes
openspec validate <change-name>
openspec show change <change-name>
openspec archive <change-name>   # on Accept

# Folder B internal workflow agent
cd ~/Documents/codeplexRefactory/.agent-openspec
openspec validate
```

Both folders use core profile. Tools per folder may differ.

## Common pitfalls (avoid)

### Frontend pitfalls

1. **Drei Instances vs raw instancedMesh**: use raw (Phase B H3 finding)
2. **PerspectiveCamera + OrbitControls placement**: orbit must reference camera ref, NOT default camera
3. **state.performance.regress() listener**: hook into Canvas state.performance, NOT custom hook
4. **GSAP timeline cleanup**: ALWAYS call `tl.kill()` in useEffect cleanup, else memory leak
5. **Tailwind purge config**: ensure `frontend/components/**/*.tsx` + `frontend/app/**/*.tsx` in content array

### Backend pitfalls

1. **tree-sitter lazy load**: do NOT import all 11 grammars at startup; lazy load per-file-type request
2. **asyncpg connection pool**: use `asyncpg.create_pool` not raw `asyncpg.connect`
3. **SQLAlchemy 2.0 async**: use `AsyncSession` + `select()` query API, NOT 1.x `query()` legacy
4. **FastAPI background task**: use `BackgroundTasks` for simple async, Celery if > 30 sec processing (OQ-01 deferred Wave 3 decision)
5. **DeepSeek API rate limit**: respect 5-second timeout default, retry simplified prompt on 429

### LLM pitfalls

1. **NEVER replay reasoning_content** (see above)
2. **Thinking mode toggle via extra_body**: `extra_body={"thinking": {"type": "enabled"}}` + `reasoning_effort: "low" | "medium" | "high"`
3. **Cost tracking real-time**: log every call to `llm_call_log` table with `cost_estimate_usd` field
4. **Semantic cache cosine 0.85 threshold**: per Triton defensive layer pattern
5. **Pre-cached top 10 demo question canned responses**: latency under 100ms (per PRD Section 18.5)

### OpenSpec pitfalls

1. **Dual-folder confusion**: Folder A = panitia primary, Folder B = internal workflow. NEVER mix.
2. **`openspec/project.md` ~250 line**: comprehensive (project identity + product description + why + who + principles + conventions + entities + decisions + constraints + tech + scope). Do NOT leave `[TO ENRICH]` placeholders post-Wave 0.
3. **Domain spec seed 50-100 line each**: per product mode (onboarding / sprint / refactor / activity / health)
4. **`openspec validate` MUST pass clean**: no warning, no error, both folders

### Infrastructure pitfalls

1. **K8s Secret population**: 3 mandatory Secrets (`duopoly-deepseek`, `duopoly-github-oauth`, `duopoly-db`); NEVER commit raw secrets
2. **Docker multi-arch**: ARM64 (M-series Mac dev) + AMD64 (production K8s) both buildx
3. **NGINX Ingress TLS**: Refactory-managed, do NOT override cert-manager config
4. **DATABASE_URL URL-encoding**: special chars `*`, `>`, `{`, `?` properly encoded as `%2A`, `%3E`, `%7B`, `%3F` (already done in `.env`)
5. **kubeconfig location**: `~/.kube/duopoly-config` mode 600 outside repo entirely (NEVER commit kubeconfig)

## Authoritative source files

- `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` (canonical idea-locked spec, 2094 lines)
- `_meta/metis/Agentic_Structure-codeplex-chronicle.md` (worker / wave / contract blueprint)
- `_meta/contracts/_master_index.md` (33 contracts + 2 index files)
- `PromptOpening-codeplex-chronicle.md` (Wave 1 spawn directive + shared session header)
- `openspec/project.md` (project context for OpenSpec, Themis Wave 0 enriches to 250 line)
- `CLAUDE.md` (auto-loaded by Claude Code, project context)

## Wave-specific guidance

### Wave 1 (visual foundation, ~16:00-21:30 Day 1)

Worker prompt files: `daedalus.md`, `iris.md`, `calliope.md`, `hestia.md`, `selene.md` + `eunomia.md` auditor.

Key conventions:
- Mock data hardcoded JSON in frontend (1 demo repo represent)
- All Designer pages from claude.ai/design bundle landing `_meta/designer/prompt{1,2,3}-{landing,entry,dashboard}/handoff-bundle-extracted/`
- 60fps target verified via Drei PerformanceMonitor

### Wave 2 (visual modes, ~21:30 Day 1 - ~04:45 Day 2)

Worker prompt files: `hera.md`, `asclepius.md`, `boreas.md`, `persephone.md` + `dike.md` auditor.

Key conventions:
- HERO Mode = Sprint Mode (14 PM concept overlay) per Hera worker
- Mock data kaya (multi-repo demo dataset stub)
- Panels mount into Calliope parallel route slots (@chat @ticket @side)

### Wave 3 (backend full, ~04:45-11:30 Day 2)

Worker prompt files: `hades.md`, `triton.md`, `nemesis.md`, `pandora.md`, `demeter.md`, `atlas.md` + `aletheia.md` auditor.

Key conventions:
- Real DeepSeek V4 client + defensive layer
- Real GitHub OAuth + webhook HMAC signature verification
- Real tree-sitter 11-language lazy load (cold start < 300ms)
- Real Postgres event store + materialized views
- K8s deploy live at `duopoly.hackathon.sev-2.com`

---

**Conventions last updated**: 2026-05-12 16:40 WIB by Themis Wave 0
**Source authority**: PRD Section 17 tech stack lock + Metis md + Phase B Topic B research finding
