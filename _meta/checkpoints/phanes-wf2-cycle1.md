# Checkpoint: Phanes Wave-Fixing #2 Cycle 1

**Worker**: Phanes (NEW)
**Cycle**: 1
**STAMP**: 20260513-0314 WIB
**Status**: SHIP

Mandatory artifact 1 of 4 per Lock 6 (per-cycle 4 artifact requirement).

## Identity recap

Phanes (Φάνης), primordial deity of creation / genesis per Orphic tradition. Mythology fit for auto-generate diagram pipeline, genesis of visual representation from code structure. Anti-collision matrix grep negative pre-spawn (confirmed Manager Wave-Fixing #2 spawn directive line "Phanes not in reserved list Council pre-event Momus/Eos/Prometheus/Mnemosyne plus Runtime resident Athena/Apollo/Argus/Clio/Hermes").

## Scope delivered

Cluster 9 Bug #11 RESCUE: PRD Section 17.3 line 1089 LOCKED diagram pipeline spec (mermaid-py + graphviz + eralchemy) that Hephaestus Wave 0 silently Lock-3 scope-narrowed (ZERO worker assigned). Manager Wave-Fixing #2 verified backend grep ZERO impl at 03:07 WIB Day 2 and dispatched Phanes.

### Backend deps

| Package | Version | Purpose |
|---|---|---|
| `mermaid-py` | 0.8.4 | Mermaid architecture diagram source emit + mermaid.ink HTTP SVG |
| `graphviz` (pure-Python) | 0.21 | DOT source emit + `dot` binary pipe to SVG |
| `eralchemy2` | 1.4.1 | ERD from SQLAlchemy `Base.metadata` |
| `pygraphviz` (transitive via eralchemy2) | 1.14 | libcgraph SWIG binding, needs system graphviz dev headers (brew installed) |

pyproject.toml updated. K8s Dockerfile dependency handoff filed to Atlas (apt-get install graphviz needed for ERD prod render).

### Backend service: `backend/app/services/diagram/`

- `__init__.py`, module init + re-exports
- `types.py`, `DiagramNode` + `DiagramEdge` + `DiagramArtifact` Pydantic v1.0 schema LOCKED
- `mermaid_renderer.py`, architecture diagram from ParsedRepo to mermaid.ink SVG OR inline foreignObject fallback
- `graphviz_renderer.py`, file dependency DAG to DOT to `dot` binary to SVG
- `eralchemy_renderer.py`, Demeter `Base.metadata` to eralchemy2 to ERD SVG via temp file
- `diagram_service.py`, orchestrator: ParserService to 3 renderer parallel to DiagramArtifact + 60s cache + invalidate

### Backend API: `backend/app/api/diagram/`

- `__init__.py`, replaces Hades 503 stub (D-Hades-WF2-03), re-exports router
- `routes.py`, 3 endpoints:
  - GET /api/diagram/repos returns registered repo ids
  - GET /api/diagram/{repo_id} returns DiagramArtifact (cache 60s)
  - POST /api/diagram/{repo_id}/refresh forces regenerate + WS event emit

### Backend WebSocket: `backend/app/api/websocket/diagram_events.py`

- WS /api/ws/diagram-events, frontend subscribe channel, receives `{kind: "diagram-update", repo_id, schema_version, generated_at_iso, stats}` on refresh

### Backend router aggregator

- `backend/app/api/__init__.py`, added `diagram_events_router` import + include_router (next to existing `diagram_router` Hades pre-staged)

### Frontend: `frontend/lib/marketing/diagramConsumer.ts`

- `DiagramConsumer` factory: fetchOnce + subscribe (WS hot-swap) + blobToDataUrl + current + dispose
- `diagramToBuildingGeometry(artifact)` helper, Iris coordinate, maps DiagramNode to building geometry hook shape
- Lives next to `cityEngine.ts` (Iris owns cityEngine.ts; Phanes only adjacent module + integration helper)

### Tests

`backend/tests/test_phanes_diagram_smoke.py`, 9 test PASS:

1. `test_diagram_types_pydantic_shape`, types validate
2. `test_diagram_service_generate_demo_nonempty`, 148+ nodes + 3 SVG blobs
3. `test_diagram_service_unknown_repo_404_marker`, render_errors path
4. `test_diagram_service_cache_hit_returns_same_artifact`, 60s cache
5. `test_http_get_diagram_demo_returns_200`, HTTP integration
6. `test_http_get_diagram_invalid_repo_id_400`, path traversal reject
7. `test_http_list_repos`, repo registry list
8. `test_ws_diagram_events_pushes_refresh_payload`, WS push verified
9. `test_diagram_service_edges_nonempty_for_backend`, 268+ edges resolved

### Live curl verified

```
$ curl http://127.0.0.1:8099/api/diagram/demo
HTTP=200 bytes=158606 time=0.626914s
schema_version= v1.0
repo_id= demo
node_count= 148
edge_count= 268 (after edge resolver improvement)
svg_keys= ['architecture', 'dependency', 'erd']
stats= {'nodes': 148, 'edges': 268, 'total_files': 148, 'total_loc': 25990}
render_errors= []
```

## Ship criteria audit

| # | Criterion | Status |
|---|---|---|
| 1 | Backend deps install verify | PASS (4 packages installed) |
| 2 | Diagram service unit test pytest 5+ PASS | PASS (9 of 9) |
| 3 | GET /api/diagram/demo 200 + JSON nodes + edges + svg_blobs | PASS (live curl) |
| 4 | Frontend cityEngine consume hook wire | PARTIAL (consumer module ready, Iris call deferred via handoff) |
| 5 | WebSocket diagram-update channel push verified | PASS (test) |
| 6 | 4 mandatory artifacts + V5 + worker prompt + roster + anti-collision | THIS CYCLE |
| 7 | Lock 1-10 zero violation | PASS (anti-pattern audit clean) |

## Mandatory artifacts ship

- [x] `_meta/decision_log/phanes.md`, 7 decisions logged
- [x] `_meta/uncertainty/phanes-wf2-cycle1-20260513-0314.md`, 6 concerns surfaced (medium-and-above)
- [x] `_meta/checkpoints/phanes-wf2-cycle1.md`, THIS FILE
- [x] `_meta/handoff_log/wave-fixing-2_phanes_to_manager-wf2_20260513-0314.md`, handoff to Manager
- [x] `_meta/orchestration_log/V5_phanes_locked_20260513-0314.md`, V5 snapshot per Lock 9
- [x] `.claude/agents/phanes.md`, worker prompt for future cycle reference
- [x] `_meta/roster.md`, Phanes row added
- [x] `_meta/contracts/_anti_collision_matrix.md`, Phanes row added

## Next-cycle followups

- Atlas K8s Dockerfile, add `graphviz` apt/apk so ERD renders cleanly in prod (not fallback)
- Iris, call `createDiagramConsumer` + `diagramToBuildingGeometry` in production `/city` scene
- Phase 2 follow-up, per-language import resolver (TS relative paths, Java FQN, C/C++ includes)
- Phase 2 follow-up, LLM-augmented label rewriting (Athena/Clio narration on diagram nodes)

**Phanes cycle 1 closed**. Mandatory artifact 1 of 4.
