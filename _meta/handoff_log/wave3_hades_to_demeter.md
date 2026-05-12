# Handoff Log: Hades Wave 3 to Demeter Wave 3 (intra-wave)

**Edge**: intra-wave (Wave 3 internal, parallel-spawn batch)
**Contract**: `_meta/contracts/hades-to-demeter.md` (locked Wave 0 Pythia)
**Date**: 2026-05-12 21:50 WIB
**Producer**: Hades (Wave 3, FastAPI foundation + OAuth + webhook receiver)
**Consumer**: Demeter (Wave 3, PostgreSQL event store + SQLAlchemy + Alembic
              + cache layer + 1-click issue + cost tracking + materialized
              views + OpenSpec runtime)
**Status**: Hades SHIP CLEAN. Demeter parallel-spawn ships cycle 1 stub +
cycle 2 full SQLAlchemy in parallel batch. Hades exposes Protocol-typed stub
for type-safe call sites; Demeter swaps in real persist via
`set_demeter_service()`.

## What Hades delivers for Demeter to wire into

### Protocol-typed service stub

```python
# backend/app/services/demeter_service.py (Hades-authored stub)

class DemeterServiceProtocol(Protocol):
    async def upsert_user(self, user: GitHubUserUpsert) -> None: ...
    async def persist_pr_event(self, event: PREventPersist) -> None: ...

class _StubDemeterService:
    def __init__(self) -> None:
        self.upsert_calls: list[GitHubUserUpsert] = []
        self.persist_calls: list[PREventPersist] = []
    async def upsert_user(self, user): self.upsert_calls.append(user); ...
    async def persist_pr_event(self, event): self.persist_calls.append(event); ...

def get_demeter_service() -> DemeterServiceProtocol:
    """Singleton accessor. Cycle 1 returns stub."""
def set_demeter_service(svc: DemeterServiceProtocol) -> None:
    """Demeter cycle 2 calls this to install real impl."""
```

### Pydantic payload schemas (canonical, Demeter consumes verbatim)

```python
class GitHubUserUpsert(BaseModel):
    github_id: int           # GitHub stable user id
    github_login: str
    avatar_url: str
    encrypted_access_token: str   # Fernet-encrypted via SESSION_SECRET
    scopes: list[str]
    last_login_at: str            # ISO 8601 UTC

class PREventPersist(BaseModel):
    event_type: Literal[
        "pr.opened", "pr.review_requested", "pr.approved", "pr.merged",
        "pr.closed", "issue.opened", "issue.closed", "comment.created",
        "comment.resolved", "ci.fail", "ci.pass", "dependency.added",
        "dependency.removed", "sprint.transition",
    ]
    delivery_id: str                # X-GitHub-Delivery header for idempotency
    building_id: str | None
    repo_full_name: str             # "owner/repo"
    resource_number: int
    resource_title: str
    author_login: str
    files_changed: list[str]
    lines_added: int | None
    lines_deleted: int | None
    story_points: int | None
    assignee_login: str | None
    payload: dict                    # event-specific JSONB
    received_at: str                 # ISO 8601 UTC
```

Schema MATCHES `_meta/contracts/hades-to-demeter.md` lines 22-99 verbatim
except `event_type` Literal extended to 14 members (Hera handoff extension
+ Pythia baseline 6 fully covered + 8 added per Hera Wave 2 14-event union).

### Hades call sites (Demeter receives these)

1. OAuth callback success (`backend/app/api/auth/github.py` line ~190):

```python
demeter = get_demeter_service()
await demeter.upsert_user(GitHubUserUpsert(
    github_id=github_id,
    github_login=github_login,
    avatar_url=avatar_url,
    encrypted_access_token=encrypted_token,
    scopes=granted_scopes or settings.github_scopes_list,
    last_login_at=now_iso,
))
```

Triggered: every successful OAuth callback. Idempotency via ON CONFLICT
(github_id) DO UPDATE per Pythia contract line 83-87. Demeter SQLAlchemy
schema: `users` table per contract line 148-157.

2. Webhook event persist (`backend/app/api/webhook/github.py` line ~140):

```python
for ev in translated_events:
    persist_payload = PREventPersist(...)
    await demeter.persist_pr_event(persist_payload)
```

Triggered: every webhook event after HMAC verify + dedup. Idempotency via
UNIQUE (delivery_id) per Pythia line 178. Note: a single webhook may fan-out
to multiple BuildingEvent (one per file in `files_changed`), so multiple
persist_pr_event calls share the same delivery_id; UNIQUE constraint must be
on (delivery_id, event_type, building_id) composite OR Demeter relaxes
constraint to allow fanout rows. **Demeter cycle 2 decides composite key
strategy**; Hades passes the same delivery_id for fanout because the
underlying webhook delivery is one logical event.

### Encryption helper (Hades provides, Demeter reuses)

```python
from app.services.crypto import encrypt_token, decrypt_token

# Hades encrypts on OAuth callback success:
encrypted = encrypt_token(access_token)  # Fernet symmetric, key from SESSION_SECRET hash

# Demeter decrypts when re-fetching for GitHub API calls:
plaintext = decrypt_token(encrypted)  # None if invalid
```

Fernet symmetric encryption via `cryptography` library. Single key derived
from `SHA256(SESSION_SECRET || 'oauth-token-v1')` base64-encoded. Demeter
cycle 2 may upgrade to KMS or external key management; for hackathon
scope Fernet sufficient because at-rest threat is read-only db dump.

### Materialized view refresh trigger (Hades does NOT directly call)

Hades's webhook receiver does NOT trigger materialized view refresh after
persist. Demeter cycle 2 handles via either:
- FastAPI BackgroundTasks (per Pythia contract OQ-01 recommendation)
- pg_cron job
- pgmq-like queue

Hades-side: just call `await demeter.persist_pr_event(event)`. Demeter cycle
2 internal logic decides refresh policy.

### Idempotency + dedup layering

Hades-side dedup:
- In-memory LRU 1024 entries on `X-GitHub-Delivery` header
- Returns `{"duplicate": true, "events": 0}` if seen recently
- Does NOT call demeter.persist_pr_event for duplicate

Demeter-side dedup (defense in depth):
- UNIQUE constraint on (delivery_id) OR (delivery_id, event_type, building_id)
- ON CONFLICT DO NOTHING semantics in INSERT statement
- Returns success even on conflict (idempotent persist contract)

Combined: even if Hades pod restarts (in-memory LRU cleared) and GitHub
retries the same delivery, Demeter UNIQUE constraint catches the duplicate
at the database layer.

## What Demeter cycle 1 + 2 needs to do

### Cycle 1 (stub-and-sync)

- [ ] Read this handoff + `_meta/contracts/hades-to-demeter.md`
- [ ] Author `backend/app/models/users.py` + `backend/app/models/pr_events.py`
      SQLAlchemy declarative models matching Pythia schema
- [ ] Author Alembic migration `backend/migrations/versions/001_initial_schema.py`
- [ ] Author `backend/app/services/demeter_service_real.py` implementing
      DemeterServiceProtocol via SQLAlchemy async + asyncpg
- [ ] Install via `set_demeter_service(RealDemeterService())` either in
      `app.main.lifespan()` (Hades to add hook) OR Demeter's own module
      `__init__.py` import-time side effect

### Cycle 2 (full impl)

- [ ] All 5+ event store tables: users, pr_events, finding_events, drift_log,
      proposals, simulation_events, llm_call_log
- [ ] Materialized views per PRD Section 18.7 (velocity_per_sprint,
      cycle_time_aggregate, drift_summary_view, repo_status_view,
      commit_frequency_per_building, ownership_distribution)
- [ ] Materialized view refresh strategy (BackgroundTasks per OQ-01)
- [ ] 1-click GitHub issue creation (Hades exposes OAuth token + GitHub
      API client; Demeter wires the create-issue call)
- [ ] Cost tracking aggregate from llm_call_log
- [ ] OpenSpec runtime metadata persist

## Coordination: how Demeter swaps stub for real

Recommended pattern: Demeter authors `app/services/demeter_real.py` with
class `DemeterService` implementing the Protocol. Demeter then has TWO
options for activation:

**Option A**: Hades's `app.main.lifespan` startup hook adds:
```python
from app.services.demeter_real import DemeterService as RealDemeterService
from app.services.demeter_service import set_demeter_service
real = RealDemeterService(database_url=settings.DATABASE_URL)
await real.connect()  # asyncpg pool init
set_demeter_service(real)
```

Hades's current `main.py` does not yet have this hook. Demeter cycle 2 can
either request the hook addition via ferry to V1 Orch OR install in its own
module via side effect on first import.

**Option B**: Demeter module's `__init__.py` calls `set_demeter_service` on
import, then Hades imports demeter module at startup:

```python
# In Hades main.py lifespan, add:
import app.services.demeter_real  # side-effect: installs real service
```

Either works; Demeter worker picks. Document the choice in Demeter cycle 2
handoff.

## Acceptance criteria (Aletheia Wave 3 audit gate verifies)

- [ ] All 5+ tables migrated via Alembic on first deploy
- [ ] OAuth callback persists user row in `users` table
- [ ] Simulated webhook event persists row in `pr_events` table
- [ ] Materialized views refresh on schedule
- [ ] Cost tracking llm_call_log populated; aggregate < $5 Hafiz budget
- [ ] Encryption at rest: encrypted_access_token never logged

## Ferry to V1 Orch

NOT triggered. Hades stub interface stable + locked. Demeter cycle 2 swap
pattern documented above; either option resolves.

## Closing

Hades event publish + persist call sites fully wired. Demeter cycle 1 + 2
ships its SQLAlchemy + Alembic schema + asyncpg pool + connects to
Refactory-provisioned Postgres at `DATABASE_URL` env (URL-encoded password
already handled by asyncpg auto-decode).
