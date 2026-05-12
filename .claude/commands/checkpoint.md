---
description: Author worker checkpoint state snapshot per cycle, mandatory artifact 1 of 4
argument-hint: <cycle-N>
---

# /checkpoint

Author a worker checkpoint state snapshot at the end of each cycle. Mandatory artifact 1 of 4 per cycle. Use this command to ensure consistent format.

## When to invoke

- End of cycle (after all cycle ship criteria met)
- Mid-cycle pause (context capacity > 60-70%, frustration > 1 hour, capacity reached)
- Pre-handoff to next worker
- Pre-V_n snapshot lock (Cycle 8 final)

## File output

`_meta/checkpoints/<worker>-cycle<N>.md`

## Template

```markdown
# <Worker> Checkpoint - Cycle <N>

**Worker**: <name>
**Cycle**: <N> of <total> (planned)
**Mandate**: <which mandate>
**Date**: <YYYY-MM-DD HH:MM WIB>
**Status**: <complete|in-progress paused|blocked>

---

## Cycle <N> outputs

| File | Status | Line count | Source citation |
|---|---|---|---|
| <output file 1> | <shipped|partial|stub> | <count> | <source spec section> |
| <output file 2> | <status> | <count> | <source> |

## Cycle <N> ship criteria

- [x] Criterion 1 met (evidence: <file path or test passed>)
- [ ] Criterion 2 pending (blocker: <description>)
...

## Capacity context

**Cycle budget**: <target min>
**Cycle actual**: <actual min>
**Cumulative worker budget used**: <total min>
**Cumulative wave budget used**: <Wave N total min>
**Wave target**: <Wave N capacity allocation % of 24h>

## Context capacity check

**Estimated context fill**: <%>
**Target hard ceiling**: 60-70%
**Verdict**: PROCEED to next cycle | PAUSE + handoff | FERRY V1 Orch

## Next cycle (Cycle <N+1>)

**Mandate**: <which>
**Files to produce**:
- <list>

**Budget**: <target min>
**Risk**: <known risk>

---

**End of `_meta/checkpoints/<worker>-cycle<N>.md`**. Resume via /resume consuming this checkpoint + decision log.
```

## Anti-pattern (avoid)

- DO NOT skip checkpoint authoring at cycle end
- DO NOT batch multiple cycles into one checkpoint (one cycle = one checkpoint file)
- DO NOT lose context capacity check (always self-report estimated %)
- DO NOT forget to update task list status (TaskUpdate to completed when cycle ships)

## Cross-references

- 4 mandatory artifacts per cycle: decision log + uncertainty journal + checkpoint (this) + handoff contract
- V_n snapshot (Lock 9): produced at major milestone, BUKAN per cycle
- Anti-pattern locks: `.claude/skills/anti-pattern-locks/SKILL.md`

---

**Source authority**: V1 Orch spawn directive Section 14 "4 mandatory artifacts" + Lock 9 V_n snapshot rule
