"""ERD renderer via eralchemy2 (Phanes Wave-Fixing #2 cycle 1).

Strategy: read Demeter's SQLAlchemy declarative `Base.metadata` from
`backend/app/models/event_store.py` and pipe through eralchemy2 to render an
ERD SVG. eralchemy2 internally uses pygraphviz which needs system `dot` binary
+ graphviz dev headers; Phanes ship installs brew graphviz to satisfy.

Output bytes are wrapped in SVG (eralchemy2 writes to file path, so we use
a temp file then read back).
"""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

logger = logging.getLogger("phanes.diagram.eralchemy")


def render_erd_svg() -> tuple[bytes, str | None]:
    """Render Demeter event-store ERD to SVG bytes.

    eralchemy2 introspects SQLAlchemy `Base.metadata`. We point it at the
    Demeter Base then render to a temp SVG path.
    """
    try:
        from eralchemy2 import render_er

        # Import metadata via Demeter's Base (re-export via app.models).
        from app.models.event_store import Base
    except Exception as exc:
        logger.warning("eralchemy2 import failed: %s", exc)
        return _fallback_svg("eralchemy2 import failed"), f"import_failed: {exc}"

    # eralchemy expects either a URL string OR sqlalchemy.MetaData. We pass
    # the MetaData (works for offline render without connecting to DB).
    metadata = Base.metadata

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".svg", prefix="phanes_erd_", delete=False
        ) as tf:
            out_path = Path(tf.name)
        render_er(metadata, str(out_path))
        if not out_path.exists() or out_path.stat().st_size == 0:
            return _fallback_svg("eralchemy produced empty file"), "empty_output"
        svg_bytes = out_path.read_bytes()
        try:
            out_path.unlink(missing_ok=True)
        except OSError:
            pass
        return svg_bytes, None
    except Exception as exc:
        logger.warning("eralchemy render failed: %s", exc)
        return _fallback_svg(f"eralchemy render failed: {exc}"), f"render_failed: {exc}"


def _fallback_svg(message: str) -> bytes:
    safe = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'width="800" height="200" viewBox="0 0 800 200">\n'
        '  <rect width="800" height="200" fill="#0e1420"/>\n'
        '  <text x="40" y="100" fill="#e6e9f2" font-family="Helvetica" '
        f'font-size="14">ERD render fallback: {safe}</text>\n'
        "</svg>\n"
    )
    return svg.encode("utf-8")
