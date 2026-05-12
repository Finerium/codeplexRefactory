"""Semantic cache (Triton Wave 3 defensive layer).

Owner: Triton (Wave 3).

Embeds normalized user-message text via sentence-transformer
``all-MiniLM-L6-v2`` (384-dim). Cosine similarity threshold 0.85 per PRD
Section 18.4. In-memory list of (vector, content) tuples for Wave 3 single
K8s pod. Demeter Wave 3 cycle 2 may back this with Postgres pgvector for
cross-session reuse (table ``semantic_cache_embeddings`` per Pythia contract).

Lazy model load: ``sentence-transformers`` import deferred until first
production call so unit tests can inject a deterministic dummy model.
Production cold start: about 4 seconds on M-series for the MiniLM model.

Compliance:
- Lock 1 (no em dash): clean.
- Lock 2 (no emoji): clean.
- Lock 5 (honest claim): in-memory store documented Wave 3 only.
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Protocol

import numpy as np

from app.llm.types import LLMMessage

logger = logging.getLogger(__name__)


class _EmbedModel(Protocol):
    """Minimal interface satisfied by ``sentence_transformers.SentenceTransformer``
    plus by test stubs.
    """

    def encode(self, text: str | list[str], convert_to_numpy: bool = True) -> Any: ...


class SemanticCache:
    """In-memory semantic cache with cosine similarity gating."""

    def __init__(
        self,
        model: _EmbedModel | None = None,
        threshold: float = 0.85,
    ) -> None:
        self._threshold = threshold
        self._lock = threading.Lock()
        self._vectors: list[np.ndarray] = []
        self._values: list[str] = []
        self._model: _EmbedModel | None = model  # lazy default load on first lookup

    # ----- public API ------------------------------------------------------

    def size(self) -> int:
        with self._lock:
            return len(self._vectors)

    def clear(self) -> None:
        with self._lock:
            self._vectors = []
            self._values = []

    def lookup(self, messages: list[LLMMessage]) -> str | None:
        """Return cached content when best-match cosine similarity meets threshold."""
        text = self._query_text(messages)
        if not text.strip():
            return None
        try:
            query = self._embed(text)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Semantic cache embed failed err=%s", exc)
            return None
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
        """Persist embedding + content for future lookups."""
        text = self._query_text(messages)
        if not text.strip() or not content.strip():
            return
        try:
            vec = self._embed(text)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Semantic cache store embed failed err=%s", exc)
            return
        with self._lock:
            self._vectors.append(vec)
            self._values.append(content)

    # ----- helpers ---------------------------------------------------------

    @staticmethod
    def _query_text(messages: list[LLMMessage]) -> str:
        """Cache key: concatenation of user-role messages, ordered."""
        return " \n ".join(m.content for m in messages if m.role == "user")

    def _embed(self, text: str) -> np.ndarray:
        model = self._ensure_model()
        vec = model.encode(text, convert_to_numpy=True)
        arr = np.asarray(vec, dtype=np.float32).reshape(-1)
        norm = float(np.linalg.norm(arr))
        if norm > 0:
            arr = arr / norm
        return arr

    def _ensure_model(self) -> _EmbedModel:
        if self._model is not None:
            return self._model
        # Lazy default load: avoid sentence-transformers import in tests.
        from sentence_transformers import SentenceTransformer  # type: ignore[import-untyped]

        from app.config import get_settings

        settings = get_settings()
        model_name = getattr(
            settings, "SEMANTIC_CACHE_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        )
        logger.info("Loading sentence-transformer model=%s", model_name)
        self._model = SentenceTransformer(model_name)
        return self._model


# ----- singleton accessor -------------------------------------------------


_singleton: SemanticCache | None = None


def get_semantic_cache() -> SemanticCache:
    global _singleton
    if _singleton is None:
        from app.config import get_settings

        settings = get_settings()
        threshold = float(
            getattr(settings, "SEMANTIC_CACHE_THRESHOLD", 0.85) or 0.85
        )
        _singleton = SemanticCache(threshold=threshold)
    return _singleton


def reset_semantic_cache() -> None:
    """Test helper."""
    global _singleton
    _singleton = None


__all__ = [
    "SemanticCache",
    "get_semantic_cache",
    "reset_semantic_cache",
]
