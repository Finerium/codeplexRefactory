"""API router aggregation (Hades Wave 3 + Triton Wave 3).

Aggregates the route groups:
- auth (Hades): /api/auth/github/{start,callback} (OAuth real flow)
- webhook (Hades): /api/webhook/github (HMAC verify + dispatch)
- websocket (Hades): /api/ws/{building,refactor,finding}-events (pubsub fanout)
- parser (Hades): /api/parser/parse-{repo,file} (tree-sitter 11-lang)
- chat (Triton): /api/chat (SSE stream, 5 resident routing)
- onboarding (Triton): /api/onboarding/narration (Hermes V4-Flash non-think)
- security (Triton): /api/security/argus/score (Argus V4-Flash think-low)
- simulation (Triton): /api/simulation/turn (Pandora 3 turn dispatch)
- llm (Triton): /api/llm/health (gateway operational health)

main.py mounts this aggregator with prefix /api so each sub-router carries
only its own resource segment.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.auth.github import router as github_auth_router
from app.api.chat import router as chat_router
from app.api.findings import router as findings_router
from app.api.llm_health import router as llm_health_router
from app.api.onboarding import router as onboarding_router
from app.api.parser import router as parser_router
from app.api.security import router as security_router
from app.api.simulation import router as simulation_router
from app.api.webhook.github import router as github_webhook_router
from app.api.websocket.building_events import router as building_events_router
from app.api.websocket.finding_events import router as finding_events_router
from app.api.websocket.refactor_events import router as refactor_events_router

api_router = APIRouter()

# Aggregate. Each child router defines its own prefix relative to /api.
# Hades-owned routers.
api_router.include_router(github_auth_router)
api_router.include_router(github_webhook_router)
api_router.include_router(building_events_router)
api_router.include_router(refactor_events_router)
api_router.include_router(finding_events_router)
api_router.include_router(parser_router)

# Triton-owned routers (Wave 3 LLM gateway).
api_router.include_router(chat_router)
api_router.include_router(onboarding_router)
api_router.include_router(security_router)
api_router.include_router(simulation_router)
api_router.include_router(llm_health_router)

# Demeter-owned routers (Wave 3 event store + 1-click GitHub issue).
api_router.include_router(findings_router)
