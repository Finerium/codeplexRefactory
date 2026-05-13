"""Activity API package (Demeter Manager FINAL Cycle 2 Cluster B).

Endpoints:
- POST /api/activity/loc-snapshot: Git Time Machine LOC snapshot per timestamp.
"""
from app.api.activity.routes import router

__all__ = ["router"]
