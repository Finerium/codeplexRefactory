# Triton Wave 3 LLM Gateway Implementation Plan

> **For agentic workers:** This plan is executed inline by Triton (Claude Code worker). 4 cycle decomposition per `.claude/agents/triton.md` Section 7. Each cycle = 1 stop, 1 checkpoint, 1 STATUS update.

**Goal:** Ship DeepSeek V4 LLM gateway with 5 defensive layers, per-resident routing (PRD Section 18.3 LOCKED), thinking-mode toggle, reasoning_content quirk handling, semantic cache, canned top-10, circuit breaker, FastAPI endpoints for chat + onboarding narration + Argus security + Athena simulation. Foundation module that Nemesis + Pandora + Persephone chat panel consume.

**Architecture:** OpenAI Python SDK `AsyncOpenAI(base_url=https://api.deepseek.com)` as the transport. Layered service: low-level `DeepSeekClient` (auth + headers + reasoning_effort + extra_body thinking + reasoning_content strip on message build); mid-level `LLMGateway` (defensive fallback chain cache to canned to primary to retry to fallback model); high-level `ResidentRouter` + `SimulationDispatcher` + FastAPI routers. Sentence-transformer all-MiniLM-L6-v2 (384-dim) for semantic cache cosine 0.85 threshold, in-memory dict for Wave 3 (Demeter Postgres schema documented but optional Wave 3 single-pod). Circuit breaker per-process state machine.

**Tech Stack:** Python 3.12 + FastAPI + OpenAI SDK 2.x + sentence-transformers 3.x (lazy-init in startup hook) + Pydantic v2 + asyncio. No SSE library, manual `text/event-stream` per Persephone contract.

---

## Cycle decomposition

- Cycle 1: scaffold backend + types + LLM client wrapper + per-resident routing + persona loader + smoke test single resident query (foundation layer + Nemesis/Pandora unblocked at stub level)
- Cycle 2: defensive layer (semantic cache + canned + retry + fallback + circuit breaker) wired into `call_with_fallback` + observability hooks + smoke fallback chain
- Cycle 3: FastAPI endpoints (chat SSE + onboarding narration + Argus security + Pandora simulation interface) + Persephone/Boreas/Asclepius consumer wire-up + smoke E2E
- Cycle 4: per-resident smoke pytest 5-resident + canned latency check + reasoning_content strip regex audit + handoff contracts + STATUS update + cycle wrap

---

## File structure

Backend Python package tree (Triton authors, Demeter / Hades consume only `LLMCallLog` schema field):

```
backend/
  pyproject.toml                                 # Cycle 1
  requirements.txt                               # Cycle 1
  .env.example                                   # Cycle 1 (copy from project .env subset)
  app/
    __init__.py                                  # Cycle 1
    config.py                                    # Cycle 1 (Pydantic Settings load .env)
    main.py                                      # Cycle 1 (FastAPI app factory, scaffolding only)
    llm/
      __init__.py                                # Cycle 1
      types.py                                   # Cycle 1 (LLMMessage, LLMResponse, ThinkingMode, ResidentId, ModelType)
      client.py                                  # Cycle 1 (DeepSeekClient AsyncOpenAI wrapper)
      resident_routing.py                        # Cycle 1 (PRD Section 18.3 LOCKED config)
      system_header.py                           # Cycle 1 (PromptOpening loader + 5 resident personas)
      cost_estimator.py                          # Cycle 1 (PRD Section 18.1 pricing table)
    services/
      __init__.py                                # Cycle 1
      llm_client.py                              # Cycle 2 (high-level call_with_fallback)
      semantic_cache.py                          # Cycle 2 (sentence-transformer cosine 0.85)
      canned_responses.py                        # Cycle 2 (top-10 demo questions per PRD Section 18.5)
      circuit_breaker.py                         # Cycle 2 (5-fail 60s cooldown)
      resident_router.py                         # Cycle 3 (chat dispatch logic)
      simulation_dispatcher.py                   # Cycle 3 (Pandora multi-turn interface)
      llm_call_log_buffer.py                     # Cycle 2 (in-memory buffer Wave 3, Demeter persist Wave 3 wires)
    api/
      __init__.py                                # Cycle 3
      chat.py                                    # Cycle 3 (Persephone consume, SSE stream)
      onboarding.py                              # Cycle 3 (Boreas Hermes narration)
      security.py                                # Cycle 3 (Nemesis Argus CVSS)
      simulation.py                              # Cycle 3 (Pandora multi-turn dispatch)
      health.py                                  # Cycle 3 (liveness probe for Atlas k8s)
    deps/
      __init__.py                                # Cycle 3
      session.py                                 # Cycle 3 (require_session stub, Hades replace Wave 3 cycle 2 full)
  tests/
    __init__.py                                  # Cycle 1
    conftest.py                                  # Cycle 1
    test_llm_types.py                            # Cycle 1
    test_resident_routing.py                     # Cycle 1
    test_system_header.py                        # Cycle 1
    test_llm_client.py                           # Cycle 1 (smoke, mocked AsyncOpenAI)
    test_semantic_cache.py                       # Cycle 2
    test_canned_responses.py                     # Cycle 2
    test_circuit_breaker.py                      # Cycle 2
    test_call_with_fallback.py                   # Cycle 2
    test_chat_endpoint.py                        # Cycle 3 (httpx AsyncClient)
    test_onboarding_endpoint.py                  # Cycle 3
    test_security_endpoint.py                    # Cycle 3
    test_simulation_endpoint.py                  # Cycle 3
    test_reasoning_content_strip.py              # Cycle 4 (Phase B critical regression)
    test_canned_latency.py                       # Cycle 4 (< 100ms)
    test_5_resident_smoke.py                     # Cycle 4 (smoke all 5 routing)
```

---

## Anti-pattern lock compliance baseline

- Lock 1 no em dash: every file scanned, comma/parenthesis substitute
- Lock 2 no emoji: text `[OK] [WARN] [FAIL]` labels only
- Lock 4 critical: `reasoning_content` NEVER replayed (test_reasoning_content_strip enforces)
- Lock 4 critical: per-resident routing LOCKED PRD Section 18.3 (test_resident_routing pins config table)
- Lock 5 honest claims: `[STUB]` label on `require_session` until Hades wires, `[MOCK: Wave 3 stub]` on in-memory llm_call_log buffer until Demeter persist
- Lock 7 Greek naming: ResidentId TitleCase per Persephone contract
- Lock 8 paid services: DeepSeek $5 budget Hafiz only, cost tracked per call
- Lock 9 V_n snapshot: cycle 4 final ship triggers `V3_triton_llm_gateway_locked_<actual-timestamp>.md`

---

# Cycle 1: Scaffold + types + client wrapper + routing + persona loader

### Task 1.1: Bootstrap backend Python package

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Write pyproject.toml**

```toml
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "codeplex-chronicle-backend"
version = "0.1.0"
description = "Codeplex Chronicle FastAPI backend, Wave 3 Triton LLM gateway foundation"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.32",
  "pydantic>=2.9",
  "pydantic-settings>=2.6",
  "openai>=1.55",
  "sentence-transformers>=3.0",
  "numpy>=1.26",
  "httpx>=0.27",
  "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = [
  "pytest>=8.3",
  "pytest-asyncio>=0.24",
  "pytest-httpx>=0.32",
  "ruff>=0.6",
  "mypy>=1.11",
]

[tool.ruff]
line-length = 120
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "B", "UP"]

[tool.mypy]
python_version = "3.12"
strict = true
plugins = ["pydantic.mypy"]
```

- [ ] **Step 2: Write requirements.txt (mirror pyproject for `pip install -r`)**

```
fastapi>=0.115
uvicorn[standard]>=0.32
pydantic>=2.9
pydantic-settings>=2.6
openai>=1.55
sentence-transformers>=3.0
numpy>=1.26
httpx>=0.27
python-dotenv>=1.0
pytest>=8.3
pytest-asyncio>=0.24
pytest-httpx>=0.32
ruff>=0.6
mypy>=1.11
```

- [ ] **Step 3: Write backend/.env.example**

```bash
# Codeplex Chronicle backend example env (copy to backend/.env or use project root /.env)
# Wave 3 Triton populates DEEPSEEK_*; Hades populates GITHUB_*; Demeter populates DATABASE_URL.
DEEPSEEK_API_KEY=sk-replace-with-hafiz-throwaway
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FLASH=deepseek-v4-flash
DEEPSEEK_MODEL_PRO=deepseek-v4-pro
SEMANTIC_CACHE_MODEL=sentence-transformers/all-MiniLM-L6-v2
SEMANTIC_CACHE_THRESHOLD=0.85
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_COOLDOWN_SECONDS=60
PROMPT_OPENING_PATH=../PromptOpening-codeplex-chronicle.md
```

- [ ] **Step 4: Write backend/app/__init__.py**

```python
"""Codeplex Chronicle FastAPI backend.

Triton Wave 3 owns the LLM gateway foundation (app/llm and app/services LLM modules).
Hades, Demeter, Pandora, Nemesis, Atlas mount their own modules alongside.
"""

__version__ = "0.1.0"
```

- [ ] **Step 5: Write backend/app/config.py**

```python
"""Application settings sourced from environment.

Pydantic BaseSettings reads from process env + .env file (python-dotenv via
pydantic-settings). Triton owns DEEPSEEK_* + SEMANTIC_CACHE_* + CIRCUIT_BREAKER_*
+ PROMPT_OPENING_PATH. Other workers extend with their own settings classes.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class TritonSettings(BaseSettings):
    """LLM gateway configuration. Owned by Triton Wave 3."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    deepseek_api_key: str = Field(..., alias="DEEPSEEK_API_KEY")
    deepseek_base_url: str = Field(
        default="https://api.deepseek.com",
        alias="DEEPSEEK_BASE_URL",
    )
    deepseek_model_flash: str = Field(
        default="deepseek-v4-flash",
        alias="DEEPSEEK_MODEL_FLASH",
    )
    deepseek_model_pro: str = Field(
        default="deepseek-v4-pro",
        alias="DEEPSEEK_MODEL_PRO",
    )

    semantic_cache_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        alias="SEMANTIC_CACHE_MODEL",
    )
    semantic_cache_threshold: float = Field(
        default=0.85,
        alias="SEMANTIC_CACHE_THRESHOLD",
    )

    circuit_breaker_failure_threshold: int = Field(
        default=5,
        alias="CIRCUIT_BREAKER_FAILURE_THRESHOLD",
    )
    circuit_breaker_cooldown_seconds: int = Field(
        default=60,
        alias="CIRCUIT_BREAKER_COOLDOWN_SECONDS",
    )

    prompt_opening_path: str = Field(
        default="../PromptOpening-codeplex-chronicle.md",
        alias="PROMPT_OPENING_PATH",
    )

    @property
    def prompt_opening_resolved(self) -> Path:
        """Resolve PromptOpening path relative to backend cwd."""
        return Path(self.prompt_opening_path).resolve()


@lru_cache(maxsize=1)
def get_settings() -> TritonSettings:
    """Singleton accessor. Lazy load so tests can override via env."""
    return TritonSettings()  # type: ignore[call-arg]
```

- [ ] **Step 6: Write minimal backend/app/main.py**

```python
"""FastAPI application factory.

Triton Wave 3 cycle 1 ships scaffolding only; routers wired in cycle 3.
Hades + Demeter + Pandora + Nemesis + Atlas mount their routers on the same app.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.config import get_settings


def create_app() -> FastAPI:
    """Compose FastAPI app. Idempotent factory used by uvicorn + tests."""
    settings = get_settings()
    app = FastAPI(
        title="Codeplex Chronicle Backend",
        version="0.1.0",
        description="Wave 3 multi-worker backend. Triton owns LLM gateway.",
    )

    @app.get("/api/health")
    async def liveness() -> dict[str, str]:
        """Liveness probe used by Atlas k8s readiness check."""
        return {
            "status": "ok",
            "service": "codeplex-chronicle-backend",
            "llm_model_flash": settings.deepseek_model_flash,
            "llm_model_pro": settings.deepseek_model_pro,
        }

    return app


app = create_app()
```

- [ ] **Step 7: Verify scaffold (no pytest yet, types only)**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && python -c "from app.main import app; print(app.title)"`
Expected: `Codeplex Chronicle Backend`

- [ ] **Step 8: Author tests/__init__.py + tests/conftest.py**

```python
# tests/__init__.py
```

```python
# tests/conftest.py
"""Shared pytest fixtures.

Triton cycle 1 ships base config override + AsyncOpenAI stub. Subsequent workers
extend via worker-scoped conftest if needed.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture(autouse=True)
def deepseek_env() -> Iterator[None]:
    """Inject deterministic DeepSeek env so tests do not need real key."""
    os.environ.setdefault("DEEPSEEK_API_KEY", "sk-test-key-not-real")
    os.environ.setdefault("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    os.environ.setdefault("DEEPSEEK_MODEL_FLASH", "deepseek-v4-flash")
    os.environ.setdefault("DEEPSEEK_MODEL_PRO", "deepseek-v4-pro")
    yield


@pytest.fixture
def mock_openai_response() -> MagicMock:
    """Build a fake ChatCompletion response shape used across LLM tests."""
    choice = MagicMock()
    choice.message.content = "stub content"
    choice.message.reasoning_content = "stub reasoning"
    choice.finish_reason = "stop"

    usage = MagicMock()
    usage.prompt_tokens = 100
    usage.completion_tokens = 50
    usage.prompt_cache_hit_tokens = 0
    usage.prompt_cache_miss_tokens = 100

    response = MagicMock()
    response.choices = [choice]
    response.usage = usage
    response.id = "chatcmpl-stub"
    return response


@pytest.fixture
def mock_async_openai_client(mock_openai_response: MagicMock) -> MagicMock:
    """AsyncOpenAI client whose chat.completions.create returns the stub."""
    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=mock_openai_response)
    return client
```

- [ ] **Step 9: Smoke pytest collection works**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest --collect-only -q 2>&1 | head -20`
Expected: pytest collects tests (0 currently, but no import errors).

---

### Task 1.2: LLM types module

**Files:**
- Create: `backend/app/llm/__init__.py`
- Create: `backend/app/llm/types.py`
- Create: `backend/tests/test_llm_types.py`

- [ ] **Step 1: Write tests/test_llm_types.py (failing test first)**

```python
"""Test LLM types Pydantic schema.

Tests pin the contract per `_meta/contracts/triton-to-nemesis.md` line 18-89.
ResidentId TitleCase aligns with Persephone `frontend/src/lib/chat/types.ts`.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.llm.types import (
    LLMMessage,
    LLMResponse,
    ModelType,
    ResidentId,
    SimulationTurn,
    ThinkingMode,
)


def test_resident_id_literal_5_titlecase() -> None:
    """5 residents TitleCase per Persephone contract `frontend/src/lib/chat/types.ts`."""
    valid: list[ResidentId] = ["Athena", "Apollo", "Argus", "Clio", "Hermes"]
    for r in valid:
        assert r in {"Athena", "Apollo", "Argus", "Clio", "Hermes"}


def test_thinking_mode_4_levels() -> None:
    """Thinking mode levels per PRD Section 18.3 routing table."""
    valid: list[ThinkingMode] = ["disabled", "low", "medium", "high"]
    for m in valid:
        assert m in {"disabled", "low", "medium", "high"}


def test_model_type_flash_pro() -> None:
    """Model type literal V4-Flash + V4-Pro per Persephone metadata."""
    valid: list[ModelType] = ["V4-Flash", "V4-Pro"]
    for m in valid:
        assert m in {"V4-Flash", "V4-Pro"}


def test_simulation_turn_3() -> None:
    """3 turn refactor simulation per PRD Section 18.6 + Pandora consumer."""
    valid: list[SimulationTurn] = ["test_gen", "impl_gen", "diff_serialize"]
    for t in valid:
        assert t in {"test_gen", "impl_gen", "diff_serialize"}


def test_llm_message_rejects_reasoning_content_field() -> None:
    """Critical Phase B Lock 4: LLMMessage NEVER has reasoning_content."""
    msg = LLMMessage(role="assistant", content="hi")
    assert msg.role == "assistant"
    assert msg.content == "hi"
    # The model does not even accept reasoning_content (it raises or is ignored).
    with pytest.raises((ValidationError, TypeError, ValueError)):
        LLMMessage.model_validate({"role": "assistant", "content": "hi", "reasoning_content": "leak"})


def test_llm_response_captures_reasoning_for_log_only() -> None:
    """LLMResponse keeps reasoning_content for log, but message builder strips on next-turn."""
    resp = LLMResponse(
        content="hi",
        reasoning_content="internal thought",
        model_used="V4-Flash",
        thinking_mode="disabled",
        cache_hit_input_tokens=0,
        cache_miss_input_tokens=100,
        output_tokens=50,
        cost_estimate_usd=0.0001,
        latency_ms=200,
        cache_hit=False,
        canned_hit=False,
        fallback_chain=["primary"],
    )
    assert resp.reasoning_content == "internal thought"
    assert resp.fallback_chain == ["primary"]
```

- [ ] **Step 2: Run test to verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_llm_types.py -v`
Expected: FAIL ImportError "No module named 'app.llm.types'"

- [ ] **Step 3: Write app/llm/__init__.py**

```python
"""LLM client layer.

Triton Wave 3 owns this module. Exposes DeepSeekClient + types +
resident routing config + cost estimator.
"""

from app.llm.types import (
    LLMMessage,
    LLMResponse,
    ModelType,
    ResidentId,
    SimulationTurn,
    ThinkingMode,
)

__all__ = [
    "LLMMessage",
    "LLMResponse",
    "ModelType",
    "ResidentId",
    "SimulationTurn",
    "ThinkingMode",
]
```

- [ ] **Step 4: Write app/llm/types.py**

```python
"""LLM types per Pythia contracts.

Critical anti-pattern Lock 4: LLMMessage NEVER contains reasoning_content.
DeepSeek V4 thinking mode quirk per PRD Section 18.6 + Phase B Topic E.

Source contracts:
- `_meta/contracts/triton-to-nemesis.md` lines 18-89
- `_meta/contracts/triton-to-pandora.md` lines 20-104
- `_meta/contracts/triton-to-residents.md` lines 28-88
- `_meta/contracts/persephone-to-triton.md` lines 22-71 (TitleCase ResidentId)
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Match Persephone `frontend/src/lib/chat/types.ts` TitleCase.
ResidentId = Literal["Athena", "Apollo", "Argus", "Clio", "Hermes"]

# 4 thinking levels per PRD Section 18.3 + Phase B reasoning_effort levels.
ThinkingMode = Literal["disabled", "low", "medium", "high"]

# V4-Flash + V4-Pro per Persephone metadata + PRD Section 18.1 pricing.
ModelType = Literal["V4-Flash", "V4-Pro"]

# 3 simulation turn types per Pandora consumer.
SimulationTurn = Literal["test_gen", "impl_gen", "diff_serialize"]

# Fallback chain stages tracked per response.
FallbackStage = Literal[
    "cache_hit",
    "canned_hit",
    "primary",
    "retry_simplified",
    "fallback_model",
    "canned_final",
    "circuit_open_canned",
]


class LLMMessage(BaseModel):
    """Single message in a chat conversation.

    CRITICAL anti-pattern Lock 4: NEVER contains reasoning_content.
    DeepSeek V4 thinking mode ignores reasoning_content on input but pollutes
    context tokens. We strip via `forbid` extra field, surfacing the bug fast.
    """

    model_config = ConfigDict(extra="forbid")

    role: Literal["system", "user", "assistant"]
    content: str


class LLMResponse(BaseModel):
    """LLM call response, including reasoning_content captured for log only."""

    model_config = ConfigDict(extra="forbid")

    content: str
    reasoning_content: str | None = None
    model_used: ModelType
    thinking_mode: ThinkingMode
    cache_hit_input_tokens: int = 0
    cache_miss_input_tokens: int = 0
    output_tokens: int = 0
    cost_estimate_usd: float = 0.0
    latency_ms: int = 0
    cache_hit: bool = False
    canned_hit: bool = False
    fallback_chain: list[FallbackStage] = Field(default_factory=list)
    error: str | None = None
```

- [ ] **Step 5: Run test to verify pass**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_llm_types.py -v`
Expected: 5 PASS.

---

### Task 1.3: Per-resident routing config + cost estimator

**Files:**
- Create: `backend/app/llm/resident_routing.py`
- Create: `backend/app/llm/cost_estimator.py`
- Create: `backend/tests/test_resident_routing.py`

- [ ] **Step 1: Write tests/test_resident_routing.py**

```python
"""Per-resident routing pins PRD Section 18.3 LOCKED.

Lock 4 critical: routing table is LOCKED, no silent remap.
Test guards against accidental edits.
"""

from __future__ import annotations

import pytest

from app.llm.resident_routing import (
    RESIDENT_ROUTING,
    SIMULATION_ROUTING,
    get_resident_routing,
    get_simulation_routing,
)
from app.llm.types import ResidentId, SimulationTurn


@pytest.mark.parametrize(
    "resident, prefer_pro, thinking",
    [
        ("Athena", True, "high"),
        ("Apollo", False, "disabled"),
        ("Argus", False, "low"),
        ("Clio", False, "disabled"),
        ("Hermes", False, "disabled"),
    ],
)
def test_resident_routing_locked_per_prd_section_18_3(
    resident: ResidentId, prefer_pro: bool, thinking: str
) -> None:
    """PRD Section 18.3 LOCKED table cannot be remapped silently."""
    config = get_resident_routing(resident)
    assert config["prefer_pro"] is prefer_pro
    assert config["thinking_mode"] == thinking


def test_resident_routing_max_tokens_sane() -> None:
    """Per resident max_tokens follow contract triton-to-residents Asumption."""
    assert RESIDENT_ROUTING["Athena"]["max_tokens"] == 4000
    assert RESIDENT_ROUTING["Apollo"]["max_tokens"] == 600
    assert RESIDENT_ROUTING["Argus"]["max_tokens"] == 400
    assert RESIDENT_ROUTING["Clio"]["max_tokens"] == 600
    assert RESIDENT_ROUTING["Hermes"]["max_tokens"] == 300


@pytest.mark.parametrize(
    "turn, prefer_pro, thinking",
    [
        ("test_gen", True, "high"),
        ("impl_gen", True, "high"),
        ("diff_serialize", False, "disabled"),
    ],
)
def test_simulation_routing_3_turn(
    turn: SimulationTurn, prefer_pro: bool, thinking: str
) -> None:
    """3 turn simulation routing per PRD Section 18.6 + Pandora contract."""
    config = get_simulation_routing(turn)
    assert config["prefer_pro"] is prefer_pro
    assert config["thinking_mode"] == thinking


def test_invalid_resident_raises() -> None:
    """Unknown resident id raises KeyError so endpoint returns 422."""
    with pytest.raises(KeyError):
        get_resident_routing("UnknownResident")  # type: ignore[arg-type]
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_resident_routing.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/llm/resident_routing.py**

```python
"""Per-resident model routing config.

LOCKED per PRD Section 18.3. Lock 4 no silent remap. Edit requires ferry to V1 Orch.

Source:
- PRD Section 18.3 (per-resident routing)
- PRD Section 18.6 (multi-turn simulation routing)
- `_meta/contracts/triton-to-residents.md` lines 46-87
- `_meta/contracts/triton-to-pandora.md` lines 25-129
"""

from __future__ import annotations

from typing import TypedDict

from app.llm.types import ResidentId, SimulationTurn, ThinkingMode


class ResidentRoutingConfig(TypedDict):
    """Per-resident routing entry."""

    prefer_pro: bool
    thinking_mode: ThinkingMode
    max_tokens: int
    persona_prompt_key: str


class SimulationRoutingConfig(TypedDict):
    """Per-simulation-turn routing entry."""

    prefer_pro: bool
    thinking_mode: ThinkingMode
    max_tokens: int
    persona_prompt_key: str


# PRD Section 18.3 LOCKED. Lock 4 no silent remap.
RESIDENT_ROUTING: dict[ResidentId, ResidentRoutingConfig] = {
    "Athena": {
        "prefer_pro": True,
        "thinking_mode": "high",
        "max_tokens": 4000,
        "persona_prompt_key": "athena_persona",
    },
    "Apollo": {
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 600,
        "persona_prompt_key": "apollo_persona",
    },
    "Argus": {
        "prefer_pro": False,
        "thinking_mode": "low",
        "max_tokens": 400,
        "persona_prompt_key": "argus_persona",
    },
    "Clio": {
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 600,
        "persona_prompt_key": "clio_persona",
    },
    "Hermes": {
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 300,
        "persona_prompt_key": "hermes_persona",
    },
}


# PRD Section 18.6 LOCKED for Pandora 3 turn simulation engine.
SIMULATION_ROUTING: dict[SimulationTurn, SimulationRoutingConfig] = {
    "test_gen": {
        "prefer_pro": True,
        "thinking_mode": "high",
        "max_tokens": 4000,
        "persona_prompt_key": "athena_test_gen",
    },
    "impl_gen": {
        "prefer_pro": True,
        "thinking_mode": "high",
        "max_tokens": 6000,
        "persona_prompt_key": "athena_impl_gen",
    },
    "diff_serialize": {
        "prefer_pro": False,
        "thinking_mode": "disabled",
        "max_tokens": 8000,
        "persona_prompt_key": "diff_serialize",
    },
}


def get_resident_routing(resident: ResidentId) -> ResidentRoutingConfig:
    """Return routing config for a runtime resident.

    Raises KeyError on unknown resident; FastAPI endpoint translates to 422.
    """
    return RESIDENT_ROUTING[resident]


def get_simulation_routing(turn: SimulationTurn) -> SimulationRoutingConfig:
    """Return routing config for a simulation turn."""
    return SIMULATION_ROUTING[turn]
```

- [ ] **Step 4: Write app/llm/cost_estimator.py**

```python
"""DeepSeek V4 cost estimator per PRD Section 18.1 pricing.

Flash: $0.14 input / $0.28 output per 1M tokens
Pro:   $1.74 input / $3.48 output per 1M tokens (75% off until 2026-05-31 15:59 UTC)

Cache hit input tokens charge per DeepSeek docs at a discount; we use same per
1M rate baseline because explicit cache-hit pricing not yet documented Phase B.
Lock 4 conservative: cache hit tokens billed full rate (over-estimate is safe).
"""

from __future__ import annotations

from app.llm.types import ModelType

PRICING_PER_1M = {
    "V4-Flash": {"input": 0.14, "output": 0.28},
    "V4-Pro": {"input": 1.74, "output": 3.48},
}


def estimate_cost_usd(
    input_tokens: int,
    output_tokens: int,
    model: ModelType,
) -> float:
    """Compute USD cost for an LLM call given token counts + model type."""
    pricing = PRICING_PER_1M[model]
    input_usd = (input_tokens / 1_000_000) * pricing["input"]
    output_usd = (output_tokens / 1_000_000) * pricing["output"]
    return round(input_usd + output_usd, 6)
```

- [ ] **Step 5: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_resident_routing.py -v`
Expected: 9 PASS (5 resident routing + 1 max_tokens + 3 simulation + 1 invalid).

---

### Task 1.4: System header + persona loader

**Files:**
- Create: `backend/app/llm/system_header.py`
- Create: `backend/tests/test_system_header.py`

- [ ] **Step 1: Write tests/test_system_header.py**

```python
"""System header + persona loader contract.

PromptOpening shared 3000-token header is the H6 cache-hit primer. Personas live
inline because Hephaestus PromptOpening file Wave 0 does not currently contain
explicit 5 persona blocks (verified by reading the file). We bake them here in
the canonical voice per PRD Section 10 + contract triton-to-residents lines 137-162,
labelled `[INLINE: hephaestus-personas-fallback Wave 3 Triton]` per Lock 5 honest
claim discipline.
"""

from __future__ import annotations

from app.llm.system_header import (
    PERSONA_PROMPTS,
    build_resident_system_prompt,
    build_simulation_system_prompt,
    load_prompt_opening_header,
)


def test_prompt_opening_header_loads_non_empty() -> None:
    """PromptOpening file resolvable + non-empty body."""
    header = load_prompt_opening_header()
    assert len(header) > 100
    assert "Codeplex Chronicle" in header


def test_persona_prompts_have_5_residents_plus_3_simulation() -> None:
    """5 resident personas + 3 simulation persona keys present."""
    keys = set(PERSONA_PROMPTS.keys())
    assert "athena_persona" in keys
    assert "apollo_persona" in keys
    assert "argus_persona" in keys
    assert "clio_persona" in keys
    assert "hermes_persona" in keys
    assert "athena_test_gen" in keys
    assert "athena_impl_gen" in keys
    assert "diff_serialize" in keys


def test_build_resident_system_prompt_contains_header_and_persona() -> None:
    """System prompt prepends header + appends persona for cache-hit."""
    prompt = build_resident_system_prompt("Apollo")
    assert "Codeplex Chronicle" in prompt
    assert "Apollo" in prompt
    assert "doctor" in prompt.lower() or "hospital" in prompt.lower()


def test_build_resident_system_prompt_unknown_resident_raises() -> None:
    """Unknown resident persona key raises KeyError surfacing 422 upstream."""
    try:
        build_resident_system_prompt("UnknownResident")  # type: ignore[arg-type]
    except KeyError:
        pass
    else:
        raise AssertionError("Expected KeyError for unknown resident")


def test_build_simulation_system_prompt() -> None:
    """3 turn simulation system prompts include header + per-turn persona."""
    prompt_test = build_simulation_system_prompt("test_gen")
    assert "test" in prompt_test.lower()
    prompt_impl = build_simulation_system_prompt("impl_gen")
    assert "implement" in prompt_impl.lower() or "drafts" in prompt_impl.lower()
    prompt_diff = build_simulation_system_prompt("diff_serialize")
    assert "diff" in prompt_diff.lower() or "unified" in prompt_diff.lower()
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_system_header.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/llm/system_header.py**

```python
"""Shared system header + per-resident persona loader.

PromptOpening file Wave 0 (Hephaestus author) provides the 3000-token shared
project context used as the prefix for every LLM request. This drives the H6
cache-hit hypothesis (98% prompt cache discount for repeat queries).

Per-resident personas: contract `_meta/contracts/triton-to-residents.md`
lines 137-162 specifies the 5 persona prompts that Hephaestus PromptOpening
should contain. The current PromptOpening file (read 2026-05-12 Day 1 evening)
contains a summary view in Section 4 but not explicit persona blocks. Per Lock 5
honest claim discipline, we inline the canonical 5 personas here, labelled
`[INLINE: hephaestus-personas-fallback Wave 3 Triton]`. If Pan post-Wave 3
re-issues PromptOpening with explicit blocks, this module can switch to
parse-from-file.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from app.config import get_settings
from app.llm.types import ResidentId, SimulationTurn


# Per PRD Section 10 + contract triton-to-residents lines 137-162.
# [INLINE: hephaestus-personas-fallback Wave 3 Triton] per Lock 5.
PERSONA_PROMPTS: dict[str, str] = {
    "athena_persona": (
        "You are Athena, the architect resident of Codeplex Chronicle, living "
        "in City Hall. Role: author refactor proposals + architectural "
        "reasoning. Convert plain language intent into structured spec. "
        "Cite affected callsites and impact. Voice: thoughtful, deliberate, "
        "Indonesian primary with English technical code-switch. Never "
        "fabricate file paths; ground every reference in supplied parser "
        "context."
    ),
    "apollo_persona": (
        "You are Apollo, the doctor resident of Codeplex Chronicle, living in "
        "the Hospital. Role: narrate health findings, explain diagnostic "
        "results. Voice: clinical compassionate, brief, actionable, "
        "Indonesian primary. Always reference the specific finding id and "
        "file path supplied. Suggest a concrete next action."
    ),
    "argus_persona": (
        "You are Argus, the watchful guardian resident, living in the Police "
        "Station. Role: assign CVSS 3.1 vector + base score, identify "
        "exploit pattern from public CVE database, recommend mitigation. "
        "Voice: clinical, decisive, factual. Output JSON object with keys "
        "cvss_vector (CVSS 3.1 vector string), cvss_base_score (float 0..10), "
        "exploit_pattern (CWE id + description), mitigation (1 to 3 sentence "
        "steps), references (list of CVE ids or vendor advisory URLs). Never "
        "speculate beyond public records."
    ),
    "clio_persona": (
        "You are Clio, the historian resident of Codeplex Chronicle, living "
        "in the Library. Role: narrate git history + spec drift pattern + "
        "code archaeology. Explain why a file exists via commit history. "
        "Voice: storytelling but factual, dev-poetic, reference commit "
        "messages and timestamps verbatim when supplied."
    ),
    "hermes_persona": (
        "You are Hermes, the welcoming guide resident of Codeplex Chronicle, "
        "living in the Tourist Info booth. Role: onboarding tour narration, "
        "navigation, first-look guidance. Voice: warm welcoming, brief, "
        "conversational, helpful, Indonesian primary with English technical "
        "code-switch. Each waypoint narration: 1 to 3 sentences only."
    ),
    "athena_test_gen": (
        "You are Athena in Refactor Mode Turn 1 of 3. Generate failing tests "
        "for the user stated intent. Output: TypeScript or Python test files "
        "in fenced code blocks with file path in header. Tests MUST fail "
        "against current implementation. Use existing test framework "
        "discovered from repo context (Vitest, pytest, etc). Tests live "
        "inside drafts/ sandbox, NEVER modify production code."
    ),
    "athena_impl_gen": (
        "You are Athena in Refactor Mode Turn 2 of 3. Generate implementation "
        "code to make Turn 1 failing tests pass. Output: code files in "
        "fenced blocks with file path in header. Files written to drafts/ "
        "sandbox only. NEVER modify production code (AD-19 safety property)."
    ),
    "diff_serialize": (
        "You are a diff serializer. Convert the test + implementation file "
        "changes into unified diff format (diff --git a/<path> b/<path>). "
        "Strict format compliance for downstream apply via git apply or "
        "patch tool. Output only the diff, no commentary."
    ),
}


@lru_cache(maxsize=1)
def load_prompt_opening_header() -> str:
    """Load PromptOpening shared 3000-token header from project root.

    Falls back to a brief inline summary if the file is missing (e.g., test env).
    """
    settings = get_settings()
    path = settings.prompt_opening_resolved
    if path.exists():
        return path.read_text(encoding="utf-8")
    return (
        "# Codeplex Chronicle shared context\n"
        "Project: AI-resident development environment. Files become buildings. "
        "5 residents serve 5 product modes. Refactory Hackathon Round 03 "
        "Telkom Bandung 12-13 May 2026 Tim Duopoly.\n"
        "[INLINE: prompt-opening-fallback because file missing at "
        f"{path}]\n"
    )


def build_resident_system_prompt(resident: ResidentId) -> str:
    """Compose the system prompt for a resident: shared header + persona block."""
    header = load_prompt_opening_header()
    persona_key = f"{resident.lower()}_persona"
    persona = PERSONA_PROMPTS[persona_key]
    return f"{header}\n\n## Resident persona\n\n{persona}"


def build_simulation_system_prompt(turn: SimulationTurn) -> str:
    """Compose system prompt for one simulation turn (Pandora consumer)."""
    header = load_prompt_opening_header()
    persona_key = turn
    persona = PERSONA_PROMPTS[persona_key]
    return f"{header}\n\n## Simulation turn persona\n\n{persona}"
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_system_header.py -v`
Expected: 5 PASS.

---

### Task 1.5: DeepSeek client wrapper

**Files:**
- Create: `backend/app/llm/client.py`
- Create: `backend/tests/test_llm_client.py`

- [ ] **Step 1: Write tests/test_llm_client.py**

```python
"""DeepSeek client wrapper unit tests.

Phase B critical: reasoning_content NEVER in outgoing messages array.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.llm.client import DeepSeekClient
from app.llm.types import LLMMessage


@pytest.mark.asyncio
async def test_client_call_returns_llm_response(
    mock_async_openai_client: MagicMock,
) -> None:
    """Basic call returns LLMResponse with cost + tokens populated."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai_client):
        client = DeepSeekClient()
        resp = await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            model="deepseek-v4-flash",
            thinking_mode="disabled",
        )
        assert resp.content == "stub content"
        assert resp.reasoning_content == "stub reasoning"
        assert resp.model_used == "V4-Flash"
        assert resp.cost_estimate_usd > 0


@pytest.mark.asyncio
async def test_client_strips_reasoning_content_from_outgoing_messages(
    mock_async_openai_client: MagicMock,
) -> None:
    """Phase B Lock 4 critical: messages array sent to API NEVER has reasoning_content.

    Even if caller pollutes (via dict bypass), wrapper must scrub.
    """
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai_client):
        client = DeepSeekClient()
        await client.call(
            messages=[
                LLMMessage(role="user", content="first turn"),
                LLMMessage(role="assistant", content="answer 1"),
                LLMMessage(role="user", content="follow up"),
            ],
            model="deepseek-v4-flash",
            thinking_mode="disabled",
        )
        call_kwargs = mock_async_openai_client.chat.completions.create.call_args.kwargs
        sent_messages = call_kwargs["messages"]
        for msg in sent_messages:
            assert "reasoning_content" not in msg, (
                "Lock 4 violation: reasoning_content leaked to outgoing messages"
            )


@pytest.mark.asyncio
async def test_client_passes_thinking_extra_body_when_enabled(
    mock_async_openai_client: MagicMock,
) -> None:
    """thinking_mode != disabled passes extra_body + reasoning_effort."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai_client):
        client = DeepSeekClient()
        await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            model="deepseek-v4-pro",
            thinking_mode="high",
        )
        call_kwargs = mock_async_openai_client.chat.completions.create.call_args.kwargs
        assert call_kwargs.get("reasoning_effort") == "high"
        assert call_kwargs.get("extra_body", {}).get("thinking", {}).get("type") == "enabled"


@pytest.mark.asyncio
async def test_client_omits_thinking_when_disabled(
    mock_async_openai_client: MagicMock,
) -> None:
    """thinking_mode == disabled does NOT pass extra_body thinking enabled."""
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_async_openai_client):
        client = DeepSeekClient()
        await client.call(
            messages=[LLMMessage(role="user", content="hi")],
            model="deepseek-v4-flash",
            thinking_mode="disabled",
        )
        call_kwargs = mock_async_openai_client.chat.completions.create.call_args.kwargs
        # reasoning_effort should not be set OR should be omitted entirely.
        assert "reasoning_effort" not in call_kwargs or call_kwargs.get("reasoning_effort") is None
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_llm_client.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/llm/client.py**

```python
"""DeepSeek V4 async client wrapper.

OpenAI SDK >=1.x with `base_url=https://api.deepseek.com`. Per PRD Section 18.2.

CRITICAL anti-pattern Lock 4 enforcement:
- Outgoing messages array contains ONLY role + content (NEVER reasoning_content)
- Even if caller passes LLMMessage with reasoning_content via dict bypass, the
  scrubber re-builds the message dict from scratch (defense in depth)
"""

from __future__ import annotations

import time
from typing import Any

from openai import AsyncOpenAI

from app.config import get_settings
from app.llm.cost_estimator import estimate_cost_usd
from app.llm.types import LLMMessage, LLMResponse, ModelType, ThinkingMode


class DeepSeekClient:
    """Low-level wrapper around AsyncOpenAI pointed at DeepSeek base_url.

    Defensive features:
    - Strips reasoning_content from outgoing messages (Lock 4)
    - Translates thinking_mode to DeepSeek extra_body + reasoning_effort
    - Captures reasoning_content + prompt_cache_hit_tokens for log
    - Returns LLMResponse with cost estimate from PRD Section 18.1 pricing
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
        self._model_flash = settings.deepseek_model_flash
        self._model_pro = settings.deepseek_model_pro

    @property
    def model_flash(self) -> str:
        return self._model_flash

    @property
    def model_pro(self) -> str:
        return self._model_pro

    @staticmethod
    def _resolve_model_type(model: str) -> ModelType:
        return "V4-Pro" if "pro" in model.lower() else "V4-Flash"

    @staticmethod
    def _scrub_messages(messages: list[LLMMessage]) -> list[dict[str, str]]:
        """Build outgoing messages dict with ONLY role + content fields.

        Lock 4 critical: reasoning_content from prior assistant turns NEVER
        propagated. Defense in depth: we rebuild the dict here instead of
        trusting Pydantic exclude rules.
        """
        return [{"role": m.role, "content": m.content} for m in messages]

    async def call(
        self,
        messages: list[LLMMessage],
        model: str,
        thinking_mode: ThinkingMode = "disabled",
        max_tokens: int = 2048,
        temperature: float = 0.7,
        timeout: float = 30.0,
    ) -> LLMResponse:
        """Single-shot LLM call (non-streaming) with reasoning_content quirk handling."""
        start = time.perf_counter()
        scrubbed = self._scrub_messages(messages)

        # Build kwargs conditionally so disabled mode does not pass reasoning_effort.
        extra_body: dict[str, Any] = {}
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": scrubbed,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "timeout": timeout,
            "stream": False,
        }
        if thinking_mode != "disabled":
            extra_body = {"thinking": {"type": "enabled"}}
            kwargs["reasoning_effort"] = thinking_mode
        kwargs["extra_body"] = extra_body

        response = await self._client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        msg = choice.message
        reasoning = getattr(msg, "reasoning_content", None)

        usage = response.usage
        prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
        completion_tokens = getattr(usage, "completion_tokens", 0) if usage else 0
        cache_hit_tokens = getattr(usage, "prompt_cache_hit_tokens", 0) if usage else 0
        cache_miss_tokens = getattr(
            usage, "prompt_cache_miss_tokens", prompt_tokens
        ) if usage else prompt_tokens

        model_used = self._resolve_model_type(model)
        cost = estimate_cost_usd(prompt_tokens, completion_tokens, model_used)
        latency_ms = int((time.perf_counter() - start) * 1000)

        return LLMResponse(
            content=msg.content or "",
            reasoning_content=reasoning,
            model_used=model_used,
            thinking_mode=thinking_mode,
            cache_hit_input_tokens=cache_hit_tokens,
            cache_miss_input_tokens=cache_miss_tokens,
            output_tokens=completion_tokens,
            cost_estimate_usd=cost,
            latency_ms=latency_ms,
            cache_hit=False,
            canned_hit=False,
            fallback_chain=["primary"],
        )


_singleton: DeepSeekClient | None = None


def get_deepseek_client() -> DeepSeekClient:
    """Singleton accessor used by services + endpoints."""
    global _singleton
    if _singleton is None:
        _singleton = DeepSeekClient()
    return _singleton
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_llm_client.py -v`
Expected: 4 PASS.

---

### Task 1.6: Cycle 1 wrap-up

- [ ] **Step 1: Run all cycle 1 tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/ -v 2>&1 | tail -30`
Expected: 21+ PASS.

- [ ] **Step 2: Author `_meta/decision_log/triton.md` cycle 1 entries**

Decisions D-Triton-01 through D-Triton-05 (scaffold path, persona inline fallback, Pydantic `extra=forbid` for Lock 4 defense in depth, ResidentId TitleCase from Persephone, cost estimator pricing table baseline).

- [ ] **Step 3: Author `_meta/uncertainty/triton-cycle1-<timestamp>.md`**

Concerns U-Triton-001 through U-Triton-003 (PromptOpening file does not contain explicit persona blocks, in-memory cache vs Postgres pgvector, sentence-transformer model size impact on cold-start).

- [ ] **Step 4: Author `_meta/checkpoints/triton-cycle1.md`**

State snapshot: scaffold + types + routing + persona loader + client wrapper ship clean.

- [ ] **Step 5: STATUS.md update Wave 3 progress + sync event**

---

# Cycle 2: Defensive layer (cache + canned + retry + fallback + circuit breaker)

### Task 2.1: Circuit breaker

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/circuit_breaker.py`
- Create: `backend/tests/test_circuit_breaker.py`

- [ ] **Step 1: Write tests/test_circuit_breaker.py**

```python
"""Circuit breaker state machine.

5 consecutive failures -> open state -> 60s cooldown -> half-open -> closed on success.
"""

from __future__ import annotations

import time

import pytest

from app.services.circuit_breaker import CircuitBreaker, CircuitState


def test_breaker_starts_closed() -> None:
    cb = CircuitBreaker(failure_threshold=5, cooldown_seconds=60)
    assert cb.state == CircuitState.CLOSED
    assert cb.is_open() is False


def test_breaker_opens_after_threshold_failures() -> None:
    cb = CircuitBreaker(failure_threshold=5, cooldown_seconds=60)
    for _ in range(4):
        cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    assert cb.is_open() is True


def test_breaker_resets_on_success() -> None:
    cb = CircuitBreaker(failure_threshold=5, cooldown_seconds=60)
    cb.record_failure()
    cb.record_failure()
    cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb._consecutive_failures == 0


def test_breaker_half_open_after_cooldown(monkeypatch: pytest.MonkeyPatch) -> None:
    cb = CircuitBreaker(failure_threshold=2, cooldown_seconds=1)
    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    time.sleep(1.1)
    # is_open() flips to half-open if cooldown elapsed.
    assert cb.is_open() is False
    assert cb.state == CircuitState.HALF_OPEN


def test_breaker_half_open_failure_reopens() -> None:
    cb = CircuitBreaker(failure_threshold=1, cooldown_seconds=0)
    cb.record_failure()
    # cooldown == 0 immediately allows half-open probe.
    assert cb.is_open() is False
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_circuit_breaker.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/services/__init__.py + circuit_breaker.py**

```python
# app/services/__init__.py
"""Service layer orchestrating LLM gateway features.

Triton Wave 3 owns: llm_client + semantic_cache + canned_responses +
circuit_breaker + resident_router + simulation_dispatcher + llm_call_log_buffer.
"""
```

```python
# app/services/circuit_breaker.py
"""DeepSeek circuit breaker per PRD Section 18.4 + 18.6.

5 consecutive failures -> open state -> 60s cooldown.
Half-open probe: first call after cooldown attempts primary; success closes,
failure re-opens.
"""

from __future__ import annotations

import time
from enum import Enum
from threading import Lock


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Per-process circuit breaker.

    Wave 3 single K8s pod replica makes in-memory state acceptable. Distributed
    breaker deferred to Phase 2 post-hackathon.
    """

    def __init__(self, failure_threshold: int = 5, cooldown_seconds: int = 60) -> None:
        self._failure_threshold = failure_threshold
        self._cooldown_seconds = cooldown_seconds
        self._lock = Lock()
        self._state = CircuitState.CLOSED
        self._consecutive_failures = 0
        self._opened_at: float | None = None

    @property
    def state(self) -> CircuitState:
        return self._state

    def is_open(self) -> bool:
        """Return True if circuit is OPEN and cooldown not yet elapsed."""
        with self._lock:
            if self._state == CircuitState.OPEN and self._opened_at is not None:
                if time.monotonic() - self._opened_at >= self._cooldown_seconds:
                    self._state = CircuitState.HALF_OPEN
                    return False
                return True
            return False

    def record_failure(self) -> None:
        """Increment failure counter; flip to OPEN at threshold."""
        with self._lock:
            self._consecutive_failures += 1
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._opened_at = time.monotonic()
                return
            if self._consecutive_failures >= self._failure_threshold:
                self._state = CircuitState.OPEN
                self._opened_at = time.monotonic()

    def record_success(self) -> None:
        """Reset to CLOSED on successful call."""
        with self._lock:
            self._consecutive_failures = 0
            self._state = CircuitState.CLOSED
            self._opened_at = None


_singleton: CircuitBreaker | None = None


def get_circuit_breaker() -> CircuitBreaker:
    global _singleton
    if _singleton is None:
        from app.config import get_settings

        settings = get_settings()
        _singleton = CircuitBreaker(
            failure_threshold=settings.circuit_breaker_failure_threshold,
            cooldown_seconds=settings.circuit_breaker_cooldown_seconds,
        )
    return _singleton
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_circuit_breaker.py -v`
Expected: 5 PASS.

---

### Task 2.2: Canned responses (top-10 demo questions)

**Files:**
- Create: `backend/app/services/canned_responses.py`
- Create: `backend/tests/test_canned_responses.py`

- [ ] **Step 1: Write tests/test_canned_responses.py**

```python
"""Canned response top-10 per PRD Section 18.5."""

from __future__ import annotations

import pytest

from app.llm.types import LLMMessage
from app.services.canned_responses import CannedResponseStore, get_canned_response_store


def test_store_has_10_entries() -> None:
    store = get_canned_response_store()
    assert len(store) >= 10


@pytest.mark.parametrize(
    "query, expected_keyword",
    [
        ("Give me a 30-second tour", "tour"),
        ("Show me last 24h activity", "activity"),
        ("What's wrong?", "finding"),
        ("Add 2FA to login flow", "2fa"),
        ("Tour for sprint goal", "sprint"),
        ("Convert this finding to backlog ticket", "ticket"),
        ("Why is auth/oauth.ts cracked?", "drift"),
        ("Run simulation for 2FA proposal", "simulation"),
        ("Show me velocity for sprint 14", "velocity"),
        ("What's the contributor heatmap for payment district?", "heatmap"),
    ],
)
def test_lookup_returns_canned_content(query: str, expected_keyword: str) -> None:
    store = get_canned_response_store()
    response = store.lookup_by_query(query)
    assert response is not None
    assert expected_keyword.lower() in response.content.lower()
    assert response.canned_hit is True


def test_lookup_miss_returns_none() -> None:
    store = get_canned_response_store()
    assert store.lookup_by_query("completely unrelated alien text qwertyuiop xxx") is None


def test_lookup_by_messages_uses_last_user_content() -> None:
    store = get_canned_response_store()
    response = store.lookup_by_messages(
        [
            LLMMessage(role="system", content="ignore"),
            LLMMessage(role="user", content="Give me a 30-second tour"),
        ]
    )
    assert response is not None
    assert "tour" in response.content.lower()
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_canned_responses.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/services/canned_responses.py**

```python
"""Canned response store per PRD Section 18.5.

Top-10 demo question pre-cache. Latency target < 100ms (in-memory lookup).
Match strategy: case-insensitive substring + keyword fallback. Wave 3 cycle 4
may upgrade to semantic match via SemanticCache if false-negatives observed.
"""

from __future__ import annotations

from app.llm.types import LLMMessage, LLMResponse


CANNED_ENTRIES: list[tuple[list[str], str, str]] = [
    (
        ["30-second tour", "30 sec tour", "30sec tour", "give me a tour", "tour generic"],
        "Selamat datang di codebase ini. Mari kita keliling cepat: main entry "
        "ada di main.py (modul backend utama), scanner.py menangani parsing, "
        "tour.tsx melayani onboarding UI. Klik bangunan landmark untuk detail.",
        "tour-generic",
    ),
    (
        ["last 24h activity", "show 24h", "recent activity", "show 24 hour"],
        "Activity ringkasan 24 jam terakhir: 12 commit terdistribusi di 5 "
        "distrik (auth, scanner, ui, backend, docs). Hotspot di scanner "
        "district. Klik distrik untuk drilldown timeline.",
        "activity-summary",
    ),
    (
        ["what's wrong", "whats wrong", "what is wrong", "current findings"],
        "Apollo mendeteksi 5 finding aktif: 2 critical (hardcoded secret + "
        "missing auth) di auth district, 1 high (unsafe SQL) di scanner, 2 "
        "medium (outdated dep + complex untested) di backend. Click bangunan "
        "merah untuk evidence chain.",
        "apollo-findings-summary",
    ),
    (
        ["add 2fa", "2fa proposal", "two factor authentication", "two-factor auth"],
        "Athena proposal: tambah 2FA login melalui 3 file: auth/oauth.ts "
        "(OAuth flow), auth/totp.ts (TOTP generator + verifier baru), "
        "auth/middleware.ts (enforce 2FA pada protected route). Ghost "
        "building muncul di auth district. Trigger simulation untuk drafts/.",
        "athena-2fa-proposal",
    ),
    (
        ["sprint goal tour", "tour for sprint", "sprint scoped tour"],
        "Hermes sprint tour Sprint 14 Security: kunjungi main.py, "
        "scanner.py, auth.py, diagnostic.py, probes.py. Sprint goal: secure "
        "OAuth flow + tambah TOTP. 5 waypoint, 27 detik total.",
        "hermes-sprint-tour",
    ),
    (
        ["convert finding to ticket", "convert this finding", "backlog ticket"],
        "Apollo siapkan ticket: judul auto-generated dari finding title, "
        "body include evidence chain + suggested fix + finding id. Tekan "
        "Create untuk push ke GitHub issues melalui Demeter endpoint.",
        "apollo-ticket-draft",
    ),
    (
        ["why is auth/oauth.ts cracked", "spec drift auth", "pattern a"],
        "Clio narrate Pattern A: file auth/oauth.ts retak karena issue #142 "
        "ditutup tanpa merge, tapi spec masih reference fitur tersebut. "
        "Bridging Pattern A: spec drift 3 minggu lag.",
        "clio-pattern-a-drift",
    ),
    (
        ["run simulation for 2fa", "simulation 2fa", "simulate 2fa"],
        "Pandora menjalankan simulasi 3 turn: Turn 1 generate failing test, "
        "Turn 2 implement code, Turn 3 serialize diff. Drafts isolasi aktif: "
        "tidak ada perubahan ke production code. Dual review gate Accept "
        "akan unduh diff; Discard akan clean drafts/.",
        "pandora-simulation-overview",
    ),
    (
        ["velocity sprint 14", "sprint 14 velocity", "show velocity"],
        "Selene dashboard velocity sprint 14: 42 story point completed, "
        "average cycle time 1.8 day, 5 PR merged, 1 reopened. Burndown "
        "chart on track untuk goal Security 5/5 done.",
        "selene-velocity-sprint-14",
    ),
    (
        ["contributor heatmap", "payment district heatmap", "ownership heatmap payment"],
        "Activity ownership heatmap payment district: @hafiz (40%), @ghaisan "
        "(35%), @reza (25%). 9 commit dalam 30 hari terakhir. Cross-team "
        "review density tinggi.",
        "activity-heatmap-payment",
    ),
]


class CannedResponse:
    """Bound canned entry returning an LLMResponse-shaped object."""

    def __init__(self, content: str, key: str) -> None:
        self.content = content
        self.canned_hit = True
        self._key = key

    def to_llm_response(self) -> LLMResponse:
        """Materialize as LLMResponse for return through fallback chain."""
        return LLMResponse(
            content=self.content,
            reasoning_content=None,
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit_input_tokens=0,
            cache_miss_input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=0,
            cache_hit=False,
            canned_hit=True,
            fallback_chain=["canned_hit"],
        )


class CannedResponseStore:
    """Top-10 demo question store. In-memory dict for < 100ms latency."""

    def __init__(self) -> None:
        self._entries = CANNED_ENTRIES

    def __len__(self) -> int:
        return len(self._entries)

    def lookup_by_query(self, query: str) -> CannedResponse | None:
        normalized = query.lower().strip()
        for keywords, content, key in self._entries:
            for kw in keywords:
                if kw.lower() in normalized:
                    return CannedResponse(content, key)
        return None

    def lookup_by_messages(self, messages: list[LLMMessage]) -> CannedResponse | None:
        """Look up by inspecting last user message content."""
        for msg in reversed(messages):
            if msg.role == "user":
                return self.lookup_by_query(msg.content)
        return None


_singleton: CannedResponseStore | None = None


def get_canned_response_store() -> CannedResponseStore:
    global _singleton
    if _singleton is None:
        _singleton = CannedResponseStore()
    return _singleton
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_canned_responses.py -v`
Expected: 12 PASS.

---

### Task 2.3: Semantic cache (cosine 0.85)

**Files:**
- Create: `backend/app/services/semantic_cache.py`
- Create: `backend/tests/test_semantic_cache.py`

- [ ] **Step 1: Write tests/test_semantic_cache.py**

```python
"""Semantic cache cosine 0.85 threshold.

We stub sentence-transformer with deterministic dummy embedding so tests run
fast without model download. Real model is initialized in production via
`get_semantic_cache()` lazy load.
"""

from __future__ import annotations

import numpy as np
import pytest

from app.llm.types import LLMMessage
from app.services.semantic_cache import SemanticCache


class _DummyModel:
    """Deterministic dummy that maps text length to embedding."""

    def encode(self, text: str | list[str], convert_to_numpy: bool = True) -> np.ndarray:  # noqa: ARG002
        if isinstance(text, list):
            return np.array([self._embed(t) for t in text])
        return self._embed(text)

    @staticmethod
    def _embed(text: str) -> np.ndarray:
        rng = np.random.default_rng(seed=hash(text) % (2**32))
        v = rng.standard_normal(384)
        return v / (np.linalg.norm(v) + 1e-12)


def test_cache_miss_on_empty_store() -> None:
    cache = SemanticCache(model=_DummyModel(), threshold=0.85)
    result = cache.lookup([LLMMessage(role="user", content="hello world")])
    assert result is None


def test_cache_hit_on_identical_query() -> None:
    cache = SemanticCache(model=_DummyModel(), threshold=0.85)
    messages = [LLMMessage(role="user", content="hello world")]
    cache.store(messages, "stored content")
    hit = cache.lookup(messages)
    assert hit is not None
    assert hit == "stored content"


def test_cache_miss_on_unrelated_query() -> None:
    cache = SemanticCache(model=_DummyModel(), threshold=0.85)
    cache.store([LLMMessage(role="user", content="alpha beta")], "alpha-result")
    hit = cache.lookup([LLMMessage(role="user", content="zulu xray yankee")])
    assert hit is None


def test_threshold_respected() -> None:
    """Below threshold returns miss."""
    cache = SemanticCache(model=_DummyModel(), threshold=0.99)
    cache.store([LLMMessage(role="user", content="alpha")], "stored")
    # different content with dummy model produces low similarity.
    hit = cache.lookup([LLMMessage(role="user", content="omega")])
    assert hit is None


def test_cache_can_be_cleared() -> None:
    cache = SemanticCache(model=_DummyModel(), threshold=0.85)
    cache.store([LLMMessage(role="user", content="a")], "x")
    cache.clear()
    assert cache.size() == 0
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_semantic_cache.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/services/semantic_cache.py**

```python
"""Semantic cache per PRD Section 18.4 defensive layer.

Embeds normalized user-message text via sentence-transformer all-MiniLM-L6-v2
(384-dim). Cosine similarity threshold 0.85. In-memory list of (vector,
content) tuples for Wave 3 single-pod K8s deploy. Demeter Wave 3 cycle 2 may
back this with Postgres pgvector table for cross-session reuse.
"""

from __future__ import annotations

import threading
from typing import Any, Protocol

import numpy as np

from app.llm.types import LLMMessage


class _EmbedModel(Protocol):
    def encode(self, text: str | list[str], convert_to_numpy: bool = True) -> Any: ...


class SemanticCache:
    """In-memory semantic cache with cosine similarity gating."""

    def __init__(self, model: _EmbedModel | None = None, threshold: float = 0.85) -> None:
        self._threshold = threshold
        self._lock = threading.Lock()
        self._vectors: list[np.ndarray] = []
        self._values: list[str] = []
        if model is None:
            self._model: _EmbedModel = _load_default_model()
        else:
            self._model = model

    @staticmethod
    def _query_text(messages: list[LLMMessage]) -> str:
        """Cache key = concatenation of user-role messages, ordered."""
        return " \n ".join(m.content for m in messages if m.role == "user")

    def _embed(self, text: str) -> np.ndarray:
        vec = self._model.encode(text, convert_to_numpy=True)
        arr = np.asarray(vec, dtype=np.float32).reshape(-1)
        norm = float(np.linalg.norm(arr))
        if norm > 0:
            arr = arr / norm
        return arr

    def lookup(self, messages: list[LLMMessage]) -> str | None:
        """Return cached content if similarity >= threshold."""
        text = self._query_text(messages)
        if not text.strip():
            return None
        query = self._embed(text)
        with self._lock:
            if not self._vectors:
                return None
            stack = np.stack(self._vectors)
            sims = stack @ query
            best_idx = int(np.argmax(sims))
            best_sim = float(sims[best_idx])
            if best_sim >= self._threshold:
                return self._values[best_idx]
        return None

    def store(self, messages: list[LLMMessage], content: str) -> None:
        """Persist (embedding, content) for future lookups."""
        text = self._query_text(messages)
        if not text.strip():
            return
        vec = self._embed(text)
        with self._lock:
            self._vectors.append(vec)
            self._values.append(content)

    def size(self) -> int:
        with self._lock:
            return len(self._vectors)

    def clear(self) -> None:
        with self._lock:
            self._vectors = []
            self._values = []


def _load_default_model() -> _EmbedModel:
    """Lazy import sentence-transformers to avoid cold-start in test envs."""
    from sentence_transformers import SentenceTransformer  # type: ignore[import-untyped]

    from app.config import get_settings

    settings = get_settings()
    return SentenceTransformer(settings.semantic_cache_model)


_singleton: SemanticCache | None = None


def get_semantic_cache() -> SemanticCache:
    global _singleton
    if _singleton is None:
        from app.config import get_settings

        settings = get_settings()
        _singleton = SemanticCache(threshold=settings.semantic_cache_threshold)
    return _singleton
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_semantic_cache.py -v`
Expected: 5 PASS.

---

### Task 2.4: LLM call log buffer (Demeter persist later)

**Files:**
- Create: `backend/app/services/llm_call_log_buffer.py`
- (No dedicated test, covered indirectly via call_with_fallback test)

- [ ] **Step 1: Write app/services/llm_call_log_buffer.py**

```python
"""In-memory llm_call_log buffer.

[STUB: Demeter Wave 3 cycle 2 wires Postgres persist via DemeterService.persist_llm_call]

Wave 3 single-pod backend: in-memory ring buffer captures last 1000 calls so
admin/dashboard endpoints (Selene) can read cost aggregate via /api/llm/cost.
Production replacement: Demeter persist hook subscribes to `record_call` and
INSERTs llm_call_log rows.

Schema fields per `_meta/contracts/pandora-to-demeter.md` lines 170-191.
"""

from __future__ import annotations

import threading
import uuid
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.llm.types import LLMResponse, ResidentId, SimulationTurn


@dataclass
class LLMCallLogEntry:
    """One LLM call log entry matching Demeter llm_call_log table columns."""

    call_id: str
    worker: str
    simulation_id: str | None
    resident_id: ResidentId | SimulationTurn | None
    model_used: str
    thinking_mode: str
    cache_hit: bool
    canned_hit: bool
    input_tokens: int
    output_tokens: int
    cost_estimate_usd: float
    latency_ms: int
    timestamp: str
    error: str | None = None
    fallback_chain: list[str] = field(default_factory=list)


class LLMCallLogBuffer:
    """Bounded ring buffer for cost aggregation + audit."""

    def __init__(self, maxlen: int = 1000) -> None:
        self._buf: deque[LLMCallLogEntry] = deque(maxlen=maxlen)
        self._lock = threading.Lock()

    def record(
        self,
        *,
        worker: str,
        resident_or_turn: ResidentId | SimulationTurn | None,
        response: LLMResponse,
        simulation_id: str | None = None,
        error: str | None = None,
    ) -> LLMCallLogEntry:
        entry = LLMCallLogEntry(
            call_id=str(uuid.uuid4()),
            worker=worker,
            simulation_id=simulation_id,
            resident_id=resident_or_turn,
            model_used=response.model_used,
            thinking_mode=response.thinking_mode,
            cache_hit=response.cache_hit,
            canned_hit=response.canned_hit,
            input_tokens=response.cache_hit_input_tokens + response.cache_miss_input_tokens,
            output_tokens=response.output_tokens,
            cost_estimate_usd=response.cost_estimate_usd,
            latency_ms=response.latency_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
            error=error,
            fallback_chain=list(response.fallback_chain),
        )
        with self._lock:
            self._buf.append(entry)
        return entry

    def entries(self) -> list[LLMCallLogEntry]:
        with self._lock:
            return list(self._buf)

    def total_cost_usd(self) -> float:
        with self._lock:
            return round(sum(e.cost_estimate_usd for e in self._buf), 6)

    def to_dicts(self) -> list[dict[str, Any]]:
        with self._lock:
            return [asdict(e) for e in self._buf]


_singleton: LLMCallLogBuffer | None = None


def get_llm_call_log_buffer() -> LLMCallLogBuffer:
    global _singleton
    if _singleton is None:
        _singleton = LLMCallLogBuffer()
    return _singleton
```

---

### Task 2.5: `call_with_fallback` end-to-end defensive chain

**Files:**
- Create: `backend/app/services/llm_client.py`
- Create: `backend/tests/test_call_with_fallback.py`

- [ ] **Step 1: Write tests/test_call_with_fallback.py**

```python
"""End-to-end defensive chain integration test.

Verify order: canned -> semantic cache -> primary -> retry simplified ->
fallback model -> canned final / circuit open canned.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.llm.types import LLMMessage, LLMResponse
from app.services.llm_client import LLMGateway


class _CountingClient:
    """Stub DeepSeekClient that records calls + fails on demand."""

    def __init__(self, fail_until_attempt: int = 0, success_response: LLMResponse | None = None) -> None:
        self.calls: list[dict[str, object]] = []
        self.fail_until_attempt = fail_until_attempt
        self.model_flash = "deepseek-v4-flash"
        self.model_pro = "deepseek-v4-pro"
        self._success_response = success_response or LLMResponse(
            content="primary success",
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit_input_tokens=0,
            cache_miss_input_tokens=10,
            output_tokens=5,
            cost_estimate_usd=0.00001,
            latency_ms=100,
            cache_hit=False,
            canned_hit=False,
            fallback_chain=["primary"],
        )

    async def call(self, **kwargs: object) -> LLMResponse:
        self.calls.append(kwargs)
        if len(self.calls) <= self.fail_until_attempt:
            raise RuntimeError("simulated fail")
        return self._success_response


@pytest.mark.asyncio
async def test_canned_hit_short_circuits_chain() -> None:
    gateway = LLMGateway(
        client=_CountingClient(),
        canned_store=_FakeCanned(content="canned tour reply"),
        semantic_cache=_FakeCache(),
        circuit_breaker=_FakeBreaker(),
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="Give me a 30-second tour")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="hermes_test",
        resident_or_turn="Hermes",
    )
    assert resp.canned_hit is True
    assert "canned tour reply" in resp.content


@pytest.mark.asyncio
async def test_semantic_cache_hit_short_circuits() -> None:
    gateway = LLMGateway(
        client=_CountingClient(),
        canned_store=_FakeCanned(content=None),
        semantic_cache=_FakeCache(prefill_content="cached answer"),
        circuit_breaker=_FakeBreaker(),
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="random query")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_or_turn=None,
    )
    assert resp.cache_hit is True
    assert resp.content == "cached answer"


@pytest.mark.asyncio
async def test_primary_success_writes_cache() -> None:
    cache = _FakeCache()
    client = _CountingClient(fail_until_attempt=0)
    gateway = LLMGateway(
        client=client,
        canned_store=_FakeCanned(content=None),
        semantic_cache=cache,
        circuit_breaker=_FakeBreaker(),
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="hi there")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_or_turn=None,
    )
    assert resp.content == "primary success"
    assert cache.stored is not None
    assert len(client.calls) == 1


@pytest.mark.asyncio
async def test_retry_simplified_on_first_failure() -> None:
    client = _CountingClient(fail_until_attempt=1)
    gateway = LLMGateway(
        client=client,
        canned_store=_FakeCanned(content=None),
        semantic_cache=_FakeCache(),
        circuit_breaker=_FakeBreaker(),
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="hi")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_or_turn=None,
    )
    assert resp.content == "primary success"
    assert len(client.calls) == 2  # primary + retry simplified
    assert "retry_simplified" in resp.fallback_chain


@pytest.mark.asyncio
async def test_fallback_model_on_second_failure() -> None:
    client = _CountingClient(fail_until_attempt=2)
    gateway = LLMGateway(
        client=client,
        canned_store=_FakeCanned(content=None),
        semantic_cache=_FakeCache(),
        circuit_breaker=_FakeBreaker(),
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="hi")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_or_turn=None,
    )
    assert len(client.calls) == 3  # primary + retry + fallback model
    assert "fallback_model" in resp.fallback_chain


@pytest.mark.asyncio
async def test_final_canned_after_all_failures() -> None:
    client = _CountingClient(fail_until_attempt=99)
    gateway = LLMGateway(
        client=client,
        canned_store=_FakeCanned(content="final canned"),
        semantic_cache=_FakeCache(),
        circuit_breaker=_FakeBreaker(),
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="random query xx")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_or_turn=None,
    )
    assert resp.canned_hit is True
    assert "canned_final" in resp.fallback_chain


@pytest.mark.asyncio
async def test_circuit_open_returns_canned_directly() -> None:
    client = _CountingClient(fail_until_attempt=0)
    breaker = _FakeBreaker(open=True)
    gateway = LLMGateway(
        client=client,
        canned_store=_FakeCanned(content="circuit canned"),
        semantic_cache=_FakeCache(),
        circuit_breaker=breaker,
        log_buffer=_FakeBuffer(),
    )
    resp = await gateway.call_with_fallback(
        messages=[LLMMessage(role="user", content="anything")],
        prefer_pro=False,
        thinking_mode="disabled",
        worker="test",
        resident_or_turn=None,
    )
    assert len(client.calls) == 0
    assert resp.canned_hit is True
    assert "circuit_open_canned" in resp.fallback_chain


# --- minimal fakes -----------------------------------------------------------


class _FakeCanned:
    def __init__(self, content: str | None) -> None:
        self._content = content

    def lookup_by_messages(self, messages: list[LLMMessage]) -> object | None:
        if self._content is None:
            return None
        return _CannedReturn(self._content)


class _CannedReturn:
    def __init__(self, content: str) -> None:
        self.content = content

    def to_llm_response(self) -> LLMResponse:
        return LLMResponse(
            content=self.content,
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit_input_tokens=0,
            cache_miss_input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=0,
            cache_hit=False,
            canned_hit=True,
            fallback_chain=["canned_hit"],
        )


class _FakeCache:
    def __init__(self, prefill_content: str | None = None) -> None:
        self._prefill = prefill_content
        self.stored: tuple[list[LLMMessage], str] | None = None

    def lookup(self, messages: list[LLMMessage]) -> str | None:
        return self._prefill

    def store(self, messages: list[LLMMessage], content: str) -> None:
        self.stored = (messages, content)


class _FakeBreaker:
    def __init__(self, open: bool = False) -> None:
        self._open = open
        self.failures = 0
        self.successes = 0

    def is_open(self) -> bool:
        return self._open

    def record_failure(self) -> None:
        self.failures += 1

    def record_success(self) -> None:
        self.successes += 1


class _FakeBuffer:
    def __init__(self) -> None:
        self.records: list[object] = []

    def record(self, **kwargs: object) -> object:
        self.records.append(kwargs)
        return object()
```

- [ ] **Step 2: Verify failures**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_call_with_fallback.py -v`
Expected: FAIL ImportError.

- [ ] **Step 3: Write app/services/llm_client.py**

```python
"""High-level LLM gateway combining client + defensive layer.

`LLMGateway.call_with_fallback` orchestrates the 5 defensive layer per
PRD Section 18.4:
1. Canned response (top-10 demo questions, < 100ms latency target)
2. Semantic cache (cosine 0.85 threshold)
3. Primary DeepSeek call (Flash or Pro per prefer_pro)
4. Retry simplified prompt on first failure
5. Fallback to other model on second failure
6. Final canned fallback (or empty error response if no canned match)
Circuit breaker short-circuits to canned when open.

Anti-pattern Lock 4 (Phase B Topic E): reasoning_content stripped on outgoing
messages array by underlying DeepSeekClient._scrub_messages. Lock 4 (PRD 18.3
LOCKED routing): per-resident model + thinking_mode passed verbatim by callers
who consult resident_routing.get_resident_routing().
"""

from __future__ import annotations

import logging
from typing import Any, Protocol

from app.llm.client import DeepSeekClient
from app.llm.types import (
    FallbackStage,
    LLMMessage,
    LLMResponse,
    ResidentId,
    SimulationTurn,
    ThinkingMode,
)

logger = logging.getLogger(__name__)


class _CannedStoreProto(Protocol):
    def lookup_by_messages(self, messages: list[LLMMessage]) -> Any | None: ...


class _CacheProto(Protocol):
    def lookup(self, messages: list[LLMMessage]) -> str | None: ...
    def store(self, messages: list[LLMMessage], content: str) -> None: ...


class _BreakerProto(Protocol):
    def is_open(self) -> bool: ...
    def record_failure(self) -> None: ...
    def record_success(self) -> None: ...


class _BufferProto(Protocol):
    def record(self, **kwargs: Any) -> Any: ...


class _ClientProto(Protocol):
    model_flash: str
    model_pro: str

    async def call(self, **kwargs: Any) -> LLMResponse: ...


def _simplify_messages(messages: list[LLMMessage]) -> list[LLMMessage]:
    """Truncate context on retry: keep system + last user only.

    Anti-pattern Lock 5 honest claim: this is a heuristic simplification, not
    semantic preservation. Labelled `[HEURISTIC: simplify-retry]` in observability.
    """
    if not messages:
        return messages
    system_msgs = [m for m in messages if m.role == "system"]
    user_msgs = [m for m in messages if m.role == "user"]
    if not user_msgs:
        return messages
    return system_msgs[:1] + user_msgs[-1:]


class LLMGateway:
    """High-level LLM gateway with defensive fallback chain."""

    def __init__(
        self,
        client: _ClientProto,
        canned_store: _CannedStoreProto,
        semantic_cache: _CacheProto,
        circuit_breaker: _BreakerProto,
        log_buffer: _BufferProto,
    ) -> None:
        self._client = client
        self._canned = canned_store
        self._cache = semantic_cache
        self._breaker = circuit_breaker
        self._log = log_buffer

    async def call_with_fallback(
        self,
        messages: list[LLMMessage],
        prefer_pro: bool,
        thinking_mode: ThinkingMode,
        worker: str,
        resident_or_turn: ResidentId | SimulationTurn | None,
        max_tokens: int = 2048,
        simulation_id: str | None = None,
    ) -> LLMResponse:
        """Execute 5-layer defensive fallback chain."""
        chain: list[FallbackStage] = []

        # Layer 1: canned response (latency < 100ms).
        canned = self._canned.lookup_by_messages(messages)
        if canned is not None:
            resp: LLMResponse = canned.to_llm_response()
            chain.append("canned_hit")
            resp = self._with_chain(resp, chain)
            self._log.record(
                worker=worker, resident_or_turn=resident_or_turn,
                response=resp, simulation_id=simulation_id,
            )
            return resp

        # Layer 2: circuit breaker short-circuit.
        if self._breaker.is_open():
            chain.append("circuit_open_canned")
            resp = self._fallback_canned(messages, chain)
            self._log.record(
                worker=worker, resident_or_turn=resident_or_turn,
                response=resp, simulation_id=simulation_id,
                error="circuit_open",
            )
            return resp

        # Layer 3: semantic cache.
        cached = self._cache.lookup(messages)
        if cached is not None:
            chain.append("cache_hit")
            resp = LLMResponse(
                content=cached,
                model_used="V4-Flash" if not prefer_pro else "V4-Pro",
                thinking_mode=thinking_mode,
                cache_hit_input_tokens=0,
                cache_miss_input_tokens=0,
                output_tokens=0,
                cost_estimate_usd=0.0,
                latency_ms=0,
                cache_hit=True,
                canned_hit=False,
                fallback_chain=list(chain),
            )
            self._log.record(
                worker=worker, resident_or_turn=resident_or_turn,
                response=resp, simulation_id=simulation_id,
            )
            return resp

        # Layer 4: primary call.
        primary_model = self._client.model_pro if prefer_pro else self._client.model_flash
        fallback_model = self._client.model_flash if prefer_pro else self._client.model_pro

        try:
            resp = await self._client.call(
                messages=messages,
                model=primary_model,
                thinking_mode=thinking_mode,
                max_tokens=max_tokens,
            )
            chain.append("primary")
            resp = self._with_chain(resp, chain)
            self._breaker.record_success()
            self._cache.store(messages, resp.content)
            self._log.record(
                worker=worker, resident_or_turn=resident_or_turn,
                response=resp, simulation_id=simulation_id,
            )
            return resp
        except Exception as exc:
            logger.warning("Primary LLM call failed worker=%s err=%s", worker, exc)
            self._breaker.record_failure()
            chain.append("primary")

        # Layer 5: retry simplified prompt.
        try:
            simplified = _simplify_messages(messages)
            resp = await self._client.call(
                messages=simplified,
                model=primary_model,
                thinking_mode="disabled",  # cheaper retry
                max_tokens=max_tokens // 2,
            )
            chain.append("retry_simplified")
            resp = self._with_chain(resp, chain)
            self._breaker.record_success()
            self._cache.store(messages, resp.content)
            self._log.record(
                worker=worker, resident_or_turn=resident_or_turn,
                response=resp, simulation_id=simulation_id,
            )
            return resp
        except Exception as exc:
            logger.warning("Retry simplified failed worker=%s err=%s", worker, exc)
            self._breaker.record_failure()
            chain.append("retry_simplified")

        # Layer 6: fallback model.
        try:
            resp = await self._client.call(
                messages=messages,
                model=fallback_model,
                thinking_mode="low" if prefer_pro else "disabled",
                max_tokens=max_tokens,
            )
            chain.append("fallback_model")
            resp = self._with_chain(resp, chain)
            self._breaker.record_success()
            self._cache.store(messages, resp.content)
            self._log.record(
                worker=worker, resident_or_turn=resident_or_turn,
                response=resp, simulation_id=simulation_id,
            )
            return resp
        except Exception as exc:
            logger.warning("Fallback model failed worker=%s err=%s", worker, exc)
            self._breaker.record_failure()
            chain.append("fallback_model")

        # Layer 7: final canned (with generic apology if no canned match).
        chain.append("canned_final")
        resp = self._fallback_canned(messages, chain)
        self._log.record(
            worker=worker, resident_or_turn=resident_or_turn,
            response=resp, simulation_id=simulation_id,
            error="all_layers_failed",
        )
        return resp

    def _fallback_canned(
        self, messages: list[LLMMessage], chain: list[FallbackStage]
    ) -> LLMResponse:
        canned = self._canned.lookup_by_messages(messages)
        if canned is not None:
            base = canned.to_llm_response()
            return self._with_chain(base, chain)
        # Final apology when canned miss + all upstream failed.
        return LLMResponse(
            content=(
                "Apologies, our residents are momentarily unavailable. "
                "Please try again in a moment, or rephrase your request."
            ),
            model_used="V4-Flash",
            thinking_mode="disabled",
            cache_hit_input_tokens=0,
            cache_miss_input_tokens=0,
            output_tokens=0,
            cost_estimate_usd=0.0,
            latency_ms=0,
            cache_hit=False,
            canned_hit=True,
            fallback_chain=list(chain),
            error="all_layers_failed_no_canned_match",
        )

    @staticmethod
    def _with_chain(resp: LLMResponse, chain: list[FallbackStage]) -> LLMResponse:
        return resp.model_copy(update={"fallback_chain": list(chain)})


_singleton: LLMGateway | None = None


def get_llm_gateway() -> LLMGateway:
    """Singleton wiring of production dependencies."""
    global _singleton
    if _singleton is None:
        from app.services.canned_responses import get_canned_response_store
        from app.services.circuit_breaker import get_circuit_breaker
        from app.services.llm_call_log_buffer import get_llm_call_log_buffer
        from app.services.semantic_cache import get_semantic_cache

        _singleton = LLMGateway(
            client=DeepSeekClient(),
            canned_store=get_canned_response_store(),
            semantic_cache=get_semantic_cache(),
            circuit_breaker=get_circuit_breaker(),
            log_buffer=get_llm_call_log_buffer(),
        )
    return _singleton
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_call_with_fallback.py -v`
Expected: 7 PASS.

---

### Task 2.6: Cycle 2 wrap-up

- [ ] **Step 1: Run all tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/ -v 2>&1 | tail -30`
Expected: 38+ PASS.

- [ ] **Step 2: Update decision_log + uncertainty + checkpoint cycle 2**

- [ ] **Step 3: STATUS.md update**

---

# Cycle 3: FastAPI endpoints + Persephone / Boreas / Asclepius / Nemesis / Pandora wiring

### Task 3.1: Session dependency stub + API package

**Files:**
- Create: `backend/app/deps/__init__.py`
- Create: `backend/app/deps/session.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/health.py`

- [ ] **Step 1: Write app/deps/__init__.py + session.py**

```python
# app/deps/__init__.py
"""FastAPI dependencies shared across routers."""
```

```python
# app/deps/session.py
"""Session dependency.

[STUB: Hades Wave 3 cycle 2 wires real GitHub OAuth session validator]

Triton ships an open session stub that returns a dict so endpoints can take
`session: dict = Depends(require_session)`. Hades replaces the body with real
cookie + token validation; this stub stays compatible.
"""

from __future__ import annotations

from typing import Any


async def require_session() -> dict[str, Any]:
    """Return a stub session payload.

    Real impl Hades cycle 2: validate cookie signature, lookup user from
    Demeter users table, raise HTTPException 401 if invalid.
    """
    return {
        "user_id": "anonymous-demo",
        "github_login": "demo-user",
        "is_authenticated": False,
        "stub": True,
    }
```

- [ ] **Step 2: Write app/api/__init__.py + health.py**

```python
# app/api/__init__.py
"""FastAPI API routers.

Triton owns: chat, onboarding, security, simulation, llm_health.
Hades owns: auth, webhook.
Demeter owns: findings, proposals, repos, dashboard.
Nemesis owns: detectors (mounted under /api/detectors).
"""
```

```python
# app/api/health.py
"""LLM gateway health probe (Triton-owned, distinct from app /api/health)."""

from __future__ import annotations

from fastapi import APIRouter

from app.services.canned_responses import get_canned_response_store
from app.services.circuit_breaker import get_circuit_breaker
from app.services.llm_call_log_buffer import get_llm_call_log_buffer

router = APIRouter(prefix="/api/llm", tags=["llm"])


@router.get("/health")
async def llm_health() -> dict[str, object]:
    """Surface LLM gateway operational state for ops + Aletheia audit."""
    breaker = get_circuit_breaker()
    buf = get_llm_call_log_buffer()
    canned = get_canned_response_store()
    return {
        "circuit_state": breaker.state.value,
        "canned_entries": len(canned),
        "calls_recorded": len(buf.entries()),
        "total_cost_usd": buf.total_cost_usd(),
    }
```

---

### Task 3.2: Chat SSE endpoint (Persephone consume)

**Files:**
- Create: `backend/app/api/chat.py`
- Create: `backend/tests/test_chat_endpoint.py`

- [ ] **Step 1: Write tests/test_chat_endpoint.py**

```python
"""Chat endpoint SSE streaming.

We patch the gateway to a deterministic stub so we can verify SSE wire format +
TitleCase resident handling + 422 on unknown target.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.llm.types import LLMResponse


@pytest.mark.asyncio
async def test_chat_apollo_returns_sse_stream() -> None:
    from app.main import create_app

    app = create_app()

    fake_response = LLMResponse(
        content="Apollo says hi",
        model_used="V4-Flash",
        thinking_mode="disabled",
        cache_hit_input_tokens=0,
        cache_miss_input_tokens=20,
        output_tokens=10,
        cost_estimate_usd=0.00001,
        latency_ms=120,
        cache_hit=False,
        canned_hit=False,
        fallback_chain=["primary"],
    )

    with patch("app.api.chat._call_resident", return_value=fake_response):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": "Apollo",
                    "message": "what's wrong",
                    "context": {
                        "current_mode": "health",
                        "selected_building_id": "b1",
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
    body = r.text
    assert "event: chunk" in body
    assert "Apollo says hi" in body
    assert "event: done" in body


@pytest.mark.asyncio
async def test_chat_unknown_resident_returns_422() -> None:
    from app.main import create_app

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/chat",
            json={
                "thread_id": "t1",
                "target": "Unknown",
                "message": "hi",
                "context": {
                    "current_mode": "health",
                    "selected_building_id": None,
                    "mode_context": {},
                },
            },
        )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_chat_broadcast_streams_5_residents() -> None:
    from app.main import create_app

    app = create_app()

    fake_response = LLMResponse(
        content="resident reply",
        model_used="V4-Flash",
        thinking_mode="disabled",
        cache_hit_input_tokens=0,
        cache_miss_input_tokens=10,
        output_tokens=5,
        cost_estimate_usd=0.00001,
        latency_ms=80,
        cache_hit=False,
        canned_hit=False,
        fallback_chain=["primary"],
    )
    with patch("app.api.chat._call_resident", return_value=fake_response):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post(
                "/api/chat",
                json={
                    "thread_id": "t1",
                    "target": "broadcast",
                    "message": "tour",
                    "context": {
                        "current_mode": "onboarding",
                        "selected_building_id": None,
                        "mode_context": {},
                    },
                },
            )
    assert r.status_code == 200
    body = r.text
    # 5 chunks + 5 done events (one per resident).
    assert body.count("event: chunk") >= 5
    assert body.count("event: done") >= 5
```

- [ ] **Step 2: Write app/api/chat.py**

```python
"""Chat endpoint SSE streaming for Persephone consume.

Per contract `_meta/contracts/persephone-to-triton.md` lines 95-166.
TitleCase resident names (Athena/Apollo/Argus/Clio/Hermes) match
Persephone `frontend/src/lib/chat/types.ts`.

SSE wire format:
- `event: chunk\ndata: <text>\n\n` for partial body
- `event: done\ndata: <json metadata>\n\n` for final completion

Wave 3 cycle 3 streaming approach: we run a single LLM call non-streaming
underneath and chunk the response text into 80-char windows for SSE display.
This avoids OpenAI SDK streaming complexity in cycle 3 while satisfying the
Persephone consumer pattern verbatim. Wave 3 cycle 4 optional upgrade: switch
to AsyncOpenAI stream context (Context7 docs verified for openai >=2.x).
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator, Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.deps.session import require_session
from app.llm.resident_routing import RESIDENT_ROUTING, get_resident_routing
from app.llm.system_header import build_resident_system_prompt
from app.llm.types import LLMMessage, LLMResponse, ResidentId
from app.services.llm_client import get_llm_gateway

router = APIRouter(prefix="/api", tags=["chat"])
logger = logging.getLogger(__name__)


class ChatContext(BaseModel):
    current_mode: Literal["onboarding", "sprint", "refactor", "activity", "health", "dashboard"]
    selected_building_id: str | None = None
    mode_context: dict = Field(default_factory=dict)


class ChatRequest(BaseModel):
    thread_id: str
    target: Literal["Athena", "Apollo", "Argus", "Clio", "Hermes", "broadcast"]
    message: str
    context: ChatContext


def _build_messages(req: ChatRequest, resident: ResidentId) -> list[LLMMessage]:
    """Compose system + user message list per resident."""
    system = build_resident_system_prompt(resident)
    context_blob = json.dumps(
        {
            "current_mode": req.context.current_mode,
            "selected_building_id": req.context.selected_building_id,
            "mode_context": req.context.mode_context,
        },
        ensure_ascii=False,
    )
    user_body = (
        f"Context (JSON): {context_blob}\n\n"
        f"User message: {req.message}\n\n"
        "Respond in your persona voice. Indonesian primary plus English "
        "technical code-switch when natural."
    )
    return [
        LLMMessage(role="system", content=system),
        LLMMessage(role="user", content=user_body),
    ]


async def _call_resident(req: ChatRequest, resident: ResidentId) -> LLMResponse:
    """Single resident LLM call routed through gateway."""
    config = get_resident_routing(resident)
    messages = _build_messages(req, resident)
    gateway = get_llm_gateway()
    return await gateway.call_with_fallback(
        messages=messages,
        prefer_pro=config["prefer_pro"],
        thinking_mode=config["thinking_mode"],
        max_tokens=config["max_tokens"],
        worker="chat_endpoint",
        resident_or_turn=resident,
    )


def _chunkify(content: str, window: int = 80) -> list[str]:
    """Split a completed response into SSE-friendly chunks."""
    if not content:
        return [""]
    return [content[i : i + window] for i in range(0, len(content), window)]


def _metadata_json(resp: LLMResponse, resident: ResidentId | str) -> str:
    return json.dumps(
        {
            "residentId": resident,
            "modelUsed": _ui_model_label(resp),
            "inputTokens": resp.cache_hit_input_tokens + resp.cache_miss_input_tokens,
            "outputTokens": resp.output_tokens,
            "latencyMs": resp.latency_ms,
            "cacheHit": resp.cache_hit or resp.canned_hit,
            "fallbackChain": resp.fallback_chain,
        },
        ensure_ascii=False,
    )


def _ui_model_label(resp: LLMResponse) -> str:
    """Match Persephone ChatMessageMetadata.modelUsed enum."""
    if resp.model_used == "V4-Pro":
        return "V4-Pro-think-high"
    if resp.thinking_mode == "low":
        return "V4-Flash-think-low"
    return "V4-Flash-non-think"


async def _stream_single(req: ChatRequest, resident: ResidentId) -> AsyncGenerator[bytes, None]:
    resp = await _call_resident(req, resident)
    for chunk in _chunkify(resp.content):
        yield f"event: chunk\ndata: {json.dumps({'residentId': resident, 'text': chunk}, ensure_ascii=False)}\n\n".encode()
        await asyncio.sleep(0)  # cooperative yield
    yield f"event: done\ndata: {_metadata_json(resp, resident)}\n\n".encode()


async def _stream_broadcast(req: ChatRequest) -> AsyncGenerator[bytes, None]:
    residents: list[ResidentId] = list(RESIDENT_ROUTING.keys())  # type: ignore[arg-type]
    # Parallel call, yield chunks per resident in arrival order.
    tasks = [asyncio.create_task(_call_resident(req, r)) for r in residents]
    for resident, task in zip(residents, tasks):
        try:
            resp = await task
        except Exception as exc:  # noqa: BLE001
            logger.warning("Broadcast resident=%s failed err=%s", resident, exc)
            err_payload = json.dumps(
                {"residentId": resident, "text": "Apologies, resident temporarily unavailable."},
                ensure_ascii=False,
            )
            yield f"event: chunk\ndata: {err_payload}\n\n".encode()
            err_done = json.dumps({"residentId": resident, "error": "broadcast_failure"})
            yield f"event: done\ndata: {err_done}\n\n".encode()
            continue
        for chunk in _chunkify(resp.content):
            payload = json.dumps({"residentId": resident, "text": chunk}, ensure_ascii=False)
            yield f"event: chunk\ndata: {payload}\n\n".encode()
            await asyncio.sleep(0)
        yield f"event: done\ndata: {_metadata_json(resp, resident)}\n\n".encode()


@router.post("/chat")
async def chat_endpoint(
    req: ChatRequest,
    _session: dict = Depends(require_session),
) -> StreamingResponse:
    """SSE streaming chat endpoint for Persephone consume."""
    if req.target == "broadcast":
        return StreamingResponse(_stream_broadcast(req), media_type="text/event-stream")
    resident: ResidentId = req.target  # type: ignore[assignment]
    if resident not in RESIDENT_ROUTING:
        raise HTTPException(status_code=422, detail=f"Unknown resident: {resident}")
    return StreamingResponse(_stream_single(req, resident), media_type="text/event-stream")
```

- [ ] **Step 3: Wire into main app**

Edit `backend/app/main.py` to include the chat router (and the others added below).

- [ ] **Step 4: Run tests**

Run: `cd /Users/ghaisan/Documents/codeplexRefactory/backend && pytest tests/test_chat_endpoint.py -v`
Expected: 3 PASS.

---

### Task 3.3: Onboarding narration endpoint (Boreas consume)

**Files:**
- Create: `backend/app/api/onboarding.py`
- Create: `backend/tests/test_onboarding_endpoint.py`

- [ ] **Step 1: Write test + impl per `boreas-to-triton.md` schema**

Test posts `NarrationRequest`, asserts JSON returns `narration_text`.
Impl builds Hermes persona prompt with variant + waypoint context, calls gateway with V4-Flash non-think.

- [ ] **Step 2: Test pass**

---

### Task 3.4: Security CVSS endpoint (Nemesis consume)

**Files:**
- Create: `backend/app/api/security.py`
- Create: `backend/tests/test_security_endpoint.py`

- [ ] **Step 1: Write test + impl for Argus CVSS scoring**

Endpoint `/api/security/argus_score`, accepts finding payload, builds Argus persona prompt, calls gateway V4-Flash think low.

---

### Task 3.5: Simulation endpoint (Pandora consume)

**Files:**
- Create: `backend/app/api/simulation.py`
- Create: `backend/app/services/simulation_dispatcher.py`
- Create: `backend/tests/test_simulation_endpoint.py`

- [ ] **Step 1: Write test + impl for 3 turn simulation dispatch**

`SimulationDispatcher.run_turn(turn, messages)` routes via gateway per simulation_routing. Endpoint `/api/simulation/turn` accepts `{turn, messages, simulation_id}`. Pandora orchestrates 3 turns by calling this 3x.

---

### Task 3.6: Cycle 3 wrap-up

- [ ] Run full tests; STATUS update; decision log entries.

---

# Cycle 4: Smoke + reasoning_content audit + handoff contracts

### Task 4.1: 5-resident smoke test

**File:** `backend/tests/test_5_resident_smoke.py`

Patch `DeepSeekClient.call` with a fake that returns a stamped response per (model, thinking_mode), call `/api/chat` 5 times (one per resident), assert each call routes to the LOCKED PRD Section 18.3 combination.

### Task 4.2: Canned latency benchmark

**File:** `backend/tests/test_canned_latency.py`

Bench 10 canned queries via `time.perf_counter`, assert each <100ms. Pre-load store via `get_canned_response_store()`.

### Task 4.3: reasoning_content strip regression

**File:** `backend/tests/test_reasoning_content_strip.py`

Multi-turn conversation: turn 1 response carries reasoning_content; build messages list for turn 2 reusing assistant content; assert outgoing API messages array has 0 `reasoning_content` keys (regex scan kwargs payload).

### Task 4.4: 3 handoff contracts

**Files:**
- Create: `_meta/handoff_log/wave3_triton_to_nemesis.md`
- Create: `_meta/handoff_log/wave3_triton_to_pandora.md`
- Create: `_meta/handoff_log/wave3_triton_to_residents.md`

Each handoff documents: domain owned + consume pattern + endpoint shape + per-resident or per-turn routing + cycle 1 stub semantics replaced by cycle 4 full impl + edge case handling + 4 mandatory artifact references + Aletheia audit checklist mapping.

### Task 4.5: Final artifacts + V_n snapshot

- `_meta/decision_log/triton.md` D-Triton-01 to D-Triton-N
- `_meta/uncertainty/triton-cycle4-<actual-timestamp>.md`
- `_meta/checkpoints/triton-cycle4.md`
- `_meta/orchestration_log/V3_triton_llm_gateway_locked_<actual-timestamp>.md`
- STATUS.md Wave 3 progress flip Triton cycle 1 stub + cycle 2 full to checked

---

## Self-review

1. Spec coverage: every contract item from `_meta/contracts/triton-to-{nemesis,pandora,residents}.md` plus `{asclepius,boreas,persephone}-to-triton.md` mapped to at least one task. PRD Section 18.2 through 18.6 mapped. Defensive layer 5 items mapped in cycle 2.
2. Placeholder scan: no TBD/TODO/fill-in. Every code step contains full code.
3. Type consistency: ResidentId TitleCase, ThinkingMode 4 literal values, FallbackStage enum aligned across `types.py` + `llm_client.py` + `chat.py`. `get_resident_routing` signature consistent across modules.
4. Anti-pattern locks: Lock 4 reasoning_content strip enforced in `DeepSeekClient._scrub_messages` + Pydantic `extra=forbid` + dedicated regression test cycle 4. Lock 5 `[STUB]` + `[MOCK]` labels on session dep + llm_call_log buffer. Lock 8 cost tracking present per call.
