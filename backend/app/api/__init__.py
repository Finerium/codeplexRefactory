"""API router aggregation (Hades Wave 3 + Triton Wave 3 + Pandora Wave 3).

Aggregates the route groups:
- auth (Hades): /api/auth/github/{start,callback} (OAuth real flow)
- webhook (Hades): /api/webhook/github (HMAC verify + dispatch)
- websocket (Hades): /api/ws/{building,finding}-events (pubsub fanout)
- parser (Hades): /api/parser/parse-{repo,file} (tree-sitter 11-lang)
- chat (Triton): /api/chat (SSE stream, 5 resident routing)
- onboarding (Triton): /api/onboarding/narration (Hermes V4-Flash non-think)
- security (Triton): /api/security/argus/score (Argus V4-Flash think-low)
- simulation (Triton): /api/simulation/turn (Pandora 3 turn dispatch)
- llm (Triton): /api/llm/health (gateway operational health)
- refactor (Pandora): /api/refactor/{propose,simulate,*/accept,*/discard}
  + /api/ws/refactor-events (Wave-Fixing #2 Cycle 1 wiring fix R-1)

main.py mounts this aggregator with prefix /api so each sub-router carries
only its own resource segment.

Wave-Fixing #2 Cycle 1 (Pandora rescue R-1, STAMP=20260513-0313):
mount Pandora's own ``refactor.router`` (POST /simulate + accept + discard +
GET /propose SSE) and ``refactor.ws_router`` (WS /api/ws/refactor-events).
The Hades stub ``websocket.refactor_events`` shipped its own /api/ws/
refactor-events listening on ``event_bus.subscribe('refactor_events')`` but
Pandora's simulation engine publishes to ``InMemoryRefactorBus``. Removing
the Hades stub (keep file for archaeology; no longer mounted) avoids two
routers fighting for the same path; Pandora's router is the single source
of truth post-Wave-Fixing #2.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.auth.github import router as github_auth_router
from app.api.chat import router as chat_router
from app.api.diagram import router as diagram_router
from app.api.findings import router as findings_router
from app.api.llm_health import router as llm_health_router
from app.api.onboarding import router as onboarding_router
from app.api.parser import router as parser_router
from app.api.refactor import router as refactor_router
from app.api.refactor import ws_router as refactor_ws_router
from app.api.repos import router as repos_router
from app.api.security import router as security_router
from app.api.simulation import router as simulation_router
from app.api.webhook.github import router as github_webhook_router
from app.api.websocket.building_events import router as building_events_router
from app.api.websocket.diagram_events import router as diagram_events_router
from app.api.websocket.finding_events import router as finding_events_router

api_router = APIRouter()

# Aggregate. Each child router defines its own prefix relative to /api.
# Hades-owned routers.
api_router.include_router(github_auth_router)
api_router.include_router(github_webhook_router)
api_router.include_router(building_events_router)
api_router.include_router(finding_events_router)
api_router.include_router(parser_router)

# Hestia Wave-Fixing cycle 1 (E-3): repo picker endpoint. See app/api/repos.py
# header for cross-scope ownership note (Hestia author, Hades may absorb).
api_router.include_router(repos_router)

# Phanes Wave-Fixing #2 cycle 1 (Bug #11 silent Lock 3 rescue): real diagram
# pipeline mermaid-py + graphviz + eralchemy2 per PRD Section 17.3 line 1089.
# Replaces Hades 503 stub. Routes:
# - GET  /api/diagram/repos
# - GET  /api/diagram/{repo_id}            (cache 60s)
# - POST /api/diagram/{repo_id}/refresh    (emits WS event)
# - WS   /api/ws/diagram-events            (frontend hot-swap channel)
api_router.include_router(diagram_router)
api_router.include_router(diagram_events_router)

# Triton-owned routers (Wave 3 LLM gateway).
api_router.include_router(chat_router)
api_router.include_router(onboarding_router)
api_router.include_router(security_router)
api_router.include_router(simulation_router)
api_router.include_router(llm_health_router)

# Demeter-owned routers (Wave 3 event store + 1-click GitHub issue).
api_router.include_router(findings_router)

# Pandora-owned routers (Wave 3 Refactor Mode dual review gate + WS).
# Wave-Fixing #2 Cycle 1 rescue R-1: previously missing wiring. Frontend
# /api/refactor/simulate returned 404 (curl verified 03:07 WIB) because
# of this omission. STAMP=20260513-0313.
api_router.include_router(refactor_router)
api_router.include_router(refactor_ws_router)
