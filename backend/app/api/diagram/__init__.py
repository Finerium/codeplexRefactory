"""Diagram engine HTTP routes (Phanes Wave-Fixing #2 cycle 1).

Replaces Hades pre-staged stub (D-Hades-WF2-03) with real Phanes
implementation. Phanes OWNS backend/app/services/diagram/* +
backend/app/api/diagram/* per Manager Wave-Fixing #2 anti-collision matrix.

Real endpoints implemented in `routes.py`:
    GET  /api/diagram/repos                 list registered repos
    GET  /api/diagram/{repo_id}             DiagramArtifact (cache 60s)
    POST /api/diagram/{repo_id}/refresh     force regenerate + WS push

Reference:
- _meta/handoff_log/wave_fixing_2_hades_to_phanes.md
- _meta/decision_log/hades.md D-Hades-WF2-03 (stub replaced)
- PRD Section 17.3 line 1089 LOCKED diagram pipeline contract
"""
from __future__ import annotations

from app.api.diagram.routes import router

__all__ = ["router"]
