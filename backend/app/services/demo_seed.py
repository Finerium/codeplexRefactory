"""Demo seed service (Demeter Wave-Fixing #2 cycle 1 cluster 4+8 rescue).

Populates pr_events + finding_events + drift_log with realistic NodeGoat +
fastapi-fullstack data so materialized views render non-empty for Selene
dashboard + Boreas activity demo. Idempotent: re-running same seed does not
duplicate rows (uses ON CONFLICT discipline already in DemeterRealService).

Anti-pattern Lock 5: seeded data clearly labelled `seed-demo:` in delivery_id
prefix + scan_run_id prefix so panitia can distinguish from real OAuth events.
"""
from __future__ import annotations

import hashlib
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone

from app.services.demeter_real import (
    DemeterRealService,
    DriftEventPersist,
    FindingPersist,
)
from app.services.demeter_service import PREventPersist

logger = logging.getLogger("demeter.demo_seed")


# ---------- demo repo profiles ----------

NODEGOAT_REPO = "OWASP/NodeGoat"
FASTAPI_REPO = "tiangolo/full-stack-fastapi-template"

NODEGOAT_CONTRIBUTORS = [
    ("ckarande", "https://avatars.githubusercontent.com/u/2069614"),
    ("mihirsam", "https://avatars.githubusercontent.com/u/12345678"),
    ("aaravsoftware", "https://avatars.githubusercontent.com/u/87654321"),
    ("noderb", "https://avatars.githubusercontent.com/u/11223344"),
]

FASTAPI_CONTRIBUTORS = [
    ("tiangolo", "https://avatars.githubusercontent.com/u/1326112"),
    ("alejsdev", "https://avatars.githubusercontent.com/u/90227517"),
    ("Lancetnik", "https://avatars.githubusercontent.com/u/44573233"),
    ("estebanx64", "https://avatars.githubusercontent.com/u/10840422"),
]

NODEGOAT_BUILDINGS = [
    "app__routes__index_js",
    "app__routes__login_js",
    "app__routes__profile_js",
    "app__routes__memos_js",
    "app__data__user_dao_js",
    "app__data__allocations_dao_js",
    "config__config_js",
    "server_js",
]

FASTAPI_BUILDINGS = [
    "backend__app__main_py",
    "backend__app__api__deps_py",
    "backend__app__api__routes__login_py",
    "backend__app__api__routes__users_py",
    "backend__app__core__security_py",
    "backend__app__core__config_py",
    "backend__app__crud_py",
    "frontend__src__client__sdk_gen_ts",
]

SPRINT_LABELS = ["Sprint 38", "Sprint 39", "Sprint 40", "Sprint 41"]


# ---------- seed driver ----------


class DemoSeedService:
    """Realistic seed for Selene dashboard + Boreas activity demo readiness."""

    def __init__(self, demeter: DemeterRealService) -> None:
        self._demeter = demeter
        self._rng = random.Random(20260513)  # deterministic across runs

    async def seed_all(self) -> dict[str, int]:
        """Idempotent seed of all demo repos. Returns row counts touched."""
        result = {
            "pr_events": 0,
            "findings": 0,
            "drifts": 0,
        }

        # Order-sensitive: PRs first (matview cycle/lead time joins),
        # then findings + drifts, then refresh views.
        pr_count_a = await self._seed_pr_events(
            NODEGOAT_REPO, NODEGOAT_CONTRIBUTORS, NODEGOAT_BUILDINGS
        )
        pr_count_b = await self._seed_pr_events(
            FASTAPI_REPO, FASTAPI_CONTRIBUTORS, FASTAPI_BUILDINGS
        )
        result["pr_events"] = pr_count_a + pr_count_b

        finding_count = await self._seed_findings(
            NODEGOAT_REPO, NODEGOAT_BUILDINGS
        ) + await self._seed_findings(FASTAPI_REPO, FASTAPI_BUILDINGS)
        result["findings"] = finding_count

        drift_count = await self._seed_drifts(NODEGOAT_REPO) + await self._seed_drifts(
            FASTAPI_REPO
        )
        result["drifts"] = drift_count

        # Refresh matviews so endpoints serve fresh data.
        try:
            await self._demeter.refresh_dashboard_views()
        except Exception as exc:
            logger.warning("dashboard refresh failed: %s", exc)
        try:
            await self._demeter.refresh_activity_views()
        except Exception as exc:
            logger.warning("activity refresh failed: %s", exc)

        return result

    # ---------- PR event seeding ----------

    async def _seed_pr_events(
        self,
        repo_full_name: str,
        contributors: list[tuple[str, str]],
        buildings: list[str],
    ) -> int:
        """Seed ~90 days of realistic PR + issue events.

        Pattern per day: 2-5 PR opened, 1-3 PR merged, 1-2 issue opened,
        0-2 issue closed. Spread across contributors with bias for ownership
        (each contributor owns 2-3 buildings primary).
        """
        now = datetime.now(timezone.utc)
        count = 0

        # Ownership map: contributor -> primary buildings (for ownership_distribution view).
        ownership_map: dict[str, list[str]] = {}
        for i, (login, _) in enumerate(contributors):
            start = (i * 2) % len(buildings)
            ownership_map[login] = buildings[start : start + 3]

        for day_offset in range(90, 0, -1):
            day = now - timedelta(days=day_offset)
            events_today = self._rng.randint(3, 8)
            for _ in range(events_today):
                login, _ = self._rng.choice(contributors)
                primary_buildings = ownership_map.get(login, buildings)
                # 70% ownership bias, 30% cross-team contribution.
                if self._rng.random() < 0.7 and primary_buildings:
                    building = self._rng.choice(primary_buildings)
                else:
                    building = self._rng.choice(buildings)

                event_type = self._rng.choices(
                    ["pr.opened", "pr.merged", "issue.opened", "issue.closed"],
                    weights=[0.30, 0.25, 0.25, 0.20],
                )[0]
                resource_num = self._rng.randint(100, 9999)
                lines_added = self._rng.randint(5, 200)
                lines_deleted = self._rng.randint(0, 50)
                story_points = (
                    self._rng.choice([1, 2, 3, 5, 8])
                    if event_type == "issue.closed"
                    else None
                )
                sprint_label = self._rng.choice(SPRINT_LABELS)

                # Deterministic delivery_id so re-seeding is idempotent.
                seed_key = (
                    f"seed-demo:{repo_full_name}:{event_type}:{day.date()}:"
                    f"{resource_num}:{login}"
                )
                delivery_id = hashlib.sha256(seed_key.encode()).hexdigest()[:32]

                file_count = self._rng.randint(1, 8)
                files_changed = [
                    f"{building.replace('__', '/')}.py"
                    if "fastapi" in repo_full_name.lower()
                    else f"{building.replace('__', '/')}.js"
                    for _ in range(file_count)
                ]
                event = PREventPersist(
                    event_type=event_type,
                    delivery_id=f"seed-demo-{delivery_id}",
                    building_id=building,
                    repo_full_name=repo_full_name,
                    resource_number=resource_num,
                    resource_title=f"[{sprint_label}] feat: improve {building}",
                    author_login=login,
                    files_changed=files_changed,
                    lines_added=lines_added,
                    lines_deleted=lines_deleted,
                    story_points=story_points,
                    assignee_login=login,
                    payload={
                        "milestone_title": sprint_label,
                        "seed_demo": True,
                    },
                    received_at=day.isoformat(),
                )
                try:
                    await self._demeter.persist_pr_event(event)
                    count += 1
                except Exception as exc:
                    logger.debug("seed pr_event skip: %s", exc)

        logger.info("seeded %d pr_events for %s", count, repo_full_name)
        return count

    # ---------- Finding seeding ----------

    async def _seed_findings(
        self, repo_full_name: str, buildings: list[str]
    ) -> int:
        """Seed Apollo-style findings 5 categories per repo (idempotent)."""
        now = datetime.now(timezone.utc)
        scan_run_id = f"seed-demo-scan-{repo_full_name.replace('/', '_')}"

        finding_templates = [
            (
                "hardcoded-secret",
                "critical",
                "Hardcoded API key in config",
                "Found a 64-char API key string literal that triggers high "
                "Shannon entropy (4.2). Likely leaked credential.",
                'API_KEY = "sk_live_4f9c8a2b7d1e3f5..."',
                "Move secret to env var. Rotate credential immediately.",
                "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                9.8,
            ),
            (
                "outdated-dependency",
                "high",
                "Dependency lodash 3.10.1 has CVE-2019-10744",
                "Lodash version pinned 8 majors behind. Known prototype "
                "pollution CVE in defaultsDeep.",
                "defaultsDeep prototype pollution",
                "Bump to lodash >=4.17.12. Run npm audit fix.",
                "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L",
                7.4,
            ),
            (
                "missing-auth",
                "high",
                "Public route exposes user profile without auth check",
                "Route /api/users/:id has no auth middleware between Express "
                "handler and DAO call. Reachable unauthenticated.",
                "app.get('/api/users/:id', getUserById)",
                "Insert requireAuth middleware before handler.",
                "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
                7.5,
            ),
            (
                "unsafe-sql",
                "critical",
                "SQL injection via string concatenation",
                "Direct concat of user input into SQL query bypasses parameter "
                "binding. Confirmed via test injection.",
                "SELECT * FROM users WHERE id = '\" + userId + \"'",
                "Use parameterized query: WHERE id = ?",
                "AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
                10.0,
            ),
            (
                "complex-untested",
                "medium",
                "High cyclomatic complexity untested",
                "Function has McCabe complexity 22 (threshold 10) with no "
                "colocated test file. Refactor or add coverage.",
                "def process_user_input(data):  # CC=22",
                "Extract helper functions + add unit tests with edge cases.",
                None,
                None,
            ),
        ]
        count = 0
        for i, (cat, sev, title, desc, exploit, fix, cvss_v, cvss_s) in enumerate(
            finding_templates
        ):
            building = buildings[i % len(buildings)]
            finding_id = f"seed-demo-{repo_full_name.replace('/', '_')}-{cat}-{i}"
            finding = FindingPersist(
                finding_id=finding_id,
                building_id=building,
                file_path=f"{building.replace('__', '/')}.js"
                if "node" in repo_full_name.lower()
                else f"{building.replace('__', '/')}.py",
                line_start=self._rng.randint(20, 200),
                line_end=self._rng.randint(201, 350),
                category=cat,
                severity=sev,
                title=title,
                description=desc,
                suggested_fix=fix,
                cvss_vector=cvss_v,
                cvss_base_score=cvss_s,
                exploit_pattern=exploit,
                repo_full_name=repo_full_name,
                scan_run_id=scan_run_id,
                detected_at=(now - timedelta(hours=self._rng.randint(1, 72))).isoformat(),
            )
            try:
                await self._demeter.persist_finding(finding)
                count += 1
            except Exception as exc:
                logger.debug("seed finding skip: %s", exc)
        logger.info("seeded %d findings for %s", count, repo_full_name)
        return count

    # ---------- Drift seeding ----------

    async def _seed_drifts(self, repo_full_name: str) -> int:
        """Seed spec-drift events 5 patterns A/B/C/D/E."""
        now = datetime.now(timezone.utc)
        scan_run_id = f"seed-demo-drift-{repo_full_name.replace('/', '_')}"
        patterns = [
            (
                "A",
                "Closed issue edited after",
                "high",
                "issue#1234",
                "Issue closed 7 months ago but description edited last week.",
            ),
            (
                "B",
                "Linked PR not merged",
                "medium",
                "PR#456 -> issue#789",
                "PR referenced as implementation in issue body, but PR was closed unmerged.",
            ),
            (
                "C",
                "Lag exceeds threshold",
                "high",
                "issue#2001",
                "Spec accepted 4 months ago, no implementation PR opened. Lag = 4mo > 2mo threshold.",
            ),
            (
                "D",
                "Reopened multiple times",
                "medium",
                "issue#88",
                "Issue reopened 3 times in 30 days. Likely flake or unresolved scope.",
            ),
            (
                "E",
                "Spec archived without impl",
                "high",
                "openspec/archive/2026-01-15/add-oauth-flow/",
                "OpenSpec change archived but no implementation commits found in git log.",
            ),
        ]
        count = 0
        for pattern, label, sev, resource, descr in patterns:
            drift_id = f"seed-demo-{repo_full_name.replace('/', '_')}-{pattern}"
            drift = DriftEventPersist(
                drift_id=drift_id,
                pattern=pattern,
                pattern_label=label,
                repo_full_name=repo_full_name,
                affected_resource=resource,
                severity=sev,
                evidence={
                    "description": descr,
                    "resolved": False,
                    "seed_demo": True,
                },
                scan_run_id=scan_run_id,
                detected_at=(now - timedelta(days=self._rng.randint(1, 14))).isoformat(),
            )
            try:
                await self._demeter.persist_drift_event(drift)
                count += 1
            except Exception as exc:
                logger.debug("seed drift skip: %s", exc)
        logger.info("seeded %d drifts for %s", count, repo_full_name)
        return count


__all__ = ["DemoSeedService", "NODEGOAT_REPO", "FASTAPI_REPO"]
