"""Buildings API package (Demeter Manager FINAL Cycle 2 Cluster C).

Endpoints:
- GET /api/buildings/{owner}/{repo}/{file_path:path}/commits
    Floor-ordered commit timeline per file. Floor 1 = oldest commit, Floor N
    = latest. Persephone side-panel + Iris per-floor geometry consume.
"""
from app.api.buildings.routes import router

__all__ = ["router"]
