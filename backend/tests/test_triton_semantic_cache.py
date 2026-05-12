"""Semantic cache cosine threshold (Triton Wave 3 Cycle 2).

Tests inject a deterministic dummy embedder so the real sentence-transformers
model is not downloaded in CI. The production model load is exercised
indirectly via integration smoke later.

Run locally:
    cd backend
    python -m pytest tests/test_triton_semantic_cache.py -v

Compliance: Lock 1 (no em dash). Lock 2 (no emoji).
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.llm.types import LLMMessage
from app.services.semantic_cache import SemanticCache


class _DummyEmbedder:
    """Hash-seeded deterministic embedder for offline tests."""

    def encode(self, text: str | list[str], convert_to_numpy: bool = True) -> np.ndarray:  # noqa: ARG002
        if isinstance(text, list):
            return np.array([self._embed(t) for t in text])
        return self._embed(text)

    @staticmethod
    def _embed(text: str) -> np.ndarray:
        rng = np.random.default_rng(seed=abs(hash(text)) % (2**32))
        v = rng.standard_normal(384)
        return v / (np.linalg.norm(v) + 1e-12)


def test_cache_miss_on_empty_store() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    result = cache.lookup([LLMMessage(role="user", content="hello world")])
    assert result is None


def test_cache_hit_on_identical_query() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    messages = [LLMMessage(role="user", content="hello world")]
    cache.store(messages, "stored content")
    hit = cache.lookup(messages)
    assert hit == "stored content"


def test_cache_miss_on_unrelated_query() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    cache.store([LLMMessage(role="user", content="alpha beta gamma")], "alpha-content")
    hit = cache.lookup([LLMMessage(role="user", content="zulu xray yankee quebec")])
    assert hit is None


def test_threshold_respected_high() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.999)
    cache.store([LLMMessage(role="user", content="alpha")], "stored")
    hit = cache.lookup([LLMMessage(role="user", content="omega")])
    assert hit is None


def test_store_skips_empty_messages() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    cache.store([], "should-not-store")
    assert cache.size() == 0


def test_lookup_skips_empty_messages() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    cache.store([LLMMessage(role="user", content="hi")], "stored")
    assert cache.lookup([]) is None


def test_clear_drops_everything() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    cache.store([LLMMessage(role="user", content="alpha")], "x")
    cache.store([LLMMessage(role="user", content="beta")], "y")
    assert cache.size() == 2
    cache.clear()
    assert cache.size() == 0


def test_lookup_uses_only_user_messages_as_key() -> None:
    cache = SemanticCache(model=_DummyEmbedder(), threshold=0.85)
    cache.store([LLMMessage(role="user", content="alpha key")], "alpha-value")
    # Same user content but different system prefix should still hit.
    hit = cache.lookup(
        [
            LLMMessage(role="system", content="different system"),
            LLMMessage(role="user", content="alpha key"),
        ]
    )
    assert hit == "alpha-value"
