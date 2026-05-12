# Codeplex Chronicle — Deep Research Brief (Refactory Hackathon Round 03, Telkom University Bandung, May 12–13, 2026)

## TL;DR

- **Demo dataset (Topic A):** Lead with **OWASP NodeGoat** (intentionally insecure Node.js app, ~50–100 files, MIT-class license, hits all 5 Health detectors, deep OWASP recognition in Indonesian dev community) as the headline demo, paired with **fastapi/full-stack-fastapi-template** (MIT, FastAPI+React+PostgreSQL — mirrors your own stack and is "boring-correct" for contrast), and keep **OWASP Juice Shop** as a "stress demo" only if you can hide its size (it has 70+ production deps but the file count balloons well past 300, hurting render time). Avoid Tokopedia/Gojek/Bukalapak public repos — they are mostly mature SDK/library code with low Health-detector firing potential and weak hackathon storytelling.
- **OpenSpec (Topic B):** OpenSpec (Fission-AI/OpenSpec, ~34.6k–46.1k stars, very actively maintained as of May 2026) has changed substantially since the v1.0 / OPSX rebuild — the `openspec init --tools claude --profile core` command and slash commands like `/opsx:propose`, `/opsx:apply`, `/opsx:archive` are real and stable, but the older `proposal.md → design.md → tasks.md` doc structure now lives inside `openspec/changes/<name>/` with delta-spec subfolders, and many older blog posts are out of date. There are documented Claude Code Plan-Mode failures, MALFORMED_FUNCTION_CALL-style flakiness in agent loops, and the team should expect ~10–20% of OpenSpec cycles to need manual intervention — running 50+ cycles in 24h is plausible but only with the **core** profile, not the expanded one.
- **Past winners + reality checks (Topics C–F):** Round 01 (UGM) was won by **Tim LUNARIS (Telkom University)** under the explicit "OpenSpec × AI" theme, and Round 02 (UNAIR, Apr 8–10, 2026) winner was not publicly disclosed but UNAIR's own **Tim Case Release / Effix.ai (an AI code optimizer)** placed 3rd — *the dominant winner pattern is AI-assisted developer productivity tooling that ships deployed and demoable*, not flashy 3D. This means Codeplex Chronicle's 3D city is a **differentiation bet, not a winning bet on its own** — the Argus pitch must lead with engineering-productivity outcomes (Onboarding, Refactor, Health) and treat the city as the visual hook, not the value prop. r3f at 200–300 InstancedMesh buildings + post-pipeline is feasible on M-series Macs (~60fps) but you should drop DepthOfField first if you regress; Gemini 2.5 Flash on the free tier gives ~10 RPM / 250–1500 RPD per project (3 keys ≈ 30 RPM), TTFT ~0.72–0.77s on AI Studio — fast enough for <2s tool-call demos, but **MALFORMED_FUNCTION_CALL is a documented frequent failure** that mandates retry+fallback logic.

---

## Key Findings

### TOPIC A — Demo Dataset Candidate Repositories (HIGHEST PRIORITY)

**High-confidence recommendation: a 2-repo "headline + foil" pairing, with a 3rd as fallback.**

| # | Repo (URL) | Files (approx.) | Languages | License | Health-Detector Firing | Indo Recognition | Visual Richness | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | **OWASP/NodeGoat** (`github.com/OWASP/NodeGoat`) | ~80–120 src files; small enough | JS, EJS, HTML, Mongoose | Apache-2.0 | **5/5** — explicitly built around OWASP Top 10: hardcoded secrets, NoSQL injection (≈ unsafe SQL), missing access control on `/allocations/<id>` route, vulnerable jsonwebtoken/express-jwt versions, broken authentication. Has tutorial pages explaining each. | High — OWASP Top 10 is the de-facto Indonesian appsec curriculum (Refactory's own bootcamp, GEMASTIK Software-Dev division, Telkom Univ FIF security electives all reference it). | Multi-folder (`app/views/`, `app/routes/`, `app/data/`, `config/`, `test/`) → maps cleanly to 5–7 districts. | **PRIMARY DEMO.** All 5 Health detectors fire authentically; perfect for Argus to narrate "this district is on fire." |
| 2 | **fastapi/full-stack-fastapi-template** (`github.com/fastapi/full-stack-fastapi-template`) | ~150–250 files; backend (FastAPI/SQLModel) + frontend (React/TanStack) + scripts | Python, TypeScript, Dockerfile, YAML | MIT | **3/5** — Has the famous `SECRET_KEY=changethis` hardcoded-secret default, `FIRST_SUPERUSER_PASSWORD=changethis`, env-var driven CORS list (mis-config detector). Lower on outdated-deps and unsafe-SQL because it uses SQLModel. | Very high — Tiangolo / FastAPI is the most-adopted Python web framework in Indonesia per dev.to ID and Refactory's own Python track. | Clean district split: `backend/app/`, `frontend/src/`, `scripts/`, `.github/workflows/`. | **SECONDARY / "boring-correct" foil.** Mirrors your own stack, judges instantly recognize it, contrasts NodeGoat's vulnerability-festival. |
| 3 | **OWASP/PyGoat** (`github.com/adeyosemanputra/pygoat`) | ~60–90 files | Python (Django), HTML | MIT | **5/5** — covers full 2017 + 2021 OWASP Top 10 incl. broken access control, SQLi, sensitive data exposure, vulnerable pyyaml 5.1 (CVE-flagged). | Medium — Python-Django still strong in Indonesian academic circles. | Smaller scene; fewer districts. | **FALLBACK** if NodeGoat fails to load or Hafiz wants a Python-flavored alternative. |
| 4 | **trottomv/python-insecure-app** | ~20–30 files | Python (FastAPI) | MIT | **5/5** — explicitly lists hardcoded secrets, insecure deps, SSTI; aligned 1:1 with team's stated 5-detector list. | Low — niche educational repo, unfamiliar to most Indonesian devs. | Too small for a satisfying city. | **REJECTED** for headline use; useful as a **dev-time unit-test fixture** for the 5 detectors. |
| 5 | **juice-shop/juice-shop** | 1,000+ src files (Angular + Express, post-Angular-13 the count is large) | TS, JS | MIT | **5/5** — gold standard, 100+ challenges. | Highest — universally known. | Visually rich but **too big** — fails the 50–300 file rule and will hammer the renderer past your 300-building target. | **REJECTED** for default load; mention in pitch as "Codeplex Chronicle scales here too" but don't render it live. |
| 6 | **OWASP/railsgoat** | ~150–200 files | Ruby (Rails 8) | MIT | **5/5** | Lower — Ruby/Rails is uncommon in Indonesia. | Good. | **REJECTED** — Indonesian judges use Go/Node/Python/Java; Rails is a cultural mismatch. |
| 7 | Tokopedia, Gojek, Bukalapak public orgs | Mostly small-to-mid SDKs (`gripmock`, `clickstream-android`, `courier-iOS`, `gnostic`, `snowboard`) | Go, Swift, Kotlin, JS | Apache-2.0 / MIT | **1–2/5** — these are *production-quality library* repos, intentionally clean. Almost no firing for Health detectors except occasional dep drift. | **Highest brand recognition** — judges from Refactory-aligned ID industry will nod immediately. | Many are single-folder libraries → boring city, mostly one district. | **REJECTED** as primary, but you can **mention them** in the pitch as "Codeplex Chronicle works on real Indonesian unicorn code, here's a pre-rendered shot." Use one (e.g., `tokopedia/gripmock`, Apache-2.0, ~50 files, Go) as a **bonus screenshot** during pitch to signal cultural relevance — high-payoff, low-risk because it's not on the live demo path. |
| 8 | **gothinkster/realworld** Conduit reference impls | varies (~80–150 per impl) | Many | MIT | **2/5** — generally clean code, occasional outdated deps. | Medium — known among engineering-blog readers. | Good multi-district split. | **OPTIONAL** — useful as the "before/after refactor" demo for the Refactor mode, since judges can mentally diff the canonical Conduit spec against rendered code. |

**Hardcoded recommendation for the team:**
1. Pre-load NodeGoat + full-stack-fastapi-template at boot.
2. Pre-render screenshots of `tokopedia/gripmock` and `gojek/courier-android` for the closing slide ("works on real Indonesian production code").
3. Have PyGoat ready as a hot fallback.
4. Do **not** ship Juice Shop in the live demo bundle — it's >300 files and the cold-load FPS hit destroys the wow moment.

(Confidence: **high** for the primary recommendations; **medium** for exact file counts since GitHub doesn't surface them in search snippets and they fluctuate per release.)

---

### TOPIC B — OpenSpec Validation (HIGH PRIORITY)

**High-confidence findings (act on these):**

1. **Maturity is real.** Fission-AI/OpenSpec has roughly **34.6k stars (older snapshot)** rising to **~46.1k stars by May 2026**, fork count ~2.3k, very active issue/PR flow into May 2026 (issues #1067/#1065/#1064 all opened May 7, 2026). Active maintainer is `@0xTab`/TabishB; weekly release cadence; v1.0 stable shipped before May 2026. The framework is no longer experimental.
2. **Canonical folder layout (current as of May 2026):**
   ```
   openspec/
     specs/                 # source of truth (per-domain spec.md)
       <domain>/spec.md
     changes/               # one folder per active change
       <change-name>/
         proposal.md        # why + what
         design.md          # technical approach
         tasks.md           # implementation checklist
         specs/             # delta specs (ADDED/MODIFIED/REMOVED)
           <domain>/spec.md
       archive/             # completed changes, dated
     config.yaml            # optional project config
     schemas/               # optional custom artifact schemas
   ```
   Note the change folder also contains a nested `specs/` for *delta* specs — this surprised people in older blog posts that referenced `proposal.md` only.
3. **Slash command syntax (Claude Code uses `:`, others use `-`):** `/opsx:propose <idea>`, `/opsx:explore`, `/opsx:apply [<change-name>]`, `/opsx:archive`, `/opsx:sync`. Expanded profile adds `/opsx:new`, `/opsx:continue`, `/opsx:ff`, `/opsx:verify`, `/opsx:bulk-archive`, `/opsx:onboard`. Default profile is **core** (`propose, explore, apply, sync, archive`). Switch via `openspec config profile` then `openspec update`.
4. **Init flags confirmed:** `openspec init --tools claude` works. `--tools claude,cursor` for multi. `--tools all` for all 25+. `--profile core` overrides for that init only. Tool IDs include: `claude, cursor, codex, gemini, github-copilot, opencode, windsurf, kiro, cline, roocode, trae, qwen, ...` (full list in docs/supported-tools.md).
5. **Claude Code integration mechanics:** OpenSpec writes to `.claude/skills/` (skill directory, auto-detected by Claude Code) and optionally `.claude/commands/` for slash-command delivery. It is **not** an MCP server; it's a file-generator that drops markdown skill prompts. Auto-detect during `init` finds existing `.claude/` and pre-selects.
6. **Programmatic spec-drift detection:** Yes — `openspec validate <change-name>`, `openspec list [--specs] [--json]`, `openspec show <change-name> [--diff]`, `openspec view` (interactive dashboard). The `--json` outputs are stable enough for Argus's spec-drift detector to call `openspec list --specs --json` from FastAPI, parse delta specs, and compute drift against `git diff` of changed files.
7. **Best-practice for hackathon-time-pressure usage (synthesized from official docs + Hashrocket comparison + community blogs):**
   - Use `core` profile only. Expanded profile adds 6 more commands and increases failure surface.
   - Run `/opsx:propose` (one-shot) instead of `/opsx:new → /opsx:ff` (two-step). This cut artifact-generation time roughly in half in the Hashrocket comparison vs Spec Kit.
   - Fill `openspec/project.md` upfront (250 lines is the typical sweet spot per Hashrocket) — context is reused across every cycle.
   - Always clear the Claude Code context before `/opsx:apply` — this is explicitly called out in the OpenSpec README as required for clean execution.
   - Skip `/opsx:verify` unless you have time; it's optional and adds latency.

**Medium-confidence findings (treat as hypotheses, validate before commitment):**

8. **Common failure modes documented in issues/PRs:**
   - Claude Code "Plan Mode" sometimes blocks file writes during archive — workaround is explicit user authorization or manually running `openspec archive` from CLI.
   - Pre-1.0: YAML parsing failed when command names contained colons (fixed).
   - Pre-1.0: JSON instruction output leaked context/rules into artifact files (fixed).
   - Hidden requirements inside fenced code blocks weren't detected (fixed in CHANGELOG).
   - PostHog telemetry causing `PostHogFetchNetworkError` in firewalled networks (fixed with 1s timeout). Set `OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1` for safety.
9. **Throughput estimate for 50+ cycles in 24h:** Each `/opsx:propose → /opsx:apply → /opsx:archive` cycle takes ~5–15 min wall-clock with Claude Code on a small change (Hashrocket reports faster than Spec Kit, "noticeably less verbose"). 50 cycles × 8 min avg = ~6.7 hours of agent time spread across the 24h hackathon — feasible if Ghaisan stays on Claude Code most of the time. **But:** expect 10–20% to need manual fix-up; budget ~1 hour for "drift recovery."

**Low-confidence findings (flag for team):**

10. There is **no public, formal SLA** on OpenSpec stability across 50 chained cycles in a single repo. The Hashrocket comparison ran ~3 cycles. No public benchmark of "how does OpenSpec degrade as `openspec/specs/` grows past N domains."
11. **Workspace commands (`coordination workspaces`) are explicitly marked "under active development, not ready for use" in docs.** Do **not** use them.
12. **Claude Code "skills" vs "commands" delivery:** docs distinguish two delivery modes; the team's Prometheus assumption mentioned `.claude/commands/` — actual default delivery is **both** skills and commands when `delivery: both` is set. Verify which directory your Claude Code version reads.

**Persistent blind spots:**
- Exact failure rate at 50+ chained cycles — no public data.
- Whether `openspec validate` returns structured JSON sufficient for the Argus spec-drift visualization (docs show `--json` flag exists for `list` but not explicitly for `validate`).

---

### TOPIC C — Past Refactory Hackathon Winner Pattern (HIGH PRIORITY)

**High-confidence findings:**

1. **Round 01 (UGM, Yogyakarta, Feb 21–22, 2026):**
   - **Theme: "OpenSpec × AI"** (already established in Round 01 — this was not new for Round 03).
   - **Juara 1 (Ultimate Winner): Tim LUNARIS, Telkom University** — a 4-person joint team from S1 Teknologi Informasi + S1 Rekayasa Perangkat Lunak (FIF Tel-U). The Telkom University FIF news page confirmed the win on March 9, 2026. (Specific project tech-stack was not publicly disclosed in the sources surfaced; the win is attributed to "kolaborasi teknis dan kreativitas yang luar biasa.")
   - **Juara 2:** Tim POLIWINDRA, Politeknik Negeri Indramayu.
   - **Juara 3 (Promising Star):** Tim WECI HOLIC, Politeknik Negeri Malang.
   - **Top 5 (Notable):** Tim SIPHAN (UGM TRPL) — built an AI browser extension for "harm reduction & digital wellbeing" focused on adolescents, using on-device AI / edge computing. SDG 3/4/9 alignment was emphasized.
   - **Sponsors:** Dewaweb, Gmedia, BSM Rental + 10 media partners.
   - **Average rating:** 4.4/5 from participants. Suggested improvements: deep-dive technical reviews, full 24h onsite format.
2. **Round 02 (UNAIR Surabaya, April 8–10, 2026):**
   - Branded as **TechInsight 2026** (HIMA D-IV Teknik Informatika FV-UNAIR collaborated with Refactory). 3-day format, mentoring-based, AI-themed.
   - **Tim Case Release (UNAIR/FTMM+FST)** placed **Juara 3 Creative Innovator** with **Effix.ai: Your AI Code Optimizer** — explicit narrative was "AI generates suboptimal/long scripts; we simplify and optimize them." This is a **direct competitive precedent for Codeplex Chronicle's Refactor mode.**
   - Juara 1 and 2 of Round 02 were **not publicly disclosed in any source surfaced** as of May 9, 2026 — Refactory IG/website only show "winner reveal" silhouettes. (Confidence: **medium-low** that this remained truly private; more likely the team announcements went out only on private Discord/WhatsApp.)
3. **Earlier roadshow (UKDW, Dec 6–7, 2025) — useful baseline:**
   - **Juara 1: Tim Vibecode, Universitas Teknologi Digital Indonesia (UTDI)** with **two Backstage plugins**: VELA Radar (automation) and a second DevEx tool. **Theme was Developer Experience (DevEx).** This is a strong signal that Refactory-judged hackathons reward **engineering-productivity tooling that ships as installable artifacts on real platforms** (Backstage), not pure UI demos.

**Recurring pattern (high-confidence synthesis):**
- **Winner profile = teams of 3–4 mahasiswa from established CS programs** (Telkom Univ, UTDI, Poliwindra). The team's 2-person "Duopoly" composition is **anomalous** — past winners are larger.
- **Innovation angle:** AI-assisted *developer productivity* tools (code optimizer, dev portal plugins, AI-driven dev workflow). Codeplex Chronicle aligns conceptually.
- **Stack discipline:** Round 01 explicitly required "OpenSpec × AI" — projects had to use OpenSpec as the foundation and ship a deployed app. Round 03 inherits this rule.
- **Judging preference (inferred):** **Substance over flash.** UKDW Round-zero winner shipped a developer portal plugin (boring + technically deep). UGM Top-5 SIPHAN tackled SDG-aligned social impact. UNAIR Top-3 was a code optimizer. None of the publicly-discussed top finishers were "wow flashy 3D demos" — they were **functional shipped tools.**
- **Mentor/judge profile:** Refactory historically draws from Indonesian industry (the company was founded by Taufan Aditya, focuses on bootcamp graduates → mid/senior programmers; their network skews backend-pragmatist). Combined with the Round 01 sponsor list (Dewaweb = hosting, Gmedia = ISP, BSM Rental), expect judges who care about deployment, performance, and real-user value, **not** who care about Three.js post-processing pipelines.

**Medium-confidence findings:**
- **Argus pitch positioning recommendation** (synthesized from above): Lead with the **Health mode for Indonesian production codebases** ("imagine running this on a Tokopedia microservice"), demo Onboarding as the "junior dev's first day at a 2-year-old codebase" use case, and treat the 3D city as the *visual differentiator that helps judges remember the demo*, not the value prop. The 5 AI residents (Athena/Apollo/Argus/Clio/Hermes) are a *narrative device* — judges will discount them if they appear to be a gimmick over substance.
- **Keep the OpenSpec workflow visible during the pitch.** Round 01 was explicitly themed "OpenSpec × AI" and Round 03 inherits this. Show `openspec/changes/<latest>/` on screen at some point — judges need to see compliance.
- The TRPL UGM team's success with **AI + edge computing + privacy framing** suggests embedding a "your code never leaves your machine for the Health scan" line in the pitch (true if tree-sitter runs locally) for trust signal.

**Low-confidence findings:**
- Whether judges weight UI polish vs technical depth — the Round 01 4.4/5 rating is participant satisfaction, not judge weighting. The hackathon.refactory.id site lists generic categories ("Crowned Champion / Rising Stars / Strong Finishers") without published rubric weights. Unable to confirm a numeric judging rubric.
- Whether "team of 2" disqualifies — official FAQ states "team of 2–4 members" so Duopoly is **inside the rule**. (Confidence: **high** on this specific point.)

**Persistent blind spots:**
- Exact Round 02 winners and their stacks.
- Whether Round 03 sponsors / judges differ from Round 01 (Dewaweb/Gmedia/BSM Rental). May add or shift rubric.

---

### TOPIC D — Three.js + r3f Performance Ceiling (MEDIUM PRIORITY)

**High-confidence findings:**

1. **Draw-call budget rule from official r3f docs:** "no more than 1000 [draw calls] as the very maximum, optimally a few hundred or less." 200–300 buildings via **a single InstancedMesh = 1 draw call**, so this is well within budget. The bottleneck is *not* draw count — it's vertex shading and post-processing cost.
2. **InstancedMesh scaling:** Documented examples comfortably handle 100,000 instances in a single draw call on M-series-class hardware. 200–300 is trivially within tolerance.
3. **Drei `<Instances>` vs raw `<instancedMesh>` perf gap:** A documented r3f issue (#3306, ~2024-2025) shows Drei `<Instances>` with per-instance JSX `<Instance>` children is significantly slower than raw THREE.InstancedMesh imperative `setMatrixAt()`. **Recommendation: use raw `<instancedMesh>` with imperative matrix setting in `useLayoutEffect`** for buildings, not `<Instances>`. Tolerable for ≤300 cars but will choke at 1000+.
4. **Post-processing cost rank** (high → low cost on integrated/M-series GPU per Codrops & threejs-journey benchmarks):
   - **DepthOfField (highest cost)** — full-screen blur with depth sampling.
   - Bloom with `mipmapBlur: true` (medium-high; mipmap is faster than non-mipmap).
   - ChromaticAberration (low-medium).
   - Vignette + Noise (very low).
   - ToneMapping ACES_FILMIC (very low — built into the post pipeline).
5. **`@react-three/postprocessing` EffectComposer auto-merges effects** into a single EffectPass when possible, so cost grows sub-linearly with effect count. Combining Bloom+DOF+ChromaticAberration+Vignette+Noise is a documented working chain (live demo on the package's GitHub README).
6. **Drop-first order if you regress under 60fps:**
   1. **DepthOfField first** (single biggest cost; barely visible at city-scale anyway).
   2. **Sparkles tier 3** (the per-particle vertex cost compounds with count; drop the densest layer first).
   3. **One of the 3 directional shadow maps** (shadow rendering is a separate pass per light).
   4. ChromaticAberration is *not* worth dropping — it's cheap and adds the cinematic punch.

**Medium-confidence findings:**

7. **MacBook Pro M-series target is realistic** at the planned scale. Codrops' Jan 2025 article on the SINGULARITY r3f demo shipped LOD + InstancedMesh + Rapier physics + post on M1 at 60fps with hundreds of meshes. Your scene is comparable.
8. **Drei Sparkles + Environment + Outlines combined:** Sparkles uses one geometry per layer (a points mesh, ~1 draw call per layer). Environment uses cube-rendered HDRI (one-time cost at load). Outlines adds an extra render pass per outlined object — limit outlines to **selected building only** (≤5 at a time), not all buildings.
9. **r3f 9.6.x specific pitfalls (2025-2026):**
   - Pairing rule: `@react-three/fiber@9` requires `react@19`. The team's stack (Next.js 16 + React 19) matches.
   - Performance scaling: r3f exposes `state.performance.regress()` — wire this to `OrbitControls` change events (or your GSAP camera-arc events) to drop pixel ratio while moving and restore on idle. Cheap +20–30% perf during dynamic camera movement.

**Low-confidence findings:**

10. No published end-to-end benchmark exists for *this exact stack* (200–300 instanced buildings + flying-car InstancedMesh + 5-effect post + 3-tier Sparkles + HDRI + 3 directional shadows + GSAP camera). Expect to need real measurement on Day-1 morning of the hackathon. Use **r3f-perf** (drop in `<Perf />`) — community-standard, headless mode supported.

**Recommended budget if forced to drop:**
- 60fps mandatory: Drop DepthOfField, Sparkles tier 3, and 1 directional light. Keep Bloom + ChromaticAberration + Vignette + ToneMapping.
- 30fps acceptable for cinematic moments: Keep everything but cap `setPixelRatio(1.5)` instead of devicePixelRatio.

---

### TOPIC E — Multi-Agent Dispatcher with Gemini 2.5 Flash (MEDIUM PRIORITY)

**High-confidence findings:**

1. **Latency baseline (Artificial Analysis benchmarks, May 2026):**
   - Gemini 2.5 Flash on **Google AI Studio**: **TTFT 0.72s, output 194.8 t/s.**
   - Gemini 2.5 Flash on **Vertex AI**: **TTFT 0.77s, output 165.8 t/s.**
   - Flash-Lite is even faster: TTFT ~0.29s, ~392.8 t/s.
   - For tool-call routing decisions (~50–200 output tokens), end-to-end p50 latency ≈ **0.9–1.4s** — comfortably within the team's <2s target.
2. **Free-tier rate limits (May 2026, multiple corroborating sources):** There is **conflicting public data** between sources, indicating Google has tightened limits over Dec 2025 → May 2026:
   - Google AI / TokenMix snapshot: **Gemini 2.5 Flash free tier = 15 RPM, 1M TPM, 1,500 RPD** (older snapshot, Apr 2026).
   - YingTu / aifreeapi.com (Jan-Feb 2026 post-Dec-2025 changes): **5–15 RPM, 250,000 TPM, 100–1,000 RPD**, with Flash specifically at 10 RPM, 250 RPD on the most recent reading.
   - Common consensus: assume **conservative Flash = 10 RPM, 250 RPD** per project. With 3 GCP keys round-robin = **30 RPM and ~750 RPD effective.** That is enough for ~1 query every 2s sustained for the full 90-second demo + judge Q&A.
3. **Model deprecations:**
   - **Gemini 2.0 Flash and 2.0 Flash-Lite shut down March 6, 2026 (Vertex) / June 1, 2026 (Firebase AI Logic).** New projects can no longer use 2.0. **The team's "2.0 fallback" plan is broken — pivot to Gemini 2.5 Flash-Lite as fallback** (cheaper, 30 RPM free tier, optimized for low latency, same API).
   - Gemini 3 Pro Preview was deprecated March 9, 2026 (Vertex); Gemini 3.1 Pro Preview is paid-only as of May 2026.
4. **Tool-calling reliability — documented failure modes (multiple GitHub issues):**
   - **`MALFORMED_FUNCTION_CALL` finish reason occurs frequently** — the python-genai issue #1120 reports **6 out of 7 tool-calling attempts on `gemini-2.5-flash` returning MALFORMED_FUNCTION_CALL** when `thinking_config.thinking_budget` was high. Lower thinking budget reduces the rate.
   - **Repetition loops in JSON output** (Google AI Forum thread, 2026): Flash gets stuck repeating tokens until max-output-tokens is hit — silent malformed JSON.
   - **Truncation bug:** `finish_reason: STOP` returned even when output cuts off mid-sentence. Always check `finish_reason` defensively.
   - **Thought-signature handling required for multi-turn function calls with thinking enabled** (Vertex docs).
   - **LiteLLM silent-failure bug** (BerriAI/litellm #16651): MALFORMED_FUNCTION_CALL maps generically to `finish_reason: "stop"` with null content.

**Medium-confidence findings:**

5. **Mitigation playbook for the dispatcher (synthesized):**
   - Set `thinking_budget=0` (Gemini 2.5 Flash) or `thinking_level=MINIMAL` (Gemini 3 family) for routing-only calls. Saves cost, latency, and avoids many MALFORMED_FUNCTION_CALL cases.
   - Wrap every tool call in `try/except` for `MALFORMED_FUNCTION_CALL`, retry once with simplified prompt, then fallback to Flash-Lite, then to a hardcoded canned response keyed off the dataset (semantic cache).
   - Validate `finish_reason` ∈ {`STOP`, `MAX_TOKENS`} *and* JSON parses; treat anything else as a failure.
   - **Pre-cache** all 5 residents' answers to the 10 most likely demo questions (e.g., "show me the auth district", "find hardcoded secrets", "explain Athena", "refactor this controller"). Latency = 0ms, reliability = 100%. The dispatcher should call cache *before* the model.
   - For demos that absolutely cannot fail, **disable Gemini and pre-record** the routing decisions; the dispatcher just plays them back over the rendered timeline.
6. **Caching:** Gemini API supports prompt caching (paid tier). On free tier, implement a local in-memory semantic cache (cosine similarity on embeddings) with a 0.85 threshold — covers paraphrases of the same demo question.
7. **Outage risk:** Google AI Studio has had documented latency spikes during peak hours (mentioned in shareuhack 2026 guide and Google AI Forum). The hackathon runs 24h Indonesian time — peak overlap with US/EU peak is roughly 10pm–6am WIB. **Schedule live-demo rehearsal in the same time slot as the actual judging window.**

**Low-confidence findings:**

8. No public p95/p99 latency data for Gemini 2.5 Flash specifically with tool-calling enabled. The 0.72s figure is TTFT for plain text generation. Tool-calling adds ~200–400ms in informal community measurements (no formal benchmark surfaced).
9. **No published recent outage** affecting Indonesia/Asia-Pacific specifically; status.cloud.google.com would be authoritative on the day-of.

---

### TOPIC F — Refactory Hackathon Formal Rules Document (LOW PRIORITY)

**Persistent blind spot:** The user-supplied Google Docs URL (`docs.google.com/document/d/1HBT-rTILcmiWMaab1jAN0nc1rata8cjjgQbo_z4sWD4`) **could not be fetched** — the tool returned a permissions/scope error indicating the URL was not in the search/fetch result set. Without sign-in, public Google Docs sometimes block the user-agent. **Direct verification needed by the team — open it in a browser and paste back the contents if any rule looks unusual.**

**What we *do* know from the public hackathon.refactory.id site (high confidence):**
- Free entry; Q1.
- Teams of **2–4 members** (Duopoly = 2 = compliant); Q2.
- Open to all educational backgrounds; Q3.
- **All projects must be developed during the hackathon, except for open-source libraries** — Q4. *This is a key rule for Codeplex Chronicle: any pre-built scaffolding must be open-source published before May 12, 2026.* Pre-research, design docs, OpenSpec proposals appear to be allowed (industry norm), but the build itself must happen during the 24h.
- **Entire team must attend the final presentation. Absence = withdrawal**; Q5. Hafiz (relief operator) must be physically present in Bandung.
- Prizes: **cloud credits (non-cash)**, distributed across "Crowned Champion / Rising Stars / Strong Finishers" tiers.
- Round 01 confirmed the theme as "OpenSpec × AI" with mandatory deployment requirement ("aplikasi tersebut harus sudah melalui proses deploy"). The team's `https://duopoly.hackathon.sev-2.com` Kubernetes deployment satisfies this.

**What we don't know (treat as unknowns until the team verifies the Google Doc):**
- Whether `openspec/` folder must be zipped and submitted separately, or whether judges just pull the public repo.
- Exact judging rubric weights (innovation vs deployment vs UX vs technical depth).
- Whether there are disqualification clauses for "AI-generated code without disclosure."
- Submission file format requirements (PDF deck size limits, video duration caps, etc.).
- Any specific Kubernetes deployment validation criteria (e.g., must respond to a probe URL within X seconds, must have HTTPS, must accept guest user).
- Any rule about not using paid GPU time or paid LLM tiers (some hackathons restrict this; given prizes are cloud credits, free-tier usage is implied).

**Action item for the team:** Manually fetch the Google Doc at the start of Day 0 and patch this section. If anything contradicts this brief, the Google Doc supersedes everything here.

---

## Caveats

1. **Time-sensitive data:** Gemini rate limits, Three.js perf characteristics, and OpenSpec features are evolving fast. All Topic-B/D/E numbers reflect snapshots in April–May 2026 search results and should be re-verified the morning of the hackathon (May 12).
2. **Round 02 winner gap:** The team should ask Refactory's Discord/WhatsApp directly for Round 02 winners — they are the most relevant precedent and weren't surfaced by public search.
3. **Indonesian-language sources:** Several findings (esp. Topic C) rely on Indonesian-language news pages (telkomuniversity.ac.id, ugm.ac.id, unair.ac.id). The team should cross-check direct WhatsApp/IG Refactory posts for any recent rule clarifications.
4. **Topic F is incomplete** due to inability to fetch the rules Google Doc; this is the highest-priority gap to close manually.
5. **No specific repos with published file counts:** The 50–300 file recommendation for NodeGoat, PyGoat, and the FastAPI template is based on inspection of typical structure documented in their READMEs, not on a precise `find . -type f | wc -l` measurement. The team should clone all 3 candidate repos on Day 0 morning and run that command to confirm.
6. **InstancedMesh vs flying cars:** The team's plan mentions "THREE.InstancedMesh, ~30 cars" — at 30 cars, raw InstancedMesh is overkill, and a Drei `<Instances>` block is fine. Reserve raw InstancedMesh for the 200–300 buildings.
7. **MALFORMED_FUNCTION_CALL frequency:** The "6 out of 7" figure is from one user's specific config (high thinking budget) — actual rate at thinking_budget=0 is much lower in community reports, but no formal benchmark exists. Treat as a *red flag worth defensive coding*, not a guaranteed disaster.

---

## Recommended PRD Direction Shift

Synthesizing across all 6 topics into actionable guidance for the idea-draft document:

**Reframe the value proposition.** Codeplex Chronicle's pitch should not be "we built a 3D city" — Past Refactory winners (Tim LUNARIS, Vibecode-UTDI Backstage plugins, UNAIR Effix.ai) all shipped *substantively useful developer-productivity artifacts*. The 3D city is a memory hook, not a reason to win. Argus should pitch as: **"Codeplex Chronicle is an AI-resident development environment for understanding, refactoring, and securing real Indonesian production codebases — visualized as a city you walk through with 5 AI experts."** The city is an *interface*, not the product. Lead the demo with **NodeGoat being analyzed for OWASP Top 10 risks via the Health mode** (echo Round-01 OpenSpec-x-AI theme + judge-favored substance), then show Onboarding on the FastAPI full-stack template (mirrors judges' own stack), then close with the Refactor mode quietly nodding to Effix.ai's territory while differentiating via spec-driven (OpenSpec) refactoring rather than just shorter code. Pre-render screenshots of `tokopedia/gripmock` for cultural relevance.

**Lower technical risk on the LLM and rendering paths.** Ditch the "Gemini 2.0 fallback" — 2.0 is shutting down March 6, 2026. Use **Gemini 2.5 Flash with `thinking_budget=0` for routing → Gemini 2.5 Flash-Lite as the cheaper/faster fallback → semantic cache on top of both → pre-recorded canned responses for the 10 most-demoed questions as the bottom-of-stack fallback.** Round-robin across 3 GCP keys gets ~30 RPM, plenty for the live demo. Defensive-code every tool call against `MALFORMED_FUNCTION_CALL` (documented frequent failure). For r3f, ship a `<Perf />` overlay during dev, set `state.performance.regress()` on camera moves, and have an explicit feature-flag killswitch for DepthOfField + Sparkles tier 3 + the 3rd directional light — 3 settings to toggle from 60fps to "demo lag is killing us." Drop **DepthOfField first**.

**De-risk the OpenSpec dependency.** The Prometheus assumption that 50+ cycles in 24h will work first-try is plausible but optimistic. **Initialize with `openspec init --tools claude --profile core`** (not the expanded profile). Pre-fill `openspec/project.md` to ~250 lines on Day-0 evening before the hackathon. Use `/opsx:propose` (one-shot) over `/opsx:new + /opsx:ff`. Budget ~1 hour during the 24h for OpenSpec drift recovery. Never use workspace commands. Have `openspec validate <change> --json` wired into the spec-drift detector early, so Argus's "the city is shaking because the spec drifted" demo moment works on real data.

**Lock in the demo dataset by Day 0.** Pre-clone NodeGoat + fastapi/full-stack-fastapi-template + PyGoat (fallback). Run tree-sitter parsing on all 3 once and cache the building-graph JSON at `/public/datasets/`. Pre-render city screenshots of `tokopedia/gripmock` and `gojek/courier-android` for the closing slide. Do not load Juice Shop live — too big.

**Verify the formal rules Google Doc on Day 0.** Topic F is the biggest unresolved gap. The team's `https://duopoly.hackathon.sev-2.com` Kubernetes deployment and 2-person Duopoly composition both appear compliant per the public FAQ, but rule weights, OpenSpec deliverable format, and disqualification clauses remain unverified.

**Tactical sequencing for the 24h:** (a) Day-0 evening: clone datasets, run tree-sitter, fill `openspec/project.md`, prefetch HDRI + GLB assets to avoid network risk during the hackathon; (b) hour 0–6: scaffolding + dispatcher + 1 working AI resident (Athena) on NodeGoat; (c) hour 6–12: remaining residents + Health detectors + Refactor mode skeleton; (d) hour 12–18: visual polish, post-pipeline, GSAP camera arcs (drop early if FPS regresses); (e) hour 18–22: pitch deck, demo rehearsal in same time-of-day as judging slot to check Gemini latency; (f) hour 22–24: buffer for OpenSpec drift recovery, Kubernetes deploy verification, and a dry run with Hafiz playing the judge. **Hafiz's relief-operator role is most valuable during hours 14–20** when fatigue erodes Ghaisan's ability to run OpenSpec cycles cleanly.