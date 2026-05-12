"""Findings API package (Demeter Wave 3).

Endpoints:
- POST /api/findings/{finding_id}/to-issue: 1-click GitHub issue create.
- GET  /api/findings/by-building/{building_id}: Asclepius glow consumer.

Hybrid Layer 1 PRD pitch differentiator: convert finding to GitHub issue with
evidence chain pre-filled.
"""
from app.api.findings.routes import router

__all__ = ["router"]
