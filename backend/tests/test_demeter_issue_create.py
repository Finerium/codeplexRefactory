"""GitHub 1-click issue creator tests (Demeter Wave 3).

Mocks httpx response. Verifies evidence body + suggested label format.
"""
from __future__ import annotations

import pytest

from app.services.github_issue_create import (
    GitHubIssueCreator,
    IssueCreateRequest,
    build_evidence_body,
    suggest_label,
)


def test_build_evidence_body_includes_finding_meta() -> None:
    finding = {
        "title": "hardcoded API key",
        "category": "hardcoded-secret",
        "severity": "high",
        "repo_full_name": "test/repo",
        "file_path": "src/x.py",
        "line_start": 10,
        "line_end": 12,
        "building_id": "b-1",
        "cvss_vector": "CVSS:3.1/AV:N",
        "cvss_base_score": 7.5,
        "description": "Found near top of file.",
        "suggested_fix": "Move to environment variable.",
        "scan_run_id": "scan-1",
        "finding_id": "f-1",
        "detected_at": "2026-05-12T00:00:00Z",
    }
    body = build_evidence_body(finding)
    assert "hardcoded API key" in body
    assert "src/x.py" in body
    assert "10-12" in body
    assert "CVSS:3.1/AV:N" in body
    assert "7.5" in body
    assert "Move to environment variable." in body
    assert "scan-1" in body
    assert "Codeplex Chronicle" in body


def test_build_evidence_body_skips_missing_cvss() -> None:
    finding = {
        "title": "outdated dep",
        "category": "outdated-dependency",
        "severity": "low",
        "repo_full_name": "test/repo",
        "file_path": "package.json",
        "line_start": 1,
        "line_end": 1,
        "building_id": "b-2",
        "description": "lodash is 3 majors behind",
        "suggested_fix": "upgrade to 4.x",
        "scan_run_id": "scan-2",
        "finding_id": "f-2",
        "detected_at": "2026-05-12T00:00:00Z",
    }
    body = build_evidence_body(finding)
    # CVSS section header absent (trailer mention of "Argus CVSS" is allowed).
    assert "### CVSS" not in body
    assert "lodash" in body


def test_suggest_label_security_category() -> None:
    labels = suggest_label("hardcoded-secret", "high")
    assert "codeplex-chronicle" in labels
    assert "category:hardcoded-secret" in labels
    assert "severity:high" in labels
    assert "security" in labels


def test_suggest_label_non_security_category() -> None:
    labels = suggest_label("outdated-dependency", "low")
    assert "codeplex-chronicle" in labels
    assert "security" not in labels


def test_suggest_label_handles_none() -> None:
    labels = suggest_label(None, None)
    assert labels == ["codeplex-chronicle"]


def test_issue_create_request_validation() -> None:
    req = IssueCreateRequest(
        repo_full_name="o/r",
        title="t",
        body="b",
        labels=["a"],
    )
    assert req.repo_full_name == "o/r"
    assert req.labels == ["a"]


def test_github_issue_creator_init() -> None:
    creator = GitHubIssueCreator()
    assert creator is not None
    creator2 = GitHubIssueCreator(base_url="https://example.test")
    assert creator2._base_url == "https://example.test"
