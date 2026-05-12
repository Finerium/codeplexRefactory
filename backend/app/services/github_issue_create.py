"""1-click GitHub issue creator (Demeter Wave 3 Hybrid Layer 1 + Nemesis WF#2).

PRD pitch differentiator: convert a Nemesis finding into a GitHub issue with
evidence chain pre-filled body + suggested label. Uses the OAuth access token
(decrypted via crypto.py) from the authenticated user.

Scopes required: write:issues (per `app/config.py` GITHUB_OAUTH_SCOPES locked).

Anti-pattern Lock 3: token decrypted at use site only, never logged.

Nemesis Wave-Fixing #2 cycle 1: ship `build_deeplink_url` helper for
ENABLE_WRITE_OPS=false fallback per PRD Section 12.1 + cluster 7 verdict
(mock fallback path returns GitHub native deep link with pre-filled body).
"""
from __future__ import annotations

import logging
import urllib.parse
from typing import Any, Literal

import httpx
from pydantic import BaseModel

from app.services.crypto import decrypt_token

logger = logging.getLogger("demeter.github_issue")


# GitHub URL length budget for deep-link query string. Empirically Chromium /
# Firefox cap address bar at ~32KB; we keep evidence body under 7KB so the
# total URL stays under most reverse-proxy limits.
_DEEPLINK_BODY_BUDGET = 7000


class IssueCreateRequest(BaseModel):
    """Request from finding endpoint."""

    repo_full_name: str  # owner/repo
    title: str
    body: str
    labels: list[str] = []


# Three terminal states the frontend renders distinctly:
# - "open": real GitHub issue created with valid issue_number.
# - "deeplink": ENABLE_WRITE_OPS=false fallback OR DROP-A degradation; issue_url
#   is a GitHub /issues/new?... pre-filled link, issue_number=0.
# - "closed" (rare): GitHub returned an already-closed issue (defensive).
IssueResultState = Literal["open", "closed", "deeplink"]


class IssueCreateResult(BaseModel):
    """GitHub API response (subset)."""

    issue_number: int
    issue_url: str
    state: IssueResultState


class GitHubIssueCreator:
    """Wraps GitHub REST API POST /repos/{owner}/{repo}/issues."""

    def __init__(self, base_url: str = "https://api.github.com") -> None:
        self._base_url = base_url

    async def create_issue(
        self,
        *,
        encrypted_token: str,
        request: IssueCreateRequest,
    ) -> IssueCreateResult:
        """POST /repos/{owner}/{repo}/issues with bearer auth.

        Raises:
            ValueError: token decrypt failure.
            httpx.HTTPStatusError: GitHub API rejection.
        """
        access_token = decrypt_token(encrypted_token)
        if access_token is None:
            raise ValueError("token decrypt failed")

        url = f"{self._base_url}/repos/{request.repo_full_name}/issues"
        payload: dict[str, Any] = {
            "title": request.title,
            "body": request.body,
        }
        if request.labels:
            payload["labels"] = request.labels

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            resp.raise_for_status()
            data = resp.json()
        return IssueCreateResult(
            issue_number=int(data["number"]),
            issue_url=str(data["html_url"]),
            state=str(data.get("state", "open")),
        )


def build_evidence_body(finding: dict[str, Any]) -> str:
    """Pre-fill body with evidence chain from finding row.

    Format includes finding category, severity, file path, line range, CVSS
    if available, suggested fix. Markdown-formatted for GitHub issue body.
    """
    lines = [
        f"## Finding: {finding.get('title', 'untitled')}",
        "",
        f"**Category**: `{finding.get('category', 'unknown')}`",
        f"**Severity**: `{finding.get('severity', 'unknown')}`",
        f"**Repository**: `{finding.get('repo_full_name', 'unknown')}`",
        "",
        "### Location",
        "",
        f"- File: `{finding.get('file_path', 'unknown')}`",
        f"- Lines: {finding.get('line_start', 0)}-{finding.get('line_end', 0)}",
        f"- Building: `{finding.get('building_id', 'unknown')}`",
        "",
    ]
    cvss_vector = finding.get("cvss_vector")
    cvss_score = finding.get("cvss_base_score")
    if cvss_vector or cvss_score:
        lines.extend(
            [
                "### CVSS",
                "",
                f"- Vector: `{cvss_vector or 'not scored'}`",
                f"- Base Score: `{cvss_score or 'not scored'}`",
                "",
            ]
        )
    description = finding.get("description")
    if description:
        lines.extend(["### Description", "", description, ""])
    suggested_fix = finding.get("suggested_fix")
    if suggested_fix:
        lines.extend(["### Suggested Fix", "", suggested_fix, ""])

    lines.extend(
        [
            "### Provenance",
            "",
            f"- Scan run: `{finding.get('scan_run_id', 'unknown')}`",
            f"- Finding ID: `{finding.get('finding_id', 'unknown')}`",
            f"- Detected at: `{finding.get('detected_at', 'unknown')}`",
            "",
            "Generated by Codeplex Chronicle Health Mode (Nemesis detector + Argus CVSS).",
        ]
    )
    return "\n".join(lines)


def suggest_label(category: str | None, severity: str | None) -> list[str]:
    """Suggest GitHub issue labels based on finding category + severity."""
    labels: list[str] = ["codeplex-chronicle"]
    if category:
        labels.append(f"category:{category}")
    if severity:
        labels.append(f"severity:{severity}")
    if category in ("hardcoded-secret", "missing-auth", "unsafe-sql"):
        labels.append("security")
    return labels


def build_deeplink_url(request: IssueCreateRequest) -> str:
    """Build a GitHub /issues/new?... URL with title + body + labels pre-filled.

    Used when `ENABLE_WRITE_OPS=false` or when the user has no encrypted token
    on file (DROP-A degradation). Per PRD Section 12.1: "fallback protocol ke
    read-only" means the user can still review the evidence + manually file
    the issue from their browser.

    Body truncated to _DEEPLINK_BODY_BUDGET bytes to stay below proxy URL caps.
    Labels comma-joined per GitHub URL syntax. Trailing footnote added when
    body exceeded budget so the user knows to copy the full evidence from the
    Asclepius evidence panel.
    """
    body = request.body
    if len(body) > _DEEPLINK_BODY_BUDGET:
        body = (
            body[:_DEEPLINK_BODY_BUDGET]
            + "\n\n_[truncated for URL budget; full evidence in Codeplex evidence panel]_"
        )
    params: dict[str, str] = {
        "title": request.title,
        "body": body,
    }
    if request.labels:
        # GitHub accepts comma-joined labels in the new-issue query string.
        params["labels"] = ",".join(request.labels)
    qs = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    return f"https://github.com/{request.repo_full_name}/issues/new?{qs}"


__all__ = [
    "GitHubIssueCreator",
    "IssueCreateRequest",
    "IssueCreateResult",
    "IssueResultState",
    "build_deeplink_url",
    "build_evidence_body",
    "suggest_label",
]
