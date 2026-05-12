"""translate_webhook unit tests (Hades Wave 3).

Validates 14-event union mapping per Hera handoff lines 17-46.
"""
from __future__ import annotations


def test_pull_request_opened_produces_pr_opened():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "opened",
        "repository": {"full_name": "Finerium/codeplexRefactory"},
        "pull_request": {
            "number": 1,
            "title": "x",
            "html_url": "x",
            "user": {"login": "ghaisan"},
            "_files_changed": ["a.py", "b.py"],
        },
    }
    events = translate_webhook_to_building_events("pull_request", payload)
    assert len(events) == 2
    for e in events:
        assert e["type"] == "pr.opened"
        assert e["resourceNumber"] == 1


def test_pull_request_closed_merged_produces_pr_merged():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "closed",
        "repository": {"full_name": "Finerium/codeplexRefactory"},
        "pull_request": {
            "number": 2,
            "title": "x",
            "merged": True,
            "merged_by": {"login": "ghaisan"},
            "merge_commit_sha": "abc123",
            "user": {"login": "ghaisan"},
            "_files_changed": ["x.py"],
        },
    }
    events = translate_webhook_to_building_events("pull_request", payload)
    assert len(events) == 1
    assert events[0]["type"] == "pr.merged"
    assert events[0]["payload"]["mergeSha"] == "abc123"


def test_pull_request_closed_not_merged_produces_pr_closed():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "closed",
        "repository": {"full_name": "x/y"},
        "pull_request": {
            "number": 3,
            "title": "x",
            "merged": False,
            "user": {"login": "ghaisan"},
            "_files_changed": ["q.py"],
        },
    }
    events = translate_webhook_to_building_events("pull_request", payload)
    assert len(events) == 1
    assert events[0]["type"] == "pr.closed"
    assert events[0]["payload"]["withoutMerge"] is True


def test_pull_request_review_approved_produces_pr_approved():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "submitted",
        "repository": {"full_name": "x/y"},
        "review": {
            "state": "approved",
            "user": {"login": "reviewer"},
        },
        "pull_request": {
            "number": 4,
            "_files_changed": ["a.py"],
        },
    }
    events = translate_webhook_to_building_events("pull_request_review", payload)
    assert len(events) == 1
    assert events[0]["type"] == "pr.approved"
    assert events[0]["payload"]["approverLogin"] == "reviewer"


def test_issue_opened_with_size_label_produces_story_points():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "opened",
        "repository": {"full_name": "x/y"},
        "issue": {
            "number": 10,
            "title": "feature",
            "html_url": "x",
            "user": {"login": "ghaisan"},
            "labels": [{"name": "size:M"}],
            "assignee": {"login": "hafiz"},
        },
    }
    events = translate_webhook_to_building_events("issues", payload)
    assert len(events) == 1
    assert events[0]["type"] == "issue.opened"
    assert events[0]["payload"]["storyPoints"] == 3
    assert events[0]["payload"]["assignee"] == "hafiz"


def test_issue_with_blocked_label_marks_blocked():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "opened",
        "repository": {"full_name": "x/y"},
        "issue": {
            "number": 11,
            "title": "feature",
            "html_url": "x",
            "user": {"login": "ghaisan"},
            "labels": [{"name": "blocked"}],
        },
    }
    events = translate_webhook_to_building_events("issues", payload)
    assert events[0]["payload"]["blocked"] is True


def test_check_run_failure_produces_ci_fail():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "completed",
        "repository": {"full_name": "x/y"},
        "check_run": {
            "conclusion": "failure",
            "name": "lint",
            "html_url": "x",
            "pull_requests": [{"number": 5}],
            "_files_changed": ["foo.py"],
        },
    }
    events = translate_webhook_to_building_events("check_run", payload)
    assert len(events) == 1
    assert events[0]["type"] == "ci.fail"
    assert events[0]["resourceNumber"] == 5


def test_check_run_success_produces_ci_pass():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "completed",
        "repository": {"full_name": "x/y"},
        "check_run": {
            "conclusion": "success",
            "name": "lint",
            "html_url": "x",
            "pull_requests": [{"number": 6}],
            "_files_changed": ["foo.py"],
        },
    }
    events = translate_webhook_to_building_events("check_run", payload)
    assert len(events) == 1
    assert events[0]["type"] == "ci.pass"


def test_issue_comment_created_produces_comment_created():
    from app.services.translate_webhook import translate_webhook_to_building_events

    payload = {
        "action": "created",
        "repository": {"full_name": "x/y"},
        "issue": {"number": 7},
        "comment": {
            "id": 42,
            "body": "looks good",
            "user": {"login": "ghaisan"},
        },
    }
    events = translate_webhook_to_building_events("issue_comment", payload)
    assert len(events) == 1
    assert events[0]["type"] == "comment.created"
    assert events[0]["payload"]["commentBody"] == "looks good"


def test_ping_event_returns_empty():
    from app.services.translate_webhook import translate_webhook_to_building_events

    events = translate_webhook_to_building_events("ping", {"zen": "Mind your words"})
    assert events == []


def test_unknown_event_returns_empty():
    from app.services.translate_webhook import translate_webhook_to_building_events

    events = translate_webhook_to_building_events("workflow_run", {})
    assert events == []
