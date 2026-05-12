# Hephaestus Research Notes

**Date**: 2026-05-12
**Author**: Hephaestus (Wave 0 worker prompt + auditor prompt + PromptOpening author)
**Purpose**: Mandate 0 Tier 2 auto-research, surface latest Anthropic subagent + multi-agent patterns post Opus 4.7 launch + adaptive thinking default + ultrathink downgrade bug. Findings baked into 19 worker prompts + PromptOpening file.

## Queries run

1. `Claude Code subagent .claude/agents YAML frontmatter 2026 best practice Opus 4.7` (open web)
2. `Claude Opus 4.7 effort level xhigh max prompt engineering 2026 Anthropic engineering` (anthropic.com + docs filter)
3. `Anthropic multi-agent research system architecture orchestrator worker pattern 2025 2026` (anthropic.com + docs filter)
4. `Anthropic prompt engineering best practices positive framing concrete examples 2026 agent` (anthropic.com + docs filter)
5. `Claude Code subagent description field 1024 character tool restrictions delegate pattern` (open web)

Budget: ~20 minutes Mandate 0 deep research (within 15-25 minute target). 5 queries surface enough authoritative material for 19 worker prompts; further query yields diminishing return.

## Key findings (impact ke prompt authoring)

### Finding 1: xhigh is recommended default effort for Opus 4.7 coding + agentic

**Source**: https://www.anthropic.com/news/claude-opus-4-7 + https://platform.claude.com/docs/en/build-with-claude/effort

**Summary**: Opus 4.7 introduces a new `xhigh` effort tier between `high` and `max`. For coding + agentic use cases, Anthropic recommends starting with `xhigh`. Minimum `high` for most intelligence-sensitive use cases. At `xhigh`/`max`, recommend `max_tokens` starting 64k to give model room to think + act across subagents.

**Apply to**: YAML frontmatter `effort: <tier>`. Mapping per Metis Section 3:
- Wave 0 + auditors + Pan: `max` (locked cascade impact)
- Daedalus/Iris/Hera/Hades/Triton/Nemesis/Pandora/Atlas: `xhigh` (architectural decision + single-point-of-failure)
- Calliope/Selene/Asclepius/Boreas/Persephone/Demeter: `high` (pattern application + multi-component)
- Hestia: `medium` (smallest scope, standard pattern)

`xhigh` is canonical for Opus 4.7, NOT a custom tier. Worker prompts reference this directly without explaining the tier.

### Finding 2: Adaptive thinking + DO NOT use ultrathink keyword

**Source**: https://www.anthropic.com/news/claude-opus-4-7 + Anthropic engineering blog

**Summary**: Opus 4.7 uses adaptive thinking by default, auto-adjusting reasoning depth per turn based on task complexity. Effort tier sets the ceiling. Per session-start context: `ultrathink` keyword has active bug (12 May 2026) that pins effort to "high", which DOWNGRADES from xhigh/max. So `ultrathink` is contraindicated for our use case where we want max ceiling preserved.

**Apply to**: 
- Worker prompt Section 4 mandatory baseline: explicit "DO NOT use `ultrathink` keyword" directive
- Adaptive thinking jalan otomatis, no keyword trigger needed
- Mention `extended thinking` boleh, tapi avoid `ultrathink` specifically per bug

### Finding 3: Description field drives delegation, write like triage rule

**Source**: https://code.claude.com/docs/en/sub-agents + https://platform.claude.com/docs/en/agent-sdk/subagents

**Summary**: The `description` field is the primary signal Claude uses to decide whether to invoke a subagent. Write descriptions as if they were the first sentence of a triage rule: "Use this subagent when [condition]. It returns [output shape]." Vague descriptions ("helps with code") get random invocation; specific descriptions ("reviews a recent diff and returns issues by severity") get correct invocation.

**Apply to**: YAML frontmatter `description:` field per worker. Each description starts with trigger condition + output shape. Keyword-rich (since description used in routing). Examples authored in prompts:
- Daedalus: "Use this worker untuk scaffolding Three.js + @react-three/fiber Canvas Wave 1: camera + lighting + HDRI + post-processing pipeline + feature flag wiring. Returns mounted ChronicleCanvas component plus performance state hook."
- Eunomia: "Use this auditor at end of Wave 1 untuk binary PASS/FAIL gate check: r3f 60fps + 3 page mount + openspec validate + contract conformance. Returns audit findings doc dengan PASS or FAIL escalation."

### Finding 4: Multi-agent orchestrator pattern: detailed task descriptions, scaling effort rules, clear boundaries

**Source**: https://www.anthropic.com/engineering/multi-agent-research-system + https://claude.com/blog/multi-agent-coordination-patterns

**Summary**: Anthropic's multi-agent research system uses orchestrator-worker pattern. Lead agent decomposes queries + describes subtasks to subagents. Each subagent needs:
1. Objective
2. Output format
3. Tools + sources guidance
4. Clear task boundaries

Without detailed task descriptions, agents duplicate work, leave gaps, or misinterpret. Scaling rules embedded in prompts because agents struggle to judge appropriate effort.

**Apply to**: 10-step prompt structure per worker matches this pattern:
- Step 1 Identity = objective
- Step 9 Output formatting = output format
- Step 4 Domain ownership + tools = tools/sources guidance
- Step 10 Ship criteria = task boundaries
- Effort tier YAML = scaling rule

Worker prompts include explicit "stay in domain" + "ferry if cross-cutting" directives so workers don't drift or duplicate.

### Finding 5: Positive framing + concrete examples + permission for uncertainty

**Source**: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering + https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

**Summary**: Best practices for LLM prompt engineering:
- **Positive framing**: instead of "Create X", use "Create X. Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."
- **Concrete examples**: specify visual direction + materials + palette in concrete terms
- **Optimal altitude**: specific enough to guide, flexible enough to leverage model heuristics
- **Section delineation**: use Markdown headers `## Tool guidance` `## Output description` `## Background information`
- **Permission for uncertainty**: explicit permission to express uncertainty rather than guessing reduces hallucinations

**Apply to**:
- Worker prompts use 10-step Markdown header structure (not XML), GitHub-renders friendly
- Each step phrased positively ("Lu produce X. Honor Y. Go beyond Z untuk distinctive output")
- Visual workers (9 worker) include concrete Anti-AI-slop section dengan specific aesthetic anchors
- Confidence-based action section explicit: "High 85%+ proceed; Medium 60-85% mandatory uncertainty journal; Low <60% ferry"
- Uncertainty journal is the official channel for surface uncertainty (not silent inflate confidence)

### Finding 6: Tool restrictions scoped per agent + handoff rules

**Source**: https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026 + https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/

**Summary**: 2026 best practice for subagents:
- One clear goal + input + output + handoff rule per subagent
- Scope tools per agent role (PM/Architect read-heavy via Read + search + MCP docs; Implementer Edit + Write + Bash + UI testing; Release narrow toolset)
- Description action-oriented, decision-trigger style

**Apply to**: YAML frontmatter `tools:` field per worker:
- Visual workers (Daedalus, Iris, Calliope, Hestia, Selene, Hera, Asclepius, Boreas, Persephone): `Read, Edit, Write, Bash, Glob, Grep, WebSearch, mcp__context7__query-docs, mcp__context7__resolve-library-id`
- Backend workers (Hades, Triton, Nemesis, Pandora, Demeter): `Read, Edit, Write, Bash, Glob, Grep, WebSearch, mcp__context7__query-docs, mcp__context7__resolve-library-id`
- Atlas: full incl Bash subprocess for kubectl + docker
- Auditors (Eunomia, Dike, Aletheia): `Read, Bash, Glob, Grep, WebSearch, mcp__playwright__*` (read-heavy + browser inspection for Lighthouse)
- Pan: all tools (universal worker scope unbounded)

### Finding 7: Designer bundle integration pattern (Claude Design + Code handoff)

**Source**: Anthropic claude.ai/design product blog + Claude Code customization guides

**Summary**: claude.ai/design exports Code Handoff Bundle (folder with `design-tokens.json` + `components/` + `pages/` + `intent.md`). Calliope/Hestia/Selene workers consume this folder.

Best practice for handoff worker prompts:
- Reference bundle path EXPLICITLY in Section 3 Background context
- Wait condition: "Read intent.md FIRST. If folder empty/missing, ferry V1 Orch."
- Port: design-tokens.json → Tailwind config; components → React; preserve voice + motion timing per intent.md
- Avoid: regenerating design from scratch; ignoring intent.md voice; hardcoding tokens inline

**Apply to**: Calliope/Hestia/Selene Section 3 + Section 7 prompt body, eksplisit reference:
- Calliope: `_meta/designer/prompt1-landing/handoff-bundle-extracted/`
- Hestia: `_meta/designer/prompt2-entry/handoff-bundle-extracted/`
- Selene: `_meta/designer/prompt3-dashboard/handoff-bundle-extracted/`

## Patterns adopted

1. **YAML frontmatter format**: name + description + tools + model + effort (5 fields). Description action-oriented triage rule style. Tools comma-separated. Model `claude-opus-4-7` locked. Effort per Metis Section 3.
2. **10-step body structure**: Markdown headers per spawn template Section 7. Identity → Tone → Background → Domain + rules → Examples → Conversation history → Immediate task → Thinking instruction → Output formatting → Ship criteria.
3. **Anti-AI-slop section**: mandatory di 9 visual workers, explicit "would Ghaisan screenshot this?" gate.
4. **4 mandatory artifacts per cycle**: decision log + uncertainty journal + checkpoint + handoff contract per Pythia template.
5. **5 ferry triggers HIGH bar**: critical block, contract conflict, anti-pattern violation, scope decision, downstream cascade. Otherwise uncertainty journal + proceed.
6. **20-item self-check pre-stop**: 5 output completeness + 10 anti-pattern compliance + 3 contract integrity + 2 capacity/meta.
7. **Designer bundle wait condition**: 3 page workers (Calliope/Hestia/Selene) ferry if bundle missing, downstream zero-Designer-dependency workers (Daedalus/Iris) gas paralel.
8. **PromptOpening dual purpose**: shared system header for cache-hit (~3000 tokens H6 hypothesis) PLUS Wave 1 spawn directive Ghaisan paste.
9. **Effort tier explicit**: each worker prompt names tier + reasoning, env var `CLAUDE_CODE_EFFORT_LEVEL` overrides per session.
10. **Confidence-based action**: medium default unless 100% sure, uncertainty journal mandatory medium concerns.

## Patterns rejected

1. **`ultrathink` keyword**: rejected per active bug 12 May 2026 (pins effort to "high", downgrades xhigh/max). Adaptive thinking handles depth automatically.
2. **XML section tags** (`<background_information>` etc): rejected for Markdown headers because (a) Markdown renders cleaner in GitHub viewer (Themis output PanitSubmission), (b) Claude Code prompts conventionally use Markdown, (c) less verbose.
3. **Embedding Pythia contracts verbatim in worker prompts**: rejected per Pythia handoff Section 8 OQ-2 recommendation. Reference contract by path + brief schema summary; worker reads in-session.
4. **Single mega-prompt per worker (1500+ lines)**: rejected. 10-step structure targets 400-600 lines per worker. Avoid bloat; bait for context overflow during worker execution.
5. **Em dash + emoji + casual English-only**: rejected per Lock 1 + Lock 2 + Communication Style. Worker prompts honor casual Indonesian gw/lu register, English technical code-switch, no em dash, no emoji.
6. **Worker prompts include full PRD recap**: rejected. PRD lives at `docs/prd/PRD-ideaLocked_codeplex-chronicle.md`, worker reads via tool. Prompt cites PRD Section X paths.
7. **Auditor prompts as simple checklist**: rejected. Auditors need own 10-step structure dengan explicit audit execution detail (how to run Lighthouse, capture FPS, validate Pythia contracts). Eunomia/Dike/Aletheia max effort tier locked.
8. **Worker self-test via subagent spawn**: rejected (no nesting). Worker self-validate via 20-item self-check + ferry; no Task tool delegate from worker.

## Open questions

1. **PromptOpening token budget**: H6 hypothesis ~3000 tokens shared header for 98% cache-hit discount per Triton Wave 3 metric. Pythia handoff Section 8 OQ-1 leaves token allocation to Hephaestus judgment. **Recommendation**: target ~3000-4000 token PromptOpening, prioritize project identity + 5 resident personas + anti-pattern locks + Greek naming discipline + ferry directive. Skip verbose decoration.
2. **Worker prompt cross-references contracts verbatim vs path-reference**: Pythia handoff Section 8 OQ-2 recommends path reference + brief schema summary, worker reads contract in-session. **Adopted**: path reference per worker prompt Section 3 Background context.
3. **Bilingual persona directive**: Pythia handoff Section 8 OQ-3. Indonesian primary + English code-switch. **Adopted**: per-worker prompt opens dengan Indonesian directive + casual gw/lu register, English technical code-switch saat technical term. Resident personas (Athena/Apollo/Argus/Clio/Hermes) bilingual baked di PromptOpening per Designer voice mandate.
4. **Pan dynamic prompt vs static**: Pan handles Day 2 chain dynamically per Aletheia handoff. **Adopted**: Pan prompt static base (role + identity + locked anti-patterns + 4 duty categories) + dynamic task injection at spawn time per `aletheia-to-pan.md` Pan task list section.

## Sources

- [Create custom subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Subagents in the SDK - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- [Effort - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Model configuration - Claude Code Docs](https://code.claude.com/docs/en/model-config)
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Multi-agent coordination patterns](https://claude.com/blog/multi-agent-coordination-patterns)
- [Prompting best practices - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Best practices for Claude Code subagents (Pubnub)](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)
- [Claude Code Agent Teams 2026 Playbook (Developers Digest)](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026)

## Closing

Patterns locked. 19 worker prompts plus PromptOpening will reflect:
- YAML frontmatter 5-field spec
- 10-step Markdown body
- Anti-AI-slop section (visual workers)
- 4 mandatory artifacts per cycle
- 5 ferry trigger HIGH bar
- 20-item self-check
- xhigh / high / medium / max effort tier per Metis Section 3
- DO NOT use ultrathink keyword
- Designer bundle wait condition (Calliope/Hestia/Selene)
- Casual Indonesian gw/lu + English technical code-switch
- No em dash, no emoji

Gas Cycle 1 author Wave 1 worker prompts.
