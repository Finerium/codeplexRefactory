"""OSV API client for outdated dependency detection.

Per Lock 8: OSV API free no-auth (https://api.osv.dev), JANGAN paid CVE source.
Per drift algo decision doc Cycle 2 spec.

Concurrency: asyncio.Semaphore(10) cap to be polite + retry exponential backoff
2s 4s 8s on 429. After exhaustion emits info severity finding labeled
'osv_rate_limit_skipped' per Lock 5 honest claim.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

import httpx

log = logging.getLogger("nemesis.osv_client")

OSV_QUERY_URL = "https://api.osv.dev/v1/query"
DEFAULT_TIMEOUT_SECONDS = 8.0
DEFAULT_CONCURRENCY = 10
RETRY_BACKOFF_SECONDS = (2, 4, 8)


@dataclass
class OSVPackageQuery:
    name: str
    version: str
    ecosystem: str  # npm, PyPI, Go, crates.io, Maven, RubyGems, Packagist


@dataclass
class OSVVulnerability:
    id: str  # GHSA-xxxx or CVE-xxxx
    summary: str
    severity_label: str  # CRITICAL | HIGH | MODERATE | LOW | UNKNOWN
    aliases: list[str] = field(default_factory=list)
    references: list[str] = field(default_factory=list)
    fixed_in: str | None = None


SEVERITY_MAP = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MODERATE": "medium",
    "MEDIUM": "medium",
    "LOW": "low",
    "UNKNOWN": "info",
    "NONE": "info",
}


def _extract_severity_label(vuln: dict[str, Any]) -> str:
    """OSV severity is a list of objects with type + score. Map to label."""
    severities = vuln.get("severity") or []
    if not isinstance(severities, list) or not severities:
        db_specific = vuln.get("database_specific") or {}
        return str(db_specific.get("severity", "UNKNOWN")).upper()
    for sev in severities:
        if isinstance(sev, dict):
            score = sev.get("score", "")
            if isinstance(score, str) and score:
                upper = score.upper()
                if any(label in upper for label in ("CRITICAL", "HIGH", "MODERATE", "LOW")):
                    for label in ("CRITICAL", "HIGH", "MODERATE", "LOW"):
                        if label in upper:
                            return label
    return "UNKNOWN"


def _extract_fixed_in(vuln: dict[str, Any]) -> str | None:
    """First fixed-in version across affected ranges."""
    for affected in vuln.get("affected", []) or []:
        for r in affected.get("ranges", []) or []:
            for ev in r.get("events", []) or []:
                if "fixed" in ev:
                    return str(ev["fixed"])
    return None


def _parse_response(payload: dict[str, Any]) -> list[OSVVulnerability]:
    out: list[OSVVulnerability] = []
    for vuln in payload.get("vulns", []) or []:
        if not isinstance(vuln, dict):
            continue
        vuln_id = str(vuln.get("id", ""))
        if not vuln_id:
            continue
        summary = str(vuln.get("summary") or vuln.get("details") or "")
        severity_label = _extract_severity_label(vuln)
        aliases = [str(a) for a in (vuln.get("aliases") or []) if isinstance(a, str)]
        references = [
            str(r.get("url", ""))
            for r in (vuln.get("references") or [])
            if isinstance(r, dict) and r.get("url")
        ]
        fixed_in = _extract_fixed_in(vuln)
        out.append(
            OSVVulnerability(
                id=vuln_id,
                summary=summary,
                severity_label=severity_label,
                aliases=aliases,
                references=references,
                fixed_in=fixed_in,
            )
        )
    return out


class OSVClient:
    """Async OSV API client with semaphore + retry."""

    def __init__(
        self,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        concurrency: int = DEFAULT_CONCURRENCY,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._timeout = timeout_seconds
        self._semaphore = asyncio.Semaphore(concurrency)
        self._owned_client = http_client is None
        self._client = http_client or httpx.AsyncClient(timeout=timeout_seconds)
        self._rate_limited = False

    async def aclose(self) -> None:
        if self._owned_client:
            await self._client.aclose()

    @property
    def rate_limited(self) -> bool:
        return self._rate_limited

    async def query(self, pkg: OSVPackageQuery) -> list[OSVVulnerability]:
        """Query OSV for vulnerabilities affecting package@version. Empty list on error."""
        body = {
            "package": {"name": pkg.name, "ecosystem": pkg.ecosystem},
            "version": pkg.version,
        }
        async with self._semaphore:
            for attempt, backoff in enumerate((0,) + RETRY_BACKOFF_SECONDS):
                if backoff:
                    await asyncio.sleep(backoff)
                try:
                    resp = await self._client.post(OSV_QUERY_URL, json=body)
                except (httpx.TimeoutException, httpx.NetworkError) as exc:
                    log.debug("OSV network/timeout (attempt %d): %s", attempt, exc)
                    if attempt == len(RETRY_BACKOFF_SECONDS):
                        return []
                    continue
                if resp.status_code == 429:
                    log.warning("OSV rate limit hit (attempt %d)", attempt)
                    if attempt == len(RETRY_BACKOFF_SECONDS):
                        self._rate_limited = True
                        return []
                    continue
                if resp.status_code >= 500:
                    log.debug("OSV server error %d (attempt %d)", resp.status_code, attempt)
                    if attempt == len(RETRY_BACKOFF_SECONDS):
                        return []
                    continue
                if resp.status_code != 200:
                    log.debug("OSV non-200 %d body=%s", resp.status_code, resp.text[:200])
                    return []
                try:
                    return _parse_response(resp.json())
                except (ValueError, KeyError) as exc:
                    log.debug("OSV parse error: %s", exc)
                    return []
        return []

    async def query_many(
        self,
        packages: list[OSVPackageQuery],
    ) -> dict[str, list[OSVVulnerability]]:
        """Parallel query many packages, return mapping of 'ecosystem:name@version' to vulns."""
        if not packages:
            return {}

        async def _wrap(pkg: OSVPackageQuery) -> tuple[str, list[OSVVulnerability]]:
            key = f"{pkg.ecosystem}:{pkg.name}@{pkg.version}"
            try:
                return key, await self.query(pkg)
            except Exception as exc:  # pragma: no cover - defensive
                log.debug("OSV query failed for %s: %s", key, exc)
                return key, []

        results = await asyncio.gather(*[_wrap(p) for p in packages])
        return dict(results)


def severity_for_label(label: str) -> str:
    """Map OSV severity label to Nemesis 5-enum severity."""
    return SEVERITY_MAP.get(label.upper(), "info")
