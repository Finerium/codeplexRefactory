# Contract: Hades to Demeter

**Edge type**: intra-wave (Wave 3 internal)
**Wave**: Wave 3 producer to Wave 3 consumer
**Status**: locked
**Authored**: 2026-05-12 15:56 WIB

## Producer

**Worker**: Hades (Wave 3)
**Domain**: GitHub OAuth real flow (start + callback) + webhook receiver HMAC + WebSocket setup. Hades publishes two distinct event streams to Demeter: (1) OAuth callback completion persists user + token, (2) webhook events translated to BuildingEvent (see `hera-to-hades.md`) need persisting to `pr_events` event store.

## Consumer

**Worker**: Demeter (Wave 3)
**Domain**: PostgreSQL event store schema (`pr_events`, `simulation_events`, `finding_events`, `llm_call_log`, `drift_log`) + cache layer + 1-click GitHub issue + ticket aggregation + cost tracking + OpenSpec runtime. Demeter receives Hades's OAuth completion + webhook event publish + persists to Postgres tables.

## Output schema (producer to consumer)

Hades calls Demeter service via Python in-process function call (FastAPI dependency injection).

```python
# backend/app/services/demeter_service.py (Demeter authors)
from pydantic import BaseModel
from typing import Literal
from datetime import datetime


class GitHubUserUpsert(BaseModel):
    """User upsert payload Hades sends after successful OAuth callback."""
    github_id: int  # GitHub's stable user id
    github_login: str
    avatar_url: str
    /** Encrypted token, encrypted at rest via SESSION_SECRET. */
    encrypted_access_token: str
    /** Scopes granted (read:repo read:org read:issues read:pull_requests write:issues). */
    scopes: list[str]
    /** Timestamp ISO 8601 of last login. */
    last_login_at: str


class PREventPersist(BaseModel):
    """PR event persist payload Hades sends after webhook receipt + translation."""
    event_type: Literal[
        "pr.opened", "pr.review_requested", "pr.approved",
        "pr.merged", "pr.closed", "issue.opened",
        "issue.closed", "comment.created",
    ]
    /** GitHub delivery id for idempotency. */
    delivery_id: str
    /** Building id affected (resolved via parser before persist). */
    building_id: str | None
    /** Repo full name (owner/repo). */
    repo_full_name: str
    /** PR or issue number. */
    resource_number: int
    /** Resource title. */
    resource_title: str
    /** Author github login. */
    author_login: str
    /** Files changed (PRs only). */
    files_changed: list[str]
    /** Lines added (PRs only). */
    lines_added: int | None
    /** Lines deleted (PRs only). */
    lines_deleted: int | None
    /** Story points (issues only, parsed from labels). */
    story_points: int | None
    /** Assignee github login (issues only). */
    assignee_login: str | None
    /** Event-specific payload JSON (flexible schema). */
    payload: dict
    /** Webhook receipt timestamp ISO 8601. */
    received_at: str


class DemeterService:
    """Demeter's API surface for Hades + other Wave 3 workers."""

    async def upsert_user(self, user: GitHubUserUpsert) -> None:
        """Upserts user row in `users` table.

        ON CONFLICT (github_id) DO UPDATE SET
          github_login, avatar_url, encrypted_access_token, scopes, last_login_at.
        """
        ...

    async def persist_pr_event(self, event: PREventPersist) -> None:
        """Inserts row in `pr_events` table.

        UNIQUE constraint on (delivery_id) for idempotency.
        Triggers materialized view refresh schedule (async).
        """
        ...


def get_demeter_service() -> DemeterService:
    """Singleton accessor."""
    ...
```

Hades consumer pattern:

```python
# backend/app/api/auth.py (Hades) - OAuth callback
from app.services.demeter_service import get_demeter_service, GitHubUserUpsert

@router.get("/github/callback")
async def github_oauth_callback(...):
    # ... validate state, exchange code for token ...
    demeter = get_demeter_service()
    await demeter.upsert_user(GitHubUserUpsert(
        github_id=github_user["id"],
        github_login=github_user["login"],
        avatar_url=github_user["avatar_url"],
        encrypted_access_token=encrypt(access_token),
        scopes=scopes,
        last_login_at=datetime.utcnow().isoformat(),
    ))
    # ... set session cookie, redirect to /city ...
```

```python
# backend/app/api/webhook.py (Hades) - webhook receiver
from app.services.demeter_service import get_demeter_service, PREventPersist

@router.post("/api/webhook/github")
async def github_webhook(...):
    # ... verify HMAC, translate event ...
    demeter = get_demeter_service()
    for building_event in translated_events:
        await demeter.persist_pr_event(PREventPersist(
            event_type=building_event.type,
            delivery_id=request.headers["X-GitHub-Delivery"],
            building_id=building_event.building_id,
            repo_full_name=payload["repository"]["full_name"],
            resource_number=building_event.resource_number,
            ...
        ))
        await event_bus.publish(building_event)  # to WebSocket subscribers
```

Postgres schema (Demeter authors):

```sql
-- backend/migrations/versions/001_initial_schema.py (Demeter via Alembic)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    github_login TEXT NOT NULL,
    avatar_url TEXT,
    encrypted_access_token TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    last_login_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pr_events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    delivery_id TEXT UNIQUE NOT NULL,
    building_id TEXT,
    repo_full_name TEXT NOT NULL,
    resource_number INTEGER NOT NULL,
    resource_title TEXT,
    author_login TEXT,
    files_changed TEXT[],
    lines_added INTEGER,
    lines_deleted INTEGER,
    story_points INTEGER,
    assignee_login TEXT,
    payload JSONB,
    received_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX pr_events_repo_idx ON pr_events(repo_full_name);
CREATE INDEX pr_events_building_idx ON pr_events(building_id);
CREATE INDEX pr_events_received_idx ON pr_events(received_at);
```

## Storage location

- Demeter service interface: `backend/app/services/demeter_service.py` (Demeter authors; Hades imports)
- Migration: `backend/migrations/versions/001_initial_schema.py` (Demeter authors Alembic migration)
- Encryption helper: `backend/app/services/crypto.py` (Demeter authors; SESSION_SECRET-based AEAD)
- Used by: `backend/app/api/auth.py` + `backend/app/api/webhook.py` (Hades)

## Asumption baked

1. Postgres connection via DATABASE_URL env var (URL-encoded special chars per sourceoftruth Section 3.3); SQLAlchemy + asyncpg auto-decode.
2. Encryption at rest for access tokens: AEAD via cryptography library (AES-256-GCM) keyed by SESSION_SECRET; key rotation deferred.
3. Idempotency via delivery_id UNIQUE constraint; duplicate webhook events (GitHub retry) return success without re-insert.
4. Materialized views (cycle_time_aggregate, lead_time_aggregate, ownership_distribution) refreshed on pr_event insert via pg_cron or FastAPI background task (OQ-04 manual cron).
5. Hades does NOT directly query Postgres; routes through Demeter service for separation of concerns.
6. Demeter handles connection pooling; Hades just calls service methods.

## Validation steps

**Producer responsibility (Hades)**:
- OAuth callback persists user before setting session cookie; failure to persist = 500 with rollback.
- Webhook receiver verifies HMAC + dedupes by delivery_id before publishing event.
- Translates GitHub webhook event types to BuildingEvent types correctly.
- Calls Demeter persist with all required fields populated.

**Consumer responsibility (Demeter)**:
- Migration creates `users` + `pr_events` tables + indexes on first deploy.
- Service methods are idempotent: upsert_user returns success on existing record + updates fields; persist_pr_event returns success on existing delivery_id without re-insert.
- Encryption at rest: encrypted_access_token never logged or exposed in error messages.
- Smoke test: simulated webhook event from demo repo persists row in pr_events; OAuth callback persists user row.

## Edge case handling

- Database connection failure: Hades retries up to 2 times with exponential backoff; if persistent, returns 503 to webhook (GitHub retries) or 500 to OAuth callback (user sees error).
- Webhook event with missing fields (malformed payload): Hades logs + skips persist; does not publish to WebSocket either (event broken).
- User row exists but token refresh needed: not applicable (read-only scopes don't issue refresh tokens); user re-auths if token revoked.
- Materialized view refresh fails: Demeter logs + retries; old views remain serving until refresh succeeds.

## Open questions

- OQ-01 (FastAPI BackgroundTasks vs Celery): Metis recommends BackgroundTasks; Demeter materialized view refresh uses BackgroundTasks. Celery overkill for hackathon scope.
- Token rotation: deferred Wave 3; production hardening only.
- Webhook event ordering: GitHub does not guarantee strict order; Demeter persists in receipt order, dashboards aggregate by GitHub-provided event timestamps (separate from received_at).

## Reference

- Metis Agentic Structure md Section 2 DAG: Hades OAuth + webhook event payload consumed by Demeter event ingestion
- Metis Section 5.6 Hades + Demeter ship criteria
- PRD Section 17 (Postgres + Alembic + SQLAlchemy stack)
- PRD Section 18.7 (event store schema overview)
- PRD Section 19 (Security, OAuth scope minimization + webhook HMAC mandatory)
- sourceoftruth Section 3.3 (Refactory Postgres credentials live)
- Contract `hera-to-hades.md` (BuildingEvent schema feeding webhook translation)
- Contract `hestia-to-hades.md` (OAuth flow schema)
