"""GitHub Issue fallback for repos without openspec/ folder.

Owner: Pandora (Wave 3).

Per PRD Section 11 + Section 17.1 progressive degradation principle:
when the target repository has no `openspec/` directory, Pandora falls
back to creating a structured GitHub Issue draft instead of writing an
OpenSpec change folder.

Flow:
1. ``has_openspec_folder(repo_root)`` returns False.
2. Pandora calls ``draft_github_issue(ctx, repo_slug)`` which returns
   a ``GitHubIssueDraft`` containing the proposal title plus an
   issue body that bundles the would-be proposal.md, design.md, and
   tasks.md content.
3. The dual review gate UI surfaces an "Open in GitHub" CTA that
   takes the user to the issue creation form pre-filled with the
   draft body. The actual issue creation goes through Hades' GitHub
   client when the user clicks Accept.

The fallback satisfies the Refactory rule "OpenSpec mandatory" for
this product (we use OpenSpec internally for change folder generation
when the host repo supports it) and gracefully degrades to GitHub
Issues for non-OpenSpec repos per PRD Section 11.

References:
- PRD Section 11 (progressive degradation OpenSpec default, GitHub
  Issues fallback)
- PRD Section 12.1 (Hybrid Write Layer 1 GitHub Issue creation)
- ``.claude/agents/pandora.md`` Domain ownership (GitHub Issue
  fallback when no openspec/)
- ``_meta/contracts/hades-to-pandora.md`` lines 35-72 (parser context
  used to enrich the issue body)

Compliance: Lock 1 (no em dash). Lock 2 (no emoji). Lock 5 [STUB] flag
on the GitHub client method (real call goes through Hades' PyGithub
wrapper Cycle 2).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from .openspec_generator import (
    DESIGN_TEMPLATE,
    PROPOSAL_TEMPLATE,
    TASKS_TEMPLATE,
    _format_affected_files,
    _format_ghost_hints_md,
    _format_user_intent_section,
    _now_iso,
)
from .types import ProposalContext

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------


def has_openspec_folder(repo_root: Path) -> bool:
    """Return True if ``repo_root/openspec`` directory exists."""
    return (Path(repo_root) / "openspec").is_dir()


# ---------------------------------------------------------------------------
# Draft schema
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class GitHubIssueDraft:
    """Structured draft for a fallback GitHub issue.

    The body bundles the proposal plus design plus tasks markdown that
    would otherwise live in `openspec/changes/<change-name>/`.
    """

    title: str
    body: str
    labels: list[str] = field(default_factory=lambda: ["refactor-proposal"])
    assignees: list[str] = field(default_factory=list)
    change_name: str = ""
    repo_slug: str = ""

    def to_url(self, base: str = "https://github.com") -> str:
        """Return the GitHub issue-creation URL pre-populated with the draft.

        Uses GitHub's `new issue` query string format. The repo_slug
        is expected to be ``<owner>/<repo>`` (e.g.,
        ``Finerium/codeplexRefactory``).
        """
        from urllib.parse import quote_plus

        if not self.repo_slug:
            return f"{base}/new"
        title_q = quote_plus(self.title)
        body_q = quote_plus(self.body)
        labels_q = quote_plus(",".join(self.labels))
        return (
            f"{base}/{self.repo_slug}/issues/new"
            f"?title={title_q}&body={body_q}&labels={labels_q}"
        )


# ---------------------------------------------------------------------------
# Draft author
# ---------------------------------------------------------------------------


def draft_github_issue(
    ctx: ProposalContext,
    repo_slug: str,
    *,
    extra_labels: Optional[list[str]] = None,
) -> GitHubIssueDraft:
    """Build a GitHubIssueDraft from a ProposalContext.

    The body composes the proposal, design, and tasks markdown sections
    (the same templates used by ``OpenSpecGenerator``) inside a single
    issue body so reviewers see the full refactor plan inline.

    Args:
        ctx: the Athena-authored proposal.
        repo_slug: the target ``<owner>/<repo>`` slug.
        extra_labels: optional additional labels (e.g., "demo", "epic").
    """

    affected_count = len(ctx.affected_files)
    user_intent_one_line = ctx.user_intent.replace("\n", " ").strip()
    change_name = ctx.openspec_change_path.strip("/").split("/")[-1] or "refactor-proposal"
    context = {
        "title": ctx.title,
        "timestamp": _now_iso(),
        "summary": ctx.summary,
        "user_intent_section": _format_user_intent_section(ctx),
        "affected_count": affected_count,
        "affected_files_list": _format_affected_files(ctx),
        "complexity": ctx.complexity,
        "callsite_count": ctx.callsite_count,
        "ghost_hints_section": _format_ghost_hints_md(ctx),
        "change_name": change_name,
        "user_intent_one_line": user_intent_one_line,
    }
    proposal_md = PROPOSAL_TEMPLATE.format(**context)
    design_md = DESIGN_TEMPLATE.format(**context)
    tasks_md = TASKS_TEMPLATE.format(**context)

    body = (
        f"_Generated by Athena (Pandora Wave 3 Refactor Mode) on {context['timestamp']}._\n\n"
        f"_This repository has no `openspec/` directory. Pandora is using the GitHub Issue fallback per PRD Section 11._\n\n"
        f"## Proposal\n\n{proposal_md}\n\n"
        f"---\n\n## Design\n\n{design_md}\n\n"
        f"---\n\n## Tasks\n\n{tasks_md}\n"
    )

    labels = ["refactor-proposal", f"complexity:{ctx.complexity}"]
    if extra_labels:
        labels.extend(extra_labels)

    title = ctx.title
    if not title.lower().startswith("refactor:"):
        title = f"Refactor: {title}"

    draft = GitHubIssueDraft(
        title=title,
        body=body,
        labels=labels,
        assignees=[],
        change_name=change_name,
        repo_slug=repo_slug,
    )
    logger.info(
        "github_issue_fallback: drafted issue for %s (%d body chars, %d labels)",
        repo_slug,
        len(body),
        len(labels),
    )
    return draft


# ---------------------------------------------------------------------------
# Stub for actual issue creation (Cycle 2 swap to Hades' GitHub client)
# ---------------------------------------------------------------------------


async def create_github_issue(
    draft: GitHubIssueDraft,
    *,
    github_client: Optional[object] = None,
) -> dict[str, object]:
    """Create the GitHub issue via the Hades GitHub client.

    [STUB Cycle 1, real Hades PyGithub Cycle 2 full impl]

    Cycle 1 stub returns the pre-populated GitHub `new issue` URL so
    the dual review gate UI can render an "Open in GitHub" button that
    pops the issue form in a new tab with the draft body. This works
    without write-scope OAuth; the user picks Submit on GitHub natively.

    Cycle 2 swap: when ``github_client`` is provided (Hades' PyGithub
    wrapper), this function POSTs the issue via the GitHub API and
    returns the created issue URL.
    """
    if github_client is None:
        return {
            "mode": "draft-url",
            "url": draft.to_url(),
            "title": draft.title,
            "body_chars": len(draft.body),
            "labels": draft.labels,
        }
    # Cycle 2 swap site.
    return {
        "mode": "api-create",
        "url": "TODO: Hades PyGithub Cycle 2 ship",
        "title": draft.title,
    }


__all__ = [
    "GitHubIssueDraft",
    "create_github_issue",
    "draft_github_issue",
    "has_openspec_folder",
]
