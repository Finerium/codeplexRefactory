# Handoff: Hephaestus to Themis (Wave 0 internal sequence)

**Date**: 2026-05-12 19:30 WIB
**Producer**: Hephaestus (Wave 0 worker prompt + auditor prompt + PromptOpening author)
**Consumer**: Themis (Wave 0 project-local setup + C4 + openspec enrichment + ERD + PanitSubmission curation + STATUS.md + git init)

## Output produced

### 19 prompt files di `.claude/agents/`

Wave 1 builders + auditor (6 file):
- `daedalus.md` (xhigh, 3D scene scaffold Three.js + r3f Canvas + post-pipeline)
- `iris.md` (xhigh, InstancedMesh 5 archetype + treemap + ownership)
- `calliope.md` (high, Landing page Designer Prompt 1 bundle)
- `hestia.md` (medium, Entry page Designer Prompt 2 bundle)
- `selene.md` (high, Dashboard Designer Prompt 3 bundle + OQ-02)
- `eunomia.md` (max, Wave 1 audit gate)

Wave 2 visual + auditor (5 file):
- `hera.md` (xhigh, Sprint Mode HERO 14 PM concept + OQ-05)
- `asclepius.md` (high, Health glow + Refactor ghost)
- `boreas.md` (high, Onboarding camera fly + Activity timeline + 4 tour variant)
- `persephone.md` (high, panels + OQ-03)
- `dike.md` (max, Wave 2 audit gate)

Wave 3 backend + auditor (7 file):
- `hades.md` (xhigh, FastAPI + tree-sitter + OAuth + webhook + WebSocket)
- `triton.md` (xhigh, DeepSeek client + defensive + per-resident routing)
- `nemesis.md` (xhigh, 5 Apollo + Argus + 5 spec-drift)
- `pandora.md` (xhigh, Athena proposal + simulation + drafts/)
- `demeter.md` (high, Postgres + cache + 1-click + OpenSpec runtime)
- `atlas.md` (xhigh, Docker + K8s + deploy + smoke test)
- `aletheia.md` (max, Wave 3 final audit + handoff doc + PanitSubmission curation)

Universal worker (1 file):
- `pan.md` (max, demo rehearsal + slide deck + bug sweep + polish + rescue + lesson-learned)

### 1 PromptOpening file di project root

- `PromptOpening-codeplex-chronicle.md` (~230 line, dual purpose Wave 1 kickoff + shared system header H6 cache-hit)

### Self-management artifacts

- `_meta/hephaestus_research_notes.md` (Mandate 0 output, ~280 line, 7 finding + 10 pattern adopted + 8 pattern rejected + 4 open question)
- `_meta/decision_log/hephaestus.md` (append-only decision log)
- `_meta/checkpoints/hephaestus-cycle{1..6}.md` (cycle checkpoint)
- `_meta/orchestration_log/V0_hephaestus_prompts_locked_20260512-1930.md` (V_n snapshot)
- This file: `_meta/handoff_log/wave0_hephaestus_to_themis.md`

## Asumption baked (Hephaestus to Themis)

1. **Themis owns project-local setup** per Metis Section 10 delegation: PanitSubmission seeding + C4 diagram + OpenSpec enrichment + ERD + STATUS.md init + git init + first commit + push akun Finerium. Hephaestus deliberately did NOT touch any of these per role boundary.
2. **PromptOpening canonical**: Themis treat `PromptOpening-codeplex-chronicle.md` as canonical Wave 1 kickoff. NOT modify content. Workers consume PromptOpening via Read tool atau V1 Orch turn-by-turn context propagation.
3. **`.claude/agents/` directory immutable post-V0 lock**: Themis NOT modify prompt files. Amendment V0+1 = new file in `_meta/decisions/prompt_amendment_<N>.md`.
4. **Worker prompts assume MCP available**: Themis verify MCP server setup (superpowers, Context7, Playwright) sebelum Wave 1 spawn. Kalau gap, ferry V1 Orch.
5. **5 resident persona prompts baked di PromptOpening**: NOT separate `.claude/agents/<resident>.md` (residents runtime, not build-time).
6. **19 prompt count locked**: Pythia handoff "16 prompt" was Metis errata (5+4+6 = 15 worker, NOT 12). Actual 19 = 15 worker + 3 auditor + 1 Pan.

## Known limitations + open items for Themis

### Limitations Hephaestus leaves for Themis to handle

1. **CLAUDE.md / AGENTS.md decision**: Claude Code auto-loads CLAUDE.md but NOT PromptOpening. Themis decide whether to:
   - (a) Create `CLAUDE.md` aliased to PromptOpening content
   - (b) Leave PromptOpening separate + Workers Read tool reference
   - (c) Create `AGENTS.md` (alternate convention)
   Recommendation: option (a) `CLAUDE.md` aliased karena Claude Code auto-load. PromptOpening kept as standalone file untuk Ghaisan paste ke terminal di Wave 1 spawn directive (V1 Orch initial prompt). Themis decide.
2. **GitHub OAuth app creation**: Themis Wave 0 task creates OAuth app di akun Finerium + populate GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET + GITHUB_WEBHOOK_SECRET ke `.env`. Per Metis Section 5.1 Themis ship criteria. **NOT done by Hephaestus**.
3. **Project-local `.claude/skills/` content**: Themis seed anti-pattern locks skill + codeplex-chronicle-conventions skill kalau Claude Code skill mechanism dipakai. Worker prompts reference these skills as "auto-load" but Themis verify actual auto-load path.
4. **C4 diagram authoring**: Themis Wave 0 Task 2 priority 1. Mermaid as default tooling (OQ-10 Metis recommendation). Reference Metis Section 10 Task 2.
5. **OpenSpec enrichment**: Themis Wave 0 Task 3 priority 2. `openspec/project.md` 30-line seed → 250-line panitia-grade. 5 domain spec seeds di `openspec/specs/{onboarding,sprint,refactor,activity,health}/spec.md`. Folder B `.agent-openspec/` parallel init. Per Metis Section 10 Task 3.
6. **ERD generation**: Themis Wave 0 Task 4 priority 3. Mermaid erDiagram covering 8 Postgres tables + 3 materialized views. Per Metis Section 10 Task 4.
7. **PanitSubmission folder seeding**: Themis Wave 0 Task 1. README curation index + PRD copies + C4 mirror + openspec snapshot + ERD mirror. Per Metis Section 10 Task 1.
8. **STATUS.md initialization**: Themis Wave 0 final task. Snapshot Wave 0 progress + Wave 1 pending state.

### Open questions Themis may need to resolve

1. **Skill mechanism vs Read tool**: kalau Claude Code skill auto-load mekanisme available via `.claude/skills/anti-pattern-locks/SKILL.md`, Themis seed itu. Kalau not, worker prompts reference anti-pattern locks via inline list (sudah ada di prompt body Section 4).
2. **OQ-04 CI/CD decision**: Metis recommendation manual kubectl + `scripts/deploy.sh` (Atlas Wave 3 ownership). Themis ga decide ini (Wave 3 Atlas authority).
3. **PromptOpening live update**: kalau Wave 1 spawn hits ferry case (e.g., Designer bundle delay), PromptOpening content may need amendment. V_n+1 snapshot Themis OR V1 Orch decide kalau happen.

## Validation done by Hephaestus

Per 20-item self-check protocol (final cycle):

**Output completeness (5)**:
1. 19 file `.claude/agents/<worker>.md` authored ✓
2. PromptOpening file authored ✓
3. Effort tier per worker match Metis Section 3 ✓
4. Anti-AI-slop section di 9 visual worker ✓
5. Decision log + checkpoints + handoff (this) + V_n snapshot authored ✓

**Anti-pattern compliance (10)**:
6-15. No em dash + no emoji verified file scan ✓
16. Greek naming compliant (anti-collision matrix honored) ✓
17. drafts/ isolation safety guard di Pandora Item 17 self-check critical ✓
18. Per-wave auditor mandate honored ✓

**Contract integrity (3)**:
- Worker prompts reference Pythia contract path correctly per file ✓
- Effort tier YAML match Metis Section 3 column 5 ✓
- Anti-AI-slop section present di 9 visual worker ✓

**Capacity + meta (2)**:
- Frustration check: not stuck > 1 jam any cycle ✓
- Context capacity managed via cycle-by-cycle decomposition (3 cycle Wave 3 split per worker pair to avoid > 70% context fill) ✓

## Validation needed by Themis

Per Lock 4 + 20-item self-check item 16-18 (mutual consistency):

- [ ] Themis verify all 19 `.claude/agents/` files exist + readable + YAML frontmatter parses
- [ ] Themis verify PromptOpening line 1 = `/effort max` + line 2-3 MCP mandate
- [ ] Themis decide CLAUDE.md vs PromptOpening standalone (recommendation: alias CLAUDE.md to PromptOpening content)
- [ ] Themis verify V_n snapshot locked, NOT continuous edit V0
- [ ] Themis honor 4 Task priority ordering (PanitSubmission → C4 → OpenSpec → ERD) per Metis Section 10
- [ ] Themis init git + first commit + push akun Finerium (per Metis Section 5.1 ship criteria)
- [ ] Themis populate GitHub OAuth app credentials ke `.env` (CLIENT_ID + SECRET + WEBHOOK_SECRET)
- [ ] Themis seed STATUS.md with Wave 0 progress checkpoint + Wave 1 pending

## Open questions for Themis

1. **CLAUDE.md authoring**: Themis decide convention atau leave Hephaestus pattern (PromptOpening standalone + worker Read tool). Recommendation lihat di Limitations Section above.
2. **OpenSpec dual-folder init mechanics**: Two `openspec init` runs both core profile, distinct `--tools` per folder per Phase B Topic 3c anchor. Folder A panitia + Folder B internal. Themis Wave 0 Task 3 verify both folder validate clean post-init.
3. **PanitSubmission max artifact count**: Metis Section 10 Task 1 says "max 15-20 files total reasonable sizes". Themis seed initial 4-5 file (README + PRD copy + C4 dir + openspec snapshot dir + ERD dir), Wave 1-3 workers may add more (capped). Aletheia Wave 3 final review verifies all required artifacts.

## Capacity context

Hephaestus used approximately 2h 30min from spawn (17:00 WIB post Pythia handoff) to V0 lock (19:30 WIB).

Themis capacity per Wave 0 12% allocation = ~2.9h total Wave 0 budget. Pythia used ~2.25h, Hephaestus used ~2.5h. Themis remaining budget ~0.5-1h kalau strict 12% allocation, OR Themis extends Wave 0 wall-clock past 20:00 WIB cutoff (ferry V1 Orch kalau happen).

**Capacity flag for Themis**: 6 tasks (PanitSubmission + C4 + OpenSpec + ERD + STATUS.md + git init/push) within 1-2h is tight. Suggest Themis:
- (a) Author template + brief content per task, defer enrichment ke Wave 1-3 incremental population
- (b) Prioritize C4 + OpenSpec (Task 2 + 3 priority per Ghaisan directive)
- (c) Defer ERD (Task 4 priority 3) ke Demeter Wave 3 schema final consolidation
- (d) Defer PanitSubmission curation review ke Aletheia Wave 3 final pass

## Ferry items (none from Hephaestus)

No outstanding ferry items. No escalation requests. No critical blocks.

Kalau Themis encounter prompt clarity gap during execution, ferry V1 Orch with specific worker prompt + gap. Do NOT silently amend Hephaestus output (V_n locked per Lock 9; amendments require V<n+1> snapshot via decision log).

## Closing

Hephaestus full mandate complete + locked V0. Output handed to Themis downstream.

Gas Wave 0 internal next spawn: Themis.
