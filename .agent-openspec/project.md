# Codeplex Chronicle - Internal Workflow Agent Context (Folder B)

**Audience**: Workflow agent itself (Athena proposal author + Pandora simulation engine + Aletheia audit). NOT panitia-facing.

**Companion to**: `openspec/project.md` (Folder A panitia-facing primary spec)

**Purpose**: Internal workflow agent scope: AI resident behavior patterns + memory model + cycle execution patterns + V_n locking discipline. This context is consumed by build-time agents only.

## Project identity (internal)

- **Workflow chain**: Council (PRD authoring) → Metis (Agentic Structure md) → Designer (3 claude.ai/design prompts) → Orches Wave 0 (Pythia + Hephaestus + Themis) → Wave 1-3 workers → Pan post-Wave 3
- **Agent fleet**: 22 agents (3 Wave 0 + 5 Wave 1 + 1 Wave 1 auditor + 4 Wave 2 + 1 Wave 2 auditor + 6 Wave 3 + 1 Wave 3 auditor + 1 universal Pan)
- **Runtime residents** (separate from build-time workers): Athena, Apollo, Argus, Clio, Hermes (5 personas living in landmark buildings)

## Internal workflow conventions

### 4 mandatory artifacts per worker per cycle

1. **Decision log** (append-only): `_meta/decision_log/<worker>.md`
2. **Uncertainty journal** (medium-confidence concerns): `_meta/uncertainty/<worker>-cycle<N>-<timestamp>.md`
3. **Checkpoint** (per cycle stop): `_meta/checkpoints/<worker>-cycle<N>.md`
4. **Handoff contract** (per handoff): `_meta/handoff_log/wave<N>_<from>_to_<to>.md`

### 10 anti-pattern hard locks

See `.claude/skills/anti-pattern-locks/SKILL.md`. Summary:
- Lock 1: no em dash
- Lock 2: no emoji
- Lock 3: no silent scope narrow
- Lock 4: no silent assume
- Lock 5: mock/placeholder labeling honest claim
- Lock 6: capacity respect (frustration > 1 hour = stop)
- Lock 7: Greek mythology naming convention
- Lock 8: no paid services without Ghaisan approval
- Lock 9: V_n locked snapshot per major milestone
- Lock 10: per-wave auditor mandatory

### Ferry conditions HIGH bar (5 trigger)

1. Critical block (semua direction blocked + > 30 menit debug fail)
2. Contract conflict (Pythia contracts incompatible)
3. Anti-pattern violation directive
4. Decision lewat scope (domain decision exceeds worker authority)
5. Downstream cascade risk (blast radius > 1 worker)

### Confidence-based action

- High (85%+): proceed normal, decision log entry sufficient
- Medium (60-85%): mandatory uncertainty journal + proceed conservative
- Low (<60%): ferry V1 Orch if 5 HIGH bar trigger hit, else uncertainty journal + proceed conservative

## AI resident persona patterns (internal LLM client behavior)

| Resident | Model + thinking mode | Voice | Use case |
|---|---|---|---|
| Athena | V4-Pro thinking high | Thoughtful Indonesian + English technical code-switch | Refactor proposal author, multi-turn simulation engine |
| Apollo | V4-Flash non-thinking | Warm clinical | Health finding narration |
| Argus | V4-Flash thinking low | Watchful concise | Security CVSS scoring + exploit pattern + suggested mitigation |
| Clio | V4-Flash non-thinking | Factual elegant | Git history + spec-drift narration A-E |
| Hermes | V4-Flash non-thinking | Warm welcoming bilingual | Onboarding tour narration + navigation guidance |

## DeepSeek V4 client quirks (CRITICAL anti-patterns)

1. **NEVER replay `reasoning_content` from prior turns** (DeepSeek API ignores, pollutes context). Multi-turn passes only `content` field.
2. **Legacy alias `deepseek-chat` / `deepseek-reasoner` DEPRECATED 2026-07-24**. Use explicit `deepseek-v4-flash` / `deepseek-v4-pro`.
3. **Shared 3000-token system header H6 cache-hit 98% discount**. Workers reuse `PromptOpening-codeplex-chronicle.md` content as session header.
4. **Defensive layer mandatory**:
   - Semantic cache cosine 0.85 threshold
   - Canned response pre-cache top-10 demo questions (< 100ms latency)
   - Retry with simplified prompt on 429
   - Fallback V4-Pro → V4-Flash on 500 / timeout
   - Circuit breaker 5-fail trigger + 60s cooldown

## drafts/ isolation (AD-19 LOCKED safety property)

- Production code NEVER modified by simulation engine
- All Refactor Mode output writes to `drafts/<simulation-id>/` ONLY
- Pitch defensibility: "AI explores in drafts, you commit to production" (per PRD D8)
- Aletheia Wave 3 final audit verifies via static check + integration test

## OpenSpec dual-folder discipline

- **Folder A `openspec/`** (panitia-facing primary): panitia + Refactory judge reads this. Source of truth for product spec + change proposals.
- **Folder B `.agent-openspec/`** (this folder, internal workflow agent): build-time agent internal workflow output. NOT panitia-facing.

### Folder B content scope (this folder)

- Agent persona refinement (internal change proposals)
- Workflow protocol updates (e.g., new ferry trigger condition)
- Decision log archival (post-Wave V_n lock)
- Audit checklist refinement (Eunomia / Dike / Aletheia methodology)
- Worker prompt amendments (V_n+1 cycles)

Both folders independent `openspec validate` clean.

## V_n locking discipline

Per Lock 9, critical artifact snapshots:

- `_meta/orchestration_log/V<n>_<artifact>_locked_<YYYYMMDD-HHMM>.md`
- After locked, continuous edit illegal
- Amendments require new V<n+1> snapshot

Existing V_n locks:
- `V0_pythia_contracts_locked_20260512-1700.md` (33 contracts + 2 index files)
- `V0_hephaestus_prompts_locked_20260512-1930.md` (19 worker prompts + PromptOpening)
- `V0_themis_setup_locked_<pending>.md` (this session, Cycle 8 produces)

## Cross-references

- `openspec/project.md` (Folder A panitia primary, ~250 line panitia-grade)
- `CLAUDE.md` (Claude Code auto-load project context)
- `_meta/metis/Agentic_Structure-codeplex-chronicle.md` (worker + wave + DAG blueprint)
- `_meta/contracts/_master_index.md` (33 contracts authored by Pythia Wave 0)
- `_meta/roster.md` (22-agent roster translated from Metis Section 3)
- `_meta/wave_layout.md` (wave allocation + auditor gates translated from Metis Section 4)
- `_meta/task_graph.md` (DAG translated from Metis Section 2)

---

**Internal workflow context last updated**: 2026-05-12 by Themis Wave 0 (Cycle 6 OpenSpec dual-folder init)
**Folder B scope**: internal workflow agent only. NOT panitia-facing. Build-time agent consumes this for cycle execution.
