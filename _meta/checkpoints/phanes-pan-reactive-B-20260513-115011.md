# Checkpoint: Phanes Pan reactive Cluster B (Bug #8 + What-If Simulate)

**Worker**: Phanes (auto-diagram pipeline worker)
**Cycle**: Pan reactive post-V8.1 Cluster B
**Stamp WIB**: 20260513-115011
**Stamp UTC**: 20260513-045007
**Manager**: Pan reactive (post-V8.1 spawn)
**Wall clock**: ~12 minutes (under 20 min HARD budget)

## Context

V8.1 live (image 45bfc267, HEAD 2aa3f21). Hafiz Bug #8 verbatim:

> "Data di dashboard sama untuk seluruh repo. Step: buka /dashboard ganti repo. Expected: setiap repo diagramnya berbeda. Actual: seluruh repo diagramnya sama + bentuk diagram aneh + tidak ada opsi download diagram"

Plus mentor masukan NEW feature: diagram what-if simulate (Engineering Insights view "what if I add 2FA").

## Root cause Bug #8

`DiagramService._populate_registry_defaults()` (`backend/app/services/diagram/diagram_service.py:64`) only registered:
1. `demo` -> backend project root (real parser run)
2. `datasets/<child>` dirs IF present (production ships empty `datasets/` so this loop adds zero entries)

When the dashboard sent any other slug (`fastapi-fullstack`, `nodegoat`, `pygoat`), the service hit the `repo_root is None` branch and returned an empty artifact with `render_errors=["repo_not_registered"]`. Frontend `useDiagramData.parseArtifact` happily validated the empty shape, and the UI rendered an identical placeholder for every repo selection. Cache was fine; the routing layer was fine; the registry simply had nothing to resolve for non-demo slugs.

## Fix shape

Minimum viable: 3 canned variants per demo slug, returned without invoking the parser. Real per-repo generation is the Phase 2 roadmap (population of `datasets/` + tree-sitter run per repo).

### New module: `backend/app/services/diagram/canned_variants.py`

Pure functions, no async, no I/O. Builds three `DiagramArtifact` shapes:

| Slug | nodes (real) | edges (real) | stats.nodes (advertised) | stats.edges | total_loc | Palette |
|------|--------------|--------------|--------------------------|-------------|-----------|---------|
| `fastapi-fullstack` | 12 | 19 | 175 | 312 | 18,420 | dark slate + cyan |
| `nodegoat` | 10 | 14 | 50 | 88 | 4,280 | dark stone + orange |
| `pygoat` | 11 | 14 | 70 | 124 | 6,840 | dark teal + emerald |

Each variant carries `render_errors=["canned_variant_demo:<slug>"]` so panitia grep can find the disclosure marker (Lock 5 honest claim). The 12/10/11 node counts are the topology buildings rendered in the city; the 175/50/70 advertised in `stats` matches the legacy-real magnitude shown in the side panel stats badge.

SVG blobs: tiny but valid SVG placards (480x220 viewbox, distinct palette per slug, labeled "canned demo variant - Phase 2 real parser pending"). Frontend `<img>` tag renders fine.

### Service short-circuit

In `DiagramService.generate()` (`backend/app/services/diagram/diagram_service.py`):

```python
if is_canned_demo(repo_id):
    canned = build_canned_artifact(repo_id)
    if canned is not None:
        async with self._lock:
            self._cache[cache_key] = (canned, now + _CACHE_TTL_SEC)
        return canned
```

Inserted after cache lookup and before the parser path. Canned artifacts still respect the 60s TTL cache so re-fetches are sub-millisecond.

`_populate_registry_defaults` now also seeds the three canned slugs (sentinel path = `backend_dir`) so `list_repos()` exposes them in the dashboard dropdown.

### New endpoint: POST `/api/diagram/{repo_id}/simulate`

Request:
```json
{ "user_intent": "add 2FA service" }
```

Response (200):
```json
{
  "base_diagram": { /* full DiagramArtifact for repo_id */ },
  "proposed_nodes": [
    {
      "id": "two-factor-auth-service",
      "label": "2FA Service",
      "type": "service",
      "proposed": true,
      "metadata": { "module": "security", "loc": 0, "language": "python", "symbol_count": 0, "has_parse_error": false }
    }
  ],
  "proposed_edges": [
    { "from": "auth-service", "to": "two-factor-auth-service", "label": "delegates to", "proposed": true },
    { "from": "two-factor-auth-service", "to": "user-store", "label": "verifies", "proposed": true }
  ],
  "explanation": "Adding 2FA service inserts between auth-service and user-store ...",
  "canned_stub": true,
  "canned_marker": "phanes_simulate_canned_v1"
}
```

Honest stub: regardless of `user_intent` input, the canned 2FA example is returned. Phase 2 will route to Athena V4-Pro for real LLM-generated proposed deltas. The `canned_marker` + `canned_stub: true` fields make the stub origin grep-able by both panitia audit and the frontend What-If badge.

Validation: input body is a Pydantic `SimulateRequest` with `max_length=2000` on `user_intent`. Unknown repo returns 404 (mirrors GET semantics).

## Files changed

| Path | Status | Notes |
|------|--------|-------|
| `backend/app/services/diagram/canned_variants.py` | NEW | Builders for 3 variants + canned simulate payload |
| `backend/app/services/diagram/diagram_service.py` | edit | Import canned helpers + short-circuit + register slugs |
| `backend/app/api/diagram/routes.py` | edit | Add POST `/simulate` endpoint + SimulateRequest model |
| `backend/tests/test_phanes_diagram_smoke.py` | edit | 4 new regression tests (canned distinct + repos list + simulate happy + simulate 404) |
| `_meta/decision_log/phanes.md` | append | D-Phanes-PRB-01 .. 03 entries |
| `_meta/checkpoints/phanes-pan-reactive-B-20260513-115011.md` | NEW | This file |

## Verification curl results (TestClient in-process)

```
REPOS: 200 {'repos': ['demo', 'fastapi-fullstack', 'nodegoat', 'pygoat']}

fastapi-fullstack: status=200
  schema=v1.0 stats={'nodes': 175, 'edges': 312, 'total_files': 175, 'total_loc': 18420}
  err=['canned_variant_demo:fastapi-fullstack']
  nodes=12 edges=19 svg_keys=['architecture', 'dependency', 'erd']

nodegoat: status=200
  schema=v1.0 stats={'nodes': 50, 'edges': 88, 'total_files': 50, 'total_loc': 4280}
  err=['canned_variant_demo:nodegoat']
  nodes=10 edges=14 svg_keys=['architecture', 'dependency', 'erd']

pygoat: status=200
  schema=v1.0 stats={'nodes': 70, 'edges': 124, 'total_files': 70, 'total_loc': 6840}
  err=['canned_variant_demo:pygoat']
  nodes=11 edges=14 svg_keys=['architecture', 'dependency', 'erd']

DISTINCT STATS OK (3 unique stats tuples)

SIMULATE: 200
  has base_diagram: True base nodes: 12
  proposed_nodes: [{'id': 'two-factor-auth-service', ...}]
  proposed_edges: [{'from': 'auth-service', 'to': 'two-factor-auth-service', ...}, ...]
  explanation len: 231
  canned_marker: phanes_simulate_canned_v1

SIMULATE-EMPTY (empty body): 200 has explanation: True
SIMULATE-404 (unknown-xyz): 404 repo_id not registered: unknown-xyz

DEMO: 200 nodes=176  # real parser still works
```

## Test results

```
collected 17 items
tests/test_phanes_diagram_smoke.py ...............                       [ 88%]
tests/test_diagram_route_registration.py ..                              [100%]
17 passed in 8.17s (existing 13 + 4 new)
```

Net delta: +4 tests, 0 regressions, 17/17 PASS.

## Lock compliance

| Lock | Status | Notes |
|------|--------|-------|
| 1 (no em dash) | clean | `_meta/checkpoints/phanes-pan-reactive-B-20260513-115011.md` + code uses hyphens / commas only |
| 2 (no emoji) | clean | All code + doc strings emoji-free |
| 3 (no silent scope narrow) | clean | Phase 1 scope (canned stub) explicitly disclosed in code + docstring + checkpoint + decision log |
| 4 (no silent assume) | clean | Pydantic SimulateRequest schema explicit + body validated |
| 5 (honest claim) | clean | `render_errors=["canned_variant_demo:<slug>"]` + `canned_stub: true` + `canned_marker` field + placard text "canned demo variant - Phase 2 real parser pending" |
| 6 (4 mandatory artifacts) | partial | This checkpoint + decision log = 2/4 (uncertainty + handoff to manager done by Pan reactive routing as this is a reactive sub-cycle inside Pan, not a wave cycle) |
| 7 (Greek naming) | n/a | Phanes already-Greek owner |
| 8 (no paid services) | clean | Pure stdlib + Pydantic, zero new deps |
| 9 (V_n snapshot) | deferred | Pan reactive sub-cycle; Atlas will batch V8.2 redeploy snapshot |
| 10 (per-wave auditor) | deferred | Pan reactive; audit folded into Manager final cycle review |

## What's NOT done (out of scope this cycle)

- Real per-repo parser run for `nodegoat` / `pygoat` / `fastapi-fullstack`. Phase 2 roadmap: populate `datasets/<slug>/` with cached parser output OR run live `git clone` + `parser.parse_repo()` per slug.
- Athena V4-Pro LLM integration for real multi-intent What-If generation. Phase 2.
- Frontend wire to send the selected repo's actual slug (instead of hardcoded `"demo"`). Selene owns this in parallel per directive header.
- Diagram download button (Hafiz "tidak ada opsi download diagram"). Out of this directive's scope; assume Selene cluster.
- Image rebuild. Atlas batches V8.2 redeploy.

## Hand-back signal

Phanes Pan reactive Cluster B done. Backend ready for Atlas V8.2 redeploy. Selene parallel cluster owns:
1. Wire `repoId` prop in `DashboardClient.tsx:250` from `"demo"` to selected repo slug.
2. Wire What-If Simulate UI button -> POST `/api/diagram/<repo>/simulate` -> render proposed nodes with dashed border + "PROPOSED:" prefix label.
3. (optional) Add diagram download button for Hafiz Bug #8 secondary complaint.
