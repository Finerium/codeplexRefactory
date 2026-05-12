#!/usr/bin/env bash
#
# Codeplex Chronicle container entrypoint
# Atlas Wave 3 authored per `_meta/contracts/atlas-to-production.md`.
#
# Spawns:
#   - FastAPI uvicorn on :8000 (backend, Hades Wave 3)
#   - Next.js standalone server on :3000 (frontend, Wave 1+2)
#
# Both processes run in parallel. SIGTERM/SIGINT trapped to gracefully shut down
# both children. Container exits with non-zero status if either child exits
# unexpectedly (K8s liveness probe re-spawns pod).
#
# Alembic migrations: deferred to Demeter Wave 3 cycle 2 ship. When Demeter
# adds `backend/alembic.ini` + `backend/migrations/` Atlas re-enables the
# migration line below. Cycle 1 stub commented out.

set -euo pipefail

# -----------------------------------------------------------------------------
# Optional: Alembic migrations (Demeter ship-pending Cycle 2 full)
# Uncomment after `backend/alembic.ini` + `backend/migrations/` materialized.
# -----------------------------------------------------------------------------
# cd /app/backend
# if [ -f alembic.ini ]; then
#     echo "[start.sh] running alembic upgrade head"
#     alembic upgrade head
# else
#     echo "[start.sh] alembic.ini absent, skipping migration (Demeter cycle 2 pending)"
# fi

# -----------------------------------------------------------------------------
# Start backend (FastAPI uvicorn)
# -----------------------------------------------------------------------------
echo "[start.sh] starting FastAPI backend on :${PORT_BACKEND:-8000}"
cd /app/backend
# Invoke uvicorn via `python -m` to avoid the venv wrapper script's stale
# shebang (#!/build/backend/.venv/bin/python from builder stage path).
# /app/backend/.venv/bin/python is a symlink to /usr/local/bin/python3.12.
# Atlas D-Atlas-19 cycle 3.
/app/backend/.venv/bin/python -m uvicorn app.main:app \
    --host "${HOSTNAME:-0.0.0.0}" \
    --port "${PORT_BACKEND:-8000}" \
    --workers 1 \
    --log-level info \
    --access-log \
    --no-server-header &
BACKEND_PID=$!
echo "[start.sh] backend PID=$BACKEND_PID"

# -----------------------------------------------------------------------------
# Start frontend (Next.js 16 standalone server.js)
# Next.js standalone server expects HOSTNAME + PORT env vars.
# -----------------------------------------------------------------------------
echo "[start.sh] starting Next.js standalone frontend on :${PORT_FRONTEND:-3000}"
cd /app/frontend
PORT="${PORT_FRONTEND:-3000}" HOSTNAME="${HOSTNAME:-0.0.0.0}" \
    node server.js &
FRONTEND_PID=$!
echo "[start.sh] frontend PID=$FRONTEND_PID"

# -----------------------------------------------------------------------------
# Signal trap + wait
# -----------------------------------------------------------------------------
shutdown() {
    echo "[start.sh] shutdown signal received, terminating child processes"
    kill -TERM "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "[start.sh] both processes terminated, exiting"
    exit 0
}
trap shutdown SIGTERM SIGINT

# Wait for either process to exit; relay exit code via fail-fast
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?

echo "[start.sh] a child process exited with code $EXIT_CODE, terminating sibling"
kill -TERM "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
wait 2>/dev/null || true

exit "$EXIT_CODE"
