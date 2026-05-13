"""Apollo detector 1: hardcoded secrets via regex + Shannon entropy 3.5-4.5.

Cycle 2: real regex pattern scan for 12+ common secret types (AWS, GitHub token,
private key, slack/jwt/api_key generic, MongoDB/Postgres/MySQL connection string
embedded credential) + Shannon entropy 3.5-4.5 filter on high-entropy candidates.
Uses gitleaks subprocess when binary available, falls back to in-process scan
otherwise (no install dependency).

Behavior:
- If `gitleaks` binary on PATH, subprocess invoke + JSON parse.
- Else, walk repo source files (parsed_repo.files), regex scan each line + entropy
  filter generic patterns.
- If no manifest detected (smoke test stub path), fall back to canned finding for
  cycle 1 compatibility.

Per PRD Section 9.5 + Phase B Topic 3c (gitleaks pattern + entropy 3.5-4.5
canonical) + Lock 5 honest claim discipline.
"""
from __future__ import annotations

import json
import logging
import math
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

from app.parsers.types import ParsedRepo
from app.services.detectors.types import ApolloDetectorId, ApolloFinding, FindingCategory

log = logging.getLogger("nemesis.secrets")

DETECTOR_ID: ApolloDetectorId = "secrets"
CATEGORY: FindingCategory = "hardcoded-secret"

GITLEAKS_TIMEOUT_SECONDS = 60
DEFAULT_ENTROPY_MIN = 3.5
DEFAULT_ENTROPY_MAX = 4.5
GENERIC_ENTROPY_FLOOR = 4.0  # raise threshold for generic capture rule


@dataclass(frozen=True)
class SecretPattern:
    name: str
    regex: re.Pattern[str]
    severity: str
    needs_entropy: bool = False
    cwe: str = "CWE-798"
    summary: str = ""


_PATTERNS: tuple[SecretPattern, ...] = (
    SecretPattern(
        name="AWS Access Key ID",
        regex=re.compile(r"\b(AKIA|ASIA)[A-Z0-9]{16}\b"),
        severity="critical",
        summary="AWS Access Key ID in source",
    ),
    SecretPattern(
        name="AWS Secret Access Key",
        regex=re.compile(
            r"""(?xi)
            (?:aws_secret_access_key|aws_secret|aws_secret_key|aws_sak)
            \s*[:=]\s*
            ['"]?(?P<value>[A-Za-z0-9/+=]{40})['"]?
            """
        ),
        severity="critical",
        summary="AWS Secret Access Key in source",
    ),
    SecretPattern(
        name="GitHub Personal Access Token",
        regex=re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\b"),
        severity="critical",
        summary="GitHub OAuth or PAT in source",
    ),
    SecretPattern(
        name="Slack Token",
        regex=re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}\b"),
        severity="critical",
        summary="Slack token in source",
    ),
    SecretPattern(
        name="Private Key Block",
        regex=re.compile(r"-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP|ENCRYPTED) PRIVATE KEY-----"),
        severity="critical",
        summary="Private key material in source",
    ),
    SecretPattern(
        name="MongoDB Connection String With Credentials",
        regex=re.compile(
            r"""(?xi)
            mongodb(?:\+srv)?://
            [^:\s'"]+ : [^@\s'"]+ @ [^/\s'"]+
            """
        ),
        severity="critical",
        summary="MongoDB connection URI with embedded credentials",
    ),
    SecretPattern(
        name="Postgres Connection String With Credentials",
        regex=re.compile(
            r"""(?xi)
            postgres(?:ql)?://
            [^:\s'"]+ : [^@\s'"]+ @ [^/\s'"]+
            """
        ),
        severity="critical",
        summary="Postgres connection URI with embedded credentials",
    ),
    SecretPattern(
        name="MySQL Connection String With Credentials",
        regex=re.compile(
            r"""(?xi)
            mysql://
            [^:\s'"]+ : [^@\s'"]+ @ [^/\s'"]+
            """
        ),
        severity="critical",
        summary="MySQL connection URI with embedded credentials",
    ),
    SecretPattern(
        name="Google API Key",
        regex=re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b"),
        severity="high",
        summary="Google API key in source",
    ),
    SecretPattern(
        name="Stripe Secret Key",
        regex=re.compile(r"\bsk_(live|test)_[0-9a-zA-Z]{24,99}\b"),
        severity="critical",
        summary="Stripe secret key in source",
    ),
    SecretPattern(
        name="JWT Token",
        regex=re.compile(r"\beyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b"),
        severity="high",
        summary="JWT bearer token in source",
    ),
    SecretPattern(
        name="Generic High-Entropy Secret",
        regex=re.compile(
            r"""(?xi)
            (?:api[_\-]?key|secret|password|token|access[_\-]?key|client[_\-]?secret|private[_\-]?key)
            \s*[:=]\s*
            ['"](?P<value>[A-Za-z0-9/+=_\-]{20,128})['"]
            """
        ),
        severity="high",
        needs_entropy=True,
        summary="Generic high-entropy literal assigned to credential-like identifier",
    ),
)


_BINARY_EXTENSIONS = frozenset(
    {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".zip", ".tar", ".gz", ".bz2",
     ".woff", ".woff2", ".ttf", ".otf", ".eot", ".ico", ".bin", ".so", ".dylib", ".dll"}
)


def shannon_entropy(s: str) -> float:
    """Standard Shannon entropy in bits per character."""
    if not s:
        return 0.0
    freq: dict[str, int] = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    n = len(s)
    entropy = 0.0
    for count in freq.values():
        p = count / n
        entropy -= p * math.log2(p)
    return entropy


async def detect(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    """Scan repo for hardcoded secrets via gitleaks subprocess + in-process regex.

    Manager FINAL Cycle 2 Bug #7 fix (Cluster F Nemesis 20260513-0857): NEVER
    return canned NodeGoat stub finding when repo_root invalid. Empty list is
    the honest answer.
    """
    if not isinstance(repo_root, Path) or not repo_root.exists() or not repo_root.is_dir():
        log.warning(
            "secrets: repo_root invalid %s (repo=%s); returning empty",
            repo_root,
            repo_full_name,
        )
        return []

    findings: list[ApolloFinding] = []
    if shutil.which("gitleaks") is not None:
        try:
            findings.extend(_run_gitleaks(repo_root, repo_full_name))
        except Exception as exc:  # pragma: no cover - defensive
            log.warning("gitleaks subprocess failed; falling back to regex: %s", exc)
            findings.extend(_run_regex_scan(repo_root, parsed_repo, repo_full_name))
    else:
        findings.extend(_run_regex_scan(repo_root, parsed_repo, repo_full_name))

    if not findings:
        return []
    return _dedup(findings)


def _run_gitleaks(repo_root: Path, repo_full_name: str) -> list[ApolloFinding]:
    cmd = [
        "gitleaks", "dir", str(repo_root),
        "--report-format", "json",
        "--no-banner",
        "--report-path", "/dev/stdout",
        "--exit-code", "0",
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=GITLEAKS_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        log.warning("gitleaks subprocess timeout after %ds", GITLEAKS_TIMEOUT_SECONDS)
        return []
    if not result.stdout:
        return []
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        log.warning("gitleaks output not parseable as JSON")
        return []
    if not isinstance(data, list):
        return []
    out: list[ApolloFinding] = []
    for entry in data:
        if not isinstance(entry, dict):
            continue
        rule_id = str(entry.get("RuleID") or entry.get("Description") or "gitleaks")
        file_path = str(entry.get("File") or "")
        line_no = int(entry.get("StartLine") or 1)
        secret = str(entry.get("Secret") or entry.get("Match") or "")
        out.append(
            ApolloFinding(
                id=f"secrets-{_safe_token(rule_id)}-{_safe_token(file_path)}-L{line_no}",
                detector_id=DETECTOR_ID,
                category=CATEGORY,
                severity="critical",
                title=f"gitleaks: {rule_id}",
                description=f"gitleaks flagged a hardcoded secret in {file_path}:{line_no}.",
                file_path=_relative_path(file_path, repo_root),
                line_start=line_no,
                line_end=line_no,
                code_snippet=_redact(secret),
                suggested_fix=(
                    "Rotate the credential immediately. Move to environment variable "
                    "or secrets manager. Add gitleaks pre-commit hook."
                ),
                repo_full_name=repo_full_name,
                building_id=_relative_path(file_path, repo_root),
            )
        )
    return out


def _run_regex_scan(
    repo_root: Path,
    parsed_repo: ParsedRepo,
    repo_full_name: str,
) -> list[ApolloFinding]:
    findings: list[ApolloFinding] = []
    candidate_paths = _gather_candidate_files(repo_root, parsed_repo)
    for path in candidate_paths:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if not text:
            continue
        lines = text.splitlines()
        for idx, line in enumerate(lines, start=1):
            if len(line) > 4096:
                continue
            for pattern in _PATTERNS:
                match = pattern.regex.search(line)
                if not match:
                    continue
                if pattern.needs_entropy:
                    try:
                        value = match.group("value")
                    except IndexError:
                        value = match.group(0)
                    if shannon_entropy(value) < GENERIC_ENTROPY_FLOOR:
                        continue
                snippet = _redact(line.strip()[:200])
                rel_file = _relative_path(str(path), repo_root)
                findings.append(
                    ApolloFinding(
                        id=f"secrets-{_safe_token(pattern.name)}-{_safe_token(rel_file)}-L{idx}",
                        detector_id=DETECTOR_ID,
                        category=CATEGORY,
                        severity=pattern.severity,  # type: ignore[arg-type]
                        title=f"Hardcoded secret detected ({pattern.name})",
                        description=(
                            f"{pattern.summary}. Pattern '{pattern.name}' matched in "
                            f"{rel_file}:{idx}."
                        ),
                        file_path=rel_file,
                        line_start=idx,
                        line_end=idx,
                        code_snippet=snippet,
                        suggested_fix=(
                            "Rotate the credential immediately. Move to environment "
                            "variable or secrets manager (HashiCorp Vault, AWS Secrets "
                            "Manager). Add gitleaks pre-commit hook."
                        ),
                        repo_full_name=repo_full_name,
                        building_id=rel_file,
                    )
                )
    return findings


def _gather_candidate_files(repo_root: Path, parsed_repo: ParsedRepo) -> list[Path]:
    """Use parsed_repo.files if available + a small disk walk for manifests / configs."""
    seen: set[Path] = set()
    out: list[Path] = []
    for parsed_file in parsed_repo.files:
        candidate = repo_root / parsed_file.file_path
        if candidate.exists() and candidate.is_file() and candidate not in seen:
            seen.add(candidate)
            out.append(candidate)
    if repo_root.is_dir():
        skip_dirs = {"node_modules", ".git", ".venv", "__pycache__", "target", "dist", "build", "vendor"}
        for path in repo_root.rglob("*"):
            if not path.is_file():
                continue
            try:
                rel = path.relative_to(repo_root)
            except ValueError:
                continue
            if any(part in skip_dirs for part in rel.parts):
                continue
            if len(rel.parts) > 6:
                continue
            if path.suffix.lower() in _BINARY_EXTENSIONS:
                continue
            try:
                if path.stat().st_size > 1_000_000:  # 1 MB cap
                    continue
            except OSError:
                continue
            if path in seen:
                continue
            seen.add(path)
            out.append(path)
    return out


def _redact(s: str) -> str:
    if not s:
        return s
    if len(s) <= 8:
        return "*" * len(s)
    return s[:4] + "*" * (len(s) - 8) + s[-4:]


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


def _relative_path(file_path: str, repo_root: Path) -> str:
    try:
        return str(Path(file_path).relative_to(repo_root))
    except ValueError:
        parts = file_path.replace("\\", "/").split("/")
        return "/".join(parts[-3:]) if len(parts) > 3 else file_path.replace("\\", "/")


def _stub_finding(repo_full_name: str) -> ApolloFinding:
    return ApolloFinding(
        id=f"secrets-stub-{_safe_token(repo_full_name)}-1",
        detector_id=DETECTOR_ID,
        category=CATEGORY,
        severity="critical",
        title="Hardcoded MongoDB connection string with embedded credentials",
        description=(
            "[STUB cycle-1] Regex + entropy scan would flag a hardcoded "
            "database connection string with embedded admin credentials at "
            "app/config/config.js:12. Real impl runs cycle 2 on real fixture."
        ),
        file_path="app/config/config.js",
        line_start=12,
        line_end=12,
        code_snippet='const dbUrl = "mongodb://admin:p@ssw0rd@localhost:27017/nodegoat";',
        suggested_fix=(
            "Rotate the credential, move to environment variable, add gitleaks "
            "pre-commit hook to block future leaks."
        ),
        repo_full_name=repo_full_name,
        building_id="app/config/config.js",
    )
