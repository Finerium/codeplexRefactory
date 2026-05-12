"""Diagram pipeline Pydantic types (Phanes Wave-Fixing #2 cycle 1).

Schema v1.0 LOCKED. Frontend `diagramConsumer.ts` + `cityEngine.ts` (Iris
ownership) consume this shape. Any drift requires coordinated bump
(`schema_version` field).

Reference: PRD Section 17.3 line 1089 + idea-draft Section K.3 line 633
"Internal renderer pipeline, output JSON schema yang city renderer baca".
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# SVG blob keys in DiagramArtifact.svg_blobs. Locked v1.0 contract.
SVG_BLOB_KEYS: tuple[str, ...] = ("architecture", "dependency", "erd")

NodeType = Literal[
    "file",
    "module",
    "class",
    "function",
    "schema",
    "table",
    "external",
]

EdgeKind = Literal[
    "import",
    "call",
    "inherit",
    "reference",
    "fk",
    "relation",
]


class DiagramNode(BaseModel):
    """Single diagram node (city building geometry source).

    Frontend `cityEngine.ts` maps node -> building geometry per `id` (stable
    identity for hot-swap). `metadata` carries free-form payload (LOC, symbol
    count, etc.) for hover panel + tooltip.
    """

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    label: str
    type: NodeType
    metadata: dict[str, str | int | float | bool] = Field(default_factory=dict)


class DiagramEdge(BaseModel):
    """Single diagram edge (city road glow lane source).

    `src` + `dst` reference DiagramNode.id values. `weight` scales lane visual
    intensity. `kind` drives lane color encoding (import = blue, call = amber,
    inherit = violet, fk = green, relation = teal).
    """

    model_config = ConfigDict(frozen=True)

    src: str = Field(min_length=1)
    dst: str = Field(min_length=1)
    kind: EdgeKind
    weight: float = Field(default=1.0, ge=0.0)


class DiagramArtifact(BaseModel):
    """Full diagram artifact returned by `/api/diagram/<repo_id>`.

    `nodes` + `edges` feed city renderer building geometry + road glow.
    `svg_blobs` carries 3 SVG bytes (base64-encoded for JSON transport) for
    side-panel image preview tab toggle.

    `schema_version` v1.0 locked. Bump on contract drift; frontend gate on
    `schema_version` prefix `v1.` for compatibility.
    """

    model_config = ConfigDict(frozen=True)

    schema_version: str = Field(default="v1.0")
    repo_id: str
    generated_at_iso: str
    nodes: list[DiagramNode] = Field(default_factory=list)
    edges: list[DiagramEdge] = Field(default_factory=list)
    # base64-encoded SVG bytes per renderer; key in SVG_BLOB_KEYS.
    svg_blobs: dict[str, str] = Field(default_factory=dict)
    stats: dict[str, int] = Field(default_factory=dict)
    render_errors: list[str] = Field(default_factory=list)
