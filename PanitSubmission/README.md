# PanitSubmission - Codeplex Chronicle

**Submission bundle for**: Refactory Hackathon Round 03, Telkom University Bandung
**Team**: Duopoly (Ghaisan Khoirul Badruzaman + Hafiz Fauzan Syafrudin)
**Event date**: 12-13 May 2026
**Submission window**: Day 2 jam 11:00-13:00 WIB
**Demo URL**: https://duopoly.hackathon.sev-2.com
**Repository**: github.com/Finerium/codeplexRefactory

## What's inside

| File | Description | Reading time |
|---|---|---|
| `README.md` | This file (curation index + reading order + submission workflow) | 2 min |
| `PRD-ideaLocked_codeplex-chronicle.md` | Canonical idea-locked product requirements (2094 line, agent-consumed detail) | 30-45 min |
| `PRD-ideaLocked_codeplex-chronicle.pdf` | Pitch-tier PRD (21 page A4, panitia-facing) | 15-20 min |
| `c4/` | Architecture diagrams 4-tier (Context + Container + Component + Code optional) Mermaid `.md` + `.svg` | 10-15 min |
| `openspec-snapshot/` | Read-only mirror of `openspec/` Folder A (project.md ~250 line + 5 domain spec seeds) | 10-15 min |
| `erd/` | Database schema ERD Mermaid `.md` + `.svg` (PostgreSQL event store + materialized views) | 5-10 min |

## Recommended reading order

For Refactory judge reviewing submission:

1. **README.md** (this file) - get oriented on submission package contents (2 min)
2. **PRD-ideaLocked .pdf** - pitch-tier overview (15-20 min)
   - Read Section 1 Identity (1 min)
   - Read Section 2 Executive Summary (3 min)
   - Read Section 7 Scope (4 min)
   - Read Section 15 Demo Flow (4 min)
   - Skim Section 17 Tech Stack + Section 23 Risk Register + Section 24 Constraints (3 min)
3. **c4/C4-Context.svg** - high-level system context diagram (2 min)
4. **c4/C4-Container.svg** - container-level architecture (3 min)
5. **erd/ERD.svg** - database schema overview (3 min)
6. **openspec-snapshot/project.md** - project context for OpenSpec (5 min)
7. **Demo URL** at https://duopoly.hackathon.sev-2.com - live deployment (5-10 min interactive)
8. **PRD-ideaLocked .md** (agent-consumed full detail, 30-45 min) - only if judge needs deeper technical reference

## Submission workflow

### Day 2 jam 11:00 (T-2 hours from submission deadline)

1. Pan worker runs final smoke test 3x consecutive on https://duopoly.hackathon.sev-2.com
2. Pan worker authors slide deck prompt template `slides/codeplex-chronicle-pitch-template.md`
3. Hafiz consumes prompt template + finalizes slide deck manually (operator role)

### Day 2 jam 11:30-12:30

1. Aletheia Wave 3 final audit pass verification (PanitSubmission/ curation review)
2. Ghaisan zip PanitSubmission/ folder:
   ```bash
   cd ~/Documents/codeplexRefactory
   zip -r PanitSubmission-codeplex-chronicle.zip PanitSubmission/
   ```
3. Upload zip + slide deck + repository link to Refactory submission portal

### Day 2 jam 13:00 (submission deadline)

Hard cutoff per Refactory rule. Late submission = withdrawal per RefactoryHackathonRules&FAQ.txt.

### Day 2 jam 15:00-17:00 (pitch window if top 5)

If top 5 selected:
- Hafiz physically attends pitch presentation (MANDATORY per Refactory rule: absence = withdrawal)
- Ghaisan remote support OK
- 2-min demo flow walkthrough (per PRD Section 15)
- Q&A defense 10 questions (per PRD Section 16)

## Authoring credit

This submission bundle authored by:
- **Tim Duopoly** (Ghaisan + Hafiz, operator role 3: relay handoff + decision approval + ferry knowledge)
- **V1 Orchestrator + Council + Designer + Metis + 22-agent worker fleet** (Codeplex Chronicle workflow system, Greek mythology naming)
- **Themis Wave 0** (this submission bundle curation, project-local setup smith)

Workflow chain reference: `_meta/metis/Agentic_Structure-codeplex-chronicle.md` (Refactory Round 03 specific agentic structure).

## Deliverable mapping per PRD Section 7.1

| Deliverable | Status | Path in submission |
|---|---|---|
| PRD .md (agent-consumed) | ship | `PanitSubmission/PRD-ideaLocked_codeplex-chronicle.md` |
| PRD .pdf (panitia pitch) | ship | `PanitSubmission/PRD-ideaLocked_codeplex-chronicle.pdf` |
| C4 diagram 4-tier formal | ship | `PanitSubmission/c4/C4-{Context,Container,Component,Code}.{md,svg}` (Code tier optional) |
| ERD | ship | `PanitSubmission/erd/ERD.{md,svg}` |
| OpenSpec snapshot | ship | `PanitSubmission/openspec-snapshot/` (project.md + 5 domain spec seeds) |
| Repository link | ship | github.com/Finerium/codeplexRefactory (external) |
| Demo URL live | ship | https://duopoly.hackathon.sev-2.com (Wave 3 Atlas K8s deploy) |
| Slide presentation | pending Day 2 | `slides/` (Hafiz finalize) |

## Demo flow summary (per PRD Section 15)

**Total**: 2 minutes (per Refactory rule, no recovery mid-run)

| Step | Mode | Duration | Highlights |
|---|---|---|---|
| 1 | Opening hook | 15 sec | Tagline + 3D city zoom-in + 5 mode preview tease |
| 2 | Onboarding | 25 sec | Camera fly + Hermes narration + mental map established |
| 3 | Sprint Mode HERO | 45 sec | 14 PM concept overlay + click building to ticket panel + PR-to-Building sync |
| 4 | Refactor Mode | 30 sec | Ghost building + drafts/ simulation + dual review gate + Accept |
| 5 | Health Mode | 25 sec | Apollo finding glow + 1-click ticket creation Hybrid Layer 1 |
| 6 | Closing punchline | 10 sec | "AI explores in drafts, you commit to production" |

## Q&A defense readiness

Per PRD Section 16, 10 anticipated questions answered with evidence chain (drafts/ isolation property, 5 spec-drift patterns deterministic, cost tracking transparent, fallback degradation, OAuth scope minimal, etc.).

## Technical innovation highlights

1. **Dual-folder OpenSpec strategy** (LOCKED PRD D27): Folder A panitia-facing + Folder B internal workflow. Novel Phase B Topic 3c finding.
2. **5 AI resident persona routing** via DeepSeek V4 (PRD Section 18.3): per-resident model + thinking-mode toggle. Cost-aware.
3. **drafts/ isolation safety property** (AD-19 LOCKED): production code never touched by simulation engine. Defensible at pitch Q&A.
4. **5 spec-drift detector patterns A-E**: deterministic AST-diff, NOT LLM-only. Reliability bar.
5. **22-agent workflow** with per-wave audit gates (Eunomia + Dike + Aletheia + Pan): zero silent failure.
6. **Visual-first sequencing** Wave 1+2 = 52% capacity: visual quality bar non-negotiable, difficult to revise late.

## Open evolution path

Post-hackathon, this submission bundle is read-only per Lock 9 V_n. Future versions create `PanitSubmission-v2/` or similar.

If Refactory judge requests amendment during pitch Q&A:
- Document amendment in `_meta/decisions/panit_submission_amendment_<N>.md`
- Create patched `PanitSubmission_v2.zip`
- Original kept for audit trail

---

**Bundle authored by**: Themis Wave 0 (project-local setup smith)
**Locked at**: 2026-05-12 16:50 WIB (Themis Cycle 4)
**Final curation review**: Aletheia Wave 3 (per `_meta/contracts/aletheia-wave3-audit.md`)
