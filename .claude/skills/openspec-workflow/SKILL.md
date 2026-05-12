---
name: openspec-workflow
description: OpenSpec dual-folder cycle pattern for Codeplex Chronicle. Auto-load when authoring or modifying spec content, OpenSpec changes, or doing OpenSpec validation. Covers Folder A panitia-facing primary plus Folder B internal workflow agent dual-folder strategy, propose to apply to archive cycle, ferry conditions, and Refactory rule compliance.
---

# OpenSpec Workflow

OpenSpec is mandatory per Refactory Hackathon rule. Codeplex Chronicle uses **dual-folder strategy** (LOCKED PRD D27) to satisfy both panitia-facing spec quality and internal workflow agent operation.

## Folder layout

### Folder A: `openspec/` (panitia-facing primary)

Audience: Refactory judges + panitia technical review post-hackathon.

Purpose: documents product spec, change proposals, and accepted changes. This is what reviewers read to understand the system design.

Layout:
```
openspec/
  project.md                 # ~250 line project context (Themis Wave 0 enriches from 30 line seed)
  specs/
    onboarding/spec.md       # Onboarding Mode requirements
    sprint/spec.md           # Sprint Mode HERO requirements
    refactor/spec.md         # Refactor Mode SAFETY-FIRST requirements
    activity/spec.md         # Activity Mode requirements
    health/spec.md           # Health Mode requirements
  changes/
    <change-name>/
      proposal.md            # Why + what + scope
      design.md              # Technical approach + trade-offs
      tasks.md               # Implementation checklist
  archive/
    <change-name>/           # Accepted + applied changes, kept for audit trail
```

### Folder B: `.agent-openspec/` (internal workflow)

Audience: workflow agent itself (Athena proposal author + Pandora simulation engine + Aletheia audit).

Purpose: internal workflow agent scope: AI resident behavior patterns + memory model + cycle execution patterns. NOT panitia-facing.

Layout:
```
.agent-openspec/
  project.md                 # ~80 line internal workflow context
  specs/
    (worker authored per cycle as needed)
  changes/
    (internal change proposals, e.g., resident persona refinement)
  archive/
    (accepted internal changes)
```

## Standard cycle

### Step 1: Propose

```bash
cd ~/Documents/codeplexRefactory
openspec propose <change-name>
# This creates openspec/changes/<change-name>/{proposal.md, design.md, tasks.md} skeleton
```

OR via the slash command equivalent in Athena proposal author (Pandora Wave 3):
- Athena V4-Pro think high auto-generates 3 files in `openspec/changes/<change-name>/`

### Step 2: Self-review

Worker reviews own proposal:
- proposal.md scope clear + non-goals listed
- design.md technical approach + alternative considered + trade-off documented
- tasks.md actionable steps + dependencies listed

Ferry condition: if proposal cannot align without external decision, escalate to V1 Orch.

### Step 3: Validate

```bash
openspec validate <change-name>
# Or validate everything:
openspec validate
```

Both Folder A and Folder B must pass clean (no warning, no error).

### Step 4: Apply

```bash
openspec apply <change-name>
# Or via Pandora dual review gate UI (user clicks Accept)
```

Apply commits the change. Implementation work follows tasks.md checklist.

### Step 5: Archive

```bash
openspec archive <change-name>
# Or user clicks Accept in Pandora dual review gate UI
```

Archive moves `openspec/changes/<change-name>/` to `openspec/archive/<change-name>/` for audit trail. Original kept per Lock 9 V_n.

## Refactory rule compliance

Per PRD Section 24.1 + RefactoryHackathonRules&FAQ.txt:
- OpenSpec mandatory per Refactory rule. Folder A satisfies this.
- Folder B is NOT mentioned by Refactory; it is internal workflow agent layer authored per Phase B Topic B best practice.
- `openspec/project.md` enriched ~250 line is panitia-grade quality per OpenSpec hackathon best practice (Phase B Topic 3c anchor).

## Anti-pattern (avoid)

### Mixing Folder A + B content

NEVER write internal workflow spec (e.g., Athena persona refinement) into `openspec/`. NEVER write panitia-facing spec (e.g., Sprint Mode functional requirements) into `.agent-openspec/`. These two folders have distinct audiences.

If a spec genuinely spans both, write Folder A primary + add cross-reference comment in Folder B (or vice versa). Do not duplicate content.

### Skipping validate

NEVER commit without `openspec validate` passing clean. Auditors (Eunomia / Dike / Aletheia) verify validate output as audit gate.

### Mid-cycle edit to archived change

NEVER edit `openspec/archive/<change-name>/`. Archive is immutable per Lock 9 V_n. If a previously-archived change needs amendment, create new change `<old-name>_v2` and reference original via design.md.

### Forgetting to archive accepted change

After user clicks Accept in Pandora dual review gate, worker must explicitly run `openspec archive <change-name>` (or auto-archive via Pandora hook). Leaving accepted change in `openspec/changes/` causes Aletheia audit drift.

## Ferry conditions

Ferry V1 Orch if:
1. Proposal cannot align without external decision (e.g., conflicting stakeholder direction)
2. `openspec validate` fails with structural error that worker cannot resolve in < 10 min
3. Both folders out of sync after migration (e.g., spec moved Folder A to B but worker unsure)
4. Refactory rule interpretation ambiguous (e.g., what counts as "completed OpenSpec change" for submission)

## Pandora Wave 3 generator pattern

Pandora Wave 3 auto-generates OpenSpec change folder from user intent:

```
User input: "implement 2FA in auth district"
   |
   v
Athena V4-Pro think high analyzes + creates proposal.md + design.md + tasks.md in openspec/changes/auth-2fa/
   |
   v
Pandora simulation engine multi-turn:
   Turn 1 (V4-Pro think high): generate failing tests
   Turn 2 (V4-Pro think high): generate impl code to make tests pass
   Turn 3 (V4-Flash non-think): serialize unified diff format
   |
   v
Writes drafts/<simulation-id>/ ONLY (production NEVER touched per AD-19)
   |
   v
Asclepius ghost-to-solid animation visual frontend
   |
   v
User Accept / Discard at dual review gate
   |
   v on Accept:
Pandora hook runs openspec archive <change-name>
```

## GitHub Issue fallback (progressive degradation)

If target repo has NO `openspec/` folder:
1. Pandora detects absence via `os.path.exists('openspec/')` check
2. Falls back to creating GitHub Issue with proposal content
3. Issue body includes: proposal + design + tasks markdown sections
4. Suggested label `refactor-proposal`
5. User can convert to PR manually post-issue creation

This satisfies "progressive degradation OpenSpec default, GitHub Issues fallback" principle per PRD Section 11.

## Authoritative source

- OpenSpec docs: https://github.com/Fission-AI/OpenSpec
- Codeplex Chronicle Folder A: `openspec/` (Themis Wave 0 enrichment + 5 domain spec seeds + Pandora Wave 3 runtime)
- Codeplex Chronicle Folder B: `.agent-openspec/` (Themis Wave 0 init + per-cycle worker authored)
- PRD D27 dual-folder strategy lock: `docs/prd/PRD-ideaLocked_codeplex-chronicle.md` Section 28 Decision Log
- Phase B Topic B research: `_meta/metis/compass_artifact_wf-96c21fb3-d652-4554-a319-b2c1cfc595e5_text_markdown.md`

---

**Workflow last updated**: 2026-05-12 16:40 WIB by Themis Wave 0
