"""Alembic env.py (Demeter Wave 3).

Async asyncpg driver per SQLAlchemy 2.x async pattern. URL pulled from
`DATABASE_URL` env (URL-encoded special chars decode automatically via
SQLAlchemy URL parser).

Run:
    cd backend && alembic upgrade head
"""
from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import config as alembic_config_module
from alembic import context

# Ensure backend/ on sys.path so `app.*` imports work.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.models.event_store import Base  # noqa: E402

# Alembic Config object.
config = context.config

# Logging from alembic.ini.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Pull DATABASE_URL from env. asyncpg driver swap for async engine.
_database_url = os.environ.get("DATABASE_URL", "")
if not _database_url:
    # fall back to .env via pydantic settings if needed
    try:
        from app.config import get_settings

        _database_url = get_settings().DATABASE_URL
    except Exception:
        raise RuntimeError("DATABASE_URL env required for alembic migrations") from None

# Convert sync URL to async by injecting `+asyncpg` driver if missing.
if _database_url.startswith("postgresql://") and "+asyncpg" not in _database_url:
    _database_url = _database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# DO NOT use config.set_main_option here. The URL contains percent-encoded
# special characters; ConfigParser would interpret them as interpolation.
# Instead inject the URL directly into the engine config dict below.

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in offline mode (emit SQL to stdout)."""
    context.configure(
        url=_database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online_async() -> None:
    """Run migrations in async online mode via asyncpg."""
    section = config.get_section(config.config_ini_section, {}) or {}
    section["sqlalchemy.url"] = _database_url
    connectable = async_engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_migrations_online_async())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
