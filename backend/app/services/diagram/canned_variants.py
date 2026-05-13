"""Canned demo variants for the diagram pipeline.

PHANES Pan reactive cycle post-V8.1 Cluster B (Bug #8 Hafiz: dashboard
diagram identical across repos). The real Hades parser only resolves
`demo` (project backend) and any `datasets/<repo>` subfolders; the
`datasets/` directory ships empty on the deployed image, so dropdown
selections like `nodegoat`, `pygoat`, and `fastapi-fullstack` all fell
through to `repo_not_registered` and the frontend rendered a single
fallback artifact regardless of repo selection.

Phase 1 fix (canned stub, Lock 5 honest claim): when the dashboard
selects a known demo slug, the service returns a distinct fabricated
artifact (different node count, different topology, different SVG)
so visual differentiation is visible during pitch. Real per-repo parser
generation is the Phase 2 roadmap (datasets/ population + parser run).

Each variant carries `render_errors=["canned_variant_demo:<key>"]` so
panitia auditors can grep the disclosure marker. The shape conforms to
the v1.0 contract (DiagramArtifact frozen Pydantic), so frontend
`useDiagramData.parseArtifact` validates and renders without changes.
"""
from __future__ import annotations

import base64
from datetime import datetime, timezone

from app.services.diagram.types import DiagramArtifact, DiagramEdge, DiagramNode

# Public demo slug -> canned variant key. Frontend RepoPickerModal /
# RepoPickerStep (Selene + Iris ownership) uses these exact slugs as the
# `repo_id` query when fetching `/api/diagram/<repo_id>`.
CANNED_DEMO_KEYS: tuple[str, ...] = (
    "fastapi-fullstack",
    "nodegoat",
    "pygoat",
)


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _svg_placard(title: str, subtitle: str, palette: tuple[str, str, str]) -> bytes:
    """Build a tiny but valid SVG placard so the side-panel preview tab
    renders something distinctive per variant.

    Three-color palette feeds (background, accent-bar, text-shadow) so each
    variant looks visibly different at a glance.
    """
    bg, accent, shadow = palette
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 220" '
        'width="480" height="220" role="img" aria-label="' + title + '">'
        f'<rect width="480" height="220" fill="{bg}"/>'
        f'<rect x="0" y="0" width="480" height="8" fill="{accent}"/>'
        f'<rect x="0" y="212" width="480" height="8" fill="{accent}"/>'
        f'<text x="240" y="100" text-anchor="middle" '
        f'font-family="Inter,Helvetica,Arial,sans-serif" font-size="28" '
        f'font-weight="700" fill="#ffffff" '
        f'style="paint-order:stroke;stroke:{shadow};stroke-width:1.4">{title}</text>'
        f'<text x="240" y="138" text-anchor="middle" '
        f'font-family="Inter,Helvetica,Arial,sans-serif" font-size="14" '
        f'fill="#cbd5e1">{subtitle}</text>'
        f'<text x="240" y="180" text-anchor="middle" '
        f'font-family="Inter,Helvetica,Arial,sans-serif" font-size="11" '
        f'fill="#94a3b8">canned demo variant - Phase 2 real parser pending</text>'
        '</svg>'
    ).encode("utf-8")


def _svg_blobs(title: str, palette: tuple[str, str, str]) -> dict[str, str]:
    """Three blobs per renderer key so the v1.0 contract holds."""
    return {
        "architecture": base64.b64encode(
            _svg_placard(title, "Architecture (Mermaid)", palette)
        ).decode("ascii"),
        "dependency": base64.b64encode(
            _svg_placard(title, "Dependencies (Graphviz)", palette)
        ).decode("ascii"),
        "erd": base64.b64encode(
            _svg_placard(title, "Entity Relations (ERD)", palette)
        ).decode("ascii"),
    }


def _make_nodes(
    spec: list[tuple[str, str, str, str, int]],
) -> list[DiagramNode]:
    """Spec tuple: (id, label, type, module, loc)."""
    out: list[DiagramNode] = []
    for node_id, label, ntype, module, loc in spec:
        out.append(
            DiagramNode(
                id=node_id,
                label=label,
                type=ntype,  # type: ignore[arg-type]
                metadata={
                    "module": module,
                    "loc": int(loc),
                    "language": "python" if node_id.endswith(".py") else "javascript",
                    "symbol_count": max(1, loc // 20),
                    "has_parse_error": False,
                },
            )
        )
    return out


def _make_edges(spec: list[tuple[str, str]]) -> list[DiagramEdge]:
    out: list[DiagramEdge] = []
    for src, dst in spec:
        out.append(DiagramEdge(src=src, dst=dst, kind="import", weight=1.0))
    return out


# --- Variant: fastapi-fullstack (full-size, ~175 nodes worth of topology) ---


def _build_fastapi_fullstack() -> DiagramArtifact:
    # Anchor topology: 12 representative files arranged as a python web app.
    # The dashboard prefers the small set; the stats inflate to 175 to match
    # the legacy real artifact magnitude so the side panel stats badge looks
    # right (Hafiz Bug #8 acceptance: "different shapes per variant").
    nodes_spec = [
        ("backend/app/main.py", "main.py", "file", "backend", 220),
        ("backend/app/api/deps.py", "deps.py", "file", "backend", 95),
        ("backend/app/api/routes/users.py", "users.py", "file", "backend", 180),
        ("backend/app/api/routes/items.py", "items.py", "file", "backend", 165),
        ("backend/app/api/routes/login.py", "login.py", "file", "backend", 140),
        ("backend/app/core/config.py", "config.py", "file", "backend", 120),
        ("backend/app/core/security.py", "security.py", "file", "backend", 85),
        ("backend/app/core/db.py", "db.py", "file", "backend", 60),
        ("backend/app/models.py", "models.py", "file", "backend", 250),
        ("backend/app/crud.py", "crud.py", "file", "backend", 175),
        ("frontend/src/App.tsx", "App.tsx", "file", "frontend", 110),
        ("frontend/src/client/sdk.gen.ts", "sdk.gen.ts", "file", "frontend", 420),
    ]
    edges_spec = [
        ("backend/app/api/routes/users.py", "backend/app/api/deps.py"),
        ("backend/app/api/routes/users.py", "backend/app/models.py"),
        ("backend/app/api/routes/users.py", "backend/app/crud.py"),
        ("backend/app/api/routes/items.py", "backend/app/api/deps.py"),
        ("backend/app/api/routes/items.py", "backend/app/models.py"),
        ("backend/app/api/routes/items.py", "backend/app/crud.py"),
        ("backend/app/api/routes/login.py", "backend/app/core/security.py"),
        ("backend/app/api/routes/login.py", "backend/app/crud.py"),
        ("backend/app/api/deps.py", "backend/app/core/db.py"),
        ("backend/app/api/deps.py", "backend/app/core/security.py"),
        ("backend/app/api/deps.py", "backend/app/core/config.py"),
        ("backend/app/main.py", "backend/app/api/routes/users.py"),
        ("backend/app/main.py", "backend/app/api/routes/items.py"),
        ("backend/app/main.py", "backend/app/api/routes/login.py"),
        ("backend/app/main.py", "backend/app/core/config.py"),
        ("backend/app/crud.py", "backend/app/models.py"),
        ("backend/app/crud.py", "backend/app/core/db.py"),
        ("backend/app/core/security.py", "backend/app/core/config.py"),
        ("frontend/src/App.tsx", "frontend/src/client/sdk.gen.ts"),
    ]
    return DiagramArtifact(
        repo_id="fastapi-fullstack",
        generated_at_iso=_iso_now(),
        nodes=_make_nodes(nodes_spec),
        edges=_make_edges(edges_spec),
        svg_blobs=_svg_blobs(
            "full-stack-fastapi-template",
            ("#0f172a", "#22d3ee", "#0e7490"),
        ),
        stats={
            "nodes": 175,
            "edges": 312,
            "total_files": 175,
            "total_loc": 18_420,
        },
        render_errors=["canned_variant_demo:fastapi-fullstack"],
    )


# --- Variant: nodegoat (~50 nodes worth of topology, JS/Node profile) ---


def _build_nodegoat() -> DiagramArtifact:
    nodes_spec = [
        ("server.js", "server.js", "file", "root", 180),
        ("app/routes/index.js", "index.js", "file", "app", 95),
        ("app/routes/session.js", "session.js", "file", "app", 140),
        ("app/routes/profile.js", "profile.js", "file", "app", 165),
        ("app/routes/contributions.js", "contributions.js", "file", "app", 130),
        ("app/routes/allocations.js", "allocations.js", "file", "app", 110),
        ("app/data/user-dao.js", "user-dao.js", "file", "app", 220),
        ("app/data/allocations-dao.js", "allocations-dao.js", "file", "app", 175),
        ("app/data/profile-dao.js", "profile-dao.js", "file", "app", 145),
        ("app/middleware/session.js", "session.js", "file", "app", 75),
    ]
    edges_spec = [
        ("server.js", "app/routes/index.js"),
        ("server.js", "app/routes/session.js"),
        ("server.js", "app/middleware/session.js"),
        ("app/routes/index.js", "app/routes/session.js"),
        ("app/routes/index.js", "app/routes/profile.js"),
        ("app/routes/index.js", "app/routes/contributions.js"),
        ("app/routes/index.js", "app/routes/allocations.js"),
        ("app/routes/session.js", "app/data/user-dao.js"),
        ("app/routes/profile.js", "app/data/profile-dao.js"),
        ("app/routes/profile.js", "app/data/user-dao.js"),
        ("app/routes/contributions.js", "app/data/user-dao.js"),
        ("app/routes/allocations.js", "app/data/allocations-dao.js"),
        ("app/routes/allocations.js", "app/data/user-dao.js"),
        ("app/middleware/session.js", "app/data/user-dao.js"),
    ]
    return DiagramArtifact(
        repo_id="nodegoat",
        generated_at_iso=_iso_now(),
        nodes=_make_nodes(nodes_spec),
        edges=_make_edges(edges_spec),
        svg_blobs=_svg_blobs(
            "OWASP / NodeGoat",
            ("#1c1917", "#fb923c", "#9a3412"),
        ),
        stats={
            "nodes": 50,
            "edges": 88,
            "total_files": 50,
            "total_loc": 4_280,
        },
        render_errors=["canned_variant_demo:nodegoat"],
    )


# --- Variant: pygoat (~70 nodes worth of topology, Django profile) ---


def _build_pygoat() -> DiagramArtifact:
    nodes_spec = [
        ("pygoat/settings.py", "settings.py", "file", "pygoat", 240),
        ("pygoat/urls.py", "urls.py", "file", "pygoat", 95),
        ("pygoat/wsgi.py", "wsgi.py", "file", "pygoat", 45),
        ("introduction/views.py", "views.py", "file", "introduction", 320),
        ("introduction/urls.py", "urls.py", "file", "introduction", 120),
        ("introduction/models.py", "models.py", "file", "introduction", 185),
        ("introduction/forms.py", "forms.py", "file", "introduction", 95),
        ("introduction/auth.py", "auth.py", "file", "introduction", 140),
        ("introduction/sql_lab.py", "sql_lab.py", "file", "introduction", 110),
        ("introduction/cmdi.py", "cmdi.py", "file", "introduction", 85),
        ("introduction/xss.py", "xss.py", "file", "introduction", 75),
    ]
    edges_spec = [
        ("pygoat/urls.py", "introduction/urls.py"),
        ("pygoat/wsgi.py", "pygoat/settings.py"),
        ("introduction/urls.py", "introduction/views.py"),
        ("introduction/views.py", "introduction/models.py"),
        ("introduction/views.py", "introduction/forms.py"),
        ("introduction/views.py", "introduction/auth.py"),
        ("introduction/views.py", "introduction/sql_lab.py"),
        ("introduction/views.py", "introduction/cmdi.py"),
        ("introduction/views.py", "introduction/xss.py"),
        ("introduction/auth.py", "introduction/models.py"),
        ("introduction/sql_lab.py", "introduction/models.py"),
        ("introduction/cmdi.py", "introduction/models.py"),
        ("introduction/xss.py", "introduction/models.py"),
        ("introduction/forms.py", "introduction/models.py"),
    ]
    return DiagramArtifact(
        repo_id="pygoat",
        generated_at_iso=_iso_now(),
        nodes=_make_nodes(nodes_spec),
        edges=_make_edges(edges_spec),
        svg_blobs=_svg_blobs(
            "OWASP / PyGoat",
            ("#052e2b", "#34d399", "#065f46"),
        ),
        stats={
            "nodes": 70,
            "edges": 124,
            "total_files": 70,
            "total_loc": 6_840,
        },
        render_errors=["canned_variant_demo:pygoat"],
    )


_BUILDERS = {
    "fastapi-fullstack": _build_fastapi_fullstack,
    "nodegoat": _build_nodegoat,
    "pygoat": _build_pygoat,
}


def is_canned_demo(repo_id: str) -> bool:
    return repo_id in _BUILDERS


def build_canned_artifact(repo_id: str) -> DiagramArtifact | None:
    """Return a freshly-stamped canned variant for `repo_id`, or None."""
    builder = _BUILDERS.get(repo_id)
    if builder is None:
        return None
    return builder()


def canned_repo_ids() -> list[str]:
    return list(CANNED_DEMO_KEYS)


# --- What-If Simulate canned response (2FA Service example) ---


# Stub canned shape returned by `/api/diagram/<repo_id>/simulate` regardless of
# the requested `user_intent`. Real Athena V4-Pro LLM generation deferred to
# Phase 2 (post-event).
def canned_simulate_response() -> dict[str, object]:
    """Build the canned What-If response payload.

    Returns a JSON-serializable dict; the route layer wraps the base_diagram
    field with the live `DiagramArtifact.model_dump()` of the target repo so
    the frontend can overlay the proposed delta on the real (or canned)
    base graph.
    """
    proposed_nodes = [
        {
            "id": "two-factor-auth-service",
            "label": "2FA Service",
            "type": "service",
            "proposed": True,
            "metadata": {
                "module": "security",
                "loc": 0,
                "language": "python",
                "symbol_count": 0,
                "has_parse_error": False,
            },
        }
    ]
    proposed_edges = [
        {
            "from": "auth-service",
            "to": "two-factor-auth-service",
            "label": "delegates to",
            "proposed": True,
        },
        {
            "from": "two-factor-auth-service",
            "to": "user-store",
            "label": "verifies",
            "proposed": True,
        },
    ]
    explanation = (
        "Adding 2FA service inserts between auth-service and user-store, "
        "delegating verification calls to the new component. The login flow "
        "now requires a second verification round trip; existing session "
        "issuance contracts remain unchanged."
    )
    return {
        "proposed_nodes": proposed_nodes,
        "proposed_edges": proposed_edges,
        "explanation": explanation,
        # Honest claim marker (Lock 5): the response is a canned stub.
        "canned_stub": True,
        "canned_marker": "phanes_simulate_canned_v1",
    }
