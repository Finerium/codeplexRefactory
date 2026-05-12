---
description: Author worker uncertainty journal entry, mandatory artifact 2 of 4, medium-confidence decision flag
argument-hint: <cycle-N>
---

# /uncertainty

Author a worker uncertainty journal entry when a cycle includes a medium-confidence decision. Mandatory artifact 2 of 4 per cycle (only if medium-confidence concerns exist).

## When to invoke

Per confidence-based action rule (V1 Orch spawn directive Section 15):
- **High confidence (85%+)**: proceed normal, decision log entry sufficient, NO uncertainty journal
- **Medium confidence (60-85%)**: MANDATORY uncertainty journal entry + proceed conservative
- **Low confidence (<60%)**: ferry V1 Orch kalau 5 HIGH bar trigger hit, else uncertainty journal + proceed conservative

## File output

`_meta/uncertainty/<worker>-cycle<N>-<YYYYMMDD-HHMM>.md`

## Template

```markdown
# <Worker> Uncertainty Journal - Cycle <N>

**Worker**: <name>
**Cycle**: <N> (<mandate description>)
**Date**: <YYYY-MM-DD HH:MM WIB>
**Confidence**: <medium on N items, high on rest>

---

## U1: <concern title>

**Concern**: <1-2 sentence what is uncertain>

**Confidence**: <high|medium|low>

**Risk if I <action>**:
- <consequence 1>
- <consequence 2>

**Risk if I <inverse action>**:
- <consequence 1>
- <consequence 2>

**Decision**: <what worker decided + cross-ref to decision_log entry>

**Proposed resolution path**: <V1 Orch decides A | defer to specific worker B | escalate to Pan post-Wave 3 | etc.>

**Ferry threshold check**:
- Critical block? <YES|NO>
- Contract conflict? <YES|NO>
- Anti-pattern violation? <YES|NO>
- Decision lewat scope? <YES|NO>
- Downstream cascade risk? <YES|NO>

**Verdict**: <N of 5 trigger met. Ferry recommended|not needed. Surface in handoff contract.>

---

## U2: <concern title>

<repeat U1 structure>

---

## Resolution path

For high-confidence mitigated concerns (U2 etc.): documented in respective output files. No ferry needed.

For medium-confidence ferry candidates (U1 etc.): Themis includes in `_meta/handoff_log/wave<N>_<from>_to_<to>.md` for V1 Orch decision.

---

**End of `_meta/uncertainty/<worker>-cycle<N>-<timestamp>.md`**.
```

## Why this matters (Lock 4)

Lock 4: no silent assume. If asumsi ga di-spec, document. Uncertainty journal is the canonical place to surface:

- Medium-confidence decisions (60-85%)
- Assumptions that may not hold downstream
- Scope ambiguity needing V1 Orch clarification
- Risk surface that worker accepted but want auditor to verify

## Anti-pattern (avoid)

- DO NOT skip uncertainty journal when medium-confidence decision exists
- DO NOT batch multiple unrelated concerns into one file (one cycle = one journal, multiple U-items)
- DO NOT silently resolve a medium-confidence concern without journal entry
- DO NOT ferry every medium-confidence concern (HIGH bar 5 trigger only)

## Cross-references

- 4 mandatory artifacts per cycle: decision log + uncertainty journal (this) + checkpoint + handoff contract
- 5 HIGH bar ferry trigger: `.claude/commands/ferry.md`
- Confidence-based action rule: V1 Orch spawn directive Section 15

---

**Source authority**: V1 Orch spawn directive Section 14 "4 mandatory artifacts" + Section 15 "Confidence-based action" + Lock 4 no silent assume
