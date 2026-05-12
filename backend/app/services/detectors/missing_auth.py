"""Apollo detector 3: missing auth on protected routes via per-framework analysis.

Cycle 2: real per-framework analysis covering 8 frameworks via per-file source
scan + heuristic auth-token search around route declarations:
- Express.js (JavaScript / TypeScript): `app.get|post|put|delete|patch` +
  `router.*` route decl, look for `passport`, `requireAuth`, `authenticate`,
  `isAuthenticated`, `verifyToken`, `requireRole`, `authMiddleware`,
  `ensureAuth*`, `jwt*` middleware tokens in route call expression.
- FastAPI (Python): `@app.<verb>` / `@router.<verb>` decorated function, check
  parameter list for `Depends(get_current_user)` / `Depends(auth)` /
  `Depends(require_*)` / `Depends(verify_*)` / Security().
- Flask (Python): `@app.route` / `@blueprint.route` decorated function, check
  sibling decorator `@login_required` / `@requires_auth` / `@jwt_required` /
  `@token_required` / `@auth_required`.
- Django (Python): `def *_view` function or `class *View(...)` class-based view;
  check decorator `@login_required` or class mixin `LoginRequiredMixin` /
  `PermissionRequiredMixin`.
- Gin (Go): `r.GET|POST|PUT|DELETE` call; check `.Use(auth*)` middleware chain
  or route group middleware.
- Echo (Go): `e.GET|POST|...` call; check `.Use(auth*)` or middleware arg.
- Spring (Java / Kotlin): `@GetMapping` / `@PostMapping` / `@RequestMapping`
  annotation; check sibling `@PreAuthorize` / `@Secured` / `@RolesAllowed` or
  class-level security config.
- Actix-web (Rust): `.service(web::resource(...).route(...))` patterns; check
  `.guard(...)` or `.wrap(auth*)` middleware presence.

Unknown framework fallback: emit `info` severity finding labeled
`missing_auth_framework_unknown` per Lock 5 honest claim, never silent pass.

Per _meta/decisions/nemesis_drift_algo.md missing_auth framework matrix +
Phase B Topic 3c blind spot.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path

from app.parsers.types import ParsedFile, ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

log = logging.getLogger("nemesis.missing_auth")

DETECTOR_ID: ApolloDetectorId = "missing_auth"
CATEGORY: FindingCategory = "missing-auth"


# Auth token vocabulary used across frameworks.
_AUTH_TOKENS_JS = (
    "passport",
    "requireAuth",
    "authenticate",
    "isAuthenticated",
    "verifyToken",
    "requireRole",
    "authMiddleware",
    "ensureAuth",
    "ensureAuthenticated",
    "jwt",
    "checkAuth",
    "requireLogin",
)
_AUTH_TOKENS_FASTAPI = (
    "Depends(get_current_user",
    "Depends(get_current_active_user",
    "Depends(auth",
    "Depends(require_",
    "Depends(verify_",
    "Depends(authorize",
    "Security(",
)
_AUTH_TOKENS_FLASK = (
    "@login_required",
    "@requires_auth",
    "@jwt_required",
    "@token_required",
    "@auth_required",
    "@require_oauth",
)
_AUTH_TOKENS_DJANGO = (
    "@login_required",
    "@permission_required",
    "LoginRequiredMixin",
    "PermissionRequiredMixin",
    "UserPassesTestMixin",
    "AccessMixin",
)
_AUTH_TOKENS_GO_GIN = (
    "Use(auth",
    "Use(Auth",
    "AuthRequired",
    "RequireAuth",
    "authMiddleware",
    "JWTAuth",
)
_AUTH_TOKENS_GO_ECHO = (
    "Use(auth",
    "Use(middleware.JWT",
    "JWTWithConfig",
    "middleware.BasicAuth",
    "authMiddleware",
)
_AUTH_TOKENS_SPRING = (
    "@PreAuthorize",
    "@Secured",
    "@RolesAllowed",
    "@EnableWebSecurity",
)
_AUTH_TOKENS_ACTIX = (
    ".guard(",
    ".wrap(auth",
    ".wrap(Authentication",
    "HttpAuthentication",
    "BearerAuth",
)


@dataclass
class FrameworkMatch:
    """Detector match: a route declaration that lacks auth nearby."""

    framework: str
    route_path: str
    file_path: str
    line_start: int
    line_end: int
    code_snippet: str
    severity: str = "critical"
    rationale: str = field(default="")


_FRAMEWORK_FROM_IMPORTS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("express",), "express"),
    (("@nestjs/common", "@nestjs/core"), "express"),  # nest sits on top of express
    (("fastapi",), "fastapi"),
    (("flask",), "flask"),
    (("django",), "django"),
    (("github.com/gin-gonic/gin",), "gin"),
    (("github.com/labstack/echo",), "echo"),
    (("org.springframework.web", "org.springframework.boot"), "spring"),
    (("actix_web", "actix-web"), "actix"),
)


_EXPRESS_ROUTE = re.compile(
    r"""(?P<obj>(?:app|router|api)|[A-Za-z_][A-Za-z0-9_]*Router)\.(?P<verb>get|post|put|delete|patch)\s*\(\s*['"`](?P<path>[^'"`]+)['"`]"""
)

_FASTAPI_ROUTE = re.compile(
    r"""@(?P<obj>app|router|[A-Za-z_][A-Za-z0-9_]*)\.(?P<verb>get|post|put|delete|patch)\s*\(\s*['"](?P<path>[^'"]+)['"]"""
)

_FLASK_ROUTE = re.compile(
    r"""@(?P<obj>app|[A-Za-z_][A-Za-z0-9_]*)\.route\s*\(\s*['"](?P<path>[^'"]+)['"]"""
)

_DJANGO_PATH = re.compile(
    r"""\bpath\s*\(\s*['"](?P<path>[^'"]+)['"]\s*,\s*(?P<view>[A-Za-z_][A-Za-z0-9_.]*)"""
)

_GO_GIN_ROUTE = re.compile(
    r"""(?P<obj>[A-Za-z_][A-Za-z0-9_]*)\.(?P<verb>GET|POST|PUT|DELETE|PATCH)\s*\(\s*"(?P<path>[^"]+)\""""
)

_GO_ECHO_ROUTE = _GO_GIN_ROUTE  # same surface, different middleware names

_SPRING_MAPPING = re.compile(
    r"""@(?:Get|Post|Put|Delete|Patch|Request)Mapping\s*(?:\(\s*(?:value\s*=\s*)?"(?P<path>[^"]*)")?"""
)

_ACTIX_ROUTE = re.compile(
    r"""web::resource\s*\(\s*"(?P<path>[^"]+)"\s*\)\s*\.route\s*\(\s*web::(?P<verb>get|post|put|delete|patch)"""
)


# Public route paths that should NOT trigger (login, health, public docs).
_PUBLIC_PATH_PATTERNS = (
    re.compile(r"^/?$"),
    re.compile(r"^/?(?:health(?:z|check)?|status|ping|metrics|version|info)/?$", re.IGNORECASE),
    re.compile(r"^/?(?:login|register|signup|signin|sign-in|sign-up|logout|forgot|reset)\b", re.IGNORECASE),
    re.compile(r"^/?(?:public|docs?|swagger|openapi|favicon|robots\.txt)\b", re.IGNORECASE),
    re.compile(r"^/?api/(?:auth|oauth|webhook(?:s)?|public)\b", re.IGNORECASE),
    re.compile(r"^/?webhooks?/", re.IGNORECASE),
)


def _is_public_route(path: str) -> bool:
    p = path.strip()
    return any(pat.search(p) for pat in _PUBLIC_PATH_PATTERNS)


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """Detect routes lacking auth across 8 frameworks."""
    if not isinstance(repo_root, Path) or not repo_root.exists() or not repo_root.is_dir():
        return [_stub_finding(repo_full_name)]

    findings: list[ApolloFinding] = []
    framework_seen: set[str] = set()

    for parsed_file in parsed_repo.files:
        full_path = repo_root / parsed_file.file_path
        if not full_path.is_absolute():
            full_path = (repo_root / parsed_file.file_path).resolve()
        if not full_path.exists() or not full_path.is_file():
            continue
        try:
            text = full_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        framework = _detect_framework(parsed_file, text)
        if framework is None:
            continue
        framework_seen.add(framework)
        file_findings = _scan_text_for_framework(
            text=text,
            file_rel_path=parsed_file.file_path,
            framework=framework,
            repo_full_name=repo_full_name,
        )
        findings.extend(file_findings)

    if not parsed_repo.files:
        # Real parser returned no files; emit unknown-framework info finding
        findings.append(_unknown_framework_finding(repo_full_name))

    if not findings and not framework_seen:
        findings.append(_unknown_framework_finding(repo_full_name))

    return _dedup(findings)


_REQUIRE_RE = re.compile(r"""require\s*\(\s*['"]([^'"]+)['"]\s*\)""")
_IMPORT_RE = re.compile(r"""(?:^|\n)\s*import\s+(?:[\s\S]+?\s+from\s+)?['"]([^'"]+)['"]""")
_JAVA_PYTHON_IMPORT_RE = re.compile(r"""(?m)^\s*(?:from\s+([\w.]+)|import\s+([\w.]+))""")
_GO_IMPORT_BLOCK_RE = re.compile(r"""import\s*\(\s*([^)]*?)\s*\)""", re.DOTALL)
_GO_SINGLE_IMPORT_RE = re.compile(r"""import\s+"([^"]+)\"""")
_RUST_USE_RE = re.compile(r"""(?m)^\s*use\s+([A-Za-z0-9_:]+)""")


def _extract_module_tokens(text: str) -> set[str]:
    out: set[str] = set()
    for m in _REQUIRE_RE.finditer(text):
        out.add(m.group(1))
    for m in _IMPORT_RE.finditer(text):
        out.add(m.group(1))
    for m in _JAVA_PYTHON_IMPORT_RE.finditer(text):
        token = m.group(1) or m.group(2)
        if token:
            out.add(token)
    for block in _GO_IMPORT_BLOCK_RE.finditer(text):
        for line in block.group(1).splitlines():
            line = line.strip().strip(",")
            if line.startswith('"') and line.endswith('"'):
                out.add(line.strip('"'))
    for m in _GO_SINGLE_IMPORT_RE.finditer(text):
        out.add(m.group(1))
    for m in _RUST_USE_RE.finditer(text):
        out.add(m.group(1))
    return out


def _detect_framework(parsed_file: ParsedFile, text: str | None = None) -> str | None:
    # Use parsed_repo.imports first (cheap), then source scan fallback.
    candidates = list(parsed_file.imports or [])
    if text is not None:
        candidates.extend(_extract_module_tokens(text))
    if not candidates:
        return None
    imports_text = " ".join(candidates)
    for tokens, framework in _FRAMEWORK_FROM_IMPORTS:
        for token in tokens:
            if token in imports_text:
                return framework
    return None


def _scan_text_for_framework(
    text: str,
    file_rel_path: str,
    framework: str,
    repo_full_name: str,
) -> list[ApolloFinding]:
    lines = text.splitlines()
    matches = _find_route_matches(text, lines, framework)
    out: list[ApolloFinding] = []
    for match in matches:
        if _is_public_route(match.route_path):
            continue
        if _has_auth_nearby(lines, match, framework):
            continue
        out.append(_match_to_finding(match, file_rel_path, repo_full_name))
    return out


def _find_route_matches(text: str, lines: list[str], framework: str) -> list[FrameworkMatch]:
    out: list[FrameworkMatch] = []
    if framework == "express":
        for m in _EXPRESS_ROUTE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=line_no,
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "fastapi":
        for m in _FASTAPI_ROUTE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=min(line_no + 5, len(lines)),
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "flask":
        for m in _FLASK_ROUTE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=min(line_no + 5, len(lines)),
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "django":
        for m in _DJANGO_PATH.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=line_no,
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "gin":
        for m in _GO_GIN_ROUTE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=line_no,
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "echo":
        for m in _GO_ECHO_ROUTE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=line_no,
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "spring":
        for m in _SPRING_MAPPING.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            route_path = m.group("path") or ""
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=route_path,
                    file_path="",
                    line_start=line_no,
                    line_end=min(line_no + 5, len(lines)),
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    elif framework == "actix":
        for m in _ACTIX_ROUTE.finditer(text):
            line_no = text[: m.start()].count("\n") + 1
            out.append(
                FrameworkMatch(
                    framework=framework,
                    route_path=m.group("path"),
                    file_path="",
                    line_start=line_no,
                    line_end=line_no,
                    code_snippet=_safe_line(lines, line_no),
                )
            )
    return out


def _has_auth_nearby(lines: list[str], match: FrameworkMatch, framework: str) -> bool:
    """Look for auth token in the route call expression + neighbor decorator block."""
    tokens = _auth_tokens_for_framework(framework)
    if not tokens:
        return False
    span_start = max(1, match.line_start - 6)
    span_end = min(len(lines), match.line_end + 8)
    window = "\n".join(lines[span_start - 1 : span_end])
    for token in tokens:
        if token in window:
            return True
    return False


def _auth_tokens_for_framework(framework: str) -> tuple[str, ...]:
    return {
        "express": _AUTH_TOKENS_JS,
        "fastapi": _AUTH_TOKENS_FASTAPI,
        "flask": _AUTH_TOKENS_FLASK,
        "django": _AUTH_TOKENS_DJANGO,
        "gin": _AUTH_TOKENS_GO_GIN,
        "echo": _AUTH_TOKENS_GO_ECHO,
        "spring": _AUTH_TOKENS_SPRING,
        "actix": _AUTH_TOKENS_ACTIX,
    }.get(framework, ())


def _safe_line(lines: list[str], line_no: int) -> str:
    idx = max(0, line_no - 1)
    if idx >= len(lines):
        return ""
    return lines[idx].strip()[:240]


def _match_to_finding(
    match: FrameworkMatch,
    file_path: str,
    repo_full_name: str,
) -> ApolloFinding:
    rel_token = _safe_token(file_path) + f"-L{match.line_start}-{_safe_token(match.route_path)}"
    return ApolloFinding(
        id=f"missing_auth-{match.framework}-{rel_token}",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="critical",
        title=f"Missing authentication on {match.framework} route {match.route_path}",
        description=(
            f"Route '{match.route_path}' declared via {match.framework} at "
            f"{file_path}:{match.line_start} lacks an authentication middleware / "
            f"decorator / dependency in the surrounding window. Verify auth applied."
        ),
        file_path=file_path,
        line_start=match.line_start,
        line_end=match.line_end,
        code_snippet=match.code_snippet,
        suggested_fix=_suggested_fix(match.framework),
        repo_full_name=repo_full_name,
        building_id=file_path,
    )


def _suggested_fix(framework: str) -> str:
    return {
        "express": "Add passport.authenticate('jwt', { session: false }) middleware before the handler.",
        "fastapi": "Add `current_user: User = Depends(get_current_user)` parameter to the route function.",
        "flask": "Add @login_required (Flask-Login) or @jwt_required (Flask-JWT-Extended) decorator above the handler.",
        "django": "Add @login_required decorator (function view) or LoginRequiredMixin (class view).",
        "gin": "Apply AuthMiddleware via router.Use(AuthMiddleware()) on the route group.",
        "echo": "Apply JWT middleware via e.Use(middleware.JWTWithConfig(...)) or per-group middleware.",
        "spring": "Add @PreAuthorize(\"isAuthenticated()\") or @Secured(\"ROLE_USER\") annotation.",
        "actix": "Wrap route with auth middleware via .wrap(HttpAuthentication::bearer(validator)).",
    }.get(framework, "Add the framework's standard authentication enforcement to this route.")


def _dedup(findings: list[ApolloFinding]) -> list[ApolloFinding]:
    seen: set[str] = set()
    out: list[ApolloFinding] = []
    for f in findings:
        if f.id in seen:
            continue
        seen.add(f.id)
        out.append(f)
    return out


def _safe_token(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._\-]+", "-", value)
    return cleaned[:64]


def _stub_finding(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"missing_auth-stub-{_safe_token(repo_full_name)}-1",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="critical",
        title="Missing authentication on /admin route",
        description=(
            "[STUB cycle-1] Express route /admin at app/routes/index.js:87 lacks "
            "passport.authenticate middleware. Real impl scans real repo when "
            "fixture available."
        ),
        file_path="app/routes/index.js",
        line_start=87,
        line_end=110,
        code_snippet="app.get('/admin', (req, res) => { /* no auth middleware */ });",
        suggested_fix="Add passport.authenticate('jwt', { session: false }) middleware.",
        repo_full_name=repo_full_name,
        building_id="app/routes/index.js",
    )


def _unknown_framework_finding(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"missing_auth-framework_unknown-{_safe_token(repo_full_name)}",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="info",
        title="missing_auth_framework_unknown",
        description=(
            "No supported web framework imports detected (express / fastapi / "
            "flask / django / gin / echo / spring / actix). Skipping missing-auth "
            "scan. Add framework support if a new framework needs coverage."
        ),
        file_path=".",
        line_start=1,
        line_end=1,
        suggested_fix=(
            "If the repo uses a supported framework, ensure the manifest declares "
            "it. Otherwise, file an issue to extend Nemesis framework matrix."
        ),
        repo_full_name=repo_full_name,
        building_id=".",
    )
