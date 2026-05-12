# Contract: Triton to Residents

**Edge type**: intra-wave (Wave 3 internal, terminates at runtime residents)
**Wave**: Wave 3 producer to runtime resident consumers (5 endpoints)
**Status**: locked
**Authored**: 2026-05-12 16:05 WIB

## Producer

**Worker**: Triton (Wave 3)
**Domain**: DeepSeek V4 client + defensive layer + per-resident routing. Triton owns the 5 runtime resident chat endpoints; each routes user queries from Persephone's chat panel (via `persephone-to-triton.md` SSE streaming) to correct DeepSeek model + mode + system prompt persona.

## Consumer

**Runtime residents** (in-product AI features, NOT build-time workers):
- **Athena** (City Hall): Refactor proposal author, architectural questions (V4-Pro think high)
- **Apollo** (Hospital): Health findings narration, diagnostic questions (V4-Flash non-think)
- **Argus** (Police Station): Security CVSS scoring narration, defensive questions (V4-Flash think low)
- **Clio** (Library): Git/spec-drift narration, historical questions (V4-Flash non-think)
- **Hermes** (Tourist Info): Onboarding tour narration, guidance questions (V4-Flash non-think)

**Identity disclosure**: These are NOT Claude Code workers but runtime residents serving end users. Triton implements 5 endpoints binding each resident's persona to the LLM client.

## Output schema (producer to consumer)

Triton implements per-resident chat endpoint dispatching to LLMClient with correct config.

```python
# backend/app/services/resident_router.py (Triton)
from typing import Literal, Callable
from pydantic import BaseModel
from app.services.llm_client import LLMClient, LLMMessage, ThinkingMode


class ResidentConfig(BaseModel):
    """Per-resident routing config locked per PRD Section 18.3."""
    resident_id: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes"]
    prefer_pro: bool
    thinking_mode: ThinkingMode
    /** Max output tokens per response. */
    max_tokens: int
    /** System prompt key in PromptOpening. */
    persona_prompt_key: str


RESIDENT_CONFIGS: dict[str, ResidentConfig] = {
    "Athena": ResidentConfig(
        resident_id="Athena",
        prefer_pro=True,
        thinking_mode="high",
        max_tokens=4000,
        persona_prompt_key="athena_persona",
    ),
    "Apollo": ResidentConfig(
        resident_id="Apollo",
        prefer_pro=False,
        thinking_mode="disabled",
        max_tokens=600,
        persona_prompt_key="apollo_persona",
    ),
    "Argus": ResidentConfig(
        resident_id="Argus",
        prefer_pro=False,
        thinking_mode="low",
        max_tokens=400,
        persona_prompt_key="argus_persona",
    ),
    "Clio": ResidentConfig(
        resident_id="Clio",
        prefer_pro=False,
        thinking_mode="disabled",
        max_tokens=600,
        persona_prompt_key="clio_persona",
    ),
    "Hermes": ResidentConfig(
        resident_id="Hermes",
        prefer_pro=False,
        thinking_mode="disabled",
        max_tokens=300,
        persona_prompt_key="hermes_persona",
    ),
}


def route_to_resident(resident_id: str) -> ResidentConfig:
    """Returns config for resident; raises KeyError for invalid id."""
    return RESIDENT_CONFIGS[resident_id]
```

Resident endpoint handlers (Triton authors):

```python
# backend/app/api/chat.py (Triton extends from persephone-to-triton.md)
from app.services.llm_client import get_llm_client, LLMMessage
from app.services.resident_router import route_to_resident
from app.services.prompt_opening import get_prompt_opening_header, get_resident_persona


async def stream_resident_response(req: ChatRequest, session: dict):
    """Dispatches to resident handler based on req.target."""
    if req.target == "broadcast":
        async for chunk in broadcast_to_all_residents(req, session):
            yield chunk
        return
    config = route_to_resident(req.target)
    persona = get_resident_persona(config.persona_prompt_key)
    opening = get_prompt_opening_header()  # Shared 3000-token header from Hephaestus
    messages = [
        LLMMessage(role="system", content=f"{opening}\n\n{persona}"),
        # ... build user message with context (currentMode, selectedBuildingId, modeContext) ...
    ]
    llm = get_llm_client()
    async for chunk in llm.call_streaming(
        messages=messages,
        prefer_pro=config.prefer_pro,
        thinking_mode=config.thinking_mode,
        max_retries=2,
    ):
        yield chunk


async def broadcast_to_all_residents(req: ChatRequest, session: dict):
    """Runs 5 parallel calls, yields chunks with resident_id annotation."""
    residents = ["Athena", "Apollo", "Argus", "Clio", "Hermes"]
    tasks = [
        asyncio.create_task(get_resident_response(r, req, session))
        for r in residents
    ]
    # Yield chunks as they arrive, annotated with resident_id
    for task in asyncio.as_completed(tasks):
        result = await task
        yield {"resident_id": result["resident_id"], "chunk": result["content"]}
```

Per-resident persona prompts (Hephaestus Wave 0 authors in PromptOpening-codeplex-chronicle.md):

```text
# Athena persona
You are Athena, the architect resident of Codeplex Chronicle. You live in City Hall.
Role: refactor proposal author + architectural reasoning. Plain-language to structured spec.
Tone: thoughtful, deliberate, cites callsites + impact. Indonesian primary + English code-switch.

# Apollo persona
You are Apollo, the doctor resident. You live in the Hospital.
Role: narrate health findings, explain diagnostic results. Plain language doctor visiting bedside.
Tone: clinical compassionate, brief, actionable. Indonesian primary.

# Argus persona
You are Argus, the watchful guardian. You live in the Police Station.
Role: security CVSS scoring + exploit pattern + mitigation. Cite public CVE databases.
Tone: clinical, decisive, factual. No speculation beyond public records.

# Clio persona
You are Clio, the historian resident. You live in the Library.
Role: narrate git history, spec-drift patterns, code archaeology. Explain "why this exists" via commit history.
Tone: storytelling but factual, dev-poetic, references commit messages.

# Hermes persona
You are Hermes, the welcoming guide. You live in the Tourist Info booth.
Role: onboarding tour narration, navigation, "what should I look at first" guidance.
Tone: warm welcoming, brief, conversational, helpful.
```

## Storage location

- Resident router: `backend/app/services/resident_router.py` (Triton)
- Persona prompts: `PromptOpening-codeplex-chronicle.md` at project root (Hephaestus Wave 0)
- Persona loader: `backend/app/services/prompt_opening.py` (Triton; loads from project root file at startup, caches in memory)
- Chat endpoint: `backend/app/api/chat.py` (Triton, extends from `persephone-to-triton.md`)
- LLM client: `backend/app/services/llm_client.py` (Triton, shared with Nemesis + Pandora)

## Asumption baked

1. Per-resident routing per PRD Section 18.3 LOCKED. No re-debate.
2. Shared 3000-token PromptOpening header prepended to every system prompt for cache-hit (H6 target >70%).
3. NEVER replay `reasoning_content` from prior turns (Phase B quirk lock).
4. Broadcast mode parallel call to 5 residents; merged response cards display in Persephone chat panel (rare for demo).
5. PromptOpening file location: project root, accessible as `~/Documents/codeplexRefactory/PromptOpening-codeplex-chronicle.md` (Hephaestus authors Wave 0).
6. Hermes resident uses same persona as Boreas tour narration request (consistent voice across all Hermes interactions, see `boreas-to-triton.md`).
7. Apollo resident uses same persona as Asclepius Apollo query (consistent voice, see `asclepius-to-triton.md`).

## Validation steps

**Producer responsibility (Triton)**:
- 5 resident configs match PRD Section 18.3 exactly (model + thinking_mode).
- Persona prompts loaded from PromptOpening file at startup; cached for performance.
- Resident endpoint dispatches to correct LLMClient config.
- Streaming responses chunked correctly; SSE format compliant.
- Per-resident smoke test: send identical query "What does this codebase do?" to each resident, verify 5 distinct response styles per persona.
- Cache-hit verification: second identical query returns < 100ms (semantic cache).

**Consumer responsibility (Runtime residents = Persephone chat panel UI)**:
- Persephone consumes 5-resident response stream per `persephone-to-triton.md` SSE protocol.
- UI displays correct resident avatar + name per response.
- Broadcast mode renders 5 response cards in chat panel.

## Edge case handling

- Unknown resident id (e.g., typo): Triton returns HTTP 422 with valid id list.
- Persona prompt loading fail (file missing or malformed): Triton returns HTTP 500 + falls back to generic persona "I am an AI assistant for Codeplex Chronicle. Apologies, persona not loaded."
- Streaming connection drop: Triton's `call_streaming` raises StreamingError; Persephone marks message incomplete.
- Broadcast mode 1 resident fails: Triton yields error chunk for failed resident, continues other 4.
- DeepSeek API outage: defensive layer falls back to canned response per resident or generic apology.

## Open questions

- OQ-08 (top-10 canned demo questions per resident): Wave 3 Triton implementation final list; Pan Day 2 may add 1-2 based on rehearsal feedback. Each canned response keyed by (resident_id, question_pattern).
- Resident voice consistency Indonesian vs English: PRD Section 19.2 prefers Indonesian primary + English code-switch. Persona prompts include bilingual directive; LLM handles per user input language.

## Reference

- Metis Agentic Structure md Section 2 DAG: Triton LLM client module consumed by 5 runtime resident endpoint, Athena/Apollo/Argus/Clio/Hermes routing
- Metis Section 5.6 Triton ship criteria
- PRD Section 10 (5 AI residents lore + landmark buildings)
- PRD Section 18.3 (per-resident model routing locked table)
- PRD Section 18.4 (defensive layer fallback chain)
- PRD Section 18.5 (canned response top-10 pre-cache)
- PRD Section 19.2 (language locale)
- Phase B Topic E (DeepSeek V4 reliability + reasoning_content quirk)
- Hephaestus Wave 0 PromptOpening (5 resident persona prompts)
- Contract `persephone-to-triton.md` (chat panel SSE streaming consumer)
- Contract `asclepius-to-triton.md` (Apollo via Asclepius mode integration)
- Contract `boreas-to-triton.md` (Hermes via Boreas tour narration)
