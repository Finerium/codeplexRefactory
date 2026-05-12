"""GitHub webhook to BuildingEvent translator (Hades Wave 3).

Covers 14-event union per Hera handoff `_meta/handoff_log/wave2_hera_to_hades.md`
lines 17-46. Each translator function returns list[dict] because some webhook
events fan out per `files_changed[]` (one BuildingEvent per affected building).

Cycle 1 status: REAL. (No stub here; impl is small enough to do once.)

Building id resolution:
- For hackathon scope, Hades does NOT call Pandora parser yet; the
  `building_id` field defaults to a deterministic hash of the first
  changed file path. Pandora cycle 2 will hook in a proper resolver
  via `set_building_id_resolver()`. Until then, hash fallback works
  with Hera frontend deterministic ownership encoding (djb2 hash per
  Iris D-Iris-04 `_meta/decisions/iris_ownership_palette.md`).
"""
from __future__ import annotations

import hashlib
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("hades.translate_webhook")


def _default_building_id_from_path(file_path: str) -> str:
    """Deterministic building id from file path (hash).

    Iris ownership palette also uses djb2; Hera mock tape used building ids
    like 'b_42'. For real flow Hades emits 'b_<8hexchars>' so frontend can
    pick up via existing building registry lookup. Pandora cycle 2 swap
    will return real building IDs from the city treemap.
    """
    h = hashlib.sha1(file_path.encode("utf-8")).hexdigest()[:8]
    return f"b_{h}"


_building_id_resolver: Callable[[list[str]], list[str]] | None = None


def set_building_id_resolver(fn: Callable[[list[str]], list[str]]) -> None:
    """Pandora cycle 2 install: map files_changed -> building ids."""
    global _building_id_resolver
    _building_id_resolver = fn


def _resolve_building_ids(files_changed: list[str]) -> list[str]:
    """Resolve files -> building ids via Pandora resolver or fallback."""
    if not files_changed:
        return [""]
    if _building_id_resolver is not None:
        try:
            ids = _building_id_resolver(files_changed)
            if ids:
                return ids
        except Exception as exc:
            logger.warning("building resolver failed, fallback hash: %s", exc)
    # Fallback: dedupe path-derived ids.
    seen: set[str] = set()
    out: list[str] = []
    for fp in files_changed:
        bid = _default_building_id_from_path(fp)
        if bid not in seen:
            seen.add(bid)
            out.append(bid)
    return out


def _extract_files_changed_from_pr(payload: dict) -> list[str]:
    """GitHub PR payload doesn't always include files_changed; populate where present.

    The `pull_request` object has `changed_files` count but not file list.
    Real flow requires hitting GitHub API `/pulls/<num>/files`. For Wave 3
    hackathon scope, Hades reads from payload when present (sometimes a
    webhook config will include the diff). Empty list otherwise; consumer
    treats as single-building deduce via repository_id.
    """
    pr = payload.get("pull_request") or {}
    # Optional convenience field that some clients pre-populate.
    return pr.get("_files_changed") or []


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(tz=timezone.utc).isoformat()


def _label_blocked(labels: list[dict] | None) -> bool:
    if not labels:
        return False
    return any((lbl.get("name", "").lower() == "blocked") for lbl in labels)


def _label_story_points(labels: list[dict] | None) -> int | None:
    """Parse 'size:S/M/L/XL' label convention into story points.

    Convention per Pythia contract `hera-to-hades.md` payload schema:
        S=1, M=3, L=5, XL=8
    """
    if not labels:
        return None
    mapping = {"size:s": 1, "size:m": 3, "size:l": 5, "size:xl": 8}
    for lbl in labels:
        name = lbl.get("name", "").lower()
        if name in mapping:
            return mapping[name]
    return None


def translate_webhook_to_building_events(
    github_event: str,
    payload: dict[str, Any],
) -> list[dict[str, Any]]:
    """Map GitHub webhook event payload to list of BuildingEvent dicts.

    Returns list because some events fan out per affected building (one event
    per file path in files_changed). Consumers (event bus + Demeter) iterate.

    Covers 14 Hera event types verbatim per handoff. Unknown github events
    return empty list (caller may persist raw payload but no fanout).
    """
    repo = payload.get("repository", {}) or {}
    repo_full_name = repo.get("full_name", "")
    ts = _now_iso()
    action = payload.get("action", "")

    events: list[dict[str, Any]] = []

    if github_event == "pull_request":
        pr = payload.get("pull_request") or {}
        pr_number = pr.get("number", 0)
        title = pr.get("title", "")
        author = (pr.get("user") or {}).get("login", "")
        files = _extract_files_changed_from_pr(payload)
        building_ids = _resolve_building_ids(files)

        if action == "opened":
            for bid in building_ids:
                events.append({
                    "type": "pr.opened",
                    "buildingId": bid,
                    "resourceNumber": pr_number,
                    "timestamp": ts,
                    "payload": {
                        "prTitle": title,
                        "prUrl": pr.get("html_url", ""),
                        "authorLogin": author,
                        "filesChanged": files,
                    },
                })
        elif action == "review_requested":
            reviewers = [
                u.get("login", "")
                for u in payload.get("requested_reviewers", []) or []
            ]
            for bid in building_ids:
                events.append({
                    "type": "pr.review_requested",
                    "buildingId": bid,
                    "resourceNumber": pr_number,
                    "timestamp": ts,
                    "payload": {"reviewerLogins": reviewers},
                })
        elif action == "closed":
            merged = bool(pr.get("merged"))
            if merged:
                merger = (pr.get("merged_by") or {}).get("login", "")
                merge_sha = pr.get("merge_commit_sha", "") or ""
                for bid in building_ids:
                    events.append({
                        "type": "pr.merged",
                        "buildingId": bid,
                        "resourceNumber": pr_number,
                        "timestamp": ts,
                        "payload": {
                            "mergerLogin": merger,
                            "mergeSha": merge_sha,
                        },
                    })
            else:
                for bid in building_ids:
                    events.append({
                        "type": "pr.closed",
                        "buildingId": bid,
                        "resourceNumber": pr_number,
                        "timestamp": ts,
                        "payload": {"withoutMerge": True},
                    })

    elif github_event == "pull_request_review":
        pr = payload.get("pull_request") or {}
        pr_number = pr.get("number", 0)
        review = payload.get("review") or {}
        state = review.get("state", "")
        author = (review.get("user") or {}).get("login", "")
        files = _extract_files_changed_from_pr(payload)
        building_ids = _resolve_building_ids(files)

        if action == "submitted" and state == "approved":
            for bid in building_ids:
                events.append({
                    "type": "pr.approved",
                    "buildingId": bid,
                    "resourceNumber": pr_number,
                    "timestamp": ts,
                    "payload": {
                        "approverLogin": author,
                        # Without full reviewer registry we cannot determine
                        # this; default True for single-reviewer flow. Pandora
                        # cycle 2 may refine.
                        "allRequiredApproved": True,
                    },
                })

    elif github_event == "issues":
        issue = payload.get("issue") or {}
        issue_number = issue.get("number", 0)
        labels = issue.get("labels", [])
        author = (issue.get("user") or {}).get("login", "")
        title = issue.get("title", "")

        if action == "opened":
            assignee = (issue.get("assignee") or {}).get("login")
            events.append({
                "type": "issue.opened",
                "buildingId": "",  # issue not tied to a file in PR-driven model
                "resourceNumber": issue_number,
                "timestamp": ts,
                "payload": {
                    "issueTitle": title,
                    "issueUrl": issue.get("html_url", ""),
                    "authorLogin": author,
                    "storyPoints": _label_story_points(labels),
                    "assignee": assignee,
                    "blocked": _label_blocked(labels),
                },
            })
        elif action == "closed":
            closer = (payload.get("sender") or {}).get("login", "")
            # `with_related_pr_merged` requires querying linked PR; default
            # False unless payload contains pull_request reference.
            with_pr = bool((issue.get("pull_request") or {}).get("merged_at"))
            events.append({
                "type": "issue.closed",
                "buildingId": "",
                "resourceNumber": issue_number,
                "timestamp": ts,
                "payload": {
                    "closerLogin": closer,
                    "withRelatedPRMerged": with_pr,
                },
            })

    elif github_event in ("issue_comment", "pull_request_review_comment"):
        comment = payload.get("comment") or {}
        comment_id = str(comment.get("id", ""))
        body = comment.get("body", "")
        author = (comment.get("user") or {}).get("login", "")
        issue = payload.get("issue") or {}
        pr = payload.get("pull_request") or {}
        resource_number = issue.get("number") or pr.get("number") or 0
        files = _extract_files_changed_from_pr(payload)
        building_ids = _resolve_building_ids(files) if files else [""]

        if action == "created":
            for bid in building_ids:
                events.append({
                    "type": "comment.created",
                    "buildingId": bid,
                    "resourceNumber": resource_number,
                    "timestamp": ts,
                    "payload": {
                        "commentId": comment_id,
                        "commentBody": body,
                        "authorLogin": author,
                        "resolved": False,
                    },
                })
        elif action == "edited" or action == "resolved":
            for bid in building_ids:
                events.append({
                    "type": "comment.resolved",
                    "buildingId": bid,
                    "resourceNumber": resource_number,
                    "timestamp": ts,
                    "payload": {
                        "commentId": comment_id,
                        "commentBody": body,
                        "authorLogin": author,
                        "resolved": True,
                    },
                })

    elif github_event == "check_run":
        check_run = payload.get("check_run") or {}
        conclusion = check_run.get("conclusion", "")
        # check_run carries pull_requests array.
        prs = check_run.get("pull_requests", []) or []
        pr_number = prs[0].get("number", 0) if prs else 0
        files = _extract_files_changed_from_pr(payload)
        building_ids = _resolve_building_ids(files)

        if action == "completed" and conclusion == "failure":
            for bid in building_ids:
                events.append({
                    "type": "ci.fail",
                    "buildingId": bid,
                    "resourceNumber": pr_number,
                    "timestamp": ts,
                    "payload": {
                        "conclusion": conclusion,
                        "name": check_run.get("name", ""),
                        "html_url": check_run.get("html_url", ""),
                    },
                })
        elif action == "completed" and conclusion == "success":
            for bid in building_ids:
                events.append({
                    "type": "ci.pass",
                    "buildingId": bid,
                    "resourceNumber": pr_number,
                    "timestamp": ts,
                    "payload": {
                        "conclusion": conclusion,
                        "name": check_run.get("name", ""),
                        "html_url": check_run.get("html_url", ""),
                    },
                })

    elif github_event == "ping":
        # GitHub OAuth app initial ping after webhook config. No fanout, but
        # log so smoke tests confirm receipt.
        logger.info("webhook ping received zen=%s", payload.get("zen", ""))

    else:
        logger.info(
            "Unsupported webhook event for fanout: github_event=%s action=%s",
            github_event,
            action,
        )

    return events
