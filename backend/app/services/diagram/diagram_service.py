"""DiagramService orchestrator (Phanes Wave-Fixing #2 cycle 1).

Pipeline:
1. Resolve repo_id -> filesystem root path (demo dataset registry lookup).
2. Call Hades ParserService.parse_repo (in-process consumer).
3. Build nodes + edges from ParsedRepo (file/module/import topology).
4. Render 3 SVG blobs (mermaid architecture, graphviz dependency, eralchemy ERD).
5. Assemble DiagramArtifact + cache (60s TTL).

Cache: in-process dict keyed by (repo_id, repo_root_mtime_bucket). Invalidate
via DiagramService.invalidate(repo_id) called by `/refresh` endpoint and
webhook handler.
"""
from __future__ import annotations

import asyncio
import base64
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING

from app.services.diagram.canned_variants import (
    build_canned_artifact,
    canned_repo_ids,
    is_canned_demo,
)
from app.services.diagram.eralchemy_renderer import render_erd_svg
from app.services.diagram.graphviz_renderer import render_dependency_svg
from app.services.diagram.mermaid_renderer import render_architecture_svg
from app.services.diagram.types import DiagramArtifact, DiagramEdge, DiagramNode

if TYPE_CHECKING:
    from app.parsers.types import ParsedRepo

logger = logging.getLogger("phanes.diagram.service")

# In-process cache TTL (seconds). PRD Section 17.3 line 1089 doesn't mandate
# a TTL; 60s is a sane MVP default that absorbs burst traffic without staling
# webhook-driven updates (webhook calls invalidate() directly).
_CACHE_TTL_SEC = 60.0


class DiagramService:
    """Orchestrate the 3-renderer diagram pipeline.

    Singleton via `get_diagram_service()`. Used by `/api/diagram/<repo_id>` +
    `/api/diagram/<repo_id>/refresh` + WebSocket diagram-events emitter.
    """

    def __init__(self) -> None:
        # Manager FINAL Cycle 2 Cluster A audit fix: cache key was
        # `repo_id` alone, which silently collides when `register_repo()`
        # is called twice with the same repo_id but different filesystem
        # roots (for example user switches local checkout but same slug).
        # Key is now `(repo_id, repo_root_resolved_str)` so a registry
        # remap drops the stale artifact and forces a re-render.
        self._cache: dict[tuple[str, str], tuple[DiagramArtifact, float]] = {}
        self._lock = asyncio.Lock()
        # Demo repo registry. Production wires real GitHub repo clone path
        # resolution; MVP maps known demo slugs to project root or test fixture.
        # `demo` resolves to the Codeplex backend dir itself so the artifact
        # is non-empty during demo + smoke tests.
        self._registry: dict[str, Path] = {}
        self._populate_registry_defaults()

    def _populate_registry_defaults(self) -> None:
        """Register default demo repos: project backend + any cached datasets.

        Pan reactive Cluster B (Bug #8): also register the three canned demo
        slugs (`fastapi-fullstack`, `nodegoat`, `pygoat`) with a sentinel
        path so `list_repos()` surfaces them in the dashboard dropdown.
        Resolution falls through to the canned builder in `generate()` and
        never touches the parser, so the sentinel path can be unreachable.
        """
        # backend/ itself is non-trivial enough for a real demo artifact.
        backend_dir = Path(__file__).resolve().parents[3]
        self._registry["demo"] = backend_dir
        # Optional: datasets/ holds Hades' cached parser snapshots if present.
        datasets_dir = backend_dir.parent / "datasets"
        if datasets_dir.is_dir():
            for child in datasets_dir.iterdir():
                if child.is_dir():
                    self._registry[child.name] = child
        # Canned demo slugs (Bug #8 minimum viable fix): register a sentinel
        # path so list_repos() surfaces them; `generate()` short-circuits on
        # `is_canned_demo()` before parser invocation.
        for slug in canned_repo_ids():
            self._registry.setdefault(slug, backend_dir)

    def register_repo(self, repo_id: str, repo_root: Path) -> None:
        """Allow external callers (webhook) to register repo root mapping.

        Manager FINAL Cycle 2 Cluster A: if the new `repo_root` differs from
        the previously registered path, drop any cached artifact keyed under
        a stale path so the next `generate()` call rebuilds against the new
        filesystem root.
        """
        prev = self._registry.get(repo_id)
        self._registry[repo_id] = repo_root
        if prev is not None and prev.resolve() != repo_root.resolve():
            # Synchronous purge (lock not held; safe since callers serialize
            # registration through their own paths and cache reads are
            # tolerant of empty state).
            doomed = [k for k in self._cache if k[0] == repo_id]
            for k in doomed:
                self._cache.pop(k, None)
            logger.info(
                "diagram cache repo_remap purged repo_id=%s old=%s new=%s",
                repo_id,
                prev,
                repo_root,
            )

    def list_repos(self) -> list[str]:
        return sorted(self._registry.keys())

    def resolve_repo_root(self, repo_id: str) -> Path | None:
        return self._registry.get(repo_id)

    async def invalidate(self, repo_id: str) -> None:
        """Drop cached artifact for repo_id (called by /refresh + webhook).

        Manager FINAL Cycle 2 Cluster A: walks all keys whose first tuple
        slot matches `repo_id` so every (repo_id, root_path) variant is
        purged, not just the currently registered root.
        """
        async with self._lock:
            doomed = [k for k in self._cache if k[0] == repo_id]
            for k in doomed:
                self._cache.pop(k, None)
            logger.info(
                "diagram cache invalidated repo_id=%s purged=%d",
                repo_id,
                len(doomed),
            )

    async def generate(
        self,
        repo_id: str,
        force: bool = False,
    ) -> DiagramArtifact:
        """Generate DiagramArtifact for repo_id, honoring cache unless force=True.

        Resolves repo_id via internal registry. Unknown repo_id yields an
        artifact with `render_errors=['repo_not_registered']` and empty nodes.
        """
        now = time.monotonic()
        # Resolve repo_root early so the cache key reflects the currently
        # registered filesystem path (Manager FINAL Cycle 2 Cluster A).
        repo_root = self.resolve_repo_root(repo_id)
        cache_key = (
            repo_id,
            str(repo_root.resolve()) if repo_root else "<unregistered>",
        )
        if not force:
            async with self._lock:
                cached = self._cache.get(cache_key)
                if cached is not None and cached[1] > now:
                    return cached[0]

        # Pan reactive Cluster B (Bug #8): canned demo short-circuit. When the
        # frontend dashboard selects a known demo slug, skip the parser and
        # return a fabricated artifact with a distinct topology + SVG palette
        # per slug so visual differentiation is visible during pitch. Marked
        # via `render_errors=["canned_variant_demo:<slug>"]` (Lock 5 honest
        # claim disclosure).
        if is_canned_demo(repo_id):
            canned = build_canned_artifact(repo_id)
            if canned is not None:
                async with self._lock:
                    self._cache[cache_key] = (canned, now + _CACHE_TTL_SEC)
                return canned

        if repo_root is None or not repo_root.is_dir():
            artifact = DiagramArtifact(
                repo_id=repo_id,
                generated_at_iso=_iso_now(),
                nodes=[],
                edges=[],
                svg_blobs={},
                stats={"nodes": 0, "edges": 0},
                render_errors=["repo_not_registered"],
            )
            return artifact

        # Step 1+2: parse repo via Hades' parser service.
        from app.parsers import get_parser_service

        parser = get_parser_service()
        parsed = await parser.parse_repo(repo_root)

        # Step 3: derive nodes + edges from ParsedRepo.
        nodes, edges = _derive_topology(parsed, repo_root)

        # Step 4: render 3 SVG blobs in parallel via run_in_executor.
        # mermaid/graphviz/eralchemy are blocking; offload to default executor.
        loop = asyncio.get_running_loop()

        async def _render_arch() -> tuple[bytes, str | None]:
            return await loop.run_in_executor(None, render_architecture_svg, parsed)

        async def _render_dep() -> tuple[bytes, str | None]:
            return await loop.run_in_executor(None, render_dependency_svg, parsed)

        async def _render_erd() -> tuple[bytes, str | None]:
            return await loop.run_in_executor(None, render_erd_svg)

        (arch_svg, arch_err), (dep_svg, dep_err), (erd_svg, erd_err) = await asyncio.gather(
            _render_arch(), _render_dep(), _render_erd()
        )

        svg_blobs: dict[str, str] = {
            "architecture": base64.b64encode(arch_svg).decode("ascii"),
            "dependency": base64.b64encode(dep_svg).decode("ascii"),
            "erd": base64.b64encode(erd_svg).decode("ascii"),
        }
        render_errors: list[str] = []
        if arch_err:
            render_errors.append(f"architecture: {arch_err}")
        if dep_err:
            render_errors.append(f"dependency: {dep_err}")
        if erd_err:
            render_errors.append(f"erd: {erd_err}")

        artifact = DiagramArtifact(
            repo_id=repo_id,
            generated_at_iso=_iso_now(),
            nodes=nodes,
            edges=edges,
            svg_blobs=svg_blobs,
            stats={
                "nodes": len(nodes),
                "edges": len(edges),
                "total_files": parsed.stats.get("total_files", 0),
                "total_loc": parsed.stats.get("total_loc", 0),
            },
            render_errors=render_errors,
        )

        # Cache. Key includes resolved repo_root so re-registration with a
        # different path naturally cache-misses (Manager FINAL Cycle 2 A).
        async with self._lock:
            self._cache[cache_key] = (artifact, now + _CACHE_TTL_SEC)

        return artifact


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _derive_topology(
    parsed_repo: "ParsedRepo",
    repo_root: Path,
) -> tuple[list[DiagramNode], list[DiagramEdge]]:
    """Compute (nodes, edges) for city building geometry + road glow.

    Nodes: 1 per parsed file (capped to top 200 by LOC to fit demo perf
    budget of 200-300 buildings per PRD Section 13.1). Each node carries
    module + LOC + symbol_count metadata.

    Edges: cross-file import dependency. Heuristic: import token last segment
    matches a known file basename in the repo (intra-repo) -> edge.
    """
    if not parsed_repo or not parsed_repo.files:
        return [], []

    try:
        repo_root_resolved = Path(repo_root).resolve()
    except OSError:
        repo_root_resolved = Path(repo_root)

    # Build basename + module-path -> node_id map for import resolution.
    files_sorted = sorted(parsed_repo.files, key=lambda pf: -pf.line_count)[:200]
    basename_to_node: dict[str, str] = {}
    # Module-path lookups: 'app.services.foo' -> node_id 'app/services/foo.py'.
    module_path_to_node: dict[str, str] = {}
    nodes: list[DiagramNode] = []

    for pf in files_sorted:
        try:
            rel = Path(pf.file_path).resolve().relative_to(repo_root_resolved)
            rel_str = rel.as_posix()
        except (ValueError, OSError):
            rel_str = Path(pf.file_path).name
        node_id = rel_str  # stable + human-readable
        basename = Path(pf.file_path).stem
        basename_to_node[basename] = node_id

        # Dotted module path: 'app/services/foo.py' -> 'app.services.foo'.
        # Drops file extension. '__init__.py' becomes parent dotted path.
        mod_path = rel_str.rsplit(".", 1)[0].replace("/", ".")
        if mod_path.endswith(".__init__"):
            mod_path = mod_path[: -len(".__init__")]
        module_path_to_node[mod_path] = node_id

        module_root = rel.parts[0] if rel.parts else "root"
        nodes.append(
            DiagramNode(
                id=node_id,
                label=Path(pf.file_path).name,
                type="file",
                metadata={
                    "module": str(module_root),
                    "loc": int(pf.line_count),
                    "language": pf.language,
                    "symbol_count": len(pf.symbols),
                    "has_parse_error": bool(pf.parse_error),
                },
            )
        )

    edges: list[DiagramEdge] = []
    edge_weight: dict[tuple[str, str], int] = defaultdict(int)
    for pf in files_sorted:
        try:
            rel = Path(pf.file_path).resolve().relative_to(repo_root_resolved)
            rel_str = rel.as_posix()
        except (ValueError, OSError):
            rel_str = Path(pf.file_path).name
        src_id = rel_str
        src_basename = Path(pf.file_path).stem
        for imp in pf.imports:
            dst_id = _resolve_import_target(
                imp, module_path_to_node, basename_to_node
            )
            if dst_id and dst_id != src_id:
                edge_weight[(src_id, dst_id)] += 1
            # Also count basename last-token (legacy heuristic, broader recall).
            last = imp.strip().rsplit(".", 1)[-1].rsplit("/", 1)[-1]
            last = last.replace(";", "").strip().strip("'\"")
            if last and last != src_basename and dst_id is None:
                dst_legacy = basename_to_node.get(last)
                if dst_legacy and dst_legacy != src_id:
                    edge_weight[(src_id, dst_legacy)] += 1

    for (src, dst), weight in sorted(edge_weight.items()):
        edges.append(
            DiagramEdge(
                src=src,
                dst=dst,
                kind="import",
                weight=float(weight),
            )
        )

    return nodes, edges


def _resolve_import_target(
    import_str: str,
    module_path_to_node: dict[str, str],
    basename_to_node: dict[str, str],
) -> str | None:
    """Resolve a Python-style import string to a target node_id.

    Handles:
    - 'import foo'                  -> basename 'foo'
    - 'import foo.bar'              -> module path 'foo.bar'
    - 'from foo.bar import baz'     -> module path 'foo.bar' (+ try 'foo.bar.baz')
    - 'from . import foo'           -> skip (relative, no anchor)
    """
    s = import_str.strip()
    if s.startswith("from "):
        rest = s[5:].strip()
        # 'foo.bar import baz, qux'
        if " import " not in rest:
            return None
        mod_part, _, names_part = rest.partition(" import ")
        mod_part = mod_part.strip()
        if mod_part.startswith("."):
            return None  # relative import, no absolute anchor here
        # Try full module path first.
        if mod_part in module_path_to_node:
            return module_path_to_node[mod_part]
        # Try each `name` qualified, in case `from app.services import foo`
        # actually targets `app/services/foo.py`.
        for name in names_part.split(","):
            name = name.strip().split(" as ")[0].strip()
            if not name:
                continue
            qualified = f"{mod_part}.{name}"
            if qualified in module_path_to_node:
                return module_path_to_node[qualified]
        return None
    if s.startswith("import "):
        rest = s[7:].strip()
        # 'foo.bar' or 'foo.bar as baz' or 'foo, bar'
        first = rest.split(",")[0].strip().split(" as ")[0].strip()
        if not first:
            return None
        if first in module_path_to_node:
            return module_path_to_node[first]
        # Last segment basename fallback.
        last = first.rsplit(".", 1)[-1]
        return basename_to_node.get(last)
    return None


_diagram_service_singleton: DiagramService | None = None


def get_diagram_service() -> DiagramService:
    """Singleton accessor."""
    global _diagram_service_singleton
    if _diagram_service_singleton is None:
        _diagram_service_singleton = DiagramService()
    return _diagram_service_singleton


def reset_diagram_service() -> None:
    """Test helper: reset singleton."""
    global _diagram_service_singleton
    _diagram_service_singleton = None
