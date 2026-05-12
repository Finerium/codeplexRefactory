# Handoff Log: Wave 2 Asclepius to Wave 3 Triton

**Edge**: Wave 2 Asclepius (Health Mode + Refactor Mode visual + store)
to Wave 3 Triton (DeepSeek V4 client + chat routing + defensive layer).
**Contract**: `_meta/contracts/asclepius-to-triton.md` (locked Pythia Wave 0).
**Date**: 2026-05-12 23:55 WIB
**Status**: Asclepius ship clean; awaiting Dike Wave 2 audit gate PASS
  to unlock Wave 3 Triton spawn.

## What Asclepius delivers

### Public API surface (consume via `@/modes/health` barrel)

```typescript
import {
  // Composite roots
  HealthMode,
  // Apollo context selectors (Triton chat routing)
  useAsclepiusStore,
  useApolloQueryContext,
  selectApolloFindings,
  selectApolloGlowMap,
  selectSelectedFinding,
  selectGlowWindows,
  // Schema types (Wave 3 Triton Pydantic mirror)
  type ApolloFinding,
  type ApolloContext,
  type FindingCategory,
  type Severity,
  type GlowWindowState,
} from '@/modes/health';
```

### Mount pattern for Persephone Wave 2 + Triton chat Wave 3

```tsx
'use client';
import { HealthMode, useApolloQueryContext } from '@/modes/health';

// In Persephone's @side/[mode]/page.tsx for mode='health':
export default function HealthModeSlot() {
  return <HealthMode source="mock" />;
}

// In Persephone chat panel sender (Wave 3 Triton consumer):
function ApolloChatSender({ message }: { message: string }) {
  const context = useApolloQueryContext();
  // POST /api/chat/apollo per asclepius-to-triton.md line 99-115
  return fetch('/api/chat/apollo', {
    method: 'POST',
    body: JSON.stringify({
      message,
      context: {
        selectedFinding: context.selectedFinding,
        glowingBuildingsCount: context.glowingBuildingsCount,
        criticalCount: context.criticalCount,
      },
    }),
  }).then((r) => r.json());
}
```

### Behavioral guarantees

1. **Severity enum locked**: 5 values
   `'critical'|'high'|'medium'|'low'|'info'` per contract
   `asclepius-to-triton.md` line 33. Visual color mapping at
   `SEVERITY_PALETTE` per PRD Section 11. Triton routes V4-Flash
   non-thinking per PRD Section 18.3 + contract Asumption 2.
2. **FindingCategory enum locked**: 5 kebab-case values per contract
   line 44. Nemesis Wave 3 publishes via
   `nemesis-to-asclepius.md` matching enum.
3. **Selected finding triggers evidence panel**: `selectFinding(id)`
   sets `apollo.selectedFindingId` in store; EvidencePanel renders
   when selection is non-null. Triton chat panel reads via
   `useApolloQueryContext()` to embed in `/api/chat/apollo` request
   payload.
4. **Glow map stable reference**: `selectGlowWindows` returns the
   cached store-level `glowWindowList` reference (D7 in
   `_meta/decision_log/asclepius.md`); satisfies React 19 +
   useSyncExternalStore contract.
5. **Mock pump default**: `useFindings({ mode: 'mock' })` dispatches the
   6 MOCK_FINDINGS at 250ms cadence. Wave 3 swap = `mode: 'websocket'`
   + `repoFullName: 'owner/repo'`.
6. **Convert to Backlog Ticket button**: 1-click + transient toast +
   issue body preview on hover. Wave 2 mock issue number derived
   client-side; Wave 3 Demeter `POST /api/findings/{id}/to-issue`
   replaces with real GitHub issue create per PRD Section 12.1.

## What Triton Wave 3 needs to know

### Per-resident routing

| Resident | DeepSeek model + mode | System prompt anchor |
|---|---|---|
| Apollo (Hospital, health) | V4-Flash non-thinking | Apollo doctor persona, warm + clinical |
| Athena (City Hall, refactor) | V4-Pro thinking high | Athena architect persona, structural reasoning |

Apollo context payload from `useApolloQueryContext`:

```typescript
{
  selectedFinding: ApolloFinding | null,
  glowingBuildingsCount: number,
  criticalCount: number,
}
```

Triton system prompt should:

1. Prepend the Hephaestus PromptOpening shared 3000-token header (H6
   cache-hit hypothesis).
2. Append Apollo persona definition + the provided finding context.
3. Route to V4-Flash non-thinking via OpenAI Python SDK + defensive
   layer (semantic cache, canned response for top-10 demo questions,
   retry simplified, fallback to V4-Pro then canned).

Per `asclepius-to-triton.md` Open questions:

- "What does this finding mean?" with finding context: Triton response
  identifies the finding + explains category + suggests next action.
- "What does this finding mean?" without finding context (selectedFinding
  null): Triton response "Click a finding to ask about it specifically."

### Athena context payload

The Refactor Mode side: Triton reads
`useAsclepiusStore.getState().refactor.proposal` for the active
proposal payload. Athena routing endpoint is `/api/chat/athena` (per
`triton-to-pandora.md`, not in this Asclepius handoff scope but flagged
for cross-reference).

## Validation steps for Triton before consume

1. Run `cd frontend && npm run dev` + visit `/asclepius-smoke` to
   verify Asclepius Health + Refactor visual rendered + 6 findings +
   2 ghost buildings + dual review gate buttons.
2. Inspect Apollo findings panel: click any row, evidence panel
   renders + ConvertToTicketButton shows hover preview.
3. Open browser DevTools React tab + verify `useAsclepiusStore`
   state has `apollo.findings` populated with mock entries + glow
   map populated.
4. Mock chat panel call (manual fetch in console):
   ```js
   fetch('/api/chat/apollo', { method: 'POST', body: JSON.stringify({
     message: 'What does this finding mean?',
     context: {
       selectedFinding: useAsclepiusStore.getState().apollo.findings['mock-finding-001'],
       glowingBuildingsCount: 6,
       criticalCount: 2,
     }
   })}).then(r => r.json())
   ```
   Wave 3 Triton implements endpoint + verifies coherent response.

## Open questions

- **Voice + tone calibration for Apollo**: Wave 2 mock copy in
  `findings.ts` description + suggestedFix is faithfully clinical-but-
  warm. Wave 3 Triton V4-Flash narration wrap may diverge. Persephone
  chat panel rendering preserves verbatim.
- **Snooze mechanics**: PRD touches on snooze (`status: 'snoozed'`)
  but no Wave 2 button is shipped. Wave 3 Demeter adds snooze
  endpoint + Asclepius store has the action surface
  (`useAsclepiusStore.getState().applyFilter` is non-snooze;
  snooze is a future status update).

## Asclepius ship status

- Ship clean per `.claude/agents/asclepius.md` Section 10 ship
  criteria items 1-3 + 7-10 + 13-15.
- 4 mandatory artifact authored (this handoff + Pandora handoff +
  decision log + uncertainty journal + checkpoint).
- 20-item self-check PASS (see `_meta/checkpoints/asclepius-cycle4.md`).
- Smoke route `/asclepius-smoke` ready for Dike audit benchmark.
- TypeScript clean on Asclepius-owned files; sibling worker lint
  errors surfaced in U-Ascl-001.
- Ferry to V1 Orch: NOT triggered.

Dike Wave 2 audit will verify the 5 mode visual operational item +
12 PM concept handoff + dual review gate explicit 3-button surface
+ contract conformance + console clean.
