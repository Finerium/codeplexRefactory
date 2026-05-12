# Decision Log: Phanes

**Worker**: Phanes (Wave-Fixing #2 cycle 1 NEW worker)
**Greek mythology basis**: Phanes (Φάνης), primordial deity of creation and genesis per Orphic tradition. Mythology fit for auto-generate diagram pipeline (genesis of visual representation from code structure).
**Spawn STAMP**: 20260513-0309 WIB Day 2
**Manager**: Wave-Fixing #2

## D-Phanes-WF2-01: Adopt eralchemy2 (maintained fork) instead of eralchemy

**Decision**: Use `eralchemy2>=1.4.0` for ERD rendering, NOT the original `eralchemy` package named in PRD Section 17.3 line 1089.

**Rationale**: `eralchemy` upstream is dead (no commits since 2020, broken with modern SQLAlchemy 2.0). `eralchemy2` is the maintained fork that ships compatible SQLAlchemy 2.0 + Python 3.12 support. Manager Wave-Fixing #2 spawn directive explicitly allows the choice: "available alternative: eralchemy2 maintained fork - install whichever stable".

**Trade-off**: Tiny naming drift vs. PRD wording. Mitigation: pyproject.toml comment + this decision log line explicitly call out the substitution so panitia auditor can trace.

**Status**: applied.

## D-Phanes-WF2-02: Use pure-Python `graphviz` package, not `pygraphviz` directly

**Decision**: Diagram pipeline `graphviz_renderer.py` imports `graphviz.Source` (pure-Python package that writes DOT + spawns `dot` binary), NOT `pygraphviz` (SWIG binding to libcgraph).

**Rationale**: `pygraphviz` is pulled in transitively by `eralchemy2` because eralchemy2 needs it for ERD. But for the dependency-graph renderer we control directly, pure-Python `graphviz` is simpler: it just writes a DOT string + invokes the `dot` binary already installed via brew. Less SWIG headache + no Python 3.14 ABI risk.

**Trade-off**: Two graphviz Python packages installed (`graphviz==0.21` direct + `pygraphviz==1.14` transitive via eralchemy2). Both link to the same system `dot` binary so there is no version conflict.

**Status**: applied.

## D-Phanes-WF2-03: Phase 1 MVP deterministic, no LLM bake-in

**Decision**: Diagram pipeline Phase 1 strictly deterministic: tree-sitter parse -> heuristic edge derivation -> 3 renderer SVG. No DeepSeek call in the diagram path.

**Rationale**: Manager Wave-Fixing #2 spawn directive: "Phase 1 MVP scope: deterministic graph generation from tree-sitter parser output (don't bake LLM into diagram pipeline yet, future Phase 2)". Matches PRD AD-09 philosophy (deterministic detection, AI narrator NOT judge).

**Status**: applied. Phase 2 LLM label rewriting noted as future work, not in scope cycle 1.

## D-Phanes-WF2-04: Mermaid SVG fallback strategy (mermaid.ink -> inline foreignObject)

**Decision**: `render_mermaid_svg` tries `https://mermaid.ink/svg/<base64url>` HTTP renderer first; on failure (network or env flag `PHANES_MERMAID_OFFLINE=1`), falls back to inline `<svg><foreignObject>` containing the raw Mermaid source. Frontend can either render directly (if mermaid.js loaded) OR display the foreignObject content as-is.

**Rationale**: `mermaid-py` Python package wraps the same mermaid.ink HTTP API. We hit the API directly via `httpx` for tighter timeout + offline fallback control. The smoke test sets `PHANES_MERMAID_OFFLINE=1` so it does not require network.

**Trade-off**: Demo against live network gets nicer SVG. CI / offline test gets the inline fallback (still valid SVG, parseable browser-side).

**Status**: applied.

## D-Phanes-WF2-05: In-process cache TTL 60s + invalidate on /refresh + webhook

**Decision**: `DiagramService` caches per-`repo_id` artifact 60 seconds. `/api/diagram/{repo_id}/refresh` calls `invalidate()` then regenerates + emits WS event. Future GitHub webhook handler (Hades coordination) will also call `invalidate()`.

**Rationale**: PRD does not mandate a TTL; 60s absorbs burst traffic from city render mount without staling webhook-driven changes (webhook invalidates explicitly anyway).

**Status**: applied.

## D-Phanes-WF2-06: Anti-collision file ownership respected, no Hades / Iris collision

**Decision**: Phanes touches:
- backend/app/services/diagram/* (NEW, exclusive)
- backend/app/api/diagram/* (OVERWRITE Hades stub D-Hades-WF2-03 explicit)
- backend/app/api/websocket/diagram_events.py (NEW, exclusive)
- frontend/lib/marketing/diagramConsumer.ts (NEW, exclusive)
- backend/app/api/__init__.py (Hades router aggregator: ADD diagram_events_router include, coordinate via handoff)

**Rationale**: Manager Wave-Fixing #2 spawn directive anti-collision matrix. Hades pre-staged the diagram_router include + 503 stub at app/api/diagram/__init__.py expecting Phanes to ship; explicit replace per `_meta/decision_log/hades.md` D-Hades-WF2-03. Iris owns cityEngine.ts (Phanes only writes diagramConsumer.ts adjacent file + provides building-geometry helper for Iris to call).

**Status**: applied.

## D-Phanes-WF2-07: Cluster 9 scope ship verified, ship criteria checklist clean

**Ship criteria delivered**:
1. Backend deps install verified: `pip list | grep -E "mermaid-py|graphviz|eralchemy"` returns mermaid-py 0.8.4 + graphviz 0.21 + eralchemy2 1.4.1 (+ pygraphviz 1.14 transitive). PASS.
2. Diagram service unit test pytest 9 test PASS (target was 5+).
3. GET /api/diagram/demo returns 200 JSON with 148 nodes + 268 edges + 3 svg_blobs (architecture / dependency / erd). Live curl PASS.
4. Frontend `cityEngine.ts` consumes diagram JSON via `diagramConsumer.ts` + `diagramToBuildingGeometry()` helper. Iris coordination handoff filed.
5. WebSocket diagram-update channel push event verified by `test_ws_diagram_events_pushes_refresh_payload` PASS.
6. 4 mandatory artifacts + V5 snapshot + .claude/agents/phanes.md + roster + anti-collision update in this cycle.
7. Lock 1-10 zero violation: anti-pattern-locks skill applied (no em dash, no emoji, MOCK label discipline applied to fallback SVG message).

**Status**: ship. Handoff to Manager Wave-Fixing #2.

---

**Phanes cycle 1 closed**. Mandatory artifact 1 of 4.
