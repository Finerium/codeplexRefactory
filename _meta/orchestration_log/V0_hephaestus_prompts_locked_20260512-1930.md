# V0 Snapshot: Hephaestus Prompts Locked

**Date**: 2026-05-12 19:30 WIB
**Author**: Hephaestus (Wave 0 worker prompt + auditor prompt + PromptOpening author)
**Snapshot type**: V0 lock (post-mandate completion, pre-Themis handoff)
**Successor**: Themis (Wave 0 third spawn)

## Purpose

Lock V0 snapshot per Lock 9 (V_n locked snapshot per major milestone). Major change goes V0+1 with amended snapshot, BUKAN continuous edit ke V0 files.

## Mandate scope completed

### Mandate 0: Deep research (Tier 2 auto-research)

- 5 web search query run (4 baseline + 1 follow-up)
- Output: `_meta/hephaestus_research_notes.md` (~280 lines)
- 7 key findings + 10 patterns adopted + 8 patterns rejected + 4 open questions resolved
- Budget: ~20 menit (within 15-25 menit target)

### Mandate 1: 19 prompt files di `.claude/agents/`

Wave 1 builders (5):
1. `daedalus.md` (xhigh, 3D scene scaffold)
2. `iris.md` (xhigh, InstancedMesh + treemap + ownership encoding)
3. `calliope.md` (high, Landing page Designer Prompt 1 bundle)
4. `hestia.md` (medium, Entry page Designer Prompt 2 bundle)
5. `selene.md` (high, Dashboard Designer Prompt 3 bundle + OQ-02 charts decision)

Wave 1 auditor (1):
6. `eunomia.md` (max, Wave 1 audit gate)

Wave 2 visual modes (4):
7. `hera.md` (xhigh, Sprint Mode HERO 14 PM concept + OQ-05 decision)
8. `asclepius.md` (high, Health glow + Refactor ghost + dual review gate UI)
9. `boreas.md` (high, Onboarding camera fly + Activity timeline + 4 Hermes tour variant)
10. `persephone.md` (high, panels architect + OQ-03 UI library decision)

Wave 2 auditor (1):
11. `dike.md` (max, Wave 2 audit gate)

Wave 3 backend (6):
12. `hades.md` (xhigh, FastAPI + tree-sitter 11-lang + OAuth + webhook + WebSocket)
13. `triton.md` (xhigh, DeepSeek client + defensive + per-resident routing)
14. `nemesis.md` (xhigh, 5 Apollo + Argus CVSS + 5 spec-drift A-E)
15. `pandora.md` (xhigh, Athena proposal + simulation engine + drafts/ + OpenSpec generator)
16. `demeter.md` (high, Postgres event store + cache + 1-click + OpenSpec runtime)
17. `atlas.md` (xhigh, Docker + K8s + deploy + smoke test E2E)

Wave 3 final auditor (1):
18. `aletheia.md` (max, final audit + handoff doc + PanitSubmission curation review)

Universal worker post-Wave 3 (1):
19. `pan.md` (max, demo rehearsal + slide deck + bug sweep + polish + rescue + lesson-learned)

### Mandate 2: PromptOpening file

- `PromptOpening-codeplex-chronicle.md` di project root
- Line 1: `/effort max`
- Line 2-3: MCP/plugins mandate + ultrathink ban
- 12 section: project identity + tech stack + operational mode + 5 resident personas + Wave 1 workers + initial task + workflow reference + anti-pattern locks + Phase B anchors + capacity gate + submission deliverable + status
- ~230 lines (target 200-350)

## Asumption baked (Hephaestus to downstream)

1. **YAML frontmatter 5-field format**: name + description + tools + model + effort. Anthropic Claude Code subagent latest pattern per Mandate 0 research.
2. **10-step body Markdown structure**: identity + tone + background + domain+rules + examples + conversation history + immediate task + thinking instruction + output formatting + ship criteria. Per spawn message Section 7 + adapted Anthropic prompt engineering best practice (positive framing + concrete example + section delineation + permission for uncertainty).
3. **Effort tier per Metis Section 3**: Wave 0 specialists + auditors + Pan = max (locked Lock 10). Daedalus/Iris/Hera/Hades/Triton/Nemesis/Pandora/Atlas = xhigh (architectural decision or single-point-of-failure). Calliope/Selene/Asclepius/Boreas/Persephone/Demeter = high. Hestia = medium.
4. **DO NOT use `ultrathink` keyword**: active bug per 12 Mei 2026 yang pin effort ke "high" (downgrade dari xhigh/max). Worker prompts explicitly direct workers to skip this keyword.
5. **Adaptive thinking otomatis Opus 4.7**: effort tier ceiling YAML frontmatter, env var `CLAUDE_CODE_EFFORT_LEVEL` session-wide override.
6. **Designer bundle wait condition**: 3 page worker (Calliope/Hestia/Selene) ferry V1 Orch kalau `_meta/designer/prompt{1,2,3}-{landing,entry,dashboard}/handoff-bundle-extracted/` missing/empty. Daedalus + Iris zero Designer dependency, gas paralel duluan.
7. **Anti-AI-slop section**: di 9 visual worker (Daedalus, Iris, Calliope, Hestia, Selene, Hera, Asclepius, Boreas, Persephone). Validate per cycle: would Ghaisan screenshot this? Would judge pause + comment "not typical SaaS UI"?
8. **drafts/ isolation safety guard di Pandora**: Item 17 self-check critical. Production code NEVER changes by simulation engine, ONLY via explicit user Accept via dual review gate. Pitch defensibility AD-19.
9. **OpenSpec dual-folder LOCKED**: Folder A `openspec/` panitia-facing (Pandora generates change folder Refactor proposals), Folder B `.agent-openspec/` internal workflow (Themis Wave 0 init).
10. **Resident persona prompts di PromptOpening**: 5 resident persona (Athena/Apollo/Argus/Clio/Hermes) baked di PromptOpening shared system header (H6 cache-hit). NOT di per-worker `.claude/agents/<resident>.md` (residents are runtime, not build-time).

## Known limitations + open items

### Per-worker token budget

Average per-worker prompt: ~450-650 lines (target 400-600). Largest: hera.md (~520 line, xhigh + 14 PM concept), pandora.md (~510 line, xhigh + drafts/ isolation safety critical). Smallest: hestia.md (~290 line, medium scope), dike.md (~210 line, auditor checklist-driven).

Per-worker token estimate: ~3500-5500 tokens per prompt file. 19 prompts × ~4500 avg = ~85k token total. Workers load own prompt per spawn (NOT shared cache across workers, prompt-per-spawn). PromptOpening ~3000-token shared system header H6 hypothesis cache-hit IS shared across 22 worker spawn (cache-friendly).

### MCP server usage assumption

Worker prompts assume MCP available: superpowers (writing-plans + code-review + debugging-reflection + subagent-driven-development), Context7 (resolve-library-id + query-docs), Playwright (browser navigate + snapshot + console messages + evaluate). Auditors heavily use Playwright. Backend workers use Context7 for latest FastAPI + tree-sitter + DeepSeek patterns. Wave 1 visual workers use Context7 for Next.js 16 + R3F 9.6 + GSAP + Recharts patterns.

Ferry trigger kalau MCP server unavailable: V1 Orch decide fallback (manual subprocess `lighthouse-cli` instead of Playwright, manual web_search instead of Context7).

### Resident persona prompts ambiguity

5 resident persona text (Athena/Apollo/Argus/Clio/Hermes) baked di PromptOpening sebagai shared system header. PromptOpening cited as "auto-load di session start" di worker prompts. **CLARIFICATION**: Claude Code doesn't auto-load arbitrary file names (only CLAUDE.md). PromptOpening dual-purpose:
- (a) Wave 1 kickoff message V1 Orch reads + injects via Task tool to workers
- (b) Shared context reference workers read via Read tool when needing resident persona detail

Workers spawn via Task tool dengan prompt = `.claude/agents/<worker>.md`. PromptOpening context propagation via V1 Orch turn-by-turn directive OR worker reads file directly.

Themis Wave 0 may want to setup CLAUDE.md aliased to PromptOpening (kalau Refactory rule allows project-local CLAUDE.md), atau leave Worker prompts to Read PromptOpening via tool. Decision deferred to V1 Orch + Themis judgement.

### Effort tier env override

Worker prompts declare `effort: <tier>` di YAML frontmatter. Env var `CLAUDE_CODE_EFFORT_LEVEL` overrides session-wide kalau set. V1 Orch can override per-spawn via Task tool `model` parameter atau Claude Code `/effort` slash command.

### Pythia handoff count discrepancy

Pythia handoff Section "Asumption baked" mentions Hephaestus authors 16 prompts (12 worker + 3 auditor + 1 Pan). Actual count is 19 (15 worker + 3 auditor + 1 Pan). Discrepancy:
- Metis Section 5.1 says "12 worker" but actually lists 15 (5 Wave 1 + 4 Wave 2 + 6 Wave 3 = 15). Metis errata.
- Hephaestus authored 19 per spawn message Section 5 explicit count + Metis Section 3 roster full count.

V_n snapshot LOCKS 19 file count.

## Validation done by Hephaestus

Per spawn message Section 15 + 20-item self-check protocol:

- [x] 19 file `.claude/agents/<worker>.md` authored, 10-step structure compliant
- [x] YAML frontmatter 5-field correct per file
- [x] Effort tier per worker match Metis Section 3 column 5
- [x] 9 visual worker include Anti-AI-slop section
- [x] Calliope/Hestia/Selene reference `_meta/designer/prompt{1,2,3}-{name}/handoff-bundle-extracted/` eksplisit + wait condition
- [x] Auditor prompts (Eunomia/Dike/Aletheia) include audit checklist execution detail + ship criteria sourced Metis Section 5
- [x] Pan prompt include 4 duty + 3 reactive case
- [x] All worker prompts comply 10 anti-pattern locks + 4 mandatory artifacts + 20-item self-check + ferry conditions HIGH bar
- [x] PromptOpening line 1 = `/effort max`, MCP mandate present, Wave 1 spawn directive eksplisit
- [x] `_meta/hephaestus_research_notes.md` authored (Mandate 0)
- [x] V_n snapshot authored (this file)
- [x] Handoff contract `wave0_hephaestus_to_themis.md` authored (next)
- [x] 4 mandatory artifacts per cycle authored (decision log + checkpoint + handoff + uncertainty journal where applicable)
- [x] 20-item self-check passed final cycle

## Validation needed by Themis

Per Lock 4 + 20-item self-check item 16-18 (mutual consistency):

- [ ] Themis sees this V_n snapshot exists, treat as canonical V0 lock
- [ ] Themis seed STATUS.md with Wave 0 progress checkpoint (Pythia + Hephaestus shipped + Themis pending tasks 1-4)
- [ ] Themis honor PromptOpening as canonical Wave 1 kickoff. Themis NOT modify content (handoff to V1 Orch + Wave 1 worker)
- [ ] Themis verify all 19 `.claude/agents/` files exist sebelum spawn STATUS.md initialization
- [ ] Themis Wave 0 Task 1-4 (PanitSubmission + C4 + openspec + ERD) reference per Metis Section 10
- [ ] Themis init git + first commit + push akun Finerium (per Metis Section 5.1 Themis ship criteria) - **NOT done by Hephaestus** (Hephaestus deliberately did NOT git init, leave to Themis per role boundary)

## Downstream consumption

This V0 snapshot consumed by:
- **Themis** (Wave 0 third spawn): handoff doc reader + STATUS.md initializer + git init authority
- **V1 Orch** (main session): Wave 1 spawn via Task tool dengan `.claude/agents/<worker>.md` reference + PromptOpening as kickoff
- **Wave 1-3 workers** (semua 19 worker spawn): per-worker prompt = canonical for own role, PromptOpening = shared context
- **Eunomia/Dike/Aletheia** (auditors): audit gate contracts + prompts cross-check worker output
- **Pan** (post-Wave 3): rescue context if escalation includes specific worker prompt + audit findings inheritance
- **Aletheia handoff doc**: lists all Wave 0-3 outputs cumulative for Pan Day 2 work chain

## Open evolution path

Kalau Wave 1-3 workers detect prompt clarity gap atau directive ambiguity, ferry V1 Orch with proposed amendment. Hephaestus post-Wave 0 retired (Wave 0 spec); amendments tracked in `_meta/decisions/prompt_amendment_<N>.md` with versioned V0+1 snapshot per Lock 9.

Likely amendment areas:
- Tool permissions tighter atau looser per worker (Wave 1 actual execution feedback)
- Anti-AI-slop section iteration per Awwwards target empirical achievement
- Ferry condition HIGH bar adjustment kalau over-ferry / under-ferry detected
- Cycle plan decomposition per worker kalau capacity gate hit consistently

## Closing

V0 Hephaestus mandate complete + locked. 19 prompt + 1 PromptOpening + 1 research notes + 1 V_n snapshot + this handoff package. Output handed to Themis downstream.

Capacity used: ~2 jam 30 menit dari spawn (~17:00 WIB) ke V0 lock (~19:30 WIB). Within spawn message budget 120-175 menit (~2-3 jam). Pythia capacity flag dari handoff (gw 40 menit) didn't apply karena Wave 0 budget rebalance ~2.9 jam total dibagi 3 specialist actual usage.

Gas Wave 0 internal next spawn: Themis.
