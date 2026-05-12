# Contract: Asclepius to Triton

**Edge type**: cross-wave (Wave 2 to Wave 3)
**Wave**: Wave 2 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:31 WIB

## Producer

**Worker**: Asclepius (Wave 2)
**Domain**: Health Mode glow window per severity (red critical, orange high, yellow medium), Apollo findings panel UI (list glow buildings + category + click opens evidence panel), "Convert to Backlog Ticket" 1-click button viz, Refactor Mode ghost building visual + ghost-to-solid animation real-time, dual review gate buttons UI. Asclepius defines the glow-window state (which buildings glow, severity, currently-selected finding) that Triton consumes when user queries Apollo or Athena resident through the chat panel.

## Consumer

**Worker**: Triton (Wave 3)
**Domain**: DeepSeek V4 client + defensive layer (semantic cache + canned response + retry + fallback + circuit breaker) + thinking-mode toggle + per-resident routing. Triton receives chat queries from frontend (via Persephone chat panel) and routes to correct DeepSeek model + mode per resident. For Apollo (health findings) queries, Triton needs context: which building is glowing, which finding is selected, severity. Asclepius publishes this context.

## Output schema (producer to consumer)

Asclepius authors a Zustand store + context selector for Apollo and Athena queries.

```typescript
// frontend/src/modes/health/asclepiusStore.ts (Asclepius authors)
import { create } from 'zustand';

export type FindingCategory =
  | 'hardcoded-secret'
  | 'outdated-dependency'
  | 'missing-auth'
  | 'unsafe-sql'
  | 'complex-untested';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ApolloFinding {
  /** Stable finding identifier. */
  id: string;
  /** Building affected. */
  buildingId: string;
  /** File path inside repo. */
  filePath: string;
  /** Line number(s); single line or range. */
  lineStart: number;
  lineEnd: number;
  category: FindingCategory;
  severity: Severity;
  /** Short title. */
  title: string;
  /** Long description with evidence. */
  description: string;
  /** Suggested remediation copy. */
  suggestedFix: string;
  /** First detection timestamp ISO 8601. */
  detectedAt: string;
  /** Status: open, snoozed, ticketed (linked to GitHub issue), resolved. */
  status: 'open' | 'snoozed' | 'ticketed' | 'resolved';
  /** GitHub issue number if ticketed. */
  linkedIssueNumber: number | null;
}

export interface ApolloContext {
  /** Map of building id to its current glow severity. */
  glowingBuildings: Record<string, Severity>;
  /** Map of finding id to finding data. */
  findings: Record<string, ApolloFinding>;
  /** Currently selected finding for evidence panel + chat context. */
  selectedFindingId: string | null;
  /** Filter applied to Apollo findings panel. */
  filter: {
    severity: Severity[];
    category: FindingCategory[];
  };
}

interface AsclepiusStoreState {
  apollo: ApolloContext;
  // Athena (Refactor) context covered in asclepius-to-pandora.md

  // Actions
  setFinding: (finding: ApolloFinding) => void;
  selectFinding: (findingId: string | null) => void;
  setGlow: (buildingId: string, severity: Severity | null) => void;
  applyFilter: (filter: Partial<ApolloContext['filter']>) => void;
}

export const useAsclepiusStore: () => AsclepiusStoreState;

/** Returns Apollo query context for Triton chat routing. */
export const useApolloQueryContext: () => {
  selectedFinding: ApolloFinding | null;
  glowingBuildingsCount: number;
  criticalCount: number;
};
```

Triton consumes via Persephone chat panel which sends finding context with query:

```typescript
// frontend/src/lib/chat/sendApolloQuery.ts (Persephone authors, references Asclepius)
import { useApolloQueryContext } from '@/modes/health/asclepiusStore';

export async function sendApolloQuery(message: string): Promise<ChatResponse> {
  const context = useApolloQueryContext();
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

Triton backend endpoint:

```python
# backend/app/api/chat.py (Triton Wave 3)
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal
from app.services.deepseek_client import call_with_fallback

router = APIRouter(prefix="/api/chat")


class ApolloFindingContext(BaseModel):
    id: str
    building_id: str
    file_path: str
    line_start: int
    line_end: int
    category: Literal["hardcoded-secret", "outdated-dependency", "missing-auth", "unsafe-sql", "complex-untested"]
    severity: Literal["critical", "high", "medium", "low", "info"]
    title: str
    description: str
    suggested_fix: str


class ApolloQuery(BaseModel):
    message: str
    context: dict  # contains selected_finding + glowing_buildings_count + critical_count


@router.post("/apollo")
async def apollo_chat(query: ApolloQuery, session: dict = Depends(require_session)):
    """Routes Apollo query to DeepSeek V4-Flash non-think with finding context.

    Apollo is the doctor resident. Context = which finding the user clicked, severity counts.
    System prompt includes shared 3000-token PromptOpening header (cache-hit per H6).
    """
    response = await call_with_fallback(
        messages=build_apollo_messages(query.message, query.context),
        prefer_pro=False,  # V4-Flash non-think per PRD Section 18.3
        max_retries=2,
    )
    return {"response": response, "resident": "Apollo"}
```

## Storage location

- Frontend store: `frontend/src/modes/health/asclepiusStore.ts` (Asclepius)
- Apollo query sender: `frontend/src/lib/chat/sendApolloQuery.ts` (Persephone, references Asclepius)
- Backend endpoint: `backend/app/api/chat.py` (Triton Wave 3)
- DeepSeek client: `backend/app/services/deepseek_client.py` (Triton Wave 3)
- Wave 2 mock: Asclepius hardcodes 5 sample findings (one per category) for demo glow visual

## Asumption baked

1. ApolloFinding canonical type defined in Asclepius store; Nemesis Wave 3 detector outputs match this shape (see `nemesis-to-asclepius.md` feedback contract).
2. Per-resident routing: Apollo = V4-Flash non-think (PRD Section 18.3). Triton wires correct model per endpoint path.
3. PromptOpening shared header ~3000 tokens prepended to system prompt for cache-hit (H6 hypothesis); Hephaestus Wave 0 authors PromptOpening.
4. Glow severity drives visual color: red critical, orange high, yellow medium (per Designer Prompt 3 severity encoding system; Asclepius color palette consistent with Selene dashboard severity colors).
5. Selected finding triggers evidence panel (separate side panel mode 'health'); Persephone mounts evidence panel content based on `selectedFindingId`.
6. Wave 2 Asclepius works with mock findings; Wave 3 swap = real Nemesis detector results stream via WebSocket (`nemesis-to-asclepius.md` feedback).

## Validation steps

**Producer responsibility (Asclepius)**:
- 5 glow buildings rendered with correct severity color (red/orange/yellow per mock data).
- Apollo findings panel UI list filterable by severity + category.
- Click finding sets `selectedFindingId`; side panel mode 'health' renders evidence detail.
- Query context exposed via `useApolloQueryContext` hook.
- Smoke test: click each mock finding, evidence panel renders, severity glow correlates correctly.

**Consumer responsibility (Triton)**:
- Implement `/api/chat/apollo` endpoint routing to V4-Flash non-think.
- System prompt includes PromptOpening header + Apollo persona + provided finding context.
- Defensive layer applies: semantic cache hit possible for common questions; canned response for top-10 pre-cached demo questions.
- Smoke test: send mock query "What does this finding mean?" with finding context; response coherent + identifies finding correctly.

## Edge case handling

- No selected finding (user opens chat without clicking finding): context.selectedFinding is null; Apollo response copy "Click a finding to ask about it specifically." or generic health overview.
- Many glowing buildings (100+): Asclepius caps display in panel to top 50 sorted by severity; Triton context includes only counts (no per-building data sent).
- DeepSeek API failure: defensive layer falls back to V4-Pro then canned response per PRD Section 18.4.
- Finding category unknown (new detector added): Asclepius gracefully renders with generic icon + category label.

## Open questions

- "Convert to Backlog Ticket" button click flow: Wave 2 stub Hybrid Layer 1 (mock); Wave 3 Demeter `POST /api/findings/{id}/to-issue` creates real GitHub issue. Cross-reference `demeter-to-selene.md` (event store updates) + `pandora-to-asclepius.md` (refactor ghost trigger feedback).
- Finding snooze mechanics: Wave 2 mock toggle; Wave 3 Demeter persists snooze state in `finding_events` table.

## Reference

- Metis Agentic Structure md Section 2 DAG: Asclepius glow-window state consumed by Wave 3 Triton resident response routing
- Metis Section 5.4 Asclepius + Section 5.6 Triton ship criteria
- PRD Section 9.5 (Health Mode 5 Apollo detectors)
- PRD Section 18.3 (per-resident model routing locked)
- PRD Section 18.4 (defensive layer fallback chain)
- PRD Section 18.5 (top-10 canned responses pre-cached)
- Phase B Topic E (DeepSeek V4 reliability + reasoning_content quirk)
- Hephaestus Wave 0 PromptOpening (~3000 tokens shared header)
