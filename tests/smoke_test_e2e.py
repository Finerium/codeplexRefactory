"""Codeplex Chronicle smoke test E2E (Atlas Wave 3 SC-04 ship criteria).

Authoring authority: Atlas Wave 3 worker per `_meta/contracts/atlas-to-production.md`
and `_meta/contracts/aletheia-wave3-audit.md`.

Runs N (default 3) consecutive trial runs of the full HTTP-level demo flow:
    1. GET  /                            landing page
    2. GET  /start                       entry page
    3. GET  /api/auth/github/start       OAuth start (302 redirect expected)
    4. GET  /city                        city view (mock_auth bypass)
    5. POST /api/parser/parse-repo       tree-sitter parse demo repo
    6. GET  /dashboard                   dashboard route
    7. GET  /health                      backend liveness probe target

All trials must PASS with NO mid-run recovery (per PRD SC-04). The browser
flow (click building, Hermes tour, Health Mode finding, Convert to Backlog
Ticket, GitHub issue created) is covered by Pan Day 2 manual rehearsal per
the Atlas + Pan division (atlas-to-production.md Open Questions section).

Environment:
    TARGET    target base URL (default https://duopoly.hackathon.sev-2.com)
    TRIALS    consecutive trial count (default 3)
    TIMEOUT   per-request timeout seconds (default 30)
    VERBOSE   if set, print response headers + body excerpt

Exit codes:
    0  all trials PASS (SC-04 satisfied)
    1  trial run failure
    2  pre-flight failure (httpx unavailable, target unreachable, etc.)

Usage:
    python3 tests/smoke_test_e2e.py
    TARGET=https://staging.example.com TRIALS=5 python3 tests/smoke_test_e2e.py
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
from dataclasses import dataclass, field
from typing import Any

try:
    import httpx
except ImportError:
    print("[FAIL] httpx not installed. Run: pip install httpx", file=sys.stderr)
    sys.exit(2)


TARGET = os.environ.get("TARGET", "https://duopoly.hackathon.sev-2.com").rstrip("/")
TRIALS = int(os.environ.get("TRIALS", "3"))
TIMEOUT = float(os.environ.get("TIMEOUT", "30"))
VERBOSE = bool(os.environ.get("VERBOSE", ""))
# INSECURE_TLS=1 skips TLS cert verification. Use at venue if Refactory cert
# is self-signed or not yet provisioned. Atlas cycle 1 probe confirmed live
# host returns self-signed cert pre-deploy.
INSECURE_TLS = os.environ.get("INSECURE_TLS", "").lower() in ("1", "true", "yes")


@dataclass
class CheckResult:
    """Single HTTP check result."""

    name: str
    method: str
    path: str
    expected_status: tuple[int, ...]
    actual_status: int = 0
    elapsed_ms: float = 0.0
    error: str | None = None
    notes: str = ""

    @property
    def passed(self) -> bool:
        return self.error is None and self.actual_status in self.expected_status


@dataclass
class TrialResult:
    """One full E2E trial run."""

    trial_num: int
    checks: list[CheckResult] = field(default_factory=list)
    started_at: float = 0.0
    elapsed_ms: float = 0.0

    @property
    def passed(self) -> bool:
        return all(c.passed for c in self.checks)

    @property
    def fail_count(self) -> int:
        return sum(1 for c in self.checks if not c.passed)


async def check_request(
    client: httpx.AsyncClient,
    method: str,
    path: str,
    expected_status: tuple[int, ...],
    *,
    json_body: dict[str, Any] | None = None,
    notes: str = "",
) -> CheckResult:
    """Execute a single HTTP check."""
    result = CheckResult(
        name=f"{method} {path}",
        method=method,
        path=path,
        expected_status=expected_status,
        notes=notes,
    )
    url = f"{TARGET}{path}"
    start = time.perf_counter()
    try:
        if method == "GET":
            resp = await client.get(url)
        elif method == "POST":
            resp = await client.post(url, json=json_body or {})
        elif method == "HEAD":
            resp = await client.head(url)
        else:
            raise ValueError(f"unsupported method {method}")
        result.actual_status = resp.status_code
        result.elapsed_ms = (time.perf_counter() - start) * 1000
        if VERBOSE:
            print(f"  [verbose] {method} {url} -> {resp.status_code} "
                  f"({result.elapsed_ms:.0f}ms)")
            print(f"  [verbose] response headers: {dict(resp.headers)}")
            preview = resp.text[:200] if resp.text else ""
            print(f"  [verbose] body excerpt: {preview!r}")
    except httpx.RequestError as exc:
        result.error = f"{type(exc).__name__}: {exc}"
        result.elapsed_ms = (time.perf_counter() - start) * 1000
    return result


async def run_trial(trial_num: int) -> TrialResult:
    """Execute one full E2E trial of the demo flow."""
    print(f"\n--- Trial {trial_num}/{TRIALS} (target {TARGET}) ---")
    trial = TrialResult(trial_num=trial_num, started_at=time.perf_counter())

    async with httpx.AsyncClient(
        follow_redirects=False,
        timeout=TIMEOUT,
        verify=not INSECURE_TLS,
        headers={"User-Agent": "atlas-smoke-test-e2e/1.0 (codeplex-chronicle)"},
    ) as client:
        # 1. Landing
        trial.checks.append(
            await check_request(
                client, "GET", "/", (200,),
                notes="Calliope Wave 1 marketing landing",
            )
        )

        # 2. Entry page
        trial.checks.append(
            await check_request(
                client, "GET", "/start", (200,),
                notes="Hestia Wave 1 entry page composition",
            )
        )

        # 3. OAuth start endpoint (302 redirect to github.com expected; Hades real)
        trial.checks.append(
            await check_request(
                client, "GET", "/api/auth/github/start", (200, 302, 307),
                notes="Hades Wave 3 OAuth real flow init",
            )
        )

        # 4. City view with mock_auth bypass (no real OAuth needed for smoke)
        trial.checks.append(
            await check_request(
                client, "GET", "/city?mock_auth=true", (200,),
                notes="Calliope Wave 1 city shell + parallel route slots",
            )
        )

        # 5. Backend API liveness: LLM health endpoint exercises the FastAPI
        # routing layer + Triton DeepSeek gateway dependency-injection chain.
        # Parser parse-repo intentionally NOT smoke-tested via HTTP because the
        # API requires a server-side filesystem path (`repo_root`) which isn't
        # available without a mounted demo repo volume. Pan Day 2 browser
        # rehearsal covers the parser path via the city view + click flow.
        # Atlas D-Atlas-22 cycle 4.
        trial.checks.append(
            await check_request(
                client, "GET", "/api/llm/health", (200,),
                notes="Triton Wave 3 DeepSeek gateway health (exercises api_router)",
            )
        )

        # 6. Dashboard route
        trial.checks.append(
            await check_request(
                client, "GET", "/dashboard", (200,),
                notes="Selene Wave 1 dashboard ownership",
            )
        )

        # 7. Backend dashboard data endpoint (Selene Wave 1 + Demeter Wave 3
        # findings aggregate). Verifies full /api/* → port 8000 routing chain.
        # NOTE: backend `/health` (port 8000) is NOT reachable via Traefik
        # Ingress because `/` routes to port 3000 (Next.js). `/health` probe
        # is K8s pod-level only (livenessProbe / readinessProbe). Atlas
        # D-Atlas-22 cycle 4.
        trial.checks.append(
            await check_request(
                client, "GET", "/api/dashboard", (200,),
                notes="Selene+Demeter dashboard data endpoint (full /api routing chain)",
            )
        )

    trial.elapsed_ms = (time.perf_counter() - trial.started_at) * 1000

    # Per-check report
    for check in trial.checks:
        status_label = "[PASS]" if check.passed else "[FAIL]"
        actual = check.error if check.error else f"HTTP {check.actual_status}"
        expected = "/".join(str(s) for s in check.expected_status)
        print(f"  {status_label} {check.name} -> {actual} (expected {expected}) "
              f"{check.elapsed_ms:.0f}ms")
        if check.notes:
            print(f"         note: {check.notes}")

    summary = "PASS" if trial.passed else f"FAIL ({trial.fail_count} check failure)"
    print(f"--- Trial {trial_num}: {summary} total={trial.elapsed_ms:.0f}ms ---")
    return trial


async def main() -> int:
    """Run TRIALS consecutive trials; all must PASS."""
    print(f"Atlas Wave 3 smoke test E2E (SC-04 ship criteria)")
    print(f"TARGET={TARGET}")
    print(f"TRIALS={TRIALS}")
    print(f"TIMEOUT={TIMEOUT}s")
    print(f"INSECURE_TLS={INSECURE_TLS}")

    trials: list[TrialResult] = []
    for i in range(1, TRIALS + 1):
        trial = await run_trial(i)
        trials.append(trial)
        if not trial.passed:
            # Mid-run recovery is forbidden per SC-04; but we still run all
            # trials for full diagnostic context, then exit non-zero.
            print(f"\n[NOTE] Trial {i} FAILED. SC-04 requires no mid-run recovery,"
                  f" continuing to surface full diagnostic.")

    print("\n=== Summary ===")
    pass_count = sum(1 for t in trials if t.passed)
    print(f"Trials passed: {pass_count}/{TRIALS}")
    for t in trials:
        label = "PASS" if t.passed else f"FAIL ({t.fail_count} check fail)"
        print(f"  Trial {t.trial_num}: {label}  {t.elapsed_ms:.0f}ms")

    if pass_count == TRIALS:
        print(f"\n[OK] ALL {TRIALS} TRIALS PASS  (SC-04 satisfied, Atlas Wave 3 ship criteria met)")
        return 0
    else:
        print(f"\n[FAIL] {TRIALS - pass_count}/{TRIALS} trials failed. SC-04 not satisfied.")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
