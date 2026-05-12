---
description: Lock critical artifact as V_n snapshot per Lock 9, post-major-milestone snapshot integrity rule
argument-hint: <artifact-name>
---

# /v-snapshot

Lock a critical artifact as V_n snapshot per Lock 9 (V_n locked snapshot per major milestone). Use this command at the end of a major milestone to freeze the artifact state for audit trail.

## When to invoke

- End of wave (post-auditor PASS)
- End of cycle that produces critical output (e.g., locked spec, final design, audit clearance)
- Post-Council session lock (PRD locked)
- Post-Metis md lock (agentic blueprint locked)
- Post-Pythia output lock (contracts locked)
- Post-Hephaestus output lock (worker prompts locked)
- Post-Themis output lock (project-local setup + delegation locked)
- Per-wave end (Wave 1 Eunomia PASS, Wave 2 Dike PASS, Wave 3 Aletheia PASS)

## File output

`_meta/orchestration_log/V<n>_<artifact_name>_locked_<YYYYMMDD-HHMM>.md`

## Naming convention

- `V0_` prefix for Wave 0 outputs
- `V1_` prefix for Wave 1 outputs
- `V2_` prefix for Wave 2 outputs
- `V3_` prefix for Wave 3 outputs
- `Vpost3_` prefix for Pan post-Wave 3 outputs
- `<artifact_name>` snake_case identifier (e.g., `pythia_contracts`, `hephaestus_prompts`, `themis_setup`)
- `<YYYYMMDD-HHMM>` timestamp in WIB

Example: `V0_themis_setup_locked_20260512-1900.md`

## Template

```markdown
# V<n> <Artifact Name> Locked

**Wave**: <0|1|2|3|Pan>
**Artifact**: <descriptive title>
**Authored by**: <worker name>
**Locked at**: <YYYY-MM-DD HH:MM WIB>
**Status**: locked (no continuous edit; amendments require V<n+1>)

---

## Output summary

| File | Path | Status | Line count |
|---|---|---|---|
| <file 1> | <path> | shipped | <count> |
| <file 2> | <path> | shipped | <count> |

## Ship criteria verification

- [x] Ship criterion 1 (evidence)
- [x] Ship criterion 2 (evidence)
...

## Anti-pattern compliance (20-item self-check)

| # | Item | Status |
|---|------|--------|
| 1 | Decision log appended | OK |
| 2 | Uncertainty journal authored | OK |
| ... | ... | ... |
| 20 | Meta-cognitive check passed | OK |

## Downstream consumption

- <consumer worker 1>: reads <output file> at <when>
- <consumer worker 2>: reads <output file> at <when>

## Amendment path (if needed)

If post-lock amendment required:
1. Ferry V1 Orch with proposed amendment
2. V1 Orch authors `_meta/decisions/<artifact>_amendment_<N>.md`
3. Original `V<n>_<artifact>_locked_*.md` kept per Lock 9 V_n rule
4. V<n+1> snapshot created with amendment integrated

---

**End of V<n> snapshot**.
```

## Anti-pattern (avoid)

- DO NOT edit `V<n>_*_locked_*.md` post-lock (Lock 9 violation)
- DO NOT skip V_n snapshot when major milestone reached
- DO NOT batch multiple unrelated artifacts into one snapshot (one milestone = one snapshot file)
- DO NOT forget timestamp suffix (collision risk if two artifacts share name within same wave)

## Cross-references

- Lock 9: `.claude/skills/anti-pattern-locks/SKILL.md`
- 20-item self-check: same skill file
- Audit gate: `.claude/skills/anti-pattern-locks/SKILL.md` Lock 10

---

**Source authority**: V1 Orch spawn directive Lock 9 V_n locked snapshot rule
