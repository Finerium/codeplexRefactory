---
description: Spawn auditor checklist run for wave-end gate compliance per Lock 10
argument-hint: <wave-N>
---

# /audit

Spawn the wave-end auditor checklist run. Per Lock 10 (Per-wave auditor mandatory), each wave must clear an audit gate before the next wave spawns.

## Auditor per wave

- **Wave 1 → Eunomia** (`.claude/agents/eunomia.md`): r3f 60fps + 3 page mount + openspec validate + contract conformance + Lighthouse 90+ + console clean
- **Wave 2 → Dike** (`.claude/agents/dike.md`): 5 modes visual + 14 PM overlay + PR comment non-overlap + panels render + Lighthouse 85+ + WCAG AA
- **Wave 3 → Aletheia** (`.claude/agents/aletheia.md`): deploy live + 5 modes E2E real backend + 3x consecutive demo flow + OAuth + webhook + DeepSeek routing + cache hit + Lighthouse + PanitSubmission curation
- **Post-Wave 3 → Pan handoff** (`.claude/agents/pan.md`): demo rehearsal 3x + slide deck prompt + bug sweep + polish + rescue

## When to invoke

- End of wave (all wave workers ship criteria met per their checkpoints)
- V1 Orch dispatch via Task tool with `subagent_type=<auditor-name>`

## Audit flow

```
V1 Orch dispatches Task({ subagent_type: "eunomia", description: "Wave 1 audit", prompt: "<reference .claude/agents/eunomia.md>" })
   |
   v
Auditor runs checklist per .claude/agents/<auditor>.md (auditor reads own prompt)
   |
   v
Auditor outputs binary PASS|FAIL + findings list + ferry context if FAIL
   |
   v
File: _meta/audit/<auditor>_wave<N>_audit.md
   |
   v
V1 Orch reads audit output:
   - PASS: spawn next-wave workers
   - FAIL critical: ferry V1 Orch / Ghaisan-Hafiz for drop protocol decision
   - FAIL minor: re-spawn failed worker with correction directive
```

## Audit output file template

```markdown
# Wave <N> Audit by <Auditor>

**Wave**: <N>
**Auditor**: <name>
**Date**: <YYYY-MM-DD HH:MM WIB>
**Verdict**: PASS|FAIL

---

## Checklist

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | <criterion 1> | PASS|FAIL | <test output or file path> |
| 2 | <criterion 2> | PASS|FAIL | <evidence> |
...

## Findings (FAIL items only)

### F1: <finding title>

**Severity**: critical|high|medium|low
**Worker affected**: <worker name>
**Description**: <what failed>
**Evidence**: <test output or screenshot path>
**Proposed remediation**: <action + responsible worker + budget>

### F2: <finding title>

<repeat>

## Pan escalation context (FAIL only)

If FAIL critical:
- Drop protocol option: <Layer 1|Layer 2|feature flag>
- Re-spawn worker option: <worker + correction directive>
- Capacity impact: <minutes>

## V1 Orch decision

- [ ] PASS: spawn Wave <N+1>
- [ ] FAIL re-spawn: <worker> with <correction>
- [ ] FAIL drop: activate <drop protocol level>
- [ ] Ferry Ghaisan-Hafiz: <reason>

---

**End of `_meta/audit/<auditor>_wave<N>_audit.md`**.
```

## Anti-pattern (avoid)

- DO NOT skip audit gate (Lock 10 mandatory)
- DO NOT proceed Wave N+1 without auditor PASS
- DO NOT amend audit output post-lock (re-run audit if findings outdated)
- DO NOT batch audits across waves (per-wave one audit gate)
- DO NOT let auditor self-deploy (audit is read-only verification, NOT remediation; remediation is worker re-spawn)

## Auditor agent identity

Auditors are workers with specific audit-domain prompts in `.claude/agents/`:
- `eunomia.md` (Wave 1, Horae sister of order)
- `dike.md` (Wave 2, Horae sister of justice)
- `aletheia.md` (Wave 3 final, Horae sister of truth)
- `pan.md` (Universal post-Wave 3 worker, including rescue if auditor escalates)

## Cross-references

- Lock 10: `.claude/skills/anti-pattern-locks/SKILL.md`
- Audit contracts: `_meta/contracts/{eunomia-wave1,dike-wave2,aletheia-wave3}-audit.md`
- Audit output location: `_meta/audit/`

---

**Source authority**: V1 Orch spawn directive Lock 10 per-wave auditor mandatory + Pythia audit gate contracts
