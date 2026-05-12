"""Mermaid architecture diagram renderer (Phanes Wave-Fixing #2 cycle 1).

Strategy: deterministic Phase 1 MVP. Takes a ParsedRepo from Hades' parser
service, groups files by top-level directory (module), and emits a Mermaid
`graph TD` block representing module containment + file count badges.

SVG output: Mermaid's official approach uses mermaid.ink HTTP renderer to
produce SVG without spawning a JS runtime locally. To keep MVP offline-tolerant
we also fall back to emitting raw Mermaid source string wrapped in a minimal
SVG `<foreignObject>` if the HTTP renderer is unreachable. Frontend `<img>`
tag handles either (foreignObject SVG is parseable browser-side too).

LLM bake-in: NONE. Diagram pipeline Phase 1 deterministic. Phase 2 future
work may add LLM-augmented label rewriting; explicit non-goal per Manager
Wave-Fixing #2 spawn directive.
"""
from __future__ import annotations

import base64
import logging
from collections import defaultdict
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.parsers.types import ParsedRepo

logger = logging.getLogger("phanes.diagram.mermaid")

# Mermaid HTTP renderer (mermaid.ink). Used for true SVG when reachable; falls
# back to inline source SVG wrapper if request fails (offline/CI).
_MERMAID_INK_URL = "https://mermaid.ink/svg"


def _module_root(file_path: str, repo_root: str) -> str:
    """Compute top-level module name for grouping.

    Files in repo root land in `root`. Files in `pkg/sub/x.py` land in `pkg`.
    """
    try:
        rel = Path(file_path).resolve().relative_to(Path(repo_root).resolve())
    except (ValueError, OSError):
        # File outside repo_root or path doesn't resolve. Use first dir.
        parts = Path(file_path).parts
        return parts[0] if parts else "root"
    if len(rel.parts) <= 1:
        return "root"
    return rel.parts[0]


def build_mermaid_source(parsed_repo: "ParsedRepo") -> str:
    """Build deterministic Mermaid graph TD source from ParsedRepo.

    Output shape:
        graph TD
            subgraph M_app[app]
                F_app_main[main.py 120 LOC]
                F_app_config[config.py 45 LOC]
            end
            M_app --> M_services
            M_services --> M_db

    Module containment via subgraph. Edges aggregate cross-module imports.
    """
    if not parsed_repo or not parsed_repo.files:
        return "graph TD\n    empty[No files parsed]\n"

    repo_root = parsed_repo.repo_root
    modules: dict[str, list[tuple[str, int, str]]] = defaultdict(list)
    # cross-module import edge counter; key = (src_module, dst_module).
    edge_weight: dict[tuple[str, str], int] = defaultdict(int)
    # file_path -> module (precomputed for import resolution).
    file_to_module: dict[str, str] = {}

    for pf in parsed_repo.files:
        if pf.parse_error and not pf.symbols:
            continue
        mod = _module_root(pf.file_path, repo_root)
        try:
            rel = Path(pf.file_path).resolve().relative_to(Path(repo_root).resolve())
            rel_str = rel.as_posix()
        except (ValueError, OSError):
            rel_str = Path(pf.file_path).name
        # Use stable id from rel path (sanitize for Mermaid id token rules).
        stable_id = "F_" + rel_str.replace("/", "_").replace(".", "_").replace("-", "_")
        label = f"{Path(pf.file_path).name} {pf.line_count} LOC"
        modules[mod].append((stable_id, pf.line_count, label))
        file_to_module[pf.file_path] = mod

    # Aggregate cross-module import edges.
    for pf in parsed_repo.files:
        src_mod = file_to_module.get(pf.file_path)
        if not src_mod:
            continue
        for imp in pf.imports:
            # Heuristic: only count imports that look intra-repo (starts with
            # top-level module name we already track). External lib imports
            # (numpy, fastapi, etc.) are skipped.
            imp_token = imp.split(".")[0] if "." in imp else imp
            imp_token = imp_token.strip().lstrip("./")
            if imp_token in modules and imp_token != src_mod:
                edge_weight[(src_mod, imp_token)] += 1

    lines: list[str] = ["graph TD"]

    # Sort modules deterministically for stable diagram output.
    for mod in sorted(modules.keys()):
        files = sorted(modules[mod], key=lambda t: t[0])
        lines.append(f"    subgraph M_{_safe(mod)}[{mod}]")
        # Cap files per subgraph to keep diagram readable. Real repos have
        # 100+ files per dir; visual diagram should show top-LOC entries.
        capped = sorted(files, key=lambda t: -t[1])[:8]
        for stable_id, _loc, label in sorted(capped, key=lambda t: t[0]):
            lines.append(f"        {_safe(stable_id)}[{_escape_label(label)}]")
        if len(files) > len(capped):
            lines.append(
                f"        M_{_safe(mod)}_more[plus {len(files) - len(capped)} more files]"
            )
        lines.append("    end")

    # Edges between modules.
    for (src, dst), weight in sorted(edge_weight.items()):
        lines.append(f"    M_{_safe(src)} -->|{weight}| M_{_safe(dst)}")

    return "\n".join(lines) + "\n"


def _safe(token: str) -> str:
    """Sanitize identifier for Mermaid (alphanumeric + underscore)."""
    out = []
    for ch in token:
        if ch.isalnum() or ch == "_":
            out.append(ch)
        else:
            out.append("_")
    if not out:
        return "x"
    if out[0].isdigit():
        out.insert(0, "n")
    return "".join(out)


def _escape_label(label: str) -> str:
    """Mermaid label content: escape pipe + double quote."""
    return label.replace("|", "/").replace('"', "'")


def render_mermaid_svg(mermaid_source: str) -> tuple[bytes, str | None]:
    """Render Mermaid source to SVG bytes.

    Returns (svg_bytes, error_or_none). Strategy:
    1. Try mermaid.ink HTTP renderer (real SVG).
    2. Fall back to inline `<svg><foreignObject>` containing the source string
       (browser parses + Mermaid.js client-side can re-render if present).
    """
    # Strategy 1: mermaid.ink (HTTP, optional). Skip if no network or env flag.
    try:
        import os

        if os.environ.get("PHANES_MERMAID_OFFLINE", "").lower() in ("1", "true", "yes"):
            raise RuntimeError("PHANES_MERMAID_OFFLINE set, using inline fallback")

        import httpx

        # mermaid.ink expects base64url-encoded source after the path.
        encoded = base64.urlsafe_b64encode(mermaid_source.encode("utf-8")).decode("ascii")
        url = f"{_MERMAID_INK_URL}/{encoded}"
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            if resp.status_code == 200 and resp.content.startswith(b"<svg"):
                return resp.content, None
            logger.info(
                "mermaid.ink non-svg response (status=%s, len=%d); using inline fallback",
                resp.status_code,
                len(resp.content),
            )
    except Exception as exc:
        logger.info("mermaid.ink unreachable (%s); using inline fallback", exc)

    # Strategy 2: inline SVG with embedded source for Mermaid.js client-side
    # rendering. Tags are minimal but valid SVG.
    safe_source = (
        mermaid_source.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'width="800" height="600" viewBox="0 0 800 600">\n'
        '  <foreignObject x="0" y="0" width="800" height="600">\n'
        '    <div xmlns="http://www.w3.org/1999/xhtml" class="mermaid">\n'
        f"      {safe_source}\n"
        "    </div>\n"
        "  </foreignObject>\n"
        "</svg>\n"
    )
    return svg.encode("utf-8"), None


def render_architecture_svg(parsed_repo: "ParsedRepo") -> tuple[bytes, str | None]:
    """Top-level entry: ParsedRepo -> architecture SVG bytes + error."""
    source = build_mermaid_source(parsed_repo)
    return render_mermaid_svg(source)
