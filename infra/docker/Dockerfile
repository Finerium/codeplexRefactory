# syntax=docker/dockerfile:1.6
#
# Codeplex Chronicle multi-arch (ARM64 + AMD64) production image
#
# Authoring authority: Atlas Wave 3 worker per `_meta/contracts/atlas-to-production.md`
# and `.claude/agents/atlas.md`. Lock 4 namespace duopoly + Lock 8 free registry only
# (ghcr.io primary, docker.io fallback).
#
# Three stage build:
#   stage 1: frontend-builder  -> Next.js 16 standalone build via npm
#   stage 2: backend-builder   -> Python 3.12 + uv sync (no dev deps)
#   stage 3: runtime           -> python:3.12-slim + Node.js for Next.js standalone runtime
#
# Runtime starts both FastAPI on :8000 and Next.js standalone server on :3000
# via /app/start.sh. K8s readiness + liveness probe target /health on :8000 (NGINX
# Ingress routes /api -> :8000 and / -> :3000).
#
# Build entry from project root:
#   docker buildx build --platform linux/amd64,linux/arm64 \
#     --tag ghcr.io/finerium/codeplexrefactory:latest \
#     --file infra/docker/Dockerfile \
#     --push .
#
# Single-arch fallback if buildx unavailable:
#   docker build --tag ghcr.io/finerium/codeplexrefactory:latest \
#     --file infra/docker/Dockerfile .
#
# Local smoke (after build, requires .env + populated DEEPSEEK_API_KEY etc.):
#   docker run --rm -p 3000:3000 -p 8000:8000 --env-file .env \
#     ghcr.io/finerium/codeplexrefactory:latest

# Note: TARGETPLATFORM + BUILDPLATFORM are built-in BuildKit ARGs auto-populated
# AFTER each FROM statement. They are referenced inline (e.g. `--platform=$BUILDPLATFORM`)
# without explicit top-level ARG declaration; declaring ARG TARGETPLATFORM at the
# top with no default causes BuildKit to interpret it as user ARG with empty string,
# producing "invalid platform" errors. Source: https://docs.docker.com/build/building/multi-platform/

# -----------------------------------------------------------------------------
# Stage 1: frontend-builder
# Next.js 16 + React 19 + Three.js 0.184 + r3f 9.6 production build
# Lockfile present: package-lock.json (npm). Wave 1+2 worker used
# `npm install --legacy-peer-deps`; Atlas adopts that pattern in CI deterministic
# variant (npm ci --legacy-peer-deps).
# -----------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:20-bookworm-slim AS frontend-builder

WORKDIR /build/frontend

# Build-time Next.js public env vars (compiled into bundle).
# Manager FINAL Wave-Fixing 3 root cause T-1/E-4/R-1/D-1: previous value `/api`
# caused frontend fetch to compose `${apiBase}/api/chat` = `/api/api/chat` 404
# because resolveApiBase() in mockResidentResponses.ts + RepoPickerStep.tsx +
# RepoPickerModal.tsx already prefix `/api`. Empty string forces relative
# same-origin which renders as `/api/chat` correctly. See manager_final
# spawn directive Section 3 + 5 Cluster 4 root cause.
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_APP_DOMAIN=duopoly.hackathon.sev-2.com
ARG NEXT_PUBLIC_ENABLE_DOF=true
ARG NEXT_PUBLIC_ENABLE_SPARKLES_TIER_3=true
ARG NEXT_PUBLIC_ENABLE_THIRD_DIRECTIONAL_LIGHT=true

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_DOMAIN=${NEXT_PUBLIC_APP_DOMAIN} \
    NEXT_PUBLIC_ENABLE_DOF=${NEXT_PUBLIC_ENABLE_DOF} \
    NEXT_PUBLIC_ENABLE_SPARKLES_TIER_3=${NEXT_PUBLIC_ENABLE_SPARKLES_TIER_3} \
    NEXT_PUBLIC_ENABLE_THIRD_DIRECTIONAL_LIGHT=${NEXT_PUBLIC_ENABLE_THIRD_DIRECTIONAL_LIGHT}

# Copy lockfile first for layer cache hit on dependency change
COPY frontend/package.json frontend/package-lock.json ./

# Wave 1+2 anchor: npm install --legacy-peer-deps. CI deterministic variant.
# --no-audit + --no-fund suppress noise. Drop dev deps via NODE_ENV=production
# is NOT used here because next build needs devDeps (typescript, eslint config).
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Copy source after deps for layer cache
COPY frontend/ ./

# Build standalone output. next.config.ts patched by Atlas Cycle 1 with
# `output: 'standalone'` for multi-stage runtime copy.
# Force webpack builder because next.config.ts webpack() block is load-bearing
# for Three.js single-copy dedup. Next.js 16 defaults to Turbopack which would
# discard the webpack alias. See Atlas D-Atlas-13 cycle 2.
RUN npx next build --webpack

# -----------------------------------------------------------------------------
# Stage 2: backend-builder
# Python 3.12 + uv sync frozen production deps (no dev)
# Backend pyproject.toml present but uv.lock not yet generated in cycle 1 baseline.
# Atlas runs `uv lock` at build time if uv.lock absent; subsequent build uses
# committed uv.lock for reproducibility.
#
# IMPORTANT: pinned to $TARGETPLATFORM (NOT $BUILDPLATFORM) so the Python venv
# contains native binaries that match the runtime arch. Backend builder shipping
# amd64 uvicorn into an arm64 runtime image caused "cannot execute" startup
# crash cycle 3. Atlas D-Atlas-18 cycle 3.
# -----------------------------------------------------------------------------
FROM --platform=$TARGETPLATFORM ghcr.io/astral-sh/uv:0.5-python3.12-bookworm-slim AS backend-builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1 \
    UV_PYTHON_PREFERENCE=only-system

# Wave-Fixing #2 Phanes Bug #11 rescue: pyproject.toml adds eralchemy2 + graphviz
# (pure-Python) + mermaid-py. eralchemy2 transitive depends on pygraphviz which
# requires graphviz system development headers (graphviz-dev) to compile its
# native C extension. Without these, uv sync fails on arm64 + amd64 with
# "graphviz/cgraph.h: No such file or directory". Build-only (not runtime) deps.
#
# Atlas Wave-Fixing #2 Cycle 2 first build attempt FAILED with
# "fatal error: stdlib.h: No such file or directory" because uv-python base
# is slim (no libc dev headers) and pygraphviz SWIG-generated C extension
# needs both python3-dev (Python.h) + libc6-dev (stdlib.h). Adding both
# explicitly so gcc invocation resolves headers on both arm64 + amd64.
#
# Source: Phanes handoff wave-fixing-2_phanes_to_manager-wf2_20260513-0314.md
# Atlas decision D-Atlas-WF2-01.
RUN apt-get update && apt-get install -y --no-install-recommends \
        graphviz \
        graphviz-dev \
        gcc \
        g++ \
        libc6-dev \
        python3-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build/backend

# Copy backend project files
COPY backend/pyproject.toml backend/README.md ./

# Generate lockfile if not present (Cycle 1 first build), then sync.
# Subsequent builds copy uv.lock for deterministic reproducibility.
COPY backend/uv.lock* ./
RUN uv lock --no-update 2>/dev/null || uv lock

# Sync deps into .venv (no project install yet for layer cache)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy source
COPY backend/ ./

# Final sync to install project itself into .venv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# -----------------------------------------------------------------------------
# Stage 3: runtime
# python:3.12-slim + Node.js 20 for Next.js standalone server runtime
# Process supervisor: start.sh wraps both FastAPI uvicorn and Next.js node
# server in parallel with SIGTERM trap for graceful shutdown.
# -----------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PORT_BACKEND=8000 \
    PORT_FRONTEND=3000 \
    HOSTNAME=0.0.0.0

# Install runtime system deps:
#   - libpq5 for asyncpg native (PostgreSQL client lib)
#   - ca-certificates for TLS verification (DeepSeek API, GitHub API)
#   - curl for healthcheck command
#   - git for Nemesis Pattern E openspec_drift subprocess `git log` (Lock 5 carry-forward Nemesis-to-Atlas handoff cycle 2)
#   - nodejs 20 LTS for Next.js standalone server (NodeSource repo)
#   - graphviz for `dot` binary at runtime (Phanes Wave-Fixing #2 Bug #11 rescue:
#     GET /api/diagram/demo invokes graphviz pure-Python which subprocess `dot`
#     to render SVG. Without it the endpoint returns fallback message-only SVG
#     (graceful degrade, not hard fail) but architecture + dep diagram visual
#     quality degrades. graphviz-dev NOT needed in runtime stage because
#     pygraphviz native ext already compiled in backend-builder venv.)
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        libpq5 \
        graphviz \
        gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get purge -y --auto-remove gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install OpenSpec CLI globally (Aether forensic A-1 rescue Wave-Fixing 3 cycle 3).
# Backend `app.services.openspec_runtime.OpenSpecRuntime` invokes `openspec` via
# `asyncio.create_subprocess_exec` and relies on PATH resolution. Without this
# binary `/api/openspec/list` plus `/api/openspec/validate` return 503 with
# stderr "openspec binary not found at openspec".
#
# Package: @fission-ai/openspec (npm), official Fission-AI publisher.
# Source: https://www.npmjs.com/package/@fission-ai/openspec (verified 2026-05-13).
# Node.js 20 LTS via NodeSource setup_20.x supplies 20.19+ required by package.
# Verify post-install via `openspec --version` (build log) so failure halts build.
#
# Atlas decision D-Atlas-WF3-01.
RUN npm install -g @fission-ai/openspec@latest --no-audit --no-fund \
    && openspec --version

# Create non-root user (Lock 8 + security hardening)
RUN groupadd --system --gid 1000 chronicle \
    && useradd --system --uid 1000 --gid chronicle --create-home --shell /bin/bash chronicle

WORKDIR /app

# Copy backend with venv (already installed in builder stage)
COPY --from=backend-builder --chown=chronicle:chronicle /build/backend /app/backend
ENV PATH="/app/backend/.venv/bin:$PATH"

# Copy frontend standalone build artifacts
#   - .next/standalone contains minimal server.js + node_modules subset
#   - .next/static must be copied separately (CDN convention)
#   - public must be copied separately for static asset serving
COPY --from=frontend-builder --chown=chronicle:chronicle /build/frontend/.next/standalone /app/frontend
COPY --from=frontend-builder --chown=chronicle:chronicle /build/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder --chown=chronicle:chronicle /build/frontend/public /app/frontend/public

# Copy start script
COPY --chown=chronicle:chronicle infra/docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

USER chronicle

# Expose both ports
EXPOSE 3000 8000

# Healthcheck targets backend /health (NGINX Ingress routes /api -> backend)
# Frontend health is implicit via NGINX upstream check at deploy time.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Process supervisor: spawns FastAPI uvicorn :8000 + Next.js node :3000 in parallel
CMD ["/app/start.sh"]
