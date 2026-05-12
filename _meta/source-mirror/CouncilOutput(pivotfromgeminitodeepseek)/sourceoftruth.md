# Source of Truth: Codeplex Chronicle

**Audience**: Metis (`/metis-v1`), Designer (`/designer-v1`), Orches (`/orches-v1`), Pan, plus semua worker yang spawn dari Orches Wave 0-3.

**Purpose**: state-of-the-world snapshot per 12 Mei 2026 ~10:47 WIB post-Council session. Baca dulu sebelum mulai kerjaan lu, biar ga tanya ulang setup, ga re-litigate locked decision, ga salah assume credentials.

**Authored by**: V1 Council hari-H session (idea-draft Council mandate executed, PRD locked).

**Trust ranking**:
1. `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` (canonical idea-locked source of truth, 2094 lines comprehensive)
2. `docs/context/idea-draft_codeplex-chronicle.md` (pre-event brainstorm + 8+ rounds deliberation summary)
3. This file (`sourceoftruth.md`) = current execution state context
4. `docs/context/research_finding.md` (pre-event deep research Topic A-F)
5. `docs/context/RefactoryHackathonRules&FAQ.txt` (Refactory rules formal compliance baseline)

---

## 1. Project Identity (Locked)

| Field | Value |
|---|---|
| Name | Codeplex Chronicle |
| Tagline | YOUR CODEBASE, ALIVE |
| Type | hackathon (24-jam build, Refactory Round 03 Telkom) |
| Team | Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin) |
| Event | Refactory Hackathon Round 03, Telkom University Bandung |
| Date | 12-13 Mei 2026 (kickoff Day 1 jam 13:00 WIB, submission Day 2 jam 11-13, pitch Day 2 jam 15-17 kalau top 5) |
| Theme | Engineering Productivity x AI |
| Domain | https://duopoly.hackathon.sev-2.com (pre-provisioned by Refactory) |
| GitHub akun | **Finerium** (Ghaisan's account, Claude Code authorized) |
| Repository | github.com/Finerium/codeplexRefactory (Wave 0 init by Claude Code, BELUM ada) |

---

## 2. Folder Structure (DONE, scaffolding selesai)

Local project root: `~/Documents/codeplexRefactory/`

```
.claude/{agents,commands,skills}/        Hephaestus drop prompts here Wave 0
.agent-openspec/{changes,specs,archive}/ Folder B internal workflow agent output
openspec/{changes,specs,archive}/        Folder A panitia-facing primary spec
  └── project.md                         Stub seed, Pythia enrich Wave 0 ke ~250 line
_meta/council/{deliberation,research}/   Council artifact (this session output landing here optional)
_meta/{metis,designer,orches}/           Metis/Designer/Orches artifact landing
docs/
  ├── prd/                               PRD-ideaLocked .md + .pdf udah landing
  ├── c4/                                C4 diagram Claude Code agent generate
  ├── handoffs/                          Cross-roomchat handoff zips
  ├── pitch/                             2-min demo flow + Q&A defense cards
  └── context/                           Source documents (idea-draft, research_finding, Refactory rules, idea-draft PDF, duopoly.zip)
slides/                                  Hafiz handle Day 2 jam 11-13 submission window
frontend/                                Next.js 16 + Three.js + r3f (Wave 1-2 init)
backend/                                 FastAPI + tree-sitter (Wave 3 init)
infra/{k8s,docker}/                      K8s manifests + Dockerfile (Wave 3)
drafts/                                  Refactor Mode simulation sandbox (gitignored)
scripts/day0-prep/                       Demo dataset fork + GitHub API populate script
datasets/                                Cached parser output for demo repos (gitignored)
```

Files udah ada di root:
- `.env` (mode 600, gitignored, populated dengan DeepSeek key + locked model names + Refactory env vars placeholder)
- `.env.example` (template no secrets, committable)
- `.gitignore` (env files, node_modules, .venv, drafts/*, datasets/cache, K8s secrets)
- `README.md` (project intro, structure, workflow)

**Files BELUM ada**:
- `PromptOpening-codeplex-chronicle.md` (Hephaestus Wave 0 author)
- `_meta/metis/AGENT_STRUCTURE.md` (Metis author)
- `_meta/metis/Diagram.html` (Metis author)
- `_meta/designer/prompt-design_codeplex-chronicle.md` (Designer-v1 author)
- `docs/c4/*` (Claude Code agent generate)
- Frontend boilerplate (Wave 1 init)
- Backend boilerplate (Wave 3 init)
- K8s manifests (Wave 3)

---

## 3. Credentials State

### 3.1. DeepSeek API (LIVE, ready to use)

Stored di `~/Documents/codeplexRefactory/.env` (mode 600, gitignored):

```env
DEEPSEEK_API_KEY=REDACTED_DEEPSEEK_KEY
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FLASH=deepseek-v4-flash
DEEPSEEK_MODEL_PRO=deepseek-v4-pro
```

**Key context**:
- One-time hackathon throwaway account (Ghaisan + Hafiz aware, accepted risk)
- Hafiz subscribe paid tier, total $5 budget, comfortable buffer untuk 24-jam scope (estimated spend $2-4)
- DeepSeek V4 launched 24 April 2026, V3.x deprecated 24 Juli 2026
- Pricing per 1M token:
  - V4-Flash: $0.14 input / $0.28 output
  - V4-Pro: $1.74 input / $3.48 output (75% off until 31 Mei 2026 15:59 UTC)
- API compatibility: OpenAI ChatCompletions API + Anthropic API both supported, same base_url
- Context window: 1M tokens both models
- Reasoning modes: Non-think (fast) / Think High / Think Max, toggle via `extra_body={"thinking":{"type":"enabled"}}` + `reasoning_effort` parameter

**Client setup**: pakai `openai` Python SDK >=1.x dengan `base_url=https://api.deepseek.com`, drop-in OpenAI ChatCompletions pattern. Backend Worker tinggal `from openai import AsyncOpenAI; client = AsyncOpenAI(api_key=os.environ["DEEPSEEK_API_KEY"], base_url=os.environ["DEEPSEEK_BASE_URL"])`.

**Model selection per AI resident** (locked per PRD Section 18.3):
- Athena (Refactor proposal author): V4-Pro thinking mode high
- Apollo (Health narration): V4-Flash non-thinking
- Argus (Security CVSS scoring): V4-Flash thinking low
- Clio (Git/spec-drift narration): V4-Flash non-thinking
- Hermes (Tour script): V4-Flash non-thinking
- Refactor simulation engine: V4-Pro thinking high (Think Max untuk complex)

### 3.2. GitHub (akun ready, OAuth app PENDING Wave 0)

- Akun: **Finerium** (Ghaisan's personal GitHub)
- Claude Code udah authorized akses akun ini, bisa git ops + GitHub API
- Repo `codeplexRefactory` BELUM dibuat di akun, Wave 0 Claude Code init + push

Pending Wave 0:
```env
GITHUB_CLIENT_ID=          # Wave 0 Claude Code create OAuth app di akun Finerium
GITHUB_CLIENT_SECRET=      # Wave 0 create, fill .env
GITHUB_WEBHOOK_SECRET=     # Wave 0 generate, fill .env
```

OAuth scopes minimal locked (per PRD Section 19.3):
```
read:repo, read:org, read:issues, read:pull_requests, write:issues
```

NOT requested: `repo` (write code), `admin:org`, `admin:repo_hook`, `delete_repo`, `user:email`.

### 3.3. Refactory Pre-Provisioned (PENDING hari-H Day 1)

Fill saat panitia kasih credentials di team folder duopoly:

```env
DATABASE_URL=postgresql://duopoly:CHANGEME@HOST:5432/duopoly
KUBECONFIG_PATH=
```

Yang udah locked:
- K8s namespace: `duopoly`
- Domain: `duopoly.hackathon.sev-2.com` (NGINX ingress Refactory configured)
- PostgreSQL: Refactory managed

### 3.4. Feature Flags (kill-switch ready, default ON)

Per PRD Section 7.1 dan Section 13.4 (visual feature flag killswitch untuk demo lag fallback):

```env
ENABLE_WRITE_OPS=true                 # Hybrid Write Layer 1 (Apollo -> GitHub issue)
ENABLE_WRITE_OPS_LAYER_2=true         # Hybrid Write Layer 2 (Refactor simulation)
ENABLE_DOF=true                       # DepthOfField post-processing (drop first if regress)
ENABLE_SPARKLES_TIER_3=true           # 3-tier Sparkles particles
ENABLE_THIRD_DIRECTIONAL_LIGHT=true   # Third directional shadow (drop if regress)
```

---

## 4. Workflow Chain State

```
Council (PRD authoring)           ✅ DONE this session, PRD locked
    |
    | PRD-ideaLocked .md + .pdf landed di docs/prd/
    v
(fork paralel, Ghaisan run sequential per roomchat)
   /                          \
  /                            \
Designer-v1 (3 UI prompt)    Metis (AGENT_STRUCTURE.md)
                              ⏳ PENDING fire by Ghaisan
   \                            /
    \                          /
     v                        v
Orches-v1 Mode A consume PRD + AGENT_STRUCTURE + prompt-design
     ⏳ PENDING fire by Ghaisan (setelah Metis + Designer done)
     |
     v
Wave 0 (Pythia + Hephaestus + Themis, Wave 0 specialists shrunk dari 5 ke 3 per Council Mode A flow)
Wave 1 (visual foundation: 3D scene + buildings + landing + entry + dashboard)
Wave 2 (visual modes: Sprint hero + Health glow + Onboarding fly + Activity heatmap + Refactor ghost)
Wave 3 (backend full: FastAPI + tree-sitter + GitHub OAuth + webhook + DeepSeek simulation engine + K8s deploy + slide deck via Pan)
     |
     v
Submission Day 2 jam 11-13 WIB
     |
     v
Pitch (kalau top 5) Day 2 jam 15-17 WIB
```

---

## 5. Submission Deliverable Mapping

| Deliverable | Owner | Status | Location |
|---|---|---|---|
| PRD .md (agent-consumed) | Claude (Council) | ✅ DONE | `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` |
| PRD .pdf (panitia-facing pitch-tier) | Claude (Council) | ✅ DONE | `docs/prd/PRD-ideaLocked_codeplex-chronicle.pdf` (21 pages A4) |
| C4 diagram high-level (4-tier formal) | Claude Code agent (Wave 0 or Wave 3) | ⏳ PENDING | `docs/c4/` |
| Repository link | Claude Code (Wave 0 init + push) | ⏳ PENDING | github.com/Finerium/codeplexRefactory |
| Slide presentation | **Hafiz** (Day 2 jam 11-13 submission window) | ⏳ PENDING | `slides/` |

Note: slides BUKAN agent scope. Hafiz handle manual, agent boleh kasih prompt template + draft outline kalau Hafiz minta (Pan worker handle).

---

## 6. Operating Mode: Hands-Off

**Operator role Ghaisan + Hafiz** (TIGA hal saja):
1. **Relay handoff antar agent**: paste output satu agent ke konteks agent berikutnya, drive workflow forward
2. **Decision approval**: kalau ada gate approval (e.g., Athena propose major refactor di simulation, Hephaestus minta feature flag toggle), Ghaisan/Hafiz approve
3. **Ferry knowledge**: capture insight dari satu agent ke konteks agent lain via handoff document

**Yang Claude Code handle** (BUKAN Ghaisan/Hafiz):
- Folder structure setup ✅ (sudah selesai)
- Dependency install (npm, pip, OpenSpec init)
- Code generation full
- File operations (create, edit, delete, refactor)
- Git operations (init, commit, push ke Finerium)
- OpenSpec cycles full (`/opsx:propose` -> `/opsx:apply` -> `/opsx:archive`)
- K8s deployment ke `duopoly.hackathon.sev-2.com`
- Database schema setup PostgreSQL
- Demo dataset preparation (fork repo, populate Milestones+issues+PR via GitHub API)
- Smoke test + debug
- C4 diagram authoring

**Sleep-cycle handoff**: Hafiz handle saat Ghaisan tidur, Ghaisan handle saat Hafiz tidur, gantian. Bukan domain split, bukan tugas spesifik. Hafiz physically attend Day 2 final presentation mandatory (Refactory rule: absence = withdrawal).

---

## 7. Locked Decisions (JANGAN re-litigate)

30 decisions locked di PRD Section 28 Appendix A Decision Log. Highlight yang downstream agent paling sering tergoda re-debate:

| # | Decision | Rationale singkat |
|---|---|---|
| D8 | Pitch closing = hybrid 3 angle, punchline *"AI explores in drafts, you commit to production"* | Defensibility tinggi di Q&A safety lens |
| D11 | Iris resident DROPPED, narration distribute ke Clio (git/drift/activity) + Apollo (health) + Athena (refactor) | Avoid bloat, 5 resident sufficient |
| D14 | Pitch positioning: substansi-first, city = interface BUKAN value prop | Past winner pattern Refactory R01-02 = AI dev productivity tools, BUKAN flashy 3D |
| D17 | Multi-language tree-sitter LOCKED 11 language (TS/JS, Python, Go, Java, C/C++, Rust, Ruby, PHP, Kotlin, Swift) | Bukan cuma TS/JS, revert dari MVP scope IDEATION asli |
| D18 | LLM provider = **pure DeepSeek V4 (Flash + Pro)**, BUKAN Gemini | Day-0 shift, $5 paid Hafiz, OpenAI-compat drop-in |
| D22 | Designer-v1 scope = 3 prompt (Landing, Entry, Dashboard). City View NOT Designer scope | 3D scene = imperative r3f code, ga bisa di-prompt static UI |
| D23 | Workflow sequencing = visual frontend-first (Wave 1-2 visual, Wave 3 backend) | Visual quality bar differentiator, susah revisi belakangan |
| D24 | Hands-off mode operator only | Section 6 above |
| D27 | OpenSpec dual-folder strategy LOCKED per panitia eksplisit request | Folder A `openspec/` panitia-facing primary, Folder B `.agent-openspec/` internal workflow |

**Kalau downstream agent detect ada decision yang perlu di-revise**: FERRY ke Ghaisan/Hafiz, JANGAN unilateral edit PRD content. Idea lock dari Council, same untuk AGENT_STRUCTURE.md (Metis output di-treat canonical setelah Metis selesai).

---

## 8. Open Questions (downstream handle, DETAIL di PRD Section 25)

Legit untuk agent resolve di phase respective:

| # | Question | Owner |
|---|---|---|
| OQ-01 | Background task: FastAPI BackgroundTasks vs Celery | V1 Orch Wave 3 |
| OQ-02 | Charts library Dashboard: Recharts vs Chart.js | Designer-v1 hari-H |
| OQ-03 | UI library: shadcn vs Mantine vs custom Tailwind | Designer-v1 hari-H |
| OQ-04 | CI/CD: GitHub Actions vs manual `kubectl apply` | V1 Orch Wave 3 |
| OQ-05 | PR comment surfacing visual approach (3 candidate) | Designer-v1 hari-H |
| OQ-06 | Earthquake error visual precise trigger condition | V1 Orch Wave 1 |
| OQ-07 | DeepSeek V4-Pro vs V4-Flash optimal split per resident finer tuning | V1 Orch Wave 2-3 |
| OQ-08 | Pre-cached top 10 demo questions exact list | V1 Orch Wave 2-3 |
| OQ-09 | Refactor "Accept changes" impl: download diff vs PR create | V1 Orch Wave 3 |
| OQ-10 | C4 diagram tooling: Mermaid vs PlantUML vs draw.io vs custom SVG | V1 Orch Wave 0 (Claude Code) |

---

## 9. Anti-Pattern Locks (inherited oleh semua agent)

Locked per Council/Orches workflow standar, JANGAN violate regardless of project type:

1. **No em dash** (`--` sequence) di output, code, doc, commit message, anywhere
2. **No emoji** di output apapun
3. **No silent scope narrow** (dokumented eksplisit kalau cut feature, BUKAN diam-diam drop)
4. **No silent assume** (assumption surfaced eksplisit, di-label `[ASSUMED]` / `[UNVERIFIED]` / `[INFERRED]` kalau ga validated)
5. **Mock/placeholder labeling**: code mock label `[MOCK]/[PLACEHOLDER]/[STUB]` clear
6. **Capacity respect**: kalau operator/agent frustrated > 1 jam, STOP, istirahat, resume later (or handoff)
7. **Greek mythology naming compliant**: agent name canonical, ga improvise
   - Council: Momus, Eos, Prometheus, Hermes, Argus, Mnemosyne
   - Orches Wave 0: Pythia, Hephaestus, Themis
   - Orches auditor: Eunomia, Dike, Aletheia
   - Universal worker: Pan
   - Product residents: Athena, Apollo, Argus, Clio, Hermes (Hermes collide -> rename worker pool `Hermes_V2` kalau perlu)
8. **No paid services** tanpa Ghaisan eksplisit approval (DeepSeek udah approved, $5 budget)
9. **V_n locked snapshot** per major milestone, no edit post-snapshot, edit goes to v_n+1
10. **Per-wave auditor mandatory** (Orches Wave 0-3 each end run Eunomia/Dike/Aletheia audit)

---

## 10. Communication Style Locked

- Bahasa Indonesia casual register (gw/lu), English code-switch untuk technical term
- No em dash, no emoji (anti-pattern lock 1+2 above)
- LaTeX rendering untuk math notation (inline `$...$`, display `$$...$$`)
- Kelompok B5 (MedWatch Creative Website) dan "vibemaxxing" itu entirely separate teams dari project ini, NEVER conflate
- PRD .md = agent-consumed (heavy detail, 2094 lines), PRD .pdf = panitia-facing pitch-tier (21 pages A4)

---

## 11. Next Steps Per Agent

### Untuk Metis (`/metis-v1` di roomchat baru)

1. Aktifin Deep Research toggle di chat panel **SEBELUM** attach
2. Attach:
   - `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` (canonical idea-locked source of truth)
   - `sourceoftruth.md` (this file, current execution state)
   - Optional: `docs/context/idea-draft_codeplex-chronicle.md` (pre-event reference)
3. Metis Deep Research scope:
   - Multi-agent orchestration patterns (Anthropic multi-agent research system reference)
   - r3f visual frontend-first workflow patterns
   - DeepSeek V4 multi-turn coordination patterns
   - Hands-off operator workflow patterns
4. Output 3 artifact:
   - Deep Research artifact (analysis output)
   - `AGENT_STRUCTURE.md` (canonical, visual frontend-first wave sequencing per PRD Section 26.2)
   - `Diagram.html` (interactive agentic structure diagram)
5. Worker design philosophy: pintar multi-task per worker (BUKAN granular 1-task-per-worker), per idea-draft Section C
6. Landing: `_meta/metis/`

### Untuk Designer-v1 (`/designer-v1` di roomchat baru, paralel Metis OK)

1. Attach:
   - `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` (Section 1-9 + 13 + 19 paling relevan)
   - `sourceoftruth.md` (this file)
2. Author 3 prompt buat claude.ai/design platform:
   - **Prompt 1**: Landing Page Awwwards-tier (sections per PRD Section 26.1: Hero + tagline + 3-angle differentiator + 5 modes preview + 5 residents preview + tech stack signal + Refactory hackathon credit + glassmorphism)
   - **Prompt 2**: Application Entry Page (replace current Claude template, 2 entry cards "Import a repository" + "Build from scratch", 5 resident introduction footer, `v0.1 prototype` badge)
   - **Prompt 3**: Dashboard View flat 2D manager-facing (velocity + burndown + milestone progress + contributor analytics + spec-drift summary + refactor proposal status + cross-repo summary + embedded city preview corner)
3. Decide hari-H:
   - Charts library: Recharts vs Chart.js (OQ-02)
   - UI library: shadcn vs Mantine vs custom (OQ-03)
   - PR comment surfacing visual (sticky note 3D vs floating bubble vs marker pin + badge) (OQ-05)
4. City View BUKAN scope (3D scene = imperative r3f code, Claude Code worker handle Wave 1-2)
5. Landing: `_meta/designer/prompt-design_codeplex-chronicle.md`

### Untuk Orches-v1 (`/orches-v1` Mode A di roomchat baru, SETELAH Metis + Designer done)

1. Attach 4 file:
   - `docs/prd/PRD-ideaLocked_codeplex-chronicle.md`
   - `_meta/metis/AGENT_STRUCTURE.md` (Metis output)
   - `_meta/designer/prompt-design_codeplex-chronicle.md` (Designer output)
   - `sourceoftruth.md` (this file)
2. Mode A behavior:
   - Skip Phase A (brainstorm, idea LOCKED di PRD Section 1+2)
   - Skip Phase F.1 project type re-triage (sourced dari PRD Section 1 = `hackathon`)
   - Skip Phase B re-debate scope (PRD Section 7 lock + AGENT_STRUCTURE blueprint)
3. Phase C onwards spawn Wave 0 specialists shrunk dari 5 ke 3:
   - **Pythia**: contracts per DAG edge dari AGENT_STRUCTURE.md
   - **Hephaestus**: worker + auditor prompts ke `.claude/agents/` + author `PromptOpening-codeplex-chronicle.md` di project root
   - **Themis**: translate AGENT_STRUCTURE.md ke `_meta/` canonical files + project-local `.claude/` setup
4. Wave 1-3 execution per visual frontend-first sequencing (PRD AD-05 Section 8.3)
5. Per-wave audit mandatory (Eunomia/Dike/Aletheia)
6. Pan handle atomic task Day 2 (slide deck prompt, demo rehearsal smoke test, bug sweep, polish)

---

## 12. Verifikasi Quick Sanity Check

Sebelum agent mulai kerjaan, run:

```bash
cd ~/Documents/codeplexRefactory && \
ls -la .env && \
cat .env | grep -E "DEEPSEEK_(API_KEY|BASE_URL|MODEL_FLASH|MODEL_PRO)" && \
ls -la docs/prd/ && \
ls docs/context/
```

Expected output:
- `.env` mode `-rw-------` (mode 600, owner only)
- 4 DeepSeek env vars visible
- `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` + `.pdf` exist
- `docs/context/` ada `idea-draft_codeplex-chronicle.md`, `idea-draft_codeplex-chronicle.pdf`, `research_finding.md`, `refactory-hackathon-WebsiteInformation.md`, `RefactoryHackathonRules&FAQ.txt`, `duopoly.zip`

Kalau ada yang missing, ferry Ghaisan/Hafiz sebelum lanjut.

---

**End of sourceoftruth.md**. Council session closes. Gas hari-H.
