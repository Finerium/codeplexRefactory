# Demeter Manager FINAL Cycle 2 Ship Report

[LOCK1_OVERRIDE: git CLI flag documentation in curl evidence block. Flags
like `-follow`, `-reverse`, `-numstat` appear with their real dash count
inside subprocess argument lists or curl verification output.]

**STAMP**: 20260513-0857 WIB Day 2 morning
**Worker**: Demeter (Manager FINAL Cycle 2 backend cross-cluster A+B+C)
**Manager**: Manager FINAL Cycle 2 (orches-v1Refactory_2)
**Spawn directive**: `_meta/orchestration_log/manager_final_cycle2_directive_20260513-0857.md`
**Wall-clock**: ~25 min agent time
**Ferry triggered**: NONE.

## Cluster A (cache audit) ship status

- [x] Audit complete. 3 surfaces inspected (DemeterRealService finding lookup, DiagramService artifact cache, SemanticCache lookup).
- [x] **Finding 1 fixed**: `list_findings_for_building(building_id)` accepted no `repo_full_name` filter. Cross-repo collision risk now closed via optional `repo_full_name=` kwarg propagated through `GET /api/findings/by-building/{id}?repo_full_name=owner/name`. Legacy callers unaffected.
- [x] **Finding 2 fixed**: `DiagramService._cache` keyed by `repo_id` alone. Silent stale-path return when `register_repo()` remapped. Cache key promoted to `(repo_id, str(resolved_repo_root))`. `register_repo()` synchronously purges keys for prior path on remap.
- [x] **Finding 3 fixed (additive)**: `SemanticCache` had a single flat bucket across all callers. Added `scope` kwarg (default `_default`); callers can opt-in via `scope=repo_full_name`. Cross-repo prompt poisoning impossible once scope is set.
- [x] Tracing: cache hit/miss for `/api/findings/scan` does NOT cache results (always live scan). `/api/repos/list` does NOT cache (per-call decrypt + httpx). `/api/diagram/{repo_id}` cache repo-scoped after fix.

## Cluster B (LOC snapshot endpoint) ship status

- [x] NEW `POST /api/activity/loc-snapshot` body `{timestamp, repo_root}`. Returns `{commit_sha, file_count, files: {path: loc}, cached, elapsed_ms, notes}`.
- [x] Boreas concurrent extension absorbed: request model now accepts optional `repo_full_name` plus response carries `nearby_commits[]` for tooltip card.
- [x] Implementation: git rev-list resolves sha at-or-before timestamp; git ls-tree enumerates files; per-file git cat-file size guard plus git show parallel via `asyncio.gather` with `Semaphore(8)`. 5 MB blob cap guards binaries.
- [x] Cache: in-process dict 1-hour TTL keyed by `(resolved_repo_root_str, bucketed_iso_minute)`. Cluster A lesson applied: repo_root part of key prevents cross-repo alias.
- [x] Prehistoric timestamp returns empty plus `notes=[no_commit_before_timestamp]` so frontend can render zero baseline.
- [x] Bad repo_root returns HTTP 400 explicit (no silent NodeGoat fallback per Bug #7 lesson).

## Cluster C (per-file commits endpoint) ship status

- [x] NEW `GET /api/buildings/{owner}/{repo}/{file_path:path}/commits?repo_root=&limit=&branch=` returns floor-ordered commit array.
- [x] Floor numbering chronological: floor 1 = oldest commit, floor N = newest. Persephone consumes for side panel; Iris consumes for stacked-floor geometry.
- [x] Implementation: git log with follow, reverse, iso-strict date, custom pretty-format, numstat flags scoped to single file. Parsed into ordered blocks.
- [x] Cache: in-process dict 10-min TTL keyed by `(repo_root_str, file_path, branch)`. Cluster A lesson applied.
- [x] `_resolve_repo_root()` walks explicit query, project working tree, datasets/, tests fixtures. 400 if unresolved.

## Smoke evidence summary

### pytest

```
cd backend && DEMETER_DISABLE_REAL=1 python3.14 -m pytest tests/test_demeter_mf2_endpoints.py
============================== 9 passed in 26.96s ==============================
```

### curl real-server

```
LOC snapshot now() against project repo
=> commit_sha=77099bfd3b7a, file_count=1038, cached=False, elapsed_ms=13949

LOC snapshot same args second call
=> cached=True, elapsed_ms=0, file_count=1038

LOC snapshot prehistoric (1990)
=> commit_sha=null, file_count=0, notes=[no_commit_before_timestamp]

LOC snapshot bad repo_root
=> HTTP 400

Commits README.md
=> total_floors=6 floors[0]=floor1 2026-05-12 "wave 0 ship" floors[5]=floor6 2026-05-13 "V6 lock"

Commits second call
=> cached=True, elapsed_ms=0

Commits bad repo_root
=> HTTP 400

/api/findings/by-building/foo?repo_full_name=Finerium%2FcodeplexRefactory
=> HTTP 503 (Demeter real disabled in smoke env, query param accepted)
```

## 20-item self-check

See `_meta/checkpoints/demeter-cycle2mf2-20260513-0857.md` for the full 20-item table. All 20 pass.

## Open items for downstream

- **Triton** chat + onboarding + security routers: pass `scope=session.repo_full_name` into `semantic_cache.lookup()` plus `store()` to activate per-repo isolation. Pre-Cycle-2 callers continue to use the `_default` bucket unchanged.
- **Asclepius** glow consumer (frontend): pass `?repo_full_name=...` to `/api/findings/by-building/{id}` once the user has selected an active repo. Without this, findings continue to surface cross-repo (matches pre-Cycle-2 behavior).
- **DiagramService**: cache key fix is automatic; no consumer changes required.
- **Boreas frontend**: `/api/activity/loc-snapshot` requires `repo_root` (absolute filesystem path) today. When the frontend has only the `repo_full_name` slug, the request model already accepts it but the server still resolves via path; production rollout needs a server-side `repo_full_name -> path` resolver or shallow-clone helper. Out of scope this cycle; flagged for Wave 4 or Pan post-submission.
- **Persephone side panel**: consume `/api/buildings/{owner}/{repo}/{file_path:path}/commits` array. Floor 1 oldest at panel bottom, floor N newest at panel top (matches city building physical metaphor).
- **Iris per-floor geometry**: stack N BoxGeometry slabs per N entries in `floors[]`. Height per floor uniform; let Iris pick aesthetic constant.

## Lock compliance

- Lock 1 (no em dash): clean. `LOCK1_OVERRIDE` header on buildings/routes.py module docstring because git CLI flag enumeration is unavoidable.
- Lock 2 (no emoji): clean.
- Lock 3 (token security): no change.
- Lock 4 (schema not unilaterally extended): no DB change.
- Lock 5 (honest claim): real subprocess, no mock fallback, pytest + curl evidence captured. 400 explicit errors documented.
- Lock 6 to Lock 10: see 20-item self-check.

## Sign-off

Ship ready for Aether + Pan dual audit. Boreas + Iris + Persephone may consume immediately. Manager FINAL Cycle 2 ship report complete.

Signed,
Demeter Wave 3 backend, Manager FINAL Cycle 2
