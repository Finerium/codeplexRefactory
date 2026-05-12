# Phase B Deep Research Artifact: V1 Metis Agentic Structure Anchors

**Project:** Codeplex Chronicle (Tim Duopoly: Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Event:** Refactory Hackathon Round 03, Telkom University Bandung, 12-13 May 2026
**Artifact role:** Anchors the 21-agent multi-agent build-time orchestration structure (Waves 0-3 + auditors + Pan universal worker) consumed by Claude Code workers spawned via Anthropic Orches-v1 skill.
**Confidence tiers:** high (multiple corroborating sources or primary docs), medium (single authoritative source or partial evidence), low (inferred, marked `[INFERRED]`).

---

## 1. Executive Summary

The frontier for multi-agent build-time orchestration as of May 2026 is converging on a clear set of patterns directly applicable to Codeplex Chronicle. Anthropic's own orchestrator-worker pattern (LeadResearcher plus parallel subagents) reports a 90.2 percent performance lift over single-agent baselines while, in Anthropic Engineering's own words, "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats" (Anthropic Engineering, "How we built our multi-agent research system," June 13, 2025). This validates the wave-based, capacity-allocated Metis structure but warns that token economics, not model capability, will dominate the $5 DeepSeek budget. Claude Code's experimental Agent Teams feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, shipped February 2026 with Opus 4.6 and refined through v2.1.45) is the only orchestration layer subscription-compatible with Anthropic Pro/Max after the April 4, 2026 third-party block, making it the locked substrate for Hafiz's hands-off operator setup. The Agent Skills open standard (released by Anthropic on December 18, 2025) with its progressive-disclosure SKILL.md contract is the canonical packaging format for the 21 specialists.

On the technical landscape, DeepSeek V4-Flash and V4-Pro (launched April 24, 2026) are confirmed at $0.14/$0.28 and $1.74/$3.48 per 1M tokens respectively, with V4-Pro under a 75 percent promotional discount until 2026-05-31 15:59 UTC (effective rate $0.435/$0.87) and all cache-hit prices cut to 1/10 of launch pricing effective 2026-04-26 12:15 UTC. The 1M context window plus thinking-mode toggle (`extra_body={"thinking": {"type": "enabled"}}`, OpenAI-compatible) plus three reasoning effort levels (Non-think, Think High, Think Max) directly enable the multi-turn code-generation workflows Wave 3 requires, but the documented quirk that `reasoning_content` must be omitted from replay in subsequent turns and that thinking mode disables `temperature`, `top_p`, and `presence_penalty`/`frequency_penalty` is a Wave-3-specific failure trap. For the visual stack, r3f@9 + Three.js 0.184 InstancedMesh comfortably handles 200-500 buildings in one draw call (community benchmarks routinely demonstrate 100,000+ instances at 60fps), but Drei's `<Instances>` wrapper carries documented CPU overhead versus raw `<instancedMesh>` (r3f issue #3306), and the canonical `state.performance.regress()` API plus Drei `PerformanceMonitor` is the standard escape hatch for adaptive quality.

The biggest validated risk is capacity misallocation, not technical infeasibility. MAST (Multi-Agent System Failure Taxonomy, arXiv 2503.13657) identifies 14 failure modes across 3 categories, with system-design issues and inter-agent misalignment dominating; ChatDev's 33.33 percent correctness on ProgramDev shows that even well-known multi-agent coding stacks fail majority-of-the-time when contracts between agents are sloppy. Combined with documented hackathon timing wisdom (roughly 50/50 build vs ideation+presentation for 24h events) and the Refactory rubric's explicit "judges will run it themselves in real-time" expectation, this anchors a defensible Wave 0 + Wave 1-2 visual + Wave 3 backend + rehearsal split for Codeplex Chronicle.

---

## 2. Category 1: Domain Prior Art (Hackathon-Scale Multi-Agent Orchestration)

### 2.1 High-confidence findings

**Orchestrator-worker is the dominant pattern.** Anthropic's published architecture for the Claude Research feature uses a LeadResearcher that decomposes queries, persists plans to memory before context-window pressure, spawns 3-5 parallel subagents, and synthesizes results via a CitationAgent (Anthropic Engineering, "How we built our multi-agent research system," June 13, 2025). The same orchestrator-worker shape recurs in every credible 2026 community framework: Agent Teams (Anthropic, experimental), Ruflo (community, 31.1k GitHub stars as confirmed by ClaudeFast's orchestrator comparison page), ccpm (7.9k stars), and Claude Squad.

**Subagents preserve context; teams coordinate across sessions.** Anthropic's official Claude Code docs draw a precise distinction: subagents work inside one session with their own context window and tool permissions, while Agent Teams coordinate across separate sessions, with one session acting as team lead and teammates messaging each other directly. The team-lead pattern matches Codeplex Chronicle's Metis-led plan where Wave-1/2/3 workers run as parallel teammates.

**Anthropic Pro/Max subscriptions block third-party orchestrators (effective April 4, 2026).** Only Anthropic Agent Teams remains subscription-compatible after this policy shift; Ruflo, Claude Squad, ccpm, etc. now require API billing. This is decisive for Hafiz's Pro/Max-funded workflow.

**Wave-based execution with DAG contracts is documented practice.** Community frameworks like the GEM-team `plan.yaml` schema define an explicit DAG of atomic tasks with execution waves and inter-task contracts (input/output schemas, dependency declarations); research papers formalize this further (Ye and Tan, "Agent Contracts," arXiv:2601.08815, COINE/AAMAS 2026 Oral, defines a 7-tuple contract).

**Agent Skills with progressive disclosure is the packaging standard.** SKILL.md frontmatter (name + description, max 1024 char description) loads at startup (~30-50 tokens per skill); full body loads on activation; bundled scripts/references load only when needed. Anthropic recommends keeping SKILL.md under ~5,000 words and limiting active skills to 20-50. Standardization was extraordinarily fast: per paperclipped.de's analysis, "What followed was the most compressed standardization event in recent developer tooling history: 48 hours: Microsoft integrated Agent Skills into VS Code via Copilot. OpenAI added support to ChatGPT and Codex CLI." By March 2026 the count was 32 tools.

### 2.2 Medium-confidence findings

**Multi-task per worker is consistent with frontier guidance.** Anthropic's post explicitly warns of agents "spawning 50 subagents for simple queries" and recommends scaling rules in the lead-agent prompt to allocate effort proportional to task complexity. This corroborates the "pintar multi-task per worker" lock for Tim Duopoly, but no public source documents the exact granularity that maximizes hackathon throughput. Studio frameworks like ClaudeFast Code Kit's 18 specialists suggest a 15-25 specialist range as the empirical sweet spot for full-stack builds.

**Greek mythology naming is observed but not formally documented as an anti-collision pattern.** The Anthropic Research system itself uses functional names (LeadResearcher, CitationAgent) rather than mythological ones, but community frameworks freely use mythological rosters; no benchmark exists to validate whether thematic names improve coordination versus pure functional naming. `[INFERRED]` Mythological naming likely reduces lexical collision in multi-turn agent conversations and improves human operator recall.

### 2.3 Low-confidence / blind spots

- No public postmortem of a 24-hour hackathon executed end-to-end by an Orches-v1-style multi-agent system was located. The closest published artifacts are individual feature-build retros by Shipyard, Designbeep, and Constellation Research, all describing development-time use rather than competitive hackathon contexts.
- Cross-roomchat handoff document formats are not standardized; the GEM-team `plan.yaml` is the most concrete precedent.

---

## 3. Category 2: Multi-Agent Architecture Frontier (April-May 2026)

### 3.1 High-confidence findings

**MAST taxonomy: 14 failure modes in 3 categories.** Cemri et al., "Why Do Multi-Agent LLM Systems Fail?" (arXiv:2503.13657, UC Berkeley Sky Computing Lab) analyzes 200+ traces (~15,000 tokens each) across 7 frameworks (MetaGPT, ChatDev, HyperAgent, OpenManus, AppWorld, Magentic, AG2) and clusters failures into (i) system-design issues, (ii) inter-agent misalignment, (iii) task-verification failures. The accompanying LLM-as-judge pipeline reaches 94 percent accuracy with Cohen's kappa 0.77. ChatDev's 33.33 percent correctness on ProgramDev is the most-cited cautionary stat.

Direct implications for Metis design: (a) role specifications must be explicit ("Disobey Role Specification" was a documented mode); (b) audit/verification agents are not optional; (c) per the MAST paper itself, the +15.6 percent ChatDev lift came from improved role specification and architectural changes combined (verbatim: "While interventions yield some improvements (e.g., +15.6% for ChatDev), the results show that simple fixes are still insufficient for achieving reliable MAS performance"), not from any single topology swap. The takeaway is therefore that DAG topology AND tight role specs AND inter-agent contracts must all land together; isolated fixes underperform.

**Token cost is the dominant operational variable.** Per Anthropic Engineering's primary post: "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats." For Codeplex Chronicle on $5 DeepSeek paid, this is binding: a 21-agent run with thinking-mode-on will exhaust budget unless V4-Flash dominates and cache-hit ratio is engineered.

**Anthropic Agent Teams (v2.1.32+, February 2026) is the locked orchestrator.** Activation via `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, refined through v2.1.45 with display modes, delegate mode, plan-approval, quality-gate hooks, and task assignment. Strongest use cases per ClaudeFast: research/review with multiple investigators, new modules where each teammate owns a piece, debugging with competing hypotheses, cross-layer changes spanning frontend, backend, and tests.

**Anthropic Skills file budget guidance.** SKILL.md under ~500 lines or ~5,000 tokens is the published recommendation; beyond that, split to references. Total active skills 20-50 is the documented enabling ceiling per "The Complete Guide to Building Skills for Claude."

### 3.2 Medium-confidence findings

**Progressive disclosure may be more accurately named "progressive discovery."** Phil Whittaker's DEV.to analysis argues that the runtime mechanism is closer to discovery (Claude reasons over skill descriptions, then reads bodies, then loads references) than disclosure. This is taxonomy commentary, not a behavioral change, but it informs how Metis should write SKILL.md descriptions: they should make discovery decisions easy for the lead, not progressively reveal complexity to humans.

**AdaptOrch / topology-routing research is frontier but not directly actionable.** Hugging Face papers on AdaptOrch (parallel/sequential/hierarchical/hybrid topology selection) and AgentNet decentralized DAG with evolutionary coordination (arXiv:2504.00587) inform that topology choice now dominates model choice for task performance, but a 21-agent hackathon roster has neither the scale nor the time to dynamically retopologize. `[INFERRED]` Static DAG with explicit contracts is the right choice given the time horizon.

### 3.3 Blind spots

- No published benchmark of Agent Teams running 20+ teammates simultaneously; Anthropic's docs frame typical use as 3-5 teammates.
- The PromptOpening 10-step pattern referenced in the task brief is not documented in any retrieved source as a named convention; treat as internal Tim Duopoly convention only.

---

## 4. Category 3: Technical Landscape

### 4.1 Category 3a: Visual Frontend (r3f + Three.js)

#### High-confidence findings

**InstancedMesh comfortably exceeds Codeplex Chronicle's 200-500 building target.** Community demonstrations consistently render 100,000+ cubes at 60fps with a single draw call (e.g., onion2k's 122,500-cube grid). The canonical pattern is raw `<instancedMesh ref={ref} args={[geometry, material, count]}>` with `setMatrixAt()` in a `useLayoutEffect`, then `instanceMatrix.needsUpdate = true`.

**r3f issue #3306 confirms Drei `<Instances>` overhead.** Multiple reporters observed dramatic FPS drop using Drei's high-level `<Instances>`/`<Instance>` wrapper versus raw `<instancedMesh>` + `setMatrixAt()` for identical geometry counts. The discussion-thread fix is to fall back to raw `<instancedMesh>` for dense, mostly-static scenes.

**`state.performance.regress()` is the canonical adaptive-quality mechanism.** The r3f RootState exposes `performance: { current, min, max, debounce, regress }`. Any control that moves (camera, mouse) calls `regress()`, which drops `performance.current` to `performance.min`; after `debounce` ms with no further regress, it returns to `performance.max`. Drei ships `PerformanceMonitor` and `AdaptivePixelRatio` as ready-made consumers.

**Draw call ceiling: under 100 for smooth 60fps; over 500 even powerful GPUs struggle.** This is the "golden rule" repeated across Three.js performance literature (utsubo.com 100 Tips, Codrops SINGULARITY analysis). For Codeplex Chronicle with InstancedMesh per building-archetype, 5-10 archetype draw calls plus Sparkles (1) + DepthOfField (1-2) + Bloom (1-2) keeps the budget.

**pmndrs/postprocessing EffectComposer auto-merges effects.** Effects (Bloom, DepthOfField, ToneMapping, etc.) added to one EffectComposer pipeline merge into the minimum number of passes possible, mitigating the historical "every pass costs a depth+normal render" tax. @react-three/postprocessing 3.x is the integration layer.

**Squarified treemap is documented for building/floor-plan layout.** Bruls, Huizing, van Wijk's 1999 squarified treemap and its application to floor-plan generation (Marson and Musse, IJCGT 2010) are well-cited; multiple JS/Python ports exist (agatheblues/squarify, Laserson's Python original). The algorithm minimizes aspect ratio and is fully deterministic, ideal for stable building placement across re-renders.

**Awwwards 3D reference set is concrete.** Confirmed by Awwwards Sites of the Month listings: Oryzo AI (Lusion, SOTM April 2026, palette HEX #100904 / #FF8539, stack GSAP+Three.js+WebGL), Terminal Industries (SOTM September 2025), Anime.js (SOTM May 2025). All are public reference points for the Codeplex Chronicle landing-page design language.

#### Medium-confidence findings

**Drop-first feature flag ordering.** Documented best-practice order when regress fires: (1) disable post-processing passes (highest cost-to-impact, DepthOfField first, then Bloom), (2) scale pixel ratio down via AdaptivePixelRatio, (3) swap LOD high-poly to low-poly via Drei `<Detailed>`, (4) reduce shadow map resolution, (5) cut Sparkles count. No single canonical source ranks all five, but Codrops SINGULARITY and r3f docs together support this order. Confidence medium because the ordering is composited from multiple sources rather than from one authoritative ranking.

#### Blind spots

- No benchmark specific to M-series MacBook Pro 16GB with @react-three/fiber 9.6 + Three.js 0.184 was located; community sources are typically benchmarked on Windows/Linux NVIDIA. Hafiz's M-series target should be validated by an early Wave 1 spike build.
- The exact frame-time cost of Sparkles particle count at 1000-5000 is not benchmarked publicly; expect to tune by hand.

### 4.2 Category 3b: DeepSeek V4

#### High-confidence findings

**Pricing is confirmed.** Per official DeepSeek API docs as of April 26, 2026:
- V4-Flash: $0.14/M cache-miss input, $0.0028/M cache-hit input, $0.28/M output
- V4-Pro (75% off until 2026-05-31 15:59 UTC): $0.435/M cache-miss input, $0.003625/M cache-hit input, $0.87/M output (regular: $1.74/$3.48)
- Cache-hit prices were cut to 1/10 of launch pricing effective 2026-04-26 12:15 UTC.

Both models: 1M context, 384K max output, MoE architecture (Flash 284B/13B, Pro 1.6T/49B), MIT license, OpenAI and Anthropic API-compatible.

**Thinking mode API contract.** Controlled by `extra_body={"thinking": {"type": "enabled"|"disabled"}}` plus `reasoning_effort` ∈ {high, xhigh} (low/medium map to high, xhigh maps to max). For agentic clients like Claude Code or OpenCode, effort auto-sets to max in thinking mode. Reasoning output returns in `reasoning_content` (separate from `content`); in multi-turn, `reasoning_content` from prior turns is ignored by the API and must NOT be replayed. Thinking mode disables `temperature`, `top_p`, `presence_penalty`, `frequency_penalty` (they will not error but have no effect).

**Legacy alias deprecation date confirmed: 2026-07-24.** `deepseek-chat` corresponds to V4-Flash non-thinking; `deepseek-reasoner` to V4-Flash thinking. New integrations must use `deepseek-v4-flash` or `deepseek-v4-pro`.

**Artificial Analysis benchmarks (verified May 2026).** V4-Flash (Reasoning, Max Effort) scores 47 on AA Intelligence Index v4.0 (median of comparable models: 30), 68.2 tokens/sec output speed, 1.20s TTFT, but is noted as very verbose (240M tokens used for benchmark vs. 42M median). Total benchmark cost: $112.86.

#### Medium-confidence findings

**Verbosity is a Wave-3 risk.** AA's note that V4-Flash is "very verbose" implies that the $3.48 (or $0.87 promo) output side dominates blended cost for code-emitting workflows like Wave-3 implementation generation. The DeepInfra pricing analysis confirms blended pricing of $2.17/M is a 3:1 input:output assumption and breaks for code/JSON-heavy outputs.

**Documented failure modes.** No publicly indexed MALFORMED_FUNCTION_CALL equivalent is documented for V4 (unlike Gemini); the most-cited adoption blocker is reliability during peak periods (DeepSeek API has had rate-limit issues during Asian peak hours) and English instruction-following lag versus Claude Sonnet 4.6 on nuanced tasks (per ofox.ai analysis).

**Defensive layer guidance.** Multiple sources (devtk.ai, ofox.ai, evolink.ai) converge on: (a) keep premium fallback (Claude Sonnet/Opus) routed for critical paths, (b) front-load system prompt and static context for cache-hit dominance, (c) use V4-Flash by default and escalate to V4-Pro only for complex reasoning, (d) use JSON mode carefully; DeepSeek's recommended local sampling defaults (temperature = 1.0, top_p = 1.0) differ from OpenAI/Claude norms. The 98 percent cache-hit discount on input means a 2,000-token system prompt amortizes near-free across many calls.

#### Blind spots

- No public benchmark of DeepSeek V4 inside Claude Code as a backend has been independently verified; the ofox.ai "DeepSeek V4 in Claude Code cost breakdown" exists but is vendor-authored.
- Multi-turn coordination with thinking mode specifically for diff-serialization workflows is not documented; treat as a Wave-1 spike.

### 4.3 Category 3c: tree-sitter Multi-Language + OpenSpec Dual-Folder

#### High-confidence findings

**tree-sitter Python binding is mature.** `py-tree-sitter` (official) plus `tree-sitter-language-pack` (305+ grammars, on-demand parser downloads, MIT-licensed permissive grammars only) supersedes the unmaintained `tree-sitter-languages` package. The 11 grammars Codeplex Chronicle needs (TypeScript, JavaScript, Python, Go, Java, C, C++, Rust, Ruby, PHP, Kotlin, Swift) are all included.

**Lazy-loading is a documented performance pattern.** Textual issue #5337 (Textualize/textual) explicitly identifies that loading all languages at module level dominates import time and recommends on-demand instantiation. The `tree-sitter-language-pack` already implements on-demand parser caching, making it the right default for Codeplex Chronicle's backend.

**Gitleaks regex + entropy is the canonical pattern for hardcoded-secret detection.** Default config covers ~160 secret types; entropy thresholds typically 3.5-4.5 (Shannon entropy on the matched string); rules combine `regex` + optional `keywords` + `entropy` + `[[rules.allowlists]]` (since v8.21.0). Direct adoption pattern: ship a `.gitleaks.toml` profile in Argus's audit skill, run `gitleaks dir --report-format json` in CI loop.

**OpenSpec v1.0 (Fission-AI) core profile is precisely defined.** Core profile installs 5 workflows: `propose`, `explore`, `apply`, `sync`, `archive`. Expanded set adds `new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`. Action-based state machine replaced the rigid proposal→apply→archive sequence in v1.0. CLI exposes `openspec init`, `openspec list`, `openspec show`, `openspec validate <change-name>`, `openspec view`, `openspec update`. `--json` flag emits structured stdout reliably (PostHog telemetry network errors are swallowed silently as of 2026 fix).

**Artifact state machine: every artifact is `done`/`ready`/`blocked`.** Detected by file-existence patterns defined in the schema (`src/core/artifact-graph/outputs.ts`). `openspec status` exposes this for AI agents to drive next-step suggestions. The instruction loader assembles three layers: context (project tech stack from `openspec/config.yaml`), rules (artifact-specific constraints), template (markdown structure), packaged as XML-like tags (`<project_context>`, `<rules>`, `<template>`).

#### Medium-confidence findings

**Dual-folder OpenSpec pattern: no precedent found.** Extensive search yielded no community discussion or repository demonstrating a panitia/jury-facing primary `openspec/` folder plus an internal agent-workflow output folder. Workspace commands exist (`openspec workspace setup`) but are explicitly marked under-development. Tim Duopoly's dual-folder strategy is novel. `[INFERRED]` Implementation is feasible by running two separate `openspec init` calls into different directories with different `--tools` configurations.

**Spec-drift detection algorithms are not OpenSpec-native.** OpenSpec validates spec format and tracks state, but does not deterministically detect gap between code-as-implemented and code-as-specified. This must be implemented as a Codeplex-specific module (likely AST-diff between tree-sitter-extracted symbols and OpenSpec spec requirements). `[INFERRED]` Algorithm sketch: parse OpenSpec requirement clauses, extract referenced symbols (function names, endpoints), confirm presence via tree-sitter parsed tree of current code; missing references = drift.

#### Blind spots

- No public Python benchmark of tree-sitter cold-start with 11 grammars loaded on M-series ARM; expect 50-200ms cold-start per grammar based on community anecdata, requiring lazy loading.
- Multi-framework auth-route parsing (Express middleware vs. FastAPI dependency vs. Flask decorator vs. Rails before_action) requires per-framework query trees; no consolidated public query library exists.

---

## 5. Category 5: Capacity Benchmarks

### 5.1 High-confidence findings

**Refactory Hackathon Round 03 format confirmed.** The official hackathon.refactory.id site states "24+ Hours Per Round," onsite, ≤100 participants. The Round 01 (UGM, 21-22 February 2026) recap explicitly recorded a participant suggestion to hold future rounds "secara onsite 24 jam penuh" (fully onsite for 24 continuous hours), implying Round 01 was NOT a fully continuous 24h sprint. The Round 02 (UNAIR, 8-10 April 2026) listing in the same site labels a 3-day window, with the actual event day reported by UNAIR's news release as Friday April 10, 2026.

Representative schedule per official site: Day 1 08:00 check-in → Hacking 13:00 Day 1 → 11:00 Day 2 (~22 hours continuous build) → submission 11:00-13:00 Day 2 → Top-5 selection 13:00-15:00 → finals 15:00-17:00 → winner announcement 19:00-19:30.

**Refactory Round 02 winning team identity correction (sourced).** Tim Duopoly's original brief stated "Round 02 UNAIR Effix.ai" as a winner reference. Sourced correction: per UNAIR official news (unair.ac.id, published April 16, 2026), the team was "Tim Case Release" (Effix.ai is their product name), and they placed 3rd ("Juara III Creative Innovator"), not 1st. The Round 02 1st-place winner is not publicly named in available sources. Effix.ai is described as "Your AI Code Optimizer" performing internal-structure optimization (not just code review).

**Round 01 winner: Tim LUNARIS, Telkom University.** Confirmed via TRPL UGM news article: Juara 1 (Ultimate Winner) Tim LUNARIS Telkom University; Juara 2 POLIWINDRA Politeknik Negeri Indramayu; Juara 3 WECI HOLIC Politeknik Negeri Malang.

**UKDW Roadshow (Dec 6-7, 2025) winner: Tim Vibecode, UTDI.** Confirmed via UTDI press release: two Backstage-platform plugins focused on Developer Experience automation.

**Theme and scoring are documented.** Refactory's "Openspec x AI" theme with "Engineering Productivity x AI" challenge mandates: OpenSpec foundation, an LLM provider, Kubernetes, PostgreSQL. Five evaluation criteria: (1) Innovation & Creativity, (2) Impact & Relevance, (3) Technical Execution (includes "already deployed and running"), (4) UX & Design, (5) Presentation & Communication. The judges-run-it-themselves expectation is explicit: ships as a usable MVP; judges run it themselves in real-time; no slides or screenshots substitute. Prize pool: 20M IDR cloud credits (1st 12M, 2nd 8M, 3rd 4M).

**General hackathon timing wisdom: 50/50 split build vs ideation+presentation.** The most-cited 24h heuristic across the hackathon literature (Quora consensus, MLH guidance, Automateathon timeline guide) is to spend roughly half the wall-clock on build and half on ideation+presentation+rehearsal, with experienced teams compressing ideation to <10 percent and shifting savings to polish.

### 5.2 Medium-confidence findings

**24h build effort distribution synthesis for Codeplex Chronicle.** Combining the Refactory hard schedule (~22h hacking + ~2h submission + finals afterward), MAST findings (system-design issues dominate failures and require front-loaded contract work), and the hackathon literature on front-loading planning, a defensible split is:

- Wave 0 (Specialists, planning + spec): 2-3 hours (~10-13 percent)
- Wave 1-2 (Visual full, full r3f scene + 5 modes): 10-12 hours (~45-55 percent)
- Wave 3 (Backend full, FastAPI + tree-sitter + DeepSeek integration): 5-7 hours (~22-32 percent)
- Polish + demo flow rehearsal + slide deck: 2-3 hours (~10-13 percent)

`[INFERRED]` Exact percentages are a synthesis; no Refactory-winning-team postmortem documents their internal split.

**Demo rehearsal: 30-60 minutes for a 2-minute pitch is industry-standard.** Automateathon's hour-by-hour timeline guide recommends a dedicated "Rehearsal & Polish" block: practice delivery, time presentation, refine messaging. For a 2-minute pitch with live judge run, expect 4-6 rehearsal passes at minimum.

**Slide deck preparation when one member handles solo.** Generic guidance (Medium hackathon project guide, Quora consensus) suggests 1-2 hours dedicated for a focused deck when one team member owns it solo and the deck is supporting (not primary, since judges run the MVP).

### 5.3 Failure mode patterns when capacity is misallocated

**Wave 2 squeeze:** Most common; happens when Wave 0 planning overruns or Wave 1 visual scaffolding underestimates Three.js setup. Mitigation: hard time-box Wave 0 to 3 hours.

**Wave 3 squeeze:** Backend integration runs out of clock; happens when DeepSeek API quirks (thinking-mode `reasoning_content` replay errors, rate limits) emerge late. Mitigation: dedicate one Wave-0 specialist to a DeepSeek-flash smoke test in the first 60 minutes.

**No buffer:** Demo or deploy breaks 30 minutes before pitch. Mitigation: hard rehearsal slot at T-2h regardless of build state; freeze code at T-3h.

### 5.4 Blind spots

- No public postmortem from Tim LUNARIS (Round 01 winner) or Tim Vibecode (UKDW winner) detailing internal time allocation.
- Anthropic-hosted hackathon postmortems (Built with Opus 4.7, Cerebral Valley) were not located in the search; possibly internal-only.

---

## 6. Cross-Cutting Synthesis

The five categories interact in load-bearing ways for Phase C agentic structure design.

**Token economics drive worker design.** DeepSeek's 1/10 cache-hit pricing (April 26, 2026 onwards) plus the 98 percent cache-hit discount on V4-Flash makes a front-loaded shared-system-prompt pattern economically dominant. Combined with Anthropic's documented "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats," the "pintar multi-task per worker" lock is not just an effective-parallelism choice; it is a budget-survival choice. Each worker's prompt should reuse a stable shared header (OpenSpec context + tech-stack lock + repo conventions) for cache-hit optimization. `[INFERRED]` Cache-hit savings of 70-90 percent on input tokens are realistic if the 21 workers all share a ~3000-token system header.

**Thinking-mode toggling becomes Wave-specific.** Wave 0 specialists (planning, schema design, prompt architecture) benefit from `thinking: enabled, reasoning_effort: high` because correctness of contracts dominates output speed. Wave 1-2 visual workers, which mostly emit React/TSX boilerplate against well-known patterns, should default to `thinking: disabled` on V4-Flash to halve latency and verbosity. Wave 3 backend workers handling multi-language tree-sitter integration and DeepSeek-API plumbing should default to thinking-enabled with reasoning effort high, especially for the diff-serialization step. This per-wave toggle pattern is not in any public source; it is a synthesis from DeepSeek docs (thinking-mode trade-offs) plus MAST (verification failures dominate).

**Visual-first sequencing is defensible against the MAST risk.** MAST's finding that system-design issues and inter-agent misalignment dominate failures suggests that the riskier integration work (backend + DeepSeek + tree-sitter + Kubernetes) should NOT be parallelized with frontend; serializing it into Wave 3 narrows the failure surface. The judges-run-it expectation from Refactory's evaluation rubric reinforces this: a polished visual that runs reliably is judge-credible even if backend is shallow.

**r3f performance ceiling shapes Wave 1-2 capacity split.** The 100-draw-call ceiling at 60fps and the Drei `<Instances>` overhead (r3f #3306) imply Wave 1's foundation worker must commit to raw `<instancedMesh>` per building archetype. With 5 archetype types (Athena temple, Apollo, Argus, Clio, Hermes) plus environment, the draw-call budget allows comfortable headroom but only if the post-processing pipeline (DepthOfField + Bloom + Sparkles) is built behind feature flags wired to `state.performance.regress()`. A Wave-1 task that ships flags but no regress-listener is a Wave-3 hidden cost.

**OpenSpec dual-folder is implementable but un-precedented.** The lack of community precedent means Tim Duopoly should expect a 1-2 hour scaffolding cost in Wave 0 to wire two independent `openspec init` runs, one for the panitia-facing primary spec and one for internal agent-workflow logs, with both using the `core` profile but different `--tools` selections. Validation via `openspec validate` is the same in both. This is a calculated novelty bet.

**MAST + DAG + Anthropic Agent Teams converge on auditor-gated waves.** Each of these independent sources arrives at the same recommendation: insert verification agents between waves, define explicit input/output contracts, and forbid cyclic edges in the task graph. For Codeplex Chronicle, this lands as: Wave-N → Auditor-N gate → Wave-N+1, with auditor running automated checks (OpenSpec validate, build smoke, performance assertion) before unlocking the next wave. Pan (universal worker) is the rescue agent invoked only when an auditor escalates.

---

## 7. Anchoring Recommendations for Phase C

### 7.1 Locked-in anchors (high-confidence, use as design constraints)

1. **Orchestrator-worker pattern with Anthropic Agent Teams as substrate.** Use `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. One Metis team lead, 5 Wave-0 specialists, 4-6 Wave-1/2 visual workers, 4-6 Wave-3 backend workers, 2-3 auditors, Pan universal. Total 21 falls within Agent Teams' tested range only at the upper end; treat 21 as a hard ceiling and prefer 18-20 active at peak.
2. **Agent Skills SKILL.md packaging.** Each of the 21 agents is a SKILL.md under ~500 lines / ~5000 tokens, with descriptions optimized for Claude's discovery-stage reasoning. Shared references go in `references/`.
3. **DAG with explicit edge contracts; no cycles.** Inputs and outputs typed per edge; Wave gates as auditor nodes. MAST evidence is unambiguous: simple fixes are insufficient on their own; tight role specs, contract typing, and DAG topology must all ship together.
4. **DeepSeek V4-Flash default, V4-Pro escalation for Wave 0 specialists and Wave 3 reasoning.** Cache-heavy shared system header (~3000 tokens) to maximize 98 percent cache-hit discount on Flash.
5. **Thinking-mode toggle per Wave.** Wave 0: enabled, high. Wave 1-2: disabled by default. Wave 3: enabled, high. Auditors: enabled, high. Never replay `reasoning_content` from prior turns.
6. **Visual frontend-first sequencing (not parallel with backend).** Waves 1-2 ship visual fully before Wave 3 begins; Wave 3 integrates against locked frontend contracts.
7. **r3f baseline: raw `<instancedMesh>` not Drei `<Instances>`.** Per-archetype InstancedMesh, draw-call budget ≤100, `state.performance.regress()` wired to OrbitControls.
8. **Drop-first feature flags on regress: post-processing → pixel ratio → LOD → shadows → particles** (in that priority order).
9. **OpenSpec core profile, dual-folder novel implementation.** Two `openspec init` runs, both core profile, distinct `--tools` per folder. Wave 0 scaffolding task.
10. **24-hour capacity split**: Wave 0 ~12%, Wave 1-2 ~50%, Wave 3 ~27%, polish+rehearsal ~11%. Hard freeze at T-3h.
11. **Demo: judges run MVP themselves; deck is supporting.** Per Refactory rubric. 2-minute pitch with 30-60 min rehearsal block at T-2h.
12. **Auditors are not optional.** MAST evidence binds: insert Auditor-N gate between every wave; auditor runs `openspec validate`, build smoke, performance assertion, and on failure escalates to Pan.

### 7.2 Hypotheses to validate during Wave 0-1 execution

H1. M-series MacBook Pro 16GB sustains 60fps with 300 InstancedMesh buildings + DepthOfField + Bloom + Sparkles 1500 particles at 1080p. Mitigation if false: cut Sparkles to 500, defer DepthOfField behind regress.

H2. DeepSeek V4-Flash thinking-disabled completes Wave-2 visual mode boilerplate in <8s p95. Mitigation if false: switch Wave-2 to V4-Flash non-think with narrower per-call output budget.

H3. tree-sitter 11-grammar lazy load fits in <300ms total cold start with grammars cached on disk. Mitigation if false: prebuild a single pickled grammar bundle.

H4. OpenSpec dual-folder runs without conflict when both share `core` profile and different `--tools` (one for panitia, one for internal). Mitigation if false: collapse to single folder with two top-level subdirectories under `openspec/`.

H5. Anthropic Agent Teams handles 18-20 active teammates without coordination drift. Mitigation if false: collapse Wave 3 backend workers to fewer multi-task workers (consistent with "pintar multi-task" lock).

H6. DeepSeek cache-hit ratio exceeds 70 percent across the 21-worker run with a shared 3000-token system header. Mitigation if false: lengthen the shared header and pre-warm the cache via a no-op call at session start.

### 7.3 Persistent blind spots (acknowledge in Section 7 of final agentic structure md)

- No published postmortem of a 24-hour, 20+ agent, Anthropic Agent Teams build exists for direct calibration of throughput.
- DeepSeek V4 in agentic loops with `reasoning_content` plus tool-calling does not have a published reference workflow; the OpenCode issue #24114 indicates the integration surface is still maturing.
- M-series performance for r3f@9 + Three.js 0.184 + heavy post-processing is not benchmarked publicly.
- The PromptOpening 10-step pattern is a Tim Duopoly internal convention; no external prior art was found.
- Greek mythology naming as an anti-collision strategy is empirically unstudied.
- Round 02 Refactory 1st-place winner identity is undocumented publicly; the Round 02 actual winner's stack and approach cannot be referenced for calibration. Effix.ai was confirmed as the 3rd-place team's product (UNAIR, "Case Release"), not a 1st-place reference; Phase C should avoid citing Effix.ai as a winning-team benchmark.

---

## 8. Source citations (ranked by authority)

**Anthropic engineering and official docs**
- Anthropic Engineering, "How we built our multi-agent research system" (June 13, 2025): https://www.anthropic.com/engineering/multi-agent-research-system
- Anthropic Engineering, "Equipping agents for the real world with Agent Skills": https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Claude Code docs, "Create custom subagents": https://code.claude.com/docs/en/sub-agents
- Claude API docs, "Agent Skills Overview": https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Anthropic resources, "The Complete Guide to Building Skills for Claude" (PDF): https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf

**arXiv frontier**
- Cemri et al., "Why Do Multi-Agent LLM Systems Fail?" (MAST), arXiv:2503.13657: https://arxiv.org/abs/2503.13657 and https://sites.google.com/berkeley.edu/mast
- Ye and Tan, "Agent Contracts," arXiv:2601.08815 (COINE/AAMAS 2026): cited via https://arxiv.org/html/2605.05657
- Bruls, Huizing, van Wijk, "Squarified Treemaps": https://vanwijk.win.tue.nl/stm.pdf
- Marson and Musse, "Automatic Real-Time Generation of Floor Plans Based on Squarified Treemaps Algorithm," IJCGT 2010: https://onlinelibrary.wiley.com/doi/10.1155/2010/624817

**Primary API and library docs**
- DeepSeek API Models & Pricing: https://api-docs.deepseek.com/quick_start/pricing/
- DeepSeek API Thinking Mode: https://api-docs.deepseek.com/guides/thinking_mode
- DeepSeek-V4-Pro Hugging Face card: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro
- OpenSpec GitHub + docs: https://github.com/Fission-AI/OpenSpec; https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md; https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md; https://deepwiki.com/Fission-AI/OpenSpec/3-opsx-workflow-system
- react-three-fiber docs, "Scaling performance": https://r3f.docs.pmnd.rs/advanced/scaling-performance
- r3f issue #3306 (Drei Instances overhead): https://github.com/pmndrs/react-three-fiber/issues/3306
- pmndrs/postprocessing: https://github.com/pmndrs/postprocessing
- py-tree-sitter: https://github.com/tree-sitter/py-tree-sitter; tree-sitter-language-pack: https://github.com/kreuzberg-dev/tree-sitter-language-pack
- Gitleaks: https://github.com/gitleaks/gitleaks

**Established engineering blogs**
- Simon Willison on DeepSeek V4 (April 24, 2026): https://simonwillison.net/2026/Apr/24/deepseek-v4/
- Simon Willison on Anthropic multi-agent research: https://simonwillison.net/2025/Jun/14/multi-agent-research-system/
- ClaudeFast Agent Teams guide: https://claudefa.st/blog/guide/agents/agent-teams
- ClaudeFast multi-agent orchestrator comparison: https://claudefa.st/blog/tools/orchestrators/multi-agent-orchestrators
- Shipyard "Multi-agent orchestration for Claude Code in 2026": https://shipyard.build/blog/claude-code-multi-agent
- Codrops Three.js Instances: https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/
- Codrops Three.js performance: https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
- utsubo.com "100 Three.js Tips That Actually Improve Performance (2026)": https://www.utsubo.com/blog/threejs-best-practices-100-tips
- Artificial Analysis V4-Flash benchmarks: https://artificialanalysis.ai/models/deepseek-v4-flash
- ByteByteGo, "How Anthropic Built a Multi-Agent Research System": https://blog.bytebytego.com/p/how-anthropic-built-a-multi-agent

**Community blogs / aggregators**
- Constellation Research overview: https://www.constellationr.com/blog-news/insights/anthropics-multi-agent-system-overview-must-read-cios
- ZenML LLMOps Database: https://www.zenml.io/llmops-database/building-a-multi-agent-research-system-for-complex-information-tasks
- DEV.to Phil Whittaker "Progressive Discovery": https://dev.to/phil-whittaker/progressive-discovery-a-better-mental-model-for-agent-skills-51bd
- Firecrawl Agent Skills explainer: https://www.firecrawl.dev/blog/agent-skills
- SwirlAI Newsletter, Agent Skills progressive disclosure: https://www.newsletter.swirlai.com/p/agent-skills-progressive-disclosure
- paperclipped.de Agent Skills standardization analysis (referenced via enrichment for the 48-hour adoption timeline)
- chat-deep.ai pricing reference: https://chat-deep.ai/pricing/
- devtk.ai DeepSeek pricing guide 2026: https://devtk.ai/en/blog/deepseek-api-pricing-guide-2026/
- ofox.ai DeepSeek pricing guide: https://ofox.ai/blog/deepseek-api-pricing-guide-2026/
- DeepInfra DeepSeek V4 Pro pricing analysis: https://deepinfra.com/blog/deepseek-v4-pro-pricing-guide-2026-providers-cost-analysis

**Refactory Hackathon and Indonesian context**
- Refactory Hackathon official site: https://hackathon.refactory.id/
- TRPL UGM Round 01 recap: https://trpl.sv.ugm.ac.id/2026/03/03/sukses-digelar-di-ugm-refactory-hackathon-tantang-talenta-muda-ciptakan-inovasi-berbasis-openspec-x-ai/
- UNAIR Effix.ai (Tim Case Release, Juara III): https://unair.ac.id/sederhanakan-kode-lewat-effix-ai-tim-mahasiswa-unair-raih-juara-iii-di-kompetisi-hackathon/
- UTDI Tim Vibecode UKDW Roadshow winner: https://www.utdi.ac.id/site/news/751/tim-vibecode-utdi-raih-juara-1-refactory-hackathon-x-ukdw-2025-dengan-inovasi-developer-portal
- Telkom University FIF mahasiswa LUNARIS prestasi: https://bse.telkomuniversity.ac.id/presatasi-mahasiswa-fif-telkom-university-raih-juara-1-di-hackathon-refactory-x-ugm/

**Awwwards visual references**
- Awwwards Sites of the Month: https://www.awwwards.com/websites/sites_of_the_month/
- Oryzo AI (Lusion, SOTM April 2026): https://www.awwwards.com/sites/oryzo-ai

**Hackathon literature**
- Hackathon Planning Kit: https://hackathon-planning-kit.org/
- Automateathon timeline guide: https://automateathon.com/blog/events/hackathon-timeline-guide.html
- AngelHack AI Hackathon Planning Template 2026: https://angelhack.com/blog/ai-hackathon-planning-template/