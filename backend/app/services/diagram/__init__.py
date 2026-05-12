"""Diagram pipeline service (Phanes Wave-Fixing #2 cycle 1).

Bug #11 RESCUE: PRD Section 17.3 line 1089 LOCKED spec "Diagram generation |
mermaid-py + graphviz + eralchemy | Internal renderer pipeline, output JSON
schema yang city renderer baca" was silent Lock 3 scope-narrowed by Hephaestus
Wave 0 worker prompt author (ZERO worker assigned). Manager Wave-Fixing #2
verified backend grep ZERO impl at 03:07 WIB Day 2. Phanes (Greek primordial
deity of creation/genesis per Orphic tradition) implements rescue.

Module layout:
- types.py            (Pydantic DiagramNode + DiagramEdge + DiagramArtifact)
- mermaid_renderer.py (architecture diagram from tree-sitter symbols -> mermaid)
- graphviz_renderer.py (DAG dependency graph from imports -> graphviz SVG)
- eralchemy_renderer.py (ERD from SQLAlchemy models -> eralchemy SVG)
- diagram_service.py  (orchestrator: parse repo -> 3 renderer -> DiagramArtifact)

Output JSON schema v1.0 consumed by frontend `cityEngine.ts` via
`diagramConsumer.ts` hook (Iris coordinate). Frontend uses `nodes` for city
building geometry + `edges` for road glow lane mapping + `svg_blobs` for
side-panel image preview (3 tab toggle: architecture / dependency / ERD).

WebSocket `/api/ws/diagram-events` push event on webhook repo update OR explicit
refresh trigger so renderer hot-swap city without full page reload.
"""
from __future__ import annotations

from app.services.diagram.diagram_service import (
    DiagramService,
    get_diagram_service,
    reset_diagram_service,
)
from app.services.diagram.types import (
    DiagramArtifact,
    DiagramEdge,
    DiagramNode,
    SVG_BLOB_KEYS,
)

__all__ = [
    "DiagramArtifact",
    "DiagramEdge",
    "DiagramNode",
    "DiagramService",
    "SVG_BLOB_KEYS",
    "get_diagram_service",
    "reset_diagram_service",
]
