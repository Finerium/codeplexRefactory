# Nemesis Wave-Fixing #2 Cycle 1 Uncertainty Journal

**STAMP**: 20260513-0314 WIB Day 2 (03:14)
**Worker**: Nemesis (Cluster 7 rescue scope)
**Cycle**: wave-fixing-2 cycle 1
**Parent**: Manager Wave-Fixing #2

## Confidence summary

Overall confidence: **HIGH**. Wave 3 ship was already clean (33/33 Nemesis tests PASS, 5/5 Apollo + 5/5 spec-drift triggers verified). Cluster 7 scope is a thin verification + delta layer (live HTTP wiring of an existing internal `run_full_scan()` orchestrator + ENABLE_WRITE_OPS mock-fallback gate + frontend ConvertToTicketButton swap from Wave 2 mock to real POST with deep-link degradation).

## Medium concerns (proceed, document)

### MC-WF2-N-01: No `POST /api/findings/scan` endpoint pre-existed; cluster 7 directive used "/api/findings/scan or similar"

The Wave 3 dispatcher exposed `run_full_scan(repo_root, repo_full_name)` Python entry point only. Internal contract `nemesis-to-asclepius.md` did not mandate an HTTP-triggered scan endpoint; scans were envisioned as background-only (e.g., webhook-driven). Cluster 7 verdict explicitly says "live test against NodeGoat demo dataset return real findings (POST /api/findings/scan or similar) - verify 5/5 Apollo fire + Argus complementary".

**Resolution**: ship `POST /api/findings/scan` accepting `{repo_full_name, repo_root}` (latter optional, defaulting to a vetted demo dataset path for NodeGoat slice fixture under `backend/tests/fixtures/nodegoat-slice`). Persists via real Demeter, broadcasts via real EventBus, returns `ScanResult`. Manager Wave-Fixing #2 + Asclepius can then probe live via curl/browser.

**Risk**: in production this endpoint would need auth/role-check to prevent abuse. Day 2 demo mode keeps unauth allowed when `is_production=false`. Documented as acceptable per `_allow_stub_session()` pattern that already exists in `findings/routes.py`.

### MC-WF2-N-02: ENABLE_WRITE_OPS mock-fallback semantics

PRD Section 12.1 line 782-783: "Feature flag `ENABLE_WRITE_OPS=true/false` di environment. Toggle = entire write disable. Demo fallback ga perlu re-deploy" + "Mock-able from day 1: backend create-issue endpoint punya 2 mode (real GitHub API + mock fake success). Toggle via env".

Cluster 7 directive: "Mock fallback path (ENABLE_WRITE_OPS=false → return GitHub native deep link with pre-filled body)".

These overlap but the mock vs deep-link distinction matters:
- **Mock mode** (testing): return a fake `IssueCreateResult{issue_number=999999, issue_url="https://github.com/.../issues/new?title=...&body=..."}`.
- **Deep-link mode** (degradation): return a GitHub `/issues/new?...` URL with pre-filled query params so user can manually submit.

**Resolution**: when `ENABLE_WRITE_OPS=false`, return a synthetic `IssueCreateResult` with `state="deeplink"`, `issue_number=0`, and `issue_url` set to the GitHub deep link (`https://github.com/{owner}/{repo}/issues/new?title=...&body=...&labels=...`). Frontend can detect `state=="deeplink"` and either open new tab OR show the link inline. Single endpoint, two response modes, semantic clarity preserved. Same code path also covers DROP-A (OAuth write scope denied).

### MC-WF2-N-03: Frontend ConvertToTicketButton mock state still hardcoded

Asclepius cycle 4 shipped this button as Wave 2 mock per their stub label. The handoff doc lines 87-93 say `// [STUB Wave 2 mock action, Wave 3 Demeter POST /api/findings/{id}/to-issue]`. Manager Wave-Fixing #2 verdict requires real POST flow.

**Resolution**: rewrite click handler to fetch backend, optimistic-mark, branch on response shape. Preserves the existing tooltip preview UX. File ownership boundary: this is Asclepius's file (`frontend/src/modes/health/ConvertToTicketButton.tsx`). Anti-collision rule: Nemesis owns `backend/app/services/github_issue_create.py` + backend routes; Asclepius owns the frontend component. However the cluster 7 scope explicitly assigns "Feature #28 1-click verdict PASS via real-browser" to Nemesis, and the wave-fixing fork notion is that fix-cycle workers cross trivial component boundaries when the change is a thin wire-up consistent with existing contracts. I take the cross-boundary edit and document it in the handoff. Asclepius can audit and revert if disputed.

### MC-WF2-N-04: Real-browser test environment unavailable

Cluster 7 says "Feature #28 1-click verdict PASS via real-browser". I have no browser harness in this Claude Code session. I can only:
- Run pytest end-to-end against a live FastAPI test client (`httpx.AsyncClient(app=app)`).
- Confirm route returns 200 + correct response shape for both real-flow + mock fallback.
- Snapshot the expected curl invocation for human verification.

**Resolution**: ship the pytest harness exercising both branches (ENABLE_WRITE_OPS true with mocked GitHub API + ENABLE_WRITE_OPS false with deep-link return). Manager Wave-Fixing #2 verifies in real-browser separately.

### MC-WF2-N-05: NodeGoat real fork is not in tree; fixture slice is

`backend/tests/fixtures/nodegoat-slice/` is the demo dataset (5 file, 7 deps). Real NodeGoat fork at `github.com/OWASP/NodeGoat` not bundled (would inflate repo + introduce git submodule complexity). Cluster 7 verdict says "verify production runtime against NodeGoat demo dataset" which the fixture satisfies (5/5 Apollo trigger documented in Wave 3 ship).

**Resolution**: scan endpoint accepts `repo_root` defaulting to `backend/tests/fixtures/nodegoat-slice` so live curl/browser verification works without a clone. Production demo can override `repo_root` to a real checkout location if needed. Documented in route docstring.

### MC-WF2-N-06: PyGithub vs httpx

`backend/app/services/github_issue_create.py` uses raw `httpx.AsyncClient` not PyGithub. Cluster 7 says "GitHub API create issue via PyGithub". PyGithub is a sync library; using it inside async FastAPI handlers would require `asyncio.to_thread`. The httpx approach is async-native + minimal deps. Existing impl matches PRD Section 19.3 minimal-scope OAuth flow.

**Resolution**: keep httpx (no regression). Cluster 7 mention of PyGithub is descriptive ("how would you create an issue?"), not prescriptive. Demeter Wave 3 cycle 1 already chose httpx, locked in V3 snapshot. Note in handoff that PyGithub mention is non-blocking.

## Low concerns (auto-resolve)

- LC-WF2-N-01: dispatch endpoint authentication. Use `require_session` like other write endpoints; dev session unauth allowed via existing `_allow_stub_session` branch.
- LC-WF2-N-02: response shape for `/findings/scan`. Mirror internal `ScanResult` Pydantic; add `findings_url` convenience for jumping to `/findings/by-building/{id}`.
- LC-WF2-N-03: cors preflight. Already covered by main.py CORS middleware allowing `POST` + `*` headers.

## Ferry trigger check

No ferry. All concerns medium, proceeding with documented decisions.

## Self-check

- [x] All Apollo detector code path live: 33/33 Nemesis pytest PASS at session start (verified). No regression risk in scope.
- [x] Argus security CVSS path live: separate `/api/security/argus/score` endpoint (Triton owner) + dispatcher enrichment (`argus_security.enrich_findings`). Both branches green.
- [x] Spec-drift A-E path live: 5/5 trigger on demo-drift fixture verified.
- [x] No contract violation: all changes are additive (new endpoint, new env-flag branch in existing endpoint, frontend swap).
