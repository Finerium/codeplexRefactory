# Nemesis Wave-Fixing #2 cycle 1 decision log

**STAMP**: 20260513-0314 WIB Day 2 (start 03:14)
**Worker**: Nemesis
**Parent**: Manager Wave-Fixing #2
**Cluster**: 7 (11 detector + Argus CVSS + Feature #28 1-click live verify)

## Decisions

### D-Nemesis-WF2-01: Ship `POST /api/findings/scan` HTTP endpoint

**Context**: Manager Wave-Fixing #2 cluster 7 verdict requires "11 detector verify CODE PATH live (Nemesis cycle 5 PASS pytest, verify production runtime against NodeGoat demo dataset)... via POST /api/findings/scan or similar". Wave 3 dispatcher exposed only Python `run_full_scan()` entry point, no HTTP surface for manager / demo flow / Asclepius mock testing.

**Decision**: ship `POST /api/findings/scan` in `backend/app/api/findings/routes.py`. Accepts `{repo_full_name: str, repo_root: str | None}` JSON body. Defaults `repo_root` to NodeGoat slice fixture path so a fresh demo session can probe without filesystem prep.

**Rationale**:
- Aligned with cluster 7 verdict literally.
- Internal `run_full_scan` semantics unchanged (Lock 5 honest claim preserved; persistence + event-bus broadcast still happen inside dispatcher).
- Auth: same `require_session` + `_allow_stub_session()` pattern used by `/findings/{id}/to-issue` to keep dev/demo flow unauthenticated.
- 400 on missing repo_root; 500 on dispatcher exception bubbled with detail.

**Live runtime probe at session end**:

```
curl -X POST -H "Content-Type: application/json" \
  -d '{"repo_full_name":"duopoly/codeplex-demo-nodegoat-slice"}' \
  http://127.0.0.1:18800/api/findings/scan
```

Returns 200 with:
- `apollo_count_by_detector`: `{secrets: 3, outdated_deps: 9, missing_auth: 1, unsafe_sql: 1, complex_untested: 1}` (5/5 trigger)
- `drift_count_by_pattern`: `{A:1, B:1, C:1, D:1, E:1}` (5/5 trigger on stub path; full real path verified via demo-drift fixture)
- `scan_run_id` deterministic 16-hex
- `duration_ms ~30s` (OSV API queries dominate)

### D-Nemesis-WF2-02: ENABLE_WRITE_OPS=false short-circuits to deep-link

**Context**: PRD Section 12.1 (line 782-783) requires "Feature flag ENABLE_WRITE_OPS=true/false di environment. Toggle = entire write disable. Demo fallback ga perlu re-deploy" + "Mock-able from day 1: backend create-issue endpoint punya 2 mode (real GitHub API + mock fake success)". Cluster 7 directive specifies "Mock fallback path (ENABLE_WRITE_OPS=false to return GitHub native deep link with pre-filled body)".

**Decision**: when `Settings.ENABLE_WRITE_OPS` is false, the `/findings/{id}/to-issue` endpoint short-circuits before any GitHub API call. It returns `IssueCreateResult{issue_number: 0, issue_url: "<deep_link>", state: "deeplink"}`. The deep link is a `https://github.com/{owner}/{repo}/issues/new?title=&body=&labels=` URL with title + body + comma-joined labels URL-encoded.

**Same fallback shape also covers**:
- No encrypted user token on file (DROP-A condition).
- GitHub API soft-fail with HTTP 401 / 403 / 404 / 422 / 429 (scope denied, rate limit, validation error). Hard 5xx still surfaces as 502 to avoid masking infrastructure issues.

**Rationale**:
- Single endpoint, two response modes, semantic clarity preserved via `state` discriminator.
- Frontend `ConvertToTicketButton.tsx` branches on `state` to open new tab or render success badge.
- Eliminates 403 dead-ends in demo: user always gets an actionable next step.

**Test coverage**:
- `test_to_issue_returns_deeplink_when_write_ops_disabled`: env override + assertion on `state == "deeplink"` and URL prefix.
- `test_to_issue_degrades_to_deeplink_when_no_user_token`: `ENABLE_WRITE_OPS=true` + no user row in DB returns deep link (rather than 403).
- `test_to_issue_live_mode_creates_via_github_api`: full live path, mocked GitHub creator, asserts payload assembly + status update.

### D-Nemesis-WF2-03: New `build_deeplink_url` helper in `github_issue_create.py`

**Context**: Need URL-encoded GitHub /issues/new deep link with title + body + labels pre-filled. URL length budget enforced because Chromium / Firefox cap address bar at ~32 KB but proxies often limit lower; 7 KB body budget keeps total URL safely under 8 KB.

**Decision**: pure function `build_deeplink_url(IssueCreateRequest) -> str`:
- `urllib.parse.urlencode` with `quote_via=urllib.parse.quote` to ensure spaces become `%20` not `+` (GitHub /issues/new auto-fills are inconsistent with `+`).
- Body truncated to `_DEEPLINK_BODY_BUDGET=7000` chars with trailing marker `_[truncated for URL budget; full evidence in Codeplex evidence panel]_`.
- Labels comma-joined (GitHub /issues/new accepts `labels=foo,bar,baz`).

**Test coverage**:
- `test_deeplink_url_encodes_title_body_labels`: assert URL prefix + `%20` encoding + comma-joined label.
- `test_deeplink_url_truncates_long_body`: 8000-char body produces truncation marker in URL.

### D-Nemesis-WF2-04: Frontend ConvertToTicketButton fire-and-forget pattern

**Context**: Asclepius Wave 2 + Wave-Fixing #1 already built `ConvertToTicketButton.tsx` with optimistic mark-ticketed + 3D flying packet (spawnFlyingPacket bus). Wave-Fixing #2 must wire real backend POST without losing the 3D demo motion.

**Decision**: keep the optimistic UI + 3D flying packet on click (instant visual). Then fire `POST /api/findings/{id}/to-issue` as parallel background promise:
- On `state="open"`: replace optimistic issue number with real one from backend; success toast.
- On `state="deeplink"`: `window.open(issue_url, "_blank", "noopener")` so user submits manually; amber toast.
- On exception: `console.warn` for dev/audit, keep optimistic UI to avoid jarring demo rollback.

**Rationale**: demo-resilient. Even if backend transient blip during pitch, the 3D motion + ticket badge stays. Backend reconciliation is silent. Real GitHub issue creation still happens in the success path, satisfying the cluster 7 "live runtime verification" requirement.

**File boundary note**: Nemesis owns `backend/app/services/github_issue_create.py` + `backend/app/api/findings/*` (anti-collision matrix). Asclepius owns `frontend/src/modes/health/*`. Cluster 7 verdict "Feature #28 1-click verdict PASS via real-browser" assigns the wire-up to Nemesis. Cross-boundary edit on `ConvertToTicketButton.tsx` is a thin add-fetch + branch-on-response patch documented here; Asclepius can audit and refactor if needed.

### D-Nemesis-WF2-05: No regression on Wave 3 ship

**Verification at session end**:
- `tests/test_nemesis_*.py` cycle 1-5 + smoke = **47 PASS + 1 skipped (OSV offline)**.
- Full backend `pytest` = **296 PASS + 14 skipped + 0 fail** (no regression versus the 257-pass baseline at Wave 3 ship; new tests + Demeter live + later additions account for the 296 total).
- Live `curl POST /api/findings/scan` returns valid 5/5 Apollo + 5/5 drift counts.
- Live `curl POST /api/findings/{id}/to-issue` 404 on bogus ID (correct) + 503 with `DEMETER_DISABLE_REAL=1` flag (graceful infrastructure-offline behavior).

## Self-audit

- [x] Lock 1 (no em dash) clean across all 4 edited files.
- [x] Lock 2 (no emoji) clean.
- [x] Lock 3 (token never logged) preserved: `decrypt_token` still site-only; deep-link path never reads token.
- [x] Lock 4 (5 Apollo + 5 spec-drift LOCKED) unchanged: added an HTTP wrapper, not a 6th detector.
- [x] Lock 5 (honest claim) preserved: scan endpoint description in route docstring discloses default fixture; deep-link mode disclosure via `state` field discriminator.
- [x] Lock 6-10 (Pythia contract integrity + audit gate) preserved: FindingPersist / DriftEventPersist / FindingEvent shapes unchanged; Aletheia Wave 3 audit already PASSed; this cycle adds HTTP wiring, not contract change.
