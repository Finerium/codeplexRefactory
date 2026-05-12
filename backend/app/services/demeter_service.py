"""Demeter service Protocol-based stub (Hades Wave 3 cycle 1).

Hades imports this stub for type safety during OAuth callback + webhook
event persist paths. Demeter worker (Wave 3 sibling, parallel spawn batch)
ships real SQLAlchemy + asyncpg impl that replaces this stub in cycle 2.

Schema matches `_meta/contracts/hades-to-demeter.md` lines 22-99 verbatim.

Cycle 1 status: STUB. Real impl by Demeter cycle 2.
Cycle 2 status: STUB (Demeter cycle 2 drops real DemeterService into this
                module so Hades imports remain unchanged).

[STUB: real persistence impl owned by Demeter worker]
"""
from __future__ import annotations

import logging
from typing import Literal, Protocol

from pydantic import BaseModel, Field

logger = logging.getLogger("hades.demeter_stub")


# ---------- Pydantic payload schemas (Hades produces, Demeter consumes) ----------


class GitHubUserUpsert(BaseModel):
    """User upsert payload Hades sends after successful OAuth callback."""

    github_id: int
    github_login: str
    avatar_url: str
    encrypted_access_token: str
    scopes: list[str]
    last_login_at: str


class PREventPersist(BaseModel):
    """PR event persist payload Hades sends after webhook receipt + translation."""

    event_type: Literal[
        "pr.opened",
        "pr.review_requested",
        "pr.approved",
        "pr.merged",
        "pr.closed",
        "issue.opened",
        "issue.closed",
        "comment.created",
        "comment.resolved",
        "ci.fail",
        "ci.pass",
        "dependency.added",
        "dependency.removed",
        "sprint.transition",
    ]
    delivery_id: str
    building_id: str | None = None
    repo_full_name: str
    resource_number: int
    resource_title: str = ""
    author_login: str = ""
    files_changed: list[str] = Field(default_factory=list)
    lines_added: int | None = None
    lines_deleted: int | None = None
    story_points: int | None = None
    assignee_login: str | None = None
    payload: dict = Field(default_factory=dict)
    received_at: str


# ---------- Service Protocol ----------


class DemeterServiceProtocol(Protocol):
    """Demeter service interface.

    Cycle 1 stub satisfies this Protocol so Hades type-checks. Cycle 2 real
    impl by Demeter worker swaps in the SQLAlchemy + asyncpg version.
    """

    async def upsert_user(self, user: GitHubUserUpsert) -> None: ...

    async def persist_pr_event(self, event: PREventPersist) -> None: ...


# ---------- Stub impl (Hades cycle 1) ----------


class _StubDemeterService:
    """Cycle 1 stub: log payloads, no DB write.

    Demeter cycle 2 replaces with real impl.
    """

    def __init__(self) -> None:
        # Diagnostic in-memory log so tests can assert payload structure.
        self.upsert_calls: list[GitHubUserUpsert] = []
        self.persist_calls: list[PREventPersist] = []

    async def upsert_user(self, user: GitHubUserUpsert) -> None:
        self.upsert_calls.append(user)
        logger.info(
            "[STUB DemeterService.upsert_user] github_id=%s login=%s scopes=%s",
            user.github_id,
            user.github_login,
            user.scopes,
        )

    async def persist_pr_event(self, event: PREventPersist) -> None:
        self.persist_calls.append(event)
        logger.info(
            "[STUB DemeterService.persist_pr_event] type=%s delivery_id=%s "
            "repo=%s resource=%s building=%s",
            event.event_type,
            event.delivery_id,
            event.repo_full_name,
            event.resource_number,
            event.building_id,
        )


_demeter_singleton: DemeterServiceProtocol | None = None


def get_demeter_service() -> DemeterServiceProtocol:
    """Singleton accessor.

    Cycle 1 returns stub. When Demeter cycle 2 ships, this function returns
    the real service (Demeter monkey-patches `_demeter_singleton` OR swaps
    factory; final mechanism decided by Demeter worker handoff).
    """
    global _demeter_singleton
    if _demeter_singleton is None:
        _demeter_singleton = _StubDemeterService()
    return _demeter_singleton


def set_demeter_service(svc: DemeterServiceProtocol) -> None:
    """Demeter worker calls this to install real impl in cycle 2.

    Also used by tests to install mock.
    """
    global _demeter_singleton
    _demeter_singleton = svc


def reset_demeter_service() -> None:
    """Test helper: reset to stub."""
    global _demeter_singleton
    _demeter_singleton = None
