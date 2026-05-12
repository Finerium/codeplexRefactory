"""Graphviz dependency-graph DAG renderer (Phanes Wave-Fixing #2 cycle 1).

Strategy: pure-Python `graphviz` package (NOT `pygraphviz`) writes DOT source
and calls system `dot` binary to render SVG. System `dot` provided by brew
graphviz (verified install in Phanes ship). pygraphviz pulled in transitively
by eralchemy2 but we don't use it directly here (avoid SWIG complexity).

Input: ParsedRepo from Hades parser. Output: SVG bytes representing file-level
import dependency DAG.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.parsers.types import ParsedRepo

logger = logging.getLogger("phanes.diagram.graphviz")


def build_dependency_dot(parsed_repo: "ParsedRepo") -> str:
    """Build DOT source for file-level dependency DAG.

    Nodes: each file (capped to top 40 by LOC for visual readability).
    Edges: import relationships (file A imports module that maps to file B).
    """
    if not parsed_repo or not parsed_repo.files:
        return "digraph G {\n    empty [label=\"No files parsed\"];\n}\n"

    repo_root = parsed_repo.repo_root
    try:
        repo_root_path = Path(repo_root).resolve()
    except OSError:
        repo_root_path = Path(repo_root)

    # Top files by LOC, cap so dot doesn't choke.
    files_sorted = sorted(parsed_repo.files, key=lambda pf: -pf.line_count)[:40]
    keep_paths = {pf.file_path for pf in files_sorted}

    # Map import string -> candidate file id (heuristic for intra-repo).
    file_id_by_basename: dict[str, str] = {}
    for pf in files_sorted:
        try:
            rel = Path(pf.file_path).resolve().relative_to(repo_root_path)
            rel_str = rel.as_posix()
        except (ValueError, OSError):
            rel_str = Path(pf.file_path).name
        stable_id = _node_id(rel_str)
        file_id_by_basename[Path(pf.file_path).stem] = stable_id

    # Aggregate edges (dedupe).
    edges: set[tuple[str, str]] = set()
    node_decls: dict[str, str] = {}

    for pf in files_sorted:
        try:
            rel = Path(pf.file_path).resolve().relative_to(repo_root_path)
            rel_str = rel.as_posix()
        except (ValueError, OSError):
            rel_str = Path(pf.file_path).name
        src_id = _node_id(rel_str)
        label = f"{Path(pf.file_path).name}\\n{pf.line_count} LOC"
        node_decls[src_id] = label

        for imp in pf.imports:
            # Pull last token (e.g. `app.services.foo` -> `foo`).
            last = imp.strip().rsplit(".", 1)[-1].rsplit("/", 1)[-1]
            last = last.replace(";", "").strip().strip("'\"")
            if last and last != Path(pf.file_path).stem:
                dst_id = file_id_by_basename.get(last)
                if dst_id and dst_id != src_id:
                    edges.add((src_id, dst_id))

    # Emit DOT.
    lines = [
        "digraph G {",
        '    rankdir="LR";',
        '    graph [bgcolor="transparent", fontname="Helvetica"];',
        '    node [shape=box, style="rounded,filled", fillcolor="#0e1420", '
        'fontcolor="#e6e9f2", color="#3a4a66", fontname="Helvetica", fontsize=10];',
        '    edge [color="#5a8cff", arrowsize=0.6];',
    ]
    for node_id, label in sorted(node_decls.items()):
        lines.append(f'    {node_id} [label="{_escape_label(label)}"];')
    for src, dst in sorted(edges):
        lines.append(f"    {src} -> {dst};")
    lines.append("}")
    return "\n".join(lines) + "\n"


def render_dependency_svg(parsed_repo: "ParsedRepo") -> tuple[bytes, str | None]:
    """ParsedRepo -> dependency SVG bytes + error.

    Uses pure-Python `graphviz` package: writes DOT, calls `dot -Tsvg` binary.
    """
    dot_source = build_dependency_dot(parsed_repo)
    try:
        from graphviz import Source

        src = Source(dot_source, format="svg")
        svg_bytes = src.pipe()  # invokes `dot -Tsvg` and returns bytes
        if not svg_bytes.startswith(b"<?xml") and not svg_bytes.startswith(b"<svg"):
            return _fallback_svg(dot_source), "dot output not SVG-shaped"
        return svg_bytes, None
    except Exception as exc:
        logger.warning("graphviz pipe failed: %s", exc)
        return _fallback_svg(dot_source), f"graphviz_render_failed: {exc}"


def _node_id(rel_str: str) -> str:
    """Stable DOT node identifier from relative path."""
    out = []
    for ch in rel_str:
        if ch.isalnum() or ch == "_":
            out.append(ch)
        else:
            out.append("_")
    if not out:
        return "x"
    if out[0].isdigit():
        out.insert(0, "n")
    return "n" + "".join(out)


def _escape_label(label: str) -> str:
    return label.replace('"', "'").replace("|", "/")


def _fallback_svg(dot_source: str) -> bytes:
    """Minimal SVG wrapping raw DOT source for browser-side fallback render."""
    safe = (
        dot_source.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'width="800" height="600" viewBox="0 0 800 600">\n'
        '  <foreignObject x="0" y="0" width="800" height="600">\n'
        '    <pre xmlns="http://www.w3.org/1999/xhtml" '
        'style="color:#e6e9f2;background:#0e1420;padding:12px;font-size:10px;">\n'
        f"{safe}\n"
        "    </pre>\n"
        "  </foreignObject>\n"
        "</svg>\n"
    )
    return svg.encode("utf-8")
