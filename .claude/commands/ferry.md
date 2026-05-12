---
description: Format escalation message ke V1 Orchestrator dengan ferry context, trigger condition, and proposed resolution
argument-hint: <ferry-reason>
---

# /ferry

Format an escalation message ke V1 Orch (`/orches-v1` Mode A) when worker hits 1 of 5 HIGH bar trigger conditions. Use this command instead of inline ferry to ensure structured handoff.

## 5 HIGH bar trigger conditions (Ferry threshold)

1. **Critical block**: semua direction blocked + > 30 menit debug fail, root cause unclear
2. **Contract conflict**: Pythia contracts (`_meta/contracts/<edge>.md`) incompatible with worker output or downstream consumer
3. **Anti-pattern violation directive**: V1 Orch directive seems to require violating Lock 1-10 (e.g., asking for emoji or em dash in output)
4. **Decision lewat scope**: domain decision exceeds worker authority (e.g., feature flag toggle, drop protocol activation, OAuth app creation timing)
5. **Downstream cascade risk**: blast radius > 1 worker; current decision will force re-spawn of multiple workers downstream

## Threshold check

Before invoking `/ferry`, self-verify:
- Did I exhaust 30 min single-direction debug attempt? (if blocked)
- Did I read all relevant Pythia contracts + Metis md sections? (if contract conflict)
- Did I check `_meta/decision_log/` for similar decision precedent? (if scope decision)
- Did I update uncertainty journal first? (medium-confidence ferry candidate, NOT high-urgency)

If 0-1 of these self-verifies pass, defer to uncertainty journal + proceed conservative. Ferry ONLY if 2+ pass AND 1 of 5 HIGH bar trigger met.

## Ferry message format

```markdown
# Ferry: <worker-name> Cycle <N> to V1 Orch

**Trigger condition**: <1 of 5 HIGH bar>
**Worker**: <name> (Wave <0/1/2/3/Pan>)
**Cycle**: <N>
**Date**: <YYYY-MM-DD HH:MM WIB>

## Context

<2-3 sentence summary of where the worker is in the cycle, what task active, what is blocking>

## What happened

<chronological narrative of attempts to resolve in-cycle, what failed, what was tried>

## Why this hits HIGH bar

<one trigger condition + evidence>
- Critical block: <debug attempts list + failure mode>
- Contract conflict: <which contract + which fields incompatible>
- Anti-pattern: <which Lock + which directive seems to violate>
- Scope decision: <what authority needed + why not worker authority>
- Cascade risk: <which workers downstream + which artifacts affected>

## Proposed resolutions (3 options)

### Option A: <name>
- Approach: <description>
- Trade-off: <pros + cons>
- Capacity impact: <minutes>

### Option B: <name>
- Approach: <description>
- Trade-off: <pros + cons>
- Capacity impact: <minutes>

### Option C: <name>
- Approach: <description>
- Trade-off: <pros + cons>
- Capacity impact: <minutes>

## Worker recommendation

<Option A/B/C + 1 sentence why>

## Worker state if not resolved in 10 min

<what worker does if V1 Orch unresponsive: continue conservative path / pause cycle + checkpoint / handoff to Pan / etc.>

---

**Ferry message ready, V1 Orch please respond in chat or amend contract `_meta/contracts/<related-edge>.md` if applicable.**
```

## After V1 Orch resolves

1. Worker resumes cycle following V1 Orch decision
2. Append resolution to `_meta/decision_log/<worker>.md` with cross-ref to ferry message
3. Update related Pythia contract if amendment required (per Lock 9 V_n: amendment creates `_meta/decisions/contract_amendment_<N>.md`)
4. Continue cycle normally

## File output

When invoked, this command outputs:
- `_meta/ferry/<worker>-cycle<N>-<timestamp>.md` (formatted ferry message)

V1 Orch reads this file or chat-relayed copy.

---

**Source authority**: V1 Orch spawn directive Section 15 "Ferry conditions HIGH bar" + Lock 10 "Per-wave auditor mandatory"
