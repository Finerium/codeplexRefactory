"""pytest fixtures (Hades Wave 3 + Pandora shared)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure backend/ on sys.path when pytest runs from project root.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

# Inject minimal env vars before any backend module loads. .env in project
# root is loaded by pydantic-settings, but tests should not depend on dev
# .env being present. These match shape (not real values) for type-check pass.
os.environ.setdefault("GITHUB_CLIENT_ID", "Ov23test_client_id_xxxx")
os.environ.setdefault(
    "GITHUB_CLIENT_SECRET", "0000000000000000000000000000000000000000"
)
os.environ.setdefault(
    "GITHUB_OAUTH_REDIRECT_URI",
    "http://localhost:8000/api/auth/github/callback",
)
os.environ.setdefault(
    "GITHUB_OAUTH_SCOPES",
    "read:repo,read:org,read:issues,read:pull_requests,write:issues",
)
os.environ.setdefault(
    "GITHUB_WEBHOOK_SECRET",
    "test-webhook-secret-32bytes-hex-deadbeef-cafe1234",
)
os.environ.setdefault("DEEPSEEK_API_KEY", "sk-test-key")
os.environ.setdefault(
    "DATABASE_URL", "postgresql://test:test@localhost:5432/test"
)
os.environ.setdefault(
    "SESSION_SECRET", "test-session-secret-rotate-before-deploy-32bytes-min"
)
os.environ.setdefault("APP_ENV", "development")

# Disable Demeter real-service auto-registration in tests so Hades stub
# semantics (persist_calls list) remain testable. Live-Postgres Demeter tests
# (test_demeter_persist_live.py) build their own pool explicitly via fixture.
os.environ.setdefault("DEMETER_DISABLE_REAL", "1")


@pytest.fixture(autouse=True)
def reset_singletons() -> None:
    """Reset module-level singletons between tests."""
    from app.parsers.service import reset_parser_service
    from app.services.demeter_service import reset_demeter_service
    from app.services.event_bus import reset_event_bus

    reset_parser_service()
    reset_event_bus()
    reset_demeter_service()


@pytest.fixture
def client():
    """FastAPI TestClient (sync, uses httpx under the hood)."""
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:
        yield c
