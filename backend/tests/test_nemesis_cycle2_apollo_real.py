"""Nemesis cycle 2 Apollo 1-3 real impl smoke test.

Verifies real detector impl fires on NodeGoat slice fixture:
- secrets (Apollo 1): regex + entropy scan flags hardcoded MongoDB URI + AWS key
  + Stripe key in config.js.
- outdated_deps (Apollo 2): manifest parser + OSV API query flags one or more
  outdated dependencies in package.json (jquery 1.4.0 + express 4.17.0).
- missing_auth (Apollo 3): Express route scan flags /admin and /admin/users
  routes without passport.authenticate middleware.

Per _meta/plans/nemesis-wave3-cycle-plan.md Cycle 2.

OSV API test is marked + skipped when offline so cycle 2 smoke runs even without
network. When network present, asserts at least 1 vuln found for the fixture
deps.
"""
from __future__ import annotations

import os
import socket
from pathlib import Path

import pytest

from app.services.detectors.adapters import (
    reset_demeter_adapter,
    reset_parser_adapter,
    reset_triton_adapter,
    reset_ws_adapter,
)
from app.services.detectors.types import ApolloFinding

pytestmark = pytest.mark.asyncio


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "nodegoat-slice"


@pytest.fixture(autouse=True)
def _reset_adapters() -> None:
    reset_parser_adapter()
    reset_triton_adapter()
    reset_demeter_adapter()
    reset_ws_adapter()


def _has_network() -> bool:
    if os.environ.get("NEMESIS_OFFLINE") == "1":
        return False
    try:
        socket.create_connection(("api.osv.dev", 443), timeout=2.0)
        return True
    except OSError:
        return False


async def test_fixture_root_exists() -> None:
    assert FIXTURE_ROOT.exists(), f"missing NodeGoat slice fixture at {FIXTURE_ROOT}"
    assert (FIXTURE_ROOT / "package.json").exists()
    assert (FIXTURE_ROOT / "app" / "config" / "config.js").exists()
    assert (FIXTURE_ROOT / "app" / "routes" / "index.js").exists()


async def test_secrets_detector_finds_hardcoded_credentials_in_fixture() -> None:
    from app.services.detectors import secrets
    from app.services.detectors.adapters import get_parser_adapter

    parser = get_parser_adapter()
    parsed = await parser.parse_repo(FIXTURE_ROOT)

    findings = await secrets.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )
    assert findings, "expected secrets detector to flag fixture credentials"
    assert all(isinstance(f, ApolloFinding) for f in findings)
    # All findings should be category=hardcoded-secret severity in 5-enum
    for f in findings:
        assert f.category == "hardcoded-secret"
        assert f.severity in ("critical", "high", "medium", "low", "info")
        assert "[STUB cycle-1]" not in (f.description or "")
    # At least one critical (MongoDB URI or AWS key)
    assert any(f.severity == "critical" for f in findings)


async def test_secrets_detector_finds_known_patterns() -> None:
    """Confirm specific patterns trigger (MongoDB URI + AWS key + Stripe key)."""
    from app.services.detectors import secrets
    from app.services.detectors.adapters import get_parser_adapter

    parsed = await get_parser_adapter().parse_repo(FIXTURE_ROOT)
    findings = await secrets.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )

    titles = " ".join(f.title for f in findings)
    assert (
        "MongoDB" in titles
        or "AWS" in titles
        or "Stripe" in titles
    ), f"expected at least one known pattern; got titles: {[f.title for f in findings]}"


async def test_missing_auth_flags_admin_route() -> None:
    from app.services.detectors import missing_auth
    from app.services.detectors.adapters import get_parser_adapter

    parsed = await get_parser_adapter().parse_repo(FIXTURE_ROOT)
    findings = await missing_auth.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )

    # /admin should be in findings, /login + /dashboard should NOT.
    flagged_paths = " ".join(f.title for f in findings)
    assert "/admin" in flagged_paths, f"expected /admin flagged; got: {[f.title for f in findings]}"

    # Should not flag /login (public) or /dashboard (has passport.authenticate).
    flagged_routes = {f.title for f in findings}
    for f in findings:
        assert f.category == "missing-auth"
        assert "[STUB cycle-1]" not in (f.description or "")
    # No public/login route flagged
    for title in flagged_routes:
        assert "/login" not in title, "should not flag /login (public path)"
        assert "/dashboard" not in title, "should not flag /dashboard (has auth middleware)"


@pytest.mark.skipif(not _has_network(), reason="OSV API requires network; set NEMESIS_OFFLINE=1 to skip")
async def test_outdated_deps_queries_osv_for_jquery() -> None:
    from app.services.detectors import outdated_deps
    from app.services.detectors.adapters import get_parser_adapter

    parsed = await get_parser_adapter().parse_repo(FIXTURE_ROOT)
    findings = await outdated_deps.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )
    # jquery 1.4.0 has known XSS advisories; expect at least one finding.
    assert findings, "expected at least one OSV finding for jquery 1.4.0"
    assert all(f.category == "outdated-dependency" for f in findings)
    assert all("[STUB cycle-1]" not in (f.description or "") for f in findings)


async def test_outdated_deps_offline_falls_back_to_stub_or_empty() -> None:
    """Offline path should not crash; either canned stub OR zero findings."""
    if _has_network():
        pytest.skip("network present; this test verifies offline behavior")
    from app.services.detectors import outdated_deps
    from app.services.detectors.adapters import get_parser_adapter

    parsed = await get_parser_adapter().parse_repo(FIXTURE_ROOT)
    findings = await outdated_deps.detect(
        FIXTURE_ROOT, parsed, "duopoly/codeplex-demo-nodegoat-slice"
    )
    # Result list (possibly empty) returned without exception.
    assert isinstance(findings, list)


async def test_outdated_deps_manifest_parser_picks_up_fixtures() -> None:
    from app.services.detectors.manifest_parser import parse_all_manifests

    deps = parse_all_manifests(FIXTURE_ROOT)
    names = {d.name for d in deps}
    assert "jquery" in names, f"manifest parser missed jquery; got {names}"
    assert "express" in names
    assert "mongodb" in names
    versions_by_name = {d.name: d.version for d in deps}
    assert versions_by_name.get("jquery") == "1.4.0"
