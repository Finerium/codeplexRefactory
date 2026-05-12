# Nemesis Spec-Drift Detection Algorithm Decision

**Author**: Nemesis Wave 3 worker
**Date**: 2026-05-12 21:34 WIB Day 1 evening
**Status**: locked Cycle 1 stub authoring
**Source**: Phase B research Topic 3c inferred (no community precedent), PRD Section 11 5 retak pattern A-E LOCKED, Anti-pattern Lock 4 (5 pattern A-E exhaustive, JANGAN add Pattern F)
**Lock 4 compliance**: 5 pattern A-E LOCKED, definitions verbatim PRD Section 11.3 Tabel

## Why this document exists

Phase B Topic 3c finding line 151 verbatim: "Spec-drift detection algorithms are not OpenSpec-native. OpenSpec validates spec format and tracks state, but does not deterministically detect gap between code-as-implemented and code-as-specified. This must be implemented as a Codeplex-specific module (likely AST-diff between tree-sitter-extracted symbols and OpenSpec spec requirements). `[INFERRED]` Algorithm sketch: parse OpenSpec requirement clauses, extract referenced symbols (function names, endpoints), confirm presence via tree-sitter parsed tree of current code; missing references = drift."

PRD Section 11 LOCKED 5 pattern A-E definitions verbatim. Algorithm per pattern below = Nemesis inferred implementation. Pitch defensibility differentiator per PRD D17 ("other tools tell you what is in your code, we tell you what your code promised vs what it actually delivered").

## Inputs available to detector (post-Hades + Demeter integration)

1. `ParserService.parse_repo(repo_root)` returns `ParsedRepo` with per-file `ParsedFile` containing `symbols` + `imports` + `line_count` (Hades contract `hades-to-nemesis.md`).
2. `ParserService.query_tree(file_path, query_source)` runs tree-sitter query DSL string.
3. GitHub Issue + PR metadata via Demeter materialized view (`hades-to-demeter.md` exposes `list_issues_for_repo` + `list_prs_for_repo`).
4. Git commit history per file (via `subprocess git log` Cycle 4 implement, fallback empty list with degraded severity Cycle 1 stub).
5. OpenSpec Folder A `openspec/archive/<date>/<change>/` proposal.md + design.md + tasks.md markdown.

## Pattern A: Stale closed issue

**PRD Section 11.3 definition**: "Issue closed greater-than 6 bulan lalu, tapi file yang mention di issue terus di-edit setelah closed. Sinyal: Issue dianggap selesai tapi kerjaan masih jalan."

**Algorithm**:
1. Query Demeter for issues per repo with `closed_at` timestamp older than 6 months from scan time (`now - timedelta(days=183)`).
2. For each stale closed issue, regex extract file paths from issue body (pattern: `[a-zA-Z0-9_./-]+\\.(ts|tsx|js|jsx|py|go|java|rs|rb|php|kt|swift|c|cpp|h|hpp)` plus markdown code-block file annotations).
3. For each extracted file path, get latest commit timestamp via git log (or fallback: file `os.stat().st_mtime` minus pre-existing baseline).
4. Trigger condition: `latest_commit_at > closed_at`, indicating file edited after issue closed.
5. Severity heuristic: `medium` baseline, escalate `high` if `(latest_commit_at - closed_at).days > 365` (drift > 1 year).
6. DriftEventPersist evidence JSON: `{"issue_id": ..., "issue_url": ..., "closed_at": ..., "files": [{"path": ..., "latest_commit_at": ..., "edits_after_close": int}]}`.

## Pattern B: Closed without merge

**PRD Section 11.3 definition**: "Issue closed tanpa ada PR yang merge dan touch file relevan. Sinyal: Issue ditutup mungkin karena tidak relevan, tapi spec tetap di tracker."

**Algorithm**:
1. Query Demeter for issues per repo with `closed_at` populated and `state = 'closed'`.
2. For each closed issue, lookup linked PR via Demeter (linked via `closes #N` / `fixes #N` / `resolves #N` regex on PR body, GitHub auto-link semantic).
3. Trigger condition: no linked PR with `merged_at` populated AND no PR with `merged_at` that touches file paths regex-extracted from issue body.
4. Severity heuristic: `low` if recent close less-than 30 days (likely intentional abandon), `medium` baseline, `high` if file paths in issue still exist on disk and have not been edited (spec orphan).
5. DriftEventPersist evidence JSON: `{"issue_id": ..., "issue_url": ..., "closed_at": ..., "expected_files": [...], "matched_prs": [], "reason": "no_linked_pr_with_merge_and_file_touch"}`.

## Pattern C: Spec-implementation lag

**PRD Section 11.3 definition**: "Issue closed dan file di-touch, tapi gap antara closed timestamp dan file last commit greater-than X bulan (configurable). Sinyal: Implementation drifted dari original spec."

**Algorithm**:
1. Query Demeter for issues per repo with `closed_at` populated.
2. For each closed issue, regex extract file paths from issue body.
3. For each extracted file path, get latest commit timestamp.
4. Compute lag: `latest_commit_at - closed_at`. Configurable threshold default 3 months (`LAG_MONTHS_DEFAULT = 3` env override `NEMESIS_DRIFT_C_LAG_MONTHS`).
5. Trigger condition: `lag > threshold AND lag > 0` (positive lag, i.e., file edited after close not before).
6. Severity heuristic: `low` for lag 3-6 months, `medium` for 6-12 months, `high` for greater-than 12 months.
7. DriftEventPersist evidence JSON: `{"issue_id": ..., "closed_at": ..., "latest_commit_at": ..., "lag_days": int, "files": [...]}`.

**Distinct from Pattern A**: A flags stale closed (any edit after close more-than 6mo old close), C flags positive lag specifically (configurable threshold, narrower scope, can trigger on younger issues with sufficient lag).

## Pattern D: Reopened cycle

**PRD Section 11.3 definition**: "Issue di-reopen greater-than-or-equal-to 2x atau ada multiple closing PR yang reverted. Sinyal: Spec keeps changing, building unstable."

**Algorithm**:
1. Query Demeter for issue events per issue (events table: opened, closed, reopened) via GitHub Issues API `/issues/<n>/events` payload persisted by Hades webhook.
2. Count `reopened` event count per issue.
3. Trigger condition primary: `reopened_count >= 2`.
4. Trigger condition secondary: detect closing PR revert by checking commit history of linked PR merge commit, look for subsequent `Revert "Merge pull request ..."` commit message.
5. Severity heuristic: `medium` for 2 reopens, `high` for 3+, `critical` for 4+ or revert-detected.
6. DriftEventPersist evidence JSON: `{"issue_id": ..., "issue_url": ..., "reopened_count": int, "reopened_at": [...], "linked_prs": [...], "revert_detected": bool}`.

## Pattern E: OpenSpec drift (commit hook bypass)

**PRD Section 11.3 definition**: "Commit yang touch file referenced di archived OpenSpec change tapi commit message tidak include `opsx:` prefix. Sinyal: Hook bypass atau merge dari branch tanpa workflow-guard."

**Algorithm**:
1. List archived changes via filesystem walk `openspec/archive/<date>/<change>/`.
2. For each archived change directory, parse `proposal.md` + `tasks.md` markdown. Extract referenced file paths via 2-stage regex: (a) inline code spans `` `path/to/file.ext` ``, (b) markdown links `[label](path/to/file.ext)`, plus (c) bare path tokens matching language extension list.
3. For each referenced file path, get recent commits touching that file via git log (last 100 commits or last 30 days, smaller window).
4. For each commit, parse commit message via subprocess `git log --format=%s%n%b -1 <sha>`.
5. Trigger condition: commit message does NOT start with `opsx:<change-name>:` prefix (Codeplex Chronicle convention `codeplex-chronicle-conventions/SKILL.md` Git commit conventions).
6. Severity heuristic: `high` baseline (workflow-guard breach), `critical` if more-than 5 commits in bypass window or recently bypassed (less-than 7 days).
7. DriftEventPersist evidence JSON: `{"archived_change": "openspec/archive/<date>/<name>/", "referenced_file": ..., "bypass_commits": [{"sha": ..., "message": ..., "author": ..., "committed_at": ...}]}`.

**Inferred mitigation if git unavailable**: fallback emit a Pattern E `info` severity event labeled "spec_e_git_unavailable" so dashboard shows the detector ran but lacked input, instead of silently passing (Lock 5 honest-claim).

## AST-diff inferred algorithm (per Phase B [INFERRED] anchor)

Pattern E uses cross-reference between OpenSpec archived proposals (markdown text) and tree-sitter parsed code (symbol table). This is the AST-diff inferred algo:

1. **Parse OpenSpec proposal markdown clauses**: split markdown by heading section, identify clauses tagged with `requirement:` or `mandatory:` or `WHEN ... SHALL ...` semantic.
2. **Extract referenced symbols from clauses**: regex pattern `(?:function|class|def|export|async)\s+(\w+)` plus inline code spans backtick-enclosed.
3. **Tree-sitter confirm presence**: for each extracted symbol, query parser `parse_file(referenced_file).symbols` to check if symbol still exists.
4. **Diff signal**: if symbol referenced in archived clause but absent from current parse, mark as drift signal (not full Pattern E trigger, supplement evidence to Pattern E commit bypass event).

This is the AST-diff inferred algo Phase B research called out. Conservative implementation: ship Pattern E with commit-bypass trigger as primary signal Cycle 5, supplement with AST-diff symbol-absence as secondary evidence enrichment if Hades provides parser early.

## Severity bucketing harmonization (5-enum LOCKED Asclepius schema)

Per `nemesis-to-asclepius.md` schema line 43: `'critical' | 'high' | 'medium' | 'low' | 'info'`. Per `nemesis-to-demeter.md` schema line 62: same 5 enum. All 5 pattern A-E + 5 Apollo detector severity output MUST be one of these 5 enum strings. JANGAN bikin 'warning' / 'severe' / 'urgent' or other variant.

## False positive mitigation

| Pattern | Risk | Mitigation |
|---|---|---|
| A | Issue body has file paths that are just `README.md` or test fixtures (high noise) | Skip allowlist: README, CHANGELOG, LICENSE, test fixtures matched via path regex; severity downgrade if test_ prefix |
| B | Issue closed because duplicate (no spec, legitimate close) | Detect duplicate label or `closes #N` reference inverse (closing issue references another issue not PR) |
| C | Long-running maintenance file (e.g., utils.ts edited weekly) might always trigger | Skip allowlist top-3-most-edited files per repo (configurable) |
| D | Test infra issues reopen 5x because flaky (legitimate) | Skip if issue body or title contains `flaky` / `test` / `infra` keyword |
| E | Migration commit or hotfix bypass legitimate | Skip allowlist commit message contains `hotfix:` / `revert:` prefix |

## Tree-sitter query per framework for missing_auth (Apollo detector 3)

Per Phase B Topic 3c blind spot: "Multi-framework auth-route parsing (Express middleware vs. FastAPI dependency vs. Flask decorator vs. Rails before_action) requires per-framework query trees; no consolidated public query library exists."

Per-framework query authored by Nemesis Cycle 2-3 covering:

1. **Express.js** (JavaScript / TypeScript): query for `app.get(...)` / `app.post(...)` / `router.get(...)` / `router.post(...)` call expressions, inspect callback arguments for auth middleware (e.g., `authMiddleware` / `passport.authenticate` / `requireAuth`); absence = flag.
2. **FastAPI** (Python): query for `@router.get` / `@router.post` / `@app.get` / `@app.post` decorated function, inspect parameter list for `Depends(get_current_user)` / `Depends(auth)` / `Depends(require_*)`; absence = flag.
3. **Flask** (Python): query for `@app.route` / `@blueprint.route` decorated function, check sibling decorator presence (`@login_required` / `@requires_auth` / `@jwt_required`); absence = flag.
4. **Django** (Python): query for view function `def *_view(request, ...)` and class-based view `class *View(...)`, check decorator `@login_required` or class mixin `LoginRequiredMixin`; absence = flag.
5. **Gin** (Go): query for `r.GET(...)` / `r.POST(...)` / `r.Group(...).Use(...)` call expressions, check middleware chain `.Use(AuthMiddleware)`; absence in route group or per-route = flag.
6. **Echo** (Go): query for `e.GET(...)` / `e.POST(...)` / `e.Group("/api", AuthMiddleware)` patterns; absence = flag.
7. **Spring** (Java / Kotlin): query for `@GetMapping` / `@PostMapping` / `@RequestMapping` annotation, check sibling `@PreAuthorize` / `@Secured` or class-level `@RestController` config; absence = flag.
8. **Actix-web** (Rust): query for `.service(web::resource(...).route(web::get().to(handler)))` patterns, check `.guard(...)` or wrapped middleware presence; absence = flag.

Unknown framework fallback: if `imports` list does not match any known framework signature, detector returns empty list with `info` severity drift event labeled "missing_auth_framework_unknown" rather than silent pass (Lock 5 honest claim).

## OSV API consumption (outdated_deps detector)

Per anti-pattern Lock 8: OSV API free no auth (`https://api.osv.dev`), JANGAN paid CVE source. Cycle 2 implement:

1. Parse manifest files (package.json npm, requirements.txt PyPI, go.mod Go, Cargo.toml crates.io, pom.xml Maven, Gemfile rubygems, composer.json packagist).
2. Per package, async POST `https://api.osv.dev/v1/query` with body `{"package": {"name": ..., "ecosystem": ...}, "version": ...}` (rate limit 1000 RPM well within scan needs).
3. Cache responses in-memory per scan run; if rate limit hit (429), back off exponentially 2s 4s 8s 3 retries then emit `info` severity finding labeled "osv_rate_limit_skipped".
4. Severity per OSV `severity` field: `CRITICAL` -> `critical`, `HIGH` -> `high`, `MODERATE` / `MEDIUM` -> `medium`, `LOW` -> `low`, `UNKNOWN` -> `info`.

## Cycle 1 stub plan vs Cycle 2-5 full plan

**Cycle 1 stub (this cycle)**:
- Author all 11 detector signatures in their files with `[MOCK: cycle-1 stub returning canned 1-2 findings per detector for smoke test scaffold]` label per Lock 5.
- Author `types.py` Pydantic schemas matching Pythia contract verbatim.
- Author `dispatcher.py` orchestrator running all 11 detectors + Demeter persist + WebSocket push.
- Stub Hades parser + Triton client adapters that return canned data, labeled `[STUB: wait for Hades + Triton cycle 1 stub ship]`.
- Smoke test verifies dispatcher imports + executes without error, returns expected mock structure.

**Cycle 2 full (next cycle)**: Apollo detector 1-3 (secrets gitleaks subprocess, outdated_deps OSV API real, missing_auth tree-sitter queries Express + FastAPI + Flask + Django).

**Cycle 3 full**: Apollo detector 4-5 (unsafe_sql regex + tree-sitter, complex_untested radon).

**Cycle 4 full**: spec-drift A-B-C (stale_closed Demeter query + regex, closed_without_merge linked PR check, spec_impl_lag positive gap).

**Cycle 5 full**: spec-drift D-E (reopened_cycle event count, openspec_drift git log + commit message check) + smoke test 5/5 Apollo + 5/5 drift verify + WebSocket push verify.

## Lock 4 compliance

5 pattern A-E LOCKED per PRD Section 11.3. JANGAN add Pattern F or modify A-E definition. Detection algo above = inferred implementation of those 5 patterns, BUKAN spec change.

## Lock 5 compliance

Cycle 1 stub clearly labeled `[MOCK: cycle-1 stub]` / `[STUB: wait Hades + Triton]`. Cycle 2-5 full impl removes labels by replacement with real impl.

## Lock 8 compliance

OSV API free no auth only. No paid Snyk / Mend / GitHub Advanced Security paid CVE source.

## Open questions resolved by this doc

- **OQ inferred**: how to handle Pattern E if git history unavailable -> fallback `info` severity event labeled (Lock 5).
- **OQ inferred**: 7 vs 8 framework coverage for missing_auth -> 8 framework (Express + FastAPI + Flask + Django + Gin + Echo + Spring + Actix); unknown framework fallback emits `info` event (Lock 5).
- **OQ inferred**: Pattern C configurable threshold default -> 3 months, env override `NEMESIS_DRIFT_C_LAG_MONTHS`.
- **OQ inferred**: tree-sitter query per missing_auth detector -> per-framework `.scm` query file in `backend/app/services/detectors/queries/missing_auth_<framework>.scm`.

## Decision lock

Lock V_n: this doc locked Cycle 1 stub ship. Subsequent cycles may add evidence enrichment per pattern (e.g., Pattern E AST-diff symbol absence supplement), but the 5 pattern A-E algorithmic primary trigger conditions above are LOCKED for the duration of Wave 3.
