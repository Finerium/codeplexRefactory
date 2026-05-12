# Hephaestus Decision Log (Wave 0 Worker Prompt + Auditor Prompt + PromptOpening Author)

**Append-only**. Each entry: timestamp + decision + reasoning + impact.

---

## 2026-05-12 17:05 WIB | Cycle 0 entry

**Decision**: Adopt Tier 2 auto-research, 5 web search query (4 baseline + 1 follow-up). Skip Tier 3 (deeper academic literature).

**Reasoning**: Spawn message budget 15-25 menit Mandate 0. 5 query covers latest Anthropic subagent pattern (3 query: subagent docs + Opus 4.7 effort + multi-agent research) + prompt engineering (1 query) + description field delegation (1 query). Diminishing return beyond 5 query within budget.

**Impact**: Findings documented `_meta/hephaestus_research_notes.md`. Patterns 1-10 adopted, 1-8 rejected. Workers prompt format influenced.

---

## 2026-05-12 17:25 WIB | YAML frontmatter format

**Decision**: 5-field YAML frontmatter: `name`, `description`, `tools`, `model`, `effort`.

**Reasoning**: Per Mandate 0 research, Anthropic Claude Code subagent latest 2026 pattern accepts these fields. `model` accepts alias (sonnet/opus/haiku) or full ID (`claude-opus-4-7`). `effort` is custom field that maps to env var override OR runtime convention (Claude Code may not natively parse `effort` per current docs, BUT Anthropic engineering blog mentions xhigh tier default for Opus 4.7 coding/agentic). Documenting effort in frontmatter is best-effort signaling, even kalau not natively parsed (Workers can read own frontmatter via Read tool kalau perlu).

**Impact**: All 19 prompts use 5-field. Effort tier per Metis Section 3 column 5 mapping.

---

## 2026-05-12 17:30 WIB | 10-step body structure

**Decision**: Markdown body 10-step structure: Identity, Tone, Background context, Domain ownership + hard rules, Examples, Conversation history, Immediate task, Thinking instruction, Output formatting, Ship criteria. Plus Effort budget + Closing footer.

**Reasoning**: Per spawn message Section 7 template + Anthropic Cookbook prompt engineering pattern (Anthropic recommends `<background_information>`, `<instructions>`, `## Tool guidance`, `## Output description` section delineation). I adopted Markdown headers instead of XML tags untuk:
- GitHub-renders friendly (Themis PanitSubmission may include prompts)
- Claude Code convention
- Less verbose
Section delineation principle honored via Markdown H2/H3 headers.

**Impact**: All 19 prompts follow this structure. Variation: auditor prompts slimmer Section 7 (audit checklist execution detail instead of multi-cycle plan). Pan prompt has multi-duty Section 7 (spawn context A/B/C drives task).

---

## 2026-05-12 17:40 WIB | Reject `ultrathink` keyword

**Decision**: Workers prompt explicitly instruct "DO NOT use `ultrathink` keyword".

**Reasoning**: Per spawn message Section 5 + Mandate 0 research, active bug per 12 Mei 2026 where `ultrathink` keyword pins effort to "high" (DOWNGRADE from xhigh/max). Adaptive thinking Opus 4.7 default always-on per effort tier ceiling. Keyword trigger not needed, just rely on YAML frontmatter effort + env var override.

**Impact**: All 19 prompts include explicit "DO NOT use `ultrathink`" directive Section 4 Mandatory baseline. PromptOpening line 3 includes same directive.

---

## 2026-05-12 17:45 WIB | Tool permissions per worker

**Decision**: Tool permissions scoped per worker role. Visual workers + backend workers: Read, Edit, Write, Bash, Glob, Grep, WebSearch, Context7. Visual workers additionally Playwright. Auditors: Read, Bash, Glob, Grep, WebSearch, Playwright (read-heavy + browser inspect). Pan: all tools.

**Reasoning**: Per Mandate 0 research Finding 6 (scope tools per agent role). Visual workers need browser test via Playwright (Lighthouse + snapshot). Backend workers need bash for pytest + alembic + kubectl. Auditors NOT Edit/Write (read-only audit role). Pan universal scope.

**Impact**: YAML `tools:` field per worker.

---

## 2026-05-12 18:00 WIB | Designer bundle wait condition

**Decision**: Calliope/Hestia/Selene worker prompts include explicit wait condition: ferry V1 Orch kalau `_meta/designer/prompt{1,2,3}-{landing,entry,dashboard}/handoff-bundle-extracted/` missing or empty. Daedalus + Iris zero Designer dependency, gas paralel duluan.

**Reasoning**: Per spawn message Section 5 + Pythia contract `claude-design-bundle-to-{calliope,hestia,selene}.md` Edge case handling. Designer bundle is operator-driven (Ghaisan paste prompt-design ke claude.ai/design manual), may not land at Wave 1 spawn time. 3 page worker queue ga jadi blocker untuk Daedalus + Iris.

**Impact**: 3 page worker prompts Section 7 "Immediate task" Step 1 = bundle check + ferry V1 Orch kalau missing. PromptOpening Section 6 "Initial task" Step 2 = bundle check directive untuk V1 Orch.

---

## 2026-05-12 18:10 WIB | Anti-AI-slop section visual workers

**Decision**: 9 visual worker (Daedalus, Iris, Calliope, Hestia, Selene, Hera, Asclepius, Boreas, Persephone) include Anti-AI-slop section di prompt body Section 4. Section explicit "would Ghaisan screenshot this?" validate per cycle.

**Reasoning**: Per spawn message Section 8 + Mandate 0 research Finding 5 (positive framing + concrete examples + distinctive aesthetic anchors). LLM tend converge ke "on-distribution" output generic. Anti-AI-slop section provides specific aesthetic anchors per worker domain (e.g., Daedalus lighting K temperature specific, Iris 5 archetype proportion specific, Calliope sticky-pinned hero specific).

**Impact**: 9 visual worker prompts Section 4 include Anti-AI-slop subsection. Pitch defensibility (Awwwards-tier visual quality bar PRD Section 13).

---

## 2026-05-12 18:30 WIB | Pandora drafts/ isolation Item 17 critical

**Decision**: Pandora 20-item self-check Item 17 elevated to CRITICAL (FERRY V1 Orch IMMEDIATELY kalau fail). drafts/ isolation safety guard verify (file system check pre-write target path startswith drafts/, raise ValueError if not).

**Reasoning**: PRD AD-19 LOCKED safety property: "production code NEVER changes by simulation engine, ONLY via explicit user Accept". Pitch defensibility hinge ("AI explores in drafts, you commit to production" closing punchline PRD Section 15). Violation = pitch crash + Refactory rubric SAFETY-FIRST miss.

**Impact**: Pandora prompt Section 4 Hard rules + Section 4 20-item self-check + Section 10 Ship criteria all flag this critical. Decision rationale documented dalam Pandora prompt body.

---

## 2026-05-12 18:45 WIB | Pan dynamic prompt static base

**Decision**: Pan prompt static base (4 duty + 3 reactive case) + dynamic task injection at spawn time per Aletheia handoff doc.

**Reasoning**: Per Pythia handoff Section 8 OQ-4 + Mandate 0 research adoption pattern 9. Pan handles Day 2 chain dynamically per Aletheia handoff context (PASS normal vs FAIL rescue). Static base provides identity + locked anti-patterns + duty categories. Dynamic task injection via Aletheia handoff doc consumption at spawn (Section 7 "Immediate task" Context A/B/C branching).

**Impact**: Pan prompt Section 7 has 3 spawn context (A normal Day 2, B rescue, C lesson-learned). Workers ferry V1 Orch kalau spawn context ambigu.

---

## 2026-05-12 19:00 WIB | PromptOpening dual purpose

**Decision**: PromptOpening dual purpose:
- (a) Wave 1 kickoff message (Ghaisan paste ke terminal saat V1 Orch spawn Wave 1)
- (b) Shared system header H6 cache-hit (~3000 token, 5 resident persona + anti-pattern locks + Greek naming + Phase B anchors)

**Reasoning**: Per spawn message Section 10 + Mandate 0 research Pattern 8. Single file serves both roles efficiently. Cache-friendly (H6 hypothesis 98% cache-hit discount via DeepSeek prompt cache for repeat queries). Wave 1 spawn directive in same file = V1 Orch operates from single source of truth.

**Impact**: PromptOpening 12 section structure covers both roles. ~230 line target hit. Workers Read tool reference for resident persona detail. Themis may alias CLAUDE.md (decision deferred).

---

## 2026-05-12 19:10 WIB | Prompt count 19 not 16

**Decision**: 19 prompt files in `.claude/agents/` total. Pythia handoff "16 prompt" was Metis errata.

**Reasoning**: Metis Section 5.1 Hephaestus ship criteria says "12 worker + 3 auditor + 1 Pan = 16". But Metis Section 3 Roster Full lists 15 worker (5 Wave 1 + 4 Wave 2 + 6 Wave 3 = 15). Plus 3 auditor (Eunomia, Dike, Aletheia) + 1 Pan = 19. Spawn message Section 5 explicit list matches 19.

**Impact**: 19 file authored. V_n snapshot locks 19 count. Handoff to Themis flags discrepancy.

---

## 2026-05-12 19:20 WIB | V0 snapshot lock

**Decision**: Author V_n snapshot `_meta/orchestration_log/V0_hephaestus_prompts_locked_20260512-1930.md` post-mandate completion, pre-Themis handoff.

**Reasoning**: Per Lock 9 V_n snapshot per major milestone. Hephaestus mandate = major milestone (19 prompt + PromptOpening + research notes shipped). V0 lock prevents continuous edit. Major change post-V0 → V0+1 with amendment doc.

**Impact**: V_n snapshot file authored. Workers + Themis treat as canonical V0.

---

## Closing

Cycle 0-6 decisions captured. Ferry V1 Orch kalau Themis or Wave 1+ workers detect amendment-worthy issues.
